const { isWindows } = require('vortex-api');
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
const path_1 = __importDefault(require("path"));
const vortex_api_1 = require("vortex-api");
const React = __importStar(require("react"));
const common_1 = require("./common");
const modTypes_1 = require("./modTypes");
const installers_1 = require("./installers");
const tests_1 = require("./tests");
const util_1 = require("./util");
class MasterChiefCollectionGame {
    constructor(context) {
        this.requiresLauncher = vortex_api_1.util.toBlue((gamePath, store) => this.checkLauncher(gamePath, store));
        this.context = context;
        this.id = common_1.GAME_ID;
        this.name = 'Halo: The Master Chief Collection';
        this.shortName = 'Halo: MCC';
        this.logo = 'gameart.jpg';
        this.api = context.api;
        this.getGameVersion = resolveGameVersion,
            this.requiredFiles = [
                this.executable(),
            ];
        this.supportedTools = [
            {
                id: 'haloassemblytool',
                name: 'Assembly',
                logo: 'assemblytool.png',
                executable: () => 'Assembly.exe',
                requiredFiles: [
                    'Assembly.exe',
                ],
                relative: true,
            },
        ];
        this.environment = {
            SteamAPPId: common_1.STEAM_ID,
        };
        this.details = {
            steamAppId: +common_1.STEAM_ID,
        };
        this.mergeMods = true;
    }
    queryModPath(gamePath) {
        return '.';
    }
    executable() {
        return 'mcclauncher.exe';
    }
    prepare(discovery) {
        return __awaiter(this, void 0, void 0, function* () {
            return Promise.resolve();
        });
    }
    queryPath() {
        return vortex_api_1.util.GameStoreHelper.findByAppId([common_1.STEAM_ID, common_1.MS_APPID])
            .then(game => game.gamePath);
    }
    checkLauncher(gamePath, store) {
        return __awaiter(this, void 0, void 0, function* () {
            if (store === 'xbox') {
                return Promise.resolve({
                    launcher: 'xbox',
                    addInfo: {
                        appId: common_1.MS_APPID,
                        parameters: [
                            { appExecName: 'HaloMCCShippingNoEAC' },
                        ],
                    }
                });
            }
            else if (store === 'steam') {
                return Promise.resolve({
                    launcher: 'steam',
                    addInfo: {
                        appId: common_1.STEAM_ID,
                        parameters: ['option2'],
                        launchType: 'gamestore',
                    }
                });
            }
            return Promise.resolve(undefined);
        });
    }
}
const resolveGameVersion = (discoveryPath) => __awaiter(void 0, void 0, void 0, function* () {
    const versionPath = path_1.default.join(discoveryPath, 'build_tag.txt');
    return vortex_api_1.fs.readFileAsync(versionPath, { encoding: 'utf8' })
        .then((res) => Promise.resolve(res.split('\r\n')[0].trim()));
});
module.exports = {
    default: (context) => {
        context.registerGame(new MasterChiefCollectionGame(context));
        context.registerModType(common_1.MODTYPE_PLUG_AND_PLAY, 15, (gameId) => gameId === common_1.GAME_ID, () => undefined, modTypes_1.testPlugAndPlayModType, {
            deploymentEssential: false,
            mergeMods: true,
            name: 'MCC Plug and Play mod',
            noConflicts: true,
        });
        context.registerInstaller('mcc-plug-and-play-installer', 15, installers_1.testPlugAndPlayInstaller, installers_1.installPlugAndPlay);
        context.registerInstaller('masterchiefmodconfiginstaller', 20, installers_1.testModConfigInstaller, installers_1.installModConfig);
        context.registerInstaller('masterchiefinstaller', 25, installers_1.testInstaller, installers_1.install);
        context.registerTest('mcc-ce-mp-test', 'gamemode-activated', vortex_api_1.util.toBlue(() => (0, tests_1.testCEMP)(context.api)));
        context.registerTableAttribute('mods', {
            id: 'gameType',
            name: 'Game(s)',
            description: 'Target Halo game(s) for this mod',
            icon: 'inspect',
            placement: 'table',
            customRenderer: (mod) => {
                const createImgDiv = (entry, idx) => {
                    return React.createElement('div', { className: 'halo-img-div', key: `${entry.internalId}-${idx}` }, React.createElement('img', { className: 'halogameimg', src: `file://${entry.img}` }), React.createElement('span', {}, entry.name));
                };
                const internalIds = vortex_api_1.util.getSafe(mod, ['attributes', 'haloGames'], []);
                const haloEntries = Object.keys(common_1.HALO_GAMES)
                    .filter(key => internalIds.includes(common_1.HALO_GAMES[key].internalId))
                    .map(key => common_1.HALO_GAMES[key]);
                return React.createElement(vortex_api_1.FlexLayout, { type: 'row' }, React.createElement(vortex_api_1.FlexLayout.Flex, { className: 'haloimglayout' }, haloEntries.map((entry, idx) => createImgDiv(entry, idx))));
            },
            calc: (mod) => vortex_api_1.util.getSafe(mod, ['attributes', 'haloGames'], undefined),
            filter: new vortex_api_1.OptionsFilter([].concat([{ value: vortex_api_1.OptionsFilter.EMPTY, label: '<None>' }], Object.keys(common_1.HALO_GAMES)
                .map(key => {
                return { value: common_1.HALO_GAMES[key].internalId, label: common_1.HALO_GAMES[key].name };
            })), true, false),
            isToggleable: true,
            edit: {},
            isSortable: false,
            isGroupable: (mod) => {
                const internalIds = vortex_api_1.util.getSafe(mod, ['attributes', 'haloGames'], []);
                const haloEntries = Object.keys(common_1.HALO_GAMES)
                    .filter(key => internalIds.includes(common_1.HALO_GAMES[key].internalId))
                    .map(key => common_1.HALO_GAMES[key]);
                if (haloEntries.length > 1) {
                    return 'Multiple';
                }
                else {
                    return (!!haloEntries && (haloEntries.length > 0))
                        ? haloEntries[0].name
                        : 'None';
                }
            },
            isDefaultVisible: true,
            condition: () => {
                const activeGameId = vortex_api_1.selectors.activeGameId(context.api.store.getState());
                return (activeGameId === common_1.GAME_ID);
            }
        });
        context.once(() => {
            context.api.setStylesheet('masterchiefstyle', path_1.default.join(__dirname, 'masterchief.scss'));
            context.api.onAsync('did-deploy', (profileId) => __awaiter(void 0, void 0, void 0, function* () { return (0, util_1.applyToManifest)(context.api, true); }));
            context.api.onAsync('did-purge', (profileId) => __awaiter(void 0, void 0, void 0, function* () { return (0, util_1.applyToManifest)(context.api, false); }));
        });
    }
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQ0EsZ0RBQXdCO0FBQ3hCLDJDQUFtRjtBQUVuRiw2Q0FBK0I7QUFFL0IscUNBQTBGO0FBRTFGLHlDQUFvRDtBQUNwRCw2Q0FBOEk7QUFDOUksbUNBQW1DO0FBQ25DLGlDQUF5QztBQUd6QyxNQUFNLHlCQUF5QjtJQWM3QixZQUFZLE9BQU87UUFpRFoscUJBQWdCLEdBQUcsaUJBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxRQUFnQixFQUFFLEtBQWEsRUFBRSxFQUFFLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxRQUFRLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQztRQWhEOUcsSUFBSSxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUM7UUFDdkIsSUFBSSxDQUFDLEVBQUUsR0FBRyxnQkFBTyxDQUFDO1FBQ2xCLElBQUksQ0FBQyxJQUFJLEdBQUcsbUNBQW1DLENBQUM7UUFDaEQsSUFBSSxDQUFDLFNBQVMsR0FBRyxXQUFXLENBQUM7UUFDN0IsSUFBSSxDQUFDLElBQUksR0FBRyxhQUFhLENBQUM7UUFDMUIsSUFBSSxDQUFDLEdBQUcsR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDO1FBQ3ZCLElBQUksQ0FBQyxjQUFjLEdBQUcsa0JBQWtCO1lBQ3hDLElBQUksQ0FBQyxhQUFhLEdBQUc7Z0JBQ25CLElBQUksQ0FBQyxVQUFVLEVBQUU7YUFDbEIsQ0FBQztRQUNGLElBQUksQ0FBQyxjQUFjLEdBQUc7WUFDcEI7Z0JBQ0UsRUFBRSxFQUFFLGtCQUFrQjtnQkFDdEIsSUFBSSxFQUFFLFVBQVU7Z0JBQ2hCLElBQUksRUFBRSxrQkFBa0I7Z0JBQ3hCLFVBQVUsRUFBRSxHQUFHLEVBQUUsQ0FBQyxjQUFjO2dCQUNoQyxhQUFhLEVBQUU7b0JBQ2IsY0FBYztpQkFDZjtnQkFDRCxRQUFR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QUFLLGdCQUFPLENBQUMsQ0FBQztZQUNwQyxDQUFDO1NBQ0YsQ0FBQyxDQUFDO1FBRUgsT0FBTyxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUU7WUFDaEIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxhQUFhLENBQUMsa0JBQWtCLEVBQUUsY0FBSSxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsa0JBQWtCLENBQUMsQ0FBQyxDQUFDO1lBQ3hGLE9BQU8sQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLFlBQVksRUFBRSxDQUFPLFNBQWlCLEVBQUUsRUFBRSxrREFBQyxPQUFBLElBQUEsc0JBQWUsRUFBQyxPQUFPLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyxDQUFBLEdBQUEsQ0FBQyxDQUFDO1lBQ25HLE9BQU8sQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLFdBQVcsRUFBRSxDQUFPLFNBQWlCLEVBQUUsRUFBRSxrREFBQyxPQUFBLElBQUEsc0JBQWUsRUFBQyxPQUFPLENBQUMsR0FBRyxFQUFFLEtBQUssQ0FBQyxDQUFBLEdBQUEsQ0FBQyxDQUFDO1FBQ3JHLENBQUMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztDQUNGLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiBlc2xpbnQtZGlzYWJsZSAqL1xuaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgeyBmcywgdHlwZXMsIEZsZXhMYXlvdXQsIE9wdGlvbnNGaWx0ZXIsIHNlbGVjdG9ycywgdXRpbCB9IGZyb20gJ3ZvcnRleC1hcGknO1xuXG5pbXBvcnQgKiBhcyBSZWFjdCBmcm9tICdyZWFjdCc7XG5cbmltcG9ydCB7IEdBTUVfSUQsIEhBTE9fR0FNRVMsIE1TX0FQUElELCBTVEVBTV9JRCwgTU9EVFlQRV9QTFVHX0FORF9QTEFZIH0gZnJvbSAnLi9jb21tb24nO1xuaW1wb3J0IHsgTGF1bmNoZXJDb25maWcgfSBmcm9tICcuL3R5cGVzJztcbmltcG9ydCB7IHRlc3RQbHVnQW5kUGxheU1vZFR5cGUgfSBmcm9tICcuL21vZFR5cGVzJztcbmltcG9ydCB7IGluc3RhbGxQbHVnQW5kUGxheSwgdGVzdE1vZENvbmZpZ0luc3RhbGxlciwgdGVzdFBsdWdBbmRQbGF5SW5zdGFsbGVyLCBpbnN0YWxsTW9kQ29uZmlnLCBpbnN0YWxsLCB0ZXN0SW5zdGFsbGVyIH0gZnJvbSAnLi9pbnN0YWxsZXJzJztcbmltcG9ydCB7IHRlc3RDRU1QIH0gZnJvbSAnLi90ZXN0cyc7XG5pbXBvcnQgeyBhcHBseVRvTWFuaWZlc3QgfSBmcm9tICcuL3V0aWwnO1xuXG4vLyBNYXN0ZXIgY2hlZiBjb2xsZWN0aW9uXG5jbGFzcyBNYXN0ZXJDaGllZkNvbGxlY3Rpb25HYW1lIGltcGxlbWVudHMgdHlwZXMuSUdhbWUge1xuICBwdWJsaWMgY29udGV4dDogdHlwZXMuSUV4dGVuc2lvbkNvbnRleHQ7XG4gIHB1YmxpYyBpZDogc3RyaW5nO1xuICBwdWJsaWMgbmFtZTogc3RyaW5nO1xuICBwdWJsaWMgc2hvcnROYW1lOiBzdHJpbmc7XG4gIHB1YmxpYyBsb2dvOiBzdHJpbmc7XG4gIHB1YmxpYyBhcGk6IHR5cGVzLklFeHRlbnNpb25BcGk7XG4gIHB1YmxpYyBnZXRHYW1lVmVyc2lvbjogKGRpc2NvdmVyeVBhdGg6IHN0cmluZykgPT4gUHJvbWlzZTxzdHJpbmc+O1xuICBwdWJsaWMgcmVxdWlyZWRGaWxlczogc3RyaW5nW107XG4gIHB1YmxpYyBzdXBwb3J0ZWRUb29sczogYW55W107XG4gIHB1YmxpYyBlbnZpcm9ubWVudDogYW55O1xuICBwdWJsaWMgZGV0YWlsczogYW55O1xuICBwdWJsaWMgbWVyZ2VNb2RzOiBib29sZWFuO1xuXG4gIGNvbnN0cnVjdG9yKGNvbnRleHQpIHtcbiAgICB0aGlzLmNvbnRleHQgPSBjb250ZXh0O1xuICAgIHRoaXMuaWQgPSBHQU1FX0lEO1xuICAgIHRoaXMubmFtZSA9ICdIYWxvOiBUaGUgTWFzdGVyIENoaWVmIENvbGxlY3Rpb24nO1xuICAgIHRoaXMuc2hvcnROYW1lID0gJ0hhbG86IE1DQyc7XG4gICAgdGhpcy5sb2dvID0gJ2dhbWVhcnQuanBnJztcbiAgICB0aGlzLmFwaSA9IGNvbnRleHQuYXBpO1xuICAgIHRoaXMuZ2V0R2FtZVZlcnNpb24gPSByZXNvbHZlR2FtZVZlcnNpb24sXG4gICAgdGhpcy5yZXF1aXJlZEZpbGVzID0gW1xuICAgICAgdGhpcy5leGVjdXRhYmxlKCksXG4gICAgXTtcbiAgICB0aGlzLnN1cHBvcnRlZFRvb2xzID0gW1xuICAgICAge1xuICAgICAgICBpZDogJ2hhbG9hc3NlbWJseXRvb2wnLFxuICAgICAgICBuYW1lOiAnQXNzZW1ibHknLFxuICAgICAgICBsb2dvOiAnYXNzZW1ibHl0b29sLnBuZycsXG4gICAgICAgIGV4ZWN1dGFibGU6ICgpID0+ICdBc3NlbWJseS5leGUnLFxuICAgICAgICByZXF1aXJlZEZpbGVzOiBbXG4gICAgICAgICAgJ0Fzc2VtYmx5LmV4ZScsXG4gICAgICAgIF0sXG4gICAgICAgIHJlbGF0aXZlOiB0cnVlLFxuICAgICAgfSxcbiAgICBdO1xuICAgIHRoaXMuZW52aXJvbm1lbnQgPSB7XG4gICAgICBTdGVhbUFQUElkOiBTVEVBTV9JRCxcbiAgICB9O1xuICAgIHRoaXMuZGV0YWlscyA9IHtcbiAgICAgIHN0ZWFtQXBwSWQ6ICtTVEVBTV9JRCxcbiAgICB9O1xuICAgIHRoaXMubWVyZ2VNb2RzID0gdHJ1ZTtcbiAgfVxuXG4gIHF1ZXJ5TW9kUGF0aChnYW1lUGF0aCkge1xuICAgIHJldHVybiAnLic7XG4gIH1cblxuICBleGVjdXRhYmxlKCkge1xuICAgIHJldHVybiAnbWNjbGF1bmNoZXIuZXhlJztcbiAgfVxuXG4gIHB1YmxpYyBhc3luYyBwcmVwYXJlKGRpc2NvdmVyeTogdHlwZXMuSURpc2NvdmVyeVJlc3VsdCk6IFByb21pc2U8dm9pZD4ge1xuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcbiAgfVxuXG4gIHB1YmxpYyBxdWVyeVBhdGgoKSB7XG4gICAgcmV0dXJuIHV0aWwuR2FtZVN0b3JlSGVscGVyLmZpbmRCeUFwcElkKFtTVEVBTV9JRCwgTVNfQVBQSURdKVxuICAgICAgLnRoZW4oZ2FtZSA9PiBnYW1lLmdhbWVQYXRoKTtcbiAgfVxuXG4gIHB1YmxpYyByZXF1aXJlc0xhdW5jaGVyID0gdXRpbC50b0JsdWUoKGdhbWVQYXRoOiBzdHJpbmcsIHN0b3JlOiBzdHJpbmcpID0+IHRoaXMuY2hlY2tMYXVuY2hlcihnYW1lUGF0aCwgc3RvcmUpKTtcbiAgcHVibGljIGFzeW5jIGNoZWNrTGF1bmNoZXIoZ2FtZVBhdGg6IHN0cmluZywgc3RvcmU6IHN0cmluZyk6IExhdW5jaGVyQ29uZmlnIHwgdW5kZWZpbmVkIHtcbiAgICBpZiAoc3RvcmUgPT09ICd4Ym94Jykge1xuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh7XG4gICAgICAgIGxhdW5jaGVyOiAneGJveCcsXG4gICAgICAgIGFkZEluZm86IHtcbiAgICAgICAgICBhcHBJZDogTVNfQVBQSUQsXG4gICAgICAgICAgcGFyYW1ldGVyczogW1xuICAgICAgICAgICAgeyBhcHBFeGVjTmFtZTogJ0hhbG9NQ0NTaGlwcGluZ05vRUFDJyB9LFxuICAgICAgICAgIF0sXG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH0gZWxzZSBpZiAoc3RvcmUgPT09ICdzdGVhbScpIHtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoe1xuICAgICAgICBsYXVuY2hlcjogJ3N0ZWFtJyxcbiAgICAgICAgYWRkSW5mbzoge1xuICAgICAgICAgIGFwcElkOiBTVEVBTV9JRCxcbiAgICAgICAgICBwYXJhbWV0ZXJzOiBbJ29wdGlvbjInXSxcbiAgICAgICAgICBsYXVuY2hUeXBlOiAnZ2FtZXN0b3JlJyxcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh1bmRlZmluZWQpO1xuICB9XG59XG5cbi8vIGZ1bmN0aW9uIGdldFhib3hJZChpbnRlcm5hbElkLCBmaWxlUGF0aCwgZW5jb2RpbmcpIHtcbi8vICAgLy8gVGhpcyBmdW5jdGlvbiB3aWxsIHJldHVybiB0aGUgeGJveCBpZCBvZiB0aGUgbGFzdCBwbGF5ZXJcbi8vICAgLy8gIHdobyByYW4gdGhlIGdhbWUuIFRoaXMgY2FuIHBvdGVudGlhbGx5IGJlIHVzZWQgdG8gbW9kIHRoZSBnYW1lXG4vLyAgIC8vICBvbmx5IGZvciBzcGVjaWZpYyB4Ym94IGlkcyB3aGlsZSBsZWF2aW5nIG90aGVycyBpbiBhbiB1bnRhbXBlcmVkIHN0YXRlLiAoV0lQKVxuLy8gICByZXR1cm4gZnMucmVhZEZpbGVBc3luYyhmaWxlUGF0aCwgeyBlbmNvZGluZyB9KVxuLy8gICAgIC50aGVuKGZpbGVEYXRhID0+IHtcbi8vICAgICAgIGxldCB4bWxEb2M7XG4vLyAgICAgICB0cnkge1xuLy8gICAgICAgICB4bWxEb2MgPSBwYXJzZVhtbFN0cmluZyhmaWxlRGF0YSk7XG4vLyAgICAgICB9IGNhdGNoIChlcnIpIHtcbi8vICAgICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KGVycik7XG4vLyAgICAgICB9XG5cbi8vICAgICAgIGNvbnN0IGdlbmVyYWxEYXRhID0geG1sRG9jLmZpbmQoJy8vQ2FtcGFpZ25DYXJuYWdlUmVwb3J0L0dlbmVyYWxEYXRhJyk7XG4vLyAgICAgICBpZiAoZ2VuZXJhbERhdGFbMF0uYXR0cignR2FtZUlkJykudmFsdWUoKSA9PT0gaW50ZXJuYWxJZCkge1xuLy8gICAgICAgICBjb25zdCBwbGF5ZXJzID0geG1sRG9jLmZpbmQoJy8vQ2FtcGFpZ25DYXJuYWdlUmVwb3J0L1BsYXllcnMvUGxheWVySW5mbycpO1xuLy8gICAgICAgICBjb25zdCBtYWluUGxheWVyID0gcGxheWVycy5maW5kKHBsYXllciA9PiBwbGF5ZXIuYXR0cignaXNHdWVzdCcpLnZhbHVlKCkgPT09ICdmYWxzZScpO1xuLy8gICAgICAgICBjb25zdCB4Ym94SWQgPSBtYWluUGxheWVyLmF0dHIoJ21YYm94VXNlcklkJykudmFsdWUoKTtcbi8vICAgICAgICAgLy8gVGhlIHVzZXJJZCBpcyBwcmVmaXhlZCB3aXRoIFwiMHhcIiB3aGljaCBpcyBub3QgbmVlZGVkLlxuLy8gICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHhib3hJZC5zdWJzdHJpbmcoMikpO1xuLy8gICAgICAgfSBlbHNlIHtcbi8vICAgICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyB1dGlsLkRhdGFJbnZhbGlkKCdXcm9uZyBpbnRlcm5hbCBnYW1lSWQnKSk7XG4vLyAgICAgICB9XG4vLyAgICAgfSk7XG4vLyB9XG5cbmNvbnN0IHJlc29sdmVHYW1lVmVyc2lvbiA9IGFzeW5jIChkaXNjb3ZlcnlQYXRoOiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4gPT4ge1xuICBjb25zdCB2ZXJzaW9uUGF0aCA9IHBhdGguam9pbihkaXNjb3ZlcnlQYXRoLCAnYnVpbGRfdGFnLnR4dCcpO1xuICByZXR1cm4gZnMucmVhZEZpbGVBc3luYyh2ZXJzaW9uUGF0aCwgeyBlbmNvZGluZzogJ3V0ZjgnIH0pXG4gICAgLnRoZW4oKHJlcykgPT4gUHJvbWlzZS5yZXNvbHZlKHJlcy5zcGxpdCgnXFxyXFxuJylbMF0udHJpbSgpKSk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBkZWZhdWx0OiAoY29udGV4dDogdHlwZXMuSUV4dGVuc2lvbkNvbnRleHQpID0+IHtcbiAgICBjb250ZXh0LnJlZ2lzdGVyR2FtZShuZXcgTWFzdGVyQ2hpZWZDb2xsZWN0aW9uR2FtZShjb250ZXh0KSk7XG5cbiAgICAvLyBsZXQgY29sbGF0b3I7XG4gICAgLy8gY29uc3QgZ2V0Q29sbGF0b3IgPSAobG9jYWxlKSA9PiB7XG4gICAgLy8gICBpZiAoKGNvbGxhdG9yID09PSB1bmRlZmluZWQpIHx8IChsb2NhbGUgIT09IGxhbmcpKSB7XG4gICAgLy8gICAgIGxhbmcgPSBsb2NhbGU7XG4gICAgLy8gICAgIGNvbGxhdG9yID0gbmV3IEludGwuQ29sbGF0b3IobG9jYWxlLCB7IHNlbnNpdGl2aXR5OiAnYmFzZScgfSk7XG4gICAgLy8gICB9XG4gICAgLy8gICByZXR1cm4gY29sbGF0b3I7XG4gICAgLy8gfTtcblxuICAgIGNvbnRleHQucmVnaXN0ZXJNb2RUeXBlKE1PRFRZUEVfUExVR19BTkRfUExBWSwgMTUsXG4gICAgICAoZ2FtZUlkOiBzdHJpbmcpID0+IGdhbWVJZCA9PT0gR0FNRV9JRCwgKCkgPT4gdW5kZWZpbmVkLCB0ZXN0UGx1Z0FuZFBsYXlNb2RUeXBlIGFzIGFueSwge1xuICAgICAgZGVwbG95bWVudEVzc2VudGlhbDogZmFsc2UsXG4gICAgICBtZXJnZU1vZHM6IHRydWUsXG4gICAgICBuYW1lOiAnTUNDIFBsdWcgYW5kIFBsYXkgbW9kJyxcbiAgICAgIG5vQ29uZmxpY3RzOiB0cnVlLFxuICAgIH0pXG5cbiAgICBjb250ZXh0LnJlZ2lzdGVySW5zdGFsbGVyKCdtY2MtcGx1Zy1hbmQtcGxheS1pbnN0YWxsZXInLFxuICAgICAgMTUsIHRlc3RQbHVnQW5kUGxheUluc3RhbGxlciBhcyBhbnksIGluc3RhbGxQbHVnQW5kUGxheSBhcyBhbnkpO1xuXG4gICAgY29udGV4dC5yZWdpc3Rlckluc3RhbGxlcignbWFzdGVyY2hpZWZtb2Rjb25maWdpbnN0YWxsZXInLFxuICAgICAgMjAsIHRlc3RNb2RDb25maWdJbnN0YWxsZXIgYXMgYW55LCBpbnN0YWxsTW9kQ29uZmlnIGFzIGFueSk7XG5cbiAgICBjb250ZXh0LnJlZ2lzdGVySW5zdGFsbGVyKCdtYXN0ZXJjaGllZmluc3RhbGxlcicsXG4gICAgICAyNSwgdGVzdEluc3RhbGxlciBhcyBhbnksIGluc3RhbGwgYXMgYW55KTtcblxuICAgIGNvbnRleHQucmVnaXN0ZXJUZXN0KCdtY2MtY2UtbXAtdGVzdCcsICdnYW1lbW9kZS1hY3RpdmF0ZWQnLCB1dGlsLnRvQmx1ZSgoKSA9PiB0ZXN0Q0VNUChjb250ZXh0LmFwaSkpKTtcblxuICAgIGNvbnRleHQucmVnaXN0ZXJUYWJsZUF0dHJpYnV0ZSgnbW9kcycsIHtcbiAgICAgIGlkOiAnZ2FtZVR5cGUnLFxuICAgICAgbmFtZTogJ0dhbWUocyknLFxuICAgICAgZGVzY3JpcHRpb246ICdUYXJnZXQgSGFsbyBnYW1lKHMpIGZvciB0aGlzIG1vZCcsXG4gICAgICBpY29uOiAnaW5zcGVjdCcsXG4gICAgICBwbGFjZW1lbnQ6ICd0YWJsZScsXG4gICAgICBjdXN0b21SZW5kZXJlcjogKG1vZCkgPT4ge1xuICAgICAgICBjb25zdCBjcmVhdGVJbWdEaXYgPSAoZW50cnksIGlkeCkgPT4ge1xuICAgICAgICAgIHJldHVybiBSZWFjdC5jcmVhdGVFbGVtZW50KCdkaXYnLCB7IGNsYXNzTmFtZTogJ2hhbG8taW1nLWRpdicsIGtleTogYCR7ZW50cnkuaW50ZXJuYWxJZH0tJHtpZHh9YCB9LCBcbiAgICAgICAgICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoJ2ltZycsIHsgY2xhc3NOYW1lOiAnaGFsb2dhbWVpbWcnLCBzcmM6IGBmaWxlOi8vJHtlbnRyeS5pbWd9YCB9KSxcbiAgICAgICAgICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nLCB7fSwgZW50cnkubmFtZSkpXG4gICAgICAgIH07XG5cbiAgICAgICAgY29uc3QgaW50ZXJuYWxJZHMgPSB1dGlsLmdldFNhZmUobW9kLCBbJ2F0dHJpYnV0ZXMnLCAnaGFsb0dhbWVzJ10sIFtdKTtcbiAgICAgICAgY29uc3QgaGFsb0VudHJpZXMgPSBPYmplY3Qua2V5cyhIQUxPX0dBTUVTKVxuICAgICAgICAgIC5maWx0ZXIoa2V5ID0+IGludGVybmFsSWRzLmluY2x1ZGVzKEhBTE9fR0FNRVNba2V5XS5pbnRlcm5hbElkKSlcbiAgICAgICAgICAubWFwKGtleSA9PiBIQUxPX0dBTUVTW2tleV0pO1xuXG4gICAgICAgIHJldHVybiBSZWFjdC5jcmVhdGVFbGVtZW50KEZsZXhMYXlvdXQsIHsgdHlwZTogJ3JvdycgfSwgXG4gICAgICAgICAgUmVhY3QuY3JlYXRlRWxlbWVudChGbGV4TGF5b3V0LkZsZXgsIHsgY2xhc3NOYW1lOiAnaGFsb2ltZ2xheW91dCcgfSwgaGFsb0VudHJpZXMubWFwKChlbnRyeSwgaWR4KSA9PiBjcmVhdGVJbWdEaXYoZW50cnksIGlkeCkpKSk7XG4gICAgICB9LFxuICAgICAgY2FsYzogKG1vZCkgPT4gdXRpbC5nZXRTYWZlKG1vZCwgWydhdHRyaWJ1dGVzJywgJ2hhbG9HYW1lcyddLCB1bmRlZmluZWQpLFxuICAgICAgZmlsdGVyOiBuZXcgT3B0aW9uc0ZpbHRlcihcbiAgICAgICAgW10uY29uY2F0KFt7IHZhbHVlOiBPcHRpb25zRmlsdGVyLkVNUFRZLCBsYWJlbDogJzxOb25lPicgfV0sXG4gICAgICAgIE9iamVjdC5rZXlzKEhBTE9fR0FNRVMpXG4gICAgICAgICAgLm1hcChrZXkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIHsgdmFsdWU6IEhBTE9fR0FNRVNba2V5XS5pbnRlcm5hbElkLCBsYWJlbDogSEFMT19HQU1FU1trZXldLm5hbWUgfTtcbiAgICAgICAgICB9KSlcbiAgICAgICAgLCB0cnVlLCBmYWxzZSksXG4gICAgICBpc1RvZ2dsZWFibGU6IHRydWUsXG4gICAgICBlZGl0OiB7fSxcbiAgICAgIGlzU29ydGFibGU6IGZhbHNlLFxuICAgICAgaXNHcm91cGFibGU6IChtb2QpID0+IHtcbiAgICAgICAgY29uc3QgaW50ZXJuYWxJZHMgPSB1dGlsLmdldFNhZmUobW9kLCBbJ2F0dHJpYnV0ZXMnLCAnaGFsb0dhbWVzJ10sIFtdKTtcbiAgICAgICAgY29uc3QgaGFsb0VudHJpZXMgPSBPYmplY3Qua2V5cyhIQUxPX0dBTUVTKVxuICAgICAgICAgIC5maWx0ZXIoa2V5ID0+IGludGVybmFsSWRzLmluY2x1ZGVzKEhBTE9fR0FNRVNba2V5XS5pbnRlcm5hbElkKSlcbiAgICAgICAgICAubWFwKGtleSA9PiBIQUxPX0dBTUVTW2tleV0pO1xuXG4gICAgICAgIGlmIChoYWxvRW50cmllcy5sZW5ndGggPiAxKSB7XG4gICAgICAgICAgcmV0dXJuICdNdWx0aXBsZSc7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuICghIWhhbG9FbnRyaWVzICYmIChoYWxvRW50cmllcy5sZW5ndGggPiAwKSlcbiAgICAgICAgICAgID8gaGFsb0VudHJpZXNbMF0ubmFtZVxuICAgICAgICAgICAgOiAnTm9uZSc7XG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICBpc0RlZmF1bHRWaXNpYmxlOiB0cnVlLFxuICAgICAgLy9zb3J0RnVuYzogKGxocywgcmhzKSA9PiBnZXRDb2xsYXRvcihsb2NhbGUpLmNvbXBhcmUobGhzLCByaHMpLFxuICAgICAgY29uZGl0aW9uOiAoKSA9PiB7XG4gICAgICAgIGNvbnN0IGFjdGl2ZUdhbWVJZCA9IHNlbGVjdG9ycy5hY3RpdmVHYW1lSWQoY29udGV4dC5hcGkuc3RvcmUuZ2V0U3RhdGUoKSk7XG4gICAgICAgIHJldHVybiAoYWN0aXZlR2FtZUlkID09PSBHQU1FX0lEKTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIGNvbnRleHQub25jZSgoKSA9PiB7XG4gICAgICBjb250ZXh0LmFwaS5zZXRTdHlsZXNoZWV0KCdtYXN0ZXJjaGllZnN0eWxlJywgcGF0aC5qb2luKF9fZGlybmFtZSwgJ21hc3RlcmNoaWVmLnNjc3MnKSk7XG4gICAgICBjb250ZXh0LmFwaS5vbkFzeW5jKCdkaWQtZGVwbG95JywgYXN5bmMgKHByb2ZpbGVJZDogc3RyaW5nKSA9PiBhcHBseVRvTWFuaWZlc3QoY29udGV4dC5hcGksIHRydWUpKTtcbiAgICAgIGNvbnRleHQuYXBpLm9uQXN5bmMoJ2RpZC1wdXJnZScsIGFzeW5jIChwcm9maWxlSWQ6IHN0cmluZykgPT4gYXBwbHlUb01hbmlmZXN0KGNvbnRleHQuYXBpLCBmYWxzZSkpO1xuICAgIH0pO1xuICB9XG59O1xuIl19