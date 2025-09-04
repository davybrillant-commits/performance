declare module 'file-saver' {
  export function saveAs(blob: Blob | File, filename?: string): void;
  export function saveAs(url: string, filename?: string): void;
}