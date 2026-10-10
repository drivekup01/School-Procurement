import {renderGovernmentPage} from "./official-forms.js";

import {firebaseConfig} from "./firebase-config.js";
import {fillProcurementPdf} from "./pdf-form-overlay.js?v=1";



let firebaseFns=null;
async function loadFirebaseSdk(){
 const [app, auth, firestore, storage]=await Promise.all([
 import("https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js"),
 import("https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js"),
 import("https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js"),
 import("https://www.gstatic.com/firebasejs/11.10.0/firebase-storage.js")
 ]);
 firebaseFns={...app,...auth,...firestore,...storage};return firebaseFns;
}
const $=s=>document.getElementById(s),esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const pages=["บันทึกมอบหมายผู้กำหนดคุณลักษณะ","บันทึกขอความเห็นชอบ TOR","TOR หลักการและคุณสมบัติผู้เสนอราคา","TOR ตารางรายการพัสดุและเงื่อนไข","รายงานขอซื้อ","ตารางรายละเอียดพัสดุแนบท้าย","รายงานผลพิจารณาและขออนุมัติสั่งซื้อ","ประกาศผู้ชนะการเสนอราคา","ใบตรวจรับพัสดุ","รายงานตรวจรับและอนุมัติเบิกจ่าย","ใบเบิกพัสดุ"];
const departments=[["general","ฝ่ายบริหารทั่วไป"],["academic","ฝ่ายบริหารวิชาการ"],["personnel","ฝ่ายบริหารงานบุคคล"],["site","ฝ่ายสถานที่"],["budget","ฝ่ายบริหารงบประมาณ"]];
const commonFields=[
["school","ชื่อสถานศึกษา","โรงเรียนค่ายบางระจันวิทยาคม"],
["agency","หน่วยงานต้นสังกัด","สำนักงานเขตพื้นที่การศึกษามัธยมศึกษาสิงห์บุรี อ่างทอง"],

["fiscalYear","ปีงบประมาณ","2569","number"],
["project","ชื่อโครงการหลัก","","text"],
["activity","ชื่อกิจกรรม","","text"],
["subject","ชื่องานจัดซื้อ / จัดจ้าง","","text"],
["purchaseType","ประเภทงาน","purchase","select",[["purchase","จัดซื้อ"],["hire","จัดจ้าง"]]],
["purpose","เหตุผลและความจำเป็น","","textarea"],
["budgetSource","แหล่งงบประมาณ","plan","select",[["plan","ตามแผนปฏิบัติราชการ"],["allocated","ตามเงินจัดสรร สพฐ."],["other","อื่น ๆ"]]],
["budget","วงเงินงบประมาณครั้งนี้ (บาท)","","number"],
["referencePrice","ราคากลาง (บาท)","","number"],
["requestDate","วันที่เริ่มเรื่อง (เช่น 2 มีนาคม 2569)","","text"],
["memoNo","เลขที่บันทึกข้อความ","","text"],
["deliveryPlace","สถานที่ส่งมอบ","โรงเรียนค่ายบางระจันวิทยาคม"]
];
const specificFields=[
["people","ผู้รับผิดชอบและผู้ลงนาม"],
["specPreparer","ผู้กำหนดคุณลักษณะ / จัดทำ TOR",""],
["specPosition","ตำแหน่งผู้จัดทำ TOR","ครู"],
["procOfficer","เจ้าหน้าที่พัสดุ",""],
["headOfficer","หัวหน้าเจ้าหน้าที่",""],
["director","ผู้อำนวยการโรงเรียน",""],
["inspector","ผู้ตรวจรับพัสดุ",""],
["requester","ผู้เบิกพัสดุ",""],
["requesterPosition","ตำแหน่งผู้เบิก","ครู"],
["supplier","ผู้ขาย / ผู้รับจ้าง"],
["vendor","ชื่อผู้ขายหรือผู้รับจ้าง",""],
["agreedPrice","ราคาที่ตกลงซื้อ (บาท)","","number"],
["procurementMethod","วิธีจัดซื้อจัดจ้าง","เฉพาะเจาะจง","select",[["เฉพาะเจาะจง","เฉพาะเจาะจง"],["คัดเลือก","คัดเลือก"],["ประกาศเชิญชวนทั่วไป","ประกาศเชิญชวนทั่วไป"]]],
["dates","กำหนดส่งมอบและเอกสารอ้างอิง"],
["deliveryDays","กำหนดส่งมอบภายใน (วัน)","","number"],
["deliveryDate","วันที่ครบกำหนดส่งมอบ","","text"],
["receiptDate","วันที่ตรวจรับ","","text"],
["invoiceNo","เลขที่ใบส่งของ/ใบแจ้งหนี้","","text"],
["invoiceDate","วันที่ใบส่งของ/ใบแจ้งหนี้","","text"],
["requisitionDate","วันที่เบิกพัสดุ","","text"],
["payment","การเงินและเงื่อนไข"],
["beforeVat","จำนวนเงินก่อน VAT (บาท)","","number"],
["vat","VAT (บาท)","","number"],
["withholding","หักภาษี ณ ที่จ่าย (บาท)","","number"],
["fine","ค่าปรับ (บาท)","","number"],
["warranty","ระยะเวลารับประกัน (ถ้ามี)","","text"],
["otherNote","ข้อเสนอหรือรายละเอียดเพิ่มเติม","","textarea"]
];
const sections=new Set(["people","supplier","dates","payment"]);
let user=null,profile=null,db=null,step="common",page=1;
let savedCopies=[];
let activeDepartment=null;
let templateStorage=null,templateBlob=null,previewBlob=null,pdfObjectUrl=null,activeTemplateUpload=null,pdfRenderToken=0,pdfRenderTimer=null;
const templatePath=(dept=activeDepartment)=>"procurement/templates/departments/"+dept+"/source.pdf";
const referenceMessage=msg=>{$("sourceMessage").textContent=msg};
const fileFrame=()=>$("actualPdfFrame");
async function refreshPdfPreview(){
 if(!templateBlob)return;
 const token=++pdfRenderToken;
 referenceMessage("กำลังเติมข้อมูลจากฟอร์มลง PDF ต้นฉบับ…");
 try{
  const filled=await fillProcurementPdf(templateBlob,state.values);
  if(token!==pdfRenderToken)return;
  previewBlob=filled.blob;
  if(pdfObjectUrl)URL.revokeObjectURL(pdfObjectUrl);
  pdfObjectUrl=URL.createObjectURL(previewBlob);
  fileFrame().style.display="block";
  setPdfPage();
  referenceMessage("Preview จาก PDF จริง "+filled.pageCount+" หน้า • เติมข้อมูล "+filled.count+" จุด • พิกัดรุ่นแรก ต้องตรวจตำแหน่งก่อนใช้ลงนาม");
 }catch(error){
  if(token!==pdfRenderToken)return;
  previewBlob=templateBlob;
  if(pdfObjectUrl)URL.revokeObjectURL(pdfObjectUrl);
  pdfObjectUrl=URL.createObjectURL(previewBlob);
  fileFrame().style.display="block";setPdfPage();
  referenceMessage("แสดง PDF ต้นฉบับได้ แต่เติมข้อมูลยังไม่สำเร็จ: "+(error.message||error));
 }
}
function queueTemplateRefresh(){
 if(!templateBlob)return;
 clearTimeout(pdfRenderTimer);
 pdfRenderTimer=setTimeout(refreshPdfPreview,550);
}

