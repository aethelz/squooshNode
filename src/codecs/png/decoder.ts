import { decode, encode } from '../../../codecs/png/pkg/squoosh_png.js';
import { ImageData } from '../../../src/types/types';

export { decode as decodePNG };
export function encodePNG({
  data,
  width,
  height,
}: ImageData): ArrayBuffer {
  return encode(data, width, height).buffer;
}
