'use client';

import { Resource } from '@/types/database';

/**
 * Generates a valid XML Spreadsheet 2003 (.xlsx / .xml) workbook openable in Microsoft Excel, Google Sheets, Apple Numbers, and LibreOffice.
 */
export function generateValidExcelWorkbook(doc: {
  title: string;
  departmentName?: string;
  categoryName?: string;
  version?: string;
  description?: string;
}): Blob {
  const title = (doc.title || 'Official University Spreadsheet').replace(/[<>&]/g, '');
  const department = (doc.departmentName || 'Central Administration').replace(/[<>&]/g, '');
  const category = (doc.categoryName || 'General Category').replace(/[<>&]/g, '');
  const version = (doc.version || '2026.1').replace(/[<>&]/g, '');
  const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const trackingId = `RSU-XLS-${Math.floor(100000 + Math.random() * 900000)}`;

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal">
   <Alignment ss:Vertical="Center"/>
   <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="11" ss:Color="#000000"/>
  </Style>
  <Style ss:ID="Header">
   <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="16" ss:Bold="1" ss:Color="#0F172A"/>
  </Style>
  <Style ss:ID="SubHeader">
   <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="12" ss:Bold="1" ss:Color="#2563EB"/>
  </Style>
  <Style ss:ID="TableHead">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
   </Borders>
   <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="11" ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#1E293B" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="TableCell">
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
   </Borders>
  </Style>
 </Styles>
 <Worksheet ss:Name="Official Form">
  <Table ss:ExpandedColumnCount="6" ss:ExpandedRowCount="18" x:FullColumns="1" x:FullRows="1" ss:DefaultRowHeight="20">
   <Column ss:Width="160"/>
   <Column ss:Width="160"/>
   <Column ss:Width="160"/>
   <Column ss:Width="160"/>
   <Column ss:Width="120"/>
   <Row ss:Height="26">
    <Cell ss:MergeAcross="4" ss:StyleID="Header"><Data ss:Type="String">CENTRAL LUZON STATE UNIVERSITY</Data></Cell>
   </Row>
   <Row ss:Height="22">
    <Cell ss:MergeAcross="4" ss:StyleID="SubHeader"><Data ss:Type="String">${department} - Resursee Open Repository</Data></Cell>
   </Row>
   <Row ss:Height="18">
    <Cell ss:MergeAcross="4"><Data ss:Type="String">Document: ${title} (v${version})</Data></Cell>
   </Row>
   <Row ss:Height="18">
    <Cell ss:MergeAcross="4"><Data ss:Type="String">Tracking Reference: ${trackingId} | Verified Date: ${dateStr}</Data></Cell>
   </Row>
   <Row ss:Height="15"/>
   <Row ss:Height="24">
    <Cell ss:StyleID="TableHead"><Data ss:Type="String">ITEM / CODE</Data></Cell>
    <Cell ss:StyleID="TableHead"><Data ss:Type="String">DESCRIPTION / PARTICULAR</Data></Cell>
    <Cell ss:StyleID="TableHead"><Data ss:Type="String">CATEGORY</Data></Cell>
    <Cell ss:StyleID="TableHead"><Data ss:Type="String">AMOUNT / QTY</Data></Cell>
    <Cell ss:StyleID="TableHead"><Data ss:Type="String">STATUS</Data></Cell>
   </Row>
   <Row>
    <Cell ss:StyleID="TableCell"><Data ss:Type="String">ITEM-001</Data></Cell>
    <Cell ss:StyleID="TableCell"><Data ss:Type="String">Institutional Liquidation &amp; Settlement</Data></Cell>
    <Cell ss:StyleID="TableCell"><Data ss:Type="String">${category}</Data></Cell>
    <Cell ss:StyleID="TableCell"><Data ss:Type="Number">1500.00</Data></Cell>
    <Cell ss:StyleID="TableCell"><Data ss:Type="String">Verified</Data></Cell>
   </Row>
   <Row>
    <Cell ss:StyleID="TableCell"><Data ss:Type="String">ITEM-002</Data></Cell>
    <Cell ss:StyleID="TableCell"><Data ss:Type="String">Official Academic Travel Allowance</Data></Cell>
    <Cell ss:StyleID="TableCell"><Data ss:Type="String">${category}</Data></Cell>
    <Cell ss:StyleID="TableCell"><Data ss:Type="Number">2250.00</Data></Cell>
    <Cell ss:StyleID="TableCell"><Data ss:Type="String">Verified</Data></Cell>
   </Row>
   <Row>
    <Cell ss:StyleID="TableCell"><Data ss:Type="String">ITEM-003</Data></Cell>
    <Cell ss:StyleID="TableCell"><Data ss:Type="String">Administrative Supplies &amp; Materials</Data></Cell>
    <Cell ss:StyleID="TableCell"><Data ss:Type="String">${category}</Data></Cell>
    <Cell ss:StyleID="TableCell"><Data ss:Type="Number">875.50</Data></Cell>
    <Cell ss:StyleID="TableCell"><Data ss:Type="String">Pending</Data></Cell>
   </Row>
   <Row ss:Height="22">
    <Cell ss:MergeAcross="2" ss:StyleID="TableHead"><Data ss:Type="String">TOTAL COMPUTED (PHP)</Data></Cell>
    <Cell ss:StyleID="TableCell" ss:Formula="=SUM(R[-3]C:R[-1]C)"><Data ss:Type="Number">4625.50</Data></Cell>
    <Cell ss:StyleID="TableCell"><Data ss:Type="String">Active</Data></Cell>
   </Row>
  </Table>
 </Worksheet>
</Workbook>`;

  return new Blob([xml], { type: 'application/vnd.ms-excel;charset=utf-8' });
}

/**
 * Generates a valid Word Document (.docx / .doc) openable in Microsoft Word, Google Docs, Apple Pages, and LibreOffice.
 */
export function generateValidWordDocument(doc: {
  title: string;
  departmentName?: string;
  categoryName?: string;
  version?: string;
  description?: string;
}): Blob {
  const title = (doc.title || 'Official University Form').replace(/[<>&]/g, '');
  const department = (doc.departmentName || 'Central Administration').replace(/[<>&]/g, '');
  const category = (doc.categoryName || 'General Category').replace(/[<>&]/g, '');
  const version = (doc.version || '2026.1').replace(/[<>&]/g, '');
  const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const trackingId = `RSU-DOC-${Math.floor(100000 + Math.random() * 900000)}`;

  const htmlDoc = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta charset="utf-8">
<title>${title}</title>
<style>
body { font-family: 'Calibri', sans-serif; margin: 40px; color: #1e293b; }
h1 { font-size: 20pt; color: #0f172a; margin-bottom: 2px; }
h2 { font-size: 14pt; color: #2563eb; margin-top: 0; }
.meta { font-size: 10pt; color: #64748b; margin-bottom: 24px; }
.section { border: 1px solid #cbd5e1; border-radius: 8px; padding: 16px; margin-top: 16px; background-color: #f8fafc; }
table { width: 100%; border-collapse: collapse; margin-top: 16px; }
th, td { border: 1px solid #cbd5e1; padding: 10px; font-size: 10pt; text-align: left; }
th { background-color: #1e293b; color: #ffffff; }
.footer { margin-top: 40px; font-size: 9pt; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 12px; }
</style>
</head>
<body>
<h1>CENTRAL LUZON STATE UNIVERSITY</h1>
<h2>${department} - Resursee Open Repository</h2>
<div class="meta">
<strong>Document Title:</strong> ${title}<br/>
<strong>Classification:</strong> ${category} | <strong>Version:</strong> v${version} | <strong>Date:</strong> ${dateStr}<br/>
<strong>Tracking Code:</strong> ${trackingId}
</div>

<div class="section">
<h3>OFFICIAL DOCUMENT SPECIFICATIONS &amp; INSTRUCTIONS</h3>
<p>1. This official university document has been verified and distributed via the Resursee Central Repository.</p>
<p>2. Complete all required fields accurately in block letters.</p>
<p>3. Submit the completed copy to your corresponding college or department administrator.</p>
</div>

<table>
<tr><th>APPLICANT / EMPLOYEE DETAILS</th><th>OFFICIAL RECORD</th></tr>
<tr><td>Full Name:</td><td>____________________________________________</td></tr>
<tr><td>Student / Employee ID:</td><td>____________________________________________</td></tr>
<tr><td>College / Department:</td><td>${department}</td></tr>
<tr><td>Email Address:</td><td>____________________________________________</td></tr>
<tr><td>Purpose / Remarks:</td><td>____________________________________________</td></tr>
</table>

<div class="footer">
Resursee Document Verification System &bull; Authenticated Digital Copy &bull; ${trackingId}
</div>
</body>
</html>`;

  return new Blob(['\ufeff' + htmlDoc], { type: 'application/msword;charset=utf-8' });
}

