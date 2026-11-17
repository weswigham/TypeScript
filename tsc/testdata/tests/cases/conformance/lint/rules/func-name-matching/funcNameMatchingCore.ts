// @lintOnly: true
// @fix: true
// @filename: tsconfig.json
{
    "compilerOptions": { "target": "esnext" },
    "lint": { "rules": { "func-name-matching": ["error", "always", { "considerPropertyDescriptor": true }] } },
    "files": ["input.ts"]
}
// @filename: input.ts
const value = function other() {};
const valid = function valid() {};
const anonymous = function() {};
object.member = function different() {};
const properties = { member: function different() {} };
module.exports = function exported() {};
Object.defineProperty(object, "named", { value: function named() {} });