//// [tests/cases/conformance/lint/rules/func-name-matching/funcNameMatchingCore.ts] ////

//// [input.ts]
const value = function other() {};
const valid = function valid() {};
const anonymous = function() {};
object.member = function different() {};
const properties = { member: function different() {} };
module.exports = function exported() {};
Object.defineProperty(object, "named", { value: function named() {} });

//// [input.ts]
const value = function other() {};
const valid = function valid() {};
const anonymous = function() {};
object.member = function different() {};
const properties = { member: function different() {} };
module.exports = function exported() {};
Object.defineProperty(object, "named", { value: function named() {} });
