/* Document history on the budget dashboard, using the existing snapshot format. */
(() => {
 const keys=['school-procurement-preview-values-v1','school-procurement-page3-choices-v1','school-procurement-page4-table-v1','school-procurement-page6-table-v1'];
 const cloud=!!window.google?.script?.run, list=document.getElementById('budgetDocumentList'), status=document.getElementById('budgetDocumentStatus'), search=document.getElementById('budgetDocumentSearch');let files=[];
 const rpc=(method,...args)=>new Promise((resolve,reject)=>google.script.run.withSuccessHandler(resolve).withFailureHandler(reject)[method](...args));
 const link=page=>window.schoolAppPageLinks?.[page]||page;
 document.getElementById('budgetCreateDocument').href=link('procurement.html');
 function validate(data){if(!data||data.format!=='school-procurement-document-v1'||data.version!==1||!data.stores||Object.keys(data.stores).length!==keys.length||!keys.every(k=>data.stores[k]&&typeof data.stores[k]==='object'&&!Array.isArray(data.stores[k])))throw Error('รูปแบบข้อมูลเอกสารไม่ถูกต้อง');return data}
 function draw(){
  const q=search.value.trim().toLocaleLowerCase(),shown=files.filter(f=>[f.name,f.documentNumber,f.department,f.data?.stores?.[keys[0]]?.requesting_unit].join(' ').toLocaleLowerCase().includes(q));
  list.replaceChildren();status.textContent=`แสดง ${shown.length} จาก ${files.length} เอกสาร · ${cloud?'ข้อมูลจาก Google Drive':'เอกสารที่บันทึกในเบราว์เซอร์นี้'}`;
  if(!shown.length){const p=document.createElement('p');p.className='table-help';p.textContent=files.length?'ไม่พบเอกสารตามคำค้นหา':'ยังไม่มีเอกสารที่บันทึกเสร็จสิ้น';list.append(p);return}
  const table=document.createElement('table');table.innerHTML='<thead><tr><th>ลำดับ</th><th>ชื่อเอกสาร / ฝ่ายงาน</th><th>วันที่บันทึก</th><th>จัดการ</th></tr></thead>';const body=document.createElement('tbody');table.append(body);
  shown.forEach((file,i)=>{const row=document.createElement('tr'),cells=Array.from({length:4},()=>document.createElement('td'));row.append(...cells);cells[0].textContent=i+1;
   const title=document.createElement('button');title.className='project-name';title.textContent=file.name||'เอกสารจัดซื้อจัดจ้าง';title.type='button';cells[1].append(title);
   const department=document.createElement('small');department.textContent=file.department||file.data?.stores?.[keys[0]]?.requesting_unit||'ยังไม่ระบุฝ่ายงาน';cells[1].append(department);
   const date=new Date(file.savedAt);cells[2].textContent=Number.isNaN(date.getTime())?'—':date.toLocaleString('th-TH',{timeZone:'Asia/Bangkok'});
   async function act(edit){const buttons=list.querySelectorAll('button');buttons.forEach(b=>b.disabled=true);try{const data=validate(cloud?(await rpc('openProcurementDocument',file.id)).data:file.data);
    if(edit){if(keys.some(k=>localStorage.getItem(k))&&!confirm('เปิดเอกสารนี้แทนแบบร่างปัจจุบัน? กรุณาบันทึกแบบร่างก่อนหากต้องการเก็บไว้'))return;
     const storedKeys=[...keys,'school-procurement-active-document-v1'],previous=storedKeys.map(k=>[k,localStorage.getItem(k)]);
     try{keys.forEach(k=>localStorage.setItem(k,JSON.stringify(data.stores[k])));localStorage.setItem('school-procurement-active-document-v1',JSON.stringify({id:file.id,name:data.name}));}catch(error){previous.forEach(([k,v])=>v===null?localStorage.removeItem(k):localStorage.setItem(k,v));throw error}
     window.top.location.assign(link('procurement.html'));
    }else{const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download=(data.name||'เอกสาร').replace(/[\\/]/g,' ')+'.json';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000)}
   }catch(e){status.textContent='เปิดเอกสารไม่สำเร็จ: '+e.message}finally{buttons.forEach(b=>b.disabled=false)}}
   title.addEventListener('click',()=>act(true));const actions=document.createElement('div');actions.className='history-actions';['ดาวน์โหลด','แก้ไข'].forEach((name,index)=>{const b=document.createElement('button');b.type='button';b.textContent=name;b.addEventListener('click',()=>act(index===1));actions.append(b)});cells[3].append(actions);body.append(row);
  });list.append(table);
 }
 async function load(){status.textContent='กำลังอ่านประวัติเอกสาร…';try{files=cloud?await rpc('listProcurementDocuments'):JSON.parse(localStorage.getItem('school-procurement-document-history-v1')||'[]');if(!Array.isArray(files))throw Error('ข้อมูลประวัติไม่ถูกต้อง');files.sort((a,b)=>String(b.savedAt).localeCompare(String(a.savedAt)));draw()}catch(e){status.textContent='อ่านประวัติไม่สำเร็จ: '+e.message}}
 search.addEventListener('input',draw);document.getElementById('budgetDocumentRefresh').addEventListener('click',load);window.addEventListener('storage',e=>{if(e.key==='school-procurement-document-history-v1')load()});load();
})();
