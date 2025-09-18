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
const shouldSuppressSync = (api) => {
    const state = api.getState();
    const suppressOnActivities = ['installing_dependencies'];
    const isActivityRunning = (activity) => vortex_api_1.util.getSafe(state, ['session', 'base', 'activity', activity], []).length > 0;
    const suppressingActivities = suppressOnActivities.filter(activity => isActivityRunning(activity));
    const suppressing = suppressingActivities.length > 0;
    return suppressing;
};
function onSyncModConfigurations(api, silent) {
    return __awaiter(this, void 0, void 0, function* () {
        const state = api.getState();
        const profile = vortex_api_1.selectors.activeProfile(state);
        if ((profile === null || profile === void 0 ? void 0 : profile.gameId) !== common_1.GAME_ID || shouldSuppressSync(api)) {
            return;
        }
        const smapiTool = (0, SMAPI_1.findSMAPITool)(api);
        if (!(smapiTool === null || smapiTool === void 0 ? void 0 : smapiTool.path)) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29uZmlnTW9kLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiY29uZmlnTW9kLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7OztBQUNBLGdEQUF3QjtBQUN4QiwyQ0FBc0U7QUFDdEUscUNBQW9KO0FBQ3BKLHVDQUE0QztBQUU1QyxpQ0FBb0U7QUFFcEUsbUNBQXNEO0FBR3RELE1BQU0sV0FBVyxHQUFHLENBQUMsR0FBd0IsRUFBRSxFQUFFO0lBQy9DLHVCQUF1QixDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBQy9CLENBQUMsQ0FBQTtBQUVELFNBQWdCLGlCQUFpQixDQUFDLE9BQWdDO0lBQ2hFLE9BQU8sQ0FBQyxjQUFjLENBQUMsV0FBVyxFQUFFLEdBQUcsRUFBRSxNQUFNLEVBQUUsRUFBRSxFQUFFLHlCQUF5QixFQUM1RSxHQUFHLEVBQUUsQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxFQUM5QixHQUFHLEVBQUU7UUFDSCxNQUFNLEtBQUssR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUMzQyxNQUFNLFFBQVEsR0FBRyxzQkFBUyxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUMvQyxPQUFPLENBQUMsUUFBUSxLQUFLLGdCQUFPLENBQUMsQ0FBQztJQUNoQyxDQUFDLENBQUMsQ0FBQztBQUNQLENBQUM7QUFSRCw4Q0FRQztBQUVELE1BQU0sa0JBQWtCLEdBQUcsQ0FBQyxHQUF3QixFQUFFLEVBQUU7SUFDdEQsTUFBTSxLQUFLLEdBQUcsR0FBRyxDQUFDLFFBQVEsRUFBRSxDQUFDO0lBQzdCLE1BQU0sb0JBQW9CLEdBQUcsQ0FBQyx5QkFBeUIsQ0FBQyxDQUFDO0lBQ3pELE1BQU0saUJBQWlCLEdBQUcsQ0FBQyxRQUFnQixFQUFFLEVBQUUsQ0FBQyxpQkFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsQ0FBQyxTQUFTLEVBQUUsTUFBTSxFQUFFLFVB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UyxDQUFDLEVBQUU7UUFHaEMsT0FBTyxLQUFLLENBQUM7S0FDZDtJQUVELE9BQU8sQ0FBQyxhQUFhLEtBQUssU0FBUyxDQUFDLElBQUksV0FBVyxDQUFDLFFBQVEsQ0FBQyxhQUFhLENBQUMsQ0FBQztBQUM5RSxDQUFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiBlc2xpbnQtZGlzYWJsZSAqL1xuaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgeyBhY3Rpb25zLCBmcywgdHlwZXMsIHNlbGVjdG9ycywgbG9nLCB1dGlsIH0gZnJvbSAndm9ydGV4LWFwaSc7XG5pbXBvcnQgeyBOT1RJRl9BQ1RJVklUWV9DT05GSUdfTU9ELCBHQU1FX0lELCBNT0RfQ09ORklHLCBSR1hfSU5WQUxJRF9DSEFSU19XSU5ET1dTLCBNT0RfVFlQRV9DT05GSUcsIE1PRF9NQU5JRkVTVCwgZ2V0QnVuZGxlZE1vZHMgfSBmcm9tICcuL2NvbW1vbic7XG5pbXBvcnQgeyBzZXRNZXJnZUNvbmZpZ3MgfSBmcm9tICcuL2FjdGlvbnMnO1xuaW1wb3J0IHsgSUZpbGVFbnRyeSB9IGZyb20gJy4vdHlwZXMnO1xuaW1wb3J0IHsgd2Fsa1BhdGgsIGRlZmF1bHRNb2RzUmVsUGF0aCwgZGVsZXRlRm9sZGVyIH0gZnJvbSAnLi91dGlsJztcblxuaW1wb3J0IHsgZmluZFNNQVBJTW9kLCBmaW5kU01BUElUb29sIH0gZnJvbSAnLi9TTUFQSSc7XG5pbXBvcnQgeyBJRW50cnkgfSBmcm9tICd0dXJib3dhbGsnO1xuXG5jb25zdCBzeW5jV3JhcHBlciA9IChhcGk6IHR5cGVzLklFeHRlbnNpb25BcGkpID0+IHtcbiAgb25TeW5jTW9kQ29uZmlndXJhdGlvbnMoYXBpKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJlZ2lzdGVyQ29uZmlnTW9kKGNvbnRleHQ6IHR5cGVzLklFeHRlbnNpb25Db250ZXh0KSB7XG4gIGNvbnRleHQucmVnaXN0ZXJBY3Rpb24oJ21vZC1pY29ucycsIDk5OSwgJ3N3YXAnLCB7fSwgJ1N5bmMgTW9kIENvbmZpZ3VyYXRpb25zJyxcbiAgICAoKSA9PiBzeW5jV3JhcHBlcihjb250ZXh0LmFwaSksXG4gICAgKCkgPT4ge1xuICAgICAgY29uc3Qgc3RhdGUgPSBjb250ZXh0LmFwaS5zdG9yZS5nZXRTdGF0ZSgpO1xuICAgICAgY29uc3QgZ2FtZU1vZGUgPSBzZWxlY3RvcnMuYWN0aXZlR2FtZUlkKHN0YXRlKTtcbiAgICAgIHJldHVybiAoZ2FtZU1vZGUgPT09IEdBTUVfSUQpO1xuICAgIH0pO1xufVxuXG5jb25zdCBzaG91bGRTdXBwcmVzc1N5bmMgPSAoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpKSA9PiB7XG4gIGNvbnN0IHN0YXRlID0gYXBpLmdldFN0YXRlKCk7XG4gIGNvbnN0IHN1cHByZXNzT25BY3Rpdml0aWVzID0gWydpbnN0YWxsaW5nX2RlcGVuZGVuY2llcyddO1xuICBjb25zdCBpc0FjdGl2aXR5UnVubmluZyA9IChhY3Rpdml0eTogc3RyaW5nKSA9PiB1dGlsLmdldFNhZmUoc3RhdGUsIFsnc2Vzc2lvbicsICdiYXNlJywgJ2FjdGl2aXR5JywgYWN0aXZpdHldLCBbXSkubGVuZ3RoID4gMDtcbiAgY29uc3Qgc3VwcHJlc3NpbmdBY3Rpdml0aWVzID0gc3VwcHJlc3NPbkFjdGl2aXRpZXMuZmlsdGVyKGFjdGl2aXR5ID0+IGlzQWN0aXZpdHlSdW5uaW5nKGFjdGl2aXR5KSk7XG4gIGNvbnN0IHN1cHByZXNzaW5nID0gc3VwcHJlc3NpbmdBY3Rpdml0aWVzLmxlbmd0aCA+IDA7XG4gIHJldHVybiBzdXBwcmVzc2luZztcbn1cblxuYXN5bmMgZnVuY3Rpb24gb25TeW5jTW9kQ29uZmlndXJhdGlvbnMoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpLCBzaWxlbnQ/OiBib29sZWFuKTogUHJvbWlzZTx2b2lkPiB7XG4gIGNvbnN0IHN0YXRlID0gYXBpLmdldFN0YXRlKCk7XG4gIGNvbnN0IHByb2ZpbGUgPSBzZWxlY3RvcnMuYWN0aXZlUHJvZmlsZShzdGF0ZSk7XG4gIGlmIChwcm9maWxlPy5nYW1lSWQgIT09IEdBTUVfSUQgfHwgc2hvdWxkU3VwcHJlc3NTeW5jKGFwaSkpIHtcbiAgICByZXR1cm47XG4gIH1cbiAgY29uc3Qgc21hcGlUb29sOiB0eXBlcy5JRGlzY292ZXJlZFRvb2wgPSBmaW5kU01BUElUb29sKGFwaSk7XG4gIGlmICghc21hcGlUb29sPy5wYXRoKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIGNvbnN0IG1lcmdlQ29uZmlncyA9IHV0aWwuZ2V0U2FmZShzdGF0ZSwgWydzZXR0aW5ncycsICdTRFYnLCAnbWVyZ2VDb25maWdzJywgcHJvZmlsZS5pZF0sIGZhbHNlKTtcbiAgaWYgKCFtZXJnZUNvbmZpZ3MpIHtcbiAgICBpZiAoc2lsZW50KSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IGFwaS5zaG93RGlhbG9nKCdpbmZvJywgJ01vZCBDb25maWd1cmF0aW9uIFN5bmMnLCB7XG4gICAgICBiYmNvZGU6ICdNYW55IFN0YXJkZXcgVmFsbGV5IG1vZHMgZ2VuZXJhdGUgdGhlaXIgb3duIGNvbmZpZ3VyYXRpb24gZmlsZXMgZHVyaW5nIGdhbWUgcGxheS4gQnkgZGVmYXVsdCB0aGUgZ2VuZXJhdGVkIGZpbGVzIGFyZSwgJ1xuICAgICAgICArICdpbmdlc3RlZCBieSB0aGVpciByZXNwZWN0aXZlIG1vZHMuW2JyXVsvYnJdW2JyXVsvYnJdJ1xuICAgICAgICArICdVbmZvcnR1bmF0ZWx5IHRoZSBtb2QgY29uZmlndXJhdGlvbiBmaWxlcyBhcmUgbG9zdCB3aGVuIHVwZGF0aW5nIG9yIHJlbW92aW5nIGEgbW9kLlticl1bL2JyXVticl1bL2JyXSBUaGlzIGJ1dHRvbiBhbGxvd3MgeW91IHRvICdcbiAgICAgICAgKyAnSW1wb3J0IGFsbCBvZiB5b3VyIGFjdGl2ZSBtb2RcXCdzIGNvbmZpZ3VyYXRpb24gZmlsZXMgaW50byBhIHNpbmdsZSBtb2Qgd2hpY2ggd2lsbCByZW1haW4gdW5hZmZlY3RlZCBieSBtb2QgdXBkYXRlcy5bYnJdWy9icl1bYnJdWy9icl0nXG4gICAgICAgICsgJ1dvdWxkIHlvdSBsaWtlIHRvIGVuYWJsZSB0aGlzIGZ1bmN0aW9uYWxpdHk/IChTTUFQSSBtdXN0IGJlIGluc3RhbGxlZCknLFxuICAgIH0sIFtcbiAgICAgIHsgbGFiZWw6ICdDbG9zZScgfSxcbiAgICAgIHsgbGFiZWw6ICdFbmFibGUnIH1cbiAgICBdKTtcblxuICAgIGlmIChyZXN1bHQuYWN0aW9uID09PSAnQ2xvc2UnKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKHJlc3VsdC5hY3Rpb24gPT09ICdFbmFibGUnKSB7XG4gICAgICBhcGkuc3RvcmUuZGlzcGF0Y2goc2V0TWVyZ2VDb25maWdzKHByb2ZpbGUuaWQsIHRydWUpKTtcbiAgICB9XG4gIH1cblxuICB0eXBlIEV2ZW50VHlwZSA9ICdwdXJnZS1tb2RzJyB8ICdkZXBsb3ktbW9kcyc7XG4gIGNvbnN0IGV2ZW50UHJvbWlzZSA9IChhcGk6IHR5cGVzLklFeHRlbnNpb25BcGksIGV2ZW50VHlwZTogRXZlbnRUeXBlKSA9PiBuZXcgUHJvbWlzZTx2b2lkPigocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgY29uc3QgY2IgPSAoZXJyOiBhbnkpID0+IGVyciAhPT0gbnVsbCA/IHJlamVjdChlcnIpIDogcmVzb2x2ZSgpO1xuICAgIChldmVudFR5cGUgPT09ICdwdXJnZS1tb2RzJylcbiAgICAgID8gYXBpLmV2ZW50cy5lbWl0KGV2ZW50VHlwZSwgZmFsc2UsIGNiKVxuICAgICAgOiBhcGkuZXZlbnRzLmVtaXQoZXZlbnRUeXBlLCBjYik7XG4gIH0pO1xuXG4gIHRyeSB7XG4gICAgY29uc3QgbW9kID0gYXdhaXQgaW5pdGlhbGl6ZShhcGkpO1xuICAgIGlmIChtb2Q/LmNvbmZpZ01vZFBhdGggPT09IHVuZGVmaW5lZCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBhd2FpdCBldmVudFByb21pc2UoYXBpLCAncHVyZ2UtbW9kcycpO1xuXG4gICAgY29uc3QgaW5zdGFsbFBhdGggPSBzZWxlY3RvcnMuaW5zdGFsbFBhdGhGb3JHYW1lKGFwaS5nZXRTdGF0ZSgpLCBHQU1FX0lEKTtcbiAgICBjb25zdCByZXNvbHZlQ2FuZGlkYXRlTmFtZSA9IChmaWxlOiBJRW50cnkpOiBzdHJpbmcgPT4ge1xuICAgICAgY29uc3QgcmVsUGF0aCA9IHBhdGgucmVsYXRpdmUoaW5zdGFsbFBhdGgsIGZpbGUuZmlsZVBhdGgpO1xuICAgICAgY29uc3Qgc2VnbWVudHMgPSByZWxQYXRoLnNwbGl0KHBhdGguc2VwKTtcbiAgICAgIHJldHVybiBzZWdtZW50c1swXTtcbiAgICB9XG4gICAgY29uc3QgZmlsZXMgPSBhd2FpdCB3YWxrUGF0aChpbnN0YWxsUGF0aCk7XG4gICAgY29uc3QgZmlsdGVyZWQgPSBmaWxlcy5yZWR1Y2UoKGFjY3VtOiBJRmlsZUVudHJ5W10sIGZpbGU6IElFbnRyeSkgPT4ge1xuICAgICAgaWYgKHBhdGguYmFzZW5hbWUoZmlsZS5maWxlUGF0aCkudG9Mb3dlckNhc2UoKSA9PT0gTU9EX0NPTkZJRyAmJiAhcGF0aC5kaXJuYW1lKGZpbGUuZmlsZVBhdGgpLmluY2x1ZGVzKG1vZC5jb25maWdNb2RQYXRoKSkge1xuICAgICAgICBjb25zdCBjYW5kaWRhdGVOYW1lID0gcmVzb2x2ZUNhbmRpZGF0ZU5hbWUoZmlsZSk7XG4gICAgICAgIGlmICh1dGlsLmdldFNhZmUocHJvZmlsZSwgWydtb2RTdGF0ZScsIGNhbmRpZGF0ZU5hbWUsICdlbmFibGVkJ10sIGZhbHNlKSA9PT0gZmFsc2UpIHtcbiAgICAgICAgICByZXR1cm4gYWNjdW07XG4gICAgICAgIH1cbiAgICAgICAgYWNjdW0ucHVzaCh7IGZpbGVQYXRoOiBmaWxlLmZpbGVQYXRoLCBjYW5kaWRhdGVzOiBbY2FuZGlkYXRlTmFtZV0gfSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gYWNjdW07XG4gICAgfSwgW10pO1xuICAgIGF3YWl0IGFkZE1vZENvbmZpZyhhcGksIGZpbHRlcmVkLCBpbnN0YWxsUGF0aCk7XG4gICAgYXdhaXQgZXZlbnRQcm9taXNlKGFwaSwgJ2RlcGxveS1tb2RzJyk7XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIGFwaS5zaG93RXJyb3JOb3RpZmljYXRpb24oJ0ZhaWxlZCB0byBzeW5jIG1vZCBjb25maWd1cmF0aW9ucycsIGVycik7XG4gIH1cbn1cblxuZnVuY3Rpb24gc2FuaXRpemVQcm9maWxlTmFtZShpbnB1dDogc3RyaW5nKSB7XG4gIHJldHVybiBpbnB1dC5yZXBsYWNlKFJHWF9JTlZBTElEX0NIQVJTX1dJTkRPV1MsICdfJyk7XG59XG5cbmZ1bmN0aW9uIGNvbmZpZ01vZE5hbWUocHJvZmlsZU5hbWU6IHN0cmluZykge1xuICByZXR1cm4gYFN0YXJkZXcgVmFsbGV5IENvbmZpZ3VyYXRpb24gKCR7c2FuaXRpemVQcm9maWxlTmFtZShwcm9maWxlTmFtZSl9KWA7XG59XG5cbnR5cGUgQ29uZmlnTW9kID0ge1xuICBtb2Q6IHR5cGVzLklNb2Q7XG4gIGNvbmZpZ01vZFBhdGg6IHN0cmluZztcbn1cbmFzeW5jIGZ1bmN0aW9uIGluaXRpYWxpemUoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpKTogUHJvbWlzZTxDb25maWdNb2Q+IHtcbiAgY29uc3Qgc3RhdGUgPSBhcGkuZ2V0U3RhdGUoKTtcbiAgY29uc3QgcHJvZmlsZSA9IHNlbGVjdG9ycy5hY3RpdmVQcm9maWxlKHN0YXRlKTtcbiAgaWYgKHByb2ZpbGU/LmdhbWVJZCAhPT0gR0FNRV9JRCkge1xuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUodW5kZWZpbmVkKTtcbiAgfVxuICBjb25zdCBtZXJnZUNvbmZpZ3MgPSB1dGlsLmdldFNhZmUoc3RhdGUsIFsnc2V0dGluZ3MnLCAnU0RWJywgJ21lcmdlQ29uZmlncycsIHByb2ZpbGUuaWRdLCBmYWxzZSk7XG4gIGlmICghbWVyZ2VDb25maWdzKSB7XG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh1bmRlZmluZWQpO1xuICB9XG5cbiAgdHJ5IHtcbiAgICBjb25zdCBtb2QgPSBhd2FpdCBlbnN1cmVDb25maWdNb2QoYXBpKTtcbiAgICBjb25zdCBpbnN0YWxsYXRpb25QYXRoID0gc2VsZWN0b3JzLmluc3RhbGxQYXRoRm9yR2FtZShzdGF0ZSwgR0FNRV9JRCk7XG4gICAgY29uc3QgY29uZmlnTW9kUGF0aCA9IHBhdGguam9pbihpbnN0YWxsYXRpb25QYXRoLCBtb2QuaW5zdGFsbGF0aW9uUGF0aCk7XG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh7IGNvbmZpZ01vZFBhdGgsIG1vZCB9KTtcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgYXBpLnNob3dFcnJvck5vdGlmaWNhdGlvbignRmFpbGVkIHRvIHJlc29sdmUgY29uZmlnIG1vZCBwYXRoJywgZXJyKTtcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHVuZGVmaW5lZCk7XG4gIH1cbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGFkZE1vZENvbmZpZyhhcGk6IHR5cGVzLklFeHRlbnNpb25BcGksIGZpbGVzOiBJRmlsZUVudHJ5W10sIG1vZHNQYXRoPzogc3RyaW5nKSB7XG4gIGNvbnN0IGNvbmZpZ01vZCA9IGF3YWl0IGluaXRpYWxpemUoYXBpKTtcbiAgaWYgKGNvbmZpZ01vZCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgY29uc3Qgc3RhdGUgPSBhcGkuZ2V0U3RhdGUoKTtcbiAgY29uc3QgZGlzY292ZXJ5ID0gc2VsZWN0b3JzLmRpc2NvdmVyeUJ5R2FtZShzdGF0ZSwgR0FNRV9JRCk7XG4gIGNvbnN0IGlzSW5zdGFsbFBhdGggPSBtb2RzUGF0aCAhPT0gdW5kZWZpbmVkO1xuICBtb2RzUGF0aCA9IG1vZHNQYXRoID8/IHBhdGguam9pbihkaXNjb3ZlcnkucGF0aCwgZGVmYXVsdE1vZHNSZWxQYXRoKCkpO1xuICBjb25zdCBzbWFwaVRvb2w6IHR5cGVzLklEaXNjb3ZlcmVkVG9vbCA9IGZpbmRTTUFQSVRvb2woYXBpKTtcbiAgaWYgKHNtYXBpVG9vbCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIGNvbnN0IGNvbmZpZ01vZEF0dHJpYnV0ZXM6IHN0cmluZ1tdID0gZXh0cmFjdENvbmZpZ01vZEF0dHJpYnV0ZXMoc3RhdGUsIGNvbmZpZ01vZC5tb2QuaWQpO1xuICBsZXQgbmV3Q29uZmlnQXR0cmlidXRlcyA9IEFycmF5LmZyb20obmV3IFNldChjb25maWdNb2RBdHRyaWJ1dGVzKSk7XG4gIGZvciAoY29uc3QgZmlsZSBvZiBmaWxlcykge1xuICAgIGNvbnN0IHNlZ21lbnRzID0gZmlsZS5maWxlUGF0aC50b0xvd2VyQ2FzZSgpLnNwbGl0KHBhdGguc2VwKS5maWx0ZXIoc2VnID0+ICEhc2VnKTtcbiAgICBpZiAoc2VnbWVudHMuaW5jbHVkZXMoJ3NtYXBpX2ludGVybmFsJykpIHtcbiAgICAgIC8vIERvbid0IHRvdWNoIHRoZSBpbnRlcm5hbCBTTUFQSSBjb25maWd1cmF0aW9uIGZpbGVzLlxuICAgICAgY29udGludWU7XG4gICAgfVxuICAgIGFwaS5zZW5kTm90aWZpY2F0aW9uKHtcbiAgICAgIHR5cGU6ICdhY3Rpdml0eScsXG4gICAgICBpZDogTk9USUZfQUNUSVZJVFlfQ09ORklHX01PRCxcbiAgICAgIHRpdGxlOiAnSW1wb3J0aW5nIGNvbmZpZyBmaWxlcy4uLicsXG4gICAgICBtZXNzYWdlOiBmaWxlLmNhbmRpZGF0ZXNbMF0sXG4gICAgfSk7XG4gICAgXG4gICAgaWYgKCFjb25maWdNb2RBdHRyaWJ1dGVzLmluY2x1ZGVzKGZpbGUuY2FuZGlkYXRlc1swXSkpIHtcbiAgICAgIG5ld0NvbmZpZ0F0dHJpYnV0ZXMucHVzaChmaWxlLmNhbmRpZGF0ZXNbMF0pO1xuICAgIH1cbiAgICB0cnkge1xuICAgICAgY29uc3QgaW5zdGFsbFJlbFBhdGggPSBwYXRoLnJlbGF0aXZlKG1vZHNQYXRoLCBmaWxlLmZpbGVQYXRoKTtcbiAgICAgIGNvbnN0IHNlZ21lbnRzID0gaW5zdGFsbFJlbFBhdGguc3BsaXQocGF0aC5zZXApO1xuICAgICAgY29uc3QgcmVsUGF0aCA9IGlzSW5zdGFsbFBhdGggPyBzZWdtZW50cy5zbGljZSgxKS5qb2luKHBhdGguc2VwKSA6IGluc3RhbGxSZWxQYXRoO1xuICAgICAgY29uc3QgdGFyZ2V0UGF0aCA9IHBhdGguam9pbihjb25maWdNb2QuY29uZmlnTW9kUGF0aCwgcmVsUGF0aCk7XG4gICAgICBjb25zdCB0YXJnZXREaXIgPSBwYXRoLmV4dG5hbWUodGFyZ2V0UGF0aCkgIT09ICcnID8gcGF0aC5kaXJuYW1lKHRhcmdldFBhdGgpIDogdGFyZ2V0UGF0aDtcbiAgICAgIGF3YWl0IGZzLmVuc3VyZURpcldyaXRhYmxlQXN5bmModGFyZ2V0RGlyKTtcbiAgICAgIGxvZygnZGVidWcnLCAnaW1wb3J0aW5nIGNvbmZpZyBmaWxlIGZyb20nLCB7IHNvdXJjZTogZmlsZS5maWxlUGF0aCwgZGVzdGluYXRpb246IHRhcmdldFBhdGgsIG1vZElkOiBmaWxlLmNhbmRpZGF0ZXNbMF0gfSk7XG4gICAgICBhd2FpdCBmcy5jb3B5QXN5bmMoZmlsZS5maWxlUGF0aCwgdGFyZ2V0UGF0aCwgeyBvdmVyd3JpdGU6IHRydWUgfSk7XG4gICAgICBhd2FpdCBmcy5yZW1vdmVBc3luYyhmaWxlLmZpbGVQYXRoKTtcbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgIGFwaS5zaG93RXJyb3JOb3RpZmljYXRpb24oJ0ZhaWxlZCB0byB3cml0ZSBtb2QgY29uZmlnJywgZXJyKTtcbiAgICB9XG4gIH1cblxuICBhcGkuZGlzbWlzc05vdGlmaWNhdGlvbihOT1RJRl9BQ1RJVklUWV9DT05GSUdfTU9EKTtcbiAgc2V0Q29uZmlnTW9kQXR0cmlidXRlKGFwaSwgY29uZmlnTW9kLm1vZC5pZCwgQXJyYXkuZnJvbShuZXcgU2V0KG5ld0NvbmZpZ0F0dHJpYnV0ZXMpKSk7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBlbnN1cmVDb25maWdNb2QoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpKTogUHJvbWlzZTx0eXBlcy5JTW9kPiB7XG4gIGNvbnN0IHN0YXRlID0gYXBpLmdldFN0YXRlKCk7XG4gIGNvbnN0IG1vZHM6IHsgW21vZElkOiBzdHJpbmddOiB0eXBlcy5JTW9kIH0gPSB1dGlsLmdldFNhZmUoc3RhdGUsIFsncGVyc2lzdGVudCcsICdtb2RzJywgR0FNRV9JRF0sIHt9KTtcbiAgY29uc3QgbW9kSW5zdGFsbGVkID0gT2JqZWN0LnZhbHVlcyhtb2RzKS5maW5kKGl0ZXIgPT4gaXRlci50eXBlID09PSBNT0RfVFlQRV9DT05GSUcpO1xuICBpZiAobW9kSW5zdGFsbGVkICE9PSB1bmRlZmluZWQpIHtcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKG1vZEluc3RhbGxlZCk7XG4gIH0gZWxzZSB7XG4gICAgY29uc3QgcHJvZmlsZSA9IHNlbGVjdG9ycy5hY3RpdmVQcm9maWxlKHN0YXRlKTtcbiAgICBjb25zdCBtb2ROYW1lID0gY29uZmlnTW9kTmFtZShwcm9maWxlLm5hbWUpO1xuICAgIGNvbnN0IG1vZCA9IGF3YWl0IGNyZWF0ZUNvbmZpZ01vZChhcGksIG1vZE5hbWUsIHByb2ZpbGUpO1xuICAgIGFwaS5zdG9yZS5kaXNwYXRjaChhY3Rpb25zLnNldE1vZEVuYWJsZWQocHJvZmlsZS5pZCwgbW9kLmlkLCB0cnVlKSk7XG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShtb2QpO1xuICB9XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGNyZWF0ZUNvbmZpZ01vZChhcGk6IHR5cGVzLklFeHRlbnNpb25BcGksIG1vZE5hbWU6IHN0cmluZywgcHJvZmlsZTogdHlwZXMuSVByb2ZpbGUpOiBQcm9taXNlPHR5cGVzLklNb2Q+IHtcbiAgY29uc3QgbW9kID0ge1xuICAgIGlkOiBtb2ROYW1lLFxuICAgIHN0YXRlOiAnaW5zdGFsbGVkJyxcbiAgICBhdHRyaWJ1dGVzOiB7XG4gICAgICBuYW1lOiAnU3RhcmRldyBWYWxsZXkgTW9kIENvbmZpZ3VyYXRpb24nLFxuICAgICAgZGVzY3JpcHRpb246ICdUaGlzIG1vZCBpcyBhIGNvbGxlY3RpdmUgbWVyZ2Ugb2YgU0RWIG1vZCBjb25maWd1cmF0aW9uIGZpbGVzIHdoaWNoIFZvcnRleCBtYWludGFpbnMgJ1xuICAgICAgICArICdmb3IgdGhlIG1vZHMgeW91IGhhdmUgaW5zdGFsbGVkLiBUaGUgY29uZmlndXJhdGlvbiBpcyBtYWludGFpbmVkIHRocm91Z2ggbW9kIHVwZGF0ZXMsICdcbiAgICAgICAgKyAnYnV0IGF0IHRpbWVzIGl0IG1heSBuZWVkIHRvIGJlIG1hbnVhbGx5IHVwZGF0ZWQnLFxuICAgICAgbG9naWNhbEZpbGVOYW1lOiAnU3RhcmRldyBWYWxsZXkgTW9kIENvbmZpZ3VyYXRpb24nLFxuICAgICAgbW9kSWQ6IDQyLCAvLyBNZWFuaW5nIG9mIGxpZmVcbiAgICAgIHZlcnNpb246ICcxLjAuMCcsXG4gICAgICB2YXJpYW50OiBzYW5pdGl6ZVByb2ZpbGVOYW1lKHByb2ZpbGUubmFtZS5yZXBsYWNlKFJHWF9JTlZBTElEX0NIQVJTX1dJTkRPV1MsICdfJykpLFxuICAgICAgaW5zdGFsbFRpbWU6IG5ldyBEYXRlKCksXG4gICAgICBzb3VyY2U6ICd1c2VyLWdlbmVyYXRlZCcsXG4gICAgfSxcbiAgICBpbnN0YWxsYXRpb25QYXRoOiBtb2ROYW1lLFxuICAgIHR5cGU6IE1PRF9UWVBFX0NPTkZJRyxcbiAgfTtcblxuICByZXR1cm4gbmV3IFByb21pc2U8dHlwZXMuSU1vZD4oKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgIGFwaS5ldmVudHMuZW1pdCgnY3JlYXRlLW1vZCcsIHByb2ZpbGUuZ2FtZUlkLCBtb2QsIGFzeW5jIChlcnJvcikgPT4ge1xuICAgICAgaWYgKGVycm9yICE9PSBudWxsKSB7XG4gICAgICAgIHJldHVybiByZWplY3QoZXJyb3IpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHJlc29sdmUobW9kIGFzIGFueSk7XG4gICAgfSk7XG4gIH0pO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gb25XaWxsRW5hYmxlTW9kcyhhcGk6IHR5cGVzLklFeHRlbnNpb25BcGksIHByb2ZpbGVJZDogc3RyaW5nLCBtb2RJZHM6IHN0cmluZ1tdLCBlbmFibGVkOiBib29sZWFuLCBvcHRpb25zPzogYW55KSB7XG4gIGNvbnN0IHN0YXRlID0gYXBpLmdldFN0YXRlKCk7XG4gIGNvbnN0IHByb2ZpbGUgPSBzZWxlY3RvcnMucHJvZmlsZUJ5SWQoc3RhdGUsIHByb2ZpbGVJZCk7XG4gIGlmIChwcm9maWxlPy5nYW1lSWQgIT09IEdBTUVfSUQpIHtcbiAgICByZXR1cm47XG4gIH1cblxuICBpZiAoZW5hYmxlZCkge1xuICAgIGF3YWl0IG9uU3luY01vZENvbmZpZ3VyYXRpb25zKGFwaSwgdHJ1ZSk7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgY29uc3QgY29uZmlnTW9kID0gYXdhaXQgaW5pdGlhbGl6ZShhcGkpO1xuICBpZiAoIWNvbmZpZ01vZCkge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGlmIChtb2RJZHMuaW5jbHVkZXMoY29uZmlnTW9kLm1vZC5pZCkpIHtcbiAgICAvLyBUaGUgY29uZmlnIG1vZCBpcyBnZXR0aW5nIGRpc2FibGVkL3VuaW5zdGFsbGVkIC0gcmUtaW5zdGF0ZSBhbGwgb2ZcbiAgICAvLyAgdGhlIGNvbmZpZ3VyYXRpb24gZmlsZXMuXG4gICAgYXdhaXQgb25SZXZlcnRGaWxlcyhhcGksIHByb2ZpbGVJZCk7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgaWYgKG9wdGlvbnM/Lmluc3RhbGxlZCB8fCBvcHRpb25zPy53aWxsQmVSZXBsYWNlZCkge1xuICAgIC8vIERvIG5vdGhpbmcsIHRoZSBtb2RzIGFyZSBiZWluZyByZS1pbnN0YWxsZWQuXG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xuICB9XG5cbiAgY29uc3QgYXR0cmliID0gZXh0cmFjdENvbmZpZ01vZEF0dHJpYnV0ZXMoc3RhdGUsIGNvbmZpZ01vZC5tb2QuaWQpO1xuICBjb25zdCByZWxldmFudCA9IG1vZElkcy5maWx0ZXIoaWQgPT4gYXR0cmliLmluY2x1ZGVzKGlkKSk7XG4gIGlmIChyZWxldmFudC5sZW5ndGggPT09IDApIHtcbiAgICByZXR1cm47XG4gIH1cblxuICBjb25zdCBpbnN0YWxsUGF0aCA9IHNlbGVjdG9ycy5pbnN0YWxsUGF0aEZvckdhbWUoc3RhdGUsIEdBTUVfSUQpO1xuICBpZiAoZW5hYmxlZCkge1xuICAgIGF3YWl0IG9uU3luY01vZENvbmZpZ3VyYXRpb25zKGFwaSk7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgY29uc3QgbW9kczogeyBbbW9kSWQ6IHN0cmluZ106IHR5cGVzLklNb2QgfSA9IHV0aWwuZ2V0U2FmZShzdGF0ZSwgWydwZXJzaXN0ZW50JywgJ21vZHMnLCBHQU1FX0lEXSwge30pO1xuICBmb3IgKGNvbnN0IGlkIG9mIHJlbGV2YW50KSB7XG4gICAgY29uc3QgbW9kID0gbW9kc1tpZF07XG4gICAgaWYgKCFtb2Q/Lmluc3RhbGxhdGlvblBhdGgpIHtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cbiAgICBjb25zdCBtb2RQYXRoID0gcGF0aC5qb2luKGluc3RhbGxQYXRoLCBtb2QuaW5zdGFsbGF0aW9uUGF0aCk7XG4gICAgY29uc3QgZmlsZXM6IElFbnRyeVtdID0gYXdhaXQgd2Fsa1BhdGgobW9kUGF0aCwgeyBza2lwTGlua3M6IHRydWUsIHNraXBIaWRkZW46IHRydWUsIHNraXBJbmFjY2Vzc2libGU6IHRydWUgfSk7XG4gICAgY29uc3QgbWFuaWZlc3RGaWxlID0gZmlsZXMuZmluZChmaWxlID0+IHBhdGguYmFzZW5hbWUoZmlsZS5maWxlUGF0aCkgPT09IE1PRF9NQU5JRkVTVCk7XG4gICAgaWYgKG1hbmlmZXN0RmlsZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG4gICAgY29uc3QgcmVsUGF0aCA9IHBhdGgucmVsYXRpdmUobW9kUGF0aCwgcGF0aC5kaXJuYW1lKG1hbmlmZXN0RmlsZS5maWxlUGF0aCkpO1xuICAgIGNvbnN0IG1vZENvbmZpZ0ZpbGVQYXRoID0gcGF0aC5qb2luKGNvbmZpZ01vZC5jb25maWdNb2RQYXRoLCByZWxQYXRoLCBNT0RfQ09ORklHKTtcbiAgICBhd2FpdCBmcy5jb3B5QXN5bmMobW9kQ29uZmlnRmlsZVBhdGgsIHBhdGguam9pbihtb2RQYXRoLCByZWxQYXRoLCBNT0RfQ09ORklHKSwgeyBvdmVyd3JpdGU6IHRydWUgfSkuY2F0Y2goZXJyID0+IG51bGwpO1xuICAgIHRyeSB7XG4gICAgICBhd2FpdCBhcHBseVRvTW9kQ29uZmlnKGFwaSwgKCkgPT4gZGVsZXRlRm9sZGVyKHBhdGguZGlybmFtZShtb2RDb25maWdGaWxlUGF0aCkpKTtcbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgIGFwaS5zaG93RXJyb3JOb3RpZmljYXRpb24oJ0ZhaWxlZCB0byB3cml0ZSBtb2QgY29uZmlnJywgZXJyKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gIH1cblxuICByZW1vdmVDb25maWdNb2RBdHRyaWJ1dGVzKGFwaSwgY29uZmlnTW9kLm1vZCwgcmVsZXZhbnQpO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gYXBwbHlUb01vZENvbmZpZyhhcGk6IHR5cGVzLklFeHRlbnNpb25BcGksIGNiOiAoKSA9PiBQcm9taXNlPHZvaWQ+KSB7XG4gIC8vIEFwcGx5aW5nIGZpbGUgb3BlcmF0aW9ucyB0byB0aGUgY29uZmlnIG1vZCByZXF1aXJlcyB1cyB0b1xuICAvLyAgcmVtb3ZlIGl0IGZyb20gdGhlIGdhbWUgZGlyZWN0b3J5IGFuZCBkZXBsb3ltZW50IG1hbmlmZXN0IGJlZm9yZVxuICAvLyAgcmUtaW50cm9kdWNpbmcgaXQgKHRoaXMgaXMgdG8gYXZvaWQgRUNEKVxuICB0cnkge1xuICAgIGNvbnN0IGNvbmZpZ01vZCA9IGF3YWl0IGluaXRpYWxpemUoYXBpKTtcbiAgICBhd2FpdCBhcGkuZW1pdEFuZEF3YWl0KCdkZXBsb3ktc2luZ2xlLW1vZCcsIEdBTUVfSUQsIGNvbmZpZ01vZC5tb2QuaWQsIGZhbHNlKTtcbiAgICBhd2FpdCBjYigpO1xuICAgIGF3YWl0IGFwaS5lbWl0QW5kQXdhaXQoJ2RlcGxveS1zaW5nbGUtbW9kJywgR0FNRV9JRCwgY29uZmlnTW9kLm1vZC5pZCwgdHJ1ZSk7IFxuICB9IGNhdGNoIChlcnIpIHtcbiAgICBhcGkuc2hvd0Vycm9yTm90aWZpY2F0aW9uKCdGYWlsZWQgdG8gd3JpdGUgbW9kIGNvbmZpZycsIGVycik7XG4gIH1cbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIG9uUmV2ZXJ0RmlsZXMoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpLCBwcm9maWxlSWQ6IHN0cmluZykge1xuICBjb25zdCBzdGF0ZSA9IGFwaS5nZXRTdGF0ZSgpO1xuICBjb25zdCBwcm9maWxlID0gc2VsZWN0b3JzLnByb2ZpbGVCeUlkKHN0YXRlLCBwcm9maWxlSWQpO1xuICBpZiAocHJvZmlsZT8uZ2FtZUlkICE9PSBHQU1FX0lEKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIGNvbnN0IGNvbmZpZ01vZCA9IGF3YWl0IGluaXRpYWxpemUoYXBpKTtcbiAgaWYgKCFjb25maWdNb2QpIHtcbiAgICByZXR1cm47XG4gIH1cbiAgY29uc3QgYXR0cmliID0gZXh0cmFjdENvbmZpZ01vZEF0dHJpYnV0ZXMoc3RhdGUsIGNvbmZpZ01vZC5tb2QuaWQpO1xuICBpZiAoYXR0cmliLmxlbmd0aCA9PT0gMCkge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGF3YWl0IG9uV2lsbEVuYWJsZU1vZHMoYXBpLCBwcm9maWxlSWQsIGF0dHJpYiwgZmFsc2UpO1xuICByZXR1cm47XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBvbkFkZGVkRmlsZXMoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpLCBwcm9maWxlSWQ6IHN0cmluZywgZmlsZXM6IElGaWxlRW50cnlbXSkge1xuICBjb25zdCBzdGF0ZSA9IGFwaS5zdG9yZS5nZXRTdGF0ZSgpO1xuICBjb25zdCBwcm9maWxlID0gc2VsZWN0b3JzLnByb2ZpbGVCeUlkKHN0YXRlLCBwcm9maWxlSWQpO1xuICBpZiAocHJvZmlsZT8uZ2FtZUlkICE9PSBHQU1FX0lEKSB7XG4gICAgLy8gZG9uJ3QgY2FyZSBhYm91dCBhbnkgb3RoZXIgZ2FtZXNcbiAgICByZXR1cm47XG4gIH1cblxuICBjb25zdCBzbWFwaVRvb2w6IHR5cGVzLklEaXNjb3ZlcmVkVG9vbCA9IGZpbmRTTUFQSVRvb2woYXBpKTtcbiAgaWYgKHNtYXBpVG9vbCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgLy8gVmVyeSBpbXBvcnRhbnQgbm90IHRvIGFkZCBhbnkgZmlsZXMgaWYgVm9ydGV4IGhhcyBubyBrbm93bGVkZ2Ugb2YgU01BUEkncyBsb2NhdGlvbi5cbiAgICAvLyAgdGhpcyBpcyB0byBhdm9pZCBwdWxsaW5nIFNNQVBJIGNvbmZpZ3VyYXRpb24gZmlsZXMgaW50byBvbmUgb2YgdGhlIG1vZHMgaW5zdGFsbGVkIGJ5IFZvcnRleC5cbiAgICByZXR1cm47XG4gIH1cbiAgY29uc3QgaXNTTUFQSUZpbGUgPSAoZmlsZTogSUZpbGVFbnRyeSkgPT4ge1xuICAgIGNvbnN0IHNlZ21lbnRzID0gZmlsZS5maWxlUGF0aC50b0xvd2VyQ2FzZSgpLnNwbGl0KHBhdGguc2VwKS5maWx0ZXIoc2VnID0+ICEhc2VnKTtcbiAgICByZXR1cm4gc2VnbWVudHMuaW5jbHVkZXMoJ3NtYXBpX2ludGVybmFsJyk7XG4gIH07XG4gIGNvbnN0IG1lcmdlQ29uZmlncyA9IHV0aWwuZ2V0U2FmZShzdGF0ZSwgWydzZXR0aW5ncycsICdTRFYnLCAnbWVyZ2VDb25maWdzJywgcHJvZmlsZS5pZF0sIGZhbHNlKTtcbiAgY29uc3QgcmVzdWx0ID0gZmlsZXMucmVkdWNlKChhY2N1bSwgZmlsZSkgPT4ge1xuICAgIGlmIChtZXJnZUNvbmZpZ3MgJiYgIWlzU01BUElGaWxlKGZpbGUpICYmIHBhdGguYmFzZW5hbWUoZmlsZS5maWxlUGF0aCkudG9Mb3dlckNhc2UoKSA9PT0gTU9EX0NPTkZJRykge1xuICAgICAgYWNjdW0uY29uZmlncy5wdXNoKGZpbGUpO1xuICAgIH0gZWxzZSB7XG4gICAgICBhY2N1bS5yZWd1bGFycy5wdXNoKGZpbGUpO1xuICAgIH1cbiAgICByZXR1cm4gYWNjdW07XG4gIH0sIHsgY29uZmlnczogW10gYXMgSUZpbGVFbnRyeVtdLCByZWd1bGFyczogW10gYXMgSUZpbGVFbnRyeVtdIH0pO1xuICByZXR1cm4gUHJvbWlzZS5hbGwoW1xuICAgIGFkZENvbmZpZ0ZpbGVzKGFwaSwgcHJvZmlsZUlkLCByZXN1bHQuY29uZmlncyksXG4gICAgYWRkUmVndWxhckZpbGVzKGFwaSwgcHJvZmlsZUlkLCByZXN1bHQucmVndWxhcnMpXG4gIF0pO1xufVxuXG5mdW5jdGlvbiBleHRyYWN0Q29uZmlnTW9kQXR0cmlidXRlcyhzdGF0ZTogdHlwZXMuSVN0YXRlLCBjb25maWdNb2RJZDogc3RyaW5nKTogYW55IHtcbiAgcmV0dXJuIHV0aWwuZ2V0U2FmZShzdGF0ZSwgWydwZXJzaXN0ZW50JywgJ21vZHMnLCBHQU1FX0lELCBjb25maWdNb2RJZCwgJ2F0dHJpYnV0ZXMnLCAnY29uZmlnTW9kJ10sIFtdKTtcbn1cblxuZnVuY3Rpb24gc2V0Q29uZmlnTW9kQXR0cmlidXRlKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSwgY29uZmlnTW9kSWQ6IHN0cmluZywgYXR0cmlidXRlczogc3RyaW5nW10pIHtcbiAgYXBpLnN0b3JlLmRpc3BhdGNoKGFjdGlvbnMuc2V0TW9kQXR0cmlidXRlKEdBTUVfSUQsIGNvbmZpZ01vZElkLCAnY29uZmlnTW9kJywgYXR0cmlidXRlcykpO1xufVxuXG5mdW5jdGlvbiByZW1vdmVDb25maWdNb2RBdHRyaWJ1dGVzKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSwgY29uZmlnTW9kOiB0eXBlcy5JTW9kLCBhdHRyaWJ1dGVzOiBzdHJpbmdbXSkge1xuICBjb25zdCBleGlzdGluZyA9IGV4dHJhY3RDb25maWdNb2RBdHRyaWJ1dGVzKGFwaS5nZXRTdGF0ZSgpLCBjb25maWdNb2QuaWQpO1xuICBjb25zdCBuZXdBdHRyaWJ1dGVzID0gZXhpc3RpbmcuZmlsdGVyKGF0dHIgPT4gIWF0dHJpYnV0ZXMuaW5jbHVkZXMoYXR0cikpO1xuICBzZXRDb25maWdNb2RBdHRyaWJ1dGUoYXBpLCBjb25maWdNb2QuaWQsIG5ld0F0dHJpYnV0ZXMpO1xufVxuXG5hc3luYyBmdW5jdGlvbiBhZGRDb25maWdGaWxlcyhhcGk6IHR5cGVzLklFeHRlbnNpb25BcGksIHByb2ZpbGVJZDogc3RyaW5nLCBmaWxlczogSUZpbGVFbnRyeVtdKSB7XG4gIGlmIChmaWxlcy5sZW5ndGggPT09IDApIHtcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG4gIH1cbiAgYXBpLnNlbmROb3RpZmljYXRpb24oe1xuICAgIHR5cGU6ICdhY3Rpdml0eScsXG4gICAgaWQ6IE5PVElGX0FDVElWSVRZX0NPTkZJR19NT0QsXG4gICAgdGl0bGU6ICdJbXBvcnRpbmcgY29uZmlnIGZpbGVzLi4uJyxcbiAgICBtZXNzYWdlOiAnU3RhcnRpbmcgdXAuLi4nXG4gIH0pO1xuXG4gIHJldHVybiBhZGRNb2RDb25maWcoYXBpLCBmaWxlcywgdW5kZWZpbmVkKTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gYWRkUmVndWxhckZpbGVzKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSwgcHJvZmlsZUlkOiBzdHJpbmcsIGZpbGVzOiBJRmlsZUVudHJ5W10pIHtcbiAgaWYgKGZpbGVzLmxlbmd0aCA9PT0gMCkge1xuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcbiAgfVxuICBjb25zdCBzdGF0ZSA9IGFwaS5nZXRTdGF0ZSgpO1xuICBjb25zdCBnYW1lID0gdXRpbC5nZXRHYW1lKEdBTUVfSUQpO1xuICBjb25zdCBkaXNjb3ZlcnkgPSBzZWxlY3RvcnMuZGlzY292ZXJ5QnlHYW1lKHN0YXRlLCBHQU1FX0lEKTtcbiAgY29uc3QgbW9kUGF0aHMgPSBnYW1lLmdldE1vZFBhdGhzKGRpc2NvdmVyeS5wYXRoKTtcbiAgY29uc3QgaW5zdGFsbFBhdGggPSBzZWxlY3RvcnMuaW5zdGFsbFBhdGhGb3JHYW1lKHN0YXRlLCBHQU1FX0lEKTtcbiAgZm9yIChjb25zdCBlbnRyeSBvZiBmaWxlcykge1xuICAgIGlmIChlbnRyeS5jYW5kaWRhdGVzLmxlbmd0aCA9PT0gMSkge1xuICAgICAgY29uc3QgbW9kID0gdXRpbC5nZXRTYWZlKHN0YXRlLnBlcnNpc3RlbnQubW9kcyxcbiAgICAgICAgW0dBTUVfSUQsIGVudHJ5LmNhbmRpZGF0ZXNbMF1dLFxuICAgICAgICB1bmRlZmluZWQpO1xuICAgICAgaWYgKCFpc01vZENhbmRpZGF0ZVZhbGlkKG1vZCwgZW50cnkpKSB7XG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IGZyb20gPSBtb2RQYXRoc1ttb2QudHlwZSA/PyAnJ107XG4gICAgICBpZiAoZnJvbSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIC8vIEhvdyBpcyB0aGlzIGV2ZW4gcG9zc2libGU/IHJlZ2FyZGxlc3MgaXQncyBub3QgdGhpc1xuICAgICAgICAvLyAgZnVuY3Rpb24ncyBqb2IgdG8gcmVwb3J0IHRoaXMuXG4gICAgICAgIGxvZygnZXJyb3InLCAnZmFpbGVkIHRvIHJlc29sdmUgbW9kIHBhdGggZm9yIG1vZCB0eXBlJywgbW9kLnR5cGUpO1xuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG4gICAgICB9XG4gICAgICBjb25zdCByZWxQYXRoID0gcGF0aC5yZWxhdGl2ZShmcm9tLCBlbnRyeS5maWxlUGF0aCk7XG4gICAgICBjb25zdCB0YXJnZXRQYXRoID0gcGF0aC5qb2luKGluc3RhbGxQYXRoLCBtb2QuaWQsIHJlbFBhdGgpO1xuICAgICAgLy8gY29weSB0aGUgbmV3IGZpbGUgYmFjayBpbnRvIHRoZSBjb3JyZXNwb25kaW5nIG1vZCwgdGhlbiBkZWxldGUgaXQuIFRoYXQgd2F5LCB2b3J0ZXggd2lsbFxuICAgICAgLy8gY3JlYXRlIGEgbGluayB0byBpdCB3aXRoIHRoZSBjb3JyZWN0IGRlcGxveW1lbnQgbWV0aG9kIGFuZCBub3QgYXNrIHRoZSB1c2VyIGFueSBxdWVzdGlvbnNcbiAgICAgIHRyeSB7XG4gICAgICAgIGF3YWl0IGZzLmVuc3VyZURpcldyaXRhYmxlQXN5bmMocGF0aC5kaXJuYW1lKHRhcmdldFBhdGgpKTtcbiAgICAgICAgYXdhaXQgZnMuY29weUFzeW5jKGVudHJ5LmZpbGVQYXRoLCB0YXJnZXRQYXRoKTtcbiAgICAgICAgYXdhaXQgZnMucmVtb3ZlQXN5bmMoZW50cnkuZmlsZVBhdGgpO1xuICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgIGlmICghZXJyLm1lc3NhZ2UuaW5jbHVkZXMoJ2FyZSB0aGUgc2FtZSBmaWxlJykpIHtcbiAgICAgICAgICAvLyBzaG91bGQgd2UgYmUgcmVwb3J0aW5nIHRoaXMgdG8gdGhlIHVzZXI/IFRoaXMgaXMgYSBjb21wbGV0ZWx5XG4gICAgICAgICAgLy8gYXV0b21hdGVkIHByb2Nlc3MgYW5kIGlmIGl0IGZhaWxzIG1vcmUgb2Z0ZW4gdGhhbiBub3QgdGhlXG4gICAgICAgICAgLy8gdXNlciBwcm9iYWJseSBkb2Vzbid0IGNhcmVcbiAgICAgICAgICBsb2coJ2Vycm9yJywgJ2ZhaWxlZCB0byByZS1pbXBvcnQgYWRkZWQgZmlsZSB0byBtb2QnLCBlcnIubWVzc2FnZSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuY29uc3QgaXNNb2RDYW5kaWRhdGVWYWxpZCA9IChtb2QsIGVudHJ5KSA9PiB7XG4gIGlmIChtb2Q/LmlkID09PSB1bmRlZmluZWQgfHwgbW9kLnR5cGUgPT09ICdzZHZyb290Zm9sZGVyJykge1xuICAgIC8vIFRoZXJlIGlzIG5vIHJlbGlhYmxlIHdheSB0byBhc2NlcnRhaW4gd2hldGhlciBhIG5ldyBmaWxlIGVudHJ5XG4gICAgLy8gIGFjdHVhbGx5IGJlbG9uZ3MgdG8gYSByb290IG1vZFR5cGUgYXMgc29tZSBvZiB0aGVzZSBtb2RzIHdpbGwgYWN0XG4gICAgLy8gIGFzIHJlcGxhY2VtZW50IG1vZHMuIFRoaXMgb2J2aW91c2x5IG1lYW5zIHRoYXQgaWYgdGhlIGdhbWUgaGFzXG4gICAgLy8gIGEgc3Vic3RhbnRpYWwgdXBkYXRlIHdoaWNoIGludHJvZHVjZXMgbmV3IGZpbGVzIHdlIGNvdWxkIHBvdGVudGlhbGx5XG4gICAgLy8gIGFkZCBhIHZhbmlsbGEgZ2FtZSBmaWxlIGludG8gdGhlIG1vZCdzIHN0YWdpbmcgZm9sZGVyIGNhdXNpbmcgY29uc3RhbnRcbiAgICAvLyAgY29udGVudGlvbiBiZXR3ZWVuIHRoZSBnYW1lIGl0c2VsZiAod2hlbiBpdCB1cGRhdGVzKSBhbmQgdGhlIG1vZC5cbiAgICAvL1xuICAgIC8vIFRoZXJlIGlzIGFsc28gYSBwb3RlbnRpYWwgY2hhbmNlIGZvciByb290IG1vZFR5cGVzIHRvIGNvbmZsaWN0IHdpdGggcmVndWxhclxuICAgIC8vICBtb2RzLCB3aGljaCBpcyB3aHkgaXQncyBub3Qgc2FmZSB0byBhc3N1bWUgdGhhdCBhbnkgYWRkaXRpb24gaW5zaWRlIHRoZVxuICAgIC8vICBtb2RzIGRpcmVjdG9yeSBjYW4gYmUgc2FmZWx5IGFkZGVkIHRvIHRoaXMgbW9kJ3Mgc3RhZ2luZyBmb2xkZXIgZWl0aGVyLlxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIGlmIChtb2QudHlwZSAhPT0gJ1NNQVBJJykge1xuICAgIC8vIE90aGVyIG1vZCB0eXBlcyBkbyBub3QgcmVxdWlyZSBmdXJ0aGVyIHZhbGlkYXRpb24gLSBpdCBzaG91bGQgYmUgZmluZVxuICAgIC8vICB0byBhZGQgdGhpcyBlbnRyeS5cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIGNvbnN0IHNlZ21lbnRzID0gZW50cnkuZmlsZVBhdGgudG9Mb3dlckNhc2UoKS5zcGxpdChwYXRoLnNlcCkuZmlsdGVyKHNlZyA9PiAhIXNlZyk7XG4gIGNvbnN0IG1vZHNTZWdJZHggPSBzZWdtZW50cy5pbmRleE9mKCdtb2RzJyk7XG4gIGNvbnN0IG1vZEZvbGRlck5hbWUgPSAoKG1vZHNTZWdJZHggIT09IC0xKSAmJiAoc2VnbWVudHMubGVuZ3RoID4gbW9kc1NlZ0lkeCArIDEpKVxuICAgID8gc2VnbWVudHNbbW9kc1NlZ0lkeCArIDFdIDogdW5kZWZpbmVkO1xuXG4gIGxldCBidW5kbGVkTW9kcyA9IHV0aWwuZ2V0U2FmZShtb2QsIFsnYXR0cmlidXRlcycsICdzbWFwaUJ1bmRsZWRNb2RzJ10sIFtdKTtcbiAgYnVuZGxlZE1vZHMgPSBidW5kbGVkTW9kcy5sZW5ndGggPiAwID8gYnVuZGxlZE1vZHMgOiBnZXRCdW5kbGVkTW9kcygpO1xuICBpZiAoc2VnbWVudHMuaW5jbHVkZXMoJ2NvbnRlbnQnKSkge1xuICAgIC8vIFNNQVBJIGlzIG5vdCBzdXBwb3NlZCB0byBvdmVyd3JpdGUgdGhlIGdhbWUncyBjb250ZW50IGRpcmVjdGx5LlxuICAgIC8vICB0aGlzIGlzIGNsZWFybHkgbm90IGEgU01BUEkgZmlsZSBhbmQgc2hvdWxkIF9ub3RfIGJlIGFkZGVkIHRvIGl0LlxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIHJldHVybiAobW9kRm9sZGVyTmFtZSAhPT0gdW5kZWZpbmVkKSAmJiBidW5kbGVkTW9kcy5pbmNsdWRlcyhtb2RGb2xkZXJOYW1lKTtcbn07Il19