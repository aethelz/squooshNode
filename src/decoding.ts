import { SupportedFormats, ImageData } from './types/types';
import { getSizeDifference } from './utils';
import fetch, { Response } from 'node-fetch';

import { compress as compressPNG } from './codecs/oxipng/encoder';
import {
  defaultOptions as oxiDefaultOptions,
  mimeType as pngMimeType,
} from './codecs/oxipng/encoder-meta';
import {
  defaultOptions as webpDefaultOptions,
  mimeType as webpMimeType,
} from './codecs/webp/encoder-meta';

import { decodePNG, encodePNG } from './codecs/png/decoder';

import { process } from './codecs/imagequant/processor';
import { defaultOptions as quantDefaultOptions } from './codecs/imagequant/processor-meta';

import { encode as encodeWEPB } from './codecs/webp/encoder';

export type DecodingError = {
  status: number;
  reason: string;
};
export type DecodingSuccess = { imageBuffer: ArrayBuffer; mimeType: string };
export type DecodingResult = DecodingError | DecodingSuccess;

export type Arguments = {
  url: string;
  format: SupportedFormats;

  fast?: boolean;
  lossless?: boolean;
  quality?: number;
  colors?: number;
  dither?: number;
};
export async function decoding({
  url,
  format,
  fast = false,
  lossless = false,
  quality = 75,
  colors = 256,
  dither = 1.0,
}: Arguments): Promise<DecodingResult> {
  if (!['png', 'webp'].includes(format)) {
    return {
      status: 400,
      reason: 'Unsupported output format',
    };
  }
  const isWEBP = format === 'webp';

  let response: Response;
  try {
    console.time('FETCHING');
    response = await fetch(url);
    if (!response.ok) {
      return {
        status: 404,
        reason: `Image fetch failed: ${response.status}`,
      };
    }
    const contentType = response.headers.get('content-type');
    if (contentType !== pngMimeType) {
      return {
        status: 400,
        reason: 'Provided URL is not a png image',
      };
    }
  } catch (e) {
    console.dir(e, null);
    return {
      status: 404,
      reason: 'Network failure when fetching image',
    };
  } finally {
    console.timeEnd('FETCHING');
  }

  let arrBuf: ArrayBuffer;
  let decodedImage: ImageData;
  try {
    console.time('DECODING');
    arrBuf = await response.arrayBuffer();
    decodedImage = await decodePNG(arrBuf);
  } catch (e) {
    return {
      status: 406,
      reason: `Error ${e} when getting image data`,
    };
  } finally {
    console.timeEnd('DECODING');
  }

  let quantized: ImageData;
  try {
    console.time('QUANTIZING');
    quantized =
      colors || dither
        ? await process(decodedImage, {
            ...quantDefaultOptions,
            maxNumColors: Number(colors) || 256,
            dither: Number(dither) || 1,
          })
        : decodedImage;
  } catch (e) {
    return {
      status: 406,
      reason: `Error ${e} when decoding image data`,
    };
  } finally {
    console.timeEnd('QUANTIZING');
  }

  let rawEncodedImage: ArrayBuffer;
  let result: ArrayBuffer;
  try {
    console.time('ENCODING');
    rawEncodedImage = isWEBP
      ? await encodeWEPB(quantized, {
          ...webpDefaultOptions,
          quality: Number(quality) || 75,
          lossless: Number(typeof lossless === 'string') || 0,
        })
      : await encodePNG(quantized);
    console.timeEnd('ENCODING');

    console.time('POSTPROCESSING');
    result =
      !isWEBP && typeof fast !== 'string'
        ? await compressPNG(rawEncodedImage, oxiDefaultOptions)
        : rawEncodedImage;
  } catch (e) {
    return {
      status: 406,
      reason: `Error ${e} when encoding image`,
    };
  } finally {
    console.timeEnd('POSTPROCESSING');
  }

  const imageBuffer = result;

  console.log(
    `${getSizeDifference(
      arrBuf.byteLength,
      imageBuffer.byteLength,
    )}! Original: ${arrBuf.byteLength}, Encoded: ${imageBuffer.byteLength}`,
  );

  return { imageBuffer, mimeType: isWEBP ? webpMimeType : pngMimeType };
}
