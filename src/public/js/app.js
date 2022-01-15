// const { file } = require("jszip");

const socket=io();
const myPeer=new Peer(undefined,{
    host:'https://peershare-web.herokuapp.com',
    port:'3001',
    path:'/peerServer',
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

let file_name;
let file_size;
// let current_file_size=0;
// let percentComplete 

let arrayToStoreChunks = [];

//청크 사이즈
const chunkLength = 1024*1024*1;

//파일 태그를 id값으로 접근합니다.
// const file_elm=document.querySelector("#fileUpload");

//guest_avatar_div 클래스 명을 가진 태그에 접근합니다.
const guest_avatar_div=document.querySelector(".guest_avatar_div");

const none_guest_div=document.querySelector(".none_guest_div");

const file_progress_bar=document.querySelector(".file-progress_bar");
const current_progress=document.querySelector(".file-current-progress");



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
            let file_data = JSON.parse(data);
            arrayToStoreChunks.push(file_data.message); // pushing chunks in array
            if (file_data.last) {
                saveToDisk(arrayToStoreChunks.join(''),file_data.file_name);
                arrayToStoreChunks = []; // resetting array
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
            guest_avatar_profile_el.className="guest_avatar_div__profile dark:bg-white dm-transition";
            
            guest_avatar_title_el.className="guest_avatar_div__profile__title";
            guest_avatar_title_el.innerText=`식별값:${obj['peerId']}`;
            
            guest_avatar_fileicon_el.className="material-icons guest_avatar_div__profile__file-icon";
            guest_avatar_fileicon_el.innerText="upload_file";
            guest_avatar_fileicon_el.title=obj['peerId'];

            guest_avatar_file_input_el.type="file";
            guest_avatar_file_input_el.id=obj['peerId'];
            guest_avatar_file_input_el.style.display="none";
            guest_avatar_file_input_el.multiple="multiple";

            guest_avatar_file_input_el.onchange=function(event){

                //파일 전송중에는 다른 인원에게 전송못하도록 파일 아이콘을 안보이게 변경한다.
                const guest_avatar_file_icon=document.querySelectorAll(".guest_avatar_div__profile__file-icon");
                guest_avatar_file_icon.forEach((file_icon)=>{
                    file_icon.style.display="none";
                });
                if(event.target.files.length>1){
                    const zip=new JSZip(); 
                    const files=event.target.files;
                    for(let i=0; i<files.length; i++){
                        zip.file(files[i].name,files[i]);
                    }
                    zip.generateAsync({type:"blob"}).then((content)=>{
                        const reader = new window.FileReader();
                        console.log(`압축내용:${content}`);
                        file_name=`share_fileZip_${randomFileId()}.zip`;
                        reader.readAsDataURL(content);
                        reader.onload = onReadAsDataURL;
                    });
                    console.log("파일이 1개 이상입니다.");
                }else{
                    const reader = new window.FileReader();

                    const file=event.target.files[0];
                    file_name=file.name;
                    
                    reader.readAsDataURL(file);
                    reader.onload = onReadAsDataURL;
                    console.log(file);
                }
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
        //각 접속유저 파일 업로드 이미지 태그에 click시 실행되는 함수를 추가합니다.
        elem.addEventListener("click",click_file_icon);
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

function click_file_icon(event){
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
    console.log(`file_name:${file_name}`);

    if (event) text = event.target.result; // on first invocation
    if (text.length > chunkLength) {
        file_size=text.length;
        data.message = text.slice(0, chunkLength); // getting chunk using predefined chunk length
        //파일 청크를 보내서 진행률 계산하는 함수
        file_progress(data.message);

    } else {
        data.message = text;
        data.last = true;
        data.file_name=file_name;
        file_size=text.length;
        
        //파일 청크를 보내서 진행률 계산하는 함수
        file_progress(text);
        
        //percentComplete을 0으로 초기화를 해야 진행률을 0으로 초기화 할수 있다.
        percentComplete=0;

        //전송이 완료되었으므로 파일 보내기 아이콘을 다시 보이게 변경한다.
        const guest_avatar_file_icon=document.querySelectorAll(".guest_avatar_div__profile__file-icon");
        guest_avatar_file_icon.forEach((file_icon)=>{
            file_icon.style.display="";
        });

        //전송이 완료되었으므로 파일 프로그레스바를 다시 안보이게 변경한다.
        file_progress_bar.style.display="none";
        //전송이 완료되었으므로 프로그레스바를 0%으로 만들어준다.
        current_progress.style.width="0%";
        //전송이 완료되었으므로 프로그레스바를 0%으로 텍스트를 변경해준디.
        current_progress.innerText="0%";
    }
    // console.log(`data:${JSON.stringify(data)}`);
    conn.send(JSON.stringify(data)); // use JSON.stringify for chrome!

    var remainingDataURL = text.slice(data.message.length);
    if (remainingDataURL.length) setTimeout(function () {
        onReadAsDataURL(null, remainingDataURL); // continue transmitting
    }, 500);
}
//파일 겹칠수 있을때 쓰는 랜덤 이름 생성 함수
function randomFileId() {
    return Math.random().toString(36).substr(2, 16);
}

//파일 세이브시 ul태그에 li태그로 추가해서 파일 다운로드 만들기
function saveToDisk(fileUrl, fileName) {
    const ul = document.getElementById("fileUl");
    const li = document.createElement("li");
    const none_file_div_el=document.querySelector(".none_file_div");

    li.className="flex justify-center items-center";

    if(none_file_div_el.childElementCount>0){
        none_file_div_el.style.display="none";
    }
    
    const url=dataURItoBlob(fileUrl);
    const save = document.createElement('a');
    const download_icon_span = document.createElement("span");
    const delete_icon_span= document.createElement("span");
    const file_name_div=document.createElement("div");
    
    save.href =URL.createObjectURL(url);
    save.target = '_blank';
    save.className="text-2xl w-3/6 no-underline dm-transition text-black  mobile:w-3/6 dark:text-white";
    // save.download = fileName || fileUrl;
    save.addEventListener("click",file_server_download);

    file_name_div.className="truncate";
    file_name_div.innerText=fileName;

    save.append(file_name_div);
    // save.innerText=fileName;

    download_icon_span.className="material-icons text-[50px] dark:text-blue-700";
    download_icon_span.innerText="download";
    download_icon_span.addEventListener("click",file_download_icon_click);

    delete_icon_span.className="material-icons text-[50px] text-red-500";
    delete_icon_span.innerText="delete_forever";
    delete_icon_span.addEventListener("click",file_delete_icon_click);

    li.append(save);
    li.append(download_icon_span);
    li.append(delete_icon_span);

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

//파일 다운로드 함수
function file_server_download(event){
    event.preventDefault();
    
    //a 태그의 href 값을 가져오는 변수
    const a_href=event.target.parentElement.href;
    //a 태그에 있는 div가 파일명이므로 그 텍스트를 가져온다.
    const filename=event.target.innerText;

    const blob=a_href;
    saveAs(blob, filename);
}

//파일 다운로드 아이콘 클릭시 사용되는 함수
function file_download_icon_click(event){
    // console.log(event.target.previousSibling);
    const file_download_tag=event.target.previousSibling.firstChild;
    file_download_tag.click();
}
//파일 삭제 아이콘 클릭시 사용되는 함수
function file_delete_icon_click(event){
    const file_li_tag=event.path[1];
    const file_href=file_li_tag.querySelector("a").href;
    const file_ul_tag=document.querySelector("#fileUl");
    
    window.URL.revokeObjectURL(file_href);
    file_li_tag.remove();
  
    // console.log(file_ul_tag_Count);

    if(file_ul_tag.childElementCount==0){
        const none_file_div=document.querySelector(".none_file_div");
        none_file_div.style.display="";
    }    
    // console.log(event);
}


// 파일 전송 진행률을 계산해주는 함수
function file_progress(current_file_chuck){
    let current_file_size=current_file_chuck.length;
    let percentComplete = Math.floor((current_file_size / file_size)*100);

    file_progress_bar.style.display="";
    current_progress.style.width=`${percentComplete}%`;
    current_progress.innerText=`${percentComplete}%`;

    console.log(`percentComplete:${percentComplete}%`);
}


