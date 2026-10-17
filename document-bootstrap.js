/* Start component downloads together; preserve controller order and the login bridge. */
(async function(){
 window.documentPageView=document.body.dataset.documentView;
 const url=new URL(location.href);url.hash=window.documentPageView==='history'?'history':'editor';history.replaceState(null,'',url.href);
 const sources=['https://drivekup01.github.io/School-Budget/budget-sidebar.js?v=disbursement1','preview.js?v=20261017-deliverydate1','preview-page1.js?v=20261013-5','preview-page2.js?v=20261013-9','preview-page3.js?v=20261014-2','https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js','personnel-options.js?v=20261015-personnel1','document-app.js?v=20261017-deliverydate1','preview-page3-choices.js?v=20261014-2','shared-procurement-items.js?v=20261015-shared1','document-storage.js?v=20261015-perf1'];
 const activeSources=window.documentPageView==='history'?sources.filter((src,i)=>i===0||src.startsWith('preview.js?')||src.startsWith('document-app.js?')||src.startsWith('document-storage.js?')):sources;
 const loadScript=src=>new Promise((resolve,reject)=>{const script=document.createElement('script');script.src=src;script.onload=resolve;script.onerror=()=>reject(Error('โหลดส่วนประกอบไม่สำเร็จ'));document.body.append(script)});
 for(const src of activeSources){const preload=document.createElement('link');preload.rel='preload';preload.as='script';preload.href=src;document.head.append(preload)}
 const layoutRequest=fetch('document-layout.html?v=20261014-noheader1').then(r=>{if(!r.ok)throw Error('เปิดแบบฟอร์มไม่ได้');return r.text()});layoutRequest.catch(()=>{});
 try{
 await Promise.all([window.schoolAuthReady,loadScript(activeSources[0])]);
 const layout=document.createElement('template');layout.innerHTML=await layoutRequest;document.body.append(layout.content);
 for(const src of activeSources.slice(1))await loadScript(src);
 document.documentElement.classList.remove('document-initializing');
 }catch(error){const message=document.createElement('p');message.className='document-start-error';message.setAttribute('role','alert');message.textContent=error.message;const retry=document.createElement('button');retry.type='button';retry.textContent='ลองเปิดใหม่';retry.addEventListener('click',()=>location.reload());message.append(' ',retry);document.body.append(message)}
})();
