//// [tests/cases/conformance/lint/rules/no-lonely-if/noLonelyIfCoreB.ts] ////

//// [input.ts]
if (first) {} else { if (second) {} }
if (first) {} else { /* keep */ if (second) {} }
if (first) {} else { if (second) work() }
[1].forEach(work);
if (first) if (second) {} else { if (third) {} } else {}

//// [input.ts]
if (first) {} else if (second) { }
if (first) {} else { /* keep */ if (second) {} }
if (first) {} else { if (second) work() }
[1].forEach(work);
if (first) if (second) {} else { if (third) {} } else {}
