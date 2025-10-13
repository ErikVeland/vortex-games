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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50c3giXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFXQSx3REFBZ0M7QUFFaEMsMkNBQTZCO0FBRTdCLDJDQUF3RDtBQUV4RCxxQ0FFa0I7QUFDbEIscUVBQXVEO0FBQ3ZELDBEQUFrQztBQUNsQywwREFBaUM7QUFDakMsNkNBQXVDO0FBRXZDLGlDQVVnQjtBQVFoQix5Q0FFb0I7QUFFcEIsMkNBSXFCO0FBR3JCLG9EQUFtQztBQUVuQyxNQUFNLGFBQWEsR0FBRyxDQUFDLGNBQWMsQ0FBQyxDQUFDO0FBRXZDLE1BQU0sTUFBTSxHQUFHLFlBQVksQ0FBQztBQUM1QixNQUFNLFFBQVEsR0FBRyxTQUFTLENBQUM7QUFFM0IsU0FBUyxTQUFTLENBQUMsS0FBSztJQUN0QixPQUFPLE9BQU8sR0FBRyxLQUFLLEdBQUcsT0FBTyxDQUFDO0FBQ25DLENBQUM7QUFFRCxTQUFTLFFBQVE7SUFDZixPQUFPLGlCQUFJLENBQUMsZUFBZSxDQUFDLFdBQVcsQ0FBQyxDQUFDLE1BQU0sRUFBRSxRQUFRLENBQUMsQ0FBQztTQUN4RCxJQUFJLENBQUMsQ0FBTSxJQUFJLEVBQUMsRUFBRTtRQUNqQixNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDO1FBQy9CLElBQUksT0FBTyxDQUFDLFFBQVEsS0FBSyxRQUFRLEVBQUUsQ0FBQztZQUNsQyxNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxxQkFBcUIsRUFBRSxVQUFVLEVBQUUsT0FBTyxDQUFDLENBQUM7WUFDakYsSUFBSSxDQUFDO2dCQUNILE1BQU0sZUFBRSxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsQ0FBQztnQkFDN0IsT0FBTyxRQUFRLENBQUM7WUFDbEIsQ0FBQztZQUFDLE9BQU8sR0FBRyxFQUFFLENBQUM7WUFFZixDQUFDO1FBQ0gsQ0FBQztRQUNELE9BQU8sUUFBUSxDQUFDO0lBQ2xCLENBQUMsQ0FBQSxDQUFDLENBQUM7QUFDUCxDQUFDO0FBRUQsU0FBZSxtQkFBbUIsQ0FBQyxHQUF3QixFQUFFLFNBQWlDOztRQUM1RixJQUFJLFNBQVMsYUFBVCxTQUFTLHVCQUFULFNBQVMsQ0FBRSxJQUFJLEVBQUUsQ0FBQztZQUNwQixNQUFNLFdBQVcsR0FBRyxNQUFNLElBQUEsd0JBQWlCLEVBQUMsR0FBRyxDQUFDLENBQUM7WUFDakQsSUFBSSxDQUFDO2dCQUNILE1BQU0sZUFBRSxDQUFDLHNCQUFzQixDQUFDLFdBQVcsQ0FBQyxDQUFDO2dCQUM3QyxNQUFNLG1CQUFtQixHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsV0FBVyxFQUFFLGlCQUFpQixDQUFDLENBQUM7Z0JBQ3RFLElBQUksQ0FBQztvQkFDSCxNQUFNLGVBQUUsQ0FBQyxTQUFTLENBQUMsbUJBQW1CLENBQUMsQ0FBQztnQkFDMUMsQ0FBQztnQkFBQyxPQUFPLEdBQUcsRUFBRSxDQUFDO29CQUNiLE1BQU0sa0JBQWtCLEdBQUcsTUFBTSxJQUFBLDRCQUFxQixFQUFDLEdBQUcsQ0FBQyxDQUFDO29CQUM1RCxNQUFNLGVBQUUsQ0FBQyxjQUFjLENBQUMsbUJBQW1CLEVBQUUsa0JBQWtCLEVBQUUsRUFBRSxRQUFRLEVBQUUsTUFBTSxFQUFFLENBQUMsQ0FBQztnQkFDekYsQ0FBQztZQUNILENBQUM7WUFBQyxPQUFPLEdBQUcsRUFBRSxDQUFDO2dCQUNiLE9BQU8sT0FBTyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUM3QixDQUFDO1FBQ0gsQ0FBQztJQUNILENBQUM7Q0FBQTtBQUVELFNBQWUsaUJBQWlCLENBQUMsR0FBd0IsRUFBRSxTQUFTOztRQUNsRSxNQUFNLEVBQUUsR0FBRyxJQUFBLGVBQVEsR0FBRSxDQUFDO1FBRXRCLE1BQU0sTUFBTSxHQUFHLE1BQU0sSUFBQSxrQ0FBMkIsRUFBQyxHQUFHLENBQUMsQ0FBQztRQUN0RCxJQUFJLENBQUMsQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUM7WUFDbkMscUNBQXFDLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDN0MsQ0FBQztRQUVELE9BQU8sZUFBRSxDQUFDLFNBQVMsQ0FBQyxFQUFFLENBQUM7YUFDcEIsS0FBSyxDQUFDLEdBQUcsRUFBRSxDQUFDLGVBQUUsQ0FBQyxzQkFBc0IsQ0FBQyxFQUFFLEVBQUUsR0FBRyxFQUFFLENBQUMsa0JBQVEsQ0FBQyxPQUFPLEVBQVMsQ0FBQyxDQUFDO2FBQzNFLE9BQU8sQ0FBQyxHQUFHLEVBQUUsQ0FBQyxtQkFBbUIsQ0FBQyxHQUFHLEVBQUUsU0FBUyxDQUFDLENBQUMsQ0FBQztJQUN4RCxDQUFDO0NBQUE7QUFFRCxTQUFTLHFDQUFxQyxDQUFDLEdBQXdCOztJQUVyRSxNQUFNLElBQUksR0FBRyxNQUFBLE1BQUEsR0FBRyxDQUFDLEtBQUssQ0FBQyxRQUFRLEVBQUUsQ0FBQyxVQUFVLDBDQUFFLElBQUksMENBQUUsWUFBWSxDQUFDO0lBQ2pFLElBQUcsSUFBSSxLQUFLLFNBQVMsRUFBRSxDQUFDO1FBQ3RCLE1BQU0sUUFBUSxHQUFpQixJQUFJLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQztRQUMvRCxJQUFBLGVBQVEsRUFBQyxVQUFVLEVBQUUsUUFBUSxDQUFDLENBQUM7UUFFL0IsTUFBTSxpQkFBaUIsR0FBWSxRQUFRLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxFQUFFLFdBQUMsT0FBQSxDQUFDLENBQUMsQ0FBQSxNQUFBLEdBQUcsYUFBSCxHQUFHLHVCQUFILEdBQUcsQ0FBRSxVQUFVLDBDQUFFLFFBQVEsQ0FBQSxDQUFBLEVBQUEsQ0FBQyxDQUFDLE1BQU0sSUFBSSxDQUFDLENBQUM7UUFDbkcsSUFBQSxlQUFRLEVBQUMsbUJBQW1CLEVBQUUsaUJBQWlCLENBQUMsQ0FBQztRQUdqRCxJQUFHLGlCQUFpQixFQUFFLENBQUM7WUFDckIsT0FBTztRQUNULENBQUM7SUFDSCxDQUFDO0lBR0QsR0FBRyxDQUFDLGdCQUFnQixDQUFDO1FBQ25CLElBQUksRUFBRSxTQUFTO1FBQ2YsS0FBSyxFQUFFLGlCQUFpQjtRQUN4QixPQUFPLEVBQUUsNkJBQTZCO1FBQ3RDLEVBQUUsRUFBRSxxQkFBcUI7UUFDekIsYUFBYSxFQUFFLElBQUk7UUFDbkIsT0FBTyxFQUFFO1lBQ1A7Z0JBQ0UsS0FBSyxFQUFFLE1BQU0sRUFBRSxNQUFNLEVBQUUsT0FBTyxDQUFDLEVBQUU7b0JBQy9CLEdBQUcsQ0FBQyxVQUFVLENBQUMsVUFBVSxFQUFFLGtCQUFrQixFQUFFO3dCQUM3QyxJQUFJLEVBQ0YsOEZBQThGOzRCQUM5RixnR0FBZ0c7cUJBQ25HLEVBQUU7d0JBQ0QsRUFBRSxLQUFLLEVBQUUsU0FBUyxFQUFFO3dCQUNwQixFQUFFLEtBQUssRUFBRSxpQkFBaUIsRUFBRSxPQUFPLEVBQUUsSUFBSSxFQUFFO3FCQUM1QyxDQUFDO3lCQUNDLElBQUksQ0FBQyxNQUFNLENBQUMsRUFBRTt3QkFDYixPQUFPLEVBQUUsQ0FBQzt3QkFDVixJQUFJLE1BQU0sQ0FBQyxNQUFNLEtBQUssaUJBQWlCLEVBQUUsQ0FBQzs0QkFDeEMsaUJBQUksQ0FBQyxHQUFHLENBQUMsaUVBQWlFLENBQUMsQ0FBQyxLQUFLLENBQUMsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLENBQUE7d0JBQy9GLENBQUM7NkJBQU0sSUFBSSxNQUFNLENBQUMsTUFBTSxLQUFLLFFBQVEsRUFBRSxDQUFDO3dCQUV4QyxDQUFDO3dCQUNELE9BQU8sT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFDO29CQUMzQixDQUFDLENBQUMsQ0FBQztnQkFDUCxDQUFDO2FBQ0Y7U0FDRjtLQUNGLENBQUMsQ0FBQztBQUNMLENBQUM7QUFFRCxTQUFlLGlCQUFpQixDQUFDLEdBQXdCLEVBQUUsTUFBYyxFQUFFLElBQWtCOztRQUMzRixNQUFNLE9BQU8sR0FBRyxzQkFBUyxDQUFDLGFBQWEsQ0FBQyxHQUFHLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQztRQUN4RCxJQUFJLE9BQU8sQ0FBQyxNQUFNLEtBQUssZ0JBQU8sSUFBSSxNQUFNLEtBQUssZ0JBQU8sRUFBRSxDQUFDO1lBQ3JELE9BQU87UUFDVCxDQUFDO1FBRUQsTUFBTSxTQUFTLEdBQVcsSUFBQSxpQ0FBMEIsRUFBQyxHQUFHLENBQUMsQ0FBQztRQUUxRCxJQUFJLFNBQVMsS0FBSyxPQUFPLEVBQUUsQ0FBQztZQUUxQixPQUFPO1FBQ1QsQ0FBQztRQUVELE1BQU0sU0FBUyxHQUFXLE1BQU0sZ0JBQWdCLENBQUMsZUFBZSxDQUFDLEdBQUcsRUFBRSxTQUFTLENBQUMsQ0FBQztRQUNqRixJQUFJLENBQUMsU0FBUyxJQUFJLFNBQVMsS0FBSyxTQUFTLEVBQUUsQ0FBQztZQUMxQyxPQUFPO1FBQ1QsQ0FBQztJQUNILENBQUM7Q0FBQTtBQUVELFNBQWUsbUJBQW1CLENBQUMsR0FBd0IsRUFBRSxNQUFjOztRQUN6RSxJQUFJLE1BQU0sS0FBSyxnQkFBTyxFQUFFLENBQUM7WUFDdkIsZUFBWSxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQztZQUNyQyxPQUFPO1FBQ1QsQ0FBQztRQUNELElBQUksQ0FBQztZQUNILE1BQU0sSUFBQSxvQkFBTyxFQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQ25CLE1BQU0sWUFBWSxHQUFHLE1BQU0sSUFBQSw2QkFBc0IsRUFBQyxHQUFHLENBQUMsQ0FBQztZQUN2RCxNQUFNLGdCQUFnQixHQUFXLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBQSxtQkFBWSxHQUFFLEVBQUUsWUFBWSxFQUFFLGlCQUFpQixDQUFDLENBQUM7WUFDNUYsSUFBSSxLQUFLLEdBQUcsTUFBTSxJQUFBLG9CQUFRLEVBQUMsZ0JBQWdCLENBQUMsQ0FBQztZQUM3QyxNQUFNLEVBQUUsUUFBUSxFQUFFLGFBQWEsRUFBRSxHQUFHLEtBQUssQ0FBQztZQUMxQyxJQUFJLENBQUMsUUFBUSxDQUFDLFFBQVEsS0FBSyxTQUFTLENBQUMsSUFBSSxDQUFFLFFBQVEsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFTLEtBQUssRUFBRSxDQUFDLEVBQUUsQ0FBQztnQkFDaEYsUUFBUSxDQUFDLFFBQVEsR0FBRyxDQUFDLEVBQUUsSUFBSSxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUM7WUFDckMsQ0FBQztZQUdELE1BQU0sTUFBTSxHQUFHLE1BQU0sSUFBQSxrQ0FBMkIsRUFBQyxHQUFHLENBQUMsQ0FBQztZQUN0RCxJQUFJLGFBQWEsS0FBSyxTQUFTLElBQUksQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUM7Z0JBQ2pFLE1BQU0sUUFBUSxHQUFHLE1BQU0sS0FBSyxJQUFJLENBQUMsQ0FBQyxDQUFDLG9CQUFhLENBQUMsQ0FBQyxDQUFDLGtCQUFXLENBQUM7Z0JBQy9ELE1BQU0sSUFBSSxHQUFHLE1BQU0sZUFBRSxDQUFDLGFBQWEsQ0FBQyxnQkFBZ0IsRUFBRSxFQUFFLFFBQVEsRUFBRSxNQUFNLEVBQUUsQ0FBQyxDQUFDO2dCQUM1RSxNQUFNLE9BQU8sR0FBRyxNQUFNLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFDckMsTUFBTSxlQUFFLENBQUMsV0FBVyxDQUFDLGdCQUFnQixDQUFDLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUM7Z0JBQ3ZFLE1BQU0sZUFBRSxDQUFDLGNBQWMsQ0FBQyxnQkFBZ0IsRUFBRSxPQUFPLEVBQUUsRUFBRSxRQUFRLEVBQUUsTUFBTSxFQUFFLENBQUMsQ0FBQztZQUMzRSxDQUFDO1FBQ0gsQ0FBQztRQUFDLE9BQU8sR0FBRyxFQUFFLENBQUM7WUFDYixHQUFHLENBQUMscUJBQXFCLENBQ3ZCLG1CQUFtQixFQUFFLEdBQUcsRUFBRTtnQkFFeEIsV0FBVyxFQUFFLEtBQUs7YUFDckIsQ0FBQyxDQUFDO1FBQ0wsQ0FBQztRQUVELElBQUksQ0FBQztZQUNILE1BQU0sSUFBQSxtQkFBWSxFQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQ3hCLGVBQVksQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDaEMsQ0FBQztRQUFDLE9BQU8sR0FBRyxFQUFFLENBQUM7WUFDYixHQUFHLENBQUMscUJBQXFCLENBQ3ZCLDJCQUEyQixFQUFFLEdBQUcsRUFBRTtnQkFDaEMsT0FBTyxFQUFFLDhDQUE4QztnQkFDdkQsV0FBVyxFQUFFLEtBQUs7YUFDckIsQ0FBQyxDQUFDO1FBQ0wsQ0FBQztRQUVELE1BQU0sU0FBUyxHQUFXLElBQUEsaUNBQTBCLEVBQUMsR0FBRyxDQUFDLENBQUM7UUFDMUQsSUFBSSxTQUFTLEtBQUssT0FBTyxFQUFFLENBQUM7WUFDMUIsTUFBTSxnQkFBZ0IsQ0FBQyxjQUFjLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDN0MsQ0FBQztJQUNILENBQUM7Q0FBQTtBQUVELFNBQVMsSUFBSSxDQUFDLE9BQWdDO0lBQzVDLE9BQU8sQ0FBQyxlQUFlLENBQUMsQ0FBQyxVQUFVLEVBQUUsY0FBYyxDQUFDLEVBQUUsa0JBQU8sQ0FBQyxDQUFDO0lBRS9ELE9BQU8sQ0FBQyxZQUFZLENBQUM7UUFDbkIsRUFBRSxFQUFFLGdCQUFPO1FBQ1gsSUFBSSxFQUFFLGtCQUFrQjtRQUN4QixTQUFTLEVBQUUsSUFBSTtRQUNmLFNBQVMsRUFBRSxRQUFRO1FBQ25CLGNBQWMsRUFBRSxPQUFPLENBQUMsUUFBUSxLQUFLLFFBQVEsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUNuRDtnQkFDRSxFQUFFLEVBQUUsV0FBVztnQkFDZixJQUFJLEVBQUUsMkJBQTJCO2dCQUNqQyxVQUFVLEVBQUUsR0FBRyxFQUFFLENBQUMsYUFBYTtnQkFDL0IsYUFBYSxFQUFFO29CQUNiLGFBQWE7aUJBQ2Q7Z0JBQ0QsUUFBUSxFQUFFLElBQUk7YUFDZjtTQUNGO1FBQ0QsWUFBWSxFQUFFLGVBQVE7UUFDdEIsSUFBSSxFQUFFLGFBQWE7UUFDbkIsVUFBVSxFQUFFLEdBQUcsRUFBRSxDQUFDLENBQUMsT0FBTyxDQUFDLFFBQVEsS0FBSyxRQUFRLENBQUMsQ0FBQyxDQUFDLGdCQUFnQixDQUFDLENBQUMsQ0FBQyxrQkFBa0IsQ0FBQztRQUN6RixLQUFLLEVBQUUsU0FBUyxDQUFDLEVBQUUsQ0FBQyxpQkFBaUIsQ0FBQyxPQUFPLENBQUMsR0FBRyxFQUFFLFNBQVMsQ0FBUTtRQUNwRSxhQUFhLEVBQUUsT0FBTyxDQUFDLFFBQVEsS0FBSyxRQUFRO1lBQzFDLENBQUMsQ0FBQztnQkFDQSxnQkFBZ0I7YUFDakI7WUFDRCxDQUFDLENBQUM7Z0JBQ0Esa0JBQWtCO2FBQ25CO1FBQ0gsV0FBVyxFQUFFO1lBQ1gsVUFBVSxFQUFFLFFBQVE7U0FDckI7UUFDRCxPQUFPLEVBQUU7WUFFUCxZQUFZLEVBQUUsYUFBYSxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUM7WUFFMUMsY0FBYyxFQUFFO2dCQUNkO29CQUNFLEVBQUUsRUFBRSxLQUFLO29CQUNULElBQUksRUFBRSx5QkFBeUI7b0JBQy9CLFVBQVUsRUFBRSxrQkFBa0I7aUJBQy9CO2dCQUNEO29CQUNFLEVBQUUsRUFBRSxXQUFXO29CQUNmLElBQUksRUFBRSwyQkFBMkI7b0JBQ2pDLFVBQVUsRUFBRSxhQUFhO2lCQUMxQjthQUNGO1lBQ0QsWUFBWSxFQUFFLElBQUEsc0JBQWUsRUFBQyxPQUFPLENBQUMsR0FBRyxDQUFDO1lBQzFDLGlCQUFpQixFQUFFLENBQUMsdUJBQWMsRUFBRSx1QkFBYyxFQUFFLHVCQUFjLEVBQUUsMEJBQWlCLENBQUM7WUFDdEYsVUFBVSxFQUFFLElBQUk7WUFDaEIsZUFBZSxFQUFFLHdCQUFlO1lBQ2hDLG9CQUFvQixFQUFFLElBQUk7WUFDMUIsS0FBSyxFQUFFLEtBQUs7U0FDYjtLQUNGLENBQUMsQ0FBQztJQUVILE9BQU8sQ0FBQyxnQkFBZ0IsQ0FBQyxNQUFNLEVBQUUsa0JBQVEsQ0FBQyxDQUFDO0lBUzNDLE9BQU8sQ0FBQyxlQUFlLENBQ3JCLHVCQUFjLEVBQ2QsR0FBRyxFQUNILENBQUMsTUFBTSxFQUFFLEVBQUUsQ0FBQyxNQUFNLEtBQUssZ0JBQU8sRUFDOUIsQ0FBQyxLQUFLLEVBQUUsRUFBRSxDQUFDLElBQUEsZUFBUSxHQUFFLEVBQ3JCLENBQUMsWUFBWSxFQUFFLEVBQUUsQ0FBQyxrQkFBUSxDQUFDLE9BQU8sQ0FBQyxJQUFBLGtCQUFPLEVBQUMsWUFBWSxDQUFDLENBQUMsQ0FDMUQsQ0FBQztJQUNGLE9BQU8sQ0FBQyxlQUFlLENBQ3JCLDBCQUFpQixFQUNqQixHQUFHLEVBQ0gsQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDLE1BQU0sS0FBSyxnQkFBTyxFQUM5QixDQUFDLEtBQUssRUFBRSxFQUFFLENBQUMsSUFBQSxrQkFBVyxFQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsRUFDbkMsQ0FBQyxZQUFZLEVBQUUsRUFBRSxDQUFDLGtCQUFRLENBQUMsT0FBTyxDQUFDLElBQUEscUJBQVUsRUFBQyxPQUFPLENBQUMsR0FBRyxFQUFFLFlBQVksQ0FBQyxDQUFDLENBQzFFLENBQUM7SUFDRixPQUFPLENBQUMsZUFBZSxDQUNyQix1QkFBYyxFQUNkLEVBQUUsRUFDRixDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUMsTUFBTSxLQUFLLGdCQUFPLEVBQzlCLENBQUMsS0FBSyxFQUFFLEVBQUUsQ0FBQyxJQUFBLGtCQUFXLEVBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxFQUNuQyxDQUFDLFlBQVksRUFBRSxFQUFFLENBQUMsa0JBQVEsQ0FBQyxPQUFPLENBQUMsSUFBQSxrQkFBTyxFQUFDLFlBQVksQ0FBQyxDQUFDLENBQzFELENBQUM7SUFDRixPQUFPLENBQUMsZUFBZSxDQUNyQix1QkFBYyxFQUNkLEdBQUcsRUFDSCxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUMsTUFBTSxLQUFLLGdCQUFPLEVBQzlCLENBQUMsS0FBSyxFQUFFLEVBQUUsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUEsa0JBQVcsRUFBQyxPQUFPLENBQUMsR0FBRyxDQUFDLEVBQUUsS0FBSyxDQUFDLEVBQ3JELENBQUMsWUFBWSxFQUFFLEVBQUUsQ0FBQyxrQkFBUSxDQUFDLE9BQU8sQ0FBQyxJQUFBLGtCQUFPLEVBQUMsWUFBWSxDQUFDLENBQUMsQ0FDMUQsQ0FBQztJQUVGLE9BQU8sQ0FBQyxjQUFjLENBQUMsbUJBQW1CLEVBQUUsR0FBRyxFQUFFLFFBQVEsRUFBRSxFQUFFLEVBQUUsb0JBQW9CLEVBQUUsQ0FBQyxXQUFXLEVBQUUsRUFBRTtRQUNqRyxLQUFLLGlCQUFpQixDQUFDLE9BQU8sQ0FBQyxHQUFHLEVBQUUsc0JBQVMsQ0FBQyxZQUFZLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO0lBQzVGLENBQUMsQ0FBQyxDQUFDO0lBRUgsT0FBTyxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUU7UUFDaEIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsWUFBWSxFQUFFLENBQUMsU0FBUyxFQUFFLFdBQVcsRUFBRSxVQUFVLEVBQUUsRUFBRTtZQUN2RSxJQUFBLG1CQUFZLEVBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQzFCLE9BQU8sa0JBQVEsQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUM1QixDQUFDLENBQUMsQ0FBQztJQUNMLENBQUMsQ0FBQyxDQUFDO0FBRUwsQ0FBQztBQUVELGtCQUFlLElBQUksQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGlzV2luZG93cyB9IGZyb20gJy4uLy4uLy4uL3NyYy91dGlsL3BsYXRmb3JtJztcbi8qIGVzbGludC1kaXNhYmxlICovXG4vKipcbiAqIEltcG9ydGFudCAtIGFsdGhvdWdoIHdlIG5vIGxvbmdlciBkZWZpbmUgdGhlIGluZm8gcGFuZWwgaGVyZSxcbiAqICB3ZSBzdGlsbCBuZWVkIHRvIGtlZXAgdGhlIGluZGV4IGZpbGUncyAnLnRzeCcgZXh0ZW5zaW9uLlxuICogIEF0IGxlYXN0IHdoaWxlIG91ciB1cGRhdGUgcHJvY2VzcyBmb3IgYnVuZGxlZCBwbHVnaW5zIHJlbWFpbnNcbiAqICB0aHJvdWdoIHRoZSAncmVsZWFzZScgYnJhbmNoLlxuICogXG4gKiBSZW1vdmluZyBmaWxlcyBmcm9tIGJ1bmRsZWQgcGx1Z2lucyB3aXRob3V0IHN0dWJiaW5nIHRoZSBleHRlbnNpb25cbiAqICBjYW4gcG90ZW50aWFsbHkgYnJlYWsgdGhlIGV4dGVuc2lvbiBvbiB0aGUgdXNlcidzIGVuZC5cbiAqL1xuaW1wb3J0IEJsdWViaXJkIGZyb20gJ2JsdWViaXJkJztcbmltcG9ydCAqIGFzIF8gZnJvbSAnbG9kYXNoJztcbmltcG9ydCAqIGFzIHBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgKiBhcyBSZWFjdCBmcm9tICdyZWFjdCc7XG5pbXBvcnQgeyBmcywgc2VsZWN0b3JzLCB0eXBlcywgdXRpbCB9IGZyb20gJ3ZvcnRleC1hcGknO1xuXG5pbXBvcnQgeyBHQU1FX0lELCBJR05PUkVfUEFUVEVSTlMsXG4gIE1PRF9UWVBFX0JHM1NFLCBNT0RfVFlQRV9MT09TRSwgTU9EX1RZUEVfTFNMSUIsIE1PRF9UWVBFX1JFUExBQ0VSLFxufSBmcm9tICcuL2NvbW1vbic7XG5pbXBvcnQgKiBhcyBnaXRIdWJEb3dubG9hZGVyIGZyb20gJy4vZ2l0aHViRG93bmxvYWRlcic7XG5pbXBvcnQgU2V0dGluZ3MgZnJvbSAnLi9TZXR0aW5ncyc7XG5pbXBvcnQgcmVkdWNlciBmcm9tICcuL3JlZHVjZXJzJztcbmltcG9ydCB7IG1pZ3JhdGUgfSBmcm9tICcuL21pZ3JhdGlvbnMnO1xuXG5pbXBvcnQge1xuICBsb2dEZWJ1ZywgZm9yY2VSZWZyZXNoLCBnZXRMYXRlc3RJbnN0YWxsZWRMU0xpYlZlcixcbiAgZ2V0R2FtZURhdGFQYXRoLCBnZXRHYW1lUGF0aCwgZ2xvYmFsUHJvZmlsZVBhdGgsIG1vZHNQYXRoLFxuICBnZXRMYXRlc3RMU0xpYk1vZCwgZ2V0T3duR2FtZVZlcnNpb24sIHJlYWRTdG9yZWRMTyxcbiAgZ2V0RGVmYXVsdE1vZFNldHRpbmdzLFxuICBnZXREZWZhdWx0TW9kU2V0dGluZ3NGb3JtYXQsXG4gIGdldEFjdGl2ZVBsYXllclByb2ZpbGUsXG4gIHByb2ZpbGVzUGF0aCxcbiAgY29udmVydFY2dG9WNyxcbiAgY29udmVydFRvVjgsXG59IGZyb20gJy4vdXRpbCc7XG5cbi8vIFJlbW92ZWQgaW5jb3JyZWN0IGluc3RhbGxlcnMgaW1wb3J0XG4vLyBpbXBvcnQge1xuLy8gICB0ZXN0TFNMaWIsIHRlc3RCRzNTRSwgdGVzdEVuZ2luZUluamVjdG9yLCB0ZXN0TW9kRml4ZXIsIHRlc3RSZXBsYWNlcixcbi8vICAgaW5zdGFsbExTTGliLCBpbnN0YWxsQkczU0UsIGluc3RhbGxFbmdpbmVJbmplY3RvciwgaW5zdGFsbE1vZEZpeGVyLCBpbnN0YWxsUmVwbGFjZXIsXG4vLyB9IGZyb20gJy4vaW5zdGFsbGVycyc7XG5cbmltcG9ydCB7XG4gIGlzQkczU0UsIGlzTFNMaWIsIGlzTG9vc2UsIGlzUmVwbGFjZXIsXG59IGZyb20gJy4vbW9kVHlwZXMnO1xuXG5pbXBvcnQge1xuICBkZXNlcmlhbGl6ZSwgaW1wb3J0TW9kU2V0dGluZ3NGaWxlLCBpbXBvcnRNb2RTZXR0aW5nc0dhbWUsXG4gIGltcG9ydEZyb21CRzNNTSwgc2VyaWFsaXplLCBleHBvcnRUb0dhbWUsIGV4cG9ydFRvRmlsZSwgdmFsaWRhdGUsXG4gIGdldE5vZGVzLFxufSBmcm9tICcuL2xvYWRPcmRlcic7XG5cbmltcG9ydCB7IEluZm9QYW5lbFdyYXAgfSBmcm9tICcuL0luZm9QYW5lbCdcbmltcG9ydCBQYWtJbmZvQ2FjaGUgZnJvbSAnLi9jYWNoZSc7XG5cbmNvbnN0IFNUT1BfUEFUVEVSTlMgPSBbJ1teL10qXFxcXC5wYWskJ107XG5cbmNvbnN0IEdPR19JRCA9ICcxNDU2NDYwNjY5JztcbmNvbnN0IFNURUFNX0lEID0gJzEwODY5NDAnO1xuXG5mdW5jdGlvbiB0b1dvcmRFeHAoaW5wdXQpIHtcbiAgcmV0dXJuICcoXnwvKScgKyBpbnB1dCArICcoL3wkKSc7XG59XG5cbmZ1bmN0aW9uIGZpbmRHYW1lKCk6IGFueSB7XG4gIHJldHVybiB1dGlsLkdhbWVTdG9yZUhlbHBlci5maW5kQnlBcHBJZChbR09HX0lELCBTVEVBTV9JRF0pXG4gICAgLnRoZW4oYXN5bmMgZ2FtZSA9PiB7XG4gICAgICBjb25zdCBiYXNlUGF0aCA9IGdhbWUuZ2FtZVBhdGg7XG4gICAgICBpZiAocHJvY2Vzcy5wbGF0Zm9ybSA9PT0gJ2RhcndpbicpIHtcbiAgICAgICAgY29uc3QgbWFjT1NEaXIgPSBwYXRoLmpvaW4oYmFzZVBhdGgsIFwiQmFsZHVyJ3MgR2F0ZSAzLmFwcFwiLCAnQ29udGVudHMnLCAnTWFjT1MnKTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBhd2FpdCBmcy5zdGF0QXN5bmMobWFjT1NEaXIpO1xuICAgICAgICAgIHJldHVybiBtYWNPU0RpcjtcbiAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgLy8gZmFsbCBiYWNrIHRvIHRoZSBzdG9yZS1wcm92aWRlZCBwYXRoXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiBiYXNlUGF0aDtcbiAgICB9KTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gZW5zdXJlR2xvYmFsUHJvZmlsZShhcGk6IHR5cGVzLklFeHRlbnNpb25BcGksIGRpc2NvdmVyeTogdHlwZXMuSURpc2NvdmVyeVJlc3VsdCkge1xuICBpZiAoZGlzY292ZXJ5Py5wYXRoKSB7XG4gICAgY29uc3QgcHJvZmlsZVBhdGggPSBhd2FpdCBnbG9iYWxQcm9maWxlUGF0aChhcGkpO1xuICAgIHRyeSB7XG4gICAgICBhd2FpdCBmcy5lbnN1cmVEaXJXcml0YWJsZUFzeW5jKHByb2ZpbGVQYXRoKTtcbiAgICAgIGNvbnN0IG1vZFNldHRpbmdzRmlsZVBhdGggPSBwYXRoLmpvaW4ocHJvZmlsZVBhdGgsICdtb2RzZXR0aW5ncy5sc3gnKTtcbiAgICAgIHRyeSB7XG4gICAgICAgIGF3YWl0IGZzLnN0YXRBc3luYyhtb2RTZXR0aW5nc0ZpbGVQYXRoKTtcbiAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICBjb25zdCBkZWZhdWx0TW9kU2V0dGluZ3MgPSBhd2FpdCBnZXREZWZhdWx0TW9kU2V0dGluZ3MoYXBpKTtcbiAgICAgICAgYXdhaXQgZnMud3JpdGVGaWxlQXN5bmMobW9kU2V0dGluZ3NGaWxlUGF0aCwgZGVmYXVsdE1vZFNldHRpbmdzLCB7IGVuY29kaW5nOiAndXRmOCcgfSk7XG4gICAgICB9XG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoZXJyKTtcbiAgICB9XG4gIH1cbn1cblxuYXN5bmMgZnVuY3Rpb24gcHJlcGFyZUZvck1vZGRpbmcoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpLCBkaXNjb3ZlcnkpIHtcbiAgY29uc3QgbXAgPSBtb2RzUGF0aCgpOyAgXG5cbiAgY29uc3QgZm9ybWF0ID0gYXdhaXQgZ2V0RGVmYXVsdE1vZFNldHRpbmdzRm9ybWF0KGFwaSk7XG4gIGlmICghWyd2NycsICd2OCddLmluY2x1ZGVzKGZvcm1hdCkpIHtcbiAgICBzaG93RnVsbFJlbGVhc2VNb2RGaXhlclJlY29tbWVuZGF0aW9uKGFwaSk7XG4gIH1cbiAgXG4gIHJldHVybiBmcy5zdGF0QXN5bmMobXApXG4gICAgLmNhdGNoKCgpID0+IGZzLmVuc3VyZURpcldyaXRhYmxlQXN5bmMobXAsICgpID0+IEJsdWViaXJkLnJlc29sdmUoKSBhcyBhbnkpKVxuICAgIC5maW5hbGx5KCgpID0+IGVuc3VyZUdsb2JhbFByb2ZpbGUoYXBpLCBkaXNjb3ZlcnkpKTtcbn1cblxuZnVuY3Rpb24gc2hvd0Z1bGxSZWxlYXNlTW9kRml4ZXJSZWNvbW1lbmRhdGlvbihhcGk6IHR5cGVzLklFeHRlbnNpb25BcGkpIHtcbiAgLy8gY2hlY2sgdG8gc2VlIGlmIG1vZCBpcyBpbnN0YWxsZWQgZmlyc3Q/XG4gIGNvbnN0IG1vZHMgPSBhcGkuc3RvcmUuZ2V0U3RhdGUoKS5wZXJzaXN0ZW50Py5tb2RzPy5iYWxkdXJzZ2F0ZTM7XG4gIGlmKG1vZHMgIT09IHVuZGVmaW5lZCkge1xuICAgIGNvbnN0IG1vZEFycmF5OiB0eXBlcy5JTW9kW10gPSBtb2RzID8gT2JqZWN0LnZhbHVlcyhtb2RzKSA6IFtdO1xuICAgIGxvZ0RlYnVnKCdtb2RBcnJheScsIG1vZEFycmF5KTtcbiAgXG4gICAgY29uc3QgbW9kRml4ZXJJbnN0YWxsZWQ6Ym9vbGVhbiA9ICBtb2RBcnJheS5maWx0ZXIobW9kID0+ICEhbW9kPy5hdHRyaWJ1dGVzPy5tb2RGaXhlcikubGVuZ3RoICE9IDA7ICBcbiAgICBsb2dEZWJ1ZygnbW9kRml4ZXJJbnN0YWxsZWQnLCBtb2RGaXhlckluc3RhbGxlZCk7XG5cbiAgICAvLyBpZiB3ZSd2ZSBmb3VuZCBhbiBpbnN0YWxsZWQgbW9kZml4ZXIsIHRoZW4gZG9uJ3QgYm90aGVyIHNob3dpbmcgbm90aWZpY2F0aW9uIFxuICAgIGlmKG1vZEZpeGVySW5zdGFsbGVkKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICB9XG5cbiAgLy8gbm8gbW9kcyBmb3VuZFxuICBhcGkuc2VuZE5vdGlmaWNhdGlvbih7XG4gICAgdHlwZTogJ3dhcm5pbmcnLFxuICAgIHRpdGxlOiAnUmVjb21tZW5kZWQgTW9kJyxcbiAgICBtZXNzYWdlOiAnTW9zdCBtb2RzIHJlcXVpcmUgdGhpcyBtb2QuJyxcbiAgICBpZDogJ2JnMy1yZWNvbW1lbmRlZC1tb2QnLFxuICAgIGFsbG93U3VwcHJlc3M6IHRydWUsXG4gICAgYWN0aW9uczogW1xuICAgICAge1xuICAgICAgICB0aXRsZTogJ01vcmUnLCBhY3Rpb246IGRpc21pc3MgPT4ge1xuICAgICAgICAgIGFwaS5zaG93RGlhbG9nKCdxdWVzdGlvbicsICdSZWNvbW1lbmRlZCBNb2RzJywge1xuICAgICAgICAgICAgdGV4dDpcbiAgICAgICAgICAgICAgJ1dlIHJlY29tbWVuZCBpbnN0YWxsaW5nIFwiQmFsZHVyXFwncyBHYXRlIDMgTW9kIEZpeGVyXCIgdG8gYmUgYWJsZSB0byBtb2QgQmFsZHVyXFwncyBHYXRlIDMuXFxuXFxuJyArIFxuICAgICAgICAgICAgICAnVGhpcyBjYW4gYmUgZG93bmxvYWRlZCBmcm9tIE5leHVzIE1vZHMgYW5kIGluc3RhbGxlZCB1c2luZyBWb3J0ZXggYnkgcHJlc3NpbmcgXCJPcGVuIE5leHVzIE1vZHMnXG4gICAgICAgICAgfSwgW1xuICAgICAgICAgICAgeyBsYWJlbDogJ0Rpc21pc3MnIH0sXG4gICAgICAgICAgICB7IGxhYmVsOiAnT3BlbiBOZXh1cyBNb2RzJywgZGVmYXVsdDogdHJ1ZSB9LFxuICAgICAgICAgIF0pXG4gICAgICAgICAgICAudGhlbihyZXN1bHQgPT4ge1xuICAgICAgICAgICAgICBkaXNtaXNzKCk7XG4gICAgICAgICAgICAgIGlmIChyZXN1bHQuYWN0aW9uID09PSAnT3BlbiBOZXh1cyBNb2RzJykge1xuICAgICAgICAgICAgICAgIHV0aWwub3BuKCdodHRwczovL3d3dy5uZXh1c21vZHMuY29tL2JhbGR1cnNnYXRlMy9tb2RzLzE0MT90YWI9ZGVzY3JpcHRpb24nKS5jYXRjaCgoKSA9PiBudWxsKVxuICAgICAgICAgICAgICB9IGVsc2UgaWYgKHJlc3VsdC5hY3Rpb24gPT09ICdDYW5jZWwnKSB7XG4gICAgICAgICAgICAgICAgLy8gZGlzbWlzcyBhbnl3YXlcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIF0sXG4gIH0pO1xufVxuXG5hc3luYyBmdW5jdGlvbiBvbkNoZWNrTW9kVmVyc2lvbihhcGk6IHR5cGVzLklFeHRlbnNpb25BcGksIGdhbWVJZDogc3RyaW5nLCBtb2RzOiB0eXBlcy5JTW9kW10pIHtcbiAgY29uc3QgcHJvZmlsZSA9IHNlbGVjdG9ycy5hY3RpdmVQcm9maWxlKGFwaS5nZXRTdGF0ZSgpKTtcbiAgaWYgKHByb2ZpbGUuZ2FtZUlkICE9PSBHQU1FX0lEIHx8IGdhbWVJZCAhPT0gR0FNRV9JRCkge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGNvbnN0IGxhdGVzdFZlcjogc3RyaW5nID0gZ2V0TGF0ZXN0SW5zdGFsbGVkTFNMaWJWZXIoYXBpKTtcblxuICBpZiAobGF0ZXN0VmVyID09PSAnMC4wLjAnKSB7XG4gICAgLy8gTm90aGluZyB0byB1cGRhdGUuXG4gICAgcmV0dXJuO1xuICB9XG5cbiAgY29uc3QgbmV3ZXN0VmVyOiBzdHJpbmcgPSBhd2FpdCBnaXRIdWJEb3dubG9hZGVyLmNoZWNrRm9yVXBkYXRlcyhhcGksIGxhdGVzdFZlcik7XG4gIGlmICghbmV3ZXN0VmVyIHx8IG5ld2VzdFZlciA9PT0gbGF0ZXN0VmVyKSB7XG4gICAgcmV0dXJuO1xuICB9XG59XG5cbmFzeW5jIGZ1bmN0aW9uIG9uR2FtZU1vZGVBY3RpdmF0ZWQoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpLCBnYW1lSWQ6IHN0cmluZykge1xuICBpZiAoZ2FtZUlkICE9PSBHQU1FX0lEKSB7XG4gICAgUGFrSW5mb0NhY2hlLmdldEluc3RhbmNlKGFwaSkuc2F2ZSgpO1xuICAgIHJldHVybjtcbiAgfVxuICB0cnkge1xuICAgIGF3YWl0IG1pZ3JhdGUoYXBpKTtcbiAgICBjb25zdCBiZzNQcm9maWxlSWQgPSBhd2FpdCBnZXRBY3RpdmVQbGF5ZXJQcm9maWxlKGFwaSk7XG4gICAgY29uc3QgZ2FtZVNldHRpbmdzUGF0aDogc3RyaW5nID0gcGF0aC5qb2luKHByb2ZpbGVzUGF0aCgpLCBiZzNQcm9maWxlSWQsICdtb2RzZXR0aW5ncy5sc3gnKTtcbiAgICBsZXQgbm9kZXMgPSBhd2FpdCBnZXROb2RlcyhnYW1lU2V0dGluZ3NQYXRoKTtcbiAgICBjb25zdCB7IG1vZHNOb2RlLCBtb2RzT3JkZXJOb2RlIH0gPSBub2RlcztcbiAgICBpZiAoKG1vZHNOb2RlLmNoaWxkcmVuID09PSB1bmRlZmluZWQpIHx8ICgobW9kc05vZGUuY2hpbGRyZW5bMF0gYXMgYW55KSA9PT0gJycpKSB7XG4gICAgICBtb2RzTm9kZS5jaGlsZHJlbiA9IFt7IG5vZGU6IFtdIH1dO1xuICAgIH1cblxuXG4gICAgY29uc3QgZm9ybWF0ID0gYXdhaXQgZ2V0RGVmYXVsdE1vZFNldHRpbmdzRm9ybWF0KGFwaSk7XG4gICAgaWYgKG1vZHNPcmRlck5vZGUgPT09IHVuZGVmaW5lZCAmJiBbJ3Y3JywgJ3Y4J10uaW5jbHVkZXMoZm9ybWF0KSkge1xuICAgICAgY29uc3QgY29udkZ1bmMgPSBmb3JtYXQgPT09ICd2NycgPyBjb252ZXJ0VjZ0b1Y3IDogY29udmVydFRvVjg7XG4gICAgICBjb25zdCBkYXRhID0gYXdhaXQgZnMucmVhZEZpbGVBc3luYyhnYW1lU2V0dGluZ3NQYXRoLCB7IGVuY29kaW5nOiAndXRmOCcgfSk7XG4gICAgICBjb25zdCBuZXdEYXRhID0gYXdhaXQgY29udkZ1bmMoZGF0YSk7XG4gICAgICBhd2FpdCBmcy5yZW1vdmVBc3luYyhnYW1lU2V0dGluZ3NQYXRoKS5jYXRjaChlcnIgPT4gUHJvbWlzZS5yZXNvbHZlKCkpO1xuICAgICAgYXdhaXQgZnMud3JpdGVGaWxlQXN5bmMoZ2FtZVNldHRpbmdzUGF0aCwgbmV3RGF0YSwgeyBlbmNvZGluZzogJ3V0ZjgnIH0pO1xuICAgIH1cbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgYXBpLnNob3dFcnJvck5vdGlmaWNhdGlvbihcbiAgICAgICdGYWlsZWQgdG8gbWlncmF0ZScsIGVyciwge1xuICAgICAgICAvL21lc3NhZ2U6ICdQbGVhc2UgcnVuIHRoZSBnYW1lIGJlZm9yZSB5b3Ugc3RhcnQgbW9kZGluZycsXG4gICAgICAgIGFsbG93UmVwb3J0OiBmYWxzZSxcbiAgICB9KTtcbiAgfVxuXG4gIHRyeSB7XG4gICAgYXdhaXQgcmVhZFN0b3JlZExPKGFwaSk7XG4gICAgUGFrSW5mb0NhY2hlLmdldEluc3RhbmNlKGFwaSk7XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIGFwaS5zaG93RXJyb3JOb3RpZmljYXRpb24oXG4gICAgICAnRmFpbGVkIHRvIHJlYWQgbG9hZCBvcmRlcicsIGVyciwge1xuICAgICAgICBtZXNzYWdlOiAnUGxlYXNlIHJ1biB0aGUgZ2FtZSBiZWZvcmUgeW91IHN0YXJ0IG1vZGRpbmcnLFxuICAgICAgICBhbGxvd1JlcG9ydDogZmFsc2UsXG4gICAgfSk7XG4gIH1cblxuICBjb25zdCBsYXRlc3RWZXI6IHN0cmluZyA9IGdldExhdGVzdEluc3RhbGxlZExTTGliVmVyKGFwaSk7XG4gIGlmIChsYXRlc3RWZXIgPT09ICcwLjAuMCcpIHtcbiAgICBhd2FpdCBnaXRIdWJEb3dubG9hZGVyLmRvd25sb2FkRGl2aW5lKGFwaSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gbWFpbihjb250ZXh0OiB0eXBlcy5JRXh0ZW5zaW9uQ29udGV4dCkge1xuICBjb250ZXh0LnJlZ2lzdGVyUmVkdWNlcihbJ3NldHRpbmdzJywgJ2JhbGR1cnNnYXRlMyddLCByZWR1Y2VyKTtcblxuICBjb250ZXh0LnJlZ2lzdGVyR2FtZSh7XG4gICAgaWQ6IEdBTUVfSUQsXG4gICAgbmFtZTogJ0JhbGR1clxcJ3MgR2F0ZSAzJyxcbiAgICBtZXJnZU1vZHM6IHRydWUsXG4gICAgcXVlcnlQYXRoOiBmaW5kR2FtZSxcbiAgICBzdXBwb3J0ZWRUb29sczogcHJvY2Vzcy5wbGF0Zm9ybSA9PT0gJ2RhcndpbicgPyBbXSA6IFtcbiAgICAgIHtcbiAgICAgICAgaWQ6ICdleGV2dWxrYW4nLFxuICAgICAgICBuYW1lOiAnQmFsZHVyXFwncyBHYXRlIDMgKFZ1bGthbiknLFxuICAgICAgICBleGVjdXRhYmxlOiAoKSA9PiAnYmluL2JnMy5leGUnLFxuICAgICAgICByZXF1aXJlZEZpbGVzOiBbXG4gICAgICAgICAgJ2Jpbi9iZzMuZXhlJyxcbiAgICAgICAgXSxcbiAgICAgICAgcmVsYXRpdmU6IHRydWUsXG4gICAgICB9LFxuICAgIF0sXG4gICAgcXVlcnlNb2RQYXRoOiBtb2RzUGF0aCxcbiAgICBsb2dvOiAnZ2FtZWFydC5qcGcnLFxuICAgIGV4ZWN1dGFibGU6ICgpID0+IChwcm9jZXNzLnBsYXRmb3JtID09PSAnZGFyd2luJyA/ICdCYWxkdXJzIEdhdGUgMycgOiAnYmluL2JnM19keDExLmV4ZScpLFxuICAgIHNldHVwOiBkaXNjb3ZlcnkgPT4gcHJlcGFyZUZvck1vZGRpbmcoY29udGV4dC5hcGksIGRpc2NvdmVyeSkgYXMgYW55LFxuICAgIHJlcXVpcmVkRmlsZXM6IHByb2Nlc3MucGxhdGZvcm0gPT09ICdkYXJ3aW4nXG4gICAgICA/IFtcbiAgICAgICAgJ0JhbGR1cnMgR2F0ZSAzJyxcbiAgICAgIF1cbiAgICAgIDogW1xuICAgICAgICAnYmluL2JnM19keDExLmV4ZScsXG4gICAgICBdLFxuICAgIGVudmlyb25tZW50OiB7XG4gICAgICBTdGVhbUFQUElkOiBTVEVBTV9JRCxcbiAgICB9LFxuICAgIGRldGFpbHM6IHtcbiAgICAgIC8vIGlnbm9yZWQgZmlsZXMgdG8gYmUgbGVmdCBpbiBzdGFnaW5nIChwbHVnaW5zLnR4dCwgc2t5cmltLmluaSwgZXRjLilcbiAgICAgIHN0b3BQYXR0ZXJuczogU1RPUF9QQVRURVJOUy5tYXAodG9Xb3JkRXhwKSxcbiAgICAgIC8vIGFjY2VwdGVkIG1vZCBleHRlbnNpb25zIGZvciB0aGlzIGdhbWUgKHdoYXQgd2lsbCBiZSBjbGFpbWVkIGluIG1vZCBwYWdlKVxuICAgICAgc3VwcG9ydGVkVG9vbHM6IFtcbiAgICAgICAge1xuICAgICAgICAgIGlkOiAnZXhlJyxcbiAgICAgICAgICBuYW1lOiAnQmFsZHVyXFwncyBHYXRlIDMgKERYMTEpJyxcbiAgICAgICAgICBleGVjdXRhYmxlOiAnYmluL2JnM19keDExLmV4ZScsXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBpZDogJ2V4ZXZ1bGthbicsXG4gICAgICAgICAgbmFtZTogJ0JhbGR1clxcJ3MgR2F0ZSAzIChWdWxrYW4pJyxcbiAgICAgICAgICBleGVjdXRhYmxlOiAnYmluL2JnMy5leGUnLFxuICAgICAgICB9LFxuICAgICAgXSxcbiAgICAgIGdhbWVEYXRhUGF0aDogZ2V0R2FtZURhdGFQYXRoKGNvbnRleHQuYXBpKSxcbiAgICAgIHN1cHBvcnRlZE1vZFR5cGVzOiBbTU9EX1RZUEVfTFNMSUIsIE1PRF9UWVBFX0xPT1NFLCBNT0RfVFlQRV9CRzNTRSwgTU9EX1RZUEVfUkVQTEFDRVJdLFxuICAgICAgYXV0b0RlcGxveTogdHJ1ZSxcbiAgICAgIGlnbm9yZUNvbmZsaWN0czogSUdOT1JFX1BBVFRFUk5TLFxuICAgICAgc2hvd1dyb25nR2FtZVdhcm5pbmc6IHRydWUsXG4gICAgICBzaGVsbDogZmFsc2UsXG4gICAgfSxcbiAgfSk7XG5cbiAgY29udGV4dC5yZWdpc3RlclNldHRpbmdzKCdNb2RzJywgU2V0dGluZ3MpO1xuXG4gIC8vIGNvbnRleHQucmVnaXN0ZXJNb2RUeXBlKE1PRF9UWVBFX1JFUExBQ0VSLCA5OClcbiAgLy8gY29udGV4dC5yZWdpc3Rlck1vZFR5cGUoTU9EX1RZUEVfTFNMSUIsIDk5KVxuICAvLyBjb250ZXh0LnJlZ2lzdGVyTW9kVHlwZShNT0RfVFlQRV9CRzNTRSwgMTAwKVxuICAvLyBjb250ZXh0LnJlZ2lzdGVyTW9kVHlwZShNT0RfVFlQRV9MT09TRSwgMjAwKVxuXG4gIC8vIExvb3NlIG1vZHMgbXVzdCBiZSByZXJvdXRlZCB0byB0aGUgdXNlciBtb2RzIGZvbGRlci4gQkczIGNhbiB0aHJvdyBleGNlcHRpb25zXG4gIC8vIHdoZW4gbW9kcyBhcmUgbW92ZWQsIHNvIHdlIG11c3QgbW92ZSB0aGUgbW9kcyBvdXJzZWx2ZXMgYW5kIHRoZSBkaXNwYXRjaCB0aGUgY2hhbmdlLlxuICBjb250ZXh0LnJlZ2lzdGVyTW9kVHlwZShcbiAgICBNT0RfVFlQRV9MT09TRSxcbiAgICAyMDAsXG4gICAgKGdhbWVJZCkgPT4gZ2FtZUlkID09PSBHQU1FX0lELFxuICAgIChfZ2FtZSkgPT4gbW9kc1BhdGgoKSxcbiAgICAoaW5zdHJ1Y3Rpb25zKSA9PiBCbHVlYmlyZC5yZXNvbHZlKGlzTG9vc2UoaW5zdHJ1Y3Rpb25zKSksXG4gICk7XG4gIGNvbnRleHQucmVnaXN0ZXJNb2RUeXBlKFxuICAgIE1PRF9UWVBFX1JFUExBQ0VSLFxuICAgIDEwMCxcbiAgICAoZ2FtZUlkKSA9PiBnYW1lSWQgPT09IEdBTUVfSUQsXG4gICAgKF9nYW1lKSA9PiBnZXRHYW1lUGF0aChjb250ZXh0LmFwaSksXG4gICAgKGluc3RydWN0aW9ucykgPT4gQmx1ZWJpcmQucmVzb2x2ZShpc1JlcGxhY2VyKGNvbnRleHQuYXBpLCBpbnN0cnVjdGlvbnMpKSxcbiAgKTtcbiAgY29udGV4dC5yZWdpc3Rlck1vZFR5cGUoXG4gICAgTU9EX1RZUEVfTFNMSUIsXG4gICAgOTksXG4gICAgKGdhbWVJZCkgPT4gZ2FtZUlkID09PSBHQU1FX0lELFxuICAgIChfZ2FtZSkgPT4gZ2V0R2FtZVBhdGgoY29udGV4dC5hcGkpLFxuICAgIChpbnN0cnVjdGlvbnMpID0+IEJsdWViaXJkLnJlc29sdmUoaXNMU0xpYihpbnN0cnVjdGlvbnMpKSxcbiAgKTtcbiAgY29udGV4dC5yZWdpc3Rlck1vZFR5cGUoXG4gICAgTU9EX1RZUEVfQkczU0UsXG4gICAgMTAwLFxuICAgIChnYW1lSWQpID0+IGdhbWVJZCA9PT0gR0FNRV9JRCxcbiAgICAoX2dhbWUpID0+IHBhdGguam9pbihnZXRHYW1lUGF0aChjb250ZXh0LmFwaSksICdiaW4nKSxcbiAgICAoaW5zdHJ1Y3Rpb25zKSA9PiBCbHVlYmlyZC5yZXNvbHZlKGlzQkczU0UoaW5zdHJ1Y3Rpb25zKSksXG4gICk7XG5cbiAgY29udGV4dC5yZWdpc3RlckFjdGlvbignbW9kcy1hY3Rpb24taWNvbnMnLCA5OTksICd1cGRhdGUnLCB7fSwgJ0NoZWNrIE1vZCBWZXJzaW9ucycsIChpbnN0YW5jZUlkcykgPT4ge1xuICAgICAgdm9pZCBvbkNoZWNrTW9kVmVyc2lvbihjb250ZXh0LmFwaSwgc2VsZWN0b3JzLmFjdGl2ZUdhbWVJZChjb250ZXh0LmFwaS5nZXRTdGF0ZSgpKSwgW10pO1xuICB9KTtcblxuICBjb250ZXh0Lm9uY2UoKCkgPT4ge1xuICAgIGNvbnRleHQuYXBpLm9uQXN5bmMoJ2RpZC1kZXBsb3knLCAocHJvZmlsZUlkLCBwcm9maWxlVHlwZSwgZGVwbG95bWVudCkgPT4ge1xuICAgICAgZm9yY2VSZWZyZXNoKGNvbnRleHQuYXBpKTtcbiAgICAgIHJldHVybiBCbHVlYmlyZC5yZXNvbHZlKCk7XG4gICAgfSk7XG4gIH0pO1xuXG59XG5cbmV4cG9ydCBkZWZhdWx0IG1haW47XG4iXX0=