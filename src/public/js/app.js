import sns from "./sns.js";
import QRious from "./qrious.js";
import darkMode from "./darkMode.js";
// import reset_css from "../css/reset.css";

//window.함수이름 으로 설정해주여야 번들링 했을때 tag의 onclick을 인식한다.
window.shareKakao = sns.shareKakao;
window.shareTelegram = sns.shareTelegram;
window.sharUrl = sns.sharUrl;
window.handleDarkMode=darkMode.handleDarkMode;
window.qr_gen=qr_ge;

darkMode.darkModeInit();
Kakao.init(KakaoApi);

function qr_ge(){
    let qr = new QRious({
        element: document.getElementById('qr-code'),
        size: 200,
        value: `${window.location.href}`
    });
}

const socket=io();
const myPeer=new Peer(undefined,{
    host:'custom-peerserver.herokuapp.com',
    path:'/peerjs/myapp',
    secure: true,
    config:{'iceServers':[
        { url: "stun:stun1.l.google.com:19302" },
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
// let fireDocId;

//파일 이름 저장 변수
let file_name;

//파일이 로드가 다 되었을때 파일 크기를 저장하는 변수
let file_size;

//보내진 청크 크기를 저장 하는 변수
let current_file_size=0;

//현재 파일 전송이 진행된 퍼센트를 저장하는 변수
let percentComplete=0;

// let arrayToStoreChunks = [];

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

const clickEvent=(function() {
    if ('onTouchDown ' in document.documentElement === true) {
      return 'onTouchDown';
    } else {
      return 'click';
    }
  })();

myPeer.on('open',(id)=>{
    const avatar_img=document.getElementById("my_avatar_img");
    const avatar_avatar_peerId=document.querySelector(".my_avatar_div__profile__title");
    socket.emit("join-room",ROOM_ID,id);
    peerId=id;
    avatar_img.src=`${avatar_api_url}/${peerId}.svg`;
    avatar_img.title=peerId;
    avatar_avatar_peerId.innerHTML=`식별값:${peerId}`;

    // guest_avatar_div.style.display="none";
});

myPeer.on('connection',function(dataConnection){
    dataConnection.on("open",function(){
        let arrayToStoreChunks = [];
        const pg_div=document.querySelector(".receive_file_pg_div");
        const pg_bar=document.createElement("progress");
        const receive_file_name_h3=document.createElement("h3");
        // let receive_file_size=0;
        let percentComplete=0;
        dataConnection.on('data',async function(data){
            let file_data = JSON.parse(data);
            arrayToStoreChunks.push(file_data.message); // pushing chunks in array 
            
            //파일 사이즈는 처음 보내는 겍체 에만 있기때문에
            //처음에는 파일사이즈가 포함되어서 오기 때문에 if문을 실행한다.
            //처음이 아닌때는 파일 사이즈가 없으므로 if문을 실행을 안한다.
            //그러므로 if문은 한번만 실행된다.
            if(file_data.file_size!=null){
                pg_div.appendChild(receive_file_name_h3);
                pg_div.appendChild(pg_bar);
                // receive_file_size=file_data.file_size;
                
                pg_bar.id=file_data.file_name;
                pg_bar.className="w-full";
                pg_bar.max=100;
                
                receive_file_name_h3.className="text-center text-slate-500 my-3 text-2xl dark:text-white dm-transition";
                receive_file_name_h3.id=`h3-${file_data.file_name}`;
                receive_file_name_h3.innerText=`${file_data.file_name}파일 전송 받는중`;
            }
            
            
            percentComplete=file_data.percentComplete;
            // percentComplete=await file_progress(file_data.message.length,receive_file_size);
            pg_bar.value=percentComplete;
            console.log(`file_data.percentComplete:${file_data.percentComplete}`);
            // console.log(`receive_file_size:${receive_file_size}`);

            if (file_data.last) {
                console.log(`arrayToStoreChunks:${arrayToStoreChunks}`);
                pg_bar.value=0;
                // receive_file_size=0;
                document.getElementById(`${file_data.file_name}`).remove();
                document.getElementById(`h3-${file_data.file_name}`).remove();
                saveToDisk(arrayToStoreChunks.join(''),file_data.file_name);
                arrayToStoreChunks = []; // resetting array
                // dataConnection.close();
            }

            dataConnection.on("close",()=>{
                console.log("데이터 커넥션이 닫쳤습니다.");
                arrayToStoreChunks = [];
                pg_bar.value=0;
                document.getElementById(`${file_data.file_name}`).remove();
                document.getElementById(`h3-${file_data.file_name}`).remove();
            });
        });

    });
});

myPeer.on('disconnected', function() {
    console.log("peerjs 서버에서 연결 종료");
    //기존에 있는 게스트 img태그 전부 가져오기
    const guest_avatar_div__profile_all=document.querySelectorAll(".guest_avatar_div__profile");
    //접속할때 마다 게스트 아바타를 전부 리셋
    guest_avatar_div__profile_all.forEach((guest)=>{
        guest.remove();
    });
    guest_avatar_div.style.display="none";
    none_guest_div.style.display="";

    myPeer.reconnect();
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
            
            guest_avatar_file_input_el.addEventListener('change',fileChange);

            // guest_avatar_file_input_el.onchange=function(event){
            //     console.log(`보낼상대 peerId:${event.target.id}`);
            //     conn=myPeer.connect(event.target.id);
            //     //파일 전송중에는 다른 인원에게 전송못하도록 파일 아이콘을 안보이게 변경한다.
            //     const guest_avatar_file_icon=document.querySelectorAll(".guest_avatar_div__profile__file-icon");
            //     guest_avatar_file_icon.forEach((file_icon)=>{
            //         file_icon.style.display="none";
            //     });
            //     if(event.target.files.length>1){
            //         const zip=new JSZip(); 
            //         const files=event.target.files;
            //         for(let i=0; i<files.length; i++){
            //             zip.file(files[i].name,files[i],{base64: true});
            //         }
            //         zip.generateAsync({type:"blob",compression: "DEFLATE",compressionOptions:{level: 1}},
            //         function updateCallback(metadata) {
            //             console.log(`압축률:${metadata.percent}%`);
            //         }).then((content)=>{
            //             const reader = new window.FileReader();
            //             console.log(`압축내용:${content}`);
            //             file_name=`share_fileZip_${randomFileId()}.zip`;
            //             reader.readAsDataURL(content);
            //             reader.onload = onReadAsDataURL;
            //         });
            //         // console.log("파일이 1개 이상입니다.");
            //     }else{
            //         const reader = new window.FileReader();
            //         const file=event.target.files[0];
            //         file_name=file.name;
            //         reader.readAsDataURL(file);

            //         // conn=myPeer.connect(event.target.id);

            //         reader.onload = onReadAsDataURL;

            //     }
            // }

            img_el.src=`${avatar_api_url}/${obj['peerId']}.svg `;
            img_el.className="guest_avatar_div__profile__img";
            img_el.title=obj['peerId'];
            img_el.id=obj['socketId'];

            guest_avatar_profile_el.appendChild(img_el);
            guest_avatar_profile_el.appendChild(guest_avatar_title_el);
            guest_avatar_profile_el.appendChild(guest_avatar_fileicon_el);
            guest_avatar_profile_el.appendChild(guest_avatar_file_input_el);

            guest_avatar_div.appendChild(guest_avatar_profile_el);

        }
        // if(obj['peerId']===peerId){
        //     fireDocId=obj['id'];
        // }
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
// function addFireDocId(userData){
//     fireDocId=userData['id'];
// }

// //브라우저 종료시 실행되는 함수
// function winClose(){
//     //브라우저가 종료되면 서버에 user-leave 함수를 실행
//     socket.emit('user-leave',ROOM_ID,peerId,fireDocId);
// }

function click_file_icon(event){
    console.log(`파일클릭 이벤트:${event}`);
    const id=event.target.title;
    const file_btn=document.getElementById(`${id}`);
    conn=myPeer.connect(id);
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


 async function onReadAsDataURL(event, text) {
    let data = {}; // data object to transmit over data channel
    console.log(`file_name:${file_name}`);
    
    //처음 함수 시작하면 초기 세팅 값을 넣는다.
    //재귀함수로 할때 event 파라미터를 null로 보내서 1번만 실행된다.
    //재귀함수로 불러질때 text 파라미터는 remainingDataURL 변수(자르고 남은 파일 값)을 가진다.
    if (event){
        text = event.target.result; // on first invocation  
        //파일이 로드 되었을때 파일 크기를 file_size에 저장
        file_size=text.length;
        //파일 사이즈를 peer들에게 보내기위해 객체에 저장한다.
        //
        data.file_size=file_size;

        data.file_name=file_name;
        file_progress_bar.style.display="";
    } 
        
    if (text.length > chunkLength) {
        data.message = text.slice(0, chunkLength); // getting chunk using predefined chunk length
        //파일 청크를 보내서 진행률 계산하는 함수
        const percentComplete= await file_progress(data.message.length,file_size);
        
        //파일청크 진행률을 peer들한테도 보내서 peer들도 파일 전송 현황을 알수 있도록
        //파일을 보낼때 진행률도 같이 객체에 추가해서 보낸다.
        data.percentComplete=percentComplete;

        current_progress.style.width=`${percentComplete}%`;
        current_progress.innerText=`${percentComplete}%`;

    } else {
        data.message = text;
        data.last = true;
        data.file_name=file_name;
        //파일 청크를 보내서 진행률 계산하는 함수
        // const percentComplete = await file_progress(data.message.length);
        
        //percentComplete을 0으로 초기화를 해야 진행률을 0으로 초기화 할수 있다.
        percentComplete=0;
        current_file_size=0;

        //파일을 보낼때 진행률도 같이 객체에 추가해서 보낸다.
        data.percentComplete=percentComplete;

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

    let remainingDataURL = text.slice(data.message.length);
    if (remainingDataURL.length) setTimeout(function () {
        //재귀함수 방법으로 함수를 불러냄
        onReadAsDataURL(null, remainingDataURL); // continue transmitting
    }, 500);
}
//파일 겹칠수 있을때 쓰는 랜덤 이름 생성 함수
function randomFileId() {
    return Math.random().toString(36).substr(2, 16);
}

//파일 세이브시 ul태그에 li태그로 추가해서 파일 다운로드 만들기
async function saveToDisk(fileUrl, fileName) {
    const ul = document.getElementById("fileUl");
    const li = document.createElement("li");
    const none_file_div_el=document.querySelector(".none_file_div");

    li.className="flex justify-center items-center";

    if(none_file_div_el.childElementCount>0){
        none_file_div_el.style.display="none";
    }
    
    const url=await dataURItoBlob(fileUrl);
    // const url=fileUrl;
    const save = document.createElement('a');
    const download_icon_span = document.createElement("span");
    const delete_icon_span= document.createElement("span");
    const file_name_div=document.createElement("div");
    
    save.href =url;
    // save.target = '_blank';
    save.className="text-2xl w-3/6 no-underline dm-transition text-black  mobile:w-3/6 dark:text-white";
    // save.download = fileName || fileUrl;
    save.addEventListener(clickEvent,file_server_download);
    // save.onclick=file_server_download;

    file_name_div.className="truncate";
    file_name_div.innerText=fileName;

    save.append(file_name_div);
    // save.innerText=fileName;

    download_icon_span.className="material-icons text-[50px] dark:text-blue-700";
    download_icon_span.innerText="download";
    download_icon_span.addEventListener(clickEvent,file_download_icon_click);
    // download_icon_span.onclick=file_download_icon_click;

    delete_icon_span.className="material-icons text-[50px] text-red-500";
    delete_icon_span.innerText="delete_forever";
    delete_icon_span.onclick=file_delete_icon_click;
    
    li.append(save);
    li.append(download_icon_span);
    li.append(delete_icon_span);

    ul.append(li);
}

function dataURItoBlob(dataURI) {
    return new Promise((resolve,reject)=>{
        try{
            const byteString = atob(dataURI.split(',')[1]);
            const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0]
    
            const ab = new ArrayBuffer(byteString.length);
            let ia = new Uint8Array(ab);
            
            for (let i = 0; i < byteString.length; i++) {
              ia[i] = byteString.charCodeAt(i);
            }
            // const blob = new Blob([ab], {type: mimeString});
            // return blob;
            resolve(URL.createObjectURL(new Blob([ab], {type: mimeString})));
        }catch(err){
            reject(err);
        }
    });

}

//파일 다운로드 함수
function file_server_download(event){
    event.preventDefault();
    //a 태그의 href 값을 가져오는 변수
    const a_href=event.target.parentElement.href;
    //a 태그에 있는 div가 파일명이므로 그 텍스트를 가져온다.
    const filename=event.target.innerText;

    // const blob=dataURItoBlob(a_href);
    // const blob_url=dataURItoBlob(a_href);

    saveAs(a_href, filename);
    window.URL.revokeObjectURL(a_href);
}

//파일 다운로드 아이콘 클릭시 사용되는 함수
function file_download_icon_click(event){
    event.preventDefault();
    const file_download_tag=event.target.previousSibling.firstChild;
    file_download_tag.click();
}
//파일 삭제 아이콘 클릭시 사용되는 함수
function file_delete_icon_click(event){
    try{
        const file_li_tag=event.target.parentElement;
        const file_href=file_li_tag.querySelector("a").href;
        const file_ul_tag=document.querySelector("#fileUl");
        URL.revokeObjectURL(file_href);
        file_li_tag.remove();
        if(file_ul_tag.childElementCount==0){
            const none_file_div=document.querySelector(".none_file_div");
            none_file_div.style.display="";
        }    
        // console.log(event);
    }catch(err){
        alert(err);
    };
}


// 파일 전송 진행률을 계산해주는 함수
function file_progress(current_file_chuck,file_size){
    return new Promise((resolve,reject)=>{
        try{
            console.log(`file_size:${file_size}`);

            //현재 어디 청크까지 표시하는 변수
            current_file_size=current_file_size+current_file_chuck;
            //현재 어디까지 파일이 파일이 보내졌는지 보여주는 퍼센트
            percentComplete =Math.floor((current_file_size / file_size)*100);
        
            // console.log(`current_file_size:${current_file_size}`);
            resolve(percentComplete);

        }catch(err){
            console.log(`err:${err}`);
        }
    });
    
    // console.log(`file_size:${file_size}`);

    // //현재 어디 청크까지 표시하는 변수
    // current_file_size=current_file_size+current_file_chuck;
    // //현재 어디까지 파일이 파일이 보내졌는지 보여주는 퍼센트
    // percentComplete =Math.floor((current_file_size / file_size)*100);

    // // console.log(`current_file_size:${current_file_size}`);

    // file_progress_bar.style.display="";
    // current_progress.style.width=`${percentComplete}%`;
    // current_progress.innerText=`${percentComplete}%`;

    // console.log(`percentComplete:${percentComplete}%`);
    
    
}

function fileChange(event){
    // console.log(`보낼상대 peerId:${event.target.id}`);

    //파일 전송중에는 다른 인원에게 전송못하도록 파일 아이콘을 안보이게 변경한다.
    const guest_avatar_file_icon=document.querySelectorAll(".guest_avatar_div__profile__file-icon");
    guest_avatar_file_icon.forEach((file_icon)=>{
        file_icon.style.display="none";
    });
    if(event.target.files.length>1){
        const zip=new JSZip(); 
        const files=event.target.files;
        for(let i=0; i<files.length; i++){
            zip.file(files[i].name,files[i],{base64: true});
        }
        zip.generateAsync({type:"blob",compression: "DEFLATE",compressionOptions:{level: 1}},
        function updateCallback(metadata) {
            console.log(`압축률:${metadata.percent}%`);
        }).then((content)=>{
            const reader = new window.FileReader();
            console.log(`압축내용:${content}`);
            file_name=`share_fileZip_${randomFileId()}.zip`;
            reader.readAsDataURL(content);
            reader.onload = onReadAsDataURL;
        });
        // console.log("파일이 1개 이상입니다.");
    }else{
        const reader = new window.FileReader();
        const file=event.target.files[0];
        file_name=file.name;
        reader.readAsDataURL(file);
        reader.onload = onReadAsDataURL;

    }
}


