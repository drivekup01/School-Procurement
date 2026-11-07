/* Match the eleven source sheets shown by the editor. Cached rendered breaks
 * describe a previous Word layout; blank paragraphs are not page boundaries. */
function normalizeWordExportLayout(doc){
 const ns='http://schemas.openxmlformats.org/wordprocessingml/2006/main';
 const idns='http://schemas.microsoft.com/office/word/2010/wordml';
 const body=doc.getElementsByTagNameNS(ns,'body')[0];
 if(!body)throw Error('ไม่พบเนื้อหาเอกสาร Word');
 const starts=['5DB60E57','0DBFFFC7','1EF677F8','543D6E79','4167D585','35A32B33','33AC75F2','4B2D7EED','07C7A332','300606A2'];
 const child=(el,name)=>Array.from(el.children).find(n=>n.namespaceURI===ns&&n.localName===name);
 const ensure=(el,name)=>{let n=child(el,name);if(!n){n=doc.createElementNS(ns,'w:'+name);el.appendChild(n);}return n;};
 const props=p=>{let n=child(p,'pPr');if(!n){n=doc.createElementNS(ns,'w:pPr');p.insertBefore(n,p.firstChild);}return n;};
 const set=(el,key,value)=>el.setAttributeNS(ns,'w:'+key,String(value));
 const text=p=>Array.from(p.getElementsByTagNameNS(ns,'t')).map(n=>n.textContent||'').join('');
 const graphic=p=>['drawing','pict','object','sym','fldChar'].some(tag=>p.getElementsByTagNameNS(ns,tag).length);
 const nodes=Array.from(body.children),groups=[[]];
 let boundary=0;
 for(const node of nodes){
  if(!['p','tbl'].includes(node.localName))continue;
  if(node.getAttributeNS(idns,'paraId')===starts[boundary]){groups.push([]);boundary++;}
  groups[groups.length-1].push(node);
 }
 if(boundary!==starts.length)throw Error('โครงสร้างหน้าของแม่แบบ Word เปลี่ยนไป กรุณาตรวจสอบแม่แบบ');
 // The announcement's crest is anchored in the preceding padding paragraph.
 const announcementImage=groups[6].find(n=>n.localName==='p'&&!text(n).trim()&&graphic(n));
 if(announcementImage){groups[6]=groups[6].filter(n=>n!==announcementImage);groups[7].unshift(announcementImage);}
 for(const node of Array.from(doc.getElementsByTagNameNS(ns,'lastRenderedPageBreak')))node.remove();
 for(const node of Array.from(doc.getElementsByTagNameNS(ns,'br')))if(node.getAttributeNS(ns,'type')==='page')node.remove();
 for(const node of Array.from(doc.getElementsByTagNameNS(ns,'pageBreakBefore')))node.remove();
 groups.forEach((group,index)=>{
  let pendingGap=false,first=null;
  for(const node of group){
   if(node.localName==='p'&&!text(node).trim()&&!graphic(node)){node.remove();pendingGap=Boolean(first);continue;}
   if(!first)first=node;
   if(node.localName==='p'){
    const pr=props(node),spacing=ensure(pr,'spacing');
    set(spacing,'before',Math.min(240,Math.max(pendingGap?240:0,Number(spacing.getAttributeNS(ns,'before'))||0)));
    set(spacing,'after',0);set(spacing,'line',index===2?320:358);set(spacing,'lineRule','exact');
    set(ensure(pr,'contextualSpacing'),'val',0);set(ensure(pr,'snapToGrid'),'val',0);
    // Titles have their own line box, like the browser's 20 mm memo header.
    if(text(node).trim()==='บันทึกข้อความ'){
     set(spacing,'line',1134);set(spacing,'before',0);set(spacing,'after',0);
     for(const size of [...node.getElementsByTagNameNS(ns,'sz'),...node.getElementsByTagNameNS(ns,'szCs')])set(size,'val',44);
     for(const anchor of Array.from(node.getElementsByTagNameNS('http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing','positionV'))){
      anchor.setAttribute('relativeFrom','page');
      const offset=anchor.getElementsByTagNameNS(anchor.namespaceURI,'posOffset')[0];if(offset)offset.textContent='540000';
     }
    }
    if(!text(node).trim()&&graphic(node)){
     // Reserve the announcement crest's full 30 mm height above its title.
     set(spacing,'before',0);set(spacing,'after',240);set(spacing,'line',1900);
     for(const position of Array.from(node.getElementsByTagNameNS('http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing','positionV'))){
      const offset=position.getElementsByTagNameNS(position.namespaceURI,'posOffset')[0];if(offset)offset.textContent='0';
     }
    }
   }
   pendingGap=false;
  }
  if(index&&first){const pr=props(first),br=doc.createElementNS(ns,'w:pageBreakBefore');pr.insertBefore(br,pr.firstChild);}
 });
 // The page 6 source table extends outside the text area. Fit its grid and
 // merged cells together, retaining the original column proportions.
 for(const table of Array.from(body.children).filter(n=>n.localName==='tbl')){
  const pr=child(table,'tblPr'),grid=child(table,'tblGrid');if(!pr||!grid)continue;
  const columns=Array.from(grid.children),widths=columns.map(c=>Number(c.getAttributeNS(ns,'w'))||0),total=widths.reduce((a,b)=>a+b,0);
  if(total<=9752)continue;
  let oldEdge=0,newEdge=0;
  const scaled=widths.map(w=>{oldEdge+=w;const edge=Math.round(oldEdge*9752/total),value=edge-newEdge;newEdge=edge;return value;});
  columns.forEach((c,i)=>set(c,'w',scaled[i]));
  const width=ensure(pr,'tblW');set(width,'w',9752);set(width,'type','dxa');
  const indent=ensure(pr,'tblInd');set(indent,'w',0);set(indent,'type','dxa');
  for(const row of Array.from(table.children).filter(n=>n.localName==='tr')){
   let offset=0;
   for(const cell of Array.from(row.children).filter(n=>n.localName==='tc')){
    const cp=child(cell,'tcPr');if(!cp)continue;
    const span=Number(child(cp,'gridSpan')?.getAttributeNS(ns,'val'))||1,w=ensure(cp,'tcW');
    set(w,'w',scaled.slice(offset,offset+span).reduce((a,b)=>a+b,0));set(w,'type','dxa');offset+=span;
   }
  }
 }
 // Keep paragraph property elements in the order required by WordprocessingML.
 const order=['pStyle','keepNext','keepLines','pageBreakBefore','framePr','widowControl','numPr','suppressLineNumbers','pBdr','shd','tabs','suppressAutoHyphens','kinsoku','wordWrap','overflowPunct','topLinePunct','autoSpaceDE','autoSpaceDN','bidi','adjustRightInd','snapToGrid','spacing','ind','contextualSpacing','mirrorIndents','suppressOverlap','jc','textDirection','textAlignment','textboxTightWrap','outlineLvl','divId','cnfStyle','rPr','sectPr','pPrChange'];
 for(const pr of Array.from(doc.getElementsByTagNameNS(ns,'pPr'))){
  const items=Array.from(pr.children);items.sort((a,b)=>(order.indexOf(a.localName)<0?999:order.indexOf(a.localName))-(order.indexOf(b.localName)<0?999:order.indexOf(b.localName)));
  for(const item of items)pr.appendChild(item);
 }
 const section=child(body,'sectPr');
 if(section){
  const size=ensure(section,'pgSz');set(size,'w',11906);set(size,'h',16838);
  const margin=ensure(section,'pgMar');for(const [key,value] of Object.entries({top:850,right:737,bottom:567,left:1417,gutter:0}))set(margin,key,value);
 }
 return true;
}
