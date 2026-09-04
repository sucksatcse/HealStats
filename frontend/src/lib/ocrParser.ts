export interface OcrField {
  key: string
  label: string
  value: string
  confidence: number
  type: string
}

export function parseOcrText(text: string): OcrField[] {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  let name = '';
  let age = '';
  let diagnosis = '';
  
  let nameConfidence = 50;
  let ageConfidence = 50;
  let diagConfidence = 50;

  for (const line of lines) {
    // Name parsing
    if (!name && /(?:name|patient|patient name)[\s:]*([A-Za-z\s]+)/i.test(line)) {
      const match = line.match(/(?:name|patient|patient name)[\s:]*([A-Za-z\s]+)/i);
      if (match && match[1].trim() && match[1].trim().length > 2) {
        name = match[1].trim();
        nameConfidence = 88;
      }
    }

    // Age parsing
    if (!age && /(?:age|y\/o|years|yr)[\s:]*(\d+)/i.test(line)) {
      const match = line.match(/(?:age|y\/o|years|yr)[\s:]*(\d+)/i);
      if (match && match[1].trim()) {
        age = match[1].trim();
        ageConfidence = 92;
      }
    }

    // Diagnosis parsing
    if (!diagnosis && /(?:diagnosis|dx|assessment|condition)[\s:]*(.+)/i.test(line)) {
      const match = line.match(/(?:diagnosis|dx|assessment|condition)[\s:]*(.+)/i);
      if (match && match[1].trim()) {
        diagnosis = match[1].trim();
        diagConfidence = 85;
      }
    }
  }

  return [
    { key: "patientName", label: "Patient Name", value: name, confidence: name ? nameConfidence : 0, type: "text" },
    { key: "age", label: "Age", value: age, confidence: age ? ageConfidence : 0, type: "number" },
    { key: "diagnosis", label: "Diagnosis", value: diagnosis, confidence: diagnosis ? diagConfidence : 0, type: "text" }
  ];
}
