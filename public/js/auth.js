async function login() {

    const mobileValue =
        document.getElementById("mobile").value.trim();

    const passwordValue =
        document.getElementById("password").value;

    try {

        const response = await fetch(
            "/api/auth/login",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    mobile: mobileValue,
                    password: passwordValue
                })
            }
        );

        const data = await response.json();

        // LOGIN FAILED
        if (!response.ok || !data.success) {

            showLoginPopup(
                "Login Failed",
                data.message || "Login failed.",
                false
            );

            return;
        }

        // SAVE LOGIN DATA
        localStorage.setItem(
            "token",
            data.token
        );

        localStorage.setItem(
            "currentUser",
            JSON.stringify(data.user)
        );

        localStorage.setItem(
            "isLogin",
            "true"
        );

        // SUCCESS POPUP
        showLoginPopup(
            "Login Successful",
            "Welcome back! Redirecting to dashboard...",
            true
        );

        // REDIRECT
        setTimeout(function () {

            window.location.href =
                "dashboard.html";

        }, 1500);

    } catch (error) {

        console.error(
            "LOGIN ERROR:",
            error
        );

        showLoginPopup(
            "Connection Error",
            "Server connection failed.",
            false
        );
    }
}


// LOGIN POPUP
function showLoginPopup(title, message, success) {

    // Remove old popup if already present
    const oldPopup =
        document.getElementById("loginPopup");

    if (oldPopup) {
        oldPopup.remove();
    }

    const popup =
        document.createElement("div");

    popup.id = "loginPopup";

    popup.innerHTML = `
        <div class="login-popup-overlay">

            <div class="login-popup-box">

                <div class="login-popup-icon">
                    ${success ? "✓" : "!"}
                </div>

                <h2>${title}</h2>

                <p>${message}</p>

                <button
                    onclick="document.getElementById('loginPopup').remove()"
                >
                    OK
                </button>

            </div>

        </div>
    `;

    document.body.appendChild(popup);

    // Popup CSS
    const style =
        document.createElement("style");

    style.id = "loginPopupStyle";

    style.textContent = `
        .login-popup-overlay {
            position: fixed;
            inset: 0;
            z-index: 999999;
            display: flex;
            align-items: center;
            justify-content: center;
            background: rgba(0, 0, 0, 0.65);
            backdrop-filter: blur(5px);
        }

        .login-popup-box {
            width: min(90%, 380px);
            padding: 30px 25px;
            text-align: center;
            border-radius: 20px;
            background: rgba(30, 35, 45, 0.97);
            box-shadow: 0 20px 60px rgba(0,0,0,.5);
            color: white;
            animation: loginPopupShow .25s ease;
        }

        .login-popup-icon {
            width: 65px;
            height: 65px;
            margin: 0 auto 15px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            background: #22c55e;
            color: white;
            font-size: 35px;
            font-weight: bold;
        }

        .login-popup-box h2 {
            margin: 10px 0;
            font-size: 24px;
        }

        .login-popup-box p {
            margin: 10px 0 22px;
            color: #d1d5db;
            font-size: 15px;
        }

        .login-popup-box button {
            width: 100%;
            border: 0;
            border-radius: 10px;
            padding: 12px;
            background: #2563eb;
            color: white;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
        }

        .login-popup-box button:hover {
            background: #1d4ed8;
        }

        @keyframes loginPopupShow {
            from {
                opacity: 0;
                transform: scale(.85);
            }

            to {
                opacity: 1;
                transform: scale(1);
            }
        }
    `;

    document.head.appendChild(style);
}