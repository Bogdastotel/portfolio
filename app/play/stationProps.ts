import * as THREE from "three";

/**
 * A small diorama around each project's station, hinting at what the app is about.
 *
 * Everything is in station-local space: the plinth is at the origin (radius 2.6), +z is the side the screen faces
 * (towards the ring road, where the car parks) and -z is behind it. Props stay inside the ring (radius 8), behind
 * and beside the plinth (z <= 1.5), and under about 4 units tall so the screen and its label stay in view.
 *
 * Each scene has two layers. The first was laid out for a smaller ring and is moved outwards as it is built (see
 * `widen`). The second, inside `kit.outer(...)`, fills the room that opened up and is written in final coordinates.
 */

export type Solid = { x: number; z: number; r: number };
export type StationProps = {
  group: THREE.Group;
  /** Circles the car bumps into. */
  solids: Solid[];
  /** Balls the car can push around; the world creates them so they join its physics. */
  balls: (Solid & { color: number })[];
  /** Idle animation. `glow` is 0..1, how close the car is parked. */
  update?: (time: number, glow: number) => void;
};

type Paint = number | THREE.Material;
type Painter = (ctx: CanvasRenderingContext2D, width: number, height: number) => void;
type Built = { solids: Solid[]; balls?: StationProps["balls"]; update?: StationProps["update"] };
/** `south` is the turn that makes a prop face the camera, which always looks north whichever way the station faces. */
type Builder = (kit: Kit, light: number, south: number) => Built;
type Kit = ReturnType<typeof makeKit>;

const FONT = '"Space Grotesk Variable", "Inter Variable", system-ui, sans-serif';
const SKIN = [0xf0c8a0, 0xd9a273, 0xa8703f, 0x6f4526];
const DARK = 0x1b2430;
const STEEL = 0x8a94a6;
const WHITE = 0xf4f4f4;
const WOOD = 0x8a5a33;
const GOLD = 0xf2b632;
const UP = new THREE.Vector3(0, 1, 0);

function makeKit() {
  const root = new THREE.Group();
  let target: THREE.Object3D = root;
  const materials = new Map<number, THREE.MeshStandardMaterial>();
  const geometries = new Map<string, THREE.BufferGeometry>();

  const mat = (color: number) => {
    let material = materials.get(color);
    if (!material) {
      material = new THREE.MeshStandardMaterial({ color, roughness: 0.75, flatShading: true });
      materials.set(color, material);
    }
    return material;
  };
  /** A glowing material of its own, so its brightness can be animated. */
  const lit = (color: number, intensity = 0.9) =>
    new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: intensity, roughness: 0.5 });
  const geo = (key: string, make: () => THREE.BufferGeometry) => {
    let geometry = geometries.get(key);
    if (!geometry) {
      geometry = make();
      geometries.set(key, geometry);
    }
    return geometry;
  };
  /** The first layer's move outwards: the back row goes further back, the sides further out. */
  const widen = (x: number, z: number): [number, number] =>
    z < -2.5 ? [x, z - 1.4] : Math.abs(x) > 3 ? [x + Math.sign(x) * 1.2, z] : [x, z];
  let widening = true;
  const place = (x: number, z: number): [number, number] => (widening && target === root ? widen(x, z) : [x, z]);
  const outerSolids: Solid[] = [];
  const animations: NonNullable<StationProps["update"]>[] = [];
  /** Builds the second layer, which is already where it should be. */
  const outer = (build: () => void) => {
    widening = false;
    build();
    widening = true;
  };
  const solid = (x: number, z: number, r: number) => outerSolids.push({ x, z, r });
  const animate = (update: NonNullable<StationProps["update"]>) => animations.push(update);

  const put = <T extends THREE.Object3D>(object: T, x = 0, y = 0, z = 0) => {
    [x, z] = place(x, z);
    object.position.set(x, y, z);
    target.add(object);
    return object;
  };
  const mesh = (geometry: THREE.BufferGeometry, paint: Paint) =>
    new THREE.Mesh(geometry, typeof paint === "number" ? mat(paint) : paint);

  const box = (w: number, h: number, d: number, paint: Paint, x: number, y: number, z: number) =>
    put(
      mesh(
        geo(`box:${w}:${h}:${d}`, () => new THREE.BoxGeometry(w, h, d)),
        paint,
      ),
      x,
      y,
      z,
    );
  const cyl = (top: number, bottom: number, h: number, paint: Paint, x: number, y: number, z: number, sides = 12) =>
    put(
      mesh(
        geo(`cyl:${top}:${bottom}:${h}:${sides}`, () => new THREE.CylinderGeometry(top, bottom, h, sides)),
        paint,
      ),
      x,
      y,
      z,
    );
  const ball = (r: number, paint: Paint, x: number, y: number, z: number, detail = 1) =>
    put(
      mesh(
        geo(`ball:${r}:${detail}`, () => new THREE.IcosahedronGeometry(r, detail)),
        paint,
      ),
      x,
      y,
      z,
    );
  /** A bar between two points. */
  const rod = (from: [number, number, number], to: [number, number, number], r: number, paint: Paint) => {
    const a = new THREE.Vector3(...from);
    const b = new THREE.Vector3(...to);
    const length = a.distanceTo(b);
    const bar = mesh(new THREE.CylinderGeometry(r, r, length, 8), paint);
    bar.quaternion.setFromUnitVectors(UP, b.clone().sub(a).normalize());
    return put(bar, (a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2);
  };
  /** Builds into a group of its own, placed and turned as one. */
  const sub = (x: number, y: number, z: number, ry: number, build: () => void) => {
    const group = new THREE.Group();
    group.rotation.y = ry;
    put(group, x, y, z);
    const previous = target;
    target = group;
    build();
    target = previous;
    return group;
  };

  const paintTexture = (w: number, h: number, painter: Painter) => {
    const canvas = document.createElement("canvas");
    const density = Math.min(160, 1024 / Math.max(w, h));
    canvas.width = Math.round(w * density);
    canvas.height = Math.round(h * density);
    const ctx = canvas.getContext("2d");
    if (ctx) painter(ctx, canvas.width, canvas.height);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 4;
    return texture;
  };
  /** A painted panel, readable from both sides. With `posts` it stands on two legs. */
  const board = (w: number, h: number, painter: Painter, x: number, y: number, z: number, ry: number, posts = true) =>
    sub(x, y, z, ry, () => {
      box(w + 0.14, h + 0.14, 0.1, DARK, 0, 0, 0);
      const material = new THREE.MeshBasicMaterial({ map: paintTexture(w, h, painter) });
      const front = put(new THREE.Mesh(new THREE.PlaneGeometry(w, h), material), 0, 0, 0.052);
      const back = put(new THREE.Mesh(front.geometry, material), 0, 0, -0.052);
      back.rotation.y = Math.PI;
      front.userData.noShadow = back.userData.noShadow = true;
      if (posts) {
        const legLength = y - h / 2;
        for (const side of [-1, 1])
          cyl(0.06, 0.06, legLength, STEEL, side * (w / 2 - 0.2), -h / 2 - legLength / 2, 0, 8);
      }
    });
  /** Paint on the ground. */
  const decal = (w: number, d: number, painter: Painter, x: number, z: number, ry = 0) => {
    const geometry = new THREE.PlaneGeometry(w, d);
    geometry.rotateX(-Math.PI / 2);
    const material = new THREE.MeshStandardMaterial({
      map: paintTexture(w, d, painter),
      transparent: true,
      depthWrite: false,
      roughness: 1,
    });
    const plane = put(new THREE.Mesh(geometry, material), x, 0.03, z);
    plane.rotation.y = ry;
    plane.userData.noShadow = true;
    plane.receiveShadow = true;
    return plane;
  };

  const person = (shirt: number, x: number, z: number, ry = 0, size = 1, skin = 0, y = 0) => {
    const group = sub(x, y, z, ry, () => {
      put(
        mesh(
          geo("body", () => new THREE.CapsuleGeometry(0.24, 0.62, 3, 8)),
          shirt,
        ),
        0,
        0.55,
        0,
      );
      ball(0.21, SKIN[skin % SKIN.length], 0, 1.3, 0);
    });
    group.scale.setScalar(size);
    return group;
  };
  /** Many people in two draw calls. */
  const crowd = (people: [x: number, z: number, shirt: number, y?: number][], size = 1) => {
    const bodies = new THREE.InstancedMesh(
      new THREE.CapsuleGeometry(0.24, 0.62, 3, 8),
      new THREE.MeshStandardMaterial({ roughness: 0.75, flatShading: true }),
      people.length,
    );
    const heads = new THREE.InstancedMesh(
      new THREE.IcosahedronGeometry(0.21, 1),
      new THREE.MeshStandardMaterial({ roughness: 0.75, flatShading: true }),
      people.length,
    );
    const matrix = new THREE.Matrix4();
    const color = new THREE.Color();
    people.forEach(([px, pz, shirt, y = 0], i) => {
      const [x, z] = place(px, pz);
      matrix.makeScale(size, size, size).setPosition(x, y + 0.55 * size, z);
      bodies.setMatrixAt(i, matrix);
      bodies.setColorAt(i, color.setHex(shirt));
      matrix.setPosition(x, y + 1.3 * size, z);
      heads.setMatrixAt(i, matrix);
      heads.setColorAt(i, color.setHex(SKIN[(i * 7 + 1) % SKIN.length]));
    });
    put(bodies);
    put(heads);
  };

  const car = (color: number, x: number, z: number, ry: number) =>
    sub(x, 0, z, ry, () => {
      box(1.7, 0.42, 3.6, color, 0, 0.52, 0);
      box(1.45, 0.36, 1.7, DARK, 0, 0.9, -0.15);
      box(1.6, 0.06, 0.32, color, 0, 1.0, -1.66);
      for (const side of [-1, 1]) {
        box(0.08, 0.26, 0.08, DARK, side * 0.6, 0.85, -1.66);
        box(0.3, 0.12, 0.06, lit(0xfff2c2, 0.8), side * 0.55, 0.56, 1.81);
        for (const end of [-1, 1])
          cyl(0.34, 0.34, 0.28, 0x14171c, side * 0.86, 0.34, end * 1.1, 14).rotation.z = Math.PI / 2;
      }
    });
  const carSolids = (x: number, z: number, ry: number): Solid[] =>
    [-0.9, 0.9].map((along) => ({ x: x + Math.sin(ry) * along, z: z + Math.cos(ry) * along, r: 1 }));

  /** Two posts with a rope between them. */
  const rope = (x1: number, z1: number, x2: number, z2: number, postColor: number, ropeColor: number) => {
    for (const [x, z] of [
      [x1, z1],
      [x2, z2],
    ]) {
      cyl(0.07, 0.1, 1, postColor, x, 0.5, z, 8);
      ball(0.11, postColor, x, 1.05, z, 0);
    }
    rod([x1, 0.9, z1], [x2, 0.9, z2], 0.04, ropeColor);
  };

  /** A kiosk with a serving window and a sign on the roof. */
  const booth = (x: number, z: number, ry: number, color: number, text: string) =>
    sub(x, 0, z, ry, () => {
      box(1.3, 1.9, 1.1, color, 0, 0.95, 0);
      box(1.5, 0.14, 1.3, DARK, 0, 1.97, 0);
      box(0.9, 0.6, 0.05, DARK, 0, 1.3, 0.56);
      box(1.0, 0.08, 0.3, WHITE, 0, 0.95, 0.65);
      ball(0.19, SKIN[1], 0, 1.35, 0.5);
      board(1.3, 0.38, sign(text, "#0c0f14", "#ffffff"), 0, 2.3, 0, 0, false);
    });

  return {
    root,
    mat,
    lit,
    put,
    mesh,
    box,
    cyl,
    ball,
    rod,
    sub,
    board,
    decal,
    person,
    crowd,
    car,
    carSolids,
    rope,
    booth,
    widen,
    outer,
    solid,
    animate,
    outerSolids,
    animations,
  };
}

const heading = (ctx: CanvasRenderingContext2D, size: number, weight = 700) => {
  ctx.font = `${weight} ${size}px ${FONT}`;
  ctx.textBaseline = "middle";
};
const css = (color: number) => `#${color.toString(16).padStart(6, "0")}`;
/** A one-line sign. */
const sign =
  (text: string, background: string, color: string): Painter =>
  (ctx, w, h) => {
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, w, h);
    heading(ctx, h * 0.52);
    ctx.fillStyle = color;
    ctx.textAlign = "center";
    ctx.fillText(text, w / 2, h * 0.54, w * 0.88);
  };

// ------------------------------------------------------------------ dioramas

