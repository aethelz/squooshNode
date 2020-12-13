import imagequant, {
  QuantizerModule,
} from '../../../codecs/imagequant/imagequant';

import { QuantizeOptions } from './processor-meta';
import { initEmscriptenModule } from '../util';
import type { ImageData } from '../../../src/types/types';

const wasmUrl = 'codecs/imagequant/imagequant.wasm';

let emscriptenModule: Promise<QuantizerModule>;

export async function process(
  data: ImageData,
  opts: QuantizeOptions,
): Promise<ImageData> {
  if (!emscriptenModule)
  // @ts-ignore
    emscriptenModule = initEmscriptenModule(imagequant, wasmUrl);

  const module = await emscriptenModule;
  const result = opts.zx
    ? module.zx_quantize(data.data, data.width, data.height, opts.dither)
    : module.quantize(
        data.data,
        data.width,
        data.height,
        opts.maxNumColors,
        opts.dither,
      );
  return { data: result, width: data.width, height: data.height };
}
