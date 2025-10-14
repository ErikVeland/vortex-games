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
    return (...args) => Promise.resolve(func(...args));
}
function fileExists(filePath) {
    return __awaiter(this, void 0, void 0, function* () {
        return vortex_api_1.fs.statAsync(filePath)
            .then(() => true)
            .catch(() => false);
    });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInV0aWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7O0FBZUEsc0NBb0NDO0FBaUNELDhEQWdDQztBQWFELHdDQXNCQztBQUVELGdEQWtCQztBQUVELGdDQTJCQztBQUVELG9EQXNEQztBQUVELHNDQVFDO0FBRUQsa0RBa0RDO0FBRUQsb0NBVUM7QUFFRCw0QkFjQztBQUVELDBDQVlDO0FBRUQsc0JBRUM7QUFFRCx3Q0FHQztBQU9ELHNEQUlDO0FBRUQsd0JBRUM7QUFFRCxnQ0FJQztBQXBZRCwyQ0FBNkQ7QUFFN0QsNERBQXVDO0FBRXZDLGdEQUF3QjtBQUV4QixtRUFBNEQ7QUFFNUQsMERBQTREO0FBRTVELHFDQUFnSDtBQUdoSCxTQUFzQixhQUFhLENBQUMsR0FBd0IsRUFDMUQsWUFBdUI7O1FBQ3ZCLE1BQU0sS0FBSyxHQUFHLEdBQUcsQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUM3QixNQUFNLFNBQVMsR0FBRyxpQkFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQ2xDLENBQUMsVUFBVSxFQUFFLFVBQVUsRUFBRSxZQUFZLEVBQUUsZ0JBQU8sQ0FBQyxFQUFFLFNBQVMsQ0FBQyxDQUFDO1FBQzlELE1BQU0sSUFBSSxHQUFHLGlCQUFJLENBQUMsT0FBTyxDQUFDLGdCQUFPLENBQUMsQ0FBQztRQUNuQyxJQUFJLENBQUMsSUFBSSxLQUFLLFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQSxTQUFTLGFBQVQsU0FBUyx1QkFBVCxTQUFTLENBQUUsSUFBSSxNQUFLLFNBQVMsQ0FBQyxFQUFFLENBQUM7WUFDNUQsSUFBQSxnQkFBRyxFQUFDLE9BQU8sRUFBRSx3QkFBd0IsRUFBRSxnQkFBTyxDQUFDLENBQUM7WUFDaEQsT0FBTyxTQUFTLENBQUM7UUFDbkIsQ0FBQztRQUVELE1BQU0sSUFBSSxHQUFvQyxpQkFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQzlELENBQUMsWUFBWSxF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QUFFLENBQUMsQ0FBQztBQUNqRSxDQUFDO0FBRUQsU0FBZ0IsY0FBYyxDQUFDLFFBQWdCO0lBQzdDLE9BQU8sQ0FBQyxXQUFXLEVBQUUsb0JBQVcsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLFFBQVEsQ0FBQyxXQUFXLEVBQUUsQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDO1dBQzdFLGNBQUksQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLENBQUMsV0FBVyxFQUFFLEtBQUssZUFBZSxDQUFDLENBQUM7QUFDbEUsQ0FBQztBQU9ELFNBQWdCLHFCQUFxQixDQUFDLEdBQXdCO0lBRTVELE1BQU0sS0FBSyxHQUFHLEdBQUcsQ0FBQyxRQUFRLEVBQUUsQ0FBQztJQUM3QixPQUFPLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxhQUFhLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLEtBQUssd0NBQStCLENBQUMsQ0FBQyxDQUFDO0FBQ3pHLENBQUM7QUFFRCxTQUFnQixNQUFNLENBQUksSUFBb0M7SUFDNUQsT0FBTyxDQUFDLEdBQUcsSUFBVyxFQUFFLEVBQUUsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUM7QUFDNUQsQ0FBQztBQUVELFNBQXNCLFVBQVUsQ0FBQyxRQUFnQjs7UUFDL0MsT0FBTyxlQUFFLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQzthQUMxQixJQUFJLENBQUMsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDO2FBQ2hCLEtBQUssQ0FBQyxHQUFHLEVBQUUsQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUN4QixDQUFDO0NBQUEiLCJzb3VyY2VzQ29udGVudCI6WyIvKiBlc2xpbnQtZGlzYWJsZSAqL1xuLy8gVE9ETzogUmVtb3ZlIEJsdWViaXJkIGltcG9ydCAtIHVzaW5nIG5hdGl2ZSBQcm9taXNlO1xuaW1wb3J0IHsgZnMsIGxvZywgdHlwZXMsIHNlbGVjdG9ycywgdXRpbCB9IGZyb20gJ3ZvcnRleC1hcGknO1xuXG5pbXBvcnQgSW5pU3RydWN0dXJlIGZyb20gJy4vaW5pUGFyc2VyJztcblxuaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XG5cbmltcG9ydCB7IGdldE1lcmdlZE1vZE5hbWVzIH0gZnJvbSAnLi9tZXJnZUludmVudG9yeVBhcnNpbmcnO1xuXG5pbXBvcnQgdHVyYm93YWxrLCB7IElFbnRyeSwgSVdhbGtPcHRpb25zIH0gZnJvbSAndHVyYm93YWxrJztcblxuaW1wb3J0IHsgR0FNRV9JRCwgTE9DS0VEX1BSRUZJWCwgSTE4Tl9OQU1FU1BBQ0UsIEFDVElWSVRZX0lEX0lNUE9SVElOR19MT0FET1JERVIsIFBBUlRfU1VGRklYIH0gZnJvbSAnLi9jb21tb24nO1xuaW1wb3J0IHsgSURlcGxveWVkRmlsZSwgSURlcGxveW1lbnQsIFByZWZpeFR5cGUgfSBmcm9tICcuL3R5cGVzJztcblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGdldERlcGxveW1lbnQoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpLFxuICBpbmNsdWRlZE1vZHM/OiBzdHJpbmdbXSk6IFByb21pc2U8SURlcGxveW1lbnQ+IHtcbiAgY29uc3Qgc3RhdGUgPSBhcGkuZ2V0U3RhdGUoKTtcbiAgY29uc3QgZGlzY292ZXJ5ID0gdXRpbC5nZXRTYWZlKHN0YXRlLFxuICAgIFsnc2V0dGluZ3MnLCAnZ2FtZU1vZGUnLCAnZGlzY292ZXJlZCcsIEdBTUVfSURdLCB1bmRlZmluZWQpO1xuICBjb25zdCBnYW1lID0gdXRpbC5nZXRHYW1lKEdBTUVfSUQpO1xuICBpZiAoKGdhbWUgPT09IHVuZGVmaW5lZCkgfHwgKGRpc2NvdmVyeT8ucGF0aCA9PT0gdW5kZWZpbmVkKSkge1xuICAgIGxvZygnZXJyb3InLCAnZ2FtZSBpcyBub3QgZGlzY292ZXJlZCcsIEdBTUVfSUQpO1xuICAgIHJldHVybiB1bmRlZmluZWQ7XG4gIH1cblxuICBjb25zdCBtb2RzOiB7IFttb2RJZDogc3RyaW5nXTogdHlwZXMuSU1vZCB9ID0gdXRpbC5nZXRTYWZlKHN0YXRlLFxuICAgIFsncGVyc2lzdGVudCcsICdtb2RzJywgR0FNRV9JRF0sIHt9KTtcblxuICBjb25zdCBpbnN0YWxsYXRpb25EaXJlY3RvcmllcyA9IE9iamVjdC52YWx1ZXMobW9kcylcbiAgICAuZmlsdGVyKG1vZCA9PiAoaW5jbHVkZWRNb2RzICE9PSB1bmRlZmluZWQpXG4gICAgICA/IGluY2x1ZGVkTW9kcy5pbmNsdWRlcyhtb2QuaWQpXG4gICAgICA6IHRydWUpXG4gICAgLm1hcChtb2QgPT4gbW9kLmluc3RhbGxhdGlvblBhdGgpO1xuXG4gIGNvbnN0IGZpbHRlckZ1bmMgPSAoZmlsZTogSURlcGxveWVkRmlsZSkgPT4gaW5zdGFsbGF0aW9uRGlyZWN0b3JpZXMuaW5jbHVkZXMoZmlsZS5zb3VyY2UpO1xuXG4gIGNvbnN0IG1vZFBhdGhzOiB7IFt0eXBlSWQ6IHN0cmluZ106IHN0cmluZyB9ID0gZ2FtZS5nZXRNb2RQYXRocyhkaXNjb3ZlcnkucGF0aCk7XG4gIGNvbnN0IG1vZFR5cGVzID0gT2JqZWN0LmtleXMobW9kUGF0aHMpLmZpbHRlcihrZXkgPT4gISFtb2RQYXRoc1trZXldKTtcbiAgY29uc3QgZGVwbG95bWVudDogSURlcGxveW1lbnQgPSBhd2FpdCBtb2RUeXBlcy5yZWR1Y2UoYXN5bmMgKGFjY3VtUCwgbW9kVHlwZSkgPT4ge1xuICAgIGNvbnN0IGFjY3VtID0gYXdhaXQgYWNjdW1QO1xuICAgIHRyeSB7XG4gICAgICBjb25zdCBtYW5pZmVzdDogdHlwZXMuSURlcGxveW1lbnRNYW5pZmVzdCA9IGF3YWl0IHV0aWwuZ2V0TWFuaWZlc3QoYXBpLCBtb2RUeXBlLCBHQU1FX0lEKTtcbiAgICAgIGFjY3VtW21vZFR5cGVdID0gbWFuaWZlc3QuZmlsZXMuZmlsdGVyKGZpbHRlckZ1bmMpO1xuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgbG9nKCdlcnJvcicsICdmYWlsZWQgdG8gZ2V0IG1hbmlmZXN0JywgZXJyKTtcbiAgICB9XG4gICAgcmV0dXJuIGFjY3VtO1xuICB9LCB7fSk7XG5cbiAgcmV0dXJuIGRlcGxveW1lbnQ7XG59XG5cbmV4cG9ydCBjb25zdCBnZXREb2N1bWVudHNQYXRoID0gKGdhbWU6IHR5cGVzLklHYW1lKSA9PiB7XG4gIHJldHVybiBwYXRoLmpvaW4odXRpbC5nZXRWb3J0ZXhQYXRoKCdkb2N1bWVudHMnKSwgJ1RoZSBXaXRjaGVyIDMnKVxufVxuXG5leHBvcnQgY29uc3QgZ2V0RExDUGF0aCA9IChhcGk6IHR5cGVzLklFeHRlbnNpb25BcGkpID0+IHtcbiAgcmV0dXJuIChnYW1lOiB0eXBlcy5JR2FtZSkgPT4ge1xuICAgIGNvbnN0IHN0YXRlID0gYXBpLnN0b3JlLmdldFN0YXRlKCk7XG4gICAgY29uc3QgZGlzY292ZXJ5ID0gc3RhdGUuc2V0dGluZ3MuZ2FtZU1vZGUuZGlzY292ZXJlZFtnYW1lLmlkXTtcbiAgICByZXR1cm4gcGF0aC5qb2luKGRpc2NvdmVyeS5wYXRoLCAnRExDJyk7XG4gIH1cbn07XG5cbmV4cG9ydCBjb25zdCBnZXRUTFBhdGggPSAoKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSkgPT4ge1xuICByZXR1cm4gKGdhbWU6IHR5cGVzLklHYW1lKSA9PiB7XG4gICAgY29uc3Qgc3RhdGUgPSBhcGkuc3RvcmUuZ2V0U3RhdGUoKTtcbiAgICBjb25zdCBkaXNjb3ZlcnkgPSBzdGF0ZS5zZXR0aW5ncy5nYW1lTW9kZS5kaXNjb3ZlcmVkW2dhbWUuaWRdO1xuICAgIHJldHVybiBkaXNjb3ZlcnkucGF0aDtcbiAgfVxufSk7XG5cbmV4cG9ydCBjb25zdCBpc1RXMyA9IChhcGk6IHR5cGVzLklFeHRlbnNpb25BcGkpID0+IHtcbiAgcmV0dXJuIChnYW1lSWQ6IHN0cmluZykgPT4ge1xuICAgIGlmIChnYW1lSWQgIT09IHVuZGVmaW5lZCkge1xuICAgICAgcmV0dXJuIChnYW1lSWQgPT09IEdBTUVfSUQpO1xuICAgIH1cbiAgICBjb25zdCBzdGF0ZSA9IGFwaS5nZXRTdGF0ZSgpO1xuICAgIGNvbnN0IGdhbWVNb2RlID0gc2VsZWN0b3JzLmFjdGl2ZUdhbWVJZChzdGF0ZSk7XG4gICAgcmV0dXJuIChnYW1lTW9kZSA9PT0gR0FNRV9JRCk7XG4gIH1cbn07XG5cbmV4cG9ydCBmdW5jdGlvbiBub3RpZnlNaXNzaW5nU2NyaXB0TWVyZ2VyKGFwaSkge1xuICBjb25zdCBub3RpZklkID0gJ21pc3Npbmctc2NyaXB0LW1lcmdlcic7XG4gIGFwaS5zZW5kTm90aWZpY2F0aW9uKHtcbiAgICBpZDogbm90aWZJZCxcbiAgICB0eXBlOiAnaW5mbycsXG4gICAgbWVzc2FnZTogYXBpLnRyYW5zbGF0ZSgnV2l0Y2hlciAzIHNjcmlwdCBtZXJnZXIgaXMgbWlzc2luZy9taXNjb25maWd1cmVkJyxcbiAgICAgIHsgbnM6IEkxOE5fTkFNRVNQQUNFIH0pLFxuICAgIGFsbG93U3VwcHJlc3M6IHRydWUsXG4gICAgYWN0aW9uczogW1xuICAgICAge1xuICAgICAgICB0aXRsZTogJ01vcmUnLFxuICAgICAgICBhY3Rpb246ICgpID0+IHtcbiAgICAgICAgICBhcGkuc2hvd0RpYWxvZygnaW5mbycsICdXaXRjaGVyIDMgU2NyaXB0IE1lcmdlcicsIHtcbiAgICAgICAgICAgIGJiY29kZTogYXBpLnRyYW5zbGF0ZSgnVm9ydGV4IGlzIHVuYWJsZSB0byByZXNvbHZlIHRoZSBTY3JpcHQgTWVyZ2VyXFwncyBsb2NhdGlvbi4gVGhlIHRvb2wgbmVlZHMgdG8gYmUgZG93bmxvYWRlZCBhbmQgY29uZmlndXJlZCBtYW51YWxseS4gJ1xuICAgICAgICAgICAgICArICdbdXJsPWh0dHBzOi8vd2lraS5uZXh1c21vZHMuY29tL2luZGV4LnBocC9Ub29sX1NldHVwOl9XaXRjaGVyXzNfU2NyaXB0X01lcmdlcl1GaW5kIG91dCBtb3JlIGFib3V0IGhvdyB0byBjb25maWd1cmUgaXQgYXMgYSB0b29sIGZvciB1c2UgaW4gVm9ydGV4LlsvdXJsXVticl1bL2JyXVticl1bL2JyXSdcbiAgICAgICAgICAgICAgKyAnTm90ZTogV2hpbGUgc2NyaXB0IG1lcmdpbmcgd29ya3Mgd2VsbCB3aXRoIHRoZSB2YXN0IG1ham9yaXR5IG9mIG1vZHMsIHRoZXJlIGlzIG5vIGd1YXJhbnRlZSBmb3IgYSBzYXRpc2Z5aW5nIG91dGNvbWUgaW4gZXZlcnkgc2luZ2xlIGNhc2UuJywgeyBuczogSTE4Tl9OQU1FU1BBQ0UgfSksXG4gICAgICAgICAgfSwgW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBsYWJlbDogJ0NhbmNlbCcsIGFjdGlvbjogKCkgPT4ge1xuICAgICAgICAgICAgICAgIGFwaS5kaXNtaXNzTm90aWZpY2F0aW9uKCdtaXNzaW5nLXNjcmlwdC1tZXJnZXInKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgbGFiZWw6ICdEb3dubG9hZCBTY3JpcHQgTWVyZ2VyJywgYWN0aW9uOiAoKSA9PiB1dGlsLm9wbignaHR0cHM6Ly93d3cubmV4dXNtb2RzLmNvbS93aXRjaGVyMy9tb2RzLzQ4NCcpXG4gICAgICAgICAgICAgICAgLmNhdGNoKGVyciA9PiBudWxsKVxuICAgICAgICAgICAgICAgIC50aGVuKCgpID0+IGFwaS5kaXNtaXNzTm90aWZpY2F0aW9uKCdtaXNzaW5nLXNjcmlwdC1tZXJnZXInKSlcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgXSk7XG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgIF0sXG4gIH0pO1xufVxuXG5leHBvcnQgY29uc3QgaGFzUHJlZml4ID0gKHByZWZpeDogUHJlZml4VHlwZSwgZmlsZUVudHJ5OiBzdHJpbmcpID0+IHtcbiAgY29uc3Qgc2VnbWVudHMgPSBmaWxlRW50cnkudG9Mb3dlckNhc2UoKS5zcGxpdChwYXRoLnNlcCk7XG4gIGNvbnN0IGNvbnRlbnRJZHggPSBzZWdtZW50cy5pbmRleE9mKCdjb250ZW50Jyk7XG4gIGlmIChbLTEsIDBdLmluY2x1ZGVzKGNvbnRlbnRJZHgpKSB7XG4gICAgLy8gTm8gY29udGVudCBmb2xkZXIsIG5vIG1vZC5cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICByZXR1cm4gc2VnbWVudHNbY29udGVudElkeCAtIDFdLmluZGV4T2YocHJlZml4KSAhPT0gLTE7XG59O1xuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZmluZE1vZEZvbGRlcnMoaW5zdGFsbGF0aW9uUGF0aDogc3RyaW5nLCBtb2Q6IHR5cGVzLklNb2QpOiBQcm9taXNlPHN0cmluZ1tdPiB7XG4gIGlmICghaW5zdGFsbGF0aW9uUGF0aCB8fCAhbW9kPy5pbnN0YWxsYXRpb25QYXRoKSB7XG4gICAgY29uc3QgZXJyTWVzc2FnZSA9ICFpbnN0YWxsYXRpb25QYXRoXG4gICAgICA/ICdHYW1lIGlzIG5vdCBkaXNjb3ZlcmVkJ1xuICAgICAgOiAnRmFpbGVkIHRvIHJlc29sdmUgbW9kIGluc3RhbGxhdGlvbiBwYXRoJztcbiAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IEVycm9yKGVyck1lc3NhZ2UpKTtcbiAgfVxuXG4gIGNvbnN0IHZhbGlkTmFtZXMgPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgYXdhaXQgdHVyYm93YWxrKHBhdGguam9pbihpbnN0YWxsYXRpb25QYXRoLCBtb2QuaW5zdGFsbGF0aW9uUGF0aCksIChlbnRyaWVzOiBJRW50cnlbXSkgPT4ge1xuICAgIGVudHJpZXMuZm9yRWFjaChlbnRyeSA9PiB7XG4gICAgICBjb25zdCBzZWdtZW50cyA9IGVudHJ5LmZpbGVQYXRoLnNwbGl0KHBhdGguc2VwKTtcbiAgICAgIGNvbnN0IGNvbnRlbnRJZHggPSBzZWdtZW50cy5maW5kSW5kZXgoc2VnID0+IHNlZy50b0xvd2VyQ2FzZSgpID09PSAnY29udGVudCcpO1xuICAgICAgaWYgKCFbLTEsIDBdLmluY2x1ZGVzKGNvbnRlbnRJZHgpKSB7XG4gICAgICAgIHZhbGlkTmFtZXMuYWRkKHNlZ21lbnRzW2NvbnRlbnRJZHggLSAxXSk7XG4gICAgICB9XG4gICAgfSk7XG4gIH0sIHsgcmVjdXJzZTogdHJ1ZSwgc2tpcEhpZGRlbjogdHJ1ZSwgc2tpcExpbmtzOiB0cnVlIH0pO1xuICBjb25zdCB2YWxpZEVudHJpZXMgPSBBcnJheS5mcm9tKHZhbGlkTmFtZXMpO1xuICByZXR1cm4gKHZhbGlkRW50cmllcy5sZW5ndGggPiAwKVxuICAgID8gUHJvbWlzZS5yZXNvbHZlKHZhbGlkRW50cmllcylcbiAgICA6IFByb21pc2UucmVqZWN0KG5ldyBFcnJvcignRmFpbGVkIHRvIGZpbmQgbW9kIGZvbGRlcicpKTtcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGdldE1hbmFnZWRNb2ROYW1lcyhhcGk6IHR5cGVzLklFeHRlbnNpb25BcGksIG1vZHM6IHR5cGVzLklNb2RbXSk6IFByb21pc2U8eyBuYW1lOiBzdHJpbmcsIGlkOiBzdHJpbmcgfVtdPiB7XG4gIGNvbnN0IGluc3RhbGxhdGlvblBhdGggPSBzZWxlY3RvcnMuaW5zdGFsbFBhdGhGb3JHYW1lKGFwaS5nZXRTdGF0ZSgpLCBHQU1FX0lEKTtcbiAgcmV0dXJuIG1vZHMucmVkdWNlKGFzeW5jIChhY2N1bVAsIG1vZCkgPT4ge1xuICAgIGNvbnN0IGFjY3VtID0gYXdhaXQgYWNjdW1QO1xuICAgIGxldCBmb2xkZXJOYW1lcyA9IFtdO1xuICAgIHRyeSB7XG4gICAgICBpZiAoIWZvbGRlck5hbWVzIHx8IFsnY29sbGVjdGlvbicsICd3M21vZGxpbWl0cGF0Y2hlciddLmluY2x1ZGVzKG1vZC50eXBlKSkge1xuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKGFjY3VtKTtcbiAgICAgIH1cbiAgICAgIGZvbGRlck5hbWVzID0gYXdhaXQgZmluZE1vZEZvbGRlcnMoaW5zdGFsbGF0aW9uUGF0aCwgbW9kKTtcbiAgICAgIGZvciAoY29uc3QgY29tcG9uZW50IG9mIGZvbGRlck5hbWVzKSB7XG4gICAgICAgIGFjY3VtLnB1c2goeyBpZDogbW9kLmlkLCBuYW1lOiBjb21wb25lbnQgfSk7XG4gICAgICB9XG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICBsb2coJ3dhcm4nLCAndW5hYmxlIHRvIHJlc29sdmUgbW9kIG5hbWUnLCBtb2QuaWQpO1xuICAgIH1cbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKGFjY3VtKTtcbiAgfSwgUHJvbWlzZS5yZXNvbHZlKFtdKSk7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZXRBbGxNb2RzKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSkge1xuICAvLyBNb2QgdHlwZXMgd2UgZG9uJ3Qgd2FudCB0byBkaXNwbGF5IGluIHRoZSBMTyBwYWdlXG4gIGNvbnN0IGludmFsaWRNb2RUeXBlcyA9IFsnd2l0Y2hlcjNtZW51bW9kZG9jdW1lbnRzJywgJ2NvbGxlY3Rpb24nXTtcbiAgY29uc3Qgc3RhdGUgPSBhcGkuZ2V0U3RhdGUoKTtcbiAgY29uc3QgcHJvZmlsZSA9IHNlbGVjdG9ycy5hY3RpdmVQcm9maWxlKHN0YXRlKTtcbiAgaWYgKHByb2ZpbGU/LmlkID09PSB1bmRlZmluZWQpIHtcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHtcbiAgICAgIG1lcmdlZDogW10sXG4gICAgICBtYW51YWw6IFtdLFxuICAgICAgbWFuYWdlZDogW10sXG4gICAgfSk7XG4gIH1cbiAgY29uc3QgbW9kU3RhdGUgPSB1dGlsLmdldFNhZmUoc3RhdGUsIFsncGVyc2lzdGVudCcsICdwcm9maWxlcycsIHByb2ZpbGUuaWQsICdtb2RTdGF0ZSddLCB7fSk7XG4gIGNvbnN0IG1vZHMgPSB1dGlsLmdldFNhZmUoc3RhdGUsIFsncGVyc2lzdGVudCcsICdtb2RzJywgR0FNRV9JRF0sIHt9KTtcblxuICAvLyBPbmx5IHNlbGVjdCBtb2RzIHdoaWNoIGFyZSBlbmFibGVkLCBhbmQgYXJlIG5vdCBhIG1lbnUgbW9kLlxuICBjb25zdCBlbmFibGVkTW9kcyA9IE9iamVjdC5rZXlzKG1vZFN0YXRlKS5maWx0ZXIoa2V5ID0+XG4gICAgKCEhbW9kc1trZXldICYmIG1vZFN0YXRlW2tleV0uZW5hYmxlZCAmJiAhaW52YWxpZE1vZFR5cGVzLmluY2x1ZGVzKG1vZHNba2V5XS50eXBlKSkpO1xuXG4gIGNvbnN0IG1lcmdlZE1vZE5hbWVzID0gYXdhaXQgZ2V0TWVyZ2VkTW9kTmFtZXMoYXBpKTtcbiAgY29uc3QgbWFudWFsbHlBZGRlZE1vZHMgPSBhd2FpdCBnZXRNYW51YWxseUFkZGVkTW9kcyhhcGkpO1xuICBjb25zdCBtYW5hZ2VkTW9kcyA9IGF3YWl0IGdldE1hbmFnZWRNb2ROYW1lcyhhcGksIGVuYWJsZWRNb2RzLm1hcChrZXkgPT4gbW9kc1trZXldKSk7XG4gIHJldHVybiBQcm9taXNlLnJlc29sdmUoe1xuICAgIG1lcmdlZDogbWVyZ2VkTW9kTmFtZXMsXG4gICAgbWFudWFsOiBtYW51YWxseUFkZGVkTW9kcy5maWx0ZXIobW9kID0+ICFtZXJnZWRNb2ROYW1lcy5pbmNsdWRlcyhtb2QpKSxcbiAgICBtYW5hZ2VkOiBtYW5hZ2VkTW9kcyxcbiAgfSk7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZXRNYW51YWxseUFkZGVkTW9kcyhhcGk6IHR5cGVzLklFeHRlbnNpb25BcGkpIHtcbiAgY29uc3Qgc3RhdGUgPSBhcGkuZ2V0U3RhdGUoKTtcbiAgY29uc3QgZGlzY292ZXJ5ID0gdXRpbC5nZXRTYWZlKHN0YXRlLCBbJ3NldHRpbmdzJywgJ2dhbWVNb2RlJywgJ2Rpc2NvdmVyZWQnLCBHQU1FX0lEXSwgdW5kZWZpbmVkKTtcbiAgaWYgKGRpc2NvdmVyeT8ucGF0aCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgLy8gSG93L3doeSBhcmUgd2UgZXZlbiBoZXJlID9cbiAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IHV0aWwuUHJvY2Vzc0NhbmNlbGVkKCdHYW1lIGlzIG5vdCBkaXNjb3ZlcmVkIScpKTtcbiAgfVxuICBsZXQgaW5pO1xuICB0cnkge1xuICAgIGluaSA9IGF3YWl0IEluaVN0cnVjdHVyZS5nZXRJbnN0YW5jZSgpLmVuc3VyZU1vZFNldHRpbmdzKCk7XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIGFwaS5zaG93RXJyb3JOb3RpZmljYXRpb24oJ0ZhaWxlZCB0byBsb2FkIElOSSBzdHJ1Y3R1cmUnLCBlcnIsIHsgYWxsb3dSZXBvcnQ6IGZhbHNlIH0pO1xuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoW10pO1xuICB9XG5cbiAgY29uc3QgbW9kcyA9IHV0aWwuZ2V0U2FmZShzdGF0ZSwgWydwZXJzaXN0ZW50JywgJ21vZHMnLCBHQU1FX0lEXSwge30pO1xuICBjb25zdCBtb2RLZXlzID0gT2JqZWN0LmtleXMobW9kcyk7XG4gIGNvbnN0IGluaUVudHJpZXMgPSBPYmplY3Qua2V5cyhpbmkuZGF0YSk7XG4gIGNvbnN0IG1hbnVhbENhbmRpZGF0ZXMgPSBbXS5jb25jYXQoaW5pRW50cmllcykuZmlsdGVyKGVudHJ5ID0+IHtcbiAgICBjb25zdCBoYXNWb3J0ZXhLZXkgPSB1dGlsLmdldFNhZmUoaW5pLmRhdGFbZW50cnldLCBbJ1ZLJ10sIHVuZGVmaW5lZCkgIT09IHVuZGVmaW5lZDtcbiAgICByZXR1cm4gKCghaGFzVm9ydGV4S2V5KSB8fCAoaW5pLmRhdGFbZW50cnldLlZLID09PSBlbnRyeSkgJiYgIW1vZEtleXMuaW5jbHVkZXMoZW50cnkpKTtcbiAgfSk7XG4gIGNvbnN0IHVuaXF1ZUNhbmRpZGF0ZXMgPSBuZXcgU2V0KG5ldyBTZXQobWFudWFsQ2FuZGlkYXRlcykpO1xuICBjb25zdCBtb2RzUGF0aCA9IHBhdGguam9pbihkaXNjb3ZlcnkucGF0aCwgJ01vZHMnKTtcbiAgY29uc3QgY2FuZGlkYXRlcyA9IEFycmF5LmZyb20odW5pcXVlQ2FuZGlkYXRlcyk7XG4gIGNvbnN0IHZhbGlkQ2FuZGlkYXRlcyA9IGF3YWl0IGNhbmRpZGF0ZXMucmVkdWNlKGFzeW5jIChhY2N1bVAsIG1vZCkgPT4ge1xuICAgIGNvbnN0IGFjY3VtID0gYXdhaXQgYWNjdW1QO1xuICAgIGNvbnN0IG1vZEZvbGRlciA9IHBhdGguam9pbihtb2RzUGF0aCwgbW9kKTtcbiAgICBjb25zdCBleGlzdHMgPSBmcy5zdGF0QXN5bmMocGF0aC5qb2luKG1vZEZvbGRlcikpLnRoZW4oKCkgPT4gdHJ1ZSkuY2F0Y2goKCkgPT4gZmFsc2UpO1xuICAgIGlmICghZXhpc3RzKSB7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKGFjY3VtKTtcbiAgICB9XG5cbiAgICAvLyBPaywgd2Uga25vdyB0aGUgZm9sZGVyIGlzIHRoZXJlIC0gbGV0cyBlbnN1cmUgdGhhdFxuICAgIC8vICBpdCBhY3R1YWxseSBjb250YWlucyBmaWxlcy5cbiAgICB0cnkge1xuICAgICAgY29uc3QgZW50cmllcyA9IGF3YWl0IHdhbGtQYXRoKG1vZEZvbGRlciwgeyBza2lwSGlkZGVuOiB0cnVlLCBza2lwTGlua3M6IHRydWUgfSk7XG4gICAgICBpZiAoZW50cmllcy5sZW5ndGggPiAwKSB7XG4gICAgICAgIGNvbnN0IGZpbGVzID0gZW50cmllcy5maWx0ZXIoZW50cnkgPT4gIWVudHJ5LmlzRGlyZWN0b3J5XG4gICAgICAgICAgJiYgKHBhdGguZXh0bmFtZShwYXRoLmJhc2VuYW1lKGVudHJ5LmZpbGVQYXRoKSkgIT09ICcnKVxuICAgICAgICAgICYmIChlbnRyeT8ubGlua0NvdW50ID09PSB1bmRlZmluZWQgfHwgZW50cnkubGlua0NvdW50IDw9IDEpKTtcbiAgICAgICAgaWYgKGZpbGVzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICBhY2N1bS5wdXNoKG1vZCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgIGlmICghWydFTk9FTlQnLCAnRU5PVEZPVU5EJ10uc29tZShlcnIuY29kZSkpIHtcbiAgICAgICAgbG9nKCdlcnJvcicsICd1bmFibGUgdG8gd2FsayBwYXRoJywgZXJyKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoYWNjdW0pO1xuICAgIH1cbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKGFjY3VtKTtcbiAgfSwgUHJvbWlzZS5yZXNvbHZlKFtdKSk7XG4gIHJldHVybiBQcm9taXNlLnJlc29sdmUodmFsaWRDYW5kaWRhdGVzKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzTG9ja2VkRW50cnkobW9kTmFtZTogc3RyaW5nKSB7XG4gIC8vIFdlJ3JlIGFkZGluZyB0aGlzIHRvIGF2b2lkIGhhdmluZyB0aGUgbG9hZCBvcmRlciBwYWdlXG4gIC8vICBmcm9tIG5vdCBsb2FkaW5nIGlmIHdlIGVuY291bnRlciBhbiBpbnZhbGlkIG1vZCBuYW1lLlxuICBpZiAoIW1vZE5hbWUgfHwgdHlwZW9mIChtb2ROYW1lKSAhPT0gJ3N0cmluZycpIHtcbiAgICBsb2coJ2RlYnVnJywgJ2VuY291bnRlcmVkIGludmFsaWQgbW9kIGluc3RhbmNlL25hbWUnKTtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgcmV0dXJuIG1vZE5hbWUuc3RhcnRzV2l0aChMT0NLRURfUFJFRklYKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGRldGVybWluZUV4ZWN1dGFibGUoZGlzY292ZXJlZFBhdGg6IHN0cmluZyk6IHN0cmluZyB7XG4gIC8vIEVuaGFuY2VkIHBsYXRmb3JtLWF3YXJlIGxvZ2ljIHdoaWxlIG1haW50YWluaW5nIHN5bmNocm9ub3VzIEFQSVxuICBpZiAoZGlzY292ZXJlZFBhdGggIT09IHVuZGVmaW5lZCkge1xuICAgIC8vIE9uIG1hY09TLCBjaGVjayBmb3IgbmF0aXZlIGFwcCBidW5kbGUgZmlyc3RcbiAgICBpZiAocHJvY2Vzcy5wbGF0Zm9ybSA9PT0gJ2RhcndpbicpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IG1hY0V4ZWN1dGFibGUgPSBwYXRoLmpvaW4oZGlzY292ZXJlZFBhdGgsICdDb250ZW50cycsICdNYWNPUycsICd3aXRjaGVyMycpO1xuICAgICAgICBmcy5zdGF0U3luYyhtYWNFeGVjdXRhYmxlKTtcbiAgICAgICAgcmV0dXJuICdDb250ZW50cy9NYWNPUy93aXRjaGVyMyc7XG4gICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgLy8gQ29udGludWUgdG8gV2luZG93cyBleGVjdXRhYmxlIGNoZWNrc1xuICAgICAgfVxuICAgIH1cbiAgICBcbiAgICAvLyBDaGVjayBmb3IgRFgxMiB2ZXJzaW9uIChwcmVmZXJyZWQgb24gV2luZG93cylcbiAgICB0cnkge1xuICAgICAgZnMuc3RhdFN5bmMocGF0aC5qb2luKGRpc2NvdmVyZWRQYXRoLCAnYmluJywgJ3g2NF9EWDEyJywgJ3dpdGNoZXIzLmV4ZScpKTtcbiAgICAgIHJldHVybiAnYmluL3g2NF9EWDEyL3dpdGNoZXIzLmV4ZSc7XG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAvLyBub3AsIHVzZSBmYWxsYmFja1xuICAgIH1cbiAgICBcbiAgICAvLyBDaGVjayBmb3Igc3RhbmRhcmQgdmVyc2lvblxuICAgIHRyeSB7XG4gICAgICBmcy5zdGF0U3luYyhwYXRoLmpvaW4oZGlzY292ZXJlZFBhdGgsICdiaW4nLCAneDY0JywgJ3dpdGNoZXIzLmV4ZScpKTtcbiAgICAgIHJldHVybiAnYmluL3g2NC93aXRjaGVyMy5leGUnO1xuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgLy8gbm9wLCB1c2UgZmFsbGJhY2tcbiAgICB9XG4gICAgXG4gICAgLy8gT24gTGludXgsIGNoZWNrIGZvciBuYXRpdmUgZXhlY3V0YWJsZVxuICAgIGlmIChwcm9jZXNzLnBsYXRmb3JtID09PSAnbGludXgnKSB7XG4gICAgICB0cnkge1xuICAgICAgICBjb25zdCBsaW51eEV4ZWN1dGFibGUgPSBwYXRoLmpvaW4oZGlzY292ZXJlZFBhdGgsICdiaW4nLCAnd2l0Y2hlcjMnKTtcbiAgICAgICAgZnMuc3RhdFN5bmMobGludXhFeGVjdXRhYmxlKTtcbiAgICAgICAgcmV0dXJuICdiaW4vd2l0Y2hlcjMnO1xuICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgIC8vIENvbnRpbnVlIHRvIGZhbGxiYWNrXG4gICAgICB9XG4gICAgfVxuICB9XG4gIFxuICAvLyBGaW5hbCBmYWxsYmFjayBiYXNlZCBvbiBwbGF0Zm9ybVxuICBpZiAocHJvY2Vzcy5wbGF0Zm9ybSA9PT0gJ2RhcndpbicpIHtcbiAgICByZXR1cm4gJ0NvbnRlbnRzL01hY09TL3dpdGNoZXIzJzsgIC8vIEFzc3VtZSBhcHAgYnVuZGxlIHN0cnVjdHVyZVxuICB9IGVsc2UgaWYgKHByb2Nlc3MucGxhdGZvcm0gPT09ICdsaW51eCcpIHtcbiAgICByZXR1cm4gJ2Jpbi93aXRjaGVyMyc7XG4gIH1cbiAgXG4gIHJldHVybiAnYmluL3g2NC93aXRjaGVyMy5leGUnOyAgLy8gV2luZG93cyBmYWxsYmFja1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZm9yY2VSZWZyZXNoKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSkge1xuICBjb25zdCBzdGF0ZSA9IGFwaS5nZXRTdGF0ZSgpO1xuICBjb25zdCBwcm9maWxlSWQgPSBzZWxlY3RvcnMubGFzdEFjdGl2ZVByb2ZpbGVGb3JHYW1lKHN0YXRlLCBHQU1FX0lEKTtcbiAgY29uc3QgYWN0aW9uID0ge1xuICAgIHR5cGU6ICdTRVRfRkJfRk9SQ0VfVVBEQVRFJyxcbiAgICBwYXlsb2FkOiB7XG4gICAgICBwcm9maWxlSWQsXG4gICAgfSxcbiAgfTtcbiAgYXBpLnN0b3JlLmRpc3BhdGNoKGFjdGlvbik7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiB3YWxrUGF0aChkaXJQYXRoOiBzdHJpbmcsIHdhbGtPcHRpb25zPzogSVdhbGtPcHRpb25zKTogUHJvbWlzZTxJRW50cnlbXT4ge1xuICB3YWxrT3B0aW9ucyA9IHdhbGtPcHRpb25zIHx8IHsgc2tpcExpbmtzOiB0cnVlLCBza2lwSGlkZGVuOiB0cnVlLCBza2lwSW5hY2Nlc3NpYmxlOiB0cnVlIH07XG4gIC8vIFdlIFJFQUxMWSBkb24ndCBjYXJlIGZvciBoaWRkZW4gb3IgaW5hY2Nlc3NpYmxlIGZpbGVzLlxuICB3YWxrT3B0aW9ucyA9IHsgLi4ud2Fsa09wdGlvbnMsIHNraXBIaWRkZW46IHRydWUsIHNraXBJbmFjY2Vzc2libGU6IHRydWUsIHNraXBMaW5rczogdHJ1ZSB9O1xuICBjb25zdCB3YWxrUmVzdWx0czogSUVudHJ5W10gPSBbXTtcbiAgcmV0dXJuIG5ldyBQcm9taXNlPElFbnRyeVtdPihhc3luYyAocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgYXdhaXQgdHVyYm93YWxrKGRpclBhdGgsIChlbnRyaWVzOiBJRW50cnlbXSkgPT4ge1xuICAgICAgd2Fsa1Jlc3VsdHMucHVzaCguLi5lbnRyaWVzKTtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKSBhcyBhbnk7XG4gICAgICAvLyBJZiB0aGUgZGlyZWN0b3J5IGlzIG1pc3Npbmcgd2hlbiB3ZSB0cnkgdG8gd2FsayBpdDsgaXQncyBtb3N0IHByb2JhYmx5IGRvd24gdG8gYSBjb2xsZWN0aW9uIGJlaW5nXG4gICAgICAvLyAgaW4gdGhlIHByb2Nlc3Mgb2YgYmVpbmcgaW5zdGFsbGVkL3JlbW92ZWQuIFdlIGNhbiBzYWZlbHkgaWdub3JlIHRoaXMuXG4gICAgfSwgd2Fsa09wdGlvbnMpLmNhdGNoKGVyciA9PiBlcnIuY29kZSA9PT0gJ0VOT0VOVCcgPyBQcm9taXNlLnJlc29sdmUoKSA6IFByb21pc2UucmVqZWN0KGVycikpO1xuICAgIHJldHVybiByZXNvbHZlKHdhbGtSZXN1bHRzKTtcbiAgfSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB2YWxpZGF0ZVByb2ZpbGUocHJvZmlsZUlkOiBzdHJpbmcsIHN0YXRlOiB0eXBlcy5JU3RhdGUpIHtcbiAgY29uc3QgYWN0aXZlUHJvZmlsZSA9IHNlbGVjdG9ycy5hY3RpdmVQcm9maWxlKHN0YXRlKTtcbiAgY29uc3QgZGVwbG95UHJvZmlsZSA9IHNlbGVjdG9ycy5wcm9maWxlQnlJZChzdGF0ZSwgcHJvZmlsZUlkKTtcbiAgaWYgKCEhYWN0aXZlUHJvZmlsZSAmJiAhIWRlcGxveVByb2ZpbGUgJiYgKGRlcGxveVByb2ZpbGUuaWQgIT09IGFjdGl2ZVByb2ZpbGUuaWQpKSB7XG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgfVxuXG4gIGlmIChhY3RpdmVQcm9maWxlPy5nYW1lSWQgIT09IEdBTUVfSUQpIHtcbiAgICByZXR1cm4gdW5kZWZpbmVkO1xuICB9XG5cbiAgcmV0dXJuIGFjdGl2ZVByb2ZpbGU7XG59O1xuXG5leHBvcnQgZnVuY3Rpb24gaXNYTUwoZmlsZVBhdGg6IHN0cmluZykge1xuICByZXR1cm4gWycueG1sJ10uaW5jbHVkZXMocGF0aC5leHRuYW1lKGZpbGVQYXRoKS50b0xvd2VyQ2FzZSgpKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzU2V0dGluZ3NGaWxlKGZpbGVQYXRoOiBzdHJpbmcpIHtcbiAgcmV0dXJuIFsnLnNldHRpbmdzJywgUEFSVF9TVUZGSVhdLnNvbWUoZXh0ID0+IGZpbGVQYXRoLnRvTG93ZXJDYXNlKCkuZW5kc1dpdGgoZXh0KVxuICAgICYmIHBhdGguYmFzZW5hbWUoZmlsZVBhdGgpLnRvTG93ZXJDYXNlKCkgIT09ICdtb2RzLnNldHRpbmdzJyk7XG59XG5cbi8vIGV4cG9ydCBmdW5jdGlvbiBpc1NldHRpbmdzTWVyZ2VTdXBwcmVzc2VkKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSkge1xuLy8gICBjb25zdCBzdGF0ZSA9IGFwaS5nZXRTdGF0ZSgpO1xuLy8gICByZXR1cm4gdXRpbC5nZXRTYWZlKHN0YXRlLCBbJ3NldHRpbmdzJywgJ3dpdGNoZXIzJywgJ3N1cHByZXNzU2V0dGluZ3NNZXJnZSddLCB0cnVlKTtcbi8vIH1cblxuZXhwb3J0IGZ1bmN0aW9uIHN1cHByZXNzRXZlbnRIYW5kbGVycyhhcGk6IHR5cGVzLklFeHRlbnNpb25BcGkpIHtcbiAgLy8gVGhpcyBpc24ndCBjb29sLCBidXQgbWVoLlxuICBjb25zdCBzdGF0ZSA9IGFwaS5nZXRTdGF0ZSgpO1xuICByZXR1cm4gKHN0YXRlLnNlc3Npb24ubm90aWZpY2F0aW9ucy5ub3RpZmljYXRpb25zLnNvbWUobiA9PiBuLmlkID09PSBBQ1RJVklUWV9JRF9JTVBPUlRJTkdfTE9BRE9SREVSKSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB0b0JsdWU8VD4oZnVuYzogKC4uLmFyZ3M6IGFueVtdKSA9PiBQcm9taXNlPFQ+KTogKC4uLmFyZ3M6IGFueVtdKSA9PiBQcm9taXNlPFQ+IHtcbiAgcmV0dXJuICguLi5hcmdzOiBhbnlbXSkgPT4gUHJvbWlzZS5yZXNvbHZlKGZ1bmMoLi4uYXJncykpO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZmlsZUV4aXN0cyhmaWxlUGF0aDogc3RyaW5nKTogUHJvbWlzZTxib29sZWFuPiB7XG4gIHJldHVybiBmcy5zdGF0QXN5bmMoZmlsZVBhdGgpXG4gICAgLnRoZW4oKCkgPT4gdHJ1ZSlcbiAgICAuY2F0Y2goKCkgPT4gZmFsc2UpO1xufSJdfQ==