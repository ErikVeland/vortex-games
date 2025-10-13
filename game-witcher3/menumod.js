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
exports.onWillDeploy = onWillDeploy;
exports.onDidDeploy = onDidDeploy;
exports.menuMod = menuMod;
exports.removeMenuMod = removeMenuMod;
exports.ensureMenuMod = ensureMenuMod;
exports.exportMenuMod = exportMenuMod;
exports.importMenuMod = importMenuMod;
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
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
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
function sanitizeProfileName(input) {
    return input.replace(INVALID_CHARS, '_');
}
function menuMod(profileName) {
    return `Witcher 3 Menu Mod Data (${sanitizeProfileName(profileName)})`;
}
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWVudW1vZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIm1lbnVtb2QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7QUE0S0Esb0NBaUZDO0FBa0JELGtDQXVDQztBQU1ELDBCQUVDO0FBK0JELHNDQXdCQztBQWtHRCxzQ0ErQkM7QUFFRCxzQ0EwQkM7QUFFRCxzQ0FhQztBQWhpQkQsZ0RBQXdCO0FBQ3hCLHdEQUFnQztBQUNoQywyQ0FBc0U7QUFDdEUsTUFBTSxTQUFTLEdBQUcsT0FBTyxDQUFDLGtCQUFrQixDQUFDLENBQUM7QUFDOUMscUNBQW1DO0FBRW5DLDZDQUFzRDtBQUN0RCw2Q0FBc0U7QUFDdEUsaUNBQXVDO0FBQ3ZDLHFDQUFvRTtBQUdwRSxNQUFNLGFBQWEsR0FBRyxlQUFlLENBQUM7QUFDdEMsTUFBTSx1QkFBdUIsR0FBRyxnQkFBZ0IsQ0FBQztBQUNqRCxNQUFNLDRCQUE0QixHQUFHLGVBQWUsQ0FBQztBQUNyRCxNQUFNLDRCQUE0QixHQUFHLG1CQUFtQixDQUFDO0FBQ3pELE1BQU0sVUFBVSxHQUFHLGdCQUFnQixDQUFDO0FBY3BDLE1BQU0sY0FBYyxHQUFHLHNCQUFzQixDQUFBO0FBZTdDLFNBQWUsZ0JBQWdCLENBQUMsS0FBSyxFQUFFLGFBQWE7O1FBQ2xELE1BQU0sYUFBYSxHQUFHLHNCQUFTLENBQUMsa0JBQWtCLENBQUMsS0FBSyxFQUFFLGdCQUFPLENBQUMsQ0FBQztRQUNuRSxNQUFNLE9BQU8sR0FBRyxPQUFPLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQzVDLE1BQU0sR0FBRyxHQUFHLGlCQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxDQUFDLFlBQVksRUFBRSxNQUFNLEVBQUUsZ0JBQU8sRUFBRSxPQUFPLENBQUMsRUFBRSxTQUFTLENBQUMsQ0FBQztRQUNyRixJQUFJLEdBQUcsS0FBSyxTQUFTLEVBQUUsQ0FBQztZQUN0QixPQUFPLEVBQUUsQ0FBQztRQUNaLENBQUM7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QU8sQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDN0IsQ0FBQztJQUNILENBQUM7Q0FBQTtBQUVELFNBQXNCLGFBQWEsQ0FBQyxHQUFHLEVBQUUsT0FBTyxFQUFFLFFBQVE7O1FBSXhELElBQUksQ0FBQztZQUNILE1BQU0sT0FBTyxHQUFHLE1BQU0sYUFBYSxDQUFDLEdBQUcsRUFBRSxPQUFPLENBQUMsQ0FBQztZQUNsRCxNQUFNLEdBQUcsR0FBRyxpQkFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsUUFBUSxFQUFFLEVBQUUsQ0FBQyxZQUFZLEVBQUUsTUFBTSxFQUFFLE9BQU8sQ0FBQyxNQUFNLEVBQUUsT0FBTyxDQUFDLEVBQUUsU0FBUyxDQUFDLENBQUM7WUFDckcsTUFBTSxXQUFXLEdBQUcsc0JBQVMsQ0FBQyxrQkFBa0IsQ0FBQyxHQUFHLENBQUMsUUFBUSxFQUFFLEVBQUUsZ0JBQU8sQ0FBQyxDQUFDO1lBQzFFLE1BQU0sUUFBUSxHQUFHLGNBQUksQ0FBQyxJQUFJLENBQUMsV0FBVyxFQUFFLEdBQUcsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO1lBQzlELE1BQU0sSUFBQSxzQkFBZSxFQUFDLFFBQVEsRUFBRSxRQUFRLENBQUMsQ0FBQztRQUM1QyxDQUFDO1FBQUMsT0FBTyxHQUFHLEVBQUUsQ0FBQztZQUNiLE9BQU8sT0FBTyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUM3QixDQUFDO0lBQ0gsQ0FBQztDQUFBIiwic291cmNlc0NvbnRlbnQiOlsiLyogZXNsaW50LWRpc2FibGUgKi9cbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0IEJsdWViaXJkIGZyb20gJ2JsdWViaXJkJztcbmltcG9ydCB7IGFjdGlvbnMsIGZzLCBsb2csIHNlbGVjdG9ycywgdHlwZXMsIHV0aWwgfSBmcm9tICd2b3J0ZXgtYXBpJztcbmNvbnN0IEluaVBhcnNlciA9IHJlcXVpcmUoJ3ZvcnRleC1wYXJzZS1pbmknKTtcbmltcG9ydCB7IGdlbmVyYXRlIH0gZnJvbSAnc2hvcnRpZCc7XG5cbmltcG9ydCB7IGdldFBlcnNpc3RlbnRMb2FkT3JkZXIgfSBmcm9tICcuL21pZ3JhdGlvbnMnO1xuaW1wb3J0IHsgcHJlcGFyZUZpbGVEYXRhLCByZXN0b3JlRmlsZURhdGEgfSBmcm9tICcuL2NvbGxlY3Rpb25zL3V0aWwnO1xuaW1wb3J0IHsgZ2V0RGVwbG95bWVudCB9IGZyb20gJy4vdXRpbCc7XG5pbXBvcnQgeyBHQU1FX0lELCBJTlBVVF9YTUxfRklMRU5BTUUsIFBBUlRfU1VGRklYIH0gZnJvbSAnLi9jb21tb24nO1xuXG4vLyBtb3N0IG9mIHRoZXNlIGFyZSBpbnZhbGlkIG9uIHdpbmRvd3Mgb25seSBidXQgaXQncyBub3Qgd29ydGggdGhlIGVmZm9ydCBhbGxvd2luZyB0aGVtIGVsc2V3aGVyZVxuY29uc3QgSU5WQUxJRF9DSEFSUyA9IC9bOi9cXFxcKj9cIjw+fF0vZztcbmNvbnN0IElOUFVUX1NFVFRJTkdTX0ZJTEVOQU1FID0gJ2lucHV0LnNldHRpbmdzJztcbmNvbnN0IERYXzExX1VTRVJfU0VUVElOR1NfRklMRU5BTUUgPSAndXNlci5zZXR0aW5ncyc7XG5jb25zdCBEWF8xMl9VU0VSX1NFVFRJTkdTX0ZJTEVOQU1FID0gJ2R4MTJ1c2VyLnNldHRpbmdzJztcbmNvbnN0IEJBQ0tVUF9UQUcgPSAnLnZvcnRleF9iYWNrdXAnO1xuXG5pbnRlcmZhY2UgSUNhY2hlRW50cnkge1xuICBpZDogc3RyaW5nO1xuICBmaWxlcGF0aDogc3RyaW5nO1xuICBkYXRhOiBzdHJpbmc7XG59XG5cbnR5cGUgSUZpbGVNYXAgPSB7IFtlbnRyeUlkOiBzdHJpbmddOiBJQ2FjaGVFbnRyeVtdIH07XG5cbi8vIFdlJ3JlIGdvaW5nIHRvIHNhdmUgcGVyIG1vZCBpbmkgc2V0dGluZ3MgZm9yIGVhY2hcbi8vICBmaWxlICh3aGVyZSBhcHBsaWNhYmxlKSBpbnRvIHRoaXMgY2FjaGUgZmlsZSBzb1xuLy8gIHdlIGNhbiBrZWVwIHRyYWNrIG9mIGNoYW5nZXMgdGhhdCB0aGUgdXNlciBtYWRlXG4vLyAgZHVyaW5nIGhpcyBwbGF5dGhyb3VnaC5cbmNvbnN0IENBQ0hFX0ZJTEVOQU1FID0gJ3ZvcnRleF9tZW51bW9kLmNhY2hlJ1xuLyogQ2FjaGUgZm9ybWF0IHNob3VsZCBiZSBhcyBmb2xsb3dzOlxuICBbXG4gICAge1xuICAgICAgaWQ6ICRtb2RJZFxuICAgICAgZmlsZXBhdGg6ICcuLi9pbnB1dC5zZXR0aW5ncycsXG4gICAgICBkYXRhOiAnaW5pIGRhdGEgaW4gc3RyaW5nIGZvcm1hdCcsXG4gICAgfSxcbiAgICB7XG4gICAgICBpZDogJG1vZElkXG4gICAgICBmaWxlbmFtZTogJy4uL3VzZXIuc2V0dGluZ3MnLFxuICAgICAgZGF0YTogJ2luaSBkYXRhIGluIHN0cmluZyBmb3JtYXQnLFxuICAgIH0sXG4gIF1cbiovXG5hc3luYyBmdW5jdGlvbiBnZXRFeGlzdGluZ0NhY2hlKHN0YXRlLCBhY3RpdmVQcm9maWxlKSB7XG4gIGNvbnN0IHN0YWdpbmdGb2xkZXIgPSBzZWxlY3RvcnMuaW5zdGFsbFBhdGhGb3JHYW1lKHN0YXRlLCBHQU1FX0lEKTtcbiAgY29uc3QgbW9kTmFtZSA9IG1lbnVNb2QoYWN0aXZlUHJvZmlsZS5uYW1lKTtcbiAgY29uc3QgbW9kID0gdXRpbC5nZXRTYWZlKHN0YXRlLCBbJ3BlcnNpc3RlbnQnLCAnbW9kcycsIEdBTUVfSUQsIG1vZE5hbWVdLCB1bmRlZmluZWQpO1xuICBpZiAobW9kID09PSB1bmRlZmluZWQpIHtcbiAgICByZXR1cm4gW107XG4gIH1cblxuICB0cnkge1xuICAgIGNvbnN0IGNhY2hlRGF0YSA9IGF3YWl0IGZzLnJlYWRGaWxlQXN5bmMocGF0aC5qb2luKHN0YWdpbmdGb2xkZXIsXG4gICAgICBtb2QuaW5zdGFsbGF0aW9uUGF0aCwgQ0FDSEVfRklMRU5BTUUpLCB7IGVuY29kaW5nOiAndXRmOCcgfSk7XG4gICAgY29uc3QgY3VycmVudENhY2hlID0gSlNPTi5wYXJzZShjYWNoZURhdGEpO1xuICAgIHJldHVybiBjdXJyZW50Q2FjaGU7XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIC8vIFdlIHdlcmUgdW5hYmxlIHRvIHJlYWQvcGFyc2UgdGhlIGNhY2hlIGZpbGUgLSB0aGlzIGlzIHBlcmZlY3RseVxuICAgIC8vICB2YWxpZCB3aGVuIHRoZSBjYWNoZSBmaWxlIGhhc24ndCBiZWVuIGNyZWF0ZWQgeWV0LCBhbmQgZXZlbiBpZi93aGVuXG4gICAgLy8gIHRoZSBlcnJvciBpcyBtb3JlIHNlcmlvdXMgLSB3ZSBzaG91bGRuJ3QgYmxvY2sgdGhlIGRlcGxveW1lbnQuXG4gICAgbG9nKCd3YXJuJywgJ1czOiBmYWlsZWQgdG8gcmVhZC9wYXJzZSBjYWNoZSBmaWxlJywgZXJyKTtcbiAgICByZXR1cm4gW107XG4gIH1cbn1cblxuZnVuY3Rpb24gdG9GaWxlTWFwS2V5KGZpbGVQYXRoKSB7XG4gIHJldHVybiBwYXRoLmJhc2VuYW1lKGZpbGVQYXRoKVxuICAgICAgICAgICAgIC50b0xvd2VyQ2FzZSgpXG4gICAgICAgICAgICAgLnJlcGxhY2UoUEFSVF9TVUZGSVgsICcnKTtcbn07XG5cbmZ1bmN0aW9uIHJlYWRNb2REYXRhKGZpbGVQYXRoKSB7XG4gIHJldHVybiBmcy5yZWFkRmlsZUFzeW5jKGZpbGVQYXRoLCB7IGVuY29kaW5nOiAndXRmOCcgfSlcbiAgICAuY2F0Y2goZXJyID0+IFByb21pc2UucmVzb2x2ZSh1bmRlZmluZWQpKTtcbn1cblxuZnVuY3Rpb24gcG9wdWxhdGVDYWNoZShhcGk6IHR5cGVzLklFeHRlbnNpb25BcGksIGFjdGl2ZVByb2ZpbGU6IHR5cGVzLklQcm9maWxlLCBtb2RJZHM/OiBzdHJpbmdbXSwgaW5pdGlhbENhY2hlVmFsdWU/OiBJQ2FjaGVFbnRyeVtdKSB7XG4gIGNvbnN0IHN0YXRlID0gYXBpLnN0b3JlLmdldFN0YXRlKCk7XG4gIGNvbnN0IGxvYWRPcmRlciA9IGdldFBlcnNpc3RlbnRMb2FkT3JkZXIoYXBpKTtcbiAgY29uc3QgbW9kcyA9IHV0aWwuZ2V0U2FmZShzdGF0ZSwgWydwZXJzaXN0ZW50JywgJ21vZHMnLCBHQU1FX0lEXSwge30pO1xuICBjb25zdCBtb2RTdGF0ZSA9IHV0aWwuZ2V0U2FmZShhY3RpdmVQcm9maWxlLCBbJ21vZFN0YXRlJ10sIHt9KTtcblxuICBsZXQgbmV4dEF2YWlsYWJsZUlkID0gT2JqZWN0LmtleXMobG9hZE9yZGVyKS5sZW5ndGg7XG4gIGNvbnN0IGdldE5leHRJZCA9ICgpID0+IHtcbiAgICByZXR1cm4gbmV4dEF2YWlsYWJsZUlkKys7XG4gIH1cbiAgY29uc3QgdG9JZHggPSAobG9JdGVtKSA9PiAobG9hZE9yZGVyLmluZGV4T2YobG9JdGVtKSB8fCBnZXROZXh0SWQoKSk7XG4gIGNvbnN0IGludmFsaWRNb2RUeXBlcyA9IFsnd2l0Y2hlcjNtZW51bW9kZG9jdW1lbnRzJ107XG4gIGNvbnN0IGFmZmVjdGVkTW9kSWRzID0gbW9kSWRzID09PSB1bmRlZmluZWQgPyBPYmplY3Qua2V5cyhtb2RzKSA6IG1vZElkcztcbiAgY29uc3QgZW5hYmxlZE1vZHMgPSBhZmZlY3RlZE1vZElkc1xuICAgIC5maWx0ZXIoa2V5ID0+IChtb2RzW2tleV0/Lmluc3RhbGxhdGlvblBhdGggIT09IHVuZGVmaW5lZClcbiAgICAgICAgICAgICAgICAmJiAhIW1vZFN0YXRlW2tleV0/LmVuYWJsZWQgJiZcbiAgICAgICAgICAgICAgICAhaW52YWxpZE1vZFR5cGVzLmluY2x1ZGVzKG1vZHNba2V5XS50eXBlKSlcbiAgICAuc29ydCgobGhzLCByaHMpID0+ICh0b0lkeChsaHMpKSAtICh0b0lkeChyaHMpKSlcbiAgICAubWFwKGtleSA9PiBtb2RzW2tleV0pO1xuXG4gIGNvbnN0IGdldFJlbGV2YW50TW9kRW50cmllcyA9IGFzeW5jIChzb3VyY2UpID0+IHtcbiAgICBsZXQgYWxsRW50cmllcyA9IFtdO1xuICAgIGF3YWl0IHJlcXVpcmUoJ3R1cmJvd2FsaycpLmRlZmF1bHQoc291cmNlLCBlbnRyaWVzID0+IHtcbiAgICAgIGNvbnN0IHJlbGV2YW50RW50cmllcyA9IGVudHJpZXMuZmlsdGVyKGVudHJ5ID0+XG4gICAgICAgICAgIChlbnRyeS5maWxlUGF0aC5lbmRzV2l0aChQQVJUX1NVRkZJWCkpXG4gICAgICAgICYmIChlbnRyeS5maWxlUGF0aC5pbmRleE9mKElOUFVUX1hNTF9GSUxFTkFNRSkgPT09IC0xKSlcbiAgICAgICAgICAgICAgLm1hcChlbnRyeSA9PiBlbnRyeS5maWxlUGF0aCk7XG5cbiAgICAgIGFsbEVudHJpZXMgPSBbXS5jb25jYXQoYWxsRW50cmllcywgcmVsZXZhbnRFbnRyaWVzKTtcbiAgICB9KS5jYXRjaChlcnIgPT4ge1xuICAgICAgaWYgIChbJ0VOT0VOVCcsICdFTk9URk9VTkQnXS5pbmRleE9mKGVyci5jb2RlKSA9PT0gLTEpIHtcbiAgICAgICAgbG9nKCdlcnJvcicsICdGYWlsZWQgdG8gbG9va3VwIG1lbnUgbW9kIGZpbGVzJyxcbiAgICAgICAgICB7IHBhdGg6IHNvdXJjZSwgZXJyb3I6IGVyci5tZXNzYWdlIH0pO1xuICAgICAgfVxuICAgIH0pXG5cbiAgICByZXR1cm4gYWxsRW50cmllcztcbiAgfTtcblxuICBjb25zdCBzdGFnaW5nRm9sZGVyID0gc2VsZWN0b3JzLmluc3RhbGxQYXRoRm9yR2FtZShzdGF0ZSwgR0FNRV9JRCk7XG4gIHJldHVybiBCbHVlYmlyZC5yZWR1Y2UoZW5hYmxlZE1vZHMsIChhY2N1bSwgbW9kOiB0eXBlcy5JTW9kKSA9PiB7XG4gICAgaWYgKG1vZC5pbnN0YWxsYXRpb25QYXRoID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHJldHVybiBhY2N1bTtcbiAgICB9XG4gICAgcmV0dXJuIGdldFJlbGV2YW50TW9kRW50cmllcyhwYXRoLmpvaW4oc3RhZ2luZ0ZvbGRlciwgbW9kLmluc3RhbGxhdGlvblBhdGgpKVxuICAgICAgLnRoZW4oZW50cmllcyA9PiB7XG4gICAgICAgIHJldHVybiBCbHVlYmlyZC5lYWNoKGVudHJpZXMsIGZpbGVwYXRoID0+IHtcbiAgICAgICAgICByZXR1cm4gcmVhZE1vZERhdGEoZmlsZXBhdGgpXG4gICAgICAgICAgICAudGhlbihkYXRhID0+IHtcbiAgICAgICAgICAgICAgaWYgKGRhdGEgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgIGFjY3VtLnB1c2goeyBpZDogbW9kLmlkLCBmaWxlcGF0aCwgZGF0YSB9KTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSlcbiAgICAgICAgfSlcbiAgICAgICAgLnRoZW4oKCkgPT4gUHJvbWlzZS5yZXNvbHZlKGFjY3VtKSlcbiAgICAgIH0pXG4gIH0sIGluaXRpYWxDYWNoZVZhbHVlICE9PSB1bmRlZmluZWQgPyBpbml0aWFsQ2FjaGVWYWx1ZSA6IFtdKVxuICAudGhlbihuZXdDYWNoZSA9PiB7XG4gICAgY29uc3QgbW9kTmFtZSA9IG1lbnVNb2QoYWN0aXZlUHJvZmlsZS5uYW1lKTtcbiAgICBsZXQgbW9kID0gdXRpbC5nZXRTYWZlKHN0YXRlLCBbJ3BlcnNpc3RlbnQnLCAnbW9kcycsIEdBTUVfSUQsIG1vZE5hbWVdLCB1bmRlZmluZWQpO1xuICAgIGlmIChtb2Q/Lmluc3RhbGxhdGlvblBhdGggPT09IHVuZGVmaW5lZCkge1xuICAgICAgbG9nKCd3YXJuJywgJ2ZhaWxlZCB0byBhc2NlcnRhaW4gaW5zdGFsbGF0aW9uIHBhdGgnLCBtb2ROYW1lKTtcbiAgICAgIC8vIFdlIHdpbGwgY3JlYXRlIGl0IG9uIHRoZSBuZXh0IHJ1bi5cbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcbiAgICB9XG5cbiAgICByZXR1cm4gZnMud3JpdGVGaWxlQXN5bmMocGF0aC5qb2luKHN0YWdpbmdGb2xkZXIsIG1vZC5pbnN0YWxsYXRpb25QYXRoLCBDQUNIRV9GSUxFTkFNRSksIEpTT04uc3RyaW5naWZ5KG5ld0NhY2hlKSk7XG4gIH0pO1xufVxuXG5mdW5jdGlvbiBjb252ZXJ0RmlsZVBhdGgoZmlsZVBhdGgsIGluc3RhbGxQYXRoKSB7IFxuICAvLyBQcmUtY29sbGVjdGlvbnMgd2Ugd291bGQgdXNlIGFic29sdXRlIHBhdGhzIHBvaW50aW5nXG4gIC8vICB0byB0aGUgbWVudSBtb2QgaW5wdXQgbW9kaWZpY2F0aW9uczsgdGhpcyB3aWxsIG9idmlvdXNseVxuICAvLyAgd29yayBqdXN0IGZpbmUgb24gdGhlIGN1cmF0b3IncyBlbmQsIGJ1dCByZWxwYXRocyBzaG91bGQgYmUgdXNlZFxuICAvLyAgb24gdGhlIHVzZXIncyBlbmQuIFRoaXMgZnVuY3RvciB3aWxsIGNvbnZlcnQgdGhlIGFicyBwYXRoIGZyb21cbiAgLy8gIHRoZSBjdXJhdG9yJ3MgcGF0aCB0byB0aGUgdXNlcidzIHBhdGguXG4gIGNvbnN0IHNlZ21lbnRzID0gZmlsZVBhdGguc3BsaXQocGF0aC5zZXApO1xuICBjb25zdCBpZHggPSBzZWdtZW50cy5yZWR1Y2UoKHByZXYsIHNlZywgaWR4KSA9PiB7XG4gICAgaWYgKHNlZy50b0xvd2VyQ2FzZSgpID09PSBHQU1FX0lEKSB7XG4gICAgICByZXR1cm4gaWR4O1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gcHJldjtcbiAgICB9XG4gIH0sIC0xKTtcbiAgaWYgKGlkeCA9PT0gLTEpIHtcbiAgICBsb2coJ2Vycm9yJywgJ3VuZXhwZWN0ZWQgbWVudSBtb2QgZmlsZXBhdGgnLCBmaWxlUGF0aCk7XG4gICAgcmV0dXJuIGZpbGVQYXRoO1xuICB9XG4gIC8vIFdlIHNsaWNlIG9mZiBldmVyeXRoaW5nIHVwIHRvIHRoZSBHQU1FX0lEIGFuZCB0aGUgJ21vZHMnIGZvbGRlci5cbiAgY29uc3QgcmVsUGF0aCA9IHNlZ21lbnRzLnNsaWNlKGlkeCArIDIpLmpvaW4ocGF0aC5zZXApO1xuICByZXR1cm4gcGF0aC5qb2luKGluc3RhbGxQYXRoLCByZWxQYXRoKTtcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIG9uV2lsbERlcGxveShhcGksIGRlcGxveW1lbnQsIGFjdGl2ZVByb2ZpbGUpIHtcbiAgLy8gaWYgKCFpc1NldHRpbmdzTWVyZ2VTdXBwcmVzc2VkKGFwaSkpIHtcbiAgLy8gICByZXR1cm47XG4gIC8vIH1cbiAgY29uc3Qgc3RhdGUgPSBhcGkuc3RvcmUuZ2V0U3RhdGUoKTtcbiAgaWYgKGFjdGl2ZVByb2ZpbGU/Lm5hbWUgPT09IHVuZGVmaW5lZCkge1xuICAgIHJldHVybjtcbiAgfVxuICBjb25zdCBpbnN0YWxsUGF0aCA9IHNlbGVjdG9ycy5pbnN0YWxsUGF0aEZvckdhbWUoc3RhdGUsIGFjdGl2ZVByb2ZpbGUuZ2FtZUlkKTtcbiAgY29uc3QgbW9kTmFtZSA9IG1lbnVNb2QoYWN0aXZlUHJvZmlsZS5uYW1lKTtcbiAgY29uc3QgZGVzdGluYXRpb25Gb2xkZXIgPSBwYXRoLmpvaW4oaW5zdGFsbFBhdGgsIG1vZE5hbWUpO1xuICBjb25zdCBnYW1lID0gdXRpbC5nZXRHYW1lKGFjdGl2ZVByb2ZpbGUuZ2FtZUlkKTtcbiAgY29uc3QgZGlzY292ZXJ5ID0gc2VsZWN0b3JzLmRpc2NvdmVyeUJ5R2FtZShzdGF0ZSwgYWN0aXZlUHJvZmlsZS5nYW1lSWQpO1xuICBjb25zdCBtb2RQYXRocyA9IGdhbWUuZ2V0TW9kUGF0aHMoZGlzY292ZXJ5LnBhdGgpO1xuICBjb25zdCBkb2NNb2RQYXRoID0gbW9kUGF0aHNbJ3dpdGNoZXIzbWVudW1vZGRvY3VtZW50cyddO1xuICBjb25zdCBjdXJyZW50Q2FjaGUgPSBhd2FpdCBnZXRFeGlzdGluZ0NhY2hlKHN0YXRlLCBhY3RpdmVQcm9maWxlKTtcbiAgaWYgKGN1cnJlbnRDYWNoZS5sZW5ndGggPT09IDApIHtcbiAgICAvLyBOb3RoaW5nIHRvIGNvbXBhcmUsIHVzZXIgZG9lcyBub3QgaGF2ZSBhIGNhY2hlLlxuICAgIHJldHVybjtcbiAgfVxuXG4gIGNvbnN0IGRvY0ZpbGVzID0gKGRlcGxveW1lbnRbJ3dpdGNoZXIzbWVudW1vZHJvb3QnXSA/PyBbXSlcbiAgICAuZmlsdGVyKGZpbGUgPT4gKGZpbGUucmVsUGF0aC5lbmRzV2l0aChQQVJUX1NVRkZJWCkpXG4gICAgICAgICAgICAgICAgICYmIChmaWxlLnJlbFBhdGguaW5kZXhPZihJTlBVVF9YTUxfRklMRU5BTUUpID09PSAtMSkpO1xuXG4gIGlmIChkb2NGaWxlcy5sZW5ndGggPD0gMCkge1xuICAgIC8vIE5vIGRvYyBmaWxlcywgbm8gcHJvYmxlbS5cbiAgICByZXR1cm47XG4gIH1cblxuICBjb25zdCBtb2RzID0gdXRpbC5nZXRTYWZlKHN0YXRlLCBbJ3BlcnNpc3RlbnQnLCAnbW9kcycsIEdBTUVfSURdLCB7fSk7XG4gIGNvbnN0IG1vZFN0YXRlID0gdXRpbC5nZXRTYWZlKGFjdGl2ZVByb2ZpbGUsIFsnbW9kU3RhdGUnXSwge30pO1xuICBjb25zdCBpbnZhbGlkTW9kVHlwZXMgPSBbJ3dpdGNoZXIzbWVudW1vZGRvY3VtZW50cyddO1xuICBjb25zdCBlbmFibGVkTW9kcyA9IE9iamVjdC5rZXlzKG1vZHMpXG4gICAgLmZpbHRlcihrZXkgPT4gISFtb2RTdGF0ZVtrZXldPy5lbmFibGVkICYmICFpbnZhbGlkTW9kVHlwZXMuaW5jbHVkZXMobW9kc1trZXldLnR5cGUpKTtcblxuICBjb25zdCBwYXJzZXIgPSBuZXcgSW5pUGFyc2VyLmRlZmF1bHQobmV3IEluaVBhcnNlci5XaW5hcGlGb3JtYXQoKSk7XG5cbiAgY29uc3QgZmlsZU1hcCA9IGF3YWl0IGNhY2hlVG9GaWxlTWFwKHN0YXRlLCBhY3RpdmVQcm9maWxlKTtcbiAgaWYgKGZpbGVNYXAgPT09IHVuZGVmaW5lZCkge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGNvbnN0IGtleXMgPSBPYmplY3Qua2V5cyhmaWxlTWFwKTtcbiAgY29uc3QgbWF0Y2hlciA9IChlbnRyeSkgPT4ga2V5cy5pbmNsdWRlcyh0b0ZpbGVNYXBLZXkoZW50cnkucmVsUGF0aCkpO1xuICBjb25zdCBuZXdDYWNoZSA9IGF3YWl0IEJsdWViaXJkLnJlZHVjZShrZXlzLCBhc3luYyAoYWNjdW0sIGtleSkgPT4ge1xuICAgIGlmIChkb2NGaWxlcy5maW5kKG1hdGNoZXIpICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGNvbnN0IG1lcmdlZERhdGEgPSBhd2FpdCBwYXJzZXIucmVhZChwYXRoLmpvaW4oZG9jTW9kUGF0aCwga2V5KSk7XG4gICAgICBhd2FpdCBCbHVlYmlyZC5lYWNoKGZpbGVNYXBba2V5XSwgYXN5bmMgKGl0ZXI6IElDYWNoZUVudHJ5KSA9PiB7XG4gICAgICAgIGlmIChlbmFibGVkTW9kcy5pbmNsdWRlcyhpdGVyLmlkKSkge1xuICAgICAgICAgIGNvbnN0IHRlbXBQYXRoID0gcGF0aC5qb2luKGRlc3RpbmF0aW9uRm9sZGVyLCBrZXkpICsgZ2VuZXJhdGUoKTtcbiAgICAgICAgICBjb25zdCBtb2REYXRhID0gYXdhaXQgdG9JbmlGaWxlT2JqZWN0KGl0ZXIuZGF0YSwgdGVtcFBhdGgpO1xuICAgICAgICAgIGNvbnN0IG1vZEtleXMgPSBPYmplY3Qua2V5cyhtb2REYXRhLmRhdGEpO1xuICAgICAgICAgIGxldCBjaGFuZ2VkID0gZmFsc2U7XG4gICAgICAgICAgcmV0dXJuIEJsdWViaXJkLmVhY2gobW9kS2V5cywgbW9kS2V5ID0+IHtcbiAgICAgICAgICAgIGlmICgobWVyZ2VkRGF0YS5kYXRhW21vZEtleV0gIT09IHVuZGVmaW5lZClcbiAgICAgICAgICAgICAgJiYgKG1vZERhdGEuZGF0YVttb2RLZXldICE9PSB1bmRlZmluZWQpXG4gICAgICAgICAgICAgICYmIChtZXJnZWREYXRhLmRhdGFbbW9kS2V5XSAhPT0gbW9kRGF0YS5kYXRhW21vZEtleV0pKSB7XG4gICAgICAgICAgICAgICAgbW9kRGF0YS5kYXRhW21vZEtleV0gPSBtZXJnZWREYXRhLmRhdGFbbW9kS2V5XTtcbiAgICAgICAgICAgICAgICBjaGFuZ2VkID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KS50aGVuKGFzeW5jICgpID0+IHtcbiAgICAgICAgICAgIGxldCBuZXdNb2REYXRhO1xuICAgICAgICAgICAgaWYgKGNoYW5nZWQpIHtcbiAgICAgICAgICAgICAgYXdhaXQgcGFyc2VyLndyaXRlKGl0ZXIuZmlsZXBhdGgsIG1vZERhdGEpO1xuICAgICAgICAgICAgICBuZXdNb2REYXRhID0gYXdhaXQgcmVhZE1vZERhdGEoaXRlci5maWxlcGF0aCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBuZXdNb2REYXRhID0gaXRlci5kYXRhO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAobmV3TW9kRGF0YSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgIGFjY3VtLnB1c2goeyBpZDogaXRlci5pZCwgZmlsZXBhdGg6IGl0ZXIuZmlsZXBhdGgsIGRhdGE6IG5ld01vZERhdGEgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKGFjY3VtKTtcbiAgfSwgW10pO1xuXG4gIHJldHVybiBmcy53cml0ZUZpbGVBc3luYyhwYXRoLmpvaW4oZGVzdGluYXRpb25Gb2xkZXIsIENBQ0hFX0ZJTEVOQU1FKSwgSlNPTi5zdHJpbmdpZnkobmV3Q2FjaGUpKTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gdG9JbmlGaWxlT2JqZWN0KGRhdGEsIHRlbXBEZXN0KSB7XG4gIC8vIEdpdmVuIHRoYXQgd2luYXBpIHJlcXVpcmVzIGEgZmlsZSB0byBjb3JyZWN0bHkgcmVhZC9wYXJzZVxuICAvLyAgYW4gSW5pRmlsZSBvYmplY3QsIHdlJ3JlIGdvaW5nIHRvIHVzZSB0aGlzIGhhY2t5IGRpc2d1c3RpbmdcbiAgLy8gIGZ1bmN0aW9uIHRvIHF1aWNrbHkgY3JlYXRlIGEgdGVtcCBmaWxlLCByZWFkIGl0LCBkZXN0cm95IGl0XG4gIC8vICBhbmQgcmV0dXJuIHRoZSBvYmplY3QgYmFjayB0byB0aGUgY2FsbGVyLlxuICB0cnkge1xuICAgIGF3YWl0IGZzLndyaXRlRmlsZUFzeW5jKHRlbXBEZXN0LCBkYXRhLCB7IGVuY29kaW5nOiAndXRmOCcgfSk7XG4gICAgY29uc3QgcGFyc2VyID0gbmV3IEluaVBhcnNlci5kZWZhdWx0KG5ldyBJbmlQYXJzZXIuV2luYXBpRm9ybWF0KCkpO1xuICAgIGNvbnN0IGluaURhdGEgPSBhd2FpdCBwYXJzZXIucmVhZCh0ZW1wRGVzdCk7XG4gICAgYXdhaXQgZnMucmVtb3ZlQXN5bmModGVtcERlc3QpO1xuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoaW5pRGF0YSk7XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIHJldHVybiBQcm9taXNlLnJlamVjdChlcnIpO1xuICB9XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBvbkRpZERlcGxveShhcGksIGRlcGxveW1lbnQsIGFjdGl2ZVByb2ZpbGUpIHtcbiAgLy8gaWYgKCFpc1NldHRpbmdzTWVyZ2VTdXBwcmVzc2VkKGFwaSkpIHtcbiAgLy8gICByZXR1cm47XG4gIC8vIH1cbiAgY29uc3Qgc3RhdGUgPSBhcGkuc3RvcmUuZ2V0U3RhdGUoKTtcbiAgY29uc3QgbG9hZE9yZGVyID0gZ2V0UGVyc2lzdGVudExvYWRPcmRlcihhcGkpO1xuICBjb25zdCBkb2NGaWxlcyA9IGRlcGxveW1lbnRbJ3dpdGNoZXIzbWVudW1vZHJvb3QnXS5maWx0ZXIoZmlsZSA9PiAoZmlsZS5yZWxQYXRoLmVuZHNXaXRoKFBBUlRfU1VGRklYKSlcbiAgICAmJiAoZmlsZS5yZWxQYXRoLmluZGV4T2YoSU5QVVRfWE1MX0ZJTEVOQU1FKSA9PT0gLTEpKTtcblxuICBpZiAoZG9jRmlsZXMubGVuZ3RoIDw9IDApIHtcbiAgICByZXR1cm47XG4gIH1cblxuICBjb25zdCBtb2RzID0gdXRpbC5nZXRTYWZlKHN0YXRlLCBbJ3BlcnNpc3RlbnQnLCAnbW9kcycsIEdBTUVfSURdLCB7fSk7XG4gIGNvbnN0IG1vZFN0YXRlID0gdXRpbC5nZXRTYWZlKGFjdGl2ZVByb2ZpbGUsIFsnbW9kU3RhdGUnXSwge30pO1xuICBsZXQgbmV4dEF2YWlsYWJsZUlkID0gbG9hZE9yZGVyLmxlbmd0aDtcbiAgY29uc3QgZ2V0TmV4dElkID0gKCkgPT4ge1xuICAgIHJldHVybiBuZXh0QXZhaWxhYmxlSWQrKztcbiAgfVxuICBjb25zdCBpbnZhbGlkTW9kVHlwZXMgPSBbJ3dpdGNoZXIzbWVudW1vZGRvY3VtZW50cyddO1xuICBjb25zdCBlbmFibGVkTW9kcyA9IE9iamVjdC5rZXlzKG1vZHMpXG4gICAgLmZpbHRlcihrZXkgPT4gISFtb2RTdGF0ZVtrZXldPy5lbmFibGVkICYmICFpbnZhbGlkTW9kVHlwZXMuaW5jbHVkZXMobW9kc1trZXldLnR5cGUpKVxuICAgIC5zb3J0KChsaHMsIHJocykgPT4gKGxvYWRPcmRlcltyaHNdPy5wb3MgfHwgZ2V0TmV4dElkKCkpIC0gKGxvYWRPcmRlcltsaHNdPy5wb3MgfHwgZ2V0TmV4dElkKCkpKVxuXG4gIGNvbnN0IGN1cnJlbnRDYWNoZSA9IGF3YWl0IGdldEV4aXN0aW5nQ2FjaGUoc3RhdGUsIGFjdGl2ZVByb2ZpbGUpO1xuICBjb25zdCBpbkNhY2hlID0gbmV3IFNldChjdXJyZW50Q2FjaGUubWFwKGVudHJ5ID0+IGVudHJ5LmlkKSk7XG4gIGNvbnN0IG5vdEluQ2FjaGU6IFNldDxzdHJpbmc+ID0gbmV3IFNldChkb2NGaWxlcy5tYXAoZmlsZSA9PiBmaWxlLnNvdXJjZSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuZmlsdGVyKG1vZElkID0+ICFpbkNhY2hlLmhhcyhtb2RJZCkpKTtcbiAgcmV0dXJuIGVuc3VyZU1lbnVNb2QoYXBpLCBhY3RpdmVQcm9maWxlKVxuICAgIC50aGVuKCgpID0+ICgoY3VycmVudENhY2hlLmxlbmd0aCA9PT0gMCkgJiYgKGVuYWJsZWRNb2RzLmxlbmd0aCA+IDApKVxuICAgICAgPyBwb3B1bGF0ZUNhY2hlKGFwaSwgYWN0aXZlUHJvZmlsZSlcbiAgICAgIDogKG5vdEluQ2FjaGUuc2l6ZSAhPT0gMClcbiAgICAgICAgPyBwb3B1bGF0ZUNhY2hlKGFwaSwgYWN0aXZlUHJvZmlsZSwgQXJyYXkuZnJvbShub3RJbkNhY2hlKSwgY3VycmVudENhY2hlKVxuICAgICAgICA6IFByb21pc2UucmVzb2x2ZSgpKVxuICAgIC50aGVuKCgpID0+IHdyaXRlQ2FjaGVUb0ZpbGVzKGFwaSwgYWN0aXZlUHJvZmlsZSkpXG4gICAgLnRoZW4oKCkgPT4gbWVudU1vZChhY3RpdmVQcm9maWxlLm5hbWUpKVxuICAgIC5jYXRjaChlcnIgPT4gKGVyciBpbnN0YW5jZW9mIHV0aWwuVXNlckNhbmNlbGVkKVxuICAgICAgPyBQcm9taXNlLnJlc29sdmUoKVxuICAgICAgOiBQcm9taXNlLnJlamVjdChlcnIpKTtcbn1cblxuZnVuY3Rpb24gc2FuaXRpemVQcm9maWxlTmFtZShpbnB1dCkge1xuICByZXR1cm4gaW5wdXQucmVwbGFjZShJTlZBTElEX0NIQVJTLCAnXycpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gbWVudU1vZChwcm9maWxlTmFtZSkge1xuICByZXR1cm4gYFdpdGNoZXIgMyBNZW51IE1vZCBEYXRhICgke3Nhbml0aXplUHJvZmlsZU5hbWUocHJvZmlsZU5hbWUpfSlgO1xufVxuXG5hc3luYyBmdW5jdGlvbiBjcmVhdGVNZW51TW9kKGFwaSwgbW9kTmFtZSwgcHJvZmlsZSkge1xuICBjb25zdCBtb2QgPSB7XG4gICAgaWQ6IG1vZE5hbWUsXG4gICAgc3RhdGU6ICdpbnN0YWxsZWQnLFxuICAgIGF0dHJpYnV0ZXM6IHtcbiAgICAgIG5hbWU6ICdXaXRjaGVyIDMgTWVudSBNb2QnLFxuICAgICAgZGVzY3JpcHRpb246ICdUaGlzIG1vZCBpcyBhIGNvbGxlY3RpdmUgbWVyZ2Ugb2Ygc2V0dGluZyBmaWxlcyByZXF1aXJlZCBieSBhbnkvYWxsICdcbiAgICAgICAgICAgICAgICAgKyAnbWVudSBtb2RzIHRoZSB1c2VyIGhhcyBpbnN0YWxsZWQgLSBwbGVhc2UgZG8gbm90IGRpc2FibGUvcmVtb3ZlIHVubGVzcyAnXG4gICAgICAgICAgICAgICAgICsgJ2FsbCBtZW51IG1vZHMgaGF2ZSBiZWVuIHJlbW92ZWQgZnJvbSB5b3VyIGdhbWUgZmlyc3QuJyxcbiAgICAgIGxvZ2ljYWxGaWxlTmFtZTogJ1dpdGNoZXIgMyBNZW51IE1vZCcsXG4gICAgICBtb2RJZDogNDIsIC8vIE1lYW5pbmcgb2YgbGlmZVxuICAgICAgdmVyc2lvbjogJzEuMC4wJyxcbiAgICAgIHZhcmlhbnQ6IHNhbml0aXplUHJvZmlsZU5hbWUocHJvZmlsZS5uYW1lLnJlcGxhY2UoSU5WQUxJRF9DSEFSUywgJ18nKSksXG4gICAgICBpbnN0YWxsVGltZTogbmV3IERhdGUoKSxcbiAgICB9LFxuICAgIGluc3RhbGxhdGlvblBhdGg6IG1vZE5hbWUsXG4gICAgdHlwZTogJ3dpdGNoZXIzbWVudW1vZGRvY3VtZW50cycsXG4gIH07XG5cbiAgcmV0dXJuIGF3YWl0IG5ldyBQcm9taXNlPHZvaWQ+KChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICBhcGkuZXZlbnRzLmVtaXQoJ2NyZWF0ZS1tb2QnLCBwcm9maWxlLmdhbWVJZCwgbW9kLCBhc3luYyAoZXJyb3IpID0+IHtcbiAgICAgIGlmIChlcnJvciAhPT0gbnVsbCkge1xuICAgICAgICByZXR1cm4gcmVqZWN0KGVycm9yKTtcbiAgICAgIH1cbiAgICAgIHJlc29sdmUoKTtcbiAgICB9KTtcbiAgfSk7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiByZW1vdmVNZW51TW9kKGFwaSwgcHJvZmlsZSkge1xuICAvLyBpZiAoIWlzU2V0dGluZ3NNZXJnZVN1cHByZXNzZWQoYXBpKSkge1xuICAvLyAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcbiAgLy8gfVxuICBjb25zdCBzdGF0ZSA9IGFwaS5zdG9yZS5nZXRTdGF0ZSgpO1xuICBjb25zdCBtb2ROYW1lID0gbWVudU1vZChwcm9maWxlLm5hbWUpO1xuICBjb25zdCBtb2QgPSB1dGlsLmdldFNhZmUoc3RhdGUsIFsncGVyc2lzdGVudCcsICdtb2RzJywgcHJvZmlsZS5nYW1lSWQsIG1vZE5hbWVdLCB1bmRlZmluZWQpO1xuICBpZiAobW9kID09PSB1bmRlZmluZWQpIHtcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG4gIH1cbiAgcmV0dXJuIG5ldyBQcm9taXNlPHZvaWQ+KChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICBhcGkuZXZlbnRzLmVtaXQoJ3JlbW92ZS1tb2QnLCBwcm9maWxlLmdhbWVJZCwgbW9kLmlkLCBhc3luYyAoZXJyb3IpID0+IHtcbiAgICAgIGlmIChlcnJvciAhPT0gbnVsbCkge1xuICAgICAgICAvLyBUaGUgZmFjdCB0aGF0IHdlJ3JlIGF0dGVtcHRpbmcgdG8gcmVtb3ZlIHRoZSBhZ2dyZWdhdGVkIG1lbnUgbW9kIG1lYW5zIHRoYXRcbiAgICAgICAgLy8gIHRoZSB1c2VyIG5vIGxvbmdlciBoYXMgYW55IG1lbnUgbW9kcyBpbnN0YWxsZWQgYW5kIHRoZXJlZm9yZSBpdCdzIHNhZmUgdG9cbiAgICAgICAgLy8gIGlnbm9yZSBhbnkgZXJyb3JzIHRoYXQgbWF5IGhhdmUgYmVlbiByYWlzZWQgZHVyaW5nIHJlbW92YWwuXG4gICAgICAgIC8vIFRoZSBtYWluIHByb2JsZW0gaGVyZSBpcyB0aGUgZmFjdCB0aGF0IHVzZXJzIGFyZSBhY3RpdmVseSBtZXNzaW5nIHdpdGhcbiAgICAgICAgLy8gIHRoZSBtZW51IG1vZCB3ZSBnZW5lcmF0ZSBjYXVzaW5nIG9kZCBlcnJvcnMgdG8gcG9wIHVwLlxuICAgICAgICBsb2coJ2Vycm9yJywgJ2ZhaWxlZCB0byByZW1vdmUgbWVudSBtb2QnLCBlcnJvcik7XG4gICAgICAgIC8vIHJldHVybiByZWplY3QoZXJyb3IpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHJlc29sdmUoKTtcbiAgICB9KTtcbiAgfSk7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGNhY2hlVG9GaWxlTWFwKHN0YXRlLCBwcm9maWxlKSB7XG4gIC8vIE9yZ2FuaXplcyBjYWNoZSBlbnRyaWVzIGludG8gYSBmaWxlTWFwIHdoaWNoXG4gIC8vICBjYW4gYmUgdXNlZCB0byBsb29wIHRocm91Z2ggZWFjaCBtb2QgZW50cnknc1xuICAvLyAgZGF0YSBvbiBhIHBlciBmaWxlIGJhc2lzLlxuICBjb25zdCBjdXJyZW50Q2FjaGUgPSBhd2FpdCBnZXRFeGlzdGluZ0NhY2hlKHN0YXRlLCBwcm9maWxlKTtcbiAgaWYgKGN1cnJlbnRDYWNoZS5sZW5ndGggPT09IDApIHtcbiAgICAvLyBOb3RoaW5nIHRvIGRvIGhlcmUuXG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgfVxuXG4gIGNvbnN0IHN0YWdpbmdGb2xkZXIgPSBzZWxlY3RvcnMuaW5zdGFsbFBhdGhGb3JHYW1lKHN0YXRlLCBHQU1FX0lEKTtcbiAgY29uc3QgZmlsZU1hcCA9IGN1cnJlbnRDYWNoZS5yZWR1Y2UoKGFjY3VtLCBlbnRyeSkgPT4ge1xuICAgIGFjY3VtW3RvRmlsZU1hcEtleShlbnRyeS5maWxlcGF0aCldID1cbiAgICAgIFtdLmNvbmNhdChhY2N1bVt0b0ZpbGVNYXBLZXkoZW50cnkuZmlsZXBhdGgpXSB8fCBbXSxcbiAgICAgIFt7XG4gICAgICAgIGlkOiBlbnRyeS5pZCxcbiAgICAgICAgZGF0YTogZW50cnkuZGF0YSxcbiAgICAgICAgZmlsZXBhdGg6IGNvbnZlcnRGaWxlUGF0aChlbnRyeS5maWxlcGF0aCwgc3RhZ2luZ0ZvbGRlciksXG4gICAgICB9XSk7XG5cbiAgICByZXR1cm4gYWNjdW07XG4gIH0sIHt9KTtcblxuICByZXR1cm4gZmlsZU1hcDtcbn1cblxuY29uc3QgY29weUluaUZpbGUgPSAoc291cmNlOiBzdHJpbmcsIGRlc3Q6IHN0cmluZykgPT4gZnMuY29weUFzeW5jKHNvdXJjZSwgZGVzdClcbiAgICAudGhlbigoKSA9PiBQcm9taXNlLnJlc29sdmUoZGVzdCkpLmNhdGNoKGVyciA9PiBQcm9taXNlLnJlc29sdmUodW5kZWZpbmVkKSk7XG5cbmNvbnN0IGdldEluaXRpYWxEb2MgPSAoZmlsZVBhdGg6IHN0cmluZykgPT4ge1xuICByZXR1cm4gZnMuc3RhdEFzeW5jKGZpbGVQYXRoICsgQkFDS1VQX1RBRylcbiAgICAudGhlbigoKSA9PiBQcm9taXNlLnJlc29sdmUoZmlsZVBhdGggKyBCQUNLVVBfVEFHKSlcbiAgICAuY2F0Y2goZXJyID0+IGZzLnN0YXRBc3luYyhmaWxlUGF0aClcbiAgICAgIC50aGVuKCgpID0+IFByb21pc2UucmVzb2x2ZShmaWxlUGF0aCkpKVxuICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgLy8gV2UgY291bGRuJ3QgZmluZCB0aGUgb3JpZ2luYWwgZG9jdW1lbnQuIFRoaXNcbiAgICAgIC8vICBjYW4gcG90ZW50aWFsbHkgaGFwcGVuIHdoZW4gdGhlIC5wYXJ0LnR4dCBzdWZmaXhcbiAgICAgIC8vICBnZXRzIGFkZGVkIHRvIGZpbGVzIHRoYXQgYXJlIG5vdCBzdXBwb3NlZCB0byBiZVxuICAgICAgLy8gIGRlcGxveWVkIHRvIHRoZSBkb2N1bWVudHMgZm9sZGVyLCBsb2cgYW5kIGNvbnRpbnVlLlxuICAgICAgbG9nKCd3YXJuJywgJ1czOiBjYW5ub3QgZmluZCBvcmlnaW5hbCBmaWxlJywgZXJyLm1lc3NhZ2UpO1xuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh1bmRlZmluZWQpO1xuICAgIH0pO1xufTtcblxuYXN5bmMgZnVuY3Rpb24gd3JpdGVDYWNoZVRvRmlsZXMoYXBpLCBwcm9maWxlKSB7XG4gIGNvbnN0IHN0YXRlID0gYXBpLnN0b3JlLmdldFN0YXRlKCk7XG4gIGNvbnN0IG1vZE5hbWUgPSBtZW51TW9kKHByb2ZpbGUubmFtZSk7XG4gIGNvbnN0IGluc3RhbGxQYXRoID0gc2VsZWN0b3JzLmluc3RhbGxQYXRoRm9yR2FtZShzdGF0ZSwgcHJvZmlsZS5nYW1lSWQpO1xuICBjb25zdCBkZXN0aW5hdGlvbkZvbGRlciA9IHBhdGguam9pbihpbnN0YWxsUGF0aCwgbW9kTmFtZSk7XG4gIGNvbnN0IGdhbWUgPSB1dGlsLmdldEdhbWUocHJvZmlsZS5nYW1lSWQpO1xuICBjb25zdCBkaXNjb3ZlcnkgPSBzZWxlY3RvcnMuZGlzY292ZXJ5QnlHYW1lKHN0YXRlLCBwcm9maWxlLmdhbWVJZCk7XG4gIGNvbnN0IG1vZFBhdGhzID0gZ2FtZS5nZXRNb2RQYXRocyhkaXNjb3ZlcnkucGF0aCk7XG4gIGNvbnN0IGRvY01vZFBhdGggPSBtb2RQYXRoc1snd2l0Y2hlcjNtZW51bW9kZG9jdW1lbnRzJ107XG4gIGNvbnN0IGN1cnJlbnRDYWNoZSA9IGF3YWl0IGdldEV4aXN0aW5nQ2FjaGUoc3RhdGUsIHByb2ZpbGUpO1xuICBpZiAoY3VycmVudENhY2hlLmxlbmd0aCA9PT0gMCkgcmV0dXJuO1xuXG4gIGNvbnN0IGZpbGVNYXAgPSBhd2FpdCBjYWNoZVRvRmlsZU1hcChzdGF0ZSwgcHJvZmlsZSk7XG4gIGlmICghZmlsZU1hcCkgcmV0dXJuO1xuXG4gIGNvbnN0IHBhcnNlciA9IG5ldyBJbmlQYXJzZXIuZGVmYXVsdChuZXcgSW5pUGFyc2VyLldpbmFwaUZvcm1hdCgpKTtcbiAgY29uc3Qga2V5cyA9IE9iamVjdC5rZXlzKGZpbGVNYXApO1xuXG4gIGZvciAoY29uc3Qga2V5IG9mIGtleXMpIHtcbiAgICB0cnkge1xuICAgICAgY29uc3Qgc291cmNlID0gYXdhaXQgZ2V0SW5pdGlhbERvYyhwYXRoLmpvaW4oZG9jTW9kUGF0aCwga2V5KSk7XG4gICAgICBpZiAoIXNvdXJjZSkgY29udGludWU7XG5cbiAgICAgIGF3YWl0IGNvcHlJbmlGaWxlKHNvdXJjZSwgcGF0aC5qb2luKGRlc3RpbmF0aW9uRm9sZGVyLCBrZXkpKTtcbiAgICAgIGNvbnN0IGluaXRpYWxEYXRhID0gYXdhaXQgcGFyc2VyLnJlYWQocGF0aC5qb2luKGRlc3RpbmF0aW9uRm9sZGVyLCBrZXkpKTtcblxuICAgICAgZm9yIChjb25zdCBtb2RFbnRyeSBvZiBmaWxlTWFwW2tleV0pIHtcbiAgICAgICAgY29uc3QgdGVtcEZpbGVQYXRoID0gcGF0aC5qb2luKGRlc3RpbmF0aW9uRm9sZGVyLCBrZXkpICsgZ2VuZXJhdGUoKTtcbiAgICAgICAgY29uc3QgbW9kRGF0YSA9IGF3YWl0IHRvSW5pRmlsZU9iamVjdChtb2RFbnRyeS5kYXRhLCB0ZW1wRmlsZVBhdGgpO1xuXG4gICAgICAgIGZvciAoY29uc3QgbW9kS2V5IG9mIE9iamVjdC5rZXlzKG1vZERhdGEuZGF0YSkpIHtcbiAgICAgICAgICBpbml0aWFsRGF0YS5kYXRhW21vZEtleV0gPSB7XG4gICAgICAgICAgICAuLi5pbml0aWFsRGF0YS5kYXRhW21vZEtleV0sXG4gICAgICAgICAgICAuLi5tb2REYXRhLmRhdGFbbW9kS2V5XSxcbiAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBhd2FpdCBwYXJzZXIud3JpdGUocGF0aC5qb2luKGRlc3RpbmF0aW9uRm9sZGVyLCBrZXkpLCBpbml0aWFsRGF0YSk7XG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICBpZiAoZXJyLmNvZGUgPT09ICdFTk9FTlQnICYmIFtcbiAgICAgICAgcGF0aC5qb2luKGRvY01vZFBhdGgsIElOUFVUX1NFVFRJTkdTX0ZJTEVOQU1FKSxcbiAgICAgICAgcGF0aC5qb2luKGRvY01vZFBhdGgsIERYXzExX1VTRVJfU0VUVElOR1NfRklMRU5BTUUpLFxuICAgICAgICBwYXRoLmpvaW4oZG9jTW9kUGF0aCwgRFhfMTJfVVNFUl9TRVRUSU5HU19GSUxFTkFNRSksXG4gICAgICBdLmluY2x1ZGVzKGVyci5wYXRoKSkge1xuICAgICAgICBhcGkuc2hvd0Vycm9yTm90aWZpY2F0aW9uKCdGYWlsZWQgdG8gaW5zdGFsbCBtZW51IG1vZCcsIG5ldyB1dGlsLkRhdGFJbnZhbGlkKCdSZXF1aXJlZCBzZXR0aW5nIGZpbGVzIGFyZSBtaXNzaW5nIC0gcGxlYXNlIHJ1biB0aGUgZ2FtZSBhdCBsZWFzdCBvbmNlIGFuZCB0cnkgYWdhaW4uJyksIHsgYWxsb3dSZXBvcnQ6IGZhbHNlIH0pO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICB0aHJvdyBlcnI7XG4gICAgfVxuICB9XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBlbnN1cmVNZW51TW9kKGFwaSwgcHJvZmlsZSkge1xuICAvLyBpZiAoIWlzU2V0dGluZ3NNZXJnZVN1cHByZXNzZWQoYXBpKSkge1xuICAvLyAgIHJldHVybiBQcm9taXNlLnJlc29sdmUodW5kZWZpbmVkKTtcbiAgLy8gfVxuICBjb25zdCBzdGF0ZSA9IGFwaS5zdG9yZS5nZXRTdGF0ZSgpO1xuICBjb25zdCBtb2ROYW1lID0gbWVudU1vZChwcm9maWxlLm5hbWUpO1xuICBjb25zdCBtb2QgPSB1dGlsLmdldFNhZmUoc3RhdGUsIFsncGVyc2lzdGVudCcsICdtb2RzJywgcHJvZmlsZS5nYW1lSWQsIG1vZE5hbWVdLCB1bmRlZmluZWQpO1xuICBpZiAobW9kID09PSB1bmRlZmluZWQpIHtcbiAgICB0cnkge1xuICAgICAgYXdhaXQgY3JlYXRlTWVudU1vZChhcGksIG1vZE5hbWUsIHByb2ZpbGUpO1xuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KGVycik7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIC8vIGdpdmUgdGhlIHVzZXIgYW4gaW5kaWNhdGlvbiB3aGVuIHRoaXMgd2FzIGxhc3QgdXBkYXRlZFxuICAgIGFwaS5zdG9yZS5kaXNwYXRjaChhY3Rpb25zLnNldE1vZEF0dHJpYnV0ZShwcm9maWxlLmdhbWVJZCwgbW9kTmFtZSwgJ2luc3RhbGxUaW1lJywgbmV3IERhdGUoKSkpO1xuICAgIC8vIHRoZSByZXN0IGhlcmUgaXMgb25seSByZXF1aXJlZCB0byB1cGRhdGUgbW9kcyBmcm9tIHByZXZpb3VzIHZvcnRleCB2ZXJzaW9uc1xuICAgIGFwaS5zdG9yZS5kaXNwYXRjaChhY3Rpb25zLnNldE1vZEF0dHJpYnV0ZShwcm9maWxlLmdhbWVJZCwgbW9kTmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ25hbWUnLCAnV2l0Y2hlciAzIE1lbnUgTW9kJykpO1xuXG4gICAgYXBpLnN0b3JlLmRpc3BhdGNoKGFjdGlvbnMuc2V0TW9kQXR0cmlidXRlKHByb2ZpbGUuZ2FtZUlkLCBtb2ROYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAndHlwZScsICd3aXRjaGVyM21lbnVtb2Rkb2N1bWVudHMnKSk7XG5cbiAgICBhcGkuc3RvcmUuZGlzcGF0Y2goYWN0aW9ucy5zZXRNb2RBdHRyaWJ1dGUocHJvZmlsZS5nYW1lSWQsIG1vZE5hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICdsb2dpY2FsRmlsZU5hbWUnLCAnV2l0Y2hlciAzIE1lbnUgTW9kJykpO1xuICAgIGFwaS5zdG9yZS5kaXNwYXRjaChhY3Rpb25zLnNldE1vZEF0dHJpYnV0ZShwcm9maWxlLmdhbWVJZCwgbW9kTmFtZSwgJ21vZElkJywgNDIpKTtcbiAgICBhcGkuc3RvcmUuZGlzcGF0Y2goYWN0aW9ucy5zZXRNb2RBdHRyaWJ1dGUocHJvZmlsZS5nYW1lSWQsIG1vZE5hbWUsICd2ZXJzaW9uJywgJzEuMC4wJykpO1xuICAgIGFwaS5zdG9yZS5kaXNwYXRjaChhY3Rpb25zLnNldE1vZEF0dHJpYnV0ZShwcm9maWxlLmdhbWVJZCwgbW9kTmFtZSwgJ3ZhcmlhbnQnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzYW5pdGl6ZVByb2ZpbGVOYW1lKHByb2ZpbGUubmFtZSkpKTtcbiAgfVxuICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKG1vZE5hbWUpO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZXhwb3J0TWVudU1vZChhcGksIHByb2ZpbGUsIGluY2x1ZGVkTW9kcykge1xuICAvLyBpZiAoIWlzU2V0dGluZ3NNZXJnZVN1cHByZXNzZWQoYXBpKSkge1xuICAvLyAgIHJldHVybiB1bmRlZmluZWQ7XG4gIC8vIH1cbiAgdHJ5IHtcbiAgICBjb25zdCBkZXBsb3ltZW50ID0gYXdhaXQgZ2V0RGVwbG95bWVudChhcGksIGluY2x1ZGVkTW9kcyk7XG4gICAgaWYgKGRlcGxveW1lbnQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdGYWlsZWQgdG8gZ2V0IGRlcGxveW1lbnQnKTtcbiAgICB9XG4gICAgY29uc3QgbW9kTmFtZSA9IGF3YWl0IG9uRGlkRGVwbG95KGFwaSwgZGVwbG95bWVudCwgcHJvZmlsZSk7XG4gICAgaWYgKG1vZE5hbWUgPT09IHVuZGVmaW5lZCkge1xuICAgICAgLy8gVGhlIGluc3RhbGxlZCBtb2RzIGRvIG5vdCByZXF1aXJlIGEgbWVudSBtb2QuXG4gICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIH1cbiAgICBjb25zdCBtb2RzID0gdXRpbC5nZXRTYWZlKGFwaS5nZXRTdGF0ZSgpLCBbJ3BlcnNpc3RlbnQnLCAnbW9kcycsIEdBTUVfSURdLCB7fSk7XG4gICAgY29uc3QgbW9kSWQgPSBPYmplY3Qua2V5cyhtb2RzKS5maW5kKGlkID0+IGlkID09PSBtb2ROYW1lKTtcbiAgICBpZiAobW9kSWQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdNZW51IG1vZCBpcyBtaXNzaW5nJyk7XG4gICAgfVxuICAgIGNvbnN0IGluc3RhbGxQYXRoID0gc2VsZWN0b3JzLmluc3RhbGxQYXRoRm9yR2FtZShhcGkuZ2V0U3RhdGUoKSwgR0FNRV9JRCk7XG4gICAgY29uc3QgbW9kUGF0aCA9IHBhdGguam9pbihpbnN0YWxsUGF0aCwgbW9kc1ttb2RJZF0uaW5zdGFsbGF0aW9uUGF0aCk7XG4gICAgY29uc3QgZGF0YSA9IGF3YWl0IHByZXBhcmVGaWxlRGF0YShtb2RQYXRoKTtcbiAgICByZXR1cm4gZGF0YTtcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgcmV0dXJuIFByb21pc2UucmVqZWN0KGVycik7XG4gIH1cbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGltcG9ydE1lbnVNb2QoYXBpLCBwcm9maWxlLCBmaWxlRGF0YSkge1xuICAvLyBpZiAoIWlzU2V0dGluZ3NNZXJnZVN1cHByZXNzZWQoYXBpKSkge1xuICAvLyAgIHJldHVybiBQcm9taXNlLnJlc29sdmUodW5kZWZpbmVkKTtcbiAgLy8gfVxuICB0cnkge1xuICAgIGNvbnN0IG1vZE5hbWUgPSBhd2FpdCBlbnN1cmVNZW51TW9kKGFwaSwgcHJvZmlsZSk7XG4gICAgY29uc3QgbW9kID0gdXRpbC5nZXRTYWZlKGFwaS5nZXRTdGF0ZSgpLCBbJ3BlcnNpc3RlbnQnLCAnbW9kcycsIHByb2ZpbGUuZ2FtZUlkLCBtb2ROYW1lXSwgdW5kZWZpbmVkKTtcbiAgICBjb25zdCBpbnN0YWxsUGF0aCA9IHNlbGVjdG9ycy5pbnN0YWxsUGF0aEZvckdhbWUoYXBpLmdldFN0YXRlKCksIEdBTUVfSUQpO1xuICAgIGNvbnN0IGRlc3RQYXRoID0gcGF0aC5qb2luKGluc3RhbGxQYXRoLCBtb2QuaW5zdGFsbGF0aW9uUGF0aCk7XG4gICAgYXdhaXQgcmVzdG9yZUZpbGVEYXRhKGZpbGVEYXRhLCBkZXN0UGF0aCk7XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIHJldHVybiBQcm9taXNlLnJlamVjdChlcnIpO1xuICB9XG59XG4iXX0=