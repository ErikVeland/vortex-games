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
exports.importMenuMod = exports.exportMenuMod = exports.ensureMenuMod = exports.removeMenuMod = exports.menuMod = exports.onDidDeploy = exports.onWillDeploy = void 0;
const path_1 = __importDefault(require("path"));
const bluebird_1 = __importDefault(require("bluebird"));
const vortex_api_1 = require("vortex-api");
const IniParser = require('vortex-parse-ini');
const shortid_1 = require("shortid");
const migrations_1 = require("./migrations");
const util_1 = require("./collections/util");
const util_2 = require("./util");
const common_1 = require("./common");
const INVALID_CHARS = /[:/\\*?"<>|]/g;
const INPUT_SETTINGS_FILENAME = 'input.settings';
const DX_11_USER_SETTINGS_FILENAME = 'user.settings';
const DX_12_USER_SETTINGS_FILENAME = 'dx12user.settings';
const BACKUP_TAG = '.vortex_backup';
const CACHE_FILENAME = 'vortex_menumod.cache';
function getExistingCache(state, activeProfile) {
    return __awaiter(this, void 0, void 0, function* () {
        const stagingFolder = vortex_api_1.selectors.installPathForGame(state, common_1.GAME_ID);
        const modName = menuMod(activeProfile.name);
        const mod = vortex_api_1.util.getSafe(state, ['persistent', 'mods', common_1.GAME_ID, modName], undefined);
        if (mod === undefined) {
            return [];
        }
        try {
            const cacheData = yield vortex_api_1.fs.readFileAsync(path_1.default.join(stagingFolder, mod.installationPath, CACHE_FILENAME), { encoding: 'utf8' });
            const currentCache = JSON.parse(cacheData);
            return currentCache;
        }
        catch (err) {
            (0, vortex_api_1.log)('warn', 'W3: failed to read/parse cache file', err);
            return [];
        }
    });
}
function toFileMapKey(filePath) {
    return path_1.default.basename(filePath)
        .toLowerCase()
        .replace(common_1.PART_SUFFIX, '');
}
;
function readModData(filePath) {
    return vortex_api_1.fs.readFileAsync(filePath, { encoding: 'utf8' })
        .catch(err => Promise.resolve(undefined));
}
function populateCache(api, activeProfile, modIds, initialCacheValue) {
    const state = api.store.getState();
    const loadOrder = (0, migrations_1.getPersistentLoadOrder)(api);
    const mods = vortex_api_1.util.getSafe(state, ['persistent', 'mods', common_1.GAME_ID], {});
    const modState = vortex_api_1.util.getSafe(activeProfile, ['modState'], {});
    let nextAvailableId = Object.keys(loadOrder).length;
    const getNextId = () => {
        return nextAvailableId++;
    };
    const toIdx = (loItem) => (loadOrder.indexOf(loItem) || getNextId());
    const invalidModTypes = ['witcher3menumoddocuments'];
    const affectedModIds = modIds === undefined ? Object.keys(mods) : modIds;
    const enabledMods = affectedModIds
        .filter(key => {
        var _a, _b;
        return (((_a = mods[key]) === null || _a === void 0 ? void 0 : _a.installationPath) !== undefined)
            && !!((_b = modState[key]) === null || _b === void 0 ? void 0 : _b.enabled) &&
            !invalidModTypes.includes(mods[key].type);
    })
        .sort((lhs, rhs) => (toIdx(lhs)) - (toIdx(rhs)))
        .map(key => mods[key]);
    const getRelevantModEntries = (source) => __awaiter(this, void 0, void 0, function* () {
        let allEntries = [];
        yield require('turbowalk').default(source, entries => {
            const relevantEntries = entries.filter(entry => (entry.filePath.endsWith(common_1.PART_SUFFIX))
                && (entry.filePath.indexOf(common_1.INPUT_XML_FILENAME) === -1))
                .map(entry => entry.filePath);
            allEntries = [].concat(allEntries, relevantEntries);
        }).catch(err => {
            if (['ENOENT', 'ENOTFOUND'].indexOf(err.code) === -1) {
                (0, vortex_api_1.log)('error', 'Failed to lookup menu mod files', { path: source, error: err.message });
            }
        });
        return allEntries;
    });
    const stagingFolder = vortex_api_1.selectors.installPathForGame(state, common_1.GAME_ID);
    return bluebird_1.default.reduce(enabledMods, (accum, mod) => {
        if (mod.installationPath === undefined) {
            return accum;
        }
        return getRelevantModEntries(path_1.default.join(stagingFolder, mod.installationPath))
            .then(entries => {
            return bluebird_1.default.each(entries, filepath => {
                return readModData(filepath)
                    .then(data => {
                    if (data !== undefined) {
                        accum.push({ id: mod.id, filepath, data });
                    }
                });
            })
                .then(() => Promise.resolve(accum));
        });
    }, initialCacheValue !== undefined ? initialCacheValue : [])
        .then(newCache => {
        const modName = menuMod(activeProfile.name);
        let mod = vortex_api_1.util.getSafe(state, ['persistent', 'mods', common_1.GAME_ID, modName], undefined);
        if ((mod === null || mod === void 0 ? void 0 : mod.installationPath) === undefined) {
            (0, vortex_api_1.log)('warn', 'failed to ascertain installation path', modName);
            return Promise.resolve();
        }
        return vortex_api_1.fs.writeFileAsync(path_1.default.join(stagingFolder, mod.installationPath, CACHE_FILENAME), JSON.stringify(newCache));
    });
}
function convertFilePath(filePath, installPath) {
    const segments = filePath.split(path_1.default.sep);
    const idx = segments.reduce((prev, seg, idx) => {
        if (seg.toLowerCase() === common_1.GAME_ID) {
            return idx;
        }
        else {
            return prev;
        }
    }, -1);
    if (idx === -1) {
        (0, vortex_api_1.log)('error', 'unexpected menu mod filepath', filePath);
        return filePath;
    }
    const relPath = segments.slice(idx + 2).join(path_1.default.sep);
    return path_1.default.join(installPath, relPath);
}
function onWillDeploy(api, deployment, activeProfile) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        const state = api.store.getState();
        if ((activeProfile === null || activeProfile === void 0 ? void 0 : activeProfile.name) === undefined) {
            return;
        }
        const installPath = vortex_api_1.selectors.installPathForGame(state, activeProfile.gameId);
        const modName = menuMod(activeProfile.name);
        const destinationFolder = path_1.default.join(installPath, modName);
        const game = vortex_api_1.util.getGame(activeProfile.gameId);
        const discovery = vortex_api_1.selectors.discoveryByGame(state, activeProfile.gameId);
        const modPaths = game.getModPaths(discovery.path);
        const docModPath = modPaths['witcher3menumoddocuments'];
        const currentCache = yield getExistingCache(state, activeProfile);
        if (currentCache.length === 0) {
            return;
        }
        const docFiles = ((_a = deployment['witcher3menumodroot']) !== null && _a !== void 0 ? _a : [])
            .filter(file => (file.relPath.endsWith(common_1.PART_SUFFIX))
            && (file.relPath.indexOf(common_1.INPUT_XML_FILENAME) === -1));
        if (docFiles.length <= 0) {
            return;
        }
        const mods = vortex_api_1.util.getSafe(state, ['persistent', 'mods', common_1.GAME_ID], {});
        const modState = vortex_api_1.util.getSafe(activeProfile, ['modState'], {});
        const invalidModTypes = ['witcher3menumoddocuments'];
        const enabledMods = Object.keys(mods)
            .filter(key => { var _a; return !!((_a = modState[key]) === null || _a === void 0 ? void 0 : _a.enabled) && !invalidModTypes.includes(mods[key].type); });
        const parser = new IniParser.default(new IniParser.WinapiFormat());
        const fileMap = yield cacheToFileMap(state, activeProfile);
        if (fileMap === undefined) {
            return;
        }
        const keys = Object.keys(fileMap);
        const matcher = (entry) => keys.includes(toFileMapKey(entry.relPath));
        const newCache = yield bluebird_1.default.reduce(keys, (accum, key) => __awaiter(this, void 0, void 0, function* () {
            if (docFiles.find(matcher) !== undefined) {
                const mergedData = yield parser.read(path_1.default.join(docModPath, key));
                yield bluebird_1.default.each(fileMap[key], (iter) => __awaiter(this, void 0, void 0, function* () {
                    if (enabledMods.includes(iter.id)) {
                        const tempPath = path_1.default.join(destinationFolder, key) + (0, shortid_1.generate)();
                        const modData = yield toIniFileObject(iter.data, tempPath);
                        const modKeys = Object.keys(modData.data);
                        let changed = false;
                        return bluebird_1.default.each(modKeys, modKey => {
                            if ((mergedData.data[modKey] !== undefined)
                                && (modData.data[modKey] !== undefined)
                                && (mergedData.data[modKey] !== modData.data[modKey])) {
                                modData.data[modKey] = mergedData.data[modKey];
                                changed = true;
                            }
                        }).then(() => __awaiter(this, void 0, void 0, function* () {
                            let newModData;
                            if (changed) {
                                yield parser.write(iter.filepath, modData);
                                newModData = yield readModData(iter.filepath);
                            }
                            else {
                                newModData = iter.data;
                            }
                            if (newModData !== undefined) {
                                accum.push({ id: iter.id, filepath: iter.filepath, data: newModData });
                            }
                        }));
                    }
                }));
            }
            return Promise.resolve(accum);
        }), []);
        return vortex_api_1.fs.writeFileAsync(path_1.default.join(destinationFolder, CACHE_FILENAME), JSON.stringify(newCache));
    });
}
exports.onWillDeploy = onWillDeploy;
function toIniFileObject(data, tempDest) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield vortex_api_1.fs.writeFileAsync(tempDest, data, { encoding: 'utf8' });
            const parser = new IniParser.default(new IniParser.WinapiFormat());
            const iniData = yield parser.read(tempDest);
            yield vortex_api_1.fs.removeAsync(tempDest);
            return Promise.resolve(iniData);
        }
        catch (err) {
            return Promise.reject(err);
        }
    });
}
function onDidDeploy(api, deployment, activeProfile) {
    return __awaiter(this, void 0, void 0, function* () {
        const state = api.store.getState();
        const loadOrder = (0, migrations_1.getPersistentLoadOrder)(api);
        const docFiles = deployment['witcher3menumodroot'].filter(file => (file.relPath.endsWith(common_1.PART_SUFFIX))
            && (file.relPath.indexOf(common_1.INPUT_XML_FILENAME) === -1));
        if (docFiles.length <= 0) {
            return;
        }
        const mods = vortex_api_1.util.getSafe(state, ['persistent', 'mods', common_1.GAME_ID], {});
        const modState = vortex_api_1.util.getSafe(activeProfile, ['modState'], {});
        let nextAvailableId = loadOrder.length;
        const getNextId = () => {
            return nextAvailableId++;
        };
        const invalidModTypes = ['witcher3menumoddocuments'];
        const enabledMods = Object.keys(mods)
            .filter(key => { var _a; return !!((_a = modState[key]) === null || _a === void 0 ? void 0 : _a.enabled) && !invalidModTypes.includes(mods[key].type); })
            .sort((lhs, rhs) => { var _a, _b; return (((_a = loadOrder[rhs]) === null || _a === void 0 ? void 0 : _a.pos) || getNextId()) - (((_b = loadOrder[lhs]) === null || _b === void 0 ? void 0 : _b.pos) || getNextId()); });
        const currentCache = yield getExistingCache(state, activeProfile);
        const inCache = new Set(currentCache.map(entry => entry.id));
        const notInCache = new Set(docFiles.map(file => file.source)
            .filter(modId => !inCache.has(modId)));
        return ensureMenuMod(api, activeProfile)
            .then(() => ((currentCache.length === 0) && (enabledMods.length > 0))
            ? populateCache(api, activeProfile)
            : (notInCache.size !== 0)
                ? populateCache(api, activeProfile, Array.from(notInCache), currentCache)
                : Promise.resolve())
            .then(() => writeCacheToFiles(api, activeProfile))
            .then(() => menuMod(activeProfile.name))
            .catch(err => (err instanceof vortex_api_1.util.UserCanceled)
            ? Promise.resolve()
            : Promise.reject(err));
    });
}
exports.onDidDeploy = onDidDeploy;
function sanitizeProfileName(input) {
    return input.replace(INVALID_CHARS, '_');
}
function menuMod(profileName) {
    return `Witcher 3 Menu Mod Data (${sanitizeProfileName(profileName)})`;
}
exports.menuMod = menuMod;
function createMenuMod(api, modName, profile) {
    return __awaiter(this, void 0, void 0, function* () {
        const mod = {
            id: modName,
            state: 'installed',
            attributes: {
                name: 'Witcher 3 Menu Mod',
                description: 'This mod is a collective merge of setting files required by any/all '
                    + 'menu mods the user has installed - please do not disable/remove unless '
                    + 'all menu mods have been removed from your game first.',
                logicalFileName: 'Witcher 3 Menu Mod',
                modId: 42,
                version: '1.0.0',
                variant: sanitizeProfileName(profile.name.replace(INVALID_CHARS, '_')),
                installTime: new Date(),
            },
            installationPath: modName,
            type: 'witcher3menumoddocuments',
        };
        return yield new Promise((resolve, reject) => {
            api.events.emit('create-mod', profile.gameId, mod, (error) => __awaiter(this, void 0, void 0, function* () {
                if (error !== null) {
                    return reject(error);
                }
                resolve();
            }));
        });
    });
}
function removeMenuMod(api, profile) {
    return __awaiter(this, void 0, void 0, function* () {
        const state = api.store.getState();
        const modName = menuMod(profile.name);
        const mod = vortex_api_1.util.getSafe(state, ['persistent', 'mods', profile.gameId, modName], undefined);
        if (mod === undefined) {
            return Promise.resolve();
        }
        return new Promise((resolve, reject) => {
            api.events.emit('remove-mod', profile.gameId, mod.id, (error) => __awaiter(this, void 0, void 0, function* () {
                if (error !== null) {
                    (0, vortex_api_1.log)('error', 'failed to remove menu mod', error);
                }
                return resolve();
            }));
        });
    });
}
exports.removeMenuMod = removeMenuMod;
function cacheToFileMap(state, profile) {
    return __awaiter(this, void 0, void 0, function* () {
        const currentCache = yield getExistingCache(state, profile);
        if (currentCache.length === 0) {
            return undefined;
        }
        const stagingFolder = vortex_api_1.selectors.installPathForGame(state, common_1.GAME_ID);
        const fileMap = currentCache.reduce((accum, entry) => {
            accum[toFileMapKey(entry.filepath)] =
                [].concat(accum[toFileMapKey(entry.filepath)] || [], [{
                        id: entry.id,
                        data: entry.data,
                        filepath: convertFilePath(entry.filepath, stagingFolder),
                    }]);
            return accum;
        }, {});
        return fileMap;
    });
}
const copyIniFile = (source, dest) => vortex_api_1.fs.copyAsync(source, dest)
    .then(() => Promise.resolve(dest)).catch(err => Promise.resolve(undefined));
