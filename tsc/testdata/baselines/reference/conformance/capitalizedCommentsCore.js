//// [tests/cases/conformance/lint/rules/capitalized-comments/capitalizedCommentsCore.ts] ////

//// [input.ts]
// lowercase
const value = /* lowercase */ 1;
/* Uppercase */
// todo: ignored
// eslint-disable-next-line
// https://example.com
/** @param value The value. */
function inspect(value: number) { return value; }

//// [input.ts]
// lowercase
const value = /* lowercase */ 1;
/* Uppercase */
// todo: ignored
// eslint-disable-next-line
// https://example.com
/** @param value The value. */
function inspect(value: number) { return value; }
