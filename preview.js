/* Word HTML preview controller. Every displayed page comes from the DOCX source. */
const prevPage=document.getElementById('prevPage'),nextPage=document.getElementById('nextPage'),pageCounter=document.getElementById('pageCounter'),pdfStage=document.getElementById('pdfRender');
let pdfZoom=1,zoomTimer=null,pdfRenderSerial=0,pdfDocument=null,parameterIndex=new Map(),detectedPages=new Set(),currentPDFPage=1,activeField=null,lastFormPage=0,activePageRender=0;
let wordPages=[],wordPageNodes=[];
const formValues=(()=>{try{return JSON.parse(localStorage.getItem('school-procurement-preview-values-v1')||'{}')}catch{return {}}})();
const WORD_NS='http://schemas.openxmlformats.org/wordprocessingml/2006/main';
const wn=(node,name)=>Array.from(node?.children||[]).find(n=>n.localName===name&&n.namespaceURI===WORD_NS);
const wns=(node,name)=>Array.from(node?.children||[]).filter(n=>n.localName===name&&n.namespaceURI===WORD_NS);
const wa=(node,name)=>node?.getAttributeNS(WORD_NS,name)||'';
function updatePageControls(){
 const total=pdfDocument?.numPages||0;
 pageCounter.textContent=total?currentPDFPage+' / '+total:'– / –';
 prevPage.disabled=!total||currentPDFPage<=1;
 nextPage.disabled=!total||currentPDFPage>=total;
 const title=document.getElementById('previewTitle');
 if(title)title.textContent='ตัวอย่างเอกสาร · HTML + CSS ทุกหน้า';
}
prevPage.addEventListener('click',()=>{if(currentPDFPage>1)renderPDFPage(currentPDFPage-1)});
nextPage.addEventListener('click',()=>{if(pdfDocument&&currentPDFPage<pdfDocument.numPages)renderPDFPage(currentPDFPage+1)});
function wordFieldFragments(text){
 const f=document.createDocumentFragment();
 for(const part of text.split(/(\{\{\s*[\w.-]+\s*\}\})/g)){
  const m=part.match(/^\{\{\s*([\w.-]+)\s*\}\}$/);
  if(!m){f.append(document.createTextNode(part));continue}
  const span=document.createElement('span'),key=m[1],value=formValues[key];
  span.dataset.field=key;span.className='word-parameter'+(value!==undefined&&value!==''?' word-filled':'');
  span.textContent=value!==undefined&&value!==''?(calendarFieldKeys.has(key)?toThaiDocumentDate(value):String(value)):part;
  span.addEventListener('click',()=>{const el=document.getElementById('field-'+key);if(el){el.focus();el.scrollIntoView({block:'nearest'})}});
  f.append(span);
 }
 return f;
}
function paragraphHTML(p){
 const el=document.createElement('p');el.className='word-paragraph';
 const pr=wn(p,'pPr'),jc=wn(pr,'jc'),spacing=wn(pr,'spacing'),ind=wn(pr,'ind');
 const alignment=wa(jc,'val');
 if(['center','right','both','justify'].includes(alignment))el.style.textAlign=alignment==='both'?'justify':alignment;
 const left=Number(wa(ind,'left')),first=Number(wa(ind,'firstLine')),hanging=Number(wa(ind,'hanging'));
 if(left)el.style.marginLeft=(left/20)+'pt';
 if(first)el.style.textIndent=(first/20)+'pt';
 if(hanging)el.style.textIndent=(-hanging/20)+'pt';
 const before=Number(wa(spacing,'before')),after=Number(wa(spacing,'after'));
 if(before)el.style.marginTop=(before/20)+'pt';
 el.style.marginBottom=(after?after/20:12)+'pt';
 const line=Number(wa(spacing,'line')),lineRule=wa(spacing,'lineRule');
 if(line){if(lineRule==='exact')el.style.lineHeight=(line/20)+'pt';else if(lineRule==='atLeast')el.style.lineHeight='max(1.12em,'+(line/20)+'pt)';else el.style.lineHeight=String(line/240)}
 for(const run of Array.from(p.getElementsByTagNameNS(WORD_NS,'r'))){
  const span=document.createElement('span'),rpr=wn(run,'rPr');
  if(wn(rpr,'b'))span.style.fontWeight='bold';
  if(wn(rpr,'i'))span.style.fontStyle='italic';
  if(wn(rpr,'u'))span.style.textDecoration='underline';
  const size=Number(wa(wn(rpr,'sz'),'val'));
  if(size)span.style.fontSize=(size/2)+'pt';
  for(const part of Array.from(run.children)){
   if(part.localName==='t')span.append(wordFieldFragments(part.textContent||''));
   else if(part.localName==='tab')span.append(document.createTextNode('　　'));
   else if(part.localName==='br'||part.localName==='cr')span.append(document.createElement('br'));
  }
  el.append(span);
 }
 if(!el.textContent.trim()&&!el.querySelector('br'))el.classList.add('word-empty');
 if(el.textContent.trim()==='บันทึกข้อความ')el.classList.add('word-memo-title');
 return el;
}
function tableHTML(tbl){
 const table=document.createElement('table');table.className='word-table';
 for(const tr of wns(tbl,'tr')){
  const row=document.createElement('tr');
  for(const tc of wns(tr,'tc')){
   const cell=document.createElement('td'),gridSpan=Number(wa(wn(wn(tc,'tcPr'),'gridSpan'),'val'));
   if(gridSpan>1)cell.colSpan=gridSpan;
   for(const child of Array.from(tc.children)){
    if(child.localName==='p')cell.append(paragraphHTML(child));
    else if(child.localName==='tbl')cell.append(tableHTML(child));
   }
   row.append(cell);
  }
  table.append(row);
 }
 return table;
}
function wordBlocks(body){
 const blocks=[],groups=[[]];
 for(const node of Array.from(body.children)){
  if(!['p','tbl'].includes(node.localName))continue;
  const hasBreak=node.getElementsByTagNameNS(WORD_NS,'lastRenderedPageBreak').length>0;
  if(hasBreak&&groups[groups.length-1].length)groups.push([]);
  const element=node.localName==='p'?paragraphHTML(node):tableHTML(node);
  groups[groups.length-1].push(element);
 }
 return groups;
}
function refreshIndex(){
 parameterIndex=new Map();detectedPages=new Set();
 for(let i=0;i<wordPages.length;i++){
  const page=i+1;
  const keys=new Set(Array.from(wordPages[i].querySelectorAll('[data-field]')).map(el=>el.dataset.field));
  for(const key of keys){
   if(!parameterIndex.has(key))parameterIndex.set(key,new Set());
   parameterIndex.get(key).add(page);detectedPages.add(page);
  }
 }
 renderFormFields();
}
function buildPage(content){
 const page=document.createElement('article');page.className='word-a4 word-generated';
 const inner=document.createElement('div');inner.className='word-content';
 for(const child of content)inner.append(child);
 page.append(inner);
 return page;
}
function paginateWord(groups){
 const pages=[];
 const staging=document.createElement('div');
 staging.style.cssText='position:absolute;left:-20000px;top:0;visibility:hidden;width:210mm;pointer-events:none';
 document.body.append(staging);
 try{
  for(let groupIndex=0;groupIndex<groups.length;groupIndex++){
   if(groupIndex===0){const first=document.createElement('template');first.innerHTML=wordFirstPageHTML;pages.push(first.content.firstElementChild);continue}
   let page=buildPage([]);staging.append(page);
   let inner=page.firstElementChild;
   for(const element of groups[groupIndex]){
    inner.append(element);
    const maxHeight=page.clientHeight-parseFloat(getComputedStyle(page).paddingTop)-parseFloat(getComputedStyle(page).paddingBottom);
    if(inner.scrollHeight>maxHeight+2&&inner.children.length>1){
     inner.removeChild(element);pages.push(page);page=buildPage([element]);staging.append(page);inner=page.firstElementChild;
    }
   }
   pages.push(page);
  }
 }finally{staging.remove()}
 return pages;
}
async function loadPDF(){
 try{
  if(!window.JSZip)throw Error('ไม่สามารถโหลด JSZip เพื่ออ่าน Word');
  pdfStage.innerHTML='<p class="renderer-message">กำลังอ่านเอกสาร Word ต้นฉบับ...</p>';
  const response=await fetch('procurement-template13.docx',{cache:'no-store'});
  if(!response.ok)throw Error('ไม่สามารถอ่าน Word ต้นฉบับ ('+response.status+')');
  const zip=await JSZip.loadAsync(await response.arrayBuffer());
  const file=zip.file('word/document.xml');
  if(!file)throw Error('ไม่พบ word/document.xml');
  const doc=new DOMParser().parseFromString(await file.async('string'),'application/xml');
  if(doc.querySelector('parsererror'))throw Error('อ่าน XML ของ Word ไม่สำเร็จ');
  const body=doc.getElementsByTagNameNS(WORD_NS,'body')[0];
  const groups=wordBlocks(body);
  await document.fonts?.load('16pt ProcurementSarabun');
  wordPages=paginateWord(groups);
  if(!wordPages.length)throw Error('ไม่พบหน้าเอกสาร');
  pdfDocument={numPages:wordPages.length};
  currentPDFPage=Math.min(currentPDFPage,wordPages.length);
  updatePageControls();refreshIndex();await renderPDFPage(currentPDFPage);
  document.getElementById('state').textContent='HTML + CSS จาก Word · '+wordPages.length+' หน้า';
 }catch(error){
  console.error('Word preview:',error);
  pdfStage.replaceChildren();const message=document.createElement('p');message.className='renderer-message';message.textContent='ไม่สามารถแสดง Word Preview: '+error.message;pdfStage.append(message);
  document.getElementById('state').textContent='Word Preview โหลดไม่สำเร็จ';
 }
}
async function renderPDFPage(number,preserveScroll=false){
 if(!pdfDocument)return;
 currentPDFPage=Math.max(1,Math.min(number,pdfDocument.numPages));updatePageControls();
 if(number===1){renderHTMLFirstPage(preserveScroll);return}
 const oldX=pdfStage.scrollLeft,oldY=pdfStage.scrollTop;
 const shell=document.createElement('div');shell.className='word-page-shell';
 const page=wordPages[currentPDFPage-1].cloneNode(true);
 shell.append(page);pdfStage.replaceChildren(shell);
 const base=210*96/25.4,available=Math.max(270,pdfStage.clientWidth-44);
 const zoom=Math.min(1.6,available/base)*pdfZoom;
 page.style.transform='scale('+zoom+')';
 const measure=()=>{shell.style.width=(base*zoom)+'px';shell.style.height=(page.offsetHeight*zoom)+'px'};
 measure();
 if(preserveScroll){pdfStage.scrollLeft=oldX;pdfStage.scrollTop=oldY}else{pdfStage.scrollLeft=0;pdfStage.scrollTop=0}
 if(lastFormPage!==currentPDFPage)renderFormFields();
}
function highlightField(key){
 for(const marker of pdfStage.querySelectorAll('[data-field]'))marker.classList.toggle('word-active',marker.dataset.field===key);
}
pdfStage.addEventListener('wheel',event=>{
 if(!pdfDocument)return;
 event.preventDefault();
 const next=Math.max(.3,Math.min(1,Math.round((pdfZoom+(event.deltaY<0?.1:-.1))*10)/10));
 if(next===pdfZoom)return;
 pdfZoom=next;document.getElementById('zoomIndicator').textContent='ขยาย '+Math.round(pdfZoom*100)+'%';
 clearTimeout(zoomTimer);zoomTimer=setTimeout(()=>renderPDFPage(currentPDFPage,true),130);
},{passive:false});
