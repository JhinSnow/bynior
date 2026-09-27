const https = require('https');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

function fetchCsv(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchCsv(res.headers.location).then(resolve).catch(reject);
      }
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
    }).on('error', reject);
  });
}

function parseCsv(csvText) {
  const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);
  const rows = [];
  for (const line of lines) {
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

async function fix() {
  console.log('Fetching Google Sheet with UTF-8 Buffer...');
  const buf = await fetchCsv(
    'https://docs.google.com/spreadsheets/d/1fzohCFyoic3kczsdl9sNOpauTK-EHMb0ZmuwHQyLtNc/export?format=csv'
  );
  const text = buf.toString('utf-8');
  const rows = parseCsv(text).slice(1);

  const sheetMap = new Map();
  for (const r of rows) {
    const sid = r[1] ? r[1].trim() : '';
    const name = r[2] ? r[2].trim() : '';
    if (sid && name) sheetMap.set(sid, name);
  }

  const badIds = [
    '6610210778',
    '6610210763',
    '6610210809',
    '6610210832',
    '6610210035',
    '6610210232',
    '6610210280',
    '6610210407',
    '6610210459',
    '6610210518',
    '6610210538',
    '6610210664',
    '6610210680',
  ];

  for (const sid of badIds) {
    const correctName = sheetMap.get(sid);
    if (correctName) {
      const parts = correctName.split(/\s+/);
      const lastName = parts.length > 1 ? parts[parts.length - 1] : correctName;
      await prisma.user.update({
        where: { studentId: sid },
        data: { fullName: correctName, lastName: lastName },
      });
      console.log(`✅ FIXED: ${sid} -> ${correctName} (${lastName})`);
    } else {
      console.log(`❌ NOT FOUND in sheet: ${sid}`);
    }
  }

  console.log('All corrupted names updated successfully!');
}

fix()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
