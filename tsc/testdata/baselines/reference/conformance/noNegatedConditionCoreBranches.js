//// [tests/cases/conformance/lint/rules/no-negated-condition/noNegatedConditionCoreBranches.ts] ////

//// [input.ts]
if (!a) {} else {}
if (a != b) {} else {}
if (a !== b) {} else {}
if (!a) {}
if (!a) {} else if (b) {} else {}
!a ? b : c;
a !== b ? c : d;
a ? b : c;

//// [input.ts]
if (!a) {} else {}
if (a != b) {} else {}
if (a !== b) {} else {}
if (!a) {}
if (!a) {} else if (b) {} else {}
!a ? b : c;
a !== b ? c : d;
a ? b : c;
