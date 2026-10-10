"use strict";
/* Public-safe transcription of the user supplied 10-page PDF.
   Names, signatures, company identities are intentionally not published. */
const documentPages=[
{n:1,title:"บันทึกมอบหมายผู้กำหนดคุณลักษณะ",stage:"เริ่มต้น",summary:"ขออนุมัติมอบหมายผู้กำหนดรายละเอียดคุณลักษณะเฉพาะสำหรับการซื้อน้ำมันรถรับ–ส่งนักเรียน",fields:["school","authority","requestDate","subject","fiscalYear","projectName","activity","purpose","budget","specPreparer","procOfficer","headOfficer","director"],fixed:["หัวเรื่อง บันทึกข้อความ","ข้อความอ้างอิงระเบียบเกี่ยวกับการมอบหมายผู้กำหนดคุณลักษณะ","บรรทัดลงชื่อเจ้าหน้าที่ หัวหน้าเจ้าหน้าที่ และผู้อำนวยการ"],issues:["ชื่อผู้จัดทำคุณลักษณะต้องตรงกับเอกสาร TOR หน้า 2–4","ตำแหน่งข้อความวันที่และวงเงินมีหลายจุด ใช้ข้อมูลกลาง"]},
{n:2,title:"บันทึกขอความเห็นชอบ TOR",stage:"กำหนดรายละเอียด",summary:"รายงานการจัดทำขอบเขตงาน และเสนอให้เห็นชอบรายละเอียดคุณลักษณะของพัสดุ",fields:["school","authority","requestDate","subject","specPreparer","procOfficer","headOfficer","director","torDocumentDate","referenceNo"],fixed:["หัวข้อ ความเดิม / ข้อเท็จจริง / ข้อพิจารณา","ข้อความเสนอเพื่อให้ความเห็นชอบคุณลักษณะ","พื้นที่ลงนามของผู้จัดทำ เจ้าหน้าที่ หัวหน้าเจ้าหน้าที่และผู้อนุมัติ"],issues:["เลขที่บันทึกยังเป็นช่องว่างในต้นฉบับ","วันที่อ้างอิงบันทึกมอบหมายต้องเชื่อมจากหน้า 1"]},
{n:3,title:"TOR — ขอบเขตงาน (หน้า 1)",stage:"กำหนดรายละเอียด",summary:"หลักการและเหตุผล วงเงิน ราคากลาง สถานที่ส่งมอบ และคุณสมบัติของผู้เสนอราคา",fields:["procurementType","subject","itemCount","projectName","purpose","budget","referencePrice","budgetSource","deliveryPlace"],fixed:["ข้อ 5 คุณสมบัติของผู้เสนอราคา 5.1–5.10 เป็นข้อความแม่แบบ","ข้อความเกี่ยวกับการพิจารณาคุณสมบัติผู้เสนอราคา"],issues:["ตัวเลือกซื้อ/จ้างต้องสอดคล้องทั้งชุด","ข้อความกฎหมายและคุณสมบัติให้เก็บตามแม่แบบ ไม่แทนที่ด้วยข้อความทั่วไป"]},
{n:4,title:"TOR — ตารางและเงื่อนไข (หน้า 2)",stage:"กำหนดรายละเอียด",summary:"ตารางรายละเอียดพัสดุ ราคาและภาษี กำหนดส่งมอบ ค่าปรับ รับประกัน และเกณฑ์พิจารณา",fields:["items","referencePrice","budget","vatBase","vat","deliveryDays","penalty","warranty","deliveryPlace","specPreparer"],fixed:["โครงตารางพัสดุและช่องกรอกราคา","ข้อความเงื่อนไขการเสนอราคา ค่าปรับ การรับประกัน และเกณฑ์ราคา"],issues:["ค่าจำนวน/หน่วย/ราคาที่พิมพ์ในตารางมีความกำกวม ต้องยืนยันก่อนคำนวณ","ระบุระยะส่งมอบ 33 วัน ส่วนวันส่งมอบจริงต้องตรวจความสอดคล้อง","อย่าเติม VAT จากยอดรวมโดยคาดเดาเอง"]},
{n:5,title:"รายงานขอซื้อ",stage:"ขออนุมัติ",summary:"เหตุผลและความจำเป็น ราคากลาง วงเงิน วิธีจัดซื้อ ระยะเวลาดำเนินการ และเสนอผู้ตรวจรับ",fields:["school","authority","requestDate","department","subject","projectName","activity","purpose","referencePrice","budget","deliveryDays","procurementMethod","inspector","procOfficer","headOfficer","director"],fixed:["หัวข้อบันทึกข้อความและข้อความเสนออนุมัติ","ข้อความอ้างอิงการจัดซื้อโดยวิธีเฉพาะเจาะจง"],issues:["ในข้อความบางส่วนใช้คำว่า 'จ้าง' ทั้งที่หัวเรื่องเป็นรายงานขอซื้อ","ชื่อฝ่ายในหน้า 5 เป็นฝ่ายบริหารทั่วไป แต่หน้า 1 มีคำขึ้นต้นต่างออกไป ควรยืนยันเจ้าของงาน"]},
{n:6,title:"บัญชีรายการพัสดุแนบท้าย",stage:"ขออนุมัติ",summary:"รายละเอียดแนบท้ายบันทึกพร้อมตารางพัสดุและพื้นที่ลงนาม",fields:["requestDate","referenceNo","department","school","itemCount","items","budget","amountWords","procOfficer","headOfficer"],fixed:["ตารางพัสดุหลายคอลัมน์ตามต้นฉบับ","พื้นที่ลงชื่อเจ้าหน้าที่และหัวหน้าเจ้าหน้าที่"],issues:["หน่วยนับในตารางไม่ชัดเจน ต้องแยกจำนวน หน่วย และราคาให้เป็นคนละช่อง","ตารางควรเลือกได้ว่าจะกรอกในเว็บหรือเว้นเขียนด้วยมือ"]},
{n:7,title:"รายงานผลพิจารณาและอนุมัติสั่งซื้อ",stage:"คัดเลือก",summary:"สรุปการเจรจาตกลงราคากับผู้ขาย และเสนออนุมัติสั่งซื้อ",fields:["requestDate","subject","budget","amountWords","vendor","agreedPrice","procurementMethod","deliveryDate","procOfficer","headOfficer","director"],fixed:["หัวเรื่องบันทึกข้อความ","ข้อความรายงานผลการพิจารณาตามแม่แบบ","ช่องลงนามและคำสั่งอนุมัติ"],issues:["ราคาตกลงซื้ออาจไม่เท่ากับวงเงินตั้งต้น จึงต้องเก็บคนละฟิลด์","ชื่อผู้ขายต้องยึดทะเบียนร้านค้าเดียวกันทุกหน้า"]},
{n:8,title:"ใบตรวจรับพัสดุ",stage:"ตรวจรับ",summary:"อ้างอิงคำขอซื้อ ผู้ขาย การส่งมอบ การตรวจรับ ค่าปรับ และจำนวนเงินที่จะรับ",fields:["school","subject","vendor","referenceNo","requestDate","deliveryDate","invoiceNo","invoiceDate","receiptDate","agreedPrice","penaltyAmount","inspector","procOfficer","headOfficer","director"],fixed:["หัวข้อใบตรวจรับพัสดุและข้อความรายงานผลตรวจรับ","พื้นที่ลายมือชื่อผู้ตรวจรับ ผู้เสนอ และผู้รับทราบ"],issues:["ใบส่งของและเลขที่อ้างอิงบางช่องยังเว้นว่าง","ยอดที่ควรได้รับในเอกสารไม่ใช่หลักฐานว่าเบิกจ่ายจริงแล้ว","วันตรวจรับและวันส่งมอบต้องแยกกัน"]},
{n:9,title:"รายงานผลตรวจรับและอนุมัติเบิกจ่าย",stage:"เบิกจ่าย",summary:"สรุปผู้ขาย เอกสารอ้างอิง ยอดก่อน VAT ภาษี หัก ณ ที่จ่าย ค่าปรับ และยอดเสนอเบิก",fields:["department","subject","vendor","requestDate","invoiceNo","invoiceDate","receiptDate","vatBase","vat","agreedPrice","withholding","penaltyAmount","netPayment","procOfficer","headOfficer","director"],fixed:["หัวเรื่องรายงานผลตรวจรับและอนุมัติเบิกจ่ายเงิน","โครงตารางคำนวณจำนวนเงิน ภาษี และยอดหัก"],issues:["ในต้นฉบับยอดก่อนภาษี 1,831.78 + VAT 128.22 = 1,960 บาท","ชื่อร้านค้าสะกดต่างกันระหว่างหน้า 7 กับหน้า 9","ช่องคงเหลือในตัวอย่างเป็นเครื่องหมายขีด ไม่ควรตีความว่าได้รับเงินแล้ว"]},
{n:10,title:"ใบเบิกพัสดุ",stage:"เบิกพัสดุ",summary:"ตารางเบิกใช้พัสดุ จำนวน หน่วย ฝ่ายผู้ใช้ และช่องลงลายมือชื่อ",fields:["school","department","requisitionDate","items","requester","requesterPosition"],fixed:["ตารางลำดับที่ รายการ จำนวน หมายเหตุ","ช่องผู้มอบ ผู้รับแทน ผู้เบิก ผู้รับของ และผู้สั่งจ่าย"],issues:["ตารางใบเบิกมีหลายแถวว่าง ควรคงไว้","วันที่ใบเบิกต้องแยกจากวันที่ตรวจรับ","ข้อมูลผู้เบิกและผู้รับของไม่ใช่บุคคลเดียวกันเสมอ"]}
];
const fieldCatalog=[
["school","ชื่อโรงเรียน","โรงเรียนค่ายบางระจันวิทยาคม","ข้อมูลโรงเรียน"],["authority","หน่วยงานต้นสังกัด","สพม.สิงห์บุรี อ่างทอง","ข้อมูลโรงเรียน"],
["department","ฝ่ายเจ้าของงาน","ฝ่ายบริหารทั่วไป (พบในหน้า 5, 6, 9, 10)","ข้อมูลงาน"],
["fiscalYear","ปีงบประมาณ","2569","โครงการ"],["projectName","ชื่อโครงการหลัก","โครงการรถรับ–ส่งนักเรียน","โครงการ"],
["activity","ชื่อกิจกรรม","ค่าน้ำมันเชื้อเพลิงรถรับ–ส่งนักเรียน","โครงการ"],
["purpose","เหตุผลและวัตถุประสงค์","จัดซื้อน้ำมันเชื้อเพลิงเพื่อใช้กับรถรับ–ส่งนักเรียน","ข้อมูลงาน"],
["procurementType","ซื้อหรือจ้าง","จัดซื้อ","ข้อมูลงาน"],["subject","ชื่อเรื่องจัดซื้อ","น้ำมันเชื้อเพลิงรถรับ–ส่งนักเรียน","ข้อมูลงาน"],
["itemCount","จำนวนรายการพัสดุ","1 รายการ","รายการพัสดุ"],["items","รายละเอียดพัสดุ","น้ำมันเชื้อเพลิงรถรับ–ส่งนักเรียน (หน่วย/ปริมาณต้องตรวจ)","รายการพัสดุ"],
["budget","วงเงินงบประมาณของงาน","1,960.00 บาท","การเงิน"],["referencePrice","ราคากลาง","1,960.00 บาท","การเงิน"],
["agreedPrice","ราคาตกลงสั่งซื้อ","1,960.00 บาท","การเงิน"],["amountWords","จำนวนเงินเป็นตัวอักษร","หนึ่งพันเก้าร้อยหกสิบบาทถ้วน","การเงิน"],
["vatBase","มูลค่าก่อน VAT","1,831.78 บาท","การเงิน"],["vat","VAT","128.22 บาท","การเงิน"],
["withholding","ภาษีหัก ณ ที่จ่าย","ไม่ระบุจำนวนที่ยืนยันได้","การเงิน"],
["penaltyAmount","ค่าปรับ","ช่องในต้นฉบับเป็นขีด","การเงิน"],["netPayment","ยอดเสนอเบิกสุทธิ","ต้องยืนยันจากผู้รับผิดชอบ","การเงิน"],
["requestDate","วันที่เริ่มเรื่อง","2 มีนาคม 2569","วันที่"],["torDocumentDate","วันที่เอกสาร TOR","2 มีนาคม 2569","วันที่"],
["deliveryDate","กำหนดส่งมอบ","3 เมษายน 2569","วันที่"],["receiptDate","วันที่ตรวจรับ","3 เมษายน 2569","วันที่"],["invoiceDate","วันที่ใบส่งของ/ใบแจ้งหนี้","3 เมษายน 2569 (หน้า 8)","วันที่"],
["requisitionDate","วันที่ใบเบิกพัสดุ","3 เมษายน 2569","วันที่"],["deliveryDays","ระยะเวลาส่งมอบ","33 วัน (หน้า 4 และ 5)","วันที่"],
["referenceNo","เลขที่เอกสารอ้างอิง","หลายช่องยังว่างในต้นฉบับ","เลขที่เอกสาร"],["invoiceNo","เลขที่ใบแจ้งหนี้/ใบส่งของ","ยังไม่ระบุในต้นฉบับ","เลขที่เอกสาร"],
["budgetSource","แหล่งงบประมาณ","ทำเครื่องหมายตามแผนปฏิบัติราชการ","โครงการ"],
["deliveryPlace","สถานที่ส่งมอบ","โรงเรียนค่ายบางระจันวิทยาคม","ข้อมูลงาน"],
["procurementMethod","วิธีจัดซื้อ","เฉพาะเจาะจง","ข้อมูลงาน"],
["specPreparer","ผู้จัดทำคุณลักษณะ","บุคลากรที่ได้รับมอบหมาย (ปิดบังชื่อ)","บุคลากร"],
["procOfficer","เจ้าหน้าที่พัสดุ","เจ้าหน้าที่ (ปิดบังชื่อ)","บุคลากร"],["headOfficer","หัวหน้าเจ้าหน้าที่","หัวหน้าเจ้าหน้าที่ (ปิดบังชื่อ)","บุคลากร"],
["director","ผู้อนุมัติ","ผู้อำนวยการ (ปิดบังชื่อ)","บุคลากร"],["inspector","ผู้ตรวจรับพัสดุ","ผู้ตรวจรับ (ปิดบังชื่อ)","บุคลากร"],
["vendor","ผู้ขาย/ผู้รับจ้าง","ผู้จำหน่าย (ปิดบังชื่อ)","ผู้ขาย"],
["requester","ผู้เบิกพัสดุ","ผู้เบิก (ปิดบังชื่อ)","บุคลากร"],["requesterPosition","ตำแหน่งผู้เบิก","ครู","บุคลากร"],
["penalty","หลักเกณฑ์ค่าปรับ","ตามข้อความแม่แบบหน้า 4","เงื่อนไข"],["warranty","ระยะเวลารับประกัน","เว้นช่องว่างในต้นฉบับ","เงื่อนไข"]
];
let analysisCurrentPage=1;
let analysisPdfUrl=null,analysisPdfBlob=null;
const analysisEl=id=>document.getElementById(id);
const analysisEscape=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const pageCountForField=id=>documentPages.filter(p=>p.fields.includes(id)).map(p=>p.n);
function analysisGoPage(page){
 analysisCurrentPage=Math.min(10,Math.max(1,Number(page)||1));
 const p=documentPages[analysisCurrentPage-1];
 analysisEl("analysisPageTitle").textContent="หน้า "+p.n+" — "+p.title;
 analysisEl("analysisStage").textContent=p.stage;
 analysisEl("analysisSummary").textContent=p.summary;
 analysisEl("analysisSelectedCount").textContent=p.fields.length+" ช่อง";
 analysisEl("analysisFieldRows").innerHTML=p.fields.map(key=>{
 const f=fieldCatalog.find(x=>x[0]===key); if(!f)return "";
 const appearances=pageCountForField(key);
 return '<div class="analysis-item"><small>'+analysisEscape(f[3])+' · '+analysisEscape(key)+ (appearances.length>1?' <span class="analysis-label">ใช้ซ้ำ '+appearances.length+' หน้า</span>':'')+'</small><b>'+analysisEscape(f[1])+'</b><span>'+analysisEscape(f[2])+'</span></div>';
 }).join("");
 analysisEl("analysisFixed").innerHTML=p.fixed.map(s=>'<div class="analysis-item">'+analysisEscape(s)+'</div>').join("");
 analysisEl("analysisIssues").innerHTML=p.issues.map(s=>'<div class="analysis-warning">'+analysisEscape(s)+'</div>').join("");
 document.querySelectorAll(".pagepick").forEach(b=>b.classList.toggle("is-current",Number(b.dataset.n)===p.n));
 analysisEl("analysisPageNo").textContent=p.n+" / 10";
 if(analysisPdfUrl){analysisEl("analysisViewer").src=analysisPdfUrl+"#page="+p.n+"&view=FitH";analysisEl("analysisPdfEmpty").classList.add("hidden");analysisEl("analysisViewer").classList.remove("hidden")}
}
function analysisPickPdf(input){
const file=input.files?.[0];if(!file)return;
if(!file.name.toLowerCase().endsWith(".pdf")&&file.type!=="application/pdf"){alert("กรุณาเลือกไฟล์ PDF");return}
if(analysisPdfUrl)URL.revokeObjectURL(analysisPdfUrl);
analysisPdfBlob=file;analysisPdfUrl=URL.createObjectURL(file);
analysisEl("analysisPdfStatus").textContent="เปิดไฟล์: "+file.name+" (เฉพาะเครื่องนี้ ไม่อัปโหลดขึ้นเว็บ)";
analysisEl("analysisPdfDownload").disabled=false;
analysisGoPage(analysisCurrentPage);
}
function analysisDownloadPdf(){if(!analysisPdfUrl)return;const a=document.createElement("a");a.href=analysisPdfUrl;a.download=analysisPdfBlob.name||"document.pdf";a.click()}
function analysisClearPdf(){if(analysisPdfUrl)URL.revokeObjectURL(analysisPdfUrl);analysisPdfUrl=null;analysisPdfBlob=null;analysisEl("analysisViewer").src="about:blank";analysisEl("analysisViewer").classList.add("hidden");analysisEl("analysisPdfEmpty").classList.remove("hidden");analysisEl("analysisPdfStatus").textContent="ยังไม่ได้เลือกไฟล์ PDF";analysisEl("analysisPdfDownload").disabled=true;analysisEl("analysisPdfInput").value=""}
function analysisAllFields(){
analysisEl("analysisFieldCatalog").innerHTML=fieldCatalog.map(f=>'<tr><td><code>'+analysisEscape(f[0])+'</code></td><td><b>'+analysisEscape(f[1])+'</b></td><td>'+analysisEscape(f[3])+'</td><td>'+analysisEscape(f[2])+'</td><td>'+pageCountForField(f[0]).map(n=>'<button class="link" onclick="analysisGoPage('+n+')">'+n+'</button>').join(", ")+'</td></tr>').join("");
analysisEl("analysisFieldTotal").textContent=fieldCatalog.length;
}
function analysisInit(){
const sb=analysisEl("analysisSidebar");
sb.innerHTML=documentPages.map(p=>'<button class="pagepick" data-n="'+p.n+'" onclick="analysisGoPage('+p.n+')"><small>หน้า '+p.n+' · '+analysisEscape(p.stage)+'</small><strong>'+analysisEscape(p.title)+'</strong></button>').join("");
analysisAllFields();analysisGoPage(1);
}
analysisInit();
