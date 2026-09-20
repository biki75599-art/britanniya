async function loginAdmin() {

    const username = document.getElementById("username").value;

    const password = document.getElementById("password").value;

    const res = await fetch(
        "/api/admin/login",
        {

            method: "POST",

            headers: {

                "Content-Type": "application/json"

            },

            body: JSON.stringify({

                username,
                password

            })

        }

    );

    const data = await res.json();

    if (data.success) {

        localStorage.setItem("adminToken", data.token);

        location.href = "admin.html";

    } else {

        document.getElementById("msg").innerHTML = data.message;

    }

}