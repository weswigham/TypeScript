//// [tests/cases/conformance/lint/rules/no-misused-spread/lintTypescriptNoMisusedSpreadFinalStructuralUpstreamInvalid49.ts] ////

//// [input.tsx]

function withPromise<P extends Promise<void>>(promise: P) {
  return { ...promise };
}
      

//// [input.tsx]

function withPromise<P extends Promise<void>>(promise: P) {
  return { ...promise };
}
      
