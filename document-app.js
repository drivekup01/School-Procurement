
(function updateHeaderDate(){
 const el=document.getElementById('headerDate');
 if(!el)return;
 const now=new Date();
 el.dateTime=now.toISOString().slice(0,10);
 el.textContent=new Intl.DateTimeFormat('th-TH-u-ca-buddhist',{timeZone:'Asia/Bangkok',day:'numeric',month:'long',year:'numeric'}).format(now);
})();
const thaiParameterLabels={
 agreed_price:"ราคาที่ตกลง",
 agreed_price_text:"ราคาที่ตกลงเป็นตัวอักษร",
 budget_amount:"วงเงินงบประมาณ",
 budget_amount_text:"วงเงินงบประมาณตัวอักษร",
 reference_price:"ราคากลาง",
 activity_name:"ชื่อกิจกรรม",
 budget_year:"ปีงบประมาณ",
 project_name:"ชื่อโครงการ",
 requesting_unit:"ฝ่ายงาน / กลุ่มสาระ",
 expense_description:"รายละเอียดค่าใช้จ่าย",
 hire_item:"งานจัดจ้าง",
 hire_job_count:"จำนวนงานจ้าง",
 procurement_description:"รายละเอียดจัดซื้อ/จ้าง",
 procurement_item_count:"จำนวนรายการพัสดุ",
 procurement_purpose:"วัตถุประสงค์การจัดซื้อ",
 procurement_reason:"เหตุผลและความจำเป็น",
 procurement_type:"ประเภทจัดซื้อ/จัดจ้าง (ตรวจข้อความซ้ำ)",
 purchase_item:"สิ่งที่จะจัดซื้อ",
 purchase_item_count:"จำนวนรายการจัดซื้อ",
 assigned_officer_name:"ชื่อผู้ได้รับมอบหมาย",
 inspector_name:"ผู้ตรวจรับพัสดุ",
 assigned_officer_position:"ตำแหน่งผู้ได้รับมอบหมาย",
 chief_officer_signer_name:"ชื่อผู้ได้รับมอบหมาย",
 officer_signer_name:"ชื่อเจ้าหน้าที่",
 vendor_name:"ชื่อผู้ขาย/ผู้รับจ้าง",
 pa:"จำนวนเงินก่อน VAT",
 pf:"ค่าปรับ",
 pn:"ยอดจ่ายสุทธิ",
 pnt:"ยอดสุทธิเป็นตัวอักษร",
 pt:"ยอดรวม",
 pv:"ภาษีมูลค่าเพิ่ม",
 pw:"ภาษี ณ ที่จ่าย",
 activity_date:"วันที่จัดกิจกรรม",
 change_end_date:"วันสิ้นสุดเปลี่ยนแปลง",
 change_start_date:"วันเริ่มเปลี่ยนแปลง",
 delivery_document_date:"วันที่เอกสารส่งมอบ",
 delivery_due_date:"วันครบกำหนดส่งมอบ",
 inspection_date:"วันที่ตรวจรับพัสดุ",
 main_date:"วันที่เอกสารหลัก",
 purchase_order_date:"วันที่ใบสั่งซื้อ/สั่งจ้าง",
 purchase_report_date:"วันที่รายงานขอซื้อ/จ้าง",
 delivery_changes:"รายละเอียดเปลี่ยนแปลงการส่งมอบ",
 delivery_days:"ระยะเวลาส่งมอบ (วัน)",
 delivery_location:"สถานที่ส่งมอบ/ดำเนินงาน",
 price_validity_days:"จำนวนวันยืนราคา",
 required_within_days:"ต้องการใช้ภายในกี่วัน",
 delivery_document_number:"เลขที่เอกสารส่งมอบ",
 document_date:"เลขที่หนังสือ",
 purchase_order_number:"เลขที่ใบสั่งซื้อ/สั่งจ้าง",
 purchase_report_number:"เลขที่รายงานขอซื้อ/จ้าง"
};
function thaiFieldLabel(key){
 const k=key.toLowerCase().trim();
 if(Object.prototype.hasOwnProperty.call(thaiParameterLabels,k))return thaiParameterLabels[k];
 const words=k.split(/[_ .-]+/);
 const dict={project:'โครงการ',activity:'กิจกรรม',name:'ชื่อ',date:'วันที่',description:'รายละเอียด',price:'ราคา',amount:'จำนวนเงิน',total:'รวม',number:'เลขที่',vendor:'ผู้ขาย',department:'ฝ่าย',unit:'หน่วย',quantity:'จำนวน',budget:'งบประมาณ',year:'ปี',school:'โรงเรียน',director:'ผู้อำนวยการ',announcement:'ประกาศ',document:'เอกสาร',requesting:'ผู้ขอ',agreed:'ตกลง',text:'ตัวอักษร',address:'ที่อยู่',phone:'โทรศัพท์',position:'ตำแหน่ง',committee:'กรรมการ',sign:'ลงนาม',approve:'อนุมัติ',approval:'การอนุมัติ',note:'หมายเหตุ',subject:'เรื่อง',reference:'อ้างอิง',item:'รายการ',procurement:'การจัดซื้อจัดจ้าง',prepared:'ผู้จัดทำ',by:'โดย',day:'วัน',month:'เดือน',year:'พ.ศ.'};
 if(words.every(w=>dict[w]))return words.map(w=>dict[w]).join(' ');
 return 'ข้อมูลเพิ่มเติม';
}
const calendarFieldKeys=new Set(['activity_date','change_end_date','change_start_date','delivery_document_date','delivery_due_date','inspection_date','main_date','purchase_order_date','purchase_report_date','announcement_date']);
function toThaiDocumentDate(value){
 const iso=String(value||'').trim();
 if(!/^\d{4}-\d{2}-\d{2}$/.test(iso))return iso;
 const [year,month,day]=iso.split('-').map(Number);
 const dt=new Date(Date.UTC(year,month-1,day));
 if(dt.getUTCFullYear()!==year||dt.getUTCMonth()!==month-1||dt.getUTCDate()!==day)return iso;
 const months=['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];
 return day+' '+months[month-1]+' '+(year+543);
}
function toCalendarValue(value){
 const input=String(value||'').trim();
 if(/^\d{4}-\d{2}-\d{2}$/.test(input))return input;
 const months=['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];
 const match=input.match(/^(\d{1,2})\s+(\S+)\s+(\d{4})$/);
 if(!match)return '';
 const month=months.indexOf(match[2]);if(month<0)return '';
 const year=Number(match[3])>2400?Number(match[3])-543:Number(match[3]);
 return year+'-'+String(month+1).padStart(2,'0')+'-'+String(Number(match[1])).padStart(2,'0');
}

const departments=[
 'ฝ่ายบริหารงานวิชาการ','ฝ่ายบริหารงานงบประมาณ','ฝ่ายบริหารงานบุคคล','ฝ่ายบริหารงานทั่วไป',
 'โรงเรียนค่ายบางจันวิทยาคม'
];
let projectActivityData=null,projectActivityError='กำลังอ่านโครงการและกิจกรรม...';
const budgetSourceFile='สรุปงบประมาณในการดำเนินโครงการประจำปี 2570.docx';
function docxCellText(cell){
 const ns='http://schemas.openxmlformats.org/wordprocessingml/2006/main';
 return Array.from(cell.getElementsByTagNameNS(ns,'p'))
  .map(p=>Array.from(p.getElementsByTagNameNS(ns,'t')).map(t=>t.textContent).join(''))
  .join(' ').replace(/\s+/g,' ').trim();
}
function findDepartment(text){
 if(/ฝ่ายบริหารงานวิชาการ/.test(text))return departments[0];
 if(/ฝ่ายบริหารงานงบประมาณ/.test(text))return departments[1];
 if(/ฝ่ายบริหารงานบุคคล/.test(text))return departments[2];
 if(/ฝ่ายบริหารงานทั่วไป/.test(text))return departments[3];
 return '';
}
async function loadProjectActivities(){
 try{
  if(!window.JSZip)throw Error('ไม่สามารถเปิดตัวอ่านไฟล์ Word');
  const response=await fetch(encodeURI(budgetSourceFile),{cache:'no-store'});
  if(!response.ok)throw Error('เปิดไฟล์สรุปงบประมาณไม่ได้ ('+response.status+')');
  const zip=await JSZip.loadAsync(await response.arrayBuffer());
  const xml=await zip.file('word/document.xml')?.async('string');
  if(!xml)throw Error('ไม่พบตารางในไฟล์ Word');
  const doc=new DOMParser().parseFromString(xml,'application/xml');
  if(doc.getElementsByTagName('parsererror').length)throw Error('โครงสร้างไฟล์ Word ไม่สมบูรณ์');
  const ns='http://schemas.openxmlformats.org/wordprocessingml/2006/main';
  const projects=new Map();
  let department='',project='';
  for(const table of Array.from(doc.getElementsByTagNameNS(ns,'tbl'))){
   for(const row of Array.from(table.children).filter(n=>n.localName==='tr')){
    const cells=Array.from(row.children).filter(n=>n.localName==='tc').map(docxCellText);
    if(!cells.length)continue;
    if(cells.length===1){
      const found=findDepartment(cells[0]);
      if(found){department=found;project='';}continue;
    }
    const number=cells[0].trim(),name=(cells[1]||'').trim();
    if(/^(?:[1-9]|[1-3]\d|40)$/.test(number)&&name.startsWith('โครงการ')&&department){
      project=name;
      if(!projects.has(project))projects.set(project,{department,activities:[]});
    }else if(!number&&/^[-–]\s*/.test(name)&&project){
      const activity=name.replace(/^[-–]\s*/,'').trim();
      if(activity&&!projects.get(project).activities.includes(activity))projects.get(project).activities.push(activity);
    }else if(/^รวม/.test(number)){project='';}
   }
  }
  if(projects.size!==40)throw Error('อ่านโครงการได้ '+projects.size+' จาก 40 รายการ จึงยังไม่เปิด Dropdown ที่อาจมีข้อมูลไม่ครบ');
  const counts=departments.slice(0,4).map(d=>[...projects.values()].filter(x=>x.department===d).length);
  if(counts.join(',')!=='17,2,4,17')throw Error('จำนวนโครงการแต่ละฝ่ายไม่ตรงกับต้นฉบับ: '+counts.join('/'));
  projectActivityData=projects;projectActivityError='';
 }catch(error){projectActivityData=null;projectActivityError=error.message;console.error('Budget reference:',error);}
 renderFormFields();
}
function saveFieldValue(key,value){
 formValues[key]=value;
 if(key==='budget_amount')syncBudgetAmountText();
 try{localStorage.setItem('school-procurement-preview-values-v1',JSON.stringify(formValues))}catch{}
 activeField=key;
 renderPDFPage(currentPDFPage);
}
function addRelatedSelect(parent,key){
 const wrap=document.createElement('div');wrap.className='input-wrap';
 const label=document.createElement('label');label.textContent=thaiFieldLabel(key);label.htmlFor='field-'+key;wrap.append(label);
 const select=document.createElement('select');select.id='field-'+key;
 let choices=[];
 if(key==='requesting_unit')choices=departments;
 else if(projectActivityData&&departments.includes(formValues.requesting_unit)){
  const projects=[...projectActivityData].filter(([_,v])=>formValues.requesting_unit===departments[4]||v.department===formValues.requesting_unit);
  if(key==='project_name')choices=projects.map(([k])=>k);
  else if(projects.some(([name])=>name===formValues.project_name))choices=projectActivityData.get(formValues.project_name)?.activities||[];
 }
 select.append(new Option(key==='requesting_unit'?'เลือกฝ่ายงาน':key==='project_name'?'เลือกโครงการ':'เลือกกิจกรรม',''));
 for(const choice of choices)select.add(new Option(choice,choice));
 select.value=choices.includes(formValues[key])?formValues[key]:'';
 if(key!=='requesting_unit'&&!departments.includes(formValues.requesting_unit))select.disabled=true;
 if(key==='activity_name'&&(!formValues.project_name||!choices.length))select.disabled=true;
 if(key!=='requesting_unit'&&!projectActivityData){
  select.disabled=true;
  const info=document.createElement('p');info.className='muted';info.textContent=projectActivityError;wrap.append(info);
 }
 if(key==='activity_name'&&departments.includes(formValues.requesting_unit)&&formValues.project_name&&choices.length===0){
  const info=document.createElement('p');info.className='muted';info.textContent='โครงการนี้ไม่มีรายการกิจกรรมย่อยในต้นฉบับ';wrap.append(info);
 }
 select.addEventListener('focus',()=>{activeField=key;highlightField(key)});
 select.addEventListener('change',()=>{
  formValues[key]=select.value;
  if(key==='requesting_unit'){formValues.project_name='';formValues.activity_name='';}
  if(key==='project_name')formValues.activity_name='';
  try{localStorage.setItem('school-procurement-preview-values-v1',JSON.stringify(formValues))}catch{}
  activeField=key;renderFormFields();renderPDFPage(currentPDFPage);
 });
 wrap.append(select);parent.append(wrap);
}
loadProjectActivities();

function budgetAmountInThaiWords(value){
 const raw=String(value??'').replace(/,/g,'').trim();
 if(!/^\d+(?:\.\d{1,2})?$/.test(raw))return '';
 const [whole,decimal='']=raw.split('.');
 const digits=['ศูนย์','หนึ่ง','สอง','สาม','สี่','ห้า','หก','เจ็ด','แปด','เก้า'];
 const units=['','สิบ','ร้อย','พัน','หมื่น','แสน'];
 function part(n){if(!n)return '';const str=String(n);let out='';for(let i=0;i<str.length;i++){const d=Number(str[i]),p=str.length-i-1;if(!d)continue;if(p===1&&d===1)out+='สิบ';else if(p===1&&d===2)out+='ยี่สิบ';else if(p===0&&d===1&&str.length>1)out+='เอ็ด';else out+=digits[d]+units[p]}return out}
 function integerWords(input){let n=BigInt(input),out='';if(n===0n)return 'ศูนย์';while(n>0n){const chunk=Number(n%1000000n);if(chunk)out=part(chunk)+(out?'ล้าน':'')+out;n/=1000000n}return out}
 const baht=integerWords(whole),sat=Number(decimal.padEnd(2,'0'));
 return baht+'บาท'+(sat?part(sat)+'สตางค์':'ถ้วน');
}
function syncBudgetAmountText(){
 const converted=budgetAmountInThaiWords(formValues.budget_amount);
 formValues.budget_amount_text=converted;
 const display=document.getElementById('field-budget_amount_text');
 if(display)display.value=converted;
}
const page10MoneyKeys=new Set(['pa','pv','pt','pw','pf','pn']);
function page10Money(value){
 const raw=String(value??'').trim();
 if(!/^\d+(?:\.\d{1,2})?$/.test(raw))return '';
 const [whole,decimal='']=raw.split('.');
 return BigInt(whole).toString()+'.'+decimal.padEnd(2,'0');
}
function syncPage10Amounts(){
 for(const key of ['pa','pv','pw','pf'])formValues[key]=page10Money(formValues[key]);
 function sum(keys){
  if(!keys.some(key=>formValues[key]))return '';
  const cents=keys.reduce((total,key)=>total+BigInt((formValues[key]||'0.00').replace('.','')),0n);
  return (cents/100n).toString()+'.'+(cents%100n).toString().padStart(2,'0');
 }
 formValues.pt=sum(['pa','pv']);
 formValues.pn=sum(['pt','pw','pf']);
 formValues.pnt=page10BahtText(formValues.pn);
 formValues.agreed_price_text=page10BahtText(page10Money(formValues.agreed_price));
}
function page10BahtText(amount){
 if(!amount)return '';
 const [whole,decimal]=amount.split('.');
 function words(n){
  if(n>=1000000n)return words(n/1000000n)+'ล้าน'+(n%1000000n?words(n%1000000n):'');
  return budgetAmountInThaiWords(n.toString()).replace(/บาทถ้วน$/,'');
 }
 return words(BigInt(whole))+'บาท'+(decimal==='00'?'ถ้วน':words(BigInt(decimal))+'สตางค์');
}
function renderFormFields(){
 lastFormPage=currentPDFPage;
 const shared=document.getElementById('sharedFields'),specific=document.getElementById('pageFields');
 if(!pdfDocument)return;
 shared.replaceChildren();specific.replaceChildren();
 const common=[],unique=[];
 for(const [key,pages] of parameterIndex){
  if(!pages.has(currentPDFPage))continue;
  if(pages.size>1)common.push(key);
  else unique.push(key);
 }
 function addField(parent,key){
  if(key==='budget_amount_text')return; // Derived automatically; no input field.
  if(key==='project_name'||key==='activity_name'||key==='requesting_unit'){addRelatedSelect(parent,key);return;}
  const wrap=document.createElement('div');wrap.className='input-wrap';
  const label=document.createElement('label');label.textContent=thaiFieldLabel(key);label.htmlFor='field-'+key;
  if(window.procurementPersonnelFields?.has(key)){
   const select=document.createElement('select');select.id='field-'+key;select.dataset.personnelField=key;
   select.add(new Option('เลือก'+thaiFieldLabel(key),''));
   const names=window.procurementPersonnel.names,current=String(formValues[key]??'');
   if(current&&!names.includes(current))select.add(new Option(current+' (ชื่อเดิมในเอกสาร)',current));
   names.forEach(name=>select.add(new Option(name,name)));select.value=current;
   select.addEventListener('focus',()=>{activeField=key;highlightField(key)});
   select.addEventListener('change',()=>saveFieldValue(key,select.value));
   wrap.append(label,select);parent.append(wrap);return;
  }
  if(currentPDFPage===10&&page10MoneyKeys.has(key)){
   const input=document.createElement('input');input.id='field-'+key;input.type='text';input.inputMode='decimal';
   input.placeholder='1000.00';input.value=formValues[key]??'';
   input.addEventListener('input',()=>{
    const formatted=page10Money(input.value);
    input.setCustomValidity(input.value.trim()&&!formatted?'กรอกจำนวนเงินไม่ติดลบ และทศนิยมไม่เกิน 2 ตำแหน่ง':'');
    formValues[key]=formatted;syncPage10Amounts();
    try{localStorage.setItem('school-procurement-preview-values-v1',JSON.stringify(formValues))}catch{}
    renderPDFPage(currentPDFPage);
   });
   input.addEventListener('blur',()=>{if(input.checkValidity())input.value=formValues[key]||''});
   wrap.append(label,input);parent.append(wrap);return;
  }
  if(calendarFieldKeys.has(key)){
   const field=document.createElement('div');field.style.cssText='position:relative;width:100%';
   const display=document.createElement('input');display.id='field-'+key;display.type='text';display.readOnly=true;display.placeholder='เลือกวันที่';display.style.cssText='width:100%;padding-right:42px;cursor:pointer';display.value=toThaiDocumentDate(formValues[key]||'');
   const picker=document.createElement('input');picker.type='date';picker.setAttribute('aria-label','เลือก'+thaiFieldLabel(key));picker.value=toCalendarValue(formValues[key]||'');picker.style.cssText='position:absolute;right:12px;top:50%;width:20px;height:24px;transform:translateY(-50%);opacity:0;pointer-events:none';
   const button=document.createElement('button');button.type='button';button.textContent='▣';button.setAttribute('aria-label','เปิดปฏิทิน');button.style.cssText='position:absolute;right:7px;top:50%;transform:translateY(-50%);border:0;background:transparent;width:32px;height:32px;padding:0;font-size:20px;color:#234e86;cursor:pointer';
   const choose=()=>{try{picker.showPicker()}catch{picker.focus();picker.click()}};
   button.addEventListener('click',choose);display.addEventListener('click',choose);
   picker.addEventListener('change',()=>{const value=toThaiDocumentDate(picker.value);display.value=value;formValues[key]=value;try{localStorage.setItem('school-procurement-preview-values-v1',JSON.stringify(formValues))}catch{}activeField=key;renderPDFPage(currentPDFPage)});
   field.append(display,picker,button);wrap.append(label,field);parent.appendChild(wrap);return;
  }
  const input=document.createElement('input');input.id='field-'+key;input.type='text';input.autocomplete='off';
  input.placeholder='กรอก'+thaiFieldLabel(key);input.value=formValues[key]??'';
  if(key==='budget_amount_text'){input.readOnly=true;input.title='คำนวณจากวงเงินงบประมาณอัตโนมัติ';}
  input.addEventListener('focus',()=>{activeField=key;highlightField(key)});
  input.addEventListener('input',()=>{formValues[key]=input.value;if(key==='budget_amount')syncBudgetAmountText();try{localStorage.setItem('school-procurement-preview-values-v1',JSON.stringify(formValues))}catch{}activeField=key;renderPDFPage(currentPDFPage)});
  wrap.append(label,input);parent.appendChild(wrap);
 }
 // Left input panel only. Keep document preview/export logic unchanged.
 const sharedKeys=[
  'project_name','activity_name','requesting_unit','budget_amount','budget_year',
  'assigned_officer_name','assigned_officer_position','chief_officer_signer_name',
  'officer_signer_name','inspector_name','vendor_name','procurement_description',
  'purchase_item','hire_item'
 ];
 const sharedSet=new Set([...sharedKeys,'budget_amount_text']);
 const groups=[
  ['ฝ่ายงาน โครงการ และกิจกรรม',['requesting_unit','project_name','activity_name']],
  ['งบประมาณ',['budget_amount','budget_year']],
  ['บุคลากร',['assigned_officer_name','assigned_officer_position','chief_officer_signer_name','officer_signer_name','inspector_name']],
  ['ผู้ขาย / ผู้รับจ้าง',['vendor_name']],
  ['รายละเอียดจัดซื้อ / จ้าง',['procurement_description','purchase_item','hire_item']]
 ];
 const compactHeadings=new Set(['ผู้ขาย / ผู้รับจ้าง','รายละเอียดจัดซื้อ / จ้าง']);
 for(const [heading,keys] of groups){
  const box=document.createElement('div');box.className='shared-data-group';
  const title=document.createElement('h3');title.textContent=heading;box.append(title);
  for(const key of keys){
   if(key==='assigned_officer_position'){
    const wrap=document.createElement('div');wrap.className='input-wrap';
    const label=document.createElement('label');label.textContent=thaiFieldLabel(key);label.htmlFor='field-'+key;
    const select=document.createElement('select');select.id='field-'+key;
    const options=['ครู','ครูอัตราจ้าง','เจ้าหน้าที่ธุรการ'];
    select.add(new Option('เลือกตำแหน่ง',''));
    if(formValues[key]&&!options.includes(formValues[key]))select.add(new Option(formValues[key],formValues[key]));
    options.forEach(v=>select.add(new Option(v,v)));
    select.value=formValues[key]||'';
    select.addEventListener('change',()=>saveFieldValue(key,select.value));
    wrap.append(label,select);box.append(wrap);
   }else{
    const before=box.children.length;
    addField(box,key);
    if(compactHeadings.has(heading)&&key===keys[0]&&box.children.length>before){
     const field=box.lastElementChild;
     const label=field?.querySelector('label');
     if(label)label.remove(); // Heading already names this one field.
    }
   }
  }
  shared.append(box);
 }
 const pageOnly=[...new Set([...common,...unique])].filter(key=>!sharedSet.has(key)&&!(currentPDFPage===10&&['pt','pn','pnt','agreed_price_text'].includes(key)));
 const summary=document.createElement('p');summary.className='page-field-count';
 summary.textContent='หน้า '+currentPDFPage+' · '+pageOnly.length+' ช่องเฉพาะหน้า · '+sharedKeys.length+' ช่องข้อมูลกลาง';
 specific.appendChild(summary);
 if(!pageOnly.length){
  const info=document.createElement('p');info.className='muted';info.textContent='หน้านี้ไม่มีพารามิเตอร์เฉพาะหน้า';specific.appendChild(info);
 }else pageOnly.forEach(k=>addField(specific,k));
}
const sharedToggle=document.getElementById('sharedToggle');
const sharedBody=document.getElementById('sharedBody');
sharedToggle.addEventListener('click',()=>{
 const expanded=sharedToggle.getAttribute('aria-expanded')==='true';
 sharedToggle.setAttribute('aria-expanded',String(!expanded));
 sharedBody.hidden=expanded;
 document.getElementById('sharedChevron').textContent=expanded?'▸':'▾';
});
syncBudgetAmountText();
loadPDF();
document.getElementById('exportWord').addEventListener('click',exportFilledWord);
async function exportFilledWord(){
 syncBudgetAmountText();
 syncPage10Amounts();
 const button=document.getElementById('exportWord');button.disabled=true;button.textContent='กำลังสร้าง Word...';
 try{
  if(!window.JSZip)throw new Error('ไม่สามารถโหลดเครื่องมือสร้าง Word ได้');
  const response=await fetch('procurement-template13.docx',{cache:'no-store'});
  if(!response.ok)throw new Error('ไม่สามารถอ่าน Word ต้นฉบับ');
  const zip=await JSZip.loadAsync(await response.arrayBuffer());
  const xmlFiles=Object.keys(zip.files).filter(name=>/^word\/(document|header\d*|footer\d*)\.xml$/.test(name));
  let replacements=0;
  for(const filename of xmlFiles){
   const xml=await zip.file(filename).async('string');
   const doc=new DOMParser().parseFromString(xml,'application/xml');
   if(doc.querySelector('parsererror'))throw new Error('ไฟล์เอกสารมี XML ที่อ่านไม่ได้');
   const paragraphs=Array.from(doc.getElementsByTagNameNS('http://schemas.openxmlformats.org/wordprocessingml/2006/main','p'));
   let changed=false;
   for(const paragraph of paragraphs){
    const nodes=Array.from(paragraph.getElementsByTagNameNS('http://schemas.openxmlformats.org/wordprocessingml/2006/main','t'));
    if(!nodes.length)continue;
    let full='',offset=[];
    for(const node of nodes){const str=node.textContent||'';for(const ch of Array.from(str)){offset.push({node,char:ch});full+=ch;}}
    const regex=/\{\{\s*([\w.-]+)\s*\}\}/g;
    const matches=Array.from(full.matchAll(regex)).reverse();
    for(const match of matches){
     const key=match[1],raw=formValues[key];
     const replacement=String(calendarFieldKeys.has(key)?toThaiDocumentDate(raw??''):(raw??''));
     if(replacement==='')continue;
     const start=match.index,end=start+match[0].length;
     const first=offset[start]?.node,last=offset[end-1]?.node;
     if(!first||!last)continue;
     const firstStart=offset.findIndex(x=>x.node===first),lastStart=offset.findIndex(x=>x.node===last);
     if(first===last){
      const source=first.textContent||'';
      first.textContent=Array.from(source).slice(0,start-firstStart).join('')+replacement+Array.from(source).slice(end-firstStart).join('');
     }else{
      const firstSource=Array.from(first.textContent||'');
      const lastSource=Array.from(last.textContent||'');
      const prefix=firstSource.slice(0,start-firstStart).join('');
      const suffix=lastSource.slice(end-lastStart).join('');
      first.textContent=prefix+replacement;
      let between=false;
      for(const n of nodes){if(n===first){between=true;continue;}if(n===last){n.textContent=suffix;break;}if(between)n.textContent='';}
     }
     replacements++;changed=true;
    }
   }
   if(filename==='word/document.xml'&&typeof window.exportPage4TableToWord==='function'){
    const tableWrites=window.exportPage4TableToWord(doc);
    if(tableWrites){replacements+=tableWrites;changed=true;}
   }
   if(filename==='word/document.xml'&&typeof window.exportPage6TableToWord==='function'){
    const tableWrites=window.exportPage6TableToWord(doc);
    if(tableWrites){replacements+=tableWrites;changed=true;}
   }
   if(filename==='word/document.xml'&&typeof window.exportPage11TableToWord==='function'){
    const tableWrites=window.exportPage11TableToWord(doc);
    if(tableWrites){replacements+=tableWrites;changed=true;}
   }
   if(changed)zip.file(filename,new XMLSerializer().serializeToString(doc));
  }
  if(replacements===0)throw new Error('ยังไม่มีค่าพารามิเตอร์ที่ตรงกับข้อความใน Word ให้ส่งออก');
  const blob=await zip.generateAsync({type:'blob',mimeType:'application/vnd.openxmlformats-officedocument.wordprocessingml.document'});
  const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='เอกสารราชการ_กรอกข้อมูล.docx';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);
 }catch(error){alert('ส่งออก Word ไม่สำเร็จ: '+error.message);}
 finally{button.disabled=false;button.textContent='⬇ Export Word';}
}

