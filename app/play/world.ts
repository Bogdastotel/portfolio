import * as THREE from "three";

import type { Project } from "~/content/projects";

import { createSound } from "./sound";
import { buildStationProps, type StationProps } from "./stationProps";

export type WorldInput = { up: boolean; down: boolean; left: boolean; right: boolean; brake: boolean };

export type Score = { coins: number; coinsTotal: number; pins: number; strikes: number; goals: number };

/** Where a visit got to, so leaving for a case study and coming back picks up from the same spot. */
export type Progress = { x: number; z: number; heading: number; coins: boolean[]; strikes: number; goals: number };

export type World = {
  input: WorldInput;
  /** A snapshot of the car's position and the score, to hand back to `createWorld` later. */
  save: () => Progress;
  reset: () => void;
  horn: () => void;
  /** A short burst of speed, with a few seconds to recharge. */
  boost: () => void;
  setMuted: (muted: boolean) => void;
  setMusic: (on: boolean) => void;
  dispose: () => void;
};

type Options = {
  projects: Project[];
  ownerName: string;
  /** Optional 2D canvas the world draws a map onto. */
  minimap?: HTMLCanvasElement | null;
  /** Called when the nearest project in range changes. */
  onNear: (slug: string | null) => void;
  onScore: (score: Score) => void;
  /** Progress from an earlier visit to carry on from. */
  progress?: Progress | null;
};

type Station = {
  slug: string;
  x: number;
  z: number;
  tint: string;
  ring: THREE.Mesh;
  screen: THREE.Object3D;
  restY: number;
  glow: number;
  /** Idle animation of the props around the station, if they have one. */
  update?: StationProps["update"];
  /** "Enter to open" painted beside the station; missing on touch screens. */
  prompt?: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
};
type Obstacle = { x: number; z: number; r: number };
type Bumper = Obstacle & { material: THREE.MeshStandardMaterial; flash: number };
type Ramp = { x: number; z: number; heading: number; length: number; width: number; height: number };
type BoostPad = { x: number; z: number; heading: number; cooldown: number };
type Coin = { mesh: THREE.Mesh; x: number; y: number; z: number; taken: boolean };
/** A playground on the outer road. `a` is its compass angle; u runs along the road, v points outwards. */
type Zone = { name: string; a: number; x: number; z: number; group: THREE.Group };
/** Capital letters on a grid 5 wide and 7 tall, one string per row, for building words out of blocks. */
const BLOCK_LETTERS: Record<string, string[]> = {
  A: ["01110", "10001", "10001", "11111", "10001", "10001", "10001"],
  B: ["11110", "10001", "10001", "11110", "10001", "10001", "11110"],
  C: ["01110", "10001", "10000", "10000", "10000", "10001", "01110"],
  D: ["11110", "10001", "10001", "10001", "10001", "10001", "11110"],
  E: ["11111", "10000", "10000", "11110", "10000", "10000", "11111"],
  F: ["11111", "10000", "10000", "11110", "10000", "10000", "10000"],
  G: ["01110", "10001", "10000", "10111", "10001", "10001", "01111"],
  H: ["10001", "10001", "10001", "11111", "10001", "10001", "10001"],
  I: ["01110", "00100", "00100", "00100", "00100", "00100", "01110"],
  J: ["00111", "00010", "00010", "00010", "00010", "10010", "01100"],
  K: ["10001", "10010", "10100", "11000", "10100", "10010", "10001"],
  L: ["10000", "10000", "10000", "10000", "10000", "10000", "11111"],
  M: ["10001", "11011", "10101", "10101", "10001", "10001", "10001"],
  N: ["10001", "11001", "10101", "10011", "10001", "10001", "10001"],
  O: ["01110", "10001", "10001", "10001", "10001", "10001", "01110"],
  P: ["11110", "10001", "10001", "11110", "10000", "10000", "10000"],
  Q: ["01110", "10001", "10001", "10001", "10101", "10010", "01101"],
  R: ["11110", "10001", "10001", "11110", "10100", "10010", "10001"],
  S: ["01111", "10000", "10000", "01110", "00001", "00001", "11110"],
  T: ["11111", "00100", "00100", "00100", "00100", "00100", "00100"],
  U: ["10001", "10001", "10001", "10001", "10001", "10001", "01110"],
  V: ["10001", "10001", "10001", "10001", "10001", "01010", "00100"],
  W: ["10001", "10001", "10001", "10101", "10101", "10101", "01010"],
  X: ["10001", "10001", "01010", "00100", "01010", "10001", "10001"],
  Y: ["10001", "10001", "01010", "00100", "00100", "00100", "00100"],
  Z: ["11111", "00001", "00010", "00100", "01000", "10000", "11111"],
};

type Colors = { bg: string; fg: string; muted: string; accent: string; line: string; road: string };
type Painter = (ctx: CanvasRenderingContext2D, colors: Colors) => void;

type BodyKind = "crate" | "cone" | "pin" | "ball" | "block";
type Body = {
  kind: BodyKind;
  mesh: THREE.Object3D;
  x: number;
  z: number;
  vx: number;
  vz: number;
  r: number;
  mass: number;
  /** How quickly it slows down; lower rolls further. */
  friction: number;
  home: [number, number];
  /** Pins and cones fall over when hit hard enough. */
  tips: boolean;
  fallen: boolean;
  fallAngle: number;
  fallAxis: THREE.Vector3;
  spin: number;
  /** Balls in the ball pit stay inside this circle. */
  pen?: Obstacle;
};

const WORLD_RADIUS = 82;
const INNER_RING = 21;
const OUTER_RING = 39;
const PLAY_RING = 60;
const ZONE_RADIUS = 69;
const ROAD_HALF_WIDTH = 2.6;
const NEAR_DISTANCE = 8;
const CAR_RADIUS = 1.35;

const MAX_SPEED = 19;
const BOOST_SPEED = 28;
const MAX_REVERSE = 7;
const ACCELERATION = 24;
const BRAKING = 38;
const ROLLING_FRICTION = 7;
const WHEELBASE = 2;
const MAX_STEER = 0.6;
/** Share of full steering lock left at top speed. */
const TOP_SPEED_GRIP = 0.45;
/** Sideways pull of a full-lock turn at top speed: the hardest the car corners without a boost. */
const PEAK_CORNERING = ((MAX_SPEED * MAX_SPEED) / WHEELBASE) * Math.tan(MAX_STEER * TOP_SPEED_GRIP);
const GRAVITY = 22;
/** Above this height the car clears crates, balls, bumpers and the spinner. */
const CLEARANCE = 1.3;

const UP = new THREE.Vector3(0, 1, 0);
const DISPLAY_FONT = '"Space Grotesk Variable", "Inter Variable", system-ui, sans-serif';

/** Small seeded generator so the world is the same on every visit. */
function seeded(seed: number) {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function cssColor(name: string, fallback: string) {
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return new THREE.Color(value || fallback);
}

const hex = (color: THREE.Color) => `#${color.getHexString()}`;

function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawLabel(text: string, status: string | undefined) {
  const canvas = document.createElement("canvas");
  canvas.width = 768;
  canvas.height = 160;
  const ctx = canvas.getContext("2d")!;
  ctx.font = `600 64px ${DISPLAY_FONT}`;
  const textWidth = Math.min(ctx.measureText(text).width, 640);
  const dot = status ? 44 : 0;
  const width = textWidth + dot + 72;
  const left = (canvas.width - width) / 2;

  roundedRect(ctx, left, 24, width, 112, 56);
  ctx.fillStyle = "rgba(10, 13, 18, 0.88)";
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = "rgba(255, 255, 255, 0.16)";
  ctx.stroke();

  if (status) {
    ctx.beginPath();
    ctx.arc(left + 52, 80, 12, 0, Math.PI * 2);
    if (status === "Live") {
      ctx.fillStyle = "#4ade9f";
      ctx.fill();
    } else {
      ctx.lineWidth = 4;
      ctx.strokeStyle = "#909aab";
      ctx.stroke();
    }
  }

  ctx.fillStyle = "#e8ebf0";
  ctx.textBaseline = "middle";
  ctx.fillText(text, left + 36 + dot, 84, 640);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function makeLabel(text: string, status: string | undefined) {
  const material = new THREE.SpriteMaterial({ map: drawLabel(text, status), transparent: true, depthWrite: false });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(9.6, 2, 1);
  return sprite;
}

function buildCar(accent: THREE.Color) {
  const car = new THREE.Group();
  const tilt = new THREE.Group();
  car.add(tilt);

  const paint = new THREE.MeshStandardMaterial({ color: accent, roughness: 0.45, metalness: 0.1 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x151a22, roughness: 0.6 });
  const glass = new THREE.MeshStandardMaterial({ color: 0x9fd8ff, roughness: 0.15, metalness: 0.4 });
  const lamp = new THREE.MeshStandardMaterial({ color: 0xfff3c4, emissive: 0xffe9a3, emissiveIntensity: 1.6 });
  const tail = new THREE.MeshStandardMaterial({ color: 0xff5b4d, emissive: 0xff3b2f, emissiveIntensity: 0.6 });

  const body = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.55, 3.2), paint);
  body.position.y = 0.72;
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.55, 1.5), glass);
  cabin.position.set(0, 1.25, -0.25);
  const roof = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.1, 1.6), paint);
  roof.position.set(0, 1.56, -0.25);
  const bumper = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.22, 0.25), dark);
  bumper.position.set(0, 0.5, 1.65);
  const rear = bumper.clone();
  rear.position.z = -1.65;
  tilt.add(body, cabin, roof, bumper, rear);

  for (const side of [-1, 1]) {
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.18, 0.08), lamp);
    head.position.set(side * 0.55, 0.8, 1.62);
    const back = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.14, 0.08), tail);
    back.position.set(side * 0.55, 0.8, -1.62);
    tilt.add(head, back);
  }

  const wheelGeometry = new THREE.CylinderGeometry(0.42, 0.42, 0.34, 18);
  wheelGeometry.rotateZ(Math.PI / 2);
  const hubGeometry = new THREE.BoxGeometry(0.36, 0.5, 0.12);
  const wheels: THREE.Mesh[] = [];
  const steering: THREE.Group[] = [];
  for (const [x, z, front] of [
    [-0.92, 1, true],
    [0.92, 1, true],
    [-0.92, -1, false],
    [0.92, -1, false],
  ] as const) {
    const pivot = new THREE.Group();
    pivot.position.set(x, 0.42, z);
    const wheel = new THREE.Mesh(wheelGeometry, dark);
    wheel.add(new THREE.Mesh(hubGeometry, paint));
    pivot.add(wheel);
    tilt.add(pivot);
    wheels.push(wheel);
    if (front) steering.push(pivot);
  }

  car.traverse((object) => {
    if (object instanceof THREE.Mesh) object.castShadow = true;
  });

  return { car, tilt, wheels, steering, paint, tail };
}

