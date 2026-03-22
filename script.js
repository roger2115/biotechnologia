// ============================================================
// CANVAS BACKGROUND
// ============================================================
const canvas = document.getElementById('bgCanvas');
const ctx = canvas.getContext('2d');
let W, H;
function resize() { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; }
resize();
window.addEventListener('resize', resize);

const particles = Array.from({length: 80}, () => ({
  x: Math.random() * 2000, y: Math.random() * 2000,
  r: Math.random() * 1.5 + 0.3,
  vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3,
  alpha: Math.random() * 0.6 + 0.2
}));

let scanY = 0;
function animate() {
  ctx.clearRect(0, 0, W, H);
  const bg = ctx.createRadialGradient(W/2, H/2, 0, W/2, H/2, Math.max(W,H));
  bg.addColorStop(0, '#041428'); bg.addColorStop(1, '#020b18');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = 'rgba(0,150,255,0.06)'; ctx.lineWidth = 1;
  for (let x = 0; x < W; x += 60) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke(); }
  for (let y = 0; y < H; y += 60) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }
  scanY = (scanY + 0.5) % H;
  const sg = ctx.createLinearGradient(0, scanY-40, 0, scanY+40);
  sg.addColorStop(0,'transparent'); sg.addColorStop(0.5,'rgba(0,200,255,0.04)'); sg.addColorStop(1,'transparent');
  ctx.fillStyle = sg; ctx.fillRect(0, scanY-40, W, 80);
  particles.forEach(p => {
    p.x += p.vx; p.y += p.vy;
    if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
    if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
    ctx.fillStyle = `rgba(0,200,255,${p.alpha})`; ctx.fill();
  });
  for (let i = 0; i < particles.length; i++) {
    for (let j = i+1; j < particles.length; j++) {
      const dx = particles[i].x - particles[j].x, dy = particles[i].y - particles[j].y;
      const d = Math.sqrt(dx*dx + dy*dy);
      if (d < 120) {
        ctx.beginPath(); ctx.moveTo(particles[i].x, particles[i].y); ctx.lineTo(particles[j].x, particles[j].y);
        ctx.strokeStyle = `rgba(0,200,255,${0.15*(1-d/120)})`; ctx.lineWidth = 0.5; ctx.stroke();
      }
    }
  }
  requestAnimationFrame(animate);
}
animate();

// ============================================================
// AUDIO — lazy init, only after user gesture
// ============================================================
let audioCtx = null;
let audioUnlocked = false;

function unlockAudio() {
  if (audioUnlocked) return;
  audioUnlocked = true;
  audioCtx = new AudioContext();
}

function getAudioCtx() {
  if (!audioCtx) return null;
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

// Create AudioContext only after first real user gesture
document.addEventListener('click', unlockAudio, { once: true });
document.addEventListener('keydown', unlockAudio, { once: true });

function playHoverSound() {
  try {
    const ac = getAudioCtx(); if (!ac) return;
    const osc = ac.createOscillator(), g = ac.createGain();
    osc.connect(g); g.connect(ac.destination); osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ac.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1200, ac.currentTime + 0.08);
    g.gain.setValueAtTime(0.04, ac.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.12);
    osc.start(); osc.stop(ac.currentTime + 0.12);
  } catch(e) {}
}
function playClickSound() {
  try {
    const ac = getAudioCtx(); if (!ac) return;
    const osc = ac.createOscillator(), g = ac.createGain();
    osc.connect(g); g.connect(ac.destination); osc.type = 'triangle';
    osc.frequency.setValueAtTime(600, ac.currentTime);
    osc.frequency.exponentialRampToValueAtTime(300, ac.currentTime + 0.15);
    g.gain.setValueAtTime(0.06, ac.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.15);
    osc.start(); osc.stop(ac.currentTime + 0.15);
  } catch(e) {}
}
function attachHoverSounds() {
  document.querySelectorAll('.nav-btn, .action-btn, .holo-card, .video-card, .footer-link, .stat-pill, .info-tile, .verdict-card').forEach(el => {
    el.addEventListener('mouseenter', playHoverSound);
    el.addEventListener('click', playClickSound);
  });
}
attachHoverSounds();

// ============================================================
// MUSIC PLAYER
// ============================================================
const themeAudio = document.getElementById('themeAudio');
const musicToggle = document.getElementById('musicToggle');
const volSlider = document.getElementById('volSlider');
themeAudio.volume = 0.4;

