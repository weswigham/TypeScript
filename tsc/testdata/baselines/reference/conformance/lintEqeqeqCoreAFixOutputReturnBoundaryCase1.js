//// [tests/cases/conformance/lint/rules/eqeqeq/lintEqeqeqCoreAFixOutputReturnBoundaryCase1.ts] ////

//// [input.ts]
function check() {
return typeof left /* Keep */ == "string"
}
[0].forEach(work)

//// [input.ts]
function check() {
return typeof left /* Keep */ === "string"
}
[0].forEach(work)
