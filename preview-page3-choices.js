/* Page 3 purchase/hire selection only. */
(function(){
 const storageKey='school-procurement-page3-choices-v1';
 let choices={purchase:false,hire:false};
 try{choices={...choices,...JSON.parse(localStorage.getItem(storageKey)||'{}')}}catch{}
 function save(){try{localStorage.setItem(storageKey,JSON.stringify(choices))}catch{}}
 function paint(){
  if(currentPDFPage!==3)return;
  for(const marker of document.querySelectorAll('#pdfRender [data-p3-choice]')){
   marker.textContent=choices[marker.dataset.p3Choice]?'☑':'☐';
  }
 }
 function controls(){
  const host=document.getElementById('pageFields');
  if(currentPDFPage!==3||!host||host.querySelector('#page3-choices'))return;
  const section=document.createElement('div');section.id='page3-choices';section.className='group';
  const title=document.createElement('h3');title.textContent='ประเภทการดำเนินการ';section.append(title);
  for(const [key,label] of [['purchase','จัดซื้อ'],['hire','จัดจ้าง']]){
   const row=document.createElement('label');row.style.cssText='display:flex;align-items:center;gap:10px;margin:12px 0;cursor:pointer';
   const checkbox=document.createElement('input');checkbox.type='checkbox';checkbox.checked=!!choices[key];checkbox.style.cssText='width:18px;height:18px;margin:0;flex:none';
   checkbox.addEventListener('change',()=>{choices[key]=checkbox.checked;save();paint()});
   const text=document.createElement('span');text.textContent=label;row.append(checkbox,text);section.append(row);
  }
  host.prepend(section);
 }
 const previousRender=renderPDFPage;
 renderPDFPage=async function(...args){const result=await previousRender.apply(this,args);controls();paint();return result};
 const previousFields=renderFormFields;
 renderFormFields=function(...args){const result=previousFields.apply(this,args);controls();return result};
 window.page3WordChoices=()=>({...choices});
 if(currentPDFPage===3){controls();paint()}
})();