"use strict";
const fields={
 shared:[["school","ชื่อโรงเรียน","โรงเรียนค่ายบางระจันวิทยาคม"],["agency","ต้นสังกัด","สำนักงานเขตพื้นที่การศึกษามัธยมศึกษาสิงห์บุรี อ่างทอง"],["division","ฝ่ายผู้ขอซื้อ","ฝ่ายบริหารวิชาการ"],["subject","ชื่องานจัดซื้อ","วัสดุอุปกรณ์ทำสนามกีฬา","textarea"],["project","ชื่อโครงการ","จัดซื้อสื่อและวัสดุอุปกรณ์การเรียนการสอน เพื่อยกระดับผลสัมฤทธิ์ทางการเรียน","textarea"],["activity","ชื่อกิจกรรม","จัดซื้อสื่อและวัสดุอุปกรณ์การเรียนการสอน เพื่อยกระดับผลสัมฤทธิ์ทางการเรียน","textarea"],["year","ปีงบประมาณ","2569"],["budget","วงเงิน (บาท)","140","number"],["amountWords","จำนวนเงินตัวอักษร","หนึ่งร้อยสี่สิบบาทถ้วน"],["requestDate","วันที่บันทึก","2026-08-24","date"],["memoNo","เลขที่บันทึก",""],["itemName","ชื่อรายการพัสดุ","สีน้ำมันตราเป็ดหงส์"],["quantity","จำนวน","1","number"],["unit","หน่วย","กระป๋อง"],["unitPrice","ราคาต่อหน่วย","140","number"]],
 people:[["preparer","ผู้จัดทำ TOR","นางสาวสุนิสา อิ่มรัง"],["preparerPosition","ตำแหน่ง","ครู"],["officer","เจ้าหน้าที่พัสดุ","นางสาวณัฐมน กลิ่นผล"],["headOfficer","หัวหน้าเจ้าหน้าที่","นางสาวสุนิสา อิ่มรัง"],["inspector","ผู้ตรวจรับพัสดุ","นางสาวปภาวิไล ชลอวงษ์"],["activityDate","วันจัดกิจกรรม","2026-08-27","date"],["reason","เหตุผลและความจำเป็น","เพื่อใช้ในการจัดกิจกรรมตามโครงการ","textarea"],["deliveryDays","กำหนดส่งมอบ (วัน)","3","number"],["warranty","ระยะเวลารับประกัน",""]],
 vendorFields:[["vendor","ชื่อผู้ขาย / ผู้รับจ้าง","บริษัท ศรีทอง วัสดุก่อสร้าง จำกัด","textarea"],["purchaseMethod","วิธีจัดซื้อ","เฉพาะเจาะจง"],["agreedPrice","ราคาที่ตกลง (บาท)","140","number"],["noticeDate","วันประกาศผู้ชนะ","2026-08-25","date"],["deliveryDate","วันครบกำหนดส่งมอบ","2026-08-26","date"],["orderDate","วันสั่งซื้อ","2026-08-24","date"],["orderNo","เลขใบสั่งซื้อ",""],["deliveryPlace","สถานที่ส่งมอบ","โรงเรียนค่ายบางระจันวิทยาคม"]],
 settlement:[["receiptDate","วันที่ตรวจรับ","2026-08-26","date"],["invoiceNo","เลขใบส่งของ","ORNC69P0100821"],["invoiceBook","เล่มที่",""],["invoiceDate","วันใบส่งของ","2026-08-26","date"],["vat","ภาษีมูลค่าเพิ่ม","0","number"],["withholding","หัก ณ ที่จ่าย","0","number"],["fine","ค่าปรับ","0","number"],["lateDays","วันส่งมอบล่าช้า","0","number"],["requisitionDate","วันที่เบิกพัสดุ","2026-08-26","date"],["requester","ผู้เบิกพัสดุ","นางสาวสุนิสา อิ่มรัง"],["proxy","ผู้รับแทน",""],["receiver","ผู้รับของ",""],["changeNote","รายการเปลี่ยนแปลง","ไม่มี","textarea"]],
 defaults:[["director","ชื่อผู้อำนวยการในวงเล็บ","นายเรวัฒน์ พรหมสะโร"],["directorPosition","ตำแหน่งผู้อำนวยการ","ผู้อำนวยการโรงเรียนค่ายบางระจันวิทยาคม"]]
};
const all=Object.values(fields).flat();
const $=s=>document.getElementById(s);
let data=Object.fromEntries(all.map(f=>[f[0],f[2]]));
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const months=["มกราคม","กุมภาพันธ์","มีนาคม","เมษายน","พฤษภาคม","มิถุนายน","กรกฎาคม","สิงหาคม","กันยายน","ตุลาคม","พฤศจิกายน","ธันวาคม"];
function fmtDate(s){if(!/^\d{4}-\d\d-\d\d$/.test(s||""))return "...............";const a=s.split("-").map(Number);return a[2]+" "+months[a[1]-1]+" "+(a[0]+543)}
function money(s){return Number(s||0).toLocaleString("th-TH",{minimumFractionDigits:2,maximumFractionDigits:2})}
function replaceTokens(s){return s.replace(/\{\{([a-zA-Z]+)\}\}/g,(all,key)=>{if(key.endsWith("Date")||key==="requestDate")return esc(fmtDate(data[key]));if(["budget","agreedPrice","vat","fine","withholding","unitPrice"].includes(key))return esc(money(data[key]));return esc(data[key]||"................")})}
const sign='<div class="sign"><div>ลงชื่อ.....................................เจ้าหน้าที่<br>({{officer}})</div><div>ลงชื่อ.....................................หัวหน้าเจ้าหน้าที่<br>({{headOfficer}})</div></div>';
const director='<div class="sign center"><div>- เห็นชอบ / อนุมัติ<br>ลงชื่อ.......................................<br>({{director}})<br>{{directorPosition}}</div></div>';
const itemTable='<table class="table"><thead><tr><th>ลำดับ</th><th>รายละเอียดของพัสดุ</th><th>จำนวน</th><th>หน่วย</th><th>หน่วยละ</th><th>จำนวนเงิน</th></tr></thead><tbody><tr><td>1</td><td>{{itemName}}</td><td>{{quantity}}</td><td>{{unit}}</td><td>{{unitPrice}}</td><td>{{budget}}</td></tr><tr><td colspan="5">รวมเงินทั้งสิ้น</td><td>{{budget}}</td></tr></tbody></table>';
const memo=(title,date="requestDate")=>'<div class="memoHead"><div class="crest">⚜<small>ตราครุฑตัวอย่าง</small></div><div class="heading">บันทึกข้อความ</div><div class="lines"><div><b>ส่วนราชการ</b> {{school}} &nbsp; {{agency}}</div><div><b>ที่</b> {{memoNo}} <span style="float:right"><b>วันที่</b> {{'+date+'}}</span></div><div><b>เรื่อง</b> '+title+'</div><div class="rule"></div></div></div>';
const p=s=>'<p>'+s+'</p>';
const n=s=>'<p class="noindent">'+s+'</p>';
const h=s=>'<h3>'+s+'</h3>';
const center=s=>'<p class="center">'+s+'</p>';
const title=s=>'<h2>'+s+'</h2>';
const sections=[
 ["บันทึกมอบหมาย",1,memo("มอบหมายบุคลากรกำหนดรายละเอียดคุณลักษณะงานจัดซื้อ{{subject}}")+n("เรียน ผู้อำนวยการ{{school}}")+p("ด้วย{{division}} มีความประสงค์จะดำเนินการจัดซื้อ{{subject}} ตามที่ได้รับแจ้งจัดสรรงบประมาณประจำปี {{year}} ตามแผนงานโครงการ{{project}} เพื่อใช้ในกิจกรรม{{activity}} วงเงินงบประมาณ {{budget}} บาท ({{amountWords}})")+p("ดังนั้น เพื่อให้การจัดทำรายละเอียดคุณลักษณะพัสดุที่จะจัดซื้อของงานดังกล่าวเป็นไปตามระเบียบกระทรวงการคลังว่าด้วยการจัดซื้อจัดจ้างและการบริหารพัสดุภาครัฐ พ.ศ.2560 ข้อ 21 จึงเห็นสมควรมอบหมาย {{preparer}} ตำแหน่ง {{preparerPosition}} เป็นผู้จัดทำรายละเอียดคุณลักษณะเฉพาะพัสดุ ตามคำสั่งสำนักงานคณะกรรมการการศึกษาขั้นพื้นฐาน ที่ 2493/2566 ลงวันที่ 15 พฤศจิกายน 2566")+center("จึงเรียนมาเพื่อโปรดพิจารณาอนุมัติ")+sign],
 ["อนุมัติและขอเห็นชอบ TOR",0,director+title("บันทึกข้อความ")+n("ส่วนราชการ {{school}} {{agency}}")+n("วันที่ {{requestDate}}")+n("เรื่อง ขอความเห็นชอบการจัดทำขอบเขตของงานหรือรายละเอียดคุณลักษณะ")+n("เรียน ผู้อำนวยการ{{school}}")+n("เอกสารแนบ ขอบเขตของงานหรือรายละเอียดคุณลักษณะเฉพาะของพัสดุ จำนวน 1 ชุด")+h("ความเดิม")+p("ตามที่{{division}} {{school}} จะดำเนินการจัดซื้อ{{subject}} และได้มอบหมายให้ {{preparer}} จัดทำขอบเขตของงานตามบันทึกข้อความลงวันที่ {{requestDate}} แล้วนั้น")],
 ["TOR การพิจารณา",0,h("ข้อเท็จจริง")+p("{{preparer}} จัดทำขอบเขตของงานหรือรายละเอียดคุณลักษณะเฉพาะตามคำสั่งดังกล่าวเสร็จเรียบร้อยแล้ว โดยมีรายละเอียดตามที่แนบมาพร้อมนี้")+h("ข้อพิจารณา")+p("จึงเรียนมาเพื่อโปรดพิจารณาอนุมัติขอบเขตของงานหรือรายละเอียดคุณลักษณะเฉพาะ เพื่อใช้เป็นข้อมูลในการจัดซื้อจัดจ้างต่อไป")+center("จึงเรียนมาเพื่อโปรดพิจารณา")+sign+director+title("ขอบเขตของงานหรือรายละเอียดคุณลักษณะเฉพาะของพัสดุ")+n("☑ จัดซื้อ{{subject}} จำนวน {{quantity}} รายการ")],
 ["TOR หลักการและคุณสมบัติ",0,h("1. หลักการและเหตุผล หรือความจำเป็น")+p("ด้วย{{school}} ได้กำหนดให้จัดกิจกรรม{{activity}} ในวันที่ {{activityDate}} เพื่อให้บรรลุวัตถุประสงค์ของโครงการ จึงเห็นควรจัดซื้อพัสดุจำนวน {{quantity}} รายการ")+n("2. วงเงินงบประมาณ {{budget}} บาท ตามแผนปฏิบัติราชการ")+n("3. ราคากลาง {{budget}} บาท")+n("4. สถานที่ส่งมอบ/สถานที่ดำเนินการ {{deliveryPlace}}")+h("5. คุณสมบัติของผู้เสนอราคา")+n("5.1 มีความสามารถตามกฎหมาย")+n("5.2 ไม่เป็นบุคคลล้มละลาย")+n("5.3 ไม่อยู่ระหว่างเลิกกิจการ")+n("5.4 ไม่ถูกระงับการยื่นข้อเสนอหรือทำสัญญากับหน่วยงานของรัฐตามระเบียบ")+n("5.5 ไม่ถูกระบุชื่อไว้ในบัญชีผู้ทิ้งงาน")+n("5.6 มีคุณสมบัติตามที่คณะกรรมการนโยบายการจัดซื้อจัดจ้างฯ กำหนด")+n("5.7 เป็นบุคคลธรรมดาหรือนิติบุคคลผู้มีอาชีพขายพัสดุหรือรับจ้าง")+n("5.8 ไม่ได้รับเอกสิทธิ์หรือความคุ้มกันในการขึ้นศาลไทย เว้นแต่ได้รับการยกเว้นตามระเบียบ")],
 ["TOR ตารางรายการ",0,n("5.9 พัสดุที่เสนอขายต้องเป็นไปตามข้อกำหนดเรื่องพัสดุผลิตภายในประเทศ")+n("5.10 พัสดุที่ใช้งานจัดจ้างต้องเป็นไปตามข้อกำหนดการใช้พัสดุในประเทศ")+h("6. รายละเอียดคุณลักษณะเฉพาะของพัสดุ")+itemTable+h("7. การเสนอราคา และกำหนดส่งมอบ")+p("ราคาที่เสนอจะต้องกำหนดยืนราคาตามเงื่อนไขในเอกสารประกอบ โดยผู้ยื่นข้อเสนอต้องรับผิดชอบราคาที่เสนอไว้")+p("กำหนดส่งมอบไม่เกิน {{deliveryDays}} วันนับถัดจากวันลงนามในสัญญา หรือได้รับหนังสือแจ้งให้ส่งมอบพัสดุ")],
 ["TOR ค่าปรับและรับประกัน",0,h("8. อัตราค่าปรับ")+p("งานจ้างและงานซื้อให้คิดค่าปรับตามอัตราที่กำหนดไว้ในเงื่อนไขและระเบียบที่เกี่ยวข้อง")+h("9. การรับประกันความชำรุดบกพร่อง")+p("ระยะเวลารับประกันความชำรุดบกพร่อง {{warranty}} โดยผู้ขายหรือผู้รับจ้างต้องซ่อมแซมแก้ไขให้ใช้งานได้ดีดังเดิม")+h("10. เกณฑ์การพิจารณาผลการยื่นข้อเสนอ")+p("โรงเรียนจะพิจารณาตัดสินโดยใช้เกณฑ์ราคา จากราคารวมของข้อเสนอ")+h("11. หน่วยงานที่รับผิดชอบ")+p("{{school}} {{agency}}")+center("ลงชื่อ.......................................ผู้จัดทำขอบเขตของงาน")+center("({{preparer}})")],
 ["บันทึกขอซื้อ",1,memo("รายงานขอซื้อพัสดุ")+n("เรียน ผู้อำนวยการ{{school}}")+p("ด้วย{{division}} มีความประสงค์จะขอซื้อ{{subject}} จำนวน {{quantity}} รายการ เพื่อกิจกรรม{{activity}} ซึ่งได้รับอนุมัติเงินจากแผนงานโครงการ{{project}} จำนวน {{budget}} บาท")+n("1. เหตุผลและความจำเป็น {{reason}}")+n("2. รายละเอียดพัสดุตามเอกสารแนบ")+n("3. ราคากลาง {{budget}} บาท")+n("4. วงเงินขอซื้อ {{budget}} บาท ({{amountWords}})")+n("5. ต้องการใช้พัสดุภายใน {{deliveryDays}} วัน")+n("6. ซื้อโดยวิธี{{purchaseMethod}} ตามข้อกำหนดที่เกี่ยวข้อง")+n("7. พิจารณาคัดเลือกโดยเกณฑ์ราคา")+n("8. เห็นควรแต่งตั้งผู้ตรวจรับพัสดุ")+p("จึงเรียนมาเพื่อโปรดพิจารณาอนุมัติ")],
 ["อนุมัติขอซื้อและแนบท้าย",0,n("อนุมัติแต่งตั้ง {{inspector}} เป็นผู้ตรวจรับพัสดุ")+sign+director+title("รายละเอียดแนบท้ายบันทึกข้อความ")+center("งานจัดซื้อพัสดุ {{quantity}} รายการ {{division}}")+center("{{school}}")+itemTable],
 ["แนบท้ายตารางสรุป",0,itemTable+center("รวมเป็นเงินทั้งสิ้น ({{amountWords}})")+sign],
 ["พิจารณาผลการจัดซื้อ",0,center("วันที่ {{requestDate}}")+sign+title("บันทึกข้อความ")+n("ส่วนราชการ {{school}} {{agency}}")+n("เรื่อง รายงานผลการพิจารณาและขออนุมัติสั่งซื้อ")+n("เรียน ผู้อำนวยการ{{school}}")+p("ตามที่{{division}} ได้รับความเห็นชอบให้ดำเนินการจัดซื้อ{{subject}} จำนวน {{budget}} บาท ({{amountWords}}) ตามระเบียบการจัดซื้อจัดจ้างแล้วนั้น")+p("เจ้าหน้าที่ได้เจรจาตกลงราคากับ {{vendor}} ซึ่งเสนอราคา {{agreedPrice}} บาท ดังนั้นจึงเห็นควรจัดซื้อจากผู้เสนอราคารายดังกล่าว")+p("ขออนุมัติให้สั่งซื้อจาก {{vendor}} วงเงิน {{agreedPrice}} บาท กำหนดส่งมอบวันที่ {{deliveryDate}}")],
 ["อนุมัติและหัวประกาศ",0,sign+director+title("ประกาศ{{school}}")+center("เรื่อง ประกาศผู้ชนะการเสนอราคาสำหรับการจัดซื้อ{{subject}}")+center("------------------------------------------------")],
 ["ประกาศผู้ชนะ",0,p("ตาม{{school}} ได้มีโครงการ{{project}} เพื่อใช้จัดกิจกรรม{{activity}} โดยวิธี{{purchaseMethod}} นั้น")+p("ผู้ได้รับการคัดเลือกได้แก่ {{vendor}} เสนอราคาต่ำสุดเป็นเงิน {{agreedPrice}} บาท ({{amountWords}}) รวมภาษีและค่าใช้จ่ายอื่น ๆ ทั้งปวง")+center("ประกาศ ณ วันที่ {{noticeDate}}")+director],
 ["ใบตรวจรับ",0,title("ใบตรวจรับพัสดุ")+center("ตามระเบียบกระทรวงการคลังว่าด้วยการจัดซื้อจัดจ้างและการบริหารพัสดุภาครัฐ พ.ศ.2560 ข้อ 175")+n("{{school}} วันที่ {{receiptDate}}")+p("ตามที่{{division}} {{school}} ได้จัดซื้อ{{subject}} จาก {{vendor}} ตามรายงานขอซื้อลงวันที่ {{requestDate}} ครบกำหนดส่งมอบวันที่ {{deliveryDate}}")+p("ผู้ขายส่งมอบพัสดุตามใบส่งของเลขที่ {{invoiceNo}} วันที่ {{invoiceDate}}")+p("รายการแก้ไขเปลี่ยนแปลง {{changeNote}}")+p("ผู้ตรวจรับได้ตรวจรับเมื่อวันที่ {{receiptDate}} ครบถ้วนถูกต้อง โดยส่งมอบเกินกำหนด {{lateDays}} วัน ค่าปรับ {{fine}} บาท ควรจ่ายเงินให้ผู้ขายเป็นเงิน {{agreedPrice}} บาท")+p("จึงเรียนมาเพื่อโปรดทราบ ตามนัยข้อ 175 (4)")+center("ลงชื่อ.......................................ผู้ตรวจรับพัสดุ")+center("({{inspector}})")],
 ["รายงานตรวจรับและเบิกจ่าย",0,n("เรียน ผู้อำนวยการ{{school}}")+p("เพื่อโปรดทราบรายงานการตรวจรับพัสดุในการจัดซื้อ{{subject}} ได้ดำเนินการตรวจรับพัสดุเรียบร้อยแล้วตามรายงานที่แนบ")+sign+director+title("บันทึกข้อความ")+n("เรื่อง รายงานผลการตรวจรับและอนุมัติเบิกจ่ายเงิน")+n("เรียน ผู้อำนวยการ{{school}}")+p("ตามที่{{division}} ได้จัดซื้อ{{subject}} จาก {{vendor}} เป็นเงิน {{agreedPrice}} บาท ตามใบสั่งซื้อเลขที่ {{orderNo}} ลงวันที่ {{orderDate}} และมีการตรวจรับถูกต้องครบถ้วนแล้ว")],
 ["ยอดเบิกจ่าย",0,p("ผู้ตรวจรับได้ตรวจรับตามใบส่งของเลขที่ {{invoiceNo}} ลงวันที่ {{invoiceDate}} เมื่อวันที่ {{receiptDate}} จะต้องจ่ายเงินแก่ {{vendor}}")+n("จำนวนเงิน {{agreedPrice}} บาท")+n("บวก ภาษีมูลค่าเพิ่ม {{vat}} บาท")+n("หัก ภาษี ณ ที่จ่าย {{withholding}} บาท")+n("ค่าปรับ {{fine}} บาท")+center("({{amountWords}})")+p("จึงเรียนมาเพื่อโปรดทราบผลการตรวจรับและขออนุมัติเบิกจ่ายต่อไป")+sign+director],
 ["อนุมัติและใบเบิก",0,director+title("ใบเบิกพัสดุ")+n("ส่วนราชการ {{school}} วันที่ {{requisitionDate}}")+p("ข้าพเจ้าขอเบิกสิ่งของตามรายการต่อไปนี้ เพื่อใช้ใน{{division}}")+itemTable],
 ["ใบเบิกพัสดุต่อ",0,title("ใบเบิกพัสดุ (ต่อ)")+itemTable+n("ได้มอบให้ {{proxy}} เป็นผู้รับแทน")+center("ลงชื่อ.......................................ผู้เบิก ({{requester}})")+center("ลงชื่อ.......................................ผู้มอบ")+n("วันที่ {{requisitionDate}}")+center("ได้รับของครบถ้วนถูกต้อง / อนุญาตให้เบิกได้")+center("ลงชื่อ.......................................ผู้รับของ ({{receiver}})")+center("ลงชื่อ.......................................ผู้สั่งจ่าย")]
];
const KEY="procurement-fixed-17-v1";
function inputUi(){for(const [group,arr] of Object.entries(fields)){$(group).innerHTML=arr.map(([key,label,def,kind])=>'<label class="field">'+esc(label)+(kind==="textarea"?'<textarea data-k="'+key+'"></textarea>':'<input data-k="'+key+'" type="'+(kind==="date"?"date":kind==="number"?"number":"text")+'">')+'</label>').join("")}
 document.querySelectorAll("[data-k]").forEach(el=>{el.value=data[el.dataset.k]||"";el.oninput=()=>{data[el.dataset.k]=el.value;saveLocal();render()}})}
