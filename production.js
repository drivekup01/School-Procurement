import {firebaseConfig} from "./firebase-config.js";
import {initializeApp} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import {getAuth,onAuthStateChanged,signInWithEmailAndPassword,signOut} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import {getFirestore,collection,doc,getDoc,getDocs,query,limit,orderBy,addDoc,setDoc,serverTimestamp,onSnapshot} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";
import {getStorage,ref,uploadBytes,getBlob} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-storage.js";

const $=id=>document.getElementById(id);
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const money=n=>"฿"+Number(n||0).toLocaleString("th-TH",{minimumFractionDigits:2,maximumFractionDigits:2});
const notify=(s)=>{$("alert").textContent=s||""};
const ready=Boolean(firebaseConfig.apiKey&&firebaseConfig.projectId&&firebaseConfig.authDomain&&firebaseConfig.storageBucket&&firebaseConfig.appId);
$("setup").hidden=ready;$("login").hidden=!ready;
let auth,db,storage,me=null,profile=null,projects=[],jobs=[],documents=[],currentProject=null,currentJob=null,viewerUrl=null,unsubs=[];
const deptLabels={site:"ฝ่ายสถานที่",academic:"ฝ่ายวิชาการ",general:"ฝ่ายบริหารทั่วไป",personnel:"ฝ่ายบุคคล"};
const department=id=>deptLabels[id]||id||"ไม่ระบุ";
const canEdit=d=>profile?.role==="admin"||(profile?.role==="staff"&&profile?.departmentId===d);
const cleanMoney=n=>Number(n)||0;
const validMoney=v=>Number.isFinite(Number(v))&&Number(v)>=0&&String(v).trim()!=="";
const time=t=>t?.toDate?.()?.toLocaleDateString("th-TH")||"—";
const sortNewest=(a,b)=>((b.createdAt?.seconds||0)-(a.createdAt?.seconds||0));
function resetListeners(){unsubs.forEach(fn=>fn());unsubs=[];projects=[];jobs=[];documents=[];currentProject=null;currentJob=null;closeViewer();}
function closeViewer(){if(viewerUrl)URL.revokeObjectURL(viewerUrl);viewerUrl=null;$("pdfView").src="about:blank";$("pdfArea").hidden=true}
function field(label,name,type="text",value="",extra=""){return '<label>'+esc(label)+'<input name="'+esc(name)+'" type="'+type+'" value="'+esc(value)+'" '+extra+' required></label>'}
function editor(title,fields,save){
 $("editorTitle").textContent=title;$("editorFields").innerHTML=fields;
 $("editorForm").onsubmit=async ev=>{ev.preventDefault();const btn=$("editorSave");btn.disabled=true;notify("กำลังบันทึกข้อมูล…");try{const data=Object.fromEntries(new FormData($("editorForm")));await save(data);$("editor").close();notify("บันทึกข้อมูลแล้ว")}catch(e){notify("บันทึกไม่สำเร็จ: "+(e.message||e))}finally{btn.disabled=false}};
 $("editor").showModal();
}
$("cancelEditor").onclick=()=>$("editor").close();
function refresh(){
$("countProjects").textContent=projects.length;$("countJobs").textContent=jobs.length;
$("amountApproved").textContent=money(jobs.filter(j=>["approved","received","paid"].includes(j.status)).reduce((s,j)=>s+cleanMoney(j.approved),0));
$("countDocuments").textContent=documents.filter(d=>d.status==="ready").length;
const selectedYear=$("yearFilter").value;
const ys=[...new Set(projects.map(p=>String(p.fiscalYear)))].sort((a,b)=>b.localeCompare(a));
$("yearFilter").innerHTML='<option value="">ทุกปีงบประมาณ</option>'+ys.map(y=>'<option value="'+esc(y)+'">'+esc(y)+'</option>').join("");
$("yearFilter").value=ys.includes(selectedYear)?selectedYear:"";
const term=$("search").value.trim().toLowerCase();
const subset=projects.filter(p=>(!$("yearFilter").value||String(p.fiscalYear)===$("yearFilter").value)&&(!term||(p.name+" "+department(p.departmentId)).toLowerCase().includes(term)));
$("projectList").innerHTML=subset.map(p=>'<button class="project-item '+(currentProject===p.id?"chosen":"")+'" data-p="'+esc(p.id)+'"><b>'+esc(p.name)+'</b><small>'+esc(department(p.departmentId))+' · ปีงบประมาณ '+esc(p.fiscalYear)+'</small></button>').join("")||'<div class="empty-list">ไม่พบโครงการในฐานข้อมูล</div>';
$("projectList").querySelectorAll("[data-p]").forEach(b=>b.onclick=()=>selectProject(b.dataset.p));
if(currentProject)renderProject();
}
function selectProject(id){currentProject=id;currentJob=null;closeViewer();$("empty").hidden=true;$("projectDetail").hidden=false;$("jobDetail").hidden=true;refresh()}
function renderProject(){
const p=projects.find(x=>x.id===currentProject);if(!p){currentProject=null;$("projectDetail").hidden=true;$("empty").hidden=false;return}
$("projectName").textContent=p.name;$("projectMeta").textContent=department(p.departmentId)+" · ปีงบประมาณ "+p.fiscalYear;
$("projectBudget").textContent=p.budget===null||p.budget===undefined?"ยังไม่ระบุ":money(p.budget);
const ownJobs=jobs.filter(j=>j.projectId===p.id).sort(sortNewest);
$("projectJobCount").textContent=ownJobs.length+" รายการ";$("projectJobTotal").textContent=money(ownJobs.filter(j=>["approved","received","paid"].includes(j.status)).reduce((s,j)=>s+cleanMoney(j.approved),0));
$("projectPermission").textContent=canEdit(p.departmentId)?"เพิ่มเอกสารได้":"ดูเอกสารได้";$("projectPermission").className="pill"+(canEdit(p.departmentId)?"":" readonly");
$("addJob").hidden=!canEdit(p.departmentId);
$("jobList").innerHTML=ownJobs.map(j=>'<div class="job-row '+(currentJob===j.id?"selected":"")+'"><div><b>'+esc(j.title)+'</b><small>'+esc(j.status||"draft")+' · วงเงิน '+money(j.budget)+'</small></div><button class="button subtle small" data-j="'+esc(j.id)+'">เปิดแฟ้ม</button></div>').join("")||'<div class="empty-list">ยังไม่มีงานจัดซื้อในโครงการนี้</div>';
$("jobList").querySelectorAll("[data-j]").forEach(b=>b.onclick=()=>selectJob(b.dataset.j));
if(currentJob)renderJob();
}
function selectJob(id){currentJob=id;closeViewer();$("jobDetail").hidden=false;renderProject();$("jobDetail").scrollIntoView({behavior:"smooth",block:"start"})}
function renderJob(){
const j=jobs.find(x=>x.id===currentJob);if(!j){currentJob=null;$("jobDetail").hidden=true;return}
$("jobTitle").textContent=j.title;$("jobMeta").textContent="สถานะ: "+(j.status||"draft")+" · บันทึกเมื่อ "+time(j.createdAt);
$("uploadFile").hidden=!canEdit(j.departmentId);
$("jobFacts").innerHTML=[["วงเงิน",money(j.budget)],["ราคากลาง",j.referencePrice==null?"—":money(j.referencePrice)],["ยอดอนุมัติ",money(j.approved)]].map(([k,v])=>'<div><small>'+esc(k)+'</small><b>'+esc(v)+'</b></div>').join("");
const files=documents.filter(d=>d.jobId===j.id&&d.status==="ready").sort(sortNewest);
$("fileCount").textContent=files.length+" ไฟล์";
$("documentList").innerHTML=files.map(d=>'<div class="doc-row"><div><b>'+esc(d.title||d.filename)+'</b><small>'+esc(d.filename)+" · เพิ่มเมื่อ "+esc(time(d.createdAt))+'</small></div><button class="button subtle small" data-d="'+esc(d.id)+'">ดู PDF</button></div>').join("")||'<div class="empty-list">ยังไม่มีไฟล์ PDF ในแฟ้มนี้</div>';
$("documentList").querySelectorAll("[data-d]").forEach(b=>b.onclick=()=>openPDF(b.dataset.d));
}
async function openPDF(id){
const d=documents.find(x=>x.id===id);if(!d)return;notify("กำลังโหลด PDF จากพื้นที่เก็บเอกสาร...");
try{const blob=await getBlob(ref(storage,d.storagePath));if(blob.type!=="application/pdf"&&!d.filename.toLowerCase().endsWith(".pdf"))throw Error("ไฟล์ไม่ใช่ PDF");closeViewer();viewerUrl=URL.createObjectURL(blob);$("pdfView").src=viewerUrl+"#page=1&view=FitH";$("pdfTitle").textContent=d.title||d.filename;$("pdfArea").hidden=false;$("pdfDownload").onclick=()=>{const a=document.createElement("a");a.href=viewerUrl;a.download=d.filename||"document.pdf";a.click()};notify("");$("pdfArea").scrollIntoView({behavior:"smooth",block:"start"})}catch(e){notify("เปิด PDF ไม่สำเร็จ: "+(e.message||e)+". อาจต้องตั้งค่า CORS ของ Cloud Storage ตามคู่มือ")}}
$("pdfClose").onclick=closeViewer;
$("search").oninput=refresh;$("yearFilter").onchange=refresh;
$("addProject").onclick=()=>{
if(!profile)return;
const allowed=profile.role==="admin"?Object.keys(deptLabels):[profile.departmentId];
const opts=allowed.map(d=>'<option value="'+esc(d)+'">'+esc(department(d))+'</option>').join("");
editor("สร้างโครงการ",field("ชื่อโครงการ","name")+field("ปีงบประมาณ พ.ศ.","fiscalYear","number","2569",'min="2500" max="2700"')+'<label>ฝ่ายเจ้าของโครงการ<select name="departmentId">'+opts+'</select></label>'+field("งบจัดสรรโครงการ (บาท)","budget","number","0",'min="0" step="0.01"'),async d=>{if(!d.name.trim()||!validMoney(d.budget)||Number(d.fiscalYear)<2500||Number(d.fiscalYear)>2700||!allowed.includes(d.departmentId))throw Error("ข้อมูลโครงการไม่ถูกต้อง");await addDoc(collection(db,"procurement_projects"),{name:d.name.trim(),fiscalYear:Number(d.fiscalYear),departmentId:d.departmentId,budget:Number(d.budget),createdBy:me.uid,createdAt:serverTimestamp()})});
};
$("addJob").onclick=()=>{
const p=projects.find(x=>x.id===currentProject);if(!p||!canEdit(p.departmentId))return;
editor("เพิ่มงานจัดซื้อ/จัดจ้าง",field("ชื่อเรื่องจัดซื้อ","title")+field("วงเงินงาน (บาท)","budget","number","0",'min="0" step="0.01"')+field("ราคากลาง (บาท)","referencePrice","number","0",'min="0" step="0.01"')+field("ยอดอนุมัติ (บาท)","approved","number","0",'min="0" step="0.01"'),async d=>{if(!d.title.trim()||![d.budget,d.referencePrice,d.approved].every(validMoney))throw Error("ข้อมูลไม่ครบหรือวงเงินไม่ถูกต้อง");await addDoc(collection(db,"procurement_jobs"),{projectId:p.id,departmentId:p.departmentId,title:d.title.trim(),budget:Number(d.budget),referencePrice:Number(d.referencePrice),approved:Number(d.approved),status:"draft",createdBy:me.uid,createdAt:serverTimestamp()})});
};
$("uploadFile").onclick=()=>{$("filePicker").click()};
$("filePicker").onchange=async ()=>{
const file=$("filePicker").files?.[0];$("filePicker").value="";if(!file)return;const j=jobs.find(x=>x.id===currentJob);
if(!j||!canEdit(j.departmentId))return;
if(file.type!=="application/pdf"&&!file.name.toLowerCase().endsWith(".pdf"))return notify("รับเฉพาะไฟล์ PDF");
if(file.size>25*1024*1024)return notify("ขนาดไฟล์ต้องไม่เกิน 25 MB");
const title=window.prompt("ชื่อเอกสารที่จะปรากฏในแฟ้ม",file.name.replace(/\.pdf$/i,""));if(title===null)return;
notify("กำลังอัปโหลดไฟล์เอกสารจริง...");
try{
const docRef=doc(collection(db,"procurement_documents"));const path="procurement/projects/"+j.projectId+"/files/"+docRef.id;
await setDoc(docRef,{jobId:j.id,projectId:j.projectId,departmentId:j.departmentId,title:title.trim()||file.name,filename:file.name,storagePath:path,status:"uploading",createdBy:me.uid,createdAt:serverTimestamp()});
await uploadBytes(ref(storage,path),file,{contentType:"application/pdf"});
await setDoc(docRef,{status:"ready"},{merge:true});notify("อัปโหลด PDF สำเร็จแล้ว");
}catch(e){notify("อัปโหลดไม่สำเร็จ: "+(e.message||e)+". หากอัปโหลดค้าง โปรดแจ้งผู้ดูแลเพื่อตรวจรายการไฟล์")} };
$("loginForm").onsubmit=async e=>{e.preventDefault();notify("กำลังเข้าสู่ระบบ...");try{await signInWithEmailAndPassword(auth,$("email").value.trim(),$("password").value);$("password").value="";notify("")}catch(x){notify("เข้าสู่ระบบไม่สำเร็จ: โปรดตรวจบัญชีและรหัสผ่าน")}};
$("signout").onclick=()=>signOut(auth);

