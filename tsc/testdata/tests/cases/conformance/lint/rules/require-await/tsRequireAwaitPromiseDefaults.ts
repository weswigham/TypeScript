// @target: esnext
// @strict: true
// @lintOnly: true
// @fix: true
// @filename: tsconfig.json
{
	"lint": { "rules": { "@typescript-eslint/require-await": "error" } }
}
// @filename: input.ts
async function plain(): Promise<number> { return 1; }
async function promised() { return Promise.resolve(1); }
async function empty() {}
async function* plainGenerator() { yield 1; }
async function* promisedGenerator() { yield Promise.resolve(1); }
async function nested() { async function inner() { await 1; } }
export {};