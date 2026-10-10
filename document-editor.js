import {renderGovernmentPage} from "./official-forms.js";
import {showWordDocument} from "./official-word-preview.js";
import {firebaseConfig} from "./firebase-config.js";



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
const pages=["มอบหมายผู้กำหนดคุณลักษณะ","อนุมัติและขอความเห็นชอบ TOR","รายงานขอความเห็นชอบ TOR / เริ่ม TOR","TOR หลักการและเงื่อนไข","TOR ตารางพัสดุและกำหนดส่ง","TOR ต่อ / เริ่มรายงานขอซื้อ","รายงานขอซื้อ","อนุมัติรายงานขอซื้อ / ตารางแนบท้าย","ตารางแนบท้าย / รายงานผลพิจารณา","ขออนุมัติสั่งซื้อ","ประกาศผู้ชนะการเสนอราคา","ใบตรวจรับพัสดุ","ใบตรวจรับต่อ / เริ่มรายงานเบิกจ่าย","รายงานเบิกจ่ายและตารางการเงิน","อนุมัติเบิกจ่าย / ใบเบิกพัสดุ","ใบเบิกพัสดุและผู้ลงนาม"];
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
let templateStorage=null,templateBlob=null,renderedDocx=null,renderSerial=0,renderDelay=null;
function templatePath(){return "procurement/templates/departments/"+activeDepartment+"/source.docx"}
function referenceMessage(msg){$("sourceMessage").textContent=msg}
function scrollWordPage(){
 const el=renderedDocx?.pages?.[page-1];if(el)el.scrollIntoView({behavior:"smooth",block:"nearest"});
}
async function renderTemplateWord(){
 if(!templateBlob||!activeDepartment)return;
 const serial=++renderSerial;
 referenceMessage("กำลังแสดงหน้าเอกสารจาก Word แม่แบบจริง…");
 try{
  const view=await showWordDocument(templateBlob,$("actualWord"),state.values);
  if(serial!==renderSerial)return;
  renderedDocx=view;
  $("paperLabel").textContent="Word แม่แบบจริง · หน้า "+page+" / "+view.pages.length;
  referenceMessage("แม่แบบ Word จริง • "+view.pages.length+" หน้า • ทดลองเติมข้อมูลลงในตำแหน่งที่ระบบตรวจพบ "+view.replacements+" จุด (ตรวจข้อความก่อนพิมพ์)");
 }catch(e){referenceMessage("ไม่สามารถเปิดแม่แบบ Word: "+(e.message||e))}
}
function queueTemplateRefresh(){
 if(!templateBlob)return;
 clearTimeout(renderDelay);renderDelay=setTimeout(renderTemplateWord,650);
}
// Avoid indefinite loading when Firebase Storage getBlob() is blocked by CORS/network.
async function loadWordBlob(path){
 const fileRef=firebaseFns.ref(templateStorage,path);
 if(firebaseFns.setMaxDownloadRetryTime)firebaseFns.setMaxDownloadRetryTime(templateStorage,10000);
 const bounded=(promise,ms)=>new Promise((resolve,reject)=>{
  let done=false;
  const timer=setTimeout(()=>{if(!done){done=true;reject(Object.assign(new Error("ไม่มีการตอบกลับจาก Firebase Storage ภายในเวลาที่กำหนด"),{code:"storage/download-timeout"}))}},ms);
  Promise.resolve(promise).then(result=>{if(!done){done=true;clearTimeout(timer);resolve(result)}},error=>{if(!done){done=true;clearTimeout(timer);reject(error)}});
 });
 try{return await bounded(firebaseFns.getBlob(fileRef),12000)}
 catch(firstError){
  if(firstError.code==="storage/object-not-found"||firstError.code==="storage/unauthorized"||firstError.code==="storage/unauthenticated")throw firstError;
  referenceMessage("ดาวน์โหลดแบบแรกไม่สำเร็จ กำลังลองวิธีสำรอง…");
  // This URL stays inside the signed-in page and is never saved to Firestore.
  try{
   const url=await bounded(firebaseFns.getDownloadURL(fileRef),7000);
   const controller=new AbortController();
   const timeout=setTimeout(()=>controller.abort(),10000);
   try{
    const response=await fetch(url,{signal:controller.signal,cache:"no-store"});
    if(!response.ok)throw Error("HTTP "+response.status);
    const blob=await response.blob();
    if(!blob.size)throw Error("ได้รับไฟล์ว่างจาก Storage");
    return blob;
   }finally{clearTimeout(timeout)}
  }catch(fallbackError){
   const msg=fallbackError.name==="AbortError"?"การเชื่อมต่อหมดเวลา":fallbackError.message||String(fallbackError);
   throw Object.assign(new Error("โหลดแม่แบบไม่สำเร็จ ("+(firstError.code||firstError.message)+"). วิธีสำรอง: "+msg+". ตรวจ Storage Rules และ CORS ของ Bucket"),{code:fallbackError.code||firstError.code||"storage/network-error"});
  }
 }
}
async function ensureTemplate(){
 templateBlob=null;renderedDocx=null;$("actualWord").innerHTML="";
 const requestedDept=activeDepartment;
 if(!requestedDept||!templateStorage)return;
 referenceMessage("กำลังดาวน์โหลดแม่แบบ Word ของ"+departmentName(requestedDept)+"…");
 try{
  const blob=await loadWordBlob("procurement/templates/departments/"+requestedDept+"/source.docx");
  if(activeDepartment!==requestedDept)return;
  templateBlob=blob;
  $("templateInstallStatus").textContent="ดาวน์โหลดแม่แบบ Word จาก Storage สำเร็จ";
  referenceMessage("ดาวน์โหลดสำเร็จ ("+(blob.size/1024).toFixed(1)+" KB) กำลังจัดหน้า Word…");
  await renderTemplateWord();
 }catch(e){
  if(activeDepartment!==requestedDept)return;
  if(e.code==="storage/object-not-found"&&requestedDept!=="general"){
   try{
    const blob=await loadWordBlob("procurement/templates/departments/general/source.docx");
    if(activeDepartment!==requestedDept)return;
    templateBlob=blob;
    $("templateInstallStatus").textContent="ใช้แม่แบบส่วนกลาง";
    referenceMessage("ใช้แม่แบบกลางจากฝ่ายบริหารทั่วไป กำลังแสดง Word…");
    await renderTemplateWord();
    return;
   }catch(secondError){e=secondError}
  }
  const missing=e.code==="storage/object-not-found";
  const message=missing?"ไม่พบไฟล์แม่แบบใน Storage":e.code==="storage/unauthorized"?"Storage Rules ปฏิเสธการอ่าน Word":(e.message||e.code||"ข้อผิดพลาดที่ไม่ทราบสาเหตุ");
  referenceMessage("โหลดแม่แบบ Word ไม่สำเร็จ: "+message);
  $("templateInstallStatus").textContent="โหลดแม่แบบไม่สำเร็จ: "+message;
 }
}

