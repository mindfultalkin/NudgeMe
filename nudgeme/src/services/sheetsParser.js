// Google Sheets parser — converts public sheet URL to coachee/topic data
// Sheet must be set to "Anyone with link can view"

function extractSheetId(url) {
  const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (!match) throw new Error('Invalid Google Sheets URL. Make sure you paste the full URL.');
  return match[1];
}

function sheetCsvUrl(sheetId, sheetName) {
  return `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&sheet=${encodeURIComponent(sheetName)}`;
}

function parseCsv(text) {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  return lines.slice(1).map(line => {
    // Handle quoted CSV values
    const values = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      if (line[i] === '"') { inQuotes = !inQuotes; continue; }
      if (line[i] === ',' && !inQuotes) { values.push(current.trim()); current = ''; continue; }
      current += line[i];
    }
    values.push(current.trim());
    const obj = {};
    headers.forEach((h, i) => { obj[h] = values[i] || ''; });
    return obj;
  });
}

export async function parseGoogleSheet(url) {
  const sheetId = extractSheetId(url);

  // Fetch both sheets
  const [coacheeRes, topicsRes] = await Promise.all([
    fetch(sheetCsvUrl(sheetId, 'Coachee Details')),
    fetch(sheetCsvUrl(sheetId, 'Topics Covered')),
  ]);

  if (!coacheeRes.ok) throw new Error('Could not read "Coachee Details" sheet. Make sure the sheet name matches exactly and sharing is set to "Anyone with link".');
  if (!topicsRes.ok) throw new Error('Could not read "Topics Covered" sheet. Make sure the sheet name matches exactly.');

  const coacheeText = await coacheeRes.text();
  const topicsText  = await topicsRes.text();

  const coacheeRaw = parseCsv(coacheeText);
  const topicsRaw  = parseCsv(topicsText);

  const coachees = coacheeRaw
    .filter(r => r['Coachee Name'])
    .map(r => ({
      coach:       r['Coach'] || '',
      coacheeName: r['Coachee Name'] || '',
      program:     r['Program'] || '',
      phone:       String(r['Coachee Phone No.'] || ''),
      email:       r['Coachee Email'] || '',
    }));

  const topics = topicsRaw
    .filter(r => r['Topic'])
    .map(r => ({
      date:        r['Date'] || '',
      topic:       r['Topic'] || '',
      coach:       r['Coach'] || '',
      coacheeName: r['Coachee Name'] || '',
    }));

  if (!coachees.length) throw new Error('No coachees found in the sheet.');
  if (!topics.length)   throw new Error('No topics found in the sheet.');

  return { coachees, topics, sheetId };
}

export { extractSheetId, sheetCsvUrl };