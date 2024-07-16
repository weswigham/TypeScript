import { register } from "module";
import { pathToFileURL } from "url";

register("./hooks.js", pathToFileURL(__filename));