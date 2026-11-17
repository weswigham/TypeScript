// @lintOnly: true
// @fix: true
// @filename: tsconfig.json
{"compilerOptions":{"target":"esnext"},"lint":{"rules":{"no-import-assign":"error"}},"files":["input.ts"]}
// @filename: input.ts
import value, * as space from "pkg";
import { named as alias } from "pkg";
value = replacement;
[alias = fallback] = values;
space.key++;
delete space.key;
Object.assign(space, source);
Reflect.set(space, "key", value);
space.key.deep = value;
value.key = value;
function shadow(space, Object) {
    space.key++;
    Object.assign(space, source);
}