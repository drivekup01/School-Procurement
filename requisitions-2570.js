import {DEPARTMENTS,PROJECTS} from "./dashboard-data-2570.js";
import {firebaseConfig} from "./firebase-config.js";
import {initializeApp} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import {getAuth,onAuthStateChanged,signInWithEmailAndPassword,signOut} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import {getFirestore,collection,doc,getDocs,addDoc,updateDoc,serverTimestamp} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";
const $=x=>document.getElementById(x);
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const money=n=>"฿"+Number(n||0).toLocaleString("th-TH",{minimumFractionDigits:2,maximumFractionDigits:2});
const db=getFirestore(initializeApp(firebaseConfig,"school-procurement-req-2570"));
const auth=getAuth(db.app),COL="procurement_v2_requests",PCOL="procurement_v2_projects";
let user=null,rows=[],projects=PROJECTS.slice(),selected=null,draftNew=false,dirty=false,loaded=false;
const fields=["projectId","activityId","title","requestedDate","requestedAmount","procurementType","procurementMethod","purpose","vendor","deliveryDate","deliveryDays","notes","status","preparedBy"];
const EMPTY={projectId:"",activityId:"",title:"",requestedDate:"",requestedAmount:"",procurementType:"purchase",procurementMethod:"เฉพาะเจาะจง",purpose:"",vendor:"",deliveryDate:"",deliveryDays:"",notes:"",status:"draft",preparedBy:"",items:[]};
const notify=(message,warn=false)=>{$("notice").textContent=message;$("notice").classList.toggle("warn",warn)};
const findProject=id=>projects.find(p=>String(p.id)===String(id));
const ownAccount=()=>Boolean(user);
function syncProjectActivity(selectedActivity=""){
 const sel=$("activityId"),p=findProject($("projectId").value);
 sel.innerHTML='<option value="">ไม่ระบุ / ไม่มีรายการย่อยในแผน</option>'+(p?.activities||[]).map(a=>'<option value="'+esc(a.id)+'">'+esc(a.name)+'</option>').join("");
 if(selectedActivity&&[...sel.options].some(x=>x.value===selectedActivity))sel.value=selectedActivity;
}
function freshItem(n=1){return {description:"",qty:1,unit:"",unitPrice:0}}
function itemRow(item,i){
 const tr=document.createElement("tr");
 tr.innerHTML='<td>'+(i+1)+'</td>'+
 '<td><input data-item="description" maxlength="300" value="'+esc(item.description||"")+'" aria-label="ชื่อรายการ '+(i+1)+'"></td>'+
 '<td><input data-item="qty" type="number" min="0.01" step="any" value="'+esc(item.qty??1)+'" aria-label="จำนวน"></td>'+
 '<td><input data-item="unit" maxlength="40" value="'+esc(item.unit||"")+'" aria-label="หน่วย"></td>'+
 '<td><input data-item="unitPrice" type="number" min="0" step="0.01" value="'+esc(item.unitPrice??0)+'" aria-label="ราคาต่อหน่วย"></td>'+
 '<td><input data-item="lineTotal" readonly tabindex="-1" value="'+esc(((Number(item.qty)||0)*(Number(item.unitPrice)||0)).toFixed(2))+'" aria-label="รวมรายการ"></td>'+
 '<td><button class="itemRemove" type="button" aria-label="ลบรายการ">×</button></td>';
 tr.querySelector(".itemRemove").onclick=()=>{tr.remove();renumber();calculate();setDirty()};
 for(const input of tr.querySelectorAll("input:not([readonly])"))input.oninput=()=>{calculate();setDirty()};
 return tr
}
function itemsFromForm(){return [...$("items").querySelectorAll("tr")].map(tr=>Object.fromEntries([...tr.querySelectorAll("[data-item]:not([readonly])")].map(x=>[x.dataset.item,x.value]))).map(x=>({description:x.description.trim(),qty:Number(x.qty),unit:x.unit.trim(),unitPrice:Number(x.unitPrice)}))}
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
 renumber();calculate();dirty=false;
 $("formTitle").textContent=draftNew?"สร้างแฟ้มชุดเบิกใหม่":obj.title||"แฟ้มชุดเบิก";
 $("formMeta").textContent=draftNew?"ยังไม่ถูกบันทึกในฐานข้อมูล":"เลขอ้างอิง: "+(obj.docId||"—")+" · "+(obj.requestedDate||"—");
 $("state").textContent=obj.status==="prepared"?"ข้อมูลพร้อมตรวจ":"ร่าง";
 $("saveMessage").textContent=draftNew?"กรอกข้อมูลและกดบันทึก":"โหลดรายการนี้แล้ว";
 $("printBtn").disabled=false;$("wordBtn").disabled=false;$("saveBtn").disabled=!ownAccount();
 const locked=!ownAccount()||(!draftNew&&obj.status!=="draft");
 for(const el of $("form").querySelectorAll("input,select,textarea,button"))el.disabled=locked;
 $("saveBtn").disabled=locked;
 // An existing prepared record is deliberately read-only until workflow amendment is implemented.
 if(locked&&ownAccount())$("saveMessage").textContent="แฟ้มสถานะเตรียมข้อมูลครบ — เปิดอ่านและพิมพ์ได้ แต่ไม่อนุญาตแก้ย้อนหลัง";
}
function newFile(pid){
 if(!ownAccount()){notify("กรุณาเข้าสู่ระบบก่อนสร้างชุดเบิก",true);$("loginDialog").showModal();return}
 if(dirty&&!confirm("มีการแก้ไขที่ยังไม่บันทึก ต้องการเริ่มแฟ้มใหม่หรือไม่?"))return;
 selected=null;draftNew=true;
 const p=findProject(pid)||projects.find(p=>p.department===$("deptFilter").value)||projects[0];
 fillForm({...EMPTY,projectId:p?.id||"",requestedDate:new Date().toLocaleDateString("en-CA")});
 setDirty();
}
function choose(r){
 if(dirty&&!confirm("ข้อมูลที่แก้ไขยังไม่บันทึก ต้องการเปิดแฟ้มอื่นหรือไม่?"))return;
 draftNew=false;selected=r.docId;fillForm(r);renderList();
}
function renderList(){
 const dept=$("deptFilter").value,term=$("filter").value.trim().toLocaleLowerCase();
 const list=rows.filter(r=>(!dept||r.department===dept)&&(!term||(r.title+" "+(r.vendor||"")).toLocaleLowerCase().includes(term)));
 $("count").textContent=list.length+" แฟ้ม"+(loaded?" (Firebase)":"");
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
 if(withValue.length&&Math.abs(withValue.reduce((n,x)=>n+x.qty*x.unitPrice,0)-amount)>.01)throw Error("ยอดรวมรายการพัสดุไม่ตรงกับวงเงินที่ขอซื้อ");
 if(obj.status==="prepared"&&!withValue.length)throw Error("ต้องมีรายการพัสดุอย่างน้อยหนึ่งรายการก่อนระบุพร้อมตรวจ");
 if(obj.status==="prepared"&&!obj.vendor.trim())throw Error("สถานะพร้อมตรวจต้องมีชื่อผู้ขาย/ผู้รับจ้าง");
 if(!obj.title.trim())throw Error("กรุณาระบุชื่องานจัดซื้อ");
 if(obj.activityId&&!(p.activities||[]).some(a=>String(a.id)===obj.activityId))throw Error("กิจกรรมไม่ตรงกับโครงการที่เลือก");
 return {fiscalYear:"2570",department:p.department,projectId:p.id,activityId:obj.activityId||null,title:obj.title.trim(),requestedAmount:amount,requestedDate:obj.requestedDate,status:obj.status==="prepared"?"prepared":"draft",procurementType:obj.procurementType,procurementMethod:obj.procurementMethod,purpose:obj.purpose.trim(),vendor:obj.vendor.trim(),deliveryDate:obj.deliveryDate,deliveryDays:obj.deliveryDays?Number(obj.deliveryDays):null,notes:obj.notes.trim(),preparedBy:obj.preparedBy.trim(),items:withValue}
}
async function save(){
 if(!user){notify("กรุณาเข้าสู่ระบบ",true);return}
 if(!$("form").reportValidity())return;
 let data;try{data=readForm()}catch(e){notify(e.message,true);return}
 const saveBtn=$("saveBtn");saveBtn.disabled=true;$("saveMessage").textContent="กำลังบันทึก Firebase...";
 try{
  if(draftNew){const ref=await addDoc(collection(db,COL),{...data,createdBy:user.uid,createdAt:serverTimestamp(),updatedAt:serverTimestamp()});selected=ref.id;draftNew=false}
  else{const original=rows.find(r=>r.docId===selected);
   if(!original)throw Error("หาแฟ้มเดิมไม่พบ");if(original.status!=="draft")throw Error("แฟ้มที่ปิดสถานะร่างแล้วแก้ไขไม่ได้");
   if(original.department!==data.department)throw Error("ยังไม่รองรับการย้ายแฟ้มข้ามฝ่าย โปรดสร้างแฟ้มใหม่แทน");
   await updateDoc(doc(db,COL,selected),{...data,updatedAt:serverTimestamp()})
  }
  dirty=false;await reload(false);
  const current=rows.find(r=>r.docId===selected);if(current){fillForm(current);renderList()}
  notify("บันทึกแฟ้มลง Firebase สำเร็จ");$("saveMessage").textContent="บันทึกล่าสุดเรียบร้อย";
 }catch(err){notify("ไม่สามารถบันทึกแฟ้ม: "+(err.message||err)+" กรุณาตรวจ Firebase Rules/สิทธิ์",true);$("saveMessage").textContent="บันทึกไม่สำเร็จ"}
 finally{if($("form").hidden===false)$("saveBtn").disabled=!user||Boolean(rows.find(r=>r.docId===selected)?.status!=="draft"&&!draftNew)}
}
async function reload(showMessage=true){
 if(!user){rows=[];loaded=false;renderList();return}
 try{
  const [q,ps]=await Promise.all([getDocs(collection(db,COL)),getDocs(collection(db,PCOL))]);
  rows=q.docs.map(r=>({...r.data(),docId:r.id})).filter(x=>x.fiscalYear==="2570");
  const cloud=ps.docs.map(r=>r.data()).filter(x=>x.fiscalYear==="2570");
  const p=new Map(PROJECTS.map(x=>[String(x.id),x]));cloud.forEach(x=>p.set(String(x.id),x));projects=[...p.values()].sort((a,b)=>Number(a.id)-Number(b.id));
  loaded=true;
  if(showMessage)notify("โหลดแฟ้มชุดเบิกจาก Firebase แล้ว "+rows.length+" รายการ · การบันทึกวงเงินขอซื้อยังไม่ใช่รายจ่ายจริง");
  renderList();
  const qid=new URLSearchParams(location.search).get("id"),found=rows.find(x=>x.docId===(selected||qid));
  if(found&&!dirty&&!draftNew){selected=found.docId;fillForm(found)}
 }catch(err){loaded=false;rows=[];renderList();notify("อ่านฐานข้อมูลไม่ได้: "+(err.message||err)+" · กรุณาตรวจสิทธิ์ Firestore",true)}
}
$("deptFilter").innerHTML='<option value="">ทุกฝ่าย</option>'+DEPARTMENTS.map(d=>'<option value="'+esc(d.id)+'">'+esc(d.name)+'</option>').join("");
$("deptFilter").onchange=renderList;$("filter").oninput=renderList;
$("projectId").onchange=()=>{syncProjectActivity();setDirty()};
$("activityId").onchange=setDirty;
$("form").oninput=()=>{setDirty();if(document.activeElement?.name==="requestedAmount")calculate()};
$("addItem").onclick=()=>{const tb=$("items");tb.appendChild(itemRow(freshItem(),tb.children.length));calculate();setDirty()};
$("newBtn").onclick=()=>newFile(new URLSearchParams(location.search).get("projectId"));
$("saveBtn").onclick=save;
$("printBtn").onclick=()=>{if(dirty&&!confirm("มีข้อมูลยังไม่บันทึก ต้องการพิมพ์ฉบับปัจจุบันหรือไม่?"))return;window.print()};
$("wordBtn").onclick=()=>{if(dirty&&!confirm("ข้อมูลยังไม่บันทึกในฐานข้อมูล ต้องการเปิดระบบ Word หรือไม่?"))return;window.location.href="./official-word-editor.html"};
$("loginBtn").onclick=()=>{if(user)signOut(auth);else $("loginDialog").showModal()};
$("loginCancel").onclick=()=>$("loginDialog").close();
$("loginForm").onsubmit=async e=>{e.preventDefault();const v=Object.fromEntries(new FormData(e.target));try{await signInWithEmailAndPassword(auth,v.email,v.password);$("loginDialog").close()}catch(err){notify("เข้าสู่ระบบไม่สำเร็จ: "+err.message,true)}};
onAuthStateChanged(auth,async u=>{
 user=u;$("account").textContent=u?u.email:"ยังไม่ได้เข้าสู่ระบบ";$("loginBtn").textContent=u?"ออกจากระบบ":"เข้าสู่ระบบ";
 if(u){await reload();const params=new URLSearchParams(location.search),pid=params.get("projectId");if(pid&&!params.has("id")&&!selected&&!dirty)newFile(pid)}
 else{rows=[];selected=null;draftNew=false;dirty=false;loaded=false;$("form").hidden=true;$("empty").hidden=false;$("saveBtn").disabled=true;$("printBtn").disabled=true;$("wordBtn").disabled=true;renderList();notify("กรุณาเข้าสู่ระบบเพื่อเปิดและบันทึกแฟ้มชุดเบิกใน Firebase")}
});
window.addEventListener("beforeunload",e=>{if(dirty){e.preventDefault();e.returnValue=""}});
