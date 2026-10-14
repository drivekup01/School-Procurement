/* Shared document layout and controllers; no duplicated editor markup. */
(async function(){
 const loading=document.querySelector('.document-loading-screen');
 window.documentPageView=document.body.dataset.documentView;
 const url=new URL(location.href);url.hash=window.documentPageView==='history'?'history':'editor';history.replaceState(null,'',url.href);
 try{
 const response=await fetch('document-layout.html?v=20261014-noheader1',{cache:'no-store'});if(!response.ok)throw Error('เปิดแบบฟอร์มไม่ได้');
 const layout=document.createElement('template');layout.innerHTML=await response.text();
 document.body.replaceChildren(loading);document.body.append(layout.content);
 for(const src of ["https://drivekup01.github.io/School-Budget/budget-sidebar.js?v=20261014-brand2","preview.js?v=20261014-9","preview-page1.js?v=20261013-5","preview-page2.js?v=20261013-9","preview-page3.js?v=20261014-2","https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js","document-app.js?v=20261014-1","preview-page3-choices.js?v=20261014-2","preview-page4-inputs.js?v=20261014-5","preview-page6-inputs.js?v=20261014-2","preview-page11-inputs.js?v=20261014-2","document-storage.js?v=20261014-clean1"])await new Promise((resolve,reject)=>{const script=document.createElement('script');script.src=src;script.onload=resolve;script.onerror=()=>reject(Error('โหลดส่วนประกอบไม่สำเร็จ'));document.body.append(script)});
 document.documentElement.classList.remove('document-booting');loading.remove();
 }catch(error){loading.replaceChildren();const message=document.createElement('p');message.setAttribute('role','alert');message.textContent=error.message;const retry=document.createElement('button');retry.type='button';retry.textContent='ลองเปิดใหม่';retry.addEventListener('click',()=>location.reload());loading.append(message,retry)}
})();
