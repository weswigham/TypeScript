//// [tests/cases/conformance/lint/rules/logical-assignment-operators/lintLogicalAssignmentOperatorsRolloutStyleLogicalAssignmentBeforeAABAfter.ts] ////

//// [input.ts]
/* before */ a = a || b // after

//// [input.ts]
/* before */ a ||= b // after
