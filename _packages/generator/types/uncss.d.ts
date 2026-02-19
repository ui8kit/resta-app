declare module 'uncss' {
    interface UncssOptions {
      raw?: string;
      ignore?: string[];
      media?: boolean;
      timeout?: number;
      banner?: boolean;
      ignoreSheets?: RegExp[];
    }
  
    function uncss(
      htmlFiles: string[] | string,
      options: UncssOptions,
      callback: (error: Error | null, output: string) => void
    ): void;
  
    export = uncss;
  }