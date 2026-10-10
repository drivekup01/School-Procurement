/* Official Word template viewer/editor. A template is installed by Admin once
   and fetched from Firebase Storage for subsequent document jobs. */
const fieldSpecs=[
 {id:"school",re:/โรงเรียน\s*([.．…_]{5,})/g},
 {id:"requestDate",re:/(?:ลง)?วันที่\s*([.．…_]{5,})/g},
 {id:"fiscalYear",re:/ปีงบประมาณ\s*([.．…_]{5,})/g},
 {id:"project",re:/โครงการ\s*([.．…_]{5,})/g},
 {id:"activity",re:/กิจกรรม\s*([.．…_]{5,})/g},
 {id:"budget",re:/วงเงินงบประมาณ\s*([.．…_]{5,})/g},
 {id:"subject",re:/จัดซื้อ\/จัดจ้าง\s*([.．…_]{5,})/g}
];
function replaceAtParagraph(paragraph,values){
 const texts=[...paragraph.getElementsByTagNameNS("http://schemas.openxmlformats.org/wordprocessingml/2006/main","t")];
 if(!texts.length)return 0;
 const source=texts.map(n=>n.textContent).join("");
 if(!source.trim())return 0;
 let patches=[];
 for(const spec of fieldSpecs){
  const val=String(values[spec.id]??"").trim();if(!val)continue;
  spec.re.lastIndex=0;let m;
  while((m=spec.re.exec(source))!==null){
   const local=m[0].lastIndexOf(m[1]);
   patches.push({a:m.index+local,b:m.index+local+m[1].length,value:val,id:spec.id});
  }
 }
 patches.sort((a,b)=>a.a-b.a);
 let valid=[];for(const p of patches)if(!valid.some(v=>p.a<v.b&&p.b>v.a))valid.push(p);
 valid.sort((a,b)=>b.a-a.a);
 for(const patch of valid){
  let offset=0;
  const segs=texts.map(node=>{let s={node,start:offset,end:offset+node.textContent.length};offset=s.end;return s});
  const hit=segs.filter(s=>s.end>patch.a&&s.start<patch.b);if(!hit.length)continue;
  if(hit.length===1){
   const s=hit[0],text=s.node.textContent;
   s.node.textContent=text.slice(0,patch.a-s.start)+patch.value+text.slice(patch.b-s.start);
  }else{
   const first=hit[0],last=hit.at(-1);
   first.node.textContent=first.node.textContent.slice(0,patch.a-first.start)+patch.value;
   for(const middle of hit.slice(1,-1))middle.node.textContent="";
   last.node.textContent=last.node.textContent.slice(patch.b-last.start);
  }
 }
 return valid.length;
}
export async function fillOfficialDocx(blob,values){
 if(!globalThis.JSZip)throw Error("โหลดตัวอ่านไฟล์ Word ไม่สำเร็จ");
 const zip=await JSZip.loadAsync(blob);
 const xmlFile=zip.file("word/document.xml");if(!xmlFile)throw Error("ไม่พบโครงสร้าง Word ในแม่แบบ");
 const xml=await xmlFile.async("string");
 const parsed=new DOMParser().parseFromString(xml,"application/xml");
 if(parsed.querySelector("parsererror"))throw Error("เปิดโครงสร้าง DOCX ไม่ได้");
 const paragraphs=[...parsed.getElementsByTagNameNS("http://schemas.openxmlformats.org/wordprocessingml/2006/main","p")];
 let replaced=0;
 for(const p of paragraphs)replaced+=replaceAtParagraph(p,values);
 if(replaced===0)return {blob,count:0};
 zip.file("word/document.xml",new XMLSerializer().serializeToString(parsed));
 const updated=await zip.generateAsync({type:"blob",mimeType:"application/vnd.openxmlformats-officedocument.wordprocessingml.document",compression:"DEFLATE"});
 return {blob:updated,count:replaced};
}
export async function showWordDocument(blob,container,values){
 if(!globalThis.docx?.renderAsync)throw Error("ตัวแสดง Word ยังโหลดไม่สำเร็จ กรุณารีเฟรชหน้าเว็บ");
 const result=await fillOfficialDocx(blob,values);
 container.innerHTML="";
 await globalThis.docx.renderAsync(result.blob,container,null,{
  breakPages:true,
  inWrapper:true,
  ignoreFonts:false,
  ignoreWidth:false,
  ignoreHeight:false,
  experimental:true, // calculate tab stops in government-form paragraphs
  ignoreLastRenderedPageBreak:false,
  renderHeaders:true,
  renderFooters:true,
  renderFootnotes:true
 });
 const pages=[...container.querySelectorAll("section.docx")];
 return {pages,replacements:result.count,docx:result.blob};
}
