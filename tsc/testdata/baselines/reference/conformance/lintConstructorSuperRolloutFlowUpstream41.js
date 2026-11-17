//// [tests/cases/conformance/lint/rules/constructor-super/lintConstructorSuperRolloutFlowUpstream41.ts] ////

//// [input.ts]

            class A extends Base {
                constructor(list) {
                    for (const a of list) {
                        if (a.foo) {
                            super(a);
                            return;
                        }
                    }
                    super();
                }
            }
        

//// [input.ts]

            class A extends Base {
                constructor(list) {
                    for (const a of list) {
                        if (a.foo) {
                            super(a);
                            return;
                        }
                    }
                    super();
                }
            }
        
