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
 el.style.marginBottom=(wa(spacing,'after')!==''?after/20:0)+'pt';
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
 // Resolve placeholders spanning multiple Word runs without changing surrounding text.
 const walker=document.createTreeWalker(el,NodeFilter.SHOW_TEXT);
 const textNodes=[];while(walker.nextNode())textNodes.push(walker.currentNode);
 const full=textNodes.map(n=>n.nodeValue||'').join('');
 const matches=Array.from(full.matchAll(/\{\{\s*([\w.-]+)\s*\}\}/g)).reverse();
 for(const match of matches){
  const begin=match.index,end=begin+match[0].length;
  let pos=0,first=null,last=null,firstOffset=0,lastOffset=0;
  for(const node of textNodes){
   const next=pos+(node.nodeValue||'').length;
   if(!first&&begin>=pos&&begin<next){first=node;firstOffset=begin-pos}
   if(end>pos&&end<=next){last=node;lastOffset=end-pos;break}
   pos=next;
  }
  if(!first||!last)continue;
  if(first.parentElement?.closest('[data-field]')||last.parentElement?.closest('[data-field]'))continue;
  const marker=document.createElement('span');marker.dataset.field=match[1];marker.className='word-parameter word-overlay-field';
  const value=formValues[match[1]];
  marker.textContent=value!==undefined&&value!==''?String(value):match[0];
  marker.classList.toggle('word-filled',value!==undefined&&value!=='');
  if(first===last){const original=first.nodeValue||'';first.nodeValue=original.slice(0,firstOffset);first.after(marker,document.createTextNode(original.slice(lastOffset)))}
  else{
   const prefix=(first.nodeValue||'').slice(0,firstOffset),suffix=(last.nodeValue||'').slice(lastOffset);
   let between=false;
   for(const node of textNodes){if(node===first){between=true;node.nodeValue=prefix;continue}if(node===last){node.nodeValue=suffix;break}if(between)node.nodeValue=''}
   first.after(marker);
  }
 }
 if(!el.textContent.trim()&&!el.querySelector('br'))el.classList.add('word-empty');
 if(el.textContent.trim()==='บันทึกข้อความ')el.classList.add('word-memo-title');
 return el;
}
/* Page 4 table only: preserve the original DOCX grid and merged cells. */
let sourcePage4Table=null;
const sourceTableForPreview=new WeakMap();
function page4TableHTML(tbl,tableClass='word-page4-table'){
 const table=document.createElement('table');table.className='word-table '+tableClass;
 const grid=wn(tbl,'tblGrid'),widths=wns(grid,'gridCol').map(c=>Number(wa(c,'w'))||1);
 const colgroup=document.createElement('colgroup');
 for(const width of widths){const col=document.createElement('col');col.style.width=(width/widths.reduce((a,b)=>a+b,0)*100)+'%';colgroup.append(col)}
 table.append(colgroup);
 const rows=wns(tbl,'tr'),occupied=new Map();
 rows.forEach((tr,ri)=>{
  const row=document.createElement('tr');let column=0;
  for(const tc of wns(tr,'tc')){
   const pr=wn(tc,'tcPr'),span=Number(wa(wn(pr,'gridSpan'),'val'))||1;
   const merge=wn(pr,'vMerge'),isContinuation=merge&&wa(merge,'val')!=='restart';
   if(isContinuation){column+=span;continue}
   const cell=document.createElement(ri<2?'th':'td');if(span>1)cell.colSpan=span;
   if(merge&&wa(merge,'val')==='restart'){
    let count=1;
    for(let next=ri+1;next<rows.length;next++){
     let offset=0,matched=null;
     for(const candidate of wns(rows[next],'tc')){
      const candidateSpan=Number(wa(wn(wn(candidate,'tcPr'),'gridSpan'),'val'))||1;
      if(offset===column){matched=candidate;break}offset+=candidateSpan;
     }
     if(!matched||!wn(wn(matched,'tcPr'),'vMerge')||wa(wn(wn(wn(matched,'tcPr'),'vMerge'),'val'))==='restart')break;
     count++;
    }
    if(count>1)cell.rowSpan=count;
   }
   for(const child of Array.from(tc.children)){
    if(child.localName==='p')cell.append(paragraphHTML(child));
    else if(child.localName==='tbl')cell.append(tableHTML(child));
   }
   row.append(cell);column+=span;
  }
  table.append(row);
 });
 return table;
}
/* Page 6 only: retain Word cells and border omissions, with equal satang columns. */
function page6TableHTML(tbl){
 const table=page4TableHTML(tbl,'word-page6-table');
 const widths=wns(wn(tbl,'tblGrid'),'gridCol').map(c=>Number(wa(c,'w'))||1);
 // Keep each baht/satang pair's total width from Word.
 if(widths.length===9){
  const satangWidth=Math.max(widths[4],widths[6],widths[8]);
  for(const index of [4,6,8]){
   widths[index-1]+=widths[index]-satangWidth;
   widths[index]=satangWidth;
  }
  const total=widths.reduce((a,b)=>a+b,0);
  Array.from(table.querySelectorAll('col')).forEach((col,index)=>{
   col.style.width=(widths[index]/total*100)+'%';
  });
 }
 wns(tbl,'tr').forEach((tr,rowIndex)=>{
  let cellIndex=0,column=0;
  for(const tc of wns(tr,'tc')){
   const pr=wn(tc,'tcPr'),span=Number(wa(wn(pr,'gridSpan'),'val'))||1;
   const merge=wn(pr,'vMerge');
   if(merge&&wa(merge,'val')!=='restart'){column+=span;continue}
   const cell=table.rows[rowIndex].cells[cellIndex++];
   for(const side of ['top','right','bottom','left']){
    const border=wn(wn(pr,'tcBorders'),side);
    if(border&&['nil','none'].includes(wa(border,'val')))cell.style.setProperty('border-'+side+'-style','hidden');
   }
   if(span===1&&[4,6,8].includes(column))cell.classList.add('p6-satang');
   column+=span;
  }
 });
 return table;
}
/* Page 10: six financial rows and four original Word columns. */
function page10TableHTML(tbl){
 const table=document.createElement('table');table.className='word-table word-page10-table';
 const widths=wns(wn(tbl,'tblGrid'),'gridCol').map(c=>Number(wa(c,'w'))||1);
 const total=widths.reduce((a,b)=>a+b,0),cols=document.createElement('colgroup');
 widths.forEach(width=>{const col=document.createElement('col');col.style.width=(width/total*100)+'%';cols.append(col)});
 table.append(cols);
 for(const tr of wns(tbl,'tr')){
  const row=document.createElement('tr');
  for(const tc of wns(tr,'tc')){
   const cell=document.createElement('td');
   for(const p of wns(tc,'p'))cell.append(paragraphHTML(p));
   row.append(cell);
  }
  table.append(row);
 }
 return table;
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
 const groups=[[]];
 // Verified source-page paragraph IDs survive Word saves that remove cached
 // rendered breaks. Use them only when that pagination metadata is missing.
 const sourcePageStarts=new Set(['5DB60E57','0DBFFFC7','1EF677F8','543D6E79','4167D585','35A32B33','33AC75F2','4B2D7EED','07C7A332','300606A2']);
 const recoverSourcePages=body.getElementsByTagNameNS(WORD_NS,'lastRenderedPageBreak').length<9;
 for(const node of Array.from(body.children)){
  if(!['p','tbl'].includes(node.localName))continue;
  const text=Array.from(node.getElementsByTagNameNS(WORD_NS,'t')).map(n=>n.textContent||'').join('').trim();
  const paragraphSettings=wn(node,'pPr');
  const hasRenderedBreak=node.getElementsByTagNameNS(WORD_NS,'lastRenderedPageBreak').length>0;
  const hasExplicitBreak=Array.from(node.getElementsByTagNameNS(WORD_NS,'br')).some(n=>wa(n,'type')==='page');
  const hasPageBreakBefore=Boolean(wn(paragraphSettings,'pageBreakBefore'));
  // DOCX records nine rendered breaks. Its announcement begins a separate
  // physical page without a stored break; verified against the original
  // eleven-page document's page 8 (not an inferred layout position).
  const announcementPageStart=node.localName==='p'&&text==='ประกาศโรงเรียนค่ายบางระจันวิทยาคม';
  const recoveredStart=recoverSourcePages&&sourcePageStarts.has(node.getAttributeNS('http://schemas.microsoft.com/office/word/2010/wordml','paraId'));
  if((recoveredStart||hasRenderedBreak||hasExplicitBreak||hasPageBreakBefore||announcementPageStart)&&groups[groups.length-1].length)groups.push([]);
  const element=node.localName==='p'?paragraphHTML(node):tableHTML(node);
  if(node.localName==='tbl')sourceTableForPreview.set(element,node);
  groups[groups.length-1].push(element);
 }
 return groups.filter(group=>group.length>0);
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
 // One HTML sheet per source-document page. Never create extra pages based on
 // approximate browser heights: that changes the original page boundaries.
 return groups.map((group,groupIndex)=>{
  if(groupIndex===0){
   const first=document.createElement('template');first.innerHTML=wordFirstPageHTML;
   const page=first.content.firstElementChild;
   const walker=document.createTreeWalker(page,NodeFilter.SHOW_TEXT),nodes=[];
   while(walker.nextNode())nodes.push(walker.currentNode);
   for(const node of nodes)if(/\{\{[\w.-]+\}\}/.test(node.nodeValue||''))node.replaceWith(wordFieldFragments(node.nodeValue));
   return page;
  }
  if(groupIndex===1){
   const template=document.createElement('template');template.innerHTML=wordSecondPageHTML;
   const page=template.content.firstElementChild;
   const walker=document.createTreeWalker(page,NodeFilter.SHOW_TEXT),nodes=[];
   while(walker.nextNode())nodes.push(walker.currentNode);
   for(const node of nodes)if(/\{\{[\w.-]+\}\}/.test(node.nodeValue||''))node.replaceWith(wordFieldFragments(node.nodeValue));
   return page;
  }
  if(groupIndex===2){
   const template=document.createElement('template');template.innerHTML=wordThirdPageHTML;
   const page=template.content.firstElementChild;
   const walker=document.createTreeWalker(page,NodeFilter.SHOW_TEXT),nodes=[];
   while(walker.nextNode())nodes.push(walker.currentNode);
   for(const node of nodes)if(/\{\{[\w.-]+\}\}/.test(node.nodeValue||''))node.replaceWith(wordFieldFragments(node.nodeValue));
   return page;
  }
  // Pages 4–11: isolate original Word blocks into flex sections without
  // changing their order, text, table cells, or the approved pages 1–3.
  function applyPageSections(page){
   const content=page.querySelector('.word-content');
   if(!content)return page;
   content.classList.add('word-flex-layout');
   const nodes=Array.from(content.children);
   let section=null;
   for(const node of nodes){
    const text=(node.textContent||'').trim();
    const isTable=node.matches('table');
    const isHeading=!isTable&&(/^(?:บันทึกข้อความ|ประกาศ|ใบเบิกพัสดุ|ใบตรวจรับพัสดุ|เรื่อง\\s|เรียน\\s|[๐-๙0-9]+[.)]\\s)/.test(text));
    if(!section||isHeading||isTable){
     section=document.createElement('div');
     section.className='word-flex-section'+(isTable?' word-flex-table-section':isHeading?' word-flex-heading-section':'');
     content.append(section);
    }
    section.append(node);
    if(isTable)section=null;
   }
   return page;
  }
  if(groupIndex===4){
   const page=buildPage(group);
   page.classList.add('word-page5');
   const paragraphs=Array.from(page.querySelectorAll('.word-content > .word-paragraph'));
   const subject=paragraphs.find(p=>/^เรื่อง\s/.test(p.textContent.trim()));
   if(subject)subject.classList.add('p5-subject-rule');
   return applyPageSections(page);
  }
  if(groupIndex===10){
   const page=buildPage(group);page.classList.add('word-page11');
   const content=page.querySelector('.word-content');
   for(const table of Array.from(content.querySelectorAll(':scope > table.word-table'))){
    const source=sourceTableForPreview.get(table);
    if(!source)continue;
    const replacement=page10TableHTML(source);replacement.className='word-table word-page11-table';
    for(const cell of Array.from(replacement.rows[0].cells)){
     const header=document.createElement('th');header.scope='col';
     while(cell.firstChild)header.append(cell.firstChild);
     cell.replaceWith(header);
    }
    table.replaceWith(replacement);
   }
   return applyPageSections(page);
  }
  if(groupIndex===9){
   const page=buildPage(group);
   for(const table of Array.from(page.querySelectorAll('.word-content > table.word-table'))){
    const source=sourceTableForPreview.get(table);
    if(source)table.replaceWith(page10TableHTML(source));
   }
   return applyPageSections(page);
  }
  if(groupIndex===5){
   const page=buildPage(group);
   for(const table of Array.from(page.querySelectorAll('.word-content > table.word-table'))){
    const source=sourceTableForPreview.get(table);
    if(source)table.replaceWith(page6TableHTML(source));
   }
   return applyPageSections(page);
  }
  if(groupIndex===3){
   const page=buildPage(group);
   const content=page.querySelector('.word-content');
   if(content){
    const nodes=Array.from(content.children);
    const sourceTableNode=nodes.find(node=>node.matches('table.word-table'));
    if(sourceTableNode){
     const before=document.createElement('div');before.className='p4-before-table';
     const after=document.createElement('div');after.className='p4-after-table';
     let pastTable=false;
     for(const node of nodes){
      if(node===sourceTableNode){pastTable=true;continue}
      (pastTable?after:before).append(node);
     }
     content.replaceChildren(before,sourceTableNode,after);
     content.classList.add('p4-layout');
    }
   }
   const table=page.querySelector('table.word-table');
   if(table){
    const sourceTable=sourcePage4Table;
    if(sourceTable)table.replaceWith(page4TableHTML(sourceTable));
   }
   return applyPageSections(page);
  }
  if(groupIndex===7){
   const page=applyPageSections(buildPage(group));
   page.classList.add('word-page8');
   const content=page.querySelector('.word-content');
   const header=document.createElement('div');
   header.className='word-page8-garuda-header';
   const garuda=document.createElement('img');
   garuda.src='krut-3-cm.png';
   garuda.alt='ตราครุฑ';
   garuda.className='word-page8-garuda';
   header.append(garuda);
   content.prepend(header);
   return page;
  }
  return applyPageSections(buildPage(group));
 });
}

