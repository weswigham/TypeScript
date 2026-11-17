// @target: esnext
// @strict: true
// @lintOnly: true
// @fix: true
// @filename: tsconfig.json
{
	"lint": { "rules": { "@typescript-eslint/no-misused-promises": "error" } }
}
// @filename: input.ts
if (Promise.resolve(true)) {}
const callback: () => void = async () => {};
[1, 2].filter(async () => true);
[1, 2].forEach(async () => {});
const object = { ...Promise.resolve({ value: 1 }) };
interface Base { run(): void; }
class Derived implements Base { async run() {} }
Promise.resolve().finally(async () => {});
export {};