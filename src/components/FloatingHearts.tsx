import React, { useEffect, useRef } from 'react';

interface FloatingHeartsProps {
  enabled: boolean;
}

interface HeartParticle {
  x: number;
  y: number;
  size: number;
  speedY: number;
  speedX: number;
  opacity: number;
  rotation: number;
  rotationSpeed: number;
  color: string;
}

export const FloatingHearts: React.FC<FloatingHeartsProps> = ({ enabled }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let particles: HeartParticle[] = [];

    // Fit canvas to window
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);
    handleResize();

    // Helper to get variable particle color
    const getParticleColor = () => {
      const style = getComputedStyle(document.documentElement);
      const colorVal = style.getPropertyValue('--primary-dark').trim() || '#f43f5e';
      return colorVal;
    };

    // Draw single canvas heart
    const drawHeart = (
      context: CanvasRenderingContext2D,
      x: number,
      y: number,
      width: number,
      height: number,
      opacity: number,
      rotation: number,
      color: string
    ) => {
      context.save();
      context.translate(x, y);
      context.rotate(rotation);
      context.globalAlpha = opacity;
      context.fillStyle = color;

      context.beginPath();
      // Draw standard double curves
      const topY = -height / 2;
      context.moveTo(0, topY + height / 4);
      context.quadraticCurveTo(-width / 2, topY, -width / 2, topY + height / 2);
      context.quadraticCurveTo(-width / 2, topY + (height * 3) / 4, 0, height / 2);
      context.quadraticCurveTo(width / 2, topY + (height * 3) / 4, width / 2, topY + height / 2);
      context.quadraticCurveTo(width / 2, topY, 0, topY + height / 4);
      context.closePath();
      context.fill();
      context.restore();
    };

    // Spawn a particle
    const createParticle = (initBottom = false): HeartParticle => {
      const size = Math.random() * 18 + 8;
      const x = Math.random() * canvas.width;
      const y = initBottom ? canvas.height + 20 : Math.random() * canvas.height;
      const speedY = -(Math.random() * 1.2 + 0.5); // float up
      const speedX = (Math.random() - 0.5) * 0.4;  // gentle sway
      const opacity = Math.random() * 0.4 + 0.1;
      const rotation = (Math.random() - 0.5) * 0.4;
      const rotationSpeed = (Math.random() - 0.5) * 0.01;
      const color = getParticleColor();

      return { x, y, size, speedY, speedX, opacity, rotation, rotationSpeed, color };
    };

    // Seed initial particles
    const particleCount = Math.min(60, Math.floor(window.innerWidth / 20));
    for (let i = 0; i < particleCount; i++) {
      particles.push(createParticle(false));
    }

    // Animation Loop
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p, index) => {
        // Move particle
        p.y += p.speedY;
        p.x += p.speedX;
        p.rotation += p.rotationSpeed;

        // Draw particle
        drawHeart(ctx, p.x, p.y, p.size, p.size, p.opacity, p.rotation, p.color);

        // Respawn if off screen
        if (p.y < -20 || p.x < -20 || p.x > canvas.width + 20) {
          particles[index] = createParticle(true);
        }
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden"
      style={{ mixBlendMode: 'soft-light' }}
    />
  );
};
export default FloatingHearts;
