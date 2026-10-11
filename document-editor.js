import {renderGovernmentPage} from "./official-forms.js";

import {firebaseConfig} from "./firebase-config.js";
import {fillProcurementPdf,setProcurementPdfFontLoader} from "./pdf-form-overlay.js?v=psk16-fields13-v1";



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
// Fields in first-appearance order in the 11-page official PDF.
// Source order from uploaded 13-page procurement sample; preserve old keys for saved data.
const commonFields=[["school","ชื่อสถานศึกษา","โรงเรียนค่ายบางระจันวิทยาคม"],["agency","หน่วยงานต้นสังกัด","สำนักงานเขตพื้นที่การศึกษามัธยมศึกษาสิงห์บุรี อ่างทอง"],["memoNo","เลขที่บันทึกข้อความ",""],["requestDate","วันที่จัดทำบันทึก","","date"],["subject","ชื่องานจัดซื้อ / จัดจ้าง (ชื่อเต็ม)","","textarea"],["purchaseType","ประเภทงาน","purchase","select",[["purchase","จัดซื้อ"],["hire","จัดจ้าง"]]],["fiscalYear","ปีงบประมาณ","2569","number"],["project","ชื่อโครงการตามแผน (ข้อความยาวได้)","","textarea"],["activity","ชื่อกิจกรรมตามโครงการ (ข้อความยาวได้)","","textarea"],["budget","วงเงินงบประมาณครั้งนี้ (บาท)","","number"],["specPreparer","ผู้จัดทำรายละเอียดคุณลักษณะ / TOR",""],["specPosition","ตำแหน่งผู้จัดทำ TOR","ครู"],["procOfficer","ชื่อเจ้าหน้าที่พัสดุ",""],["headOfficer","ชื่อหัวหน้าเจ้าหน้าที่",""],["director","ชื่อผู้อำนวยการโรงเรียน",""],["specApprovalDate","วันที่เห็นชอบ TOR / อนุมัติรายละเอียด","","date"],["eventDate","วันที่ใช้พัสดุ / จัดกิจกรรม","","date"],["purpose","เหตุผลและความจำเป็น (พิมพ์ได้หลายบรรทัด)","","textarea"],["budgetSource","แหล่งงบประมาณ","plan","select",[["plan","ตามแผนปฏิบัติราชการ"],["allocated","ตามเงินจัดสรร สพฐ."],["other","อื่น ๆ"]]],["referencePrice","ราคากลาง (บาท)","","number"],["deliveryPlace","สถานที่ส่งมอบ / ดำเนินการ",""],["priceValidityDays","กำหนดยืนราคา (วัน)","","number"],["deliveryDays","กำหนดส่งมอบภายใน (วัน)","","number"],["warranty","ระยะเวลารับประกัน / เงื่อนไข (ถ้ามี)","","textarea"],["procurementMethod","วิธีจัดซื้อจัดจ้าง","เฉพาะเจาะจง","select",[["เฉพาะเจาะจง","เฉพาะเจาะจง"],["คัดเลือก","คัดเลือก"],["ประกาศเชิญชวนทั่วไป","ประกาศเชิญชวนทั่วไป"]]],["inspector","ชื่อผู้ตรวจรับพัสดุ",""],["otherNote","ข้อเสนอเพิ่มเติม / รายละเอียดอื่น","","textarea"],["agreedPrice","ราคาที่ตกลงซื้อ (บาท)","","number"],["vendor","ชื่อผู้ขาย / ผู้รับจ้าง (ชื่อเต็ม)","","textarea"],["deliveryDate","วันที่ครบกำหนดส่งมอบ","","date"],["noticeDate","วันที่ออกประกาศผู้ชนะ","","date"],["orderDate","วันที่ใบสั่งซื้อ / สั่งจ้าง","","date"],["purchaseOrderNo","เลขที่ใบสั่งซื้อ / สั่งจ้าง",""],["invoiceBook","เล่มที่ใบส่งของ / ใบแจ้งหนี้",""],["invoiceNo","เลขที่ใบส่งของ / ใบแจ้งหนี้",""],["invoiceDate","วันที่ใบส่งของ / ใบแจ้งหนี้","","date"],["receiptDate","วันที่ตรวจรับพัสดุ","","date"],["receiptNote","ผลการตรวจรับ / การเปลี่ยนแปลง (ข้อความยาว)","","textarea"],["beforeVat","จำนวนเงินก่อน VAT (บาท)","","number"],["vat","ภาษีมูลค่าเพิ่ม VAT (บาท)","","number"],["withholding","ภาษีหัก ณ ที่จ่าย (บาท)","","number"],["fine","ค่าปรับ (บาท)","","number"],["requisitionDate","วันที่เบิกพัสดุ","","date"],["requester","ชื่อผู้เบิกพัสดุ",""],["requesterPosition","ตำแหน่งผู้เบิก","ครู"],["recipient","ชื่อผู้รับของ (ถ้ามี)",""],["proxyRecipient","ชื่อผู้รับแทน (ถ้ามี)",""]];
const commonPdfReferences={"school":[1,2,3,4,5,6,7,8,9,10,11,12],"agency":[1,2,5,7,11],"memoNo":[1,2,5,7,11],"requestDate":[1,2,5,6,7],"subject":[1,2,3,5,7,8,9,10,11],"purchaseType":[1,3,5,7,8],"fiscalYear":[1,3],"project":[1,5,8],"activity":[1,3,5,8],"budget":[1,3,4,5,6,7,9,10,11],"specPreparer":[1,2,4],"specPosition":[1],"procOfficer":[1,2,5,7,8,10,11],"headOfficer":[1,2,5,7,8,10,11],"director":[1,2,6,8,9,10,11],"specApprovalDate":[1,2],"eventDate":[3],"purpose":[3,5],"budgetSource":[1,3,5],"referencePrice":[3,4,5,6],"deliveryPlace":[3],"priceValidityDays":[4],"deliveryDays":[4,5,7],"warranty":[4],"procurementMethod":[5,8],"inspector":[5,10],"otherNote":[5],"agreedPrice":[7,9,10,11],"vendor":[3,7,8,9,10,11],"deliveryDate":[7,9,10],"noticeDate":[9],"orderDate":[10,11],"purchaseOrderNo":[10,11],"invoiceBook":[10,11],"invoiceNo":[10,11],"invoiceDate":[10,11],"receiptDate":[10,11],"receiptNote":[10],"beforeVat":[4,6,11],"vat":[4,6,11],"withholding":[11],"fine":[10,11],"requisitionDate":[12],"requester":[12],"requesterPosition":[12],"recipient":[13],"proxyRecipient":[12]};
const commonSectionInfo=[{"index":0,"title":"หัวบันทึกข้อความและรายละเอียดคำขอ","hint":"หน้า 1–3"},{"index":11,"title":"ผู้เกี่ยวข้อง TOR และเงื่อนไขงาน","hint":"หน้า 1–5"},{"index":28,"title":"ผู้ขายและผลการพิจารณา","hint":"หน้า 5–9"},{"index":37,"title":"ตรวจรับ การเงิน และใบเบิก","hint":"หน้า 10–13"}];
function commonFieldMarkup(field,index){
 const key=field[0],refs=commonPdfReferences[key]||[],first=refs[0]||1;
 const section=commonSectionInfo.find(s=>s.index===index);
 const sectionHtml=section?'<div class="commonSectionHeading"><strong>'+esc(section.title)+'</strong><span>'+esc(section.hint)+'</span></div>':'';
 const shared=refs.length>1?'<label class="commonReuse"><input type="checkbox" checked disabled title="ใช้ข้อมูลเดียวกันในตำแหน่งที่ผูกไว้หลายหน้า"> ใช้ข้อมูลร่วมกัน</label>':'';
 const jump=first<=pages.length?'<button type="button" class="commonPageJump" data-common-page="'+first+'">ดูหน้า '+first+' →</button>':'<span>รอแม่แบบ PDF ใหม่</span>';
 return sectionHtml+'<div class="commonFieldRow"><div class="commonFieldNumber">'+(index+1)+'</div><div class="commonFieldBody">'+fieldMarkup(field)+'<div class="commonFieldMeta"><span>อ้างอิง PDF ตัวอย่าง: หน้า '+esc(refs.join(', ')||'-')+'</span>'+shared+jump+'</div></div></div>';
}
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
let fieldMappings=[],mappingMode=false,mappingSelection=-1,mappingDoc=null,mappingDrawing=null;
const templatePath=(dept=activeDepartment)=>"procurement/templates/departments/"+dept+"/source.pdf";
const referenceMessage=msg=>{$("sourceMessage").textContent=msg};
const fileFrame=()=>$("actualPdfFrame");
async function refreshPdfPreview(){
 if(!templateBlob)return;
 const token=++pdfRenderToken;
 referenceMessage("กำลังเติมข้อมูลจากฟอร์มลง PDF ต้นฉบับ…");
 try{
  const filled=await fillProcurementPdf(templateBlob,state.values,fieldMappings);
  if(token!==pdfRenderToken)return;
  previewBlob=filled.blob;
  if(pdfObjectUrl)URL.revokeObjectURL(pdfObjectUrl);
  pdfObjectUrl=URL.createObjectURL(previewBlob);
  fileFrame().style.display="block";
  setPdfPage();
  referenceMessage("Preview จาก PDF จริง "+filled.pageCount+" หน้า • เติมข้อมูล "+filled.count+" จุด • ข้ามช่องที่ข้อความไม่พอดีกับขนาด 16 pt / พิกัดไม่ถูกต้อง "+filled.skipped+" จุด (ต้องปรับพื้นที่ ไม่ย่อฟอนต์)");
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
 if(pdfObjectUrl){const next=pdfObjectUrl+"#page="+page+"&view=Fit";if(fileFrame().src!==next)fileFrame().src=next;}
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
 // Do not block the original PDF on Firestore field layouts or optional font metadata.
 referenceMessage("กำลังโหลด PDF แม่แบบกลางจาก Storage…");
 const mappingTask=loadFieldMappings().catch(e=>{console.warn("PDF field mapping not available",e)});
 const fontTask=checkPdfFont().catch(e=>{console.warn("PDF font status unavailable",e)});
 try{
  let blob;
  try{blob=await loadPdfBlob("general")}
  catch(error){
   // Show a clear error; never replace the source with a guessed document.
   const msg=error.code==="storage/object-not-found"?"ยังไม่พบ PDF แม่แบบกลางใน Storage":error.code==="storage/unauthorized"?"ไม่มีสิทธิ์อ่าน PDF แม่แบบกลางใน Firebase Storage":(error.code||error.message);
   throw Error(msg);
  }
  if(activeDepartment!==requested)return;
  if(blob.type!=="application/pdf"&&blob.type!=="application/octet-stream")throw Error("ไฟล์ใน Storage ไม่ใช่ PDF");
  templateBlob=blob;previewBlob=blob;
  if(pdfObjectUrl)URL.revokeObjectURL(pdfObjectUrl);
  pdfObjectUrl=URL.createObjectURL(blob);
  fileFrame().style.display="block";
  setPdfPage();
  referenceMessage("แสดง PDF แม่แบบกลางแล้ว • กำลังเตรียมตำแหน่ง Field สำหรับเติมข้อมูล…");
  $("templateInstallStatus").textContent="PDF ต้นฉบับพร้อมแล้ว · "+(blob.size/1024).toFixed(1)+" KB";
  // Field layouts need not prevent the original PDF being displayed.
  const postLoad=Promise.allSettled([mappingTask,fontTask]);
  await Promise.race([postLoad,new Promise(resolve=>setTimeout(resolve,4500))]);
  if(activeDepartment!==requested||templateBlob!==blob)return;
  await refreshPdfPreview();
  // A slow Firestore read can still finish later; update the preview when it does.
  postLoad.then(()=>{
   if(activeDepartment===requested&&templateBlob===blob)queueTemplateRefresh();
  });
  $("templateInstallStatus").textContent="พบแม่แบบ PDF ใน Storage แล้ว ไม่ต้องอัปโหลดซ้ำ";
 }catch(error){
  if(activeDepartment!==requested)return;
  referenceMessage("ยังเปิด PDF ไม่ได้: "+(error.message||error));
  $("templateInstallStatus").textContent=error.message||String(error);
 }
}

const pdfFontPath="procurement/fonts/THSarabunPSK.ttf";
let pdfFontInstalled=false;
async function loadPrivatePdfFont(){
 const fontRef=firebaseFns.ref(templateStorage,pdfFontPath);
 const blob=await firebaseFns.getBlob(fontRef);
 return blob.arrayBuffer();
}
async function checkPdfFont(){
 if(!templateStorage)return;
 try{
  await firebaseFns.getMetadata(firebaseFns.ref(templateStorage,pdfFontPath));
  pdfFontInstalled=true;
  $("pdfFontStatus").textContent="✓ พบฟอนต์ THSarabunPSK ที่ติดตั้งใน Storage แล้ว";
 }catch(e){
  pdfFontInstalled=false;
  $("pdfFontStatus").textContent=e.code==="storage/object-not-found"?"ยังไม่ได้ติดตั้ง THSarabunPSK · PDF ใช้ฟอนต์สำรอง":"ตรวจฟอนต์ไม่ได้: "+(e.code||e.message);
 }
 setProcurementPdfFontLoader(loadPrivatePdfFont);
}
$("installPdfFont").onclick=async()=>{
 if(profile?.role!=="admin")return;
 const file=$("pdfFontInput").files?.[0],button=$("installPdfFont");
 if(!file||!/\.(ttf|otf)$/i.test(file.name))return alert("กรุณาเลือกไฟล์ .ttf หรือ .otf หลังแตกไฟล์ RAR");
 if(file.size>8*1024*1024)return alert("ฟอนต์ต้องมีขนาดไม่เกิน 8 MB");
 button.disabled=true;$("pdfFontStatus").textContent="กำลังติดตั้งฟอนต์ลง Firebase Storage…";
 try{
  await firebaseFns.uploadBytes(firebaseFns.ref(templateStorage,pdfFontPath),file,{contentType:"application/octet-stream"});
  setProcurementPdfFontLoader(loadPrivatePdfFont);
  await checkPdfFont();
  queueTemplateRefresh();
 }catch(e){$("pdfFontStatus").textContent="ติดตั้งฟอนต์ไม่สำเร็จ: "+(e.code||e.message)}
 finally{button.disabled=false}
};

const mappingDocId=()=>activeDepartment;
const mappingFieldOptions=()=>[...commonFields,...specificFields.filter(f=>!sections.has(f[0]))].filter(f=>typeof f[0]==="string"&&!["purchaseType","budgetSource"].includes(f[0]));
$("mappingField").innerHTML=mappingFieldOptions().map(f=>'<option value="'+esc(f[0])+'">'+esc(f[1])+'</option>').join("");
const mappingBackupKey=()=>["procurement-map-v2",firebaseConfig.projectId,user?.uid||"guest",activeDepartment].join(":");
let mappingDirty=false,mappingAutoSaveTimer=null,mappingSaving=false,mappingRevision=0;
function saveLocalMapping(cloudStamp){
 if(!activeDepartment)return;
 try{
  const data={version:2,department:activeDepartment,updatedAt:cloudStamp??Date.now(),fields:fieldMappings};
  localStorage.setItem(mappingBackupKey(),JSON.stringify(data));
  $("mappingSaveStatus").textContent="สำรองในเบราว์เซอร์แล้ว • รอซิงก์ Firebase";
 }catch(e){$("mappingSaveStatus").textContent="ไม่สามารถสำรองในเบราว์เซอร์: "+(e.message||e)}
}
function mappingChanged(){
 mappingDirty=true;mappingRevision++;
 saveLocalMapping();
 clearTimeout(mappingAutoSaveTimer);
 mappingAutoSaveTimer=setTimeout(()=>persistFieldMappings(false),1800);
}
function sameMappingFields(a,b){
 if(!Array.isArray(a)||!Array.isArray(b)||a.length!==b.length)return false;
 const keys=["page","key","x","y","w","h","fontSize","clearBackground","align"];
 return a.every((item,i)=>keys.every(k=>item?.[k]===b[i]?.[k]));
}
async function persistFieldMappings(manual=true){
 if(profile?.role!=="admin"||!activeDepartment||!db)return;
 if(mappingSaving){if(manual)$("mappingSaveStatus").textContent="กำลังบันทึกก่อนหน้า กรุณากดอีกครั้งหลังเสร็จ";return}
 const dept=activeDepartment,revision=mappingRevision;
 const snapshot=JSON.parse(JSON.stringify(fieldMappings));
 mappingSaving=true;
 const btn=$("saveMapping");btn.disabled=true;
 $("mappingSaveStatus").textContent="กำลังส่ง "+snapshot.length+" ช่องไป Firebase…";
 try{
  await firebaseFns.setDoc(firebaseFns.doc(db,"procurement_pdf_mappings",dept),{
   departmentId:dept,templatePath:templatePath(dept),fields:snapshot,updatedBy:user.uid,
   updatedAt:firebaseFns.serverTimestamp()
  });
  // Server fetch is required: a local SDK write alone is not proof of a persisted mapping.
  const actual=await firebaseFns.getDocFromServer(firebaseFns.doc(db,"procurement_pdf_mappings",dept));
  if(!actual.exists()||!sameMappingFields(actual.data().fields,snapshot))throw Error("เซิร์ฟเวอร์ยังไม่ยืนยันชุดตำแหน่งที่บันทึก");
  if(dept===activeDepartment&&revision===mappingRevision){
   mappingDirty=false;
   $("mappingSaveStatus").textContent="✓ Firebase ยืนยันบันทึกแล้ว "+snapshot.length+" ช่อง • กลับมาทำต่อได้";
  }
  if(dept===activeDepartment)$("mappingStatus").textContent="ตำแหน่งบน Firebase: "+snapshot.length+" ช่อง";
  queueTemplateRefresh();
 }catch(e){
  $("mappingSaveStatus").textContent="⚠ Firebase ไม่สำเร็จ ("+(e.code||e.message)+") • ยังมีสำรองในเบราว์เซอร์";
 }finally{
  mappingSaving=false;btn.disabled=false;
  if(dept===activeDepartment&&revision!==mappingRevision&&mappingDirty){
   clearTimeout(mappingAutoSaveTimer);
   mappingAutoSaveTimer=setTimeout(()=>persistFieldMappings(false),1200);
  }
 }
}
async function loadFieldMappings(){
 clearTimeout(mappingAutoSaveTimer);mappingDirty=false;mappingRevision=0;
 fieldMappings=[];mappingSelection=-1;
 if(!activeDepartment||!db)return;
 let local=null;
 try{
  local=JSON.parse(localStorage.getItem(mappingBackupKey())||"null");
  if(local?.department===activeDepartment&&Array.isArray(local.fields))fieldMappings=local.fields;
 }catch(e){local=null}
 try{
  const d=await firebaseFns.getDocFromServer(firebaseFns.doc(db,"procurement_pdf_mappings",mappingDocId()));
  if(d.exists()&&Array.isArray(d.data().fields)){
   const cloudStamp=d.data().updatedAt?.toMillis?.()||0;
   if(!local||local.updatedAt<=cloudStamp){
    fieldMappings=d.data().fields;
    saveLocalMapping(cloudStamp);
    mappingDirty=false;
    $("mappingSaveStatus").textContent="✓ โหลดตำแหน่งจาก Firebase "+fieldMappings.length+" ช่อง";
   }else{
    mappingDirty=true;
    $("mappingSaveStatus").textContent="กู้คืนสำรองในเบราว์เซอร์ "+fieldMappings.length+" ช่อง • กดบันทึกลง Firebase";
   }
  }else{
   mappingDirty=Boolean(local?.fields?.length);
   $("mappingSaveStatus").textContent=mappingDirty?"พบสำรองในเบราว์เซอร์ "+fieldMappings.length+" ช่อง • โปรดบันทึกลง Firebase":"ยังไม่เคยบันทึกตำแหน่งสำหรับฝ่ายนี้";
  }
 }catch(e){
  mappingDirty=Boolean(local?.fields?.length);
  $("mappingSaveStatus").textContent="อ่าน Firebase ไม่ได้ ("+(e.code||e.message)+")"+(mappingDirty?" • กู้สำรองในเครื่อง "+fieldMappings.length+" ช่อง":"");
 }
 $("mappingStatus").textContent="มีตำแหน่ง "+fieldMappings.length+" ช่อง";
}
const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
let mappingMove=null;
function normalizeMapping(f){
 f.x=clamp(Number(f.x)||0,0,1);f.y=clamp(Number(f.y)||0,0,1);
 f.w=clamp(Number(f.w)||.02,.005,1-f.x);f.h=clamp(Number(f.h)||.02,.005,1-f.y);
}
function updateMappingControls(){
 const f=fieldMappings[mappingSelection];
 for(const id of ["mappingX","mappingY","mappingW","mappingH"])$(id).disabled=!f;
 if(!f)return;
 $("mappingField").value=f.key;$("mappingFont").value=16;$("mappingClear").checked=f.clearBackground===true;
 for(const [name,val] of Object.entries({mappingX:f.x,mappingY:f.y,mappingW:f.w,mappingH:f.h}))$(name).value=(val*100).toFixed(2);
}
function redrawSelected(){
 drawMappingRects();updateMappingControls();
}
function pointerOnMapping(e){
 const b=$("mappingLayer").getBoundingClientRect();
 return {x:clamp((e.clientX-b.left)/b.width,0,1),y:clamp((e.clientY-b.top)/b.height,0,1)}
}
function startMoveResize(e,index,handle){
 e.stopPropagation();e.preventDefault();
 mappingSelection=index;const f=fieldMappings[index];if(!f)return;
 const pos=pointerOnMapping(e);
 mappingMove={pointerId:e.pointerId,index,handle,start:pos,original:{x:f.x,y:f.y,w:f.w,h:f.h}};
 $("mappingLayer").setPointerCapture(e.pointerId);
 redrawSelected();
}
function drawMappingRects(){
 const layer=$("mappingLayer");layer.innerHTML="";
 fieldMappings.forEach((f,i)=>{
  if(f.page!==page)return;
  normalizeMapping(f);
  const box=document.createElement("div");box.className="mappedField"+(i===mappingSelection?" selected":"");
  Object.assign(box.style,{left:f.x*100+"%",top:f.y*100+"%",width:f.w*100+"%",height:f.h*100+"%"});
  const title=document.createElement("span");title.className="fieldCaption";title.textContent=mappingFieldOptions().find(o=>o[0]===f.key)?.[1]||f.key;box.appendChild(title);
  box.addEventListener("pointerdown",e=>startMoveResize(e,i,"move"));
  if(i===mappingSelection){
   for(const handle of ["nw","n","ne","e","se","s","sw","w"]){
    const node=document.createElement("div");node.className="resizeHandle handle-"+handle;node.dataset.handle=handle;
    node.addEventListener("pointerdown",e=>startMoveResize(e,i,handle));
    box.appendChild(node);
   }
  }
  layer.appendChild(box);
 });
}
function applyMoveResize(pos){
 if(!mappingMove)return;
 const {index,handle,start,original:o}=mappingMove,f=fieldMappings[index];
 if(!f)return;
 const dx=pos.x-start.x,dy=pos.y-start.y,minW=.008,minH=.006;
 if(handle==="move"){
  f.x=clamp(o.x+dx,0,1-o.w);f.y=clamp(o.y+dy,0,1-o.h);
  f.w=o.w;f.h=o.h;
 }else{
  let left=o.x,top=o.y,right=o.x+o.w,bottom=o.y+o.h;
  if(handle.includes("w"))left=clamp(o.x+dx,0,right-minW);
  if(handle.includes("e"))right=clamp(o.x+o.w+dx,left+minW,1);
  if(handle.includes("n"))top=clamp(o.y+dy,0,bottom-minH);
  if(handle.includes("s"))bottom=clamp(o.y+o.h+dy,top+minH,1);
  f.x=left;f.y=top;f.w=right-left;f.h=bottom-top;
 }
 redrawSelected();
}
async function renderMappingPage(){
 if(!mappingMode||!templateBlob)return;
 const canvas=$("mappingCanvas"),layer=$("mappingLayer"),host=$("mappingPage");
 try{
  if(!window.pdfjsLib)throw Error("PDF.js ไม่พร้อม");
  pdfjsLib.GlobalWorkerOptions.workerSrc="https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js";
  if(!mappingDoc)mappingDoc=await pdfjsLib.getDocument({data:new Uint8Array(await templateBlob.arrayBuffer())}).promise;
  if(!mappingMode)return;
  const pg=await mappingDoc.getPage(page),base=pg.getViewport({scale:1});
  const scale=Math.min(1.5,Math.max(.55,(host.parentElement.clientWidth-32)/base.width));
  const viewport=pg.getViewport({scale}),ctx=canvas.getContext("2d");
  canvas.width=Math.round(viewport.width);canvas.height=Math.round(viewport.height);
  layer.style.width=canvas.width+"px";layer.style.height=canvas.height+"px";
  await pg.render({canvasContext:ctx,viewport}).promise;
  drawMappingRects();
  $("mappingStatus").textContent="หน้า "+page+" • มีช่อง "+fieldMappings.filter(f=>f.page===page).length+" ช่อง · ลากบน PDF เพื่อเพิ่ม";
 }catch(e){$("mappingStatus").textContent="แสดงหน้าสำหรับกำหนดช่องไม่ได้: "+(e.message||e)}
}
function toggleMapping(active){
 if(profile?.role!=="admin")return;
 mappingMode=active;
 if(!active&&mappingDirty){clearTimeout(mappingAutoSaveTimer);persistFieldMappings(false)}
 $("mappingWorkspace").hidden=!active;
 $("actualWord").hidden=active;
 $("toggleMapping").textContent=active?"กำลังกำหนดช่องข้อมูล":"กำหนดช่องข้อมูล (Admin)";
 if(active)renderMappingPage();
 else{mappingDoc?.destroy();mappingDoc=null;queueTemplateRefresh()}
}
$("toggleMapping").onclick=()=>toggleMapping(!mappingMode);
$("exitMapping").onclick=()=>toggleMapping(false);
$("mappingLayer").addEventListener("pointerdown",e=>{
 if(!mappingMode||e.target!==$("mappingLayer"))return;
 const rect=$("mappingLayer").getBoundingClientRect();
 const x=(e.clientX-rect.left)/rect.width,y=(e.clientY-rect.top)/rect.height;
 mappingDrawing={x,y};const outline=document.createElement("div");outline.className="mappingDraft";outline.id="mappingDraft";
 outline.style.left=(x*100)+"%";outline.style.top=(y*100)+"%";$("mappingLayer").appendChild(outline);
 $("mappingLayer").setPointerCapture(e.pointerId);
});
$("mappingLayer").addEventListener("pointermove",e=>{
 if(mappingMove){applyMoveResize(pointerOnMapping(e));return}
 if(!mappingDrawing)return;
 const {x,y}=pointerOnMapping(e);
 const d=$("mappingDraft");if(!d)return;
 Object.assign(d.style,{left:Math.min(x,mappingDrawing.x)*100+"%",top:Math.min(y,mappingDrawing.y)*100+"%",width:Math.abs(x-mappingDrawing.x)*100+"%",height:Math.abs(y-mappingDrawing.y)*100+"%"});
});
$("mappingLayer").addEventListener("pointerup",e=>{
 if(mappingMove){mappingMove=null;mappingChanged();return}
 if(!mappingDrawing)return;
 const {x,y}=pointerOnMapping(e);
 const left=Math.min(x,mappingDrawing.x),top=Math.min(y,mappingDrawing.y),w=Math.abs(x-mappingDrawing.x),h=Math.abs(y-mappingDrawing.y);
 mappingDrawing=null;
 if(w<.015||h<.008){drawMappingRects();return}
 const f={page,key:$("mappingField").value,x:left,y:top,w,h,fontSize:16,clearBackground:$("mappingClear").checked,align:"left"};
 fieldMappings.push(f);mappingSelection=fieldMappings.length-1;redrawSelected();mappingChanged();
});
$("mappingLayer").addEventListener("pointercancel",()=>{mappingMove=null;mappingDrawing=null;drawMappingRects()});
for(const [id,key] of [["mappingX","x"],["mappingY","y"],["mappingW","w"],["mappingH","h"]]){
 $(id).onchange=()=>{
  const f=fieldMappings[mappingSelection];if(!f)return;
  const parsed=Number($(id).value);if(!Number.isFinite(parsed))return;
  f[key]=parsed/100;normalizeMapping(f);redrawSelected();mappingChanged();
 };
}
document.addEventListener("keydown",e=>{
 if(!mappingMode||mappingSelection<0||!["ArrowLeft","ArrowRight","ArrowUp","ArrowDown"].includes(e.key))return;
 const target=e.target;
 if(target instanceof HTMLElement && target.matches("input,textarea,select,[contenteditable]"))return;
 const f=fieldMappings[mappingSelection],layer=$("mappingLayer");
 if(!f||!layer.clientWidth||!layer.clientHeight)return;
 e.preventDefault();
 const pixels=e.shiftKey?10:1;
 const dx=(e.key==="ArrowLeft"?-pixels:e.key==="ArrowRight"?pixels:0)/layer.clientWidth;
 const dy=(e.key==="ArrowUp"?-pixels:e.key==="ArrowDown"?pixels:0)/layer.clientHeight;
 f.x=clamp(f.x+dx,0,1-f.w);f.y=clamp(f.y+dy,0,1-f.h);
 redrawSelected();mappingChanged();
});
$("mappingField").onchange=()=>{if(mappingSelection>=0){fieldMappings[mappingSelection].key=$("mappingField").value;drawMappingRects();mappingChanged()}};
$("mappingFont").onchange=()=>{if(mappingSelection>=0)fieldMappings[mappingSelection].fontSize=16;mappingChanged()};
$("mappingClear").onchange=()=>{if(mappingSelection>=0)fieldMappings[mappingSelection].clearBackground=$("mappingClear").checked;mappingChanged()};
$("removeMapping").onclick=()=>{if(mappingSelection<0)return;fieldMappings.splice(mappingSelection,1);mappingSelection=-1;redrawSelected();mappingChanged()};
$("saveMapping").onclick=()=>persistFieldMappings(true);
$("downloadMappingBackup").onclick=()=>{
 const json=JSON.stringify({version:2,department:activeDepartment,fields:fieldMappings,exportedAt:new Date().toISOString()},null,2);
 const url=URL.createObjectURL(new Blob([json],{type:"application/json"}));
 const anchor=document.createElement("a");anchor.href=url;anchor.download="pdf-fields-"+activeDepartment+".json";anchor.click();
 setTimeout(()=>URL.revokeObjectURL(url),1000);
};
$("importMappingBackup").onchange=async e=>{
 const file=e.target.files?.[0];if(!file)return;
 try{
  const parsed=JSON.parse(await file.text());
  if(parsed.department!==activeDepartment||!Array.isArray(parsed.fields)||parsed.fields.length>300)throw Error("ไฟล์สำรองไม่ตรงฝ่ายหรือจำนวนช่องเกินกำหนด");
  if(!confirm("นำเข้าตำแหน่ง "+parsed.fields.length+" ช่องแทนชุดที่เปิดอยู่หรือไม่?"))return;
  fieldMappings=parsed.fields;mappingSelection=-1;redrawSelected();mappingChanged();
 }catch(error){alert("นำเข้าข้อมูลไม่ได้: "+error.message)}
 finally{e.target.value=""}
};

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
// Browser date input always stores YYYY-MM-DD, regardless of department locale.
const TH_MONTHS=["มกราคม","กุมภาพันธ์","มีนาคม","เมษายน","พฤษภาคม","มิถุนายน","กรกฎาคม","สิงหาคม","กันยายน","ตุลาคม","พฤศจิกายน","ธันวาคม"];
function normalizeDateInput(value){
 const text=String(value||"").trim();
 if(/^\d{4}-\d{2}-\d{2}$/.test(text))return text;
 const m=text.match(/^(\d{1,2})\s+([^\s]+)\s+(\d{4})$/);
 if(!m)return "";
 const month=TH_MONTHS.findIndex(name=>name===m[2]);
 if(month<0)return "";
 const year=Number(m[3])-(Number(m[3])>=2400?543:0);
 if(year<1900||year>2200)return "";
 return year+"-"+String(month+1).padStart(2,"0")+"-"+String(m[1]).padStart(2,"0");
}
function fieldMarkup(f){
 let [key,label,def,type="text",opts]=f;
 const inputValue=type==="date"?normalizeDateInput(v(key)):v(key);
 const control=type==="select"
 ?'<select data-key="'+esc(key)+'">'+opts.map(([value,title])=>'<option value="'+esc(value)+'" '+(v(key)===value?"selected":"")+'>'+esc(title)+'</option>').join("")+'</select>'
 :type==="textarea"?'<textarea data-key="'+esc(key)+'" rows="3">'+esc(v(key))+'</textarea>'
 :'<input data-key="'+esc(key)+'" type="'+type+'" '+(type==="number"?'step="any"':'')+' value="'+esc(inputValue)+'">';
 return '<label class="'+(type==="textarea"?"wide":"")+'">'+esc(label)+control+(type==="date"?'<small class="dateHelp">เลือกจากปฏิทิน • แสดงวันที่ไทย พ.ศ. ใน PDF</small>':"")+'</label>';
}
function renderInputs(){
 $("commonFields").innerHTML=commonFields.map(commonFieldMarkup).join("");
 const remaining=specificFields.filter(f=>!sections.has(f[0])&&!commonFields.some(c=>c[0]===f[0]));
 $("specificFields").innerHTML=remaining.length?remaining.map(fieldMarkup).join(""):'<p class="sourceMessage">ข้อมูลที่ต้องกรอกจากไฟล์ตัวอย่างถูกรวมเรียงตามเอกสารไว้ใน “ข้อมูลกลาง” แล้ว • ส่วนนี้สงวนไว้สำหรับช่องเพิ่มเติมจากแม่แบบในอนาคต</p>';
document.querySelectorAll("[data-key]").forEach(el=>el.oninput=()=>{state.values[el.dataset.key]=el.value;renderPaper();renderTotals();queueTemplateRefresh();});
document.querySelectorAll("[data-common-page]").forEach(btn=>btn.onclick=()=>{goPage(Number(btn.dataset.commonPage));$("paperLabel").scrollIntoView({behavior:"smooth",block:"nearest"});});}
function renderItems(){ $("itemsRows").innerHTML=state.items.map((r,i)=>'<div class="itemRow"><strong>รายการที่ '+(i+1)+'</strong><div class="rowgrid">'+[["description","ชื่อรายการพัสดุ"],["quantity","จำนวน"],["unit","หน่วยนับ"],["unitPrice","ราคาต่อหน่วย"]].map(([k,name])=>'<label>'+name+'<input data-item="'+i+'" data-col="'+k+'" value="'+esc(r[k])+'" '+(["quantity","unitPrice"].includes(k)?'type="number" min="0" step="any"':'')+'></label>').join("")+'</div><button data-remove="'+i+'" class="secondary">ลบรายการ</button></div>').join("");document.querySelectorAll("[data-item]").forEach(el=>el.oninput=()=>{state.items[Number(el.dataset.item)][el.dataset.col]=el.value;renderPaper();renderTotals()});document.querySelectorAll("[data-remove]").forEach(el=>el.onclick=()=>{if(state.items.length===1)return;state.items.splice(Number(el.dataset.remove),1);renderItems();renderPaper();queueTemplateRefresh()});renderTotals()}
function renderTotals(){$("itemTotals").innerHTML='รวมมูลค่ารายการพัสดุที่กรอก: <b>'+fmt(total())+' บาท</b>　(โปรดตรวจเทียบวงเงินงาน '+fmt(v("budget"))+' บาท)'}
function renderPaper(){setPdfPage();if(mappingMode)renderMappingPage();document.querySelectorAll("[data-page-button]").forEach(b=>b.classList.toggle("selected",Number(b.dataset.pageButton)===page))}
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
// Single shared PDF workflow. Historical department IDs stay intact in old saved copies.
function usableDepartments(){return [["general","แม่แบบเอกสารกลาง"]]}
function renderDepartmentSelection(){
 $("departmentCards").innerHTML="";
}
async function selectDepartment(){
 activeDepartment="general";
 $("departmentNext").hidden=false;
 $("activeDepartmentName").textContent="เอกสารชุดกลาง";
 renderSavedCopiesList();
 $("templateSetup").hidden=profile?.role!=="admin";
 await ensureTemplate();
}
function startDepartmentDraft(){
 activeDepartment="general";
 state=blank();state.values.department="general";
 delete state.values.departmentName;
 $("departmentGate").hidden=true;$("workArea").hidden=false;
 $("mappingToolbar").hidden=profile?.role!=="admin";
 renderInputs();renderItems();renderPaper();goStage("common");queueTemplateRefresh();
 $("banner").textContent="จัดทำเอกสารจากแม่แบบกลาง · กรอกข้อมูลครั้งเดียวใช้ได้ทุกหน้าที่ผูกไว้";
}
$("startNew").onclick=startDepartmentDraft;
$("changeDepartment").onclick=()=>{
 const containsData=!!state.values.subject||!!state.values.project||state.items.some(i=>i.description);
 if(containsData&&!confirm("ยังมีข้อมูลที่ไม่ได้บันทึก ต้องการกลับไปยังรายการเอกสารหรือไม่?"))return;
 $("workArea").hidden=true;$("departmentGate").hidden=false;activeDepartment="general";
 renderSavedCopiesList();
};
function renderSavedCopiesList(){
 const selected=savedCopies.filter(c=>profile?.role==="admin"||c.createdBy===user.uid);
 $("savedCopiesList").innerHTML=selected.map(c=>'<div class="savedCopyRow"><div><strong>'+esc(c.title||"ไม่มีชื่อเอกสาร")+'</strong><small>'+esc(c.createdAt?.toDate?.().toLocaleString("th-TH")||"เพิ่งบันทึก")+(c.departmentId!=="general"?" · งานเก่าจากโครงสร้างเดิม":"")+'</small></div><button type="button" class="secondary" data-copy="'+esc(c.id)+'">เปิดทำงานต่อ</button></div>').join("")||'<p class="emptyCopies">ยังไม่มีเอกสารที่บันทึกไว้</p>';
 $("savedCopiesList").querySelectorAll("[data-copy]").forEach(b=>b.onclick=()=>loadSelectedCopy(b.dataset.copy));
 $("gateStatus").textContent="เอกสารที่บันทึกไว้ "+selected.length+" ชุด";
}
function loadSelectedCopy(id){
 const c=savedCopies.find(x=>x.id===id);
 if(!c||(profile?.role!=="admin"&&c.createdBy!==user.uid))return;
 state=safeSnapshot({values:c.values,items:c.items,selected:c.selectedPages});
 state.values.department="general";
 $("mappingToolbar").hidden=profile?.role!=="admin";
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
 state.values.department="general";const safe=safeSnapshot(state),copyName=safe.values.subject?.trim()||"เอกสารจัดซื้อจัดจ้างไม่มีชื่อ";
 const entry={schemaVersion:1,templateId:"first-set-pdf11-v1",title:copyName,departmentId:"general",createdBy:user.uid,createdAt:firebaseFns.serverTimestamp(),values:safe.values,items:safe.items,selectedPages:safe.selected,documentCount:11};
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
$("departmentCards").innerHTML='<div class="loadingDepartments">กำลังตรวจสิทธิ์และโหลดแม่แบบเอกสาร…</div>';
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
    await selectDepartment();
    $("login-state").textContent=(profile.role==="admin"?"Admin • ":"")+(profile.displayName||u.email);
    $("banner").textContent="ระบบเอกสารชุดกลางพร้อมใช้งาน • สร้างงานใหม่หรือเปิดงานที่บันทึกไว้";
    // Saved records are supplementary. A failure must not prevent a new document.
    await refreshSavedCopies();
   }catch(e){$("editorRoot").hidden=true;$("login-state").textContent="ตรวจสิทธิ์ไม่ผ่าน";$("banner").textContent="เข้าสู่ระบบแล้ว แต่ตรวจสิทธิ์ไม่สำเร็จ: "+(e.code||e.message)}
  },e=>{$("banner").textContent="ระบบ Login มีปัญหา: "+(e.code||e.message);$("login-state").textContent="เชื่อมต่อไม่ได้"});
 }catch(e){$("banner").textContent="โหลดระบบ Firebase ไม่สำเร็จ: "+(e.message||e)+" — กรุณาลองรีเฟรช หากยังไม่หายให้ตรวจเครือข่าย";$("login-state").textContent="เชื่อมต่อไม่สำเร็จ";}
}
boot();
