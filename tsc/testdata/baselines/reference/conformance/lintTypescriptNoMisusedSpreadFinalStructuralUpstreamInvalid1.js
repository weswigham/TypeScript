//// [tests/cases/conformance/lint/rules/no-misused-spread/lintTypescriptNoMisusedSpreadFinalStructuralUpstreamInvalid1.ts] ////

//// [input.tsx]

function withText<Text extends string>(text: Text) {
  return [...text];
}
      

//// [input.tsx]

function withText<Text extends string>(text: Text) {
  return [...text];
}
      
