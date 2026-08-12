declare module 'qrcode' {
  export interface QRCodeToCanvasOptions {
    scale?: number;
    margin?: number;
    color?: {
      dark?: string;
      light?: string;
    };
    errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
    type?: 'image/png' | 'image/jpeg' | 'image/webp';
    width?: number;
    [key: string]: unknown;
  }

  export interface QRCodeToStringOptions {
    type?: 'terminal' | 'terminal256' | 'svg' | 'utf8';
    width?: number;
    margin?: number;
    color?: {
      dark?: string;
      light?: string;
    };
    errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
    [key: string]: unknown;
  }

  export interface QRCodeToDataURLOptions {
    errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
    type?: 'image/png' | 'image/jpeg' | 'image/webp';
    quality?: number;
    margin?: number;
    color?: {
      dark?: string;
      light?: string;
    };
    width?: number;
    [key: string]: unknown;
  }

  export function toCanvas(
    canvasElement: HTMLCanvasElement,
    text: string,
    options?: QRCodeToCanvasOptions
  ): Promise<void>;

  export function toDataURL(
    text: string,
    options?: QRCodeToDataURLOptions
  ): Promise<string>;

  export function toString(
    text: string,
    options?: QRCodeToStringOptions
  ): Promise<string>;

  export function toFile(
    path: string,
    text: string,
    options?: QRCodeToCanvasOptions
  ): Promise<void>;
}
