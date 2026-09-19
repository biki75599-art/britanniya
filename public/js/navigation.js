// ==========================================
// COMMON NAVIGATION SYSTEM
// ==========================================

// ==========================================
// LOADER + PAGE NAVIGATION
// ==========================================

function showLoader(page) {

    const loader =
        document.getElementById("loaderOverlay");

    if (loader) {

        loader.style.display = "flex";

        setTimeout(() => {
            window.location.href = page;
        }, 500);

    } else {

        window.location.href = page;

    }
}


// ==========================================
// SAVE ACTIVE NAV
// ==========================================

function setActiveNav(navName) {

    localStorage.setItem(
        "activeNav",
        navName
    );

}


// ==========================================
// BOTTOM NAVIGATION
// ==========================================

function goDashboard() {

    setActiveNav("home");

    showLoader("dashboard.html");

}


function goShare() {

    setActiveNav("share");

    showLoader("share.html");

}


function goTeam() {

    setActiveNav("team");

    showLoader("team.html");

}


function goMy() {

    setActiveNav("my");

    showLoader("my.html");

}


function goCard(page = "card.html") {

    setActiveNav("card");

    showLoader(page);

}



// ==========================================
// ACTIVE BOTTOM NAV
// ==========================================

function updateActiveNav() {

    // Sabhi nav se active hatao
    document
        .querySelectorAll(".nav-btn")
        .forEach(btn => {
            btn.classList.remove("active-nav");
        });


    const page =
        window.location.pathname
            .split("/")
            .pop()
            .toLowerCase();


    // ======================================
    // HOME NAV
    // ======================================

    const homePages = [
        "",
        "index.html",
        "dashboard.html"
    ];

    if (homePages.includes(page)) {

        document
            .getElementById("homeNav")
            ?.classList.add("active-nav");

        return;
    }


    // ======================================
    // SHARE / CONVERT NAV
    // ======================================

    const sharePages = [
        "share.html"
    ];

    if (sharePages.includes(page)) {

        document
            .getElementById("shareNav")
            ?.classList.add("active-nav");

        return;
    }


    // ======================================
    // TEAM NAV
    // ======================================

    const teamPages = [
        "team.html"
    ];

    if (teamPages.includes(page)) {

        document
            .getElementById("teamNav")
            ?.classList.add("active-nav");

        return;
    }


    // ======================================
    // LEADERBOARD NAV
    // ======================================

    const leaderboardPages = [
        "leaderboard.html"
    ];

    if (leaderboardPages.includes(page)) {

        document
            .getElementById("gameNav")
            ?.classList.add("active-nav");

        return;
    }


    // ======================================
    // MY NAV
    // ======================================

    const myPages = [

        "my.html",
        "device.html",
        "profile.html",
        "bank.html",
        "income-detail.html",
        "withdraw-history.html",
        "recharge-history.html",
        "setting.html",
        "security.html",
        "invite.html",
        "notice.html",
        "customer-service.html",
        "personal-information.html",
        "records.html",
        "about.html",
        "vip.html",
       

    ];

    if (myPages.includes(page)) {

        document
            .getElementById("myNav")
            ?.classList.add("active-nav");

        return;
    }

}


// ==========================================
// PAGE LOAD
// ==========================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        updateActiveNav();

    }
);


// ==========================================
// BROWSER BACK / FORWARD
// ==========================================

window.addEventListener(
    "pageshow",
    function () {

        const loader =
            document.getElementById(
                "loaderOverlay"
            );

        if (loader) {

            loader.style.display = "none";

        }

        updateActiveNav();

    }
);

// ==========================================
// COPY CONTROL
// ==========================================
//
// Normal page par copy disabled rahega.
//
// Lekin Share page ke invitation code/link
// ke copy buttons ko allow kiya jayega.
//
// Allowed elements:
//   .copy-allowed
//   .copy-btn
//   [data-copy]
//   [data-copy-text]
//
// ==========================================

(function () {

    function isCopyAllowed(target) {

        if (!target) {
            return false;
        }

        // --------------------------------------
        // Direct allowed element
        // --------------------------------------

        if (
            target.classList &&
            (
                target.classList.contains("copy-allowed") ||
                target.classList.contains("copy-btn")
            )
        ) {
            return true;
        }


        // --------------------------------------
        // Inside allowed element
        // --------------------------------------

        if (
            target.closest &&
            target.closest(
                ".copy-allowed, .copy-btn, [data-copy], [data-copy-text]"
            )
        ) {
            return true;
        }


        // --------------------------------------
        // Share page
        //
        // Only actual copy buttons are allowed.
        // --------------------------------------

        const copyButton =
            target.closest?.(
                "button[data-copy], " +
                "[data-copy-text], " +
                ".copy-btn, " +
                ".copy-allowed"
            );

        if (copyButton) {
            return true;
        }


        return false;

    }


    // ==========================================
    // TEXT SELECTION
    // ==========================================

    document.addEventListener(
        "selectstart",
        function (e) {

            if (isCopyAllowed(e.target)) {
                return;
            }

            e.preventDefault();

        }
    );


    // ==========================================
    // COPY
    // ==========================================

    document.addEventListener(
        "copy",
        function (e) {

            if (isCopyAllowed(e.target)) {
                return;
            }

            e.preventDefault();

        }
    );


    // ==========================================
    // CUT
    // ==========================================

    document.addEventListener(
        "cut",
        function (e) {

            if (isCopyAllowed(e.target)) {
                return;
            }

            e.preventDefault();

        }
    );


    // ==========================================
    // DRAG
    // ==========================================

    document.addEventListener(
        "dragstart",
        function (e) {

            if (isCopyAllowed(e.target)) {
                return;
            }

            e.preventDefault();

        }
    );


    // ==========================================
    // RIGHT CLICK
    // ==========================================

    document.addEventListener(
        "contextmenu",
        function (e) {

            if (isCopyAllowed(e.target)) {
                return;
            }

            e.preventDefault();

        }
    );


    // ==========================================
    // KEYBOARD COPY / SELECT
    // ==========================================

    document.addEventListener(
        "keydown",
        function (e) {

            // ----------------------------------
            // Agar copy button/allowed element
            // ke andar hai to keyboard block nahi
            // hoga.
            // ----------------------------------

            if (isCopyAllowed(e.target)) {
                return;
            }


            const key =
                String(
                    e.key || ""
                ).toLowerCase();


            if (
                e.ctrlKey &&
                (
                    key === "a" ||
                    key === "c" ||
                    key === "x"
                )
            ) {

                e.preventDefault();

            }


            // Mac
            if (
                e.metaKey &&
                (
                    key === "a" ||
                    key === "c" ||
                    key === "x"
                )
            ) {

                e.preventDefault();

            }

        }
    );

})();
document.addEventListener("DOMContentLoaded", function () {

    const currentPage =
        window.location.pathname
            .split("/")
            .pop()
            .toLowerCase();

    const navButtons =
        document.querySelectorAll(".nav-btn");

    navButtons.forEach(function (button) {
        button.classList.remove("active");
    });

    // =========================================
    // CARD PAGE
    // =========================================

    if (currentPage === "card.html") {

        const cardNav =
            document.getElementById("cardNav");

        if (cardNav) {
            cardNav.classList.add("active");
        }

    }

});