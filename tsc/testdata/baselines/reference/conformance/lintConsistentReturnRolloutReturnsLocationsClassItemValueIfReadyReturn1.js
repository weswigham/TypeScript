//// [tests/cases/conformance/lint/rules/consistent-return/lintConsistentReturnRolloutReturnsLocationsClassItemValueIfReadyReturn1.ts] ////

//// [input.ts]
class Item { ['value']() { if (ready) return 1; } }

//// [input.ts]
class Item { ['value']() { if (ready) return 1; } }
