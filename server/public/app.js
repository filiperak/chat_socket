const socket = io("ws://localhost:3500")

const msgInput = document.querySelector("#message")
const nameInput = document.querySelector("#name")
const chatRoom = document.querySelector("#room")
const activity = document.querySelector(".activity")
const usersList = document.querySelector(".user-list")
const roomList = document.querySelector(".room-list")
const chatDisplay = document.querySelector(".chat-display")

const sendMessage = (e) => {
    e.preventDefault()
    if (msgInput.value && nameInput.value && chatRoom.value){
        socket.emit("message",{
            name: msgInput.value,
            text:msgInput.value
        })
        msgInput.value = ""
    }
    msgInput.focus()
}

const enterRoom = (e) => {
    e.preventDefault()
    if(nameInput.value && chatRoom.value){
        socket.emit("enterRoom",{
            name: nameInput.value,
            room:chatRoom.value
        })
    }
}

document.querySelector(".form-message").addEventListener("submit",sendMessage)

document.querySelector(".form-join").addEventListener("submit",enterRoom)

msgInput.addEventListener("keypress",() => {
    socket.emit("activity" , nameInput.value)
})

socket.on("message",(data) => {
    activity.textContent = ""
    const {name,text,time} = data
    const li = document.createElement("li")
    li.className = "post"
    if(name === nameInput.value){
        li.className = "post post--left"
    }
    if(name !== nameInput.value && name !== "Admin"){
        li.classList = "post post--rigth"
    }
    if(name !== "Admin"){
        li.innerHTML = `<div class="post__header${name === nameInput.value?
            'post__header--user'
            :'post__header--reply'

        }">
        <span claass="post__header--name">${name}</span>
        <span claass="post__header--name">${time}</span>
        </div>
        <div class="post__text">${text}</div>
        `
    }else{
        li.innerHTML = `<div class="post__text">${text}</div>`
    }
    console.log(data);
    
    document.querySelector(".chat-display").appendChild(li)

    chatDisplay.scrollTop = chatDisplay.scrollHeight
})

let activityTimer

socket.on("activity", (name) => {
    activity.textContent = `${name} is typeing...`

    //clear after 1 second
    clearTimeout(activityTimer)
    activityTimer = setTimeout(() => {
        activity.textContent = ""
    },1500)
})

socket.on("userList",({users}) => {
    showUsers(users)
})

socket.on("roomList",({rooms}) => {
    showRooms(rooms)
})

function showUsers(users){
    usersList.textContent = ""
    if(users){
        usersList.innerHTML = `<em>
        Users in ${chatRoom.value}:
        </em>`
        users.forEach((user,index) => {
            users.textContent += `${user.name}`
            if(users.length > 1 && i !== users.length -1){
                usersList.textContent += ","
            }
        });
    }
}

function showRooms(rooms){
    roomList.textContent = ""
    if(rooms){
        roomList.innerHTML = `<em>
        Active Rooms:
        </em>`
        rooms.forEach((room,index) => {
            room.textContent += `${room}`
            if(room.length > 1 && index !== room.length -1){
                roomList.textContent += ","
            }
        });
    }
}