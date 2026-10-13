/* PDF preview controller */
const prevPage=document.getElementById('prevPage'),nextPage=document.getElementById('nextPage'),pageCounter=document.getElementById('pageCounter'),pdfStage=document.getElementById('pdfRender');
let pdfZoom=1,zoomTimer=null,pdfRenderSerial=0,pdfDocument=null,parameterIndex=new Map(),detectedPages=new Set(),currentPDFPage=1,activeField=null,lastFormPage=0,activePageRender=0;
const PDF_OVERLAY_FONT_PT=12;
const formValues=(()=>{try{return JSON.parse(localStorage.getItem("school-procurement-preview-values-v1")||"{}")}catch{return {}}})();
function updatePageControls(){const total=pdfDocument?.numPages||0;pageCounter.textContent=total?currentPDFPage+' / '+total:'– / –';prevPage.disabled=!total||currentPDFPage<=1;nextPage.disabled=!total||currentPDFPage>=total;}
prevPage.addEventListener('click',()=>{if(pdfDocument&&currentPDFPage>1)renderPDFPage(currentPDFPage-1)});
nextPage.addEventListener('click',()=>{if(pdfDocument&&currentPDFPage<pdfDocument.numPages)renderPDFPage(currentPDFPage+1)});
async function loadPDF(){
 try{
  if(!window.pdfjsLib)throw new Error('ไม่สามารถโหลด PDF.js ได้');
  if(!pdfDocument){
   window.pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
   pdfStage.innerHTML='<p class="renderer-message">กำลังโหลด PDF ต้นฉบับ...</p>';
   const task=window.pdfjsLib.getDocument({url:'procurement-template13.pdf?version=20261013',cMapUrl:'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/cmaps/',cMapPacked:true});
   pdfDocument=await task.promise;
  }
  await scanPDFParameters();
  await renderPDFPage(currentPDFPage);
  document.getElementById('state').textContent='PDF ต้นฉบับ · '+pdfDocument.numPages+' หน้า';
 }catch(error){
  pdfStage.replaceChildren();const el=document.createElement('p');el.className='renderer-message';el.textContent='ไม่สามารถแสดง PDF ได้: '+error.message;pdfStage.append(el);
  document.getElementById('state').textContent='PDF โหลดไม่สำเร็จ';
 }
}
async function renderPDFPage(number,preserveScroll=false){
 if(!pdfDocument)return;const renderId=++activePageRender;currentPDFPage=number;updatePageControls();
 const p=await pdfDocument.getPage(number);const native=p.getViewport({scale:1});
 const maxWidth=Math.max(270,pdfStage.clientWidth-44);
 const ratio=Math.min(1.6,maxWidth/native.width)*pdfZoom;
 const viewport=p.getViewport({scale:ratio});
 const canvas=document.createElement('canvas');const scale=window.devicePixelRatio||1;
 canvas.width=Math.round(viewport.width*scale);canvas.height=Math.round(viewport.height*scale);
 canvas.style.cssText='display:block;margin:0 auto;background:white;box-shadow:0 2px 9px #0002;max-width:100%;width:'+viewport.width+'px;height:'+viewport.height+'px';
 const oldX=pdfStage.scrollLeft,oldY=pdfStage.scrollTop;
 const ctx=canvas.getContext('2d');
 const sheet=document.createElement('div');
 sheet.style.cssText='position:relative;margin:0 auto;width:'+viewport.width+'px;height:'+viewport.height+'px;';
 canvas.style.margin='0';canvas.style.maxWidth='none';sheet.appendChild(canvas);
 const layer=document.createElement('div');
 layer.className='pdf-parameter-overlay';
 layer.style.cssText='position:absolute;inset:0;pointer-events:none';
 sheet.appendChild(layer);pdfStage.replaceChildren(sheet);
 await p.render({canvasContext:ctx,viewport,transform:scale===1?null:[scale,0,0,scale,0,0]}).promise;
 if(renderId!==activePageRender)return;
 if(preserveScroll){pdfStage.scrollLeft=oldX;pdfStage.scrollTop=oldY;}else{pdfStage.scrollLeft=0;pdfStage.scrollTop=0;}
 try { await markPDFParameters(p,viewport,layer,number); if(lastFormPage!==number)renderFormFields(); }
 catch(e){console.warn('Parameter overlay unavailable:',e);}

}

/* Read parameters from the actual PDF text layer; never estimate using page order.
   Each rectangle follows PDF.js text-item coordinates on the matching canvas. */
