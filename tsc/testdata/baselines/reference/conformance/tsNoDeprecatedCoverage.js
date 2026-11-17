//// [tests/cases/conformance/lint/rules/no-deprecated/tsNoDeprecatedCoverage.ts] ////

//// [input.ts]
/** @deprecated */
const legacyValue = 1;
/** @deprecated Use currentValue. */
const oldValue = 2;
const currentValue = 3;

legacyValue;
oldValue;
currentValue;

/** @deprecated */
const unusedLegacyValue = 4;
const documentation = "/** @deprecated */";
documentation;

//// [input.ts]
/** @deprecated */
const legacyValue = 1;
/** @deprecated Use currentValue. */
const oldValue = 2;
const currentValue = 3;

legacyValue;
oldValue;
currentValue;

/** @deprecated */
const unusedLegacyValue = 4;
const documentation = "/** @deprecated */";
documentation;
