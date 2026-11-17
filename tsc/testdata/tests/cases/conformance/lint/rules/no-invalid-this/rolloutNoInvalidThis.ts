// @target: esnext
// @lintOnly: true
// @fix: true
// @filename: tsconfig.json
{
    "lint": { "rules": { "no-invalid-this": "error" } }
}
// @filename: input.ts
export {};
this;
function plain() { return this; }
function Constructor() { this.value = 1; }
function explicit(this: object) { return this; }
const object = { method() { return this; } };
class C {
    field = this;
    static { this; }
    [this.key]() { return this; }
}