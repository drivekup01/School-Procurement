/* One item list for logical pages 4, 6 and 11. Original pages remain stable. */
(function(){
 const store='school-procurement-page4-table-v1', fields=['description','quantity','reference','unitPrice','amount','remarks'];
 const labels=['รายละเอียดพัสดุ','จำนวนหน่วย','ราคาอ้างอิง (บาท)','ราคาต่อหน่วย (บาท)','จำนวนเงิน (บาท)','หมายเหตุ (หน้า 11)'];
 let items=[],revision=0;
 const read=k=>{try{return JSON.parse(localStorage.getItem(k)||'null')}catch{return null}};
 function load(){
  const saved=read(store)?.sharedItemsV2;if(Array.isArray(saved?.items)){items=saved.items;return}
  const p4=read('school-procurement-page4-table-v1')||{},p6=read('school-procurement-page6-table-v1')||{};
  items=Array.from({length:Math.min(5,Number(p4.visibleCount)||1)},(_,i)=>({...p4[i]})).filter(x=>fields.some(k=>String(x[k]||'').trim()));
  function merge(row){if(!row.description&&!row.quantity)return;const existing=items.find(x=>x.description===row.description&&x.quantity===row.quantity&&fields.every(k=>!x[k]||!row[k]||x[k]===row[k]));if(existing){for(const k of fields)if(!existing[k]&&row[k])existing[k]=row[k]}else items.push(row)}
  merge(p6);
  for(let i=1;i<=Math.min(22,Number(formValues.page11_item_count)||1);i++)merge(Object.fromEntries(['description','quantity','remarks'].map(k=>[k,formValues['page11_item_'+i+'_'+k]||''])));
  if(!items.length)items=[{}];save();
 }
 function save(){localStorage.setItem(store,JSON.stringify({...read(store),sharedItemsV2:{version:2,items}}))}
 load();window.resetPage4Draft=load;window.resetPage6Draft=()=>{};window.resetPage11Draft=()=>{};
 const money=v=>{if(!String(v??'').trim())return ['',''];const n=Number(String(v).replace(/,/g,'')),c=Math.round(n*100);return Number.isFinite(n)&&n>=0&&Number.isSafeInteger(c)?[Math.floor(c/100).toLocaleString('en-US'),c%100?String(c%100).padStart(2,'0'):'-']:['','']};
 function thai(n){const d=['ศูนย์','หนึ่ง','สอง','สาม','สี่','ห้า','หก','เจ็ด','แปด','เก้า'];if(n===0)return d[0];if(n>=1e6)return thai(Math.floor(n/1e6))+'ล้าน'+(n%1e6?thai(n%1e6):'');const s=String(n),u=['','สิบ','ร้อย','พัน','หมื่น','แสน'];return [...s].map((x,i)=>{const p=s.length-i-1,v=Number(x);return !v?'':p===1?(v===1?'สิบ':v===2?'ยี่สิบ':d[v]+'สิบ'):p===0&&v===1&&s.length>1?'เอ็ด':d[v]+u[p]}).join('')}
 function total(){const filled=items.map(x=>x.amount).filter(v=>String(v??'').trim());if(!filled.length||filled.some(v=>money(v)[0]===''))return null;const c=filled.reduce((s,v)=>s+Math.round(Number(String(v).replace(/,/g,''))*100),0);return ['รวมเป็นเงินทั้งสิ้น ('+thai(Math.floor(c/100))+'บาท'+(c%100?thai(c%100)+'สตางค์':'ถ้วน')+')',...money(c/100)]}
 const values=(x,i,page)=>page===11?[String(i+1),x.description||'',x.quantity||'',x.remarks||'']:[String(i+1),x.description||'',x.quantity||'',...money(x.reference),...money(x.unitPrice),...money(x.amount)];
 function controls(){
  if(![4,6,11].includes(currentPDFPage))return;const host=document.getElementById('pageFields');if(!host||host.querySelector('#shared-items'))return;
  const panel=document.createElement('div');panel.className='group';panel.id='shared-items';
  const title=document.createElement('h3');title.textContent='รายการพัสดุร่วม · หน้า 4 / 6 / 11';
  const help=document.createElement('p');help.className='muted';help.textContent='แก้ไขครั้งเดียว ใช้ร่วมกันทั้ง 3 หน้า จำนวนเงินกรอกตามรายการ หน้าต่อเพิ่มอัตโนมัติเมื่อพื้นที่ไม่พอ';panel.append(title,help);
  items.forEach((item,i)=>{const block=document.createElement('div');block.className='input-wrap shared-item';const heading=document.createElement('strong');heading.textContent='รายการที่ '+(i+1);block.append(heading);
   fields.forEach((key,j)=>{const label=document.createElement('label'),input=document.createElement(j===0||j===5?'textarea':'input');input.id='shared-item-'+i+'-'+key;label.htmlFor=input.id;label.textContent=labels[j];input.value=item[key]||'';if(j>=2&&j<=4)input.inputMode='decimal';input.addEventListener('input',()=>{item[key]=input.value;save();queuePaint()});block.append(label,input)});
   const remove=document.createElement('button');remove.type='button';remove.textContent='ลบรายการที่ '+(i+1);remove.addEventListener('click',()=>{items.splice(i,1);if(!items.length)items=[{}];save();panel.remove();controls();queuePaint()});block.append(remove);panel.append(block)});
  const add=document.createElement('button');add.type='button';add.textContent='＋ เพิ่มรายการ';add.addEventListener('click',()=>{items.push({});save();panel.remove();controls();queuePaint()});panel.append(add);host.append(panel);
 }
 let pending;function queuePaint(){clearTimeout(pending);pending=setTimeout(()=>renderPDFPage(currentPDFPage,true),100)}
 function populate(page,n){const table=page.querySelector('.word-page'+n+'-table');if(!table)return;const header=n===11?1:2,template=table.rows[header].cloneNode(true),summary=n===11?null:table.rows[table.rows.length-1].cloneNode(true);while(table.rows.length>header)table.deleteRow(header);
  items.forEach((item,i)=>{const row=template.cloneNode(true);row.style.height='auto';[...row.cells].forEach((c,j)=>{c.replaceChildren(document.createTextNode(values(item,i,n)[j]));c.style.height='auto'});table.append(row)});
  if(summary){const t=total();if(t)[...summary.cells].forEach((c,j)=>c.textContent=t[j]);else [...summary.cells].forEach((c,j)=>c.textContent=j===0?'รวมเป็นเงินทั้งสิ้น':'');table.append(summary)}
 }
 // Measure at unscaled A4 size. Never clip an over-height row; continue its text.
 function paginate(source,n){
  const measure=document.createElement('div');measure.className='shared-measure';document.body.append(measure);const sheets=[];
  function sheet(){const p=source.cloneNode(false);p.style.transform='none';p.classList.add('shared-paginated');const c=document.createElement('div');c.className='word-content shared-flow';p.append(c);measure.append(p);sheets.push(p);return c}
  let content=sheet();const fits=()=>content.scrollHeight<=content.clientHeight+1;
  function next(){content=sheet()}
  const nodes=[];function flatten(node){if(node.matches('.word-flex-section,.p4-before-table,.p4-after-table'))[...node.children].forEach(flatten);else nodes.push(node)}
  [...source.querySelector('.word-content').children].forEach(flatten);
  for(const node of nodes){
   if(node.tagName==='TABLE'){
    const h=n===11?1:2,rows=[...node.rows],heads=rows.slice(0,h);let table;
    function tableHere(){table=node.cloneNode(false);const cols=node.querySelector('colgroup');if(cols)table.append(cols.cloneNode(true));heads.forEach(r=>table.append(r.cloneNode(true)));content.append(table)}
    tableHere();
    for(const original of rows.slice(h)){
     let row=original.cloneNode(true);table.append(row);if(fits())continue;row.remove();
     // Move a complete row first. If even a fresh page cannot hold it, split text.
     next();tableHere();table.append(row);if(fits())continue;row.remove();
     let remaining=[...row.cells].map(c=>Array.from(c.textContent));
     while(remaining.some(a=>a.length)){
      const chunk=row.cloneNode(true);[...chunk.cells].forEach(c=>c.textContent='');table.append(chunk);let taken=[];
      for(let j=0;j<remaining.length;j++){let lo=0,hi=remaining[j].length;while(lo<hi){const mid=Math.ceil((lo+hi)/2);chunk.cells[j].textContent=remaining[j].slice(0,mid).join('');if(fits())lo=mid;else hi=mid-1}chunk.cells[j].textContent=remaining[j].slice(0,lo).join('');taken[j]=lo}
      if(!taken.some(Boolean))throw Error('พื้นที่หน้ากระดาษไม่เพียงพอสำหรับตาราง');remaining=remaining.map((a,j)=>a.slice(taken[j]));if(remaining.some(a=>a.length)){next();tableHere()}
     }
    }
   }else{
    let copy=node.cloneNode(true);content.append(copy);if(fits())continue;copy.remove();next();content.append(copy);
    if(!fits()){
     // Preserve long non-table paragraphs by continuing their text on the next sheet.
     const chars=Array.from(copy.textContent);copy.remove();let offset=0;
     while(offset<chars.length){const p=copy.cloneNode(false);content.append(p);let lo=0,hi=chars.length-offset;while(lo<hi){const mid=Math.ceil((lo+hi)/2);p.textContent=chars.slice(offset,offset+mid).join('');if(fits())lo=mid;else hi=mid-1}if(!lo)throw Error('พื้นที่หน้ากระดาษไม่เพียงพอ');p.textContent=chars.slice(offset,offset+lo).join('');offset+=lo;if(offset<chars.length)next()}
    }
   }
  }
  measure.remove();return sheets;
 }
 const originalRender=renderPDFPage;
 renderPDFPage=async function(...args){const serial=++revision;const result=await originalRender.apply(this,args);if(![4,6,11].includes(currentPDFPage))return result;controls();await document.fonts.ready;if(serial!==revision)return result;
  const source=pdfStage.querySelector('.word-a4');if(!source)return result;const zoom=Number(source.style.transform.match(/scale\(([^)]+)/)?.[1])||1;populate(source,currentPDFPage);const sheets=paginate(source,currentPDFPage),stack=document.createElement('div');stack.className='shared-page-stack';
  sheets.forEach((p,i)=>{const label=document.createElement('div');label.className='shared-sheet-label';label.textContent='หน้า '+currentPDFPage+(i?' — ต่อ '+i:'')+' · แผ่นที่ '+(i+1)+' / '+sheets.length;stack.append(label);const wrap=document.createElement('div');wrap.className='word-page-shell';wrap.style.width=210*96/25.4*zoom+'px';wrap.style.height=297*96/25.4*zoom+'px';p.style.transform='scale('+zoom+')';wrap.append(p);stack.append(wrap)});pdfStage.replaceChildren(stack);pageCounter.textContent=currentPDFPage+' / '+pdfDocument.numPages+(sheets.length>1?' · '+sheets.length+' แผ่น (รวมหน้าต่อ)':'');return result;
 };
 const oldFields=renderFormFields;renderFormFields=function(...args){const r=oldFields.apply(this,args);controls();return r};
 function exportTable(doc,n){const ns=WORD_NS,children=(x,k)=>Array.from(x?.children||[]).filter(c=>c.namespaceURI===ns&&c.localName===k),texts=x=>Array.from(x.getElementsByTagNameNS(ns,'t')).map(t=>t.textContent||'').join('');
  const table=Array.from(doc.getElementsByTagNameNS(ns,'tbl')).find(t=>{const s=texts(t);return n===4?s.includes('รายละเอียดของวัสดุที่จะซื้อ/จ้าง'):n===6?s.includes('รายละเอียดของพัสดุที่จัดซื้อ/จัดจ้าง'):children(t,'tr').length===23&&children(children(t,'tr')[0],'tc').map(texts).join('|')==='ลำดับที่|รายการ|จำนวน|หมายเหตุ'});if(!table)return 0;
  const h=n===11?1:2,rows=children(table,'tr'),template=rows[h].cloneNode(true),last=n===11?null:rows.at(-1).cloneNode(true);
  function flag(pr,name){if(!children(pr,name).length)pr.append(doc.createElementNS(ns,'w:'+name))}
  function write(cell,value){let p=children(cell,'p')[0];if(!p){p=doc.createElementNS(ns,'w:p');cell.append(p)}let pp=children(p,'pPr')[0];if(!pp){pp=doc.createElementNS(ns,'w:pPr');p.prepend(pp)}for(const name of ['keepNext','keepLines']){children(pp,name).forEach(x=>x.remove());const setting=doc.createElementNS(ns,'w:'+name);setting.setAttributeNS(ns,'w:val','0');pp.append(setting)}const r=doc.createElementNS(ns,'w:r'),t=doc.createElementNS(ns,'w:t');t.textContent=value;t.setAttributeNS('http://www.w3.org/XML/1998/namespace','xml:space','preserve');const rp=cell.getElementsByTagNameNS(ns,'rPr')[0];if(rp)r.append(rp.cloneNode(true));r.append(t);p.replaceChildren(...children(p,'pPr'),r);children(cell,'p').slice(1).forEach(x=>x.remove());cell.getElementsByTagNameNS(ns,'tcPr')[0]?.querySelectorAll('*').forEach(x=>{if(x.localName==='tcFitText')x.remove()})}
  rows.slice(0,h).forEach(row=>{let pr=children(row,'trPr')[0];if(!pr){pr=doc.createElementNS(ns,'w:trPr');row.prepend(pr)}flag(pr,'tblHeader')});rows.slice(h).forEach(r=>r.remove());
  items.forEach((item,i)=>{const row=template.cloneNode(true);Array.from(row.getElementsByTagNameNS(ns,'trHeight')).forEach(x=>x.remove());Array.from(row.getElementsByTagNameNS(ns,'cantSplit')).forEach(x=>x.remove());Array.from(row.getElementsByTagNameNS(ns,'keepNext')).forEach(x=>x.remove());children(row,'tc').forEach((c,j)=>write(c,values(item,i,n)[j]));table.append(row)});
  if(last){const t=total()||['รวมเป็นเงินทั้งสิ้น','',''];children(last,'tc').forEach((c,j)=>write(c,t[j]));table.append(last)}return items.length;
 }
 window.exportPage4TableToWord=doc=>exportTable(doc,4);window.exportPage6TableToWord=doc=>exportTable(doc,6);window.exportPage11TableToWord=doc=>exportTable(doc,11);
})();
