//// [tests/cases/conformance/lint/rules/constructor-super/lintConstructorSuperRolloutFlowUpstream80.ts] ////

//// [input.ts]
class C extends D {

                constructor() {
                    do {
                        super();
                    } while (foo);
                }

            }

//// [input.ts]
class C extends D {

                constructor() {
                    do {
                        super();
                    } while (foo);
                }

            }
