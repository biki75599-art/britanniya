const token = localStorage.getItem("token");

async function loadHistory(){

    const res = await fetch(

        "/api/referral/history",

        {

            headers:{
                Authorization:"Bearer "+token
            }

        }

    );

    const data = await res.json();

    let html="";

    if(data.history.length==0){

        html="<p class='text-center mt-10'>No Referral Income</p>";

    }

    data.history.forEach(item=>{

        html+=`

<div class="bg-white rounded-xl shadow p-4 mb-4">

<div class="flex justify-between">

<div>

<h3 class="font-bold">

${item.fromUser.name}

</h3>

<p>

${item.fromUser.mobile}

</p>

</div>

<div class="text-right">

<p class="text-green-600 font-bold">

+₹${item.amount}

</p>

<p>

Level ${item.level}

</p>

</div>

</div>

<p class="text-xs text-gray-500 mt-3">

${new Date(item.createdAt).toLocaleString()}

</p>

</div>

`;

    });

    document.getElementById("historyList").innerHTML=html;

}

loadHistory();