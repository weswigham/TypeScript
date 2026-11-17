//// [tests/cases/conformance/lint/rules/no-restricted-imports/lintNoRestrictedImportsRolloutRestrictionsUpstream40.ts] ////

//// [input.tsx]
import AllowedObject, { AllowedObjectTwo as DisallowedObject } from "foo";

//// [input.tsx]
import AllowedObject, { AllowedObjectTwo as DisallowedObject } from "foo";
