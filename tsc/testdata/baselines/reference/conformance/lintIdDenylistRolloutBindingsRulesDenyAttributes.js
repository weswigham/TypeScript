//// [tests/cases/conformance/lint/rules/id-denylist/lintIdDenylistRolloutBindingsRulesDenyAttributes.ts] ////

//// [input.ts]
import value from 'mod' with { bad: 'value' }; import('mod', {with: {bad}});

//// [input.ts]
import value from 'mod' with { bad: 'value' }; import('mod', {with: {bad}});
