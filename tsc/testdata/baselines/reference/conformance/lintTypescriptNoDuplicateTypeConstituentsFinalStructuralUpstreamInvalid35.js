//// [tests/cases/conformance/lint/rules/no-duplicate-type-constituents/lintTypescriptNoDuplicateTypeConstituentsFinalStructuralUpstreamInvalid35.ts] ////

//// [input.ts]

type T = undefined;
(arg?: T | string) => {};
      

//// [input.ts]

type T = undefined;
(arg?:   string) => {};
      
