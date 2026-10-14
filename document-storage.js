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
 const managerStatus=document.createElement('p');managerStatus.className='muted';manager.append(heading,managerStatus,list);editor.after(manager);heading.textContent='ประวัติเอกสาร';status.textContent='';
 const nav=document.createElement('nav');nav.style.cssText='display:flex;gap:8px;padding:16px 26px 0';const editTab=document.createElement('button'),manageTab=document.createElement('button');editTab.type=manageTab.type='button';editTab.textContent='จัดทำเอกสาร';manageTab.textContent='ประวัติเอกสาร';nav.append(editTab,manageTab);editor.before(nav);

  const toolbar=document.createElement('div');toolbar.className='history-toolbar';
 const search=document.createElement('input');search.type='search';search.id='historySearch';search.placeholder='ค้นหาชื่อเอกสารหรือเลขที่หนังสือ';search.setAttribute('aria-label','ค้นหาเอกสาร');
 const filter=document.createElement('select');filter.id='historyDepartment';filter.setAttribute('aria-label','กรองฝ่ายงาน');
 const create=document.createElement('button');create.type='button';create.textContent='＋ สร้างเอกสารใหม่';
 toolbar.append(search,filter,create);managerStatus.before(toolbar);let savedFiles=[],loadSerial=0;

 function setViewHash(hash){const url=new URL(location.href);url.hash=hash;history.replaceState(null,'',url.href)}
 function show(managing){const target=managing?'history.html':'procurement.html';if(!cloud&&!location.pathname.endsWith('/'+target)){location.assign(target);return;}const home=document.getElementById('systemHome');if(home)home.hidden=true;const budgetHome=document.getElementById('budgetHome');if(budgetHome)budgetHome.hidden=true;nav.hidden=false;editor.hidden=managing;manager.hidden=!managing;setViewHash(managing?'#history':'#editor');editTab.setAttribute('aria-current',managing?'false':'page');manageTab.setAttribute('aria-current',managing?'page':'false');if(managing)renderHistory().catch(error=>managerStatus.textContent='อ่านรายการไม่สำเร็จ: '+error.message)}
  nav.id='systemNav';
 for(const [text,page]of [['← หน้าหลัก','index.html'],['← ระบบงานงบประมาณ','budget.html']]){const link=document.createElement('a');link.textContent=text;link.href=window.schoolAppPageLinks?.[page]||page;link.target='_top';link.style.cssText='padding:10px 12px;color:#163f75;text-decoration:none';nav.prepend(link)}
 search.addEventListener('input',drawHistory);filter.addEventListener('change',drawHistory);
 create.addEventListener('click',()=>{
  if(Object.values(formValues).some(value=>String(value??'').trim())&&!confirm('เริ่มเอกสารใหม่? กรุณาบันทึกรายละเอียดปัจจุบันก่อนหากต้องการเก็บไว้'))return;
  for(const key of [...keys,activeKey,draftKey])localStorage.removeItem(key);
  refreshDraft().then(()=>show(false)).catch(error=>managerStatus.textContent='เปิดไม่สำเร็จ: '+error.message);
 });editTab.addEventListener('click',()=>show(false));manageTab.addEventListener('click',()=>show(true));
 function busy(value){saveButton.disabled=finish.disabled=value;list.querySelectorAll('button').forEach(button=>button.disabled=value)}
 function documentName(){return [formValues.document_date,formValues.procurement_description||formValues.project_name||formValues.requesting_unit].filter(Boolean).join(' · ').slice(0,120)||'เอกสารจัดซื้อจัดจ้าง'}
 function localHistory(){const data=JSON.parse(localStorage.getItem(historyKey)||'[]');if(!Array.isArray(data))throw Error('ไม่สามารถอ่านประวัติเอกสาร');return data}
  function metadata(file){const fields=file.data?.stores?.[keys[0]]||{};return {department:file.department||fields.requesting_unit||'',number:file.documentNumber||fields.document_date||''}}
 async function renderHistory(){
  const serial=++loadSerial;managerStatus.textContent='กำลังอ่านเอกสาร...';
  const files=cloud?await rpc('listProcurementDocuments'):localHistory();if(serial!==loadSerial)return;
  savedFiles=files.sort((a,b)=>String(b.savedAt).localeCompare(String(a.savedAt)));
  const previous=filter.value;filter.replaceChildren(new Option('ทุกฝ่ายงาน',''));
  [...new Set(savedFiles.map(file=>metadata(file).department).filter(Boolean))].sort().forEach(department=>filter.add(new Option(department,department)));
  filter.value=previous;drawHistory();
 }
 function drawHistory(){
  const query=search.value.trim().toLocaleLowerCase();
  const files=savedFiles.filter(file=>(!filter.value||metadata(file).department===filter.value)&&(!query||(file.name+' '+metadata(file).number).toLocaleLowerCase().includes(query)));
  list.replaceChildren();managerStatus.textContent='แสดง '+files.length+' จาก '+savedFiles.length+' เอกสาร'+(cloud?'':' · เก็บในเบราว์เซอร์นี้');
  if(!files.length){const empty=document.createElement('p');empty.className='muted';empty.textContent=savedFiles.length?'ไม่พบเอกสารที่ตรงกับการค้นหา':'ยังไม่มีเอกสารที่เสร็จสิ้น เริ่มได้จากปุ่มสร้างเอกสารใหม่';list.append(empty);return}
  const table=document.createElement('table');table.className='history-table';
  const labels=['ลำดับ','เลขที่ / ชื่อเอกสาร','ฝ่ายงาน','วันที่บันทึก','จัดการ'],thead=document.createElement('thead'),header=document.createElement('tr');
  labels.forEach(label=>{const th=document.createElement('th');th.scope='col';th.textContent=label;header.append(th)});thead.append(header);table.append(thead);const body=document.createElement('tbody');table.append(body);
  files.forEach((file,index)=>{
   const row=document.createElement('tr');row.className='document-manager-row-history';
   const cells=labels.map(label=>{const cell=document.createElement('td');cell.dataset.label=label;row.append(cell);return cell});
   cells[0].textContent=String(index+1);const title=document.createElement('button');title.type='button';title.className='history-name';title.textContent=file.name;
   const edit=async()=>{busy(true);try{const data=cloud?(await rpc('openProcurementDocument',file.id)).data:file.data;validate(data);await restore(data,file.id)}catch(error){managerStatus.textContent='เปิดไม่สำเร็จ: '+error.message}finally{busy(false)}};
   title.addEventListener('click',edit);cells[1].append(title);const number=metadata(file).number;if(number){const line=document.createElement('small');line.style.display='block';line.textContent='เลขที่ '+number;cells[1].append(line)}
   cells[2].textContent=metadata(file).department||'—';cells[3].textContent=new Date(file.savedAt).toLocaleString('th-TH',{timeZone:'Asia/Bangkok'});
   const actions=document.createElement('div');actions.className='document-manager-actions';const downloadButton=document.createElement('button');downloadButton.type='button';downloadButton.textContent='ดาวน์โหลด';downloadButton.addEventListener('click',async()=>{busy(true);try{const data=cloud?(await rpc('openProcurementDocument',file.id)).data:file.data;download(validate(data))}catch(error){managerStatus.textContent='ดาวน์โหลดไม่สำเร็จ: '+error.message}finally{busy(false)}});
   const editButton=document.createElement('button');editButton.type='button';editButton.textContent='แก้ไข';editButton.addEventListener('click',edit);actions.append(downloadButton,editButton);cells[4].append(actions);body.append(row);
  });list.append(table);
 }
 function rpc(method,...args){return new Promise((resolve,reject)=>google.script.run.withSuccessHandler(resolve).withFailureHandler(reject)[method](...args))}
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
   await clearCompletedDraft();
  }catch(error){status.textContent='บันทึกไม่สำเร็จ: '+error.message}finally{busy(false)}
 }
 async function clearCompletedDraft(){
  const viewKey='school-procurement-next-view-v1';
  const draftKeys=[...keys,activeKey,draftKey];
  const previous=new Map(draftKeys.map(key=>[key,localStorage.getItem(key)]));
  try{
   sessionStorage.setItem(viewKey,'manage');
   for(const key of draftKeys)localStorage.removeItem(key);
  }catch(error){
   for(const [key,value]of previous){try{value===null?localStorage.removeItem(key):localStorage.setItem(key,value)}catch{}}
   try{sessionStorage.removeItem(viewKey)}catch{}
   status.textContent='บันทึกไฟล์งานแล้ว แต่ล้างช่องกรอกไม่สำเร็จ: '+error.message;
   return;
  }
  await refreshDraft();sessionStorage.removeItem(viewKey);show(true);
 }
 async function refreshDraft(){
  const values=JSON.parse(localStorage.getItem(keys[0])||'{}');
  Object.keys(formValues).forEach(key=>delete formValues[key]);Object.assign(formValues,values);
  active=JSON.parse(localStorage.getItem(activeKey)||'{}');
  for(const page of [3,4,6,11])window['resetPage'+page+'Draft']?.();
  currentPDFPage=1;lastFormPage=0;activeField=null;await loadPDF();
 }
 async function restore(data,id){
  validate(data);
  if(!confirm('เปิดเอกสารนี้แทนข้อมูลที่กำลังกรอกอยู่? กรุณาบันทึกข้อมูลปัจจุบันก่อนหากต้องการเก็บไว้'))return;
  const old=new Map([...keys,activeKey].map(key=>[key,localStorage.getItem(key)]));
  try{for(const key of keys)localStorage.setItem(key,JSON.stringify(data.stores[key]));localStorage.setItem(activeKey,JSON.stringify({id:id||'',name:data.name||''}))}
  catch(error){for(const [key,value]of old){try{value===null?localStorage.removeItem(key):localStorage.setItem(key,value)}catch{}}throw error}
  await refreshDraft();show(false);
 }
  saveButton.addEventListener('click',saveDraft);finish.addEventListener('click',complete);
 const nextView=sessionStorage.getItem('school-procurement-next-view-v1');
 if(nextView==='manage'||window.documentPageView==='history'||location.hash==='#history'){sessionStorage.removeItem('school-procurement-next-view-v1');show(true)}
})();
