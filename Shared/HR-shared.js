document.addEventListener("DOMContentLoaded", () => {
    loadHRShared();
});

function loadHRShared() {
    loadHRSidebar();
    loadHRHeader();
}

function loadHRSidebar() {
    const container = document.getElementById("hrSidebar");
    if (!container) return;

    const possiblePaths = [
        "/Shared/HR-sidebar.html",
        "../../Shared/HR-sidebar.html",
        "../Shared/HR-sidebar.html",
        "Shared/HR-sidebar.html"
    ];

    function tryFetch(index) {
        if (index >= possiblePaths.length) {
            console.error("HR Sidebar could not be loaded from any known path");
            return;
        }
        fetch(possiblePaths[index])
            .then(response => {
                if (!response.ok) throw new Error("HTTP " + response.status);
                return response.text();
            })
            .then(data => {
                container.innerHTML = data;
                setupSidebar();
            })
            .catch(() => tryFetch(index + 1));
    }

    tryFetch(0);
}

function setupSidebar() {
    const sidebar = document.querySelector(".hr-sidebar");
    const toggle = document.getElementById("sidebarToggle");
    const logoutButton = document.getElementById("hrLogoutButton");
    const navLinks = document.querySelectorAll(".hr-sidebar .sidebar-link");

    if (toggle && sidebar) {
        toggle.addEventListener("click", () => {
            sidebar.classList.toggle("collapsed");
            document.body.classList.toggle("sidebar-collapsed");
        });
    }

    if (logoutButton) {
        logoutButton.addEventListener("click", logoutHR);
    }

    // Determine current active section from window location
    const currentPath = decodeURIComponent(window.location.pathname).toLowerCase().replace(/\\/g, "/");
    const currentFile = currentPath.split("/").pop() || "";
    let matchedLink = null;

    navLinks.forEach(link => {
        if (link.id === "hrLogoutButton" || link.tagName.toLowerCase() === "button") return;
        const href = (link.getAttribute("href") || "").trim();
        if (!href || href === "#" || href.startsWith("javascript:")) return;

        const cleanHref = decodeURIComponent(href).toLowerCase().replace(/\\/g, "/");
        const linkFile = cleanHref.split("/").pop().split("#")[0];

        // Check file match
        if (linkFile && currentFile && linkFile === currentFile) {
            if (cleanHref.includes("#") && !window.location.hash) {
                // Skip hash link if current URL has no hash
            } else if (!matchedLink) {
                matchedLink = link;
            }
        }
    });

    // Default to dashboard if on dashboard, home, or no other match found
    if (!matchedLink && (currentFile.includes("dashboard") || !currentFile || currentFile === "index.html")) {
        matchedLink = document.querySelector('.hr-sidebar .sidebar-nav a[href*="hrdashboard.html"]');
    }

    // Initialize: set active on matched link, clear all others
    navLinks.forEach(l => l.classList.remove("active"));
    if (matchedLink) {
        matchedLink.classList.add("active");
    }

    // Interactive click: when a section is selected, it turns blue and the one before goes back to normal
    navLinks.forEach(link => {
        if (link.id === "hrLogoutButton" || link.tagName.toLowerCase() === "button") return;

        link.addEventListener("click", function () {
            navLinks.forEach(l => l.classList.remove("active"));
            this.classList.add("active");
        });
    });
}

function loadHRHeader() {
    const container = document.getElementById("hrHeader");
    if (!container) return;

    const possiblePaths = [
        "/Shared/HR-header.html",
        "../../Shared/HR-header.html",
        "../Shared/HR-header.html",
        "Shared/HR-header.html"
    ];

    function tryFetch(index) {
        if (index >= possiblePaths.length) {
            console.error("HR Header could not be loaded from any known path");
            return;
        }
        fetch(possiblePaths[index])
            .then(response => {
                if (!response.ok) throw new Error("HTTP " + response.status);
                return response.text();
            })
            .then(data => {
                container.innerHTML = data;
                loadHRUser();
                setupProfileMenu();
            })
            .catch(() => tryFetch(index + 1));
    }

    tryFetch(0);
}

function loadHRUser() {
    const currentUser = JSON.parse(localStorage.getItem("currentUser"));
    if (!currentUser) return;
    const name = document.getElementById("hrUserName");
    const role = document.getElementById("hrUserRole");
    if (name) name.textContent = currentUser.name || "HR User";
    if (role) role.textContent = currentUser.role || "HR";
}

function setupProfileMenu() {
    const toggle = document.getElementById("hrProfileToggle");
    const dropdown = document.getElementById("hrProfileDropdown");
    const logout = document.getElementById("hrHeaderLogoutBtn");
    if (!toggle || !dropdown) return;

    toggle.addEventListener("click", event => {
        event.stopPropagation();
        dropdown.classList.toggle("show");
    });

    document.addEventListener("click", event => {
        if (!event.target.closest(".hr-profile-menu")) dropdown.classList.remove("show");
    });

    if (logout) logout.addEventListener("click", logoutHR);
}

function logoutHR() {
    if (!confirm("Are you sure you want to logout?")) return;
    localStorage.removeItem("currentUser");
    window.location.href = "/GAITH/login.html";
}
