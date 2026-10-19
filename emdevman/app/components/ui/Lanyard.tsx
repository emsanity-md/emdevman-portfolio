"use client";

import { useEffect, useRef } from "react";
import type { CSSProperties } from "react";

/*
  Types only. Erased at build, so it costs nothing at runtime and never pulls
  the library into the bundle - see the note on the dynamic import below.
*/
import type * as Three from "three";

type Orientation = "portrait" | "landscape";
type Finish = "glossy" | "matte" | "holographic" | "metallic";
type Metal = "graphite" | "silver" | "gold";
type Anchor = "left" | "center" | "right";
type ImageFit = "cover" | "contain";
type Rgb = [number, number, number];
type Point = { clientX: number; clientY: number };

/**
 * The slice of `THREE.Path` that `traceRoundedRect` actually draws with.
 *
 * `Shape` and `Path` both satisfy it, and the point of naming the three methods
 * rather than the classes is that a type-only import is erased - so this
 * interface carries no dependency on the library at all, and the rounded-rect
 * tracer stays testable without a WebGL context anywhere in sight.
 */
interface PathLike {
  moveTo(x: number, y: number): unknown;
  lineTo(x: number, y: number): unknown;
  bezierCurveTo(c1x: number, c1y: number, c2x: number, c2y: number, x: number, y: number): unknown;
}

export interface LanyardProps {
  frontImage?: string;
  backImage?: string;
  imageFit?: ImageFit;
  cardColor?: string;
  orientation?: Orientation;
  finish?: Finish;
  cornerRadius?: number;
  size?: number;
  anchor?: Anchor;
  strapLength?: number;
  strapImage?: string;
  strapColor?: string;
  strapWidth?: number;
  metal?: Metal;
  gravity?: number;
  damping?: number;
  elasticity?: number;
  breeze?: number;
  interactive?: boolean;
  intro?: boolean;

  /*
    Badge furniture.

    Added for `LanyardBadge`. All of it is painted into the face texture rather
    than composed in DOM - the card is a single quad in a 3D scene that rotates,
    so a DOM overlay would hang in screen space while the card swung out from
    under it. Everything here is drawn once, into the canvas, and then behaves
    like print on a physical object.
  */
  /** Name, in caps, under the portrait. */
  name?: string;
  /** Role line, under the name. */
  role?: string;
  /** Printed after an "ID:" label at the foot of the text block. */
  badgeId?: string;
  /**
   * Centred on the reverse of the card.
   *
   * Keep it to about twenty words - the block is three lines tall and a longer
   * quote is truncated mid-sentence, which reads as an error rather than as an
   * edit.
   */
  quote?: string;
  /** Attribution, set under a rule beneath the quote. */
  quoteBy?: string;
  /** Stripe pattern along the bottom edge. */
  barcode?: boolean;
  /**
   * Repeat `text` along the strap.
   *
   * Painted into the strap texture. The band mesh's UV runs v along its length
   * and u across it, so the text has to be drawn rotated a quarter turn.
   */
  strapText?: string;
  /**
   * Scales the face text as a fraction of card height, 0 to disable.
   *
   * Default 0.055. The face canvas is 1024px wide and the card's aspect is
   * fixed, so a single number sets the whole typographic scale.
   */
  textScale?: number;

  /*
    Depth and finish.
  */
  /**
   * Strength of the contact shadow beneath the card, 0 to disable.
   *
   * A projected ellipse, not a raytraced one: the card swings in a scene with
   * no floor, and the shadow's job is to say the card is above something rather
   * than to be physically correct. It tracks the card's swing, so it slides and
   * fades with the card rather than sitting still under it.
   */
  shadow?: number;
  /** Edge highlight that strengthens on hover, 0 to disable. */
  sheen?: number;

  /*
    Motion.
  */
  /**
   * Idle sway amplitude, 0 to disable.
   *
   * Not an animation layered over the solver - it is a small oscillating
   * force fed into the same constraint system the drag uses, so a swaying badge
   * that is also being dragged is one simulation rather than two fighting over
   * the same body.
   */
  sway?: number;

  /**
   * Fires once, after the first frame has been drawn.
   *
   * Not part of the original component. `new THREE.WebGLRenderer` throws on a
   * machine with no WebGL context, and the effect returns early when it does -
   * leaving an empty box and no way for a caller to tell that from "still
   * loading". This is the signal that lets a wrapper hold a static fallback
   * behind the card and drop it once there is something to show.
   */
  onReady?: () => void;
  className?: string;
  style?: CSSProperties;
}

interface Settings {
  frontImage?: string;
  backImage?: string;
  imageFit: ImageFit;
  cardColor: string;
  orientation: Orientation;
  finish: Finish;
  cornerRadius: number;
  size: number;
  anchor: Anchor;
  strapLength: number;
  strapImage?: string;
  strapColor: string;
  strapWidth: number;
  metal: Metal;
  gravity: number;
  damping: number;
  elasticity: number;
  breeze: number;
  interactive: boolean;
  intro: boolean;
  name: string;
  role: string;
  badgeId: string;
  quote: string;
  quoteBy: string;
  barcode: boolean;
  strapText: string;
  textScale: number;
  shadow: number;
  sheen: number;
  sway: number;
  onReady?: () => void;
}

interface Images {
  front: HTMLImageElement | null;
  back: HTMLImageElement | null;
  strap: HTMLImageElement | null;
}

interface CardLayout {
  width: number;
  height: number;
  radius: number;
  slot: { width: number; height: number; y: number };
  ringY: number;
  hangY: number;
}

interface FinishLook {
  roughness: number;
  metalness: number;
  clearcoat: number;
  clearcoatRoughness: number;
  foil: number;
  anisotropy: number;
}

interface Body {
  position: Three.Vector3;
  previous: Three.Vector3;
  velocity: Three.Vector3;
  quaternion: Three.Quaternion;
  previousQuaternion: Three.Quaternion;
  angular: Three.Vector3;
  mass: number;
  inverseInertia: Three.Vector3;
  hang: Three.Vector3;
}

interface Grab {
  local: Three.Vector3;
  rotation: Three.Quaternion;
  /** Distance along the pick ray, so the card keeps the depth it was grabbed at. */
  reach: number;
  from: Three.Vector3;
  target: Three.Vector3;
}

interface Simulation {
  nodes: Three.Vector3[];
  previous: Three.Vector3[];
  velocities: Three.Vector3[];
  lengths: Float64Array;
  impulses: Float64Array;
  rest: number;
  anchor: Three.Vector3;
  body: Body;
  grab: Grab | null;
  turn: number;
  twist: number;
  twistRaw: number;
  calm: number;
}

interface Physics {
  gravity: number;
  hold: number;
  stiffness: number;
  spring: number;
  bandDamping: number;
  linearDrag: number;
  angularDrag: number;
  air: number;
  broadside: number;
  spinAir: number;
  nodeDrag: number;
  nodeAir: number;
  twist: number;
  twistDamping: number;
  grip: number;
  gripDamping: number;
  breeze: number;
  sway: number;
}

interface Applied {
  layoutKey?: string;
  framingKey?: string;
  imageKey?: string;
  faceKey?: string;
  strapColor?: string;
  strapText?: string;
  strapScale?: number;
}

interface Press {
  x: number;
  y: number;
  time: number;
  point: Three.Vector3;
}

const CARD_SIZES: Record<string, [number, number]> = {
  portrait: [1.6, 2.25],
  landscape: [2.25, 1.6],
};
const ANCHORS: Record<string, number> = { left: 0.27, center: 0.5, right: 0.73 };
const THICKNESS = 0.018;
const BEVEL = 0.007;
const JOINTS = 4;
const NODE_WEIGHT = 1 / 0.05;
const MAX_STEP = 1 / 960;
const ITERATIONS = 2;
const SAMPLES = 72;
const FOV = 24;
const STRAP_WIDTH = 0.36;
const RING_RADIUS = 0.095;
const RING_TUBE = 0.0135;
const EYELET_RADIUS = 0.036;
/*
  The clip, enlarged from 0.15.

  The original was sized against the strap rather than against the card, and at
  this width it sat on top of the slot punch instead of gripping through it -
  which is the "floating awkwardly" case. Bigger and reaching further down, so
  the jaw covers the punch and the card reads as held.
*/
const CLAMP_BODY = 0.185;
const FACE_WIDTH = 1024;

const FINISHES: Record<string, FinishLook> = {
  glossy: { roughness: 0.42, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.06, foil: 0, anisotropy: 0 },
  matte: { roughness: 0.85, metalness: 0, clearcoat: 0, clearcoatRoughness: 0.6, foil: 0, anisotropy: 0 },
  holographic: { roughness: 0.3, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.04, foil: 1, anisotropy: 0 },
  metallic: { roughness: 0.36, metalness: 0.75, clearcoat: 0.5, clearcoatRoughness: 0.18, foil: 0, anisotropy: 0.7 },
};

const BAND_COLUMNS = [0, 0.07, 0.93, 1];
const BAND_BEND = [-0.95, -0.28, 0.28, 0.95];
const FLIP_SPIN = 9;

const FOIL_VERTEX_HEAD = `
varying vec2 vFoilUv;
varying vec3 vFoilX;
varying vec3 vFoilY;
`;

const FOIL_VERTEX_BODY = `
vFoilUv = uv;
vFoilX = normalize((modelViewMatrix * vec4(1.0, 0.0, 0.0, 0.0)).xyz);
vFoilY = normalize((modelViewMatrix * vec4(0.0, 1.0, 0.0, 0.0)).xyz);
`;

const FOIL_FRAGMENT_HEAD = `
uniform float foilStrength;
uniform float foilAspect;
uniform vec3 foilKey;
uniform vec3 foilFill;
uniform vec3 foilTop;
varying vec2 vFoilUv;
varying vec3 vFoilX;
varying vec3 vFoilY;

float foilHash(vec2 p) {
  p = fract(p * vec2(234.34, 435.345));
  p += dot(p, p + 34.23);
  return fract(p.x * p.y);
}

float foilBump(float t, float center, float width) {
  float x = (t - center) / width;
  return max(0.0, 1.0 - x * x);
}

vec3 foilSpectrum(float t) {
  return vec3(
    foilBump(t, 0.82, 0.32) + 0.4 * foilBump(t, 0.02, 0.12),
    foilBump(t, 0.5, 0.26),
    foilBump(t, 0.18, 0.24)
  );
}

vec3 foilGrating(float u, float spacing) {
  vec3 color = vec3(0.0);
  for (int m = 1; m <= 2; m++) {
    float order = float(m);
    float t = (spacing * abs(u) / order - 0.38) / 0.32;
    color += foilSpectrum(t) / order;
  }
  return color;
}

vec3 foilShard(vec2 p) {
  vec2 base = floor(p);
  float best = 9.0;
  float edge = 9.0;
  vec2 id = base;
  for (int j = -1; j <= 1; j++) {
    for (int i = -1; i <= 1; i++) {
      vec2 cell = base + vec2(float(i), float(j));
      vec2 site = cell + vec2(foilHash(cell), foilHash(cell + 7.31)) * 0.9 + 0.05;
      float d = length(site - p);
      if (d < best) {
        edge = best;
        best = d;
        id = cell;
      } else if (d < edge) {
        edge = d;
      }
    }
  }
  return vec3(foilHash(id + 3.17), foilHash(id + 11.73), edge - best);
}
`;

const FOIL_FRAGMENT_BODY = `
if (foilStrength > 0.0) {
  vec3 foilView = normalize(vViewPosition);
  vec3 foilNormal = normalize(normal);
  vec2 foilP = vec2(vFoilUv.x, vFoilUv.y * foilAspect);
  vec3 shard = foilShard(foilP * 26.0);
  vec2 ray = foilP - vec2(-1.6, 2.6 * foilAspect);
  float angle = atan(ray.y, ray.x) + (shard.x - 0.5) * 0.16;
  vec3 grating = normalize(vFoilX * cos(angle) + vFoilY * sin(angle));
  float spacing = 1.7 * (0.95 + shard.y * 0.1);
  vec3 rainbow = foilGrating(dot(foilKey + foilView, grating), spacing);
  rainbow += 0.6 * foilGrating(dot(foilTop + foilView, grating), spacing);
  rainbow *= 0.8 + 0.2 * smoothstep(0.0, 0.04, shard.z);
  rainbow = max(rainbow - 0.35 * min(rainbow.r, min(rainbow.g, rainbow.b)), 0.0);
  vec2 grid = foilP * 64.0;
  vec2 cell = floor(grid);
  vec2 jitter = vec2(foilHash(cell + 1.7), foilHash(cell + 9.2));
  float flake = smoothstep(0.32, 0.06, length(fract(grid) - jitter * 0.6 - 0.2)) * step(0.45, foilHash(cell + 4.4));
  vec3 facet = normalize(foilNormal + (vFoilX * (jitter.x - 0.5) + vFoilY * (jitter.y - 0.5)) * 0.8);
  float glint = pow(max(dot(reflect(-foilKey, facet), foilView), 0.0), 28.0);
  glint += 0.7 * pow(max(dot(reflect(-foilTop, facet), foilView), 0.0), 28.0);
  float fine = 1.0 - smoothstep(0.35, 0.9, max(fwidth(grid.x), fwidth(grid.y)));
  vec3 sparkle = flake * glint * fine * (vec3(0.7) + foilGrating(dot(foilKey + foilView, grating) + jitter.x * 0.4, spacing));
  float ink = dot(diffuseColor.rgb, vec3(0.2126, 0.7152, 0.0722));
  float foil = foilStrength * (0.08 + 0.92 * smoothstep(0.04, 0.7, ink));
  float facing = clamp(dot(foilNormal, foilView), 0.0, 1.0);
  float tint = clamp(dot(rainbow, vec3(0.4)), 0.0, 1.0);
  outgoingLight = outgoingLight * (1.0 - foil * (0.3 + 0.32 * tint)) + (rainbow * 0.62 * (0.4 + 0.6 * facing) + sparkle * 1.6) * foil;
}
`;

