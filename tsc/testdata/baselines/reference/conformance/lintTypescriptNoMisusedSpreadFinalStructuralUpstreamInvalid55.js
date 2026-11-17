//// [tests/cases/conformance/lint/rules/no-misused-spread/lintTypescriptNoMisusedSpreadFinalStructuralUpstreamInvalid55.ts] ////

//// [input.tsx]

interface FunctionWithProps {
  (): string;
  prop: boolean;
}

type FunctionWithoutProps = () => string;

declare const obj: FunctionWithProps | FunctionWithoutProps | object;

const o = { ...obj };
      

//// [input.tsx]

interface FunctionWithProps {
  (): string;
  prop: boolean;
}

type FunctionWithoutProps = () => string;

declare const obj: FunctionWithProps | FunctionWithoutProps | object;

const o = { ...obj };
      
