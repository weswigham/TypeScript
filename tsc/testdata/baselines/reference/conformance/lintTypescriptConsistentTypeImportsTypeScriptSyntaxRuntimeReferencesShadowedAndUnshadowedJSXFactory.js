//// [tests/cases/conformance/lint/rules/consistent-type-imports/lintTypescriptConsistentTypeImportsTypeScriptSyntaxRuntimeReferencesShadowedAndUnshadowedJSXFactory.ts] ////

//// [input.tsx]
import React from 'react'; type FC = React.FC; function render(React: any) { return <div />; } const element = <div />;

//// [input.tsx]
import React from 'react'; type FC = React.FC; function render(React: any) { return <div />; } const element = <div />;
