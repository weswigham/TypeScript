//// [tests/cases/conformance/lint/rules/no-inline-comments/lintNoInlineCommentsCoreSyntaxBInlineComments.ts] ////

//// [input.ts]
// standalone
const value = '/*literal*/'; // inline
/* before */ work();
work(); // eslint-disable-line no-alert

//// [input.ts]
// standalone
const value = '/*literal*/'; // inline
/* before */ work();
work(); // eslint-disable-line no-alert
