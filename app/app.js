'use strict';

/* ------------------------------------------------------------------ *
 * Earth Information Jukebox
 * image -> analysis plan -> Web Audio synthesis (real time or offline)
 * ------------------------------------------------------------------ */

const COLS = 64;
const ROWS = 32;
const NOTE_NAMES = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];
const SCALES = {
  Dorian:     [0, 2, 3, 5, 7, 9, 10],
  Mixolydian: [0, 2, 4, 5, 7, 9, 10],
  Lydian:     [0, 2, 4, 6, 7, 9, 11],
  Aeolian:    [0, 2, 3, 5, 7, 8, 10],
};
const VOICE_LABEL = {
  pad: 'warm pad', pluck: 'green pluck', bell: 'glass bell', soft: 'soft choir',
  violin: 'violin', viola: 'viola', cello: 'cello', contrabass: 'double bass',
  brass: 'brass', flute: 'flute', acoustic_pluck: 'acoustic guitar',
  acoustic_strum: 'acoustic strum', electric_pluck: 'electric guitar',
  electric_sustain: 'sustained electric guitar', scanner: 'bridge scanner ping',
};
const VOICE_PLURAL = {
  pad: 'warm pads', pluck: 'green plucks', bell: 'glass bells', soft: 'soft choirs',
  violin: 'violins', viola: 'violas', cello: 'cellos', contrabass: 'double basses',
  brass: 'brass notes', flute: 'flutes', acoustic_pluck: 'acoustic guitar plucks',
  acoustic_strum: 'acoustic strums', electric_pluck: 'electric guitar plucks',
  electric_sustain: 'sustained electric guitar notes', scanner: 'bridge scanner pings',
};
const VOICE_COLOR = {
  pad: '#ffb454', pluck: '#8bd17c', bell: '#6cc7ff', soft: '#c39bff',
  violin: '#ff9f68', viola: '#e98a5b', cello: '#d46b45', contrabass: '#a85d3a',
  brass: '#ffd166', flute: '#7bdff2', acoustic_pluck: '#d6a461',
  acoustic_strum: '#edbd78', electric_pluck: '#f071c7', electric_sustain: '#d65db1', scanner: '#83f7ff',
};
const SUSTAINED_VOICES = new Set([
  'pad', 'soft', 'violin', 'viola', 'cello', 'contrabass', 'brass', 'flute', 'electric_sustain',
]);

