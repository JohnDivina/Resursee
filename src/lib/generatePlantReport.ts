import { jsPDF } from 'jspdf';
import { PlantDiagnosisResult } from '@/types/plantDoctor';

/**
 * Generates a formal, professional, institutional clinical PDF diagnosis report.
 * Adheres strictly to formal documentation standards with zero emojis and clean typography.
 */
export function generateFormalPlantReport(diagnosis: PlantDiagnosisResult, imageBase64?: string | null): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 18;
  let y = margin;

  // Helper for adding lines with auto page break
  const checkPageBreak = (neededHeight: number) => {
    if (y + neededHeight > pageHeight - margin) {
      doc.addPage();
      y = margin;
      drawHeaderWatermark();
    }
  };

  const drawHeaderWatermark = () => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('RESURSEE BOTANICAL PATHOLOGY LABORATORY • CLINICAL EVALUATION REPORT', margin, 10);
    doc.setDrawColor(220, 220, 220);
    doc.line(margin, 12, pageWidth - margin, 12);
  };

  // --- 1. Institutional Document Header ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(17, 24, 39); // Charcoal #111827
  doc.text('RESURSEE BOTANICAL PATHOLOGY LABORATORY', margin, y);
  y += 5.5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(75, 85, 99); // Neutral #4b5563
  doc.text('CLINICAL PHYTOSANITARY DIAGNOSTIC REPORT', margin, y);
  y += 6;

  // Horizontal separator line
  doc.setDrawColor(17, 24, 39);
  doc.setLineWidth(0.6);
  doc.line(margin, y, pageWidth - margin, y);
  y += 7;

  // --- 2. Metadata Key-Value Header Grid ---
  const reportId = diagnosis.id ? diagnosis.id.toUpperCase() : `RES-${Date.now().toString(36).toUpperCase()}`;
  const issueDate = new Date(diagnosis.timestamp || Date.now()).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(55, 65, 81);
  doc.text('DOCUMENT ID:', margin, y);
  doc.setFont('helvetica', 'normal');
  doc.text(reportId, margin + 28, y);

  doc.setFont('helvetica', 'bold');
  doc.text('DATE ISSUED:', margin + 100, y);
  doc.setFont('helvetica', 'normal');
  doc.text(issueDate, margin + 128, y);
  y += 5;

  doc.setFont('helvetica', 'bold');
  doc.text('EVALUATOR:', margin, y);
  doc.setFont('helvetica', 'normal');
  doc.text('Autonomous Multimodal Vision Pathology System', margin + 28, y);

  doc.setFont('helvetica', 'bold');
  doc.text('CONFIDENCE:', margin + 100, y);
  doc.setFont('helvetica', 'normal');
  doc.text(`${diagnosis.confidenceScore}% Validated`, margin + 128, y);
  y += 7;

  doc.setDrawColor(229, 231, 235);
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageWidth - margin, y);
  y += 7;

  // --- 3. Specimen Taxonomy & Classification ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(17, 24, 39);
  doc.text('1. SPECIMEN TAXONOMY & CLASSIFICATION', margin, y);
  y += 5.5;

  const colWidth = (pageWidth - margin * 2) / 3;
  doc.setFillColor(249, 250, 251); // Solid Neutral Gray #F9FAFB
  doc.setDrawColor(229, 231, 235);
  doc.rect(margin, y, pageWidth - margin * 2, 16, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(107, 114, 128);
  doc.text('COMMON NAME', margin + 4, y + 5);
  doc.text('SCIENTIFIC BOTANICAL NAME', margin + colWidth + 4, y + 5);
  doc.text('ORGAN / TISSUE', margin + colWidth * 2 + 4, y + 5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(17, 24, 39);
  doc.text(diagnosis.plantName || 'Unspecified Specimen', margin + 4, y + 11.5);
  doc.setFont('helvetica', 'italic');
  doc.text(diagnosis.scientificName || 'Botanical classification unavailable', margin + colWidth + 4, y + 11.5);
  doc.setFont('helvetica', 'normal');
  doc.text((diagnosis.affectedParts || ['Foliage']).join(', '), margin + colWidth * 2 + 4, y + 11.5);
  y += 22;

  // --- 4. Diagnostic Assessment & Clinical Pathology ---
  checkPageBreak(35);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(17, 24, 39);
  doc.text('2. DIAGNOSTIC ASSESSMENT & PATHOLOGICAL FINDINGS', margin, y);
  y += 5.5;

  // Summary box
  doc.setFillColor(249, 250, 251);
  doc.setDrawColor(229, 231, 235);
  doc.rect(margin, y, pageWidth - margin * 2, 14, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(107, 114, 128);
  doc.text('PRIMARY PATHOLOGY', margin + 4, y + 4.5);
  doc.text('PATHOGEN ETIOLOGY', margin + 90, y + 4.5);
  doc.text('SEVERITY LEVEL', margin + 135, y + 4.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(17, 24, 39);
  doc.text(diagnosis.primaryDiagnosis || 'Healthy Foliage', margin + 4, y + 10);
  doc.text((diagnosis.pathogenType || 'None').toUpperCase(), margin + 90, y + 10);
  doc.text((diagnosis.severity || 'Normal').toUpperCase(), margin + 135, y + 10);
  y += 19;

  // Pathology Description Text
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(55, 65, 81);
  doc.text('Clinical Summary:', margin, y);
  y += 4.5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(55, 65, 81);
  const splitSummary = doc.splitTextToSize(diagnosis.summary || 'No pathological anomalies detected.', pageWidth - margin * 2);
  doc.text(splitSummary, margin, y);
  y += splitSummary.length * 4.2 + 4;

  // Visual Symptoms & Biomarkers
  if (diagnosis.visualSymptoms && diagnosis.visualSymptoms.length > 0) {
    checkPageBreak(25);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text('Observed Clinical Biomarkers:', margin, y);
    y += 4.5;

    doc.setFont('helvetica', 'normal');
    diagnosis.visualSymptoms.forEach((symp) => {
      checkPageBreak(5);
      doc.text(`•  ${symp}`, margin + 3, y);
      y += 4.2;
    });
    y += 3;
  }

  // Etiological Causes
  if (diagnosis.causes && diagnosis.causes.length > 0) {
    checkPageBreak(20);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text('Etiological Vector / Contributing Environmental Factors:', margin, y);
    y += 4.5;

    doc.setFont('helvetica', 'normal');
    diagnosis.causes.forEach((cause) => {
      checkPageBreak(5);
      doc.text(`•  ${cause}`, margin + 3, y);
      y += 4.2;
    });
    y += 4;
  }

  // --- 5. Clinical Treatment Protocols ---
  checkPageBreak(40);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(17, 24, 39);
  doc.text('3. REMEDIAL & THERAPEUTIC PROTOCOLS', margin, y);
  y += 5.5;

  // Cultural / Organic Treatments
  if (diagnosis.organicTreatments && diagnosis.organicTreatments.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(31, 41, 55);
    doc.text('A. Non-Chemical / Cultural Interventions', margin, y);
    y += 5;

    diagnosis.organicTreatments.forEach((treat, idx) => {
      checkPageBreak(25);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(17, 24, 39);
      doc.text(`${idx + 1}. ${treat.title}`, margin + 2, y);
      if (treat.timeline) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(107, 114, 128);
        doc.text(`Application Timeline: ${treat.timeline}`, margin + 85, y);
      }
      y += 4.2;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(55, 65, 81);
      const splitInstr = doc.splitTextToSize(treat.instructions, pageWidth - margin * 2 - 4);
      doc.text(splitInstr, margin + 4, y);
      y += splitInstr.length * 4 + 2;

      if (treat.materials && treat.materials.length > 0) {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(7.5);
        doc.setTextColor(107, 114, 128);
        doc.text(`Required Materials: ${treat.materials.join(', ')}`, margin + 4, y);
        y += 4;
      }
      y += 2;
    });
  }

  // Chemical Interventions
  if (diagnosis.chemicalTreatments && diagnosis.chemicalTreatments.length > 0) {
    checkPageBreak(30);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(31, 41, 55);
    doc.text('B. Chemical Interventions & Active Formulations', margin, y);
    y += 5;

    diagnosis.chemicalTreatments.forEach((chem, idx) => {
      checkPageBreak(25);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(17, 24, 39);
      doc.text(`${idx + 1}. ${chem.title}`, margin + 2, y);
      if (chem.activeIngredients && chem.activeIngredients.length > 0) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(107, 114, 128);
        doc.text(`Active Ingredient: ${chem.activeIngredients.join(', ')}`, margin + 85, y);
      }
      y += 4.2;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(55, 65, 81);
      const splitChem = doc.splitTextToSize(chem.instructions, pageWidth - margin * 2 - 4);
      doc.text(splitChem, margin + 4, y);
      y += splitChem.length * 4 + 2;

      if (chem.safetyPrecautions) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(153, 27, 27); // Dark red #991b1b
        const splitSafe = doc.splitTextToSize(`Safety Precaution: ${chem.safetyPrecautions}`, pageWidth - margin * 2 - 4);
        doc.text(splitSafe, margin + 4, y);
        y += splitSafe.length * 3.8 + 2;
      }
      y += 2;
    });
  }

  // --- 6. Good Agricultural Practices (GAP) & Long-Term Prevention ---
  if (diagnosis.preventionTips && diagnosis.preventionTips.length > 0) {
    checkPageBreak(35);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(17, 24, 39);
    doc.text('4. GOOD AGRICULTURAL PRACTICES (GAP) & PREVENTATIVE MEASURES', margin, y);
    y += 5.5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(55, 65, 81);

    diagnosis.preventionTips.forEach((tip, idx) => {
      checkPageBreak(10);
      const splitTip = doc.splitTextToSize(`${idx + 1}.  ${tip}`, pageWidth - margin * 2 - 4);
      doc.text(splitTip, margin + 2, y);
      y += splitTip.length * 4 + 1.5;
    });
    y += 5;
  }

  // --- 7. Institutional Document Disclaimer & Sign-off ---
  checkPageBreak(25);
  doc.setDrawColor(209, 213, 219);
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageWidth - margin, y);
  y += 5;

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.5);
  doc.setTextColor(107, 114, 128);
  doc.text(
    'Notice: This clinical report was compiled automatically using multimodal computer vision analysis. Agricultural practitioners should perform confirmatory laboratory microscopy or cultural plating where large-scale crop quarantine or commercial pesticide application is required.',
    margin,
    y,
    { maxWidth: pageWidth - margin * 2 }
  );

  // Save the formal PDF
  const filename = `Plant_Vision_Report_${diagnosis.plantName.replace(/[^a-z0-9]/gi, '_')}_${reportId.substring(0, 8)}.pdf`;
  doc.save(filename);
}
