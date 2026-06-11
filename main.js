/* ==========================================
   AYODHYA MOTION WEB EXPERIENCE - LOGIC
   ========================================== */

// Global image frame config
const totalFrames = 300;
const preloadedImages = [];
let imagesLoaded = 0;

document.addEventListener("DOMContentLoaded", () => {
  
  // 1. PRELOADER & SMOOTH SCROLL INIT
  initPreloader();
  initLenis();
  initSectionObserver();
  
  // 2. FRAME SEQUENCE PLAYER (SECTION 1)
  initFrameSequencer();
  
  // 3. 3D TILT PARALLAX CARD (SECTION 2)
  init3DCard();
  
  // 4. ARCHITECTURAL HOTSPOTS (SECTION 3)
  initHotspots();
  
  // 5. SARYU GHAT DIYA CANVAS (SECTION 4)
  initDiyaCanvas();
  
  // 6. SCRIPUTRE READER TABS (SECTION 5)
  initScriptureReader();
});

/* ==========================================
   1. PRELOADER & SMOOTH SCROLL
   ========================================== */
function initPreloader() {
  const preloader = document.getElementById("preloader");
  const progressBar = document.getElementById("preloader-progress");
  
  // Dynamically preload 300 frames in background
  for (let i = 1; i <= totalFrames; i++) {
    const img = new Image();
    const numStr = String(i).padStart(3, '0');
    img.src = `frames/ezgif-frame-${numStr}.jpg`;
    img.onload = onImageLoad;
    img.onerror = onImageLoad; // count errors to avoid getting stuck
    preloadedImages.push(img);
  }

  function onImageLoad() {
    imagesLoaded++;
    const progressPercent = Math.min(100, Math.floor((imagesLoaded / totalFrames) * 100));
    
    if (progressBar) {
      progressBar.style.width = `${progressPercent}%`;
    }
    
    if (imagesLoaded >= totalFrames) {
      revealPage();
    }
  }

  // Safety Timeout: Force reveal after 10 seconds if user has slow internet
  const forceRevealTimeout = setTimeout(() => {
    revealPage();
  }, 10000);

  let pageRevealed = false;
  function revealPage() {
    if (pageRevealed) return;
    pageRevealed = true;
    clearTimeout(forceRevealTimeout);
    
    if (preloader) {
      preloader.classList.add("fade-out");
    }
    triggerIntroAnimations();
  }
}

function triggerIntroAnimations() {
  if (typeof gsap !== 'undefined') {
    gsap.fromTo("#intro .spirit-sub", 
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 1.2, ease: "power3.out" }
    );
    gsap.fromTo("#intro .spirit-title", 
      { opacity: 0, y: 40 },
      { opacity: 1, y: 0, duration: 1.5, delay: 0.3, ease: "power3.out" }
    );
    gsap.fromTo("#intro .spirit-desc", 
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 1.2, delay: 0.6, ease: "power3.out" }
    );
    gsap.fromTo("#intro .scroll-indicator", 
      { opacity: 0 },
      { opacity: 1, duration: 1, delay: 1.2 }
    );
  } else {
    // GSAP CDN Fail Fallback: Show intro content immediately
    document.querySelectorAll("#intro .spirit-sub, #intro .spirit-title, #intro .spirit-desc, #intro .scroll-indicator").forEach(el => {
      el.style.opacity = "1";
      el.style.transform = "none";
    });
  }
}

// Global Lenis Instance
let lenisInstance = null;

