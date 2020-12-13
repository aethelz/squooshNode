import webp_enc, { WebPModule } from '../../../codecs/webp/enc/webp_enc';
import { EncodeOptions } from './encoder-meta';
import { initEmscriptenModule } from '../util';

const wasmUrl = 'codecs/webp/enc/webp_enc.wasm';

let emscriptenModule: Promise<WebPModule>;

export async function encode(
  data: ImageData,
  options: EncodeOptions,
): Promise<ArrayBuffer> {
  if (!emscriptenModule)
  // @ts-ignore
    emscriptenModule = initEmscriptenModule(webp_enc, wasmUrl);

  const module = await emscriptenModule;
  const result = module.encode(data.data, data.width, data.height, options);
  if (!result) {
    throw new Error('Encoding error.');
  }
  // wasm can't run on SharedArrayBuffers, so we hard-cast to ArrayBuffer.
  return result.buffer as ArrayBuffer;
}
