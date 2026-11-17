//// [tests/cases/conformance/lint/rules/radix/lintRadixCoreScopeCReportsParseInt102ParseInt100x10ParseIntArgsNumberParseInt1036NewParseInt.ts] ////

//// [input.ts]
parseInt('10', 2); parseInt('10', +0x10); parseInt(...args); Number?.parseInt('10', 36); new parseInt();

//// [input.ts]
parseInt('10', 2); parseInt('10', +0x10); parseInt(...args); Number?.parseInt('10', 36); new parseInt();
