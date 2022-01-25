function shareKakao(){
    const url=location.href;
    Kakao.Link.sendDefault({
        objectType: 'feed',
        content: {
            title: "p2p 공유", // 보여질 제목
            description: "p2p 공유 링크", // 보여질 설명
            imageUrl: `${url}`, // 콘텐츠 URL
            link: {
                mobileWebUrl: `${url}`,
                webUrl: `${url}`,
                iosExecutionParams: `${url}`,
                androidExecParams: `${url}`,
            }
        }
    });
}

function shareTelegram(){
    const url=`https://telegram.me/share/url?url=${location.href}&text=파일 공유 링크`;
    // const telegram_btn=document.querySelector("#telegram_btn");
    // telegram_btn.href=`https://telegram.me/share/url?url=${location.href}&text=파일 공유 링크`;
    window.open(url,'텔레그램 공유','width=800, height=700, toolbar=no, menubar=no, scrollbars=no, resizable=yes');
    return false;
}

function sharUrl(){
    const url=location.href;
    navigator.clipboard.writeText(url)
    .then(() => {
        console.log("클립보드에 url 저장");
        alert("초대장 복사 완료");
    }).catch(err => {
        console.log('Something went wrong', err);
    })
}

export default {sharUrl,shareTelegram,shareKakao};