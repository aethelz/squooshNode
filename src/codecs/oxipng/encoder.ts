import { optimise } from '../../../codecs/oxipng/pkg/squoosh_oxipng';
import { EncodeOptions } from './encoder-meta';

export function compress(
  data: ArrayBuffer,
  options: EncodeOptions,
): ArrayBuffer {
  return optimise(new Uint8Array(data), options.level).buffer;
}
