//// [tests/cases/conformance/lint/rules/no-warning-comments/noWarningCommentsCore.ts] ////

//// [input.ts]
// TODO: work
/* fixme */
// xxx
// TodoMVC
// any TODO
/** TODO */
const string = "// TODO";
const regex = /[/* TODO */]/;
/* eslint no-warning-comments: [2, { terms: ["todo"] }] */

//// [input.ts]
// TODO: work
/* fixme */
// xxx
// TodoMVC
// any TODO
/** TODO */
const string = "// TODO";
const regex = /[/* TODO */]/;
/* eslint no-warning-comments: [2, { terms: ["todo"] }] */
