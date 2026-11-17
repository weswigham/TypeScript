// @target: esnext
// @lintOnly: true
// @fix: true
// @filename: tsconfig.json
{
    "lint": { "rules": { "no-implied-eval": "error" } }
}
// @filename: input.ts
setTimeout("code", 1);
const code = "code";
window.setInterval(code, 1);
setTimeout(() => {}, 1);
function shadowed(setTimeout: Function, window: any) {
    setTimeout("code");
    window.setInterval("code");
}