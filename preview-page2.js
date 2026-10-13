/* Page 2: source paragraphs 29-55 of procurement-template13.docx.
   Keep original paragraph content, never synthesize the text. */
function buildSecondPageFromWord(group){
 const page=document.createElement('article');
 page.className='word-a4 word-page2';
 const header=document.createElement('header');header.className='p2-heading';
 const crest=document.createElement('img');crest.src='krut-1.5-cm.png';crest.alt='ตราครุฑ';
 const title=document.createElement('h1');title.textContent=group[0].textContent.trim();
 header.append(crest,title);page.append(header);
 const lines=[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,17,18,20,21,23,24,25,26];
 for(const i of lines){
  const p=group[i].cloneNode(true);
  p.className='p2-line p2-line-'+i;
  // Preserve exact original text, but turn separated runs into field spans
  // when Word split a {{field}} across runs.
  const text=p.textContent;
  if(text.includes('{{')){p.replaceChildren(wordFieldFragments(text))}
  const full=p.textContent;
  const makeParts=(items)=>{p.replaceChildren();for(const item of items){const span=document.createElement('span');span.append(wordFieldFragments(item));p.append(span)}};
  if(i===1){
   const school='โรงเรียนค่ายบางระจันวิทยาคม',office='สำนักงานเขตพื้นที่การศึกษามัธยมศึกษาสิงห์บุรี อ่างทอง';
   if(full.includes(school)&&full.includes(office))makeParts(['ส่วนราชการ',school,office]);
  }else if(i===2){
   const k=full.indexOf('วันที่');
   if(k>=0)makeParts([full.slice(0,k),full.slice(k)]);
  }else if(i===3&&full.startsWith('เรื่อง'))makeParts(['เรื่อง',full.slice(5)]);
  else if(i===5&&full.startsWith('เรียน'))makeParts(['เรียน',full.slice(5)]);
  else if(i===6&&full.startsWith('เอกสารแนบ')){
   const tail=full.lastIndexOf('จำนวน 1 ชุด');
   if(tail>=0)makeParts(['เอกสารแนบ',full.slice('เอกสารแนบ'.length,tail),'จำนวน 1 ชุด']);
  }else if(i===17){
   const second=full.indexOf('ลงชื่อ',full.indexOf('ลงชื่อ')+5);
   if(second>=0)makeParts([full.slice(0,second).trim(),full.slice(second).trim()]);
  }else if(i===18){
   const match=full.match(/\(\{\{officer_signer_name\}\}\)[\s\u3000]*\(\{\{chief_officer_signer_name\}\}\)/);
   if(match)makeParts(['({{officer_signer_name}})','({{chief_officer_signer_name}})']);
  }
  page.append(p);
 }
 return page;
}