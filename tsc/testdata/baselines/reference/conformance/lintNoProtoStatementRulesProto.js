//// [tests/cases/conformance/lint/rules/no-proto/lintNoProtoStatementRulesProto.ts] ////

//// [custom.ts]
export default class Custom {}
//// [input.ts]
value.__proto__; value['__proto__']; value[`__proto__`]; value?.__proto__;

//// [input.ts]
value.__proto__; value['__proto__']; value[`__proto__`]; value?.__proto__;