const B = 'frames/';
const CURATED_TRACKS = [
  { id: 'nightlights', file: 'nightlights.jpg', title: 'Cities Waking Up', svs: 5313,
    alt: 'World map on a dark background. Scattered purple lights show places where night lights grew between 2012 and 2023, mostly in India, China and Africa. Orange lights show places where lights went out, such as parts of Ukraine. Two zoomed insets show Ukraine and India.',
    science: 'This map compares nighttime lights observed in 2012 and 2023. Purple areas gained light and orange areas lost it, revealing changes associated with development, electrification, conflict, and other human activity.',
    listen: 'Listen for sparse, bright notes where the strongest changes stand out against the dark map.' },
  { id: 'pm25', file: 'pm25.jpg', title: 'Haze Belt', svs: 5533,
    alt: 'World map of fine particle pollution (PM2.5) on 15 August 2023, in cream to deep orange. Darker orange patches sit over Siberia, Canada, central Africa, India and eastern China.',
    science: 'This modeled air-quality frame shows fine particulate matter, or PM2.5, on 15 August 2023. Darker orange regions mark visually stronger concentrations of particles associated with sources such as smoke, dust, and pollution.',
    listen: 'Listen for thick, sustained tones as the playhead crosses the broad orange haze belts.' },
  { id: 'no2', file: 'no2.jpg', title: 'Green Breath', svs: 5533,
    alt: 'World map of nitrogen dioxide in bright green. Dark green hot spots mark eastern North America, Europe, India and China. Faint straight lines trace shipping lanes. Antarctica is white and black.',
    science: 'This air-quality model frame visualizes nitrogen dioxide. The strongest green patterns cluster around densely populated and industrial regions, while faint linear features trace major shipping routes.',
    listen: 'Listen for busier plucks where concentrated regions and shipping-lane patterns break from the background.' },
  { id: 'ocean_beauty', file: 'ocean_beauty.jpg', title: 'Gulf Stream Eddies', svs: 5425,
    alt: 'Satellite view of the US East Coast on the left. To the right, glowing blue streamlines of the Gulf Stream curl into dozens of swirling eddies over a dark ocean.',
    science: 'This visualization reveals the Gulf Stream and its rotating eddies off the eastern United States. The bright streamlines make the current’s narrow path, bends, and detached swirls visible against the dark ocean.',
    listen: 'Listen for flowing bells and choir-like tones as bright current structures enter and leave the playhead.' },
  { id: 'ocean_temp', file: 'ocean_temp.jpg', title: 'Pacific Currents', svs: 5425,
    alt: 'Globe centered on the western Pacific. Ocean currents are drawn as thin streaks, orange and yellow for warm water, purple and blue for cooler water. The Kuroshio runs bright orange off Japan.',
    science: 'This globe combines sea-surface currents with temperature. Warm currents appear orange and yellow, cooler water appears purple and blue, and the bright Kuroshio carries warm water past Japan.',
    listen: 'Listen for instrument changes as warm and cool current colors alternate across the Pacific.' },
  { id: 'atlantic', file: 'atlantic.jpg', title: 'Atlantic Ribbons', svs: 3912,
    alt: 'Wide flat map of the North Atlantic. Ocean currents are drawn as streaks, blue and cold in the north, green in the middle, orange and hot near the equator. The Gulf Stream is a bright swirling ribbon leaving Florida.',
    science: 'This visualization pairs North Atlantic surface currents with sea-surface temperature. Colors transition from warm tropical water to colder northern water, while the Gulf Stream forms a bright, energetic ribbon leaving Florida.',
    listen: 'Listen for the mix to shift from warm pads to cooler voices as the playhead moves west to east.' },
  { id: 'river', file: 'river.jpg', title: 'Atmospheric River', svs: 4960,
    alt: 'View of the Pacific and western North America. A long bright blue band labeled "atmospheric river" stretches diagonally toward the coast between a low pressure center (L) and a high (H). White wind streaks follow the edge of the band.',
    science: 'This Earth-system model shows an atmospheric river carrying a long, concentrated corridor of water vapor from the Pacific toward western North America. Wind patterns steer the moisture between high- and low-pressure systems.',
    listen: 'Listen for one broad, sustained gesture as the diagonal moisture corridor crosses the playhead.' },
  { id: 'co2', file: 'co2.jpg', title: 'Western Smoke', svs: 5196,
    alt: 'Model view of the western United States with snowy mountains. A brown carbon dioxide field drifts across the map, with orange plumes associated with fires along the California coast.',
    science: 'This global model visualization makes atmospheric carbon dioxide transport visible. In this western United States frame, concentrated plumes near fires mingle with broader patterns moved by the atmosphere.',
    listen: 'Listen for low, heavy pads where the brown and orange plume structures differ most from the landscape.' },
  { id: 'gedi', file: 'gedi.jpg', title: 'Canopy Height', svs: 4950,
    alt: 'Tilted 3D view of California and the ocean, black sky beyond. Forests rise from the ground as fields of green spikes. Tallest trees on the northern coast glow pale yellow. Dry interior land is flat and brown.',
    science: 'NASA’s GEDI mission measures forest structure from space. In this view, the height and color of the raised forest canopy distinguish taller coastal forests from lower or sparsely vegetated interior regions.',
    listen: 'Listen for quick, dense plucks where the textured green canopy rises above smoother land and ocean.' },
  { id: 'lightning', file: 'lightning.jpg', title: 'Lightning from Space', svs: 5011,
    alt: 'Dark gray world map with dashed lines at the tropics and a solid line at the equator. Small yellow dots show lightning seen from the International Space Station. They cluster over the Amazon, central Africa, Indonesia and the Gulf Stream region.',
    science: 'Yellow points mark lightning events detected from the International Space Station between 2017 and 2023. Clusters reveal regions where storms produced many detected flashes, especially across the tropics and some ocean-current zones.',
    listen: 'Listen for isolated, sharp notes as bright lightning clusters interrupt the quiet background.' },
];
CURATED_TRACKS.forEach(t => { t.collection = 'curated'; });
const TRACKS = [...CURATED_TRACKS, ...window.DAILY_TRACKS];
// Per-track character. Every field is optional; missing ones fall back to DEFAULT_STYLE.
//   voices: allowed instruments (null = chosen by hue)   gate: percentile a cell must beat to sound (higher = sparser)
//   drone: drone level multiplier (0 = none)             tempo: multiplier on the tempo measured from the image
//   shift: semitones added to the pitch range            reverb: reverb send level
const DEFAULT_STYLE = {
  vibe: '', voices: null, maxNotes: 3, gate: 0.6, kick: true, hat: true,
  drone: 1, tempo: 1, shift: 0, reverb: 0.35, tone: 1,
  bpm: null, rootPc: null, scaleName: null, orchestra: false,
};
const STYLES = {
  nightlights:  { vibe: 'Sparse glass pings, high and bright, no drums.',
                  voices: ['bell'], maxNotes: 2, gate: 0.8, kick: false, hat: false, drone: 0.5, tempo: 0.85, shift: 12, reverb: 0.55 },
  pm25:         { vibe: 'Thick, slow warm pads. Heavy air.',
                  voices: ['pad', 'soft'], gate: 0.5, kick: false, hat: false, drone: 1.4, tempo: 0.8, reverb: 0.5 },
  no2:          { vibe: 'Bouncy plucks over a steady beat, like traffic.',
                  voices: ['pluck', 'bell'], maxNotes: 2, gate: 0.55, tempo: 1.0 },
  ocean_beauty: { vibe: 'Rolling bells and choir. Water, no drums.',
                  voices: ['bell', 'soft'], gate: 0.5, kick: false, hat: false, drone: 0.8, tempo: 0.9, reverb: 0.6 },
  ocean_temp:   { vibe: 'Balanced mix of every voice, light beat.',
                  hat: false },
  atlantic:     { vibe: 'Driving plucks and pads with full drums. Warm water is loud.',
                  voices: ['pluck', 'pad'], gate: 0.5, tempo: 1.1 },
  river:        { vibe: 'Wide, slow choir and pad. One long gesture.',
                  voices: ['soft', 'pad'], kick: false, hat: false, drone: 1, tempo: 0.9, reverb: 0.5 },
  co2:          { vibe: 'Dark and heavy: low pads, long drone, almost no motion.',
                  voices: ['pad'], maxNotes: 2, gate: 0.7, kick: false, hat: false, drone: 1.6, tempo: 0.75, reverb: 0.5 },
  gedi:         { vibe: 'Marimba-like plucks, fast and dense, like a forest.',
                  voices: ['pluck'], gate: 0.45, kick: false, drone: 0.4, tempo: 1.15, reverb: 0.25 },
  lightning:    { vibe: 'A few sharp clicks in the dark. No drone, no drums.',
                  voices: ['pluck', 'bell'], maxNotes: 1, gate: 0.9, kick: false, hat: false, drone: 0, tempo: 0.9, shift: 7, reverb: 0.6 },
};
TRACKS.forEach(t => {
  t.src = B + t.file;
  t.url = `https://svs.gsfc.nasa.gov/${t.svs}/`;
  t.style = { ...DEFAULT_STYLE, ...t.style, ...STYLES[t.id] };
});

/* ------------------------------ helpers ------------------------------ */
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
const $ = id => document.getElementById(id);

function percentile(arr, p) {
  const s = Float32Array.from(arr).sort();
  return s[clamp(Math.floor(p * (s.length - 1)), 0, s.length - 1)];
}

function rgb2hsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
  const l = (mx + mn) / 2;
  const d = mx - mn;
  if (d === 0) return { h: 0, s: 0, l };
  const s = d / (1 - Math.abs(2 * l - 1));
  let h;
  if (mx === r) h = ((g - b) / d) % 6;
  else if (mx === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  h *= 60;
  if (h < 0) h += 360;
  return { h, s, l };
}

function voiceFor(h, s, l) {
  if (s < 0.14) return l > 0.55 ? 'bell' : 'soft';
  if (h < 60 || h >= 330) return 'pad';
  if (h < 170) return 'pluck';
  if (h < 260) return 'bell';
  return 'soft';
}

function modeForHue(h) {
  if (h < 45 || h >= 330) return 'Dorian';
  if (h < 150) return 'Mixolydian';
  if (h < 250) return 'Lydian';
  return 'Aeolian';
}

