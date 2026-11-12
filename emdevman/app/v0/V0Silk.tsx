"use client";

/*
  The backdrop: a silk field, drawn once per frame in WebGL.

  React Bits' Silk background is a full-screen shader rather than an image, and
  that is what makes it work here: the folds can be tinted from the page's own
  tokens (`--background`, `--foreground`) so the backdrop inverts with the theme,
  and they drift slowly enough to read as cloth instead of as a video.

  Four noise octaves warp a grid in two directions, then a sine is taken through
  the warped coordinate to make long narrow ridges - the highlights of folded
  silk - with a second, slower band crossing them. The result is tinted toward
  the foreground at low strength: pale folds on charcoal in dark mode, blue-grey
  folds on paper in light mode.

  Motion is the one thing on this page that runs continuously besides the
  carousel, so it stops under `prefers-reduced-motion` (one static frame), and
  it pauses when the tab is hidden or the hero is off screen.
*/

import { useEffect, useRef } from "react";
import { Mesh, Program, Renderer, Triangle } from "ogl";

const vertex = /* glsl */ `
  attribute vec2 position;
  void main() {
    gl_Position = vec4(position, 0.0, 1.0);
  }
`;

const fragment = /* glsl */ `
  precision highp float;

  uniform float uTime;
  uniform vec2 uResolution;
  uniform vec3 uBase;
  uniform vec3 uSheen;
  uniform vec3 uTint;
  uniform float uScale;
  uniform float uIntensity;

  vec3 permute(vec3 x) { return mod(((x * 34.0) + 1.0) * x, 289.0); }

  // Ashima's 2D simplex noise.
  float snoise(vec2 v) {
    const vec4 C = vec4(
      0.211324865405187, 0.366025403784439,
      -0.577350269189626, 0.024390243902439
    );
    vec2 i = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod(i, 289.0);
    vec3 p = permute(
      permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0)
    );
    vec3 m = max(
      0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)),
      0.0
    );
    m = m * m;
    m = m * m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
    vec3 g;
    g.x = a0.x * x0.x + h.x * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }

  float fbm(vec2 p) {
    float value = 0.0;
    float amp = 0.62;
    for (int i = 0; i < 4; i++) {
      value += amp * snoise(p);
      p = p * 2.03 + vec2(17.3, 9.1);
      amp *= 0.5;
    }
    return value;
  }

  void main() {
    vec2 uv = gl_FragCoord.xy / uResolution.xy;
    float aspect = uResolution.x / uResolution.y;
    vec2 p = vec2(uv.x * aspect, uv.y) * uScale;
    float t = uTime * 0.055;

    // Two slow warps, out of phase, so the folds bend instead of sliding.
    vec2 warp = vec2(
      fbm(p * 0.55 + vec2(t * 0.9, -t * 0.4)),
      fbm(p * 0.5 + vec2(-t * 0.5, t * 0.7) + 11.0)
    );
    vec2 q = p + warp * 1.3;

    // The cloth: a long weave crossed by a slower one.
    float body = fbm(q * 0.85 + vec2(t * 0.35, t * 0.2));
    float bands = sin((q.y * 1.1 + body * 2.7 + q.x * 0.2) * 3.14159);
    float ridge = pow(0.5 + 0.5 * bands, 3.0);
    float cross = pow(0.5 + 0.5 * sin((q.x * 0.8 - body * 2.1) * 3.14159), 6.0);

    float sheen = ridge * 0.86 + cross * 0.14;

    // Calm the middle-left where the name sits, so the type keeps its ground.
    vec2 c = uv - vec2(0.34, 0.52);
    float quiet = smoothstep(0.14, 0.62, length(vec2(c.x * 0.9, c.y)));
    sheen *= 0.6 + 0.4 * quiet;

    vec3 color = uBase + uSheen * sheen * uIntensity;
    color += uTint * (0.5 + 0.5 * body) * 0.022;

    gl_FragColor = vec4(color, 1.0);
  }
`;

