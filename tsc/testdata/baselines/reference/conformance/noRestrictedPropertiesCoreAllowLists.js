//// [tests/cases/conformance/lint/rules/no-restricted-properties/noRestrictedPropertiesCoreAllowLists.ts] ////

//// [input.ts]
allowed.bar;
other.bar;
const {bar} = allowed;
const {bar: value} = other;
limited.good;
limited.bad;

//// [input.ts]
allowed.bar;
other.bar;
const {bar} = allowed;
const {bar: value} = other;
limited.good;
limited.bad;
