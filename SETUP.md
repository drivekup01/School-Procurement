# ตั้งค่าระบบจัดซื้อจัดจ้างกับ Firebase เดิมของ School-Budget

**ใช้ Firebase Project เดียวกัน:** `school-budget-3e69d`

## อัปเดตแล้ว
- `firebase-config.js` ใช้ค่า Firebase Web App เดียวกับ School-Budget
- เว็บ School Procurement ใช้ collections ชื่อขึ้นต้น `procurement_` เพื่อไม่ชนโครงสร้าง School-Budget:
  - `procurement_users/{uid}`
  - `procurement_projects/{id}`
  - `procurement_jobs/{id}`
  - `procurement_documents/{id}`
- ไฟล์ PDF ใช้ Firebase Storage path `procurement/projects/{projectId}/files/{documentId}`
- ทั้งสองเว็บยังแยก Repository และ Hosting ได้ แต่ใช้งาน Authentication / Firestore / Storage Project เดียวกัน

## สำคัญ: กฎเดิมของ School-Budget ยังปิดการอ่าน/เขียนทั้งหมด
ตอนที่ตรวจ Repository `School-Budget` พบ `firestore.rules` มี catch-all `allow read, write: if false`.
**ไฟล์กฎใน Repository ไม่ได้บอกยืนยันกฎที่ Publish อยู่บน Firebase Console**. ต้องตรวจ Rules ที่ Firebase Console จริงก่อน.

**ห้ามนำไฟล์ firestore.rules และ storage.rules ของ School Procurement ไปกด Publish แทนที่กฎของ School-Budget ทันที** เพราะทั้งสองระบบใช้ Firebase Project เดียวกัน และ Rules ของ Firestore/Storage ใช้ร่วมกันทั้ง Project:
1. เปิด Firebase Console → School-Budget → Firestore → Rules
2. สำรองกฎปัจจุบันไว้ก่อน
3. ผสานกฎสำหรับ `procurement_*` เข้ากับกฎ School-Budget ที่ใช้อยู่ โดยคง namespace และสิทธิ์ของ Budget เดิม
4. ตรวจใน Rules Playground / Emulator ว่าสมาชิกแต่ละฝ่ายอ่านทุกฝ่ายได้ เขียนเฉพาะฝ่ายตัวเอง และบุคคลภายนอกอ่านไม่ได้
5. Storage Rules ก็ต้องผสาน ไม่เขียนทับกฎไฟล์ระบบ Budget
6. แล้วจึง Publish หลังผ่านการทดสอบ

## บัญชีผู้ใช้
1. เปิด Authentication → Email/Password
2. สร้าง Admin 1 บัญชี และ Staff อีกประมาณ 4 บัญชี
3. สร้างเอกสาร `procurement_users/{uid}` ตาม UID ใน Authentication:
   - `role`: `admin` หรือ `staff`
   - `departmentId`: `site` / `academic` / `general` / `personnel`
   - `displayName`: ชื่อแสดงผล
4. ชื่อฝ่ายเป็นค่าเริ่มต้น ต้องปรับให้ตรงหน่วยงานจริงก่อนใช้หลายฝ่าย

## Storage
- เปิด Cloud Storage ใน Firebase Project เดิม (อาจต้องเปิด Billing ตามเงื่อนไขปัจจุบัน)
- ไฟล์ PDF เก็บใน path แยกของ procurement ตามด้านบน
- เว็บใช้ Firebase SDK `getBlob()` อ่านแบบผ่านสิทธิ์ ไม่สร้าง permanent public download token URL
- อาจต้องตั้งค่า CORS ให้ origin `https://drivekup01.github.io` สำหรับโหลดไฟล์ผ่าน Browser; จำกัด CORS ให้เฉพาะเว็บนี้

## ข้อจำกัดระหว่างตั้งค่า
- Firebase config ใส่แล้ว **แต่ยังไม่ได้ยืนยันว่าบริการ Auth, Firestore, Storage เปิดใช้งาน หรือ Rules ถูก Publish**
- เว็บจึงอาจแสดง Login ได้ แต่การเข้าใช้ข้อมูลจริงยังไม่สำเร็จจนกว่าจะกำหนดสิทธิ์และตั้งค่าครบ
- ไม่มีข้อมูลโครงการ/เอกสารจริงใดถูกอัปโหลดในขั้นตอนเปลี่ยน config นี้
- ยังไม่ได้รวมข้อมูลโครงการกับ School-Budget โดยตรง ระยะแรกแยก collection เพื่อปลอดภัยก่อน แล้วค่อยกำหนด `budgetProjectId` ผูกงานจัดซื้อกับแผนงบประมาณจริงโดยไม่บันทึกซ้ำ
- ยังไม่รองรับแก้ไข/ลบข้อมูลแบบมีประวัติ ไม่ควรนำเอกสารสำคัญมาใช้ผลิตจริงจนผ่านการทดสอบสิทธิ์และสำรองข้อมูล
