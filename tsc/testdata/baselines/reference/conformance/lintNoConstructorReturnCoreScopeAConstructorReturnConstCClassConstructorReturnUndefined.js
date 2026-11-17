//// [tests/cases/conformance/lint/rules/no-constructor-return/lintNoConstructorReturnCoreScopeAConstructorReturnConstCClassConstructorReturnUndefined.ts] ////

//// [input.ts]
const C = class { constructor() { { return undefined; } } };

//// [input.ts]
const C = class { constructor() { { return undefined; } } };
