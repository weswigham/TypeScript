//// [tests/cases/conformance/lint/rules/object-shorthand/lintObjectShorthandRolloutDeclarationsShorthandArrowInnerThis.ts] ////

//// [input.ts]
const o = {f: () => { function g() { this.x; } }};

//// [input.ts]
const o = {f() { function g() { this.x; } }};
