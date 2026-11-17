//// [tests/cases/conformance/lint/rules/no-misused-spread/lintTypescriptNoMisusedSpreadFinalStructuralUpstreamInvalid82.ts] ////

//// [input.tsx]

class Declaration {
  declaration?: boolean;
}
const Expression = class {
  expression?: boolean;
};

declare const either: typeof Declaration | typeof Expression;

const o = { ...either };
      

//// [input.tsx]

class Declaration {
  declaration?: boolean;
}
const Expression = class {
  expression?: boolean;
};

declare const either: typeof Declaration | typeof Expression;

const o = { ...either };
      
