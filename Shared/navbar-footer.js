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
      <img src="${BASE_PATH}../../assets/masar-logo-dark.svg" alt="Masar" class="masar-logo-img logo-dark-bg" height="34" onerror="this.src='${BASE_PATH}../../Shared/masar-logo-dark.svg'">
      <img src="${BASE_PATH}../../assets/masar-logo.svg" alt="Masar" class="masar-logo-img logo-light-bg" height="34" onerror="this.src='${BASE_PATH}../../Shared/masar-logo.svg'">
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
        <a href="${BASE_PATH}../../NADA/home/home.html" aria-label="Masar — back to start" class="foot-logo-link">
          <img src="${BASE_PATH}../../assets/masar-logo-dark.svg" alt="Masar" class="foot-logo logo-dark-bg" height="34" onerror="this.src='${BASE_PATH}../../Shared/masar-logo-dark.svg'">
          <img src="${BASE_PATH}../../assets/masar-logo.svg" alt="Masar" class="foot-logo logo-light-bg" height="34" onerror="this.src='${BASE_PATH}../../Shared/masar-logo.svg'">
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

    function syncBody(dark) {
      if (document.body) {
        if (dark) {
          document.body.classList.add('dark-mode');
        } else {
          document.body.classList.remove('dark-mode');
        }
      }
    }

    function paint() {
      const dark = root.getAttribute('data-theme') === 'dark';
      syncBody(dark);
      if (btn) btn.setAttribute('aria-label', dark ? 'Switch to light theme' : 'Switch to dark theme');
      if (lab) lab.textContent = dark ? 'Light' : 'Dark';
    }

    const savedTheme = localStorage.getItem('theme') || localStorage.getItem('journey-theme');
    if (savedTheme === 'dark') {
      root.setAttribute('data-theme', 'dark');
      syncBody(true);
    } else {
      root.removeAttribute('data-theme');
      syncBody(false);
    }

    if (btn) {
      btn.addEventListener('click', function () {
        const dark = root.getAttribute('data-theme') !== 'dark';
        root.classList.add('theme-anim');
        setTimeout(() => root.classList.remove('theme-anim'), 450);

        if (dark) {
          root.setAttribute('data-theme', 'dark');
          syncBody(true);
          try {
            localStorage.setItem('journey-theme', 'dark');
            localStorage.setItem('theme', 'dark');
          } catch (e) {}
        } else {
          root.removeAttribute('data-theme');
          syncBody(false);
          try {
            localStorage.setItem('journey-theme', 'light');
            localStorage.setItem('theme', 'light');
          } catch (e) {}
        }
        paint();
      });
    }

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
    

    



    