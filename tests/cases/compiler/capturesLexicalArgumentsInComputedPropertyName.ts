function MakeThingFactory() {
    return () => ({
        [[...arguments].join()]: "thing"
    });
}