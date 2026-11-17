//// [tests/cases/conformance/lint/rules/no-inline-comments/noInlineCommentsCoreB.ts] ////

//// [input.ts]
// Standalone comment.
const value = '/* not a comment */'; // Inline comment.
/* Before code. */ work();
work(); /* global work */
work(); // eslint-disable-line no-alert
const pattern = /[/*]/;

//// [input.ts]
// Standalone comment.
const value = '/* not a comment */'; // Inline comment.
/* Before code. */ work();
work(); /* global work */
work(); // eslint-disable-line no-alert
const pattern = /[/*]/;
