//// [tests/cases/conformance/lint/rules/no-misused-spread/lintTypescriptNoMisusedSpreadFinalStructuralUpstreamInvalid9.ts] ////

//// [input.tsx]

declare function textIdentity(...args: string[]);

declare const text: string;

textIdentity(...text);
      

//// [input.tsx]

declare function textIdentity(...args: string[]);

declare const text: string;

textIdentity(...text);
      
