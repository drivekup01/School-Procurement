// All-page, source-specific DOCX data merge for "01 ซื้อสีทาสนาม(ทดลอง)(3).docx".
// Operates on WordprocessingML and retains all sections and styles not targeted.
const NS="http://schemas.openxmlformats.org/wordprocessingml/2006/main";
const n=(el,tag)=>[...el.getElementsByTagNameNS(NS,tag)];
const joined=el=>n(el,"t").map(x=>x.textContent||"").join("");
const first=(el,tag)=>n(el,tag)[0];
const decimal=v=>Number(v||0).toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2});
const moneyParts=v=>{const [a,b]=decimal(v).split(".");return [a,b]};
const oldSubject=/(?:วัสดุ\s*อุปกรณ์\s*อุปกรณ์\s*ทำสนามกีฬา|วัสดุ\s*อุปกรณ์\s*ทำสนามกีฬา|วัสดุ\s*อุปกรณ์\s*กีฬา)/g;
const oldProject=/จัดซื้อสื่อและวัสดุอุปกรณ์การเรียนการสอน\s*เพื่อยกระดับผลสัมฤทธิ์ทางการเรียน/g;
const oldAmountWords=/หนึ่งร้อยย?สี่สิบบาทถ้วน/g;
const oldItem=/สีน้ำมันตราเป็ดหงส์/g;
const oldVendor=/บริษัท\s*ศรีทอง\s*วัสดุก่อสร้าง\s*จำกัด/g;
const oldSchool=/โรงเรียนค่ายบางระจัน\s*วิทยาคม/g;
const oldAgency=/สำนักงานเขตพื้นที่การศึกษามัธยมศึกษา\s*สิงห์บุรี\s*อ่างทอง/g;
const oldDivision=/(?:ฝ่ายบริหารวิชาการ|ฝ่ายงานวิชาการ)/g;
const originalNames=[
 [/นางสาวณัฐมน\s*กลิ่นผล/g,"officerName"],
 [/นางสาวปภาวิไล\s*ชลอวงษ์/g,"inspectorName"],
 [/นายเรวัฒน์\s*พรหมสะโร\.?/g,"directorName"]
];
function nodesIn(p){return n(p,"t")}
function substitute(p,rx,value,log,label){
 if(value===null||value===undefined||String(value).trim()==="")return 0;
 const source=joined(p),found=[...source.matchAll(rx)];
 let count=0;
 for(let i=found.length-1;i>=0;i--){
  const m=found[i],v=typeof value==="function"?value(m,source):value;
  if(v===null||v===undefined||String(v).trim()==="")continue;
  const nodes=nodesIn(p);let start=m.index,end=m.index+m[0].length,at=0,begin=null,finish=null,beginOffset=0,finishOffset=0;
  nodes.forEach((t,k)=>{const length=(t.textContent||"").length;
   if(begin===null&&start>=at&&start<at+length){begin=k;beginOffset=start-at}
   if(finish===null&&end>at&&end<=at+length){finish=k;finishOffset=end-at}
   at+=length;
  });
  if(begin===null||finish===null){log.errors.push("ไม่พบช่วง XML: "+label+" "+m[0]);continue}
  const left=nodes[begin].textContent.slice(0,beginOffset),right=nodes[finish].textContent.slice(finishOffset);
  nodes[begin].textContent=left+String(v)+(begin===finish?right:"");
  nodes[begin].setAttribute("xml:space","preserve");
  for(let j=begin+1;j<=finish;j++)nodes[j].textContent=(j===finish?right:"");
  count++;
 }
 if(count){log.replacements[label]=(log.replacements[label]||0)+count}
 return count;
}
function dateThai(input){if(!/^\d{4}-\d\d-\d\d$/.test(input||""))return null;let [y,m,d]=input.split("-").map(Number);
 return d+" "+["มกราคม","กุมภาพันธ์","มีนาคม","เมษายน","พฤษภาคม","มิถุนายน","กรกฎาคม","สิงหาคม","กันยายน","ตุลาคม","พฤศจิกายน","ธันวาคม"][m-1]+" "+(y+543)}
