//// [tests/cases/conformance/lint/rules/no-implied-eval/tsNoImpliedEvalPromiseDefaults.ts] ////

//// [input.ts]
setTimeout("text", 0);
declare const handler: any;
setInterval(handler, 0);
setTimeout(() => {}, 0);
new Function("return 1");
function shadowed(setTimeout: (value: string) => void) { setTimeout("text"); }
export {};

//// [input.ts]
setTimeout("text", 0);
declare const handler: any;
setInterval(handler, 0);
setTimeout(() => {}, 0);
new Function("return 1");
function shadowed(setTimeout: (value: string) => void) { setTimeout("text"); }
export {};
