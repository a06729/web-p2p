const socket=io();
const myPeer=new Peer(undefined,{
    host:'localhost',
    port:'3001',
    path:'/',
    config:{'iceServers':[
        { url: 'stun:stun.l.google.com:19302' },
    ]},
});

// let connection = null;

//peerId는 peer server의 고유값 입니다.
let peerId;

//peer들이 서로 연결 됬을때 쓰기위한 변수
//myPeer.connect(peerId)함수에서 연결이되면
//conn.send() 함수로 연결된 peer에 값을 보낼수 있다.
let conn;

//fireBase db의 고유 글 번호
let fireDocId;

let file;
let arrayToStoreChunks = [];

//청크 사이즈
const chunkLength = 1024*255;

//파일 태그를 id값으로 접근합니다.
// const file_elm=document.querySelector("#fileUpload");

//guest_avatar_div 클래스 명을 가진 태그에 접근합니다.
const guest_avatar_div=document.querySelector(".guest_avatar_div");

const none_guest_div=document.querySelector(".none_guest_div");

//아바타에 들어가는 이미지 api 주소 값 입니다.
const avatar_api_url="https://avatars.dicebear.com/api/bottts";

myPeer.on('open',(id)=>{
    const avatar_img=document.getElementById("my_avatar_img");
    const avatar_avatar_peerId=document.querySelector(".my_avatar_div__profile__title");
    socket.emit("join-room",ROOM_ID,id,addFireDocId);
    peerId=id;
    avatar_img.src=`${avatar_api_url}/${peerId}.svg`;
    avatar_img.title=peerId;
    avatar_avatar_peerId.innerHTML=`식별값:${peerId}`;

    guest_avatar_div.style.display="none";
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
                conn.close();
            }
        });
    });
});


//peerA(크롬 브라우저)
socket.on("user-connected",(userlist)=>{   
    console.log(`peerA:${userlist}`);
    socket.emit("user-connected",ROOM_ID,userlist,addGuestAvatar);
    addGuestAvatar(userlist);
});

//peerB(브레이브 브라우저)
socket.on("connected-user",(userlist)=>{
    console.log(`peerB:${userlist}`);
    socket.emit("connected-user",ROOM_ID,userlist);
    addGuestAvatar(userlist);
});


socket.on("user-leave",(userList)=>{
    addGuestAvatar(userList);
});

//게스트 아바타를 생성해주는 함수
function addGuestAvatar(userList){

    //기존에 있는 게스트 img태그 전부 가져오기
    const guest_avatar_div__profile_all=document.querySelectorAll(".guest_avatar_div__profile");
    
    //접속할때 마다 게스트 아바타를 전부 리셋
    guest_avatar_div__profile_all.forEach((guest)=>{
        guest.remove();
    });

    //접속되어 있는 유저들을 이미지 태그에 표시하는 기능
    userList.forEach(obj => {
        console.log(obj);
        const img_el=document.createElement("img");
        const guest_avatar_profile_el=document.createElement("div");
        const guest_avatar_title_el=document.createElement("div");
        const guest_avatar_fileicon_el=document.createElement("span");

        const guest_avatar_file_input_el=document.createElement("input");

        if(obj['peerId']!=peerId){
            guest_avatar_profile_el.className="guest_avatar_div__profile";
            
            guest_avatar_title_el.className="guest_avatar_div__profile__title";
            guest_avatar_title_el.innerText=`식별값:${obj['peerId']}`;
            
            guest_avatar_fileicon_el.className="material-icons guest_avatar_div__profile__file-icon";
            guest_avatar_fileicon_el.innerText="upload_file";
            guest_avatar_fileicon_el.title=obj['peerId'];

            guest_avatar_file_input_el.type="file";
            guest_avatar_file_input_el.id=obj['peerId'];
            guest_avatar_file_input_el.style.display="none";
            guest_avatar_file_input_el.onchange=function(event){
                const reader = new window.FileReader();
                
                file=event.target.files[0];
                reader.fileName=file.name;
                reader.readAsDataURL(file);
                reader.onload = onReadAsDataURL;
                console.log("태그에 입력");
                console.log(file);
            }

            img_el.src=`${avatar_api_url}/${obj['peerId']}.svg `;
            img_el.className="guest_avatar_div__profile__img";
            img_el.title=obj['peerId'];
            img_el.id=obj['id'];

            guest_avatar_profile_el.appendChild(img_el);
            guest_avatar_profile_el.appendChild(guest_avatar_title_el);
            guest_avatar_profile_el.appendChild(guest_avatar_fileicon_el);
            guest_avatar_profile_el.appendChild(guest_avatar_file_input_el);

            guest_avatar_div.appendChild(guest_avatar_profile_el);

        }
        if(obj['peerId']===peerId){
            fireDocId=obj['id'];
        }
    });
    
    //접속유저가 없으면 유저창을 안보이게 그리고 유저가 없는 창을 보이게 한다.
    if(guest_avatar_div.childElementCount===0){
        guest_avatar_div.style.display="none";
        none_guest_div.style.display="";
    }else{ //접속유저가 있을 경우 유저가 없는 창을 안보이게 한다.
        guest_avatar_div.style.display="";
        none_guest_div.style.display="none";
    }
    //접속유저 이미지 태그를 전부 가져옵니다.
    // document.querySelectorAll(".guest_avatar_div__profile__img").forEach((elem,index)=>{
    //     //각 접속유저 이미지 태그에 click시 실행되는 함수를 추가합니다.
    //     elem.addEventListener("click",click_guest_avatar);
    // });
    document.querySelectorAll(".guest_avatar_div__profile__file-icon").forEach((elem,index)=>{
        //각 접속유저 이미지 태그에 click시 실행되는 함수를 추가합니다.
        elem.addEventListener("click",clic_file_icon);
    });
}


