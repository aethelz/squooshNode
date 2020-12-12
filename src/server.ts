import Koa from 'koa';
import Router from 'koa-router';

import logger from 'koa-logger';
import { decoding } from './decoding';
import { SupportedFormats } from './types/types';

const app = new Koa();
const router = new Router();

router.get('/:format/:url(.+)', async (ctx, next) => {
  const { fast, q, colors, dither, lossless } = ctx.request.query;

  const { url, format } = ctx.params;

  const res = await decoding({
    url,
    format: format as SupportedFormats,
    dither,
    colors,
    fast,
    quality: q,
    lossless,
  });

  if ('status' in res) {
    const { status, reason } = res;
    ctx.response.status = status;
    ctx.response.body = reason;
  } else {
    const { imageBuffer, mimeType } = res;

    ctx.body = Buffer.from(imageBuffer);
    ctx.type = mimeType;
    await next();
  }
});

// Middlewares
app.use(logger());

// Routes
app.use(router.routes()).use(router.allowedMethods());

app.listen(3030, () => {
  console.log('ICDN started');
});
