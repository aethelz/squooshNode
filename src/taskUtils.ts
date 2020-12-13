import type { TaskEither } from 'fp-ts/TaskEither';
import { left, right } from 'fp-ts/Either';
import type { ServerError } from './types/types';

export function getSizeDifference(
  newSize: number,
  originalSize: number
): string {
  const delta = originalSize / newSize;
  let comparison = "no size change";
  if (delta > 1) {
    const percent = Math.round((delta - 1) * 100) + "%";
    comparison = `${percent === "0%" ? "slightly" : percent} bigger`;
  } else if (delta < 1) {
    const percent = Math.round((1 - delta) * 100) + "%";
    comparison = `${percent === "0%" ? "slightly" : percent} smaller`;
  } else {
    // No size changes
  }
  return comparison;
}

export function makeLazy<T, U>(
  fn: (a: T) => Promise<U>,
): (arg: T) => () => Promise<U> {
  return arg => () => fn(arg);
}

export const checkOutputFormat: (format: string) => TaskEither<
  ServerError,
  true
> = format => async() => {

  if (!['png', 'webp'].includes(format)) {
    return left({
      status: 400,
      reason: 'Unsupported output format',
    });
  }
  return right(true);
 };
