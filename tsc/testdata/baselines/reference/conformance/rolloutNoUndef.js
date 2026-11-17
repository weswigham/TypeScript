//// [tests/cases/conformance/lint/rules/no-undef/rolloutNoUndef.ts] ////

//// [input.ts]
unknown;
typeof safe;
known.property;
const object = { shorthand };
function parameterDefault(value = body) {
    var body;
    return arguments;
}
try {} catch ({ message }) { message; }
message;

//// [input.ts]
unknown;
typeof safe;
known.property;
const object = { shorthand };
function parameterDefault(value = body) {
    var body;
    return arguments;
}
try {} catch ({ message }) { message; }
message;
