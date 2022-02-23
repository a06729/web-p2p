import express, { json } from "express";
import ejs from "ejs";
import http from "http";
import SocketIO from "socket.io";
import dbService,{FieldValue} from "./fbase/firebase";

const {v4:uuidV4}=require("uuid");
// const { ExpressPeerServer } = require('peer');

require('dotenv').config();
const port = process.env.PORT || 8080;
const app=express(); 

app.set("view engine","ejs");
app.set("views",__dirname+"/public/views");

app.use("/public",express.static(__dirname+"/public",{
    setHeaders:(res)=>{
        //Service-Worker-Allowed,'/' 이렇게 해줘야  manifest.json에 scope start_url을 '/'로 할수 있다.
        res.setHeader('Service-Worker-Allowed', '/');
    }
}));
// manifest.json에 scope,start_url 를 '/'경로 하면 '/'경로로 정적파일을 가져올수 있도록 해야한다.
app.use("/",express.static(__dirname+"/offline",{
    setHeaders:(res)=>{
        res.setHeader('Service-Worker-Allowed', '/');
    }
}));

app.get("/",(req,res)=>{
    res.redirect(`/${uuidV4()}`);
});
app.get("/:room",(req,res)=>{
    res.render('index',{
        roomId:req.params.room,
        KakaoApi:process.env.KakaoApi
    });
});

const httpServer=http.createServer(app);

const wsServer=SocketIO(httpServer);
wsServer.on("connection",(socket)=>{  
    console.log(`접속한 소켓 아이디:${socket.id}`);
    socket.prependAny((eventName, ...args) => {
        console.log(`eventName:${eventName}`);
    });
    socket.on("join-room",async(roomId,peerId)=>{
        // let userlist=[];
        dbService.doc(`room/${roomId}`).get().then(async(doc) => {
            let userlist=[];
            if (doc.exists) {
                await dbService.doc(`room/${roomId}`).update({
                    users:FieldValue.arrayUnion({
                            socketId:socket.id,
                            peerId:peerId
                        })
                });
            } else {
                await dbService.doc(`room/${roomId}`).set({
                    roomId:roomId,
                    users:[{
                        socketId:socket.id,
                        peerId:peerId
                    }]
                });
            }
            const user_doc=await dbService.doc(`room/${roomId}`).get();
            // console.log(`userlist:${JSON.stringify(user_doc.data()['users'])}`);
            userlist=user_doc.data()['users'];
            socket.join(roomId);
            socket.to(roomId).emit('user-connected',userlist);

        }).catch((error) => {
            console.log("Error getting document:", error);
        });


    });
    socket.on('user-connected',(roomId,peerId,done)=>{
        socket.to(roomId).emit('connected-user',peerId);
    });
    socket.on('connected-user',(roomId,peerId,done)=>{
        socket.to(roomId).emit('insert-user',peerId);
        
    });


    socket.on("file-allow-request",(target_soket_id,sender_soket_id,file_name,target_peer_id)=>{
        console.log(`파일 요청 허용을 보내는 대상 소켓:${target_soket_id}`);
        wsServer.to(target_soket_id).emit("file-allow-request",sender_soket_id,target_soket_id,file_name,target_peer_id);
    });

    socket.on("file-cancel-request",(close_target_soket_id,close_sender_soket_id)=>{
        wsServer.to(close_target_soket_id).emit("file-cancel-request",close_target_soket_id,close_sender_soket_id);
    });

    socket.on("file-download-allow",(senderSoketId,targetSoketId,fileName,peerId)=>{
        wsServer.to(senderSoketId).emit("file-download-allow",targetSoketId,fileName,peerId);
    });
    socket.on("file-download-denial",(senderSoketId,targetSoketId)=>{
        wsServer.to(senderSoketId).emit("file-download-denial",targetSoketId);
    });

    socket.on("disconnecting",async () => {
        
        const rooms=[...socket.rooms];//object set값 가져오는법
        const disconn_room=rooms.filter(room=> room!=socket.id);
        // console.log(`disconn_room:${disconn_room}`);
        const users_data = await (await dbService.doc(`room/${disconn_room}`).get()).data();
        const del_user_data=users_data['users'].filter(user=>user.socketId !=socket.id);
        if(del_user_data.length === 0){
            dbService.doc(`room/${disconn_room}`).delete();
        }else{
            dbService.doc(`room/${disconn_room}`).update({
                users:del_user_data
            });
        }
        socket.to(disconn_room).emit("user-leave",del_user_data);

    });
    socket.on("disconnect",async(reason)=>{
        console.log(`reason:${reason}`);
        console.log("SOCKETIO disconnect EVENT: ", socket.id, " client disconnect");
    });
});

httpServer.listen(port,()=>{
    console.log("서버 시작");
});