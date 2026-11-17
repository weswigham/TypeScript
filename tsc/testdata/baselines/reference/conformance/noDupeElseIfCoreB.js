//// [tests/cases/conformance/lint/rules/no-dupe-else-if/noDupeElseIfCoreB.ts] ////

//// [input.ts]
if (first) {} else if (second) {} else if (first || second) {}
if (first && second) {} else if (second && first) {}
if (first === 1) {} else if (first === (1)) {}
if (first) {} else if (first || second) {}

//// [input.ts]
if (first) {} else if (second) {} else if (first || second) {}
if (first && second) {} else if (second && first) {}
if (first === 1) {} else if (first === (1)) {}
if (first) {} else if (first || second) {}
