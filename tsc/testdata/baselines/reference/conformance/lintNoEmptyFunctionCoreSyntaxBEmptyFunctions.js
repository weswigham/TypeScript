//// [tests/cases/conformance/lint/rules/no-empty-function/lintNoEmptyFunctionCoreSyntaxBEmptyFunctions.ts] ////

//// [input.ts]
function run() {} const arrow = () => {}; class Item { constructor(public value: number) {} method() {} } function valid() { /* intentional */ }

//// [input.ts]
function run() {} const arrow = () => {}; class Item { constructor(public value: number) {} method() {} } function valid() { /* intentional */ }
