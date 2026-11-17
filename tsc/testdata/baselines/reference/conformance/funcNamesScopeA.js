//// [tests/cases/conformance/lint/rules/func-names/funcNamesScopeA.ts] ////

//// [input.ts]
const inferred = function() {};
object.method = function() {};
use(function() {});
const generator = function*() {};
class Example { field = function() {}; method() {} }
export default function() {}

//// [input.ts]
const inferred = function() {};
object.method = function() {};
use(function() {});
const generator = function*() {};
class Example { field = function() {}; method() {} }
export default function() {}
