/* Whole-document snapshots: all page inputs, choices and table rows. */
(function(){
 const keys=['school-procurement-preview-values-v1','school-procurement-page3-choices-v1','school-procurement-page4-table-v1','school-procurement-page6-table-v1'];
 const format='school-procurement-document-v1',activeKey='school-procurement-active-document-v1';
 const host=document.getElementById('saveArea'),saveButton=document.getElementById('saveDocumentData'),status=document.getElementById('saveStatus');
 const cloud=!!window.google?.script?.run;
 let active={};try{active=JSON.parse(localStorage.getItem(activeKey)||'{}')}catch{}
  const historyKey='school-procurement-document-history-v1',draftKey='school-procurement-document-draft-v1';
 const heading=document.createElement('h3');heading.textContent='ประวัติการบันทึกเอกสาร';
 const list=document.createElement('div');list.id='documentHistory';
 saveButton.disabled=false;saveButton.removeAttribute('title');saveButton.textContent='บันทึก';
  const editor=document.querySelector('main'),manager=document.createElement('section');manager.id='documentManager';manager.hidden=true;manager.style.cssText='margin:18px 26px;padding:22px';
 const finish=document.createElement('button');finish.type='button';finish.id='finishDocument';finish.textContent='เสร็จสิ้น';finish.style.marginLeft='8px';saveButton.after(finish);
 const managerStatus=document.createElement('p');managerStatus.className='muted';manager.append(heading,managerStatus,list);editor.after(manager);heading.textContent='จัดการเอกสาร';status.textContent='';
 const nav=document.createElement('nav');nav.style.cssText='display:flex;gap:8px;padding:16px 26px 0';const editTab=document.createElement('button'),manageTab=document.createElement('button');editTab.type=manageTab.type='button';editTab.textContent='จัดทำเอกสาร';manageTab.textContent='จัดการเอกสาร';nav.append(editTab,manageTab);editor.before(nav);
 const style=document.createElement('style');style.textContent='main[hidden],#documentManager[hidden]{display:none!important}.document-manager-row{display:flex;gap:12px;align-items:center;padding:12px 0;border-bottom:1px solid #e6ebf3}.document-manager-detail{flex:1;min-width:0}.document-manager-actions{display:flex;gap:8px}@media(max-width:600px){.document-manager-row{flex-wrap:wrap}.document-manager-actions{margin-left:28px}}';document.head.append(style);
 function show(managing){editor.hidden=managing;manager.hidden=!managing;if(managing)renderHistory().catch(error=>managerStatus.textContent='อ่านรายการไม่สำเร็จ: '+error.message)}
 editTab.addEventListener('click',()=>show(false));manageTab.addEventListener('click',()=>show(true));
 function busy(value){saveButton.disabled=finish.disabled=value;list.querySelectorAll('button').forEach(button=>button.disabled=value)}
 function documentName(){return [formValues.document_date,formValues.procurement_description||formValues.project_name||formValues.requesting_unit].filter(Boolean).join(' · ').slice(0,120)||'เอกสารจัดซื้อจัดจ้าง'}
 function localHistory(){const data=JSON.parse(localStorage.getItem(historyKey)||'[]');if(!Array.isArray(data))throw Error('ไม่สามารถอ่านประวัติเอกสาร');return data}
 async function renderHistory(){
  const files=cloud?await rpc('listProcurementDocuments'):localHistory();list.replaceChildren();
  if(!files.length){const empty=document.createElement('p');empty.className='muted';empty.textContent='ยังไม่มีประวัติการบันทึก';list.append(empty);return}
  for(const [index,file] of files.entries()){
   const row=document.createElement('div');row.className='document-manager-row';
   const button=document.createElement('button');button.type='button';button.textContent=file.name;button.style.cssText='display:block;border:0;background:transparent;padding:0;text-align:left;color:#245ca1;text-decoration:underline;overflow-wrap:anywhere';
   const date=document.createElement('small');date.textContent=new Date(file.savedAt).toLocaleString('th-TH',{timeZone:'Asia/Bangkok'});
   button.addEventListener('click',async()=>{
    busy(true);
    try{const result=cloud?await rpc('openProcurementDocument',file.id):{data:file.data,id:''};validate(result.data);restore(result.data,file.id)}
    catch(error){managerStatus.textContent='เปิดไม่สำเร็จ: '+error.message}finally{busy(false)}
   }); const number=document.createElement('span');number.textContent=String(index+1);const detail=document.createElement('div');detail.className='document-manager-detail';detail.append(button,date);
 const actions=document.createElement('div');actions.className='document-manager-actions';const downloadButton=document.createElement('button');downloadButton.type='button';downloadButton.textContent='ดาวน์โหลด';downloadButton.addEventListener('click',async()=>{busy(true);try{const data=cloud?(await rpc('openProcurementDocument',file.id)).data:file.data;download(validate(data))}catch(error){managerStatus.textContent='ดาวน์โหลดไม่สำเร็จ: '+error.message}finally{busy(false)}});
 const editButton=document.createElement('button');editButton.type='button';editButton.textContent='แก้ไข';editButton.addEventListener('click',()=>button.click());actions.append(downloadButton,editButton);row.append(number,detail,actions);list.append(row);
  }
 }function rpc(method,...args){return new Promise((resolve,reject)=>google.script.run.withSuccessHandler(resolve).withFailureHandler(reject)[method](...args))}
 function validate(data){
  if(!data||data.format!==format||data.version!==1||!data.stores||Object.keys(data.stores).length!==keys.length||!keys.every(key=>data.stores[key]&&typeof data.stores[key]==='object'&&!Array.isArray(data.stores[key])))throw Error('ไฟล์นี้ไม่ใช่ข้อมูลเอกสารที่ระบบรองรับ');
  return data;
 }
 function snapshot(){
  syncBudgetAmountText();syncPage10Amounts();
  const stores={};for(const key of keys){const raw=localStorage.getItem(key);stores[key]=raw?JSON.parse(raw):{}}
  stores[keys[0]]={...formValues};
  return validate({format,version:1,name:documentName(),savedAt:new Date().toISOString(),stores});
 }
 function download(data){
  const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;a.download=data.name.replace(/[\\/]/g,' ')+'.json';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
 }
   function saveDraft(){
  try{const data=snapshot();localStorage.setItem(draftKey,JSON.stringify({page:currentPDFPage,data}));localStorage.setItem(keys[0],JSON.stringify(data.stores[keys[0]]));status.textContent='บันทึกรายละเอียดหน้า '+currentPDFPage+' ไว้แล้ว'}catch(error){status.textContent='บันทึกไม่สำเร็จ: '+error.message}
 }
 async function complete(){
  busy(true);status.textContent='กำลังบันทึกไฟล์งาน...';
  try{
   const data=snapshot();
   if(cloud){active=await rpc('saveProcurementDocument',data,active.id||'')}
   else{const history=localHistory(),index=history.findIndex(file=>file.id===active.id);active={id:index<0?crypto.randomUUID():active.id,name:data.name,savedAt:data.savedAt};const entry={...active,data};if(index<0)history.unshift(entry);else history[index]=entry;localStorage.setItem(historyKey,JSON.stringify(history))}
   try{localStorage.setItem(activeKey,JSON.stringify(active))}catch{}
   status.textContent='บันทึกไฟล์งานแล้ว';show(true);
  }catch(error){status.textContent='บันทึกไม่สำเร็จ: '+error.message}finally{busy(false)}
 }
 function restore(data,id){
  validate(data);
  if(!confirm('เปิดเอกสารนี้แทนข้อมูลที่กำลังกรอกอยู่? กรุณาบันทึกข้อมูลปัจจุบันก่อนหากต้องการเก็บไว้'))return;
  const old=new Map([...keys,activeKey].map(key=>[key,localStorage.getItem(key)]));
  try{for(const key of keys)localStorage.setItem(key,JSON.stringify(data.stores[key]));localStorage.setItem(activeKey,JSON.stringify({id:id||'',name:data.name||''}))}
  catch(error){for(const [key,value]of old){try{value===null?localStorage.removeItem(key):localStorage.setItem(key,value)}catch{}}throw error}
  location.reload();
 }
  saveButton.addEventListener('click',saveDraft);finish.addEventListener('click',complete);

})();
