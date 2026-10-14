# โครงสร้างหน้าเว็บ

- index.html: ส่งต่อไปหน้าแรกของ School-Portal
- budget.html / budget-dashboard.html / budget-projects.html: ส่งต่อไป School-Budget โดยไม่สร้างหน้าจอระบบงบประมาณซ้ำ
- procurement.html: หน้าจัดทำเอกสาร
- history.html: หน้าประวัติเอกสาร
- document-layout.html: แบบฟอร์มเอกสารที่หน้าเอกสารใช้ร่วมกัน เก็บเพียงชุดเดียว
- document.css: รูปแบบพื้นฐานของระบบเอกสาร
- document-history.css: รูปแบบเมนูและหน้าประวัติเอกสาร
- document-bootstrap.js: โหลดแบบฟอร์มและส่วนประกอบของหน้าจัดทำ/ประวัติ
- document-loading.css: แสดงหน้ารอโหลดและกันโครงฟอร์มระหว่างเตรียมหน้าปรากฏก่อนหน้า Bento ที่พร้อมใช้งาน หากโหลดไม่สำเร็จแสดงข้อความและปุ่มลองใหม่
- editor-bento.css / history-bento.css: รูปแบบแต่ละหน้าเอกสาร
- Sidebar เรียกใช้ budget-sidebar.js / .css จาก School-Budget เป็นชุดเดียวกันทั้งสองระบบ
- document-app.js: ช่องข้อมูลกลางและการส่งออก Word
- document-storage.js: บันทึกฉบับร่าง เสร็จสิ้น ประวัติ และเปิดงานกลับมาแก้ไข
- preview.js และ preview-page*.js/css: แสดงหน้าเอกสารและตารางตามต้นฉบับ
- apps-script/Code.gs: บันทึก Drive และเปิดหน้าแยกผ่านพารามิเตอร์ page

หน้าเว็บทั่วไปเปิดแต่ละ HTML ได้โดยตรง ส่วน Apps Script รองรับ ?page=home, budget, procurement, history หลังอัปเดต Code.gs และ deployment เป็นเวอร์ชันใหม่ ไม่มีการเปลี่ยนโฟลเดอร์หรือไฟล์งานที่บันทึกไว้
