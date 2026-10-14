/* Page 6 only: use the page 4 input-to-cell mapping for Word's single item row. */
(function(){
 const storageKey='school-procurement-page6-table-v1';
 const keys=['description','quantity','reference','unitPrice','amount'];
 const labels=['รายละเอียดพัสดุที่จัดซื้อ/จัดจ้าง','จำนวนหน่วย','ราคาอ้างอิง (บาท.สตางค์)','ราคาต่อหน่วย (บาท.สตางค์)','จำนวนเงิน (บาท.สตางค์)'];
 const cellKeys=['no','description','quantity','referenceBaht','referenceSat','unitBaht','unitSat','amountBaht','amountSat'];
 let data={};
 window.resetPage6Draft=()=>{data=JSON.parse(localStorage.getItem(storageKey)||'{}')||{}};
 try{const saved=JSON.parse(localStorage.getItem(storageKey)||'{}');if(saved&&typeof saved==='object'&&!Array.isArray(saved))data=saved}catch{}
 const save=()=>{try{localStorage.setItem(storageKey,JSON.stringify(data))}catch{}};
 function splitMoney(value){
  if(!String(value??'').trim())return ['',''];
  const number=Number(String(value).replace(/,/g,''));
  if(!Number.isFinite(number)||number<0||!Number.isSafeInteger(Math.round(number*100)))return ['',''];
  const cents=Math.round(number*100);
  return [Math.floor(cents/100).toLocaleString('en-US'),cents%100===0?'-':String(cents%100).padStart(2,'0')];
 }
 function thaiNumber(n){
  const digits=['ศูนย์','หนึ่ง','สอง','สาม','สี่','ห้า','หก','เจ็ด','แปด','เก้า'];
  function underMillion(value){
   const str=String(value),units=['','สิบ','ร้อย','พัน','หมื่น','แสน'];let out='';
   for(let i=0;i<str.length;i++){
    const d=Number(str[i]),position=str.length-i-1;
    if(!d)continue;
    if(position===1&&d===1)out+='สิบ';
    else if(position===1&&d===2)out+='ยี่สิบ';
    else if(position===0&&d===1&&str.length>1)out+='เอ็ด';
    else out+=digits[d]+units[position];
   }
   return out;
  }
  if(n===0)return digits[0];
  if(n<1000000)return underMillion(n);
  const remainder=n%1000000;
  return thaiNumber(Math.floor(n/1000000))+'ล้าน'+(remainder?underMillion(remainder):'');
 }
 function values(){
  return [data.description?'1':'',data.description||'',data.quantity||'',...splitMoney(data.reference),...splitMoney(data.unitPrice),...splitMoney(data.amount)];
 }
 function summary(){
  const parts=splitMoney(data.amount);
  if(parts[0]==='')return null;
  const cents=Math.round(Number(String(data.amount).replace(/,/g,''))*100);
  return ['รวมเป็นเงินทั้งสิ้น ('+thaiNumber(Math.floor(cents/100))+'บาท'+(cents%100?thaiNumber(cents%100)+'สตางค์':'ถ้วน')+')',...parts];
 }
 function writePreview(cell,value){
  // Keep the blank Word paragraphs so typing does not collapse the item area.
  const paragraphs=Array.from(cell.querySelectorAll(':scope > .word-paragraph'));
  if(!paragraphs.length){cell.textContent=String(value);return}
  paragraphs.forEach((p,index)=>{
   p.textContent=index===0?String(value):'';
   p.classList.toggle('word-empty',!p.textContent.trim());
  });
 }
 function paint(){
  if(currentPDFPage!==6)return;
  const table=document.querySelector('#pdfRender .word-page6-table');
  if(!table||table.rows.length!==4||table.rows[2].cells.length!==9)return;
  values().forEach((value,index)=>{
   const cell=table.rows[2].cells[index];writePreview(cell,value);
   cell.dataset.tableField='page6.items.0.'+cellKeys[index];
  });
  const total=summary(),last=table.rows[3];
  if(total)total.forEach((value,index)=>writePreview(last.cells[index],value));
  else{
   const original=wordPages[5]?.querySelector('.word-page6-table');
   if(original)Array.from(last.cells).forEach((cell,index)=>{cell.innerHTML=original.rows[3].cells[index].innerHTML});
  }
 }
 function controls(){
  const host=document.getElementById('pageFields');
  if(!host||currentPDFPage!==6||host.querySelector('#page6-table-inputs'))return;
  const panel=document.createElement('div');panel.id='page6-table-inputs';panel.className='group';
  const heading=document.createElement('h3');heading.textContent='ตารางหน้า 6 · รายการพัสดุ';panel.append(heading);
  const help=document.createElement('p');help.className='muted';help.textContent='กรอกราคา เช่น 30.65 ระบบจะแยกบาทและสตางค์ จำนวนเงินให้กรอกตามรายการ โดยไม่คำนวณจากจำนวนหน่วยแทนผู้ใช้';panel.append(help);
  const block=document.createElement('div');block.className='input-wrap';
  const title=document.createElement('strong');title.textContent='รายการที่ 1';block.append(title);
  keys.forEach((key,index)=>{
   const label=document.createElement('label'),input=document.createElement('input');
   input.id='page6-item-0-'+key;label.htmlFor=input.id;label.textContent=labels[index];
   input.type='text';input.inputMode=index>=2?'decimal':'text';input.value=data[key]??'';
   input.placeholder=labels[index];input.dataset.tableInput='page6.0.'+key;
   input.addEventListener('input',()=>{data[key]=input.value;save();paint()});
   block.append(label,input);
  });
  panel.append(block);host.append(panel);
 }
 window.exportPage6TableToWord=function(doc){
  const ns='http://schemas.openxmlformats.org/wordprocessingml/2006/main';
  const children=(node,tag)=>Array.from(node?.children||[]).filter(x=>x.localName===tag&&x.namespaceURI===ns);
  const table=Array.from(doc.getElementsByTagNameNS(ns,'tbl')).find(t=>Array.from(t.getElementsByTagNameNS(ns,'t')).map(n=>n.textContent||'').join('').includes('รายละเอียดของพัสดุที่จัดซื้อ/จัดจ้าง'));
  const rows=children(table,'tr');
  if(rows.length!==4||children(rows[2],'tc').length!==9||children(rows[3],'tc').length!==3||!keys.some(key=>String(data[key]??'').trim()))return 0;
  function write(cell,value){
   let texts=Array.from(cell.getElementsByTagNameNS(ns,'t'));
   if(!texts.length){
    const paragraph=children(cell,'p')[0];if(!paragraph)return false;
    const run=doc.createElementNS(ns,'w:r'),text=doc.createElementNS(ns,'w:t');
    text.setAttributeNS('http://www.w3.org/XML/1998/namespace','xml:space','preserve');
    run.append(text);paragraph.append(run);texts=[text];
   }
   texts[0].textContent=String(value);texts.slice(1).forEach(t=>t.textContent='');return true;
  }
  let writes=0;
  const cells=children(rows[2],'tc');
  values().forEach((value,index)=>{if(write(cells[index],value))writes++});
  const total=summary();
  if(total){const last=children(rows[3],'tc');total.forEach((value,index)=>{if(write(last[index],value))writes++})}
  return writes;
 };
 const oldRender=renderPDFPage;
 renderPDFPage=async function(...args){const result=await oldRender.apply(this,args);controls();paint();return result};
 const oldFields=renderFormFields;
 renderFormFields=function(...args){const result=oldFields.apply(this,args);controls();return result};
 if(currentPDFPage===6){controls();paint()}
})();