const METALS: Record<string, { color: string; roughness: number }> = {
  silver: { color: "#d9dce2", roughness: 0.16 },
  gold: { color: "#e4b965", roughness: 0.2 },
  graphite: { color: "#4d4f55", roughness: 0.28 },
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const mix = (a: number, b: number, t: number) => a + (b - a) * t;

const parseColor = (value: string, fallback: Rgb): Rgb => {
  try {
    const ctx = document.createElement("canvas").getContext("2d");
    if (!ctx) return fallback;
    ctx.fillStyle = "#000000";
    ctx.fillStyle = value;
    const resolved = ctx.fillStyle;
    if (resolved.startsWith("#")) {
      const n = parseInt(resolved.slice(1), 16);
      return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
    }
    const parts = resolved.match(/[\d.]+/g);
    if (!parts || parts.length < 3) return fallback;
    return [Number(parts[0]) / 255, Number(parts[1]) / 255, Number(parts[2]) / 255];
  } catch {
    return fallback;
  }
};

const luminance = (rgb: Rgb) => 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
const toCss = (rgb: Rgb, alpha = 1) =>
  `rgba(${Math.round(rgb[0] * 255)}, ${Math.round(rgb[1] * 255)}, ${Math.round(rgb[2] * 255)}, ${alpha})`;

const seeded = (start: number) => {
  let state = start >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const traceRoundedRect = (path: PathLike, x: number, y: number, width: number, height: number, radius: number) => {
  const r = Math.max(0, Math.min(radius, width / 2, height / 2));
  const k = r * 0.4477;
  path.moveTo(x + r, y);
  path.lineTo(x + width - r, y);
  path.bezierCurveTo(x + width - k, y, x + width, y + k, x + width, y + r);
  path.lineTo(x + width, y + height - r);
  path.bezierCurveTo(x + width, y + height - k, x + width - k, y + height, x + width - r, y + height);
  path.lineTo(x + r, y + height);
  path.bezierCurveTo(x + k, y + height, x, y + height - k, x, y + height - r);
  path.lineTo(x, y + r);
  path.bezierCurveTo(x, y + k, x + k, y, x + r, y);
};

const loadImage = (
  cache: Map<string, Promise<HTMLImageElement | null>>,
  url?: string
): Promise<HTMLImageElement | null> => {
  if (!url) return Promise.resolve(null);
  const cached = cache.get(url);
  if (cached) return cached;
  const promise = new Promise<HTMLImageElement | null>((resolve) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.decoding = "async";
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = url;
  });
  cache.set(url, promise);
  return promise;
};

const cardLayout = (orientation: Orientation, cornerRadius: number): CardLayout => {
  const [width, height] = CARD_SIZES[orientation] || CARD_SIZES.portrait;
  const radius = mix(0.03, Math.min(width, height) * 0.2, clamp(cornerRadius, 0, 1));
  const slot = { width: 0.34, height: 0.07, y: height / 2 - 0.13 };
  const ringY = height / 2 - 0.055;
  return { width, height, radius, slot, ringY, hangY: ringY + RING_RADIUS };
};

const buildCardGeometry = (layout: CardLayout) => {
  const { width, height, radius, slot } = layout;
  const outline = new THREE.Shape();
  traceRoundedRect(
    outline,
    -width / 2 + BEVEL,
    -height / 2 + BEVEL,
    width - BEVEL * 2,
    height - BEVEL * 2,
    Math.max(radius - BEVEL, 0.005)
  );
  const hole = new THREE.Path();
  traceRoundedRect(
    hole,
    -slot.width / 2 - BEVEL,
    slot.y - slot.height / 2 - BEVEL,
    slot.width + BEVEL * 2,
    slot.height + BEVEL * 2,
    slot.height / 2 + BEVEL
  );
  outline.holes.push(hole);
  const body = new THREE.ExtrudeGeometry(outline, {
    depth: THICKNESS,
    bevelEnabled: true,
    bevelThickness: BEVEL,
    bevelSize: BEVEL,
    bevelSegments: 5,
    curveSegments: 24,
  });
  body.translate(0, 0, -THICKNESS / 2);
  const face = new THREE.ShapeGeometry(outline, 24);
  const position = face.getAttribute("position");
  const uv = face.getAttribute("uv");
  for (let i = 0; i < position.count; i++) {
    uv.setXY(i, (position.getX(i) + width / 2) / width, (position.getY(i) + height / 2) / height);
  }
  uv.needsUpdate = true;
  return { body, face };
};

/**
 * The clip: a body, a spring bar, and a jaw that grips the card.
 *
 * Three parts because one rounded rectangle does not read as hardware - it
 * reads as a tab. The silhouette is what sells it: a wide top shoulder, a
 * narrower waist where the spring bar sits, and a jaw that hangs past the slot
 * punch so the card looks held rather than stuck on.
 *
 * Built in the XY plane and extruded on Z, matching the card body, so the whole
 * group takes the band's basis without a per-part rotation.
 */
const buildClampGeometry = (width: number) => {
  const w = width * 1.34;
  const parts: Three.BufferGeometry[] = [];

  /* The shoulder and body, one outline with a waist drawn into it. */
  const body = new THREE.Shape();
  const shoulder = CLAMP_BODY * 0.34;
  const waist = CLAMP_BODY * 0.5;
  const r = 0.018;
  body.moveTo(-w / 2 + r, CLAMP_BODY / 2);
  body.lineTo(w / 2 - r, CLAMP_BODY / 2);
  body.quadraticCurveTo(w / 2, CLAMP_BODY / 2, w / 2 - 0.008, CLAMP_BODY / 2 - 0.008);
  body.lineTo(w / 2 - 0.052, CLAMP_BODY / 2 - shoulder);
  body.lineTo(w / 2 - 0.06, 0);
  body.lineTo(w / 2 - 0.052, -CLAMP_BODY / 2 + shoulder);
  body.lineTo(w / 2 - 0.008, -CLAMP_BODY / 2 + 0.008);
  body.quadraticCurveTo(w / 2, -CLAMP_BODY / 2, w / 2 - r, -CLAMP_BODY / 2);
  body.lineTo(-w / 2 + r, -CLAMP_BODY / 2);
  body.quadraticCurveTo(-w / 2, -CLAMP_BODY / 2, -w / 2 + 0.008, -CLAMP_BODY / 2 + 0.008);
  body.lineTo(-w / 2 + 0.052, -CLAMP_BODY / 2 + shoulder);
  body.lineTo(-w / 2 + 0.06, 0);
  body.lineTo(-w / 2 + 0.052, CLAMP_BODY / 2 - shoulder);
  body.lineTo(-w / 2 + 0.008, CLAMP_BODY / 2 - 0.008);
  body.quadraticCurveTo(-w / 2, CLAMP_BODY / 2, -w / 2 + r, CLAMP_BODY / 2);

  const bodyGeometry = new THREE.ExtrudeGeometry(body, {
    depth: 0.026,
    bevelEnabled: true,
    bevelThickness: 0.012,
    bevelSize: 0.012,
    bevelSegments: 5,
    curveSegments: 8,
  });
  bodyGeometry.translate(0, 0, -0.013);
  parts.push(bodyGeometry);

  /* The spring bar across the waist - the detail that makes it read as a clip. */
  const bar = new THREE.CylinderGeometry(0.011, 0.011, w * 0.78, 14);
  bar.rotateZ(Math.PI / 2);
  bar.translate(0, waist * 0.16, 0.014);
  parts.push(bar);

  /* The jaw, below the body, overlapping the slot punch. */
  const jaw = new THREE.Shape();
  const jw = w * 0.62;
  traceRoundedRect(jaw, -jw / 2 + 0.01, -0.042, jw - 0.02, 0.052, 0.012);
  const jawGeometry = new THREE.ExtrudeGeometry(jaw, {
    depth: 0.02,
    bevelEnabled: true,
    bevelThickness: 0.008,
    bevelSize: 0.008,
    bevelSegments: 3,
    curveSegments: 6,
  });
  jawGeometry.translate(0, -CLAMP_BODY / 2 - 0.012, -0.01);
  parts.push(jawGeometry);

  return parts;
};

const buildBandGeometry = (count: number) => {
  const columns = BAND_COLUMNS.length;
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(count * columns * 3), 3));
  geometry.setAttribute("normal", new THREE.BufferAttribute(new Float32Array(count * columns * 3), 3));
  geometry.setAttribute("uv", new THREE.BufferAttribute(new Float32Array(count * columns * 2), 2));
  const index: number[] = [];
  for (let i = 0; i < count - 1; i++) {
    for (let c = 0; c < columns - 1; c++) {
      const a = i * columns + c;
      index.push(a, a + columns, a + 1, a + 1, a + columns, a + columns + 1);
    }
  }
  geometry.setIndex(index);
  return geometry;
};

/**
 * The contact shadow, as a radial falloff.
 *
 * A texture rather than a `ShadowMaterial`, because there is nothing in the
 * scene to cast: no floor, no receiver, one card. A shadow map would have to
 * invent a surface to darken, and the result would be a hard-edged quad.
 * A radial gradient is the honest version - it says "something is above this
 * point" and costs one 128px canvas.
 */
const buildShadowTexture = () => {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return new THREE.CanvasTexture(canvas);
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, "rgba(0, 0, 0, 0.85)");
  gradient.addColorStop(0.45, "rgba(0, 0, 0, 0.4)");
  gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
};;

const buildEnvironment = (renderer: Three.WebGLRenderer) => {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0.035, 0.035, 0.04);
  const geometry = new THREE.PlaneGeometry(1, 1);
  const materials: Three.Material[] = [];
  const panel = (intensity: number, position: [number, number, number], scale: [number, number], rotation = 0) => {
    const material = new THREE.MeshBasicMaterial({
      color: new THREE.Color(intensity, intensity, intensity),
      side: THREE.DoubleSide,
    });
    materials.push(material);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(...position);
    mesh.scale.set(scale[0], scale[1], 1);
    mesh.lookAt(0, 0, 0);
    mesh.rotateZ(rotation);
    scene.add(mesh);
  };
  panel(2.6, [0, 4.5, 8], [9, 4]);
  panel(6, [-5.5, 0.5, 7], [0.9, 14]);
  panel(4, [5, -0.5, 8], [0.6, 14]);
  panel(3.5, [0, -1, 9], [24, 0.35], Math.PI / 3);
  panel(2.5, [1, 2.5, 9], [24, 0.2], Math.PI / 3);
  panel(1.4, [0, 6, -6], [12, 4]);
  panel(0.5, [0, -7, 1], [16, 6]);
  panel(0.9, [8, 0, -2], [4, 10]);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const target = pmrem.fromScene(scene, 0.035);
  pmrem.dispose();
  geometry.dispose();
  materials.forEach((material) => material.dispose());
  return target;
};

const makeCanvasTexture = (canvas: HTMLCanvasElement, anisotropy: number) => {
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = anisotropy;
  return texture;
};

const buildGrainTexture = () => {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return new THREE.CanvasTexture(canvas);
  const random = seeded(7);
  const field = Float32Array.from({ length: size * size }, () => random());
  const height = (x: number, y: number) => {
    let sum = 0;
    for (let j = -1; j <= 1; j++) {
      for (let i = -1; i <= 1; i++) sum += field[((y + j + size) % size) * size + ((x + i + size) % size)];
    }
    return (sum / 9) * 1.6;
  };
  const image = ctx.createImageData(size, size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const nx = height((x - 1 + size) % size, y) - height((x + 1) % size, y);
      const ny = height(x, (y - 1 + size) % size) - height(x, (y + 1) % size);
      const length = Math.hypot(nx, ny, 1);
      const i = (y * size + x) * 4;
      image.data[i] = ((nx / length) * 0.5 + 0.5) * 255;
      image.data[i + 1] = ((ny / length) * 0.5 + 0.5) * 255;
      image.data[i + 2] = ((1 / length) * 0.5 + 0.5) * 255;
      image.data[i + 3] = 255;
    }
  }
  ctx.putImageData(image, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(5, 7);
  return texture;
};