let musicStarted = false;
function tryAutoplay() {
  if (musicStarted) return;
  musicStarted = true;
  themeAudio.play().then(() => {
    musicToggle.textContent = '⏸ PAUSE';
    musicToggle.classList.add('playing');
  }).catch(() => { musicStarted = false; });
}
document.addEventListener('click', tryAutoplay, { once: true });
document.addEventListener('keydown', tryAutoplay, { once: true });
document.addEventListener('scroll', tryAutoplay, { once: true });

musicToggle.addEventListener('click', () => {
  unlockAudio();
  if (themeAudio.paused) {
    themeAudio.play().then(() => {
      musicToggle.textContent = '⏸ PAUSE';
      musicToggle.classList.add('playing');
      musicStarted = true;
    }).catch(() => {});
  } else {
    themeAudio.pause();
    musicToggle.textContent = '▶ THEME';
    musicToggle.classList.remove('playing');
  }
});
volSlider.addEventListener('input', () => { themeAudio.volume = parseFloat(volSlider.value); });

// ============================================================
// VIDEO MODAL
// ============================================================
function openVideo(url) {
  playClickSound();
  const modal = document.getElementById('videoModal');
  document.getElementById('videoFrame').src = url + '?autoplay=1';
  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeVideo(e) {
  if (e && e.target !== document.getElementById('videoModal') && !e.target.classList.contains('modal-close')) return;
  document.getElementById('videoFrame').src = '';
  document.getElementById('videoModal').classList.remove('open');
  document.body.style.overflow = '';
}
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeVideo({ target: document.getElementById('videoModal') }); });

// ============================================================
// SCROLL REVEAL
// ============================================================
const revealObs = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); revealObs.unobserve(e.target); } });
}, { threshold: 0.08 });
document.querySelectorAll('.holo-section').forEach(s => revealObs.observe(s));

// ============================================================
// ACTIVE NAV
// ============================================================
window.addEventListener('scroll', () => {
  let current = '';
  document.querySelectorAll('section[id]').forEach(s => { if (window.scrollY >= s.offsetTop - 130) current = s.id; });
  document.querySelectorAll('.nav-btn').forEach(btn => {
    const active = btn.getAttribute('href') === '#' + current;
    btn.style.background = active ? 'rgba(0,200,255,0.2)' : '';
    btn.style.boxShadow = active ? '0 0 15px rgba(0,200,255,0.4)' : '';
  });
});

// ============================================================
// CARD MOUSE GLOW
// ============================================================
document.querySelectorAll('.holo-card').forEach(card => {
  card.addEventListener('mousemove', e => {
    const r = card.getBoundingClientRect();
    card.style.background = `radial-gradient(circle at ${((e.clientX-r.left)/r.width)*100}% ${((e.clientY-r.top)/r.height)*100}%, rgba(0,200,255,0.12), rgba(0,20,50,0.85) 60%)`;
  });
  card.addEventListener('mouseleave', () => { card.style.background = ''; });
});

// ============================================================
// TYPING EFFECT
// ============================================================
const subtitle = document.querySelector('.subtitle');
if (subtitle) {
  const text = subtitle.textContent; subtitle.textContent = ''; let i = 0;
  const type = () => { if (i < text.length) { subtitle.textContent += text[i++]; setTimeout(type, 38); } };
  setTimeout(type, 900);
}

// ============================================================
// COUNTER ANIMATION
// ============================================================
const tileObs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      const target = parseInt(e.target.textContent);
      if (!isNaN(target)) {
        let t0 = null;
        const step = ts => {
          if (!t0) t0 = ts;
          const p = Math.min((ts - t0) / 1500, 1);
          e.target.textContent = Math.floor(p * target);
          if (p < 1) requestAnimationFrame(step); else e.target.textContent = target;
        };
        requestAnimationFrame(step);
      }
      tileObs.unobserve(e.target);
    }
  });
}, { threshold: 0.5 });
document.querySelectorAll('.tile-num').forEach(el => tileObs.observe(el));

// ============================================================
// SHARE
// ============================================================
document.getElementById('shareBtn').addEventListener('click', () => {
  navigator.clipboard.writeText(window.location.href).then(() => {
    const toast = document.getElementById('toast');
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2500);
  });
});

// ============================================================
// THEME TOGGLE
// ============================================================
function toggleTheme() {
  const isLight = document.body.classList.toggle('light-mode');
  document.getElementById('themeBtn').textContent = isLight ? '🌙 CIEMNY MOTYW' : '☀️ JASNY MOTYW';
}

