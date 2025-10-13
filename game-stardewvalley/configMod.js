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
exports.registerConfigMod = registerConfigMod;
exports.addModConfig = addModConfig;
exports.ensureConfigMod = ensureConfigMod;
exports.onWillEnableMods = onWillEnableMods;
exports.applyToModConfig = applyToModConfig;
exports.onRevertFiles = onRevertFiles;
exports.onAddedFiles = onAddedFiles;
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
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29uZmlnTW9kLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiY29uZmlnTW9kLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7O0FBZUEsOENBUUM7QUF1SEQsb0NBaURDO0FBRUQsMENBYUM7QUFnQ0QsNENBaUVDO0FBRUQsNENBWUM7QUFFRCxzQ0FpQkM7QUFFRCxvQ0ErQkM7QUFoWEQsZ0RBQXdCO0FBQ3hCLDJDQUFzRTtBQUN0RSxxQ0FBb0o7QUFDcEosdUNBQTRDO0FBRTVDLGlDQUFvRTtBQUVwRSxtQ0FBc0Q7QUFHdEQsTUFBTSxXQUFXLEdBQUcsQ0FBQyxHQUF3QixFQUFFLEVBQUU7SUFDL0MsdUJBQXVCLENBQUMsR0FBRyxDQUFDLENBQUM7QUFDL0IsQ0FBQyxDQUFBO0FBRUQsU0FBZ0IsaUJBQWlCLENBQUMsT0FBZ0M7SUFDaEUsT0FBTyxDQUFDLGNBQWMsQ0FBQyxXQUFXLEVBQUUsR0FBRyxFQUFFLE1BQU0sRUFBRSxFQUFFLEVBQUUseUJBQXlCLEVBQzVFLEdBQUcsRUFBRSxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLEVBQzlCLEdBQUcsRUFBRTtRQUNILE1BQU0sS0FBSyxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLFFBQVEsRUFBRSxDQUFDO1FBQzNDLE1BQU0sUUFBUSxHQUFHLHNCQUFTLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQy9DLE9BQU8sQ0FBQyxRQUFRLEtBQUssZ0JBQU8sQ0FBQyxDQUFDO0lBQ2hDLENBQUMsQ0FBQyxDQUFDO0FBQ1AsQ0FBQztBQUVELE1BQU0sa0JBQWtCLEdBQUcsQ0FBQyxHQUF3QixFQUFFLEVBQUU7SUFDdEQsTUFBTSxLQUFLLEdBQUcsR0FBRyxDQUFDLFFBQVEsRUFBRSxDQUFDO0lBQzdCLE1BQU0sb0JBQW9CLEdBQUcsQ0FBQyx5QkFBeUIsQ0FBQyxDQUFDO0lBQ3pELE1BQU0saUJBQWlCLEdBQUcsQ0FBQyxRQUFnQixFQUFFLEVBQUUsQ0FBQyxpQkFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsQ0FBQyxTQUFTLEVBQUUsTUFBTSxFQUFFLFVBQVUsRUFBRSxRQUFRLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDO0lBQzlILE1BQU0scUJBQXFCLEdBQUcsb0JBQW9CLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsaUJBQWlCLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztJQUNuRyxNQUFNLFdBQVcsR0FBRyxxQkFBcUIsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDO0lBQ3JELE9BQU8sV0FBVyxDQUFDO0FBQ3JCLENBQUMsQ0FBQTtBQUVELFNBQWUsdUJBQXVCLENBQUMsR0FBd0IsRUFBRSxNQUFnQjs7UUFDL0UsTUFBTSxLQUFLLEdBQUcsR0FBRyxDQUFDLFFBQVEsRUFBRSxDQUFDO1FBQzdCLE1BQU0sT0FBTyxHQUFHLHNCQUFTLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQy9DLElBQUksQ0FBQSxPQUFPLGFBQVAsT0FBTyx1QkFBUCxPQUFPLENBQUUsTUFBTSxNQUFLLGdCQUFPLElBQUksa0JBQWtCLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQztZQUMzRCxPQUFPO1FBQ1QsQ0FBQztRQUNELE1BQU0sU0FBUyxHQUEwQixJQUFBLHFCQUFhLEVBQUMsR0FBRyxDQUFDLENBQUM7UUFDNUQsSUFBSSxDQUFDLENBQUEsU0FBUyxhQUFULFNBQVMsdUJBQVQsU0FBUyxDQUFFLElBQUksQ0FBQSxFQUFFLENBQUM7WUFDckIsT0FBTztRQUNULENBQUM7UUFDRCxNQUFNLFlBQVksR0FBRyxpQkFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsQ0FBQyxVQUFVLEVBQUUsS0FBSyxFQUFFLGNBQWMsRUFBRSxPQUFPLENBQUMsRUFBRSxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDakcsSUFBSSxDQUFDLFlBQVksRUFBRSxDQUFDO1lBQ2xCLElBQUksTUFBTSxFQUFFLENBQUM7Z0JBQ1gsT0FBTztZQUNULENBQUM7WUFDRCxNQUFNLE1BQU0sR0FBRyxNQUFNLEdBQUcsQ0FBQyxVQUFVLENBQUMsTUFBTSxFQUFFLHdCQUF3QixFQUFFO2dCQUNwRSxNQUFNLEVBQUUsd0hBQXdIO3NCQUM1SCxzREFBc0Q7c0JBQ3RELGtJQUFrSTtzQkFDbEksdUlBQXVJO3NCQUN2SSx3RUFBd0U7YUFDN0UsRUFBRTtnQkFDRCxFQUFFLEtBQUssRUFBRSxPQUFPLEVBQUU7Z0JBQ2xCLEVBQUUsS0FBSyxFQUFFLFFBQVEsRUFBRTthQUNwQixDQUFDLENBQUM7WUFFSCxJQUFJLE1BQU0sQ0FBQyxNQUFNLEtBQUssT0FBTyxFQUFFLENBQUM7Z0JBQzlCLE9BQU87WUFDVCxDQUFDO1lBRUQsSUFBSSxNQUFNLENBQUMsTUFBTSxLQUFLLFFBQVEsRUFBRSxDQUFDO2dCQUMvQixHQUFHLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxJQUFBLHlCQUFlLEVBQUMsT0FBTyxDQUFDLEVBQUUsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDO1lBQ3hELENBQUM7UUFDSCxDQUFDO1FBR0QsTUFBTSxZQUFZLEdBQUcsQ0FBQyxHQUF3QixFQUFFLFNBQW9CLEVBQUUsRUFBRSxDQUFDLElBQUksT0FBTyxDQUFPLENBQUMsT0FBTyxFQUFFLE1BQU0sRUFBRSxFQUFFO1lBQzdHLE1BQU0sRUFBRSxHQUFHLENBQUMsR0FBUSxFQUFFLEVBQUUsQ0FBQyxHQUFHLEtBQUssSUFBSSxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQ2hFLENBQUMsU0FBUyxLQUFLLFlBQVksQ0FBQztnQkFDMUIsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxLQUFLLEVBQUUsRUFBRSxDQUFDO2dCQUN2QyxDQUFDLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBQ3JDLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDO1lBQ0gsTUFBTSxHQUFHLEdBQUcsTUFBTSxVQUFVLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDbEMsSUFBSSxDQUFBLEdBQUcsYUFBSCxHQUFHLHVCQUFILEdBQUcsQ0FBRSxhQUFhLE1BQUssU0FBUyxFQUFFLENBQUM7Z0JBQ3JDLE9BQU87WUFDVCxDQUFDO1lBQ0QsTUFBTSxZQUFZLENBQUMsR0FBRyxFQUFFLFlBQVksQ0FBQyxDQUFDO1lBRXRDLE1BQU0sV0FBVyxHQUFHLHNCQUFTLENBQUMsa0JBQWtCLENBQUMsR0FBRyxDQUFDLFFBQVEsRUFBRSxFQUFFLGdCQUFPLENBQUMsQ0FBQztZQUMxRSxNQUFNLG9CQUFvQixHQUFHLENBQUMsSUFBWSxFQUFVLEVBQUU7Z0JBQ3BELE1BQU0sT0FBTyxHQUFHLGNBQUksQ0FBQyxRQUFRLENBQUMsV0FBVyxFQUFFLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztnQkFDMUQsTUFBTSxRQUFRLEdBQUcsT0FBTyxDQUFDLEtBQUssQ0FBQyxjQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7Z0JBQ3pDLE9BQU8sUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3JCLENBQUMsQ0FBQTtZQUNELE1BQU0sS0FBSyxHQUFHLE1BQU0sSUFBQSxlQUFRLEVBQUMsV0FBVyxDQUFDLENBQUM7WUFDMUMsTUFBTSxRQUFRLEdBQUcsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEtBQW1CLEVBQUUsSUFBWSxFQUFFLEVBQUU7Z0JBQ2xFLElBQUksY0FBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsV0FBVyxFQUFFLEtBQUssbUJBQVUsSUFBSSxDQUFDLGNBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsYUFBYSxDQUFDLEVBQUUsQ0FBQztvQkFDMUgsTUFBTSxhQUFhLEdBQUcsb0JBQW9CLENBQUMsSUFBSSxDQUFDLENBQUM7b0JBQ2pELElBQUksaUJBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxFQUFFLENBQUMsVUFBVSxFQUFFLGFBQWEsRUFBRSxTQUFTLENBQUMsRUFBRSxLQUFLLENBQUMsS0FBSyxLQUFLLEVBQUUsQ0FBQzt3QkFDbkYsT0FBTyxLQUFLLENBQUM7b0JBQ2YsQ0FBQztvQkFDRCxLQUFLLENBQUMsSUFBSSxDQUFDLEVBQUUsUUFBUSxFQUFFLElBQUksQ0FBQyxRQUFRLEVBQUUsVUFBVSxFQUFFLENBQUMsYUFBYSxDQUFDLEVBQUUsQ0FBQyxDQUFDO2dCQUN2RSxDQUFDO2dCQUNELE9BQU8sS0FBSyxDQUFDO1lBQ2YsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQ1AsTUFBTSxZQUFZLENBQUMsR0FBRyxFQUFFLFFBQVEsRUFBRSxXQUFXLENBQUMsQ0FBQztZQUMvQyxNQUFNLFlBQVksQ0FBQyxHQUFHLEVBQUUsYUFBYSxDQUFDLENBQUM7UUFDekMsQ0FBQztRQUFDLE9BQU8sR0FBRyxFQUFFLENBQUM7WUFDYixHQUFHLENBQUMscUJBQXFCLENBQUMsbUNBQW1DLEVBQUUsR0FBRyxDQUFDLENBQUM7UUFDdEUsQ0FBQztJQUNILENBQUM7Q0FBQTtBQUVELFNBQVMsbUJBQW1CLENBQUMsS0FBYTtJQUN4QyxPQUFPLEtBQUssQ0FBQyxPQUFPLENBQUMsa0NBQXlCLEVBQUUsR0FBRyxDQUFDLENBQUM7QUFDdkQsQ0FBQztBQUVELFNBQVMsYUFBYSxDQUFDLFdBQW1CO0lBQ3hDLE9BQU8saUNBQWlDLG1CQUFtQixDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUM7QUFDOUUsQ0FBQztBQU1ELFNBQWUsVUFBVSxDQUFDLEdBQXdCOztRQUNoRCxNQUFNLEtBQUssR0FBRyxHQUFHLENBQUMsUUFBUSxFQUFFLENBQUM7UUFDN0IsTUFBTSxPQUFPLEdBQUcsc0JBQVMsQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDL0MsSUFBSSxDQUFBLE9BQU8sYUFBUCxPQUFPLHVCQUFQLE9BQU8sQ0FBRSxNQUFNLE1BQUssZ0JBQU8sRUFBRSxDQUFDO1lBQ2hDLE9BQU8sT0FBTyxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUNwQyxDQUFDO1FBQ0QsTUFBTSxZQUFZLEdBQUcsaUJBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLENBQUMsVUFBVSxFQUFFLEtBQUssRUFBRSxjQUFjLEVBQUUsT0FBTyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQ2pHLElBQUksQ0FBQyxZQUFZLEVBQUUsQ0FBQztZQUNsQixPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUM7UUFDcEMsQ0FBQztRQUVELElBQUksQ0FBQztZQUNILE1BQU0sR0FBRyxHQUFHLE1BQU0sZUFBZSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQ3ZDLE1BQU0sZ0JBQWdCLEdBQUcsc0JBQVMsQ0FBQyxrQkFBa0IsQ0FBQyxLQUFLLEVBQUUsZ0JBQU8sQ0FBQyxDQUFDO1lBQ3RFLE1BQU0sYUFBYSxHQUFHLGNBQUksQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsR0FBRyxDQUFDLGdCQUFnQixDQUFDLENBQUM7WUFDeEUsT0FBTyxPQUFPLENBQUMsT0FBTyxDQUFDLEVBQUUsYUFBYSxFQUFFLEdBQUcsRUFBRSxDQUFDLENBQUM7UUFDakQsQ0FBQztRQUFDLE9BQU8sR0FBRyxFQUFFLENBQUM7WUFDYixHQUFHLENBQUMscUJBQXFCLENBQUMsbUNBQW1DLEVBQUUsR0FBRyxDQUFDLENBQUM7WUFDcEUsT0FBTyxPQUFPLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBQ3BDLENBQUM7SUFDSCxDQUFDO0NBQUE7QUFFRCxTQUFzQixZQUFZLENBQUMsR0FBd0IsRUFBRSxLQUFtQixFQUFFLFFBQWlCOztRQUNqRyxNQUFNLFNBQVMsR0FBRyxNQUFNLFVBQVUsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUN4QyxJQUFJLFNBQVMsS0FBSyxTQUFTLEVBQUUsQ0FBQztZQUM1QixPQUFPO1FBQ1QsQ0FBQztRQUVELE1BQU0sS0FBSyxHQUFHLEdBQUcsQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUM3QixNQUFNLFNBQVMsR0FBRyxzQkFBUyxDQUFDLGVBQWUsQ0FBQyxLQUFLLEVBQUUsZ0JBQU8sQ0FBQyxDQUFDO1FBQzVELE1BQU0sYUFBYSxHQUFHLFFBQVEsS0FBSyxTQUFTLENBQUM7UUFDN0MsUUFBUSxHQUFHLFFBQVEsYUFBUixRQUFRLGNBQVIsUUFBUSxHQUFJLGNBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksRUFBRSxJQUFBLHlCQUFrQixHQUFFLENBQUMsQ0FBQztRQUN2RSxNQUFNLFNBQVMsR0FBMEIsSUFBQSxxQkFBYSxFQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQzVELElBQUksU0FBUyxLQUFLLFNBQVMsRUFBRSxDQUFDO1lBQzVCLE9BQU87UUFDVCxDQUFDO1FBQ0QsTUFBTSxtQkFBbUIsR0FBYSwwQkFBMEIsQ0FBQyxLQUFLLEVBQUUsU0FBUyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUMxRixJQUFJLG1CQUFtQixHQUFHLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxHQUFHLENBQUMsbUJBQW1CLENBQUMsQ0FBQyxDQUFDO1FBQ25FLEtBQUssTUFBTSxJQUFJLElBQUksS0FBSyxFQUFFLENBQUM7WUFDekIsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxXQUFXLEVBQUUsQ0FBQyxLQUFLLENBQUMsY0FBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUNsRixJQUFJLFFBQVEsQ0FBQyxRQUFRLENBQUMsZ0JBQWdCLENBQUMsRUFBRSxDQUFDO2dCQUV4QyxTQUFTO1lBQ1gsQ0FBQztZQUNELEdBQUcsQ0FBQyxnQkFBZ0IsQ0FBQztnQkFDbkIsSUFBSSxFQUFFLFVBQVU7Z0JBQ2hCLEVBQUUsRUFBRSxrQ0FBeUI7Z0JBQzdCLEtBQUssRUFBRSwyQkFBMkI7Z0JBQ2xDLE9BQU8sRUFBRSxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQzthQUM1QixDQUFDLENBQUM7WUFFSCxJQUFJLENBQUMsbUJBQW1CLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDO2dCQUN0RCxtQkFBbUIsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQy9DLENBQUM7WUFDRCxJQUFJLENBQUM7Z0JBQ0gsTUFBTSxjQUFjLEdBQUcsY0FBSSxDQUFDLFFBQVEsQ0FBQyxRQUFRLEVBQUUsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO2dCQUM5RCxNQUFNLFFBQVEsR0FBRyxjQUFjLENBQUMsS0FBSyxDQUFDLGNBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztnQkFDaEQsTUFBTSxPQUFPLEdBQUcsYUFBYSxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxjQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLGNBQWMsQ0FBQztnQkFDbEYsTUFBTSxVQUFVLEdBQUcsY0FBSSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsYUFBYSxFQUFFLE9BQU8sQ0FBQyxDQUFDO2dCQUMvRCxNQUFNLFNBQVMsR0FBRyxjQUFJLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLENBQUMsY0FBSSxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDO2dCQUMxRixNQUFNLGVBQUUsQ0FBQyxzQkFBc0IsQ0FBQyxTQUFTLENBQUMsQ0FBQztnQkFDM0MsSUFBQSxnQkFBRyxFQUFDLE9BQU8sRUFBRSw0QkFBNEIsRUFBRSxFQUFFLE1BQU0sRUFBRSxJQUFJLENBQUMsUUFBUSxFQUFFLFdBQVcsRUFBRSxVQUFVLEVBQUUsS0FBSyxFQUFFLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDO2dCQUMxSCxNQUFNLGVBQUUsQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxVQUFVLEVBQUUsRUFBRSxTQUFTLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztnQkFDbkUsTUFBTSxlQUFFLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUN0QyxDQUFDO1lBQUMsT0FBTyxHQUFHLEVBQUUsQ0FBQztnQkFDYixHQUFHLENBQUMscUJBQXFCLENBQUMsNEJBQTRCLEVBQUUsR0FBRyxDQUFDLENBQUM7WUFDL0QsQ0FBQztRQUNILENBQUM7UUFFRCxHQUFHLENBQUMsbUJBQW1CLENBQUMsa0NBQXlCLENBQUMsQ0FBQztRQUNuRCxxQkFBcUIsQ0FBQyxHQUFHLEVBQUUsU0FBUyxDQUFDLEdBQUcsQ0FBQyxFQUFFLEVBQUUsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLEdBQUcsQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUN6RixDQUFDO0NBQUE7QUFFRCxTQUFzQixlQUFlLENBQUMsR0FBd0I7O1FBQzVELE1BQU0sS0FBSyxHQUFHLEdBQUcsQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUM3QixNQUFNLElBQUksR0FBb0MsaUJBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLENBQUMsWUFBWSxFQUFFLE1BQU0sRUFBRSxnQkFBTyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFDdkcsTUFBTSxZQUFZLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsSUFBSSxLQUFLLHdCQUFlLENBQUMsQ0FBQztRQUNyRixJQUFJLFlBQVksS0FBSyxTQUFTLEVBQUUsQ0FBQztZQUMvQixPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsWUFBWSxDQUFDLENBQUM7UUFDdkMsQ0FBQzthQUFNLENBQUM7WUFDTixNQUFNLE9BQU8sR0FBRyxzQkFBUyxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUMvQyxNQUFNLE9BQU8sR0FBRyxhQUFhLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQzVDLE1BQU0sR0FBRyxHQUFHLE1BQU0sZUFBZSxDQUFDLEdBQUcsRUFBRSxPQUFPLEVBQUUsT0FBTyxDQUFDLENBQUM7WUFDekQsR0FBRyxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsb0JBQU8sQ0FBQyxhQUFhLENBQUMsT0FBTyxDQUFDLEVBQUUsRUFBRSxHQUFHLENBQUMsRUFBRSxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7WUFDcEUsT0FBTyxPQUFPLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQzlCLENBQUM7SUFDSCxDQUFDO0NBQUE7QUFFRCxTQUFlLGVBQWUsQ0FBQyxHQUF3QixFQUFFLE9BQWUsRUFBRSxPQUF1Qjs7UUFDL0YsTUFBTSxHQUFHLEdBQUc7WUFDVixFQUFFLEVBQUUsT0FBTztZQUNYLEtBQUssRUFBRSxXQUFXO1lBQ2xCLFVBQVUsRUFBRTtnQkFDVixJQUFJLEVBQUUsa0NBQWtDO2dCQUN4QyxXQUFXLEVBQUUsdUZBQXVGO3NCQUNoRyx3RkFBd0Y7c0JBQ3hGLGlEQUFpRDtnQkFDckQsZUFBZSxFQUFFLGtDQUFrQztnQkFDbkQsS0FBSyxFQUFFLEVBQUU7Z0JBQ1QsT0FBTyxFQUFFLE9BQU87Z0JBQ2hCLE9BQU8sRUFBRSxtQkFBbUIsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxrQ0FBeUIsRUFBRSxHQUFHLENBQUMsQ0FBQztnQkFDbEYsV0FBVyxFQUFFLElBQUksSUFBSSxFQUFFO2dCQUN2QixNQUFNLEVBQUUsZ0JBQWdCO2FBQ3pCO1lBQ0QsZ0JBQWdCLEVBQUUsT0FBTztZQUN6QixJQUFJLEVBQUUsd0JBQWU7U0FDdEIsQ0FBQztRQUVGLE9BQU8sSUFBSSxPQUFPLENBQWEsQ0FBQyxPQUFPLEVBQUUsTUFBTSxFQUFFLEVBQUU7WUFDakQsR0FBRyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsWUFBWSxFQUFFLE9BQU8sQ0FBQyxNQUFNLEVBQUUsR0FBRyxFQUFFLENBQU8sS0FBSyxFQUFFLEVBQUU7Z0JBQ2pFLElBQUksS0FBSyxLQUFLLElBQUksRUFBRSxDQUFDO29CQUNuQixPQUFPLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQztnQkFDdkIsQ0FBQztnQkFDRCxPQUFPLE9BQU8sQ0FBQyxHQUFVLENBQUMsQ0FBQztZQUM3QixDQUFDLENBQUEsQ0FBQyxDQUFDO1FBQ0wsQ0FBQyxDQUFDLENBQUM7SUFDTCxDQUFDO0NBQUE7QUFFRCxTQUFzQixnQkFBZ0IsQ0FBQyxHQUF3QixFQUFFLFNBQWlCLEVBQUUsTUFBZ0IsRUFBRSxPQUFnQixFQUFFLE9BQWE7O1FBQ25JLE1BQU0sS0FBSyxHQUFHLEdBQUcsQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUM3QixNQUFNLE9BQU8sR0FBRyxzQkFBUyxDQUFDLFdBQVcsQ0FBQyxLQUFLLEVBQUUsU0FBUyxDQUFDLENBQUM7UUFDeEQsSUFBSSxDQUFBLE9BQU8sYUFBUCxPQUFPLHVCQUFQLE9BQU8sQ0FBRSxNQUFNLE1BQUssZ0JBQU8sRUFBRSxDQUFDO1lBQ2hDLE9BQU87UUFDVCxDQUFDO1FBRUQsSUFBSSxPQUFPLEVBQUUsQ0FBQztZQUNaLE1BQU0sdUJBQXVCLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQ3pDLE9BQU87UUFDVCxDQUFDO1FBRUQsTUFBTSxTQUFTLEdBQUcsTUFBTSxVQUFVLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDeEMsSUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFDO1lBQ2YsT0FBTztRQUNULENBQUM7UUFFRCxJQUFJLE1BQU0sQ0FBQyxRQUFRLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDO1lBR3RDLE1BQU0sYUFBYSxDQUFDLEdBQUcsRUFBRSxTQUFTLENBQUMsQ0FBQztZQUNwQyxPQUFPO1FBQ1QsQ0FBQztRQUVELElBQUksQ0FBQSxPQUFPLGFBQVAsT0FBTyx1QkFBUCxPQUFPLENBQUUsU0FBUyxNQUFJLE9BQU8sYUFBUCxPQUFPLHVCQUFQLE9BQU8sQ0FBRSxjQUFjLENBQUEsRUFBRSxDQUFDO1lBRWxELE9BQU8sT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQzNCLENBQUM7UUFFRCxNQUFNLE1BQU0sR0FBRywwQkFBMEIsQ0FBQyxLQUFLLEVBQUUsU0FBUyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUNuRSxNQUFNLFFBQVEsR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQzFELElBQUksUUFBUSxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUUsQ0FBQztZQUMxQixPQUFPO1FBQ1QsQ0FBQztRQUVELE1BQU0sV0FBVyxHQUFHLHNCQUFTLENBQUMsa0JBQWtCLENBQUMsS0FBSyxFQUFFLGdCQUFPLENBQUMsQ0FBQztRQUNqRSxJQUFJLE9BQU8sRUFBRSxDQUFDO1lBQ1osTUFBTSx1QkFBdUIsQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUNuQyxPQUFPO1FBQ1QsQ0FBQztRQUVELE1BQU0sSUFBSSxHQUFvQyxpQkFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsQ0FBQyxZQUFZLEVBQUUsTUFBTSxFQUFFLGdCQUFPLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztRQUN2RyxLQUFLLE1BQU0sRUFBRSxJQUFJLFFBQVEsRUFBRSxDQUFDO1lBQzFCLE1BQU0sR0FBRyxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQztZQUNyQixJQUFJLENBQUMsQ0FBQSxHQUFHLGFBQUgsR0FBRyx1QkFBSCxHQUFHLENBQUUsZ0JBQWdCLENBQUEsRUFBRSxDQUFDO2dCQUMzQixTQUFTO1lBQ1gsQ0FBQztZQUNELE1BQU0sT0FBTyxHQUFHLGNBQUksQ0FBQyxJQUFJLENBQUMsV0FBVyxFQUFFLEdBQUcsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO1lBQzdELE1BQU0sS0FBSyxHQUFhLE1BQU0sSUFBQSxlQUFRLEVBQUMsT0FBTyxFQUFFLEVBQUUsU0FBUyxFQUFFLElBQUksRUFBRSxVQUFVLEVBQUUsSUFBSSxFQUFFLGdCQUFnQixFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7WUFDL0csTUFBTSxZQUFZLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLGNBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLHFCQUFZLENBQUMsQ0FBQztZQUN2RixJQUFJLFlBQVksS0FBSyxTQUFTLEVBQUUsQ0FBQztnQkFDL0IsU0FBUztZQUNYLENBQUM7WUFDRCxNQUFNLE9BQU8sR0FBRyxjQUFJLENBQUMsUUFBUSxDQUFDLE9BQU8sRUFBRSxjQUFJLENBQUMsT0FBTyxDQUFDLFlBQVksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO1lBQzVFLE1BQU0saUJBQWlCLEdBQUcsY0FBSSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsYUFBYSxFQUFFLE9BQU8sRUFBRSxtQkFBVSxDQUFDLENBQUM7WUFDbEYsTUFBTSxlQUFFLENBQUMsU0FBUyxDQUFDLGlCQUFpQixFQUFFLGNBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLE9BQU8sRUFBRSxtQkFBVSxDQUFDLEVBQUUsRUFBRSxTQUFTLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUN2SCxJQUFJLENBQUM7Z0JBQ0gsTUFBTSxnQkFBZ0IsQ0FBQyxHQUFHLEVBQUUsR0FBRyxFQUFFLENBQUMsSUFBQSxtQkFBWSxFQUFDLGNBQUksQ0FBQyxPQUFPLENBQUMsaUJBQWlCLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDbkYsQ0FBQztZQUFDLE9BQU8sR0FBRyxFQUFFLENBQUM7Z0JBQ2IsR0FBRyxDQUFDLHFCQUFxQixDQUFDLDRCQUE0QixFQUFFLEdBQUcsQ0FBQyxDQUFDO2dCQUM3RCxPQUFPO1lBQ1QsQ0FBQztRQUNILENBQUM7UUFFRCx5QkFBeUIsQ0FBQyxHQUFHLEVBQUUsU0FBUyxDQUFDLEdBQUcsRUFBRSxRQUFRLENBQUMsQ0FBQztJQUMxRCxDQUFDO0NBQUE7QUFFRCxTQUFzQixnQkFBZ0IsQ0FBQyxHQUF3QixFQUFFLEVBQXVCOztRQUl0RixJQUFJLENBQUM7WUFDSCxNQUFNLFNBQVMsR0FBRyxNQUFNLFVBQVUsQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUN4QyxNQUFNLEdBQUcsQ0FBQyxZQUFZLENBQUMsbUJBQW1CLEVBQUUsZ0JBQU8sRUFBRSxTQUFTLENBQUMsR0FBRyxDQUFDLEVBQUUsRUFBRSxLQUFLLENBQUMsQ0FBQztZQUM5RSxNQUFNLEVBQUUsRUFBRSxDQUFDO1lBQ1gsTUFBTSxHQUFHLENBQUMsWUFBWSxDQUFDLG1CQUFtQixFQUFFLGdCQUFPLEVBQUUsU0FBUyxDQUFDLEdBQUcsQ0FBQyxFQUFFLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDL0UsQ0FBQztRQUFDLE9BQU8sR0FBRyxFQUFFLENBQUM7WUFDYixHQUFHLENBQUMscUJBQXFCLENBQUMsNEJBQTRCLEVBQUUsR0FBRyxDQUFDLENBQUM7UUFDL0QsQ0FBQztJQUNILENBQUM7Q0FBQTtBQUVELFNBQXNCLGFBQWEsQ0FBQyxHQUF3QixFQUFFLFNBQWlCOztRQUM3RSxNQUFNLEtBQUssR0FBRyxHQUFHLENBQUMsUUFBUSxFQUFFLENBQUM7UUFDN0IsTUFBTSxPQUFPLEdBQUcsc0JBQVMsQ0FBQyxXQUFXLENBQUMsS0FBSyxFQUFFLFNBQVMsQ0FBQyxDQUFDO1FBQ3hELElBQUksQ0FBQSxPQUFPLGFBQVAsT0FBTyx1QkFBUCxPQUFPLENBQUUsTUFBTSxNQUFLLGdCQUFPLEVBQUUsQ0FBQztZQUNoQyxPQUFPO1FBQ1QsQ0FBQztRQUNELE1BQU0sU0FBUyxHQUFHLE1BQU0sVUFBVSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ3hDLElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQztZQUNmLE9BQU87UUFDVCxDQUFDO1FBQ0QsTUFBTSxNQUFNLEdBQUcsMEJBQTBCLENBQUMsS0FBSyxFQUFFLFNBQVMsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUM7UUFDbkUsSUFBSSxNQUFNLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRSxDQUFDO1lBQ3hCLE9BQU87UUFDVCxDQUFDO1FBRUQsTUFBTSxnQkFBZ0IsQ0FBQyxHQUFHLEVBQUUsU0FBUyxFQUFFLE1BQU0sRUFBRSxLQUFLLENBQUMsQ0FBQztRQUN0RCxPQUFPO0lBQ1QsQ0FBQztDQUFBO0FBRUQsU0FBc0IsWUFBWSxDQUFDLEdBQXdCLEVBQUUsU0FBaUIsRUFBRSxLQUFtQjs7UUFDakcsTUFBTSxLQUFLLEdBQUcsR0FBRyxDQUFDLEtBQUssQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUNuQyxNQUFNLE9BQU8sR0FBRyxzQkFBUyxDQUFDLFdBQVcsQ0FBQyxLQUFLLEVBQUUsU0FBUyxDQUFDLENBQUM7UUFDeEQsSUFBSSxDQUFBLE9BQU8sYUFBUCxPQUFPLHVCQUFQLE9BQU8sQ0FBRSxNQUFNLE1BQUssZ0JBQU8sRUFBRSxDQUFDO1lBRWhDLE9BQU87UUFDVCxDQUFDO1FBRUQsTUFBTSxTQUFTLEdBQTBCLElBQUEscUJBQWEsRUFBQyxHQUFHLENBQUMsQ0FBQztRQUM1RCxJQUFJLFNBQVMsS0FBSyxTQUFTLEVBQUUsQ0FBQztZQUc1QixPQUFPO1FBQ1QsQ0FBQztRQUNELE1BQU0sV0FBVyxHQUFHLENBQUMsSUFBZ0IsRUFBRSxFQUFFO1lBQ3ZDLE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsV0FBVyxFQUFFLENBQUMsS0FBSyxDQUFDLGNBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDbEYsT0FBTyxRQUFRLENBQUMsUUFBUSxDQUFDLGdCQUFnQixDQUFDLENBQUM7UUFDN0MsQ0FBQyxDQUFDO1FBQ0YsTUFBTSxZQUFZLEdBQUcsaUJBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLENBQUMsVUFBVSxFQUFFLEtBQUssRUFBRSxjQUFjLEVBQUUsT0FBTyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQ2pHLE1BQU0sTUFBTSxHQUFHLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQyxLQUFLLEVBQUUsSUFBSSxFQUFFLEVBQUU7WUFDMUMsSUFBSSxZQUFZLElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLElBQUksY0FBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsV0FBVyxFQUFFLEtBQUssbUJBQVUsRUFBRSxDQUFDO2dCQUNwRyxLQUFLLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUMzQixDQUFDO2lCQUFNLENBQUM7Z0JBQ04sS0FBSyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDNUIsQ0FBQztZQUNELE9BQU8sS0FBSyxDQUFDO1FBQ2YsQ0FBQyxFQUFFLEVBQUUsT0FBTyxFQUFFLEVBQWtCLEVBQUUsUUFBUSxFQUFFLEVBQWtCLEVBQUUsQ0FBQyxDQUFDO1FBQ2xFLE9BQU8sT0FBTyxDQUFDLEdBQUcsQ0FBQztZQUNqQixjQUFjLENBQUMsR0FBRyxFQUFFLFNBQVMsRUFBRSxNQUFNLENBQUMsT0FBTyxDQUFDO1lBQzlDLGVBQWUsQ0FBQyxHQUFHLEVBQUUsU0FBUyxFQUFFLE1BQU0sQ0FBQyxRQUFRLENBQUM7U0FDakQsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztDQUFBO0FBRUQsU0FBUywwQkFBMEIsQ0FBQyxLQUFtQixFQUFFLFdBQW1CO0lBQzFFLE9BQU8saUJBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLENBQUMsWUFBWSxFQUFFLE1BQU0sRUFBRSxnQkFBTyxFQUFFLFdBQVcsRUFBRSxZQUFZLEVBQUUsV0FBVyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7QUFDMUcsQ0FBQztBQUVELFNBQVMscUJBQXFCLENBQUMsR0FBd0IsRUFBRSxXQUFtQixFQUFFLFVBQW9CO0lBQ2hHLEdBQUcsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLG9CQUFPLENBQUMsZUFBZSxDQUFDLGdCQUFPLEVBQUUsV0FBVyxFQUFFLFdBQVcsRUFBRSxVQUFVLENBQUMsQ0FBQyxDQUFDO0FBQzdGLENBQUM7QUFFRCxTQUFTLHlCQUF5QixDQUFDLEdBQXdCLEVBQUUsU0FBcUIsRUFBRSxVQUFvQjtJQUN0RyxNQUFNLFFBQVEsR0FBRywwQkFBMEIsQ0FBQyxHQUFHLENBQUMsUUFBUSxFQUFFLEVBQUUsU0FBUyxDQUFDLEVBQUUsQ0FBQyxDQUFDO0lBQzFFLE1BQU0sYUFBYSxHQUFHLFFBQVEsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztJQUMxRSxxQkFBcUIsQ0FBQyxHQUFHLEVBQUUsU0FBUyxDQUFDLEVBQUUsRUFBRSxhQUFhLENBQUMsQ0FBQztBQUMxRCxDQUFDO0FBRUQsU0FBZSxjQUFjLENBQUMsR0FBd0IsRUFBRSxTQUFpQixFQUFFLEtBQW1COztRQUM1RixJQUFJLEtBQUssQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFLENBQUM7WUFDdkIsT0FBTyxPQUFPLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDM0IsQ0FBQztRQUNELEdBQUcsQ0FBQyxnQkFBZ0IsQ0FBQztZQUNuQixJQUFJLEVBQUUsVUFBVTtZQUNoQixFQUFFLEVBQUUsa0NBQXlCO1lBQzdCLEtBQUssRUFBRSwyQkFBMkI7WUFDbEMsT0FBTyxFQUFFLGdCQUFnQjtTQUMxQixDQUFDLENBQUM7UUFFSCxPQUFPLFlBQVksQ0FBQyxHQUFHLEVBQUUsS0FBSyxFQUFFLFNBQVMsQ0FBQyxDQUFDO0lBQzdDLENBQUM7Q0FBQTtBQUVELFNBQWUsZUFBZSxDQUFDLEdBQXdCLEVBQUUsU0FBaUIsRUFBRSxLQUFtQjs7O1FBQzdGLElBQUksS0FBSyxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUUsQ0FBQztZQUN2QixPQUFPLE9BQU8sQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUMzQixDQUFDO1FBQ0QsTUFBTSxLQUFLLEdBQUcsR0FBRyxDQUFDLFFBQVEsRUFBRSxDQUFDO1FBQzdCLE1BQU0sSUFBSSxHQUFHLGlCQUFJLENBQUMsT0FBTyxDQUFDLGdCQUFPLENBQUMsQ0FBQztRQUNuQyxNQUFNLFNBQVMsR0FBRyxzQkFBUyxDQUFDLGVBQWUsQ0FBQyxLQUFLLEVBQUUsZ0JBQU8sQ0FBQyxDQUFDO1FBQzVELE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxXQUFXLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ2xELE1BQU0sV0FBVyxHQUFHLHNCQUFTLENBQUMsa0JBQWtCLENBQUMsS0FBSyxFQUFFLGdCQUFPLENBQUMsQ0FBQztRQUNqRSxLQUFLLE1BQU0sS0FBSyxJQUFJLEtBQUssRUFBRSxDQUFDO1lBQzFCLElBQUksS0FBSyxDQUFDLFVBQVUsQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFLENBQUM7Z0JBQ2xDLE1BQU0sR0FBRyxHQUFHLGlCQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsSUFBSSxFQUM1QyxDQUFDLGdCQUFPLEVBQUUsS0FBSyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUM5QixTQUFTLENBQUMsQ0FBQztnQkFDYixJQUFJLENBQUMsbUJBQW1CLENBQUMsR0FBRyxFQUFFLEtBQUssQ0FBQyxFQUFFLENBQUM7b0JBQ3JDLE9BQU8sT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFDO2dCQUMzQixDQUFDO2dCQUNELE1BQU0sSUFBSSxHQUFHLFFBQVEsQ0FBQyxNQUFBLEdBQUcsQ0FBQyxJQUFJLG1DQUFJLEVBQUUsQ0FBQyxDQUFDO2dCQUN0QyxJQUFJLElBQUksS0FBSyxTQUFTLEVBQUUsQ0FBQztvQkFHdkIsSUFBQSxnQkFBRyxFQUFDLE9BQU8sRUFBRSx5Q0FBeUMsRUFBRSxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUM7b0JBQ2xFLE9BQU8sT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFDO2dCQUMzQixDQUFDO2dCQUNELE1BQU0sT0FBTyxHQUFHLGNBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxFQUFFLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQztnQkFDcEQsTUFBTSxVQUFVLEdBQUcsY0FBSSxDQUFDLElBQUksQ0FBQyxXQUFXLEVBQUUsR0FBRyxDQUFDLEVBQUUsRUFBRSxPQUFPLENBQUMsQ0FBQztnQkFHM0QsSUFBSSxDQUFDO29CQUNILE1BQU0sZUFBRSxDQUFDLHNCQUFzQixDQUFDLGNBQUksQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQztvQkFDMUQsTUFBTSxlQUFFLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxRQUFRLEVBQUUsVUFBVSxDQUFDLENBQUM7b0JBQy9DLE1BQU0sZUFBRSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLENBQUM7Z0JBQ3ZDLENBQUM7Z0JBQUMsT0FBTyxHQUFHLEVBQUUsQ0FBQztvQkFDYixJQUFJLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsbUJBQW1CLENBQUMsRUFBRSxDQUFDO3dCQUkvQyxJQUFBLGdCQUFHLEVBQUMsT0FBTyxFQUFFLHVDQUF1QyxFQUFFLEdBQUcsQ0FBQyxPQUFPLENBQUMsQ0FBQztvQkFDckUsQ0FBQztnQkFDSCxDQUFDO1lBQ0gsQ0FBQztRQUNILENBQUM7SUFDSCxDQUFDO0NBQUE7QUFFRCxNQUFNLG1CQUFtQixHQUFHLENBQUMsR0FBRyxFQUFFLEtBQUssRUFBRSxFQUFFO0lBQ3pDLElBQUksQ0FBQSxHQUFHLGFBQUgsR0FBRyx1QkFBSCxHQUFHLENBQUUsRUFBRSxNQUFLLFNBQVMsSUFBSSxHQUFHLENBQUMsSUFBSSxLQUFLLGVBQWUsRUFBRSxDQUFDO1FBVzFELE9BQU8sS0FBSyxDQUFDO0lBQ2YsQ0FBQztJQUVELElBQUksR0FBRyxDQUFDLElBQUksS0FBSyxPQUFPLEVBQUUsQ0FBQztRQUd6QixPQUFPLElBQUksQ0FBQztJQUNkLENBQUM7SUFFRCxNQUFNLFFBQVEsR0FBRyxLQUFLLENBQUMsUUFBUSxDQUFDLFdBQVcsRUFBRSxDQUFDLEtBQUssQ0FBQyxjQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQ25GLE1BQU0sVUFBVSxHQUFHLFFBQVEsQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUM7SUFDNUMsTUFBTSxhQUFhLEdBQUcsQ0FBQyxDQUFDLFVBQVUsS0FBSyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sR0FBRyxVQUFVLEdBQUcsQ0FBQyxDQUFDLENBQUM7UUFDL0UsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxVQUFVLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQztJQUV6QyxJQUFJLFdBQVcsR0FBRyxpQkFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLEVBQUUsQ0FBQyxZQUFZLEVBQUUsa0JBQWtCLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztJQUM1RSxXQUFXLEdBQUcsV0FBVyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsSUFBQSx1QkFBYyxHQUFFLENBQUM7SUFDdEUsSUFBSSxRQUFRLENBQUMsUUFBUSxDQUFDLFNBQVMsQ0FBQyxFQUFFLENBQUM7UUFHakMsT0FBTyxLQUFLLENBQUM7SUFDZixDQUFDO0lBRUQsT0FBTyxDQUFDLGFBQWEsS0FBSyxTQUFTLENBQUMsSUFBSSxXQUFXLENBQUMsUUFBUSxDQUFDLGFBQWEsQ0FBQyxDQUFDO0FBQzlFLENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qIGVzbGludC1kaXNhYmxlICovXG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcbmltcG9ydCB7IGFjdGlvbnMsIGZzLCB0eXBlcywgc2VsZWN0b3JzLCBsb2csIHV0aWwgfSBmcm9tICd2b3J0ZXgtYXBpJztcbmltcG9ydCB7IE5PVElGX0FDVElWSVRZX0NPTkZJR19NT0QsIEdBTUVfSUQsIE1PRF9DT05GSUcsIFJHWF9JTlZBTElEX0NIQVJTX1dJTkRPV1MsIE1PRF9UWVBFX0NPTkZJRywgTU9EX01BTklGRVNULCBnZXRCdW5kbGVkTW9kcyB9IGZyb20gJy4vY29tbW9uJztcbmltcG9ydCB7IHNldE1lcmdlQ29uZmlncyB9IGZyb20gJy4vYWN0aW9ucyc7XG5pbXBvcnQgeyBJRmlsZUVudHJ5IH0gZnJvbSAnLi90eXBlcyc7XG5pbXBvcnQgeyB3YWxrUGF0aCwgZGVmYXVsdE1vZHNSZWxQYXRoLCBkZWxldGVGb2xkZXIgfSBmcm9tICcuL3V0aWwnO1xuXG5pbXBvcnQgeyBmaW5kU01BUElNb2QsIGZpbmRTTUFQSVRvb2wgfSBmcm9tICcuL1NNQVBJJztcbmltcG9ydCB7IElFbnRyeSB9IGZyb20gJ3R1cmJvd2Fsayc7XG5cbmNvbnN0IHN5bmNXcmFwcGVyID0gKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSkgPT4ge1xuICBvblN5bmNNb2RDb25maWd1cmF0aW9ucyhhcGkpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcmVnaXN0ZXJDb25maWdNb2QoY29udGV4dDogdHlwZXMuSUV4dGVuc2lvbkNvbnRleHQpIHtcbiAgY29udGV4dC5yZWdpc3RlckFjdGlvbignbW9kLWljb25zJywgOTk5LCAnc3dhcCcsIHt9LCAnU3luYyBNb2QgQ29uZmlndXJhdGlvbnMnLFxuICAgICgpID0+IHN5bmNXcmFwcGVyKGNvbnRleHQuYXBpKSxcbiAgICAoKSA9PiB7XG4gICAgICBjb25zdCBzdGF0ZSA9IGNvbnRleHQuYXBpLnN0b3JlLmdldFN0YXRlKCk7XG4gICAgICBjb25zdCBnYW1lTW9kZSA9IHNlbGVjdG9ycy5hY3RpdmVHYW1lSWQoc3RhdGUpO1xuICAgICAgcmV0dXJuIChnYW1lTW9kZSA9PT0gR0FNRV9JRCk7XG4gICAgfSk7XG59XG5cbmNvbnN0IHNob3VsZFN1cHByZXNzU3luYyA9IChhcGk6IHR5cGVzLklFeHRlbnNpb25BcGkpID0+IHtcbiAgY29uc3Qgc3RhdGUgPSBhcGkuZ2V0U3RhdGUoKTtcbiAgY29uc3Qgc3VwcHJlc3NPbkFjdGl2aXRpZXMgPSBbJ2luc3RhbGxpbmdfZGVwZW5kZW5jaWVzJ107XG4gIGNvbnN0IGlzQWN0aXZpdHlSdW5uaW5nID0gKGFjdGl2aXR5OiBzdHJpbmcpID0+IHV0aWwuZ2V0U2FmZShzdGF0ZSwgWydzZXNzaW9uJywgJ2Jhc2UnLCAnYWN0aXZpdHknLCBhY3Rpdml0eV0sIFtdKS5sZW5ndGggPiAwO1xuICBjb25zdCBzdXBwcmVzc2luZ0FjdGl2aXRpZXMgPSBzdXBwcmVzc09uQWN0aXZpdGllcy5maWx0ZXIoYWN0aXZpdHkgPT4gaXNBY3Rpdml0eVJ1bm5pbmcoYWN0aXZpdHkpKTtcbiAgY29uc3Qgc3VwcHJlc3NpbmcgPSBzdXBwcmVzc2luZ0FjdGl2aXRpZXMubGVuZ3RoID4gMDtcbiAgcmV0dXJuIHN1cHByZXNzaW5nO1xufVxuXG5hc3luYyBmdW5jdGlvbiBvblN5bmNNb2RDb25maWd1cmF0aW9ucyhhcGk6IHR5cGVzLklFeHRlbnNpb25BcGksIHNpbGVudD86IGJvb2xlYW4pOiBQcm9taXNlPHZvaWQ+IHtcbiAgY29uc3Qgc3RhdGUgPSBhcGkuZ2V0U3RhdGUoKTtcbiAgY29uc3QgcHJvZmlsZSA9IHNlbGVjdG9ycy5hY3RpdmVQcm9maWxlKHN0YXRlKTtcbiAgaWYgKHByb2ZpbGU/LmdhbWVJZCAhPT0gR0FNRV9JRCB8fCBzaG91bGRTdXBwcmVzc1N5bmMoYXBpKSkge1xuICAgIHJldHVybjtcbiAgfVxuICBjb25zdCBzbWFwaVRvb2w6IHR5cGVzLklEaXNjb3ZlcmVkVG9vbCA9IGZpbmRTTUFQSVRvb2woYXBpKTtcbiAgaWYgKCFzbWFwaVRvb2w/LnBhdGgpIHtcbiAgICByZXR1cm47XG4gIH1cbiAgY29uc3QgbWVyZ2VDb25maWdzID0gdXRpbC5nZXRTYWZlKHN0YXRlLCBbJ3NldHRpbmdzJywgJ1NEVicsICdtZXJnZUNvbmZpZ3MnLCBwcm9maWxlLmlkXSwgZmFsc2UpO1xuICBpZiAoIW1lcmdlQ29uZmlncykge1xuICAgIGlmIChzaWxlbnQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgYXBpLnNob3dEaWFsb2coJ2luZm8nLCAnTW9kIENvbmZpZ3VyYXRpb24gU3luYycsIHtcbiAgICAgIGJiY29kZTogJ01hbnkgU3RhcmRldyBWYWxsZXkgbW9kcyBnZW5lcmF0ZSB0aGVpciBvd24gY29uZmlndXJhdGlvbiBmaWxlcyBkdXJpbmcgZ2FtZSBwbGF5LiBCeSBkZWZhdWx0IHRoZSBnZW5lcmF0ZWQgZmlsZXMgYXJlLCAnXG4gICAgICAgICsgJ2luZ2VzdGVkIGJ5IHRoZWlyIHJlc3BlY3RpdmUgbW9kcy5bYnJdWy9icl1bYnJdWy9icl0nXG4gICAgICAgICsgJ1VuZm9ydHVuYXRlbHkgdGhlIG1vZCBjb25maWd1cmF0aW9uIGZpbGVzIGFyZSBsb3N0IHdoZW4gdXBkYXRpbmcgb3IgcmVtb3ZpbmcgYSBtb2QuW2JyXVsvYnJdW2JyXVsvYnJdIFRoaXMgYnV0dG9uIGFsbG93cyB5b3UgdG8gJ1xuICAgICAgICArICdJbXBvcnQgYWxsIG9mIHlvdXIgYWN0aXZlIG1vZFxcJ3MgY29uZmlndXJhdGlvbiBmaWxlcyBpbnRvIGEgc2luZ2xlIG1vZCB3aGljaCB3aWxsIHJlbWFpbiB1bmFmZmVjdGVkIGJ5IG1vZCB1cGRhdGVzLlticl1bL2JyXVticl1bL2JyXSdcbiAgICAgICAgKyAnV291bGQgeW91IGxpa2UgdG8gZW5hYmxlIHRoaXMgZnVuY3Rpb25hbGl0eT8gKFNNQVBJIG11c3QgYmUgaW5zdGFsbGVkKScsXG4gICAgfSwgW1xuICAgICAgeyBsYWJlbDogJ0Nsb3NlJyB9LFxuICAgICAgeyBsYWJlbDogJ0VuYWJsZScgfVxuICAgIF0pO1xuXG4gICAgaWYgKHJlc3VsdC5hY3Rpb24gPT09ICdDbG9zZScpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAocmVzdWx0LmFjdGlvbiA9PT0gJ0VuYWJsZScpIHtcbiAgICAgIGFwaS5zdG9yZS5kaXNwYXRjaChzZXRNZXJnZUNvbmZpZ3MocHJvZmlsZS5pZCwgdHJ1ZSkpO1xuICAgIH1cbiAgfVxuXG4gIHR5cGUgRXZlbnRUeXBlID0gJ3B1cmdlLW1vZHMnIHwgJ2RlcGxveS1tb2RzJztcbiAgY29uc3QgZXZlbnRQcm9taXNlID0gKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSwgZXZlbnRUeXBlOiBFdmVudFR5cGUpID0+IG5ldyBQcm9taXNlPHZvaWQ+KChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICBjb25zdCBjYiA9IChlcnI6IGFueSkgPT4gZXJyICE9PSBudWxsID8gcmVqZWN0KGVycikgOiByZXNvbHZlKCk7XG4gICAgKGV2ZW50VHlwZSA9PT0gJ3B1cmdlLW1vZHMnKVxuICAgICAgPyBhcGkuZXZlbnRzLmVtaXQoZXZlbnRUeXBlLCBmYWxzZSwgY2IpXG4gICAgICA6IGFwaS5ldmVudHMuZW1pdChldmVudFR5cGUsIGNiKTtcbiAgfSk7XG5cbiAgdHJ5IHtcbiAgICBjb25zdCBtb2QgPSBhd2FpdCBpbml0aWFsaXplKGFwaSk7XG4gICAgaWYgKG1vZD8uY29uZmlnTW9kUGF0aCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGF3YWl0IGV2ZW50UHJvbWlzZShhcGksICdwdXJnZS1tb2RzJyk7XG5cbiAgICBjb25zdCBpbnN0YWxsUGF0aCA9IHNlbGVjdG9ycy5pbnN0YWxsUGF0aEZvckdhbWUoYXBpLmdldFN0YXRlKCksIEdBTUVfSUQpO1xuICAgIGNvbnN0IHJlc29sdmVDYW5kaWRhdGVOYW1lID0gKGZpbGU6IElFbnRyeSk6IHN0cmluZyA9PiB7XG4gICAgICBjb25zdCByZWxQYXRoID0gcGF0aC5yZWxhdGl2ZShpbnN0YWxsUGF0aCwgZmlsZS5maWxlUGF0aCk7XG4gICAgICBjb25zdCBzZWdtZW50cyA9IHJlbFBhdGguc3BsaXQocGF0aC5zZXApO1xuICAgICAgcmV0dXJuIHNlZ21lbnRzWzBdO1xuICAgIH1cbiAgICBjb25zdCBmaWxlcyA9IGF3YWl0IHdhbGtQYXRoKGluc3RhbGxQYXRoKTtcbiAgICBjb25zdCBmaWx0ZXJlZCA9IGZpbGVzLnJlZHVjZSgoYWNjdW06IElGaWxlRW50cnlbXSwgZmlsZTogSUVudHJ5KSA9PiB7XG4gICAgICBpZiAocGF0aC5iYXNlbmFtZShmaWxlLmZpbGVQYXRoKS50b0xvd2VyQ2FzZSgpID09PSBNT0RfQ09ORklHICYmICFwYXRoLmRpcm5hbWUoZmlsZS5maWxlUGF0aCkuaW5jbHVkZXMobW9kLmNvbmZpZ01vZFBhdGgpKSB7XG4gICAgICAgIGNvbnN0IGNhbmRpZGF0ZU5hbWUgPSByZXNvbHZlQ2FuZGlkYXRlTmFtZShmaWxlKTtcbiAgICAgICAgaWYgKHV0aWwuZ2V0U2FmZShwcm9maWxlLCBbJ21vZFN0YXRlJywgY2FuZGlkYXRlTmFtZSwgJ2VuYWJsZWQnXSwgZmFsc2UpID09PSBmYWxzZSkge1xuICAgICAgICAgIHJldHVybiBhY2N1bTtcbiAgICAgICAgfVxuICAgICAgICBhY2N1bS5wdXNoKHsgZmlsZVBhdGg6IGZpbGUuZmlsZVBhdGgsIGNhbmRpZGF0ZXM6IFtjYW5kaWRhdGVOYW1lXSB9KTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBhY2N1bTtcbiAgICB9LCBbXSk7XG4gICAgYXdhaXQgYWRkTW9kQ29uZmlnKGFwaSwgZmlsdGVyZWQsIGluc3RhbGxQYXRoKTtcbiAgICBhd2FpdCBldmVudFByb21pc2UoYXBpLCAnZGVwbG95LW1vZHMnKTtcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgYXBpLnNob3dFcnJvck5vdGlmaWNhdGlvbignRmFpbGVkIHRvIHN5bmMgbW9kIGNvbmZpZ3VyYXRpb25zJywgZXJyKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBzYW5pdGl6ZVByb2ZpbGVOYW1lKGlucHV0OiBzdHJpbmcpIHtcbiAgcmV0dXJuIGlucHV0LnJlcGxhY2UoUkdYX0lOVkFMSURfQ0hBUlNfV0lORE9XUywgJ18nKTtcbn1cblxuZnVuY3Rpb24gY29uZmlnTW9kTmFtZShwcm9maWxlTmFtZTogc3RyaW5nKSB7XG4gIHJldHVybiBgU3RhcmRldyBWYWxsZXkgQ29uZmlndXJhdGlvbiAoJHtzYW5pdGl6ZVByb2ZpbGVOYW1lKHByb2ZpbGVOYW1lKX0pYDtcbn1cblxudHlwZSBDb25maWdNb2QgPSB7XG4gIG1vZDogdHlwZXMuSU1vZDtcbiAgY29uZmlnTW9kUGF0aDogc3RyaW5nO1xufVxuYXN5bmMgZnVuY3Rpb24gaW5pdGlhbGl6ZShhcGk6IHR5cGVzLklFeHRlbnNpb25BcGkpOiBQcm9taXNlPENvbmZpZ01vZD4ge1xuICBjb25zdCBzdGF0ZSA9IGFwaS5nZXRTdGF0ZSgpO1xuICBjb25zdCBwcm9maWxlID0gc2VsZWN0b3JzLmFjdGl2ZVByb2ZpbGUoc3RhdGUpO1xuICBpZiAocHJvZmlsZT8uZ2FtZUlkICE9PSBHQU1FX0lEKSB7XG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh1bmRlZmluZWQpO1xuICB9XG4gIGNvbnN0IG1lcmdlQ29uZmlncyA9IHV0aWwuZ2V0U2FmZShzdGF0ZSwgWydzZXR0aW5ncycsICdTRFYnLCAnbWVyZ2VDb25maWdzJywgcHJvZmlsZS5pZF0sIGZhbHNlKTtcbiAgaWYgKCFtZXJnZUNvbmZpZ3MpIHtcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHVuZGVmaW5lZCk7XG4gIH1cblxuICB0cnkge1xuICAgIGNvbnN0IG1vZCA9IGF3YWl0IGVuc3VyZUNvbmZpZ01vZChhcGkpO1xuICAgIGNvbnN0IGluc3RhbGxhdGlvblBhdGggPSBzZWxlY3RvcnMuaW5zdGFsbFBhdGhGb3JHYW1lKHN0YXRlLCBHQU1FX0lEKTtcbiAgICBjb25zdCBjb25maWdNb2RQYXRoID0gcGF0aC5qb2luKGluc3RhbGxhdGlvblBhdGgsIG1vZC5pbnN0YWxsYXRpb25QYXRoKTtcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHsgY29uZmlnTW9kUGF0aCwgbW9kIH0pO1xuICB9IGNhdGNoIChlcnIpIHtcbiAgICBhcGkuc2hvd0Vycm9yTm90aWZpY2F0aW9uKCdGYWlsZWQgdG8gcmVzb2x2ZSBjb25maWcgbW9kIHBhdGgnLCBlcnIpO1xuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUodW5kZWZpbmVkKTtcbiAgfVxufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gYWRkTW9kQ29uZmlnKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSwgZmlsZXM6IElGaWxlRW50cnlbXSwgbW9kc1BhdGg/OiBzdHJpbmcpIHtcbiAgY29uc3QgY29uZmlnTW9kID0gYXdhaXQgaW5pdGlhbGl6ZShhcGkpO1xuICBpZiAoY29uZmlnTW9kID09PSB1bmRlZmluZWQpIHtcbiAgICByZXR1cm47XG4gIH1cblxuICBjb25zdCBzdGF0ZSA9IGFwaS5nZXRTdGF0ZSgpO1xuICBjb25zdCBkaXNjb3ZlcnkgPSBzZWxlY3RvcnMuZGlzY292ZXJ5QnlHYW1lKHN0YXRlLCBHQU1FX0lEKTtcbiAgY29uc3QgaXNJbnN0YWxsUGF0aCA9IG1vZHNQYXRoICE9PSB1bmRlZmluZWQ7XG4gIG1vZHNQYXRoID0gbW9kc1BhdGggPz8gcGF0aC5qb2luKGRpc2NvdmVyeS5wYXRoLCBkZWZhdWx0TW9kc1JlbFBhdGgoKSk7XG4gIGNvbnN0IHNtYXBpVG9vbDogdHlwZXMuSURpc2NvdmVyZWRUb29sID0gZmluZFNNQVBJVG9vbChhcGkpO1xuICBpZiAoc21hcGlUb29sID09PSB1bmRlZmluZWQpIHtcbiAgICByZXR1cm47XG4gIH1cbiAgY29uc3QgY29uZmlnTW9kQXR0cmlidXRlczogc3RyaW5nW10gPSBleHRyYWN0Q29uZmlnTW9kQXR0cmlidXRlcyhzdGF0ZSwgY29uZmlnTW9kLm1vZC5pZCk7XG4gIGxldCBuZXdDb25maWdBdHRyaWJ1dGVzID0gQXJyYXkuZnJvbShuZXcgU2V0KGNvbmZpZ01vZEF0dHJpYnV0ZXMpKTtcbiAgZm9yIChjb25zdCBmaWxlIG9mIGZpbGVzKSB7XG4gICAgY29uc3Qgc2VnbWVudHMgPSBmaWxlLmZpbGVQYXRoLnRvTG93ZXJDYXNlKCkuc3BsaXQocGF0aC5zZXApLmZpbHRlcihzZWcgPT4gISFzZWcpO1xuICAgIGlmIChzZWdtZW50cy5pbmNsdWRlcygnc21hcGlfaW50ZXJuYWwnKSkge1xuICAgICAgLy8gRG9uJ3QgdG91Y2ggdGhlIGludGVybmFsIFNNQVBJIGNvbmZpZ3VyYXRpb24gZmlsZXMuXG4gICAgICBjb250aW51ZTtcbiAgICB9XG4gICAgYXBpLnNlbmROb3RpZmljYXRpb24oe1xuICAgICAgdHlwZTogJ2FjdGl2aXR5JyxcbiAgICAgIGlkOiBOT1RJRl9BQ1RJVklUWV9DT05GSUdfTU9ELFxuICAgICAgdGl0bGU6ICdJbXBvcnRpbmcgY29uZmlnIGZpbGVzLi4uJyxcbiAgICAgIG1lc3NhZ2U6IGZpbGUuY2FuZGlkYXRlc1swXSxcbiAgICB9KTtcbiAgICBcbiAgICBpZiAoIWNvbmZpZ01vZEF0dHJpYnV0ZXMuaW5jbHVkZXMoZmlsZS5jYW5kaWRhdGVzWzBdKSkge1xuICAgICAgbmV3Q29uZmlnQXR0cmlidXRlcy5wdXNoKGZpbGUuY2FuZGlkYXRlc1swXSk7XG4gICAgfVxuICAgIHRyeSB7XG4gICAgICBjb25zdCBpbnN0YWxsUmVsUGF0aCA9IHBhdGgucmVsYXRpdmUobW9kc1BhdGgsIGZpbGUuZmlsZVBhdGgpO1xuICAgICAgY29uc3Qgc2VnbWVudHMgPSBpbnN0YWxsUmVsUGF0aC5zcGxpdChwYXRoLnNlcCk7XG4gICAgICBjb25zdCByZWxQYXRoID0gaXNJbnN0YWxsUGF0aCA/IHNlZ21lbnRzLnNsaWNlKDEpLmpvaW4ocGF0aC5zZXApIDogaW5zdGFsbFJlbFBhdGg7XG4gICAgICBjb25zdCB0YXJnZXRQYXRoID0gcGF0aC5qb2luKGNvbmZpZ01vZC5jb25maWdNb2RQYXRoLCByZWxQYXRoKTtcbiAgICAgIGNvbnN0IHRhcmdldERpciA9IHBhdGguZXh0bmFtZSh0YXJnZXRQYXRoKSAhPT0gJycgPyBwYXRoLmRpcm5hbWUodGFyZ2V0UGF0aCkgOiB0YXJnZXRQYXRoO1xuICAgICAgYXdhaXQgZnMuZW5zdXJlRGlyV3JpdGFibGVBc3luYyh0YXJnZXREaXIpO1xuICAgICAgbG9nKCdkZWJ1ZycsICdpbXBvcnRpbmcgY29uZmlnIGZpbGUgZnJvbScsIHsgc291cmNlOiBmaWxlLmZpbGVQYXRoLCBkZXN0aW5hdGlvbjogdGFyZ2V0UGF0aCwgbW9kSWQ6IGZpbGUuY2FuZGlkYXRlc1swXSB9KTtcbiAgICAgIGF3YWl0IGZzLmNvcHlBc3luYyhmaWxlLmZpbGVQYXRoLCB0YXJnZXRQYXRoLCB7IG92ZXJ3cml0ZTogdHJ1ZSB9KTtcbiAgICAgIGF3YWl0IGZzLnJlbW92ZUFzeW5jKGZpbGUuZmlsZVBhdGgpO1xuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgYXBpLnNob3dFcnJvck5vdGlmaWNhdGlvbignRmFpbGVkIHRvIHdyaXRlIG1vZCBjb25maWcnLCBlcnIpO1xuICAgIH1cbiAgfVxuXG4gIGFwaS5kaXNtaXNzTm90aWZpY2F0aW9uKE5PVElGX0FDVElWSVRZX0NPTkZJR19NT0QpO1xuICBzZXRDb25maWdNb2RBdHRyaWJ1dGUoYXBpLCBjb25maWdNb2QubW9kLmlkLCBBcnJheS5mcm9tKG5ldyBTZXQobmV3Q29uZmlnQXR0cmlidXRlcykpKTtcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGVuc3VyZUNvbmZpZ01vZChhcGk6IHR5cGVzLklFeHRlbnNpb25BcGkpOiBQcm9taXNlPHR5cGVzLklNb2Q+IHtcbiAgY29uc3Qgc3RhdGUgPSBhcGkuZ2V0U3RhdGUoKTtcbiAgY29uc3QgbW9kczogeyBbbW9kSWQ6IHN0cmluZ106IHR5cGVzLklNb2QgfSA9IHV0aWwuZ2V0U2FmZShzdGF0ZSwgWydwZXJzaXN0ZW50JywgJ21vZHMnLCBHQU1FX0lEXSwge30pO1xuICBjb25zdCBtb2RJbnN0YWxsZWQgPSBPYmplY3QudmFsdWVzKG1vZHMpLmZpbmQoaXRlciA9PiBpdGVyLnR5cGUgPT09IE1PRF9UWVBFX0NPTkZJRyk7XG4gIGlmIChtb2RJbnN0YWxsZWQgIT09IHVuZGVmaW5lZCkge1xuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUobW9kSW5zdGFsbGVkKTtcbiAgfSBlbHNlIHtcbiAgICBjb25zdCBwcm9maWxlID0gc2VsZWN0b3JzLmFjdGl2ZVByb2ZpbGUoc3RhdGUpO1xuICAgIGNvbnN0IG1vZE5hbWUgPSBjb25maWdNb2ROYW1lKHByb2ZpbGUubmFtZSk7XG4gICAgY29uc3QgbW9kID0gYXdhaXQgY3JlYXRlQ29uZmlnTW9kKGFwaSwgbW9kTmFtZSwgcHJvZmlsZSk7XG4gICAgYXBpLnN0b3JlLmRpc3BhdGNoKGFjdGlvbnMuc2V0TW9kRW5hYmxlZChwcm9maWxlLmlkLCBtb2QuaWQsIHRydWUpKTtcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKG1vZCk7XG4gIH1cbn1cblxuYXN5bmMgZnVuY3Rpb24gY3JlYXRlQ29uZmlnTW9kKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSwgbW9kTmFtZTogc3RyaW5nLCBwcm9maWxlOiB0eXBlcy5JUHJvZmlsZSk6IFByb21pc2U8dHlwZXMuSU1vZD4ge1xuICBjb25zdCBtb2QgPSB7XG4gICAgaWQ6IG1vZE5hbWUsXG4gICAgc3RhdGU6ICdpbnN0YWxsZWQnLFxuICAgIGF0dHJpYnV0ZXM6IHtcbiAgICAgIG5hbWU6ICdTdGFyZGV3IFZhbGxleSBNb2QgQ29uZmlndXJhdGlvbicsXG4gICAgICBkZXNjcmlwdGlvbjogJ1RoaXMgbW9kIGlzIGEgY29sbGVjdGl2ZSBtZXJnZSBvZiBTRFYgbW9kIGNvbmZpZ3VyYXRpb24gZmlsZXMgd2hpY2ggVm9ydGV4IG1haW50YWlucyAnXG4gICAgICAgICsgJ2ZvciB0aGUgbW9kcyB5b3UgaGF2ZSBpbnN0YWxsZWQuIFRoZSBjb25maWd1cmF0aW9uIGlzIG1haW50YWluZWQgdGhyb3VnaCBtb2QgdXBkYXRlcywgJ1xuICAgICAgICArICdidXQgYXQgdGltZXMgaXQgbWF5IG5lZWQgdG8gYmUgbWFudWFsbHkgdXBkYXRlZCcsXG4gICAgICBsb2dpY2FsRmlsZU5hbWU6ICdTdGFyZGV3IFZhbGxleSBNb2QgQ29uZmlndXJhdGlvbicsXG4gICAgICBtb2RJZDogNDIsIC8vIE1lYW5pbmcgb2YgbGlmZVxuICAgICAgdmVyc2lvbjogJzEuMC4wJyxcbiAgICAgIHZhcmlhbnQ6IHNhbml0aXplUHJvZmlsZU5hbWUocHJvZmlsZS5uYW1lLnJlcGxhY2UoUkdYX0lOVkFMSURfQ0hBUlNfV0lORE9XUywgJ18nKSksXG4gICAgICBpbnN0YWxsVGltZTogbmV3IERhdGUoKSxcbiAgICAgIHNvdXJjZTogJ3VzZXItZ2VuZXJhdGVkJyxcbiAgICB9LFxuICAgIGluc3RhbGxhdGlvblBhdGg6IG1vZE5hbWUsXG4gICAgdHlwZTogTU9EX1RZUEVfQ09ORklHLFxuICB9O1xuXG4gIHJldHVybiBuZXcgUHJvbWlzZTx0eXBlcy5JTW9kPigocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgYXBpLmV2ZW50cy5lbWl0KCdjcmVhdGUtbW9kJywgcHJvZmlsZS5nYW1lSWQsIG1vZCwgYXN5bmMgKGVycm9yKSA9PiB7XG4gICAgICBpZiAoZXJyb3IgIT09IG51bGwpIHtcbiAgICAgICAgcmV0dXJuIHJlamVjdChlcnJvcik7XG4gICAgICB9XG4gICAgICByZXR1cm4gcmVzb2x2ZShtb2QgYXMgYW55KTtcbiAgICB9KTtcbiAgfSk7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBvbldpbGxFbmFibGVNb2RzKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSwgcHJvZmlsZUlkOiBzdHJpbmcsIG1vZElkczogc3RyaW5nW10sIGVuYWJsZWQ6IGJvb2xlYW4sIG9wdGlvbnM/OiBhbnkpIHtcbiAgY29uc3Qgc3RhdGUgPSBhcGkuZ2V0U3RhdGUoKTtcbiAgY29uc3QgcHJvZmlsZSA9IHNlbGVjdG9ycy5wcm9maWxlQnlJZChzdGF0ZSwgcHJvZmlsZUlkKTtcbiAgaWYgKHByb2ZpbGU/LmdhbWVJZCAhPT0gR0FNRV9JRCkge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGlmIChlbmFibGVkKSB7XG4gICAgYXdhaXQgb25TeW5jTW9kQ29uZmlndXJhdGlvbnMoYXBpLCB0cnVlKTtcbiAgICByZXR1cm47XG4gIH1cblxuICBjb25zdCBjb25maWdNb2QgPSBhd2FpdCBpbml0aWFsaXplKGFwaSk7XG4gIGlmICghY29uZmlnTW9kKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgaWYgKG1vZElkcy5pbmNsdWRlcyhjb25maWdNb2QubW9kLmlkKSkge1xuICAgIC8vIFRoZSBjb25maWcgbW9kIGlzIGdldHRpbmcgZGlzYWJsZWQvdW5pbnN0YWxsZWQgLSByZS1pbnN0YXRlIGFsbCBvZlxuICAgIC8vICB0aGUgY29uZmlndXJhdGlvbiBmaWxlcy5cbiAgICBhd2FpdCBvblJldmVydEZpbGVzKGFwaSwgcHJvZmlsZUlkKTtcbiAgICByZXR1cm47XG4gIH1cblxuICBpZiAob3B0aW9ucz8uaW5zdGFsbGVkIHx8IG9wdGlvbnM/LndpbGxCZVJlcGxhY2VkKSB7XG4gICAgLy8gRG8gbm90aGluZywgdGhlIG1vZHMgYXJlIGJlaW5nIHJlLWluc3RhbGxlZC5cbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG4gIH1cblxuICBjb25zdCBhdHRyaWIgPSBleHRyYWN0Q29uZmlnTW9kQXR0cmlidXRlcyhzdGF0ZSwgY29uZmlnTW9kLm1vZC5pZCk7XG4gIGNvbnN0IHJlbGV2YW50ID0gbW9kSWRzLmZpbHRlcihpZCA9PiBhdHRyaWIuaW5jbHVkZXMoaWQpKTtcbiAgaWYgKHJlbGV2YW50Lmxlbmd0aCA9PT0gMCkge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGNvbnN0IGluc3RhbGxQYXRoID0gc2VsZWN0b3JzLmluc3RhbGxQYXRoRm9yR2FtZShzdGF0ZSwgR0FNRV9JRCk7XG4gIGlmIChlbmFibGVkKSB7XG4gICAgYXdhaXQgb25TeW5jTW9kQ29uZmlndXJhdGlvbnMoYXBpKTtcbiAgICByZXR1cm47XG4gIH1cblxuICBjb25zdCBtb2RzOiB7IFttb2RJZDogc3RyaW5nXTogdHlwZXMuSU1vZCB9ID0gdXRpbC5nZXRTYWZlKHN0YXRlLCBbJ3BlcnNpc3RlbnQnLCAnbW9kcycsIEdBTUVfSURdLCB7fSk7XG4gIGZvciAoY29uc3QgaWQgb2YgcmVsZXZhbnQpIHtcbiAgICBjb25zdCBtb2QgPSBtb2RzW2lkXTtcbiAgICBpZiAoIW1vZD8uaW5zdGFsbGF0aW9uUGF0aCkge1xuICAgICAgY29udGludWU7XG4gICAgfVxuICAgIGNvbnN0IG1vZFBhdGggPSBwYXRoLmpvaW4oaW5zdGFsbFBhdGgsIG1vZC5pbnN0YWxsYXRpb25QYXRoKTtcbiAgICBjb25zdCBmaWxlczogSUVudHJ5W10gPSBhd2FpdCB3YWxrUGF0aChtb2RQYXRoLCB7IHNraXBMaW5rczogdHJ1ZSwgc2tpcEhpZGRlbjogdHJ1ZSwgc2tpcEluYWNjZXNzaWJsZTogdHJ1ZSB9KTtcbiAgICBjb25zdCBtYW5pZmVzdEZpbGUgPSBmaWxlcy5maW5kKGZpbGUgPT4gcGF0aC5iYXNlbmFtZShmaWxlLmZpbGVQYXRoKSA9PT0gTU9EX01BTklGRVNUKTtcbiAgICBpZiAobWFuaWZlc3RGaWxlID09PSB1bmRlZmluZWQpIHtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cbiAgICBjb25zdCByZWxQYXRoID0gcGF0aC5yZWxhdGl2ZShtb2RQYXRoLCBwYXRoLmRpcm5hbWUobWFuaWZlc3RGaWxlLmZpbGVQYXRoKSk7XG4gICAgY29uc3QgbW9kQ29uZmlnRmlsZVBhdGggPSBwYXRoLmpvaW4oY29uZmlnTW9kLmNvbmZpZ01vZFBhdGgsIHJlbFBhdGgsIE1PRF9DT05GSUcpO1xuICAgIGF3YWl0IGZzLmNvcHlBc3luYyhtb2RDb25maWdGaWxlUGF0aCwgcGF0aC5qb2luKG1vZFBhdGgsIHJlbFBhdGgsIE1PRF9DT05GSUcpLCB7IG92ZXJ3cml0ZTogdHJ1ZSB9KS5jYXRjaChlcnIgPT4gbnVsbCk7XG4gICAgdHJ5IHtcbiAgICAgIGF3YWl0IGFwcGx5VG9Nb2RDb25maWcoYXBpLCAoKSA9PiBkZWxldGVGb2xkZXIocGF0aC5kaXJuYW1lKG1vZENvbmZpZ0ZpbGVQYXRoKSkpO1xuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgYXBpLnNob3dFcnJvck5vdGlmaWNhdGlvbignRmFpbGVkIHRvIHdyaXRlIG1vZCBjb25maWcnLCBlcnIpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgfVxuXG4gIHJlbW92ZUNvbmZpZ01vZEF0dHJpYnV0ZXMoYXBpLCBjb25maWdNb2QubW9kLCByZWxldmFudCk7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBhcHBseVRvTW9kQ29uZmlnKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSwgY2I6ICgpID0+IFByb21pc2U8dm9pZD4pIHtcbiAgLy8gQXBwbHlpbmcgZmlsZSBvcGVyYXRpb25zIHRvIHRoZSBjb25maWcgbW9kIHJlcXVpcmVzIHVzIHRvXG4gIC8vICByZW1vdmUgaXQgZnJvbSB0aGUgZ2FtZSBkaXJlY3RvcnkgYW5kIGRlcGxveW1lbnQgbWFuaWZlc3QgYmVmb3JlXG4gIC8vICByZS1pbnRyb2R1Y2luZyBpdCAodGhpcyBpcyB0byBhdm9pZCBFQ0QpXG4gIHRyeSB7XG4gICAgY29uc3QgY29uZmlnTW9kID0gYXdhaXQgaW5pdGlhbGl6ZShhcGkpO1xuICAgIGF3YWl0IGFwaS5lbWl0QW5kQXdhaXQoJ2RlcGxveS1zaW5nbGUtbW9kJywgR0FNRV9JRCwgY29uZmlnTW9kLm1vZC5pZCwgZmFsc2UpO1xuICAgIGF3YWl0IGNiKCk7XG4gICAgYXdhaXQgYXBpLmVtaXRBbmRBd2FpdCgnZGVwbG95LXNpbmdsZS1tb2QnLCBHQU1FX0lELCBjb25maWdNb2QubW9kLmlkLCB0cnVlKTsgXG4gIH0gY2F0Y2ggKGVycikge1xuICAgIGFwaS5zaG93RXJyb3JOb3RpZmljYXRpb24oJ0ZhaWxlZCB0byB3cml0ZSBtb2QgY29uZmlnJywgZXJyKTtcbiAgfVxufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gb25SZXZlcnRGaWxlcyhhcGk6IHR5cGVzLklFeHRlbnNpb25BcGksIHByb2ZpbGVJZDogc3RyaW5nKSB7XG4gIGNvbnN0IHN0YXRlID0gYXBpLmdldFN0YXRlKCk7XG4gIGNvbnN0IHByb2ZpbGUgPSBzZWxlY3RvcnMucHJvZmlsZUJ5SWQoc3RhdGUsIHByb2ZpbGVJZCk7XG4gIGlmIChwcm9maWxlPy5nYW1lSWQgIT09IEdBTUVfSUQpIHtcbiAgICByZXR1cm47XG4gIH1cbiAgY29uc3QgY29uZmlnTW9kID0gYXdhaXQgaW5pdGlhbGl6ZShhcGkpO1xuICBpZiAoIWNvbmZpZ01vZCkge1xuICAgIHJldHVybjtcbiAgfVxuICBjb25zdCBhdHRyaWIgPSBleHRyYWN0Q29uZmlnTW9kQXR0cmlidXRlcyhzdGF0ZSwgY29uZmlnTW9kLm1vZC5pZCk7XG4gIGlmIChhdHRyaWIubGVuZ3RoID09PSAwKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgYXdhaXQgb25XaWxsRW5hYmxlTW9kcyhhcGksIHByb2ZpbGVJZCwgYXR0cmliLCBmYWxzZSk7XG4gIHJldHVybjtcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIG9uQWRkZWRGaWxlcyhhcGk6IHR5cGVzLklFeHRlbnNpb25BcGksIHByb2ZpbGVJZDogc3RyaW5nLCBmaWxlczogSUZpbGVFbnRyeVtdKSB7XG4gIGNvbnN0IHN0YXRlID0gYXBpLnN0b3JlLmdldFN0YXRlKCk7XG4gIGNvbnN0IHByb2ZpbGUgPSBzZWxlY3RvcnMucHJvZmlsZUJ5SWQoc3RhdGUsIHByb2ZpbGVJZCk7XG4gIGlmIChwcm9maWxlPy5nYW1lSWQgIT09IEdBTUVfSUQpIHtcbiAgICAvLyBkb24ndCBjYXJlIGFib3V0IGFueSBvdGhlciBnYW1lc1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGNvbnN0IHNtYXBpVG9vbDogdHlwZXMuSURpc2NvdmVyZWRUb29sID0gZmluZFNNQVBJVG9vbChhcGkpO1xuICBpZiAoc21hcGlUb29sID09PSB1bmRlZmluZWQpIHtcbiAgICAvLyBWZXJ5IGltcG9ydGFudCBub3QgdG8gYWRkIGFueSBmaWxlcyBpZiBWb3J0ZXggaGFzIG5vIGtub3dsZWRnZSBvZiBTTUFQSSdzIGxvY2F0aW9uLlxuICAgIC8vICB0aGlzIGlzIHRvIGF2b2lkIHB1bGxpbmcgU01BUEkgY29uZmlndXJhdGlvbiBmaWxlcyBpbnRvIG9uZSBvZiB0aGUgbW9kcyBpbnN0YWxsZWQgYnkgVm9ydGV4LlxuICAgIHJldHVybjtcbiAgfVxuICBjb25zdCBpc1NNQVBJRmlsZSA9IChmaWxlOiBJRmlsZUVudHJ5KSA9PiB7XG4gICAgY29uc3Qgc2VnbWVudHMgPSBmaWxlLmZpbGVQYXRoLnRvTG93ZXJDYXNlKCkuc3BsaXQocGF0aC5zZXApLmZpbHRlcihzZWcgPT4gISFzZWcpO1xuICAgIHJldHVybiBzZWdtZW50cy5pbmNsdWRlcygnc21hcGlfaW50ZXJuYWwnKTtcbiAgfTtcbiAgY29uc3QgbWVyZ2VDb25maWdzID0gdXRpbC5nZXRTYWZlKHN0YXRlLCBbJ3NldHRpbmdzJywgJ1NEVicsICdtZXJnZUNvbmZpZ3MnLCBwcm9maWxlLmlkXSwgZmFsc2UpO1xuICBjb25zdCByZXN1bHQgPSBmaWxlcy5yZWR1Y2UoKGFjY3VtLCBmaWxlKSA9PiB7XG4gICAgaWYgKG1lcmdlQ29uZmlncyAmJiAhaXNTTUFQSUZpbGUoZmlsZSkgJiYgcGF0aC5iYXNlbmFtZShmaWxlLmZpbGVQYXRoKS50b0xvd2VyQ2FzZSgpID09PSBNT0RfQ09ORklHKSB7XG4gICAgICBhY2N1bS5jb25maWdzLnB1c2goZmlsZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGFjY3VtLnJlZ3VsYXJzLnB1c2goZmlsZSk7XG4gICAgfVxuICAgIHJldHVybiBhY2N1bTtcbiAgfSwgeyBjb25maWdzOiBbXSBhcyBJRmlsZUVudHJ5W10sIHJlZ3VsYXJzOiBbXSBhcyBJRmlsZUVudHJ5W10gfSk7XG4gIHJldHVybiBQcm9taXNlLmFsbChbXG4gICAgYWRkQ29uZmlnRmlsZXMoYXBpLCBwcm9maWxlSWQsIHJlc3VsdC5jb25maWdzKSxcbiAgICBhZGRSZWd1bGFyRmlsZXMoYXBpLCBwcm9maWxlSWQsIHJlc3VsdC5yZWd1bGFycylcbiAgXSk7XG59XG5cbmZ1bmN0aW9uIGV4dHJhY3RDb25maWdNb2RBdHRyaWJ1dGVzKHN0YXRlOiB0eXBlcy5JU3RhdGUsIGNvbmZpZ01vZElkOiBzdHJpbmcpOiBhbnkge1xuICByZXR1cm4gdXRpbC5nZXRTYWZlKHN0YXRlLCBbJ3BlcnNpc3RlbnQnLCAnbW9kcycsIEdBTUVfSUQsIGNvbmZpZ01vZElkLCAnYXR0cmlidXRlcycsICdjb25maWdNb2QnXSwgW10pO1xufVxuXG5mdW5jdGlvbiBzZXRDb25maWdNb2RBdHRyaWJ1dGUoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpLCBjb25maWdNb2RJZDogc3RyaW5nLCBhdHRyaWJ1dGVzOiBzdHJpbmdbXSkge1xuICBhcGkuc3RvcmUuZGlzcGF0Y2goYWN0aW9ucy5zZXRNb2RBdHRyaWJ1dGUoR0FNRV9JRCwgY29uZmlnTW9kSWQsICdjb25maWdNb2QnLCBhdHRyaWJ1dGVzKSk7XG59XG5cbmZ1bmN0aW9uIHJlbW92ZUNvbmZpZ01vZEF0dHJpYnV0ZXMoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpLCBjb25maWdNb2Q6IHR5cGVzLklNb2QsIGF0dHJpYnV0ZXM6IHN0cmluZ1tdKSB7XG4gIGNvbnN0IGV4aXN0aW5nID0gZXh0cmFjdENvbmZpZ01vZEF0dHJpYnV0ZXMoYXBpLmdldFN0YXRlKCksIGNvbmZpZ01vZC5pZCk7XG4gIGNvbnN0IG5ld0F0dHJpYnV0ZXMgPSBleGlzdGluZy5maWx0ZXIoYXR0ciA9PiAhYXR0cmlidXRlcy5pbmNsdWRlcyhhdHRyKSk7XG4gIHNldENvbmZpZ01vZEF0dHJpYnV0ZShhcGksIGNvbmZpZ01vZC5pZCwgbmV3QXR0cmlidXRlcyk7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGFkZENvbmZpZ0ZpbGVzKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSwgcHJvZmlsZUlkOiBzdHJpbmcsIGZpbGVzOiBJRmlsZUVudHJ5W10pIHtcbiAgaWYgKGZpbGVzLmxlbmd0aCA9PT0gMCkge1xuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcbiAgfVxuICBhcGkuc2VuZE5vdGlmaWNhdGlvbih7XG4gICAgdHlwZTogJ2FjdGl2aXR5JyxcbiAgICBpZDogTk9USUZfQUNUSVZJVFlfQ09ORklHX01PRCxcbiAgICB0aXRsZTogJ0ltcG9ydGluZyBjb25maWcgZmlsZXMuLi4nLFxuICAgIG1lc3NhZ2U6ICdTdGFydGluZyB1cC4uLidcbiAgfSk7XG5cbiAgcmV0dXJuIGFkZE1vZENvbmZpZyhhcGksIGZpbGVzLCB1bmRlZmluZWQpO1xufVxuXG5hc3luYyBmdW5jdGlvbiBhZGRSZWd1bGFyRmlsZXMoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpLCBwcm9maWxlSWQ6IHN0cmluZywgZmlsZXM6IElGaWxlRW50cnlbXSkge1xuICBpZiAoZmlsZXMubGVuZ3RoID09PSAwKSB7XG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xuICB9XG4gIGNvbnN0IHN0YXRlID0gYXBpLmdldFN0YXRlKCk7XG4gIGNvbnN0IGdhbWUgPSB1dGlsLmdldEdhbWUoR0FNRV9JRCk7XG4gIGNvbnN0IGRpc2NvdmVyeSA9IHNlbGVjdG9ycy5kaXNjb3ZlcnlCeUdhbWUoc3RhdGUsIEdBTUVfSUQpO1xuICBjb25zdCBtb2RQYXRocyA9IGdhbWUuZ2V0TW9kUGF0aHMoZGlzY292ZXJ5LnBhdGgpO1xuICBjb25zdCBpbnN0YWxsUGF0aCA9IHNlbGVjdG9ycy5pbnN0YWxsUGF0aEZvckdhbWUoc3RhdGUsIEdBTUVfSUQpO1xuICBmb3IgKGNvbnN0IGVudHJ5IG9mIGZpbGVzKSB7XG4gICAgaWYgKGVudHJ5LmNhbmRpZGF0ZXMubGVuZ3RoID09PSAxKSB7XG4gICAgICBjb25zdCBtb2QgPSB1dGlsLmdldFNhZmUoc3RhdGUucGVyc2lzdGVudC5tb2RzLFxuICAgICAgICBbR0FNRV9JRCwgZW50cnkuY2FuZGlkYXRlc1swXV0sXG4gICAgICAgIHVuZGVmaW5lZCk7XG4gICAgICBpZiAoIWlzTW9kQ2FuZGlkYXRlVmFsaWQobW9kLCBlbnRyeSkpIHtcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xuICAgICAgfVxuICAgICAgY29uc3QgZnJvbSA9IG1vZFBhdGhzW21vZC50eXBlID8/ICcnXTtcbiAgICAgIGlmIChmcm9tID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgLy8gSG93IGlzIHRoaXMgZXZlbiBwb3NzaWJsZT8gcmVnYXJkbGVzcyBpdCdzIG5vdCB0aGlzXG4gICAgICAgIC8vICBmdW5jdGlvbidzIGpvYiB0byByZXBvcnQgdGhpcy5cbiAgICAgICAgbG9nKCdlcnJvcicsICdmYWlsZWQgdG8gcmVzb2x2ZSBtb2QgcGF0aCBmb3IgbW9kIHR5cGUnLCBtb2QudHlwZSk7XG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IHJlbFBhdGggPSBwYXRoLnJlbGF0aXZlKGZyb20sIGVudHJ5LmZpbGVQYXRoKTtcbiAgICAgIGNvbnN0IHRhcmdldFBhdGggPSBwYXRoLmpvaW4oaW5zdGFsbFBhdGgsIG1vZC5pZCwgcmVsUGF0aCk7XG4gICAgICAvLyBjb3B5IHRoZSBuZXcgZmlsZSBiYWNrIGludG8gdGhlIGNvcnJlc3BvbmRpbmcgbW9kLCB0aGVuIGRlbGV0ZSBpdC4gVGhhdCB3YXksIHZvcnRleCB3aWxsXG4gICAgICAvLyBjcmVhdGUgYSBsaW5rIHRvIGl0IHdpdGggdGhlIGNvcnJlY3QgZGVwbG95bWVudCBtZXRob2QgYW5kIG5vdCBhc2sgdGhlIHVzZXIgYW55IHF1ZXN0aW9uc1xuICAgICAgdHJ5IHtcbiAgICAgICAgYXdhaXQgZnMuZW5zdXJlRGlyV3JpdGFibGVBc3luYyhwYXRoLmRpcm5hbWUodGFyZ2V0UGF0aCkpO1xuICAgICAgICBhd2FpdCBmcy5jb3B5QXN5bmMoZW50cnkuZmlsZVBhdGgsIHRhcmdldFBhdGgpO1xuICAgICAgICBhd2FpdCBmcy5yZW1vdmVBc3luYyhlbnRyeS5maWxlUGF0aCk7XG4gICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgaWYgKCFlcnIubWVzc2FnZS5pbmNsdWRlcygnYXJlIHRoZSBzYW1lIGZpbGUnKSkge1xuICAgICAgICAgIC8vIHNob3VsZCB3ZSBiZSByZXBvcnRpbmcgdGhpcyB0byB0aGUgdXNlcj8gVGhpcyBpcyBhIGNvbXBsZXRlbHlcbiAgICAgICAgICAvLyBhdXRvbWF0ZWQgcHJvY2VzcyBhbmQgaWYgaXQgZmFpbHMgbW9yZSBvZnRlbiB0aGFuIG5vdCB0aGVcbiAgICAgICAgICAvLyB1c2VyIHByb2JhYmx5IGRvZXNuJ3QgY2FyZVxuICAgICAgICAgIGxvZygnZXJyb3InLCAnZmFpbGVkIHRvIHJlLWltcG9ydCBhZGRlZCBmaWxlIHRvIG1vZCcsIGVyci5tZXNzYWdlKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG5jb25zdCBpc01vZENhbmRpZGF0ZVZhbGlkID0gKG1vZCwgZW50cnkpID0+IHtcbiAgaWYgKG1vZD8uaWQgPT09IHVuZGVmaW5lZCB8fCBtb2QudHlwZSA9PT0gJ3NkdnJvb3Rmb2xkZXInKSB7XG4gICAgLy8gVGhlcmUgaXMgbm8gcmVsaWFibGUgd2F5IHRvIGFzY2VydGFpbiB3aGV0aGVyIGEgbmV3IGZpbGUgZW50cnlcbiAgICAvLyAgYWN0dWFsbHkgYmVsb25ncyB0byBhIHJvb3QgbW9kVHlwZSBhcyBzb21lIG9mIHRoZXNlIG1vZHMgd2lsbCBhY3RcbiAgICAvLyAgYXMgcmVwbGFjZW1lbnQgbW9kcy4gVGhpcyBvYnZpb3VzbHkgbWVhbnMgdGhhdCBpZiB0aGUgZ2FtZSBoYXNcbiAgICAvLyAgYSBzdWJzdGFudGlhbCB1cGRhdGUgd2hpY2ggaW50cm9kdWNlcyBuZXcgZmlsZXMgd2UgY291bGQgcG90ZW50aWFsbHlcbiAgICAvLyAgYWRkIGEgdmFuaWxsYSBnYW1lIGZpbGUgaW50byB0aGUgbW9kJ3Mgc3RhZ2luZyBmb2xkZXIgY2F1c2luZyBjb25zdGFudFxuICAgIC8vICBjb250ZW50aW9uIGJldHdlZW4gdGhlIGdhbWUgaXRzZWxmICh3aGVuIGl0IHVwZGF0ZXMpIGFuZCB0aGUgbW9kLlxuICAgIC8vXG4gICAgLy8gVGhlcmUgaXMgYWxzbyBhIHBvdGVudGlhbCBjaGFuY2UgZm9yIHJvb3QgbW9kVHlwZXMgdG8gY29uZmxpY3Qgd2l0aCByZWd1bGFyXG4gICAgLy8gIG1vZHMsIHdoaWNoIGlzIHdoeSBpdCdzIG5vdCBzYWZlIHRvIGFzc3VtZSB0aGF0IGFueSBhZGRpdGlvbiBpbnNpZGUgdGhlXG4gICAgLy8gIG1vZHMgZGlyZWN0b3J5IGNhbiBiZSBzYWZlbHkgYWRkZWQgdG8gdGhpcyBtb2QncyBzdGFnaW5nIGZvbGRlciBlaXRoZXIuXG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgaWYgKG1vZC50eXBlICE9PSAnU01BUEknKSB7XG4gICAgLy8gT3RoZXIgbW9kIHR5cGVzIGRvIG5vdCByZXF1aXJlIGZ1cnRoZXIgdmFsaWRhdGlvbiAtIGl0IHNob3VsZCBiZSBmaW5lXG4gICAgLy8gIHRvIGFkZCB0aGlzIGVudHJ5LlxuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgY29uc3Qgc2VnbWVudHMgPSBlbnRyeS5maWxlUGF0aC50b0xvd2VyQ2FzZSgpLnNwbGl0KHBhdGguc2VwKS5maWx0ZXIoc2VnID0+ICEhc2VnKTtcbiAgY29uc3QgbW9kc1NlZ0lkeCA9IHNlZ21lbnRzLmluZGV4T2YoJ21vZHMnKTtcbiAgY29uc3QgbW9kRm9sZGVyTmFtZSA9ICgobW9kc1NlZ0lkeCAhPT0gLTEpICYmIChzZWdtZW50cy5sZW5ndGggPiBtb2RzU2VnSWR4ICsgMSkpXG4gICAgPyBzZWdtZW50c1ttb2RzU2VnSWR4ICsgMV0gOiB1bmRlZmluZWQ7XG5cbiAgbGV0IGJ1bmRsZWRNb2RzID0gdXRpbC5nZXRTYWZlKG1vZCwgWydhdHRyaWJ1dGVzJywgJ3NtYXBpQnVuZGxlZE1vZHMnXSwgW10pO1xuICBidW5kbGVkTW9kcyA9IGJ1bmRsZWRNb2RzLmxlbmd0aCA+IDAgPyBidW5kbGVkTW9kcyA6IGdldEJ1bmRsZWRNb2RzKCk7XG4gIGlmIChzZWdtZW50cy5pbmNsdWRlcygnY29udGVudCcpKSB7XG4gICAgLy8gU01BUEkgaXMgbm90IHN1cHBvc2VkIHRvIG92ZXJ3cml0ZSB0aGUgZ2FtZSdzIGNvbnRlbnQgZGlyZWN0bHkuXG4gICAgLy8gIHRoaXMgaXMgY2xlYXJseSBub3QgYSBTTUFQSSBmaWxlIGFuZCBzaG91bGQgX25vdF8gYmUgYWRkZWQgdG8gaXQuXG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgcmV0dXJuIChtb2RGb2xkZXJOYW1lICE9PSB1bmRlZmluZWQpICYmIGJ1bmRsZWRNb2RzLmluY2x1ZGVzKG1vZEZvbGRlck5hbWUpO1xufTsiXX0=