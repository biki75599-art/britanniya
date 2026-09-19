// ==============================
// BRITANNIYA Share Page
// ==============================


// ==============================
// LOGIN TOKEN
// ==============================

(function () {

    const token =
        localStorage.getItem("token");

    if (
        !token ||
        token === "null" ||
        token === "undefined"
    ) {

        window.location.href =
            "login.html";

    }

})();


const token =
    localStorage.getItem("token");


// ==============================
// API
// ==============================

const API =
    "https://mygame-backend.sohitking478.workers.dev/api/referral/dashboard";


// ==============================
// LOAD REFERRAL DASHBOARD
// ==============================

async function loadReferralDashboard() {

    try {

        if (!token) {
            return;
        }


        const res =
            await fetch(
                API,
                {

                    method: "GET",

                    headers: {

                        Accept:
                            "application/json",

                        Authorization:
                            "Bearer " + token

                    },

                    cache:
                        "no-store"

                }
            );


        const data =
            await res
                .json()
                .catch(
                    () => ({})
                );


        console.log(
            "Referral Dashboard:",
            data
        );


        // ==============================
        // API ERROR
        // ==============================

        if (
            !res.ok ||
            !data.success
        ) {

            if (
                typeof showPopup ===
                "function"
            ) {

                showPopup(
                    data.message ||
                    "Unable to load referral data"
                );

            }

            return;

        }


        // ==============================
        // INVITE CODE
        // ==============================

        const inviteCode =
            document.getElementById(
                "inviteCode"
            );

        if (inviteCode) {

            inviteCode.value =
                data.inviteCode || "";

        }


        // ==============================
        // REFERRAL LINK
        // ==============================

        const referralLink =
            document.getElementById(
                "referralLink"
            );

        if (referralLink) {

            referralLink.value =
                data.referralLink || "";

        }


        // ==============================
        // QR CODE
        // ==============================

        const qrImage =
            document.getElementById(
                "qrImage"
            );

        if (
            qrImage &&
            data.referralLink
        ) {

            qrImage.src =
                "https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=" +
                encodeURIComponent(
                    data.referralLink
                );

        }


        // ==============================
        // TODAY INCOME
        // ==============================

        const todayIncome =
            document.getElementById(
                "todayIncome"
            );

        if (todayIncome) {

            todayIncome.innerText =
                "₹" +
                Number(
                    data.todayIncome || 0
                ).toLocaleString(
                    "en-IN"
                );

        }


        // ==============================
        // TOTAL INCOME
        // ==============================

        const totalIncome =
            document.getElementById(
                "totalIncome"
            );

        if (totalIncome) {

            totalIncome.innerText =
                "₹" +
                Number(
                    data.totalIncome || 0
                ).toLocaleString(
                    "en-IN"
                );

        }

    }
    catch (error) {

        console.error(
            "Referral Dashboard Error:",
            error
        );

    }

}


// ==============================
// COPY HELPER
// ==============================

async function copyText(text, message) {

    if (!text) {

        if (
            typeof showPopup ===
            "function"
        ) {

            showPopup(
                "Nothing to copy"
            );

        }

        return false;

    }


    // ==============================
    // MODERN CLIPBOARD API
    // ==============================

    try {

        if (
            navigator.clipboard &&
            window.isSecureContext
        ) {

            await navigator.clipboard.writeText(
                text
            );


            if (
                typeof showSuccess ===
                "function"
            ) {

                showSuccess(
                    message
                );

            }

            return true;

        }

    }
    catch (error) {

        console.warn(
            "Clipboard API failed:",
            error
        );

    }


    // ==============================
    // FALLBACK COPY
    // ==============================

    try {

        const textarea =
            document.createElement(
                "textarea"
            );


        textarea.value =
            text;


        textarea.setAttribute(
            "readonly",
            ""
        );


        textarea.style.position =
            "fixed";

        textarea.style.left =
            "-9999px";

        textarea.style.top =
            "0";

        textarea.style.opacity =
            "0";


        document.body.appendChild(
            textarea
        );


        textarea.focus();
        textarea.select();


        const copied =
            document.execCommand(
                "copy"
            );


        textarea.remove();


        if (copied) {

            if (
                typeof showSuccess ===
                "function"
            ) {

                showSuccess(
                    message
                );

            }

            return true;

        }

    }
    catch (error) {

        console.error(
            "Fallback copy failed:",
            error
        );

    }


    // ==============================
    // FINAL FALLBACK
    // ==============================

    try {

        const input =
            document.getElementById(
                "inviteCode"
            );


        if (input) {

            input.focus();
            input.select();

        }

    }
    catch (error) {

        console.error(
            error
        );

    }


    if (
        typeof showPopup ===
        "function"
    ) {

        showPopup(
            "Copy failed. Please try again."
        );

    }


    return false;

}


