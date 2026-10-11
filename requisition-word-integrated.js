import {DEPARTMENTS,PROJECTS} from "./dashboard-data-2570.js";
import {mergeOriginalWord} from "./word-source-merge-2570.js";
const $=id=>document.getElementById(id), NS="http://schemas.openxmlformats.org/wordprocessingml/2006/main";
let original=null,name="",hits=[],links=[],active=-1,pages=[],page=0;
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const dbName="school-procurement-word-template-v1";
const fmt=n=>Number(n||0).toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2});
function values(){
 const f=new FormData($("form")),p=PROJECTS.find(x=>String(x.id)===String(f.get("projectId"))),a=p?.activities.find(x=>String(x.id)===String(f.get("activityId")));
 const detail=Object.fromEntries([...document.querySelectorAll("[data-extra]")].map(x=>[x.dataset.extra,x.value]));
 const items=[...$("items").querySelectorAll("tr")].map(tr=>{const get=k=>tr.querySelector('[data-item="'+k+'"]')?.value||"";return {name:get("description"),qty:get("qty"),unit:get("unit"),price:get("unitPrice"),reference:get("referencePrice")}});
 const baht=n=>{const units=["ศูนย์","หนึ่ง","สอง","สาม","สี่","ห้า","หก","เจ็ด","แปด","เก้า"],tens=["","สิบ","ร้อย","พัน","หมื่น","แสน"];function say(n){if(!n)return "";if(n>=1e6)return say(Math.floor(n/1e6))+"ล้าน"+say(n%1e6);let a=String(n).split("").map(Number),v="";a.forEach((d,i)=>{let pos=a.length-i-1;if(!d)return;if(pos===1)v+=d===1?"สิบ":d===2?"ยี่สิบ":units[d]+"สิบ";else if(pos===0&&d===1&&a.length>1)v+="เอ็ด";else v+=units[d]+tens[pos]});return v}const sat=Math.round(Number(n||0)*100),b=Math.floor(sat/100),c=sat%100;return (say(b)||"ศูนย์")+"บาท"+(c?say(c)+"สตางค์":"ถ้วน")};
 const thaiDate=s=>{if(!/^\d{4}-\d{2}-\d{2}$/.test(s||""))return "";const [y,m,d]=s.split("-").map(Number);return d+" "+["มกราคม","กุมภาพันธ์","มีนาคม","เมษายน","พฤษภาคม","มิถุนายน","กรกฎาคม","สิงหาคม","กันยายน","ตุลาคม","พฤศจิกายน","ธันวาคม"][m-1]+" "+(y+543)};
 const budget=Number(f.get("requestedAmount")||0);
 const v={project:p?.name||"",activity:a?.name||"",subject:f.get("title")||"",division:DEPARTMENTS.find(x=>x.id===p?.department)?.name||"",budget:fmt(budget),amountWords:baht(budget),budgetPair:fmt(budget)+" บาท ("+baht(budget)+")",requestDate:thaiDate(f.get("requestedDate")),vendor:f.get("vendor")||"",purpose:f.get("purpose")||"",deliveryDate:thaiDate(f.get("deliveryDate")),deliveryDays:f.get("deliveryDays")||"",itemDescription:items[0]?.name||"",quantity:items[0]?.qty||"",unitName:items[0]?.unit||"",unitPrice:fmt(items[0]?.price||0),referencePrice:fmt(items[0]?.reference||0),...detail};
 v.items=items.map(x=>({name:x.name,qty:Number(x.qty),unit:x.unit,unitPrice:Number(x.price),referencePrice:Number(x.reference)}));
 for(const key of ["torApprovalDate","activityDate","approvalDate","winnerDate","orderDate","invoiceDate","receivedDate","actualDeliveryDate","paymentDate","requisitionDate"])if(v[key])v[key]=thaiDate(v[key]);
 return v;
}
function guess(t){
 // Do not auto-map ambiguous duplicates: project/activity and several different
 // monetary fields have identical sample text in the source DOCX.
 if(/สีน้ำมันตราเป็ดหงส์/.test(t))return "itemDescription";
 if(/วัสดุอุปกรณ์ทำสนามกีฬา/.test(t))return "subject";
 if(/ศรีทอง วัสดุก่อสร้าง/.test(t))return "vendor";
 if(/บริหารวิชาการ/.test(t))return "division";
 // Names can represent different signatory roles, and identical numbers occur in
 // budget, reference price, tax, price per unit and totals. Require selection.
 return "";
}
function runsIn(doc){
 const found=[];
 for(const p of doc.getElementsByTagNameNS(NS,"p")){
  let part=null;
  for(const run of p.getElementsByTagNameNS(NS,"r")){
   const mark=run.getElementsByTagNameNS(NS,"highlight")[0],text=[...run.getElementsByTagNameNS(NS,"t")].map(x=>x.textContent).join("");
   const yellow=!!mark&&(!mark.getAttributeNS(NS,"val")||["yellow","darkYellow"].includes(mark.getAttributeNS(NS,"val")));
   if(yellow&&text){if(!part){part={text:"",runs:[]};found.push(part)}part.text+=text;part.runs.push(run)}
   else if(text||run.getElementsByTagNameNS(NS,"br").length)part=null;
  }
 }
 return found.filter(x=>x.text.trim());
}
const mapKey=()=>"school-word-link-v3:"+name+":"+(original?.byteLength||0);
function storeLinks(){localStorage.setItem(mapKey(),JSON.stringify(links))}
async function loadWord(buffer,filename,persist){
 if(!window.JSZip)throw Error("ระบบอ่าน DOCX ยังโหลดไม่สำเร็จ");
 const zip=await JSZip.loadAsync(buffer),src=zip.file("word/document.xml");if(!src)throw Error("ไม่พบเอกสาร Word");
 const doc=new DOMParser().parseFromString(await src.async("string"),"application/xml");
 const parsed=runsIn(doc);original=buffer;name=filename;hits=parsed;
 try{const old=JSON.parse(localStorage.getItem(mapKey())||"null");links=Array.isArray(old)&&old.length===hits.length?old:hits.map(x=>({key:guess(x.text),shared:true,value:""}))}catch(e){links=hits.map(x=>({key:guess(x.text),shared:true,value:""}))}
 $("templateStatus").textContent=filename+" • พบจุดที่เปลี่ยนได้ "+hits.length+" จุด";
 if(persist)await persistWord(buffer,filename);
 renderList();
 if($("studioDialog").open)await preview(new Blob([buffer]));
}
function openDb(){return new Promise((ok,bad)=>{const r=indexedDB.open(dbName,1);r.onupgradeneeded=()=>{if(!r.result.objectStoreNames.contains("files"))r.result.createObjectStore("files")};r.onsuccess=()=>ok(r.result);r.onerror=()=>bad(r.error)})}
async function persistWord(buffer,filename){const db=await openDb();await new Promise((ok,bad)=>{const tx=db.transaction("files","readwrite");tx.objectStore("files").put({name:filename,buffer},"master");tx.oncomplete=ok;tx.onerror=()=>bad(tx.error)});db.close()}
async function restore(){try{const db=await openDb();const result=await new Promise((ok,bad)=>{const tx=db.transaction("files","readonly"),r=tx.objectStore("files").get("master");r.onsuccess=()=>ok(r.result);r.onerror=()=>bad(r.error)});db.close();if(result?.buffer)await loadWord(result.buffer,result.name,false)}catch(e){$("templateStatus").textContent="กรุณาเลือกไฟล์ Word ต้นฉบับ"}}
function renderList(){
 $("studioCount").textContent=hits.length+" จุด • ผูกแล้ว "+links.filter(x=>x.key||(x.shared===false&&x.value)).length+" • ยังไม่ผูก "+links.filter(x=>!x.key&&!(x.shared===false&&x.value)).length;
 $("studioPlaces").innerHTML=hits.map((h,i)=>'<button type="button" class="studioPlace '+(i===active?"active":"")+'" data-point="'+i+'"><small>จุดที่ '+(i+1)+' · '+(links[i]?.key||"ยังไม่เลือกข้อมูล")+'</small>'+esc(h.text.slice(0,95))+'</button>').join("");
 document.querySelectorAll("[data-point]").forEach(e=>e.onclick=()=>choose(Number(e.dataset.point)));
}
function choose(i){
 active=i;const hit=hits[i],binding=links[i];$("studioSelected").hidden=false;$("studioSource").textContent=hit.text;
 const labels={project:"ชื่อโครงการ",activity:"ชื่อกิจกรรม",subject:"ชื่องานจัดซื้อ",division:"ฝ่าย",budget:"วงเงินตัวเลข",amountWords:"คำอ่านจำนวนเงิน",budgetPair:"วงเงินตัวเลขพร้อมคำอ่าน",requestDate:"วันที่บันทึก",vendor:"ชื่อผู้ขาย",purpose:"เหตุผลการจัดซื้อ",deliveryDate:"วันที่ส่งมอบ",itemDescription:"รายการพัสดุแรก",quantity:"จำนวนพัสดุแรก",unitName:"หน่วยนับรายการแรก",unitPrice:"ราคาซื้อหน่วยละ",referencePrice:"ราคาอ้างอิง"};
 $("studioKey").innerHTML='<option value="">คงต้นฉบับเดิม</option>'+Object.keys(values()).filter(x=>x!=="items").map(x=>{
 const label=labels[x]||document.querySelector('[data-extra="'+x+'"]')?.closest("label")?.querySelector("span")?.textContent?.trim()||x;
 return '<option value="'+esc(x)+'">'+esc(label)+' — '+esc(String(values()[x]||"").slice(0,36))+'</option>';
 }).join("");
 $("studioKey").value=binding.key||"";$("studioShared").checked=binding.shared!==false;$("studioOverride").value=binding.value||"";$("studioOverrideLabel").hidden=binding.shared!==false;
 const el=$("docPreview").querySelector('[data-hit="'+i+'"]');if(el){el.scrollIntoView({block:"center",behavior:"smooth"});document.querySelectorAll(".studioHighlight.selected").forEach(e=>e.classList.remove("selected"));el.classList.add("selected")}
 renderList();
}
$("studioShared").onchange=()=>{$("studioOverrideLabel").hidden=$("studioShared").checked};
$("studioApply").onclick=()=>{if(active<0)return;links[active]={key:$("studioKey").value,shared:$("studioShared").checked,value:$("studioOverride").value};storeLinks();renderList()};
function markPreview(){
 const normalize=t=>String(t||"").replace(/\s+/g,"");
 const els=[...$("docPreview").querySelectorAll("span")].filter(e=>!e.children.length&&e.textContent.trim());
 const used=new Set();
 hits.forEach((h,i)=>{
  const target=normalize(h.text);
  // Exact matching gives priority to the original yellow field, while
  // partial matching handles Word runs rendered as several inline spans.
  let el=els.find(x=>!used.has(x)&&target.length>2&&normalize(x.textContent)===target);
  if(!el)el=els.find(x=>!used.has(x)&&target.length>2&&normalize(x.textContent).includes(target));
  if(!el)el=els.find(x=>!used.has(x)&&normalize(x.textContent).length>3&&target.includes(normalize(x.textContent))&&(/rgb\(255, 255, 0\)|yellow/i.test(getComputedStyle(x).backgroundColor)||/yellow/i.test(x.getAttribute("style")||"")));
  if(!el)return;
  used.add(el);el.classList.add("studioHighlight");el.dataset.hit=i;
  el.onclick=event=>{event.stopPropagation();choose(i)};
 });
}
async function preview(blob){
 $("studioLoading").textContent="กำลังจัดหน้า Word…";$("docPreview").innerHTML="";
 if(!window.docx?.renderAsync){$("studioLoading").textContent="โหลดส่วนพรีวิวไม่สำเร็จ";return}
 await window.docx.renderAsync(blob,$("docPreview"),null,{inWrapper:true,breakPages:true,useBase64URL:true});
 pages=[...$("docPreview").querySelectorAll("section.docx")];page=0;markPreview();
 $("studioLoading").textContent="ตัวอย่างจากต้นฉบับ • "+pages.length+" หน้า (โปรดตรวจอีกครั้งใน Word)";
}
$("openStudio").onclick=async()=>{$("studioDialog").showModal();renderList();if(original)try{await preview(new Blob([original]))}catch(e){$("studioLoading").textContent=e.message}else $("studioLoading").textContent="กรุณาเลือกไฟล์ Word ก่อน"};
$("studioClose").onclick=()=>$("studioDialog").close();
function go(delta){page=Math.max(0,Math.min(pages.length-1,page+delta));pages[page]?.scrollIntoView({block:"start",behavior:"smooth"});$("studioSummary").textContent="ตัวอย่างหน้า "+(page+1)+" / "+pages.length}
$("studioBack").onclick=()=>go(-1);$("studioNext").onclick=()=>go(1);
$("sourceWord").onchange=async e=>{const file=e.target.files?.[0];if(!file)return;try{await loadWord(await file.arrayBuffer(),file.name,true)}catch(error){$("templateStatus").textContent="อ่าน Word ไม่สำเร็จ: "+error.message}};
function setRun(run,text){
 let t=run.getElementsByTagNameNS(NS,"t")[0];if(!t){t=run.ownerDocument.createElementNS(NS,"w:t");run.appendChild(t)}
 t.textContent=text;t.setAttribute("xml:space","preserve");
 [...run.getElementsByTagNameNS(NS,"t")].slice(1).forEach(n=>n.textContent="");
 [...run.getElementsByTagNameNS(NS,"highlight")].forEach(n=>n.parentNode.removeChild(n));
}
async function build(){
 if(!original)throw Error("กรุณาเลือก Word ต้นฉบับก่อน");
 const zip=await JSZip.loadAsync(original);
 const xml=zip.file("word/document.xml");
 if(!xml)throw Error("ไม่พบเนื้อหา word/document.xml");
 const dom=new DOMParser().parseFromString(await xml.async("string"),"application/xml");
 if(dom.querySelector("parsererror"))throw Error("Word XML อ่านไม่สำเร็จ");
 // Capture run objects before inserting repeated item rows.
 const originHits=runsIn(dom),val=values();
 const items=val.items.filter(x=>x.name&&x.qty>0);
 // Use source-specific all-page merge BEFORE per-position user overrides.
 const report=mergeOriginalWord(dom,val,items);
 let manuallyMapped=0;
 originHits.forEach((hit,i)=>{
  const binding=links[i];
  if(!binding || (!binding.key&&binding.shared!==false))return;
  const value=binding.shared!==false?val[binding.key]:binding.value;
  if(value===undefined||value===null||String(value)==="")return;
  const actual=binding.key==="amountWords"&&/\d/.test(hit.text)?val.budgetPair:value;
  setRun(hit.runs[0],String(actual));hit.runs.slice(1).forEach(r=>setRun(r,""));
  manuallyMapped++;
 });
 const text=new XMLSerializer().serializeToString(dom);
 const hasLegacy=/จัดซื้อสื่อและวัสดุอุปกรณ์การเรียนการสอน\s*เพื่อยกระดับผลสัมฤทธิ์ทางการเรียน|วัสดุ\s*อุปกรณ์\s*ทำสนามกีฬา|สีน้ำมันตราเป็ดหงส์/.test(
 [...dom.getElementsByTagNameNS(NS,"t")].map(n=>n.textContent||"").join(""));
 if(hasLegacy&&String(val.subject||"")!=="วัสดุอุปกรณ์ทำสนามกีฬา"){
  report.unresolved.push("ตรวจพบข้อความตัวอย่างโครงการ/ชื่องาน/รายการพัสดุเก่าที่ยังไม่ถูกแทน");
 }
 zip.file("word/document.xml",text);
 const blob=await zip.generateAsync({type:"blob",mimeType:"application/vnd.openxmlformats-officedocument.wordprocessingml.document"});
 const replacements=Object.values(report.replacements).reduce((a,b)=>a+b,0);
 const warnings=[...report.errors,...report.unresolved];
 const summary="อัปเดต Word ทุกส่วนที่ตรวจพบ • แทนเนื้อหา "+replacements+
 " จุด • ผูกเฉพาะตำแหน่ง "+manuallyMapped+" จุด • ตารางพัสดุ "+report.itemTableRows+
 " ตาราง / "+report.itemRowsWritten+" แถว • ยอดการเงิน "+(report.financialRows||0)+" แถว"+
 (warnings.length?" • ต้องตรวจเพิ่มเติม: "+warnings.join("; "):"");
 $("wordStatus").textContent=summary;
 window.__lastWordMergeReport={...report,manuallyMapped,warnings};
 if(warnings.length)throw Error("การตรวจเอกสารไม่ผ่าน: "+warnings.join("; "));
 return blob;
}
$("downloadDocx").onclick=async()=>{try{const blob=await build(),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download="ชุดเบิก-"+($("title").value||"เอกสาร")+".docx";a.click();setTimeout(()=>URL.revokeObjectURL(url),2000)}catch(e){$("wordStatus").textContent=e.message}};
$("downloadPdf").onclick=async()=>{
 const win=window.open("","_blank");if(!win){$("wordStatus").textContent="โปรดอนุญาต Popup เพื่อพิมพ์ PDF";return}
 win.document.write("<p>กำลังจัดหน้าเอกสาร...</p>");
 try{const blob=await build(),tmp=document.createElement("div");tmp.style.cssText="position:absolute;left:-10000px";document.body.appendChild(tmp);
  if(!window.docx?.renderAsync)throw Error("ส่วนแสดงผล Word ไม่พร้อม");
  await window.docx.renderAsync(blob,tmp,null,{inWrapper:true,breakPages:true,useBase64URL:true});
  const css=[...document.querySelectorAll("style")].filter(x=>(x.textContent||"").includes(".docx")).map(x=>x.outerHTML).join("");
  const html='<!doctype html><html><head><meta charset="utf-8"><title>พิมพ์ชุดเบิก</title>'+css+'<style>@page{size:A4;margin:0}body{margin:0}.docx-wrapper{padding:0!important;background:#fff!important}.docx{margin:0 auto!important;box-shadow:none!important;break-after:page}</style></head><body>'+tmp.innerHTML+'</body></html>';
  win.document.open();win.document.write(html);win.document.close();tmp.remove();
  win.setTimeout(()=>win.print(),800);
 }catch(e){win.document.body.textContent="สร้าง PDF ไม่ได้: "+e.message}
};
restore();
