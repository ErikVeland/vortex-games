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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
const bluebird_1 = __importDefault(require("bluebird"));
const path = __importStar(require("path"));
const vortex_api_1 = require("vortex-api");
const common_1 = require("./common");
const gitHubDownloader = __importStar(require("./githubDownloader"));
const Settings_1 = __importDefault(require("./Settings"));
const reducers_1 = __importDefault(require("./reducers"));
const migrations_1 = require("./migrations");
const util_1 = require("./util");
const modTypes_1 = require("./modTypes");
const loadOrder_1 = require("./loadOrder");
const cache_1 = __importDefault(require("./cache"));
const STOP_PATTERNS = ['[^/]*\\.pak$'];
const GOG_ID = '1456460669';
const STEAM_ID = '1086940';
function toWordExp(input) {
    return '(^|/)' + input + '(/|$)';
}
function findGame() {
    return vortex_api_1.util.GameStoreHelper.findByAppId([GOG_ID, STEAM_ID])
        .then((game) => __awaiter(this, void 0, void 0, function* () {
        const basePath = game.gamePath;
        if (process.platform === 'darwin') {
            const macOSDir = path.join(basePath, "Baldur's Gate 3.app", 'Contents', 'MacOS');
            try {
                yield vortex_api_1.fs.statAsync(macOSDir);
                return macOSDir;
            }
            catch (err) {
            }
        }
        return basePath;
    }));
}
function ensureGlobalProfile(api, discovery) {
    return __awaiter(this, void 0, void 0, function* () {
        if (discovery === null || discovery === void 0 ? void 0 : discovery.path) {
            const profilePath = yield (0, util_1.globalProfilePath)(api);
            try {
                yield vortex_api_1.fs.ensureDirWritableAsync(profilePath);
                const modSettingsFilePath = path.join(profilePath, 'modsettings.lsx');
                try {
                    yield vortex_api_1.fs.statAsync(modSettingsFilePath);
                }
                catch (err) {
                    const defaultModSettings = yield (0, util_1.getDefaultModSettings)(api);
                    yield vortex_api_1.fs.writeFileAsync(modSettingsFilePath, defaultModSettings, { encoding: 'utf8' });
                }
            }
            catch (err) {
                return Promise.reject(err);
            }
        }
    });
}
function prepareForModding(api, discovery) {
    return __awaiter(this, void 0, void 0, function* () {
        const mp = (0, util_1.modsPath)();
        const format = yield (0, util_1.getDefaultModSettingsFormat)(api);
        if (!['v7', 'v8'].includes(format)) {
            showFullReleaseModFixerRecommendation(api);
        }
        return vortex_api_1.fs.statAsync(mp)
            .catch(() => vortex_api_1.fs.ensureDirWritableAsync(mp, () => bluebird_1.default.resolve()))
            .finally(() => ensureGlobalProfile(api, discovery));
    });
}
function showFullReleaseModFixerRecommendation(api) {
    var _a, _b;
    const mods = (_b = (_a = api.store.getState().persistent) === null || _a === void 0 ? void 0 : _a.mods) === null || _b === void 0 ? void 0 : _b.baldursgate3;
    if (mods !== undefined) {
        const modArray = mods ? Object.values(mods) : [];
        (0, util_1.logDebug)('modArray', modArray);
        const modFixerInstalled = modArray.filter(mod => { var _a; return !!((_a = mod === null || mod === void 0 ? void 0 : mod.attributes) === null || _a === void 0 ? void 0 : _a.modFixer); }).length != 0;
        (0, util_1.logDebug)('modFixerInstalled', modFixerInstalled);
        if (modFixerInstalled) {
            return;
        }
    }
    api.sendNotification({
        type: 'warning',
        title: 'Recommended Mod',
        message: 'Most mods require this mod.',
        id: 'bg3-recommended-mod',
        allowSuppress: true,
        actions: [
            {
                title: 'More', action: dismiss => {
                    api.showDialog('question', 'Recommended Mods', {
                        text: 'We recommend installing "Baldur\'s Gate 3 Mod Fixer" to be able to mod Baldur\'s Gate 3.\n\n' +
                            'This can be downloaded from Nexus Mods and installed using Vortex by pressing "Open Nexus Mods'
                    }, [
                        { label: 'Dismiss' },
                        { label: 'Open Nexus Mods', default: true },
                    ])
                        .then(result => {
                        dismiss();
                        if (result.action === 'Open Nexus Mods') {
                            vortex_api_1.util.opn('https://www.nexusmods.com/baldursgate3/mods/141?tab=description').catch(() => null);
                        }
                        else if (result.action === 'Cancel') {
                        }
                        return Promise.resolve();
                    });
                }
            }
        ],
    });
}
function onCheckModVersion(api, gameId, mods) {
    return __awaiter(this, void 0, void 0, function* () {
        const profile = vortex_api_1.selectors.activeProfile(api.getState());
        if (profile.gameId !== common_1.GAME_ID || gameId !== common_1.GAME_ID) {
            return;
        }
        const latestVer = (0, util_1.getLatestInstalledLSLibVer)(api);
        if (latestVer === '0.0.0') {
            return;
        }
        const newestVer = yield gitHubDownloader.checkForUpdates(api, latestVer);
        if (!newestVer || newestVer === latestVer) {
            return;
        }
    });
}
function onGameModeActivated(api, gameId) {
    return __awaiter(this, void 0, void 0, function* () {
        if (gameId !== common_1.GAME_ID) {
            cache_1.default.getInstance(api).save();
            return;
        }
        try {
            yield (0, migrations_1.migrate)(api);
            const bg3ProfileId = yield (0, util_1.getActivePlayerProfile)(api);
            const gameSettingsPath = path.join((0, util_1.profilesPath)(), bg3ProfileId, 'modsettings.lsx');
            let nodes = yield (0, loadOrder_1.getNodes)(gameSettingsPath);
            const { modsNode, modsOrderNode } = nodes;
            if ((modsNode.children === undefined) || (modsNode.children[0] === '')) {
                modsNode.children = [{ node: [] }];
            }
            const format = yield (0, util_1.getDefaultModSettingsFormat)(api);
            if (modsOrderNode === undefined && ['v7', 'v8'].includes(format)) {
                const convFunc = format === 'v7' ? util_1.convertV6toV7 : util_1.convertToV8;
                const data = yield vortex_api_1.fs.readFileAsync(gameSettingsPath, { encoding: 'utf8' });
                const newData = yield convFunc(data);
                yield vortex_api_1.fs.removeAsync(gameSettingsPath).catch(err => Promise.resolve());
                yield vortex_api_1.fs.writeFileAsync(gameSettingsPath, newData, { encoding: 'utf8' });
            }
        }
        catch (err) {
            api.showErrorNotification('Failed to migrate', err, {
                allowReport: false,
            });
        }
        try {
            yield (0, util_1.readStoredLO)(api);
            cache_1.default.getInstance(api);
        }
        catch (err) {
            api.showErrorNotification('Failed to read load order', err, {
                message: 'Please run the game before you start modding',
                allowReport: false,
            });
        }
        const latestVer = (0, util_1.getLatestInstalledLSLibVer)(api);
        if (latestVer === '0.0.0') {
            yield gitHubDownloader.downloadDivine(api);
        }
    });
}
function main(context) {
    context.registerReducer(['settings', 'baldursgate3'], reducers_1.default);
    context.registerGame({
        id: common_1.GAME_ID,
        name: 'Baldur\'s Gate 3',
        mergeMods: true,
        queryPath: findGame,
        supportedTools: process.platform === 'darwin' ? [] : [
            {
                id: 'exevulkan',
                name: 'Baldur\'s Gate 3 (Vulkan)',
                executable: () => 'bin/bg3.exe',
                requiredFiles: [
                    'bin/bg3.exe',
                ],
                relative: true,
            },
        ],
        queryModPath: util_1.modsPath,
        logo: 'gameart.jpg',
        executable: () => (process.platform === 'darwin' ? 'Baldurs Gate 3' : 'bin/bg3_dx11.exe'),
        setup: discovery => prepareForModding(context.api, discovery),
        requiredFiles: process.platform === 'darwin'
            ? [
                'Baldurs Gate 3',
            ]
            : [
                'bin/bg3_dx11.exe',
            ],
        environment: {
            SteamAPPId: STEAM_ID,
        },
        details: {
            stopPatterns: STOP_PATTERNS.map(toWordExp),
            supportedTools: [
                {
                    id: 'exe',
                    name: 'Baldur\'s Gate 3 (DX11)',
                    executable: 'bin/bg3_dx11.exe',
                },
                {
                    id: 'exevulkan',
                    name: 'Baldur\'s Gate 3 (Vulkan)',
                    executable: 'bin/bg3.exe',
                },
            ],
            gameDataPath: (0, util_1.getGameDataPath)(context.api),
            supportedModTypes: [common_1.MOD_TYPE_LSLIB, common_1.MOD_TYPE_LOOSE, common_1.MOD_TYPE_BG3SE, common_1.MOD_TYPE_REPLACER],
            autoDeploy: true,
            ignoreConflicts: common_1.IGNORE_PATTERNS,
            showWrongGameWarning: true,
            shell: false,
        },
    });
    context.registerSettings('Mods', Settings_1.default);
    context.registerModType(common_1.MOD_TYPE_LOOSE, 200, (gameId) => gameId === common_1.GAME_ID, (_game) => (0, util_1.modsPath)(), (instructions) => bluebird_1.default.resolve((0, modTypes_1.isLoose)(instructions)));
    context.registerModType(common_1.MOD_TYPE_REPLACER, 100, (gameId) => gameId === common_1.GAME_ID, (_game) => (0, util_1.getGamePath)(context.api), (instructions) => bluebird_1.default.resolve((0, modTypes_1.isReplacer)(context.api, instructions)));
    context.registerModType(common_1.MOD_TYPE_LSLIB, 99, (gameId) => gameId === common_1.GAME_ID, (_game) => (0, util_1.getGamePath)(context.api), (instructions) => bluebird_1.default.resolve((0, modTypes_1.isLSLib)(instructions)));
    context.registerModType(common_1.MOD_TYPE_BG3SE, 100, (gameId) => gameId === common_1.GAME_ID, (_game) => path.join((0, util_1.getGamePath)(context.api), 'bin'), (instructions) => bluebird_1.default.resolve((0, modTypes_1.isBG3SE)(instructions)));
    context.registerAction('mods-action-icons', 999, 'update', {}, 'Check Mod Versions', (instanceIds) => {
        void onCheckModVersion(context.api, vortex_api_1.selectors.activeGameId(context.api.getState()), []);
    });
    context.once(() => {
        context.api.onAsync('did-deploy', (profileId, profileType, deployment) => {
            (0, util_1.forceRefresh)(context.api);
            return bluebird_1.default.resolve();
        });
    });
}
exports.default = main;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50c3giXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQVdBLHdEQUFnQztBQUVoQywyQ0FBNkI7QUFFN0IsMkNBQXdEO0FBRXhELHFDQUVrQjtBQUNsQixxRUFBdUQ7QUFDdkQsMERBQWtDO0FBQ2xDLDBEQUFpQztBQUNqQyw2Q0FBdUM7QUFFdkMsaUNBVWdCO0FBUWhCLHlDQUVvQjtBQUVwQiwyQ0FJcUI7QUFHckIsb0RBQW1DO0FBRW5DLE1BQU0sYUFBYSxHQUFHLENBQUMsY0FBYyxDQUFDLENBQUM7QUFFdkMsTUFBTSxNQUFNLEdBQUcsWUFBWSxDQUFDO0FBQzVCLE1BQU0sUUFBUSxHQUFHLFNBQVMsQ0FBQztBQUUzQixTQUFTLFNBQVMsQ0FBQyxLQUFLO0lBQ3RCLE9BQU8sT0FBTyxHQUFHLEtBQUssR0FBRyxPQUFPLENBQUM7QUFDbkMsQ0FBQztBQUVELFNBQVMsUUFBUTtJQUNmLE9BQU8saUJBQUksQ0FBQyxlQUFlLENBQUMsV0FBVyxDQUFDLENBQUMsTUFBTSxFQUFFLFFBQVEsQ0FBQyxDQUFDO1NBQ3hELElBQUksQ0FBQyxDQUFNLElBQUksRUFBQyxFQUFFO1FBQ2pCLE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUM7UUFDL0IsSUFBSSxPQUFPLENBQUMsUUFBUSxLQUFLLFFBQVEsRUFBRTtZQUNqQyxNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxxQkFBcUIsRUFBRSxVQUFVLEVBQUUsT0FBTyxDQUFDLENBQUM7WUFDakYsSUFBSTtnQkFDRixNQUFNLGVBQUUsQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDLENBQUM7Z0JBQzdCLE9BQU8sUUFBUSxDQUFDO2FBQ2pCO1lBQUMsT0FBTyxHQUFHLEVBQUU7YUFFYjtTQUNGO1FBQ0QsT0FBTyxRQUFRLENBQUM7SUFDbEIs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QUFDLENBQUM7SUFDNUYsQ0FBQyxDQUFDLENBQUM7SUFFSCxPQUFPLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRTtRQUNoQixPQUFPLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxZQUFZLEVBQUUsQ0FBQyxTQUFTLEVBQUUsV0FBVyxFQUFFLFVBQVUsRUFBRSxFQUFFO1lBQ3ZFLElBQUEsbUJBQVksRUFBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDMUIsT0FBTyxrQkFBUSxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQzVCLENBQUMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQyxDQUFDLENBQUM7QUFFTCxDQUFDO0FBRUQsa0JBQWUsSUFBSSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgaXNXaW5kb3dzIH0gZnJvbSAnLi4vLi4vLi4vc3JjL3V0aWwvcGxhdGZvcm0nO1xuLyogZXNsaW50LWRpc2FibGUgKi9cbi8qKlxuICogSW1wb3J0YW50IC0gYWx0aG91Z2ggd2Ugbm8gbG9uZ2VyIGRlZmluZSB0aGUgaW5mbyBwYW5lbCBoZXJlLFxuICogIHdlIHN0aWxsIG5lZWQgdG8ga2VlcCB0aGUgaW5kZXggZmlsZSdzICcudHN4JyBleHRlbnNpb24uXG4gKiAgQXQgbGVhc3Qgd2hpbGUgb3VyIHVwZGF0ZSBwcm9jZXNzIGZvciBidW5kbGVkIHBsdWdpbnMgcmVtYWluc1xuICogIHRocm91Z2ggdGhlICdyZWxlYXNlJyBicmFuY2guXG4gKiBcbiAqIFJlbW92aW5nIGZpbGVzIGZyb20gYnVuZGxlZCBwbHVnaW5zIHdpdGhvdXQgc3R1YmJpbmcgdGhlIGV4dGVuc2lvblxuICogIGNhbiBwb3RlbnRpYWxseSBicmVhayB0aGUgZXh0ZW5zaW9uIG9uIHRoZSB1c2VyJ3MgZW5kLlxuICovXG5pbXBvcnQgQmx1ZWJpcmQgZnJvbSAnYmx1ZWJpcmQnO1xuaW1wb3J0ICogYXMgXyBmcm9tICdsb2Rhc2gnO1xuaW1wb3J0ICogYXMgcGF0aCBmcm9tICdwYXRoJztcbmltcG9ydCAqIGFzIFJlYWN0IGZyb20gJ3JlYWN0JztcbmltcG9ydCB7IGZzLCBzZWxlY3RvcnMsIHR5cGVzLCB1dGlsIH0gZnJvbSAndm9ydGV4LWFwaSc7XG5cbmltcG9ydCB7IEdBTUVfSUQsIElHTk9SRV9QQVRURVJOUyxcbiAgTU9EX1RZUEVfQkczU0UsIE1PRF9UWVBFX0xPT1NFLCBNT0RfVFlQRV9MU0xJQiwgTU9EX1RZUEVfUkVQTEFDRVIsXG59IGZyb20gJy4vY29tbW9uJztcbmltcG9ydCAqIGFzIGdpdEh1YkRvd25sb2FkZXIgZnJvbSAnLi9naXRodWJEb3dubG9hZGVyJztcbmltcG9ydCBTZXR0aW5ncyBmcm9tICcuL1NldHRpbmdzJztcbmltcG9ydCByZWR1Y2VyIGZyb20gJy4vcmVkdWNlcnMnO1xuaW1wb3J0IHsgbWlncmF0ZSB9IGZyb20gJy4vbWlncmF0aW9ucyc7XG5cbmltcG9ydCB7XG4gIGxvZ0RlYnVnLCBmb3JjZVJlZnJlc2gsIGdldExhdGVzdEluc3RhbGxlZExTTGliVmVyLFxuICBnZXRHYW1lRGF0YVBhdGgsIGdldEdhbWVQYXRoLCBnbG9iYWxQcm9maWxlUGF0aCwgbW9kc1BhdGgsXG4gIGdldExhdGVzdExTTGliTW9kLCBnZXRPd25HYW1lVmVyc2lvbiwgcmVhZFN0b3JlZExPLFxuICBnZXREZWZhdWx0TW9kU2V0dGluZ3MsXG4gIGdldERlZmF1bHRNb2RTZXR0aW5nc0Zvcm1hdCxcbiAgZ2V0QWN0aXZlUGxheWVyUHJvZmlsZSxcbiAgcHJvZmlsZXNQYXRoLFxuICBjb252ZXJ0VjZ0b1Y3LFxuICBjb252ZXJ0VG9WOCxcbn0gZnJvbSAnLi91dGlsJztcblxuLy8gUmVtb3ZlZCBpbmNvcnJlY3QgaW5zdGFsbGVycyBpbXBvcnRcbi8vIGltcG9ydCB7XG4vLyAgIHRlc3RMU0xpYiwgdGVzdEJHM1NFLCB0ZXN0RW5naW5lSW5qZWN0b3IsIHRlc3RNb2RGaXhlciwgdGVzdFJlcGxhY2VyLFxuLy8gICBpbnN0YWxsTFNMaWIsIGluc3RhbGxCRzNTRSwgaW5zdGFsbEVuZ2luZUluamVjdG9yLCBpbnN0YWxsTW9kRml4ZXIsIGluc3RhbGxSZXBsYWNlcixcbi8vIH0gZnJvbSAnLi9pbnN0YWxsZXJzJztcblxuaW1wb3J0IHtcbiAgaXNCRzNTRSwgaXNMU0xpYiwgaXNMb29zZSwgaXNSZXBsYWNlcixcbn0gZnJvbSAnLi9tb2RUeXBlcyc7XG5cbmltcG9ydCB7XG4gIGRlc2VyaWFsaXplLCBpbXBvcnRNb2RTZXR0aW5nc0ZpbGUsIGltcG9ydE1vZFNldHRpbmdzR2FtZSxcbiAgaW1wb3J0RnJvbUJHM01NLCBzZXJpYWxpemUsIGV4cG9ydFRvR2FtZSwgZXhwb3J0VG9GaWxlLCB2YWxpZGF0ZSxcbiAgZ2V0Tm9kZXMsXG59IGZyb20gJy4vbG9hZE9yZGVyJztcblxuaW1wb3J0IHsgSW5mb1BhbmVsV3JhcCB9IGZyb20gJy4vSW5mb1BhbmVsJ1xuaW1wb3J0IFBha0luZm9DYWNoZSBmcm9tICcuL2NhY2hlJztcblxuY29uc3QgU1RPUF9QQVRURVJOUyA9IFsnW14vXSpcXFxcLnBhayQnXTtcblxuY29uc3QgR09HX0lEID0gJzE0NTY0NjA2NjknO1xuY29uc3QgU1RFQU1fSUQgPSAnMTA4Njk0MCc7XG5cbmZ1bmN0aW9uIHRvV29yZEV4cChpbnB1dCkge1xuICByZXR1cm4gJyhefC8pJyArIGlucHV0ICsgJygvfCQpJztcbn1cblxuZnVuY3Rpb24gZmluZEdhbWUoKTogYW55IHtcbiAgcmV0dXJuIHV0aWwuR2FtZVN0b3JlSGVscGVyLmZpbmRCeUFwcElkKFtHT0dfSUQsIFNURUFNX0lEXSlcbiAgICAudGhlbihhc3luYyBnYW1lID0+IHtcbiAgICAgIGNvbnN0IGJhc2VQYXRoID0gZ2FtZS5nYW1lUGF0aDtcbiAgICAgIGlmIChwcm9jZXNzLnBsYXRmb3JtID09PSAnZGFyd2luJykge1xuICAgICAgICBjb25zdCBtYWNPU0RpciA9IHBhdGguam9pbihiYXNlUGF0aCwgXCJCYWxkdXIncyBHYXRlIDMuYXBwXCIsICdDb250ZW50cycsICdNYWNPUycpO1xuICAgICAgICB0cnkge1xuICAgICAgICAgIGF3YWl0IGZzLnN0YXRBc3luYyhtYWNPU0Rpcik7XG4gICAgICAgICAgcmV0dXJuIG1hY09TRGlyO1xuICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAvLyBmYWxsIGJhY2sgdG8gdGhlIHN0b3JlLXByb3ZpZGVkIHBhdGhcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIGJhc2VQYXRoO1xuICAgIH0pO1xufVxuXG5hc3luYyBmdW5jdGlvbiBlbnN1cmVHbG9iYWxQcm9maWxlKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSwgZGlzY292ZXJ5OiB0eXBlcy5JRGlzY292ZXJ5UmVzdWx0KSB7XG4gIGlmIChkaXNjb3Zlcnk/LnBhdGgpIHtcbiAgICBjb25zdCBwcm9maWxlUGF0aCA9IGF3YWl0IGdsb2JhbFByb2ZpbGVQYXRoKGFwaSk7XG4gICAgdHJ5IHtcbiAgICAgIGF3YWl0IGZzLmVuc3VyZURpcldyaXRhYmxlQXN5bmMocHJvZmlsZVBhdGgpO1xuICAgICAgY29uc3QgbW9kU2V0dGluZ3NGaWxlUGF0aCA9IHBhdGguam9pbihwcm9maWxlUGF0aCwgJ21vZHNldHRpbmdzLmxzeCcpO1xuICAgICAgdHJ5IHtcbiAgICAgICAgYXdhaXQgZnMuc3RhdEFzeW5jKG1vZFNldHRpbmdzRmlsZVBhdGgpO1xuICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgIGNvbnN0IGRlZmF1bHRNb2RTZXR0aW5ncyA9IGF3YWl0IGdldERlZmF1bHRNb2RTZXR0aW5ncyhhcGkpO1xuICAgICAgICBhd2FpdCBmcy53cml0ZUZpbGVBc3luYyhtb2RTZXR0aW5nc0ZpbGVQYXRoLCBkZWZhdWx0TW9kU2V0dGluZ3MsIHsgZW5jb2Rpbmc6ICd1dGY4JyB9KTtcbiAgICAgIH1cbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChlcnIpO1xuICAgIH1cbiAgfVxufVxuXG5hc3luYyBmdW5jdGlvbiBwcmVwYXJlRm9yTW9kZGluZyhhcGk6IHR5cGVzLklFeHRlbnNpb25BcGksIGRpc2NvdmVyeSkge1xuICBjb25zdCBtcCA9IG1vZHNQYXRoKCk7ICBcblxuICBjb25zdCBmb3JtYXQgPSBhd2FpdCBnZXREZWZhdWx0TW9kU2V0dGluZ3NGb3JtYXQoYXBpKTtcbiAgaWYgKCFbJ3Y3JywgJ3Y4J10uaW5jbHVkZXMoZm9ybWF0KSkge1xuICAgIHNob3dGdWxsUmVsZWFzZU1vZEZpeGVyUmVjb21tZW5kYXRpb24oYXBpKTtcbiAgfVxuICBcbiAgcmV0dXJuIGZzLnN0YXRBc3luYyhtcClcbiAgICAuY2F0Y2goKCkgPT4gZnMuZW5zdXJlRGlyV3JpdGFibGVBc3luYyhtcCwgKCkgPT4gQmx1ZWJpcmQucmVzb2x2ZSgpIGFzIGFueSkpXG4gICAgLmZpbmFsbHkoKCkgPT4gZW5zdXJlR2xvYmFsUHJvZmlsZShhcGksIGRpc2NvdmVyeSkpO1xufVxuXG5mdW5jdGlvbiBzaG93RnVsbFJlbGVhc2VNb2RGaXhlclJlY29tbWVuZGF0aW9uKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSkge1xuICAvLyBjaGVjayB0byBzZWUgaWYgbW9kIGlzIGluc3RhbGxlZCBmaXJzdD9cbiAgY29uc3QgbW9kcyA9IGFwaS5zdG9yZS5nZXRTdGF0ZSgpLnBlcnNpc3RlbnQ/Lm1vZHM/LmJhbGR1cnNnYXRlMztcbiAgaWYobW9kcyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgY29uc3QgbW9kQXJyYXk6IHR5cGVzLklNb2RbXSA9IG1vZHMgPyBPYmplY3QudmFsdWVzKG1vZHMpIDogW107XG4gICAgbG9nRGVidWcoJ21vZEFycmF5JywgbW9kQXJyYXkpO1xuICBcbiAgICBjb25zdCBtb2RGaXhlckluc3RhbGxlZDpib29sZWFuID0gIG1vZEFycmF5LmZpbHRlcihtb2QgPT4gISFtb2Q/LmF0dHJpYnV0ZXM/Lm1vZEZpeGVyKS5sZW5ndGggIT0gMDsgIFxuICAgIGxvZ0RlYnVnKCdtb2RGaXhlckluc3RhbGxlZCcsIG1vZEZpeGVySW5zdGFsbGVkKTtcblxuICAgIC8vIGlmIHdlJ3ZlIGZvdW5kIGFuIGluc3RhbGxlZCBtb2RmaXhlciwgdGhlbiBkb24ndCBib3RoZXIgc2hvd2luZyBub3RpZmljYXRpb24gXG4gICAgaWYobW9kRml4ZXJJbnN0YWxsZWQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gIH1cblxuICAvLyBubyBtb2RzIGZvdW5kXG4gIGFwaS5zZW5kTm90aWZpY2F0aW9uKHtcbiAgICB0eXBlOiAnd2FybmluZycsXG4gICAgdGl0bGU6ICdSZWNvbW1lbmRlZCBNb2QnLFxuICAgIG1lc3NhZ2U6ICdNb3N0IG1vZHMgcmVxdWlyZSB0aGlzIG1vZC4nLFxuICAgIGlkOiAnYmczLXJlY29tbWVuZGVkLW1vZCcsXG4gICAgYWxsb3dTdXBwcmVzczogdHJ1ZSxcbiAgICBhY3Rpb25zOiBbXG4gICAgICB7XG4gICAgICAgIHRpdGxlOiAnTW9yZScsIGFjdGlvbjogZGlzbWlzcyA9PiB7XG4gICAgICAgICAgYXBpLnNob3dEaWFsb2coJ3F1ZXN0aW9uJywgJ1JlY29tbWVuZGVkIE1vZHMnLCB7XG4gICAgICAgICAgICB0ZXh0OlxuICAgICAgICAgICAgICAnV2UgcmVjb21tZW5kIGluc3RhbGxpbmcgXCJCYWxkdXJcXCdzIEdhdGUgMyBNb2QgRml4ZXJcIiB0byBiZSBhYmxlIHRvIG1vZCBCYWxkdXJcXCdzIEdhdGUgMy5cXG5cXG4nICsgXG4gICAgICAgICAgICAgICdUaGlzIGNhbiBiZSBkb3dubG9hZGVkIGZyb20gTmV4dXMgTW9kcyBhbmQgaW5zdGFsbGVkIHVzaW5nIFZvcnRleCBieSBwcmVzc2luZyBcIk9wZW4gTmV4dXMgTW9kcydcbiAgICAgICAgICB9LCBbXG4gICAgICAgICAgICB7IGxhYmVsOiAnRGlzbWlzcycgfSxcbiAgICAgICAgICAgIHsgbGFiZWw6ICdPcGVuIE5leHVzIE1vZHMnLCBkZWZhdWx0OiB0cnVlIH0sXG4gICAgICAgICAgXSlcbiAgICAgICAgICAgIC50aGVuKHJlc3VsdCA9PiB7XG4gICAgICAgICAgICAgIGRpc21pc3MoKTtcbiAgICAgICAgICAgICAgaWYgKHJlc3VsdC5hY3Rpb24gPT09ICdPcGVuIE5leHVzIE1vZHMnKSB7XG4gICAgICAgICAgICAgICAgdXRpbC5vcG4oJ2h0dHBzOi8vd3d3Lm5leHVzbW9kcy5jb20vYmFsZHVyc2dhdGUzL21vZHMvMTQxP3RhYj1kZXNjcmlwdGlvbicpLmNhdGNoKCgpID0+IG51bGwpXG4gICAgICAgICAgICAgIH0gZWxzZSBpZiAocmVzdWx0LmFjdGlvbiA9PT0gJ0NhbmNlbCcpIHtcbiAgICAgICAgICAgICAgICAvLyBkaXNtaXNzIGFueXdheVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgXSxcbiAgfSk7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIG9uQ2hlY2tNb2RWZXJzaW9uKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSwgZ2FtZUlkOiBzdHJpbmcsIG1vZHM6IHR5cGVzLklNb2RbXSkge1xuICBjb25zdCBwcm9maWxlID0gc2VsZWN0b3JzLmFjdGl2ZVByb2ZpbGUoYXBpLmdldFN0YXRlKCkpO1xuICBpZiAocHJvZmlsZS5nYW1lSWQgIT09IEdBTUVfSUQgfHwgZ2FtZUlkICE9PSBHQU1FX0lEKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgY29uc3QgbGF0ZXN0VmVyOiBzdHJpbmcgPSBnZXRMYXRlc3RJbnN0YWxsZWRMU0xpYlZlcihhcGkpO1xuXG4gIGlmIChsYXRlc3RWZXIgPT09ICcwLjAuMCcpIHtcbiAgICAvLyBOb3RoaW5nIHRvIHVwZGF0ZS5cbiAgICByZXR1cm47XG4gIH1cblxuICBjb25zdCBuZXdlc3RWZXI6IHN0cmluZyA9IGF3YWl0IGdpdEh1YkRvd25sb2FkZXIuY2hlY2tGb3JVcGRhdGVzKGFwaSwgbGF0ZXN0VmVyKTtcbiAgaWYgKCFuZXdlc3RWZXIgfHwgbmV3ZXN0VmVyID09PSBsYXRlc3RWZXIpIHtcbiAgICByZXR1cm47XG4gIH1cbn1cblxuYXN5bmMgZnVuY3Rpb24gb25HYW1lTW9kZUFjdGl2YXRlZChhcGk6IHR5cGVzLklFeHRlbnNpb25BcGksIGdhbWVJZDogc3RyaW5nKSB7XG4gIGlmIChnYW1lSWQgIT09IEdBTUVfSUQpIHtcbiAgICBQYWtJbmZvQ2FjaGUuZ2V0SW5zdGFuY2UoYXBpKS5zYXZlKCk7XG4gICAgcmV0dXJuO1xuICB9XG4gIHRyeSB7XG4gICAgYXdhaXQgbWlncmF0ZShhcGkpO1xuICAgIGNvbnN0IGJnM1Byb2ZpbGVJZCA9IGF3YWl0IGdldEFjdGl2ZVBsYXllclByb2ZpbGUoYXBpKTtcbiAgICBjb25zdCBnYW1lU2V0dGluZ3NQYXRoOiBzdHJpbmcgPSBwYXRoLmpvaW4ocHJvZmlsZXNQYXRoKCksIGJnM1Byb2ZpbGVJZCwgJ21vZHNldHRpbmdzLmxzeCcpO1xuICAgIGxldCBub2RlcyA9IGF3YWl0IGdldE5vZGVzKGdhbWVTZXR0aW5nc1BhdGgpO1xuICAgIGNvbnN0IHsgbW9kc05vZGUsIG1vZHNPcmRlck5vZGUgfSA9IG5vZGVzO1xuICAgIGlmICgobW9kc05vZGUuY2hpbGRyZW4gPT09IHVuZGVmaW5lZCkgfHwgKChtb2RzTm9kZS5jaGlsZHJlblswXSBhcyBhbnkpID09PSAnJykpIHtcbiAgICAgIG1vZHNOb2RlLmNoaWxkcmVuID0gW3sgbm9kZTogW10gfV07XG4gICAgfVxuXG5cbiAgICBjb25zdCBmb3JtYXQgPSBhd2FpdCBnZXREZWZhdWx0TW9kU2V0dGluZ3NGb3JtYXQoYXBpKTtcbiAgICBpZiAobW9kc09yZGVyTm9kZSA9PT0gdW5kZWZpbmVkICYmIFsndjcnLCAndjgnXS5pbmNsdWRlcyhmb3JtYXQpKSB7XG4gICAgICBjb25zdCBjb252RnVuYyA9IGZvcm1hdCA9PT0gJ3Y3JyA/IGNvbnZlcnRWNnRvVjcgOiBjb252ZXJ0VG9WODtcbiAgICAgIGNvbnN0IGRhdGEgPSBhd2FpdCBmcy5yZWFkRmlsZUFzeW5jKGdhbWVTZXR0aW5nc1BhdGgsIHsgZW5jb2Rpbmc6ICd1dGY4JyB9KTtcbiAgICAgIGNvbnN0IG5ld0RhdGEgPSBhd2FpdCBjb252RnVuYyhkYXRhKTtcbiAgICAgIGF3YWl0IGZzLnJlbW92ZUFzeW5jKGdhbWVTZXR0aW5nc1BhdGgpLmNhdGNoKGVyciA9PiBQcm9taXNlLnJlc29sdmUoKSk7XG4gICAgICBhd2FpdCBmcy53cml0ZUZpbGVBc3luYyhnYW1lU2V0dGluZ3NQYXRoLCBuZXdEYXRhLCB7IGVuY29kaW5nOiAndXRmOCcgfSk7XG4gICAgfVxuICB9IGNhdGNoIChlcnIpIHtcbiAgICBhcGkuc2hvd0Vycm9yTm90aWZpY2F0aW9uKFxuICAgICAgJ0ZhaWxlZCB0byBtaWdyYXRlJywgZXJyLCB7XG4gICAgICAgIC8vbWVzc2FnZTogJ1BsZWFzZSBydW4gdGhlIGdhbWUgYmVmb3JlIHlvdSBzdGFydCBtb2RkaW5nJyxcbiAgICAgICAgYWxsb3dSZXBvcnQ6IGZhbHNlLFxuICAgIH0pO1xuICB9XG5cbiAgdHJ5IHtcbiAgICBhd2FpdCByZWFkU3RvcmVkTE8oYXBpKTtcbiAgICBQYWtJbmZvQ2FjaGUuZ2V0SW5zdGFuY2UoYXBpKTtcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgYXBpLnNob3dFcnJvck5vdGlmaWNhdGlvbihcbiAgICAgICdGYWlsZWQgdG8gcmVhZCBsb2FkIG9yZGVyJywgZXJyLCB7XG4gICAgICAgIG1lc3NhZ2U6ICdQbGVhc2UgcnVuIHRoZSBnYW1lIGJlZm9yZSB5b3Ugc3RhcnQgbW9kZGluZycsXG4gICAgICAgIGFsbG93UmVwb3J0OiBmYWxzZSxcbiAgICB9KTtcbiAgfVxuXG4gIGNvbnN0IGxhdGVzdFZlcjogc3RyaW5nID0gZ2V0TGF0ZXN0SW5zdGFsbGVkTFNMaWJWZXIoYXBpKTtcbiAgaWYgKGxhdGVzdFZlciA9PT0gJzAuMC4wJykge1xuICAgIGF3YWl0IGdpdEh1YkRvd25sb2FkZXIuZG93bmxvYWREaXZpbmUoYXBpKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBtYWluKGNvbnRleHQ6IHR5cGVzLklFeHRlbnNpb25Db250ZXh0KSB7XG4gIGNvbnRleHQucmVnaXN0ZXJSZWR1Y2VyKFsnc2V0dGluZ3MnLCAnYmFsZHVyc2dhdGUzJ10sIHJlZHVjZXIpO1xuXG4gIGNvbnRleHQucmVnaXN0ZXJHYW1lKHtcbiAgICBpZDogR0FNRV9JRCxcbiAgICBuYW1lOiAnQmFsZHVyXFwncyBHYXRlIDMnLFxuICAgIG1lcmdlTW9kczogdHJ1ZSxcbiAgICBxdWVyeVBhdGg6IGZpbmRHYW1lLFxuICAgIHN1cHBvcnRlZFRvb2xzOiBwcm9jZXNzLnBsYXRmb3JtID09PSAnZGFyd2luJyA/IFtdIDogW1xuICAgICAge1xuICAgICAgICBpZDogJ2V4ZXZ1bGthbicsXG4gICAgICAgIG5hbWU6ICdCYWxkdXJcXCdzIEdhdGUgMyAoVnVsa2FuKScsXG4gICAgICAgIGV4ZWN1dGFibGU6ICgpID0+ICdiaW4vYmczLmV4ZScsXG4gICAgICAgIHJlcXVpcmVkRmlsZXM6IFtcbiAgICAgICAgICAnYmluL2JnMy5leGUnLFxuICAgICAgICBdLFxuICAgICAgICByZWxhdGl2ZTogdHJ1ZSxcbiAgICAgIH0sXG4gICAgXSxcbiAgICBxdWVyeU1vZFBhdGg6IG1vZHNQYXRoLFxuICAgIGxvZ286ICdnYW1lYXJ0LmpwZycsXG4gICAgZXhlY3V0YWJsZTogKCkgPT4gKHByb2Nlc3MucGxhdGZvcm0gPT09ICdkYXJ3aW4nID8gJ0JhbGR1cnMgR2F0ZSAzJyA6ICdiaW4vYmczX2R4MTEuZXhlJyksXG4gICAgc2V0dXA6IGRpc2NvdmVyeSA9PiBwcmVwYXJlRm9yTW9kZGluZyhjb250ZXh0LmFwaSwgZGlzY292ZXJ5KSBhcyBhbnksXG4gICAgcmVxdWlyZWRGaWxlczogcHJvY2Vzcy5wbGF0Zm9ybSA9PT0gJ2RhcndpbidcbiAgICAgID8gW1xuICAgICAgICAnQmFsZHVycyBHYXRlIDMnLFxuICAgICAgXVxuICAgICAgOiBbXG4gICAgICAgICdiaW4vYmczX2R4MTEuZXhlJyxcbiAgICAgIF0sXG4gICAgZW52aXJvbm1lbnQ6IHtcbiAgICAgIFN0ZWFtQVBQSWQ6IFNURUFNX0lELFxuICAgIH0sXG4gICAgZGV0YWlsczoge1xuICAgICAgLy8gaWdub3JlZCBmaWxlcyB0byBiZSBsZWZ0IGluIHN0YWdpbmcgKHBsdWdpbnMudHh0LCBza3lyaW0uaW5pLCBldGMuKVxuICAgICAgc3RvcFBhdHRlcm5zOiBTVE9QX1BBVFRFUk5TLm1hcCh0b1dvcmRFeHApLFxuICAgICAgLy8gYWNjZXB0ZWQgbW9kIGV4dGVuc2lvbnMgZm9yIHRoaXMgZ2FtZSAod2hhdCB3aWxsIGJlIGNsYWltZWQgaW4gbW9kIHBhZ2UpXG4gICAgICBzdXBwb3J0ZWRUb29sczogW1xuICAgICAgICB7XG4gICAgICAgICAgaWQ6ICdleGUnLFxuICAgICAgICAgIG5hbWU6ICdCYWxkdXJcXCdzIEdhdGUgMyAoRFgxMSknLFxuICAgICAgICAgIGV4ZWN1dGFibGU6ICdiaW4vYmczX2R4MTEuZXhlJyxcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIGlkOiAnZXhldnVsa2FuJyxcbiAgICAgICAgICBuYW1lOiAnQmFsZHVyXFwncyBHYXRlIDMgKFZ1bGthbiknLFxuICAgICAgICAgIGV4ZWN1dGFibGU6ICdiaW4vYmczLmV4ZScsXG4gICAgICAgIH0sXG4gICAgICBdLFxuICAgICAgZ2FtZURhdGFQYXRoOiBnZXRHYW1lRGF0YVBhdGgoY29udGV4dC5hcGkpLFxuICAgICAgc3VwcG9ydGVkTW9kVHlwZXM6IFtNT0RfVFlQRV9MU0xJQiwgTU9EX1RZUEVfTE9PU0UsIE1PRF9UWVBFX0JHM1NFLCBNT0RfVFlQRV9SRVBMQUNFUl0sXG4gICAgICBhdXRvRGVwbG95OiB0cnVlLFxuICAgICAgaWdub3JlQ29uZmxpY3RzOiBJR05PUkVfUEFUVEVSTlMsXG4gICAgICBzaG93V3JvbmdHYW1lV2FybmluZzogdHJ1ZSxcbiAgICAgIHNoZWxsOiBmYWxzZSxcbiAgICB9LFxuICB9KTtcblxuICBjb250ZXh0LnJlZ2lzdGVyU2V0dGluZ3MoJ01vZHMnLCBTZXR0aW5ncyk7XG5cbiAgLy8gY29udGV4dC5yZWdpc3Rlck1vZFR5cGUoTU9EX1RZUEVfUkVQTEFDRVIsIDk4KVxuICAvLyBjb250ZXh0LnJlZ2lzdGVyTW9kVHlwZShNT0RfVFlQRV9MU0xJQiwgOTkpXG4gIC8vIGNvbnRleHQucmVnaXN0ZXJNb2RUeXBlKE1PRF9UWVBFX0JHM1NFLCAxMDApXG4gIC8vIGNvbnRleHQucmVnaXN0ZXJNb2RUeXBlKE1PRF9UWVBFX0xPT1NFLCAyMDApXG5cbiAgLy8gTG9vc2UgbW9kcyBtdXN0IGJlIHJlcm91dGVkIHRvIHRoZSB1c2VyIG1vZHMgZm9sZGVyLiBCRzMgY2FuIHRocm93IGV4Y2VwdGlvbnNcbiAgLy8gd2hlbiBtb2RzIGFyZSBtb3ZlZCwgc28gd2UgbXVzdCBtb3ZlIHRoZSBtb2RzIG91cnNlbHZlcyBhbmQgdGhlIGRpc3BhdGNoIHRoZSBjaGFuZ2UuXG4gIGNvbnRleHQucmVnaXN0ZXJNb2RUeXBlKFxuICAgIE1PRF9UWVBFX0xPT1NFLFxuICAgIDIwMCxcbiAgICAoZ2FtZUlkKSA9PiBnYW1lSWQgPT09IEdBTUVfSUQsXG4gICAgKF9nYW1lKSA9PiBtb2RzUGF0aCgpLFxuICAgIChpbnN0cnVjdGlvbnMpID0+IEJsdWViaXJkLnJlc29sdmUoaXNMb29zZShpbnN0cnVjdGlvbnMpKSxcbiAgKTtcbiAgY29udGV4dC5yZWdpc3Rlck1vZFR5cGUoXG4gICAgTU9EX1RZUEVfUkVQTEFDRVIsXG4gICAgMTAwLFxuICAgIChnYW1lSWQpID0+IGdhbWVJZCA9PT0gR0FNRV9JRCxcbiAgICAoX2dhbWUpID0+IGdldEdhbWVQYXRoKGNvbnRleHQuYXBpKSxcbiAgICAoaW5zdHJ1Y3Rpb25zKSA9PiBCbHVlYmlyZC5yZXNvbHZlKGlzUmVwbGFjZXIoY29udGV4dC5hcGksIGluc3RydWN0aW9ucykpLFxuICApO1xuICBjb250ZXh0LnJlZ2lzdGVyTW9kVHlwZShcbiAgICBNT0RfVFlQRV9MU0xJQixcbiAgICA5OSxcbiAgICAoZ2FtZUlkKSA9PiBnYW1lSWQgPT09IEdBTUVfSUQsXG4gICAgKF9nYW1lKSA9PiBnZXRHYW1lUGF0aChjb250ZXh0LmFwaSksXG4gICAgKGluc3RydWN0aW9ucykgPT4gQmx1ZWJpcmQucmVzb2x2ZShpc0xTTGliKGluc3RydWN0aW9ucykpLFxuICApO1xuICBjb250ZXh0LnJlZ2lzdGVyTW9kVHlwZShcbiAgICBNT0RfVFlQRV9CRzNTRSxcbiAgICAxMDAsXG4gICAgKGdhbWVJZCkgPT4gZ2FtZUlkID09PSBHQU1FX0lELFxuICAgIChfZ2FtZSkgPT4gcGF0aC5qb2luKGdldEdhbWVQYXRoKGNvbnRleHQuYXBpKSwgJ2JpbicpLFxuICAgIChpbnN0cnVjdGlvbnMpID0+IEJsdWViaXJkLnJlc29sdmUoaXNCRzNTRShpbnN0cnVjdGlvbnMpKSxcbiAgKTtcblxuICBjb250ZXh0LnJlZ2lzdGVyQWN0aW9uKCdtb2RzLWFjdGlvbi1pY29ucycsIDk5OSwgJ3VwZGF0ZScsIHt9LCAnQ2hlY2sgTW9kIFZlcnNpb25zJywgKGluc3RhbmNlSWRzKSA9PiB7XG4gICAgICB2b2lkIG9uQ2hlY2tNb2RWZXJzaW9uKGNvbnRleHQuYXBpLCBzZWxlY3RvcnMuYWN0aXZlR2FtZUlkKGNvbnRleHQuYXBpLmdldFN0YXRlKCkpLCBbXSk7XG4gIH0pO1xuXG4gIGNvbnRleHQub25jZSgoKSA9PiB7XG4gICAgY29udGV4dC5hcGkub25Bc3luYygnZGlkLWRlcGxveScsIChwcm9maWxlSWQsIHByb2ZpbGVUeXBlLCBkZXBsb3ltZW50KSA9PiB7XG4gICAgICBmb3JjZVJlZnJlc2goY29udGV4dC5hcGkpO1xuICAgICAgcmV0dXJuIEJsdWViaXJkLnJlc29sdmUoKTtcbiAgICB9KTtcbiAgfSk7XG5cbn1cblxuZXhwb3J0IGRlZmF1bHQgbWFpbjtcbiJdfQ==