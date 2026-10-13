/* First page: reconstructed from paragraphs 1–22 of procurement-template13.docx. */
const wordFirstPageHTML="<article class=\"word-a4\">\n<header class=\"word-heading\"><img src=\"krut-1.5-cm.png\" alt=\"ตราครุฑ\"><h1>บันทึกข้อความ</h1></header>\n<section class=\"word-document-head\">\n<p><strong>ส่วนราชการ</strong> โรงเรียนค่ายบางระจันวิทยาคม <span class=\"word-agency\">สำนักงานเขตพื้นที่การศึกษามัธยมศึกษาสิงห์บุรี อ่างทอง</span></p>\n<p><strong>ที่</strong> {{document_date}} <span class=\"word-date\"><strong>วันที่</strong> {{main_date}}</span></p>\n<p><strong>เรื่อง</strong> มอบหมายบุคลากรปฏิบัติหน้าที่กำหนดรายละเอียดคุณลักษณะของงานจัดซื้อ/จัดจ้าง {{procurement_type}}</p>\n</section>\n<section class=\"word-body\">\n<p class=\"word-salutation\"><strong>เรียน</strong> ผู้อำนวยการโรงเรียนค่ายบางระจันวิทยาคม</p>\n<p class=\"word-indent\">ด้วย {{requesting_unit}} มีความประสงค์จะดำเนินการจัดซื้อ/จัดจ้าง {{procurement_type}} ตามที่ได้รับแจ้งจัดสรรงบประมาณประจำปีงบประมาณ {{budget_year}} ตามโครงการ {{project_name}} กิจกรรม{{activity_name}} เพื่อเป็นค่า{{expense_description}} วงเงินงบประมาณ {{budget_amount}} บาท ({{budget_amount_text}})</p>\n<p class=\"word-indent\">ดังนั้นเพื่อให้การจัดทำรายละเอียดคุณลักษณะพัสดุที่จะจัดซื้อ/จัดจ้างของงานดังกล่าว เป็นไปตามระเบียบกระทรวงการคลังว่าด้วยการจัดซื้อจัดจ้างและการบริหารพัสดุภาครัฐ พ.ศ.2560 ข้อ 21 จึงเห็นสมควรมอบหมาย {{chief_officer_signer_name}} ตำแหน่ง {{assigned_officer_position}} เป็นผู้จัดการคุณลักษณะเฉพาะงานจัดซื้อ / จัดจ้าง{{procurement_type}} ทั้งนี้ อำนาจเห็นชอบรายละเอียดคุณลักษณะพัสดุที่จัดซื้อ/จัดจ้างเป็นของผู้อำนวยการโรงเรียน ตามคำสั่งสำนักงานคณะกรรมการการศึกษาขั้นพื้นฐาน ที่ 2493/2566 ลงวันที่ 15 เดือนพฤศจิกายน พ.ศ.2566</p>\n<p class=\"word-indent\">จึงเรียนมาเพื่อโปรดพิจารณาอนุมัติ</p>\n</section>\n<section class=\"word-signatures\"><div><p>ลงชื่อ............................................ เจ้าหน้าที่</p><p>({{officer_signer_name}})</p></div><div><p>ลงชื่อ.............................................หัวหน้าเจ้าหน้าที่</p><p>({{chief_officer_signer_name}})</p></div></section>\n<section class=\"word-director\"><p>- อนุมัติ</p><p>ลงชื่อ..........................................</p><p>(นายเรวัฒน์ พรหมสะโร)</p><p>ผู้อำนวยการโรงเรียนค่ายบางระจันวิทยาคม</p><p>วันที่ {{main_date}}</p></section>\n<p class=\"word-footnote\"><strong>หมายเหตุ :</strong> การจัดทำราคากลางของงานซื้อหรืองานจ้างที่มิใช่งานก่อสร้างวงเงินไม่เกิน 100,000 บาท จะแต่งตั้งเจ้าหน้าที่คนใดคนหนึ่งหรือคณะกรรมการฯ เป็นผู้ทำหน้าที่จัดทำราคากลางก็ได้</p>\n</article>";
function renderHTMLFirstPage(preserveScroll=false){
 const oldX=pdfStage.scrollLeft,oldY=pdfStage.scrollTop;
 const shell=document.createElement('div');shell.className='word-page-shell';
 const template=document.createElement('template');template.innerHTML=wordFirstPageHTML;
 const page=template.content.firstElementChild;
 const walker=document.createTreeWalker(page,NodeFilter.SHOW_TEXT);
 const nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);
 for(const node of nodes){
  const parts=(node.nodeValue||'').split(/(\{\{[\w.-]+\}\})/g);
  if(parts.length===1)continue;
  const fragment=document.createDocumentFragment();
  for(const part of parts){
   const match=part.match(/^\{\{([\w.-]+)\}\}$/);
   if(!match){fragment.append(document.createTextNode(part));continue}
   const field=document.createElement('span');field.dataset.field=match[1];
   const value=formValues[match[1]];
   field.textContent=value===undefined||value===''?part:(calendarFieldKeys.has(match[1])?toThaiDocumentDate(value):String(value));
   field.className=value===undefined||value===''?'word-parameter':'word-parameter word-filled';
   field.addEventListener('click',()=>{const input=document.getElementById('field-'+match[1]);if(input){input.focus();input.scrollIntoView({block:'nearest'})}});
   fragment.append(field);
  }
  node.replaceWith(fragment);
 }
 shell.append(page);pdfStage.replaceChildren(shell);
 const base=210*96/25.4,available=Math.max(270,pdfStage.clientWidth-44);
 const zoom=Math.min(1.6,available/base)*pdfZoom;
 page.style.transform='scale('+zoom+')';
 const measure=()=>{shell.style.width=(base*zoom)+'px';shell.style.height=(page.offsetHeight*zoom)+'px'};
 measure();document.fonts?.ready.then(()=>{if(shell.isConnected)measure()});
 if(preserveScroll){pdfStage.scrollLeft=oldX;pdfStage.scrollTop=oldY}else{pdfStage.scrollLeft=0;pdfStage.scrollTop=0}
 if(lastFormPage!==1)renderFormFields();
}