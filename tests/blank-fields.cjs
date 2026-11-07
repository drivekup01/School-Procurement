const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const context={};vm.createContext(context);vm.runInContext(fs.readFileSync('preview.js','utf8').split('/* Word HTML preview controller.')[0],context);
function paragraph(parts){const nodes=parts.map(textContent=>({textContent}));return {nodes,getElementsByTagNameNS(){return nodes;}};}
const pattern=()=>/\{\{\s*([\w.-]+)\s*\}\}/g;
test('empty, whitespace and missing fields are removed while zero and populated fields remain',()=>{
 const p=paragraph(['ก่อน {{empty}} / {{ missing }} / {{spaces}} / {{zero}} / {{name}} หลัง']);
 const values={empty:'',spaces:'   ',zero:0,name:'ทดสอบ & ตรวจสอบ'};
 assert.equal(context.replaceWordText(p,pattern(),m=>context.documentFieldText(m[1],values,new Set(),String)),5);
 assert.equal(p.nodes[0].textContent,'ก่อน  /  /  / 0 / ทดสอบ & ตรวจสอบ หลัง');
});
test('split runs, repeated fields and Unicode prefixes preserve surrounding text and run structure',()=>{
 const p=paragraph(['📄 ก่อน {{fi','rst}} ระหว่าง {{second','}} หลัง {{first}}']);
 context.replaceWordText(p,pattern(),m=>({first:'ค่า',second:''}[m[1]]));
 assert.equal(p.nodes.map(n=>n.textContent).join(''),'📄 ก่อน ค่า ระหว่าง  หลัง ค่า');assert.equal(p.nodes.length,3);
});
test('page 7 deadline uses shared date field while numeric delivery duration stays unchanged elsewhere',()=>{
 const page2=paragraph(['ไม่เกิน {{delivery_days}} วัน นับถัดจากวันลงนาม']);
 const page7=paragraph(['กำหนดเวลาการส่งมอบ {{deliv','ery_days}} ข้อความต่อท้าย']);
 const doc={getElementsByTagNameNS(){return [page2,page7];}};
 assert.equal(context.normalizeDeliveryDeadlineBinding(doc),true);
 assert.equal(page2.nodes[0].textContent,'ไม่เกิน {{delivery_days}} วัน นับถัดจากวันลงนาม');
 assert.equal(page7.nodes.map(n=>n.textContent).join(''),'กำหนดเวลาการส่งมอบ {{delivery_due_date}} ข้อความต่อท้าย');
 assert.equal(context.normalizeDeliveryDeadlineBinding(doc),false);
});
test('date formatting is shared between preview and export, with empty date remaining blank',()=>{
 const keys=new Set(['delivery_due_date']),format=v=>'วันที่ '+v;
 assert.equal(context.documentFieldText('delivery_due_date',{delivery_due_date:'2026-11-20'},keys,format),'วันที่ 2026-11-20');
 assert.equal(context.documentFieldText('delivery_due_date',{},keys,format),'');
});
