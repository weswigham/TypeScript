//// [tests/cases/conformance/lint/rules/no-duplicate-type-constituents/lintTypescriptNoDuplicateTypeConstituentsFinalStructuralUpstreamInvalid47.ts] ////

//// [input.ts]

abstract class cc {
  abstract f(a?: string | undefined): void;
}
      

//// [input.ts]

abstract class cc {
  abstract f(a?: string  ): void;
}
      
