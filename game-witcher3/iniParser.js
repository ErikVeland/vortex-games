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
const vortex_parse_ini_1 = __importStar(require("vortex-parse-ini"));
const vortex_api_1 = require("vortex-api");
const util_1 = require("./util");
const common_1 = require("./common");
class IniStructure {
    static getInstance(api, priorityManager) {
        if (!IniStructure.instance) {
            if (api === undefined || priorityManager === undefined) {
                throw new Error('IniStructure is not context aware');
            }
            IniStructure.instance = new IniStructure(api, priorityManager);
        }
        return IniStructure.instance;
    }
    constructor(api, priorityManager) {
        this.mIniStruct = {};
        this.mIniStruct = {};
        this.mApi = api;
        this.mPriorityManager = priorityManager();
    }
    getIniStructure() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.mIniStruct;
        });
    }
    setINIStruct(loadOrder) {
        return __awaiter(this, void 0, void 0, function* () {
            const modMap = yield (0, util_1.getAllMods)(this.mApi);
            this.mIniStruct = {};
            const mods = [].concat(modMap.merged, modMap.managed, modMap.manual);
            const manualLocked = modMap.manual.filter(util_1.isLockedEntry);
            const managedLocked = modMap.managed
                .filter(entry => (0, util_1.isLockedEntry)(entry.name))
                .map(entry => entry.name);
            const totalLocked = [].concat(modMap.merged, manualLocked, managedLocked);
            this.mIniStruct = mods.reduce((accum, mod, idx) => {
                var _a;
                let name;
                let key;
                if (typeof (mod) === 'object' && !!mod) {
                    name = mod.name;
                    key = mod.id;
                }
                else {
                    name = mod;
                    key = mod;
                }
                if (name.toLowerCase().startsWith('dlc')) {
                    return accum;
                }
                const idxOfEntry = (loadOrder || []).findIndex(iter => iter.id === name);
                const LOEntry = loadOrder.at(idxOfEntry);
                if (idx === 0) {
                    (_a = this.mPriorityManager) === null || _a === void 0 ? void 0 : _a.resetMaxPriority(totalLocked.length);
                }
                accum[name] = {
                    Enabled: (LOEntry !== undefined) ? LOEntry.enabled ? 1 : 0 : 1,
                    Priority: totalLocked.includes(name)
                        ? totalLocked.indexOf(name) + 1
                        : idxOfEntry === -1
                            ? loadOrder.length + 1
                            : idxOfEntry + totalLocked.length,
                    VK: key,
                };
                return accum;
            }, {});
            return this.writeToModSettings();
        });
    }
    revertLOFile() {
        return __awaiter(this, void 0, void 0, function* () {
            const state = this.mApi.getState();
            const profile = vortex_api_1.selectors.activeProfile(state);
            if (!!profile && (profile.gameId === common_1.GAME_ID)) {
                const manuallyAdded = yield (0, util_1.getManuallyAddedMods)(this.mApi);
                if (manuallyAdded.length > 0) {
                    const newStruct = {};
                    manuallyAdded.forEach((mod, idx) => {
                        newStruct[mod] = {
                            Enabled: 1,
                            Priority: idx + 1,
                        };
                    });
                    this.mIniStruct = newStruct;
                    yield this.writeToModSettings()
                        .then(() => {
                        (0, util_1.forceRefresh)(this.mApi);
                        return Promise.resolve();
                    })
                        .catch(err => this.modSettingsErrorHandler(err, 'Failed to cleanup load order file'));
                }
                else {
                    const filePath = (0, common_1.getLoadOrderFilePath)();
                    yield vortex_api_1.fs.removeAsync(filePath).catch(err => (err.code !== 'ENOENT')
                        ? this.mApi.showErrorNotification('Failed to cleanup load order file', err)
                        : null);
                    (0, util_1.forceRefresh)(this.mApi);
                    return Promise.resolve();
                }
            }
        });
    }
    ensureModSettings() {
        return __awaiter(this, void 0, void 0, function* () {
            const filePath = (0, common_1.getLoadOrderFilePath)();
            const parser = new vortex_parse_ini_1.default(new vortex_parse_ini_1.WinapiFormat());
            return vortex_api_1.fs.statAsync(filePath)
                .then(() => parser.read(filePath))
                .catch(err => (err.code === 'ENOENT')
                ? this.createModSettings()
                    .then(() => parser.read(filePath))
                : Promise.reject(err));
        });
    }
    createModSettings() {
        return __awaiter(this, void 0, void 0, function* () {
            const filePath = (0, common_1.getLoadOrderFilePath)();
            return vortex_api_1.fs.ensureDirWritableAsync(path_1.default.dirname(filePath))
                .then(() => vortex_api_1.fs.writeFileAsync(filePath, '', { encoding: 'utf8' }));
        });
    }
    modSettingsErrorHandler(err, errMessage) {
        let allowReport = true;
        const userCanceled = err instanceof vortex_api_1.util.UserCanceled;
        if (userCanceled) {
            allowReport = false;
        }
        const busyResource = err instanceof common_1.ResourceInaccessibleError;
        if (allowReport && busyResource) {
            allowReport = err.allowReport;
            err.message = err.errorMessage;
        }
        this.mApi.showErrorNotification(errMessage, err, { allowReport });
        return;
    }
    readStructure() {
        return __awaiter(this, void 0, void 0, function* () {
            const state = this.mApi.getState();
            const activeProfile = vortex_api_1.selectors.activeProfile(state);
            if ((activeProfile === null || activeProfile === void 0 ? void 0 : activeProfile.id) === undefined) {
                return Promise.resolve(null);
            }
            const filePath = (0, common_1.getLoadOrderFilePath)();
            const parser = new vortex_parse_ini_1.default(new vortex_parse_ini_1.WinapiFormat());
            const ini = yield parser.read(filePath);
            const data = Object.entries(ini.data).reduce((accum, [key, value]) => {
                if (key.toLowerCase().startsWith('dlc')) {
                    return accum;
                }
                accum[key] = value;
                return accum;
            }, {});
            return Promise.resolve(data);
        });
    }
    writeToModSettings() {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            const filePath = (0, common_1.getLoadOrderFilePath)();
            const parser = new vortex_parse_ini_1.default(new vortex_parse_ini_1.WinapiFormat());
            try {
                yield vortex_api_1.fs.removeAsync(filePath);
                yield vortex_api_1.fs.writeFileAsync(filePath, '', { encoding: 'utf8' });
                const ini = yield this.ensureModSettings();
                const struct = Object.keys(this.mIniStruct).sort((a, b) => this.mIniStruct[a].Priority - this.mIniStruct[b].Priority);
                for (const key of struct) {
                    if (((_b = (_a = this.mIniStruct) === null || _a === void 0 ? void 0 : _a[key]) === null || _b === void 0 ? void 0 : _b.Enabled) === undefined) {
                        continue;
                    }
                    ini.data[key] = {
                        Enabled: this.mIniStruct[key].Enabled,
                        Priority: this.mIniStruct[key].Priority,
                        VK: this.mIniStruct[key].VK,
                    };
                }
                yield parser.write(filePath, ini);
                return Promise.resolve();
            }
            catch (err) {
                return (err.path !== undefined && ['EPERM', 'EBUSY'].includes(err.code))
                    ? Promise.reject(new common_1.ResourceInaccessibleError(err.path))
                    : Promise.reject(err);
            }
        });
    }
}
exports.default = IniStructure;
IniStructure.instance = null;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5pUGFyc2VyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiaW5pUGFyc2VyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFDQSxnREFBd0I7QUFDeEIscUVBQW9FO0FBQ3BFLDJDQUF3RDtBQUV4RCxpQ0FBdUY7QUFHdkYscUNBQW9GO0FBRXBGLE1BQXFCLFlBQVk7SUFFeEIsTUFBTSxDQUFDLFdBQVcsQ0FBQyxHQUF5QixFQUFFLGVBQXVDO1FBQzFGLElBQUksQ0FBQyxZQUFZLENBQUMsUUFBUSxFQUFFO1lBQzFCLElBQUksR0FBRyxLQUFLLFNBQVMsSUFBSSxlQUFlLEtBQUssU0FBUyxFQUFFO2dCQUN0RCxNQUFNLElBQUksS0FBSyxDQUFDLG1DQUFtQyxDQUFDLENBQUM7YUFDdEQ7WUFDRCxZQUFZLENBQUMsUUFBUSxHQUFHLElBQUksWUFBWSxDQUFDLEdBQUcsRUFBRSxlQUFlLENBQUMsQ0FBQztTQUNoRTtRQUVELE9BQU8sWUFBWSxDQUFDLFFBQVEsQ0FBQztJQUMvQixDQUFDO0lBSUQsWUFBWSxHQUF3QixFQUFFLGVBQXNDO1FBSHBFLGVBQVUsR0FBRyxFQUFFLENBQUM7UUFJdEIsSUFBSSxDQUFDLFVBQVUsR0FBRyxFQUFFLENBQUM7UUFDckIsSUFBSSxDQUFDLElBQUksR0FBRyxHQUFHLENBQUM7UUFDaEIsSUFBSSxDQUFDLGdCQUFnQixHQUFHLGVBQWUsRUFBRSxDQUFDO0lBQzVDLENBQUM7SUFFWSxlQUFlOztZQUMxQixPQUFPLElBQUksQ0FBQyxVQUFVLENBQUM7UUFDekIsQ0FBQztLQUFBO0lBRVksWUFBWSxDQUFDLFNBQTBCOztZQUNsRCxNQUFNLE1BQU0sR0FBRyxNQUFNLElBQUEsaUJBQVUsRUFBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDM0MsSUFBSSxDQUFDLFVBQVUsR0FBRyxFQUFFLENBQUM7WUFDckIsTUFBTSxJQUFJLEdBQUcsRUFBRSxD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LE1BQUssU0FBUyxFQUFFO3dCQU9qRCxTQUFTO3FCQUNWO29CQUVELEdBQUcsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUc7d0JBQ2QsT0FBTyxFQUFFLElBQUksQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLENBQUMsT0FBTzt3QkFDckMsUUFBUSxFQUFFLElBQUksQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLENBQUMsUUFBUTt3QkFDdkMsRUFBRSxFQUFFLElBQUksQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRTtxQkFDNUIsQ0FBQztpQkFDSDtnQkFDRCxNQUFNLE1BQU0sQ0FBQyxLQUFLLENBQUMsUUFBUSxFQUFFLEdBQUcsQ0FBQyxDQUFDO2dCQUNsQyxPQUFPLE9BQU8sQ0FBQyxPQUFPLEVBQUUsQ0FBQzthQUMxQjtZQUFDLE9BQU0sR0FBRyxFQUFFO2dCQUNYLE9BQU8sQ0FBQyxHQUFHLENBQUMsSUFBSSxLQUFLLFNBQVMsSUFBSSxDQUFDLE9BQU8sRUFBRSxPQUFPLENBQUMsQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDO29CQUN0RSxDQUFDLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxJQUFJLGtDQUF5QixDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQztvQkFDekQsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUE7YUFDeEI7O0tBQ0Y7O0FBOUxILCtCQStMQztBQTlMZ0IscUJBQVEsR0FBaUIsSUFBSSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyogZXNsaW50LWRpc2FibGUgKi9cbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0IEluaVBhcnNlciwgeyBJbmlGaWxlLCBXaW5hcGlGb3JtYXQgfSBmcm9tICd2b3J0ZXgtcGFyc2UtaW5pJztcbmltcG9ydCB7IGZzLCBzZWxlY3RvcnMsIHR5cGVzLCB1dGlsIH0gZnJvbSAndm9ydGV4LWFwaSc7XG5cbmltcG9ydCB7IGZvcmNlUmVmcmVzaCwgaXNMb2NrZWRFbnRyeSwgZ2V0QWxsTW9kcywgZ2V0TWFudWFsbHlBZGRlZE1vZHMgfSBmcm9tICcuL3V0aWwnO1xuaW1wb3J0IHsgUHJpb3JpdHlNYW5hZ2VyIH0gZnJvbSAnLi9wcmlvcml0eU1hbmFnZXInO1xuXG5pbXBvcnQgeyBHQU1FX0lELCBSZXNvdXJjZUluYWNjZXNzaWJsZUVycm9yLCBnZXRMb2FkT3JkZXJGaWxlUGF0aCB9IGZyb20gJy4vY29tbW9uJztcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgSW5pU3RydWN0dXJlIHtcbiAgcHJpdmF0ZSBzdGF0aWMgaW5zdGFuY2U6IEluaVN0cnVjdHVyZSA9IG51bGw7XG4gIHB1YmxpYyBzdGF0aWMgZ2V0SW5zdGFuY2UoYXBpPzogdHlwZXMuSUV4dGVuc2lvbkFwaSwgcHJpb3JpdHlNYW5hZ2VyPzogKCkgPT4gUHJpb3JpdHlNYW5hZ2VyKTogSW5pU3RydWN0dXJlIHtcbiAgICBpZiAoIUluaVN0cnVjdHVyZS5pbnN0YW5jZSkge1xuICAgICAgaWYgKGFwaSA9PT0gdW5kZWZpbmVkIHx8IHByaW9yaXR5TWFuYWdlciA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignSW5pU3RydWN0dXJlIGlzIG5vdCBjb250ZXh0IGF3YXJlJyk7XG4gICAgICB9XG4gICAgICBJbmlTdHJ1Y3R1cmUuaW5zdGFuY2UgPSBuZXcgSW5pU3RydWN0dXJlKGFwaSwgcHJpb3JpdHlNYW5hZ2VyKTtcbiAgICB9XG5cbiAgICByZXR1cm4gSW5pU3RydWN0dXJlLmluc3RhbmNlO1xuICB9XG4gIHByaXZhdGUgbUluaVN0cnVjdCA9IHt9O1xuICBwcml2YXRlIG1BcGk6IHR5cGVzLklFeHRlbnNpb25BcGk7XG4gIHByaXZhdGUgbVByaW9yaXR5TWFuYWdlcjogUHJpb3JpdHlNYW5hZ2VyO1xuICBjb25zdHJ1Y3RvcihhcGk6IHR5cGVzLklFeHRlbnNpb25BcGksIHByaW9yaXR5TWFuYWdlcjogKCkgPT4gUHJpb3JpdHlNYW5hZ2VyKSB7XG4gICAgdGhpcy5tSW5pU3RydWN0ID0ge307XG4gICAgdGhpcy5tQXBpID0gYXBpO1xuICAgIHRoaXMubVByaW9yaXR5TWFuYWdlciA9IHByaW9yaXR5TWFuYWdlcigpO1xuICB9XG5cbiAgcHVibGljIGFzeW5jIGdldEluaVN0cnVjdHVyZSgpIHtcbiAgICByZXR1cm4gdGhpcy5tSW5pU3RydWN0O1xuICB9XG5cbiAgcHVibGljIGFzeW5jIHNldElOSVN0cnVjdChsb2FkT3JkZXI6IHR5cGVzLkxvYWRPcmRlcikge1xuICAgIGNvbnN0IG1vZE1hcCA9IGF3YWl0IGdldEFsbE1vZHModGhpcy5tQXBpKTtcbiAgICB0aGlzLm1JbmlTdHJ1Y3QgPSB7fTtcbiAgICBjb25zdCBtb2RzID0gW10uY29uY2F0KG1vZE1hcC5tZXJnZWQsIG1vZE1hcC5tYW5hZ2VkLCBtb2RNYXAubWFudWFsKTtcbiAgICBjb25zdCBtYW51YWxMb2NrZWQgPSBtb2RNYXAubWFudWFsLmZpbHRlcihpc0xvY2tlZEVudHJ5KTtcbiAgICBjb25zdCBtYW5hZ2VkTG9ja2VkID0gbW9kTWFwLm1hbmFnZWRcbiAgICAgIC5maWx0ZXIoZW50cnkgPT4gaXNMb2NrZWRFbnRyeShlbnRyeS5uYW1lKSlcbiAgICAgIC5tYXAoZW50cnkgPT4gZW50cnkubmFtZSk7XG4gICAgY29uc3QgdG90YWxMb2NrZWQgPSBbXS5jb25jYXQobW9kTWFwLm1lcmdlZCwgbWFudWFsTG9ja2VkLCBtYW5hZ2VkTG9ja2VkKTtcbiAgICB0aGlzLm1JbmlTdHJ1Y3QgPSBtb2RzLnJlZHVjZSgoYWNjdW0sIG1vZCwgaWR4KSA9PiB7XG4gICAgICBsZXQgbmFtZTtcbiAgICAgIGxldCBrZXk7XG4gICAgICBpZiAodHlwZW9mKG1vZCkgPT09ICdvYmplY3QnICYmICEhbW9kKSB7XG4gICAgICAgIG5hbWUgPSBtb2QubmFtZTtcbiAgICAgICAga2V5ID0gbW9kLmlkO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbmFtZSA9IG1vZDtcbiAgICAgICAga2V5ID0gbW9kO1xuICAgICAgfVxuXG4gICAgICBpZiAobmFtZS50b0xvd2VyQ2FzZSgpLnN0YXJ0c1dpdGgoJ2RsYycpKSB7XG4gICAgICAgIHJldHVybiBhY2N1bTtcbiAgICAgIH1cblxuICAgICAgY29uc3QgaWR4T2ZFbnRyeSA9IChsb2FkT3JkZXIgfHwgW10pLmZpbmRJbmRleChpdGVyID0+IGl0ZXIuaWQgPT09IG5hbWUpO1xuICAgICAgY29uc3QgTE9FbnRyeSA9IGxvYWRPcmRlci5hdChpZHhPZkVudHJ5KTtcbiAgICAgIGlmIChpZHggPT09IDApIHtcbiAgICAgICAgdGhpcy5tUHJpb3JpdHlNYW5hZ2VyPy5yZXNldE1heFByaW9yaXR5KHRvdGFsTG9ja2VkLmxlbmd0aCk7XG4gICAgICB9XG4gICAgICBhY2N1bVtuYW1lXSA9IHtcbiAgICAgICAgLy8gVGhlIElOSSBmaWxlJ3MgZW5hYmxlZCBhdHRyaWJ1dGUgZXhwZWN0cyAxIG9yIDBcbiAgICAgICAgRW5hYmxlZDogKExPRW50cnkgIT09IHVuZGVmaW5lZCkgPyBMT0VudHJ5LmVuYWJsZWQgPyAxIDogMCA6IDEsXG4gICAgICAgIFByaW9yaXR5OiB0b3RhbExvY2tlZC5pbmNsdWRlcyhuYW1lKVxuICAgICAgICAgID8gdG90YWxMb2NrZWQuaW5kZXhPZihuYW1lKSArIDFcbiAgICAgICAgICA6IGlkeE9mRW50cnkgPT09IC0xXG4gICAgICAgICAgICA/IGxvYWRPcmRlci5sZW5ndGggKyAxXG4gICAgICAgICAgICA6IGlkeE9mRW50cnkgKyB0b3RhbExvY2tlZC5sZW5ndGgsXG4gICAgICAgIFZLOiBrZXksXG4gICAgICB9O1xuICAgICAgcmV0dXJuIGFjY3VtO1xuICAgIH0sIHt9KTtcbiAgICByZXR1cm4gdGhpcy53cml0ZVRvTW9kU2V0dGluZ3MoKTtcbiAgfVxuXG4gIHB1YmxpYyBhc3luYyByZXZlcnRMT0ZpbGUoKSB7XG4gICAgY29uc3Qgc3RhdGUgPSB0aGlzLm1BcGkuZ2V0U3RhdGUoKTtcbiAgICBjb25zdCBwcm9maWxlID0gc2VsZWN0b3JzLmFjdGl2ZVByb2ZpbGUoc3RhdGUpO1xuICAgIGlmICghIXByb2ZpbGUgJiYgKHByb2ZpbGUuZ2FtZUlkID09PSBHQU1FX0lEKSkge1xuICAgICAgY29uc3QgbWFudWFsbHlBZGRlZCA9IGF3YWl0IGdldE1hbnVhbGx5QWRkZWRNb2RzKHRoaXMubUFwaSk7XG4gICAgICBpZiAobWFudWFsbHlBZGRlZC5sZW5ndGggPiAwKSB7XG4gICAgICAgIGNvbnN0IG5ld1N0cnVjdCA9IHt9O1xuICAgICAgICBtYW51YWxseUFkZGVkLmZvckVhY2goKG1vZCwgaWR4KSA9PiB7XG4gICAgICAgICAgbmV3U3RydWN0W21vZF0gPSB7XG4gICAgICAgICAgICBFbmFibGVkOiAxLFxuICAgICAgICAgICAgUHJpb3JpdHk6IGlkeCArIDEsXG4gICAgICAgICAgfTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgdGhpcy5tSW5pU3RydWN0ID0gbmV3U3RydWN0O1xuICAgICAgICBhd2FpdCB0aGlzLndyaXRlVG9Nb2RTZXR0aW5ncygpXG4gICAgICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgZm9yY2VSZWZyZXNoKHRoaXMubUFwaSk7XG4gICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG4gICAgICAgICAgfSlcbiAgICAgICAgICAuY2F0Y2goZXJyID0+IHRoaXMubW9kU2V0dGluZ3NFcnJvckhhbmRsZXIoZXJyLCAnRmFpbGVkIHRvIGNsZWFudXAgbG9hZCBvcmRlciBmaWxlJykpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc3QgZmlsZVBhdGggPSBnZXRMb2FkT3JkZXJGaWxlUGF0aCgpO1xuICAgICAgICBhd2FpdCBmcy5yZW1vdmVBc3luYyhmaWxlUGF0aCkuY2F0Y2goZXJyID0+IChlcnIuY29kZSAhPT0gJ0VOT0VOVCcpXG4gICAgICAgICAgPyB0aGlzLm1BcGkuc2hvd0Vycm9yTm90aWZpY2F0aW9uKCdGYWlsZWQgdG8gY2xlYW51cCBsb2FkIG9yZGVyIGZpbGUnLCBlcnIpXG4gICAgICAgICAgOiBudWxsKTtcbiAgICAgICAgZm9yY2VSZWZyZXNoKHRoaXMubUFwaSk7XG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBwdWJsaWMgYXN5bmMgZW5zdXJlTW9kU2V0dGluZ3MoKSB7XG4gICAgY29uc3QgZmlsZVBhdGggPSBnZXRMb2FkT3JkZXJGaWxlUGF0aCgpO1xuICAgIGNvbnN0IHBhcnNlciA9IG5ldyBJbmlQYXJzZXIobmV3IFdpbmFwaUZvcm1hdCgpKTtcbiAgICByZXR1cm4gZnMuc3RhdEFzeW5jKGZpbGVQYXRoKVxuICAgICAgLnRoZW4oKCkgPT4gcGFyc2VyLnJlYWQoZmlsZVBhdGgpKVxuICAgICAgLmNhdGNoKGVyciA9PiAoZXJyLmNvZGUgPT09ICdFTk9FTlQnKVxuICAgICAgICA/IHRoaXMuY3JlYXRlTW9kU2V0dGluZ3MoKVxuICAgICAgICAgICAgICAudGhlbigoKSA9PiBwYXJzZXIucmVhZChmaWxlUGF0aCkpXG4gICAgICAgIDogUHJvbWlzZS5yZWplY3QoZXJyKSk7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIGNyZWF0ZU1vZFNldHRpbmdzKCkge1xuICAgIGNvbnN0IGZpbGVQYXRoID0gZ2V0TG9hZE9yZGVyRmlsZVBhdGgoKTtcbiAgICAvLyBUaGVvcmV0aWNhbGx5IHRoZSBXaXRjaGVyIDMgZG9jdW1lbnRzIHBhdGggc2hvdWxkIGJlXG4gICAgLy8gIGNyZWF0ZWQgYXQgdGhpcyBwb2ludCAoZWl0aGVyIGJ5IHVzIG9yIHRoZSBnYW1lKSBidXRcbiAgICAvLyAganVzdCBpbiBjYXNlIGl0IGdvdCByZW1vdmVkIHNvbWVob3csIHdlIHJlLWluc3RhdGUgaXRcbiAgICAvLyAgeWV0IGFnYWluLi4uIGh0dHBzOi8vZ2l0aHViLmNvbS9OZXh1cy1Nb2RzL1ZvcnRleC9pc3N1ZXMvNzA1OFxuICAgIHJldHVybiBmcy5lbnN1cmVEaXJXcml0YWJsZUFzeW5jKHBhdGguZGlybmFtZShmaWxlUGF0aCkpXG4gICAgICAudGhlbigoKSA9PiBmcy53cml0ZUZpbGVBc3luYyhmaWxlUGF0aCwgJycsIHsgZW5jb2Rpbmc6ICd1dGY4JyB9KSk7XG4gIH1cblxuICBwdWJsaWMgbW9kU2V0dGluZ3NFcnJvckhhbmRsZXIoZXJyOiBhbnksIGVyck1lc3NhZ2U6IHN0cmluZykge1xuICAgIGxldCBhbGxvd1JlcG9ydCA9IHRydWU7XG4gICAgY29uc3QgdXNlckNhbmNlbGVkID0gZXJyIGluc3RhbmNlb2YgdXRpbC5Vc2VyQ2FuY2VsZWQ7XG4gICAgaWYgKHVzZXJDYW5jZWxlZCkge1xuICAgICAgYWxsb3dSZXBvcnQgPSBmYWxzZTtcbiAgICB9XG4gICAgY29uc3QgYnVzeVJlc291cmNlID0gZXJyIGluc3RhbmNlb2YgUmVzb3VyY2VJbmFjY2Vzc2libGVFcnJvcjtcbiAgICBpZiAoYWxsb3dSZXBvcnQgJiYgYnVzeVJlc291cmNlKSB7XG4gICAgICBhbGxvd1JlcG9ydCA9IGVyci5hbGxvd1JlcG9ydDtcbiAgICAgIGVyci5tZXNzYWdlID0gZXJyLmVycm9yTWVzc2FnZTtcbiAgICB9XG4gIFxuICAgIHRoaXMubUFwaS5zaG93RXJyb3JOb3RpZmljYXRpb24oZXJyTWVzc2FnZSwgZXJyLCB7IGFsbG93UmVwb3J0IH0pO1xuICAgIHJldHVybjtcbiAgfVxuXG4gIHB1YmxpYyBhc3luYyByZWFkU3RydWN0dXJlKCk6IFByb21pc2U8eyBba2V5OiBzdHJpbmddOiBhbnkgfT4ge1xuICAgIGNvbnN0IHN0YXRlID0gdGhpcy5tQXBpLmdldFN0YXRlKCk7XG4gICAgY29uc3QgYWN0aXZlUHJvZmlsZSA9IHNlbGVjdG9ycy5hY3RpdmVQcm9maWxlKHN0YXRlKTtcbiAgICBpZiAoYWN0aXZlUHJvZmlsZT8uaWQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShudWxsKTtcbiAgICB9XG4gIFxuICAgIGNvbnN0IGZpbGVQYXRoID0gZ2V0TG9hZE9yZGVyRmlsZVBhdGgoKTtcbiAgICBjb25zdCBwYXJzZXIgPSBuZXcgSW5pUGFyc2VyKG5ldyBXaW5hcGlGb3JtYXQoKSk7XG4gICAgY29uc3QgaW5pID0gYXdhaXQgcGFyc2VyLnJlYWQoZmlsZVBhdGgpO1xuICAgIGNvbnN0IGRhdGEgPSBPYmplY3QuZW50cmllcyhpbmkuZGF0YSkucmVkdWNlKChhY2N1bSwgW2tleSwgdmFsdWVdKSA9PiB7XG4gICAgICBpZiAoa2V5LnRvTG93ZXJDYXNlKCkuc3RhcnRzV2l0aCgnZGxjJykpIHtcbiAgICAgICAgcmV0dXJuIGFjY3VtO1xuICAgICAgfVxuICAgICAgYWNjdW1ba2V5XSA9IHZhbHVlO1xuICAgICAgcmV0dXJuIGFjY3VtO1xuICAgIH0sIHt9KTtcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKGRhdGEpO1xuICB9XG5cbiAgcHVibGljIGFzeW5jIHdyaXRlVG9Nb2RTZXR0aW5ncygpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBmaWxlUGF0aCA9IGdldExvYWRPcmRlckZpbGVQYXRoKCk7XG4gICAgY29uc3QgcGFyc2VyID0gbmV3IEluaVBhcnNlcihuZXcgV2luYXBpRm9ybWF0KCkpO1xuICAgIHRyeSB7XG4gICAgICBhd2FpdCBmcy5yZW1vdmVBc3luYyhmaWxlUGF0aCk7XG4gICAgICBhd2FpdCBmcy53cml0ZUZpbGVBc3luYyhmaWxlUGF0aCwgJycsIHsgZW5jb2Rpbmc6ICd1dGY4JyB9KTtcbiAgICAgIGNvbnN0IGluaSA9IGF3YWl0IHRoaXMuZW5zdXJlTW9kU2V0dGluZ3MoKTtcbiAgICAgIGNvbnN0IHN0cnVjdCA9IE9iamVjdC5rZXlzKHRoaXMubUluaVN0cnVjdCkuc29ydCgoYSwgYikgPT4gdGhpcy5tSW5pU3RydWN0W2FdLlByaW9yaXR5IC0gdGhpcy5tSW5pU3RydWN0W2JdLlByaW9yaXR5KTtcbiAgICAgIGZvciAoY29uc3Qga2V5IG9mIHN0cnVjdCkge1xuICAgICAgICBpZiAodGhpcy5tSW5pU3RydWN0Py5ba2V5XT8uRW5hYmxlZCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgLy8gSXQncyBwb3NzaWJsZSBmb3IgdGhlIHVzZXIgdG8gcnVuIG11bHRpcGxlIG9wZXJhdGlvbnMgYXQgb25jZSxcbiAgICAgICAgICAvLyAgY2F1c2luZyB0aGUgc3RhdGljIGluaSBzdHJ1Y3R1cmUgdG8gYmUgbW9kaWZpZWRcbiAgICAgICAgICAvLyAgZWxzZXdoZXJlIHdoaWxlIHdlJ3JlIGF0dGVtcHRpbmcgdG8gd3JpdGUgdG8gZmlsZS4gVGhlIHVzZXIgbXVzdCd2ZSBiZWVuXG4gICAgICAgICAgLy8gIG1vZGlmeWluZyB0aGUgbG9hZCBvcmRlciB3aGlsZSBkZXBsb3lpbmcuIFRoaXMgc2hvdWxkXG4gICAgICAgICAgLy8gIG1ha2Ugc3VyZSB3ZSBkb24ndCBhdHRlbXB0IHRvIHdyaXRlIGFueSBpbnZhbGlkIG1vZCBlbnRyaWVzLlxuICAgICAgICAgIC8vICBodHRwczovL2dpdGh1Yi5jb20vTmV4dXMtTW9kcy9Wb3J0ZXgvaXNzdWVzLzg0MzdcbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGluaS5kYXRhW2tleV0gPSB7XG4gICAgICAgICAgRW5hYmxlZDogdGhpcy5tSW5pU3RydWN0W2tleV0uRW5hYmxlZCxcbiAgICAgICAgICBQcmlvcml0eTogdGhpcy5tSW5pU3RydWN0W2tleV0uUHJpb3JpdHksXG4gICAgICAgICAgVks6IHRoaXMubUluaVN0cnVjdFtrZXldLlZLLFxuICAgICAgICB9O1xuICAgICAgfVxuICAgICAgYXdhaXQgcGFyc2VyLndyaXRlKGZpbGVQYXRoLCBpbmkpO1xuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xuICAgIH0gY2F0Y2goZXJyKSB7XG4gICAgICByZXR1cm4gKGVyci5wYXRoICE9PSB1bmRlZmluZWQgJiYgWydFUEVSTScsICdFQlVTWSddLmluY2x1ZGVzKGVyci5jb2RlKSlcbiAgICAgICAgPyBQcm9taXNlLnJlamVjdChuZXcgUmVzb3VyY2VJbmFjY2Vzc2libGVFcnJvcihlcnIucGF0aCkpXG4gICAgICAgIDogUHJvbWlzZS5yZWplY3QoZXJyKVxuICAgIH0gXG4gIH1cbn0iXX0=