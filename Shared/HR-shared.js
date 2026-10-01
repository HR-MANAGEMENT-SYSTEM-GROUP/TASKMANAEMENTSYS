document.addEventListener("DOMContentLoaded", () => {
    loadHRShared();
});

function loadHRShared() {
    loadHRSidebar();
    loadHRHeader();
}

function loadHRSidebar() {
    fetch("/Shared/HR-sidebar.html")
        .then(response => {
            if (!response.ok) throw new Error("HR Sidebar could not be loaded");
            return response.text();
        })
        .then(data => {
            const container = document.getElementById("hrSidebar");
            if (!container) return;
            container.innerHTML = data;
            setupSidebar();
        })
        .catch(error => console.error("HR Sidebar Error:", error));
}

function setupSidebar() {
    const sidebar = document.querySelector(".hr-sidebar");
    const toggle = document.getElementById("sidebarToggle");
    const logoutButton = document.getElementById("hrLogoutButton");

    if (toggle && sidebar) {
        toggle.addEventListener("click", () => {
            sidebar.classList.toggle("collapsed");
            document.body.classList.toggle("sidebar-collapsed");
        });
    }

    if (logoutButton) {
        logoutButton.addEventListener("click", logoutHR);
    }
}

function loadHRHeader() {
    const container = document.getElementById("hrHeader");
    if (!container) return;

    fetch("/Shared/HR-header.html")
        .then(response => {
            if (!response.ok) throw new Error("HR Header could not be loaded");
            return response.text();
        })
        .then(data => {
            container.innerHTML = data;
            loadHRUser();
            setupProfileMenu();
        })
        .catch(error => console.error("HR Header Error:", error));
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
