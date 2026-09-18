"use client";

import { useEffect, useRef } from "react";

export default function Starfield({ moving }: { moving: boolean }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const surface = canvas.current;
    if (!surface) return;
    const context = surface.getContext("2d");
    if (!context) return;
    let frame = 0;
    let width = 0;
    let height = 0;
    let tick = 0;
    let last = 0;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const stars = Array.from({ length: 150 }, (_, index) => ({
      x: ((index * 7919 + 43) % 1000) / 1000,
      y: ((index * 3571 + 89) % 1000) / 1000,
      radius: index % 9 === 0 ? 1.25 : 0.6,
      speed: 0.02 + (index % 5) * 0.008,
    }));
    function draw(time: number) {
      if (!context || !surface) return;
      if (time - last > 32 || !last) {
        last = time;
        context.clearRect(0, 0, width, height);
        for (const [index, star] of stars.entries()) {
          const y = (star.y * height + tick * star.speed) % height;
          const alpha = 0.25 + (0.4 * (Math.sin(index + tick * 0.008) + 1)) / 2;
          context.fillStyle = `rgba(190,201,255,${alpha})`;
          context.beginPath();
          context.arc(star.x * width, y, star.radius, 0, Math.PI * 2);
          context.fill();
        }
        if (moving && !reduce.matches && !document.hidden) tick++;
      }
      if (moving && !reduce.matches) frame = requestAnimationFrame(draw);
    }
    function resize() {
      if (!surface || !context) return;
      width = surface.clientWidth;
      height = surface.clientHeight;
      const ratio = Math.min(devicePixelRatio, 2);
      surface.width = width * ratio;
      surface.height = height * ratio;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      if (!moving || reduce.matches) draw(0);
    }
    const observer = new ResizeObserver(resize);
    observer.observe(surface);
    resize();
    draw(0);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [moving]);
  return <canvas ref={canvas} className="starfield" aria-hidden="true" />;
}