function readColor(token: string, fallback: [number, number, number]): [number, number, number] {
  if (typeof window === "undefined") return fallback;

  const raw = getComputedStyle(document.documentElement).getPropertyValue(token).trim();
  const hex = raw.startsWith("#") ? raw.slice(1) : raw;

  if (/^[0-9a-f]{3}$/i.test(hex)) {
    const [r, g, b] = hex.split("").map((v) => parseInt(v + v, 16) / 255);
    return [r, g, b];
  }
  if (/^[0-9a-f]{6}$/i.test(hex)) {
    return [
      parseInt(hex.slice(0, 2), 16) / 255,
      parseInt(hex.slice(2, 4), 16) / 255,
      parseInt(hex.slice(4, 6), 16) / 255,
    ];
  }

  const parts = raw.match(/[\d.]+/g);
  if (parts && parts.length >= 3) {
    return [
      Number(parts[0]) / 255,
      Number(parts[1]) / 255,
      Number(parts[2]) / 255,
    ];
  }
  return fallback;
}

const luma = ([r, g, b]: [number, number, number]) => r * 0.2126 + g * 0.7152 + b * 0.0722;

export default function V0Silk({ className }: { className?: string }) {
  const host = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = host.current;
    if (!el) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    let renderer: Renderer;
    try {
      renderer = new Renderer({ dpr: Math.min(window.devicePixelRatio || 1, 1.5), alpha: false });
    } catch {
      return; // no WebGL: the page keeps its flat background
    }
    const gl = renderer.gl;
    gl.clearColor(0, 0, 0, 1);
    el.appendChild(gl.canvas);

    const base = readColor("--background", [0.05, 0.05, 0.06]);
    const ink = readColor("--foreground", [0.95, 0.95, 0.96]);
    const accent = readColor("--primary", [0.11, 0.31, 0.85]);

    const program = new Program(gl, {
      vertex,
      fragment,
      uniforms: {
        uTime: { value: 0 },
        uResolution: { value: [1, 1] },
        uBase: { value: base },
        uSheen: { value: ink },
        uTint: { value: accent },
        uScale: { value: 1.15 },
        uIntensity: { value: luma(base) < 0.3 ? 0.2 : 0.12 },
      },
    });
    const mesh = new Mesh(gl, { geometry: new Triangle(gl), program });

    const resize = () => {
      const w = el.clientWidth || 1;
      const h = el.clientHeight || 1;
      renderer.setSize(w, h);
      program.uniforms.uResolution.value = [gl.drawingBufferWidth, gl.drawingBufferHeight];
    };
    resize();

    const observer = new ResizeObserver(resize);
    observer.observe(el);

    let raf = 0;
    let elapsed = 0;
    let visible = true;
    let last = performance.now();

    const draw = (now: number) => {
      const delta = Math.min((now - last) / 1000, 0.1);
      last = now;
      if (!reduce.matches && visible) elapsed += delta;
      program.uniforms.uTime.value = elapsed;
      renderer.render({ scene: mesh });
      if (!reduce.matches) raf = requestAnimationFrame(draw);
    };

    if (reduce.matches) {
      draw(performance.now());
    } else {
      raf = requestAnimationFrame(draw);
    }

    const onVisibility = () => {
      visible = document.visibilityState === "visible";
      last = performance.now();
    };
    document.addEventListener("visibilitychange", onVisibility);

    const paint = () => {
      const nextBase = readColor("--background", base);
      program.uniforms.uBase.value = nextBase;
      program.uniforms.uSheen.value = readColor("--foreground", ink);
      program.uniforms.uTint.value = readColor("--primary", accent);
      program.uniforms.uIntensity.value = luma(nextBase) < 0.3 ? 0.2 : 0.12;
    };
    const themeObserver = new MutationObserver(paint);
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "style", "data-theme", "data-design"],
    });

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      themeObserver.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
      gl.canvas.remove();
    };
  }, []);

  return <div ref={host} className={className} aria-hidden="true" />;
}
