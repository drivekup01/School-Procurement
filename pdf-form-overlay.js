// Read text geometry from the uploaded PDF itself.
// We intentionally do not use hard-coded x/y coordinates. Ambiguous or
// unrecognized blanks remain untouched rather than silently misplacing data.
const anchors=[
 {page:1,key:"school",anchor:/โรงเรียน\s*$/,first:true,strip:/^โรงเรียน/},
 {page:1,key:"requestDate",anchor:/วันที่\s*$/},
 {page:1,key:"subject",anchor:/จัดซื้อ\s*\/\s*จัดจ้าง\s*$/},
 {page:1,key:"fiscalYear",anchor:/ปีงบประมาณ\s*$/},
 {page:1,key:"budget",anchor:/งบประมาณ\s*$/},
 {page:2,key:"school",anchor:/โรงเรียน\s*$/,first:true,strip:/^โรงเรียน/},
 {page:2,key:"requestDate",anchor:/วันที่\s*$/},
 {page:2,key:"subject",anchor:/จัดซื้อ\s*\/\s*จัดจ้าง\s*$/},
 {page:3,key:"school",anchor:/โรงเรียน\s*$/,first:true,strip:/^โรงเรียน/},
 {page:3,key:"budget",anchor:/วงเงินงบประมาณ\s*$/},
 {page:5,key:"school",anchor:/โรงเรียน\s*$/,first:true,strip:/^โรงเรียน/},
 {page:5,key:"requestDate",anchor:/วันที่\s*$/},
 {page:7,key:"vendor",anchor:/ตกลงราคากับ\s*$/},
 {page:8,key:"school",anchor:/ประกาศโรงเรียน\s*$/,first:true,strip:/^โรงเรียน/},
 {page:10,key:"school",anchor:/โรงเรียน\s*$/,first:true,strip:/^โรงเรียน/},
];
const fontUrl="https://raw.githubusercontent.com/google/fonts/main/ofl/sarabun/Sarabun-Regular.ttf";
let fontPromise;
function fontBytes(){
 if(!fontPromise)fontPromise=fetch(fontUrl).then(r=>{
  if(!r.ok)throw Error("โหลดฟอนต์ภาษาไทยไม่ได้: HTTP "+r.status);
  return r.arrayBuffer();
 }).catch(e=>{fontPromise=null;throw e});
 return fontPromise;
}
async function geometry(bytes){
 if(!globalThis.pdfjsLib?.getDocument)throw Error("ระบบอ่านตำแหน่งข้อความ PDF ไม่พร้อม");
 // Avoid transferring/detaching the source buffer used later by pdf-lib.
 const document=await pdfjsLib.getDocument({data:new Uint8Array(bytes.slice(0))}).promise;
 const result=[];
 try{
  for(let page=1;page<=document.numPages;page++){
   const p=await document.getPage(page);
   const content=await p.getTextContent();
   const rows=[];
   for(const item of content.items){
    if(!item.str||!item.transform||!Number.isFinite(item.width))continue;
    const x=item.transform[4],y=item.transform[5];
    // The PDF uses a text baseline (bottom-left origin), not browser pixels.
    let row=rows.find(r=>Math.abs(r.y-y)<=3.25);
    if(!row){row={y,items:[]};rows.push(row)}
    row.items.push({str:item.str,x,y,width:item.width,height:item.height||10});
   }
   result.push(rows.map(row=>{
    row.items.sort((a,b)=>a.x-b.x);
    let text="",indices=[];
    for(const i of row.items){
     const previous=indices.at(-1);
     if(previous&&i.x>previous.x+3.0){text+=" ";indices.push({x:i.x,y:i.y,width:0,height:i.height})}
     for(let k=0;k<i.str.length;k++){
      indices.push({x:i.x+i.width*k/Math.max(i.str.length,1),y:i.y,width:i.width/Math.max(i.str.length,1),height:i.height});
     }
     text+=i.str;
    }
    return {text,indices};
   }));
  }
  return result;
 }finally{await document.destroy()}
}
function locate(rows,config){
 const matches=[];
 for(const row of rows||[]){
  const all=row.text;
  const dots=/[.．…_]{5,}/g;
  let m;
  while((m=dots.exec(all))!==null){
   const previous=all.slice(Math.max(0,m.index-85),m.index);
   const anchor=previous.match(config.anchor);
   if(!anchor)continue;
   const first=row.indices[m.index],last=row.indices[m.index+m[0].length-1];
   if(!first||!last)continue;
   const x=first.x,end=last.x+last.width;
   if(end-x<25)continue;
   matches.push({x,y:first.y,width:end-x,height:first.height});
  }
 }
 return config.first?matches[0]:matches[0]; // uncertain matches still limited to first anchored blank
}
export async function fillProcurementPdf(pdfBlob,values){
 if(!globalThis.PDFLib?.PDFDocument)throw Error("เครื่องมือ PDF ไม่พร้อม");
 if(!globalThis.fontkit)throw Error("เครื่องมือฟอนต์ไทยไม่พร้อม");
 const data=await pdfBlob.arrayBuffer();
 const [locations,pdf]=await Promise.all([geometry(data),PDFLib.PDFDocument.load(data.slice(0))]);
 pdf.registerFontkit(globalThis.fontkit);
 const font=await pdf.embedFont(await fontBytes(),{subset:false});
 let placed=0,skipped=0;
 for(const rule of anchors){
  let value=String(values[rule.key]??"").trim();
  if(!value)continue;
  if(rule.strip)value=value.replace(rule.strip,"").trim();
  if(!value)continue;
  const slot=locate(locations[rule.page-1],rule);
  if(!slot){skipped++;continue}
  const page=pdf.getPage(rule.page-1);
  // Use only the dotted span reported by the PDF itself.
  const x=slot.x+1,y=slot.y;
  const w=Math.min(slot.width-3,page.getWidth()-x-6);
  let size=Math.min(11,Math.max(8,slot.height*.85));
  let width=font.widthOfTextAtSize(value,size);
  if(width>w){size=Math.min(size,size*w/width);width=font.widthOfTextAtSize(value,size)}
  if(size<7.5){skipped++;continue}
  const eraseHeight=Math.min(14,Math.max(9,slot.height+2));
  page.drawRectangle({x:slot.x,y:y-2,width:slot.width,height:eraseHeight,color:PDFLib.rgb(1,1,1)});
  page.drawText(value,{x,y,size,font,color:PDFLib.rgb(0,0,0)});
  placed++;
 }
 const result=await pdf.save();
 return {blob:new Blob([result],{type:"application/pdf"}),count:placed,skipped,pageCount:pdf.getPageCount()};
}