export function createWorld(
  container: HTMLElement,
  { projects, ownerName, minimap, onNear, onScore, progress }: Options,
): World {
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.domElement.style.display = "block";
  renderer.domElement.setAttribute("aria-hidden", "true");
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const fog = new THREE.Fog(0x000000, 60, 150);
  scene.fog = fog;
  const camera = new THREE.PerspectiveCamera(38, 1, 0.5, 300);
  const sound = createSound();
  const random = seeded(7);

  const hemisphere = new THREE.HemisphereLight(0xffffff, 0x202632, 1.1);
  const sun = new THREE.DirectionalLight(0xffffff, 2.2);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -34;
  sun.shadow.camera.right = 34;
  sun.shadow.camera.top = 34;
  sun.shadow.camera.bottom = -34;
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 120;
  sun.shadow.bias = -0.0005;
  scene.add(hemisphere, sun, sun.target);

  const tints = projects.map((project) => project.tint[0]);
  const shadowed = <T extends THREE.Object3D>(object: T) => {
    object.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    return object;
  };

  // ---------------------------------------------------------------- ground

  const groundMaterial = new THREE.MeshStandardMaterial({ roughness: 0.95 });
  const ground = new THREE.Mesh(new THREE.CircleGeometry(WORLD_RADIUS + 6, 128), groundMaterial);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  const roadMaterial = new THREE.MeshStandardMaterial({ roughness: 0.9 });
  for (const radius of [INNER_RING, OUTER_RING, PLAY_RING]) {
    const road = new THREE.Mesh(
      new THREE.RingGeometry(radius - ROAD_HALF_WIDTH, radius + ROAD_HALF_WIDTH, 160),
      roadMaterial,
    );
    road.rotation.x = -Math.PI / 2;
    road.position.y = 0.01;
    road.receiveShadow = true;
    scene.add(road);
  }

  const edgeMaterial = new THREE.MeshStandardMaterial({ roughness: 0.8 });
  const edge = new THREE.Mesh(new THREE.TorusGeometry(WORLD_RADIUS + 1.2, 0.5, 8, 160), edgeMaterial);
  edge.rotation.x = Math.PI / 2;
  edge.position.y = 0.25;
  scene.add(edge);

  // Text painted on the ground, redrawn when the theme changes.
  const groundTexts: { canvas: HTMLCanvasElement; texture: THREE.CanvasTexture; draw: Painter }[] = [];

  function groundText(x: number, z: number, width: number, height: number, draw: Painter) {
    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = Math.round((1024 * height) / width);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(width, height),
      new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false }),
    );
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(x, 0.03, z);
    scene.add(mesh);
    groundTexts.push({ canvas, texture, draw });
  }

  groundText(0, 7.5, 22, 11, (ctx, colors) => {
    ctx.textAlign = "center";
    ctx.fillStyle = colors.accent;
    ctx.font = `500 34px ${DISPLAY_FONT}`;
    ctx.fillText("PORTFOLIO", 512, 150);
    ctx.fillStyle = colors.muted;
    ctx.font = `500 38px ${DISPLAY_FONT}`;
    ctx.fillText("Drive up to a project to open it", 512, 368);
  });

  // -------------------------------------------------------------- stations

  const stations: Station[] = [];
  const obstacles: Obstacle[] = [];
  const labels: { sprite: THREE.Sprite; project: Project }[] = [];
  // What the props around the stations add to the world. Held back until the scenery is placed, so they don't move it.
  const propSolids: Obstacle[] = [];
  const propBalls: (Obstacle & { color: number })[] = [];
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const featured = projects.filter((project) => project.featured);
  const others = projects.filter((project) => !project.featured);

  const textureLoader = new THREE.TextureLoader();
  const keyboard = window.matchMedia("(pointer: fine)").matches;

  // One "Enter to open" decal, shared by every station and faded in beside the one the car is at.
  const promptCanvas = document.createElement("canvas");
  promptCanvas.width = 512;
  promptCanvas.height = 112;
  const promptTexture = new THREE.CanvasTexture(promptCanvas);
  promptTexture.colorSpace = THREE.SRGBColorSpace;
  promptTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();
  const promptGeometry = new THREE.PlaneGeometry(5.6, 1.225);
  groundTexts.push({
    canvas: promptCanvas,
    texture: promptTexture,
    draw: (ctx, colors) => {
      ctx.fillStyle = colors.fg;
      ctx.strokeStyle = colors.fg;
      ctx.lineWidth = 5;
      ctx.font = `italic 700 50px ${DISPLAY_FONT}`;
      ctx.textBaseline = "middle";
      const boxWidth = ctx.measureText("ENTER").width + 56;
      ctx.strokeRect(6, 16, boxWidth, 80);
      ctx.textAlign = "center";
      ctx.fillText("ENTER", 6 + boxWidth / 2, 59);
      ctx.textAlign = "left";
      ctx.fillText("TO OPEN", boxWidth + 40, 59, 500 - boxWidth - 40);
    },
  });

  function addStation(project: Project, radius: number, angle: number, scale: number) {
    const x = Math.sin(angle) * radius;
    const z = Math.cos(angle) * radius;
    const group = new THREE.Group();
    group.position.set(x, 0, z);
    group.rotation.y = angle + Math.PI; // screens face the centre

    const [light, deep] = project.tint;
    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(2.3 * scale, 2.6 * scale, 0.4, 32),
      new THREE.MeshStandardMaterial({ color: deep, roughness: 0.7 }),
    );
    base.position.y = 0.2;
    base.castShadow = true;
    base.receiveShadow = true;

    const isWeb = !/iOS|Android/.test(project.platforms);
    const width = (isWeb ? 4.4 : 2) * scale;
    const height = (isWeb ? 2.8 : 4) * scale;
    const screen = new THREE.Group();
    const frame = new THREE.Mesh(
      new THREE.BoxGeometry(width, height, 0.28),
      new THREE.MeshStandardMaterial({ color: 0x0c0f14, roughness: 0.4, metalness: 0.3 }),
    );
    const face = new THREE.Mesh<THREE.PlaneGeometry, THREE.Material>(
      new THREE.PlaneGeometry(width - 0.24, height - 0.24),
      new THREE.MeshStandardMaterial({ color: light, emissive: light, emissiveIntensity: 0.55, roughness: 0.5 }),
    );
    face.position.z = 0.145;
    const back = face.clone();
    back.rotation.y = Math.PI;
    back.position.z = -0.145;
    frame.castShadow = true;
    screen.add(frame, face, back);

    // Show the project's first screenshot (or its logo) on both faces; the tinted glow stays until it loads, or if
    // there is neither.
    const shot = project.screenshots[0]?.src;
    const image = shot ?? project.logo;
    if (image) {
      textureLoader.load(image, (texture) => {
        if (disposed) return texture.dispose();
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
        // Crop to fill the face, keeping the top of a screenshot in view and a logo centred.
        const imageAspect = texture.image.width / texture.image.height;
        const faceAspect = (width - 0.24) / (height - 0.24);
        if (imageAspect > faceAspect) {
          texture.repeat.x = faceAspect / imageAspect;
          texture.offset.x = (1 - texture.repeat.x) / 2;
        } else {
          texture.repeat.y = imageAspect / faceAspect;
          texture.offset.y = (1 - texture.repeat.y) * (shot ? 1 : 0.5);
        }
        const placeholder = face.material;
        face.material = back.material = new THREE.MeshBasicMaterial({ map: texture });
        placeholder.dispose();
      });
    }
    const restY = 0.4 + height / 2 + 0.35;
    screen.position.y = restY;

    const ring = new THREE.Mesh(
      new THREE.RingGeometry(NEAR_DISTANCE - 0.35, NEAR_DISTANCE, 64),
      new THREE.MeshBasicMaterial({ color: light, transparent: true, opacity: 0.25, depthWrite: false }),
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.04;

    const sprite = makeLabel(project.name, project.status);
    sprite.position.y = 0.4 + height + 1.9;
    labels.push({ sprite, project });

    group.add(base, screen, ring, sprite);
    scene.add(group);

    // A little scene around the plinth that says what the app is about.
    // The last argument turns signs and the like to face the camera, which always looks north.
    const props = buildStationProps(project.slug, project.tint, -group.rotation.y);
    if (props) {
      group.add(props.group);
      group.updateMatrixWorld();
      const point = new THREE.Vector3();
      const toWorld = <T extends Obstacle>(solid: T): T => {
        group.localToWorld(point.set(solid.x, 0, solid.z));
        return { ...solid, x: point.x, z: point.z };
      };
      propSolids.push(...props.solids.map(toWorld));
      propBalls.push(...props.balls.map(toWorld));
    }
    // The camera looks north, so the prompt lies on the near side of the station, just outside the ring, where
    // neither the screen nor the parked car hides it.
    let prompt: Station["prompt"];
    if (keyboard) {
      prompt = new THREE.Mesh(
        promptGeometry,
        new THREE.MeshBasicMaterial({ map: promptTexture, transparent: true, opacity: 0, depthWrite: false }),
      );
      prompt.rotation.x = -Math.PI / 2;
      prompt.position.set(x, 0.045, z + NEAR_DISTANCE + 1.1);
      prompt.visible = false;
      scene.add(prompt);
    }

    stations.push({
      slug: project.slug,
      x,
      z,
      tint: light,
      ring,
      screen,
      restY,
      glow: 0,
      update: reducedMotion ? undefined : props?.update,
      prompt,
    });
    obstacles.push({ x, z, r: 2.6 * scale });
  }

  // Featured work on the inner ring, the rest on the outer one. The first
  // featured project sits due north, straight ahead of the start.
  featured.forEach((project, i) =>
    addStation(project, INNER_RING + 7.2, Math.PI + (i / featured.length) * Math.PI * 2, 1),
  );
  others.forEach((project, i) =>
    addStation(project, OUTER_RING + 7, Math.PI + ((i + 0.5) / others.length) * Math.PI * 2, 0.85),
  );

  // ------------------------------------------------------- things to push

  const bodies: Body[] = [];

  function addBody(
    kind: BodyKind,
    mesh: THREE.Object3D,
    x: number,
    z: number,
    physics: Pick<Body, "r" | "mass" | "friction"> & { tips?: boolean; pen?: Obstacle },
  ) {
    mesh.position.x = x;
    mesh.position.z = z;
    scene.add(shadowed(mesh));
    const body: Body = {
      kind,
      mesh,
      x,
      z,
      vx: 0,
      vz: 0,
      r: physics.r,
      mass: physics.mass,
      friction: physics.friction,
      home: [x, z],
      tips: physics.tips ?? false,
      fallen: false,
      fallAngle: 0,
      fallAxis: new THREE.Vector3(1, 0, 0),
      spin: 0,
      pen: physics.pen,
    };
    bodies.push(body);
    return body;
  }

  const crateGeometry = new THREE.BoxGeometry(1.1, 1.1, 1.1);
  const crateMaterial = new THREE.MeshStandardMaterial({ roughness: 0.7 });
  function addCrate(x: number, z: number) {
    const mesh = new THREE.Mesh(crateGeometry, crateMaterial);
    mesh.position.y = 0.55;
    return addBody("crate", mesh, x, z, { r: 0.75, mass: 1, friction: 2.4 });
  }

  // The name lies on the ground at the start as raised blocks, between the two painted lines. Each block is loose, so
  // driving into the name scatters it; going back to the start puts it together again. The tops take the text colour
  // and the sides the accent, so the letters stay readable from the camera's angle.
  const nameTopMaterial = new THREE.MeshStandardMaterial({ roughness: 0.6 });
  const nameSideMaterial = new THREE.MeshStandardMaterial({ roughness: 0.6 });
  const nameBlocks: Body[] = [];
  let nameMesh: THREE.InstancedMesh | null = null;
  {
    // Accents are dropped so every letter has a shape: "Bogdanović" is built as "BOGDANOVIC".
    const letters = [...ownerName.normalize("NFD").toUpperCase()].filter(
      (letter) => letter === " " || BLOCK_LETTERS[letter],
    );
    // Each letter is 5 blocks wide with a 1 block gap; the blocks shrink if the name would run wider than 20 metres.
    const columns = letters.length * 6 - 1;
    const size = Math.min(0.21, 20 / columns);
    const height = 0.4;
    const middle = 7.6;
    letters.forEach((letter, index) => {
      const rows = BLOCK_LETTERS[letter];
      if (!rows) return;
      const left = (index * 6 - columns / 2) * size;
      rows.forEach((row, y) => {
        for (let x = 0; x < 5; x++) {
          if (row[x] !== "1") continue;
          // All the blocks are drawn in one go, so each body moves an empty stand-in that the drawing copies from.
          const marker = new THREE.Object3D();
          marker.position.y = height / 2;
          // Just under half a block wide, so neighbours rest side by side without pushing each other apart.
          const physics = { r: size * 0.49, mass: 0.2, friction: 2.2 };
          nameBlocks.push(addBody("block", marker, left + (x + 0.5) * size, middle + (y - 3) * size, physics));
        }
      });
    });
    // A box's faces come in the order right, left, top, bottom, front, back.
    const side = nameSideMaterial;
    nameMesh = new THREE.InstancedMesh(
      new THREE.BoxGeometry(size, height, size),
      [side, side, nameTopMaterial, side, side, side],
      nameBlocks.length,
    );
    nameMesh.castShadow = true;
    nameMesh.receiveShadow = true;
    // Scattered blocks can end up far from where the name started, so it is never skipped as off screen.
    nameMesh.frustumCulled = false;
    scene.add(nameMesh);
  }

  // ------------------------------------------------- how to drive, on the ground

  // Keyboard instructions sit either side of the start. Touch screens get the on-screen pad instead.
  const HOW_TO_MOVE = { x: -12, z: -1.5, width: 12, height: 5 };
  const HOW_TO_KEYS = { x: 12.5, z: 0.6, width: 11, height: 8.4 };
  const HINT_FONT = `italic 700 72px ${DISPLAY_FONT}`;

  if (keyboard) {
    // Where the arrow keys stand, in canvas pixels of the decal below.
    const keyColumn = 580;
    const keyPitch = 100;
    const keyRows = [110, 210];

    groundText(HOW_TO_MOVE.x, HOW_TO_MOVE.z, HOW_TO_MOVE.width, HOW_TO_MOVE.height, (ctx, colors) => {
      ctx.fillStyle = colors.fg;
      ctx.font = HINT_FONT;
      ctx.textAlign = "right";
      ctx.fillText("USE YOUR", keyColumn - keyPitch * 1.5 - 30, 185, 380);
      ctx.textAlign = "left";
      ctx.fillText("KEYS", keyColumn + keyPitch * 1.5 + 30, 235, 250);
      ctx.textAlign = "center";
      ctx.fillText("TO MOVE AROUND", 470, 345, 900);
    });

    const arrowCanvas = document.createElement("canvas");
    arrowCanvas.width = arrowCanvas.height = 64;
    const arrowCtx = arrowCanvas.getContext("2d")!;
    arrowCtx.fillStyle = "#8a909b";
    arrowCtx.beginPath();
    arrowCtx.moveTo(32, 16);
    arrowCtx.lineTo(52, 46);
    arrowCtx.lineTo(12, 46);
    arrowCtx.fill();
    const arrowTexture = new THREE.CanvasTexture(arrowCanvas);
    arrowTexture.colorSpace = THREE.SRGBColorSpace;

    // A tapered square cap: a four-sided cylinder turned so its faces line up with the axes.
    const capGeometry = new THREE.CylinderGeometry(0.56, 0.74, 0.5, 4).rotateY(Math.PI / 4);
    const capMaterial = new THREE.MeshStandardMaterial({ color: 0xf1f2f4, roughness: 0.55, flatShading: true });
    const arrowGeometry = new THREE.PlaneGeometry(0.46, 0.46);
    const arrowMaterial = new THREE.MeshBasicMaterial({ map: arrowTexture, transparent: true, depthWrite: false });

    const pixel = HOW_TO_MOVE.width / 1024;
    // Column, row, and which way the arrow points (turning anticlockwise from up).
    const arrowKeys: [number, number, number][] = [
      [0, 0, 0],
      [-1, 1, Math.PI / 2],
      [0, 1, Math.PI],
      [1, 1, -Math.PI / 2],
    ];
    for (const [column, row, turn] of arrowKeys) {
      const key = new THREE.Group();
      const cap = new THREE.Mesh(capGeometry, capMaterial);
      cap.position.y = 0.25;
      const arrow = new THREE.Mesh(arrowGeometry, arrowMaterial);
      arrow.rotation.set(-Math.PI / 2, 0, turn);
      arrow.position.y = 0.505;
      key.add(cap, arrow);
      addBody(
        "crate",
        key,
        HOW_TO_MOVE.x - HOW_TO_MOVE.width / 2 + (keyColumn + column * keyPitch) * pixel,
        HOW_TO_MOVE.z - HOW_TO_MOVE.height / 2 + keyRows[row] * pixel,
        { r: 0.55, mass: 0.5, friction: 2.6 },
      );
      // The flat arrow should neither cast a shadow nor be shaded by one.
      arrow.castShadow = false;
      arrow.receiveShadow = false;
    }

    const shortcuts: [string, string][] = [
      ["W A S D", "DRIVE"],
      ["SPACE", "BRAKE"],
      ["SHIFT", "BOOST"],
      ["H", "HONK"],
      ["M", "MUTE"],
      ["R", "BACK TO START"],
      ["ENTER", "OPEN PROJECT"],
    ];
    groundText(HOW_TO_KEYS.x, HOW_TO_KEYS.z, HOW_TO_KEYS.width, HOW_TO_KEYS.height, (ctx, colors) => {
      ctx.fillStyle = colors.fg;
      ctx.strokeStyle = colors.fg;
      ctx.lineWidth = 5;
      ctx.font = `italic 700 46px ${DISPLAY_FONT}`;
      ctx.textBaseline = "middle";
      shortcuts.forEach(([key, action], index) => {
        const y = 90 + index * 100;
        const boxWidth = ctx.measureText(key).width + 52;
        ctx.strokeRect(400 - boxWidth, y - 36, boxWidth, 72);
        ctx.textAlign = "center";
        ctx.fillText(key, 400 - boxWidth / 2, y + 3);
        ctx.textAlign = "left";
        ctx.fillText(action, 450, y + 3, 540);
      });
    });
  } else {
    // Touch screens drive with the on-screen pad.
    // Phones are narrow, so the hint goes straight ahead of the car rather than off to one side.
    groundText(0, -6, 12, 3.84, (ctx, colors) => {
      ctx.fillStyle = colors.fg;
      ctx.font = HINT_FONT;
      ctx.textAlign = "center";
      ctx.fillText("USE THE BUTTONS", 512, 140, 960);
      ctx.fillText("TO DRIVE AROUND", 512, 250, 960);
    });
  }

  const coneMaterial = new THREE.MeshStandardMaterial({ color: 0xff7a1a, roughness: 0.6 });
  const coneStripe = new THREE.MeshStandardMaterial({ color: 0xf5f5f5, roughness: 0.6 });
  const coneGeometry = new THREE.ConeGeometry(0.34, 1.05, 14);
  const coneBandGeometry = new THREE.CylinderGeometry(0.17, 0.23, 0.2, 14);
  const coneFootGeometry = new THREE.BoxGeometry(0.8, 0.08, 0.8);
  function addCone(x: number, z: number) {
    const cone = new THREE.Group();
    const top = new THREE.Mesh(coneGeometry, coneMaterial);
    top.position.y = 0.6;
    const band = new THREE.Mesh(coneBandGeometry, coneStripe);
    band.position.y = 0.62;
    const foot = new THREE.Mesh(coneFootGeometry, coneMaterial);
    foot.position.y = 0.04;
    cone.add(top, band, foot);
    return addBody("cone", cone, x, z, { r: 0.42, mass: 0.3, friction: 3, tips: true });
  }

  const pinMaterial = new THREE.MeshStandardMaterial({ color: 0xf7f4ec, roughness: 0.35 });
  const pinStripe = new THREE.MeshStandardMaterial({ color: 0xd9342b, roughness: 0.4 });
  const pinBodyGeometry = new THREE.CapsuleGeometry(0.3, 0.55, 4, 12);
  const pinNeckGeometry = new THREE.CylinderGeometry(0.14, 0.24, 0.4, 12);
  const pinHeadGeometry = new THREE.SphereGeometry(0.2, 12, 10);
  function addPin(x: number, z: number) {
    const pin = new THREE.Group();
    const belly = new THREE.Mesh(pinBodyGeometry, pinMaterial);
    belly.position.y = 0.58;
    const neck = new THREE.Mesh(pinNeckGeometry, pinStripe);
    neck.position.y = 1.22;
    const head = new THREE.Mesh(pinHeadGeometry, pinMaterial);
    head.position.y = 1.5;
    pin.add(belly, neck, head);
    return addBody("pin", pin, x, z, { r: 0.34, mass: 0.4, friction: 2.2, tips: true });
  }

  function addBall(
    x: number,
    z: number,
    radius: number,
    color: THREE.ColorRepresentation,
    mass: number,
    pen?: Obstacle,
  ) {
    const mesh = new THREE.Mesh(
      new THREE.IcosahedronGeometry(radius, 1),
      new THREE.MeshStandardMaterial({ color, roughness: 0.45, flatShading: true }),
    );
    mesh.position.y = radius;
    return addBody("ball", mesh, x, z, { r: radius, mass, friction: pen ? 1.1 : 0.55, pen });
  }

  // A stack of crates and a ball pit beside the start.
  for (let row = 0; row < 3; row++) {
    for (let column = 0; column < 4 - row; column++) {
      addCrate(-11 + (column - (3 - row) / 2) * 1.55, -9 - row * 1.55);
    }
  }

  const pit: Obstacle = { x: 11.5, z: -9.5, r: 5.4 };
  const pitKerb = new THREE.Mesh(
    new THREE.TorusGeometry(pit.r + 0.2, 0.22, 8, 48),
    new THREE.MeshStandardMaterial({ color: 0x8a94a6, roughness: 0.6 }),
  );
  pitKerb.rotation.x = Math.PI / 2;
  pitKerb.position.set(pit.x, 0.12, pit.z);
  scene.add(pitKerb);
  for (let attempt = 0, placed = 0; placed < 30 && attempt < 400; attempt++) {
    const x = pit.x + (random() * 2 - 1) * (pit.r - 0.8);
    const z = pit.z + (random() * 2 - 1) * (pit.r - 0.8);
    if (Math.hypot(x - pit.x, z - pit.z) > pit.r - 0.8) continue;
    if (bodies.some((body) => Math.hypot(body.x - x, body.z - z) < body.r + 0.62)) continue;
    addBall(x, z, 0.6, tints[placed % tints.length], 0.25, pit);
    placed++;
  }

  // ---------------------------------------------------------- playgrounds

  const zones: Zone[] = [];
  const ramps: Ramp[] = [];
  const boostPads: BoostPad[] = [];
  const bumpers: Bumper[] = [];
  const coins: Coin[] = [];

  function addZone(name: string, degrees: number) {
    const a = (degrees * Math.PI) / 180;
    const group = new THREE.Group();
    const x = Math.sin(a) * ZONE_RADIUS;
    const z = Math.cos(a) * ZONE_RADIUS;
    group.position.set(x, 0, z);
    group.rotation.y = a; // local +z points outwards, local +x runs along the road
    scene.add(group);
    const zone = { name, a, x, z, group };
    zones.push(zone);
    groundText(x, z + 13.5, 16, 3, (ctx, colors) => {
      ctx.textAlign = "center";
      ctx.fillStyle = colors.muted;
      ctx.font = `700 120px ${DISPLAY_FONT}`;
      ctx.fillText(name.toUpperCase(), 512, 140, 980);
    });
    return zone;
  }

  /** Zone coordinates to world coordinates. */
  function at(zone: Zone, u: number, v: number): [number, number] {
    return [zone.x + Math.cos(zone.a) * u + Math.sin(zone.a) * v, zone.z - Math.sin(zone.a) * u + Math.cos(zone.a) * v];
  }

  // Boost pads share one chevron texture.
  const padCanvas = document.createElement("canvas");
  padCanvas.width = 128;
  padCanvas.height = 256;
  const padTexture = new THREE.CanvasTexture(padCanvas);
  padTexture.colorSpace = THREE.SRGBColorSpace;
  const padMaterial = new THREE.MeshBasicMaterial({ map: padTexture, transparent: true, depthWrite: false });
  const padGeometry = new THREE.PlaneGeometry(3.4, 6);
  padGeometry.rotateX(-Math.PI / 2);
  padGeometry.rotateY(Math.PI); // the texture's "up" becomes local +z, the direction of travel

  function addBoostPad(x: number, z: number, heading: number) {
    const mesh = new THREE.Mesh(padGeometry, padMaterial);
    mesh.position.set(x, 0.035, z);
    mesh.rotation.y = heading;
    scene.add(mesh);
    boostPads.push({ x, z, heading, cooldown: 0 });
  }

  const coinGeometry = new THREE.CylinderGeometry(0.62, 0.62, 0.14, 20);
  coinGeometry.rotateX(Math.PI / 2);
  const coinMaterial = new THREE.MeshStandardMaterial({
    color: 0xffc83d,
    emissive: 0xffa200,
    emissiveIntensity: 0.5,
    roughness: 0.3,
    metalness: 0.6,
  });
  function addCoin(x: number, z: number, y = 1.1) {
    const mesh = new THREE.Mesh(coinGeometry, coinMaterial);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    scene.add(mesh);
    coins.push({ mesh, x, y, z, taken: false });
  }

  const rampMaterial = new THREE.MeshStandardMaterial({ color: 0x8a94a6, roughness: 0.7 });
  function addRamp(zone: Zone, u: number, v: number, direction: 1 | -1) {
    const length = 7;
    const width = 4.2;
    const height = 2.2;
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.lineTo(length, 0);
    shape.lineTo(length, height);
    shape.closePath();
    const geometry = new THREE.ExtrudeGeometry(shape, { depth: width, bevelEnabled: false });
    geometry.rotateY(-Math.PI / 2);
    geometry.translate(width / 2, 0, 0);
    const mesh = new THREE.Mesh(geometry, rampMaterial);
    const [x, z] = at(zone, u, v);
    const heading = zone.a + (direction * Math.PI) / 2;
    mesh.position.set(x, 0, z);
    mesh.rotation.y = heading;
    scene.add(shadowed(mesh));
    ramps.push({ x, z, heading, length, width, height });
    addBoostPad(...at(zone, u - direction * 5, v), heading);
  }

  // Bowling: a lane running outwards, ten pins and a heavy ball.
  const bowling = addZone("Bowling", 135);
  const lane = new THREE.Mesh(
    new THREE.PlaneGeometry(6.5, 19),
    new THREE.MeshStandardMaterial({ color: 0xd7a86e, roughness: 0.35 }),
  );
  lane.rotation.x = -Math.PI / 2;
  lane.position.y = 0.02;
  lane.receiveShadow = true;
  bowling.group.add(lane);
  for (const side of [-1, 1]) {
    const gutter = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, 0.25, 19),
      new THREE.MeshStandardMaterial({ color: 0x3a2d22, roughness: 0.6 }),
    );
    gutter.position.set(side * 3.4, 0.12, 0);
    bowling.group.add(shadowed(gutter));
  }
  const pins: Body[] = [];
  for (let row = 0; row < 4; row++) {
    for (let i = 0; i <= row; i++) pins.push(addPin(...at(bowling, i - row / 2, 4.5 + row * 0.9)));
  }
  const bowlingBall = addBall(...at(bowling, 0, -6), 0.95, 0x2b3a67, 3);

  // Football: a pitch with a goal at each end.
  const football = addZone("Football", 225);
  const pitchCanvas = document.createElement("canvas");
  pitchCanvas.width = 1024;
  pitchCanvas.height = 768;
  {
    const ctx = pitchCanvas.getContext("2d")!;
    for (let stripe = 0; stripe < 8; stripe++) {
      ctx.fillStyle = stripe % 2 ? "#2f8f4e" : "#2a8246";
      ctx.fillRect(stripe * 128, 0, 128, 768);
    }
    ctx.strokeStyle = "rgba(255,255,255,0.85)";
    ctx.lineWidth = 8;
    ctx.strokeRect(20, 20, 984, 728);
    ctx.beginPath();
    ctx.moveTo(512, 20);
    ctx.lineTo(512, 748);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(512, 384, 110, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeRect(20, 224, 130, 320);
    ctx.strokeRect(874, 224, 130, 320);
  }
  const pitchTexture = new THREE.CanvasTexture(pitchCanvas);
  pitchTexture.colorSpace = THREE.SRGBColorSpace;
  const pitch = new THREE.Mesh(
    new THREE.PlaneGeometry(22, 16),
    new THREE.MeshStandardMaterial({ map: pitchTexture, roughness: 0.9 }),
  );
  pitch.rotation.x = -Math.PI / 2;
  pitch.position.y = 0.02;
  pitch.receiveShadow = true;
  football.group.add(pitch);
  const GOAL_LINE = 10.6;
  const GOAL_HALF_WIDTH = 2.6;
  const postMaterial = new THREE.MeshStandardMaterial({ color: 0xf4f4f4, roughness: 0.4 });
  for (const side of [-1, 1]) {
    for (const end of [-1, 1]) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 2.4, 10), postMaterial);
      post.position.set(side * GOAL_LINE, 1.2, end * GOAL_HALF_WIDTH);
      football.group.add(shadowed(post));
      const [x, z] = at(football, side * GOAL_LINE, end * GOAL_HALF_WIDTH);
      obstacles.push({ x, z, r: 0.25 });
    }
    const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, GOAL_HALF_WIDTH * 2, 10), postMaterial);
    bar.rotation.x = Math.PI / 2;
    bar.position.set(side * GOAL_LINE, 2.4, 0);
    const net = new THREE.Mesh(
      new THREE.BoxGeometry(1.8, 2.3, GOAL_HALF_WIDTH * 2),
      new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.18, depthWrite: false }),
    );
    net.position.set(side * (GOAL_LINE + 0.95), 1.15, 0);
    football.group.add(shadowed(bar), net);
  }
  const footballBall = addBall(...at(football, 0, 0), 0.85, 0xf5f5f5, 0.5);

  // Stunt park: two ramps, crates to clear, a hoop, and coins in the air.
  const stunts = addZone("Stunt park", 315);
  addRamp(stunts, -11, -3.5, 1);
  for (let i = 0; i < 5; i++) addCrate(...at(stunts, 0.5 + i * 1.6, -3.5));
  addCoin(...at(stunts, 1.5, -3.5), 4.2);
  addRamp(stunts, 11, 4.5, -1);
  {
    const hoop = new THREE.Mesh(
      new THREE.TorusGeometry(2.5, 0.2, 10, 40),
      new THREE.MeshStandardMaterial({ color: 0xffc83d, emissive: 0xffa200, emissiveIntensity: 0.4, roughness: 0.4 }),
    );
    hoop.rotation.y = Math.PI / 2;
    hoop.position.set(-1.5, 4, 4.5);
    stunts.group.add(shadowed(hoop));
    for (const side of [-1, 1]) {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 4, 8), postMaterial);
      pole.position.set(-1.5, 2, 4.5 + side * 2.7);
      stunts.group.add(shadowed(pole));
      const [x, z] = at(stunts, -1.5, 4.5 + side * 2.7);
      obstacles.push({ x, z, r: 0.2 });
    }
    addCoin(...at(stunts, -1.5, 4.5), 4);
  }

  // Bumpers: bounce pads around a spinning arm.
  const bumperZone = addZone("Bumpers", 45);
  const bumperGeometry = new THREE.CylinderGeometry(1.25, 1.45, 1.3, 24);
  const bumperCapGeometry = new THREE.CylinderGeometry(1.45, 1.45, 0.2, 24);
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2 + 0.3;
    const [x, z] = at(bumperZone, Math.cos(angle) * 8.2, Math.sin(angle) * 7.2);
    const material = new THREE.MeshStandardMaterial({
      color: tints[i % tints.length],
      emissive: tints[i % tints.length],
      emissiveIntensity: 0.25,
      roughness: 0.4,
    });
    const post = new THREE.Mesh(bumperGeometry, material);
    post.position.set(x, 0.65, z);
    const cap = new THREE.Mesh(bumperCapGeometry, postMaterial);
    cap.position.set(x, 1.4, z);
    scene.add(shadowed(post), shadowed(cap));
    bumpers.push({ x, z, r: 1.4, material, flash: 0 });
    if (i % 2 === 0) addCoin(...at(bumperZone, Math.cos(angle + 0.52) * 5.6, Math.sin(angle + 0.52) * 5));
  }
  const spinner = {
    x: bumperZone.x,
    z: bumperZone.z,
    angle: 0,
    speed: 1.5,
    offsets: [-3.6, -2.4, -1.2, 1.2, 2.4, 3.6],
    r: 0.65,
    arm: new THREE.Group(),
  };
  {
    const hub = new THREE.Mesh(
      new THREE.CylinderGeometry(0.7, 0.9, 1.5, 16),
      new THREE.MeshStandardMaterial({ color: 0x2a3140, roughness: 0.5 }),
    );
    hub.position.set(spinner.x, 0.75, spinner.z);
    scene.add(shadowed(hub));
    obstacles.push({ x: spinner.x, z: spinner.z, r: 0.9 });
    const beam = new THREE.Mesh(
      new THREE.BoxGeometry(8.4, 0.5, 0.7),
      new THREE.MeshStandardMaterial({ color: 0xe5484d, roughness: 0.5 }),
    );
    beam.position.y = 0.85;
    spinner.arm.add(beam);
    spinner.arm.position.set(spinner.x, 0, spinner.z);
    scene.add(shadowed(spinner.arm));
  }

  // Roads: coins between the stations, boost pads, and slaloms of cones.
  const radians = (degrees: number) => (degrees * Math.PI) / 180;
  const onRing = (radius: number, degrees: number): [number, number] => [
    Math.sin(radians(degrees)) * radius,
    Math.cos(radians(degrees)) * radius,
  ];
  /** Heading that follows a ring road anticlockwise at the given compass angle. */
  const along = (degrees: number) => radians(degrees + 90);

  for (let i = 0; i < featured.length; i++) addCoin(...onRing(INNER_RING, 30 + (i * 360) / featured.length));
  for (let i = 0; i < others.length; i++) addCoin(...onRing(OUTER_RING, 180 + (i * 360) / others.length));
  for (const degrees of [0, 90, 180, 270]) {
    addCoin(...onRing(PLAY_RING, degrees - 14));
    addCoin(...onRing(PLAY_RING, degrees + 14));
    addBoostPad(...onRing(PLAY_RING, degrees), along(degrees));
  }
  addBoostPad(...onRing(INNER_RING, 90), along(90));
  addBoostPad(...onRing(INNER_RING, 270), along(270));
  addBoostPad(...onRing(OUTER_RING, 25.7), along(25.7));
  addBoostPad(...onRing(OUTER_RING, 231.4), along(231.4));
  addCoin(pit.x, pit.z);
  for (let i = 0; i < 9; i++) addCone(...onRing(PLAY_RING + (i % 2 ? 1.4 : -1.4), 164 + i * 4));
  for (let i = 0; i < 7; i++) addCone(...onRing(OUTER_RING + (i % 2 ? 1.3 : -1.3), 66 + i * 4));

  // Scenery: trees and rocks, kept clear of roads, stations and playgrounds.
  const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x6b4a34, roughness: 0.9 });
  const leafMaterial = new THREE.MeshStandardMaterial({ roughness: 0.8, flatShading: true });
  const rockMaterial = new THREE.MeshStandardMaterial({ roughness: 0.95, flatShading: true });
  const trunkGeometry = new THREE.CylinderGeometry(0.22, 0.3, 1.2, 6);
  const leafGeometry = new THREE.ConeGeometry(1.25, 2.8, 7);
  const rockGeometry = new THREE.DodecahedronGeometry(0.9, 0);
  const keepClear: Obstacle[] = [
    ...zones.map((zone) => ({ x: zone.x, z: zone.z, r: zone === stunts ? 30 : 20 })),
    { x: pit.x, z: pit.z, r: pit.r + 2 },
    { x: -11, z: -10.5, r: 5 },
    { x: 0, z: 7.5, r: 12 },
    { x: 0, z: 0, r: 6 },
    { x: HOW_TO_MOVE.x, z: HOW_TO_MOVE.z, r: 7 },
    { x: HOW_TO_KEYS.x, z: HOW_TO_KEYS.z, r: 7 },
  ];

  let scenery = 0;
  for (let attempt = 0; attempt < 1200 && scenery < 45; attempt++) {
    const distance = 8 + random() * (WORLD_RADIUS - 10);
    const angle = random() * Math.PI * 2;
    const x = Math.sin(angle) * distance;
    const z = Math.cos(angle) * distance;
    const onRoad = [INNER_RING, OUTER_RING, PLAY_RING].some((radius) => Math.abs(distance - radius) < 6.5);
    const crowded =
      obstacles.some((o) => Math.hypot(o.x - x, o.z - z) < o.r + NEAR_DISTANCE + 3) ||
      keepClear.some((o) => Math.hypot(o.x - x, o.z - z) < o.r);
    // Leave a clear run from the start to the first project, due north.
    const onRunway = Math.abs(x) < 4.5 && z < 0 && z > -34;
    if (onRoad || crowded || onRunway) continue;

    const size = 0.75 + random() * 0.7;
    if (random() < 0.7) {
      const tree = new THREE.Group();
      const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
      trunk.position.y = 0.6;
      const leaves = new THREE.Mesh(leafGeometry, leafMaterial);
      leaves.position.y = 2.4;
      const top = new THREE.Mesh(leafGeometry, leafMaterial);
      top.position.y = 3.5;
      top.scale.setScalar(0.7);
      for (const part of [trunk, leaves, top]) part.castShadow = true;
      tree.add(trunk, leaves, top);
      tree.position.set(x, 0, z);
      tree.scale.setScalar(size);
      tree.rotation.y = random() * Math.PI;
      scene.add(tree);
      obstacles.push({ x, z, r: 0.5 * size });
    } else {
      const rock = new THREE.Mesh(rockGeometry, rockMaterial);
      rock.position.set(x, 0.35 * size, z);
      rock.scale.set(size, size * 0.7, size);
      rock.rotation.set(random() * 3, random() * 3, random() * 3);
      rock.castShadow = true;
      rock.receiveShadow = true;
      scene.add(rock);
      obstacles.push({ x, z, r: 0.85 * size });
    }
    scenery++;
  }

  obstacles.push(...propSolids);
  for (const ball of propBalls) addBall(ball.x, ball.z, ball.r, ball.color, 0.6);

  // -------------------------------------------------------------- confetti

  const CONFETTI = 260;
  const confettiPositions = new Float32Array(CONFETTI * 3).fill(-999);
  const confettiColors = new Float32Array(CONFETTI * 3);
  const confettiVelocity = new Float32Array(CONFETTI * 3);
  const confettiLife = new Float32Array(CONFETTI);
  const confettiGeometry = new THREE.BufferGeometry();
  confettiGeometry.setAttribute("position", new THREE.BufferAttribute(confettiPositions, 3));
  confettiGeometry.setAttribute("color", new THREE.BufferAttribute(confettiColors, 3));
  const confetti = new THREE.Points(
    confettiGeometry,
    new THREE.PointsMaterial({ size: 0.42, vertexColors: true, transparent: true, depthWrite: false }),
  );
  confetti.frustumCulled = false;
  scene.add(confetti);
  let confettiNext = 0;
  const scratchColor = new THREE.Color();
  const scratchAxis = new THREE.Vector3();

  function burstConfetti(x: number, y: number, z: number, count: number) {
    for (let n = 0; n < count; n++) {
      const i = confettiNext;
      confettiNext = (confettiNext + 1) % CONFETTI;
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 7;
      confettiPositions.set([x, y, z], i * 3);
      confettiVelocity.set([Math.cos(angle) * speed, 7 + Math.random() * 9, Math.sin(angle) * speed], i * 3);
      scratchColor.set(tints[Math.floor(Math.random() * tints.length)]);
      confettiColors.set([scratchColor.r, scratchColor.g, scratchColor.b], i * 3);
      confettiLife[i] = 1.6 + Math.random();
    }
    confettiGeometry.attributes.color.needsUpdate = true;
  }

  function stepConfetti(dt: number) {
    for (let i = 0; i < CONFETTI; i++) {
      if (confettiLife[i] <= 0) continue;
      confettiLife[i] -= dt;
      const p = i * 3;
      confettiVelocity[p + 1] -= 16 * dt;
      confettiPositions[p] += confettiVelocity[p] * dt;
      confettiPositions[p + 1] += confettiVelocity[p + 1] * dt;
      confettiPositions[p + 2] += confettiVelocity[p + 2] * dt;
      if (confettiLife[i] <= 0 || confettiPositions[p + 1] < 0) {
        confettiLife[i] = 0;
        confettiPositions[p + 1] = -999;
      }
    }
    confettiGeometry.attributes.position.needsUpdate = true;
  }

  // ----------------------------------------------------------------- theme

  const vehicle = buildCar(cssColor("--accent", "#4ade9f"));
  scene.add(vehicle.car);
  const theme: Colors = {
    bg: "#0a0d12",
    fg: "#e8ebf0",
    muted: "#909aab",
    accent: "#4ade9f",
    line: "#232a36",
    road: "#171c25",
  };

  function applyTheme() {
    const bg = cssColor("--bg", "#0a0d12");
    const surface = cssColor("--surface", "#10141b");
    const raised = cssColor("--raised", "#171c25");
    const line = cssColor("--line", "#232a36");
    const fg = cssColor("--fg", "#e8ebf0");
    const muted = cssColor("--muted", "#909aab");
    const accent = cssColor("--accent", "#4ade9f");
    const light = document.documentElement.dataset.theme === "light";

    scene.background = bg;
    fog.color.copy(bg);
    groundMaterial.color.copy(light ? line : surface);
    roadMaterial.color.copy(light ? surface : raised);
    edgeMaterial.color.copy(light ? muted : line);
    nameTopMaterial.color.copy(fg);
    nameSideMaterial.color.copy(accent);
    rockMaterial.color.set(light ? 0xb6bdc9 : 0x3a4252);
    leafMaterial.color.set(light ? 0x3f9d6c : 0x1f6b4a);
    crateMaterial.color.set(light ? 0xe0a04a : 0xc98a3a);
    vehicle.paint.color.copy(accent);
    hemisphere.intensity = light ? 1.25 : 1.1;
    sun.intensity = light ? 1.9 : 2.2;

    theme.bg = hex(bg);
    theme.fg = hex(fg);
    theme.muted = hex(muted);
    theme.accent = hex(accent);
    theme.line = hex(line);
    theme.road = hex(light ? surface : raised);

    for (const text of groundTexts) {
      const ctx = text.canvas.getContext("2d")!;
      ctx.clearRect(0, 0, text.canvas.width, text.canvas.height);
      text.draw(ctx, theme);
      text.texture.needsUpdate = true;
    }

    const ctx = padCanvas.getContext("2d")!;
    ctx.clearRect(0, 0, 128, 256);
    ctx.fillStyle = `${theme.accent}33`;
    roundedRect(ctx, 4, 4, 120, 248, 18);
    ctx.fill();
    ctx.strokeStyle = theme.accent;
    ctx.lineWidth = 14;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    for (const y of [70, 130, 190]) {
      ctx.beginPath();
      ctx.moveTo(30, y + 26);
      ctx.lineTo(64, y - 14);
      ctx.lineTo(98, y + 26);
      ctx.stroke();
    }
    padTexture.needsUpdate = true;
  }
  applyTheme();
  const themeObserver = new MutationObserver(applyTheme);
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

  // Labels and ground text are drawn again once the display font has loaded.
  let disposed = false;
  document.fonts
    ?.load(`600 64px ${DISPLAY_FONT}`)
    .then(() => {
      if (disposed) return;
      applyTheme();
      for (const { sprite, project } of labels) {
        sprite.material.map?.dispose();
        sprite.material.map = drawLabel(project.name, project.status);
        sprite.material.needsUpdate = true;
      }
    })
    .catch(() => {});

  // --------------------------------------------------------------- driving

  const input: WorldInput = { up: false, down: false, left: false, right: false, brake: false };
  // The camera sits to the south, so the car starts facing north, away from it.
  const START_HEADING = Math.PI;
  const car = {
    x: 0,
    z: 0,
    y: 0,
    vy: 0,
    heading: START_HEADING,
    speed: 0,
    steer: 0,
    lean: 0,
    pitch: 0,
    /** Shove from bumpers and the spinner, on top of the car's own motion. */
    kx: 0,
    kz: 0,
    boost: 0,
    airborne: false,
  };
  /** Seconds until the tyres may chirp again. */
  let squeakWait = 0;
  let wasStopping = false;
  const cameraTarget = new THREE.Vector3();
  let near: string | null = null;
  let clock = 0;
  let pinsDown = 0;
  let pinTimer = 0;
  let strikes = 0;
  let goals = 0;
  let goalTimer = 0;
  let lastScore = "";

  function emitScore() {
    const score: Score = {
      coins: coins.filter((coin) => coin.taken).length,
      coinsTotal: coins.length,
      pins: pinsDown,
      strikes,
      goals,
    };
    const key = JSON.stringify(score);
    if (key === lastScore) return;
    lastScore = key;
    onScore(score);
  }

  function restBody(body: Body) {
    body.x = body.home[0];
    body.z = body.home[1];
    body.vx = 0;
    body.vz = 0;
    body.spin = 0;
    body.fallen = false;
    body.fallAngle = 0;
    body.mesh.quaternion.identity();
    body.mesh.position.x = body.x;
    body.mesh.position.z = body.z;
  }

  // Boosting by hand needs a moment to recharge, so it stays a treat rather than the normal way to drive.
  const BOOST_RECHARGE = 4;
  let boostWait = 0;
  function boost() {
    if (boostWait > 0 || car.airborne || car.speed < 0) return;
    boostWait = BOOST_RECHARGE;
    car.boost = 1.2;
    car.speed = Math.max(car.speed, BOOST_SPEED);
    sound.boost();
  }

  function reset() {
    boostWait = 0;
    Object.assign(car, { x: 0, z: 0, y: 0, vy: 0, heading: START_HEADING, speed: 0, steer: 0, lean: 0 });
    Object.assign(car, { kx: 0, kz: 0, boost: 0, pitch: 0, airborne: false });
    bodies.forEach(restBody);
    pinsDown = 0;
    pinTimer = 0;
    cameraTarget.set(0, 0, 0);
  }

  function save(): Progress {
    return {
      x: car.x,
      z: car.z,
      heading: car.heading,
      coins: coins.map((coin) => coin.taken),
      strikes,
      goals,
    };
  }

  // Carry on from an earlier visit: the car parked where it was left, with the coins and score it had.
  if (progress && progress.coins.length === coins.length) {
    car.x = progress.x;
    car.z = progress.z;
    car.y = heightAt(car.x, car.z);
    car.heading = progress.heading;
    cameraTarget.set(car.x, car.y * 0.5, car.z);
    coins.forEach((coin, index) => {
      coin.taken = progress.coins[index];
      coin.mesh.visible = !coin.taken;
    });
    strikes = progress.strikes;
    goals = progress.goals;
  }

  function heightAt(x: number, z: number) {
    let height = 0;
    for (const ramp of ramps) {
      const dx = x - ramp.x;
      const dz = z - ramp.z;
      const forward = dx * Math.sin(ramp.heading) + dz * Math.cos(ramp.heading);
      const across = dx * Math.cos(ramp.heading) - dz * Math.sin(ramp.heading);
      if (forward >= 0 && forward <= ramp.length && Math.abs(across) <= ramp.width / 2) {
        height = Math.max(height, (forward / ramp.length) * ramp.height);
      }
    }
    return height;
  }

  /** Pushes a body away from a fixed circle and bounces it. Returns true on contact. */
  function bounceOff(body: Body, x: number, z: number, radius: number, restitution: number, minimumSpeed = 0) {
    const dx = body.x - x;
    const dz = body.z - z;
    const distance = Math.hypot(dx, dz);
    const minimum = radius + body.r;
    if (distance >= minimum || distance < 0.0001) return false;
    const nx = dx / distance;
    const nz = dz / distance;
    body.x = x + nx * minimum;
    body.z = z + nz * minimum;
    const approaching = body.vx * nx + body.vz * nz;
    if (approaching < 0 || minimumSpeed > 0) {
      const out = Math.max(-approaching * restitution, minimumSpeed);
      body.vx += nx * (out - approaching);
      body.vz += nz * (out - approaching);
    }
    return true;
  }

  function knockOver(body: Body, impact: number) {
    if (!body.tips || body.fallen || impact < 1.6) return;
    const speed = Math.hypot(body.vx, body.vz) || 1;
    body.fallen = true;
    body.fallAxis.set(body.vz / speed, 0, -body.vx / speed);
    if (body.kind !== "pin") return;
    pinsDown++;
    pinTimer = 6;
    if (pinsDown === pins.length) {
      strikes++;
      sound.fanfare();
      burstConfetti(body.x, 1.5, body.z, 110);
    }
  }

  function step(dt: number) {
    clock += dt;
    const grounded = !car.airborne;
    const throttle = (input.up ? 1 : 0) - (input.down ? 1 : 0);
    const turn = (input.left ? 1 : 0) - (input.right ? 1 : 0);

    if (grounded) {
      if (input.brake) {
        car.speed -= Math.sign(car.speed) * Math.min(Math.abs(car.speed), BRAKING * dt);
      } else if (throttle !== 0) {
        const opposing = Math.sign(car.speed) !== 0 && Math.sign(car.speed) !== throttle;
        const next = car.speed + throttle * (opposing ? BRAKING : ACCELERATION) * dt;
        // The engine alone tops out at MAX_SPEED; only a boost goes beyond it.
        car.speed = car.speed > MAX_SPEED ? Math.min(car.speed, next) : Math.min(next, MAX_SPEED);
      } else {
        car.speed -= Math.sign(car.speed) * Math.min(Math.abs(car.speed), ROLLING_FRICTION * dt);
      }
    }
    car.boost = Math.max(0, car.boost - dt);
    boostWait = Math.max(0, boostWait - dt);
    if (car.speed > MAX_SPEED && car.boost === 0) car.speed = Math.max(MAX_SPEED, car.speed - 14 * dt);
    car.speed = THREE.MathUtils.clamp(car.speed, -MAX_REVERSE, BOOST_SPEED);

    // Steering eases in, and tightens less at speed so the car stays controllable.
    const grip = 1 - (1 - TOP_SPEED_GRIP) * Math.min(Math.abs(car.speed) / MAX_SPEED, 1);
    car.steer = THREE.MathUtils.damp(car.steer, turn * MAX_STEER * grip, 9, dt);
    const turnRate = grounded ? (car.speed / WHEELBASE) * Math.tan(car.steer) : 0;
    car.heading += turnRate * dt;
    const lean = THREE.MathUtils.clamp(turnRate * car.speed * 0.012, -0.14, 0.14);
    car.lean = THREE.MathUtils.damp(car.lean, lean, 6, dt);

    // A tyre chirps now and then while a hard turn is held at speed, and once when the car is braked hard at speed.
    // The brakes sometimes squeak as they bring the car to a stop.
    const pace = Math.abs(car.speed);
    const stopping = grounded && (input.brake || (throttle !== 0 && car.speed * throttle < 0));
    const cornering = Math.abs(turnRate * car.speed) / PEAK_CORNERING;
    squeakWait = Math.max(0, squeakWait - dt);
    if (grounded && squeakWait === 0 && (cornering > 0.55 || (stopping && !wasStopping && pace > MAX_SPEED * 0.5))) {
      sound.squeak("tyre");
      squeakWait = 0.7 + Math.random() * 1.3;
    }
    if (stopping && pace < 2.5 && pace + BRAKING * dt >= 2.5 && Math.random() < 0.6) sound.squeak("brake");
    wasStopping = stopping;

    const decay = Math.exp(-3.2 * dt);
    car.kx *= decay;
    car.kz *= decay;
    const carVx = Math.sin(car.heading) * car.speed + car.kx;
    const carVz = Math.cos(car.heading) * car.speed + car.kz;
    car.x += carVx * dt;
    car.z += carVz * dt;

    // Ramps and jumps: follow the ground while on it, fly once it drops away.
    const floor = heightAt(car.x, car.z);
    if (car.y <= floor + 0.02) {
      if (car.airborne && car.vy < -7) sound.bump(Math.min(-car.vy / 16, 1));
      const climb = THREE.MathUtils.clamp((floor - car.y) / dt, 0, Math.abs(car.speed) * 0.4);
      car.vy = floor > 0.01 ? climb : 0;
      car.y = floor;
      car.airborne = false;
    } else {
      car.airborne = true;
      car.vy -= GRAVITY * dt;
      car.y = Math.max(floor, car.y + car.vy * dt);
    }
    const pitch = car.airborne || floor > 0.01 ? Math.atan2(car.vy, Math.max(Math.abs(car.speed), 4)) : 0;
    car.pitch = THREE.MathUtils.damp(car.pitch, THREE.MathUtils.clamp(pitch, -0.5, 0.5), 8, dt);

    for (const pad of boostPads) {
      pad.cooldown = Math.max(0, pad.cooldown - dt);
      if (pad.cooldown > 0 || car.airborne || car.speed < 2) continue;
      const dx = car.x - pad.x;
      const dz = car.z - pad.z;
      const forward = dx * Math.sin(pad.heading) + dz * Math.cos(pad.heading);
      const across = dx * Math.cos(pad.heading) - dz * Math.sin(pad.heading);
      const facing = Math.cos(car.heading - pad.heading);
      if (Math.abs(forward) < 3 && Math.abs(across) < 1.9 && facing > 0.5) {
        pad.cooldown = 1.5;
        car.boost = 1.7;
        car.speed = Math.max(car.speed, BOOST_SPEED);
        sound.boost();
      }
    }

    // Solid things: stations, trees, rocks and posts push the car back out.
    for (const obstacle of obstacles) {
      const dx = car.x - obstacle.x;
      const dz = car.z - obstacle.z;
      const distance = Math.hypot(dx, dz);
      const minimum = obstacle.r + CAR_RADIUS;
      if (distance < minimum && distance > 0.0001) {
        car.x = obstacle.x + (dx / distance) * minimum;
        car.z = obstacle.z + (dz / distance) * minimum;
        if (Math.abs(car.speed) > 1.5) sound.bump(Math.abs(car.speed) / MAX_SPEED);
        car.speed *= 0.6;
      }
    }

    const low = car.y < CLEARANCE;
    spinner.angle += spinner.speed * dt;
    spinner.arm.rotation.y = -spinner.angle;
    const armX = Math.cos(spinner.angle);
    const armZ = Math.sin(spinner.angle);

    if (low) {
      for (const bumper of bumpers) {
        const dx = car.x - bumper.x;
        const dz = car.z - bumper.z;
        const distance = Math.hypot(dx, dz);
        const minimum = bumper.r + CAR_RADIUS;
        if (distance < minimum && distance > 0.0001) {
          car.x = bumper.x + (dx / distance) * minimum;
          car.z = bumper.z + (dz / distance) * minimum;
          car.kx = (dx / distance) * 17;
          car.kz = (dz / distance) * 17;
          car.speed *= 0.3;
          bumper.flash = 1;
          sound.boing();
        }
      }
      for (const offset of spinner.offsets) {
        const px = spinner.x + armX * offset;
        const pz = spinner.z + armZ * offset;
        const dx = car.x - px;
        const dz = car.z - pz;
        const distance = Math.hypot(dx, dz);
        const minimum = spinner.r + CAR_RADIUS;
        if (distance < minimum && distance > 0.0001) {
          car.x = px + (dx / distance) * minimum;
          car.z = pz + (dz / distance) * minimum;
          // The arm's own speed at this point, plus a shove straight out.
          car.kx = -armZ * offset * spinner.speed * 1.6 + (dx / distance) * 7;
          car.kz = armX * offset * spinner.speed * 1.6 + (dz / distance) * 7;
          car.speed *= 0.5;
          sound.bump(0.6);
        }
      }
    }
    for (const bumper of bumpers) {
      bumper.flash = Math.max(0, bumper.flash - dt * 3);
      bumper.material.emissiveIntensity = 0.25 + bumper.flash * 2.2;
    }

    const fromCentre = Math.hypot(car.x, car.z);
    if (fromCentre > WORLD_RADIUS - CAR_RADIUS) {
      const limit = (WORLD_RADIUS - CAR_RADIUS) / fromCentre;
      car.x *= limit;
      car.z *= limit;
      if (Math.abs(car.speed) > 1.5) sound.bump(Math.abs(car.speed) / MAX_SPEED);
      car.speed *= 0.6;
    }

    stepBodies(dt, carVx, carVz, low, armX, armZ);

    for (const coin of coins) {
      if (coin.taken) continue;
      coin.mesh.rotation.y += dt * 2.6;
      coin.mesh.position.y = coin.y + Math.sin(clock * 2.4 + coin.x) * 0.12;
      if (Math.hypot(car.x - coin.x, car.z - coin.z) < 1.9 && Math.abs(car.y + 0.9 - coin.y) < 1.9) {
        coin.taken = true;
        coin.mesh.visible = false;
        if (coins.every((other) => other.taken)) {
          sound.fanfare();
          burstConfetti(car.x, 2, car.z, 200);
        } else {
          sound.coin();
          burstConfetti(coin.x, coin.y, coin.z, 12);
        }
      }
    }

    // Football: a ball over either goal line, between the posts, scores.
    if (goalTimer > 0) {
      goalTimer -= dt;
      if (goalTimer <= 0) restBody(footballBall);
    } else {
      const dx = footballBall.x - football.x;
      const dz = footballBall.z - football.z;
      const u = dx * Math.cos(football.a) - dz * Math.sin(football.a);
      const v = dx * Math.sin(football.a) + dz * Math.cos(football.a);
      if (Math.abs(u) > GOAL_LINE && Math.abs(u) < GOAL_LINE + 2.4 && Math.abs(v) < GOAL_HALF_WIDTH - 0.4) {
        goals++;
        goalTimer = 1.6;
        sound.fanfare();
        burstConfetti(footballBall.x, 1.5, footballBall.z, 120);
      } else if (Math.abs(u) > 17 || Math.abs(v) > 14) {
        restBody(footballBall);
      }
    }

    // Bowling: stand the pins back up a few seconds after the last one fell.
    if (pinTimer > 0) {
      pinTimer -= dt;
      if (pinTimer <= 0) {
        pins.forEach(restBody);
        restBody(bowlingBall);
        pinsDown = 0;
      }
    }

    // Which project, if any, is the car parked next to?
    let closest: Station | null = null;
    let closestDistance = NEAR_DISTANCE;
    for (const station of stations) {
      const distance = Math.hypot(car.x - station.x, car.z - station.z);
      if (distance < closestDistance) {
        closest = station;
        closestDistance = distance;
      }
    }
    const slug = closest?.slug ?? null;
    if (slug !== near) {
      near = slug;
      onNear(slug);
      if (slug) sound.chime();
    }
    for (const station of stations) {
      station.glow = THREE.MathUtils.damp(station.glow, station === closest ? 1 : 0, 8, dt);
      (station.ring.material as THREE.MeshBasicMaterial).opacity = 0.22 + station.glow * 0.7;
      station.ring.scale.setScalar(1 - station.glow * 0.06);
      station.screen.position.y = station.restY + station.glow * 0.5;
      station.update?.(clock, station.glow);
      if (station.prompt) {
        station.prompt.material.opacity = station.glow;
        station.prompt.visible = station.glow > 0.01;
      }
    }

    stepConfetti(dt);
    emitScore();
  }

  function stepBodies(dt: number, carVx: number, carVz: number, carIsLow: boolean, armX: number, armZ: number) {
    // The car shoves whatever it touches.
    if (carIsLow) {
      for (const body of bodies) {
        const dx = body.x - car.x;
        const dz = body.z - car.z;
        const distance = Math.hypot(dx, dz);
        const minimum = CAR_RADIUS + body.r;
        if (distance >= minimum || distance < 0.0001) continue;
        const nx = dx / distance;
        const nz = dz / distance;
        body.x = car.x + nx * minimum;
        body.z = car.z + nz * minimum;
        const closing = (carVx - body.vx) * nx + (carVz - body.vz) * nz;
        if (closing > 0) {
          const push = closing * 1.3 + 0.8;
          body.vx += nx * push;
          body.vz += nz * push;
          body.spin = (body.vx - body.vz) * 0.35;
          car.speed *= 1 - Math.min(0.1, 0.03 * body.mass);
          sound.knock(Math.min(closing / MAX_SPEED, 1) * (body.kind === "ball" ? 0.5 : 1));
          knockOver(body, closing);
        }
      }
    }

    for (let i = 0; i < bodies.length; i++) {
      const body = bodies[i];
      for (let j = i + 1; j < bodies.length; j++) {
        const other = bodies[j];
        const dx = other.x - body.x;
        const dz = other.z - body.z;
        const minimum = body.r + other.r;
        if (Math.abs(dx) >= minimum || Math.abs(dz) >= minimum) continue;
        const distance = Math.hypot(dx, dz);
        if (distance >= minimum || distance < 0.0001) continue;
        const nx = dx / distance;
        const nz = dz / distance;
        const total = body.mass + other.mass;
        const overlap = minimum - distance;
        body.x -= nx * overlap * (other.mass / total);
        body.z -= nz * overlap * (other.mass / total);
        other.x += nx * overlap * (body.mass / total);
        other.z += nz * overlap * (body.mass / total);
        const closing = (body.vx - other.vx) * nx + (body.vz - other.vz) * nz;
        if (closing > 0) {
          const impulse = (1.6 * closing) / (1 / body.mass + 1 / other.mass);
          body.vx -= (nx * impulse) / body.mass;
          body.vz -= (nz * impulse) / body.mass;
          other.vx += (nx * impulse) / other.mass;
          other.vz += (nz * impulse) / other.mass;
          knockOver(body, closing);
          knockOver(other, closing);
          if (closing > 3) sound.knock(Math.min(closing / MAX_SPEED, 1) * 0.6);
        }
      }

      const speed = Math.hypot(body.vx, body.vz);
      if (speed > 0.01) {
        body.x += body.vx * dt;
        body.z += body.vz * dt;
        const slow = Math.exp(-body.friction * (body.fallen ? 1.8 : 1) * dt);
        body.vx *= slow;
        body.vz *= slow;
        body.spin *= slow;

        for (const obstacle of obstacles) bounceOff(body, obstacle.x, obstacle.z, obstacle.r, 0.45);
        for (const bumper of bumpers) {
          if (bounceOff(body, bumper.x, bumper.z, bumper.r, 1, 9)) bumper.flash = 1;
        }
        const distance = Math.hypot(body.x, body.z);
        if (distance > WORLD_RADIUS - body.r) {
          const limit = (WORLD_RADIUS - body.r) / distance;
          body.x *= limit;
          body.z *= limit;
          body.vx *= -0.4;
          body.vz *= -0.4;
        }
      }

      // The spinning arm sweeps bodies along whether or not they are moving.
      for (const offset of spinner.offsets) {
        const px = spinner.x + armX * offset;
        const pz = spinner.z + armZ * offset;
        if (bounceOff(body, px, pz, spinner.r, 0.5, 2)) {
          body.vx += -armZ * offset * spinner.speed;
          body.vz += armX * offset * spinner.speed;
          knockOver(body, 4);
        }
      }

      if (body.pen) {
        const dx = body.x - body.pen.x;
        const dz = body.z - body.pen.z;
        const distance = Math.hypot(dx, dz);
        const limit = body.pen.r - body.r;
        if (distance > limit) {
          const nx = dx / distance;
          const nz = dz / distance;
          body.x = body.pen.x + nx * limit;
          body.z = body.pen.z + nz * limit;
          const outward = body.vx * nx + body.vz * nz;
          if (outward > 0) {
            body.vx -= nx * outward * 1.6;
            body.vz -= nz * outward * 1.6;
          }
        }
      }

      body.mesh.position.x = body.x;
      body.mesh.position.z = body.z;
      if (body.tips) {
        body.fallAngle = THREE.MathUtils.damp(body.fallAngle, body.fallen ? Math.PI / 2 : 0, 9, dt);
        body.mesh.quaternion.setFromAxisAngle(body.fallAxis, body.fallAngle);
        body.mesh.position.y = Math.sin(body.fallAngle) * body.r;
      } else if (body.kind === "ball" && speed > 0.05) {
        scratchAxis.set(body.vz / speed, 0, -body.vx / speed);
        body.mesh.rotateOnWorldAxis(scratchAxis, (speed * dt) / body.r);
      } else if (body.kind === "crate" || body.kind === "block") {
        body.mesh.rotateOnWorldAxis(UP, body.spin * dt);
      }
    }
  }

  /** Copies where each block of the name is onto the one mesh that draws them all. */
  function drawName() {
    if (!nameMesh) return;
    nameBlocks.forEach((block, index) => {
      block.mesh.updateMatrix();
      nameMesh!.setMatrixAt(index, block.mesh.matrix);
    });
    nameMesh.instanceMatrix.needsUpdate = true;
  }

  function draw(dt: number) {
    const speedRatio = Math.min(Math.abs(car.speed) / MAX_SPEED, 1.5);
    sound.engine(speedRatio, input.up !== input.down && !input.brake);
    drawName();

    vehicle.car.position.set(car.x, car.y, car.z);
    vehicle.car.rotation.y = car.heading;
    vehicle.tilt.rotation.set(-car.pitch, 0, car.lean);
    for (const wheel of vehicle.wheels) wheel.rotation.x += (car.speed / 0.42) * dt;
    for (const pivot of vehicle.steering) pivot.rotation.y = car.steer;
    vehicle.tail.emissiveIntensity = input.brake || (input.down && car.speed > 0.5) ? 2.4 : 0.6;

    // Fixed-angle camera that trails the car, looks a little ahead of it, and
    // pulls back slightly while boosting.
    const lead = car.speed * 0.28;
    cameraTarget.x = THREE.MathUtils.damp(cameraTarget.x, car.x + Math.sin(car.heading) * lead, 3.5, dt);
    cameraTarget.z = THREE.MathUtils.damp(cameraTarget.z, car.z + Math.cos(car.heading) * lead, 3.5, dt);
    cameraTarget.y = THREE.MathUtils.damp(cameraTarget.y, car.y * 0.5, 4, dt);
    const pullBack = Math.max(1, 1.35 / camera.aspect) * (1 + Math.max(0, speedRatio - 1) * 0.25);
    camera.position.set(cameraTarget.x, 36 * pullBack + cameraTarget.y, cameraTarget.z + 31 * pullBack);
    // On tall screens the camera backs away; the fog backs away with it, or the whole scene would sit in the haze.
    fog.near = 60 * pullBack;
    fog.far = 150 * pullBack;
    camera.lookAt(cameraTarget.x, 0.5 + cameraTarget.y, cameraTarget.z);

    sun.position.set(car.x + 24, 40, car.z + 10);
    sun.target.position.set(car.x, 0, car.z);
    renderer.render(scene, camera);
  }

  // ---------------------------------------------------------------- minimap

  const mapContext = minimap?.getContext("2d") ?? null;

  function drawMinimap() {
    if (!minimap || !mapContext) return;
    const size = minimap.clientWidth || 150;
    const ratio = Math.min(window.devicePixelRatio, 2);
    if (minimap.width !== Math.round(size * ratio)) {
      minimap.width = Math.round(size * ratio);
      minimap.height = Math.round(size * ratio);
    }
    const ctx = mapContext;
    const scale = (size / 2 - 5) / WORLD_RADIUS;
    ctx.setTransform(ratio, 0, 0, ratio, (size / 2) * ratio, (size / 2) * ratio);
    ctx.clearRect(-size, -size, size * 2, size * 2);

    ctx.beginPath();
    ctx.arc(0, 0, WORLD_RADIUS * scale, 0, Math.PI * 2);
    ctx.fillStyle = `${theme.bg}d9`;
    ctx.fill();
    ctx.strokeStyle = theme.line;
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.strokeStyle = theme.road;
    ctx.lineWidth = Math.max(2, ROAD_HALF_WIDTH * 2 * scale);
    for (const radius of [INNER_RING, OUTER_RING, PLAY_RING]) {
      ctx.beginPath();
      ctx.arc(0, 0, radius * scale, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.strokeStyle = theme.muted;
    ctx.lineWidth = 1.2;
    for (const zone of zones) ctx.strokeRect(zone.x * scale - 6, zone.z * scale - 5, 12, 10);
    ctx.fillStyle = "#ffc83d";
    for (const coin of coins) {
      if (!coin.taken) ctx.fillRect(coin.x * scale - 0.9, coin.z * scale - 0.9, 1.8, 1.8);
    }
    for (const station of stations) {
      ctx.beginPath();
      ctx.arc(station.x * scale, station.z * scale, station.slug === near ? 4.5 : 3, 0, Math.PI * 2);
      ctx.fillStyle = station.tint;
      ctx.fill();
    }

    ctx.save();
    ctx.translate(car.x * scale, car.z * scale);
    ctx.rotate(-car.heading);
    ctx.beginPath();
    ctx.moveTo(0, 6);
    ctx.lineTo(4, -4);
    ctx.lineTo(0, -1.5);
    ctx.lineTo(-4, -4);
    ctx.closePath();
    ctx.fillStyle = theme.fg;
    ctx.fill();
    ctx.restore();
  }

  // ------------------------------------------------------------- lifecycle

  function resize() {
    const width = container.clientWidth || 1;
    const height = container.clientHeight || 1;
    renderer.setSize(width, height, false);
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(container);
  resize();

  const keys: Record<string, keyof WorldInput> = {
    ArrowUp: "up",
    KeyW: "up",
    ArrowDown: "down",
    KeyS: "down",
    ArrowLeft: "left",
    KeyA: "left",
    ArrowRight: "right",
    KeyD: "right",
    Space: "brake",
  };

  function isControl(target: EventTarget | null) {
    return target instanceof HTMLElement && target.closest("a, button, input, textarea, select") !== null;
  }

  function onKeyDown(event: KeyboardEvent) {
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    if (event.code === "KeyR") return reset();
    if (event.code === "KeyH") {
      if (!event.repeat) sound.horn();
      return;
    }
    if (event.code === "ShiftLeft" || event.code === "ShiftRight") {
      if (!event.repeat) boost();
      return;
    }
    const action = keys[event.code];
    if (!action) return;
    // Space keeps working on focused buttons and links.
    if (event.code === "Space" && isControl(event.target)) return;
    input[action] = true;
    event.preventDefault();
  }

  function onKeyUp(event: KeyboardEvent) {
    const action = keys[event.code];
    if (action) input[action] = false;
  }

  function releaseAll() {
    for (const key of Object.keys(input) as (keyof WorldInput)[]) input[key] = false;
  }

  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);
  window.addEventListener("blur", releaseAll);
  // Browsers only start audio after a key press or tap.
  window.addEventListener("keydown", sound.unlock);
  window.addEventListener("pointerdown", sound.unlock);

  let frame = 0;
  let frames = 0;
  let last = performance.now();
  function tick(now: number) {
    frame = requestAnimationFrame(tick);
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    // Two smaller steps keep fast, boosted collisions from tunnelling.
    step(dt / 2);
    step(dt / 2);
    draw(dt);
    if (frames++ % 4 === 0) drawMinimap();
  }
  frame = requestAnimationFrame(tick);

  function dispose() {
    disposed = true;
    cancelAnimationFrame(frame);
    window.removeEventListener("keydown", onKeyDown);
    window.removeEventListener("keyup", onKeyUp);
    window.removeEventListener("blur", releaseAll);
    window.removeEventListener("keydown", sound.unlock);
    window.removeEventListener("pointerdown", sound.unlock);
    sound.dispose();
    resizeObserver.disconnect();
    themeObserver.disconnect();
    scene.traverse((object) => {
      if (object instanceof THREE.Mesh || object instanceof THREE.Sprite || object instanceof THREE.Points) {
        object.geometry.dispose();
        for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
          (material as THREE.Material & { map?: THREE.Texture | null }).map?.dispose();
          material.dispose();
        }
      }
    });
    renderer.dispose();
    renderer.domElement.remove();
  }

  // Development only: lets tests place the car without driving there.
  if (import.meta.env.DEV) Object.assign(window, { __play: { car, zones, at } });

  return { input, save, reset, horn: sound.horn, boost, setMuted: sound.setMuted, setMusic: sound.setMusic, dispose };
}
