import {DEPARTMENTS,PROJECTS,PROJECT_OWNERS} from "./dashboard-data-2570.js";
import {firebaseConfig} from "./firebase-config.js";
import {initializeApp} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import {getAuth,onAuthStateChanged,signInWithEmailAndPassword,signOut} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import {getFirestore,collection,doc,getDocs,addDoc,updateDoc,serverTimestamp} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";
const $=x=>document.getElementById(x);
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const money=n=>"฿"+Number(n||0).toLocaleString("th-TH",{minimumFractionDigits:2,maximumFractionDigits:2});
const app=initializeApp(firebaseConfig,"school-procurement-req-2570");
const db=getFirestore(app),auth=getAuth(app),COL="procurement_v2_requests",PCOL="procurement_v2_projects";
let user=null,rows=[],projects=PROJECTS.slice(),selected=null,draftNew=false,dirty=false,loaded=false;
const fields=["projectId","activityId","title","requestedDate","requestedAmount","procurementType","procurementMethod","purpose","vendor","deliveryDate","deliveryDays","notes","status","preparedBy"];
const SCHOOL_DEFAULTS={schoolName:"โรงเรียนค่ายบางระจันวิทยาคม",agency:"สำนักงานเขตพื้นที่การศึกษามัธยมศึกษาสิงห์บุรี อ่างทอง",directorName:"นายเรวัฒน์ พรหมสะโร",directorPosition:"ผู้อำนวยการโรงเรียนค่ายบางระจันวิทยาคม",budgetYear:"2570"};
const SAVED_DEFAULTS_KEY="school-procurement-school-settings-2570";
const OWNER_CACHE_KEY="school-procurement-owner-by-project-2570";
function ownerCache(){try{return JSON.parse(localStorage.getItem(OWNER_CACHE_KEY)||"{}")}catch(e){return {}}}
function defaults(){try{return {...SCHOOL_DEFAULTS,...JSON.parse(localStorage.getItem(SAVED_DEFAULTS_KEY)||"{}")}}catch(e){return {...SCHOOL_DEFAULTS}}}
const EXTRA_IDS=()=>[...document.querySelectorAll("[data-extra]")].map(x=>x.dataset.extra);
function populateExtras(details={}){
 const values={...defaults(),projectOwner:ownerCache()[String($("projectId").value)]||PROJECT_OWNERS[String($("projectId").value)]||"",...details};
 for(const input of document.querySelectorAll("[data-extra]"))input.value=values[input.dataset.extra]??"";
}
function gatherExtras(){return Object.fromEntries([...document.querySelectorAll("[data-extra]")].map(x=>[x.dataset.extra,x.value.trim()]))}
function persistDefaults(details){
 if(details.projectOwner){const cache=ownerCache();cache[String($("projectId").value)]=details.projectOwner;try{localStorage.setItem(OWNER_CACHE_KEY,JSON.stringify(cache))}catch(e){}}const keys=["schoolName","agency","directorName","directorPosition"];const values=Object.fromEntries(keys.map(x=>[x,details[x]||""]));try{localStorage.setItem(SAVED_DEFAULTS_KEY,JSON.stringify(values))}catch(e){}}
