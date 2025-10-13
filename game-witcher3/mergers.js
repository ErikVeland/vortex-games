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
exports.doMergeSettings = exports.canMergeSettings = exports.canMergeXML = exports.doMergeXML = void 0;
const path_1 = __importDefault(require("path"));
const vortex_api_1 = require("vortex-api");
const xml2js_1 = require("xml2js");
const common_1 = require("./common");
const migrations_1 = require("./migrations");
const util_1 = require("./util");
const ini_1 = __importDefault(require("ini"));
class ModXMLDataInvalid extends vortex_api_1.util.DataInvalid {
    constructor(message, modFilePath) {
        super(`${message}:\n${modFilePath}`);
    }
}
const doMergeXML = (api) => (modFilePath, targetMergeDir) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const modData = yield vortex_api_1.fs.readFileAsync(modFilePath);
        const modXml = yield (0, xml2js_1.parseStringPromise)(modData);
        const modGroups = (_a = modXml === null || modXml === void 0 ? void 0 : modXml.UserConfig) === null || _a === void 0 ? void 0 : _a.Group;
        if (!modGroups) {
            const err = new ModXMLDataInvalid('Invalid XML data - inform mod author', modFilePath);
            api.showErrorNotification('Failed to merge XML data', err, { allowReport: false });
            return Promise.resolve();
        }
        const currentInputFile = yield readXMLInputFile(api, modFilePath, targetMergeDir);
        if (!currentInputFile) {
            return Promise.resolve();
        }
        const mergedXmlData = yield (0, xml2js_1.parseStringPromise)(currentInputFile);
        modGroups.forEach(modGroup => {
            var _a, _b, _c, _d, _e;
            const gameGroups = (_a = mergedXmlData === null || mergedXmlData === void 0 ? void 0 : mergedXmlData.UserConfig) === null || _a === void 0 ? void 0 : _a.Group;
            const modVars = (_c = (_b = modGroup === null || modGroup === void 0 ? void 0 : modGroup.VisibleVars) === null || _b === void 0 ? void 0 : _b[0]) === null || _c === void 0 ? void 0 : _c.Var;
            const gameGroup = gameGroups.find(group => { var _a, _b; return ((_a = group === null || group === void 0 ? void 0 : group.$) === null || _a === void 0 ? void 0 : _a.id) === ((_b = modGroup === null || modGroup === void 0 ? void 0 : modGroup.$) === null || _b === void 0 ? void 0 : _b.id); });
            if (gameGroup) {
                const gameVars = (_e = (_d = gameGroup === null || gameGroup === void 0 ? void 0 : gameGroup.VisibleVars) === null || _d === void 0 ? void 0 : _d[0]) === null || _e === void 0 ? void 0 : _e.Var;
                modVars.forEach(modVar => {
                    const gameVar = gameVars.find(v => { var _a, _b; return ((_a = v === null || v === void 0 ? void 0 : v.$) === null || _a === void 0 ? void 0 : _a.id) === ((_b = modVar === null || modVar === void 0 ? void 0 : modVar.$) === null || _b === void 0 ? void 0 : _b.id); });
                    if (gameVar) {
                        Object.assign(gameVar, modVar);
                    }
                    else {
                        gameVars.push(modVar);
                    }
                });
            }
            else {
                gameGroups.push(modGroup);
            }
        });
        const builder = new xml2js_1.Builder({ doctype: { dtd: 'UTF-16' } });
        const xml = builder.buildObject(mergedXmlData);
        yield vortex_api_1.fs.ensureDirWritableAsync(path_1.default.join(targetMergeDir, common_1.CONFIG_MATRIX_REL_PATH));
        return vortex_api_1.fs.writeFileAsync(path_1.default.join(targetMergeDir, common_1.CONFIG_MATRIX_REL_PATH, path_1.default.basename(modFilePath)), xml);
    }
    catch (err) {
        const activeProfile = vortex_api_1.selectors.activeProfile(api.store.getState());
        if (!(activeProfile === null || activeProfile === void 0 ? void 0 : activeProfile.id)) {
            api.showErrorNotification('Failed to merge XML data', 'No active profile found', { allowReport: false });
            return Promise.resolve();
        }
        const loadOrder = (0, migrations_1.getPersistentLoadOrder)(api);
        const extendedErr = vortex_api_1.util.deepMerge({ modFilePath, targetMergeDir, message: err.message, stack: err.stack }, err);
        api.showErrorNotification('Failed to merge XML data', extendedErr, {
            allowReport: true,
            attachments: [
                {
                    id: `${activeProfile.id}_loadOrder`,
                    type: 'data',
                    data: loadOrder,
                    description: 'Current load order'
                },
            ],
        });
        return Promise.resolve();
    }
});
exports.doMergeXML = doMergeXML;
const canMergeXML = (api) => {
    return (game, gameDiscovery) => {
        if (game.id !== common_1.GAME_ID) {
            return undefined;
        }
        return {
            baseFiles: (deployedFiles) => deployedFiles
                .filter(file => (0, util_1.isXML)(file.relPath))
                .map(file => ({
                in: path_1.default.join(gameDiscovery.path, common_1.CONFIG_MATRIX_REL_PATH, file.relPath),
                out: path_1.default.join(common_1.CONFIG_MATRIX_REL_PATH, file.relPath),
            })),
            filter: filePath => (0, util_1.isXML)(filePath) && common_1.CONFIG_MATRIX_FILES.includes(path_1.default.basename(filePath, path_1.default.extname(filePath))),
        };
    };
};
exports.canMergeXML = canMergeXML;
function readXMLInputFile(api, modFilePath, mergeDirPath) {
    return __awaiter(this, void 0, void 0, function* () {
        const state = api.store.getState();
        const discovery = vortex_api_1.util.getSafe(state, ['settings', 'gameMode', 'discovered', common_1.GAME_ID], undefined);
        if (!(discovery === null || discovery === void 0 ? void 0 : discovery.path)) {
            return Promise.reject({ code: 'ENOENT', message: 'Game is not discovered' });
        }
        const gameInputFilepath = path_1.default.join(discovery.path, common_1.CONFIG_MATRIX_REL_PATH, path_1.default.basename(modFilePath));
        const mergedFilePath = path_1.default.join(mergeDirPath, common_1.CONFIG_MATRIX_REL_PATH, path_1.default.basename(modFilePath));
        const backupFilePath = gameInputFilepath + common_1.VORTEX_BACKUP_TAG;
        try {
            let inputFileData;
            if (yield (0, util_1.fileExists)(mergedFilePath)) {
                inputFileData = vortex_api_1.fs.readFileAsync(mergedFilePath);
            }
            else if (yield (0, util_1.fileExists)(backupFilePath)) {
                inputFileData = vortex_api_1.fs.readFileAsync(backupFilePath);
            }
            else {
                inputFileData = vortex_api_1.fs.readFileAsync(gameInputFilepath);
            }
            return inputFileData;
        }
        catch (err) {
            const res = yield api.showDialog('error', 'Failed to read merged/native xml file', {
                text: 'A native XML file is missing. Please verify your game files through the game store client.',
            }, [
                { label: 'Close', default: true },
            ], 'w3-xml-merge-fail');
            return Promise.resolve(null);
        }
    });
}
const canMergeSettings = (api) => {
    return (game, gameDiscovery) => {
        if (game.id !== common_1.GAME_ID) {
            return undefined;
        }
        return {
            baseFiles: (deployedFiles) => deployedFiles
                .filter(file => (0, util_1.isSettingsFile)(path_1.default.basename(file.relPath)))
                .map(file => ({
                in: path_1.default.join((0, util_1.getDocumentsPath)(game), path_1.default.basename(file.relPath)),
                out: path_1.default.basename(file.relPath),
            })),
            filter: filePath => (0, util_1.isSettingsFile)(filePath),
        };
    };
};
exports.canMergeSettings = canMergeSettings;
const doMergeSettings = (api) => (modFilePath, targetMergeDir) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const modData = yield vortex_api_1.fs.readFileAsync(modFilePath, { encoding: 'utf8' });
        const modIniData = ini_1.default.parse(modData);
        const currentSettingsFile = yield readSettingsFile(api, modFilePath, targetMergeDir);
        const mergedIniData = ini_1.default.parse(currentSettingsFile);
        Object.keys(modIniData).forEach(section => {
            if (!mergedIniData[section]) {
                mergedIniData[section] = modIniData[section];
            }
            else {
                Object.keys(modIniData[section]).forEach(key => {
                    mergedIniData[section][key] = modIniData[section][key];
                });
            }
        });
        const mergedIniString = ini_1.default.stringify(mergedIniData);
        yield vortex_api_1.fs.ensureDirWritableAsync(targetMergeDir);
        return vortex_api_1.fs.writeFileAsync(path_1.default.join(targetMergeDir, path_1.default.basename(modFilePath)), mergedIniString);
    }
    catch (err) {
        const state = api.store.getState();
        const activeProfile = vortex_api_1.selectors.activeProfile(state);
        const loadOrder = (0, migrations_1.getPersistentLoadOrder)(api);
        const extendedErr = vortex_api_1.util.deepMerge({ modFilePath, targetMergeDir, message: err.message, stack: err.stack }, err);
        const mergedData = yield readSettingsFile(api, modFilePath, targetMergeDir);
        const modData = yield vortex_api_1.fs.readFileAsync(modFilePath, { encoding: 'utf8' });
        api.showErrorNotification('Failed to merge settings data', extendedErr, {
            allowReport: true,
            attachments: [
                {
                    id: `${activeProfile.id}_loadOrder`,
                    type: 'data',
                    data: loadOrder,
                    description: 'Current load order'
                },
                {
                    id: `${activeProfile.id}_merged_settings`,
                    type: 'data',
                    data: mergedData,
                    description: 'Merged settings'
                },
                {
                    id: `${activeProfile.id}_mod_settings`,
                    type: 'data',
                    data: modData,
                    description: 'Mod settings'
                }
            ],
        });
        return Promise.resolve();
    }
});
exports.doMergeSettings = doMergeSettings;
function readSettingsFile(api, modFilePath, mergeDirPath) {
    return __awaiter(this, void 0, void 0, function* () {
        const state = api.store.getState();
        const discovery = vortex_api_1.util.getSafe(state, ['settings', 'gameMode', 'discovered', common_1.GAME_ID], undefined);
        if (!(discovery === null || discovery === void 0 ? void 0 : discovery.path)) {
            return Promise.reject({ code: 'ENOENT', message: 'Game is not discovered' });
        }
        const gameSettingsFilepath = path_1.default.join((0, util_1.getDocumentsPath)(discovery), path_1.default.basename(modFilePath));
        const mergedFilePath = path_1.default.join(mergeDirPath, path_1.default.basename(modFilePath));
        const backupFilePath = gameSettingsFilepath + common_1.VORTEX_BACKUP_TAG;
        try {
            if (yield (0, util_1.fileExists)(mergedFilePath)) {
                return vortex_api_1.fs.readFileAsync(mergedFilePath);
            }
            if (yield (0, util_1.fileExists)(backupFilePath)) {
                return vortex_api_1.fs.readFileAsync(backupFilePath);
            }
            return vortex_api_1.fs.readFileAsync(gameSettingsFilepath);
        }
        catch (err) {
            return Promise.reject(err);
        }
    });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWVyZ2Vycy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIm1lcmdlcnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7O0FBQ0EsZ0RBQXdCO0FBQ3hCLDJDQUF3RDtBQUN4RCxtQ0FBcUQ7QUFFckQscUNBQW1HO0FBQ25HLDZDQUFzRDtBQUN0RCxpQ0FBNkU7QUFDN0UsOENBQXNCO0FBRXRCLE1BQU0saUJBQWtCLFNBQVEsaUJBQUksQ0FBQyxXQUFXO0lBQzlDLFlBQVksT0FBZSxFQUFFLFdBQW1CO1FBQzlDLEtBQUssQ0FBQyxHQUFHLE9BQU8sTUFBTSxXQUFXLEVBQUUsQ0FBQyxDQUFDO0lBQ3ZDLENBQUM7Q0FDRjtBQWNNLE1BQU0sVUFBVSxHQUFHLENBQUMsR0FBd0IsRUFBRSxFQUFFLENBQUMsQ0FBTyxXQUFtQixFQUFFLGNBQXNCLEVBQUUsRUFBRTs7SUFDNUcsSUFBSSxDQUFDO1FBQ0gsTUFBTSxPQUFPLEdBQUcsTUFBTSxlQUFFLENBQUMsYUFBYSxDQUFDLFdBQVcsQ0FBQyxDQUFDO1FBQ3BELE1BQU0sTUFBTSxHQUFHLE1BQU0sSUFBQSwyQkFBa0IsRUFBQyxPQUFPLENBQUMsQ0FBQztRQUNqRCxNQUFNLFNBQVMsR0FBRyxNQUFBLE1BQU0sYUFBTixNQUFNLHVCQUFOLE1BQU0sQ0FBRSxVQUFVLDBDQUFFLEtBQUssQ0FBQztRQUM1QyxJQUFJLENBQUMsU0FBUyxFQUFFLENBQUM7WUFDZixNQUFNLEdBQUcsR0FBRyxJQUFJLGlCQUFpQixDQUFDLHNDQUFzQyxFQUFFLFdBQVcsQ0FBQyxDQUFDO1lBQ3ZGLEdBQUcsQ0FBQyxxQkFBcUIsQ0FBQywwQkFBMEIsRUFBRSxHQUFHLEVBQUUsRUFBRSxXQUFXLEVBQUUsS0FBSyxFQUFFLENBQUMsQ0FBQztZQUNuRixPQUFPLE9BQU8sQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUMzQixDQUFDO1FBQ0QsTUFBTSxnQkFBZ0IsR0FBRyxNQUFNLGdCQUFnQixDQUFDLEdBQUcsRUFB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WUFDRCxPQUFPLGVBQUUsQ0FBQyxhQUFhLENBQUMsb0JBQW9CLENBQUMsQ0FBQztRQUNoRCxDQUFDO1FBQUMsT0FBTyxHQUFHLEVBQUUsQ0FBQztZQUNiLE9BQU8sT0FBTyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUM3QixDQUFDO0lBQ0gsQ0FBQztDQUFBIiwic291cmNlc0NvbnRlbnQiOlsiLyogZXNsaW50LWRpc2FibGUgKi9cbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0IHsgZnMsIHR5cGVzLCBzZWxlY3RvcnMsIHV0aWwgfSBmcm9tICd2b3J0ZXgtYXBpJztcbmltcG9ydCB7IEJ1aWxkZXIsIHBhcnNlU3RyaW5nUHJvbWlzZSB9IGZyb20gJ3htbDJqcyc7XG5cbmltcG9ydCB7IEdBTUVfSUQsIENPTkZJR19NQVRSSVhfUkVMX1BBVEgsIENPTkZJR19NQVRSSVhfRklMRVMsIFZPUlRFWF9CQUNLVVBfVEFHIH0gZnJvbSAnLi9jb21tb24nO1xuaW1wb3J0IHsgZ2V0UGVyc2lzdGVudExvYWRPcmRlciB9IGZyb20gJy4vbWlncmF0aW9ucyc7XG5pbXBvcnQgeyBmaWxlRXhpc3RzLCBnZXREb2N1bWVudHNQYXRoLCBpc1NldHRpbmdzRmlsZSwgaXNYTUwgfSBmcm9tICcuL3V0aWwnO1xuaW1wb3J0IGluaSBmcm9tICdpbmknO1xuXG5jbGFzcyBNb2RYTUxEYXRhSW52YWxpZCBleHRlbmRzIHV0aWwuRGF0YUludmFsaWQge1xuICBjb25zdHJ1Y3RvcihtZXNzYWdlOiBzdHJpbmcsIG1vZEZpbGVQYXRoOiBzdHJpbmcpIHtcbiAgICBzdXBlcihgJHttZXNzYWdlfTpcXG4ke21vZEZpbGVQYXRofWApO1xuICB9XG59XG5cbi8vIEV4YW1wbGUgb2YgaG93IHdlIGV4cGVjdCB0aGUgdmFycyB0byBiZSB3cmFwcGVkOlxuLy8gPD94bWwgdmVyc2lvbj1cIjEuMFwiIGVuY29kaW5nPVwiVVRGLTE2XCI/PlxuLy8gPFVzZXJDb25maWc+XG4vLyBcdDxHcm91cCBidWlsZGVyPVwiSW5wdXRcIiBpZD1cIlBDSW5wdXRcIiBkaXNwbGF5TmFtZT1cImNvbnRyb2xzX3BjXCIgdGFncz1cImtleWJpbmRzXCI+XG4vLyBcdFx0PFZpc2libGVWYXJzPlxuLy8gXHRcdFx0PFZhciBidWlsZGVyPVwiSW5wdXRcIiBpZD1cIk1vdmVGd2RcIlx0XHRcdFx0XHRkaXNwbGF5TmFtZT1cIm1vdmVfZm9yd2FyZFwiXHRcdFx0XHRcdFx0ZGlzcGxheVR5cGU9XCJJTlBVVFBDXCIgYWN0aW9ucz1cIk1vdmVGb3J3YXJkO01vdmVtZW50RG91YmxlVGFwVztDaGFuZ2VDaG9pY2VVcFwiLz5cbi8vIFx0XHRcdDxWYXIgYnVpbGRlcj1cIklucHV0XCIgaWQ9XCJNb3ZlQmNrXCJcdFx0XHRcdFx0ZGlzcGxheU5hbWU9XCJtb3ZlX2JhY2tcIlx0XHRcdFx0XHRcdFx0ZGlzcGxheVR5cGU9XCJJTlBVVFBDXCIgYWN0aW9ucz1cIk1vdmVCYWNrd2FyZDtNb3ZlbWVudERvdWJsZVRhcFM7Q2hhbmdlQ2hvaWNlRG93bjtHSV9EZWNlbGVyYXRlXCIvPlxuLy8gICAgIDwvVmlzaWJsZVZhcnM+XG4vLyBcdDwvR3JvdXA+XG4vLyA8L1VzZXJDb25maWc+XG4vLyBBZGRpbmcgYSBncm91cCB3aXRoIGEgZGlmZmVyZW50IGlkIHdpbGwgY3JlYXRlIGEgbmV3IGdyb3VwIGluIHRoZSBnYW1lJ3MgaW5wdXQueG1sXG4vLyAgZmlsZSwgaWYgdGhlIGdyb3VwIGFscmVhZHkgZXhpc3RzIGl0IHdpbGwgbWVyZ2UgdGhlIHZhcnMgaW50byB0aGUgZXhpc3RpbmcgZ3JvdXAuXG5leHBvcnQgY29uc3QgZG9NZXJnZVhNTCA9IChhcGk6IHR5cGVzLklFeHRlbnNpb25BcGkpID0+IGFzeW5jIChtb2RGaWxlUGF0aDogc3RyaW5nLCB0YXJnZXRNZXJnZURpcjogc3RyaW5nKSA9PiB7XG4gIHRyeSB7XG4gICAgY29uc3QgbW9kRGF0YSA9IGF3YWl0IGZzLnJlYWRGaWxlQXN5bmMobW9kRmlsZVBhdGgpO1xuICAgIGNvbnN0IG1vZFhtbCA9IGF3YWl0IHBhcnNlU3RyaW5nUHJvbWlzZShtb2REYXRhKTtcbiAgICBjb25zdCBtb2RHcm91cHMgPSBtb2RYbWw/LlVzZXJDb25maWc/Lkdyb3VwO1xuICAgIGlmICghbW9kR3JvdXBzKSB7XG4gICAgICBjb25zdCBlcnIgPSBuZXcgTW9kWE1MRGF0YUludmFsaWQoJ0ludmFsaWQgWE1MIGRhdGEgLSBpbmZvcm0gbW9kIGF1dGhvcicsIG1vZEZpbGVQYXRoKTtcbiAgICAgIGFwaS5zaG93RXJyb3JOb3RpZmljYXRpb24oJ0ZhaWxlZCB0byBtZXJnZSBYTUwgZGF0YScsIGVyciwgeyBhbGxvd1JlcG9ydDogZmFsc2UgfSk7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG4gICAgfVxuICAgIGNvbnN0IGN1cnJlbnRJbnB1dEZpbGUgPSBhd2FpdCByZWFkWE1MSW5wdXRGaWxlKGFwaSwgbW9kRmlsZVBhdGgsIHRhcmdldE1lcmdlRGlyKTtcbiAgICBpZiAoIWN1cnJlbnRJbnB1dEZpbGUpIHtcbiAgICAgIC8vIElmIHRoZSBjdXJyZW50IGlucHV0IGZpbGUgaXMgbm90IGZvdW5kLCB3ZSBjYW5ub3QgbWVyZ2UsIHNvIHdlIGp1c3QgcmV0dXJuLlxuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xuICAgIH1cbiAgICBjb25zdCBtZXJnZWRYbWxEYXRhID0gYXdhaXQgcGFyc2VTdHJpbmdQcm9taXNlKGN1cnJlbnRJbnB1dEZpbGUpO1xuICAgIG1vZEdyb3Vwcy5mb3JFYWNoKG1vZEdyb3VwID0+IHtcbiAgICAgIGNvbnN0IGdhbWVHcm91cHMgPSBtZXJnZWRYbWxEYXRhPy5Vc2VyQ29uZmlnPy5Hcm91cDtcbiAgICAgIGNvbnN0IG1vZFZhcnMgPSBtb2RHcm91cD8uVmlzaWJsZVZhcnM/LlswXT8uVmFyO1xuICAgICAgY29uc3QgZ2FtZUdyb3VwID0gZ2FtZUdyb3Vwcy5maW5kKGdyb3VwID0+IGdyb3VwPy4kPy5pZCA9PT0gbW9kR3JvdXA/LiQ/LmlkKTtcbiAgICAgIGlmIChnYW1lR3JvdXApIHtcbiAgICAgICAgY29uc3QgZ2FtZVZhcnMgPSBnYW1lR3JvdXA/LlZpc2libGVWYXJzPy5bMF0/LlZhcjtcbiAgICAgICAgbW9kVmFycy5mb3JFYWNoKG1vZFZhciA9PiB7XG4gICAgICAgICAgY29uc3QgZ2FtZVZhciA9IGdhbWVWYXJzLmZpbmQodiA9PiB2Py4kPy5pZCA9PT0gbW9kVmFyPy4kPy5pZCk7XG4gICAgICAgICAgaWYgKGdhbWVWYXIpIHtcbiAgICAgICAgICAgIE9iamVjdC5hc3NpZ24oZ2FtZVZhciwgbW9kVmFyKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZ2FtZVZhcnMucHVzaChtb2RWYXIpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBnYW1lR3JvdXBzLnB1c2gobW9kR3JvdXApO1xuICAgICAgfVxuICAgIH0pO1xuICAgIGNvbnN0IGJ1aWxkZXIgPSBuZXcgQnVpbGRlcih7IGRvY3R5cGU6IHsgZHRkOiAnVVRGLTE2JyB9IH0pO1xuICAgIGNvbnN0IHhtbCA9IGJ1aWxkZXIuYnVpbGRPYmplY3QobWVyZ2VkWG1sRGF0YSk7XG4gICAgYXdhaXQgZnMuZW5zdXJlRGlyV3JpdGFibGVBc3luYyhwYXRoLmpvaW4odGFyZ2V0TWVyZ2VEaXIsIENPTkZJR19NQVRSSVhfUkVMX1BBVEgpKTtcbiAgICByZXR1cm4gZnMud3JpdGVGaWxlQXN5bmMocGF0aC5qb2luKHRhcmdldE1lcmdlRGlyLCBDT05GSUdfTUFUUklYX1JFTF9QQVRILCBwYXRoLmJhc2VuYW1lKG1vZEZpbGVQYXRoKSksIHhtbCk7XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIGNvbnN0IGFjdGl2ZVByb2ZpbGUgPSBzZWxlY3RvcnMuYWN0aXZlUHJvZmlsZShhcGkuc3RvcmUuZ2V0U3RhdGUoKSk7XG4gICAgaWYgKCFhY3RpdmVQcm9maWxlPy5pZCkge1xuICAgICAgYXBpLnNob3dFcnJvck5vdGlmaWNhdGlvbignRmFpbGVkIHRvIG1lcmdlIFhNTCBkYXRhJywgJ05vIGFjdGl2ZSBwcm9maWxlIGZvdW5kJywgeyBhbGxvd1JlcG9ydDogZmFsc2UgfSk7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG4gICAgfVxuICAgIGNvbnN0IGxvYWRPcmRlciA9IGdldFBlcnNpc3RlbnRMb2FkT3JkZXIoYXBpKTtcbiAgICBjb25zdCBleHRlbmRlZEVyciA9IHV0aWwuZGVlcE1lcmdlKHsgbW9kRmlsZVBhdGgsIHRhcmdldE1lcmdlRGlyLCBtZXNzYWdlOiBlcnIubWVzc2FnZSwgc3RhY2s6IGVyci5zdGFjayB9LCBlcnIpO1xuICAgIGFwaS5zaG93RXJyb3JOb3RpZmljYXRpb24oJ0ZhaWxlZCB0byBtZXJnZSBYTUwgZGF0YScsIGV4dGVuZGVkRXJyLCB7XG4gICAgICBhbGxvd1JlcG9ydDogdHJ1ZSxcbiAgICAgIGF0dGFjaG1lbnRzOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBpZDogYCR7YWN0aXZlUHJvZmlsZS5pZH1fbG9hZE9yZGVyYCxcbiAgICAgICAgICB0eXBlOiAnZGF0YScsXG4gICAgICAgICAgZGF0YTogbG9hZE9yZGVyLFxuICAgICAgICAgIGRlc2NyaXB0aW9uOiAnQ3VycmVudCBsb2FkIG9yZGVyJ1xuICAgICAgICB9LFxuICAgICAgXSxcbiAgICB9KTtcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG4gIH1cbn1cblxuZXhwb3J0IGNvbnN0IGNhbk1lcmdlWE1MID0gKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSkgPT4ge1xuICByZXR1cm4gKGdhbWUsIGdhbWVEaXNjb3ZlcnkpID0+IHtcbiAgICBpZiAoZ2FtZS5pZCAhPT0gR0FNRV9JRCkge1xuICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgYmFzZUZpbGVzOiAoZGVwbG95ZWRGaWxlczogdHlwZXMuSURlcGxveWVkRmlsZVtdKSA9PiBkZXBsb3llZEZpbGVzXG4gICAgICAgIC5maWx0ZXIoZmlsZSA9PiBpc1hNTChmaWxlLnJlbFBhdGgpKVxuICAgICAgICAubWFwKGZpbGUgPT4gKHtcbiAgICAgICAgICBpbjogcGF0aC5qb2luKGdhbWVEaXNjb3ZlcnkucGF0aCwgQ09ORklHX01BVFJJWF9SRUxfUEFUSCwgZmlsZS5yZWxQYXRoKSxcbiAgICAgICAgICBvdXQ6IHBhdGguam9pbihDT05GSUdfTUFUUklYX1JFTF9QQVRILCBmaWxlLnJlbFBhdGgpLFxuICAgICAgICB9KSksXG4gICAgICBmaWx0ZXI6IGZpbGVQYXRoID0+IGlzWE1MKGZpbGVQYXRoKSAmJiBDT05GSUdfTUFUUklYX0ZJTEVTLmluY2x1ZGVzKHBhdGguYmFzZW5hbWUoZmlsZVBhdGgsIHBhdGguZXh0bmFtZShmaWxlUGF0aCkpKSxcbiAgICB9O1xuICB9XG59XG5cbmFzeW5jIGZ1bmN0aW9uIHJlYWRYTUxJbnB1dEZpbGUoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpLCBtb2RGaWxlUGF0aDogc3RyaW5nLCBtZXJnZURpclBhdGg6IHN0cmluZykge1xuICBjb25zdCBzdGF0ZSA9IGFwaS5zdG9yZS5nZXRTdGF0ZSgpO1xuICBjb25zdCBkaXNjb3ZlcnkgPSB1dGlsLmdldFNhZmUoc3RhdGUsIFsnc2V0dGluZ3MnLCAnZ2FtZU1vZGUnLCAnZGlzY292ZXJlZCcsIEdBTUVfSURdLCB1bmRlZmluZWQpO1xuICBpZiAoIWRpc2NvdmVyeT8ucGF0aCkge1xuICAgIHJldHVybiBQcm9taXNlLnJlamVjdCh7IGNvZGU6ICdFTk9FTlQnLCBtZXNzYWdlOiAnR2FtZSBpcyBub3QgZGlzY292ZXJlZCcgfSk7XG4gIH1cbiAgY29uc3QgZ2FtZUlucHV0RmlsZXBhdGggPSBwYXRoLmpvaW4oZGlzY292ZXJ5LnBhdGgsIENPTkZJR19NQVRSSVhfUkVMX1BBVEgsIHBhdGguYmFzZW5hbWUobW9kRmlsZVBhdGgpKTtcbiAgY29uc3QgbWVyZ2VkRmlsZVBhdGggPSBwYXRoLmpvaW4obWVyZ2VEaXJQYXRoLCBDT05GSUdfTUFUUklYX1JFTF9QQVRILCBwYXRoLmJhc2VuYW1lKG1vZEZpbGVQYXRoKSk7XG4gIGNvbnN0IGJhY2t1cEZpbGVQYXRoID0gZ2FtZUlucHV0RmlsZXBhdGggKyBWT1JURVhfQkFDS1VQX1RBRztcbiAgdHJ5IHtcbiAgICBsZXQgaW5wdXRGaWxlRGF0YTtcbiAgICBpZiAoYXdhaXQgZmlsZUV4aXN0cyhtZXJnZWRGaWxlUGF0aCkpIHtcbiAgICAgIGlucHV0RmlsZURhdGEgPSBmcy5yZWFkRmlsZUFzeW5jKG1lcmdlZEZpbGVQYXRoKTtcbiAgICB9IGVsc2UgaWYgKGF3YWl0IGZpbGVFeGlzdHMoYmFja3VwRmlsZVBhdGgpKSB7XG4gICAgICBpbnB1dEZpbGVEYXRhID0gZnMucmVhZEZpbGVBc3luYyhiYWNrdXBGaWxlUGF0aCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGlucHV0RmlsZURhdGEgPSBmcy5yZWFkRmlsZUFzeW5jKGdhbWVJbnB1dEZpbGVwYXRoKTtcbiAgICB9XG4gICAgcmV0dXJuIGlucHV0RmlsZURhdGE7XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIGNvbnN0IHJlcyA9IGF3YWl0IGFwaS5zaG93RGlhbG9nKCdlcnJvcicsICdGYWlsZWQgdG8gcmVhZCBtZXJnZWQvbmF0aXZlIHhtbCBmaWxlJywge1xuICAgICAgdGV4dDogJ0EgbmF0aXZlIFhNTCBmaWxlIGlzIG1pc3NpbmcuIFBsZWFzZSB2ZXJpZnkgeW91ciBnYW1lIGZpbGVzIHRocm91Z2ggdGhlIGdhbWUgc3RvcmUgY2xpZW50LicsXG4gICAgfSwgW1xuICAgICAgeyBsYWJlbDogJ0Nsb3NlJywgZGVmYXVsdDogdHJ1ZSB9LFxuICAgIF0sICd3My14bWwtbWVyZ2UtZmFpbCcpO1xuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUobnVsbCk7XG4gIH1cbn1cblxuLy8jcmVnaW9uIGV4cGVyaW1lbnRhbCBzZXR0aW5ncyBtZXJnZVxuLy8gVGhpcyBpcyBhbiBleHBlcmltZW50YWwgZmVhdHVyZSB0aGF0IHdpbGwgbWVyZ2Ugc2V0dGluZ3MgZmlsZXMgaW4gdGhlIGdhbWUncyBkb2N1bWVudHMgZm9sZGVyLlxuLy8gIGN1cnJlbnRseSB1bnVzZWQgZHVlIHRvIHRyb3VibGVzb21lIG1pZ3JhdGlvbiBmcm9tIHRoZSBvbGQgc2V0dGluZ3Mgc3lzdGVtLlxuZXhwb3J0IGNvbnN0IGNhbk1lcmdlU2V0dGluZ3MgPSAoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpKSA9PiB7XG4gIHJldHVybiAoZ2FtZTogdHlwZXMuSUdhbWUsIGdhbWVEaXNjb3Zlcnk6IHR5cGVzLklEaXNjb3ZlcnlSZXN1bHQpID0+IHtcbiAgICBpZiAoZ2FtZS5pZCAhPT0gR0FNRV9JRCkge1xuICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9XG4gICAgLy8gaWYgKGlzU2V0dGluZ3NNZXJnZVN1cHByZXNzZWQoYXBpKSkge1xuICAgIC8vICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICAvLyB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgYmFzZUZpbGVzOiAoZGVwbG95ZWRGaWxlczogdHlwZXMuSURlcGxveWVkRmlsZVtdKSA9PiBkZXBsb3llZEZpbGVzXG4gICAgICAgIC5maWx0ZXIoZmlsZSA9PiBpc1NldHRpbmdzRmlsZShwYXRoLmJhc2VuYW1lKGZpbGUucmVsUGF0aCkpKVxuICAgICAgICAubWFwKGZpbGUgPT4gKHtcbiAgICAgICAgICBpbjogcGF0aC5qb2luKGdldERvY3VtZW50c1BhdGgoZ2FtZSksIHBhdGguYmFzZW5hbWUoZmlsZS5yZWxQYXRoKSksXG4gICAgICAgICAgb3V0OiBwYXRoLmJhc2VuYW1lKGZpbGUucmVsUGF0aCksXG4gICAgICAgIH0pKSxcbiAgICAgIGZpbHRlcjogZmlsZVBhdGggPT4gaXNTZXR0aW5nc0ZpbGUoZmlsZVBhdGgpLFxuICAgIH07XG4gIH07XG59XG5cbmV4cG9ydCBjb25zdCBkb01lcmdlU2V0dGluZ3MgPSAoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpKSA9PiBhc3luYyAobW9kRmlsZVBhdGg6IHN0cmluZywgdGFyZ2V0TWVyZ2VEaXI6IHN0cmluZykgPT4ge1xuICAvLyBpZiAoaXNTZXR0aW5nc01lcmdlU3VwcHJlc3NlZChhcGkpKSB7XG4gIC8vICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xuICAvLyB9XG5cbiAgdHJ5IHtcbiAgICBjb25zdCBtb2REYXRhID0gYXdhaXQgZnMucmVhZEZpbGVBc3luYyhtb2RGaWxlUGF0aCwgeyBlbmNvZGluZzogJ3V0ZjgnIH0pO1xuICAgIGNvbnN0IG1vZEluaURhdGEgPSBpbmkucGFyc2UobW9kRGF0YSk7XG4gICAgY29uc3QgY3VycmVudFNldHRpbmdzRmlsZSA9IGF3YWl0IHJlYWRTZXR0aW5nc0ZpbGUoYXBpLCBtb2RGaWxlUGF0aCwgdGFyZ2V0TWVyZ2VEaXIpO1xuICAgIGNvbnN0IG1lcmdlZEluaURhdGEgPSBpbmkucGFyc2UoY3VycmVudFNldHRpbmdzRmlsZSk7XG4gICAgT2JqZWN0LmtleXMobW9kSW5pRGF0YSkuZm9yRWFjaChzZWN0aW9uID0+IHtcbiAgICAgIGlmICghbWVyZ2VkSW5pRGF0YVtzZWN0aW9uXSkge1xuICAgICAgICBtZXJnZWRJbmlEYXRhW3NlY3Rpb25dID0gbW9kSW5pRGF0YVtzZWN0aW9uXTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIE9iamVjdC5rZXlzKG1vZEluaURhdGFbc2VjdGlvbl0pLmZvckVhY2goa2V5ID0+IHtcbiAgICAgICAgICBtZXJnZWRJbmlEYXRhW3NlY3Rpb25dW2tleV0gPSBtb2RJbmlEYXRhW3NlY3Rpb25dW2tleV07XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgY29uc3QgbWVyZ2VkSW5pU3RyaW5nID0gaW5pLnN0cmluZ2lmeShtZXJnZWRJbmlEYXRhKTtcbiAgICBhd2FpdCBmcy5lbnN1cmVEaXJXcml0YWJsZUFzeW5jKHRhcmdldE1lcmdlRGlyKTtcbiAgICByZXR1cm4gZnMud3JpdGVGaWxlQXN5bmMocGF0aC5qb2luKHRhcmdldE1lcmdlRGlyLCBwYXRoLmJhc2VuYW1lKG1vZEZpbGVQYXRoKSksIG1lcmdlZEluaVN0cmluZyk7XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIGNvbnN0IHN0YXRlID0gYXBpLnN0b3JlLmdldFN0YXRlKCk7XG4gICAgY29uc3QgYWN0aXZlUHJvZmlsZSA9IHNlbGVjdG9ycy5hY3RpdmVQcm9maWxlKHN0YXRlKTtcbiAgICBjb25zdCBsb2FkT3JkZXIgPSBnZXRQZXJzaXN0ZW50TG9hZE9yZGVyKGFwaSk7XG4gICAgY29uc3QgZXh0ZW5kZWRFcnIgPSB1dGlsLmRlZXBNZXJnZSh7IG1vZEZpbGVQYXRoLCB0YXJnZXRNZXJnZURpciwgbWVzc2FnZTogZXJyLm1lc3NhZ2UsIHN0YWNrOiBlcnIuc3RhY2sgfSwgZXJyKTtcbiAgICBjb25zdCBtZXJnZWREYXRhID0gYXdhaXQgcmVhZFNldHRpbmdzRmlsZShhcGksIG1vZEZpbGVQYXRoLCB0YXJnZXRNZXJnZURpcik7XG4gICAgY29uc3QgbW9kRGF0YSA9IGF3YWl0IGZzLnJlYWRGaWxlQXN5bmMobW9kRmlsZVBhdGgsIHsgZW5jb2Rpbmc6ICd1dGY4JyB9KTtcbiAgICBhcGkuc2hvd0Vycm9yTm90aWZpY2F0aW9uKCdGYWlsZWQgdG8gbWVyZ2Ugc2V0dGluZ3MgZGF0YScsIGV4dGVuZGVkRXJyLCB7XG4gICAgICBhbGxvd1JlcG9ydDogdHJ1ZSxcbiAgICAgIGF0dGFjaG1lbnRzOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBpZDogYCR7YWN0aXZlUHJvZmlsZS5pZH1fbG9hZE9yZGVyYCxcbiAgICAgICAgICB0eXBlOiAnZGF0YScsXG4gICAgICAgICAgZGF0YTogbG9hZE9yZGVyLFxuICAgICAgICAgIGRlc2NyaXB0aW9uOiAnQ3VycmVudCBsb2FkIG9yZGVyJ1xuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgaWQ6IGAke2FjdGl2ZVByb2ZpbGUuaWR9X21lcmdlZF9zZXR0aW5nc2AsXG4gICAgICAgICAgdHlwZTogJ2RhdGEnLFxuICAgICAgICAgIGRhdGE6IG1lcmdlZERhdGEsXG4gICAgICAgICAgZGVzY3JpcHRpb246ICdNZXJnZWQgc2V0dGluZ3MnXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBpZDogYCR7YWN0aXZlUHJvZmlsZS5pZH1fbW9kX3NldHRpbmdzYCxcbiAgICAgICAgICB0eXBlOiAnZGF0YScsXG4gICAgICAgICAgZGF0YTogbW9kRGF0YSxcbiAgICAgICAgICBkZXNjcmlwdGlvbjogJ01vZCBzZXR0aW5ncydcbiAgICAgICAgfVxuICAgICAgXSxcbiAgICB9KTtcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG4gIH1cbn1cblxuYXN5bmMgZnVuY3Rpb24gcmVhZFNldHRpbmdzRmlsZShhcGk6IHR5cGVzLklFeHRlbnNpb25BcGksIG1vZEZpbGVQYXRoOiBzdHJpbmcsIG1lcmdlRGlyUGF0aDogc3RyaW5nKSB7XG4gIGNvbnN0IHN0YXRlID0gYXBpLnN0b3JlLmdldFN0YXRlKCk7XG4gIGNvbnN0IGRpc2NvdmVyeSA9IHV0aWwuZ2V0U2FmZShzdGF0ZSwgWydzZXR0aW5ncycsICdnYW1lTW9kZScsICdkaXNjb3ZlcmVkJywgR0FNRV9JRF0sIHVuZGVmaW5lZCk7XG4gIGlmICghZGlzY292ZXJ5Py5wYXRoKSB7XG4gICAgcmV0dXJuIFByb21pc2UucmVqZWN0KHsgY29kZTogJ0VOT0VOVCcsIG1lc3NhZ2U6ICdHYW1lIGlzIG5vdCBkaXNjb3ZlcmVkJyB9KTtcbiAgfVxuICBjb25zdCBnYW1lU2V0dGluZ3NGaWxlcGF0aCA9IHBhdGguam9pbihnZXREb2N1bWVudHNQYXRoKGRpc2NvdmVyeSksIHBhdGguYmFzZW5hbWUobW9kRmlsZVBhdGgpKTtcbiAgY29uc3QgbWVyZ2VkRmlsZVBhdGggPSBwYXRoLmpvaW4obWVyZ2VEaXJQYXRoLCBwYXRoLmJhc2VuYW1lKG1vZEZpbGVQYXRoKSk7XG4gIGNvbnN0IGJhY2t1cEZpbGVQYXRoID0gZ2FtZVNldHRpbmdzRmlsZXBhdGggKyBWT1JURVhfQkFDS1VQX1RBRztcbiAgdHJ5IHtcbiAgICBpZiAoYXdhaXQgZmlsZUV4aXN0cyhtZXJnZWRGaWxlUGF0aCkpIHtcbiAgICAgIHJldHVybiBmcy5yZWFkRmlsZUFzeW5jKG1lcmdlZEZpbGVQYXRoKTtcbiAgICB9XG4gICAgaWYgKGF3YWl0IGZpbGVFeGlzdHMoYmFja3VwRmlsZVBhdGgpKSB7XG4gICAgICByZXR1cm4gZnMucmVhZEZpbGVBc3luYyhiYWNrdXBGaWxlUGF0aCk7XG4gICAgfVxuICAgIHJldHVybiBmcy5yZWFkRmlsZUFzeW5jKGdhbWVTZXR0aW5nc0ZpbGVwYXRoKTtcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgcmV0dXJuIFByb21pc2UucmVqZWN0KGVycik7XG4gIH1cbn1cblxuLy8jZW5kcmVnaW9uIl19