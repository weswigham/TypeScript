/* @internal */
namespace ts {
    // Additional tsserver specific watch information
    export interface WatchTypeRegistry {
        ClosedScriptInfo: "Closed Script info";
        ConfigFileForInferredRoot: "Config file for the inferred project root";
        NodeModulesForClosedScriptInfo: "node_modules for closed script infos in them";
        MissingSourceMapFile: "Missing source map file";
        NoopConfigFileForInferredRoot: "Noop Config file for the inferred project root";
        MissingGeneratedFile: "Missing generated file";
        PackageJsonFile: "package.json file for import suggestions";
    }
    ts.WatchType.ClosedScriptInfo = "Closed Script info";
    ts.WatchType.ConfigFileForInferredRoot = "Config file for the inferred project root";
    ts.WatchType.NodeModulesForClosedScriptInfo = "node_modules for closed script infos in them";
    ts.WatchType.MissingSourceMapFile = "Missing source map file";
    ts.WatchType.NoopConfigFileForInferredRoot = "Noop Config file for the inferred project root";
    ts.WatchType.MissingGeneratedFile = "Missing generated file";
    ts.WatchType.PackageJsonFile = "package.json file for import suggestions";
}
