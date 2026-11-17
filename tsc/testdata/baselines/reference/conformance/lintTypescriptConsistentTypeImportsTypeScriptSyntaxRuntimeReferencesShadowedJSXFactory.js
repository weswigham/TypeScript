//// [tests/cases/conformance/lint/rules/consistent-type-imports/lintTypescriptConsistentTypeImportsTypeScriptSyntaxRuntimeReferencesShadowedJSXFactory.ts] ////

//// [input.tsx]
import React from 'react'; type FC = React.FC; function render(React: any) { return <div />; }

//// [input.tsx]
import type React from 'react'; type FC = React.FC; function render(React: any) { return <div />; }
