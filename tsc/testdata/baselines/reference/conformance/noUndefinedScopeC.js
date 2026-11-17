//// [tests/cases/conformance/lint/rules/no-undefined/noUndefinedScopeC.ts] ////

//// [input.ts]
let value = undefined;
function shadowed(undefined: number) {
    return undefined;
}
const object = { undefined: 0 };
object.undefined;
const shorthand = { undefined };
type Optional = number | undefined;

//// [input.ts]
let value = undefined;
function shadowed(undefined: number) {
    return undefined;
}
const object = { undefined: 0 };
object.undefined;
const shorthand = { undefined };
type Optional = number | undefined;
