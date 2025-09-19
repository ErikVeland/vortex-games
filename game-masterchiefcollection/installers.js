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
exports.install = exports.testInstaller = exports.installModConfig = exports.testModConfigInstaller = exports.installPlugAndPlay = exports.testPlugAndPlayInstaller = void 0;
const path_1 = __importDefault(require("path"));
const rjson = __importStar(require("relaxed-json"));
const vortex_api_1 = require("vortex-api");
const common_1 = require("./common");
const util_1 = require("./util");
function testPlugAndPlayInstaller(files, gameId) {
    return __awaiter(this, void 0, void 0, function* () {
        const hasModInfoFile = files.some(file => path_1.default.basename(file).toLowerCase() === common_1.MOD_INFO_JSON_FILE);
        return Promise.resolve({ supported: (gameId === common_1.GAME_ID) && hasModInfoFile, requiredFiles: [] });
    });
}
exports.testPlugAndPlayInstaller = testPlugAndPlayInstaller;
function installPlugAndPlay(files, destinationPath) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        const modInfo = files.find(file => path_1.default.basename(file).toLowerCase() === common_1.MOD_INFO_JSON_FILE);
        const modInfoData = yield vortex_api_1.fs.readFileAsync(path_1.default.join(destinationPath, modInfo), { encoding: 'utf8' });
        const parsed = rjson.parse(modInfoData);
        let modConfigAttributes = [];
        modConfigAttributes.push({
            type: 'attribute',
            key: 'haloGames',
            value: [common_1.HALO_GAMES[parsed.Engine.toLowerCase()].internalId],
        });
        if (parsed.ModVersion !== undefined) {
            modConfigAttributes.push({
                type: 'attribute',
                key: 'version',
                value: `${parsed.ModVersion.Major || 0}.${parsed.ModVersion.Minor || 0}.${parsed.ModVersion.Patch || 0}`,
            });
        }
        if (((_a = parsed.Title) === null || _a === void 0 ? void 0 : _a.Neutral) !== undefined) {
            modConfigAttributes.push({
                type: 'attribute',
                key: 'customFileName',
                value: parsed.Title.Neutral,
            });
        }
        const infoSegments = modInfo.split(path_1.default.sep);
        const modFolderIndex = infoSegments.length >= 1 ? infoSegments.length - 1 : 0;
        const filtered = files.filter(file => path_1.default.extname(path_1.default.basename(file)) !== '');
        const instructions = filtered.map(file => {
            const segments = file.split(path_1.default.sep);
            const destination = segments.slice(modFolderIndex);
            return {
                type: 'copy',
                source: file,
                destination: destination.join(path_1.default.sep),
            };
        });
        instructions.push(...modConfigAttributes);
        return Promise.resolve({ instructions });
    });
}
exports.installPlugAndPlay = installPlugAndPlay;
function testModConfigInstaller(files, gameId) {
    const isAssemblyOnlyMod = () => {
        return (files.find(file => path_1.default.extname(file) === common_1.ASSEMBLY_EXT) !== undefined)
            && (files.find(file => path_1.default.extname(file) === common_1.MAP_EXT) === undefined);
    };
    return (gameId !== common_1.GAME_ID)
        ? Promise.resolve({ supported: false, requiredFiles: [] })
        : Promise.resolve({
            supported: (files.find(file => path_1.default.basename(file) === common_1.MOD_CONFIG_FILE) !== undefined)
                && !isAssemblyOnlyMod(),
            requiredFiles: [],
        });
}
exports.testModConfigInstaller = testModConfigInstaller;
function installModConfig(files, destinationPath) {
    return __awaiter(this, void 0, void 0, function* () {
        const modConfigFile = files.find(file => path_1.default.basename(file) === common_1.MOD_CONFIG_FILE);
        const filtered = files.filter(file => {
            const segments = file.split(path_1.default.sep);
            const lastElementExt = path_1.default.extname(segments[segments.length - 1]);
            return (modConfigFile !== file) && ['', '.txt', common_1.ASSEMBLY_EXT].indexOf(lastElementExt) === -1;
        });
        const configData = yield vortex_api_1.fs.readFileAsync(path_1.default.join(destinationPath, modConfigFile), { encoding: 'utf8' });
        let data;
        try {
            data = rjson.parse(vortex_api_1.util.deBOM(configData));
        }
        catch (err) {
            (0, vortex_api_1.log)('error', 'Unable to parse modpack_config.cfg', err);
            return Promise.reject(new vortex_api_1.util.DataInvalid('Invalid modpack_config.cfg file'));
        }
        if (!data.entries) {
            return Promise.reject(new vortex_api_1.util.DataInvalid('modpack_config.cfg file contains no entries'));
        }
        const instructions = filtered.reduce((accum, file) => {
            const matchingEntry = data.entries.find(entry => ('src' in entry) && (entry.src.toLowerCase() === file.toLowerCase()));
            if (!!matchingEntry) {
                const destination = matchingEntry.dest.substring(common_1.MOD_CONFIG_DEST_ELEMENT.length);
                accum.push({
                    type: 'copy',
                    source: file,
                    destination,
                });
            }
            else {
                (0, vortex_api_1.log)('warn', 'Failed to find matching manifest entry for file in archive', file);
            }
            return accum;
        }, []);
        return Promise.resolve({ instructions });
    });
}
exports.installModConfig = installModConfig;
function testInstaller(files, gameId) {
    if (gameId !== common_1.GAME_ID) {
        return Promise.resolve({ supported: false, requiredFiles: [] });
    }
    const haloGames = (0, util_1.identifyHaloGames)(files);
    return Promise.resolve({
        supported: (haloGames.length > 0),
        requiredFiles: [],
    });
}
exports.testInstaller = testInstaller;
function install(files, destinationPath) {
    return __awaiter(this, void 0, void 0, function* () {
        const haloGames = (0, util_1.identifyHaloGames)(files);
        const internalIds = haloGames.map(game => game.internalId);
        const attrInstruction = {
            type: 'attribute',
            key: 'haloGames',
            value: internalIds,
        };
        const instructions = haloGames.reduce((accum, haloGame) => {
            const filtered = files.filter(file => {
                const segments = file.split(path_1.default.sep).filter(seg => !!seg);
                return (path_1.default.extname(segments[segments.length - 1]) !== '')
                    && (segments.indexOf(haloGame.modsPath) !== -1);
            });
            filtered.forEach(element => {
                const segments = element.split(path_1.default.sep).filter(seg => !!seg);
                const rootIdx = segments.indexOf(haloGame.modsPath);
                const destination = segments.splice(rootIdx).join(path_1.default.sep);
                accum.push({
                    type: 'copy',
                    source: element,
                    destination
                });
            });
            return accum;
        }, [attrInstruction]);
        return Promise.resolve({ instructions });
    });
}
exports.install = install;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5zdGFsbGVycy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImluc3RhbGxlcnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFDQSxnREFBd0I7QUFDeEIsb0RBQXNDO0FBQ3RDLDJDQUFrRDtBQUVsRCxxQ0FBb0k7QUFFcEksaUNBQTJDO0FBRTNDLFNBQXNCLHdCQUF3QixDQUFDLEtBQWUsRUFBRSxNQUFjOztRQUM1RSxNQUFNLGNBQWMsR0FBRyxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsY0FBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxXQUFXLEVBQUUsS0FBSywyQkFBa0IsQ0FBQyxDQUFDO1FBQ3BHLE9BQU8sT0FBTyxDQUFDLE9BQU8sQ0FBQyxFQUFFLFNBQVMsRUFBRSxDQUFDLE1BQU0sS0FBSyxnQkFBTyxDQUFDLElBQUksY0FBYyxFQUFFLGFBQWEsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDO0lBQ25HLENBQUM7Q0FBQTtBQUhELDREQUdDO0FBRUQsU0FBc0Isa0JBQWtCLENBQUMsS0FBZSxFQUFFLGVBQXVCOzs7UUFDL0UsTUFBTSxPQUFPLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLGNBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUMsV0FBVyxFQUFFLEtBQUssMkJBQWtCLENBQUMsQ0FBQztRQUM3RixNQUFNLFdBQVcsR0FBRyxNQUFNLGVBQUUsQ0FBQyxhQUFhLENBQUMsY0FBSSxDQUFDLElBQUksQ0FBQyxlQUFlLEVBQUUsT0FBTyxDQUFDLEVBQUUsRUFBRSxRQUFRLEVBQUUsTUFBTSxFQUFFLENBQUMsQ0FBQztRQUN0RyxNQUFNLE1BQU0sR0FBZSxLQUFLLENBQUMsS0FBSyxDQUFDLFdBQVcsQ0FBZSxDQUFDO1FBQ2xFLElBQUksbUJBQW1CLEdBQXlCLEVBQUUsQ0FBQztRQUNuRCxtQkFBbUIsQ0FBQyxJQUFJLENBQUM7WUFDdkIsSUFBSSxFQUFFLFdBQVc7WUFDakIsR0FBRyxFQUFFLFdBQVc7WUFDaEIsS0FBSyxFQUFFLENBQUMsbUJBQVUsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLFdBQVcsRUFBRSxDQUFDLENBQUMsVUFBVSxDQUFDO1NBQzVELENBQUMsQ0FBQztRQUVILElBQUksTUFBTSxDQUFDLFVBQVUsS0FBSyxTQUFTLEVBQUU7WUFDbkMsbUJBQW1CLENBQUMsSUFBSSxDQUFDO2dCQUN2QixJQUFJLEVBQUUsV0FBVztnQkFDakIsR0FBRyxFQUFFLFNBQVM7Z0JBQ2QsS0FBSyxFQUFFLEdBQUcsTUFBTSxDQUFDLFVBQVUsQ0FBQyxLQUFLLElBQUksQ0FBQyxJQUFJLE1BQU0sQ0FBQyxVQUFVLENBQUMsS0FBSyxJQUFJLENBQUMsSUFBSSxNQUFNLENBQUMsVUFBVSxDQUFDLEtBQUssSUFBSSxDQUFDLEVBQUU7YUFDekcsQ0FBQyxDQUFDO1NBQ0o7UUFFRCxJQUFJLENBQUEsTUFBQSxNQUFNLENBQUMsS0FBSywwQ0FBRSxPQUFPLE1BQUssU0FBUyxFQUFFO1lBQ3ZDLG1CQUFtQixDQUFDLElBQUksQ0FBQztnQkFDdkIsSUFBSSxFQUFFLFdBQVc7Z0JBQ2pCLEdBQUcsRUFBRSxnQkFBZ0I7Z0JBQ3JCLEtBQUssRUFBRSxNQUFNLENBQUMsS0FBSyxDQUFDLE9BQU87YUFDNUIsQ0FBQyxDQUFDO1NBQ0o7UUFFRCxNQUFNLFlBQVksR0FBRyxPQUFPLENBQUMsS0FBSyxDQUFDLGNBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUM3QyxNQUFNLGNBQWMsR0FBRyxZQUFZLENBQUMsTUFBTSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsWUFBWSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUM5RSxNQUFNLFFBQVEsR0FBRyxLQUFLLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsY0FBSSxDQUFDLE9BQU8sQ0FBQyxjQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUM7UUFDaEYsTUFBTSxZQUFZLEdBQXlCLFFBQVEsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUU7WUFDN0QsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxjQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDdEMsTUFBTSxXQUFXLEdBQUcsUUFBUSxDQUFDLEtBQUssQ0FBQyxjQUFjLENBQUMsQ0FBQztZQUNuRCxPQUFPO2dCQUNMLElBQUksRUFBRSxNQUFNO2dCQUNaLE1BQU0sRUFBRSxJQUFJO2dCQUNaLFdBQVcsRUFBRSxXQUFXLENBQUMsSUFBSSxDQUFDLGNBQUksQ0FBQyxHQUFHLENBQUM7YUFDeEMsQ0FBQztRQUNKLENBQUMsQ0FBQyxDQUFDO1FBRUgsWUFBWSxDQUFDLElBQUksQ0FBQyxHQUFHLG1CQUFtQixDQUFDLENBQUM7UUFDMUMsT0FBTyxPQUFPLENBQUMsT0FBTyxDQUFDLEVBQUUsWUFBWSxFQUFFLENBQUMsQ0FBQzs7Q0FDMUM7QUExQ0QsZ0RBMENDO0FBRUQsU0FBZ0Isc0JBQXNCLENBQUMsS0FBSyxFQUFFLE1BQU07SUFDbEQsTUFBTSxpQkFBaUIsR0FBRyxHQUFHLEVBQUU7UUFJN0IsT0FBTyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxjQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxLQUFLLHFCQUFZLENBQUMsS0FBSyxTQUFTLENBQUM7ZUFDekUsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsY0FBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsS0FBSyxnQkFBTyxDQUFDLEtBQUssU0FBUyxDQUFDLENBQUM7SUFDMUUsQ0FBQyxDQUFDO0lBQ0YsT0FBTyxDQUFDLE1BQU0sS0FBSyxnQkFBTyxDQUFDO1FBQzFCLENBQUMsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLEVBQUUsU0FBUyxFQUFFLEtBQUssRUFBRSxhQUFhLEVBQUUsRUFBRSxFQUFFLENBQUM7UUFDMUQsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUM7WUFDaEIsU0FBUyxFQUFFLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLGNBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLEtBQUssd0JBQWUsQ0FBQyxLQUFLLFNBQVMsQ0FBQzttQkFDbEYsQ0FBQyxpQkFBaUIsRUFBRTtZQUN4QixhQUFhLEVBQUUsRUFBRTtTQUNqQixDQUFDLENBQUM7QUFDUCxDQUFDO0FBZkQsd0RBZUM7QUFFRCxTQUFzQixnQkFBZ0IsQ0FBQyxLQUFlLEVBQUUsZUFBdUI7O1FBRTdFLE1BQU0sYUFBYSxHQUFHLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxjQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxLQUFLLHdCQUFlLENBQUMsQ0FBQztRQUNsRixNQUFNLFFBQVEsR0FBRyxLQUFLLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxFQUFFO1lBRW5DLE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsY0FBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQ3RDLE1BQU0sY0FBYyxHQUFHLGNBQUksQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNuRSxPQUFPLENBQUMsYUFBYSxLQUFLLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRSxFQUFFLE1BQU0sRUFBRSxxQkFBWSxDQUFDLENBQUMsT0FBTyxDQUFDLGNBQWMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO1FBQy9GLENBQUMsQ0FBQyxDQUFDO1FBQ0gsTUFBTSxVQUFVLEdBQUcsTUFBTSxlQUFFLENBQUMsYUFBYSxDQUFDLGNBQUksQ0FBQyxJQUFJLENBQUMsZUFBZSxFQUFFLGFBQWEsQ0FBQyxFQUFFLEVBQUUsUUFBUSxFQUFFLE1BQU0sRUFBRSxDQUFDLENBQUM7UUFDM0csSUFBSSxJQUFJLENBQUM7UUFDVCxJQUFJO1lBQ0YsSUFBSSxHQUFHLEtBQUssQ0FBQyxLQUFLLENBQUMsaUJBQUksQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQztTQUM1QztRQUFDLE9BQU8sR0FBRyxFQUFFO1lBQ1osSUFBQSxnQkFBRyxFQUFDLE9BQU8sRUFBRSxvQ0FBb0MsRUFBRSxHQUFHLENBQUMsQ0FBQztZQUN4RCxPQUFPLE9BQU8sQ0FBQyxNQUFNLENBQUMsSUFBSSxpQkFBSSxDQUFDLFdBQVcsQ0FBQyxpQ0FBaUMsQ0FBQyxDQUFDLENBQUM7U0FDaEY7UUFFRCxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRTtZQUNqQixPQUFPLE9BQU8sQ0FBQyxNQUFNLENBQUMsSUFBSSxpQkFBSSxDQUFDLFdBQVcsQ0FBQyw2Q0FBNkMsQ0FBQyxDQUFDLENBQUE7U0FDM0Y7UUFFRCxNQUFNLFlBQVksR0FBRyxRQUFRLENBQUMsTUFBTSxDQUFDLENBQUMsS0FBSyxFQUFFLElBQUksRUFBRSxFQUFFO1lBQ25ELE1BQU0sYUFBYSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQzlDLENBQUMsS0FBSyxJQUFJLEtBQUssQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxXQUFXLEVBQUUsS0FBSyxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ3hFLElBQUksQ0FBQyxDQUFDLGFBQWEsRUFBRTtnQkFDbkIsTUFBTSxXQUFXLEdBQUcsYUFBYSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsZ0NBQXVCLENBQUMsTUFBTSxDQUFDLENBQUM7Z0JBQ2pGLEtBQUssQ0FBQyxJQUFJLENBQUM7b0JBQ1QsSUFBSSxFQUFFLE1BQU07b0JBQ1osTUFBTSxFQUFFLElBQUk7b0JBQ1osV0FBVztpQkFDWixDQUFDLENBQUM7YUFDSjtpQkFBTTtnQkFHTCxJQUFBLGdCQUFHLEVBQUMsTUFBTSxFQUFFLDREQUE0RCxFQUFFLElBQUksQ0FBQyxDQUFDO2FBQ2pGO1lBRUQsT0FBTyxLQUFLLENBQUM7UUFDYixDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFDVCxPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsRUFBRSxZQUFZLEVBQUUsQ0FBQyxDQUFDO0lBQzNDLENBQUM7Q0FBQTtBQXpDRCw0Q0F5Q0M7QUFFRCxTQUFnQixhQUFhLENBQUMsS0FBSyxFQUFFLE1BQU07SUFDekMsSUFBSSxNQUFNLEtBQUssZ0JBQU8sRUFBRTtRQUN0QixPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsRUFBRSxTQUFTLEVBQUUsS0FBSyxFQUFFLGFBQWEsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDO0tBQ2pFO0lBQ0QsTUFBTSxTQUFTLEdBQUcsSUFBQSx3QkFBaUIsRUFBQyxLQUFLLENBQUMsQ0FBQztJQUMzQyxPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUM7UUFDckIsU0FBUyxFQUFFLENBQUMsU0FBUyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUM7UUFDakMsYUFBYSxFQUFFLEVBQUU7S0FDbEIsQ0FBQyxDQUFDO0FBQ0wsQ0FBQztBQVRELHNDQVNDO0FBRUQsU0FBc0IsT0FBTyxDQUFDLEtBQWUsRUFBRSxlQUF1Qjs7UUFDcEUsTUFBTSxTQUFTLEdBQUksSUFBQSx3QkFBaUIsRUFBQyxLQUFLLENBQUMsQ0FBQztRQUM1QyxNQUFNLFdBQVcsR0FBRyxTQUFTLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBQzNELE1BQU0sZUFBZSxHQUF1QjtZQUMxQyxJQUFJLEVBQUUsV0FBVztZQUNqQixHQUFHLEVBQUUsV0FBVztZQUNoQixLQUFLLEVBQUUsV0FBVztTQUNuQixDQUFBO1FBRUQsTUFBTSxZQUFZLEdBQXlCLFNBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxLQUFLLEVBQUUsUUFBUSxFQUFFLEVBQUU7WUFDOUUsTUFBTSxRQUFRLEdBQUcsS0FBSyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsRUFBRTtnQkFDbkMsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxjQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDO2dCQUMzRCxPQUFPLENBQUMsY0FBSSxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQyxLQUFLLEVBQUUsQ0FBQzt1QkFDdEQsQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3BELENBQUMsQ0FBQyxDQUFDO1lBRUgsUUFBUSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsRUFBRTtnQkFDekIsTUFBTSxRQUFRLEdBQUcsT0FBTyxDQUFDLEtBQUssQ0FBQyxjQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDO2dCQUM5RCxNQUFNLE9BQU8sR0FBRyxRQUFRLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsQ0FBQztnQkFDcEQsTUFBTSxXQUFXLEdBQUcsUUFBUSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQyxJQUFJLENBQUMsY0FBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO2dCQUM1RCxLQUFLLENBQUMsSUFBSSxDQUFDO29CQUNULElBQUksRUFBRSxNQUFNO29CQUNaLE1BQU0sRUFBRSxPQUFPO29CQUNmLFdBQVc7aUJBQ1osQ0FBQyxDQUFDO1lBQ0wsQ0FBQyxDQUFDLENBQUM7WUFDSCxPQUFPLEtBQUssQ0FBQztRQUNmLENBQUMsRUFBRSxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUM7UUFDdEIsT0FBTyxPQUFPLENBQUMsT0FBTyxDQUFDLEVBQUUsWUFBWSxFQUFFLENBQUMsQ0FBQztJQUMzQyxDQUFDO0NBQUE7QUE3QkQsMEJBNkJDIiwic291cmNlc0NvbnRlbnQiOlsiLyogZXNsaW50LWRpc2FibGUgKi9cbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0ICogYXMgcmpzb24gZnJvbSAncmVsYXhlZC1qc29uJztcbmltcG9ydCB7IGZzLCB0eXBlcywgbG9nLCB1dGlsIH0gZnJvbSAndm9ydGV4LWFwaSc7XG5cbmltcG9ydCB7IE1PRF9DT05GSUdfREVTVF9FTEVNRU5ULCBNT0RfSU5GT19KU09OX0ZJTEUsIEdBTUVfSUQsIE1PRF9DT05GSUdfRklMRSwgQVNTRU1CTFlfRVhULCBNQVBfRVhULCBIQUxPX0dBTUVTIH0gZnJvbSAnLi9jb21tb24nO1xuaW1wb3J0IHsgSU1vZENvbmZpZyB9IGZyb20gJy4vdHlwZXMnO1xuaW1wb3J0IHsgaWRlbnRpZnlIYWxvR2FtZXMgfSBmcm9tICcuL3V0aWwnO1xuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gdGVzdFBsdWdBbmRQbGF5SW5zdGFsbGVyKGZpbGVzOiBzdHJpbmdbXSwgZ2FtZUlkOiBzdHJpbmcpIHtcbiAgY29uc3QgaGFzTW9kSW5mb0ZpbGUgPSBmaWxlcy5zb21lKGZpbGUgPT4gcGF0aC5iYXNlbmFtZShmaWxlKS50b0xvd2VyQ2FzZSgpID09PSBNT0RfSU5GT19KU09OX0ZJTEUpO1xuICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHsgc3VwcG9ydGVkOiAoZ2FtZUlkID09PSBHQU1FX0lEKSAmJiBoYXNNb2RJbmZvRmlsZSwgcmVxdWlyZWRGaWxlczogW10gfSk7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBpbnN0YWxsUGx1Z0FuZFBsYXkoZmlsZXM6IHN0cmluZ1tdLCBkZXN0aW5hdGlvblBhdGg6IHN0cmluZykge1xuICBjb25zdCBtb2RJbmZvID0gZmlsZXMuZmluZChmaWxlID0+IHBhdGguYmFzZW5hbWUoZmlsZSkudG9Mb3dlckNhc2UoKSA9PT0gTU9EX0lORk9fSlNPTl9GSUxFKTtcbiAgY29uc3QgbW9kSW5mb0RhdGEgPSBhd2FpdCBmcy5yZWFkRmlsZUFzeW5jKHBhdGguam9pbihkZXN0aW5hdGlvblBhdGgsIG1vZEluZm8pLCB7IGVuY29kaW5nOiAndXRmOCcgfSk7XG4gIGNvbnN0IHBhcnNlZDogSU1vZENvbmZpZyA9IHJqc29uLnBhcnNlKG1vZEluZm9EYXRhKSBhcyBJTW9kQ29uZmlnO1xuICBsZXQgbW9kQ29uZmlnQXR0cmlidXRlczogdHlwZXMuSUluc3RydWN0aW9uW10gPSBbXTtcbiAgbW9kQ29uZmlnQXR0cmlidXRlcy5wdXNoKHtcbiAgICB0eXBlOiAnYXR0cmlidXRlJyxcbiAgICBrZXk6ICdoYWxvR2FtZXMnLFxuICAgIHZhbHVlOiBbSEFMT19HQU1FU1twYXJzZWQuRW5naW5lLnRvTG93ZXJDYXNlKCldLmludGVybmFsSWRdLFxuICB9KTtcblxuICBpZiAocGFyc2VkLk1vZFZlcnNpb24gIT09IHVuZGVmaW5lZCkge1xuICAgIG1vZENvbmZpZ0F0dHJpYnV0ZXMucHVzaCh7XG4gICAgICB0eXBlOiAnYXR0cmlidXRlJyxcbiAgICAgIGtleTogJ3ZlcnNpb24nLFxuICAgICAgdmFsdWU6IGAke3BhcnNlZC5Nb2RWZXJzaW9uLk1ham9yIHx8IDB9LiR7cGFyc2VkLk1vZFZlcnNpb24uTWlub3IgfHwgMH0uJHtwYXJzZWQuTW9kVmVyc2lvbi5QYXRjaCB8fCAwfWAsXG4gICAgfSk7XG4gIH1cblxuICBpZiAocGFyc2VkLlRpdGxlPy5OZXV0cmFsICE9PSB1bmRlZmluZWQpIHtcbiAgICBtb2RDb25maWdBdHRyaWJ1dGVzLnB1c2goe1xuICAgICAgdHlwZTogJ2F0dHJpYnV0ZScsXG4gICAgICBrZXk6ICdjdXN0b21GaWxlTmFtZScsXG4gICAgICB2YWx1ZTogcGFyc2VkLlRpdGxlLk5ldXRyYWwsXG4gICAgfSk7XG4gIH1cblxuICBjb25zdCBpbmZvU2VnbWVudHMgPSBtb2RJbmZvLnNwbGl0KHBhdGguc2VwKTtcbiAgY29uc3QgbW9kRm9sZGVySW5kZXggPSBpbmZvU2VnbWVudHMubGVuZ3RoID49IDEgPyBpbmZvU2VnbWVudHMubGVuZ3RoIC0gMSA6IDA7XG4gIGNvbnN0IGZpbHRlcmVkID0gZmlsZXMuZmlsdGVyKGZpbGUgPT4gcGF0aC5leHRuYW1lKHBhdGguYmFzZW5hbWUoZmlsZSkpICE9PSAnJyk7XG4gIGNvbnN0IGluc3RydWN0aW9uczogdHlwZXMuSUluc3RydWN0aW9uW10gPSBmaWx0ZXJlZC5tYXAoZmlsZSA9PiB7XG4gICAgY29uc3Qgc2VnbWVudHMgPSBmaWxlLnNwbGl0KHBhdGguc2VwKTtcbiAgICBjb25zdCBkZXN0aW5hdGlvbiA9IHNlZ21lbnRzLnNsaWNlKG1vZEZvbGRlckluZGV4KTtcbiAgICByZXR1cm4ge1xuICAgICAgdHlwZTogJ2NvcHknLFxuICAgICAgc291cmNlOiBmaWxlLFxuICAgICAgZGVzdGluYXRpb246IGRlc3RpbmF0aW9uLmpvaW4ocGF0aC5zZXApLFxuICAgIH07XG4gIH0pO1xuXG4gIGluc3RydWN0aW9ucy5wdXNoKC4uLm1vZENvbmZpZ0F0dHJpYnV0ZXMpO1xuICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHsgaW5zdHJ1Y3Rpb25zIH0pO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gdGVzdE1vZENvbmZpZ0luc3RhbGxlcihmaWxlcywgZ2FtZUlkKSB7XG4gIGNvbnN0IGlzQXNzZW1ibHlPbmx5TW9kID0gKCkgPT4ge1xuICAgIC8vIFRoZSBwcmVzZW5zZSBvZiBhbiAuYXNtcCBmaWxlIHdpdGhvdXQgYW55IC5tYXAgZmlsZXMgaXMgYSBjbGVhciBpbmRpY2F0aW9uXG4gICAgLy8gIHRoYXQgdGhpcyBtb2QgY2FuIG9ubHkgYmUgaW5zdGFsbGVkIHVzaW5nIHRoZSBBc3NlbWJseSB0b29sIHdoaWNoIHdlJ3ZlXG4gICAgLy8gIHlldCB0byBpbnRlZ3JhdGUgaW50byBWb3J0ZXguIFRoaXMgaW5zdGFsbGVyIHdpbGwgbm90IGluc3RhbGwgdGhlc2UgbW9kcy5cbiAgICByZXR1cm4gKGZpbGVzLmZpbmQoZmlsZSA9PiBwYXRoLmV4dG5hbWUoZmlsZSkgPT09IEFTU0VNQkxZX0VYVCkgIT09IHVuZGVmaW5lZClcbiAgICAgICYmIChmaWxlcy5maW5kKGZpbGUgPT4gcGF0aC5leHRuYW1lKGZpbGUpID09PSBNQVBfRVhUKSA9PT0gdW5kZWZpbmVkKTtcbiAgfTtcbiAgcmV0dXJuIChnYW1lSWQgIT09IEdBTUVfSUQpXG4gICA/IFByb21pc2UucmVzb2x2ZSh7IHN1cHBvcnRlZDogZmFsc2UsIHJlcXVpcmVkRmlsZXM6IFtdIH0pXG4gICA6IFByb21pc2UucmVzb2x2ZSh7XG4gICAgIHN1cHBvcnRlZDogKGZpbGVzLmZpbmQoZmlsZSA9PiBwYXRoLmJhc2VuYW1lKGZpbGUpID09PSBNT0RfQ09ORklHX0ZJTEUpICE9PSB1bmRlZmluZWQpXG4gICAgICAmJiAhaXNBc3NlbWJseU9ubHlNb2QoKSxcbiAgICAgcmVxdWlyZWRGaWxlczogW10sXG4gICAgfSk7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBpbnN0YWxsTW9kQ29uZmlnKGZpbGVzOiBzdHJpbmdbXSwgZGVzdGluYXRpb25QYXRoOiBzdHJpbmcpIHtcbiAgLy8gRmluZCB0aGUgbW9kIGNvbmZpZyBmaWxlIGFuZCB1c2UgaXQgdG8gYnVpbGQgdGhlIGluc3RydWN0aW9ucy5cbiAgY29uc3QgbW9kQ29uZmlnRmlsZSA9IGZpbGVzLmZpbmQoZmlsZSA9PiBwYXRoLmJhc2VuYW1lKGZpbGUpID09PSBNT0RfQ09ORklHX0ZJTEUpO1xuICBjb25zdCBmaWx0ZXJlZCA9IGZpbGVzLmZpbHRlcihmaWxlID0+IHtcbiAgICAvLyBObyBkaXJlY3RvcmllcywgYXNzZW1ibHkgdG9vbCBmaWxlcywgcmVhZG1lcyBvciBtb2QgY29uZmlnIGZpbGVzLlxuICAgIGNvbnN0IHNlZ21lbnRzID0gZmlsZS5zcGxpdChwYXRoLnNlcCk7XG4gICAgY29uc3QgbGFzdEVsZW1lbnRFeHQgPSBwYXRoLmV4dG5hbWUoc2VnbWVudHNbc2VnbWVudHMubGVuZ3RoIC0gMV0pO1xuICAgIHJldHVybiAobW9kQ29uZmlnRmlsZSAhPT0gZmlsZSkgJiYgWycnLCAnLnR4dCcsIEFTU0VNQkxZX0VYVF0uaW5kZXhPZihsYXN0RWxlbWVudEV4dCkgPT09IC0xO1xuICB9KTtcbiAgY29uc3QgY29uZmlnRGF0YSA9IGF3YWl0IGZzLnJlYWRGaWxlQXN5bmMocGF0aC5qb2luKGRlc3RpbmF0aW9uUGF0aCwgbW9kQ29uZmlnRmlsZSksIHsgZW5jb2Rpbmc6ICd1dGY4JyB9KTtcbiAgbGV0IGRhdGE7XG4gIHRyeSB7XG4gICAgZGF0YSA9IHJqc29uLnBhcnNlKHV0aWwuZGVCT00oY29uZmlnRGF0YSkpO1xuICB9IGNhdGNoIChlcnIpIHtcbiAgICBsb2coJ2Vycm9yJywgJ1VuYWJsZSB0byBwYXJzZSBtb2RwYWNrX2NvbmZpZy5jZmcnLCBlcnIpO1xuICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgdXRpbC5EYXRhSW52YWxpZCgnSW52YWxpZCBtb2RwYWNrX2NvbmZpZy5jZmcgZmlsZScpKTtcbiAgfVxuXG4gIGlmICghZGF0YS5lbnRyaWVzKSB7XG4gICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyB1dGlsLkRhdGFJbnZhbGlkKCdtb2RwYWNrX2NvbmZpZy5jZmcgZmlsZSBjb250YWlucyBubyBlbnRyaWVzJykpXG4gIH1cblxuICBjb25zdCBpbnN0cnVjdGlvbnMgPSBmaWx0ZXJlZC5yZWR1Y2UoKGFjY3VtLCBmaWxlKSA9PiB7XG4gICAgY29uc3QgbWF0Y2hpbmdFbnRyeSA9IGRhdGEuZW50cmllcy5maW5kKGVudHJ5ID0+XG4gICAgICAoJ3NyYycgaW4gZW50cnkpICYmIChlbnRyeS5zcmMudG9Mb3dlckNhc2UoKSA9PT0gZmlsZS50b0xvd2VyQ2FzZSgpKSk7XG4gICAgaWYgKCEhbWF0Y2hpbmdFbnRyeSkge1xuICAgICAgY29uc3QgZGVzdGluYXRpb24gPSBtYXRjaGluZ0VudHJ5LmRlc3Quc3Vic3RyaW5nKE1PRF9DT05GSUdfREVTVF9FTEVNRU5ULmxlbmd0aCk7XG4gICAgICBhY2N1bS5wdXNoKHtcbiAgICAgICAgdHlwZTogJ2NvcHknLFxuICAgICAgICBzb3VyY2U6IGZpbGUsXG4gICAgICAgIGRlc3RpbmF0aW9uLFxuICAgICAgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIFRoaXMgbWF5IGp1c3QgYmUgYSBwb2ludGxlc3MgYWRkaXRpb24gYnkgdGhlIG1vZCBhdXRob3IgLSB3ZSdyZSBnb2luZyB0byBsb2dcbiAgICAgIC8vICB0aGlzIGFuZCBjb250aW51ZS5cbiAgICAgIGxvZygnd2FybicsICdGYWlsZWQgdG8gZmluZCBtYXRjaGluZyBtYW5pZmVzdCBlbnRyeSBmb3IgZmlsZSBpbiBhcmNoaXZlJywgZmlsZSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGFjY3VtO1xuICAgIH0sIFtdKTtcbiAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh7IGluc3RydWN0aW9ucyB9KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHRlc3RJbnN0YWxsZXIoZmlsZXMsIGdhbWVJZCkge1xuICBpZiAoZ2FtZUlkICE9PSBHQU1FX0lEKSB7XG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh7IHN1cHBvcnRlZDogZmFsc2UsIHJlcXVpcmVkRmlsZXM6IFtdIH0pO1xuICB9XG4gIGNvbnN0IGhhbG9HYW1lcyA9IGlkZW50aWZ5SGFsb0dhbWVzKGZpbGVzKTtcbiAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh7XG4gICAgc3VwcG9ydGVkOiAoaGFsb0dhbWVzLmxlbmd0aCA+IDApLFxuICAgIHJlcXVpcmVkRmlsZXM6IFtdLFxuICB9KTtcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGluc3RhbGwoZmlsZXM6IHN0cmluZ1tdLCBkZXN0aW5hdGlvblBhdGg6IHN0cmluZykge1xuICBjb25zdCBoYWxvR2FtZXMgPSAgaWRlbnRpZnlIYWxvR2FtZXMoZmlsZXMpO1xuICBjb25zdCBpbnRlcm5hbElkcyA9IGhhbG9HYW1lcy5tYXAoZ2FtZSA9PiBnYW1lLmludGVybmFsSWQpO1xuICBjb25zdCBhdHRySW5zdHJ1Y3Rpb246IHR5cGVzLklJbnN0cnVjdGlvbiA9IHtcbiAgICB0eXBlOiAnYXR0cmlidXRlJyxcbiAgICBrZXk6ICdoYWxvR2FtZXMnLFxuICAgIHZhbHVlOiBpbnRlcm5hbElkcyxcbiAgfVxuICAgIFxuICBjb25zdCBpbnN0cnVjdGlvbnM6IHR5cGVzLklJbnN0cnVjdGlvbltdID0gaGFsb0dhbWVzLnJlZHVjZSgoYWNjdW0sIGhhbG9HYW1lKSA9PiB7XG4gICAgY29uc3QgZmlsdGVyZWQgPSBmaWxlcy5maWx0ZXIoZmlsZSA9PiB7XG4gICAgICBjb25zdCBzZWdtZW50cyA9IGZpbGUuc3BsaXQocGF0aC5zZXApLmZpbHRlcihzZWcgPT4gISFzZWcpO1xuICAgICAgcmV0dXJuIChwYXRoLmV4dG5hbWUoc2VnbWVudHNbc2VnbWVudHMubGVuZ3RoIC0gMV0pICE9PSAnJylcbiAgICAgICAgJiYgKHNlZ21lbnRzLmluZGV4T2YoaGFsb0dhbWUubW9kc1BhdGgpICE9PSAtMSk7XG4gICAgfSk7XG5cbiAgICBmaWx0ZXJlZC5mb3JFYWNoKGVsZW1lbnQgPT4ge1xuICAgICAgY29uc3Qgc2VnbWVudHMgPSBlbGVtZW50LnNwbGl0KHBhdGguc2VwKS5maWx0ZXIoc2VnID0+ICEhc2VnKTtcbiAgICAgIGNvbnN0IHJvb3RJZHggPSBzZWdtZW50cy5pbmRleE9mKGhhbG9HYW1lLm1vZHNQYXRoKTtcbiAgICAgIGNvbnN0IGRlc3RpbmF0aW9uID0gc2VnbWVudHMuc3BsaWNlKHJvb3RJZHgpLmpvaW4ocGF0aC5zZXApO1xuICAgICAgYWNjdW0ucHVzaCh7XG4gICAgICAgIHR5cGU6ICdjb3B5JyxcbiAgICAgICAgc291cmNlOiBlbGVtZW50LFxuICAgICAgICBkZXN0aW5hdGlvblxuICAgICAgfSk7XG4gICAgfSk7XG4gICAgcmV0dXJuIGFjY3VtO1xuICB9LCBbYXR0ckluc3RydWN0aW9uXSk7XG4gIHJldHVybiBQcm9taXNlLnJlc29sdmUoeyBpbnN0cnVjdGlvbnMgfSk7XG59Il19