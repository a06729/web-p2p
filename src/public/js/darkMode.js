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
function handleDarkMode(event){
    if(event.checked==true){
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
            const darkMode_input=document.getElementById("checkbox");
            darkMode_input.checked=false;
            document.documentElement.classList.remove('dark');
            localStorage.setItem("theme","light");
        }else{
            const darkMode_input=document.getElementById("checkbox");
            darkMode_input.checked=true;
            document.documentElement.classList.add('dark');
            localStorage.setItem("theme","dark");
        }
    }
}

darkModeInit();