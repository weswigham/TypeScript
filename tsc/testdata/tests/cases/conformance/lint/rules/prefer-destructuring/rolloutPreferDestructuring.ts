// @target: esnext
// @lintOnly: true
// @fix: true
// @filename: tsconfig.json
{
    "lint": { "rules": { "prefer-destructuring": "error" } }
}
// @filename: input.ts
export {};
const value = source.value;
const first = values[0];
const renamed = source.other;
const commented /* preserve */ = source.commented;
value = source.value;
const optional = source?.optional;
class Private {
    #value: number;
    method() { const value = this.#value; }
}