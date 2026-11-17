// @lintOnly: true
// @fix: true
// @filename: tsconfig.json
{"compilerOptions":{"strict":true,"target":"esnext","module":"preserve"},"lint":{"rules":{"@typescript-eslint/no-non-null-asserted-nullish-coalescing":"error"}},"files":["input.ts"]}
// @filename: input.ts
export {};
let unassigned: string;
unassigned! ?? "fallback";
declare const object: { text?: string };
object.text! ?? "fallback";
let initialized = "ready";
initialized! ?? "fallback";
object.text ?? "fallback";
initialized ?? "fallback";