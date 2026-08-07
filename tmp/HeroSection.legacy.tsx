'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';

/* ─────────────────────────────────────────────
   FIRE CANVAS — 60fps particle embers engine
───────────────────────────────────────────── */
function FireCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf: number;
    let W = (canvas.width = canvas.offsetWidth);
    let H = (canvas.height = canvas.offsetHeight);
    const mouse = { x: -999, y: -999 };

    type P = { x: number; y: number; vx: number; vy: number; life: number; maxLife: number; r: number; hue: number; };
    const POOL: P[] = [];
    const MAX = 90;

    const spawn = (init?: boolean): P => ({
      x: Math.random() * W,
      y: init ? Math.random() * H : H + 10,
      vx: (Math.random() - 0.5) * 0.7,
      vy: -(Math.random() * 1.6 + 0.5),
      life: init ? Math.random() * 200 : 0,
      maxLife: Math.random() * 180 + 80,
      r: Math.random() * 3.5 + 0.5,
      hue: Math.random() < 0.55 ? 5 : Math.random() < 0.5 ? 28 : 42,
    });

    for (let i = 0; i < MAX; i++) POOL.push(spawn(true));

    const onResize = () => { if (!canvas) return; W = canvas.width = canvas.offsetWidth; H = canvas.height = canvas.offsetHeight; };
    window.addEventListener('resize', onResize);

    const parent = canvas.parentElement;
    const onMM = (e: MouseEvent) => { const r = canvas.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; };
    const onML = () => { mouse.x = -999; mouse.y = -999; };
    parent?.addEventListener('mousemove', onMM);
    parent?.addEventListener('mouseleave', onML);

    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      for (let i = 0; i < POOL.length; i++) {
        const p = POOL[i];
        p.life++;
        if (p.life >= p.maxLife) { POOL[i] = spawn(); continue; }

        p.x += p.vx + Math.sin(p.life * 0.04) * 0.45;
        p.y += p.vy;

        const dx = p.x - mouse.x, dy = p.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 110) {
          const f = (110 - dist) / 110;
          p.x += (dx / dist) * f * 2.2;
          p.y += (dy / dist) * f * 1.8;
          p.vy -= f * 0.1;
        }

        let alpha = 1;
        if (p.life < 30) alpha = p.life / 30;
        else if (p.life > p.maxLife - 40) alpha = (p.maxLife - p.life) / 40;

        const grd = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 4);
        grd.addColorStop(0, `hsla(${p.hue}, 100%, 98%, ${alpha})`);
        grd.addColorStop(0.3, `hsla(${p.hue}, 100%, 62%, ${alpha * 0.85})`);
        grd.addColorStop(0.7, `hsla(${p.hue}, 100%, 35%, ${alpha * 0.3})`);
        grd.addColorStop(1, `hsla(${p.hue}, 100%, 20%, 0)`);

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * 4, 0, Math.PI * 2);
        ctx.fillStyle = grd;
        ctx.fill();

        if (p.x < 0) p.x = W;
        if (p.x > W) p.x = 0;
      }
      raf = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      parent?.removeEventListener('mousemove', onMM);
      parent?.removeEventListener('mouseleave', onML);
    };
  }, []);

  return (
    <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 2 }} />
  );
}

