//// [tests/cases/conformance/lint/rules/explicit-function-return-type/lintTypescriptExplicitFunctionReturnTypeTypeScriptSyntaxReturnDefaults.ts] ////

//// [input.ts]
function run() {} const callback: () => void = () => {}; const literal = () => 1 as const; class Item { constructor() {} set value(input) {} get value() { return 1; } }

//// [input.ts]
function run() {} const callback: () => void = () => {}; const literal = () => 1 as const; class Item { constructor() {} set value(input) {} get value() { return 1; } }
