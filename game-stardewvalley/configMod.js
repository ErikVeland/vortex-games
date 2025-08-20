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
exports.onAddedFiles = exports.onRevertFiles = exports.applyToModConfig = exports.onWillEnableMods = exports.ensureConfigMod = exports.addModConfig = exports.registerConfigMod = void 0;
const path_1 = __importDefault(require("path"));
const vortex_api_1 = require("vortex-api");
const common_1 = require("./common");
const actions_1 = require("./actions");
const util_1 = require("./util");
const SMAPI_1 = require("./SMAPI");
const syncWrapper = (api) => {
    onSyncModConfigurations(api);
};
function registerConfigMod(context) {
    context.registerAction('mod-icons', 999, 'swap', {}, 'Sync Mod Configurations', () => syncWrapper(context.api), () => {
        const state = context.api.store.getState();
        const gameMode = vortex_api_1.selectors.activeGameId(state);
        return (gameMode === common_1.GAME_ID);
    });
}
exports.registerConfigMod = registerConfigMod;
function onSyncModConfigurations(api, silent) {
    return __awaiter(this, void 0, void 0, function* () {
        const state = api.getState();
        const profile = vortex_api_1.selectors.activeProfile(state);
        if ((profile === null || profile === void 0 ? void 0 : profile.gameId) !== common_1.GAME_ID) {
            return;
        }
        const smapiTool = (0, SMAPI_1.findSMAPITool)(api);
        if (!(smapiTool === null || smapiTool === void 0 ? void 0 : smapiTool.path)) {
            api.showErrorNotification('SMAPI is not installed/configured', 'This feature requires Vortex to know the location of SMAPI. Please ensure that SMAPI is at least configured as a tool in Vortex.', { allowReport: false });
            return;
        }
        const mergeConfigs = vortex_api_1.util.getSafe(state, ['settings', 'SDV', 'mergeConfigs', profile.id], false);
        if (!mergeConfigs) {
            if (silent) {
                return;
            }
            const result = yield api.showDialog('info', 'Mod Configuration Sync', {
                bbcode: 'Many Stardew Valley mods generate their own configuration files during game play. By default the generated files are, '
                    + 'ingested by their respective mods.[br][/br][br][/br]'
                    + 'Unfortunately the mod configuration files are lost when updating or removing a mod.[br][/br][br][/br] This button allows you to '
                    + 'Import all of your active mod\'s configuration files into a single mod which will remain unaffected by mod updates.[br][/br][br][/br]'
                    + 'Would you like to enable this functionality? (SMAPI must be installed)',
            }, [
                { label: 'Close' },
                { label: 'Enable' }
            ]);
            if (result.action === 'Close') {
                return;
            }
            if (result.action === 'Enable') {
                api.store.dispatch((0, actions_1.setMergeConfigs)(profile.id, true));
            }
        }
        const eventPromise = (api, eventType) => new Promise((resolve, reject) => {
            const cb = (err) => err !== null ? reject(err) : resolve();
            (eventType === 'purge-mods')
                ? api.events.emit(eventType, false, cb)
                : api.events.emit(eventType, cb);
        });
        try {
            const mod = yield initialize(api);
            if ((mod === null || mod === void 0 ? void 0 : mod.configModPath) === undefined) {
                return;
            }
            yield eventPromise(api, 'purge-mods');
            const installPath = vortex_api_1.selectors.installPathForGame(api.getState(), common_1.GAME_ID);
            const resolveCandidateName = (file) => {
                const relPath = path_1.default.relative(installPath, file.filePath);
                const segments = relPath.split(path_1.default.sep);
                return segments[0];
            };
            const files = yield (0, util_1.walkPath)(installPath);
            const filtered = files.reduce((accum, file) => {
                if (path_1.default.basename(file.filePath).toLowerCase() === common_1.MOD_CONFIG && !path_1.default.dirname(file.filePath).includes(mod.configModPath)) {
                    const candidateName = resolveCandidateName(file);
                    if (vortex_api_1.util.getSafe(profile, ['modState', candidateName, 'enabled'], false) === false) {
                        return accum;
                    }
                    accum.push({ filePath: file.filePath, candidates: [candidateName] });
                }
                return accum;
            }, []);
            yield addModConfig(api, filtered, installPath);
            yield eventPromise(api, 'deploy-mods');
        }
        catch (err) {
            api.showErrorNotification('Failed to sync mod configurations', err);
        }
    });
}
function sanitizeProfileName(input) {
    return input.replace(common_1.RGX_INVALID_CHARS_WINDOWS, '_');
}
function configModName(profileName) {
    return `Stardew Valley Configuration (${sanitizeProfileName(profileName)})`;
}
function initialize(api) {
    return __awaiter(this, void 0, void 0, function* () {
        const state = api.getState();
        const profile = vortex_api_1.selectors.activeProfile(state);
        if ((profile === null || profile === void 0 ? void 0 : profile.gameId) !== common_1.GAME_ID) {
            return Promise.resolve(undefined);
        }
        const mergeConfigs = vortex_api_1.util.getSafe(state, ['settings', 'SDV', 'mergeConfigs', profile.id], false);
        if (!mergeConfigs) {
            return Promise.resolve(undefined);
        }
        try {
            const mod = yield ensureConfigMod(api);
            const installationPath = vortex_api_1.selectors.installPathForGame(state, common_1.GAME_ID);
            const configModPath = path_1.default.join(installationPath, mod.installationPath);
            return Promise.resolve({ configModPath, mod });
        }
        catch (err) {
            api.showErrorNotification('Failed to resolve config mod path', err);
            return Promise.resolve(undefined);
        }
    });
}
function addModConfig(api, files, modsPath) {
    return __awaiter(this, void 0, void 0, function* () {
        const configMod = yield initialize(api);
        if (configMod === undefined) {
            return;
        }
        const state = api.getState();
        const discovery = vortex_api_1.selectors.discoveryByGame(state, common_1.GAME_ID);
        const isInstallPath = modsPath !== undefined;
        modsPath = modsPath !== null && modsPath !== void 0 ? modsPath : path_1.default.join(discovery.path, (0, util_1.defaultModsRelPath)());
        const smapiTool = (0, SMAPI_1.findSMAPITool)(api);
        if (smapiTool === undefined) {
            return;
        }
        const configModAttributes = extractConfigModAttributes(state, configMod.mod.id);
        let newConfigAttributes = Array.from(new Set(configModAttributes));
        for (const file of files) {
            const segments = file.filePath.toLowerCase().split(path_1.default.sep).filter(seg => !!seg);
            if (segments.includes('smapi_internal')) {
                continue;
            }
            api.sendNotification({
                type: 'activity',
                id: common_1.NOTIF_ACTIVITY_CONFIG_MOD,
                title: 'Importing config files...',
                message: file.candidates[0],
            });
            if (!configModAttributes.includes(file.candidates[0])) {
                newConfigAttributes.push(file.candidates[0]);
            }
            try {
                const installRelPath = path_1.default.relative(modsPath, file.filePath);
                const segments = installRelPath.split(path_1.default.sep);
                const relPath = isInstallPath ? segments.slice(1).join(path_1.default.sep) : installRelPath;
                const targetPath = path_1.default.join(configMod.configModPath, relPath);
                const targetDir = path_1.default.extname(targetPath) !== '' ? path_1.default.dirname(targetPath) : targetPath;
                yield vortex_api_1.fs.ensureDirWritableAsync(targetDir);
                (0, vortex_api_1.log)('debug', 'importing config file from', { source: file.filePath, destination: targetPath, modId: file.candidates[0] });
                yield vortex_api_1.fs.copyAsync(file.filePath, targetPath, { overwrite: true });
                yield vortex_api_1.fs.removeAsync(file.filePath);
            }
            catch (err) {
                api.showErrorNotification('Failed to write mod config', err);
            }
        }
        api.dismissNotification(common_1.NOTIF_ACTIVITY_CONFIG_MOD);
        setConfigModAttribute(api, configMod.mod.id, Array.from(new Set(newConfigAttributes)));
    });
}
exports.addModConfig = addModConfig;
function ensureConfigMod(api) {
    return __awaiter(this, void 0, void 0, function* () {
        const state = api.getState();
        const mods = vortex_api_1.util.getSafe(state, ['persistent', 'mods', common_1.GAME_ID], {});
        const modInstalled = Object.values(mods).find(iter => iter.type === common_1.MOD_TYPE_CONFIG);
        if (modInstalled !== undefined) {
            return Promise.resolve(modInstalled);
        }
        else {
            const profile = vortex_api_1.selectors.activeProfile(state);
            const modName = configModName(profile.name);
            const mod = yield createConfigMod(api, modName, profile);
            api.store.dispatch(vortex_api_1.actions.setModEnabled(profile.id, mod.id, true));
            return Promise.resolve(mod);
        }
    });
}
exports.ensureConfigMod = ensureConfigMod;
function createConfigMod(api, modName, profile) {
    return __awaiter(this, void 0, void 0, function* () {
        const mod = {
            id: modName,
            state: 'installed',
            attributes: {
                name: 'Stardew Valley Mod Configuration',
                description: 'This mod is a collective merge of SDV mod configuration files which Vortex maintains '
                    + 'for the mods you have installed. The configuration is maintained through mod updates, '
                    + 'but at times it may need to be manually updated',
                logicalFileName: 'Stardew Valley Mod Configuration',
                modId: 42,
                version: '1.0.0',
                variant: sanitizeProfileName(profile.name.replace(common_1.RGX_INVALID_CHARS_WINDOWS, '_')),
                installTime: new Date(),
                source: 'user-generated',
            },
            installationPath: modName,
            type: common_1.MOD_TYPE_CONFIG,
        };
        return new Promise((resolve, reject) => {
            api.events.emit('create-mod', profile.gameId, mod, (error) => __awaiter(this, void 0, void 0, function* () {
                if (error !== null) {
                    return reject(error);
                }
                return resolve(mod);
            }));
        });
    });
}
function onWillEnableMods(api, profileId, modIds, enabled, options) {
    return __awaiter(this, void 0, void 0, function* () {
        const state = api.getState();
        const profile = vortex_api_1.selectors.profileById(state, profileId);
        if ((profile === null || profile === void 0 ? void 0 : profile.gameId) !== common_1.GAME_ID) {
            return;
        }
        if (enabled) {
            yield onSyncModConfigurations(api, true);
            return;
        }
        const configMod = yield initialize(api);
        if (!configMod) {
            return;
        }
        if (modIds.includes(configMod.mod.id)) {
            yield onRevertFiles(api, profileId);
            return;
        }
        if ((options === null || options === void 0 ? void 0 : options.installed) || (options === null || options === void 0 ? void 0 : options.willBeReplaced)) {
            return Promise.resolve();
        }
        const attrib = extractConfigModAttributes(state, configMod.mod.id);
        const relevant = modIds.filter(id => attrib.includes(id));
        if (relevant.length === 0) {
            return;
        }
        const installPath = vortex_api_1.selectors.installPathForGame(state, common_1.GAME_ID);
        if (enabled) {
            yield onSyncModConfigurations(api);
            return;
        }
        const mods = vortex_api_1.util.getSafe(state, ['persistent', 'mods', common_1.GAME_ID], {});
        for (const id of relevant) {
            const mod = mods[id];
            if (!(mod === null || mod === void 0 ? void 0 : mod.installationPath)) {
                continue;
            }
            const modPath = path_1.default.join(installPath, mod.installationPath);
            const files = yield (0, util_1.walkPath)(modPath, { skipLinks: true, skipHidden: true, skipInaccessible: true });
            const manifestFile = files.find(file => path_1.default.basename(file.filePath) === common_1.MOD_MANIFEST);
            if (manifestFile === undefined) {
                continue;
            }
            const relPath = path_1.default.relative(modPath, path_1.default.dirname(manifestFile.filePath));
            const modConfigFilePath = path_1.default.join(configMod.configModPath, relPath, common_1.MOD_CONFIG);
            yield vortex_api_1.fs.copyAsync(modConfigFilePath, path_1.default.join(modPath, relPath, common_1.MOD_CONFIG), { overwrite: true }).catch(err => null);
            try {
                yield applyToModConfig(api, () => (0, util_1.deleteFolder)(path_1.default.dirname(modConfigFilePath)));
            }
            catch (err) {
                api.showErrorNotification('Failed to write mod config', err);
                return;
            }
        }
        removeConfigModAttributes(api, configMod.mod, relevant);
    });
}
exports.onWillEnableMods = onWillEnableMods;
function applyToModConfig(api, cb) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const configMod = yield initialize(api);
            yield api.emitAndAwait('deploy-single-mod', common_1.GAME_ID, configMod.mod.id, false);
            yield cb();
            yield api.emitAndAwait('deploy-single-mod', common_1.GAME_ID, configMod.mod.id, true);
        }
        catch (err) {
            api.showErrorNotification('Failed to write mod config', err);
        }
    });
}
exports.applyToModConfig = applyToModConfig;
function onRevertFiles(api, profileId) {
    return __awaiter(this, void 0, void 0, function* () {
        const state = api.getState();
        const profile = vortex_api_1.selectors.profileById(state, profileId);
        if ((profile === null || profile === void 0 ? void 0 : profile.gameId) !== common_1.GAME_ID) {
            return;
        }
        const configMod = yield initialize(api);
        if (!configMod) {
            return;
        }
        const attrib = extractConfigModAttributes(state, configMod.mod.id);
        if (attrib.length === 0) {
            return;
        }
        yield onWillEnableMods(api, profileId, attrib, false);
        return;
    });
}
exports.onRevertFiles = onRevertFiles;
function onAddedFiles(api, profileId, files) {
    return __awaiter(this, void 0, void 0, function* () {
        const state = api.store.getState();
        const profile = vortex_api_1.selectors.profileById(state, profileId);
        if ((profile === null || profile === void 0 ? void 0 : profile.gameId) !== common_1.GAME_ID) {
            return;
        }
        const smapiTool = (0, SMAPI_1.findSMAPITool)(api);
        if (smapiTool === undefined) {
            return;
        }
        const isSMAPIFile = (file) => {
            const segments = file.filePath.toLowerCase().split(path_1.default.sep).filter(seg => !!seg);
            return segments.includes('smapi_internal');
        };
        const mergeConfigs = vortex_api_1.util.getSafe(state, ['settings', 'SDV', 'mergeConfigs', profile.id], false);
        const result = files.reduce((accum, file) => {
            if (mergeConfigs && !isSMAPIFile(file) && path_1.default.basename(file.filePath).toLowerCase() === common_1.MOD_CONFIG) {
                accum.configs.push(file);
            }
            else {
                accum.regulars.push(file);
            }
            return accum;
        }, { configs: [], regulars: [] });
        return Promise.all([
            addConfigFiles(api, profileId, result.configs),
            addRegularFiles(api, profileId, result.regulars)
        ]);
    });
}
exports.onAddedFiles = onAddedFiles;
function extractConfigModAttributes(state, configModId) {
    return vortex_api_1.util.getSafe(state, ['persistent', 'mods', common_1.GAME_ID, configModId, 'attributes', 'configMod'], []);
}
function setConfigModAttribute(api, configModId, attributes) {
    api.store.dispatch(vortex_api_1.actions.setModAttribute(common_1.GAME_ID, configModId, 'configMod', attributes));
}
function removeConfigModAttributes(api, configMod, attributes) {
    const existing = extractConfigModAttributes(api.getState(), configMod.id);
    const newAttributes = existing.filter(attr => !attributes.includes(attr));
    setConfigModAttribute(api, configMod.id, newAttributes);
}
function addConfigFiles(api, profileId, files) {
    return __awaiter(this, void 0, void 0, function* () {
        if (files.length === 0) {
            return Promise.resolve();
        }
        api.sendNotification({
            type: 'activity',
            id: common_1.NOTIF_ACTIVITY_CONFIG_MOD,
            title: 'Importing config files...',
            message: 'Starting up...'
        });
        return addModConfig(api, files, undefined);
    });
}
function addRegularFiles(api, profileId, files) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        if (files.length === 0) {
            return Promise.resolve();
        }
        const state = api.getState();
        const game = vortex_api_1.util.getGame(common_1.GAME_ID);
        const discovery = vortex_api_1.selectors.discoveryByGame(state, common_1.GAME_ID);
        const modPaths = game.getModPaths(discovery.path);
        const installPath = vortex_api_1.selectors.installPathForGame(state, common_1.GAME_ID);
        for (const entry of files) {
            if (entry.candidates.length === 1) {
                const mod = vortex_api_1.util.getSafe(state.persistent.mods, [common_1.GAME_ID, entry.candidates[0]], undefined);
                if (!isModCandidateValid(mod, entry)) {
                    return Promise.resolve();
                }
                const from = modPaths[(_a = mod.type) !== null && _a !== void 0 ? _a : ''];
                if (from === undefined) {
                    (0, vortex_api_1.log)('error', 'failed to resolve mod path for mod type', mod.type);
                    return Promise.resolve();
                }
                const relPath = path_1.default.relative(from, entry.filePath);
                const targetPath = path_1.default.join(installPath, mod.id, relPath);
                try {
                    yield vortex_api_1.fs.ensureDirWritableAsync(path_1.default.dirname(targetPath));
                    yield vortex_api_1.fs.copyAsync(entry.filePath, targetPath);
                    yield vortex_api_1.fs.removeAsync(entry.filePath);
                }
                catch (err) {
                    if (!err.message.includes('are the same file')) {
                        (0, vortex_api_1.log)('error', 'failed to re-import added file to mod', err.message);
                    }
                }
            }
        }
    });
}
const isModCandidateValid = (mod, entry) => {
    if ((mod === null || mod === void 0 ? void 0 : mod.id) === undefined || mod.type === 'sdvrootfolder') {
        return false;
    }
    if (mod.type !== 'SMAPI') {
        return true;
    }
    const segments = entry.filePath.toLowerCase().split(path_1.default.sep).filter(seg => !!seg);
    const modsSegIdx = segments.indexOf('mods');
    const modFolderName = ((modsSegIdx !== -1) && (segments.length > modsSegIdx + 1))
        ? segments[modsSegIdx + 1] : undefined;
    let bundledMods = vortex_api_1.util.getSafe(mod, ['attributes', 'smapiBundledMods'], []);
    bundledMods = bundledMods.length > 0 ? bundledMods : (0, common_1.getBundledMods)();
    if (segments.includes('content')) {
        return false;
    }
    return (modFolderName !== undefined) && bundledMods.includes(modFolderName);
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29uZmlnTW9kLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiY29uZmlnTW9kLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7OztBQUNBLGdEQUF3QjtBQUN4QiwyQ0FBc0U7QUFDdEUscUNBQW9KO0FBQ3BKLHVDQUE0QztBQUU1QyxpQ0FBb0U7QUFFcEUsbUNBQXNEO0FBR3RELE1BQU0sV0FBVyxHQUFHLENBQUMsR0FBd0IsRUFBRSxFQUFFO0lBQy9DLHVCQUF1QixDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBQy9CLENBQUMsQ0FBQTtBQUVELFNBQWdCLGlCQUFpQixDQUFDLE9BQWdDO0lBQ2hFLE9BQU8sQ0FBQyxjQUFjLENBQUMsV0FBVyxFQUFFLEdBQUcsRUFBRSxNQUFNLEVBQUUsRUFBRSxFQUFFLHlCQUF5QixFQUM1RSxHQUFHLEVBQUUsQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxFQUM5QixHQUFHLEVBQUU7UUFDSCxNQUFNLEtBQUssR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUMzQyxNQUFNLFFBQVEsR0FBRyxzQkFBUyxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUMvQyxPQUFPLENBQUMsUUFBUSxLQUFLLGdCQUFPLENBQUMsQ0FBQztJQUNoQyxDQUFDLENBQUMsQ0FBQztBQUNQLENBQUM7QUFSRCw4Q0FRQztBQUVELFNBQWUsdUJBQXVCLENBQUMsR0FBd0IsRUFBRSxNQUFnQjs7UUFDL0UsTUFBTSxLQUFLLEdBQUcsR0FBRyxDQUFDLFFBQVEsRUFBRSxDQUFDO1FBQzdCLE1BQU0sT0FBTyxHQUFHLHNCQUFTLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQy9DLElBQUksQ0FBQSxPQUFPLGFBQVAsT0FBTyx1QkFBUCxPQUFPLENBQUUsTUFBTSxNQUFLLGdCQUFPLEVBQUU7WUFDL0IsT0FBTztTQUNSO1FBQ0QsTUFBTSxTQUFT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LENBQUM7SUFDbkYsTUFBTSxVQUFVLEdBQUcsUUFBUSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUM1QyxNQUFNLGFBQWEsR0FBRyxDQUFDLENBQUMsVUFBVSxLQUFLLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxHQUFHLFVBQVUsR0FBRyxDQUFDLENBQUMsQ0FBQztRQUMvRSxDQUFDLENBQUMsUUFBUSxDQUFDLFVBQVUsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDO0lBRXpDLElBQUksV0FBVyxHQUFHLGlCQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsRUFBRSxDQUFDLFlBQVksRUFBRSxrQkFBa0IsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO0lBQzVFLFdBQVcsR0FBRyxXQUFXLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxJQUFBLHVCQUFjLEdBQUUsQ0FBQztJQUN0RSxJQUFJLFFBQVEsQ0FBQyxRQUFRLENBQUMsU0FBUyxDQUFDLEVBQUU7UUFHaEMsT0FBTyxLQUFLLENBQUM7S0FDZDtJQUVELE9BQU8sQ0FBQyxhQUFhLEtBQUssU0FBUyxDQUFDLElBQUksV0FBVyxDQUFDLFFBQVEsQ0FBQyxhQUFhLENBQUMsQ0FBQztBQUM5RSxDQUFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiBlc2xpbnQtZGlzYWJsZSAqL1xuaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgeyBhY3Rpb25zLCBmcywgdHlwZXMsIHNlbGVjdG9ycywgbG9nLCB1dGlsIH0gZnJvbSAndm9ydGV4LWFwaSc7XG5pbXBvcnQgeyBOT1RJRl9BQ1RJVklUWV9DT05GSUdfTU9ELCBHQU1FX0lELCBNT0RfQ09ORklHLCBSR1hfSU5WQUxJRF9DSEFSU19XSU5ET1dTLCBNT0RfVFlQRV9DT05GSUcsIE1PRF9NQU5JRkVTVCwgZ2V0QnVuZGxlZE1vZHMgfSBmcm9tICcuL2NvbW1vbic7XG5pbXBvcnQgeyBzZXRNZXJnZUNvbmZpZ3MgfSBmcm9tICcuL2FjdGlvbnMnO1xuaW1wb3J0IHsgSUZpbGVFbnRyeSB9IGZyb20gJy4vdHlwZXMnO1xuaW1wb3J0IHsgd2Fsa1BhdGgsIGRlZmF1bHRNb2RzUmVsUGF0aCwgZGVsZXRlRm9sZGVyIH0gZnJvbSAnLi91dGlsJztcblxuaW1wb3J0IHsgZmluZFNNQVBJTW9kLCBmaW5kU01BUElUb29sIH0gZnJvbSAnLi9TTUFQSSc7XG5pbXBvcnQgeyBJRW50cnkgfSBmcm9tICd0dXJib3dhbGsnO1xuXG5jb25zdCBzeW5jV3JhcHBlciA9IChhcGk6IHR5cGVzLklFeHRlbnNpb25BcGkpID0+IHtcbiAgb25TeW5jTW9kQ29uZmlndXJhdGlvbnMoYXBpKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJlZ2lzdGVyQ29uZmlnTW9kKGNvbnRleHQ6IHR5cGVzLklFeHRlbnNpb25Db250ZXh0KSB7XG4gIGNvbnRleHQucmVnaXN0ZXJBY3Rpb24oJ21vZC1pY29ucycsIDk5OSwgJ3N3YXAnLCB7fSwgJ1N5bmMgTW9kIENvbmZpZ3VyYXRpb25zJyxcbiAgICAoKSA9PiBzeW5jV3JhcHBlcihjb250ZXh0LmFwaSksXG4gICAgKCkgPT4ge1xuICAgICAgY29uc3Qgc3RhdGUgPSBjb250ZXh0LmFwaS5zdG9yZS5nZXRTdGF0ZSgpO1xuICAgICAgY29uc3QgZ2FtZU1vZGUgPSBzZWxlY3RvcnMuYWN0aXZlR2FtZUlkKHN0YXRlKTtcbiAgICAgIHJldHVybiAoZ2FtZU1vZGUgPT09IEdBTUVfSUQpO1xuICAgIH0pO1xufVxuXG5hc3luYyBmdW5jdGlvbiBvblN5bmNNb2RDb25maWd1cmF0aW9ucyhhcGk6IHR5cGVzLklFeHRlbnNpb25BcGksIHNpbGVudD86IGJvb2xlYW4pOiBQcm9taXNlPHZvaWQ+IHtcbiAgY29uc3Qgc3RhdGUgPSBhcGkuZ2V0U3RhdGUoKTtcbiAgY29uc3QgcHJvZmlsZSA9IHNlbGVjdG9ycy5hY3RpdmVQcm9maWxlKHN0YXRlKTtcbiAgaWYgKHByb2ZpbGU/LmdhbWVJZCAhPT0gR0FNRV9JRCkge1xuICAgIHJldHVybjtcbiAgfVxuICBjb25zdCBzbWFwaVRvb2w6IHR5cGVzLklEaXNjb3ZlcmVkVG9vbCA9IGZpbmRTTUFQSVRvb2woYXBpKTtcbiAgaWYgKCFzbWFwaVRvb2w/LnBhdGgpIHtcbiAgICBhcGkuc2hvd0Vycm9yTm90aWZpY2F0aW9uKCdTTUFQSSBpcyBub3QgaW5zdGFsbGVkL2NvbmZpZ3VyZWQnLCAnVGhpcyBmZWF0dXJlIHJlcXVpcmVzIFZvcnRleCB0byBrbm93IHRoZSBsb2NhdGlvbiBvZiBTTUFQSS4gUGxlYXNlIGVuc3VyZSB0aGF0IFNNQVBJIGlzIGF0IGxlYXN0IGNvbmZpZ3VyZWQgYXMgYSB0b29sIGluIFZvcnRleC4nLCB7IGFsbG93UmVwb3J0OiBmYWxzZSB9KTtcbiAgICByZXR1cm47XG4gIH1cbiAgY29uc3QgbWVyZ2VDb25maWdzID0gdXRpbC5nZXRTYWZlKHN0YXRlLCBbJ3NldHRpbmdzJywgJ1NEVicsICdtZXJnZUNvbmZpZ3MnLCBwcm9maWxlLmlkXSwgZmFsc2UpO1xuICBpZiAoIW1lcmdlQ29uZmlncykge1xuICAgIGlmIChzaWxlbnQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgYXBpLnNob3dEaWFsb2coJ2luZm8nLCAnTW9kIENvbmZpZ3VyYXRpb24gU3luYycsIHtcbiAgICAgIGJiY29kZTogJ01hbnkgU3RhcmRldyBWYWxsZXkgbW9kcyBnZW5lcmF0ZSB0aGVpciBvd24gY29uZmlndXJhdGlvbiBmaWxlcyBkdXJpbmcgZ2FtZSBwbGF5LiBCeSBkZWZhdWx0IHRoZSBnZW5lcmF0ZWQgZmlsZXMgYXJlLCAnXG4gICAgICAgICsgJ2luZ2VzdGVkIGJ5IHRoZWlyIHJlc3BlY3RpdmUgbW9kcy5bYnJdWy9icl1bYnJdWy9icl0nXG4gICAgICAgICsgJ1VuZm9ydHVuYXRlbHkgdGhlIG1vZCBjb25maWd1cmF0aW9uIGZpbGVzIGFyZSBsb3N0IHdoZW4gdXBkYXRpbmcgb3IgcmVtb3ZpbmcgYSBtb2QuW2JyXVsvYnJdW2JyXVsvYnJdIFRoaXMgYnV0dG9uIGFsbG93cyB5b3UgdG8gJ1xuICAgICAgICArICdJbXBvcnQgYWxsIG9mIHlvdXIgYWN0aXZlIG1vZFxcJ3MgY29uZmlndXJhdGlvbiBmaWxlcyBpbnRvIGEgc2luZ2xlIG1vZCB3aGljaCB3aWxsIHJlbWFpbiB1bmFmZmVjdGVkIGJ5IG1vZCB1cGRhdGVzLlticl1bL2JyXVticl1bL2JyXSdcbiAgICAgICAgKyAnV291bGQgeW91IGxpa2UgdG8gZW5hYmxlIHRoaXMgZnVuY3Rpb25hbGl0eT8gKFNNQVBJIG11c3QgYmUgaW5zdGFsbGVkKScsXG4gICAgfSwgW1xuICAgICAgeyBsYWJlbDogJ0Nsb3NlJyB9LFxuICAgICAgeyBsYWJlbDogJ0VuYWJsZScgfVxuICAgIF0pO1xuXG4gICAgaWYgKHJlc3VsdC5hY3Rpb24gPT09ICdDbG9zZScpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAocmVzdWx0LmFjdGlvbiA9PT0gJ0VuYWJsZScpIHtcbiAgICAgIGFwaS5zdG9yZS5kaXNwYXRjaChzZXRNZXJnZUNvbmZpZ3MocHJvZmlsZS5pZCwgdHJ1ZSkpO1xuICAgIH1cbiAgfVxuXG4gIHR5cGUgRXZlbnRUeXBlID0gJ3B1cmdlLW1vZHMnIHwgJ2RlcGxveS1tb2RzJztcbiAgY29uc3QgZXZlbnRQcm9taXNlID0gKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSwgZXZlbnRUeXBlOiBFdmVudFR5cGUpID0+IG5ldyBQcm9taXNlPHZvaWQ+KChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICBjb25zdCBjYiA9IChlcnI6IGFueSkgPT4gZXJyICE9PSBudWxsID8gcmVqZWN0KGVycikgOiByZXNvbHZlKCk7XG4gICAgKGV2ZW50VHlwZSA9PT0gJ3B1cmdlLW1vZHMnKVxuICAgICAgPyBhcGkuZXZlbnRzLmVtaXQoZXZlbnRUeXBlLCBmYWxzZSwgY2IpXG4gICAgICA6IGFwaS5ldmVudHMuZW1pdChldmVudFR5cGUsIGNiKTtcbiAgfSk7XG5cbiAgdHJ5IHtcbiAgICBjb25zdCBtb2QgPSBhd2FpdCBpbml0aWFsaXplKGFwaSk7XG4gICAgaWYgKG1vZD8uY29uZmlnTW9kUGF0aCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGF3YWl0IGV2ZW50UHJvbWlzZShhcGksICdwdXJnZS1tb2RzJyk7XG5cbiAgICBjb25zdCBpbnN0YWxsUGF0aCA9IHNlbGVjdG9ycy5pbnN0YWxsUGF0aEZvckdhbWUoYXBpLmdldFN0YXRlKCksIEdBTUVfSUQpO1xuICAgIGNvbnN0IHJlc29sdmVDYW5kaWRhdGVOYW1lID0gKGZpbGU6IElFbnRyeSk6IHN0cmluZyA9PiB7XG4gICAgICBjb25zdCByZWxQYXRoID0gcGF0aC5yZWxhdGl2ZShpbnN0YWxsUGF0aCwgZmlsZS5maWxlUGF0aCk7XG4gICAgICBjb25zdCBzZWdtZW50cyA9IHJlbFBhdGguc3BsaXQocGF0aC5zZXApO1xuICAgICAgcmV0dXJuIHNlZ21lbnRzWzBdO1xuICAgIH1cbiAgICBjb25zdCBmaWxlcyA9IGF3YWl0IHdhbGtQYXRoKGluc3RhbGxQYXRoKTtcbiAgICBjb25zdCBmaWx0ZXJlZCA9IGZpbGVzLnJlZHVjZSgoYWNjdW06IElGaWxlRW50cnlbXSwgZmlsZTogSUVudHJ5KSA9PiB7XG4gICAgICBpZiAocGF0aC5iYXNlbmFtZShmaWxlLmZpbGVQYXRoKS50b0xvd2VyQ2FzZSgpID09PSBNT0RfQ09ORklHICYmICFwYXRoLmRpcm5hbWUoZmlsZS5maWxlUGF0aCkuaW5jbHVkZXMobW9kLmNvbmZpZ01vZFBhdGgpKSB7XG4gICAgICAgIGNvbnN0IGNhbmRpZGF0ZU5hbWUgPSByZXNvbHZlQ2FuZGlkYXRlTmFtZShmaWxlKTtcbiAgICAgICAgaWYgKHV0aWwuZ2V0U2FmZShwcm9maWxlLCBbJ21vZFN0YXRlJywgY2FuZGlkYXRlTmFtZSwgJ2VuYWJsZWQnXSwgZmFsc2UpID09PSBmYWxzZSkge1xuICAgICAgICAgIHJldHVybiBhY2N1bTtcbiAgICAgICAgfVxuICAgICAgICBhY2N1bS5wdXNoKHsgZmlsZVBhdGg6IGZpbGUuZmlsZVBhdGgsIGNhbmRpZGF0ZXM6IFtjYW5kaWRhdGVOYW1lXSB9KTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBhY2N1bTtcbiAgICB9LCBbXSk7XG4gICAgYXdhaXQgYWRkTW9kQ29uZmlnKGFwaSwgZmlsdGVyZWQsIGluc3RhbGxQYXRoKTtcbiAgICBhd2FpdCBldmVudFByb21pc2UoYXBpLCAnZGVwbG95LW1vZHMnKTtcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgYXBpLnNob3dFcnJvck5vdGlmaWNhdGlvbignRmFpbGVkIHRvIHN5bmMgbW9kIGNvbmZpZ3VyYXRpb25zJywgZXJyKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBzYW5pdGl6ZVByb2ZpbGVOYW1lKGlucHV0OiBzdHJpbmcpIHtcbiAgcmV0dXJuIGlucHV0LnJlcGxhY2UoUkdYX0lOVkFMSURfQ0hBUlNfV0lORE9XUywgJ18nKTtcbn1cblxuZnVuY3Rpb24gY29uZmlnTW9kTmFtZShwcm9maWxlTmFtZTogc3RyaW5nKSB7XG4gIHJldHVybiBgU3RhcmRldyBWYWxsZXkgQ29uZmlndXJhdGlvbiAoJHtzYW5pdGl6ZVByb2ZpbGVOYW1lKHByb2ZpbGVOYW1lKX0pYDtcbn1cblxudHlwZSBDb25maWdNb2QgPSB7XG4gIG1vZDogdHlwZXMuSU1vZDtcbiAgY29uZmlnTW9kUGF0aDogc3RyaW5nO1xufVxuYXN5bmMgZnVuY3Rpb24gaW5pdGlhbGl6ZShhcGk6IHR5cGVzLklFeHRlbnNpb25BcGkpOiBQcm9taXNlPENvbmZpZ01vZD4ge1xuICBjb25zdCBzdGF0ZSA9IGFwaS5nZXRTdGF0ZSgpO1xuICBjb25zdCBwcm9maWxlID0gc2VsZWN0b3JzLmFjdGl2ZVByb2ZpbGUoc3RhdGUpO1xuICBpZiAocHJvZmlsZT8uZ2FtZUlkICE9PSBHQU1FX0lEKSB7XG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh1bmRlZmluZWQpO1xuICB9XG4gIGNvbnN0IG1lcmdlQ29uZmlncyA9IHV0aWwuZ2V0U2FmZShzdGF0ZSwgWydzZXR0aW5ncycsICdTRFYnLCAnbWVyZ2VDb25maWdzJywgcHJvZmlsZS5pZF0sIGZhbHNlKTtcbiAgaWYgKCFtZXJnZUNvbmZpZ3MpIHtcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHVuZGVmaW5lZCk7XG4gIH1cblxuICB0cnkge1xuICAgIGNvbnN0IG1vZCA9IGF3YWl0IGVuc3VyZUNvbmZpZ01vZChhcGkpO1xuICAgIGNvbnN0IGluc3RhbGxhdGlvblBhdGggPSBzZWxlY3RvcnMuaW5zdGFsbFBhdGhGb3JHYW1lKHN0YXRlLCBHQU1FX0lEKTtcbiAgICBjb25zdCBjb25maWdNb2RQYXRoID0gcGF0aC5qb2luKGluc3RhbGxhdGlvblBhdGgsIG1vZC5pbnN0YWxsYXRpb25QYXRoKTtcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHsgY29uZmlnTW9kUGF0aCwgbW9kIH0pO1xuICB9IGNhdGNoIChlcnIpIHtcbiAgICBhcGkuc2hvd0Vycm9yTm90aWZpY2F0aW9uKCdGYWlsZWQgdG8gcmVzb2x2ZSBjb25maWcgbW9kIHBhdGgnLCBlcnIpO1xuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUodW5kZWZpbmVkKTtcbiAgfVxufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gYWRkTW9kQ29uZmlnKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSwgZmlsZXM6IElGaWxlRW50cnlbXSwgbW9kc1BhdGg/OiBzdHJpbmcpIHtcbiAgY29uc3QgY29uZmlnTW9kID0gYXdhaXQgaW5pdGlhbGl6ZShhcGkpO1xuICBpZiAoY29uZmlnTW9kID09PSB1bmRlZmluZWQpIHtcbiAgICByZXR1cm47XG4gIH1cblxuICBjb25zdCBzdGF0ZSA9IGFwaS5nZXRTdGF0ZSgpO1xuICBjb25zdCBkaXNjb3ZlcnkgPSBzZWxlY3RvcnMuZGlzY292ZXJ5QnlHYW1lKHN0YXRlLCBHQU1FX0lEKTtcbiAgY29uc3QgaXNJbnN0YWxsUGF0aCA9IG1vZHNQYXRoICE9PSB1bmRlZmluZWQ7XG4gIG1vZHNQYXRoID0gbW9kc1BhdGggPz8gcGF0aC5qb2luKGRpc2NvdmVyeS5wYXRoLCBkZWZhdWx0TW9kc1JlbFBhdGgoKSk7XG4gIGNvbnN0IHNtYXBpVG9vbDogdHlwZXMuSURpc2NvdmVyZWRUb29sID0gZmluZFNNQVBJVG9vbChhcGkpO1xuICBpZiAoc21hcGlUb29sID09PSB1bmRlZmluZWQpIHtcbiAgICByZXR1cm47XG4gIH1cbiAgY29uc3QgY29uZmlnTW9kQXR0cmlidXRlczogc3RyaW5nW10gPSBleHRyYWN0Q29uZmlnTW9kQXR0cmlidXRlcyhzdGF0ZSwgY29uZmlnTW9kLm1vZC5pZCk7XG4gIGxldCBuZXdDb25maWdBdHRyaWJ1dGVzID0gQXJyYXkuZnJvbShuZXcgU2V0KGNvbmZpZ01vZEF0dHJpYnV0ZXMpKTtcbiAgZm9yIChjb25zdCBmaWxlIG9mIGZpbGVzKSB7XG4gICAgY29uc3Qgc2VnbWVudHMgPSBmaWxlLmZpbGVQYXRoLnRvTG93ZXJDYXNlKCkuc3BsaXQocGF0aC5zZXApLmZpbHRlcihzZWcgPT4gISFzZWcpO1xuICAgIGlmIChzZWdtZW50cy5pbmNsdWRlcygnc21hcGlfaW50ZXJuYWwnKSkge1xuICAgICAgLy8gRG9uJ3QgdG91Y2ggdGhlIGludGVybmFsIFNNQVBJIGNvbmZpZ3VyYXRpb24gZmlsZXMuXG4gICAgICBjb250aW51ZTtcbiAgICB9XG4gICAgYXBpLnNlbmROb3RpZmljYXRpb24oe1xuICAgICAgdHlwZTogJ2FjdGl2aXR5JyxcbiAgICAgIGlkOiBOT1RJRl9BQ1RJVklUWV9DT05GSUdfTU9ELFxuICAgICAgdGl0bGU6ICdJbXBvcnRpbmcgY29uZmlnIGZpbGVzLi4uJyxcbiAgICAgIG1lc3NhZ2U6IGZpbGUuY2FuZGlkYXRlc1swXSxcbiAgICB9KTtcbiAgICBcbiAgICBpZiAoIWNvbmZpZ01vZEF0dHJpYnV0ZXMuaW5jbHVkZXMoZmlsZS5jYW5kaWRhdGVzWzBdKSkge1xuICAgICAgbmV3Q29uZmlnQXR0cmlidXRlcy5wdXNoKGZpbGUuY2FuZGlkYXRlc1swXSk7XG4gICAgfVxuICAgIHRyeSB7XG4gICAgICBjb25zdCBpbnN0YWxsUmVsUGF0aCA9IHBhdGgucmVsYXRpdmUobW9kc1BhdGgsIGZpbGUuZmlsZVBhdGgpO1xuICAgICAgY29uc3Qgc2VnbWVudHMgPSBpbnN0YWxsUmVsUGF0aC5zcGxpdChwYXRoLnNlcCk7XG4gICAgICBjb25zdCByZWxQYXRoID0gaXNJbnN0YWxsUGF0aCA/IHNlZ21lbnRzLnNsaWNlKDEpLmpvaW4ocGF0aC5zZXApIDogaW5zdGFsbFJlbFBhdGg7XG4gICAgICBjb25zdCB0YXJnZXRQYXRoID0gcGF0aC5qb2luKGNvbmZpZ01vZC5jb25maWdNb2RQYXRoLCByZWxQYXRoKTtcbiAgICAgIGNvbnN0IHRhcmdldERpciA9IHBhdGguZXh0bmFtZSh0YXJnZXRQYXRoKSAhPT0gJycgPyBwYXRoLmRpcm5hbWUodGFyZ2V0UGF0aCkgOiB0YXJnZXRQYXRoO1xuICAgICAgYXdhaXQgZnMuZW5zdXJlRGlyV3JpdGFibGVBc3luYyh0YXJnZXREaXIpO1xuICAgICAgbG9nKCdkZWJ1ZycsICdpbXBvcnRpbmcgY29uZmlnIGZpbGUgZnJvbScsIHsgc291cmNlOiBmaWxlLmZpbGVQYXRoLCBkZXN0aW5hdGlvbjogdGFyZ2V0UGF0aCwgbW9kSWQ6IGZpbGUuY2FuZGlkYXRlc1swXSB9KTtcbiAgICAgIGF3YWl0IGZzLmNvcHlBc3luYyhmaWxlLmZpbGVQYXRoLCB0YXJnZXRQYXRoLCB7IG92ZXJ3cml0ZTogdHJ1ZSB9KTtcbiAgICAgIGF3YWl0IGZzLnJlbW92ZUFzeW5jKGZpbGUuZmlsZVBhdGgpO1xuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgYXBpLnNob3dFcnJvck5vdGlmaWNhdGlvbignRmFpbGVkIHRvIHdyaXRlIG1vZCBjb25maWcnLCBlcnIpO1xuICAgIH1cbiAgfVxuXG4gIGFwaS5kaXNtaXNzTm90aWZpY2F0aW9uKE5PVElGX0FDVElWSVRZX0NPTkZJR19NT0QpO1xuICBzZXRDb25maWdNb2RBdHRyaWJ1dGUoYXBpLCBjb25maWdNb2QubW9kLmlkLCBBcnJheS5mcm9tKG5ldyBTZXQobmV3Q29uZmlnQXR0cmlidXRlcykpKTtcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGVuc3VyZUNvbmZpZ01vZChhcGk6IHR5cGVzLklFeHRlbnNpb25BcGkpOiBQcm9taXNlPHR5cGVzLklNb2Q+IHtcbiAgY29uc3Qgc3RhdGUgPSBhcGkuZ2V0U3RhdGUoKTtcbiAgY29uc3QgbW9kczogeyBbbW9kSWQ6IHN0cmluZ106IHR5cGVzLklNb2QgfSA9IHV0aWwuZ2V0U2FmZShzdGF0ZSwgWydwZXJzaXN0ZW50JywgJ21vZHMnLCBHQU1FX0lEXSwge30pO1xuICBjb25zdCBtb2RJbnN0YWxsZWQgPSBPYmplY3QudmFsdWVzKG1vZHMpLmZpbmQoaXRlciA9PiBpdGVyLnR5cGUgPT09IE1PRF9UWVBFX0NPTkZJRyk7XG4gIGlmIChtb2RJbnN0YWxsZWQgIT09IHVuZGVmaW5lZCkge1xuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUobW9kSW5zdGFsbGVkKTtcbiAgfSBlbHNlIHtcbiAgICBjb25zdCBwcm9maWxlID0gc2VsZWN0b3JzLmFjdGl2ZVByb2ZpbGUoc3RhdGUpO1xuICAgIGNvbnN0IG1vZE5hbWUgPSBjb25maWdNb2ROYW1lKHByb2ZpbGUubmFtZSk7XG4gICAgY29uc3QgbW9kID0gYXdhaXQgY3JlYXRlQ29uZmlnTW9kKGFwaSwgbW9kTmFtZSwgcHJvZmlsZSk7XG4gICAgYXBpLnN0b3JlLmRpc3BhdGNoKGFjdGlvbnMuc2V0TW9kRW5hYmxlZChwcm9maWxlLmlkLCBtb2QuaWQsIHRydWUpKTtcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKG1vZCk7XG4gIH1cbn1cblxuYXN5bmMgZnVuY3Rpb24gY3JlYXRlQ29uZmlnTW9kKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSwgbW9kTmFtZTogc3RyaW5nLCBwcm9maWxlOiB0eXBlcy5JUHJvZmlsZSk6IFByb21pc2U8dHlwZXMuSU1vZD4ge1xuICBjb25zdCBtb2QgPSB7XG4gICAgaWQ6IG1vZE5hbWUsXG4gICAgc3RhdGU6ICdpbnN0YWxsZWQnLFxuICAgIGF0dHJpYnV0ZXM6IHtcbiAgICAgIG5hbWU6ICdTdGFyZGV3IFZhbGxleSBNb2QgQ29uZmlndXJhdGlvbicsXG4gICAgICBkZXNjcmlwdGlvbjogJ1RoaXMgbW9kIGlzIGEgY29sbGVjdGl2ZSBtZXJnZSBvZiBTRFYgbW9kIGNvbmZpZ3VyYXRpb24gZmlsZXMgd2hpY2ggVm9ydGV4IG1haW50YWlucyAnXG4gICAgICAgICsgJ2ZvciB0aGUgbW9kcyB5b3UgaGF2ZSBpbnN0YWxsZWQuIFRoZSBjb25maWd1cmF0aW9uIGlzIG1haW50YWluZWQgdGhyb3VnaCBtb2QgdXBkYXRlcywgJ1xuICAgICAgICArICdidXQgYXQgdGltZXMgaXQgbWF5IG5lZWQgdG8gYmUgbWFudWFsbHkgdXBkYXRlZCcsXG4gICAgICBsb2dpY2FsRmlsZU5hbWU6ICdTdGFyZGV3IFZhbGxleSBNb2QgQ29uZmlndXJhdGlvbicsXG4gICAgICBtb2RJZDogNDIsIC8vIE1lYW5pbmcgb2YgbGlmZVxuICAgICAgdmVyc2lvbjogJzEuMC4wJyxcbiAgICAgIHZhcmlhbnQ6IHNhbml0aXplUHJvZmlsZU5hbWUocHJvZmlsZS5uYW1lLnJlcGxhY2UoUkdYX0lOVkFMSURfQ0hBUlNfV0lORE9XUywgJ18nKSksXG4gICAgICBpbnN0YWxsVGltZTogbmV3IERhdGUoKSxcbiAgICAgIHNvdXJjZTogJ3VzZXItZ2VuZXJhdGVkJyxcbiAgICB9LFxuICAgIGluc3RhbGxhdGlvblBhdGg6IG1vZE5hbWUsXG4gICAgdHlwZTogTU9EX1RZUEVfQ09ORklHLFxuICB9O1xuXG4gIHJldHVybiBuZXcgUHJvbWlzZTx0eXBlcy5JTW9kPigocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgYXBpLmV2ZW50cy5lbWl0KCdjcmVhdGUtbW9kJywgcHJvZmlsZS5nYW1lSWQsIG1vZCwgYXN5bmMgKGVycm9yKSA9PiB7XG4gICAgICBpZiAoZXJyb3IgIT09IG51bGwpIHtcbiAgICAgICAgcmV0dXJuIHJlamVjdChlcnJvcik7XG4gICAgICB9XG4gICAgICByZXR1cm4gcmVzb2x2ZShtb2QgYXMgYW55KTtcbiAgICB9KTtcbiAgfSk7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBvbldpbGxFbmFibGVNb2RzKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSwgcHJvZmlsZUlkOiBzdHJpbmcsIG1vZElkczogc3RyaW5nW10sIGVuYWJsZWQ6IGJvb2xlYW4sIG9wdGlvbnM/OiBhbnkpIHtcbiAgY29uc3Qgc3RhdGUgPSBhcGkuZ2V0U3RhdGUoKTtcbiAgY29uc3QgcHJvZmlsZSA9IHNlbGVjdG9ycy5wcm9maWxlQnlJZChzdGF0ZSwgcHJvZmlsZUlkKTtcbiAgaWYgKHByb2ZpbGU/LmdhbWVJZCAhPT0gR0FNRV9JRCkge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGlmIChlbmFibGVkKSB7XG4gICAgYXdhaXQgb25TeW5jTW9kQ29uZmlndXJhdGlvbnMoYXBpLCB0cnVlKTtcbiAgICByZXR1cm47XG4gIH1cblxuICBjb25zdCBjb25maWdNb2QgPSBhd2FpdCBpbml0aWFsaXplKGFwaSk7XG4gIGlmICghY29uZmlnTW9kKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgaWYgKG1vZElkcy5pbmNsdWRlcyhjb25maWdNb2QubW9kLmlkKSkge1xuICAgIC8vIFRoZSBjb25maWcgbW9kIGlzIGdldHRpbmcgZGlzYWJsZWQvdW5pbnN0YWxsZWQgLSByZS1pbnN0YXRlIGFsbCBvZlxuICAgIC8vICB0aGUgY29uZmlndXJhdGlvbiBmaWxlcy5cbiAgICBhd2FpdCBvblJldmVydEZpbGVzKGFwaSwgcHJvZmlsZUlkKTtcbiAgICByZXR1cm47XG4gIH1cblxuICBpZiAob3B0aW9ucz8uaW5zdGFsbGVkIHx8IG9wdGlvbnM/LndpbGxCZVJlcGxhY2VkKSB7XG4gICAgLy8gRG8gbm90aGluZywgdGhlIG1vZHMgYXJlIGJlaW5nIHJlLWluc3RhbGxlZC5cbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG4gIH1cblxuICBjb25zdCBhdHRyaWIgPSBleHRyYWN0Q29uZmlnTW9kQXR0cmlidXRlcyhzdGF0ZSwgY29uZmlnTW9kLm1vZC5pZCk7XG4gIGNvbnN0IHJlbGV2YW50ID0gbW9kSWRzLmZpbHRlcihpZCA9PiBhdHRyaWIuaW5jbHVkZXMoaWQpKTtcbiAgaWYgKHJlbGV2YW50Lmxlbmd0aCA9PT0gMCkge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGNvbnN0IGluc3RhbGxQYXRoID0gc2VsZWN0b3JzLmluc3RhbGxQYXRoRm9yR2FtZShzdGF0ZSwgR0FNRV9JRCk7XG4gIGlmIChlbmFibGVkKSB7XG4gICAgYXdhaXQgb25TeW5jTW9kQ29uZmlndXJhdGlvbnMoYXBpKTtcbiAgICByZXR1cm47XG4gIH1cblxuICBjb25zdCBtb2RzOiB7IFttb2RJZDogc3RyaW5nXTogdHlwZXMuSU1vZCB9ID0gdXRpbC5nZXRTYWZlKHN0YXRlLCBbJ3BlcnNpc3RlbnQnLCAnbW9kcycsIEdBTUVfSURdLCB7fSk7XG4gIGZvciAoY29uc3QgaWQgb2YgcmVsZXZhbnQpIHtcbiAgICBjb25zdCBtb2QgPSBtb2RzW2lkXTtcbiAgICBpZiAoIW1vZD8uaW5zdGFsbGF0aW9uUGF0aCkge1xuICAgICAgY29udGludWU7XG4gICAgfVxuICAgIGNvbnN0IG1vZFBhdGggPSBwYXRoLmpvaW4oaW5zdGFsbFBhdGgsIG1vZC5pbnN0YWxsYXRpb25QYXRoKTtcbiAgICBjb25zdCBmaWxlczogSUVudHJ5W10gPSBhd2FpdCB3YWxrUGF0aChtb2RQYXRoLCB7IHNraXBMaW5rczogdHJ1ZSwgc2tpcEhpZGRlbjogdHJ1ZSwgc2tpcEluYWNjZXNzaWJsZTogdHJ1ZSB9KTtcbiAgICBjb25zdCBtYW5pZmVzdEZpbGUgPSBmaWxlcy5maW5kKGZpbGUgPT4gcGF0aC5iYXNlbmFtZShmaWxlLmZpbGVQYXRoKSA9PT0gTU9EX01BTklGRVNUKTtcbiAgICBpZiAobWFuaWZlc3RGaWxlID09PSB1bmRlZmluZWQpIHtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cbiAgICBjb25zdCByZWxQYXRoID0gcGF0aC5yZWxhdGl2ZShtb2RQYXRoLCBwYXRoLmRpcm5hbWUobWFuaWZlc3RGaWxlLmZpbGVQYXRoKSk7XG4gICAgY29uc3QgbW9kQ29uZmlnRmlsZVBhdGggPSBwYXRoLmpvaW4oY29uZmlnTW9kLmNvbmZpZ01vZFBhdGgsIHJlbFBhdGgsIE1PRF9DT05GSUcpO1xuICAgIGF3YWl0IGZzLmNvcHlBc3luYyhtb2RDb25maWdGaWxlUGF0aCwgcGF0aC5qb2luKG1vZFBhdGgsIHJlbFBhdGgsIE1PRF9DT05GSUcpLCB7IG92ZXJ3cml0ZTogdHJ1ZSB9KS5jYXRjaChlcnIgPT4gbnVsbCk7XG4gICAgdHJ5IHtcbiAgICAgIGF3YWl0IGFwcGx5VG9Nb2RDb25maWcoYXBpLCAoKSA9PiBkZWxldGVGb2xkZXIocGF0aC5kaXJuYW1lKG1vZENvbmZpZ0ZpbGVQYXRoKSkpO1xuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgYXBpLnNob3dFcnJvck5vdGlmaWNhdGlvbignRmFpbGVkIHRvIHdyaXRlIG1vZCBjb25maWcnLCBlcnIpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgfVxuXG4gIHJlbW92ZUNvbmZpZ01vZEF0dHJpYnV0ZXMoYXBpLCBjb25maWdNb2QubW9kLCByZWxldmFudCk7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBhcHBseVRvTW9kQ29uZmlnKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSwgY2I6ICgpID0+IFByb21pc2U8dm9pZD4pIHtcbiAgLy8gQXBwbHlpbmcgZmlsZSBvcGVyYXRpb25zIHRvIHRoZSBjb25maWcgbW9kIHJlcXVpcmVzIHVzIHRvXG4gIC8vICByZW1vdmUgaXQgZnJvbSB0aGUgZ2FtZSBkaXJlY3RvcnkgYW5kIGRlcGxveW1lbnQgbWFuaWZlc3QgYmVmb3JlXG4gIC8vICByZS1pbnRyb2R1Y2luZyBpdCAodGhpcyBpcyB0byBhdm9pZCBFQ0QpXG4gIHRyeSB7XG4gICAgY29uc3QgY29uZmlnTW9kID0gYXdhaXQgaW5pdGlhbGl6ZShhcGkpO1xuICAgIGF3YWl0IGFwaS5lbWl0QW5kQXdhaXQoJ2RlcGxveS1zaW5nbGUtbW9kJywgR0FNRV9JRCwgY29uZmlnTW9kLm1vZC5pZCwgZmFsc2UpO1xuICAgIGF3YWl0IGNiKCk7XG4gICAgYXdhaXQgYXBpLmVtaXRBbmRBd2FpdCgnZGVwbG95LXNpbmdsZS1tb2QnLCBHQU1FX0lELCBjb25maWdNb2QubW9kLmlkLCB0cnVlKTsgXG4gIH0gY2F0Y2ggKGVycikge1xuICAgIGFwaS5zaG93RXJyb3JOb3RpZmljYXRpb24oJ0ZhaWxlZCB0byB3cml0ZSBtb2QgY29uZmlnJywgZXJyKTtcbiAgfVxufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gb25SZXZlcnRGaWxlcyhhcGk6IHR5cGVzLklFeHRlbnNpb25BcGksIHByb2ZpbGVJZDogc3RyaW5nKSB7XG4gIGNvbnN0IHN0YXRlID0gYXBpLmdldFN0YXRlKCk7XG4gIGNvbnN0IHByb2ZpbGUgPSBzZWxlY3RvcnMucHJvZmlsZUJ5SWQoc3RhdGUsIHByb2ZpbGVJZCk7XG4gIGlmIChwcm9maWxlPy5nYW1lSWQgIT09IEdBTUVfSUQpIHtcbiAgICByZXR1cm47XG4gIH1cbiAgY29uc3QgY29uZmlnTW9kID0gYXdhaXQgaW5pdGlhbGl6ZShhcGkpO1xuICBpZiAoIWNvbmZpZ01vZCkge1xuICAgIHJldHVybjtcbiAgfVxuICBjb25zdCBhdHRyaWIgPSBleHRyYWN0Q29uZmlnTW9kQXR0cmlidXRlcyhzdGF0ZSwgY29uZmlnTW9kLm1vZC5pZCk7XG4gIGlmIChhdHRyaWIubGVuZ3RoID09PSAwKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgYXdhaXQgb25XaWxsRW5hYmxlTW9kcyhhcGksIHByb2ZpbGVJZCwgYXR0cmliLCBmYWxzZSk7XG4gIHJldHVybjtcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIG9uQWRkZWRGaWxlcyhhcGk6IHR5cGVzLklFeHRlbnNpb25BcGksIHByb2ZpbGVJZDogc3RyaW5nLCBmaWxlczogSUZpbGVFbnRyeVtdKSB7XG4gIGNvbnN0IHN0YXRlID0gYXBpLnN0b3JlLmdldFN0YXRlKCk7XG4gIGNvbnN0IHByb2ZpbGUgPSBzZWxlY3RvcnMucHJvZmlsZUJ5SWQoc3RhdGUsIHByb2ZpbGVJZCk7XG4gIGlmIChwcm9maWxlPy5nYW1lSWQgIT09IEdBTUVfSUQpIHtcbiAgICAvLyBkb24ndCBjYXJlIGFib3V0IGFueSBvdGhlciBnYW1lc1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGNvbnN0IHNtYXBpVG9vbDogdHlwZXMuSURpc2NvdmVyZWRUb29sID0gZmluZFNNQVBJVG9vbChhcGkpO1xuICBpZiAoc21hcGlUb29sID09PSB1bmRlZmluZWQpIHtcbiAgICAvLyBWZXJ5IGltcG9ydGFudCBub3QgdG8gYWRkIGFueSBmaWxlcyBpZiBWb3J0ZXggaGFzIG5vIGtub3dsZWRnZSBvZiBTTUFQSSdzIGxvY2F0aW9uLlxuICAgIC8vICB0aGlzIGlzIHRvIGF2b2lkIHB1bGxpbmcgU01BUEkgY29uZmlndXJhdGlvbiBmaWxlcyBpbnRvIG9uZSBvZiB0aGUgbW9kcyBpbnN0YWxsZWQgYnkgVm9ydGV4LlxuICAgIHJldHVybjtcbiAgfVxuICBjb25zdCBpc1NNQVBJRmlsZSA9IChmaWxlOiBJRmlsZUVudHJ5KSA9PiB7XG4gICAgY29uc3Qgc2VnbWVudHMgPSBmaWxlLmZpbGVQYXRoLnRvTG93ZXJDYXNlKCkuc3BsaXQocGF0aC5zZXApLmZpbHRlcihzZWcgPT4gISFzZWcpO1xuICAgIHJldHVybiBzZWdtZW50cy5pbmNsdWRlcygnc21hcGlfaW50ZXJuYWwnKTtcbiAgfTtcbiAgY29uc3QgbWVyZ2VDb25maWdzID0gdXRpbC5nZXRTYWZlKHN0YXRlLCBbJ3NldHRpbmdzJywgJ1NEVicsICdtZXJnZUNvbmZpZ3MnLCBwcm9maWxlLmlkXSwgZmFsc2UpO1xuICBjb25zdCByZXN1bHQgPSBmaWxlcy5yZWR1Y2UoKGFjY3VtLCBmaWxlKSA9PiB7XG4gICAgaWYgKG1lcmdlQ29uZmlncyAmJiAhaXNTTUFQSUZpbGUoZmlsZSkgJiYgcGF0aC5iYXNlbmFtZShmaWxlLmZpbGVQYXRoKS50b0xvd2VyQ2FzZSgpID09PSBNT0RfQ09ORklHKSB7XG4gICAgICBhY2N1bS5jb25maWdzLnB1c2goZmlsZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGFjY3VtLnJlZ3VsYXJzLnB1c2goZmlsZSk7XG4gICAgfVxuICAgIHJldHVybiBhY2N1bTtcbiAgfSwgeyBjb25maWdzOiBbXSBhcyBJRmlsZUVudHJ5W10sIHJlZ3VsYXJzOiBbXSBhcyBJRmlsZUVudHJ5W10gfSk7XG4gIHJldHVybiBQcm9taXNlLmFsbChbXG4gICAgYWRkQ29uZmlnRmlsZXMoYXBpLCBwcm9maWxlSWQsIHJlc3VsdC5jb25maWdzKSxcbiAgICBhZGRSZWd1bGFyRmlsZXMoYXBpLCBwcm9maWxlSWQsIHJlc3VsdC5yZWd1bGFycylcbiAgXSk7XG59XG5cbmZ1bmN0aW9uIGV4dHJhY3RDb25maWdNb2RBdHRyaWJ1dGVzKHN0YXRlOiB0eXBlcy5JU3RhdGUsIGNvbmZpZ01vZElkOiBzdHJpbmcpOiBhbnkge1xuICByZXR1cm4gdXRpbC5nZXRTYWZlKHN0YXRlLCBbJ3BlcnNpc3RlbnQnLCAnbW9kcycsIEdBTUVfSUQsIGNvbmZpZ01vZElkLCAnYXR0cmlidXRlcycsICdjb25maWdNb2QnXSwgW10pO1xufVxuXG5mdW5jdGlvbiBzZXRDb25maWdNb2RBdHRyaWJ1dGUoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpLCBjb25maWdNb2RJZDogc3RyaW5nLCBhdHRyaWJ1dGVzOiBzdHJpbmdbXSkge1xuICBhcGkuc3RvcmUuZGlzcGF0Y2goYWN0aW9ucy5zZXRNb2RBdHRyaWJ1dGUoR0FNRV9JRCwgY29uZmlnTW9kSWQsICdjb25maWdNb2QnLCBhdHRyaWJ1dGVzKSk7XG59XG5cbmZ1bmN0aW9uIHJlbW92ZUNvbmZpZ01vZEF0dHJpYnV0ZXMoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpLCBjb25maWdNb2Q6IHR5cGVzLklNb2QsIGF0dHJpYnV0ZXM6IHN0cmluZ1tdKSB7XG4gIGNvbnN0IGV4aXN0aW5nID0gZXh0cmFjdENvbmZpZ01vZEF0dHJpYnV0ZXMoYXBpLmdldFN0YXRlKCksIGNvbmZpZ01vZC5pZCk7XG4gIGNvbnN0IG5ld0F0dHJpYnV0ZXMgPSBleGlzdGluZy5maWx0ZXIoYXR0ciA9PiAhYXR0cmlidXRlcy5pbmNsdWRlcyhhdHRyKSk7XG4gIHNldENvbmZpZ01vZEF0dHJpYnV0ZShhcGksIGNvbmZpZ01vZC5pZCwgbmV3QXR0cmlidXRlcyk7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGFkZENvbmZpZ0ZpbGVzKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSwgcHJvZmlsZUlkOiBzdHJpbmcsIGZpbGVzOiBJRmlsZUVudHJ5W10pIHtcbiAgaWYgKGZpbGVzLmxlbmd0aCA9PT0gMCkge1xuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcbiAgfVxuICBhcGkuc2VuZE5vdGlmaWNhdGlvbih7XG4gICAgdHlwZTogJ2FjdGl2aXR5JyxcbiAgICBpZDogTk9USUZfQUNUSVZJVFlfQ09ORklHX01PRCxcbiAgICB0aXRsZTogJ0ltcG9ydGluZyBjb25maWcgZmlsZXMuLi4nLFxuICAgIG1lc3NhZ2U6ICdTdGFydGluZyB1cC4uLidcbiAgfSk7XG5cbiAgcmV0dXJuIGFkZE1vZENvbmZpZyhhcGksIGZpbGVzLCB1bmRlZmluZWQpO1xufVxuXG5hc3luYyBmdW5jdGlvbiBhZGRSZWd1bGFyRmlsZXMoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpLCBwcm9maWxlSWQ6IHN0cmluZywgZmlsZXM6IElGaWxlRW50cnlbXSkge1xuICBpZiAoZmlsZXMubGVuZ3RoID09PSAwKSB7XG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xuICB9XG4gIGNvbnN0IHN0YXRlID0gYXBpLmdldFN0YXRlKCk7XG4gIGNvbnN0IGdhbWUgPSB1dGlsLmdldEdhbWUoR0FNRV9JRCk7XG4gIGNvbnN0IGRpc2NvdmVyeSA9IHNlbGVjdG9ycy5kaXNjb3ZlcnlCeUdhbWUoc3RhdGUsIEdBTUVfSUQpO1xuICBjb25zdCBtb2RQYXRocyA9IGdhbWUuZ2V0TW9kUGF0aHMoZGlzY292ZXJ5LnBhdGgpO1xuICBjb25zdCBpbnN0YWxsUGF0aCA9IHNlbGVjdG9ycy5pbnN0YWxsUGF0aEZvckdhbWUoc3RhdGUsIEdBTUVfSUQpO1xuICBmb3IgKGNvbnN0IGVudHJ5IG9mIGZpbGVzKSB7XG4gICAgaWYgKGVudHJ5LmNhbmRpZGF0ZXMubGVuZ3RoID09PSAxKSB7XG4gICAgICBjb25zdCBtb2QgPSB1dGlsLmdldFNhZmUoc3RhdGUucGVyc2lzdGVudC5tb2RzLFxuICAgICAgICBbR0FNRV9JRCwgZW50cnkuY2FuZGlkYXRlc1swXV0sXG4gICAgICAgIHVuZGVmaW5lZCk7XG4gICAgICBpZiAoIWlzTW9kQ2FuZGlkYXRlVmFsaWQobW9kLCBlbnRyeSkpIHtcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xuICAgICAgfVxuICAgICAgY29uc3QgZnJvbSA9IG1vZFBhdGhzW21vZC50eXBlID8/ICcnXTtcbiAgICAgIGlmIChmcm9tID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgLy8gSG93IGlzIHRoaXMgZXZlbiBwb3NzaWJsZT8gcmVnYXJkbGVzcyBpdCdzIG5vdCB0aGlzXG4gICAgICAgIC8vICBmdW5jdGlvbidzIGpvYiB0byByZXBvcnQgdGhpcy5cbiAgICAgICAgbG9nKCdlcnJvcicsICdmYWlsZWQgdG8gcmVzb2x2ZSBtb2QgcGF0aCBmb3IgbW9kIHR5cGUnLCBtb2QudHlwZSk7XG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IHJlbFBhdGggPSBwYXRoLnJlbGF0aXZlKGZyb20sIGVudHJ5LmZpbGVQYXRoKTtcbiAgICAgIGNvbnN0IHRhcmdldFBhdGggPSBwYXRoLmpvaW4oaW5zdGFsbFBhdGgsIG1vZC5pZCwgcmVsUGF0aCk7XG4gICAgICAvLyBjb3B5IHRoZSBuZXcgZmlsZSBiYWNrIGludG8gdGhlIGNvcnJlc3BvbmRpbmcgbW9kLCB0aGVuIGRlbGV0ZSBpdC4gVGhhdCB3YXksIHZvcnRleCB3aWxsXG4gICAgICAvLyBjcmVhdGUgYSBsaW5rIHRvIGl0IHdpdGggdGhlIGNvcnJlY3QgZGVwbG95bWVudCBtZXRob2QgYW5kIG5vdCBhc2sgdGhlIHVzZXIgYW55IHF1ZXN0aW9uc1xuICAgICAgdHJ5IHtcbiAgICAgICAgYXdhaXQgZnMuZW5zdXJlRGlyV3JpdGFibGVBc3luYyhwYXRoLmRpcm5hbWUodGFyZ2V0UGF0aCkpO1xuICAgICAgICBhd2FpdCBmcy5jb3B5QXN5bmMoZW50cnkuZmlsZVBhdGgsIHRhcmdldFBhdGgpO1xuICAgICAgICBhd2FpdCBmcy5yZW1vdmVBc3luYyhlbnRyeS5maWxlUGF0aCk7XG4gICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgaWYgKCFlcnIubWVzc2FnZS5pbmNsdWRlcygnYXJlIHRoZSBzYW1lIGZpbGUnKSkge1xuICAgICAgICAgIC8vIHNob3VsZCB3ZSBiZSByZXBvcnRpbmcgdGhpcyB0byB0aGUgdXNlcj8gVGhpcyBpcyBhIGNvbXBsZXRlbHlcbiAgICAgICAgICAvLyBhdXRvbWF0ZWQgcHJvY2VzcyBhbmQgaWYgaXQgZmFpbHMgbW9yZSBvZnRlbiB0aGFuIG5vdCB0aGVcbiAgICAgICAgICAvLyB1c2VyIHByb2JhYmx5IGRvZXNuJ3QgY2FyZVxuICAgICAgICAgIGxvZygnZXJyb3InLCAnZmFpbGVkIHRvIHJlLWltcG9ydCBhZGRlZCBmaWxlIHRvIG1vZCcsIGVyci5tZXNzYWdlKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG5jb25zdCBpc01vZENhbmRpZGF0ZVZhbGlkID0gKG1vZCwgZW50cnkpID0+IHtcbiAgaWYgKG1vZD8uaWQgPT09IHVuZGVmaW5lZCB8fCBtb2QudHlwZSA9PT0gJ3NkdnJvb3Rmb2xkZXInKSB7XG4gICAgLy8gVGhlcmUgaXMgbm8gcmVsaWFibGUgd2F5IHRvIGFzY2VydGFpbiB3aGV0aGVyIGEgbmV3IGZpbGUgZW50cnlcbiAgICAvLyAgYWN0dWFsbHkgYmVsb25ncyB0byBhIHJvb3QgbW9kVHlwZSBhcyBzb21lIG9mIHRoZXNlIG1vZHMgd2lsbCBhY3RcbiAgICAvLyAgYXMgcmVwbGFjZW1lbnQgbW9kcy4gVGhpcyBvYnZpb3VzbHkgbWVhbnMgdGhhdCBpZiB0aGUgZ2FtZSBoYXNcbiAgICAvLyAgYSBzdWJzdGFudGlhbCB1cGRhdGUgd2hpY2ggaW50cm9kdWNlcyBuZXcgZmlsZXMgd2UgY291bGQgcG90ZW50aWFsbHlcbiAgICAvLyAgYWRkIGEgdmFuaWxsYSBnYW1lIGZpbGUgaW50byB0aGUgbW9kJ3Mgc3RhZ2luZyBmb2xkZXIgY2F1c2luZyBjb25zdGFudFxuICAgIC8vICBjb250ZW50aW9uIGJldHdlZW4gdGhlIGdhbWUgaXRzZWxmICh3aGVuIGl0IHVwZGF0ZXMpIGFuZCB0aGUgbW9kLlxuICAgIC8vXG4gICAgLy8gVGhlcmUgaXMgYWxzbyBhIHBvdGVudGlhbCBjaGFuY2UgZm9yIHJvb3QgbW9kVHlwZXMgdG8gY29uZmxpY3Qgd2l0aCByZWd1bGFyXG4gICAgLy8gIG1vZHMsIHdoaWNoIGlzIHdoeSBpdCdzIG5vdCBzYWZlIHRvIGFzc3VtZSB0aGF0IGFueSBhZGRpdGlvbiBpbnNpZGUgdGhlXG4gICAgLy8gIG1vZHMgZGlyZWN0b3J5IGNhbiBiZSBzYWZlbHkgYWRkZWQgdG8gdGhpcyBtb2QncyBzdGFnaW5nIGZvbGRlciBlaXRoZXIuXG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgaWYgKG1vZC50eXBlICE9PSAnU01BUEknKSB7XG4gICAgLy8gT3RoZXIgbW9kIHR5cGVzIGRvIG5vdCByZXF1aXJlIGZ1cnRoZXIgdmFsaWRhdGlvbiAtIGl0IHNob3VsZCBiZSBmaW5lXG4gICAgLy8gIHRvIGFkZCB0aGlzIGVudHJ5LlxuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgY29uc3Qgc2VnbWVudHMgPSBlbnRyeS5maWxlUGF0aC50b0xvd2VyQ2FzZSgpLnNwbGl0KHBhdGguc2VwKS5maWx0ZXIoc2VnID0+ICEhc2VnKTtcbiAgY29uc3QgbW9kc1NlZ0lkeCA9IHNlZ21lbnRzLmluZGV4T2YoJ21vZHMnKTtcbiAgY29uc3QgbW9kRm9sZGVyTmFtZSA9ICgobW9kc1NlZ0lkeCAhPT0gLTEpICYmIChzZWdtZW50cy5sZW5ndGggPiBtb2RzU2VnSWR4ICsgMSkpXG4gICAgPyBzZWdtZW50c1ttb2RzU2VnSWR4ICsgMV0gOiB1bmRlZmluZWQ7XG5cbiAgbGV0IGJ1bmRsZWRNb2RzID0gdXRpbC5nZXRTYWZlKG1vZCwgWydhdHRyaWJ1dGVzJywgJ3NtYXBpQnVuZGxlZE1vZHMnXSwgW10pO1xuICBidW5kbGVkTW9kcyA9IGJ1bmRsZWRNb2RzLmxlbmd0aCA+IDAgPyBidW5kbGVkTW9kcyA6IGdldEJ1bmRsZWRNb2RzKCk7XG4gIGlmIChzZWdtZW50cy5pbmNsdWRlcygnY29udGVudCcpKSB7XG4gICAgLy8gU01BUEkgaXMgbm90IHN1cHBvc2VkIHRvIG92ZXJ3cml0ZSB0aGUgZ2FtZSdzIGNvbnRlbnQgZGlyZWN0bHkuXG4gICAgLy8gIHRoaXMgaXMgY2xlYXJseSBub3QgYSBTTUFQSSBmaWxlIGFuZCBzaG91bGQgX25vdF8gYmUgYWRkZWQgdG8gaXQuXG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgcmV0dXJuIChtb2RGb2xkZXJOYW1lICE9PSB1bmRlZmluZWQpICYmIGJ1bmRsZWRNb2RzLmluY2x1ZGVzKG1vZEZvbGRlck5hbWUpO1xufTsiXX0=