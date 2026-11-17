// @target: esnext
// @lintOnly: true
// @fix: true
// @filename: tsconfig.json
{
    "lint": { "rules": { "object-shorthand": "error" } }
}
// @filename: input.ts
export {};
const value = 1;
const object = {
    value: value,
    'value': value,
    method: function() {},
    generator: function*() {},
    asynchronous: async function() {},
    retained: /* preserve */ function() {},
    __proto__: function() {},
    named: function named() {},
};