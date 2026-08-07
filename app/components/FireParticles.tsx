'use client';

import React, { useEffect, useRef } from 'react';

export default function FireParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.offsetWidth);
    let height = (canvas.height = canvas.offsetHeight);

    const particles: Particle[] = [];
    const maxParticles = 60;

    const mouse = {
      x: -1000,
      y: -1000,
      radius: 120,
    };

    class Particle {
      x!: number;
      y!: number;
      size!: number;
      speedX!: number;
      speedY!: number;
      life!: number;
      maxLife!: number;
      alpha!: number;
      color!: string;
      wobbleSpeed!: number;
      wobbleRange!: number;

      constructor() {
        this.reset(true);
      }

      reset(init = false) {
        this.x = Math.random() * width;
        this.y = init ? Math.random() * height : height + Math.random() * 20;
        this.size = Math.random() * 2.5 + 0.5;
        this.speedX = Math.random() * 0.6 - 0.3;
        this.speedY = -(Math.random() * 1.2 + 0.4);
        this.maxLife = Math.random() * 150 + 100;
        this.life = init ? Math.random() * this.maxLife : 0;
        this.alpha = 0;
        
        // Curated fire colors: hot gold, vivid orange, deep embers red
        const colors = [
          'rgba(215, 25, 32, 1)',   // Accent Red
          'rgba(214, 168, 79, 1)',  // Accent Gold
          'rgba(255, 90, 30, 1)',   // Hot orange
          'rgba(255, 170, 50, 1)',  // Warm yellow
        ];
        this.color = colors[Math.floor(Math.random() * colors.length)];
        
        this.wobbleSpeed = Math.random() * 0.05 + 0.01;
        this.wobbleRange = Math.random() * 0.5 + 0.2;
      }

      update() {
        this.life++;

        if (this.life >= this.maxLife) {
          this.reset();
          return;
        }

        // Fade in at start, fade out at end
        if (this.life < 30) {
          this.alpha = this.life / 30;
        } else if (this.life > this.maxLife - 40) {
          this.alpha = (this.maxLife - this.life) / 40;
        } else {
          this.alpha = 1;
        }

        // Apply rising speed
        this.y += this.speedY;
        
        // Wobble horizontally to simulate air current
        this.x += this.speedX + Math.sin(this.life * this.wobbleSpeed) * this.wobbleRange;

        // Interactive mouse heat draft (push particles away from mouse)
        const dx = this.x - mouse.x;
        const dy = this.y - mouse.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < mouse.radius) {
          const force = (mouse.radius - distance) / mouse.radius;
          const angle = Math.atan2(dy, dx);
          
          // Push away from mouse
          this.x += Math.cos(angle) * force * 1.5;
          // Rising effect intensifies with heat
          this.y -= force * 1.0; 
        }

        // Loop horizontally if offscreen
        if (this.x < 0) this.x = width;
        if (this.x > width) this.x = 0;
      }

      draw() {
        if (!ctx) return;
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.beginPath();
        
        // Draw fire ember glow
        const glow = ctx.createRadialGradient(
          this.x, this.y, 0,
          this.x, this.y, this.size * 2
        );
        glow.addColorStop(0, '#ffffff');
        glow.addColorStop(0.3, this.color);
        glow.addColorStop(1, 'rgba(0,0,0,0)');
        
        ctx.fillStyle = glow;
        ctx.arc(this.x, this.y, this.size * 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    // Initialize particles
    for (let i = 0; i < maxParticles; i++) {
      particles.push(new Particle());
    }

    // Resize Handler
    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
      
      // Reset out-of-bound particles
      particles.forEach((p) => {
        if (p.x > width) p.x = Math.random() * width;
        if (p.y > height) p.y = Math.random() * height;
      });
    };

    window.addEventListener('resize', handleResize);

    // Mouse Listeners
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    };

    const handleMouseLeave = () => {
      mouse.x = -1000;
      mouse.y = -1000;
    };

    const parent = canvas.parentElement;
    if (parent) {
      parent.addEventListener('mousemove', handleMouseMove);
      parent.addEventListener('mouseleave', handleMouseLeave);
    }

    // Animation Loop
    const animate = () => {
      ctx.clearRect(0, 0, width, height);

      particles.forEach((p) => {
        p.update();
        p.draw();
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      if (parent) {
        parent.removeEventListener('mousemove', handleMouseMove);
        parent.removeEventListener('mouseleave', handleMouseLeave);
      }
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 2,
      }}
    />
  );
}
