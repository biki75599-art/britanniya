async function loadDevices() {
    const deviceList = document.getElementById("deviceList");
    const emptyDevice = document.getElementById("emptyDevice");
    const deviceCount = document.getElementById("deviceCount");

    try {
        const token = localStorage.getItem("token");

        if (!token) {
            console.error("DEVICE: Token missing");
            showPopup("Please login again");
            return;
        }

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15000);

        const res = await fetch("/api/product/device", {
            method: "GET",
            headers: {
                "Authorization": "Bearer " + token,
                "Content-Type": "application/json"
            },
            signal: controller.signal
        });

        clearTimeout(timeout);

        const data = await res.json();

        console.log("DEVICE API:", res.status, data);

        if (res.status === 401) {
            localStorage.removeItem("token");
            localStorage.removeItem("currentUser");
            localStorage.removeItem("isLogin");

            showPopup("Session expired. Please login again.");

            setTimeout(() => {
                window.location.href = "login.html";
            }, 1200);

            return;
        }

        if (!res.ok || !data.success) {
            throw new Error(data.message || "Device Load Failed");
        }

        const devices = Array.isArray(data.devices)
            ? data.devices
            : [];

        deviceList.innerHTML = "";

        if (deviceCount) {
            const uniqueProducts = {};

            devices.forEach(item => {
                const productId =
                    item.product?._id ||
                    item.product ||
                    item.productName;

                uniqueProducts[productId] = true;
            });

            deviceCount.innerText =
                Object.keys(uniqueProducts).length;
        }

        if (devices.length === 0) {
            deviceList.classList.add("hidden");
            emptyDevice.classList.remove("hidden");
            return;
        }

        emptyDevice.classList.add("hidden");
        deviceList.classList.remove("hidden");

        const groupedProducts = {};

        devices.forEach(item => {
            const productId =
                item.product?._id ||
                item.product ||
                item.productName;

            if (!groupedProducts[productId]) {
                groupedProducts[productId] = {
                    name:
                        item.product?.name ||
                        item.productName ||
                        "Product A",

                    dailyIncome:
                        item.dailyIncome || 0,

                    status:
                        item.status || "Running",

                    purchaseDate:
                        item.purchaseDate,

                    quantity: 0
                };
            }

            groupedProducts[productId].quantity++;
        });

        Object.values(groupedProducts).forEach(item => {
            const percent = Math.min(
                (item.quantity / 5) * 100,
                100
            );

            deviceList.innerHTML += `
                <div class="device-card">

                    <div class="device-top">
                        <div>
                            <h2 class="device-title">
                                ${item.name}
                            </h2>

                            <p class="device-income">
                                Daily Income ₹${item.dailyIncome}
                            </p>
                        </div>

                        <span class="device-status">
                            ${item.status}
                        </span>
                    </div>

                    <div class="device-info">
                        <span>Purchased</span>
                        <span>${item.quantity}/5</span>
                    </div>

                    <div class="device-progress">
                        <div
                            class="device-progress-fill"
                            style="width:${percent}%">
                        </div>
                    </div>

                    <div class="device-date">
                        <i class="fas fa-calendar-days"></i>
                        Buy Date:
                        ${
                            item.purchaseDate
                                ? new Date(
                                    item.purchaseDate
                                  ).toLocaleDateString()
                                : "--"
                        }
                    </div>

                </div>
            `;
        });

    } catch (err) {
        console.error("DEVICE LOAD ERROR:", err);

        if (err.name === "AbortError") {
            showPopup("Device server response timeout");
        } else {
            showPopup(
                err.message || "Device Load Failed"
            );
        }
    }
}

loadDevices();