const setPdfPage=()=>{
 $("paperLabel").textContent="PDF ต้นฉบับจริง · หน้า "+page+" / "+pages.length;
 if(pdfObjectUrl){const next=pdfObjectUrl+"#page="+page+"&zoom=page-width";if(fileFrame().src!==next)fileFrame().src=next;}
};
async function loadPdfBlob(dept){
 const storageRef=firebaseFns.ref(templateStorage,templatePath(dept));
 if(firebaseFns.setMaxDownloadRetryTime)firebaseFns.setMaxDownloadRetryTime(templateStorage,12000);
 const timeout=(promise,ms)=>Promise.race([promise,new Promise((_,reject)=>setTimeout(()=>reject(Object.assign(new Error("Storage ไม่ตอบกลับ"),{code:"storage/download-timeout"})),ms))]);
 try{return await timeout(firebaseFns.getBlob(storageRef),15000)}
 catch(error){
   if(["storage/object-not-found","storage/unauthorized","storage/unauthenticated"].includes(error.code))throw error;
   referenceMessage("กำลังลองดาวน์โหลด PDF ผ่านลิงก์สำรอง…");
   const url=await timeout(firebaseFns.getDownloadURL(storageRef),9000);
   const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),12000);
   try{const response=await fetch(url,{signal:controller.signal});if(!response.ok)throw Error("HTTP "+response.status);return await response.blob()}
   finally{clearTimeout(timer)}
 }
}
async function ensureTemplate(){
 const requested=activeDepartment;
 templateBlob=null;previewBlob=null;
 if(pdfObjectUrl){URL.revokeObjectURL(pdfObjectUrl);pdfObjectUrl=null}
 fileFrame().src="about:blank";fileFrame().style.display="none";
 if(!requested||!templateStorage)return;
 referenceMessage("กำลังอ่าน PDF ต้นฉบับของ"+departmentName(requested)+" จาก Firebase Storage…");
 let loadedDept=requested;
 try{
  try{templateBlob=await loadPdfBlob(requested)}
  catch(e){
   if(e.code==="storage/object-not-found"&&requested!=="general"){templateBlob=await loadPdfBlob("general");loadedDept="general"}
   else throw e;
  }
  if(activeDepartment!==requested)return;
  if(templateBlob.type!=="application/pdf"&&templateBlob.type!=="application/octet-stream")throw Error("ไฟล์ใน Storage ไม่ใช่ PDF");
  $("templateInstallStatus").textContent="PDF ต้นฉบับพร้อมแล้ว · "+(templateBlob.size/1024).toFixed(1)+" KB";
  await refreshPdfPreview();
  $("templateInstallStatus").textContent="พบแม่แบบ PDF ใน Storage แล้ว ไม่ต้องอัปโหลดซ้ำ";
 }catch(e){
  if(activeDepartment!==requested)return;
  const msg=e.code==="storage/object-not-found"?"ยังไม่มีแม่แบบ PDF ของฝ่ายนี้ใน Storage กรุณาติดตั้งจากไฟล์ที่แนบเพียงครั้งเดียว":e.code==="storage/unauthorized"?"Storage Rules ปฏิเสธการอ่าน PDF":(e.code||e.message);
  referenceMessage("ยังเปิดต้นฉบับไม่ได้: "+msg);
  $("templateInstallStatus").textContent=msg;
 }
}
$("cancelTemplateUpload").onclick=()=>{activeTemplateUpload?.cancel()};
$("installTemplate").onclick=async()=>{
 if(profile?.role!=="admin"||!activeDepartment)return;
 const file=$("templateInput").files?.[0];
 if(!file||!file.name.toLowerCase().endsWith(".pdf"))return alert("กรุณาเลือกไฟล์ PDF ต้นฉบับ");
 if(file.size>25*1024*1024)return alert("PDF ต้องไม่เกิน 25 MB");
 if(templateBlob&&!confirm("ติดตั้ง PDF ใหม่แทนแม่แบบเดิมของฝ่ายนี้หรือไม่?"))return;
 const button=$("installTemplate"),cancel=$("cancelTemplateUpload"),progress=$("templateUploadProgress"),status=$("templateInstallStatus");
 button.disabled=true;cancel.hidden=false;progress.hidden=false;progress.value=0;
 if(firebaseFns.setMaxUploadRetryTime)firebaseFns.setMaxUploadRetryTime(templateStorage,15000);
 const task=firebaseFns.uploadBytesResumable(firebaseFns.ref(templateStorage,templatePath()),file,{contentType:"application/pdf"});
 activeTemplateUpload=task;
 let timer=null,settled=false,last=Date.now();
 try{
  await new Promise((resolve,reject)=>{
   const complete=e=>{if(settled)return;settled=true;clearInterval(timer);e?reject(e):resolve()};
   timer=setInterval(()=>{if(Date.now()-last>25000){task.cancel();complete(new Error("อัปโหลดไม่มีความคืบหน้าเกิน 25 วินาที"))}},1000);
   task.on("state_changed",snap=>{last=Date.now();let percent=Math.round(100*snap.bytesTransferred/Math.max(1,snap.totalBytes));progress.value=percent;status.textContent="กำลังอัปโหลด PDF "+percent+"%"},complete,()=>complete());
  });
  status.textContent="บันทึก PDF ลง Storage สำเร็จ กำลังเปิดต้นฉบับ…";
  await ensureTemplate();
 }catch(e){status.textContent="อัปโหลด PDF ไม่สำเร็จ: "+(e.code||e.message)}
 finally{clearInterval(timer);activeTemplateUpload=null;button.disabled=false;cancel.hidden=true;progress.hidden=true}
};
const blank=()=>({values:{...Object.fromEntries([...commonFields,...specificFields.filter(f=>!sections.has(f[0]))].map(f=>[f[0],f[2]||""])),department:activeDepartment||""},items:[{description:"",quantity:"",unit:"",unitPrice:""}],selected:Array.from({length:11},(_,i)=>i+1)});
let state=blank();
const fmt=n=>Number(n||0).toLocaleString("th-TH",{minimumFractionDigits:2,maximumFractionDigits:2});
const v=k=>state.values[k]||"";
const mark=k=>'<span class="placeholder">'+(v(k)?esc(v(k)):'........................................................')+'</span>';
const officialType=()=>v("purchaseType")==="hire"?"จ้าง":"ซื้อ";
const fullTitle=()=>'จัด'+officialType()+' '+(v("subject")||"..................................");
const school=()=>esc(v("school")||"................................................");
const memoHead=(name,dateKey="requestDate")=>'<h2>บันทึกข้อความ</h2><div class="labelled"><b>ส่วนราชการ</b> '+school()+' '+esc(v("agency"))+'</div><div class="labelled"><b>ที่</b> '+mark("memoNo")+'　 <b>วันที่</b> '+mark(dateKey)+'</div><div class="labelled"><b>เรื่อง</b> '+esc(name)+'</div><div class="labelled"><b>เรียน</b> ผู้อำนวยการ'+school()+'</div>';
const sign=(a,b)=>'<div class="signature"><div>ลงชื่อ.......................................'+esc(a)+'\n('+mark(a==="เจ้าหน้าที่"?"procOfficer":"specPreparer")+')</div><div>ลงชื่อ.......................................'+esc(b)+'\n('+mark("headOfficer")+')</div></div>';
const signPair=()=>'<div class="signature"><div>ลงชื่อ....................................... เจ้าหน้าที่<br>('+mark("procOfficer")+')</div><div>ลงชื่อ....................................... หัวหน้าเจ้าหน้าที่<br>('+mark("headOfficer")+')</div></div>';
const directorSign=()=>'<div class="signsingle">- อนุมัติ<br>ลงชื่อ........................................<br>('+mark("director")+')<br>ผู้อำนวยการ'+school()+'</div>';
const itemRows=()=>state.items.map((r,i)=>'<tr><td>'+(i+1)+'</td><td>'+esc(r.description||"................................")+'</td><td>'+esc(r.quantity||"—")+'</td><td>'+esc(r.unit||"—")+'</td><td style="text-align:right">'+fmt(r.unitPrice)+'</td><td style="text-align:right">'+fmt(Number(r.quantity||0)*Number(r.unitPrice||0))+'</td></tr>').join("");
const total=()=>state.items.reduce((sum,r)=>sum+Number(r.quantity||0)*Number(r.unitPrice||0),0);
const itemTable=()=>'<table><thead><tr><th>ที่</th><th>รายการพัสดุ</th><th>จำนวน</th><th>หน่วย</th><th>ราคาต่อหน่วย</th><th>รวมเงิน</th></tr></thead><tbody>'+itemRows()+'<tr><th colspan="5" style="text-align:right">รวมเป็นเงินทั้งสิ้น</th><th style="text-align:right">'+fmt(total())+'</th></tr></tbody></table>';
const dept=()=>departments.find(x=>x[0]===v("department"))?.[1]||v("department");
const n=(content)=>'<p>'+content+'</p>';
function officialPage(i){return renderGovernmentPage(i,{value:v,escape:esc,items:state.items,department:dept()})}
function fieldMarkup(f){let [key,label,def,type="text",opts]=f;return '<label class="'+(type==="textarea"?"wide":"")+'">'+esc(label)+(type==="select"?'<select data-key="'+key+'">'+opts.map(([value,title])=>'<option value="'+esc(value)+'" '+(v(key)===value?"selected":"")+'>'+esc(title)+'</option>').join("")+'</select>':type==="textarea"?'<textarea data-key="'+key+'">'+esc(v(key))+'</textarea>':'<input data-key="'+key+'" type="'+type+'" '+(type==="number"?'min="0" step="any"':'')+' value="'+esc(v(key))+'">')+'</label>'}
function renderInputs(){ $("commonFields").innerHTML=commonFields.map(fieldMarkup).join("");$("specificFields").innerHTML=specificFields.map(f=>sections.has(f[0])?'<div class="sectiontitle">'+esc(f[1])+'</div>':fieldMarkup(f)).join("");
document.querySelectorAll("[data-key]").forEach(el=>el.oninput=()=>{state.values[el.dataset.key]=el.value;renderPaper();renderTotals();queueTemplateRefresh();queueTemplateRefresh();});}
function renderItems(){ $("itemsRows").innerHTML=state.items.map((r,i)=>'<div class="itemRow"><strong>รายการที่ '+(i+1)+'</strong><div class="rowgrid">'+[["description","ชื่อรายการพัสดุ"],["quantity","จำนวน"],["unit","หน่วยนับ"],["unitPrice","ราคาต่อหน่วย"]].map(([k,name])=>'<label>'+name+'<input data-item="'+i+'" data-col="'+k+'" value="'+esc(r[k])+'" '+(["quantity","unitPrice"].includes(k)?'type="number" min="0" step="any"':'')+'></label>').join("")+'</div><button data-remove="'+i+'" class="secondary">ลบรายการ</button></div>').join("");document.querySelectorAll("[data-item]").forEach(el=>el.oninput=()=>{state.items[Number(el.dataset.item)][el.dataset.col]=el.value;renderPaper();renderTotals()});document.querySelectorAll("[data-remove]").forEach(el=>el.onclick=()=>{if(state.items.length===1)return;state.items.splice(Number(el.dataset.remove),1);renderItems();renderPaper();queueTemplateRefresh()});renderTotals()}
function renderTotals(){$("itemTotals").innerHTML='รวมมูลค่ารายการพัสดุที่กรอก: <b>'+fmt(total())+' บาท</b>　(โปรดตรวจเทียบวงเงินงาน '+fmt(v("budget"))+' บาท)'}
function renderPaper(){setPdfPage();document.querySelectorAll("[data-page-button]").forEach(b=>b.classList.toggle("selected",Number(b.dataset.pageButton)===page))}
function goStage(target){step=target;document.querySelectorAll(".stage").forEach(el=>el.hidden=el.id!==target);document.querySelectorAll("[data-stage]").forEach(el=>el.classList.toggle("selected",el.dataset.stage===target));if(target==="review")renderReview()}
function goPage(n){page=Math.min(11,Math.max(1,n));renderPaper()}
function renderReview(){$("reviewPages").innerHTML=pages.map((title,i)=>'<label class="reviewRow"><input type="checkbox" data-print-page="'+(i+1)+'" '+(state.selected.includes(i+1)?"checked":"")+'><span>หน้า '+(i+1)+' — '+esc(title)+'</span><button type="button" class="secondary" data-jump="'+(i+1)+'">ดูหน้า</button></label>').join("");document.querySelectorAll("[data-print-page]").forEach(el=>el.onchange=()=>{const n=Number(el.dataset.printPage);state.selected=el.checked?[...new Set([...state.selected,n])]:state.selected.filter(x=>x!==n)});document.querySelectorAll("[data-jump]").forEach(el=>el.onclick=e=>{e.preventDefault();goPage(Number(el.dataset.jump))});const mandatory=[["project","ชื่อโครงการ"],["subject","ชื่องานจัดซื้อ"],["budget","วงเงิน"],["requestDate","วันที่เริ่มเรื่อง"],["procOfficer","เจ้าหน้าที่"],["headOfficer","หัวหน้าเจ้าหน้าที่"],["director","ผู้อำนวยการ"],["specPreparer","ผู้จัดทำ TOR"],["vendor","ชื่อผู้ขาย"],["inspector","ผู้ตรวจรับ"]].filter(([k])=>!v(k));$("missing").textContent=mandatory.length?"ข้อมูลที่ควรตรวจให้ครบก่อนพิมพ์: "+mandatory.map(x=>x[1]).join(" • "):"ข้อมูลหลักครบตามรายการตรวจเบื้องต้นแล้ว (ต้องอ่านตรวจถ้อยคำทุกหน้าก่อนนำไปใช้จริง)";}
function safeSnapshot(d){
 const vals=d&&typeof d.values==="object"&&!Array.isArray(d.values)?d.values:{};
 return {values:Object.fromEntries(Object.entries(vals).slice(0,75).map(([k,v])=>[k,String(v??"").slice(0,2000)])),
 items:Array.isArray(d.items)?d.items.slice(0,80).map(i=>({description:String(i.description||"").slice(0,500),quantity:String(i.quantity||""),unit:String(i.unit||""),unitPrice:String(i.unitPrice||"")})):[],
 selected:Array.isArray(d.selected)?d.selected.filter(n=>Number.isInteger(n)&&n>=1&&n<=11):Array.from({length:11},(_,i)=>i+1)};
}
function departmentName(key){return departments.find(d=>d[0]===key)?.[1]||key}
function usableDepartments(){return profile?.role==="admin"?departments:departments.filter(d=>d[0]===profile?.departmentId)}
function renderDepartmentSelection(){
 const allowed=usableDepartments();
 $("departmentCards").innerHTML=allowed.map(([key,name])=>'<button type="button" class="departmentCard '+(activeDepartment===key?"active":"")+'" data-dept="'+esc(key)+'"><span class="departmentMark">▣</span><strong>'+esc(name)+'</strong><small>'+ (key==="general"?"ใช้ PDF ต้นฉบับ 11 หน้า":"ใช้ PDF ส่วนกลาง 11 หน้า จนกว่าจะมีฉบับเฉพาะฝ่าย")+'</small></button>').join("");
 $("departmentCards").querySelectorAll("[data-dept]").forEach(b=>b.onclick=()=>selectDepartment(b.dataset.dept));
}
async function selectDepartment(key){
 if(!usableDepartments().some(d=>d[0]===key))return;
 activeDepartment=key;
 $("departmentNext").hidden=false;
 $("activeDepartmentName").textContent=departmentName(key);
 renderDepartmentSelection();
 renderSavedCopiesList();
 $("templateSetup").hidden=profile?.role!=="admin";
 await ensureTemplate();
}
function startDepartmentDraft(){
 if(!activeDepartment)return;
 state=blank();state.values.department=activeDepartment;
 $("departmentGate").hidden=true;$("workArea").hidden=false;
 renderInputs();renderItems();renderPaper();goStage("common");queueTemplateRefresh();
 $("banner").textContent="กำลังจัดทำเอกสารของ"+departmentName(activeDepartment)+" · กรอกข้อมูลครั้งเดียวสำหรับทั้งชุด";
}
$("startNew").onclick=startDepartmentDraft;
$("changeDepartment").onclick=()=>{
 const containsData=!!state.values.subject||!!state.values.project||state.items.some(i=>i.description);
 if(containsData&&!confirm("มีข้อมูลที่กำลังกรอกอยู่ หากยังไม่บันทึกข้อมูลจะไม่ถูกเก็บ ต้องการกลับไปเลือกฝ่ายหรือไม่?"))return;
 $("workArea").hidden=true;$("departmentGate").hidden=false;activeDepartment=null;$("departmentNext").hidden=true;renderDepartmentSelection();
};
function renderSavedCopiesList(){
 const selected=savedCopies.filter(c=>c.departmentId===activeDepartment && (profile?.role==="admin"||c.createdBy===user.uid));
 $("savedCopiesList").innerHTML=selected.map(c=>'<div class="savedCopyRow"><div><strong>'+esc(c.title||"ไม่มีชื่อเอกสาร")+'</strong><small>'+esc(c.createdAt?.toDate?.().toLocaleString("th-TH")||"เพิ่งบันทึก")+'</small></div><button type="button" class="secondary" data-copy="'+esc(c.id)+'">เปิดทำงานต่อ</button></div>').join("")||'<p class="emptyCopies">ยังไม่มีสำเนาที่บันทึกไว้ในฝ่ายนี้</p>';
 $("savedCopiesList").querySelectorAll("[data-copy]").forEach(b=>b.onclick=()=>loadSelectedCopy(b.dataset.copy));
 $("gateStatus").textContent="สำเนาของ"+departmentName(activeDepartment)+" "+selected.length+" ชุด";
}
function loadSelectedCopy(id){
 const c=savedCopies.find(x=>x.id===id);
 if(!c||c.departmentId!==activeDepartment)return;
 state=safeSnapshot({values:c.values,items:c.items,selected:c.selectedPages});
 state.values.department=activeDepartment;
 $("departmentGate").hidden=true;$("workArea").hidden=false;
 renderInputs();renderItems();renderPaper();goStage("common");queueTemplateRefresh();
 $("banner").textContent="เปิดสำเนาจาก Firestore แล้ว · "+(c.title||id);
}
async function refreshSavedCopies(){
 if(!db||!user)return;
 try{
 const result=await firebaseFns.getDocs(firebaseFns.collection(db,"procurement_document_copies"));
 savedCopies=result.docs.map(d=>({id:d.id,...d.data()})).filter(d=>profile?.role==="admin"||d.createdBy===user.uid).sort((x,y)=>(y.createdAt?.seconds||0)-(x.createdAt?.seconds||0));
 if(activeDepartment)renderSavedCopiesList();
 }catch(e){$("banner").textContent="ยังอ่านสำเนาเก่าจากฐานข้อมูลไม่ได้: "+(e.code||e.message);}
}
async function saveDraft(){
 if(!user||!profile)return;
 const btn=$("saveBtn");btn.disabled=true;
 $("banner").textContent="กำลังสร้างสำเนาเอกสาร 11 หน้าใน Firestore…";
 try{
 state.values.department=activeDepartment;const safe=safeSnapshot(state),copyName=safe.values.subject?.trim()||"เอกสารจัดซื้อจัดจ้างไม่มีชื่อ";
 const entry={schemaVersion:1,templateId:"first-set-pdf11-v1",title:copyName,departmentId:safe.values.department||profile.departmentId,createdBy:user.uid,createdAt:firebaseFns.serverTimestamp(),values:safe.values,items:safe.items,selectedPages:safe.selected,documentCount:11};
 const result=await firebaseFns.addDoc(firebaseFns.collection(db,"procurement_document_copies"),entry);
 $("banner").textContent="บันทึกข้อมูลสำเนาลง Firestore สำเร็จ · เลขอ้างอิง "+result.id+" · สามารถพิมพ์หรือบันทึก PDF ต่อได้";
 await refreshSavedCopies();
 }catch(e){$("banner").textContent="บันทึกลงฐานข้อมูลไม่สำเร็จ: "+(e.code||e.message)+" · ยังไม่ได้สร้างสำเนา อย่าเพิ่งถือว่าบันทึกแล้ว"}
 finally{btn.disabled=false}
}
$("saveBtn").onclick=saveDraft;$("previewBtn").onclick=()=>goStage("review");
$("addItem").onclick=()=>{state.items.push({description:"",quantity:"",unit:"",unitPrice:""});renderItems();renderPaper()};
$("selectAll").onclick=()=>{state.selected=Array.from({length:11},(_,i)=>i+1);renderReview()};
$("selectNone").onclick=()=>{state.selected=[];renderReview()};
$("quickPrint").onclick=()=>{$("printSelected").click()};
$("printSelected").onclick=async()=>{
 if(!previewBlob)return alert("PDF ยังไม่พร้อม กรุณารอให้ Preview เติมข้อมูลเสร็จ");
 const selection=state.selected.slice().sort((a,b)=>a-b).filter(n=>n>=1&&n<=11);
 if(!selection.length)return alert("กรุณาเลือกหน้าที่ต้องการพิมพ์");
 try{
  if(!window.PDFLib?.PDFDocument)throw Error("โหลดตัวช่วยเลือกหน้า PDF ไม่สำเร็จ");
  const original=await PDFLib.PDFDocument.load(await previewBlob.arrayBuffer());
  const doc=await PDFLib.PDFDocument.create();
  const copied=await doc.copyPages(original,selection.filter(n=>n<=original.getPageCount()).map(n=>n-1));
  copied.forEach(p=>doc.addPage(p));
  const bytes=await doc.save();
  const link=document.createElement("a");const url=URL.createObjectURL(new Blob([bytes],{type:"application/pdf"}));
  link.href=url;link.download="สำเนาเอกสารราชการ_"+(state.values.subject||"ต้นฉบับ")+".pdf";
  document.body.appendChild(link);link.click();link.remove();
  $("banner").textContent="ส่งออก PDF จากหน้าต้นฉบับจริง "+copied.length+" หน้าแล้ว · เปิดไฟล์ที่ดาวน์โหลดเพื่อพิมพ์ได้ (ข้อมูลที่กรอกถูกเติมในจุดที่แมปแล้ว)";
  setTimeout(()=>URL.revokeObjectURL(url),60000);
 }catch(e){alert("ส่งออก PDF ไม่สำเร็จ: "+(e.message||e))}
};
$("prev").onclick=()=>goPage(page-1);$("next").onclick=()=>goPage(page+1);
document.querySelectorAll("[data-stage]").forEach(btn=>btn.onclick=()=>goStage(btn.dataset.stage));
$("pageNav").innerHTML=pages.map((title,i)=>'<button class="pageButton" data-page-button="'+(i+1)+'" type="button"><b>หน้า '+(i+1)+'</b>'+esc(title)+'</button>').join("");
document.querySelectorAll("[data-page-button]").forEach(btn=>btn.onclick=()=>goPage(Number(btn.dataset.pageButton)));
// Render a meaningful interface immediately; do not leave the user at a perpetual "checking account".
$("editorRoot").hidden=false;
$("departmentCards").innerHTML='<div class="loadingDepartments">กำลังตรวจสิทธิ์และโหลดรายการฝ่าย…</div>';
$("departmentNext").hidden=true;
$("workArea").hidden=true;
$("banner").textContent="กำลังเชื่อมบัญชีผู้ใช้…";
$("login-state").textContent="กำลังเชื่อมต่อ";
const configured=Boolean(firebaseConfig.apiKey&&firebaseConfig.projectId);
async function boot(){
 if(!configured){$("banner").textContent="ยังไม่มีการตั้งค่า Firebase สำหรับระบบนี้";$("login-state").textContent="ยังไม่พร้อม";return}
 try{
  const sdk=await loadFirebaseSdk();
  const app=sdk.initializeApp(firebaseConfig);
  const auth=sdk.getAuth(app);db=sdk.getFirestore(app);templateStorage=sdk.getStorage(app);
  sdk.onAuthStateChanged(auth,async u=>{
   user=u;
   if(!u){profile=null;$("editorRoot").hidden=true;$("banner").innerHTML='ยังไม่ได้เข้าสู่ระบบ กรุณา <a href="./index.html">กลับไปเข้าสู่ระบบ</a> ก่อนจัดทำเอกสาร';$("login-state").textContent="ยังไม่ได้เข้าสู่ระบบ";return}
   $("login-state").textContent="กำลังโหลดสิทธิ์…";
   try{
    const d=await sdk.getDoc(sdk.doc(db,"procurement_users",u.uid));
    if(!d.exists())throw Error("ไม่พบบัญชีใน procurement_users");
    profile=d.data();
    if(!["admin","staff"].includes(profile.role))throw Error("สิทธิ์ผู้ใช้งานไม่ถูกต้อง");
    $("editorRoot").hidden=false;
    renderDepartmentSelection();
    $("login-state").textContent=(profile.role==="admin"?"Admin • ":"")+(profile.displayName||u.email);
    $("banner").textContent=profile.role==="admin"?"ผู้ดูแลระบบ: เลือกฝ่ายได้ทั้งหมด และเปิดสำเนาแต่ละฝ่ายได้":"เลือกฝ่ายที่ได้รับสิทธิ์เพื่อเริ่มจัดทำเอกสาร";
    // Saved records are supplementary. A failure must not prevent a new document.
    await refreshSavedCopies();
   }catch(e){$("editorRoot").hidden=true;$("login-state").textContent="ตรวจสิทธิ์ไม่ผ่าน";$("banner").textContent="เข้าสู่ระบบแล้ว แต่ตรวจสิทธิ์ไม่สำเร็จ: "+(e.code||e.message)}
  },e=>{$("banner").textContent="ระบบ Login มีปัญหา: "+(e.code||e.message);$("login-state").textContent="เชื่อมต่อไม่ได้"});
 }catch(e){$("banner").textContent="โหลดระบบ Firebase ไม่สำเร็จ: "+(e.message||e)+" — กรุณาลองรีเฟรช หากยังไม่หายให้ตรวจเครือข่าย";$("login-state").textContent="เชื่อมต่อไม่สำเร็จ";}
}
boot();
