//// [tests/cases/conformance/lint/rules/no-misused-spread/lintTypescriptNoMisusedSpreadFinalStructuralUpstreamInvalid48.ts] ////

//// [input.tsx]

declare const promise: Promise<any>;
async function foo() {
  return { ...(Math.random() < 0.5 ? promise : {}) };
}
      

//// [input.tsx]

declare const promise: Promise<any>;
async function foo() {
  return { ...(Math.random() < 0.5 ? promise : {}) };
}
      
