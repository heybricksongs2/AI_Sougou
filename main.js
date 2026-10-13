// POP LOCK RUSH! - 10 Simple & Intuitive Lock Gimmicks
document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const timeDisplay = document.getElementById('time-display');
  const timeAddedAnim = document.getElementById('time-added-anim');
  const scoreDisplay = document.getElementById('score-display');
  const unlockedCount = document.getElementById('unlocked-count');
  const soundBtn = document.getElementById('sound-btn');
  const currentCard = document.getElementById('current-lock-card');
  const nextCard = document.getElementById('next-lock-card');
  const lockName = document.getElementById('lock-name');
  const lockDiff = document.getElementById('lock-difficulty');
  const lockFace = document.getElementById('lock-face');
  const currentShackle = document.getElementById('current-shackle');
  const gimmickContainer = document.getElementById('gimmick-container');
  const hintText = document.getElementById('hint-text');

  const startOverlay = document.getElementById('start-overlay');
  const startBtn = document.getElementById('start-btn');
  const resultOverlay = document.getElementById('result-overlay');
  const retryBtn = document.getElementById('retry-btn');
  const finalScoreEl = document.getElementById('final-score');
  const finalLocksEl = document.getElementById('final-locks');
  const finalBonusEl = document.getElementById('final-bonus');
  const highScoreEl = document.getElementById('high-score');
  const rankBadgeEl = document.getElementById('result-rank-badge');
  const resultTitleComment = document.getElementById('result-title-comment');

  // Canvas Particles
  const canvas = document.getElementById('particle-canvas');
  const ctx = canvas.getContext('2d');
  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  let particles = [];
  function createBurst(x, y, count = 28) {
    const colors = ['#ff4757', '#2ed573', '#ffa502', '#1e90ff', '#ffffff'];
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 8 + 3;
      particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 6 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1,
        decay: Math.random() * 0.03 + 0.02
      });
    }
  }

  function updateParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.15;
      p.alpha -= p.decay;
      if (p.alpha <= 0) {
        particles.splice(i, 1);
        continue;
      }
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    requestAnimationFrame(updateParticles);
  }
  updateParticles();

  // Web Audio Synth
  let audioCtx = null;
  let soundEnabled = true;

  function initAudio() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
  }

  function playSound(type) {
    if (!soundEnabled || !audioCtx) return;
    try {
      const now = audioCtx.currentTime;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);

      if (type === 'tap') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(450, now);
        osc.frequency.exponentialRampToValueAtTime(850, now + 0.05);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
        osc.start(now);
        osc.stop(now + 0.05);
      } else if (type === 'unlock') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(520, now);
        osc.frequency.exponentialRampToValueAtTime(1040, now + 0.12);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
      } else if (type === 'mistake') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(160, now);
        osc.frequency.linearRampToValueAtTime(110, now + 0.15);
        gain.gain.setValueAtTime(0.22, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
      } else if (type === 'warning') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(880, now);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.06);
        osc.start(now);
        osc.stop(now + 0.06);
      }
    } catch (e) {}
  }

  soundBtn.addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    soundBtn.textContent = soundEnabled ? '🔊' : '🔇';
  });

  // Game State
  let isPlaying = false;
  let remainingTime = 18.0;
  let score = 0;
  let unlockedCountNum = 0;
  let highScore = parseInt(localStorage.getItem('pop_lock_high') || '0', 10);
  let timerInterval = null;
  let currentLock = null;
  let nextLock = null;
  let warningBeepTimer = 0;

  const faces = {
    normal: ['😏', '😎', '🤖', '🦊', '🎩', '😺', '🤠'],
    trying: ['😬', '🤨', '😲', '😅', '🥵'],
    happy: ['🥳', '🎉', '🤩', '😆', '✨'],
    error: ['💥', '😵', '😱', '🥴', '⚡']
  };

  function getRandomFace(category) {
    const list = faces[category] || faces.normal;
    return list[Math.floor(Math.random() * list.length)];
  }

  // 10 Lock Gimmick Types
  const GIMMICK_TYPES = [
    { type: 'single_tap', name: 'ワンタップ', unlockAt: 0 },
    { type: 'rapid_mash', name: '激連打', unlockAt: 1 },
    { type: 'slide_right', name: '横スライド', unlockAt: 2 },
    { type: 'slide_up', name: '上引きレバー', unlockAt: 3 },
    { type: 'toggle_switch', name: '電源スイッチ', unlockAt: 4 },
    { type: 'double_tap', name: 'ダブルタップ', unlockAt: 5 },
    { type: 'color_choice', name: 'カラー二択', unlockAt: 6 },
    { type: 'hold_charge', name: '長押しチャージ', unlockAt: 7 },
    { type: 'key_insert', name: '鍵差し込み', unlockAt: 8 },
    { type: 'dial_turn', name: 'ダイヤル合わせ', unlockAt: 9 }
  ];

  function generateLock(index) {
    // Determine available types based on progression
    const available = GIMMICK_TYPES.filter(g => index >= g.unlockAt);
    const chosen = available[Math.floor(Math.random() * available.length)];

    let diff = 1;
    if (index >= 5) diff = 2;
    if (index >= 12) diff = 3;
    if (index >= 20) diff = 4;

    return {
      type: chosen.type,
      name: chosen.name,
      difficulty: diff,
      face: getRandomFace('normal'),
      index
    };
  }

  // Render 10 Gimmick Handlers
  function renderGimmick(lock) {
    gimmickContainer.innerHTML = '';
    lockName.textContent = lock.name;
    lockDiff.textContent = '★'.repeat(lock.difficulty) + '☆'.repeat(Math.max(0, 4 - lock.difficulty));
    lockFace.textContent = lock.face;
    currentShackle.classList.remove('open');

    // 1. ワンタップ
    if (lock.type === 'single_tap') {
      hintText.textContent = 'ボタンをポチッと1回押せ！';
      const btn = document.createElement('button');
      btn.className = 'pop-action-btn';
      btn.innerHTML = '<span>PUSH!</span><span style="font-size:1rem;">👆</span>';
      btn.addEventListener('click', () => {
        playSound('tap');
        resolveLockSuccess();
      });
      gimmickContainer.appendChild(btn);

    // 2. 激連打
    } else if (lock.type === 'rapid_mash') {
      const targetClicks = 3 + lock.difficulty * 2; // 5〜11回
      let count = 0;
      hintText.textContent = `猛烈に連打せよ！ (${targetClicks}回)`;

      const bar = document.createElement('div');
      bar.className = 'mash-bar';
      const fill = document.createElement('div');
      fill.className = 'mash-fill';
      bar.appendChild(fill);

      const btn = document.createElement('button');
      btn.className = 'pop-action-btn';
      btn.innerHTML = '<span>MASH!</span><span style="font-size:0.9rem;">⚡連打⚡</span>';
      btn.addEventListener('click', () => {
        count++;
        playSound('tap');
        fill.style.width = Math.min(100, (count / targetClicks) * 100) + '%';
        lockFace.textContent = getRandomFace('trying');
        if (count >= targetClicks) resolveLockSuccess();
      });

      gimmickContainer.appendChild(bar);
      gimmickContainer.appendChild(btn);

    // 3. 横スライド
    } else if (lock.type === 'slide_right') {
      hintText.textContent = 'つまみを右端までグッと引け！';
      const track = document.createElement('div');
      track.className = 'slider-horizontal';

      const goal = document.createElement('div');
      goal.className = 'slider-goal-h';
      goal.textContent = 'GOAL!';

      const knob = document.createElement('div');
      knob.className = 'slider-knob-h';
      knob.textContent = '👉';

      track.appendChild(goal);
      track.appendChild(knob);
      gimmickContainer.appendChild(track);

      let isDragging = false;
      function onStart(e) {
        isDragging = true;
        playSound('tap');
      }
      function onMove(e) {
        if (!isDragging) return;
        const curX = (e.touches ? e.touches[0].clientX : e.clientX);
        const rect = track.getBoundingClientRect();
        const maxDist = rect.width - 64;
        let diff = curX - rect.left - 26;
        diff = Math.max(6, Math.min(maxDist, diff));
        knob.style.left = diff + 'px';
        if (diff >= maxDist - 8) {
          isDragging = false;
          resolveLockSuccess();
        }
      }
      function onEnd() {
        if (isDragging) {
          isDragging = false;
          knob.style.left = '6px';
          triggerMistake('すっぽ抜けた！端まで引き切ろう');
        }
      }
      knob.addEventListener('mousedown', onStart);
      knob.addEventListener('touchstart', onStart, { passive: true });
      window.addEventListener('mousemove', onMove);
      window.addEventListener('touchmove', onMove, { passive: true });
      window.addEventListener('mouseup', onEnd);
      window.addEventListener('touchend', onEnd);

    // 4. 上引きレバー
    } else if (lock.type === 'slide_up') {
      hintText.textContent = 'かんぬきを上へ引き上げろ！';
      const track = document.createElement('div');
      track.className = 'slider-vertical';

      const goal = document.createElement('div');
      goal.className = 'slider-goal-v';
      goal.textContent = 'UP!';

      const knob = document.createElement('div');
      knob.className = 'slider-knob-v';
      knob.textContent = '☝️';

      track.appendChild(goal);
      track.appendChild(knob);
      gimmickContainer.appendChild(track);

      let isDragging = false;
      function onStart(e) {
        isDragging = true;
        playSound('tap');
      }
      function onMove(e) {
        if (!isDragging) return;
        const curY = (e.touches ? e.touches[0].clientY : e.clientY);
        const rect = track.getBoundingClientRect();
        const maxDist = rect.height - 58;
        let diff = rect.bottom - curY - 26;
        diff = Math.max(6, Math.min(maxDist, diff));
        knob.style.bottom = diff + 'px';
        if (diff >= maxDist - 8) {
          isDragging = false;
          resolveLockSuccess();
        }
      }
      function onEnd() {
        if (isDragging) {
          isDragging = false;
          knob.style.bottom = '6px';
          triggerMistake('途中で落ちた！上まで引き上げろ');
        }
      }
      knob.addEventListener('mousedown', onStart);
      knob.addEventListener('touchstart', onStart, { passive: true });
      window.addEventListener('mousemove', onMove);
      window.addEventListener('touchmove', onMove, { passive: true });
      window.addEventListener('mouseup', onEnd);
      window.addEventListener('touchend', onEnd);

    // 5. トグルスイッチ
    } else if (lock.type === 'toggle_switch') {
      hintText.textContent = 'スイッチをタップしてONにせよ！';
      const wrap = document.createElement('div');
      wrap.className = 'switch-container';

      const sw = document.createElement('div');
      sw.className = 'toggle-switch-ui';
      const thumb = document.createElement('div');
      thumb.className = 'switch-thumb-ui';
      thumb.textContent = 'OFF';
      sw.appendChild(thumb);
      wrap.appendChild(sw);

      sw.addEventListener('click', () => {
        playSound('tap');
        sw.classList.add('on');
        thumb.textContent = 'ON';
        setTimeout(() => resolveLockSuccess(), 120);
      });
      gimmickContainer.appendChild(wrap);

    // 6. ダブルタップ
    } else if (lock.type === 'double_tap') {
      hintText.textContent = 'すばやく2回トントンとタップ！';
      let tapCount = 0;
      let lastTapTime = 0;

      const btn = document.createElement('button');
      btn.className = 'pop-action-btn';
      btn.innerHTML = '<span>2 TAP</span><span style="font-size:1.1rem;">✌️</span>';

      btn.addEventListener('click', () => {
        const now = Date.now();
        playSound('tap');
        if (now - lastTapTime < 450) {
          // Double tap success!
          btn.innerHTML = '<span>OK!</span>';
          resolveLockSuccess();
        } else {
          tapCount = 1;
          btn.innerHTML = '<span>1/2</span>';
        }
        lastTapTime = now;
      });
      gimmickContainer.appendChild(btn);

    // 7. カラー二択
    } else if (lock.type === 'color_choice') {
      const isBlueTarget = Math.random() > 0.5;
      hintText.textContent = isBlueTarget ? '【 青 】のボタンを押せ！' : '【 赤 】のボタンを押せ！';

      const row = document.createElement('div');
      row.className = 'choice-row';

      const btnA = document.createElement('button');
      btnA.className = 'choice-btn';
      btnA.style.background = '#1e90ff';
      btnA.style.color = '#ffffff';
      btnA.textContent = '青 🔵';

      const btnB = document.createElement('button');
      btnB.className = 'choice-btn';
      btnB.style.background = '#ff4757';
      btnB.style.color = '#ffffff';
      btnB.textContent = '赤 🔴';

      btnA.addEventListener('click', () => {
        if (isBlueTarget) {
          playSound('tap');
          resolveLockSuccess();
        } else {
          triggerMistake('色が違う！');
        }
      });

      btnB.addEventListener('click', () => {
        if (!isBlueTarget) {
          playSound('tap');
          resolveLockSuccess();
        } else {
          triggerMistake('色が違う！');
        }
      });

      // Random order
      if (Math.random() > 0.5) {
        row.appendChild(btnA);
        row.appendChild(btnB);
      } else {
        row.appendChild(btnB);
        row.appendChild(btnA);
      }
      gimmickContainer.appendChild(row);

    // 8. 長押しチャージ
    } else if (lock.type === 'hold_charge') {
      const requiredHoldMs = 700 + lock.difficulty * 150; // 0.85s〜1.3s
      hintText.textContent = 'ボタンを長押ししてチャージ！';

      const wrap = document.createElement('div');
      wrap.className = 'hold-circle-wrap';

      wrap.innerHTML = `
        <svg class="hold-svg-ring" viewBox="0 0 120 120">
          <circle class="hold-ring-bg" cx="60" cy="60" r="54" />
          <circle id="hold-ring-fill" class="hold-ring-fill" cx="60" cy="60" r="54" />
        </svg>
      `;

      const btn = document.createElement('button');
      btn.className = 'hold-btn';
      btn.textContent = 'HOLD!';
      wrap.appendChild(btn);
      gimmickContainer.appendChild(wrap);

      const fill = wrap.querySelector('#hold-ring-fill');
      let holdStart = 0;
      let holdTimer = null;

      function onStart(e) {
        e.preventDefault();
        holdStart = Date.now();
        playSound('tap');
        btn.textContent = 'CHARGING';
        holdTimer = setInterval(() => {
          const elapsed = Date.now() - holdStart;
          const pct = Math.min(1, elapsed / requiredHoldMs);
          fill.style.strokeDashoffset = (339 * (1 - pct)) + '';
          if (elapsed >= requiredHoldMs) {
            clearInterval(holdTimer);
            btn.textContent = 'FULL!';
            resolveLockSuccess();
          }
        }, 30);
      }

      function onCancel() {
        if (holdTimer) {
          clearInterval(holdTimer);
          holdTimer = null;
          fill.style.strokeDashoffset = '339';
          btn.textContent = 'HOLD!';
          triggerMistake('離すのが早い！満タンまでホールド');
        }
      }

      btn.addEventListener('mousedown', onStart);
      btn.addEventListener('touchstart', onStart, { passive: false });
      window.addEventListener('mouseup', onCancel);
      window.addEventListener('touchend', onCancel);

    // 9. 鍵差し込み
    } else if (lock.type === 'key_insert') {
      hintText.textContent = '下の「🔑鍵」をタップして差し込め！';

      const zone = document.createElement('div');
      zone.className = 'keyhole-zone';

      const hole = document.createElement('div');
      hole.className = 'keyhole-target';
      hole.textContent = '🕳️';

      const keyBtn = document.createElement('button');
      keyBtn.className = 'key-draggable';
      keyBtn.innerHTML = '<span>🔑</span><span>INSERT!</span>';

      keyBtn.addEventListener('click', () => {
        playSound('tap');
        keyBtn.style.transform = 'translateY(-30px) scale(0.9)';
        hole.textContent = '🗝️';
        setTimeout(() => resolveLockSuccess(), 120);
      });

      zone.appendChild(hole);
      zone.appendChild(keyBtn);
      gimmickContainer.appendChild(zone);

    // 10. ダイヤル合わせ
    } else if (lock.type === 'dial_turn') {
      hintText.textContent = 'ダイヤルをタップして▲を真上に合わせろ！';

      let rotation = (Math.floor(Math.random() * 3) + 1) * 90; // 90, 180, 270
      const dial = document.createElement('div');
      dial.className = 'dial-knob-ui';
      dial.style.transform = `rotate(${rotation}deg)`;

      const ind = document.createElement('div');
      ind.className = 'dial-indicator';
      const label = document.createElement('div');
      label.className = 'dial-center-label';
      label.textContent = '▲';

      dial.appendChild(ind);
      dial.appendChild(label);
      gimmickContainer.appendChild(dial);

      dial.addEventListener('click', () => {
        playSound('tap');
        rotation = (rotation + 90) % 360;
        dial.style.transform = `rotate(${rotation}deg)`;
        if (rotation === 0) {
          // Pointing directly UP!
          setTimeout(() => resolveLockSuccess(), 120);
        }
      });
    }
  }

  // Mistake Trigger
  function triggerMistake(msg) {
    playSound('mistake');
    lockFace.textContent = getRandomFace('error');
    lockFace.classList.add('shake');
    hintText.textContent = msg;
    hintText.style.color = '#ff4757';
    setTimeout(() => {
      lockFace.classList.remove('shake');
      hintText.style.color = '#a4b0be';
    }, 400);
  }

  // Success Trigger (+0.5s & Card Swap)
  function resolveLockSuccess() {
    playSound('unlock');
    currentShackle.classList.add('open');
    lockFace.textContent = getRandomFace('happy');

    // Add +0.5s bonus
    remainingTime += 0.5;
    timeAddedAnim.classList.remove('animate');
    void timeAddedAnim.offsetWidth;
    timeAddedAnim.classList.add('animate');

    // Score based on difficulty
    const diffPoints = currentLock.difficulty * 150;
    score += diffPoints;
    unlockedCountNum++;
    scoreDisplay.textContent = score;
    unlockedCount.textContent = unlockedCountNum;

    // Burst particles at active card center
    const cardRect = currentCard.getBoundingClientRect();
    createBurst(cardRect.left + cardRect.width / 2, cardRect.top + cardRect.height / 2, 32);

    // Swap Cards: Fade out with scale up, then replace with nextLock
    currentCard.style.transform = 'translateY(-20px) scale(1.08)';
    currentCard.style.opacity = '0';

    setTimeout(() => {
      currentLock = nextLock;
      nextLock = generateLock(unlockedCountNum + 1);

      renderGimmick(currentLock);
      currentCard.style.transform = 'translateY(0) scale(1)';
      currentCard.style.opacity = '1';

      nextCard.querySelector('.card-badge').textContent = `NEXT: ${nextLock.name}`;
      nextCard.querySelector('.lock-face').textContent = nextLock.face;
    }, 200);
  }

  // Timer loop
  function startTimer() {
    timerInterval = setInterval(() => {
      remainingTime -= 0.1;
      if (remainingTime <= 0) {
        remainingTime = 0;
        timeDisplay.textContent = '0.0';
        endGame();
        return;
      }

      timeDisplay.textContent = remainingTime.toFixed(1);

      if (remainingTime <= 5.0) {
        timeDisplay.parentElement.classList.add('timer-danger');
        warningBeepTimer++;
        if (warningBeepTimer % 5 === 0) {
          playSound('warning');
        }
      } else {
        timeDisplay.parentElement.classList.remove('timer-danger');
      }
    }, 100);
  }

  function startGame() {
    initAudio();
    isPlaying = true;
    remainingTime = 18.0;
    score = 0;
    unlockedCountNum = 0;
    warningBeepTimer = 0;

    scoreDisplay.textContent = '0';
    unlockedCount.textContent = '0';
    timeDisplay.textContent = '18.0';
    timeDisplay.parentElement.classList.remove('timer-danger');

    startOverlay.classList.remove('active');
    resultOverlay.classList.remove('active');

    currentLock = generateLock(0);
    nextLock = generateLock(1);
    renderGimmick(currentLock);

    nextCard.querySelector('.card-badge').textContent = `NEXT: ${nextLock.name}`;
    nextCard.querySelector('.lock-face').textContent = nextLock.face;

    startTimer();
  }

  function endGame() {
    isPlaying = false;
    clearInterval(timerInterval);

    if (score > highScore) {
      highScore = score;
      localStorage.setItem('pop_lock_high', highScore);
    }

    let rank = 'C';
    let titleComment = '「まだまだ見習いピッカー」';
    if (score >= 4000) {
      rank = 'S';
      titleComment = '「伝説の神速怪盗ルパン！🗝️」';
    } else if (score >= 2500) {
      rank = 'A';
      titleComment = '「超一流の解錠プロフェッショナル！✨」';
    } else if (score >= 1300) {
      rank = 'B';
      titleComment = '「手際のいいベテラン泥棒！🏃」';
    }

    rankBadgeEl.textContent = `RANK ${rank}`;
    if (rank === 'S') rankBadgeEl.style.background = '#ffd32a';
    else if (rank === 'A') rankBadgeEl.style.background = '#2ed573';
    else if (rank === 'B') rankBadgeEl.style.background = '#1e90ff';
    else rankBadgeEl.style.background = '#a4b0be';

    resultTitleComment.textContent = titleComment;
    finalScoreEl.textContent = score;
    finalLocksEl.textContent = `${unlockedCountNum} 個`;
    finalBonusEl.textContent = `+${Math.floor(score * 0.2)} pts`;
    highScoreEl.textContent = highScore;

    resultOverlay.classList.add('active');
  }

  startBtn.addEventListener('click', startGame);
  retryBtn.addEventListener('click', startGame);
});