function initLenis() {
  // Safe check if Lenis library was successfully loaded from CDN
  if (typeof Lenis === 'undefined') {
    console.warn("Lenis smooth scroll library not loaded. Falling back to native scrolling.");
    return;
  }

  try {
    // Initialize Lenis Smooth Scroll
    lenisInstance = new Lenis({
      duration: 1.4, // Kinetic inertia duration
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // Premium exponential ease
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1,
      smoothTouch: false, // Leave touch scrolling native but smooth
      infinite: false,
    });

    // Connect Lenis frame updates to RequestAnimationFrame
    function raf(time) {
      if (lenisInstance) lenisInstance.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    // Sync GSAP ScrollTrigger with Lenis scroll updates
    if (typeof ScrollTrigger !== 'undefined') {
      lenisInstance.on('scroll', ScrollTrigger.update);
    }

    if (typeof gsap !== 'undefined') {
      gsap.ticker.add((time) => {
        if (lenisInstance) lenisInstance.raf(time * 1000);
      });
      gsap.ticker.lagSmoothing(0);
    }
  } catch (error) {
    console.error("Failed to initialize Lenis:", error);
    lenisInstance = null;
  }
}

function initSectionObserver() {
  const sections = document.querySelectorAll(".scroll-section");
  const navLinks = document.querySelectorAll(".nav-link");
  const navDots = document.querySelectorAll(".dot-wrapper");

  // Fallback if IntersectionObserver is not supported on older browsers/devices
  if (typeof IntersectionObserver === 'undefined') {
    console.warn("IntersectionObserver not supported. Revealing all sections directly.");
    sections.forEach(s => s.classList.add("active", "active-scroll-view"));
    return;
  }

  const observerOptions = {
    root: null, // use browser viewport
    threshold: 0.15 // Trigger when at least 15% of section is visible (works reliably on mobile dynamic toolbars)
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const activeSectionId = entry.target.id;
        
        // Toggle active states on sections
        sections.forEach(s => s.classList.remove("active", "active-scroll-view"));
        entry.target.classList.add("active", "active-scroll-view");
        
        // Update header active links
        navLinks.forEach(link => {
          link.classList.remove("active");
          if (link.getAttribute("href") === `#${activeSectionId}`) {
            link.classList.add("active");
          }
        });
        
        // Update navigation dots active state
        navDots.forEach(dot => {
          dot.classList.remove("active");
          if (dot.getAttribute("data-target") === activeSectionId) {
            dot.classList.add("active");
          }
        });

        // Trigger animations for current section elements
        animateSectionContent(activeSectionId);
      }
    });
  }, observerOptions);

  sections.forEach(section => observer.observe(section));

  // Scroll smoothly using Lenis or native smooth fallback on dot click
  navDots.forEach(dot => {
    dot.addEventListener("click", () => {
      const targetId = dot.getAttribute("data-target");
      const targetSection = document.getElementById(targetId);
      if (lenisInstance && targetSection) {
        lenisInstance.scrollTo(targetSection);
      } else if (targetSection) {
        targetSection.scrollIntoView({ behavior: "smooth" });
      }
    });
  });

  // Scroll smoothly using Lenis or native smooth fallback on nav link click
  navLinks.forEach(link => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const targetId = link.getAttribute("href").substring(1);
      const targetSection = document.getElementById(targetId);
      if (lenisInstance && targetSection) {
        lenisInstance.scrollTo(targetSection);
      } else if (targetSection) {
        targetSection.scrollIntoView({ behavior: "smooth" });
      }
    });
  });
}

