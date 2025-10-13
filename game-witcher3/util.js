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
exports.hasPrefix = exports.isTW3 = exports.getTLPath = exports.getDLCPath = exports.getDocumentsPath = void 0;
exports.getDeployment = getDeployment;
exports.notifyMissingScriptMerger = notifyMissingScriptMerger;
exports.findModFolders = findModFolders;
exports.getManagedModNames = getManagedModNames;
exports.getAllMods = getAllMods;
exports.getManuallyAddedMods = getManuallyAddedMods;
exports.isLockedEntry = isLockedEntry;
exports.determineExecutable = determineExecutable;
exports.forceRefresh = forceRefresh;
exports.walkPath = walkPath;
exports.validateProfile = validateProfile;
exports.isXML = isXML;
exports.isSettingsFile = isSettingsFile;
exports.suppressEventHandlers = suppressEventHandlers;
exports.toBlue = toBlue;
exports.fileExists = fileExists;
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
function isLockedEntry(modName) {
    if (!modName || typeof (modName) !== 'string') {
        (0, vortex_api_1.log)('debug', 'encountered invalid mod instance/name');
        return false;
    }
    return modName.startsWith(common_1.LOCKED_PREFIX);
}
function determineExecutable(discoveredPath) {
    if (discoveredPath !== undefined) {
        try {
            vortex_api_1.fs.statSync(path_1.default.join(discoveredPath, 'bin', 'x64_DX12', 'witcher3.exe'));
            return 'bin/x64_DX12/witcher3.exe';
        }
        catch (err) {
        }
    }
    return 'bin/x64/witcher3.exe';
}
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
;
function isXML(filePath) {
    return ['.xml'].includes(path_1.default.extname(filePath).toLowerCase());
}
function isSettingsFile(filePath) {
    return ['.settings', common_1.PART_SUFFIX].some(ext => filePath.toLowerCase().endsWith(ext)
        && path_1.default.basename(filePath).toLowerCase() !== 'mods.settings');
}
function suppressEventHandlers(api) {
    const state = api.getState();
    return (state.session.notifications.notifications.some(n => n.id === common_1.ACTIVITY_ID_IMPORTING_LOADORDER));
}
function toBlue(func) {
    return (...args) => bluebird_1.default.resolve(func(...args));
}
function fileExists(filePath) {
    return __awaiter(this, void 0, void 0, function* () {
        return vortex_api_1.fs.statAsync(filePath)
            .then(() => true)
            .catch(() => false);
    });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInV0aWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7O0FBZUEsc0NBb0NDO0FBaUNELDhEQWdDQztBQWFELHdDQXNCQztBQUVELGdEQWtCQztBQUVELGdDQTJCQztBQUVELG9EQXNEQztBQUVELHNDQVFDO0FBRUQsa0RBVUM7QUFFRCxvQ0FVQztBQUVELDRCQWNDO0FBRUQsMENBWUM7QUFFRCxzQkFFQztBQUVELHdDQUdDO0FBT0Qsc0RBSUM7QUFFRCx3QkFFQztBQUVELGdDQUlDO0FBN1ZELHdEQUFnQztBQUNoQywyQ0FBNkQ7QUFFN0QsNERBQXVDO0FBRXZDLGdEQUF3QjtBQUV4QixtRUFBNEQ7QUFFNUQsMERBQTREO0FBRTVELHFDQUFnSDtBQUdoSCxTQUFzQixhQUFhLENBQUMsR0FBd0IsRUFDMUQsWUFBdUI7O1FBQ3ZCLE1BQU0sS0FBSyxHQUFHLEdBQUcsQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUM3QixNQUFNLFNBQVMsR0FBRyxpQkFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQ2xDLENBQUMsVUFBVSxFQUFFLFVBQVUsRUFBRSxZQUFZLEVBQUUsZ0JBQU8sQ0FBQyxFQUFFLFNBQVMsQ0FBQyxDQUFDO1FBQzlELE1BQU0sSUFBSSxHQUFHLGlCQUFJLENBQUMsT0FBTyxDQUFDLGdCQUFPLENBQUMsQ0FBQztRQUNuQyxJQUFJLENBQUMsSUFBSSxLQUFLLFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQSxTQUFTLGFBQVQsU0FBUyx1QkFBVCxTQUFTLENBQUUsSUFBSSxNQUFLLFNBQVMsQ0FBQyxFQUFFLENBQUM7WUFDNUQsSUFBQSxnQkFBRyxFQUFDLE9BQU8sRUFBRSx3QkFBd0IsRUFBRSxnQkFBTyxDQUFDLENBQUM7WUFDaEQsT0FBTyxTQUFTLENBQUM7UUFDbkIsQ0FBQztRQUVELE1BQU0sSUFBSSxHQUFvQyxpQkFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQzlE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UUFBUSxDQUFDLGNBQUksQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLENBQUMsV0FBVyxFQUFFLENBQUMsQ0FBQztBQUNqRSxDQUFDO0FBRUQsU0FBZ0IsY0FBYyxDQUFDLFFBQWdCO0lBQzdDLE9BQU8sQ0FBQyxXQUFXLEVBQUUsb0JBQVcsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLFFBQVEsQ0FBQyxXQUFXLEVBQUUsQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDO1dBQzdFLGNBQUksQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLENBQUMsV0FBVyxFQUFFLEtBQUssZUFBZSxDQUFDLENBQUM7QUFDbEUsQ0FBQztBQU9ELFNBQWdCLHFCQUFxQixDQUFDLEdBQXdCO0lBRTVELE1BQU0sS0FBSyxHQUFHLEdBQUcsQ0FBQyxRQUFRLEVBQUUsQ0FBQztJQUM3QixPQUFPLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxhQUFhLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLEtBQUssd0NBQStCLENBQUMsQ0FBQyxDQUFDO0FBQ3pHLENBQUM7QUFFRCxTQUFnQixNQUFNLENBQUksSUFBb0M7SUFDNUQsT0FBTyxDQUFDLEdBQUcsSUFBVyxFQUFFLEVBQUUsQ0FBQyxrQkFBUSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDO0FBQzdELENBQUM7QUFFRCxTQUFzQixVQUFVLENBQUMsUUFBZ0I7O1FBQy9DLE9BQU8sZUFBRSxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUM7YUFDMUIsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQzthQUNoQixLQUFLLENBQUMsR0FBRyxFQUFFLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDeEIsQ0FBQztDQUFBIiwic291cmNlc0NvbnRlbnQiOlsiLyogZXNsaW50LWRpc2FibGUgKi9cbmltcG9ydCBCbHVlYmlyZCBmcm9tICdibHVlYmlyZCc7XG5pbXBvcnQgeyBmcywgbG9nLCB0eXBlcywgc2VsZWN0b3JzLCB1dGlsIH0gZnJvbSAndm9ydGV4LWFwaSc7XG5cbmltcG9ydCBJbmlTdHJ1Y3R1cmUgZnJvbSAnLi9pbmlQYXJzZXInO1xuXG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcblxuaW1wb3J0IHsgZ2V0TWVyZ2VkTW9kTmFtZXMgfSBmcm9tICcuL21lcmdlSW52ZW50b3J5UGFyc2luZyc7XG5cbmltcG9ydCB0dXJib3dhbGssIHsgSUVudHJ5LCBJV2Fsa09wdGlvbnMgfSBmcm9tICd0dXJib3dhbGsnO1xuXG5pbXBvcnQgeyBHQU1FX0lELCBMT0NLRURfUFJFRklYLCBJMThOX05BTUVTUEFDRSwgQUNUSVZJVFlfSURfSU1QT1JUSU5HX0xPQURPUkRFUiwgUEFSVF9TVUZGSVggfSBmcm9tICcuL2NvbW1vbic7XG5pbXBvcnQgeyBJRGVwbG95ZWRGaWxlLCBJRGVwbG95bWVudCwgUHJlZml4VHlwZSB9IGZyb20gJy4vdHlwZXMnO1xuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZ2V0RGVwbG95bWVudChhcGk6IHR5cGVzLklFeHRlbnNpb25BcGksXG4gIGluY2x1ZGVkTW9kcz86IHN0cmluZ1tdKTogUHJvbWlzZTxJRGVwbG95bWVudD4ge1xuICBjb25zdCBzdGF0ZSA9IGFwaS5nZXRTdGF0ZSgpO1xuICBjb25zdCBkaXNjb3ZlcnkgPSB1dGlsLmdldFNhZmUoc3RhdGUsXG4gICAgWydzZXR0aW5ncycsICdnYW1lTW9kZScsICdkaXNjb3ZlcmVkJywgR0FNRV9JRF0sIHVuZGVmaW5lZCk7XG4gIGNvbnN0IGdhbWUgPSB1dGlsLmdldEdhbWUoR0FNRV9JRCk7XG4gIGlmICgoZ2FtZSA9PT0gdW5kZWZpbmVkKSB8fCAoZGlzY292ZXJ5Py5wYXRoID09PSB1bmRlZmluZWQpKSB7XG4gICAgbG9nKCdlcnJvcicsICdnYW1lIGlzIG5vdCBkaXNjb3ZlcmVkJywgR0FNRV9JRCk7XG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgfVxuXG4gIGNvbnN0IG1vZHM6IHsgW21vZElkOiBzdHJpbmddOiB0eXBlcy5JTW9kIH0gPSB1dGlsLmdldFNhZmUoc3RhdGUsXG4gICAgWydwZXJzaXN0ZW50JywgJ21vZHMnLCBHQU1FX0lEXSwge30pO1xuXG4gIGNvbnN0IGluc3RhbGxhdGlvbkRpcmVjdG9yaWVzID0gT2JqZWN0LnZhbHVlcyhtb2RzKVxuICAgIC5maWx0ZXIobW9kID0+IChpbmNsdWRlZE1vZHMgIT09IHVuZGVmaW5lZClcbiAgICAgID8gaW5jbHVkZWRNb2RzLmluY2x1ZGVzKG1vZC5pZClcbiAgICAgIDogdHJ1ZSlcbiAgICAubWFwKG1vZCA9PiBtb2QuaW5zdGFsbGF0aW9uUGF0aCk7XG5cbiAgY29uc3QgZmlsdGVyRnVuYyA9IChmaWxlOiBJRGVwbG95ZWRGaWxlKSA9PiBpbnN0YWxsYXRpb25EaXJlY3Rvcmllcy5pbmNsdWRlcyhmaWxlLnNvdXJjZSk7XG5cbiAgY29uc3QgbW9kUGF0aHM6IHsgW3R5cGVJZDogc3RyaW5nXTogc3RyaW5nIH0gPSBnYW1lLmdldE1vZFBhdGhzKGRpc2NvdmVyeS5wYXRoKTtcbiAgY29uc3QgbW9kVHlwZXMgPSBPYmplY3Qua2V5cyhtb2RQYXRocykuZmlsdGVyKGtleSA9PiAhIW1vZFBhdGhzW2tleV0pO1xuICBjb25zdCBkZXBsb3ltZW50OiBJRGVwbG95bWVudCA9IGF3YWl0IG1vZFR5cGVzLnJlZHVjZShhc3luYyAoYWNjdW1QLCBtb2RUeXBlKSA9PiB7XG4gICAgY29uc3QgYWNjdW0gPSBhd2FpdCBhY2N1bVA7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IG1hbmlmZXN0OiB0eXBlcy5JRGVwbG95bWVudE1hbmlmZXN0ID0gYXdhaXQgdXRpbC5nZXRNYW5pZmVzdChhcGksIG1vZFR5cGUsIEdBTUVfSUQpO1xuICAgICAgYWNjdW1bbW9kVHlwZV0gPSBtYW5pZmVzdC5maWxlcy5maWx0ZXIoZmlsdGVyRnVuYyk7XG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICBsb2coJ2Vycm9yJywgJ2ZhaWxlZCB0byBnZXQgbWFuaWZlc3QnLCBlcnIpO1xuICAgIH1cbiAgICByZXR1cm4gYWNjdW07XG4gIH0sIHt9KTtcblxuICByZXR1cm4gZGVwbG95bWVudDtcbn1cblxuZXhwb3J0IGNvbnN0IGdldERvY3VtZW50c1BhdGggPSAoZ2FtZTogdHlwZXMuSUdhbWUpID0+IHtcbiAgcmV0dXJuIHBhdGguam9pbih1dGlsLmdldFZvcnRleFBhdGgoJ2RvY3VtZW50cycpLCAnVGhlIFdpdGNoZXIgMycpXG59XG5cbmV4cG9ydCBjb25zdCBnZXRETENQYXRoID0gKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSkgPT4ge1xuICByZXR1cm4gKGdhbWU6IHR5cGVzLklHYW1lKSA9PiB7XG4gICAgY29uc3Qgc3RhdGUgPSBhcGkuc3RvcmUuZ2V0U3RhdGUoKTtcbiAgICBjb25zdCBkaXNjb3ZlcnkgPSBzdGF0ZS5zZXR0aW5ncy5nYW1lTW9kZS5kaXNjb3ZlcmVkW2dhbWUuaWRdO1xuICAgIHJldHVybiBwYXRoLmpvaW4oZGlzY292ZXJ5LnBhdGgsICdETEMnKTtcbiAgfVxufTtcblxuZXhwb3J0IGNvbnN0IGdldFRMUGF0aCA9ICgoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpKSA9PiB7XG4gIHJldHVybiAoZ2FtZTogdHlwZXMuSUdhbWUpID0+IHtcbiAgICBjb25zdCBzdGF0ZSA9IGFwaS5zdG9yZS5nZXRTdGF0ZSgpO1xuICAgIGNvbnN0IGRpc2NvdmVyeSA9IHN0YXRlLnNldHRpbmdzLmdhbWVNb2RlLmRpc2NvdmVyZWRbZ2FtZS5pZF07XG4gICAgcmV0dXJuIGRpc2NvdmVyeS5wYXRoO1xuICB9XG59KTtcblxuZXhwb3J0IGNvbnN0IGlzVFczID0gKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSkgPT4ge1xuICByZXR1cm4gKGdhbWVJZDogc3RyaW5nKSA9PiB7XG4gICAgaWYgKGdhbWVJZCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICByZXR1cm4gKGdhbWVJZCA9PT0gR0FNRV9JRCk7XG4gICAgfVxuICAgIGNvbnN0IHN0YXRlID0gYXBpLmdldFN0YXRlKCk7XG4gICAgY29uc3QgZ2FtZU1vZGUgPSBzZWxlY3RvcnMuYWN0aXZlR2FtZUlkKHN0YXRlKTtcbiAgICByZXR1cm4gKGdhbWVNb2RlID09PSBHQU1FX0lEKTtcbiAgfVxufTtcblxuZXhwb3J0IGZ1bmN0aW9uIG5vdGlmeU1pc3NpbmdTY3JpcHRNZXJnZXIoYXBpKSB7XG4gIGNvbnN0IG5vdGlmSWQgPSAnbWlzc2luZy1zY3JpcHQtbWVyZ2VyJztcbiAgYXBpLnNlbmROb3RpZmljYXRpb24oe1xuICAgIGlkOiBub3RpZklkLFxuICAgIHR5cGU6ICdpbmZvJyxcbiAgICBtZXNzYWdlOiBhcGkudHJhbnNsYXRlKCdXaXRjaGVyIDMgc2NyaXB0IG1lcmdlciBpcyBtaXNzaW5nL21pc2NvbmZpZ3VyZWQnLFxuICAgICAgeyBuczogSTE4Tl9OQU1FU1BBQ0UgfSksXG4gICAgYWxsb3dTdXBwcmVzczogdHJ1ZSxcbiAgICBhY3Rpb25zOiBbXG4gICAgICB7XG4gICAgICAgIHRpdGxlOiAnTW9yZScsXG4gICAgICAgIGFjdGlvbjogKCkgPT4ge1xuICAgICAgICAgIGFwaS5zaG93RGlhbG9nKCdpbmZvJywgJ1dpdGNoZXIgMyBTY3JpcHQgTWVyZ2VyJywge1xuICAgICAgICAgICAgYmJjb2RlOiBhcGkudHJhbnNsYXRlKCdWb3J0ZXggaXMgdW5hYmxlIHRvIHJlc29sdmUgdGhlIFNjcmlwdCBNZXJnZXJcXCdzIGxvY2F0aW9uLiBUaGUgdG9vbCBuZWVkcyB0byBiZSBkb3dubG9hZGVkIGFuZCBjb25maWd1cmVkIG1hbnVhbGx5LiAnXG4gICAgICAgICAgICAgICsgJ1t1cmw9aHR0cHM6Ly93aWtpLm5leHVzbW9kcy5jb20vaW5kZXgucGhwL1Rvb2xfU2V0dXA6X1dpdGNoZXJfM19TY3JpcHRfTWVyZ2VyXUZpbmQgb3V0IG1vcmUgYWJvdXQgaG93IHRvIGNvbmZpZ3VyZSBpdCBhcyBhIHRvb2wgZm9yIHVzZSBpbiBWb3J0ZXguWy91cmxdW2JyXVsvYnJdW2JyXVsvYnJdJ1xuICAgICAgICAgICAgICArICdOb3RlOiBXaGlsZSBzY3JpcHQgbWVyZ2luZyB3b3JrcyB3ZWxsIHdpdGggdGhlIHZhc3QgbWFqb3JpdHkgb2YgbW9kcywgdGhlcmUgaXMgbm8gZ3VhcmFudGVlIGZvciBhIHNhdGlzZnlpbmcgb3V0Y29tZSBpbiBldmVyeSBzaW5nbGUgY2FzZS4nLCB7IG5zOiBJMThOX05BTUVTUEFDRSB9KSxcbiAgICAgICAgICB9LCBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIGxhYmVsOiAnQ2FuY2VsJywgYWN0aW9uOiAoKSA9PiB7XG4gICAgICAgICAgICAgICAgYXBpLmRpc21pc3NOb3RpZmljYXRpb24oJ21pc3Npbmctc2NyaXB0LW1lcmdlcicpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBsYWJlbDogJ0Rvd25sb2FkIFNjcmlwdCBNZXJnZXInLCBhY3Rpb246ICgpID0+IHV0aWwub3BuKCdodHRwczovL3d3dy5uZXh1c21vZHMuY29tL3dpdGNoZXIzL21vZHMvNDg0JylcbiAgICAgICAgICAgICAgICAuY2F0Y2goZXJyID0+IG51bGwpXG4gICAgICAgICAgICAgICAgLnRoZW4oKCkgPT4gYXBpLmRpc21pc3NOb3RpZmljYXRpb24oJ21pc3Npbmctc2NyaXB0LW1lcmdlcicpKVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICBdKTtcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgXSxcbiAgfSk7XG59XG5cbmV4cG9ydCBjb25zdCBoYXNQcmVmaXggPSAocHJlZml4OiBQcmVmaXhUeXBlLCBmaWxlRW50cnk6IHN0cmluZykgPT4ge1xuICBjb25zdCBzZWdtZW50cyA9IGZpbGVFbnRyeS50b0xvd2VyQ2FzZSgpLnNwbGl0KHBhdGguc2VwKTtcbiAgY29uc3QgY29udGVudElkeCA9IHNlZ21lbnRzLmluZGV4T2YoJ2NvbnRlbnQnKTtcbiAgaWYgKFstMSwgMF0uaW5jbHVkZXMoY29udGVudElkeCkpIHtcbiAgICAvLyBObyBjb250ZW50IGZvbGRlciwgbm8gbW9kLlxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIHJldHVybiBzZWdtZW50c1tjb250ZW50SWR4IC0gMV0uaW5kZXhPZihwcmVmaXgpICE9PSAtMTtcbn07XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBmaW5kTW9kRm9sZGVycyhpbnN0YWxsYXRpb25QYXRoOiBzdHJpbmcsIG1vZDogdHlwZXMuSU1vZCk6IFByb21pc2U8c3RyaW5nW10+IHtcbiAgaWYgKCFpbnN0YWxsYXRpb25QYXRoIHx8ICFtb2Q/Lmluc3RhbGxhdGlvblBhdGgpIHtcbiAgICBjb25zdCBlcnJNZXNzYWdlID0gIWluc3RhbGxhdGlvblBhdGhcbiAgICAgID8gJ0dhbWUgaXMgbm90IGRpc2NvdmVyZWQnXG4gICAgICA6ICdGYWlsZWQgdG8gcmVzb2x2ZSBtb2QgaW5zdGFsbGF0aW9uIHBhdGgnO1xuICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgRXJyb3IoZXJyTWVzc2FnZSkpO1xuICB9XG5cbiAgY29uc3QgdmFsaWROYW1lcyA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuICBhd2FpdCB0dXJib3dhbGsocGF0aC5qb2luKGluc3RhbGxhdGlvblBhdGgsIG1vZC5pbnN0YWxsYXRpb25QYXRoKSwgKGVudHJpZXM6IElFbnRyeVtdKSA9PiB7XG4gICAgZW50cmllcy5mb3JFYWNoKGVudHJ5ID0+IHtcbiAgICAgIGNvbnN0IHNlZ21lbnRzID0gZW50cnkuZmlsZVBhdGguc3BsaXQocGF0aC5zZXApO1xuICAgICAgY29uc3QgY29udGVudElkeCA9IHNlZ21lbnRzLmZpbmRJbmRleChzZWcgPT4gc2VnLnRvTG93ZXJDYXNlKCkgPT09ICdjb250ZW50Jyk7XG4gICAgICBpZiAoIVstMSwgMF0uaW5jbHVkZXMoY29udGVudElkeCkpIHtcbiAgICAgICAgdmFsaWROYW1lcy5hZGQoc2VnbWVudHNbY29udGVudElkeCAtIDFdKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfSwgeyByZWN1cnNlOiB0cnVlLCBza2lwSGlkZGVuOiB0cnVlLCBza2lwTGlua3M6IHRydWUgfSk7XG4gIGNvbnN0IHZhbGlkRW50cmllcyA9IEFycmF5LmZyb20odmFsaWROYW1lcyk7XG4gIHJldHVybiAodmFsaWRFbnRyaWVzLmxlbmd0aCA+IDApXG4gICAgPyBQcm9taXNlLnJlc29sdmUodmFsaWRFbnRyaWVzKVxuICAgIDogUHJvbWlzZS5yZWplY3QobmV3IEVycm9yKCdGYWlsZWQgdG8gZmluZCBtb2QgZm9sZGVyJykpO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZ2V0TWFuYWdlZE1vZE5hbWVzKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSwgbW9kczogdHlwZXMuSU1vZFtdKTogUHJvbWlzZTx7IG5hbWU6IHN0cmluZywgaWQ6IHN0cmluZyB9W10+IHtcbiAgY29uc3QgaW5zdGFsbGF0aW9uUGF0aCA9IHNlbGVjdG9ycy5pbnN0YWxsUGF0aEZvckdhbWUoYXBpLmdldFN0YXRlKCksIEdBTUVfSUQpO1xuICByZXR1cm4gbW9kcy5yZWR1Y2UoYXN5bmMgKGFjY3VtUCwgbW9kKSA9PiB7XG4gICAgY29uc3QgYWNjdW0gPSBhd2FpdCBhY2N1bVA7XG4gICAgbGV0IGZvbGRlck5hbWVzID0gW107XG4gICAgdHJ5IHtcbiAgICAgIGlmICghZm9sZGVyTmFtZXMgfHwgWydjb2xsZWN0aW9uJywgJ3czbW9kbGltaXRwYXRjaGVyJ10uaW5jbHVkZXMobW9kLnR5cGUpKSB7XG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoYWNjdW0pO1xuICAgICAgfVxuICAgICAgZm9sZGVyTmFtZXMgPSBhd2FpdCBmaW5kTW9kRm9sZGVycyhpbnN0YWxsYXRpb25QYXRoLCBtb2QpO1xuICAgICAgZm9yIChjb25zdCBjb21wb25lbnQgb2YgZm9sZGVyTmFtZXMpIHtcbiAgICAgICAgYWNjdW0ucHVzaCh7IGlkOiBtb2QuaWQsIG5hbWU6IGNvbXBvbmVudCB9KTtcbiAgICAgIH1cbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgIGxvZygnd2FybicsICd1bmFibGUgdG8gcmVzb2x2ZSBtb2QgbmFtZScsIG1vZC5pZCk7XG4gICAgfVxuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoYWNjdW0pO1xuICB9LCBQcm9taXNlLnJlc29sdmUoW10pKTtcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGdldEFsbE1vZHMoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpKSB7XG4gIC8vIE1vZCB0eXBlcyB3ZSBkb24ndCB3YW50IHRvIGRpc3BsYXkgaW4gdGhlIExPIHBhZ2VcbiAgY29uc3QgaW52YWxpZE1vZFR5cGVzID0gWyd3aXRjaGVyM21lbnVtb2Rkb2N1bWVudHMnLCAnY29sbGVjdGlvbiddO1xuICBjb25zdCBzdGF0ZSA9IGFwaS5nZXRTdGF0ZSgpO1xuICBjb25zdCBwcm9maWxlID0gc2VsZWN0b3JzLmFjdGl2ZVByb2ZpbGUoc3RhdGUpO1xuICBpZiAocHJvZmlsZT8uaWQgPT09IHVuZGVmaW5lZCkge1xuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoe1xuICAgICAgbWVyZ2VkOiBbXSxcbiAgICAgIG1hbnVhbDogW10sXG4gICAgICBtYW5hZ2VkOiBbXSxcbiAgICB9KTtcbiAgfVxuICBjb25zdCBtb2RTdGF0ZSA9IHV0aWwuZ2V0U2FmZShzdGF0ZSwgWydwZXJzaXN0ZW50JywgJ3Byb2ZpbGVzJywgcHJvZmlsZS5pZCwgJ21vZFN0YXRlJ10sIHt9KTtcbiAgY29uc3QgbW9kcyA9IHV0aWwuZ2V0U2FmZShzdGF0ZSwgWydwZXJzaXN0ZW50JywgJ21vZHMnLCBHQU1FX0lEXSwge30pO1xuXG4gIC8vIE9ubHkgc2VsZWN0IG1vZHMgd2hpY2ggYXJlIGVuYWJsZWQsIGFuZCBhcmUgbm90IGEgbWVudSBtb2QuXG4gIGNvbnN0IGVuYWJsZWRNb2RzID0gT2JqZWN0LmtleXMobW9kU3RhdGUpLmZpbHRlcihrZXkgPT5cbiAgICAoISFtb2RzW2tleV0gJiYgbW9kU3RhdGVba2V5XS5lbmFibGVkICYmICFpbnZhbGlkTW9kVHlwZXMuaW5jbHVkZXMobW9kc1trZXldLnR5cGUpKSk7XG5cbiAgY29uc3QgbWVyZ2VkTW9kTmFtZXMgPSBhd2FpdCBnZXRNZXJnZWRNb2ROYW1lcyhhcGkpO1xuICBjb25zdCBtYW51YWxseUFkZGVkTW9kcyA9IGF3YWl0IGdldE1hbnVhbGx5QWRkZWRNb2RzKGFwaSk7XG4gIGNvbnN0IG1hbmFnZWRNb2RzID0gYXdhaXQgZ2V0TWFuYWdlZE1vZE5hbWVzKGFwaSwgZW5hYmxlZE1vZHMubWFwKGtleSA9PiBtb2RzW2tleV0pKTtcbiAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh7XG4gICAgbWVyZ2VkOiBtZXJnZWRNb2ROYW1lcyxcbiAgICBtYW51YWw6IG1hbnVhbGx5QWRkZWRNb2RzLmZpbHRlcihtb2QgPT4gIW1lcmdlZE1vZE5hbWVzLmluY2x1ZGVzKG1vZCkpLFxuICAgIG1hbmFnZWQ6IG1hbmFnZWRNb2RzLFxuICB9KTtcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGdldE1hbnVhbGx5QWRkZWRNb2RzKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSkge1xuICBjb25zdCBzdGF0ZSA9IGFwaS5nZXRTdGF0ZSgpO1xuICBjb25zdCBkaXNjb3ZlcnkgPSB1dGlsLmdldFNhZmUoc3RhdGUsIFsnc2V0dGluZ3MnLCAnZ2FtZU1vZGUnLCAnZGlzY292ZXJlZCcsIEdBTUVfSURdLCB1bmRlZmluZWQpO1xuICBpZiAoZGlzY292ZXJ5Py5wYXRoID09PSB1bmRlZmluZWQpIHtcbiAgICAvLyBIb3cvd2h5IGFyZSB3ZSBldmVuIGhlcmUgP1xuICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgdXRpbC5Qcm9jZXNzQ2FuY2VsZWQoJ0dhbWUgaXMgbm90IGRpc2NvdmVyZWQhJykpO1xuICB9XG4gIGxldCBpbmk7XG4gIHRyeSB7XG4gICAgaW5pID0gYXdhaXQgSW5pU3RydWN0dXJlLmdldEluc3RhbmNlKCkuZW5zdXJlTW9kU2V0dGluZ3MoKTtcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgYXBpLnNob3dFcnJvck5vdGlmaWNhdGlvbignRmFpbGVkIHRvIGxvYWQgSU5JIHN0cnVjdHVyZScsIGVyciwgeyBhbGxvd1JlcG9ydDogZmFsc2UgfSk7XG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShbXSk7XG4gIH1cblxuICBjb25zdCBtb2RzID0gdXRpbC5nZXRTYWZlKHN0YXRlLCBbJ3BlcnNpc3RlbnQnLCAnbW9kcycsIEdBTUVfSURdLCB7fSk7XG4gIGNvbnN0IG1vZEtleXMgPSBPYmplY3Qua2V5cyhtb2RzKTtcbiAgY29uc3QgaW5pRW50cmllcyA9IE9iamVjdC5rZXlzKGluaS5kYXRhKTtcbiAgY29uc3QgbWFudWFsQ2FuZGlkYXRlcyA9IFtdLmNvbmNhdChpbmlFbnRyaWVzKS5maWx0ZXIoZW50cnkgPT4ge1xuICAgIGNvbnN0IGhhc1ZvcnRleEtleSA9IHV0aWwuZ2V0U2FmZShpbmkuZGF0YVtlbnRyeV0sIFsnVksnXSwgdW5kZWZpbmVkKSAhPT0gdW5kZWZpbmVkO1xuICAgIHJldHVybiAoKCFoYXNWb3J0ZXhLZXkpIHx8IChpbmkuZGF0YVtlbnRyeV0uVksgPT09IGVudHJ5KSAmJiAhbW9kS2V5cy5pbmNsdWRlcyhlbnRyeSkpO1xuICB9KTtcbiAgY29uc3QgdW5pcXVlQ2FuZGlkYXRlcyA9IG5ldyBTZXQobmV3IFNldChtYW51YWxDYW5kaWRhdGVzKSk7XG4gIGNvbnN0IG1vZHNQYXRoID0gcGF0aC5qb2luKGRpc2NvdmVyeS5wYXRoLCAnTW9kcycpO1xuICBjb25zdCBjYW5kaWRhdGVzID0gQXJyYXkuZnJvbSh1bmlxdWVDYW5kaWRhdGVzKTtcbiAgY29uc3QgdmFsaWRDYW5kaWRhdGVzID0gYXdhaXQgY2FuZGlkYXRlcy5yZWR1Y2UoYXN5bmMgKGFjY3VtUCwgbW9kKSA9PiB7XG4gICAgY29uc3QgYWNjdW0gPSBhd2FpdCBhY2N1bVA7XG4gICAgY29uc3QgbW9kRm9sZGVyID0gcGF0aC5qb2luKG1vZHNQYXRoLCBtb2QpO1xuICAgIGNvbnN0IGV4aXN0cyA9IGZzLnN0YXRBc3luYyhwYXRoLmpvaW4obW9kRm9sZGVyKSkudGhlbigoKSA9PiB0cnVlKS5jYXRjaCgoKSA9PiBmYWxzZSk7XG4gICAgaWYgKCFleGlzdHMpIHtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoYWNjdW0pO1xuICAgIH1cblxuICAgIC8vIE9rLCB3ZSBrbm93IHRoZSBmb2xkZXIgaXMgdGhlcmUgLSBsZXRzIGVuc3VyZSB0aGF0XG4gICAgLy8gIGl0IGFjdHVhbGx5IGNvbnRhaW5zIGZpbGVzLlxuICAgIHRyeSB7XG4gICAgICBjb25zdCBlbnRyaWVzID0gYXdhaXQgd2Fsa1BhdGgobW9kRm9sZGVyLCB7IHNraXBIaWRkZW46IHRydWUsIHNraXBMaW5rczogdHJ1ZSB9KTtcbiAgICAgIGlmIChlbnRyaWVzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgY29uc3QgZmlsZXMgPSBlbnRyaWVzLmZpbHRlcihlbnRyeSA9PiAhZW50cnkuaXNEaXJlY3RvcnlcbiAgICAgICAgICAmJiAocGF0aC5leHRuYW1lKHBhdGguYmFzZW5hbWUoZW50cnkuZmlsZVBhdGgpKSAhPT0gJycpXG4gICAgICAgICAgJiYgKGVudHJ5Py5saW5rQ291bnQgPT09IHVuZGVmaW5lZCB8fCBlbnRyeS5saW5rQ291bnQgPD0gMSkpO1xuICAgICAgICBpZiAoZmlsZXMubGVuZ3RoID4gMCkge1xuICAgICAgICAgIGFjY3VtLnB1c2gobW9kKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgaWYgKCFbJ0VOT0VOVCcsICdFTk9URk9VTkQnXS5zb21lKGVyci5jb2RlKSkge1xuICAgICAgICBsb2coJ2Vycm9yJywgJ3VuYWJsZSB0byB3YWxrIHBhdGgnLCBlcnIpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShhY2N1bSk7XG4gICAgfVxuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoYWNjdW0pO1xuICB9LCBQcm9taXNlLnJlc29sdmUoW10pKTtcbiAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh2YWxpZENhbmRpZGF0ZXMpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaXNMb2NrZWRFbnRyeShtb2ROYW1lOiBzdHJpbmcpIHtcbiAgLy8gV2UncmUgYWRkaW5nIHRoaXMgdG8gYXZvaWQgaGF2aW5nIHRoZSBsb2FkIG9yZGVyIHBhZ2VcbiAgLy8gIGZyb20gbm90IGxvYWRpbmcgaWYgd2UgZW5jb3VudGVyIGFuIGludmFsaWQgbW9kIG5hbWUuXG4gIGlmICghbW9kTmFtZSB8fCB0eXBlb2YgKG1vZE5hbWUpICE9PSAnc3RyaW5nJykge1xuICAgIGxvZygnZGVidWcnLCAnZW5jb3VudGVyZWQgaW52YWxpZCBtb2QgaW5zdGFuY2UvbmFtZScpO1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICByZXR1cm4gbW9kTmFtZS5zdGFydHNXaXRoKExPQ0tFRF9QUkVGSVgpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZGV0ZXJtaW5lRXhlY3V0YWJsZShkaXNjb3ZlcmVkUGF0aDogc3RyaW5nKTogc3RyaW5nIHtcbiAgaWYgKGRpc2NvdmVyZWRQYXRoICE9PSB1bmRlZmluZWQpIHtcbiAgICB0cnkge1xuICAgICAgZnMuc3RhdFN5bmMocGF0aC5qb2luKGRpc2NvdmVyZWRQYXRoLCAnYmluJywgJ3g2NF9EWDEyJywgJ3dpdGNoZXIzLmV4ZScpKTtcbiAgICAgIHJldHVybiAnYmluL3g2NF9EWDEyL3dpdGNoZXIzLmV4ZSc7XG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAvLyBub3AsIHVzZSBmYWxsYmFja1xuICAgIH1cbiAgfVxuICByZXR1cm4gJ2Jpbi94NjQvd2l0Y2hlcjMuZXhlJztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGZvcmNlUmVmcmVzaChhcGk6IHR5cGVzLklFeHRlbnNpb25BcGkpIHtcbiAgY29uc3Qgc3RhdGUgPSBhcGkuZ2V0U3RhdGUoKTtcbiAgY29uc3QgcHJvZmlsZUlkID0gc2VsZWN0b3JzLmxhc3RBY3RpdmVQcm9maWxlRm9yR2FtZShzdGF0ZSwgR0FNRV9JRCk7XG4gIGNvbnN0IGFjdGlvbiA9IHtcbiAgICB0eXBlOiAnU0VUX0ZCX0ZPUkNFX1VQREFURScsXG4gICAgcGF5bG9hZDoge1xuICAgICAgcHJvZmlsZUlkLFxuICAgIH0sXG4gIH07XG4gIGFwaS5zdG9yZS5kaXNwYXRjaChhY3Rpb24pO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gd2Fsa1BhdGgoZGlyUGF0aDogc3RyaW5nLCB3YWxrT3B0aW9ucz86IElXYWxrT3B0aW9ucyk6IFByb21pc2U8SUVudHJ5W10+IHtcbiAgd2Fsa09wdGlvbnMgPSB3YWxrT3B0aW9ucyB8fCB7IHNraXBMaW5rczogdHJ1ZSwgc2tpcEhpZGRlbjogdHJ1ZSwgc2tpcEluYWNjZXNzaWJsZTogdHJ1ZSB9O1xuICAvLyBXZSBSRUFMTFkgZG9uJ3QgY2FyZSBmb3IgaGlkZGVuIG9yIGluYWNjZXNzaWJsZSBmaWxlcy5cbiAgd2Fsa09wdGlvbnMgPSB7IC4uLndhbGtPcHRpb25zLCBza2lwSGlkZGVuOiB0cnVlLCBza2lwSW5hY2Nlc3NpYmxlOiB0cnVlLCBza2lwTGlua3M6IHRydWUgfTtcbiAgY29uc3Qgd2Fsa1Jlc3VsdHM6IElFbnRyeVtdID0gW107XG4gIHJldHVybiBuZXcgUHJvbWlzZTxJRW50cnlbXT4oYXN5bmMgKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgIGF3YWl0IHR1cmJvd2FsayhkaXJQYXRoLCAoZW50cmllczogSUVudHJ5W10pID0+IHtcbiAgICAgIHdhbGtSZXN1bHRzLnB1c2goLi4uZW50cmllcyk7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCkgYXMgYW55O1xuICAgICAgLy8gSWYgdGhlIGRpcmVjdG9yeSBpcyBtaXNzaW5nIHdoZW4gd2UgdHJ5IHRvIHdhbGsgaXQ7IGl0J3MgbW9zdCBwcm9iYWJseSBkb3duIHRvIGEgY29sbGVjdGlvbiBiZWluZ1xuICAgICAgLy8gIGluIHRoZSBwcm9jZXNzIG9mIGJlaW5nIGluc3RhbGxlZC9yZW1vdmVkLiBXZSBjYW4gc2FmZWx5IGlnbm9yZSB0aGlzLlxuICAgIH0sIHdhbGtPcHRpb25zKS5jYXRjaChlcnIgPT4gZXJyLmNvZGUgPT09ICdFTk9FTlQnID8gUHJvbWlzZS5yZXNvbHZlKCkgOiBQcm9taXNlLnJlamVjdChlcnIpKTtcbiAgICByZXR1cm4gcmVzb2x2ZSh3YWxrUmVzdWx0cyk7XG4gIH0pO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gdmFsaWRhdGVQcm9maWxlKHByb2ZpbGVJZDogc3RyaW5nLCBzdGF0ZTogdHlwZXMuSVN0YXRlKSB7XG4gIGNvbnN0IGFjdGl2ZVByb2ZpbGUgPSBzZWxlY3RvcnMuYWN0aXZlUHJvZmlsZShzdGF0ZSk7XG4gIGNvbnN0IGRlcGxveVByb2ZpbGUgPSBzZWxlY3RvcnMucHJvZmlsZUJ5SWQoc3RhdGUsIHByb2ZpbGVJZCk7XG4gIGlmICghIWFjdGl2ZVByb2ZpbGUgJiYgISFkZXBsb3lQcm9maWxlICYmIChkZXBsb3lQcm9maWxlLmlkICE9PSBhY3RpdmVQcm9maWxlLmlkKSkge1xuICAgIHJldHVybiB1bmRlZmluZWQ7XG4gIH1cblxuICBpZiAoYWN0aXZlUHJvZmlsZT8uZ2FtZUlkICE9PSBHQU1FX0lEKSB7XG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgfVxuXG4gIHJldHVybiBhY3RpdmVQcm9maWxlO1xufTtcblxuZXhwb3J0IGZ1bmN0aW9uIGlzWE1MKGZpbGVQYXRoOiBzdHJpbmcpIHtcbiAgcmV0dXJuIFsnLnhtbCddLmluY2x1ZGVzKHBhdGguZXh0bmFtZShmaWxlUGF0aCkudG9Mb3dlckNhc2UoKSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc1NldHRpbmdzRmlsZShmaWxlUGF0aDogc3RyaW5nKSB7XG4gIHJldHVybiBbJy5zZXR0aW5ncycsIFBBUlRfU1VGRklYXS5zb21lKGV4dCA9PiBmaWxlUGF0aC50b0xvd2VyQ2FzZSgpLmVuZHNXaXRoKGV4dClcbiAgICAmJiBwYXRoLmJhc2VuYW1lKGZpbGVQYXRoKS50b0xvd2VyQ2FzZSgpICE9PSAnbW9kcy5zZXR0aW5ncycpO1xufVxuXG4vLyBleHBvcnQgZnVuY3Rpb24gaXNTZXR0aW5nc01lcmdlU3VwcHJlc3NlZChhcGk6IHR5cGVzLklFeHRlbnNpb25BcGkpIHtcbi8vICAgY29uc3Qgc3RhdGUgPSBhcGkuZ2V0U3RhdGUoKTtcbi8vICAgcmV0dXJuIHV0aWwuZ2V0U2FmZShzdGF0ZSwgWydzZXR0aW5ncycsICd3aXRjaGVyMycsICdzdXBwcmVzc1NldHRpbmdzTWVyZ2UnXSwgdHJ1ZSk7XG4vLyB9XG5cbmV4cG9ydCBmdW5jdGlvbiBzdXBwcmVzc0V2ZW50SGFuZGxlcnMoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpKSB7XG4gIC8vIFRoaXMgaXNuJ3QgY29vbCwgYnV0IG1laC5cbiAgY29uc3Qgc3RhdGUgPSBhcGkuZ2V0U3RhdGUoKTtcbiAgcmV0dXJuIChzdGF0ZS5zZXNzaW9uLm5vdGlmaWNhdGlvbnMubm90aWZpY2F0aW9ucy5zb21lKG4gPT4gbi5pZCA9PT0gQUNUSVZJVFlfSURfSU1QT1JUSU5HX0xPQURPUkRFUikpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gdG9CbHVlPFQ+KGZ1bmM6ICguLi5hcmdzOiBhbnlbXSkgPT4gUHJvbWlzZTxUPik6ICguLi5hcmdzOiBhbnlbXSkgPT4gQmx1ZWJpcmQ8VD4ge1xuICByZXR1cm4gKC4uLmFyZ3M6IGFueVtdKSA9PiBCbHVlYmlyZC5yZXNvbHZlKGZ1bmMoLi4uYXJncykpO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZmlsZUV4aXN0cyhmaWxlUGF0aDogc3RyaW5nKTogUHJvbWlzZTxib29sZWFuPiB7XG4gIHJldHVybiBmcy5zdGF0QXN5bmMoZmlsZVBhdGgpXG4gICAgLnRoZW4oKCkgPT4gdHJ1ZSlcbiAgICAuY2F0Y2goKCkgPT4gZmFsc2UpO1xufSJdfQ==