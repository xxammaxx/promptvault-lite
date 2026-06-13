import { useCallback, useEffect, useRef } from "react";

interface UseResizablePanelOptions {
  /** Current width in pixels (from store) */
  width: number;
  /** Minimum width in pixels */
  minWidth: number;
  /** Maximum width in pixels */
  maxWidth: number;
  /** Called during drag with the new width (already clamped by store) */
  onResize: (width: number) => void;
}

interface UseResizablePanelResult {
  /** Ref to attach to the resize handle element */
  handleRef: React.RefCallback<HTMLDivElement>;
  /** Props to spread onto the resize handle (does NOT include ref) */
  handleProps: {
    role: "separator";
    "aria-label": string;
    "aria-orientation": "vertical";
    "aria-valuemin": number;
    "aria-valuemax": number;
    "aria-valuenow": number;
    "aria-valuetext": string;
    tabIndex: number;
    onKeyDown: (e: React.KeyboardEvent) => void;
  };
}

/**
 * Hook for making a panel horizontally resizable via pointer drag.
 *
 * Uses pointer events (not mouse events) for robust behavior across
 * input types (mouse, touch, pen). Prevents text selection during drag
 * and supports keyboard accessibility via arrow keys.
 */
export function useResizablePanel({
  width,
  minWidth,
  maxWidth,
  onResize,
}: UseResizablePanelOptions): UseResizablePanelResult {
  const handleElRef = useRef<HTMLDivElement | null>(null);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);

  // Keep width in a ref so callbacks don't need `width` in their deps.
  // This avoids re-attaching event listeners on every pixel of drag.
  const widthRef = useRef(width);
  widthRef.current = width;

  // Keep onResize in a ref too for the same reason.
  const onResizeRef = useRef(onResize);
  onResizeRef.current = onResize;

  const onPointerDown = useCallback((e: PointerEvent) => {
    const handle = handleElRef.current;
    if (!handle) return;

    // Prevent text selection and default drag behaviors
    e.preventDefault();
    handle.setPointerCapture(e.pointerId);

    // Disable text selection on body during resize
    document.body.style.userSelect = "none";

    startXRef.current = e.clientX;
    startWidthRef.current = widthRef.current;
  }, []);

  const onPointerMove = useCallback((e: PointerEvent) => {
    const handle = handleElRef.current;
    // Only respond to moves when the handle has pointer capture
    if (!handle || !handle.hasPointerCapture(e.pointerId)) return;

    const delta = e.clientX - startXRef.current;
    const newWidth = startWidthRef.current + delta;

    // Prevent negative widths (defensive)
    if (newWidth <= 0) return;

    onResizeRef.current(newWidth);
  }, []);

  const onPointerUp = useCallback((e: PointerEvent) => {
    const handle = handleElRef.current;
    if (!handle) return;

    try {
      handle.releasePointerCapture(e.pointerId);
    } catch {
      // releasePointerCapture may throw if pointer was already released
    }

    // Restore text selection after resize ends
    document.body.style.userSelect = "";
  }, []);

  // Attach and detach pointer event listeners on the handle element.
  // Since onPointerDown/Move/Up have stable references (no deps), this
  // effect runs only once on mount and cleanup on unmount.
  useEffect(() => {
    const handle = handleElRef.current;
    if (!handle) return;

    handle.addEventListener("pointerdown", onPointerDown);
    handle.addEventListener("pointermove", onPointerMove);
    handle.addEventListener("pointerup", onPointerUp);

    return () => {
      handle.removeEventListener("pointerdown", onPointerDown);
      handle.removeEventListener("pointermove", onPointerMove);
      handle.removeEventListener("pointerup", onPointerUp);

      // Safety net: restore text selection if component unmounts mid-drag
      document.body.style.userSelect = "";
    };
  }, [onPointerDown, onPointerMove, onPointerUp]);

  // Keyboard accessibility: arrow keys adjust width in 10px steps
  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      let delta = 0;
      if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        e.preventDefault();
        delta = e.key === "ArrowRight" ? 10 : -10;
      }
      if (delta !== 0) {
        onResize(width + delta);
      }
    },
    [width, onResize],
  );

  // Callback ref: React calls this when the div mounts/unmounts
  const handleRef = useCallback((el: HTMLDivElement | null) => {
    handleElRef.current = el;
  }, []);

  return {
    handleRef,
    handleProps: {
      role: "separator" as const,
      "aria-label": "Explorer-Breite ändern",
      "aria-orientation": "vertical" as const,
      "aria-valuemin": minWidth,
      "aria-valuemax": maxWidth,
      "aria-valuenow": width,
      "aria-valuetext": `${width} Pixel breit`,
      tabIndex: 0,
      onKeyDown,
    },
  };
}
