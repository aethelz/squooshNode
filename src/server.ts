import Koa from 'koa';
import Router from 'koa-router';
import logger from 'koa-logger';
import koaCash from 'koa-cash';

import type { ServerError } from './types/types';
import type { EncodingSuccess } from './encode';

import { fold, chain } from 'fp-ts/TaskEither';

import { makeLazy, sha1 } from './utils';
import { checkOutputFormat } from './taskUtils';
import { fetchImage } from './fetchImage';
import { getEtag } from './getEtag';
import { decode } from './decode';
import { quantize } from './quantize';
import { encode } from './encode';
import { pipe } from 'fp-ts/lib/pipeable';

const app = new Koa();
const router = new Router();
let cacheStore: Record<string, any> = {};

router.get('/:format/:url(.+)', async (ctx, next) => {
  const isCashed = await ctx.cashed();
  if (isCashed) return;

  const { url, format } = ctx.params;
  const { fast, q, colors, dither, lossless } = ctx.request.query;
  let remoteETag: string;

  const res = pipe(
    checkOutputFormat(format),
    chain(() => fetchImage(url)),
    chain(({ imageBuffer, etag }) => {
      remoteETag = etag;
      return decode(imageBuffer);
    }),
    chain(quantize({ colors, dither })),
    chain(encode({ format, fast, quality: q, lossless })),
  );
  const onError = async ({ status, reason }: ServerError) => {
    ctx.response.status = status;
    ctx.response.body = reason;
  };
  const onSuccess = async ({ imageBuffer, mimeType }: EncodingSuccess) => {
    ctx.body = Buffer.from(imageBuffer);
    ctx.type = mimeType;

    const imageSHA = sha1(new Uint8Array(imageBuffer));

    // Caching layer drops all custom headers so we store a two-part ETag:
    // etag of an original image and sha1 hash of resulting imageBuffer
    // with colon delimeter
    ctx.set('etag', remoteETag + ':' + imageSHA);
  };

  await pipe(res, fold(makeLazy(onError), makeLazy(onSuccess)))();
  await next();
});

// Middlewares
app.use(logger());
app.use(
  koaCash({
    get: async key => {
      console.log('GETTER ENTRY');
      const regex = /http.*/g;
      const strippedURL = key.match(regex);
      if (strippedURL === null) {
        console.error('Missing remote image address in url');
        return;
      }

      const m = await getEtag(strippedURL[0])();
      if (m._tag === 'Left') {
        console.error('Failed to retrieve image headers');
        return;
      }
      const cachedResponse = cacheStore[key];
      if (!cachedResponse) {
        console.error('No cached result found');
        return;
      }
      if (!cachedResponse.etag) {
        console.error('Missing etag in stored entry');
        return;
      }
      const storedETag = cachedResponse.etag.split(':')[0];
      const remoteETag = m.right.etag;
      console.log({ storedETag, remoteETag });

      if (storedETag !== remoteETag) {
        // Invalidate cache entry
        delete cacheStore[key];
        return;
      }

      console.log('Cache hit!');

      return cachedResponse;
    },
    set: (key, value) => {
      cacheStore[key] = value;
      return Promise.resolve();
    },
  }),
);

// Routes
app.use(router.routes()).use(router.allowedMethods());

app.listen(3030, () => {
  console.log('ICDN started');
});
