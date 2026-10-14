/* Page 4 only — table cell mapping pilot. No changes to other page renderers. */
(function(){
 const storageKey='school-procurement-page4-table-v1';
 const keys=['description','quantity','reference','unitPrice','amount'];
 const labels=['รายละเอียดวัสดุ','จำนวนหน่วย','ราคาอ้างอิง (บาท.สตางค์)','ราคาต่อหน่วย (บาท.สตางค์)','จำนวนเงิน (บาท.สตางค์)'];
 let data={};
 try{data=JSON.parse(localStorage.getItem(storageKey)||'{}')||{}}catch{}
 let visibleCount=Math.max(1,Math.min(5,Number(data.visibleCount)||1));
 const save=()=>{try{localStorage.setItem(storageKey,JSON.stringify(data))}catch{}};
 const thaiNumber=n=>{
  const digits=['ศูนย์','หนึ่ง','สอง','สาม','สี่','ห้า','หก','เจ็ด','แปด','เก้า'];
  const groups=['','ล้าน','ล้านล้าน'];
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
  let result='',index=0;
  while(n>0){const chunk=n%1000000;if(chunk)result=underMillion(chunk)+(groups[index]||'ล้าน'.repeat(index))+result;n=Math.floor(n/1000000);index++;}
  return result;
 };
 const bahtText=value=>{
  const cents=Math.round(value*100),baht=Math.floor(cents/100),sat=cents%100;
  return thaiNumber(baht)+'บาท'+(sat?thaiNumber(sat)+'สตางค์':'ถ้วน');
 };
 const splitMoney=value=>{
  if(!String(value??'').trim())return ['',''];
  const number=Number(String(value).replace(/,/g,''));
  if(!Number.isFinite(number)||number<0)return ['',''];
  const cents=Math.round(number*100),baht=Math.floor(cents/100),sat=cents%100;
  return [baht.toLocaleString('en-US'),sat===0?'-':String(sat).padStart(2,'0')];
 };
 function paint(){
  if(currentPDFPage!==4)return;
  const table=document.querySelector('#pdfRender .word-page4-table');
  if(!table)return;
  const rows=Array.from(table.rows);
  // Source Word: 2 header rows; item rows 2–6; total row 7.
  for(let i=0;i<5;i++){
   const cells=Array.from(rows[i+2]?.cells||[]);
   if(cells.length!==9)continue;
   const item=i<visibleCount?(data[i]||{}):{};
   const reference=splitMoney(item.reference),price=splitMoney(item.unitPrice),amount=splitMoney(item.amount);
   const values=[item.description?String(i+1):'',item.description||'',item.quantity||'',...reference,...price,...amount];
   values.forEach((v,j)=>{cells[j].textContent=String(v);cells[j].dataset.tableField='items.'+i+'.'+(['no','description','quantity','referenceBaht','referenceSat','unitBaht','unitSat','amountBaht','amountSat'][j]);});
  }
  const amounts=Array.from({length:visibleCount},(_,i)=>data[i]?.amount).filter(v=>String(v??'').trim()!=='');
  const valid=amounts.every(v=>Number.isFinite(Number(String(v).replace(/,/g,'')))&&Number(String(v).replace(/,/g,''))>=0);
  const total=valid?amounts.reduce((sum,v)=>sum+Math.round(Number(String(v).replace(/,/g,''))*100),0)/100:null;
  if(total!==null&&amounts.length){
   const last=Array.from(rows[7]?.cells||[]);
   if(last.length===3){
    const [baht,sat]=splitMoney(total);
    last[1].textContent=baht;last[2].textContent=sat;
    const summary=last[0];if(summary){summary.textContent='รวมเป็นเงินทั้งสิ้น ('+bahtText(total)+')';summary.dataset.tableField='grandTotalText';}
   }
  }
 }
 function controls(){
  const host=document.getElementById('pageFields');
  if(!host||currentPDFPage!==4||host.querySelector('#page4-table-inputs'))return;
  const panel=document.createElement('div');panel.id='page4-table-inputs';panel.className='group';
  const heading=document.createElement('h3');heading.textContent='ตารางหน้า 4 · รายการพัสดุ';panel.append(heading);
  const help=document.createElement('p');help.className='muted';help.textContent='กรอกตัวเลขราคาเป็น 30.65 ระบบจะแยกบาทและสตางค์ลงเซลล์เดิม โดยไม่คำนวณจำนวนเงินแทนผู้ใช้';panel.append(help);
  for(let i=0;i<visibleCount;i++){
   const block=document.createElement('div');block.className='input-wrap';
   const title=document.createElement('strong');title.textContent='รายการที่ '+(i+1);block.append(title);
   for(let j=0;j<keys.length;j++){
    const key=keys[j],label=document.createElement('label'),input=document.createElement('input');
    label.textContent=labels[j];input.type='text';input.inputMode=j>=2?'decimal':'text';
    input.value=data[i]?.[key]||'';input.placeholder=labels[j];input.dataset.tableInput=i+'.'+key;
    input.addEventListener('input',()=>{(data[i]??={})[key]=input.value;save();paint()});
    block.append(label,input);
   }
   panel.append(block);
  }
  if(visibleCount<5){
   const add=document.createElement('button');add.type='button';add.textContent='＋ เพิ่มรายการ';add.style.marginTop='12px';
   add.addEventListener('click',()=>{visibleCount++;data.visibleCount=visibleCount;save();panel.remove();controls();paint()});
   panel.append(add);
  }
  if(visibleCount>1){
   const remove=document.createElement('button');remove.type='button';remove.textContent='− ลดรายการสุดท้าย';remove.style.margin='12px 0 0 8px';
   remove.addEventListener('click',()=>{visibleCount--;data.visibleCount=visibleCount;save();panel.remove();controls();paint()});
   panel.append(remove);
  }
  host.append(panel);
 }

 // Export mapping targets only the original 9-column procurement table.
 window.exportPage4TableToWord=function(doc){
  const ns='http://schemas.openxmlformats.org/wordprocessingml/2006/main';
  const children=(node,tag)=>Array.from(node?.children||[]).filter(x=>x.localName===tag&&x.namespaceURI===ns);
  const tables=Array.from(doc.getElementsByTagNameNS(ns,'tbl'));
  const table=tables.find(t=>Array.from(t.getElementsByTagNameNS(ns,'t')).some(n=>(n.textContent||'').includes('รายละเอียดของวัสดุที่จะซื้อ/จ้าง')));
  if(!table)return 0;
  const rows=children(table,'tr');
  if(rows.length<8)return 0;
  function write(cell,value){
   if(!cell)return false;
   const texts=Array.from(cell.getElementsByTagNameNS(ns,'t'));
   if(!texts.length)return false;
   texts[0].textContent=String(value??'');
   texts[0].setAttribute('xml:space','preserve');
   texts.slice(1).forEach(n=>n.textContent='');
   return true;
  }
  let writes=0;
  for(let i=0;i<5;i++){
   const cells=children(rows[i+2],'tc');
   if(cells.length!==9)continue;
   const item=i<visibleCount?(data[i]||{}):{};
   const ref=splitMoney(item.reference),price=splitMoney(item.unitPrice),amount=splitMoney(item.amount);
   const values=[item.description?String(i+1):'',item.description||'',item.quantity||'',...ref,...price,...amount];
   values.forEach((value,j)=>{if(write(cells[j],value))writes++});
  }
  const amounts=Array.from({length:visibleCount},(_,i)=>data[i]?.amount).filter(v=>String(v??'').trim()!=='');
  const valid=amounts.every(v=>Number.isFinite(Number(String(v).replace(/,/g,'')))&&Number(String(v).replace(/,/g,''))>=0);
  if(valid&&amounts.length){
   const total=amounts.reduce((sum,v)=>sum+Math.round(Number(String(v).replace(/,/g,''))*100),0)/100;
   const cells=children(rows[7],'tc'),parts=splitMoney(total);
   if(cells.length===3){
    const summary=cells[0],texts=Array.from(summary.getElementsByTagNameNS(ns,'t'));
    const original=texts.map(n=>n.textContent||'').join('');
    if(texts.length){
     const label='รวมเป็นเงินทั้งสิ้น ('+bahtText(total)+')';
     // Keep Word paragraph/cell structure; replace text only.
     if(write(summary,label))writes++;
    }
    if(write(cells[1],parts[0]))writes++;
    if(write(cells[2],parts[1]))writes++;
   }
  }
  return writes;
 };
 const oldRender=renderPDFPage;
 renderPDFPage=async function(...args){const result=await oldRender.apply(this,args);controls();paint();return result};
 const oldFields=renderFormFields;
 renderFormFields=function(...args){const result=oldFields.apply(this,args);controls();return result};
 if(currentPDFPage===4){controls();paint()}
})();
