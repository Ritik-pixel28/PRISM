"use client";

import { useRef, useState, type ReactNode, type PointerEvent } from "react";
import { Grip, RotateCcw } from "lucide-react";

export default function FloatingPanel({
  title,
  children,
  className = "",
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  const panel = useRef<HTMLElement>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const drag = useRef<{
    x: number;
    y: number;
    startX: number;
    startY: number;
    bounds: DOMRect;
  } | null>(null);
  function start(event: PointerEvent<HTMLButtonElement>) {
    if (event.button !== 0 || window.innerWidth < 760 || !panel.current) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = {
      x: event.clientX,
      y: event.clientY,
      startX: offset.x,
      startY: offset.y,
      bounds: panel.current.getBoundingClientRect(),
    };
  }
  function move(event: PointerEvent<HTMLButtonElement>) {
    const origin = drag.current;
    if (!origin) return;
    const dx = Math.max(
      80 - origin.bounds.left,
      Math.min(
        window.innerWidth - origin.bounds.right - 18,
        event.clientX - origin.x,
      ),
    );
    const dy = Math.max(
      85 - origin.bounds.top,
      Math.min(
        window.innerHeight - origin.bounds.bottom - 90,
        event.clientY - origin.y,
      ),
    );
    setOffset({ x: origin.startX + dx, y: origin.startY + dy });
  }
  return (
    <section
      ref={panel}
      className={`floating-panel ${className}`}
      style={{ transform: `translate(${offset.x}px, ${offset.y}px)` }}
    >
      <div className="float-title">
        <button
          className="drag-handle"
          aria-label={`Move ${title} panel`}
          title="Drag to move · arrow keys to reposition"
          onPointerDown={start}
          onPointerMove={move}
          onPointerUp={() => {
            drag.current = null;
          }}
          onPointerCancel={() => {
            drag.current = null;
          }}
          onKeyDown={(event) => {
            const delta = {
              ArrowLeft: [-12, 0],
              ArrowRight: [12, 0],
              ArrowUp: [0, -12],
              ArrowDown: [0, 12],
            }[event.key];
            if (delta && panel.current && window.innerWidth >= 760) {
              event.preventDefault();
              const bounds = panel.current.getBoundingClientRect();
              const dx = Math.max(
                80 - bounds.left,
                Math.min(window.innerWidth - bounds.right - 18, delta[0]),
              );
              const dy = Math.max(
                85 - bounds.top,
                Math.min(window.innerHeight - bounds.bottom - 90, delta[1]),
              );
              setOffset((current) => ({
                x: current.x + dx,
                y: current.y + dy,
              }));
            }
          }}
        >
          <Grip size={13} />
          <span>{title}</span>
        </button>
        <button
          className="icon-btn"
          aria-label={`Reset ${title} position`}
          onClick={() => setOffset({ x: 0, y: 0 })}
        >
          <RotateCcw size={11} />
        </button>
      </div>
      {children}
    </section>
  );
}