async function markPDFParameters(page,viewport,layer,pageNumber){
 const content=await page.getTextContent();
 const rows=[];
 for(const it of content.items){
  if(!it.str||!it.transform||!it.width)continue;
  const tr=pdfjsLib.Util.transform(viewport.transform,it.transform);
  const x=tr[4],baseline=tr[5],height=Math.max(6,Math.hypot(tr[2],tr[3]));
  const width=it.width*viewport.scale;
  let row=rows.find(r=>Math.abs(r.baseline-baseline)<Math.max(3,height*.32));
  if(!row){row={baseline,items:[]};rows.push(row);}
  row.items.push({str:it.str,x,width,height,baseline});
 }
 let count=0;
 for(const row of rows){
  row.items.sort((a,b)=>a.x-b.x);
  let joined='',charBoxes=[];
  for(const it of row.items){
   // PDF text fragments may split a single parameter into several items.
   const chars=Array.from(it.str);
   for(let j=0;j<chars.length;j++){
    joined+=chars[j];
    charBoxes.push({x:it.x+it.width*j/chars.length,w:it.width/chars.length,h:it.height,y:it.baseline-it.height});
   }
  }
  // Supports {{parameter_name}}. Do not draw on ordinary text.
  const matches=[...joined.matchAll(/\{\{\s*([\w.-]+)\s*\}\}/g)];
  for(const match of matches){
   const start=match.index,end=start+Array.from(match[0]).length;
   const relevant=charBoxes.slice(start,end);
   if(!relevant.length)continue;
   const x=Math.max(0,Math.min(...relevant.map(v=>v.x))-2);
   const y=Math.max(0,Math.min(...relevant.map(v=>v.y))-2);
   const right=Math.min(viewport.width,Math.max(...relevant.map(v=>v.x+v.w))+2);
   const bottom=Math.min(viewport.height,Math.max(...relevant.map(v=>v.y+v.h))+2);
   if(right<=x||bottom<=y)continue;
   const marker=document.createElement('div');marker.className='parameter-marker';
   marker.style.cssText='left:'+x+'px;top:'+y+'px;width:'+(right-x)+'px;height:'+(bottom-y)+'px;';
   const entered=formValues[match[1]];
   if(entered!==undefined&&entered!==''){
     marker.classList.add('has-value');
     marker.style.width='auto';marker.style.minWidth=(right-x)+'px';
     const text=document.createElement('span');text.className='replacement-text';
     text.textContent=calendarFieldKeys.has(match[1])?toThaiDocumentDate(entered):entered;
     text.style.fontSize=(PDF_OVERLAY_FONT_PT*viewport.scale)+'px';
     text.style.padding='0 '+(2*viewport.scale)+'px';
     // A zero-height inline box identifies the browser's actual text baseline.
     const baselineProbe=document.createElement('span');
     baselineProbe.style.cssText='display:inline-block;width:0;height:0;padding:0;margin:0;border:0;vertical-align:baseline';
     text.appendChild(baselineProbe);
     marker.appendChild(text);
     layer.appendChild(marker);
     const targetBaseline=layer.getBoundingClientRect().top+row.baseline;
     const actualBaseline=baselineProbe.getBoundingClientRect().bottom;
     text.style.transform='translateY('+(targetBaseline-actualBaseline)+'px)';
   }else{
     layer.appendChild(marker);
   }
   if(activeField===match[1])marker.classList.add('active');
   count++;
  }
 }
 const status=document.getElementById('state');
 status.textContent='PDF หน้า '+pageNumber+' · พารามิเตอร์ที่พบ '+count+' ตำแหน่ง';
 if(count===0){
  const msg=document.createElement('div');
  msg.style.cssText='position:absolute;right:10px;bottom:10px;background:#fff9ee;color:#715223;border:1px solid #e9d4ac;border-radius:6px;padding:7px 9px;font-size:12px;pointer-events:none';
  msg.textContent='หน้านี้ไม่พบพารามิเตอร์ {{...}} ในชั้นข้อความ PDF';
  layer.append(msg);
 }
}


async function scanPDFParameters(){
 parameterIndex=new Map();detectedPages=new Set();
 for(let pageNumber=1;pageNumber<=pdfDocument.numPages;pageNumber++){
  const page=await pdfDocument.getPage(pageNumber),data=await page.getTextContent();
  const rows=[];
  for(const it of data.items){
   if(!it.str||!it.transform)continue;
   const y=it.transform[5];
   let row=rows.find(r=>Math.abs(r.y-y)<2.5);
   if(!row){row={y,parts:[]};rows.push(row);}
   row.parts.push({x:it.transform[4],str:it.str});
  }
  for(const row of rows){
   row.parts.sort((a,b)=>a.x-b.x);
   const joined=row.parts.map(x=>x.str).join('');
   for(const m of joined.matchAll(/\{\{\s*([\w.-]+)\s*\}\}/g)){
    const key=m[1];if(!parameterIndex.has(key))parameterIndex.set(key,new Set());
    parameterIndex.get(key).add(pageNumber);
    detectedPages.add(pageNumber);
   }
  }
 }
 renderFormFields();
}

function highlightField(key){
 for(const marker of document.querySelectorAll('.pdf-parameter-overlay .parameter-marker')){
  marker.classList.toggle('active',marker.getAttribute('title')===key);
 }
}

pdfStage.addEventListener('wheel',event=>{
 if(!pdfDocument)return;
 event.preventDefault();
 const direction=event.deltaY<0?1:-1;
 const next=Math.max(0.3,Math.min(1,Math.round((pdfZoom+direction*0.1)*10)/10));
 if(next===pdfZoom)return;
 const factor=next/pdfZoom;pdfZoom=next;
 document.getElementById('zoomIndicator').textContent='ขยาย '+Math.round(pdfZoom*100)+'%';
 const previousX=pdfStage.scrollLeft,previousY=pdfStage.scrollTop;
 clearTimeout(zoomTimer);
 zoomTimer=setTimeout(async()=>{
  const serial=++pdfRenderSerial;
  await renderPDFPage(currentPDFPage,true);
  if(serial===pdfRenderSerial){
   pdfStage.scrollLeft=Math.round(previousX*factor);
   pdfStage.scrollTop=Math.round(previousY*factor);
  }
 },130);
},{passive:false});
