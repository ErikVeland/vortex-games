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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUNBLGdEQUF3QjtBQUN4QiwyQ0FBbUY7QUFFbkYsNkNBQStCO0FBRS9CLHFDQUEwRjtBQUUxRix5Q0FBb0Q7QUFDcEQsNkNBQThJO0FBQzlJLG1DQUFtQztBQUNuQyxpQ0FBeUM7QUFHekMsTUFBTSx5QkFBeUI7SUFjN0IsWUFBWSxPQUFPO1FBaURaLHFCQUFnQixHQUFHLGlCQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsUUFBZ0IsRUFBRSxLQUFhLEVBQUUsRUFBRSxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsUUFBUSxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUM7UUFoRDlHLElBQUksQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFDO1FBQ3ZCLElBQUksQ0FBQyxFQUFFLEdBQUcsZ0JBQU8sQ0FBQztRQUNsQixJQUFJLENBQUMsSUFBSSxHQUFHLG1DQUFtQyxDQUFDO1FBQ2hELElBQUksQ0FBQyxTQUFTLEdBQUcsV0FBVyxDQUFDO1FBQzdCLElBQUksQ0FBQyxJQUFJLEdBQUcsYUFBYSxDQUFDO1FBQzFCLElBQUksQ0FBQyxHQUFHLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQztRQUN2QixJQUFJLENBQUMsY0FBYyxHQUFHLGtCQUFrQjtZQUN4QyxJQUFJLENBQUMsYUFBYSxHQUFHO2dCQUNuQixJQUFJLENBQUMsVUFBVSxFQUFFO2FBQ2xCLENBQUM7UUFDRixJQUFJLENBQUMsY0FBYyxHQUFHO1lBQ3BCO2dCQUNFLEVBQUUsRUFBRSxrQkFBa0I7Z0JBQ3RCLElBQUksRUFBRSxVQUFVO2dCQUNoQixJQUFJLEVBQUUsa0JBQWtCO2dCQUN4QixVQUFVLEVBQUUsR0FBRyxFQUFFLENBQUMsY0FBYztnQkFDaEMsYUFBYSxFQUFFO29CQUNiLGNBQWM7aUJBQ2Y7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SyxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUM7Z0JBQzFFLE9BQU8sQ0FBQyxZQUFZLEtBQUssZ0JBQU8sQ0FBQyxDQUFDO1lBQ3BDLENBQUM7U0FDRixDQUFDLENBQUM7UUFFSCxPQUFPLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRTtZQUNoQixPQUFPLENBQUMsR0FBRyxDQUFDLGFBQWEsQ0FBQyxrQkFBa0IsRUFBRSxjQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxrQkFBa0IsQ0FBQyxDQUFDLENBQUM7WUFDeEYsT0FBTyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsWUFBWSxFQUFFLENBQU8sU0FBaUIsRUFBRSxFQUFFLGtEQUFDLE9BQUEsSUFBQSxzQkFBZSxFQUFDLE9BQU8sQ0FBQyxHQUFHLEVBQUUsSUFBSSxDQUFDLENBQUEsR0FBQSxDQUFDLENBQUM7WUFDbkcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsV0FBVyxFQUFFLENBQU8sU0FBaUIsRUFBRSxFQUFFLGtEQUFDLE9BQUEsSUFBQSxzQkFBZSxFQUFDLE9BQU8sQ0FBQyxHQUFHLEVBQUUsS0FBSyxDQUFDLENBQUEsR0FBQSxDQUFDLENBQUM7UUFDckcsQ0FBQyxDQUFDLENBQUM7SUFDTCxDQUFDO0NBQ0YsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qIGVzbGludC1kaXNhYmxlICovXG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcbmltcG9ydCB7IGZzLCB0eXBlcywgRmxleExheW91dCwgT3B0aW9uc0ZpbHRlciwgc2VsZWN0b3JzLCB1dGlsIH0gZnJvbSAndm9ydGV4LWFwaSc7XG5cbmltcG9ydCAqIGFzIFJlYWN0IGZyb20gJ3JlYWN0JztcblxuaW1wb3J0IHsgR0FNRV9JRCwgSEFMT19HQU1FUywgTVNfQVBQSUQsIFNURUFNX0lELCBNT0RUWVBFX1BMVUdfQU5EX1BMQVkgfSBmcm9tICcuL2NvbW1vbic7XG5pbXBvcnQgeyBMYXVuY2hlckNvbmZpZyB9IGZyb20gJy4vdHlwZXMnO1xuaW1wb3J0IHsgdGVzdFBsdWdBbmRQbGF5TW9kVHlwZSB9IGZyb20gJy4vbW9kVHlwZXMnO1xuaW1wb3J0IHsgaW5zdGFsbFBsdWdBbmRQbGF5LCB0ZXN0TW9kQ29uZmlnSW5zdGFsbGVyLCB0ZXN0UGx1Z0FuZFBsYXlJbnN0YWxsZXIsIGluc3RhbGxNb2RDb25maWcsIGluc3RhbGwsIHRlc3RJbnN0YWxsZXIgfSBmcm9tICcuL2luc3RhbGxlcnMnO1xuaW1wb3J0IHsgdGVzdENFTVAgfSBmcm9tICcuL3Rlc3RzJztcbmltcG9ydCB7IGFwcGx5VG9NYW5pZmVzdCB9IGZyb20gJy4vdXRpbCc7XG5cbi8vIE1hc3RlciBjaGVmIGNvbGxlY3Rpb25cbmNsYXNzIE1hc3RlckNoaWVmQ29sbGVjdGlvbkdhbWUgaW1wbGVtZW50cyB0eXBlcy5JR2FtZSB7XG4gIHB1YmxpYyBjb250ZXh0OiB0eXBlcy5JRXh0ZW5zaW9uQ29udGV4dDtcbiAgcHVibGljIGlkOiBzdHJpbmc7XG4gIHB1YmxpYyBuYW1lOiBzdHJpbmc7XG4gIHB1YmxpYyBzaG9ydE5hbWU6IHN0cmluZztcbiAgcHVibGljIGxvZ286IHN0cmluZztcbiAgcHVibGljIGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaTtcbiAgcHVibGljIGdldEdhbWVWZXJzaW9uOiAoZGlzY292ZXJ5UGF0aDogc3RyaW5nKSA9PiBQcm9taXNlPHN0cmluZz47XG4gIHB1YmxpYyByZXF1aXJlZEZpbGVzOiBzdHJpbmdbXTtcbiAgcHVibGljIHN1cHBvcnRlZFRvb2xzOiBhbnlbXTtcbiAgcHVibGljIGVudmlyb25tZW50OiBhbnk7XG4gIHB1YmxpYyBkZXRhaWxzOiBhbnk7XG4gIHB1YmxpYyBtZXJnZU1vZHM6IGJvb2xlYW47XG5cbiAgY29uc3RydWN0b3IoY29udGV4dCkge1xuICAgIHRoaXMuY29udGV4dCA9IGNvbnRleHQ7XG4gICAgdGhpcy5pZCA9IEdBTUVfSUQ7XG4gICAgdGhpcy5uYW1lID0gJ0hhbG86IFRoZSBNYXN0ZXIgQ2hpZWYgQ29sbGVjdGlvbic7XG4gICAgdGhpcy5zaG9ydE5hbWUgPSAnSGFsbzogTUNDJztcbiAgICB0aGlzLmxvZ28gPSAnZ2FtZWFydC5qcGcnO1xuICAgIHRoaXMuYXBpID0gY29udGV4dC5hcGk7XG4gICAgdGhpcy5nZXRHYW1lVmVyc2lvbiA9IHJlc29sdmVHYW1lVmVyc2lvbixcbiAgICB0aGlzLnJlcXVpcmVkRmlsZXMgPSBbXG4gICAgICB0aGlzLmV4ZWN1dGFibGUoKSxcbiAgICBdO1xuICAgIHRoaXMuc3VwcG9ydGVkVG9vbHMgPSBbXG4gICAgICB7XG4gICAgICAgIGlkOiAnaGFsb2Fzc2VtYmx5dG9vbCcsXG4gICAgICAgIG5hbWU6ICdBc3NlbWJseScsXG4gICAgICAgIGxvZ286ICdhc3NlbWJseXRvb2wucG5nJyxcbiAgICAgICAgZXhlY3V0YWJsZTogKCkgPT4gJ0Fzc2VtYmx5LmV4ZScsXG4gICAgICAgIHJlcXVpcmVkRmlsZXM6IFtcbiAgICAgICAgICAnQXNzZW1ibHkuZXhlJyxcbiAgICAgICAgXSxcbiAgICAgICAgcmVsYXRpdmU6IHRydWUsXG4gICAgICB9LFxuICAgIF07XG4gICAgdGhpcy5lbnZpcm9ubWVudCA9IHtcbiAgICAgIFN0ZWFtQVBQSWQ6IFNURUFNX0lELFxuICAgIH07XG4gICAgdGhpcy5kZXRhaWxzID0ge1xuICAgICAgc3RlYW1BcHBJZDogK1NURUFNX0lELFxuICAgIH07XG4gICAgdGhpcy5tZXJnZU1vZHMgPSB0cnVlO1xuICB9XG5cbiAgcXVlcnlNb2RQYXRoKGdhbWVQYXRoKSB7XG4gICAgcmV0dXJuICcuJztcbiAgfVxuXG4gIGV4ZWN1dGFibGUoKSB7XG4gICAgcmV0dXJuICdtY2NsYXVuY2hlci5leGUnO1xuICB9XG5cbiAgcHVibGljIGFzeW5jIHByZXBhcmUoZGlzY292ZXJ5OiB0eXBlcy5JRGlzY292ZXJ5UmVzdWx0KTogUHJvbWlzZTx2b2lkPiB7XG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xuICB9XG5cbiAgcHVibGljIHF1ZXJ5UGF0aCgpIHtcbiAgICByZXR1cm4gdXRpbC5HYW1lU3RvcmVIZWxwZXIuZmluZEJ5QXBwSWQoW1NURUFNX0lELCBNU19BUFBJRF0pXG4gICAgICAudGhlbihnYW1lID0+IGdhbWUuZ2FtZVBhdGgpO1xuICB9XG5cbiAgcHVibGljIHJlcXVpcmVzTGF1bmNoZXIgPSB1dGlsLnRvQmx1ZSgoZ2FtZVBhdGg6IHN0cmluZywgc3RvcmU6IHN0cmluZykgPT4gdGhpcy5jaGVja0xhdW5jaGVyKGdhbWVQYXRoLCBzdG9yZSkpO1xuICBwdWJsaWMgYXN5bmMgY2hlY2tMYXVuY2hlcihnYW1lUGF0aDogc3RyaW5nLCBzdG9yZTogc3RyaW5nKTogTGF1bmNoZXJDb25maWcgfCB1bmRlZmluZWQge1xuICAgIGlmIChzdG9yZSA9PT0gJ3hib3gnKSB7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHtcbiAgICAgICAgbGF1bmNoZXI6ICd4Ym94JyxcbiAgICAgICAgYWRkSW5mbzoge1xuICAgICAgICAgIGFwcElkOiBNU19BUFBJRCxcbiAgICAgICAgICBwYXJhbWV0ZXJzOiBbXG4gICAgICAgICAgICB7IGFwcEV4ZWNOYW1lOiAnSGFsb01DQ1NoaXBwaW5nTm9FQUMnIH0sXG4gICAgICAgICAgXSxcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSBlbHNlIGlmIChzdG9yZSA9PT0gJ3N0ZWFtJykge1xuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh7XG4gICAgICAgIGxhdW5jaGVyOiAnc3RlYW0nLFxuICAgICAgICBhZGRJbmZvOiB7XG4gICAgICAgICAgYXBwSWQ6IFNURUFNX0lELFxuICAgICAgICAgIHBhcmFtZXRlcnM6IFsnb3B0aW9uMiddLFxuICAgICAgICAgIGxhdW5jaFR5cGU6ICdnYW1lc3RvcmUnLFxuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHVuZGVmaW5lZCk7XG4gIH1cbn1cblxuLy8gZnVuY3Rpb24gZ2V0WGJveElkKGludGVybmFsSWQsIGZpbGVQYXRoLCBlbmNvZGluZykge1xuLy8gICAvLyBUaGlzIGZ1bmN0aW9uIHdpbGwgcmV0dXJuIHRoZSB4Ym94IGlkIG9mIHRoZSBsYXN0IHBsYXllclxuLy8gICAvLyAgd2hvIHJhbiB0aGUgZ2FtZS4gVGhpcyBjYW4gcG90ZW50aWFsbHkgYmUgdXNlZCB0byBtb2QgdGhlIGdhbWVcbi8vICAgLy8gIG9ubHkgZm9yIHNwZWNpZmljIHhib3ggaWRzIHdoaWxlIGxlYXZpbmcgb3RoZXJzIGluIGFuIHVudGFtcGVyZWQgc3RhdGUuIChXSVApXG4vLyAgIHJldHVybiBmcy5yZWFkRmlsZUFzeW5jKGZpbGVQYXRoLCB7IGVuY29kaW5nIH0pXG4vLyAgICAgLnRoZW4oZmlsZURhdGEgPT4ge1xuLy8gICAgICAgbGV0IHhtbERvYztcbi8vICAgICAgIHRyeSB7XG4vLyAgICAgICAgIHhtbERvYyA9IHBhcnNlWG1sU3RyaW5nKGZpbGVEYXRhKTtcbi8vICAgICAgIH0gY2F0Y2ggKGVycikge1xuLy8gICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoZXJyKTtcbi8vICAgICAgIH1cblxuLy8gICAgICAgY29uc3QgZ2VuZXJhbERhdGEgPSB4bWxEb2MuZmluZCgnLy9DYW1wYWlnbkNhcm5hZ2VSZXBvcnQvR2VuZXJhbERhdGEnKTtcbi8vICAgICAgIGlmIChnZW5lcmFsRGF0YVswXS5hdHRyKCdHYW1lSWQnKS52YWx1ZSgpID09PSBpbnRlcm5hbElkKSB7XG4vLyAgICAgICAgIGNvbnN0IHBsYXllcnMgPSB4bWxEb2MuZmluZCgnLy9DYW1wYWlnbkNhcm5hZ2VSZXBvcnQvUGxheWVycy9QbGF5ZXJJbmZvJyk7XG4vLyAgICAgICAgIGNvbnN0IG1haW5QbGF5ZXIgPSBwbGF5ZXJzLmZpbmQocGxheWVyID0+IHBsYXllci5hdHRyKCdpc0d1ZXN0JykudmFsdWUoKSA9PT0gJ2ZhbHNlJyk7XG4vLyAgICAgICAgIGNvbnN0IHhib3hJZCA9IG1haW5QbGF5ZXIuYXR0cignbVhib3hVc2VySWQnKS52YWx1ZSgpO1xuLy8gICAgICAgICAvLyBUaGUgdXNlcklkIGlzIHByZWZpeGVkIHdpdGggXCIweFwiIHdoaWNoIGlzIG5vdCBuZWVkZWQuXG4vLyAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoeGJveElkLnN1YnN0cmluZygyKSk7XG4vLyAgICAgICB9IGVsc2Uge1xuLy8gICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IHV0aWwuRGF0YUludmFsaWQoJ1dyb25nIGludGVybmFsIGdhbWVJZCcpKTtcbi8vICAgICAgIH1cbi8vICAgICB9KTtcbi8vIH1cblxuY29uc3QgcmVzb2x2ZUdhbWVWZXJzaW9uID0gYXN5bmMgKGRpc2NvdmVyeVBhdGg6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiA9PiB7XG4gIGNvbnN0IHZlcnNpb25QYXRoID0gcGF0aC5qb2luKGRpc2NvdmVyeVBhdGgsICdidWlsZF90YWcudHh0Jyk7XG4gIHJldHVybiBmcy5yZWFkRmlsZUFzeW5jKHZlcnNpb25QYXRoLCB7IGVuY29kaW5nOiAndXRmOCcgfSlcbiAgICAudGhlbigocmVzKSA9PiBQcm9taXNlLnJlc29sdmUocmVzLnNwbGl0KCdcXHJcXG4nKVswXS50cmltKCkpKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIGRlZmF1bHQ6IChjb250ZXh0OiB0eXBlcy5JRXh0ZW5zaW9uQ29udGV4dCkgPT4ge1xuICAgIGNvbnRleHQucmVnaXN0ZXJHYW1lKG5ldyBNYXN0ZXJDaGllZkNvbGxlY3Rpb25HYW1lKGNvbnRleHQpKTtcblxuICAgIC8vIGxldCBjb2xsYXRvcjtcbiAgICAvLyBjb25zdCBnZXRDb2xsYXRvciA9IChsb2NhbGUpID0+IHtcbiAgICAvLyAgIGlmICgoY29sbGF0b3IgPT09IHVuZGVmaW5lZCkgfHwgKGxvY2FsZSAhPT0gbGFuZykpIHtcbiAgICAvLyAgICAgbGFuZyA9IGxvY2FsZTtcbiAgICAvLyAgICAgY29sbGF0b3IgPSBuZXcgSW50bC5Db2xsYXRvcihsb2NhbGUsIHsgc2Vuc2l0aXZpdHk6ICdiYXNlJyB9KTtcbiAgICAvLyAgIH1cbiAgICAvLyAgIHJldHVybiBjb2xsYXRvcjtcbiAgICAvLyB9O1xuXG4gICAgY29udGV4dC5yZWdpc3Rlck1vZFR5cGUoTU9EVFlQRV9QTFVHX0FORF9QTEFZLCAxNSxcbiAgICAgIChnYW1lSWQ6IHN0cmluZykgPT4gZ2FtZUlkID09PSBHQU1FX0lELCAoKSA9PiB1bmRlZmluZWQsIHRlc3RQbHVnQW5kUGxheU1vZFR5cGUgYXMgYW55LCB7XG4gICAgICBkZXBsb3ltZW50RXNzZW50aWFsOiBmYWxzZSxcbiAgICAgIG1lcmdlTW9kczogdHJ1ZSxcbiAgICAgIG5hbWU6ICdNQ0MgUGx1ZyBhbmQgUGxheSBtb2QnLFxuICAgICAgbm9Db25mbGljdHM6IHRydWUsXG4gICAgfSlcblxuICAgIGNvbnRleHQucmVnaXN0ZXJJbnN0YWxsZXIoJ21jYy1wbHVnLWFuZC1wbGF5LWluc3RhbGxlcicsXG4gICAgICAxNSwgdGVzdFBsdWdBbmRQbGF5SW5zdGFsbGVyIGFzIGFueSwgaW5zdGFsbFBsdWdBbmRQbGF5IGFzIGFueSk7XG5cbiAgICBjb250ZXh0LnJlZ2lzdGVySW5zdGFsbGVyKCdtYXN0ZXJjaGllZm1vZGNvbmZpZ2luc3RhbGxlcicsXG4gICAgICAyMCwgdGVzdE1vZENvbmZpZ0luc3RhbGxlciBhcyBhbnksIGluc3RhbGxNb2RDb25maWcgYXMgYW55KTtcblxuICAgIGNvbnRleHQucmVnaXN0ZXJJbnN0YWxsZXIoJ21hc3RlcmNoaWVmaW5zdGFsbGVyJyxcbiAgICAgIDI1LCB0ZXN0SW5zdGFsbGVyIGFzIGFueSwgaW5zdGFsbCBhcyBhbnkpO1xuXG4gICAgY29udGV4dC5yZWdpc3RlclRlc3QoJ21jYy1jZS1tcC10ZXN0JywgJ2dhbWVtb2RlLWFjdGl2YXRlZCcsIHV0aWwudG9CbHVlKCgpID0+IHRlc3RDRU1QKGNvbnRleHQuYXBpKSkpO1xuXG4gICAgY29udGV4dC5yZWdpc3RlclRhYmxlQXR0cmlidXRlKCdtb2RzJywge1xuICAgICAgaWQ6ICdnYW1lVHlwZScsXG4gICAgICBuYW1lOiAnR2FtZShzKScsXG4gICAgICBkZXNjcmlwdGlvbjogJ1RhcmdldCBIYWxvIGdhbWUocykgZm9yIHRoaXMgbW9kJyxcbiAgICAgIGljb246ICdpbnNwZWN0JyxcbiAgICAgIHBsYWNlbWVudDogJ3RhYmxlJyxcbiAgICAgIGN1c3RvbVJlbmRlcmVyOiAobW9kKSA9PiB7XG4gICAgICAgIGNvbnN0IGNyZWF0ZUltZ0RpdiA9IChlbnRyeSwgaWR4KSA9PiB7XG4gICAgICAgICAgcmV0dXJuIFJlYWN0LmNyZWF0ZUVsZW1lbnQoJ2RpdicsIHsgY2xhc3NOYW1lOiAnaGFsby1pbWctZGl2Jywga2V5OiBgJHtlbnRyeS5pbnRlcm5hbElkfS0ke2lkeH1gIH0sIFxuICAgICAgICAgICAgUmVhY3QuY3JlYXRlRWxlbWVudCgnaW1nJywgeyBjbGFzc05hbWU6ICdoYWxvZ2FtZWltZycsIHNyYzogYGZpbGU6Ly8ke2VudHJ5LmltZ31gIH0pLFxuICAgICAgICAgICAgUmVhY3QuY3JlYXRlRWxlbWVudCgnc3BhbicsIHt9LCBlbnRyeS5uYW1lKSlcbiAgICAgICAgfTtcblxuICAgICAgICBjb25zdCBpbnRlcm5hbElkcyA9IHV0aWwuZ2V0U2FmZShtb2QsIFsnYXR0cmlidXRlcycsICdoYWxvR2FtZXMnXSwgW10pO1xuICAgICAgICBjb25zdCBoYWxvRW50cmllcyA9IE9iamVjdC5rZXlzKEhBTE9fR0FNRVMpXG4gICAgICAgICAgLmZpbHRlcihrZXkgPT4gaW50ZXJuYWxJZHMuaW5jbHVkZXMoSEFMT19HQU1FU1trZXldLmludGVybmFsSWQpKVxuICAgICAgICAgIC5tYXAoa2V5ID0+IEhBTE9fR0FNRVNba2V5XSk7XG5cbiAgICAgICAgcmV0dXJuIFJlYWN0LmNyZWF0ZUVsZW1lbnQoRmxleExheW91dCwgeyB0eXBlOiAncm93JyB9LCBcbiAgICAgICAgICBSZWFjdC5jcmVhdGVFbGVtZW50KEZsZXhMYXlvdXQuRmxleCwgeyBjbGFzc05hbWU6ICdoYWxvaW1nbGF5b3V0JyB9LCBoYWxvRW50cmllcy5tYXAoKGVudHJ5LCBpZHgpID0+IGNyZWF0ZUltZ0RpdihlbnRyeSwgaWR4KSkpKTtcbiAgICAgIH0sXG4gICAgICBjYWxjOiAobW9kKSA9PiB1dGlsLmdldFNhZmUobW9kLCBbJ2F0dHJpYnV0ZXMnLCAnaGFsb0dhbWVzJ10sIHVuZGVmaW5lZCksXG4gICAgICBmaWx0ZXI6IG5ldyBPcHRpb25zRmlsdGVyKFxuICAgICAgICBbXS5jb25jYXQoW3sgdmFsdWU6IE9wdGlvbnNGaWx0ZXIuRU1QVFksIGxhYmVsOiAnPE5vbmU+JyB9XSxcbiAgICAgICAgT2JqZWN0LmtleXMoSEFMT19HQU1FUylcbiAgICAgICAgICAubWFwKGtleSA9PiB7XG4gICAgICAgICAgICByZXR1cm4geyB2YWx1ZTogSEFMT19HQU1FU1trZXldLmludGVybmFsSWQsIGxhYmVsOiBIQUxPX0dBTUVTW2tleV0ubmFtZSB9O1xuICAgICAgICAgIH0pKVxuICAgICAgICAsIHRydWUsIGZhbHNlKSxcbiAgICAgIGlzVG9nZ2xlYWJsZTogdHJ1ZSxcbiAgICAgIGVkaXQ6IHt9LFxuICAgICAgaXNTb3J0YWJsZTogZmFsc2UsXG4gICAgICBpc0dyb3VwYWJsZTogKG1vZCkgPT4ge1xuICAgICAgICBjb25zdCBpbnRlcm5hbElkcyA9IHV0aWwuZ2V0U2FmZShtb2QsIFsnYXR0cmlidXRlcycsICdoYWxvR2FtZXMnXSwgW10pO1xuICAgICAgICBjb25zdCBoYWxvRW50cmllcyA9IE9iamVjdC5rZXlzKEhBTE9fR0FNRVMpXG4gICAgICAgICAgLmZpbHRlcihrZXkgPT4gaW50ZXJuYWxJZHMuaW5jbHVkZXMoSEFMT19HQU1FU1trZXldLmludGVybmFsSWQpKVxuICAgICAgICAgIC5tYXAoa2V5ID0+IEhBTE9fR0FNRVNba2V5XSk7XG5cbiAgICAgICAgaWYgKGhhbG9FbnRyaWVzLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgICByZXR1cm4gJ011bHRpcGxlJztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gKCEhaGFsb0VudHJpZXMgJiYgKGhhbG9FbnRyaWVzLmxlbmd0aCA+IDApKVxuICAgICAgICAgICAgPyBoYWxvRW50cmllc1swXS5uYW1lXG4gICAgICAgICAgICA6ICdOb25lJztcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIGlzRGVmYXVsdFZpc2libGU6IHRydWUsXG4gICAgICAvL3NvcnRGdW5jOiAobGhzLCByaHMpID0+IGdldENvbGxhdG9yKGxvY2FsZSkuY29tcGFyZShsaHMsIHJocyksXG4gICAgICBjb25kaXRpb246ICgpID0+IHtcbiAgICAgICAgY29uc3QgYWN0aXZlR2FtZUlkID0gc2VsZWN0b3JzLmFjdGl2ZUdhbWVJZChjb250ZXh0LmFwaS5zdG9yZS5nZXRTdGF0ZSgpKTtcbiAgICAgICAgcmV0dXJuIChhY3RpdmVHYW1lSWQgPT09IEdBTUVfSUQpO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgY29udGV4dC5vbmNlKCgpID0+IHtcbiAgICAgIGNvbnRleHQuYXBpLnNldFN0eWxlc2hlZXQoJ21hc3RlcmNoaWVmc3R5bGUnLCBwYXRoLmpvaW4oX19kaXJuYW1lLCAnbWFzdGVyY2hpZWYuc2NzcycpKTtcbiAgICAgIGNvbnRleHQuYXBpLm9uQXN5bmMoJ2RpZC1kZXBsb3knLCBhc3luYyAocHJvZmlsZUlkOiBzdHJpbmcpID0+IGFwcGx5VG9NYW5pZmVzdChjb250ZXh0LmFwaSwgdHJ1ZSkpO1xuICAgICAgY29udGV4dC5hcGkub25Bc3luYygnZGlkLXB1cmdlJywgYXN5bmMgKHByb2ZpbGVJZDogc3RyaW5nKSA9PiBhcHBseVRvTWFuaWZlc3QoY29udGV4dC5hcGksIGZhbHNlKSk7XG4gICAgfSk7XG4gIH1cbn07XG4iXX0=