function toThai(value){return dateThai(value)||value||null}
function contextDate(text,matched,d){
 const before=text.slice(Math.max(0,matched.index-85),matched.index);
 if(/ประกาศ\s*ณ\s*วันที่/.test(before)||/ประกาศผู้ชนะ/.test(before))return d.winnerDate||d.requestDate;
 if(/ส่งมอบ|ครบกำหนด/.test(before))return d.actualDeliveryDate||d.deliveryDate||d.requestDate;
 if(/ใบส่งของ|ใบแจ้งหนี้|ใบวางบิล/.test(before))return d.invoiceDate||d.receivedDate||d.requestDate;
 if(/ตรวจรับ|รับพัสดุ/.test(before))return d.receivedDate||d.requestDate;
 if(/อนุมัติ\s*TOR|เห็นชอบ/.test(before))return d.torApprovalDate||d.requestDate;
 if(/ใบสั่งซื้อ|ใบสั่งจ้าง/.test(before))return d.orderDate||d.requestDate;
 if(/ใบเบิก|ขอเบิก/.test(before))return d.requisitionDate||d.requestDate;
 return d.requestDate;
}
function setCell(cell,value){
 if(value===undefined||value===null)return false;
 let t=first(cell,"t");
 if(!t){let p=first(cell,"p"),r=p?first(p,"r"):null;if(!p){p=cell.ownerDocument.createElementNS(NS,"w:p");cell.appendChild(p)}if(!r){r=cell.ownerDocument.createElementNS(NS,"w:r");p.appendChild(r)}t=cell.ownerDocument.createElementNS(NS,"w:t");r.appendChild(t)}
 t.textContent=String(value);t.setAttribute("xml:space","preserve");
 for(const other of n(cell,"t"))if(other!==t)other.textContent="";
 return true;
}
function directCells(tr){return [...tr.childNodes].filter(x=>x.nodeType===1&&x.localName==="tc")}
function fillFinancialTotals(doc,data,items,log){
 const sum=items.reduce((a,item)=>a+Number(item.qty||0)*Number(item.unitPrice||0),0);
 const vat=Number(data.vatAmount||0);
 const fine=Number(data.fineAmount||0);
 const withholding=Number(data.withholdingAmount||0);
 let rows=0;
 for(const tr of n(doc,"tr")){
  if(n(tr,"tr").some(child=>child!==tr))continue;
  const cells=directCells(tr);
  if(!cells.length)continue;
  const text=joined(tr).replace(/\s+/g,"");
  let value=null;
  if(/(?:ภาษีมูลค่าเพิ่ม)/.test(text))value=vat;
  else if(/(?:คงเหลือ|ยอดสุทธิ)/.test(text))value=sum+vat-withholding-fine;
  else if(/รวมเงิน|รวมทั้งสิ้น|รวมเป็นเงิน|จำนวนเงิน/.test(text))value=sum+vat;
  else if(/ภาษีณที่จ่าย/.test(text))value=withholding;
  else if(/ค่าปรับ/.test(text))value=fine;
  if(value===null)continue;
  const last=cells[cells.length-1],before=cells[cells.length-2];
  if(cells.length>=4&&/^\s*[0-9.,\s]+\s*$/.test(joined(last))&&/^\s*[0-9.,\s]+\s*$/.test(joined(before))){
   const [baht,satang]=moneyParts(value);setCell(before,baht);setCell(last,satang);
  }else{
   setCell(last,decimal(value));
  }
  rows++;
 }
 log.financialRows=rows;
}
function fillItemTables(doc,items,log){
 const matches=n(doc,"tr").filter(r=>joined(r).replace(/\s/g,"").includes("สีน้ำมันตราเป็ดหงส์"));
 log.itemTableRows=matches.length;
 if(!items.length){log.errors.push("ไม่มีรายการพัสดุในแฟ้มชุดเบิก");return}
 if(!matches.length){log.errors.push("ไม่พบแถวพัสดุต้นฉบับในตาราง Word");return}
 matches.forEach(row=>{
  const cells=directCells(row),length=cells.length;
  if(length<3){log.errors.push("แถวพัสดุตารางไม่ครบช่อง ("+length+")");return}
  const parent=row.parentNode;
  let lastRow=row;
  items.forEach((item,i)=>{
   const r=i===0?row:row.cloneNode(true),c=directCells(r),qty=Number(item.qty||0),unit=String(item.unit||"");
   const ref=moneyParts(item.referencePrice??item.unitPrice),price=moneyParts(item.unitPrice);
   const total=moneyParts(qty*Number(item.unitPrice));
   if(c.length>=9){
    setCell(c[0],i+1);setCell(c[1],item.name);setCell(c[2],qty+" "+unit);
    const tail=c.length-6;
    setCell(c[tail],ref[0]);setCell(c[tail+1],ref[1]);
    setCell(c[tail+2],price[0]);setCell(c[tail+3],price[1]);
    setCell(c[tail+4],total[0]);setCell(c[tail+5],total[1]);
   }else if(c.length===8){
    setCell(c[0],i+1);setCell(c[1],item.name);setCell(c[2],qty+" "+unit);
    setCell(c[3],ref[0]);setCell(c[4],ref[1]);
    setCell(c[5],price[0]);setCell(c[6],price[1]);
    setCell(c[7],decimal(qty*Number(item.unitPrice)));
   }else if(c.length>=6){
    setCell(c[0],i+1);setCell(c[1],item.name);setCell(c[2],qty+" "+unit);
    setCell(c[c.length-3],decimal(item.referencePrice??item.unitPrice));
    setCell(c[c.length-2],decimal(item.unitPrice));
    setCell(c[c.length-1],decimal(qty*Number(item.unitPrice)));
   }else if(c.length===4){setCell(c[0],i+1);setCell(c[1],item.name);setCell(c[2],qty+" "+unit)}
   else {setCell(c[0],i+1);setCell(c[1],item.name);setCell(c[2],qty+" "+unit)}
   if(i>0){parent.insertBefore(r,lastRow.nextSibling);lastRow=r}
  });
 });
 log.itemRowsWritten=matches.length*items.length;
}
export function mergeOriginalWord(doc,values,items){
 const d={...values};const log={replacements:{},errors:[],itemRowsWritten:0,itemTableRows:0,unresolved:[],inputCoverage:[]};
 const use=(k)=>String(d[k]??"").trim()||null;
 const sum=(items||[]).reduce((a,x)=>a+(Number(x.qty)||0)*(Number(x.unitPrice)||0),0);
 const budget=sum>0?sum:Number(String(d.budget||"0").replace(/,/g,""));
 const budgetStr=decimal(budget),priceStr=decimal(d.agreedAmount||budget);
 const docParagraphs=n(doc,"p");
 // Capture the original table rows before replacing example names globally.
 fillItemTables(doc,items,log);
 fillFinancialTotals(doc,d,items,log);
 // Copy the same fields across every occurrence, whether highlighted or not.
 for(const p of docParagraphs){
  const text=joined(p);
  if(!text.trim())continue;
  if(use("project")||use("activity")){
   substitute(p,oldProject,m=>{
    const whole=joined(p),pos=m.index;
    const prior=whole.slice(Math.max(0,pos-60),pos);
    const lastActivity=prior.lastIndexOf("กิจกรรม"),lastProject=prior.lastIndexOf("โครงการ");
    return lastActivity>lastProject?use("activity")||use("project"):use("project")||use("activity");
   },log,"โครงการ/กิจกรรม");
  }
  substitute(p,oldSubject,use("subject"),log,"ชื่องานจัดซื้อ");
  substitute(p,oldVendor,use("vendor"),log,"ชื่อผู้ขาย");
  substitute(p,oldSchool,use("schoolName"),log,"ชื่อโรงเรียน");
  substitute(p,oldAgency,use("agency"),log,"ต้นสังกัด");
  substitute(p,oldDivision,use("division"),log,"ฝ่าย");
  for(const [pattern,key] of originalNames)substitute(p,pattern,use(key),log,key);
  // Sunisa is in different official roles; choose from local paragraph context.
  substitute(p,/นางสาวสุนิสา\s*อิ่มรัง/g,(m,full)=>{
   const near=full.slice(Math.max(0,m.index-85),m.index);
   if(near.includes("หัวหน้าเจ้าหน้าที่"))return use("headOfficerName")||use("torAuthor");
   if(/ผู้เบิก|ผู้รับแทน/.test(near))return use("requisitionOwner")||use("torAuthor");
   return use("torAuthor")||use("headOfficerName");
  },log,"ผู้จัดทำ/หัวหน้าเจ้าหน้าที่");
  substitute(p,oldItem,use("itemDescription"),log,"ชื่อรายการพัสดุ");
  substitute(p,oldAmountWords,use("amountWords"),log,"จำนวนเงินตัวอักษร");
  substitute(p,/24\s*สิงหาคม\s*2569|24\/ส\.ค\.\/2569/g,(m,full)=>toThai(contextDate(full,m,d)),log,"วันที่เอกสาร");
  substitute(p,/25\s*สิงหาคม\s*2569/g,toThai(use("winnerDate")||use("requestDate")),log,"วันที่ประกาศ");
  substitute(p,/26\s*สิงหาคม\s*2569/g,(m,full)=>dateThai(contextDate(full,m,d)),log,"วันที่ส่ง/ตรวจรับ");
  substitute(p,/27\s*สิงหาคม\s*2569/g,toThai(use("activityDate")||use("requestDate")),log,"วันที่กิจกรรม");
  if(d.budget&&budget>0){
   // Original test file uses 140.00 (incl. split 140 00 in several tables).
   substitute(p,/140\s*[.,]\s*0{1,2}(?!\d)/g,(m,whole)=>{
    const before=whole.slice(Math.max(0,m.index-48),m.index);
    if(/มาตรฐาน|ตลาด|หน่วยละ/.test(before))return decimal(items[0]?.referencePrice||items[0]?.unitPrice||budget);
    return priceStr;
   },log,"วงเงิน/ราคา");
  }
  if(use("invoiceNo")){
   substitute(p,/ORNC69P0100821/g,use("invoiceNo"),log,"เลขที่ใบส่งของ");
  }
  if(/กำหนด.*ส่งมอบ|ส่งมอบพัสดุ/.test(joined(p))&&use("deliveryDays")){
   substitute(p,/([.]{2,})\s*3\s*([.]{2,})/g,use("deliveryDays"),log,"กำหนดส่งมอบ");
  }
  if(/จำนวน.*รายการ|จัดซื้อ.*รายการ/.test(joined(p))){
   substitute(p,/([12])\s*รายการ/g,String(items.length)+" รายการ",log,"จำนวนรายการ");
  }
  if(/ภาษีมูลค่าเพิ่ม/.test(joined(p))&&use("vatAmount")){
   substitute(p,/0{1,2}\s*[.,]\s*0{2}/g,decimal(d.vatAmount),log,"ภาษีมูลค่าเพิ่ม");
  }
  if(items.length===1){
   substitute(p,/1\s*กระป๋อง/g,Number(items[0].qty)+" "+items[0].unit,log,"จำนวนพัสดุ");
  }
 }
 // Rewrite the original row(s) in every matching source item table, including
 // the TOR specification, attached schedules, and material requisition.
 const after=joined(doc);
 for(const [key,rx] of [["โครงการเดิม",oldProject],["ชื่องานเดิม",oldSubject],["ผู้ขายเดิม",oldVendor],["รายการเดิม",oldItem]]){
  rx.lastIndex=0;
  if(rx.test(after))log.unresolved.push(key);
  rx.lastIndex=0;
 }
 if(items.length>1&&log.itemTableRows===0)log.unresolved.push("ตารางหลายรายการ");
 log.inputCoverage=Object.entries(log.replacements).filter(x=>x[1]).map(([name,count])=>({name,count}));
 log.paragraphsInspected=docParagraphs.length;
 return log;
}
