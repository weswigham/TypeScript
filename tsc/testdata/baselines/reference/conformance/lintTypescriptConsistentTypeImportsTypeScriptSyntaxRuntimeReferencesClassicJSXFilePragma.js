//// [tests/cases/conformance/lint/rules/consistent-type-imports/lintTypescriptConsistentTypeImportsTypeScriptSyntaxRuntimeReferencesClassicJSXFilePragma.ts] ////

//// [input.tsx]
/** @jsxRuntime classic */
import React from 'react'; type FC = React.FC; const element = <div />;

//// [input.tsx]
/** @jsxRuntime classic */
import React from 'react'; type FC = React.FC; const element = <div />;
