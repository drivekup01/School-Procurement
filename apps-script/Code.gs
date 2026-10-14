const FOLDER_ID = '1M3B95sHXT0pCaiK8ZN2w5lseE7r-D1NO';
const APP_URL = 'https://drivekup01.github.io/School-Procurement/';
const MARKER = 'school-procurement-document-v1';

function doGet() {
  const response = UrlFetchApp.fetch(APP_URL + 'index.html');
  const html = response.getContentText().replace('<head>', '<head><base href="' + APP_URL + '" target="_top">');
  return HtmlService.createHtmlOutput(html).setTitle('เอกสารจัดซื้อจัดจ้าง');
}

function validate_(data) {
  if (!data || data.format !== MARKER || data.version !== 1 || !data.stores || typeof data.stores !== 'object') throw new Error('รูปแบบไฟล์เอกสารไม่ถูกต้อง');
  const allowed = ['school-procurement-preview-values-v1', 'school-procurement-page3-choices-v1', 'school-procurement-page4-table-v1', 'school-procurement-page6-table-v1'];
  if (Object.keys(data.stores).length !== allowed.length || !allowed.every(key => data.stores[key] && typeof data.stores[key] === 'object' && !Array.isArray(data.stores[key]))) throw new Error('ข้อมูลเอกสารไม่ครบ');
  if (JSON.stringify(data).length > 1000000) throw new Error('ข้อมูลเอกสารใหญ่เกินกำหนด');
  return data;
}

function ownedFile_(id) {
  const file = DriveApp.getFileById(String(id));
  const parents = file.getParents();let belongs = false;
  while (parents.hasNext()) if (parents.next().getId() === FOLDER_ID) belongs = true;
  if (!belongs || file.isTrashed() || file.getMimeType() !== 'application/json') throw new Error('ไม่พบเอกสารในโฟลเดอร์นี้');
  validate_(JSON.parse(file.getBlob().getDataAsString('UTF-8')));
  return file;
}

function saveProcurementDocument(data, fileId) {
  validate_(data);
  const name = String(data.name || 'เอกสารจัดซื้อจัดจ้าง').replace(/[\\/\r\n]/g, ' ').trim().slice(0, 120);
  if (!name) throw new Error('กรุณากรอกชื่อเอกสาร');
  data.name = name;data.savedAt = new Date().toISOString();
  const lock = LockService.getScriptLock();lock.waitLock(10000);
  try {
    const text = JSON.stringify(data, null, 2);
    const file = fileId ? ownedFile_(fileId) : DriveApp.getFolderById(FOLDER_ID).createFile(name + '.json', text, 'application/json');
    if (fileId) { file.setContent(text);file.setName(name + '.json'); }
    return { id: file.getId(), name: data.name, savedAt: data.savedAt };
  } finally { lock.releaseLock(); }
}

function listProcurementDocuments() {
  const files = DriveApp.getFolderById(FOLDER_ID).getFilesByType('application/json');const result = [];
  while (files.hasNext()) {
    const file = files.next();
    if (file.isTrashed()) continue;
    try {
      const data = validate_(JSON.parse(file.getBlob().getDataAsString('UTF-8')));
      result.push({ id: file.getId(), name: data.name || file.getName(), savedAt: file.getLastUpdated().toISOString() });
    } catch (_) { /* Ignore unrelated JSON files in the supplied folder. */ }
  }
  return result.sort((a, b) => b.savedAt.localeCompare(a.savedAt));
}

function openProcurementDocument(fileId) {
  const file = ownedFile_(fileId);
  return { id: file.getId(), data: validate_(JSON.parse(file.getBlob().getDataAsString('UTF-8'))) };
}
