# ตั้งค่าระบบ School Procurement (สำหรับใช้งานจริง)

**สถานะปัจจุบัน:** หน้าเว็บ Production เชื่อม Firebase ผ่านโค้ดแล้ว แต่ไม่มี Firebase Project ที่ตั้งค่าไว้ใน Repository นี้ และยังไม่มีผู้ใช้/ไฟล์จริงที่อัปโหลดได้จากบทสนทนานี้ **จึงยังไม่ใช่ระบบพร้อมใช้งาน** ห้ามกรอกเอกสารราชการจริงจนกว่าจะผ่านการตรวจสิทธิ์และทดสอบการเข้าถึงไฟล์

## 1. สร้าง Firebase Project แยกต่างหาก

สร้างโครงการใหม่ชื่อประมาณ `school-procurement-...` ใน Firebase Console (อย่าใช้ของ School-OS หรือ School-Budget ร่วมกัน)
- Authentication → Sign-in method → **Email/Password**: Enable
- Firestore Database → Create database → เลือก location ให้เหมาะสม
- Storage → Get started → เลือก location/plan ที่รองรับการใช้งาน (อาจมีค่าใช้จ่าย)
- Project settings → Your apps → Register web app แล้วนำค่า Web App Config มาใส่ที่ `firebase-config.js` (ค่า client config ไม่ใช่รหัสลับของ service account)
- Authentication → Settings → Authorized domains: เพิ่ม `drivekup01.github.io` หากจำเป็น
- ห้ามใส่ private service-account key ใน GitHub

## 2. เผยแพร่กฎการเข้าถึงข้อมูล

นำ `firestore.rules` ไปตั้งใน Firestore → Rules และ `storage.rules` ไปตั้งใน Storage → Rules แล้วกด Publish หลังตรวจทาน

การทำงานตามกฎ:
- สมาชิกที่ลงชื่อเข้าใช้และมีเอกสาร `users/{uid}` อ่านทุกโครงการ งาน และไฟล์ได้
- เจ้าหน้าที่ทั่วไปสร้างโครงการ/งาน และอัปโหลด PDF ได้เฉพาะฝ่ายตน
- Admin สร้างในทุกฝ่ายได้
- รอบแรก **ยังไม่เปิดสิทธิ์แก้ไข/ลบ** ข้อมูลที่บันทึกแล้ว เพื่อป้องกันการเปลี่ยนหลักฐานย้อนหลัง การแก้ข้อมูลและ versioning จะพัฒนาเป็นขั้นต่อไป
- ผู้ใช้ไม่สามารถแก้ role/departmentId ของตัวเองผ่านเว็บ

## 3. สร้างผู้ใช้ Admin คนแรก

Authentication → Users → Add user → สร้าง Email/Password สำหรับ Admin
นำ **UID ของบัญชีนั้น** ไปสร้าง Firestore Document:
Collection: `users`
Document ID: `<UID จาก Authentication>`
Fields:
- `role` (string): `admin`
- `departmentId` (string): `site`
- `displayName` (string): ชื่อที่ต้องการแสดง

เจ้าหน้าที่ Staff อีก 4 บัญชี สร้างแบบเดียวกัน โดย role = `staff` และ departmentId เป็นหนึ่งใน `site`, `academic`, `general`, `personnel`.
*ชื่อฝ่ายเหล่านี้เป็นค่าตั้งต้น ต้องกำหนดชื่อฝ่ายจริงก่อนเปิดใช้กับทุกคน*

**สำคัญ:** กฎ Firestore ปิดการสร้าง/แก้ `users` ผ่านเว็บ สมาชิก/ผู้ดูแลต้องเพิ่มโดย Firebase Console หรือ trusted Admin SDK เท่านั้นในรุ่นแรก

## 4. ตั้งค่า CORS สำหรับดู PDF จาก Cloud Storage

ตัวดู PDF ใช้ `getBlob()` เพื่อให้เบราว์เซอร์โหลดไฟล์ที่ผ่าน Firebase Security Rules โดยไม่สร้างลิงก์ดาวน์โหลดแบบ token สาธารณะ หาก browser แจ้ง CORS ต้องตั้ง bucket CORS อนุญาต origin:
`https://drivekup01.github.io`
และ methods: `GET, HEAD`
ตั้งค่า CORS ด้วย Google Cloud CLI / gsutil ที่ bucket ของ Storage **อย่าตั้ง `*` โดยไม่จำเป็น**

ตัวอย่าง cors.json:
```json
[{"origin":["https://drivekup01.github.io"],"method":["GET","HEAD"],"responseHeader":["Content-Type"],"maxAgeSeconds":3600}]
```
ดูคำสั่งจริงตามคู่มือ Google Cloud Storage ของ bucket ของคุณ

## 5. การทดสอบก่อนใช้เอกสารจริง

1. Admin login ได้
2. Staff login แล้วเห็นโครงการจากทุกฝ่าย
3. Staff ฝ่าย A เพิ่มโครงการ/งานตนเองได้ แต่สร้างในฝ่าย B ไม่ได้
4. Staff ฝ่าย A เปิด PDF ของฝ่าย B ได้
5. Staff ฝ่าย A อัปโหลดทับไฟล์ฝ่าย B ไม่ได้
6. ผู้ใช้ที่ไม่มี `users/{uid}` อ่านข้อมูลไม่ได้
7. อัปโหลด PDF ที่ไม่ใช่ PDF/ใหญ่เกิน 25MB ถูกปฏิเสธ
8. ทดสอบเปิด Preview และดาวน์โหลด PDF จริง รวมถึงตรวจชื่อไทย/จำนวนหน้า
9. ทดสอบการเปลี่ยนบัญชีผู้ใช้และการ sign out แล้วเข้าถึงไฟล์ไม่ได้

## 6. โครงสร้างข้อมูล

- `users/{uid}`: role, departmentId, displayName
- `projects/{id}`: name, fiscalYear, departmentId, budget, createdBy, createdAt
- `jobs/{id}`: projectId, departmentId, title, budget, referencePrice, approved, status, createdBy, createdAt
- `documents/{id}`: projectId, jobId, departmentId, title, filename, storagePath, status, createdBy, createdAt
- Cloud Storage: `projects/{projectId}/files/{documentId}`

**ข้อจำกัดรุ่นนี้:** ยังไม่มี server-side audit log, versioned documents, OCR/mapping DOCX, การปรับสถานะงานอย่างเป็นทางการ, แม่แบบ Word → PDF อัตโนมัติ, หรือ backup/restore ของ Firebase

โปรดอย่านำเลข `0` ของเงินไปตีความว่าเป็น 'จ่ายแล้ว' เพราะหน้ารายงานยังเป็นเพียงยอดอนุมัติที่บันทึกในระบบ ไม่ใช่หลักฐานการเบิกจ่ายจริง
