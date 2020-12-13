import Koa from 'koa';
import Router from 'koa-router';
import logger from 'koa-logger';

import type { ServerError } from './types/types';
import type { EncodingSuccess } from './encode';

import { fold, chain } from 'fp-ts/TaskEither';

import { makeLazy } from './utils';
import { checkOutputFormat } from './taskUtils';
import { fetchImage } from './fetchImage';
import { decode } from './decode';
import { quantize } from './quantize';
import { encode } from './encode';
import { pipe } from 'fp-ts/lib/pipeable';

const app = new Koa();
const router = new Router();

router.get('/:format/:url(.+)', async (ctx, next) => {
  const { fast, q, colors, dither, lossless } = ctx.request.query;

  const { url, format } = ctx.params;

  const res = pipe(
    checkOutputFormat(format),
    chain(() => fetchImage(url)),
    chain(({ imageBuffer }) => decode(imageBuffer)),
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
  };

  await pipe(res, fold(makeLazy(onError), makeLazy(onSuccess)))();
  await next();
});

// Middlewares
app.use(logger());

// Routes
app.use(router.routes()).use(router.allowedMethods());

app.listen(3030, () => {
  console.log('ICDN started');
});
