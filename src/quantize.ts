import { tryCatch } from 'fp-ts/TaskEither';

import { process } from './codecs/imagequant/processor';
import { defaultOptions as quantDefaultOptions } from './codecs/imagequant/processor-meta';

import type { ServerError } from './types/types';
import type { ReaderTaskEither } from 'fp-ts/ReaderTaskEither';
import type { ImageData } from './types/types';

type Options = {
  colors?: number;
  dither?: number;
};
export const quantize: (
  opts: Options,
) => ReaderTaskEither<
  ImageData,
  ServerError,
  ImageData
> = options => decodedImage =>
  tryCatch(
    () => _quantize(decodedImage, options),
    e => ({
      status: 406,
      reason: `Error ${e} when quantazing image`,
    }),
  );

export async function _quantize(
  decodedImage: ImageData,
  { colors = 256, dither = 1.0 }: Options,
) {
  try {
    console.time('QUANTIZING');
    const quantizedImage =
      colors || dither
        ? await process(decodedImage, {
            ...quantDefaultOptions,
            maxNumColors: Number(colors) || 256,
            dither: Number(dither) || 1,
          })
        : decodedImage;
    return quantizedImage;
  } catch (e) {
    throw e;
  } finally {
    console.timeEnd('QUANTIZING');
  }
}