/* ------------------------------ analysis ------------------------------ */
// Returns a plan: for every column, the notes, percussion and drone settings.
function analyze(img, style = DEFAULT_STYLE) {
  const W = COLS * 4, H = ROWS * 4;
  const cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  const g = cv.getContext('2d', { willReadFrequently: true });
  g.imageSmoothingQuality = 'high';
  g.drawImage(img, 0, 0, W, H);
  const d = g.getImageData(0, 0, W, H).data;

  const lum = new Float32Array(W * H);
  for (let i = 0; i < W * H; i++) {
    lum[i] = (0.2126 * d[4 * i] + 0.7152 * d[4 * i + 1] + 0.0722 * d[4 * i + 2]) / 255;
  }

  const cells = new Array(ROWS * COLS);
  let mr = 0, mg = 0, mb = 0;
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      let sr = 0, sg = 0, sb = 0, se = 0, ne = 0;
      for (let y = r * 4; y < r * 4 + 4; y++) {
        for (let x = c * 4; x < c * 4 + 4; x++) {
          const i = y * W + x;
          sr += d[4 * i]; sg += d[4 * i + 1]; sb += d[4 * i + 2];
          if (x + 1 < W && y + 1 < H) {
            se += Math.abs(lum[i + 1] - lum[i]) + Math.abs(lum[i + W] - lum[i]);
            ne++;
          }
        }
      }
      const R = sr / 16, G = sg / 16, Bl = sb / 16;
      const hsl = rgb2hsl(R, G, Bl);
      cells[r * COLS + c] = { r: R, g: G, b: Bl, ...hsl, edge: ne ? se / ne : 0, sal: 0 };
      mr += R; mg += G; mb += Bl;
    }
  }
  const n = cells.length;
  mr /= n; mg /= n; mb /= n;

  for (const c of cells) {
    const dist = Math.hypot(c.r - mr, c.g - mg, c.b - mb) / (255 * Math.sqrt(3));
    c.sal = 0.7 * dist + 0.3 * Math.min(1, c.edge * 5);
  }

  const sals = cells.map(c => c.sal);
  const edges = cells.map(c => c.edge);
  const salLo = percentile(sals, style.gate);
  const salHi = Math.max(percentile(sals, 0.97), salLo + 1e-4);
  const edgeMedian = percentile(edges, 0.5);
  const meanEdge = edges.reduce((a, b) => a + b, 0) / n;

  // Key and mode from the saturation-weighted average hue of the frame.
  let hx = 0, hy = 0, hw = 0;
  for (const c of cells) {
    const w = c.s * (1 - Math.abs(2 * c.l - 1));
    hx += w * Math.cos(c.h * Math.PI / 180);
    hy += w * Math.sin(c.h * Math.PI / 180);
    hw += w;
  }
  let meanHue = 0, scaleName = 'Aeolian', rootPc = 9;
  if (hw / n > 0.01) {
    meanHue = (Math.atan2(hy, hx) * 180 / Math.PI + 360) % 360;
    scaleName = modeForHue(meanHue);
    rootPc = Math.round(meanHue / 30) % 12;
  }
  if (style.scaleName && SCALES[style.scaleName]) scaleName = style.scaleName;
  if (Number.isInteger(style.rootPc)) rootPc = clamp(style.rootPc, 0, 11);
  const scale = SCALES[scaleName];
  const base = 40 + rootPc + style.shift;

  const bpm = style.bpm == null
    ? Math.round(clamp(64 + meanEdge * 700, 64, 118) * style.tempo)
    : Math.round(clamp(style.bpm, 48, 160));
  const step = 60 / bpm / 2;

  const cols = [];
  const colEdge = [], colSal = [];
  for (let c = 0; c < COLS; c++) {
    let e = 0, s = 0, l = 0;
    for (let r = 0; r < ROWS; r++) {
      const cell = cells[r * COLS + c];
      e += cell.edge; s += cell.sal; l += cell.l;
    }
    colEdge.push(e); colSal.push(s / ROWS);
    cols.push({ edge: e, sal: s / ROWS, lum: l / ROWS, notes: [], hat: false, kick: false });
  }
  const edgeMed = percentile(colEdge, 0.5);
  const edgeHi = Math.max(percentile(colEdge, 0.9), 1e-4);
  const salMed = percentile(colSal, 0.6);
  const salScale = Math.max(percentile(colSal, 0.95), 1e-4);

  const counts = Object.fromEntries(Object.keys(VOICE_LABEL).map(voice => [voice, 0]));
  let prevKeys = new Set();
  for (let c = 0; c < COLS; c++) {
    const col = cols[c];
    const cand = [];
    for (let r = 0; r < ROWS; r++) {
      const cell = cells[r * COLS + c];
      if (cell.sal > salLo) cand.push({ r, cell });
    }
    cand.sort((a, b) => b.cell.sal - a.cell.sal);
    const picked = [];
    for (const k of cand) {
      if (picked.length >= style.maxNotes) break;
      if (picked.every(p => Math.abs(p.r - k.r) >= 4)) picked.push(k);
    }
    const keys = new Set();
    for (const { r, cell } of picked) {
      const deg = Math.min(20, Math.floor((1 - (r + 0.5) / ROWS) * 21));
      let voice = voiceFor(cell.h, cell.s, cell.l);
      if (style.orchestra) {
        if (cell.h >= 35 && cell.h < 80 && cell.s > 0.3) voice = 'brass';
        else if (cell.h >= 170 && cell.h < 260 && cell.s > 0.25) voice = 'flute';
        else if (r < ROWS * 0.25) voice = 'violin';
        else if (r < ROWS * 0.5) voice = 'viola';
        else if (r < ROWS * 0.75) voice = 'cello';
        else voice = 'contrabass';
      } else if (style.voices && !style.voices.includes(voice)) {
        voice = style.voices[Math.floor(cell.h / 360 * style.voices.length) % style.voices.length];
      }
      const key = voice + deg;
      keys.add(key);
      if (prevKeys.has(key) && c % 2 === 1) continue; // avoid machine-gun repeats
      const midi = base + Math.floor(deg / 7) * 12 + scale[deg % 7];
      const vel = clamp((cell.sal - salLo) / (salHi - salLo), 0.12, 1);
      const calm = cell.edge < edgeMedian ? 1 : 0;
      col.notes.push({
        midi, vel, voice, row: r, bright: clamp(cell.s * style.tone, 0, 1),
        dur: step * (SUSTAINED_VOICES.has(voice) ? 2.2 + 1.6 * calm : 1.4),
      });
      counts[voice]++;
    }
    prevKeys = keys;
    col.pan = -0.85 + 1.7 * c / (COLS - 1);
    col.hat = style.hat && c % 2 === 1 && col.edge > edgeMed;
    col.hatVel = clamp(col.edge / edgeHi, 0.2, 1);
    col.kick = style.kick && c % 4 === 0 && col.sal > salMed;
    col.droneGain = style.drone * (0.03 + 0.06 * clamp(col.sal / salScale, 0, 1));
    col.droneCut = 250 + 2200 * Math.pow(col.lum, 1.5);
  }

  return {
    cols, bpm, step, rootPc, scaleName, counts, edgeMed, style,
    key: `${NOTE_NAMES[rootPc]} ${scaleName}`,
    loopSeconds: step * COLS,
  };
}

/* ------------------------------ synthesis ------------------------------ */
function makeIR(ctx) {
  const len = Math.floor(ctx.sampleRate * 2.8);
  const buf = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const data = buf.getChannelData(ch);
    for (let i = 0; i < len; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.5);
    }
  }
  return buf;
}

function makeChain(ctx, volume, reverb = DEFAULT_STYLE.reverb) {
  const input = ctx.createGain();
  const dry = ctx.createGain(); dry.gain.value = 0.85;
  const send = ctx.createGain(); send.gain.value = reverb;
  const conv = ctx.createConvolver(); conv.buffer = makeIR(ctx);
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -18; comp.ratio.value = 4;
  comp.attack.value = 0.01; comp.release.value = 0.25;
  const master = ctx.createGain(); master.gain.value = volume;
  input.connect(dry); dry.connect(comp);
  input.connect(send); send.connect(conv); conv.connect(comp);
  comp.connect(master); master.connect(ctx.destination);
  return { input, master, send };
}

