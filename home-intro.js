/* Short introduction once per browser tab; content remains usable without JS. */
(function(){
 const key='school-home-intro-seen-v1';
 if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
 try{if(sessionStorage.getItem(key))return;sessionStorage.setItem(key,'1')}catch{}
 document.documentElement.classList.add('home-intro-active');
 document.addEventListener('DOMContentLoaded',()=>{
  const splash=document.getElementById('schoolSplash'),main=document.querySelector('.portal-main');
  main.inert=true;
  const sidebar=document.querySelector('.home-sidebar');if(sidebar)sidebar.inert=true;
  const finish=()=>{document.documentElement.classList.remove('home-intro-active');main.inert=false;if(sidebar)sidebar.inert=false;splash.hidden=true};
  splash.querySelector('img').addEventListener('error',finish,{once:true});
  setTimeout(finish,1250);
 },{once:true});
})();