const LOCAL_KEY="school-procurement-local-drafts-2570-v1";
let cloudRows=[];
function readLocal(){
 try{const arr=JSON.parse(localStorage.getItem(LOCAL_KEY)||"[]");return Array.isArray(arr)?arr.filter(x=>x&&typeof x==="object"&&String(x.docId||"").startsWith("local-")):[]}catch(e){return []}
}
let localRows=readLocal();
function combineRows(){
 const map=new Map();
 for(const r of cloudRows)map.set(r.docId,r);
 for(const r of localRows)map.set(r.docId,r);
 rows=[...map.values()];
}
function storeLocal(){
 localStorage.setItem(LOCAL_KEY,JSON.stringify(localRows));
 combineRows();renderList();
}
function saveLocalDraft(data){
 const old=selected&&String(selected).startsWith("local-")?localRows.find(x=>x.docId===selected):null;
 if(old&&old.status!=="draft")throw Error("แฟ้มที่ปิดสถานะร่างแล้วไม่อนุญาตแก้ไข");
 const id=old?.docId||"local-"+Date.now()+"-"+Math.random().toString(36).slice(2,8);
 const next={...(old||{}),...data,docId:id,localOnly:true,localUpdatedAt:new Date().toISOString()};
 const at=localRows.findIndex(x=>x.docId===id);
 if(at<0)localRows.unshift(next);else localRows[at]=next;
 storeLocal();selected=id;draftNew=false;dirty=false;persistDefaults(data.details);fillForm(next);renderList();
 notify("บันทึกแฟ้มร่างไว้บนเบราว์เซอร์เครื่องนี้แล้ว • ยังไม่ได้ขึ้น Firebase • หากล้างข้อมูลเว็บไซต์ แฟ้มในเครื่องอาจหาย");
 $("saveMessage").textContent="บันทึกในเครื่องแล้ว";
}
const EMPTY={projectId:"",activityId:"",title:"",requestedDate:"",requestedAmount:"",procurementType:"purchase",procurementMethod:"เฉพาะเจาะจง",purpose:"",vendor:"",deliveryDate:"",deliveryDays:"",notes:"",status:"draft",preparedBy:"",items:[]};
const notify=(message,warn=false)=>{$("notice").textContent=message;$("notice").classList.toggle("warn",warn)};
const findProject=id=>projects.find(p=>String(p.id)===String(id));
const ownAccount=()=>Boolean(user);
function syncProjectActivity(selectedActivity=""){
 const sel=$("activityId"),p=findProject($("projectId").value);
 sel.innerHTML='<option value="">ไม่ระบุ / ไม่มีรายการย่อยในแผน</option>'+(p?.activities||[]).map(a=>'<option value="'+esc(a.id)+'">'+esc(a.name)+'</option>').join("");
 if(selectedActivity&&[...sel.options].some(x=>x.value===selectedActivity))sel.value=selectedActivity;
}
function freshItem(n=1){return {description:"",qty:1,unit:"",referencePrice:0,unitPrice:0}}
function itemRow(item,i){
 const tr=document.createElement("tr");
 tr.innerHTML='<td>'+(i+1)+'</td>'+
 '<td><input data-item="description" maxlength="300" value="'+esc(item.description||"")+'" aria-label="ชื่อรายการ '+(i+1)+'"></td>'+
 '<td><input data-item="qty" type="number" min="0.01" step="any" value="'+esc(item.qty??1)+'" aria-label="จำนวน"></td>'+
 '<td><input data-item="unit" maxlength="40" value="'+esc(item.unit||"")+'" aria-label="หน่วย"></td>'+
 '<td><input data-item="referencePrice" type="number" min="0" step="0.01" value="'+esc(item.referencePrice??0)+'" aria-label="ราคาอ้างอิง"></td>'+ 
 '<td><input data-item="unitPrice" type="number" min="0" step="0.01" value="'+esc(item.unitPrice??0)+'" aria-label="ราคาที่จะซื้อหน่วยละ"></td>'+
 '<td><input data-item="lineTotal" readonly tabindex="-1" value="'+esc(((Number(item.qty)||0)*(Number(item.unitPrice)||0)).toFixed(2))+'" aria-label="รวมรายการ"></td>'+
 '<td><button class="itemRemove" type="button" aria-label="ลบรายการ">×</button></td>';
 tr.querySelector(".itemRemove").onclick=()=>{tr.remove();renumber();calculate();setDirty()};
 for(const input of tr.querySelectorAll("input:not([readonly])"))input.oninput=()=>{calculate();setDirty()};
 return tr
}
function itemsFromForm(){return [...$("items").querySelectorAll("tr")].map(tr=>Object.fromEntries([...tr.querySelectorAll("[data-item]:not([readonly])")].map(x=>[x.dataset.item,x.value]))).map(x=>({description:x.description.trim(),qty:Number(x.qty),unit:x.unit.trim(),referencePrice:Number(x.referencePrice||0),unitPrice:Number(x.unitPrice)}))}
function renumber(){[...$("items").children].forEach((tr,i)=>tr.firstElementChild.textContent=i+1)}
function calculate(){
 const arr=itemsFromForm(),total=arr.reduce((n,x)=>n+(x.qty||0)*(x.unitPrice||0),0);
 for(const tr of $("items").children){const qty=Number(tr.querySelector('[data-item="qty"]').value),price=Number(tr.querySelector('[data-item="unitPrice"]').value);tr.querySelector('[data-item="lineTotal"]').value=(qty*price).toFixed(2)}
 $("itemTotal").textContent=money(total);
 const budget=Number($("requestedAmount").value||0),diff=Math.abs(total-budget);
 $("totalHint").textContent=arr.length?(diff>.009?"ยอดรายการ "+money(total)+" ไม่ตรงวงเงินที่ขอซื้อ "+money(budget)+" — ตรวจสอบก่อนบันทึก":"ยอดรายการตรงกับวงเงินที่ขอซื้อ"):"ยังไม่ได้เพิ่มรายการพัสดุ";
 $("totalHint").classList.toggle("bad",arr.length>0&&diff>.009);
 return total
}
function setDirty(){dirty=true;$("saveMessage").textContent="มีข้อมูลที่ยังไม่ได้บันทึก"}
function fillForm(obj){
 $("form").hidden=false;$("empty").hidden=true;
 const p=findProject(obj.projectId),opts=projects.filter(x=>x.department===(p?.department||$("deptFilter").value||"academic"));
 $("projectId").innerHTML=projects.map(x=>'<option value="'+esc(x.id)+'">'+esc((DEPARTMENTS.find(d=>d.id===x.department)?.short||"")+" · "+x.name)+'</option>').join("");
 $("projectId").value=String(obj.projectId||opts[0]?.id||projects[0]?.id);
 syncProjectActivity(obj.activityId||"");
 for(const key of fields){if(key==="projectId"||key==="activityId")continue;const control=$("form").elements.namedItem(key);if(control)control.value=obj[key]??""}
 $("items").innerHTML="";
 for(const [i,item] of (obj.items||[]).entries())$("items").appendChild(itemRow(item,i));
 renumber();calculate();populateExtras(obj.details||{});dirty=false;
 $("formTitle").textContent=draftNew?"สร้างแฟ้มชุดเบิกใหม่":obj.title||"แฟ้มชุดเบิก";
 $("formMeta").textContent=draftNew?"ยังไม่ถูกบันทึก":(obj.localOnly?"บันทึกในเครื่อง · ยังไม่ขึ้น Firebase": "Firebase")+" · เลขอ้างอิง: "+(obj.docId||"—")+" · "+(obj.requestedDate||"—");
 $("state").textContent=obj.localOnly?"ร่างในเครื่อง":obj.status==="prepared"?"ข้อมูลพร้อมตรวจ":"ร่าง";
 $("saveMessage").textContent=draftNew?"กรอกข้อมูลและกดบันทึก":"โหลดรายการนี้แล้ว";
 $("printBtn").disabled=false;$("wordBtn").disabled=false;$("saveBtn").disabled=false;
 const locked=!draftNew&&obj.status!=="draft";
 for(const el of $("form").querySelectorAll("input,select,textarea,button"))el.disabled=locked;
 $("saveBtn").disabled=locked;
 // An existing prepared record is deliberately read-only until workflow amendment is implemented.
 if(locked&&ownAccount())$("saveMessage").textContent="แฟ้มสถานะเตรียมข้อมูลครบ — เปิดอ่านและพิมพ์ได้ แต่ไม่อนุญาตแก้ย้อนหลัง";
}
function newFile(pid){
 if(dirty&&!confirm("มีการแก้ไขที่ยังไม่บันทึก ต้องการเริ่มแฟ้มใหม่หรือไม่?"))return;
 selected=null;draftNew=true;
 const p=findProject(pid)||projects.find(p=>p.department===$("deptFilter").value)||projects[0];
 fillForm({...EMPTY,projectId:p?.id||"",requestedDate:new Date().toISOString().slice(0,10)});
 setDirty();
}
function choose(r){
 if(dirty&&!confirm("ข้อมูลที่แก้ไขยังไม่บันทึก ต้องการเปิดแฟ้มอื่นหรือไม่?"))return;
 draftNew=false;selected=r.docId;fillForm(r);renderList();
}
function renderList(){
 $("syncLocalBtn").textContent="☁ นำแฟ้มในเครื่องขึ้น Firebase ("+localRows.length+")";
 $("saveBtn").textContent=(!user||String(selected||"").startsWith("local-"))?"บันทึกในเครื่อง":"บันทึก Firebase";
 const dept=$("deptFilter").value,term=$("filter").value.trim().toLocaleLowerCase();
 const list=rows.filter(r=>(!dept||r.department===dept)&&(!term||(r.title+" "+(r.vendor||"")).toLocaleLowerCase().includes(term)));
 $("count").textContent=list.length+" แฟ้ม (ในเครื่อง "+localRows.length+" / Firebase "+cloudRows.length+")";
 $("reqList").innerHTML=list.length?list.sort((a,b)=>String(b.requestedDate||"").localeCompare(String(a.requestedDate||""))).map(r=>{
 const p=findProject(r.projectId);
 return '<button class="req '+(selected===r.docId?"active":"")+'" data-id="'+esc(r.docId)+'"><strong>'+esc(r.title||"ไม่มีชื่อ")+'</strong><small>'+esc(p?.name||"โครงการไม่พบในแผน")+'</small><span><b>'+money(r.requestedAmount)+'</b><small>'+(r.status==="prepared"?"พร้อมตรวจ":"ร่าง")+' · '+esc(r.requestedDate||"")+'</small></span></button>'
 }).join(""):'<div class="blank">ไม่มีแฟ้มชุดเบิกในรายการที่แสดง</div>';
 $("reqList").querySelectorAll("[data-id]").forEach(el=>el.onclick=()=>{const r=rows.find(x=>x.docId===el.dataset.id);if(r)choose(r)});
}
function readForm(){
 const f=new FormData($("form")),obj=Object.fromEntries(f.entries()),p=findProject(obj.projectId);
 if(!p)throw Error("ยังไม่ได้เลือกโครงการ");
 const items=itemsFromForm(),withValue=items.filter(x=>x.description||x.unit||x.unitPrice);
 if(items.some(x=>(x.description||x.qty>0||x.unitPrice>0)&&(!x.description||!(x.qty>0)||!Number.isFinite(x.unitPrice)||x.unitPrice<0)))throw Error("กรุณากรอกรายการพัสดุ จำนวน และราคาให้ครบ");
 const amount=Number(obj.requestedAmount);
 if(!(amount>0))throw Error("วงเงินขอซื้อต้องมากกว่า 0");
 if(withValue.length>80)throw Error("รายการพัสดุต้องไม่เกิน 80 รายการ");
 if(withValue.length&&Math.abs(withValue.reduce((n,x)=>n+x.qty*x.unitPrice,0)-amount)>.01)throw Error("ยอดรวมรายการพัสดุไม่ตรงกับวงเงินที่ขอซื้อ");
 if(obj.status==="prepared"&&!withValue.length)throw Error("ต้องมีรายการพัสดุอย่างน้อยหนึ่งรายการก่อนระบุพร้อมตรวจ");
 if(obj.status==="prepared"&&!obj.vendor.trim())throw Error("สถานะพร้อมตรวจต้องมีชื่อผู้ขาย/ผู้รับจ้าง");
 if(!obj.title.trim())throw Error("กรุณาระบุชื่องานจัดซื้อ");
 if(obj.activityId&&!(p.activities||[]).some(a=>String(a.id)===obj.activityId))throw Error("กิจกรรมไม่ตรงกับโครงการที่เลือก");
 return {fiscalYear:"2570",department:p.department,projectId:Number(p.id),activityId:obj.activityId||null,title:obj.title.trim(),requestedAmount:amount,requestedDate:obj.requestedDate,status:obj.status==="prepared"?"prepared":"draft",procurementType:obj.procurementType,procurementMethod:obj.procurementMethod,purpose:obj.purpose.trim(),vendor:obj.vendor.trim(),deliveryDate:obj.deliveryDate,deliveryDays:obj.deliveryDays?Number(obj.deliveryDays):null,notes:obj.notes.trim(),preparedBy:obj.preparedBy.trim(),items:withValue,details:gatherExtras()}
}
async function save(){
 if(!$("form").reportValidity())return;
 let data;try{data=readForm()}catch(e){notify(e.message,true);return}
 const localSelected=String(selected||"").startsWith("local-");
 // Explicit local save works without sign-in; never claim cloud persistence.
 if(!user||localSelected){
  try{saveLocalDraft(data)}catch(e){notify("บันทึกในเครื่องไม่สำเร็จ: "+e.message,true)}
  return;
 }
 const btn=$("saveBtn");btn.disabled=true;$("saveMessage").textContent="กำลังบันทึก Firebase...";
 try{
  if(draftNew){
   const ref=await addDoc(collection(db,COL),{...data,createdBy:user.uid,createdAt:serverTimestamp(),updatedAt:serverTimestamp()});
   selected=ref.id;draftNew=false;
  }else{
   const original=cloudRows.find(r=>r.docId===selected);
   if(!original)throw Error("หาแฟ้ม Firebase เดิมไม่พบ");
   if(original.status!=="draft")throw Error("แฟ้มที่ปิดสถานะร่างแล้วแก้ไขไม่ได้");
   if(original.department!==data.department)throw Error("ย้ายแฟ้มข้ามฝ่ายไม่ได้ กรุณาสร้างแฟ้มใหม่");
   await updateDoc(doc(db,COL,selected),{...data,updatedAt:serverTimestamp()});
  }
  persistDefaults(data.details);dirty=false;await reload(false);
  const current=rows.find(r=>r.docId===selected);if(current)fillForm(current);
  notify("บันทึกแฟ้มลง Firebase สำเร็จ");
  $("saveMessage").textContent="บันทึก Firebase เรียบร้อย";
 }catch(err){
  // Do not discard entered values when cloud write is denied.
  try{
   draftNew=true;selected=null;saveLocalDraft(data);
   notify("Firebase ยังบันทึกไม่ได้ ("+(err.code||err.message)+") • เก็บสำเนาแฟ้มร่างไว้ในเครื่องแล้ว",true);
  }catch(localError){notify("Firebase และการบันทึกในเครื่องไม่สำเร็จ: "+localError.message,true)}
 }finally{btn.disabled=false}
}
async function syncLocal(){
 if(!user){notify("เข้าสู่ระบบก่อนนำแฟ้มในเครื่องขึ้น Firebase",true);$("loginDialog").showModal();return}
 if(dirty){notify("กรุณากดบันทึกแฟ้มปัจจุบันในเครื่องก่อนซิงก์",true);return}
 if(!localRows.length){notify("ไม่มีแฟ้มในเครื่องที่ต้องนำขึ้น Firebase");return}
 if(!confirm("นำแฟ้มในเครื่อง "+localRows.length+" รายการขึ้น Firebase? จะลบเฉพาะสำเนาที่อัปโหลดสำเร็จ"))return;
 $("syncLocalBtn").disabled=true;let success=0;const failures=[];
 for(const local of [...localRows]){
  try{
   const {docId,localOnly,localUpdatedAt,createdAt,updatedAt,createdBy,...data}=local;
   if(data.status==="prepared")data.status="draft"; // state review must be performed in cloud
   const ref=await addDoc(collection(db,COL),{...data,createdBy:user.uid,createdAt:serverTimestamp(),updatedAt:serverTimestamp()});
   localRows=localRows.filter(r=>r.docId!==local.docId);storeLocal();
   if(selected===local.docId){selected=ref.id;draftNew=false}
   success++;
  }catch(e){failures.push(e.code||e.message)}
 }
 await reload(false);
 $("syncLocalBtn").disabled=false;
 notify(success+" แฟ้มขึ้น Firebase สำเร็จ"+(failures.length?" • อีก "+failures.length+" แฟ้มยังอยู่ในเครื่อง: "+failures[0]:""),Boolean(failures.length));
}
async function reload(showMessage=true){
 if(!user){loaded=false;cloudRows=[];combineRows();renderList();return}
 // Read collections independently: a denied or slow request must not clear the
 // 40 source-listed projects and 94 activities bundled with this application.
 const bounded=(promise,label)=>Promise.race([promise,new Promise((_,reject)=>setTimeout(()=>reject(new Error(label+" ใช้เวลานานเกิน 12 วินาที")),12000))]);
 const [reqResult,projectResult]=await Promise.allSettled([
  bounded(getDocs(collection(db,COL)),"แฟ้มชุดเบิก"),
  bounded(getDocs(collection(db,PCOL)),"โครงการ Firebase")
 ]);
 if(projectResult.status==="fulfilled"){
  const cloud=projectResult.value.docs.map(r=>r.data()).filter(x=>x.fiscalYear==="2570");
  const merged=new Map(PROJECTS.map(x=>[String(x.id),x]));
  cloud.forEach(x=>merged.set(String(x.id),x));
  projects=[...merged.values()].sort((a,b)=>Number(a.id)-Number(b.id));
 }
 if(reqResult.status==="fulfilled"){
  cloudRows=reqResult.value.docs.map(r=>({...r.data(),docId:r.id})).filter(x=>x.fiscalYear==="2570");
  loaded=true;
 }else{loaded=false;cloudRows=[]}
 combineRows();renderList();
 if(reqResult.status==="rejected"){
  notify("รายชื่อ 40 โครงการและกิจกรรมพร้อมเลือก แต่ยังอ่านแฟ้มชุดเบิกจาก Firebase ไม่สำเร็จ: "+reqResult.reason.message,true);
 }else if(showMessage){
  notify("โครงการ "+projects.length+" โครงการ พร้อมใช้งาน • โหลดแฟ้มชุดเบิกจาก Firebase "+rows.length+" รายการ"+
   (projectResult.status==="rejected"?" • ใช้รายชื่อโครงการจากแผนต้นฉบับเพราะ Firebase ส่วนโครงการอ่านไม่ได้":""));
 }
 const qid=new URLSearchParams(location.search).get("id"),found=rows.find(x=>x.docId===(selected||qid));
 if(found&&!dirty&&!draftNew){selected=found.docId;fillForm(found);renderList()}
 else if(draftNew&&!dirty){
  // Refresh project choices without changing unsaved input.
  const current=$("projectId").value,activity=$("activityId").value;
  $("projectId").innerHTML=projects.map(x=>'<option value="'+esc(x.id)+'">'+esc((DEPARTMENTS.find(d=>d.id===x.department)?.short||"")+" · "+x.name)+'</option>').join("");
  $("projectId").value=current;syncProjectActivity(activity)
 }
}
async function wordTemplateStore(file){
 const bytes=await file.arrayBuffer();
 const db=await new Promise((resolve,reject)=>{
  const open=indexedDB.open("school-procurement-word-template-v1",1);
  open.onupgradeneeded=()=>{if(!open.result.objectStoreNames.contains("files"))open.result.createObjectStore("files")};
  open.onsuccess=()=>resolve(open.result);
  open.onerror=()=>reject(open.error);
 });
 return new Promise((resolve,reject)=>{
  const tx=db.transaction("files","readwrite"),put=tx.objectStore("files").put({name:file.name,buffer:bytes},"master");
  put.onerror=()=>reject(put.error);tx.oncomplete=()=>{db.close();resolve(true)};tx.onerror=()=>reject(tx.error)
 });
}
async function inspectSavedTemplate(){
 try{
  const db=await new Promise((resolve,reject)=>{
   const open=indexedDB.open("school-procurement-word-template-v1",1);
   open.onupgradeneeded=()=>{if(!open.result.objectStoreNames.contains("files"))open.result.createObjectStore("files")};
   open.onsuccess=()=>resolve(open.result);open.onerror=()=>reject(open.error);
  });
  const r=await new Promise((resolve,reject)=>{const tx=db.transaction("files","readonly"),q=tx.objectStore("files").get("master");q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error);tx.oncomplete=()=>db.close()});
  $("templateStatus").textContent=r?.name?"แม่แบบที่บันทึกไว้: "+r.name:"ยังไม่ได้ติดตั้งแม่แบบในเบราว์เซอร์นี้";
 }catch(e){$("templateStatus").textContent="อ่านข้อมูลแม่แบบไม่ได้: "+e.message}
}
$("sourceWord").onchange=async e=>{
 const file=e.target.files?.[0];if(!file)return;
 if(!file.name.toLowerCase().endsWith(".docx")){notify("กรุณาใช้ไฟล์ Word .docx เท่านั้น",true);return}
 try{$("templateStatus").textContent="กำลังบันทึกแม่แบบ...";
 await wordTemplateStore(file);
 $("templateStatus").textContent="ตั้งค่าแม่แบบ Word: "+file.name+" สำเร็จ";
 notify("บันทึกไฟล์ต้นฉบับในเบราว์เซอร์นี้แล้ว • ยังต้องตรวจการจับคู่ข้อมูลทุกตำแหน่งใน Word Editor");
 }catch(err){notify("บันทึกแม่แบบไม่ได้: "+err.message,true)}
};
inspectSavedTemplate();
$("deptFilter").innerHTML='<option value="">ทุกฝ่าย</option>'+DEPARTMENTS.map(d=>'<option value="'+esc(d.id)+'">'+esc(d.name)+'</option>').join("");
$("deptFilter").onchange=renderList;$("filter").oninput=renderList;
$("projectId").onchange=()=>{syncProjectActivity();const owner=document.querySelector('[data-extra="projectOwner"]');if(owner)owner.value=ownerCache()[String($("projectId").value)]||PROJECT_OWNERS[String($("projectId").value)]||"";setDirty()};
$("activityId").onchange=setDirty;
$("form").oninput=()=>{setDirty();if(document.activeElement?.name==="requestedAmount")calculate()};
$("addItem").onclick=()=>{const tb=$("items");tb.appendChild(itemRow(freshItem(),tb.children.length));calculate();setDirty()};
$("newBtn").onclick=()=>newFile(new URLSearchParams(location.search).get("projectId"));
$("saveBtn").onclick=save;
$("syncLocalBtn").onclick=syncLocal;
$("printBtn").onclick=()=>{if(dirty&&!confirm("มีข้อมูลยังไม่บันทึก ต้องการพิมพ์ฉบับปัจจุบันหรือไม่?"))return;window.print()};
$("wordBtn").onclick=()=>{
 if(dirty&&!confirm("ข้อมูลยังไม่บันทึกในฐานข้อมูล ต้องการส่งค่าที่แสดงไปทดลองในแม่แบบ Word หรือไม่?"))return;
 const v=Object.fromEntries(new FormData($("form")).entries());
 const p=findProject(v.projectId),a=(p?.activities||[]).find(x=>String(x.id)===String(v.activityId));const dt=gatherExtras();
 try{
  const key="procurement-prototype-word-v1",old=JSON.parse(localStorage.getItem(key)||"{}");
  localStorage.setItem(key,JSON.stringify({...old,division:DEPARTMENTS.find(d=>d.id===p?.department)?.name||"",project:p?.name||"",activity:a?.name||"",subject:v.title||"",requestDate:v.requestedDate||"",budget:(Number(v.requestedAmount)||0).toFixed(2)+" บาท",vendor:v.vendor||"",school:dt.schoolName,agency:dt.agency,director:dt.directorName,directorPosition:dt.directorPosition,torPerson:dt.torAuthor,officer:dt.officerName,headOfficer:dt.headOfficerName,inspector:dt.inspectorName,invoiceNo:dt.invoiceNo}));
 }catch(e){notify("ส่งข้อมูลไป Word ไม่สำเร็จ: "+e.message,true);return}
 window.location.href="./official-word-editor.html";
};
$("loginBtn").onclick=()=>{if(user)signOut(auth);else $("loginDialog").showModal()};
$("loginCancel").onclick=()=>$("loginDialog").close();
$("loginForm").onsubmit=async e=>{e.preventDefault();const v=Object.fromEntries(new FormData(e.target));try{await signInWithEmailAndPassword(auth,v.email,v.password);$("loginDialog").close()}catch(err){notify("เข้าสู่ระบบไม่สำเร็จ: "+err.message,true)}};
// Render the complete FY2570 project/activity list immediately, without waiting for Auth.
combineRows();renderList();
newFile(new URLSearchParams(location.search).get("projectId"));
dirty=false;
$("saveMessage").textContent="บันทึกในเครื่องได้ทันที • เข้าสู่ระบบเพื่อบันทึก Firebase";
notify("พร้อมใช้งาน 40 โครงการ • บันทึกแฟ้มร่างในเครื่องได้แม้ไม่ได้เข้าสู่ระบบ");
onAuthStateChanged(auth,async u=>{
 user=u;
 $("account").textContent=u?u.email:"ยังไม่ได้เข้าสู่ระบบ";
 $("loginBtn").textContent=u?"ออกจากระบบ":"เข้าสู่ระบบ";
 if(u){
  $("saveBtn").disabled=false;
  await reload();
  const qid=new URLSearchParams(location.search).get("id");
  if(qid&&!rows.some(r=>r.docId===qid))notify("กำลังเลือกแฟ้มที่ระบุ แต่ยังไม่พบในรายการที่อ่านได้",true);
 }else{
  cloudRows=[];loaded=false;combineRows();renderList();
  $("saveBtn").disabled=false;
  notify("ข้อมูลโครงการพร้อมใช้งาน • บันทึกในเครื่องได้ทันที • ลงชื่อเข้าใช้เพื่อนำแฟ้มขึ้น Firebase");
 }
});
window.addEventListener("beforeunload",e=>{if(dirty){e.preventDefault();e.returnValue=""}});
