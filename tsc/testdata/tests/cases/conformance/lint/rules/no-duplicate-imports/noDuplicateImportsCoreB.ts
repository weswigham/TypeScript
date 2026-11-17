// @lintOnly: true
// @fix: true
// @filename: tsconfig.json
{"compilerOptions":{"target":"esnext"},"lint":{"rules":{"no-duplicate-imports":"error"}},"files":["input.ts"]}
// @filename: input.ts
import * as space from 'pkg';
import { first } from 'pkg';
import { second } from 'pkg';
import 'side';
import 'side';
import type Default from 'types';
import type { Other } from 'types';
export { first } from 'pkg';