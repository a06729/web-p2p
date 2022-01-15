import express from "express";
import ejs from "ejs";
import http from "http";
import SocketIO from "socket.io";
import dbService from "./fbase/firebase";


const {v4:uuidV4}=require("uuid");
const { ExpressPeerServer } = require('peer');

require('dotenv').config();
const port = process.env.PORT || 8080;
const app=express(); 

app.set("view engine","ejs");
app.set("views",__dirname+"/public/views");

app.use("/public",express.static(__dirname+"/public"));

app.get("/",(req,res)=>{
    res.redirect(`/${uuidV4()}`);
    
});
app.get("/:room",(req,res)=>{
    console.log(process.env.KakaoApi);
    res.render('index',{
        roomId:req.params.room,
        KakaoApi:process.env.KakaoApi
    });
});

const httpServer=http.createServer(app);

const wsServer=SocketIO(httpServer);
wsServer.on("connection",(socket)=>{    
    socket.on("join-room",async(roomId,peerId,done)=>{
        let userlist=[];
        await dbService.collection("room").add({
            roomId:roomId,
            peerId:peerId
        });
        const roomRef=dbService.collection('room');
        const snapshot=await roomRef.where('roomId','==',roomId).get();
        snapshot.forEach(doc=>{
            console.log(doc.data());
            const userObj={
                id:doc.id,
                ...doc.data()
            }
            userlist.push(userObj);
        });
        done(userlist[userlist.length-1]);

        socket.join(roomId);
        socket.to(roomId).emit('user-connected',userlist);

    });
    socket.on('user-connected',(roomId,peerId,done)=>{
        socket.to(roomId).emit('connected-user',peerId);
    });
    socket.on('connected-user',(roomId,peerId,done)=>{
        socket.to(roomId).emit('insert-user',peerId);
        
    });

    socket.on('user-leave',async(roomId,peerId,fireDocId)=>{
        let userlist=[];
        console.log(`fireDocId:${fireDocId}`);
        console.log(`유저 ${peerId} 가 떠났습니다.`);
        await dbService.collection(`room`).doc(fireDocId).delete();
        
        const roomRef=dbService.collection('room');
        const snapshot=await roomRef.where('roomId','==',roomId).get();
        snapshot.forEach(doc=>{
            console.log(doc.data());
            const userObj={
                id:doc.id,
                ...doc.data()
            }
            userlist.push(userObj);
        });
        socket.to(roomId).emit("user-leave",userlist);
        socket.leave(roomId);
    });
});

// const peerServer = ExpressPeerServer(httpServer, {
//     debug: true,
// });

// app.use('/peerServer', peerServer);


httpServer.listen(port,()=>{
    console.log("서버 시작");
});