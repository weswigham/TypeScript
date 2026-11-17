//// [tests/cases/conformance/lint/rules/consistent-type-imports/lintTypescriptConsistentTypeImportsTypeScriptSyntaxRuntimeReferencesFragmentFactoryWithoutFragment.ts] ////

//// [input.tsx]
import { Fragment } from 'x'; type F = Fragment; const element = <div />;

//// [input.tsx]
import type { Fragment } from 'x'; type F = Fragment; const element = <div />;