const buildWeaveTexture = () => {
  const size = 128;
  const threads = 8;
  const random = seeded(19);
  const fiber = Float32Array.from({ length: size * size }, () => random());
  const profile = (f: number) => Math.sqrt(Math.max(0, 1 - 4 * f * f));
  const height = (x: number, y: number) => {
    const px = ((x % size) + size) % size;
    const py = ((y % size) + size) % size;
    const u = (px / size) * threads;
    const v = (py / size) * threads;
    const cu = Math.floor(u);
    const cv = Math.floor(v);
    const fu = u - cu - 0.5;
    const fv = v - cv - 0.5;
    const lift = (cu + cv) % 2 === 0;
    const warp = profile(fu) * (0.55 + 0.45 * Math.cos(fv * Math.PI * (lift ? 1 : 0.6)));
    const weft = profile(fv) * (0.55 + 0.45 * Math.cos(fu * Math.PI * (lift ? 0.6 : 1)));
    return (lift ? Math.max(warp, weft * 0.7) : Math.max(weft, warp * 0.7)) + fiber[py * size + px] * 0.08;
  };
  const data = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const nx = (height(x - 1, y) - height(x + 1, y)) * 1.6;
      const ny = (height(x, y - 1) - height(x, y + 1)) * 1.6;
      const length = Math.hypot(nx, ny, 1);
      const i = (y * size + x) * 4;
      data[i] = ((nx / length) * 0.5 + 0.5) * 255;
      data[i + 1] = ((ny / length) * 0.5 + 0.5) * 255;
      data[i + 2] = ((1 / length) * 0.5 + 0.5) * 255;
      data[i + 3] = 255;
    }
  }
  const texture = new THREE.DataTexture(data, size, size);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  texture.needsUpdate = true;
  return texture;
};

/**
 * Set a monospace font on a canvas context.
 *
 * Web fonts load asynchronously and the face is painted the moment the portrait
 * decodes, which is usually before the mono face has arrived. Canvas falls back
 * to a generic monospace silently and the badge renders in the wrong typeface
 * for a frame or two - so the mono family is passed in by the caller, which gets
 * it from the same token the rest of the design uses.
 */
const setMono = (ctx: CanvasRenderingContext2D, size: number, family: string) => {
  ctx.font = `600 ${size}px ${family}`;
};

/**
 * Break a line into lines that fit `maxWidth`.
 *
 * Canvas has no text wrapping, and the quote is the one piece of copy on this
 * card whose length is not known at build time - a short line fits on one row,
 * a longer one has to become three. Measuring with the same font the text will
 * actually be drawn in is the only way to get this right; guessing at character
 * counts is wrong for every font that is not the one being used.
 *
 * Mono, so every glyph is the same width, which makes the wrap predictable
 * enough to not need a hyphenation pass.
 */
const wrapText = (
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number
): string[] => {
  const words = text.trim().split(/\s+/);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (ctx.measureText(candidate).width > maxWidth && current) {
      lines.push(current);
      current = word;
      if (lines.length === maxLines) return lines;
    } else {
      current = candidate;
    }
  }
  if (current && lines.length < maxLines) lines.push(current);
  return lines;
};

/**
 * The badge face: photo, name, role, id, barcode.
 *
 * Laid out in fractions of the canvas rather than fixed pixels, because the
 * canvas is rebuilt at whatever aspect the card orientation implies and the
 * proportions have to hold through a resize. `textScale` drives the type size,
 * and every other measurement is derived from it, so one number resizes the
 * whole block coherently.
 */
const paintFace = (
  canvas: HTMLCanvasElement,
  image: HTMLImageElement | null,
  color: Rgb,
  fit: ImageFit,
  settings: Pick<Settings, "textScale" | "name" | "role" | "badgeId" | "barcode">,
  monoFamily: string
) => {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const w = canvas.width;
  const h = canvas.height;
  ctx.fillStyle = toCss(color);
  ctx.fillRect(0, 0, w, h);

  const unit = h * clamp(settings.textScale, 0.01, 0.2);
  const ink: Rgb = luminance(color) > 0.5 ? [0, 0, 0] : [1, 1, 1];
  const faint = toCss(ink, 0.55);
  const solid = toCss(ink, 0.92);

  /*
    The photo band: the top ~58%, inset from the card's sides.

    `fit` is honoured rather than assumed. `contain` is what a cut-out PNG wants
    - the silhouette stays whole and the card stock shows through the
    transparency, which is what a photo printed on a badge looks like. `cover`
    crops a square source to fill a taller band, which loses the shoulders, so
    it is available but is not what the badge asks for. Either way the draw is
    clipped to the band, so a cover never bleeds into the text below.
  */
  const photoTop = h * 0.1;
  const photoBottom = h * 0.575;
  if (image) {
    const boxW = w * 0.84;
    const boxH = photoBottom - photoTop;
    ctx.save();
    ctx.beginPath();
    ctx.rect(w * 0.08, photoTop, boxW, boxH);
    ctx.clip();
    const scale = (fit === "contain" ? Math.min : Math.max)(boxW / image.width, boxH / image.height);
    const iw = image.width * scale;
    const ih = image.height * scale;
    ctx.drawImage(image, (w - iw) / 2, photoBottom - ih, iw, ih);
    ctx.restore();
  }

  /* A hairline under the photo, and one around the whole face. */
  ctx.strokeStyle = toCss(ink, 0.16);
  ctx.lineWidth = Math.max(1, unit * 0.06);
  ctx.strokeRect(w * 0.045, h * 0.045, w * 0.91, h * 0.91);
  ctx.beginPath();
  ctx.moveTo(w * 0.08, photoBottom + unit * 0.3);
  ctx.lineTo(w * 0.92, photoBottom + unit * 0.3);
  ctx.stroke();

  /*
    The text block, left-aligned on one inset margin - the same rhythm the
    sidebar's mono links use, where everything hangs off a single leading edge.
  */
  const left = w * 0.11;
  let y = photoBottom + unit * 1.35;

  if (settings.name) {
    ctx.fillStyle = solid;
    setMono(ctx, unit * 0.72, monoFamily);
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.fillText(settings.name.toUpperCase(), left, y);
    y += unit * 0.95;
  }

  if (settings.role) {
    ctx.fillStyle = faint;
    setMono(ctx, unit * 0.46, monoFamily);
    ctx.fillText(settings.role.toUpperCase(), left, y);
    y += unit * 0.78;
  }

  if (settings.badgeId) {
    ctx.fillStyle = toCss(ink, 0.42);
    setMono(ctx, unit * 0.4, monoFamily);
    ctx.fillText(`ID: ${settings.badgeId}`, left, y);
  }

  /*
    The barcode.

    Deterministic bars rather than random ones: `seeded` gives the same widths
    on every repaint, so a theme change or a resize redraws an identical
    barcode instead of a card that looks reissued.
  */
  if (settings.barcode) {
    const random = seeded(31);
    const barTop = h * 0.845;
    const barBottom = h * 0.925;
    const left0 = w * 0.11;
    const span = w * 0.78;
    let x = left0;
    ctx.fillStyle = toCss(ink, 0.75);
    while (x < left0 + span) {
      const barWidth = Math.max(2, unit * (0.08 + random() * 0.16));
      if (random() > 0.34) ctx.fillRect(x, barTop, barWidth, barBottom - barTop);
      x += barWidth + unit * (0.1 + random() * 0.12);
    }
  }
};

/**
 * The back of the badge: stock, a quote, and the small print.
 *
 * No portrait. That was the reason this face existed at all - it used to be
 * painted from the front's settings, which printed the name and the barcode
 * mirrored - and a real badge's reverse is not a second photograph. It is the
 * quiet side: something worth reading if you flip it over, and details small
 * enough to reward looking closely.
 *
 * The details are the point. A magnetic stripe, a guilloche rosette, a
 * microtext line and a serial are all things a physical badge carries and none
 * of them carry information - they are there because their absence is what
 * makes a rectangle look like a web image instead of an object.
 */