// ============================================================
// QUIZ
// ============================================================
const quizData = [
  { q: 'Co oznacza skrót GMO?', a: ['Genetycznie Modyfikowane Organizmy','Globalny Monitor Organiczny','Genetyczny Model Odporności','Główna Metoda Ochrony'], correct: 0 },
  { q: 'Który procent światowej produkcji soi stanowi soja GMO?', a: ['Około 30%','Około 50%','Około 77%','Około 95%'], correct: 2 },
  { q: 'Jak nazywa się odmiana soi GMO odporna na herbicyd glifosat?', a: ['Golden Soy','Roundup Ready','BioShield','GlyphMax'], correct: 1 },
  { q: 'Który dodatek do żywności (E-numer) często pochodzi z soi GMO?', a: ['E100 (kurkumina)','E200 (kwas sorbowy)','E322 (lecytyna sojowa)','E440 (pektyny)'], correct: 2 },
  { q: 'W którym roku odkryto strukturę podwójnej helisy DNA?', a: ['1944','1953','1962','1973'], correct: 1 },
  { q: 'Co to jest CRISPR-Cas9?', a: ['Rodzaj pestycydu','Narzędzie do precyzyjnej edycji genomu','Białko odpornościowe roślin','Metoda klonowania zwierząt'], correct: 1 },
  { q: 'Powyżej jakiej zawartości GMO UE wymaga obowiązkowego oznakowania?', a: ['0,1%','0,5%','0,9%','2,0%'], correct: 2 },
  { q: 'Które z poniższych NIE jest korzyścią biotechnologii?', a: ['Produkcja insuliny','Terapia genowa','Monopolizacja nasion przez korporacje','Szczepionki mRNA'], correct: 2 },
  { q: 'Jaka roślina GMO ma udział w globalnej produkcji ponad 80%?', a: ['Kukurydza','Rzepak','Bawełna','Pomidor'], correct: 2 },
  { q: 'Biotechnologia molekularna łączy biologię z:', a: ['Tylko chemią','Chemią i informatyką','Tylko fizyką','Geologią i astronomią'], correct: 1 }
];
let currentQ = 0, quizScore = 0, answered = false;

function startQuiz() {
  currentQ = 0; quizScore = 0; answered = false;
  document.getElementById('quizContainer').style.display = 'block';
  document.getElementById('quizResult').style.display = 'none';
  document.getElementById('startTestBtn').style.display = 'none';
  renderQuestion();
}
function renderQuestion() {
  answered = false;
  const data = quizData[currentQ];
  document.getElementById('quizProgressFill').style.width = (currentQ / quizData.length * 100) + '%';
  document.getElementById('quizProgressLabel').textContent = `Pytanie ${currentQ + 1} / ${quizData.length}`;
  document.getElementById('quizQuestion').textContent = data.q;
  document.getElementById('quizFeedback').textContent = '';
  document.getElementById('quizFeedback').className = 'quiz-feedback';
  const answersEl = document.getElementById('quizAnswers');
  answersEl.innerHTML = '';
  data.a.forEach((ans, i) => {
    const btn = document.createElement('button');
    btn.className = 'quiz-answer-btn'; btn.textContent = ans;
    btn.addEventListener('click', () => selectAnswer(i, btn));
    answersEl.appendChild(btn);
  });
}
function selectAnswer(idx, btn) {
  if (answered) return;
  answered = true;
  const correct = quizData[currentQ].correct;
  document.querySelectorAll('.quiz-answer-btn')[correct].classList.add('correct');
  const fb = document.getElementById('quizFeedback');
  if (idx === correct) { quizScore++; btn.classList.add('correct'); fb.textContent = 'Dobrze! Poprawna odpowiedź.'; fb.className = 'quiz-feedback fb-correct'; }
  else { btn.classList.add('wrong'); fb.textContent = 'Niestety. Poprawna to: ' + quizData[currentQ].a[correct]; fb.className = 'quiz-feedback fb-wrong'; }
  setTimeout(() => { currentQ++; if (currentQ < quizData.length) renderQuestion(); else showResult(); }, 1600);
}
function showResult() {
  document.getElementById('quizContainer').style.display = 'none';
  document.getElementById('quizResult').style.display = 'block';
  const pct = Math.round((quizScore / quizData.length) * 100);
  let msg, color;
  if (pct >= 90) { msg = 'Wybitny wynik! Jesteś ekspertem biotechnologii.'; color = 'var(--green)'; }
  else if (pct >= 70) { msg = 'Bardzo dobry wynik! Masz solidną wiedzę.'; color = 'var(--cyan)'; }
  else if (pct >= 50) { msg = 'Niezły wynik. Warto jeszcze raz przejrzeć materiał.'; color = 'var(--yellow)'; }
  else { msg = 'Wróć do materiału i spróbuj ponownie — dasz radę!'; color = 'var(--red)'; }
  document.getElementById('quizResultContent').innerHTML = `<div class="result-score" style="color:${color}">${quizScore} / ${quizData.length}</div><div class="result-pct" style="color:${color}">${pct}%</div><p class="result-msg">${msg}</p>`;
}
document.getElementById('startTestBtn').addEventListener('click', startQuiz);
document.getElementById('retryTestBtn').addEventListener('click', () => {
  document.getElementById('startTestBtn').style.display = 'block';
  document.getElementById('quizResult').style.display = 'none';
  startQuiz();
});

