//// [tests/cases/conformance/lint/rules/logical-assignment-operators/lintLogicalAssignmentOperatorsRolloutStyleLogicalAssignmentABCCase1.ts] ////

//// [input.ts]
a ??= b && c

//// [input.ts]
a = a ?? (b && c)
