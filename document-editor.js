import {firebaseConfig} from "./firebase-config.js";
import {initializeApp} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import {getAuth,onAuthStateChanged} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import {getFirestore,doc,getDoc,collection,addDoc,serverTimestamp} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";
import {getStorage,ref,getBlob} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-storage.js";
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
let sourceStorage=null,sourceUrl=null,sourceMode="generated";
const ORIGINAL_TEMPLATE_STORAGE_PATH="procurement/templates/first-set/source.pdf";
function referenceMessage(message){$("sourceMessage").textContent=message}
async function showSource(){
 sourceMode="source";$("generatedPreview").hidden=true;$("sourceViewerBox").hidden=false;
 if(sourceUrl){$("sourceViewer").src=sourceUrl+"#page="+page+"&view=FitH";referenceMessage("กำลังแสดงต้นฉบับจริงที่จัดเก็บใน Firebase Storage");return}
 if(!sourceStorage||!user){referenceMessage("กรุณาเข้าสู่ระบบก่อนดูเอกสารต้นฉบับ");return}
 referenceMessage("กำลังตรวจไฟล์ต้นฉบับจาก Firebase Storage…");
 try{const blob=await getBlob(ref(sourceStorage,ORIGINAL_TEMPLATE_STORAGE_PATH));
 if(blob.type!=="application/pdf")throw Error("แม่แบบบน Storage ไม่ใช่ PDF");
 sourceUrl=URL.createObjectURL(blob);$("sourceViewer").src=sourceUrl+"#page="+page+"&view=FitH";referenceMessage("ต้นฉบับจริงจาก Firebase Storage • แสดงหน้า "+page+" / 10");
 }catch(e){$("sourceViewerBox").hidden=true;referenceMessage("ยังไม่สามารถแสดงต้นฉบับจริงได้: "+(e.code==="storage/object-not-found"?"ยังไม่ได้เก็บสำเนาต้นฉบับที่ผ่านการตรวจและอนุญาตลง Storage":e.code==="storage/unauthorized"?"สิทธิ์อ่านแม่แบบยังไม่อนุญาต":e.code||e.message)+" • ขณะนี้จะไม่ใช้หน้ากระดาษที่สร้างเองแทนโดยอ้างว่าเป็นต้นฉบับ");}
}
function showGenerated(){sourceMode="generated";$("generatedPreview").hidden=false;$("sourceViewerBox").hidden=true;referenceMessage("ฉบับนี้สร้างจากข้อมูลที่กรอก ยังไม่ใช่แบบราชการต้นฉบับที่ผ่านการตรวจจัดหน้า")}
$("showOfficialSource").onclick=showSource;
$("showGenerated").onclick=showGenerated;

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
function htmlForPage(i){
 let body="";
 const title=fullTitle(),budget=fmt(v("budget")),price=fmt(v("referencePrice")),agreement=fmt(v("agreedPrice")),date=mark("requestDate");
 if(i===1)body=memoHead("มอบหมายบุคลากรปฏิบัติหน้าที่กำหนดรายละเอียดคุณลักษณะของงานจัดซื้อ")+n("ด้วย"+school()+"มีความประสงค์จะดำเนินการ"+title+" ตามที่ได้รับจัดสรรงบประมาณประจำปีงบประมาณ "+mark("fiscalYear")+" ตามโครงการ "+mark("project")+" กิจกรรม "+mark("activity")+" วงเงินงบประมาณ "+budget+" บาท")+n("จึงเห็นสมควรมอบหมาย "+mark("specPreparer")+" ตำแหน่ง "+mark("specPosition")+" เป็นผู้กำหนดคุณลักษณะเฉพาะของงานดังกล่าว ทั้งนี้อำนาจให้ความเห็นชอบเป็นของผู้อำนวยการโรงเรียน")+n("จึงเรียนมาเพื่อโปรดพิจารณาอนุมัติ")+signPair()+directorSign();
 if(i===2)body=memoHead("ขอความเห็นชอบการจัดทำขอบเขตของงานหรือรายละเอียดคุณลักษณะ")+n("เอกสารแนบ ขอบเขตของงานหรือรายละเอียดคุณลักษณะเฉพาะของพัสดุ จำนวน 1 ชุด")+n("<b>ความเดิม</b> ตามที่โรงเรียนจะดำเนินการ"+title+" และได้มอบหมายให้ "+mark("specPreparer")+" จัดทำรายละเอียดคุณลักษณะเฉพาะแล้วนั้น")+n("<b>ข้อเท็จจริง</b> ผู้ได้รับมอบหมายดำเนินการจัดทำรายละเอียดคุณลักษณะเฉพาะแล้วเสร็จตามเอกสารแนบ")+n("<b>ข้อพิจารณา</b> ขออนุมัติและให้ความเห็นชอบใช้รายละเอียดคุณลักษณะเป็นข้อมูลสำหรับจัดซื้อจัดจ้าง")+n("จึงเรียนมาเพื่อโปรดพิจารณา")+n("ลงชื่อ................................ ผู้จัดทำขอบเขตงาน ("+mark("specPreparer")+")")+signPair()+directorSign();
 if(i===3)body='<h3>ขอบเขตของงานหรือรายละเอียดคุณลักษณะเฉพาะของพัสดุ</h3>'+n("☐ จัดซื้อ　☐ จัดจ้าง　รายการ "+esc(v("subject"))+" จำนวน "+state.items.length+" รายการ")+n("<b>1. หลักการและเหตุผล</b> "+mark("purpose"))+n("<b>2. วงเงินงบประมาณ</b> "+budget+" บาท　"+esc(v("budgetSource")==="allocated"?"☑ ตามเงินจัดสรร สพฐ.":"☑ ตามแผนปฏิบัติราชการ"))+n("<b>3. ราคากลาง</b> "+price+" บาท")+n("<b>4. สถานที่ส่งมอบ/ดำเนินการ</b> "+mark("deliveryPlace"))+n("<b>5. คุณสมบัติของผู้เสนอราคา</b> ให้เป็นไปตามรายละเอียดในเอกสารต้นฉบับ (หัวข้อ 5.1–5.10) ซึ่งต้องตรวจยืนยันถ้อยคำก่อนใช้ลงนาม")+n("5.1 มีความสามารถตามกฎหมาย　5.2 ไม่เป็นบุคคลล้มละลาย　5.3 ไม่อยู่ระหว่างเลิกกิจการ")+n("5.4–5.10 เงื่อนไขและคุณสมบัติของผู้เสนอราคาตามเอกสารราชการแม่แบบ");
 if(i===4)body='<h3 style="text-align:center">-2-</h3><h3>6. รายละเอียดคุณลักษณะเฉพาะของพัสดุ</h3>'+itemTable()+n("<b>7. การเสนอราคาและกำหนดส่งมอบ</b> กำหนดส่งมอบภายใน "+mark("deliveryDays")+" วัน")+n("<b>8. อัตราค่าปรับ</b> ให้เป็นไปตามข้อกำหนดในเอกสารราชการต้นฉบับ")+n("<b>9. การรับประกันความชำรุดบกพร่อง</b> "+mark("warranty"))+n("<b>10. เกณฑ์พิจารณาผลการยื่นข้อเสนอ</b> โดยใช้เกณฑ์ราคา")+n("<b>11. หน่วยงานที่รับผิดชอบ</b> "+school())+n("ลงชื่อ................................ ผู้จัดทำ TOR ("+mark("specPreparer")+")");
 if(i===5)body=memoHead("รายงานขอ"+officialType())+n("ด้วย"+esc(dept())+"มีความประสงค์จะ"+title+" เพื่อใช้ในกิจกรรม "+mark("activity")+" ภายใต้โครงการ "+mark("project")+" โดยมีรายละเอียดดังนี้")+n("1. เหตุผลและความจำเป็น: "+mark("purpose"))+n("2. รายละเอียดงาน: "+title)+n("3. ราคากลาง "+price+" บาท")+n("4. วงเงินที่จะขอ"+officialType()+"ครั้งนี้ "+budget+" บาท")+n("5. กำหนดดำเนินการ "+mark("deliveryDays")+" วัน")+n("6. จัดหาโดยวิธี "+mark("procurementMethod"))+n("7. เกณฑ์การพิจารณาคัดเลือกข้อเสนอ: เกณฑ์ราคา")+n("8. เห็นควรแต่งตั้ง "+mark("inspector")+" เป็นผู้ตรวจรับพัสดุ")+n("จึงเรียนมาเพื่อโปรดพิจารณา")+signPair()+directorSign();
 if(i===6)body='<h3>รายละเอียดแนบท้ายบันทึกข้อความ ที่ '+mark("memoNo")+'</h3>'+n("งาน"+title+" จำนวน "+state.items.length+" รายการ　"+esc(dept()))+itemTable()+signPair();
 if(i===7)body=memoHead("รายงานผลการพิจารณาและขออนุมัติสั่ง"+officialType())+n("ตามที่ได้เห็นชอบให้ดำเนินการ"+title+" วงเงิน "+budget+" บาทนั้น")+n("เจ้าหน้าที่ได้เจรจาตกลงราคากับ "+mark("vendor")+" ซึ่งเสนอราคาเป็นเงิน "+agreement+" บาท")+n("จึงเห็นควรดำเนินการจัด"+officialType()+"จากผู้เสนอราคารายดังกล่าว กำหนดส่งมอบ "+mark("deliveryDate"))+n("จึงเรียนมาเพื่อโปรดพิจารณาอนุมัติ")+signPair()+directorSign();
 if(i===8)body='<h2>ใบตรวจรับพัสดุ</h2>'+n("ตามระเบียบกระทรวงการคลังว่าด้วยการจัดซื้อจัดจ้างและการบริหารพัสดุภาครัฐ")+n(school()+"　วันที่ "+mark("receiptDate"))+n("ตามที่โรงเรียนได้ดำเนินการ"+title+" จาก "+mark("vendor")+" และกำหนดส่งมอบ "+mark("deliveryDate"))+n("ผู้ขาย/ผู้รับจ้างส่งมอบตามใบส่งของ/ใบแจ้งหนี้ เลขที่ "+mark("invoiceNo")+" ลงวันที่ "+mark("invoiceDate"))+n("ผู้ตรวจรับได้ตรวจรับเมื่อวันที่ "+mark("receiptDate")+" และให้ผู้ขาย/ผู้รับจ้างได้รับเงินตามผลการตรวจรับในวงเงิน "+agreement+" บาท")+n("ลงชื่อ................................ ผู้ตรวจรับ ("+mark("inspector")+")")+signPair()+directorSign();
 if(i===9)body=memoHead("รายงานผลการตรวจรับและอนุมัติเบิกจ่ายเงิน","receiptDate")+n("ตามที่"+esc(dept())+"ได้จัด"+officialType()+" "+title+" จาก "+mark("vendor")+" และได้ตรวจรับพัสดุวันที่ "+mark("receiptDate")+" เรียบร้อยแล้ว")+n("เลขที่ใบส่งของ/ใบแจ้งหนี้ "+mark("invoiceNo")+" ลงวันที่ "+mark("invoiceDate"))+'<table><tbody><tr><td>จำนวนเงินก่อนภาษี</td><td>'+fmt(v("beforeVat"))+' บาท</td></tr><tr><td>บวก ภาษีมูลค่าเพิ่ม</td><td>'+fmt(v("vat"))+' บาท</td></tr><tr><td>รวม</td><td>'+agreement+' บาท</td></tr><tr><td>หัก ภาษี ณ ที่จ่าย</td><td>'+fmt(v("withholding"))+' บาท</td></tr><tr><td>ค่าปรับ</td><td>'+fmt(v("fine"))+' บาท</td></tr><tr><th>สุทธิเสนอเบิก (คำนวณเบื้องต้น)</th><th>'+fmt(Number(v("agreedPrice")||0)-Number(v("withholding")||0)-Number(v("fine")||0))+' บาท</th></tr></tbody></table>'+n("จึงเรียนมาเพื่อโปรดทราบผลตรวจรับและขออนุมัติเบิกจ่ายต่อไป")+signPair()+directorSign();
 if(i===10)body='<h2>ใบเบิกพัสดุ</h2>'+n("ส่วนราชการ "+school()+"　วันที่ "+mark("requisitionDate"))+n("ข้าพเจ้าขอเบิกสิ่งของตามรายการต่อไปนี้ เพื่อใช้ใน "+esc(dept()))+itemTable()+n("ได้มอบให้................................ เป็นผู้รับแทน")+n("ลงชื่อ................................ ผู้เบิก ("+mark("requester")+") ตำแหน่ง "+mark("requesterPosition"))+n("ลงชื่อ................................ ผู้มอบ　ลงชื่อ................................ ผู้รับของ")+n("ลงชื่อ................................ ผู้สั่งจ่าย");
return '<article class="sheet" data-page="'+i+'">'+body+'<div class="pageTag">เอกสารชุดแรก | หน้า '+i+' / 10 | แบบจัดพิมพ์สำหรับตรวจทาน (ยังไม่ใช่เอกสารลงนาม)</div></article>';
}
function fieldMarkup(f){let [key,label,def,type="text",opts]=f;return '<label class="'+(type==="textarea"?"wide":"")+'">'+esc(label)+(type==="select"?'<select data-key="'+key+'">'+opts.map(([value,title])=>'<option value="'+esc(value)+'" '+(v(key)===value?"selected":"")+'>'+esc(title)+'</option>').join("")+'</select>':type==="textarea"?'<textarea data-key="'+key+'">'+esc(v(key))+'</textarea>':'<input data-key="'+key+'" type="'+type+'" '+(type==="number"?'min="0" step="any"':'')+' value="'+esc(v(key))+'">')+'</label>'}
function renderInputs(){ $("commonFields").innerHTML=commonFields.map(fieldMarkup).join("");$("specificFields").innerHTML=specificFields.map(f=>sections.has(f[0])?'<div class="sectiontitle">'+esc(f[1])+'</div>':fieldMarkup(f)).join("");
document.querySelectorAll("[data-key]").forEach(el=>el.oninput=()=>{state.values[el.dataset.key]=el.value;renderPaper();renderTotals();});}
function renderItems(){ $("itemsRows").innerHTML=state.items.map((r,i)=>'<div class="itemRow"><strong>รายการที่ '+(i+1)+'</strong><div class="rowgrid">'+[["description","ชื่อรายการพัสดุ"],["quantity","จำนวน"],["unit","หน่วยนับ"],["unitPrice","ราคาต่อหน่วย"]].map(([k,name])=>'<label>'+name+'<input data-item="'+i+'" data-col="'+k+'" value="'+esc(r[k])+'" '+(["quantity","unitPrice"].includes(k)?'type="number" min="0" step="any"':'')+'></label>').join("")+'</div><button data-remove="'+i+'" class="secondary">ลบรายการ</button></div>').join("");document.querySelectorAll("[data-item]").forEach(el=>el.oninput=()=>{state.items[Number(el.dataset.item)][el.dataset.col]=el.value;renderPaper();renderTotals()});document.querySelectorAll("[data-remove]").forEach(el=>el.onclick=()=>{if(state.items.length===1)return;state.items.splice(Number(el.dataset.remove),1);renderItems();renderPaper()});renderTotals()}
function renderTotals(){$("itemTotals").innerHTML='รวมมูลค่ารายการพัสดุที่กรอก: <b>'+fmt(total())+' บาท</b>　(โปรดตรวจเทียบวงเงินงาน '+fmt(v("budget"))+' บาท)'}
function renderPaper(){$("paperLabel").textContent="ตัวอย่างเอกสาร · หน้า "+page+" / 10";$("paperHolder").innerHTML=htmlForPage(page);document.querySelectorAll("[data-page-button]").forEach(b=>b.classList.toggle("selected",Number(b.dataset.pageButton)===page))}
function goStage(target){step=target;document.querySelectorAll(".stage").forEach(el=>el.hidden=el.id!==target);document.querySelectorAll("[data-stage]").forEach(el=>el.classList.toggle("selected",el.dataset.stage===target));if(target==="review")renderReview()}
function goPage(n){page=Math.min(10,Math.max(1,n));renderPaper();if(sourceMode==="source"&&sourceUrl){$("sourceViewer").src=sourceUrl+"#page="+page+"&view=FitH";referenceMessage("ต้นฉบับจริงจาก Firebase Storage • หน้า "+page+" / 10")}}
function renderReview(){$("reviewPages").innerHTML=pages.map((title,i)=>'<label class="reviewRow"><input type="checkbox" data-print-page="'+(i+1)+'" '+(state.selected.includes(i+1)?"checked":"")+'><span>หน้า '+(i+1)+' — '+esc(title)+'</span><button type="button" class="secondary" data-jump="'+(i+1)+'">ดูหน้า</button></label>').join("");document.querySelectorAll("[data-print-page]").forEach(el=>el.onchange=()=>{const n=Number(el.dataset.printPage);state.selected=el.checked?[...new Set([...state.selected,n])]:state.selected.filter(x=>x!==n)});document.querySelectorAll("[data-jump]").forEach(el=>el.onclick=e=>{e.preventDefault();goPage(Number(el.dataset.jump))});const mandatory=[["project","ชื่อโครงการ"],["subject","ชื่องานจัดซื้อ"],["budget","วงเงิน"],["requestDate","วันที่เริ่มเรื่อง"],["procOfficer","เจ้าหน้าที่"],["headOfficer","หัวหน้าเจ้าหน้าที่"],["director","ผู้อำนวยการ"],["specPreparer","ผู้จัดทำ TOR"],["vendor","ชื่อผู้ขาย"],["inspector","ผู้ตรวจรับ"]].filter(([k])=>!v(k));$("missing").textContent=mandatory.length?"ข้อมูลที่ควรตรวจให้ครบก่อนพิมพ์: "+mandatory.map(x=>x[1]).join(" • "):"ข้อมูลหลักครบตามรายการตรวจเบื้องต้นแล้ว (ต้องอ่านตรวจถ้อยคำทุกหน้าก่อนนำไปใช้จริง)";}
function saveDraft(){try{const key="schoolProcurementDraft:"+user.uid;localStorage.setItem(key,JSON.stringify({...state,savedAt:new Date().toISOString()}));$("banner").textContent="บันทึกร่างไว้ในเบราว์เซอร์เครื่องนี้แล้ว (ยังไม่ได้บันทึกลง Firestore)";}catch(e){$("banner").textContent="ไม่สามารถบันทึกร่างในเบราว์เซอร์ได้: "+e.message}}
function loadDraft(){try{const data=JSON.parse(localStorage.getItem("schoolProcurementDraft:"+user.uid)||"null");if(data?.values&&Array.isArray(data.items)){state=data;state.selected=state.selected||[1,2,3,4,5,6,7,8,9,10]}}catch(e){}}
$("saveBtn").onclick=saveDraft;$("previewBtn").onclick=()=>goStage("review");
$("addItem").onclick=()=>{state.items.push({description:"",quantity:"",unit:"",unitPrice:""});renderItems();renderPaper()};
$("selectAll").onclick=()=>{state.selected=Array.from({length:10},(_,i)=>i+1);renderReview()};
$("selectNone").onclick=()=>{state.selected=[];renderReview()};
$("printSelected").onclick=()=>{if(!state.selected.length){alert("กรุณาเลือกอย่างน้อย 1 หน้า");return}renderReview();$("printArea").innerHTML=state.selected.slice().sort((a,b)=>a-b).map(htmlForPage).join("");window.print()};
$("prev").onclick=()=>goPage(page-1);$("next").onclick=()=>goPage(page+1);
document.querySelectorAll("[data-stage]").forEach(btn=>btn.onclick=()=>goStage(btn.dataset.stage));
$("pageNav").innerHTML=pages.map((title,i)=>'<button class="pageButton" data-page-button="'+(i+1)+'" type="button"><b>หน้า '+(i+1)+'</b>'+esc(title)+'</button>').join("");
document.querySelectorAll("[data-page-button]").forEach(btn=>btn.onclick=()=>goPage(Number(btn.dataset.pageButton)));
const configured=Boolean(firebaseConfig.apiKey&&firebaseConfig.projectId);
if(!configured){$("banner").textContent="ยังไม่มี Firebase config";}else{
const app=initializeApp(firebaseConfig),auth=getAuth(app);db=getFirestore(app);sourceStorage=getStorage(app);
onAuthStateChanged(auth,async u=>{user=u;if(!u&&sourceUrl){URL.revokeObjectURL(sourceUrl);sourceUrl=null;$("sourceViewer").src="about:blank"}
if(!u){$("banner").textContent="กรุณาเข้าสู่ระบบ School Procurement ก่อนเปิดหน้านี้";$("login-state").textContent="ยังไม่ได้เข้าสู่ระบบ";$("editorRoot").hidden=true;return}
try{const d=await getDoc(doc(db,"procurement_users",u.uid));if(!d.exists())throw Error("ไม่พบบัญชีที่ได้รับสิทธิ์");profile=d.data();if(!["admin","staff"].includes(profile.role))throw Error("สิทธิ์ผู้ใช้งานไม่ถูกต้อง");loadDraft();renderInputs();renderItems();renderPaper();$("editorRoot").hidden=false;$("banner").textContent="เอกสารชุดแรก: กรอกข้อมูล ไม่ต้องอัปโหลดไฟล์ • ร่างยังเก็บเฉพาะเครื่องนี้ • ตรวจต้นฉบับก่อนใช้งานจริง";$("login-state").textContent=profile.displayName||u.email;}
catch(e){$("banner").textContent="ตรวจสิทธิ์ไม่สำเร็จ: "+(e.code||e.message);$("editorRoot").hidden=true}
});
}
