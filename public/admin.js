let allUsers = [];
const token = localStorage.getItem("adminToken");

if (!token) {
    alert("Please Login First");
    window.location.href = "admin-login.html";
}

// Dashboard Load
async function loadDashboard() {

    try {

        const res = await fetch("/api/admin/dashboard", {

            method: "GET",

            headers: {
                Authorization: "Bearer " + token
            }

        });

        const data = await res.json();

        console.log(data);

        if (data.success) {

            document.getElementById("dashboardCards").innerHTML = `

            <div class="bg-white rounded-xl shadow p-4">
                <h3 class="text-gray-500">Users</h3>
                <p class="text-3xl font-bold">${data.totalUsers}</p>
            </div>

            <div class="bg-white rounded-xl shadow p-4">
                <h3 class="text-gray-500">Pending Recharge</h3>
                <p class="text-3xl font-bold">${data.pendingRecharge}</p>
            </div>

            <div class="bg-white rounded-xl shadow p-4">
                <h3 class="text-gray-500">Pending Withdraw</h3>
                <p class="text-3xl font-bold">${data.pendingWithdraw}</p>
            </div>

            <div class="bg-white rounded-xl shadow p-4">
                <h3 class="text-gray-500">Total Recharge</h3>
                <p class="text-3xl font-bold">₹${data.totalRecharge}</p>
            </div>

            <div class="bg-white rounded-xl shadow p-4">
                <h3 class="text-gray-500">Total Withdraw</h3>
                <p class="text-3xl font-bold">₹${data.totalWithdraw}</p>
            </div>

            `;

        }

    } catch (err) {

        console.log(err);
        alert("Dashboard Load Failed");

    }

}

