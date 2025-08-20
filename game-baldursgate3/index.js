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
const React = __importStar(require("react"));
const vortex_api_1 = require("vortex-api");
const common_1 = require("./common");
const gitHubDownloader = __importStar(require("./githubDownloader"));
const Settings_1 = __importDefault(require("./Settings"));
const reducers_1 = __importDefault(require("./reducers"));
const migrations_1 = require("./migrations");
const util_1 = require("./util");
const installers_1 = require("./installers");
const modTypes_1 = require("./modTypes");
const loadOrder_1 = require("./loadOrder");
const InfoPanel_1 = require("./InfoPanel");
const cache_1 = __importDefault(require("./cache"));
const STOP_PATTERNS = ['[^/]*\\.pak$'];
const GOG_ID = '1456460669';
const STEAM_ID = '1086940';
function toWordExp(input) {
    return '(^|/)' + input + '(/|$)';
}
function findGame() {
    return vortex_api_1.util.GameStoreHelper.findByAppId([GOG_ID, STEAM_ID])
        .then(game => game.gamePath);
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
        supportedTools: [
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
        executable: () => 'bin/bg3_dx11.exe',
        setup: discovery => prepareForModding(context.api, discovery),
        requiredFiles: [
            'bin/bg3_dx11.exe',
        ],
        environment: {
            SteamAPPId: STEAM_ID,
        },
        details: {
            steamAppId: +STEAM_ID,
            stopPatterns: STOP_PATTERNS.map(toWordExp),
            ignoreConflicts: common_1.IGNORE_PATTERNS,
            ignoreDeploy: common_1.IGNORE_PATTERNS,
        },
    });
    context.registerAction('mod-icons', 300, 'settings', {}, 'Re-install LSLib/Divine', () => {
        const state = context.api.getState();
        const mods = vortex_api_1.util.getSafe(state, ['persistent', 'mods', common_1.GAME_ID], {});
        const lslibs = Object.keys(mods).filter(mod => mods[mod].type === 'bg3-lslib-divine-tool');
        context.api.events.emit('remove-mods', common_1.GAME_ID, lslibs, (err) => {
            if (err !== null) {
                context.api.showErrorNotification('Failed to reinstall lslib', 'Please re-install manually', { allowReport: false });
                return;
            }
            gitHubDownloader.downloadDivine(context.api);
        });
    }, () => {
        const state = context.api.store.getState();
        const gameMode = vortex_api_1.selectors.activeGameId(state);
        return gameMode === common_1.GAME_ID;
    });
    context.registerInstaller('bg3-lslib-divine-tool', 15, installers_1.testLSLib, installers_1.installLSLib);
    context.registerInstaller('bg3-bg3se', 15, installers_1.testBG3SE, installers_1.installBG3SE);
    context.registerInstaller('bg3-engine-injector', 20, installers_1.testEngineInjector, installers_1.installEngineInjector);
    context.registerInstaller('bg3-replacer', 25, installers_1.testReplacer, installers_1.installReplacer);
    context.registerInstaller('bg3-modfixer', 25, installers_1.testModFixer, installers_1.installModFixer);
    context.registerModType(common_1.MOD_TYPE_LSLIB, 15, (gameId) => gameId === common_1.GAME_ID, () => undefined, modTypes_1.isLSLib, { name: 'BG3 LSLib', noConflicts: true });
    context.registerModType(common_1.MOD_TYPE_BG3SE, 15, (gameId) => gameId === common_1.GAME_ID, () => path.join((0, util_1.getGamePath)(context.api), 'bin'), modTypes_1.isBG3SE, { name: 'BG3 BG3SE' });
    context.registerModType(common_1.MOD_TYPE_LOOSE, 20, (gameId) => gameId === common_1.GAME_ID, () => (0, util_1.getGameDataPath)(context.api), modTypes_1.isLoose, { name: 'BG3 Loose' });
    context.registerModType(common_1.MOD_TYPE_REPLACER, 25, (gameId) => gameId === common_1.GAME_ID, () => (0, util_1.getGameDataPath)(context.api), instructions => (0, modTypes_1.isReplacer)(context.api, instructions), { name: 'BG3 Replacer' });
    context.registerLoadOrder({
        clearStateOnPurge: false,
        gameId: common_1.GAME_ID,
        deserializeLoadOrder: () => (0, loadOrder_1.deserialize)(context),
        serializeLoadOrder: (loadOrder, prev) => (0, loadOrder_1.serialize)(context, loadOrder),
        validate: loadOrder_1.validate,
        toggleableEntries: false,
        usageInstructions: (() => (React.createElement(InfoPanel_1.InfoPanelWrap, { api: context.api, getOwnGameVersion: util_1.getOwnGameVersion, readStoredLO: util_1.readStoredLO, installLSLib: onGameModeActivated, getLatestLSLibMod: util_1.getLatestLSLibMod }))),
    });
    const isBG3 = () => {
        const state = context.api.getState();
        const activeGame = vortex_api_1.selectors.activeGameId(state);
        return activeGame === common_1.GAME_ID;
    };
    context.registerAction('fb-load-order-icons', 150, 'changelog', {}, 'Export to Game', () => { (0, loadOrder_1.exportToGame)(context.api); }, isBG3);
    context.registerAction('fb-load-order-icons', 151, 'changelog', {}, 'Export to File...', () => { (0, loadOrder_1.exportToFile)(context.api); }, isBG3);
    context.registerAction('fb-load-order-icons', 160, 'import', {}, 'Import from Game', () => { (0, loadOrder_1.importModSettingsGame)(context.api); }, isBG3);
    context.registerAction('fb-load-order-icons', 161, 'import', {}, 'Import from File...', () => {
        (0, loadOrder_1.importModSettingsFile)(context.api);
    }, isBG3);
    context.registerAction('fb-load-order-icons', 170, 'import', {}, 'Import from BG3MM...', () => { (0, loadOrder_1.importFromBG3MM)(context); }, isBG3);
    context.registerAction('fb-load-order-icons', 190, 'open-ext', {}, 'Open Load Order File', () => {
        (0, util_1.getActivePlayerProfile)(context.api)
            .then(bg3ProfileId => {
            const gameSettingsPath = path.join((0, util_1.profilesPath)(), bg3ProfileId, 'modsettings.lsx');
            vortex_api_1.util.opn(gameSettingsPath).catch(() => null);
        });
    }, isBG3);
    context.registerSettings('Mods', Settings_1.default, undefined, isBG3, 150);
    context.once(() => {
        context.api.onStateChange(['session', 'base', 'toolsRunning'], (prev, current) => __awaiter(this, void 0, void 0, function* () {
            const gameMode = vortex_api_1.selectors.activeGameId(context.api.getState());
            if ((gameMode === common_1.GAME_ID) && (Object.keys(current).length === 0)) {
                try {
                    yield (0, util_1.readStoredLO)(context.api);
                }
                catch (err) {
                    context.api.showErrorNotification('Failed to read load order', err, {
                        message: 'Please run the game before you start modding',
                        allowReport: false,
                    });
                }
            }
        }));
        context.api.onAsync('did-deploy', (profileId, deployment) => __awaiter(this, void 0, void 0, function* () {
            const profile = vortex_api_1.selectors.profileById(context.api.getState(), profileId);
            if ((profile === null || profile === void 0 ? void 0 : profile.gameId) === common_1.GAME_ID) {
                (0, util_1.forceRefresh)(context.api);
            }
            yield cache_1.default.getInstance(context.api).save();
            return Promise.resolve();
        }));
        context.api.events.on('check-mods-version', (gameId, mods) => onCheckModVersion(context.api, gameId, mods));
        context.api.events.on('gamemode-activated', (gameMode) => __awaiter(this, void 0, void 0, function* () { return onGameModeActivated(context.api, gameMode); }));
    });
    return true;
}
exports.default = main;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50c3giXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQVVBLHdEQUFnQztBQUVoQywyQ0FBNkI7QUFDN0IsNkNBQStCO0FBQy9CLDJDQUF3RDtBQUV4RCxxQ0FFa0I7QUFDbEIscUVBQXVEO0FBQ3ZELDBEQUFrQztBQUNsQywwREFBaUM7QUFDakMsNkNBQXVDO0FBRXZDLGlDQVVnQjtBQUVoQiw2Q0FHc0I7QUFFdEIseUNBRW9CO0FBRXBCLDJDQUlxQjtBQUVyQiwyQ0FBMkM7QUFDM0Msb0RBQW1DO0FBRW5DLE1BQU0sYUFBYSxHQUFHLENBQUMsY0FBYyxDQUFDLENBQUM7QUFFdkMsTUFBTSxNQUFNLEdBQUcsWUFBWSxDQUFDO0FBQzVCLE1BQU0sUUFBUSxHQUFHLFNBQVMsQ0FBQztBQUUzQixTQUFTLFNBQVMsQ0FBQyxLQUFLO0lBQ3RCLE9BQU8sT0FBTyxHQUFHLEtBQUssR0FBRyxPQUFPLENBQUM7QUFDbkMsQ0FBQztBQUVELFNBQVMsUUFBUTtJQUNmLE9BQU8saUJBQUksQ0FBQyxlQUFlLENBQUMsV0FBVyxDQUFDLENBQUMsTUFBTSxFQUFFLFFBQVEsQ0FBQyxDQUFDO1NBQ3hELElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztBQUNqQyxDQUFDO0FBRUQsU0FBZSxtQkFBbUIsQ0FBQyxHQUF3QixFQUFFLFNBQWlDOztRQUM1RixJQUFJLFNBQVMsYUFBVCxTQUFTLHVCQUFULFNBQVMsQ0FBRSxJQUFJLEVBQUU7WUFDbkIsTUFBTSxXQUFXLEdBQUcsTUFBTSxJQUFBLHdCQUFpQixFQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQ2pELElBQUk7Z0JBQ0YsTUFBTSxlQUFFLENBQUMsc0JBQXNCLENBQUMsV0FBVyxDQUFDLENBQUM7Z0JBQzdDLE1BQU0sbUJBQW1CLEdBQUcsSUFB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RTtZQUN4RSxNQUFNLE9BQU8sR0FBRyxzQkFBUyxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLFFBQVEsRUFBRSxFQUFFLFNBQVMsQ0FBQyxDQUFDO1lBQ3pFLElBQUksQ0FBQSxPQUFPLGFBQVAsT0FBTyx1QkFBUCxPQUFPLENBQUUsTUFBTSxNQUFLLGdCQUFPLEVBQUU7Z0JBQy9CLElBQUEsbUJBQVksRUFBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUM7YUFDM0I7WUFDRCxNQUFNLGVBQVksQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDO1lBQ25ELE9BQU8sT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQzNCLENBQUMsQ0FBQSxDQUFDLENBQUM7UUFFSCxPQUFPLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsb0JBQW9CLEVBQ3hDLENBQUMsTUFBYyxFQUFFLElBQWtCLEVBQUUsRUFBRSxDQUFDLGlCQUFpQixDQUFDLE9BQU8sQ0FBQyxHQUFHLEVBQUUsTUFBTSxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7UUFFeEYsT0FBTyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLG9CQUFvQixFQUN4QyxDQUFPLFFBQWdCLEVBQUUsRUFBRSxnREFBQyxPQUFBLG1CQUFtQixDQUFDLE9BQU8sQ0FBQyxHQUFHLEVBQUUsUUFBUSxDQUFDLENBQUEsR0FBQSxDQUFDLENBQUM7SUFDNUUsQ0FBQyxDQUFDLENBQUM7SUFFSCxPQUFPLElBQUksQ0FBQztBQUNkLENBQUM7QUFFRCxrQkFBZSxJQUFJLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiBlc2xpbnQtZGlzYWJsZSAqL1xuLyoqXG4gKiBJbXBvcnRhbnQgLSBhbHRob3VnaCB3ZSBubyBsb25nZXIgZGVmaW5lIHRoZSBpbmZvIHBhbmVsIGhlcmUsXG4gKiAgd2Ugc3RpbGwgbmVlZCB0byBrZWVwIHRoZSBpbmRleCBmaWxlJ3MgJy50c3gnIGV4dGVuc2lvbi5cbiAqICBBdCBsZWFzdCB3aGlsZSBvdXIgdXBkYXRlIHByb2Nlc3MgZm9yIGJ1bmRsZWQgcGx1Z2lucyByZW1haW5zXG4gKiAgdGhyb3VnaCB0aGUgJ3JlbGVhc2UnIGJyYW5jaC5cbiAqIFxuICogUmVtb3ZpbmcgZmlsZXMgZnJvbSBidW5kbGVkIHBsdWdpbnMgd2l0aG91dCBzdHViYmluZyB0aGUgZXh0ZW5zaW9uXG4gKiAgY2FuIHBvdGVudGlhbGx5IGJyZWFrIHRoZSBleHRlbnNpb24gb24gdGhlIHVzZXIncyBlbmQuXG4gKi9cbmltcG9ydCBCbHVlYmlyZCBmcm9tICdibHVlYmlyZCc7XG5pbXBvcnQgKiBhcyBfIGZyb20gJ2xvZGFzaCc7XG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0ICogYXMgUmVhY3QgZnJvbSAncmVhY3QnO1xuaW1wb3J0IHsgZnMsIHNlbGVjdG9ycywgdHlwZXMsIHV0aWwgfSBmcm9tICd2b3J0ZXgtYXBpJztcblxuaW1wb3J0IHsgR0FNRV9JRCwgSUdOT1JFX1BBVFRFUk5TLFxuICBNT0RfVFlQRV9CRzNTRSwgTU9EX1RZUEVfTE9PU0UsIE1PRF9UWVBFX0xTTElCLCBNT0RfVFlQRV9SRVBMQUNFUixcbn0gZnJvbSAnLi9jb21tb24nO1xuaW1wb3J0ICogYXMgZ2l0SHViRG93bmxvYWRlciBmcm9tICcuL2dpdGh1YkRvd25sb2FkZXInO1xuaW1wb3J0IFNldHRpbmdzIGZyb20gJy4vU2V0dGluZ3MnO1xuaW1wb3J0IHJlZHVjZXIgZnJvbSAnLi9yZWR1Y2Vycyc7XG5pbXBvcnQgeyBtaWdyYXRlIH0gZnJvbSAnLi9taWdyYXRpb25zJztcblxuaW1wb3J0IHtcbiAgbG9nRGVidWcsIGZvcmNlUmVmcmVzaCwgZ2V0TGF0ZXN0SW5zdGFsbGVkTFNMaWJWZXIsXG4gIGdldEdhbWVEYXRhUGF0aCwgZ2V0R2FtZVBhdGgsIGdsb2JhbFByb2ZpbGVQYXRoLCBtb2RzUGF0aCxcbiAgZ2V0TGF0ZXN0TFNMaWJNb2QsIGdldE93bkdhbWVWZXJzaW9uLCByZWFkU3RvcmVkTE8sXG4gIGdldERlZmF1bHRNb2RTZXR0aW5ncyxcbiAgZ2V0RGVmYXVsdE1vZFNldHRpbmdzRm9ybWF0LFxuICBnZXRBY3RpdmVQbGF5ZXJQcm9maWxlLFxuICBwcm9maWxlc1BhdGgsXG4gIGNvbnZlcnRWNnRvVjcsXG4gIGNvbnZlcnRUb1Y4LFxufSBmcm9tICcuL3V0aWwnO1xuXG5pbXBvcnQge1xuICB0ZXN0TFNMaWIsIHRlc3RCRzNTRSwgdGVzdEVuZ2luZUluamVjdG9yLCB0ZXN0TW9kRml4ZXIsIHRlc3RSZXBsYWNlcixcbiAgaW5zdGFsbExTTGliLCBpbnN0YWxsQkczU0UsIGluc3RhbGxFbmdpbmVJbmplY3RvciwgaW5zdGFsbE1vZEZpeGVyLCBpbnN0YWxsUmVwbGFjZXIsXG59IGZyb20gJy4vaW5zdGFsbGVycyc7XG5cbmltcG9ydCB7XG4gIGlzQkczU0UsIGlzTFNMaWIsIGlzTG9vc2UsIGlzUmVwbGFjZXIsXG59IGZyb20gJy4vbW9kVHlwZXMnO1xuXG5pbXBvcnQge1xuICBkZXNlcmlhbGl6ZSwgaW1wb3J0TW9kU2V0dGluZ3NGaWxlLCBpbXBvcnRNb2RTZXR0aW5nc0dhbWUsXG4gIGltcG9ydEZyb21CRzNNTSwgc2VyaWFsaXplLCBleHBvcnRUb0dhbWUsIGV4cG9ydFRvRmlsZSwgdmFsaWRhdGUsXG4gIGdldE5vZGVzLFxufSBmcm9tICcuL2xvYWRPcmRlcic7XG5cbmltcG9ydCB7IEluZm9QYW5lbFdyYXAgfSBmcm9tICcuL0luZm9QYW5lbCdcbmltcG9ydCBQYWtJbmZvQ2FjaGUgZnJvbSAnLi9jYWNoZSc7XG5cbmNvbnN0IFNUT1BfUEFUVEVSTlMgPSBbJ1teL10qXFxcXC5wYWskJ107XG5cbmNvbnN0IEdPR19JRCA9ICcxNDU2NDYwNjY5JztcbmNvbnN0IFNURUFNX0lEID0gJzEwODY5NDAnO1xuXG5mdW5jdGlvbiB0b1dvcmRFeHAoaW5wdXQpIHtcbiAgcmV0dXJuICcoXnwvKScgKyBpbnB1dCArICcoL3wkKSc7XG59XG5cbmZ1bmN0aW9uIGZpbmRHYW1lKCk6IGFueSB7XG4gIHJldHVybiB1dGlsLkdhbWVTdG9yZUhlbHBlci5maW5kQnlBcHBJZChbR09HX0lELCBTVEVBTV9JRF0pXG4gICAgLnRoZW4oZ2FtZSA9PiBnYW1lLmdhbWVQYXRoKTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gZW5zdXJlR2xvYmFsUHJvZmlsZShhcGk6IHR5cGVzLklFeHRlbnNpb25BcGksIGRpc2NvdmVyeTogdHlwZXMuSURpc2NvdmVyeVJlc3VsdCkge1xuICBpZiAoZGlzY292ZXJ5Py5wYXRoKSB7XG4gICAgY29uc3QgcHJvZmlsZVBhdGggPSBhd2FpdCBnbG9iYWxQcm9maWxlUGF0aChhcGkpO1xuICAgIHRyeSB7XG4gICAgICBhd2FpdCBmcy5lbnN1cmVEaXJXcml0YWJsZUFzeW5jKHByb2ZpbGVQYXRoKTtcbiAgICAgIGNvbnN0IG1vZFNldHRpbmdzRmlsZVBhdGggPSBwYXRoLmpvaW4ocHJvZmlsZVBhdGgsICdtb2RzZXR0aW5ncy5sc3gnKTtcbiAgICAgIHRyeSB7XG4gICAgICAgIGF3YWl0IGZzLnN0YXRBc3luYyhtb2RTZXR0aW5nc0ZpbGVQYXRoKTtcbiAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICBjb25zdCBkZWZhdWx0TW9kU2V0dGluZ3MgPSBhd2FpdCBnZXREZWZhdWx0TW9kU2V0dGluZ3MoYXBpKTtcbiAgICAgICAgYXdhaXQgZnMud3JpdGVGaWxlQXN5bmMobW9kU2V0dGluZ3NGaWxlUGF0aCwgZGVmYXVsdE1vZFNldHRpbmdzLCB7IGVuY29kaW5nOiAndXRmOCcgfSk7XG4gICAgICB9XG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoZXJyKTtcbiAgICB9XG4gIH1cbn1cblxuYXN5bmMgZnVuY3Rpb24gcHJlcGFyZUZvck1vZGRpbmcoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpLCBkaXNjb3ZlcnkpIHtcbiAgY29uc3QgbXAgPSBtb2RzUGF0aCgpOyAgXG5cbiAgY29uc3QgZm9ybWF0ID0gYXdhaXQgZ2V0RGVmYXVsdE1vZFNldHRpbmdzRm9ybWF0KGFwaSk7XG4gIGlmICghWyd2NycsICd2OCddLmluY2x1ZGVzKGZvcm1hdCkpIHtcbiAgICBzaG93RnVsbFJlbGVhc2VNb2RGaXhlclJlY29tbWVuZGF0aW9uKGFwaSk7XG4gIH1cbiAgXG4gIHJldHVybiBmcy5zdGF0QXN5bmMobXApXG4gICAgLmNhdGNoKCgpID0+IGZzLmVuc3VyZURpcldyaXRhYmxlQXN5bmMobXAsICgpID0+IEJsdWViaXJkLnJlc29sdmUoKSBhcyBhbnkpKVxuICAgIC5maW5hbGx5KCgpID0+IGVuc3VyZUdsb2JhbFByb2ZpbGUoYXBpLCBkaXNjb3ZlcnkpKTtcbn1cblxuZnVuY3Rpb24gc2hvd0Z1bGxSZWxlYXNlTW9kRml4ZXJSZWNvbW1lbmRhdGlvbihhcGk6IHR5cGVzLklFeHRlbnNpb25BcGkpIHtcbiAgLy8gY2hlY2sgdG8gc2VlIGlmIG1vZCBpcyBpbnN0YWxsZWQgZmlyc3Q/XG4gIGNvbnN0IG1vZHMgPSBhcGkuc3RvcmUuZ2V0U3RhdGUoKS5wZXJzaXN0ZW50Py5tb2RzPy5iYWxkdXJzZ2F0ZTM7XG4gIGlmKG1vZHMgIT09IHVuZGVmaW5lZCkge1xuICAgIGNvbnN0IG1vZEFycmF5OiB0eXBlcy5JTW9kW10gPSBtb2RzID8gT2JqZWN0LnZhbHVlcyhtb2RzKSA6IFtdO1xuICAgIGxvZ0RlYnVnKCdtb2RBcnJheScsIG1vZEFycmF5KTtcbiAgXG4gICAgY29uc3QgbW9kRml4ZXJJbnN0YWxsZWQ6Ym9vbGVhbiA9ICBtb2RBcnJheS5maWx0ZXIobW9kID0+ICEhbW9kPy5hdHRyaWJ1dGVzPy5tb2RGaXhlcikubGVuZ3RoICE9IDA7ICBcbiAgICBsb2dEZWJ1ZygnbW9kRml4ZXJJbnN0YWxsZWQnLCBtb2RGaXhlckluc3RhbGxlZCk7XG5cbiAgICAvLyBpZiB3ZSd2ZSBmb3VuZCBhbiBpbnN0YWxsZWQgbW9kZml4ZXIsIHRoZW4gZG9uJ3QgYm90aGVyIHNob3dpbmcgbm90aWZpY2F0aW9uIFxuICAgIGlmKG1vZEZpeGVySW5zdGFsbGVkKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICB9XG5cbiAgLy8gbm8gbW9kcyBmb3VuZFxuICBhcGkuc2VuZE5vdGlmaWNhdGlvbih7XG4gICAgdHlwZTogJ3dhcm5pbmcnLFxuICAgIHRpdGxlOiAnUmVjb21tZW5kZWQgTW9kJyxcbiAgICBtZXNzYWdlOiAnTW9zdCBtb2RzIHJlcXVpcmUgdGhpcyBtb2QuJyxcbiAgICBpZDogJ2JnMy1yZWNvbW1lbmRlZC1tb2QnLFxuICAgIGFsbG93U3VwcHJlc3M6IHRydWUsXG4gICAgYWN0aW9uczogW1xuICAgICAge1xuICAgICAgICB0aXRsZTogJ01vcmUnLCBhY3Rpb246IGRpc21pc3MgPT4ge1xuICAgICAgICAgIGFwaS5zaG93RGlhbG9nKCdxdWVzdGlvbicsICdSZWNvbW1lbmRlZCBNb2RzJywge1xuICAgICAgICAgICAgdGV4dDpcbiAgICAgICAgICAgICAgJ1dlIHJlY29tbWVuZCBpbnN0YWxsaW5nIFwiQmFsZHVyXFwncyBHYXRlIDMgTW9kIEZpeGVyXCIgdG8gYmUgYWJsZSB0byBtb2QgQmFsZHVyXFwncyBHYXRlIDMuXFxuXFxuJyArIFxuICAgICAgICAgICAgICAnVGhpcyBjYW4gYmUgZG93bmxvYWRlZCBmcm9tIE5leHVzIE1vZHMgYW5kIGluc3RhbGxlZCB1c2luZyBWb3J0ZXggYnkgcHJlc3NpbmcgXCJPcGVuIE5leHVzIE1vZHMnXG4gICAgICAgICAgfSwgW1xuICAgICAgICAgICAgeyBsYWJlbDogJ0Rpc21pc3MnIH0sXG4gICAgICAgICAgICB7IGxhYmVsOiAnT3BlbiBOZXh1cyBNb2RzJywgZGVmYXVsdDogdHJ1ZSB9LFxuICAgICAgICAgIF0pXG4gICAgICAgICAgICAudGhlbihyZXN1bHQgPT4ge1xuICAgICAgICAgICAgICBkaXNtaXNzKCk7XG4gICAgICAgICAgICAgIGlmIChyZXN1bHQuYWN0aW9uID09PSAnT3BlbiBOZXh1cyBNb2RzJykge1xuICAgICAgICAgICAgICAgIHV0aWwub3BuKCdodHRwczovL3d3dy5uZXh1c21vZHMuY29tL2JhbGR1cnNnYXRlMy9tb2RzLzE0MT90YWI9ZGVzY3JpcHRpb24nKS5jYXRjaCgoKSA9PiBudWxsKVxuICAgICAgICAgICAgICB9IGVsc2UgaWYgKHJlc3VsdC5hY3Rpb24gPT09ICdDYW5jZWwnKSB7XG4gICAgICAgICAgICAgICAgLy8gZGlzbWlzcyBhbnl3YXlcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIF0sXG4gIH0pO1xufVxuXG5hc3luYyBmdW5jdGlvbiBvbkNoZWNrTW9kVmVyc2lvbihhcGk6IHR5cGVzLklFeHRlbnNpb25BcGksIGdhbWVJZDogc3RyaW5nLCBtb2RzOiB0eXBlcy5JTW9kW10pIHtcbiAgY29uc3QgcHJvZmlsZSA9IHNlbGVjdG9ycy5hY3RpdmVQcm9maWxlKGFwaS5nZXRTdGF0ZSgpKTtcbiAgaWYgKHByb2ZpbGUuZ2FtZUlkICE9PSBHQU1FX0lEIHx8IGdhbWVJZCAhPT0gR0FNRV9JRCkge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGNvbnN0IGxhdGVzdFZlcjogc3RyaW5nID0gZ2V0TGF0ZXN0SW5zdGFsbGVkTFNMaWJWZXIoYXBpKTtcblxuICBpZiAobGF0ZXN0VmVyID09PSAnMC4wLjAnKSB7XG4gICAgLy8gTm90aGluZyB0byB1cGRhdGUuXG4gICAgcmV0dXJuO1xuICB9XG5cbiAgY29uc3QgbmV3ZXN0VmVyOiBzdHJpbmcgPSBhd2FpdCBnaXRIdWJEb3dubG9hZGVyLmNoZWNrRm9yVXBkYXRlcyhhcGksIGxhdGVzdFZlcik7XG4gIGlmICghbmV3ZXN0VmVyIHx8IG5ld2VzdFZlciA9PT0gbGF0ZXN0VmVyKSB7XG4gICAgcmV0dXJuO1xuICB9XG59XG5cbmFzeW5jIGZ1bmN0aW9uIG9uR2FtZU1vZGVBY3RpdmF0ZWQoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpLCBnYW1lSWQ6IHN0cmluZykge1xuICBpZiAoZ2FtZUlkICE9PSBHQU1FX0lEKSB7XG4gICAgUGFrSW5mb0NhY2hlLmdldEluc3RhbmNlKGFwaSkuc2F2ZSgpO1xuICAgIHJldHVybjtcbiAgfVxuICB0cnkge1xuICAgIGF3YWl0IG1pZ3JhdGUoYXBpKTtcbiAgICBjb25zdCBiZzNQcm9maWxlSWQgPSBhd2FpdCBnZXRBY3RpdmVQbGF5ZXJQcm9maWxlKGFwaSk7XG4gICAgY29uc3QgZ2FtZVNldHRpbmdzUGF0aDogc3RyaW5nID0gcGF0aC5qb2luKHByb2ZpbGVzUGF0aCgpLCBiZzNQcm9maWxlSWQsICdtb2RzZXR0aW5ncy5sc3gnKTtcbiAgICBsZXQgbm9kZXMgPSBhd2FpdCBnZXROb2RlcyhnYW1lU2V0dGluZ3NQYXRoKTtcbiAgICBjb25zdCB7IG1vZHNOb2RlLCBtb2RzT3JkZXJOb2RlIH0gPSBub2RlcztcbiAgICBpZiAoKG1vZHNOb2RlLmNoaWxkcmVuID09PSB1bmRlZmluZWQpIHx8ICgobW9kc05vZGUuY2hpbGRyZW5bMF0gYXMgYW55KSA9PT0gJycpKSB7XG4gICAgICBtb2RzTm9kZS5jaGlsZHJlbiA9IFt7IG5vZGU6IFtdIH1dO1xuICAgIH1cblxuXG4gICAgY29uc3QgZm9ybWF0ID0gYXdhaXQgZ2V0RGVmYXVsdE1vZFNldHRpbmdzRm9ybWF0KGFwaSk7XG4gICAgaWYgKG1vZHNPcmRlck5vZGUgPT09IHVuZGVmaW5lZCAmJiBbJ3Y3JywgJ3Y4J10uaW5jbHVkZXMoZm9ybWF0KSkge1xuICAgICAgY29uc3QgY29udkZ1bmMgPSBmb3JtYXQgPT09ICd2NycgPyBjb252ZXJ0VjZ0b1Y3IDogY29udmVydFRvVjg7XG4gICAgICBjb25zdCBkYXRhID0gYXdhaXQgZnMucmVhZEZpbGVBc3luYyhnYW1lU2V0dGluZ3NQYXRoLCB7IGVuY29kaW5nOiAndXRmOCcgfSk7XG4gICAgICBjb25zdCBuZXdEYXRhID0gYXdhaXQgY29udkZ1bmMoZGF0YSk7XG4gICAgICBhd2FpdCBmcy5yZW1vdmVBc3luYyhnYW1lU2V0dGluZ3NQYXRoKS5jYXRjaChlcnIgPT4gUHJvbWlzZS5yZXNvbHZlKCkpO1xuICAgICAgYXdhaXQgZnMud3JpdGVGaWxlQXN5bmMoZ2FtZVNldHRpbmdzUGF0aCwgbmV3RGF0YSwgeyBlbmNvZGluZzogJ3V0ZjgnIH0pO1xuICAgIH1cbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgYXBpLnNob3dFcnJvck5vdGlmaWNhdGlvbihcbiAgICAgICdGYWlsZWQgdG8gbWlncmF0ZScsIGVyciwge1xuICAgICAgICAvL21lc3NhZ2U6ICdQbGVhc2UgcnVuIHRoZSBnYW1lIGJlZm9yZSB5b3Ugc3RhcnQgbW9kZGluZycsXG4gICAgICAgIGFsbG93UmVwb3J0OiBmYWxzZSxcbiAgICB9KTtcbiAgfVxuXG4gIHRyeSB7XG4gICAgYXdhaXQgcmVhZFN0b3JlZExPKGFwaSk7XG4gICAgUGFrSW5mb0NhY2hlLmdldEluc3RhbmNlKGFwaSk7XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIGFwaS5zaG93RXJyb3JOb3RpZmljYXRpb24oXG4gICAgICAnRmFpbGVkIHRvIHJlYWQgbG9hZCBvcmRlcicsIGVyciwge1xuICAgICAgICBtZXNzYWdlOiAnUGxlYXNlIHJ1biB0aGUgZ2FtZSBiZWZvcmUgeW91IHN0YXJ0IG1vZGRpbmcnLFxuICAgICAgICBhbGxvd1JlcG9ydDogZmFsc2UsXG4gICAgfSk7XG4gIH1cblxuICBjb25zdCBsYXRlc3RWZXI6IHN0cmluZyA9IGdldExhdGVzdEluc3RhbGxlZExTTGliVmVyKGFwaSk7XG4gIGlmIChsYXRlc3RWZXIgPT09ICcwLjAuMCcpIHtcbiAgICBhd2FpdCBnaXRIdWJEb3dubG9hZGVyLmRvd25sb2FkRGl2aW5lKGFwaSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gbWFpbihjb250ZXh0OiB0eXBlcy5JRXh0ZW5zaW9uQ29udGV4dCkge1xuICBjb250ZXh0LnJlZ2lzdGVyUmVkdWNlcihbJ3NldHRpbmdzJywgJ2JhbGR1cnNnYXRlMyddLCByZWR1Y2VyKTtcblxuICBjb250ZXh0LnJlZ2lzdGVyR2FtZSh7XG4gICAgaWQ6IEdBTUVfSUQsXG4gICAgbmFtZTogJ0JhbGR1clxcJ3MgR2F0ZSAzJyxcbiAgICBtZXJnZU1vZHM6IHRydWUsXG4gICAgcXVlcnlQYXRoOiBmaW5kR2FtZSxcbiAgICBzdXBwb3J0ZWRUb29sczogW1xuICAgICAge1xuICAgICAgICBpZDogJ2V4ZXZ1bGthbicsXG4gICAgICAgIG5hbWU6ICdCYWxkdXJcXCdzIEdhdGUgMyAoVnVsa2FuKScsXG4gICAgICAgIGV4ZWN1dGFibGU6ICgpID0+ICdiaW4vYmczLmV4ZScsXG4gICAgICAgIHJlcXVpcmVkRmlsZXM6IFtcbiAgICAgICAgICAnYmluL2JnMy5leGUnLFxuICAgICAgICBdLFxuICAgICAgICByZWxhdGl2ZTogdHJ1ZSxcbiAgICAgIH0sXG4gICAgXSxcbiAgICBxdWVyeU1vZFBhdGg6IG1vZHNQYXRoLFxuICAgIGxvZ286ICdnYW1lYXJ0LmpwZycsXG4gICAgZXhlY3V0YWJsZTogKCkgPT4gJ2Jpbi9iZzNfZHgxMS5leGUnLFxuICAgIHNldHVwOiBkaXNjb3ZlcnkgPT4gcHJlcGFyZUZvck1vZGRpbmcoY29udGV4dC5hcGksIGRpc2NvdmVyeSkgYXMgYW55LFxuICAgIHJlcXVpcmVkRmlsZXM6IFtcbiAgICAgICdiaW4vYmczX2R4MTEuZXhlJyxcbiAgICBdLFxuICAgIGVudmlyb25tZW50OiB7XG4gICAgICBTdGVhbUFQUElkOiBTVEVBTV9JRCxcbiAgICB9LFxuICAgIGRldGFpbHM6IHtcbiAgICAgIHN0ZWFtQXBwSWQ6ICtTVEVBTV9JRCxcbiAgICAgIHN0b3BQYXR0ZXJuczogU1RPUF9QQVRURVJOUy5tYXAodG9Xb3JkRXhwKSxcbiAgICAgIGlnbm9yZUNvbmZsaWN0czogSUdOT1JFX1BBVFRFUk5TLFxuICAgICAgaWdub3JlRGVwbG95OiBJR05PUkVfUEFUVEVSTlMsXG4gICAgfSxcbiAgfSk7XG5cbiAgY29udGV4dC5yZWdpc3RlckFjdGlvbignbW9kLWljb25zJywgMzAwLCAnc2V0dGluZ3MnLCB7fSwgJ1JlLWluc3RhbGwgTFNMaWIvRGl2aW5lJywgKCkgPT4ge1xuICAgIGNvbnN0IHN0YXRlID0gY29udGV4dC5hcGkuZ2V0U3RhdGUoKTtcbiAgICBjb25zdCBtb2RzOiB7IFttb2RJZDogc3RyaW5nXTogdHlwZXMuSU1vZCB9ID1cbiAgICAgIHV0aWwuZ2V0U2FmZShzdGF0ZSwgWydwZXJzaXN0ZW50JywgJ21vZHMnLCBHQU1FX0lEXSwge30pO1xuICAgIGNvbnN0IGxzbGlicyA9IE9iamVjdC5rZXlzKG1vZHMpLmZpbHRlcihtb2QgPT4gbW9kc1ttb2RdLnR5cGUgPT09ICdiZzMtbHNsaWItZGl2aW5lLXRvb2wnKTtcbiAgICBjb250ZXh0LmFwaS5ldmVudHMuZW1pdCgncmVtb3ZlLW1vZHMnLCBHQU1FX0lELCBsc2xpYnMsIChlcnIpID0+IHtcbiAgICAgIGlmIChlcnIgIT09IG51bGwpIHtcbiAgICAgICAgY29udGV4dC5hcGkuc2hvd0Vycm9yTm90aWZpY2F0aW9uKCdGYWlsZWQgdG8gcmVpbnN0YWxsIGxzbGliJyxcbiAgICAgICAgICAnUGxlYXNlIHJlLWluc3RhbGwgbWFudWFsbHknLCB7IGFsbG93UmVwb3J0OiBmYWxzZSB9KTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgZ2l0SHViRG93bmxvYWRlci5kb3dubG9hZERpdmluZShjb250ZXh0LmFwaSk7XG4gICAgfSk7XG4gIH0sICgpID0+IHtcbiAgICBjb25zdCBzdGF0ZSA9IGNvbnRleHQuYXBpLnN0b3JlLmdldFN0YXRlKCk7XG4gICAgY29uc3QgZ2FtZU1vZGUgPSBzZWxlY3RvcnMuYWN0aXZlR2FtZUlkKHN0YXRlKTtcbiAgICByZXR1cm4gZ2FtZU1vZGUgPT09IEdBTUVfSUQ7XG4gIH0pOyAgXG5cbiAgY29udGV4dC5yZWdpc3Rlckluc3RhbGxlcignYmczLWxzbGliLWRpdmluZS10b29sJywgMTUsIHRlc3RMU0xpYiBhcyBhbnksIGluc3RhbGxMU0xpYiBhcyBhbnkpO1xuICBjb250ZXh0LnJlZ2lzdGVySW5zdGFsbGVyKCdiZzMtYmczc2UnLCAxNSwgdGVzdEJHM1NFIGFzIGFueSwgaW5zdGFsbEJHM1NFIGFzIGFueSk7XG4gIGNvbnRleHQucmVnaXN0ZXJJbnN0YWxsZXIoJ2JnMy1lbmdpbmUtaW5qZWN0b3InLCAyMCwgdGVzdEVuZ2luZUluamVjdG9yIGFzIGFueSwgaW5zdGFsbEVuZ2luZUluamVjdG9yIGFzIGFueSk7XG4gIGNvbnRleHQucmVnaXN0ZXJJbnN0YWxsZXIoJ2JnMy1yZXBsYWNlcicsIDI1LCB0ZXN0UmVwbGFjZXIgYXMgYW55LCBpbnN0YWxsUmVwbGFjZXIgYXMgYW55KTtcbiAgY29udGV4dC5yZWdpc3Rlckluc3RhbGxlcignYmczLW1vZGZpeGVyJywgMjUsIHRlc3RNb2RGaXhlciBhcyBhbnksIGluc3RhbGxNb2RGaXhlciBhcyBhbnkpO1xuXG4gIGNvbnRleHQucmVnaXN0ZXJNb2RUeXBlKE1PRF9UWVBFX0xTTElCLCAxNSwgKGdhbWVJZCkgPT4gZ2FtZUlkID09PSBHQU1FX0lELFxuICAgICgpID0+IHVuZGVmaW5lZCwgXG4gICAgaXNMU0xpYiBhcyBhbnksXG4gICAgeyBuYW1lOiAnQkczIExTTGliJywgbm9Db25mbGljdHM6IHRydWUgfSk7XG5cbiAgY29udGV4dC5yZWdpc3Rlck1vZFR5cGUoTU9EX1RZUEVfQkczU0UsIDE1LCAoZ2FtZUlkKSA9PiBnYW1lSWQgPT09IEdBTUVfSUQsXG4gICAgKCkgPT4gcGF0aC5qb2luKGdldEdhbWVQYXRoKGNvbnRleHQuYXBpKSwgJ2JpbicpLCBcbiAgICBpc0JHM1NFIGFzIGFueSxcbiAgICB7IG5hbWU6ICdCRzMgQkczU0UnIH0pO1xuXG4gIGNvbnRleHQucmVnaXN0ZXJNb2RUeXBlKE1PRF9UWVBFX0xPT1NFLCAyMCwgKGdhbWVJZCkgPT4gZ2FtZUlkID09PSBHQU1FX0lELFxuICAgICgpID0+IGdldEdhbWVEYXRhUGF0aChjb250ZXh0LmFwaSksIFxuICAgIGlzTG9vc2UgYXMgYW55LFxuICAgIHsgbmFtZTogJ0JHMyBMb29zZScgfSBhcyBhbnkpO1xuXG4gIGNvbnRleHQucmVnaXN0ZXJNb2RUeXBlKE1PRF9UWVBFX1JFUExBQ0VSLCAyNSwgKGdhbWVJZCkgPT4gZ2FtZUlkID09PSBHQU1FX0lELFxuICAgICgpID0+IGdldEdhbWVEYXRhUGF0aChjb250ZXh0LmFwaSksIFxuICAgIGluc3RydWN0aW9ucyA9PiBpc1JlcGxhY2VyKGNvbnRleHQuYXBpLCBpbnN0cnVjdGlvbnMpIGFzIGFueSxcbiAgICB7IG5hbWU6ICdCRzMgUmVwbGFjZXInIH0gYXMgYW55KTtcblxuICBjb250ZXh0LnJlZ2lzdGVyTG9hZE9yZGVyKHtcbiAgICBjbGVhclN0YXRlT25QdXJnZTogZmFsc2UsXG4gICAgZ2FtZUlkOiBHQU1FX0lELFxuICAgIGRlc2VyaWFsaXplTG9hZE9yZGVyOiAoKSA9PiBkZXNlcmlhbGl6ZShjb250ZXh0KSxcbiAgICBzZXJpYWxpemVMb2FkT3JkZXI6IChsb2FkT3JkZXIsIHByZXYpID0+IHNlcmlhbGl6ZShjb250ZXh0LCBsb2FkT3JkZXIpLFxuICAgIHZhbGlkYXRlLFxuICAgIHRvZ2dsZWFibGVFbnRyaWVzOiBmYWxzZSxcbiAgICB1c2FnZUluc3RydWN0aW9uczogKCgpID0+IChcbiAgICAgIDxJbmZvUGFuZWxXcmFwXG4gICAgICAgIGFwaT17Y29udGV4dC5hcGl9XG4gICAgICAgIGdldE93bkdhbWVWZXJzaW9uPXtnZXRPd25HYW1lVmVyc2lvbn1cbiAgICAgICAgcmVhZFN0b3JlZExPPXtyZWFkU3RvcmVkTE99XG4gICAgICAgIGluc3RhbGxMU0xpYj17b25HYW1lTW9kZUFjdGl2YXRlZH1cbiAgICAgICAgZ2V0TGF0ZXN0TFNMaWJNb2Q9e2dldExhdGVzdExTTGliTW9kfVxuICAgICAgLz4pXG4gICAgKSBhcyBhbnksXG4gIH0pO1xuXG4gIGNvbnN0IGlzQkczID0gKCkgPT4ge1xuICAgIGNvbnN0IHN0YXRlID0gY29udGV4dC5hcGkuZ2V0U3RhdGUoKTtcbiAgICBjb25zdCBhY3RpdmVHYW1lID0gc2VsZWN0b3JzLmFjdGl2ZUdhbWVJZChzdGF0ZSk7XG4gICAgcmV0dXJuIGFjdGl2ZUdhbWUgPT09IEdBTUVfSUQ7XG4gIH07XG5cbiAgY29udGV4dC5yZWdpc3RlckFjdGlvbignZmItbG9hZC1vcmRlci1pY29ucycsIDE1MCwgJ2NoYW5nZWxvZycsIHt9LCAnRXhwb3J0IHRvIEdhbWUnLCAoKSA9PiB7IGV4cG9ydFRvR2FtZShjb250ZXh0LmFwaSk7IH0sIGlzQkczKTtcbiAgY29udGV4dC5yZWdpc3RlckFjdGlvbignZmItbG9hZC1vcmRlci1pY29ucycsIDE1MSwgJ2NoYW5nZWxvZycsIHt9LCAnRXhwb3J0IHRvIEZpbGUuLi4nLCAoKSA9PiB7IGV4cG9ydFRvRmlsZShjb250ZXh0LmFwaSk7IH0sIGlzQkczKTtcbiAgY29udGV4dC5yZWdpc3RlckFjdGlvbignZmItbG9hZC1vcmRlci1pY29ucycsIDE2MCwgJ2ltcG9ydCcsIHt9LCAnSW1wb3J0IGZyb20gR2FtZScsICgpID0+IHsgaW1wb3J0TW9kU2V0dGluZ3NHYW1lKGNvbnRleHQuYXBpKTsgfSwgaXNCRzMpO1xuICBjb250ZXh0LnJlZ2lzdGVyQWN0aW9uKCdmYi1sb2FkLW9yZGVyLWljb25zJywgMTYxLCAnaW1wb3J0Jywge30sICdJbXBvcnQgZnJvbSBGaWxlLi4uJywgKCkgPT4geyBcbiAgICBpbXBvcnRNb2RTZXR0aW5nc0ZpbGUoY29udGV4dC5hcGkpOyBcbiAgfSwgaXNCRzMpO1xuICBjb250ZXh0LnJlZ2lzdGVyQWN0aW9uKCdmYi1sb2FkLW9yZGVyLWljb25zJywgMTcwLCAnaW1wb3J0Jywge30sICdJbXBvcnQgZnJvbSBCRzNNTS4uLicsICgpID0+IHsgaW1wb3J0RnJvbUJHM01NKGNvbnRleHQpOyB9LCBpc0JHMyk7XG4gIGNvbnRleHQucmVnaXN0ZXJBY3Rpb24oJ2ZiLWxvYWQtb3JkZXItaWNvbnMnLCAxOTAsICdvcGVuLWV4dCcsIHt9LCAnT3BlbiBMb2FkIE9yZGVyIEZpbGUnLCAoKSA9PiB7XG4gICAgZ2V0QWN0aXZlUGxheWVyUHJvZmlsZShjb250ZXh0LmFwaSlcbiAgICAgIC50aGVuKGJnM1Byb2ZpbGVJZCA9PiB7XG4gICAgICAgIGNvbnN0IGdhbWVTZXR0aW5nc1BhdGg6IHN0cmluZyA9IHBhdGguam9pbihwcm9maWxlc1BhdGgoKSwgYmczUHJvZmlsZUlkLCAnbW9kc2V0dGluZ3MubHN4Jyk7XG4gICAgICAgIHV0aWwub3BuKGdhbWVTZXR0aW5nc1BhdGgpLmNhdGNoKCgpID0+IG51bGwpXG4gICAgICB9KTtcbiAgfSwgaXNCRzMpO1xuXG4gIGNvbnRleHQucmVnaXN0ZXJTZXR0aW5ncygnTW9kcycsIFNldHRpbmdzLCB1bmRlZmluZWQsIGlzQkczLCAxNTApO1xuXG4gIGNvbnRleHQub25jZSgoKSA9PiB7XG4gICAgY29udGV4dC5hcGkub25TdGF0ZUNoYW5nZShbJ3Nlc3Npb24nLCAnYmFzZScsICd0b29sc1J1bm5pbmcnXSxcbiAgICAgIGFzeW5jIChwcmV2OiBhbnksIGN1cnJlbnQ6IGFueSkgPT4ge1xuICAgICAgICAvLyB3aGVuIGEgdG9vbCBleGl0cywgcmUtcmVhZCB0aGUgbG9hZCBvcmRlciBmcm9tIGRpc2sgYXMgaXQgbWF5IGhhdmUgYmVlblxuICAgICAgICAvLyBjaGFuZ2VkXG4gICAgICAgIGNvbnN0IGdhbWVNb2RlID0gc2VsZWN0b3JzLmFjdGl2ZUdhbWVJZChjb250ZXh0LmFwaS5nZXRTdGF0ZSgpKTtcbiAgICAgICAgaWYgKChnYW1lTW9kZSA9PT0gR0FNRV9JRCkgJiYgKE9iamVjdC5rZXlzKGN1cnJlbnQpLmxlbmd0aCA9PT0gMCkpIHtcbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgYXdhaXQgcmVhZFN0b3JlZExPKGNvbnRleHQuYXBpKTtcbiAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgIGNvbnRleHQuYXBpLnNob3dFcnJvck5vdGlmaWNhdGlvbignRmFpbGVkIHRvIHJlYWQgbG9hZCBvcmRlcicsIGVyciwge1xuICAgICAgICAgICAgICBtZXNzYWdlOiAnUGxlYXNlIHJ1biB0aGUgZ2FtZSBiZWZvcmUgeW91IHN0YXJ0IG1vZGRpbmcnLFxuICAgICAgICAgICAgICBhbGxvd1JlcG9ydDogZmFsc2UsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0pO1xuXG4gICAgY29udGV4dC5hcGkub25Bc3luYygnZGlkLWRlcGxveScsIGFzeW5jIChwcm9maWxlSWQ6IHN0cmluZywgZGVwbG95bWVudCkgPT4ge1xuICAgICAgY29uc3QgcHJvZmlsZSA9IHNlbGVjdG9ycy5wcm9maWxlQnlJZChjb250ZXh0LmFwaS5nZXRTdGF0ZSgpLCBwcm9maWxlSWQpO1xuICAgICAgaWYgKHByb2ZpbGU/LmdhbWVJZCA9PT0gR0FNRV9JRCkge1xuICAgICAgICBmb3JjZVJlZnJlc2goY29udGV4dC5hcGkpO1xuICAgICAgfVxuICAgICAgYXdhaXQgUGFrSW5mb0NhY2hlLmdldEluc3RhbmNlKGNvbnRleHQuYXBpKS5zYXZlKCk7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG4gICAgfSk7XG5cbiAgICBjb250ZXh0LmFwaS5ldmVudHMub24oJ2NoZWNrLW1vZHMtdmVyc2lvbicsXG4gICAgICAoZ2FtZUlkOiBzdHJpbmcsIG1vZHM6IHR5cGVzLklNb2RbXSkgPT4gb25DaGVja01vZFZlcnNpb24oY29udGV4dC5hcGksIGdhbWVJZCwgbW9kcykpO1xuXG4gICAgY29udGV4dC5hcGkuZXZlbnRzLm9uKCdnYW1lbW9kZS1hY3RpdmF0ZWQnLFxuICAgICAgYXN5bmMgKGdhbWVNb2RlOiBzdHJpbmcpID0+IG9uR2FtZU1vZGVBY3RpdmF0ZWQoY29udGV4dC5hcGksIGdhbWVNb2RlKSk7XG4gIH0pO1xuXG4gIHJldHVybiB0cnVlO1xufVxuXG5leHBvcnQgZGVmYXVsdCBtYWluO1xuIl19