/* ─────────────────────────────────────────────
   ANIMATED OH RICHI FLAME LOGO — brand match
───────────────────────────────────────────── */
function OhRichiLogo() {
  return (
    <div className="ohr-logo-wrap">
      <div className="ohr-flame-glow" />
      <svg viewBox="0 0 380 400" className="ohr-svg" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <path id="topArc"    d="M 55,200 A 140,140 0 0,1 325,200" />
          <path id="bottomArc" d="M 68,270 A 135,135 0 0,0 312,270" />
          <filter id="glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="5" result="coloredBlur"/>
            <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          <filter id="strongGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="8" result="coloredBlur"/>
            <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          <radialGradient id="flameGrad" cx="50%" cy="80%" r="60%">
            <stop offset="0%" stopColor="#ff6b35"/>
            <stop offset="40%" stopColor="#d71920"/>
            <stop offset="100%" stopColor="#8b0000"/>
          </radialGradient>
          <radialGradient id="innerGrad" cx="50%" cy="70%" r="50%">
            <stop offset="0%" stopColor="#fff5e0"/>
            <stop offset="50%" stopColor="#ffe4b5"/>
            <stop offset="100%" stopColor="#ffbb00"/>
          </radialGradient>
        </defs>

        {/* Left quote mark */}
        <text className="ohr-text-curved" dy="-12" filter="url(#glow)">
          <textPath href="#topArc" startOffset="3%" textAnchor="start">'</textPath>
        </text>

        {/* Main OH RICHI! curved text */}
        <text className="ohr-text-curved" dy="-12" filter="url(#glow)">
          <textPath href="#topArc" startOffset="11%" textAnchor="start">OH RICHI!</textPath>
        </text>

        {/* Right quote mark */}
        <text className="ohr-text-curved" dy="-12" filter="url(#glow)">
          <textPath href="#topArc" startOffset="88%" textAnchor="start">"</textPath>
        </text>

        {/* Outer flame shadow/glow */}
        <path
          d="M190 375 C130 350, 75 295, 88 225 C96 170, 128 148, 143 108 C150 88, 148 62, 143 42 C164 72, 176 94, 169 124 C181 98, 192 58, 192 18 C192 58, 203 98, 215 124 C208 94, 220 72, 241 42 C236 62, 234 88, 241 108 C256 148, 288 170, 296 225 C309 295, 254 350, 190 375Z"
          fill="rgba(215,25,32,0.35)"
          filter="url(#strongGlow)"
          className="ohr-flame-shadow"
        />

        {/* Outer flame body */}
        <path
          d="M190 375 C132 356, 82 302, 94 234 C102 180, 134 157, 149 117 C156 97, 154 71, 149 51 C169 80, 180 101, 174 131 C186 104, 196 64, 196 24 C196 64, 206 104, 218 131 C212 101, 223 80, 243 51 C238 71, 236 97, 243 117 C258 157, 290 180, 298 234 C310 302, 260 356, 190 375Z"
          fill="url(#flameGrad)"
          className="ohr-flame-outer"
          filter="url(#glow)"
        />

        {/* Inner flame white-hot core */}
        <path
          d="M190 342 C158 327, 132 290, 138 247 C142 218, 158 200, 166 177 C173 157, 170 136, 168 120 C180 142, 185 162, 180 185 C190 162, 196 136, 196 108 C196 136, 202 162, 212 185 C207 162, 212 142, 224 120 C222 136, 219 157, 226 177 C234 200, 250 218, 254 247 C260 290, 234 327, 190 342Z"
          fill="url(#innerGrad)"
          className="ohr-flame-inner"
        />

        {/* Inner white core highlight */}
        <ellipse cx="190" cy="220" rx="22" ry="35" fill="rgba(255,252,240,0.7)" className="ohr-flame-core" />

        {/* Bottom text: BURGER, SANDWICHES & CO */}
        <text className="ohr-text-bottom" dy="20" filter="url(#glow)">
          <textPath href="#bottomArc" startOffset="3%" textAnchor="start">BURGER, SANDWICHES & CO</textPath>
        </text>
      </svg>
    </div>
  );
}

/* ─────────────────────────────────────────────
   BURGER SPLIT — 3D Hyper-realistic layers
───────────────────────────────────────────── */
const LAYERS = [
  {
    id: 'bun-top',
    label: '🍞 Sesame Bun',
    offsetY: -350,
    offsetX: 0,
    delay: 0,
    el: () => <img src="/3d_bun_top_v2.png" alt="Top Bun" className="burger-3d-img" />
  },
  {
    id: 'lettuce-top',
    label: '🥬 Fresh Lettuce',
    offsetY: -250,
    offsetX: 0,
    delay: 20,
    el: () => <img src="/3d_lettuce.png" alt="Lettuce" className="burger-3d-img" />
  },
  {
    id: 'tomato',
    label: '🍅 Thick Tomato',
    offsetY: -150,
    offsetX: 0,
    delay: 40,
    el: () => <img src="/3d_tomato.png" alt="Tomato" className="burger-3d-img" />
  },
  {
    id: 'cheese-top',
    label: '🧀 Melted Cheese',
    offsetY: -50,
    offsetX: 0,
    delay: 60,
    el: () => <img src="/3d_cheese.png" alt="Cheese" className="burger-3d-img" />
  },
  {
    id: 'patty',
    label: '🥩 Beef Patty',
    offsetY: 50,
    offsetX: 0,
    delay: 80,
    el: () => <img src="/3d_patty_v2.png" alt="Patty" className="burger-3d-img" />
  },
  {
    id: 'cheese-bot',
    label: '🧀 Melted Cheese',
    offsetY: 150,
    offsetX: 0,
    delay: 100,
    el: () => <img src="/3d_cheese.png" alt="Cheese" className="burger-3d-img" />
  },
  {
    id: 'lettuce-bot',
    label: '🥬 Fresh Lettuce',
    offsetY: 250,
    offsetX: 0,
    delay: 120,
    el: () => <img src="/3d_lettuce.png" alt="Lettuce" className="burger-3d-img" />
  },
  {
    id: 'bun-bot',
    label: '🌿 Toasted Bottom',
    offsetY: 350,
    offsetX: 0,
    delay: 140,
    el: () => <img src="/3d_bun_bottom_v2.png" alt="Bottom Bun" className="burger-3d-img" />
  },
];

