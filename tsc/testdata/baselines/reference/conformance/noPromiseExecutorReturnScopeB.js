//// [tests/cases/conformance/lint/rules/no-promise-executor-return/noPromiseExecutorReturnScopeB.ts] ////

//// [input.ts]
new Promise(resolve => resolve(1));
new Promise(resolve => void resolve(1));
new Promise(function(resolve) {
    function nested() { return 1; }
    if (ready) return value;
    return;
});
Promise(resolve => resolve(1));
new Promise(first, resolve => resolve(1));
function shadow(Promise) { new Promise(resolve => resolve(1)); }

//// [input.ts]
new Promise(resolve => resolve(1));
new Promise(resolve => void resolve(1));
new Promise(function(resolve) {
    function nested() { return 1; }
    if (ready) return value;
    return;
});
Promise(resolve => resolve(1));
new Promise(first, resolve => resolve(1));
function shadow(Promise) { new Promise(resolve => resolve(1)); }
