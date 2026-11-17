//// [tests/cases/conformance/lint/rules/object-shorthand/rolloutObjectShorthand.ts] ////

//// [input.ts]
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

//// [input.ts]
export {};
const value = 1;
const object = {
    value,
    value,
    method() {},
    *generator() {},
    async asynchronous() {},
    retained: /* preserve */ function() {},
    __proto__: function() {},
    named: function named() {},
};
