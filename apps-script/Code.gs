/** School Procurement: Google Apps Script web app.
 * Deploy as "User accessing the web app", access "Only users in your organization"
 * (or signed-in users who have permission to the template).
 * Never deploy "Execute as me" + "Anyone" for this editor.
 */
const TEMPLATE_ID = '1eUoINJHesLdb-7m39BJwbel3ppN5ey99H93TKAtwahc';
const NAME_PREFIX = 'ชุดเบิก - ';
function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('กรอกเอกสารจัดซื้อ - Google Docs')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.DEFAULT);
}
function keys_() {
  const doc = DocumentApp.openById(TEMPLATE_ID);
  const source = doc.getBody().getText();
  return [...new Set([...source.matchAll(/\{\{([A-Za-z_][A-Za-z_0-9]*)\}\}/g)].map(m=>m[1]))];
}
function loadForm() {
  const properties=PropertiesService.getUserProperties();
  const keys=keys_();
  let values={};
  try{values=JSON.parse(properties.getProperty('values')||'{}')}catch(_){}
  const result={keys,values};
  const id=properties.getProperty('activeCopyId');
  if(id){try{DriveApp.getFileById(id).getName();result.url='https://docs.google.com/document/d/'+id+'/edit';result.preview='https://docs.google.com/document/d/'+id+'/preview'}catch(_){}}
  return result;
}
function replaceInContainer_(container,key,value){
  if(container)container.replaceText('\\{\\{'+key+'\\}\\}',value);
}
function saveForm(values) {
  if(!values||typeof values!=='object'||Array.isArray(values))throw Error('ข้อมูลไม่ถูกต้อง');
  const keys=keys_();
  const clean={};
  keys.forEach(k=>{
    const v=String(values[k]??'');
    if(v.length>1500)throw Error(k+' ยาวเกินกำหนด');
    clean[k]=v;
  });
  const props=PropertiesService.getUserProperties();
  const lock=LockService.getUserLock();
  if(!lock.tryLock(20000))throw Error('กำลังบันทึกเอกสาร กรุณาลองอีกครั้ง');
  let newFile;
  try{
    const oldId=props.getProperty('activeCopyId');
    newFile=DriveApp.getFileById(TEMPLATE_ID).makeCopy(NAME_PREFIX+Utilities.formatDate(new Date(),Session.getScriptTimeZone(),'yyyy-MM-dd HH:mm:ss'));
    const doc=DocumentApp.openById(newFile.getId());
    const body=doc.getBody(),header=doc.getHeader(),footer=doc.getFooter();
    keys.forEach(k=>{
      const v=clean[k];
      replaceInContainer_(body,k,v);
      replaceInContainer_(header,k,v);
      replaceInContainer_(footer,k,v);
    });
    doc.saveAndClose();
    props.setProperties({values:JSON.stringify(clean),activeCopyId:newFile.getId()});
    if(oldId&&oldId!==newFile.getId()){
      try{DriveApp.getFileById(oldId).setTrashed(true)}catch(e){console.warn('Could not trash older generated preview: '+e)}
    }
    return {url:'https://docs.google.com/document/d/'+newFile.getId()+'/edit',
      preview:'https://docs.google.com/document/d/'+newFile.getId()+'/preview',
      updated:new Date().toISOString()};
  }catch(e){if(newFile)try{newFile.setTrashed(true)}catch(_){};throw e}
  finally{lock.releaseLock()}
}
