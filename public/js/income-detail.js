// ===============================
// Income Detail
// ===============================

const token = localStorage.getItem("token");

// ===============================
// Load Current Balance
// ===============================

async function loadProfile() {

    try {

        const token = localStorage.getItem("token");

        const res = await fetch(
            "/api/user/profile",
            {
                headers: {
                    Authorization: "Bearer " + token
                }
            }
        );

        const data = await res.json();

        console.log(data); // Debug

        if (!data.success) return;

        const balance = "₹" + Number(data.user.balance || 0).toFixed(2);

        document.getElementById("currentBalance").textContent = balance;

    } catch (err) {

        console.log("Profile Error:", err);

    }

}
// ===============================
// Load Referral Income
// ===============================

async function loadIncomeHistory() {

    const subIncomeList = document.getElementById("subIncomeList");

    try {

        const res = await fetch(
            "/api/referral/income",
            {
                headers: {
                    Authorization: "Bearer " + token
                }
            }
        );

        const data = await res.json();

        if (!data.success || !data.history || data.history.length === 0) {

            subIncomeList.innerHTML = `
                <div style="text-align:center;padding:30px;color:#888;">
                    No Referral Commission
                </div>
            `;

            return;
        }

        let html = "";

        data.history.forEach(item => {

            const mobile = item.fromUser?.mobile || "";

            const hideMobile =
                mobile.length >= 4
                ? mobile.substring(0,4) + "******"
                : mobile;

            html += `
            <div class="income-card">

                <div style="display:flex;justify-content:space-between;align-items:center;">

                    <div>
                        <div class="income-title">
                            Referral Commission
                        </div>

                        <div class="income-mobile">
                            Mobile : ${hideMobile}
                        </div>
                    </div>

                    <div class="income-amount">
                        +₹${Number(item.amount).toFixed(2)}
                    </div>

                </div>

                <div class="income-date">
                    ${new Date(item.createdAt).toLocaleString()}
                </div>

            </div>
            `;
        });

        subIncomeList.innerHTML = html;

    } catch {

        subIncomeList.innerHTML = `
            <div style="text-align:center;padding:30px;color:red;">
                Failed to load income.
            </div>
        `;
    }
}


async function loadProductIncome() {

    const list = document.getElementById("incomeList");

    try {

        const res = await fetch(
            "/api/product-income/history",
            {
                headers:{
                    Authorization:"Bearer " + token
                }
            }
        );

        const data = await res.json();

        if (!data.success || !data.history || data.history.length === 0) {

            list.innerHTML = `
                <div style="text-align:center;padding:30px;color:#888;">
                    No Product Income
                </div>
            `;

            return;
        }

        let html = "";

        data.history.forEach(item => {

            html += `
            <div class="income-card">

                <div style="display:flex;justify-content:space-between;align-items:center;">

                    <div>
                        <div class="income-title">${item.product}</div>
                        <div class="income-mobile">Day ${item.day}</div>
                    </div>

                    <div class="income-amount">
                        +₹${Number(item.amount).toFixed(2)}
                    </div>

                </div>

                <div class="income-date">
                    ${new Date(item.createdAt).toLocaleString()}
                </div>

            </div>
            `;
        });

        list.innerHTML = html;

    } catch {

        list.innerHTML = `
            <div style="text-align:center;padding:30px;color:red;">
                Failed to load Product Income
            </div>
        `;
    }
}

window.addEventListener("load", async () => {
    showMyIncome();
    await loadProfile();
    await loadProductIncome();
    await loadIncomeHistory();
});