#!/usr/bin/env node
/**
 * Builds a printable, generic (non-personalized) Need to Know Nine booklet
 * for a chosen grade, with a QR code on every problem that routes to
 * scan.html for AI grading + shared portal syncing.
 *
 * Why this pulls the problems straight out of index.html instead of having
 * its own copy of the question logic: Susie found a real bug where a
 * separately-maintained label list drifted out of sync with the actual
 * generator code. To make that class of bug structurally impossible for the
 * booklet too, this script extracts and runs the EXACT SAME generator
 * functions (genG6, genG7, genG8, etc.) straight from the live index.html
 * at build time — there is no second copy of the problem content anywhere.
 *
 * Setup (one time):
 *   cd n2n9-final_4/booklet
 *   npm install qrcode
 *
 * Usage:
 *   node build-booklet.js <grade> <numDays> [siteUrl]
 *   node build-booklet.js 7 10
 *   node build-booklet.js 6 5 https://imaginative-nasturtium-4e7267.netlify.app
 *
 * Output: booklet-grade<N>.html in this folder — open it in any browser and
 * use Print > Save as PDF for the physical booklet.
 */

const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode');

const grade = process.argv[2];
const numDays = parseInt(process.argv[3] || '10', 10);
const siteUrl = (process.argv[4] || 'https://imaginative-nasturtium-4e7267.netlify.app').replace(/\/$/, '');

if (!grade) {
  console.error('Usage: node build-booklet.js <grade> <numDays> [siteUrl]');
  console.error('Example: node build-booklet.js 7 10');
  process.exit(1);
}

// ── Extract the generator logic straight from index.html ────────────────
const indexPath = path.join(__dirname, '..', 'index.html');
const html = fs.readFileSync(indexPath, 'utf8');
const lines = html.split('\n');
const startIdx = lines.findIndex(l => l.includes('Levels & Topics'));
const endIdx = lines.findIndex(l => l.includes('async function fetchProblem'));
if (startIdx === -1 || endIdx === -1) {
  console.error('Could not find the expected markers in index.html — has the file structure changed?');
  process.exit(1);
}
const snippet = lines.slice(startIdx, endIdx).join('\n');

// Run the extracted code in an isolated function scope and pull out what we need.
const runner = new Function(`
  ${snippet}
  return { generateFromTemplate, topicLabel, LN };
`);
const { generateFromTemplate, topicLabel, LN } = runner();

if (!LN[grade]) {
  console.error(`Unknown grade "${grade}". Valid: ${Object.keys(LN).join(', ')}`);
  process.exit(1);
}

// ── Generate content ─────────────────────────────────────────────────────
const days = [];
for (let day = 1; day <= numDays; day++) {
  const boxes = [];
  for (let i = 0; i < 9; i++) {
    const tid = 't' + i;
    let prob = null, tries = 0;
    while (!prob && tries < 5) { prob = generateFromTemplate(grade, tid, day); tries++; }
    boxes.push({
      tid,
      label: topicLabel(tid, grade),
      q: prob ? prob.q : '(no problem generated)',
      a: prob ? prob.a : '',
    });
  }
  days.push({ day, boxes });
}

// ── Build QR codes (one per problem) ─────────────────────────────────────
async function buildQr(day, tid, q, a) {
  const url = `${siteUrl}/scan.html?g=${encodeURIComponent(grade)}&d=${day}&b=${tid}` +
              `&q=${encodeURIComponent(q)}&a=${encodeURIComponent(a)}`;
  return QRCode.toDataURL(url, { margin: 1, width: 160 });
}

async function main() {
  let pagesHtml = '';
  let answerKeyHtml = '';

  for (const { day, boxes } of days) {
    const boxesHtml = [];
    for (const b of boxes) {
      const qrDataUrl = await buildQr(day, b.tid, b.q, b.a);
      boxesHtml.push(`
        <div class="box">
          <div class="box-label">${escapeHtml(b.label)}</div>
          <div class="box-q">${escapeHtml(b.q)}</div>
          <div class="write-space"></div>
          <img class="qr" src="${qrDataUrl}" alt="Scan to grade">
        </div>`);
    }
    pagesHtml += `
      <section class="day-page">
        <div class="day-header">
          <div class="day-title">Need to Know Nine — ${escapeHtml(LN[grade])}</div>
          <div class="day-sub">Day ${day} of 200</div>
        </div>
        <div class="grid3">${boxesHtml.join('')}</div>
        <div class="footer-note">Scan the QR code under each problem to check it and log it to your student/teacher portal.</div>
      </section>`;

    answerKeyHtml += `
      <div class="key-day">
        <div class="key-day-title">Day ${day}</div>
        <ol class="key-list">
          ${boxes.map(b => `<li><strong>${escapeHtml(b.label)}:</strong> ${escapeHtml(b.a)}</li>`).join('')}
        </ol>
      </div>`;
  }

  const outputHtml = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Need to Know Nine — ${escapeHtml(LN[grade])} Booklet</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0;}
  body{font-family:Georgia,'Times New Roman',serif;color:#1a1a1a;}
  .day-page{page-break-after:always;padding:0.6in;min-height:9.5in;}
  .day-header{display:flex;justify-content:space-between;align-items:baseline;border-bottom:2px solid #1a1a1a;padding-bottom:8px;margin-bottom:16px;}
  .day-title{font-size:16px;font-weight:700;}
  .day-sub{font-size:14px;color:#555;}
  .grid3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px;}
  .box{border:1.5px solid #444;border-radius:6px;padding:10px;min-height:2.4in;display:flex;flex-direction:column;}
  .box-label{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.03em;color:#555;margin-bottom:6px;}
  .box-q{font-size:13px;line-height:1.5;white-space:pre-line;flex:0 0 auto;}
  .write-space{flex:1 1 auto;border-top:1px dashed #bbb;margin-top:8px;}
  .qr{width:0.9in;height:0.9in;align-self:flex-end;margin-top:6px;}
  .footer-note{font-size:10px;color:#888;text-align:center;margin-top:14px;}
  .key-page{padding:0.6in;}
  .key-day{margin-bottom:18px;}
  .key-day-title{font-weight:700;font-size:13px;margin-bottom:4px;}
  .key-list{font-size:12px;line-height:1.6;padding-left:18px;}
  @media print{ .day-page{page-break-after:always;} }
</style>
</head>
<body>
${pagesHtml}
<section class="key-page">
  <div class="day-header"><div class="day-title">Answer Key — ${escapeHtml(LN[grade])}</div></div>
  ${answerKeyHtml}
</section>
</body>
</html>`;

  const outPath = path.join(__dirname, `booklet-grade${grade}.html`);
  fs.writeFileSync(outPath, outputHtml, 'utf8');
  console.log(`Done: ${outPath}`);
  console.log(`Open it in a browser and use Print > Save as PDF for the physical booklet.`);
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

main().catch(err => { console.error(err); process.exit(1); });
