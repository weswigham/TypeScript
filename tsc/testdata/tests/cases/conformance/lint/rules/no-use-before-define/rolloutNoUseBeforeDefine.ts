// @target: esnext
// @lintOnly: true
// @fix: true
// @filename: tsconfig.json
{
    "lint": { "rules": { "no-use-before-define": ["error", { "variables": false }] } }
}
// @filename: input.ts
called();
function called() {}
const recursive = () => recursive;
const immediate = (() => immediate)();
class C extends C {}
class D {
    [D]() {}
    static field = later;
    instance = later;
}
let later;
for (let item of item) {}