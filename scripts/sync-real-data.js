const https = require('https');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

const USERS_SHEET_ID = '1fzohCFyoic3kczsdl9sNOpauTK-EHMb0ZmuwHQyLtNc';
const CREDITS_SHEET_ID = '1-D2yrpC2mVOTv7ArpZw0cVXy-TOS-4YKo1aQfgGZIrc';

function fetchCsv(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchCsv(res.headers.location).then(resolve).catch(reject);
      }
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

function parseCsv(csvText) {
  const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);
  const rows = [];
  for (const line of lines) {
    // Simple CSV parser supporting quotes
    const row = [];
    let insideQuote = false;
    let current = '';
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        insideQuote = !insideQuote;
      } else if (char === ',' && !insideQuote) {
        row.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    row.push(current.trim());
    rows.push(row);
  }
  return rows;
}

async function syncUsers() {
  console.log('🔄 Fetching Real Users from Sheet 1...');
  const url = `https://docs.google.com/spreadsheets/d/${USERS_SHEET_ID}/export?format=csv`;
  const csvText = await fetchCsv(url);
  const rows = parseCsv(csvText);

  // Skip header: ปีเข้าศึกษา,รหัสนักศึกษา,ชื่อ,ระดับการศึกษา,ภาควิชา,สาขาวิชา
  const userRows = rows.slice(1);
  console.log(`📊 Found ${userRows.length} total user records in Sheet 1.`);

  const upsertData = [];
  for (const row of userRows) {
    const studentId = row[1] ? row[1].trim() : '';
    const rawFullName = row[2] ? row[2].trim() : '';

    if (!studentId || !rawFullName) continue;

    // สกัดคำนำหน้าออก เช่น น.ส.กชกร ช่อมณี หรือ นายสมชาย ใจดี
    const parts = rawFullName.trim().split(/\s+/);
    let lastName = '';
    if (parts.length > 1) {
      lastName = parts[parts.length - 1]; // คำสุดท้ายคือนามสกุล
    } else {
      lastName = rawFullName;
    }

    upsertData.push({
      studentId,
      fullName: rawFullName,
      lastName,
    });
  }

  console.log(`📥 Upserting ${upsertData.length} users to Supabase...`);
  // Batch upsert into Supabase
  let successCount = 0;
  for (const u of upsertData) {
    await prisma.user.upsert({
      where: { studentId: u.studentId },
      update: { fullName: u.fullName, lastName: u.lastName },
      create: {
        studentId: u.studentId,
        fullName: u.fullName,
        lastName: u.lastName,
      },
    });
    successCount++;
  }

  console.log(`✅ Synced ${successCount} real attendees to Supabase!`);
}

async function syncCredits() {
  console.log('🔄 Fetching Real Staff & Organizer Credits from Sheet 2...');

  const tabDefs = [
    { name: 'กลุ่มการแสดงที่ 1', gid: '0', category: 'PERFORMANCE_1' },
    { name: 'กลุ่มการแสดงที่ 2', gid: '1972443016', category: 'PERFORMANCE_2' },
    { name: 'กลุ่มการแสดงที่ 3', gid: '1479154026', category: 'PERFORMANCE_3' },
    { name: 'ชุมนุม', gid: '320798166', category: 'CLUB' },
    { name: 'สโมสร', gid: '516298158', category: 'SAMO' },
  ];

  await prisma.organizerCredit.deleteMany();
  console.log('🧹 Cleared old credits records.');

  const allCredits = [];

  for (const tab of tabDefs) {
    const url = `https://docs.google.com/spreadsheets/d/${CREDITS_SHEET_ID}/export?format=csv&gid=${tab.gid}`;
    try {
      const csvText = await fetchCsv(url);
      const rows = parseCsv(csvText);

      // Skip header row: Col A (Index 0) = อันดับ, Col C (Index 2) = ชื่อ-สกุล
      const dataRows = rows.slice(1);
      let count = 0;

      for (const row of dataRows) {
        const orderStr = row[0] ? row[0].trim() : '';
        const fullName = row[2] ? row[2].trim() : '';

        const orderIndex = parseInt(orderStr, 10);
        if (!isNaN(orderIndex) && fullName) {
          allCredits.push({
            category: tab.category,
            orderIndex,
            fullName,
          });
          count++;
        }
      }
      console.log(`   🏷️ [${tab.name}]: Extracted ${count} members.`);
    } catch (err) {
      console.warn(`   ⚠️ Error reading tab ${tab.name}:`, err.message);
    }
  }

  if (allCredits.length > 0) {
    await prisma.organizerCredit.createMany({
      data: allCredits,
    });
    console.log(`✅ Synced ${allCredits.length} real staff & organizers credits into Supabase!`);
  }
}

async function main() {
  try {
    await syncUsers();
    await syncCredits();
    console.log('🎉 ALL REAL DATA SYNCED SUCCESSFULLY TO SUPABASE!');
  } catch (err) {
    console.error('❌ Sync failed:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
