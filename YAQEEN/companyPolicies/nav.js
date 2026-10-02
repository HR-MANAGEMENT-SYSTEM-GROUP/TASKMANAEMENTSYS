/* =========================================
   MASAR NAVBAR + FOOTER JS
   Put this at the end of each page JS file
========================================= */

document.addEventListener("DOMContentLoaded", function () {

    // ==============================
    // CURRENT USER
    // ==============================

    const currentUser =
        JSON.parse(
            localStorage.getItem("currentUser")
        );


    // ==============================
    // PROFILE NAME + IMAGE
    // ==============================

    const profileName =
        document.getElementById("navbarProfileName");

    const profileImage =
        document.getElementById("navbarProfileImage");


    if (currentUser) {

        if (profileName) {

            profileName.textContent =
                currentUser.name || "User";

        }


        if (
            profileImage &&
            currentUser.profilePicture
        ) {

            /*
                If profilePicture is:
                images/employeeM.jpg

                This will become:
                /GAITH/images/employeeM.jpg
            */

            if (
                currentUser.profilePicture.startsWith("/") ||
                currentUser.profilePicture.startsWith("http")
            ) {

                profileImage.src =
                    currentUser.profilePicture;

            } else {

                profileImage.src =
                    "/GAITH/" + currentUser.profilePicture;

            }

        }

    } else {

        if (profileName) {

            profileName.textContent =
                "Guest";

        }

    }


    // ==============================
    // DARK MODE
    // ==============================

    const darkModeBtn =
        document.getElementById("darkModeBtn");


    if (
        localStorage.getItem("theme") === "dark"
    ) {

        document.body.classList.add("dark-mode");

    }


    if (darkModeBtn) {

        darkModeBtn.addEventListener("click", function () {

            document.body.classList.toggle("dark-mode");


            const isDark =
                document.body.classList.contains("dark-mode");


            localStorage.setItem(
                "theme",
                isDark ? "dark" : "light"
            );

        });

    }


    // ==============================
    // LOGOUT
    // ==============================

    const logoutBtn =
        document.getElementById("logoutBtn");


    if (logoutBtn) {

        logoutBtn.addEventListener("click", function () {

            localStorage.removeItem("currentUser");
            localStorage.removeItem("userRole");
            localStorage.removeItem("bridgeway_current_role");

            window.location.href =
                "/GAITH/login.html";

        });

    }


    // ==============================
    // FOOTER YEAR
    // ==============================

    const footerYear =
        document.getElementById("footerYear");


    if (footerYear) {

        footerYear.textContent =
            new Date().getFullYear();

    }


    // ==============================
    // ACTIVE NAV LINK
    // ==============================

    const currentPath =
        window.location.pathname;


    const navLinks =
        document.querySelectorAll(".masar-nav-link");


    navLinks.forEach(function (link) {

        link.classList.remove("active");


        const linkPath =
            new URL(
                link.href,
                window.location.origin
            ).pathname;


        if (currentPath === linkPath) {

            link.classList.add("active");

        }

    });

});