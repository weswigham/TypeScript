//// [tests/cases/conformance/lint/rules/no-restricted-imports/lintNoRestrictedImportsRolloutRestrictionsUpstream47.ts] ////

//// [input.tsx]
export { 'AllowedObject' as DisallowedObject } from "foo";

//// [input.tsx]
export { 'AllowedObject' as DisallowedObject } from "foo";
