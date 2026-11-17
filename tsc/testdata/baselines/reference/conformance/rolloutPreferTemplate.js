//// [tests/cases/conformance/lint/rules/prefer-template/rolloutPreferTemplate.ts] ////

//// [input.ts]
declare const value: number, other: number;
const greeting = "hello " + value + "!";
const numeric = value + other + "px";
const escaped = "${literal}`" + value;
const comments = "prefix" /* keep */ + value;
const unchanged = "a" + "b";

//// [input.ts]
declare const value: number, other: number;
const greeting = `hello ${value}!`;
const numeric = `${value + other}px`;
const escaped = `\${literal}\`${value}`;
const comments = `prefix${value}` /* keep */;
const unchanged = "a" + "b";
