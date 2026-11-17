//// [tests/cases/conformance/lint/rules/logical-assignment-operators/lintLogicalAssignmentOperatorsRolloutStyleLogicalAssignmentAA0BC.ts] ////

//// [input.ts]
a || (a = 0) ? b : c

//// [input.ts]
(a ||= 0) ? b : c