/** Action Network, sports betting: a strip of basketball court, a hoop and the odds. */
const actionNetwork: Builder = (kit, light, south) => {
  kit.decal(
    6.2,
    2.2,
    (ctx, w, h) => {
      ctx.fillStyle = "#c98a4b";
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = h * 0.03;
      ctx.strokeRect(ctx.lineWidth, ctx.lineWidth, w - ctx.lineWidth * 2, h - ctx.lineWidth * 2);
      // The key and free-throw circle, with the hoop at the left end.
      ctx.fillStyle = css(light);
      ctx.fillRect(0, h * 0.27, w * 0.34, h * 0.46);
      ctx.strokeRect(0, h * 0.27, w * 0.34, h * 0.46);
      ctx.beginPath();
      ctx.arc(w * 0.34, h / 2, h * 0.23, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(w * 0.08, h / 2, h * 1.05, -1.05, 1.05);
      ctx.stroke();
    },
    0,
    -4.1,
  );
  // The hoop stands at the left end of the court and faces along it.
  kit.cyl(0.11, 0.14, 3.3, STEEL, -2.95, 1.65, -4.1, 8);
  kit.rod([-2.95, 3.2, -4.1], [-2.5, 3.2, -4.1], 0.07, STEEL);
  kit.box(0.08, 1.05, 1.6, WHITE, -2.46, 3.15, -4.1);
  kit.box(0.09, 0.45, 0.6, 0xe2553d, -2.44, 2.95, -4.1);
  const rim = kit.put(kit.mesh(new THREE.TorusGeometry(0.4, 0.04, 6, 18), 0xff6a2a), -2.0, 2.72, -4.1);
  rim.rotation.x = Math.PI / 2;
  const net = kit.put(
    new THREE.Mesh(
      new THREE.CylinderGeometry(0.4, 0.26, 0.55, 10, 2, true),
      new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true }),
    ),
    -2.0,
    2.44,
    -4.1,
  );
  net.userData.noShadow = true;

  kit.board(
    2.3,
    1.35,
    (ctx, w, h) => {
      ctx.fillStyle = "#0c0f14";
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = css(light);
      ctx.fillRect(0, 0, w, h * 0.24);
      heading(ctx, h * 0.14);
      ctx.fillStyle = "#06150d";
      ctx.fillText("TONIGHT · LIVE ODDS", w * 0.06, h * 0.13);
      heading(ctx, h * 0.19);
      const rows = [
        ["LAL", "−3.5"],
        ["BOS", "+3.5"],
        ["O/U", "221.5"],
      ];
      rows.forEach(([team, line], i) => {
        const y = h * (0.4 + i * 0.22);
        ctx.fillStyle = "#fff";
        ctx.textAlign = "left";
        ctx.fillText(team, w * 0.08, y);
        ctx.fillStyle = i === 0 ? "#5ee39a" : "#cfd6e4";
        ctx.textAlign = "right";
        ctx.fillText(line, w * 0.92, y);
      });
    },
    4.35,
    1.75,
    -1.1,
    south,
  );

  kit.outer(() => {
    // Two players going for the ball, and the bench.
    kit.person(light, 0.4, -5.1, 2.2, 1.1, 2);
    kit.person(WHITE, 2.2, -6.0, -1.9, 1.1, 0);
    kit.sub(4.9, 0, -4.3, -0.9, () => {
      kit.box(2.2, 0.1, 0.5, WOOD, 0, 0.5, 0);
      for (const side of [-1, 1]) kit.box(0.1, 0.5, 0.45, DARK, side * 0.9, 0.25, 0);
      kit.person(light, -0.5, 0, 0, 1, 3, 0.25);
      kit.person(light, 0.35, 0, 0, 1, 1, 0.25);
      kit.box(0.5, 0.45, 0.4, 0xff7a1a, 1.55, 0.225, 0);
      kit.box(0.54, 0.08, 0.44, WHITE, 1.55, 0.48, 0);
    });
    kit.solid(4.9, -4.3, 1.0);
  });
  return {
    solids: [
      { x: -2.95, z: -4.1, r: 0.3 },
      { x: 4.35, z: -1.1, r: 0.9 },
    ],
    balls: [{ x: 1.3, z: -4.1, r: 0.42, color: 0xe07a2c }],
  };
};

/** DeepDays, car meets: show cars, a roped-off favourite and the people looking at it. */
const deepdays: Builder = (kit, light, south) => {
  kit.car(light, -4.5, -1.0, 0.35);
  kit.car(0x2f6fdf, 4.5, -1.0, -0.35);
  const star = kit.car(0xf2b632, 0, -4.6, Math.PI / 2);
  // Bonnet up on the star of the show.
  const bonnet = kit.box(1.5, 0.05, 0.9, 0xf2b632, 0, 1.0, 1.05);
  bonnet.rotation.x = -0.9;
  star.add(bonnet);

  kit.rope(-1.9, -3.5, 1.9, -3.5, 0xd8dbe2, 0xb3261e);
  const shirts = [0xe2553d, 0x2f9e8f, 0xf4f4f4, 0x5b7cfa, 0xf2b632, 0x7c5cff, 0x12b5a6, 0xff7a59];
  const spots: [number, number][] = [
    [-1.1, -3.05],
    [-0.2, -2.95],
    [0.8, -3.05],
    [-2.5, -3.3],
    [-3.1, -4.2],
    [2.5, -3.3],
    [3.1, -4.2],
    [-1.5, -5.65],
    [-0.5, -5.75],
    [0.5, -5.75],
    [1.5, -5.65],
    [-2.6, -2.2],
    [2.7, -2.3],
  ];
  kit.crowd(spots.map(([x, z], i) => [x, z, shirts[i % shirts.length]]));

  const flags: THREE.Mesh[] = [];
  for (const side of [-1, 1]) {
    kit.cyl(0.05, 0.07, 3.7, STEEL, side * 5.6, 1.85, 1.1, 8);
    flags.push(kit.box(1.1, 0.6, 0.04, side < 0 ? light : 0x14171c, side * 5.6 + 0.58, 3.3, 1.1));
  }

  kit.outer(() => {
    // The way in: a banner, a ticket booth and a stack of tyres.
    kit.board(1.9, 0.7, sign("CAR MEET", css(light), "#ffffff"), -5.0, 3.0, -3.9, south);
    kit.solid(-5.0, -3.9, 0.8);
    kit.booth(4.9, -4.2, south, light, "TICKETS");
    kit.solid(4.9, -4.2, 0.9);
    for (let tyre = 0; tyre < 3; tyre++) kit.cyl(0.42, 0.42, 0.27, 0x14171c, 3.7, 0.14 + tyre * 0.28, -3.2, 14);
    kit.solid(3.7, -3.2, 0.45);
  });
  return {
    solids: [
      ...kit.carSolids(-4.5, -1.0, 0.35),
      ...kit.carSolids(4.5, -1.0, -0.35),
      { x: -0.9, z: -4.5, r: 1.3 },
      { x: 0.9, z: -4.5, r: 1.3 },
      { x: -2.9, z: -3.7, r: 0.7 },
      { x: 2.9, z: -3.7, r: 0.7 },
      { x: -5.6, z: 1.1, r: 0.2 },
      { x: 5.6, z: 1.1, r: 0.2 },
    ],
    update: (time) => flags.forEach((flag, i) => (flag.rotation.y = Math.sin(time * 2.2 + i) * 0.25)),
  };
};

/** Svenska Fans, football news and live scores: a goal, a ball, the score and a stand of supporters. */
const svenskaFans: Builder = (kit, light, south) => {
  kit.decal(
    6.2,
    2.2,
    (ctx, w, h) => {
      for (let stripe = 0; stripe < 6; stripe++) {
        ctx.fillStyle = stripe % 2 ? "#2f8f4a" : "#2a8143";
        ctx.fillRect((stripe * w) / 6, 0, w / 6 + 1, h);
      }
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = h * 0.03;
      ctx.strokeRect(ctx.lineWidth, ctx.lineWidth, w - ctx.lineWidth * 2, h - ctx.lineWidth * 2);
      ctx.strokeRect(0, h * 0.2, w * 0.24, h * 0.6);
      ctx.beginPath();
      ctx.arc(w * 0.62, h / 2, h * 0.3, 0, Math.PI * 2);
      ctx.moveTo(w * 0.62, 0);
      ctx.lineTo(w * 0.62, h);
      ctx.stroke();
    },
    0,
    -4.1,
  );
  // Goal at the left end, its mouth facing along the pitch.
  for (const side of [-1, 1]) {
    kit.cyl(0.06, 0.06, 1.5, WHITE, -2.9, 0.75, -4.1 + side * 0.9, 8);
    kit.rod([-2.9, 1.5, -4.1 + side * 0.9], [-3.6, 0.05, -4.1 + side * 0.9], 0.035, WHITE);
  }
  kit.rod([-2.9, 1.5, -5.0], [-2.9, 1.5, -3.2], 0.06, WHITE);
  const net = kit.put(
    new THREE.Mesh(
      new THREE.PlaneGeometry(1.8, 1.62, 9, 7),
      new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true, side: THREE.DoubleSide }),
    ),
    -3.25,
    0.77,
    -4.1,
  );
  net.rotation.set(0, Math.PI / 2, 0);
  net.rotateX(-0.45);
  net.userData.noShadow = true;

  kit.board(
    2.4,
    1.3,
    (ctx, w, h) => {
      ctx.fillStyle = "#0c0f14";
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = "#e23d3d";
      ctx.beginPath();
      ctx.arc(w * 0.1, h * 0.17, h * 0.05, 0, Math.PI * 2);
      ctx.fill();
      heading(ctx, h * 0.14);
      ctx.fillStyle = "#fff";
      ctx.fillText("LIVE", w * 0.16, h * 0.18);
      ctx.textAlign = "right";
      ctx.fillStyle = css(light);
      ctx.fillText("67'", w * 0.93, h * 0.18);
      heading(ctx, h * 0.4);
      ctx.textAlign = "center";
      ctx.fillStyle = "#fff";
      ctx.fillText("2 – 1", w / 2, h * 0.55);
      heading(ctx, h * 0.15);
      ctx.fillStyle = css(light);
      ctx.fillText("SVE", w * 0.14, h * 0.55);
      ctx.fillText("NOR", w * 0.86, h * 0.55);
      heading(ctx, h * 0.1, 500);
      ctx.fillStyle = "#9aa3b2";
      ctx.fillText("⚽ 12'  ⚽ 54'      ⚽ 31'", w / 2, h * 0.87);
    },
    -4.6,
    1.75,
    -0.7,
    south,
  );

  // A two-step stand on the other side, turned towards the pitch.
  const yellow = 0xf2c230;
  const blue = 0x1f5fbf;
  kit.sub(4.6, 0, -0.7, -2.0, () => {
    kit.box(2.4, 0.4, 0.8, STEEL, 0, 0.2, 0.4);
    kit.box(2.4, 0.8, 0.8, STEEL, 0, 0.4, -0.4);
    kit.crowd([
      [-0.8, 0.4, yellow, 0.4],
      [0, 0.4, blue, 0.4],
      [0.8, 0.4, yellow, 0.4],
      [-0.8, -0.4, blue, 0.8],
      [0, -0.4, yellow, 0.8],
      [0.8, -0.4, blue, 0.8],
    ]);
    // Scarves held up along the back row.
    kit.box(2.2, 0.16, 0.05, yellow, 0, 2.45, -0.4);
    kit.box(0.5, 0.17, 0.06, blue, -0.6, 2.45, -0.4);
    kit.box(0.5, 0.17, 0.06, blue, 0.6, 2.45, -0.4);
  });

  kit.outer(() => {
    // A second goal makes it a pitch, with players, corner flags and a floodlight.
    for (const side of [-1, 1]) {
      kit.cyl(0.06, 0.06, 1.5, WHITE, 2.9, 0.75, -5.5 + side * 0.9, 8);
      kit.rod([2.9, 1.5, -5.5 + side * 0.9], [3.6, 0.05, -5.5 + side * 0.9], 0.035, WHITE);
      kit.solid(2.9, -5.5 + side * 0.9, 0.2);
    }
    kit.rod([2.9, 1.5, -6.4], [2.9, 1.5, -4.6], 0.06, WHITE);
    const net = kit.put(
      new THREE.Mesh(
        new THREE.PlaneGeometry(1.8, 1.62, 9, 7),
        new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true, side: THREE.DoubleSide }),
      ),
      3.25,
      0.77,
      -5.5,
    );
    net.rotation.set(0, -Math.PI / 2, 0);
    net.rotateX(-0.45);
    net.userData.noShadow = true;
    kit.crowd([
      [-2.4, -5.4, 0xff7a59],
      [-1.2, -5.0, 0xf2c230],
      [0.1, -6.1, 0x1f5fbf],
      [1.6, -4.9, 0x1f5fbf],
      [1.3, -6.0, 0xf2c230],
      [2.4, -5.6, 0x3fd17a],
    ]);
    for (const x of [-3.1, 3.1])
      for (const z of [-4.4, -6.6]) {
        kit.cyl(0.025, 0.025, 1, WHITE, x, 0.5, z, 6);
        kit.box(0.28, 0.2, 0.02, light, x + 0.15, 0.9, z);
      }
    kit.cyl(0.08, 0.12, 4.2, STEEL, -5.0, 2.1, -4.2, 8);
    kit.box(1.0, 0.5, 0.2, DARK, -5.0, 4.2, -4.2).rotation.set(0.5, south, 0, "YXZ");
    kit.box(0.86, 0.38, 0.06, kit.lit(0xfff6d6, 1.2), -5.0, 4.17, -4.2).rotation.set(0.5, south, 0, "YXZ");
    kit.solid(-5.0, -4.2, 0.25);
  });
  return {
    solids: [
      { x: -2.9, z: -3.2, r: 0.2 },
      { x: -2.9, z: -5.0, r: 0.2 },
      { x: -4.6, z: -0.7, r: 0.9 },
      { x: 4.3, z: -0.2, r: 0.9 },
      { x: 5.0, z: -1.3, r: 0.9 },
    ],
    balls: [{ x: 0.8, z: -4.1, r: 0.33, color: 0xf4f4f4 }],
  };
};

