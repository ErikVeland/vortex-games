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
const vortex_api_1 = require("vortex-api");
const IniParser = require('vortex-parse-ini');
const shortid_1 = require("shortid");
const promiseEach = (array, iteratorFunction) => __awaiter(void 0, void 0, void 0, function* () {
    for (let i = 0; i < array.length; i++) {
        yield iteratorFunction(array[i], i, array.length);
    }
    return array;
});
const promiseReduce = (array, reducerFunction, initialValue) => __awaiter(void 0, void 0, void 0, function* () {
    let accumulator = initialValue;
    for (let i = 0; i < array.length; i++) {
        accumulator = yield reducerFunction(accumulator, array[i], i, array.length);
    }
    return accumulator;
});
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
    return promiseReduce(enabledMods, (accum, mod) => {
        if (mod.installationPath === undefined) {
            return accum;
        }
        return getRelevantModEntries(path_1.default.join(stagingFolder, mod.installationPath))
            .then(entries => {
            return promiseEach(entries, filepath => {
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
        const newCache = yield promiseReduce(keys, (accum, key) => __awaiter(this, void 0, void 0, function* () {
            if (docFiles.find(matcher) !== undefined) {
                const mergedData = yield parser.read(path_1.default.join(docModPath, key));
                yield promiseEach(fileMap[key], (iter) => __awaiter(this, void 0, void 0, function* () {
                    if (enabledMods.includes(iter.id)) {
                        const tempPath = path_1.default.join(destinationFolder, key) + (0, shortid_1.generate)();
                        const modData = yield toIniFileObject(iter.data, tempPath);
                        const modKeys = Object.keys(modData.data);
                        let changed = false;
                        return promiseEach(modKeys, modKey => {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWVudW1vZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIm1lbnVtb2QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7QUE0TEEsb0NBaUZDO0FBa0JELGtDQXVDQztBQU1ELDBCQUVDO0FBK0JELHNDQXdCQztBQWtHRCxzQ0ErQkM7QUFFRCxzQ0EwQkM7QUFFRCxzQ0FhQztBQWhqQkQsZ0RBQXdCO0FBRXhCLDJDQUFzRTtBQUN0RSxNQUFNLFNBQVMsR0FBRyxPQUFPLENBQUMsa0JBQWtCLENBQUMsQ0FBQztBQUM5QyxxQ0FBbUM7QUFHbkMsTUFBTSxXQUFXLEdBQUcsQ0FBTyxLQUFLLEVBQUUsZ0JBQWdCLEVBQUUsRUFBRTtJQUNwRCxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsS0FBSyxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO1FBQ3RDLE1BQU0sZ0JBQWdCLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUM7SUFDcEQsQ0FBQztJQUNELE9BQU8sS0FBSyxDQUFDO0FBQ2YsQ0FBQyxDQUFBLENBQUM7QUFFRixNQUFNLGFBQWEsR0FBRyxDQUFPLEtBQUssRUFBRSxlQUFlLEVBQUUsWUFBWSxFQUFFLEVBQUU7SUFDbkUsSUFBSSxXQUFXLEdBQUcsWUFBWSxDQUFDO0lBQy9CLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxLQUFLLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7UUFDdEMsV0FBVyxHQUFHLE1BQU0sZUFBZSxDQUFDLFdBQVcsRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUM5RSxDQUFDO0lBQ0QsT0FBTyxXQUFXLENBQUM7QUFDckIsQ0FBQyxDQUFBLENBQUM7QUFFRiw2Q0FBc0Q7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RSxNQUFNLEVBQUUsZ0JBQU8sQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBQ3RFLE1BQU0sUUFBUSxHQUFHLGlCQUFJLENBQUMsT0FBTyxDQUFDLGFBQWEsRUFBRSxDQUFDLFVBQVUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBQy9ELElBQUksZUFBZSxHQUFHLFNBQVMsQ0FBQyxNQUFNLENBQUM7UUFDdkMsTUFBTSxTQUFTLEdBQUcsR0FBRyxFQUFFO1lBQ3JCLE9BQU8sZUFBZSxFQUFFLENBQUM7UUFDM0IsQ0FBQyxDQUFBO1FBQ0QsTUFBTSxlQUFlLEdBQUcsQ0FBQywwQkFBMEIsQ0FBQyxDQUFDO1FBQ3JELE1BQU0sV0FBVyxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDO2FBQ2xDLE1BQU0sQ0FBQyxHQUFHLENBQUMsRUFBRSxXQUFDLE9BQUEsQ0FBQyxDQUFDLENBQUEsTUFBQSxRQUFRLENBQUMsR0FBRyxDQUFDLDBDQUFFLE9BQU8sQ0FBQSxJQUFJLENBQUMsZUFBZSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUEsRUFBQSxDQUFDO2FBQ3BGLElBQUksQ0FBQyxDQUFDLEdBQUcsRUFBRSxHQUFHLEVBQUUsRUFBRSxlQUFDLE9BQUEsQ0FBQyxDQUFBLE1BQUEsU0FBUyxDQUFDLEdBQUcsQ0FBQywwQ0FBRSxHQUFHLEtBQUksU0FBUyxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUEsTUFBQSxTQUFTLENBQUMsR0FBRyxDQUFDLDBDQUFFLEdBQUcsS0FBSSxTQUFTLEVBQUUsQ0FBQyxDQUFBLEVBQUEsQ0FBQyxDQUFBO1FBRWxHLE1BQU0sWUFBWSxHQUFHLE1BQU0sZ0JBQWdCLENBQUMsS0FBSyxFQUFFLGFBQWEsQ0FBQyxDQUFDO1FBQ2xFLE1BQU0sT0FBTyxHQUFHLElBQUksR0FBRyxDQUFDLFlBQVksQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUM3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QyxHQUFHLENBQUMsUUFBUSxFQUFFLEVBQUUsZ0JBQU8sQ0FBQyxDQUFDO1lBQzFFLE1BQU0sUUFBUSxHQUFHLGNBQUksQ0FBQyxJQUFJLENBQUMsV0FBVyxFQUFFLEdBQUcsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO1lBQzlELE1BQU0sSUFBQSxzQkFBZSxFQUFDLFFBQVEsRUFBRSxRQUFRLENBQUMsQ0FBQztRQUM1QyxDQUFDO1FBQUMsT0FBTyxHQUFHLEVBQUUsQ0FBQztZQUNiLE9BQU8sT0FBTyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUM3QixDQUFDO0lBQ0gsQ0FBQztDQUFBIiwic291cmNlc0NvbnRlbnQiOlsiLyogZXNsaW50LWRpc2FibGUgKi9cbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xuLy8gVE9ETzogUmVtb3ZlIEJsdWViaXJkIGltcG9ydCAtIHVzaW5nIG5hdGl2ZSBQcm9taXNlO1xuaW1wb3J0IHsgYWN0aW9ucywgZnMsIGxvZywgc2VsZWN0b3JzLCB0eXBlcywgdXRpbCB9IGZyb20gJ3ZvcnRleC1hcGknO1xuY29uc3QgSW5pUGFyc2VyID0gcmVxdWlyZSgndm9ydGV4LXBhcnNlLWluaScpO1xuaW1wb3J0IHsgZ2VuZXJhdGUgfSBmcm9tICdzaG9ydGlkJztcblxuLy8gUHJvbWlzZSBoZWxwZXIgZnVuY3Rpb25zIHRvIHJlcGxhY2UgQmx1ZWJpcmQgbWV0aG9kc1xuY29uc3QgcHJvbWlzZUVhY2ggPSBhc3luYyAoYXJyYXksIGl0ZXJhdG9yRnVuY3Rpb24pID0+IHtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBhcnJheS5sZW5ndGg7IGkrKykge1xuICAgIGF3YWl0IGl0ZXJhdG9yRnVuY3Rpb24oYXJyYXlbaV0sIGksIGFycmF5Lmxlbmd0aCk7XG4gIH1cbiAgcmV0dXJuIGFycmF5O1xufTtcblxuY29uc3QgcHJvbWlzZVJlZHVjZSA9IGFzeW5jIChhcnJheSwgcmVkdWNlckZ1bmN0aW9uLCBpbml0aWFsVmFsdWUpID0+IHtcbiAgbGV0IGFjY3VtdWxhdG9yID0gaW5pdGlhbFZhbHVlO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGFycmF5Lmxlbmd0aDsgaSsrKSB7XG4gICAgYWNjdW11bGF0b3IgPSBhd2FpdCByZWR1Y2VyRnVuY3Rpb24oYWNjdW11bGF0b3IsIGFycmF5W2ldLCBpLCBhcnJheS5sZW5ndGgpO1xuICB9XG4gIHJldHVybiBhY2N1bXVsYXRvcjtcbn07XG5cbmltcG9ydCB7IGdldFBlcnNpc3RlbnRMb2FkT3JkZXIgfSBmcm9tICcuL21pZ3JhdGlvbnMnO1xuaW1wb3J0IHsgcHJlcGFyZUZpbGVEYXRhLCByZXN0b3JlRmlsZURhdGEgfSBmcm9tICcuL2NvbGxlY3Rpb25zL3V0aWwnO1xuaW1wb3J0IHsgZ2V0RGVwbG95bWVudCB9IGZyb20gJy4vdXRpbCc7XG5pbXBvcnQgeyBHQU1FX0lELCBJTlBVVF9YTUxfRklMRU5BTUUsIFBBUlRfU1VGRklYIH0gZnJvbSAnLi9jb21tb24nO1xuXG4vLyBtb3N0IG9mIHRoZXNlIGFyZSBpbnZhbGlkIG9uIHdpbmRvd3Mgb25seSBidXQgaXQncyBub3Qgd29ydGggdGhlIGVmZm9ydCBhbGxvd2luZyB0aGVtIGVsc2V3aGVyZVxuY29uc3QgSU5WQUxJRF9DSEFSUyA9IC9bOi9cXFxcKj9cIjw+fF0vZztcbmNvbnN0IElOUFVUX1NFVFRJTkdTX0ZJTEVOQU1FID0gJ2lucHV0LnNldHRpbmdzJztcbmNvbnN0IERYXzExX1VTRVJfU0VUVElOR1NfRklMRU5BTUUgPSAndXNlci5zZXR0aW5ncyc7XG5jb25zdCBEWF8xMl9VU0VSX1NFVFRJTkdTX0ZJTEVOQU1FID0gJ2R4MTJ1c2VyLnNldHRpbmdzJztcbmNvbnN0IEJBQ0tVUF9UQUcgPSAnLnZvcnRleF9iYWNrdXAnO1xuXG5pbnRlcmZhY2UgSUNhY2hlRW50cnkge1xuICBpZDogc3RyaW5nO1xuICBmaWxlcGF0aDogc3RyaW5nO1xuICBkYXRhOiBzdHJpbmc7XG59XG5cbnR5cGUgSUZpbGVNYXAgPSB7IFtlbnRyeUlkOiBzdHJpbmddOiBJQ2FjaGVFbnRyeVtdIH07XG5cbi8vIFdlJ3JlIGdvaW5nIHRvIHNhdmUgcGVyIG1vZCBpbmkgc2V0dGluZ3MgZm9yIGVhY2hcbi8vICBmaWxlICh3aGVyZSBhcHBsaWNhYmxlKSBpbnRvIHRoaXMgY2FjaGUgZmlsZSBzb1xuLy8gIHdlIGNhbiBrZWVwIHRyYWNrIG9mIGNoYW5nZXMgdGhhdCB0aGUgdXNlciBtYWRlXG4vLyAgZHVyaW5nIGhpcyBwbGF5dGhyb3VnaC5cbmNvbnN0IENBQ0hFX0ZJTEVOQU1FID0gJ3ZvcnRleF9tZW51bW9kLmNhY2hlJ1xuLyogQ2FjaGUgZm9ybWF0IHNob3VsZCBiZSBhcyBmb2xsb3dzOlxuICBbXG4gICAge1xuICAgICAgaWQ6ICRtb2RJZFxuICAgICAgZmlsZXBhdGg6ICcuLi9pbnB1dC5zZXR0aW5ncycsXG4gICAgICBkYXRhOiAnaW5pIGRhdGEgaW4gc3RyaW5nIGZvcm1hdCcsXG4gICAgfSxcbiAgICB7XG4gICAgICBpZDogJG1vZElkXG4gICAgICBmaWxlbmFtZTogJy4uL3VzZXIuc2V0dGluZ3MnLFxuICAgICAgZGF0YTogJ2luaSBkYXRhIGluIHN0cmluZyBmb3JtYXQnLFxuICAgIH0sXG4gIF1cbiovXG5hc3luYyBmdW5jdGlvbiBnZXRFeGlzdGluZ0NhY2hlKHN0YXRlLCBhY3RpdmVQcm9maWxlKSB7XG4gIGNvbnN0IHN0YWdpbmdGb2xkZXIgPSBzZWxlY3RvcnMuaW5zdGFsbFBhdGhGb3JHYW1lKHN0YXRlLCBHQU1FX0lEKTtcbiAgY29uc3QgbW9kTmFtZSA9IG1lbnVNb2QoYWN0aXZlUHJvZmlsZS5uYW1lKTtcbiAgY29uc3QgbW9kID0gdXRpbC5nZXRTYWZlKHN0YXRlLCBbJ3BlcnNpc3RlbnQnLCAnbW9kcycsIEdBTUVfSUQsIG1vZE5hbWVdLCB1bmRlZmluZWQpO1xuICBpZiAobW9kID09PSB1bmRlZmluZWQpIHtcbiAgICByZXR1cm4gW107XG4gIH1cblxuICB0cnkge1xuICAgIGNvbnN0IGNhY2hlRGF0YSA9IGF3YWl0IGZzLnJlYWRGaWxlQXN5bmMocGF0aC5qb2luKHN0YWdpbmdGb2xkZXIsXG4gICAgICBtb2QuaW5zdGFsbGF0aW9uUGF0aCwgQ0FDSEVfRklMRU5BTUUpLCB7IGVuY29kaW5nOiAndXRmOCcgfSk7XG4gICAgY29uc3QgY3VycmVudENhY2hlID0gSlNPTi5wYXJzZShjYWNoZURhdGEpO1xuICAgIHJldHVybiBjdXJyZW50Q2FjaGU7XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIC8vIFdlIHdlcmUgdW5hYmxlIHRvIHJlYWQvcGFyc2UgdGhlIGNhY2hlIGZpbGUgLSB0aGlzIGlzIHBlcmZlY3RseVxuICAgIC8vICB2YWxpZCB3aGVuIHRoZSBjYWNoZSBmaWxlIGhhc24ndCBiZWVuIGNyZWF0ZWQgeWV0LCBhbmQgZXZlbiBpZi93aGVuXG4gICAgLy8gIHRoZSBlcnJvciBpcyBtb3JlIHNlcmlvdXMgLSB3ZSBzaG91bGRuJ3QgYmxvY2sgdGhlIGRlcGxveW1lbnQuXG4gICAgbG9nKCd3YXJuJywgJ1czOiBmYWlsZWQgdG8gcmVhZC9wYXJzZSBjYWNoZSBmaWxlJywgZXJyKTtcbiAgICByZXR1cm4gW107XG4gIH1cbn1cblxuZnVuY3Rpb24gdG9GaWxlTWFwS2V5KGZpbGVQYXRoKSB7XG4gIHJldHVybiBwYXRoLmJhc2VuYW1lKGZpbGVQYXRoKVxuICAgICAgICAgICAgIC50b0xvd2VyQ2FzZSgpXG4gICAgICAgICAgICAgLnJlcGxhY2UoUEFSVF9TVUZGSVgsICcnKTtcbn07XG5cbmZ1bmN0aW9uIHJlYWRNb2REYXRhKGZpbGVQYXRoKSB7XG4gIHJldHVybiBmcy5yZWFkRmlsZUFzeW5jKGZpbGVQYXRoLCB7IGVuY29kaW5nOiAndXRmOCcgfSlcbiAgICAuY2F0Y2goZXJyID0+IFByb21pc2UucmVzb2x2ZSh1bmRlZmluZWQpKTtcbn1cblxuZnVuY3Rpb24gcG9wdWxhdGVDYWNoZShhcGk6IHR5cGVzLklFeHRlbnNpb25BcGksIGFjdGl2ZVByb2ZpbGU6IHR5cGVzLklQcm9maWxlLCBtb2RJZHM/OiBzdHJpbmdbXSwgaW5pdGlhbENhY2hlVmFsdWU/OiBJQ2FjaGVFbnRyeVtdKSB7XG4gIGNvbnN0IHN0YXRlID0gYXBpLnN0b3JlLmdldFN0YXRlKCk7XG4gIGNvbnN0IGxvYWRPcmRlciA9IGdldFBlcnNpc3RlbnRMb2FkT3JkZXIoYXBpKTtcbiAgY29uc3QgbW9kcyA9IHV0aWwuZ2V0U2FmZShzdGF0ZSwgWydwZXJzaXN0ZW50JywgJ21vZHMnLCBHQU1FX0lEXSwge30pO1xuICBjb25zdCBtb2RTdGF0ZSA9IHV0aWwuZ2V0U2FmZShhY3RpdmVQcm9maWxlLCBbJ21vZFN0YXRlJ10sIHt9KTtcblxuICBsZXQgbmV4dEF2YWlsYWJsZUlkID0gT2JqZWN0LmtleXMobG9hZE9yZGVyKS5sZW5ndGg7XG4gIGNvbnN0IGdldE5leHRJZCA9ICgpID0+IHtcbiAgICByZXR1cm4gbmV4dEF2YWlsYWJsZUlkKys7XG4gIH1cbiAgY29uc3QgdG9JZHggPSAobG9JdGVtKSA9PiAobG9hZE9yZGVyLmluZGV4T2YobG9JdGVtKSB8fCBnZXROZXh0SWQoKSk7XG4gIGNvbnN0IGludmFsaWRNb2RUeXBlcyA9IFsnd2l0Y2hlcjNtZW51bW9kZG9jdW1lbnRzJ107XG4gIGNvbnN0IGFmZmVjdGVkTW9kSWRzID0gbW9kSWRzID09PSB1bmRlZmluZWQgPyBPYmplY3Qua2V5cyhtb2RzKSA6IG1vZElkcztcbiAgY29uc3QgZW5hYmxlZE1vZHMgPSBhZmZlY3RlZE1vZElkc1xuICAgIC5maWx0ZXIoa2V5ID0+IChtb2RzW2tleV0/Lmluc3RhbGxhdGlvblBhdGggIT09IHVuZGVmaW5lZClcbiAgICAgICAgICAgICAgICAmJiAhIW1vZFN0YXRlW2tleV0/LmVuYWJsZWQgJiZcbiAgICAgICAgICAgICAgICAhaW52YWxpZE1vZFR5cGVzLmluY2x1ZGVzKG1vZHNba2V5XS50eXBlKSlcbiAgICAuc29ydCgobGhzLCByaHMpID0+ICh0b0lkeChsaHMpKSAtICh0b0lkeChyaHMpKSlcbiAgICAubWFwKGtleSA9PiBtb2RzW2tleV0pO1xuXG4gIGNvbnN0IGdldFJlbGV2YW50TW9kRW50cmllcyA9IGFzeW5jIChzb3VyY2UpID0+IHtcbiAgICBsZXQgYWxsRW50cmllcyA9IFtdO1xuICAgIGF3YWl0IHJlcXVpcmUoJ3R1cmJvd2FsaycpLmRlZmF1bHQoc291cmNlLCBlbnRyaWVzID0+IHtcbiAgICAgIGNvbnN0IHJlbGV2YW50RW50cmllcyA9IGVudHJpZXMuZmlsdGVyKGVudHJ5ID0+XG4gICAgICAgICAgIChlbnRyeS5maWxlUGF0aC5lbmRzV2l0aChQQVJUX1NVRkZJWCkpXG4gICAgICAgICYmIChlbnRyeS5maWxlUGF0aC5pbmRleE9mKElOUFVUX1hNTF9GSUxFTkFNRSkgPT09IC0xKSlcbiAgICAgICAgICAgICAgLm1hcChlbnRyeSA9PiBlbnRyeS5maWxlUGF0aCk7XG5cbiAgICAgIGFsbEVudHJpZXMgPSBbXS5jb25jYXQoYWxsRW50cmllcywgcmVsZXZhbnRFbnRyaWVzKTtcbiAgICB9KS5jYXRjaChlcnIgPT4ge1xuICAgICAgaWYgIChbJ0VOT0VOVCcsICdFTk9URk9VTkQnXS5pbmRleE9mKGVyci5jb2RlKSA9PT0gLTEpIHtcbiAgICAgICAgbG9nKCdlcnJvcicsICdGYWlsZWQgdG8gbG9va3VwIG1lbnUgbW9kIGZpbGVzJyxcbiAgICAgICAgICB7IHBhdGg6IHNvdXJjZSwgZXJyb3I6IGVyci5tZXNzYWdlIH0pO1xuICAgICAgfVxuICAgIH0pXG5cbiAgICByZXR1cm4gYWxsRW50cmllcztcbiAgfTtcblxuICBjb25zdCBzdGFnaW5nRm9sZGVyID0gc2VsZWN0b3JzLmluc3RhbGxQYXRoRm9yR2FtZShzdGF0ZSwgR0FNRV9JRCk7XG4gIHJldHVybiBwcm9taXNlUmVkdWNlKGVuYWJsZWRNb2RzLCAoYWNjdW0sIG1vZDogdHlwZXMuSU1vZCkgPT4ge1xuICAgIGlmIChtb2QuaW5zdGFsbGF0aW9uUGF0aCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICByZXR1cm4gYWNjdW07XG4gICAgfVxuICAgIHJldHVybiBnZXRSZWxldmFudE1vZEVudHJpZXMocGF0aC5qb2luKHN0YWdpbmdGb2xkZXIsIG1vZC5pbnN0YWxsYXRpb25QYXRoKSlcbiAgICAgIC50aGVuKGVudHJpZXMgPT4ge1xuICAgICAgICByZXR1cm4gcHJvbWlzZUVhY2goZW50cmllcywgZmlsZXBhdGggPT4ge1xuICAgICAgICAgIHJldHVybiByZWFkTW9kRGF0YShmaWxlcGF0aClcbiAgICAgICAgICAgIC50aGVuKGRhdGEgPT4ge1xuICAgICAgICAgICAgICBpZiAoZGF0YSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgYWNjdW0ucHVzaCh7IGlkOiBtb2QuaWQsIGZpbGVwYXRoLCBkYXRhIH0pO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KVxuICAgICAgICB9KVxuICAgICAgICAudGhlbigoKSA9PiBQcm9taXNlLnJlc29sdmUoYWNjdW0pKVxuICAgICAgfSlcbiAgfSwgaW5pdGlhbENhY2hlVmFsdWUgIT09IHVuZGVmaW5lZCA/IGluaXRpYWxDYWNoZVZhbHVlIDogW10pXG4gIC50aGVuKG5ld0NhY2hlID0+IHtcbiAgICBjb25zdCBtb2ROYW1lID0gbWVudU1vZChhY3RpdmVQcm9maWxlLm5hbWUpO1xuICAgIGxldCBtb2QgPSB1dGlsLmdldFNhZmUoc3RhdGUsIFsncGVyc2lzdGVudCcsICdtb2RzJywgR0FNRV9JRCwgbW9kTmFtZV0sIHVuZGVmaW5lZCk7XG4gICAgaWYgKG1vZD8uaW5zdGFsbGF0aW9uUGF0aCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICBsb2coJ3dhcm4nLCAnZmFpbGVkIHRvIGFzY2VydGFpbiBpbnN0YWxsYXRpb24gcGF0aCcsIG1vZE5hbWUpO1xuICAgICAgLy8gV2Ugd2lsbCBjcmVhdGUgaXQgb24gdGhlIG5leHQgcnVuLlxuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xuICAgIH1cblxuICAgIHJldHVybiBmcy53cml0ZUZpbGVBc3luYyhwYXRoLmpvaW4oc3RhZ2luZ0ZvbGRlciwgbW9kLmluc3RhbGxhdGlvblBhdGgsIENBQ0hFX0ZJTEVOQU1FKSwgSlNPTi5zdHJpbmdpZnkobmV3Q2FjaGUpKTtcbiAgfSk7XG59XG5cbmZ1bmN0aW9uIGNvbnZlcnRGaWxlUGF0aChmaWxlUGF0aCwgaW5zdGFsbFBhdGgpIHsgXG4gIC8vIFByZS1jb2xsZWN0aW9ucyB3ZSB3b3VsZCB1c2UgYWJzb2x1dGUgcGF0aHMgcG9pbnRpbmdcbiAgLy8gIHRvIHRoZSBtZW51IG1vZCBpbnB1dCBtb2RpZmljYXRpb25zOyB0aGlzIHdpbGwgb2J2aW91c2x5XG4gIC8vICB3b3JrIGp1c3QgZmluZSBvbiB0aGUgY3VyYXRvcidzIGVuZCwgYnV0IHJlbHBhdGhzIHNob3VsZCBiZSB1c2VkXG4gIC8vICBvbiB0aGUgdXNlcidzIGVuZC4gVGhpcyBmdW5jdG9yIHdpbGwgY29udmVydCB0aGUgYWJzIHBhdGggZnJvbVxuICAvLyAgdGhlIGN1cmF0b3IncyBwYXRoIHRvIHRoZSB1c2VyJ3MgcGF0aC5cbiAgY29uc3Qgc2VnbWVudHMgPSBmaWxlUGF0aC5zcGxpdChwYXRoLnNlcCk7XG4gIGNvbnN0IGlkeCA9IHNlZ21lbnRzLnJlZHVjZSgocHJldiwgc2VnLCBpZHgpID0+IHtcbiAgICBpZiAoc2VnLnRvTG93ZXJDYXNlKCkgPT09IEdBTUVfSUQpIHtcbiAgICAgIHJldHVybiBpZHg7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBwcmV2O1xuICAgIH1cbiAgfSwgLTEpO1xuICBpZiAoaWR4ID09PSAtMSkge1xuICAgIGxvZygnZXJyb3InLCAndW5leHBlY3RlZCBtZW51IG1vZCBmaWxlcGF0aCcsIGZpbGVQYXRoKTtcbiAgICByZXR1cm4gZmlsZVBhdGg7XG4gIH1cbiAgLy8gV2Ugc2xpY2Ugb2ZmIGV2ZXJ5dGhpbmcgdXAgdG8gdGhlIEdBTUVfSUQgYW5kIHRoZSAnbW9kcycgZm9sZGVyLlxuICBjb25zdCByZWxQYXRoID0gc2VnbWVudHMuc2xpY2UoaWR4ICsgMikuam9pbihwYXRoLnNlcCk7XG4gIHJldHVybiBwYXRoLmpvaW4oaW5zdGFsbFBhdGgsIHJlbFBhdGgpO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gb25XaWxsRGVwbG95KGFwaSwgZGVwbG95bWVudCwgYWN0aXZlUHJvZmlsZSkge1xuICAvLyBpZiAoIWlzU2V0dGluZ3NNZXJnZVN1cHByZXNzZWQoYXBpKSkge1xuICAvLyAgIHJldHVybjtcbiAgLy8gfVxuICBjb25zdCBzdGF0ZSA9IGFwaS5zdG9yZS5nZXRTdGF0ZSgpO1xuICBpZiAoYWN0aXZlUHJvZmlsZT8ubmFtZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIGNvbnN0IGluc3RhbGxQYXRoID0gc2VsZWN0b3JzLmluc3RhbGxQYXRoRm9yR2FtZShzdGF0ZSwgYWN0aXZlUHJvZmlsZS5nYW1lSWQpO1xuICBjb25zdCBtb2ROYW1lID0gbWVudU1vZChhY3RpdmVQcm9maWxlLm5hbWUpO1xuICBjb25zdCBkZXN0aW5hdGlvbkZvbGRlciA9IHBhdGguam9pbihpbnN0YWxsUGF0aCwgbW9kTmFtZSk7XG4gIGNvbnN0IGdhbWUgPSB1dGlsLmdldEdhbWUoYWN0aXZlUHJvZmlsZS5nYW1lSWQpO1xuICBjb25zdCBkaXNjb3ZlcnkgPSBzZWxlY3RvcnMuZGlzY292ZXJ5QnlHYW1lKHN0YXRlLCBhY3RpdmVQcm9maWxlLmdhbWVJZCk7XG4gIGNvbnN0IG1vZFBhdGhzID0gZ2FtZS5nZXRNb2RQYXRocyhkaXNjb3ZlcnkucGF0aCk7XG4gIGNvbnN0IGRvY01vZFBhdGggPSBtb2RQYXRoc1snd2l0Y2hlcjNtZW51bW9kZG9jdW1lbnRzJ107XG4gIGNvbnN0IGN1cnJlbnRDYWNoZSA9IGF3YWl0IGdldEV4aXN0aW5nQ2FjaGUoc3RhdGUsIGFjdGl2ZVByb2ZpbGUpO1xuICBpZiAoY3VycmVudENhY2hlLmxlbmd0aCA9PT0gMCkge1xuICAgIC8vIE5vdGhpbmcgdG8gY29tcGFyZSwgdXNlciBkb2VzIG5vdCBoYXZlIGEgY2FjaGUuXG4gICAgcmV0dXJuO1xuICB9XG5cbiAgY29uc3QgZG9jRmlsZXMgPSAoZGVwbG95bWVudFsnd2l0Y2hlcjNtZW51bW9kcm9vdCddID8/IFtdKVxuICAgIC5maWx0ZXIoZmlsZSA9PiAoZmlsZS5yZWxQYXRoLmVuZHNXaXRoKFBBUlRfU1VGRklYKSlcbiAgICAgICAgICAgICAgICAgJiYgKGZpbGUucmVsUGF0aC5pbmRleE9mKElOUFVUX1hNTF9GSUxFTkFNRSkgPT09IC0xKSk7XG5cbiAgaWYgKGRvY0ZpbGVzLmxlbmd0aCA8PSAwKSB7XG4gICAgLy8gTm8gZG9jIGZpbGVzLCBubyBwcm9ibGVtLlxuICAgIHJldHVybjtcbiAgfVxuXG4gIGNvbnN0IG1vZHMgPSB1dGlsLmdldFNhZmUoc3RhdGUsIFsncGVyc2lzdGVudCcsICdtb2RzJywgR0FNRV9JRF0sIHt9KTtcbiAgY29uc3QgbW9kU3RhdGUgPSB1dGlsLmdldFNhZmUoYWN0aXZlUHJvZmlsZSwgWydtb2RTdGF0ZSddLCB7fSk7XG4gIGNvbnN0IGludmFsaWRNb2RUeXBlcyA9IFsnd2l0Y2hlcjNtZW51bW9kZG9jdW1lbnRzJ107XG4gIGNvbnN0IGVuYWJsZWRNb2RzID0gT2JqZWN0LmtleXMobW9kcylcbiAgICAuZmlsdGVyKGtleSA9PiAhIW1vZFN0YXRlW2tleV0/LmVuYWJsZWQgJiYgIWludmFsaWRNb2RUeXBlcy5pbmNsdWRlcyhtb2RzW2tleV0udHlwZSkpO1xuXG4gIGNvbnN0IHBhcnNlciA9IG5ldyBJbmlQYXJzZXIuZGVmYXVsdChuZXcgSW5pUGFyc2VyLldpbmFwaUZvcm1hdCgpKTtcblxuICBjb25zdCBmaWxlTWFwID0gYXdhaXQgY2FjaGVUb0ZpbGVNYXAoc3RhdGUsIGFjdGl2ZVByb2ZpbGUpO1xuICBpZiAoZmlsZU1hcCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgY29uc3Qga2V5cyA9IE9iamVjdC5rZXlzKGZpbGVNYXApO1xuICBjb25zdCBtYXRjaGVyID0gKGVudHJ5KSA9PiBrZXlzLmluY2x1ZGVzKHRvRmlsZU1hcEtleShlbnRyeS5yZWxQYXRoKSk7XG4gIGNvbnN0IG5ld0NhY2hlID0gYXdhaXQgcHJvbWlzZVJlZHVjZShrZXlzLCBhc3luYyAoYWNjdW0sIGtleSkgPT4ge1xuICAgIGlmIChkb2NGaWxlcy5maW5kKG1hdGNoZXIpICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGNvbnN0IG1lcmdlZERhdGEgPSBhd2FpdCBwYXJzZXIucmVhZChwYXRoLmpvaW4oZG9jTW9kUGF0aCwga2V5KSk7XG4gICAgICBhd2FpdCBwcm9taXNlRWFjaChmaWxlTWFwW2tleV0sIGFzeW5jIChpdGVyOiBJQ2FjaGVFbnRyeSkgPT4ge1xuICAgICAgICBpZiAoZW5hYmxlZE1vZHMuaW5jbHVkZXMoaXRlci5pZCkpIHtcbiAgICAgICAgICBjb25zdCB0ZW1wUGF0aCA9IHBhdGguam9pbihkZXN0aW5hdGlvbkZvbGRlciwga2V5KSArIGdlbmVyYXRlKCk7XG4gICAgICAgICAgY29uc3QgbW9kRGF0YSA9IGF3YWl0IHRvSW5pRmlsZU9iamVjdChpdGVyLmRhdGEsIHRlbXBQYXRoKTtcbiAgICAgICAgICBjb25zdCBtb2RLZXlzID0gT2JqZWN0LmtleXMobW9kRGF0YS5kYXRhKTtcbiAgICAgICAgICBsZXQgY2hhbmdlZCA9IGZhbHNlO1xuICAgICAgICAgIHJldHVybiBwcm9taXNlRWFjaChtb2RLZXlzLCBtb2RLZXkgPT4ge1xuICAgICAgICAgICAgaWYgKChtZXJnZWREYXRhLmRhdGFbbW9kS2V5XSAhPT0gdW5kZWZpbmVkKVxuICAgICAgICAgICAgICAmJiAobW9kRGF0YS5kYXRhW21vZEtleV0gIT09IHVuZGVmaW5lZClcbiAgICAgICAgICAgICAgJiYgKG1lcmdlZERhdGEuZGF0YVttb2RLZXldICE9PSBtb2REYXRhLmRhdGFbbW9kS2V5XSkpIHtcbiAgICAgICAgICAgICAgICBtb2REYXRhLmRhdGFbbW9kS2V5XSA9IG1lcmdlZERhdGEuZGF0YVttb2RLZXldO1xuICAgICAgICAgICAgICAgIGNoYW5nZWQgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pLnRoZW4oYXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgbGV0IG5ld01vZERhdGE7XG4gICAgICAgICAgICBpZiAoY2hhbmdlZCkge1xuICAgICAgICAgICAgICBhd2FpdCBwYXJzZXIud3JpdGUoaXRlci5maWxlcGF0aCwgbW9kRGF0YSk7XG4gICAgICAgICAgICAgIG5ld01vZERhdGEgPSBhd2FpdCByZWFkTW9kRGF0YShpdGVyLmZpbGVwYXRoKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIG5ld01vZERhdGEgPSBpdGVyLmRhdGE7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChuZXdNb2REYXRhICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgYWNjdW0ucHVzaCh7IGlkOiBpdGVyLmlkLCBmaWxlcGF0aDogaXRlci5maWxlcGF0aCwgZGF0YTogbmV3TW9kRGF0YSB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoYWNjdW0pO1xuICB9LCBbXSk7XG5cbiAgcmV0dXJuIGZzLndyaXRlRmlsZUFzeW5jKHBhdGguam9pbihkZXN0aW5hdGlvbkZvbGRlciwgQ0FDSEVfRklMRU5BTUUpLCBKU09OLnN0cmluZ2lmeShuZXdDYWNoZSkpO1xufVxuXG5hc3luYyBmdW5jdGlvbiB0b0luaUZpbGVPYmplY3QoZGF0YSwgdGVtcERlc3QpIHtcbiAgLy8gR2l2ZW4gdGhhdCB3aW5hcGkgcmVxdWlyZXMgYSBmaWxlIHRvIGNvcnJlY3RseSByZWFkL3BhcnNlXG4gIC8vICBhbiBJbmlGaWxlIG9iamVjdCwgd2UncmUgZ29pbmcgdG8gdXNlIHRoaXMgaGFja3kgZGlzZ3VzdGluZ1xuICAvLyAgZnVuY3Rpb24gdG8gcXVpY2tseSBjcmVhdGUgYSB0ZW1wIGZpbGUsIHJlYWQgaXQsIGRlc3Ryb3kgaXRcbiAgLy8gIGFuZCByZXR1cm4gdGhlIG9iamVjdCBiYWNrIHRvIHRoZSBjYWxsZXIuXG4gIHRyeSB7XG4gICAgYXdhaXQgZnMud3JpdGVGaWxlQXN5bmModGVtcERlc3QsIGRhdGEsIHsgZW5jb2Rpbmc6ICd1dGY4JyB9KTtcbiAgICBjb25zdCBwYXJzZXIgPSBuZXcgSW5pUGFyc2VyLmRlZmF1bHQobmV3IEluaVBhcnNlci5XaW5hcGlGb3JtYXQoKSk7XG4gICAgY29uc3QgaW5pRGF0YSA9IGF3YWl0IHBhcnNlci5yZWFkKHRlbXBEZXN0KTtcbiAgICBhd2FpdCBmcy5yZW1vdmVBc3luYyh0ZW1wRGVzdCk7XG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShpbmlEYXRhKTtcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgcmV0dXJuIFByb21pc2UucmVqZWN0KGVycik7XG4gIH1cbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIG9uRGlkRGVwbG95KGFwaSwgZGVwbG95bWVudCwgYWN0aXZlUHJvZmlsZSkge1xuICAvLyBpZiAoIWlzU2V0dGluZ3NNZXJnZVN1cHByZXNzZWQoYXBpKSkge1xuICAvLyAgIHJldHVybjtcbiAgLy8gfVxuICBjb25zdCBzdGF0ZSA9IGFwaS5zdG9yZS5nZXRTdGF0ZSgpO1xuICBjb25zdCBsb2FkT3JkZXIgPSBnZXRQZXJzaXN0ZW50TG9hZE9yZGVyKGFwaSk7XG4gIGNvbnN0IGRvY0ZpbGVzID0gZGVwbG95bWVudFsnd2l0Y2hlcjNtZW51bW9kcm9vdCddLmZpbHRlcihmaWxlID0+IChmaWxlLnJlbFBhdGguZW5kc1dpdGgoUEFSVF9TVUZGSVgpKVxuICAgICYmIChmaWxlLnJlbFBhdGguaW5kZXhPZihJTlBVVF9YTUxfRklMRU5BTUUpID09PSAtMSkpO1xuXG4gIGlmIChkb2NGaWxlcy5sZW5ndGggPD0gMCkge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGNvbnN0IG1vZHMgPSB1dGlsLmdldFNhZmUoc3RhdGUsIFsncGVyc2lzdGVudCcsICdtb2RzJywgR0FNRV9JRF0sIHt9KTtcbiAgY29uc3QgbW9kU3RhdGUgPSB1dGlsLmdldFNhZmUoYWN0aXZlUHJvZmlsZSwgWydtb2RTdGF0ZSddLCB7fSk7XG4gIGxldCBuZXh0QXZhaWxhYmxlSWQgPSBsb2FkT3JkZXIubGVuZ3RoO1xuICBjb25zdCBnZXROZXh0SWQgPSAoKSA9PiB7XG4gICAgcmV0dXJuIG5leHRBdmFpbGFibGVJZCsrO1xuICB9XG4gIGNvbnN0IGludmFsaWRNb2RUeXBlcyA9IFsnd2l0Y2hlcjNtZW51bW9kZG9jdW1lbnRzJ107XG4gIGNvbnN0IGVuYWJsZWRNb2RzID0gT2JqZWN0LmtleXMobW9kcylcbiAgICAuZmlsdGVyKGtleSA9PiAhIW1vZFN0YXRlW2tleV0/LmVuYWJsZWQgJiYgIWludmFsaWRNb2RUeXBlcy5pbmNsdWRlcyhtb2RzW2tleV0udHlwZSkpXG4gICAgLnNvcnQoKGxocywgcmhzKSA9PiAobG9hZE9yZGVyW3Joc10/LnBvcyB8fCBnZXROZXh0SWQoKSkgLSAobG9hZE9yZGVyW2xoc10/LnBvcyB8fCBnZXROZXh0SWQoKSkpXG5cbiAgY29uc3QgY3VycmVudENhY2hlID0gYXdhaXQgZ2V0RXhpc3RpbmdDYWNoZShzdGF0ZSwgYWN0aXZlUHJvZmlsZSk7XG4gIGNvbnN0IGluQ2FjaGUgPSBuZXcgU2V0KGN1cnJlbnRDYWNoZS5tYXAoZW50cnkgPT4gZW50cnkuaWQpKTtcbiAgY29uc3Qgbm90SW5DYWNoZTogU2V0PHN0cmluZz4gPSBuZXcgU2V0KGRvY0ZpbGVzLm1hcChmaWxlID0+IGZpbGUuc291cmNlKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5maWx0ZXIobW9kSWQgPT4gIWluQ2FjaGUuaGFzKG1vZElkKSkpO1xuICByZXR1cm4gZW5zdXJlTWVudU1vZChhcGksIGFjdGl2ZVByb2ZpbGUpXG4gICAgLnRoZW4oKCkgPT4gKChjdXJyZW50Q2FjaGUubGVuZ3RoID09PSAwKSAmJiAoZW5hYmxlZE1vZHMubGVuZ3RoID4gMCkpXG4gICAgICA/IHBvcHVsYXRlQ2FjaGUoYXBpLCBhY3RpdmVQcm9maWxlKVxuICAgICAgOiAobm90SW5DYWNoZS5zaXplICE9PSAwKVxuICAgICAgICA/IHBvcHVsYXRlQ2FjaGUoYXBpLCBhY3RpdmVQcm9maWxlLCBBcnJheS5mcm9tKG5vdEluQ2FjaGUpLCBjdXJyZW50Q2FjaGUpXG4gICAgICAgIDogUHJvbWlzZS5yZXNvbHZlKCkpXG4gICAgLnRoZW4oKCkgPT4gd3JpdGVDYWNoZVRvRmlsZXMoYXBpLCBhY3RpdmVQcm9maWxlKSlcbiAgICAudGhlbigoKSA9PiBtZW51TW9kKGFjdGl2ZVByb2ZpbGUubmFtZSkpXG4gICAgLmNhdGNoKGVyciA9PiAoZXJyIGluc3RhbmNlb2YgdXRpbC5Vc2VyQ2FuY2VsZWQpXG4gICAgICA/IFByb21pc2UucmVzb2x2ZSgpXG4gICAgICA6IFByb21pc2UucmVqZWN0KGVycikpO1xufVxuXG5mdW5jdGlvbiBzYW5pdGl6ZVByb2ZpbGVOYW1lKGlucHV0KSB7XG4gIHJldHVybiBpbnB1dC5yZXBsYWNlKElOVkFMSURfQ0hBUlMsICdfJyk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBtZW51TW9kKHByb2ZpbGVOYW1lKSB7XG4gIHJldHVybiBgV2l0Y2hlciAzIE1lbnUgTW9kIERhdGEgKCR7c2FuaXRpemVQcm9maWxlTmFtZShwcm9maWxlTmFtZSl9KWA7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGNyZWF0ZU1lbnVNb2QoYXBpLCBtb2ROYW1lLCBwcm9maWxlKSB7XG4gIGNvbnN0IG1vZCA9IHtcbiAgICBpZDogbW9kTmFtZSxcbiAgICBzdGF0ZTogJ2luc3RhbGxlZCcsXG4gICAgYXR0cmlidXRlczoge1xuICAgICAgbmFtZTogJ1dpdGNoZXIgMyBNZW51IE1vZCcsXG4gICAgICBkZXNjcmlwdGlvbjogJ1RoaXMgbW9kIGlzIGEgY29sbGVjdGl2ZSBtZXJnZSBvZiBzZXR0aW5nIGZpbGVzIHJlcXVpcmVkIGJ5IGFueS9hbGwgJ1xuICAgICAgICAgICAgICAgICArICdtZW51IG1vZHMgdGhlIHVzZXIgaGFzIGluc3RhbGxlZCAtIHBsZWFzZSBkbyBub3QgZGlzYWJsZS9yZW1vdmUgdW5sZXNzICdcbiAgICAgICAgICAgICAgICAgKyAnYWxsIG1lbnUgbW9kcyBoYXZlIGJlZW4gcmVtb3ZlZCBmcm9tIHlvdXIgZ2FtZSBmaXJzdC4nLFxuICAgICAgbG9naWNhbEZpbGVOYW1lOiAnV2l0Y2hlciAzIE1lbnUgTW9kJyxcbiAgICAgIG1vZElkOiA0MiwgLy8gTWVhbmluZyBvZiBsaWZlXG4gICAgICB2ZXJzaW9uOiAnMS4wLjAnLFxuICAgICAgdmFyaWFudDogc2FuaXRpemVQcm9maWxlTmFtZShwcm9maWxlLm5hbWUucmVwbGFjZShJTlZBTElEX0NIQVJTLCAnXycpKSxcbiAgICAgIGluc3RhbGxUaW1lOiBuZXcgRGF0ZSgpLFxuICAgIH0sXG4gICAgaW5zdGFsbGF0aW9uUGF0aDogbW9kTmFtZSxcbiAgICB0eXBlOiAnd2l0Y2hlcjNtZW51bW9kZG9jdW1lbnRzJyxcbiAgfTtcblxuICByZXR1cm4gYXdhaXQgbmV3IFByb21pc2U8dm9pZD4oKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgIGFwaS5ldmVudHMuZW1pdCgnY3JlYXRlLW1vZCcsIHByb2ZpbGUuZ2FtZUlkLCBtb2QsIGFzeW5jIChlcnJvcikgPT4ge1xuICAgICAgaWYgKGVycm9yICE9PSBudWxsKSB7XG4gICAgICAgIHJldHVybiByZWplY3QoZXJyb3IpO1xuICAgICAgfVxuICAgICAgcmVzb2x2ZSgpO1xuICAgIH0pO1xuICB9KTtcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHJlbW92ZU1lbnVNb2QoYXBpLCBwcm9maWxlKSB7XG4gIC8vIGlmICghaXNTZXR0aW5nc01lcmdlU3VwcHJlc3NlZChhcGkpKSB7XG4gIC8vICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xuICAvLyB9XG4gIGNvbnN0IHN0YXRlID0gYXBpLnN0b3JlLmdldFN0YXRlKCk7XG4gIGNvbnN0IG1vZE5hbWUgPSBtZW51TW9kKHByb2ZpbGUubmFtZSk7XG4gIGNvbnN0IG1vZCA9IHV0aWwuZ2V0U2FmZShzdGF0ZSwgWydwZXJzaXN0ZW50JywgJ21vZHMnLCBwcm9maWxlLmdhbWVJZCwgbW9kTmFtZV0sIHVuZGVmaW5lZCk7XG4gIGlmIChtb2QgPT09IHVuZGVmaW5lZCkge1xuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcbiAgfVxuICByZXR1cm4gbmV3IFByb21pc2U8dm9pZD4oKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgIGFwaS5ldmVudHMuZW1pdCgncmVtb3ZlLW1vZCcsIHByb2ZpbGUuZ2FtZUlkLCBtb2QuaWQsIGFzeW5jIChlcnJvcikgPT4ge1xuICAgICAgaWYgKGVycm9yICE9PSBudWxsKSB7XG4gICAgICAgIC8vIFRoZSBmYWN0IHRoYXQgd2UncmUgYXR0ZW1wdGluZyB0byByZW1vdmUgdGhlIGFnZ3JlZ2F0ZWQgbWVudSBtb2QgbWVhbnMgdGhhdFxuICAgICAgICAvLyAgdGhlIHVzZXIgbm8gbG9uZ2VyIGhhcyBhbnkgbWVudSBtb2RzIGluc3RhbGxlZCBhbmQgdGhlcmVmb3JlIGl0J3Mgc2FmZSB0b1xuICAgICAgICAvLyAgaWdub3JlIGFueSBlcnJvcnMgdGhhdCBtYXkgaGF2ZSBiZWVuIHJhaXNlZCBkdXJpbmcgcmVtb3ZhbC5cbiAgICAgICAgLy8gVGhlIG1haW4gcHJvYmxlbSBoZXJlIGlzIHRoZSBmYWN0IHRoYXQgdXNlcnMgYXJlIGFjdGl2ZWx5IG1lc3Npbmcgd2l0aFxuICAgICAgICAvLyAgdGhlIG1lbnUgbW9kIHdlIGdlbmVyYXRlIGNhdXNpbmcgb2RkIGVycm9ycyB0byBwb3AgdXAuXG4gICAgICAgIGxvZygnZXJyb3InLCAnZmFpbGVkIHRvIHJlbW92ZSBtZW51IG1vZCcsIGVycm9yKTtcbiAgICAgICAgLy8gcmV0dXJuIHJlamVjdChlcnJvcik7XG4gICAgICB9XG4gICAgICByZXR1cm4gcmVzb2x2ZSgpO1xuICAgIH0pO1xuICB9KTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gY2FjaGVUb0ZpbGVNYXAoc3RhdGUsIHByb2ZpbGUpIHtcbiAgLy8gT3JnYW5pemVzIGNhY2hlIGVudHJpZXMgaW50byBhIGZpbGVNYXAgd2hpY2hcbiAgLy8gIGNhbiBiZSB1c2VkIHRvIGxvb3AgdGhyb3VnaCBlYWNoIG1vZCBlbnRyeSdzXG4gIC8vICBkYXRhIG9uIGEgcGVyIGZpbGUgYmFzaXMuXG4gIGNvbnN0IGN1cnJlbnRDYWNoZSA9IGF3YWl0IGdldEV4aXN0aW5nQ2FjaGUoc3RhdGUsIHByb2ZpbGUpO1xuICBpZiAoY3VycmVudENhY2hlLmxlbmd0aCA9PT0gMCkge1xuICAgIC8vIE5vdGhpbmcgdG8gZG8gaGVyZS5cbiAgICByZXR1cm4gdW5kZWZpbmVkO1xuICB9XG5cbiAgY29uc3Qgc3RhZ2luZ0ZvbGRlciA9IHNlbGVjdG9ycy5pbnN0YWxsUGF0aEZvckdhbWUoc3RhdGUsIEdBTUVfSUQpO1xuICBjb25zdCBmaWxlTWFwID0gY3VycmVudENhY2hlLnJlZHVjZSgoYWNjdW0sIGVudHJ5KSA9PiB7XG4gICAgYWNjdW1bdG9GaWxlTWFwS2V5KGVudHJ5LmZpbGVwYXRoKV0gPVxuICAgICAgW10uY29uY2F0KGFjY3VtW3RvRmlsZU1hcEtleShlbnRyeS5maWxlcGF0aCldIHx8IFtdLFxuICAgICAgW3tcbiAgICAgICAgaWQ6IGVudHJ5LmlkLFxuICAgICAgICBkYXRhOiBlbnRyeS5kYXRhLFxuICAgICAgICBmaWxlcGF0aDogY29udmVydEZpbGVQYXRoKGVudHJ5LmZpbGVwYXRoLCBzdGFnaW5nRm9sZGVyKSxcbiAgICAgIH1dKTtcblxuICAgIHJldHVybiBhY2N1bTtcbiAgfSwge30pO1xuXG4gIHJldHVybiBmaWxlTWFwO1xufVxuXG5jb25zdCBjb3B5SW5pRmlsZSA9IChzb3VyY2U6IHN0cmluZywgZGVzdDogc3RyaW5nKSA9PiBmcy5jb3B5QXN5bmMoc291cmNlLCBkZXN0KVxuICAgIC50aGVuKCgpID0+IFByb21pc2UucmVzb2x2ZShkZXN0KSkuY2F0Y2goZXJyID0+IFByb21pc2UucmVzb2x2ZSh1bmRlZmluZWQpKTtcblxuY29uc3QgZ2V0SW5pdGlhbERvYyA9IChmaWxlUGF0aDogc3RyaW5nKSA9PiB7XG4gIHJldHVybiBmcy5zdGF0QXN5bmMoZmlsZVBhdGggKyBCQUNLVVBfVEFHKVxuICAgIC50aGVuKCgpID0+IFByb21pc2UucmVzb2x2ZShmaWxlUGF0aCArIEJBQ0tVUF9UQUcpKVxuICAgIC5jYXRjaChlcnIgPT4gZnMuc3RhdEFzeW5jKGZpbGVQYXRoKVxuICAgICAgLnRoZW4oKCkgPT4gUHJvbWlzZS5yZXNvbHZlKGZpbGVQYXRoKSkpXG4gICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAvLyBXZSBjb3VsZG4ndCBmaW5kIHRoZSBvcmlnaW5hbCBkb2N1bWVudC4gVGhpc1xuICAgICAgLy8gIGNhbiBwb3RlbnRpYWxseSBoYXBwZW4gd2hlbiB0aGUgLnBhcnQudHh0IHN1ZmZpeFxuICAgICAgLy8gIGdldHMgYWRkZWQgdG8gZmlsZXMgdGhhdCBhcmUgbm90IHN1cHBvc2VkIHRvIGJlXG4gICAgICAvLyAgZGVwbG95ZWQgdG8gdGhlIGRvY3VtZW50cyBmb2xkZXIsIGxvZyBhbmQgY29udGludWUuXG4gICAgICBsb2coJ3dhcm4nLCAnVzM6IGNhbm5vdCBmaW5kIG9yaWdpbmFsIGZpbGUnLCBlcnIubWVzc2FnZSk7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHVuZGVmaW5lZCk7XG4gICAgfSk7XG59O1xuXG5hc3luYyBmdW5jdGlvbiB3cml0ZUNhY2hlVG9GaWxlcyhhcGksIHByb2ZpbGUpIHtcbiAgY29uc3Qgc3RhdGUgPSBhcGkuc3RvcmUuZ2V0U3RhdGUoKTtcbiAgY29uc3QgbW9kTmFtZSA9IG1lbnVNb2QocHJvZmlsZS5uYW1lKTtcbiAgY29uc3QgaW5zdGFsbFBhdGggPSBzZWxlY3RvcnMuaW5zdGFsbFBhdGhGb3JHYW1lKHN0YXRlLCBwcm9maWxlLmdhbWVJZCk7XG4gIGNvbnN0IGRlc3RpbmF0aW9uRm9sZGVyID0gcGF0aC5qb2luKGluc3RhbGxQYXRoLCBtb2ROYW1lKTtcbiAgY29uc3QgZ2FtZSA9IHV0aWwuZ2V0R2FtZShwcm9maWxlLmdhbWVJZCk7XG4gIGNvbnN0IGRpc2NvdmVyeSA9IHNlbGVjdG9ycy5kaXNjb3ZlcnlCeUdhbWUoc3RhdGUsIHByb2ZpbGUuZ2FtZUlkKTtcbiAgY29uc3QgbW9kUGF0aHMgPSBnYW1lLmdldE1vZFBhdGhzKGRpc2NvdmVyeS5wYXRoKTtcbiAgY29uc3QgZG9jTW9kUGF0aCA9IG1vZFBhdGhzWyd3aXRjaGVyM21lbnVtb2Rkb2N1bWVudHMnXTtcbiAgY29uc3QgY3VycmVudENhY2hlID0gYXdhaXQgZ2V0RXhpc3RpbmdDYWNoZShzdGF0ZSwgcHJvZmlsZSk7XG4gIGlmIChjdXJyZW50Q2FjaGUubGVuZ3RoID09PSAwKSByZXR1cm47XG5cbiAgY29uc3QgZmlsZU1hcCA9IGF3YWl0IGNhY2hlVG9GaWxlTWFwKHN0YXRlLCBwcm9maWxlKTtcbiAgaWYgKCFmaWxlTWFwKSByZXR1cm47XG5cbiAgY29uc3QgcGFyc2VyID0gbmV3IEluaVBhcnNlci5kZWZhdWx0KG5ldyBJbmlQYXJzZXIuV2luYXBpRm9ybWF0KCkpO1xuICBjb25zdCBrZXlzID0gT2JqZWN0LmtleXMoZmlsZU1hcCk7XG5cbiAgZm9yIChjb25zdCBrZXkgb2Yga2V5cykge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCBzb3VyY2UgPSBhd2FpdCBnZXRJbml0aWFsRG9jKHBhdGguam9pbihkb2NNb2RQYXRoLCBrZXkpKTtcbiAgICAgIGlmICghc291cmNlKSBjb250aW51ZTtcblxuICAgICAgYXdhaXQgY29weUluaUZpbGUoc291cmNlLCBwYXRoLmpvaW4oZGVzdGluYXRpb25Gb2xkZXIsIGtleSkpO1xuICAgICAgY29uc3QgaW5pdGlhbERhdGEgPSBhd2FpdCBwYXJzZXIucmVhZChwYXRoLmpvaW4oZGVzdGluYXRpb25Gb2xkZXIsIGtleSkpO1xuXG4gICAgICBmb3IgKGNvbnN0IG1vZEVudHJ5IG9mIGZpbGVNYXBba2V5XSkge1xuICAgICAgICBjb25zdCB0ZW1wRmlsZVBhdGggPSBwYXRoLmpvaW4oZGVzdGluYXRpb25Gb2xkZXIsIGtleSkgKyBnZW5lcmF0ZSgpO1xuICAgICAgICBjb25zdCBtb2REYXRhID0gYXdhaXQgdG9JbmlGaWxlT2JqZWN0KG1vZEVudHJ5LmRhdGEsIHRlbXBGaWxlUGF0aCk7XG5cbiAgICAgICAgZm9yIChjb25zdCBtb2RLZXkgb2YgT2JqZWN0LmtleXMobW9kRGF0YS5kYXRhKSkge1xuICAgICAgICAgIGluaXRpYWxEYXRhLmRhdGFbbW9kS2V5XSA9IHtcbiAgICAgICAgICAgIC4uLmluaXRpYWxEYXRhLmRhdGFbbW9kS2V5XSxcbiAgICAgICAgICAgIC4uLm1vZERhdGEuZGF0YVttb2RLZXldLFxuICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGF3YWl0IHBhcnNlci53cml0ZShwYXRoLmpvaW4oZGVzdGluYXRpb25Gb2xkZXIsIGtleSksIGluaXRpYWxEYXRhKTtcbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgIGlmIChlcnIuY29kZSA9PT0gJ0VOT0VOVCcgJiYgW1xuICAgICAgICBwYXRoLmpvaW4oZG9jTW9kUGF0aCwgSU5QVVRfU0VUVElOR1NfRklMRU5BTUUpLFxuICAgICAgICBwYXRoLmpvaW4oZG9jTW9kUGF0aCwgRFhfMTFfVVNFUl9TRVRUSU5HU19GSUxFTkFNRSksXG4gICAgICAgIHBhdGguam9pbihkb2NNb2RQYXRoLCBEWF8xMl9VU0VSX1NFVFRJTkdTX0ZJTEVOQU1FKSxcbiAgICAgIF0uaW5jbHVkZXMoZXJyLnBhdGgpKSB7XG4gICAgICAgIGFwaS5zaG93RXJyb3JOb3RpZmljYXRpb24oJ0ZhaWxlZCB0byBpbnN0YWxsIG1lbnUgbW9kJywgbmV3IHV0aWwuRGF0YUludmFsaWQoJ1JlcXVpcmVkIHNldHRpbmcgZmlsZXMgYXJlIG1pc3NpbmcgLSBwbGVhc2UgcnVuIHRoZSBnYW1lIGF0IGxlYXN0IG9uY2UgYW5kIHRyeSBhZ2Fpbi4nKSwgeyBhbGxvd1JlcG9ydDogZmFsc2UgfSk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIHRocm93IGVycjtcbiAgICB9XG4gIH1cbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGVuc3VyZU1lbnVNb2QoYXBpLCBwcm9maWxlKSB7XG4gIC8vIGlmICghaXNTZXR0aW5nc01lcmdlU3VwcHJlc3NlZChhcGkpKSB7XG4gIC8vICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh1bmRlZmluZWQpO1xuICAvLyB9XG4gIGNvbnN0IHN0YXRlID0gYXBpLnN0b3JlLmdldFN0YXRlKCk7XG4gIGNvbnN0IG1vZE5hbWUgPSBtZW51TW9kKHByb2ZpbGUubmFtZSk7XG4gIGNvbnN0IG1vZCA9IHV0aWwuZ2V0U2FmZShzdGF0ZSwgWydwZXJzaXN0ZW50JywgJ21vZHMnLCBwcm9maWxlLmdhbWVJZCwgbW9kTmFtZV0sIHVuZGVmaW5lZCk7XG4gIGlmIChtb2QgPT09IHVuZGVmaW5lZCkge1xuICAgIHRyeSB7XG4gICAgICBhd2FpdCBjcmVhdGVNZW51TW9kKGFwaSwgbW9kTmFtZSwgcHJvZmlsZSk7XG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoZXJyKTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgLy8gZ2l2ZSB0aGUgdXNlciBhbiBpbmRpY2F0aW9uIHdoZW4gdGhpcyB3YXMgbGFzdCB1cGRhdGVkXG4gICAgYXBpLnN0b3JlLmRpc3BhdGNoKGFjdGlvbnMuc2V0TW9kQXR0cmlidXRlKHByb2ZpbGUuZ2FtZUlkLCBtb2ROYW1lLCAnaW5zdGFsbFRpbWUnLCBuZXcgRGF0ZSgpKSk7XG4gICAgLy8gdGhlIHJlc3QgaGVyZSBpcyBvbmx5IHJlcXVpcmVkIHRvIHVwZGF0ZSBtb2RzIGZyb20gcHJldmlvdXMgdm9ydGV4IHZlcnNpb25zXG4gICAgYXBpLnN0b3JlLmRpc3BhdGNoKGFjdGlvbnMuc2V0TW9kQXR0cmlidXRlKHByb2ZpbGUuZ2FtZUlkLCBtb2ROYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnbmFtZScsICdXaXRjaGVyIDMgTWVudSBNb2QnKSk7XG5cbiAgICBhcGkuc3RvcmUuZGlzcGF0Y2goYWN0aW9ucy5zZXRNb2RBdHRyaWJ1dGUocHJvZmlsZS5nYW1lSWQsIG1vZE5hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICd0eXBlJywgJ3dpdGNoZXIzbWVudW1vZGRvY3VtZW50cycpKTtcblxuICAgIGFwaS5zdG9yZS5kaXNwYXRjaChhY3Rpb25zLnNldE1vZEF0dHJpYnV0ZShwcm9maWxlLmdhbWVJZCwgbW9kTmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ2xvZ2ljYWxGaWxlTmFtZScsICdXaXRjaGVyIDMgTWVudSBNb2QnKSk7XG4gICAgYXBpLnN0b3JlLmRpc3BhdGNoKGFjdGlvbnMuc2V0TW9kQXR0cmlidXRlKHByb2ZpbGUuZ2FtZUlkLCBtb2ROYW1lLCAnbW9kSWQnLCA0MikpO1xuICAgIGFwaS5zdG9yZS5kaXNwYXRjaChhY3Rpb25zLnNldE1vZEF0dHJpYnV0ZShwcm9maWxlLmdhbWVJZCwgbW9kTmFtZSwgJ3ZlcnNpb24nLCAnMS4wLjAnKSk7XG4gICAgYXBpLnN0b3JlLmRpc3BhdGNoKGFjdGlvbnMuc2V0TW9kQXR0cmlidXRlKHByb2ZpbGUuZ2FtZUlkLCBtb2ROYW1lLCAndmFyaWFudCcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNhbml0aXplUHJvZmlsZU5hbWUocHJvZmlsZS5uYW1lKSkpO1xuICB9XG4gIHJldHVybiBQcm9taXNlLnJlc29sdmUobW9kTmFtZSk7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBleHBvcnRNZW51TW9kKGFwaSwgcHJvZmlsZSwgaW5jbHVkZWRNb2RzKSB7XG4gIC8vIGlmICghaXNTZXR0aW5nc01lcmdlU3VwcHJlc3NlZChhcGkpKSB7XG4gIC8vICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgLy8gfVxuICB0cnkge1xuICAgIGNvbnN0IGRlcGxveW1lbnQgPSBhd2FpdCBnZXREZXBsb3ltZW50KGFwaSwgaW5jbHVkZWRNb2RzKTtcbiAgICBpZiAoZGVwbG95bWVudCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0ZhaWxlZCB0byBnZXQgZGVwbG95bWVudCcpO1xuICAgIH1cbiAgICBjb25zdCBtb2ROYW1lID0gYXdhaXQgb25EaWREZXBsb3koYXBpLCBkZXBsb3ltZW50LCBwcm9maWxlKTtcbiAgICBpZiAobW9kTmFtZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAvLyBUaGUgaW5zdGFsbGVkIG1vZHMgZG8gbm90IHJlcXVpcmUgYSBtZW51IG1vZC5cbiAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfVxuICAgIGNvbnN0IG1vZHMgPSB1dGlsLmdldFNhZmUoYXBpLmdldFN0YXRlKCksIFsncGVyc2lzdGVudCcsICdtb2RzJywgR0FNRV9JRF0sIHt9KTtcbiAgICBjb25zdCBtb2RJZCA9IE9iamVjdC5rZXlzKG1vZHMpLmZpbmQoaWQgPT4gaWQgPT09IG1vZE5hbWUpO1xuICAgIGlmIChtb2RJZCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ01lbnUgbW9kIGlzIG1pc3NpbmcnKTtcbiAgICB9XG4gICAgY29uc3QgaW5zdGFsbFBhdGggPSBzZWxlY3RvcnMuaW5zdGFsbFBhdGhGb3JHYW1lKGFwaS5nZXRTdGF0ZSgpLCBHQU1FX0lEKTtcbiAgICBjb25zdCBtb2RQYXRoID0gcGF0aC5qb2luKGluc3RhbGxQYXRoLCBtb2RzW21vZElkXS5pbnN0YWxsYXRpb25QYXRoKTtcbiAgICBjb25zdCBkYXRhID0gYXdhaXQgcHJlcGFyZUZpbGVEYXRhKG1vZFBhdGgpO1xuICAgIHJldHVybiBkYXRhO1xuICB9IGNhdGNoIChlcnIpIHtcbiAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoZXJyKTtcbiAgfVxufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gaW1wb3J0TWVudU1vZChhcGksIHByb2ZpbGUsIGZpbGVEYXRhKSB7XG4gIC8vIGlmICghaXNTZXR0aW5nc01lcmdlU3VwcHJlc3NlZChhcGkpKSB7XG4gIC8vICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh1bmRlZmluZWQpO1xuICAvLyB9XG4gIHRyeSB7XG4gICAgY29uc3QgbW9kTmFtZSA9IGF3YWl0IGVuc3VyZU1lbnVNb2QoYXBpLCBwcm9maWxlKTtcbiAgICBjb25zdCBtb2QgPSB1dGlsLmdldFNhZmUoYXBpLmdldFN0YXRlKCksIFsncGVyc2lzdGVudCcsICdtb2RzJywgcHJvZmlsZS5nYW1lSWQsIG1vZE5hbWVdLCB1bmRlZmluZWQpO1xuICAgIGNvbnN0IGluc3RhbGxQYXRoID0gc2VsZWN0b3JzLmluc3RhbGxQYXRoRm9yR2FtZShhcGkuZ2V0U3RhdGUoKSwgR0FNRV9JRCk7XG4gICAgY29uc3QgZGVzdFBhdGggPSBwYXRoLmpvaW4oaW5zdGFsbFBhdGgsIG1vZC5pbnN0YWxsYXRpb25QYXRoKTtcbiAgICBhd2FpdCByZXN0b3JlRmlsZURhdGEoZmlsZURhdGEsIGRlc3RQYXRoKTtcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgcmV0dXJuIFByb21pc2UucmVqZWN0KGVycik7XG4gIH1cbn1cbiJdfQ==