//소켓 서버에 접속시 fireBase db에서 글에 고유값을 가져옵니다.
//이것이 있어야 fireBase db에 있는 room에 접속된 유저를 식별하고
//브라우저 종료시 삭제가 가능합니다.
function addFireDocId(userData){
    fireDocId=userData['id'];
}

//브라우저 종료시 실행되는 함수
function winClose(){
    //브라우저가 종료되면 서버에 user-leave 함수를 실행
    socket.emit('user-leave',ROOM_ID,peerId,fireDocId);
}
function clic_file_icon(event){
    const id=event.target.title;
    const file_btn=document.getElementById(`${id}`);
    conn=myPeer.connect(file_btn.id);
    file_btn.click();
}

//클릭한 아바타 값을 가져온다.
// function click_guest_avatar(event){
//     const guest_peer_id=event.target.title;
//     conn=myPeer.connect(guest_peer_id);
    
//     //파일태그 클릭을 방생시키는 함수
//     document.getElementById('fileUpload').click();
    
//     console.log(guest_peer_id);

// }


function onReadAsDataURL(event, text) {
    var data = {}; // data object to transmit over data channel

    if (event) text = event.target.result; // on first invocation

    if (text.length > chunkLength) {
        data.message = text.slice(0, chunkLength); // getting chunk using predefined chunk length
    } else {
        data.message = text;
        data.last = true;
        data.file_name=file.name;
    }
    console.log(`data:${JSON.stringify(data)}`);
    conn.send(JSON.stringify(data)); // use JSON.stringify for chrome!

    var remainingDataURL = text.slice(data.message.length);
    if (remainingDataURL.length) setTimeout(function () {
        onReadAsDataURL(null, remainingDataURL); // continue transmitting
    }, 500);
}

//파일 세이브시 ul태그에 li태그로 추가해서 파일 다운로드 만들기
function saveToDisk(fileUrl, fileName) {
    const ul = document.getElementById("fileUl");
    const li = document.createElement("li");
    const none_file_div_el=document.querySelector(".none_file_div");
    
    if(none_file_div_el.childElementCount>0){
        none_file_div_el.style.display="none";
    }
    const url=dataURItoBlob(fileUrl);
    var save = document.createElement('a');
    save.href =URL.createObjectURL(url);
    save.target = '_blank';
    // save.download = fileName || fileUrl;
    save.addEventListener("click",file_server_download);


    save.innerText=fileName;

    li.append(save);

    ul.append(li);
}

function dataURItoBlob(dataURI) {
    const byteString = atob(dataURI.split(',')[1]);
    const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0]
    
    const ab = new ArrayBuffer(byteString.length);
    let ia = new Uint8Array(ab);
    
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    const blob = new Blob([ab], {type: mimeString});
    return blob;
}

function file_server_download(event){
    event.preventDefault();
    const filename=event.target.text;
    const blob=event.target.href;
    saveAs(blob, filename);
}

// function stream_download(event){
//     event.preventDefault();
//     const filename=event.target.text;
//     const href_blob=event.target.href;
//     const blob=dataURItoBlob(href_blob);
//     const fileStream=streamSaver.createWriteStream(filename,{
//         size:blob.size
//     });

//     const readableStream=blob.stream();

//     if(window.WritableStream&&readableStream.pipeTo){
//         return readableStream.pipeTo(fileStream).then(()=>{
//             console.log("done writing");
//         });
//     }
//     window.writer = fileStream.getWriter();

//     const reader = readableStream.getReader();
//     const pump = () => reader.read()
//       .then(res => res.done
//         ? writer.close()
//         : writer.write(res.value).then(pump));

//     pump();
// }

//파일 태그에서 파일이 업로드가되면 발생하는 이벤트
// file_elm.addEventListener("change",(event)=>{
//     event.preventDefault();
    
//     const reader = new window.FileReader();
    
//     file=event.target.files[0];
//     reader.fileName=file.name;
//     reader.readAsDataURL(file);
//     reader.onload = onReadAsDataURL;
    
//     console.log(file);
// });