class Synth {
  constructor(ctx, chain, plan) {
    this.ctx = ctx; this.chain = chain; this.plan = plan; this.drone = null;
    const n = ctx.sampleRate;
    this.noise = ctx.createBuffer(1, n, ctx.sampleRate);
    const d = this.noise.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
  }

  startDrone(t) {
    if (this.drone || !this.plan.style.drone) return;
    const ctx = this.ctx;
    const f = mtof(36 + this.plan.rootPc);
    const gain = ctx.createGain(); gain.gain.setValueAtTime(0.0001, t);
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 400;
    const oscs = [['triangle', f, 0], ['sine', f * Math.pow(2, 7 / 12), 3], ['sine', f * 2, -4]].map(([type, fr, det]) => {
      const o = ctx.createOscillator(); o.type = type; o.frequency.value = fr; o.detune.value = det;
      o.connect(lp); o.start(t); return o;
    });
    lp.connect(gain); gain.connect(this.chain.input);
    this.drone = { gain, lp, oscs };
  }

  stopDrone(t) {
    if (!this.drone) return;
    const { gain, oscs } = this.drone;
    gain.gain.setTargetAtTime(0, t, 0.4);
    oscs.forEach(o => o.stop(t + 3));
    this.drone = null;
  }

  playCol(ci, t) {
    const col = this.plan.cols[ci];
    if (this.drone) {
      this.drone.gain.gain.setTargetAtTime(col.droneGain, t, this.plan.step * 0.5);
      this.drone.lp.frequency.setTargetAtTime(col.droneCut, t, this.plan.step * 0.5);
    }
    for (const n of col.notes) this.note(n, t, col.pan);
    if (col.kick) this.kick(t, clamp(col.sal * 6, 0.3, 1));
    if (col.hat) this.hat(t, col.hatVel, col.pan);
  }

  out(pan, endTime) {
    const p = this.ctx.createStereoPanner();
    p.pan.value = pan;
    p.connect(this.chain.input);
    return p;
  }

  osc(type, freq, detune, t) {
    const o = this.ctx.createOscillator();
    o.type = type; o.frequency.value = freq; o.detune.value = detune;
    o.start(t);
    return o;
  }

