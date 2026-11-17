// @lintOnly: true
// @fix: true
// @filename: tsconfig.json
{
    "compilerOptions": { "target": "esnext" },
    "lint": { "rules": { "max-lines-per-function": ["error", { "max": 3, "skipComments": true, "skipBlankLines": true }] } },
    "files": ["input.ts"]
}
// @filename: input.ts
function excessive() {
    work();
    other();
}
function valid() {
    // Comment-only line.

    work();
}
(() => {
    work();
    other();
    last();
})();