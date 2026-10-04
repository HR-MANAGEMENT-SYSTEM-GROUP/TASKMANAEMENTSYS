/**
 * MASAR HR — Reusable Modular Navbar & Footer Component
 */
(function () {
    "use strict";

    const BASE_PATH = window.MASAR_BASE_PATH || "";

    // ================= NAVBAR =================
    const navbarHTML = `
    <header class="journey-header">
        <a href="${BASE_PATH}../../NADA/home/home.html" class="journey-logo" aria-label="Masar — home">
            <img src="${BASE_PATH}../../assets/masar-logo-dark.svg" alt="Masar" class="masar-logo-img logo-dark-bg" height="34" onerror="this.src='${BASE_PATH}../../Shared/masar-logo-dark.svg'">
            <img src="${BASE_PATH}../../assets/masar-logo.svg" alt="Masar" class="masar-logo-img logo-light-bg" height="34" onerror="this.src='${BASE_PATH}../../Shared/masar-logo.svg'">
        </a>

        <nav class="journey-nav-menu" aria-label="Main">
            <a href="${BASE_PATH}../../NADA/home/home.html" class="nav-menu-link">Home</a>
            <a href="${BASE_PATH}../../NADA/home/home.html" class="nav-menu-link">Services</a>
            <a href="${BASE_PATH}../../NADA/home/team.html" class="nav-menu-link">About us</a>
            <a href="#footer" class="nav-menu-link">Contact us</a>
        </nav>

        <div class="header-actions">

            <button type="button" class="theme-toggle" id="themeToggle" aria-label="Switch to dark theme" title="Switch theme">
                <svg class="ico-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"/>
                </svg>

                <svg class="ico-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <circle cx="12" cy="12" r="4"/>
                    <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>
                </svg>

                <span class="theme-label" id="themeLabel">Dark</span>
            </button>

            <div class="nav-auth" id="navAuth">
                <a href="${BASE_PATH}../../GAITH/login.html" class="header-btn">
                    Login <span aria-hidden="true">&rarr;</span>
                </a>
            </div>

            <div class="nav-auth hidden" id="navUser">
                <a href="${BASE_PATH}../../GAITH/profile/profile.html" class="nav-menu-link" id="userProfileLink" title="View Profile" style="text-transform: none; font-weight: 700;">
                    <span id="userName">Employee</span>
                </a>

                <button type="button" class="header-btn" onclick="logout()">Logout</button>
            </div>

        </div>
    </header>
    `;

    // ================= FOOTER =================
    const footerHTML = `
    <footer id="footer" class="journey-footer-container">
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
                        src="https://maps.google.com/maps?q=King%20Abdullah%20St,%20Amman,%20Jordan&amp;t=&amp;z=14&amp;ie=UTF8&amp;iwloc=&amp;output=embed">
                    </iframe>

                    <a href="https://maps.google.com/?q=King+Abdullah+St,+Amman,+Jordan" target="_blank" rel="noopener">
                        Open Maps &nearr;
                    </a>
                </div>
            </div>

        </div>

        <div class="foot-bottom">
            <span>&copy; <span id="yr">2026</span> Masar. All rights reserved.</span>

            <button type="button" class="link-btn" onclick="window.scrollTo({top:0, behavior:'smooth'})">
                &uarr; Back to top
            </button>
        </div>
    </footer>
    `;

    let currentUser = null;

    // ================= INJECT NAVBAR + FOOTER =================
    function injectComponents() {

        const navPlaceholder =
            document.getElementById("navbarContainer") ||
            document.getElementById("navbar-placeholder");

        const existingNavbar = document.querySelector(".journey-header");

        if (navPlaceholder) {
            navPlaceholder.innerHTML = navbarHTML;
        } else if (existingNavbar) {
            existingNavbar.outerHTML = navbarHTML;
        } else {
            document.body.insertAdjacentHTML("afterbegin", navbarHTML);
        }

        const footerPlaceholder =
            document.getElementById("footerContainer") ||
            document.getElementById("footer-placeholder");

        const existingFooter = document.querySelector(".journey-footer-container");

        if (footerPlaceholder) {
            footerPlaceholder.innerHTML = footerHTML;
        } else if (existingFooter) {
            existingFooter.outerHTML = footerHTML;
        } else {
            document.body.insertAdjacentHTML("beforeend", footerHTML);
        }

        const yearElement = document.getElementById("yr");

        if (yearElement) {
            yearElement.textContent = new Date().getFullYear();
        }
    }

    // ================= CURRENT USER =================
    function loadCurrentUser() {
        const savedUser = localStorage.getItem("currentUser");

        if (!savedUser) {
            currentUser = null;
            return;
        }

        try {
            currentUser = JSON.parse(savedUser);
        } catch (error) {
            console.error("Invalid currentUser:", error);
            localStorage.removeItem("currentUser");
            currentUser = null;
        }
    }

    function renderNavbar() {
        const navAuth = document.getElementById("navAuth");
        const navUser = document.getElementById("navUser");
        const userName = document.getElementById("userName");

        if (!navAuth || !navUser) return;

        const loggedIn = Boolean(currentUser);

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

        window.location.href = `${BASE_PATH}../../GAITH/login.html`;
    };

    // ================= THEME =================
    function initTheme() {
        const root = document.documentElement;
        const themeButton = document.getElementById("themeToggle");
        const themeLabel = document.getElementById("themeLabel");

        if (!themeButton) return;

        function updateThemeText() {
            const isDark = root.getAttribute("data-theme") === "dark";

            themeButton.setAttribute(
                "aria-label",
                isDark ? "Switch to light theme" : "Switch to dark theme"
            );

            if (themeLabel) {
                themeLabel.textContent = isDark ? "Light" : "Dark";
            }
        }

        themeButton.addEventListener("click", function () {
            const shouldBeDark = root.getAttribute("data-theme") !== "dark";

            root.classList.add("theme-anim");

            setTimeout(function () {
                root.classList.remove("theme-anim");
            }, 450);

            if (shouldBeDark) {
                root.setAttribute("data-theme", "dark");
                localStorage.setItem("journey-theme", "dark");
                localStorage.setItem("theme", "dark");
            } else {
                root.removeAttribute("data-theme");
                localStorage.setItem("journey-theme", "light");
                localStorage.setItem("theme", "light");
            }

            updateThemeText();
        });

        updateThemeText();
    }

    // ================= INIT =================
    function init() {
        injectComponents();
        loadCurrentUser();
        renderNavbar();
        initTheme();

        if ("scrollRestoration" in history) {
            history.scrollRestoration = "manual";
        }
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }

})();