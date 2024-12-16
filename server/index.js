import express from "express"
import { Server } from "socket.io";

import path from "path"
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)


const PORT = process.env.PORT || 3500
const ADMIN = "Admin"

const app = express()
app.use(express.static(path.join(__dirname,"public")))


const expressServer = app.listen(PORT,() => {
    console.log(`app listening on ${PORT}`);
    
})

//state
const UsersState = {
    users:[],
    setUsers: function(newUsersArray){
        this.users = newUsersArray
    }
}

const io = new Server(expressServer,{
    cors:{
        origin: process.env.NODE_ENV === "production" ? false : ["http://localhost:5500","http://127.0.0.1:5500"]
    }
})

io.on("connection", (socket) => {
    console.log(`${socket.id} conected`);
    
    //upon connection to user
    socket.emit("message",buildMsg(ADMIN,"Wellcome to chat app"))

    socket.on("enterRoom",({name,room}) => {

        //leve prev room if in room
        const prevRoom = getUser(socket.id)?.room

        if(prevRoom){
            socket.leave(prevRoom)
            io.to(prevRoom).emit("message",buildMsg(ADMIN,`${name} has left the chat`))
        }
        const user = activateUser(socket.id,name,room)

        if(prevRoom){
            io.to(prevRoom).emit("userList",{
                users: getUsersInRoom(prevRoom)
            })
        }

        //join room
        socket.join(user.room)

        socket.emit("message",buildMsg(ADMIN,`you have joined ${user.room}`))

        socket.broadcast.to(user.room).emit("message",buildMsg(ADMIN,`${user.name} has joined the chat`))

        io.to(user.room).emit("userList",{
            users:getUsersInRoom(user.room)
        })
    })


    //when user disconnects - to all other    
    socket.on("disconnect", () => {
        // socket.broadcast.emit("message",`${(socket.id).substring(0,5)} dissconected`)
        const user = getUser(socket.id)
        userLeavesApp(socket.id)

        if(user){
            io.to(user.room).emit("message",buildMsg(ADMIN,`${user.name} has left the room`))

            io.to(user.room).emit("userList",{
                users:getUsersInRoom(user.room)
            })

            io.emit("roomList",{
                rooms:getAllActiveRooms()
            })
        }
    })

    //upon connection to user everyone else
    //socket.broadcast.emit("message",`${(socket.id).substring(0,5)} connected` )
    
    //listening fro message event
    socket.on("message", ({name,text}) => {

        const room = getUser(socket.id)?.room
        if(room){
            io.to(room).emit("message",buildMsg(name,text))
        }
        //io.emit("message" , `${(socket.id).substring(0,5)} : ${data}`); 
        //io.emit("message" , {data,id:socket.id}); 
    });
    

    
    socket.on("activity" , (name) => {
        const room = getUser(socket.id)?.room
        if (room){
            socket.broadcast.to(room).emit("activity",name)
        }
        //socket.broadcast.emit("activity",name)
    })
}); 

function buildMsg(name,text){
    return{
        name,
        text,
        time: new Intl.DateTimeFormat("default",{
            hour:"numeric",
            minute:"numeric",
            second:"numeric"
        }).format(new Date())
    }
}

// User functions
function activateUser(id, name, room) {
    const user = { id, name, room }
    UsersState.setUsers([
        ...UsersState.users.filter(user => user.id !== id),
        user
    ])
    return user
}

function userLeavesApp(id){
    UsersState.setUsers(
        UsersState.users.filter(user => user.id !== id)
    )
}

function getUser(id){
    return UsersState.users.find(user => user.id === id)
}

function getUsersInRoom(room){
    console.log( typeof(UsersState.users ))
    
    return UsersState.users.filter(user => user.room === room)
}

function getAllActiveRooms(){
    return Array.from(new Set(UsersState.users.map(user => user.room)))
}



/*
Socket.IO Cheatsheet

Action                                             | Method
---------------------------------------------------|-------------------------------------------------
Send to the client that triggered the event        | socket.emit()
Send to all clients (including the sender)         | io.emit()
Send to all clients except the sender               | socket.broadcast.emit()
Send to clients in a specific room                 | io.to(room).emit()
Send to a specific client in a room (excluding sender) | socket.to(room).emit()
Add client to a room                               | socket.join(room)
Remove client from a room                          | socket.leave(room)
Listen for client disconnection                    | socket.on("disconnect", callback)
*/
