function showSuccess(message) {
    showToast(message, "success");
}

function showError(message) {
    showToast(message, "error");
}

function showWarning(message) {
    showToast(message, "warning");
}

function showToast(message, type) {

    const oldToast = document.getElementById("appToast");

    if (oldToast) {
        oldToast.remove();
    }

    const toast = document.createElement("div");

    toast.id = "appToast";

    const icon =
        type === "success" ? "✓" :
        type === "error" ? "!" :
        "⚠";

    toast.innerHTML = `
        <div class="app-toast-icon">${icon}</div>
        <div class="app-toast-message">${message}</div>
    `;

    document.body.appendChild(toast);

    if (!document.getElementById("appToastStyle")) {

        const style = document.createElement("style");

        style.id = "appToastStyle";

        style.textContent = `
            #appToast {
                position: fixed;
                top: 20px;
                left: 50%;
                transform: translateX(-50%);
                z-index: 999999;
                min-width: 280px;
                max-width: 90%;
                padding: 13px 18px;
                display: flex;
                align-items: center;
                gap: 10px;
                border-radius: 12px;
                background: #2563eb;
                color: #fff;
                box-shadow: 0 10px 30px rgba(0,0,0,.35);
                font-size: 15px;
                font-weight: 600;
                animation: appToastShow .25s ease;
            }

            .app-toast-icon {
                width: 28px;
                height: 28px;
                min-width: 28px;
                border-radius: 50%;
                background: rgba(255,255,255,.2);
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 17px;
                font-weight: bold;
            }

            .app-toast-message {
                flex: 1;
            }

            @keyframes appToastShow {
                from {
                    opacity: 0;
                    transform: translate(-50%, -15px);
                }

                to {
                    opacity: 1;
                    transform: translate(-50%, 0);
                }
            }
        `;

        document.head.appendChild(style);
    }

    const duration =
        type === "success" ? 1800 : 2000;

    setTimeout(() => {

        const currentToast =
            document.getElementById("appToast");

        if (currentToast) {
            currentToast.remove();
        }

    }, duration);
}