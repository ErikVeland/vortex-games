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
const bluebird_1 = __importDefault(require("bluebird"));
const path_1 = __importDefault(require("path"));
const vortex_api_1 = require("vortex-api");
const winapi_bindings_1 = __importDefault(require("winapi-bindings"));
const migrations_1 = require("./migrations");
const collections_1 = require("./collections/collections");
const CollectionsDataView_1 = __importDefault(require("./views/CollectionsDataView"));
const scriptmerger_1 = require("./scriptmerger");
const common_1 = require("./common");
const modTypes_1 = require("./modTypes");
const mergers_1 = require("./mergers");
const iconbarActions_1 = require("./iconbarActions");
const priorityManager_1 = require("./priorityManager");
const installers_1 = require("./installers");
const reducers_1 = require("./reducers");
const util_1 = require("./util");
const loadOrder_1 = __importDefault(require("./loadOrder"));
const eventHandlers_1 = require("./eventHandlers");
const iniParser_1 = __importDefault(require("./iniParser"));
const GOG_ID = '1207664663';
const GOG_ID_GOTY = '1495134320';
const GOG_WH_ID = '1207664643';
const GOG_WH_GOTY = '1640424747';
const STEAM_ID = '499450';
const STEAM_ID_WH = '292030';
const EPIC_ID = '725a22e15ed74735bb0d6a19f3cc82d0';
const tools = [
    {
        id: common_1.SCRIPT_MERGER_ID,
        name: 'W3 Script Merger',
        logo: 'WitcherScriptMerger.jpg',
        executable: () => 'WitcherScriptMerger.exe',
        requiredFiles: [
            'WitcherScriptMerger.exe',
        ],
    },
    {
        id: common_1.GAME_ID + '_DX11',
        name: 'The Witcher 3 (DX11)',
        logo: 'auto',
        relative: true,
        executable: () => 'bin/x64/witcher3.exe',
        requiredFiles: [
            'bin/x64/witcher3.exe',
        ],
    },
    {
        id: common_1.GAME_ID + '_DX12',
        name: 'The Witcher 3 (DX12)',
        logo: 'auto',
        relative: true,
        executable: () => 'bin/x64_DX12/witcher3.exe',
        requiredFiles: [
            'bin/x64_DX12/witcher3.exe',
        ],
    },
];
function findGame() {
    try {
        const instPath = winapi_bindings_1.default.RegGetValue('HKEY_LOCAL_MACHINE', 'Software\\CD Project Red\\The Witcher 3', 'InstallFolder');
        if (!instPath) {
            throw new Error('empty registry key');
        }
        return bluebird_1.default.resolve(instPath.value);
    }
    catch (err) {
        return vortex_api_1.util.GameStoreHelper.findByAppId([
            GOG_ID_GOTY, GOG_ID, GOG_WH_ID, GOG_WH_GOTY,
            STEAM_ID, STEAM_ID_WH, EPIC_ID
        ])
            .then(game => game.gamePath);
    }
}
function prepareForModding(api) {
    return (discovery) => {
        const findScriptMerger = (error) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            (0, vortex_api_1.log)('error', 'failed to download/install script merger', error);
            const scriptMergerPath = yield (0, scriptmerger_1.getScriptMergerDir)(api);
            if (scriptMergerPath === undefined) {
                (0, util_1.notifyMissingScriptMerger)(api);
                return Promise.resolve();
            }
            else {
                if (((_a = discovery === null || discovery === void 0 ? void 0 : discovery.tools) === null || _a === void 0 ? void 0 : _a.W3ScriptMerger) === undefined) {
                    return (0, scriptmerger_1.setMergerConfig)(discovery.path, scriptMergerPath);
                }
            }
        });
        const ensurePath = (dirpath) => vortex_api_1.fs.ensureDirWritableAsync(dirpath)
            .catch(err => (err.code === 'EEXIST')
            ? Promise.resolve()
            : Promise.reject(err));
        return Promise.all([
            ensurePath(path_1.default.join(discovery.path, 'Mods')),
            ensurePath(path_1.default.join(discovery.path, 'DLC')),
            ensurePath(path_1.default.dirname((0, common_1.getLoadOrderFilePath)()))
        ])
            .then(() => (0, scriptmerger_1.downloadScriptMerger)(api)
            .catch(err => (err instanceof vortex_api_1.util.UserCanceled)
            ? Promise.resolve()
            : findScriptMerger(err)));
    };
}
let priorityManager;
const getPriorityManager = () => priorityManager;
function main(context) {
    context.registerReducer(['settings', 'witcher3'], reducers_1.W3Reducer);
    context.registerGame({
        id: common_1.GAME_ID,
        name: 'The Witcher 3',
        mergeMods: true,
        queryPath: findGame,
        queryModPath: () => 'Mods',
        logo: 'gameart.jpg',
        executable: util_1.determineExecutable,
        setup: prepareForModding(context.api),
        supportedTools: tools,
        requiresCleanup: true,
        requiredFiles: [
            'bin/x64/witcher3.exe',
        ],
        environment: {
            SteamAPPId: '292030',
        },
        details: {
            steamAppId: 292030,
            ignoreConflicts: common_1.DO_NOT_DEPLOY,
            ignoreDeploy: common_1.DO_NOT_DEPLOY,
        },
    });
    context.registerInstaller('scriptmergerdummy', 15, installers_1.scriptMergerTest, installers_1.scriptMergerDummyInstaller);
    context.registerInstaller('witcher3menumodroot', 20, installers_1.testMenuModRoot, installers_1.installMenuMod);
    context.registerInstaller('witcher3mixed', 25, installers_1.testSupportedMixed, installers_1.installMixed);
    context.registerInstaller('witcher3tl', 30, installers_1.testSupportedTL, installers_1.installTL);
    context.registerInstaller('witcher3content', 50, installers_1.testSupportedContent, installers_1.installContent);
    context.registerInstaller('witcher3dlcmod', 60, installers_1.testDLCMod, installers_1.installDLCMod);
    context.registerModType('witcher3menumodroot', 20, (0, util_1.isTW3)(context.api), (0, util_1.getTLPath)(context.api), installers_1.testMenuModRoot);
    context.registerModType('witcher3tl', 25, (0, util_1.isTW3)(context.api), (0, util_1.getTLPath)(context.api), modTypes_1.testTL);
    context.registerModType('witcher3dlc', 25, (0, util_1.isTW3)(context.api), (0, util_1.getDLCPath)(context.api), modTypes_1.testDLC);
    context.registerModType('w3modlimitpatcher', 25, (0, util_1.isTW3)(context.api), (0, util_1.getTLPath)(context.api), () => bluebird_1.default.resolve(false), { deploymentEssential: false, name: 'Mod Limit Patcher Mod Type' });
    context.registerModType('witcher3menumoddocuments', 60, (0, util_1.isTW3)(context.api), util_1.getDocumentsPath, () => bluebird_1.default.resolve(false));
    context.registerMerge((0, mergers_1.canMergeXML)(context.api), (0, mergers_1.doMergeXML)(context.api), 'witcher3menumodroot');
    context.registerMigration((oldVersion) => (0, migrations_1.migrate148)(context, oldVersion));
    (0, iconbarActions_1.registerActions)({ context, getPriorityManager });
    context.optional.registerCollectionFeature('witcher3_collection_data', (gameId, includedMods, collection) => (0, collections_1.genCollectionsData)(context, gameId, includedMods, collection), (gameId, collection) => (0, collections_1.parseCollectionsData)(context, gameId, collection), () => Promise.resolve(), (t) => t('Witcher 3 Data'), (state, gameId) => gameId === common_1.GAME_ID, CollectionsDataView_1.default);
    context.registerProfileFeature('local_merges', 'boolean', 'settings', 'Profile Data', 'This profile will store and restore profile specific data (merged scripts, loadorder, etc) when switching profiles', () => {
        const activeGameId = vortex_api_1.selectors.activeGameId(context.api.getState());
        return activeGameId === common_1.GAME_ID;
    });
    const toggleModsState = (enabled) => __awaiter(this, void 0, void 0, function* () {
        const state = context.api.store.getState();
        const profile = vortex_api_1.selectors.activeProfile(state);
        const loadOrder = (0, migrations_1.getPersistentLoadOrder)(context.api);
        const modMap = yield (0, util_1.getAllMods)(context.api);
        const manualLocked = modMap.manual.filter(modName => modName.startsWith(common_1.LOCKED_PREFIX));
        const totalLocked = [].concat(modMap.merged, manualLocked);
        const newLO = loadOrder.reduce((accum, key, idx) => {
            if (totalLocked.includes(key)) {
                accum.push(loadOrder[idx]);
            }
            else {
                accum.push(Object.assign(Object.assign({}, loadOrder[idx]), { enabled }));
            }
            return accum;
        }, []);
        context.api.store.dispatch(vortex_api_1.actions.setLoadOrder(profile.id, newLO));
    });
    const props = {
        onToggleModsState: toggleModsState,
        api: context.api,
        getPriorityManager,
    };
    context.registerLoadOrder(new loadOrder_1.default(props));
    context.once(() => {
        priorityManager = new priorityManager_1.PriorityManager(context.api, 'prefix-based');
        iniParser_1.default.getInstance(context.api, getPriorityManager);
        context.api.events.on('gamemode-activated', (0, eventHandlers_1.onGameModeActivation)(context.api));
        context.api.events.on('profile-will-change', (0, eventHandlers_1.onProfileWillChange)(context.api));
        context.api.events.on('mods-enabled', (0, eventHandlers_1.onModsDisabled)(context.api, getPriorityManager));
        context.api.onAsync('will-deploy', (0, eventHandlers_1.onWillDeploy)(context.api));
        context.api.onAsync('did-deploy', (0, eventHandlers_1.onDidDeploy)(context.api));
        context.api.onAsync('did-purge', (0, eventHandlers_1.onDidPurge)(context.api, getPriorityManager));
        context.api.onAsync('did-remove-mod', (0, eventHandlers_1.onDidRemoveMod)(context.api, getPriorityManager));
        context.api.onStateChange(['settings', 'witcher3'], (0, eventHandlers_1.onSettingsChange)(context.api, getPriorityManager));
    });
    return true;
}
module.exports = {
    default: main,
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7OztBQUNBLHdEQUFnQztBQUNoQyxnREFBd0I7QUFDeEIsMkNBQXNFO0FBQ3RFLHNFQUFxQztBQUVyQyw2Q0FBa0U7QUFFbEUsMkRBQXFGO0FBRXJGLHNGQUE4RDtBQUU5RCxpREFBMkY7QUFFM0YscUNBRWtCO0FBRWxCLHlDQUE2QztBQUM3Qyx1Q0FBb0Q7QUFFcEQscURBQW1EO0FBQ25ELHVEQUFvRDtBQUVwRCw2Q0FFd0U7QUFFeEUseUNBQXVDO0FBRXZDLGlDQUM4RDtBQUM5RCw0REFBdUM7QUFHdkMsbURBQytFO0FBQy9FLDREQUF1QztBQUV2QyxNQUFNLE1BQU0sR0FBRyxZQUFZLENBQUM7QUFDNUIsTUFBTSxXQUFXLEdBQUcsWUFBWSxDQUFDO0FBQ2pDLE1BQU0sU0FBUyxHQUFHLFlBQVksQ0FBQztBQUMvQixNQUFNLFdBQVcsR0FBRyxZQUFZLENBQUM7QUFDakMsTUFBTSxRQUFRLEdBQUcsUUFBUSxDQUFDO0FBQzFCLE1BQU0sV0FBVyxHQUFHLFFBQVEsQ0FBQztBQUM3QixNQUFNLE9BQU8sR0FBRyxrQ0FBa0MsQ0FBQztBQUVuRCxNQUFNLEtBQUssR0FBa0I7SUFDM0I7UUFDRSxFQUFFLEVBQUUseUJBQWdCO1FBQ3BCLElBQUksRUFBRSxrQkFBa0I7UUFDeEIsSUFBSSxFQUFFLHlCQUF5QjtRQUMvQixVQUFVLEVBQUUsR0FBRyxFQUFFLENBQUMseUJBQXlCO1FBQzNDLGFBQWEsRUFBRTtZQUNiLHlCQUF5QjtTQUMxQjtLQUNGO0lBQ0Q7UUFDRSxFQUFFLEVBQUUsZ0JBQU8sR0FBRyxPQUFPO1FBQ3JCLElBQUksRUFBRSxzQkFBc0I7UUFDNUIsSUFBSSxFQUFFLE1BQU07UUFDWixRQUFRLEVBQUUsSUFBSTtRQUNkLFVBQVUsRUFBRSxHQUFHLEVBQUUsQ0FBQyxzQkFBc0I7UUFDeEMsYUFBYSxFQUFFO1lB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QyxHQUFHLENBQUMsQ0FBQyxDQUFDO1FBQy9FLE9BQU8sQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxjQUFjLEVBQUUsSUFBQSw4QkFBYyxFQUFDLE9BQU8sQ0FBQyxHQUFHLEVBQUUsa0JBQWtCLENBQUMsQ0FBQyxDQUFDO1FBRXZGLE9BQU8sQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLGFBQWEsRUFBRSxJQUFBLDRCQUFZLEVBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBUSxDQUFDLENBQUM7UUFDckUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsWUFBWSxFQUFFLElBQUEsMkJBQVcsRUFBQyxPQUFPLENBQUMsR0FBRyxDQUFRLENBQUMsQ0FBQztRQUNuRSxPQUFPLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxXQUFXLEVBQUUsSUFBQSwwQkFBVSxFQUFDLE9BQU8sQ0FBQyxHQUFHLEVBQUUsa0JBQWtCLENBQVEsQ0FBQyxDQUFDO1FBQ3JGLE9BQU8sQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLGdCQUFnQixFQUFFLElBQUEsOEJBQWMsRUFBQyxPQUFPLENBQUMsR0FBRyxFQUFFLGtCQUFrQixDQUFRLENBQUMsQ0FBQztRQUU5RixPQUFPLENBQUMsR0FBRyxDQUFDLGFBQWEsQ0FBQyxDQUFDLFVBQVUsRUFBRSxVQUFVLENBQUMsRUFBRSxJQUFBLGdDQUFnQixFQUFDLE9BQU8sQ0FBQyxHQUFHLEVBQUUsa0JBQWtCLENBQVEsQ0FBQyxDQUFDO0lBQ2hILENBQUMsQ0FBQyxDQUFDO0lBQ0gsT0FBTyxJQUFJLENBQUM7QUFDZCxDQUFDO0FBRUQsTUFBTSxDQUFDLE9BQU8sR0FBRztJQUNmLE9BQU8sRUFBRSxJQUFJO0NBQ2QsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qIGVzbGludC1kaXNhYmxlICovXG5pbXBvcnQgQmx1ZWJpcmQgZnJvbSAnYmx1ZWJpcmQnO1xuaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgeyBhY3Rpb25zLCBmcywgbG9nLCBzZWxlY3RvcnMsIHR5cGVzLCB1dGlsIH0gZnJvbSAndm9ydGV4LWFwaSc7XG5pbXBvcnQgd2luYXBpIGZyb20gJ3dpbmFwaS1iaW5kaW5ncyc7XG5cbmltcG9ydCB7IGdldFBlcnNpc3RlbnRMb2FkT3JkZXIsIG1pZ3JhdGUxNDggfSBmcm9tICcuL21pZ3JhdGlvbnMnO1xuXG5pbXBvcnQgeyBnZW5Db2xsZWN0aW9uc0RhdGEsIHBhcnNlQ29sbGVjdGlvbnNEYXRhIH0gZnJvbSAnLi9jb2xsZWN0aW9ucy9jb2xsZWN0aW9ucyc7XG5pbXBvcnQgeyBJVzNDb2xsZWN0aW9uc0RhdGEgfSBmcm9tICcuL2NvbGxlY3Rpb25zL3R5cGVzJztcbmltcG9ydCBDb2xsZWN0aW9uc0RhdGFWaWV3IGZyb20gJy4vdmlld3MvQ29sbGVjdGlvbnNEYXRhVmlldyc7XG5cbmltcG9ydCB7IGRvd25sb2FkU2NyaXB0TWVyZ2VyLCBnZXRTY3JpcHRNZXJnZXJEaXIsIHNldE1lcmdlckNvbmZpZyB9IGZyb20gJy4vc2NyaXB0bWVyZ2VyJztcblxuaW1wb3J0IHsgRE9fTk9UX0RFUExPWSwgR0FNRV9JRCwgZ2V0TG9hZE9yZGVyRmlsZVBhdGgsXG4gIExPQ0tFRF9QUkVGSVgsIFNDUklQVF9NRVJHRVJfSURcbn0gZnJvbSAnLi9jb21tb24nO1xuXG5pbXBvcnQgeyB0ZXN0RExDLCB0ZXN0VEwgfSBmcm9tICcuL21vZFR5cGVzJztcbmltcG9ydCB7IGNhbk1lcmdlWE1MLCBkb01lcmdlWE1MIH0gZnJvbSAnLi9tZXJnZXJzJztcblxuaW1wb3J0IHsgcmVnaXN0ZXJBY3Rpb25zIH0gZnJvbSAnLi9pY29uYmFyQWN0aW9ucyc7XG5pbXBvcnQgeyBQcmlvcml0eU1hbmFnZXIgfSBmcm9tICcuL3ByaW9yaXR5TWFuYWdlcic7XG5cbmltcG9ydCB7IGluc3RhbGxDb250ZW50LCBpbnN0YWxsTWVudU1vZCwgaW5zdGFsbFRMLCBpbnN0YWxsRExDTW9kLCBpbnN0YWxsTWl4ZWQsXG4gIHNjcmlwdE1lcmdlckR1bW15SW5zdGFsbGVyLCBzY3JpcHRNZXJnZXJUZXN0LCB0ZXN0TWVudU1vZFJvb3QsIHRlc3RTdXBwb3J0ZWRDb250ZW50LFxuICB0ZXN0U3VwcG9ydGVkVEwsIHRlc3RTdXBwb3J0ZWRNaXhlZCwgdGVzdERMQ01vZCB9IGZyb20gJy4vaW5zdGFsbGVycyc7XG5cbmltcG9ydCB7IFczUmVkdWNlciB9IGZyb20gJy4vcmVkdWNlcnMnO1xuXG5pbXBvcnQgeyBnZXRETENQYXRoLCBnZXRBbGxNb2RzLCBkZXRlcm1pbmVFeGVjdXRhYmxlLCBnZXREb2N1bWVudHNQYXRoLFxuICBnZXRUTFBhdGgsIGlzVFczLCBub3RpZnlNaXNzaW5nU2NyaXB0TWVyZ2VyIH0gZnJvbSAnLi91dGlsJztcbmltcG9ydCBUVzNMb2FkT3JkZXIgZnJvbSAnLi9sb2FkT3JkZXInO1xuXG5cbmltcG9ydCB7IG9uRGlkRGVwbG95LCBvbkRpZFB1cmdlLCBvbkRpZFJlbW92ZU1vZCwgb25HYW1lTW9kZUFjdGl2YXRpb24sIG9uTW9kc0Rpc2FibGVkLFxuICBvblByb2ZpbGVXaWxsQ2hhbmdlLCBvblNldHRpbmdzQ2hhbmdlLCBvbldpbGxEZXBsb3kgfSBmcm9tICcuL2V2ZW50SGFuZGxlcnMnO1xuaW1wb3J0IEluaVN0cnVjdHVyZSBmcm9tICcuL2luaVBhcnNlcic7XG5cbmNvbnN0IEdPR19JRCA9ICcxMjA3NjY0NjYzJztcbmNvbnN0IEdPR19JRF9HT1RZID0gJzE0OTUxMzQzMjAnO1xuY29uc3QgR09HX1dIX0lEID0gJzEyMDc2NjQ2NDMnO1xuY29uc3QgR09HX1dIX0dPVFkgPSAnMTY0MDQyNDc0Nyc7XG5jb25zdCBTVEVBTV9JRCA9ICc0OTk0NTAnO1xuY29uc3QgU1RFQU1fSURfV0ggPSAnMjkyMDMwJztcbmNvbnN0IEVQSUNfSUQgPSAnNzI1YTIyZTE1ZWQ3NDczNWJiMGQ2YTE5ZjNjYzgyZDAnO1xuXG5jb25zdCB0b29sczogdHlwZXMuSVRvb2xbXSA9IFtcbiAge1xuICAgIGlkOiBTQ1JJUFRfTUVSR0VSX0lELFxuICAgIG5hbWU6ICdXMyBTY3JpcHQgTWVyZ2VyJyxcbiAgICBsb2dvOiAnV2l0Y2hlclNjcmlwdE1lcmdlci5qcGcnLFxuICAgIGV4ZWN1dGFibGU6ICgpID0+ICdXaXRjaGVyU2NyaXB0TWVyZ2VyLmV4ZScsXG4gICAgcmVxdWlyZWRGaWxlczogW1xuICAgICAgJ1dpdGNoZXJTY3JpcHRNZXJnZXIuZXhlJyxcbiAgICBdLFxuICB9LFxuICB7XG4gICAgaWQ6IEdBTUVfSUQgKyAnX0RYMTEnLFxuICAgIG5hbWU6ICdUaGUgV2l0Y2hlciAzIChEWDExKScsXG4gICAgbG9nbzogJ2F1dG8nLFxuICAgIHJlbGF0aXZlOiB0cnVlLFxuICAgIGV4ZWN1dGFibGU6ICgpID0+ICdiaW4veDY0L3dpdGNoZXIzLmV4ZScsXG4gICAgcmVxdWlyZWRGaWxlczogW1xuICAgICAgJ2Jpbi94NjQvd2l0Y2hlcjMuZXhlJyxcbiAgICBdLFxuICB9LFxuICB7XG4gICAgaWQ6IEdBTUVfSUQgKyAnX0RYMTInLFxuICAgIG5hbWU6ICdUaGUgV2l0Y2hlciAzIChEWDEyKScsXG4gICAgbG9nbzogJ2F1dG8nLFxuICAgIHJlbGF0aXZlOiB0cnVlLFxuICAgIGV4ZWN1dGFibGU6ICgpID0+ICdiaW4veDY0X0RYMTIvd2l0Y2hlcjMuZXhlJyxcbiAgICByZXF1aXJlZEZpbGVzOiBbXG4gICAgICAnYmluL3g2NF9EWDEyL3dpdGNoZXIzLmV4ZScsXG4gICAgXSxcbiAgfSxcbl07XG5cbmZ1bmN0aW9uIGZpbmRHYW1lKCk6IEJsdWViaXJkPHN0cmluZz4ge1xuICB0cnkge1xuICAgIGNvbnN0IGluc3RQYXRoID0gd2luYXBpLlJlZ0dldFZhbHVlKFxuICAgICAgJ0hLRVlfTE9DQUxfTUFDSElORScsXG4gICAgICAnU29mdHdhcmVcXFxcQ0QgUHJvamVjdCBSZWRcXFxcVGhlIFdpdGNoZXIgMycsXG4gICAgICAnSW5zdGFsbEZvbGRlcicpO1xuICAgIGlmICghaW5zdFBhdGgpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignZW1wdHkgcmVnaXN0cnkga2V5Jyk7XG4gICAgfVxuICAgIHJldHVybiBCbHVlYmlyZC5yZXNvbHZlKGluc3RQYXRoLnZhbHVlIGFzIHN0cmluZyk7XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIHJldHVybiB1dGlsLkdhbWVTdG9yZUhlbHBlci5maW5kQnlBcHBJZChbXG4gICAgICBHT0dfSURfR09UWSwgR09HX0lELCBHT0dfV0hfSUQsIEdPR19XSF9HT1RZLFxuICAgICAgU1RFQU1fSUQsIFNURUFNX0lEX1dILCBFUElDX0lEXG4gICAgXSlcbiAgICAgIC50aGVuKGdhbWUgPT4gZ2FtZS5nYW1lUGF0aCk7XG4gIH1cbn1cblxuZnVuY3Rpb24gcHJlcGFyZUZvck1vZGRpbmcoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpKSB7XG4gIHJldHVybiAoZGlzY292ZXJ5OiB0eXBlcy5JRGlzY292ZXJ5UmVzdWx0KSA9PiB7XG4gICAgY29uc3QgZmluZFNjcmlwdE1lcmdlciA9IGFzeW5jIChlcnJvcikgPT4ge1xuICAgICAgbG9nKCdlcnJvcicsICdmYWlsZWQgdG8gZG93bmxvYWQvaW5zdGFsbCBzY3JpcHQgbWVyZ2VyJywgZXJyb3IpO1xuICAgICAgY29uc3Qgc2NyaXB0TWVyZ2VyUGF0aCA9IGF3YWl0IGdldFNjcmlwdE1lcmdlckRpcihhcGkpO1xuICAgICAgaWYgKHNjcmlwdE1lcmdlclBhdGggPT09IHVuZGVmaW5lZCkge1xuICAgICAgICBub3RpZnlNaXNzaW5nU2NyaXB0TWVyZ2VyKGFwaSk7XG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlmIChkaXNjb3Zlcnk/LnRvb2xzPy5XM1NjcmlwdE1lcmdlciA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgcmV0dXJuIHNldE1lcmdlckNvbmZpZyhkaXNjb3ZlcnkucGF0aCwgc2NyaXB0TWVyZ2VyUGF0aCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9O1xuICAgIGNvbnN0IGVuc3VyZVBhdGggPSAoZGlycGF0aCkgPT5cbiAgICAgIGZzLmVuc3VyZURpcldyaXRhYmxlQXN5bmMoZGlycGF0aClcbiAgICAgICAgLmNhdGNoKGVyciA9PiAoZXJyLmNvZGUgPT09ICdFRVhJU1QnKVxuICAgICAgICAgID8gUHJvbWlzZS5yZXNvbHZlKClcbiAgICAgICAgICA6IFByb21pc2UucmVqZWN0KGVycikpO1xuICBcbiAgICByZXR1cm4gUHJvbWlzZS5hbGwoW1xuICAgICAgZW5zdXJlUGF0aChwYXRoLmpvaW4oZGlzY292ZXJ5LnBhdGgsICdNb2RzJykpLFxuICAgICAgZW5zdXJlUGF0aChwYXRoLmpvaW4oZGlzY292ZXJ5LnBhdGgsICdETEMnKSksXG4gICAgICBlbnN1cmVQYXRoKHBhdGguZGlybmFtZShnZXRMb2FkT3JkZXJGaWxlUGF0aCgpKSldKVxuICAgICAgICAudGhlbigoKSA9PiBkb3dubG9hZFNjcmlwdE1lcmdlcihhcGkpXG4gICAgICAgICAgLmNhdGNoKGVyciA9PiAoZXJyIGluc3RhbmNlb2YgdXRpbC5Vc2VyQ2FuY2VsZWQpXG4gICAgICAgICAgICA/IFByb21pc2UucmVzb2x2ZSgpXG4gICAgICAgICAgICA6IGZpbmRTY3JpcHRNZXJnZXIoZXJyKSkpO1xuICB9XG59XG5cbmxldCBwcmlvcml0eU1hbmFnZXI6IFByaW9yaXR5TWFuYWdlcjtcbmNvbnN0IGdldFByaW9yaXR5TWFuYWdlciA9ICgpID0+IHByaW9yaXR5TWFuYWdlcjtcbi8vIGxldCBtb2RMaW1pdFBhdGNoZXI6IE1vZExpbWl0UGF0Y2hlcjtcblxuZnVuY3Rpb24gbWFpbihjb250ZXh0OiB0eXBlcy5JRXh0ZW5zaW9uQ29udGV4dCkge1xuICBjb250ZXh0LnJlZ2lzdGVyUmVkdWNlcihbJ3NldHRpbmdzJywgJ3dpdGNoZXIzJ10sIFczUmVkdWNlcik7XG4gIGNvbnRleHQucmVnaXN0ZXJHYW1lKHtcbiAgICBpZDogR0FNRV9JRCxcbiAgICBuYW1lOiAnVGhlIFdpdGNoZXIgMycsXG4gICAgbWVyZ2VNb2RzOiB0cnVlLFxuICAgIHF1ZXJ5UGF0aDogZmluZEdhbWUsXG4gICAgcXVlcnlNb2RQYXRoOiAoKSA9PiAnTW9kcycsXG4gICAgbG9nbzogJ2dhbWVhcnQuanBnJyxcbiAgICBleGVjdXRhYmxlOiBkZXRlcm1pbmVFeGVjdXRhYmxlLFxuICAgIHNldHVwOiBwcmVwYXJlRm9yTW9kZGluZyhjb250ZXh0LmFwaSkgYXMgYW55LFxuICAgIHN1cHBvcnRlZFRvb2xzOiB0b29scyxcbiAgICByZXF1aXJlc0NsZWFudXA6IHRydWUsXG4gICAgcmVxdWlyZWRGaWxlczogW1xuICAgICAgJ2Jpbi94NjQvd2l0Y2hlcjMuZXhlJyxcbiAgICBdLFxuICAgIGVudmlyb25tZW50OiB7XG4gICAgICBTdGVhbUFQUElkOiAnMjkyMDMwJyxcbiAgICB9LFxuICAgIGRldGFpbHM6IHtcbiAgICAgIHN0ZWFtQXBwSWQ6IDI5MjAzMCxcbiAgICAgIGlnbm9yZUNvbmZsaWN0czogRE9fTk9UX0RFUExPWSxcbiAgICAgIGlnbm9yZURlcGxveTogRE9fTk9UX0RFUExPWSxcbiAgICB9LFxuICB9KTtcblxuICBjb250ZXh0LnJlZ2lzdGVySW5zdGFsbGVyKCdzY3JpcHRtZXJnZXJkdW1teScsIDE1LCBzY3JpcHRNZXJnZXJUZXN0IGFzIGFueSwgc2NyaXB0TWVyZ2VyRHVtbXlJbnN0YWxsZXIgYXMgYW55KTtcbiAgY29udGV4dC5yZWdpc3Rlckluc3RhbGxlcignd2l0Y2hlcjNtZW51bW9kcm9vdCcsIDIwLCB0ZXN0TWVudU1vZFJvb3QgYXMgYW55LCBpbnN0YWxsTWVudU1vZCBhcyBhbnkpO1xuICBjb250ZXh0LnJlZ2lzdGVySW5zdGFsbGVyKCd3aXRjaGVyM21peGVkJywgMjUsIHRlc3RTdXBwb3J0ZWRNaXhlZCBhcyBhbnksIGluc3RhbGxNaXhlZCBhcyBhbnkpO1xuICBjb250ZXh0LnJlZ2lzdGVySW5zdGFsbGVyKCd3aXRjaGVyM3RsJywgMzAsIHRlc3RTdXBwb3J0ZWRUTCBhcyBhbnksIGluc3RhbGxUTCBhcyBhbnkpO1xuICBjb250ZXh0LnJlZ2lzdGVySW5zdGFsbGVyKCd3aXRjaGVyM2NvbnRlbnQnLCA1MCwgdGVzdFN1cHBvcnRlZENvbnRlbnQgYXMgYW55LCBpbnN0YWxsQ29udGVudCBhcyBhbnkpO1xuICBjb250ZXh0LnJlZ2lzdGVySW5zdGFsbGVyKCd3aXRjaGVyM2RsY21vZCcsIDYwLCB0ZXN0RExDTW9kIGFzIGFueSwgaW5zdGFsbERMQ01vZCBhcyBhbnkpO1xuXG4gIGNvbnRleHQucmVnaXN0ZXJNb2RUeXBlKCd3aXRjaGVyM21lbnVtb2Ryb290JywgMjAsIGlzVFczKGNvbnRleHQuYXBpKSwgZ2V0VExQYXRoKGNvbnRleHQuYXBpKSwgdGVzdE1lbnVNb2RSb290IGFzIGFueSk7XG4gIGNvbnRleHQucmVnaXN0ZXJNb2RUeXBlKCd3aXRjaGVyM3RsJywgMjUsIGlzVFczKGNvbnRleHQuYXBpKSwgZ2V0VExQYXRoKGNvbnRleHQuYXBpKSwgdGVzdFRMIGFzIGFueSk7XG4gIGNvbnRleHQucmVnaXN0ZXJNb2RUeXBlKCd3aXRjaGVyM2RsYycsIDI1LCBpc1RXMyhjb250ZXh0LmFwaSksIGdldERMQ1BhdGgoY29udGV4dC5hcGkpLCB0ZXN0RExDIGFzIGFueSk7XG4gIGNvbnRleHQucmVnaXN0ZXJNb2RUeXBlKCd3M21vZGxpbWl0cGF0Y2hlcicsIDI1LCBpc1RXMyhjb250ZXh0LmFwaSksIGdldFRMUGF0aChjb250ZXh0LmFwaSksICgpID0+IEJsdWViaXJkLnJlc29sdmUoZmFsc2UpLFxuICAgIHsgZGVwbG95bWVudEVzc2VudGlhbDogZmFsc2UsIG5hbWU6ICdNb2QgTGltaXQgUGF0Y2hlciBNb2QgVHlwZScgfSk7XG4gIGNvbnRleHQucmVnaXN0ZXJNb2RUeXBlKCd3aXRjaGVyM21lbnVtb2Rkb2N1bWVudHMnLCA2MCwgaXNUVzMoY29udGV4dC5hcGkpLCBnZXREb2N1bWVudHNQYXRoLCAoKSA9PiBCbHVlYmlyZC5yZXNvbHZlKGZhbHNlKSk7XG5cbiAgY29udGV4dC5yZWdpc3Rlck1lcmdlKGNhbk1lcmdlWE1MKGNvbnRleHQuYXBpKSwgZG9NZXJnZVhNTChjb250ZXh0LmFwaSkgYXMgYW55LCAnd2l0Y2hlcjNtZW51bW9kcm9vdCcpO1xuICAvLyBjb250ZXh0LnJlZ2lzdGVyTWVyZ2UoY2FuTWVyZ2VTZXR0aW5ncyhjb250ZXh0LmFwaSksIGRvTWVyZ2VTZXR0aW5ncyhjb250ZXh0LmFwaSkgYXMgYW55LCAnd2l0Y2hlcjNtZW51bW9kZG9jdW1lbnRzJyk7XG5cbiAgY29udGV4dC5yZWdpc3Rlck1pZ3JhdGlvbigob2xkVmVyc2lvbikgPT4gKG1pZ3JhdGUxNDgoY29udGV4dCwgb2xkVmVyc2lvbikgYXMgYW55KSk7XG5cbiAgcmVnaXN0ZXJBY3Rpb25zKHsgY29udGV4dCwgZ2V0UHJpb3JpdHlNYW5hZ2VyIH0pO1xuXG4gIGNvbnRleHQub3B0aW9uYWwucmVnaXN0ZXJDb2xsZWN0aW9uRmVhdHVyZShcbiAgICAnd2l0Y2hlcjNfY29sbGVjdGlvbl9kYXRhJyxcbiAgICAoZ2FtZUlkOiBzdHJpbmcsIGluY2x1ZGVkTW9kczogc3RyaW5nW10sIGNvbGxlY3Rpb246IHR5cGVzLklNb2QpID0+XG4gICAgICBnZW5Db2xsZWN0aW9uc0RhdGEoY29udGV4dCwgZ2FtZUlkLCBpbmNsdWRlZE1vZHMsIGNvbGxlY3Rpb24pLFxuICAgIChnYW1lSWQ6IHN0cmluZywgY29sbGVjdGlvbjogSVczQ29sbGVjdGlvbnNEYXRhKSA9PlxuICAgICAgcGFyc2VDb2xsZWN0aW9uc0RhdGEoY29udGV4dCwgZ2FtZUlkLCBjb2xsZWN0aW9uKSxcbiAgICAoKSA9PiBQcm9taXNlLnJlc29sdmUoKSxcbiAgICAodCkgPT4gdCgnV2l0Y2hlciAzIERhdGEnKSxcbiAgICAoc3RhdGU6IHR5cGVzLklTdGF0ZSwgZ2FtZUlkOiBzdHJpbmcpID0+IGdhbWVJZCA9PT0gR0FNRV9JRCxcbiAgICBDb2xsZWN0aW9uc0RhdGFWaWV3LFxuICApO1xuXG4gIGNvbnRleHQucmVnaXN0ZXJQcm9maWxlRmVhdHVyZShcbiAgICAnbG9jYWxfbWVyZ2VzJywgJ2Jvb2xlYW4nLCAnc2V0dGluZ3MnLCAnUHJvZmlsZSBEYXRhJyxcbiAgICAnVGhpcyBwcm9maWxlIHdpbGwgc3RvcmUgYW5kIHJlc3RvcmUgcHJvZmlsZSBzcGVjaWZpYyBkYXRhIChtZXJnZWQgc2NyaXB0cywgbG9hZG9yZGVyLCBldGMpIHdoZW4gc3dpdGNoaW5nIHByb2ZpbGVzJyxcbiAgICAoKSA9PiB7XG4gICAgICBjb25zdCBhY3RpdmVHYW1lSWQgPSBzZWxlY3RvcnMuYWN0aXZlR2FtZUlkKGNvbnRleHQuYXBpLmdldFN0YXRlKCkpO1xuICAgICAgcmV0dXJuIGFjdGl2ZUdhbWVJZCA9PT0gR0FNRV9JRDtcbiAgICB9KTtcblxuICBjb25zdCB0b2dnbGVNb2RzU3RhdGUgPSBhc3luYyAoZW5hYmxlZCkgPT4ge1xuICAgIGNvbnN0IHN0YXRlID0gY29udGV4dC5hcGkuc3RvcmUuZ2V0U3RhdGUoKTtcbiAgICBjb25zdCBwcm9maWxlID0gc2VsZWN0b3JzLmFjdGl2ZVByb2ZpbGUoc3RhdGUpO1xuICAgIGNvbnN0IGxvYWRPcmRlciA9IGdldFBlcnNpc3RlbnRMb2FkT3JkZXIoY29udGV4dC5hcGkpO1xuICAgIGNvbnN0IG1vZE1hcCA9IGF3YWl0IGdldEFsbE1vZHMoY29udGV4dC5hcGkpO1xuICAgIGNvbnN0IG1hbnVhbExvY2tlZCA9IG1vZE1hcC5tYW51YWwuZmlsdGVyKG1vZE5hbWUgPT4gbW9kTmFtZS5zdGFydHNXaXRoKExPQ0tFRF9QUkVGSVgpKTtcbiAgICBjb25zdCB0b3RhbExvY2tlZCA9IFtdLmNvbmNhdChtb2RNYXAubWVyZ2VkLCBtYW51YWxMb2NrZWQpO1xuICAgIGNvbnN0IG5ld0xPID0gbG9hZE9yZGVyLnJlZHVjZSgoYWNjdW0sIGtleSwgaWR4KSA9PiB7XG4gICAgICBpZiAodG90YWxMb2NrZWQuaW5jbHVkZXMoa2V5KSkge1xuICAgICAgICBhY2N1bS5wdXNoKGxvYWRPcmRlcltpZHhdKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGFjY3VtLnB1c2goe1xuICAgICAgICAgIC4uLmxvYWRPcmRlcltpZHhdLFxuICAgICAgICAgIGVuYWJsZWQsXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGFjY3VtO1xuICAgIH0sIFtdKTtcbiAgICBjb250ZXh0LmFwaS5zdG9yZS5kaXNwYXRjaChhY3Rpb25zLnNldExvYWRPcmRlcihwcm9maWxlLmlkLCBuZXdMTyBhcyBhbnkpKTtcbiAgfTtcbiAgY29uc3QgcHJvcHMgPSB7XG4gICAgb25Ub2dnbGVNb2RzU3RhdGU6IHRvZ2dsZU1vZHNTdGF0ZSxcbiAgICBhcGk6IGNvbnRleHQuYXBpLFxuICAgIGdldFByaW9yaXR5TWFuYWdlcixcbiAgfVxuICBjb250ZXh0LnJlZ2lzdGVyTG9hZE9yZGVyKG5ldyBUVzNMb2FkT3JkZXIocHJvcHMpKTtcbiAgLy8gY29udGV4dC5yZWdpc3RlclRlc3QoJ3R3My1tb2QtbGltaXQtYnJlYWNoJywgJ2dhbWVtb2RlLWFjdGl2YXRlZCcsXG4gIC8vICAgKCkgPT4gQmx1ZWJpcmQucmVzb2x2ZSh0ZXN0TW9kTGltaXRCcmVhY2goY29udGV4dC5hcGksIG1vZExpbWl0UGF0Y2hlcikpKTtcbiAgLy8gY29udGV4dC5yZWdpc3RlclRlc3QoJ3R3My1tb2QtbGltaXQtYnJlYWNoJywgJ21vZC1hY3RpdmF0ZWQnLFxuICAvLyAgICgpID0+IEJsdWViaXJkLnJlc29sdmUodGVzdE1vZExpbWl0QnJlYWNoKGNvbnRleHQuYXBpLCBtb2RMaW1pdFBhdGNoZXIpKSk7XG5cbiAgY29udGV4dC5vbmNlKCgpID0+IHtcbiAgICBwcmlvcml0eU1hbmFnZXIgPSBuZXcgUHJpb3JpdHlNYW5hZ2VyKGNvbnRleHQuYXBpLCAncHJlZml4LWJhc2VkJyk7XG4gICAgSW5pU3RydWN0dXJlLmdldEluc3RhbmNlKGNvbnRleHQuYXBpLCBnZXRQcmlvcml0eU1hbmFnZXIpO1xuICAgIC8vIG1vZExpbWl0UGF0Y2hlciA9IG5ldyBNb2RMaW1pdFBhdGNoZXIoY29udGV4dC5hcGkpO1xuXG4gICAgY29udGV4dC5hcGkuZXZlbnRzLm9uKCdnYW1lbW9kZS1hY3RpdmF0ZWQnLCBvbkdhbWVNb2RlQWN0aXZhdGlvbihjb250ZXh0LmFwaSkpO1xuICAgIGNvbnRleHQuYXBpLmV2ZW50cy5vbigncHJvZmlsZS13aWxsLWNoYW5nZScsIG9uUHJvZmlsZVdpbGxDaGFuZ2UoY29udGV4dC5hcGkpKTtcbiAgICBjb250ZXh0LmFwaS5ldmVudHMub24oJ21vZHMtZW5hYmxlZCcsIG9uTW9kc0Rpc2FibGVkKGNvbnRleHQuYXBpLCBnZXRQcmlvcml0eU1hbmFnZXIpKTtcblxuICAgIGNvbnRleHQuYXBpLm9uQXN5bmMoJ3dpbGwtZGVwbG95Jywgb25XaWxsRGVwbG95KGNvbnRleHQuYXBpKSBhcyBhbnkpO1xuICAgIGNvbnRleHQuYXBpLm9uQXN5bmMoJ2RpZC1kZXBsb3knLCBvbkRpZERlcGxveShjb250ZXh0LmFwaSkgYXMgYW55KTtcbiAgICBjb250ZXh0LmFwaS5vbkFzeW5jKCdkaWQtcHVyZ2UnLCBvbkRpZFB1cmdlKGNvbnRleHQuYXBpLCBnZXRQcmlvcml0eU1hbmFnZXIpIGFzIGFueSk7XG4gICAgY29udGV4dC5hcGkub25Bc3luYygnZGlkLXJlbW92ZS1tb2QnLCBvbkRpZFJlbW92ZU1vZChjb250ZXh0LmFwaSwgZ2V0UHJpb3JpdHlNYW5hZ2VyKSBhcyBhbnkpO1xuXG4gICAgY29udGV4dC5hcGkub25TdGF0ZUNoYW5nZShbJ3NldHRpbmdzJywgJ3dpdGNoZXIzJ10sIG9uU2V0dGluZ3NDaGFuZ2UoY29udGV4dC5hcGksIGdldFByaW9yaXR5TWFuYWdlcikgYXMgYW55KTtcbiAgfSk7XG4gIHJldHVybiB0cnVlO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgZGVmYXVsdDogbWFpbixcbn07XG4iXX0=