loadDashboard();
loadPendingRecharge();
loadPendingWithdraw();
loadUsers();
async function loadPendingRecharge() {

    try {

        const res = await fetch(
            "/api/recharge/pending",
            {
                headers: {
                    Authorization: "Bearer " + token
                }
            }
        );

        const data = await res.json();

        if (!data.success) return;

       let html = "";

        data.recharges.forEach(item=>{

            html += `
<div class="bg-white rounded-xl shadow-md border p-5 mb-4">

<div class="flex justify-between">

<div>

<h2 class="font-bold text-lg">
${item.user.name}
</h2>

<p class="text-gray-500">
${item.user.mobile}
</p>

</div>

<span class="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-sm">
Pending
</span>

</div>

<hr class="my-3">

<div class="grid grid-cols-2 gap-2 text-sm">

<p>
<b>Order No</b><br>
${item.orderNo || "-"}
</p>

<p>
<b>Amount</b><br>
₹${item.amount}
</p>

<p>
<b>UTR</b><br>

<span id="utr${item._id}">
${item.utr}
</span>

</p>

<p>
<b>Payment</b><br>

${item.paymentMethod || "UPI"}

</p>

</div>

<div class="flex gap-2 mt-4">

<button
onclick="copyUTR('${item._id}')"
class="bg-blue-600 text-white px-4 py-2 rounded-lg">

Copy UTR

</button>

<button
onclick="approveRecharge('${item._id}')"
class="bg-green-600 text-white px-4 py-2 rounded-lg">

Approve

</button>

<button
onclick="rejectRecharge('${item._id}')"
class="bg-red-600 text-white px-4 py-2 rounded-lg">

Reject

</button>

</div>

</div>

`; });

        document.getElementById("pendingRecharge").innerHTML =
            html || "<p>No Pending Recharge</p>";

    } catch (err) {

        console.log(err);

    }

}
async function approveRecharge(id) {

    if (!confirm("Approve Recharge?")) return;

    const res = await fetch(

    "/api/admin/recharge/approve/" + id,

    {
        method: "POST",

        headers: {
            Authorization: "Bearer " + token
        }

    }

);

    const data = await res.json();

    alert(data.message);

    loadDashboard();
   loadPendingRecharge();

}
async function loadPendingWithdraw() {

    try {

        const res = await fetch(
           "/api/admin/pending-withdraw",
            {
                headers: {
                    Authorization: "Bearer " + token
                }
            }
        );

        const data = await res.json();

        const div = document.getElementById("pendingWithdraw");

        if (!data.success) {

            div.innerHTML = "No Pending Withdraw";

            return;

        }

        if (data.withdraws.length == 0) {

            div.innerHTML = "No Pending Withdraw";

            return;

        }

        let html = "";

        data.withdraws.forEach(item => {

            html += `

            <div class="border rounded-lg p-4 mb-4">

                <p><b>User :</b> ${item.user.name}</p>

                <p><b>Mobile :</b> ${item.user.mobile}</p>

                <p><b>Amount :</b> ₹${item.amount}</p>

                <p><b>Bank :</b> ${item.bankName}</p>

                <p><b>Account :</b> ${item.accountNumber}</p>

                <p><b>IFSC :</b> ${item.ifsc}</p>

                <p><b>Holder :</b> ${item.holderName}</p>
                <p>
    <b>UTR :</b>

    <span id="utr${item._id}">
        ${item.utr}
    </span>

    <button
        onclick="copyUTR('${item._id}')"
        class="ml-2 text-blue-600">

        Copy

    </button>

</p>

                <button
                    onclick="approveWithdraw('${item._id}')"
                    class="bg-green-600 text-white px-4 py-2 rounded mt-3">

                    Approve

                </button>
                <button
onclick="rejectWithdraw('${item._id}')"
class="bg-red-600 text-white px-4 py-2 rounded mt-3 ml-2">

Reject

</button>

            </div>

            `;

        });

        div.innerHTML = html;

    } catch (err) {

        console.log(err);

    }

}
async function rejectRecharge(id){

    const reason = prompt("Reject Reason");

    if(reason === null) return;

    try{

        const res = await fetch(

            "/api/admin/recharge/reject/"+id,

            {

                method:"POST",

                headers:{
                    "Content-Type":"application/json",
                    Authorization:"Bearer "+token
                },

                body:JSON.stringify({
                    reason
                })

            }

        );

        const data = await res.json();

        alert(data.message);

        loadDashboard();

        loadPendingRecharge();

    }catch(err){

        console.log(err);

    }

}
async function approveWithdraw(id) {

    if (!confirm("Approve Withdraw ?")) return;

    try {

        const res = await fetch(

           "/api/admin/withdraw/approve/" + id,

            {

                method: "POST",

                headers: {

                    Authorization: "Bearer " + token

                }

            }

        );

        const data = await res.json();

        alert(data.message);

        loadDashboard();

        loadPendingWithdraw();

    }

    catch (err) {

        console.log(err);

    }

}
async function rejectWithdraw(id){

    const reason = prompt("Reject Reason");

    if(reason === null) return;

    try{

        const res = await fetch(

            "/api/admin/withdraw/reject/"+id,

            {

                method:"POST",

                headers:{
                    "Content-Type":"application/json",
                    Authorization:"Bearer "+token
                },

                body:JSON.stringify({
                    reason
                })

            }

        );

        const data = await res.json();

        alert(data.message);

        loadDashboard();

        loadPendingWithdraw();

    }catch(err){

        console.log(err);

    }

}
async function loadUsers(){

    try{

        const res = await fetch(
            "/api/admin/users",
            {
                headers:{
                    Authorization:"Bearer "+token
                }
            }
        );

        const data = await res.json();
        allUsers = data.users;

        let html = "";

        allUsers.forEach(user=>{

            html += `
            <div class="border rounded-lg p-4 mb-3">

                <h3 class="font-bold">
                    ${user.name}
                </h3>

                <p>${user.mobile}</p>

                <p>Balance : ₹${user.balance}</p>

                <p>VIP : ${user.vipLevel}</p>

            </div>
            <div class="mt-4 flex flex-wrap gap-2">

    <button
        onclick="viewUser('${user._id}')"
        class="bg-blue-600 text-white px-3 py-2 rounded">

        View

    </button>
    </div>

   
            `;

        });

        document.getElementById("usersList").innerHTML =
            html || "No Users";

    }catch(err){

        console.log(err);

    }

}
function copyUTR(id){

    const utr = document.getElementById("utr" + id).innerText;

    navigator.clipboard.writeText(utr);

    alert("UTR Copied");

}
function searchUsers(){

    const keyword = document
        .getElementById("searchUser")
        .value
        .toLowerCase();

    let html = "";

    const filtered = allUsers.filter(user=>{

        return (

            user.name.toLowerCase().includes(keyword)

            ||

            user.mobile.includes(keyword)

        );

    });

    filtered.forEach(user=>{

        html += `

<div class="border rounded-lg p-4 mb-3">

    <h3 class="font-bold">

        ${user.name}

    </h3>

    <p>${user.mobile}</p>

    <p>Balance : ₹${user.balance}</p>

    <p>VIP : ${user.vipLevel}</p>

</div>
<div class="mt-4 flex flex-wrap gap-2">

    <button
        onclick="viewUser('${user._id}')"
        class="bg-blue-600 text-white px-3 py-2 rounded">

        View

    </button>

   
</div>

`;

    });
    

    document.getElementById("usersList").innerHTML =
        html || "<p>No User Found</p>";

}
function viewUser(id){

    window.location.href =
    "user-details.html?id="+id;

}

function changeVIP(id){

    alert("VIP Change Coming Next Step");

}

function addBalance(id){

    alert("Add Balance Coming Next Step");

}

function deductBalance(id){

    alert("Deduct Balance Coming Next Step");

}
