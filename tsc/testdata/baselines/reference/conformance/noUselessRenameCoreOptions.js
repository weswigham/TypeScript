//// [tests/cases/conformance/lint/rules/no-useless-rename/noUselessRenameCoreOptions.ts] ////

//// [input.ts]
import { foo as foo } from "module";
export { foo as foo };
const { value: value } = object;

//// [input.ts]
import { foo as foo } from "module";
export { foo as foo };
const { value: value } = object;
