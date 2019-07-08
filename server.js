var fs = require("fs");

function read(f) {
  return fs.readFileSync(f).toString();
}
function include(f) {
  eval.apply(global, [read(f)]);
}
if (/^win/.test(process.platform)) {
    console.warn('Starting uws bug-hack interval under Windows');
    setInterval(() => {}, 50);
}
include("D:/XAMPP/htdocs/GK.js")
var express = require("express");
var value_port = 569;
var app = express();
var server = app.listen(value_port);

app.use(express.static("public"));
console.log("server starting on localhost:"+value_port);

var socket = require("socket.io");
var io = socket(server);
function sendMsgToAll(msgName, data){
    data.msgName = msgName;
    io.emit("Data",data)
}//sendMsgToAll("update",{date:"12/13/15"})
function sendMsgToRoom(roomID, msgName, data){
    data.msgName = msgName;
    io.to(roomID).emit("Data",data)
}//sendMsgToAll("update",{date:"12/13/15"})

function get_player(id){
    return playerList.find(x => x.id===id);
}
function get_Room_by_id(roomID){
    return roomList.find(x => x.roomID==roomID);
}

class Room{
    constructor(roomID=get_randomID(),maxPlayer = 10){
        this.roomID = roomID;
        this.maxPlayer = maxPlayer;
        this.playerList = [];
        roomList.push(this);
    }
    add_player(socketID){
        this.playerList.push(socketID)
    }
    remove_player(socketID){
        this.playerList.remove(socketID)
    }
    update(){
        
    }
}
class Player{
    constructor(socketID,roomID=-1){
        this.id = socketID;
        this.roomID = roomID;
        this.name = "tester";
        playerList.push(this)
    }
    joinRandomRoom(){
            
        for(let i = 0 ; i < roomList.length ; i++){
            let rm = roomList[i];
            if(rm.playerList.length<rm.maxPlayer){
                //join current room
                rm.add_player(this.id)
                this.roomID = rm.roomID
                this.room = rm
                i = roomList.length;
            }
        }
        if(this.roomID==-1){//still didn't find a room, need to create one!
            let rm = new Room(get_randomID())
            rm.add_player(this.id)
            this.roomID = rm.roomID
            this.room = rm;
        }
    }
    remove(){
        playerList.remove(this)
    }
    update(){
        sendMsgToRoom(this.roomID,"player_update",{
            id: this.id,
            name: this.name
        })
    }
}
let roomList = [];
let playerList = [];

let server_fps = 60;
let timeOut = 1000/server_fps
function loop(){
    for(var r of roomList){
        r.update();
    }
    for(var p of playerList){
        p.update();
    }
    setTimeout(loop, timeOut);
}
setTimeout(loop, timeOut);


io.sockets.on('connection',newConnection);

function newConnection(socket){
    let p = new Player(socket.id,-1);
    p.joinRandomRoom()
    {///new Connection action///
        console.log('new connection:' + socket.id);
        console.log("joint room: "+p.roomID);
        socket.join(p.roomID)
        /*sendMsg(0,{
            name:"tester",
            id:socket.id,
            roomID:p.roomID,
            scene_width:scene_width,
            scene_height:scene_height,
            evolutionDataList:evolutionDataList
        })*/
    }
    ///Functions///
    function sendMsg(msgName, data){
        data.msgName = msgName;
        socket.emit("Data",data)
    }//sendMsg("add_value",[a:50,b:20,c:80])
    function broadcast(msgName, data){
        data.msgName = msgName;
        socket.broadcast.emit("Data",data)
        console.log(socket.id)
    }//broadcast("new_player",[player_name:"abcdefg",id:02132,team:"red"])
    function disconnect(){
        io.emit('user disconnected');
        console.log(socket.id+" disconnected")
        sendMsgToRoom(p.roomID,"player_remove",{id:socket.id})
        get_Room_by_id(p.roomID).remove_player(socket.id)
        
        get_player(socket.id).remove()
    }
    function startPlayer(data){
        
    }
    
    {///Disconnect///
        socket.on('disconnect', function () {
            disconnect()
        });
    }

    ///Data///
    function DataHandle(data){
        switch(data.msgName){
            case "clicking":
                sendMsgToAll("clicking",{name:(socket.id)+"clicked",x:data.x,y:data.y})
            break;

            default:
                console.log("unknown data received: "+data);
            break;
        }
    }
    socket.on('Data',DataHandle);
    
}
