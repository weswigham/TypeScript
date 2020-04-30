// @traceResolution: true
// @moduleResolution: browser
// @target: es6
// @filename: node_modules/node_mod/index.js
export {};
// @filename: index.js
import * as mod1 from "node_mod"; // should error
import * as mod2 from "./node_modules/node_mod"; // should error
import * as mod3 from "./node_modules/node_mod/index"; // should error
import * as mod3 from "./node_modules/node_mod/index.js"; // should be OK

/**
 * Browser resolution:
 * - does not allow bare module specifiers by default, eg, `"packagename"`
 *      - This necessitates disabling ambient module lookup!
 *      - Exception: Can be enabled through import maps (https://www.chromestatus.com/feature/5315286962012160) - currently chrome only, disabled until standardized? (deno also supports? moved to unstable?)
 *          Possibly useful to support early, as it both allows us to "allow" bare specifiers in the resolver, and allows us to provide a mechanism to remap remote URLs to local paths
 *          Ergo, new compiler option: "importMap": "./path/to/map.json" - this is fundamentally similar to the "paths" option we already have, but allows the artifact to be reused for browsers by being in another file
 *          Maybe, barring standardization/stablization, better to just rely on `paths` entries for now
 * - does not allow omitting the extension of a file, eg `"./file"`
 * - interprets a specifier with a leading `/` as resolving from the project `"baseUrl"`
 */