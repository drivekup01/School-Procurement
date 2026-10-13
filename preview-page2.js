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
  page.append(p);
 }
 return page;
}