const diagnosticCollections=[
["procurement_projects","โครงการ"],
["procurement_jobs","งานจัดซื้อ"],
["procurement_documents","แฟ้ม PDF"]
];
function diagRow(ok,label,details){
return '<div class="diagnostic-row"><span class="'+(ok?"diagnostic-ok":"diagnostic-fail")+'">'+(ok?"✓":"!")+'</span><div><b>'+esc(label)+'</b><small>'+esc(details)+'</small></div></div>';
}
async function checkDatabaseAccess(){
const btn=$("checkDatabase"),out=$("connectionResults");btn.disabled=true;out.textContent="กำลังตรวจสอบสิทธิ์จาก Firebase…";
let results=[];
try{
if(!auth.currentUser){out.innerHTML=diagRow(false,"Authentication","ยังไม่ได้ Login");return}
const active=auth.currentUser;
results.push(diagRow(true,"Authentication","เข้าสู่ระบบแล้ว: "+(active.email||"บัญชีผู้ใช้")));
let userDoc=null;
try{
 userDoc=await getDoc(doc(db,"procurement_users",active.uid));
 if(!userDoc.exists()){results.push(diagRow(false,"ข้อมูลสิทธิ์ Admin","ไม่พบ Document ที่มี ID ตรงกับ UID ของบัญชีที่ Login"));out.innerHTML=results.join("");return}
 const u=userDoc.data();
 if(!["admin","staff"].includes(u.role)||!u.departmentId){results.push(diagRow(false,"ข้อมูลสิทธิ์ Admin","ฟิลด์ role หรือ departmentId ไม่ถูกต้อง"));out.innerHTML=results.join("");return}
 results.push(diagRow(true,"ข้อมูลสิทธิ์ผู้ใช้",u.role+" • "+department(u.departmentId)));
}catch(e){
 results.push(diagRow(false,"อ่าน procurement_users ไม่สำเร็จ",e.code==="permission-denied"?"Rules ยังไม่อนุญาตให้อ่านข้อมูลสิทธิ์ของบัญชีนี้":(e.code||e.message)));
 out.innerHTML=results.join("");return;
}
for(const [name,label] of diagnosticCollections){
 try{
 const snap=await getDocs(query(collection(db,name),limit(1)));
 results.push(diagRow(true,label,"อ่าน Collection "+name+" ได้ • พบเอกสารในการทดสอบ "+snap.size+" รายการ (ตรวจสูงสุด 1 รายการ)"));
 }catch(e){
 results.push(diagRow(false,label,e.code==="permission-denied"?"Firestore Rules ปฏิเสธการอ่าน Collection "+name:(e.code||e.message)));
 }
}
out.innerHTML=results.join("");
}catch(e){out.innerHTML=results.join("")+diagRow(false,"เกิดข้อผิดพลาด",e.code||e.message||String(e))}
finally{btn.disabled=false}
}
$("checkDatabase").onclick=checkDatabaseAccess;

