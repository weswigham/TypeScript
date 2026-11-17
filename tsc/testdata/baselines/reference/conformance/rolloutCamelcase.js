//// [tests/cases/conformance/lint/rules/camelcase/rolloutCamelcase.ts] ////

//// [input.ts]
const snake_case = 1;
const UPPER_CASE = 1;
const allowed_name = 1;
const { original_name, key: alias_name } = source;
object.snake_case;
object.snake_case = 1;
class Example { #snake_case; snake_method() {} }
import { original_name } from "module";
export { snake_case as exported_name };

//// [input.ts]
const snake_case = 1;
const UPPER_CASE = 1;
const allowed_name = 1;
const { original_name, key: alias_name } = source;
object.snake_case;
object.snake_case = 1;
class Example { #snake_case; snake_method() {} }
import { original_name } from "module";
export { snake_case as exported_name };
