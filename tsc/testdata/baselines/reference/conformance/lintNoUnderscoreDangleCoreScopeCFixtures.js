//// [tests/cases/conformance/lint/rules/no-underscore-dangle/lintNoUnderscoreDangleCoreScopeCFixtures.ts] ////

//// [input.ts]
let _value = 0;
function named_(_parameter = 0) {
    return _parameter;
}
const { _binding } = source;
object._field;
object[_computed];
object["_literal"];
object.__proto__;
class Example {
    #_private;
    _method() {}
}

//// [input.ts]
let _value = 0;
function named_(_parameter = 0) {
    return _parameter;
}
const { _binding } = source;
object._field;
object[_computed];
object["_literal"];
object.__proto__;
class Example {
    #_private;
    _method() {}
}
