export type SupportedFormats = 'webp' | 'png';

export type ImageData = {
  data: Uint8ClampedArray;
  width: number;
  height: number;
};
export type ServerError = {
  status: number;
  reason: string;
};
