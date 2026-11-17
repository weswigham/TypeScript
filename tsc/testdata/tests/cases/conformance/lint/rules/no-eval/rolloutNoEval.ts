// @target: esnext
// @lintOnly: true
// @fix: true
// @filename: tsconfig.json
{
    "lint": { "rules": { "no-eval": "error" } }
}
// @filename: input.ts
eval("code");
const reference = eval;
window.window["eval"]("code");
function shadowed(eval: Function, window: any) {
    eval("code");
    window.eval("code");
    return eval;
}