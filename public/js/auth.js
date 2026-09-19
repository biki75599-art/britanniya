async function login() {

    const mobileValue =
        document.getElementById("mobile").value.trim();

    const passwordValue =
        document.getElementById("password").value;


    try {

        const response =
            await fetch(
                "https://mygame-backend.sohitking478.workers.dev/api/auth/login",
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


        const data =
            await response.json();


        if (!response.ok || !data.success) {

            showError(
                data.message || "Login failed."
            );

            return;
        }


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


        showSuccess(
            data.message || "Login Successful"
        );


        setTimeout(function () {

            window.location.href =
                "dashboard.html";

        }, 1000);


    } catch (error) {

        console.error(
            "LOGIN ERROR:",
            error
        );

        showError(
            "Server connection failed."
        );
    }
}