async function loadPDF(){
 try{
  if(!window.JSZip)throw Error('ไม่สามารถโหลด JSZip เพื่ออ่าน Word');
  pdfStage.innerHTML='<p class="renderer-message">กำลังอ่านเอกสาร Word ต้นฉบับ...</p>';
  const response=await fetch('procurement-template13.docx',{cache:'default'});
  if(!response.ok)throw Error('ไม่สามารถอ่าน Word ต้นฉบับ ('+response.status+')');
  const zip=await JSZip.loadAsync(await response.arrayBuffer());
  const file=zip.file('word/document.xml');
  if(!file)throw Error('ไม่พบ word/document.xml');
  const doc=new DOMParser().parseFromString(await file.async('string'),'application/xml');
  if(doc.querySelector('parsererror'))throw Error('อ่าน XML ของ Word ไม่สำเร็จ');
  const body=doc.getElementsByTagNameNS(WORD_NS,'body')[0];
  sourcePage4Table=Array.from(body.getElementsByTagNameNS(WORD_NS,'tbl')).find(t=>Array.from(t.getElementsByTagNameNS(WORD_NS,'t')).some(n=>(n.textContent||'').includes('รายละเอียดของวัสดุที่จะซื้อ/จ้าง')))||null;
  const groups=wordBlocks(body);
  if(groups.length!==11)throw Error('แบ่งหน้า Word ได้ '+groups.length+' หน้า แต่ต้นฉบับมี 11 หน้า');
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
 if(number===10)syncPage10Amounts();
 currentPDFPage=Math.max(1,Math.min(number,pdfDocument.numPages));updatePageControls();
 if(number===1){renderHTMLFirstPage(preserveScroll);return}
 const oldX=pdfStage.scrollLeft,oldY=pdfStage.scrollTop;
 const shell=document.createElement('div');shell.className='word-page-shell';
 const page=wordPages[currentPDFPage-1].cloneNode(true);
 for(const field of page.querySelectorAll('[data-field]')){
  const key=field.dataset.field,value=formValues[key];
  field.textContent=value===undefined||value===''?'{{'+key+'}}':calendarFieldKeys.has(key)?toThaiDocumentDate(value):String(value);
  field.classList.toggle('word-filled',value!==undefined&&value!=='');
  field.addEventListener('click',()=>{const input=document.getElementById('field-'+key);if(input){input.focus();input.scrollIntoView({block:'nearest'})}});
 }
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
