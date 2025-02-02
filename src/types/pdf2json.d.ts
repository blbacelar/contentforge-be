declare module 'pdf2json' {
  interface TextElement {
    R: Array<{ T: string }>;
  }

  interface Page {
    Texts: TextElement[];
  }

  interface Output {
    Pages: Page[];
  }

  class Parser {
    constructor();
    on(event: 'pdfParser_dataReady', callback: (data: Output) => void): void;
    on(event: 'pdfParser_dataError', callback: (error: Error) => void): void;
    parseBuffer(buffer: Uint8Array): void;
  }

  export = Parser;
} 