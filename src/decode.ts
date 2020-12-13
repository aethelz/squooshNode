import { tryCatch } from 'fp-ts/TaskEither';
import { decodePNG } from './codecs/png/decoder';

import type { ServerError } from './types/types';
import type { ImageData } from './types/types';
import type { ReaderTaskEither } from 'fp-ts/ReaderTaskEither';

export const decode: ReaderTaskEither<
  ArrayBuffer,
  ServerError,
  ImageData
> = imageBuffer =>
  tryCatch(
    () => decodePNG(imageBuffer),
    e => ({
      status: 406,
      reason: `Error ${e} when getting image data`,
    }),
  );
