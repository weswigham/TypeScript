//// [tests/cases/conformance/lint/rules/no-misused-promises/lintTypescriptNoMisusedPromisesRolloutPromisesOptionsAndTypesDeclareFunctionComponentPropsRunVoidAnyComponentRuCase1.ts] ////

//// [input.tsx]
declare function Component(props: { run: () => void }): any; <Component run={async () => {}} />;
export {};

//// [input.tsx]
declare function Component(props: { run: () => void }): any; <Component run={async () => {}} />;
export {};
