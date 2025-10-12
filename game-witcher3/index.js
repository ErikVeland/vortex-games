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
const platform_1 = require("../../../src/util/platform");
const winapi = (0, platform_1.isWindows)() ? require('winapi-bindings') : undefined;
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
        const instPath = ((0, platform_1.isWindows)() && winapi) ? winapi.RegGetValue('HKEY_LOCAL_MACHINE', 'Software\\CD Project Red\\The Witcher 3', 'InstallFolder') : null;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7OztBQUNBLHdEQUFnQztBQUNoQyxnREFBd0I7QUFDeEIsMkNBQXNFO0FBQ3RFLHlEQUF1RDtBQUV2RCxNQUFNLE1BQU0sR0FBRyxJQUFBLG9CQUFTLEdBQUUsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLGlCQUFpQixDQUFDLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQztBQUVwRSw2Q0FBa0U7QUFFbEUsMkRBQXFGO0FBRXJGLHNGQUE4RDtBQUU5RCxpREFBMkY7QUFFM0YscUNBRWtCO0FBRWxCLHlDQUE2QztBQUM3Qyx1Q0FBb0Q7QUFFcEQscURBQW1EO0FBQ25ELHVEQUFvRDtBQUVwRCw2Q0FFd0U7QUFFeEUseUNBQXVDO0FBRXZDLGlDQUM4RDtBQUM5RCw0REFBdUM7QUFHdkMsbURBQytFO0FBQy9FLDREQUF1QztBQUV2QyxNQUFNLE1BQU0sR0FBRyxZQUFZLENBQUM7QUFDNUIsTUFBTSxXQUFXLEdBQUcsWUFBWSxDQUFDO0FBQ2pDLE1BQU0sU0FBUyxHQUFHLFlBQVksQ0FBQztBQUMvQixNQUFNLFdBQVcsR0FBRyxZQUFZLENBQUM7QUFDakMsTUFBTSxRQUFRLEdBQUcsUUFBUSxDQUFDO0FBQzFCLE1BQU0sV0FBVyxHQUFHLFFBQVEsQ0FBQztBQUM3QixNQUFNLE9BQU8sR0FBRyxrQ0FBa0MsQ0FBQztBQUVuRCxNQUFNLEtBQUssR0FBa0I7SUFDM0I7UUFDRSxFQUFFLEVBQUUseUJBQWdCO1FBQ3BCLElBQUksRUFBRSxrQkFBa0I7UUFDeEIsSUFBSSxFQUFFLHlCQUF5QjtRQUMvQixVQUFVLEVBQUUsR0FBRyxFQUFFLENBQUMseUJBQXlCO1FBQzNDLGFBQWEsRUFBRTtZQUNiLHlCQUF5QjtTQUMxQjtLQUNGO0lBQ0Q7UUFDRSxFQUFFLEVBQUUsZ0JBQU8sR0FBRyxPQUFPO1FBQ3JCLElBQUksRUFBRSxzQkFB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bHVlYmlyZCBmcm9tICdibHVlYmlyZCc7XG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcbmltcG9ydCB7IGFjdGlvbnMsIGZzLCBsb2csIHNlbGVjdG9ycywgdHlwZXMsIHV0aWwgfSBmcm9tICd2b3J0ZXgtYXBpJztcbmltcG9ydCB7IGlzV2luZG93cyB9IGZyb20gJy4uLy4uLy4uL3NyYy91dGlsL3BsYXRmb3JtJztcbi8vIENvbmRpdGlvbmFsIHdpbmFwaSBpbXBvcnQgLSBvbmx5IGF2YWlsYWJsZSBvbiBXaW5kb3dzXG5jb25zdCB3aW5hcGkgPSBpc1dpbmRvd3MoKSA/IHJlcXVpcmUoJ3dpbmFwaS1iaW5kaW5ncycpIDogdW5kZWZpbmVkO1xuXG5pbXBvcnQgeyBnZXRQZXJzaXN0ZW50TG9hZE9yZGVyLCBtaWdyYXRlMTQ4IH0gZnJvbSAnLi9taWdyYXRpb25zJztcblxuaW1wb3J0IHsgZ2VuQ29sbGVjdGlvbnNEYXRhLCBwYXJzZUNvbGxlY3Rpb25zRGF0YSB9IGZyb20gJy4vY29sbGVjdGlvbnMvY29sbGVjdGlvbnMnO1xuaW1wb3J0IHsgSVczQ29sbGVjdGlvbnNEYXRhIH0gZnJvbSAnLi9jb2xsZWN0aW9ucy90eXBlcyc7XG5pbXBvcnQgQ29sbGVjdGlvbnNEYXRhVmlldyBmcm9tICcuL3ZpZXdzL0NvbGxlY3Rpb25zRGF0YVZpZXcnO1xuXG5pbXBvcnQgeyBkb3dubG9hZFNjcmlwdE1lcmdlciwgZ2V0U2NyaXB0TWVyZ2VyRGlyLCBzZXRNZXJnZXJDb25maWcgfSBmcm9tICcuL3NjcmlwdG1lcmdlcic7XG5cbmltcG9ydCB7IERPX05PVF9ERVBMT1ksIEdBTUVfSUQsIGdldExvYWRPcmRlckZpbGVQYXRoLFxuICBMT0NLRURfUFJFRklYLCBTQ1JJUFRfTUVSR0VSX0lEXG59IGZyb20gJy4vY29tbW9uJztcblxuaW1wb3J0IHsgdGVzdERMQywgdGVzdFRMIH0gZnJvbSAnLi9tb2RUeXBlcyc7XG5pbXBvcnQgeyBjYW5NZXJnZVhNTCwgZG9NZXJnZVhNTCB9IGZyb20gJy4vbWVyZ2Vycyc7XG5cbmltcG9ydCB7IHJlZ2lzdGVyQWN0aW9ucyB9IGZyb20gJy4vaWNvbmJhckFjdGlvbnMnO1xuaW1wb3J0IHsgUHJpb3JpdHlNYW5hZ2VyIH0gZnJvbSAnLi9wcmlvcml0eU1hbmFnZXInO1xuXG5pbXBvcnQgeyBpbnN0YWxsQ29udGVudCwgaW5zdGFsbE1lbnVNb2QsIGluc3RhbGxUTCwgaW5zdGFsbERMQ01vZCwgaW5zdGFsbE1peGVkLFxuICBzY3JpcHRNZXJnZXJEdW1teUluc3RhbGxlciwgc2NyaXB0TWVyZ2VyVGVzdCwgdGVzdE1lbnVNb2RSb290LCB0ZXN0U3VwcG9ydGVkQ29udGVudCxcbiAgdGVzdFN1cHBvcnRlZFRMLCB0ZXN0U3VwcG9ydGVkTWl4ZWQsIHRlc3RETENNb2QgfSBmcm9tICcuL2luc3RhbGxlcnMnO1xuXG5pbXBvcnQgeyBXM1JlZHVjZXIgfSBmcm9tICcuL3JlZHVjZXJzJztcblxuaW1wb3J0IHsgZ2V0RExDUGF0aCwgZ2V0QWxsTW9kcywgZGV0ZXJtaW5lRXhlY3V0YWJsZSwgZ2V0RG9jdW1lbnRzUGF0aCxcbiAgZ2V0VExQYXRoLCBpc1RXMywgbm90aWZ5TWlzc2luZ1NjcmlwdE1lcmdlciB9IGZyb20gJy4vdXRpbCc7XG5pbXBvcnQgVFczTG9hZE9yZGVyIGZyb20gJy4vbG9hZE9yZGVyJztcblxuXG5pbXBvcnQgeyBvbkRpZERlcGxveSwgb25EaWRQdXJnZSwgb25EaWRSZW1vdmVNb2QsIG9uR2FtZU1vZGVBY3RpdmF0aW9uLCBvbk1vZHNEaXNhYmxlZCxcbiAgb25Qcm9maWxlV2lsbENoYW5nZSwgb25TZXR0aW5nc0NoYW5nZSwgb25XaWxsRGVwbG95IH0gZnJvbSAnLi9ldmVudEhhbmRsZXJzJztcbmltcG9ydCBJbmlTdHJ1Y3R1cmUgZnJvbSAnLi9pbmlQYXJzZXInO1xuXG5jb25zdCBHT0dfSUQgPSAnMTIwNzY2NDY2Myc7XG5jb25zdCBHT0dfSURfR09UWSA9ICcxNDk1MTM0MzIwJztcbmNvbnN0IEdPR19XSF9JRCA9ICcxMjA3NjY0NjQzJztcbmNvbnN0IEdPR19XSF9HT1RZID0gJzE2NDA0MjQ3NDcnO1xuY29uc3QgU1RFQU1fSUQgPSAnNDk5NDUwJztcbmNvbnN0IFNURUFNX0lEX1dIID0gJzI5MjAzMCc7XG5jb25zdCBFUElDX0lEID0gJzcyNWEyMmUxNWVkNzQ3MzViYjBkNmExOWYzY2M4MmQwJztcblxuY29uc3QgdG9vbHM6IHR5cGVzLklUb29sW10gPSBbXG4gIHtcbiAgICBpZDogU0NSSVBUX01FUkdFUl9JRCxcbiAgICBuYW1lOiAnVzMgU2NyaXB0IE1lcmdlcicsXG4gICAgbG9nbzogJ1dpdGNoZXJTY3JpcHRNZXJnZXIuanBnJyxcbiAgICBleGVjdXRhYmxlOiAoKSA9PiAnV2l0Y2hlclNjcmlwdE1lcmdlci5leGUnLFxuICAgIHJlcXVpcmVkRmlsZXM6IFtcbiAgICAgICdXaXRjaGVyU2NyaXB0TWVyZ2VyLmV4ZScsXG4gICAgXSxcbiAgfSxcbiAge1xuICAgIGlkOiBHQU1FX0lEICsgJ19EWDExJyxcbiAgICBuYW1lOiAnVGhlIFdpdGNoZXIgMyAoRFgxMSknLFxuICAgIGxvZ286ICdhdXRvJyxcbiAgICByZWxhdGl2ZTogdHJ1ZSxcbiAgICBleGVjdXRhYmxlOiAoKSA9PiAnYmluL3g2NC93aXRjaGVyMy5leGUnLFxuICAgIHJlcXVpcmVkRmlsZXM6IFtcbiAgICAgICdiaW4veDY0L3dpdGNoZXIzLmV4ZScsXG4gICAgXSxcbiAgfSxcbiAge1xuICAgIGlkOiBHQU1FX0lEICsgJ19EWDEyJyxcbiAgICBuYW1lOiAnVGhlIFdpdGNoZXIgMyAoRFgxMiknLFxuICAgIGxvZ286ICdhdXRvJyxcbiAgICByZWxhdGl2ZTogdHJ1ZSxcbiAgICBleGVjdXRhYmxlOiAoKSA9PiAnYmluL3g2NF9EWDEyL3dpdGNoZXIzLmV4ZScsXG4gICAgcmVxdWlyZWRGaWxlczogW1xuICAgICAgJ2Jpbi94NjRfRFgxMi93aXRjaGVyMy5leGUnLFxuICAgIF0sXG4gIH0sXG5dO1xuXG5mdW5jdGlvbiBmaW5kR2FtZSgpOiBCbHVlYmlyZDxzdHJpbmc+IHtcbiAgdHJ5IHtcbiAgICBjb25zdCBpbnN0UGF0aCA9IChpc1dpbmRvd3MoKSAmJiB3aW5hcGkpID8gd2luYXBpLlJlZ0dldFZhbHVlKFxuICAgICAgJ0hLRVlfTE9DQUxfTUFDSElORScsXG4gICAgICAnU29mdHdhcmVcXFxcQ0QgUHJvamVjdCBSZWRcXFxcVGhlIFdpdGNoZXIgMycsXG4gICAgICAnSW5zdGFsbEZvbGRlcicpIDogbnVsbDtcbiAgICBpZiAoIWluc3RQYXRoKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ2VtcHR5IHJlZ2lzdHJ5IGtleScpO1xuICAgIH1cbiAgICByZXR1cm4gQmx1ZWJpcmQucmVzb2x2ZShpbnN0UGF0aC52YWx1ZSBhcyBzdHJpbmcpO1xuICB9IGNhdGNoIChlcnIpIHtcbiAgICByZXR1cm4gdXRpbC5HYW1lU3RvcmVIZWxwZXIuZmluZEJ5QXBwSWQoW1xuICAgICAgR09HX0lEX0dPVFksIEdPR19JRCwgR09HX1dIX0lELCBHT0dfV0hfR09UWSxcbiAgICAgIFNURUFNX0lELCBTVEVBTV9JRF9XSCwgRVBJQ19JRFxuICAgIF0pXG4gICAgICAudGhlbihnYW1lID0+IGdhbWUuZ2FtZVBhdGgpO1xuICB9XG59XG5cbmZ1bmN0aW9uIHByZXBhcmVGb3JNb2RkaW5nKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSkge1xuICByZXR1cm4gKGRpc2NvdmVyeTogdHlwZXMuSURpc2NvdmVyeVJlc3VsdCkgPT4ge1xuICAgIGNvbnN0IGZpbmRTY3JpcHRNZXJnZXIgPSBhc3luYyAoZXJyb3IpID0+IHtcbiAgICAgIGxvZygnZXJyb3InLCAnZmFpbGVkIHRvIGRvd25sb2FkL2luc3RhbGwgc2NyaXB0IG1lcmdlcicsIGVycm9yKTtcbiAgICAgIGNvbnN0IHNjcmlwdE1lcmdlclBhdGggPSBhd2FpdCBnZXRTY3JpcHRNZXJnZXJEaXIoYXBpKTtcbiAgICAgIGlmIChzY3JpcHRNZXJnZXJQYXRoID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgbm90aWZ5TWlzc2luZ1NjcmlwdE1lcmdlcihhcGkpO1xuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZiAoZGlzY292ZXJ5Py50b29scz8uVzNTY3JpcHRNZXJnZXIgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgIHJldHVybiBzZXRNZXJnZXJDb25maWcoZGlzY292ZXJ5LnBhdGgsIHNjcmlwdE1lcmdlclBhdGgpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfTtcbiAgICBjb25zdCBlbnN1cmVQYXRoID0gKGRpcnBhdGgpID0+XG4gICAgICBmcy5lbnN1cmVEaXJXcml0YWJsZUFzeW5jKGRpcnBhdGgpXG4gICAgICAgIC5jYXRjaChlcnIgPT4gKGVyci5jb2RlID09PSAnRUVYSVNUJylcbiAgICAgICAgICA/IFByb21pc2UucmVzb2x2ZSgpXG4gICAgICAgICAgOiBQcm9taXNlLnJlamVjdChlcnIpKTtcbiAgXG4gICAgcmV0dXJuIFByb21pc2UuYWxsKFtcbiAgICAgIGVuc3VyZVBhdGgocGF0aC5qb2luKGRpc2NvdmVyeS5wYXRoLCAnTW9kcycpKSxcbiAgICAgIGVuc3VyZVBhdGgocGF0aC5qb2luKGRpc2NvdmVyeS5wYXRoLCAnRExDJykpLFxuICAgICAgZW5zdXJlUGF0aChwYXRoLmRpcm5hbWUoZ2V0TG9hZE9yZGVyRmlsZVBhdGgoKSkpXSlcbiAgICAgICAgLnRoZW4oKCkgPT4gZG93bmxvYWRTY3JpcHRNZXJnZXIoYXBpKVxuICAgICAgICAgIC5jYXRjaChlcnIgPT4gKGVyciBpbnN0YW5jZW9mIHV0aWwuVXNlckNhbmNlbGVkKVxuICAgICAgICAgICAgPyBQcm9taXNlLnJlc29sdmUoKVxuICAgICAgICAgICAgOiBmaW5kU2NyaXB0TWVyZ2VyKGVycikpKTtcbiAgfVxufVxuXG5sZXQgcHJpb3JpdHlNYW5hZ2VyOiBQcmlvcml0eU1hbmFnZXI7XG5jb25zdCBnZXRQcmlvcml0eU1hbmFnZXIgPSAoKSA9PiBwcmlvcml0eU1hbmFnZXI7XG4vLyBsZXQgbW9kTGltaXRQYXRjaGVyOiBNb2RMaW1pdFBhdGNoZXI7XG5cbmZ1bmN0aW9uIG1haW4oY29udGV4dDogdHlwZXMuSUV4dGVuc2lvbkNvbnRleHQpIHtcbiAgY29udGV4dC5yZWdpc3RlclJlZHVjZXIoWydzZXR0aW5ncycsICd3aXRjaGVyMyddLCBXM1JlZHVjZXIpO1xuICBjb250ZXh0LnJlZ2lzdGVyR2FtZSh7XG4gICAgaWQ6IEdBTUVfSUQsXG4gICAgbmFtZTogJ1RoZSBXaXRjaGVyIDMnLFxuICAgIG1lcmdlTW9kczogdHJ1ZSxcbiAgICBxdWVyeVBhdGg6IGZpbmRHYW1lLFxuICAgIHF1ZXJ5TW9kUGF0aDogKCkgPT4gJ01vZHMnLFxuICAgIGxvZ286ICdnYW1lYXJ0LmpwZycsXG4gICAgZXhlY3V0YWJsZTogZGV0ZXJtaW5lRXhlY3V0YWJsZSxcbiAgICBzZXR1cDogcHJlcGFyZUZvck1vZGRpbmcoY29udGV4dC5hcGkpIGFzIGFueSxcbiAgICBzdXBwb3J0ZWRUb29sczogdG9vbHMsXG4gICAgcmVxdWlyZXNDbGVhbnVwOiB0cnVlLFxuICAgIHJlcXVpcmVkRmlsZXM6IFtcbiAgICAgICdiaW4veDY0L3dpdGNoZXIzLmV4ZScsXG4gICAgXSxcbiAgICBlbnZpcm9ubWVudDoge1xuICAgICAgU3RlYW1BUFBJZDogJzI5MjAzMCcsXG4gICAgfSxcbiAgICBkZXRhaWxzOiB7XG4gICAgICBzdGVhbUFwcElkOiAyOTIwMzAsXG4gICAgICBpZ25vcmVDb25mbGljdHM6IERPX05PVF9ERVBMT1ksXG4gICAgICBpZ25vcmVEZXBsb3k6IERPX05PVF9ERVBMT1ksXG4gICAgfSxcbiAgfSk7XG5cbiAgY29udGV4dC5yZWdpc3Rlckluc3RhbGxlcignc2NyaXB0bWVyZ2VyZHVtbXknLCAxNSwgc2NyaXB0TWVyZ2VyVGVzdCBhcyBhbnksIHNjcmlwdE1lcmdlckR1bW15SW5zdGFsbGVyIGFzIGFueSk7XG4gIGNvbnRleHQucmVnaXN0ZXJJbnN0YWxsZXIoJ3dpdGNoZXIzbWVudW1vZHJvb3QnLCAyMCwgdGVzdE1lbnVNb2RSb290IGFzIGFueSwgaW5zdGFsbE1lbnVNb2QgYXMgYW55KTtcbiAgY29udGV4dC5yZWdpc3Rlckluc3RhbGxlcignd2l0Y2hlcjNtaXhlZCcsIDI1LCB0ZXN0U3VwcG9ydGVkTWl4ZWQgYXMgYW55LCBpbnN0YWxsTWl4ZWQgYXMgYW55KTtcbiAgY29udGV4dC5yZWdpc3Rlckluc3RhbGxlcignd2l0Y2hlcjN0bCcsIDMwLCB0ZXN0U3VwcG9ydGVkVEwgYXMgYW55LCBpbnN0YWxsVEwgYXMgYW55KTtcbiAgY29udGV4dC5yZWdpc3Rlckluc3RhbGxlcignd2l0Y2hlcjNjb250ZW50JywgNTAsIHRlc3RTdXBwb3J0ZWRDb250ZW50IGFzIGFueSwgaW5zdGFsbENvbnRlbnQgYXMgYW55KTtcbiAgY29udGV4dC5yZWdpc3Rlckluc3RhbGxlcignd2l0Y2hlcjNkbGNtb2QnLCA2MCwgdGVzdERMQ01vZCBhcyBhbnksIGluc3RhbGxETENNb2QgYXMgYW55KTtcblxuICBjb250ZXh0LnJlZ2lzdGVyTW9kVHlwZSgnd2l0Y2hlcjNtZW51bW9kcm9vdCcsIDIwLCBpc1RXMyhjb250ZXh0LmFwaSksIGdldFRMUGF0aChjb250ZXh0LmFwaSksIHRlc3RNZW51TW9kUm9vdCBhcyBhbnkpO1xuICBjb250ZXh0LnJlZ2lzdGVyTW9kVHlwZSgnd2l0Y2hlcjN0bCcsIDI1LCBpc1RXMyhjb250ZXh0LmFwaSksIGdldFRMUGF0aChjb250ZXh0LmFwaSksIHRlc3RUTCBhcyBhbnkpO1xuICBjb250ZXh0LnJlZ2lzdGVyTW9kVHlwZSgnd2l0Y2hlcjNkbGMnLCAyNSwgaXNUVzMoY29udGV4dC5hcGkpLCBnZXRETENQYXRoKGNvbnRleHQuYXBpKSwgdGVzdERMQyBhcyBhbnkpO1xuICBjb250ZXh0LnJlZ2lzdGVyTW9kVHlwZSgndzNtb2RsaW1pdHBhdGNoZXInLCAyNSwgaXNUVzMoY29udGV4dC5hcGkpLCBnZXRUTFBhdGgoY29udGV4dC5hcGkpLCAoKSA9PiBCbHVlYmlyZC5yZXNvbHZlKGZhbHNlKSxcbiAgICB7IGRlcGxveW1lbnRFc3NlbnRpYWw6IGZhbHNlLCBuYW1lOiAnTW9kIExpbWl0IFBhdGNoZXIgTW9kIFR5cGUnIH0pO1xuICBjb250ZXh0LnJlZ2lzdGVyTW9kVHlwZSgnd2l0Y2hlcjNtZW51bW9kZG9jdW1lbnRzJywgNjAsIGlzVFczKGNvbnRleHQuYXBpKSwgZ2V0RG9jdW1lbnRzUGF0aCwgKCkgPT4gQmx1ZWJpcmQucmVzb2x2ZShmYWxzZSkpO1xuXG4gIGNvbnRleHQucmVnaXN0ZXJNZXJnZShjYW5NZXJnZVhNTChjb250ZXh0LmFwaSksIGRvTWVyZ2VYTUwoY29udGV4dC5hcGkpIGFzIGFueSwgJ3dpdGNoZXIzbWVudW1vZHJvb3QnKTtcbiAgLy8gY29udGV4dC5yZWdpc3Rlck1lcmdlKGNhbk1lcmdlU2V0dGluZ3MoY29udGV4dC5hcGkpLCBkb01lcmdlU2V0dGluZ3MoY29udGV4dC5hcGkpIGFzIGFueSwgJ3dpdGNoZXIzbWVudW1vZGRvY3VtZW50cycpO1xuXG4gIGNvbnRleHQucmVnaXN0ZXJNaWdyYXRpb24oKG9sZFZlcnNpb24pID0+IChtaWdyYXRlMTQ4KGNvbnRleHQsIG9sZFZlcnNpb24pIGFzIGFueSkpO1xuXG4gIHJlZ2lzdGVyQWN0aW9ucyh7IGNvbnRleHQsIGdldFByaW9yaXR5TWFuYWdlciB9KTtcblxuICBjb250ZXh0Lm9wdGlvbmFsLnJlZ2lzdGVyQ29sbGVjdGlvbkZlYXR1cmUoXG4gICAgJ3dpdGNoZXIzX2NvbGxlY3Rpb25fZGF0YScsXG4gICAgKGdhbWVJZDogc3RyaW5nLCBpbmNsdWRlZE1vZHM6IHN0cmluZ1tdLCBjb2xsZWN0aW9uOiB0eXBlcy5JTW9kKSA9PlxuICAgICAgZ2VuQ29sbGVjdGlvbnNEYXRhKGNvbnRleHQsIGdhbWVJZCwgaW5jbHVkZWRNb2RzLCBjb2xsZWN0aW9uKSxcbiAgICAoZ2FtZUlkOiBzdHJpbmcsIGNvbGxlY3Rpb246IElXM0NvbGxlY3Rpb25zRGF0YSkgPT5cbiAgICAgIHBhcnNlQ29sbGVjdGlvbnNEYXRhKGNvbnRleHQsIGdhbWVJZCwgY29sbGVjdGlvbiksXG4gICAgKCkgPT4gUHJvbWlzZS5yZXNvbHZlKCksXG4gICAgKHQpID0+IHQoJ1dpdGNoZXIgMyBEYXRhJyksXG4gICAgKHN0YXRlOiB0eXBlcy5JU3RhdGUsIGdhbWVJZDogc3RyaW5nKSA9PiBnYW1lSWQgPT09IEdBTUVfSUQsXG4gICAgQ29sbGVjdGlvbnNEYXRhVmlldyxcbiAgKTtcblxuICBjb250ZXh0LnJlZ2lzdGVyUHJvZmlsZUZlYXR1cmUoXG4gICAgJ2xvY2FsX21lcmdlcycsICdib29sZWFuJywgJ3NldHRpbmdzJywgJ1Byb2ZpbGUgRGF0YScsXG4gICAgJ1RoaXMgcHJvZmlsZSB3aWxsIHN0b3JlIGFuZCByZXN0b3JlIHByb2ZpbGUgc3BlY2lmaWMgZGF0YSAobWVyZ2VkIHNjcmlwdHMsIGxvYWRvcmRlciwgZXRjKSB3aGVuIHN3aXRjaGluZyBwcm9maWxlcycsXG4gICAgKCkgPT4ge1xuICAgICAgY29uc3QgYWN0aXZlR2FtZUlkID0gc2VsZWN0b3JzLmFjdGl2ZUdhbWVJZChjb250ZXh0LmFwaS5nZXRTdGF0ZSgpKTtcbiAgICAgIHJldHVybiBhY3RpdmVHYW1lSWQgPT09IEdBTUVfSUQ7XG4gICAgfSk7XG5cbiAgY29uc3QgdG9nZ2xlTW9kc1N0YXRlID0gYXN5bmMgKGVuYWJsZWQpID0+IHtcbiAgICBjb25zdCBzdGF0ZSA9IGNvbnRleHQuYXBpLnN0b3JlLmdldFN0YXRlKCk7XG4gICAgY29uc3QgcHJvZmlsZSA9IHNlbGVjdG9ycy5hY3RpdmVQcm9maWxlKHN0YXRlKTtcbiAgICBjb25zdCBsb2FkT3JkZXIgPSBnZXRQZXJzaXN0ZW50TG9hZE9yZGVyKGNvbnRleHQuYXBpKTtcbiAgICBjb25zdCBtb2RNYXAgPSBhd2FpdCBnZXRBbGxNb2RzKGNvbnRleHQuYXBpKTtcbiAgICBjb25zdCBtYW51YWxMb2NrZWQgPSBtb2RNYXAubWFudWFsLmZpbHRlcihtb2ROYW1lID0+IG1vZE5hbWUuc3RhcnRzV2l0aChMT0NLRURfUFJFRklYKSk7XG4gICAgY29uc3QgdG90YWxMb2NrZWQgPSBbXS5jb25jYXQobW9kTWFwLm1lcmdlZCwgbWFudWFsTG9ja2VkKTtcbiAgICBjb25zdCBuZXdMTyA9IGxvYWRPcmRlci5yZWR1Y2UoKGFjY3VtLCBrZXksIGlkeCkgPT4ge1xuICAgICAgaWYgKHRvdGFsTG9ja2VkLmluY2x1ZGVzKGtleSkpIHtcbiAgICAgICAgYWNjdW0ucHVzaChsb2FkT3JkZXJbaWR4XSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBhY2N1bS5wdXNoKHtcbiAgICAgICAgICAuLi5sb2FkT3JkZXJbaWR4XSxcbiAgICAgICAgICBlbmFibGVkLFxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBhY2N1bTtcbiAgICB9LCBbXSk7XG4gICAgY29udGV4dC5hcGkuc3RvcmUuZGlzcGF0Y2goYWN0aW9ucy5zZXRMb2FkT3JkZXIocHJvZmlsZS5pZCwgbmV3TE8gYXMgYW55KSk7XG4gIH07XG4gIGNvbnN0IHByb3BzID0ge1xuICAgIG9uVG9nZ2xlTW9kc1N0YXRlOiB0b2dnbGVNb2RzU3RhdGUsXG4gICAgYXBpOiBjb250ZXh0LmFwaSxcbiAgICBnZXRQcmlvcml0eU1hbmFnZXIsXG4gIH1cbiAgY29udGV4dC5yZWdpc3RlckxvYWRPcmRlcihuZXcgVFczTG9hZE9yZGVyKHByb3BzKSk7XG4gIC8vIGNvbnRleHQucmVnaXN0ZXJUZXN0KCd0dzMtbW9kLWxpbWl0LWJyZWFjaCcsICdnYW1lbW9kZS1hY3RpdmF0ZWQnLFxuICAvLyAgICgpID0+IEJsdWViaXJkLnJlc29sdmUodGVzdE1vZExpbWl0QnJlYWNoKGNvbnRleHQuYXBpLCBtb2RMaW1pdFBhdGNoZXIpKSk7XG4gIC8vIGNvbnRleHQucmVnaXN0ZXJUZXN0KCd0dzMtbW9kLWxpbWl0LWJyZWFjaCcsICdtb2QtYWN0aXZhdGVkJyxcbiAgLy8gICAoKSA9PiBCbHVlYmlyZC5yZXNvbHZlKHRlc3RNb2RMaW1pdEJyZWFjaChjb250ZXh0LmFwaSwgbW9kTGltaXRQYXRjaGVyKSkpO1xuXG4gIGNvbnRleHQub25jZSgoKSA9PiB7XG4gICAgcHJpb3JpdHlNYW5hZ2VyID0gbmV3IFByaW9yaXR5TWFuYWdlcihjb250ZXh0LmFwaSwgJ3ByZWZpeC1iYXNlZCcpO1xuICAgIEluaVN0cnVjdHVyZS5nZXRJbnN0YW5jZShjb250ZXh0LmFwaSwgZ2V0UHJpb3JpdHlNYW5hZ2VyKTtcbiAgICAvLyBtb2RMaW1pdFBhdGNoZXIgPSBuZXcgTW9kTGltaXRQYXRjaGVyKGNvbnRleHQuYXBpKTtcblxuICAgIGNvbnRleHQuYXBpLmV2ZW50cy5vbignZ2FtZW1vZGUtYWN0aXZhdGVkJywgb25HYW1lTW9kZUFjdGl2YXRpb24oY29udGV4dC5hcGkpKTtcbiAgICBjb250ZXh0LmFwaS5ldmVudHMub24oJ3Byb2ZpbGUtd2lsbC1jaGFuZ2UnLCBvblByb2ZpbGVXaWxsQ2hhbmdlKGNvbnRleHQuYXBpKSk7XG4gICAgY29udGV4dC5hcGkuZXZlbnRzLm9uKCdtb2RzLWVuYWJsZWQnLCBvbk1vZHNEaXNhYmxlZChjb250ZXh0LmFwaSwgZ2V0UHJpb3JpdHlNYW5hZ2VyKSk7XG5cbiAgICBjb250ZXh0LmFwaS5vbkFzeW5jKCd3aWxsLWRlcGxveScsIG9uV2lsbERlcGxveShjb250ZXh0LmFwaSkgYXMgYW55KTtcbiAgICBjb250ZXh0LmFwaS5vbkFzeW5jKCdkaWQtZGVwbG95Jywgb25EaWREZXBsb3koY29udGV4dC5hcGkpIGFzIGFueSk7XG4gICAgY29udGV4dC5hcGkub25Bc3luYygnZGlkLXB1cmdlJywgb25EaWRQdXJnZShjb250ZXh0LmFwaSwgZ2V0UHJpb3JpdHlNYW5hZ2VyKSBhcyBhbnkpO1xuICAgIGNvbnRleHQuYXBpLm9uQXN5bmMoJ2RpZC1yZW1vdmUtbW9kJywgb25EaWRSZW1vdmVNb2QoY29udGV4dC5hcGksIGdldFByaW9yaXR5TWFuYWdlcikgYXMgYW55KTtcblxuICAgIGNvbnRleHQuYXBpLm9uU3RhdGVDaGFuZ2UoWydzZXR0aW5ncycsICd3aXRjaGVyMyddLCBvblNldHRpbmdzQ2hhbmdlKGNvbnRleHQuYXBpLCBnZXRQcmlvcml0eU1hbmFnZXIpIGFzIGFueSk7XG4gIH0pO1xuICByZXR1cm4gdHJ1ZTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIGRlZmF1bHQ6IG1haW4sXG59O1xuIl19