function BurgerSplit() {
  const ref = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const rafRef = useRef<number>(0);

  const onScroll = useCallback(() => {
    if (rafRef.current) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = 0;
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const winH = window.innerHeight;
      const raw = 1 - (rect.top + rect.height * 0.4) / (winH * 0.9);
      setProgress(Math.min(1, Math.max(0, raw)));
    });
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, [onScroll]);

  return (
    <div ref={ref} className="burger-split-wrap">
      {/* Base glow plate */}
      <div className="burger-plate-glow" style={{ opacity: 0.3 + progress * 0.7 }} />

      {LAYERS.map((layer, i) => {
        const delayProgress = Math.max(0, progress - layer.delay / 1000);
        const t = Math.min(1, delayProgress * 4);
        const eased = 1 - Math.pow(1 - t, 3); // cubic ease-out
        const exploded = progress > 0.04;
        const ty = exploded ? layer.offsetY * eased : 0;
        const tx = exploded ? layer.offsetX * eased : 0;
        
        // Use index to alternate rotation directions for a dynamic tumbling effect
        const rotZ = exploded ? (i % 2 === 0 ? 1 : -1) * eased * 4 : 0;
        const rotX = exploded ? (i % 3 === 0 ? 15 : i % 3 === 1 ? -10 : 5) * eased : 0;
        const rotY = exploded ? (i % 2 === 0 ? -12 : 12) * eased : 0;
        
        const labelSide = i % 2 === 0 ? 'right' : 'left';

        return (
          <div
            key={layer.id}
            className="burger-ingredient"
            style={{
              zIndex: LAYERS.length - i,
              transform: `translateY(${ty}px) translateX(${tx}px) rotateZ(${rotZ}deg) rotateX(${rotX}deg) rotateY(${rotY}deg)`,
              transition: progress < 0.03 ? 'transform 0.5s ease' : 'none',
              transformStyle: 'preserve-3d',
            }}
          >
            {layer.el()}
            {/* Ingredient label badge */}
            <span
              className={`ingredient-label ${labelSide}`}
              style={{ opacity: eased > 0.65 ? Math.min(1, (eased - 0.65) / 0.35) : 0 }}
            >
              {layer.label}
            </span>
          </div>
        );
      })}

      {/* Scroll hint */}
      <div className="burger-scroll-hint" style={{ opacity: progress < 0.08 ? 1 - progress * 8 : 0 }}>
        <div className="scroll-hint-arrow">
          <div className="sha-dot" style={{ animationDelay: '0ms' }} />
          <div className="sha-dot" style={{ animationDelay: '200ms' }} />
          <div className="sha-dot" style={{ animationDelay: '400ms' }} />
        </div>
        <span>Scroll to reveal</span>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   BUMPY TITLE — char-by-char wave animation
───────────────────────────────────────────── */
function BumpyTitle({ text, color }: { text: string; color?: string }) {
  return (
    <span className="bumpy-title" style={{ color }}>
      {text.split('').map((ch, i) =>
        ch === ' ' ? <span key={i}>&nbsp;</span> : (
          <span key={i} className="bumpy-char" style={{ animationDelay: `${i * 55}ms` }}>{ch}</span>
        )
      )}
    </span>
  );
}

/* ─────────────────────────────────────────────
   MAIN: HeroSection
───────────────────────────────────────────── */
export default function HeroSection({ onOrderClick, onExploreClick }: {
  onOrderClick: () => void;
  onExploreClick: () => void;
}) {
  return (
    <section className="pro-hero">
      <FireCanvas />
      <div className="pro-hero-noise" />
      <div className="pro-hero-vignette-left" />
      <div className="pro-hero-vignette-right" />

      <div className="pro-hero-inner">

        {/* ══ LEFT COLUMN: Logo + Headline + CTA ══ */}
        <div className="pro-hero-left">
          <OhRichiLogo />

          <div className="pro-hero-text">
            <p className="pro-hero-tag">⚡ The Richest Flavors In Town</p>

            <h1 className="pro-hero-title">
              <BumpyTitle text="Burgers that" />
              <br />
              <BumpyTitle text="Hit Different" color="var(--accent-red)" />
            </h1>

            <p className="pro-hero-desc">
              100% Premium Ingredients. Bold Recipes.<br />
              Flame-grilled to perfection — made fresh for you.
            </p>

            <div className="pro-hero-actions">
              <button id="hero-order-btn" className="btn btn-primary pro-btn-order" onClick={onOrderClick}>
                🔥 Order Now
              </button>
              <button id="hero-explore-btn" className="btn btn-secondary pro-btn-explore" onClick={onExploreClick}>
                Explore Menu
              </button>
            </div>

            {/* Stats row */}
            <div className="pro-hero-stats">
              <div className="pro-stat">
                <span className="pro-stat-num">50+</span>
                <span className="pro-stat-label">Menu Items</span>
              </div>
              <div className="pro-stat-divider" />
              <div className="pro-stat">
                <span className="pro-stat-num">⭐ 4.9</span>
                <span className="pro-stat-label">Rating</span>
              </div>
              <div className="pro-stat-divider" />
              <div className="pro-stat">
                <span className="pro-stat-num">15min</span>
                <span className="pro-stat-label">Delivery</span>
              </div>
            </div>
          </div>
        </div>

        {/* ══ RIGHT COLUMN: Animated Burger Split ══ */}
        <div className="pro-hero-right">
          <BurgerSplit />
        </div>

      </div>

      <div className="pro-hero-bottom-fade" />
    </section>
  );
}
