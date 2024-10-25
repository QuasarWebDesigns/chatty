declare module 'docx-parser' {
  function parseDocx(
    arrayBuffer: ArrayBuffer,
    callback: (error: Error | null, output: string) => void
  ): void;

  export = {
    parseDocx
  };
}
