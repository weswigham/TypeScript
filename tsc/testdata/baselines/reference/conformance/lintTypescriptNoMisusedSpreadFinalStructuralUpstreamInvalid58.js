//// [tests/cases/conformance/lint/rules/no-misused-spread/lintTypescriptNoMisusedSpreadFinalStructuralUpstreamInvalid58.ts] ////

//// [input.tsx]

declare function getFunction(): () => void;

const o = { ...getFunction() };
      

//// [input.tsx]

declare function getFunction(): () => void;

const o = { ...getFunction() };
      