const paintBackFace = (
  canvas: HTMLCanvasElement,
  image: HTMLImageElement | null,
  color: Rgb,
  fit: ImageFit,
  settings: Pick<Settings, "textScale" | "quote" | "quoteBy">,
  monoFamily: string
) => {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const w = canvas.width;
  const h = canvas.height;

  ctx.fillStyle = toCss(color);
  ctx.fillRect(0, 0, w, h);

  const unit = h * clamp(settings.textScale, 0.01, 0.2);
  const ink: Rgb = luminance(color) > 0.5 ? [0, 0, 0] : [1, 1, 1];
  const faint = toCss(ink, 0.5);
  const solid = toCss(ink, 0.9);
  const left = w * 0.11;
  const inner = w * 0.78;

  /*
    A very faint portrait, if one was given for the back specifically.

    `images.back || images.front` used to fall through to the front portrait,
    which put a second copy of the same face on the reverse. Now it only draws
    when `backImage` was passed on its own, and then it is washed back to a
    watermark so the type still reads over it.
  */
  if (image) {
    ctx.save();
    ctx.globalAlpha = 0.12;
    const scale = (fit === "contain" ? Math.min : Math.max)(w / image.width, h / image.height);
    const iw = image.width * scale;
    const ih = image.height * scale;
    ctx.drawImage(image, (w - iw) / 2, (h - ih) / 2, iw, ih);
    ctx.restore();
  }

  /*
    The border.

    0.16 alpha was chosen for a card that sat on a page and read as a UI
    surface. A badge is a physical object: its edge is the thing that separates
    it from the page, and a 16% line is below the threshold of visibility on
    both palettes. 0.35 is the point at which it reads as a rule rather than
    as a suggestion.
  */
  ctx.strokeStyle = toCss(ink, 0.35);
  ctx.lineWidth = Math.max(1.5, unit * 0.07);
  ctx.strokeRect(w * 0.045, h * 0.045, w * 0.91, h * 0.91);

  /*
    The fingerprint.

    Drawn as nested ridges around a core, which is what a real print is: loops
    of skin that close on a centre, with a delta below where two ridge systems
    meet. The ridge path is a superellipse - a rounded rectangle rather than an
    ellipse - because fingertips are wider at the base than a circle, and the
    gap between ridge lines is what makes it read as a print rather than as
    concentric circles.

    Stroke weight matters more than it looks. The earlier rosette used
    `unit * 0.03` at 9% alpha, which on a card this size is a sub-pixel line at
    9% contrast - present in the texture, invisible on screen. A fingerprint
    that cannot be seen is not a fingerprint, so the line is roughly twice that
    and the ink is nearly double the alpha.
  */
  const printTop = h * 0.11;
  const printBottom = h * 0.4;
  const printCy = (printTop + printBottom) / 2;
  const printRx = ((printBottom - printTop) / 2) * 0.82;
  const printRy = (printBottom - printTop) / 2;

  ctx.save();
  ctx.beginPath();
  ctx.rect(w * 0.06, h * 0.06, w * 0.88, h * 0.88);
  ctx.clip();
  ctx.strokeStyle = toCss(ink, 0.26);
  ctx.lineWidth = Math.max(1.5, unit * 0.062);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  const ridges = 7;
  for (let ring = 0; ring < ridges; ring++) {
    const t = ring / (ridges - 1);
    const rx = printRx * (0.16 + t * 0.84);
    const ry = printRy * (0.2 + t * 0.8);
    /*
      A superellipse: `|x/rx|^n + |y/ry|^n = 1` with n at 2.6 gives the flat-ish
      sides and rounded corners of a fingertip. Sampled as a parametric curve
      because canvas has no superellipse primitive, and `n = 2` would just be an
      ellipse again.
    */
    const n = 2.6;
    const steps = 128;
    ctx.beginPath();
    for (let step = 0; step <= steps; step++) {
      const theta = (step / steps) * Math.PI * 2;
      const ct = Math.cos(theta);
      const st = Math.sin(theta);
      const px = w / 2 + Math.sign(ct) * Math.pow(Math.abs(ct), 2 / n) * rx;
      const py = printCy + Math.sign(st) * Math.pow(Math.abs(st), 2 / n) * ry;
      if (step === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.stroke();
  }

  /*
    The delta - the fork below the core where two ridge systems meet.

    Drawn as a short open chevron rather than another closed loop. It is the one
    feature that makes a pattern read as "fingerprint" specifically; concentric
    loops alone read as a target.
  */
  ctx.beginPath();
  ctx.moveTo(w / 2 - printRx * 0.62, printCy + printRy * 0.34);
  ctx.quadraticCurveTo(w / 2 - printRx * 0.5, printCy + printRy * 0.62, w / 2 - printRx * 0.3, printCy + printRy * 0.82);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(w / 2 - printRx * 0.62, printCy + printRy * 0.34);
  ctx.quadraticCurveTo(w / 2 - printRx * 0.82, printCy + printRy * 0.6, w / 2 - printRx * 0.96, printCy + printRy * 0.72);
  ctx.stroke();
  ctx.restore();

  /* The magnetic stripe, at the height a real card carries one. */
  ctx.fillStyle = toCss(ink, 0.1);
  ctx.fillRect(w * 0.06, h * 0.415, w * 0.88, h * 0.055);

  /*
    The quote.

    Centred, and set larger than any other type on the card - it is the whole
    reason to turn the badge over. Wrapped to three lines at most: a fourth
    would run into the microtext, and truncating a quote mid-sentence reads as a
    mistake rather than as a design decision, so the caller picks short ones.
  */
  if (settings.quote) {
    const quoteSize = unit * 0.62;
    setMono(ctx, quoteSize, monoFamily);
    const lines = wrapText(ctx, settings.quote, inner, 3);
    const lineHeight = quoteSize * 1.5;
    let y = h * 0.58;
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    for (const line of lines) {
      ctx.fillStyle = solid;
      /*
        Centred by `textAlign`, at `w / 2`.

        These were doing the same job twice: `textAlign = "center"` centres the
        text on the x it is given, and the old line *also* pre-shifted that x by
        half the measured width - so the quote was drawn centred on a point half
        a line to the left, and its left edge ran off the card. Long lines went
        past the edge entirely, which is the "not fully displaying" symptom.
      */
      ctx.fillText(line, w / 2, y);
      y += lineHeight;
    }

    /* The attribution, set under a rule so it reads as a citation. */
    if (settings.quoteBy) {
      ctx.strokeStyle = toCss(ink, 0.2);
      ctx.lineWidth = Math.max(1, unit * 0.04);
      ctx.beginPath();
      ctx.moveTo(w / 2 - unit * 0.6, y - lineHeight * 0.55);
      ctx.lineTo(w / 2 + unit * 0.6, y - lineHeight * 0.55);
      ctx.stroke();

      setMono(ctx, unit * 0.4, monoFamily);
      ctx.fillStyle = faint;
      ctx.textAlign = "center";
      ctx.fillText(settings.quoteBy.toUpperCase(), w / 2, y - lineHeight * 0.1);
    }
    ctx.textAlign = "left";
  }

  /*
    Microtext, the security-print line.

    Far too small to read at card size, which is the entire idea - on a real one
    it is a strip of text repeated so densely that a photocopy of it is a
    smudge. Drawn at a fraction of the body size and given a fixed string, so it
    reads as texture rather than as a caption.
  */
  setMono(ctx, unit * 0.16, monoFamily);
  ctx.fillStyle = toCss(ink, 0.3);
  const micro = "EMMANUEL.DEV * VERIFIED CREDENTIAL * ";
  const microWidth = ctx.measureText(micro).width;
  let mx = w * 0.06;
  const microY = h * 0.845;
  while (mx < w * 0.94) {
    ctx.fillText(micro, mx, microY);
    mx += microWidth;
  }

  /* A second, shorter repeat line, the way a card carries two. */
  setMono(ctx, unit * 0.2, monoFamily);
  ctx.fillStyle = toCss(ink, 0.42);
  ctx.fillText("ISSUED 2026 · NON-TRANSFERABLE", left, h * 0.895);

  /* A serial in the corner, right-aligned like the real thing. */
  setMono(ctx, unit * 0.22, monoFamily);
  ctx.fillStyle = faint;
  ctx.textAlign = "right";
  ctx.fillText("No. 0001", w - left, h * 0.895);
  ctx.textAlign = "left";
};

const paintStrap = (
  canvas: HTMLCanvasElement,
  image: HTMLImageElement | null,
  color: Rgb,
  text: string,
  monoFamily: string
) => {
  const across = 192;
  const along = image ? Math.max(64, Math.round((image.width / image.height) * across)) : across * 2;
  canvas.width = across;
  canvas.height = along;
  const ctx = canvas.getContext("2d");
  if (!ctx) return along / across;
  ctx.fillStyle = toCss(color);
  ctx.fillRect(0, 0, across, along);
  if (image) {
    ctx.save();
    ctx.translate(across, 0);
    ctx.rotate(Math.PI / 2);
    ctx.drawImage(image, 0, 0, along, across);
    ctx.restore();
    return along / across;
  }
  const ink: Rgb = luminance(color) > 0.5 ? [0, 0, 0] : [1, 1, 1];

  /*
    The weave.

    A fine crosshatch in the colour map as well as the normal map that is
    already on the material. The normal map alone reads as relief when the strap
    catches a highlight, but on a dark strap at a distance the colour is what
    carries the texture, and without it the band looks like flat vinyl.
  */
  ctx.fillStyle = toCss(ink, 0.06);
  for (let y = 0; y < along; y += 3) ctx.fillRect(0, y, across, 1);
  ctx.fillStyle = toCss(ink, 0.1);
  for (let x = 0; x < across; x += 3) ctx.fillRect(x, 0, 1, along);

  /* Selvedge edges - the stitched borders down each side of a real webbing. */
  ctx.fillStyle = toCss(ink, 0.22);
  for (let y = 0; y < along; y += 14) {
    ctx.fillRect(across * 0.075, y, 2, 8);
    ctx.fillRect(across * 0.925 - 2, y, 2, 8);
  }

  /*
    Repeated text down the strap.

    Drawn rotated a quarter turn because the band's texture is mapped with v
    running along its length - text painted horizontally here would read across
    the strap rather than down it. The tile is one repeat tall, so `tileRatio`
    stays 2 and the strap shows this twice per repeat.
  */
  if (text) {
    ctx.save();
    ctx.translate(across, 0);
    ctx.rotate(Math.PI / 2);
    const size = across * 0.2;
    setMono(ctx, size, monoFamily);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = toCss(ink, 0.34);
    /*
      Twice per tile, at a third and two thirds along, so the repeat does not
      read as one word per repeat with a long gap - a real printed lanyard is
      continuous.
    */
    ctx.fillText(text.toUpperCase(), along * 0.25, across * 0.5);
    ctx.fillText(text.toUpperCase(), along * 0.75, across * 0.5);
    ctx.restore();
  }

  return along / across;
};

const createSimulation = (): Simulation => {
  const vectors = () => Array.from({ length: JOINTS + 1 }, () => new THREE.Vector3());
  return {
    nodes: vectors(),
    previous: vectors(),
    velocities: vectors(),
    lengths: new Float64Array(JOINTS),
    impulses: new Float64Array(JOINTS),
    rest: 1,
    anchor: new THREE.Vector3(),
    body: {
      position: new THREE.Vector3(),
      previous: new THREE.Vector3(),
      velocity: new THREE.Vector3(),
      quaternion: new THREE.Quaternion(),
      previousQuaternion: new THREE.Quaternion(),
      angular: new THREE.Vector3(),
      mass: 1,
      inverseInertia: new THREE.Vector3(1, 1, 1),
      hang: new THREE.Vector3(),
    },
    grab: null,
    turn: 0,
    twist: 0,
    twistRaw: 0,
    calm: 0,
  };
};

/*
  The solver's scratch space.

  A `let` with no initialiser rather than a `const` of constructed vectors,
  because three is loaded by dynamic import and nothing exists to construct
  until that resolves. Every use is inside a helper that the effect calls after
  the import lands, so nothing can read it early - and TypeScript does not track
  definite assignment across a function boundary, so the binding needs no
  non-null assertion at the use sites either.

  Ten reusable vectors and two quaternions, reused every solver iteration, is
  the point: allocating these per frame is what turns a four-segment rope into
  a garbage-collection problem.
*/
type Scratch = {
  a: Three.Vector3;
  b: Three.Vector3;
  c: Three.Vector3;
  d: Three.Vector3;
  e: Three.Vector3;
  f: Three.Vector3;
  g: Three.Vector3;
  pin: Three.Vector3;
  q: Three.Quaternion;
  r: Three.Quaternion;
};

let scratch: Scratch;

/*
  The library itself, late-bound.

  Every module-level helper below reaches for `THREE` as a *value* - to build a
  `Shape`, a `CanvasTexture`, a `Vector3` - and those helpers sit above the
  effect, so a `const THREE` inside the effect's IIFE would be out of scope for
  all of them. Binding the awaited module to a module-level `let` keeps the
  original `new THREE.X(...)` call sites intact; only the type positions had to
  move to `Three.`, and those were all interfaces or signatures, which a `let`
  can never satisfy - `THREE.Vector3` in an interface resolves against the
  *namespace*, not against a variable.

  Assigned once, by the effect, before any helper runs.
*/
let THREE: typeof import("three");

const applyInverseInertia = (body: Body, vector: Three.Vector3, out: Three.Vector3) => {
  scratch.r.copy(body.quaternion).invert();
  out.copy(vector).applyQuaternion(scratch.r);
  out.set(out.x * body.inverseInertia.x, out.y * body.inverseInertia.y, out.z * body.inverseInertia.z);
  return out.applyQuaternion(body.quaternion);
};

const rotateBody = (q: Three.Quaternion, w: Three.Vector3) => {
  const { x: qx, y: qy, z: qz, w: qw } = q;
  q.x += 0.5 * (w.x * qw + w.y * qz - w.z * qy);
  q.y += 0.5 * (w.y * qw + w.z * qx - w.x * qz);
  q.z += 0.5 * (w.z * qw + w.x * qy - w.y * qx);
  q.w += 0.5 * (-w.x * qx - w.y * qy - w.z * qz);
  q.normalize();
};

const bodyWeight = (body: Body, r: Three.Vector3, normal: Three.Vector3) => {
  const rn = scratch.c.crossVectors(r, normal);
  return 1 / body.mass + rn.dot(applyInverseInertia(body, rn, scratch.d));
};

const pushBody = (body: Body, r: Three.Vector3, impulse: Three.Vector3) => {
  body.position.addScaledVector(impulse, 1 / body.mass);
  rotateBody(body.quaternion, applyInverseInertia(body, scratch.e.crossVectors(r, impulse), scratch.f));
};

const solveSegment = (sim: Simulation, i: number, h: number, physics: Physics) => {
  const { nodes, body } = sim;
  const a = nodes[i];
  const wa = i === 0 ? 0 : NODE_WEIGHT;
  const last = i === JOINTS - 1;
  const r = scratch.g;
  let b = nodes[i + 1];
  if (last) {
    r.copy(body.hang).applyQuaternion(body.quaternion);
    b = scratch.b.copy(body.position).add(r);
  }
  const delta = scratch.a.subVectors(b, a);
  const length = delta.length();
  const stretch = length - sim.rest;
  if (stretch <= 0 || length < 1e-9) return;
  const normal = delta.divideScalar(length);
  const wb = last ? bodyWeight(body, r, normal) : NODE_WEIGHT;
  const rate = (length - sim.lengths[i]) / h;
  const tension =
    physics.hold * Math.tanh((physics.stiffness * stretch) / physics.hold) +
    physics.spring * stretch +
    physics.bandDamping * Math.max(0, rate);
  const room = tension * h * h - sim.impulses[i];
  if (room <= 0) return;
  const lambda = Math.min(stretch / (wa + wb), room);
  sim.impulses[i] += lambda;
  if (wa) a.addScaledVector(normal, lambda * wa);
  if (last) pushBody(body, r, normal.multiplyScalar(-lambda));
  else b.addScaledVector(normal, -lambda * wb);
};

const solvePin = (body: Body, grab: Grab, target: Three.Vector3) => {
  const r = scratch.g.copy(grab.local).applyQuaternion(body.quaternion);
  const delta = scratch.a.copy(target).sub(body.position).sub(r);
  const distance = delta.length();
  if (distance < 1e-9) return;
  const normal = delta.divideScalar(distance);
  const lambda = distance / bodyWeight(body, r, normal);
  pushBody(body, r, normal.multiplyScalar(lambda));
};

const placeHanging = (sim: Simulation, layout: CardLayout, intro: boolean) => {
  const { nodes, previous, velocities, body, anchor } = sim;
  nodes[0].copy(anchor);
  for (let i = 1; i <= JOINTS; i++) {
    nodes[i].copy(nodes[i - 1]);
    if (intro) nodes[i].x += sim.rest;
    else nodes[i].y -= sim.rest;
  }
  body.quaternion.identity();
  if (intro) body.quaternion.setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI / 2);
  body.hang.set(0, layout.hangY, 0);
  const offset = scratch.a.copy(body.hang).applyQuaternion(body.quaternion);
  body.position.copy(nodes[JOINTS]).sub(offset);
  body.previous.copy(body.position);
  body.previousQuaternion.copy(body.quaternion);
  body.velocity.set(0, 0, 0);
  body.angular.set(0, 0, 0);
  for (let i = 0; i <= JOINTS; i++) {
    previous[i].copy(nodes[i]);
    velocities[i].set(0, 0, 0);
  }
  sim.lengths.fill(sim.rest);
  sim.turn = 0;
  sim.twist = 0;
  sim.twistRaw = 0;
  sim.calm = 0;
};

const configureSimulation = (sim: Simulation, layout: CardLayout, length: number) => {
  sim.rest = length / JOINTS;
  const { width, height } = layout;
  const body = sim.body;
  const t = THICKNESS + BEVEL * 2;
  body.mass = 1;
  body.inverseInertia.set(
    12 / (height * height + t * t),
    12 / (width * width + t * t),
    12 / (width * width + height * height)
  );
  body.hang.set(0, layout.hangY, 0);
};

const stepSimulation = (sim: Simulation, dt: number, physics: Physics, time: number) => {
  const steps = Math.max(1, Math.ceil(dt / MAX_STEP - 1e-6));
  const h = dt / steps;
  const { nodes, previous, velocities, body } = sim;
  /*
    Idle sway.

    Two incommensurable frequencies so the loop never repeats visibly, at an
    amplitude small enough to read as a badge hanging rather than a badge on a
    string. Applied as a lateral force on the same nodes the breeze uses, so it
    participates in the constraint solve and cannot desync from it.

    Zero when `prefers-reduced-motion` is set - `physics()` already zeroes it,
    and a card that must not move still gets its drag, which is a user-initiated
    gesture and stays available.
  */
  const swayX = physics.sway * (Math.sin(time * 0.31) * 0.75 + Math.sin(time * 0.47 + 1.1) * 0.25) * 2.6;
  const windX = physics.breeze * (Math.sin(time * 0.53) * 0.7 + Math.sin(time * 1.31 + 1.7) * 0.3) * 3 + swayX;
  const windZ = physics.breeze * Math.sin(time * 0.37 + 0.6) * 2;
  const grab = sim.grab;
  const pin = scratch.pin;
  const nodeDrag = Math.exp(-physics.nodeDrag * h);
  const linearDrag = Math.exp(-physics.linearDrag * h);
  const angularDrag = Math.exp(-physics.angularDrag * h);

  for (let s = 0; s < steps; s++) {
    for (let i = 1; i < JOINTS; i++) {
      const v = velocities[i];
      v.y -= physics.gravity * h;
      v.x += windX * h;
      v.z += windZ * h;
      previous[i].copy(nodes[i]);
      nodes[i].addScaledVector(v, h);
    }

    body.previous.copy(body.position);
    body.previousQuaternion.copy(body.quaternion);
    const q = body.quaternion;
    if (grab) {
      const turn = scratch.q.copy(grab.rotation).multiply(scratch.r.copy(q).invert());
      if (turn.w < 0) turn.set(-turn.x, -turn.y, -turn.z, -turn.w);
      const torque = scratch.a.set(turn.x, turn.y, turn.z).multiplyScalar(2 * physics.grip);
      torque.addScaledVector(body.angular, -physics.gripDamping);
      body.angular.addScaledVector(applyInverseInertia(body, torque, scratch.b), h);
    }
    const up = scratch.a.set(0, 1, 0).applyQuaternion(q);
    const front = scratch.b.set(-up.x * up.z, -up.y * up.z, 1 - up.z * up.z);
    if (front.lengthSq() > 1e-3) {
      const facing = scratch.d.set(0, 0, 1).applyQuaternion(q);
      const raw = Math.atan2(scratch.e.crossVectors(front, facing).dot(up), front.dot(facing));
      let turned = raw - sim.twistRaw;
      if (turned > Math.PI) turned -= Math.PI * 2;
      else if (turned < -Math.PI) turned += Math.PI * 2;
      sim.twist += turned;
      sim.twistRaw = raw;
    }
    if (!grab) {
      const spin = body.angular.dot(up);
      body.angular.addScaledVector(up, (physics.twist * (sim.turn - sim.twist) - physics.twistDamping * spin) * h);
    }
    body.velocity.y -= physics.gravity * h;
    body.velocity.x += windX * 0.35 * h;
    body.velocity.z += windZ * 0.35 * h;
    body.position.addScaledVector(body.velocity, h);
    rotateBody(body.quaternion, scratch.f.copy(body.angular).multiplyScalar(h));

    sim.impulses.fill(0);
    if (grab) pin.lerpVectors(grab.from, grab.target, (s + 1) / steps);
    for (let iteration = 0; iteration < ITERATIONS; iteration++) {
      for (let i = 0; i < JOINTS; i++) solveSegment(sim, i, h, physics);
      if (grab) solvePin(body, grab, pin);
    }

    for (let i = 1; i < JOINTS; i++) {
      const v = velocities[i].subVectors(nodes[i], previous[i]).divideScalar(h).multiplyScalar(nodeDrag);
      v.multiplyScalar(1 / (1 + physics.nodeAir * v.length() * h));
    }
    body.velocity.subVectors(body.position, body.previous).divideScalar(h);
    const dq = scratch.q.copy(body.previousQuaternion).invert().premultiply(body.quaternion);
    body.angular.set(dq.x, dq.y, dq.z).multiplyScalar((2 / h) * (dq.w < 0 ? -1 : 1));

    const normal = scratch.a.set(0, 0, 1).applyQuaternion(body.quaternion);
    const across = body.velocity.dot(normal);
    const along = scratch.b.copy(body.velocity).addScaledVector(normal, -across);
    along.multiplyScalar(1 / (1 + physics.air * along.length() * h));
    body.velocity
      .copy(along)
      .addScaledVector(normal, across / (1 + physics.broadside * Math.abs(across) * h))
      .multiplyScalar(linearDrag);
    body.angular.multiplyScalar(angularDrag / (1 + physics.spinAir * body.angular.length() * h));
    if (body.velocity.lengthSq() > 3600) body.velocity.setLength(60);
    if (body.angular.lengthSq() > 1600) body.angular.setLength(40);

    nodes[JOINTS].copy(body.hang).applyQuaternion(body.quaternion).add(body.position);
    for (let i = 0; i < JOINTS; i++) sim.lengths[i] = nodes[i].distanceTo(nodes[i + 1]);
  }

  if (grab) grab.from.copy(grab.target);

  let energy = body.velocity.lengthSq() + body.angular.lengthSq() * 0.3;
  for (let i = 1; i < JOINTS; i++) energy += velocities[i].lengthSq() * 0.05;
  sim.calm = energy < 2e-4 ? sim.calm + dt : 0;
};

const Lanyard = ({
  frontImage,
  backImage,
  imageFit = "cover",
  cardColor = "#ffffff",
  orientation = "portrait",
  finish = "glossy",
  cornerRadius = 0.3,
  size = 0.6,
  anchor = "center",
  strapLength = 0.5,
  strapImage,
  strapColor = "#111111",
  strapWidth = 0.65,
  metal = "silver",
  gravity = 1,
  damping = 0.5,
  elasticity = 0.5,
  breeze = 0.5,
  interactive = true,
  intro = true,
  name = "",
  role = "",
  badgeId = "",
  quote = "",
  quoteBy = "",
  barcode = false,
  strapText = "",
  textScale = 0.055,
  shadow = 0,
  sheen = 0,
  sway = 0,
  onReady,
  className = "",
  style,
}: LanyardProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const settingsRef = useRef<Settings | null>(null);
  const applyRef = useRef<(() => void) | null>(null);

  settingsRef.current = {
    frontImage,
    backImage,
    imageFit: imageFit === "contain" ? "contain" : "cover",
    cardColor,
    orientation: orientation === "landscape" ? "landscape" : "portrait",
    finish,
    cornerRadius,
    size,
    anchor,
    strapLength,
    strapImage,
    strapColor,
    strapWidth,
    metal,
    gravity,
    damping,
    elasticity,
    breeze,
    interactive,
    intro,
    name,
    role,
    badgeId,
    quote,
    quoteBy,
    barcode,
    strapText,
    textScale,
    shadow,
    sheen,
    sway,
    onReady,
  };

  useEffect(() => {
    applyRef.current?.();
  });

  /*
    The effect is synchronous; the work inside it is not.

    `three` arrives by dynamic import so that the ~600kB of library lands in its
    own chunk, fetched only when a card actually mounts, rather than sitting in
    the main bundle of every page that ships this component. React requires an
    effect to return a function or nothing - returning the promise an `async`
    effect would resolve to throws - so the import is awaited inside an IIFE and
    the teardown is parked in `dispose` for the synchronous cleanup to call.

    The race the `cancelled` guard closes: unmounting between the mount and the
    import resolving. `await` resumes in a later microtask, by which point the
    cleanup has already run and there is nothing to hand it, so the continuation
    bails rather than building a renderer and a RAF loop that nothing owns.
  */
  useEffect(() => {
    let dispose: (() => void) | undefined;
    let cancelled = false;

    void (async () => {
      const three = await import("three");

      if (cancelled) return;

      THREE = three;

      scratch = {
        a: new THREE.Vector3(),
        b: new THREE.Vector3(),
        c: new THREE.Vector3(),
        d: new THREE.Vector3(),
        e: new THREE.Vector3(),
        f: new THREE.Vector3(),
        g: new THREE.Vector3(),
        pin: new THREE.Vector3(),
        q: new THREE.Quaternion(),
        r: new THREE.Quaternion(),
      };

      const container = containerRef.current;
      if (!container) return;

      /*
        Read once, here, because the canvas below needs it for its fade and the
        rest of the effect needs it for the solver. Declaring it at the point of
        first use would have been two declarations, and declaring it further
        down - where it was - is a temporal dead zone error for the canvas.
      */
      const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

      let renderer: Three.WebGLRenderer;
      try {
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
      } catch {
        return;
      }
      renderer.setClearColor(0x000000, 0);
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.NeutralToneMapping;
      renderer.toneMappingExposure = 1;
      const canvas = renderer.domElement;
      canvas.setAttribute("aria-hidden", "true");

      /*
        The canvas lives on <body>, not in this component's box.

        It used to be a child of `container`, which put it inside the hero's
        stacking context and inside the layout box's own bounds - and that is
        the whole of the clipping bug. Drag the card and it swung toward the
        edge of a 22rem box and vanished, because a canvas can only ever paint
        inside its own rectangle. No z-index fixes that; the surface itself has
        to be bigger than the thing it draws.

        So it is a fixed, viewport-sized, transparent layer over the page, and
        `container` keeps its job as the invisible layout box - reserving the
        hero column's width and telling the scene where to hang the card.

        `pointer-events: none` is what lets the page underneath stay live: the
        text, the social links and the sidebar all keep receiving clicks,
        because this canvas is never in their hit path. Dragging works anyway
        because the listeners are on `document` and decide for themselves
        whether the pointer is over the card - see `onPointerDown` below.

        z-index 60 puts it above the sidebar and nav (both 50) and above the
        project deck (30), and below the project panel (110), the v4 controls
        (140), the design switch (150) and the context menu (200). A modal
        still covers the badge, which is right: you are looking at the modal.
      */
      Object.assign(canvas.style, {
        position: "fixed",
        inset: "0",
        width: "100%",
        height: "100%",
        display: "block",
        pointerEvents: "none",
        zIndex: "60",
      });
      /*
        Faded in from zero on the first frame.

        Because the canvas is no longer a child of the wrapper, the wrapper's
        Tailwind opacity classes no longer reach it - those would style an empty
        div. The crossfade has to happen here, on the canvas itself, and it is
        paired with the caller's fallback image fading out on the same signal.
      */
      canvas.style.opacity = "0";
      canvas.style.transition = reducedMotion ? "none" : "opacity 500ms ease-out";
      document.body.appendChild(canvas);

      const anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
      const scene = new THREE.Scene();
      const environment = buildEnvironment(renderer);
      scene.environment = environment.texture;
      const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 200);
      const keyLight = new THREE.DirectionalLight(0xffffff, 1.6);
      keyLight.position.set(-2.5, 4, 6);
      const fillLight = new THREE.DirectionalLight(0xffffff, 0.35);
      fillLight.position.set(3, -1, 4);
      /*
        The rim light: dark until hovered, then it lifts the card's top edge.
        Positioned behind and above so it grazes the bevel rather than the face,
        which is what makes an edge highlight look like an edge and not a wash.
      */
      const rimLight = new THREE.DirectionalLight(0xffffff, 0);
      rimLight.position.set(1.5, 3.5, -2.5);
      scene.add(keyLight, fillLight, rimLight);

      const imageCache = new Map<string, Promise<HTMLImageElement | null>>();
      const images: Images = { front: null, back: null, strap: null };
      const frontCanvas = document.createElement("canvas");
      const backCanvas = document.createElement("canvas");
      const strapCanvas = document.createElement("canvas");
      const frontTexture = makeCanvasTexture(frontCanvas, anisotropy);
      const backTexture = makeCanvasTexture(backCanvas, anisotropy);
      const strapTexture = makeCanvasTexture(strapCanvas, anisotropy);
      strapTexture.wrapS = THREE.ClampToEdgeWrapping;
      strapTexture.wrapT = THREE.RepeatWrapping;
      const grain = buildGrainTexture();
      const weave = buildWeaveTexture();
      const foilUniforms = {
        foilStrength: { value: 0 },
        foilAspect: { value: 1.4 },
        foilKey: { value: new THREE.Vector3() },
        foilFill: { value: new THREE.Vector3() },
        foilTop: { value: new THREE.Vector3() },
      };
      const injectFoil = (shader: Three.WebGLProgramParametersWithUniforms) => {
        Object.assign(shader.uniforms, foilUniforms);
        shader.vertexShader = shader.vertexShader
          .replace("#include <common>", `#include <common>\n${FOIL_VERTEX_HEAD}`)
          .replace("#include <project_vertex>", `#include <project_vertex>\n${FOIL_VERTEX_BODY}`);
        shader.fragmentShader = shader.fragmentShader
          .replace("#include <common>", `#include <common>\n${FOIL_FRAGMENT_HEAD}`)
          .replace("#include <opaque_fragment>", `${FOIL_FRAGMENT_BODY}\n#include <opaque_fragment>`);
      };

      const frontMaterial = new THREE.MeshPhysicalMaterial({
        map: frontTexture,
        normalMap: grain,
        normalScale: new THREE.Vector2(0.06, 0.06),
      });
      const backMaterial = new THREE.MeshPhysicalMaterial({
        map: backTexture,
        normalMap: grain,
        normalScale: new THREE.Vector2(0.06, 0.06),
      });
      frontMaterial.onBeforeCompile = injectFoil;
      backMaterial.onBeforeCompile = injectFoil;
      const edgeMaterial = new THREE.MeshPhysicalMaterial();
      const metalMaterial = new THREE.MeshStandardMaterial({ metalness: 1 });
      const bandMaterial = new THREE.MeshPhysicalMaterial({
        map: strapTexture,
        normalMap: weave,
        normalScale: new THREE.Vector2(0.7, 0.7),
        roughness: 0.68,
        sheen: 1,
        sheenRoughness: 0.42,
        sheenColor: new THREE.Color(0.32, 0.32, 0.34),
        side: THREE.DoubleSide,
      });

      const cardGroup = new THREE.Group();
      const bodyMesh = new THREE.Mesh(undefined, edgeMaterial);
      const frontMesh = new THREE.Mesh(undefined, frontMaterial);
      const backMesh = new THREE.Mesh(undefined, backMaterial);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(RING_RADIUS, RING_TUBE, 18, 72), metalMaterial);
      ring.rotation.y = Math.PI / 2 - 0.7;
      cardGroup.add(bodyMesh, frontMesh, backMesh, ring);
      scene.add(cardGroup);

      const bandGeometry = buildBandGeometry(SAMPLES);
      const band = new THREE.Mesh(bandGeometry, bandMaterial);
      band.frustumCulled = false;
      scene.add(band);

      const clampGroup = new THREE.Group();
      const clampParts = buildClampGeometry(STRAP_WIDTH);
      const clampMesh = new THREE.Mesh(clampParts[0], metalMaterial);
      clampMesh.position.y = EYELET_RADIUS + CLAMP_BODY / 2 - 0.004;
      /*
        The spring bar and the jaw, held as a typed list rather than found by
        scanning `clampGroup.children` later. `children` is `Object3D[]`, so
        every lookup has to be narrowed back to `Mesh` at the point of use; a
        list typed `Mesh[]` carries the knowledge once.
      */
      const clampDetail = clampParts.slice(1).map((geometry) => new THREE.Mesh(geometry, metalMaterial));
      clampGroup.add(clampMesh, ...clampDetail);
      const eyelet = new THREE.Mesh(new THREE.TorusGeometry(EYELET_RADIUS, 0.0105, 14, 40), metalMaterial);
      clampGroup.add(eyelet);
      scene.add(clampGroup);

      /*
        The contact shadow.

        A single quad in the plane behind the card, not a child of `cardGroup` -
        it has to lag the card as it swings, so it is driven from the body each
        frame instead of inheriting the body's transform. `depthWrite` off so
        it never occludes the card it sits behind.
      */
      const shadowMaterial = new THREE.MeshBasicMaterial({
        map: buildShadowTexture(),
        transparent: true,
        depthWrite: false,
        opacity: 0,
      });
      const shadow = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), shadowMaterial);
      shadow.visible = false;
      scene.add(shadow);

      const sim = createSimulation();
      const controls: Three.Vector3[] = [];
      const mouth = new THREE.Vector3();
      const tuck = new THREE.Vector3();
      const curve = new THREE.CatmullRomCurve3(controls, false, "centripetal");
      const view = { width: 1, height: 1 };
      let layout = cardLayout("portrait", 0.3);
      /*
        World units per screen pixel, written by `frameView` and read by the drag
        leash.

        Hoisted out of `frameView` because two places need the same scale and
        they cannot both derive it independently without the risk of the leash
        disagreeing with the camera about where the viewport edge is.
      */
      let worldScale = 0.01;
      let applied: Applied = {};
      let strapScale = STRAP_WIDTH;
      let tileRatio = 2;

      /*
        The mono family, read off the document rather than hardcoded.

        The badge's type has to be the same mono the rest of the design uses -
        `--font-geist-mono`, falling back to the same stack the sidebar's rules
        carry. Reading it once, from the element that will actually render it,
        means the canvas and the DOM cannot disagree.

        Read inside the effect because it needs a live document with the token
        resolved; at module scope it would run during the server render, where
        there is no computed style to read.
      */
      const monoFamily = (() => {
        const value = getComputedStyle(document.documentElement)
          .getPropertyValue("--font-geist-mono")
          .trim();
        return value
          ? `"${value.split(",")[0].replace(/['"]/g, "")}", ui-monospace, monospace`
          : "ui-monospace, monospace";
      })();
      let raf = 0;
      let last = performance.now();
      let time = 0;
      let visible = true;
      let alive = true;
      let placed = false;
      let hovering = false;
      let sheenAmount = 0;
      let press: Press | null = null;
      let imageToken = 0;

      const paintFaces = () => {
        const s = settingsRef.current!;
        const color = parseColor(s.cardColor, [1, 1, 1]);
        const width = FACE_WIDTH;
        const height = Math.round((FACE_WIDTH * layout.height) / layout.width);
        if (frontCanvas.width !== width || frontCanvas.height !== height) {
          frontCanvas.width = width;
          frontCanvas.height = height;
          backCanvas.width = width;
          backCanvas.height = height;
          frontTexture.dispose();
          backTexture.dispose();
        }
        paintFace(frontCanvas, images.front, color, s.imageFit, s, monoFamily);
        /*
          The back is painted by its own routine.

          It takes `images.back` alone - not `images.back || images.front`. The
          fall-through was what put a second copy of the portrait on the
          reverse, and a real badge's back is not a second photograph: it is
          stock, a quote and the small print.
        */
        paintBackFace(backCanvas, images.back, color, s.imageFit, s, monoFamily);
        frontTexture.needsUpdate = true;
        backTexture.needsUpdate = true;
        start();
      };

      const repaintStrap = () => {
        const s = settingsRef.current!;
        tileRatio = paintStrap(
          strapCanvas,
          images.strap,
          parseColor(s.strapColor, [0.07, 0.07, 0.07]),
          s.strapText,
          monoFamily
        );
        weave.repeat.set(2, 2 * tileRatio);
        strapTexture.dispose();
        strapTexture.needsUpdate = true;
        start();
      };

      const frameView = () => {
        const s = settingsRef.current!;

        /*
          The scale comes from the layout box, not the viewport.

          `size` is a fraction - "fill this much of the box" - and it only keeps
          that meaning if pixels-per-world-unit is solved from the box's own
          height. Deriving it from the viewport instead would make the card grow
          with the window while `size` stayed put.

          `worldPerPx` is that scale. The camera's visible extent over the
          viewport follows from it, so the projection and the anchor can never
          disagree about where a pixel is.
        */
        const rect = container.getBoundingClientRect();
        /*
          A hidden layout box is a zero-size rect.

          The hero lives in `.legacy-only`, which is `display: none` for every
          design except v3. If the canvas were alive on another design it would
          read a 0x0 box, divide by it, and put the anchor at NaN - which then
          propagates into the solver and the card vanishes for reasons that
          have nothing to do with the card.

          So: bail. The frame is not computed from a box that has no size, and
          the next resize or design switch recomputes it when there is one.
        */
        if (rect.width < 1 || rect.height < 1) return;
        const boxHeight = rect.height;
        const size = clamp(s.size, 0.15, 0.9);
        const worldPerPx = layout.height / (boxHeight * size);
        worldScale = worldPerPx;

        const viewHeight = view.height * worldPerPx;
        const aspect = view.width / view.height;

        camera.aspect = aspect;
        camera.position.set(0, 0, viewHeight / 2 / Math.tan((FOV * Math.PI) / 360));
        camera.lookAt(0, 0, 0);
        camera.updateProjectionMatrix();
        camera.updateMatrixWorld();
        foilUniforms.foilKey.value.set(-2.5, 4, 6).normalize().transformDirection(camera.matrixWorldInverse);
        foilUniforms.foilFill.value.set(3, -1, 4).normalize().transformDirection(camera.matrixWorldInverse);
        foilUniforms.foilTop.value.set(0.5, 4.5, 8).normalize().transformDirection(camera.matrixWorldInverse);

        /*
          Screen pixels to world units on the z = 0 plane.

          The camera sits at `viewHeight / 2 / tan(fov/2)` looking down -Z, so
          the visible half-height at z = 0 is `viewHeight / 2`, and a pixel
          offset from the viewport centre is `offset * worldPerPx` in world
          units. Written as a multiply by the scale rather than a divide by the
          half-extent, because the two only agree if the projection was built
          from this same number - and it is.
        */
        const toWorldX = (px: number) => (px - view.width / 2) * worldPerPx;
        const toWorldY = (py: number) => (view.height / 2 - py) * worldPerPx;

        /*
          The anchor: just above the box's top edge, at the `anchor` fraction of
          its width, so `left`/`center`/`right` mean what they did when the
          camera was framed on the box itself. The gap above is a fraction of the
          card rather than a fixed world distance, so it does not stretch into a
          length of bare strap on a large screen.

          This is the only thing tying the badge to the hero. The canvas is
          full-screen and the card can be dragged anywhere on the page; the
          solver pulls it back toward this world coordinate, which is why it
          swings home rather than being pinned.
        */
        const anchorFrac = ANCHORS[s.anchor] ?? 0.5;
        const gapWorld = layout.height * 0.05;
        const anchorX = toWorldX(rect.left + rect.width * anchorFrac);
        const anchorY = toWorldY(rect.top) + gapWorld;

        /*
          The strap length, from the anchor down to the top of the card.

          `strapLength` stays a fraction of the box's height, as it was when the
          view *was* the box: 0.12 a short strap, 0.42 a long one. Converting
          once through `worldPerPx` keeps it that fraction whatever the viewport
          is doing, so the card's rest position lands where it did before.
        */
        const strapFraction = mix(0.12, 0.42, clamp(s.strapLength, 0, 1));
        const cardTopWorld = toWorldY(rect.top + boxHeight * strapFraction);
        const strapWorld = anchorY - cardTopWorld;

        sim.anchor.set(anchorX, anchorY, 0);
        configureSimulation(sim, layout, strapWorld);
        sim.nodes[0].copy(sim.anchor);
        sim.previous[0].copy(sim.anchor);
      };

      const apply = () => {
        const s = settingsRef.current!;
        const layoutKey = `${s.orientation}|${s.cornerRadius}`;
        if (layoutKey !== applied.layoutKey) {
          layout = cardLayout(s.orientation, s.cornerRadius);
          const geometry = buildCardGeometry(layout);
          bodyMesh.geometry.dispose();
          frontMesh.geometry.dispose();
          backMesh.geometry.dispose();
          bodyMesh.geometry = geometry.body;
          frontMesh.geometry = geometry.face;
          backMesh.geometry = geometry.face.clone();
          frontMesh.position.z = THICKNESS / 2 + BEVEL + 0.0006;
          backMesh.rotation.y = Math.PI;
          backMesh.position.z = -(THICKNESS / 2 + BEVEL + 0.0006);
          ring.position.set(0, layout.ringY, 0);
          applied.framingKey = "";
        }
        const framingKey = `${layoutKey}|${s.size}|${s.anchor}|${s.strapLength}|${view.width}|${view.height}`;
        if (framingKey !== applied.framingKey) {
          frameView();
          if (!placed) {
            placeHanging(sim, layout, s.intro && !reducedMotion);
            placed = true;
          } else if (layoutKey !== applied.layoutKey) {
            placeHanging(sim, layout, false);
          }
        }
        const imageKey = `${s.frontImage}|${s.backImage}|${s.strapImage}`;
        if (imageKey !== applied.imageKey) {
          const token = ++imageToken;
          Promise.all([
            loadImage(imageCache, s.frontImage),
            loadImage(imageCache, s.backImage),
            loadImage(imageCache, s.strapImage),
          ]).then(([front, back, strap]) => {
            if (!alive || token !== imageToken) return;
            images.front = front;
            images.back = back;
            images.strap = strap;
            paintFaces();
            repaintStrap();
          });
        }
        /*
          The face key carries every input `paintFace` reads.

          It used to be layout, colour and fit, which was complete when the face
          was stock plus a photograph. Adding the badge text means the key has
          to grow with it, or changing `name` would leave the old lettering
          baked into the texture - the exact silent-stale bug the `applied`
          cache exists to prevent.
        */
        const faceKey = `${layoutKey}|${s.cardColor}|${s.imageFit}|${s.name}|${s.role}|${s.badgeId}|${s.quote}|${s.quoteBy}|${s.barcode}|${s.textScale}`;
        if (faceKey !== applied.faceKey) paintFaces();
        if (s.strapColor !== applied.strapColor || s.strapText !== applied.strapText) repaintStrap();

        const finish = FINISHES[s.finish] || FINISHES.glossy;
        const card = parseColor(s.cardColor, [1, 1, 1]);
        [frontMaterial, backMaterial].forEach((material) => {
          material.roughness = finish.roughness;
          material.metalness = finish.metalness;
          material.clearcoat = finish.clearcoat;
          material.clearcoatRoughness = finish.clearcoatRoughness;
          material.anisotropy = finish.anisotropy;
        });
        foilUniforms.foilStrength.value = finish.foil;
        foilUniforms.foilAspect.value = layout.height / layout.width;
        edgeMaterial.color.setRGB(card[0] * 0.92, card[1] * 0.92, card[2] * 0.92, THREE.SRGBColorSpace);
        edgeMaterial.roughness = Math.min(finish.roughness, 0.35);
        edgeMaterial.metalness = finish.metalness;
        edgeMaterial.clearcoat = 1;
        edgeMaterial.clearcoatRoughness = 0.08;
        const metalLook = METALS[s.metal] || METALS.silver;
        metalMaterial.color.set(metalLook.color);
        metalMaterial.roughness = metalLook.roughness;
        strapScale = STRAP_WIDTH * clamp(s.strapWidth, 0.4, 2);
        if (strapScale !== applied.strapScale) {
          /*
            Three geometries, rebuilt together. Each replaced part disposes its
            own geometry first - the material is shared and outlives them all.
          */
          /*
            Dispose the old geometry, then swap in the new. Order matters:
            assigning first and disposing after would dispose the geometry that
            was just built, leaving the mesh pointing at a freed buffer.
          */
          for (const mesh of [clampMesh, ...clampDetail]) mesh.geometry?.dispose();
          const rebuilt = buildClampGeometry(strapScale);
          clampMesh.geometry = rebuilt[0];
          clampDetail.forEach((mesh, i) => {
            mesh.geometry = rebuilt[i + 1];
          });
        }
        canvas.style.touchAction = s.interactive ? "pan-y" : "auto";

        applied = {
          layoutKey,
          framingKey,
          imageKey,
          faceKey,
          strapColor: s.strapColor,
          strapText: s.strapText,
          strapScale,
        };
        start();
      };

      const points = Array.from({ length: SAMPLES }, () => new THREE.Vector3());
      const sides = Array.from({ length: SAMPLES }, () => new THREE.Vector3());
      const bends = BAND_BEND.map((angle): [number, number] => [Math.cos(angle), Math.sin(angle)]);
      const work = {
        tangent: new THREE.Vector3(),
        toCamera: new THREE.Vector3(),
        basis: new THREE.Matrix4(),
        up: new THREE.Vector3(),
        across: new THREE.Vector3(),
        facing: new THREE.Vector3(),
        end: new THREE.Vector3(),
      };

      const updateBand = () => {
        const hang = sim.nodes[JOINTS];
        const reach = EYELET_RADIUS + CLAMP_BODY + 0.05;
        let guide = JOINTS - 1;
        while (guide > 0 && sim.nodes[guide].distanceTo(hang) < reach * 1.1) guide--;
        const axis = work.up.subVectors(sim.nodes[guide], hang);
        if (axis.lengthSq() < 1e-8) axis.set(0, 1, 0).applyQuaternion(sim.body.quaternion);
        axis.normalize();
        mouth.copy(hang).addScaledVector(axis, reach);
        tuck.copy(hang).addScaledVector(axis, EYELET_RADIUS + CLAMP_BODY * 0.35);
        controls.length = 0;
        for (let i = 0; i <= guide; i++) controls.push(sim.nodes[i]);
        controls.push(mouth, tuck);
        curve.updateArcLengths();
        for (let i = 0; i < SAMPLES; i++) curve.getPointAt(i / (SAMPLES - 1), points[i]);
        const length = curve.getLength();
        const held = 1 - mouth.distanceTo(tuck) / Math.max(length, 0.001);
        const position = bandGeometry.getAttribute("position");
        const normal = bandGeometry.getAttribute("normal");
        const uv = bandGeometry.getAttribute("uv");
        const columns = BAND_COLUMNS.length;
        const restLength = sim.rest * JOINTS;
        const repeats = restLength / (strapScale * tileRatio);
        const width = strapScale / Math.pow(Math.max(1, length / Math.max(restLength, 0.001)), 0.35);
        const { tangent, toCamera, across, facing } = work;
        for (let i = 0; i < SAMPLES; i++) {
          tangent.subVectors(points[Math.min(SAMPLES - 1, i + 1)], points[Math.max(0, i - 1)]);
          if (tangent.lengthSq() < 1e-12) tangent.set(0, -1, 0);
          tangent.normalize();
          toCamera.subVectors(camera.position, points[i]).normalize();
          const side = sides[i].crossVectors(toCamera, tangent);
          if (side.lengthSq() < 1e-10) side.copy(i > 0 ? sides[i - 1] : scratch.a.set(1, 0, 0));
          side.normalize();
          if (i > 0 && side.dot(sides[i - 1]) < 0) side.negate();
          const angle = -sim.twist * Math.pow(Math.min(1, i / (SAMPLES - 1) / held), 1.3);
          facing.crossVectors(tangent, side);
          across.copy(side).multiplyScalar(Math.cos(angle)).addScaledVector(facing, Math.sin(angle));
          facing.crossVectors(tangent, across);
          const p = points[i];
          const v = (1 - i / (SAMPLES - 1)) * repeats;
          for (let c = 0; c < columns; c++) {
            const k = i * columns + c;
            const offset = (BAND_COLUMNS[c] - 0.5) * width;
            const [bendCos, bendSin] = bends[c];
            position.setXYZ(k, p.x + across.x * offset, p.y + across.y * offset, p.z + across.z * offset);
            normal.setXYZ(
              k,
              facing.x * bendCos + across.x * bendSin,
              facing.y * bendCos + across.y * bendSin,
              facing.z * bendCos + across.z * bendSin
            );
            uv.setXY(k, BAND_COLUMNS[c], v);
          }
        }
        work.end.copy(across);
        position.needsUpdate = true;
        normal.needsUpdate = true;
        uv.needsUpdate = true;

        across.copy(work.end).addScaledVector(axis, -work.end.dot(axis)).normalize();
        facing.crossVectors(across, axis).normalize();
        work.basis.makeBasis(across, axis, facing);
        clampGroup.quaternion.setFromRotationMatrix(work.basis);
        clampGroup.position.copy(hang);
      };

      const render = () => {
        cardGroup.position.copy(sim.body.position);
        cardGroup.quaternion.copy(sim.body.quaternion);
        updateBand();

        const s = settingsRef.current!;

        /*
          The contact shadow.

          Driven from the body rather than parented to it. A shadow parented to
          the card would swing with the card, which is the one thing a shadow
          must not do - it is the cue that tells the eye the card moved *away*
          from something. So it stays flat, slides a fraction of the card's
          travel, and fades and spreads as the card rises.

          `swing` is the card's horizontal offset from the anchor: zero at rest,
          largest mid-swing. The shadow lags it by a factor below 1, which is
          what sells the separation.
        */
        if (s.shadow > 0) {
          const swing = sim.body.position.x - sim.anchor.x;
          const height = clamp((sim.body.position.y - (sim.anchor.y - sim.rest * JOINTS)) * 0.9, 0, 1);
          shadow.visible = true;
          shadow.position.set(
            sim.body.position.x - swing * 0.35,
            sim.anchor.y - sim.rest * JOINTS - layout.height * 0.52,
            -0.34
          );
          const spread = mix(0.82, 1.12, height);
          shadow.scale.set(layout.width * 1.18 * spread, layout.width * 0.34 * spread, 1);
          shadowMaterial.opacity = s.shadow * mix(0.5, 0.2, height);
        } else if (shadow.visible) {
          shadow.visible = false;
        }

        /*
          The hover sheen.

          A second, very dim light behind and above the card, faded in on
          hover. Not a material change: `clearcoat` and the environment are
          already doing the work, and re-parameterising the material on hover
          is what makes a highlight pop in and out. Moving a light reads as the
          surface catching something, which is the effect being asked for.
        */
        const sheenTarget = s.sheen > 0 && hovering ? 1 : 0;
        sheenAmount += (sheenTarget - sheenAmount) * 0.12;
        rimLight.intensity = sheenAmount * s.sheen * 2.4;
        edgeMaterial.emissiveIntensity = sheenAmount * s.sheen * 0.5;

        renderer.render(scene, camera);
      };

      const physics = (): Physics => {
        const s = settingsRef.current!;
        const gravity = 40 * clamp(s.gravity, 0, 3);
        const weight = Math.max(gravity, 20);
        const springy = clamp(s.elasticity, 0, 1);
        const settle = clamp(s.damping, 0, 1);
        return {
          gravity,
          hold: weight * mix(2.2, 5.5, springy),
          stiffness: weight * 10 * JOINTS,
          spring: weight * mix(0.1, 0.4, springy) * JOINTS,
          bandDamping: weight * mix(0.3, 0.08, springy) * JOINTS,
          linearDrag: 0.25 * Math.pow(16, settle),
          angularDrag: 0.5 * Math.pow(12, settle),
          air: 0.15,
          broadside: 0.5,
          spinAir: 0.03,
          nodeDrag: 2,
          nodeAir: 0.2,
          twist: 30,
          twistDamping: 3,
          grip: 40,
          gripDamping: 6,
          breeze: reducedMotion ? 0 : clamp(s.breeze, 0, 1),
          /*
            Sway is fed into the solver rather than applied as a rotation after
            it. Two reasons: it moves the strap's top nodes as well as the card,
            so the whole assembly drifts instead of pivoting rigidly at the
            eyelet; and a card being dragged and swaying at the same time stays
            one simulation, instead of an animation fighting a physics body for
            the same transform.
          */
          sway: reducedMotion ? 0 : clamp(s.sway, 0, 1) * (sim.grab ? 0.25 : 1),
        };
      };

      const tick = (now: number) => {
        raf = 0;
        if (!alive) return;
        const dt = Math.min(1 / 30, Math.max(1 / 240, (now - last) / 1000));
        last = now;
        time += dt;
        const current = physics();
        stepSimulation(sim, dt, current, time);
        const body = sim.body;
        if (!Number.isFinite(body.position.x + body.position.y + body.position.z + body.quaternion.w)) {
          sim.grab = null;
          placeHanging(sim, layout, false);
        }
        render();
        /*
          The rest test.

          `sway` joins `breeze` here for the same reason both exist in
          `physics()`: a swaying card never reaches the calm threshold, so if
          the loop treated it as resting it would stop mid-swing and freeze
          there until something else restarted it. With sway on, the badge
          animates for as long as it is on screen - which is the intent, and is
          why this component sits behind an IntersectionObserver rather than
          running unconditionally.
        */
        const resting = sim.calm > 1.2 && !sim.grab && current.breeze === 0 && current.sway === 0;
        if (visible && !resting) raf = requestAnimationFrame(tick);
      };

      const start = () => {
        if (raf || !visible || !alive) return;
        sim.calm = 0;
        last = performance.now();
        raf = requestAnimationFrame(tick);
      };

      const raycaster = new THREE.Raycaster();
      const pointer = new THREE.Vector2();

      /*
        Pointer input, on `document` rather than the canvas.

        The canvas is `pointer-events: none` so the page underneath stays
        clickable - which means it can never be the target of a pointer event.
        Listening on `document` is the equivalent of R3F's `eventSource`: the
        events arrive regardless, and the raycast below decides whether this
        component cares.

        That raycast is what keeps the rest of the page working. A pointerdown
        anywhere that is not over the card returns early, so clicks on the
        heading, the social links and the sidebar pass straight through to
        whatever is under the cursor. Only the card meshes are tested.
      */
      /*
        The drag leash.

        `raycaster.ray.at(reach, target)` projects the pointer onto the plane the
        card was grabbed at, which is correct in every direction *inside* the
        viewport. Past the edge it is not: the ray keeps going, the card follows
        it off-screen, and a canvas - however large - cannot paint what is not
        within its own bounds. That is the one way a full-screen canvas still
        loses the card.

        So the target is clamped to the viewport's visible extent in world
        units, plus a margin so the card can be pulled most of the way off the
        edge without going dark. The card stays draggable anywhere on screen,
        which is the point, and simply stops at the boundary instead of
        vanishing past it.

        Expressed in the same world units `frameView` used, so the leash is
        exactly the viewport edge and not an approximation of it.
      */
      const leash = (target: Three.Vector3) => {
        const margin = layout.height * 0.35;
        const halfW = (view.width / 2) * worldScale;
        const halfH = (view.height / 2) * worldScale;
        target.x = clamp(target.x, -halfW - margin, halfW + margin);
        target.y = clamp(target.y, -halfH - margin, halfH + margin);
      };

      const toPointer = (event: Point) => {
        /*
          Normalised against the viewport, not the canvas's rect.

          The canvas is fixed at inset 0, so its rect *is* the viewport - but
          reading `view` rather than measuring the element means this keeps
          working if a scrollbar or a zoom level ever puts the two out of step.
        */
        pointer.set(
          (event.clientX / view.width) * 2 - 1,
          -((event.clientY / view.height) * 2 - 1)
        );
        raycaster.setFromCamera(pointer, camera);
      };

      const pickCard = () => {
        cardGroup.updateMatrixWorld();
        const hits = raycaster.intersectObjects([bodyMesh, frontMesh, backMesh], false);
        return hits[0] || null;
      };

      /*
        The cursor is set on <body>, because the canvas is not a hit target.

        With `pointer-events: none` the browser picks its own cursor from
        whatever element *is* under the pointer, so a `grab` cursor on the
        canvas would never appear. Setting it on the body is the only way to
        show a grab affordance over the card without capturing the pointer -
        and it is cleared on every pointerleave and on unmount, so it can never
        be left stuck over the rest of the page.
      */
      const setCursor = (value: string) => {
        if (document.body.style.cursor !== value) document.body.style.cursor = value;
      };

      const flip = (point: Three.Vector3) => {
        const body = sim.body;
        const up = scratch.a.set(0, 1, 0).applyQuaternion(body.quaternion);
        let direction = sim.turn > 0 ? -1 : 1;
        if (sim.turn === 0) {
          const away = scratch.c.subVectors(point, camera.position).normalize();
          direction = scratch.b.subVectors(point, body.position).cross(away).dot(up) < 0 ? -1 : 1;
        }
        sim.turn = sim.turn === 0 ? Math.PI * direction : 0;
        body.angular.addScaledVector(up, FLIP_SPIN * direction);
      };

      const onPointerDown = (event: PointerEvent) => {
        if (!settingsRef.current!.interactive || event.button > 0) return;
        toPointer(event);
        const hit = pickCard();
        if (!hit) return;
        sim.grab = {
          local: hit.point.clone().sub(sim.body.position).applyQuaternion(sim.body.quaternion.clone().invert()),
          rotation: sim.body.quaternion.clone(),
          reach: hit.distance,
          from: hit.point.clone(),
          target: hit.point.clone(),
        };
        press = { x: event.clientX, y: event.clientY, time: performance.now(), point: hit.point.clone() };
        /*
          Capture on <body>, not on the canvas.

          Capture on the canvas would be meaningless - it is `pointer-events:
          none` and never receives an event - and without capture the drag dies
          the moment the pointer leaves the window or passes over an iframe.
          Capturing on the body keeps every subsequent move coming here even
          when the pointer is nowhere near the card.
        */
        document.body.setPointerCapture?.(event.pointerId);
        setCursor("grabbing");
        event.preventDefault();
        start();
      };

      const onPointerMove = (event: PointerEvent) => {
        if (!settingsRef.current!.interactive) return;
        toPointer(event);
        if (sim.grab) {
          if (press && Math.hypot(event.clientX - press.x, event.clientY - press.y) > 6) press = null;
          raycaster.ray.at(sim.grab.reach, sim.grab.target);
          leash(sim.grab.target);
          start();
          return;
        }
        if (event.pointerType === "touch") return;
        hovering = !!pickCard();
        setCursor(hovering ? "grab" : "");
      };

      const onPointerUp = (event: PointerEvent) => {
        if (!sim.grab) return;
        sim.grab = null;
        if (press && event.type === "pointerup" && performance.now() - press.time < 450) flip(press.point);
        press = null;
        document.body.releasePointerCapture?.(event.pointerId);
        setCursor(hovering && event.pointerType !== "touch" ? "grab" : "");
        start();
      };

      const onTouchStart = (event: TouchEvent) => {
        if (!settingsRef.current!.interactive || event.touches.length !== 1) return;
        toPointer(event.touches[0]);
        if (pickCard()) event.preventDefault();
      };

      /*
        Listeners on `document`, because the canvas cannot receive them.

        `touchstart` is non-passive so `preventDefault` is legal on it - that is
        what stops the page scrolling out from under a touch drag on the card,
        and it only fires when the raycast says the card is under the finger.
        Everywhere else, scrolling is untouched.
      */
      document.addEventListener("pointerdown", onPointerDown);
      document.addEventListener("pointermove", onPointerMove);
      document.addEventListener("pointerup", onPointerUp);
      document.addEventListener("pointercancel", onPointerUp);
      document.addEventListener("lostpointercapture", onPointerUp);
      document.addEventListener("touchstart", onTouchStart, { passive: false });

      /*
        The cursor is set on the body, so it has to be cleared explicitly.

        There is no pointerleave to do it - the canvas is not a hit target, so it
        never receives one. Without this, a `grab` cursor would stay over the
        whole page after the pointer left the card.
      */
      const onPointerLeaveWindow = () => {
        if (sim.grab) return;
        hovering = false;
        setCursor("");
      };
      document.addEventListener("pointerleave", onPointerLeaveWindow);
      window.addEventListener("blur", onPointerLeaveWindow);

      /*
        `touch-action: pan-y` on the body.

        Vertical scrolling is allowed, horizontal is not - so a touch drag on
        the card moves the card, and a swipe anywhere else still scrolls the
        page. Setting it on the body rather than the canvas is the same reason
        the listeners moved: the canvas is not the hit target.
      */
      const previousTouchAction = document.body.style.touchAction;
      if (settingsRef.current?.interactive) document.body.style.touchAction = "pan-y";

      const resize = () => {
        /*
          The renderer is sized to the viewport, not to `container`.

          `container` is still observed - it is how the anchor learns where the
          hero is - but it no longer has anything to do with the drawing buffer.
          The two are deliberately decoupled: the box decides *where* the card
          hangs, the window decides *how much surface it can be drawn on*.
        */
        view.width = Math.max(1, window.innerWidth);
        view.height = Math.max(1, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        renderer.setSize(view.width, view.height, false);
        apply();
        render();
      };

      const resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(container);

      /*
        Pause when the hero leaves the viewport.

        This is the performance answer to a full-screen canvas: the drawing
        buffer is the size of the window, so leaving it rendering while the
        visitor reads the projects section would be spending a frame budget on
        something nobody can see. Keyed to `container` - the layout box - and not
        the canvas, which is fixed and therefore always "intersecting".
      */
      const intersectionObserver = new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting;
        if (visible) start();
      });
      intersectionObserver.observe(container);

      /*
        Scrolling moves the layout box, which moves the anchor.

        The canvas is fixed and does not scroll, so without this the badge would
        hang at a fixed screen position while the hero it belongs to travelled
        up the page. Passive, because nothing here needs to cancel the scroll -
        it only re-reads a rect on the next frame.
      */
      let scrollQueued = false;
      const onScroll = () => {
        if (scrollQueued) return;
        scrollQueued = true;
        requestAnimationFrame(() => {
          scrollQueued = false;
          if (!alive) return;
          frameView();
          render();
        });
      };
      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("resize", resize);

      const onVisibility = () => {
        if (!document.hidden) start();
      };
      document.addEventListener("visibilitychange", onVisibility);

      applyRef.current = apply;
      resize();

      /*
        Reveal, then signal.

        The canvas starts at opacity 0 so there is never a frame of empty
        transparent surface, and is faded up here - after `resize()` has put a
        real frame on screen, so the reveal cannot expose a blank canvas.

        `onReady` fires immediately after, in the same synchronous block, so the
        caller's fallback image starts fading out while this one fades in. Two
        500ms transitions, one signal, no flash.

        The forced reflow is deliberate: a transition started in the same frame
        the element was inserted has no "before" value to animate from, and the
        element jumps straight to its end state. Reading `offsetHeight` commits
        the opacity-0 state first, so the fade has somewhere to come from.
      */
      void canvas.offsetHeight;
      canvas.style.opacity = "1";
      settingsRef.current?.onReady?.();

      dispose = () => {
        alive = false;
        cancelAnimationFrame(raf);
        applyRef.current = null;
        resizeObserver.disconnect();
        intersectionObserver.disconnect();
        document.removeEventListener("visibilitychange", onVisibility);
        /*
          Every one of these touched something outside this component - the
          document, the window, the body's cursor and touch-action - so every one
          has to be undone here. A listener left on `document` after the hero
          unmounts would keep raycasting on every pointer move for the rest of
          the session, and a cursor left on the body would follow the pointer
          over the whole page.
        */
        document.removeEventListener("pointerdown", onPointerDown);
        document.removeEventListener("pointermove", onPointerMove);
        document.removeEventListener("pointerup", onPointerUp);
        document.removeEventListener("pointercancel", onPointerUp);
        document.removeEventListener("lostpointercapture", onPointerUp);
        document.removeEventListener("touchstart", onTouchStart);
        document.removeEventListener("pointerleave", onPointerLeaveWindow);
        window.removeEventListener("blur", onPointerLeaveWindow);
        window.removeEventListener("scroll", onScroll);
        window.removeEventListener("resize", resize);
        document.body.style.cursor = "";
        document.body.style.touchAction = previousTouchAction;
        [bodyMesh, frontMesh, backMesh, ring, clampMesh, eyelet, band].forEach((mesh) => mesh.geometry?.dispose());
        clampDetail.forEach((mesh) => mesh.geometry?.dispose());
        shadow.geometry.dispose();
        shadowMaterial.map?.dispose();
        shadowMaterial.dispose();
        [frontMaterial, backMaterial, edgeMaterial, metalMaterial, bandMaterial].forEach((material) => material.dispose());
        [frontTexture, backTexture, strapTexture, grain, weave].forEach((texture) => texture.dispose());
        environment.dispose();
        renderer.dispose();
        if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
      };
    })();

    return () => {
      cancelled = true;
      dispose?.();
    };
  }, []);

  /*
    The layout box, and nothing else.

    This div is the anchor's reference frame: it reserves the hero column's
    width and height and its `getBoundingClientRect()` is where the strap is
    told to hang from. The canvas it used to hold is now a fixed layer on
    `<body>`, so this is an empty box by design.

    Two consequences, both deliberate:

      - `overflow-hidden` is gone. It was the clip: a canvas paints only inside
        its own rectangle, so a card dragged toward the edge of a 22rem box
        vanished at the boundary. Nothing clips here now.

      - `pointer-events-none` because an empty box should not be a hit target.
        It sits over the hero column, and a transparent div there would swallow
        clicks meant for the heading beside it.

    It keeps its aspect ratio and its size from the caller, so the hero layout
    is unchanged - the badge simply draws outside it.
  */
  return <div ref={containerRef} aria-hidden="true" className={`relative w-full h-full pointer-events-none ${className}`.trim()} style={style} />;
};

export default Lanyard;
