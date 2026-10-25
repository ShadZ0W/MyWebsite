// --- 1. Interactive Starfield / Constellation Background ---
const canvas = document.getElementById('ambientCanvas');
if (canvas) {
  const ctx = canvas.getContext('2d');
  let width, height;
  let particles = [];
  const particleCount = 45;
  const mouse = { x: -1000, y: -1000, radius: 140 };

  function resizeCanvas() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  class Particle {
    constructor() {
      this.x = Math.random() * width;
      this.y = Math.random() * height;
      this.vx = (Math.random() - 0.5) * 0.45;
      this.vy = (Math.random() - 0.5) * 0.45;
      this.radius = Math.random() * 1.5 + 1;
      this.alpha = Math.random() * 0.5 + 0.2;
    }

    update() {
      this.x += this.vx;
      this.y += this.vy;

      if (this.x < 0) this.x = width;
      if (this.x > width) this.x = 0;
      if (this.y < 0) this.y = height;
      if (this.y > height) this.y = 0;

      const dx = mouse.x - this.x;
      const dy = mouse.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < mouse.radius) {
        const force = (mouse.radius - dist) / mouse.radius;
        this.x -= (dx / dist) * force * 1.5;
        this.y -= (dy / dist) * force * 1.5;
      }
    }

    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(56, 189, 248, ${this.alpha})`;
      ctx.fill();
    }
  }

  for (let i = 0; i < particleCount; i++) {
    particles.push(new Particle());
  }

  window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  });

  window.addEventListener('mouseleave', () => {
    mouse.x = -1000;
    mouse.y = -1000;
  });

  function animateCanvas() {
    ctx.clearRect(0, 0, width, height);

    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 130) {
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          // Fixed syntax error here:
          ctx.strokeStyle = `rgba(56, 189, 248, ${0.15 * (1 - dist / 130)})`;
          ctx.lineWidth = 0.8;
          ctx.stroke();
        }
      }
    }

    particles.forEach((p) => {
      p.update();
      p.draw();
    });

    requestAnimationFrame(animateCanvas);
  }
  animateCanvas();
}

// --- 2. Scroll Ruler (Safely Guarded) ---
const rulerTicksContainer = document.getElementById('rulerTicks');
const totalTicks = 32;

if (rulerTicksContainer) {
  rulerTicksContainer.innerHTML = '';
  for (let i = 0; i <= totalTicks; i++) {
    const tick = document.createElement('div');
    tick.classList.add('tick');
    if (i % 4 === 0) tick.classList.add('major');
    rulerTicksContainer.appendChild(tick);
  }
}

const ticks = document.querySelectorAll('.tick');
const rulerIndicator = document.getElementById('rulerIndicator');
const rulerReadout = document.getElementById('rulerReadout');
const checkpointBadge = document.getElementById('rulerCheckpoint');
const checkpointText = document.getElementById('checkpointText');
const zoomElements = document.querySelectorAll('.zoom-target');
const sections = document.querySelectorAll('[data-section]');

// --- 3. Dynamic Cursor Spotlight on Project Rows ---
document.querySelectorAll('.project-row').forEach((row) => {
  row.addEventListener('mousemove', (e) => {
    const rect = row.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    row.style.background = `
      radial-gradient(650px circle at ${x}px ${y}px, rgba(56, 189, 248, 0.16), transparent 75%),
      rgba(13, 17, 25, 0.75)
    `;
  });

  row.addEventListener('mouseleave', () => {
    row.style.background = 'rgba(13, 17, 25, 0.75)';
  });
});

// --- 4. Scroll Physics (Safe for All Pages) ---
function handleScroll() {
  const scrollTop = window.scrollY || document.documentElement.scrollTop;
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  const scrollFraction = docHeight > 0 ? scrollTop / docHeight : 0;
  const scrollPercent = Math.min(Math.max(scrollFraction, 0), 1);
  // Update Quick-Jump Dock Active State
  const jumpCurrent = document.getElementById('jumpCurrent');
  const jumpPrevious = document.getElementById('jumpPrevious');
  const prevSec = document.getElementById('previous-projects');

  if (jumpCurrent && jumpPrevious && prevSec) {
    const prevRect = prevSec.getBoundingClientRect();
    if (prevRect.top <= window.innerHeight * 0.4) {
      jumpPrevious.classList.add('active');
      jumpCurrent.classList.remove('active');
    } else {
      jumpCurrent.classList.add('active');
      jumpPrevious.classList.remove('active');
    }
  }

  // Update ruler elements only if they exist on the current page
  if (rulerIndicator && rulerReadout) {
    const hue = 195 + Math.sin(scrollPercent * Math.PI) * 70;
    const activeColor = `hsl(${hue}, 95%, 62%)`;
    document.documentElement.style.setProperty('--ruler-color', activeColor);

    // Fixed missing multiplication operators:
    rulerIndicator.style.height = `${scrollPercent * 100}%`;
    rulerReadout.textContent = `${Math.round(scrollPercent * 100)}%`;

    if (checkpointBadge) {
      checkpointBadge.style.top = `${scrollPercent * 100}%`;
    }

    if (ticks.length > 0) {
      const activeTickIndex = Math.round(scrollPercent * totalTicks);
      ticks.forEach((tick, idx) => {
        tick.classList.toggle('active', idx === activeTickIndex);
      });
    }
  }

  // Section Checkpoint Detection
  if (checkpointText && sections.length > 0) {
    const viewportCenter = window.innerHeight / 2;
    let activeSectionName = 'PORTFOLIO';
    sections.forEach((sec) => {
      const rect = sec.getBoundingClientRect();
      if (rect.top <= viewportCenter && rect.bottom >= viewportCenter) {
        activeSectionName = sec.getAttribute('data-section') || 'PORTFOLIO';
      }
    });
    checkpointText.textContent = activeSectionName;
  }

  // Camera Zoom & Opacity Interpolation for Zoom Targets
  const viewportCenter = window.innerHeight / 2;
  zoomElements.forEach((el) => {
    const rect = el.getBoundingClientRect();
    const elementCenter = rect.top + rect.height / 2;

    const distance = Math.abs(viewportCenter - elementCenter);
    const maxDistance = window.innerHeight * 0.75;
    const progress = Math.min(distance / maxDistance, 1);

    const scale = 1 - progress * 0.08;
    const opacity = 1 - progress * 0.45;

    el.style.transform = `scale(${scale.toFixed(3)})`;
    el.style.opacity = opacity.toFixed(2);
  });
}

let ticking = false;
window.addEventListener('scroll', () => {
  if (!ticking) {
    window.requestAnimationFrame(() => {
      handleScroll();
      ticking = false;
    });
    ticking = true;
  }
});

// Run once immediately on page load
handleScroll();

// --- 5. Image Carousel Slideshow (Works across index.html and projects.html) ---
function initCarousels() {
  document.querySelectorAll('[data-carousel]').forEach((carouselWrapper) => {
    const slides = carouselWrapper.querySelectorAll('.carousel-slide');
    const dotsContainer = carouselWrapper.querySelector('.carousel-dots');

    if (slides.length <= 1) return;

    if (dotsContainer) {
      dotsContainer.innerHTML = '';
      slides.forEach((_, idx) => {
        const dot = document.createElement('div');
        dot.classList.add('carousel-dot');
        if (idx === 0) dot.classList.add('active');
        dotsContainer.appendChild(dot);
      });
    }

    const dots = dotsContainer ? dotsContainer.querySelectorAll('.carousel-dot') : [];
    let currentIndex = 0;

    setInterval(() => {
      slides[currentIndex].classList.remove('active');
      if (dots[currentIndex]) dots[currentIndex].classList.remove('active');

      currentIndex = (currentIndex + 1) % slides.length;

      slides[currentIndex].classList.add('active');
      if (dots[currentIndex]) dots[currentIndex].classList.add('active');
    }, 3500);
  });
}

// Initialize slideshow carousels on page load
initCarousels();

// --- 6. Quick Copy Email Feature ---
const copyBtn = document.getElementById('copyEmailBtn');
const emailText = document.getElementById('emailText');
const copyBtnText = document.getElementById('copyBtnText');

if (copyBtn && emailText) {
  copyBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(emailText.textContent.trim()).then(() => {
      if (copyBtnText) copyBtnText.textContent = 'Copied!';
      copyBtn.style.borderColor = 'var(--cyan-core)';
      setTimeout(() => {
        if (copyBtnText) copyBtnText.textContent = 'Copy';
        copyBtn.style.borderColor = 'rgba(255, 255, 255, 0.1)';
      }, 2000);
    });
  });
}

// --- 7. Zoomable & Pannable Resume Lightbox ---
const lightbox = document.getElementById('resumeLightbox');
const lightboxImg = document.getElementById('lightboxImg');
const lightboxContent = document.getElementById('lightboxContent');
const lightboxViewport = document.getElementById('lightboxViewport');
const lightboxClose = document.getElementById('lightboxCloseBtn');
const zoomInBtn = document.getElementById('zoomInBtn');
const zoomOutBtn = document.getElementById('zoomOutBtn');
const zoomResetBtn = document.getElementById('zoomResetBtn');
const zoomLevelText = document.getElementById('zoomLevelText');
const triggers = document.querySelectorAll('.lightbox-trigger, .resume-page-frame');

if (lightbox && lightboxImg && lightboxContent && lightboxViewport) {
  let scale = 1;
  let posX = 0;
  let posY = 0;
  let isDragging = false;
  let startX = 0;
  let startY = 0;

  const minScale = 0.8;
  const maxScale = 3.5;

  function updateTransform() {
    lightboxContent.style.transform = `translate3d(${posX}px, ${posY}px, 0px) scale(${scale})`;
    if (zoomLevelText) {
      // Fixed missing multiplication operator:
      zoomLevelText.textContent = `${Math.round(scale * 100)}%`;
    }
  }

  function resetZoom() {
    scale = 1;
    posX = 0;
    posY = 0;
    updateTransform();
  }

  function setZoom(newScale) {
    scale = Math.min(Math.max(newScale, minScale), maxScale);
    updateTransform();
  }

  const openLightbox = (src, alt) => {
    lightboxImg.src = src;
    lightboxImg.alt = alt || 'Enlarged Resume Preview';
    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
    resetZoom();
  };

  const closeLightbox = () => {
    lightbox.classList.remove('active');
    document.body.style.overflow = '';
    resetZoom();
  };

  triggers.forEach((trigger) => {
    trigger.addEventListener('click', () => {
      const img = trigger.tagName === 'IMG' ? trigger : trigger.querySelector('img');
      if (img) openLightbox(img.src, img.alt);
    });
  });

  if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);

  // Close when clicking background outside viewport/toolbar
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox || e.target === lightboxViewport) {
      closeLightbox();
    }
  });

  // Zoom Buttons
  if (zoomInBtn) zoomInBtn.addEventListener('click', () => setZoom(scale + 0.3));
  if (zoomOutBtn) zoomOutBtn.addEventListener('click', () => setZoom(scale - 0.3));
  if (zoomResetBtn) zoomResetBtn.addEventListener('click', resetZoom);

  // Mousewheel Zooming
  lightboxViewport.addEventListener('wheel', (e) => {
    e.preventDefault();
    const zoomDelta = e.deltaY < 0 ? 0.2 : -0.2;
    setZoom(scale + zoomDelta);
  }, { passive: false });

  // Double Click: Toggle between 100% and 200% zoom
  lightboxViewport.addEventListener('dblclick', (e) => {
    if (e.target.closest('#lightboxToolbar') || e.target === lightboxClose) return;
    if (scale > 1.1) {
      resetZoom();
    } else {
      setZoom(2.0);
    }
  });

  // Drag to Pan
  lightboxViewport.addEventListener('mousedown', (e) => {
    if (e.target.closest('#lightboxToolbar') || e.target === lightboxClose) return;
    isDragging = true;
    startX = e.clientX - posX;
    startY = e.clientY - posY;
    lightboxViewport.classList.add('is-dragging');
  });

  window.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    posX = e.clientX - startX;
    posY = e.clientY - startY;
    updateTransform();
  });

  window.addEventListener('mouseup', () => {
    if (isDragging) {
      isDragging = false;
      lightboxViewport.classList.remove('is-dragging');
    }
  });

  // Close on Escape Key
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && lightbox.classList.contains('active')) {
      closeLightbox();
    }
  });
}