export function promisify<TArgs extends unknown[], TResult>(fn: (...args: TArgs) => TResult) {
  return async (...args: TArgs): Promise<TResult> => {
    return fn(...args);
  };
}

const utilShim = { promisify };
export default utilShim;