let activeTemplateUpload=null;
$("cancelTemplateUpload").onclick=()=>{
 if(activeTemplateUpload){activeTemplateUpload.cancel();$("templateInstallStatus").textContent="ยกเลิกอัปโหลดแล้ว ตรวจว่าไฟล์ไม่มีสถานะเสร็จใน Firebase Storage ก่อนลองใหม่"}
};
$("installTemplate").onclick=async()=>{
 if(profile?.role!=="admin"||!activeDepartment)return;
 const file=$("templateInput").files?.[0];
 if(!file||!file.name.toLowerCase().endsWith(".docx"))return alert("กรุณาเลือกไฟล์ Word .docx");
 if(file.size>20*1024*1024)return alert("ไฟล์ Word ต้องไม่เกิน 20 MB");
 if(templateBlob&&!confirm("มีแม่แบบอยู่แล้ว การติดตั้งใหม่จะแทนไฟล์ปัจจุบันของฝ่ายนี้ ต้องการดำเนินการหรือไม่?"))return;
 const button=$("installTemplate"),cancel=$("cancelTemplateUpload"),progress=$("templateUploadProgress"),output=$("templateInstallStatus");
 button.disabled=true;cancel.hidden=false;progress.hidden=false;progress.value=0;
 if(firebaseFns.setMaxUploadRetryTime)firebaseFns.setMaxUploadRetryTime(templateStorage,15000);
 const uploadRef=firebaseFns.ref(templateStorage,templatePath());
 const task=firebaseFns.uploadBytesResumable(uploadRef,file,{contentType:"application/vnd.openxmlformats-officedocument.wordprocessingml.document"});
 activeTemplateUpload=task;
 let lastChange=Date.now(),timeoutId=null;
 output.textContent="กำลังส่งไฟล์ "+file.name+" ("+(file.size/1024).toFixed(0)+" KB) ไปยัง "+templateStorage.app.options.storageBucket+"…";
 try{
  await new Promise((resolve,reject)=>{
   let completed=false;
   const finish=(err)=>{if(completed)return;completed=true;clearInterval(timeoutId);err?reject(err):resolve()};
   timeoutId=setInterval(()=>{
     if(Date.now()-lastChange>25000){
       task.cancel();
       finish(new Error("ส่งไฟล์ไม่คืบหน้าเกิน 25 วินาที: อาจเกิดจาก Storage Rules, bucket, billing หรือเครือข่าย"));
     }
   },1000);
   task.on("state_changed",snapshot=>{
     lastChange=Date.now();
     const percent=snapshot.totalBytes?Math.round(snapshot.bytesTransferred/snapshot.totalBytes*100):0;
     progress.value=percent;
     output.textContent="กำลังอัปโหลด "+percent+"% ("+(snapshot.bytesTransferred/1024).toFixed(0)+" / "+(snapshot.totalBytes/1024).toFixed(0)+" KB)";
   },e=>finish(e),()=>finish());
  });
  output.textContent="บันทึกแม่แบบลง Firebase Storage สำเร็จแล้ว กำลังเปิด Preview…";
  await ensureTemplate();
  if(templateBlob)output.textContent="บันทึกแม่แบบและเปิด Preview สำเร็จ";
  else output.textContent="บันทึกไฟล์สำเร็จ แต่เปิด Preview ยังไม่ได้ โปรดอ่านข้อความแจ้งในส่วนตัวอย่างเอกสาร";
 }catch(e){
  const code=e.code||"upload/timeout";
  const message=code==="storage/unauthorized"?"Storage Rules ยังไม่อนุญาตให้ Admin อัปโหลดไฟล์ Word":
    code==="storage/bucket-not-found"?"ไม่พบ Storage Bucket กรุณาตรวจการตั้งค่า bucket":
    code==="storage/retry-limit-exceeded"?"การเชื่อมต่อ Storage ไม่สำเร็จหลังลองส่งซ้ำ กรุณาตรวจ Bucket, Billing, Rules และเครือข่าย":
    code==="storage/canceled"?"ยกเลิกการอัปโหลดแล้ว":(e.message||String(e));
  output.textContent="อัปโหลดไม่สำเร็จ: "+message+" ["+code+"]";
 }finally{
  clearInterval(timeoutId);activeTemplateUpload=null;cancel.hidden=true;button.disabled=false;progress.hidden=true;
 }
};
const blank=()=>({values:{...Object.fromEntries([...commonFields,...specificFields.filter(f=>!sections.has(f[0]))].map(f=>[f[0],f[2]||""])),department:activeDepartment||""},items:[{description:"",quantity:"",unit:"",unitPrice:""}],selected:Array.from({length:16},(_,i)=>i+1)});
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
function renderPaper(){$("paperLabel").textContent="Word แม่แบบจริง · หน้า "+page+" / 16";$("paperHolder").innerHTML=officialPage(Math.min(page,10));document.querySelectorAll("[data-page-button]").forEach(b=>b.classList.toggle("selected",Number(b.dataset.pageButton)===page))}
function goStage(target){step=target;document.querySelectorAll(".stage").forEach(el=>el.hidden=el.id!==target);document.querySelectorAll("[data-stage]").forEach(el=>el.classList.toggle("selected",el.dataset.stage===target));if(target==="review")renderReview()}
function goPage(n){page=Math.min(16,Math.max(1,n));$("paperLabel").textContent="Word แม่แบบจริง · หน้า "+page+" / 16";scrollWordPage()}
function renderReview(){$("reviewPages").innerHTML=pages.map((title,i)=>'<label class="reviewRow"><input type="checkbox" data-print-page="'+(i+1)+'" '+(state.selected.includes(i+1)?"checked":"")+'><span>หน้า '+(i+1)+' — '+esc(title)+'</span><button type="button" class="secondary" data-jump="'+(i+1)+'">ดูหน้า</button></label>').join("");document.querySelectorAll("[data-print-page]").forEach(el=>el.onchange=()=>{const n=Number(el.dataset.printPage);state.selected=el.checked?[...new Set([...state.selected,n])]:state.selected.filter(x=>x!==n)});document.querySelectorAll("[data-jump]").forEach(el=>el.onclick=e=>{e.preventDefault();goPage(Number(el.dataset.jump))});const mandatory=[["project","ชื่อโครงการ"],["subject","ชื่องานจัดซื้อ"],["budget","วงเงิน"],["requestDate","วันที่เริ่มเรื่อง"],["procOfficer","เจ้าหน้าที่"],["headOfficer","หัวหน้าเจ้าหน้าที่"],["director","ผู้อำนวยการ"],["specPreparer","ผู้จัดทำ TOR"],["vendor","ชื่อผู้ขาย"],["inspector","ผู้ตรวจรับ"]].filter(([k])=>!v(k));$("missing").textContent=mandatory.length?"ข้อมูลที่ควรตรวจให้ครบก่อนพิมพ์: "+mandatory.map(x=>x[1]).join(" • "):"ข้อมูลหลักครบตามรายการตรวจเบื้องต้นแล้ว (ต้องอ่านตรวจถ้อยคำทุกหน้าก่อนนำไปใช้จริง)";}
function safeSnapshot(d){
 const vals=d&&typeof d.values==="object"&&!Array.isArray(d.values)?d.values:{};
 return {values:Object.fromEntries(Object.entries(vals).slice(0,75).map(([k,v])=>[k,String(v??"").slice(0,2000)])),
 items:Array.isArray(d.items)?d.items.slice(0,80).map(i=>({description:String(i.description||"").slice(0,500),quantity:String(i.quantity||""),unit:String(i.unit||""),unitPrice:String(i.unitPrice||"")})):[],
 selected:Array.isArray(d.selected)?d.selected.filter(n=>Number.isInteger(n)&&n>=1&&n<=16):Array.from({length:16},(_,i)=>i+1)};
}
function departmentName(key){return departments.find(d=>d[0]===key)?.[1]||key}
function usableDepartments(){return profile?.role==="admin"?departments:departments.filter(d=>d[0]===profile?.departmentId)}
function renderDepartmentSelection(){
 const allowed=usableDepartments();
 $("departmentCards").innerHTML=allowed.map(([key,name])=>'<button type="button" class="departmentCard '+(activeDepartment===key?"active":"")+'" data-dept="'+esc(key)+'"><span class="departmentMark">▣</span><strong>'+esc(name)+'</strong><small>'+ (key==="general"?"ใช้แม่แบบ Word ชุดแรก 16 หน้า":"ใช้แม่แบบกลาง 16 หน้า จนกว่าจะติดตั้งฉบับเฉพาะฝ่าย")+'</small></button>').join("");
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
 $("banner").textContent="กำลังสร้างสำเนาเอกสาร 10 หน้าใน Firestore…";
 try{
 state.values.department=activeDepartment;const safe=safeSnapshot(state),copyName=safe.values.subject?.trim()||"เอกสารจัดซื้อจัดจ้างไม่มีชื่อ";
 const entry={schemaVersion:1,templateId:"first-set-word16-v1",title:copyName,departmentId:safe.values.department||profile.departmentId,createdBy:user.uid,createdAt:firebaseFns.serverTimestamp(),values:safe.values,items:safe.items,selectedPages:safe.selected,documentCount:16};
 const result=await firebaseFns.addDoc(firebaseFns.collection(db,"procurement_document_copies"),entry);
 $("banner").textContent="บันทึกสำเนาลง Firestore สำเร็จ · เลขอ้างอิง "+result.id+" · สามารถพิมพ์หรือบันทึก PDF ต่อได้";
 await refreshSavedCopies();
 }catch(e){$("banner").textContent="บันทึกลงฐานข้อมูลไม่สำเร็จ: "+(e.code||e.message)+" · ยังไม่ได้สร้างสำเนา อย่าเพิ่งถือว่าบันทึกแล้ว"}
 finally{btn.disabled=false}
}
$("saveBtn").onclick=saveDraft;$("previewBtn").onclick=()=>goStage("review");
$("addItem").onclick=()=>{state.items.push({description:"",quantity:"",unit:"",unitPrice:""});renderItems();renderPaper()};
$("selectAll").onclick=()=>{state.selected=Array.from({length:16},(_,i)=>i+1);renderReview()};
$("selectNone").onclick=()=>{state.selected=[];renderReview()};
$("quickPrint").onclick=()=>{$("printSelected").click()};
$("printSelected").onclick=()=>{
 if(!state.selected.length){alert("กรุณาเลือกอย่างน้อย 1 หน้า");return}
 if(!renderedDocx?.pages?.length){alert("ยังไม่ได้แสดงแม่แบบ Word จริง กรุณาติดตั้งแม่แบบให้เรียบร้อยก่อน");return}
 const chosen=state.selected.slice().sort((a,b)=>a-b).filter(n=>n<=renderedDocx.pages.length);
 if(!chosen.length)return alert("หน้าที่เลือกไม่อยู่ในแม่แบบ");
 const printArea=$("printArea");printArea.innerHTML="";
 const styleNodes=[...$("actualWord").querySelectorAll("style")].map(e=>e.cloneNode(true));
 for(const st of styleNodes)printArea.appendChild(st);
 const wrapper=document.createElement("div");wrapper.className="docx-wrapper printableWord";
 for(const n of chosen){const el=renderedDocx.pages[n-1].cloneNode(true);wrapper.appendChild(el)}
 printArea.appendChild(wrapper);
 window.print();
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