// ============================================================
// DNA-RUNNER — gra biotechnologiczna
// Grasz jako enzym restrykcyjny (nożyczki).
// Zbierasz nukleotydy A/T/G/C, unikasz wirusów GMO,
// bakterii patogennych i bakteriofagów.
// Power-up: CRISPR-Cas9 (✂) — tymczasowa moc.
// ============================================================
const gc = document.getElementById('gameCanvas');
const gctx = gc.getContext('2d');
const CELL = 28, COLS = 20, ROWS = 15;

const GC = {
  bg:'#020e1e', wall:'#0a2a4a', wallBorder:'#005588',
  A:'#00f5ff', T:'#ff3366', G:'#00ff88', C:'#ffcc00',
  crispr:'#cc00ff', player:'#00f5ff',
  virus:'#ff3366', bacteria:'#ff9900', phage:'#cc00ff',
  scared:'#223355', text:'#00f5ff'
};

// Mapa: 1=ściana DNA, 2=puste, 3=CRISPR, 0=A, 4=T, 5=G, 6=C
const MAP_TPL = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,3,0,4,5,6,0,4,5,1,1,6,0,4,5,6,0,4,3,1],
  [1,0,1,1,5,1,1,1,6,1,1,0,1,1,1,4,1,1,0,1],
  [1,4,1,1,6,1,1,1,0,1,1,5,1,1,1,6,1,1,4,1],
  [1,5,6,0,4,5,6,0,4,5,6,0,4,5,6,0,4,5,6,1],
  [1,0,1,1,5,1,4,1,1,1,1,1,1,6,1,0,1,1,4,1],
  [1,6,4,5,0,1,6,5,4,1,1,0,5,4,1,6,5,4,0,1],
  [1,1,1,1,5,1,1,2,2,2,2,2,2,1,1,6,1,1,1,1],
  [1,1,1,1,6,1,2,2,2,2,2,2,2,2,1,0,1,1,1,1],
  [1,1,1,1,0,1,2,1,1,2,2,1,1,2,1,4,1,1,1,1],
  [2,2,2,2,4,2,2,1,2,2,2,2,1,2,2,5,2,2,2,2],
  [1,1,1,1,5,1,2,1,1,1,1,1,1,2,1,6,1,1,1,1],
  [1,0,4,5,6,0,4,5,6,1,1,0,4,5,6,0,4,5,6,1],
  [1,6,1,1,0,1,1,1,4,1,1,5,1,1,1,0,1,1,4,1],
  [1,3,5,1,4,6,0,5,4,6,0,5,4,6,0,4,1,5,3,1],
];

const NUC_LABEL = {0:'A', 4:'T', 5:'G', 6:'C'};
const NUC_COLOR = {0:GC.A, 4:GC.T, 5:GC.G, 6:GC.C};
const NUC_PTS   = {0:10,  4:10,  5:15,  6:15};

let gmap, gscore, glives, glevel, gameRunning, gameOver, powerTimer, gLastTime;
let gplayer, genemies;

function gInitMap() { gmap = MAP_TPL.map(r => [...r]); }

function initGame() {
  gInitMap();
  gscore = 0; glives = 3; glevel = 1;
  gameRunning = false; gameOver = false; powerTimer = 0;
  gplayer = { x:10, y:7, dx:0, dy:0, nextDx:0, nextDy:0, sAngle:0.25, sDir:1, powered:false, mTimer:0 };
  genemies = [
    { x:9,  y:9, dx:1,  dy:0, type:'virus',    color:GC.virus,    mTimer:0, scared:false, label:'GMO' },
    { x:10, y:9, dx:-1, dy:0, type:'bacteria',  color:GC.bacteria, mTimer:0, scared:false, label:'BAK' },
    { x:11, y:9, dx:0,  dy:1, type:'phage',     color:GC.phage,    mTimer:0, scared:false, label:'FAG' },
  ];
  updateGHUD(); drawGame();
}

