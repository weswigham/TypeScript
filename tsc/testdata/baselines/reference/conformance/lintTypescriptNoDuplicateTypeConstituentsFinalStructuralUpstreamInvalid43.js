//// [tests/cases/conformance/lint/rules/no-duplicate-type-constituents/lintTypescriptNoDuplicateTypeConstituentsFinalStructuralUpstreamInvalid43.ts] ////

//// [input.ts]

interface ee {
  new (a?: string | undefined): void;
}
      

//// [input.ts]

interface ee {
  new (a?: string  ): void;
}
      
