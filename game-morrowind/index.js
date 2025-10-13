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
const path_1 = __importDefault(require("path"));
const vortex_api_1 = require("vortex-api");
const React = __importStar(require("react"));
const walk = require('turbowalk').default;
const loadorder_1 = require("./loadorder");
const constants_1 = require("./constants");
const collections_1 = require("./collections");
const MorrowindCollectionsDataView_1 = __importDefault(require("./views/MorrowindCollectionsDataView"));
const migrations_1 = require("./migrations");
const STEAMAPP_ID = '22320';
const GOG_ID = '1435828767';
const MS_ID = 'BethesdaSoftworks.TESMorrowind-PC';
const GAME_ID = constants_1.MORROWIND_ID;
const localeFoldersXbox = {
    en: 'Morrowind GOTY English',
    fr: 'Morrowind GOTY French',
    de: 'Morrowind GOTY German',
};
const gameStoreIds = {
    steam: [{ id: STEAMAPP_ID, prefer: 0 }],
    xbox: [{ id: MS_ID }],
    gog: [{ id: GOG_ID }],
    registry: [{ id: 'HKEY_LOCAL_MACHINE:Software\\Wow6432Node\\Bethesda Softworks\\Morrowind:Installed Path' }],
};
const tools = [
    {
        id: 'tes3edit',
        name: 'TES3Edit',
        executable: () => 'TES3Edit.exe',
        requiredFiles: []
    },
    {
        id: 'mw-construction-set',
        name: 'Construction Set',
        logo: 'constructionset.png',
        executable: () => 'TES Construction Set.exe',
        requiredFiles: [
            'TES Construction Set.exe',
        ],
        relative: true,
        exclusive: true
    }
];
function findGame() {
    return __awaiter(this, void 0, void 0, function* () {
        const storeGames = yield vortex_api_1.util.GameStoreHelper.find(gameStoreIds).catch(() => []);
        if (!storeGames.length)
            return;
        if (storeGames.length > 1)
            (0, vortex_api_1.log)('debug', 'Mutliple copies of Oblivion found', storeGames.map(s => s.gameStoreId));
        const selectedGame = storeGames[0];
        if (['epic', 'xbox'].includes(selectedGame.gameStoreId)) {
            (0, vortex_api_1.log)('debug', 'Defaulting to the English game version', { store: selectedGame.gameStoreId, folder: localeFoldersXbox['en'] });
            selectedGame.gamePath = path_1.default.join(selectedGame.gamePath, localeFoldersXbox['en']);
        }
        return selectedGame;
    });
}
function prepareForModding(api, discovery) {
    var _a;
    const gameName = ((_a = vortex_api_1.util.getGame(GAME_ID)) === null || _a === void 0 ? void 0 : _a.name) || 'This game';
    if (discovery.store && ['epic', 'xbox'].includes(discovery.store)) {
        const storeName = discovery.store === 'epic' ? 'Epic Games' : 'Xbox Game Pass';
        api.sendNotification({
            id: `${GAME_ID}-locale-message`,
            type: 'info',
            title: 'Multiple Languages Available',
            message: 'Default: English',
            allowSuppress: true,
            actions: [
                {
                    title: 'More',
                    action: (dismiss) => {
                        dismiss();
                        api.showDialog('info', 'Mutliple Languages Available', {
                            bbcode: '{{gameName}} has multiple language options when downloaded from {{storeName}}. [br][/br][br][/br]' +
                                'Vortex has selected the English variant by default. [br][/br][br][/br]' +
                                'If you would prefer to manage a different language you can change the path to the game using the "Manually Set Location" option in the games tab.',
                            parameters: { gameName, storeName }
                        }, [
                            { label: 'Close', action: () => api.suppressNotification(`${GAME_ID}-locale-message`) }
                        ]);
                    }
                }
            ]
        });
    }
    return Promise.resolve();
}
function CollectionDataWrap(api, props) {
    return React.createElement(MorrowindCollectionsDataView_1.default, Object.assign(Object.assign({}, props), { api }));
}
function main(context) {
    context.registerGame({
        id: constants_1.MORROWIND_ID,
        name: 'Morrowind',
        mergeMods: true,
        queryPath: vortex_api_1.util.toBlue(findGame),
        supportedTools: tools,
        setup: vortex_api_1.util.toBlue((discovery) => prepareForModding(context.api, discovery)),
        queryModPath: () => 'Data Files',
        logo: 'gameart.jpg',
        executable: () => 'morrowind.exe',
        requiredFiles: [
            'morrowind.exe',
        ],
        environment: {
            SteamAPPId: STEAMAPP_ID,
        },
        details: {
            steamAppId: parseInt(STEAMAPP_ID, 10),
            gogAppId: GOG_ID
        },
    });
    context.registerLoadOrder({
        gameId: constants_1.MORROWIND_ID,
        deserializeLoadOrder: () => (0, loadorder_1.deserializeLoadOrder)(context.api),
        serializeLoadOrder: (loadOrder) => (0, loadorder_1.serializeLoadOrder)(context.api, loadOrder),
        validate: loadorder_1.validate,
        noCollectionGeneration: true,
        toggleableEntries: true,
        usageInstructions: 'Drag your plugins as needed - the game will load '
            + 'load them from top to bottom.',
    });
    context.optional.registerCollectionFeature('morrowind_collection_data', (gameId, includedMods, collection) => (0, collections_1.genCollectionsData)(context, gameId, includedMods, collection), (gameId, collection) => (0, collections_1.parseCollectionsData)(context, gameId, collection), () => Promise.resolve(), (t) => t('Load Order'), (state, gameId) => gameId === constants_1.MORROWIND_ID, (props) => CollectionDataWrap(context.api, props));
    context.registerMigration(old => (0, migrations_1.migrate103)(context.api, old));
    context.once(() => {
        context.api.events.on('did-install-mod', (gameId, archiveId, modId) => __awaiter(this, void 0, void 0, function* () {
            if (gameId !== constants_1.MORROWIND_ID) {
                return;
            }
            const state = context.api.getState();
            const installPath = vortex_api_1.selectors.installPathForGame(state, constants_1.MORROWIND_ID);
            const mod = vortex_api_1.util.getSafe(state, ['persistent', 'mods', constants_1.MORROWIND_ID, modId], undefined);
            if (installPath === undefined || mod === undefined) {
                return;
            }
            const modPath = path_1.default.join(installPath, mod.installationPath);
            const plugins = [];
            try {
                yield walk(modPath, entries => {
                    for (let entry of entries) {
                        if (['.esp', '.esm'].includes(path_1.default.extname(entry.filePath.toLowerCase()))) {
                            plugins.push(path_1.default.basename(entry.filePath));
                        }
                    }
                }, { recurse: true, skipLinks: true, skipInaccessible: true });
            }
            catch (err) {
                context.api.showErrorNotification('Failed to read list of plugins', err, { allowReport: false });
            }
            if (plugins.length > 0) {
                context.api.store.dispatch(vortex_api_1.actions.setModAttribute(constants_1.MORROWIND_ID, mod.id, 'plugins', plugins));
            }
        }));
    });
    return true;
}
module.exports = {
    default: main
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLGdEQUF3QjtBQUN4QiwyQ0FBa0U7QUFDbEUsNkNBQStCO0FBRS9CLE1BQU0sSUFBSSxHQUFHLE9BQU8sQ0FBQyxXQUFXLENBQUMsQ0FBQyxPQUFPLENBQUM7QUFFMUMsMkNBQWlGO0FBQ2pGLDJDQUEyQztBQUkzQywrQ0FBeUU7QUFFekUsd0dBQWdGO0FBRWhGLDZDQUEwQztBQUUxQyxNQUFNLFdBQVcsR0FBRyxPQUFPLENBQUM7QUFDNUIsTUFBTSxNQUFNLEdBQUcsWUFBWSxDQUFDO0FBQzVCLE1BQU0sS0FBSyxHQUFHLG1DQUFtQyxDQUFDO0FBRWxELE1BQU0sT0FBTyxHQUFHLHdCQUFZLENBQUM7QUFFN0IsTUFBTSxpQkFBaUIsR0FBRztJQUN4QixFQUFFLEVBQUUsd0JBQXdCO0lBQzVCLEVBQUUsRUFBRSx1QkFBdUI7SUFDM0IsRUFBRSxFQUFFLHVCQUF1QjtDQUM1QixDQUFBO0FBRUQsTUFBTSxZQUFZLEdBQVE7SUFDeEIsS0FBSyxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsV0FBVyxFQUFFLE1BQU0sRUFBRSxDQUFDLEVBQUUsQ0FBQztJQUN2QyxJQUFJLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxLQUFLLEVBQUUsQ0FBQztJQUNyQixHQUFHLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxNQUFNLEVBQUUsQ0FBQztJQUNyQixRQUFRLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSx3RkFBd0YsRUFBRSxDQUFDO0NBQzdHLENBQUM7QUFFRixNQUFNLEtBQUssR0FBRztJQUNaO1FBQ0UsRUFBRSxFQUFFLFVBQVU7UUFDZCxJQUFJLEVBQUUsVUFBVTtRQUNoQixVQUFVLEVBQUUsR0FBRyxFQUFFLENBQUMsY0FBYztRQUNoQyxhQUFhLEVB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QztZQUNqRSxDQUFDO1lBQUMsT0FBTyxHQUFHLEVBQUUsQ0FBQztnQkFDYixPQUFPLENBQUMsR0FBRyxDQUFDLHFCQUFxQixDQUFDLGdDQUFnQyxFQUFFLEdBQUcsRUFBRSxFQUFFLFdBQVcsRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFDO1lBQ25HLENBQUM7WUFDRCxJQUFLLE9BQU8sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLENBQUM7Z0JBQ3hCLE9BQU8sQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxvQkFBTyxDQUFDLGVBQWUsQ0FBQyx3QkFBWSxFQUFFLEdBQUcsQ0FBQyxFQUFFLEVBQUUsU0FBUyxFQUFFLE9BQU8sQ0FBQyxDQUFDLENBQUM7WUFDaEcsQ0FBQztRQUNILENBQUMsQ0FBQSxDQUFDLENBQUM7SUFDTCxDQUFDLENBQUMsQ0FBQztJQUVILE9BQU8sSUFBSSxDQUFDO0FBQ2QsQ0FBQztBQUVELE1BQU0sQ0FBQyxPQUFPLEdBQUc7SUFDZixPQUFPLEVBQUUsSUFBSTtDQUNkLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcbmltcG9ydCB7IGFjdGlvbnMsIGxvZywgc2VsZWN0b3JzLCB0eXBlcywgdXRpbCB9IGZyb20gJ3ZvcnRleC1hcGknO1xuaW1wb3J0ICogYXMgUmVhY3QgZnJvbSAncmVhY3QnO1xuXG5jb25zdCB3YWxrID0gcmVxdWlyZSgndHVyYm93YWxrJykuZGVmYXVsdDtcblxuaW1wb3J0IHsgdmFsaWRhdGUsIGRlc2VyaWFsaXplTG9hZE9yZGVyLCBzZXJpYWxpemVMb2FkT3JkZXIgfSBmcm9tICcuL2xvYWRvcmRlcic7XG5pbXBvcnQgeyBNT1JST1dJTkRfSUQgfSBmcm9tICcuL2NvbnN0YW50cyc7XG5cbmltcG9ydCB7IElFeHRlbmRlZEludGVyZmFjZVByb3BzIH0gZnJvbSAnLi90eXBlcy90eXBlcyc7XG5cbmltcG9ydCB7IGdlbkNvbGxlY3Rpb25zRGF0YSwgcGFyc2VDb2xsZWN0aW9uc0RhdGEgfSBmcm9tICcuL2NvbGxlY3Rpb25zJztcblxuaW1wb3J0IE1vcnJvd2luZENvbGxlY3Rpb25zRGF0YVZpZXcgZnJvbSAnLi92aWV3cy9Nb3Jyb3dpbmRDb2xsZWN0aW9uc0RhdGFWaWV3JztcblxuaW1wb3J0IHsgbWlncmF0ZTEwMyB9IGZyb20gJy4vbWlncmF0aW9ucyc7XG5cbmNvbnN0IFNURUFNQVBQX0lEID0gJzIyMzIwJztcbmNvbnN0IEdPR19JRCA9ICcxNDM1ODI4NzY3JztcbmNvbnN0IE1TX0lEID0gJ0JldGhlc2RhU29mdHdvcmtzLlRFU01vcnJvd2luZC1QQyc7XG5cbmNvbnN0IEdBTUVfSUQgPSBNT1JST1dJTkRfSUQ7XG5cbmNvbnN0IGxvY2FsZUZvbGRlcnNYYm94ID0ge1xuICBlbjogJ01vcnJvd2luZCBHT1RZIEVuZ2xpc2gnLFxuICBmcjogJ01vcnJvd2luZCBHT1RZIEZyZW5jaCcsXG4gIGRlOiAnTW9ycm93aW5kIEdPVFkgR2VybWFuJyxcbn1cblxuY29uc3QgZ2FtZVN0b3JlSWRzOiBhbnkgPSB7XG4gIHN0ZWFtOiBbeyBpZDogU1RFQU1BUFBfSUQsIHByZWZlcjogMCB9XSxcbiAgeGJveDogW3sgaWQ6IE1TX0lEIH1dLFxuICBnb2c6IFt7IGlkOiBHT0dfSUQgfV0sXG4gIHJlZ2lzdHJ5OiBbeyBpZDogJ0hLRVlfTE9DQUxfTUFDSElORTpTb2Z0d2FyZVxcXFxXb3c2NDMyTm9kZVxcXFxCZXRoZXNkYSBTb2Z0d29ya3NcXFxcTW9ycm93aW5kOkluc3RhbGxlZCBQYXRoJyB9XSxcbn07XG5cbmNvbnN0IHRvb2xzID0gW1xuICB7XG4gICAgaWQ6ICd0ZXMzZWRpdCcsXG4gICAgbmFtZTogJ1RFUzNFZGl0JyxcbiAgICBleGVjdXRhYmxlOiAoKSA9PiAnVEVTM0VkaXQuZXhlJyxcbiAgICByZXF1aXJlZEZpbGVzOiBbXVxuICB9LFxuICB7XG4gICAgaWQ6ICdtdy1jb25zdHJ1Y3Rpb24tc2V0JyxcbiAgICBuYW1lOiAnQ29uc3RydWN0aW9uIFNldCcsXG4gICAgbG9nbzogJ2NvbnN0cnVjdGlvbnNldC5wbmcnLFxuICAgIGV4ZWN1dGFibGU6ICgpID0+ICdURVMgQ29uc3RydWN0aW9uIFNldC5leGUnLFxuICAgIHJlcXVpcmVkRmlsZXM6IFtcbiAgICAgICdURVMgQ29uc3RydWN0aW9uIFNldC5leGUnLFxuICAgIF0sXG4gICAgcmVsYXRpdmU6IHRydWUsXG4gICAgZXhjbHVzaXZlOiB0cnVlXG4gIH1cbl07XG5cbmFzeW5jIGZ1bmN0aW9uIGZpbmRHYW1lKCkge1xuICBjb25zdCBzdG9yZUdhbWVzID0gYXdhaXQgdXRpbC5HYW1lU3RvcmVIZWxwZXIuZmluZChnYW1lU3RvcmVJZHMpLmNhdGNoKCgpID0+IFtdKTtcblxuICBpZiAoIXN0b3JlR2FtZXMubGVuZ3RoKSByZXR1cm47XG4gIFxuICBpZiAoc3RvcmVHYW1lcy5sZW5ndGggPiAxKSBsb2coJ2RlYnVnJywgJ011dGxpcGxlIGNvcGllcyBvZiBPYmxpdmlvbiBmb3VuZCcsIHN0b3JlR2FtZXMubWFwKHMgPT4gcy5nYW1lU3RvcmVJZCkpO1xuXG4gIGNvbnN0IHNlbGVjdGVkR2FtZSA9IHN0b3JlR2FtZXNbMF07XG4gIGlmIChbJ2VwaWMnLCAneGJveCddLmluY2x1ZGVzKHNlbGVjdGVkR2FtZS5nYW1lU3RvcmVJZCkpIHtcbiAgICAvLyBHZXQgdGhlIHVzZXIncyBjaG9zZW4gbGFuZ3VhZ2VcbiAgICAvLyBzdGF0ZS5pbnRlcmZhY2UubGFuZ3VhZ2UgfHwgJ2VuJztcbiAgICBsb2coJ2RlYnVnJywgJ0RlZmF1bHRpbmcgdG8gdGhlIEVuZ2xpc2ggZ2FtZSB2ZXJzaW9uJywgeyBzdG9yZTogc2VsZWN0ZWRHYW1lLmdhbWVTdG9yZUlkLCBmb2xkZXI6IGxvY2FsZUZvbGRlcnNYYm94WydlbiddIH0pO1xuICAgIHNlbGVjdGVkR2FtZS5nYW1lUGF0aCA9IHBhdGguam9pbihzZWxlY3RlZEdhbWUuZ2FtZVBhdGgsIGxvY2FsZUZvbGRlcnNYYm94WydlbiddKTtcbiAgfVxuICByZXR1cm4gc2VsZWN0ZWRHYW1lO1xufVxuXG4vKiBNb3Jyb3dpbmQgc2VlbXMgdG8gc3RhcnQgZmluZSB3aGVuIHJ1bm5pbmcgZGlyZWN0bHkuIElmIHdlIGRvIGdvIHRocm91Z2ggdGhlIGxhdW5jaGVyIHRoZW4gdGhlIGxhbmd1YWdlIHZlcnNpb24gYmVpbmdcbiAgIHN0YXJ0ZWQgbWlnaHQgbm90IGJlIHRoZSBvbmUgd2UncmUgbW9kZGluZ1xuXG5mdW5jdGlvbiByZXF1aXJlc0xhdW5jaGVyKGdhbWVQYXRoKSB7XG4gIHJldHVybiB1dGlsLkdhbWVTdG9yZUhlbHBlci5maW5kQnlBcHBJZChbTVNfSURdLCAneGJveCcpXG4gICAgLnRoZW4oKCkgPT4gUHJvbWlzZS5yZXNvbHZlKHtcbiAgICAgIGxhdW5jaGVyOiAneGJveCcsXG4gICAgICBhZGRJbmZvOiB7XG4gICAgICAgIGFwcElkOiBNU19JRCxcbiAgICAgICAgcGFyYW1ldGVyczogW1xuICAgICAgICAgIHsgYXBwRXhlY05hbWU6ICdHYW1lJyB9LFxuICAgICAgICBdLFxuICAgICAgfVxuICAgIH0pKVxuICAgIC5jYXRjaChlcnIgPT4gUHJvbWlzZS5yZXNvbHZlKHVuZGVmaW5lZCkpO1xufVxuKi9cblxuZnVuY3Rpb24gcHJlcGFyZUZvck1vZGRpbmcoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpLCBkaXNjb3Zlcnk6IHR5cGVzLklEaXNjb3ZlcnlSZXN1bHQpIHtcbiAgY29uc3QgZ2FtZU5hbWUgPSB1dGlsLmdldEdhbWUoR0FNRV9JRCk/Lm5hbWUgfHwgJ1RoaXMgZ2FtZSc7XG5cbiAgLy8gdGhlIGdhbWUgZG9lc24ndCBhY3R1YWxseSBleGlzdCBvbiB0aGUgZXBpYyBnYW1lIHN0b3JlLCB0aGlzIGNodW5rIGlzIGNvcHkmcGFzdGVkLCBkb2Vzbid0IGh1cnRcbiAgLy8ga2VlcGluZyBpdCBpZGVudGljYWxcbiAgaWYgKGRpc2NvdmVyeS5zdG9yZSAmJiBbJ2VwaWMnLCAneGJveCddLmluY2x1ZGVzKGRpc2NvdmVyeS5zdG9yZSkpIHtcbiAgICBjb25zdCBzdG9yZU5hbWUgPSBkaXNjb3Zlcnkuc3RvcmUgPT09ICdlcGljJyA/ICdFcGljIEdhbWVzJyA6ICdYYm94IEdhbWUgUGFzcyc7XG4gICAgLy8gSWYgdGhpcyBpcyBhbiBFcGljIG9yIFhib3ggZ2FtZSB3ZSd2ZSBkZWZhdWx0ZWQgdG8gRW5nbGlzaCwgc28gd2Ugc2hvdWxkIGxldCB0aGUgdXNlciBrbm93LlxuICAgIGFwaS5zZW5kTm90aWZpY2F0aW9uKHtcbiAgICAgIGlkOiBgJHtHQU1FX0lEfS1sb2NhbGUtbWVzc2FnZWAsXG4gICAgICB0eXBlOiAnaW5mbycsXG4gICAgICB0aXRsZTogJ011bHRpcGxlIExhbmd1YWdlcyBBdmFpbGFibGUnLFxuICAgICAgbWVzc2FnZTogJ0RlZmF1bHQ6IEVuZ2xpc2gnLFxuICAgICAgYWxsb3dTdXBwcmVzczogdHJ1ZSxcbiAgICAgIGFjdGlvbnM6IFtcbiAgICAgICAge1xuICAgICAgICAgIHRpdGxlOiAnTW9yZScsXG4gICAgICAgICAgYWN0aW9uOiAoZGlzbWlzcykgPT4ge1xuICAgICAgICAgICAgZGlzbWlzcygpO1xuICAgICAgICAgICAgYXBpLnNob3dEaWFsb2coJ2luZm8nLCAnTXV0bGlwbGUgTGFuZ3VhZ2VzIEF2YWlsYWJsZScsIHtcbiAgICAgICAgICAgICAgYmJjb2RlOiAne3tnYW1lTmFtZX19IGhhcyBtdWx0aXBsZSBsYW5ndWFnZSBvcHRpb25zIHdoZW4gZG93bmxvYWRlZCBmcm9tIHt7c3RvcmVOYW1lfX0uIFticl1bL2JyXVticl1bL2JyXScrXG4gICAgICAgICAgICAgICAgJ1ZvcnRleCBoYXMgc2VsZWN0ZWQgdGhlIEVuZ2xpc2ggdmFyaWFudCBieSBkZWZhdWx0LiBbYnJdWy9icl1bYnJdWy9icl0nK1xuICAgICAgICAgICAgICAgICdJZiB5b3Ugd291bGQgcHJlZmVyIHRvIG1hbmFnZSBhIGRpZmZlcmVudCBsYW5ndWFnZSB5b3UgY2FuIGNoYW5nZSB0aGUgcGF0aCB0byB0aGUgZ2FtZSB1c2luZyB0aGUgXCJNYW51YWxseSBTZXQgTG9jYXRpb25cIiBvcHRpb24gaW4gdGhlIGdhbWVzIHRhYi4nLFxuICAgICAgICAgICAgICBwYXJhbWV0ZXJzOiB7IGdhbWVOYW1lLCBzdG9yZU5hbWUgfVxuICAgICAgICAgICAgfSwgXG4gICAgICAgICAgICBbIFxuICAgICAgICAgICAgICB7IGxhYmVsOiAnQ2xvc2UnLCBhY3Rpb246ICgpID0+IGFwaS5zdXBwcmVzc05vdGlmaWNhdGlvbihgJHtHQU1FX0lEfS1sb2NhbGUtbWVzc2FnZWApIH1cbiAgICAgICAgICAgIF1cbiAgICAgICAgICAgICk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICBdXG4gICAgfSk7XG4gIH1cbiAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xufVxuXG5mdW5jdGlvbiBDb2xsZWN0aW9uRGF0YVdyYXAoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpLCBwcm9wczogSUV4dGVuZGVkSW50ZXJmYWNlUHJvcHMpOiBKU1guRWxlbWVudCB7XG4gIHJldHVybiBSZWFjdC5jcmVhdGVFbGVtZW50KE1vcnJvd2luZENvbGxlY3Rpb25zRGF0YVZpZXcsIHsgLi4ucHJvcHMsIGFwaSwgfSk7XG59XG5cbmZ1bmN0aW9uIG1haW4oY29udGV4dDogdHlwZXMuSUV4dGVuc2lvbkNvbnRleHQpIHtcbiAgY29udGV4dC5yZWdpc3RlckdhbWUoe1xuICAgIGlkOiBNT1JST1dJTkRfSUQsXG4gICAgbmFtZTogJ01vcnJvd2luZCcsXG4gICAgbWVyZ2VNb2RzOiB0cnVlLFxuICAgIHF1ZXJ5UGF0aDogdXRpbC50b0JsdWUoZmluZEdhbWUpLFxuICAgIHN1cHBvcnRlZFRvb2xzOiB0b29scyxcbiAgICBzZXR1cDogdXRpbC50b0JsdWUoKGRpc2NvdmVyeSkgPT4gcHJlcGFyZUZvck1vZGRpbmcoY29udGV4dC5hcGksIGRpc2NvdmVyeSkpLFxuICAgIHF1ZXJ5TW9kUGF0aDogKCkgPT4gJ0RhdGEgRmlsZXMnLFxuICAgIGxvZ286ICdnYW1lYXJ0LmpwZycsXG4gICAgZXhlY3V0YWJsZTogKCkgPT4gJ21vcnJvd2luZC5leGUnLFxuICAgIHJlcXVpcmVkRmlsZXM6IFtcbiAgICAgICdtb3Jyb3dpbmQuZXhlJyxcbiAgICBdLFxuICAgIC8vIHJlcXVpcmVzTGF1bmNoZXIsXG4gICAgZW52aXJvbm1lbnQ6IHtcbiAgICAgIFN0ZWFtQVBQSWQ6IFNURUFNQVBQX0lELFxuICAgIH0sXG4gICAgZGV0YWlsczoge1xuICAgICAgc3RlYW1BcHBJZDogcGFyc2VJbnQoU1RFQU1BUFBfSUQsIDEwKSxcbiAgICAgIGdvZ0FwcElkOiBHT0dfSURcbiAgICB9LFxuICB9KTtcblxuICBjb250ZXh0LnJlZ2lzdGVyTG9hZE9yZGVyKHtcbiAgICBnYW1lSWQ6IE1PUlJPV0lORF9JRCxcbiAgICBkZXNlcmlhbGl6ZUxvYWRPcmRlcjogKCkgPT4gZGVzZXJpYWxpemVMb2FkT3JkZXIoY29udGV4dC5hcGkpLFxuICAgIHNlcmlhbGl6ZUxvYWRPcmRlcjogKGxvYWRPcmRlcikgPT4gc2VyaWFsaXplTG9hZE9yZGVyKGNvbnRleHQuYXBpLCBsb2FkT3JkZXIpLFxuICAgIHZhbGlkYXRlLFxuICAgIG5vQ29sbGVjdGlvbkdlbmVyYXRpb246IHRydWUsXG4gICAgdG9nZ2xlYWJsZUVudHJpZXM6IHRydWUsXG4gICAgdXNhZ2VJbnN0cnVjdGlvbnM6ICdEcmFnIHlvdXIgcGx1Z2lucyBhcyBuZWVkZWQgLSB0aGUgZ2FtZSB3aWxsIGxvYWQgJ1xuICAgICAgKyAnbG9hZCB0aGVtIGZyb20gdG9wIHRvIGJvdHRvbS4nLFxuICB9KTtcblxuICBjb250ZXh0Lm9wdGlvbmFsLnJlZ2lzdGVyQ29sbGVjdGlvbkZlYXR1cmUoXG4gICAgJ21vcnJvd2luZF9jb2xsZWN0aW9uX2RhdGEnLFxuICAgIChnYW1lSWQsIGluY2x1ZGVkTW9kcywgY29sbGVjdGlvbikgPT5cbiAgICAgIGdlbkNvbGxlY3Rpb25zRGF0YShjb250ZXh0LCBnYW1lSWQsIGluY2x1ZGVkTW9kcywgY29sbGVjdGlvbiksXG4gICAgKGdhbWVJZCwgY29sbGVjdGlvbikgPT5cbiAgICAgIHBhcnNlQ29sbGVjdGlvbnNEYXRhKGNvbnRleHQsIGdhbWVJZCwgY29sbGVjdGlvbiksXG4gICAgKCkgPT4gUHJvbWlzZS5yZXNvbHZlKCksXG4gICAgKHQpID0+IHQoJ0xvYWQgT3JkZXInKSxcbiAgICAoc3RhdGUsIGdhbWVJZCkgPT4gZ2FtZUlkID09PSBNT1JST1dJTkRfSUQsXG4gICAgKHByb3BzOiBJRXh0ZW5kZWRJbnRlcmZhY2VQcm9wcykgPT4gQ29sbGVjdGlvbkRhdGFXcmFwKGNvbnRleHQuYXBpLCBwcm9wcykpO1xuXG4gIGNvbnRleHQucmVnaXN0ZXJNaWdyYXRpb24ob2xkID0+IG1pZ3JhdGUxMDMoY29udGV4dC5hcGksIG9sZCkpO1xuICBjb250ZXh0Lm9uY2UoKCkgPT4ge1xuICAgIGNvbnRleHQuYXBpLmV2ZW50cy5vbignZGlkLWluc3RhbGwtbW9kJywgYXN5bmMgKGdhbWVJZCwgYXJjaGl2ZUlkLCBtb2RJZCkgPT4ge1xuICAgICAgaWYgKGdhbWVJZCAhPT0gTU9SUk9XSU5EX0lEKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgY29uc3Qgc3RhdGUgPSBjb250ZXh0LmFwaS5nZXRTdGF0ZSgpO1xuICAgICAgY29uc3QgaW5zdGFsbFBhdGggPSBzZWxlY3RvcnMuaW5zdGFsbFBhdGhGb3JHYW1lKHN0YXRlLCBNT1JST1dJTkRfSUQpO1xuICAgICAgY29uc3QgbW9kID0gdXRpbC5nZXRTYWZlKHN0YXRlLCBbJ3BlcnNpc3RlbnQnLCAnbW9kcycsIE1PUlJPV0lORF9JRCwgbW9kSWRdLCB1bmRlZmluZWQpO1xuICAgICAgaWYgKGluc3RhbGxQYXRoID09PSB1bmRlZmluZWQgfHwgbW9kID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgY29uc3QgbW9kUGF0aCA9IHBhdGguam9pbihpbnN0YWxsUGF0aCwgbW9kLmluc3RhbGxhdGlvblBhdGgpO1xuICAgICAgY29uc3QgcGx1Z2lucyA9IFtdO1xuICAgICAgdHJ5IHtcbiAgICAgICAgYXdhaXQgd2Fsayhtb2RQYXRoLCBlbnRyaWVzID0+IHtcbiAgICAgICAgICBmb3IgKGxldCBlbnRyeSBvZiBlbnRyaWVzKSB7XG4gICAgICAgICAgICBpZiAoWycuZXNwJywgJy5lc20nXS5pbmNsdWRlcyhwYXRoLmV4dG5hbWUoZW50cnkuZmlsZVBhdGgudG9Mb3dlckNhc2UoKSkpKSB7XG4gICAgICAgICAgICAgIHBsdWdpbnMucHVzaChwYXRoLmJhc2VuYW1lKGVudHJ5LmZpbGVQYXRoKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9LCB7IHJlY3Vyc2U6IHRydWUsIHNraXBMaW5rczogdHJ1ZSwgc2tpcEluYWNjZXNzaWJsZTogdHJ1ZSB9KTtcbiAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICBjb250ZXh0LmFwaS5zaG93RXJyb3JOb3RpZmljYXRpb24oJ0ZhaWxlZCB0byByZWFkIGxpc3Qgb2YgcGx1Z2lucycsIGVyciwgeyBhbGxvd1JlcG9ydDogZmFsc2UgfSk7XG4gICAgICB9XG4gICAgICBpZiAoIHBsdWdpbnMubGVuZ3RoID4gMCkge1xuICAgICAgICBjb250ZXh0LmFwaS5zdG9yZS5kaXNwYXRjaChhY3Rpb25zLnNldE1vZEF0dHJpYnV0ZShNT1JST1dJTkRfSUQsIG1vZC5pZCwgJ3BsdWdpbnMnLCBwbHVnaW5zKSk7XG4gICAgICB9XG4gICAgfSk7XG4gIH0pO1xuXG4gIHJldHVybiB0cnVlO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgZGVmYXVsdDogbWFpblxufTtcbiJdfQ==