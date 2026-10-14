/* Page 11 only: map left inputs to the 22 original requisition rows. */
(function(){
 const limit=22,keys=['description','quantity','remarks'];
 const labels=['รายการพัสดุ','จำนวน','หมายเหตุ'];
 const field=(index,key)=>'page11_item_'+(index+1)+'_'+key;
 let count=Math.max(1,Math.min(limit,Math.floor(Number(formValues.page11_item_count)||1)));
 window.resetPage11Draft=()=>{count=Math.max(1,Math.min(limit,Math.floor(Number(formValues.page11_item_count)||1)))};
 const save=()=>{formValues.page11_item_count=count;try{localStorage.setItem('school-procurement-preview-values-v1',JSON.stringify(formValues))}catch{}};
 function values(index){
  const item=keys.map(key=>index<count?String(formValues[field(index,key)]??''):'');
  return [item.some(value=>value.trim())?String(index+1):'',...item];
 }
 function paint(){
  if(currentPDFPage!==11)return;
  const table=document.querySelector('#pdfRender .word-page11-table');
  if(!table||table.rows.length!==limit+1)return;
  for(let i=0;i<limit;i++)values(i).forEach((value,j)=>{
   const cell=table.rows[i+1].cells[j],paragraph=cell.querySelector('.word-paragraph');
   if(paragraph){paragraph.textContent=value;paragraph.classList.toggle('word-empty',!value.trim())}else cell.textContent=value;
   cell.dataset.tableField=j===0?'page11_item_'+(i+1)+'_number':field(i,keys[j-1]);
  });
 }
 function controls(){
  const host=document.getElementById('pageFields');
  if(!host||currentPDFPage!==11||host.querySelector('#page11-table-inputs'))return;
  const panel=document.createElement('div');panel.id='page11-table-inputs';panel.className='group';
  const title=document.createElement('h3');title.textContent='ตารางหน้า 11 · รายการเบิกพัสดุ';panel.append(title);
  const help=document.createElement('p');help.className='muted';help.textContent='กรอกรายการ จำนวน และหมายเหตุ ระบบใส่ลำดับที่ให้อัตโนมัติ เพิ่มได้สูงสุด 22 รายการ';panel.append(help);
  for(let i=0;i<count;i++){
   const block=document.createElement('div');block.className='input-wrap';
   const heading=document.createElement('strong');heading.textContent='รายการที่ '+(i+1);block.append(heading);
   keys.forEach((key,j)=>{
    const label=document.createElement('label'),input=document.createElement('input');
    input.id='field-'+field(i,key);label.htmlFor=input.id;label.textContent=labels[j];
    input.type='text';input.value=formValues[field(i,key)]??'';input.placeholder=labels[j];input.dataset.tableInput=field(i,key);
    input.addEventListener('input',()=>{formValues[field(i,key)]=input.value;save();paint()});
    block.append(label,input);
   });
   panel.append(block);
  }
  if(count<limit){
   const add=document.createElement('button');add.type='button';add.textContent='＋ เพิ่มรายการ';
   add.addEventListener('click',()=>{count++;save();panel.remove();controls();paint()});panel.append(add);
  }
  if(count>1){
   const remove=document.createElement('button');remove.type='button';remove.textContent='− ลดรายการสุดท้าย';remove.style.marginLeft='8px';
   remove.addEventListener('click',()=>{count--;keys.forEach(key=>delete formValues[field(count,key)]);save();panel.remove();controls();paint()});panel.append(remove);
  }
  host.append(panel);
 }
 window.exportPage11TableToWord=function(doc){
  const ns='http://schemas.openxmlformats.org/wordprocessingml/2006/main';
  const children=(node,tag)=>Array.from(node?.children||[]).filter(n=>n.namespaceURI===ns&&n.localName===tag);
  const table=Array.from(doc.getElementsByTagNameNS(ns,'tbl')).find(t=>{
   const rows=children(t,'tr'),header=children(rows[0],'tc');
   return rows.length===limit+1&&header.length===4&&header.map(c=>Array.from(c.getElementsByTagNameNS(ns,'t')).map(n=>n.textContent||'').join('')).join('|')==='ลำดับที่|รายการ|จำนวน|หมายเหตุ';
  });
  if(!table)return 0;
  const rows=children(table,'tr');let writes=0;
  for(let i=0;i<limit;i++){
   const cells=children(rows[i+1],'tc');if(cells.length!==4)continue;
   values(i).forEach((value,j)=>{
    let texts=Array.from(cells[j].getElementsByTagNameNS(ns,'t'));
    if(!texts.length){
     const p=children(cells[j],'p')[0];if(!p)return;
     const r=doc.createElementNS(ns,'w:r'),t=doc.createElementNS(ns,'w:t');r.append(t);p.append(r);texts=[t];
    }
    texts[0].textContent=value;texts[0].setAttributeNS('http://www.w3.org/XML/1998/namespace','xml:space','preserve');
    texts.slice(1).forEach(t=>t.textContent='');writes++;
   });
  }
  return writes;
 };
 const oldRender=renderPDFPage;
 renderPDFPage=async function(...args){const result=await oldRender.apply(this,args);controls();paint();return result};
 const oldFields=renderFormFields;
 renderFormFields=function(...args){const result=oldFields.apply(this,args);controls();return result};
 if(currentPDFPage===11){controls();paint()}
})();
