//// [tests/cases/conformance/lint/rules/no-misused-spread/lintTypescriptNoMisusedSpreadFinalStructuralUpstreamInvalid11.ts] ////

//// [input.tsx]

declare function textIdentity(...args: string[]);

function withText<Text extends string>(text: Text) {
  textIdentity(...text);
}
      

//// [input.tsx]

declare function textIdentity(...args: string[]);

function withText<Text extends string>(text: Text) {
  textIdentity(...text);
}
      