/** VI Appen, guidance for couples and parents: a family on a park bench. */
const viAppen: Builder = (kit, light, south) => {
  // The bench faces whoever is watching.
  kit.sub(0, 0, -4.5, south, () => {
    kit.box(2.7, 0.12, 0.65, WOOD, 0, 0.55, 0);
    kit.box(2.7, 0.65, 0.1, WOOD, 0, 1.05, -0.35);
    for (const side of [-1, 1]) kit.box(0.12, 0.55, 0.6, DARK, side * 1.15, 0.275, 0);
    kit.person(light, -0.55, 0, 0, 1, 1, 0.3);
    kit.person(0xff7a59, 0.15, 0, 0, 1, 2, 0.3);
  });
  kit.person(0xf2b632, 1.75, -3.7, -0.3, 0.6, 1);

  // Pram.
  kit.sub(-2.6, 0, -3.7, 0.5, () => {
    kit.box(0.7, 0.45, 1.0, light, 0, 0.75, 0);
    kit.box(0.72, 0.4, 0.5, DARK, 0, 1.1, -0.26);
    kit.rod([0, 0.95, 0.5], [0, 1.35, 0.85], 0.035, STEEL);
    for (const side of [-1, 1])
      for (const end of [-1, 1])
        kit.cyl(0.18, 0.18, 0.08, DARK, side * 0.38, 0.18, end * 0.38).rotation.z = Math.PI / 2;
  });

  // A tree, a street lamp and some toy blocks.
  kit.cyl(0.16, 0.22, 1.3, WOOD, 4.1, 0.65, -2.9, 8);
  kit.ball(1.05, 0x3f9e5a, 4.1, 2.1, -2.9);
  kit.ball(0.7, 0x4fb36b, 4.5, 2.8, -2.7);
  kit.cyl(0.06, 0.09, 2.9, DARK, -4.8, 1.45, -0.8, 8);
  const lamp = kit.lit(0xffe9a8, 0.9);
  kit.ball(0.26, lamp, -4.8, 3.0, -0.8);
  kit.box(0.45, 0.45, 0.45, 0xe2553d, 4.3, 0.225, 0.2).rotation.y = 0.4;
  kit.box(0.45, 0.45, 0.45, 0x5b7cfa, 4.85, 0.225, -0.15).rotation.y = -0.2;
  kit.box(0.45, 0.45, 0.45, 0xf2b632, 4.55, 0.675, 0.05).rotation.y = 0.9;

  const shape = new THREE.Shape();
  shape.moveTo(0, -0.5);
  shape.bezierCurveTo(-0.95, 0.1, -0.5, 0.8, 0, 0.3);
  shape.bezierCurveTo(0.5, 0.8, 0.95, 0.1, 0, -0.5);
  const heartGeometry = new THREE.ExtrudeGeometry(shape, { depth: 0.22, bevelEnabled: false });
  heartGeometry.center();
  const heart = kit.put(new THREE.Mesh(heartGeometry, kit.lit(0xff5f7e, 0.6)), -0.2, 3.1, -4.4);

  kit.outer(() => {
    // A playground: swings and a slide, and a picnic in front of the bench.
    let swing = new THREE.Group();
    kit.sub(-4.9, 0, -3.6, 0.94, () => {
      kit.rod([-1.15, 2.3, 0], [1.15, 2.3, 0], 0.06, light);
      for (const side of [-1, 1])
        for (const foot of [-0.6, 0.6]) kit.rod([side * 1.15, 2.3, 0], [side * 1.15, 0, foot], 0.05, light);
      swing = kit.sub(-0.5, 2.3, 0, 0, () => {
        for (const side of [-1, 1]) kit.rod([side * 0.2, 0, 0], [side * 0.2, -1.7, 0], 0.015, STEEL);
        kit.box(0.5, 0.06, 0.25, WOOD, 0, -1.7, 0);
        kit.person(0xf2b632, 0, 0, 0, 0.6, 2, -1.75);
      });
      for (const side of [-1, 1]) kit.rod([0.5 + side * 0.2, 2.3, 0], [0.5 + side * 0.2, 0.6, 0], 0.015, STEEL);
      kit.box(0.5, 0.06, 0.25, WOOD, 0.5, 0.6, 0);
    });
    kit.solid(-4.9, -3.6, 1.0);
    kit.animate((time) => (swing.rotation.x = Math.sin(time * 2.2) * 0.45));

    kit.sub(5.5, 0, -2.3, 0, () => {
      kit.box(0.8, 0.1, 0.8, 0xe2553d, 0, 1.3, -0.75);
      for (const side of [-1, 1])
        for (const end of [-1.1, -0.4]) kit.cyl(0.04, 0.04, 1.3, STEEL, side * 0.36, 0.65, end, 6);
      for (const step of [0.35, 0.7, 1.05]) kit.box(0.7, 0.05, 0.08, STEEL, 0, step, -1.12);
      kit.box(0.7, 0.07, 2.2, 0xf2b632, 0, 0.7, 0.5).rotation.x = 0.58;
    });
    kit.solid(5.5, -2.6, 0.85);

    kit.decal(
      2.2,
      1.5,
      (ctx, w, h) => {
        ctx.fillStyle = "#f4f4f4";
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = "rgba(226, 85, 61, 0.55)";
        for (let stripe = 0; stripe < 8; stripe += 2) {
          ctx.fillRect((stripe * w) / 8, 0, w / 8, h);
          ctx.fillRect(0, (stripe * h) / 8, w, h / 8);
        }
      },
      0,
      -3.9,
      0.15,
    );
    kit.box(0.5, 0.3, 0.35, WOOD, 0.55, 0.15, -3.9);
    kit.put(kit.mesh(new THREE.TorusGeometry(0.2, 0.025, 6, 12, Math.PI), WOOD), 0.55, 0.3, -3.9);
    kit.ball(0.12, 0xe23d3d, -0.3, 0.12, -3.7);
    kit.cyl(0.07, 0.07, 0.3, 0x5fb04a, -0.55, 0.15, -4.1, 8);
  });
  return {
    solids: [
      { x: -0.75, z: -4.5, r: 0.75 },
      { x: 0.75, z: -4.5, r: 0.75 },
      { x: -2.6, z: -3.7, r: 0.6 },
      { x: 4.1, z: -2.9, r: 0.4 },
      { x: -4.8, z: -0.8, r: 0.2 },
      { x: 4.55, z: 0.05, r: 0.5 },
    ],
    update: (time, glow) => {
      heart.position.y = 3.1 + Math.sin(time * 1.8) * 0.15;
      heart.rotation.y = Math.sin(time * 0.9) * 0.6;
      heart.scale.setScalar(1 + glow * 0.25 + Math.max(0, Math.sin(time * 5)) * 0.06);
    },
  };
};

/** Scoops, recipes from chefs: a kitchen counter with something on the stove. */
const scoops: Builder = (kit, light, south) => {
  kit.box(3.4, 0.9, 0.9, WHITE, 0, 0.45, -4.3);
  kit.box(3.5, 0.08, 1.0, DARK, 0, 0.94, -4.3);
  // Pot, pan and chopping board.
  kit.cyl(0.36, 0.33, 0.42, STEEL, -1.0, 1.19, -4.3, 14);
  kit.cyl(0.38, 0.38, 0.05, 0x6d7686, -1.0, 1.42, -4.3, 14);
  kit.ball(0.07, DARK, -1.0, 1.49, -4.3, 0);
  kit.cyl(0.36, 0.3, 0.1, 0x14171c, 0.05, 1.03, -4.25, 14);
  kit.rod([0.35, 1.05, -4.25], [0.95, 1.1, -3.95], 0.04, 0x14171c);
  kit.ball(0.12, 0xf7e7a1, 0.0, 1.1, -4.25, 0).scale.y = 0.4;
  kit.box(0.75, 0.05, 0.5, WOOD, 1.25, 1.0, -4.3);
  kit.ball(0.13, 0xe23d3d, 1.1, 1.14, -4.25);
  kit.ball(0.13, 0xe23d3d, 1.4, 1.14, -4.35);
  kit.box(0.5, 0.04, 0.05, STEEL, 1.3, 1.04, -4.1);

  // The chef, behind the counter.
  kit.person(WHITE, 0, -5.2, 0, 1.1, 1);
  kit.cyl(0.19, 0.17, 0.26, WHITE, 0, 1.75, -5.2, 10);
  kit.ball(0.26, WHITE, 0, 1.95, -5.2);

  // A crate of vegetables.
  kit.sub(-4.3, 0, -1.6, 0.4, () => {
    kit.box(1.3, 0.5, 0.9, WOOD, 0, 0.25, 0);
    const colors = [0xe23d3d, 0x5fb04a, 0xff9a2e, 0x5fb04a, 0xe23d3d, 0xf2c230];
    colors.forEach((color, i) => kit.ball(0.2, color, -0.42 + (i % 3) * 0.42, 0.6, -0.2 + Math.floor(i / 3) * 0.4));
    kit.cyl(0.07, 0.03, 0.6, 0xff9a2e, 0.55, 0.7, 0.1, 6).rotation.z = -1.1;
  });

  // A giant spoon and fork, crossed like a restaurant sign.
  kit.sub(4.4, 0, -1.7, -0.9, () => {
    const spoon = kit.sub(-0.3, 0, 0, 0, () => {
      kit.cyl(0.07, 0.09, 2.2, STEEL, 0, 1.1, 0, 8);
      kit.ball(0.42, light, 0, 2.5, 0).scale.set(1, 1.25, 0.35);
    });
    spoon.rotation.z = -0.22;
    const fork = kit.sub(0.3, 0, 0, 0, () => {
      kit.cyl(0.07, 0.09, 2.1, STEEL, 0, 1.05, 0, 8);
      kit.box(0.62, 0.14, 0.1, STEEL, 0, 2.15, 0);
      for (const tine of [-0.25, 0, 0.25]) kit.box(0.09, 0.7, 0.09, STEEL, tine, 2.55, 0);
    });
    fork.rotation.z = 0.22;
  });

  const [potX, potZ] = kit.widen(-1.0, -4.3);
  const steam = [0, 1, 2].map(() => {
    const puff = kit.ball(
      0.14,
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, depthWrite: false }),
      -1.0,
      1.6,
      -4.3,
    );
    puff.userData.noShadow = true;
    return puff;
  });

  kit.outer(() => {
    // The restaurant: a table with two guests, the menu and a stone oven.
    kit.sub(-0.3, 0, -3.9, 0, () => {
      kit.cyl(0.75, 0.75, 0.07, WHITE, 0, 0.9, 0, 18);
      kit.cyl(0.07, 0.07, 0.86, DARK, 0, 0.45, 0, 8);
      kit.cyl(0.4, 0.45, 0.05, DARK, 0, 0.03, 0, 12);
      for (const side of [-1, 1]) {
        kit.cyl(0.24, 0.2, 0.03, 0xdfe6f5, side * 0.38, 0.95, 0, 14);
        kit.ball(0.11, side < 0 ? 0xff9a2e : 0x5fb04a, side * 0.38, 1.0, 0).scale.y = 0.6;
      }
      kit.person(0x5b7cfa, -1.1, 0, Math.PI / 2, 1, 0);
      kit.person(light, 1.1, 0, -Math.PI / 2, 1, 3);
    });
    kit.solid(-0.3, -3.9, 0.9);

    kit.board(
      1.3,
      1.7,
      (ctx, w, h) => {
        ctx.fillStyle = "#1d2420";
        ctx.fillRect(0, 0, w, h);
        heading(ctx, h * 0.11);
        ctx.fillStyle = "#ffffff";
        ctx.textAlign = "center";
        ctx.fillText("MENU", w / 2, h * 0.12);
        heading(ctx, h * 0.065, 500);
        const dishes = [
          ["Pasta", "12"],
          ["Risotto", "14"],
          ["Tacos", "11"],
          ["Ramen", "13"],
          ["Tiramisu", "7"],
        ];
        dishes.forEach(([dish, price], i) => {
          const y = h * (0.3 + i * 0.13);
          ctx.fillStyle = "#e8e2cf";
          ctx.textAlign = "left";
          ctx.fillText(dish, w * 0.1, y);
          ctx.fillStyle = css(light);
          ctx.textAlign = "right";
          ctx.fillText(price, w * 0.9, y);
        });
      },
      -4.8,
      1.45,
      -4.3,
      south,
    );
    kit.solid(-4.8, -4.3, 0.7);

    const fire = kit.lit(0xff8a2a, 1.2);
    kit.sub(4.8, 0, -4.3, south, () => {
      kit.box(1.5, 0.7, 1.3, 0x8d8478, 0, 0.35, 0);
      kit.ball(0.75, 0xb5533c, 0, 0.7, 0, 2).scale.y = 0.85;
      kit.box(0.6, 0.36, 0.12, fire, 0, 0.9, 0.66);
      kit.box(0.7, 0.08, 0.14, 0x8d8478, 0, 1.12, 0.66);
      kit.cyl(0.12, 0.14, 0.7, 0x8d8478, 0, 1.6, -0.3, 8);
    });
    kit.solid(4.8, -4.3, 1.0);
    kit.animate((time) => (fire.emissiveIntensity = 1.1 + Math.sin(time * 11) * 0.2 + Math.sin(time * 5.3) * 0.2));
  });
  return {
    solids: [
      { x: -1.0, z: -4.5, r: 0.95 },
      { x: 1.0, z: -4.5, r: 0.95 },
      { x: -4.3, z: -1.6, r: 0.8 },
      { x: 4.4, z: -1.7, r: 0.6 },
    ],
    update: (time) =>
      steam.forEach((puff, i) => {
        const rise = (time * 0.45 + i / 3) % 1;
        puff.position.set(potX + Math.sin(time * 2 + i * 2) * 0.1, 1.6 + rise * 1.1, potZ);
        puff.scale.setScalar(0.6 + rise);
        (puff.material as THREE.MeshBasicMaterial).opacity = 0.55 * (1 - rise);
      }),
  };
};

