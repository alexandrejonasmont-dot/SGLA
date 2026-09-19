import {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  Header,
  HeadingLevel,
  PageNumber,
  Packer,
  Paragraph,
  TextRun,
} from "docx";
import { jsPDF } from "jspdf";

import { fmtDate, safeFileName, todayISO } from "./format";

export interface ExportMeta {
  title: string;
  content: string;
  clientName?: string;
  processLabel?: string;
  organization?: string;
}

const BRAND = "SGLA — Sistema de Gestão de Licenciamento Ambiental";

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

const isHeading = (line: string) =>
  /^[0-9]+\.\s+[A-ZÀ-Ú]/.test(line) ||
  (/^[A-ZÀ-Ú0-9º/()\-.,\s]{6,}$/.test(line) && line === line.toUpperCase());

/* ---------------------------------- DOCX ---------------------------------- */

export async function exportDocx(meta: ExportMeta) {
  const lines = meta.content.replace(/\r/g, "").split("\n");

  const body: Paragraph[] = [
    new Paragraph({
      children: [new TextRun({ text: meta.title, bold: true, size: 32, font: "Arial" })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 120 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: [meta.clientName, meta.processLabel].filter(Boolean).join("  •  "),
          size: 20,
          color: "555555",
          font: "Arial",
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 80 },
      border: {
        bottom: { style: BorderStyle.SINGLE, size: 6, color: "1F6F4A", space: 6 },
      },
    }),
    new Paragraph({ text: "", spacing: { after: 160 } }),
  ];

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (!line.trim()) {
      body.push(new Paragraph({ text: "", spacing: { after: 100 } }));
      continue;
    }
    if (isHeading(line)) {
      body.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [new TextRun({ text: line, bold: true, size: 24, font: "Arial" })],
          spacing: { before: 200, after: 120 },
        }),
      );
      continue;
    }
    body.push(
      new Paragraph({
        children: [new TextRun({ text: line, size: 22, font: "Arial" })],
        alignment: AlignmentType.JUSTIFIED,
        spacing: { after: 120, line: 300 },
      }),
    );
  }

  const doc = new Document({
    creator: meta.organization || BRAND,
    title: meta.title,
    description: BRAND,
    styles: { default: { document: { run: { font: "Arial", size: 22 } } } },
    sections: [
      {
        properties: {
          page: {
            size: { width: 11906, height: 16838 },
            margin: { top: 1134, right: 1134, bottom: 1134, left: 1418 },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: meta.organization || BRAND,
                    size: 16,
                    color: "1F6F4A",
                    bold: true,
                    font: "Arial",
                  }),
                ],
                alignment: AlignmentType.RIGHT,
                border: {
                  bottom: { style: BorderStyle.SINGLE, size: 4, color: "D8D8D8", space: 4 },
                },
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: `Emitido pelo SGLA em ${fmtDate(todayISO())} — página `,
                    size: 16,
                    color: "777777",
                    font: "Arial",
                  }),
                  new TextRun({ children: [PageNumber.CURRENT], size: 16, color: "777777" }),
                ],
              }),
            ],
          }),
        },
        children: body,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  download(blob, `${safeFileName(meta.title)}.docx`);
}

/* ----------------------------------- PDF ---------------------------------- */

export function exportPdf(meta: ExportMeta) {
  const pdf = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = 210;
  const pageH = 297;
  const marginX = 20;
  const contentW = pageW - marginX * 2;
  const bottom = pageH - 22;
  let y = 0;
  let page = 1;

  const green: [number, number, number] = [31, 111, 74];
  const gray: [number, number, number] = [110, 110, 110];

  const drawChrome = () => {
    pdf.setFillColor(...green);
    pdf.rect(0, 0, pageW, 3, "F");
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(8);
    pdf.setTextColor(...green);
    pdf.text((meta.organization || BRAND).slice(0, 70), marginX, 11);
    pdf.setDrawColor(215, 215, 215);
    pdf.line(marginX, 14, pageW - marginX, 14);

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.setTextColor(...gray);
    pdf.text(`Emitido pelo SGLA em ${fmtDate(todayISO())}`, marginX, pageH - 12);
    pdf.text(`Página ${page}`, pageW - marginX, pageH - 12, { align: "right" });
  };

  const newPage = () => {
    pdf.addPage();
    page += 1;
    drawChrome();
    y = 26;
  };

  const ensure = (h: number) => {
    if (y + h > bottom) newPage();
  };

  drawChrome();
  y = 30;

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(15);
  pdf.setTextColor(25, 25, 25);
  for (const l of pdf.splitTextToSize(meta.title, contentW) as string[]) {
    ensure(9);
    pdf.text(l, pageW / 2, y, { align: "center" });
    y += 7.5;
  }

  const sub = [meta.clientName, meta.processLabel].filter(Boolean).join("  •  ");
  if (sub) {
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9.5);
    pdf.setTextColor(...gray);
    for (const l of pdf.splitTextToSize(sub, contentW) as string[]) {
      ensure(6);
      pdf.text(l, pageW / 2, y, { align: "center" });
      y += 5;
    }
  }
  y += 2;
  pdf.setDrawColor(...green);
  pdf.setLineWidth(0.5);
  pdf.line(marginX, y, pageW - marginX, y);
  pdf.setLineWidth(0.2);
  y += 8;

  for (const raw of meta.content.replace(/\r/g, "").split("\n")) {
    const line = raw.trimEnd();
    if (!line.trim()) {
      y += 4;
      continue;
    }
    const heading = isHeading(line);
    pdf.setFont("helvetica", heading ? "bold" : "normal");
    pdf.setFontSize(heading ? 11 : 10.5);
    pdf.setTextColor(heading ? 31 : 35, heading ? 111 : 35, heading ? 74 : 35);
    if (heading) y += 2.5;
    for (const l of pdf.splitTextToSize(line, contentW) as string[]) {
      ensure(7);
      pdf.text(l, marginX, y);
      y += heading ? 6.2 : 5.6;
    }
    if (heading) y += 1.5;
  }

  pdf.save(`${safeFileName(meta.title)}.pdf`);
}

/* ---------------------------- Exportação JSON ----------------------------- */

export function exportJson(name: string, payload: unknown) {
  download(
    new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" }),
    `${safeFileName(name)}.json`,
  );
}
