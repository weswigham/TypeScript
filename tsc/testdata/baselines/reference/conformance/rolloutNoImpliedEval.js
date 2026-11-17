//// [tests/cases/conformance/lint/rules/no-implied-eval/rolloutNoImpliedEval.ts] ////

//// [input.ts]
setTimeout("code", 1);
const code = "code";
window.setInterval(code, 1);
setTimeout(() => {}, 1);
function shadowed(setTimeout: Function, window: any) {
    setTimeout("code");
    window.setInterval("code");
}

//// [input.ts]
setTimeout("code", 1);
const code = "code";
window.setInterval(code, 1);
setTimeout(() => {}, 1);
function shadowed(setTimeout: Function, window: any) {
    setTimeout("code");
    window.setInterval("code");
}
