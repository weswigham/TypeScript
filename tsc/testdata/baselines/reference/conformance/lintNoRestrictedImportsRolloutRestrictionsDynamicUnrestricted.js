//// [tests/cases/conformance/lint/rules/no-restricted-imports/lintNoRestrictedImportsRolloutRestrictionsDynamicUnrestricted.ts] ////

//// [input.tsx]
require('pkg'); import('pkg'); type T=import('pkg').T;

//// [input.tsx]
require('pkg'); import('pkg'); type T=import('pkg').T;
