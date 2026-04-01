import { useEffect, useRef } from 'react';

const COLORS = ['#E55A3F', '#F59E0B', '#22C55E', '#6366F1', '#EC4899', '#14B8A6', '#FBBF24'];

export default function Confetti({ active }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!active) return;
    const count = 80;
    const particles = [];

    for (let i = 0; i < count; i++) {
      const el = document.createElement('div');
      el.className = 'confetti-particle';
      const color = COLORS[Math.floor(Math.random() * COLORS.length)];
      const size = 6 + Math.random() * 10;
      const left = Math.random() * 100;
      const duration = 2 + Math.random() * 2;
      const delay = Math.random() * 0.8;
      const isCircle = Math.random() > 0.5;

      el.style.cssText = `
        left: ${left}vw;
        top: -20px;
        width: ${size}px;
        height: ${size}px;
        background: ${color};
        border-radius: ${isCircle ? '50%' : '2px'};
        animation-duration: ${duration}s;
        animation-delay: ${delay}s;
      `;

      document.body.appendChild(el);
      particles.push(el);

      setTimeout(() => el.remove(), (duration + delay) * 1000 + 200);
    }

    return () => particles.forEach(p => p.remove());
  }, [active]);

  return null;
}
