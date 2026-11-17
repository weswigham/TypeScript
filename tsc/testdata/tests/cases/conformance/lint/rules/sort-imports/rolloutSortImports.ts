// @lintOnly: true
// @fix: true
// @filename: tsconfig.json
{
	"lint": { "rules": { "sort-imports": "warn" } }
}
// @filename: input.ts

import { zeta, beta as alpha, gamma } from "one";
import named from "two";
import * as namespace from "three";
import "four";