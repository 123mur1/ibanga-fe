"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Demonstration signature capture. It draws on a canvas and returns a data URL; it is a
 * placeholder for a proper e-signature or driver-app capture and has no legal standing.
 */
export function SignaturePad({ value, onChange, error }: { value?: string; onChange: (dataUrl: string | undefined) => void; error?: string }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [empty, setEmpty] = useState(!value);

  useEffect(() => {
    const element = canvas.current;
    if (!element) return;
    const context = element.getContext("2d");
    if (!context) return;
    context.lineWidth = 2.2;
    context.lineCap = "round";
    context.strokeStyle = "#122832";
    if (value) {
      const image = new Image();
      image.onload = () => context.drawImage(image, 0, 0, element.width, element.height);
      image.src = value;
    }
    // Draw the saved value once on mount only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function point(event: React.PointerEvent<HTMLCanvasElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * event.currentTarget.width,
      y: ((event.clientY - rect.top) / rect.height) * event.currentTarget.height,
    };
  }

  function start(event: React.PointerEvent<HTMLCanvasElement>) {
    const context = event.currentTarget.getContext("2d");
    if (!context) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    drawing.current = true;
    const { x, y } = point(event);
    context.beginPath();
    context.moveTo(x, y);
  }

  function move(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return;
    const context = event.currentTarget.getContext("2d");
    if (!context) return;
    const { x, y } = point(event);
    context.lineTo(x, y);
    context.stroke();
  }

  function end() {
    if (!drawing.current || !canvas.current) return;
    drawing.current = false;
    setEmpty(false);
    onChange(canvas.current.toDataURL("image/png"));
  }

  function clear() {
    const element = canvas.current;
    element?.getContext("2d")?.clearRect(0, 0, element.width, element.height);
    setEmpty(true);
    onChange(undefined);
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-navy">Recipient signature (demonstration)</span>
        <button type="button" onClick={clear} disabled={empty} className="text-xs font-semibold text-brand hover:text-brand-dark disabled:opacity-40">
          Clear
        </button>
      </div>
      <canvas
        ref={canvas}
        width={640}
        height={200}
        aria-label="Signature drawing area"
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={end}
        onPointerCancel={end}
        className={`mt-1.5 h-36 w-full touch-none rounded-xl border bg-white ${error ? "border-bad" : "border-line"}`}
      />
      <p className="mt-1 text-xs text-muted">{empty ? "Draw with a mouse, finger or stylus. Optional placeholder." : "Signature captured."}</p>
      {error ? <p role="alert" className="mt-1 text-xs font-medium text-bad">{error}</p> : null}
    </div>
  );
}