const getInitialDoc = (filePath) => {
    return vortex_api_1.fs.statAsync(filePath + BACKUP_TAG)
        .then(() => Promise.resolve(filePath + BACKUP_TAG))
        .catch(err => vortex_api_1.fs.statAsync(filePath)
        .then(() => Promise.resolve(filePath)))
        .catch(err => {
        (0, vortex_api_1.log)('warn', 'W3: cannot find original file', err.message);
        return Promise.resolve(undefined);
    });
};
function writeCacheToFiles(api, profile) {
    return __awaiter(this, void 0, void 0, function* () {
        const state = api.store.getState();
        const modName = menuMod(profile.name);
        const installPath = vortex_api_1.selectors.installPathForGame(state, profile.gameId);
        const destinationFolder = path_1.default.join(installPath, modName);
        const game = vortex_api_1.util.getGame(profile.gameId);
        const discovery = vortex_api_1.selectors.discoveryByGame(state, profile.gameId);
        const modPaths = game.getModPaths(discovery.path);
        const docModPath = modPaths['witcher3menumoddocuments'];
        const currentCache = yield getExistingCache(state, profile);
        if (currentCache.length === 0)
            return;
        const fileMap = yield cacheToFileMap(state, profile);
        if (!fileMap)
            return;
        const parser = new IniParser.default(new IniParser.WinapiFormat());
        const keys = Object.keys(fileMap);
        for (const key of keys) {
            try {
                const source = yield getInitialDoc(path_1.default.join(docModPath, key));
                if (!source)
                    continue;
                yield copyIniFile(source, path_1.default.join(destinationFolder, key));
                const initialData = yield parser.read(path_1.default.join(destinationFolder, key));
                for (const modEntry of fileMap[key]) {
                    const tempFilePath = path_1.default.join(destinationFolder, key) + (0, shortid_1.generate)();
                    const modData = yield toIniFileObject(modEntry.data, tempFilePath);
                    for (const modKey of Object.keys(modData.data)) {
                        initialData.data[modKey] = Object.assign(Object.assign({}, initialData.data[modKey]), modData.data[modKey]);
                    }
                }
                yield parser.write(path_1.default.join(destinationFolder, key), initialData);
            }
            catch (err) {
                if (err.code === 'ENOENT' && [
                    path_1.default.join(docModPath, INPUT_SETTINGS_FILENAME),
                    path_1.default.join(docModPath, DX_11_USER_SETTINGS_FILENAME),
                    path_1.default.join(docModPath, DX_12_USER_SETTINGS_FILENAME),
                ].includes(err.path)) {
                    api.showErrorNotification('Failed to install menu mod', new vortex_api_1.util.DataInvalid('Required setting files are missing - please run the game at least once and try again.'), { allowReport: false });
                    return;
                }
                throw err;
            }
        }
    });
}
function ensureMenuMod(api, profile) {
    return __awaiter(this, void 0, void 0, function* () {
        const state = api.store.getState();
        const modName = menuMod(profile.name);
        const mod = vortex_api_1.util.getSafe(state, ['persistent', 'mods', profile.gameId, modName], undefined);
        if (mod === undefined) {
            try {
                yield createMenuMod(api, modName, profile);
            }
            catch (err) {
                return Promise.reject(err);
            }
        }
        else {
            api.store.dispatch(vortex_api_1.actions.setModAttribute(profile.gameId, modName, 'installTime', new Date()));
            api.store.dispatch(vortex_api_1.actions.setModAttribute(profile.gameId, modName, 'name', 'Witcher 3 Menu Mod'));
            api.store.dispatch(vortex_api_1.actions.setModAttribute(profile.gameId, modName, 'type', 'witcher3menumoddocuments'));
            api.store.dispatch(vortex_api_1.actions.setModAttribute(profile.gameId, modName, 'logicalFileName', 'Witcher 3 Menu Mod'));
            api.store.dispatch(vortex_api_1.actions.setModAttribute(profile.gameId, modName, 'modId', 42));
            api.store.dispatch(vortex_api_1.actions.setModAttribute(profile.gameId, modName, 'version', '1.0.0'));
            api.store.dispatch(vortex_api_1.actions.setModAttribute(profile.gameId, modName, 'variant', sanitizeProfileName(profile.name)));
        }
        return Promise.resolve(modName);
    });
}
exports.ensureMenuMod = ensureMenuMod;
function exportMenuMod(api, profile, includedMods) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const deployment = yield (0, util_2.getDeployment)(api, includedMods);
            if (deployment === undefined) {
                throw new Error('Failed to get deployment');
            }
            const modName = yield onDidDeploy(api, deployment, profile);
            if (modName === undefined) {
                return undefined;
            }
            const mods = vortex_api_1.util.getSafe(api.getState(), ['persistent', 'mods', common_1.GAME_ID], {});
            const modId = Object.keys(mods).find(id => id === modName);
            if (modId === undefined) {
                throw new Error('Menu mod is missing');
            }
            const installPath = vortex_api_1.selectors.installPathForGame(api.getState(), common_1.GAME_ID);
            const modPath = path_1.default.join(installPath, mods[modId].installationPath);
            const data = yield (0, util_1.prepareFileData)(modPath);
            return data;
        }
        catch (err) {
            return Promise.reject(err);
        }
    });
}
exports.exportMenuMod = exportMenuMod;
function importMenuMod(api, profile, fileData) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const modName = yield ensureMenuMod(api, profile);
            const mod = vortex_api_1.util.getSafe(api.getState(), ['persistent', 'mods', profile.gameId, modName], undefined);
            const installPath = vortex_api_1.selectors.installPathForGame(api.getState(), common_1.GAME_ID);
            const destPath = path_1.default.join(installPath, mod.installationPath);
            yield (0, util_1.restoreFileData)(fileData, destPath);
        }
        catch (err) {
            return Promise.reject(err);
        }
    });
}
exports.importMenuMod = importMenuMod;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWVudW1vZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIm1lbnVtb2QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7O0FBQ0EsZ0RBQXdCO0FBQ3hCLHdEQUFnQztBQUNoQywyQ0FBc0U7QUFDdEUsTUFBTSxTQUFTLEdBQUcsT0FBTyxDQUFDLGtCQUFrQixDQUFDLENBQUM7QUFDOUMscUNBQW1DO0FBRW5DLDZDQUFzRDtBQUN0RCw2Q0FBc0U7QUFDdEUsaUNBQXVDO0FBQ3ZDLHFDQUFvRTtBQUdwRSxNQUFNLGFBQWEsR0FBRyxlQUFlLENBQUM7QUFDdEMsTUFBTSx1QkFBdUIsR0FBRyxnQkFBZ0IsQ0FBQztBQUNqRCxNQUFNLDRCQUE0QixHQUFHLGVBQWUsQ0FBQztBQUNyRCxNQUFNLDRCQUE0QixHQUFHLG1CQUFtQixDQUFDO0FBQ3pELE1BQU0sVUFBVSxHQUFHLGdCQUFnQixDQUFDO0FBY3BDLE1BQU0sY0FBYyxHQUFHLHNCQUFzQixDQUFBO0FBZTdDLFNBQWUsZ0JBQWdCLENBQUMsS0FBSyxFQUFFLGFBQWE7O1FBQ2xELE1BQU0sYUFBYSxHQUFHLHNCQUFTLENBQUMsa0JBQWtCLENBQUMsS0FBSyxFQUFFLGdCQUFPLENBQUMsQ0FBQztRQUNuRSxNQUFNLE9BQU8sR0FBRyxPQUFPLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQzVDLE1BQU0sR0FBRyxHQUFHLGlCQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxDQUFDLFlBQVksRUFBRSxNQUFNLEVBQUUsZ0JBQU8sRUFBRSxPQUFPLENBQUMsRUFBRSxTQUFTLENBQUMsQ0FBQztRQUNyRixJQUFJLEdBQUcsS0FBSyxTQUFTLEVBQUU7WUFDckIsT0FBTyxFQUFFLENBQUM7U0FDWDtRQUVELElBQUk7WUFDRixNQUFNLFNBQVMsR0FBRyxNQUFNLGVBQUUsQ0FBQyxhQUFhLENBQUMsY0FBSSxDQUFDLElBQUksQ0FBQyxhQUFhLEVBQzlELEdBQUcsQ0FBQyxn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Q0FBQyxXQUFXLEVBQUUsR0FBRyxDQUFDLGdCQUFnQixDQUFDLENBQUM7WUFDOUQsTUFBTSxJQUFBLHNCQUFlLEVBQUMsUUFBUSxFQUFFLFFBQVEsQ0FBQyxDQUFDO1NBQzNDO1FBQUMsT0FBTyxHQUFHLEVBQUU7WUFDWixPQUFPLE9BQU8sQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUM7U0FDNUI7SUFDSCxDQUFDO0NBQUE7QUFiRCxzQ0FhQyIsInNvdXJjZXNDb250ZW50IjpbIi8qIGVzbGludC1kaXNhYmxlICovXG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcbmltcG9ydCBCbHVlYmlyZCBmcm9tICdibHVlYmlyZCc7XG5pbXBvcnQgeyBhY3Rpb25zLCBmcywgbG9nLCBzZWxlY3RvcnMsIHR5cGVzLCB1dGlsIH0gZnJvbSAndm9ydGV4LWFwaSc7XG5jb25zdCBJbmlQYXJzZXIgPSByZXF1aXJlKCd2b3J0ZXgtcGFyc2UtaW5pJyk7XG5pbXBvcnQgeyBnZW5lcmF0ZSB9IGZyb20gJ3Nob3J0aWQnO1xuXG5pbXBvcnQgeyBnZXRQZXJzaXN0ZW50TG9hZE9yZGVyIH0gZnJvbSAnLi9taWdyYXRpb25zJztcbmltcG9ydCB7IHByZXBhcmVGaWxlRGF0YSwgcmVzdG9yZUZpbGVEYXRhIH0gZnJvbSAnLi9jb2xsZWN0aW9ucy91dGlsJztcbmltcG9ydCB7IGdldERlcGxveW1lbnQgfSBmcm9tICcuL3V0aWwnO1xuaW1wb3J0IHsgR0FNRV9JRCwgSU5QVVRfWE1MX0ZJTEVOQU1FLCBQQVJUX1NVRkZJWCB9IGZyb20gJy4vY29tbW9uJztcblxuLy8gbW9zdCBvZiB0aGVzZSBhcmUgaW52YWxpZCBvbiB3aW5kb3dzIG9ubHkgYnV0IGl0J3Mgbm90IHdvcnRoIHRoZSBlZmZvcnQgYWxsb3dpbmcgdGhlbSBlbHNld2hlcmVcbmNvbnN0IElOVkFMSURfQ0hBUlMgPSAvWzovXFxcXCo/XCI8PnxdL2c7XG5jb25zdCBJTlBVVF9TRVRUSU5HU19GSUxFTkFNRSA9ICdpbnB1dC5zZXR0aW5ncyc7XG5jb25zdCBEWF8xMV9VU0VSX1NFVFRJTkdTX0ZJTEVOQU1FID0gJ3VzZXIuc2V0dGluZ3MnO1xuY29uc3QgRFhfMTJfVVNFUl9TRVRUSU5HU19GSUxFTkFNRSA9ICdkeDEydXNlci5zZXR0aW5ncyc7XG5jb25zdCBCQUNLVVBfVEFHID0gJy52b3J0ZXhfYmFja3VwJztcblxuaW50ZXJmYWNlIElDYWNoZUVudHJ5IHtcbiAgaWQ6IHN0cmluZztcbiAgZmlsZXBhdGg6IHN0cmluZztcbiAgZGF0YTogc3RyaW5nO1xufVxuXG50eXBlIElGaWxlTWFwID0geyBbZW50cnlJZDogc3RyaW5nXTogSUNhY2hlRW50cnlbXSB9O1xuXG4vLyBXZSdyZSBnb2luZyB0byBzYXZlIHBlciBtb2QgaW5pIHNldHRpbmdzIGZvciBlYWNoXG4vLyAgZmlsZSAod2hlcmUgYXBwbGljYWJsZSkgaW50byB0aGlzIGNhY2hlIGZpbGUgc29cbi8vICB3ZSBjYW4ga2VlcCB0cmFjayBvZiBjaGFuZ2VzIHRoYXQgdGhlIHVzZXIgbWFkZVxuLy8gIGR1cmluZyBoaXMgcGxheXRocm91Z2guXG5jb25zdCBDQUNIRV9GSUxFTkFNRSA9ICd2b3J0ZXhfbWVudW1vZC5jYWNoZSdcbi8qIENhY2hlIGZvcm1hdCBzaG91bGQgYmUgYXMgZm9sbG93czpcbiAgW1xuICAgIHtcbiAgICAgIGlkOiAkbW9kSWRcbiAgICAgIGZpbGVwYXRoOiAnLi4vaW5wdXQuc2V0dGluZ3MnLFxuICAgICAgZGF0YTogJ2luaSBkYXRhIGluIHN0cmluZyBmb3JtYXQnLFxuICAgIH0sXG4gICAge1xuICAgICAgaWQ6ICRtb2RJZFxuICAgICAgZmlsZW5hbWU6ICcuLi91c2VyLnNldHRpbmdzJyxcbiAgICAgIGRhdGE6ICdpbmkgZGF0YSBpbiBzdHJpbmcgZm9ybWF0JyxcbiAgICB9LFxuICBdXG4qL1xuYXN5bmMgZnVuY3Rpb24gZ2V0RXhpc3RpbmdDYWNoZShzdGF0ZSwgYWN0aXZlUHJvZmlsZSkge1xuICBjb25zdCBzdGFnaW5nRm9sZGVyID0gc2VsZWN0b3JzLmluc3RhbGxQYXRoRm9yR2FtZShzdGF0ZSwgR0FNRV9JRCk7XG4gIGNvbnN0IG1vZE5hbWUgPSBtZW51TW9kKGFjdGl2ZVByb2ZpbGUubmFtZSk7XG4gIGNvbnN0IG1vZCA9IHV0aWwuZ2V0U2FmZShzdGF0ZSwgWydwZXJzaXN0ZW50JywgJ21vZHMnLCBHQU1FX0lELCBtb2ROYW1lXSwgdW5kZWZpbmVkKTtcbiAgaWYgKG1vZCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgcmV0dXJuIFtdO1xuICB9XG5cbiAgdHJ5IHtcbiAgICBjb25zdCBjYWNoZURhdGEgPSBhd2FpdCBmcy5yZWFkRmlsZUFzeW5jKHBhdGguam9pbihzdGFnaW5nRm9sZGVyLFxuICAgICAgbW9kLmluc3RhbGxhdGlvblBhdGgsIENBQ0hFX0ZJTEVOQU1FKSwgeyBlbmNvZGluZzogJ3V0ZjgnIH0pO1xuICAgIGNvbnN0IGN1cnJlbnRDYWNoZSA9IEpTT04ucGFyc2UoY2FjaGVEYXRhKTtcbiAgICByZXR1cm4gY3VycmVudENhY2hlO1xuICB9IGNhdGNoIChlcnIpIHtcbiAgICAvLyBXZSB3ZXJlIHVuYWJsZSB0byByZWFkL3BhcnNlIHRoZSBjYWNoZSBmaWxlIC0gdGhpcyBpcyBwZXJmZWN0bHlcbiAgICAvLyAgdmFsaWQgd2hlbiB0aGUgY2FjaGUgZmlsZSBoYXNuJ3QgYmVlbiBjcmVhdGVkIHlldCwgYW5kIGV2ZW4gaWYvd2hlblxuICAgIC8vICB0aGUgZXJyb3IgaXMgbW9yZSBzZXJpb3VzIC0gd2Ugc2hvdWxkbid0IGJsb2NrIHRoZSBkZXBsb3ltZW50LlxuICAgIGxvZygnd2FybicsICdXMzogZmFpbGVkIHRvIHJlYWQvcGFyc2UgY2FjaGUgZmlsZScsIGVycik7XG4gICAgcmV0dXJuIFtdO1xuICB9XG59XG5cbmZ1bmN0aW9uIHRvRmlsZU1hcEtleShmaWxlUGF0aCkge1xuICByZXR1cm4gcGF0aC5iYXNlbmFtZShmaWxlUGF0aClcbiAgICAgICAgICAgICAudG9Mb3dlckNhc2UoKVxuICAgICAgICAgICAgIC5yZXBsYWNlKFBBUlRfU1VGRklYLCAnJyk7XG59O1xuXG5mdW5jdGlvbiByZWFkTW9kRGF0YShmaWxlUGF0aCkge1xuICByZXR1cm4gZnMucmVhZEZpbGVBc3luYyhmaWxlUGF0aCwgeyBlbmNvZGluZzogJ3V0ZjgnIH0pXG4gICAgLmNhdGNoKGVyciA9PiBQcm9taXNlLnJlc29sdmUodW5kZWZpbmVkKSk7XG59XG5cbmZ1bmN0aW9uIHBvcHVsYXRlQ2FjaGUoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpLCBhY3RpdmVQcm9maWxlOiB0eXBlcy5JUHJvZmlsZSwgbW9kSWRzPzogc3RyaW5nW10sIGluaXRpYWxDYWNoZVZhbHVlPzogSUNhY2hlRW50cnlbXSkge1xuICBjb25zdCBzdGF0ZSA9IGFwaS5zdG9yZS5nZXRTdGF0ZSgpO1xuICBjb25zdCBsb2FkT3JkZXIgPSBnZXRQZXJzaXN0ZW50TG9hZE9yZGVyKGFwaSk7XG4gIGNvbnN0IG1vZHMgPSB1dGlsLmdldFNhZmUoc3RhdGUsIFsncGVyc2lzdGVudCcsICdtb2RzJywgR0FNRV9JRF0sIHt9KTtcbiAgY29uc3QgbW9kU3RhdGUgPSB1dGlsLmdldFNhZmUoYWN0aXZlUHJvZmlsZSwgWydtb2RTdGF0ZSddLCB7fSk7XG5cbiAgbGV0IG5leHRBdmFpbGFibGVJZCA9IE9iamVjdC5rZXlzKGxvYWRPcmRlcikubGVuZ3RoO1xuICBjb25zdCBnZXROZXh0SWQgPSAoKSA9PiB7XG4gICAgcmV0dXJuIG5leHRBdmFpbGFibGVJZCsrO1xuICB9XG4gIGNvbnN0IHRvSWR4ID0gKGxvSXRlbSkgPT4gKGxvYWRPcmRlci5pbmRleE9mKGxvSXRlbSkgfHwgZ2V0TmV4dElkKCkpO1xuICBjb25zdCBpbnZhbGlkTW9kVHlwZXMgPSBbJ3dpdGNoZXIzbWVudW1vZGRvY3VtZW50cyddO1xuICBjb25zdCBhZmZlY3RlZE1vZElkcyA9IG1vZElkcyA9PT0gdW5kZWZpbmVkID8gT2JqZWN0LmtleXMobW9kcykgOiBtb2RJZHM7XG4gIGNvbnN0IGVuYWJsZWRNb2RzID0gYWZmZWN0ZWRNb2RJZHNcbiAgICAuZmlsdGVyKGtleSA9PiAobW9kc1trZXldPy5pbnN0YWxsYXRpb25QYXRoICE9PSB1bmRlZmluZWQpXG4gICAgICAgICAgICAgICAgJiYgISFtb2RTdGF0ZVtrZXldPy5lbmFibGVkICYmXG4gICAgICAgICAgICAgICAgIWludmFsaWRNb2RUeXBlcy5pbmNsdWRlcyhtb2RzW2tleV0udHlwZSkpXG4gICAgLnNvcnQoKGxocywgcmhzKSA9PiAodG9JZHgobGhzKSkgLSAodG9JZHgocmhzKSkpXG4gICAgLm1hcChrZXkgPT4gbW9kc1trZXldKTtcblxuICBjb25zdCBnZXRSZWxldmFudE1vZEVudHJpZXMgPSBhc3luYyAoc291cmNlKSA9PiB7XG4gICAgbGV0IGFsbEVudHJpZXMgPSBbXTtcbiAgICBhd2FpdCByZXF1aXJlKCd0dXJib3dhbGsnKS5kZWZhdWx0KHNvdXJjZSwgZW50cmllcyA9PiB7XG4gICAgICBjb25zdCByZWxldmFudEVudHJpZXMgPSBlbnRyaWVzLmZpbHRlcihlbnRyeSA9PlxuICAgICAgICAgICAoZW50cnkuZmlsZVBhdGguZW5kc1dpdGgoUEFSVF9TVUZGSVgpKVxuICAgICAgICAmJiAoZW50cnkuZmlsZVBhdGguaW5kZXhPZihJTlBVVF9YTUxfRklMRU5BTUUpID09PSAtMSkpXG4gICAgICAgICAgICAgIC5tYXAoZW50cnkgPT4gZW50cnkuZmlsZVBhdGgpO1xuXG4gICAgICBhbGxFbnRyaWVzID0gW10uY29uY2F0KGFsbEVudHJpZXMsIHJlbGV2YW50RW50cmllcyk7XG4gICAgfSkuY2F0Y2goZXJyID0+IHtcbiAgICAgIGlmICAoWydFTk9FTlQnLCAnRU5PVEZPVU5EJ10uaW5kZXhPZihlcnIuY29kZSkgPT09IC0xKSB7XG4gICAgICAgIGxvZygnZXJyb3InLCAnRmFpbGVkIHRvIGxvb2t1cCBtZW51IG1vZCBmaWxlcycsXG4gICAgICAgICAgeyBwYXRoOiBzb3VyY2UsIGVycm9yOiBlcnIubWVzc2FnZSB9KTtcbiAgICAgIH1cbiAgICB9KVxuXG4gICAgcmV0dXJuIGFsbEVudHJpZXM7XG4gIH07XG5cbiAgY29uc3Qgc3RhZ2luZ0ZvbGRlciA9IHNlbGVjdG9ycy5pbnN0YWxsUGF0aEZvckdhbWUoc3RhdGUsIEdBTUVfSUQpO1xuICByZXR1cm4gQmx1ZWJpcmQucmVkdWNlKGVuYWJsZWRNb2RzLCAoYWNjdW0sIG1vZDogdHlwZXMuSU1vZCkgPT4ge1xuICAgIGlmIChtb2QuaW5zdGFsbGF0aW9uUGF0aCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICByZXR1cm4gYWNjdW07XG4gICAgfVxuICAgIHJldHVybiBnZXRSZWxldmFudE1vZEVudHJpZXMocGF0aC5qb2luKHN0YWdpbmdGb2xkZXIsIG1vZC5pbnN0YWxsYXRpb25QYXRoKSlcbiAgICAgIC50aGVuKGVudHJpZXMgPT4ge1xuICAgICAgICByZXR1cm4gQmx1ZWJpcmQuZWFjaChlbnRyaWVzLCBmaWxlcGF0aCA9PiB7XG4gICAgICAgICAgcmV0dXJuIHJlYWRNb2REYXRhKGZpbGVwYXRoKVxuICAgICAgICAgICAgLnRoZW4oZGF0YSA9PiB7XG4gICAgICAgICAgICAgIGlmIChkYXRhICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICBhY2N1bS5wdXNoKHsgaWQ6IG1vZC5pZCwgZmlsZXBhdGgsIGRhdGEgfSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pXG4gICAgICAgIH0pXG4gICAgICAgIC50aGVuKCgpID0+IFByb21pc2UucmVzb2x2ZShhY2N1bSkpXG4gICAgICB9KVxuICB9LCBpbml0aWFsQ2FjaGVWYWx1ZSAhPT0gdW5kZWZpbmVkID8gaW5pdGlhbENhY2hlVmFsdWUgOiBbXSlcbiAgLnRoZW4obmV3Q2FjaGUgPT4ge1xuICAgIGNvbnN0IG1vZE5hbWUgPSBtZW51TW9kKGFjdGl2ZVByb2ZpbGUubmFtZSk7XG4gICAgbGV0IG1vZCA9IHV0aWwuZ2V0U2FmZShzdGF0ZSwgWydwZXJzaXN0ZW50JywgJ21vZHMnLCBHQU1FX0lELCBtb2ROYW1lXSwgdW5kZWZpbmVkKTtcbiAgICBpZiAobW9kPy5pbnN0YWxsYXRpb25QYXRoID09PSB1bmRlZmluZWQpIHtcbiAgICAgIGxvZygnd2FybicsICdmYWlsZWQgdG8gYXNjZXJ0YWluIGluc3RhbGxhdGlvbiBwYXRoJywgbW9kTmFtZSk7XG4gICAgICAvLyBXZSB3aWxsIGNyZWF0ZSBpdCBvbiB0aGUgbmV4dCBydW4uXG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGZzLndyaXRlRmlsZUFzeW5jKHBhdGguam9pbihzdGFnaW5nRm9sZGVyLCBtb2QuaW5zdGFsbGF0aW9uUGF0aCwgQ0FDSEVfRklMRU5BTUUpLCBKU09OLnN0cmluZ2lmeShuZXdDYWNoZSkpO1xuICB9KTtcbn1cblxuZnVuY3Rpb24gY29udmVydEZpbGVQYXRoKGZpbGVQYXRoLCBpbnN0YWxsUGF0aCkgeyBcbiAgLy8gUHJlLWNvbGxlY3Rpb25zIHdlIHdvdWxkIHVzZSBhYnNvbHV0ZSBwYXRocyBwb2ludGluZ1xuICAvLyAgdG8gdGhlIG1lbnUgbW9kIGlucHV0IG1vZGlmaWNhdGlvbnM7IHRoaXMgd2lsbCBvYnZpb3VzbHlcbiAgLy8gIHdvcmsganVzdCBmaW5lIG9uIHRoZSBjdXJhdG9yJ3MgZW5kLCBidXQgcmVscGF0aHMgc2hvdWxkIGJlIHVzZWRcbiAgLy8gIG9uIHRoZSB1c2VyJ3MgZW5kLiBUaGlzIGZ1bmN0b3Igd2lsbCBjb252ZXJ0IHRoZSBhYnMgcGF0aCBmcm9tXG4gIC8vICB0aGUgY3VyYXRvcidzIHBhdGggdG8gdGhlIHVzZXIncyBwYXRoLlxuICBjb25zdCBzZWdtZW50cyA9IGZpbGVQYXRoLnNwbGl0KHBhdGguc2VwKTtcbiAgY29uc3QgaWR4ID0gc2VnbWVudHMucmVkdWNlKChwcmV2LCBzZWcsIGlkeCkgPT4ge1xuICAgIGlmIChzZWcudG9Mb3dlckNhc2UoKSA9PT0gR0FNRV9JRCkge1xuICAgICAgcmV0dXJuIGlkeDtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHByZXY7XG4gICAgfVxuICB9LCAtMSk7XG4gIGlmIChpZHggPT09IC0xKSB7XG4gICAgbG9nKCdlcnJvcicsICd1bmV4cGVjdGVkIG1lbnUgbW9kIGZpbGVwYXRoJywgZmlsZVBhdGgpO1xuICAgIHJldHVybiBmaWxlUGF0aDtcbiAgfVxuICAvLyBXZSBzbGljZSBvZmYgZXZlcnl0aGluZyB1cCB0byB0aGUgR0FNRV9JRCBhbmQgdGhlICdtb2RzJyBmb2xkZXIuXG4gIGNvbnN0IHJlbFBhdGggPSBzZWdtZW50cy5zbGljZShpZHggKyAyKS5qb2luKHBhdGguc2VwKTtcbiAgcmV0dXJuIHBhdGguam9pbihpbnN0YWxsUGF0aCwgcmVsUGF0aCk7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBvbldpbGxEZXBsb3koYXBpLCBkZXBsb3ltZW50LCBhY3RpdmVQcm9maWxlKSB7XG4gIC8vIGlmICghaXNTZXR0aW5nc01lcmdlU3VwcHJlc3NlZChhcGkpKSB7XG4gIC8vICAgcmV0dXJuO1xuICAvLyB9XG4gIGNvbnN0IHN0YXRlID0gYXBpLnN0b3JlLmdldFN0YXRlKCk7XG4gIGlmIChhY3RpdmVQcm9maWxlPy5uYW1lID09PSB1bmRlZmluZWQpIHtcbiAgICByZXR1cm47XG4gIH1cbiAgY29uc3QgaW5zdGFsbFBhdGggPSBzZWxlY3RvcnMuaW5zdGFsbFBhdGhGb3JHYW1lKHN0YXRlLCBhY3RpdmVQcm9maWxlLmdhbWVJZCk7XG4gIGNvbnN0IG1vZE5hbWUgPSBtZW51TW9kKGFjdGl2ZVByb2ZpbGUubmFtZSk7XG4gIGNvbnN0IGRlc3RpbmF0aW9uRm9sZGVyID0gcGF0aC5qb2luKGluc3RhbGxQYXRoLCBtb2ROYW1lKTtcbiAgY29uc3QgZ2FtZSA9IHV0aWwuZ2V0R2FtZShhY3RpdmVQcm9maWxlLmdhbWVJZCk7XG4gIGNvbnN0IGRpc2NvdmVyeSA9IHNlbGVjdG9ycy5kaXNjb3ZlcnlCeUdhbWUoc3RhdGUsIGFjdGl2ZVByb2ZpbGUuZ2FtZUlkKTtcbiAgY29uc3QgbW9kUGF0aHMgPSBnYW1lLmdldE1vZFBhdGhzKGRpc2NvdmVyeS5wYXRoKTtcbiAgY29uc3QgZG9jTW9kUGF0aCA9IG1vZFBhdGhzWyd3aXRjaGVyM21lbnVtb2Rkb2N1bWVudHMnXTtcbiAgY29uc3QgY3VycmVudENhY2hlID0gYXdhaXQgZ2V0RXhpc3RpbmdDYWNoZShzdGF0ZSwgYWN0aXZlUHJvZmlsZSk7XG4gIGlmIChjdXJyZW50Q2FjaGUubGVuZ3RoID09PSAwKSB7XG4gICAgLy8gTm90aGluZyB0byBjb21wYXJlLCB1c2VyIGRvZXMgbm90IGhhdmUgYSBjYWNoZS5cbiAgICByZXR1cm47XG4gIH1cblxuICBjb25zdCBkb2NGaWxlcyA9IChkZXBsb3ltZW50Wyd3aXRjaGVyM21lbnVtb2Ryb290J10gPz8gW10pXG4gICAgLmZpbHRlcihmaWxlID0+IChmaWxlLnJlbFBhdGguZW5kc1dpdGgoUEFSVF9TVUZGSVgpKVxuICAgICAgICAgICAgICAgICAmJiAoZmlsZS5yZWxQYXRoLmluZGV4T2YoSU5QVVRfWE1MX0ZJTEVOQU1FKSA9PT0gLTEpKTtcblxuICBpZiAoZG9jRmlsZXMubGVuZ3RoIDw9IDApIHtcbiAgICAvLyBObyBkb2MgZmlsZXMsIG5vIHByb2JsZW0uXG4gICAgcmV0dXJuO1xuICB9XG5cbiAgY29uc3QgbW9kcyA9IHV0aWwuZ2V0U2FmZShzdGF0ZSwgWydwZXJzaXN0ZW50JywgJ21vZHMnLCBHQU1FX0lEXSwge30pO1xuICBjb25zdCBtb2RTdGF0ZSA9IHV0aWwuZ2V0U2FmZShhY3RpdmVQcm9maWxlLCBbJ21vZFN0YXRlJ10sIHt9KTtcbiAgY29uc3QgaW52YWxpZE1vZFR5cGVzID0gWyd3aXRjaGVyM21lbnVtb2Rkb2N1bWVudHMnXTtcbiAgY29uc3QgZW5hYmxlZE1vZHMgPSBPYmplY3Qua2V5cyhtb2RzKVxuICAgIC5maWx0ZXIoa2V5ID0+ICEhbW9kU3RhdGVba2V5XT8uZW5hYmxlZCAmJiAhaW52YWxpZE1vZFR5cGVzLmluY2x1ZGVzKG1vZHNba2V5XS50eXBlKSk7XG5cbiAgY29uc3QgcGFyc2VyID0gbmV3IEluaVBhcnNlci5kZWZhdWx0KG5ldyBJbmlQYXJzZXIuV2luYXBpRm9ybWF0KCkpO1xuXG4gIGNvbnN0IGZpbGVNYXAgPSBhd2FpdCBjYWNoZVRvRmlsZU1hcChzdGF0ZSwgYWN0aXZlUHJvZmlsZSk7XG4gIGlmIChmaWxlTWFwID09PSB1bmRlZmluZWQpIHtcbiAgICByZXR1cm47XG4gIH1cblxuICBjb25zdCBrZXlzID0gT2JqZWN0LmtleXMoZmlsZU1hcCk7XG4gIGNvbnN0IG1hdGNoZXIgPSAoZW50cnkpID0+IGtleXMuaW5jbHVkZXModG9GaWxlTWFwS2V5KGVudHJ5LnJlbFBhdGgpKTtcbiAgY29uc3QgbmV3Q2FjaGUgPSBhd2FpdCBCbHVlYmlyZC5yZWR1Y2Uoa2V5cywgYXN5bmMgKGFjY3VtLCBrZXkpID0+IHtcbiAgICBpZiAoZG9jRmlsZXMuZmluZChtYXRjaGVyKSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBjb25zdCBtZXJnZWREYXRhID0gYXdhaXQgcGFyc2VyLnJlYWQocGF0aC5qb2luKGRvY01vZFBhdGgsIGtleSkpO1xuICAgICAgYXdhaXQgQmx1ZWJpcmQuZWFjaChmaWxlTWFwW2tleV0sIGFzeW5jIChpdGVyOiBJQ2FjaGVFbnRyeSkgPT4ge1xuICAgICAgICBpZiAoZW5hYmxlZE1vZHMuaW5jbHVkZXMoaXRlci5pZCkpIHtcbiAgICAgICAgICBjb25zdCB0ZW1wUGF0aCA9IHBhdGguam9pbihkZXN0aW5hdGlvbkZvbGRlciwga2V5KSArIGdlbmVyYXRlKCk7XG4gICAgICAgICAgY29uc3QgbW9kRGF0YSA9IGF3YWl0IHRvSW5pRmlsZU9iamVjdChpdGVyLmRhdGEsIHRlbXBQYXRoKTtcbiAgICAgICAgICBjb25zdCBtb2RLZXlzID0gT2JqZWN0LmtleXMobW9kRGF0YS5kYXRhKTtcbiAgICAgICAgICBsZXQgY2hhbmdlZCA9IGZhbHNlO1xuICAgICAgICAgIHJldHVybiBCbHVlYmlyZC5lYWNoKG1vZEtleXMsIG1vZEtleSA9PiB7XG4gICAgICAgICAgICBpZiAoKG1lcmdlZERhdGEuZGF0YVttb2RLZXldICE9PSB1bmRlZmluZWQpXG4gICAgICAgICAgICAgICYmIChtb2REYXRhLmRhdGFbbW9kS2V5XSAhPT0gdW5kZWZpbmVkKVxuICAgICAgICAgICAgICAmJiAobWVyZ2VkRGF0YS5kYXRhW21vZEtleV0gIT09IG1vZERhdGEuZGF0YVttb2RLZXldKSkge1xuICAgICAgICAgICAgICAgIG1vZERhdGEuZGF0YVttb2RLZXldID0gbWVyZ2VkRGF0YS5kYXRhW21vZEtleV07XG4gICAgICAgICAgICAgICAgY2hhbmdlZCA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSkudGhlbihhc3luYyAoKSA9PiB7XG4gICAgICAgICAgICBsZXQgbmV3TW9kRGF0YTtcbiAgICAgICAgICAgIGlmIChjaGFuZ2VkKSB7XG4gICAgICAgICAgICAgIGF3YWl0IHBhcnNlci53cml0ZShpdGVyLmZpbGVwYXRoLCBtb2REYXRhKTtcbiAgICAgICAgICAgICAgbmV3TW9kRGF0YSA9IGF3YWl0IHJlYWRNb2REYXRhKGl0ZXIuZmlsZXBhdGgpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgbmV3TW9kRGF0YSA9IGl0ZXIuZGF0YTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKG5ld01vZERhdGEgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICBhY2N1bS5wdXNoKHsgaWQ6IGl0ZXIuaWQsIGZpbGVwYXRoOiBpdGVyLmZpbGVwYXRoLCBkYXRhOiBuZXdNb2REYXRhIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShhY2N1bSk7XG4gIH0sIFtdKTtcblxuICByZXR1cm4gZnMud3JpdGVGaWxlQXN5bmMocGF0aC5qb2luKGRlc3RpbmF0aW9uRm9sZGVyLCBDQUNIRV9GSUxFTkFNRSksIEpTT04uc3RyaW5naWZ5KG5ld0NhY2hlKSk7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIHRvSW5pRmlsZU9iamVjdChkYXRhLCB0ZW1wRGVzdCkge1xuICAvLyBHaXZlbiB0aGF0IHdpbmFwaSByZXF1aXJlcyBhIGZpbGUgdG8gY29ycmVjdGx5IHJlYWQvcGFyc2VcbiAgLy8gIGFuIEluaUZpbGUgb2JqZWN0LCB3ZSdyZSBnb2luZyB0byB1c2UgdGhpcyBoYWNreSBkaXNndXN0aW5nXG4gIC8vICBmdW5jdGlvbiB0byBxdWlja2x5IGNyZWF0ZSBhIHRlbXAgZmlsZSwgcmVhZCBpdCwgZGVzdHJveSBpdFxuICAvLyAgYW5kIHJldHVybiB0aGUgb2JqZWN0IGJhY2sgdG8gdGhlIGNhbGxlci5cbiAgdHJ5IHtcbiAgICBhd2FpdCBmcy53cml0ZUZpbGVBc3luYyh0ZW1wRGVzdCwgZGF0YSwgeyBlbmNvZGluZzogJ3V0ZjgnIH0pO1xuICAgIGNvbnN0IHBhcnNlciA9IG5ldyBJbmlQYXJzZXIuZGVmYXVsdChuZXcgSW5pUGFyc2VyLldpbmFwaUZvcm1hdCgpKTtcbiAgICBjb25zdCBpbmlEYXRhID0gYXdhaXQgcGFyc2VyLnJlYWQodGVtcERlc3QpO1xuICAgIGF3YWl0IGZzLnJlbW92ZUFzeW5jKHRlbXBEZXN0KTtcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKGluaURhdGEpO1xuICB9IGNhdGNoIChlcnIpIHtcbiAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoZXJyKTtcbiAgfVxufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gb25EaWREZXBsb3koYXBpLCBkZXBsb3ltZW50LCBhY3RpdmVQcm9maWxlKSB7XG4gIC8vIGlmICghaXNTZXR0aW5nc01lcmdlU3VwcHJlc3NlZChhcGkpKSB7XG4gIC8vICAgcmV0dXJuO1xuICAvLyB9XG4gIGNvbnN0IHN0YXRlID0gYXBpLnN0b3JlLmdldFN0YXRlKCk7XG4gIGNvbnN0IGxvYWRPcmRlciA9IGdldFBlcnNpc3RlbnRMb2FkT3JkZXIoYXBpKTtcbiAgY29uc3QgZG9jRmlsZXMgPSBkZXBsb3ltZW50Wyd3aXRjaGVyM21lbnVtb2Ryb290J10uZmlsdGVyKGZpbGUgPT4gKGZpbGUucmVsUGF0aC5lbmRzV2l0aChQQVJUX1NVRkZJWCkpXG4gICAgJiYgKGZpbGUucmVsUGF0aC5pbmRleE9mKElOUFVUX1hNTF9GSUxFTkFNRSkgPT09IC0xKSk7XG5cbiAgaWYgKGRvY0ZpbGVzLmxlbmd0aCA8PSAwKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgY29uc3QgbW9kcyA9IHV0aWwuZ2V0U2FmZShzdGF0ZSwgWydwZXJzaXN0ZW50JywgJ21vZHMnLCBHQU1FX0lEXSwge30pO1xuICBjb25zdCBtb2RTdGF0ZSA9IHV0aWwuZ2V0U2FmZShhY3RpdmVQcm9maWxlLCBbJ21vZFN0YXRlJ10sIHt9KTtcbiAgbGV0IG5leHRBdmFpbGFibGVJZCA9IGxvYWRPcmRlci5sZW5ndGg7XG4gIGNvbnN0IGdldE5leHRJZCA9ICgpID0+IHtcbiAgICByZXR1cm4gbmV4dEF2YWlsYWJsZUlkKys7XG4gIH1cbiAgY29uc3QgaW52YWxpZE1vZFR5cGVzID0gWyd3aXRjaGVyM21lbnVtb2Rkb2N1bWVudHMnXTtcbiAgY29uc3QgZW5hYmxlZE1vZHMgPSBPYmplY3Qua2V5cyhtb2RzKVxuICAgIC5maWx0ZXIoa2V5ID0+ICEhbW9kU3RhdGVba2V5XT8uZW5hYmxlZCAmJiAhaW52YWxpZE1vZFR5cGVzLmluY2x1ZGVzKG1vZHNba2V5XS50eXBlKSlcbiAgICAuc29ydCgobGhzLCByaHMpID0+IChsb2FkT3JkZXJbcmhzXT8ucG9zIHx8IGdldE5leHRJZCgpKSAtIChsb2FkT3JkZXJbbGhzXT8ucG9zIHx8IGdldE5leHRJZCgpKSlcblxuICBjb25zdCBjdXJyZW50Q2FjaGUgPSBhd2FpdCBnZXRFeGlzdGluZ0NhY2hlKHN0YXRlLCBhY3RpdmVQcm9maWxlKTtcbiAgY29uc3QgaW5DYWNoZSA9IG5ldyBTZXQoY3VycmVudENhY2hlLm1hcChlbnRyeSA9PiBlbnRyeS5pZCkpO1xuICBjb25zdCBub3RJbkNhY2hlOiBTZXQ8c3RyaW5nPiA9IG5ldyBTZXQoZG9jRmlsZXMubWFwKGZpbGUgPT4gZmlsZS5zb3VyY2UpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLmZpbHRlcihtb2RJZCA9PiAhaW5DYWNoZS5oYXMobW9kSWQpKSk7XG4gIHJldHVybiBlbnN1cmVNZW51TW9kKGFwaSwgYWN0aXZlUHJvZmlsZSlcbiAgICAudGhlbigoKSA9PiAoKGN1cnJlbnRDYWNoZS5sZW5ndGggPT09IDApICYmIChlbmFibGVkTW9kcy5sZW5ndGggPiAwKSlcbiAgICAgID8gcG9wdWxhdGVDYWNoZShhcGksIGFjdGl2ZVByb2ZpbGUpXG4gICAgICA6IChub3RJbkNhY2hlLnNpemUgIT09IDApXG4gICAgICAgID8gcG9wdWxhdGVDYWNoZShhcGksIGFjdGl2ZVByb2ZpbGUsIEFycmF5LmZyb20obm90SW5DYWNoZSksIGN1cnJlbnRDYWNoZSlcbiAgICAgICAgOiBQcm9taXNlLnJlc29sdmUoKSlcbiAgICAudGhlbigoKSA9PiB3cml0ZUNhY2hlVG9GaWxlcyhhcGksIGFjdGl2ZVByb2ZpbGUpKVxuICAgIC50aGVuKCgpID0+IG1lbnVNb2QoYWN0aXZlUHJvZmlsZS5uYW1lKSlcbiAgICAuY2F0Y2goZXJyID0+IChlcnIgaW5zdGFuY2VvZiB1dGlsLlVzZXJDYW5jZWxlZClcbiAgICAgID8gUHJvbWlzZS5yZXNvbHZlKClcbiAgICAgIDogUHJvbWlzZS5yZWplY3QoZXJyKSk7XG59XG5cbmZ1bmN0aW9uIHNhbml0aXplUHJvZmlsZU5hbWUoaW5wdXQpIHtcbiAgcmV0dXJuIGlucHV0LnJlcGxhY2UoSU5WQUxJRF9DSEFSUywgJ18nKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIG1lbnVNb2QocHJvZmlsZU5hbWUpIHtcbiAgcmV0dXJuIGBXaXRjaGVyIDMgTWVudSBNb2QgRGF0YSAoJHtzYW5pdGl6ZVByb2ZpbGVOYW1lKHByb2ZpbGVOYW1lKX0pYDtcbn1cblxuYXN5bmMgZnVuY3Rpb24gY3JlYXRlTWVudU1vZChhcGksIG1vZE5hbWUsIHByb2ZpbGUpIHtcbiAgY29uc3QgbW9kID0ge1xuICAgIGlkOiBtb2ROYW1lLFxuICAgIHN0YXRlOiAnaW5zdGFsbGVkJyxcbiAgICBhdHRyaWJ1dGVzOiB7XG4gICAgICBuYW1lOiAnV2l0Y2hlciAzIE1lbnUgTW9kJyxcbiAgICAgIGRlc2NyaXB0aW9uOiAnVGhpcyBtb2QgaXMgYSBjb2xsZWN0aXZlIG1lcmdlIG9mIHNldHRpbmcgZmlsZXMgcmVxdWlyZWQgYnkgYW55L2FsbCAnXG4gICAgICAgICAgICAgICAgICsgJ21lbnUgbW9kcyB0aGUgdXNlciBoYXMgaW5zdGFsbGVkIC0gcGxlYXNlIGRvIG5vdCBkaXNhYmxlL3JlbW92ZSB1bmxlc3MgJ1xuICAgICAgICAgICAgICAgICArICdhbGwgbWVudSBtb2RzIGhhdmUgYmVlbiByZW1vdmVkIGZyb20geW91ciBnYW1lIGZpcnN0LicsXG4gICAgICBsb2dpY2FsRmlsZU5hbWU6ICdXaXRjaGVyIDMgTWVudSBNb2QnLFxuICAgICAgbW9kSWQ6IDQyLCAvLyBNZWFuaW5nIG9mIGxpZmVcbiAgICAgIHZlcnNpb246ICcxLjAuMCcsXG4gICAgICB2YXJpYW50OiBzYW5pdGl6ZVByb2ZpbGVOYW1lKHByb2ZpbGUubmFtZS5yZXBsYWNlKElOVkFMSURfQ0hBUlMsICdfJykpLFxuICAgICAgaW5zdGFsbFRpbWU6IG5ldyBEYXRlKCksXG4gICAgfSxcbiAgICBpbnN0YWxsYXRpb25QYXRoOiBtb2ROYW1lLFxuICAgIHR5cGU6ICd3aXRjaGVyM21lbnVtb2Rkb2N1bWVudHMnLFxuICB9O1xuXG4gIHJldHVybiBhd2FpdCBuZXcgUHJvbWlzZTx2b2lkPigocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgYXBpLmV2ZW50cy5lbWl0KCdjcmVhdGUtbW9kJywgcHJvZmlsZS5nYW1lSWQsIG1vZCwgYXN5bmMgKGVycm9yKSA9PiB7XG4gICAgICBpZiAoZXJyb3IgIT09IG51bGwpIHtcbiAgICAgICAgcmV0dXJuIHJlamVjdChlcnJvcik7XG4gICAgICB9XG4gICAgICByZXNvbHZlKCk7XG4gICAgfSk7XG4gIH0pO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcmVtb3ZlTWVudU1vZChhcGksIHByb2ZpbGUpIHtcbiAgLy8gaWYgKCFpc1NldHRpbmdzTWVyZ2VTdXBwcmVzc2VkKGFwaSkpIHtcbiAgLy8gICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG4gIC8vIH1cbiAgY29uc3Qgc3RhdGUgPSBhcGkuc3RvcmUuZ2V0U3RhdGUoKTtcbiAgY29uc3QgbW9kTmFtZSA9IG1lbnVNb2QocHJvZmlsZS5uYW1lKTtcbiAgY29uc3QgbW9kID0gdXRpbC5nZXRTYWZlKHN0YXRlLCBbJ3BlcnNpc3RlbnQnLCAnbW9kcycsIHByb2ZpbGUuZ2FtZUlkLCBtb2ROYW1lXSwgdW5kZWZpbmVkKTtcbiAgaWYgKG1vZCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xuICB9XG4gIHJldHVybiBuZXcgUHJvbWlzZTx2b2lkPigocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgYXBpLmV2ZW50cy5lbWl0KCdyZW1vdmUtbW9kJywgcHJvZmlsZS5nYW1lSWQsIG1vZC5pZCwgYXN5bmMgKGVycm9yKSA9PiB7XG4gICAgICBpZiAoZXJyb3IgIT09IG51bGwpIHtcbiAgICAgICAgLy8gVGhlIGZhY3QgdGhhdCB3ZSdyZSBhdHRlbXB0aW5nIHRvIHJlbW92ZSB0aGUgYWdncmVnYXRlZCBtZW51IG1vZCBtZWFucyB0aGF0XG4gICAgICAgIC8vICB0aGUgdXNlciBubyBsb25nZXIgaGFzIGFueSBtZW51IG1vZHMgaW5zdGFsbGVkIGFuZCB0aGVyZWZvcmUgaXQncyBzYWZlIHRvXG4gICAgICAgIC8vICBpZ25vcmUgYW55IGVycm9ycyB0aGF0IG1heSBoYXZlIGJlZW4gcmFpc2VkIGR1cmluZyByZW1vdmFsLlxuICAgICAgICAvLyBUaGUgbWFpbiBwcm9ibGVtIGhlcmUgaXMgdGhlIGZhY3QgdGhhdCB1c2VycyBhcmUgYWN0aXZlbHkgbWVzc2luZyB3aXRoXG4gICAgICAgIC8vICB0aGUgbWVudSBtb2Qgd2UgZ2VuZXJhdGUgY2F1c2luZyBvZGQgZXJyb3JzIHRvIHBvcCB1cC5cbiAgICAgICAgbG9nKCdlcnJvcicsICdmYWlsZWQgdG8gcmVtb3ZlIG1lbnUgbW9kJywgZXJyb3IpO1xuICAgICAgICAvLyByZXR1cm4gcmVqZWN0KGVycm9yKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiByZXNvbHZlKCk7XG4gICAgfSk7XG4gIH0pO1xufVxuXG5hc3luYyBmdW5jdGlvbiBjYWNoZVRvRmlsZU1hcChzdGF0ZSwgcHJvZmlsZSkge1xuICAvLyBPcmdhbml6ZXMgY2FjaGUgZW50cmllcyBpbnRvIGEgZmlsZU1hcCB3aGljaFxuICAvLyAgY2FuIGJlIHVzZWQgdG8gbG9vcCB0aHJvdWdoIGVhY2ggbW9kIGVudHJ5J3NcbiAgLy8gIGRhdGEgb24gYSBwZXIgZmlsZSBiYXNpcy5cbiAgY29uc3QgY3VycmVudENhY2hlID0gYXdhaXQgZ2V0RXhpc3RpbmdDYWNoZShzdGF0ZSwgcHJvZmlsZSk7XG4gIGlmIChjdXJyZW50Q2FjaGUubGVuZ3RoID09PSAwKSB7XG4gICAgLy8gTm90aGluZyB0byBkbyBoZXJlLlxuICAgIHJldHVybiB1bmRlZmluZWQ7XG4gIH1cblxuICBjb25zdCBzdGFnaW5nRm9sZGVyID0gc2VsZWN0b3JzLmluc3RhbGxQYXRoRm9yR2FtZShzdGF0ZSwgR0FNRV9JRCk7XG4gIGNvbnN0IGZpbGVNYXAgPSBjdXJyZW50Q2FjaGUucmVkdWNlKChhY2N1bSwgZW50cnkpID0+IHtcbiAgICBhY2N1bVt0b0ZpbGVNYXBLZXkoZW50cnkuZmlsZXBhdGgpXSA9XG4gICAgICBbXS5jb25jYXQoYWNjdW1bdG9GaWxlTWFwS2V5KGVudHJ5LmZpbGVwYXRoKV0gfHwgW10sXG4gICAgICBbe1xuICAgICAgICBpZDogZW50cnkuaWQsXG4gICAgICAgIGRhdGE6IGVudHJ5LmRhdGEsXG4gICAgICAgIGZpbGVwYXRoOiBjb252ZXJ0RmlsZVBhdGgoZW50cnkuZmlsZXBhdGgsIHN0YWdpbmdGb2xkZXIpLFxuICAgICAgfV0pO1xuXG4gICAgcmV0dXJuIGFjY3VtO1xuICB9LCB7fSk7XG5cbiAgcmV0dXJuIGZpbGVNYXA7XG59XG5cbmNvbnN0IGNvcHlJbmlGaWxlID0gKHNvdXJjZTogc3RyaW5nLCBkZXN0OiBzdHJpbmcpID0+IGZzLmNvcHlBc3luYyhzb3VyY2UsIGRlc3QpXG4gICAgLnRoZW4oKCkgPT4gUHJvbWlzZS5yZXNvbHZlKGRlc3QpKS5jYXRjaChlcnIgPT4gUHJvbWlzZS5yZXNvbHZlKHVuZGVmaW5lZCkpO1xuXG5jb25zdCBnZXRJbml0aWFsRG9jID0gKGZpbGVQYXRoOiBzdHJpbmcpID0+IHtcbiAgcmV0dXJuIGZzLnN0YXRBc3luYyhmaWxlUGF0aCArIEJBQ0tVUF9UQUcpXG4gICAgLnRoZW4oKCkgPT4gUHJvbWlzZS5yZXNvbHZlKGZpbGVQYXRoICsgQkFDS1VQX1RBRykpXG4gICAgLmNhdGNoKGVyciA9PiBmcy5zdGF0QXN5bmMoZmlsZVBhdGgpXG4gICAgICAudGhlbigoKSA9PiBQcm9taXNlLnJlc29sdmUoZmlsZVBhdGgpKSlcbiAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgIC8vIFdlIGNvdWxkbid0IGZpbmQgdGhlIG9yaWdpbmFsIGRvY3VtZW50LiBUaGlzXG4gICAgICAvLyAgY2FuIHBvdGVudGlhbGx5IGhhcHBlbiB3aGVuIHRoZSAucGFydC50eHQgc3VmZml4XG4gICAgICAvLyAgZ2V0cyBhZGRlZCB0byBmaWxlcyB0aGF0IGFyZSBub3Qgc3VwcG9zZWQgdG8gYmVcbiAgICAgIC8vICBkZXBsb3llZCB0byB0aGUgZG9jdW1lbnRzIGZvbGRlciwgbG9nIGFuZCBjb250aW51ZS5cbiAgICAgIGxvZygnd2FybicsICdXMzogY2Fubm90IGZpbmQgb3JpZ2luYWwgZmlsZScsIGVyci5tZXNzYWdlKTtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUodW5kZWZpbmVkKTtcbiAgICB9KTtcbn07XG5cbmFzeW5jIGZ1bmN0aW9uIHdyaXRlQ2FjaGVUb0ZpbGVzKGFwaSwgcHJvZmlsZSkge1xuICBjb25zdCBzdGF0ZSA9IGFwaS5zdG9yZS5nZXRTdGF0ZSgpO1xuICBjb25zdCBtb2ROYW1lID0gbWVudU1vZChwcm9maWxlLm5hbWUpO1xuICBjb25zdCBpbnN0YWxsUGF0aCA9IHNlbGVjdG9ycy5pbnN0YWxsUGF0aEZvckdhbWUoc3RhdGUsIHByb2ZpbGUuZ2FtZUlkKTtcbiAgY29uc3QgZGVzdGluYXRpb25Gb2xkZXIgPSBwYXRoLmpvaW4oaW5zdGFsbFBhdGgsIG1vZE5hbWUpO1xuICBjb25zdCBnYW1lID0gdXRpbC5nZXRHYW1lKHByb2ZpbGUuZ2FtZUlkKTtcbiAgY29uc3QgZGlzY292ZXJ5ID0gc2VsZWN0b3JzLmRpc2NvdmVyeUJ5R2FtZShzdGF0ZSwgcHJvZmlsZS5nYW1lSWQpO1xuICBjb25zdCBtb2RQYXRocyA9IGdhbWUuZ2V0TW9kUGF0aHMoZGlzY292ZXJ5LnBhdGgpO1xuICBjb25zdCBkb2NNb2RQYXRoID0gbW9kUGF0aHNbJ3dpdGNoZXIzbWVudW1vZGRvY3VtZW50cyddO1xuICBjb25zdCBjdXJyZW50Q2FjaGUgPSBhd2FpdCBnZXRFeGlzdGluZ0NhY2hlKHN0YXRlLCBwcm9maWxlKTtcbiAgaWYgKGN1cnJlbnRDYWNoZS5sZW5ndGggPT09IDApIHJldHVybjtcblxuICBjb25zdCBmaWxlTWFwID0gYXdhaXQgY2FjaGVUb0ZpbGVNYXAoc3RhdGUsIHByb2ZpbGUpO1xuICBpZiAoIWZpbGVNYXApIHJldHVybjtcblxuICBjb25zdCBwYXJzZXIgPSBuZXcgSW5pUGFyc2VyLmRlZmF1bHQobmV3IEluaVBhcnNlci5XaW5hcGlGb3JtYXQoKSk7XG4gIGNvbnN0IGtleXMgPSBPYmplY3Qua2V5cyhmaWxlTWFwKTtcblxuICBmb3IgKGNvbnN0IGtleSBvZiBrZXlzKSB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHNvdXJjZSA9IGF3YWl0IGdldEluaXRpYWxEb2MocGF0aC5qb2luKGRvY01vZFBhdGgsIGtleSkpO1xuICAgICAgaWYgKCFzb3VyY2UpIGNvbnRpbnVlO1xuXG4gICAgICBhd2FpdCBjb3B5SW5pRmlsZShzb3VyY2UsIHBhdGguam9pbihkZXN0aW5hdGlvbkZvbGRlciwga2V5KSk7XG4gICAgICBjb25zdCBpbml0aWFsRGF0YSA9IGF3YWl0IHBhcnNlci5yZWFkKHBhdGguam9pbihkZXN0aW5hdGlvbkZvbGRlciwga2V5KSk7XG5cbiAgICAgIGZvciAoY29uc3QgbW9kRW50cnkgb2YgZmlsZU1hcFtrZXldKSB7XG4gICAgICAgIGNvbnN0IHRlbXBGaWxlUGF0aCA9IHBhdGguam9pbihkZXN0aW5hdGlvbkZvbGRlciwga2V5KSArIGdlbmVyYXRlKCk7XG4gICAgICAgIGNvbnN0IG1vZERhdGEgPSBhd2FpdCB0b0luaUZpbGVPYmplY3QobW9kRW50cnkuZGF0YSwgdGVtcEZpbGVQYXRoKTtcblxuICAgICAgICBmb3IgKGNvbnN0IG1vZEtleSBvZiBPYmplY3Qua2V5cyhtb2REYXRhLmRhdGEpKSB7XG4gICAgICAgICAgaW5pdGlhbERhdGEuZGF0YVttb2RLZXldID0ge1xuICAgICAgICAgICAgLi4uaW5pdGlhbERhdGEuZGF0YVttb2RLZXldLFxuICAgICAgICAgICAgLi4ubW9kRGF0YS5kYXRhW21vZEtleV0sXG4gICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgYXdhaXQgcGFyc2VyLndyaXRlKHBhdGguam9pbihkZXN0aW5hdGlvbkZvbGRlciwga2V5KSwgaW5pdGlhbERhdGEpO1xuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgaWYgKGVyci5jb2RlID09PSAnRU5PRU5UJyAmJiBbXG4gICAgICAgIHBhdGguam9pbihkb2NNb2RQYXRoLCBJTlBVVF9TRVRUSU5HU19GSUxFTkFNRSksXG4gICAgICAgIHBhdGguam9pbihkb2NNb2RQYXRoLCBEWF8xMV9VU0VSX1NFVFRJTkdTX0ZJTEVOQU1FKSxcbiAgICAgICAgcGF0aC5qb2luKGRvY01vZFBhdGgsIERYXzEyX1VTRVJfU0VUVElOR1NfRklMRU5BTUUpLFxuICAgICAgXS5pbmNsdWRlcyhlcnIucGF0aCkpIHtcbiAgICAgICAgYXBpLnNob3dFcnJvck5vdGlmaWNhdGlvbignRmFpbGVkIHRvIGluc3RhbGwgbWVudSBtb2QnLCBuZXcgdXRpbC5EYXRhSW52YWxpZCgnUmVxdWlyZWQgc2V0dGluZyBmaWxlcyBhcmUgbWlzc2luZyAtIHBsZWFzZSBydW4gdGhlIGdhbWUgYXQgbGVhc3Qgb25jZSBhbmQgdHJ5IGFnYWluLicpLCB7IGFsbG93UmVwb3J0OiBmYWxzZSB9KTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgdGhyb3cgZXJyO1xuICAgIH1cbiAgfVxufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZW5zdXJlTWVudU1vZChhcGksIHByb2ZpbGUpIHtcbiAgLy8gaWYgKCFpc1NldHRpbmdzTWVyZ2VTdXBwcmVzc2VkKGFwaSkpIHtcbiAgLy8gICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHVuZGVmaW5lZCk7XG4gIC8vIH1cbiAgY29uc3Qgc3RhdGUgPSBhcGkuc3RvcmUuZ2V0U3RhdGUoKTtcbiAgY29uc3QgbW9kTmFtZSA9IG1lbnVNb2QocHJvZmlsZS5uYW1lKTtcbiAgY29uc3QgbW9kID0gdXRpbC5nZXRTYWZlKHN0YXRlLCBbJ3BlcnNpc3RlbnQnLCAnbW9kcycsIHByb2ZpbGUuZ2FtZUlkLCBtb2ROYW1lXSwgdW5kZWZpbmVkKTtcbiAgaWYgKG1vZCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgdHJ5IHtcbiAgICAgIGF3YWl0IGNyZWF0ZU1lbnVNb2QoYXBpLCBtb2ROYW1lLCBwcm9maWxlKTtcbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChlcnIpO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICAvLyBnaXZlIHRoZSB1c2VyIGFuIGluZGljYXRpb24gd2hlbiB0aGlzIHdhcyBsYXN0IHVwZGF0ZWRcbiAgICBhcGkuc3RvcmUuZGlzcGF0Y2goYWN0aW9ucy5zZXRNb2RBdHRyaWJ1dGUocHJvZmlsZS5nYW1lSWQsIG1vZE5hbWUsICdpbnN0YWxsVGltZScsIG5ldyBEYXRlKCkpKTtcbiAgICAvLyB0aGUgcmVzdCBoZXJlIGlzIG9ubHkgcmVxdWlyZWQgdG8gdXBkYXRlIG1vZHMgZnJvbSBwcmV2aW91cyB2b3J0ZXggdmVyc2lvbnNcbiAgICBhcGkuc3RvcmUuZGlzcGF0Y2goYWN0aW9ucy5zZXRNb2RBdHRyaWJ1dGUocHJvZmlsZS5nYW1lSWQsIG1vZE5hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICduYW1lJywgJ1dpdGNoZXIgMyBNZW51IE1vZCcpKTtcblxuICAgIGFwaS5zdG9yZS5kaXNwYXRjaChhY3Rpb25zLnNldE1vZEF0dHJpYnV0ZShwcm9maWxlLmdhbWVJZCwgbW9kTmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ3R5cGUnLCAnd2l0Y2hlcjNtZW51bW9kZG9jdW1lbnRzJykpO1xuXG4gICAgYXBpLnN0b3JlLmRpc3BhdGNoKGFjdGlvbnMuc2V0TW9kQXR0cmlidXRlKHByb2ZpbGUuZ2FtZUlkLCBtb2ROYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnbG9naWNhbEZpbGVOYW1lJywgJ1dpdGNoZXIgMyBNZW51IE1vZCcpKTtcbiAgICBhcGkuc3RvcmUuZGlzcGF0Y2goYWN0aW9ucy5zZXRNb2RBdHRyaWJ1dGUocHJvZmlsZS5nYW1lSWQsIG1vZE5hbWUsICdtb2RJZCcsIDQyKSk7XG4gICAgYXBpLnN0b3JlLmRpc3BhdGNoKGFjdGlvbnMuc2V0TW9kQXR0cmlidXRlKHByb2ZpbGUuZ2FtZUlkLCBtb2ROYW1lLCAndmVyc2lvbicsICcxLjAuMCcpKTtcbiAgICBhcGkuc3RvcmUuZGlzcGF0Y2goYWN0aW9ucy5zZXRNb2RBdHRyaWJ1dGUocHJvZmlsZS5nYW1lSWQsIG1vZE5hbWUsICd2YXJpYW50JyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2FuaXRpemVQcm9maWxlTmFtZShwcm9maWxlLm5hbWUpKSk7XG4gIH1cbiAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShtb2ROYW1lKTtcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGV4cG9ydE1lbnVNb2QoYXBpLCBwcm9maWxlLCBpbmNsdWRlZE1vZHMpIHtcbiAgLy8gaWYgKCFpc1NldHRpbmdzTWVyZ2VTdXBwcmVzc2VkKGFwaSkpIHtcbiAgLy8gICByZXR1cm4gdW5kZWZpbmVkO1xuICAvLyB9XG4gIHRyeSB7XG4gICAgY29uc3QgZGVwbG95bWVudCA9IGF3YWl0IGdldERlcGxveW1lbnQoYXBpLCBpbmNsdWRlZE1vZHMpO1xuICAgIGlmIChkZXBsb3ltZW50ID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignRmFpbGVkIHRvIGdldCBkZXBsb3ltZW50Jyk7XG4gICAgfVxuICAgIGNvbnN0IG1vZE5hbWUgPSBhd2FpdCBvbkRpZERlcGxveShhcGksIGRlcGxveW1lbnQsIHByb2ZpbGUpO1xuICAgIGlmIChtb2ROYW1lID09PSB1bmRlZmluZWQpIHtcbiAgICAgIC8vIFRoZSBpbnN0YWxsZWQgbW9kcyBkbyBub3QgcmVxdWlyZSBhIG1lbnUgbW9kLlxuICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9XG4gICAgY29uc3QgbW9kcyA9IHV0aWwuZ2V0U2FmZShhcGkuZ2V0U3RhdGUoKSwgWydwZXJzaXN0ZW50JywgJ21vZHMnLCBHQU1FX0lEXSwge30pO1xuICAgIGNvbnN0IG1vZElkID0gT2JqZWN0LmtleXMobW9kcykuZmluZChpZCA9PiBpZCA9PT0gbW9kTmFtZSk7XG4gICAgaWYgKG1vZElkID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignTWVudSBtb2QgaXMgbWlzc2luZycpO1xuICAgIH1cbiAgICBjb25zdCBpbnN0YWxsUGF0aCA9IHNlbGVjdG9ycy5pbnN0YWxsUGF0aEZvckdhbWUoYXBpLmdldFN0YXRlKCksIEdBTUVfSUQpO1xuICAgIGNvbnN0IG1vZFBhdGggPSBwYXRoLmpvaW4oaW5zdGFsbFBhdGgsIG1vZHNbbW9kSWRdLmluc3RhbGxhdGlvblBhdGgpO1xuICAgIGNvbnN0IGRhdGEgPSBhd2FpdCBwcmVwYXJlRmlsZURhdGEobW9kUGF0aCk7XG4gICAgcmV0dXJuIGRhdGE7XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIHJldHVybiBQcm9taXNlLnJlamVjdChlcnIpO1xuICB9XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBpbXBvcnRNZW51TW9kKGFwaSwgcHJvZmlsZSwgZmlsZURhdGEpIHtcbiAgLy8gaWYgKCFpc1NldHRpbmdzTWVyZ2VTdXBwcmVzc2VkKGFwaSkpIHtcbiAgLy8gICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHVuZGVmaW5lZCk7XG4gIC8vIH1cbiAgdHJ5IHtcbiAgICBjb25zdCBtb2ROYW1lID0gYXdhaXQgZW5zdXJlTWVudU1vZChhcGksIHByb2ZpbGUpO1xuICAgIGNvbnN0IG1vZCA9IHV0aWwuZ2V0U2FmZShhcGkuZ2V0U3RhdGUoKSwgWydwZXJzaXN0ZW50JywgJ21vZHMnLCBwcm9maWxlLmdhbWVJZCwgbW9kTmFtZV0sIHVuZGVmaW5lZCk7XG4gICAgY29uc3QgaW5zdGFsbFBhdGggPSBzZWxlY3RvcnMuaW5zdGFsbFBhdGhGb3JHYW1lKGFwaS5nZXRTdGF0ZSgpLCBHQU1FX0lEKTtcbiAgICBjb25zdCBkZXN0UGF0aCA9IHBhdGguam9pbihpbnN0YWxsUGF0aCwgbW9kLmluc3RhbGxhdGlvblBhdGgpO1xuICAgIGF3YWl0IHJlc3RvcmVGaWxlRGF0YShmaWxlRGF0YSwgZGVzdFBhdGgpO1xuICB9IGNhdGNoIChlcnIpIHtcbiAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoZXJyKTtcbiAgfVxufVxuIl19