/** Brava, video job applications: a candidate being filmed in front of a backdrop. */
const brava: Builder = (kit, light, south) => {
  // Backdrop and the candidate on a stool.
  kit.box(0.1, 2.5, 2.2, light, 2.1, 1.25, -4.4);
  kit.box(0.5, 0.06, 2.4, DARK, 2.1, 0.03, -4.4);
  kit.cyl(0.26, 0.26, 0.08, DARK, 0.9, 0.6, -4.4);
  kit.cyl(0.04, 0.04, 0.6, STEEL, 0.9, 0.3, -4.4, 6);
  kit.person(0xf2b632, 0.9, -4.4, -Math.PI / 2, 1, 2, 0.45);

  // Camera on a tripod, pointing at them.
  for (const [dx, dz] of [
    [-0.45, 0],
    [0.25, 0.4],
    [0.25, -0.4],
  ])
    kit.rod([-2.9 + dx, 0, -4.4 + dz], [-2.9, 1.45, -4.4], 0.04, DARK);
  kit.box(0.95, 0.55, 0.5, 0x14171c, -2.9, 1.75, -4.4);
  kit.cyl(0.2, 0.24, 0.45, DARK, -2.25, 1.75, -4.4).rotation.z = Math.PI / 2;
  kit.cyl(0.24, 0.24, 0.12, DARK, -3.1, 2.25, -4.4).rotation.x = Math.PI / 2;
  kit.cyl(0.24, 0.24, 0.12, DARK, -2.6, 2.25, -4.4).rotation.x = Math.PI / 2;
  const recording = kit.lit(0xff2d2d, 1);
  kit.ball(0.07, recording, -2.5, 2.0, -4.12, 0);

  // A studio light.
  kit.cyl(0.05, 0.07, 2.6, STEEL, -1.0, 1.3, -5.5, 8);
  const lamp = kit.sub(-1.0, 2.7, -5.5, 0.7, () => {
    kit.box(0.7, 0.7, 0.3, DARK, 0, 0, 0);
    kit.box(0.58, 0.58, 0.04, kit.lit(0xfff2c2, 1), 0, 0, 0.16);
  });
  lamp.rotation.x = 0.35;

  // Clapperboard, director's chair and a briefcase.
  kit.sub(-4.5, 0, -0.8, 0.9, () => {
    const slate = kit.sub(0, 0, 0, 0, () => {
      kit.box(1.1, 0.8, 0.07, 0x14171c, 0, 0.4, 0);
      for (const line of [0.25, 0.45]) kit.box(0.9, 0.03, 0.08, WHITE, 0, line, 0);
      const arm = kit.sub(-0.55, 0.86, 0, 0, () => {
        kit.box(1.1, 0.14, 0.07, 0x14171c, 0.55, 0, 0);
        for (const stripe of [0.15, 0.45, 0.75, 1.0]) kit.box(0.12, 0.15, 0.08, WHITE, stripe, 0, 0).rotation.z = 0.5;
      });
      arm.rotation.z = 0.35;
    });
    slate.rotation.x = -0.3;
  });
  kit.sub(4.3, 0, -2.3, -0.8, () => {
    kit.box(0.85, 0.06, 0.7, light, 0, 0.75, 0);
    kit.box(0.85, 0.35, 0.05, light, 0, 1.4, -0.35);
    for (const side of [-1, 1]) {
      kit.rod([side * 0.42, 0, 0.35], [side * 0.42, 0.9, -0.35], 0.035, WOOD);
      kit.rod([side * 0.42, 0, -0.35], [side * 0.42, 0.9, 0.35], 0.035, WOOD);
      kit.rod([side * 0.42, 0.75, -0.35], [side * 0.42, 1.6, -0.35], 0.035, WOOD);
      kit.box(0.07, 0.05, 0.7, WOOD, side * 0.42, 0.95, 0);
    }
  });
  kit.sub(4.5, 0, -0.5, 0.5, () => {
    kit.box(0.95, 0.62, 0.26, 0x6b4526, 0, 0.31, 0);
    kit.box(0.97, 0.06, 0.28, GOLD, 0, 0.42, 0);
    kit.put(kit.mesh(new THREE.TorusGeometry(0.14, 0.03, 6, 12, Math.PI), DARK), 0, 0.62, 0);
  });

  kit.outer(() => {
    // The other side of the app: a recruiter at a desk, the swipe cards and the list of jobs.
    kit.sub(-4.9, 0, -3.9, south, () => {
      kit.box(1.6, 0.08, 0.8, WOOD, 0, 0.78, 0);
      for (const side of [-1, 1]) kit.box(0.08, 0.74, 0.7, DARK, side * 0.7, 0.37, 0);
      kit.box(0.5, 0.03, 0.35, STEEL, 0, 0.84, 0);
      kit.box(0.5, 0.34, 0.03, kit.lit(light, 0.8), 0, 1.0, -0.2).rotation.x = -0.2;
      kit.person(0x2f9e8f, 0, -0.7, 0, 1, 3);
    });
    kit.solid(-4.9, -3.9, 1.0);

    const card =
      (mark: string, color: string): Painter =>
      (ctx, w, h) => {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = "#d9dee8";
        ctx.fillRect(w * 0.1, h * 0.07, w * 0.8, h * 0.42);
        ctx.fillStyle = "#9aa3b2";
        ctx.beginPath();
        ctx.arc(w / 2, h * 0.23, h * 0.08, 0, Math.PI * 2);
        ctx.arc(w / 2, h * 0.49, h * 0.16, Math.PI, 0);
        ctx.fill();
        heading(ctx, h * 0.34);
        ctx.fillStyle = color;
        ctx.textAlign = "center";
        ctx.fillText(mark, w / 2, h * 0.75);
      };
    kit.board(0.9, 1.2, card("✕", "#e23d3d"), -1.1, 1.3, -3.8, south).rotateZ(0.12);
    kit.board(0.9, 1.2, card("✓", "#1f9d55"), 1.1, 1.3, -3.8, south).rotateZ(-0.12);
    kit.solid(-1.1, -3.8, 0.45);
    kit.solid(1.1, -3.8, 0.45);

    kit.board(
      1.5,
      1.8,
      (ctx, w, h) => {
        ctx.fillStyle = "#0c0f14";
        ctx.fillRect(0, 0, w, h);
        heading(ctx, h * 0.09);
        ctx.fillStyle = css(light);
        ctx.fillText("OPEN ROLES", w * 0.08, h * 0.09);
        ["Barista", "Chef", "Driver", "Designer"].forEach((role, i) => {
          const y = h * (0.2 + i * 0.195);
          ctx.fillStyle = "#1c2330";
          ctx.fillRect(w * 0.08, y, w * 0.84, h * 0.16);
          ctx.fillStyle = css(light);
          ctx.fillRect(w * 0.12, y + h * 0.03, h * 0.1, h * 0.1);
          heading(ctx, h * 0.07);
          ctx.fillStyle = "#ffffff";
          ctx.fillText(role, w * 0.12 + h * 0.14, y + h * 0.085);
        });
      },
      4.8,
      1.5,
      -4.5,
      south,
    );
    kit.solid(4.8, -4.5, 0.8);
  });
  return {
    solids: [
      { x: 2.0, z: -4.4, r: 1.0 },
      { x: 0.9, z: -4.4, r: 0.5 },
      { x: -2.9, z: -4.4, r: 0.6 },
      { x: -1.0, z: -5.5, r: 0.3 },
      { x: -4.5, z: -0.8, r: 0.6 },
      { x: 4.3, z: -2.3, r: 0.6 },
      { x: 4.5, z: -0.5, r: 0.5 },
    ],
    update: (time) => {
      recording.emissiveIntensity = time % 1.2 < 0.7 ? 1.4 : 0.05;
    },
  };
};

