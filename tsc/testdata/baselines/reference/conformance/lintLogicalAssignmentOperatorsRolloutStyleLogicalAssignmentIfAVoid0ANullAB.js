//// [tests/cases/conformance/lint/rules/logical-assignment-operators/lintLogicalAssignmentOperatorsRolloutStyleLogicalAssignmentIfAVoid0ANullAB.ts] ////

//// [input.ts]
if (a === void 0 || a === null) a = b

//// [input.ts]
a ??= b
