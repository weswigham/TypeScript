//// [tests/cases/conformance/lint/rules/no-misused-spread/lintTypescriptNoMisusedSpreadFinalStructuralUpstreamInvalid13.ts] ////

//// [input.tsx]

declare function getString(): string & { __brand: 'test' };
const a = [...getString()];
      

//// [input.tsx]

declare function getString(): string & { __brand: 'test' };
const a = [...getString()];
      
