// PDF positions are read ONLY from Admin-saved normalized field rectangles.
// No automatic guessing from dotted lines or surrounding Thai text.
const fontUrl="https://raw.githubusercontent.com/google/fonts/main/ofl/sarabun/Sarabun-Regular.ttf";
let fontPromise;
function fontBytes(){
 if(!fontPromise)fontPromise=fetch(fontUrl).then(r=>{
  if(!r.ok)throw Error("โหลดฟอนต์ภาษาไทยไม่ได้: HTTP "+r.status);
  return r.arrayBuffer();
 }).catch(e=>{fontPromise=null;throw e});
 return fontPromise;
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