function animateSectionContent(sectionId) {
  if (typeof gsap === 'undefined') {
    // GSAP Fail Fallback: Instantly display content items
    if (sectionId === "temple-3d") {
      document.querySelectorAll("#temple-3d .animate-left, #temple-3d .animate-right").forEach(el => {
        el.style.opacity = "1";
        el.style.transform = "none";
      });
    } else if (sectionId === "temple-details") {
      document.querySelectorAll("#temple-details .animate-left, #temple-details .animate-right, .hotspot-marker").forEach(el => {
        el.style.opacity = "1";
        el.style.transform = "none";
      });
    } else if (sectionId === "saryu-ghat") {
      document.querySelectorAll("#saryu-ghat .animate-text").forEach(el => {
        el.style.opacity = "1";
        el.style.transform = "none";
      });
    } else if (sectionId === "scriptures") {
      document.querySelectorAll("#scriptures .scripture-header, #scriptures .scripture-container").forEach(el => {
        el.style.opacity = "1";
        el.style.transform = "none";
      });
    }
    return;
  }

  // Standard GSAP Animations
  if (sectionId === "temple-3d") {
    gsap.fromTo("#temple-3d .animate-left", 
      { opacity: 0, x: -60 },
      { opacity: 1, x: 0, duration: 1.2, ease: "power3.out", overwrite: "auto" }
    );
    gsap.fromTo("#temple-3d .animate-right", 
      { opacity: 0, x: 60, scale: 0.95 },
      { opacity: 1, x: 0, scale: 1, duration: 1.2, delay: 0.2, ease: "power3.out", overwrite: "auto" }
    );
  } else if (sectionId === "temple-details") {
    gsap.fromTo("#temple-details .animate-left", 
      { opacity: 0, x: -60 },
      { opacity: 1, x: 0, duration: 1.2, ease: "power3.out", overwrite: "auto" }
    );
    gsap.fromTo("#temple-details .animate-right", 
      { opacity: 0, scale: 0.9 },
      { opacity: 1, scale: 1, duration: 1.4, delay: 0.2, ease: "power4.out", overwrite: "auto" }
    );
    gsap.fromTo(".hotspot-marker", 
      { opacity: 0, scale: 0 },
      { opacity: 1, scale: 1, duration: 0.8, delay: 0.8, stagger: 0.15, ease: "back.out(1.7)", overwrite: "auto" }
    );
  } else if (sectionId === "saryu-ghat") {
    gsap.fromTo("#saryu-ghat .animate-text", 
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 1, stagger: 0.2, ease: "power3.out", overwrite: "auto" }
    );
  } else if (sectionId === "scriptures") {
    gsap.fromTo("#scriptures .scripture-header", 
      { opacity: 0, y: -40 },
      { opacity: 1, y: 0, duration: 1.2, ease: "power3.out", overwrite: "auto" }
    );
    gsap.fromTo("#scriptures .scripture-container", 
      { opacity: 0, y: 40 },
      { opacity: 1, y: 0, duration: 1.2, delay: 0.3, ease: "power3.out", overwrite: "auto" }
    );
  }
}

/* ==========================================
   2. FRAME SEQUENCE PLAYER (SECTION 1)
   ========================================== */
function initFrameSequencer() {
  const canvas = document.getElementById("intro-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  
  let currentFrameIndex = 0;

  function resizeCanvas() {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    drawFrame(currentFrameIndex);
  }

  function drawFrame(index) {
    const img = preloadedImages[index];
    if (img && img.complete && img.naturalWidth !== 0) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const imgRatio = img.width / img.height;
      const canvasRatio = canvas.width / canvas.height;
      let sx, sy, sWidth, sHeight;

      if (imgRatio > canvasRatio) {
        sHeight = img.height;
        sWidth = img.height * canvasRatio;
        sy = 0;
        sx = (img.width - sWidth) / 2;
      } else {
        sWidth = img.width;
        sHeight = img.width / canvasRatio;
        sx = 0;
        sy = (img.height - sHeight) / 2;
      }

      ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, canvas.width, canvas.height);
      currentFrameIndex = index;
    }
  }

  window.addEventListener("resize", resizeCanvas);
  resizeCanvas();

  // Smooth continuous auto-play loop playing at ~30 FPS (33ms per frame)
  setInterval(() => {
    let nextFrame = (currentFrameIndex + 1) % totalFrames;
    drawFrame(nextFrame);
  }, 33); // Butter-smooth 30fps play rate!
}

/* ==========================================
   3. 3D TILT PARALLAX CARD (SECTION 2)
   ========================================== */
function init3DCard() {
  const trigger = document.getElementById("3d-card-trigger");
  const card = document.getElementById("temple-card");
  const bgLayer = card.querySelector(".card-layer.background");
  
  if (!trigger || !card) return;

  trigger.addEventListener("mousemove", (e) => {
    const rect = trigger.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const normX = (x / rect.width) - 0.5;
    const normY = (y / rect.height) - 0.5;
    
    const maxRotateX = 15;
    const maxRotateY = 15;
    
    const rotateX = normY * -maxRotateX;
    const rotateY = normX * maxRotateY;
    
    card.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    
    const moveX = normX * -30;
    const moveY = normY * -30;
    bgLayer.style.transform = `translate3d(${moveX}px, ${moveY}px, -30px) scale(1.15)`;
  });

  trigger.addEventListener("mouseleave", () => {
    card.style.transform = "rotateX(0deg) rotateY(0deg)";
    bgLayer.style.transform = "translate3d(0, 0, -30px) scale(1.15)";
    
    card.style.transition = "transform 0.5s ease-out";
    bgLayer.style.transition = "transform 0.5s ease-out";
    
    setTimeout(() => {
      card.style.transition = "";
      bgLayer.style.transition = "";
    }, 500);
  });
  
  trigger.addEventListener("mouseenter", () => {
    card.style.transition = "";
    bgLayer.style.transition = "";
  });
}