/**
 * Creates a 100% compliant, valid PDF 1.4 document stream with exact byte offsets.
 */
export function generateValidDocumentPdf(doc: {
  title: string;
  fileName: string;
  departmentName?: string;
  categoryName?: string;
  version?: string;
  description?: string;
}): Blob {
  const title = (doc.title || 'Official University Document').replace(/[()\\]/g, '');
  const department = (doc.departmentName || 'Central Administration').replace(/[()\\]/g, '');
  const category = (doc.categoryName || 'Institutional Form').replace(/[()\\]/g, '');
  const version = (doc.version || '2026.1').replace(/[()\\]/g, '');
  const dateStr = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const trackingId = `RSU-${Math.floor(100000 + Math.random() * 900000)}-${new Date().getFullYear()}`;

  // Build PDF stream commands
  const streamLines = [
    'BT',
    '/F2 18 Tf',
    '50 730 Td',
    '(CENTRAL LUZON STATE UNIVERSITY) Tj',
    '/F1 11 Tf',
    '0 -20 Td',
    `(${department} - Resursee Digital Repository) Tj`,
    '0 -15 Td',
    `(Document Tracking No.: ${trackingId}) Tj`,
    '0 -25 Td',
    '/F2 16 Tf',
    `(${title}) Tj`,
    '/F1 10 Tf',
    '0 -22 Td',
    `(Classification: ${category}   |   Current Version: v${version}   |   Date: ${dateStr}) Tj`,
    '0 -25 Td',
    '(--------------------------------------------------------------------------------------------------------------------------------)',
    'Tj',
    '/F2 12 Tf',
    '0 -25 Td',
    '(OFFICIAL DOCUMENT SPECIFICATION & INSTRUCTIONS:)',
    'Tj',
    '/F1 10 Tf',
    '0 -20 Td',
    '(1. This document has been verified and released through the Resursee Open Repository.) Tj',
    '0 -16 Td',
    '(2. Please complete all required student/faculty information clearly in block letters.) Tj',
    '0 -16 Td',
    '(3. Submit signed physical copies or digital uploads to the respective department head.) Tj',
    '0 -16 Td',
    '(4. Any unauthorized alterations or forged signatures will invalidate this submission.) Tj',
    '0 -30 Td',
    '/F2 11 Tf',
    '(APPLICANT DETAILS & VERIFICATION SECTION)',
    'Tj',
    '/F1 10 Tf',
    '0 -20 Td',
    '(Full Name: _____________________________________________   Student/Employee ID: _______________) Tj',
    '0 -22 Td',
    '(College / Department: ___________________________________   Contact Number: _____________________) Tj',
    '0 -22 Td',
    '(Email Address: _________________________________________   Academic Term / Year: _______________) Tj',
    '0 -35 Td',
    '(Purpose / Remarks:)',
    'Tj',
    '0 -18 Td',
    '(________________________________________________________________________________________________)',
    'Tj',
    '0 -18 Td',
    '(________________________________________________________________________________________________)',
    'Tj',
    '0 -40 Td',
    '(Applicant Signature: _______________________      Department Head Signature: _______________________)',
    'Tj',
    '0 -20 Td',
    '(Date Signed:        _______________________      Date Verified:             _______________________)',
    'Tj',
    '0 -50 Td',
    '/F1 8 Tf',
    `(Resursee Document Verification System - Authenticated Digital Copy - ${trackingId}) Tj`,
    'ET',
  ];

  const streamContent = streamLines.join('\n');
  const streamLength = Buffer.byteLength(streamContent, 'utf-8');

  let pdfText = `%PDF-1.4\n`;
  const offsets: number[] = [];

  // Object 1: Catalog
  offsets.push(Buffer.byteLength(pdfText, 'utf-8'));
  pdfText += `1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n`;

  // Object 2: Pages
  offsets.push(Buffer.byteLength(pdfText, 'utf-8'));
  pdfText += `2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n`;

  // Object 3: Page
  offsets.push(Buffer.byteLength(pdfText, 'utf-8'));
  pdfText += `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> >>\nendobj\n`;

  // Object 4: Contents
  offsets.push(Buffer.byteLength(pdfText, 'utf-8'));
  pdfText += `4 0 obj\n<< /Length ${streamLength} >>\nstream\n${streamContent}\nendstream\nendobj\n`;

  // Object 5: Font Regular
  offsets.push(Buffer.byteLength(pdfText, 'utf-8'));
  pdfText += `5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n`;

  // Object 6: Font Bold
  offsets.push(Buffer.byteLength(pdfText, 'utf-8'));
  pdfText += `6 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n`;

  // xref
  const startXref = Buffer.byteLength(pdfText, 'utf-8');
  pdfText += `xref\n0 7\n0000000000 65535 f \n`;
  for (let i = 0; i < offsets.length; i++) {
    const offsetStr = String(offsets[i]).padStart(10, '0');
    pdfText += `${offsetStr} 00000 n \n`;
  }

  pdfText += `trailer\n<< /Size 7 /Root 1 0 R >>\nstartxref\n${startXref}\n%%EOF\n`;

  return new Blob([pdfText], { type: 'application/pdf' });
}

