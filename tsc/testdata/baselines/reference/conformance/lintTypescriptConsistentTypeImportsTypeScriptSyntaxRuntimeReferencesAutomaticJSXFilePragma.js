//// [tests/cases/conformance/lint/rules/consistent-type-imports/lintTypescriptConsistentTypeImportsTypeScriptSyntaxRuntimeReferencesAutomaticJSXFilePragma.ts] ////

//// [input.tsx]
/** @jsxRuntime automatic */
import React from 'react'; type FC = React.FC; const element = <div />;

//// [input.tsx]
/** @jsxRuntime automatic */
import type React from 'react'; type FC = React.FC; const element = <div />;
