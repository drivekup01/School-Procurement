import {DEPARTMENTS,PROJECTS,PLAN_TOTAL} from "./dashboard-data-2570.js";
import {firebaseConfig} from "./firebase-config.js";
import {initializeApp} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import {getAuth,onAuthStateChanged,signInWithEmailAndPassword,signOut} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import {getFirestore,collection,doc,getDocs,getDoc,writeBatch,addDoc,serverTimestamp,query,orderBy} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";
const $=x=>document.getElementById(x),esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const money=v=>"฿"+Number(v||0).toLocaleString("th-TH",{minimumFractionDigits:2,maximumFractionDigits:2});
const app=initializeApp(firebaseConfig,"school-procurement-dashboard-2570"),auth=getAuth(app),db=getFirestore(app);
const FY="2570",DEPTCOL="procurement_v2_departments",PROJCOL="procurement_v2_projects",TXCOL="procurement_v2_transactions",REQCOL="procurement_v2_requests";
let user=null,role=null,activeDept="academic",cloudProjects=[],tx=[],requests=[],loaded=false;
function status(s,error=false){$("status").textContent=s;$("status").classList.toggle("error",error)}
function projList(){return cloudProjects.length?cloudProjects:PROJECTS}
function allActivities(){return projList().flatMap(p=>(p.activities||[]).map(a=>({...a,projectId:p.id,department:p.department})))}
function spentForProject(p){return tx.filter(t=>t.type==="expense"&&String(t.projectId)===String(p.id)).reduce((n,t)=>n+Number(t.amount||0),0)}
function spentForActivity(p,a){return tx.filter(t=>t.type==="expense"&&String(t.projectId)===String(p.id)&&String(t.activityId)===String(a.id)).reduce((n,t)=>n+Number(t.amount||0),0)}
function total(t){return tx.filter(x=>x.type===t).reduce((n,x)=>n+Number(x.amount||0),0)}
function canWrite(){return Boolean(user)}
function nfmt(x){return Number(x||0).toLocaleString("th-TH",{minimumFractionDigits:2,maximumFractionDigits:2})}
function section(id){$(id).scrollIntoView({behavior:"smooth",block:"start"})}
function render(){
 $("planTotal").textContent=money(PLAN_TOTAL);$("budgetTotal").textContent=money(PLAN_TOTAL);
 $("incomeTotal").textContent=loaded?money(total("income")):"—";$("expenseTotal").textContent=loaded?money(total("expense")):"—";
 $("balanceTotal").textContent=loaded?money(total("income")-total("expense")):"—";
 $("departments").innerHTML=DEPARTMENTS.map(d=>{
  const count=projList().filter(p=>p.department===d.id).length;
  return '<button class="dep '+(d.id===activeDept?"active":"")+'" data-dept="'+d.id+'"><span class="icon">'+d.icon+'</span><b>'+esc(d.name)+'</b><strong>'+money(d.budget)+'</strong><small>'+count+' โครงการ</small><footer>เปิดดูโครงการ →</footer></button>';
 }).join("");
 $("departments").querySelectorAll("[data-dept]").forEach(el=>el.onclick=()=>{activeDept=el.dataset.dept;$("search").value="";render();section("projectsSection")});
 const d=DEPARTMENTS.find(d=>d.id===activeDept),pr=projList().filter(p=>p.department===activeDept);
 const depSpent=pr.reduce((n,p)=>n+spentForProject(p),0);
 $("departmentHeading").textContent="โครงการใน"+d.name;$("departmentSub").textContent="เลือกชื่อโครงการเพื่อแสดงกิจกรรมและยอดจ่ายจริง";
 $("selectedName").textContent=d.name;$("selectedPlan").textContent=money(d.budget);$("selectedProjects").textContent=pr.length+" โครงการ";$("selectedSpent").textContent=loaded?money(depSpent):"ยังไม่โหลดข้อมูล";
 const pct=d.budget?depSpent/d.budget*100:0;$("usedBar").style.width=Math.min(pct,100)+"%";$("usedPct").textContent=loaded?pct.toFixed(2)+"%":"—";
 const filter=$("search").value.trim().toLocaleLowerCase();const matching=pr.filter(p=>(p.name+" "+(p.activities||[]).map(a=>a.name).join(" ")).toLocaleLowerCase().includes(filter));
 $("projectCount").textContent=matching.length+" จาก "+pr.length+" โครงการ";
 $("projectList").innerHTML=matching.map(p=>{
  const acts=p.activities||[];
  return '<details class="project"><summary><span class="number">'+p.id+'</span><span class="pname">'+esc(p.name)+'</span><span class="pmeta">'+acts.length+' กิจกรรม</span><span style="color:#8397b2">›</span></summary><div class="projectContent">'+(acts.length?acts.map(a=>'<div class="activity"><div>'+esc(a.name)+'<br><span class="muted" style="font-size:10px">รายจ่ายจริงที่บันทึก</span></div><div class="amount">'+(loaded?money(spentForActivity(p,a)):"—")+'</div></div>').join(""):'<div class="activity muted">ไม่มีรายการกิจกรรมย่อยระบุในแผน</div>')+'<div class="projectTotal"><span>รายจ่ายรวมของโครงการ</span><b>'+(loaded?money(spentForProject(p)):"—")+'</b></div><div style="padding:12px 0"><button class="link" data-req="'+p.id+'">＋ ทำชุดเบิกโครงการนี้</button></div></div></details>'
 }).join("")||'<div class="activity muted">ไม่พบโครงการตรงกับคำค้น</div>';
 document.querySelectorAll("[data-req]").forEach(el=>el.onclick=()=>requestForm(Number(el.dataset.req)));
 $("ledgerRows").innerHTML=tx.length?[...tx].sort((a,b)=>String(b.date||"").localeCompare(String(a.date||""))).slice(0,25).map(t=>{
  const d=DEPARTMENTS.find(x=>x.id===t.department),p=projList().find(x=>String(x.id)===String(t.projectId));
  return '<tr><td>'+esc(t.date||"—")+'</td><td>'+esc(t.note||"—")+'</td><td>'+(t.type==="income"?"รายรับ":"รายจ่าย")+'</td><td>'+esc(d?.short||"—")+" / "+esc(p?.name||"ไม่ระบุ")+'</td><td>'+money(t.amount)+'</td></tr>'
 }).join(""):'<tr><td colspan="5" style="color:#8494aa">ยังไม่มีรายรับ–รายจ่ายจริงในข้อมูลที่อ่านได้</td></tr>';
}
function modal(title,fields,onSubmit){
 $("dialogTitle").textContent=title;$("formFields").innerHTML=fields;
 $("entryForm").onsubmit=async e=>{e.preventDefault();const btn=$("submitEntry");btn.disabled=true;
 try{await onSubmit(Object.fromEntries(new FormData(e.target).entries()));$("dialog").close();await reload();status("บันทึกข้อมูลเรียบร้อยแล้ว")}
 catch(err){status("บันทึกไม่สำเร็จ: "+(err.message||err),true)}finally{btn.disabled=false}};
 $("dialog").showModal();
}
const input=(label,key,type="text",val="",required=true)=>'<label>'+esc(label)+'<input name="'+key+'" type="'+type+'" value="'+esc(val)+'" '+(required?"required":"")+' '+(type==="number"?'min="0.01" step="0.01"':'')+'></label>';
const select=(label,key,items)=>'<label>'+esc(label)+'<select name="'+key+'">'+items.map(([v,n])=>'<option value="'+esc(v)+'">'+esc(n)+'</option>').join("")+'</select></label>';
function requestForm(pid){
 if(!canWrite()){status("กรุณาเข้าสู่ระบบ Firebase ก่อนบันทึกชุดเบิก",true);loginForm();return}
 const ps=projList(),selected=ps.find(p=>Number(p.id)===Number(pid))||ps.find(p=>p.department===activeDept)||ps[0];
 const opts=ps.map(p=>[p.id,p.name]);
 const fields=select("โครงการ", "projectId", [[selected.id,selected.name],...opts.filter(x=>Number(x[0])!==Number(selected.id))])+
 select("กิจกรรม", "activityId", [["","ไม่ระบุ / ยังไม่มีรายการย่อย"],...(selected.activities||[]).map(a=>[a.id,a.name])])+
 input("ชื่องานจัดซื้อ / จัดจ้าง","title")+
 input("วงเงินที่ขอซื้อ (บาท)","amount","number")+
 input("วันที่ขอซื้อ","date","date",new Date().toISOString().slice(0,10));
 modal("เริ่มทำชุดเบิก",fields,async data=>{
  const p=ps.find(p=>String(p.id)===String(data.projectId));
  if(!p||!data.title.trim())throw Error("กรุณาเลือกโครงการและระบุชื่องาน");
  await addDoc(collection(db,REQCOL),{fiscalYear:FY,department:p.department,projectId:p.id,activityId:data.activityId||null,title:data.title.trim(),requestedAmount:Number(data.amount),requestedDate:data.date,status:"draft",createdBy:user.uid,createdAt:serverTimestamp()});
 });
 // update dependent activities when project changes
 const projectSelect=$("formFields").querySelector('[name="projectId"]');
 projectSelect.onchange=()=>{
  const p=ps.find(p=>String(p.id)===projectSelect.value);
  const activitySelect=$("formFields").querySelector('[name="activityId"]');
  activitySelect.innerHTML='<option value="">ไม่ระบุ / ยังไม่มีรายการย่อย</option>'+(p?.activities||[]).map(a=>'<option value="'+esc(a.id)+'">'+esc(a.name)+'</option>').join("");
 };
}
function ledgerForm(){
 if(!canWrite()){status("กรุณาเข้าสู่ระบบก่อนบันทึกรายรับ–รายจ่าย",true);loginForm();return}
 const ps=projList();
 const fields=select("ประเภท","type",[["expense","รายจ่ายจริง"],["income","รายรับจริง"]])+
 input("จำนวนเงิน (บาท)","amount","number")+
 input("วันที่เกิดรายการจริง","date","date",new Date().toISOString().slice(0,10))+
 select("ฝ่าย","department",DEPARTMENTS.map(d=>[d.id,d.name]))+
 select("โครงการ (ถ้ามี)","projectId",[["","รายการระดับฝ่าย/ไม่ระบุโครงการ"],...ps.map(p=>[p.id,p.name])])+
 input("รายละเอียดรายการ","note");
 modal("บันทึกรายรับ–รายจ่าย",fields,async v=>{
  if(!(Number(v.amount)>0))throw Error("จำนวนเงินต้องมากกว่า 0");
  const p=ps.find(p=>String(p.id)===v.projectId);
  await addDoc(collection(db,TXCOL),{fiscalYear:FY,type:v.type,amount:Number(v.amount),date:v.date,department:p?.department||v.department,projectId:p?.id||null,activityId:null,note:v.note.trim(),createdBy:user.uid,createdAt:serverTimestamp()});
 });
}
function loginForm(){
 modal("เข้าสู่ระบบ Firebase",input("อีเมล","email","email")+input("รหัสผ่าน","password","password"),async v=>{await signInWithEmailAndPassword(auth,v.email,v.password)});
}
async function reload(){
 if(!user){loaded=false;cloudProjects=[];tx=[];requests=[];render();return}
 try{
  const [ps,transactions,rqs]=await Promise.all([
   getDocs(collection(db,PROJCOL)),getDocs(collection(db,TXCOL)),getDocs(collection(db,REQCOL))
  ]);
  cloudProjects=ps.docs.map(d=>d.data()).filter(p=>p.fiscalYear===FY);
  tx=transactions.docs.map(d=>({...d.data(),docId:d.id})).filter(t=>t.fiscalYear===FY);
  requests=rqs.docs.map(d=>({...d.data(),docId:d.id})).filter(r=>r.fiscalYear===FY);
  loaded=true;
  $("cloudLabel").textContent=cloudProjects.length?"☁ Firebase: "+cloudProjects.length+" โครงการ":"☁ Firebase: รอนำเข้าโครงการ";
  status("ข้อมูลจาก Firebase พร้อมใช้งาน • ชุดเบิกที่ร่างไว้ "+requests.length+" รายการ • โครงการและกิจกรรมในแผนยังแก้ไขเพิ่มเติมได้");
 }catch(e){loaded=false;cloudProjects=[];tx=[];requests=[];status("เชื่อมฐานข้อมูลไม่ได้: "+e.message+" • ขณะนี้แสดงแผนตั้งต้นจากไฟล์เท่านั้น",true);$("cloudLabel").textContent="ฐานข้อมูลอ่านไม่สำเร็จ"}
 render();
}
async function importPlan(){
 if(!user){loginForm();return}
 if(!confirm("นำเข้าหรือเติมข้อมูลแผน 2570 จำนวน 40 โครงการและ 4 ฝ่ายลง Firestore? ระบบจะไม่เขียนทับโครงการที่มีอยู่แล้ว และไม่แตะรายรับ–รายจ่ายเดิม"))return;
 $("syncPlans").disabled=true;status("กำลังตรวจและนำเข้าข้อมูลโครงการ...");
 try{
  const keys=[...DEPARTMENTS.map(d=>({kind:"dept",key:d.id,data:d})),...PROJECTS.map(p=>({kind:"project",key:String(p.id).padStart(3,"0"),data:p}))];
  const existing=await Promise.all(keys.map(k=>getDoc(doc(db,k.kind==="dept"?DEPTCOL:PROJCOL,FY+"-"+k.key))));
  const batch=writeBatch(db);let added=0;
  keys.forEach((k,i)=>{if(existing[i].exists())return;
   const ref=doc(db,k.kind==="dept"?DEPTCOL:PROJCOL,FY+"-"+k.key);
   batch.set(ref,{...k.data,fiscalYear:FY,source:"FY2570_original_budget_plan",createdAt:serverTimestamp(),updatedAt:serverTimestamp()});added++});
  if(added)await batch.commit();
  status("นำเข้าแผนเรียบร้อย: เพิ่ม "+added+" รายการ (ข้อมูลเดิมที่มีอยู่แล้วไม่ถูกเขียนทับ)");
  await reload();
 }catch(e){status("นำเข้า Firestore ไม่สำเร็จ: "+e.message+" • ตรวจสิทธิ์บัญชีและ Firestore Rules",true)}
 finally{$("syncPlans").disabled=false}
}
$("navHome").onclick=()=>window.scrollTo({top:0,behavior:"smooth"});
$("navDept").onclick=()=>section("deptSection");
$("navLedger").onclick=()=>section("ledgerSection");
$("navRequest").onclick=()=>requestForm();
$("addRequest").onclick=()=>requestForm();
$("requestFromDept").onclick=()=>requestForm();
$("addTransaction").onclick=ledgerForm;
$("syncPlans").onclick=importPlan;
$("search").oninput=render;
$("expandAll").onclick=()=>{
 const ds=[...document.querySelectorAll("details.project")],open=ds.every(x=>x.open);
 ds.forEach(x=>x.open=!open);
 $("expandAll").textContent=open?"ขยายทั้งหมด":"ย่อทั้งหมด";
};
$("closeDialog").onclick=$("cancelDialog").onclick=()=>$("dialog").close();
$("loginBtn").onclick=async()=>{if(user){await signOut(auth)}else loginForm()};
onAuthStateChanged(auth,async u=>{
 user=u;
 $("accountStatus").textContent=u?"ลงชื่อเข้าใช้แล้ว: "+u.email:"ยังไม่ได้ลงชื่อเข้าใช้";
 $("loginBtn").textContent=u?"ออกจากระบบ":"เข้าสู่ระบบ";
 if(u){$("cloudLabel").textContent="☁ Firebase: กำลังโหลด";await reload()}
 else{loaded=false;tx=[];cloudProjects=[];$("cloudLabel").textContent="โหมดดูแผน (ยังไม่เข้าสู่ระบบ)";status("ข้อมูลแผนปี 2570 แสดงได้ทันที • เข้าสู่ระบบเพื่อนำเข้าฐานข้อมูลและบันทึกธุรกรรม");render()}
});
render();
