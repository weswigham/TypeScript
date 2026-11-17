//// [tests/cases/conformance/lint/rules/no-deprecated/lintTypescriptNoDeprecatedFinalStructuralDeprecatedJSXProps.ts] ////

//// [input.tsx]
interface Props { /** @deprecated */ old: string } function A(props: Props) { return <div />; } const a = <A old="" />;

//// [input.tsx]
interface Props { /** @deprecated */ old: string } function A(props: Props) { return <div />; } const a = <A old="" />;
