//// [tests/cases/conformance/lint/rules/no-duplicate-type-constituents/lintTypescriptNoDuplicateTypeConstituentsFinalStructuralUpstreamInvalid36.ts] ////

//// [input.ts]

interface F {
  (a?: string | undefined): void;
}
      

//// [input.ts]

interface F {
  (a?: string  ): void;
}
      
