//// [tests/cases/conformance/lint/rules/no-useless-rename/lintNoUselessRenameCoreDFixesImportFooAsFooFromModExportFooAsFoo.ts] ////

//// [input.tsx]
import { 'foo' as foo } from 'mod'; export { foo as 'foo' };

//// [input.tsx]
import { foo } from 'mod'; export { foo };
