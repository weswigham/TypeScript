//// [tests/cases/conformance/lint/rules/no-lone-blocks/lintNoLoneBlocksCoreScopeBLoneBlocks.ts] ////

//// [input.ts]
{} { var item; } { let scoped; } function run() { { const only = 1; } } switch (value) { case 1: {} case 2: {} work(); }

//// [input.ts]
{} { var item; } { let scoped; } function run() { { const only = 1; } } switch (value) { case 1: {} case 2: {} work(); }
