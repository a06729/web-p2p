const socket=io();
const myPeer=new Peer(undefined,{
    host:'localhost',
    port:'3001',
    path:'/',
    config:{'iceServers':[
        { url: 'stun:stun.l.google.com:19302' },
    ]},
});

let connection = null;
let peerId;
let conn;
let fireDocId;

const guest_avatar_div=document.querySelector(".guest_avatar_div");

const avatar_api_url="https://avatars.dicebear.com/api/bottts";

myPeer.on('open',(id)=>{
    const avatar_img=document.getElementById("my_avatar_img");
    socket.emit("join-room",ROOM_ID,id,addFireDocId);
    peerId=id;
    avatar_img.src=`${avatar_api_url}/${peerId}.svg`;
    avatar_img.title=peerId;
});
myPeer.on('connection',function(dataConnection){
    dataConnection.on("open",function(){
        dataConnection.on('data',function(data){
            // connection=dataConnection;
            // connection.send("나이스");
            console.log("data:"+data);
        });
        // conn.send("conn 센드");
    });
});


//peerA(크롬 브라우저)
socket.on("user-connected",(userlist)=>{   
    console.log(`peerA:${userlist}`);
    socket.emit("user-connected",ROOM_ID,userlist,addGuestAvatar);
    addGuestAvatar(userlist);
    // conn = myPeer.connect(userId);
});

//peerB(브레이브 브라우저)
socket.on("connected-user",(userlist)=>{
    console.log(`peerB:${userlist}`);
    socket.emit("connected-user",ROOM_ID,userlist);
    addGuestAvatar(userlist);
    // conn = myPeer.connect(userId);
});


socket.on("user-leave",(userList)=>{
    addGuestAvatar(userList);
});

//게스트 아바타를 생성해주는 함수
function addGuestAvatar(userList){
    const guest_avatar_all=document.querySelectorAll(".guest_avatar_img");
    //접속할때 마다 게스트 아바타를 전부 리셋
    guest_avatar_all.forEach((guest)=>{
        guest.remove();
    });

    userList.forEach(obj => {
        console.log(obj);
        const img_el=document.createElement("img");
        if(obj['peerId']!=peerId){
            img_el.src=`${avatar_api_url}/${obj['peerId']}.svg `;
            img_el.className="guest_avatar_img";
            img_el.title=obj['peerId'];
            img_el.id=obj['id'];
            guest_avatar_div.appendChild(img_el);
        }
        if(obj['peerId']===peerId){
            fireDocId=obj['id'];
        }
    });
}

function addFireDocId(userData){
    fireDocId=userData['id'];
}

function winClose(){
    socket.emit('user-leave',ROOM_ID,peerId,fireDocId);
}
