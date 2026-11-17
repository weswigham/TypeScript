//// [tests/cases/conformance/lint/rules/default-param-last/defaultParamLastCore.ts] ////

//// [input.ts]
function invalid(first = 1, second: number) {}
function optional(first?: number, second: number) {}
function valid(first = 1, ...rest: number[]) {}

//// [input.ts]
function invalid(first = 1, second: number) {}
function optional(first?: number, second: number) {}
function valid(first = 1, ...rest: number[]) {}
