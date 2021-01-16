import fetch, { Response } from 'node-fetch';

import { mimeType as pngMimeType } from './codecs/oxipng/encoder-meta';

import { makeLazy } from './utils';
import { left, right } from 'fp-ts/Either';
import type { ServerError } from './types/types';
import type { Either } from 'fp-ts/Either';
import type { ReaderTaskEither } from 'fp-ts/ReaderTaskEither';

export type ETagSuccess = {
  etag: string;
};
type FetchingResult = Either<ServerError, ETagSuccess>;

export const getEtag: ReaderTaskEither<
  string,
  ServerError,
  ETagSuccess
> = makeLazy(_getEtag);

// We need to make an unsafe ReaderTaskEither from Promise<FetchingResult>
// to preserve extra information about errors thrown.
// All our code inside is wrapped in try-catch so it is ok to do here
async function _getEtag(url: string): Promise<FetchingResult> {
  let response: Response;

  try {
    console.time('FETCHING');
    response = await fetch(url);
    if (!response.ok) {
      return left({
        status: 404,
        reason: `Image fetch failed: ${response.status}`,
      });
    }
    const contentType = response.headers.get('content-type');
    if (contentType !== pngMimeType) {
      return left({
        status: 400,
        reason: 'Provided URL is not a png image',
      });
    }
  } catch (e) {
    console.dir(e, null);
    return left({
      status: 404,
      reason: 'Network failure when fetching image',
    });
  } finally {
    console.timeEnd('FETCHING');
  }

  const etag = response.headers.get('etag');

  if (etag === null) {
    return left({
      status: 406,
      reason: `No etag on remote image`,
    });
  } else {
    return right({ etag });
  }
}
