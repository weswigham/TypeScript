//// [tests/cases/conformance/lint/rules/max-lines/maxLinesCore.ts] ////

//// [input.ts]
// Comment-only line.
work();

other(); /* Inline comment counts as code. */
last();

//// [input.ts]
// Comment-only line.
work();

other(); /* Inline comment counts as code. */
last();
