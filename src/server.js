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
    socket.on("join-room",async(roomId,peerId)=>{
        let userlist=[];
        await dbService.collection("room").add({
            socketId:socket.id,
            roomId:roomId,
            peerId:peerId
        });
        const roomRef=dbService.collection('room');
        const snapshot=await roomRef.where('roomId','==',roomId).get();
        snapshot.forEach(doc=>{
            console.log(doc.data());
            const userObj={
                ...doc.data()
            }
            userlist.push(userObj);
        });
        // done(userlist[userlist.length-1]);

        socket.join(roomId);
        socket.to(roomId).emit('user-connected',userlist);

    });
    socket.on('user-connected',(roomId,peerId,done)=>{
        socket.to(roomId).emit('connected-user',peerId);
    });
    socket.on('connected-user',(roomId,peerId,done)=>{
        socket.to(roomId).emit('insert-user',peerId);
        
    });

    // socket.on('user-leave',async(roomId,peerId,fireDocId)=>{
    //     let userlist=[];
    //     console.log(`fireDocId:${fireDocId}`);
    //     console.log(`유저 ${peerId} 가 떠났습니다.`);
    //     await dbService.collection(`room`).doc(fireDocId).delete();
        
    //     const roomRef=dbService.collection('room');
    //     const snapshot=await roomRef.where('roomId','==',roomId).get();
    //     snapshot.forEach(doc=>{
    //         console.log(doc.data());
    //         const userObj={
    //             id:doc.id,
    //             ...doc.data()
    //         }
    //         userlist.push(userObj);
    //     });
    //     socket.to(roomId).emit("user-leave",userlist);
    //     socket.leave(roomId);
    // });
    socket.on("disconnect",async()=>{
        // console.log("SOCKETIO disconnect EVENT: ", socket.id, " client disconnect");
        await dbService.collection(`room`)
        .where("socketId","==",socket.id)
        .get()
        .then((qs)=>{
            qs.forEach(async (doc)=> {
                let userlist=[];
                const doc_obj=doc.data();
                // console.log(`doc_obj:${doc_obj.roomId}`);
                await dbService.collection(`room`).doc(doc.id).delete();
                const roomRef=dbService.collection('room');
                const snapshot=await roomRef.where('roomId','==',doc_obj.roomId).get();
                snapshot.forEach(doc=>{
                    const userObj={
                        id:doc.id,
                        ...doc.data()
                    }
                    userlist.push(userObj);
                });
                socket.to(doc_obj.roomId).emit("user-leave",userlist);
                // console.log(doc.id, " => ", doc.data());
            });;
        });
    });
});

// const peerServer = ExpressPeerServer(httpServer, {
//     debug: true,
// });

// app.use('/peerServer', peerServer);


httpServer.listen(port,()=>{
    console.log("서버 시작");
});