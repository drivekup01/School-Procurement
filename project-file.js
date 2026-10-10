"use strict";
// Demo project sourced from the user's uploaded 10-page March 2569 procurement PDF.
// The public repository intentionally contains no original PDF or private identities.
const FILE_PROJECT="demo-bus-fuel-project-2569";
const FILE_JOB="demo-bus-fuel-purchase-2569";
const fileDocs=[
[1,"มอบหมายผู้กำหนดคุณลักษณะ"],[2,"ขอความเห็นชอบ TOR"],[3,"TOR – ขอบเขตงาน หน้า 1"],[4,"TOR – ตารางและเงื่อนไข หน้า 2"],
[5,"รายงานขอซื้อ"],[6,"รายการพัสดุแนบท้าย"],[7,"รายงานผลและขออนุมัติสั่งซื้อ"],[8,"ใบตรวจรับพัสดุ"],[9,"รายงานตรวจรับและขออนุมัติเบิกจ่าย"],[10,"ใบเบิกพัสดุ"]
];
let fileProjectId=null,fileBlob=null,fileBlobUrl=null;
function fileSeed(){
if(!db.projects.some(p=>p.id===FILE_PROJECT))db.projects.push({id:FILE_PROJECT,name:"โครงการรถรับ–ส่งนักเรียน",departmentId:"general",year:2569,budget:0,isExample:true});
if(!db.jobs.some(j=>j.id===FILE_JOB))db.jobs.push({id:FILE_JOB,projectId:FILE_PROJECT,departmentId:"general",name:"จัดซื้อน้ำมันเชื้อเพลิงรถรับ–ส่งนักเรียน (มีนาคม 2569)",vendor:"ผู้จำหน่ายตามเอกสารจริง (ข้อมูลไม่เผยแพร่)",budget:1960,approved:1960,paid:0,status:"received",updatedAt:"2026-04-03T00:00:00.000Z",isExample:true});
try{localStorage.setItem(KEY,JSON.stringify(db))}catch(e){console.warn("Cannot persist demo project",e)}
render();
}
async function fileDB(){
return new Promise((resolve,reject)=>{const q=indexedDB.open("schoolProcurementFilesPreview",1);q.onupgradeneeded=()=>q.result.createObjectStore("documents");q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error)});
}
async function fileLoadSaved(){
try{const con=await fileDB();let result=await new Promise((resolve,reject)=>{const q=con.transaction("documents","readonly").objectStore("documents").get("march-2569-pdf");q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error)});con.close();if(result instanceof Blob)fileSetBlob(result)}catch(e){console.warn("PDF restore unavailable",e)}
}
function fileSetBlob(blob){if(fileBlobUrl)URL.revokeObjectURL(fileBlobUrl);fileBlob=blob;fileBlobUrl=URL.createObjectURL(blob);const t=document.getElementById("filePdfStatus");if(t)t.textContent="PDF ต้นฉบับพร้อมดู ("+(blob.size/1024).toFixed(0)+" KB) · เก็บเฉพาะในเบราว์เซอร์นี้";}
async function fileChoose(ev){
const pdf=ev.files?.[0];if(!pdf)return;
if(pdf.type!=="application/pdf"&&!pdf.name.toLowerCase().endsWith(".pdf"))return alert("โปรดเลือกไฟล์ PDF");
if(pdf.size>25*1024*1024)return alert("ไฟล์เกิน 25 MB");
try{const conn=await fileDB();await new Promise((resolve,reject)=>{const tx=conn.transaction("documents","readwrite");tx.objectStore("documents").put(pdf,"march-2569-pdf");tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error)});conn.close();fileSetBlob(pdf);fileJump(1)}catch(e){fileSetBlob(pdf);fileJump(1);alert("เปิดไฟล์ได้ แต่เบราว์เซอร์ไม่อนุญาตให้เก็บไฟล์ไว้สำหรับครั้งถัดไป")}
}
function fileJump(n){
if(!fileBlobUrl){document.getElementById("filePdfInput")?.focus();alert("เลือกไฟล์ PDF ต้นฉบับก่อนหนึ่งครั้ง (ไฟล์จะไม่ถูกส่งขึ้น GitHub)");return}
let frame=document.getElementById("filePdfViewer");frame.src=fileBlobUrl+"#page="+n+"&view=FitH";document.querySelectorAll(".fileDocButton").forEach(b=>b.classList.toggle("chosen",Number(b.dataset.page)===n));frame.scrollIntoView({behavior:"smooth",block:"nearest"});
}
function fileDownload(){
if(!fileBlobUrl)return alert("ยังไม่ได้เปิดไฟล์ PDF");
const a=document.createElement("a");a.href=fileBlobUrl;a.download="69-3-mar-procurement-original.pdf";a.click();
}
function openProjectFile(id){
const p=project(id);if(!p)return;fileProjectId=id;go("projects");const jobs=db.jobs.filter(j=>j.projectId===id);
const main=document.getElementById("projectFileDetails");
main.classList.remove("hidden");
let html='<div class="fileTitle"><div><div class="muted">แฟ้มโครงการ · ปีงบประมาณ '+esc(p.year)+'</div><h2>'+esc(p.name)+'</h2><div>'+esc(dept(p.departmentId))+'</div></div><button class="muted-btn" onclick="document.getElementById(\'projectFileDetails\').classList.add(\'hidden\')">ปิดแฟ้ม</button></div>';
html+='<div class="fileStats"><div><small>งานจัดซื้อที่พบ</small><strong>'+jobs.length+' รายการ</strong></div><div><small>ยอดอนุมัติจากรายการในระบบ</small><strong>'+money(jobs.reduce((n,j)=>n+counted(j),0))+'</strong></div><div><small>งบจัดสรรทั้งโครงการ</small><strong>'+(p.isExample?'ยังไม่มีข้อมูลยืนยัน':money(p.budget))+'</strong></div></div>';
html+='<h3>รายละเอียดงานภายในโครงการ</h3>';
jobs.forEach(j=>{html+='<div class="fileJob"><div><b>'+esc(j.name)+'</b><div class="muted">วงเงิน '+money(j.budget)+' · สถานะในข้อมูลตัวอย่าง: '+esc(status(j.status))+'</div></div><button class="muted-btn" onclick="go(\'jobs\');showJob('+JSON.stringify(j.id).replace(/"/g,'&quot;')+')">ดูรายละเอียดงาน</button></div>'});
if(id===FILE_PROJECT){
html+='<div class="filePdfBox"><h3>เอกสาร PDF ฉบับจริง — งานเดือนมีนาคม 2569</h3><p>เอกสารที่คุณเคยส่งมา 10 หน้า มีข้อมูลจริงตามต้นฉบับ ไม่ได้สร้างเนื้อหาเอกสารใหม่</p>';
html+='<p class="fileWarn">เว็บนี้ยังเป็น GitHub Pages สาธารณะ จึงไม่ได้เก็บไฟล์ต้นฉบับที่มีชื่อบุคคลและผู้ขายไว้บนเซิร์ฟเวอร์ ให้เลือกไฟล์ PDF จากเครื่องเพียงครั้งเดียว เพื่อดูในเว็บนี้ได้โดยตรง</p>';
html+='<label>นำเข้าไฟล์ “69 3.มี.ค .pdf” จากคอมพิวเตอร์</label><input id="filePdfInput" type="file" accept=".pdf,application/pdf" onchange="fileChoose(this)">';
html+='<div class="muted" id="filePdfStatus">'+(fileBlobUrl?'PDF ต้นฉบับพร้อมดู (เก็บเฉพาะในเบราว์เซอร์นี้)':'ยังไม่ได้เลือก PDF ต้นฉบับ')+'</div>';
html+='<div class="fileActions"><button class="primary" onclick="fileJump(1)">เปิด PDF ทั้งชุด</button><button class="muted-btn" onclick="fileDownload()">ดาวน์โหลด PDF ฉบับที่เปิด</button></div>';
html+='<h3>เลือกดูทีละเอกสาร / ทีละหน้า</h3><div class="filePages">'+fileDocs.map(([n,name])=>'<button class="fileDocButton" data-page="'+n+'" onclick="fileJump('+n+')"><span>หน้า '+n+'</span><b>'+esc(name)+'</b></button>').join("")+'</div>';
html+='<iframe id="filePdfViewer" title="PDF เอกสารจริงจากเครื่องของคุณ" class="fileViewer"></iframe></div>';
}else{html+='<div class="fileWarn">โครงการนี้ยังไม่มี PDF ต้นฉบับที่เชื่อมไว้ในระบบทดลอง</div>'}
main.innerHTML=html;main.scrollIntoView({behavior:"smooth",block:"start"});
if(fileBlobUrl&&id===FILE_PROJECT)document.getElementById("filePdfViewer").src=fileBlobUrl+"#page=1&view=FitH";
}
fileSeed();
fileLoadSaved();