  note(n, t, pan) {
    if (['violin', 'viola', 'cello', 'contrabass'].includes(n.voice)) return this.bowedString(n, t, pan);
    if (n.voice === 'brass') return this.brass(n, t, pan);
    if (n.voice === 'flute') return this.flute(n, t, pan);
    if (n.voice === 'scanner') return this.scanner(n, t, pan);
    if (['acoustic_pluck', 'acoustic_strum', 'electric_pluck', 'electric_sustain'].includes(n.voice)) {
      return this.guitar(n, t, pan);
    }
    const f = mtof(n.midi);
    const ctx = this.ctx;
    const out = this.out(pan);
    const g = ctx.createGain();
    g.connect(out);
    if (n.voice === 'pad' || n.voice === 'soft') {
      const saw = n.voice === 'pad';
      const lp = ctx.createBiquadFilter(); lp.type = 'lowpass';
      lp.frequency.value = clamp(f * (saw ? 2 + 4 * n.bright : 2), 300, 5000);
      lp.Q.value = 0.6;
      const oscs = saw
        ? [this.osc('sawtooth', f, -7, t), this.osc('sawtooth', f, 7, t)]
        : [this.osc('triangle', f, -4, t), this.osc('triangle', f, 4, t), this.osc('sine', f * 2, 0, t)];
      oscs.forEach(o => o.connect(lp));
      lp.connect(g);
      const peak = (saw ? 0.05 : 0.07) * n.vel;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(peak, t + 0.12);
      g.gain.setTargetAtTime(0, t + n.dur, 0.25);
      oscs.forEach(o => o.stop(t + n.dur + 1.6));
    } else if (n.voice === 'pluck') {
      const lp = ctx.createBiquadFilter(); lp.type = 'lowpass';
      lp.frequency.value = 700 + 3500 * n.bright;
      const o = this.osc('triangle', f, 0, t);
      o.connect(lp); lp.connect(g);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(0.16 * n.vel, t + 0.008);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.9);
      o.stop(t + 1);
    } else { // bell: two-operator FM, inharmonic ratio
      const car = this.osc('sine', f, 0, t);
      const mod = this.osc('sine', f * 3.5, 0, t);
      const mg = ctx.createGain();
      mg.gain.setValueAtTime(f * (0.6 + 1.6 * n.vel), t);
      mg.gain.exponentialRampToValueAtTime(0.01, t + 1.4);
      mod.connect(mg); mg.connect(car.frequency);
      car.connect(g);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(0.12 * n.vel, t + 0.005);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 2.2);
      car.stop(t + 2.3); mod.stop(t + 2.3);
    }
  }

  bowedString(n, t, pan) {
    const ranges = {
      violin: [196, 1760], viola: [130, 1046], cello: [65, 523], contrabass: [41, 262],
    };
    let f = mtof(n.midi);
    const [lo, hi] = ranges[n.voice];
    while (f < lo) f *= 2;
    while (f > hi) f /= 2;
    const ctx = this.ctx, out = this.out(pan), g = ctx.createGain();
    const body = ctx.createBiquadFilter(); body.type = 'lowpass';
    body.frequency.value = clamp(f * (3 + 4 * n.bright), 500, 6200); body.Q.value = 1.2;
    const oscs = [this.osc('sawtooth', f, -6, t), this.osc('sawtooth', f, 6, t), this.osc('triangle', f * 2, 0, t)];
    oscs.forEach(o => o.connect(body)); body.connect(g); g.connect(out);
    const lfo = this.osc('sine', n.voice === 'contrabass' ? 4.2 : 5.2, 0, t);
    const vibrato = ctx.createGain(); vibrato.gain.value = n.voice === 'violin' ? 7 : 5;
    lfo.connect(vibrato); oscs.forEach(o => vibrato.connect(o.detune));
    const attack = n.voice === 'contrabass' ? 0.16 : 0.09;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.045 * n.vel, t + attack);
    g.gain.setTargetAtTime(0, t + n.dur, 0.28);
    const end = t + n.dur + 1.5;
    oscs.forEach(o => o.stop(end)); lfo.stop(end);
  }

  brass(n, t, pan) {
    const ctx = this.ctx, f = mtof(n.midi), out = this.out(pan), g = ctx.createGain();
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = 2.4;
    lp.frequency.setValueAtTime(clamp(f * 2, 250, 1800), t);
    lp.frequency.exponentialRampToValueAtTime(clamp(f * (4 + 5 * n.bright), 700, 7000), t + 0.12);
    lp.frequency.setTargetAtTime(clamp(f * 2.5, 350, 2800), t + 0.3, 0.35);
    const oscs = [this.osc('sawtooth', f, -4, t), this.osc('sawtooth', f, 4, t), this.osc('square', f / 2, 0, t)];
    oscs.forEach(o => o.connect(lp)); lp.connect(g); g.connect(out);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.045 * n.vel, t + 0.07);
    g.gain.setTargetAtTime(0, t + n.dur, 0.22);
    oscs.forEach(o => o.stop(t + n.dur + 1.3));
  }

  flute(n, t, pan) {
    const ctx = this.ctx, f = Math.max(220, mtof(n.midi)), out = this.out(pan), g = ctx.createGain();
    const tone = this.osc('sine', f, 0, t), air = this.osc('triangle', f * 2, 0, t);
    const airGain = ctx.createGain(); airGain.gain.value = 0.14 + 0.18 * n.bright;
    tone.connect(g); air.connect(airGain); airGain.connect(g); g.connect(out);
    const lfo = this.osc('sine', 5.5, 0, t), vibrato = ctx.createGain(); vibrato.gain.value = 9;
    lfo.connect(vibrato); vibrato.connect(tone.detune); vibrato.connect(air.detune);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.065 * n.vel, t + 0.1);
    g.gain.setTargetAtTime(0, t + n.dur, 0.2);
    const end = t + n.dur + 1.1;
    tone.stop(end); air.stop(end); lfo.stop(end);
  }

  guitar(n, t, pan) {
    const acoustic = n.voice.startsWith('acoustic');
    const sustained = n.voice === 'electric_sustain';
    const intervals = n.voice === 'acoustic_strum' ? [0, 7, 12] : [0];
    intervals.forEach((semitones, i) => {
      const at = t + i * 0.035, f = mtof(n.midi + semitones), ctx = this.ctx;
      const out = this.out(clamp(pan + (i - 1) * 0.08, -1, 1));
      const g = ctx.createGain(), lp = ctx.createBiquadFilter(); lp.type = 'lowpass';
      lp.frequency.value = acoustic ? 1800 + 2600 * n.bright : 1200 + 4200 * n.bright;
      lp.Q.value = acoustic ? 1.6 : 0.8; lp.connect(g); g.connect(out);
      if (acoustic) {
        const pick = ctx.createBufferSource(); pick.buffer = this.noise;
        const resonator = ctx.createBiquadFilter(); resonator.type = 'bandpass'; resonator.frequency.value = f; resonator.Q.value = 14;
        const pickGain = ctx.createGain(); pickGain.gain.setValueAtTime(0.09 * n.vel, at);
        pickGain.gain.exponentialRampToValueAtTime(0.0001, at + 0.08);
        pick.connect(resonator); resonator.connect(pickGain); pickGain.connect(out);
        pick.start(at, Math.random() * 0.4, 0.09);
      }
      const types = sustained ? ['sawtooth', 'triangle'] : [acoustic ? 'triangle' : 'sawtooth'];
      const oscs = types.map((type, k) => this.osc(type, f, k ? 7 : -3, at));
      oscs.forEach(o => o.connect(lp));
      g.gain.setValueAtTime(0.0001, at);
      g.gain.linearRampToValueAtTime((sustained ? 0.055 : 0.12) * n.vel, at + (sustained ? 0.04 : 0.008));
      if (sustained) g.gain.setTargetAtTime(0, at + n.dur, 0.3);
      else g.gain.exponentialRampToValueAtTime(0.0001, at + (acoustic ? 1.35 : 1.05));
      const end = sustained ? at + n.dur + 1.5 : at + 1.45;
      oscs.forEach(o => o.stop(end));
    });
  }

  scanner(n, t, pan) {
    const ctx = this.ctx;
    let f = mtof(n.midi);
    while (f < 1400) f *= 2;
    while (f > 2800) f /= 2;
    const interval = [1.25, 1.333, 1.5][n.row % 3];
    const ping = (at, freq, level, stereo) => {
      const out = this.out(clamp(stereo, -1, 1));
      const g = ctx.createGain(), car = ctx.createOscillator(), overtone = ctx.createOscillator();
      const mod = ctx.createOscillator(), mg = ctx.createGain(), overtoneGain = ctx.createGain();
      const shine = ctx.createBiquadFilter(); shine.type = 'highshelf'; shine.frequency.value = 1800; shine.gain.value = 7;
      car.type = 'sine'; overtone.type = 'sine'; mod.type = 'sine';
      car.frequency.setValueAtTime(freq * 1.16, at);
      car.frequency.exponentialRampToValueAtTime(freq, at + 0.035);
      overtone.frequency.value = freq * 2.01;
      mod.frequency.value = freq * 3.4;
      mg.gain.setValueAtTime(freq * (0.45 + 0.55 * n.bright), at);
      mg.gain.exponentialRampToValueAtTime(0.01, at + 0.16);
      overtoneGain.gain.setValueAtTime(0.28, at);
      overtoneGain.gain.exponentialRampToValueAtTime(0.0001, at + 0.2);
      mod.connect(mg); mg.connect(car.frequency);
      car.connect(shine); overtone.connect(overtoneGain); overtoneGain.connect(shine);
      shine.connect(g); g.connect(out);
      g.gain.setValueAtTime(0.0001, at);
      g.gain.exponentialRampToValueAtTime(0.085 * n.vel * level, at + 0.0025);
      g.gain.exponentialRampToValueAtTime(0.0001, at + 0.4);
      car.start(at); overtone.start(at); mod.start(at);
      car.stop(at + 0.43); overtone.stop(at + 0.43); mod.stop(at + 0.43);
    };
    ping(t, f, 1, pan - 0.12);
    ping(t + 0.11, f * interval, 0.58, pan + 0.22);
  }

  kick(t, vel) {
    const ctx = this.ctx;
    const o = this.osc('sine', 120, 0, t);
    o.frequency.setValueAtTime(120, t);
    o.frequency.exponentialRampToValueAtTime(42, t + 0.14);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.3 * vel, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.25);
    o.connect(g); g.connect(this.chain.input);
    o.stop(t + 0.3);
  }

  hat(t, vel, pan) {
    const ctx = this.ctx;
    const src = ctx.createBufferSource(); src.buffer = this.noise;
    const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 7000;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.06 * vel, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
    src.connect(hp); hp.connect(g); g.connect(this.out(pan));
    src.start(t, Math.random() * 0.5, 0.06);
  }
}

