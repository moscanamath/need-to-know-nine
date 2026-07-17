// Real-time-feeling multiplayer for Junk, built on the same Netlify Blobs
// backend as sync.js (same NETLIFY_SITE_ID / NETLIFY_BLOBS_TOKEN env vars —
// no extra setup needed beyond what's already configured for the shared
// student/teacher backend).
//
// There's no true persistent connection here (Netlify Functions don't hold
// one open) — instead, the client polls this endpoint every ~1.5 seconds
// while waiting on the other player. For a turn-based card game like Junk,
// that reads as effectively live; it is not millisecond-instant like a video
// call, and that tradeoff is intentional rather than a shortcut.
//
// The server is authoritative for the deck and for grading each move, so two
// players' apps can never see two different "truths" about the game.

const { getStore } = require('@netlify/blobs');

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Content-Type': 'application/json'
};

function makeCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O/1/I to avoid confusion
  let code = '';
  for (let i = 0; i < 5; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

function shuffledDeck(deckDef) {
  let cards = [];
  deckDef.categories.forEach(cat => {
    cat.cards.forEach(c => cards.push({ display: c.display, value: c.value, kind: 'number' }));
  });
  for (let i = 0; i < 8; i++) cards.push({ display: 'JUNK', value: null, kind: 'junk' });
  for (let i = 0; i < 4; i++) cards.push({ display: 'WILD', value: null, kind: 'wild' });
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
  return cards;
}

exports.handler = async function (event) {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: CORS, body: '' };

  const siteID = process.env.NETLIFY_SITE_ID;
  const token = process.env.NETLIFY_BLOBS_TOKEN;
  if (!siteID || !token) {
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: 'Missing NETLIFY_SITE_ID or NETLIFY_BLOBS_TOKEN — same setup as the main shared backend.' }) };
  }
  const store = getStore({ name: 'junk-rooms', siteID, token });

  if (event.httpMethod === 'GET') {
    const code = (event.queryStringParameters || {}).code;
    if (!code) return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Missing room code' }) };
    const room = await store.get(code, { type: 'json' });
    if (!room) return { statusCode: 404, headers: CORS, body: JSON.stringify({ error: 'Room not found — check the code' }) };
    return { statusCode: 200, headers: CORS, body: JSON.stringify(room) };
  }

  if (event.httpMethod !== 'POST') return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: 'Method not allowed' }) };

  let body;
  try { body = JSON.parse(event.body); }
  catch (e) { return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Invalid JSON' }) }; }

  const action = body.action;

  if (action === 'create') {
    const code = makeCode();
    const room = {
      code,
      deck: shuffledDeck(body.deckDef),
      junkPile: [],
      players: [{ name: body.name || 'Player 1', slots: Array.from({ length: 10 }, () => ({ revealed: false, card: null })) }],
      turn: 0,
      currentDraw: null,
      status: 'waiting',
      winnerIdx: null,
      version: 1,
      updatedAt: Date.now()
    };
    await store.setJSON(code, room);
    return { statusCode: 200, headers: CORS, body: JSON.stringify(room) };
  }

  if (action === 'join') {
    const room = await store.get(body.code, { type: 'json' });
    if (!room) return { statusCode: 404, headers: CORS, body: JSON.stringify({ error: 'Room not found — check the code' }) };
    if (room.players.length >= 2) return { statusCode: 409, headers: CORS, body: JSON.stringify({ error: 'This room already has two players' }) };
    room.players.push({ name: body.name || 'Player 2', slots: Array.from({ length: 10 }, () => ({ revealed: false, card: null })) });
    room.status = 'playing';
    room.version++;
    room.updatedAt = Date.now();
    await store.setJSON(body.code, room);
    return { statusCode: 200, headers: CORS, body: JSON.stringify(room) };
  }

  if (action === 'draw') {
    const room = await store.get(body.code, { type: 'json' });
    if (!room) return { statusCode: 404, headers: CORS, body: JSON.stringify({ error: 'Room not found' }) };
    if (room.status !== 'playing') return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Game is not in progress' }) };
    if (room.turn !== body.playerIndex) return { statusCode: 409, headers: CORS, body: JSON.stringify({ error: 'Not your turn' }) };
    if (room.currentDraw) return { statusCode: 200, headers: CORS, body: JSON.stringify(room) };

    if (room.deck.length === 0) {
      if (room.junkPile.length === 0) return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'No cards left anywhere' }) };
      room.deck = room.junkPile;
      room.junkPile = [];
      for (let i = room.deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [room.deck[i], room.deck[j]] = [room.deck[j], room.deck[i]];
      }
    }
    const card = room.deck.pop();
    if (card.kind === 'junk') {
      room.junkPile.push(card);
      room.turn = (room.turn + 1) % room.players.length;
      room.currentDraw = null;
      room.lastEvent = { type: 'junk', playerIndex: body.playerIndex };
    } else {
      room.currentDraw = card;
      room.lastEvent = { type: 'drew', playerIndex: body.playerIndex };
    }
    room.version++;
    room.updatedAt = Date.now();
    await store.setJSON(body.code, room);
    return { statusCode: 200, headers: CORS, body: JSON.stringify(room) };
  }

  if (action === 'answer') {
    const room = await store.get(body.code, { type: 'json' });
    if (!room) return { statusCode: 404, headers: CORS, body: JSON.stringify({ error: 'Room not found' }) };
    if (room.turn !== body.playerIndex) return { statusCode: 409, headers: CORS, body: JSON.stringify({ error: 'Not your turn' }) };
    if (!room.currentDraw) return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'No card is currently awaiting an answer' }) };

    const player = room.players[body.playerIndex];
    const slotIdx = body.slotIndex;
    const card = room.currentDraw;
    const slot = player.slots[slotIdx];

    if (card.kind === 'wild') {
      if (slot.revealed) {
        return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'That spot is already filled' }) };
      }
      slot.revealed = true; slot.card = { display: 'WILD', value: null };
      room.currentDraw = null;
      room.lastEvent = { type: 'wildPlaced', playerIndex: body.playerIndex, slotIdx };
    } else if (!slot.revealed && slotIdx === card.value - 1) {
      slot.revealed = true; slot.card = card;
      room.currentDraw = null;
      room.lastEvent = { type: 'correct', playerIndex: body.playerIndex, slotIdx, value: card.value };
    } else {
      player.mistakes = (player.mistakes || 0) + 1;
      room.junkPile.push(card);
      room.currentDraw = null;
      room.turn = (room.turn + 1) % room.players.length;
      room.lastEvent = { type: 'miss', playerIndex: body.playerIndex, slotIdx, actualValue: card.value };
    }

    if (player.slots.every(s => s.revealed)) {
      room.status = 'done';
      room.winnerIdx = body.playerIndex;
    }
    room.version++;
    room.updatedAt = Date.now();
    await store.setJSON(body.code, room);
    return { statusCode: 200, headers: CORS, body: JSON.stringify(room) };
  }

  return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Unknown action' }) };
};
