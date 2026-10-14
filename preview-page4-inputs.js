/* Page 4 only — table cell mapping pilot. No changes to other page renderers. */
(function(){
 const storageKey='school-procurement-page4-table-v1';
 const keys=['description','quantity','reference','unitPrice','amount'];
 const labels=['รายละเอียดวัสดุ','จำนวนหน่วย','ราคาอ้างอิง (บาท.สตางค์)','ราคาต่อหน่วย (บาท.สตางค์)','จำนวนเงิน (บาท.สตางค์)'];
 let data={};
 try{data=JSON.parse(localStorage.getItem(storageKey)||'{}')||{}}catch{}
 const save=()=>{try{localStorage.setItem(storageKey,JSON.stringify(data))}catch{}};
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
   const item=data[i]||{};
   const reference=splitMoney(item.reference),price=splitMoney(item.unitPrice),amount=splitMoney(item.amount);
   const values=[item.description?String(i+1):'',item.description||'',item.quantity||'',...reference,...price,...amount];
   values.forEach((v,j)=>{cells[j].textContent=String(v);cells[j].dataset.tableField='items.'+i+'.'+(['no','description','quantity','referenceBaht','referenceSat','unitBaht','unitSat','amountBaht','amountSat'][j]);});
  }
  const amounts=Array.from({length:5},(_,i)=>data[i]?.amount).filter(v=>String(v??'').trim()!=='');
  const valid=amounts.every(v=>Number.isFinite(Number(String(v).replace(/,/g,'')))&&Number(String(v).replace(/,/g,''))>=0);
  const total=valid?amounts.reduce((sum,v)=>sum+Math.round(Number(String(v).replace(/,/g,''))*100),0)/100:null;
  if(total!==null&&amounts.length){
   const last=Array.from(rows[7]?.cells||[]);
   if(last.length===3){
    const [baht,sat]=splitMoney(total);
    last[1].textContent=baht;last[2].textContent=sat;
   }
  }
 }
 function controls(){
  const host=document.getElementById('pageFields');
  if(!host||currentPDFPage!==4||host.querySelector('#page4-table-inputs'))return;
  const panel=document.createElement('div');panel.id='page4-table-inputs';panel.className='group';
  const heading=document.createElement('h3');heading.textContent='ตารางหน้า 4 · รายการพัสดุ (ทดลอง Mapping 5 แถว)';panel.append(heading);
  const help=document.createElement('p');help.className='muted';help.textContent='กรอกตัวเลขราคาเป็น 30.65 ระบบจะแยกบาทและสตางค์ลงเซลล์เดิม โดยไม่คำนวณจำนวนเงินแทนผู้ใช้';panel.append(help);
  for(let i=0;i<5;i++){
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
  host.append(panel);
 }
 const oldRender=renderPDFPage;
 renderPDFPage=async function(...args){const result=await oldRender.apply(this,args);controls();paint();return result};
 const oldFields=renderFormFields;
 renderFormFields=function(...args){const result=oldFields.apply(this,args);controls();return result};
 if(currentPDFPage===4){controls();paint()}
})();
