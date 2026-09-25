/* eslint-disable react-hooks/immutability */
"use client";

import Image from "next/image";
import { useTheme } from "next-themes";
import ProfileContext from "./ProfileContext";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react";

const ENTER_TRANSITION_MS = 180;

const clamp = (value: number, min = 0, max = 100) =>
  Math.min(Math.max(value, min), max);
const round = (value: number, precision = 3) =>
  parseFloat(value.toFixed(precision));

interface ProfileCardProps {
  avatarUrl?: string;
  name?: string;
  title?: string;
}

export default function ProfileCard({
  avatarUrl = "/assets/images/profile3-4k.webp",
  name = "Emmanuel",
  title = "Full-Stack Developer",
}: ProfileCardProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const shellRef = useRef<HTMLDivElement>(null);
  const enterTimerRef = useRef<number | null>(null);
  const leaveRafRef = useRef<number | null>(null);
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && resolvedTheme === "dark";

  const tiltEngine = useMemo(() => {
    let rafId: number | null = null;
    let running = false;
    let lastTimestamp = 0;
    let currentX = 0;
    let currentY = 0;
    let targetX = 0;
    let targetY = 0;

    const setVarsFromPoint = (x: number, y: number) => {
      const shell = shellRef.current;
      const wrapper = wrapRef.current;
      if (!shell || !wrapper) return;

      const width = shell.clientWidth || 1;
      const height = shell.clientHeight || 1;
      const percentX = clamp((100 / width) * x);
      const percentY = clamp((100 / height) * y);

      const properties: Record<string, string> = {
        "--rotate-x": `${round(-(percentY - 50) / 4)}deg`,
        "--rotate-y": `${round((percentX - 50) / 4)}deg`,
      };

      Object.entries(properties).forEach(([property, value]) => {
        wrapper.style.setProperty(property, value);
      });
    };

    const step = (timestamp: number) => {
      if (!running) return;

      if (lastTimestamp === 0) lastTimestamp = timestamp;
      const deltaSeconds = Math.min((timestamp - lastTimestamp) / 1000, 0.05);
      lastTimestamp = timestamp;
      const smoothing = 1 - Math.exp(-deltaSeconds / 0.14);

      currentX += (targetX - currentX) * smoothing;
      currentY += (targetY - currentY) * smoothing;
      setVarsFromPoint(currentX, currentY);

      const isSettled =
        Math.abs(targetX - currentX) <= 0.05 &&
        Math.abs(targetY - currentY) <= 0.05;

      if (isSettled) {
        currentX = targetX;
        currentY = targetY;
        setVarsFromPoint(currentX, currentY);
        running = false;
        rafId = null;
        lastTimestamp = 0;
        return;
      }

      rafId = window.requestAnimationFrame(step);
    };

    const start = () => {
      if (running) return;
      running = true;
      lastTimestamp = 0;
      rafId = window.requestAnimationFrame(step);
    };

    return {
      setTarget(x: number, y: number) {
        targetX = x;
        targetY = y;
        start();
      },
      toCenter() {
        const shell = shellRef.current;
        if (!shell) return;
        targetX = shell.clientWidth / 2;
        targetY = shell.clientHeight / 2;
        start();
      },
      snapToCenter() {
        const shell = shellRef.current;
        if (!shell) return;
        currentX = shell.clientWidth / 2;
        currentY = shell.clientHeight / 2;
        targetX = currentX;
        targetY = currentY;
        setVarsFromPoint(currentX, currentY);
      },
      isSettled() {
        return (
          Math.abs(targetX - currentX) < 0.6 &&
          Math.abs(targetY - currentY) < 0.6
        );
      },
      cancel() {
        if (rafId !== null) window.cancelAnimationFrame(rafId);
        rafId = null;
        running = false;
        lastTimestamp = 0;
      },
    };
  }, []);

  const supportsTilt = useCallback(
    () => window.matchMedia("(hover: hover) and (pointer: fine)").matches,
    [],
  );

  const handlePointerMove = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (!shellRef.current || !supportsTilt()) return;
      const bounds = shellRef.current.getBoundingClientRect();
      tiltEngine.setTarget(event.clientX - bounds.left, event.clientY - bounds.top);
    },
    [supportsTilt, tiltEngine],
  );

  const handlePointerEnter = useCallback(() => {
    if (!shellRef.current || !supportsTilt()) return;
    shellRef.current.classList.add("active", "entering");
    if (enterTimerRef.current) window.clearTimeout(enterTimerRef.current);
    enterTimerRef.current = window.setTimeout(() => {
      shellRef.current?.classList.remove("entering");
    }, ENTER_TRANSITION_MS);
  }, [supportsTilt]);

  const handlePointerLeave = useCallback(() => {
    if (!shellRef.current || !supportsTilt()) return;
    tiltEngine.toCenter();

    const checkSettle = () => {
      if (tiltEngine.isSettled()) {
        shellRef.current?.classList.remove("active");
        leaveRafRef.current = null;
        return;
      }
      leaveRafRef.current = window.requestAnimationFrame(checkSettle);
    };

    if (leaveRafRef.current !== null) {
      window.cancelAnimationFrame(leaveRafRef.current);
    }
    leaveRafRef.current = window.requestAnimationFrame(checkSettle);
  }, [supportsTilt, tiltEngine]);

  useEffect(() => {
    tiltEngine.snapToCenter();
    return () => {
      tiltEngine.cancel();
      if (enterTimerRef.current) window.clearTimeout(enterTimerRef.current);
      if (leaveRafRef.current !== null) {
        window.cancelAnimationFrame(leaveRafRef.current);
      }
    };
  }, [tiltEngine]);

  return (
    <div
      ref={wrapRef}
      style={
        {
          "--rotate-x": "0deg",
          "--rotate-y": "0deg",
        } as CSSProperties
      }
      className="pc-card-wrapper relative z-10 mx-auto h-full w-full max-w-[350px] [perspective:800px] transform-gpu"
    >
      <div
        ref={shellRef}
        onPointerMove={handlePointerMove}
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave}
        className="group relative z-20 h-full w-full touch-pan-y"
        style={{ transformStyle: "preserve-3d" }}
      >
        <div
          className="pc-card relative h-full w-full overflow-visible rounded-[30px] border border-border shadow-sm transition-colors duration-300"
          style={{
            transformStyle: "preserve-3d",
            transform: "rotateX(var(--rotate-x)) rotateY(var(--rotate-y))",
          }}
        >
          <div
            className={`pointer-events-none absolute inset-x-0 bottom-0 z-30 h-[78%] origin-bottom transition-opacity duration-700 ${
              mounted ? "opacity-100" : "opacity-0"
            }`}
            style={{ transform: "translateZ(40px) rotateZ(0.01deg)" }}
          >
            <Image
              src={avatarUrl}
              alt={`${name}, ${title}`}
              fill
              sizes="(max-width: 480px) 350px, 500px"
              quality={90}
              className={`select-none object-contain object-bottom drop-shadow-2xl transition-[filter] duration-500 motion-reduce:transition-none ${isDark ? "grayscale-0" : "grayscale"}`}
              priority
              draggable={false}
            />
          </div>

          <ProfileContext />

          <div
            className="pointer-events-none absolute inset-x-0 top-6 z-50 px-5 text-center"
            style={{ transform: "translateZ(60px)" }}
          >
            <h2 className="mb-1 text-3xl font-extrabold tracking-tight text-slate-900 drop-shadow-xl sm:text-4xl dark:text-white">
              {name}
            </h2>
            <p className="text-sm font-semibold text-slate-700 sm:text-base dark:text-purple-200/90">
              {title}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
