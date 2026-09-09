declare module 'html2pdf.js' {
  interface Html2PdfOptions {
    margin?: number | [number, number, number, number];
    filename?: string;
    image?: { type: 'jpeg' | 'png' | 'webp'; quality: number };
    html2canvas?: { scale?: number; useCORS?: boolean; backgroundColor?: string };
    jsPDF?: { unit?: string; format?: string; orientation?: 'portrait' | 'landscape' };
    pagebreak?: { mode?: Array<'avoid-all' | 'css' | 'legacy'> };
  }
  interface Html2PdfWorker { set(options: Html2PdfOptions): Html2PdfWorker; from(element: HTMLElement): Html2PdfWorker; save(): Promise<void>; }
  export default function html2pdf(): Html2PdfWorker;
}
