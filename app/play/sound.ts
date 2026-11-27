/**
 * Sound for the 3D world, synthesised with the Web Audio API so there are no
 * audio files to download. Browsers only allow audio after a user gesture, so
 * nothing is created until `unlock()` is called from a key press or tap.
 */
export type Sound = {
  unlock: () => void;
  setMuted: (muted: boolean) => void;
  /** speed is 0 to 1 of top speed; throttle is true while accelerating. */
  engine: (speed: number, throttle: boolean) => void;
  /** Hitting something solid. strength is 0 to 1. */
  bump: (strength: number) => void;
  /** Knocking a crate. strength is 0 to 1. */
  knock: (strength: number) => void;
  /** Arriving at a project. */
  chime: () => void;
  /** Picking up a coin. */
  coin: () => void;
  /** Driving over a boost pad. */
  boost: () => void;
  /** Bouncing off a bumper. */
  boing: () => void;
  /** A goal, a strike, or the last coin. */
  fanfare: () => void;
  horn: () => void;
  /** Background music, separate from the sound effects. */
  setMusic: (on: boolean) => void;
  dispose: () => void;
};

const VOLUME = 0.55;
/** Music sits well under the effects. */
const MUSIC_VOLUME = 0.3;
/** Length of a sixteenth note in seconds: a relaxed 84 beats per minute. */
const BEAT = 60 / 84 / 4;
/** Am7, Fmaj7, Cmaj7, G6: one bar each, looping. */
const CHORDS = [
  [220.0, 261.63, 329.63, 392.0],
  [174.61, 220.0, 261.63, 329.63],
  [130.81, 164.81, 196.0, 246.94],
  [196.0, 246.94, 293.66, 329.63],
];
/** Which chord tone the pluck plays on each sixteenth; 4 and up are an octave higher, null is a rest. */
const ARPEGGIO = [0, null, 2, null, 1, null, 3, null, 2, null, 4, null, 1, null, 2, 3];