/* ------------------------------ WAV export ------------------------------ */
function encodeWav(buf) {
  const n = buf.length, ch = buf.numberOfChannels, sr = buf.sampleRate;
  const out = new DataView(new ArrayBuffer(44 + n * ch * 2));
  const str = (o, s) => { for (let i = 0; i < s.length; i++) out.setUint8(o + i, s.charCodeAt(i)); };
  str(0, 'RIFF'); out.setUint32(4, 36 + n * ch * 2, true); str(8, 'WAVE'); str(12, 'fmt ');
  out.setUint32(16, 16, true); out.setUint16(20, 1, true); out.setUint16(22, ch, true);
  out.setUint32(24, sr, true); out.setUint32(28, sr * ch * 2, true);
  out.setUint16(32, ch * 2, true); out.setUint16(34, 16, true);
  str(36, 'data'); out.setUint32(40, n * ch * 2, true);
  const chans = Array.from({ length: ch }, (_, i) => buf.getChannelData(i));
  let o = 44;
  for (let i = 0; i < n; i++) {
    for (let c = 0; c < ch; c++) {
      out.setInt16(o, Math.round(clamp(chans[c][i], -1, 1) * 32767), true);
      o += 2;
    }
  }
  return new Blob([out], { type: 'audio/wav' });
}

async function renderWav(plan) {
  const sr = 44100;
  const oc = new OfflineAudioContext(2, Math.ceil(sr * (plan.loopSeconds + 3)), sr);
  const chain = makeChain(oc, 0.8, plan.style.reverb);
  const synth = new Synth(oc, chain, plan);
  synth.startDrone(0);
  for (let c = 0; c < COLS; c++) synth.playCol(c, c * plan.step);
  synth.stopDrone(plan.loopSeconds);
  return encodeWav(await oc.startRendering());
}

/* ------------------------------ player ------------------------------ */
const player = {
  ctx: null, chain: null, synth: null, plan: null,
  playing: false, pos: 0, queue: [], next: { col: 0, time: 0 }, timer: null, volume: 0.8,
};

function ensureAudio() {
  if (!player.ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    player.ctx = new AC();
    player.chain = makeChain(player.ctx, player.volume, player.plan ? player.plan.style.reverb : undefined);
  }
  if (player.ctx.state !== 'running') player.ctx.resume();
  if (!player.synth && player.plan) player.synth = new Synth(player.ctx, player.chain, player.plan);
}

function setPlan(plan) {
  if (player.synth && player.ctx) player.synth.stopDrone(player.ctx.currentTime);
  player.synth = null;
  player.plan = plan;
  player.pos = 0;
  player.queue = [];
  if (player.ctx) {
    player.chain.send.gain.setTargetAtTime(plan.style.reverb, player.ctx.currentTime, 0.1);
    player.synth = new Synth(player.ctx, player.chain, plan);
    if (player.playing) startPlayback();
  }
}

function startPlayback() {
  const now = player.ctx.currentTime;
  player.synth.startDrone(now);
  player.queue = [];
  player.next = { col: Math.floor(player.pos), time: now + 0.05 };
  player.playing = true;
  if (!player.timer) player.timer = setInterval(tick, 25);
}

function play() {
  if (!player.plan) return;
  ensureAudio();
  startPlayback();
}

function pause() {
  if (!player.playing) return;
  player.pos = currentPos();
  player.playing = false;
  player.synth.stopDrone(player.ctx.currentTime);
}

function tick() {
  if (!player.playing) return;
  const { ctx, plan, next, queue } = player;
  const limit = ctx.currentTime + 0.25;
  while (next.time < limit) {
    player.synth.playCol(next.col, next.time);
    queue.push({ time: next.time, col: next.col });
    next.col = (next.col + 1) % COLS;
    next.time += plan.step;
  }
}

function currentPos() {
  if (!player.playing) return player.pos;
  const now = player.ctx.currentTime, q = player.queue;
  let last = -1;
  for (let i = 0; i < q.length && q[i].time <= now; i++) last = i;
  if (last >= 0) {
    player.pos = q[last].col + Math.min(0.999, (now - q[last].time) / player.plan.step);
  }
  return player.pos;
}

function seek(col, trigger) {
  col = clamp(Math.floor(col), 0, COLS - 1);
  player.pos = col;
  if (player.playing) {
    player.queue = [];
    player.next = { col, time: player.ctx.currentTime + 0.03 };
  } else if (trigger && player.ctx && player.synth) {
    const t = player.ctx.currentTime + 0.01;
    player.synth.playCol(col, t);
    player.queue.push({ time: t, col });
  }
}

/* ------------------------------ description ------------------------------ */
function describeColumn(c) {
  const col = player.plan.cols[c];
  const pct = Math.round(100 * (c + 0.5) / COLS);
  const head = `Column ${c + 1} of ${COLS}, ${pct} percent of the way from west to east.`;
  if (!col.notes.length) {
    return `${head} Quiet.${player.plan.style.drone ? ' Only the low drone.' : ''}`;
  }
  const band = r => (r < ROWS / 3 ? 'northern' : r < 2 * ROWS / 3 ? 'central' : 'southern');
  const sorted = [...col.notes].sort((a, b) => a.row - b.row);
  const parts = sorted.map(n => `${band(n.row)} ${VOICE_LABEL[n.voice]}`);
  let tail = '';
  if (col.kick) tail += ' Kick drum.';
  if (col.hat) tail += ' Hi-hat, from a busy texture.';
  return `${head} ${parts.join(', ')}.${tail}`;
}

function summarize(plan, title) {
  const total = Object.values(plan.counts).reduce((a, b) => a + b, 0);
  const parts = Object.entries(plan.counts).filter(([, v]) => v)
    .map(([k, v]) => `${v} ${v === 1 ? VOICE_LABEL[k] : VOICE_PLURAL[k]}`);
  return `${title}. ${plan.style.vibe} Key of ${plan.key}, ${plan.bpm} BPM. One sweep takes ${plan.loopSeconds.toFixed(0)} seconds. ` +
    `${total} notes in all${parts.length ? ': ' + parts.join(', ') : ''}.`;
}

/* ------------------------------ UI ------------------------------ */
const ui = {
  stage: $('stage'), frame: $('frame'), overlay: $('overlay'), octx: $('overlay').getContext('2d'),
  title: $('now-title'), alt: $('alt-text'), summary: $('summary'), colinfo: $('colinfo'),
  science: $('science-story'), listen: $('listen-for'), source: $('source'),
  play: $('play'), pos: $('pos'), live: $('live'), announce: $('announce'),
  list: $('tracks'), crateDaily: $('crate-daily'), crateCurated: $('crate-curated'),
  mixKey: $('mix-key'), mixScale: $('mix-scale'), mixVoices: $('mix-voices'),
  mixDensity: $('mix-density'), mixTempo: $('mix-tempo'), mixTone: $('mix-tone'), mixReverb: $('mix-reverb'),
  mixDensityOut: $('mix-density-out'), mixTempoOut: $('mix-tempo-out'),
  mixToneOut: $('mix-tone-out'), mixReverbOut: $('mix-reverb-out'),
  mixReset: $('mixer-reset'), mixStatus: $('mixer-status'),
};
let current = -1;
let lastShownCol = -1;
let loadToken = 0;
let activeCollection = 'daily';
let currentImage = null;

