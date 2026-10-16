// TGCloud Documentation & Showcase Interactive Controller
// Developed for JOJIN JOHN

document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize Lucide Vector Icons
  if (window.lucide) {
    window.lucide.createIcons();
  }

  // 2. Initialize Interactive Transfer Telemetry Engine
  initSimulator();

  // 3. Initialize FAQ Accordion
  initAccordion();
});

// Transfer Telemetry Simulator Engine
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
      // Natural speed jitter
      const speedJitter = (Math.random() - 0.5) * 3.5;
      const currentSpeed = Math.max(12, baseSpeed + speedJitter);
      const deltaMB = currentSpeed * 0.1;

      currentMB = Math.min(totalSizeMB, currentMB + deltaMB);
      const percent = Math.min(100, (currentMB / totalSizeMB) * 100);
      const remainingMB = Math.max(0, totalSizeMB - currentMB);
      const etaSeconds = Math.ceil(remainingMB / currentSpeed);
      const chunksProcessed = Math.min(totalChunks, Math.floor((currentMB * 1024) / 512));

      barFill.style.width = `${percent.toFixed(1)}%`;
      progressPercentEl.textContent = `${percent.toFixed(0)}%`;
      speedEl.textContent = `${currentSpeed.toFixed(1)} MB/s`;
      transferredEl.textContent = `${currentMB.toFixed(1)} / ${totalSizeMB.toFixed(1)} MB`;
      etaEl.textContent = etaSeconds > 0 ? `${etaSeconds}s` : 'Complete';
      chunksEl.textContent = `${chunksProcessed} / ${totalChunks} (512 KB)`;

      if (currentMB >= totalSizeMB) {
        clearInterval(simInterval);
        simInterval = null;
        speedEl.textContent = '0.0 MB/s';
        etaEl.textContent = 'Done';
      }
    }, 100);
  }

  btnUpload.addEventListener('click', () => runSimulation('upload'));
  btnDownload.addEventListener('click', () => runSimulation('download'));

  // Run initial preview simulation
  runSimulation('upload');
}

// FAQ Accordion
function initAccordion() {
  const cards = document.querySelectorAll('.faq-card');
  cards.forEach((card) => {
    const header = card.querySelector('.faq-header');
    if (!header) return;
    header.addEventListener('click', () => {
      const isActive = card.classList.contains('active');
      cards.forEach((c) => c.classList.remove('active'));
      if (!isActive) {
        card.classList.add('active');
      }
    });
  });
}
