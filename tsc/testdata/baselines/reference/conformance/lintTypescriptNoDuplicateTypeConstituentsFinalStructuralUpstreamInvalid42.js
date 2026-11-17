//// [tests/cases/conformance/lint/rules/no-duplicate-type-constituents/lintTypescriptNoDuplicateTypeConstituentsFinalStructuralUpstreamInvalid42.ts] ////

//// [input.ts]

interface ee {
  f(a?: string | undefined): void;
}
      

//// [input.ts]

interface ee {
  f(a?: string  ): void;
}
      
