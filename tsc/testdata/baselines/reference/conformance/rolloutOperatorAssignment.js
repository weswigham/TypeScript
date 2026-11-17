//// [tests/cases/conformance/lint/rules/operator-assignment/rolloutOperatorAssignment.ts] ////

//// [input.ts]
declare let value: number, other: number, object: any, key: any;
value = value + other;
value = other * value;
object[key] = object[key] + other;
object.key = object.key ** other;
value = /* keep */ value + other;

//// [input.ts]
declare let value: number, other: number, object: any, key: any;
value += other;
value = other * value;
object[key] = object[key] + other;
object.key **= other;
value = /* keep */ value + other;