function updateGHUD() {
  document.getElementById('gameScore').textContent = gscore;
  document.getElementById('gameLives').textContent = glives;
  document.getElementById('gameLevel').textContent = glevel;
}

function gCanMove(x, y) {
  if (x < 0 || x >= COLS || y < 0 || y >= ROWS) return true;
  return gmap[y] && gmap[y][x] !== 1;
}
function gWrap(x, y) {
  return { x: (x + COLS) % COLS, y: (y + ROWS) % ROWS };
}

function gameLoop(ts) {
  if (!gameRunning) return;
  const dt = Math.min(ts - gLastTime, 80);
  gLastTime = ts;

  // Ruch gracza
  gplayer.mTimer += dt;
  const pSpeed = Math.max(170 - glevel * 8, 110);
  if (gplayer.mTimer >= pSpeed) {
    gplayer.mTimer = 0;
    const { x:tnx, y:tny } = gWrap(gplayer.x + gplayer.nextDx, gplayer.y + gplayer.nextDy);
    if (gCanMove(tnx, tny)) { gplayer.dx = gplayer.nextDx; gplayer.dy = gplayer.nextDy; }
    const { x:mx, y:my } = gWrap(gplayer.x + gplayer.dx, gplayer.y + gplayer.dy);
    if (gCanMove(mx, my)) { gplayer.x = mx; gplayer.y = my; }

    const cell = gmap[gplayer.y]?.[gplayer.x];
    if (cell === 0 || cell === 4 || cell === 5 || cell === 6) {
      gscore += (NUC_PTS[cell] || 10) * glevel;
      gmap[gplayer.y][gplayer.x] = 2;
      gPlayDot();
    }
    if (cell === 3) {
      gmap[gplayer.y][gplayer.x] = 2;
      gscore += 100 * glevel;
      gplayer.powered = true; powerTimer = 7000;
      genemies.forEach(e => e.scared = true);
      gPlayCrispr();
    }
    updateGHUD();

    const hasNuc = gmap.some(row => row.some(c => c===0||c===4||c===5||c===6||c===3));
    if (!hasNuc) {
      glevel++; gscore += 500; updateGHUD();
      gInitMap();
      gplayer.x = 10; gplayer.y = 7; gplayer.dx = 0; gplayer.dy = 0;
    }
  }

  if (gplayer.powered) {
    powerTimer -= dt;
    if (powerTimer <= 0) { gplayer.powered = false; genemies.forEach(e => e.scared = false); }
  }

  const eSpeed = Math.max(240 - glevel * 18, 130);
  genemies.forEach(enemy => {
    enemy.mTimer += dt;
    if (enemy.mTimer >= eSpeed) {
      enemy.mTimer = 0;
      const dirs = [{dx:1,dy:0},{dx:-1,dy:0},{dx:0,dy:1},{dx:0,dy:-1}];
      const valid = dirs.filter(d => {
        const {x,y} = gWrap(enemy.x+d.dx, enemy.y+d.dy);
        return gCanMove(x,y) && !(d.dx===-enemy.dx && d.dy===-enemy.dy);
      });
      if (valid.length > 0) {
        let chosen;
        if (gplayer.powered) {
          chosen = valid.reduce((b,d) => {
            const {x,y} = gWrap(enemy.x+d.dx, enemy.y+d.dy);
            const dist = Math.abs(x-gplayer.x)+Math.abs(y-gplayer.y);
            return dist > (b.dist||0) ? {...d,dist} : b;
          }, {dist:-1});
        } else {
          chosen = Math.random() < 0.65
            ? valid.reduce((b,d) => {
                const {x,y} = gWrap(enemy.x+d.dx, enemy.y+d.dy);
                const dist = Math.abs(x-gplayer.x)+Math.abs(y-gplayer.y);
                return dist < (b.dist??999) ? {...d,dist} : b;
              }, {dist:999})
            : valid[Math.floor(Math.random()*valid.length)];
        }
        enemy.dx = chosen.dx; enemy.dy = chosen.dy;
        const {x,y} = gWrap(enemy.x+enemy.dx, enemy.y+enemy.dy);
        enemy.x = x; enemy.y = y;
      }
    }
    if (enemy.x === gplayer.x && enemy.y === gplayer.y) {
      if (gplayer.powered) {
        enemy.x = 10; enemy.y = 9; enemy.scared = false;
        gscore += 300; updateGHUD(); gPlayEat();
      } else {
        glives--; updateGHUD(); gPlayDeath();
        gplayer.x = 10; gplayer.y = 7; gplayer.dx = 0; gplayer.dy = 0;
        if (glives <= 0) { gameRunning = false; gameOver = true; drawGame(); return; }
      }
    }
  });

  gplayer.sAngle += 0.05 * gplayer.sDir;
  if (gplayer.sAngle > 0.42 || gplayer.sAngle < 0.02) gplayer.sDir *= -1;
  drawGame();
  requestAnimationFrame(gameLoop);
}