/** Dark Stories, mystery riddles: a graveyard, a chalk outline and one big question. */
const darkStories: Builder = (kit, light, south) => {
  const stone = 0x7d8594;
  const graves: [number, number, number, number][] = [
    [-4.3, -1.2, 0.5, 1],
    [-3.5, -3.3, 0.2, 0.85],
    [-1.6, -4.8, -0.1, 1.1],
    [-4.9, -2.6, 0.7, 0.7],
  ];
  for (const [x, z, ry, size] of graves) {
    const grave = kit.sub(x, 0, z, ry, () => {
      kit.box(0.8, 0.9, 0.22, stone, 0, 0.45, 0);
      kit.cyl(0.4, 0.4, 0.22, stone, 0, 0.9, 0, 14).rotation.x = Math.PI / 2;
      kit.box(1.0, 0.12, 0.45, 0x5d6573, 0, 0.06, 0);
      kit.box(0.36, 0.06, 0.03, 0x4a515d, 0, 0.75, 0.115);
      kit.box(0.06, 0.4, 0.03, 0x4a515d, 0, 0.72, 0.115);
    });
    grave.scale.setScalar(size);
    grave.rotation.z = (ry - 0.2) * 0.12;
  }

  // A bare tree.
  const bark = 0x3a2d28;
  kit.cyl(0.12, 0.26, 2.4, bark, 3.6, 1.2, -3.8, 7);
  kit.rod([3.6, 1.6, -3.8], [4.6, 2.9, -3.4], 0.07, bark);
  kit.rod([4.2, 2.4, -3.55], [4.1, 3.3, -3.1], 0.04, bark);
  kit.rod([3.6, 2.0, -3.8], [2.7, 3.1, -4.2], 0.07, bark);
  kit.rod([3.05, 2.65, -4.05], [2.6, 2.7, -3.3], 0.04, bark);
  kit.rod([3.6, 2.4, -3.8], [3.8, 3.7, -4.3], 0.06, bark);

  // A lantern on a hook.
  kit.cyl(0.05, 0.07, 2.0, DARK, 4.6, 1.0, -0.7, 8);
  kit.rod([4.6, 2.0, -0.7], [4.15, 2.0, -0.7], 0.04, DARK);
  kit.box(0.34, 0.08, 0.34, DARK, 4.15, 1.85, -0.7);
  kit.box(0.34, 0.08, 0.34, DARK, 4.15, 1.35, -0.7);
  const flame = kit.lit(0xffc45a, 1.2);
  kit.box(0.26, 0.42, 0.26, flame, 4.15, 1.6, -0.7);

  // Chalk outline on the ground.
  kit.decal(
    2.6,
    1.7,
    (ctx, w, h) => {
      ctx.strokeStyle = "rgba(255,255,255,0.9)";
      ctx.lineWidth = h * 0.035;
      ctx.lineJoin = ctx.lineCap = "round";
      ctx.setLineDash([h * 0.09, h * 0.035]);
      const u = w / 100;
      const v = h / 100;
      ctx.beginPath();
      ctx.arc(14 * u, 46 * v, 11 * v, 0, Math.PI * 2);
      ctx.moveTo(22 * u, 40 * v);
      ctx.lineTo(40 * u, 30 * v);
      ctx.lineTo(48 * u, 6 * v);
      ctx.lineTo(55 * u, 8 * v);
      ctx.lineTo(52 * u, 34 * v);
      ctx.lineTo(70 * u, 30 * v);
      ctx.lineTo(96 * u, 12 * v);
      ctx.lineTo(98 * u, 24 * v);
      ctx.lineTo(74 * u, 50 * v);
      ctx.lineTo(97 * u, 78 * v);
      ctx.lineTo(90 * u, 88 * v);
      ctx.lineTo(66 * u, 66 * v);
      ctx.lineTo(50 * u, 66 * v);
      ctx.lineTo(44 * u, 94 * v);
      ctx.lineTo(36 * u, 92 * v);
      ctx.lineTo(38 * u, 62 * v);
      ctx.lineTo(22 * u, 54 * v);
      ctx.stroke();
    },
    0.9,
    -4.4,
    0.15,
  );

  // The question, turning slowly above it.
  const glow = kit.lit(light, 0.8);
  const question = kit.sub(0.9, 2.4, -4.4, 0, () => {
    const hook = kit.put(kit.mesh(new THREE.TorusGeometry(0.45, 0.13, 8, 18, Math.PI * 1.5), glow), 0, 0.55, 0);
    hook.rotation.z = -Math.PI / 2;
    kit.cyl(0.13, 0.13, 0.5, glow, 0, -0.12, 0, 8);
    kit.ball(0.17, glow, 0, -0.7, 0);
  });

  kit.outer(() => {
    // A crypt, an iron fence, a crow, and a detective studying the outline.
    kit.sub(5.3, 0, -3.3, south, () => {
      kit.box(1.5, 1.5, 1.3, stone, 0, 0.75, 0);
      kit.cyl(0.02, 1.15, 0.6, 0x5d6573, 0, 1.8, 0, 4).rotation.y = Math.PI / 4;
      kit.box(0.5, 0.95, 0.06, 0x14171c, 0, 0.48, 0.66);
      kit.box(0.08, 0.5, 0.08, 0x5d6573, 0, 2.3, 0);
      kit.box(0.3, 0.08, 0.08, 0x5d6573, 0, 2.38, 0);
    });
    kit.solid(5.3, -3.3, 1.0);

    const rails: [number, number][] = [
      [-7.0, -1.8],
      [-6.6, -3.0],
      [-6.0, -4.1],
      [-5.2, -5.1],
      [-4.3, -5.9],
    ];
    rails.forEach(([x, z], i) => {
      kit.cyl(0.05, 0.05, 1.3, 0x14171c, x, 0.65, z, 6);
      kit.cyl(0, 0.09, 0.2, 0x14171c, x, 1.4, z, 4);
      const next = rails[i + 1];
      if (next) for (const y of [0.45, 1.0]) kit.rod([x, y, z], [next[0], y, next[1]], 0.03, 0x14171c);
    });

    const [crowX, crowZ] = kit.widen(-4.3, -1.2);
    kit.ball(0.15, 0x14171c, crowX, 1.42, crowZ, 1).scale.set(1.5, 1, 1);
    kit.ball(0.1, 0x14171c, crowX + 0.2, 1.56, crowZ, 1);
    kit.cyl(0, 0.04, 0.14, GOLD, crowX + 0.33, 1.55, crowZ, 4).rotation.z = -Math.PI / 2;

    kit.sub(-0.9, 0, -4.5, 2.2, () => {
      kit.person(0x7a5a3a, 0, 0, 0, 1.05, 1);
      kit.cyl(0.36, 0.36, 0.04, 0x3a2d28, 0, 1.6, 0, 12);
      kit.cyl(0.2, 0.23, 0.22, 0x3a2d28, 0, 1.72, 0, 10);
      kit.rod([0.25, 0.85, 0.2], [0.35, 1.05, 0.45], 0.03, WOOD);
      kit.put(kit.mesh(new THREE.TorusGeometry(0.16, 0.03, 6, 14), STEEL), 0.4, 1.18, 0.58).rotation.y = 0.4;
    });
  });
  return {
    solids: [
      { x: -4.3, z: -1.2, r: 0.5 },
      { x: -3.5, z: -3.3, r: 0.45 },
      { x: -1.6, z: -4.8, r: 0.55 },
      { x: -4.9, z: -2.6, r: 0.4 },
      { x: 3.6, z: -3.8, r: 0.35 },
      { x: 4.5, z: -0.7, r: 0.3 },
    ],
    update: (time, near) => {
      question.rotation.y = time * 0.8;
      question.position.y = 2.4 + Math.sin(time * 1.3) * 0.12;
      glow.emissiveIntensity = 0.6 + near * 0.9;
      flame.emissiveIntensity = 1 + Math.sin(time * 17) * 0.18 + Math.sin(time * 7.3) * 0.22;
    },
  };
};

/** Bedtime Stories, audio stories for children: a bed, a book, the moon and stars. */
const bedtimeStories: Builder = (kit, light, south) => {
  // Bed, lying along the back with the pillow on the left.
  kit.box(3.1, 0.35, 1.6, WOOD, 0, 0.3, -4.3);
  kit.box(0.14, 1.2, 1.7, WOOD, -1.6, 0.6, -4.3);
  kit.box(0.14, 0.7, 1.7, WOOD, 1.6, 0.35, -4.3);
  kit.box(2.95, 0.25, 1.5, WHITE, 0, 0.6, -4.3);
  kit.box(2.0, 0.3, 1.56, light, 0.5, 0.68, -4.3);
  kit.box(0.6, 0.16, 1.0, 0xdfe6f5, -1.1, 0.8, -4.3);
  kit.ball(0.22, SKIN[1], -1.05, 0.98, -4.3);
  kit.ball(0.34, light, -0.3, 0.8, -4.3).scale.set(1.6, 0.7, 1);

  // Nightstand with a lamp.
  kit.box(0.6, 0.65, 0.6, WOOD, -2.5, 0.325, -4.4);
  kit.cyl(0.04, 0.1, 0.35, DARK, -2.5, 0.82, -4.4, 8);
  const lamp = kit.lit(0xffe2a0, 1);
  kit.cyl(0.14, 0.26, 0.32, lamp, -2.5, 1.12, -4.4, 10);

  // A big open storybook.
  kit.sub(4.0, 0, -2.3, -0.7, () => {
    for (const side of [-1, 1]) {
      const cover = kit.box(0.95, 0.08, 1.3, 0x3550b8, side * 0.46, 0.12, 0);
      cover.rotation.z = side * 0.18;
      const page = kit.box(0.86, 0.1, 1.2, 0xfdf6e3, side * 0.45, 0.2, 0);
      page.rotation.z = side * 0.18;
      for (const line of [-0.35, -0.1, 0.15, 0.4]) {
        const text = kit.box(0.6, 0.02, 0.05, 0xb9b09a, side * 0.45, 0.26, line);
        text.rotation.z = side * 0.18;
      }
    }
  });

  // Teddy bear.
  kit.sub(-4.3, 0, -1.3, 0.9, () => {
    const fur = 0xb07a45;
    kit.ball(0.42, fur, 0, 0.42, 0);
    kit.ball(0.3, fur, 0, 0.98, 0);
    kit.ball(0.11, fur, -0.22, 1.24, 0);
    kit.ball(0.11, fur, 0.22, 1.24, 0);
    kit.ball(0.12, 0xe8cfa4, 0, 0.93, 0.25, 0);
    kit.ball(0.15, fur, -0.42, 0.55, 0.12);
    kit.ball(0.15, fur, 0.42, 0.55, 0.12);
    kit.ball(0.17, fur, -0.26, 0.14, 0.34);
    kit.ball(0.17, fur, 0.26, 0.14, 0.34);
  });

  // Moon and stars over the bed.
  const moonShape = new THREE.Shape();
  moonShape.absarc(0, 0, 0.7, Math.PI / 2, Math.PI * 1.5, false);
  moonShape.absarc(0.45, 0, Math.hypot(0.45, 0.7), -2.142, 2.142, true);
  const moonGeometry = new THREE.ExtrudeGeometry(moonShape, { depth: 0.2, bevelEnabled: false, curveSegments: 16 });
  moonGeometry.center();
  const moon = kit.put(new THREE.Mesh(moonGeometry, kit.lit(0xffe58a, 0.9)), 0.9, 3.3, -4.6);
  moon.rotation.z = -0.35;
  const starMaterial = kit.lit(0xfff3b8, 1);
  const stars = [
    [-1.6, 3.5, -4.9],
    [-0.4, 2.7, -5.2],
    [2.3, 2.8, -4.2],
    [-2.6, 2.6, -3.9],
    [1.9, 3.7, -5.0],
  ].map(([x, y, z]) => kit.put(new THREE.Mesh(new THREE.OctahedronGeometry(0.16), starMaterial), x, y, z));

  kit.outer(() => {
    // The rest of the bedroom: a bookshelf, and a parent reading in a rocking chair.
    kit.sub(-4.8, 0, -4.3, south, () => {
      kit.box(1.7, 2.1, 0.5, WOOD, 0, 1.05, 0);
      kit.box(1.5, 1.9, 0.06, 0x4a2f18, 0, 1.05, 0.23);
      const spines = [0xe2553d, 0x3550b8, 0xf2b632, 0x2f9e8f, 0x7c5cff, 0xff7a59, 0xfdf6e3, 0x5fb04a];
      for (let shelf = 0; shelf < 3; shelf++) {
        kit.box(1.5, 0.06, 0.4, WOOD, 0, 0.25 + shelf * 0.62, 0.1);
        for (let book = 0; book < 8; book++) {
          const height = 0.36 + ((book * 3 + shelf * 5) % 4) * 0.04;
          kit.box(
            0.15,
            height,
            0.3,
            spines[(book + shelf * 3) % 8],
            -0.62 + book * 0.177,
            0.28 + shelf * 0.62 + height / 2,
            0.15,
          );
        }
      }
    });
    kit.solid(-4.8, -4.3, 0.95);

    const chair = kit.sub(1.3, 0, -3.9, Math.PI, () => {
      kit.box(0.7, 0.08, 0.7, WOOD, 0, 0.55, 0);
      kit.box(0.7, 0.95, 0.08, WOOD, 0, 1.0, -0.35);
      for (const side of [-1, 1]) {
        kit.box(0.07, 0.07, 1.15, WOOD, side * 0.32, 0.05, 0);
        for (const end of [-0.28, 0.28]) kit.box(0.06, 0.5, 0.06, WOOD, side * 0.32, 0.3, end);
      }
      kit.person(0x9a6bd8, 0, 0, 0, 1, 2, 0.3);
      kit.box(0.4, 0.04, 0.28, 0x3550b8, 0, 1.05, 0.38).rotation.x = 0.5;
    });
    kit.solid(1.3, -3.9, 0.6);
    kit.animate((time) => (chair.rotation.x = Math.sin(time * 1.4) * 0.07));

    for (const [x, y, z, r] of [
      [-2.2, 3.5, -4.6, 0.5],
      [-1.7, 3.45, -4.6, 0.36],
      [-2.7, 3.42, -4.6, 0.34],
    ])
      kit.ball(r, WHITE, x, y, z, 2);
  });
  return {
    solids: [
      { x: -0.8, z: -4.4, r: 1.0 },
      { x: 0.8, z: -4.4, r: 1.0 },
      { x: -2.5, z: -4.4, r: 0.45 },
      { x: 4.0, z: -2.3, r: 0.7 },
      { x: -4.3, z: -1.3, r: 0.5 },
    ],
    update: (time, near) => {
      moon.position.y = 3.3 + Math.sin(time * 0.9) * 0.12;
      moon.rotation.y = Math.sin(time * 0.5) * 0.5;
      stars.forEach((star, i) => {
        star.rotation.y = time * 1.5 + i;
        star.scale.setScalar(0.8 + Math.sin(time * 2.4 + i * 1.7) * 0.25);
      });
      lamp.emissiveIntensity = 0.8 + near * 0.8;
    },
  };
};

