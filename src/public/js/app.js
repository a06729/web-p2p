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
let file;
let arrayToStoreChunks = [];


const chunkLength = 65535;

const file_elm=document.querySelector("#fileUpload")

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
            console.log(`data:${JSON.parse(data)}`)
            let file_data = JSON.parse(data);
            arrayToStoreChunks.push(file_data.message); // pushing chunks in array
            if (file_data.last) {
                saveToDisk(arrayToStoreChunks.join(''),file_data.file_name);
                arrayToStoreChunks = []; // resetting array
            }
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
    document.querySelectorAll(".guest_avatar_img").forEach((elem,index)=>{
        elem.addEventListener("click",click_guest_avatar);
    });
}

function addFireDocId(userData){
    fireDocId=userData['id'];
}

function winClose(){
    socket.emit('user-leave',ROOM_ID,peerId,fireDocId);
}

//클릭한 아바타 값을 가져온다.
function click_guest_avatar(event){
    const guest_peer_id=event.target.title;
    conn=myPeer.connect(guest_peer_id);
    
    document.getElementById('fileUpload').click();
    
    console.log(guest_peer_id);

    
}

function onReadAsDataURL(event, text) {
    var data = {}; // data object to transmit over data channel

    if (event) text = event.target.result; // on first invocation

    if (text.length > chunkLength) {
        data.message = text.slice(0, chunkLength); // getting chunk using predefined chunk length
    } else {
        data.message = text;
        data.last = true;
        data.file_name=event.target.fileName;
    }
    console.log(`data:${JSON.stringify(data)}`);
    conn.send(JSON.stringify(data)); // use JSON.stringify for chrome!

    var remainingDataURL = text.slice(data.message.length);
    if (remainingDataURL.length) setTimeout(function () {
        onReadAsDataURL(null, remainingDataURL); // continue transmitting
    }, 500)
}

function saveToDisk(fileUrl, fileName) {
    const ul = document.getElementById("fileUl");
    const li = document.createElement("li");
    var save = document.createElement('a');
    save.href = fileUrl;
    save.target = '_blank';
    save.download = fileName || fileUrl;

    save.innerText=fileName;

    li.append(save);

    ul.append(li);
}



file_elm.addEventListener("change",(event)=>{
    event.preventDefault();
    
    const reader = new window.FileReader();
    
    file=event.target.files[0];
    reader.fileName=file.name;
    reader.readAsDataURL(file);
    reader.onload = onReadAsDataURL;
    
    console.log(file);
});