//// [tests/cases/conformance/lint/rules/no-restricted-imports/lintNoRestrictedImportsRolloutRestrictionsUpstream185.ts] ////

//// [input.tsx]

        // error
        import { Foo_Enum } from '@app/api';
        import { Bar_Enum } from '@app/api/bar';
        import { Baz_Enum } from '@app/api/baz';
        import { B_Enum } from '@app/api/enums/foo';

        // no error
        import { C_Enum } from '@app/api/enums';
        

//// [input.tsx]

        // error
        import { Foo_Enum } from '@app/api';
        import { Bar_Enum } from '@app/api/bar';
        import { Baz_Enum } from '@app/api/baz';
        import { B_Enum } from '@app/api/enums/foo';

        // no error
        import { C_Enum } from '@app/api/enums';
        