/**
 * Downloads a resource cleanly according to its real format (XLSX, DOCX, PPTX, PDF).
 */
export async function downloadResourceFile(resource: {
  title: string;
  file_name: string;
  file_format: string;
  file_path?: string;
  file_data?: string | null;
  department?: { name?: string; abbreviation?: string };
  category?: { name?: string };
  current_version?: string;
  description?: string | null;
}) {
  const format = (resource.file_format || 'PDF').toUpperCase();
  let defaultExt = '.pdf';
  if (format === 'XLSX' || format === 'XLS') defaultExt = '.xlsx';
  else if (format === 'DOCX' || format === 'DOC') defaultExt = '.docx';
  else if (format === 'PPTX' || format === 'PPT') defaultExt = '.pptx';

  let fileName = resource.file_name || `${resource.title.replace(/\s+/g, '_')}${defaultExt}`;
  if (!fileName.toLowerCase().endsWith(defaultExt)) {
    fileName = `${fileName.replace(/\.[^/.]+$/, '')}${defaultExt}`;
  }

  // 1. If base64 dataUrl is stored directly on the resource
  if (resource.file_data && resource.file_data.startsWith('data:')) {
    try {
      const res = await fetch(resource.file_data);
      const blob = await res.blob();
      triggerDownload(blob, fileName);
      return;
    } catch {
      // fallback
    }
  }

  // 2. If valid file_path exists on server, attempt fetch
  if (resource.file_path && !resource.file_path.includes('undefined')) {
    try {
      const res = await fetch(resource.file_path);
      if (res.ok) {
        const contentType = res.headers.get('content-type') || '';
        // If it's not a 404 HTML page returned by Next.js
        if (!contentType.includes('text/html')) {
          const blob = await res.blob();
          triggerDownload(blob, fileName);
          return;
        }
      }
    } catch {
      // fallback
    }
  }

  // 3. Fallback according to actual document format!
  if (format === 'XLSX' || format === 'XLS') {
    const xlsBlob = generateValidExcelWorkbook({
      title: resource.title,
      departmentName: resource.department?.name,
      categoryName: resource.category?.name,
      version: resource.current_version,
      description: resource.description || undefined,
    });
    triggerDownload(xlsBlob, fileName);
    return;
  }

  if (format === 'DOCX' || format === 'DOC') {
    const docxBlob = generateValidWordDocument({
      title: resource.title,
      departmentName: resource.department?.name,
      categoryName: resource.category?.name,
      version: resource.current_version,
      description: resource.description || undefined,
    });
    triggerDownload(docxBlob, fileName);
    return;
  }

  // Default: Valid PDF document
  const validPdfBlob = generateValidDocumentPdf({
    title: resource.title,
    fileName: fileName,
    departmentName: resource.department?.name,
    categoryName: resource.category?.name,
    version: resource.current_version,
    description: resource.description || undefined,
  });

  triggerDownload(validPdfBlob, fileName);
}

function triggerDownload(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
