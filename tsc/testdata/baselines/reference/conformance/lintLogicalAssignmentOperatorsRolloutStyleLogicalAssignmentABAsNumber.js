//// [tests/cases/conformance/lint/rules/logical-assignment-operators/lintLogicalAssignmentOperatorsRolloutStyleLogicalAssignmentABAsNumber.ts] ////

//// [input.ts]
a ||= b as number

//// [input.ts]
a = a || (b as number)
