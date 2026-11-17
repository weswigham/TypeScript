//// [tests/cases/conformance/lint/rules/consistent-type-imports/lintTypescriptConsistentTypeImportsTypeScriptSyntaxRuntimeReferencesAutomaticJSXRuntime.ts] ////

//// [input.tsx]
import React from 'react'; type FC = React.FC; const element = <div />;

//// [input.tsx]
import type React from 'react'; type FC = React.FC; const element = <div />;
