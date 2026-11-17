// @lintOnly: true
// @fix: true
// @filename: tsconfig.json
{
    "compilerOptions": { "target": "esnext" },
    "lint": { "rules": { "id-length": ["error", { "min": 2, "max": 10, "exceptions": ["i"], "exceptionPatterns": ["^_"] }] } },
    "files": ["input.ts"]
}
// @filename: input.ts
let a = 1;
let i = 0;
let _x = 1;
function inspect(b: number) { return b; }
const object = { c: 1, valid: 1 };
object.d = 1;
object.c;
class Example { #e = 1; method() { return this.#e; } }