const mixer = {
  key: 'record', scale: 'record', voices: 'record',
  density: null, bpm: null, tone: null, reverb: null,
};
const VOICE_PRESETS = {
  all: null,
  pad: ['pad'], pluck: ['pluck'], bell: ['bell'], soft: ['soft'],
  water: ['bell', 'soft'], earth: ['pad', 'pluck'],
  orchestra: ['violin', 'viola', 'cello', 'contrabass', 'brass', 'flute'],
  violin: ['violin'], viola: ['viola'], cello: ['cello'], contrabass: ['contrabass'],
  acoustic_pluck: ['acoustic_pluck'], acoustic_strum: ['acoustic_strum'],
  electric_pluck: ['electric_pluck'], electric_sustain: ['electric_sustain'],
  scanner: ['scanner'],
};
let mixerTimer = null;

function mixerIsCustom() {
  return mixer.key !== 'record' || mixer.scale !== 'record' || mixer.voices !== 'record' ||
    mixer.density != null || mixer.bpm != null || mixer.tone != null || mixer.reverb != null;
}

function effectiveStyle(track) {
  const style = { ...DEFAULT_STYLE, ...(track.style || {}) };
  if (mixer.key !== 'record') { style.rootPc = Number(mixer.key); style.shift = 0; }
  if (mixer.scale !== 'record') style.scaleName = mixer.scale;
  if (mixer.voices !== 'record') {
    style.voices = VOICE_PRESETS[mixer.voices];
    style.orchestra = mixer.voices === 'orchestra';
  }
  if (mixer.density != null) style.gate = 1 - mixer.density;
  if (mixer.bpm != null) style.bpm = mixer.bpm;
  if (mixer.tone != null) style.tone = mixer.tone;
  if (mixer.reverb != null) style.reverb = mixer.reverb;
  if (mixerIsCustom()) style.vibe = 'Custom Studio Mixer settings.';
  return style;
}

function densityLabel(value) {
  if (value < 0.28) return 'Sparse';
  if (value > 0.5) return 'Dense';
  return 'Balanced';
}

function toneLabel(value) {
  if (value < 0.85) return 'Warm';
  if (value > 1.2) return 'Bright';
  return 'Balanced';
}

function updateMixerUi(plan = player.plan) {
  if (!plan) return;
  const density = mixer.density ?? (1 - plan.style.gate);
  const tone = mixer.tone ?? plan.style.tone;
  const reverb = mixer.reverb ?? plan.style.reverb;
  ui.mixKey.value = mixer.key;
  ui.mixScale.value = mixer.scale;
  ui.mixVoices.value = mixer.voices;
  ui.mixDensity.value = density;
  ui.mixTempo.value = mixer.bpm ?? plan.bpm;
  ui.mixTone.value = tone;
  ui.mixReverb.value = reverb;
  ui.mixDensityOut.textContent = `${densityLabel(density)} · ${Math.round(density * 100)}%`;
  ui.mixTempoOut.textContent = `${mixer.bpm ?? plan.bpm} BPM`;
  ui.mixToneOut.textContent = `${toneLabel(tone)} · ${Math.round(tone * 100)}%`;
  ui.mixReverbOut.textContent = `${Math.round(reverb * 100)}%`;
  const custom = mixerIsCustom();
  ui.mixReset.disabled = !custom;
  ui.mixStatus.textContent = custom ? 'Custom mix is active across records.' : 'NASA Mix is active.';
}

function refreshMixer(speak = false) {
  if (current < 0 || !currentImage) return;
  const track = TRACKS[current];
  const plan = analyze(currentImage, effectiveStyle(track));
  setPlan(plan);
  ui.summary.textContent = summarize(plan, track.title);
  ui.colinfo.textContent = '';
  lastShownCol = -1;
  updateMixerUi(plan);
  if (speak) announce(`${ui.mixStatus.textContent} ${plan.key}, ${plan.bpm} BPM.`);
}

function scheduleMixerRefresh() {
  clearTimeout(mixerTimer);
  mixerTimer = setTimeout(() => refreshMixer(false), 80);
}

function resetMixer() {
  Object.assign(mixer, {
    key: 'record', scale: 'record', voices: 'record',
    density: null, bpm: null, tone: null, reverb: null,
  });
  refreshMixer(true);
}

function announce(msg) {
  ui.live.textContent = '';
  setTimeout(() => { ui.live.textContent = msg; }, 30);
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Could not load ' + src));
    img.src = src;
  });
}

async function selectTrack(i) {
  const token = ++loadToken;
  const t = TRACKS[i];
  let img;
  try { img = await loadImage(t.src); } catch (e) { ui.title.textContent = e.message; return; }
  if (token !== loadToken) return;
  const plan = analyze(img, effectiveStyle(t));
  current = i;
  currentImage = img;
  ui.frame.src = t.src;
  ui.frame.alt = '';
  ui.overlay.width = 1024;
  ui.overlay.height = Math.round(1024 * img.naturalHeight / img.naturalWidth);
  ui.title.textContent = t.title;
  ui.alt.textContent = t.alt;
  ui.science.textContent = t.science || 'This image is analyzed as a visual composition. For a custom image, consult its original source for scientific meaning.';
  ui.listen.textContent = t.listen || 'Listen for changes in pitch, instrument, density, and brightness as visually distinctive regions cross the playhead.';
  ui.source.hidden = Boolean(t.custom);
  if (!t.custom) ui.source.href = t.url;
  ui.summary.textContent = summarize(plan, t.title);
  ui.colinfo.textContent = '';
  lastShownCol = -1;
  setPlan(plan);
  updateMixerUi(plan);
  [...ui.list.querySelectorAll('button.track')].forEach(b => {
    b.setAttribute('aria-pressed', String(Number(b.dataset.index) === i));
  });
  if (ui.announce.checked) announce(`${t.title}. ${t.alt} ${summarize(plan, 'Sonification')}`);
}

function visibleTrackIndices() {
  return TRACKS.map((t, i) => ({ t, i }))
    .filter(({ t }) => t.collection === activeCollection || t.custom)
    .map(({ i }) => i);
}

function buildList() {
  ui.list.textContent = '';
  visibleTrackIndices().forEach(i => {
    const t = TRACKS[i];
    const li = document.createElement('li');
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'track'; b.setAttribute('aria-pressed', 'false');
    b.dataset.index = i;
    const im = document.createElement('img'); im.src = t.src; im.alt = '';
    im.loading = 'lazy'; im.decoding = 'async';
    const sp = document.createElement('span');
    sp.textContent = t.title;
    const sm = document.createElement('small');
    sm.textContent = t.custom ? 'Your image' : `${t.collection === 'daily' ? 'NASA Daily' : 'NASA SVS'} ${t.svs}`;
    sp.appendChild(sm);
    b.append(im, sp);
    b.addEventListener('click', () => selectTrack(i));
    li.appendChild(b);
    ui.list.appendChild(li);
  });
}

function setCollection(collection) {
  activeCollection = collection;
  ui.crateDaily.setAttribute('aria-pressed', String(collection === 'daily'));
  ui.crateCurated.setAttribute('aria-pressed', String(collection === 'curated'));
  buildList();
  const visible = visibleTrackIndices();
  if (!visible.includes(current)) selectTrack(visible[0]);
  else selectTrack(current);
}

