"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type KeyboardEvent as ReactKeyboardEvent,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Mail,
  RotateCw,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";

import { EMAIL_ADDRESS } from "@/app/lib/contact";

const EDGE_GAP = 8;
const HINT_MS = 2400;

type ItemId = "back" | "forward" | "reload" | "email" | "top";

interface MenuItem {
  id: ItemId;
  label: string;
  icon: LucideIcon;
  disabled?: boolean;
}

const GROUPS: MenuItem[][] = [
  [
    { id: "back", label: "Back", icon: ArrowLeft },
    { id: "forward", label: "Forward", icon: ArrowRight },
    { id: "reload", label: "Reload", icon: RotateCw },
  ],
  [
    { id: "email", label: "Copy email address", icon: Mail },
    { id: "top", label: "Back to top", icon: ArrowUp },
  ],
];

/** Items that navigate away, so the menu closes instead of confirming. */
const NAVIGATES: ItemId[] = ["back", "forward", "reload", "top"];

/** Flattened at module scope so render never mutates a counter. */
const FLAT_ITEMS = GROUPS.flatMap((group, groupIndex) =>
  group.map((item, itemIndex) => ({
    ...item,
    index:
      GROUPS.slice(0, groupIndex).reduce((total, g) => total + g.length, 0) +
      itemIndex,
    divider: groupIndex > 0 && itemIndex === 0,
  })),
);

const noopSubscribe = () => () => {};
const isClient = () => true;
const isServer = () => false;

interface ProtectedContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  menuRef: RefObject<HTMLDivElement | null>;
}

export default function ProtectedContextMenu({
  x,
  y,
  onClose,
  menuRef,
}: ProtectedContextMenuProps) {
  const mounted = useSyncExternalStore(noopSubscribe, isClient, isServer);

  // Read once at mount: this panel only exists while open, so the browser
  // value is current and no effect is needed to refresh it.
  const [canGoBack] = useState(
    () => typeof window !== "undefined" && window.history.length > 1,
  );

  const [hint, setHint] = useState<string | null>(null);
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const hintTimer = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (hintTimer.current !== null) window.clearTimeout(hintTimer.current);
    },
    [],
  );

  // Clamp once after measuring, writing straight to the node so positioning
  // does not cost an extra render.
  useLayoutEffect(() => {
    const panel = menuRef.current;
    if (!panel) return;

    const { width, height } = panel.getBoundingClientRect();
    panel.style.left = `${Math.max(EDGE_GAP, Math.min(x, window.innerWidth - width - EDGE_GAP))}px`;
    panel.style.top = `${Math.max(EDGE_GAP, Math.min(y, window.innerHeight - height - EDGE_GAP))}px`;
    itemRefs.current[0]?.focus();
  }, [x, y, menuRef]);

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      if (menuRef.current?.contains(event.target as Node)) return;
      onClose();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      event.stopPropagation();
      onClose();
    };
    const dismiss = () => onClose();

    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("keydown", onKeyDown, true);
    window.addEventListener("scroll", dismiss, { capture: true, passive: true });
    window.addEventListener("resize", dismiss);
    window.addEventListener("blur", dismiss);

    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("keydown", onKeyDown, true);
      window.removeEventListener("scroll", dismiss, true);
      window.removeEventListener("resize", dismiss);
      window.removeEventListener("blur", dismiss);
    };
  }, [menuRef, onClose]);

  const showHint = (message: string) => {
    setHint(message);
    if (hintTimer.current !== null) window.clearTimeout(hintTimer.current);
    hintTimer.current = window.setTimeout(() => setHint(null), HINT_MS);
  };

  const writeClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      return false;
    }
  };

  const run = async (id: ItemId) => {
    switch (id) {
      case "back":
        window.history.back();
        break;
      case "forward":
        window.history.forward();
        break;
      case "reload":
        window.location.reload();
        break;
      case "email": {
        const copied = await writeClipboard(EMAIL_ADDRESS);
        showHint(copied ? "Email address copied" : "Copy failed");
        return;
      }
      case "top":
        window.scrollTo({ top: 0, behavior: "smooth" });
        break;
    }

    if (NAVIGATES.includes(id)) onClose();
  };

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    const items = itemRefs.current.filter(
      (item): item is HTMLButtonElement => item !== null && !item.disabled,
    );
    if (items.length === 0) return;

    const current = items.indexOf(document.activeElement as HTMLButtonElement);
    let next: number | null = null;

    if (event.key === "ArrowDown") next = (current + 1) % items.length;
    else if (event.key === "ArrowUp") next = (current - 1 + items.length) % items.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = items.length - 1;

    if (next === null) return;
    event.preventDefault();
    items[next]?.focus();
  };

  if (!mounted) return null;

  return createPortal(
    <motion.div
      ref={menuRef}
      role="menu"
      aria-label="Site actions"
      onKeyDown={handleKeyDown}
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.12, ease: "easeOut" }}
      style={{ left: x, top: y }}
      className="fixed z-[200] w-max min-w-56 origin-top-left rounded-xl border border-border bg-popover p-1.5 text-popover-foreground shadow-xl"
    >
      <div className="flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground">
        <ShieldCheck className="size-3.5 shrink-0" aria-hidden="true" />
        <span>Content protected</span>
      </div>

      {FLAT_ITEMS.map((item) => {
        const disabled = item.id === "back" ? !canGoBack : item.disabled;

        return (
          <div key={item.id}>
            {item.divider && (
              <div className="my-1 h-px bg-border" aria-hidden="true" />
            )}
            <button
              ref={(node) => {
                itemRefs.current[item.index] = node;
              }}
              type="button"
              role="menuitem"
              disabled={disabled}
              onClick={() => void run(item.id)}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-muted focus:bg-muted focus-visible:outline-none disabled:pointer-events-none disabled:opacity-40"
            >
              <item.icon
                className="size-4 shrink-0 text-muted-foreground"
                aria-hidden="true"
              />
              <span className="flex-1 truncate">{item.label}</span>
            </button>
          </div>
        );
      })}

      <p
        aria-live="polite"
        className={`px-3 py-1.5 text-micro text-muted-foreground transition-opacity ${
          hint ? "opacity-100" : "opacity-0"
        }`}
      >
        {hint ?? "\u00a0"}
      </p>
    </motion.div>,
    document.body,
  );
}
