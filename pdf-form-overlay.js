// Initial coordinate map for the 11-page official school PDF.
// Coordinates are points on an A4 page, origin at bottom-left.
// Every field placement must be visually verified against the school's master.
const slots=[
 {page:1,key:"school",x:165,y:771,w:128,size:10},{page:1,key:"requestDate",x:386,y:755,w:138,size:10},
 {page:1,key:"subject",x:350,y:737,w:174,size:10},{page:1,key:"fiscalYear",x:315,y:680,w:125,size:10},
 {page:1,key:"budget",x:119,y:627,w:126,size:10},
 {page:2,key:"school",x:167,y:774,w:130,size:10},{page:2,key:"requestDate",x:391,y:749,w:123,size:10},
 {page:2,key:"subject",x:217,y:696,w:291,size:10},
 {page:3,key:"subject",x:185,y:782,w:225,size:10},
 {page:3,key:"budget",x:141,y:670,w:147,size:10},
 {page:5,key:"school",x:161,y:776,w:138,size:10},{page:5,key:"requestDate",x:391,y:753,w:127,size:10},
 {page:5,key:"subject",x:229,y:732,w:282,size:10},
 {page:7,key:"vendor",x:255,y:644,w:230,size:10},
 {page:8,key:"school",x:215,y:776,w:212,size:10},{page:8,key:"vendor",x:255,y:683,w:180,size:10},
 {page:9,key:"vendor",x:301,y:701,w:180,size:10},
 {page:10,key:"school",x:160,y:777,w:160,size:10},{page:10,key:"vendor",x:120,y:700,w:159,size:10},
];
const fontUrl="https://raw.githubusercontent.com/google/fonts/main/ofl/sarabun/Sarabun-Regular.ttf";
let fontBytesPromise;
async function thaiFontBytes(){
 if(!fontBytesPromise)fontBytesPromise=fetch(fontUrl).then(async r=>{if(!r.ok)throw Error("โหลดฟอนต์ไทยไม่สำเร็จ HTTP "+r.status);return r.arrayBuffer()}).catch(e=>{fontBytesPromise=null;throw e});
 return fontBytesPromise;
}
export async function fillProcurementPdf(pdfBlob,values){
 if(!globalThis.PDFLib?.PDFDocument)throw Error("ไม่พบโปรแกรมจัดการ PDF");
 if(!globalThis.fontkit)throw Error("ไม่พบตัวอ่านฟอนต์ไทยสำหรับ PDF");
 const src=await pdfBlob.arrayBuffer();
 const doc=await PDFLib.PDFDocument.load(src);
 doc.registerFontkit(globalThis.fontkit);
 const font=await doc.embedFont(await thaiFontBytes(),{subset:false});
 const pages=doc.getPages();
 let placed=0;
 for(const slot of slots){
  const value=String(values[slot.key]??"").trim();
  if(!value||slot.page>pages.length)continue;
  const p=pages[slot.page-1];
  const scale=Math.min(p.getWidth()/595.28,p.getHeight()/841.89);
  const x=slot.x*scale,y=slot.y*scale,maxWidth=slot.w*scale;
  let text=value,size=slot.size*scale;
  if(font.widthOfTextAtSize(text,size)>maxWidth){
    size=Math.max(7*scale,size*maxWidth/font.widthOfTextAtSize(text,size));
  }
  // Erase only the small dotted area, leaving the underlying government form intact.
  p.drawRectangle({x:x-1.5*scale,y:y-1.3*scale,width:maxWidth+2*scale,height:size+3*scale,color:PDFLib.rgb(1,1,1)});
  p.drawText(text,{x,y,size,font,color:PDFLib.rgb(0,0,0),maxWidth,wordBreaks:[" "]});
  placed++;
 }
 return {blob:new Blob([await doc.save()],{type:"application/pdf"}),count:placed,pageCount:pages.length};
}