function togglePlay() {
  if (player.playing) { pause(); ui.play.textContent = 'Play'; }
  else { play(); ui.play.textContent = 'Pause'; }
}

function step(delta) {
  if (!player.plan) return;
  const c = clamp(Math.floor(currentPos()) + delta, 0, COLS - 1);
  ensureAudio();
  seek(c, true);
  showColumn(c, true);
}

function showColumn(c, speak) {
  const text = describeColumn(c);
  ui.colinfo.textContent = text;
  if (speak && ui.announce.checked) announce(text);
}

function relTrack(d) {
  const visible = visibleTrackIndices();
  const at = Math.max(0, visible.indexOf(current));
  selectTrack(visible[(at + d + visible.length) % visible.length]);
}

/* scrubbing with a pointer */
let scrubbing = false, lastScrub = -1;
function colFromEvent(e) {
  const r = ui.stage.getBoundingClientRect();
  return clamp(Math.floor((e.clientX - r.left) / r.width * COLS), 0, COLS - 1);
}
ui.stage.addEventListener('pointerdown', e => {
  if (!player.plan) return;
  ui.stage.focus();
  ui.stage.setPointerCapture(e.pointerId);
  ensureAudio();
  scrubbing = true; lastScrub = -1;
  scrubTo(e);
});
ui.stage.addEventListener('pointermove', e => { if (scrubbing) scrubTo(e); });
const endScrub = () => {
  if (!scrubbing) return;
  scrubbing = false;
  if (lastScrub >= 0) showColumn(lastScrub, true);
};
ui.stage.addEventListener('pointerup', endScrub);
ui.stage.addEventListener('pointercancel', endScrub);
function scrubTo(e) {
  const c = colFromEvent(e);
  if (c === lastScrub) return;
  lastScrub = c;
  seek(c, true);
  showColumn(c, false);
}

/* keyboard */
ui.stage.addEventListener('keydown', e => {
  const big = e.shiftKey ? 8 : 1;
  switch (e.key) {
    case ' ': case 'Enter': togglePlay(); break;
    case 'ArrowRight': step(big); break;
    case 'ArrowLeft': step(-big); break;
    case 'Home': step(-COLS); break;
    case 'End': step(COLS); break;
    case 'ArrowUp': case 'ArrowDown': {
      const v = clamp(player.volume + (e.key === 'ArrowUp' ? 0.05 : -0.05), 0, 1);
      setVolume(v); $('vol').value = v; break;
    }
    case 'n': case 'N': relTrack(1); break;
    case 'p': case 'P': relTrack(-1); break;
    default: return;
  }
  e.preventDefault();
});

function setVolume(v) {
  player.volume = v;
  if (player.chain) player.chain.master.gain.setTargetAtTime(v, player.ctx.currentTime, 0.02);
}

$('play').addEventListener('click', togglePlay);
$('prev').addEventListener('click', () => relTrack(-1));
$('next').addEventListener('click', () => relTrack(1));
$('vol').addEventListener('input', e => setVolume(parseFloat(e.target.value)));
ui.crateDaily.addEventListener('click', () => setCollection('daily'));
ui.crateCurated.addEventListener('click', () => setCollection('curated'));
ui.mixKey.addEventListener('change', e => { mixer.key = e.target.value; refreshMixer(true); });
ui.mixScale.addEventListener('change', e => { mixer.scale = e.target.value; refreshMixer(true); });
ui.mixVoices.addEventListener('change', e => { mixer.voices = e.target.value; refreshMixer(true); });
ui.mixDensity.addEventListener('input', e => { mixer.density = parseFloat(e.target.value); scheduleMixerRefresh(); });
ui.mixTempo.addEventListener('input', e => { mixer.bpm = parseInt(e.target.value, 10); scheduleMixerRefresh(); });
ui.mixTone.addEventListener('input', e => { mixer.tone = parseFloat(e.target.value); scheduleMixerRefresh(); });
ui.mixReverb.addEventListener('input', e => { mixer.reverb = parseFloat(e.target.value); scheduleMixerRefresh(); });
ui.mixReset.addEventListener('click', resetMixer);

$('wav').addEventListener('click', async e => {
  if (!player.plan) return;
  const btn = e.currentTarget;
  btn.disabled = true; btn.textContent = 'Rendering…';
  try {
    const blob = await renderWav(player.plan);
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `earth-jukebox-${TRACKS[current].id}.wav`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  } finally {
    btn.disabled = false; btn.textContent = 'Download this loop as WAV';
  }
});

$('file').addEventListener('change', async e => {
  const f = e.target.files[0];
  if (!f) return;
  const url = URL.createObjectURL(f);
  const track = {
    id: 'custom', file: '', src: url, title: f.name.replace(/\.[^.]+$/, '').slice(0, 40) || 'Your image',
    custom: true, collection: 'custom', svs: '',
    alt: 'An image you provided. It is sonified with the same rules as the NASA frames.',
  };
  const old = TRACKS.findIndex(t => t.custom);
  if (old >= 0) TRACKS.splice(old, 1);
  TRACKS.push(track);
  buildList();
  await selectTrack(TRACKS.length - 1);
});

/* overlay drawing */
function draw() {
  requestAnimationFrame(draw);
  const plan = player.plan;
  if (!plan) return;
  const ctx = ui.octx, w = ui.overlay.width, h = ui.overlay.height;
  ctx.clearRect(0, 0, w, h);
  const p = player.ctx ? currentPos() : player.pos;
  const col = clamp(Math.floor(p), 0, COLS - 1);
  const cw = w / COLS;

  ctx.fillStyle = 'rgba(255,255,255,0.14)';
  ctx.fillRect(col * cw, 0, cw, h);
  ctx.fillStyle = '#fff';
  ctx.fillRect(p / COLS * w - 1.5, 0, 3, h);

  if (player.ctx) {
    const now = player.ctx.currentTime;
    const q = player.queue;
    while (q.length && q[0].time < now - 1.6) q.shift();
    for (const e of q) {
      const age = now - e.time;
      if (age < 0 || age > 1.4) continue;
      const a = 1 - age / 1.4;
      for (const n of plan.cols[e.col].notes) {
        const x = (e.col + 0.5) * cw, y = (n.row + 0.5) / ROWS * h;
        ctx.strokeStyle = VOICE_COLOR[n.voice];
        ctx.globalAlpha = a;
        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(x, y, 8 + age * 40 * (0.5 + n.vel), 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = VOICE_COLOR[n.voice];
        ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2); ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  }

  if (col !== lastShownCol) {
    lastShownCol = col;
    const secs = Math.round(col * plan.step);
    ui.pos.textContent = `Column ${col + 1} / ${COLS} · ${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`;
    if (player.playing) ui.colinfo.textContent = describeColumn(col);
  }
}

buildList();
selectTrack(CURATED_TRACKS.length);
draw();
