//// [tests/cases/conformance/lint/rules/no-multi-assign/lintNoMultiAssignCoreSyntaxBChainedAssignment.ts] ////

//// [input.ts]
let first = second = third = 1; first = second = 1; class Item { value = second = 1; }

//// [input.ts]
let first = second = third = 1; first = second = 1; class Item { value = second = 1; }
