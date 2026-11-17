//// [tests/cases/conformance/lint/rules/no-dupe-keys/noDupeKeysCoreB.ts] ////

//// [input.ts]
const object = {
    value: 1, ['value']: 2,
    get pair() { return 1; }, set pair(value) {}, get pair() { return 2; },
    __proto__: null, ['__proto__']: 1,
    0x10: 1, 16: 2,
    nested: { value: 1 }
};
({ value: first, value: second } = object);

//// [input.ts]
const object = {
    value: 1, ['value']: 2,
    get pair() { return 1; }, set pair(value) {}, get pair() { return 2; },
    __proto__: null, ['__proto__']: 1,
    0x10: 1, 16: 2,
    nested: { value: 1 }
};
({ value: first, value: second } = object);