/** MS Fitness, training and nutrition coaching: an outdoor gym. */
const msFitness: Builder = (kit, light, south) => {
  const plate = 0x14171c;
  // Rubber flooring under the equipment.
  kit.decal(
    6.0,
    2.6,
    (ctx, w, h) => {
      ctx.fillStyle = "#2b3140";
      ctx.beginPath();
      ctx.roundRect(0, 0, w, h, h * 0.12);
      ctx.fill();
      ctx.strokeStyle = css(light);
      ctx.lineWidth = h * 0.03;
      ctx.beginPath();
      ctx.roundRect(h * 0.06, h * 0.06, w - h * 0.12, h - h * 0.12, h * 0.08);
      ctx.stroke();
    },
    0,
    -4.2,
  );
  // Pull-up frame with someone on it.
  for (const side of [-1, 1]) {
    kit.cyl(0.11, 0.11, 2.95, light, side * 1.3, 1.475, -4.7, 8);
    kit.cyl(0.11, 0.11, 2.2, light, side * 1.3, 1.1, -3.9, 8);
    kit.rod([side * 1.3, 2.15, -3.9], [side * 1.3, 2.9, -4.7], 0.07, light);
  }
  kit.rod([-1.4, 2.9, -4.7], [1.4, 2.9, -4.7], 0.07, STEEL);
  kit.rod([-1.4, 2.15, -3.9], [1.4, 2.15, -3.9], 0.07, STEEL);
  const athlete = kit.sub(0, 1.2, -4.7, 0, () => {
    kit.person(light, 0, 0, 0, 1, 2);
    for (const side of [-1, 1]) kit.rod([side * 0.22, 1.0, 0], [side * 0.36, 1.7, 0], 0.07, SKIN[2]);
  });

  // Squat rack with a loaded bar.
  kit.sub(-4.2, 0, -1.9, 0.9, () => {
    for (const side of [-1, 1]) {
      kit.cyl(0.07, 0.07, 2.2, DARK, side * 0.6, 1.1, 0, 8);
      kit.box(0.14, 0.08, 1.1, DARK, side * 0.6, 0.04, 0);
      kit.box(0.1, 0.08, 0.26, STEEL, side * 0.6, 1.5, 0.14);
      kit.cyl(0.36, 0.36, 0.09, plate, side * 0.98, 1.62, 0.16, 16).rotation.z = Math.PI / 2;
      kit.cyl(0.28, 0.28, 0.08, light, side * 1.08, 1.62, 0.16, 16).rotation.z = Math.PI / 2;
    }
    kit.rod([-1.25, 1.62, 0.16], [1.25, 1.62, 0.16], 0.035, STEEL);
    kit.rod([-0.6, 2.15, 0], [0.6, 2.15, 0], 0.04, DARK);
  });

  // Flat bench with dumbbells beside it.
  kit.sub(4.1, 0, -2.1, -0.6, () => {
    kit.box(0.55, 0.14, 1.7, DARK, 0, 0.55, 0);
    kit.box(0.5, 0.05, 1.6, light, 0, 0.64, 0);
    for (const end of [-1, 1]) {
      kit.box(0.5, 0.48, 0.08, STEEL, 0, 0.24, end * 0.65);
      kit.box(0.7, 0.06, 0.1, STEEL, 0, 0.03, end * 0.65);
    }
  });
  const dumbbell = (x: number, z: number, ry: number) =>
    kit.sub(x, 0.17, z, ry, () => {
      kit.rod([-0.25, 0, 0], [0.25, 0, 0], 0.035, STEEL);
      for (const side of [-1, 1]) kit.cyl(0.17, 0.17, 0.16, plate, side * 0.3, 0, 0, 6).rotation.z = Math.PI / 2;
    });
  dumbbell(4.9, -0.6, 0.4);
  dumbbell(5.0, -1.15, 0.2);
  dumbbell(3.0, -3.7, 1.2);

  // Kettlebells and a stack of plates.
  for (const [x, z, size, color] of [
    [-2.6, -3.7, 1, plate],
    [-3.15, -4.05, 0.8, light],
    [-2.2, -4.25, 0.65, 0xe2553d],
  ]) {
    const bell = kit.sub(x, 0, z, 0.6, () => {
      kit.ball(0.26, color, 0, 0.25, 0, 2);
      kit.put(kit.mesh(new THREE.TorusGeometry(0.15, 0.04, 6, 12), color), 0, 0.52, 0);
    });
    bell.scale.setScalar(size);
  }
  [0.4, 0.36, 0.3, 0.3].forEach((r, i) => kit.cyl(r, r, 0.1, i % 2 ? light : plate, 2.6, 0.05 + i * 0.1, -4.5, 16));

  kit.outer(() => {
    // More of the park: monkey bars, a running lane with a runner, a coach and a table of food.
    kit.sub(4.7, 0, -4.6, -0.8, () => {
      for (const side of [-1, 1]) {
        for (const end of [-0.9, 0.9]) kit.cyl(0.08, 0.08, 2.4, light, end, 1.2, side * 0.4, 8);
        kit.rod([-0.9, 2.4, side * 0.4], [0.9, 2.4, side * 0.4], 0.06, light);
      }
      for (let rung = 0; rung < 5; rung++)
        kit.rod([-0.72 + rung * 0.36, 2.4, -0.4], [-0.72 + rung * 0.36, 2.4, 0.4], 0.04, STEEL);
    });
    kit.solid(4.7, -4.6, 1.0);

    kit.decal(
      4.6,
      1.1,
      (ctx, w, h) => {
        ctx.fillStyle = "#b5533c";
        ctx.beginPath();
        ctx.roundRect(0, 0, w, h, h * 0.2);
        ctx.fill();
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = h * 0.04;
        for (const lane of [0.33, 0.67]) {
          ctx.beginPath();
          ctx.moveTo(w * 0.03, h * lane);
          ctx.lineTo(w * 0.97, h * lane);
          ctx.stroke();
        }
      },
      0,
      -3.7,
    );
    const runner = kit.person(0xff7a59, 0, -3.7, Math.PI / 2, 1, 1);
    kit.animate((time) => {
      const lap = time * 1.1;
      runner.position.x = Math.sin(lap) * 1.8;
      runner.position.y = Math.abs(Math.sin(time * 9)) * 0.12;
      runner.rotation.y = Math.cos(lap) > 0 ? Math.PI / 2 : -Math.PI / 2;
    });

    kit.sub(-4.1, 0, -3.5, south, () => {
      kit.person(0x14171c, 0, 0, 0, 1.1, 0);
      kit.cyl(0.22, 0.22, 0.1, light, 0, 1.63, 0, 10);
      kit.box(0.3, 0.4, 0.03, WHITE, 0.2, 0.95, 0.28).rotation.x = -0.4;
    });
    kit.sub(-5.1, 0, -4.5, south, () => {
      kit.box(1.2, 0.06, 0.7, WHITE, 0, 0.8, 0);
      for (const side of [-1, 1]) kit.box(0.06, 0.77, 0.6, STEEL, side * 0.52, 0.385, 0);
      kit.cyl(0.09, 0.08, 0.3, light, -0.35, 0.98, 0, 10);
      kit.cyl(0.095, 0.095, 0.06, DARK, -0.35, 1.16, 0, 10);
      kit.ball(0.11, 0xe23d3d, 0, 0.93, 0.1);
      kit.ball(0.11, 0x5fb04a, 0.2, 0.93, -0.1);
      kit.box(0.3, 0.07, 0.08, 0xf2c230, 0.38, 0.87, 0.15).rotation.y = 0.5;
    });
    kit.solid(-5.1, -4.5, 0.75);
  });
  return {
    solids: [
      { x: -1.3, z: -4.3, r: 0.55 },
      { x: 1.3, z: -4.3, r: 0.55 },
      { x: -4.2, z: -1.9, r: 1.0 },
      { x: 4.1, z: -2.1, r: 0.9 },
      { x: 2.6, z: -4.5, r: 0.45 },
      { x: -2.7, z: -3.9, r: 0.5 },
    ],
    // Pull-ups; quicker with an audience.
    update: (time, near) => {
      athlete.position.y = 1.2 + (0.5 - 0.5 * Math.cos(time * (2 + near * 1.5))) * 0.42;
    },
  };
};

