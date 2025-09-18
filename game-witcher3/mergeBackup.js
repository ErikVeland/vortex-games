"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeOnContextImport = exports.importScriptMerges = exports.exportScriptMerges = exports.queryScriptMerges = exports.restoreFromProfile = exports.storeToProfile = void 0;
const lodash_1 = __importDefault(require("lodash"));
const path_1 = __importDefault(require("path"));
const turbowalk_1 = __importDefault(require("turbowalk"));
const vortex_api_1 = require("vortex-api");
const common_1 = require("./common");
const shortid_1 = require("shortid");
const util_1 = require("./collections/util");
const mergeInventoryParsing_1 = require("./mergeInventoryParsing");
const scriptmerger_1 = require("./scriptmerger");
const util_2 = require("./util");
const sortInc = (lhs, rhs) => lhs.length - rhs.length;
const sortDec = (lhs, rhs) => rhs.length - lhs.length;
function genBaseProps(api, profileId, force) {
    var _a;
    if (!profileId) {
        return undefined;
    }
    const state = api.getState();
    const profile = vortex_api_1.selectors.profileById(state, profileId);
    if ((profile === null || profile === void 0 ? void 0 : profile.gameId) !== common_1.GAME_ID) {
        return undefined;
    }
    const localMergedScripts = (force) ? true : vortex_api_1.util.getSafe(state, ['persistent', 'profiles', profileId, 'features', 'local_merges'], false);
    if (!localMergedScripts) {
        return undefined;
    }
    const discovery = vortex_api_1.util.getSafe(state, ['settings', 'gameMode', 'discovered', common_1.GAME_ID], undefined);
    const scriptMergerTool = (_a = discovery === null || discovery === void 0 ? void 0 : discovery.tools) === null || _a === void 0 ? void 0 : _a[common_1.SCRIPT_MERGER_ID];
    if (!(scriptMergerTool === null || scriptMergerTool === void 0 ? void 0 : scriptMergerTool.path)) {
        return undefined;
    }
    return { api, state, profile, scriptMergerTool, gamePath: discovery.path };
}
function getFileEntries(filePath) {
    let files = [];
    return (0, turbowalk_1.default)(filePath, entries => {
        const validEntries = entries.filter(entry => !entry.isDirectory)
            .map(entry => entry.filePath);
        files = files.concat(validEntries);
    }, { recurse: true })
        .catch(err => ['ENOENT', 'ENOTFOUND'].includes(err.code)
        ? Promise.resolve()
        : Promise.reject(err))
        .then(() => Promise.resolve(files));
}
function moveFile(from, to, fileName) {
    return __awaiter(this, void 0, void 0, function* () {
        const src = path_1.default.join(from, fileName);
        const dest = path_1.default.join(to, fileName);
        try {
            yield copyFile(src, dest);
        }
        catch (err) {
            return (err.code !== 'ENOENT')
                ? Promise.reject(err)
                : Promise.resolve();
        }
    });
}
function removeFile(filePath) {
    return __awaiter(this, void 0, void 0, function* () {
        if (path_1.default.extname(filePath) === '') {
            return;
        }
        try {
            yield vortex_api_1.fs.removeAsync(filePath);
        }
        catch (err) {
            return (err.code === 'ENOENT')
                ? Promise.resolve()
                : Promise.reject(err);
        }
    });
}
function copyFile(src, dest) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield vortex_api_1.fs.ensureDirWritableAsync(path_1.default.dirname(dest));
            yield removeFile(dest);
            yield vortex_api_1.fs.copyAsync(src, dest);
        }
        catch (err) {
            return Promise.reject(err);
        }
    });
}
function moveFiles(src, dest, props) {
    return __awaiter(this, void 0, void 0, function* () {
        const t = props.api.translate;
        const removeDestFiles = () => __awaiter(this, void 0, void 0, function* () {
            try {
                const destFiles = yield getFileEntries(dest);
                destFiles.sort(sortDec);
                for (const destFile of destFiles) {
                    yield vortex_api_1.fs.removeAsync(destFile);
                }
            }
            catch (err) {
                if (['EPERM'].includes(err.code)) {
                    return props.api.showDialog('error', 'Failed to restore merged files', {
                        bbcode: t('Vortex encountered a permissions related error while attempting '
                            + 'to replace:{{bl}}"{{filePath}}"{{bl}}'
                            + 'Please try to resolve any permissions related issues and return to this '
                            + 'dialog when you think you managed to fix it. There are a couple of things '
                            + 'you can try to fix this:[br][/br][list][*] Close/Disable any applications that may '
                            + 'interfere with Vortex\'s operations such as the game itself, the witcher script merger, '
                            + 'any external modding tools, any anti-virus software. '
                            + '[*] Ensure that your Windows user account has full read/write permissions to the file specified '
                            + '[/list]', { replace: { filePath: err.path, bl: '[br][/br][br][/br]' } }),
                    }, [
                        { label: 'Cancel', action: () => Promise.reject(new vortex_api_1.util.UserCanceled()) },
                        { label: 'Try Again', action: () => removeDestFiles() },
                    ]);
                }
                else {
                    return Promise.reject(new vortex_api_1.util.ProcessCanceled(err.message));
                }
            }
        });
        yield removeDestFiles();
        const copied = [];
        try {
            const srcFiles = yield getFileEntries(src);
            srcFiles.sort(sortInc);
            for (const srcFile of srcFiles) {
                const relPath = path_1.default.relative(src, srcFile);
                const targetPath = path_1.default.join(dest, relPath);
                try {
                    yield copyFile(srcFile, targetPath);
                    copied.push(targetPath);
                }
                catch (err) {
                    (0, vortex_api_1.log)('error', 'failed to move file', err);
                }
            }
        }
        catch (err) {
            if (!!err.path && !err.path.includes(dest)) {
                return;
            }
            copied.sort(sortDec);
            for (const link of copied) {
                yield vortex_api_1.fs.removeAsync(link);
            }
        }
    });
}
function backupPath(profile) {
    return path_1.default.join(vortex_api_1.util.getVortexPath('userData'), profile.gameId, 'profiles', profile.id, 'backup');
}
function handleMergedScripts(props, opType, dest) {
    return __awaiter(this, void 0, void 0, function* () {
        const { scriptMergerTool, profile, gamePath } = props;
        if (!(scriptMergerTool === null || scriptMergerTool === void 0 ? void 0 : scriptMergerTool.path)) {
            return Promise.reject(new vortex_api_1.util.NotFound('Script merging tool path'));
        }
        if (!(profile === null || profile === void 0 ? void 0 : profile.id)) {
            return Promise.reject(new vortex_api_1.util.ArgumentInvalid('invalid profile'));
        }
        try {
            const mergerToolDir = path_1.default.dirname(scriptMergerTool.path);
            const profilePath = (dest === undefined)
                ? path_1.default.join(mergerToolDir, profile.id)
                : dest;
            const loarOrderFilepath = (0, common_1.getLoadOrderFilePath)();
            const mergedModName = yield (0, scriptmerger_1.getMergedModName)(mergerToolDir);
            const mergedScriptsPath = path_1.default.join(gamePath, 'Mods', mergedModName);
            yield vortex_api_1.fs.ensureDirWritableAsync(mergedScriptsPath);
            if (opType === 'export') {
                yield moveFile(mergerToolDir, profilePath, common_1.MERGE_INV_MANIFEST);
                yield moveFile(path_1.default.dirname(loarOrderFilepath), profilePath, path_1.default.basename(loarOrderFilepath));
                yield moveFiles(mergedScriptsPath, path_1.default.join(profilePath, mergedModName), props);
            }
            else if (opType === 'import') {
                yield moveFile(profilePath, mergerToolDir, common_1.MERGE_INV_MANIFEST);
                yield moveFile(profilePath, path_1.default.dirname(loarOrderFilepath), path_1.default.basename(loarOrderFilepath));
                yield moveFiles(path_1.default.join(profilePath, mergedModName), mergedScriptsPath, props);
            }
            return Promise.resolve();
        }
        catch (err) {
            (0, vortex_api_1.log)('error', 'failed to store/restore merged scripts', err);
            return Promise.reject(err);
        }
    });
}
function storeToProfile(api, profileId) {
    return __awaiter(this, void 0, void 0, function* () {
        const props = genBaseProps(api, profileId);
        if (props === undefined) {
            return;
        }
        const bakPath = backupPath(props.profile);
        try {
            yield handleMergedScripts(props, 'export', bakPath);
        }
        catch (err) {
            return Promise.reject(err);
        }
        return handleMergedScripts(props, 'export');
    });
}
exports.storeToProfile = storeToProfile;
function restoreFromProfile(api, profileId) {
    return __awaiter(this, void 0, void 0, function* () {
        const props = genBaseProps(api, profileId);
        if (props === undefined) {
            return;
        }
        const bakPath = backupPath(props.profile);
        try {
            yield handleMergedScripts(props, 'import', bakPath);
        }
        catch (err) {
            return Promise.reject(err);
        }
        return handleMergedScripts(props, 'import');
    });
}
exports.restoreFromProfile = restoreFromProfile;
function queryScriptMerges(api, includedModIds, collection) {
    return __awaiter(this, void 0, void 0, function* () {
        const state = api.getState();
        const mods = vortex_api_1.util.getSafe(state, ['persistent', 'mods', common_1.GAME_ID], {});
        const modTypes = vortex_api_1.selectors.modPathsForGame(state, common_1.GAME_ID);
        const deployment = yield (0, util_2.getDeployment)(api, includedModIds);
        const deployedNames = Object.keys(modTypes).reduce((accum, typeId) => {
            const modPath = modTypes[typeId];
            const files = deployment[typeId];
            const isRootMod = modPath.toLowerCase().split(path_1.default.sep).indexOf('mods') === -1;
            const names = files.map(file => {
                const nameSegments = file.relPath.split(path_1.default.sep);
                if (isRootMod) {
                    const nameIdx = nameSegments.map(seg => seg.toLowerCase()).indexOf('mods') + 1;
                    return (nameIdx > 0)
                        ? nameSegments[nameIdx]
                        : undefined;
                }
                else {
                    return nameSegments[0];
                }
            });
            accum = accum.concat(names.filter(name => !!name));
            return accum;
        }, []);
        const uniqueDeployed = Array.from(new Set(deployedNames));
        const merged = yield (0, mergeInventoryParsing_1.getNamesOfMergedMods)(api);
        const diff = lodash_1.default.difference(merged, uniqueDeployed);
        const isOptional = (modId) => {
            var _a;
            return ((_a = collection.rules) !== null && _a !== void 0 ? _a : []).find(rule => {
                const mod = mods[modId];
                if (mod === undefined) {
                    return false;
                }
                const validType = ['recommends'].includes(rule.type);
                if (!validType) {
                    return false;
                }
                const matchedRule = vortex_api_1.util.testModReference(mod, rule.reference);
                return matchedRule;
            }) !== undefined;
        };
        const optionalMods = includedModIds.filter(isOptional);
        if (optionalMods.length > 0 || diff.length !== 0) {
            throw new common_1.MergeDataViolationError(diff || [], optionalMods || [], vortex_api_1.util.renderModName(collection));
        }
    });
}
exports.queryScriptMerges = queryScriptMerges;
function exportScriptMerges(api, profileId, includedModIds, collection) {
    return __awaiter(this, void 0, void 0, function* () {
        const props = genBaseProps(api, profileId, true);
        if (props === undefined) {
            return;
        }
        const exportMergedData = () => __awaiter(this, void 0, void 0, function* () {
            try {
                const tempPath = path_1.default.join(common_1.W3_TEMP_DATA_DIR, (0, shortid_1.generate)());
                yield vortex_api_1.fs.ensureDirWritableAsync(tempPath);
                yield handleMergedScripts(props, 'export', tempPath);
                const data = yield (0, util_1.prepareFileData)(tempPath);
                return Promise.resolve(data);
            }
            catch (err) {
                return Promise.reject(err);
            }
        });
        try {
            yield queryScriptMerges(api, includedModIds, collection);
            return exportMergedData();
        }
        catch (err) {
            if (err instanceof common_1.MergeDataViolationError) {
                const violationError = err;
                const optional = violationError.Optional;
                const notIncluded = violationError.NotIncluded;
                const optionalSegment = (optional.length > 0)
                    ? 'Marked as "optional" but need to be marked "required":{{br}}[list]'
                        + optional.map(opt => `[*]${opt}`) + '[/list]{{br}}'
                    : '';
                const notIncludedSegment = (notIncluded.length > 0)
                    ? 'No longer part of the collection and need to be re-added:{{br}}[list]'
                        + notIncluded.map(ni => `[*]${ni}`) + '[/list]{{br}}'
                    : '';
                return api.showDialog('question', 'Potential merged data mismatch', {
                    bbcode: 'Your collection includes a script merge that is referencing mods '
                        + `that are...{{bl}} ${notIncludedSegment}${optionalSegment}`
                        + 'For the collection to function correctly you will need to address the '
                        + 'above or re-run the Script Merger to remove traces of merges referencing '
                        + 'these mods. Please, do only proceed to upload the collection/revision as '
                        + 'is if you intend to upload the script merge as is and if the reference for '
                        + 'the merge will e.g. be acquired from an external source as part of the collection.',
                    parameters: { br: '[br][/br]', bl: '[br][/br][br][/br]' },
                }, [
                    { label: 'Cancel' },
                    { label: 'Upload Collection' }
                ]).then(res => (res.action === 'Cancel')
                    ? Promise.reject(new vortex_api_1.util.UserCanceled)
                    : exportMergedData());
            }
            return Promise.reject(err);
        }
    });
}
exports.exportScriptMerges = exportScriptMerges;
function importScriptMerges(api, profileId, fileData) {
    return __awaiter(this, void 0, void 0, function* () {
        const props = genBaseProps(api, profileId, true);
        if (props === undefined) {
            return;
        }
        const res = yield api.showDialog('question', 'Script Merges Import', {
            text: 'The collection you are importing contains script merges which the creator of '
                + 'the collection deemed necessary for the mods to function correctly. Please note that '
                + 'importing these will overwrite any existing script merges you may have effectuated. '
                + 'Please ensure to back up any existing merges (if applicable/required) before '
                + 'proceeding.',
        }, [
            { label: 'Cancel' },
            { label: 'Import Merges' },
        ], 'import-w3-script-merges-warning');
        if (res.action === 'Cancel') {
            return Promise.reject(new vortex_api_1.util.UserCanceled());
        }
        try {
            const tempPath = path_1.default.join(common_1.W3_TEMP_DATA_DIR, (0, shortid_1.generate)());
            yield vortex_api_1.fs.ensureDirWritableAsync(tempPath);
            const data = yield (0, util_1.restoreFileData)(fileData, tempPath);
            yield handleMergedScripts(props, 'import', tempPath);
            api.sendNotification({
                message: 'Script merges imported successfully',
                id: 'witcher3-script-merges-status',
                type: 'success',
            });
            return data;
        }
        catch (err) {
            return Promise.reject(err);
        }
    });
}
exports.importScriptMerges = importScriptMerges;
function makeOnContextImport(api, collectionId) {
    return __awaiter(this, void 0, void 0, function* () {
        const state = api.getState();
        const mods = vortex_api_1.util.getSafe(state, ['persistent', 'mods', common_1.GAME_ID], {});
        const collectionMod = mods[collectionId];
        if ((collectionMod === null || collectionMod === void 0 ? void 0 : collectionMod.installationPath) === undefined) {
            (0, vortex_api_1.log)('error', 'collection mod is missing', collectionId);
            return;
        }
        const stagingFolder = vortex_api_1.selectors.installPathForGame(state, common_1.GAME_ID);
        try {
            const fileData = yield vortex_api_1.fs.readFileAsync(path_1.default.join(stagingFolder, collectionMod.installationPath, 'collection.json'), { encoding: 'utf8' });
            const collection = JSON.parse(fileData);
            const { scriptMergedData } = collection.mergedData;
            if (scriptMergedData !== undefined) {
                const scriptMergerTool = vortex_api_1.util.getSafe(state, ['settings', 'gameMode', 'discovered', common_1.GAME_ID, 'tools', common_1.SCRIPT_MERGER_ID], undefined);
                if (scriptMergerTool === undefined) {
                    yield (0, scriptmerger_1.downloadScriptMerger)(api);
                }
                const profileId = vortex_api_1.selectors.lastActiveProfileForGame(state, common_1.GAME_ID);
                yield importScriptMerges(api, profileId, (0, util_1.hex2Buffer)(scriptMergedData));
            }
        }
        catch (err) {
            if (!(err instanceof vortex_api_1.util.UserCanceled)) {
                api.showErrorNotification('Failed to import script merges', err);
            }
        }
    });
}
exports.makeOnContextImport = makeOnContextImport;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWVyZ2VCYWNrdXAuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJtZXJnZUJhY2t1cC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7QUFDQSxvREFBdUI7QUFDdkIsZ0RBQXdCO0FBQ3hCLDBEQUFrQztBQUNsQywyQ0FBNkQ7QUFFN0QscUNBQ2dGO0FBRWhGLHFDQUFtQztBQUVuQyw2Q0FBa0Y7QUFFbEYsbUVBQStEO0FBRS9ELGlEQUF3RTtBQUV4RSxpQ0FBdUM7QUFhdkMsTUFBTSxPQUFPLEdBQUcsQ0FBQyxHQUFXLEVBQUUsR0FBVyxFQUFFLEVBQUUsQ0FBQyxHQUFHLENBQUMsTUFBTSxHQUFHLEdBQUcsQ0FBQyxNQUFNLENBQUM7QUFDdEUsTUFBTSxPQUFPLEdBQUcsQ0FBQyxHQUFXLEVBQUUsR0FBVyxFQUFFLEVBQUUsQ0FBQyxHQUFHLENBQUMsTUFBTSxHQUFHLEdBQUcsQ0FBQyxNQUFNLENBQUM7QUFFdEUsU0FBUyxZQUFZLENBQUMsR0FBd0IsRUFDeEIsU0FBaUIsRUFBRSxLQUFlOztJQUN0RCxJQUFJLENBQUMsU0FBUyxFQUFFO1FBQ2QsT0FBTyxTQUFTLENBQUM7S0FDbEI7SUFDRCxNQUFNLEtBQUssR0FBRyxHQUFHLENBQUMsUUFBUSxFQUFFLENBQUM7SUFDN0IsTUFBTSxPQUFPLEdBQW1CLHNCQUFTLENBQUMsV0FBVyxDQUFDLEtBQUssRUFBRSxTQUFTLENBQUMsQ0FBQztJQUN4RSxJQUFJLENBQUEsT0FBTyxhQUFQLE9BQU8sdUJBQVAsT0FBTyxDQUFFLE1BQU0sTUFBSyxnQkFBTyxFQUFFO1FBQy9CLE9BQU8sU0FBUyxDQUFDO0tBQ2xCO0lBRUQsTUFBTSxrQkFBa0IsR0FBWSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLGlCQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssRUFDckUsQ0FBQyxZQUFZLEVBQUUsVUFBVSxFQUFFLFNBQVMsRUFBRSxVQUFVLEVBQUUs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TyxDQUFDLEtBQUssRUFDekMsQ0FBQyxVQUFVLEVBQUUsVUFBVSxFQUFFLFlBQVksRUFBRSxnQkFBTyxFQUFFLE9BQU8sRUFBRSx5QkFBZ0IsQ0FBQyxFQUFFLFNBQVMsQ0FBQyxDQUFDO2dCQUN6RixJQUFJLGdCQUFnQixLQUFLLFNBQVMsRUFBRTtvQkFDbEMsTUFBTSxJQUFBLG1DQUFvQixFQUFDLEdBQUcsQ0FBQyxDQUFDO2lCQUNqQztnQkFDRCxNQUFNLFNBQVMsR0FBRyxzQkFBUyxDQUFDLHdCQUF3QixDQUFDLEtBQUssRUFBRSxnQkFBTyxDQUFDLENBQUM7Z0JBQ3JFLE1BQU0sa0JBQWtCLENBQUMsR0FBRyxFQUFFLFNBQVMsRUFBRSxJQUFBLGlCQUFVLEVBQUMsZ0JBQWdCLENBQUMsQ0FBQyxDQUFDO2FBQ3hFO1NBQ0Y7UUFBQyxPQUFPLEdBQUcsRUFBRTtZQUNaLElBQUksQ0FBQyxDQUFDLEdBQUcsWUFBWSxpQkFBSSxDQUFDLFlBQVksQ0FBQyxFQUFFO2dCQUN2QyxHQUFHLENBQUMscUJBQXFCLENBQUMsZ0NBQWdDLEVBQUUsR0FBRyxDQUFDLENBQUM7YUFDbEU7U0FDRjtJQUNILENBQUM7Q0FBQTtBQTdCRCxrREE2QkMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiBlc2xpbnQtZGlzYWJsZSAqL1xuaW1wb3J0IF8gZnJvbSAnbG9kYXNoJztcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0IHR1cmJvd2FsayBmcm9tICd0dXJib3dhbGsnO1xuaW1wb3J0IHsgZnMsIGxvZywgc2VsZWN0b3JzLCB0eXBlcywgdXRpbCB9IGZyb20gJ3ZvcnRleC1hcGknO1xuXG5pbXBvcnQgeyBHQU1FX0lELCBnZXRMb2FkT3JkZXJGaWxlUGF0aCwgTUVSR0VfSU5WX01BTklGRVNULFxuICBTQ1JJUFRfTUVSR0VSX0lELCBXM19URU1QX0RBVEFfRElSLCBNZXJnZURhdGFWaW9sYXRpb25FcnJvciB9IGZyb20gJy4vY29tbW9uJztcblxuaW1wb3J0IHsgZ2VuZXJhdGUgfSBmcm9tICdzaG9ydGlkJztcblxuaW1wb3J0IHsgaGV4MkJ1ZmZlciwgcHJlcGFyZUZpbGVEYXRhLCByZXN0b3JlRmlsZURhdGEgfSBmcm9tICcuL2NvbGxlY3Rpb25zL3V0aWwnO1xuXG5pbXBvcnQgeyBnZXROYW1lc09mTWVyZ2VkTW9kcyB9IGZyb20gJy4vbWVyZ2VJbnZlbnRvcnlQYXJzaW5nJztcblxuaW1wb3J0IHsgZ2V0TWVyZ2VkTW9kTmFtZSwgZG93bmxvYWRTY3JpcHRNZXJnZXIgfSBmcm9tICcuL3NjcmlwdG1lcmdlcic7XG5cbmltcG9ydCB7IGdldERlcGxveW1lbnQgfSBmcm9tICcuL3V0aWwnO1xuXG5pbXBvcnQgeyBJRGVwbG95ZWRGaWxlLCBJRGVwbG95bWVudCB9IGZyb20gJy4vdHlwZXMnO1xuXG50eXBlIE9wVHlwZSA9ICdpbXBvcnQnIHwgJ2V4cG9ydCc7XG5pbnRlcmZhY2UgSUJhc2VQcm9wcyB7XG4gIGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaTtcbiAgc3RhdGU6IHR5cGVzLklTdGF0ZTtcbiAgcHJvZmlsZTogdHlwZXMuSVByb2ZpbGU7XG4gIHNjcmlwdE1lcmdlclRvb2w6IHR5cGVzLklEaXNjb3ZlcmVkVG9vbDtcbiAgZ2FtZVBhdGg6IHN0cmluZztcbn1cblxuY29uc3Qgc29ydEluYyA9IChsaHM6IHN0cmluZywgcmhzOiBzdHJpbmcpID0+IGxocy5sZW5ndGggLSByaHMubGVuZ3RoO1xuY29uc3Qgc29ydERlYyA9IChsaHM6IHN0cmluZywgcmhzOiBzdHJpbmcpID0+IHJocy5sZW5ndGggLSBsaHMubGVuZ3RoO1xuXG5mdW5jdGlvbiBnZW5CYXNlUHJvcHMoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpLFxuICAgICAgICAgICAgICAgICAgICAgIHByb2ZpbGVJZDogc3RyaW5nLCBmb3JjZT86IGJvb2xlYW4pOiBJQmFzZVByb3BzIHtcbiAgaWYgKCFwcm9maWxlSWQpIHtcbiAgICByZXR1cm4gdW5kZWZpbmVkO1xuICB9XG4gIGNvbnN0IHN0YXRlID0gYXBpLmdldFN0YXRlKCk7XG4gIGNvbnN0IHByb2ZpbGU6IHR5cGVzLklQcm9maWxlID0gc2VsZWN0b3JzLnByb2ZpbGVCeUlkKHN0YXRlLCBwcm9maWxlSWQpO1xuICBpZiAocHJvZmlsZT8uZ2FtZUlkICE9PSBHQU1FX0lEKSB7XG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgfVxuXG4gIGNvbnN0IGxvY2FsTWVyZ2VkU2NyaXB0czogYm9vbGVhbiA9IChmb3JjZSkgPyB0cnVlIDogdXRpbC5nZXRTYWZlKHN0YXRlLFxuICAgIFsncGVyc2lzdGVudCcsICdwcm9maWxlcycsIHByb2ZpbGVJZCwgJ2ZlYXR1cmVzJywgJ2xvY2FsX21lcmdlcyddLCBmYWxzZSk7XG4gIGlmICghbG9jYWxNZXJnZWRTY3JpcHRzKSB7XG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgfVxuXG4gIGNvbnN0IGRpc2NvdmVyeTogdHlwZXMuSURpc2NvdmVyeVJlc3VsdCA9IHV0aWwuZ2V0U2FmZShzdGF0ZSxcbiAgICBbJ3NldHRpbmdzJywgJ2dhbWVNb2RlJywgJ2Rpc2NvdmVyZWQnLCBHQU1FX0lEXSwgdW5kZWZpbmVkKTtcbiAgY29uc3Qgc2NyaXB0TWVyZ2VyVG9vbDogdHlwZXMuSURpc2NvdmVyZWRUb29sID0gZGlzY292ZXJ5Py50b29scz8uW1NDUklQVF9NRVJHRVJfSURdO1xuICBpZiAoIXNjcmlwdE1lcmdlclRvb2w/LnBhdGgpIHtcbiAgICAvLyBSZWdhcmRsZXNzIG9mIHRoZSB1c2VyJ3MgcHJvZmlsZSBzZXR0aW5ncyAtIHRoZXJlJ3Mgbm8gcG9pbnQgaW4gYmFja2luZyB1cFxuICAgIC8vICB0aGUgbWVyZ2VzIGlmIHdlIGRvbid0IGtub3cgd2hlcmUgdGhlIHNjcmlwdCBtZXJnZXIgaXMhXG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgfVxuXG4gIHJldHVybiB7IGFwaSwgc3RhdGUsIHByb2ZpbGUsIHNjcmlwdE1lcmdlclRvb2wsIGdhbWVQYXRoOiBkaXNjb3ZlcnkucGF0aCB9O1xufVxuXG5mdW5jdGlvbiBnZXRGaWxlRW50cmllcyhmaWxlUGF0aDogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmdbXT4ge1xuICBsZXQgZmlsZXM6IHN0cmluZ1tdID0gW107XG4gIHJldHVybiB0dXJib3dhbGsoZmlsZVBhdGgsIGVudHJpZXMgPT4ge1xuICAgIGNvbnN0IHZhbGlkRW50cmllcyA9IGVudHJpZXMuZmlsdGVyKGVudHJ5ID0+ICFlbnRyeS5pc0RpcmVjdG9yeSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLm1hcChlbnRyeSA9PiBlbnRyeS5maWxlUGF0aCk7XG4gICAgZmlsZXMgPSBmaWxlcy5jb25jYXQodmFsaWRFbnRyaWVzKTtcbiAgfSwgeyByZWN1cnNlOiB0cnVlIH0pXG4gIC5jYXRjaChlcnIgPT4gWydFTk9FTlQnLCAnRU5PVEZPVU5EJ10uaW5jbHVkZXMoZXJyLmNvZGUpXG4gICAgPyBQcm9taXNlLnJlc29sdmUoKVxuICAgIDogUHJvbWlzZS5yZWplY3QoZXJyKSlcbiAgLnRoZW4oKCkgPT4gUHJvbWlzZS5yZXNvbHZlKGZpbGVzKSk7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIG1vdmVGaWxlKGZyb206IHN0cmluZywgdG86IHN0cmluZywgZmlsZU5hbWU6IHN0cmluZykge1xuICBjb25zdCBzcmMgPSBwYXRoLmpvaW4oZnJvbSwgZmlsZU5hbWUpO1xuICBjb25zdCBkZXN0ID0gcGF0aC5qb2luKHRvLCBmaWxlTmFtZSk7XG4gIHRyeSB7XG4gICAgYXdhaXQgY29weUZpbGUoc3JjLCBkZXN0KTtcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgLy8gSXQncyBwZXJmZWN0bHkgcG9zc2libGUgZm9yIHRoZSB1c2VyIG5vdCB0byBoYXZlIGFueSBtZXJnZXMgeWV0LlxuICAgIHJldHVybiAoZXJyLmNvZGUgIT09ICdFTk9FTlQnKVxuICAgICAgPyBQcm9taXNlLnJlamVjdChlcnIpXG4gICAgICA6IFByb21pc2UucmVzb2x2ZSgpO1xuICB9XG59XG5cbmFzeW5jIGZ1bmN0aW9uIHJlbW92ZUZpbGUoZmlsZVBhdGg6IHN0cmluZykge1xuICBpZiAocGF0aC5leHRuYW1lKGZpbGVQYXRoKSA9PT0gJycpIHtcbiAgICByZXR1cm47XG4gIH1cbiAgdHJ5IHtcbiAgICBhd2FpdCBmcy5yZW1vdmVBc3luYyhmaWxlUGF0aCk7XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIHJldHVybiAoZXJyLmNvZGUgPT09ICdFTk9FTlQnKVxuICAgICAgPyBQcm9taXNlLnJlc29sdmUoKVxuICAgICAgOiBQcm9taXNlLnJlamVjdChlcnIpO1xuICB9XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGNvcHlGaWxlKHNyYzogc3RyaW5nLCBkZXN0OiBzdHJpbmcpIHtcbiAgdHJ5IHtcbiAgICBhd2FpdCBmcy5lbnN1cmVEaXJXcml0YWJsZUFzeW5jKHBhdGguZGlybmFtZShkZXN0KSk7XG4gICAgYXdhaXQgcmVtb3ZlRmlsZShkZXN0KTtcbiAgICBhd2FpdCBmcy5jb3B5QXN5bmMoc3JjLCBkZXN0KTtcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgcmV0dXJuIFByb21pc2UucmVqZWN0KGVycik7XG4gIH1cbn1cblxuYXN5bmMgZnVuY3Rpb24gbW92ZUZpbGVzKHNyYzogc3RyaW5nLCBkZXN0OiBzdHJpbmcsIHByb3BzOiBJQmFzZVByb3BzKSB7XG4gIGNvbnN0IHQgPSBwcm9wcy5hcGkudHJhbnNsYXRlO1xuICBjb25zdCByZW1vdmVEZXN0RmlsZXMgPSBhc3luYyAoKSA9PiB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IGRlc3RGaWxlczogc3RyaW5nW10gPSBhd2FpdCBnZXRGaWxlRW50cmllcyhkZXN0KTtcbiAgICAgIGRlc3RGaWxlcy5zb3J0KHNvcnREZWMpO1xuICAgICAgZm9yIChjb25zdCBkZXN0RmlsZSBvZiBkZXN0RmlsZXMpIHtcbiAgICAgICAgYXdhaXQgZnMucmVtb3ZlQXN5bmMoZGVzdEZpbGUpO1xuICAgICAgfVxuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgaWYgKFsnRVBFUk0nXS5pbmNsdWRlcyhlcnIuY29kZSkpIHtcbiAgICAgICAgcmV0dXJuIHByb3BzLmFwaS5zaG93RGlhbG9nKCdlcnJvcicsICdGYWlsZWQgdG8gcmVzdG9yZSBtZXJnZWQgZmlsZXMnLCB7XG4gICAgICAgICAgYmJjb2RlOiB0KCdWb3J0ZXggZW5jb3VudGVyZWQgYSBwZXJtaXNzaW9ucyByZWxhdGVkIGVycm9yIHdoaWxlIGF0dGVtcHRpbmcgJ1xuICAgICAgICAgICAgKyAndG8gcmVwbGFjZTp7e2JsfX1cInt7ZmlsZVBhdGh9fVwie3tibH19J1xuICAgICAgICAgICAgKyAnUGxlYXNlIHRyeSB0byByZXNvbHZlIGFueSBwZXJtaXNzaW9ucyByZWxhdGVkIGlzc3VlcyBhbmQgcmV0dXJuIHRvIHRoaXMgJ1xuICAgICAgICAgICAgKyAnZGlhbG9nIHdoZW4geW91IHRoaW5rIHlvdSBtYW5hZ2VkIHRvIGZpeCBpdC4gVGhlcmUgYXJlIGEgY291cGxlIG9mIHRoaW5ncyAnXG4gICAgICAgICAgICArICd5b3UgY2FuIHRyeSB0byBmaXggdGhpczpbYnJdWy9icl1bbGlzdF1bKl0gQ2xvc2UvRGlzYWJsZSBhbnkgYXBwbGljYXRpb25zIHRoYXQgbWF5ICdcbiAgICAgICAgICAgICsgJ2ludGVyZmVyZSB3aXRoIFZvcnRleFxcJ3Mgb3BlcmF0aW9ucyBzdWNoIGFzIHRoZSBnYW1lIGl0c2VsZiwgdGhlIHdpdGNoZXIgc2NyaXB0IG1lcmdlciwgJ1xuICAgICAgICAgICAgKyAnYW55IGV4dGVybmFsIG1vZGRpbmcgdG9vbHMsIGFueSBhbnRpLXZpcnVzIHNvZnR3YXJlLiAnXG4gICAgICAgICAgICArICdbKl0gRW5zdXJlIHRoYXQgeW91ciBXaW5kb3dzIHVzZXIgYWNjb3VudCBoYXMgZnVsbCByZWFkL3dyaXRlIHBlcm1pc3Npb25zIHRvIHRoZSBmaWxlIHNwZWNpZmllZCAnXG4gICAgICAgICAgICArICdbL2xpc3RdJywgeyByZXBsYWNlOiB7IGZpbGVQYXRoOiBlcnIucGF0aCwgYmw6ICdbYnJdWy9icl1bYnJdWy9icl0nIH0gfSksXG4gICAgICAgIH0sXG4gICAgICAgIFtcbiAgICAgICAgICB7IGxhYmVsOiAnQ2FuY2VsJywgYWN0aW9uOiAoKSA9PiBQcm9taXNlLnJlamVjdChuZXcgdXRpbC5Vc2VyQ2FuY2VsZWQoKSkgfSxcbiAgICAgICAgICB7IGxhYmVsOiAnVHJ5IEFnYWluJywgYWN0aW9uOiAoKSA9PiByZW1vdmVEZXN0RmlsZXMoKSB9LFxuICAgICAgICBdKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIFdlIGZhaWxlZCB0byBjbGVhbiB1cCB0aGUgZGVzdGluYXRpb24gZm9sZGVyIC0gd2UgY2FuJ3RcbiAgICAgICAgLy8gIGNvbnRpbnVlLlxuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IHV0aWwuUHJvY2Vzc0NhbmNlbGVkKGVyci5tZXNzYWdlKSk7XG4gICAgICB9XG4gICAgfVxuICB9O1xuXG4gIGF3YWl0IHJlbW92ZURlc3RGaWxlcygpO1xuICBjb25zdCBjb3BpZWQ6IHN0cmluZ1tdID0gW107XG4gIHRyeSB7XG4gICAgY29uc3Qgc3JjRmlsZXM6IHN0cmluZ1tdID0gYXdhaXQgZ2V0RmlsZUVudHJpZXMoc3JjKTtcbiAgICBzcmNGaWxlcy5zb3J0KHNvcnRJbmMpO1xuICAgIGZvciAoY29uc3Qgc3JjRmlsZSBvZiBzcmNGaWxlcykge1xuICAgICAgY29uc3QgcmVsUGF0aCA9IHBhdGgucmVsYXRpdmUoc3JjLCBzcmNGaWxlKTtcbiAgICAgIGNvbnN0IHRhcmdldFBhdGggPSBwYXRoLmpvaW4oZGVzdCwgcmVsUGF0aCk7XG4gICAgICB0cnkge1xuICAgICAgICBhd2FpdCBjb3B5RmlsZShzcmNGaWxlLCB0YXJnZXRQYXRoKTtcbiAgICAgICAgY29waWVkLnB1c2godGFyZ2V0UGF0aCk7XG4gICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgbG9nKCdlcnJvcicsICdmYWlsZWQgdG8gbW92ZSBmaWxlJywgZXJyKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBpZiAoY2xlYW5VcCkge1xuICAgIC8vICAgLy8gV2UgbWFuYWdlZCB0byBjb3B5IGFsbCB0aGUgZmlsZXMsIGNsZWFuIHVwIHRoZSBzb3VyY2VcbiAgICAvLyAgIHNyY0ZpbGVzLnNvcnQoc29ydERlYyk7XG4gICAgLy8gICBmb3IgKGNvbnN0IHNyY0ZpbGUgb2Ygc3JjRmlsZXMpIHtcbiAgICAvLyAgICAgYXdhaXQgZnMucmVtb3ZlQXN5bmMoc3JjRmlsZSk7XG4gICAgLy8gICB9XG4gICAgLy8gfVxuICB9IGNhdGNoIChlcnIpIHtcbiAgICBpZiAoISFlcnIucGF0aCAmJiAhZXJyLnBhdGguaW5jbHVkZXMoZGVzdCkpIHtcbiAgICAgIC8vIFdlIGZhaWxlZCB0byBjbGVhbiB1cCB0aGUgc291cmNlXG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gV2UgZmFpbGVkIHRvIGNvcHkgLSBjbGVhbiB1cC5cbiAgICBjb3BpZWQuc29ydChzb3J0RGVjKTtcbiAgICBmb3IgKGNvbnN0IGxpbmsgb2YgY29waWVkKSB7XG4gICAgICBhd2FpdCBmcy5yZW1vdmVBc3luYyhsaW5rKTtcbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gYmFja3VwUGF0aChwcm9maWxlOiB0eXBlcy5JUHJvZmlsZSk6IHN0cmluZyB7XG4gIHJldHVybiBwYXRoLmpvaW4odXRpbC5nZXRWb3J0ZXhQYXRoKCd1c2VyRGF0YScpLFxuICAgIHByb2ZpbGUuZ2FtZUlkLCAncHJvZmlsZXMnLCBwcm9maWxlLmlkLCAnYmFja3VwJyk7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGhhbmRsZU1lcmdlZFNjcmlwdHMocHJvcHM6IElCYXNlUHJvcHMsIG9wVHlwZTogT3BUeXBlLCBkZXN0Pzogc3RyaW5nKSB7XG4gIGNvbnN0IHsgc2NyaXB0TWVyZ2VyVG9vbCwgcHJvZmlsZSwgZ2FtZVBhdGggfSA9IHByb3BzO1xuICBpZiAoIXNjcmlwdE1lcmdlclRvb2w/LnBhdGgpIHtcbiAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IHV0aWwuTm90Rm91bmQoJ1NjcmlwdCBtZXJnaW5nIHRvb2wgcGF0aCcpKTtcbiAgfVxuICBpZiAoIXByb2ZpbGU/LmlkKSB7XG4gICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyB1dGlsLkFyZ3VtZW50SW52YWxpZCgnaW52YWxpZCBwcm9maWxlJykpO1xuICB9XG5cbiAgdHJ5IHtcbiAgICBjb25zdCBtZXJnZXJUb29sRGlyID0gcGF0aC5kaXJuYW1lKHNjcmlwdE1lcmdlclRvb2wucGF0aCk7XG4gICAgY29uc3QgcHJvZmlsZVBhdGg6IHN0cmluZyA9IChkZXN0ID09PSB1bmRlZmluZWQpXG4gICAgICA/IHBhdGguam9pbihtZXJnZXJUb29sRGlyLCBwcm9maWxlLmlkKVxuICAgICAgOiBkZXN0O1xuICAgIGNvbnN0IGxvYXJPcmRlckZpbGVwYXRoOiBzdHJpbmcgPSBnZXRMb2FkT3JkZXJGaWxlUGF0aCgpO1xuICAgIGNvbnN0IG1lcmdlZE1vZE5hbWUgPSBhd2FpdCBnZXRNZXJnZWRNb2ROYW1lKG1lcmdlclRvb2xEaXIpO1xuICAgIGNvbnN0IG1lcmdlZFNjcmlwdHNQYXRoID0gcGF0aC5qb2luKGdhbWVQYXRoLCAnTW9kcycsIG1lcmdlZE1vZE5hbWUpO1xuXG4gICAgLy8gSnVzdCBpbiBjYXNlIGl0J3MgbWlzc2luZy5cbiAgICBhd2FpdCBmcy5lbnN1cmVEaXJXcml0YWJsZUFzeW5jKG1lcmdlZFNjcmlwdHNQYXRoKTtcblxuICAgIGlmIChvcFR5cGUgPT09ICdleHBvcnQnKSB7XG4gICAgICBhd2FpdCBtb3ZlRmlsZShtZXJnZXJUb29sRGlyLCBwcm9maWxlUGF0aCwgTUVSR0VfSU5WX01BTklGRVNUKTtcbiAgICAgIGF3YWl0IG1vdmVGaWxlKHBhdGguZGlybmFtZShsb2FyT3JkZXJGaWxlcGF0aCksIHByb2ZpbGVQYXRoLCBwYXRoLmJhc2VuYW1lKGxvYXJPcmRlckZpbGVwYXRoKSk7XG4gICAgICBhd2FpdCBtb3ZlRmlsZXMobWVyZ2VkU2NyaXB0c1BhdGgsIHBhdGguam9pbihwcm9maWxlUGF0aCwgbWVyZ2VkTW9kTmFtZSksIHByb3BzKTtcbiAgICB9IGVsc2UgaWYgKG9wVHlwZSA9PT0gJ2ltcG9ydCcpIHtcbiAgICAgIGF3YWl0IG1vdmVGaWxlKHByb2ZpbGVQYXRoLCBtZXJnZXJUb29sRGlyLCBNRVJHRV9JTlZfTUFOSUZFU1QpO1xuICAgICAgYXdhaXQgbW92ZUZpbGUocHJvZmlsZVBhdGgsIHBhdGguZGlybmFtZShsb2FyT3JkZXJGaWxlcGF0aCksIHBhdGguYmFzZW5hbWUobG9hck9yZGVyRmlsZXBhdGgpKTtcbiAgICAgIGF3YWl0IG1vdmVGaWxlcyhwYXRoLmpvaW4ocHJvZmlsZVBhdGgsIG1lcmdlZE1vZE5hbWUpLCBtZXJnZWRTY3JpcHRzUGF0aCwgcHJvcHMpO1xuICAgIH1cbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIGxvZygnZXJyb3InLCAnZmFpbGVkIHRvIHN0b3JlL3Jlc3RvcmUgbWVyZ2VkIHNjcmlwdHMnLCBlcnIpO1xuICAgIHJldHVybiBQcm9taXNlLnJlamVjdChlcnIpO1xuICB9XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBzdG9yZVRvUHJvZmlsZShhcGk6IHR5cGVzLklFeHRlbnNpb25BcGksIHByb2ZpbGVJZDogc3RyaW5nKSB7XG4gIGNvbnN0IHByb3BzOiBJQmFzZVByb3BzID0gZ2VuQmFzZVByb3BzKGFwaSwgcHJvZmlsZUlkKTtcbiAgaWYgKHByb3BzID09PSB1bmRlZmluZWQpIHtcbiAgICByZXR1cm47XG4gIH1cblxuICBjb25zdCBiYWtQYXRoID0gYmFja3VwUGF0aChwcm9wcy5wcm9maWxlKTtcbiAgdHJ5IHtcbiAgICBhd2FpdCBoYW5kbGVNZXJnZWRTY3JpcHRzKHByb3BzLCAnZXhwb3J0JywgYmFrUGF0aCk7XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIHJldHVybiBQcm9taXNlLnJlamVjdChlcnIpO1xuICB9XG4gIHJldHVybiBoYW5kbGVNZXJnZWRTY3JpcHRzKHByb3BzLCAnZXhwb3J0Jyk7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiByZXN0b3JlRnJvbVByb2ZpbGUoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpLCBwcm9maWxlSWQ6IHN0cmluZykge1xuICBjb25zdCBwcm9wczogSUJhc2VQcm9wcyA9IGdlbkJhc2VQcm9wcyhhcGksIHByb2ZpbGVJZCk7XG4gIGlmIChwcm9wcyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgY29uc3QgYmFrUGF0aCA9IGJhY2t1cFBhdGgocHJvcHMucHJvZmlsZSk7XG4gIHRyeSB7XG4gICAgYXdhaXQgaGFuZGxlTWVyZ2VkU2NyaXB0cyhwcm9wcywgJ2ltcG9ydCcsIGJha1BhdGgpO1xuICB9IGNhdGNoIChlcnIpIHtcbiAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoZXJyKTtcbiAgfVxuICByZXR1cm4gaGFuZGxlTWVyZ2VkU2NyaXB0cyhwcm9wcywgJ2ltcG9ydCcpO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcXVlcnlTY3JpcHRNZXJnZXMoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluY2x1ZGVkTW9kSWRzOiBzdHJpbmdbXSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb2xsZWN0aW9uOiB0eXBlcy5JTW9kKSB7XG4gIGNvbnN0IHN0YXRlID0gYXBpLmdldFN0YXRlKCk7XG4gIGNvbnN0IG1vZHM6IHsgW21vZElkOiBzdHJpbmddOiB0eXBlcy5JTW9kIH0gPSB1dGlsLmdldFNhZmUoc3RhdGUsIFsncGVyc2lzdGVudCcsICdtb2RzJywgR0FNRV9JRF0sIHt9KTtcbiAgY29uc3QgbW9kVHlwZXM6IHsgW3R5cGVJZDogc3RyaW5nXTogc3RyaW5nIH0gPSBzZWxlY3RvcnMubW9kUGF0aHNGb3JHYW1lKHN0YXRlLCBHQU1FX0lEKTtcbiAgY29uc3QgZGVwbG95bWVudDogSURlcGxveW1lbnQgPSBhd2FpdCBnZXREZXBsb3ltZW50KGFwaSwgaW5jbHVkZWRNb2RJZHMpO1xuICBjb25zdCBkZXBsb3llZE5hbWVzOiBzdHJpbmdbXSA9IE9iamVjdC5rZXlzKG1vZFR5cGVzKS5yZWR1Y2UoKGFjY3VtLCB0eXBlSWQpID0+IHtcbiAgICBjb25zdCBtb2RQYXRoID0gbW9kVHlwZXNbdHlwZUlkXTtcbiAgICBjb25zdCBmaWxlczogSURlcGxveWVkRmlsZVtdID0gZGVwbG95bWVudFt0eXBlSWRdO1xuICAgIGNvbnN0IGlzUm9vdE1vZCA9IG1vZFBhdGgudG9Mb3dlckNhc2UoKS5zcGxpdChwYXRoLnNlcCkuaW5kZXhPZignbW9kcycpID09PSAtMTtcbiAgICBjb25zdCBuYW1lcyA9IGZpbGVzLm1hcChmaWxlID0+IHtcbiAgICAgIGNvbnN0IG5hbWVTZWdtZW50cyA9IGZpbGUucmVsUGF0aC5zcGxpdChwYXRoLnNlcCk7XG4gICAgICBpZiAoaXNSb290TW9kKSB7XG4gICAgICAgIGNvbnN0IG5hbWVJZHggPSBuYW1lU2VnbWVudHMubWFwKHNlZyA9PiBzZWcudG9Mb3dlckNhc2UoKSkuaW5kZXhPZignbW9kcycpICsgMTtcbiAgICAgICAgcmV0dXJuIChuYW1lSWR4ID4gMClcbiAgICAgICAgICA/IG5hbWVTZWdtZW50c1tuYW1lSWR4XVxuICAgICAgICAgIDogdW5kZWZpbmVkO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIG5hbWVTZWdtZW50c1swXTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICBhY2N1bSA9IGFjY3VtLmNvbmNhdChuYW1lcy5maWx0ZXIobmFtZSA9PiAhIW5hbWUpKTtcbiAgICByZXR1cm4gYWNjdW07XG4gIH0sIFtdKTtcbiAgY29uc3QgdW5pcXVlRGVwbG95ZWQgPSBBcnJheS5mcm9tKG5ldyBTZXQoZGVwbG95ZWROYW1lcykpO1xuICBjb25zdCBtZXJnZWQgPSBhd2FpdCBnZXROYW1lc09mTWVyZ2VkTW9kcyhhcGkpO1xuICBjb25zdCBkaWZmID0gXy5kaWZmZXJlbmNlKG1lcmdlZCwgdW5pcXVlRGVwbG95ZWQpO1xuICBjb25zdCBpc09wdGlvbmFsID0gKG1vZElkOiBzdHJpbmcpID0+IChjb2xsZWN0aW9uLnJ1bGVzID8/IFtdKS5maW5kKHJ1bGUgPT4ge1xuICAgIGNvbnN0IG1vZDogdHlwZXMuSU1vZCA9IG1vZHNbbW9kSWRdO1xuICAgIGlmIChtb2QgPT09IHVuZGVmaW5lZCkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBjb25zdCB2YWxpZFR5cGUgPSBbJ3JlY29tbWVuZHMnXS5pbmNsdWRlcyhydWxlLnR5cGUpO1xuICAgIGlmICghdmFsaWRUeXBlKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIGNvbnN0IG1hdGNoZWRSdWxlID0gdXRpbC50ZXN0TW9kUmVmZXJlbmNlKG1vZCwgcnVsZS5yZWZlcmVuY2UpO1xuICAgIHJldHVybiBtYXRjaGVkUnVsZTtcbiAgfSkgIT09IHVuZGVmaW5lZDtcbiAgY29uc3Qgb3B0aW9uYWxNb2RzID0gaW5jbHVkZWRNb2RJZHMuZmlsdGVyKGlzT3B0aW9uYWwpO1xuICBpZiAob3B0aW9uYWxNb2RzLmxlbmd0aCA+IDAgfHwgZGlmZi5sZW5ndGggIT09IDApIHtcbiAgICB0aHJvdyBuZXcgTWVyZ2VEYXRhVmlvbGF0aW9uRXJyb3IoZGlmZiB8fCBbXSxcbiAgICAgIG9wdGlvbmFsTW9kcyB8fCBbXSwgdXRpbC5yZW5kZXJNb2ROYW1lKGNvbGxlY3Rpb24pKTtcbiAgfVxufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZXhwb3J0U2NyaXB0TWVyZ2VzKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvZmlsZUlkOiBzdHJpbmcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluY2x1ZGVkTW9kSWRzOiBzdHJpbmdbXSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29sbGVjdGlvbjogdHlwZXMuSU1vZCkge1xuICBjb25zdCBwcm9wczogSUJhc2VQcm9wcyA9IGdlbkJhc2VQcm9wcyhhcGksIHByb2ZpbGVJZCwgdHJ1ZSk7XG4gIGlmIChwcm9wcyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgY29uc3QgZXhwb3J0TWVyZ2VkRGF0YSA9IGFzeW5jICgpID0+IHtcbiAgICB0cnkge1xuICAgICAgY29uc3QgdGVtcFBhdGggPSBwYXRoLmpvaW4oVzNfVEVNUF9EQVRBX0RJUiwgZ2VuZXJhdGUoKSk7XG4gICAgICBhd2FpdCBmcy5lbnN1cmVEaXJXcml0YWJsZUFzeW5jKHRlbXBQYXRoKTtcbiAgICAgIGF3YWl0IGhhbmRsZU1lcmdlZFNjcmlwdHMocHJvcHMsICdleHBvcnQnLCB0ZW1wUGF0aCk7XG4gICAgICBjb25zdCBkYXRhID0gYXdhaXQgcHJlcGFyZUZpbGVEYXRhKHRlbXBQYXRoKTtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoZGF0YSk7XG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoZXJyKTtcbiAgICB9XG4gIH07XG5cbiAgdHJ5IHtcbiAgICBhd2FpdCBxdWVyeVNjcmlwdE1lcmdlcyhhcGksIGluY2x1ZGVkTW9kSWRzLCBjb2xsZWN0aW9uKTtcbiAgICByZXR1cm4gZXhwb3J0TWVyZ2VkRGF0YSgpO1xuICB9IGNhdGNoIChlcnIpIHtcbiAgICBpZiAoZXJyIGluc3RhbmNlb2YgTWVyZ2VEYXRhVmlvbGF0aW9uRXJyb3IpIHtcbiAgICAgIGNvbnN0IHZpb2xhdGlvbkVycm9yID0gKGVyciBhcyBNZXJnZURhdGFWaW9sYXRpb25FcnJvcik7XG4gICAgICBjb25zdCBvcHRpb25hbCA9IHZpb2xhdGlvbkVycm9yLk9wdGlvbmFsO1xuICAgICAgY29uc3Qgbm90SW5jbHVkZWQgPSB2aW9sYXRpb25FcnJvci5Ob3RJbmNsdWRlZDtcbiAgICAgIGNvbnN0IG9wdGlvbmFsU2VnbWVudCA9IChvcHRpb25hbC5sZW5ndGggPiAwKVxuICAgICAgICA/ICdNYXJrZWQgYXMgXCJvcHRpb25hbFwiIGJ1dCBuZWVkIHRvIGJlIG1hcmtlZCBcInJlcXVpcmVkXCI6e3ticn19W2xpc3RdJ1xuICAgICAgICAgICsgb3B0aW9uYWwubWFwKG9wdCA9PiBgWypdJHtvcHR9YCkgKyAnWy9saXN0XXt7YnJ9fSdcbiAgICAgICAgOiAnJztcbiAgICAgIGNvbnN0IG5vdEluY2x1ZGVkU2VnbWVudCA9IChub3RJbmNsdWRlZC5sZW5ndGggPiAwKVxuICAgICAgICA/ICdObyBsb25nZXIgcGFydCBvZiB0aGUgY29sbGVjdGlvbiBhbmQgbmVlZCB0byBiZSByZS1hZGRlZDp7e2JyfX1bbGlzdF0nXG4gICAgICAgICAgKyBub3RJbmNsdWRlZC5tYXAobmkgPT4gYFsqXSR7bml9YCkgKyAnWy9saXN0XXt7YnJ9fSdcbiAgICAgICAgOiAnJztcbiAgICAgIHJldHVybiBhcGkuc2hvd0RpYWxvZygncXVlc3Rpb24nLCAnUG90ZW50aWFsIG1lcmdlZCBkYXRhIG1pc21hdGNoJywge1xuICAgICAgICBiYmNvZGU6ICdZb3VyIGNvbGxlY3Rpb24gaW5jbHVkZXMgYSBzY3JpcHQgbWVyZ2UgdGhhdCBpcyByZWZlcmVuY2luZyBtb2RzICdcbiAgICAgICAgICArIGB0aGF0IGFyZS4uLnt7Ymx9fSAke25vdEluY2x1ZGVkU2VnbWVudH0ke29wdGlvbmFsU2VnbWVudH1gXG4gICAgICAgICAgKyAnRm9yIHRoZSBjb2xsZWN0aW9uIHRvIGZ1bmN0aW9uIGNvcnJlY3RseSB5b3Ugd2lsbCBuZWVkIHRvIGFkZHJlc3MgdGhlICdcbiAgICAgICAgICArICdhYm92ZSBvciByZS1ydW4gdGhlIFNjcmlwdCBNZXJnZXIgdG8gcmVtb3ZlIHRyYWNlcyBvZiBtZXJnZXMgcmVmZXJlbmNpbmcgJ1xuICAgICAgICAgICsgJ3RoZXNlIG1vZHMuIFBsZWFzZSwgZG8gb25seSBwcm9jZWVkIHRvIHVwbG9hZCB0aGUgY29sbGVjdGlvbi9yZXZpc2lvbiBhcyAnXG4gICAgICAgICAgKyAnaXMgaWYgeW91IGludGVuZCB0byB1cGxvYWQgdGhlIHNjcmlwdCBtZXJnZSBhcyBpcyBhbmQgaWYgdGhlIHJlZmVyZW5jZSBmb3IgJ1xuICAgICAgICAgICsgJ3RoZSBtZXJnZSB3aWxsIGUuZy4gYmUgYWNxdWlyZWQgZnJvbSBhbiBleHRlcm5hbCBzb3VyY2UgYXMgcGFydCBvZiB0aGUgY29sbGVjdGlvbi4nLFxuICAgICAgICBwYXJhbWV0ZXJzOiB7IGJyOiAnW2JyXVsvYnJdJywgYmw6ICdbYnJdWy9icl1bYnJdWy9icl0nIH0sXG4gICAgICB9LCBbXG4gICAgICAgIHsgbGFiZWw6ICdDYW5jZWwnIH0sXG4gICAgICAgIHsgbGFiZWw6ICdVcGxvYWQgQ29sbGVjdGlvbicgfVxuICAgICAgXSkudGhlbihyZXMgPT4gKHJlcy5hY3Rpb24gPT09ICdDYW5jZWwnKVxuICAgICAgICA/IFByb21pc2UucmVqZWN0KG5ldyB1dGlsLlVzZXJDYW5jZWxlZClcbiAgICAgICAgOiBleHBvcnRNZXJnZWREYXRhKCkpO1xuICAgIH1cbiAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoZXJyKTtcbiAgfVxufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gaW1wb3J0U2NyaXB0TWVyZ2VzKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvZmlsZUlkOiBzdHJpbmcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZpbGVEYXRhOiBCdWZmZXIpIHtcbiAgY29uc3QgcHJvcHM6IElCYXNlUHJvcHMgPSBnZW5CYXNlUHJvcHMoYXBpLCBwcm9maWxlSWQsIHRydWUpO1xuICBpZiAocHJvcHMgPT09IHVuZGVmaW5lZCkge1xuICAgIHJldHVybjtcbiAgfVxuICBjb25zdCByZXMgPSBhd2FpdCBhcGkuc2hvd0RpYWxvZygncXVlc3Rpb24nLCAnU2NyaXB0IE1lcmdlcyBJbXBvcnQnLCB7XG4gICAgdGV4dDogJ1RoZSBjb2xsZWN0aW9uIHlvdSBhcmUgaW1wb3J0aW5nIGNvbnRhaW5zIHNjcmlwdCBtZXJnZXMgd2hpY2ggdGhlIGNyZWF0b3Igb2YgJ1xuICAgICAgICArICd0aGUgY29sbGVjdGlvbiBkZWVtZWQgbmVjZXNzYXJ5IGZvciB0aGUgbW9kcyB0byBmdW5jdGlvbiBjb3JyZWN0bHkuIFBsZWFzZSBub3RlIHRoYXQgJ1xuICAgICAgICArICdpbXBvcnRpbmcgdGhlc2Ugd2lsbCBvdmVyd3JpdGUgYW55IGV4aXN0aW5nIHNjcmlwdCBtZXJnZXMgeW91IG1heSBoYXZlIGVmZmVjdHVhdGVkLiAnXG4gICAgICAgICsgJ1BsZWFzZSBlbnN1cmUgdG8gYmFjayB1cCBhbnkgZXhpc3RpbmcgbWVyZ2VzIChpZiBhcHBsaWNhYmxlL3JlcXVpcmVkKSBiZWZvcmUgJ1xuICAgICAgICArICdwcm9jZWVkaW5nLicsXG4gIH0sXG4gIFtcbiAgICB7IGxhYmVsOiAnQ2FuY2VsJyB9LFxuICAgIHsgbGFiZWw6ICdJbXBvcnQgTWVyZ2VzJyB9LFxuICBdLCAnaW1wb3J0LXczLXNjcmlwdC1tZXJnZXMtd2FybmluZycpO1xuXG4gIGlmIChyZXMuYWN0aW9uID09PSAnQ2FuY2VsJykge1xuICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgdXRpbC5Vc2VyQ2FuY2VsZWQoKSk7XG4gIH1cbiAgdHJ5IHtcbiAgICBjb25zdCB0ZW1wUGF0aCA9IHBhdGguam9pbihXM19URU1QX0RBVEFfRElSLCBnZW5lcmF0ZSgpKTtcbiAgICBhd2FpdCBmcy5lbnN1cmVEaXJXcml0YWJsZUFzeW5jKHRlbXBQYXRoKTtcbiAgICBjb25zdCBkYXRhID0gYXdhaXQgcmVzdG9yZUZpbGVEYXRhKGZpbGVEYXRhLCB0ZW1wUGF0aCk7XG4gICAgYXdhaXQgaGFuZGxlTWVyZ2VkU2NyaXB0cyhwcm9wcywgJ2ltcG9ydCcsIHRlbXBQYXRoKTtcbiAgICBhcGkuc2VuZE5vdGlmaWNhdGlvbih7XG4gICAgICBtZXNzYWdlOiAnU2NyaXB0IG1lcmdlcyBpbXBvcnRlZCBzdWNjZXNzZnVsbHknLFxuICAgICAgaWQ6ICd3aXRjaGVyMy1zY3JpcHQtbWVyZ2VzLXN0YXR1cycsXG4gICAgICB0eXBlOiAnc3VjY2VzcycsXG4gICAgfSk7XG4gICAgcmV0dXJuIGRhdGE7XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIHJldHVybiBQcm9taXNlLnJlamVjdChlcnIpO1xuICB9XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBtYWtlT25Db250ZXh0SW1wb3J0KGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSwgY29sbGVjdGlvbklkOiBzdHJpbmcpIHtcbiAgY29uc3Qgc3RhdGUgPSBhcGkuZ2V0U3RhdGUoKTtcbiAgY29uc3QgbW9kczogeyBbbW9kSWQ6IHN0cmluZ106IHR5cGVzLklNb2QgfSA9IHV0aWwuZ2V0U2FmZShzdGF0ZSwgWydwZXJzaXN0ZW50JywgJ21vZHMnLCBHQU1FX0lEXSwge30pO1xuICBjb25zdCBjb2xsZWN0aW9uTW9kID0gbW9kc1tjb2xsZWN0aW9uSWRdO1xuICBpZiAoY29sbGVjdGlvbk1vZD8uaW5zdGFsbGF0aW9uUGF0aCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgbG9nKCdlcnJvcicsICdjb2xsZWN0aW9uIG1vZCBpcyBtaXNzaW5nJywgY29sbGVjdGlvbklkKTtcbiAgICByZXR1cm47XG4gIH1cblxuICBjb25zdCBzdGFnaW5nRm9sZGVyID0gc2VsZWN0b3JzLmluc3RhbGxQYXRoRm9yR2FtZShzdGF0ZSwgR0FNRV9JRCk7XG4gIHRyeSB7XG4gICAgY29uc3QgZmlsZURhdGEgPSBhd2FpdCBmcy5yZWFkRmlsZUFzeW5jKHBhdGguam9pbihzdGFnaW5nRm9sZGVyLCBjb2xsZWN0aW9uTW9kLmluc3RhbGxhdGlvblBhdGgsICdjb2xsZWN0aW9uLmpzb24nKSwgeyBlbmNvZGluZzogJ3V0ZjgnIH0pO1xuICAgIGNvbnN0IGNvbGxlY3Rpb24gPSBKU09OLnBhcnNlKGZpbGVEYXRhKTtcbiAgICBjb25zdCB7IHNjcmlwdE1lcmdlZERhdGEgfSA9IGNvbGxlY3Rpb24ubWVyZ2VkRGF0YTtcbiAgICBpZiAoc2NyaXB0TWVyZ2VkRGF0YSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAvLyBNYWtlIHN1cmUgd2UgaGF2ZSB0aGUgc2NyaXB0IG1lcmdlciBpbnN0YWxsZWQgc3RyYWlnaHQgYXdheSFcbiAgICAgIGNvbnN0IHNjcmlwdE1lcmdlclRvb2wgPSB1dGlsLmdldFNhZmUoc3RhdGUsXG4gICAgICAgIFsnc2V0dGluZ3MnLCAnZ2FtZU1vZGUnLCAnZGlzY292ZXJlZCcsIEdBTUVfSUQsICd0b29scycsIFNDUklQVF9NRVJHRVJfSURdLCB1bmRlZmluZWQpO1xuICAgICAgaWYgKHNjcmlwdE1lcmdlclRvb2wgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICBhd2FpdCBkb3dubG9hZFNjcmlwdE1lcmdlcihhcGkpO1xuICAgICAgfVxuICAgICAgY29uc3QgcHJvZmlsZUlkID0gc2VsZWN0b3JzLmxhc3RBY3RpdmVQcm9maWxlRm9yR2FtZShzdGF0ZSwgR0FNRV9JRCk7XG4gICAgICBhd2FpdCBpbXBvcnRTY3JpcHRNZXJnZXMoYXBpLCBwcm9maWxlSWQsIGhleDJCdWZmZXIoc2NyaXB0TWVyZ2VkRGF0YSkpO1xuICAgIH1cbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgaWYgKCEoZXJyIGluc3RhbmNlb2YgdXRpbC5Vc2VyQ2FuY2VsZWQpKSB7XG4gICAgICBhcGkuc2hvd0Vycm9yTm90aWZpY2F0aW9uKCdGYWlsZWQgdG8gaW1wb3J0IHNjcmlwdCBtZXJnZXMnLCBlcnIpO1xuICAgIH1cbiAgfVxufVxuIl19