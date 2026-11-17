//// [tests/cases/conformance/lint/rules/no-duplicate-type-constituents/lintTypescriptNoDuplicateTypeConstituentsFinalStructuralUpstreamInvalid41.ts] ////

//// [input.ts]

declare class bb {
  f(a?: string | undefined): void;
}
      

//// [input.ts]

declare class bb {
  f(a?: string  ): void;
}
      
