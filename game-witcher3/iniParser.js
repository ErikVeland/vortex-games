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
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
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
IniStructure.instance = null;
exports.default = IniStructure;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5pUGFyc2VyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiaW5pUGFyc2VyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQ0EsZ0RBQXdCO0FBQ3hCLHFFQUFvRTtBQUNwRSwyQ0FBd0Q7QUFFeEQsaUNBQXVGO0FBR3ZGLHFDQUFvRjtBQUVwRixNQUFxQixZQUFZO0lBRXhCLE1BQU0sQ0FBQyxXQUFXLENBQUMsR0FBeUIsRUFBRSxlQUF1QztRQUMxRixJQUFJLENBQUMsWUFBWSxDQUFDLFFBQVEsRUFBRSxDQUFDO1lBQzNCLElBQUksR0FBRyxLQUFLLFNBQVMsSUFBSSxlQUFlLEtBQUssU0FBUyxFQUFFLENBQUM7Z0JBQ3ZELE1BQU0sSUFBSSxLQUFLLENBQUMsbUNBQW1DLENBQUMsQ0FBQztZQUN2RCxDQUFDO1lBQ0QsWUFBWSxDQUFDLFFBQVEsR0FBRyxJQUFJLFlBQVksQ0FBQyxHQUFHLEVBQUUsZUFBZSxDQUFDLENBQUM7UUFDakUsQ0FBQztRQUVELE9BQU8sWUFBWSxDQUFDLFFBQVEsQ0FBQztJQUMvQixDQUFDO0lBSUQsWUFBWSxHQUF3QixFQUFFLGVBQXNDO1FBSHBFLGVBQVUsR0FBRyxFQUFFLENBQUM7UUFJdEIsSUFBSSxDQUFDLFVBQVUsR0FBRyxFQUFFLENBQUM7UUFDckIsSUFBSSxDQUFDLElBQUksR0FBRyxHQUFHLENBQUM7UUFDaEIsSUFBSSxDQUFDLGdCQUFnQixHQUFHLGVBQWUsRUFBRSxDQUFDO0lBQzVDLENBQUM7SUFFWSxlQUFlOztZQUMxQixPQUFPLElBQUksQ0FBQyxVQUFVLENBQUM7UUFDekIsQ0FBQztLQUFBO0lBRVksWUFBWSxDQUFDLFNBQTBCOztZQUNsRCxNQUFNLE1BQU0sR0FBRyxNQUFNLElBQUEsaUJBQVUsRUFBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDM0MsSUFBSSxDQUFDLFVBQVUsR0FBRyxFQUFFLENB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bnQtZGlzYWJsZSAqL1xuaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgSW5pUGFyc2VyLCB7IEluaUZpbGUsIFdpbmFwaUZvcm1hdCB9IGZyb20gJ3ZvcnRleC1wYXJzZS1pbmknO1xuaW1wb3J0IHsgZnMsIHNlbGVjdG9ycywgdHlwZXMsIHV0aWwgfSBmcm9tICd2b3J0ZXgtYXBpJztcblxuaW1wb3J0IHsgZm9yY2VSZWZyZXNoLCBpc0xvY2tlZEVudHJ5LCBnZXRBbGxNb2RzLCBnZXRNYW51YWxseUFkZGVkTW9kcyB9IGZyb20gJy4vdXRpbCc7XG5pbXBvcnQgeyBQcmlvcml0eU1hbmFnZXIgfSBmcm9tICcuL3ByaW9yaXR5TWFuYWdlcic7XG5cbmltcG9ydCB7IEdBTUVfSUQsIFJlc291cmNlSW5hY2Nlc3NpYmxlRXJyb3IsIGdldExvYWRPcmRlckZpbGVQYXRoIH0gZnJvbSAnLi9jb21tb24nO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBJbmlTdHJ1Y3R1cmUge1xuICBwcml2YXRlIHN0YXRpYyBpbnN0YW5jZTogSW5pU3RydWN0dXJlID0gbnVsbDtcbiAgcHVibGljIHN0YXRpYyBnZXRJbnN0YW5jZShhcGk/OiB0eXBlcy5JRXh0ZW5zaW9uQXBpLCBwcmlvcml0eU1hbmFnZXI/OiAoKSA9PiBQcmlvcml0eU1hbmFnZXIpOiBJbmlTdHJ1Y3R1cmUge1xuICAgIGlmICghSW5pU3RydWN0dXJlLmluc3RhbmNlKSB7XG4gICAgICBpZiAoYXBpID09PSB1bmRlZmluZWQgfHwgcHJpb3JpdHlNYW5hZ2VyID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdJbmlTdHJ1Y3R1cmUgaXMgbm90IGNvbnRleHQgYXdhcmUnKTtcbiAgICAgIH1cbiAgICAgIEluaVN0cnVjdHVyZS5pbnN0YW5jZSA9IG5ldyBJbmlTdHJ1Y3R1cmUoYXBpLCBwcmlvcml0eU1hbmFnZXIpO1xuICAgIH1cblxuICAgIHJldHVybiBJbmlTdHJ1Y3R1cmUuaW5zdGFuY2U7XG4gIH1cbiAgcHJpdmF0ZSBtSW5pU3RydWN0ID0ge307XG4gIHByaXZhdGUgbUFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaTtcbiAgcHJpdmF0ZSBtUHJpb3JpdHlNYW5hZ2VyOiBQcmlvcml0eU1hbmFnZXI7XG4gIGNvbnN0cnVjdG9yKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSwgcHJpb3JpdHlNYW5hZ2VyOiAoKSA9PiBQcmlvcml0eU1hbmFnZXIpIHtcbiAgICB0aGlzLm1JbmlTdHJ1Y3QgPSB7fTtcbiAgICB0aGlzLm1BcGkgPSBhcGk7XG4gICAgdGhpcy5tUHJpb3JpdHlNYW5hZ2VyID0gcHJpb3JpdHlNYW5hZ2VyKCk7XG4gIH1cblxuICBwdWJsaWMgYXN5bmMgZ2V0SW5pU3RydWN0dXJlKCkge1xuICAgIHJldHVybiB0aGlzLm1JbmlTdHJ1Y3Q7XG4gIH1cblxuICBwdWJsaWMgYXN5bmMgc2V0SU5JU3RydWN0KGxvYWRPcmRlcjogdHlwZXMuTG9hZE9yZGVyKSB7XG4gICAgY29uc3QgbW9kTWFwID0gYXdhaXQgZ2V0QWxsTW9kcyh0aGlzLm1BcGkpO1xuICAgIHRoaXMubUluaVN0cnVjdCA9IHt9O1xuICAgIGNvbnN0IG1vZHMgPSBbXS5jb25jYXQobW9kTWFwLm1lcmdlZCwgbW9kTWFwLm1hbmFnZWQsIG1vZE1hcC5tYW51YWwpO1xuICAgIGNvbnN0IG1hbnVhbExvY2tlZCA9IG1vZE1hcC5tYW51YWwuZmlsdGVyKGlzTG9ja2VkRW50cnkpO1xuICAgIGNvbnN0IG1hbmFnZWRMb2NrZWQgPSBtb2RNYXAubWFuYWdlZFxuICAgICAgLmZpbHRlcihlbnRyeSA9PiBpc0xvY2tlZEVudHJ5KGVudHJ5Lm5hbWUpKVxuICAgICAgLm1hcChlbnRyeSA9PiBlbnRyeS5uYW1lKTtcbiAgICBjb25zdCB0b3RhbExvY2tlZCA9IFtdLmNvbmNhdChtb2RNYXAubWVyZ2VkLCBtYW51YWxMb2NrZWQsIG1hbmFnZWRMb2NrZWQpO1xuICAgIHRoaXMubUluaVN0cnVjdCA9IG1vZHMucmVkdWNlKChhY2N1bSwgbW9kLCBpZHgpID0+IHtcbiAgICAgIGxldCBuYW1lO1xuICAgICAgbGV0IGtleTtcbiAgICAgIGlmICh0eXBlb2YobW9kKSA9PT0gJ29iamVjdCcgJiYgISFtb2QpIHtcbiAgICAgICAgbmFtZSA9IG1vZC5uYW1lO1xuICAgICAgICBrZXkgPSBtb2QuaWQ7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBuYW1lID0gbW9kO1xuICAgICAgICBrZXkgPSBtb2Q7XG4gICAgICB9XG5cbiAgICAgIGlmIChuYW1lLnRvTG93ZXJDYXNlKCkuc3RhcnRzV2l0aCgnZGxjJykpIHtcbiAgICAgICAgcmV0dXJuIGFjY3VtO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBpZHhPZkVudHJ5ID0gKGxvYWRPcmRlciB8fCBbXSkuZmluZEluZGV4KGl0ZXIgPT4gaXRlci5pZCA9PT0gbmFtZSk7XG4gICAgICBjb25zdCBMT0VudHJ5ID0gbG9hZE9yZGVyLmF0KGlkeE9mRW50cnkpO1xuICAgICAgaWYgKGlkeCA9PT0gMCkge1xuICAgICAgICB0aGlzLm1Qcmlvcml0eU1hbmFnZXI/LnJlc2V0TWF4UHJpb3JpdHkodG90YWxMb2NrZWQubGVuZ3RoKTtcbiAgICAgIH1cbiAgICAgIGFjY3VtW25hbWVdID0ge1xuICAgICAgICAvLyBUaGUgSU5JIGZpbGUncyBlbmFibGVkIGF0dHJpYnV0ZSBleHBlY3RzIDEgb3IgMFxuICAgICAgICBFbmFibGVkOiAoTE9FbnRyeSAhPT0gdW5kZWZpbmVkKSA/IExPRW50cnkuZW5hYmxlZCA/IDEgOiAwIDogMSxcbiAgICAgICAgUHJpb3JpdHk6IHRvdGFsTG9ja2VkLmluY2x1ZGVzKG5hbWUpXG4gICAgICAgICAgPyB0b3RhbExvY2tlZC5pbmRleE9mKG5hbWUpICsgMVxuICAgICAgICAgIDogaWR4T2ZFbnRyeSA9PT0gLTFcbiAgICAgICAgICAgID8gbG9hZE9yZGVyLmxlbmd0aCArIDFcbiAgICAgICAgICAgIDogaWR4T2ZFbnRyeSArIHRvdGFsTG9ja2VkLmxlbmd0aCxcbiAgICAgICAgVks6IGtleSxcbiAgICAgIH07XG4gICAgICByZXR1cm4gYWNjdW07XG4gICAgfSwge30pO1xuICAgIHJldHVybiB0aGlzLndyaXRlVG9Nb2RTZXR0aW5ncygpO1xuICB9XG5cbiAgcHVibGljIGFzeW5jIHJldmVydExPRmlsZSgpIHtcbiAgICBjb25zdCBzdGF0ZSA9IHRoaXMubUFwaS5nZXRTdGF0ZSgpO1xuICAgIGNvbnN0IHByb2ZpbGUgPSBzZWxlY3RvcnMuYWN0aXZlUHJvZmlsZShzdGF0ZSk7XG4gICAgaWYgKCEhcHJvZmlsZSAmJiAocHJvZmlsZS5nYW1lSWQgPT09IEdBTUVfSUQpKSB7XG4gICAgICBjb25zdCBtYW51YWxseUFkZGVkID0gYXdhaXQgZ2V0TWFudWFsbHlBZGRlZE1vZHModGhpcy5tQXBpKTtcbiAgICAgIGlmIChtYW51YWxseUFkZGVkLmxlbmd0aCA+IDApIHtcbiAgICAgICAgY29uc3QgbmV3U3RydWN0ID0ge307XG4gICAgICAgIG1hbnVhbGx5QWRkZWQuZm9yRWFjaCgobW9kLCBpZHgpID0+IHtcbiAgICAgICAgICBuZXdTdHJ1Y3RbbW9kXSA9IHtcbiAgICAgICAgICAgIEVuYWJsZWQ6IDEsXG4gICAgICAgICAgICBQcmlvcml0eTogaWR4ICsgMSxcbiAgICAgICAgICB9O1xuICAgICAgICB9KTtcblxuICAgICAgICB0aGlzLm1JbmlTdHJ1Y3QgPSBuZXdTdHJ1Y3Q7XG4gICAgICAgIGF3YWl0IHRoaXMud3JpdGVUb01vZFNldHRpbmdzKClcbiAgICAgICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgICAgICBmb3JjZVJlZnJlc2godGhpcy5tQXBpKTtcbiAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcbiAgICAgICAgICB9KVxuICAgICAgICAgIC5jYXRjaChlcnIgPT4gdGhpcy5tb2RTZXR0aW5nc0Vycm9ySGFuZGxlcihlcnIsICdGYWlsZWQgdG8gY2xlYW51cCBsb2FkIG9yZGVyIGZpbGUnKSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zdCBmaWxlUGF0aCA9IGdldExvYWRPcmRlckZpbGVQYXRoKCk7XG4gICAgICAgIGF3YWl0IGZzLnJlbW92ZUFzeW5jKGZpbGVQYXRoKS5jYXRjaChlcnIgPT4gKGVyci5jb2RlICE9PSAnRU5PRU5UJylcbiAgICAgICAgICA/IHRoaXMubUFwaS5zaG93RXJyb3JOb3RpZmljYXRpb24oJ0ZhaWxlZCB0byBjbGVhbnVwIGxvYWQgb3JkZXIgZmlsZScsIGVycilcbiAgICAgICAgICA6IG51bGwpO1xuICAgICAgICBmb3JjZVJlZnJlc2godGhpcy5tQXBpKTtcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHB1YmxpYyBhc3luYyBlbnN1cmVNb2RTZXR0aW5ncygpIHtcbiAgICBjb25zdCBmaWxlUGF0aCA9IGdldExvYWRPcmRlckZpbGVQYXRoKCk7XG4gICAgY29uc3QgcGFyc2VyID0gbmV3IEluaVBhcnNlcihuZXcgV2luYXBpRm9ybWF0KCkpO1xuICAgIHJldHVybiBmcy5zdGF0QXN5bmMoZmlsZVBhdGgpXG4gICAgICAudGhlbigoKSA9PiBwYXJzZXIucmVhZChmaWxlUGF0aCkpXG4gICAgICAuY2F0Y2goZXJyID0+IChlcnIuY29kZSA9PT0gJ0VOT0VOVCcpXG4gICAgICAgID8gdGhpcy5jcmVhdGVNb2RTZXR0aW5ncygpXG4gICAgICAgICAgICAgIC50aGVuKCgpID0+IHBhcnNlci5yZWFkKGZpbGVQYXRoKSlcbiAgICAgICAgOiBQcm9taXNlLnJlamVjdChlcnIpKTtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgY3JlYXRlTW9kU2V0dGluZ3MoKSB7XG4gICAgY29uc3QgZmlsZVBhdGggPSBnZXRMb2FkT3JkZXJGaWxlUGF0aCgpO1xuICAgIC8vIFRoZW9yZXRpY2FsbHkgdGhlIFdpdGNoZXIgMyBkb2N1bWVudHMgcGF0aCBzaG91bGQgYmVcbiAgICAvLyAgY3JlYXRlZCBhdCB0aGlzIHBvaW50IChlaXRoZXIgYnkgdXMgb3IgdGhlIGdhbWUpIGJ1dFxuICAgIC8vICBqdXN0IGluIGNhc2UgaXQgZ290IHJlbW92ZWQgc29tZWhvdywgd2UgcmUtaW5zdGF0ZSBpdFxuICAgIC8vICB5ZXQgYWdhaW4uLi4gaHR0cHM6Ly9naXRodWIuY29tL05leHVzLU1vZHMvVm9ydGV4L2lzc3Vlcy83MDU4XG4gICAgcmV0dXJuIGZzLmVuc3VyZURpcldyaXRhYmxlQXN5bmMocGF0aC5kaXJuYW1lKGZpbGVQYXRoKSlcbiAgICAgIC50aGVuKCgpID0+IGZzLndyaXRlRmlsZUFzeW5jKGZpbGVQYXRoLCAnJywgeyBlbmNvZGluZzogJ3V0ZjgnIH0pKTtcbiAgfVxuXG4gIHB1YmxpYyBtb2RTZXR0aW5nc0Vycm9ySGFuZGxlcihlcnI6IGFueSwgZXJyTWVzc2FnZTogc3RyaW5nKSB7XG4gICAgbGV0IGFsbG93UmVwb3J0ID0gdHJ1ZTtcbiAgICBjb25zdCB1c2VyQ2FuY2VsZWQgPSBlcnIgaW5zdGFuY2VvZiB1dGlsLlVzZXJDYW5jZWxlZDtcbiAgICBpZiAodXNlckNhbmNlbGVkKSB7XG4gICAgICBhbGxvd1JlcG9ydCA9IGZhbHNlO1xuICAgIH1cbiAgICBjb25zdCBidXN5UmVzb3VyY2UgPSBlcnIgaW5zdGFuY2VvZiBSZXNvdXJjZUluYWNjZXNzaWJsZUVycm9yO1xuICAgIGlmIChhbGxvd1JlcG9ydCAmJiBidXN5UmVzb3VyY2UpIHtcbiAgICAgIGFsbG93UmVwb3J0ID0gZXJyLmFsbG93UmVwb3J0O1xuICAgICAgZXJyLm1lc3NhZ2UgPSBlcnIuZXJyb3JNZXNzYWdlO1xuICAgIH1cbiAgXG4gICAgdGhpcy5tQXBpLnNob3dFcnJvck5vdGlmaWNhdGlvbihlcnJNZXNzYWdlLCBlcnIsIHsgYWxsb3dSZXBvcnQgfSk7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgcHVibGljIGFzeW5jIHJlYWRTdHJ1Y3R1cmUoKTogUHJvbWlzZTx7IFtrZXk6IHN0cmluZ106IGFueSB9PiB7XG4gICAgY29uc3Qgc3RhdGUgPSB0aGlzLm1BcGkuZ2V0U3RhdGUoKTtcbiAgICBjb25zdCBhY3RpdmVQcm9maWxlID0gc2VsZWN0b3JzLmFjdGl2ZVByb2ZpbGUoc3RhdGUpO1xuICAgIGlmIChhY3RpdmVQcm9maWxlPy5pZCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKG51bGwpO1xuICAgIH1cbiAgXG4gICAgY29uc3QgZmlsZVBhdGggPSBnZXRMb2FkT3JkZXJGaWxlUGF0aCgpO1xuICAgIGNvbnN0IHBhcnNlciA9IG5ldyBJbmlQYXJzZXIobmV3IFdpbmFwaUZvcm1hdCgpKTtcbiAgICBjb25zdCBpbmkgPSBhd2FpdCBwYXJzZXIucmVhZChmaWxlUGF0aCk7XG4gICAgY29uc3QgZGF0YSA9IE9iamVjdC5lbnRyaWVzKGluaS5kYXRhKS5yZWR1Y2UoKGFjY3VtLCBba2V5LCB2YWx1ZV0pID0+IHtcbiAgICAgIGlmIChrZXkudG9Mb3dlckNhc2UoKS5zdGFydHNXaXRoKCdkbGMnKSkge1xuICAgICAgICByZXR1cm4gYWNjdW07XG4gICAgICB9XG4gICAgICBhY2N1bVtrZXldID0gdmFsdWU7XG4gICAgICByZXR1cm4gYWNjdW07XG4gICAgfSwge30pO1xuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoZGF0YSk7XG4gIH1cblxuICBwdWJsaWMgYXN5bmMgd3JpdGVUb01vZFNldHRpbmdzKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IGZpbGVQYXRoID0gZ2V0TG9hZE9yZGVyRmlsZVBhdGgoKTtcbiAgICBjb25zdCBwYXJzZXIgPSBuZXcgSW5pUGFyc2VyKG5ldyBXaW5hcGlGb3JtYXQoKSk7XG4gICAgdHJ5IHtcbiAgICAgIGF3YWl0IGZzLnJlbW92ZUFzeW5jKGZpbGVQYXRoKTtcbiAgICAgIGF3YWl0IGZzLndyaXRlRmlsZUFzeW5jKGZpbGVQYXRoLCAnJywgeyBlbmNvZGluZzogJ3V0ZjgnIH0pO1xuICAgICAgY29uc3QgaW5pID0gYXdhaXQgdGhpcy5lbnN1cmVNb2RTZXR0aW5ncygpO1xuICAgICAgY29uc3Qgc3RydWN0ID0gT2JqZWN0LmtleXModGhpcy5tSW5pU3RydWN0KS5zb3J0KChhLCBiKSA9PiB0aGlzLm1JbmlTdHJ1Y3RbYV0uUHJpb3JpdHkgLSB0aGlzLm1JbmlTdHJ1Y3RbYl0uUHJpb3JpdHkpO1xuICAgICAgZm9yIChjb25zdCBrZXkgb2Ygc3RydWN0KSB7XG4gICAgICAgIGlmICh0aGlzLm1JbmlTdHJ1Y3Q/LltrZXldPy5FbmFibGVkID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAvLyBJdCdzIHBvc3NpYmxlIGZvciB0aGUgdXNlciB0byBydW4gbXVsdGlwbGUgb3BlcmF0aW9ucyBhdCBvbmNlLFxuICAgICAgICAgIC8vICBjYXVzaW5nIHRoZSBzdGF0aWMgaW5pIHN0cnVjdHVyZSB0byBiZSBtb2RpZmllZFxuICAgICAgICAgIC8vICBlbHNld2hlcmUgd2hpbGUgd2UncmUgYXR0ZW1wdGluZyB0byB3cml0ZSB0byBmaWxlLiBUaGUgdXNlciBtdXN0J3ZlIGJlZW5cbiAgICAgICAgICAvLyAgbW9kaWZ5aW5nIHRoZSBsb2FkIG9yZGVyIHdoaWxlIGRlcGxveWluZy4gVGhpcyBzaG91bGRcbiAgICAgICAgICAvLyAgbWFrZSBzdXJlIHdlIGRvbid0IGF0dGVtcHQgdG8gd3JpdGUgYW55IGludmFsaWQgbW9kIGVudHJpZXMuXG4gICAgICAgICAgLy8gIGh0dHBzOi8vZ2l0aHViLmNvbS9OZXh1cy1Nb2RzL1ZvcnRleC9pc3N1ZXMvODQzN1xuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgaW5pLmRhdGFba2V5XSA9IHtcbiAgICAgICAgICBFbmFibGVkOiB0aGlzLm1JbmlTdHJ1Y3Rba2V5XS5FbmFibGVkLFxuICAgICAgICAgIFByaW9yaXR5OiB0aGlzLm1JbmlTdHJ1Y3Rba2V5XS5Qcmlvcml0eSxcbiAgICAgICAgICBWSzogdGhpcy5tSW5pU3RydWN0W2tleV0uVkssXG4gICAgICAgIH07XG4gICAgICB9XG4gICAgICBhd2FpdCBwYXJzZXIud3JpdGUoZmlsZVBhdGgsIGluaSk7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG4gICAgfSBjYXRjaChlcnIpIHtcbiAgICAgIHJldHVybiAoZXJyLnBhdGggIT09IHVuZGVmaW5lZCAmJiBbJ0VQRVJNJywgJ0VCVVNZJ10uaW5jbHVkZXMoZXJyLmNvZGUpKVxuICAgICAgICA/IFByb21pc2UucmVqZWN0KG5ldyBSZXNvdXJjZUluYWNjZXNzaWJsZUVycm9yKGVyci5wYXRoKSlcbiAgICAgICAgOiBQcm9taXNlLnJlamVjdChlcnIpXG4gICAgfSBcbiAgfVxufSJdfQ==