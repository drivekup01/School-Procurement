/* Whole-document snapshots: all page inputs, choices and table rows. */
(function(){
 const keys=['school-procurement-preview-values-v1','school-procurement-page3-choices-v1','school-procurement-page4-table-v1','school-procurement-page6-table-v1'];
 const format='school-procurement-document-v1',activeKey='school-procurement-active-document-v1';
 const host=document.getElementById('saveArea'),saveButton=document.getElementById('saveDocumentData'),status=document.getElementById('saveStatus');
 const cloud=!!window.google?.script?.run;
 let active={};try{active=JSON.parse(localStorage.getItem(activeKey)||'{}')}catch{}
  const historyKey='school-procurement-document-history-v1';
 const heading=document.createElement('h3');heading.textContent='ประวัติการบันทึกเอกสาร';
 const list=document.createElement('div');list.id='documentHistory';
 saveButton.disabled=false;saveButton.removeAttribute('title');saveButton.textContent='บันทึก';
 saveButton.after(heading,list);status.textContent='';
 function busy(value){saveButton.disabled=value;list.querySelectorAll('button').forEach(button=>button.disabled=value)}
 function documentName(){return [formValues.document_date,formValues.procurement_description||formValues.project_name||formValues.requesting_unit].filter(Boolean).join(' · ').slice(0,120)||'เอกสารจัดซื้อจัดจ้าง'}
 function localHistory(){const data=JSON.parse(localStorage.getItem(historyKey)||'[]');if(!Array.isArray(data))throw Error('ไม่สามารถอ่านประวัติเอกสาร');return data}
 async function renderHistory(){
  const files=cloud?await rpc('listProcurementDocuments'):localHistory();list.replaceChildren();
  if(!files.length){const empty=document.createElement('p');empty.className='muted';empty.textContent='ยังไม่มีประวัติการบันทึก';list.append(empty);return}
  for(const file of files){
   const row=document.createElement('div');row.style.cssText='padding:10px 0;border-bottom:1px solid #e6ebf3';
   const button=document.createElement('button');button.type='button';button.textContent=file.name;button.style.cssText='display:block;border:0;background:transparent;padding:0;text-align:left;color:#245ca1;text-decoration:underline;overflow-wrap:anywhere';
   const date=document.createElement('small');date.textContent=new Date(file.savedAt).toLocaleString('th-TH',{timeZone:'Asia/Bangkok'});
   button.addEventListener('click',async()=>{
    busy(true);
    try{const result=cloud?await rpc('openProcurementDocument',file.id):{data:file.data,id:''};validate(result.data);download(result.data);restore(result.data,result.id)}
    catch(error){status.textContent='เปิดไม่สำเร็จ: '+error.message}finally{busy(false)}
   });row.append(button,date);list.append(row);
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
  async function save(){
  busy(true);status.textContent='กำลังบันทึก...';
  try{
   const data=snapshot();
   if(cloud){active=await rpc('saveProcurementDocument',data,'');localStorage.setItem(activeKey,JSON.stringify(active));status.textContent='บันทึกใน Google Drive แล้ว'}
   else{const history=localHistory();history.unshift({id:crypto.randomUUID(),name:data.name,savedAt:data.savedAt,data});localStorage.setItem(historyKey,JSON.stringify(history));status.textContent='บันทึกแล้ว · ประวัติเก็บในเบราว์เซอร์นี้'}
   await renderHistory();
  }catch(error){status.textContent='บันทึกไม่สำเร็จ: '+error.message}finally{busy(false)}
 }function restore(data,id){
  validate(data);
  if(!confirm('เปิดเอกสารนี้แทนข้อมูลที่กำลังกรอกอยู่? กรุณาบันทึกข้อมูลปัจจุบันก่อนหากต้องการเก็บไว้'))return;
  const old=new Map([...keys,activeKey].map(key=>[key,localStorage.getItem(key)]));
  try{for(const key of keys)localStorage.setItem(key,JSON.stringify(data.stores[key]));localStorage.setItem(activeKey,JSON.stringify({id:id||'',name:data.name||''}))}
  catch(error){for(const [key,value]of old){try{value===null?localStorage.removeItem(key):localStorage.setItem(key,value)}catch{}}throw error}
  location.reload();
 }
  saveButton.addEventListener('click',save);
 renderHistory().catch(error=>{status.textContent='อ่านประวัติไม่สำเร็จ: '+error.message});
})();
