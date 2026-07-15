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
//
// IMPORTANT — manual credentials, not auto-injection:
// Netlify Blobs is *supposed* to auto-inject siteID/token when getStore() is
// called inside a function handler (which this always has been). In practice,
// as of mid-2026 there are multiple open, unresolved Netlify support threads
// of exactly this auto-injection silently failing in production even when
// the code follows the documented pattern exactly. Rather than depend on
// that working, this function requires two environment variables you set
// yourself in the Netlify dashboard (Project configuration > Environment
// variables) — this is Netlify's own documented fallback, not a workaround:
//   NETLIFY_SITE_ID     — Project configuration > General > Project information > Project ID
//   NETLIFY_BLOBS_TOKEN — a Personal Access Token: your account avatar (top
//                         right) > User settings > Applications > Personal
//                         access tokens > New access token

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

  const siteID = process.env.NETLIFY_SITE_ID;
  const token = process.env.NETLIFY_BLOBS_TOKEN;
  if (!siteID || !token) {
    return {
      statusCode: 500, headers: CORS,
      body: JSON.stringify({
        error: 'Missing NETLIFY_SITE_ID or NETLIFY_BLOBS_TOKEN environment variable — set both in Project configuration > Environment variables, then redeploy.'
      })
    };
  }
  const store = getStore({ name: 'nkn-data', siteID, token });

  if (event.httpMethod === 'GET') {
    const data = (await store.get('state', { type: 'json' })) || EMPTY_STATE;
    return { statusCode: 200, headers: CORS, body: JSON.stringify(data) };
  }

  if (event.httpMethod === 'POST') {
    let incoming;
    try { incoming = JSON.parse(event.body); }
    catch (e) { return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Invalid JSON' }) }; }

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