/** Troskovi, building expenses for housing communities: apartment blocks, the post and this month's bill. */
const troskovi: Builder = (kit, light, south) => {
  const windows: [number, number, number][] = [];
  const block = (x: number, z: number, w: number, h: number, color: number, columns: number, rows: number) => {
    kit.box(w, h, 1.6, color, x, h / 2, z);
    const [, back] = kit.widen(x, z);
    kit.box(w + 0.16, 0.12, 1.76, DARK, x, h + 0.06, z);
    kit.box(0.4, 0.62, 0.06, DARK, x, 0.31, z + 0.81);
    for (let row = 0; row < rows; row++)
      for (let column = 0; column < columns; column++)
        for (const face of [-0.81, 0.81])
          windows.push([x + ((column + 0.5) / columns - 0.5) * (w - 0.3), 1.15 + row * 0.75, back + face]);
  };
  block(-1.85, -4.3, 2.2, 3.7, 0xd9d2c4, 3, 4);
  block(1.7, -4.4, 2.4, 2.9, 0xc9836a, 3, 3);
  const glass = new THREE.InstancedMesh(
    new THREE.BoxGeometry(0.34, 0.42, 0.05),
    kit.lit(0xffe9a8, 0.9),
    windows.length,
  );
  const matrix = new THREE.Matrix4();
  windows.forEach(([x, y, z], i) => glass.setMatrixAt(i, matrix.makeTranslation(x, y, z)));
  kit.put(glass);

  // Mailbox.
  kit.cyl(0.06, 0.06, 1.0, STEEL, -4.5, 0.5, -1.1, 8);
  kit.box(0.6, 0.42, 0.4, light, -4.5, 1.2, -1.1);
  kit.box(0.4, 0.04, 0.02, DARK, -4.5, 1.28, -0.89);
  kit.box(0.05, 0.3, 0.2, 0xe2553d, -4.17, 1.3, -1.1);

  // This month's bill.
  kit.board(
    1.7,
    2.1,
    (ctx, w, h) => {
      ctx.fillStyle = "#fbfaf5";
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = css(light);
      ctx.fillRect(0, 0, w, h * 0.16);
      heading(ctx, h * 0.085);
      ctx.fillStyle = "#fff";
      ctx.fillText("TROŠKOVI", w * 0.08, h * 0.085);
      heading(ctx, h * 0.065, 500);
      const rows = [
        ["Struja", "3.200"],
        ["Voda", "1.150"],
        ["Lift", "600"],
        ["Čišćenje", "450"],
      ];
      rows.forEach(([label, amount], i) => {
        const y = h * (0.27 + i * 0.105);
        ctx.fillStyle = "#3a4250";
        ctx.textAlign = "left";
        ctx.fillText(label, w * 0.08, y);
        ctx.textAlign = "right";
        ctx.fillText(amount, w * 0.92, y);
      });
      ctx.fillStyle = "#3a4250";
      ctx.fillRect(w * 0.08, h * 0.67, w * 0.84, h * 0.006);
      heading(ctx, h * 0.08);
      ctx.textAlign = "left";
      ctx.fillText("Ukupno", w * 0.08, h * 0.74);
      ctx.textAlign = "right";
      ctx.fillText("5.400", w * 0.92, h * 0.74);
      ctx.translate(w * 0.5, h * 0.89);
      ctx.rotate(-0.12);
      ctx.strokeStyle = ctx.fillStyle = "#1f9d55";
      ctx.lineWidth = h * 0.012;
      ctx.strokeRect(-w * 0.3, -h * 0.05, w * 0.6, h * 0.1);
      ctx.textAlign = "center";
      heading(ctx, h * 0.07);
      ctx.fillText("PLAĆENO ✓", 0, 0);
    },
    4.4,
    1.6,
    -2.6,
    south,
  );

  // Stacks of coins.
  [
    [4.4, 0.1, 6],
    [4.95, -0.35, 4],
    [4.75, 0.6, 2],
  ].forEach(([x, z, count]) => {
    for (let i = 0; i < count; i++) kit.cyl(0.3, 0.3, 0.1, i % 2 ? 0xe0a52a : GOLD, x, 0.05 + i * 0.105, z, 14);
  });

  kit.outer(() => {
    // A third building, the notice board, and residents talking to the manager.
    const pane = kit.lit(0xffe9a8, 0.9);
    kit.box(1.5, 2.3, 1.3, 0x8fa6b8, -4.6, 1.15, -4.1);
    kit.box(1.66, 0.12, 1.46, DARK, -4.6, 2.36, -4.1);
    for (const face of [-0.66, 0.66]) {
      kit.box(0.36, 0.56, 0.05, DARK, -4.6, 0.28, -4.1 + face);
      for (const column of [-0.38, 0.38])
        for (const row of [1.05, 1.75]) kit.box(0.34, 0.42, 0.05, pane, -4.6 + column, row, -4.1 + face);
    }
    kit.solid(-4.6, -4.1, 1.0);

    kit.crowd([
      [-0.9, -3.8, 0xff7a59],
      [0.0, -3.6, 0x5fb04a],
      [1.0, -3.9, light],
    ]);
    kit.box(0.3, 0.4, 0.03, WHITE, 0.8, 0.95, -3.62).rotation.x = -0.4;

    kit.board(
      1.1,
      1.3,
      (ctx, w, h) => {
        ctx.fillStyle = "#b98a55";
        ctx.fillRect(0, 0, w, h);
        const notes: [number, number, string][] = [
          [0.08, 0.08, "#fdf6e3"],
          [0.52, 0.12, "#ffe58a"],
          [0.12, 0.5, "#cfe6ff"],
          [0.5, 0.55, "#fdf6e3"],
        ];
        for (const [x, y, color] of notes) {
          ctx.fillStyle = color;
          ctx.fillRect(w * x, h * y, w * 0.38, h * 0.34);
          ctx.fillStyle = "#e23d3d";
          ctx.beginPath();
          ctx.arc(w * (x + 0.19), h * (y + 0.04), w * 0.03, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#6b7280";
          for (let line = 0; line < 3; line++)
            ctx.fillRect(w * (x + 0.05), h * (y + 0.12 + line * 0.07), w * 0.28, h * 0.02);
        }
      },
      -6.2,
      1.4,
      -2.7,
      south,
    );
    kit.solid(-6.2, -2.7, 0.6);
  });
  return {
    solids: [
      { x: -2.3, z: -4.4, r: 1.0 },
      { x: -1.3, z: -4.4, r: 1.0 },
      { x: 1.2, z: -4.5, r: 1.0 },
      { x: 2.3, z: -4.5, r: 1.0 },
      { x: -4.5, z: -1.1, r: 0.35 },
      { x: 4.4, z: -2.6, r: 0.75 },
      { x: 4.7, z: 0.1, r: 0.65 },
    ],
  };
};

/** &Repeat, recycling rewards: bins to scan at, and the restaurant table the credit pays for. */
const andRepeat: Builder = (kit, light, south) => {
  const qr = new THREE.MeshBasicMaterial({
    map: (() => {
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = 84;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "#fff";
        ctx.fillRect(0, 0, 84, 84);
        ctx.fillStyle = "#111";
        let seed = 11;
        for (let row = 0; row < 19; row++)
          for (let column = 0; column < 19; column++) {
            seed = (seed * 16807) % 2147483647;
            if (seed % 2) ctx.fillRect(4 + column * 4, 4 + row * 4, 4, 4);
          }
        for (const [x, y] of [
          [4, 4],
          [52, 4],
          [4, 52],
        ]) {
          ctx.fillStyle = "#fff";
          ctx.fillRect(x - 2, y - 2, 32, 32);
          ctx.fillStyle = "#111";
          ctx.fillRect(x, y, 28, 28);
          ctx.fillStyle = "#fff";
          ctx.fillRect(x + 4, y + 4, 20, 20);
          ctx.fillStyle = "#111";
          ctx.fillRect(x + 8, y + 8, 12, 12);
        }
      }
      const texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.magFilter = THREE.NearestFilter;
      return texture;
    })(),
  });
  [0x3f9e5a, 0x2f7fd6, 0xf2c230].forEach((color, i) => {
    const x = (i - 1) * 1.3;
    kit.box(0.95, 1.2, 0.9, color, x, 0.6, -4.5);
    kit.box(1.05, 0.14, 1.0, DARK, x, 1.27, -4.5);
    kit.box(0.5, 0.1, 0.06, 0x14171c, x, 1.05, -4.04);
    for (const face of [1, -1]) {
      const code = kit.put(new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.5), qr), x, 0.6, -4.5 + face * 0.455);
      if (face < 0) code.rotation.y = Math.PI;
      code.userData.noShadow = true;
    }
  });

  // Bottles and cups waiting to be scanned.
  const bottle = (x: number, z: number, color: number, tilt = 0) => {
    const group = kit.sub(x, 0, z, x * 3, () => {
      kit.cyl(0.11, 0.11, 0.42, color, 0, 0.21, 0, 8);
      kit.cyl(0.04, 0.1, 0.16, color, 0, 0.5, 0, 8);
      kit.cyl(0.05, 0.05, 0.05, WHITE, 0, 0.6, 0, 8);
    });
    if (tilt) {
      group.rotation.z = tilt;
      group.position.y = 0.11;
    }
  };
  bottle(2.5, -3.9, 0x5fb04a);
  bottle(2.85, -4.2, 0x8fd0ff);
  bottle(-2.4, -3.9, 0x8fd0ff, Math.PI / 2);
  bottle(-2.9, -4.3, 0x5fb04a);
  kit.cyl(0.16, 0.11, 0.3, WHITE, 2.2, 0.15, -4.4, 10);
  kit.cyl(0.16, 0.11, 0.3, light, -2.05, 0.15, -4.5, 10);

  kit.board(
    1.8,
    1.8,
    (ctx, w, h) => {
      ctx.fillStyle = css(light);
      ctx.fillRect(0, 0, w, h);
      // Three chasing arrows.
      ctx.strokeStyle = ctx.fillStyle = "#fff";
      ctx.lineWidth = w * 0.075;
      ctx.lineCap = "butt";
      const radius = w * 0.24;
      for (let arrow = 0; arrow < 3; arrow++) {
        const start = (arrow * Math.PI * 2) / 3 - Math.PI / 2;
        const end = start + 1.45;
        ctx.beginPath();
        ctx.arc(w / 2, h * 0.43, radius, start, end);
        ctx.stroke();
        const tipX = w / 2 + Math.cos(end) * radius;
        const tipY = h * 0.43 + Math.sin(end) * radius;
        ctx.save();
        ctx.translate(tipX, tipY);
        ctx.rotate(end + Math.PI / 2);
        ctx.beginPath();
        ctx.moveTo(w * 0.11, 0);
        ctx.lineTo(-w * 0.03, -w * 0.09);
        ctx.lineTo(-w * 0.03, w * 0.09);
        ctx.fill();
        ctx.restore();
      }
      heading(ctx, h * 0.12);
      ctx.textAlign = "center";
      ctx.fillText("SCAN · EARN", w / 2, h * 0.88);
    },
    -4.4,
    1.9,
    -1.5,
    south,
  );

  // A restaurant table, with the reward on it.
  kit.sub(4.3, 0, -1.4, 0, () => {
    kit.cyl(0.8, 0.8, 0.07, WHITE, 0, 0.95, 0, 18);
    kit.cyl(0.07, 0.07, 0.9, DARK, 0, 0.47, 0, 8);
    kit.cyl(0.4, 0.45, 0.06, DARK, 0, 0.03, 0, 12);
    kit.cyl(0.3, 0.24, 0.04, 0xdfe6f5, -0.25, 1.01, 0.1, 14);
    kit.ball(0.15, 0xff9a2e, -0.25, 1.1, 0.1).scale.y = 0.6;
    kit.cyl(0.11, 0.08, 0.26, light, 0.3, 1.12, -0.15, 10);
    for (const [x, z] of [
      [-1.05, 0.5],
      [1.0, -0.6],
    ]) {
      kit.cyl(0.28, 0.28, 0.07, WOOD, x, 0.6, z, 12);
      kit.cyl(0.05, 0.05, 0.6, DARK, x, 0.3, z, 6);
    }
  });

  kit.outer(() => {
    // Someone scanning a bottle, the credit they earn, and the food stall where it gets spent.
    kit.sub(0.4, 0, -4.6, Math.PI, () => {
      kit.person(0xf2b632, 0, 0, 0, 1.05, 2);
      kit.box(0.16, 0.28, 0.03, kit.lit(0xdfe6f5, 0.7), 0.22, 1.05, 0.3);
      kit.cyl(0.07, 0.07, 0.3, 0x8fd0ff, -0.25, 0.95, 0.28, 8);
    });
    const credit = kit.cyl(0.4, 0.4, 0.08, kit.lit(GOLD, 0.5), 0, 2.4, -5.9, 20);
    credit.rotation.z = Math.PI / 2;
    kit.animate((time, glow) => {
      credit.rotation.y = time * (2 + glow * 3);
      credit.position.y = 2.4 + Math.sin(time * 2) * 0.12;
    });

    kit.sub(4.4, 0, -4.2, south, () => {
      kit.box(1.8, 1.0, 0.8, WHITE, 0, 0.5, 0);
      kit.box(1.82, 0.2, 0.82, light, 0, 0.75, 0);
      for (const side of [-1, 1])
        for (const end of [-0.5, 0.5]) kit.cyl(0.04, 0.04, 2.2, STEEL, side * 0.9, 1.1, end, 6);
      for (let strip = 0; strip < 5; strip++)
        kit.box(0.42, 0.12, 1.3, strip % 2 ? WHITE : light, -0.84 + strip * 0.42, 2.25, 0);
      kit.person(WHITE, 0, -0.75, 0, 1, 1);
      kit.ball(0.16, 0xc98a4b, -0.45, 1.1, 0.1).scale.y = 0.7;
      kit.cyl(0.1, 0.07, 0.24, light, 0.4, 1.12, 0.1, 10);
    });
    kit.solid(4.4, -4.2, 1.2);
  });
  return {
    solids: [
      { x: -1.3, z: -4.5, r: 0.7 },
      { x: 0, z: -4.5, r: 0.7 },
      { x: 1.3, z: -4.5, r: 0.7 },
      { x: -4.4, z: -1.5, r: 0.8 },
      { x: 4.3, z: -1.4, r: 1.0 },
    ],
  };
};

