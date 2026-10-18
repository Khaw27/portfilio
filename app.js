/**
 * Miya.Portfolio - Interactive Application Logic
 * Personal Portfolio for Ruangkhaw Boonyalekha (ICT, SPU)
 */

(function () {
  'use strict';

  // --- Global Application State & References ---
  const state = {
    currentSlide: 0,
    totalSlides: 5,
    soundEnabled: true,
    isPresentationMode: false,
    defaultAvatarSrc: 'assets/avatar.png',
    currentLang: localStorage.getItem('miya_portfolio_lang') || 'th',
    currentTheme: localStorage.getItem('miya_portfolio_theme') || 'light',
  };

  // DOM Elements
  const slidesContainer = document.getElementById('slidesContainer');
  const slideSections = Array.from(document.querySelectorAll('.slide-section'));
  const navLinks = Array.from(document.querySelectorAll('.nav-link'));
  const mobileNavLinks = Array.from(document.querySelectorAll('.mobile-nav-link'));
  const dotBtns = Array.from(document.querySelectorAll('.dot-btn'));
  const progressBar = document.getElementById('progressBar');
  const slideCounter = document.getElementById('slideCounter');
  const prevSlideBtn = document.getElementById('prevSlideBtn');
  const nextSlideBtn = document.getElementById('nextSlideBtn');
  const soundToggle = document.getElementById('soundToggle');
  const fullscreenToggle = document.getElementById('fullscreenToggle');
  const hamburgerBtn = document.getElementById('hamburgerBtn');
  const mobileNav = document.getElementById('mobileNav');

  // Language & Theme Elements
  const langToggle = document.getElementById('langToggle');
  const langBadgeTh = document.getElementById('langBadgeTh');
  const langBadgeEn = document.getElementById('langBadgeEn');
  const mobileLangBtn = document.getElementById('mobileLangBtn');
  const themeToggle = document.getElementById('themeToggle');
  const mobileThemeBtn = document.getElementById('mobileThemeBtn');

  // Avatar Elements
  const avatarImage = document.getElementById('avatarImage');
  const avatarRing = document.querySelector('.avatar-ring');
  const avatarUploadBtn = document.getElementById('avatarUploadBtn');
  const avatarFileInput = document.getElementById('avatarFileInput');
  const avatarActionsBar = document.getElementById('avatarActionsBar');
  const resetAvatarBtn = document.getElementById('resetAvatarBtn');

  // Contact & Toast Elements
  const copyEmailBtn = document.getElementById('copyEmailBtn');
  const copyPhoneBtn = document.getElementById('copyPhoneBtn');
  const toastNotification = document.getElementById('toastNotification');
  const toastMessage = document.getElementById('toastMessage');

  // =========================================================================
  // Web Audio API Synthesizer (Cute Soft Bubble/Chime Sound)
  // =========================================================================
  let audioCtx = null;

  function initAudio() {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        audioCtx = new AudioContext();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  function playSoftChime(type = 'bubble') {
    if (!state.soundEnabled) return;
    try {
      initAudio();
      if (!audioCtx) return;

      const now = audioCtx.currentTime;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      if (type === 'bubble') {
        // Soft pastel pop
        osc.type = 'sine';
        osc.frequency.setValueAtTime(520, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.12);

        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

        osc.start(now);
        osc.stop(now + 0.15);
      } else if (type === 'success') {
        // High sparkle chime
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(659.25, now); // E5
        osc.frequency.setValueAtTime(880, now + 0.08); // A5
        osc.frequency.setValueAtTime(1046.5, now + 0.16); // C6

        gain.gain.setValueAtTime(0.09, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

        osc.start(now);
        osc.stop(now + 0.35);
      }
    } catch (e) {
      console.warn('Audio synthesis issue:', e);
    }
  }

  // =========================================================================
  // Slide Navigation & Scroll Snap Synchronization
  // =========================================================================
  function goToSlide(index) {
    if (index < 0 || index >= state.totalSlides) return;
    state.currentSlide = index;

    const targetSection = slideSections[index];
    if (targetSection) {
      targetSection.scrollIntoView({ behavior: 'smooth' });
    }
    updateSlideUI(index);
    playSoftChime('bubble');
  }

  function updateSlideUI(index) {
    // 1. Progress Bar
    const percent = ((index + 1) / state.totalSlides) * 100;
    if (progressBar) {
      progressBar.style.width = `${percent}%`;
      progressBar.setAttribute('aria-valuenow', index + 1);
    }

    // 2. Slide Counter (e.g. 01 / 05)
    if (slideCounter) {
      const currentFormatted = String(index + 1).padStart(2, '0');
      const totalFormatted = String(state.totalSlides).padStart(2, '0');
      slideCounter.innerHTML = `<span class="current-slide">${currentFormatted}</span><span class="counter-sep">/</span><span class="total-slides">${totalFormatted}</span>`;
    }

    // 3. Desktop Nav Links
    navLinks.forEach((link, idx) => {
      if (idx === index) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });

    // 4. Mobile Nav Links
    mobileNavLinks.forEach((link, idx) => {
      if (idx === index) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });

    // 5. Sidebar Dots
    dotBtns.forEach((dot, idx) => {
      if (idx === index) {
        dot.classList.add('active');
      } else {
        dot.classList.remove('active');
      }
    });
  }

  // Set up IntersectionObserver to sync slide state during scroll
  function setupScrollObserver() {
    const observerOptions = {
      root: slidesContainer,
      threshold: 0.55, // Slide is considered active when 55% visible
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const index = parseInt(entry.target.getAttribute('data-slide-index'), 10);
          if (!isNaN(index) && index !== state.currentSlide) {
            state.currentSlide = index;
            updateSlideUI(index);
          }
        }
      });
    }, observerOptions);

    slideSections.forEach((section) => observer.observe(section));
  }

  // Keyboard navigation
  function setupKeyboardControls() {
    window.addEventListener('keydown', (e) => {
      // Ignore if user is inside an input
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;

      if (e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' ' || e.key === 'ArrowRight') {
        if (state.currentSlide < state.totalSlides - 1) {
          e.preventDefault();
          goToSlide(state.currentSlide + 1);
        }
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp' || e.key === 'ArrowLeft') {
        if (state.currentSlide > 0) {
          e.preventDefault();
          goToSlide(state.currentSlide - 1);
        }
      } else if (e.key === 'Home') {
        e.preventDefault();
        goToSlide(0);
      } else if (e.key === 'End') {
        e.preventDefault();
        goToSlide(state.totalSlides - 1);
      }
    });
  }

  // =========================================================================
  // Editable Profile Avatar (File Upload + LocalStorage Persistence)
  // =========================================================================
  const STORAGE_KEY_AVATAR = 'miya_portfolio_avatar_custom';

  function initAvatarSystem() {
    // Check if custom avatar exists in localStorage
    const savedAvatar = localStorage.getItem(STORAGE_KEY_AVATAR);
    if (savedAvatar) {
      avatarImage.src = savedAvatar;
      if (avatarActionsBar) avatarActionsBar.style.display = 'flex';
    }

    // Trigger upload from ring click or badge click
    function openFilePicker() {
      if (avatarFileInput) avatarFileInput.click();
    }

    if (avatarRing) {
      avatarRing.addEventListener('click', openFilePicker);
    }
    if (avatarUploadBtn) {
      avatarUploadBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        openFilePicker();
      });
    }

    // Handle file selection
    if (avatarFileInput) {
      avatarFileInput.addEventListener('change', (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;

        // Verify image type
        if (!file.type.startsWith('image/')) {
          showToast('กรุณาเลือกไฟล์รูปภาพที่ถูกต้องค่ะ (JPG, PNG, GIF, WebP)');
          return;
        }

        const reader = new FileReader();
        reader.onload = function (event) {
          const result = event.target.result;
          avatarImage.src = result;
          try {
            localStorage.setItem(STORAGE_KEY_AVATAR, result);
          } catch (storageError) {
            console.warn('LocalStorage quota limit reached, previewing without caching:', storageError);
          }

          if (avatarActionsBar) avatarActionsBar.style.display = 'flex';
          showToast('✨ เปลี่ยนรูปโปรไฟล์เรียบร้อยแล้วค่ะ!');
          playSoftChime('success');
        };
        reader.readAsDataURL(file);
      });
    }

    // Handle Reset Avatar
    if (resetAvatarBtn) {
      resetAvatarBtn.addEventListener('click', () => {
        avatarImage.src = state.defaultAvatarSrc;
        localStorage.removeItem(STORAGE_KEY_AVATAR);
        if (avatarActionsBar) avatarActionsBar.style.display = 'none';
        if (avatarFileInput) avatarFileInput.value = '';
        showToast('คืนค่ารูปโปรไฟล์เริ่มต้นแล้ว ✨');
        playSoftChime('bubble');
      });
    }
  }

  // =========================================================================
  // Toast Notification System
  // =========================================================================
  let toastTimeout = null;

  function showToast(message) {
    if (!toastNotification || !toastMessage) return;

    toastMessage.textContent = message;
    toastNotification.classList.add('show');

    if (toastTimeout) clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
      toastNotification.classList.remove('show');
    }, 3200);
  }

  // =========================================================================
  // Clipboard Copy Actions
  // =========================================================================
  function copyToClipboard(text, successMsg) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        showToast(successMsg);
        playSoftChime('success');
      }).catch(() => {
        fallbackCopyText(text, successMsg);
      });
    } else {
      fallbackCopyText(text, successMsg);
    }
  }

  function fallbackCopyText(text, successMsg) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
      showToast(successMsg);
      playSoftChime('success');
    } catch (err) {
      showToast('คัดลอกข้อความ: ' + text);
    }
    document.body.removeChild(textArea);
  }

  function setupContactActions() {
    if (copyEmailBtn) {
      copyEmailBtn.addEventListener('click', () => {
        const dict = window.portfolioTranslations && window.portfolioTranslations[state.currentLang];
        const msg = dict && dict['toast.copied_email'] ? dict['toast.copied_email'] : '✨ คัดลอกอีเมลเรียบร้อยแล้ว (khaw272004@gmail.com)';
        copyToClipboard('khaw272004@gmail.com', msg);
      });
    }

    if (copyPhoneBtn) {
      copyPhoneBtn.addEventListener('click', () => {
        const dict = window.portfolioTranslations && window.portfolioTranslations[state.currentLang];
        const msg = dict && dict['toast.copied_phone'] ? dict['toast.copied_phone'] : '✨ คัดลอกเบอร์โทรศัพท์เรียบร้อยแล้ว (061-559-7669)';
        copyToClipboard('061-559-7669', msg);
      });
    }
  }

  // =========================================================================
  // Multi-Language (i18n) System
  // =========================================================================
  function setLanguage(lang) {
    state.currentLang = lang;
    try {
      localStorage.setItem('miya_portfolio_lang', lang);
    } catch (e) {}

    const dict = window.portfolioTranslations && window.portfolioTranslations[lang];
    if (!dict) return;

    // Update textContent for elements with data-i18n
    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = el.getAttribute('data-i18n');
      if (dict[key]) {
        el.textContent = dict[key];
      }
    });

    // Update innerHTML for elements with data-i18n-html
    document.querySelectorAll('[data-i18n-html]').forEach((el) => {
      const key = el.getAttribute('data-i18n-html');
      if (dict[key]) {
        el.innerHTML = dict[key];
      }
    });

    // Update HTML lang attribute
    document.documentElement.lang = lang;

    // Update toggle badges
    if (langBadgeTh && langBadgeEn) {
      if (lang === 'th') {
        langBadgeTh.classList.add('active');
        langBadgeEn.classList.remove('active');
      } else {
        langBadgeEn.classList.add('active');
        langBadgeTh.classList.remove('active');
      }
    }

    // Update mobile lang button
    if (mobileLangBtn) {
      mobileLangBtn.textContent = lang === 'th' ? '🌐 Language: English' : '🌐 ภาษา: ไทย';
    }

    // Update header tooltips
    if (soundToggle) {
      soundToggle.setAttribute('title', lang === 'th' ? 'เสียงเอฟเฟกต์คลิก' : 'Click Sound Effect');
    }
    if (fullscreenToggle) {
      fullscreenToggle.setAttribute('title', lang === 'th' ? 'โหมดนำเสนอเต็มหน้าจอ' : 'Fullscreen Presentation');
    }
    if (themeToggle) {
      themeToggle.setAttribute('title', state.currentTheme === 'dark' 
        ? (lang === 'th' ? 'เปลี่ยนเป็นโหมดสว่าง' : 'Switch to Light Mode')
        : (lang === 'th' ? 'เปลี่ยนเป็นโหมดมืด' : 'Switch to Dark Mode')
      );
    }
  }

  function toggleLanguage() {
    const nextLang = state.currentLang === 'th' ? 'en' : 'th';
    setLanguage(nextLang);
    const dict = window.portfolioTranslations && window.portfolioTranslations[nextLang];
    const msg = dict && dict['toast.lang_switched'] ? dict['toast.lang_switched'] : `Language switched to ${nextLang.toUpperCase()}`;
    showToast(msg);
    playSoftChime('bubble');
  }

  // =========================================================================
  // Dark / Light Theme System
  // =========================================================================
  function setTheme(theme) {
    state.currentTheme = theme;
    try {
      localStorage.setItem('miya_portfolio_theme', theme);
    } catch (e) {}

    document.documentElement.setAttribute('data-theme', theme);

    if (themeToggle) {
      const moonIcon = themeToggle.querySelector('.moon-icon');
      const sunIcon = themeToggle.querySelector('.sun-icon');
      if (theme === 'dark') {
        if (moonIcon) moonIcon.style.display = 'none';
        if (sunIcon) sunIcon.style.display = 'block';
        themeToggle.setAttribute('title', state.currentLang === 'th' ? 'เปลี่ยนเป็นโหมดสว่าง' : 'Switch to Light Mode');
      } else {
        if (moonIcon) moonIcon.style.display = 'block';
        if (sunIcon) sunIcon.style.display = 'none';
        themeToggle.setAttribute('title', state.currentLang === 'th' ? 'เปลี่ยนเป็นโหมดมืด' : 'Switch to Dark Mode');
      }
    }

    if (mobileThemeBtn) {
      if (theme === 'dark') {
        mobileThemeBtn.textContent = state.currentLang === 'th' ? '☀️ โหมดสว่าง' : '☀️ Light Mode';
      } else {
        mobileThemeBtn.textContent = state.currentLang === 'th' ? '🌙 โหมดมืด' : '🌙 Dark Mode';
      }
    }
  }

  function toggleTheme() {
    const nextTheme = state.currentTheme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    const dict = window.portfolioTranslations && window.portfolioTranslations[state.currentLang];
    const msgKey = nextTheme === 'dark' ? 'toast.theme_dark' : 'toast.theme_light';
    const msg = dict && dict[msgKey] ? dict[msgKey] : (nextTheme === 'dark' ? '🌙 Dark Mode' : '☀️ Light Mode');
    showToast(msg);
    playSoftChime('bubble');
  }

  // =========================================================================
  // Sound & Fullscreen Controls
  // =========================================================================
  function setupHeaderControls() {
    // Language Switcher Button (Desktop & Mobile)
    if (langToggle) {
      langToggle.addEventListener('click', toggleLanguage);
    }
    if (mobileLangBtn) {
      mobileLangBtn.addEventListener('click', () => {
        toggleLanguage();
        if (mobileNav) mobileNav.classList.remove('open');
      });
    }

    // Theme Mode Toggle (Desktop & Mobile)
    if (themeToggle) {
      themeToggle.addEventListener('click', toggleTheme);
    }
    if (mobileThemeBtn) {
      mobileThemeBtn.addEventListener('click', () => {
        toggleTheme();
        if (mobileNav) mobileNav.classList.remove('open');
      });
    }

    // Sound Toggle
    if (soundToggle) {
      soundToggle.addEventListener('click', () => {
        state.soundEnabled = !state.soundEnabled;
        const soundOnIcon = soundToggle.querySelector('.sound-on-icon');
        const soundOffIcon = soundToggle.querySelector('.sound-off-icon');

        if (state.soundEnabled) {
          soundOnIcon.style.display = 'block';
          soundOffIcon.style.display = 'none';
          soundToggle.setAttribute('title', state.currentLang === 'th' ? 'ปิดเสียงเอฟเฟกต์' : 'Mute Sound');
          playSoftChime('bubble');
          showToast(state.currentLang === 'th' ? '🔔 เปิดเสียงเอฟเฟกต์แล้ว' : '🔔 Sound effects enabled');
        } else {
          soundOnIcon.style.display = 'none';
          soundOffIcon.style.display = 'block';
          soundToggle.setAttribute('title', state.currentLang === 'th' ? 'เปิดเสียงเอฟเฟกต์' : 'Unmute Sound');
          showToast(state.currentLang === 'th' ? '🔕 ปิดเสียงเอฟเฟกต์แล้ว' : '🔕 Sound effects muted');
        }
      });
    }

    // Fullscreen Toggle
    if (fullscreenToggle) {
      fullscreenToggle.addEventListener('click', () => {
        const expandIcon = fullscreenToggle.querySelector('.expand-icon');
        const contractIcon = fullscreenToggle.querySelector('.contract-icon');

        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().then(() => {
            expandIcon.style.display = 'none';
            contractIcon.style.display = 'block';
            showToast(state.currentLang === 'th' ? '🖥️ เข้าสู่โหมดนำเสนอเต็มหน้าจอ' : '🖥️ Entered Fullscreen Mode');
            playSoftChime('bubble');
          }).catch((err) => {
            console.warn('Fullscreen error:', err);
          });
        } else {
          if (document.exitFullscreen) {
            document.exitFullscreen().then(() => {
              expandIcon.style.display = 'block';
              contractIcon.style.display = 'none';
            });
          }
        }
      });
    }

    // Mobile Hamburger Menu
    if (hamburgerBtn && mobileNav) {
      hamburgerBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        mobileNav.classList.toggle('open');
        playSoftChime('bubble');
      });

      // Close mobile menu on outside click
      document.addEventListener('click', (e) => {
        if (!mobileNav.contains(e.target) && !hamburgerBtn.contains(e.target)) {
          mobileNav.classList.remove('open');
        }
      });
    }
  }

  // =========================================================================
  // Link Click Events & Sidebar Buttons
  // =========================================================================
  function setupNavigationEvents() {
    // Desktop Nav Click
    navLinks.forEach((link) => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const slideIdx = parseInt(link.getAttribute('data-slide'), 10);
        goToSlide(slideIdx);
      });
    });

    // Mobile Nav Click
    mobileNavLinks.forEach((link) => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const slideIdx = parseInt(link.getAttribute('data-slide'), 10);
        goToSlide(slideIdx);
        if (mobileNav) mobileNav.classList.remove('open');
      });
    });

    // Sidebar Dot Click
    dotBtns.forEach((dot) => {
      dot.addEventListener('click', () => {
        const slideIdx = parseInt(dot.getAttribute('data-slide'), 10);
        goToSlide(slideIdx);
      });
    });

    // Sidebar Arrow Buttons
    if (prevSlideBtn) {
      prevSlideBtn.addEventListener('click', () => {
        if (state.currentSlide > 0) {
          goToSlide(state.currentSlide - 1);
        } else {
          goToSlide(state.totalSlides - 1);
        }
      });
    }

    if (nextSlideBtn) {
      nextSlideBtn.addEventListener('click', () => {
        if (state.currentSlide < state.totalSlides - 1) {
          goToSlide(state.currentSlide + 1);
        } else {
          goToSlide(0);
        }
      });
    }
  }

  // =========================================================================
  // Initialize App on DOM Ready
  // =========================================================================
  document.addEventListener('DOMContentLoaded', () => {
    // Initialize Theme & Language First
    setTheme(state.currentTheme);
    setLanguage(state.currentLang);

    setupScrollObserver();
    setupKeyboardControls();
    initAvatarSystem();
    setupContactActions();
    setupHeaderControls();
    setupNavigationEvents();
    updateSlideUI(0);

    // Expose methods to global scope
    window.portfolioApp = {
      goToSlide: goToSlide,
      showToast: showToast,
      setLanguage: setLanguage,
      toggleLanguage: toggleLanguage,
      setTheme: setTheme,
      toggleTheme: toggleTheme,
    };

    console.log('✨ Miya.Portfolio loaded successfully with Pastel Design System, i18n & Dark Mode!');
  });
})();
