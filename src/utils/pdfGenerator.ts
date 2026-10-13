import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export interface PDFExportOptions {
  fileName?: string;
  format?: "a4" | "thermal";
  marginMm?: number;
}

/**
 * Downloads an HTML element as a high-quality PDF memo / receipt.
 * Automatically handles rendering, dimensions, high DPI scaling, and file download.
 */
export async function downloadElementAsPDF(
  elementOrId: HTMLElement | string,
  options: PDFExportOptions = {}
): Promise<boolean> {
  const {
    fileName = "Memo.pdf",
    format = "a4",
    marginMm = 8,
  } = options;

  try {
    const targetEl =
      typeof elementOrId === "string"
        ? document.getElementById(elementOrId)
        : elementOrId;

    if (!targetEl) {
      console.error("Target element for PDF export not found:", elementOrId);
      return false;
    }

    // Scroll to top of the element to avoid canvas clipping
    const originalScrollTop = targetEl.scrollTop;
    targetEl.scrollTop = 0;

    // Render using html2canvas with scale: 2 for retina / high-res text
    const canvas = await html2canvas(targetEl, {
      scale: 2.5,
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#ffffff",
      logging: false,
      windowWidth: targetEl.scrollWidth || 800,
    });

    targetEl.scrollTop = originalScrollTop;

    const imgData = canvas.toDataURL("image/png");

    // Paper sizing
    if (format === "thermal") {
      // 80mm roll receipt
      const rollWidthMm = 80;
      const rollHeightMm = Math.max(100, (canvas.height * rollWidthMm) / canvas.width);
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: [rollWidthMm, rollHeightMm],
      });

      pdf.addImage(imgData, "PNG", 0, 0, rollWidthMm, rollHeightMm, undefined, "FAST");
      pdf.save(fileName.endsWith(".pdf") ? fileName : `${fileName}.pdf`);
    } else {
      // Standard A4
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const printableWidth = pageWidth - marginMm * 2;
      const imgHeight = (canvas.height * printableWidth) / canvas.width;

      if (imgHeight <= pageHeight - marginMm * 2) {
        // Fits on single page
        pdf.addImage(imgData, "PNG", marginMm, marginMm, printableWidth, imgHeight, undefined, "FAST");
      } else {
        // Multi-page if tall memo
        let heightLeft = imgHeight;
        let position = marginMm;

        pdf.addImage(imgData, "PNG", marginMm, position, printableWidth, imgHeight, undefined, "FAST");
        heightLeft -= pageHeight;

        while (heightLeft >= 0) {
          position = heightLeft - imgHeight + marginMm;
          pdf.addPage();
          pdf.addImage(imgData, "PNG", marginMm, position, printableWidth, imgHeight, undefined, "FAST");
          heightLeft -= pageHeight;
        }
      }

      pdf.save(fileName.endsWith(".pdf") ? fileName : `${fileName}.pdf`);
    }

    return true;
  } catch (error) {
    console.error("PDF generation error:", error);
    // Fallback: trigger print dialog if canvas fails
    window.print();
    return false;
  }
}
