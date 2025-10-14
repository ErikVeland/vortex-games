"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerConfigMod = registerConfigMod;
exports.addModConfig = addModConfig;
exports.ensureConfigMod = ensureConfigMod;
exports.onWillEnableMods = onWillEnableMods;
exports.applyToModConfig = applyToModConfig;
exports.onRevertFiles = onRevertFiles;
exports.onAddedFiles = onAddedFiles;
const path = __importStar(require("path"));
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
                const relPath = path.relative(installPath, file.filePath);
                const segments = relPath.split(path.sep);
                return segments[0];
            };
            const files = yield (0, util_1.walkPath)(installPath);
            const filtered = files.reduce((accum, file) => {
                if (path.basename(file.filePath).toLowerCase() === common_1.MOD_CONFIG && !path.dirname(file.filePath).includes(mod.configModPath)) {
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
            const configModPath = path.join(installationPath, mod.installationPath);
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
        modsPath = modsPath !== null && modsPath !== void 0 ? modsPath : path.join(discovery.path, (0, util_1.defaultModsRelPath)());
        const smapiTool = (0, SMAPI_1.findSMAPITool)(api);
        if (smapiTool === undefined) {
            return;
        }
        const configModAttributes = extractConfigModAttributes(state, configMod.mod.id);
        let newConfigAttributes = Array.from(new Set(configModAttributes));
        for (const file of files) {
            const segments = file.filePath.toLowerCase().split(path.sep).filter(seg => !!seg);
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
                const installRelPath = path.relative(modsPath, file.filePath);
                const segments = installRelPath.split(path.sep);
                const relPath = isInstallPath ? segments.slice(1).join(path.sep) : installRelPath;
                const targetPath = path.join(configMod.configModPath, relPath);
                const targetDir = path.extname(targetPath) !== '' ? path.dirname(targetPath) : targetPath;
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
            const modPath = path.join(installPath, mod.installationPath);
            const files = yield (0, util_1.walkPath)(modPath, { skipLinks: true, skipHidden: true, skipInaccessible: true });
            const manifestFile = files.find(file => path.basename(file.filePath) === common_1.MOD_MANIFEST);
            if (manifestFile === undefined) {
                continue;
            }
            const relPath = path.relative(modPath, path.dirname(manifestFile.filePath));
            const modConfigFilePath = path.join(configMod.configModPath, relPath, common_1.MOD_CONFIG);
            yield vortex_api_1.fs.copyAsync(modConfigFilePath, path.join(modPath, relPath, common_1.MOD_CONFIG), { overwrite: true }).catch(err => null);
            try {
                yield applyToModConfig(api, () => (0, util_1.deleteFolder)(path.dirname(modConfigFilePath)));
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
            const segments = file.filePath.toLowerCase().split(path.sep).filter(seg => !!seg);
            return segments.includes('smapi_internal');
        };
        const mergeConfigs = vortex_api_1.util.getSafe(state, ['settings', 'SDV', 'mergeConfigs', profile.id], false);
        const result = files.reduce((accum, file) => {
            if (mergeConfigs && !isSMAPIFile(file) && path.basename(file.filePath).toLowerCase() === common_1.MOD_CONFIG) {
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
                const relPath = path.relative(from, entry.filePath);
                const targetPath = path.join(installPath, mod.id, relPath);
                try {
                    yield vortex_api_1.fs.ensureDirWritableAsync(path.dirname(targetPath));
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
    const segments = entry.filePath.toLowerCase().split(path.sep).filter(seg => !!seg);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29uZmlnTW9kLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiY29uZmlnTW9kLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBZUEsOENBUUM7QUF1SEQsb0NBaURDO0FBRUQsMENBYUM7QUFnQ0QsNENBaUVDO0FBRUQsNENBWUM7QUFFRCxzQ0FpQkM7QUFFRCxvQ0ErQkM7QUFoWEQsMkNBQTZCO0FBQzdCLDJDQUFzRTtBQUN0RSxxQ0FBb0o7QUFDcEosdUNBQTRDO0FBRTVDLGlDQUFvRTtBQUVwRSxtQ0FBc0Q7QUFHdEQsTUFBTSxXQUFXLEdBQUcsQ0FBQyxHQUF3QixFQUFFLEVBQUU7SUFDL0MsdUJBQXVCLENBQUMsR0FBRyxDQUFDLENBQUM7QUFDL0IsQ0FBQyxDQUFBO0FBRUQsU0FBZ0IsaUJBQWlCLENBQUMsT0FBZ0M7SUFDaEUsT0FBTyxDQUFDLGNBQWMsQ0FBQyxXQUFXLEVBQUUsR0FBRyxFQUFFLE1BQU0sRUFBRSxFQUFFLEVBQUUseUJBQXlCLEVBQzVFLEdBQUcsRUFBRSxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLEVBQzlCLEdBQUcsRUFBRTtRQUNILE1BQU0sS0FBSyxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLFFBQVEsRUFBRSxDQUFDO1FBQzNDLE1BQU0sUUFBUSxHQUFHLHNCQUFTLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQy9DLE9BQU8sQ0FBQyxRQUFRLEtBQUssZ0JBQU8sQ0FBQyxDQUFDO0lBQ2hDLENBQUMsQ0FBQyxDQUFDO0FBQ1AsQ0FBQztBQUVELE1BQU0sa0JBQWtCLEdBQUcsQ0FBQyxHQUF3QixFQUFFLEVBQUU7SUFDdEQsTUFBTSxLQUFLLEdBQUcsR0FBRyxDQUFDLFFBQVEsRUFBRSxDQUFDO0lBQzdCLE1BQU0sb0JBQW9CLEdBQUcsQ0FBQyx5QkFBeUIsQ0FBQyxDQUFDO0lBQ3pE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QUFNLFFBQVEsR0FBRyxLQUFLLENBQUMsUUFBUSxDQUFDLFdBQVcsRUFBRSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQ25GLE1BQU0sVUFBVSxHQUFHLFFBQVEsQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUM7SUFDNUMsTUFBTSxhQUFhLEdBQUcsQ0FBQyxDQUFDLFVBQVUsS0FBSyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sR0FBRyxVQUFVLEdBQUcsQ0FBQyxDQUFDLENBQUM7UUFDL0UsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxVQUFVLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQztJQUV6QyxJQUFJLFdBQVcsR0FBRyxpQkFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLEVBQUUsQ0FBQyxZQUFZLEVBQUUsa0JBQWtCLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztJQUM1RSxXQUFXLEdBQUcsV0FBVyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsSUFBQSx1QkFBYyxHQUFFLENBQUM7SUFDdEUsSUFBSSxRQUFRLENBQUMsUUFBUSxDQUFDLFNBQVMsQ0FBQyxFQUFFLENBQUM7UUFHakMsT0FBTyxLQUFLLENBQUM7SUFDZixDQUFDO0lBRUQsT0FBTyxDQUFDLGFBQWEsS0FBSyxTQUFTLENBQUMsSUFBSSxXQUFXLENBQUMsUUFBUSxDQUFDLGFBQWEsQ0FBQyxDQUFDO0FBQzlFLENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qIGVzbGludC1kaXNhYmxlICovXG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0IHsgYWN0aW9ucywgZnMsIHR5cGVzLCBzZWxlY3RvcnMsIGxvZywgdXRpbCB9IGZyb20gJ3ZvcnRleC1hcGknO1xuaW1wb3J0IHsgTk9USUZfQUNUSVZJVFlfQ09ORklHX01PRCwgR0FNRV9JRCwgTU9EX0NPTkZJRywgUkdYX0lOVkFMSURfQ0hBUlNfV0lORE9XUywgTU9EX1RZUEVfQ09ORklHLCBNT0RfTUFOSUZFU1QsIGdldEJ1bmRsZWRNb2RzIH0gZnJvbSAnLi9jb21tb24nO1xuaW1wb3J0IHsgc2V0TWVyZ2VDb25maWdzIH0gZnJvbSAnLi9hY3Rpb25zJztcbmltcG9ydCB7IElGaWxlRW50cnkgfSBmcm9tICcuL3R5cGVzJztcbmltcG9ydCB7IHdhbGtQYXRoLCBkZWZhdWx0TW9kc1JlbFBhdGgsIGRlbGV0ZUZvbGRlciB9IGZyb20gJy4vdXRpbCc7XG5cbmltcG9ydCB7IGZpbmRTTUFQSU1vZCwgZmluZFNNQVBJVG9vbCB9IGZyb20gJy4vU01BUEknO1xuaW1wb3J0IHsgSUVudHJ5IH0gZnJvbSAndHVyYm93YWxrJztcblxuY29uc3Qgc3luY1dyYXBwZXIgPSAoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpKSA9PiB7XG4gIG9uU3luY01vZENvbmZpZ3VyYXRpb25zKGFwaSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiByZWdpc3RlckNvbmZpZ01vZChjb250ZXh0OiB0eXBlcy5JRXh0ZW5zaW9uQ29udGV4dCkge1xuICBjb250ZXh0LnJlZ2lzdGVyQWN0aW9uKCdtb2QtaWNvbnMnLCA5OTksICdzd2FwJywge30sICdTeW5jIE1vZCBDb25maWd1cmF0aW9ucycsXG4gICAgKCkgPT4gc3luY1dyYXBwZXIoY29udGV4dC5hcGkpLFxuICAgICgpID0+IHtcbiAgICAgIGNvbnN0IHN0YXRlID0gY29udGV4dC5hcGkuc3RvcmUuZ2V0U3RhdGUoKTtcbiAgICAgIGNvbnN0IGdhbWVNb2RlID0gc2VsZWN0b3JzLmFjdGl2ZUdhbWVJZChzdGF0ZSk7XG4gICAgICByZXR1cm4gKGdhbWVNb2RlID09PSBHQU1FX0lEKTtcbiAgICB9KTtcbn1cblxuY29uc3Qgc2hvdWxkU3VwcHJlc3NTeW5jID0gKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSkgPT4ge1xuICBjb25zdCBzdGF0ZSA9IGFwaS5nZXRTdGF0ZSgpO1xuICBjb25zdCBzdXBwcmVzc09uQWN0aXZpdGllcyA9IFsnaW5zdGFsbGluZ19kZXBlbmRlbmNpZXMnXTtcbiAgY29uc3QgaXNBY3Rpdml0eVJ1bm5pbmcgPSAoYWN0aXZpdHk6IHN0cmluZykgPT4gdXRpbC5nZXRTYWZlKHN0YXRlLCBbJ3Nlc3Npb24nLCAnYmFzZScsICdhY3Rpdml0eScsIGFjdGl2aXR5XSwgW10pLmxlbmd0aCA+IDA7XG4gIGNvbnN0IHN1cHByZXNzaW5nQWN0aXZpdGllcyA9IHN1cHByZXNzT25BY3Rpdml0aWVzLmZpbHRlcihhY3Rpdml0eSA9PiBpc0FjdGl2aXR5UnVubmluZyhhY3Rpdml0eSkpO1xuICBjb25zdCBzdXBwcmVzc2luZyA9IHN1cHByZXNzaW5nQWN0aXZpdGllcy5sZW5ndGggPiAwO1xuICByZXR1cm4gc3VwcHJlc3Npbmc7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIG9uU3luY01vZENvbmZpZ3VyYXRpb25zKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSwgc2lsZW50PzogYm9vbGVhbik6IFByb21pc2U8dm9pZD4ge1xuICBjb25zdCBzdGF0ZSA9IGFwaS5nZXRTdGF0ZSgpO1xuICBjb25zdCBwcm9maWxlID0gc2VsZWN0b3JzLmFjdGl2ZVByb2ZpbGUoc3RhdGUpO1xuICBpZiAocHJvZmlsZT8uZ2FtZUlkICE9PSBHQU1FX0lEIHx8IHNob3VsZFN1cHByZXNzU3luYyhhcGkpKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIGNvbnN0IHNtYXBpVG9vbDogdHlwZXMuSURpc2NvdmVyZWRUb29sID0gZmluZFNNQVBJVG9vbChhcGkpO1xuICBpZiAoIXNtYXBpVG9vbD8ucGF0aCkge1xuICAgIHJldHVybjtcbiAgfVxuICBjb25zdCBtZXJnZUNvbmZpZ3MgPSB1dGlsLmdldFNhZmUoc3RhdGUsIFsnc2V0dGluZ3MnLCAnU0RWJywgJ21lcmdlQ29uZmlncycsIHByb2ZpbGUuaWRdLCBmYWxzZSk7XG4gIGlmICghbWVyZ2VDb25maWdzKSB7XG4gICAgaWYgKHNpbGVudCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBhcGkuc2hvd0RpYWxvZygnaW5mbycsICdNb2QgQ29uZmlndXJhdGlvbiBTeW5jJywge1xuICAgICAgYmJjb2RlOiAnTWFueSBTdGFyZGV3IFZhbGxleSBtb2RzIGdlbmVyYXRlIHRoZWlyIG93biBjb25maWd1cmF0aW9uIGZpbGVzIGR1cmluZyBnYW1lIHBsYXkuIEJ5IGRlZmF1bHQgdGhlIGdlbmVyYXRlZCBmaWxlcyBhcmUsICdcbiAgICAgICAgKyAnaW5nZXN0ZWQgYnkgdGhlaXIgcmVzcGVjdGl2ZSBtb2RzLlticl1bL2JyXVticl1bL2JyXSdcbiAgICAgICAgKyAnVW5mb3J0dW5hdGVseSB0aGUgbW9kIGNvbmZpZ3VyYXRpb24gZmlsZXMgYXJlIGxvc3Qgd2hlbiB1cGRhdGluZyBvciByZW1vdmluZyBhIG1vZC5bYnJdWy9icl1bYnJdWy9icl0gVGhpcyBidXR0b24gYWxsb3dzIHlvdSB0byAnXG4gICAgICAgICsgJ0ltcG9ydCBhbGwgb2YgeW91ciBhY3RpdmUgbW9kXFwncyBjb25maWd1cmF0aW9uIGZpbGVzIGludG8gYSBzaW5nbGUgbW9kIHdoaWNoIHdpbGwgcmVtYWluIHVuYWZmZWN0ZWQgYnkgbW9kIHVwZGF0ZXMuW2JyXVsvYnJdW2JyXVsvYnJdJ1xuICAgICAgICArICdXb3VsZCB5b3UgbGlrZSB0byBlbmFibGUgdGhpcyBmdW5jdGlvbmFsaXR5PyAoU01BUEkgbXVzdCBiZSBpbnN0YWxsZWQpJyxcbiAgICB9LCBbXG4gICAgICB7IGxhYmVsOiAnQ2xvc2UnIH0sXG4gICAgICB7IGxhYmVsOiAnRW5hYmxlJyB9XG4gICAgXSk7XG5cbiAgICBpZiAocmVzdWx0LmFjdGlvbiA9PT0gJ0Nsb3NlJykge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmIChyZXN1bHQuYWN0aW9uID09PSAnRW5hYmxlJykge1xuICAgICAgYXBpLnN0b3JlLmRpc3BhdGNoKHNldE1lcmdlQ29uZmlncyhwcm9maWxlLmlkLCB0cnVlKSk7XG4gICAgfVxuICB9XG5cbiAgdHlwZSBFdmVudFR5cGUgPSAncHVyZ2UtbW9kcycgfCAnZGVwbG95LW1vZHMnO1xuICBjb25zdCBldmVudFByb21pc2UgPSAoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpLCBldmVudFR5cGU6IEV2ZW50VHlwZSkgPT4gbmV3IFByb21pc2U8dm9pZD4oKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgIGNvbnN0IGNiID0gKGVycjogYW55KSA9PiBlcnIgIT09IG51bGwgPyByZWplY3QoZXJyKSA6IHJlc29sdmUoKTtcbiAgICAoZXZlbnRUeXBlID09PSAncHVyZ2UtbW9kcycpXG4gICAgICA/IGFwaS5ldmVudHMuZW1pdChldmVudFR5cGUsIGZhbHNlLCBjYilcbiAgICAgIDogYXBpLmV2ZW50cy5lbWl0KGV2ZW50VHlwZSwgY2IpO1xuICB9KTtcblxuICB0cnkge1xuICAgIGNvbnN0IG1vZCA9IGF3YWl0IGluaXRpYWxpemUoYXBpKTtcbiAgICBpZiAobW9kPy5jb25maWdNb2RQYXRoID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgYXdhaXQgZXZlbnRQcm9taXNlKGFwaSwgJ3B1cmdlLW1vZHMnKTtcblxuICAgIGNvbnN0IGluc3RhbGxQYXRoID0gc2VsZWN0b3JzLmluc3RhbGxQYXRoRm9yR2FtZShhcGkuZ2V0U3RhdGUoKSwgR0FNRV9JRCk7XG4gICAgY29uc3QgcmVzb2x2ZUNhbmRpZGF0ZU5hbWUgPSAoZmlsZTogSUVudHJ5KTogc3RyaW5nID0+IHtcbiAgICAgIGNvbnN0IHJlbFBhdGggPSBwYXRoLnJlbGF0aXZlKGluc3RhbGxQYXRoLCBmaWxlLmZpbGVQYXRoKTtcbiAgICAgIGNvbnN0IHNlZ21lbnRzID0gcmVsUGF0aC5zcGxpdChwYXRoLnNlcCk7XG4gICAgICByZXR1cm4gc2VnbWVudHNbMF07XG4gICAgfVxuICAgIGNvbnN0IGZpbGVzID0gYXdhaXQgd2Fsa1BhdGgoaW5zdGFsbFBhdGgpO1xuICAgIGNvbnN0IGZpbHRlcmVkID0gZmlsZXMucmVkdWNlKChhY2N1bTogSUZpbGVFbnRyeVtdLCBmaWxlOiBJRW50cnkpID0+IHtcbiAgICAgIGlmIChwYXRoLmJhc2VuYW1lKGZpbGUuZmlsZVBhdGgpLnRvTG93ZXJDYXNlKCkgPT09IE1PRF9DT05GSUcgJiYgIXBhdGguZGlybmFtZShmaWxlLmZpbGVQYXRoKS5pbmNsdWRlcyhtb2QuY29uZmlnTW9kUGF0aCkpIHtcbiAgICAgICAgY29uc3QgY2FuZGlkYXRlTmFtZSA9IHJlc29sdmVDYW5kaWRhdGVOYW1lKGZpbGUpO1xuICAgICAgICBpZiAodXRpbC5nZXRTYWZlKHByb2ZpbGUsIFsnbW9kU3RhdGUnLCBjYW5kaWRhdGVOYW1lLCAnZW5hYmxlZCddLCBmYWxzZSkgPT09IGZhbHNlKSB7XG4gICAgICAgICAgcmV0dXJuIGFjY3VtO1xuICAgICAgICB9XG4gICAgICAgIGFjY3VtLnB1c2goeyBmaWxlUGF0aDogZmlsZS5maWxlUGF0aCwgY2FuZGlkYXRlczogW2NhbmRpZGF0ZU5hbWVdIH0pO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGFjY3VtO1xuICAgIH0sIFtdKTtcbiAgICBhd2FpdCBhZGRNb2RDb25maWcoYXBpLCBmaWx0ZXJlZCwgaW5zdGFsbFBhdGgpO1xuICAgIGF3YWl0IGV2ZW50UHJvbWlzZShhcGksICdkZXBsb3ktbW9kcycpO1xuICB9IGNhdGNoIChlcnIpIHtcbiAgICBhcGkuc2hvd0Vycm9yTm90aWZpY2F0aW9uKCdGYWlsZWQgdG8gc3luYyBtb2QgY29uZmlndXJhdGlvbnMnLCBlcnIpO1xuICB9XG59XG5cbmZ1bmN0aW9uIHNhbml0aXplUHJvZmlsZU5hbWUoaW5wdXQ6IHN0cmluZykge1xuICByZXR1cm4gaW5wdXQucmVwbGFjZShSR1hfSU5WQUxJRF9DSEFSU19XSU5ET1dTLCAnXycpO1xufVxuXG5mdW5jdGlvbiBjb25maWdNb2ROYW1lKHByb2ZpbGVOYW1lOiBzdHJpbmcpIHtcbiAgcmV0dXJuIGBTdGFyZGV3IFZhbGxleSBDb25maWd1cmF0aW9uICgke3Nhbml0aXplUHJvZmlsZU5hbWUocHJvZmlsZU5hbWUpfSlgO1xufVxuXG50eXBlIENvbmZpZ01vZCA9IHtcbiAgbW9kOiB0eXBlcy5JTW9kO1xuICBjb25maWdNb2RQYXRoOiBzdHJpbmc7XG59XG5hc3luYyBmdW5jdGlvbiBpbml0aWFsaXplKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSk6IFByb21pc2U8Q29uZmlnTW9kPiB7XG4gIGNvbnN0IHN0YXRlID0gYXBpLmdldFN0YXRlKCk7XG4gIGNvbnN0IHByb2ZpbGUgPSBzZWxlY3RvcnMuYWN0aXZlUHJvZmlsZShzdGF0ZSk7XG4gIGlmIChwcm9maWxlPy5nYW1lSWQgIT09IEdBTUVfSUQpIHtcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHVuZGVmaW5lZCk7XG4gIH1cbiAgY29uc3QgbWVyZ2VDb25maWdzID0gdXRpbC5nZXRTYWZlKHN0YXRlLCBbJ3NldHRpbmdzJywgJ1NEVicsICdtZXJnZUNvbmZpZ3MnLCBwcm9maWxlLmlkXSwgZmFsc2UpO1xuICBpZiAoIW1lcmdlQ29uZmlncykge1xuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUodW5kZWZpbmVkKTtcbiAgfVxuXG4gIHRyeSB7XG4gICAgY29uc3QgbW9kID0gYXdhaXQgZW5zdXJlQ29uZmlnTW9kKGFwaSk7XG4gICAgY29uc3QgaW5zdGFsbGF0aW9uUGF0aCA9IHNlbGVjdG9ycy5pbnN0YWxsUGF0aEZvckdhbWUoc3RhdGUsIEdBTUVfSUQpO1xuICAgIGNvbnN0IGNvbmZpZ01vZFBhdGggPSBwYXRoLmpvaW4oaW5zdGFsbGF0aW9uUGF0aCwgbW9kLmluc3RhbGxhdGlvblBhdGgpO1xuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoeyBjb25maWdNb2RQYXRoLCBtb2QgfSk7XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIGFwaS5zaG93RXJyb3JOb3RpZmljYXRpb24oJ0ZhaWxlZCB0byByZXNvbHZlIGNvbmZpZyBtb2QgcGF0aCcsIGVycik7XG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh1bmRlZmluZWQpO1xuICB9XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBhZGRNb2RDb25maWcoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpLCBmaWxlczogSUZpbGVFbnRyeVtdLCBtb2RzUGF0aD86IHN0cmluZykge1xuICBjb25zdCBjb25maWdNb2QgPSBhd2FpdCBpbml0aWFsaXplKGFwaSk7XG4gIGlmIChjb25maWdNb2QgPT09IHVuZGVmaW5lZCkge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGNvbnN0IHN0YXRlID0gYXBpLmdldFN0YXRlKCk7XG4gIGNvbnN0IGRpc2NvdmVyeSA9IHNlbGVjdG9ycy5kaXNjb3ZlcnlCeUdhbWUoc3RhdGUsIEdBTUVfSUQpO1xuICBjb25zdCBpc0luc3RhbGxQYXRoID0gbW9kc1BhdGggIT09IHVuZGVmaW5lZDtcbiAgbW9kc1BhdGggPSBtb2RzUGF0aCA/PyBwYXRoLmpvaW4oZGlzY292ZXJ5LnBhdGgsIGRlZmF1bHRNb2RzUmVsUGF0aCgpKTtcbiAgY29uc3Qgc21hcGlUb29sOiB0eXBlcy5JRGlzY292ZXJlZFRvb2wgPSBmaW5kU01BUElUb29sKGFwaSk7XG4gIGlmIChzbWFwaVRvb2wgPT09IHVuZGVmaW5lZCkge1xuICAgIHJldHVybjtcbiAgfVxuICBjb25zdCBjb25maWdNb2RBdHRyaWJ1dGVzOiBzdHJpbmdbXSA9IGV4dHJhY3RDb25maWdNb2RBdHRyaWJ1dGVzKHN0YXRlLCBjb25maWdNb2QubW9kLmlkKTtcbiAgbGV0IG5ld0NvbmZpZ0F0dHJpYnV0ZXMgPSBBcnJheS5mcm9tKG5ldyBTZXQoY29uZmlnTW9kQXR0cmlidXRlcykpO1xuICBmb3IgKGNvbnN0IGZpbGUgb2YgZmlsZXMpIHtcbiAgICBjb25zdCBzZWdtZW50cyA9IGZpbGUuZmlsZVBhdGgudG9Mb3dlckNhc2UoKS5zcGxpdChwYXRoLnNlcCkuZmlsdGVyKHNlZyA9PiAhIXNlZyk7XG4gICAgaWYgKHNlZ21lbnRzLmluY2x1ZGVzKCdzbWFwaV9pbnRlcm5hbCcpKSB7XG4gICAgICAvLyBEb24ndCB0b3VjaCB0aGUgaW50ZXJuYWwgU01BUEkgY29uZmlndXJhdGlvbiBmaWxlcy5cbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cbiAgICBhcGkuc2VuZE5vdGlmaWNhdGlvbih7XG4gICAgICB0eXBlOiAnYWN0aXZpdHknLFxuICAgICAgaWQ6IE5PVElGX0FDVElWSVRZX0NPTkZJR19NT0QsXG4gICAgICB0aXRsZTogJ0ltcG9ydGluZyBjb25maWcgZmlsZXMuLi4nLFxuICAgICAgbWVzc2FnZTogZmlsZS5jYW5kaWRhdGVzWzBdLFxuICAgIH0pO1xuICAgIFxuICAgIGlmICghY29uZmlnTW9kQXR0cmlidXRlcy5pbmNsdWRlcyhmaWxlLmNhbmRpZGF0ZXNbMF0pKSB7XG4gICAgICBuZXdDb25maWdBdHRyaWJ1dGVzLnB1c2goZmlsZS5jYW5kaWRhdGVzWzBdKTtcbiAgICB9XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IGluc3RhbGxSZWxQYXRoID0gcGF0aC5yZWxhdGl2ZShtb2RzUGF0aCwgZmlsZS5maWxlUGF0aCk7XG4gICAgICBjb25zdCBzZWdtZW50cyA9IGluc3RhbGxSZWxQYXRoLnNwbGl0KHBhdGguc2VwKTtcbiAgICAgIGNvbnN0IHJlbFBhdGggPSBpc0luc3RhbGxQYXRoID8gc2VnbWVudHMuc2xpY2UoMSkuam9pbihwYXRoLnNlcCkgOiBpbnN0YWxsUmVsUGF0aDtcbiAgICAgIGNvbnN0IHRhcmdldFBhdGggPSBwYXRoLmpvaW4oY29uZmlnTW9kLmNvbmZpZ01vZFBhdGgsIHJlbFBhdGgpO1xuICAgICAgY29uc3QgdGFyZ2V0RGlyID0gcGF0aC5leHRuYW1lKHRhcmdldFBhdGgpICE9PSAnJyA/IHBhdGguZGlybmFtZSh0YXJnZXRQYXRoKSA6IHRhcmdldFBhdGg7XG4gICAgICBhd2FpdCBmcy5lbnN1cmVEaXJXcml0YWJsZUFzeW5jKHRhcmdldERpcik7XG4gICAgICBsb2coJ2RlYnVnJywgJ2ltcG9ydGluZyBjb25maWcgZmlsZSBmcm9tJywgeyBzb3VyY2U6IGZpbGUuZmlsZVBhdGgsIGRlc3RpbmF0aW9uOiB0YXJnZXRQYXRoLCBtb2RJZDogZmlsZS5jYW5kaWRhdGVzWzBdIH0pO1xuICAgICAgYXdhaXQgZnMuY29weUFzeW5jKGZpbGUuZmlsZVBhdGgsIHRhcmdldFBhdGgsIHsgb3ZlcndyaXRlOiB0cnVlIH0pO1xuICAgICAgYXdhaXQgZnMucmVtb3ZlQXN5bmMoZmlsZS5maWxlUGF0aCk7XG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICBhcGkuc2hvd0Vycm9yTm90aWZpY2F0aW9uKCdGYWlsZWQgdG8gd3JpdGUgbW9kIGNvbmZpZycsIGVycik7XG4gICAgfVxuICB9XG5cbiAgYXBpLmRpc21pc3NOb3RpZmljYXRpb24oTk9USUZfQUNUSVZJVFlfQ09ORklHX01PRCk7XG4gIHNldENvbmZpZ01vZEF0dHJpYnV0ZShhcGksIGNvbmZpZ01vZC5tb2QuaWQsIEFycmF5LmZyb20obmV3IFNldChuZXdDb25maWdBdHRyaWJ1dGVzKSkpO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZW5zdXJlQ29uZmlnTW9kKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSk6IFByb21pc2U8dHlwZXMuSU1vZD4ge1xuICBjb25zdCBzdGF0ZSA9IGFwaS5nZXRTdGF0ZSgpO1xuICBjb25zdCBtb2RzOiB7IFttb2RJZDogc3RyaW5nXTogdHlwZXMuSU1vZCB9ID0gdXRpbC5nZXRTYWZlKHN0YXRlLCBbJ3BlcnNpc3RlbnQnLCAnbW9kcycsIEdBTUVfSURdLCB7fSk7XG4gIGNvbnN0IG1vZEluc3RhbGxlZCA9IE9iamVjdC52YWx1ZXMobW9kcykuZmluZChpdGVyID0+IGl0ZXIudHlwZSA9PT0gTU9EX1RZUEVfQ09ORklHKTtcbiAgaWYgKG1vZEluc3RhbGxlZCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShtb2RJbnN0YWxsZWQpO1xuICB9IGVsc2Uge1xuICAgIGNvbnN0IHByb2ZpbGUgPSBzZWxlY3RvcnMuYWN0aXZlUHJvZmlsZShzdGF0ZSk7XG4gICAgY29uc3QgbW9kTmFtZSA9IGNvbmZpZ01vZE5hbWUocHJvZmlsZS5uYW1lKTtcbiAgICBjb25zdCBtb2QgPSBhd2FpdCBjcmVhdGVDb25maWdNb2QoYXBpLCBtb2ROYW1lLCBwcm9maWxlKTtcbiAgICBhcGkuc3RvcmUuZGlzcGF0Y2goYWN0aW9ucy5zZXRNb2RFbmFibGVkKHByb2ZpbGUuaWQsIG1vZC5pZCwgdHJ1ZSkpO1xuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUobW9kKTtcbiAgfVxufVxuXG5hc3luYyBmdW5jdGlvbiBjcmVhdGVDb25maWdNb2QoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpLCBtb2ROYW1lOiBzdHJpbmcsIHByb2ZpbGU6IHR5cGVzLklQcm9maWxlKTogUHJvbWlzZTx0eXBlcy5JTW9kPiB7XG4gIGNvbnN0IG1vZCA9IHtcbiAgICBpZDogbW9kTmFtZSxcbiAgICBzdGF0ZTogJ2luc3RhbGxlZCcsXG4gICAgYXR0cmlidXRlczoge1xuICAgICAgbmFtZTogJ1N0YXJkZXcgVmFsbGV5IE1vZCBDb25maWd1cmF0aW9uJyxcbiAgICAgIGRlc2NyaXB0aW9uOiAnVGhpcyBtb2QgaXMgYSBjb2xsZWN0aXZlIG1lcmdlIG9mIFNEViBtb2QgY29uZmlndXJhdGlvbiBmaWxlcyB3aGljaCBWb3J0ZXggbWFpbnRhaW5zICdcbiAgICAgICAgKyAnZm9yIHRoZSBtb2RzIHlvdSBoYXZlIGluc3RhbGxlZC4gVGhlIGNvbmZpZ3VyYXRpb24gaXMgbWFpbnRhaW5lZCB0aHJvdWdoIG1vZCB1cGRhdGVzLCAnXG4gICAgICAgICsgJ2J1dCBhdCB0aW1lcyBpdCBtYXkgbmVlZCB0byBiZSBtYW51YWxseSB1cGRhdGVkJyxcbiAgICAgIGxvZ2ljYWxGaWxlTmFtZTogJ1N0YXJkZXcgVmFsbGV5IE1vZCBDb25maWd1cmF0aW9uJyxcbiAgICAgIG1vZElkOiA0MiwgLy8gTWVhbmluZyBvZiBsaWZlXG4gICAgICB2ZXJzaW9uOiAnMS4wLjAnLFxuICAgICAgdmFyaWFudDogc2FuaXRpemVQcm9maWxlTmFtZShwcm9maWxlLm5hbWUucmVwbGFjZShSR1hfSU5WQUxJRF9DSEFSU19XSU5ET1dTLCAnXycpKSxcbiAgICAgIGluc3RhbGxUaW1lOiBuZXcgRGF0ZSgpLFxuICAgICAgc291cmNlOiAndXNlci1nZW5lcmF0ZWQnLFxuICAgIH0sXG4gICAgaW5zdGFsbGF0aW9uUGF0aDogbW9kTmFtZSxcbiAgICB0eXBlOiBNT0RfVFlQRV9DT05GSUcsXG4gIH07XG5cbiAgcmV0dXJuIG5ldyBQcm9taXNlPHR5cGVzLklNb2Q+KChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICBhcGkuZXZlbnRzLmVtaXQoJ2NyZWF0ZS1tb2QnLCBwcm9maWxlLmdhbWVJZCwgbW9kLCBhc3luYyAoZXJyb3IpID0+IHtcbiAgICAgIGlmIChlcnJvciAhPT0gbnVsbCkge1xuICAgICAgICByZXR1cm4gcmVqZWN0KGVycm9yKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiByZXNvbHZlKG1vZCBhcyBhbnkpO1xuICAgIH0pO1xuICB9KTtcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIG9uV2lsbEVuYWJsZU1vZHMoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpLCBwcm9maWxlSWQ6IHN0cmluZywgbW9kSWRzOiBzdHJpbmdbXSwgZW5hYmxlZDogYm9vbGVhbiwgb3B0aW9ucz86IGFueSkge1xuICBjb25zdCBzdGF0ZSA9IGFwaS5nZXRTdGF0ZSgpO1xuICBjb25zdCBwcm9maWxlID0gc2VsZWN0b3JzLnByb2ZpbGVCeUlkKHN0YXRlLCBwcm9maWxlSWQpO1xuICBpZiAocHJvZmlsZT8uZ2FtZUlkICE9PSBHQU1FX0lEKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgaWYgKGVuYWJsZWQpIHtcbiAgICBhd2FpdCBvblN5bmNNb2RDb25maWd1cmF0aW9ucyhhcGksIHRydWUpO1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGNvbnN0IGNvbmZpZ01vZCA9IGF3YWl0IGluaXRpYWxpemUoYXBpKTtcbiAgaWYgKCFjb25maWdNb2QpIHtcbiAgICByZXR1cm47XG4gIH1cblxuICBpZiAobW9kSWRzLmluY2x1ZGVzKGNvbmZpZ01vZC5tb2QuaWQpKSB7XG4gICAgLy8gVGhlIGNvbmZpZyBtb2QgaXMgZ2V0dGluZyBkaXNhYmxlZC91bmluc3RhbGxlZCAtIHJlLWluc3RhdGUgYWxsIG9mXG4gICAgLy8gIHRoZSBjb25maWd1cmF0aW9uIGZpbGVzLlxuICAgIGF3YWl0IG9uUmV2ZXJ0RmlsZXMoYXBpLCBwcm9maWxlSWQpO1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGlmIChvcHRpb25zPy5pbnN0YWxsZWQgfHwgb3B0aW9ucz8ud2lsbEJlUmVwbGFjZWQpIHtcbiAgICAvLyBEbyBub3RoaW5nLCB0aGUgbW9kcyBhcmUgYmVpbmcgcmUtaW5zdGFsbGVkLlxuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcbiAgfVxuXG4gIGNvbnN0IGF0dHJpYiA9IGV4dHJhY3RDb25maWdNb2RBdHRyaWJ1dGVzKHN0YXRlLCBjb25maWdNb2QubW9kLmlkKTtcbiAgY29uc3QgcmVsZXZhbnQgPSBtb2RJZHMuZmlsdGVyKGlkID0+IGF0dHJpYi5pbmNsdWRlcyhpZCkpO1xuICBpZiAocmVsZXZhbnQubGVuZ3RoID09PSAwKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgY29uc3QgaW5zdGFsbFBhdGggPSBzZWxlY3RvcnMuaW5zdGFsbFBhdGhGb3JHYW1lKHN0YXRlLCBHQU1FX0lEKTtcbiAgaWYgKGVuYWJsZWQpIHtcbiAgICBhd2FpdCBvblN5bmNNb2RDb25maWd1cmF0aW9ucyhhcGkpO1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGNvbnN0IG1vZHM6IHsgW21vZElkOiBzdHJpbmddOiB0eXBlcy5JTW9kIH0gPSB1dGlsLmdldFNhZmUoc3RhdGUsIFsncGVyc2lzdGVudCcsICdtb2RzJywgR0FNRV9JRF0sIHt9KTtcbiAgZm9yIChjb25zdCBpZCBvZiByZWxldmFudCkge1xuICAgIGNvbnN0IG1vZCA9IG1vZHNbaWRdO1xuICAgIGlmICghbW9kPy5pbnN0YWxsYXRpb25QYXRoKSB7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG4gICAgY29uc3QgbW9kUGF0aCA9IHBhdGguam9pbihpbnN0YWxsUGF0aCwgbW9kLmluc3RhbGxhdGlvblBhdGgpO1xuICAgIGNvbnN0IGZpbGVzOiBJRW50cnlbXSA9IGF3YWl0IHdhbGtQYXRoKG1vZFBhdGgsIHsgc2tpcExpbmtzOiB0cnVlLCBza2lwSGlkZGVuOiB0cnVlLCBza2lwSW5hY2Nlc3NpYmxlOiB0cnVlIH0pO1xuICAgIGNvbnN0IG1hbmlmZXN0RmlsZSA9IGZpbGVzLmZpbmQoZmlsZSA9PiBwYXRoLmJhc2VuYW1lKGZpbGUuZmlsZVBhdGgpID09PSBNT0RfTUFOSUZFU1QpO1xuICAgIGlmIChtYW5pZmVzdEZpbGUgPT09IHVuZGVmaW5lZCkge1xuICAgICAgY29udGludWU7XG4gICAgfVxuICAgIGNvbnN0IHJlbFBhdGggPSBwYXRoLnJlbGF0aXZlKG1vZFBhdGgsIHBhdGguZGlybmFtZShtYW5pZmVzdEZpbGUuZmlsZVBhdGgpKTtcbiAgICBjb25zdCBtb2RDb25maWdGaWxlUGF0aCA9IHBhdGguam9pbihjb25maWdNb2QuY29uZmlnTW9kUGF0aCwgcmVsUGF0aCwgTU9EX0NPTkZJRyk7XG4gICAgYXdhaXQgZnMuY29weUFzeW5jKG1vZENvbmZpZ0ZpbGVQYXRoLCBwYXRoLmpvaW4obW9kUGF0aCwgcmVsUGF0aCwgTU9EX0NPTkZJRyksIHsgb3ZlcndyaXRlOiB0cnVlIH0pLmNhdGNoKGVyciA9PiBudWxsKTtcbiAgICB0cnkge1xuICAgICAgYXdhaXQgYXBwbHlUb01vZENvbmZpZyhhcGksICgpID0+IGRlbGV0ZUZvbGRlcihwYXRoLmRpcm5hbWUobW9kQ29uZmlnRmlsZVBhdGgpKSk7XG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICBhcGkuc2hvd0Vycm9yTm90aWZpY2F0aW9uKCdGYWlsZWQgdG8gd3JpdGUgbW9kIGNvbmZpZycsIGVycik7XG4gICAgICByZXR1cm47XG4gICAgfVxuICB9XG5cbiAgcmVtb3ZlQ29uZmlnTW9kQXR0cmlidXRlcyhhcGksIGNvbmZpZ01vZC5tb2QsIHJlbGV2YW50KTtcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGFwcGx5VG9Nb2RDb25maWcoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpLCBjYjogKCkgPT4gUHJvbWlzZTx2b2lkPikge1xuICAvLyBBcHBseWluZyBmaWxlIG9wZXJhdGlvbnMgdG8gdGhlIGNvbmZpZyBtb2QgcmVxdWlyZXMgdXMgdG9cbiAgLy8gIHJlbW92ZSBpdCBmcm9tIHRoZSBnYW1lIGRpcmVjdG9yeSBhbmQgZGVwbG95bWVudCBtYW5pZmVzdCBiZWZvcmVcbiAgLy8gIHJlLWludHJvZHVjaW5nIGl0ICh0aGlzIGlzIHRvIGF2b2lkIEVDRClcbiAgdHJ5IHtcbiAgICBjb25zdCBjb25maWdNb2QgPSBhd2FpdCBpbml0aWFsaXplKGFwaSk7XG4gICAgYXdhaXQgYXBpLmVtaXRBbmRBd2FpdCgnZGVwbG95LXNpbmdsZS1tb2QnLCBHQU1FX0lELCBjb25maWdNb2QubW9kLmlkLCBmYWxzZSk7XG4gICAgYXdhaXQgY2IoKTtcbiAgICBhd2FpdCBhcGkuZW1pdEFuZEF3YWl0KCdkZXBsb3ktc2luZ2xlLW1vZCcsIEdBTUVfSUQsIGNvbmZpZ01vZC5tb2QuaWQsIHRydWUpOyBcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgYXBpLnNob3dFcnJvck5vdGlmaWNhdGlvbignRmFpbGVkIHRvIHdyaXRlIG1vZCBjb25maWcnLCBlcnIpO1xuICB9XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBvblJldmVydEZpbGVzKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSwgcHJvZmlsZUlkOiBzdHJpbmcpIHtcbiAgY29uc3Qgc3RhdGUgPSBhcGkuZ2V0U3RhdGUoKTtcbiAgY29uc3QgcHJvZmlsZSA9IHNlbGVjdG9ycy5wcm9maWxlQnlJZChzdGF0ZSwgcHJvZmlsZUlkKTtcbiAgaWYgKHByb2ZpbGU/LmdhbWVJZCAhPT0gR0FNRV9JRCkge1xuICAgIHJldHVybjtcbiAgfVxuICBjb25zdCBjb25maWdNb2QgPSBhd2FpdCBpbml0aWFsaXplKGFwaSk7XG4gIGlmICghY29uZmlnTW9kKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIGNvbnN0IGF0dHJpYiA9IGV4dHJhY3RDb25maWdNb2RBdHRyaWJ1dGVzKHN0YXRlLCBjb25maWdNb2QubW9kLmlkKTtcbiAgaWYgKGF0dHJpYi5sZW5ndGggPT09IDApIHtcbiAgICByZXR1cm47XG4gIH1cblxuICBhd2FpdCBvbldpbGxFbmFibGVNb2RzKGFwaSwgcHJvZmlsZUlkLCBhdHRyaWIsIGZhbHNlKTtcbiAgcmV0dXJuO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gb25BZGRlZEZpbGVzKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSwgcHJvZmlsZUlkOiBzdHJpbmcsIGZpbGVzOiBJRmlsZUVudHJ5W10pIHtcbiAgY29uc3Qgc3RhdGUgPSBhcGkuc3RvcmUuZ2V0U3RhdGUoKTtcbiAgY29uc3QgcHJvZmlsZSA9IHNlbGVjdG9ycy5wcm9maWxlQnlJZChzdGF0ZSwgcHJvZmlsZUlkKTtcbiAgaWYgKHByb2ZpbGU/LmdhbWVJZCAhPT0gR0FNRV9JRCkge1xuICAgIC8vIGRvbid0IGNhcmUgYWJvdXQgYW55IG90aGVyIGdhbWVzXG4gICAgcmV0dXJuO1xuICB9XG5cbiAgY29uc3Qgc21hcGlUb29sOiB0eXBlcy5JRGlzY292ZXJlZFRvb2wgPSBmaW5kU01BUElUb29sKGFwaSk7XG4gIGlmIChzbWFwaVRvb2wgPT09IHVuZGVmaW5lZCkge1xuICAgIC8vIFZlcnkgaW1wb3J0YW50IG5vdCB0byBhZGQgYW55IGZpbGVzIGlmIFZvcnRleCBoYXMgbm8ga25vd2xlZGdlIG9mIFNNQVBJJ3MgbG9jYXRpb24uXG4gICAgLy8gIHRoaXMgaXMgdG8gYXZvaWQgcHVsbGluZyBTTUFQSSBjb25maWd1cmF0aW9uIGZpbGVzIGludG8gb25lIG9mIHRoZSBtb2RzIGluc3RhbGxlZCBieSBWb3J0ZXguXG4gICAgcmV0dXJuO1xuICB9XG4gIGNvbnN0IGlzU01BUElGaWxlID0gKGZpbGU6IElGaWxlRW50cnkpID0+IHtcbiAgICBjb25zdCBzZWdtZW50cyA9IGZpbGUuZmlsZVBhdGgudG9Mb3dlckNhc2UoKS5zcGxpdChwYXRoLnNlcCkuZmlsdGVyKHNlZyA9PiAhIXNlZyk7XG4gICAgcmV0dXJuIHNlZ21lbnRzLmluY2x1ZGVzKCdzbWFwaV9pbnRlcm5hbCcpO1xuICB9O1xuICBjb25zdCBtZXJnZUNvbmZpZ3MgPSB1dGlsLmdldFNhZmUoc3RhdGUsIFsnc2V0dGluZ3MnLCAnU0RWJywgJ21lcmdlQ29uZmlncycsIHByb2ZpbGUuaWRdLCBmYWxzZSk7XG4gIGNvbnN0IHJlc3VsdCA9IGZpbGVzLnJlZHVjZSgoYWNjdW0sIGZpbGUpID0+IHtcbiAgICBpZiAobWVyZ2VDb25maWdzICYmICFpc1NNQVBJRmlsZShmaWxlKSAmJiBwYXRoLmJhc2VuYW1lKGZpbGUuZmlsZVBhdGgpLnRvTG93ZXJDYXNlKCkgPT09IE1PRF9DT05GSUcpIHtcbiAgICAgIGFjY3VtLmNvbmZpZ3MucHVzaChmaWxlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgYWNjdW0ucmVndWxhcnMucHVzaChmaWxlKTtcbiAgICB9XG4gICAgcmV0dXJuIGFjY3VtO1xuICB9LCB7IGNvbmZpZ3M6IFtdIGFzIElGaWxlRW50cnlbXSwgcmVndWxhcnM6IFtdIGFzIElGaWxlRW50cnlbXSB9KTtcbiAgcmV0dXJuIFByb21pc2UuYWxsKFtcbiAgICBhZGRDb25maWdGaWxlcyhhcGksIHByb2ZpbGVJZCwgcmVzdWx0LmNvbmZpZ3MpLFxuICAgIGFkZFJlZ3VsYXJGaWxlcyhhcGksIHByb2ZpbGVJZCwgcmVzdWx0LnJlZ3VsYXJzKVxuICBdKTtcbn1cblxuZnVuY3Rpb24gZXh0cmFjdENvbmZpZ01vZEF0dHJpYnV0ZXMoc3RhdGU6IHR5cGVzLklTdGF0ZSwgY29uZmlnTW9kSWQ6IHN0cmluZyk6IGFueSB7XG4gIHJldHVybiB1dGlsLmdldFNhZmUoc3RhdGUsIFsncGVyc2lzdGVudCcsICdtb2RzJywgR0FNRV9JRCwgY29uZmlnTW9kSWQsICdhdHRyaWJ1dGVzJywgJ2NvbmZpZ01vZCddLCBbXSk7XG59XG5cbmZ1bmN0aW9uIHNldENvbmZpZ01vZEF0dHJpYnV0ZShhcGk6IHR5cGVzLklFeHRlbnNpb25BcGksIGNvbmZpZ01vZElkOiBzdHJpbmcsIGF0dHJpYnV0ZXM6IHN0cmluZ1tdKSB7XG4gIGFwaS5zdG9yZS5kaXNwYXRjaChhY3Rpb25zLnNldE1vZEF0dHJpYnV0ZShHQU1FX0lELCBjb25maWdNb2RJZCwgJ2NvbmZpZ01vZCcsIGF0dHJpYnV0ZXMpKTtcbn1cblxuZnVuY3Rpb24gcmVtb3ZlQ29uZmlnTW9kQXR0cmlidXRlcyhhcGk6IHR5cGVzLklFeHRlbnNpb25BcGksIGNvbmZpZ01vZDogdHlwZXMuSU1vZCwgYXR0cmlidXRlczogc3RyaW5nW10pIHtcbiAgY29uc3QgZXhpc3RpbmcgPSBleHRyYWN0Q29uZmlnTW9kQXR0cmlidXRlcyhhcGkuZ2V0U3RhdGUoKSwgY29uZmlnTW9kLmlkKTtcbiAgY29uc3QgbmV3QXR0cmlidXRlcyA9IGV4aXN0aW5nLmZpbHRlcihhdHRyID0+ICFhdHRyaWJ1dGVzLmluY2x1ZGVzKGF0dHIpKTtcbiAgc2V0Q29uZmlnTW9kQXR0cmlidXRlKGFwaSwgY29uZmlnTW9kLmlkLCBuZXdBdHRyaWJ1dGVzKTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gYWRkQ29uZmlnRmlsZXMoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpLCBwcm9maWxlSWQ6IHN0cmluZywgZmlsZXM6IElGaWxlRW50cnlbXSkge1xuICBpZiAoZmlsZXMubGVuZ3RoID09PSAwKSB7XG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xuICB9XG4gIGFwaS5zZW5kTm90aWZpY2F0aW9uKHtcbiAgICB0eXBlOiAnYWN0aXZpdHknLFxuICAgIGlkOiBOT1RJRl9BQ1RJVklUWV9DT05GSUdfTU9ELFxuICAgIHRpdGxlOiAnSW1wb3J0aW5nIGNvbmZpZyBmaWxlcy4uLicsXG4gICAgbWVzc2FnZTogJ1N0YXJ0aW5nIHVwLi4uJ1xuICB9KTtcblxuICByZXR1cm4gYWRkTW9kQ29uZmlnKGFwaSwgZmlsZXMsIHVuZGVmaW5lZCk7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGFkZFJlZ3VsYXJGaWxlcyhhcGk6IHR5cGVzLklFeHRlbnNpb25BcGksIHByb2ZpbGVJZDogc3RyaW5nLCBmaWxlczogSUZpbGVFbnRyeVtdKSB7XG4gIGlmIChmaWxlcy5sZW5ndGggPT09IDApIHtcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG4gIH1cbiAgY29uc3Qgc3RhdGUgPSBhcGkuZ2V0U3RhdGUoKTtcbiAgY29uc3QgZ2FtZSA9IHV0aWwuZ2V0R2FtZShHQU1FX0lEKTtcbiAgY29uc3QgZGlzY292ZXJ5ID0gc2VsZWN0b3JzLmRpc2NvdmVyeUJ5R2FtZShzdGF0ZSwgR0FNRV9JRCk7XG4gIGNvbnN0IG1vZFBhdGhzID0gZ2FtZS5nZXRNb2RQYXRocyhkaXNjb3ZlcnkucGF0aCk7XG4gIGNvbnN0IGluc3RhbGxQYXRoID0gc2VsZWN0b3JzLmluc3RhbGxQYXRoRm9yR2FtZShzdGF0ZSwgR0FNRV9JRCk7XG4gIGZvciAoY29uc3QgZW50cnkgb2YgZmlsZXMpIHtcbiAgICBpZiAoZW50cnkuY2FuZGlkYXRlcy5sZW5ndGggPT09IDEpIHtcbiAgICAgIGNvbnN0IG1vZCA9IHV0aWwuZ2V0U2FmZShzdGF0ZS5wZXJzaXN0ZW50Lm1vZHMsXG4gICAgICAgIFtHQU1FX0lELCBlbnRyeS5jYW5kaWRhdGVzWzBdXSxcbiAgICAgICAgdW5kZWZpbmVkKTtcbiAgICAgIGlmICghaXNNb2RDYW5kaWRhdGVWYWxpZChtb2QsIGVudHJ5KSkge1xuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG4gICAgICB9XG4gICAgICBjb25zdCBmcm9tID0gbW9kUGF0aHNbbW9kLnR5cGUgPz8gJyddO1xuICAgICAgaWYgKGZyb20gPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAvLyBIb3cgaXMgdGhpcyBldmVuIHBvc3NpYmxlPyByZWdhcmRsZXNzIGl0J3Mgbm90IHRoaXNcbiAgICAgICAgLy8gIGZ1bmN0aW9uJ3Mgam9iIHRvIHJlcG9ydCB0aGlzLlxuICAgICAgICBsb2coJ2Vycm9yJywgJ2ZhaWxlZCB0byByZXNvbHZlIG1vZCBwYXRoIGZvciBtb2QgdHlwZScsIG1vZC50eXBlKTtcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xuICAgICAgfVxuICAgICAgY29uc3QgcmVsUGF0aCA9IHBhdGgucmVsYXRpdmUoZnJvbSwgZW50cnkuZmlsZVBhdGgpO1xuICAgICAgY29uc3QgdGFyZ2V0UGF0aCA9IHBhdGguam9pbihpbnN0YWxsUGF0aCwgbW9kLmlkLCByZWxQYXRoKTtcbiAgICAgIC8vIGNvcHkgdGhlIG5ldyBmaWxlIGJhY2sgaW50byB0aGUgY29ycmVzcG9uZGluZyBtb2QsIHRoZW4gZGVsZXRlIGl0LiBUaGF0IHdheSwgdm9ydGV4IHdpbGxcbiAgICAgIC8vIGNyZWF0ZSBhIGxpbmsgdG8gaXQgd2l0aCB0aGUgY29ycmVjdCBkZXBsb3ltZW50IG1ldGhvZCBhbmQgbm90IGFzayB0aGUgdXNlciBhbnkgcXVlc3Rpb25zXG4gICAgICB0cnkge1xuICAgICAgICBhd2FpdCBmcy5lbnN1cmVEaXJXcml0YWJsZUFzeW5jKHBhdGguZGlybmFtZSh0YXJnZXRQYXRoKSk7XG4gICAgICAgIGF3YWl0IGZzLmNvcHlBc3luYyhlbnRyeS5maWxlUGF0aCwgdGFyZ2V0UGF0aCk7XG4gICAgICAgIGF3YWl0IGZzLnJlbW92ZUFzeW5jKGVudHJ5LmZpbGVQYXRoKTtcbiAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICBpZiAoIWVyci5tZXNzYWdlLmluY2x1ZGVzKCdhcmUgdGhlIHNhbWUgZmlsZScpKSB7XG4gICAgICAgICAgLy8gc2hvdWxkIHdlIGJlIHJlcG9ydGluZyB0aGlzIHRvIHRoZSB1c2VyPyBUaGlzIGlzIGEgY29tcGxldGVseVxuICAgICAgICAgIC8vIGF1dG9tYXRlZCBwcm9jZXNzIGFuZCBpZiBpdCBmYWlscyBtb3JlIG9mdGVuIHRoYW4gbm90IHRoZVxuICAgICAgICAgIC8vIHVzZXIgcHJvYmFibHkgZG9lc24ndCBjYXJlXG4gICAgICAgICAgbG9nKCdlcnJvcicsICdmYWlsZWQgdG8gcmUtaW1wb3J0IGFkZGVkIGZpbGUgdG8gbW9kJywgZXJyLm1lc3NhZ2UpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbmNvbnN0IGlzTW9kQ2FuZGlkYXRlVmFsaWQgPSAobW9kLCBlbnRyeSkgPT4ge1xuICBpZiAobW9kPy5pZCA9PT0gdW5kZWZpbmVkIHx8IG1vZC50eXBlID09PSAnc2R2cm9vdGZvbGRlcicpIHtcbiAgICAvLyBUaGVyZSBpcyBubyByZWxpYWJsZSB3YXkgdG8gYXNjZXJ0YWluIHdoZXRoZXIgYSBuZXcgZmlsZSBlbnRyeVxuICAgIC8vICBhY3R1YWxseSBiZWxvbmdzIHRvIGEgcm9vdCBtb2RUeXBlIGFzIHNvbWUgb2YgdGhlc2UgbW9kcyB3aWxsIGFjdFxuICAgIC8vICBhcyByZXBsYWNlbWVudCBtb2RzLiBUaGlzIG9idmlvdXNseSBtZWFucyB0aGF0IGlmIHRoZSBnYW1lIGhhc1xuICAgIC8vICBhIHN1YnN0YW50aWFsIHVwZGF0ZSB3aGljaCBpbnRyb2R1Y2VzIG5ldyBmaWxlcyB3ZSBjb3VsZCBwb3RlbnRpYWxseVxuICAgIC8vICBhZGQgYSB2YW5pbGxhIGdhbWUgZmlsZSBpbnRvIHRoZSBtb2QncyBzdGFnaW5nIGZvbGRlciBjYXVzaW5nIGNvbnN0YW50XG4gICAgLy8gIGNvbnRlbnRpb24gYmV0d2VlbiB0aGUgZ2FtZSBpdHNlbGYgKHdoZW4gaXQgdXBkYXRlcykgYW5kIHRoZSBtb2QuXG4gICAgLy9cbiAgICAvLyBUaGVyZSBpcyBhbHNvIGEgcG90ZW50aWFsIGNoYW5jZSBmb3Igcm9vdCBtb2RUeXBlcyB0byBjb25mbGljdCB3aXRoIHJlZ3VsYXJcbiAgICAvLyAgbW9kcywgd2hpY2ggaXMgd2h5IGl0J3Mgbm90IHNhZmUgdG8gYXNzdW1lIHRoYXQgYW55IGFkZGl0aW9uIGluc2lkZSB0aGVcbiAgICAvLyAgbW9kcyBkaXJlY3RvcnkgY2FuIGJlIHNhZmVseSBhZGRlZCB0byB0aGlzIG1vZCdzIHN0YWdpbmcgZm9sZGVyIGVpdGhlci5cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBpZiAobW9kLnR5cGUgIT09ICdTTUFQSScpIHtcbiAgICAvLyBPdGhlciBtb2QgdHlwZXMgZG8gbm90IHJlcXVpcmUgZnVydGhlciB2YWxpZGF0aW9uIC0gaXQgc2hvdWxkIGJlIGZpbmVcbiAgICAvLyAgdG8gYWRkIHRoaXMgZW50cnkuXG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICBjb25zdCBzZWdtZW50cyA9IGVudHJ5LmZpbGVQYXRoLnRvTG93ZXJDYXNlKCkuc3BsaXQocGF0aC5zZXApLmZpbHRlcihzZWcgPT4gISFzZWcpO1xuICBjb25zdCBtb2RzU2VnSWR4ID0gc2VnbWVudHMuaW5kZXhPZignbW9kcycpO1xuICBjb25zdCBtb2RGb2xkZXJOYW1lID0gKChtb2RzU2VnSWR4ICE9PSAtMSkgJiYgKHNlZ21lbnRzLmxlbmd0aCA+IG1vZHNTZWdJZHggKyAxKSlcbiAgICA/IHNlZ21lbnRzW21vZHNTZWdJZHggKyAxXSA6IHVuZGVmaW5lZDtcblxuICBsZXQgYnVuZGxlZE1vZHMgPSB1dGlsLmdldFNhZmUobW9kLCBbJ2F0dHJpYnV0ZXMnLCAnc21hcGlCdW5kbGVkTW9kcyddLCBbXSk7XG4gIGJ1bmRsZWRNb2RzID0gYnVuZGxlZE1vZHMubGVuZ3RoID4gMCA/IGJ1bmRsZWRNb2RzIDogZ2V0QnVuZGxlZE1vZHMoKTtcbiAgaWYgKHNlZ21lbnRzLmluY2x1ZGVzKCdjb250ZW50JykpIHtcbiAgICAvLyBTTUFQSSBpcyBub3Qgc3VwcG9zZWQgdG8gb3ZlcndyaXRlIHRoZSBnYW1lJ3MgY29udGVudCBkaXJlY3RseS5cbiAgICAvLyAgdGhpcyBpcyBjbGVhcmx5IG5vdCBhIFNNQVBJIGZpbGUgYW5kIHNob3VsZCBfbm90XyBiZSBhZGRlZCB0byBpdC5cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICByZXR1cm4gKG1vZEZvbGRlck5hbWUgIT09IHVuZGVmaW5lZCkgJiYgYnVuZGxlZE1vZHMuaW5jbHVkZXMobW9kRm9sZGVyTmFtZSk7XG59OyJdfQ==