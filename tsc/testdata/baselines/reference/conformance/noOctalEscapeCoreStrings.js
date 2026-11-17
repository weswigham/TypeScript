//// [tests/cases/conformance/lint/rules/no-octal-escape/noOctalEscapeCoreStrings.ts] ////

//// [input.js]
'\01\02';
'\377';
'\378';
'\400';
'\08';
'\0';
'\8';
'\\01';
/([abc]) \1/g;

//// [input.js]
'\01\02';
'\377';
'\378';
'\400';
'\08';
'\0';
'\8';
'\\01';
/([abc]) \1/g;
