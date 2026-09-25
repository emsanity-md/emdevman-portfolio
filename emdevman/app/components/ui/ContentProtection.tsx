"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import ProtectedContextMenu from "./ProtectedContextMenu";

interface ContextMenuState {
  x: number;
  y: number;
}

export default function ContentProtection() {
  const [menu, setMenu] = useState<ContextMenuState | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const close = useCallback(() => setMenu(null), []);

  useEffect(() => {
    const onContextMenu = (event: MouseEvent) => {
      // Right-clicking inside the menu itself should not reposition it.
      if (event.target && menuRef.current?.contains(event.target as Node)) return;

      event.preventDefault();
      setMenu({ x: event.clientX, y: event.clientY });
    };

    const onDragStart = (event: DragEvent) => {
      event.preventDefault();
    };

    // CSS `user-select` already covers the pointer path; this closes the
    // keyboard shortcut gap. `navigator.clipboard` is unaffected, so the
    // copy-email button keeps working.
    const onClipboard = (event: ClipboardEvent) => {
      event.preventDefault();
    };

    document.addEventListener("contextmenu", onContextMenu, true);
    document.addEventListener("dragstart", onDragStart, true);
    document.addEventListener("copy", onClipboard, true);
    document.addEventListener("cut", onClipboard, true);

    return () => {
      document.removeEventListener("contextmenu", onContextMenu, true);
      document.removeEventListener("dragstart", onDragStart, true);
      document.removeEventListener("copy", onClipboard, true);
      document.removeEventListener("cut", onClipboard, true);
    };
  }, []);

  if (!menu) return null;

  return (
    <ProtectedContextMenu x={menu.x} y={menu.y} onClose={close} menuRef={menuRef} />
  );
}
