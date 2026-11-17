//// [tests/cases/conformance/lint/rules/max-depth/maxDepthCore.ts] ////

//// [input.ts]
if (first) { while (second) { for (;;) { work(); } } }
if (first) {} else if (second) {} else if (third) {}
if (first) { function separate() { if (second) {} } }
class Example { static { if (first) { if (second) { if (third) {} } } } }

//// [input.ts]
if (first) { while (second) { for (;;) { work(); } } }
if (first) {} else if (second) {} else if (third) {}
if (first) { function separate() { if (second) {} } }
class Example { static { if (first) { if (second) { if (third) {} } } } }
