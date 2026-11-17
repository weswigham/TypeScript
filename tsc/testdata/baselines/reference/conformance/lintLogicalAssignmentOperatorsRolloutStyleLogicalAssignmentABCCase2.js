//// [tests/cases/conformance/lint/rules/logical-assignment-operators/lintLogicalAssignmentOperatorsRolloutStyleLogicalAssignmentABCCase2.ts] ////

//// [input.ts]
a &&= b || c

//// [input.ts]
a = a && (b || c)
