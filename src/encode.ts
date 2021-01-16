import type { SupportedFormats, ImageData } from './types/types';
import type { ServerError } from './types/types';
import type { ReaderTaskEither } from 'fp-ts/ReaderTaskEither';
import { tryCatch } from 'fp-ts/TaskEither';

import { compress as compressPNG } from './codecs/oxipng/encoder';
import {
  defaultOptions as oxiDefaultOptions,
  mimeType as pngMimeType,
} from './codecs/oxipng/encoder-meta';
import {
  defaultOptions as webpDefaultOptions,
  mimeType as webpMimeType,
} from './codecs/webp/encoder-meta';

import { encodePNG } from './codecs/png/decoder';

import { encode as encodeWEPB } from './codecs/webp/encoder';

export type EncodingSuccess = { imageBuffer: ArrayBuffer; mimeType: string };

export type Options = {
  format: SupportedFormats;

  fast?: boolean;
  lossless?: boolean;
  quality?: number;
};

export const encode: (options: Options) => ReaderTaskEither<
  ImageData,
  ServerError,
  EncodingSuccess
> = options => quantizedImage =>
  tryCatch(
    () => _encode(quantizedImage, options),
    e => ({
      status: 406,
      reason: `Error ${e} when encoding image`,
    }),
  );

export async function _encode(
  quantizedImage: ImageData,
  { format, fast = false, lossless = false, quality = 75 }: Options,
): Promise<EncodingSuccess> {
  const isWEBP = format === 'webp';

  let rawEncodedImage: ArrayBuffer;
  let result: ArrayBuffer;
  try {
    console.time('ENCODING');
    rawEncodedImage = isWEBP
      ? await encodeWEPB(quantizedImage, {
          ...webpDefaultOptions,
          method: 5,
          quality: Number(quality) || 75,
          lossless: Number(typeof lossless === 'string') || 0,
        })
      : encodePNG(quantizedImage);
    console.timeEnd('ENCODING');

    console.time('POSTPROCESSING');
    result =
      !isWEBP && typeof fast !== 'string'
        ? compressPNG(rawEncodedImage, oxiDefaultOptions)
        : rawEncodedImage;
  } catch (e) {
    throw e;
  } finally {
    console.timeEnd('POSTPROCESSING');
  }

  const imageBuffer = result;

  return { imageBuffer, mimeType: isWEBP ? webpMimeType : pngMimeType };
}
