/**
 * src/browser/CanvasRenderer.js
 * High-performance Cyber-Neon 2D Canvas Presentation Engine.
 * Consumes read-only snapshot from GameEngine.getSnapshot().
 */

import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  GROUND_Y,
  ITEM_TYPES,
  OBSTACLE_TYPES
} from '../core/constants.js';

export class CanvasRenderer {
  #canvas;
  #ctx;
  #config;
  #scaleX = 1;
  #scaleY = 1;
  #dpr = 1;

  // Local visual-only timers (do NOT mutate simulation)
  #distanceScrolled = 0;
  #timeElapsed = 0;
  #prevLives = 3;
  #invulnerableTimer = 0;
  #screenShakeTimer = 0;
  #screenShakeIntensity = 0;

  // Event unbinders
  #unsubscribers = [];

  // Particle pool
  #particles = [];
  #maxParticles = 250;

  constructor(canvas, config = {}) {
    if (!canvas || typeof canvas.getContext !== 'function') {
      throw new Error('[CanvasRenderer] Valid HTMLCanvasElement required');
    }
    this.#canvas = canvas;
    this.#ctx = canvas.getContext('2d', { alpha: false });
    this.#config = {
      virtualWidth: config.virtualWidth || CANVAS_WIDTH,
      virtualHeight: config.virtualHeight || CANVAS_HEIGHT,
      groundY: config.groundY || GROUND_Y,
      ...config
    };

