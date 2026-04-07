// Google Sheets parser — works for ALL users uploading their own Excel copies
// Sheet must be set to "Anyone with link can view"

export function extractSheetId(url) {
  // Handle truncated or malformed URLs gracefully
  const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (!match) throw new Error('Invalid Google Sheets URL. Make sure you copied the full link.');
  return match[1];
}

async function fetchCsvByGid(sheetId, gid) {
  try {
    const res = await fetch(
      `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`
    );
    if (!res.ok) return null;
    const text = await res.text();
    if (text.trim().startsWith('<') || text.trim().length < 10) return null;
    return text;
  } catch (e) { return null; }
}

async function fetchCsvByName(sheetId, name) {
  try {
    const res = await fetch(
      `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&sheet=${encodeURIComponent(name)}`
    );
    if (!res.ok) return null;
    const text = await res.text();
    if (text.trim().startsWith('<') || text.trim().length < 10) return null;
    return text;
  } catch (e) { return null; }
}

// Fetch all GIDs by trying gid=0,1,2,3,4 — works for xlsx files in Sheets
// where HTML discovery doesn't work
async function fetchAllSheetsByIndex(sheetId) {
  const results = [];
  for (let i = 0; i <= 5; i++) {
    const text = await fetchCsvByGid(sheetId, i);
    if (text) results.push({ gid: i, text });
  }
  return results;
}

// Try to discover named GIDs from sheet HTML (works for native Google Sheets)
async function discoverGidsFromHtml(sheetId) {
  try {
    const res = await fetch(`https://docs.google.com/spreadsheets/d/${sheetId}/edit`);
    const html = await res.text();
    const gidMap = {};
    // Pattern 1: standard Google Sheets
    const p1 = /"sheetId":(\d+),"title":"([^"]+)"/g;
    let m;
    while ((m = p1.exec(html)) !== null) {
      gidMap[m[2].toLowerCase().trim()] = parseInt(m[1]);
    }
    // Pattern 2: alternate format
    const p2 = /"title":"([^"]+)","sheetId":(\d+)/g;
    while ((m = p2.exec(html)) !== null) {
      gidMap[m[1].toLowerCase().trim()] = parseInt(m[2]);
    }
    console.log('HTML-discovered GIDs:', gidMap);
    return gidMap;
  } catch (e) {
    console.warn('HTML GID discovery failed:', e.message);
    return {};
  }
}

function getFirstLine(text) {
  return (text || '').split('\n')[0].toLowerCase();
}

function isCoacheeSheet(text) {
  const line = getFirstLine(text);
  return line.includes('coachee') || (line.includes('coach') && line.includes('name'));
}

function isTopicsSheet(text) {
  const line = getFirstLine(text);
  return line.includes('topic');
}

function splitCsvLine(line) {
  const values = [];
  let cur = '', inQ = false;
  for (let i = 0; i < line.length; i++) {
    if (line[i] === '"') { inQ = !inQ; continue; }
    if (line[i] === ',' && !inQ) { values.push(cur); cur = ''; continue; }
    cur += line[i];
  }
  values.push(cur);
  return values;
}

function parseCsv(text) {
  const lines = text.trim().replace(/^\uFEFF/, '').split('\n');
  if (lines.length < 2) return [];
  const headers = splitCsvLine(lines[0]).map(h => h.trim().replace(/^"|"$/g, '').trim());
  return lines.slice(1).map(line => {
    const vals = splitCsvLine(line);
    const obj = {};
    headers.forEach((h, i) => {
      obj[h] = (vals[i] || '').trim().replace(/^"|"$/g, '').trim();
    });
    return obj;
  }).filter(r => Object.values(r).some(v => v));
}

function col(row, ...names) {
  const keys = Object.keys(row);
  for (const name of names) {
    const n = name.toLowerCase().replace(/[\s.]/g, '');
    const k = keys.find(k => k.toLowerCase().replace(/[\s.]/g, '') === n);
    if (k && row[k]) return row[k];
  }
  return '';
}

