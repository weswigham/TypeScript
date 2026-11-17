//// [tests/cases/conformance/lint/rules/consistent-type-imports/lintTypescriptConsistentTypeImportsTypeScriptSyntaxRuntimeReferencesJSXFilePragma.ts] ////

//// [input.tsx]
/** @jsx h */
import { h } from 'x'; type FC = typeof h; const element = <div />;

//// [input.tsx]
/** @jsx h */
import { h } from 'x'; type FC = typeof h; const element = <div />;
