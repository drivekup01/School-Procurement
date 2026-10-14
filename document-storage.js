/* Whole-document snapshots: all page inputs, choices and table rows. */
(function(){
 const keys=['school-procurement-preview-values-v1','school-procurement-page3-choices-v1','school-procurement-page4-table-v1','school-procurement-page6-table-v1'];
 const format='school-procurement-document-v1',activeKey='school-procurement-active-document-v1';
 const host=document.getElementById('saveArea'),saveButton=document.getElementById('saveDocumentData'),status=document.getElementById('saveStatus');
 const cloud=!!window.google?.script?.run;
 let active={};try{active=JSON.parse(localStorage.getItem(activeKey)||'{}')}catch{}
 const label=document.createElement('label');label.textContent='ชื่อชุดเอกสาร';label.htmlFor='documentName';
 const name=document.createElement('input');name.id='documentName';name.type='text';name.maxLength=120;name.value=active.name||'';name.placeholder='เช่น จัดซื้อวัสดุสำนักงาน';
 host.prepend(label,name);
 const openButton=document.createElement('button');openButton.type='button';openButton.textContent=cloud?'เปิดเอกสารเดิม':'เปิดไฟล์ข้อมูล';openButton.style.marginLeft='8px';saveButton.after(openButton);
 const copyButton=document.createElement('button');copyButton.type='button';copyButton.textContent='บันทึกเป็นชุดใหม่';copyButton.style.marginLeft='8px';if(cloud)openButton.after(copyButton);
 saveButton.disabled=false;saveButton.removeAttribute('title');saveButton.textContent=cloud?'บันทึกข้อมูล':'บันทึกไฟล์ข้อมูล';
 status.textContent=cloud?'บันทึกใน Google Drive · school-budget':'บันทึกเป็นไฟล์ข้อมูลในเครื่อง เปิดกลับมาแก้ไขได้';
 function busy(value){[saveButton,openButton,copyButton].forEach(b=>b.disabled=value)}
 function rpc(method,...args){return new Promise((resolve,reject)=>google.script.run.withSuccessHandler(resolve).withFailureHandler(reject)[method](...args))}
 function validate(data){
  if(!data||data.format!==format||data.version!==1||!data.stores||Object.keys(data.stores).length!==keys.length||!keys.every(key=>data.stores[key]&&typeof data.stores[key]==='object'&&!Array.isArray(data.stores[key])))throw Error('ไฟล์นี้ไม่ใช่ข้อมูลเอกสารที่ระบบรองรับ');
  return data;
 }
 function snapshot(){
  syncBudgetAmountText();syncPage10Amounts();
  const stores={};for(const key of keys){const raw=localStorage.getItem(key);stores[key]=raw?JSON.parse(raw):{}}
  stores[keys[0]]={...formValues};
  return validate({format,version:1,name:name.value.trim()||'เอกสารจัดซื้อจัดจ้าง',savedAt:new Date().toISOString(),stores});
 }
 function download(data){
  const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;a.download=data.name.replace(/[\\/]/g,' ')+'.json';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
 }
 async function save(asNew=false){
  busy(true);status.textContent='กำลังบันทึก...';
  try{
   const data=snapshot();
   if(cloud){active=await rpc('saveProcurementDocument',data,asNew?'':active.id||'');localStorage.setItem(activeKey,JSON.stringify(active));name.value=active.name;status.textContent='บันทึกใน Google Drive แล้ว · '+active.name}
   else{download(data);status.textContent='สร้างไฟล์ข้อมูลแล้ว เก็บไฟล์นี้ไว้เพื่อเปิดกลับมาแก้ไข'}
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
 async function open(){
  if(!cloud){picker.click();return}
  busy(true);status.textContent='กำลังอ่านรายการเอกสาร...';
  try{
   const files=await rpc('listProcurementDocuments');
   if(!files.length){status.textContent='ยังไม่มีเอกสารที่บันทึกในโฟลเดอร์นี้';return}
   const dialog=document.createElement('dialog'),select=document.createElement('select'),heading=document.createElement('h3');heading.textContent='เปิดเอกสารเดิม';
   for(const file of files){const option=document.createElement('option');option.value=file.id;option.textContent=file.name+' · '+new Date(file.savedAt).toLocaleDateString('th-TH',{timeZone:'Asia/Bangkok'});select.append(option)}
   const load=document.createElement('button');load.type='button';load.textContent='เปิด';
   const close=document.createElement('button');close.type='button';close.textContent='ยกเลิก';close.addEventListener('click',()=>dialog.close());
   load.addEventListener('click',async()=>{load.disabled=true;try{const result=await rpc('openProcurementDocument',select.value);restore(result.data,result.id);dialog.close()}catch(error){status.textContent='เปิดไม่สำเร็จ: '+error.message}finally{load.disabled=false}});
   dialog.append(heading,select,load,close);dialog.addEventListener('close',()=>dialog.remove());document.body.append(dialog);dialog.showModal();status.textContent='เลือกเอกสารที่ต้องการเปิด';
  }catch(error){status.textContent='อ่านรายการไม่สำเร็จ: '+error.message}finally{busy(false)}
 }
 const picker=document.createElement('input');picker.type='file';picker.accept='.json,application/json';picker.hidden=true;host.append(picker);
 picker.addEventListener('change',async()=>{try{const file=picker.files[0];if(file){if(file.size>1000000)throw Error('ไฟล์ข้อมูลใหญ่เกินกำหนด');restore(JSON.parse(await file.text()),'')}}catch(error){status.textContent='เปิดไม่สำเร็จ: '+error.message}finally{picker.value=''}});
 saveButton.addEventListener('click',()=>save());copyButton.addEventListener('click',()=>save(true));openButton.addEventListener('click',open);
 if(cloud){const importButton=document.createElement('button');importButton.type='button';importButton.textContent='นำเข้าไฟล์ข้อมูล';importButton.addEventListener('click',()=>picker.click());host.append(importButton)}
})();
