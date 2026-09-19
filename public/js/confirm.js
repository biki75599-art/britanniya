let confirmCallback = null;

function showConfirm(message, callback) {
    confirmCallback = callback;

    const popup = document.getElementById("confirmPopup");
    const title = document.getElementById("confirmTitle");

    if (!popup || !title) {
        console.error("Confirm popup HTML not found");
        return;
    }

    title.innerText = message;
    popup.style.display = "flex";
}

function closeConfirm() {
    document.getElementById("confirmPopup").style.display = "none";
}

function confirmOk() {
    document.getElementById("confirmPopup").style.display = "none";

    if (typeof confirmCallback === "function") {
        confirmCallback();
    }
}