if(ready){
try{
const app=initializeApp(firebaseConfig);auth=getAuth(app);db=getFirestore(app);storage=getStorage(app);
onAuthStateChanged(auth,async user=>{
resetListeners();me=user;profile=null;$("signout").hidden=!user;$("identity").textContent=user?.email||"ยังไม่ได้เข้าสู่ระบบ";$("login").hidden=!!user;$("workspace").hidden=true;$("healthcheck").hidden=!user;
if(!user){notify("");return}
notify("กำลังตรวจสอบสิทธิ์และโหลดข้อมูล...");
try{const userDoc=await getDoc(doc(db,"procurement_users",user.uid));if(!userDoc.exists())throw Error("ยังไม่ได้กำหนดสิทธิ์ผู้ใช้ โปรดให้ Admin เพิ่มข้อมูล procurement_users/"+user.uid);
profile=userDoc.data();if(!["admin","staff"].includes(profile.role)||!profile.departmentId)throw Error("สิทธิ์ผู้ใช้ไม่สมบูรณ์");$("workspace").hidden=false;notify("");
for(const key of ["procurement_projects","procurement_jobs","procurement_documents"]){
const off=onSnapshot(collection(db,key),snapshot=>{const items=snapshot.docs.map(d=>({id:d.id,...d.data()}));if(key==="procurement_projects")projects=items;if(key==="procurement_jobs")jobs=items;if(key==="procurement_documents")documents=items;refresh()},err=>notify("อ่านข้อมูล "+key+" ไม่สำเร็จ: "+(err.message||err)));unsubs.push(off)}
}catch(err){notify(err.message||String(err))}
})}catch(e){$("setup").hidden=false;$("login").hidden=true;notify("เชื่อม Firebase ไม่สำเร็จ: "+(e.message||e))}
}
