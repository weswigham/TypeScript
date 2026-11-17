//// [tests/cases/conformance/lint/rules/logical-assignment-operators/lintLogicalAssignmentOperatorsRolloutStyleLogicalAssignmentIfUndefinedAANullAB.ts] ////

//// [input.ts]
if (undefined === a || a === null) a = b

//// [input.ts]
a ??= b
