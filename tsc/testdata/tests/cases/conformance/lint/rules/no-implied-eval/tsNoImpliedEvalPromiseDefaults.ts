// @target: esnext
// @strict: true
// @lintOnly: true
// @fix: true
// @filename: tsconfig.json
{
	"lint": { "rules": { "@typescript-eslint/no-implied-eval": "error" } }
}
// @filename: input.ts
setTimeout("text", 0);
declare const handler: any;
setInterval(handler, 0);
setTimeout(() => {}, 0);
new Function("return 1");
function shadowed(setTimeout: (value: string) => void) { setTimeout("text"); }
export {};