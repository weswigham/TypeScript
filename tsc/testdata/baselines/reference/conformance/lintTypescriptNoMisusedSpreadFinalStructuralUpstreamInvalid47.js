//// [tests/cases/conformance/lint/rules/no-misused-spread/lintTypescriptNoMisusedSpreadFinalStructuralUpstreamInvalid47.ts] ////

//// [input.tsx]

declare const promise: Promise<{ a: 1 }>;
async function foo() {
  return { ...(promise || {}) };
}
      

//// [input.tsx]

declare const promise: Promise<{ a: 1 }>;
async function foo() {
  return { ...(promise || {}) };
}
      
