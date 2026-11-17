//// [tests/cases/conformance/lint/rules/no-unnecessary-type-constraint/tsNoUnnecessaryTypeConstraintCoverage.ts] ////

//// [input.ts]
export {};
function unnecessary<T extends any>() {}
class Unnecessary<T extends unknown> {}
const unnecessaryArrow = <T extends unknown>() => {};
function unconstrained<T>() {}
function numberConstraint<T extends number>() {}
function unionConstraint<T extends any | number>() {}
type Alias = any;
function aliasConstraint<T extends Alias>() {}

//// [input.ts]
export {};
function unnecessary<T extends any>() {}
class Unnecessary<T extends unknown> {}
const unnecessaryArrow = <T extends unknown>() => {};
function unconstrained<T>() {}
function numberConstraint<T extends number>() {}
function unionConstraint<T extends any | number>() {}
type Alias = any;
function aliasConstraint<T extends Alias>() {}
