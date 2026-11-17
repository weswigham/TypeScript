//// [tests/cases/conformance/lint/rules/id-denylist/lintIdDenylistRolloutBindingsRulesDenyImports.ts] ////

//// [input.ts]
import {bad as good, good as bad} from 'mod'; export { bad as good }; export {bad as good} from 'mod';

//// [input.ts]
import {bad as good, good as bad} from 'mod'; export { bad as good }; export {bad as good} from 'mod';
