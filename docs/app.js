// TGCloud Interactive Scripts
// Developed for JOJIN JOHN

document.addEventListener('DOMContentLoaded', () => {
  // 1. Animated Particle Canvas
  initParticles();

  // 2. Interactive Transfer Simulator
  initSimulator();

  // 3. FAQ Accordion
  initAccordion();
});

// Particles Starfield / Network Effect
function initParticles() {
  const canvas = document.getElementById('bg-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let width = (canvas.width = window.innerWidth);
  let height = (canvas.height = window.innerHeight);

  window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  });

  const particleCount = Math.min(width > 768 ? 65 : 30, 80);
  const particles = [];

  for (let i = 0; i < particleCount; i++) {
    particles.push({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      radius: Math.random() * 1.8 + 0.6,
      alpha: Math.random() * 0.5 + 0.2,
    });
  }

  function render() {
    ctx.clearRect(0, 0, width, height);

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;

      if (p.x < 0) p.x = width;
      if (p.x > width) p.x = 0;
      if (p.y < 0) p.y = height;
      if (p.y > height) p.y = 0;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(44, 165, 224, ${p.alpha})`;
      ctx.fill();

      // Connect nearby particles
      for (let j = i + 1; j < particles.length; j++) {
        const p2 = particles[j];
        const dist = Math.hypot(p.x - p2.x, p.y - p2.y);
        if (dist < 120) {
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.strokeStyle = `rgba(44, 165, 224, ${0.15 * (1 - dist / 120)})`;
          ctx.lineWidth = 0.6;
          ctx.stroke();
        }
      }
    }

    requestAnimationFrame(render);
  }

  render();
}

// Transfer Telemetry Simulator
function initSimulator() {
  const btnUpload = document.getElementById('sim-start-upload');
  const btnDownload = document.getElementById('sim-start-download');
  const barFill = document.getElementById('sim-bar-fill');
  const fileNameEl = document.getElementById('sim-filename');
  const progressPercentEl = document.getElementById('sim-percent');
  const speedEl = document.getElementById('sim-speed');
  const transferredEl = document.getElementById('sim-transferred');
  const etaEl = document.getElementById('sim-eta');
  const chunksEl = document.getElementById('sim-chunks');

  if (!btnUpload || !barFill) return;

  let simInterval = null;

  function runSimulation(type) {
    if (simInterval) clearInterval(simInterval);

    const isUpload = type === 'upload';
    const totalSizeMB = isUpload ? 420.5 : 850.0;
    const fileName = isUpload ? 'production_backup_2026.tar.gz' : 'raw_video_footage.mp4';
    const totalChunks = Math.ceil((totalSizeMB * 1024) / 512);

    fileNameEl.textContent = `${isUpload ? '↑ Uploading' : '↓ Downloading'}: ${fileName}`;
    barFill.style.width = '0%';
    progressPercentEl.textContent = '0%';

    let currentMB = 0;
    const baseSpeed = isUpload ? 18.5 : 34.2;

    simInterval = setInterval(() => {
      // Add random jitter to speed
      const speedJitter = (Math.random() - 0.5) * 4;
      const currentSpeed = Math.max(12, baseSpeed + speedJitter);
      const deltaMB = (currentSpeed * 0.1);

      currentMB = Math.min(totalSizeMB, currentMB + deltaMB);
      const percent = Math.min(100, (currentMB / totalSizeMB) * 100);
      const remainingMB = Math.max(0, totalSizeMB - currentMB);
      const etaSeconds = Math.ceil(remainingMB / currentSpeed);
      const chunksProcessed = Math.min(totalChunks, Math.floor((currentMB * 1024) / 512));

      barFill.style.width = `${percent.toFixed(1)}%`;
      progressPercentEl.textContent = `${percent.toFixed(0)}%`;
      speedEl.textContent = `${currentSpeed.toFixed(1)} MB/s`;
      transferredEl.textContent = `${currentMB.toFixed(1)} / ${totalSizeMB.toFixed(1)} MB`;
      etaEl.textContent = etaSeconds > 0 ? `${etaSeconds}s` : 'Done';
      chunksEl.textContent = `${chunksProcessed} / ${totalChunks} (512 KB)`;

      if (currentMB >= totalSizeMB) {
        clearInterval(simInterval);
        simInterval = null;
        speedEl.textContent = '0.0 MB/s';
        etaEl.textContent = 'Complete';
      }
    }, 100);
  }

  btnUpload.addEventListener('click', () => runSimulation('upload'));
  btnDownload.addEventListener('click', () => runSimulation('download'));

  // Run initial upload simulation
  runSimulation('upload');
}

// Accordion Expand / Collapse
function initAccordion() {
  const items = document.querySelectorAll('.faq-item');
  items.forEach((item) => {
    const question = item.querySelector('.faq-question');
    question.addEventListener('click', () => {
      const isActive = item.classList.contains('active');
      items.forEach((i) => i.classList.remove('active'));
      if (!isActive) {
        item.classList.add('active');
      }
    });
  });
}
