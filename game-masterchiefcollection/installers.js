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
exports.testPlugAndPlayInstaller = testPlugAndPlayInstaller;
exports.installPlugAndPlay = installPlugAndPlay;
exports.testModConfigInstaller = testModConfigInstaller;
exports.installModConfig = installModConfig;
exports.testInstaller = testInstaller;
exports.install = install;
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
function installPlugAndPlay(files, destinationPath) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5zdGFsbGVycy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImluc3RhbGxlcnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFTQSw0REFHQztBQUVELGdEQTBDQztBQUVELHdEQWVDO0FBRUQsNENBeUNDO0FBRUQsc0NBU0M7QUFFRCwwQkE2QkM7QUE3SkQsZ0RBQXdCO0FBQ3hCLG9EQUFzQztBQUN0QywyQ0FBa0Q7QUFFbEQscUNBQW9JO0FBRXBJLGlDQUEyQztBQUUzQyxTQUFzQix3QkFBd0IsQ0FBQyxLQUFlLEVBQUUsTUFBYzs7UUFDNUUsTUFBTSxjQUFjLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLGNBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUMsV0FBVyxFQUFFLEtBQUssMkJBQWtCLENBQUMsQ0FBQztRQUNwRyxPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsRUFBRSxTQUFTLEVBQUUsQ0FBQyxNQUFNLEtBQUssZ0JBQU8sQ0FBQyxJQUFJLGNBQWMsRUFBRSxhQUFhLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQztJQUNuRyxDQUFDO0NBQUE7QUFFRCxTQUFzQixrQkFBa0IsQ0FBQyxLQUFlLEVBQUUsZUFBdUI7OztRQUMvRSxNQUFNLE9BQU8sR0FBRyxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsY0FBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxXQUFXLEVBQUUsS0FBSywyQkFBa0IsQ0FBQyxDQUFDO1FBQzdGLE1BQU0sV0FBVyxHQUFHLE1BQU0sZUFBRSxDQUFDLGFBQWEsQ0FBQyxjQUFJLENBQUMsSUFBSSxDQUFDLGVBQWUsRUFBRSxPQUFPLENBQUMsRUFBRSxFQUFFLFFBQVEsRUFBRSxNQUFNLEVBQUUsQ0FBQyxDQUFDO1FBQ3RHLE1BQU0sTUFBTSxHQUFl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LENBQUM7UUFDZixDQUFDLEVBQUUsQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDO1FBQ3RCLE9BQU8sT0FBTyxDQUFDLE9BQU8sQ0FBQyxFQUFFLFlBQVksRUFBRSxDQUFDLENBQUM7SUFDM0MsQ0FBQztDQUFBIiwic291cmNlc0NvbnRlbnQiOlsiLyogZXNsaW50LWRpc2FibGUgKi9cbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0ICogYXMgcmpzb24gZnJvbSAncmVsYXhlZC1qc29uJztcbmltcG9ydCB7IGZzLCB0eXBlcywgbG9nLCB1dGlsIH0gZnJvbSAndm9ydGV4LWFwaSc7XG5cbmltcG9ydCB7IE1PRF9DT05GSUdfREVTVF9FTEVNRU5ULCBNT0RfSU5GT19KU09OX0ZJTEUsIEdBTUVfSUQsIE1PRF9DT05GSUdfRklMRSwgQVNTRU1CTFlfRVhULCBNQVBfRVhULCBIQUxPX0dBTUVTIH0gZnJvbSAnLi9jb21tb24nO1xuaW1wb3J0IHsgSU1vZENvbmZpZyB9IGZyb20gJy4vdHlwZXMnO1xuaW1wb3J0IHsgaWRlbnRpZnlIYWxvR2FtZXMgfSBmcm9tICcuL3V0aWwnO1xuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gdGVzdFBsdWdBbmRQbGF5SW5zdGFsbGVyKGZpbGVzOiBzdHJpbmdbXSwgZ2FtZUlkOiBzdHJpbmcpIHtcbiAgY29uc3QgaGFzTW9kSW5mb0ZpbGUgPSBmaWxlcy5zb21lKGZpbGUgPT4gcGF0aC5iYXNlbmFtZShmaWxlKS50b0xvd2VyQ2FzZSgpID09PSBNT0RfSU5GT19KU09OX0ZJTEUpO1xuICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHsgc3VwcG9ydGVkOiAoZ2FtZUlkID09PSBHQU1FX0lEKSAmJiBoYXNNb2RJbmZvRmlsZSwgcmVxdWlyZWRGaWxlczogW10gfSk7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBpbnN0YWxsUGx1Z0FuZFBsYXkoZmlsZXM6IHN0cmluZ1tdLCBkZXN0aW5hdGlvblBhdGg6IHN0cmluZykge1xuICBjb25zdCBtb2RJbmZvID0gZmlsZXMuZmluZChmaWxlID0+IHBhdGguYmFzZW5hbWUoZmlsZSkudG9Mb3dlckNhc2UoKSA9PT0gTU9EX0lORk9fSlNPTl9GSUxFKTtcbiAgY29uc3QgbW9kSW5mb0RhdGEgPSBhd2FpdCBmcy5yZWFkRmlsZUFzeW5jKHBhdGguam9pbihkZXN0aW5hdGlvblBhdGgsIG1vZEluZm8pLCB7IGVuY29kaW5nOiAndXRmOCcgfSk7XG4gIGNvbnN0IHBhcnNlZDogSU1vZENvbmZpZyA9IHJqc29uLnBhcnNlKG1vZEluZm9EYXRhKSBhcyBJTW9kQ29uZmlnO1xuICBsZXQgbW9kQ29uZmlnQXR0cmlidXRlczogdHlwZXMuSUluc3RydWN0aW9uW10gPSBbXTtcbiAgbW9kQ29uZmlnQXR0cmlidXRlcy5wdXNoKHtcbiAgICB0eXBlOiAnYXR0cmlidXRlJyxcbiAgICBrZXk6ICdoYWxvR2FtZXMnLFxuICAgIHZhbHVlOiBbSEFMT19HQU1FU1twYXJzZWQuRW5naW5lLnRvTG93ZXJDYXNlKCldLmludGVybmFsSWRdLFxuICB9KTtcblxuICBpZiAocGFyc2VkLk1vZFZlcnNpb24gIT09IHVuZGVmaW5lZCkge1xuICAgIG1vZENvbmZpZ0F0dHJpYnV0ZXMucHVzaCh7XG4gICAgICB0eXBlOiAnYXR0cmlidXRlJyxcbiAgICAgIGtleTogJ3ZlcnNpb24nLFxuICAgICAgdmFsdWU6IGAke3BhcnNlZC5Nb2RWZXJzaW9uLk1ham9yIHx8IDB9LiR7cGFyc2VkLk1vZFZlcnNpb24uTWlub3IgfHwgMH0uJHtwYXJzZWQuTW9kVmVyc2lvbi5QYXRjaCB8fCAwfWAsXG4gICAgfSk7XG4gIH1cblxuICBpZiAocGFyc2VkLlRpdGxlPy5OZXV0cmFsICE9PSB1bmRlZmluZWQpIHtcbiAgICBtb2RDb25maWdBdHRyaWJ1dGVzLnB1c2goe1xuICAgICAgdHlwZTogJ2F0dHJpYnV0ZScsXG4gICAgICBrZXk6ICdjdXN0b21GaWxlTmFtZScsXG4gICAgICB2YWx1ZTogcGFyc2VkLlRpdGxlLk5ldXRyYWwsXG4gICAgfSk7XG4gIH1cblxuICBjb25zdCBpbmZvU2VnbWVudHMgPSBtb2RJbmZvLnNwbGl0KHBhdGguc2VwKTtcbiAgY29uc3QgbW9kRm9sZGVySW5kZXggPSBpbmZvU2VnbWVudHMubGVuZ3RoID49IDEgPyBpbmZvU2VnbWVudHMubGVuZ3RoIC0gMSA6IDA7XG4gIGNvbnN0IGZpbHRlcmVkID0gZmlsZXMuZmlsdGVyKGZpbGUgPT4gcGF0aC5leHRuYW1lKHBhdGguYmFzZW5hbWUoZmlsZSkpICE9PSAnJyk7XG4gIGNvbnN0IGluc3RydWN0aW9uczogdHlwZXMuSUluc3RydWN0aW9uW10gPSBmaWx0ZXJlZC5tYXAoZmlsZSA9PiB7XG4gICAgY29uc3Qgc2VnbWVudHMgPSBmaWxlLnNwbGl0KHBhdGguc2VwKTtcbiAgICBjb25zdCBkZXN0aW5hdGlvbiA9IHNlZ21lbnRzLnNsaWNlKG1vZEZvbGRlckluZGV4KTtcbiAgICByZXR1cm4ge1xuICAgICAgdHlwZTogJ2NvcHknLFxuICAgICAgc291cmNlOiBmaWxlLFxuICAgICAgZGVzdGluYXRpb246IGRlc3RpbmF0aW9uLmpvaW4ocGF0aC5zZXApLFxuICAgIH07XG4gIH0pO1xuXG4gIGluc3RydWN0aW9ucy5wdXNoKC4uLm1vZENvbmZpZ0F0dHJpYnV0ZXMpO1xuICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHsgaW5zdHJ1Y3Rpb25zIH0pO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gdGVzdE1vZENvbmZpZ0luc3RhbGxlcihmaWxlcywgZ2FtZUlkKSB7XG4gIGNvbnN0IGlzQXNzZW1ibHlPbmx5TW9kID0gKCkgPT4ge1xuICAgIC8vIFRoZSBwcmVzZW5zZSBvZiBhbiAuYXNtcCBmaWxlIHdpdGhvdXQgYW55IC5tYXAgZmlsZXMgaXMgYSBjbGVhciBpbmRpY2F0aW9uXG4gICAgLy8gIHRoYXQgdGhpcyBtb2QgY2FuIG9ubHkgYmUgaW5zdGFsbGVkIHVzaW5nIHRoZSBBc3NlbWJseSB0b29sIHdoaWNoIHdlJ3ZlXG4gICAgLy8gIHlldCB0byBpbnRlZ3JhdGUgaW50byBWb3J0ZXguIFRoaXMgaW5zdGFsbGVyIHdpbGwgbm90IGluc3RhbGwgdGhlc2UgbW9kcy5cbiAgICByZXR1cm4gKGZpbGVzLmZpbmQoZmlsZSA9PiBwYXRoLmV4dG5hbWUoZmlsZSkgPT09IEFTU0VNQkxZX0VYVCkgIT09IHVuZGVmaW5lZClcbiAgICAgICYmIChmaWxlcy5maW5kKGZpbGUgPT4gcGF0aC5leHRuYW1lKGZpbGUpID09PSBNQVBfRVhUKSA9PT0gdW5kZWZpbmVkKTtcbiAgfTtcbiAgcmV0dXJuIChnYW1lSWQgIT09IEdBTUVfSUQpXG4gICA/IFByb21pc2UucmVzb2x2ZSh7IHN1cHBvcnRlZDogZmFsc2UsIHJlcXVpcmVkRmlsZXM6IFtdIH0pXG4gICA6IFByb21pc2UucmVzb2x2ZSh7XG4gICAgIHN1cHBvcnRlZDogKGZpbGVzLmZpbmQoZmlsZSA9PiBwYXRoLmJhc2VuYW1lKGZpbGUpID09PSBNT0RfQ09ORklHX0ZJTEUpICE9PSB1bmRlZmluZWQpXG4gICAgICAmJiAhaXNBc3NlbWJseU9ubHlNb2QoKSxcbiAgICAgcmVxdWlyZWRGaWxlczogW10sXG4gICAgfSk7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBpbnN0YWxsTW9kQ29uZmlnKGZpbGVzOiBzdHJpbmdbXSwgZGVzdGluYXRpb25QYXRoOiBzdHJpbmcpIHtcbiAgLy8gRmluZCB0aGUgbW9kIGNvbmZpZyBmaWxlIGFuZCB1c2UgaXQgdG8gYnVpbGQgdGhlIGluc3RydWN0aW9ucy5cbiAgY29uc3QgbW9kQ29uZmlnRmlsZSA9IGZpbGVzLmZpbmQoZmlsZSA9PiBwYXRoLmJhc2VuYW1lKGZpbGUpID09PSBNT0RfQ09ORklHX0ZJTEUpO1xuICBjb25zdCBmaWx0ZXJlZCA9IGZpbGVzLmZpbHRlcihmaWxlID0+IHtcbiAgICAvLyBObyBkaXJlY3RvcmllcywgYXNzZW1ibHkgdG9vbCBmaWxlcywgcmVhZG1lcyBvciBtb2QgY29uZmlnIGZpbGVzLlxuICAgIGNvbnN0IHNlZ21lbnRzID0gZmlsZS5zcGxpdChwYXRoLnNlcCk7XG4gICAgY29uc3QgbGFzdEVsZW1lbnRFeHQgPSBwYXRoLmV4dG5hbWUoc2VnbWVudHNbc2VnbWVudHMubGVuZ3RoIC0gMV0pO1xuICAgIHJldHVybiAobW9kQ29uZmlnRmlsZSAhPT0gZmlsZSkgJiYgWycnLCAnLnR4dCcsIEFTU0VNQkxZX0VYVF0uaW5kZXhPZihsYXN0RWxlbWVudEV4dCkgPT09IC0xO1xuICB9KTtcbiAgY29uc3QgY29uZmlnRGF0YSA9IGF3YWl0IGZzLnJlYWRGaWxlQXN5bmMocGF0aC5qb2luKGRlc3RpbmF0aW9uUGF0aCwgbW9kQ29uZmlnRmlsZSksIHsgZW5jb2Rpbmc6ICd1dGY4JyB9KTtcbiAgbGV0IGRhdGE7XG4gIHRyeSB7XG4gICAgZGF0YSA9IHJqc29uLnBhcnNlKHV0aWwuZGVCT00oY29uZmlnRGF0YSkpO1xuICB9IGNhdGNoIChlcnIpIHtcbiAgICBsb2coJ2Vycm9yJywgJ1VuYWJsZSB0byBwYXJzZSBtb2RwYWNrX2NvbmZpZy5jZmcnLCBlcnIpO1xuICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgdXRpbC5EYXRhSW52YWxpZCgnSW52YWxpZCBtb2RwYWNrX2NvbmZpZy5jZmcgZmlsZScpKTtcbiAgfVxuXG4gIGlmICghZGF0YS5lbnRyaWVzKSB7XG4gICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyB1dGlsLkRhdGFJbnZhbGlkKCdtb2RwYWNrX2NvbmZpZy5jZmcgZmlsZSBjb250YWlucyBubyBlbnRyaWVzJykpXG4gIH1cblxuICBjb25zdCBpbnN0cnVjdGlvbnMgPSBmaWx0ZXJlZC5yZWR1Y2UoKGFjY3VtLCBmaWxlKSA9PiB7XG4gICAgY29uc3QgbWF0Y2hpbmdFbnRyeSA9IGRhdGEuZW50cmllcy5maW5kKGVudHJ5ID0+XG4gICAgICAoJ3NyYycgaW4gZW50cnkpICYmIChlbnRyeS5zcmMudG9Mb3dlckNhc2UoKSA9PT0gZmlsZS50b0xvd2VyQ2FzZSgpKSk7XG4gICAgaWYgKCEhbWF0Y2hpbmdFbnRyeSkge1xuICAgICAgY29uc3QgZGVzdGluYXRpb24gPSBtYXRjaGluZ0VudHJ5LmRlc3Quc3Vic3RyaW5nKE1PRF9DT05GSUdfREVTVF9FTEVNRU5ULmxlbmd0aCk7XG4gICAgICBhY2N1bS5wdXNoKHtcbiAgICAgICAgdHlwZTogJ2NvcHknLFxuICAgICAgICBzb3VyY2U6IGZpbGUsXG4gICAgICAgIGRlc3RpbmF0aW9uLFxuICAgICAgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIFRoaXMgbWF5IGp1c3QgYmUgYSBwb2ludGxlc3MgYWRkaXRpb24gYnkgdGhlIG1vZCBhdXRob3IgLSB3ZSdyZSBnb2luZyB0byBsb2dcbiAgICAgIC8vICB0aGlzIGFuZCBjb250aW51ZS5cbiAgICAgIGxvZygnd2FybicsICdGYWlsZWQgdG8gZmluZCBtYXRjaGluZyBtYW5pZmVzdCBlbnRyeSBmb3IgZmlsZSBpbiBhcmNoaXZlJywgZmlsZSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGFjY3VtO1xuICAgIH0sIFtdKTtcbiAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh7IGluc3RydWN0aW9ucyB9KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHRlc3RJbnN0YWxsZXIoZmlsZXMsIGdhbWVJZCkge1xuICBpZiAoZ2FtZUlkICE9PSBHQU1FX0lEKSB7XG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh7IHN1cHBvcnRlZDogZmFsc2UsIHJlcXVpcmVkRmlsZXM6IFtdIH0pO1xuICB9XG4gIGNvbnN0IGhhbG9HYW1lcyA9IGlkZW50aWZ5SGFsb0dhbWVzKGZpbGVzKTtcbiAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh7XG4gICAgc3VwcG9ydGVkOiAoaGFsb0dhbWVzLmxlbmd0aCA+IDApLFxuICAgIHJlcXVpcmVkRmlsZXM6IFtdLFxuICB9KTtcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGluc3RhbGwoZmlsZXM6IHN0cmluZ1tdLCBkZXN0aW5hdGlvblBhdGg6IHN0cmluZykge1xuICBjb25zdCBoYWxvR2FtZXMgPSAgaWRlbnRpZnlIYWxvR2FtZXMoZmlsZXMpO1xuICBjb25zdCBpbnRlcm5hbElkcyA9IGhhbG9HYW1lcy5tYXAoZ2FtZSA9PiBnYW1lLmludGVybmFsSWQpO1xuICBjb25zdCBhdHRySW5zdHJ1Y3Rpb246IHR5cGVzLklJbnN0cnVjdGlvbiA9IHtcbiAgICB0eXBlOiAnYXR0cmlidXRlJyxcbiAgICBrZXk6ICdoYWxvR2FtZXMnLFxuICAgIHZhbHVlOiBpbnRlcm5hbElkcyxcbiAgfVxuICAgIFxuICBjb25zdCBpbnN0cnVjdGlvbnM6IHR5cGVzLklJbnN0cnVjdGlvbltdID0gaGFsb0dhbWVzLnJlZHVjZSgoYWNjdW0sIGhhbG9HYW1lKSA9PiB7XG4gICAgY29uc3QgZmlsdGVyZWQgPSBmaWxlcy5maWx0ZXIoZmlsZSA9PiB7XG4gICAgICBjb25zdCBzZWdtZW50cyA9IGZpbGUuc3BsaXQocGF0aC5zZXApLmZpbHRlcihzZWcgPT4gISFzZWcpO1xuICAgICAgcmV0dXJuIChwYXRoLmV4dG5hbWUoc2VnbWVudHNbc2VnbWVudHMubGVuZ3RoIC0gMV0pICE9PSAnJylcbiAgICAgICAgJiYgKHNlZ21lbnRzLmluZGV4T2YoaGFsb0dhbWUubW9kc1BhdGgpICE9PSAtMSk7XG4gICAgfSk7XG5cbiAgICBmaWx0ZXJlZC5mb3JFYWNoKGVsZW1lbnQgPT4ge1xuICAgICAgY29uc3Qgc2VnbWVudHMgPSBlbGVtZW50LnNwbGl0KHBhdGguc2VwKS5maWx0ZXIoc2VnID0+ICEhc2VnKTtcbiAgICAgIGNvbnN0IHJvb3RJZHggPSBzZWdtZW50cy5pbmRleE9mKGhhbG9HYW1lLm1vZHNQYXRoKTtcbiAgICAgIGNvbnN0IGRlc3RpbmF0aW9uID0gc2VnbWVudHMuc3BsaWNlKHJvb3RJZHgpLmpvaW4ocGF0aC5zZXApO1xuICAgICAgYWNjdW0ucHVzaCh7XG4gICAgICAgIHR5cGU6ICdjb3B5JyxcbiAgICAgICAgc291cmNlOiBlbGVtZW50LFxuICAgICAgICBkZXN0aW5hdGlvblxuICAgICAgfSk7XG4gICAgfSk7XG4gICAgcmV0dXJuIGFjY3VtO1xuICB9LCBbYXR0ckluc3RydWN0aW9uXSk7XG4gIHJldHVybiBQcm9taXNlLnJlc29sdmUoeyBpbnN0cnVjdGlvbnMgfSk7XG59Il19