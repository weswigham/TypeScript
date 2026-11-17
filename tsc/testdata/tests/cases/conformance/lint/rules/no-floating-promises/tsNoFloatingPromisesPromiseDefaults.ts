// @target: esnext
// @strict: true
// @lintOnly: true
// @fix: true
// @filename: tsconfig.json
{
	"lint": { "rules": { "@typescript-eslint/no-floating-promises": "error" } }
}
// @filename: input.ts
Promise.resolve(1);
void Promise.resolve(1);
Promise.resolve(1).catch(() => {});
Promise.resolve(1).catch(undefined);
[Promise.resolve(1)];
declare const thenable: PromiseLike<number>;
thenable;
export {};