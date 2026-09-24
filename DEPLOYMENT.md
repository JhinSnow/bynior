# คู่มือการติดตั้งและ Deploy โปรเจกต์ Byenior (Supabase + Docker + Cloudflare)

ระบบ **Event Food Coupon & Activity Management System (Byenior 2026)** พัฒนาเสร็จสมบูรณ์ พร้อมเชื่อมต่อกับ Supabase, Docker และ Cloudflare เรียบร้อยแล้ว

---

## 1. เชื่อมต่อ Supabase (Database Setup)

1. ไปที่ Supabase Dashboard ของโปรเจกต์คุณ > **Project Settings** > **Database**
2. คัดลอก Connection Strings มาใส่ในไฟล์ `.env`:
   - **Connection Pooler (Transaction Mode - Port 6543)** ใส่ใน `DATABASE_URL`
   - **Direct Connection (Session Mode - Port 5432)** ใส่ใน `DIRECT_URL`
3. สั่ง Push Database Schema เข้า Supabase ด้วยคำสั่ง:
   ```bash
   npm run prisma:push
   ```
4. ซิงค์ข้อมูลผู้เข้าร่วมงาน คูปองอาหาร และรายชื่อ End Credit:
   ```bash
   npm run seed
   ```
   *(หมายเหตุ: หากยังไม่ได้ใส่ Service Account ของ Google ระบบจะสร้าง Mock Data ให้ทดสอบได้ทันที)*

---

## 2. วิธี Deploy ด้วย Cloudflare Tunnel + Docker (แนะนำสูงสุดและง่ายที่สุด 🚀)

วิธีนี้ทำให้คุณได้ **HTTPS/SSL ฟรี, ป้องกัน DDoS จาก Cloudflare 100%, และไม่ต้องเปิด Port บน Router ใดๆ**

### ขั้นตอนที่ 1: สร้าง Cloudflare Tunnel
1. เข้าไปที่ [Cloudflare Zero Trust Dashboard](https://one.dash.cloudflare.com/)
2. ไปที่เมนู **Networks** > **Tunnels** > กด **Create a tunnel**
3. เลือกประเภท **Cloudflared** > ตั้งชื่อ Tunnel (เช่น `bynior-tunnel`)
4. ในหน้า **Install and run a connector** ให้มองหาโค้ดที่มีคำว่า `--token <EY...>` 
5. คัดลอกข้อความ Token นั้นมาใส่ในไฟล์ `.env`:
   ```env
   CLOUDFLARE_TUNNEL_TOKEN="EYxxxxxxxxxxxxxxxxxxxxxxx..."
   ```
6. ในแท็บ **Public Hostname** ของ Tunnel ใน Cloudflare:
   - **Subdomain / Domain**: เลือกลิงก์ที่คุณต้องการ (เช่น `bynior.yourdomain.com`)
   - **Type**: `HTTP`
   - **URL**: `app:3000` (หรือ `localhost:3000`)
7. กด **Save hostname**

### ขั้นตอนที่ 2: รัน Docker
สั่งรันเพียงคำสั่งเดียว Docker จะบิลด์ Next.js Standalone และเชื่อม Tunnel ให้ทันที:
```bash
docker compose up -d --build
```

เมื่อเสร็จสิ้น คุณสามารถเข้าใช้งานเว็บผ่านโดเมนของคุณบน Cloudflare ได้ทันทีทั่วโลกแบบมี HTTPS ปลอดภัย!

---

## 3. ข้อมูลบัญชีผู้ใช้เริ่มต้นสำหรับทดสอบ

- **ผู้เข้าร่วมงาน (Participant)**:
  - ช่องกรอก: `6610210001-ใจดี` (หรือรหัส `6610210001`)
  - รหัสอื่นๆ ใน Mock: `6610210002` ถึง `6610210008`
- **แอดมินและเจ้าหน้าที่ (Admin & Staff)**:
  - ปุ่มเข้าอยู่มุมขวาบนของหน้า Login หรือเข้าตรงที่ `/admin/login`
  - รหัสผ่าน: `ByeniorSamoSci`
- **โรงฉาย End Credit 16:9 Vertical (1080x1920)**:
  - เข้าผ่าน `/admin/credits` หรือกดปุ่ม "เปิดจอ End Credit" ในหน้า Admin