    this.#initParticlePool();
  }

  /**
   * Optional lifecycle init helper.
   */
  init() {
    if (this.#canvas.parentElement) {
      this.resize(this.#canvas.parentElement.clientWidth, this.#canvas.parentElement.clientHeight);
    } else {
      this.resize(this.#config.virtualWidth, this.#config.virtualHeight);
    }
  }

  #initParticlePool() {
    this.#particles = [];
    for (let i = 0; i < this.#maxParticles; i++) {
      this.#particles.push({
        active: false,
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        life: 0,
        maxLife: 1,
        size: 2,
        color: '#00f3ff',
        type: 'spark',
        text: ''
      });
    }
  }

  resize(containerWidth, containerHeight) {
    if (typeof window === 'undefined') return;

    this.#dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    const vw = this.#config.virtualWidth;
    const vh = this.#config.virtualHeight;
    const targetAspect = vw / vh;

    let dispW = containerWidth || vw;
    let dispH = dispW / targetAspect;

    if (containerHeight && dispH > containerHeight) {
      dispH = containerHeight;
      dispW = containerHeight * targetAspect;
    }

    dispW = Math.max(1, Math.round(dispW));
    dispH = Math.max(1, Math.round(dispH));

    this.#canvas.style.width = `${dispW}px`;
    this.#canvas.style.height = `${dispH}px`;

    const bufW = Math.round(dispW * this.#dpr);
    const bufH = Math.round(dispH * this.#dpr);

    if (this.#canvas.width !== bufW || this.#canvas.height !== bufH) {
      this.#canvas.width = bufW;
      this.#canvas.height = bufH;
    }

    this.#scaleX = bufW / vw;
    this.#scaleY = bufH / vh;
  }

  /**
   * Optionally registers engine event listeners for particle triggers.
   * @param {Object} engine GameEngine instance
   */
  attachEngine(engine) {
    if (!engine || typeof engine.on !== 'function') return;

    this.#unsubscribers.push(
      engine.on('hit', (data) => {
        const obs = data?.obstacle;
        const x = obs ? obs.x + obs.width / 2 : 140;
        const y = obs ? obs.y + obs.height / 2 : 400;
        this.emitExplosion(x, y);
        this.triggerScreenShake(8, 0.35);
        this.#invulnerableTimer = 1.5;
      })
    );

    this.#unsubscribers.push(
      engine.on('item_collected', (data) => {
        const it = data?.item;
        if (it) {
          const isStar = it.type === ITEM_TYPES.STAR || it.radius >= 16;
          this.emitSparkles(it.x, it.y, isStar ? '#ffe600' : '#39ff14');
          this.emitFloatingText(it.x, it.y - 10, `+${data.addedPoints || 250}`, isStar ? '#ffe600' : '#39ff14');
        }
      })
    );

    this.#unsubscribers.push(
      engine.on('jump', () => {
        this.emitJumpDust(130, this.#config.groundY);
      })
    );

    this.#unsubscribers.push(
      engine.on('game_over', () => {
        this.triggerScreenShake(12, 0.5);
      })
    );
  }

  attach(engine) {
    this.attachEngine(engine);
  }

  emitExplosion(x, y) {
    const colors = ['#ff007f', '#ffe600', '#ff3b30', '#ffffff'];
    for (let i = 0; i < 30; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 100 + Math.random() * 320;
      this.#spawnParticle({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        maxLife: 0.4 + Math.random() * 0.3,
        size: 2 + Math.random() * 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        type: 'shard'
      });
    }
  }

  emitSparkles(x, y, color = '#39ff14') {
    for (let i = 0; i < 18; i++) {
      this.#spawnParticle({
        x: x + (Math.random() - 0.5) * 20,
        y: y + (Math.random() - 0.5) * 20,
        vx: (Math.random() - 0.5) * 160,
        vy: -60 - Math.random() * 160,
        maxLife: 0.5 + Math.random() * 0.3,
        size: 2 + Math.random() * 3,
        color,
        type: 'spark'
      });
    }
  }

  emitJumpDust(x, y) {
    for (let i = 0; i < 10; i++) {
      this.#spawnParticle({
        x: x + (Math.random() - 0.5) * 15,
        y: y - 2,
        vx: -60 - Math.random() * 120,
        vy: -10 - Math.random() * 30,
        maxLife: 0.25 + Math.random() * 0.15,
        size: 2 + Math.random() * 2.5,
        color: '#00f3ff',
        type: 'spark'
      });
    }
  }

  emitFloatingText(x, y, text, color) {
    this.#spawnParticle({
      x,
      y,
      vx: 0,
      vy: -55,
      maxLife: 0.65,
      size: 16,
      color,
      type: 'text',
      text
    });
  }

  #spawnParticle(props) {
    const p = this.#particles.find((pt) => !pt.active);
    if (!p) return;
    p.active = true;
    p.x = props.x;
    p.y = props.y;
    p.vx = props.vx;
    p.vy = props.vy;
    p.life = 0;
    p.maxLife = props.maxLife || 0.5;
    p.size = props.size || 2;
    p.color = props.color || '#00f3ff';
    p.type = props.type || 'spark';
    p.text = props.text || '';
  }

  triggerScreenShake(intensity = 6, duration = 0.3) {
    this.#screenShakeIntensity = intensity;
    this.#screenShakeTimer = duration;
  }

  render(snapshot, dt = 1 / 60) {
    if (!snapshot) return;

    // Advance local visual timers
    if (snapshot.state === 'RUNNING') {
      this.#distanceScrolled += (snapshot.speed || 300) * dt;
      this.#timeElapsed += dt;
    }
    if (this.#invulnerableTimer > 0) {
      this.#invulnerableTimer = Math.max(0, this.#invulnerableTimer - dt);
    }
    if (this.#screenShakeTimer > 0) {
      this.#screenShakeTimer = Math.max(0, this.#screenShakeTimer - dt);
    }

    // Fallback hit check if EventBus was not attached
    if (snapshot.player && snapshot.player.lives < this.#prevLives) {
      this.emitExplosion(
        snapshot.player.x + snapshot.player.width / 2,
        snapshot.player.y + snapshot.player.height / 2
      );
      this.triggerScreenShake(8, 0.35);
      this.#invulnerableTimer = 1.5;
    }
    this.#prevLives = snapshot.player?.lives ?? 3;

    const ctx = this.#ctx;
    const vw = this.#config.virtualWidth;
    const vh = this.#config.virtualHeight;

    ctx.save();
    ctx.setTransform(this.#scaleX, 0, 0, this.#scaleY, 0, 0);

    // Apply screen shake if active
    if (this.#screenShakeTimer > 0) {
      const shakeMag = (this.#screenShakeTimer / 0.35) * this.#screenShakeIntensity;
      const offsetX = (Math.random() - 0.5) * 2 * shakeMag;
      const offsetY = (Math.random() - 0.5) * 2 * shakeMag;
      ctx.translate(offsetX, offsetY);
    }

    // 1. Clear & Background
    this.#drawBackground(ctx, vw, vh, snapshot);

    // 2. Parallax Skyline & Perspective Grid
    this.#drawParallaxSkyline(ctx, vw, vh, snapshot);
    this.#drawGroundGrid(ctx, vw, vh, snapshot);

    // 3. Obstacles
    if (Array.isArray(snapshot.obstacles)) {
      for (const obs of snapshot.obstacles) {
        this.#drawObstacle(ctx, obs);
      }
    }

    // 4. Collectible Items
    if (Array.isArray(snapshot.items)) {
      for (const item of snapshot.items) {
        if (!item.collected) {
          this.#drawItem(ctx, item);
        }
      }
    }

    // 5. Player Cyber-Runner
    if (snapshot.player) {
      this.#drawPlayer(ctx, snapshot.player, snapshot);
    }

    // 6. Particle Burst Layer
    this.#updateAndDrawParticles(ctx, dt);

    // 7. State Overlays (INIT / PAUSED)
    this.#drawStateOverlays(ctx, vw, vh, snapshot);

    ctx.restore();
  }

  #drawBackground(ctx, w, h, snapshot) {
    const grad = ctx.createRadialGradient(w / 2, h / 2 - 30, 40, w / 2, h / 2, w * 0.7);
    grad.addColorStop(0, '#0f1429');
    grad.addColorStop(0.5, '#080a16');
    grad.addColorStop(1, '#030408');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Distant twinkling stars (seed-based)
    ctx.fillStyle = 'rgba(0, 243, 255, 0.4)';
    const starCount = 35;
    for (let i = 0; i < starCount; i++) {
      const sx = (i * 137.5 + this.#distanceScrolled * 0.02) % w;
      const sy = (i * 31.7) % (this.#config.groundY - 140);
      const pulse = 0.5 + 0.5 * Math.sin(this.#timeElapsed * 3 + i);
      ctx.globalAlpha = pulse * 0.6;
      ctx.fillRect(sx, sy, 1.5, 1.5);
    }
    ctx.globalAlpha = 1.0;
  }

  #drawParallaxSkyline(ctx, w, h, snapshot) {
    const groundY = this.#config.groundY;
    const skylineScroll = (this.#distanceScrolled * 0.08) % 400;

    ctx.save();
    ctx.fillStyle = '#0a0d1f';
    ctx.strokeStyle = '#8b00ff';
    ctx.lineWidth = 1;

    // Repeating procedural skyline silhouettes
    for (let bx = -400; bx < w + 400; bx += 80) {
      const drawX = bx - skylineScroll;
      const bHeight = 70 + ((Math.abs(bx) * 37) % 110);
      const bWidth = 65;
      const bY = groundY - bHeight;

      ctx.fillRect(drawX, bY, bWidth, bHeight);
      ctx.strokeRect(drawX, bY, bWidth, bHeight);

      // Window grid strips
      ctx.fillStyle = 'rgba(0, 243, 255, 0.2)';
      for (let wy = bY + 10; wy < groundY - 10; wy += 14) {
        ctx.fillRect(drawX + 12, wy, 6, 4);
        ctx.fillRect(drawX + 30, wy, 6, 4);
      }
      ctx.fillStyle = '#0a0d1f';
    }
    ctx.restore();
  }

  #drawGroundGrid(ctx, w, h, snapshot) {
    const gy = this.#config.groundY;
    const scroll = this.#distanceScrolled % 40;

    // Ground fill
    const gGrad = ctx.createLinearGradient(0, gy, 0, h);
    gGrad.addColorStop(0, '#060a17');
    gGrad.addColorStop(1, '#020306');
    ctx.fillStyle = gGrad;
    ctx.fillRect(0, gy, w, h - gy);

    // Perspective horizontal transverse lines
    const perspectiveY = [gy, gy + 8, gy + 19, gy + 34, gy + 55, gy + 80, h];
    ctx.strokeStyle = 'rgba(0, 243, 255, 0.35)';
    ctx.lineWidth = 1;
    for (const py of perspectiveY) {
      ctx.beginPath();
      ctx.moveTo(0, py);
      ctx.lineTo(w, py);
      ctx.stroke();
    }

    // Scrolling vertical grid lines
    ctx.strokeStyle = 'rgba(0, 243, 255, 0.25)';
    for (let x = -40; x <= w + 40; x += 40) {
      const lx = x - scroll;
      ctx.beginPath();
      ctx.moveTo(lx, gy);
      ctx.lineTo(lx, h);
      ctx.stroke();
    }

    // Glowing horizon neon beam
    ctx.save();
    ctx.strokeStyle = '#00f3ff';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#00f3ff';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.moveTo(0, gy);
    ctx.lineTo(w, gy);
    ctx.stroke();
    ctx.restore();
  }

  #drawObstacle(ctx, obs) {
    ctx.save();
    if (obs.type === OBSTACLE_TYPES.GROUND_HURDLE) {
      // Neon Spikes
      const tipX = obs.x + obs.width / 2;
      const baseY = obs.y + obs.height;

      // Glow fill
      ctx.fillStyle = 'rgba(255, 0, 127, 0.3)';
      ctx.beginPath();
      ctx.moveTo(obs.x, baseY);
      ctx.lineTo(tipX, obs.y);
      ctx.lineTo(obs.x + obs.width, baseY);
      ctx.closePath();
      ctx.fill();

      // Outer neon stroke
      ctx.strokeStyle = '#ff007f';
      ctx.lineWidth = 2.5;
      ctx.shadowColor = '#ff007f';
      ctx.shadowBlur = 8;
      ctx.stroke();

      // Inner white filament
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(tipX, obs.y + 4);
      ctx.lineTo(tipX, baseY - 2);
      ctx.stroke();
    } else if (obs.type === OBSTACLE_TYPES.LOW_BARRIER) {
      // Holographic Barricade
      ctx.fillStyle = 'rgba(189, 0, 255, 0.25)';
      ctx.strokeStyle = '#bd00ff';
      ctx.lineWidth = 2;
      ctx.shadowColor = '#bd00ff';
      ctx.shadowBlur = 8;
      ctx.strokeRect(obs.x, obs.y, obs.width, obs.height);
      ctx.fillRect(obs.x, obs.y, obs.width, obs.height);

      // Warning hash lines
      ctx.strokeStyle = 'rgba(255, 230, 0, 0.4)';
      ctx.lineWidth = 1.5;
      for (let lx = obs.x + 8; lx < obs.x + obs.width; lx += 12) {
        ctx.beginPath();
        ctx.moveTo(lx, obs.y + obs.height);
        ctx.lineTo(lx + 8, obs.y);
        ctx.stroke();
      }

      // Top glowing beam
      ctx.strokeStyle = '#ffe600';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(obs.x, obs.y);
      ctx.lineTo(obs.x + obs.width, obs.y);
      ctx.stroke();
    } else {
      // HIGH_OBSTACLE (Floating Drone)
      const cx = obs.x + obs.width / 2;
      const cy = obs.y + obs.height / 2;

      ctx.fillStyle = '#101426';
      ctx.strokeStyle = '#ff007f';
      ctx.lineWidth = 2;
      ctx.shadowColor = '#ff007f';
      ctx.shadowBlur = 10;
      ctx.strokeRect(obs.x + 4, obs.y + 4, obs.width - 8, obs.height - 8);
      ctx.fillRect(obs.x + 4, obs.y + 4, obs.width - 8, obs.height - 8);

      // Menacing eye
      ctx.fillStyle = '#ff007f';
      ctx.beginPath();
      ctx.arc(cx, cy, 6, 0, Math.PI * 2);
      ctx.fill();

      // Underside thruster flame
      ctx.strokeStyle = '#00f3ff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx - 8, obs.y + obs.height - 4);
      ctx.lineTo(cx - 8, obs.y + obs.height + 6 + Math.sin(this.#timeElapsed * 20) * 3);
      ctx.moveTo(cx + 8, obs.y + obs.height - 4);
      ctx.lineTo(cx + 8, obs.y + obs.height + 6 + Math.sin(this.#timeElapsed * 20 + 1) * 3);
      ctx.stroke();
    }
    ctx.restore();
  }

  #drawItem(ctx, item) {
    ctx.save();
    const isStar = item.type === ITEM_TYPES.STAR || item.radius >= 16;
    const bob = Math.sin(this.#timeElapsed * 5 + item.id) * 3.5;
    const cy = item.y + bob;

    if (isStar) {
      // Golden 5-point Star
      ctx.translate(item.x, cy);
      ctx.rotate(this.#timeElapsed * 2.5);

      ctx.fillStyle = '#ffe600';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.shadowColor = '#ffe600';
      ctx.shadowBlur = 14;

      ctx.beginPath();
      const r = item.radius || 16;
      for (let i = 0; i < 5; i++) {
        const outerA = (i * 4 * Math.PI) / 5 - Math.PI / 2;
        const innerA = outerA + (2 * Math.PI) / 10;
        ctx.lineTo(Math.cos(outerA) * r, Math.sin(outerA) * r);
        ctx.lineTo(Math.cos(innerA) * (r * 0.45), Math.sin(innerA) * (r * 0.45));
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else {
      // Neon Green Apple
      ctx.fillStyle = '#39ff14';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.shadowColor = '#39ff14';
      ctx.shadowBlur = 12;

      ctx.beginPath();
      ctx.arc(item.x, cy, item.radius || 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Stem
      ctx.strokeStyle = '#00f3ff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(item.x, cy - (item.radius || 14));
      ctx.quadraticCurveTo(
        item.x + 4,
        cy - (item.radius || 14) - 6,
        item.x + 6,
        cy - (item.radius || 14) - 4
      );
      ctx.stroke();
    }
    ctx.restore();
  }

  #drawPlayer(ctx, player, snapshot) {
    ctx.save();

    // Damage blinking check
    if (this.#invulnerableTimer > 0) {
      const isVisible = Math.floor(this.#invulnerableTimer / 0.1) % 2 === 0;
      if (!isVisible) {
        ctx.globalAlpha = 0.25;
      }
    }

    const isDucking = player.height <= 36;
    const isGrounded = player.isGrounded;
    const px = player.x;
    const py = player.y;
    const pw = player.width;
    const ph = player.height;

    // Afterimage ghosting at high speed
    if (snapshot.speed > 450 && isGrounded) {
      ctx.fillStyle = 'rgba(0, 243, 255, 0.12)';
      ctx.fillRect(px - 14, py, pw, ph);
    }

    if (isDucking) {
      // Ducking Speed-Slide
      ctx.fillStyle = '#081224';
      ctx.strokeStyle = '#00f3ff';
      ctx.lineWidth = 2.5;
      ctx.shadowColor = '#00f3ff';
      ctx.shadowBlur = 10;

      // Streamlined wedge body
      ctx.beginPath();
      ctx.moveTo(px, py + ph);
      ctx.lineTo(px + pw, py + ph);
      ctx.lineTo(px + pw - 8, py);
      ctx.lineTo(px + 4, py + 6);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Visor line
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(px + pw - 18, py + 10);
      ctx.lineTo(px + pw - 6, py + 10);
      ctx.stroke();
    } else {
      // Standing / Running / Airborne
      const runCycle = (this.#distanceScrolled * 0.05) % (Math.PI * 2);

      // Torso & Armor
      ctx.fillStyle = '#081224';
      ctx.strokeStyle = '#00f3ff';
      ctx.lineWidth = 2.5;
      ctx.shadowColor = '#00f3ff';
      ctx.shadowBlur = 10;

      // Body box
      ctx.fillRect(px + 8, py + 14, pw - 16, ph - 30);
      ctx.strokeRect(px + 8, py + 14, pw - 16, ph - 30);

      // Helmet & Visor
      ctx.fillRect(px + 10, py, pw - 20, 16);
      ctx.strokeRect(px + 10, py, pw - 20, 16);

      // Cyan Visor Glow
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(px + 18, py + 8);
      ctx.lineTo(px + pw - 10, py + 8);
      ctx.stroke();

      // Core Reactor Chest Light
      ctx.fillStyle = '#00f3ff';
      ctx.beginPath();
      ctx.arc(px + pw / 2, py + 26, 4, 0, Math.PI * 2);
      ctx.fill();

      // Animated Legs
      ctx.strokeStyle = '#00f3ff';
      ctx.lineWidth = 3;
      if (isGrounded) {
        const leg1Angle = Math.sin(runCycle) * 12;
        const leg2Angle = Math.sin(runCycle + Math.PI) * 12;

        ctx.beginPath();
        // Front leg
        ctx.moveTo(px + 14, py + ph - 16);
        ctx.lineTo(px + 14 + leg1Angle, py + ph);
        // Back leg
        ctx.moveTo(px + pw - 14, py + ph - 16);
        ctx.lineTo(px + pw - 14 + leg2Angle, py + ph);
        ctx.stroke();
      } else {
        // Airborne jump legs
        ctx.beginPath();
        if (player.vy < 0) {
          // Tucked knees
          ctx.moveTo(px + 14, py + ph - 16);
          ctx.lineTo(px + 10, py + ph - 4);
          ctx.moveTo(px + pw - 14, py + ph - 16);
          ctx.lineTo(px + pw - 18, py + ph - 4);
        } else {
          // Extended legs
          ctx.moveTo(px + 14, py + ph - 16);
          ctx.lineTo(px + 12, py + ph);
          ctx.moveTo(px + pw - 14, py + ph - 16);
          ctx.lineTo(px + pw - 12, py + ph);
        }
        ctx.stroke();
      }
    }

    ctx.restore();
  }

  #updateAndDrawParticles(ctx, dt) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    for (const p of this.#particles) {
      if (!p.active) continue;

      p.life += dt;
      if (p.life >= p.maxLife) {
        p.active = false;
        continue;
      }

      // Physics integration
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.type === 'shard') {
        p.vy += 320 * dt; // gravity
        p.vx *= 0.96;
      }

      const progress = p.life / p.maxLife;
      const alpha = Math.max(0, 1 - progress);

      if (p.type === 'text') {
        ctx.font = 'bold 16px "Segoe UI", sans-serif';
        ctx.fillStyle = p.color;
        ctx.globalAlpha = alpha;
        ctx.fillText(p.text, p.x, p.y);
      } else {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(0.5, p.size * (1 - progress * 0.5)), 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  }

  #drawStateOverlays(ctx, w, h, snapshot) {
    if (snapshot.state === 'INIT') {
      ctx.save();
      ctx.textAlign = 'center';
      ctx.font = 'bold 18px "Segoe UI", sans-serif';
      const alpha = 0.5 + 0.5 * Math.sin(this.#timeElapsed * 4);
      ctx.fillStyle = `rgba(0, 243, 255, ${alpha})`;
      ctx.fillText('PRESS SPACE / UP OR TAP SCREEN TO START', w / 2, h / 2 - 30);
      ctx.restore();
    } else if (snapshot.state === 'PAUSED') {
      ctx.save();
      ctx.fillStyle = 'rgba(5, 6, 15, 0.7)';
      ctx.fillRect(0, 0, w, h);

      ctx.textAlign = 'center';
      ctx.font = 'bold 32px "Segoe UI", sans-serif';
      ctx.fillStyle = '#00f3ff';
      ctx.shadowColor = '#00f3ff';
      ctx.shadowBlur = 12;
      ctx.fillText('PAUSED', w / 2, h / 2);
      ctx.restore();
    }
  }

  destroy() {
    for (const unsub of this.#unsubscribers) {
      if (typeof unsub === 'function') unsub();
    }
    this.#unsubscribers = [];
  }
}
