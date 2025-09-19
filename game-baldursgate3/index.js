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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50c3giXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQVdBLHdEQUFnQztBQUVoQywyQ0FBNkI7QUFFN0IsMkNBQXdEO0FBRXhELHFDQUVrQjtBQUNsQixxRUFBdUQ7QUFDdkQsMERBQWtDO0FBQ2xDLDBEQUFpQztBQUNqQyw2Q0FBdUM7QUFFdkMsaUNBVWdCO0FBUWhCLHlDQUVvQjtBQUVwQiwyQ0FJcUI7QUFHckIsb0RBQW1DO0FBRW5DLE1BQU0sYUFBYSxHQUFHLENBQUMsY0FBYyxDQUFDLENBQUM7QUFFdkMsTUFBTSxNQUFNLEdBQUcsWUFBWSxDQUFDO0FBQzVCLE1BQU0sUUFBUSxHQUFHLFNBQVMsQ0FBQztBQUUzQixTQUFTLFNBQVMsQ0FBQyxLQUFLO0lBQ3RCLE9BQU8sT0FBTyxHQUFHLEtBQUssR0FBRyxPQUFPLENBQUM7QUFDbkMsQ0FBQztBQUVELFNBQVMsUUFBUTtJQUNmLE9BQU8saUJBQUksQ0FBQyxlQUFlLENBQUMsV0FBVyxDQUFDLENBQUMsTUFBTSxFQUFFLFFBQVEsQ0FBQyxDQUFDO1NBQ3hELElBQUksQ0FBQyxDQUFNLElBQUksRUFBQyxFQUFFO1FBQ2pCLE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUM7UUFDL0IsSUFBSSxPQUFPLENBQUMsUUFBUSxLQUFLLFFBQVEsRUFBRTtZQUNqQyxNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxxQkFBcUIsRUFBRSxVQUFVLEVBQUUsT0FBTyxDQUFDLENBQUM7WUFDakYsSUFBSTtnQkFDRixNQUFNLGVBQUUsQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDLENBQUM7Z0JBQzdCLE9BQU8sUUFBUSxDQUFDO2FBQ2pCO1lBQUMsT0FBTyxHQUFHLEVBQUU7YUFFYjtTQUNGO1FBQ0QsT0FBTyxRQUFRLENBQUM7SUFDbEIs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QUFDLENBQUM7SUFDNUYsQ0FBQyxDQUFDLENBQUM7SUFFSCxPQUFPLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRTtRQUNoQixPQUFPLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxZQUFZLEVBQUUsQ0FBQyxTQUFTLEVBQUUsV0FBVyxFQUFFLFVBQVUsRUFBRSxFQUFFO1lBQ3ZFLElBQUEsbUJBQVksRUFBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDMUIsT0FBTyxrQkFBUSxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQzVCLENBQUMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQyxDQUFDLENBQUM7QUFFTCxDQUFDO0FBRUQsa0JBQWUsSUFBSSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgaXNXaW5kb3dzIH0gZnJvbSAndm9ydGV4LWFwaSc7XG4vKiBlc2xpbnQtZGlzYWJsZSAqL1xuLyoqXG4gKiBJbXBvcnRhbnQgLSBhbHRob3VnaCB3ZSBubyBsb25nZXIgZGVmaW5lIHRoZSBpbmZvIHBhbmVsIGhlcmUsXG4gKiAgd2Ugc3RpbGwgbmVlZCB0byBrZWVwIHRoZSBpbmRleCBmaWxlJ3MgJy50c3gnIGV4dGVuc2lvbi5cbiAqICBBdCBsZWFzdCB3aGlsZSBvdXIgdXBkYXRlIHByb2Nlc3MgZm9yIGJ1bmRsZWQgcGx1Z2lucyByZW1haW5zXG4gKiAgdGhyb3VnaCB0aGUgJ3JlbGVhc2UnIGJyYW5jaC5cbiAqIFxuICogUmVtb3ZpbmcgZmlsZXMgZnJvbSBidW5kbGVkIHBsdWdpbnMgd2l0aG91dCBzdHViYmluZyB0aGUgZXh0ZW5zaW9uXG4gKiAgY2FuIHBvdGVudGlhbGx5IGJyZWFrIHRoZSBleHRlbnNpb24gb24gdGhlIHVzZXIncyBlbmQuXG4gKi9cbmltcG9ydCBCbHVlYmlyZCBmcm9tICdibHVlYmlyZCc7XG5pbXBvcnQgKiBhcyBfIGZyb20gJ2xvZGFzaCc7XG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0ICogYXMgUmVhY3QgZnJvbSAncmVhY3QnO1xuaW1wb3J0IHsgZnMsIHNlbGVjdG9ycywgdHlwZXMsIHV0aWwgfSBmcm9tICd2b3J0ZXgtYXBpJztcblxuaW1wb3J0IHsgR0FNRV9JRCwgSUdOT1JFX1BBVFRFUk5TLFxuICBNT0RfVFlQRV9CRzNTRSwgTU9EX1RZUEVfTE9PU0UsIE1PRF9UWVBFX0xTTElCLCBNT0RfVFlQRV9SRVBMQUNFUixcbn0gZnJvbSAnLi9jb21tb24nO1xuaW1wb3J0ICogYXMgZ2l0SHViRG93bmxvYWRlciBmcm9tICcuL2dpdGh1YkRvd25sb2FkZXInO1xuaW1wb3J0IFNldHRpbmdzIGZyb20gJy4vU2V0dGluZ3MnO1xuaW1wb3J0IHJlZHVjZXIgZnJvbSAnLi9yZWR1Y2Vycyc7XG5pbXBvcnQgeyBtaWdyYXRlIH0gZnJvbSAnLi9taWdyYXRpb25zJztcblxuaW1wb3J0IHtcbiAgbG9nRGVidWcsIGZvcmNlUmVmcmVzaCwgZ2V0TGF0ZXN0SW5zdGFsbGVkTFNMaWJWZXIsXG4gIGdldEdhbWVEYXRhUGF0aCwgZ2V0R2FtZVBhdGgsIGdsb2JhbFByb2ZpbGVQYXRoLCBtb2RzUGF0aCxcbiAgZ2V0TGF0ZXN0TFNMaWJNb2QsIGdldE93bkdhbWVWZXJzaW9uLCByZWFkU3RvcmVkTE8sXG4gIGdldERlZmF1bHRNb2RTZXR0aW5ncyxcbiAgZ2V0RGVmYXVsdE1vZFNldHRpbmdzRm9ybWF0LFxuICBnZXRBY3RpdmVQbGF5ZXJQcm9maWxlLFxuICBwcm9maWxlc1BhdGgsXG4gIGNvbnZlcnRWNnRvVjcsXG4gIGNvbnZlcnRUb1Y4LFxufSBmcm9tICcuL3V0aWwnO1xuXG4vLyBSZW1vdmVkIGluY29ycmVjdCBpbnN0YWxsZXJzIGltcG9ydFxuLy8gaW1wb3J0IHtcbi8vICAgdGVzdExTTGliLCB0ZXN0QkczU0UsIHRlc3RFbmdpbmVJbmplY3RvciwgdGVzdE1vZEZpeGVyLCB0ZXN0UmVwbGFjZXIsXG4vLyAgIGluc3RhbGxMU0xpYiwgaW5zdGFsbEJHM1NFLCBpbnN0YWxsRW5naW5lSW5qZWN0b3IsIGluc3RhbGxNb2RGaXhlciwgaW5zdGFsbFJlcGxhY2VyLFxuLy8gfSBmcm9tICcuL2luc3RhbGxlcnMnO1xuXG5pbXBvcnQge1xuICBpc0JHM1NFLCBpc0xTTGliLCBpc0xvb3NlLCBpc1JlcGxhY2VyLFxufSBmcm9tICcuL21vZFR5cGVzJztcblxuaW1wb3J0IHtcbiAgZGVzZXJpYWxpemUsIGltcG9ydE1vZFNldHRpbmdzRmlsZSwgaW1wb3J0TW9kU2V0dGluZ3NHYW1lLFxuICBpbXBvcnRGcm9tQkczTU0sIHNlcmlhbGl6ZSwgZXhwb3J0VG9HYW1lLCBleHBvcnRUb0ZpbGUsIHZhbGlkYXRlLFxuICBnZXROb2Rlcyxcbn0gZnJvbSAnLi9sb2FkT3JkZXInO1xuXG5pbXBvcnQgeyBJbmZvUGFuZWxXcmFwIH0gZnJvbSAnLi9JbmZvUGFuZWwnXG5pbXBvcnQgUGFrSW5mb0NhY2hlIGZyb20gJy4vY2FjaGUnO1xuXG5jb25zdCBTVE9QX1BBVFRFUk5TID0gWydbXi9dKlxcXFwucGFrJCddO1xuXG5jb25zdCBHT0dfSUQgPSAnMTQ1NjQ2MDY2OSc7XG5jb25zdCBTVEVBTV9JRCA9ICcxMDg2OTQwJztcblxuZnVuY3Rpb24gdG9Xb3JkRXhwKGlucHV0KSB7XG4gIHJldHVybiAnKF58LyknICsgaW5wdXQgKyAnKC98JCknO1xufVxuXG5mdW5jdGlvbiBmaW5kR2FtZSgpOiBhbnkge1xuICByZXR1cm4gdXRpbC5HYW1lU3RvcmVIZWxwZXIuZmluZEJ5QXBwSWQoW0dPR19JRCwgU1RFQU1fSURdKVxuICAgIC50aGVuKGFzeW5jIGdhbWUgPT4ge1xuICAgICAgY29uc3QgYmFzZVBhdGggPSBnYW1lLmdhbWVQYXRoO1xuICAgICAgaWYgKHByb2Nlc3MucGxhdGZvcm0gPT09ICdkYXJ3aW4nKSB7XG4gICAgICAgIGNvbnN0IG1hY09TRGlyID0gcGF0aC5qb2luKGJhc2VQYXRoLCBcIkJhbGR1cidzIEdhdGUgMy5hcHBcIiwgJ0NvbnRlbnRzJywgJ01hY09TJyk7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgYXdhaXQgZnMuc3RhdEFzeW5jKG1hY09TRGlyKTtcbiAgICAgICAgICByZXR1cm4gbWFjT1NEaXI7XG4gICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgIC8vIGZhbGwgYmFjayB0byB0aGUgc3RvcmUtcHJvdmlkZWQgcGF0aFxuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gYmFzZVBhdGg7XG4gICAgfSk7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGVuc3VyZUdsb2JhbFByb2ZpbGUoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpLCBkaXNjb3Zlcnk6IHR5cGVzLklEaXNjb3ZlcnlSZXN1bHQpIHtcbiAgaWYgKGRpc2NvdmVyeT8ucGF0aCkge1xuICAgIGNvbnN0IHByb2ZpbGVQYXRoID0gYXdhaXQgZ2xvYmFsUHJvZmlsZVBhdGgoYXBpKTtcbiAgICB0cnkge1xuICAgICAgYXdhaXQgZnMuZW5zdXJlRGlyV3JpdGFibGVBc3luYyhwcm9maWxlUGF0aCk7XG4gICAgICBjb25zdCBtb2RTZXR0aW5nc0ZpbGVQYXRoID0gcGF0aC5qb2luKHByb2ZpbGVQYXRoLCAnbW9kc2V0dGluZ3MubHN4Jyk7XG4gICAgICB0cnkge1xuICAgICAgICBhd2FpdCBmcy5zdGF0QXN5bmMobW9kU2V0dGluZ3NGaWxlUGF0aCk7XG4gICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgY29uc3QgZGVmYXVsdE1vZFNldHRpbmdzID0gYXdhaXQgZ2V0RGVmYXVsdE1vZFNldHRpbmdzKGFwaSk7XG4gICAgICAgIGF3YWl0IGZzLndyaXRlRmlsZUFzeW5jKG1vZFNldHRpbmdzRmlsZVBhdGgsIGRlZmF1bHRNb2RTZXR0aW5ncywgeyBlbmNvZGluZzogJ3V0ZjgnIH0pO1xuICAgICAgfVxuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KGVycik7XG4gICAgfVxuICB9XG59XG5cbmFzeW5jIGZ1bmN0aW9uIHByZXBhcmVGb3JNb2RkaW5nKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSwgZGlzY292ZXJ5KSB7XG4gIGNvbnN0IG1wID0gbW9kc1BhdGgoKTsgIFxuXG4gIGNvbnN0IGZvcm1hdCA9IGF3YWl0IGdldERlZmF1bHRNb2RTZXR0aW5nc0Zvcm1hdChhcGkpO1xuICBpZiAoIVsndjcnLCAndjgnXS5pbmNsdWRlcyhmb3JtYXQpKSB7XG4gICAgc2hvd0Z1bGxSZWxlYXNlTW9kRml4ZXJSZWNvbW1lbmRhdGlvbihhcGkpO1xuICB9XG4gIFxuICByZXR1cm4gZnMuc3RhdEFzeW5jKG1wKVxuICAgIC5jYXRjaCgoKSA9PiBmcy5lbnN1cmVEaXJXcml0YWJsZUFzeW5jKG1wLCAoKSA9PiBCbHVlYmlyZC5yZXNvbHZlKCkgYXMgYW55KSlcbiAgICAuZmluYWxseSgoKSA9PiBlbnN1cmVHbG9iYWxQcm9maWxlKGFwaSwgZGlzY292ZXJ5KSk7XG59XG5cbmZ1bmN0aW9uIHNob3dGdWxsUmVsZWFzZU1vZEZpeGVyUmVjb21tZW5kYXRpb24oYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpKSB7XG4gIC8vIGNoZWNrIHRvIHNlZSBpZiBtb2QgaXMgaW5zdGFsbGVkIGZpcnN0P1xuICBjb25zdCBtb2RzID0gYXBpLnN0b3JlLmdldFN0YXRlKCkucGVyc2lzdGVudD8ubW9kcz8uYmFsZHVyc2dhdGUzO1xuICBpZihtb2RzICE9PSB1bmRlZmluZWQpIHtcbiAgICBjb25zdCBtb2RBcnJheTogdHlwZXMuSU1vZFtdID0gbW9kcyA/IE9iamVjdC52YWx1ZXMobW9kcykgOiBbXTtcbiAgICBsb2dEZWJ1ZygnbW9kQXJyYXknLCBtb2RBcnJheSk7XG4gIFxuICAgIGNvbnN0IG1vZEZpeGVySW5zdGFsbGVkOmJvb2xlYW4gPSAgbW9kQXJyYXkuZmlsdGVyKG1vZCA9PiAhIW1vZD8uYXR0cmlidXRlcz8ubW9kRml4ZXIpLmxlbmd0aCAhPSAwOyAgXG4gICAgbG9nRGVidWcoJ21vZEZpeGVySW5zdGFsbGVkJywgbW9kRml4ZXJJbnN0YWxsZWQpO1xuXG4gICAgLy8gaWYgd2UndmUgZm91bmQgYW4gaW5zdGFsbGVkIG1vZGZpeGVyLCB0aGVuIGRvbid0IGJvdGhlciBzaG93aW5nIG5vdGlmaWNhdGlvbiBcbiAgICBpZihtb2RGaXhlckluc3RhbGxlZCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgfVxuXG4gIC8vIG5vIG1vZHMgZm91bmRcbiAgYXBpLnNlbmROb3RpZmljYXRpb24oe1xuICAgIHR5cGU6ICd3YXJuaW5nJyxcbiAgICB0aXRsZTogJ1JlY29tbWVuZGVkIE1vZCcsXG4gICAgbWVzc2FnZTogJ01vc3QgbW9kcyByZXF1aXJlIHRoaXMgbW9kLicsXG4gICAgaWQ6ICdiZzMtcmVjb21tZW5kZWQtbW9kJyxcbiAgICBhbGxvd1N1cHByZXNzOiB0cnVlLFxuICAgIGFjdGlvbnM6IFtcbiAgICAgIHtcbiAgICAgICAgdGl0bGU6ICdNb3JlJywgYWN0aW9uOiBkaXNtaXNzID0+IHtcbiAgICAgICAgICBhcGkuc2hvd0RpYWxvZygncXVlc3Rpb24nLCAnUmVjb21tZW5kZWQgTW9kcycsIHtcbiAgICAgICAgICAgIHRleHQ6XG4gICAgICAgICAgICAgICdXZSByZWNvbW1lbmQgaW5zdGFsbGluZyBcIkJhbGR1clxcJ3MgR2F0ZSAzIE1vZCBGaXhlclwiIHRvIGJlIGFibGUgdG8gbW9kIEJhbGR1clxcJ3MgR2F0ZSAzLlxcblxcbicgKyBcbiAgICAgICAgICAgICAgJ1RoaXMgY2FuIGJlIGRvd25sb2FkZWQgZnJvbSBOZXh1cyBNb2RzIGFuZCBpbnN0YWxsZWQgdXNpbmcgVm9ydGV4IGJ5IHByZXNzaW5nIFwiT3BlbiBOZXh1cyBNb2RzJ1xuICAgICAgICAgIH0sIFtcbiAgICAgICAgICAgIHsgbGFiZWw6ICdEaXNtaXNzJyB9LFxuICAgICAgICAgICAgeyBsYWJlbDogJ09wZW4gTmV4dXMgTW9kcycsIGRlZmF1bHQ6IHRydWUgfSxcbiAgICAgICAgICBdKVxuICAgICAgICAgICAgLnRoZW4ocmVzdWx0ID0+IHtcbiAgICAgICAgICAgICAgZGlzbWlzcygpO1xuICAgICAgICAgICAgICBpZiAocmVzdWx0LmFjdGlvbiA9PT0gJ09wZW4gTmV4dXMgTW9kcycpIHtcbiAgICAgICAgICAgICAgICB1dGlsLm9wbignaHR0cHM6Ly93d3cubmV4dXNtb2RzLmNvbS9iYWxkdXJzZ2F0ZTMvbW9kcy8xNDE/dGFiPWRlc2NyaXB0aW9uJykuY2F0Y2goKCkgPT4gbnVsbClcbiAgICAgICAgICAgICAgfSBlbHNlIGlmIChyZXN1bHQuYWN0aW9uID09PSAnQ2FuY2VsJykge1xuICAgICAgICAgICAgICAgIC8vIGRpc21pc3MgYW55d2F5XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICBdLFxuICB9KTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gb25DaGVja01vZFZlcnNpb24oYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpLCBnYW1lSWQ6IHN0cmluZywgbW9kczogdHlwZXMuSU1vZFtdKSB7XG4gIGNvbnN0IHByb2ZpbGUgPSBzZWxlY3RvcnMuYWN0aXZlUHJvZmlsZShhcGkuZ2V0U3RhdGUoKSk7XG4gIGlmIChwcm9maWxlLmdhbWVJZCAhPT0gR0FNRV9JRCB8fCBnYW1lSWQgIT09IEdBTUVfSUQpIHtcbiAgICByZXR1cm47XG4gIH1cblxuICBjb25zdCBsYXRlc3RWZXI6IHN0cmluZyA9IGdldExhdGVzdEluc3RhbGxlZExTTGliVmVyKGFwaSk7XG5cbiAgaWYgKGxhdGVzdFZlciA9PT0gJzAuMC4wJykge1xuICAgIC8vIE5vdGhpbmcgdG8gdXBkYXRlLlxuICAgIHJldHVybjtcbiAgfVxuXG4gIGNvbnN0IG5ld2VzdFZlcjogc3RyaW5nID0gYXdhaXQgZ2l0SHViRG93bmxvYWRlci5jaGVja0ZvclVwZGF0ZXMoYXBpLCBsYXRlc3RWZXIpO1xuICBpZiAoIW5ld2VzdFZlciB8fCBuZXdlc3RWZXIgPT09IGxhdGVzdFZlcikge1xuICAgIHJldHVybjtcbiAgfVxufVxuXG5hc3luYyBmdW5jdGlvbiBvbkdhbWVNb2RlQWN0aXZhdGVkKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSwgZ2FtZUlkOiBzdHJpbmcpIHtcbiAgaWYgKGdhbWVJZCAhPT0gR0FNRV9JRCkge1xuICAgIFBha0luZm9DYWNoZS5nZXRJbnN0YW5jZShhcGkpLnNhdmUoKTtcbiAgICByZXR1cm47XG4gIH1cbiAgdHJ5IHtcbiAgICBhd2FpdCBtaWdyYXRlKGFwaSk7XG4gICAgY29uc3QgYmczUHJvZmlsZUlkID0gYXdhaXQgZ2V0QWN0aXZlUGxheWVyUHJvZmlsZShhcGkpO1xuICAgIGNvbnN0IGdhbWVTZXR0aW5nc1BhdGg6IHN0cmluZyA9IHBhdGguam9pbihwcm9maWxlc1BhdGgoKSwgYmczUHJvZmlsZUlkLCAnbW9kc2V0dGluZ3MubHN4Jyk7XG4gICAgbGV0IG5vZGVzID0gYXdhaXQgZ2V0Tm9kZXMoZ2FtZVNldHRpbmdzUGF0aCk7XG4gICAgY29uc3QgeyBtb2RzTm9kZSwgbW9kc09yZGVyTm9kZSB9ID0gbm9kZXM7XG4gICAgaWYgKChtb2RzTm9kZS5jaGlsZHJlbiA9PT0gdW5kZWZpbmVkKSB8fCAoKG1vZHNOb2RlLmNoaWxkcmVuWzBdIGFzIGFueSkgPT09ICcnKSkge1xuICAgICAgbW9kc05vZGUuY2hpbGRyZW4gPSBbeyBub2RlOiBbXSB9XTtcbiAgICB9XG5cblxuICAgIGNvbnN0IGZvcm1hdCA9IGF3YWl0IGdldERlZmF1bHRNb2RTZXR0aW5nc0Zvcm1hdChhcGkpO1xuICAgIGlmIChtb2RzT3JkZXJOb2RlID09PSB1bmRlZmluZWQgJiYgWyd2NycsICd2OCddLmluY2x1ZGVzKGZvcm1hdCkpIHtcbiAgICAgIGNvbnN0IGNvbnZGdW5jID0gZm9ybWF0ID09PSAndjcnID8gY29udmVydFY2dG9WNyA6IGNvbnZlcnRUb1Y4O1xuICAgICAgY29uc3QgZGF0YSA9IGF3YWl0IGZzLnJlYWRGaWxlQXN5bmMoZ2FtZVNldHRpbmdzUGF0aCwgeyBlbmNvZGluZzogJ3V0ZjgnIH0pO1xuICAgICAgY29uc3QgbmV3RGF0YSA9IGF3YWl0IGNvbnZGdW5jKGRhdGEpO1xuICAgICAgYXdhaXQgZnMucmVtb3ZlQXN5bmMoZ2FtZVNldHRpbmdzUGF0aCkuY2F0Y2goZXJyID0+IFByb21pc2UucmVzb2x2ZSgpKTtcbiAgICAgIGF3YWl0IGZzLndyaXRlRmlsZUFzeW5jKGdhbWVTZXR0aW5nc1BhdGgsIG5ld0RhdGEsIHsgZW5jb2Rpbmc6ICd1dGY4JyB9KTtcbiAgICB9XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIGFwaS5zaG93RXJyb3JOb3RpZmljYXRpb24oXG4gICAgICAnRmFpbGVkIHRvIG1pZ3JhdGUnLCBlcnIsIHtcbiAgICAgICAgLy9tZXNzYWdlOiAnUGxlYXNlIHJ1biB0aGUgZ2FtZSBiZWZvcmUgeW91IHN0YXJ0IG1vZGRpbmcnLFxuICAgICAgICBhbGxvd1JlcG9ydDogZmFsc2UsXG4gICAgfSk7XG4gIH1cblxuICB0cnkge1xuICAgIGF3YWl0IHJlYWRTdG9yZWRMTyhhcGkpO1xuICAgIFBha0luZm9DYWNoZS5nZXRJbnN0YW5jZShhcGkpO1xuICB9IGNhdGNoIChlcnIpIHtcbiAgICBhcGkuc2hvd0Vycm9yTm90aWZpY2F0aW9uKFxuICAgICAgJ0ZhaWxlZCB0byByZWFkIGxvYWQgb3JkZXInLCBlcnIsIHtcbiAgICAgICAgbWVzc2FnZTogJ1BsZWFzZSBydW4gdGhlIGdhbWUgYmVmb3JlIHlvdSBzdGFydCBtb2RkaW5nJyxcbiAgICAgICAgYWxsb3dSZXBvcnQ6IGZhbHNlLFxuICAgIH0pO1xuICB9XG5cbiAgY29uc3QgbGF0ZXN0VmVyOiBzdHJpbmcgPSBnZXRMYXRlc3RJbnN0YWxsZWRMU0xpYlZlcihhcGkpO1xuICBpZiAobGF0ZXN0VmVyID09PSAnMC4wLjAnKSB7XG4gICAgYXdhaXQgZ2l0SHViRG93bmxvYWRlci5kb3dubG9hZERpdmluZShhcGkpO1xuICB9XG59XG5cbmZ1bmN0aW9uIG1haW4oY29udGV4dDogdHlwZXMuSUV4dGVuc2lvbkNvbnRleHQpIHtcbiAgY29udGV4dC5yZWdpc3RlclJlZHVjZXIoWydzZXR0aW5ncycsICdiYWxkdXJzZ2F0ZTMnXSwgcmVkdWNlcik7XG5cbiAgY29udGV4dC5yZWdpc3RlckdhbWUoe1xuICAgIGlkOiBHQU1FX0lELFxuICAgIG5hbWU6ICdCYWxkdXJcXCdzIEdhdGUgMycsXG4gICAgbWVyZ2VNb2RzOiB0cnVlLFxuICAgIHF1ZXJ5UGF0aDogZmluZEdhbWUsXG4gICAgc3VwcG9ydGVkVG9vbHM6IHByb2Nlc3MucGxhdGZvcm0gPT09ICdkYXJ3aW4nID8gW10gOiBbXG4gICAgICB7XG4gICAgICAgIGlkOiAnZXhldnVsa2FuJyxcbiAgICAgICAgbmFtZTogJ0JhbGR1clxcJ3MgR2F0ZSAzIChWdWxrYW4pJyxcbiAgICAgICAgZXhlY3V0YWJsZTogKCkgPT4gJ2Jpbi9iZzMuZXhlJyxcbiAgICAgICAgcmVxdWlyZWRGaWxlczogW1xuICAgICAgICAgICdiaW4vYmczLmV4ZScsXG4gICAgICAgIF0sXG4gICAgICAgIHJlbGF0aXZlOiB0cnVlLFxuICAgICAgfSxcbiAgICBdLFxuICAgIHF1ZXJ5TW9kUGF0aDogbW9kc1BhdGgsXG4gICAgbG9nbzogJ2dhbWVhcnQuanBnJyxcbiAgICBleGVjdXRhYmxlOiAoKSA9PiAocHJvY2Vzcy5wbGF0Zm9ybSA9PT0gJ2RhcndpbicgPyAnQmFsZHVycyBHYXRlIDMnIDogJ2Jpbi9iZzNfZHgxMS5leGUnKSxcbiAgICBzZXR1cDogZGlzY292ZXJ5ID0+IHByZXBhcmVGb3JNb2RkaW5nKGNvbnRleHQuYXBpLCBkaXNjb3ZlcnkpIGFzIGFueSxcbiAgICByZXF1aXJlZEZpbGVzOiBwcm9jZXNzLnBsYXRmb3JtID09PSAnZGFyd2luJ1xuICAgICAgPyBbXG4gICAgICAgICdCYWxkdXJzIEdhdGUgMycsXG4gICAgICBdXG4gICAgICA6IFtcbiAgICAgICAgJ2Jpbi9iZzNfZHgxMS5leGUnLFxuICAgICAgXSxcbiAgICBlbnZpcm9ubWVudDoge1xuICAgICAgU3RlYW1BUFBJZDogU1RFQU1fSUQsXG4gICAgfSxcbiAgICBkZXRhaWxzOiB7XG4gICAgICAvLyBpZ25vcmVkIGZpbGVzIHRvIGJlIGxlZnQgaW4gc3RhZ2luZyAocGx1Z2lucy50eHQsIHNreXJpbS5pbmksIGV0Yy4pXG4gICAgICBzdG9wUGF0dGVybnM6IFNUT1BfUEFUVEVSTlMubWFwKHRvV29yZEV4cCksXG4gICAgICAvLyBhY2NlcHRlZCBtb2QgZXh0ZW5zaW9ucyBmb3IgdGhpcyBnYW1lICh3aGF0IHdpbGwgYmUgY2xhaW1lZCBpbiBtb2QgcGFnZSlcbiAgICAgIHN1cHBvcnRlZFRvb2xzOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBpZDogJ2V4ZScsXG4gICAgICAgICAgbmFtZTogJ0JhbGR1clxcJ3MgR2F0ZSAzIChEWDExKScsXG4gICAgICAgICAgZXhlY3V0YWJsZTogJ2Jpbi9iZzNfZHgxMS5leGUnLFxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgaWQ6ICdleGV2dWxrYW4nLFxuICAgICAgICAgIG5hbWU6ICdCYWxkdXJcXCdzIEdhdGUgMyAoVnVsa2FuKScsXG4gICAgICAgICAgZXhlY3V0YWJsZTogJ2Jpbi9iZzMuZXhlJyxcbiAgICAgICAgfSxcbiAgICAgIF0sXG4gICAgICBnYW1lRGF0YVBhdGg6IGdldEdhbWVEYXRhUGF0aChjb250ZXh0LmFwaSksXG4gICAgICBzdXBwb3J0ZWRNb2RUeXBlczogW01PRF9UWVBFX0xTTElCLCBNT0RfVFlQRV9MT09TRSwgTU9EX1RZUEVfQkczU0UsIE1PRF9UWVBFX1JFUExBQ0VSXSxcbiAgICAgIGF1dG9EZXBsb3k6IHRydWUsXG4gICAgICBpZ25vcmVDb25mbGljdHM6IElHTk9SRV9QQVRURVJOUyxcbiAgICAgIHNob3dXcm9uZ0dhbWVXYXJuaW5nOiB0cnVlLFxuICAgICAgc2hlbGw6IGZhbHNlLFxuICAgIH0sXG4gIH0pO1xuXG4gIGNvbnRleHQucmVnaXN0ZXJTZXR0aW5ncygnTW9kcycsIFNldHRpbmdzKTtcblxuICAvLyBjb250ZXh0LnJlZ2lzdGVyTW9kVHlwZShNT0RfVFlQRV9SRVBMQUNFUiwgOTgpXG4gIC8vIGNvbnRleHQucmVnaXN0ZXJNb2RUeXBlKE1PRF9UWVBFX0xTTElCLCA5OSlcbiAgLy8gY29udGV4dC5yZWdpc3Rlck1vZFR5cGUoTU9EX1RZUEVfQkczU0UsIDEwMClcbiAgLy8gY29udGV4dC5yZWdpc3Rlck1vZFR5cGUoTU9EX1RZUEVfTE9PU0UsIDIwMClcblxuICAvLyBMb29zZSBtb2RzIG11c3QgYmUgcmVyb3V0ZWQgdG8gdGhlIHVzZXIgbW9kcyBmb2xkZXIuIEJHMyBjYW4gdGhyb3cgZXhjZXB0aW9uc1xuICAvLyB3aGVuIG1vZHMgYXJlIG1vdmVkLCBzbyB3ZSBtdXN0IG1vdmUgdGhlIG1vZHMgb3Vyc2VsdmVzIGFuZCB0aGUgZGlzcGF0Y2ggdGhlIGNoYW5nZS5cbiAgY29udGV4dC5yZWdpc3Rlck1vZFR5cGUoXG4gICAgTU9EX1RZUEVfTE9PU0UsXG4gICAgMjAwLFxuICAgIChnYW1lSWQpID0+IGdhbWVJZCA9PT0gR0FNRV9JRCxcbiAgICAoX2dhbWUpID0+IG1vZHNQYXRoKCksXG4gICAgKGluc3RydWN0aW9ucykgPT4gQmx1ZWJpcmQucmVzb2x2ZShpc0xvb3NlKGluc3RydWN0aW9ucykpLFxuICApO1xuICBjb250ZXh0LnJlZ2lzdGVyTW9kVHlwZShcbiAgICBNT0RfVFlQRV9SRVBMQUNFUixcbiAgICAxMDAsXG4gICAgKGdhbWVJZCkgPT4gZ2FtZUlkID09PSBHQU1FX0lELFxuICAgIChfZ2FtZSkgPT4gZ2V0R2FtZVBhdGgoY29udGV4dC5hcGkpLFxuICAgIChpbnN0cnVjdGlvbnMpID0+IEJsdWViaXJkLnJlc29sdmUoaXNSZXBsYWNlcihjb250ZXh0LmFwaSwgaW5zdHJ1Y3Rpb25zKSksXG4gICk7XG4gIGNvbnRleHQucmVnaXN0ZXJNb2RUeXBlKFxuICAgIE1PRF9UWVBFX0xTTElCLFxuICAgIDk5LFxuICAgIChnYW1lSWQpID0+IGdhbWVJZCA9PT0gR0FNRV9JRCxcbiAgICAoX2dhbWUpID0+IGdldEdhbWVQYXRoKGNvbnRleHQuYXBpKSxcbiAgICAoaW5zdHJ1Y3Rpb25zKSA9PiBCbHVlYmlyZC5yZXNvbHZlKGlzTFNMaWIoaW5zdHJ1Y3Rpb25zKSksXG4gICk7XG4gIGNvbnRleHQucmVnaXN0ZXJNb2RUeXBlKFxuICAgIE1PRF9UWVBFX0JHM1NFLFxuICAgIDEwMCxcbiAgICAoZ2FtZUlkKSA9PiBnYW1lSWQgPT09IEdBTUVfSUQsXG4gICAgKF9nYW1lKSA9PiBwYXRoLmpvaW4oZ2V0R2FtZVBhdGgoY29udGV4dC5hcGkpLCAnYmluJyksXG4gICAgKGluc3RydWN0aW9ucykgPT4gQmx1ZWJpcmQucmVzb2x2ZShpc0JHM1NFKGluc3RydWN0aW9ucykpLFxuICApO1xuXG4gIGNvbnRleHQucmVnaXN0ZXJBY3Rpb24oJ21vZHMtYWN0aW9uLWljb25zJywgOTk5LCAndXBkYXRlJywge30sICdDaGVjayBNb2QgVmVyc2lvbnMnLCAoaW5zdGFuY2VJZHMpID0+IHtcbiAgICAgIHZvaWQgb25DaGVja01vZFZlcnNpb24oY29udGV4dC5hcGksIHNlbGVjdG9ycy5hY3RpdmVHYW1lSWQoY29udGV4dC5hcGkuZ2V0U3RhdGUoKSksIFtdKTtcbiAgfSk7XG5cbiAgY29udGV4dC5vbmNlKCgpID0+IHtcbiAgICBjb250ZXh0LmFwaS5vbkFzeW5jKCdkaWQtZGVwbG95JywgKHByb2ZpbGVJZCwgcHJvZmlsZVR5cGUsIGRlcGxveW1lbnQpID0+IHtcbiAgICAgIGZvcmNlUmVmcmVzaChjb250ZXh0LmFwaSk7XG4gICAgICByZXR1cm4gQmx1ZWJpcmQucmVzb2x2ZSgpO1xuICAgIH0pO1xuICB9KTtcblxufVxuXG5leHBvcnQgZGVmYXVsdCBtYWluO1xuIl19