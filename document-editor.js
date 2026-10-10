import {renderGovernmentPage} from "./official-forms.js";
import {firebaseConfig} from "./firebase-config.js";
import {initializeApp} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import {getAuth,onAuthStateChanged} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import {getFirestore,doc,getDoc,collection,addDoc,getDocs,serverTimestamp} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";
const $=s=>document.getElementById(s),esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const pages=["บันทึกมอบหมายผู้กำหนดคุณลักษณะ","บันทึกขอความเห็นชอบ TOR","ขอบเขตงาน TOR (หน้า 1)","ขอบเขตงาน TOR (หน้า 2)","รายงานขอซื้อ","รายละเอียดพัสดุแนบท้าย","รายงานผลและขออนุมัติสั่งซื้อ","ใบตรวจรับพัสดุ","รายงานผลตรวจรับและอนุมัติเบิกจ่าย","ใบเบิกพัสดุ"];
const departments=[["general","ฝ่ายบริหารทั่วไป"],["academic","ฝ่ายบริหารวิชาการ"],["personnel","ฝ่ายบริหารงานบุคคล"],["site","ฝ่ายสถานที่"],["budget","ฝ่ายบริหารงบประมาณ"]];
const commonFields=[
["school","ชื่อสถานศึกษา","โรงเรียนค่ายบางระจันวิทยาคม"],
["agency","หน่วยงานต้นสังกัด","สำนักงานเขตพื้นที่การศึกษามัธยมศึกษาสิงห์บุรี อ่างทอง"],
["department","ฝ่ายเจ้าของงาน","general","select",departments],
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
function referenceMessage(msg){$("sourceMessage").textContent=msg}
function showOfficialPage(){
 $("sourceViewerBox").hidden=true;
 $("generatedPreview").hidden=false;
 referenceMessage("แสดงแบบเอกสารชุดแรกจากต้นฉบับที่ถอดเป็นโครงหน้าและข้อความ พร้อมเติมข้อมูลที่กรอก • ต้องตรวจเทียบกับ Word ภาพสแกนก่อนใช้ลงนาม");
}
const blank=()=>({values:Object.fromEntries([...commonFields,...specificFields.filter(f=>!sections.has(f[0]))].map(f=>[f[0],f[2]||""])),items:[{description:"",quantity:"",unit:"",unitPrice:""}],selected:Array.from({length:10},(_,i)=>i+1)});
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
document.querySelectorAll("[data-key]").forEach(el=>el.oninput=()=>{state.values[el.dataset.key]=el.value;renderPaper();renderTotals();});}
function renderItems(){ $("itemsRows").innerHTML=state.items.map((r,i)=>'<div class="itemRow"><strong>รายการที่ '+(i+1)+'</strong><div class="rowgrid">'+[["description","ชื่อรายการพัสดุ"],["quantity","จำนวน"],["unit","หน่วยนับ"],["unitPrice","ราคาต่อหน่วย"]].map(([k,name])=>'<label>'+name+'<input data-item="'+i+'" data-col="'+k+'" value="'+esc(r[k])+'" '+(["quantity","unitPrice"].includes(k)?'type="number" min="0" step="any"':'')+'></label>').join("")+'</div><button data-remove="'+i+'" class="secondary">ลบรายการ</button></div>').join("");document.querySelectorAll("[data-item]").forEach(el=>el.oninput=()=>{state.items[Number(el.dataset.item)][el.dataset.col]=el.value;renderPaper();renderTotals()});document.querySelectorAll("[data-remove]").forEach(el=>el.onclick=()=>{if(state.items.length===1)return;state.items.splice(Number(el.dataset.remove),1);renderItems();renderPaper()});renderTotals()}
function renderTotals(){$("itemTotals").innerHTML='รวมมูลค่ารายการพัสดุที่กรอก: <b>'+fmt(total())+' บาท</b>　(โปรดตรวจเทียบวงเงินงาน '+fmt(v("budget"))+' บาท)'}
function renderPaper(){$("paperLabel").textContent="ตัวอย่างเอกสาร · หน้า "+page+" / 10";$("paperHolder").innerHTML=officialPage(page);document.querySelectorAll("[data-page-button]").forEach(b=>b.classList.toggle("selected",Number(b.dataset.pageButton)===page))}
function goStage(target){step=target;document.querySelectorAll(".stage").forEach(el=>el.hidden=el.id!==target);document.querySelectorAll("[data-stage]").forEach(el=>el.classList.toggle("selected",el.dataset.stage===target));if(target==="review")renderReview()}
function goPage(n){page=Math.min(10,Math.max(1,n));renderPaper();showOfficialPage()}
function renderReview(){$("reviewPages").innerHTML=pages.map((title,i)=>'<label class="reviewRow"><input type="checkbox" data-print-page="'+(i+1)+'" '+(state.selected.includes(i+1)?"checked":"")+'><span>หน้า '+(i+1)+' — '+esc(title)+'</span><button type="button" class="secondary" data-jump="'+(i+1)+'">ดูหน้า</button></label>').join("");document.querySelectorAll("[data-print-page]").forEach(el=>el.onchange=()=>{const n=Number(el.dataset.printPage);state.selected=el.checked?[...new Set([...state.selected,n])]:state.selected.filter(x=>x!==n)});document.querySelectorAll("[data-jump]").forEach(el=>el.onclick=e=>{e.preventDefault();goPage(Number(el.dataset.jump))});const mandatory=[["project","ชื่อโครงการ"],["subject","ชื่องานจัดซื้อ"],["budget","วงเงิน"],["requestDate","วันที่เริ่มเรื่อง"],["procOfficer","เจ้าหน้าที่"],["headOfficer","หัวหน้าเจ้าหน้าที่"],["director","ผู้อำนวยการ"],["specPreparer","ผู้จัดทำ TOR"],["vendor","ชื่อผู้ขาย"],["inspector","ผู้ตรวจรับ"]].filter(([k])=>!v(k));$("missing").textContent=mandatory.length?"ข้อมูลที่ควรตรวจให้ครบก่อนพิมพ์: "+mandatory.map(x=>x[1]).join(" • "):"ข้อมูลหลักครบตามรายการตรวจเบื้องต้นแล้ว (ต้องอ่านตรวจถ้อยคำทุกหน้าก่อนนำไปใช้จริง)";}
function safeSnapshot(d){
 const vals=d&&typeof d.values==="object"&&!Array.isArray(d.values)?d.values:{};
 return {values:Object.fromEntries(Object.entries(vals).slice(0,75).map(([k,v])=>[k,String(v??"").slice(0,2000)])),
 items:Array.isArray(d.items)?d.items.slice(0,80).map(i=>({description:String(i.description||"").slice(0,500),quantity:String(i.quantity||""),unit:String(i.unit||""),unitPrice:String(i.unitPrice||"")})):[],
 selected:Array.isArray(d.selected)?d.selected.filter(n=>Number.isInteger(n)&&n>=1&&n<=10):Array.from({length:10},(_,i)=>i+1)};
}
async function refreshSavedCopies(){
 if(!db||!user)return;
 try{
 const result=await getDocs(collection(db,"procurement_document_copies"));
 savedCopies=result.docs.map(d=>({id:d.id,...d.data()})).filter(d=>d.createdBy===user.uid).sort((x,y)=>(y.createdAt?.seconds||0)-(x.createdAt?.seconds||0));
 $("savedCopies").innerHTML='<option value="">เลือกสำเนาที่บันทึกไว้</option>'+savedCopies.map(c=>'<option value="'+esc(c.id)+'">'+esc(c.title||"ไม่ระบุชื่อ")+" · "+esc(c.createdAt?.toDate?.().toLocaleString("th-TH")||"เพิ่งบันทึก")+'</option>').join("");
 $("savedStatus").textContent="มีสำเนาบันทึกไว้ "+savedCopies.length+" ชุด";
 }catch(e){$("savedStatus").textContent="อ่านสำเนาจาก Firestore ไม่ได้: "+(e.code||e.message)}
}
async function saveDraft(){
 if(!user||!profile)return;
 const btn=$("saveBtn");btn.disabled=true;
 $("banner").textContent="กำลังสร้างสำเนาเอกสาร 10 หน้าใน Firestore…";
 try{
 const safe=safeSnapshot(state),copyName=safe.values.subject?.trim()||"เอกสารจัดซื้อจัดจ้างไม่มีชื่อ";
 const entry={schemaVersion:1,templateId:"first-set-v1",title:copyName,departmentId:safe.values.department||profile.departmentId,createdBy:user.uid,createdAt:serverTimestamp(),values:safe.values,items:safe.items,selectedPages:safe.selected,documentCount:10};
 const result=await addDoc(collection(db,"procurement_document_copies"),entry);
 $("banner").textContent="บันทึกสำเนาลง Firestore สำเร็จ · เลขอ้างอิง "+result.id+" · สามารถพิมพ์หรือบันทึก PDF ต่อได้";
 await refreshSavedCopies();$("savedCopies").value=result.id;
 }catch(e){$("banner").textContent="บันทึกลงฐานข้อมูลไม่สำเร็จ: "+(e.code||e.message)+" · ยังไม่ได้สร้างสำเนา อย่าเพิ่งถือว่าบันทึกแล้ว"}
 finally{btn.disabled=false}
}
$("loadCopy").onclick=()=>{
 const c=savedCopies.find(x=>x.id===$("savedCopies").value);
 if(!c)return alert("กรุณาเลือกสำเนา");
 state={...safeSnapshot({values:c.values,items:c.items,selected:c.selectedPages}),selected:c.selectedPages||Array.from({length:10},(_,i)=>i+1)};
 renderInputs();renderItems();renderPaper();renderReview();$("banner").textContent="เปิดข้อมูลสำเนา "+c.id+" จาก Firestore แล้ว";
};
$("saveBtn").onclick=saveDraft;$("previewBtn").onclick=()=>goStage("review");
$("addItem").onclick=()=>{state.items.push({description:"",quantity:"",unit:"",unitPrice:""});renderItems();renderPaper()};
$("selectAll").onclick=()=>{state.selected=Array.from({length:10},(_,i)=>i+1);renderReview()};
$("selectNone").onclick=()=>{state.selected=[];renderReview()};
$("quickPrint").onclick=()=>{$("printSelected").click()};
$("printSelected").onclick=()=>{if(!state.selected.length){alert("กรุณาเลือกอย่างน้อย 1 หน้า");return}renderReview();$("printArea").innerHTML=state.selected.slice().sort((a,b)=>a-b).map(officialPage).join("");window.print()};
$("prev").onclick=()=>goPage(page-1);$("next").onclick=()=>goPage(page+1);
document.querySelectorAll("[data-stage]").forEach(btn=>btn.onclick=()=>goStage(btn.dataset.stage));
$("pageNav").innerHTML=pages.map((title,i)=>'<button class="pageButton" data-page-button="'+(i+1)+'" type="button"><b>หน้า '+(i+1)+'</b>'+esc(title)+'</button>').join("");
document.querySelectorAll("[data-page-button]").forEach(btn=>btn.onclick=()=>goPage(Number(btn.dataset.pageButton)));
const configured=Boolean(firebaseConfig.apiKey&&firebaseConfig.projectId);
if(!configured){$("banner").textContent="ยังไม่มี Firebase config";}else{
const app=initializeApp(firebaseConfig),auth=getAuth(app);db=getFirestore(app);
onAuthStateChanged(auth,async u=>{user=u;
if(!u){$("banner").textContent="กรุณาเข้าสู่ระบบ School Procurement ก่อนเปิดหน้านี้";$("login-state").textContent="ยังไม่ได้เข้าสู่ระบบ";$("editorRoot").hidden=true;return}
try{const d=await getDoc(doc(db,"procurement_users",u.uid));if(!d.exists())throw Error("ไม่พบบัญชีที่ได้รับสิทธิ์");profile=d.data();if(!["admin","staff"].includes(profile.role))throw Error("สิทธิ์ผู้ใช้งานไม่ถูกต้อง");renderInputs();renderItems();renderPaper();await refreshSavedCopies();showOfficialPage();$("editorRoot").hidden=false;$("banner").textContent="เอกสารชุดแรก: กรอกข้อมูลแล้วบันทึกสำเนาใน Firestore • ดูต้นฉบับจาก Storage หากติดตั้งแล้ว";$("login-state").textContent=profile.displayName||u.email;}
catch(e){$("banner").textContent="ตรวจสิทธิ์ไม่สำเร็จ: "+(e.code||e.message);$("editorRoot").hidden=true}
});
}
