import * as ts from "./ts";
export interface EmitOutput {
    outputFiles: OutputFile[];
    emitSkipped: boolean;
    /* @internal */ exportedModulesFromDeclarationEmit?: ts.ExportedModulesFromDeclarationEmit;
}
export interface OutputFile {
    name: string;
    writeByteOrderMark: boolean;
    text: string;
}
