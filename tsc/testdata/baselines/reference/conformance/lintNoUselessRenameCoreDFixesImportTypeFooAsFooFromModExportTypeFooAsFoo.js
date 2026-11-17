//// [tests/cases/conformance/lint/rules/no-useless-rename/lintNoUselessRenameCoreDFixesImportTypeFooAsFooFromModExportTypeFooAsFoo.ts] ////

//// [input.tsx]
import { type foo as foo } from 'mod'; export { type foo as foo };

//// [input.tsx]
import { type foo } from 'mod'; export { type foo };
