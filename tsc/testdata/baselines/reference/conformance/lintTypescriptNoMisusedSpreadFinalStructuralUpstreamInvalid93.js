//// [tests/cases/conformance/lint/rules/no-misused-spread/lintTypescriptNoMisusedSpreadFinalStructuralUpstreamInvalid93.ts] ////

//// [input.tsx]

const promise = new Promise(() => {});

const o = <div {...promise} />;
      

//// [input.tsx]

const promise = new Promise(() => {});

const o = <div {...promise} />;
      
