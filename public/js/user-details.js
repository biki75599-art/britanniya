const token = localStorage.getItem("adminToken");

const params = new URLSearchParams(location.search);

const id = params.get("id");

async function loadUser(){

    const res = await fetch(

        "/api/admin/user/"+id,

        {

            headers:{

                Authorization:"Bearer "+token

            }

        }

    );

    const data = await res.json();

    const u = data.user;

    document.getElementById("name").innerHTML = u.name;

    document.getElementById("mobile").innerHTML = u.mobile;

    document.getElementById("balance").innerHTML = u.balance;

    document.getElementById("vip").innerHTML = u.vipLevel;

    document.getElementById("recharge").innerHTML = u.totalRecharge;

    document.getElementById("withdraw").innerHTML = u.totalWithdraw;

    document.getElementById("income").innerHTML = u.totalIncome;

    document.getElementById("team").innerHTML = u.totalTeam;

}

loadUser();
async function blockUser(){

    if(!confirm("Block this user?")) return;

    const res = await fetch(

        "/api/admin/user/block/"+id,

        {

            method:"PUT",

            headers:{

                Authorization:"Bearer "+token

            }

        }

    );

    const data = await res.json();

    showPopup(data.message);

    loadUser();

}
async function unblockUser(){

    if(!confirm("Unblock this user?")) return;

    const res = await fetch(

        "/api/admin/user/unblock/"+id,

        {

            method:"PUT",

            headers:{

                Authorization:"Bearer "+token

            }

        }

    );

    const data = await res.json();

    showPopup(data.message);

    loadUser();

}
async function addBalance(){

    const amount = prompt("Enter Amount");

    if(!amount) return;

    const res = await fetch(

        "/api/admin/user/add-balance/"+id,

        {

            method:"PUT",

            headers:{
                "Content-Type":"application/json",
                Authorization:"Bearer "+token
            },

            body:JSON.stringify({
                amount:Number(amount)
            })

        }

    );

    const data = await res.json();

    showPopup(data.message);

    loadUser();

}
async function deductBalance(){

    const amount = prompt("Enter Amount");

    if(!amount) return;

    const res = await fetch(

        "/api/admin/user/deduct-balance/"+id,

        {

            method:"PUT",

            headers:{
                "Content-Type":"application/json",
                Authorization:"Bearer "+token
            },

            body:JSON.stringify({
                amount:Number(amount)
            })

        }

    );

    const data = await res.json();

    showPopup(data.message);

    loadUser();

}
async function changeVip(){

    const vip = prompt("Enter VIP Level (0-10)");

    if(vip===null) return;

    const res = await fetch(

        "/api/admin/user/change-vip/"+id,

        {

            method:"PUT",

            headers:{
                "Content-Type":"application/json",
                Authorization:"Bearer "+token
            },

            body:JSON.stringify({
                vipLevel:Number(vip)
            })

        }

    );

    const data = await res.json();

    showPopup(data.message);

    loadUser();

}
function goBack(){

    window.location.href = "admin.html";

}