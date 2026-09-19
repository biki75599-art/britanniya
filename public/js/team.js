let level1Members = [];
let level2Members = [];
let level3Members = [];

(function () {
    const token = localStorage.getItem("token");

    if (!token || token === "null" || token === "undefined") {
        window.location.href = "login.html";
        return;
    }
})();

// ==============================
// API
// ==============================

const API =
    "https://mygame-backend.sohitking478.workers.dev/api/referral/team";

const token =
    localStorage.getItem("token");

// ==============================
// Load Team
// ==============================

async function loadTeam() {

    try {

        const res = await fetch(API, {

            headers: {

                Authorization:
                    "Bearer " + token

            }

        });

        const data = await res.json();

        if (!data.success) {

            showPopup(data.message);
            return;

        }

        // ======================
        // Summary
        // ======================

        document.getElementById("teamCount").innerText =
            data.totalTeam || 0;

        document.getElementById("teamRecharge").innerText =
            "₹" + (data.totalRecharge || 0);

       document.getElementById("lv1").innerText =
            data.level1.length;

        document.getElementById("lv2").innerText =
            data.level2.length;

        document.getElementById("lv3").innerText =
            data.level3.length;

        //document.getElementById("todayJoin").innerText =
            //data.todayJoin || 0;

        //document.getElementById("todayRecharge").innerText =
            //"₹" + (data.todayRecharge || 0);
        //document.getElementById("teamIncome").innerText =
                     //"₹" + (data.totalIncome || 0);
        //document.getElementById("todayCommission").innerText =
            //"₹" + (data.todayCommission || 0);

        // ======================
        // Merge All Levels
        // ======================

level1Members = (data.level1 || []).map(u => ({
    ...u,
    level: 1
}));

level2Members = (data.level2 || []).map(u => ({
    ...u,
    level: 2
}));

level3Members = (data.level3 || []).map(u => ({
    ...u,
    level: 3
}));

showLevel(1);

       

    }

    catch (err) {

        console.log(err);

        document.getElementById("memberList").innerHTML = `

        <div class="text-center py-6 text-red-500">

            Failed to load team.

        </div>

        `;

    }

}

// ==============================
// Render Members
// ==============================

function renderMembers(team) {

    const memberList =
        document.getElementById("memberList");

    if (team.length === 0) {

        memberList.innerHTML = `

        <div class="text-center py-8">

            <i class="fa fa-users text-4xl text-gray-300"></i>

            <p class="mt-3 text-gray-500">

                No Team Found

            </p>

        </div>

        `;

        return;

    }

    let html = "";

    team.forEach(user => {

        html += `

        <div class="member">

            <div>

                <div class="member-name">

                    ${user.name || "Unknown"}

                </div>

                <div class="member-status">

                    ${user.mobile || "-"}

                </div>

                <div class="text-xs text-gray-500 mt-1">

                    Level ${user.level}

                </div>

            </div>

            <div style="text-align:right;">

                <div
                style="
                color:#2563eb;
                font-weight:600;
                ">

                    VIP ${user.vip || user.vipLevel || 0}

                </div>

                <div
                style="
                color:#16a34a;
                margin-top:4px;
                ">

                    ₹${user.totalRecharge || 0}

                </div>

            </div>

        </div>

        `;

    });

    memberList.innerHTML = html;

}
function showLevel(level) {

    // Header Change
    document.getElementById("headerTitle").innerText =
        "Team Level " + level;

    // Active Button
    document.querySelectorAll(".level").forEach(item => {
        item.classList.remove("active");
    });

    document.querySelectorAll(".level")[level - 1]
        .classList.add("active");

    // Show Selected Members
    if (level === 1) {

        renderMembers(level1Members);

    } else if (level === 2) {

        renderMembers(level2Members);

    } else {

        renderMembers(level3Members);

    }

}
// ==============================

loadTeam();