/* ==========================================
   4. ARCHITECTURAL HOTSPOTS (SECTION 3)
   ========================================== */
function initHotspots() {
  const hotspots = document.querySelectorAll(".hotspot-marker");
  const drawer = document.getElementById("details-drawer");
  const placeholder = drawer.querySelector(".drawer-placeholder");
  const drawerContent = document.getElementById("drawer-main-content");
  
  const drawerTitle = document.getElementById("drawer-title");
  const drawerDesc = document.getElementById("drawer-description");
  const specVal1 = document.getElementById("spec-val-1");
  const specVal2 = document.getElementById("spec-val-2");
  const specLabel1 = document.getElementById("spec-label-1");
  const specLabel2 = document.getElementById("spec-label-2");

  const hotspotData = {
    shikhar: {
      title: "The Shikhar (Sovereign Spire)",
      desc: "The main temple spire rises to a towering height of 161 feet. Designed in the traditional Nagara style, it features beautiful curvilinear carvings leading to the Kalash and Dhwaja (flag) at the peak, representing spiritual ascent.",
      spec1: { label: "Height", val: "161 Feet" },
      spec2: { label: "Style", val: "Nagara Architecture" }
    },
    garbhagriha: {
      title: "Garbhagriha (Sanctum Sanctorum)",
      desc: "The heart of the temple is designed as an octagonal chamber. It houses the beautiful idol of Ram Lalla (the child form of Lord Rama). The design ensures that the first rays of the sun illuminate the deity on Ram Navami.",
      spec1: { label: "Shape", val: "Octagonal Chamber" },
      spec2: { label: "Deity", val: "Ram Lalla (Child Rama)" }
    },
    mandapas: {
      title: "The Five Mandapas (Halls)",
      desc: "The temple features five distinct assembly halls: Nritya Mandap (Dance Hall), Rang Mandap (Celebration Hall), Sabha Mandap (Assembly Hall), Prarthana Mandap (Prayer Hall), and Kirtan Mandap (Singing Hall). Each hall is supported by intricately carved pillars depicting deities.",
      spec1: { label: "Halls", val: "5 Assembly Mandapas" },
      spec2: { label: "Pillars", val: "392 Stone Pillars" }
    },
    entrance: {
      title: "Simha Dwar (Lion Gate)",
      desc: "The main entrance to the temple is on the eastern side. Visitors ascend 32 steps (Sopan) through the Simha Dwar. It is adorned with statues of lions, elephants, and Hanuman, symbolizing strength, wisdom, and devotion.",
      spec1: { label: "Steps", val: "32 Steps (Eastern Sopan)" },
      spec2: { label: "Guardians", val: "Lions, Elephants, Hanuman" }
    }
  };

  hotspots.forEach(hotspot => {
    hotspot.addEventListener("click", () => {
      const targetId = hotspot.getAttribute("data-id");
      const data = hotspotData[targetId];
      
      if (!data) return;

      hotspots.forEach(h => h.classList.remove("active"));
      hotspot.classList.add("active");
      
      if (typeof gsap !== 'undefined') {
        gsap.to(drawerContent, { opacity: 0, y: 10, duration: 0.2, onComplete: () => {
          placeholder.classList.add("hidden");
          drawerContent.classList.remove("hidden");
          drawer.classList.add("active");

          drawerTitle.innerText = data.title;
          drawerDesc.innerText = data.desc;
          specLabel1.innerText = `${data.spec1.label}:`;
          specVal1.innerText = data.spec1.val;
          specLabel2.innerText = `${data.spec2.label}:`;
          specVal2.innerText = data.spec2.val;

          gsap.to(drawerContent, { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" });
        }});
      } else {
        // GSAP CDN Fail Fallback
        placeholder.classList.add("hidden");
        drawerContent.classList.remove("hidden");
        drawer.classList.add("active");
        drawerTitle.innerText = data.title;
        drawerDesc.innerText = data.desc;
        specLabel1.innerText = `${data.spec1.label}:`;
        specVal1.innerText = data.spec1.val;
        specLabel2.innerText = `${data.spec2.label}:`;
        specVal2.innerText = data.spec2.val;
        drawerContent.style.opacity = "1";
      }
    });
  });
}

/* ==========================================
   5. SARYU GHAT DIYA CANVAS (SECTION 4)
   ========================================== */
function initDiyaCanvas() {
  const canvas = document.getElementById("diya-canvas");
  const ctx = canvas.getContext("2d");
  const container = document.getElementById("saryu-ghat");
  
  if (!canvas) return;

  function resizeCanvas() {
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
  }
  
  resizeCanvas();
  window.addEventListener("resize", resizeCanvas);

  const particles = [];
  const maxParticles = 120;
  
  const mouse = {
    x: undefined,
    y: undefined,
    radius: 180
  };

  container.addEventListener("mousemove", (e) => {
    const rect = container.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
    
    if (Math.random() < 0.6) {
      spawnDiya(mouse.x, mouse.y);
    }
  });

  container.addEventListener("mouseleave", () => {
    mouse.x = undefined;
    mouse.y = undefined;
  });

  container.addEventListener("click", (e) => {
    const rect = container.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    
    for (let i = 0; i < 15; i++) {
      spawnDiya(mx + (Math.random() * 40 - 20), my + (Math.random() * 40 - 20));
    }
  });

  class DiyaParticle {
    constructor(x, y) {
      this.x = x;
      this.y = y;
      this.radius = Math.random() * 4 + 2;
      this.haloRadius = this.radius * (Math.random() * 4 + 6);
      this.vx = (Math.random() * 0.4 - 0.2); 
      this.vy = -(Math.random() * 0.6 + 0.3);
      this.maxLife = Math.random() * 200 + 100;
      this.life = this.maxLife;
      this.opacity = 1;
      this.flickerSpeed = Math.random() * 0.1 + 0.05;
      this.flickerVal = Math.random() * Math.PI;
      this.hue = Math.floor(Math.random() * 15) + 30;
    }

    update() {
      this.x += this.vx;
      this.y += this.vy;
      
      if (mouse.x !== undefined && mouse.y !== undefined) {
        const dx = mouse.x - this.x;
        const dy = mouse.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < mouse.radius) {
          const force = (mouse.radius - distance) / mouse.radius;
          const attractionX = (dx / distance) * force * 0.4;
          const attractionY = (dy / distance) * force * 0.4;
          this.vx += attractionX;
          this.vy += attractionY;
        }
      }

      this.life--;
      this.opacity = this.life / this.maxLife;
      this.flickerVal += this.flickerSpeed;
    }

    draw() {
      ctx.save();
      const flickerFactor = 0.85 + Math.sin(this.flickerVal) * 0.15;
      const currentHalo = this.haloRadius * flickerFactor * this.opacity;
      
      const glowGrad = ctx.createRadialGradient(this.x, this.y, 1, this.x, this.y, currentHalo);
      glowGrad.addColorStop(0, `hsla(${this.hue}, 100%, 60%, ${this.opacity * 0.4})`);
      glowGrad.addColorStop(0.3, `hsla(${this.hue - 10}, 100%, 50%, ${this.opacity * 0.15})`);
      glowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      
      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(this.x, this.y, currentHalo, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius * this.opacity, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 240, 200, ${this.opacity})`;
      ctx.shadowBlur = 10;
      ctx.shadowColor = `hsla(${this.hue}, 100%, 55%, 1)`;
      ctx.fill();

      ctx.restore();
    }
  }

  function spawnDiya(x, y) {
    if (particles.length < maxParticles) {
      particles.push(new DiyaParticle(x, y));
    }
  }

  function initFloatingPool() {
    for (let i = 0; i < 40; i++) {
      const rx = Math.random() * canvas.width;
      const ry = canvas.height * 0.5 + Math.random() * (canvas.height * 0.5);
      const diya = new DiyaParticle(rx, ry);
      diya.life = Math.random() * diya.maxLife;
      particles.push(diya);
    }
  }

  initFloatingPool();

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    particles.forEach((p, idx) => {
      p.update();
      p.draw();
      
      if (p.life <= 0 || p.y < -50 || p.x < -50 || p.x > canvas.width + 50) {
        particles.splice(idx, 1);
        
        if (particles.length < 50) {
          const rx = Math.random() * canvas.width;
          const ry = canvas.height + 10;
          particles.push(new DiyaParticle(rx, ry));
        }
      }
    });

    requestAnimationFrame(animate);
  }

  animate();
}

/* ==========================================
   6. HOLY SCRIPTURES TAB SWITCHER (SECTION 5)
   ========================================== */
function initScriptureReader() {
  const tabs = document.querySelectorAll(".tab-btn");
  const card = document.getElementById("scripture-card");
  
  const shlokSanskrit = document.getElementById("shlok-sanskrit");
  const shlokHindi = document.getElementById("shlok-hindi");
  const shlokEnglish = document.getElementById("shlok-english");
  const shlokRef = document.getElementById("shlok-ref");

  const versesData = [
    {
      sanskrit: "मङ्गल भवन अमङ्गल हारी।<br>द्रवउ सो दसरथ अजिर बिहारी॥",
      hindi: "जो मंगल करने वाले और अमंडल (कष्टों) को दूर करने वाले हैं, वे श्री दशरथ नंदन श्री राम मेरे ऊपर कृपा करें।",
      english: "May that home of auspiciousness and remover of inauspiciousness, Lord Rama (who plays in the courtyard of Dasharatha), shower His grace upon me.",
      ref: "— बालकाण्ड, श्रीरामचरितमानस"
    },
    {
      sanskrit: "राम धीरज धरम धुरंधर।<br>बंदन योग्य जनक सुत सुंदर॥",
      hindi: "श्री राम धैर्य और धर्म के श्रेष्ठ धारक हैं, और माता सीता (जनक नंदिनी) के प्रियतम हैं, जो वन्दनीय और सुंदर हैं।",
      english: "Lord Rama is the champion of patience and righteousness, beloved of Sita, the daughter of Janaka. He is beautiful and worthy of worship.",
      ref: "— अरण्यकाण्ड, श्रीरामचरितमानस"
    },
    {
      sanskrit: "यदा यदा हि धर्मस्य ग्लानिर्भवति भारत।<br>अभ्युत्थानमधर्मस्य तदात्मानं सृजाम्यहम्॥",
      hindi: "जब-जब धर्म की हानि और अधर्म का उत्थान होता है, तब-तब मैं अपने रूप की रचना करता हूँ (अवतार लेता हूँ)।",
      english: "Whenever righteousness declines and unrighteousness raises its head, O Arjuna, I manifest Myself on earth.",
      ref: "— श्रीमद्भगवद्गीता (४.७)"
    },
    {
      sanskrit: "रामो विग्रहवान् धर्मः साधुः सत्यपराक्रमः।<br>राजा सर्वस्य लोकस्य रामः प्रियकरो नृणाम्॥",
      hindi: "श्री राम साक्षात धर्म के स्वरूप हैं, वे सज्जन, सत्य-पराक्रमी और संपूर्ण लोकों के राजा हैं, जो सभी मनुष्यों के प्रिय हैं।",
      english: "Lord Rama is the personification of righteousness (Dharma), a saintly figure of truthful valour. He is the king of the entire world and beloved of all people.",
      ref: "— वाल्मीकि रामायण (१.१.२)"
    }
  ];

  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      const targetIndex = parseInt(tab.getAttribute("data-verse"));
      const data = versesData[targetIndex];

      if (tab.classList.contains("active") || !data) return;

      tabs.forEach(t => t.classList.remove("active"));
      tab.classList.add("active");

      card.classList.add("flip-page");

      setTimeout(() => {
        shlokSanskrit.innerHTML = data.sanskrit;
        shlokHindi.innerText = data.hindi;
        shlokEnglish.innerText = data.english;
        shlokRef.innerText = data.ref;
        
        card.classList.remove("flip-page");
      }, 300);
    });
  });
}
