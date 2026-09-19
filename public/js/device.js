const token = localStorage.getItem("token");

const deviceList = document.getElementById("deviceList");
const emptyDevice = document.getElementById("emptyDevice");

async function loadDevices() {

    try {

        const res = await fetch("https://mygame-backend.sohitking478.workers.dev/api/product/device", {
            headers: {
                Authorization: "Bearer " + token
            }
        });

        const data = await res.json();

        deviceList.innerHTML = "";
       const uniqueProducts = {};

data.devices.forEach(item => {

    const productId =
        item.product?._id ||
        item.product ||
        item.productName;

    uniqueProducts[productId] = true;

});

document.getElementById("deviceCount").innerText =
Object.keys(uniqueProducts).length;

       if (!data.success || !data.devices || data.devices.length === 0) {

            deviceList.classList.add("hidden");
            emptyDevice.classList.remove("hidden");
            return;

        }

        emptyDevice.classList.add("hidden");
        deviceList.classList.remove("hidden");

       // Product wise grouping
const groupedProducts = {};

data.devices.forEach(item => {

    const productId =
        item.product?._id ||
        item.product ||
        item.productName;

    if (!groupedProducts[productId]) {

        groupedProducts[productId] = {
            name: item.product?.name || item.productName || "Product A",
            dailyIncome: item.dailyIncome || 0,
            status: item.status,
            purchaseDate: item.purchaseDate,
            quantity: 0
        };

    }

    groupedProducts[productId].quantity++;

});


// Clear old cards
deviceList.innerHTML = "";


// Create one card for each product
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

        Buy Date :
        ${
            item.purchaseDate
            ? new Date(item.purchaseDate).toLocaleDateString()
            : "--"
        }

    </div>

</div>

`;

        });

    } catch (err) {

        console.log(err);
        showPopup("Device Load Failed");

    }

}

loadDevices();