//// [tests/cases/conformance/lint/rules/no-proto/lintNoProtoStatementRulesProtoDynamic.ts] ////

//// [custom.ts]
export default class Custom {}
//// [input.ts]
value[__proto__]; value['__' + 'proto__']; value[`__proto__${''}`]; ({__proto__: null}); class C { #__proto__; method() { this.#__proto__; } }

//// [input.ts]
value[__proto__]; value['__' + 'proto__']; value[`__proto__${''}`]; ({__proto__: null}); class C { #__proto__; method() { this.#__proto__; } }
