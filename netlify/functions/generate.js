const https = require('https');

function callAnthropic(payload) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(payload);
    const options = {
      hostname: 'api.anthropic.com',
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Length': Buffer.byteLength(body)
      }
    };
    const req = https.request(options, res => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch(e) { reject(new Error('Parse error: ' + data.substring(0,100))); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
};

exports.handler = async function(event) {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: CORS, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: 'Method not allowed' }) };

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: 'ANTHROPIC_API_KEY not configured' }) };

  let body;
  try { body = JSON.parse(event.body); }
  catch(e) { return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Invalid JSON' }) }; }

  // Route: generate problem OR grade handwriting
  const route = body.route || 'problem';

  try {
    if (route === 'grade') {
      // Grade handwritten work from image
      const { image, question, answer, level, topic, messyAttempt } = body;
      
      const systemPrompt = `You are grading handwritten math work for Need to Know Nine, a K-Calculus math app.
You will receive an image of a student's handwritten answer to a math problem.

CRITICAL: The student's grade level is: ${level}
K and Grade 1 students are 5-7 years old. Their handwriting is VERY imperfect. Be extremely generous.

YOUR JOB:
1. Look at what the student drew or wrote
2. Decide if it is legible enough to read (very low bar for K/1)
3. If legible, check if the correct concept is shown
4. Return ONLY valid JSON

═══ AGE-BASED GRADING STANDARDS ═══

FOR KINDERGARTEN (Level K) — BE VERY GENEROUS:
- A wobbly, open, or imperfect circle still counts as a circle
- A partial circle (C shape, arc, oval) = circle ✓
- A filled-in blob of the right color = correct for pattern questions ✓
- Any mark in the correct color near the blank = correct for patterns ✓
- Shaky numbers that are recognizable count as legible ✓
- Accept approximate answers: "3" for answer "3" even if looks like "2" if context suggests 3
- NEVER mark illegible just because it's messy or shaky
- Only mark illegible if you truly cannot tell what they intended

FOR PATTERN QUESTIONS (visualType = "pattern"):
The student must show the NEXT COLOR in the pattern.
The correct answer is: "${answer}"
ACCEPT as correct if student:
- Drew ANY shape (circle, blob, scribble, filled area) in the correct color ink
- Circled the blank area in the correct color
- Wrote the color word (red, blue, green, yellow, orange, purple)
- Made ANY mark that is predominantly the correct color
DO NOT require a perfectly closed circle. Any orange mark = orange ✓
The marker color the student chose tells you their intended answer.

FOR CIRCLING QUESTIONS (compare, measurement):
The student must circle ONE of the two options shown.
ACCEPT: any encircling mark, oval, arc, loop, or drawn boundary around one option
ACCEPT: partial circles, C-shapes, squiggly loops — anything that clearly indicates one choice
The student circled the: (describe which side has the circling mark)

FOR COUNTING QUESTIONS:
Accept the number written anywhere on the canvas.
A "3" that looks slightly like an "8" — if the context is counting 3 objects, mark correct.

FOR ADDITION QUESTIONS:
Accept the sum written anywhere. "5" for 3+2 even if written imperfectly.

═══ SYMBOL DISAMBIGUATION ═══
- "1" vs "l" vs "I" — use context
- "6" vs "b" — use context  
- "2" vs "Z" — use context
- "5" vs "S" — use context

═══ COIN/MONEY QUESTIONS ═══
If question asks "How much money" — answer is a cent value like "16¢"
Accept: "16", "16¢", "16c", "16 cents" — all equivalent
If question asks "How many coins" — answer is a count like "3"

Return JSON:
{
  "legible": true/false,
  "confidence": "high"/"medium"/"low",
  "read": "what you read/saw from the student's work",
  "correct": true/false/null,
  "workShown": "brief description",
  "selfCorrected": false,
  "strategy": "counting/drawing/recall/unknown",
  "messyReason": "only if legible=false: specific reason",
  "symbolConfusion": "specific pair if applicable",
  "feedback": "encouraging 1-sentence feedback, age-appropriate for ${level}",
  "teacherNote": "brief note about what this reveals"
}`;

      const userContent = [
        {
          type: 'image',
          source: {
            type: 'base64',
            media_type: image.startsWith('data:image/png') ? 'image/png' : 'image/jpeg',
            data: image.replace(/^data:image\/(jpeg|jpg|png);base64,/, '')
          }
        },
        {
          type: 'text',
          text: `Question: "${question}"
Correct answer: "${answer}"
Level: ${level}
Topic: ${topic}
This is messy attempt #${messyAttempt || 0} (0 = first attempt, 1 = second, 2 = third)

Grade this student's handwritten work.`
        }
      ];

      const data = await callAnthropic({
        model: 'claude-sonnet-4-5',
        max_tokens: 400,
        system: systemPrompt,
        messages: [{ role: 'user', content: userContent }]
      });

      const raw = (data.content||[]).map(c=>c.text||'').join('');
      const match = raw.match(/\{[\s\S]*\}/);
      if (!match) throw new Error('No JSON in grade response');
      return { statusCode: 200, headers: CORS, body: match[0] };

    } else {
      // Generate a problem
      const data = await callAnthropic({
        model: 'claude-sonnet-4-5',
        max_tokens: body.max_tokens || 600,
        system: body.system || '',
        messages: body.messages || []
      });
      return { statusCode: 200, headers: CORS, body: JSON.stringify(data) };
    }
  } catch(err) {
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: err.message }) };
  }
};
