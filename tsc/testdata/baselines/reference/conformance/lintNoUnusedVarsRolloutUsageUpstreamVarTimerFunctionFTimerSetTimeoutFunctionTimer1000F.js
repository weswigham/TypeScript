//// [tests/cases/conformance/lint/rules/no-unused-vars/lintNoUnusedVarsRolloutUsageUpstreamVarTimerFunctionFTimerSetTimeoutFunctionTimer1000F.ts] ////

//// [globals.d.ts]

//// [input.ts]
var _timer;
function f() {
    _timer = setTimeout(function () {}, _timer ? 100 : 0);
}
f();

//// [input.ts]
var _timer;
function f() {
    _timer = setTimeout(function () {}, _timer ? 100 : 0);
}
f();
