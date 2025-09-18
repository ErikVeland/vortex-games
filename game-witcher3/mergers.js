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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWVyZ2Vycy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIm1lcmdlcnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7O0FBQ0EsZ0RBQXdCO0FBQ3hCLDJDQUF3RDtBQUN4RCxtQ0FBcUQ7QUFFckQscUNBQW1HO0FBQ25HLDZDQUFzRDtBQUN0RCxpQ0FBNkU7QUFDN0UsOENBQXNCO0FBRXRCLE1BQU0saUJBQWtCLFNBQVEsaUJBQUksQ0FBQyxXQUFXO0lBQzlDLFlBQVksT0FBZSxFQUFFLFdBQW1CO1FBQzlDLEtBQUssQ0FBQyxHQUFHLE9BQU8sTUFBTSxXQUFXLEVBQUUsQ0FBQyxDQUFDO0lBQ3ZDLENBQUM7Q0FDRjtBQWNNLE1BQU0sVUFBVSxHQUFHLENBQUMsR0FBd0IsRUFBRSxFQUFFLENBQUMsQ0FBTyxXQUFtQixFQUFFLGNBQXNCLEVBQUUsRUFBRTs7SUFDNUcsSUFBSTtRQUNGLE1BQU0sT0FBTyxHQUFHLE1BQU0sZUFBRSxDQUFDLGFBQWEsQ0FBQyxXQUFXLENBQUMsQ0FBQztRQUNwRCxNQUFNLE1BQU0sR0FBRyxNQUFNLElBQUEsMkJBQWtCLEVBQUMsT0FBTyxDQUFDLENBQUM7UUFDakQsTUFBTSxTQUFTLEdBQUcsTUFBQSxNQUFNLGFBQU4sTUFBTSx1QkFBTixNQUFNLENBQUUsVUFBVSwwQ0FBRSxLQUFLLENBQUM7UUFDNUMsSUFBSSxDQUFDLFNBQVMsRUFBRTtZQUNkLE1BQU0sR0FBRyxHQUFHLElBQUksaUJBQWlCLENBQUMsc0NBQXNDLEVBQUUsV0FBVyxDQUFDLENBQUM7WUFDdkYsR0FBRyxDQUFDLHFCQUFxQixDQUFDLDBCQUEwQixFQUFFLEdBQUcsRUFBRSxFQUFFLFdBQVcsRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFDO1lBQ25GLE9BQU8sT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFDO1NBQzFCO1FBQ0QsTUFBTSxnQkFBZ0IsR0FBRyxNQUFNLGdCQUFnQixDQUFDLEdBQUcsRUFBRSxXQUFXLEVBQUUsY0FB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QUFFLGdCQUFPLENBQUMsRUFBRSxTQUFTLENBQUMsQ0FBQztRQUNsRyxJQUFJLENBQUMsQ0FBQSxTQUFTLGFBQVQsU0FBUyx1QkFBVCxTQUFTLENBQUUsSUFBSSxDQUFBLEVBQUU7WUFDcEIsT0FBTyxPQUFPLENBQUMsTUFBTSxDQUFDLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxPQUFPLEVBQUUsd0JBQXdCLEVBQUUsQ0FBQyxDQUFDO1NBQzlFO1FBQ0QsTUFBTSxvQkFBb0IsR0FBRyxjQUFJLENBQUMsSUFBSSxDQUFDLElBQUEsdUJBQWdCLEVBQUMsU0FBUyxDQUFDLEVBQUUsY0FBSSxDQUFDLFFBQVEsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDO1FBQ2hHLE1BQU0sY0FBYyxHQUFHLGNBQUksQ0FBQyxJQUFJLENBQUMsWUFBWSxFQUFFLGNBQUksQ0FBQyxRQUFRLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQztRQUMzRSxNQUFNLGNBQWMsR0FBRyxvQkFBb0IsR0FBRywwQkFBaUIsQ0FBQztRQUNoRSxJQUFJO1lBQ0YsSUFBSSxNQUFNLElBQUEsaUJBQVUsRUFBQyxjQUFjLENBQUMsRUFBRTtnQkFDcEMsT0FBTyxlQUFFLENBQUMsYUFBYSxDQUFDLGNBQWMsQ0FBQyxDQUFDO2FBQ3pDO1lBQ0QsSUFBSSxNQUFNLElBQUEsaUJBQVUsRUFBQyxjQUFjLENBQUMsRUFBRTtnQkFDcEMsT0FBTyxlQUFFLENBQUMsYUFBYSxDQUFDLGNBQWMsQ0FBQyxDQUFDO2FBQ3pDO1lBQ0QsT0FBTyxlQUFFLENBQUMsYUFBYSxDQUFDLG9CQUFvQixDQUFDLENBQUM7U0FDL0M7UUFBQyxPQUFPLEdBQUcsRUFBRTtZQUNaLE9BQU8sT0FBTyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQztTQUM1QjtJQUNILENBQUM7Q0FBQSIsInNvdXJjZXNDb250ZW50IjpbIi8qIGVzbGludC1kaXNhYmxlICovXG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcbmltcG9ydCB7IGZzLCB0eXBlcywgc2VsZWN0b3JzLCB1dGlsIH0gZnJvbSAndm9ydGV4LWFwaSc7XG5pbXBvcnQgeyBCdWlsZGVyLCBwYXJzZVN0cmluZ1Byb21pc2UgfSBmcm9tICd4bWwyanMnO1xuXG5pbXBvcnQgeyBHQU1FX0lELCBDT05GSUdfTUFUUklYX1JFTF9QQVRILCBDT05GSUdfTUFUUklYX0ZJTEVTLCBWT1JURVhfQkFDS1VQX1RBRyB9IGZyb20gJy4vY29tbW9uJztcbmltcG9ydCB7IGdldFBlcnNpc3RlbnRMb2FkT3JkZXIgfSBmcm9tICcuL21pZ3JhdGlvbnMnO1xuaW1wb3J0IHsgZmlsZUV4aXN0cywgZ2V0RG9jdW1lbnRzUGF0aCwgaXNTZXR0aW5nc0ZpbGUsIGlzWE1MIH0gZnJvbSAnLi91dGlsJztcbmltcG9ydCBpbmkgZnJvbSAnaW5pJztcblxuY2xhc3MgTW9kWE1MRGF0YUludmFsaWQgZXh0ZW5kcyB1dGlsLkRhdGFJbnZhbGlkIHtcbiAgY29uc3RydWN0b3IobWVzc2FnZTogc3RyaW5nLCBtb2RGaWxlUGF0aDogc3RyaW5nKSB7XG4gICAgc3VwZXIoYCR7bWVzc2FnZX06XFxuJHttb2RGaWxlUGF0aH1gKTtcbiAgfVxufVxuXG4vLyBFeGFtcGxlIG9mIGhvdyB3ZSBleHBlY3QgdGhlIHZhcnMgdG8gYmUgd3JhcHBlZDpcbi8vIDw/eG1sIHZlcnNpb249XCIxLjBcIiBlbmNvZGluZz1cIlVURi0xNlwiPz5cbi8vIDxVc2VyQ29uZmlnPlxuLy8gXHQ8R3JvdXAgYnVpbGRlcj1cIklucHV0XCIgaWQ9XCJQQ0lucHV0XCIgZGlzcGxheU5hbWU9XCJjb250cm9sc19wY1wiIHRhZ3M9XCJrZXliaW5kc1wiPlxuLy8gXHRcdDxWaXNpYmxlVmFycz5cbi8vIFx0XHRcdDxWYXIgYnVpbGRlcj1cIklucHV0XCIgaWQ9XCJNb3ZlRndkXCJcdFx0XHRcdFx0ZGlzcGxheU5hbWU9XCJtb3ZlX2ZvcndhcmRcIlx0XHRcdFx0XHRcdGRpc3BsYXlUeXBlPVwiSU5QVVRQQ1wiIGFjdGlvbnM9XCJNb3ZlRm9yd2FyZDtNb3ZlbWVudERvdWJsZVRhcFc7Q2hhbmdlQ2hvaWNlVXBcIi8+XG4vLyBcdFx0XHQ8VmFyIGJ1aWxkZXI9XCJJbnB1dFwiIGlkPVwiTW92ZUJja1wiXHRcdFx0XHRcdGRpc3BsYXlOYW1lPVwibW92ZV9iYWNrXCJcdFx0XHRcdFx0XHRcdGRpc3BsYXlUeXBlPVwiSU5QVVRQQ1wiIGFjdGlvbnM9XCJNb3ZlQmFja3dhcmQ7TW92ZW1lbnREb3VibGVUYXBTO0NoYW5nZUNob2ljZURvd247R0lfRGVjZWxlcmF0ZVwiLz5cbi8vICAgICA8L1Zpc2libGVWYXJzPlxuLy8gXHQ8L0dyb3VwPlxuLy8gPC9Vc2VyQ29uZmlnPlxuLy8gQWRkaW5nIGEgZ3JvdXAgd2l0aCBhIGRpZmZlcmVudCBpZCB3aWxsIGNyZWF0ZSBhIG5ldyBncm91cCBpbiB0aGUgZ2FtZSdzIGlucHV0LnhtbFxuLy8gIGZpbGUsIGlmIHRoZSBncm91cCBhbHJlYWR5IGV4aXN0cyBpdCB3aWxsIG1lcmdlIHRoZSB2YXJzIGludG8gdGhlIGV4aXN0aW5nIGdyb3VwLlxuZXhwb3J0IGNvbnN0IGRvTWVyZ2VYTUwgPSAoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpKSA9PiBhc3luYyAobW9kRmlsZVBhdGg6IHN0cmluZywgdGFyZ2V0TWVyZ2VEaXI6IHN0cmluZykgPT4ge1xuICB0cnkge1xuICAgIGNvbnN0IG1vZERhdGEgPSBhd2FpdCBmcy5yZWFkRmlsZUFzeW5jKG1vZEZpbGVQYXRoKTtcbiAgICBjb25zdCBtb2RYbWwgPSBhd2FpdCBwYXJzZVN0cmluZ1Byb21pc2UobW9kRGF0YSk7XG4gICAgY29uc3QgbW9kR3JvdXBzID0gbW9kWG1sPy5Vc2VyQ29uZmlnPy5Hcm91cDtcbiAgICBpZiAoIW1vZEdyb3Vwcykge1xuICAgICAgY29uc3QgZXJyID0gbmV3IE1vZFhNTERhdGFJbnZhbGlkKCdJbnZhbGlkIFhNTCBkYXRhIC0gaW5mb3JtIG1vZCBhdXRob3InLCBtb2RGaWxlUGF0aCk7XG4gICAgICBhcGkuc2hvd0Vycm9yTm90aWZpY2F0aW9uKCdGYWlsZWQgdG8gbWVyZ2UgWE1MIGRhdGEnLCBlcnIsIHsgYWxsb3dSZXBvcnQ6IGZhbHNlIH0pO1xuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xuICAgIH1cbiAgICBjb25zdCBjdXJyZW50SW5wdXRGaWxlID0gYXdhaXQgcmVhZFhNTElucHV0RmlsZShhcGksIG1vZEZpbGVQYXRoLCB0YXJnZXRNZXJnZURpcik7XG4gICAgaWYgKCFjdXJyZW50SW5wdXRGaWxlKSB7XG4gICAgICAvLyBJZiB0aGUgY3VycmVudCBpbnB1dCBmaWxlIGlzIG5vdCBmb3VuZCwgd2UgY2Fubm90IG1lcmdlLCBzbyB3ZSBqdXN0IHJldHVybi5cbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcbiAgICB9XG4gICAgY29uc3QgbWVyZ2VkWG1sRGF0YSA9IGF3YWl0IHBhcnNlU3RyaW5nUHJvbWlzZShjdXJyZW50SW5wdXRGaWxlKTtcbiAgICBtb2RHcm91cHMuZm9yRWFjaChtb2RHcm91cCA9PiB7XG4gICAgICBjb25zdCBnYW1lR3JvdXBzID0gbWVyZ2VkWG1sRGF0YT8uVXNlckNvbmZpZz8uR3JvdXA7XG4gICAgICBjb25zdCBtb2RWYXJzID0gbW9kR3JvdXA/LlZpc2libGVWYXJzPy5bMF0/LlZhcjtcbiAgICAgIGNvbnN0IGdhbWVHcm91cCA9IGdhbWVHcm91cHMuZmluZChncm91cCA9PiBncm91cD8uJD8uaWQgPT09IG1vZEdyb3VwPy4kPy5pZCk7XG4gICAgICBpZiAoZ2FtZUdyb3VwKSB7XG4gICAgICAgIGNvbnN0IGdhbWVWYXJzID0gZ2FtZUdyb3VwPy5WaXNpYmxlVmFycz8uWzBdPy5WYXI7XG4gICAgICAgIG1vZFZhcnMuZm9yRWFjaChtb2RWYXIgPT4ge1xuICAgICAgICAgIGNvbnN0IGdhbWVWYXIgPSBnYW1lVmFycy5maW5kKHYgPT4gdj8uJD8uaWQgPT09IG1vZFZhcj8uJD8uaWQpO1xuICAgICAgICAgIGlmIChnYW1lVmFyKSB7XG4gICAgICAgICAgICBPYmplY3QuYXNzaWduKGdhbWVWYXIsIG1vZFZhcik7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGdhbWVWYXJzLnB1c2gobW9kVmFyKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZ2FtZUdyb3Vwcy5wdXNoKG1vZEdyb3VwKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICBjb25zdCBidWlsZGVyID0gbmV3IEJ1aWxkZXIoeyBkb2N0eXBlOiB7IGR0ZDogJ1VURi0xNicgfSB9KTtcbiAgICBjb25zdCB4bWwgPSBidWlsZGVyLmJ1aWxkT2JqZWN0KG1lcmdlZFhtbERhdGEpO1xuICAgIGF3YWl0IGZzLmVuc3VyZURpcldyaXRhYmxlQXN5bmMocGF0aC5qb2luKHRhcmdldE1lcmdlRGlyLCBDT05GSUdfTUFUUklYX1JFTF9QQVRIKSk7XG4gICAgcmV0dXJuIGZzLndyaXRlRmlsZUFzeW5jKHBhdGguam9pbih0YXJnZXRNZXJnZURpciwgQ09ORklHX01BVFJJWF9SRUxfUEFUSCwgcGF0aC5iYXNlbmFtZShtb2RGaWxlUGF0aCkpLCB4bWwpO1xuICB9IGNhdGNoIChlcnIpIHtcbiAgICBjb25zdCBhY3RpdmVQcm9maWxlID0gc2VsZWN0b3JzLmFjdGl2ZVByb2ZpbGUoYXBpLnN0b3JlLmdldFN0YXRlKCkpO1xuICAgIGlmICghYWN0aXZlUHJvZmlsZT8uaWQpIHtcbiAgICAgIGFwaS5zaG93RXJyb3JOb3RpZmljYXRpb24oJ0ZhaWxlZCB0byBtZXJnZSBYTUwgZGF0YScsICdObyBhY3RpdmUgcHJvZmlsZSBmb3VuZCcsIHsgYWxsb3dSZXBvcnQ6IGZhbHNlIH0pO1xuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xuICAgIH1cbiAgICBjb25zdCBsb2FkT3JkZXIgPSBnZXRQZXJzaXN0ZW50TG9hZE9yZGVyKGFwaSk7XG4gICAgY29uc3QgZXh0ZW5kZWRFcnIgPSB1dGlsLmRlZXBNZXJnZSh7IG1vZEZpbGVQYXRoLCB0YXJnZXRNZXJnZURpciwgbWVzc2FnZTogZXJyLm1lc3NhZ2UsIHN0YWNrOiBlcnIuc3RhY2sgfSwgZXJyKTtcbiAgICBhcGkuc2hvd0Vycm9yTm90aWZpY2F0aW9uKCdGYWlsZWQgdG8gbWVyZ2UgWE1MIGRhdGEnLCBleHRlbmRlZEVyciwge1xuICAgICAgYWxsb3dSZXBvcnQ6IHRydWUsXG4gICAgICBhdHRhY2htZW50czogW1xuICAgICAgICB7XG4gICAgICAgICAgaWQ6IGAke2FjdGl2ZVByb2ZpbGUuaWR9X2xvYWRPcmRlcmAsXG4gICAgICAgICAgdHlwZTogJ2RhdGEnLFxuICAgICAgICAgIGRhdGE6IGxvYWRPcmRlcixcbiAgICAgICAgICBkZXNjcmlwdGlvbjogJ0N1cnJlbnQgbG9hZCBvcmRlcidcbiAgICAgICAgfSxcbiAgICAgIF0sXG4gICAgfSk7XG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xuICB9XG59XG5cbmV4cG9ydCBjb25zdCBjYW5NZXJnZVhNTCA9IChhcGk6IHR5cGVzLklFeHRlbnNpb25BcGkpID0+IHtcbiAgcmV0dXJuIChnYW1lLCBnYW1lRGlzY292ZXJ5KSA9PiB7XG4gICAgaWYgKGdhbWUuaWQgIT09IEdBTUVfSUQpIHtcbiAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgIGJhc2VGaWxlczogKGRlcGxveWVkRmlsZXM6IHR5cGVzLklEZXBsb3llZEZpbGVbXSkgPT4gZGVwbG95ZWRGaWxlc1xuICAgICAgICAuZmlsdGVyKGZpbGUgPT4gaXNYTUwoZmlsZS5yZWxQYXRoKSlcbiAgICAgICAgLm1hcChmaWxlID0+ICh7XG4gICAgICAgICAgaW46IHBhdGguam9pbihnYW1lRGlzY292ZXJ5LnBhdGgsIENPTkZJR19NQVRSSVhfUkVMX1BBVEgsIGZpbGUucmVsUGF0aCksXG4gICAgICAgICAgb3V0OiBwYXRoLmpvaW4oQ09ORklHX01BVFJJWF9SRUxfUEFUSCwgZmlsZS5yZWxQYXRoKSxcbiAgICAgICAgfSkpLFxuICAgICAgZmlsdGVyOiBmaWxlUGF0aCA9PiBpc1hNTChmaWxlUGF0aCkgJiYgQ09ORklHX01BVFJJWF9GSUxFUy5pbmNsdWRlcyhwYXRoLmJhc2VuYW1lKGZpbGVQYXRoLCBwYXRoLmV4dG5hbWUoZmlsZVBhdGgpKSksXG4gICAgfTtcbiAgfVxufVxuXG5hc3luYyBmdW5jdGlvbiByZWFkWE1MSW5wdXRGaWxlKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSwgbW9kRmlsZVBhdGg6IHN0cmluZywgbWVyZ2VEaXJQYXRoOiBzdHJpbmcpIHtcbiAgY29uc3Qgc3RhdGUgPSBhcGkuc3RvcmUuZ2V0U3RhdGUoKTtcbiAgY29uc3QgZGlzY292ZXJ5ID0gdXRpbC5nZXRTYWZlKHN0YXRlLCBbJ3NldHRpbmdzJywgJ2dhbWVNb2RlJywgJ2Rpc2NvdmVyZWQnLCBHQU1FX0lEXSwgdW5kZWZpbmVkKTtcbiAgaWYgKCFkaXNjb3Zlcnk/LnBhdGgpIHtcbiAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoeyBjb2RlOiAnRU5PRU5UJywgbWVzc2FnZTogJ0dhbWUgaXMgbm90IGRpc2NvdmVyZWQnIH0pO1xuICB9XG4gIGNvbnN0IGdhbWVJbnB1dEZpbGVwYXRoID0gcGF0aC5qb2luKGRpc2NvdmVyeS5wYXRoLCBDT05GSUdfTUFUUklYX1JFTF9QQVRILCBwYXRoLmJhc2VuYW1lKG1vZEZpbGVQYXRoKSk7XG4gIGNvbnN0IG1lcmdlZEZpbGVQYXRoID0gcGF0aC5qb2luKG1lcmdlRGlyUGF0aCwgQ09ORklHX01BVFJJWF9SRUxfUEFUSCwgcGF0aC5iYXNlbmFtZShtb2RGaWxlUGF0aCkpO1xuICBjb25zdCBiYWNrdXBGaWxlUGF0aCA9IGdhbWVJbnB1dEZpbGVwYXRoICsgVk9SVEVYX0JBQ0tVUF9UQUc7XG4gIHRyeSB7XG4gICAgbGV0IGlucHV0RmlsZURhdGE7XG4gICAgaWYgKGF3YWl0IGZpbGVFeGlzdHMobWVyZ2VkRmlsZVBhdGgpKSB7XG4gICAgICBpbnB1dEZpbGVEYXRhID0gZnMucmVhZEZpbGVBc3luYyhtZXJnZWRGaWxlUGF0aCk7XG4gICAgfSBlbHNlIGlmIChhd2FpdCBmaWxlRXhpc3RzKGJhY2t1cEZpbGVQYXRoKSkge1xuICAgICAgaW5wdXRGaWxlRGF0YSA9IGZzLnJlYWRGaWxlQXN5bmMoYmFja3VwRmlsZVBhdGgpO1xuICAgIH0gZWxzZSB7XG4gICAgICBpbnB1dEZpbGVEYXRhID0gZnMucmVhZEZpbGVBc3luYyhnYW1lSW5wdXRGaWxlcGF0aCk7XG4gICAgfVxuICAgIHJldHVybiBpbnB1dEZpbGVEYXRhO1xuICB9IGNhdGNoIChlcnIpIHtcbiAgICBjb25zdCByZXMgPSBhd2FpdCBhcGkuc2hvd0RpYWxvZygnZXJyb3InLCAnRmFpbGVkIHRvIHJlYWQgbWVyZ2VkL25hdGl2ZSB4bWwgZmlsZScsIHtcbiAgICAgIHRleHQ6ICdBIG5hdGl2ZSBYTUwgZmlsZSBpcyBtaXNzaW5nLiBQbGVhc2UgdmVyaWZ5IHlvdXIgZ2FtZSBmaWxlcyB0aHJvdWdoIHRoZSBnYW1lIHN0b3JlIGNsaWVudC4nLFxuICAgIH0sIFtcbiAgICAgIHsgbGFiZWw6ICdDbG9zZScsIGRlZmF1bHQ6IHRydWUgfSxcbiAgICBdLCAndzMteG1sLW1lcmdlLWZhaWwnKTtcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKG51bGwpO1xuICB9XG59XG5cbi8vI3JlZ2lvbiBleHBlcmltZW50YWwgc2V0dGluZ3MgbWVyZ2Vcbi8vIFRoaXMgaXMgYW4gZXhwZXJpbWVudGFsIGZlYXR1cmUgdGhhdCB3aWxsIG1lcmdlIHNldHRpbmdzIGZpbGVzIGluIHRoZSBnYW1lJ3MgZG9jdW1lbnRzIGZvbGRlci5cbi8vICBjdXJyZW50bHkgdW51c2VkIGR1ZSB0byB0cm91Ymxlc29tZSBtaWdyYXRpb24gZnJvbSB0aGUgb2xkIHNldHRpbmdzIHN5c3RlbS5cbmV4cG9ydCBjb25zdCBjYW5NZXJnZVNldHRpbmdzID0gKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSkgPT4ge1xuICByZXR1cm4gKGdhbWU6IHR5cGVzLklHYW1lLCBnYW1lRGlzY292ZXJ5OiB0eXBlcy5JRGlzY292ZXJ5UmVzdWx0KSA9PiB7XG4gICAgaWYgKGdhbWUuaWQgIT09IEdBTUVfSUQpIHtcbiAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfVxuICAgIC8vIGlmIChpc1NldHRpbmdzTWVyZ2VTdXBwcmVzc2VkKGFwaSkpIHtcbiAgICAvLyAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgLy8gfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgIGJhc2VGaWxlczogKGRlcGxveWVkRmlsZXM6IHR5cGVzLklEZXBsb3llZEZpbGVbXSkgPT4gZGVwbG95ZWRGaWxlc1xuICAgICAgICAuZmlsdGVyKGZpbGUgPT4gaXNTZXR0aW5nc0ZpbGUocGF0aC5iYXNlbmFtZShmaWxlLnJlbFBhdGgpKSlcbiAgICAgICAgLm1hcChmaWxlID0+ICh7XG4gICAgICAgICAgaW46IHBhdGguam9pbihnZXREb2N1bWVudHNQYXRoKGdhbWUpLCBwYXRoLmJhc2VuYW1lKGZpbGUucmVsUGF0aCkpLFxuICAgICAgICAgIG91dDogcGF0aC5iYXNlbmFtZShmaWxlLnJlbFBhdGgpLFxuICAgICAgICB9KSksXG4gICAgICBmaWx0ZXI6IGZpbGVQYXRoID0+IGlzU2V0dGluZ3NGaWxlKGZpbGVQYXRoKSxcbiAgICB9O1xuICB9O1xufVxuXG5leHBvcnQgY29uc3QgZG9NZXJnZVNldHRpbmdzID0gKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSkgPT4gYXN5bmMgKG1vZEZpbGVQYXRoOiBzdHJpbmcsIHRhcmdldE1lcmdlRGlyOiBzdHJpbmcpID0+IHtcbiAgLy8gaWYgKGlzU2V0dGluZ3NNZXJnZVN1cHByZXNzZWQoYXBpKSkge1xuICAvLyAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcbiAgLy8gfVxuXG4gIHRyeSB7XG4gICAgY29uc3QgbW9kRGF0YSA9IGF3YWl0IGZzLnJlYWRGaWxlQXN5bmMobW9kRmlsZVBhdGgsIHsgZW5jb2Rpbmc6ICd1dGY4JyB9KTtcbiAgICBjb25zdCBtb2RJbmlEYXRhID0gaW5pLnBhcnNlKG1vZERhdGEpO1xuICAgIGNvbnN0IGN1cnJlbnRTZXR0aW5nc0ZpbGUgPSBhd2FpdCByZWFkU2V0dGluZ3NGaWxlKGFwaSwgbW9kRmlsZVBhdGgsIHRhcmdldE1lcmdlRGlyKTtcbiAgICBjb25zdCBtZXJnZWRJbmlEYXRhID0gaW5pLnBhcnNlKGN1cnJlbnRTZXR0aW5nc0ZpbGUpO1xuICAgIE9iamVjdC5rZXlzKG1vZEluaURhdGEpLmZvckVhY2goc2VjdGlvbiA9PiB7XG4gICAgICBpZiAoIW1lcmdlZEluaURhdGFbc2VjdGlvbl0pIHtcbiAgICAgICAgbWVyZ2VkSW5pRGF0YVtzZWN0aW9uXSA9IG1vZEluaURhdGFbc2VjdGlvbl07XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBPYmplY3Qua2V5cyhtb2RJbmlEYXRhW3NlY3Rpb25dKS5mb3JFYWNoKGtleSA9PiB7XG4gICAgICAgICAgbWVyZ2VkSW5pRGF0YVtzZWN0aW9uXVtrZXldID0gbW9kSW5pRGF0YVtzZWN0aW9uXVtrZXldO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIGNvbnN0IG1lcmdlZEluaVN0cmluZyA9IGluaS5zdHJpbmdpZnkobWVyZ2VkSW5pRGF0YSk7XG4gICAgYXdhaXQgZnMuZW5zdXJlRGlyV3JpdGFibGVBc3luYyh0YXJnZXRNZXJnZURpcik7XG4gICAgcmV0dXJuIGZzLndyaXRlRmlsZUFzeW5jKHBhdGguam9pbih0YXJnZXRNZXJnZURpciwgcGF0aC5iYXNlbmFtZShtb2RGaWxlUGF0aCkpLCBtZXJnZWRJbmlTdHJpbmcpO1xuICB9IGNhdGNoIChlcnIpIHtcbiAgICBjb25zdCBzdGF0ZSA9IGFwaS5zdG9yZS5nZXRTdGF0ZSgpO1xuICAgIGNvbnN0IGFjdGl2ZVByb2ZpbGUgPSBzZWxlY3RvcnMuYWN0aXZlUHJvZmlsZShzdGF0ZSk7XG4gICAgY29uc3QgbG9hZE9yZGVyID0gZ2V0UGVyc2lzdGVudExvYWRPcmRlcihhcGkpO1xuICAgIGNvbnN0IGV4dGVuZGVkRXJyID0gdXRpbC5kZWVwTWVyZ2UoeyBtb2RGaWxlUGF0aCwgdGFyZ2V0TWVyZ2VEaXIsIG1lc3NhZ2U6IGVyci5tZXNzYWdlLCBzdGFjazogZXJyLnN0YWNrIH0sIGVycik7XG4gICAgY29uc3QgbWVyZ2VkRGF0YSA9IGF3YWl0IHJlYWRTZXR0aW5nc0ZpbGUoYXBpLCBtb2RGaWxlUGF0aCwgdGFyZ2V0TWVyZ2VEaXIpO1xuICAgIGNvbnN0IG1vZERhdGEgPSBhd2FpdCBmcy5yZWFkRmlsZUFzeW5jKG1vZEZpbGVQYXRoLCB7IGVuY29kaW5nOiAndXRmOCcgfSk7XG4gICAgYXBpLnNob3dFcnJvck5vdGlmaWNhdGlvbignRmFpbGVkIHRvIG1lcmdlIHNldHRpbmdzIGRhdGEnLCBleHRlbmRlZEVyciwge1xuICAgICAgYWxsb3dSZXBvcnQ6IHRydWUsXG4gICAgICBhdHRhY2htZW50czogW1xuICAgICAgICB7XG4gICAgICAgICAgaWQ6IGAke2FjdGl2ZVByb2ZpbGUuaWR9X2xvYWRPcmRlcmAsXG4gICAgICAgICAgdHlwZTogJ2RhdGEnLFxuICAgICAgICAgIGRhdGE6IGxvYWRPcmRlcixcbiAgICAgICAgICBkZXNjcmlwdGlvbjogJ0N1cnJlbnQgbG9hZCBvcmRlcidcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIGlkOiBgJHthY3RpdmVQcm9maWxlLmlkfV9tZXJnZWRfc2V0dGluZ3NgLFxuICAgICAgICAgIHR5cGU6ICdkYXRhJyxcbiAgICAgICAgICBkYXRhOiBtZXJnZWREYXRhLFxuICAgICAgICAgIGRlc2NyaXB0aW9uOiAnTWVyZ2VkIHNldHRpbmdzJ1xuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgaWQ6IGAke2FjdGl2ZVByb2ZpbGUuaWR9X21vZF9zZXR0aW5nc2AsXG4gICAgICAgICAgdHlwZTogJ2RhdGEnLFxuICAgICAgICAgIGRhdGE6IG1vZERhdGEsXG4gICAgICAgICAgZGVzY3JpcHRpb246ICdNb2Qgc2V0dGluZ3MnXG4gICAgICAgIH1cbiAgICAgIF0sXG4gICAgfSk7XG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xuICB9XG59XG5cbmFzeW5jIGZ1bmN0aW9uIHJlYWRTZXR0aW5nc0ZpbGUoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpLCBtb2RGaWxlUGF0aDogc3RyaW5nLCBtZXJnZURpclBhdGg6IHN0cmluZykge1xuICBjb25zdCBzdGF0ZSA9IGFwaS5zdG9yZS5nZXRTdGF0ZSgpO1xuICBjb25zdCBkaXNjb3ZlcnkgPSB1dGlsLmdldFNhZmUoc3RhdGUsIFsnc2V0dGluZ3MnLCAnZ2FtZU1vZGUnLCAnZGlzY292ZXJlZCcsIEdBTUVfSURdLCB1bmRlZmluZWQpO1xuICBpZiAoIWRpc2NvdmVyeT8ucGF0aCkge1xuICAgIHJldHVybiBQcm9taXNlLnJlamVjdCh7IGNvZGU6ICdFTk9FTlQnLCBtZXNzYWdlOiAnR2FtZSBpcyBub3QgZGlzY292ZXJlZCcgfSk7XG4gIH1cbiAgY29uc3QgZ2FtZVNldHRpbmdzRmlsZXBhdGggPSBwYXRoLmpvaW4oZ2V0RG9jdW1lbnRzUGF0aChkaXNjb3ZlcnkpLCBwYXRoLmJhc2VuYW1lKG1vZEZpbGVQYXRoKSk7XG4gIGNvbnN0IG1lcmdlZEZpbGVQYXRoID0gcGF0aC5qb2luKG1lcmdlRGlyUGF0aCwgcGF0aC5iYXNlbmFtZShtb2RGaWxlUGF0aCkpO1xuICBjb25zdCBiYWNrdXBGaWxlUGF0aCA9IGdhbWVTZXR0aW5nc0ZpbGVwYXRoICsgVk9SVEVYX0JBQ0tVUF9UQUc7XG4gIHRyeSB7XG4gICAgaWYgKGF3YWl0IGZpbGVFeGlzdHMobWVyZ2VkRmlsZVBhdGgpKSB7XG4gICAgICByZXR1cm4gZnMucmVhZEZpbGVBc3luYyhtZXJnZWRGaWxlUGF0aCk7XG4gICAgfVxuICAgIGlmIChhd2FpdCBmaWxlRXhpc3RzKGJhY2t1cEZpbGVQYXRoKSkge1xuICAgICAgcmV0dXJuIGZzLnJlYWRGaWxlQXN5bmMoYmFja3VwRmlsZVBhdGgpO1xuICAgIH1cbiAgICByZXR1cm4gZnMucmVhZEZpbGVBc3luYyhnYW1lU2V0dGluZ3NGaWxlcGF0aCk7XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIHJldHVybiBQcm9taXNlLnJlamVjdChlcnIpO1xuICB9XG59XG5cbi8vI2VuZHJlZ2lvbiJdfQ==