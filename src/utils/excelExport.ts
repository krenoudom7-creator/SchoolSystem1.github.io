import ExcelJS from 'exceljs';
import { SCHOOL_LOGO_URL } from './schoolLogo.ts';
import {
  formatKhmerDate,
  getAttendanceStatusBadge,
  getTodayLocalStr,
  KHMER_MONTHS,
  toKhmerNum,
} from './calculations.ts';
import { Student, SchoolClass } from '../types/index.ts';

/**
 * Renders the circular official school logo at an exact 1:1 aspect ratio
 * (preserving the full Khmer Kbach gold outer border) onto an offscreen square canvas
 * and returns a high-DPI PNG base64 string for Excel embedding.
 */
async function getCircularLogoPngBase64(): Promise<string | null> {
  return new Promise((resolve) => {
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          const size = 300;
          const canvas = document.createElement('canvas');
          canvas.width = size;
          canvas.height = size;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(null);
            return;
          }

          const center = size / 2;
          const radius = size / 2 - 4;

          // White circular base with circular clip
          ctx.save();
          ctx.beginPath();
          ctx.arc(center, center, radius, 0, Math.PI * 2);
          ctx.closePath();
          ctx.fillStyle = '#ffffff';
          ctx.fill();
          ctx.clip();

          // SCHOOL_LOGO_URL is a normalized 1:1 circular image; draw it centered inside the circle
          const pad = 4;
          const drawSize = size - pad * 2;
          ctx.drawImage(img, pad, pad, drawSize, drawSize);
          ctx.restore();

          // Crisp outer gold/amber ring border (#d97706)
          ctx.beginPath();
          ctx.arc(center, center, radius, 0, Math.PI * 2);
          ctx.lineWidth = 4;
          ctx.strokeStyle = '#d97706';
          ctx.stroke();

          const dataUrl = canvas.toDataURL('image/png');
          resolve(dataUrl);
        } catch {
          resolve(null);
        }
      };
      img.onerror = () => resolve(null);
      img.src = SCHOOL_LOGO_URL;
    } catch {
      resolve(null);
    }
  });
}

/**
 * Computes the exact 0-based fractional column index so a square logo of `logoWidthPx`
 * sits at the true horizontal midpoint of the printable table (Columns B .. lastColIndex).
 */
function computeExactCenterColOffset(
  sheet: ExcelJS.Worksheet,
  lastColIndex: number,
  logoWidthPx = 82
): number {
  const PX_PER_WIDTH_UNIT = 7.5;
  const colWidthsPx: number[] = [];
  for (let c = 1; c <= lastColIndex; c++) {
    const w = sheet.getColumn(c).width || 10;
    colWidthsPx.push(w * PX_PER_WIDTH_UNIT);
  }

  // Printable content starts at Column B (1-based index 2 -> 0-based index 1)
  const leftMarginPx = colWidthsPx[0] || 0;
  let printableWidthPx = 0;
  for (let i = 1; i < colWidthsPx.length; i++) {
    printableWidthPx += colWidthsPx[i];
  }

  const targetLeftPx = leftMarginPx + (printableWidthPx - logoWidthPx) / 2;

  let accumPx = 0;
  for (let i = 0; i < colWidthsPx.length; i++) {
    const colW = colWidthsPx[i];
    if (accumPx + colW >= targetLeftPx) {
      const frac = colW > 0 ? (targetLeftPx - accumPx) / colW : 0;
      return i + Math.max(0, Math.min(0.99, frac));
    }
    accumPx += colW;
  }

  return 4.2;
}

/**
 * Triggers a browser download for an ExcelJS workbook.
 */
