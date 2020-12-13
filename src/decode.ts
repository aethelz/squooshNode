import { tryCatch } from 'fp-ts/TaskEither';
import { decodePNG } from './codecs/png/decoder';

import type { ServerError } from './types/types';
import type { ImageData } from './types/types';
import type { ReaderTaskEither } from 'fp-ts/ReaderTaskEither';
import { of } from 'fp-ts/Task';

export const decode: ReaderTaskEither<
  ArrayBuffer,
  ServerError,
  ImageData
> = imageBuffer =>
  tryCatch(
    of(decodePNG(new Uint8Array(imageBuffer))),
    e => ({
      status: 406,
      reason: `Error when getting image data: ${e} `,
    }),
  );