function saveLocal(){try{localStorage.setItem(KEY,JSON.stringify(data))}catch(e){}}
function render(){
 const container=$("pages");
 container.innerHTML="";
 sections.forEach(([heading,isMemo,content],i)=>{
  const page=document.createElement("article");
  page.className="page"+(isMemo?" memo":"");
  page.id="p"+(i+1);
  const template=document.createElement("template");
  template.innerHTML=replaceTokens(content);
  if(isMemo){
   const internalHeader=template.content.querySelector(".memoHead");
   if(internalHeader){internalHeader.remove();page.appendChild(internalHeader)}
  }
  const body=document.createElement("div");
  body.className="pageBody";
  body.appendChild(template.content);
  page.appendChild(body);
  container.appendChild(page);
 });
 requestAnimationFrame(check);
 document.fonts.ready.then(check);
}
function check(){
 const failed=[];document.querySelectorAll(".page").forEach((page,i)=>{const b=page.querySelector(".pageBody"),h=page.querySelector(".memoHead");
 if(b.scrollHeight>b.clientHeight+2||h&&h.scrollHeight>h.clientHeight+2)failed.push(i+1)});
 $("info").textContent=failed.length?"มีข้อความล้นหน้าที่ "+failed.join(", ")+" • ห้ามพิมพ์จนกว่าจะปรับเนื้อหาให้พอดี":"ตรวจ 17 หน้าแล้ว • ไม่พบข้อความล้นพื้นที่ • สามารถพิมพ์/บันทึก PDF ได้";
 $("info").classList.toggle("bad",Boolean(failed.length));$("print").disabled=Boolean(failed.length);
 $("pageNav").innerHTML=sections.map((v,i)=>'<button data-p="'+(i+1)+'" class="'+(failed.includes(i+1)?"bad":"")+'">'+(i+1)+'</button>').join("");
 $("pageNav").querySelectorAll("[data-p]").forEach(e=>e.onclick=()=>$("p"+e.dataset.p).scrollIntoView({behavior:"smooth"}));
 return !failed.length
}
function demo(long){data.subject=long?"วัสดุอุปกรณ์สำหรับพัฒนาสนามกีฬาและปรับปรุงพื้นที่การเรียนรู้กิจกรรมภาคปฏิบัติของนักเรียนทุกระดับชั้น":"วัสดุกีฬา";data.project=long?"โครงการจัดซื้อสื่อและวัสดุอุปกรณ์การเรียนการสอนเพื่อยกระดับผลสัมฤทธิ์ทางการเรียนและเสริมสร้างศักยภาพผู้เรียนทุกระดับชั้นตลอดปีงบประมาณ พร้อมสนับสนุนกิจกรรมการเรียนรู้ในสถานศึกษา":"ปรับปรุงสนามกีฬา";data.activity=long?data.project:"จัดซื้อวัสดุกีฬา";inputUi();saveLocal();render()}
$("short").onclick=()=>demo(false);$("long").onclick=()=>demo(true);
$("print").onclick=()=>{if(check())window.print()};
$("save").onclick=()=>{let blob=new Blob([JSON.stringify({template:"fixed17",data},null,2)],{type:"application/json"});const url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download="เอกสารจัดซื้อ17หน้า.json";a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)};
$("load").onclick=()=>$("loadFile").click();
$("loadFile").onchange=async e=>{try{let obj=JSON.parse(await e.target.files[0].text());if(!obj.data)throw Error("ไม่พบข้อมูล");for(const key of Object.keys(data))if(typeof obj.data[key]==="string")data[key]=obj.data[key];inputUi();saveLocal();render()}catch(err){alert("อ่านข้อมูลไม่ได้: "+err.message)}};
$("fontFile").onchange=e=>{let f=e.target.files?.[0];if(!f)return;let reader=new FileReader();reader.onload=()=>{let style=document.createElement("style");style.textContent='@font-face{font-family:THSarabunPSK;src:url("'+reader.result+'");font-weight:normal}';document.head.appendChild(style);$("fontStatus").textContent="โหลดฟอนต์ "+f.name+" แล้ว";document.fonts.ready.then(render)};reader.readAsDataURL(f)};
try{let obj=JSON.parse(localStorage.getItem(KEY)||"null");if(obj&&typeof obj==="object")data={...data,...obj}}catch(e){}
inputUi();render();
