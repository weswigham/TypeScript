//// [tests/cases/conformance/lint/rules/logical-assignment-operators/lintLogicalAssignmentOperatorsRolloutStyleLogicalAssignmentIfAABFn.ts] ////

//// [input.ts]
if (a) { a = b } fn();

//// [input.ts]
a &&= b; fn();
