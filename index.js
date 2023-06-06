let timeSection = document.querySelector("#time-section");
let button = document.querySelector("#offerBtn");
let element = document.querySelector("#offerValue");
var Chat_box = document.querySelector(".Chat_box")
var totalseconds = 10;
var clearInterval;
var CURRENTROOM = "";
let room = document.getElementById("room");
let currentUser = "";
let IsJoin = false
const connection = new signalR.HubConnectionBuilder()
    .withUrl("https://localhost:7115/offers")
    .configureLogging(signalR.LogLevel.Information)
    .build();
let RoomsPointer = document.getElementById("rooms")
Rooms();

// async function start() {
//     //alert(CURRENTROOM);
//     try {

//         $.get("https://localhost:7115/Room?room="+CURRENTROOM, function (data) {
//             console.log(data);
//             element.innerHTML = 'Begin PRICE $ Nihad' + data;
//         });

//         console.log("SignalR Connected");
//     }
//     catch (err) {
//         console.log(err);
//         setTimeout(() => {
//            // Rooms()
//             start();
//         }, 3333);
//     }
// }
var lastOffer = 0;
var connectionChat;

connection.on("ChatMessage", (message,user) => {
    Chat_box.innerHTML += `<p class="other-message">${user}: ${message}</p>`;
})

connection.on("ReceiveMessageRoom", (message, data) => {
    let element2 = document.querySelector("#offerValue2");
    data += 100;
    element2.innerHTML = message + data;
    button.disabled = false;
    totalseconds = 0;
    clearTimeout(clearInterval);
    timeSection.style.display = "none";

})


connection.on("ReceiveInfoRoom", (message, data) => {
    let element2 = document.querySelector("#offerValue2");
    element2.innerHTML = message + "\n with this offer : " + data + "$";
    button.disabled = true;
    timeSection.style.display = "none";
})

connection.on("ReceiveJoinInfo", (user) => {
    let infoUser = document.querySelector("#info");
    infoUser.innerHTML = user + " connected to our Room";
})

connection.onclose(async () => {
    await start();
})


async function IncreaseOffer() {
    timeSection.style.display = "block";
    totalseconds = 10;
    let result = document.querySelector("#user");
    $.get(`https://localhost:7115/IncreaseRoom?room=${CURRENTROOM}&number=100`, function (data, status) {
        element.innerHTML = data;
        $.get("https://localhost:7115/Room?room=" + CURRENTROOM, function (data, status) {
            lastOffer = data;
            let element2 = document.querySelector("#offerValue2");
            element2.innerHTML = lastOffer;
        });
    });

    await connection.invoke("SendMessageRoom", CURRENTROOM, result.value);
    button.disabled = true;

    clearInterval = setInterval(async () => {
        let time = document.querySelector("#time");
        --totalseconds;
        time.innerHTML = totalseconds;
        if (totalseconds == 0) {
            button.disabled = false;
            clearTimeout(clearInterval);
            let result = document.querySelector("#user");
            button.disabled = true;
            await connection.invoke("SendWinnerMessageRoom", CURRENTROOM, "Game Over\n" + result.value + " is winner");
        }
    }, 1000);

}

async function Rooms() {
    let str = "";
    RoomsPointer.style.display = "flex"
    room.style.display = "none";
    await connection.start()
    await connection.invoke("GetRooms")
        .then(response => {
            console.log("Response:", response);
            response.forEach(group => {
                console.log("Group Name:", group.group_Name);
                console.log("Group Description:", group.userCont);
                console.log("Group Price:", group.price);
                console.log("---------------------------");
                str += `<div class="Rooms_Item">
            <section class="Label_txt">
                <label>${group.group_Name}</label>
                <label>Price: ${group.price}$</label>
            </section>
            <button id="${group.group_Name}" onclick="JoinRoom(id)">Join</button>
            </div>`;
            });
            RoomsPointer.innerHTML = str;
        }).catch(err=>console.log(err));
}

async function Send_Message() {
    let value = document.getElementById("Chat_Boxes")
    let Message = value.value.toString().trim();
    if (Message.length > 0) {
        Chat_box.innerHTML += `<p class="my-message">${Message} :${currentUser}</p>`;
        await connection.invoke("ChatSend", CURRENTROOM, Message,currentUser)
    }
    value.value = "";
}

async function JoinRoom(roomName) {
    RoomsPointer.innerHTML = ""
    RoomsPointer.style.display = "none"
    CURRENTROOM = roomName;
    room.style.display = "flex";
    alert(roomName)
    currentUser = document.getElementById("user").value
    await connection.invoke("JoinRoom", roomName, currentUser)
        .then(response => {
            alert(response)
            if (response == -1) {
                alert("Full Connection")
                Rooms();
            }
            else {
                element.innerHTML = 'Begin PRICE $ ' + response;
            }
        }).catch(err => {
            alert("Disconnection")
            Rooms();
        });
}
