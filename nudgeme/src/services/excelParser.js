import * as XLSX from 'xlsx';

export function parseExcelFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const workbook = XLSX.read(e.target.result, { type: 'binary', cellDates: true });
        
        // Parse Coachee Details sheet
        const coacheeSheet = workbook.Sheets['Coachee Details'];
        if (!coacheeSheet) {
          throw new Error('Sheet "Coachee Details" not found.');
        }
        
        const coachees = XLSX.utils.sheet_to_json(coacheeSheet, { defval: '' })
          .filter((r) => r['Coachee Name'])
          .map((r) => ({
            coach: r['Coach'] || '',
            coacheeName: r['Coachee Name'] || '',
            program: r['Program'] || '',
            phone: String(r['Coachee Phone No.'] || ''),
            email: r['Coachee Email'] || '',
          }));
        
        // Parse Topics Covered sheet
        const topicsSheet = workbook.Sheets['Topics Covered'];
        if (!topicsSheet) {
          throw new Error('Sheet "Topics Covered" not found.');
        }
        
        const topics = XLSX.utils.sheet_to_json(topicsSheet, { defval: '', cellDates: true })
          .filter((r) => r['Topic'])
          .map((r) => {
            let dateStr = '';
            const rawDate = r['Date'];
            if (rawDate instanceof Date) {
              dateStr = rawDate.toISOString().split('T')[0];
            } else if (typeof rawDate === 'string' && rawDate) {
              dateStr = rawDate;
            }
            return {
              date: dateStr,
              topic: r['Topic'] || '',
              coach: r['Coach'] || '',
              coacheeName: r['Coachee Name'] || '',
            };
          });
        
        if (!coachees.length) {
          throw new Error('No coachees found.');
        }
        if (!topics.length) {
          throw new Error('No topics found.');
        }
        
        resolve({ coachees, topics });
      } catch (err) {
        reject(err);
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read file.'));
    reader.readAsBinaryString(file);
  });
}

