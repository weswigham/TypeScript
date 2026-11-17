// @lintOnly: true
// @fix: true

// @filename: tsconfig.json
{
	"compilerOptions": { "target": "esnext", "strict": true },
	"lint": { "rules": { "@typescript-eslint/use-unknown-in-catch-callback-variable": "error" } },
	"files": ["input.ts"]
}

// @filename: input.ts

Promise.resolve().catch(error => {});
Promise.resolve().catch((error: unknown) => {});
Promise.resolve().catch((...errors: [unknown]) => {});
Promise.resolve().then(() => {}, (error: Error) => {});
declare const flag: boolean;
Promise.resolve().catch(flag ? error => {} : error => {});