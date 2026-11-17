//// [tests/cases/conformance/lint/rules/no-restricted-imports/lintNoRestrictedImportsRolloutRestrictionsUpstream208.ts] ////

//// [input.tsx]

  import type { foo } from 'import1/private/bar';
  import type { foo } from 'import2/private/bar';
		

//// [input.tsx]

  import type { foo } from 'import1/private/bar';
  import type { foo } from 'import2/private/bar';
		