/** Brame, gamified marketing: a prize wheel, an arcade cabinet, gifts and a trophy. */
const brame: Builder = (kit, light, south) => {
  const colors = [css(light), "#f2b632", "#5b7cfa", "#12b5a6", "#ff7a59", "#7c5cff"];
  const faceCanvas = document.createElement("canvas");
  faceCanvas.width = faceCanvas.height = 512;
  const ctx = faceCanvas.getContext("2d");
  if (ctx) {
    for (let slice = 0; slice < 12; slice++) {
      ctx.fillStyle = colors[slice % colors.length];
      ctx.beginPath();
      ctx.moveTo(256, 256);
      ctx.arc(256, 256, 256, (slice * Math.PI) / 6, ((slice + 1) * Math.PI) / 6);
      ctx.fill();
    }
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(256, 256, 44, 0, Math.PI * 2);
    ctx.fill();
  }
  const faceTexture = new THREE.CanvasTexture(faceCanvas);
  faceTexture.colorSpace = THREE.SRGBColorSpace;
  const face = new THREE.MeshStandardMaterial({ map: faceTexture, roughness: 0.6 });

  // The wheel always faces the camera.
  let wheel = new THREE.Group();
  kit.sub(0, 0, -4.6, south, () => {
    kit.box(0.3, 2.2, 0.3, DARK, 0, 1.1, -0.25);
    kit.box(1.5, 0.14, 0.9, DARK, 0, 0.07, -0.15);
    wheel = kit.sub(0, 2.25, 0, 0, () => {
      const disc = kit.put(new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.4, 0.14, 24), [kit.mat(DARK), face, face]));
      disc.rotation.x = Math.PI / 2;
      for (let peg = 0; peg < 12; peg++)
        kit.ball(0.06, GOLD, Math.cos((peg * Math.PI) / 6) * 1.3, Math.sin((peg * Math.PI) / 6) * 1.3, 0.1, 0);
    });
    const pointer = kit.put(kit.mesh(new THREE.ConeGeometry(0.16, 0.4, 4), 0xe23d3d), 0, 3.78, 0.1);
    pointer.rotation.x = Math.PI;
  });

  // Arcade cabinet.
  const screen = kit.lit(light, 0.9);
  kit.sub(-4.2, 0, -1.9, 1.0, () => {
    kit.box(0.95, 2.0, 0.9, 0x232a3a, 0, 1.0, 0);
    kit.box(0.99, 0.35, 0.94, light, 0, 2.05, 0);
    kit.box(0.72, 0.6, 0.05, screen, 0, 1.45, 0.46).rotation.x = -0.15;
    kit.box(0.95, 0.12, 0.45, 0x394359, 0, 0.98, 0.6).rotation.x = 0.25;
    kit.cyl(0.03, 0.03, 0.2, STEEL, -0.2, 1.12, 0.6, 6);
    kit.ball(0.07, 0xe23d3d, -0.2, 1.24, 0.6, 0);
    kit.cyl(0.06, 0.06, 0.04, GOLD, 0.12, 1.06, 0.62, 8);
    kit.cyl(0.06, 0.06, 0.04, 0x12b5a6, 0.3, 1.07, 0.58, 8);
  });

  let spun = 0;

  // Gifts.
  const gift = (x: number, z: number, size: number, color: number, ribbon: number, ry: number) =>
    kit.sub(x, 0, z, ry, () => {
      kit.box(size, size, size, color, 0, size / 2, 0);
      kit.box(size + 0.02, size + 0.02, size * 0.18, ribbon, 0, size / 2, 0);
      kit.box(size * 0.18, size + 0.02, size + 0.02, ribbon, 0, size / 2, 0);
      kit.ball(size * 0.16, ribbon, 0, size + size * 0.1, 0, 0);
    });
  gift(4.2, -1.0, 0.9, 0x5b7cfa, GOLD, 0.3);
  gift(4.9, -1.9, 0.6, 0xff7a59, WHITE, -0.4);
  gift(3.8, -2.2, 0.7, 0x12b5a6, 0xe23d3d, 0.8);
  gift(4.25, -1.05, 0.5, GOLD, 0xe23d3d, 1.1).position.y = 0.92;

  // Trophy.
  kit.sub(3.0, 0, -4.1, 0, () => {
    kit.box(0.6, 0.25, 0.6, DARK, 0, 0.125, 0);
    kit.cyl(0.07, 0.14, 0.45, GOLD, 0, 0.47, 0, 8);
    kit.cyl(0.38, 0.14, 0.6, GOLD, 0, 1.0, 0, 12);
    for (const side of [-1, 1]) {
      const handle = kit.put(kit.mesh(new THREE.TorusGeometry(0.17, 0.04, 6, 10, Math.PI), GOLD), side * 0.3, 1.02, 0);
      handle.rotation.z = (-side * Math.PI) / 2;
    }
  });

  kit.outer(() => {
    // More games and prizes: a claw machine, a winners' podium and balloons.
    const glass = new THREE.MeshStandardMaterial({
      color: 0xbfe3ff,
      transparent: true,
      opacity: 0.25,
      depthWrite: false,
    });
    kit.sub(-4.6, 0, -4.2, south, () => {
      kit.box(1.1, 0.9, 1.1, light, 0, 0.45, 0);
      kit.box(1.05, 1.1, 1.05, glass, 0, 1.45, 0).userData.noShadow = true;
      kit.box(1.15, 0.2, 1.15, light, 0, 2.1, 0);
      [0xf2b632, 0x5b7cfa, 0x12b5a6, 0xff7a59, 0x7c5cff].forEach((color, i) =>
        kit.ball(0.17, color, -0.3 + (i % 3) * 0.3, 1.07, -0.2 + Math.floor(i / 3) * 0.35),
      );
      kit.rod([0.1, 2.0, 0], [0.1, 1.55, 0], 0.02, STEEL);
      kit.ball(0.08, STEEL, 0.1, 1.5, 0, 0);
      kit.ball(0.07, 0xe23d3d, 0.3, 1.0, 0.6, 0);
    });
    kit.solid(-4.6, -4.2, 0.85);

    kit.sub(4.9, 0, -4.2, south, () => {
      const steps: [number, number, number][] = [
        [0, 0.8, GOLD],
        [-0.7, 0.55, 0xd8dbe2],
        [0.7, 0.35, 0xc98a4b],
      ];
      steps.forEach(([x, height, shirt], i) => {
        kit.box(0.7, height, 0.7, WHITE, x, height / 2, 0);
        kit.box(0.72, 0.1, 0.72, shirt, x, height - 0.05, 0);
        kit.person([light, 0x5b7cfa, 0x12b5a6][i], x, 0, 0, 0.9, i + 1, height);
      });
    });
    kit.solid(4.9, -4.2, 1.1);

    const balloons = [0xe23d3d, 0xf2b632, 0x5b7cfa].map((color, i) => {
      const x = -0.9 + i * 0.5;
      kit.rod([-0.4, 0.15, -3.8], [x, 2.1 + (i % 2) * 0.3, -3.8], 0.012, WHITE);
      const balloon = kit.ball(0.3, color, x, 2.4 + (i % 2) * 0.3, -3.8, 2);
      balloon.scale.y = 1.2;
      return balloon;
    });
    kit.box(0.3, 0.3, 0.3, DARK, -0.4, 0.15, -3.8);
    kit.animate((time) =>
      balloons.forEach(
        (balloon, i) => (balloon.position.y = 2.4 + (i % 2) * 0.3 + Math.sin(time * 1.6 + i * 2) * 0.06),
      ),
    );
  });
  return {
    solids: [
      { x: 0, z: -4.6, r: 1.4 },
      { x: -4.2, z: -1.9, r: 0.75 },
      { x: 4.3, z: -1.6, r: 1.0 },
      { x: 3.0, z: -4.1, r: 0.45 },
    ],
    update: (time, near) => {
      // Idles round slowly; spins up while the car is parked beside it.
      spun += near * 0.06;
      wheel.rotation.z = -(time * 0.5 + spun);
      screen.emissiveIntensity = 0.7 + Math.sin(time * 6) * 0.25;
    },
  };
};

/** ClubKit, nightclub events and tickets: a DJ booth, speakers, a mirror ball and a dance floor. */
const clubkit: Builder = (kit, light, south) => {
  const strip = kit.lit(light, 1);
  kit.box(2.6, 1.0, 0.85, 0x14171c, 0, 0.5, -4.5);
  kit.box(2.5, 0.12, 0.04, strip, 0, 0.7, -4.06);
  kit.box(2.5, 0.12, 0.04, strip, 0, 0.3, -4.06);
  const decks = [-0.8, 0.8].map((x) => {
    kit.box(0.8, 0.06, 0.7, 0x2a3142, x, 1.03, -4.5);
    return kit.cyl(0.3, 0.3, 0.03, 0x0a0c10, x, 1.08, -4.5, 16);
  });
  for (const deck of decks) {
    // Added to the deck after being built, so they turn with it.
    deck.add(kit.cyl(0.1, 0.1, 0.035, light, 0, 0, 0, 10), kit.box(0.04, 0.036, 0.2, WHITE, 0.08, 0, 0.14));
  }
  kit.box(0.5, 0.1, 0.6, 0x394359, 0, 1.05, -4.5);
  const dj = kit.person(0x14171c, 0, -5.3, 0, 1.1, 1);
  // Headphones.
  kit.put(kit.mesh(new THREE.TorusGeometry(0.25, 0.04, 6, 12, Math.PI), light), 0, 1.5, -5.3);

  // Speaker stacks with a truss between them.
  const cones: THREE.Mesh[] = [];
  for (const side of [-1, 1]) {
    kit.box(1.0, 2.2, 0.9, 0x1d222c, side * 2.5, 1.1, -4.6);
    for (const [y, r] of [
      [0.65, 0.36],
      [1.5, 0.36],
      [2.0, 0.14],
    ]) {
      const cone = kit.cyl(r, r * 0.6, 0.08, 0x3a4252, side * 2.5, y, -4.13, 16);
      cone.rotation.x = Math.PI / 2;
      if (r > 0.2) cones.push(cone);
    }
    kit.cyl(0.05, 0.05, 1.5, STEEL, side * 2.5, 2.95, -4.6, 6);
  }
  kit.rod([-2.6, 3.7, -4.6], [2.6, 3.7, -4.6], 0.06, STEEL);
  kit.rod([-2.6, 3.5, -4.6], [2.6, 3.5, -4.6], 0.04, STEEL);
  kit.rod([0, 3.5, -4.6], [0, 3.25, -4.6], 0.02, STEEL);
  const mirrorBall = kit.ball(
    0.42,
    new THREE.MeshStandardMaterial({ color: 0xdfe6f5, metalness: 0.9, roughness: 0.25, flatShading: true }),
    0,
    2.85,
    -4.6,
    2,
  );

  // Beams from the truss.
  const beamColors = [light, 0xf25fa0, 0x12b5a6, 0xf2b632];
  const beams = [-1.8, -0.7, 0.7, 1.8].map((x, i) => {
    const geometry = new THREE.ConeGeometry(0.75, 3.4, 14, 1, true);
    geometry.translate(0, -1.7, 0);
    const beam = kit.put(
      new THREE.Mesh(
        geometry,
        new THREE.MeshBasicMaterial({
          color: beamColors[i],
          transparent: true,
          opacity: 0.16,
          depthWrite: false,
          side: THREE.DoubleSide,
          blending: THREE.AdditiveBlending,
        }),
      ),
      x,
      3.5,
      -4.6,
    );
    beam.userData.noShadow = true;
    return beam;
  });

  // The dance floor, either side.
  const outfits = [0xf25fa0, 0x12b5a6, 0xf2b632, 0x7c5cff, 0xff7a59, 0xf4f4f4];
  const dancers = (
    [
      [-4.3, -1.3],
      [-3.6, -2.5],
      [-4.9, -2.4],
      [4.3, -1.3],
      [3.6, -2.5],
      [4.9, -2.4],
    ] as const
  ).map(([x, z], i) => kit.person(outfits[i], x, z, x > 0 ? -1 : 1, 1, i));

  // Velvet rope by the door.
  kit.rope(-5.4, 0.9, -3.9, 1.35, GOLD, 0xb3261e);

  kit.outer(() => {
    // A lit dance floor with more dancers, tonight's sign, the ticket booth and a doorman at the rope.
    const tiles = ["#f25fa0", "#12b5a6", "#f2b632", "#7c5cff", css(light)];
    kit.decal(
      4.6,
      1.5,
      (ctx, w, h) => {
        for (let row = 0; row < 3; row++)
          for (let column = 0; column < 9; column++) {
            ctx.fillStyle = (row + column) % 2 ? "#161a24" : tiles[(row * 2 + column) % tiles.length];
            ctx.fillRect((column * w) / 9 + 2, (row * h) / 3 + 2, w / 9 - 4, h / 3 - 4);
          }
      },
      0,
      -3.9,
    );
    dancers.push(
      kit.person(0x12b5a6, -1.4, -3.9, 0.4, 1, 0),
      kit.person(0xf2b632, 0.1, -3.7, -0.2, 1, 3),
      kit.person(0xf25fa0, 1.5, -4.0, -0.5, 1, 1),
    );

    kit.board(2.0, 0.8, sign("TONIGHT", "#0c0f14", css(light)), -4.9, 2.6, -4.3, south);
    kit.solid(-4.9, -4.3, 0.8);
    kit.booth(4.8, -4.4, south, 0x232a3a, "TICKETS");
    kit.solid(4.8, -4.4, 0.9);
    kit.person(0x14171c, -4.4, 1.15, 0.3, 1.25, 3);
    kit.solid(-4.4, 1.15, 0.4);
  });
  return {
    solids: [
      { x: -0.7, z: -4.7, r: 0.95 },
      { x: 0.7, z: -4.7, r: 0.95 },
      { x: -2.5, z: -4.6, r: 0.7 },
      { x: 2.5, z: -4.6, r: 0.7 },
      { x: -4.3, z: -2.1, r: 0.9 },
      { x: 4.3, z: -2.1, r: 0.9 },
      { x: -5.4, z: 0.9, r: 0.15 },
      { x: -3.9, z: 1.35, r: 0.15 },
    ],
    update: (time, near) => {
      const beat = time * (5 + near * 2);
      mirrorBall.rotation.y = time * 1.2;
      for (const deck of decks) deck.rotation.y = time * 3.5;
      dancers.forEach((dancer, i) => {
        dancer.position.y = Math.abs(Math.sin(beat + i * 1.3)) * 0.22;
        dancer.rotation.z = Math.sin(beat * 0.5 + i) * 0.12;
      });
      dj.position.y = Math.abs(Math.sin(beat)) * 0.08;
      cones.forEach((cone) => cone.scale.setScalar(1 + Math.max(0, Math.sin(beat * 2)) * 0.08));
      beams.forEach((beam, i) => {
        beam.rotation.z = Math.sin(time * 1.1 + i * 1.6) * 0.45;
        beam.rotation.x = 0.35 + Math.sin(time * 0.8 + i) * 0.25;
        (beam.material as THREE.MeshBasicMaterial).opacity = 0.12 + near * 0.12;
      });
      strip.emissiveIntensity = 0.6 + Math.max(0, Math.sin(beat)) * 0.9;
    },
  };
};

const builders: Record<string, Builder> = {
  "action-network": actionNetwork,
  deepdays,
  "svenska-fans": svenskaFans,
  "vi-appen": viAppen,
  scoops,
  brava,
  "dark-stories": darkStories,
  "bedtime-stories": bedtimeStories,
  "ms-fitness": msFitness,
  troskovi,
  "and-repeat": andRepeat,
  brame,
  clubkit,
};

/** The diorama for a project, or null if it has none. */
export function buildStationProps(slug: string, tint: [string, string], south = 0): StationProps | null {
  const build = builders[slug];
  if (!build) return null;
  const kit = makeKit();
  const built = build(kit, new THREE.Color(tint[0]).getHex(), south);
  const widened = <T extends Solid>(solid: T): T => {
    const [x, z] = kit.widen(solid.x, solid.z);
    return { ...solid, x, z };
  };
  const updates = built.update ? [built.update, ...kit.animations] : kit.animations;
  kit.root.traverse((child) => {
    if (child instanceof THREE.Mesh && !child.userData.noShadow) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });
  return {
    group: kit.root,
    solids: [...built.solids.map(widened), ...kit.outerSolids],
    balls: (built.balls ?? []).map(widened),
    update: updates.length ? (time, glow) => updates.forEach((update) => update(time, glow)) : undefined,
  };
}