// ---- DRAW ----
function drawGame() {
  gctx.fillStyle = GC.bg; gctx.fillRect(0, 0, gc.width, gc.height);
  // bg grid
  gctx.strokeStyle = 'rgba(0,80,150,0.07)'; gctx.lineWidth = 1;
  for (let x=0;x<gc.width;x+=CELL){gctx.beginPath();gctx.moveTo(x,0);gctx.lineTo(x,gc.height);gctx.stroke();}
  for (let y=0;y<gc.height;y+=CELL){gctx.beginPath();gctx.moveTo(0,y);gctx.lineTo(gc.width,y);gctx.stroke();}

  for (let row=0;row<ROWS;row++) {
    for (let col=0;col<COLS;col++) {
      const cell = gmap[row]?.[col];
      const px = col*CELL, py = row*CELL, cx = px+CELL/2, cy = py+CELL/2;
      if (cell === 1) {
        // Ściana DNA
        gctx.fillStyle = GC.wall; gctx.fillRect(px+2,py+2,CELL-4,CELL-4);
        gctx.strokeStyle = GC.wallBorder; gctx.lineWidth=1; gctx.strokeRect(px+2,py+2,CELL-4,CELL-4);
        gctx.fillStyle='#005588';
        [[px+4,py+4],[px+CELL-4,py+4],[px+4,py+CELL-4],[px+CELL-4,py+CELL-4]].forEach(([bx,by])=>{
          gctx.beginPath();gctx.arc(bx,by,2,0,Math.PI*2);gctx.fill();
        });
      } else if (cell===0||cell===4||cell===5||cell===6) {
        // Nukleotyd
        const col2 = NUC_COLOR[cell], lbl = NUC_LABEL[cell];
        gctx.shadowColor=col2; gctx.shadowBlur=8;
        gctx.beginPath(); gctx.arc(cx,cy,5,0,Math.PI*2);
        gctx.fillStyle=col2; gctx.fill(); gctx.shadowBlur=0;
        gctx.fillStyle='#020e1e'; gctx.font='bold 6px monospace';
        gctx.textAlign='center'; gctx.textBaseline='middle';
        gctx.fillText(lbl,cx,cy);
      } else if (cell===3) {
        // CRISPR power-up
        gctx.shadowColor=GC.crispr; gctx.shadowBlur=16;
        gctx.beginPath(); gctx.arc(cx,cy,9,0,Math.PI*2);
        gctx.strokeStyle=GC.crispr; gctx.lineWidth=2; gctx.stroke();
        gctx.fillStyle=GC.crispr; gctx.font='bold 11px sans-serif';
        gctx.textAlign='center'; gctx.textBaseline='middle';
        gctx.fillText('✂',cx,cy); gctx.shadowBlur=0;
      }
    }
  }

  // Wrogowie
  genemies.forEach(enemy => {
    const ex=enemy.x*CELL+CELL/2, ey=enemy.y*CELL+CELL/2;
    const col2 = enemy.scared ? GC.scared : enemy.color;
    gctx.shadowColor=col2; gctx.shadowBlur=12;
    if (!enemy.scared) {
      if (enemy.type==='virus') {
        gctx.beginPath(); gctx.arc(ex,ey,9,0,Math.PI*2);
        gctx.fillStyle=col2; gctx.fill();
        for(let i=0;i<8;i++){
          const a=(i/8)*Math.PI*2;
          gctx.beginPath(); gctx.moveTo(ex+Math.cos(a)*9,ey+Math.sin(a)*9);
          gctx.lineTo(ex+Math.cos(a)*13,ey+Math.sin(a)*13);
          gctx.strokeStyle=col2; gctx.lineWidth=2; gctx.stroke();
        }
      } else if (enemy.type==='bacteria') {
        gctx.beginPath(); gctx.ellipse(ex,ey,11,7,0,0,Math.PI*2);
        gctx.fillStyle=col2; gctx.fill();
        gctx.beginPath(); gctx.moveTo(ex+11,ey);
        gctx.bezierCurveTo(ex+16,ey-5,ex+18,ey+3,ex+14,ey+6);
        gctx.strokeStyle=col2; gctx.lineWidth=1.5; gctx.stroke();
      } else {
        gctx.beginPath();
        for(let i=0;i<6;i++){const a=(i/6)*Math.PI*2-Math.PI/6; i===0?gctx.moveTo(ex+Math.cos(a)*9,ey+Math.sin(a)*9):gctx.lineTo(ex+Math.cos(a)*9,ey+Math.sin(a)*9);}
        gctx.closePath(); gctx.fillStyle=col2; gctx.fill();
        for(let i=0;i<3;i++){const a=(i/3)*Math.PI*2+Math.PI/2; gctx.beginPath(); gctx.moveTo(ex+Math.cos(a)*9,ey+Math.sin(a)*9); gctx.lineTo(ex+Math.cos(a)*14,ey+Math.sin(a)*14); gctx.strokeStyle=col2; gctx.lineWidth=1.5; gctx.stroke();}
      }
      gctx.shadowBlur=0; gctx.fillStyle='#fff'; gctx.font='bold 6px Orbitron,monospace';
      gctx.textAlign='center'; gctx.textBaseline='middle'; gctx.fillText(enemy.label,ex,ey+1);
    } else {
      gctx.beginPath(); gctx.arc(ex,ey,9,0,Math.PI*2); gctx.fillStyle=GC.scared; gctx.fill();
      gctx.shadowBlur=0; gctx.fillStyle='#6688aa'; gctx.font='9px sans-serif';
      gctx.textAlign='center'; gctx.textBaseline='middle'; gctx.fillText('?',ex,ey);
    }
    gctx.shadowBlur=0;
  });

  // Gracz — enzym restrykcyjny (nożyczki)
  const px=gplayer.x*CELL+CELL/2, py=gplayer.y*CELL+CELL/2;
  const angle=Math.atan2(gplayer.dy,gplayer.dx)||0;
  const open=gplayer.sAngle*Math.PI;
  const pcol=gplayer.powered?GC.crispr:GC.player;
  gctx.shadowColor=pcol; gctx.shadowBlur=gplayer.powered?22:14;
  gctx.beginPath(); gctx.moveTo(px,py); gctx.arc(px,py,11,angle-open,angle); gctx.closePath();
  gctx.fillStyle=pcol; gctx.fill();
  gctx.beginPath(); gctx.moveTo(px,py); gctx.arc(px,py,11,angle,angle+open); gctx.closePath();
  gctx.fillStyle=pcol; gctx.fill();
  gctx.beginPath(); gctx.arc(px,py,3,0,Math.PI*2); gctx.fillStyle='#020e1e'; gctx.fill();
  gctx.shadowBlur=0;

  // Power bar
  if (gplayer.powered) {
    const bw=(powerTimer/7000)*gc.width;
    gctx.fillStyle='rgba(204,0,255,0.25)'; gctx.fillRect(0,gc.height-5,bw,5);
    gctx.fillStyle=GC.crispr; gctx.fillRect(0,gc.height-5,bw,2);
  }

  // Ekran startowy
  if (!gameRunning && !gameOver) {
    gctx.fillStyle='rgba(2,14,30,0.85)'; gctx.fillRect(0,0,gc.width,gc.height);
    gctx.textAlign='center'; gctx.textBaseline='middle';
    gctx.shadowColor=GC.text; gctx.shadowBlur=20;
    gctx.fillStyle=GC.text; gctx.font='bold 20px Orbitron,monospace';
    gctx.fillText('DNA-RUNNER',gc.width/2,gc.height/2-55);
    gctx.shadowBlur=0; gctx.font='10px Orbitron,monospace';
    gctx.fillStyle='rgba(0,200,255,0.8)';
    gctx.fillText('Jesteś enzymem restrykcyjnym — zbieraj nukleotydy!',gc.width/2,gc.height/2-28);
    const legend=[['A — Adenina',GC.A],['T — Tymina',GC.T],['G — Guanina',GC.G],['C — Cytozyna',GC.C]];
    legend.forEach(([lbl,c],i)=>{
      gctx.fillStyle=c; gctx.font='10px Orbitron,monospace';
      gctx.fillText(lbl, gc.width/2 + (i<2?-110:110), gc.height/2 - 6 + (i%2)*18);
    });
    gctx.fillStyle=GC.crispr; gctx.font='10px Orbitron,monospace';
    gctx.fillText('✂ CRISPR = moc — zniszcz patogeny GMO!',gc.width/2,gc.height/2+30);
    gctx.fillStyle='rgba(255,50,100,0.7)';
    gctx.fillText('Unikaj: GMO-wirusa  |  Bakterii  |  Bakteriofaga',gc.width/2,gc.height/2+50);
  }

  if (gameOver) {
    gctx.fillStyle='rgba(2,14,30,0.88)'; gctx.fillRect(0,0,gc.width,gc.height);
    gctx.textAlign='center'; gctx.textBaseline='middle';
    gctx.shadowColor=GC.virus; gctx.shadowBlur=20;
    gctx.fillStyle=GC.virus; gctx.font='bold 22px Orbitron,monospace';
    gctx.fillText('ENZYM ZNISZCZONY',gc.width/2,gc.height/2-22);
    gctx.shadowBlur=0; gctx.fillStyle=GC.text; gctx.font='13px Orbitron,monospace';
    gctx.fillText('WYNIK: '+gscore+' pkt',gc.width/2,gc.height/2+12);
    gctx.fillStyle='rgba(0,200,255,0.5)'; gctx.font='10px Orbitron,monospace';
    gctx.fillText('Naciśnij RESET lub SPACJA',gc.width/2,gc.height/2+36);
  }
}

