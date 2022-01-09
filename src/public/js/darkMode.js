function darkMode(){
    const teme_mode=localStorage.getItem("theme");
    if(teme_mode=="light"){
        document.documentElement.classList.add('dark');
        localStorage.setItem("theme","dark");
    }else{
        document.documentElement.classList.remove('dark');
        localStorage.setItem("theme","light");
    }
}

function darkModeInit(){
    if(localStorage.getItem("theme")===null){
        localStorage.setItem("theme", "light");
    }else{
        const teme_mode=localStorage.getItem("theme");
        if(teme_mode==="light"){
            document.documentElement.classList.remove('dark');
            localStorage.setItem("theme","light");
        }else{
            document.documentElement.classList.add('dark');
            localStorage.setItem("theme","dark");
        }
    }
}

darkModeInit();