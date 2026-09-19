(function () {

    const token = localStorage.getItem("token");

    // Token hi nahi hai
    if (!token || token === "null" || token === "undefined") {
        localStorage.removeItem("token");
        localStorage.removeItem("currentUser");
        localStorage.removeItem("isLogin");

        window.location.replace("login.html");
        return;
    }

    // Backend se token verify karo
    fetch("https://mygame-backend.sohitking478.workers.dev/api/user/profile", {
        method: "GET",
        headers: {
            "Authorization": "Bearer " + token
        }
    })
    .then(async (response) => {

        // Token invalid / expired
        if (response.status === 401 || response.status === 403) {

            localStorage.removeItem("token");
            localStorage.removeItem("currentUser");
            localStorage.removeItem("isLogin");

            window.location.replace("login.html");
            return;
        }

        // User not found
        if (response.status === 404) {

            localStorage.removeItem("token");
            localStorage.removeItem("currentUser");
            localStorage.removeItem("isLogin");

            window.location.replace("login.html");
            return;
        }

        if (!response.ok) {
            throw new Error("Auth verification failed");
        }

        const data = await response.json();

        if (!data.success) {

            localStorage.removeItem("token");
            localStorage.removeItem("currentUser");
            localStorage.removeItem("isLogin");

            window.location.replace("login.html");
            return;
        }

        // Token valid
        console.log("✅ User authenticated");

    })
    .catch((error) => {

        console.error("Auth Guard Error:", error);

        // Network/server error mein turant logout mat karo
        // warna temporary Render cold-start se user logout ho jayega

    });

})();