//// [tests/cases/conformance/lint/rules/consistent-type-imports/lintTypescriptConsistentTypeImportsTypeScriptSyntaxRuntimeReferencesRenamedJSXFactory.ts] ////

//// [input.tsx]
import { factory as h } from 'x'; type FC = typeof h; const element = <div />;

//// [input.tsx]
import { factory as h } from 'x'; type FC = typeof h; const element = <div />;
