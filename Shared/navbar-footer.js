/**
 * MASAR HR — Reusable Modular Navbar & Footer Component
 */
(function () {
  'use strict';

  const BASE_PATH = window.MASAR_BASE_PATH || '';

  // كود النافبار (تم استبدال كلمة Profile وجعل اسم المستخدم هو الزر الذي يوجه للبروفايل)
  const navbarHTML = `
  <header class="journey-header">
    <a href="${BASE_PATH}../../NADA/home/home.html" class="journey-logo" aria-label="Masar — home">
      <svg class="masar-lockup" viewBox="0 0 332.6 56" role="img" aria-label="Masar" focusable="false">
        <g transform="scale(0.875)">
          <rect class="ml-tile" width="64" height="64" rx="16"/>
          <g transform="translate(0 -2.4)">
            <path class="ml-m" d="M14 48V17L32 38L50 17V48" fill="none" stroke-width="6.6" stroke-linecap="round" stroke-linejoin="round"/>
            <circle class="ml-hollow" cx="14" cy="48" r="5" stroke="#0079F1" stroke-width="3"/>
            <circle cx="50" cy="48" r="7.6" fill="#0079F1"/>
            <circle cx="50" cy="48" r="2.7" fill="#fff"/>
          </g>
        </g>
        <g transform="translate(81.3 6)">
          <g class="ml-word" fill="none" stroke-width="6.6" stroke-linecap="round" stroke-linejoin="round">
            <path d="M0 44V0L21 27L42 0V44"/>
            <path transform="translate(56 0)" d="M0 44L21 0L42 44M6.2 31H35.8"/>
            <path transform="translate(112 0)" d="M30 9C27 3.4 22 0 16.4 0C8 0 2.6 4.6 2.6 11.2C2.6 18.6 9.4 20.8 16 22.4C23.4 24.2 30 26.4 30 33.4C30 40 24.4 44 16.2 44C9.6 44 4.2 41 1.4 35"/>
            <path transform="translate(158 0)" d="M0 44L21 0L42 44M6.2 31H35.8"/>
            <path transform="translate(214 0)" d="M0 44V0H18A12.5 12.5 0 0 1 18 25H0M17 25L33 44"/>
          </g>
        </g>
      </svg>
    </a>

    <nav class="journey-nav-menu" aria-label="Main">
      <a href="${BASE_PATH}../../NADA/home/home.html" class="nav-menu-link">Home</a>
      <a href="${BASE_PATH}../../NADA/home/home.html" class="nav-menu-link">About us</a>
      <a href="${BASE_PATH}../../NADA/home/home.html" class="nav-menu-link">Services</a>
      <a href="${BASE_PATH}../../NADA/home/team.html" class="nav-menu-link">Team</a>
      <a href="${BASE_PATH}../../NADA/home/home.html" class="nav-menu-link">Contact us</a>
    </nav>

    <div class="header-actions">
      <!-- زر تبديل الثيم -->
      <button type="button" class="theme-toggle" id="themeToggle" aria-label="Switch to dark theme" title="Switch theme">
        <svg class="ico-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"/>
        </svg>
        <svg class="ico-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>
        </svg>
        <span class="theme-label" id="themeLabel">Dark</span>
      </button>

      <!-- تظهر قبل تسجيل الدخول -->
      <div class="nav-auth" id="navAuth">
        <a href="${BASE_PATH}../../GAITH/login.html" class="header-btn">
          Login <span aria-hidden="true">&rarr;</span>
        </a>
      </div>

      <!-- تظهر بعد تسجيل الدخول: اسم المستخدم كرابط بروفايل -->
      <div class="nav-auth hidden" id="navUser">
        <a href="${BASE_PATH}../../GAITH/profile/profile.html" class="nav-menu-link" id="userProfileLink" title="View Profile" style="text-transform: none; font-weight: 700;">
          <span id="userName">Employee</span>
        </a>
        <button type="button" class="header-btn" onclick="logout()">Logout</button>
      </div>
    </div>
  </header>
  `;

  // كود الفوتر
  const footerHTML = `
  <footer class="journey-footer-container">
    <div class="foot-grid">
      <div>
        <a href="${BASE_PATH}../../NADA/home/home.html" aria-label="Masar — back to start">
          <img src="${BASE_PATH}../../Shared/MASAR.png" alt="Masar" class="foot-logo" onerror="this.style.display='none'">
        </a>
        <p>Empowering people and simplifying HR for modern teams.</p>
        <div class="socials">
          <a href="https://www.facebook.com/login" target="_blank">Facebook</a>
          <a href="https://www.instagram.com/accounts/login/" target="_blank">Instagram</a>
          <a href="https://x.com/i/flow/login" target="_blank">X</a>
        </div>
      </div>
      <div>
        <h3>Quick Links</h3>
        <ul class="plain">
          <li><a href="${BASE_PATH}../../NADA/home/home.html">Home</a></li>
          <li><a href="${BASE_PATH}../../NADA/home/home.html">About</a></li>
          <li><a href="${BASE_PATH}../../NADA/home/home.html">Services</a></li>
          <li><a href="${BASE_PATH}../../YAQEEN/companyPolicies/companyPolicies.html">Policies</a></li>
          <li><a href="${BASE_PATH}../../NADA/home/team.html" class="accent">Meet the Team &nearr;</a></li>
        </ul>
      </div>
      <div>
        <h3>Contact</h3>
        <ul class="plain">
          <li><a href="mailto:hr@company.com">hr@company.com</a></li>
          <li><a href="tel:+96265550123">+962 6 555 0123</a></li>
          <li>King Abdullah St, Amman</li>
          <li>Sun&ndash;Thu, 9:00&ndash;17:00</li>
        </ul>
      </div>
      <div>
        <h3>Find Us</h3>
        <div class="map">
          <iframe title="Office Location Map" loading="lazy" referrerpolicy="no-referrer-when-downgrade"
            src="https://maps.google.com/maps?q=King%20Abdullah%20St,%20Amman,%20Jordan&amp;t=&amp;z=14&amp;ie=UTF8&amp;iwloc=&amp;output=embed"></iframe>
          <a href="https://maps.google.com/?q=King+Abdullah+St,+Amman,+Jordan" target="_blank" rel="noopener">Open Maps &nearr;</a>
        </div>
      </div>
    </div>
    <div class="foot-bottom">
      <span>&copy; <span id="yr">2026</span> Masar. All rights reserved.</span>
      <button type="button" class="link-btn" onclick="window.scrollTo({top:0,behavior:'smooth'})">&uarr; Back to top</button>
    </div>
  </footer>
  `;

  function injectComponents() {
    const navPlaceholder = document.getElementById('navbar-placeholder');
    if (navPlaceholder) {
      navPlaceholder.innerHTML = navbarHTML;
    } else if (!document.querySelector('.journey-header')) {
      document.body.insertAdjacentHTML('afterbegin', navbarHTML);
    }

    const footPlaceholder = document.getElementById('footer-placeholder');
    if (footPlaceholder) {
      footPlaceholder.innerHTML = footerHTML;
    } else if (!document.querySelector('.journey-footer-container')) {
      document.body.insertAdjacentHTML('beforeend', footerHTML);
    }

    const yrEl = document.getElementById('yr');
    if (yrEl) yrEl.textContent = new Date().getFullYear();
  }

  let currentUser = null;

  function loadCurrentUser() {
    const savedUser = localStorage.getItem("currentUser");
    if (!savedUser) {
      currentUser = null;
      return;
    }
    try {
      currentUser = JSON.parse(savedUser);
    } catch (e) {
      console.error("Invalid currentUser:", e);
      localStorage.removeItem("currentUser");
      currentUser = null;
    }
  }

  function renderNavbar() {
    const navAuth = document.getElementById("navAuth");
    const navUser = document.getElementById("navUser");
    const userName = document.getElementById("userName");

    if (!navAuth || !navUser) return;

    const loggedIn = !!currentUser;

    navAuth.classList.toggle("hidden", loggedIn);
    navUser.classList.toggle("hidden", !loggedIn);

    if (loggedIn && userName) {
      userName.textContent = currentUser.name || "Employee";
    }
  }

  window.logout = function () {
    localStorage.removeItem("currentUser");
    localStorage.removeItem("userRole");
    localStorage.removeItem("bridgeway_current_role");
    localStorage.setItem("loggedIn", "false");
    window.location.reload();
  };

  function initTheme() {
    const root = document.documentElement;
    const btn = document.getElementById('themeToggle');
    const lab = document.getElementById('themeLabel');
    if (!btn) return;

    function paint() {
      const dark = root.getAttribute('data-theme') === 'dark';
      btn.setAttribute('aria-label', dark ? 'Switch to light theme' : 'Switch to dark theme');
      if (lab) lab.textContent = dark ? 'Light' : 'Dark';
    }

    btn.addEventListener('click', function () {
      const dark = root.getAttribute('data-theme') !== 'dark';
      root.classList.add('theme-anim');
      setTimeout(() => root.classList.remove('theme-anim'), 450);

      if (dark) {
        root.setAttribute('data-theme', 'dark');
        try { localStorage.setItem('journey-theme', 'dark'); } catch (e) {}
      } else {
        root.removeAttribute('data-theme');
        try { localStorage.setItem('journey-theme', 'light'); } catch (e) {}
      }
      paint();
    });

    paint();
  }

  function init() {
    injectComponents();
    loadCurrentUser();
    renderNavbar();
    initTheme();

    // منع المتصفح من إجبار السكرول على العودة للأعلى
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }

    // الانتقال المباشر للخدمات إذا كان الرابط يحتوي على jump=services
    if (window.location.search.indexOf('jump=services') !== -1) {
      window.addEventListener('load', function () {
        setTimeout(function () {
          goTo(2);
        }, 300);
      });
      // تشغيل احتياطي في حال كان حدث load قد انتهى بالفعل
      setTimeout(function () {
        goTo(2);
      }, 500);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

// قراءة السكشن من الرابط والانتقال إليه بسلاسة عند فتح الصفحة
    var params = new URLSearchParams(window.location.search);
    var sec = params.get('jump');
    if (sec === 'services') {
      setTimeout(function () { goTo(2); }, 200);
    } else if (sec === 'contact') {
      setTimeout(function () { goTo(4); }, 200);
    }
    

    



    