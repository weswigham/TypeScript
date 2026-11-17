//// [tests/cases/conformance/lint/rules/id-match/rolloutIdMatch.ts] ////

//// [input.ts]
let forbidden;
let bad_name;
bad_name();
object.bad_name = 1;
const { original_name, key: alias_name, ...rest_name } = source;
class Example { #bad_name; bad_method() {} }
Object.keys(source);

//// [input.ts]
let forbidden;
let bad_name;
bad_name();
object.bad_name = 1;
const { original_name, key: alias_name, ...rest_name } = source;
class Example { #bad_name; bad_method() {} }
Object.keys(source);
