/* Start component downloads together; preserve controller order and the login bridge. */
(async function(){
 window.documentPageView=document.body.dataset.documentView;
 const url=new URL(location.href);url.hash=window.documentPageView==='history'?'history':'editor';history.replaceState(null,'',url.href);
 const sources=['https://drivekup01.github.io/School-Budget/budget-sidebar.js?v=20261029-ui2','preview.js?v=20261017-deliverydate1','preview-page1.js?v=20261027-roles1','preview-page2.js?v=20261027-roles1','preview-page3.js?v=20261027-roles1','https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js','document-app.js?v=20261023-firebase1','preview-page3-choices.js?v=20261027-roles1','shared-procurement-items.js?v=20261027-roles1','document-storage.js?v=20261027-roles1'];
 const activeSources=window.documentPageView==='history'?sources.filter((src,i)=>i===0||src.startsWith('preview.js?')||src.startsWith('document-app.js?')||src.startsWith('document-storage.js?')):sources;
 const loadScript=src=>new Promise((resolve,reject)=>{const script=document.createElement('script');script.src=src;script.onload=resolve;script.onerror=()=>reject(Error('โหลดส่วนประกอบไม่สำเร็จ'));document.body.append(script)});
 for(const src of activeSources){const preload=document.createElement('link');preload.rel='preload';preload.as='script';preload.href=src;document.head.append(preload)}
 const layoutRequest=fetch('document-layout.html?v=20261023-firebase1').then(r=>{if(!r.ok)throw Error('เปิดแบบฟอร์มไม่ได้');return r.text()});layoutRequest.catch(()=>{});
 try{
 await Promise.all([window.schoolAuthReady,loadScript(activeSources[0])]);if(window.documentPageView!=='history'){window.procurementPersonnel=(await window.schoolRpc('getBudgetReferenceData',2570)).personnel;window.procurementPersonnelFields=new Set(['assigned_officer_name','chief_officer_signer_name','officer_signer_name','inspector_name']);}
 const layout=document.createElement('template');layout.innerHTML=await layoutRequest;document.body.append(layout.content);
 for(const src of activeSources.slice(1))await loadScript(src);
 document.documentElement.classList.remove('document-initializing');
 }catch(error){const message=document.createElement('p');message.className='document-start-error';message.setAttribute('role','alert');message.textContent=error.message;const retry=document.createElement('button');retry.type='button';retry.textContent='ลองเปิดใหม่';retry.addEventListener('click',()=>location.reload());message.append(' ',retry);document.body.append(message)}
})();
