// PDF positions are read ONLY from Admin-saved normalized field rectangles.
// No automatic guessing from dotted lines or surrounding Thai text.
// Prefer the private Admin-installed THSarabunIT๙ font in Firebase Storage.
let fontProvider=null;
let fontPromise=null;
export function setProcurementPdfFontLoader(loader){
 fontProvider=loader;
 fontPromise=null;
}
async function fontBytes(){
 if(!fontPromise)fontPromise=(async()=>{
  if(fontProvider){
   try{const bytes=await fontProvider();if(bytes?.byteLength)return bytes}
   catch(e){
    // A font read error must NEVER prevent rendering already-mapped form values.
    // Unauthorized, unavailable, timeout, CORS, etc. all use the Thai-capable fallback.
    console.warn("Private PDF font unavailable; using Sarabun fallback:",e?.code||e?.message||e);
   }
  }
  // Temporary compatible fallback, never labelled as THSarabunIT๙.
  const url="https://raw.githubusercontent.com/google/fonts/main/ofl/sarabun/Sarabun-Regular.ttf";
  const response=await fetch(url);
  if(!response.ok)throw Error("ไม่สามารถโหลดฟอนต์สำรอง HTTP "+response.status);
  return response.arrayBuffer();
 })().catch(e=>{fontPromise=null;throw e});
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
  let value=String(values[field.key]??"").trim();
  if(/^\d{4}-\d{2}-\d{2}$/.test(value)){
   const [yy,mm,dd]=value.split("-").map(Number);
   const months=["มกราคม","กุมภาพันธ์","มีนาคม","เมษายน","พฤษภาคม","มิถุนายน","กรกฎาคม","สิงหาคม","กันยายน","ตุลาคม","พฤศจิกายน","ธันวาคม"];
   if(yy>1900&&mm>=1&&mm<=12&&dd>=1&&dd<=31)value=dd+" "+months[mm-1]+" "+(yy+543);
  }
  if(!value)continue;
  const x=Number(field.x),y=Number(field.y),w=Number(field.w),h=Number(field.h);
  if(![x,y,w,h].every(Number.isFinite)||w<=0||h<=0||x<0||y<0||x+w>1.001||y+h>1.001){skipped++;continue}
  const page=pdf.getPage(field.page-1),pw=page.getWidth(),ph=page.getHeight();
  const left=x*pw,bottom=(1-y-h)*ph,width=w*pw,height=h*ph;
  // Official document rule: constant THSarabunPSK 16 pt, never auto-shrink.
  const size=16;
  const textWidth=font.widthOfTextAtSize(value,size);
  if(textWidth>width-4||height<size){skipped++;continue}
  if(field.clearBackground===true)page.drawRectangle({x:left,y:bottom,width,height,color:PDFLib.rgb(1,1,1)});
  const textX=field.align==="center"?left+(width-font.widthOfTextAtSize(value,size))/2:field.align==="right"?left+width-font.widthOfTextAtSize(value,size)-2:left+2;
  page.drawText(value,{x:textX,y:bottom+Math.max(0,(height-size)/2),font,size,color:PDFLib.rgb(0,0,0)});
  count++;
 }
 return {blob:new Blob([await pdf.save()],{type:"application/pdf"}),count,skipped,pageCount:pdf.getPageCount()};
}
