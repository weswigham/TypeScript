//// [tests/cases/conformance/lint/rules/no-eval/rolloutNoEval.ts] ////

//// [input.ts]
eval("code");
const reference = eval;
window.window["eval"]("code");
function shadowed(eval: Function, window: any) {
    eval("code");
    window.eval("code");
    return eval;
}

//// [input.ts]
eval("code");
const reference = eval;
window.window["eval"]("code");
function shadowed(eval: Function, window: any) {
    eval("code");
    window.eval("code");
    return eval;
}
