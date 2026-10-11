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
 pdfjsLib.GlobalWorkerOptions.workerSrc="https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js";
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

export async function fillProcurementPdf(pdfBlob,values,fields=[]){
 if(!globalThis.PDFLib?.PDFDocument)throw Error("เครื่องมือ PDF ไม่พร้อม");
 const pdf=await PDFLib.PDFDocument.load(await pdfBlob.arrayBuffer());
 const mapped=Array.isArray(fields)?fields.filter(f=>f&&Number.isInteger(f.page)&&f.page>=1&&f.page<=pdf.getPageCount()):[];
 if(!mapped.length)return {blob:pdfBlob,count:0,skipped:0,pageCount:pdf.getPageCount()};
 if(!globalThis.fontkit)throw Error("เครื่องมือฟอนต์ไทยไม่พร้อม");
 pdf.registerFontkit(globalThis.fontkit);
 const font=await pdf.embedFont(await fontBytes(),{subset:false});
 let count=0,skipped=0;
 for(const field of mapped){
  const value=String(values[field.key]??"").trim();
  if(!value)continue;
  const x=Number(field.x),y=Number(field.y),w=Number(field.w),h=Number(field.h);
  if(![x,y,w,h].every(Number.isFinite)||w<=0||h<=0||x<0||y<0||x+w>1.001||y+h>1.001){skipped++;continue}
  const page=pdf.getPage(field.page-1),pw=page.getWidth(),ph=page.getHeight();
  const left=x*pw,bottom=(1-y-h)*ph,width=w*pw,height=h*ph;
  let size=Math.min(Number(field.fontSize)||12,Math.max(7,height*.8));
  const textWidth=font.widthOfTextAtSize(value,size);
  if(textWidth>width-4)size=size*(width-4)/textWidth;
  if(size<7){skipped++;continue}
  if(field.clearBackground===true)page.drawRectangle({x:left,y:bottom,width,height,color:PDFLib.rgb(1,1,1)});
  const textX=field.align==="center"?left+(width-font.widthOfTextAtSize(value,size))/2:field.align==="right"?left+width-font.widthOfTextAtSize(value,size)-2:left+2;
  page.drawText(value,{x:textX,y:bottom+Math.max(0,(height-size)/2),font,size,color:PDFLib.rgb(0,0,0)});
  count++;
 }
 return {blob:new Blob([await pdf.save()],{type:"application/pdf"}),count,skipped,pageCount:pdf.getPageCount()};
}
