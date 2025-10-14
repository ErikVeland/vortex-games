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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
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
            .catch(() => vortex_api_1.fs.ensureDirWritableAsync(mp, () => Promise.resolve()))
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
    context.registerModType(common_1.MOD_TYPE_LOOSE, 200, (gameId) => gameId === common_1.GAME_ID, (_game) => (0, util_1.modsPath)(), (instructions) => Promise.resolve((0, modTypes_1.isLoose)(instructions)));
    context.registerModType(common_1.MOD_TYPE_REPLACER, 100, (gameId) => gameId === common_1.GAME_ID, (_game) => (0, util_1.getGamePath)(context.api), (instructions) => Promise.resolve((0, modTypes_1.isReplacer)(context.api, instructions)));
    context.registerModType(common_1.MOD_TYPE_LSLIB, 99, (gameId) => gameId === common_1.GAME_ID, (_game) => (0, util_1.getGamePath)(context.api), (instructions) => Promise.resolve((0, modTypes_1.isLSLib)(instructions)));
    context.registerModType(common_1.MOD_TYPE_BG3SE, 100, (gameId) => gameId === common_1.GAME_ID, (_game) => path.join((0, util_1.getGamePath)(context.api), 'bin'), (instructions) => Promise.resolve((0, modTypes_1.isBG3SE)(instructions)));
    context.registerAction('mods-action-icons', 999, 'update', {}, 'Check Mod Versions', (instanceIds) => {
        void onCheckModVersion(context.api, vortex_api_1.selectors.activeGameId(context.api.getState()), []);
    });
    context.once(() => {
        context.api.onAsync('did-deploy', (profileId, profileType, deployment) => {
            (0, util_1.forceRefresh)(context.api);
            return Promise.resolve();
        });
    });
}
exports.default = main;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50c3giXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFhQSwyQ0FBNkI7QUFFN0IsMkNBQXdEO0FBRXhELHFDQUVrQjtBQUNsQixxRUFBdUQ7QUFDdkQsMERBQWtDO0FBQ2xDLDBEQUFpQztBQUNqQyw2Q0FBdUM7QUFFdkMsaUNBVWdCO0FBUWhCLHlDQUVvQjtBQUVwQiwyQ0FJcUI7QUFHckIsb0RBQW1DO0FBRW5DLE1BQU0sYUFBYSxHQUFHLENBQUMsY0FBYyxDQUFDLENBQUM7QUFFdkMsTUFBTSxNQUFNLEdBQUcsWUFBWSxDQUFDO0FBQzVCLE1BQU0sUUFBUSxHQUFHLFNBQVMsQ0FBQztBQUUzQixTQUFTLFNBQVMsQ0FBQyxLQUFLO0lBQ3RCLE9BQU8sT0FBTyxHQUFHLEtBQUssR0FBRyxPQUFPLENBQUM7QUFDbkMsQ0FBQztBQUVELFNBQVMsUUFBUTtJQUNmLE9BQU8saUJBQUksQ0FBQyxlQUFlLENBQUMsV0FBVyxDQUFDLENBQUMsTUFBTSxFQUFFLFFBQVEsQ0FBQyxDQUFDO1NBQ3hELElBQUksQ0FBQyxDQUFNLElBQUksRUFBQyxFQUFFO1FBQ2pCLE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUM7UUFDL0IsSUFBSSxPQUFPLENBQUMsUUFBUSxLQUFLLFFBQVEsRUFBRSxDQUFDO1lBQ2xDLE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLHFCQUFxQixFQUFFLFVBQVUsRUFBRSxPQUFPLENBQUMsQ0FBQztZQUNqRixJQUFJLENBQUM7Z0JBQ0gsTUFBTSxlQUFFLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxDQUFDO2dCQUM3QixPQUFPLFFBQVEsQ0FBQztZQUNsQixDQUFDO1lBQUMsT0FBTyxHQUFHLEVBQUUsQ0FBQztZQUVmLENBQUM7UUFDSCxDQUFDO1FBQ0QsT0FBTyxRQUFRLENBQUM7SUFDbEIsQ0FBQyxDQUFBLENBQUMsQ0FBQztBQUNQLENBQUM7QUFFRCxTQUFlLG1CQUFtQixDQUFDLEdBQXdCLEVBQUUsU0FBaUM7O1FBQzVGLElBQUksU0FBUyxhQUFULFNBQVMsdUJBQVQsU0FBUyxDQUFFLElBQUksRUFBRSxDQUFDO1lBQ3BCLE1BQU0sV0FBVyxHQUFHLE1BQU0sSUFBQSx3QkFBaUIsRUFBQyxHQUFHLENBQUMsQ0FBQztZQUNqRCxJQUFJLENBQUM7Z0JBQ0gsTUFBTSxlQUFFLENBQUMsc0JBQXNCLENBQUMsV0FBVyxDQUFDLENBQUM7Z0JBQzdDLE1BQU0sbUJBQW1CLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxXQUFXLEVBQUUsaUJBQWlCLENBQUMsQ0FBQztnQkFDdEUsSUFBSSxDQUFDO29CQUNILE1BQU0sZUFBRSxDQUFDLFNBQVMsQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDO2dCQUMxQyxDQUFDO2dCQUFDLE9BQU8sR0FBRyxFQUFFLENBQUM7b0JBQ2IsTUFBTSxrQkFBa0IsR0FBRyxNQUFNLElBQUEsNEJBQXFCLEVBQUMsR0FBRyxDQUFDLENBQUM7b0JBQzVELE1BQU0sZUFBRSxDQUFDLGNBQWMsQ0FBQyxtQkFBbUIsRUFBRSxrQkFBa0IsRUFBRSxFQUFFLFFBQVEsRUFBRSxNQUFNLEVBQUUsQ0FBQyxDQUFDO2dCQUN6RixDQUFDO1lBQ0gsQ0FBQztZQUFDLE9BQU8sR0FBRyxFQUFFLENBQUM7Z0JBQ2IsT0FBTyxPQUFPLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQzdCLENBQUM7UUFDSCxDQUFDO0lBQ0gsQ0FBQztDQUFBO0FBRUQsU0FBZSxpQkFBaUIsQ0FBQyxHQUF3QixFQUFFLFNBQVM7O1FBQ2xFLE1BQU0sRUFBRSxHQUFHLElBQUEsZUFBUSxHQUFFLENBQUM7UUFFdEIsTUFBTSxNQUFNLEdBQUcsTUFBTSxJQUFBLGtDQUEyQixFQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ3RELElBQUksQ0FBQyxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQztZQUNuQyxxQ0FBcUMsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUM3QyxDQUFDO1FBRUQsT0FBTyxlQUFFLENBQUMsU0FBUyxDQUFDLEVBQUUsQ0FBQzthQUNwQixLQUFLLENBQUMsR0FBRyxFQUFFLENBQUMsZUFBRSxDQUFDLHNCQUFzQixDQUFDLEVBQUUsRUFBRSxHQUFHLEVBQUUsQ0FBQyxPQUFPLENBQUMsT0FBTyxFQUFTLENBQUMsQ0FBQzthQUMxRSxPQUFPLENBQUMsR0FBRyxFQUFFLENBQUMsbUJBQW1CLENBQUMsR0FBRyxFQUFFLFNBQVMsQ0FBQyxDQUFDLENBQUM7SUFDeEQsQ0FBQztDQUFBO0FBRUQsU0FBUyxxQ0FBcUMsQ0FBQyxHQUF3Qjs7SUFFckUsTUFBTSxJQUFJLEdBQUcsTUFBQSxNQUFBLEdBQUcsQ0FBQyxLQUFLLENBQUMsUUFBUSxFQUFFLENBQUMsVUFBVSwwQ0FBRSxJQUFJLDBDQUFFLFlBQVksQ0FBQztJQUNqRSxJQUFHLElBQUksS0FBSyxTQUFTLEVBQUUsQ0FBQztRQUN0QixNQUFNLFFBQVEsR0FBaUIsSUFBSSxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7UUFDL0QsSUFBQSxlQUFRLEVBQUMsVUFBVSxFQUFFLFFBQVEsQ0FBQyxDQUFDO1FBRS9CLE1BQU0saUJBQWlCLEdBQVksUUFBUSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsRUFBRSxXQUFDLE9BQUEsQ0FBQyxDQUFDLENBQUEsTUFBQSxHQUFHLGFBQUgsR0FBRyx1QkFBSCxHQUFHLENBQUUsVUFBVSwwQ0FBRSxRQUFRLENBQUEsQ0FBQSxFQUFBLENBQUMsQ0FBQyxNQUFNLElBQUksQ0FBQyxDQUFDO1FBQ25HLElBQUEsZUFBUSxFQUFDLG1CQUFtQixFQUFFLGlCQUFpQixDQUFDLENBQUM7UUFHakQsSUFBRyxpQkFBaUIsRUFBRSxDQUFDO1lBQ3JCLE9BQU87UUFDVCxDQUFDO0lBQ0gsQ0FBQztJQUdELEdBQUcsQ0FBQyxnQkFBZ0IsQ0FBQztRQUNuQixJQUFJLEVBQUUsU0FBUztRQUNmLEtBQUssRUFBRSxpQkFBaUI7UUFDeEIsT0FBTyxFQUFFLDZCQUE2QjtRQUN0QyxFQUFFLEVBQUUscUJBQXFCO1FBQ3pCLGFBQWEsRUFBRSxJQUFJO1FBQ25CLE9BQU8sRUFBRTtZQUNQO2dCQUNFLEtBQUssRUFBRSxNQUFNLEVBQUUsTUFBTSxFQUFFLE9BQU8sQ0FBQyxFQUFFO29CQUMvQixHQUFHLENBQUMsVUFBVSxDQUFDLFVBQVUsRUFBRSxrQkFBa0IsRUFBRTt3QkFDN0MsSUFBSSxFQUNGLDhGQUE4Rjs0QkFDOUYsZ0dBQWdHO3FCQUNuRyxFQUFFO3dCQUNELEVBQUUsS0FBSyxFQUFFLFNBQVMsRUFBRTt3QkFDcEIsRUFBRSxLQUFLLEVBQUUsaUJBQWlCLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRTtxQkFDNUMsQ0FBQzt5QkFDQyxJQUFJLENBQUMsTUFBTSxDQUFDLEVBQUU7d0JBQ2IsT0FBTyxFQUFFLENBQUM7d0JBQ1YsSUFBSSxNQUFNLENBQUMsTUFBTSxLQUFLLGlCQUFpQixFQUFFLENBQUM7NEJBQ3hDLGlCQUFJLENBQUMsR0FBRyxDQUFDLGlFQUFpRSxDQUFDLENBQUMsS0FBSyxDQUFDLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFBO3dCQUMvRixDQUFDOzZCQUFNLElBQUksTUFBTSxDQUFDLE1BQU0sS0FBSyxRQUFRLEVBQUUsQ0FBQzt3QkFFeEMsQ0FBQzt3QkFDRCxPQUFPLE9BQU8sQ0FBQyxPQUFPLEVBQUUsQ0FBQztvQkFDM0IsQ0FBQyxDQUFDLENBQUM7Z0JBQ1AsQ0FBQzthQUNGO1NBQ0Y7S0FDRixDQUFDLENBQUM7QUFDTCxDQUFDO0FBRUQsU0FBZSxpQkFBaUIsQ0FBQyxHQUF3QixFQUFFLE1BQWMsRUFBRSxJQUFrQjs7UUFDM0YsTUFBTSxPQUFPLEdBQUcsc0JBQVMsQ0FBQyxhQUFhLENBQUMsR0FBRyxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUM7UUFDeEQsSUFBSSxPQUFPLENBQUMsTUFBTSxLQUFLLGdCQUFPLElBQUksTUFBTSxLQUFLLGdCQUFPLEVBQUUsQ0FBQztZQUNyRCxPQUFPO1FBQ1QsQ0FBQztRQUVELE1BQU0sU0FBUyxHQUFXLElBQUEsaUNBQTBCLEVBQUMsR0FBRyxDQUFDLENBQUM7UUFFMUQsSUFBSSxTQUFTLEtBQUssT0FBTyxFQUFFLENBQUM7WUFFMUIsT0FBTztRQUNULENBQUM7UUFFRCxNQUFNLFNBQVMsR0FBVyxNQUFNLGdCQUFnQixDQUFDLGVBQWUsQ0FBQyxHQUFHLEVBQUUsU0FBUyxDQUFDLENBQUM7UUFDakYsSUFBSSxDQUFDLFNBQVMsSUFBSSxTQUFTLEtBQUssU0FBUyxFQUFFLENBQUM7WUFDMUMsT0FBTztRQUNULENBQUM7SUFDSCxDQUFDO0NBQUE7QUFFRCxTQUFlLG1CQUFtQixDQUFDLEdBQXdCLEVBQUUsTUFBYzs7UUFDekUsSUFBSSxNQUFNLEtBQUssZ0JBQU8sRUFBRSxDQUFDO1lBQ3ZCLGVBQVksQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUM7WUFDckMsT0FBTztRQUNULENBQUM7UUFDRCxJQUFJLENBQUM7WUFDSCxNQUFNLElBQUEsb0JBQU8sRUFBQyxHQUFHLENBQUMsQ0FBQztZQUNuQixNQUFNLFlBQVksR0FBRyxNQUFNLElBQUEsNkJBQXNCLEVBQUMsR0FBRyxDQUFDLENBQUM7WUFDdkQsTUFBTSxnQkFBZ0IsR0FBVyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUEsbUJBQVksR0FBRSxFQUFFLFlBQVksRUFBRSxpQkFBaUIsQ0FBQyxDQUFDO1lBQzVGLElBQUksS0FBSyxHQUFHLE1BQU0sSUFBQSxvQkFBUSxFQUFDLGdCQUFnQixDQUFDLENBQUM7WUFDN0MsTUFBTSxFQUFFLFFBQVEsRUFBRSxhQUFhLEVBQUUsR0FBRyxLQUFLLENBQUM7WUFDMUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxRQUFRLEtBQUssU0FBUyxDQUFDLElBQUksQ0FBRSxRQUFRLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBUyxLQUFLLEVBQUUsQ0FBQyxFQUFFLENBQUM7Z0JBQ2hGLFFBQVEsQ0FBQyxRQUFRLEdBQUcsQ0FBQyxFQUFFLElBQUksRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQ3JDLENBQUM7WUFHRCxNQUFNLE1BQU0sR0FBRyxNQUFNLElBQUEsa0NBQTJCLEVBQUMsR0FBRyxDQUFDLENBQUM7WUFDdEQsSUFBSSxhQUFhLEtBQUssU0FBUyxJQUFJLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDO2dCQUNqRSxNQUFNLFFBQVEsR0FBRyxNQUFNLEtBQUssSUFBSSxDQUFDLENBQUMsQ0FBQyxvQkFBYSxDQUFDLENBQUMsQ0FBQyxrQkFBVyxDQUFDO2dCQUMvRCxNQUFNLElBQUksR0FBRyxNQUFNLGVBQUUsQ0FBQyxhQUFhLENBQUMsZ0JBQWdCLEVBQUUsRUFBRSxRQUFRLEVBQUUsTUFBTSxFQUFFLENBQUMsQ0FBQztnQkFDNUUsTUFBTSxPQUFPLEdBQUcsTUFBTSxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQ3JDLE1BQU0sZUFBRSxDQUFDLFdBQVcsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLE9BQU8sQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDO2dCQUN2RSxNQUFNLGVBQUUsQ0FBQyxjQUFjLENBQUMsZ0JBQWdCLEVBQUUsT0FBTyxFQUFFLEVBQUUsUUFBUSxFQUFFLE1BQU0sRUFBRSxDQUFDLENBQUM7WUFDM0UsQ0FBQztRQUNILENBQUM7UUFBQyxPQUFPLEdBQUcsRUFBRSxDQUFDO1lBQ2IsR0FBRyxDQUFDLHFCQUFxQixDQUN2QixtQkFBbUIsRUFBRSxHQUFHLEVBQUU7Z0JBRXhCLFdBQVcsRUFBRSxLQUFLO2FBQ3JCLENBQUMsQ0FBQztRQUNMLENBQUM7UUFFRCxJQUFJLENBQUM7WUFDSCxNQUFNLElBQUEsbUJBQVksRUFBQyxHQUFHLENBQUMsQ0FBQztZQUN4QixlQUFZLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ2hDLENBQUM7UUFBQyxPQUFPLEdBQUcsRUFBRSxDQUFDO1lBQ2IsR0FBRyxDQUFDLHFCQUFxQixDQUN2QiwyQkFBMkIsRUFBRSxHQUFHLEVBQUU7Z0JBQ2hDLE9BQU8sRUFBRSw4Q0FBOEM7Z0JBQ3ZELFdBQVcsRUFBRSxLQUFLO2FBQ3JCLENBQUMsQ0FBQztRQUNMLENBQUM7UUFFRCxNQUFNLFNBQVMsR0FBVyxJQUFBLGlDQUEwQixFQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQzFELElBQUksU0FBUyxLQUFLLE9BQU8sRUFBRSxDQUFDO1lBQzFCLE1BQU0sZ0JBQWdCLENBQUMsY0FBYyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQzdDLENBQUM7SUFDSCxDQUFDO0NBQUE7QUFFRCxTQUFTLElBQUksQ0FBQyxPQUFnQztJQUM1QyxPQUFPLENBQUMsZUFBZSxDQUFDLENBQUMsVUFBVSxFQUFFLGNBQWMsQ0FBQyxFQUFFLGtCQUFPLENBQUMsQ0FBQztJQUUvRCxPQUFPLENBQUMsWUFBWSxDQUFDO1FBQ25CLEVBQUUsRUFBRSxnQkFBTztRQUNYLElBQUksRUFBRSxrQkFBa0I7UUFDeEIsU0FBUyxFQUFFLElBQUk7UUFDZixTQUFTLEVBQUUsUUFBUTtRQUNuQixjQUFjLEVBQUUsT0FBTyxDQUFDLFFBQVEsS0FBSyxRQUFRLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDbkQ7Z0JBQ0UsRUFBRSxFQUFFLFdBQVc7Z0JBQ2YsSUFBSSxFQUFFLDJCQUEyQjtnQkFDakMsVUFBVSxFQUFFLEdBQUcsRUFBRSxDQUFDLGFBQWE7Z0JBQy9CLGFBQWEsRUFBRTtvQkFDYixhQUFhO2lCQUNkO2dCQUNELFFBQVEsRUFBRSxJQUFJO2FBQ2Y7U0FDRjtRQUNELFlBQVksRUFBRSxlQUFRO1FBQ3RCLElBQUksRUFBRSxhQUFhO1FBQ25CLFVBQVUsRUFBRSxHQUFHLEVBQUUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxRQUFRLEtBQUssUUFBUSxDQUFDLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLENBQUMsa0JBQWtCLENBQUM7UUFDekYsS0FBSyxFQUFFLFNBQVMsQ0FBQyxFQUFFLENBQUMsaUJBQWlCLENBQUMsT0FBTyxDQUFDLEdBQUcsRUFBRSxTQUFTLENBQVE7UUFDcEUsYUFBYSxFQUFFLE9BQU8sQ0FBQyxRQUFRLEtBQUssUUFBUTtZQUMxQyxDQUFDLENBQUM7Z0JBQ0EsZ0JBQWdCO2FBQ2pCO1lBQ0QsQ0FBQyxDQUFDO2dCQUNBLGtCQUFrQjthQUNuQjtRQUNILFdBQVcsRUFBRTtZQUNYLFVBQVUsRUFBRSxRQUFRO1NBQ3JCO1FBQ0QsT0FBTyxFQUFFO1lBRVAsWUFBWSxFQUFFLGFBQWEsQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDO1lBRTFDLGNBQWMsRUFBRTtnQkFDZDtvQkFDRSxFQUFFLEVBQUUsS0FBSztvQkFDVCxJQUFJLEVBQUUseUJBQXlCO29CQUMvQixVQUFVLEVBQUUsa0JBQWtCO2lCQUMvQjtnQkFDRDtvQkFDRSxFQUFFLEVBQUUsV0FBVztvQkFDZixJQUFJLEVBQUUsMkJBQTJCO29CQUNqQyxVQUFVLEVBQUUsYUFBYTtpQkFDMUI7YUFDRjtZQUNELFlBQVksRUFBRSxJQUFBLHNCQUFlLEVBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQztZQUMxQyxpQkFBaUIsRUFBRSxDQUFDLHVCQUFjLEVBQUUsdUJBQWMsRUFBRSx1QkFBYyxFQUFFLDBCQUFpQixDQUFDO1lBQ3RGLFVBQVUsRUFBRSxJQUFJO1lBQ2hCLGVBQWUsRUFBRSx3QkFBZTtZQUNoQyxvQkFBb0IsRUFBRSxJQUFJO1lBQzFCLEtBQUssRUFBRSxLQUFLO1NBQ2I7S0FDRixDQUFDLENBQUM7SUFFSCxPQUFPLENBQUMsZ0JBQWdCLENBQUMsTUFBTSxFQUFFLGtCQUFRLENBQUMsQ0FBQztJQVMzQyxPQUFPLENBQUMsZUFBZSxDQUNyQix1QkFBYyxFQUNkLEdBQUcsRUFDSCxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUMsTUFBTSxLQUFLLGdCQUFPLEVBQzlCLENBQUMsS0FBSyxFQUFFLEVBQUUsQ0FBQyxJQUFBLGVBQVEsR0FBRSxFQUNyQixDQUFDLFlBQVksRUFBRSxFQUFFLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxJQUFBLGtCQUFPLEVBQUMsWUFBWSxDQUFDLENBQUMsQ0FDekQsQ0FBQztJQUNGLE9BQU8sQ0FBQyxlQUFlLENBQ3JCLDBCQUFpQixFQUNqQixHQUFHLEVBQ0gsQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDLE1BQU0sS0FBSyxnQkFBTyxFQUM5QixDQUFDLEtBQUssRUFBRSxFQUFFLENBQUMsSUFBQSxrQkFBVyxFQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsRUFDbkMsQ0FBQyxZQUFZLEVBQUUsRUFBRSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsSUFBQSxxQkFBVSxFQUFDLE9BQU8sQ0FBQyxHQUFHLEVBQUUsWUFBWSxDQUFDLENBQUMsQ0FDekUsQ0FBQztJQUNGLE9BQU8sQ0FBQyxlQUFlLENBQ3JCLHVCQUFjLEVBQ2QsRUFBRSxFQUNGLENBQUMsTUFBTSxFQUFFLEVBQUUsQ0FBQyxNQUFNLEtBQUssZ0JBQU8sRUFDOUIsQ0FBQyxLQUFLLEVBQUUsRUFBRSxDQUFDLElBQUEsa0JBQVcsRUFBQyxPQUFPLENBQUMsR0FBRyxDQUFDLEVBQ25DLENBQUMsWUFBWSxFQUFFLEVBQUUsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLElBQUEsa0JBQU8sRUFBQyxZQUFZLENBQUMsQ0FBQyxDQUN6RCxDQUFDO0lBQ0YsT0FBTyxDQUFDLGVBQWUsQ0FDckIsdUJBQWMsRUFDZCxHQUFHLEVBQ0gsQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDLE1BQU0sS0FBSyxnQkFBTyxFQUM5QixDQUFDLEtBQUssRUFBRSxFQUFFLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFBLGtCQUFXLEVBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxFQUFFLEtBQUssQ0FBQyxFQUNyRCxDQUFDLFlBQVksRUFBRSxFQUFFLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxJQUFBLGtCQUFPLEVBQUMsWUFBWSxDQUFDLENBQUMsQ0FDekQsQ0FBQztJQUVGLE9BQU8sQ0FBQyxjQUFjLENBQUMsbUJBQW1CLEVBQUUsR0FBRyxFQUFFLFFBQVEsRUFBRSxFQUFFLEVBQUUsb0JBQW9CLEVBQUUsQ0FBQyxXQUFXLEVBQUUsRUFBRTtRQUNqRyxLQUFLLGlCQUFpQixDQUFDLE9BQU8sQ0FBQyxHQUFHLEVBQUUsc0JBQVMsQ0FBQyxZQUFZLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO0lBQzVGLENBQUMsQ0FBQyxDQUFDO0lBRUgsT0FBTyxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUU7UUFDaEIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsWUFBWSxFQUFFLENBQUMsU0FBUyxFQUFFLFdBQVcsRUFBRSxVQUFVLEVBQUUsRUFBRTtZQUN2RSxJQUFBLG1CQUFZLEVBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQzFCLE9BQU8sT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQzNCLENBQUMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQyxDQUFDLENBQUM7QUFFTCxDQUFDO0FBRUQsa0JBQWUsSUFBSSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgaXNXaW5kb3dzIH0gZnJvbSAnLi4vLi4vLi4vc3JjL3V0aWwvcGxhdGZvcm0nO1xuLyogZXNsaW50LWRpc2FibGUgKi9cbi8qKlxuICogSW1wb3J0YW50IC0gYWx0aG91Z2ggd2Ugbm8gbG9uZ2VyIGRlZmluZSB0aGUgaW5mbyBwYW5lbCBoZXJlLFxuICogIHdlIHN0aWxsIG5lZWQgdG8ga2VlcCB0aGUgaW5kZXggZmlsZSdzICcudHN4JyBleHRlbnNpb24uXG4gKiAgQXQgbGVhc3Qgd2hpbGUgb3VyIHVwZGF0ZSBwcm9jZXNzIGZvciBidW5kbGVkIHBsdWdpbnMgcmVtYWluc1xuICogIHRocm91Z2ggdGhlICdyZWxlYXNlJyBicmFuY2guXG4gKiBcbiAqIFJlbW92aW5nIGZpbGVzIGZyb20gYnVuZGxlZCBwbHVnaW5zIHdpdGhvdXQgc3R1YmJpbmcgdGhlIGV4dGVuc2lvblxuICogIGNhbiBwb3RlbnRpYWxseSBicmVhayB0aGUgZXh0ZW5zaW9uIG9uIHRoZSB1c2VyJ3MgZW5kLlxuICovXG4vLyBUT0RPOiBSZW1vdmUgQmx1ZWJpcmQgaW1wb3J0IC0gdXNpbmcgbmF0aXZlIFByb21pc2U7XG5pbXBvcnQgKiBhcyBfIGZyb20gJ2xvZGFzaCc7XG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0ICogYXMgUmVhY3QgZnJvbSAncmVhY3QnO1xuaW1wb3J0IHsgZnMsIHNlbGVjdG9ycywgdHlwZXMsIHV0aWwgfSBmcm9tICd2b3J0ZXgtYXBpJztcblxuaW1wb3J0IHsgR0FNRV9JRCwgSUdOT1JFX1BBVFRFUk5TLFxuICBNT0RfVFlQRV9CRzNTRSwgTU9EX1RZUEVfTE9PU0UsIE1PRF9UWVBFX0xTTElCLCBNT0RfVFlQRV9SRVBMQUNFUixcbn0gZnJvbSAnLi9jb21tb24nO1xuaW1wb3J0ICogYXMgZ2l0SHViRG93bmxvYWRlciBmcm9tICcuL2dpdGh1YkRvd25sb2FkZXInO1xuaW1wb3J0IFNldHRpbmdzIGZyb20gJy4vU2V0dGluZ3MnO1xuaW1wb3J0IHJlZHVjZXIgZnJvbSAnLi9yZWR1Y2Vycyc7XG5pbXBvcnQgeyBtaWdyYXRlIH0gZnJvbSAnLi9taWdyYXRpb25zJztcblxuaW1wb3J0IHtcbiAgbG9nRGVidWcsIGZvcmNlUmVmcmVzaCwgZ2V0TGF0ZXN0SW5zdGFsbGVkTFNMaWJWZXIsXG4gIGdldEdhbWVEYXRhUGF0aCwgZ2V0R2FtZVBhdGgsIGdsb2JhbFByb2ZpbGVQYXRoLCBtb2RzUGF0aCxcbiAgZ2V0TGF0ZXN0TFNMaWJNb2QsIGdldE93bkdhbWVWZXJzaW9uLCByZWFkU3RvcmVkTE8sXG4gIGdldERlZmF1bHRNb2RTZXR0aW5ncyxcbiAgZ2V0RGVmYXVsdE1vZFNldHRpbmdzRm9ybWF0LFxuICBnZXRBY3RpdmVQbGF5ZXJQcm9maWxlLFxuICBwcm9maWxlc1BhdGgsXG4gIGNvbnZlcnRWNnRvVjcsXG4gIGNvbnZlcnRUb1Y4LFxufSBmcm9tICcuL3V0aWwnO1xuXG4vLyBSZW1vdmVkIGluY29ycmVjdCBpbnN0YWxsZXJzIGltcG9ydFxuLy8gaW1wb3J0IHtcbi8vICAgdGVzdExTTGliLCB0ZXN0QkczU0UsIHRlc3RFbmdpbmVJbmplY3RvciwgdGVzdE1vZEZpeGVyLCB0ZXN0UmVwbGFjZXIsXG4vLyAgIGluc3RhbGxMU0xpYiwgaW5zdGFsbEJHM1NFLCBpbnN0YWxsRW5naW5lSW5qZWN0b3IsIGluc3RhbGxNb2RGaXhlciwgaW5zdGFsbFJlcGxhY2VyLFxuLy8gfSBmcm9tICcuL2luc3RhbGxlcnMnO1xuXG5pbXBvcnQge1xuICBpc0JHM1NFLCBpc0xTTGliLCBpc0xvb3NlLCBpc1JlcGxhY2VyLFxufSBmcm9tICcuL21vZFR5cGVzJztcblxuaW1wb3J0IHtcbiAgZGVzZXJpYWxpemUsIGltcG9ydE1vZFNldHRpbmdzRmlsZSwgaW1wb3J0TW9kU2V0dGluZ3NHYW1lLFxuICBpbXBvcnRGcm9tQkczTU0sIHNlcmlhbGl6ZSwgZXhwb3J0VG9HYW1lLCBleHBvcnRUb0ZpbGUsIHZhbGlkYXRlLFxuICBnZXROb2Rlcyxcbn0gZnJvbSAnLi9sb2FkT3JkZXInO1xuXG5pbXBvcnQgeyBJbmZvUGFuZWxXcmFwIH0gZnJvbSAnLi9JbmZvUGFuZWwnXG5pbXBvcnQgUGFrSW5mb0NhY2hlIGZyb20gJy4vY2FjaGUnO1xuXG5jb25zdCBTVE9QX1BBVFRFUk5TID0gWydbXi9dKlxcXFwucGFrJCddO1xuXG5jb25zdCBHT0dfSUQgPSAnMTQ1NjQ2MDY2OSc7XG5jb25zdCBTVEVBTV9JRCA9ICcxMDg2OTQwJztcblxuZnVuY3Rpb24gdG9Xb3JkRXhwKGlucHV0KSB7XG4gIHJldHVybiAnKF58LyknICsgaW5wdXQgKyAnKC98JCknO1xufVxuXG5mdW5jdGlvbiBmaW5kR2FtZSgpOiBhbnkge1xuICByZXR1cm4gdXRpbC5HYW1lU3RvcmVIZWxwZXIuZmluZEJ5QXBwSWQoW0dPR19JRCwgU1RFQU1fSURdKVxuICAgIC50aGVuKGFzeW5jIGdhbWUgPT4ge1xuICAgICAgY29uc3QgYmFzZVBhdGggPSBnYW1lLmdhbWVQYXRoO1xuICAgICAgaWYgKHByb2Nlc3MucGxhdGZvcm0gPT09ICdkYXJ3aW4nKSB7XG4gICAgICAgIGNvbnN0IG1hY09TRGlyID0gcGF0aC5qb2luKGJhc2VQYXRoLCBcIkJhbGR1cidzIEdhdGUgMy5hcHBcIiwgJ0NvbnRlbnRzJywgJ01hY09TJyk7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgYXdhaXQgZnMuc3RhdEFzeW5jKG1hY09TRGlyKTtcbiAgICAgICAgICByZXR1cm4gbWFjT1NEaXI7XG4gICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgIC8vIGZhbGwgYmFjayB0byB0aGUgc3RvcmUtcHJvdmlkZWQgcGF0aFxuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gYmFzZVBhdGg7XG4gICAgfSk7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGVuc3VyZUdsb2JhbFByb2ZpbGUoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpLCBkaXNjb3Zlcnk6IHR5cGVzLklEaXNjb3ZlcnlSZXN1bHQpIHtcbiAgaWYgKGRpc2NvdmVyeT8ucGF0aCkge1xuICAgIGNvbnN0IHByb2ZpbGVQYXRoID0gYXdhaXQgZ2xvYmFsUHJvZmlsZVBhdGgoYXBpKTtcbiAgICB0cnkge1xuICAgICAgYXdhaXQgZnMuZW5zdXJlRGlyV3JpdGFibGVBc3luYyhwcm9maWxlUGF0aCk7XG4gICAgICBjb25zdCBtb2RTZXR0aW5nc0ZpbGVQYXRoID0gcGF0aC5qb2luKHByb2ZpbGVQYXRoLCAnbW9kc2V0dGluZ3MubHN4Jyk7XG4gICAgICB0cnkge1xuICAgICAgICBhd2FpdCBmcy5zdGF0QXN5bmMobW9kU2V0dGluZ3NGaWxlUGF0aCk7XG4gICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgY29uc3QgZGVmYXVsdE1vZFNldHRpbmdzID0gYXdhaXQgZ2V0RGVmYXVsdE1vZFNldHRpbmdzKGFwaSk7XG4gICAgICAgIGF3YWl0IGZzLndyaXRlRmlsZUFzeW5jKG1vZFNldHRpbmdzRmlsZVBhdGgsIGRlZmF1bHRNb2RTZXR0aW5ncywgeyBlbmNvZGluZzogJ3V0ZjgnIH0pO1xuICAgICAgfVxuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KGVycik7XG4gICAgfVxuICB9XG59XG5cbmFzeW5jIGZ1bmN0aW9uIHByZXBhcmVGb3JNb2RkaW5nKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSwgZGlzY292ZXJ5KSB7XG4gIGNvbnN0IG1wID0gbW9kc1BhdGgoKTsgIFxuXG4gIGNvbnN0IGZvcm1hdCA9IGF3YWl0IGdldERlZmF1bHRNb2RTZXR0aW5nc0Zvcm1hdChhcGkpO1xuICBpZiAoIVsndjcnLCAndjgnXS5pbmNsdWRlcyhmb3JtYXQpKSB7XG4gICAgc2hvd0Z1bGxSZWxlYXNlTW9kRml4ZXJSZWNvbW1lbmRhdGlvbihhcGkpO1xuICB9XG4gIFxuICByZXR1cm4gZnMuc3RhdEFzeW5jKG1wKVxuICAgIC5jYXRjaCgoKSA9PiBmcy5lbnN1cmVEaXJXcml0YWJsZUFzeW5jKG1wLCAoKSA9PiBQcm9taXNlLnJlc29sdmUoKSBhcyBhbnkpKVxuICAgIC5maW5hbGx5KCgpID0+IGVuc3VyZUdsb2JhbFByb2ZpbGUoYXBpLCBkaXNjb3ZlcnkpKTtcbn1cblxuZnVuY3Rpb24gc2hvd0Z1bGxSZWxlYXNlTW9kRml4ZXJSZWNvbW1lbmRhdGlvbihhcGk6IHR5cGVzLklFeHRlbnNpb25BcGkpIHtcbiAgLy8gY2hlY2sgdG8gc2VlIGlmIG1vZCBpcyBpbnN0YWxsZWQgZmlyc3Q/XG4gIGNvbnN0IG1vZHMgPSBhcGkuc3RvcmUuZ2V0U3RhdGUoKS5wZXJzaXN0ZW50Py5tb2RzPy5iYWxkdXJzZ2F0ZTM7XG4gIGlmKG1vZHMgIT09IHVuZGVmaW5lZCkge1xuICAgIGNvbnN0IG1vZEFycmF5OiB0eXBlcy5JTW9kW10gPSBtb2RzID8gT2JqZWN0LnZhbHVlcyhtb2RzKSA6IFtdO1xuICAgIGxvZ0RlYnVnKCdtb2RBcnJheScsIG1vZEFycmF5KTtcbiAgXG4gICAgY29uc3QgbW9kRml4ZXJJbnN0YWxsZWQ6Ym9vbGVhbiA9ICBtb2RBcnJheS5maWx0ZXIobW9kID0+ICEhbW9kPy5hdHRyaWJ1dGVzPy5tb2RGaXhlcikubGVuZ3RoICE9IDA7ICBcbiAgICBsb2dEZWJ1ZygnbW9kRml4ZXJJbnN0YWxsZWQnLCBtb2RGaXhlckluc3RhbGxlZCk7XG5cbiAgICAvLyBpZiB3ZSd2ZSBmb3VuZCBhbiBpbnN0YWxsZWQgbW9kZml4ZXIsIHRoZW4gZG9uJ3QgYm90aGVyIHNob3dpbmcgbm90aWZpY2F0aW9uIFxuICAgIGlmKG1vZEZpeGVySW5zdGFsbGVkKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICB9XG5cbiAgLy8gbm8gbW9kcyBmb3VuZFxuICBhcGkuc2VuZE5vdGlmaWNhdGlvbih7XG4gICAgdHlwZTogJ3dhcm5pbmcnLFxuICAgIHRpdGxlOiAnUmVjb21tZW5kZWQgTW9kJyxcbiAgICBtZXNzYWdlOiAnTW9zdCBtb2RzIHJlcXVpcmUgdGhpcyBtb2QuJyxcbiAgICBpZDogJ2JnMy1yZWNvbW1lbmRlZC1tb2QnLFxuICAgIGFsbG93U3VwcHJlc3M6IHRydWUsXG4gICAgYWN0aW9uczogW1xuICAgICAge1xuICAgICAgICB0aXRsZTogJ01vcmUnLCBhY3Rpb246IGRpc21pc3MgPT4ge1xuICAgICAgICAgIGFwaS5zaG93RGlhbG9nKCdxdWVzdGlvbicsICdSZWNvbW1lbmRlZCBNb2RzJywge1xuICAgICAgICAgICAgdGV4dDpcbiAgICAgICAgICAgICAgJ1dlIHJlY29tbWVuZCBpbnN0YWxsaW5nIFwiQmFsZHVyXFwncyBHYXRlIDMgTW9kIEZpeGVyXCIgdG8gYmUgYWJsZSB0byBtb2QgQmFsZHVyXFwncyBHYXRlIDMuXFxuXFxuJyArIFxuICAgICAgICAgICAgICAnVGhpcyBjYW4gYmUgZG93bmxvYWRlZCBmcm9tIE5leHVzIE1vZHMgYW5kIGluc3RhbGxlZCB1c2luZyBWb3J0ZXggYnkgcHJlc3NpbmcgXCJPcGVuIE5leHVzIE1vZHMnXG4gICAgICAgICAgfSwgW1xuICAgICAgICAgICAgeyBsYWJlbDogJ0Rpc21pc3MnIH0sXG4gICAgICAgICAgICB7IGxhYmVsOiAnT3BlbiBOZXh1cyBNb2RzJywgZGVmYXVsdDogdHJ1ZSB9LFxuICAgICAgICAgIF0pXG4gICAgICAgICAgICAudGhlbihyZXN1bHQgPT4ge1xuICAgICAgICAgICAgICBkaXNtaXNzKCk7XG4gICAgICAgICAgICAgIGlmIChyZXN1bHQuYWN0aW9uID09PSAnT3BlbiBOZXh1cyBNb2RzJykge1xuICAgICAgICAgICAgICAgIHV0aWwub3BuKCdodHRwczovL3d3dy5uZXh1c21vZHMuY29tL2JhbGR1cnNnYXRlMy9tb2RzLzE0MT90YWI9ZGVzY3JpcHRpb24nKS5jYXRjaCgoKSA9PiBudWxsKVxuICAgICAgICAgICAgICB9IGVsc2UgaWYgKHJlc3VsdC5hY3Rpb24gPT09ICdDYW5jZWwnKSB7XG4gICAgICAgICAgICAgICAgLy8gZGlzbWlzcyBhbnl3YXlcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIF0sXG4gIH0pO1xufVxuXG5hc3luYyBmdW5jdGlvbiBvbkNoZWNrTW9kVmVyc2lvbihhcGk6IHR5cGVzLklFeHRlbnNpb25BcGksIGdhbWVJZDogc3RyaW5nLCBtb2RzOiB0eXBlcy5JTW9kW10pIHtcbiAgY29uc3QgcHJvZmlsZSA9IHNlbGVjdG9ycy5hY3RpdmVQcm9maWxlKGFwaS5nZXRTdGF0ZSgpKTtcbiAgaWYgKHByb2ZpbGUuZ2FtZUlkICE9PSBHQU1FX0lEIHx8IGdhbWVJZCAhPT0gR0FNRV9JRCkge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGNvbnN0IGxhdGVzdFZlcjogc3RyaW5nID0gZ2V0TGF0ZXN0SW5zdGFsbGVkTFNMaWJWZXIoYXBpKTtcblxuICBpZiAobGF0ZXN0VmVyID09PSAnMC4wLjAnKSB7XG4gICAgLy8gTm90aGluZyB0byB1cGRhdGUuXG4gICAgcmV0dXJuO1xuICB9XG5cbiAgY29uc3QgbmV3ZXN0VmVyOiBzdHJpbmcgPSBhd2FpdCBnaXRIdWJEb3dubG9hZGVyLmNoZWNrRm9yVXBkYXRlcyhhcGksIGxhdGVzdFZlcik7XG4gIGlmICghbmV3ZXN0VmVyIHx8IG5ld2VzdFZlciA9PT0gbGF0ZXN0VmVyKSB7XG4gICAgcmV0dXJuO1xuICB9XG59XG5cbmFzeW5jIGZ1bmN0aW9uIG9uR2FtZU1vZGVBY3RpdmF0ZWQoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpLCBnYW1lSWQ6IHN0cmluZykge1xuICBpZiAoZ2FtZUlkICE9PSBHQU1FX0lEKSB7XG4gICAgUGFrSW5mb0NhY2hlLmdldEluc3RhbmNlKGFwaSkuc2F2ZSgpO1xuICAgIHJldHVybjtcbiAgfVxuICB0cnkge1xuICAgIGF3YWl0IG1pZ3JhdGUoYXBpKTtcbiAgICBjb25zdCBiZzNQcm9maWxlSWQgPSBhd2FpdCBnZXRBY3RpdmVQbGF5ZXJQcm9maWxlKGFwaSk7XG4gICAgY29uc3QgZ2FtZVNldHRpbmdzUGF0aDogc3RyaW5nID0gcGF0aC5qb2luKHByb2ZpbGVzUGF0aCgpLCBiZzNQcm9maWxlSWQsICdtb2RzZXR0aW5ncy5sc3gnKTtcbiAgICBsZXQgbm9kZXMgPSBhd2FpdCBnZXROb2RlcyhnYW1lU2V0dGluZ3NQYXRoKTtcbiAgICBjb25zdCB7IG1vZHNOb2RlLCBtb2RzT3JkZXJOb2RlIH0gPSBub2RlcztcbiAgICBpZiAoKG1vZHNOb2RlLmNoaWxkcmVuID09PSB1bmRlZmluZWQpIHx8ICgobW9kc05vZGUuY2hpbGRyZW5bMF0gYXMgYW55KSA9PT0gJycpKSB7XG4gICAgICBtb2RzTm9kZS5jaGlsZHJlbiA9IFt7IG5vZGU6IFtdIH1dO1xuICAgIH1cblxuXG4gICAgY29uc3QgZm9ybWF0ID0gYXdhaXQgZ2V0RGVmYXVsdE1vZFNldHRpbmdzRm9ybWF0KGFwaSk7XG4gICAgaWYgKG1vZHNPcmRlck5vZGUgPT09IHVuZGVmaW5lZCAmJiBbJ3Y3JywgJ3Y4J10uaW5jbHVkZXMoZm9ybWF0KSkge1xuICAgICAgY29uc3QgY29udkZ1bmMgPSBmb3JtYXQgPT09ICd2NycgPyBjb252ZXJ0VjZ0b1Y3IDogY29udmVydFRvVjg7XG4gICAgICBjb25zdCBkYXRhID0gYXdhaXQgZnMucmVhZEZpbGVBc3luYyhnYW1lU2V0dGluZ3NQYXRoLCB7IGVuY29kaW5nOiAndXRmOCcgfSk7XG4gICAgICBjb25zdCBuZXdEYXRhID0gYXdhaXQgY29udkZ1bmMoZGF0YSk7XG4gICAgICBhd2FpdCBmcy5yZW1vdmVBc3luYyhnYW1lU2V0dGluZ3NQYXRoKS5jYXRjaChlcnIgPT4gUHJvbWlzZS5yZXNvbHZlKCkpO1xuICAgICAgYXdhaXQgZnMud3JpdGVGaWxlQXN5bmMoZ2FtZVNldHRpbmdzUGF0aCwgbmV3RGF0YSwgeyBlbmNvZGluZzogJ3V0ZjgnIH0pO1xuICAgIH1cbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgYXBpLnNob3dFcnJvck5vdGlmaWNhdGlvbihcbiAgICAgICdGYWlsZWQgdG8gbWlncmF0ZScsIGVyciwge1xuICAgICAgICAvL21lc3NhZ2U6ICdQbGVhc2UgcnVuIHRoZSBnYW1lIGJlZm9yZSB5b3Ugc3RhcnQgbW9kZGluZycsXG4gICAgICAgIGFsbG93UmVwb3J0OiBmYWxzZSxcbiAgICB9KTtcbiAgfVxuXG4gIHRyeSB7XG4gICAgYXdhaXQgcmVhZFN0b3JlZExPKGFwaSk7XG4gICAgUGFrSW5mb0NhY2hlLmdldEluc3RhbmNlKGFwaSk7XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIGFwaS5zaG93RXJyb3JOb3RpZmljYXRpb24oXG4gICAgICAnRmFpbGVkIHRvIHJlYWQgbG9hZCBvcmRlcicsIGVyciwge1xuICAgICAgICBtZXNzYWdlOiAnUGxlYXNlIHJ1biB0aGUgZ2FtZSBiZWZvcmUgeW91IHN0YXJ0IG1vZGRpbmcnLFxuICAgICAgICBhbGxvd1JlcG9ydDogZmFsc2UsXG4gICAgfSk7XG4gIH1cblxuICBjb25zdCBsYXRlc3RWZXI6IHN0cmluZyA9IGdldExhdGVzdEluc3RhbGxlZExTTGliVmVyKGFwaSk7XG4gIGlmIChsYXRlc3RWZXIgPT09ICcwLjAuMCcpIHtcbiAgICBhd2FpdCBnaXRIdWJEb3dubG9hZGVyLmRvd25sb2FkRGl2aW5lKGFwaSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gbWFpbihjb250ZXh0OiB0eXBlcy5JRXh0ZW5zaW9uQ29udGV4dCkge1xuICBjb250ZXh0LnJlZ2lzdGVyUmVkdWNlcihbJ3NldHRpbmdzJywgJ2JhbGR1cnNnYXRlMyddLCByZWR1Y2VyKTtcblxuICBjb250ZXh0LnJlZ2lzdGVyR2FtZSh7XG4gICAgaWQ6IEdBTUVfSUQsXG4gICAgbmFtZTogJ0JhbGR1clxcJ3MgR2F0ZSAzJyxcbiAgICBtZXJnZU1vZHM6IHRydWUsXG4gICAgcXVlcnlQYXRoOiBmaW5kR2FtZSxcbiAgICBzdXBwb3J0ZWRUb29sczogcHJvY2Vzcy5wbGF0Zm9ybSA9PT0gJ2RhcndpbicgPyBbXSA6IFtcbiAgICAgIHtcbiAgICAgICAgaWQ6ICdleGV2dWxrYW4nLFxuICAgICAgICBuYW1lOiAnQmFsZHVyXFwncyBHYXRlIDMgKFZ1bGthbiknLFxuICAgICAgICBleGVjdXRhYmxlOiAoKSA9PiAnYmluL2JnMy5leGUnLFxuICAgICAgICByZXF1aXJlZEZpbGVzOiBbXG4gICAgICAgICAgJ2Jpbi9iZzMuZXhlJyxcbiAgICAgICAgXSxcbiAgICAgICAgcmVsYXRpdmU6IHRydWUsXG4gICAgICB9LFxuICAgIF0sXG4gICAgcXVlcnlNb2RQYXRoOiBtb2RzUGF0aCxcbiAgICBsb2dvOiAnZ2FtZWFydC5qcGcnLFxuICAgIGV4ZWN1dGFibGU6ICgpID0+IChwcm9jZXNzLnBsYXRmb3JtID09PSAnZGFyd2luJyA/ICdCYWxkdXJzIEdhdGUgMycgOiAnYmluL2JnM19keDExLmV4ZScpLFxuICAgIHNldHVwOiBkaXNjb3ZlcnkgPT4gcHJlcGFyZUZvck1vZGRpbmcoY29udGV4dC5hcGksIGRpc2NvdmVyeSkgYXMgYW55LFxuICAgIHJlcXVpcmVkRmlsZXM6IHByb2Nlc3MucGxhdGZvcm0gPT09ICdkYXJ3aW4nXG4gICAgICA/IFtcbiAgICAgICAgJ0JhbGR1cnMgR2F0ZSAzJyxcbiAgICAgIF1cbiAgICAgIDogW1xuICAgICAgICAnYmluL2JnM19keDExLmV4ZScsXG4gICAgICBdLFxuICAgIGVudmlyb25tZW50OiB7XG4gICAgICBTdGVhbUFQUElkOiBTVEVBTV9JRCxcbiAgICB9LFxuICAgIGRldGFpbHM6IHtcbiAgICAgIC8vIGlnbm9yZWQgZmlsZXMgdG8gYmUgbGVmdCBpbiBzdGFnaW5nIChwbHVnaW5zLnR4dCwgc2t5cmltLmluaSwgZXRjLilcbiAgICAgIHN0b3BQYXR0ZXJuczogU1RPUF9QQVRURVJOUy5tYXAodG9Xb3JkRXhwKSxcbiAgICAgIC8vIGFjY2VwdGVkIG1vZCBleHRlbnNpb25zIGZvciB0aGlzIGdhbWUgKHdoYXQgd2lsbCBiZSBjbGFpbWVkIGluIG1vZCBwYWdlKVxuICAgICAgc3VwcG9ydGVkVG9vbHM6IFtcbiAgICAgICAge1xuICAgICAgICAgIGlkOiAnZXhlJyxcbiAgICAgICAgICBuYW1lOiAnQmFsZHVyXFwncyBHYXRlIDMgKERYMTEpJyxcbiAgICAgICAgICBleGVjdXRhYmxlOiAnYmluL2JnM19keDExLmV4ZScsXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBpZDogJ2V4ZXZ1bGthbicsXG4gICAgICAgICAgbmFtZTogJ0JhbGR1clxcJ3MgR2F0ZSAzIChWdWxrYW4pJyxcbiAgICAgICAgICBleGVjdXRhYmxlOiAnYmluL2JnMy5leGUnLFxuICAgICAgICB9LFxuICAgICAgXSxcbiAgICAgIGdhbWVEYXRhUGF0aDogZ2V0R2FtZURhdGFQYXRoKGNvbnRleHQuYXBpKSxcbiAgICAgIHN1cHBvcnRlZE1vZFR5cGVzOiBbTU9EX1RZUEVfTFNMSUIsIE1PRF9UWVBFX0xPT1NFLCBNT0RfVFlQRV9CRzNTRSwgTU9EX1RZUEVfUkVQTEFDRVJdLFxuICAgICAgYXV0b0RlcGxveTogdHJ1ZSxcbiAgICAgIGlnbm9yZUNvbmZsaWN0czogSUdOT1JFX1BBVFRFUk5TLFxuICAgICAgc2hvd1dyb25nR2FtZVdhcm5pbmc6IHRydWUsXG4gICAgICBzaGVsbDogZmFsc2UsXG4gICAgfSxcbiAgfSk7XG5cbiAgY29udGV4dC5yZWdpc3RlclNldHRpbmdzKCdNb2RzJywgU2V0dGluZ3MpO1xuXG4gIC8vIGNvbnRleHQucmVnaXN0ZXJNb2RUeXBlKE1PRF9UWVBFX1JFUExBQ0VSLCA5OClcbiAgLy8gY29udGV4dC5yZWdpc3Rlck1vZFR5cGUoTU9EX1RZUEVfTFNMSUIsIDk5KVxuICAvLyBjb250ZXh0LnJlZ2lzdGVyTW9kVHlwZShNT0RfVFlQRV9CRzNTRSwgMTAwKVxuICAvLyBjb250ZXh0LnJlZ2lzdGVyTW9kVHlwZShNT0RfVFlQRV9MT09TRSwgMjAwKVxuXG4gIC8vIExvb3NlIG1vZHMgbXVzdCBiZSByZXJvdXRlZCB0byB0aGUgdXNlciBtb2RzIGZvbGRlci4gQkczIGNhbiB0aHJvdyBleGNlcHRpb25zXG4gIC8vIHdoZW4gbW9kcyBhcmUgbW92ZWQsIHNvIHdlIG11c3QgbW92ZSB0aGUgbW9kcyBvdXJzZWx2ZXMgYW5kIHRoZSBkaXNwYXRjaCB0aGUgY2hhbmdlLlxuICBjb250ZXh0LnJlZ2lzdGVyTW9kVHlwZShcbiAgICBNT0RfVFlQRV9MT09TRSxcbiAgICAyMDAsXG4gICAgKGdhbWVJZCkgPT4gZ2FtZUlkID09PSBHQU1FX0lELFxuICAgIChfZ2FtZSkgPT4gbW9kc1BhdGgoKSxcbiAgICAoaW5zdHJ1Y3Rpb25zKSA9PiBQcm9taXNlLnJlc29sdmUoaXNMb29zZShpbnN0cnVjdGlvbnMpKSxcbiAgKTtcbiAgY29udGV4dC5yZWdpc3Rlck1vZFR5cGUoXG4gICAgTU9EX1RZUEVfUkVQTEFDRVIsXG4gICAgMTAwLFxuICAgIChnYW1lSWQpID0+IGdhbWVJZCA9PT0gR0FNRV9JRCxcbiAgICAoX2dhbWUpID0+IGdldEdhbWVQYXRoKGNvbnRleHQuYXBpKSxcbiAgICAoaW5zdHJ1Y3Rpb25zKSA9PiBQcm9taXNlLnJlc29sdmUoaXNSZXBsYWNlcihjb250ZXh0LmFwaSwgaW5zdHJ1Y3Rpb25zKSksXG4gICk7XG4gIGNvbnRleHQucmVnaXN0ZXJNb2RUeXBlKFxuICAgIE1PRF9UWVBFX0xTTElCLFxuICAgIDk5LFxuICAgIChnYW1lSWQpID0+IGdhbWVJZCA9PT0gR0FNRV9JRCxcbiAgICAoX2dhbWUpID0+IGdldEdhbWVQYXRoKGNvbnRleHQuYXBpKSxcbiAgICAoaW5zdHJ1Y3Rpb25zKSA9PiBQcm9taXNlLnJlc29sdmUoaXNMU0xpYihpbnN0cnVjdGlvbnMpKSxcbiAgKTtcbiAgY29udGV4dC5yZWdpc3Rlck1vZFR5cGUoXG4gICAgTU9EX1RZUEVfQkczU0UsXG4gICAgMTAwLFxuICAgIChnYW1lSWQpID0+IGdhbWVJZCA9PT0gR0FNRV9JRCxcbiAgICAoX2dhbWUpID0+IHBhdGguam9pbihnZXRHYW1lUGF0aChjb250ZXh0LmFwaSksICdiaW4nKSxcbiAgICAoaW5zdHJ1Y3Rpb25zKSA9PiBQcm9taXNlLnJlc29sdmUoaXNCRzNTRShpbnN0cnVjdGlvbnMpKSxcbiAgKTtcblxuICBjb250ZXh0LnJlZ2lzdGVyQWN0aW9uKCdtb2RzLWFjdGlvbi1pY29ucycsIDk5OSwgJ3VwZGF0ZScsIHt9LCAnQ2hlY2sgTW9kIFZlcnNpb25zJywgKGluc3RhbmNlSWRzKSA9PiB7XG4gICAgICB2b2lkIG9uQ2hlY2tNb2RWZXJzaW9uKGNvbnRleHQuYXBpLCBzZWxlY3RvcnMuYWN0aXZlR2FtZUlkKGNvbnRleHQuYXBpLmdldFN0YXRlKCkpLCBbXSk7XG4gIH0pO1xuXG4gIGNvbnRleHQub25jZSgoKSA9PiB7XG4gICAgY29udGV4dC5hcGkub25Bc3luYygnZGlkLWRlcGxveScsIChwcm9maWxlSWQsIHByb2ZpbGVUeXBlLCBkZXBsb3ltZW50KSA9PiB7XG4gICAgICBmb3JjZVJlZnJlc2goY29udGV4dC5hcGkpO1xuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xuICAgIH0pO1xuICB9KTtcblxufVxuXG5leHBvcnQgZGVmYXVsdCBtYWluO1xuIl19