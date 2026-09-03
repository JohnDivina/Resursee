import { jsPDF } from 'jspdf';
import { PlantDiagnosisResult } from '@/types/plantDoctor';

/**
 * Loads an image URL (Blob, HTTP, or Data URI) into a clean base64 data URL with dimensions.
 */
async function loadImageData(url: string): Promise<{ dataUrl: string; width: number; height: number } | null> {
  if (typeof window === 'undefined') return null;

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const natWidth = img.naturalWidth || img.width || 600;
        const natHeight = img.naturalHeight || img.height || 450;
        canvas.width = natWidth;
        canvas.height = natHeight;

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, natWidth, natHeight);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
          resolve({ dataUrl, width: natWidth, height: natHeight });
        } else {
          resolve(null);
        }
      } catch (err) {
        console.warn('Could not export canvas to dataUrl:', err);
        resolve(null);
      }
    };

    img.onerror = () => {
      console.warn('Failed to load image for PDF report:', url);
      resolve(null);
    };

    img.src = url;
  });
}

/**
 * Generates a formal, professional clinical PDF diagnosis report.
 * Strictly avoids "laboratory" claims and embeds the uploaded specimen image cleanly.
 */
export async function generateFormalPlantReport(
  diagnosis: PlantDiagnosisResult,
  imageUrl?: string | null
): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 18;
  let y = margin;

  // Header watermark
  const drawHeaderWatermark = () => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('RESURSEE PLANT VISION • CLINICAL EVALUATION REPORT', margin, 10);
    doc.setDrawColor(220, 220, 220);
    doc.line(margin, 12, pageWidth - margin, 12);
  };

  const checkPageBreak = (neededHeight: number) => {
    if (y + neededHeight > pageHeight - margin) {
      doc.addPage();
      y = margin;
      drawHeaderWatermark();
    }
  };

  // Pre-load image if provided
  let loadedImage: { dataUrl: string; width: number; height: number } | null = null;
  if (imageUrl) {
    try {
      loadedImage = await loadImageData(imageUrl);
    } catch {
      loadedImage = null;
    }
  }

  // --- 1. Document Header (No "laboratory") ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(17, 24, 39); // Charcoal #111827
  doc.text('RESURSEE PLANT VISION', margin, y);
  y += 5.5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(75, 85, 99); // Neutral #4b5563
  doc.text('BOTANICAL PATHOLOGY DIAGNOSTIC REPORT', margin, y);
  y += 6;

  // Header Line
  doc.setDrawColor(17, 24, 39);
  doc.setLineWidth(0.6);
  doc.line(margin, y, pageWidth - margin, y);
  y += 7;

  // --- 2. Metadata Key-Value Header Grid ---
  const reportId = diagnosis.id ? diagnosis.id.toUpperCase() : `DIAG-${Date.now().toString(36).toUpperCase()}`;
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
  doc.text('AI MODEL:', margin, y);
  doc.setFont('helvetica', 'normal');
  doc.text(diagnosis.modelUsed || 'Google Gemini 3.5 Flash Lite', margin + 28, y);

  doc.setFont('helvetica', 'bold');
  doc.text('CONFIDENCE:', margin + 100, y);
  doc.setFont('helvetica', 'normal');
  doc.text(`${diagnosis.confidenceScore}% Validated`, margin + 128, y);
  y += 5;

  doc.setFont('helvetica', 'bold');
  doc.text('EVALUATOR:', margin, y);
  doc.setFont('helvetica', 'normal');
  doc.text('Autonomous Multimodal Vision Pathology Engine', margin + 28, y);

  doc.setFont('helvetica', 'bold');
  doc.text('PROCESSING:', margin + 100, y);
  doc.setFont('helvetica', 'normal');
  doc.text('Real-Time Neural Inference', margin + 128, y);
  y += 7;

  doc.setDrawColor(229, 231, 235);
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageWidth - margin, y);
  y += 7;

  // --- 3. Specimen Classification & Photographic Record ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(17, 24, 39);
  doc.text(
    loadedImage
      ? '1. SPECIMEN TAXONOMY & PHOTOGRAPHIC RECORD'
      : '1. SPECIMEN TAXONOMY & CLASSIFICATION',
    margin,
    y
  );
  y += 5.5;

  if (loadedImage) {
    // 2-Column Layout: Left = Metadata Card, Right = Specimen Image
    const contentWidth = pageWidth - margin * 2;
    const imgWidth = 58;
    const imgHeight = 44;
    const tableWidth = contentWidth - imgWidth - 5;

    // Specimen details card
    doc.setFillColor(249, 250, 251); // Solid Neutral Gray
    doc.setDrawColor(229, 231, 235);
    doc.rect(margin, y, tableWidth, imgHeight, 'FD');

    let subY = y + 5;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(107, 114, 128);
    doc.text('COMMON NAME', margin + 4, subY);
    subY += 4.5;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(17, 24, 39);
    doc.text(diagnosis.plantName || 'Unspecified Specimen', margin + 4, subY);
    subY += 6.5;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(107, 114, 128);
    doc.text('SCIENTIFIC BOTANICAL NAME', margin + 4, subY);
    subY += 4.5;

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.setTextColor(17, 24, 39);
    doc.text(diagnosis.scientificName || 'Botanical classification unavailable', margin + 4, subY);
    subY += 6.5;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(107, 114, 128);
    doc.text('ORGAN / TISSUE EXAMINED', margin + 4, subY);
    subY += 4.5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(17, 24, 39);
    const affectedStr = (diagnosis.affectedParts || ['Foliage tissue']).join(', ');
    doc.text(affectedStr, margin + 4, subY, { maxWidth: tableWidth - 8 });

    // Right Column: Specimen Image
    const imgX = margin + tableWidth + 5;
    doc.setDrawColor(209, 213, 219);
    doc.setFillColor(243, 244, 246);
    doc.rect(imgX, y, imgWidth, imgHeight, 'FD');

    try {
      doc.addImage(loadedImage.dataUrl, 'JPEG', imgX, y, imgWidth, imgHeight, undefined, 'FAST');
    } catch (e) {
      console.warn('Failed to embed image:', e);
    }

    // Image Caption
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(107, 114, 128);
    doc.text('Figure 1: Evaluated Specimen Photo', imgX + 2, y + imgHeight + 4);

    y += imgHeight + 8;
  } else {
    // Single Full-Width 3-Column Table
    const colWidth = (pageWidth - margin * 2) / 3;
    doc.setFillColor(249, 250, 251);
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
  }

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
        doc.setTextColor(153, 27, 27);
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
  const modelName = diagnosis.modelUsed || 'Google Gemini 3.5 Flash Lite';
  doc.text(
    `Notice: This clinical phytosanitary evaluation was generated via multimodal computer vision analysis using ${modelName}. Agricultural practitioners should perform confirmatory testing where large-scale crop quarantine or commercial pesticide application is required.`,
    margin,
    y,
    { maxWidth: pageWidth - margin * 2 }
  );

  // Save the formal PDF
  const safePlant = (diagnosis.plantName || 'Specimen').replace(/[^a-z0-9]/gi, '_');
  const filename = `Plant_Vision_Report_${safePlant}_${reportId.substring(0, 8)}.pdf`;
  doc.save(filename);
}
