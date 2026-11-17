// @lintOnly: true
// @fix: true
// @filename: tsconfig.json
{
    "compilerOptions": { "target": "esnext" },
    "lint": { "rules": { "no-console": ["error", { "allow": ["warn", "error"] }] } },
    "files": ["input.ts"]
}
// @filename: input.ts
console.log(value);
use(console.info);
console[key]();
console?.log(value);
console.warn(value);
console["error"](value);
function shadow(console: any) { console.log(value); }