async function downloadWorkbook(workbook: ExcelJS.Workbook, filename: string): Promise<void> {
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const cleanName = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`;
  link.setAttribute('download', cleanName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

const THIN_BORDER_COLOR = { argb: 'FFCBD5E1' }; // slate-300
const CELL_BORDER: Partial<ExcelJS.Borders> = {
  top: { style: 'thin', color: THIN_BORDER_COLOR },
  bottom: { style: 'thin', color: THIN_BORDER_COLOR },
  left: { style: 'thin', color: THIN_BORDER_COLOR },
  right: { style: 'thin', color: THIN_BORDER_COLOR },
};

/**
 * Applies the official MoEYS & Hun Sen Toulsambour Secondary School header,
 * centered school seal logo, horizontal divider, report title, and metadata bar
 * across columns B .. lastColLetter.
 */
async function applyOfficialHeaderAndMetadata(
  workbook: ExcelJS.Workbook,
  sheet: ExcelJS.Worksheet,
  options: {
    lastColIndex: number; // e.g. 9 for Col I (since Col A is margin, B..I = 8 columns)
    leftEndColLetter: string; // e.g. 'D'
    logoColOffset: number; // exact 0-based fractional column index for centered logo
    rightStartColLetter: string; // e.g. 'G'
    lastColLetter: string; // e.g. 'I'
    title: string;
    subtitle?: string;
    metaLeftLabel: string;
    metaLeftValue: string;
    metaCenterLabel: string;
    metaCenterValue: string;
    metaRightLabel: string;
    metaRightValue: string;
    metaLeftEndCol: string;
    metaCenterStartCol: string;
    metaCenterEndCol: string;
    metaRightStartCol: string;
  }
) {
  const {
    lastColIndex,
    leftEndColLetter,
    logoColOffset,
    rightStartColLetter,
    lastColLetter,
    title,
    subtitle = 'ឆ្នាំសិក្សា ២០២៥-២០២៦ · ឆមាសទី ១',
    metaLeftLabel,
    metaLeftValue,
    metaCenterLabel,
    metaCenterValue,
    metaRightLabel,
    metaRightValue,
    metaLeftEndCol,
    metaCenterStartCol,
    metaCenterEndCol,
    metaRightStartCol,
  } = options;

  // Hide default gridlines so it looks like a clean A4 official sheet
  sheet.views = [{ showGridLines: false }];

  // Ensure A4 paper sizing, horizontal centering, and proper margins for printing
  sheet.pageSetup = {
    ...sheet.pageSetup,
    paperSize: 9, // A4
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
    horizontalCentered: true,
    margins: {
      left: 0.35,
      right: 0.35,
      top: 0.4,
      bottom: 0.4,
      header: 0.2,
      footer: 0.2,
    },
  };

  // Column A is a narrow left margin
  sheet.getColumn(1).width = 3;

  // Top spacer row
  sheet.getRow(1).height = 12;

  // Header rows 2..5
  sheet.getRow(2).height = 20;
  sheet.getRow(3).height = 19;
  sheet.getRow(4).height = 19;
  sheet.getRow(5).height = 21;

  // Left MoEYS block
  sheet.mergeCells(`B2:${leftEndColLetter}2`);
  sheet.mergeCells(`B3:${leftEndColLetter}3`);
  sheet.mergeCells(`B4:${leftEndColLetter}4`);
  sheet.mergeCells(`B5:${leftEndColLetter}5`);

  const b2 = sheet.getCell('B2');
  b2.value = 'ក្រសួងអប់រំ យុវជន និងកីឡា';
  b2.font = { name: 'Khmer OS Muol Light', size: 10, bold: true, color: { argb: 'FF0F172A' } };
  b2.alignment = { horizontal: 'left', vertical: 'middle' };

  const b3 = sheet.getCell('B3');
  b3.value = 'មន្ទីរអប់រំ យុវជន និងកីឡា ខេត្តកំពង់ចាម';
  b3.font = { name: 'Khmer OS Battambang', size: 10, color: { argb: 'FF1E293B' } };
  b3.alignment = { horizontal: 'left', vertical: 'middle' };

  const b4 = sheet.getCell('B4');
  b4.value = 'ការិយាល័យអប់រំ ស្រុកស្ទឹងត្រង់';
  b4.font = { name: 'Khmer OS Battambang', size: 10, color: { argb: 'FF1E293B' } };
  b4.alignment = { horizontal: 'left', vertical: 'middle' };

  const b5 = sheet.getCell('B5');
  b5.value = 'អនុវិទ្យាល័យ ហ៊ុន សែន ទួលសំបួរ';
  b5.font = { name: 'Khmer OS Muol Light', size: 10, bold: true, color: { argb: 'FF172554' } };
  b5.alignment = { horizontal: 'left', vertical: 'middle' };

  // Right Kingdom of Cambodia motto block
  sheet.mergeCells(`${rightStartColLetter}2:${lastColLetter}2`);
  sheet.mergeCells(`${rightStartColLetter}3:${lastColLetter}3`);
  sheet.mergeCells(`${rightStartColLetter}4:${lastColLetter}4`);
  sheet.mergeCells(`${rightStartColLetter}5:${lastColLetter}5`);

  const r2 = sheet.getCell(`${rightStartColLetter}2`);
  r2.value = 'ព្រះរាជាណាចក្រកម្ពុជា';
  r2.font = { name: 'Khmer OS Muol Light', size: 10, bold: true, color: { argb: 'FF0F172A' } };
  r2.alignment = { horizontal: 'center', vertical: 'middle' };

  const r3 = sheet.getCell(`${rightStartColLetter}3`);
  r3.value = 'ជាតិ សាសនា ព្រះមហាក្សត្រ';
  r3.font = { name: 'Khmer OS Muol Light', size: 10, bold: true, color: { argb: 'FF0F172A' } };
  r3.alignment = { horizontal: 'center', vertical: 'middle' };

  const r4 = sheet.getCell(`${rightStartColLetter}4`);
  r4.value = '❖ ❖ ❖';
  r4.font = { name: 'Segoe UI Symbol', size: 10, bold: true, color: { argb: 'FFD97706' } };
  r4.alignment = { horizontal: 'center', vertical: 'top' };

  // Embed Official Circular School Logo at the exact horizontal center with locked 1:1 pixel dimensions
  const logoPng = await getCircularLogoPngBase64();
  if (logoPng) {
    const logoSizePx = 82;
    const exactCenterCol = computeExactCenterColOffset(sheet, lastColIndex, logoSizePx) || logoColOffset;
    const imageId = workbook.addImage({
      base64: logoPng,
      extension: 'png',
    });
    sheet.addImage(imageId, {
      tl: { col: exactCenterCol, row: 1.15 } as any,
      ext: { width: logoSizePx, height: logoSizePx },
      editAs: 'absolute',
    });
  }

  // Row 6: Solid dark horizontal divider line
  sheet.getRow(6).height = 10;
  for (let c = 2; c <= lastColIndex; c++) {
    sheet.getRow(6).getCell(c).border = {
      bottom: { style: 'medium', color: { argb: 'FF0F172A' } },
    };
  }

  // Row 7: Spacer
  sheet.getRow(7).height = 12;

  // Row 8: Main Document Title
  sheet.getRow(8).height = 28;
  sheet.mergeCells(`B8:${lastColLetter}8`);
  const titleCell = sheet.getCell('B8');
  titleCell.value = title;
  titleCell.font = {
    name: 'Khmer OS Muol Light',
    size: 13,
    bold: true,
    color: { argb: 'FF172554' },
  };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };

  // Row 9: Academic Year Subtitle
  sheet.getRow(9).height = 19;
  sheet.mergeCells(`B9:${lastColLetter}9`);
  const subCell = sheet.getCell('B9');
  subCell.value = subtitle;
  subCell.font = {
    name: 'Khmer OS Battambang',
    size: 10,
    color: { argb: 'FF475569' },
  };
  subCell.alignment = { horizontal: 'center', vertical: 'middle' };

  // Row 10: Spacer
  sheet.getRow(10).height = 10;

  // Row 11: Metadata Summary Box (Light gray fill + border)
  sheet.getRow(11).height = 28;
  sheet.mergeCells(`B11:${metaLeftEndCol}11`);
  sheet.mergeCells(`${metaCenterStartCol}11:${metaCenterEndCol}11`);
  sheet.mergeCells(`${metaRightStartCol}11:${lastColLetter}11`);

  const metaLeft = sheet.getCell('B11');
  metaLeft.value = {
    richText: [
      {
        text: `${metaLeftLabel} `,
        font: { name: 'Khmer OS Battambang', size: 10, color: { argb: 'FF334155' } },
      },
      {
        text: metaLeftValue,
        font: { name: 'Khmer OS Battambang', size: 10, bold: true, color: { argb: 'FF0F172A' } },
      },
    ],
  };
  metaLeft.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };

  const metaCenter = sheet.getCell(`${metaCenterStartCol}11`);
  metaCenter.value = {
    richText: [
      {
        text: `${metaCenterLabel} `,
        font: { name: 'Khmer OS Battambang', size: 10, color: { argb: 'FF334155' } },
      },
      {
        text: metaCenterValue,
        font: { name: 'Khmer OS Battambang', size: 10, bold: true, color: { argb: 'FF0F172A' } },
      },
    ],
  };
  metaCenter.alignment = { horizontal: 'center', vertical: 'middle' };

  const metaRight = sheet.getCell(`${metaRightStartCol}11`);
  metaRight.value = {
    richText: [
      {
        text: `${metaRightLabel} `,
        font: { name: 'Khmer OS Battambang', size: 10, color: { argb: 'FF334155' } },
      },
      {
        text: metaRightValue,
        font: { name: 'Khmer OS Battambang', size: 10, bold: true, color: { argb: 'FF0F172A' } },
      },
    ],
  };
  metaRight.alignment = { horizontal: 'right', vertical: 'middle' };

  for (let c = 2; c <= lastColIndex; c++) {
    const cell = sheet.getRow(11).getCell(c);
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF8FAFC' },
    };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      left: c === 2 ? { style: 'thin', color: { argb: 'FFE2E8F0' } } : undefined,
      right: c === lastColIndex ? { style: 'thin', color: { argb: 'FFE2E8F0' } } : undefined,
    };
  }

  // Row 12: Spacer before table
  sheet.getRow(12).height = 12;
}

/**
 * Appends the official Teacher & Principal signature block at the bottom of a worksheet.
 */
function appendOfficialSignatures(
  sheet: ExcelJS.Worksheet,
  startRow: number,
  leftEndColLetter: string,
  rightStartColLetter: string,
  lastColLetter: string
) {
  const khmerDateStr = formatKhmerDate(getTodayLocalStr());

  const r1 = startRow + 1;
  const r2 = startRow + 2;
  const r3 = startRow + 3;
  const r4 = startRow + 5;

  sheet.getRow(r1).height = 20;
  sheet.getRow(r2).height = 22;
  sheet.getRow(r3).height = 32;
  sheet.getRow(r4).height = 22;

  sheet.mergeCells(`B${r1}:${leftEndColLetter}${r1}`);
  sheet.mergeCells(`B${r2}:${leftEndColLetter}${r2}`);
  sheet.mergeCells(`B${r3}:${leftEndColLetter}${r3}`);
  sheet.mergeCells(`B${r4}:${leftEndColLetter}${r4}`);

  const left1 = sheet.getCell(`B${r1}`);
  left1.value = 'បានឃើញ និងពិនិត្យត្រឹមត្រូវ';
  left1.font = { name: 'Khmer OS Battambang', size: 10, bold: true, color: { argb: 'FF0F172A' } };
  left1.alignment = { horizontal: 'center', vertical: 'middle' };

  const left2 = sheet.getCell(`B${r2}`);
  left2.value = 'គ្រូទទួលបន្ទុកប្រចាំថ្នាក់';
  left2.font = { name: 'Khmer OS Muol Light', size: 10, bold: true, color: { argb: 'FF0F172A' } };
  left2.alignment = { horizontal: 'center', vertical: 'middle' };

  // Leave left3 and left4 empty for manual teacher signature & name

  sheet.mergeCells(`${rightStartColLetter}${r1}:${lastColLetter}${r1}`);
  sheet.mergeCells(`${rightStartColLetter}${r2}:${lastColLetter}${r2}`);
  sheet.mergeCells(`${rightStartColLetter}${r3}:${lastColLetter}${r3}`);
  sheet.mergeCells(`${rightStartColLetter}${r4}:${lastColLetter}${r4}`);

  const right1 = sheet.getCell(`${rightStartColLetter}${r1}`);
  right1.value = `ទួលសំបួរ, ${khmerDateStr}`;
  right1.font = { name: 'Khmer OS Battambang', size: 10, color: { argb: 'FF475569' } };
  right1.alignment = { horizontal: 'center', vertical: 'middle' };

  const right2 = sheet.getCell(`${rightStartColLetter}${r2}`);
  right2.value = 'នាយកសាលា អនុវិទ្យាល័យទួលសំបួរ';
  right2.font = { name: 'Khmer OS Muol Light', size: 10, bold: true, color: { argb: 'FF172554' } };
  right2.alignment = { horizontal: 'center', vertical: 'middle' };

  // Leave right3 empty for physical stamp & signature

  const right4 = sheet.getCell(`${rightStartColLetter}${r4}`);
  right4.value = 'លាង បេន';
  right4.font = { name: 'Khmer OS Muol Light', size: 10, bold: true, color: { argb: 'FF0F172A' } };
  right4.alignment = { horizontal: 'center', vertical: 'middle' };
}

/**
 * Exports the Official Attendance & Absence Report (.xlsx) matching the exact layout in PrintReportModal.
 */
export async function exportAttendanceReportToExcel(params: {
  reportSubType: 'daily' | 'monthly' | 'yearly_12months' | 'student_history';
  periodTitle: string;
  className: string;
  attendanceRate: number;
  selectedYear?: string;
  studentSummaries: Array<{
    student: Student;
    className: string;
    stats: {
      present: number;
      absentPermission: number;
      absentNoPermission: number;
      late: number;
      attendanceRate: number;
    };
    monthlyAbsences?: Record<string, { excused: number; unexcused: number; total: number }>;
  }>;
  records?: any[];
  filename?: string;
}): Promise<void> {
  const {
    reportSubType,
    periodTitle,
    className,
    attendanceRate,
    selectedYear = '2026',
    studentSummaries,
    records = [],
    filename,
  } = params;

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'អនុវិទ្យាល័យ ហ៊ុន សែន ទួលសំបួរ';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet('របាយការណ៍វត្តមានសិស្ស', {
    pageSetup: { paperSize: 9, orientation: 'portrait', fitToPage: true, fitToWidth: 1 },
  });

  // Set column widths for B..I (8 columns matching screenshot)
  const colWidths = [3, 8, 16, 26, 16, 15, 15, 15, 16];
  colWidths.forEach((w, idx) => {
    sheet.getColumn(idx + 1).width = w;
  });

  await applyOfficialHeaderAndMetadata(workbook, sheet, {
    lastColIndex: 9, // Column I
    leftEndColLetter: 'D',
    logoColOffset: 4.65, // Centered across Columns E & F
    rightStartColLetter: 'G',
    lastColLetter: 'I',
    title: 'របាយការណ៍វត្តមាន និងអវត្តមានសិស្ស',
    metaLeftLabel: 'រយៈពេល/កាលបរិច្ឆេទ៖',
    metaLeftValue: periodTitle,
    metaCenterLabel: 'ថ្នាក់រៀន៖',
    metaCenterValue: className,
    metaRightLabel: 'ភាគរយវត្តមាន៖',
    metaRightValue: `${attendanceRate}%`,
    metaLeftEndCol: 'D',
    metaCenterStartCol: 'E',
    metaCenterEndCol: 'G',
    metaRightStartCol: 'H',
  });

  // Check whether to render the 8-column student summary table (as in screenshot) or daily log
  const useSummaryTable =
    reportSubType === 'monthly' ||
    reportSubType === 'yearly_12months' ||
    records.length === 0;

  let currentRow = 13;

  if (useSummaryTable) {
    const headers = [
      'ល.រ',
      'អត្តលេខ',
      'ឈ្មោះសិស្ស',
      'ថ្នាក់',
      'មានវត្តមាន',
      'មានច្បាប់',
      'ឥតច្បាប់',
      'ភាគរយ (%)',
    ];

    const headerRow = sheet.getRow(currentRow);
    headerRow.height = 28;

    headers.forEach((h, idx) => {
      const cell = headerRow.getCell(idx + 2);
      cell.value = h;
      cell.font = {
        name: 'Khmer OS Battambang',
        size: 10.5,
        bold: true,
        color: { argb: 'FF0F172A' },
      };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF1F5F9' },
      };
      cell.border = CELL_BORDER;
      cell.alignment = {
        horizontal: idx === 1 || idx === 2 ? 'left' : 'center',
        vertical: 'middle',
        indent: idx === 1 || idx === 2 ? 1 : 0,
      };
    });

    currentRow++;

    studentSummaries.forEach((item, idx) => {
      const row = sheet.getRow(currentRow);
      row.height = 25;

      const rateNum = (item.stats?.attendanceRate ?? 100) / 100;
      const values = [
        idx + 1,
        item.student?.studentId || '',
        item.student?.khmerName || '',
        item.className || '',
        item.stats?.present ?? 0,
        item.stats?.absentPermission ?? 0,
        item.stats?.absentNoPermission ?? 0,
        rateNum,
      ];

      values.forEach((val, cIdx) => {
        const cell = row.getCell(cIdx + 2);
        cell.value = val;
        if (cIdx === 7) {
          cell.numFmt = '0%';
        }
        cell.border = CELL_BORDER;

        const isBoldCol = cIdx === 2 || cIdx === 6 || cIdx === 7;
        cell.font = {
          name: cIdx === 1 ? 'Consolas' : 'Khmer OS Battambang',
          size: 10,
          bold: isBoldCol,
          color: { argb: 'FF0F172A' },
        };

        cell.alignment = {
          horizontal: cIdx === 1 || cIdx === 2 ? 'left' : 'center',
          vertical: 'middle',
          indent: cIdx === 1 || cIdx === 2 ? 1 : 0,
        };
      });

      currentRow++;
    });
  } else {
    // Daily / Detailed attendance log table across B..I
    const headers = [
      'ល.រ',
      'អត្តលេខ',
      'ឈ្មោះសិស្ស',
      'ថ្នាក់',
      'កាលបរិច្ឆេទ',
      'ស្ថានភាពវត្តមាន',
      'មូលហេតុនៃការអវត្តមាន',
      'កត់ត្រាដោយ',
    ];

    const headerRow = sheet.getRow(currentRow);
    headerRow.height = 28;
    headers.forEach((h, idx) => {
      const cell = headerRow.getCell(idx + 2);
      cell.value = h;
      cell.font = {
        name: 'Khmer OS Battambang',
        size: 10.5,
        bold: true,
        color: { argb: 'FF0F172A' },
      };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF1F5F9' },
      };
      cell.border = CELL_BORDER;
      cell.alignment = {
        horizontal: idx === 1 || idx === 2 || idx === 6 ? 'left' : 'center',
        vertical: 'middle',
        indent: idx === 1 || idx === 2 || idx === 6 ? 1 : 0,
      };
    });

    currentRow++;

    records.forEach((r: any, idx: number) => {
      const row = sheet.getRow(currentRow);
      row.height = 25;
      const badge = getAttendanceStatusBadge(r.status);

      const values = [
        idx + 1,
        r.studentCode || r.studentId || '',
        r.studentName || '',
        r.className || className,
        r.date || '',
        badge.label,
        r.reason || '—',
        r.recordedByName || 'គ្រូបង្រៀន',
      ];

      values.forEach((val, cIdx) => {
        const cell = row.getCell(cIdx + 2);
        cell.value = val;
        cell.border = CELL_BORDER;
        cell.font = {
          name: 'Khmer OS Battambang',
          size: 10,
          bold: cIdx === 2 || cIdx === 5,
          color: { argb: 'FF0F172A' },
        };
        cell.alignment = {
          horizontal: cIdx === 1 || cIdx === 2 || cIdx === 6 ? 'left' : 'center',
          vertical: 'middle',
          indent: cIdx === 1 || cIdx === 2 || cIdx === 6 ? 1 : 0,
        };
      });

      currentRow++;
    });
  }

  appendOfficialSignatures(sheet, currentRow + 1, 'D', 'G', 'I');

  // If 12-months view or monthly view with monthlyAbsences, also add a second tab with the 12-month breakdown matrix
  if (
    studentSummaries.length > 0 &&
    studentSummaries[0].monthlyAbsences
  ) {
    const matrixSheet = workbook.addWorksheet(`តារាងសរុបទាំង ១២ ខែ (${selectedYear})`, {
      pageSetup: { paperSize: 9, orientation: 'landscape', fitToPage: true, fitToWidth: 1 },
    });
    matrixSheet.views = [{ showGridLines: false }];
    matrixSheet.getColumn(1).width = 3;
    matrixSheet.getColumn(2).width = 7;
    matrixSheet.getColumn(3).width = 14;
    matrixSheet.getColumn(4).width = 24;
    matrixSheet.getColumn(5).width = 14;
    for (let m = 0; m < 12; m++) {
      matrixSheet.getColumn(6 + m).width = 10;
    }
    matrixSheet.getColumn(18).width = 13;
    matrixSheet.getColumn(19).width = 13;
    matrixSheet.getColumn(20).width = 13;

    matrixSheet.getRow(2).height = 26;
    matrixSheet.mergeCells('B2:T2');
    const mTitle = matrixSheet.getCell('B2');
    mTitle.value = `តារាងសរុបអវត្តមានសិស្សគ្រប់ខែទាំង ១២ (មករា ដល់ ធ្នូ ឆ្នាំ ${toKhmerNum(selectedYear)}) · ${className}`;
    mTitle.font = { name: 'Khmer OS Muol Light', size: 12, bold: true, color: { argb: 'FF172554' } };
    mTitle.alignment = { horizontal: 'center', vertical: 'middle' };

    const mHeaders = [
      'ល.រ',
      'អត្តលេខ',
      'ឈ្មោះសិស្ស',
      'ថ្នាក់',
      ...KHMER_MONTHS.map((m) => m.name),
      'ច្បាប់សរុប',
      'ឥតច្បាប់សរុប',
      'សរុបរួម',
    ];
    const hRow = matrixSheet.getRow(4);
    hRow.height = 26;
    mHeaders.forEach((h, idx) => {
      const cell = hRow.getCell(idx + 2);
      cell.value = h;
      cell.font = { name: 'Khmer OS Battambang', size: 10, bold: true, color: { argb: 'FF0F172A' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
      cell.border = CELL_BORDER;
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });

    studentSummaries.forEach((item, idx) => {
      const r = matrixSheet.getRow(5 + idx);
      r.height = 23;
      const monthVals = KHMER_MONTHS.map(
        (m) => item.monthlyAbsences?.[m.value]?.total ?? 0
      );
      const totalAbs =
        (item.stats?.absentPermission ?? 0) + (item.stats?.absentNoPermission ?? 0);
      const rowVals = [
        idx + 1,
        item.student?.studentId || '',
        item.student?.khmerName || '',
        item.className || '',
        ...monthVals,
        item.stats?.absentPermission ?? 0,
        item.stats?.absentNoPermission ?? 0,
        totalAbs,
      ];

      rowVals.forEach((v, cIdx) => {
        const cell = r.getCell(cIdx + 2);
        cell.value = v;
        cell.border = CELL_BORDER;
        cell.font = {
          name: 'Khmer OS Battambang',
          size: 10,
          bold: cIdx === 2 || cIdx >= 16,
          color: { argb: 'FF0F172A' },
        };
        cell.alignment = {
          horizontal: cIdx === 1 || cIdx === 2 ? 'left' : 'center',
          vertical: 'middle',
          indent: cIdx === 1 || cIdx === 2 ? 1 : 0,
        };
      });
    });
  }

  await downloadWorkbook(
    workbook,
    filename || `របាយការណ៍វត្តមានសិស្ស_អនុវិទ្យាល័យទួលសំបួរ_${selectedYear}.xlsx`
  );
}

/**
 * Exports the Official Exam / Grade Ranking Report (.xlsx) with the same MoEYS header & logo.
 */
export async function exportExamReportToExcel(params: {
  examTitle: string;
  className: string;
  roomNumber: string;
  results: Array<{
    rank: number;
    studentId?: string;
    studentCode?: string;
    studentName: string;
    totalScore: number;
    average: number;
    gradeLetter: string;
    remarks: string;
  }>;
  filename?: string;
}): Promise<void> {
  const { examTitle, className, roomNumber, results, filename } = params;

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'អនុវិទ្យាល័យ ហ៊ុន សែន ទួលសំបួរ';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet('ព្រឹត្តិបត្រពិន្ទុសិស្ស', {
    pageSetup: { paperSize: 9, orientation: 'portrait', fitToPage: true, fitToWidth: 1 },
  });

  // Columns B..H (7 columns)
  const colWidths = [3, 13, 15, 26, 15, 15, 13, 28];
  colWidths.forEach((w, idx) => {
    sheet.getColumn(idx + 1).width = w;
  });

  await applyOfficialHeaderAndMetadata(workbook, sheet, {
    lastColIndex: 8, // Column H
    leftEndColLetter: 'D',
    logoColOffset: 4.15, // Centered in Column E
    rightStartColLetter: 'F',
    lastColLetter: 'H',
    title: 'ព្រឹត្តិបត្រពិន្ទុ និងចំណាត់ថ្នាក់សិស្សផ្លូវការ',
    metaLeftLabel: 'សម័យប្រឡង៖',
    metaLeftValue: examTitle || 'ការប្រឡងប្រចាំខែ',
    metaCenterLabel: 'ថ្នាក់រៀន៖',
    metaCenterValue: className || 'គ្រប់ថ្នាក់រៀន',
    metaRightLabel: 'បន្ទប់៖',
    metaRightValue: roomNumber || '១០១',
    metaLeftEndCol: 'D',
    metaCenterStartCol: 'E',
    metaCenterEndCol: 'F',
    metaRightStartCol: 'G',
  });

  const headers = [
    'ចំណាត់ថ្នាក់',
    'អត្តលេខ',
    'ឈ្មោះសិស្ស',
    'ពិន្ទុសរុប',
    'មធ្យមភាគ',
    'និទ្ទេស',
    'ការវាយតម្លៃរបស់ក្រុមប្រឹក្សា',
  ];

  let currentRow = 13;
  const headerRow = sheet.getRow(currentRow);
  headerRow.height = 28;
  headers.forEach((h, idx) => {
    const cell = headerRow.getCell(idx + 2);
    cell.value = h;
    cell.font = {
      name: 'Khmer OS Battambang',
      size: 10.5,
      bold: true,
      color: { argb: 'FF0F172A' },
    };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF1F5F9' },
    };
    cell.border = CELL_BORDER;
    cell.alignment = {
      horizontal: idx === 1 || idx === 2 || idx === 6 ? 'left' : 'center',
      vertical: 'middle',
      indent: idx === 1 || idx === 2 || idx === 6 ? 1 : 0,
    };
  });

  currentRow++;

  results.forEach((res) => {
    const row = sheet.getRow(currentRow);
    row.height = 25;

    const values = [
      `លេខ ${res.rank}`,
      res.studentCode || res.studentId || '',
      res.studentName || '',
      res.totalScore,
      res.average,
      res.gradeLetter,
      res.remarks || '',
    ];

    values.forEach((val, cIdx) => {
      const cell = row.getCell(cIdx + 2);
      cell.value = val;
      cell.border = CELL_BORDER;
      cell.font = {
        name: cIdx === 1 ? 'Consolas' : 'Khmer OS Battambang',
        size: 10,
        bold: cIdx === 0 || cIdx === 2 || cIdx === 4 || cIdx === 5,
        color: { argb: 'FF0F172A' },
      };
      cell.alignment = {
        horizontal: cIdx === 1 || cIdx === 2 || cIdx === 6 ? 'left' : 'center',
        vertical: 'middle',
        indent: cIdx === 1 || cIdx === 2 || cIdx === 6 ? 1 : 0,
      };
    });

    currentRow++;
  });

  appendOfficialSignatures(sheet, currentRow + 1, 'D', 'F', 'H');

  await downloadWorkbook(
    workbook,
    filename || `ព្រឹត្តិបត្រពិន្ទុ_${examTitle || 'សិស្ស'}.xlsx`
  );
}

/**
 * Exports the Official Student Roster (.xlsx) with the same MoEYS header & logo.
 */
export async function exportStudentListToExcel(params: {
  students: Student[];
  classes: SchoolClass[];
  selectedClassName: string;
}): Promise<void> {
  const { students, classes, selectedClassName } = params;

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'អនុវិទ្យាល័យ ហ៊ុន សែន ទួលសំបួរ';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet('បញ្ជីឈ្មោះសិស្ស', {
    pageSetup: { paperSize: 9, orientation: 'landscape', fitToPage: true, fitToWidth: 1 },
  });

  // Columns B..I (8 columns)
  const colWidths = [3, 8, 16, 24, 10, 15, 16, 22, 16];
  colWidths.forEach((w, idx) => {
    sheet.getColumn(idx + 1).width = w;
  });

  await applyOfficialHeaderAndMetadata(workbook, sheet, {
    lastColIndex: 9, // Column I
    leftEndColLetter: 'D',
    logoColOffset: 4.5, // Centered across Columns E & F
    rightStartColLetter: 'G',
    lastColLetter: 'I',
    title: 'បញ្ជីឈ្មោះសិស្សផ្លូវការ',
    metaLeftLabel: 'កាលបរិច្ឆេទ៖',
    metaLeftValue: formatKhmerDate(getTodayLocalStr()),
    metaCenterLabel: 'ថ្នាក់រៀន៖',
    metaCenterValue: selectedClassName,
    metaRightLabel: 'សិស្សសរុប៖',
    metaRightValue: `${students.length} នាក់`,
    metaLeftEndCol: 'D',
    metaCenterStartCol: 'E',
    metaCenterEndCol: 'G',
    metaRightStartCol: 'H',
  });

  const headers = [
    'ល.រ',
    'អត្តលេខ',
    'ឈ្មោះសិស្ស',
    'ភេទ',
    'ថ្ងៃខែឆ្នាំកំណើត',
    'ថ្នាក់',
    'អាណាព្យាបាល',
    'លេខទូរស័ព្ទ',
  ];

  let currentRow = 13;
  const headerRow = sheet.getRow(currentRow);
  headerRow.height = 28;
  headers.forEach((h, idx) => {
    const cell = headerRow.getCell(idx + 2);
    cell.value = h;
    cell.font = {
      name: 'Khmer OS Battambang',
      size: 10.5,
      bold: true,
      color: { argb: 'FF0F172A' },
    };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF1F5F9' },
    };
    cell.border = CELL_BORDER;
    cell.alignment = {
      horizontal: idx === 1 || idx === 2 || idx === 6 ? 'left' : 'center',
      vertical: 'middle',
      indent: idx === 1 || idx === 2 || idx === 6 ? 1 : 0,
    };
  });

  currentRow++;

  students.forEach((s, idx) => {
    const row = sheet.getRow(currentRow);
    row.height = 25;
    const c = classes.find((item) => item.id === s.classId);

    const values = [
      idx + 1,
      s.studentId,
      s.khmerName,
      s.gender,
      s.dob,
      c?.name || '',
      s.parentName ? `${s.parentName} (${s.parentRelationship || ''})` : '—',
      s.parentPhone || s.phone || '—',
    ];

    values.forEach((val, cIdx) => {
      const cell = row.getCell(cIdx + 2);
      cell.value = val;
      cell.border = CELL_BORDER;
      cell.font = {
        name: cIdx === 1 ? 'Consolas' : 'Khmer OS Battambang',
        size: 10,
        bold: cIdx === 2,
        color: { argb: 'FF0F172A' },
      };
      cell.alignment = {
        horizontal: cIdx === 1 || cIdx === 2 || cIdx === 6 ? 'left' : 'center',
        vertical: 'middle',
        indent: cIdx === 1 || cIdx === 2 || cIdx === 6 ? 1 : 0,
      };
    });

    currentRow++;
  });

  appendOfficialSignatures(sheet, currentRow + 1, 'D', 'G', 'I');

  await downloadWorkbook(workbook, 'បញ្ជីឈ្មោះសិស្ស_អនុវិទ្យាល័យទួលសំបួរ.xlsx');
}