export function createSound(): Sound {
  let context: AudioContext | null = null;
  let master: GainNode | null = null;
  let engineGain: GainNode | null = null;
  let engineFilter: BiquadFilterNode | null = null;
  let oscillators: OscillatorNode[] = [];
  let noise: AudioBuffer | null = null;
  let muted = false;
  let lastBump = 0;
  let lastKnock = 0;
  let musicGain: GainNode | null = null;
  let musicOn = true;
  let musicTimer = 0;
  let nextBeat = 0;
  let beat = 0;

  function unlock() {
    if (context) {
      if (context.state === "suspended") void context.resume();
      return;
    }
    const AudioContextClass =
      window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    context = new AudioContextClass();
    master = context.createGain();
    master.gain.value = muted ? 0 : VOLUME;
    master.connect(context.destination);

    // Engine: two detuned saws and a sub, through a low-pass that opens with speed.
    engineFilter = context.createBiquadFilter();
    engineFilter.type = "lowpass";
    engineFilter.frequency.value = 300;
    engineFilter.Q.value = 1.2;
    engineGain = context.createGain();
    engineGain.gain.value = 0;
    engineFilter.connect(engineGain).connect(master);
    oscillators = (
      [
        ["sawtooth", 1, 0.5],
        ["sawtooth", 1.012, 0.5],
        ["square", 0.5, 0.35],
      ] as const
    ).map(([type, ratio, level]) => {
      const oscillator = context!.createOscillator();
      oscillator.type = type;
      oscillator.frequency.value = 48 * ratio;
      const gain = context!.createGain();
      gain.gain.value = level;
      oscillator.connect(gain).connect(engineFilter!);
      oscillator.start();
      (oscillator as OscillatorNode & { ratio: number }).ratio = ratio;
      return oscillator;
    });

    // One second of white noise, reused for impacts.
    noise = context.createBuffer(1, context.sampleRate, context.sampleRate);
    const data = noise.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;

    // Music has its own quiet bus, through a soft low-pass so it sits behind the effects.
    musicGain = context.createGain();
    musicGain.gain.value = musicOn ? MUSIC_VOLUME : 0;
    const musicFilter = context.createBiquadFilter();
    musicFilter.type = "lowpass";
    musicFilter.frequency.value = 1800;
    musicGain.connect(musicFilter).connect(master);
    nextBeat = context.currentTime + 0.4;
    musicTimer = window.setInterval(scheduleMusic, 120);
  }

  /** One note on the music bus: a soft attack for pads, a quick one for plucks. */
  function note(
    type: OscillatorType,
    frequency: number,
    start: number,
    duration: number,
    level: number,
    attack: number,
  ) {
    if (!context || !musicGain) return;
    const oscillator = context.createOscillator();
    oscillator.type = type;
    oscillator.frequency.value = frequency;
    const gain = context.createGain();
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(level, start + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(gain).connect(musicGain);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.05);
  }

  /** Schedules the next few beats a little ahead of time so the rhythm stays steady. */
  function scheduleMusic() {
    if (!context || context.state !== "running") return;
    if (nextBeat < context.currentTime) nextBeat = context.currentTime + 0.05;
    while (nextBeat < context.currentTime + 0.5) {
      const chord = CHORDS[Math.floor(beat / 16) % CHORDS.length];
      const step = beat % 16;
      if (musicOn) {
        if (step === 0) {
          for (const frequency of chord) note("sine", frequency, nextBeat, BEAT * 16.5, 0.16, 0.9);
          note("triangle", chord[0] / 2, nextBeat, BEAT * 15, 0.2, 0.4);
        }
        const pattern = ARPEGGIO[step];
        if (pattern !== null) {
          note(
            "triangle",
            chord[pattern % chord.length] * (pattern >= chord.length ? 4 : 2),
            nextBeat,
            BEAT * 2.4,
            0.1,
            0.01,
          );
        }
      }
      nextBeat += BEAT;
      beat++;
    }
  }

  function setMusic(on: boolean) {
    musicOn = on;
    if (context && musicGain) musicGain.gain.setTargetAtTime(on ? MUSIC_VOLUME : 0, context.currentTime, 0.25);
  }

  function setMuted(value: boolean) {
    muted = value;
    if (context && master) master.gain.setTargetAtTime(value ? 0 : VOLUME, context.currentTime, 0.03);
  }

  function engine(speed: number, throttle: boolean) {
    if (!context || !engineGain || !engineFilter) return;
    const now = context.currentTime;
    const pitch = 48 + speed * 105 + (throttle ? 8 : 0);
    for (const oscillator of oscillators) {
      const ratio = (oscillator as OscillatorNode & { ratio: number }).ratio;
      oscillator.frequency.setTargetAtTime(pitch * ratio, now, 0.08);
    }
    engineFilter.frequency.setTargetAtTime(260 + speed * 900 + (throttle ? 250 : 0), now, 0.1);
    engineGain.gain.setTargetAtTime(0.035 + speed * 0.05 + (throttle ? 0.02 : 0), now, 0.1);
  }

  function burst(duration: number, frequency: number, level: number) {
    if (!context || !master || !noise) return;
    const now = context.currentTime;
    const source = context.createBufferSource();
    source.buffer = noise;
    const filter = context.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = frequency;
    const gain = context.createGain();
    gain.gain.setValueAtTime(level, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    source.connect(filter).connect(gain).connect(master);
    source.start(now, Math.random() * 0.5, duration);
  }

  function tone(type: OscillatorType, from: number, to: number, duration: number, level: number, delay = 0) {
    if (!context || !master) return;
    const start = context.currentTime + delay;
    const oscillator = context.createOscillator();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(from, start);
    oscillator.frequency.exponentialRampToValueAtTime(to, start + duration);
    const gain = context.createGain();
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(level, start + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(gain).connect(master);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.05);
  }

  function bump(strength: number) {
    if (!context || context.currentTime - lastBump < 0.18) return;
    lastBump = context.currentTime;
    const level = 0.25 + Math.min(strength, 1) * 0.55;
    tone("sine", 130, 45, 0.22, level);
    burst(0.14, 900, level * 0.6);
  }

  function knock(strength: number) {
    if (!context || context.currentTime - lastKnock < 0.07) return;
    lastKnock = context.currentTime;
    const level = 0.12 + Math.min(strength, 1) * 0.3;
    const pitch = 190 + Math.random() * 90;
    tone("triangle", pitch, pitch * 0.55, 0.11, level);
    burst(0.06, 2400, level * 0.5);
  }

  function chime() {
    tone("sine", 659.25, 659.25, 0.5, 0.16);
    tone("sine", 987.77, 987.77, 0.7, 0.14, 0.09);
  }

  function coin() {
    tone("triangle", 1318.5, 1318.5, 0.09, 0.14);
    tone("triangle", 1760, 1760, 0.22, 0.14, 0.07);
  }

  function boost() {
    tone("sawtooth", 180, 720, 0.45, 0.1);
    burst(0.45, 3200, 0.16);
  }

  function boing() {
    if (!context || context.currentTime - lastBump < 0.1) return;
    lastBump = context.currentTime;
    tone("sine", 320, 760, 0.16, 0.3);
    tone("square", 160, 380, 0.12, 0.06);
  }

  function fanfare() {
    [523.25, 659.25, 783.99, 1046.5].forEach((note, i) => tone("triangle", note, note, 0.32, 0.18, i * 0.11));
    tone("triangle", 1318.5, 1318.5, 0.7, 0.16, 0.46);
  }

  function horn() {
    tone("square", 392, 392, 0.3, 0.1);
    tone("square", 494, 494, 0.3, 0.1);
  }

  function dispose() {
    for (const oscillator of oscillators) oscillator.stop();
    oscillators = [];
    window.clearInterval(musicTimer);
    void context?.close();
    context = null;
  }

  return { unlock, setMuted, engine, bump, knock, chime, coin, boost, boing, fanfare, horn, setMusic, dispose };
}
