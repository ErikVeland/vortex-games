const { isWindows } = require('vortex-api');
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
exports.fileExists = exports.toBlue = exports.suppressEventHandlers = exports.isSettingsFile = exports.isXML = exports.validateProfile = exports.walkPath = exports.forceRefresh = exports.determineExecutable = exports.isLockedEntry = exports.getManuallyAddedMods = exports.getAllMods = exports.getManagedModNames = exports.findModFolders = exports.hasPrefix = exports.notifyMissingScriptMerger = exports.isTW3 = exports.getTLPath = exports.getDLCPath = exports.getDocumentsPath = exports.getDeployment = void 0;
const bluebird_1 = __importDefault(require("bluebird"));
const vortex_api_1 = require("vortex-api");
const iniParser_1 = __importDefault(require("./iniParser"));
const path_1 = __importDefault(require("path"));
const mergeInventoryParsing_1 = require("./mergeInventoryParsing");
const turbowalk_1 = __importDefault(require("turbowalk"));
const common_1 = require("./common");
function getDeployment(api, includedMods) {
    return __awaiter(this, void 0, void 0, function* () {
        const state = api.getState();
        const discovery = vortex_api_1.util.getSafe(state, ['settings', 'gameMode', 'discovered', common_1.GAME_ID], undefined);
        const game = vortex_api_1.util.getGame(common_1.GAME_ID);
        if ((game === undefined) || ((discovery === null || discovery === void 0 ? void 0 : discovery.path) === undefined)) {
            (0, vortex_api_1.log)('error', 'game is not discovered', common_1.GAME_ID);
            return undefined;
        }
        const mods = vortex_api_1.util.getSafe(state, ['persistent', 'mods', common_1.GAME_ID], {});
        const installationDirectories = Object.values(mods)
            .filter(mod => (includedMods !== undefined)
            ? includedMods.includes(mod.id)
            : true)
            .map(mod => mod.installationPath);
        const filterFunc = (file) => installationDirectories.includes(file.source);
        const modPaths = game.getModPaths(discovery.path);
        const modTypes = Object.keys(modPaths).filter(key => !!modPaths[key]);
        const deployment = yield modTypes.reduce((accumP, modType) => __awaiter(this, void 0, void 0, function* () {
            const accum = yield accumP;
            try {
                const manifest = yield vortex_api_1.util.getManifest(api, modType, common_1.GAME_ID);
                accum[modType] = manifest.files.filter(filterFunc);
            }
            catch (err) {
                (0, vortex_api_1.log)('error', 'failed to get manifest', err);
            }
            return accum;
        }), {});
        return deployment;
    });
}
exports.getDeployment = getDeployment;
const getDocumentsPath = (game) => {
    return path_1.default.join(vortex_api_1.util.getVortexPath('documents'), 'The Witcher 3');
};
exports.getDocumentsPath = getDocumentsPath;
const getDLCPath = (api) => {
    return (game) => {
        const state = api.store.getState();
        const discovery = state.settings.gameMode.discovered[game.id];
        return path_1.default.join(discovery.path, 'DLC');
    };
};
exports.getDLCPath = getDLCPath;
exports.getTLPath = ((api) => {
    return (game) => {
        const state = api.store.getState();
        const discovery = state.settings.gameMode.discovered[game.id];
        return discovery.path;
    };
});
const isTW3 = (api) => {
    return (gameId) => {
        if (gameId !== undefined) {
            return (gameId === common_1.GAME_ID);
        }
        const state = api.getState();
        const gameMode = vortex_api_1.selectors.activeGameId(state);
        return (gameMode === common_1.GAME_ID);
    };
};
exports.isTW3 = isTW3;
function notifyMissingScriptMerger(api) {
    const notifId = 'missing-script-merger';
    api.sendNotification({
        id: notifId,
        type: 'info',
        message: api.translate('Witcher 3 script merger is missing/misconfigured', { ns: common_1.I18N_NAMESPACE }),
        allowSuppress: true,
        actions: [
            {
                title: 'More',
                action: () => {
                    api.showDialog('info', 'Witcher 3 Script Merger', {
                        bbcode: api.translate('Vortex is unable to resolve the Script Merger\'s location. The tool needs to be downloaded and configured manually. '
                            + '[url=https://wiki.nexusmods.com/index.php/Tool_Setup:_Witcher_3_Script_Merger]Find out more about how to configure it as a tool for use in Vortex.[/url][br][/br][br][/br]'
                            + 'Note: While script merging works well with the vast majority of mods, there is no guarantee for a satisfying outcome in every single case.', { ns: common_1.I18N_NAMESPACE }),
                    }, [
                        {
                            label: 'Cancel', action: () => {
                                api.dismissNotification('missing-script-merger');
                            }
                        },
                        {
                            label: 'Download Script Merger', action: () => vortex_api_1.util.opn('https://www.nexusmods.com/witcher3/mods/484')
                                .catch(err => null)
                                .then(() => api.dismissNotification('missing-script-merger'))
                        },
                    ]);
                },
            },
        ],
    });
}
exports.notifyMissingScriptMerger = notifyMissingScriptMerger;
const hasPrefix = (prefix, fileEntry) => {
    const segments = fileEntry.toLowerCase().split(path_1.default.sep);
    const contentIdx = segments.indexOf('content');
    if ([-1, 0].includes(contentIdx)) {
        return false;
    }
    return segments[contentIdx - 1].indexOf(prefix) !== -1;
};
exports.hasPrefix = hasPrefix;
function findModFolders(installationPath, mod) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!installationPath || !(mod === null || mod === void 0 ? void 0 : mod.installationPath)) {
            const errMessage = !installationPath
                ? 'Game is not discovered'
                : 'Failed to resolve mod installation path';
            return Promise.reject(new Error(errMessage));
        }
        const validNames = new Set();
        yield (0, turbowalk_1.default)(path_1.default.join(installationPath, mod.installationPath), (entries) => {
            entries.forEach(entry => {
                const segments = entry.filePath.split(path_1.default.sep);
                const contentIdx = segments.findIndex(seg => seg.toLowerCase() === 'content');
                if (![-1, 0].includes(contentIdx)) {
                    validNames.add(segments[contentIdx - 1]);
                }
            });
        }, { recurse: true, skipHidden: true, skipLinks: true });
        const validEntries = Array.from(validNames);
        return (validEntries.length > 0)
            ? Promise.resolve(validEntries)
            : Promise.reject(new Error('Failed to find mod folder'));
    });
}
exports.findModFolders = findModFolders;
function getManagedModNames(api, mods) {
    return __awaiter(this, void 0, void 0, function* () {
        const installationPath = vortex_api_1.selectors.installPathForGame(api.getState(), common_1.GAME_ID);
        return mods.reduce((accumP, mod) => __awaiter(this, void 0, void 0, function* () {
            const accum = yield accumP;
            let folderNames = [];
            try {
                if (!folderNames || ['collection', 'w3modlimitpatcher'].includes(mod.type)) {
                    return Promise.resolve(accum);
                }
                folderNames = yield findModFolders(installationPath, mod);
                for (const component of folderNames) {
                    accum.push({ id: mod.id, name: component });
                }
            }
            catch (err) {
                (0, vortex_api_1.log)('warn', 'unable to resolve mod name', mod.id);
            }
            return Promise.resolve(accum);
        }), Promise.resolve([]));
    });
}
exports.getManagedModNames = getManagedModNames;
function getAllMods(api) {
    return __awaiter(this, void 0, void 0, function* () {
        const invalidModTypes = ['witcher3menumoddocuments', 'collection'];
        const state = api.getState();
        const profile = vortex_api_1.selectors.activeProfile(state);
        if ((profile === null || profile === void 0 ? void 0 : profile.id) === undefined) {
            return Promise.resolve({
                merged: [],
                manual: [],
                managed: [],
            });
        }
        const modState = vortex_api_1.util.getSafe(state, ['persistent', 'profiles', profile.id, 'modState'], {});
        const mods = vortex_api_1.util.getSafe(state, ['persistent', 'mods', common_1.GAME_ID], {});
        const enabledMods = Object.keys(modState).filter(key => (!!mods[key] && modState[key].enabled && !invalidModTypes.includes(mods[key].type)));
        const mergedModNames = yield (0, mergeInventoryParsing_1.getMergedModNames)(api);
        const manuallyAddedMods = yield getManuallyAddedMods(api);
        const managedMods = yield getManagedModNames(api, enabledMods.map(key => mods[key]));
        return Promise.resolve({
            merged: mergedModNames,
            manual: manuallyAddedMods.filter(mod => !mergedModNames.includes(mod)),
            managed: managedMods,
        });
    });
}
exports.getAllMods = getAllMods;
function getManuallyAddedMods(api) {
    return __awaiter(this, void 0, void 0, function* () {
        const state = api.getState();
        const discovery = vortex_api_1.util.getSafe(state, ['settings', 'gameMode', 'discovered', common_1.GAME_ID], undefined);
        if ((discovery === null || discovery === void 0 ? void 0 : discovery.path) === undefined) {
            return Promise.reject(new vortex_api_1.util.ProcessCanceled('Game is not discovered!'));
        }
        let ini;
        try {
            ini = yield iniParser_1.default.getInstance().ensureModSettings();
        }
        catch (err) {
            api.showErrorNotification('Failed to load INI structure', err, { allowReport: false });
            return Promise.resolve([]);
        }
        const mods = vortex_api_1.util.getSafe(state, ['persistent', 'mods', common_1.GAME_ID], {});
        const modKeys = Object.keys(mods);
        const iniEntries = Object.keys(ini.data);
        const manualCandidates = [].concat(iniEntries).filter(entry => {
            const hasVortexKey = vortex_api_1.util.getSafe(ini.data[entry], ['VK'], undefined) !== undefined;
            return ((!hasVortexKey) || (ini.data[entry].VK === entry) && !modKeys.includes(entry));
        });
        const uniqueCandidates = new Set(new Set(manualCandidates));
        const modsPath = path_1.default.join(discovery.path, 'Mods');
        const candidates = Array.from(uniqueCandidates);
        const validCandidates = yield candidates.reduce((accumP, mod) => __awaiter(this, void 0, void 0, function* () {
            const accum = yield accumP;
            const modFolder = path_1.default.join(modsPath, mod);
            const exists = vortex_api_1.fs.statAsync(path_1.default.join(modFolder)).then(() => true).catch(() => false);
            if (!exists) {
                return Promise.resolve(accum);
            }
            try {
                const entries = yield walkPath(modFolder, { skipHidden: true, skipLinks: true });
                if (entries.length > 0) {
                    const files = entries.filter(entry => !entry.isDirectory
                        && (path_1.default.extname(path_1.default.basename(entry.filePath)) !== '')
                        && ((entry === null || entry === void 0 ? void 0 : entry.linkCount) === undefined || entry.linkCount <= 1));
                    if (files.length > 0) {
                        accum.push(mod);
                    }
                }
            }
            catch (err) {
                if (!['ENOENT', 'ENOTFOUND'].some(err.code)) {
                    (0, vortex_api_1.log)('error', 'unable to walk path', err);
                }
                return Promise.resolve(accum);
            }
            return Promise.resolve(accum);
        }), Promise.resolve([]));
        return Promise.resolve(validCandidates);
    });
}
exports.getManuallyAddedMods = getManuallyAddedMods;
function isLockedEntry(modName) {
    if (!modName || typeof (modName) !== 'string') {
        (0, vortex_api_1.log)('debug', 'encountered invalid mod instance/name');
        return false;
    }
    return modName.startsWith(common_1.LOCKED_PREFIX);
}
exports.isLockedEntry = isLockedEntry;
function determineExecutable(discoveredPath) {
    if (discoveredPath !== undefined) {
        if (process.platform === 'darwin') {
            try {
                const macExecutable = path_1.default.join(discoveredPath, 'Contents', 'MacOS', 'witcher3');
                vortex_api_1.fs.statSync(macExecutable);
                return 'Contents/MacOS/witcher3';
            }
            catch (err) {
            }
        }
        try {
            vortex_api_1.fs.statSync(path_1.default.join(discoveredPath, 'bin', 'x64_DX12', 'witcher3.exe'));
            return 'bin/x64_DX12/witcher3.exe';
        }
        catch (err) {
        }
        try {
            vortex_api_1.fs.statSync(path_1.default.join(discoveredPath, 'bin', 'x64', 'witcher3.exe'));
            return 'bin/x64/witcher3.exe';
        }
        catch (err) {
        }
        if (process.platform === 'linux') {
            try {
                const linuxExecutable = path_1.default.join(discoveredPath, 'bin', 'witcher3');
                vortex_api_1.fs.statSync(linuxExecutable);
                return 'bin/witcher3';
            }
            catch (err) {
            }
        }
    }
    if (process.platform === 'darwin') {
        return 'Contents/MacOS/witcher3';
    }
    else if (process.platform === 'linux') {
        return 'bin/witcher3';
    }
    return 'bin/x64/witcher3.exe';
}
exports.determineExecutable = determineExecutable;
function forceRefresh(api) {
    const state = api.getState();
    const profileId = vortex_api_1.selectors.lastActiveProfileForGame(state, common_1.GAME_ID);
    const action = {
        type: 'SET_FB_FORCE_UPDATE',
        payload: {
            profileId,
        },
    };
    api.store.dispatch(action);
}
exports.forceRefresh = forceRefresh;
function walkPath(dirPath, walkOptions) {
    return __awaiter(this, void 0, void 0, function* () {
        walkOptions = walkOptions || { skipLinks: true, skipHidden: true, skipInaccessible: true };
        walkOptions = Object.assign(Object.assign({}, walkOptions), { skipHidden: true, skipInaccessible: true, skipLinks: true });
        const walkResults = [];
        return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
            yield (0, turbowalk_1.default)(dirPath, (entries) => {
                walkResults.push(...entries);
                return Promise.resolve();
            }, walkOptions).catch(err => err.code === 'ENOENT' ? Promise.resolve() : Promise.reject(err));
            return resolve(walkResults);
        }));
    });
}
exports.walkPath = walkPath;
function validateProfile(profileId, state) {
    const activeProfile = vortex_api_1.selectors.activeProfile(state);
    const deployProfile = vortex_api_1.selectors.profileById(state, profileId);
    if (!!activeProfile && !!deployProfile && (deployProfile.id !== activeProfile.id)) {
        return undefined;
    }
    if ((activeProfile === null || activeProfile === void 0 ? void 0 : activeProfile.gameId) !== common_1.GAME_ID) {
        return undefined;
    }
    return activeProfile;
}
exports.validateProfile = validateProfile;
;
function isXML(filePath) {
    return ['.xml'].includes(path_1.default.extname(filePath).toLowerCase());
}
exports.isXML = isXML;
function isSettingsFile(filePath) {
    return ['.settings', common_1.PART_SUFFIX].some(ext => filePath.toLowerCase().endsWith(ext)
        && path_1.default.basename(filePath).toLowerCase() !== 'mods.settings');
}
exports.isSettingsFile = isSettingsFile;
function suppressEventHandlers(api) {
    const state = api.getState();
    return (state.session.notifications.notifications.some(n => n.id === common_1.ACTIVITY_ID_IMPORTING_LOADORDER));
}
exports.suppressEventHandlers = suppressEventHandlers;
function toBlue(func) {
    return (...args) => bluebird_1.default.resolve(func(...args));
}
exports.toBlue = toBlue;
function fileExists(filePath) {
    return __awaiter(this, void 0, void 0, function* () {
        return vortex_api_1.fs.statAsync(filePath)
            .then(() => true)
            .catch(() => false);
    });
}
exports.fileExists = fileExists;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInV0aWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7O0FBQ0Esd0RBQWdDO0FBQ2hDLDJDQUE2RDtBQUU3RCw0REFBdUM7QUFFdkMsZ0RBQXdCO0FBRXhCLG1FQUE0RDtBQUU1RCwwREFBNEQ7QUFFNUQscUNBQWdIO0FBR2hILFNBQXNCLGFBQWEsQ0FBQyxHQUF3QixFQUMxRCxZQUF1Qjs7UUFDdkIsTUFBTSxLQUFLLEdBQUcsR0FBRyxDQUFDLFFBQVEsRUFBRSxDQUFDO1FBQzdCLE1BQU0sU0FBUyxHQUFHLGlCQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssRUFDbEMsQ0FBQyxVQUFVLEVBQUUsVUFBVSxFQUFFLFlBQVksRUFBRSxnQkFBTyxDQUFDLEVBQUUsU0FBUyxDQUFDLENBQUM7UUFDOUQsTUFBTSxJQUFJLEdBQUcsaUJBQUksQ0FBQyxPQUFPLENBQUMsZ0JBQU8sQ0FBQyxDQUFDO1FBQ25DLElBQUksQ0FBQyxJQUFJLEtBQUssU0FBUyxDQUFDLElBQUksQ0FBQyxDQUFBLFNBQVMsYUFBVCxTQUFTLHVCQUFULFNBQVMsQ0FBRSxJQUFJLE1BQUssU0FBUyxDQUFDLEVBQUU7WUFDM0QsSUFBQSxnQkFBRyxFQUFDLE9BQU8sRUFBRSx3QkFBd0IsRUFBRSxnQkFBTyxDQUFDLENBQUM7WUFDaEQsT0FBTyxTQUFTLENBQUM7U0FDbEI7UUFFRCxNQUFNLElBQUksR0FBb0MsaUJBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUM5RCxDQUFDLFlBQVksRUFBRSxNQUFNLEVBQUUsZ0JBQU8sQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBRXZDLE1BQU0sdUJBQXVCLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUM7YUFDaEQsTUFBTSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQyxZQUFZLEtBQUssU0FBUyxDQUFDO1lBQ3pDLENBQUMsQ0FBQyxZQUFZLENB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SSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsS0FBSyx3Q0FBK0IsQ0FBQyxDQUFDLENBQUM7QUFDekcsQ0FBQztBQUpELHNEQUlDO0FBRUQsU0FBZ0IsTUFBTSxDQUFJLElBQW9DO0lBQzVELE9BQU8sQ0FBQyxHQUFHLElBQVcsRUFBRSxFQUFFLENBQUMsa0JBQVEsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQztBQUM3RCxDQUFDO0FBRkQsd0JBRUM7QUFFRCxTQUFzQixVQUFVLENBQUMsUUFBZ0I7O1FBQy9DLE9BQU8sZUFBRSxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUM7YUFDMUIsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQzthQUNoQixLQUFLLENBQUMsR0FBRyxFQUFFLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDeEIsQ0FBQztDQUFBO0FBSkQsZ0NBSUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiBlc2xpbnQtZGlzYWJsZSAqL1xuaW1wb3J0IEJsdWViaXJkIGZyb20gJ2JsdWViaXJkJztcbmltcG9ydCB7IGZzLCBsb2csIHR5cGVzLCBzZWxlY3RvcnMsIHV0aWwgfSBmcm9tICd2b3J0ZXgtYXBpJztcblxuaW1wb3J0IEluaVN0cnVjdHVyZSBmcm9tICcuL2luaVBhcnNlcic7XG5cbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xuXG5pbXBvcnQgeyBnZXRNZXJnZWRNb2ROYW1lcyB9IGZyb20gJy4vbWVyZ2VJbnZlbnRvcnlQYXJzaW5nJztcblxuaW1wb3J0IHR1cmJvd2FsaywgeyBJRW50cnksIElXYWxrT3B0aW9ucyB9IGZyb20gJ3R1cmJvd2Fsayc7XG5cbmltcG9ydCB7IEdBTUVfSUQsIExPQ0tFRF9QUkVGSVgsIEkxOE5fTkFNRVNQQUNFLCBBQ1RJVklUWV9JRF9JTVBPUlRJTkdfTE9BRE9SREVSLCBQQVJUX1NVRkZJWCB9IGZyb20gJy4vY29tbW9uJztcbmltcG9ydCB7IElEZXBsb3llZEZpbGUsIElEZXBsb3ltZW50LCBQcmVmaXhUeXBlIH0gZnJvbSAnLi90eXBlcyc7XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZXREZXBsb3ltZW50KGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSxcbiAgaW5jbHVkZWRNb2RzPzogc3RyaW5nW10pOiBQcm9taXNlPElEZXBsb3ltZW50PiB7XG4gIGNvbnN0IHN0YXRlID0gYXBpLmdldFN0YXRlKCk7XG4gIGNvbnN0IGRpc2NvdmVyeSA9IHV0aWwuZ2V0U2FmZShzdGF0ZSxcbiAgICBbJ3NldHRpbmdzJywgJ2dhbWVNb2RlJywgJ2Rpc2NvdmVyZWQnLCBHQU1FX0lEXSwgdW5kZWZpbmVkKTtcbiAgY29uc3QgZ2FtZSA9IHV0aWwuZ2V0R2FtZShHQU1FX0lEKTtcbiAgaWYgKChnYW1lID09PSB1bmRlZmluZWQpIHx8IChkaXNjb3Zlcnk/LnBhdGggPT09IHVuZGVmaW5lZCkpIHtcbiAgICBsb2coJ2Vycm9yJywgJ2dhbWUgaXMgbm90IGRpc2NvdmVyZWQnLCBHQU1FX0lEKTtcbiAgICByZXR1cm4gdW5kZWZpbmVkO1xuICB9XG5cbiAgY29uc3QgbW9kczogeyBbbW9kSWQ6IHN0cmluZ106IHR5cGVzLklNb2QgfSA9IHV0aWwuZ2V0U2FmZShzdGF0ZSxcbiAgICBbJ3BlcnNpc3RlbnQnLCAnbW9kcycsIEdBTUVfSURdLCB7fSk7XG5cbiAgY29uc3QgaW5zdGFsbGF0aW9uRGlyZWN0b3JpZXMgPSBPYmplY3QudmFsdWVzKG1vZHMpXG4gICAgLmZpbHRlcihtb2QgPT4gKGluY2x1ZGVkTW9kcyAhPT0gdW5kZWZpbmVkKVxuICAgICAgPyBpbmNsdWRlZE1vZHMuaW5jbHVkZXMobW9kLmlkKVxuICAgICAgOiB0cnVlKVxuICAgIC5tYXAobW9kID0+IG1vZC5pbnN0YWxsYXRpb25QYXRoKTtcblxuICBjb25zdCBmaWx0ZXJGdW5jID0gKGZpbGU6IElEZXBsb3llZEZpbGUpID0+IGluc3RhbGxhdGlvbkRpcmVjdG9yaWVzLmluY2x1ZGVzKGZpbGUuc291cmNlKTtcblxuICBjb25zdCBtb2RQYXRoczogeyBbdHlwZUlkOiBzdHJpbmddOiBzdHJpbmcgfSA9IGdhbWUuZ2V0TW9kUGF0aHMoZGlzY292ZXJ5LnBhdGgpO1xuICBjb25zdCBtb2RUeXBlcyA9IE9iamVjdC5rZXlzKG1vZFBhdGhzKS5maWx0ZXIoa2V5ID0+ICEhbW9kUGF0aHNba2V5XSk7XG4gIGNvbnN0IGRlcGxveW1lbnQ6IElEZXBsb3ltZW50ID0gYXdhaXQgbW9kVHlwZXMucmVkdWNlKGFzeW5jIChhY2N1bVAsIG1vZFR5cGUpID0+IHtcbiAgICBjb25zdCBhY2N1bSA9IGF3YWl0IGFjY3VtUDtcbiAgICB0cnkge1xuICAgICAgY29uc3QgbWFuaWZlc3Q6IHR5cGVzLklEZXBsb3ltZW50TWFuaWZlc3QgPSBhd2FpdCB1dGlsLmdldE1hbmlmZXN0KGFwaSwgbW9kVHlwZSwgR0FNRV9JRCk7XG4gICAgICBhY2N1bVttb2RUeXBlXSA9IG1hbmlmZXN0LmZpbGVzLmZpbHRlcihmaWx0ZXJGdW5jKTtcbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgIGxvZygnZXJyb3InLCAnZmFpbGVkIHRvIGdldCBtYW5pZmVzdCcsIGVycik7XG4gICAgfVxuICAgIHJldHVybiBhY2N1bTtcbiAgfSwge30pO1xuXG4gIHJldHVybiBkZXBsb3ltZW50O1xufVxuXG5leHBvcnQgY29uc3QgZ2V0RG9jdW1lbnRzUGF0aCA9IChnYW1lOiB0eXBlcy5JR2FtZSkgPT4ge1xuICByZXR1cm4gcGF0aC5qb2luKHV0aWwuZ2V0Vm9ydGV4UGF0aCgnZG9jdW1lbnRzJyksICdUaGUgV2l0Y2hlciAzJylcbn1cblxuZXhwb3J0IGNvbnN0IGdldERMQ1BhdGggPSAoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpKSA9PiB7XG4gIHJldHVybiAoZ2FtZTogdHlwZXMuSUdhbWUpID0+IHtcbiAgICBjb25zdCBzdGF0ZSA9IGFwaS5zdG9yZS5nZXRTdGF0ZSgpO1xuICAgIGNvbnN0IGRpc2NvdmVyeSA9IHN0YXRlLnNldHRpbmdzLmdhbWVNb2RlLmRpc2NvdmVyZWRbZ2FtZS5pZF07XG4gICAgcmV0dXJuIHBhdGguam9pbihkaXNjb3ZlcnkucGF0aCwgJ0RMQycpO1xuICB9XG59O1xuXG5leHBvcnQgY29uc3QgZ2V0VExQYXRoID0gKChhcGk6IHR5cGVzLklFeHRlbnNpb25BcGkpID0+IHtcbiAgcmV0dXJuIChnYW1lOiB0eXBlcy5JR2FtZSkgPT4ge1xuICAgIGNvbnN0IHN0YXRlID0gYXBpLnN0b3JlLmdldFN0YXRlKCk7XG4gICAgY29uc3QgZGlzY292ZXJ5ID0gc3RhdGUuc2V0dGluZ3MuZ2FtZU1vZGUuZGlzY292ZXJlZFtnYW1lLmlkXTtcbiAgICByZXR1cm4gZGlzY292ZXJ5LnBhdGg7XG4gIH1cbn0pO1xuXG5leHBvcnQgY29uc3QgaXNUVzMgPSAoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpKSA9PiB7XG4gIHJldHVybiAoZ2FtZUlkOiBzdHJpbmcpID0+IHtcbiAgICBpZiAoZ2FtZUlkICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIHJldHVybiAoZ2FtZUlkID09PSBHQU1FX0lEKTtcbiAgICB9XG4gICAgY29uc3Qgc3RhdGUgPSBhcGkuZ2V0U3RhdGUoKTtcbiAgICBjb25zdCBnYW1lTW9kZSA9IHNlbGVjdG9ycy5hY3RpdmVHYW1lSWQoc3RhdGUpO1xuICAgIHJldHVybiAoZ2FtZU1vZGUgPT09IEdBTUVfSUQpO1xuICB9XG59O1xuXG5leHBvcnQgZnVuY3Rpb24gbm90aWZ5TWlzc2luZ1NjcmlwdE1lcmdlcihhcGkpIHtcbiAgY29uc3Qgbm90aWZJZCA9ICdtaXNzaW5nLXNjcmlwdC1tZXJnZXInO1xuICBhcGkuc2VuZE5vdGlmaWNhdGlvbih7XG4gICAgaWQ6IG5vdGlmSWQsXG4gICAgdHlwZTogJ2luZm8nLFxuICAgIG1lc3NhZ2U6IGFwaS50cmFuc2xhdGUoJ1dpdGNoZXIgMyBzY3JpcHQgbWVyZ2VyIGlzIG1pc3NpbmcvbWlzY29uZmlndXJlZCcsXG4gICAgICB7IG5zOiBJMThOX05BTUVTUEFDRSB9KSxcbiAgICBhbGxvd1N1cHByZXNzOiB0cnVlLFxuICAgIGFjdGlvbnM6IFtcbiAgICAgIHtcbiAgICAgICAgdGl0bGU6ICdNb3JlJyxcbiAgICAgICAgYWN0aW9uOiAoKSA9PiB7XG4gICAgICAgICAgYXBpLnNob3dEaWFsb2coJ2luZm8nLCAnV2l0Y2hlciAzIFNjcmlwdCBNZXJnZXInLCB7XG4gICAgICAgICAgICBiYmNvZGU6IGFwaS50cmFuc2xhdGUoJ1ZvcnRleCBpcyB1bmFibGUgdG8gcmVzb2x2ZSB0aGUgU2NyaXB0IE1lcmdlclxcJ3MgbG9jYXRpb24uIFRoZSB0b29sIG5lZWRzIHRvIGJlIGRvd25sb2FkZWQgYW5kIGNvbmZpZ3VyZWQgbWFudWFsbHkuICdcbiAgICAgICAgICAgICAgKyAnW3VybD1odHRwczovL3dpa2kubmV4dXNtb2RzLmNvbS9pbmRleC5waHAvVG9vbF9TZXR1cDpfV2l0Y2hlcl8zX1NjcmlwdF9NZXJnZXJdRmluZCBvdXQgbW9yZSBhYm91dCBob3cgdG8gY29uZmlndXJlIGl0IGFzIGEgdG9vbCBmb3IgdXNlIGluIFZvcnRleC5bL3VybF1bYnJdWy9icl1bYnJdWy9icl0nXG4gICAgICAgICAgICAgICsgJ05vdGU6IFdoaWxlIHNjcmlwdCBtZXJnaW5nIHdvcmtzIHdlbGwgd2l0aCB0aGUgdmFzdCBtYWpvcml0eSBvZiBtb2RzLCB0aGVyZSBpcyBubyBndWFyYW50ZWUgZm9yIGEgc2F0aXNmeWluZyBvdXRjb21lIGluIGV2ZXJ5IHNpbmdsZSBjYXNlLicsIHsgbnM6IEkxOE5fTkFNRVNQQUNFIH0pLFxuICAgICAgICAgIH0sIFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgbGFiZWw6ICdDYW5jZWwnLCBhY3Rpb246ICgpID0+IHtcbiAgICAgICAgICAgICAgICBhcGkuZGlzbWlzc05vdGlmaWNhdGlvbignbWlzc2luZy1zY3JpcHQtbWVyZ2VyJyk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIGxhYmVsOiAnRG93bmxvYWQgU2NyaXB0IE1lcmdlcicsIGFjdGlvbjogKCkgPT4gdXRpbC5vcG4oJ2h0dHBzOi8vd3d3Lm5leHVzbW9kcy5jb20vd2l0Y2hlcjMvbW9kcy80ODQnKVxuICAgICAgICAgICAgICAgIC5jYXRjaChlcnIgPT4gbnVsbClcbiAgICAgICAgICAgICAgICAudGhlbigoKSA9PiBhcGkuZGlzbWlzc05vdGlmaWNhdGlvbignbWlzc2luZy1zY3JpcHQtbWVyZ2VyJykpXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIF0pO1xuICAgICAgICB9LFxuICAgICAgfSxcbiAgICBdLFxuICB9KTtcbn1cblxuZXhwb3J0IGNvbnN0IGhhc1ByZWZpeCA9IChwcmVmaXg6IFByZWZpeFR5cGUsIGZpbGVFbnRyeTogc3RyaW5nKSA9PiB7XG4gIGNvbnN0IHNlZ21lbnRzID0gZmlsZUVudHJ5LnRvTG93ZXJDYXNlKCkuc3BsaXQocGF0aC5zZXApO1xuICBjb25zdCBjb250ZW50SWR4ID0gc2VnbWVudHMuaW5kZXhPZignY29udGVudCcpO1xuICBpZiAoWy0xLCAwXS5pbmNsdWRlcyhjb250ZW50SWR4KSkge1xuICAgIC8vIE5vIGNvbnRlbnQgZm9sZGVyLCBubyBtb2QuXG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgcmV0dXJuIHNlZ21lbnRzW2NvbnRlbnRJZHggLSAxXS5pbmRleE9mKHByZWZpeCkgIT09IC0xO1xufTtcblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGZpbmRNb2RGb2xkZXJzKGluc3RhbGxhdGlvblBhdGg6IHN0cmluZywgbW9kOiB0eXBlcy5JTW9kKTogUHJvbWlzZTxzdHJpbmdbXT4ge1xuICBpZiAoIWluc3RhbGxhdGlvblBhdGggfHwgIW1vZD8uaW5zdGFsbGF0aW9uUGF0aCkge1xuICAgIGNvbnN0IGVyck1lc3NhZ2UgPSAhaW5zdGFsbGF0aW9uUGF0aFxuICAgICAgPyAnR2FtZSBpcyBub3QgZGlzY292ZXJlZCdcbiAgICAgIDogJ0ZhaWxlZCB0byByZXNvbHZlIG1vZCBpbnN0YWxsYXRpb24gcGF0aCc7XG4gICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyBFcnJvcihlcnJNZXNzYWdlKSk7XG4gIH1cblxuICBjb25zdCB2YWxpZE5hbWVzID0gbmV3IFNldDxzdHJpbmc+KCk7XG4gIGF3YWl0IHR1cmJvd2FsayhwYXRoLmpvaW4oaW5zdGFsbGF0aW9uUGF0aCwgbW9kLmluc3RhbGxhdGlvblBhdGgpLCAoZW50cmllczogSUVudHJ5W10pID0+IHtcbiAgICBlbnRyaWVzLmZvckVhY2goZW50cnkgPT4ge1xuICAgICAgY29uc3Qgc2VnbWVudHMgPSBlbnRyeS5maWxlUGF0aC5zcGxpdChwYXRoLnNlcCk7XG4gICAgICBjb25zdCBjb250ZW50SWR4ID0gc2VnbWVudHMuZmluZEluZGV4KHNlZyA9PiBzZWcudG9Mb3dlckNhc2UoKSA9PT0gJ2NvbnRlbnQnKTtcbiAgICAgIGlmICghWy0xLCAwXS5pbmNsdWRlcyhjb250ZW50SWR4KSkge1xuICAgICAgICB2YWxpZE5hbWVzLmFkZChzZWdtZW50c1tjb250ZW50SWR4IC0gMV0pO1xuICAgICAgfVxuICAgIH0pO1xuICB9LCB7IHJlY3Vyc2U6IHRydWUsIHNraXBIaWRkZW46IHRydWUsIHNraXBMaW5rczogdHJ1ZSB9KTtcbiAgY29uc3QgdmFsaWRFbnRyaWVzID0gQXJyYXkuZnJvbSh2YWxpZE5hbWVzKTtcbiAgcmV0dXJuICh2YWxpZEVudHJpZXMubGVuZ3RoID4gMClcbiAgICA/IFByb21pc2UucmVzb2x2ZSh2YWxpZEVudHJpZXMpXG4gICAgOiBQcm9taXNlLnJlamVjdChuZXcgRXJyb3IoJ0ZhaWxlZCB0byBmaW5kIG1vZCBmb2xkZXInKSk7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZXRNYW5hZ2VkTW9kTmFtZXMoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpLCBtb2RzOiB0eXBlcy5JTW9kW10pOiBQcm9taXNlPHsgbmFtZTogc3RyaW5nLCBpZDogc3RyaW5nIH1bXT4ge1xuICBjb25zdCBpbnN0YWxsYXRpb25QYXRoID0gc2VsZWN0b3JzLmluc3RhbGxQYXRoRm9yR2FtZShhcGkuZ2V0U3RhdGUoKSwgR0FNRV9JRCk7XG4gIHJldHVybiBtb2RzLnJlZHVjZShhc3luYyAoYWNjdW1QLCBtb2QpID0+IHtcbiAgICBjb25zdCBhY2N1bSA9IGF3YWl0IGFjY3VtUDtcbiAgICBsZXQgZm9sZGVyTmFtZXMgPSBbXTtcbiAgICB0cnkge1xuICAgICAgaWYgKCFmb2xkZXJOYW1lcyB8fCBbJ2NvbGxlY3Rpb24nLCAndzNtb2RsaW1pdHBhdGNoZXInXS5pbmNsdWRlcyhtb2QudHlwZSkpIHtcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShhY2N1bSk7XG4gICAgICB9XG4gICAgICBmb2xkZXJOYW1lcyA9IGF3YWl0IGZpbmRNb2RGb2xkZXJzKGluc3RhbGxhdGlvblBhdGgsIG1vZCk7XG4gICAgICBmb3IgKGNvbnN0IGNvbXBvbmVudCBvZiBmb2xkZXJOYW1lcykge1xuICAgICAgICBhY2N1bS5wdXNoKHsgaWQ6IG1vZC5pZCwgbmFtZTogY29tcG9uZW50IH0pO1xuICAgICAgfVxuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgbG9nKCd3YXJuJywgJ3VuYWJsZSB0byByZXNvbHZlIG1vZCBuYW1lJywgbW9kLmlkKTtcbiAgICB9XG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShhY2N1bSk7XG4gIH0sIFByb21pc2UucmVzb2x2ZShbXSkpO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZ2V0QWxsTW9kcyhhcGk6IHR5cGVzLklFeHRlbnNpb25BcGkpIHtcbiAgLy8gTW9kIHR5cGVzIHdlIGRvbid0IHdhbnQgdG8gZGlzcGxheSBpbiB0aGUgTE8gcGFnZVxuICBjb25zdCBpbnZhbGlkTW9kVHlwZXMgPSBbJ3dpdGNoZXIzbWVudW1vZGRvY3VtZW50cycsICdjb2xsZWN0aW9uJ107XG4gIGNvbnN0IHN0YXRlID0gYXBpLmdldFN0YXRlKCk7XG4gIGNvbnN0IHByb2ZpbGUgPSBzZWxlY3RvcnMuYWN0aXZlUHJvZmlsZShzdGF0ZSk7XG4gIGlmIChwcm9maWxlPy5pZCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh7XG4gICAgICBtZXJnZWQ6IFtdLFxuICAgICAgbWFudWFsOiBbXSxcbiAgICAgIG1hbmFnZWQ6IFtdLFxuICAgIH0pO1xuICB9XG4gIGNvbnN0IG1vZFN0YXRlID0gdXRpbC5nZXRTYWZlKHN0YXRlLCBbJ3BlcnNpc3RlbnQnLCAncHJvZmlsZXMnLCBwcm9maWxlLmlkLCAnbW9kU3RhdGUnXSwge30pO1xuICBjb25zdCBtb2RzID0gdXRpbC5nZXRTYWZlKHN0YXRlLCBbJ3BlcnNpc3RlbnQnLCAnbW9kcycsIEdBTUVfSURdLCB7fSk7XG5cbiAgLy8gT25seSBzZWxlY3QgbW9kcyB3aGljaCBhcmUgZW5hYmxlZCwgYW5kIGFyZSBub3QgYSBtZW51IG1vZC5cbiAgY29uc3QgZW5hYmxlZE1vZHMgPSBPYmplY3Qua2V5cyhtb2RTdGF0ZSkuZmlsdGVyKGtleSA9PlxuICAgICghIW1vZHNba2V5XSAmJiBtb2RTdGF0ZVtrZXldLmVuYWJsZWQgJiYgIWludmFsaWRNb2RUeXBlcy5pbmNsdWRlcyhtb2RzW2tleV0udHlwZSkpKTtcblxuICBjb25zdCBtZXJnZWRNb2ROYW1lcyA9IGF3YWl0IGdldE1lcmdlZE1vZE5hbWVzKGFwaSk7XG4gIGNvbnN0IG1hbnVhbGx5QWRkZWRNb2RzID0gYXdhaXQgZ2V0TWFudWFsbHlBZGRlZE1vZHMoYXBpKTtcbiAgY29uc3QgbWFuYWdlZE1vZHMgPSBhd2FpdCBnZXRNYW5hZ2VkTW9kTmFtZXMoYXBpLCBlbmFibGVkTW9kcy5tYXAoa2V5ID0+IG1vZHNba2V5XSkpO1xuICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHtcbiAgICBtZXJnZWQ6IG1lcmdlZE1vZE5hbWVzLFxuICAgIG1hbnVhbDogbWFudWFsbHlBZGRlZE1vZHMuZmlsdGVyKG1vZCA9PiAhbWVyZ2VkTW9kTmFtZXMuaW5jbHVkZXMobW9kKSksXG4gICAgbWFuYWdlZDogbWFuYWdlZE1vZHMsXG4gIH0pO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZ2V0TWFudWFsbHlBZGRlZE1vZHMoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpKSB7XG4gIGNvbnN0IHN0YXRlID0gYXBpLmdldFN0YXRlKCk7XG4gIGNvbnN0IGRpc2NvdmVyeSA9IHV0aWwuZ2V0U2FmZShzdGF0ZSwgWydzZXR0aW5ncycsICdnYW1lTW9kZScsICdkaXNjb3ZlcmVkJywgR0FNRV9JRF0sIHVuZGVmaW5lZCk7XG4gIGlmIChkaXNjb3Zlcnk/LnBhdGggPT09IHVuZGVmaW5lZCkge1xuICAgIC8vIEhvdy93aHkgYXJlIHdlIGV2ZW4gaGVyZSA/XG4gICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyB1dGlsLlByb2Nlc3NDYW5jZWxlZCgnR2FtZSBpcyBub3QgZGlzY292ZXJlZCEnKSk7XG4gIH1cbiAgbGV0IGluaTtcbiAgdHJ5IHtcbiAgICBpbmkgPSBhd2FpdCBJbmlTdHJ1Y3R1cmUuZ2V0SW5zdGFuY2UoKS5lbnN1cmVNb2RTZXR0aW5ncygpO1xuICB9IGNhdGNoIChlcnIpIHtcbiAgICBhcGkuc2hvd0Vycm9yTm90aWZpY2F0aW9uKCdGYWlsZWQgdG8gbG9hZCBJTkkgc3RydWN0dXJlJywgZXJyLCB7IGFsbG93UmVwb3J0OiBmYWxzZSB9KTtcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKFtdKTtcbiAgfVxuXG4gIGNvbnN0IG1vZHMgPSB1dGlsLmdldFNhZmUoc3RhdGUsIFsncGVyc2lzdGVudCcsICdtb2RzJywgR0FNRV9JRF0sIHt9KTtcbiAgY29uc3QgbW9kS2V5cyA9IE9iamVjdC5rZXlzKG1vZHMpO1xuICBjb25zdCBpbmlFbnRyaWVzID0gT2JqZWN0LmtleXMoaW5pLmRhdGEpO1xuICBjb25zdCBtYW51YWxDYW5kaWRhdGVzID0gW10uY29uY2F0KGluaUVudHJpZXMpLmZpbHRlcihlbnRyeSA9PiB7XG4gICAgY29uc3QgaGFzVm9ydGV4S2V5ID0gdXRpbC5nZXRTYWZlKGluaS5kYXRhW2VudHJ5XSwgWydWSyddLCB1bmRlZmluZWQpICE9PSB1bmRlZmluZWQ7XG4gICAgcmV0dXJuICgoIWhhc1ZvcnRleEtleSkgfHwgKGluaS5kYXRhW2VudHJ5XS5WSyA9PT0gZW50cnkpICYmICFtb2RLZXlzLmluY2x1ZGVzKGVudHJ5KSk7XG4gIH0pO1xuICBjb25zdCB1bmlxdWVDYW5kaWRhdGVzID0gbmV3IFNldChuZXcgU2V0KG1hbnVhbENhbmRpZGF0ZXMpKTtcbiAgY29uc3QgbW9kc1BhdGggPSBwYXRoLmpvaW4oZGlzY292ZXJ5LnBhdGgsICdNb2RzJyk7XG4gIGNvbnN0IGNhbmRpZGF0ZXMgPSBBcnJheS5mcm9tKHVuaXF1ZUNhbmRpZGF0ZXMpO1xuICBjb25zdCB2YWxpZENhbmRpZGF0ZXMgPSBhd2FpdCBjYW5kaWRhdGVzLnJlZHVjZShhc3luYyAoYWNjdW1QLCBtb2QpID0+IHtcbiAgICBjb25zdCBhY2N1bSA9IGF3YWl0IGFjY3VtUDtcbiAgICBjb25zdCBtb2RGb2xkZXIgPSBwYXRoLmpvaW4obW9kc1BhdGgsIG1vZCk7XG4gICAgY29uc3QgZXhpc3RzID0gZnMuc3RhdEFzeW5jKHBhdGguam9pbihtb2RGb2xkZXIpKS50aGVuKCgpID0+IHRydWUpLmNhdGNoKCgpID0+IGZhbHNlKTtcbiAgICBpZiAoIWV4aXN0cykge1xuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShhY2N1bSk7XG4gICAgfVxuXG4gICAgLy8gT2ssIHdlIGtub3cgdGhlIGZvbGRlciBpcyB0aGVyZSAtIGxldHMgZW5zdXJlIHRoYXRcbiAgICAvLyAgaXQgYWN0dWFsbHkgY29udGFpbnMgZmlsZXMuXG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IGVudHJpZXMgPSBhd2FpdCB3YWxrUGF0aChtb2RGb2xkZXIsIHsgc2tpcEhpZGRlbjogdHJ1ZSwgc2tpcExpbmtzOiB0cnVlIH0pO1xuICAgICAgaWYgKGVudHJpZXMubGVuZ3RoID4gMCkge1xuICAgICAgICBjb25zdCBmaWxlcyA9IGVudHJpZXMuZmlsdGVyKGVudHJ5ID0+ICFlbnRyeS5pc0RpcmVjdG9yeVxuICAgICAgICAgICYmIChwYXRoLmV4dG5hbWUocGF0aC5iYXNlbmFtZShlbnRyeS5maWxlUGF0aCkpICE9PSAnJylcbiAgICAgICAgICAmJiAoZW50cnk/LmxpbmtDb3VudCA9PT0gdW5kZWZpbmVkIHx8IGVudHJ5LmxpbmtDb3VudCA8PSAxKSk7XG4gICAgICAgIGlmIChmaWxlcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgYWNjdW0ucHVzaChtb2QpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICBpZiAoIVsnRU5PRU5UJywgJ0VOT1RGT1VORCddLnNvbWUoZXJyLmNvZGUpKSB7XG4gICAgICAgIGxvZygnZXJyb3InLCAndW5hYmxlIHRvIHdhbGsgcGF0aCcsIGVycik7XG4gICAgICB9XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKGFjY3VtKTtcbiAgICB9XG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShhY2N1bSk7XG4gIH0sIFByb21pc2UucmVzb2x2ZShbXSkpO1xuICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHZhbGlkQ2FuZGlkYXRlcyk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc0xvY2tlZEVudHJ5KG1vZE5hbWU6IHN0cmluZykge1xuICAvLyBXZSdyZSBhZGRpbmcgdGhpcyB0byBhdm9pZCBoYXZpbmcgdGhlIGxvYWQgb3JkZXIgcGFnZVxuICAvLyAgZnJvbSBub3QgbG9hZGluZyBpZiB3ZSBlbmNvdW50ZXIgYW4gaW52YWxpZCBtb2QgbmFtZS5cbiAgaWYgKCFtb2ROYW1lIHx8IHR5cGVvZiAobW9kTmFtZSkgIT09ICdzdHJpbmcnKSB7XG4gICAgbG9nKCdkZWJ1ZycsICdlbmNvdW50ZXJlZCBpbnZhbGlkIG1vZCBpbnN0YW5jZS9uYW1lJyk7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIHJldHVybiBtb2ROYW1lLnN0YXJ0c1dpdGgoTE9DS0VEX1BSRUZJWCk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBkZXRlcm1pbmVFeGVjdXRhYmxlKGRpc2NvdmVyZWRQYXRoOiBzdHJpbmcpOiBzdHJpbmcge1xuICAvLyBFbmhhbmNlZCBwbGF0Zm9ybS1hd2FyZSBsb2dpYyB3aGlsZSBtYWludGFpbmluZyBzeW5jaHJvbm91cyBBUElcbiAgaWYgKGRpc2NvdmVyZWRQYXRoICE9PSB1bmRlZmluZWQpIHtcbiAgICAvLyBPbiBtYWNPUywgY2hlY2sgZm9yIG5hdGl2ZSBhcHAgYnVuZGxlIGZpcnN0XG4gICAgaWYgKHByb2Nlc3MucGxhdGZvcm0gPT09ICdkYXJ3aW4nKSB7XG4gICAgICB0cnkge1xuICAgICAgICBjb25zdCBtYWNFeGVjdXRhYmxlID0gcGF0aC5qb2luKGRpc2NvdmVyZWRQYXRoLCAnQ29udGVudHMnLCAnTWFjT1MnLCAnd2l0Y2hlcjMnKTtcbiAgICAgICAgZnMuc3RhdFN5bmMobWFjRXhlY3V0YWJsZSk7XG4gICAgICAgIHJldHVybiAnQ29udGVudHMvTWFjT1Mvd2l0Y2hlcjMnO1xuICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgIC8vIENvbnRpbnVlIHRvIFdpbmRvd3MgZXhlY3V0YWJsZSBjaGVja3NcbiAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgLy8gQ2hlY2sgZm9yIERYMTIgdmVyc2lvbiAocHJlZmVycmVkIG9uIFdpbmRvd3MpXG4gICAgdHJ5IHtcbiAgICAgIGZzLnN0YXRTeW5jKHBhdGguam9pbihkaXNjb3ZlcmVkUGF0aCwgJ2JpbicsICd4NjRfRFgxMicsICd3aXRjaGVyMy5leGUnKSk7XG4gICAgICByZXR1cm4gJ2Jpbi94NjRfRFgxMi93aXRjaGVyMy5leGUnO1xuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgLy8gbm9wLCB1c2UgZmFsbGJhY2tcbiAgICB9XG4gICAgXG4gICAgLy8gQ2hlY2sgZm9yIHN0YW5kYXJkIHZlcnNpb25cbiAgICB0cnkge1xuICAgICAgZnMuc3RhdFN5bmMocGF0aC5qb2luKGRpc2NvdmVyZWRQYXRoLCAnYmluJywgJ3g2NCcsICd3aXRjaGVyMy5leGUnKSk7XG4gICAgICByZXR1cm4gJ2Jpbi94NjQvd2l0Y2hlcjMuZXhlJztcbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgIC8vIG5vcCwgdXNlIGZhbGxiYWNrXG4gICAgfVxuICAgIFxuICAgIC8vIE9uIExpbnV4LCBjaGVjayBmb3IgbmF0aXZlIGV4ZWN1dGFibGVcbiAgICBpZiAocHJvY2Vzcy5wbGF0Zm9ybSA9PT0gJ2xpbnV4Jykge1xuICAgICAgdHJ5IHtcbiAgICAgICAgY29uc3QgbGludXhFeGVjdXRhYmxlID0gcGF0aC5qb2luKGRpc2NvdmVyZWRQYXRoLCAnYmluJywgJ3dpdGNoZXIzJyk7XG4gICAgICAgIGZzLnN0YXRTeW5jKGxpbnV4RXhlY3V0YWJsZSk7XG4gICAgICAgIHJldHVybiAnYmluL3dpdGNoZXIzJztcbiAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAvLyBDb250aW51ZSB0byBmYWxsYmFja1xuICAgICAgfVxuICAgIH1cbiAgfVxuICBcbiAgLy8gRmluYWwgZmFsbGJhY2sgYmFzZWQgb24gcGxhdGZvcm1cbiAgaWYgKHByb2Nlc3MucGxhdGZvcm0gPT09ICdkYXJ3aW4nKSB7XG4gICAgcmV0dXJuICdDb250ZW50cy9NYWNPUy93aXRjaGVyMyc7ICAvLyBBc3N1bWUgYXBwIGJ1bmRsZSBzdHJ1Y3R1cmVcbiAgfSBlbHNlIGlmIChwcm9jZXNzLnBsYXRmb3JtID09PSAnbGludXgnKSB7XG4gICAgcmV0dXJuICdiaW4vd2l0Y2hlcjMnO1xuICB9XG4gIFxuICByZXR1cm4gJ2Jpbi94NjQvd2l0Y2hlcjMuZXhlJzsgIC8vIFdpbmRvd3MgZmFsbGJhY2tcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGZvcmNlUmVmcmVzaChhcGk6IHR5cGVzLklFeHRlbnNpb25BcGkpIHtcbiAgY29uc3Qgc3RhdGUgPSBhcGkuZ2V0U3RhdGUoKTtcbiAgY29uc3QgcHJvZmlsZUlkID0gc2VsZWN0b3JzLmxhc3RBY3RpdmVQcm9maWxlRm9yR2FtZShzdGF0ZSwgR0FNRV9JRCk7XG4gIGNvbnN0IGFjdGlvbiA9IHtcbiAgICB0eXBlOiAnU0VUX0ZCX0ZPUkNFX1VQREFURScsXG4gICAgcGF5bG9hZDoge1xuICAgICAgcHJvZmlsZUlkLFxuICAgIH0sXG4gIH07XG4gIGFwaS5zdG9yZS5kaXNwYXRjaChhY3Rpb24pO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gd2Fsa1BhdGgoZGlyUGF0aDogc3RyaW5nLCB3YWxrT3B0aW9ucz86IElXYWxrT3B0aW9ucyk6IFByb21pc2U8SUVudHJ5W10+IHtcbiAgd2Fsa09wdGlvbnMgPSB3YWxrT3B0aW9ucyB8fCB7IHNraXBMaW5rczogdHJ1ZSwgc2tpcEhpZGRlbjogdHJ1ZSwgc2tpcEluYWNjZXNzaWJsZTogdHJ1ZSB9O1xuICAvLyBXZSBSRUFMTFkgZG9uJ3QgY2FyZSBmb3IgaGlkZGVuIG9yIGluYWNjZXNzaWJsZSBmaWxlcy5cbiAgd2Fsa09wdGlvbnMgPSB7IC4uLndhbGtPcHRpb25zLCBza2lwSGlkZGVuOiB0cnVlLCBza2lwSW5hY2Nlc3NpYmxlOiB0cnVlLCBza2lwTGlua3M6IHRydWUgfTtcbiAgY29uc3Qgd2Fsa1Jlc3VsdHM6IElFbnRyeVtdID0gW107XG4gIHJldHVybiBuZXcgUHJvbWlzZTxJRW50cnlbXT4oYXN5bmMgKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgIGF3YWl0IHR1cmJvd2FsayhkaXJQYXRoLCAoZW50cmllczogSUVudHJ5W10pID0+IHtcbiAgICAgIHdhbGtSZXN1bHRzLnB1c2goLi4uZW50cmllcyk7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCkgYXMgYW55O1xuICAgICAgLy8gSWYgdGhlIGRpcmVjdG9yeSBpcyBtaXNzaW5nIHdoZW4gd2UgdHJ5IHRvIHdhbGsgaXQ7IGl0J3MgbW9zdCBwcm9iYWJseSBkb3duIHRvIGEgY29sbGVjdGlvbiBiZWluZ1xuICAgICAgLy8gIGluIHRoZSBwcm9jZXNzIG9mIGJlaW5nIGluc3RhbGxlZC9yZW1vdmVkLiBXZSBjYW4gc2FmZWx5IGlnbm9yZSB0aGlzLlxuICAgIH0sIHdhbGtPcHRpb25zKS5jYXRjaChlcnIgPT4gZXJyLmNvZGUgPT09ICdFTk9FTlQnID8gUHJvbWlzZS5yZXNvbHZlKCkgOiBQcm9taXNlLnJlamVjdChlcnIpKTtcbiAgICByZXR1cm4gcmVzb2x2ZSh3YWxrUmVzdWx0cyk7XG4gIH0pO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gdmFsaWRhdGVQcm9maWxlKHByb2ZpbGVJZDogc3RyaW5nLCBzdGF0ZTogdHlwZXMuSVN0YXRlKSB7XG4gIGNvbnN0IGFjdGl2ZVByb2ZpbGUgPSBzZWxlY3RvcnMuYWN0aXZlUHJvZmlsZShzdGF0ZSk7XG4gIGNvbnN0IGRlcGxveVByb2ZpbGUgPSBzZWxlY3RvcnMucHJvZmlsZUJ5SWQoc3RhdGUsIHByb2ZpbGVJZCk7XG4gIGlmICghIWFjdGl2ZVByb2ZpbGUgJiYgISFkZXBsb3lQcm9maWxlICYmIChkZXBsb3lQcm9maWxlLmlkICE9PSBhY3RpdmVQcm9maWxlLmlkKSkge1xuICAgIHJldHVybiB1bmRlZmluZWQ7XG4gIH1cblxuICBpZiAoYWN0aXZlUHJvZmlsZT8uZ2FtZUlkICE9PSBHQU1FX0lEKSB7XG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgfVxuXG4gIHJldHVybiBhY3RpdmVQcm9maWxlO1xufTtcblxuZXhwb3J0IGZ1bmN0aW9uIGlzWE1MKGZpbGVQYXRoOiBzdHJpbmcpIHtcbiAgcmV0dXJuIFsnLnhtbCddLmluY2x1ZGVzKHBhdGguZXh0bmFtZShmaWxlUGF0aCkudG9Mb3dlckNhc2UoKSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc1NldHRpbmdzRmlsZShmaWxlUGF0aDogc3RyaW5nKSB7XG4gIHJldHVybiBbJy5zZXR0aW5ncycsIFBBUlRfU1VGRklYXS5zb21lKGV4dCA9PiBmaWxlUGF0aC50b0xvd2VyQ2FzZSgpLmVuZHNXaXRoKGV4dClcbiAgICAmJiBwYXRoLmJhc2VuYW1lKGZpbGVQYXRoKS50b0xvd2VyQ2FzZSgpICE9PSAnbW9kcy5zZXR0aW5ncycpO1xufVxuXG4vLyBleHBvcnQgZnVuY3Rpb24gaXNTZXR0aW5nc01lcmdlU3VwcHJlc3NlZChhcGk6IHR5cGVzLklFeHRlbnNpb25BcGkpIHtcbi8vICAgY29uc3Qgc3RhdGUgPSBhcGkuZ2V0U3RhdGUoKTtcbi8vICAgcmV0dXJuIHV0aWwuZ2V0U2FmZShzdGF0ZSwgWydzZXR0aW5ncycsICd3aXRjaGVyMycsICdzdXBwcmVzc1NldHRpbmdzTWVyZ2UnXSwgdHJ1ZSk7XG4vLyB9XG5cbmV4cG9ydCBmdW5jdGlvbiBzdXBwcmVzc0V2ZW50SGFuZGxlcnMoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpKSB7XG4gIC8vIFRoaXMgaXNuJ3QgY29vbCwgYnV0IG1laC5cbiAgY29uc3Qgc3RhdGUgPSBhcGkuZ2V0U3RhdGUoKTtcbiAgcmV0dXJuIChzdGF0ZS5zZXNzaW9uLm5vdGlmaWNhdGlvbnMubm90aWZpY2F0aW9ucy5zb21lKG4gPT4gbi5pZCA9PT0gQUNUSVZJVFlfSURfSU1QT1JUSU5HX0xPQURPUkRFUikpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gdG9CbHVlPFQ+KGZ1bmM6ICguLi5hcmdzOiBhbnlbXSkgPT4gUHJvbWlzZTxUPik6ICguLi5hcmdzOiBhbnlbXSkgPT4gQmx1ZWJpcmQ8VD4ge1xuICByZXR1cm4gKC4uLmFyZ3M6IGFueVtdKSA9PiBCbHVlYmlyZC5yZXNvbHZlKGZ1bmMoLi4uYXJncykpO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZmlsZUV4aXN0cyhmaWxlUGF0aDogc3RyaW5nKTogUHJvbWlzZTxib29sZWFuPiB7XG4gIHJldHVybiBmcy5zdGF0QXN5bmMoZmlsZVBhdGgpXG4gICAgLnRoZW4oKCkgPT4gdHJ1ZSlcbiAgICAuY2F0Y2goKCkgPT4gZmFsc2UpO1xufSJdfQ==