function startGame() {
  unlockAudio();
  if (gameOver) initGame();
  gameRunning = true;
  gLastTime = performance.now();
  document.getElementById('startGameBtn').textContent = '⏸ PAUZA';
  requestAnimationFrame(ts => { gLastTime = ts; gameLoop(ts); });
}
function resetGame() {
  gameRunning = false;
  document.getElementById('startGameBtn').textContent = '▶ START GRY';
  initGame();
}

document.addEventListener('keydown', e => {
  const km = { ArrowUp:[0,-1],ArrowDown:[0,1],ArrowLeft:[-1,0],ArrowRight:[1,0],w:[0,-1],s:[0,1],a:[-1,0],d:[1,0],W:[0,-1],S:[0,1],A:[-1,0],D:[1,0] };
  const dir = km[e.key];
  if (dir) { gplayer.nextDx=dir[0]; gplayer.nextDy=dir[1]; e.preventDefault(); }
  if (e.key===' '||e.key==='Enter') {
    if (!gameRunning&&!gameOver) startGame();
    else if (gameRunning) { gameRunning=false; document.getElementById('startGameBtn').textContent='▶ START GRY'; }
    else if (gameOver) { initGame(); startGame(); }
  }
});

// Dźwięki gry
function gPlayDot() {
  try { const ac=getAudioCtx(),o=ac.createOscillator(),g=ac.createGain(); o.connect(g);g.connect(ac.destination); o.type='sine';o.frequency.value=660; g.gain.setValueAtTime(0.025,ac.currentTime);g.gain.exponentialRampToValueAtTime(0.001,ac.currentTime+0.06); o.start();o.stop(ac.currentTime+0.06); } catch(e){}
}
function gPlayCrispr() {
  try { const ac=getAudioCtx(),o=ac.createOscillator(),g=ac.createGain(); o.connect(g);g.connect(ac.destination); o.type='sine';o.frequency.setValueAtTime(200,ac.currentTime);o.frequency.exponentialRampToValueAtTime(1000,ac.currentTime+0.35); g.gain.setValueAtTime(0.09,ac.currentTime);g.gain.exponentialRampToValueAtTime(0.001,ac.currentTime+0.35); o.start();o.stop(ac.currentTime+0.35); } catch(e){}
}
function gPlayEat() {
  try { const ac=getAudioCtx(),o=ac.createOscillator(),g=ac.createGain(); o.connect(g);g.connect(ac.destination); o.type='sawtooth';o.frequency.setValueAtTime(700,ac.currentTime);o.frequency.exponentialRampToValueAtTime(150,ac.currentTime+0.25); g.gain.setValueAtTime(0.07,ac.currentTime);g.gain.exponentialRampToValueAtTime(0.001,ac.currentTime+0.25); o.start();o.stop(ac.currentTime+0.25); } catch(e){}
}
function gPlayDeath() {
  try { const ac=getAudioCtx(),o=ac.createOscillator(),g=ac.createGain(); o.connect(g);g.connect(ac.destination); o.type='sawtooth';o.frequency.setValueAtTime(440,ac.currentTime);o.frequency.exponentialRampToValueAtTime(40,ac.currentTime+0.7); g.gain.setValueAtTime(0.1,ac.currentTime);g.gain.exponentialRampToValueAtTime(0.001,ac.currentTime+0.7); o.start();o.stop(ac.currentTime+0.7); } catch(e){}
}

initGame();
document.getElementById('startGameBtn').addEventListener('click', startGame);
document.getElementById('resetGameBtn').addEventListener('click', resetGame);