// ==============================
// COPY INVITE CODE
// ==============================

async function copyInviteCode() {

    const input =
        document.getElementById(
            "inviteCode"
        );


    if (!input) {

        return;

    }


    const value =
        input.value.trim();


    await copyText(
        value,
        "Invite Code Copied"
    );

}


// ==============================
// COPY REFERRAL LINK
// ==============================

async function copyReferralLink() {

    const input =
        document.getElementById(
            "referralLink"
        );


    if (!input) {

        return;

    }


    const value =
        input.value.trim();


    await copyText(
        value,
        "Referral Link Copied"
    );

}


// ==============================
// WHATSAPP SHARE
// ==============================

function shareWhatsApp() {

    const input =
        document.getElementById(
            "referralLink"
        );


    if (!input) {
        return;
    }


    const link =
        input.value.trim();


    if (!link) {

        if (
            typeof showPopup ===
            "function"
        ) {

            showPopup(
                "Referral link is not ready yet."
            );

        }

        return;

    }


    const text =
        "Join BRITANNIYA using my referral link\n\n" +
        link;


    const url =
        "https://wa.me/?text=" +
        encodeURIComponent(
            text
        );


    window.open(
        url,
        "_blank"
    );

}


// ==============================
// TELEGRAM SHARE
// ==============================

function shareTelegram() {

    const input =
        document.getElementById(
            "referralLink"
        );


    if (!input) {
        return;
    }


    const link =
        input.value.trim();


    if (!link) {

        if (
            typeof showPopup ===
            "function"
        ) {

            showPopup(
                "Referral link is not ready yet."
            );

        }

        return;

    }


    const url =
        "https://t.me/share/url?url=" +
        encodeURIComponent(
            link
        ) +
        "&text=" +
        encodeURIComponent(
            "Join BRITANNIYA using my referral link"
        );


    window.open(
        url,
        "_blank"
    );

}


// ==============================
// NATIVE SHARE
// ==============================

async function nativeShare() {

    const input =
        document.getElementById(
            "referralLink"
        );


    if (!input) {
        return;
    }


    const link =
        input.value.trim();


    if (!link) {

        if (
            typeof showPopup ===
            "function"
        ) {

            showPopup(
                "Referral link is not ready yet."
            );

        }

        return;

    }


    // ==============================
    // NATIVE SHARE AVAILABLE
    // ==============================

    if (
        navigator.share
    ) {

        try {

            await navigator.share({

                title:
                    "BRITANNIYA",

                text:
                    "Join BRITANNIYA using my referral link",

                url:
                    link

            });

        }
        catch (error) {

            // User cancelled share
            if (
                error.name !==
                "AbortError"
            ) {

                console.error(
                    "Native share failed:",
                    error
                );

            }

        }

        return;

    }


    // ==============================
    // NO NATIVE SHARE
    // ==============================

    await copyText(
        link,
        "Referral Link Copied"
    );

}


// ==============================
// START
// ==============================

loadReferralDashboard();


// ==============================
// GLOBAL FUNCTIONS
// ==============================
//
// HTML onclick="" ko functions mil sake
// isliye explicitly window par expose kar rahe hain.
// ==============================

window.copyInviteCode =
    copyInviteCode;

window.copyReferralLink =
    copyReferralLink;

window.shareWhatsApp =
    shareWhatsApp;

window.shareTelegram =
    shareTelegram;

window.nativeShare =
    nativeShare;

window.loadReferralDashboard =
    loadReferralDashboard;