export async function parseGoogleSheet(url) {
  const sheetId = extractSheetId(url);
  console.log('Parsing sheet ID:', sheetId);

  let coacheeText = null;
  let topicsText  = null;

  // ── STEP 1: Try by exact sheet name (most reliable for all users) ──
  const coacheeNames = ['Coachee Details', 'CoacheeDetails', 'Coachee', 'coachee details', 'Sheet1'];
  const topicsNames  = ['Topics Covered', 'TopicsCovered', 'Topics', 'topics covered', 'Sheet2'];

  for (const name of coacheeNames) {
    const text = await fetchCsvByName(sheetId, name);
    if (text && isCoacheeSheet(text)) {
      coacheeText = text;
      console.log(`Found coachee sheet by name: "${name}"`);
      break;
    }
  }

  for (const name of topicsNames) {
    const text = await fetchCsvByName(sheetId, name);
    if (text && isTopicsSheet(text)) {
      topicsText = text;
      console.log(`Found topics sheet by name: "${name}"`);
      break;
    }
  }

  // ── STEP 2: Try GID discovery from HTML ──
  if (!coacheeText || !topicsText) {
    const gidMap = await discoverGidsFromHtml(sheetId);
    if (Object.keys(gidMap).length > 0) {
      if (!coacheeText) {
        const key = Object.keys(gidMap).find(k =>
          k.includes('coachee') || k.includes('detail')
        );
        if (key) {
          const text = await fetchCsvByGid(sheetId, gidMap[key]);
          if (text && isCoacheeSheet(text)) {
            coacheeText = text;
            console.log(`Found coachee sheet via HTML GID: "${key}"`);
          }
        }
      }
      if (!topicsText) {
        const key = Object.keys(gidMap).find(k => k.includes('topic'));
        if (key) {
          const text = await fetchCsvByGid(sheetId, gidMap[key]);
          if (text && isTopicsSheet(text)) {
            topicsText = text;
            console.log(`Found topics sheet via HTML GID: "${key}"`);
          }
        }
      }
    }
  }

  // ── STEP 3: Brute-force scan gid=0 through gid=10 ──
  // This works for xlsx files in Sheets where each sheet gets sequential GIDs
  if (!coacheeText || !topicsText) {
    console.log('Trying brute-force GID scan 0-10...');
    for (let gid = 0; gid <= 10; gid++) {
      const text = await fetchCsvByGid(sheetId, gid);
      if (!text) continue;
      if (!coacheeText && isCoacheeSheet(text)) {
        coacheeText = text;
        console.log(`Found coachee sheet at gid=${gid}`);
      } else if (!topicsText && isTopicsSheet(text)) {
        topicsText = text;
        console.log(`Found topics sheet at gid=${gid}`);
      }
      if (coacheeText && topicsText) break;
    }
  }

  // ── STEP 4: Last resort — scan large GID ranges ──
  // xlsx files in Google Drive sometimes get large random GIDs
  if (!coacheeText || !topicsText) {
    console.log('Trying large GID range scan...');
    const largeGids = [
      1122175383, 187229383,  // known GIDs from original sheet
      1785532529, 632278109,  // other common GIDs
    ];
    for (const gid of largeGids) {
      const text = await fetchCsvByGid(sheetId, gid);
      if (!text) continue;
      if (!coacheeText && isCoacheeSheet(text)) {
        coacheeText = text;
        console.log(`Found coachee sheet at large gid=${gid}`);
      } else if (!topicsText && isTopicsSheet(text)) {
        topicsText = text;
        console.log(`Found topics sheet at large gid=${gid}`);
      }
      if (coacheeText && topicsText) break;
    }
  }

  // ── Error if still not found ──
  if (!coacheeText) {
    throw new Error(
      'Could not find the "Coachee Details" sheet.\n\n' +
      'Please make sure:\n' +
      '• Sheet tab is named exactly "Coachee Details"\n' +
      '• Sharing is set to "Anyone with the link can view"\n' +
      '• The sheet has columns: Coach, Coachee Name, Program, Coachee Phone No., Coachee Email'
    );
  }

  if (!topicsText) {
    throw new Error(
      'Could not find the "Topics Covered" sheet.\n\n' +
      'Please make sure:\n' +
      '• Sheet tab is named exactly "Topics Covered"\n' +
      '• The sheet has columns: Date, Topic, Coach, Coachee Name'
    );
  }

  // ── Parse CSV data ──
  const coacheeRaw = parseCsv(coacheeText);
  const topicsRaw  = parseCsv(topicsText);

  const detectedCoacheeCols = coacheeRaw[0] ? Object.keys(coacheeRaw[0]).join(' | ') : 'none';
  const detectedTopicsCols  = topicsRaw[0]  ? Object.keys(topicsRaw[0]).join(' | ')  : 'none';

  console.log('Coachee columns:', detectedCoacheeCols);
  console.log('Topics columns:', detectedTopicsCols);

  const coachees = coacheeRaw
    .filter(r => col(r, 'Coachee Name', 'CoacheeName', 'Name'))
    .map(r => ({
      coach:       col(r, 'Coach'),
      coacheeName: col(r, 'Coachee Name', 'CoacheeName', 'Name'),
      program:     col(r, 'Program'),
      phone:       col(r, 'Coachee Phone No.', 'Coachee Phone No', 'Phone', 'Phone No', 'CoacheePhone', 'Mobile'),
      email:       col(r, 'Coachee Email', 'CoacheeEmail', 'Email'),
    }));

  const topics = topicsRaw
    .filter(r => col(r, 'Topic', 'Topics'))
    .map(r => ({
      date:        col(r, 'Date'),
      topic:       col(r, 'Topic', 'Topics'),
      coach:       col(r, 'Coach'),
      coacheeName: col(r, 'Coachee Name', 'CoacheeName', 'Name'),
    }));

  if (!coachees.length) {
    throw new Error(
      `Found the Coachee sheet but no data rows.\n\nColumns detected: ${detectedCoacheeCols}\n\nMake sure "Coachee Name" column exists with data.`
    );
  }

  if (!topics.length) {
    throw new Error(
      `Found the Topics sheet but no data rows.\n\nColumns detected: ${detectedTopicsCols}\n\nMake sure "Topic" column exists with data.`
    );
  }

  return { coachees, topics, sheetId };
}