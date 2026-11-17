//// [tests/cases/conformance/lint/rules/no-redundant-type-constituents/lintTypescriptNoRedundantTypeConstituentsFinalStructuralUpstreamInvalid48.ts] ////

//// [input.ts]

type S = 1 | 2;
type T = 'a' | 'b';
type U = S & T & string & number;
      

//// [input.ts]

type S = 1 | 2;
type T = 'a' | 'b';
type U = S & T & string & number;
      
