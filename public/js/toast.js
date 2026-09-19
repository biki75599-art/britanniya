function showSuccess(message) {
    Swal.fire({
        toast: true,
        position: "top",
        icon: "success",
        title: message,
        showConfirmButton: false,
        timer: 1800,
        timerProgressBar: false,
        width: "300px",
        background: "#2563eb",
        color: "#fff",
        iconColor: "#fff",
        customClass: {
            popup: "app-toast",
            title: "app-toast-title"
        }
    });
}

function showError(message) {
    Swal.fire({
        toast: true,
        position: "top",
        icon: "error",
        title: message,
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: false,
        width: "300px",
        background: "#2563eb",
        color: "#fff",
        iconColor: "#fff",
        customClass: {
            popup: "app-toast",
            title: "app-toast-title"
        }
    });
}

function showWarning(message) {
    Swal.fire({
        toast: true,
        position: "top",
        icon: "warning",
        title: message,
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: false,
        width: "300px",
        background: "#2563eb",
        color: "#fff",
        iconColor: "#fff",
        customClass: {
            popup: "app-toast",
            title: "app-toast-title"
        }
    });
}