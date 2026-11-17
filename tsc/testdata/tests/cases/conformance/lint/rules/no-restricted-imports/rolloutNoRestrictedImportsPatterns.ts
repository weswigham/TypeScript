// @lintOnly: true
// @fix: true
// @filename: tsconfig.json
{"compilerOptions":{"target":"esnext"},"lint":{"rules":{"no-restricted-imports":["error",{"patterns":[{"group":["private/*","!private/public"],"message":"Use public modules."},{"group":["**/internal/**"],"importNames":["secret"],"importNamePattern":"^unsafe","allowTypeImports":true},{"regex":"^pkg/(?!public$)","allowImportNamePattern":"^safe"},{"group":["CaseSensitive"],"caseSensitive":true,"allowImportNames":["safe"]}]}]}},"files":["input.ts"]}
// @filename: input.ts
import "private/module";
import "private/public";
import "PRIVATE/MODULE";
import { secret, unsafeMethod, safe } from "@scope/pkg/internal/module";
import type { secret as T } from "@scope/pkg/internal/module";
import * as namespace from "@scope/pkg/internal/module";
export { unsafeMethod } from "@scope/pkg/internal/module";
export * from "pkg/private";
import { unsafe, safe } from "pkg/private";
import "pkg/public";
import { bad } from "CaseSensitive";
import { bad as permitted } from "casesensitive";