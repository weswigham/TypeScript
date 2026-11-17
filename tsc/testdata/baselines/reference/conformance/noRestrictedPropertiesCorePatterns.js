//// [tests/cases/conformance/lint/rules/no-restricted-properties/noRestrictedPropertiesCorePatterns.ts] ////

//// [input.ts]
foo.bar;
foo['bar'];
foo?.bar;
foo[dynamic];
other.bar;
const {bar: baz} = foo;
({bar: baz = 1} = foo);
function value({bar} = foo) {}
const {bar: {bad} = {}} = foo;
({bad}) => {};
const [{bad}] = source;
class Example { #bad; bad = 0; method() { this.#bad; this['bad']; } }

//// [input.ts]
foo.bar;
foo['bar'];
foo?.bar;
foo[dynamic];
other.bar;
const {bar: baz} = foo;
({bar: baz = 1} = foo);
function value({bar} = foo) {}
const {bar: {bad} = {}} = foo;
({bad}) => {};
const [{bad}] = source;
class Example { #bad; bad = 0; method() { this.#bad; this['bad']; } }
