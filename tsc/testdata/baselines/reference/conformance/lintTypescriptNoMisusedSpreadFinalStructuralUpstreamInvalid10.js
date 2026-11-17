//// [tests/cases/conformance/lint/rules/no-misused-spread/lintTypescriptNoMisusedSpreadFinalStructuralUpstreamInvalid10.ts] ////

//// [input.tsx]

declare function textIdentity(...args: string[]);

declare const text: string;

textIdentity(...text, 'and', ...text);
      

//// [input.tsx]

declare function textIdentity(...args: string[]);

declare const text: string;

textIdentity(...text, 'and', ...text);
      
