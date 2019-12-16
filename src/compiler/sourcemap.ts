/* @internal */
namespace ts {
    export interface SourceMapGeneratorOptions {
        extendedDiagnostics?: boolean;
    }
    export function createSourceMapGenerator(host: ts.EmitHost, file: string, sourceRoot: string, sourcesDirectoryPath: string, generatorOptions: SourceMapGeneratorOptions): ts.SourceMapGenerator {
        const { enter, exit } = generatorOptions.extendedDiagnostics
            ? ts.performance.createTimer("Source Map", "beforeSourcemap", "afterSourcemap")
            : ts.performance.nullTimer;
        // Current source map file and its index in the sources list
        const rawSources: string[] = [];
        const sources: string[] = [];
        const sourceToSourceIndexMap = ts.createMap<number>();
        let sourcesContent: (string | null)[] | undefined;
        const names: string[] = [];
        let nameToNameIndexMap: ts.Map<number> | undefined;
        let mappings = "";
        // Last recorded and encoded mappings
        let lastGeneratedLine = 0;
        let lastGeneratedCharacter = 0;
        let lastSourceIndex = 0;
        let lastSourceLine = 0;
        let lastSourceCharacter = 0;
        let lastNameIndex = 0;
        let hasLast = false;
        let pendingGeneratedLine = 0;
        let pendingGeneratedCharacter = 0;
        let pendingSourceIndex = 0;
        let pendingSourceLine = 0;
        let pendingSourceCharacter = 0;
        let pendingNameIndex = 0;
        let hasPending = false;
        let hasPendingSource = false;
        let hasPendingName = false;
        return {
            getSources: () => rawSources,
            addSource,
            setSourceContent,
            addName,
            addMapping,
            appendSourceMap,
            toJSON,
            toString: () => JSON.stringify(toJSON())
        };
        function addSource(fileName: string) {
            enter();
            const source = ts.getRelativePathToDirectoryOrUrl(sourcesDirectoryPath, fileName, host.getCurrentDirectory(), host.getCanonicalFileName, 
            /*isAbsolutePathAnUrl*/ true);
            let sourceIndex = sourceToSourceIndexMap.get(source);
            if (sourceIndex === undefined) {
                sourceIndex = sources.length;
                sources.push(source);
                rawSources.push(fileName);
                sourceToSourceIndexMap.set(source, sourceIndex);
            }
            exit();
            return sourceIndex;
        }
        /* eslint-disable boolean-trivia, no-null/no-null */
        function setSourceContent(sourceIndex: number, content: string | null) {
            enter();
            if (content !== null) {
                if (!sourcesContent)
                    sourcesContent = [];
                while (sourcesContent.length < sourceIndex) {
                    sourcesContent.push(null);
                }
                sourcesContent[sourceIndex] = content;
            }
            exit();
        }
        /* eslint-enable boolean-trivia, no-null/no-null */
        function addName(name: string) {
            enter();
            if (!nameToNameIndexMap)
                nameToNameIndexMap = ts.createMap();
            let nameIndex = nameToNameIndexMap.get(name);
            if (nameIndex === undefined) {
                nameIndex = names.length;
                names.push(name);
                nameToNameIndexMap.set(name, nameIndex);
            }
            exit();
            return nameIndex;
        }
        function isNewGeneratedPosition(generatedLine: number, generatedCharacter: number) {
            return !hasPending
                || pendingGeneratedLine !== generatedLine
                || pendingGeneratedCharacter !== generatedCharacter;
        }
        function isBacktrackingSourcePosition(sourceIndex: number | undefined, sourceLine: number | undefined, sourceCharacter: number | undefined) {
            return sourceIndex !== undefined
                && sourceLine !== undefined
                && sourceCharacter !== undefined
                && pendingSourceIndex === sourceIndex
                && (pendingSourceLine > sourceLine
                    || pendingSourceLine === sourceLine && pendingSourceCharacter > sourceCharacter);
        }
        function addMapping(generatedLine: number, generatedCharacter: number, sourceIndex?: number, sourceLine?: number, sourceCharacter?: number, nameIndex?: number) {
            ts.Debug.assert(generatedLine >= pendingGeneratedLine, "generatedLine cannot backtrack");
            ts.Debug.assert(generatedCharacter >= 0, "generatedCharacter cannot be negative");
            ts.Debug.assert(sourceIndex === undefined || sourceIndex >= 0, "sourceIndex cannot be negative");
            ts.Debug.assert(sourceLine === undefined || sourceLine >= 0, "sourceLine cannot be negative");
            ts.Debug.assert(sourceCharacter === undefined || sourceCharacter >= 0, "sourceCharacter cannot be negative");
            enter();
            // If this location wasn't recorded or the location in source is going backwards, record the mapping
            if (isNewGeneratedPosition(generatedLine, generatedCharacter) ||
                isBacktrackingSourcePosition(sourceIndex, sourceLine, sourceCharacter)) {
                commitPendingMapping();
                pendingGeneratedLine = generatedLine;
                pendingGeneratedCharacter = generatedCharacter;
                hasPendingSource = false;
                hasPendingName = false;
                hasPending = true;
            }
            if (sourceIndex !== undefined && sourceLine !== undefined && sourceCharacter !== undefined) {
                pendingSourceIndex = sourceIndex;
                pendingSourceLine = sourceLine;
                pendingSourceCharacter = sourceCharacter;
                hasPendingSource = true;
                if (nameIndex !== undefined) {
                    pendingNameIndex = nameIndex;
                    hasPendingName = true;
                }
            }
            exit();
        }
        function appendSourceMap(generatedLine: number, generatedCharacter: number, map: ts.RawSourceMap, sourceMapPath: string, start?: ts.LineAndCharacter, end?: ts.LineAndCharacter) {
            ts.Debug.assert(generatedLine >= pendingGeneratedLine, "generatedLine cannot backtrack");
            ts.Debug.assert(generatedCharacter >= 0, "generatedCharacter cannot be negative");
            enter();
            // First, decode the old component sourcemap
            const sourceIndexToNewSourceIndexMap: number[] = [];
            let nameIndexToNewNameIndexMap: number[] | undefined;
            const mappingIterator = decodeMappings(map.mappings);
            for (let iterResult = mappingIterator.next(); !iterResult.done; iterResult = mappingIterator.next()) {
                const raw = iterResult.value;
                if (end && (raw.generatedLine > end.line ||
                    (raw.generatedLine === end.line && raw.generatedCharacter > end.character))) {
                    break;
                }
                if (start && (raw.generatedLine < start.line ||
                    (start.line === raw.generatedLine && raw.generatedCharacter < start.character))) {
                    continue;
                }
                // Then reencode all the updated mappings into the overall map
                let newSourceIndex: number | undefined;
                let newSourceLine: number | undefined;
                let newSourceCharacter: number | undefined;
                let newNameIndex: number | undefined;
                if (raw.sourceIndex !== undefined) {
                    newSourceIndex = sourceIndexToNewSourceIndexMap[raw.sourceIndex];
                    if (newSourceIndex === undefined) {
                        // Apply offsets to each position and fixup source entries
                        const rawPath = map.sources[raw.sourceIndex];
                        const relativePath = map.sourceRoot ? ts.combinePaths(map.sourceRoot, rawPath) : rawPath;
                        const combinedPath = ts.combinePaths(ts.getDirectoryPath(sourceMapPath), relativePath);
                        sourceIndexToNewSourceIndexMap[raw.sourceIndex] = newSourceIndex = addSource(combinedPath);
                        if (map.sourcesContent && typeof map.sourcesContent[raw.sourceIndex] === "string") {
                            setSourceContent(newSourceIndex, map.sourcesContent[raw.sourceIndex]);
                        }
                    }
                    newSourceLine = raw.sourceLine;
                    newSourceCharacter = raw.sourceCharacter;
                    if (map.names && raw.nameIndex !== undefined) {
                        if (!nameIndexToNewNameIndexMap)
                            nameIndexToNewNameIndexMap = [];
                        newNameIndex = nameIndexToNewNameIndexMap[raw.nameIndex];
                        if (newNameIndex === undefined) {
                            nameIndexToNewNameIndexMap[raw.nameIndex] = newNameIndex = addName(map.names[raw.nameIndex]);
                        }
                    }
                }
                const rawGeneratedLine = raw.generatedLine - (start ? start.line : 0);
                const newGeneratedLine = rawGeneratedLine + generatedLine;
                const rawGeneratedCharacter = start && start.line === raw.generatedLine ? raw.generatedCharacter - start.character : raw.generatedCharacter;
                const newGeneratedCharacter = rawGeneratedLine === 0 ? rawGeneratedCharacter + generatedCharacter : rawGeneratedCharacter;
                addMapping(newGeneratedLine, newGeneratedCharacter, newSourceIndex, newSourceLine, newSourceCharacter, newNameIndex);
            }
            exit();
        }
        function shouldCommitMapping() {
            return !hasLast
                || lastGeneratedLine !== pendingGeneratedLine
                || lastGeneratedCharacter !== pendingGeneratedCharacter
                || lastSourceIndex !== pendingSourceIndex
                || lastSourceLine !== pendingSourceLine
                || lastSourceCharacter !== pendingSourceCharacter
                || lastNameIndex !== pendingNameIndex;
        }
        function commitPendingMapping() {
            if (!hasPending || !shouldCommitMapping()) {
                return;
            }
            enter();
            // Line/Comma delimiters
            if (lastGeneratedLine < pendingGeneratedLine) {
                // Emit line delimiters
                do {
                    mappings += ";";
                    lastGeneratedLine++;
                    lastGeneratedCharacter = 0;
                } while (lastGeneratedLine < pendingGeneratedLine);
            }
            else {
                ts.Debug.assertEqual(lastGeneratedLine, pendingGeneratedLine, "generatedLine cannot backtrack");
                // Emit comma to separate the entry
                if (hasLast) {
                    mappings += ",";
                }
            }
            // 1. Relative generated character
            mappings += base64VLQFormatEncode(pendingGeneratedCharacter - lastGeneratedCharacter);
            lastGeneratedCharacter = pendingGeneratedCharacter;
            if (hasPendingSource) {
                // 2. Relative sourceIndex
                mappings += base64VLQFormatEncode(pendingSourceIndex - lastSourceIndex);
                lastSourceIndex = pendingSourceIndex;
                // 3. Relative source line
                mappings += base64VLQFormatEncode(pendingSourceLine - lastSourceLine);
                lastSourceLine = pendingSourceLine;
                // 4. Relative source character
                mappings += base64VLQFormatEncode(pendingSourceCharacter - lastSourceCharacter);
                lastSourceCharacter = pendingSourceCharacter;
                if (hasPendingName) {
                    // 5. Relative nameIndex
                    mappings += base64VLQFormatEncode(pendingNameIndex - lastNameIndex);
                    lastNameIndex = pendingNameIndex;
                }
            }
            hasLast = true;
            exit();
        }
        function toJSON(): ts.RawSourceMap {
            commitPendingMapping();
            return {
                version: 3,
                file,
                sourceRoot,
                sources,
                names,
                mappings,
                sourcesContent,
            };
        }
    }
    // Sometimes tools can see the following line as a source mapping url comment, so we mangle it a bit (the [M])
    const sourceMapCommentRegExp = /^\/\/[@#] source[M]appingURL=(.+)\s*$/;
    const whitespaceOrMapCommentRegExp = /^\s*(\/\/[@#] .*)?$/;
    export interface LineInfo {
        getLineCount(): number;
        getLineText(line: number): string;
    }
    export function getLineInfo(text: string, lineStarts: readonly number[]): LineInfo {
        return {
            getLineCount: () => lineStarts.length,
            getLineText: line => text.substring(lineStarts[line], lineStarts[line + 1])
        };
    }
    /**
     * Tries to find the sourceMappingURL comment at the end of a file.
     */
    export function tryGetSourceMappingURL(lineInfo: LineInfo) {
        for (let index = lineInfo.getLineCount() - 1; index >= 0; index--) {
            const line = lineInfo.getLineText(index);
            const comment = sourceMapCommentRegExp.exec(line);
            if (comment) {
                return comment[1];
            }
            // If we see a non-whitespace/map comment-like line, break, to avoid scanning up the entire file
            else if (!line.match(whitespaceOrMapCommentRegExp)) {
                break;
            }
        }
    }
    /* eslint-disable no-null/no-null */
    function isStringOrNull(x: any) {
        return typeof x === "string" || x === null;
    }
    export function isRawSourceMap(x: any): x is ts.RawSourceMap {
        return x !== null
            && typeof x === "object"
            && x.version === 3
            && typeof x.file === "string"
            && typeof x.mappings === "string"
            && ts.isArray(x.sources) && ts.every(x.sources, ts.isString)
            && (x.sourceRoot === undefined || x.sourceRoot === null || typeof x.sourceRoot === "string")
            && (x.sourcesContent === undefined || x.sourcesContent === null || ts.isArray(x.sourcesContent) && ts.every(x.sourcesContent, isStringOrNull))
            && (x.names === undefined || x.names === null || ts.isArray(x.names) && ts.every(x.names, ts.isString));
    }
    /* eslint-enable no-null/no-null */
    export function tryParseRawSourceMap(text: string) {
        try {
            const parsed = JSON.parse(text);
            if (isRawSourceMap(parsed)) {
                return parsed;
            }
        }
        catch {
            // empty
        }
        return undefined;
    }
    export interface MappingsDecoder extends ts.Iterator<Mapping> {
        readonly pos: number;
        readonly error: string | undefined;
        readonly state: Required<Mapping>;
    }
    export interface Mapping {
        generatedLine: number;
        generatedCharacter: number;
        sourceIndex?: number;
        sourceLine?: number;
        sourceCharacter?: number;
        nameIndex?: number;
    }
    export interface SourceMapping extends Mapping {
        sourceIndex: number;
        sourceLine: number;
        sourceCharacter: number;
    }
    export function decodeMappings(mappings: string): MappingsDecoder {
        let done = false;
        let pos = 0;
        let generatedLine = 0;
        let generatedCharacter = 0;
        let sourceIndex = 0;
        let sourceLine = 0;
        let sourceCharacter = 0;
        let nameIndex = 0;
        let error: string | undefined;
        return {
            get pos() { return pos; },
            get error() { return error; },
            get state() { return captureMapping(/*hasSource*/ true, /*hasName*/ true); },
            next() {
                while (!done && pos < mappings.length) {
                    const ch = mappings.charCodeAt(pos);
                    if (ch === ts.CharacterCodes.semicolon) {
                        // new line
                        generatedLine++;
                        generatedCharacter = 0;
                        pos++;
                        continue;
                    }
                    if (ch === ts.CharacterCodes.comma) {
                        // Next entry is on same line - no action needed
                        pos++;
                        continue;
                    }
                    let hasSource = false;
                    let hasName = false;
                    generatedCharacter += base64VLQFormatDecode();
                    if (hasReportedError())
                        return stopIterating();
                    if (generatedCharacter < 0)
                        return setErrorAndStopIterating("Invalid generatedCharacter found");
                    if (!isSourceMappingSegmentEnd()) {
                        hasSource = true;
                        sourceIndex += base64VLQFormatDecode();
                        if (hasReportedError())
                            return stopIterating();
                        if (sourceIndex < 0)
                            return setErrorAndStopIterating("Invalid sourceIndex found");
                        if (isSourceMappingSegmentEnd())
                            return setErrorAndStopIterating("Unsupported Format: No entries after sourceIndex");
                        sourceLine += base64VLQFormatDecode();
                        if (hasReportedError())
                            return stopIterating();
                        if (sourceLine < 0)
                            return setErrorAndStopIterating("Invalid sourceLine found");
                        if (isSourceMappingSegmentEnd())
                            return setErrorAndStopIterating("Unsupported Format: No entries after sourceLine");
                        sourceCharacter += base64VLQFormatDecode();
                        if (hasReportedError())
                            return stopIterating();
                        if (sourceCharacter < 0)
                            return setErrorAndStopIterating("Invalid sourceCharacter found");
                        if (!isSourceMappingSegmentEnd()) {
                            hasName = true;
                            nameIndex += base64VLQFormatDecode();
                            if (hasReportedError())
                                return stopIterating();
                            if (nameIndex < 0)
                                return setErrorAndStopIterating("Invalid nameIndex found");
                            if (!isSourceMappingSegmentEnd())
                                return setErrorAndStopIterating("Unsupported Error Format: Entries after nameIndex");
                        }
                    }
                    return { value: captureMapping(hasSource, hasName), done };
                }
                return stopIterating();
            }
        };
        function captureMapping(hasSource: true, hasName: true): Required<Mapping>;
        function captureMapping(hasSource: boolean, hasName: boolean): Mapping;
        function captureMapping(hasSource: boolean, hasName: boolean): Mapping {
            return {
                generatedLine,
                generatedCharacter,
                sourceIndex: hasSource ? sourceIndex : undefined,
                sourceLine: hasSource ? sourceLine : undefined,
                sourceCharacter: hasSource ? sourceCharacter : undefined,
                nameIndex: hasName ? nameIndex : undefined
            };
        }
        function stopIterating(): {
            value: never;
            done: true;
        } {
            done = true;
            return { value: undefined!, done: true };
        }
        function setError(message: string) {
            if (error === undefined) {
                error = message;
            }
        }
        function setErrorAndStopIterating(message: string) {
            setError(message);
            return stopIterating();
        }
        function hasReportedError() {
            return error !== undefined;
        }
        function isSourceMappingSegmentEnd() {
            return (pos === mappings.length ||
                mappings.charCodeAt(pos) === ts.CharacterCodes.comma ||
                mappings.charCodeAt(pos) === ts.CharacterCodes.semicolon);
        }
        function base64VLQFormatDecode(): number {
            let moreDigits = true;
            let shiftCount = 0;
            let value = 0;
            for (; moreDigits; pos++) {
                if (pos >= mappings.length)
                    return setError("Error in decoding base64VLQFormatDecode, past the mapping string"), -1;
                // 6 digit number
                const currentByte = base64FormatDecode(mappings.charCodeAt(pos));
                if (currentByte === -1)
                    return setError("Invalid character in VLQ"), -1;
                // If msb is set, we still have more bits to continue
                moreDigits = (currentByte & 32) !== 0;
                // least significant 5 bits are the next msbs in the final value.
                value = value | ((currentByte & 31) << shiftCount);
                shiftCount += 5;
            }
            // Least significant bit if 1 represents negative and rest of the msb is actual absolute value
            if ((value & 1) === 0) {
                // + number
                value = value >> 1;
            }
            else {
                // - number
                value = value >> 1;
                value = -value;
            }
            return value;
        }
    }
    export function sameMapping<T extends Mapping>(left: T, right: T) {
        return left === right
            || left.generatedLine === right.generatedLine
                && left.generatedCharacter === right.generatedCharacter
                && left.sourceIndex === right.sourceIndex
                && left.sourceLine === right.sourceLine
                && left.sourceCharacter === right.sourceCharacter
                && left.nameIndex === right.nameIndex;
    }
    export function isSourceMapping(mapping: Mapping): mapping is SourceMapping {
        return mapping.sourceIndex !== undefined
            && mapping.sourceLine !== undefined
            && mapping.sourceCharacter !== undefined;
    }
    function base64FormatEncode(value: number) {
        return value >= 0 && value < 26 ? ts.CharacterCodes.A + value :
            value >= 26 && value < 52 ? ts.CharacterCodes.a + value - 26 :
                value >= 52 && value < 62 ? ts.CharacterCodes._0 + value - 52 :
                    value === 62 ? ts.CharacterCodes.plus :
                        value === 63 ? ts.CharacterCodes.slash :
                            ts.Debug.fail(`${value}: not a base64 value`);
    }
    function base64FormatDecode(ch: number) {
        return ch >= ts.CharacterCodes.A && ch <= ts.CharacterCodes.Z ? ch - ts.CharacterCodes.A :
            ch >= ts.CharacterCodes.a && ch <= ts.CharacterCodes.z ? ch - ts.CharacterCodes.a + 26 :
                ch >= ts.CharacterCodes._0 && ch <= ts.CharacterCodes._9 ? ch - ts.CharacterCodes._0 + 52 :
                    ch === ts.CharacterCodes.plus ? 62 :
                        ch === ts.CharacterCodes.slash ? 63 :
                            -1;
    }
    function base64VLQFormatEncode(inValue: number) {
        // Add a new least significant bit that has the sign of the value.
        // if negative number the least significant bit that gets added to the number has value 1
        // else least significant bit value that gets added is 0
        // eg. -1 changes to binary : 01 [1] => 3
        //     +1 changes to binary : 01 [0] => 2
        if (inValue < 0) {
            inValue = ((-inValue) << 1) + 1;
        }
        else {
            inValue = inValue << 1;
        }
        // Encode 5 bits at a time starting from least significant bits
        let encodedStr = "";
        do {
            let currentDigit = inValue & 31; // 11111
            inValue = inValue >> 5;
            if (inValue > 0) {
                // There are still more digits to decode, set the msb (6th bit)
                currentDigit = currentDigit | 32;
            }
            encodedStr = encodedStr + String.fromCharCode(base64FormatEncode(currentDigit));
        } while (inValue > 0);
        return encodedStr;
    }
    interface MappedPosition {
        generatedPosition: number;
        source: string | undefined;
        sourceIndex: number | undefined;
        sourcePosition: number | undefined;
        nameIndex: number | undefined;
    }
    interface SourceMappedPosition extends MappedPosition {
        source: string;
        sourceIndex: number;
        sourcePosition: number;
    }
    function isSourceMappedPosition(value: MappedPosition): value is SourceMappedPosition {
        return value.sourceIndex !== undefined
            && value.sourcePosition !== undefined;
    }
    function sameMappedPosition(left: MappedPosition, right: MappedPosition) {
        return left.generatedPosition === right.generatedPosition
            && left.sourceIndex === right.sourceIndex
            && left.sourcePosition === right.sourcePosition;
    }
    function compareSourcePositions(left: SourceMappedPosition, right: SourceMappedPosition) {
        // Compares sourcePosition without comparing sourceIndex
        // since the mappings are grouped by sourceIndex
        ts.Debug.assert(left.sourceIndex === right.sourceIndex);
        return ts.compareValues(left.sourcePosition, right.sourcePosition);
    }
    function compareGeneratedPositions(left: MappedPosition, right: MappedPosition) {
        return ts.compareValues(left.generatedPosition, right.generatedPosition);
    }
    function getSourcePositionOfMapping(value: SourceMappedPosition) {
        return value.sourcePosition;
    }
    function getGeneratedPositionOfMapping(value: MappedPosition) {
        return value.generatedPosition;
    }
    export function createDocumentPositionMapper(host: ts.DocumentPositionMapperHost, map: ts.RawSourceMap, mapPath: string): ts.DocumentPositionMapper {
        const mapDirectory = ts.getDirectoryPath(mapPath);
        const sourceRoot = map.sourceRoot ? ts.getNormalizedAbsolutePath(map.sourceRoot, mapDirectory) : mapDirectory;
        const generatedAbsoluteFilePath = ts.getNormalizedAbsolutePath(map.file, mapDirectory);
        const generatedFile = host.getSourceFileLike(generatedAbsoluteFilePath);
        const sourceFileAbsolutePaths = map.sources.map(source => ts.getNormalizedAbsolutePath(source, sourceRoot));
        const sourceToSourceIndexMap = ts.createMapFromEntries(sourceFileAbsolutePaths.map((source, i) => [host.getCanonicalFileName(source), i] as [string, number]));
        let decodedMappings: readonly MappedPosition[] | undefined;
        let generatedMappings: ts.SortedReadonlyArray<MappedPosition> | undefined;
        let sourceMappings: readonly ts.SortedReadonlyArray<SourceMappedPosition>[] | undefined;
        return {
            getSourcePosition,
            getGeneratedPosition
        };
        function processMapping(mapping: Mapping): MappedPosition {
            const generatedPosition = generatedFile !== undefined
                ? ts.getPositionOfLineAndCharacter(generatedFile, mapping.generatedLine, mapping.generatedCharacter, /*allowEdits*/ true)
                : -1;
            let source: string | undefined;
            let sourcePosition: number | undefined;
            if (isSourceMapping(mapping)) {
                const sourceFile = host.getSourceFileLike(sourceFileAbsolutePaths[mapping.sourceIndex]);
                source = map.sources[mapping.sourceIndex];
                sourcePosition = sourceFile !== undefined
                    ? ts.getPositionOfLineAndCharacter(sourceFile, mapping.sourceLine, mapping.sourceCharacter, /*allowEdits*/ true)
                    : -1;
            }
            return {
                generatedPosition,
                source,
                sourceIndex: mapping.sourceIndex,
                sourcePosition,
                nameIndex: mapping.nameIndex
            };
        }
        function getDecodedMappings() {
            if (decodedMappings === undefined) {
                const decoder = decodeMappings(map.mappings);
                const mappings = ts.arrayFrom(decoder, processMapping);
                if (decoder.error !== undefined) {
                    if (host.log) {
                        host.log(`Encountered error while decoding sourcemap: ${decoder.error}`);
                    }
                    decodedMappings = ts.emptyArray;
                }
                else {
                    decodedMappings = mappings;
                }
            }
            return decodedMappings;
        }
        function getSourceMappings(sourceIndex: number) {
            if (sourceMappings === undefined) {
                const lists: SourceMappedPosition[][] = [];
                for (const mapping of getDecodedMappings()) {
                    if (!isSourceMappedPosition(mapping))
                        continue;
                    let list = lists[mapping.sourceIndex];
                    if (!list)
                        lists[mapping.sourceIndex] = list = [];
                    list.push(mapping);
                }
                sourceMappings = lists.map(list => ts.sortAndDeduplicate<SourceMappedPosition>(list, compareSourcePositions, sameMappedPosition));
            }
            return sourceMappings[sourceIndex];
        }
        function getGeneratedMappings() {
            if (generatedMappings === undefined) {
                const list: MappedPosition[] = [];
                for (const mapping of getDecodedMappings()) {
                    list.push(mapping);
                }
                generatedMappings = ts.sortAndDeduplicate(list, compareGeneratedPositions, sameMappedPosition);
            }
            return generatedMappings;
        }
        function getGeneratedPosition(loc: ts.DocumentPosition): ts.DocumentPosition {
            const sourceIndex = sourceToSourceIndexMap.get(host.getCanonicalFileName(loc.fileName));
            if (sourceIndex === undefined)
                return loc;
            const sourceMappings = getSourceMappings(sourceIndex);
            if (!ts.some(sourceMappings))
                return loc;
            let targetIndex = ts.binarySearchKey(sourceMappings, loc.pos, getSourcePositionOfMapping, ts.compareValues);
            if (targetIndex < 0) {
                // if no exact match, closest is 2's complement of result
                targetIndex = ~targetIndex;
            }
            const mapping = sourceMappings[targetIndex];
            if (mapping === undefined || mapping.sourceIndex !== sourceIndex) {
                return loc;
            }
            return { fileName: generatedAbsoluteFilePath, pos: mapping.generatedPosition }; // Closest pos
        }
        function getSourcePosition(loc: ts.DocumentPosition): ts.DocumentPosition {
            const generatedMappings = getGeneratedMappings();
            if (!ts.some(generatedMappings))
                return loc;
            let targetIndex = ts.binarySearchKey(generatedMappings, loc.pos, getGeneratedPositionOfMapping, ts.compareValues);
            if (targetIndex < 0) {
                // if no exact match, closest is 2's complement of result
                targetIndex = ~targetIndex;
            }
            const mapping = generatedMappings[targetIndex];
            if (mapping === undefined || !isSourceMappedPosition(mapping)) {
                return loc;
            }
            return { fileName: sourceFileAbsolutePaths[mapping.sourceIndex], pos: mapping.sourcePosition }; // Closest pos
        }
    }
    export const identitySourceMapConsumer: ts.DocumentPositionMapper = {
        getSourcePosition: ts.identity,
        getGeneratedPosition: ts.identity
    };
}
