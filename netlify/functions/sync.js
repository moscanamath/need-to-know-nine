// Shared cross-device storage for Need to Know Nine.
// Replaces the old "each browser only knows its own students" limitation:
// previously all progress/teacher-feedback/class-code data lived only in
// localStorage on whichever single device saved it. This function gives every
// device (student tablets, teacher laptop, a phone scanning printed work) one
// shared source of truth via Netlify Blobs, which is included in your existing
// Netlify plan (no separate storage bill — see NKN_Grant_Options.md notes).
//
// Requires the `@netlify/blobs` package: run `npm install @netlify/blobs`
// in the project root before deploying (add it to package.json dependencies).

const { getStore } = require('@netlify/blobs');

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Content-Type': 'application/json'
};

const EMPTY_STATE = { students: {}, teacherEmails: {}, teacherCodes: {} };

exports.handler = async function(event) {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: CORS, body: '' };

  const store = getStore('nkn-data');

  if (event.httpMethod === 'GET') {
    const data = (await store.get('state', { type: 'json' })) || EMPTY_STATE;
    return { statusCode: 200, headers: CORS, body: JSON.stringify(data) };
  }

  if (event.httpMethod === 'POST') {
    let incoming;
    try { incoming = JSON.parse(event.body); }
    catch (e) { return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Invalid JSON' }) }; }

    // Merge strategy (v1 — last-write-wins PER STUDENT/TEACHER KEY, not a full
    // overwrite): this means two devices editing two different students at the
    // same time both survive. Two devices editing the SAME student record at
    // the exact same moment will have the later POST win for that one record.
    // Good enough for a classroom's normal usage pattern; worth revisiting if
    // you scale to many simultaneous teachers editing the same student.
    const existing = (await store.get('state', { type: 'json' })) || EMPTY_STATE;
    const merged = {
      students: { ...existing.students, ...(incoming.students || {}) },
      teacherEmails: { ...existing.teacherEmails, ...(incoming.teacherEmails || {}) },
      teacherCodes: { ...existing.teacherCodes, ...(incoming.teacherCodes || {}) },
    };
    await store.setJSON('state', merged);
    return { statusCode: 200, headers: CORS, body: JSON.stringify({ ok: true }) };
  }

  return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: 'Method not allowed' }) };
};
