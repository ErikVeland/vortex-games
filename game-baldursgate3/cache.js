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
const path = __importStar(require("path"));
const vortex_api_1 = require("vortex-api");
const common_1 = require("./common");
const divineWrapper_1 = require("./divineWrapper");
const util_1 = require("./util");
const lru_cache_1 = __importDefault(require("lru-cache"));
class PakInfoCache {
    static getInstance(api) {
        if (!PakInfoCache.instance) {
            PakInfoCache.instance = new PakInfoCache(api);
        }
        return PakInfoCache.instance;
    }
    constructor(api) {
        this.mApi = api;
        this.mCache = new lru_cache_1.default({ max: 700 });
        this.load(api);
    }
    getCacheEntry(api, filePath, mod) {
        return __awaiter(this, void 0, void 0, function* () {
            const id = this.fileId(filePath);
            const stat = yield vortex_api_1.fs.statAsync(filePath);
            const ctime = stat.ctimeMs;
            const hasChanged = (entry) => {
                var _a, _b;
                return (!!mod && !!entry.mod)
                    ? ((_a = mod.attributes) === null || _a === void 0 ? void 0 : _a.fileId) !== ((_b = entry.mod.attributes) === null || _b === void 0 ? void 0 : _b.fileId)
                    : ctime !== (entry === null || entry === void 0 ? void 0 : entry.lastModified);
            };
            const cacheEntry = yield this.mCache.get(id);
            const packageNotListed = ((cacheEntry === null || cacheEntry === void 0 ? void 0 : cacheEntry.packageList) || []).length === 0;
            if (!cacheEntry || hasChanged(cacheEntry) || packageNotListed) {
                const packageList = yield (0, divineWrapper_1.listPackage)(api, filePath);
                const isListed = this.isLOListed(api, filePath, packageList);
                const info = yield (0, util_1.extractPakInfoImpl)(api, filePath, mod, isListed);
                this.mCache.set(id, {
                    fileName: path.basename(filePath),
                    lastModified: ctime,
                    info,
                    packageList,
                    mod,
                    isListed,
                });
            }
            return this.mCache.get(id);
        });
    }
    reset() {
        this.mCache = new lru_cache_1.default({ max: 700 });
        this.save();
    }
    save() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.mCache) {
                return;
            }
            const state = this.mApi.getState();
            const profileId = vortex_api_1.selectors.lastActiveProfileForGame(state, common_1.GAME_ID);
            const staging = vortex_api_1.selectors.installPathForGame(state, common_1.GAME_ID);
            const cachePath = path.join(path.dirname(staging), 'cache', profileId + '.json');
            try {
                yield vortex_api_1.fs.ensureDirWritableAsync(path.dirname(cachePath));
                const cacheData = Array.from(this.mCache.entries());
                yield vortex_api_1.util.writeFileAtomic(cachePath, JSON.stringify(cacheData));
            }
            catch (err) {
                (0, vortex_api_1.log)('error', 'failed to save cache', err);
                return;
            }
        });
    }
    load(api) {
        return __awaiter(this, void 0, void 0, function* () {
            const state = api.getState();
            const profileId = vortex_api_1.selectors.lastActiveProfileForGame(state, common_1.GAME_ID);
            const staging = vortex_api_1.selectors.installPathForGame(state, common_1.GAME_ID);
            const cachePath = path.join(path.dirname(staging), 'cache', profileId + '.json');
            try {
                yield vortex_api_1.fs.ensureDirWritableAsync(path.dirname(cachePath));
                const data = yield vortex_api_1.fs.readFileAsync(cachePath, { encoding: 'utf8' });
                const cacheData = JSON.parse(data);
                if (Array.isArray(cacheData)) {
                    for (const [key, value] of cacheData) {
                        this.mCache.set(key, value);
                    }
                }
            }
            catch (err) {
                if (!['ENOENT'].includes(err.code)) {
                    (0, vortex_api_1.log)('error', 'failed to load cache', err);
                }
            }
        });
    }
    isLOListed(api, pakPath, packageList) {
        try {
            const containsMetaFile = packageList.find(line => path.basename(line.split('\t')[0]).toLowerCase() === 'meta.lsx') !== undefined ? true : false;
            return !containsMetaFile;
        }
        catch (err) {
            api.sendNotification({
                type: 'error',
                message: `${path.basename(pakPath)} couldn't be read correctly. This mod be incorrectly locked/unlocked but will default to unlocked.`,
            });
            return false;
        }
    }
    fileId(filePath) {
        return path.basename(filePath).toUpperCase();
    }
}
exports.default = PakInfoCache;
PakInfoCache.instance = null;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2FjaGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJjYWNoZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQ0EsMkNBQTZCO0FBQzdCLDJDQUE2RDtBQUU3RCxxQ0FBbUM7QUFDbkMsbURBQThDO0FBRTlDLGlDQUFzRDtBQUV0RCwwREFBaUM7QUFZakMsTUFBcUIsWUFBWTtJQUV4QixNQUFNLENBQUMsV0FBVyxDQUFDLEdBQXdCO1FBQ2hELElBQUksQ0FBQyxZQUFZLENBQUMsUUFBUSxFQUFFO1lBQzFCLFlBQVksQ0FBQyxRQUFRLEdBQUcsSUFBSSxZQUFZLENBQUMsR0FBRyxDQUFDLENBQUM7U0FDL0M7UUFFRCxPQUFPLFlBQVksQ0FBQyxRQUFRLENBQUM7SUFDL0IsQ0FBQztJQUtELFlBQVksR0FBd0I7UUFFbEMsSUFBSSxDQUFDLElBQUksR0FBRyxHQUFHLENBQUM7UUFDaEIsSUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLG1CQUFRLENBQXNCLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxDQUFDLENBQUM7UUFDOUQsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUNqQixDQUFDO0lBRVksYUFBYSxDQUFDLEdBQXdCLEVBQ3hCLFFBQWdCLEVBQ2hCLEdBQWdCOztZQUN6QyxNQUFNLEVBQUUsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQ2pDLE1BQU0sSUFBSSxHQUFHLE1BQU0sZUFBRSxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUMxQyxNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDO1lBQzNCLE1BQU0sVUFBVSxHQUFHLENBQUMsS0FBa0IsRUFBRSxFQUFFOztnQkFDeEMsT0FBTyxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUM7b0JBQzNCLENB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Q0FBQyxHQUF3QixFQUFFLE9BQWUsRUFBRSxXQUFxQjtRQUNqRixJQUFJO1lBR0YsTUFBTSxnQkFBZ0IsR0FBRyxXQUFXLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsV0FBVyxFQUFFLEtBQUssVUFBVSxDQUFDLEtBQUssU0FBUyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQztZQUdoSixPQUFPLENBQUMsZ0JBQWdCLENBQUM7U0FDMUI7UUFBQyxPQUFPLEdBQUcsRUFBRTtZQUNaLEdBQUcsQ0FBQyxnQkFBZ0IsQ0FBQztnQkFDbkIsSUFBSSxFQUFFLE9BQU87Z0JBQ2IsT0FBTyxFQUFFLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsb0dBQW9HO2FBQ3ZJLENBQUMsQ0FBQztZQUNILE9BQU8sS0FBSyxDQUFDO1NBQ2Q7SUFDSCxDQUFDO0lBRU8sTUFBTSxDQUFDLFFBQWdCO1FBQzdCLE9BQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsQ0FBQyxXQUFXLEVBQUUsQ0FBQztJQUMvQyxDQUFDOztBQXBISCwrQkFxSEM7QUFwSGdCLHFCQUFRLEdBQWlCLElBQUksQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qIGVzbGludC1kaXNhYmxlICovXG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0IHsgZnMsIGxvZywgc2VsZWN0b3JzLCB0eXBlcywgdXRpbCB9IGZyb20gJ3ZvcnRleC1hcGknO1xuXG5pbXBvcnQgeyBHQU1FX0lEIH0gZnJvbSAnLi9jb21tb24nO1xuaW1wb3J0IHsgbGlzdFBhY2thZ2UgfSBmcm9tICcuL2RpdmluZVdyYXBwZXInO1xuaW1wb3J0IHsgSVBha0luZm8gfSBmcm9tICcuL3R5cGVzJztcbmltcG9ydCB7IGV4dHJhY3RQYWtJbmZvSW1wbCwgbG9nRGVidWcgfSBmcm9tICcuL3V0aWwnO1xuXG5pbXBvcnQgTFJVQ2FjaGUgZnJvbSAnbHJ1LWNhY2hlJztcblxuZXhwb3J0IGludGVyZmFjZSBJQ2FjaGVFbnRyeSB7XG4gIGxhc3RNb2RpZmllZDogbnVtYmVyO1xuICBpbmZvOiBJUGFrSW5mbztcbiAgZmlsZU5hbWU6IHN0cmluZztcbiAgcGFja2FnZUxpc3Q6IHN0cmluZ1tdO1xuICBpc0xpc3RlZDogYm9vbGVhbjtcbiAgbW9kPzogdHlwZXMuSU1vZDtcbn1cblxudHlwZSBJUGFrTWFwID0gTFJVQ2FjaGU8c3RyaW5nLCBJQ2FjaGVFbnRyeT47XG5leHBvcnQgZGVmYXVsdCBjbGFzcyBQYWtJbmZvQ2FjaGUge1xuICBwcml2YXRlIHN0YXRpYyBpbnN0YW5jZTogUGFrSW5mb0NhY2hlID0gbnVsbDtcbiAgcHVibGljIHN0YXRpYyBnZXRJbnN0YW5jZShhcGk6IHR5cGVzLklFeHRlbnNpb25BcGkpOiBQYWtJbmZvQ2FjaGUge1xuICAgIGlmICghUGFrSW5mb0NhY2hlLmluc3RhbmNlKSB7XG4gICAgICBQYWtJbmZvQ2FjaGUuaW5zdGFuY2UgPSBuZXcgUGFrSW5mb0NhY2hlKGFwaSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIFBha0luZm9DYWNoZS5pbnN0YW5jZTtcbiAgfVxuXG4gIHByaXZhdGUgbUNhY2hlOiBJUGFrTWFwO1xuICBwcml2YXRlIG1BcGk6IHR5cGVzLklFeHRlbnNpb25BcGk7XG5cbiAgY29uc3RydWN0b3IoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpKSB7XG4gICAgLy8gNzAwIHNob3VsZCBiZSBlbm91Z2ggZm9yIGV2ZXJ5b25lIEkgaG9wZS5cbiAgICB0aGlzLm1BcGkgPSBhcGk7XG4gICAgdGhpcy5tQ2FjaGUgPSBuZXcgTFJVQ2FjaGU8c3RyaW5nLCBJQ2FjaGVFbnRyeT4oeyBtYXg6IDcwMCB9KTtcbiAgICB0aGlzLmxvYWQoYXBpKTtcbiAgfVxuXG4gIHB1YmxpYyBhc3luYyBnZXRDYWNoZUVudHJ5KGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZmlsZVBhdGg6IHN0cmluZyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbW9kPzogdHlwZXMuSU1vZCk6IFByb21pc2U8SUNhY2hlRW50cnk+IHtcbiAgICBjb25zdCBpZCA9IHRoaXMuZmlsZUlkKGZpbGVQYXRoKTtcbiAgICBjb25zdCBzdGF0ID0gYXdhaXQgZnMuc3RhdEFzeW5jKGZpbGVQYXRoKTtcbiAgICBjb25zdCBjdGltZSA9IHN0YXQuY3RpbWVNcztcbiAgICBjb25zdCBoYXNDaGFuZ2VkID0gKGVudHJ5OiBJQ2FjaGVFbnRyeSkgPT4ge1xuICAgICAgcmV0dXJuICghIW1vZCAmJiAhIWVudHJ5Lm1vZClcbiAgICAgICAgPyBtb2QuYXR0cmlidXRlcz8uZmlsZUlkICE9PSBlbnRyeS5tb2QuYXR0cmlidXRlcz8uZmlsZUlkXG4gICAgICAgIDogY3RpbWUgIT09IGVudHJ5Py5sYXN0TW9kaWZpZWQ7XG4gICAgfTtcblxuICAgIGNvbnN0IGNhY2hlRW50cnkgPSBhd2FpdCB0aGlzLm1DYWNoZS5nZXQoaWQpO1xuICAgIGNvbnN0IHBhY2thZ2VOb3RMaXN0ZWQgPSAoY2FjaGVFbnRyeT8ucGFja2FnZUxpc3QgfHwgW10pLmxlbmd0aCA9PT0gMDtcbiAgICBpZiAoIWNhY2hlRW50cnkgfHwgaGFzQ2hhbmdlZChjYWNoZUVudHJ5KSB8fCBwYWNrYWdlTm90TGlzdGVkKSB7XG4gICAgICBjb25zdCBwYWNrYWdlTGlzdCA9IGF3YWl0IGxpc3RQYWNrYWdlKGFwaSwgZmlsZVBhdGgpO1xuICAgICAgY29uc3QgaXNMaXN0ZWQgPSB0aGlzLmlzTE9MaXN0ZWQoYXBpLCBmaWxlUGF0aCwgcGFja2FnZUxpc3QpO1xuICAgICAgY29uc3QgaW5mbyA9IGF3YWl0IGV4dHJhY3RQYWtJbmZvSW1wbChhcGksIGZpbGVQYXRoLCBtb2QsIGlzTGlzdGVkKTtcbiAgICAgIHRoaXMubUNhY2hlLnNldChpZCwge1xuICAgICAgICBmaWxlTmFtZTogcGF0aC5iYXNlbmFtZShmaWxlUGF0aCksXG4gICAgICAgIGxhc3RNb2RpZmllZDogY3RpbWUsXG4gICAgICAgIGluZm8sXG4gICAgICAgIHBhY2thZ2VMaXN0LFxuICAgICAgICBtb2QsXG4gICAgICAgIGlzTGlzdGVkLFxuICAgICAgfSk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLm1DYWNoZS5nZXQoaWQpO1xuICB9XG5cbiAgcHVibGljIHJlc2V0KCkge1xuICAgIHRoaXMubUNhY2hlID0gbmV3IExSVUNhY2hlPHN0cmluZywgSUNhY2hlRW50cnk+KHsgbWF4OiA3MDAgfSk7XG4gICAgdGhpcy5zYXZlKCk7XG4gIH1cblxuICBwdWJsaWMgYXN5bmMgc2F2ZSgpIHtcbiAgICBpZiAoIXRoaXMubUNhY2hlKSB7XG4gICAgICAvLyBOb3RoaW5nIHRvIHNhdmUuXG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGNvbnN0IHN0YXRlID0gdGhpcy5tQXBpLmdldFN0YXRlKCk7XG4gICAgY29uc3QgcHJvZmlsZUlkID0gc2VsZWN0b3JzLmxhc3RBY3RpdmVQcm9maWxlRm9yR2FtZShzdGF0ZSwgR0FNRV9JRCk7XG4gICAgY29uc3Qgc3RhZ2luZyA9IHNlbGVjdG9ycy5pbnN0YWxsUGF0aEZvckdhbWUoc3RhdGUsIEdBTUVfSUQpO1xuICAgIGNvbnN0IGNhY2hlUGF0aCA9IHBhdGguam9pbihwYXRoLmRpcm5hbWUoc3RhZ2luZyksICdjYWNoZScsIHByb2ZpbGVJZCArICcuanNvbicpO1xuICAgIHRyeSB7XG4gICAgICBhd2FpdCBmcy5lbnN1cmVEaXJXcml0YWJsZUFzeW5jKHBhdGguZGlybmFtZShjYWNoZVBhdGgpKTtcbiAgICAgIC8vIENvbnZlcnQgY2FjaGUgZW50cmllcyB0byBhcnJheSBmb3Igc2VyaWFsaXphdGlvblxuICAgICAgY29uc3QgY2FjaGVEYXRhID0gQXJyYXkuZnJvbSh0aGlzLm1DYWNoZS5lbnRyaWVzKCkpO1xuICAgICAgYXdhaXQgdXRpbC53cml0ZUZpbGVBdG9taWMoY2FjaGVQYXRoLCBKU09OLnN0cmluZ2lmeShjYWNoZURhdGEpKTtcbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgIGxvZygnZXJyb3InLCAnZmFpbGVkIHRvIHNhdmUgY2FjaGUnLCBlcnIpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgbG9hZChhcGk6IHR5cGVzLklFeHRlbnNpb25BcGkpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBzdGF0ZSA9IGFwaS5nZXRTdGF0ZSgpO1xuICAgIGNvbnN0IHByb2ZpbGVJZCA9IHNlbGVjdG9ycy5sYXN0QWN0aXZlUHJvZmlsZUZvckdhbWUoc3RhdGUsIEdBTUVfSUQpO1xuICAgIGNvbnN0IHN0YWdpbmcgPSBzZWxlY3RvcnMuaW5zdGFsbFBhdGhGb3JHYW1lKHN0YXRlLCBHQU1FX0lEKTtcbiAgICBjb25zdCBjYWNoZVBhdGggPSBwYXRoLmpvaW4ocGF0aC5kaXJuYW1lKHN0YWdpbmcpLCAnY2FjaGUnLCBwcm9maWxlSWQgKyAnLmpzb24nKTtcbiAgICB0cnkge1xuICAgICAgYXdhaXQgZnMuZW5zdXJlRGlyV3JpdGFibGVBc3luYyhwYXRoLmRpcm5hbWUoY2FjaGVQYXRoKSk7XG4gICAgICBjb25zdCBkYXRhID0gYXdhaXQgZnMucmVhZEZpbGVBc3luYyhjYWNoZVBhdGgsIHsgZW5jb2Rpbmc6ICd1dGY4JyB9KTtcbiAgICAgIGNvbnN0IGNhY2hlRGF0YSA9IEpTT04ucGFyc2UoZGF0YSk7XG4gICAgICAvLyBSZXN0b3JlIGNhY2hlIGVudHJpZXMgZnJvbSBhcnJheVxuICAgICAgaWYgKEFycmF5LmlzQXJyYXkoY2FjaGVEYXRhKSkge1xuICAgICAgICBmb3IgKGNvbnN0IFtrZXksIHZhbHVlXSBvZiBjYWNoZURhdGEpIHtcbiAgICAgICAgICB0aGlzLm1DYWNoZS5zZXQoa2V5LCB2YWx1ZSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgIGlmICghWydFTk9FTlQnXS5pbmNsdWRlcyhlcnIuY29kZSkpIHtcbiAgICAgICAgbG9nKCdlcnJvcicsICdmYWlsZWQgdG8gbG9hZCBjYWNoZScsIGVycik7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBpc0xPTGlzdGVkKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSwgcGFrUGF0aDogc3RyaW5nLCBwYWNrYWdlTGlzdDogc3RyaW5nW10pOiBib29sZWFuIHtcbiAgICB0cnkge1xuICAgICAgLy8gbG9vayBhdCB0aGUgZW5kIG9mIHRoZSBmaXJzdCBiaXQgb2YgZGF0YSB0byBzZWUgaWYgaXQgaGFzIGEgbWV0YS5sc3ggZmlsZVxuICAgICAgLy8gZXhhbXBsZSAnTW9kcy9TYWZlIEVkaXRpb24vbWV0YS5sc3hcXHQxNzU5XFx0MCdcbiAgICAgIGNvbnN0IGNvbnRhaW5zTWV0YUZpbGUgPSBwYWNrYWdlTGlzdC5maW5kKGxpbmUgPT4gcGF0aC5iYXNlbmFtZShsaW5lLnNwbGl0KCdcXHQnKVswXSkudG9Mb3dlckNhc2UoKSA9PT0gJ21ldGEubHN4JykgIT09IHVuZGVmaW5lZCA/IHRydWUgOiBmYWxzZTtcblxuICAgICAgLy8gaW52ZXJ0IHJlc3VsdCBhcyAnbGlzdGVkJyBtZWFucyBpdCBkb2Vzbid0IGNvbnRhaW4gYSBtZXRhIGZpbGUuXG4gICAgICByZXR1cm4gIWNvbnRhaW5zTWV0YUZpbGU7XG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICBhcGkuc2VuZE5vdGlmaWNhdGlvbih7XG4gICAgICAgIHR5cGU6ICdlcnJvcicsXG4gICAgICAgIG1lc3NhZ2U6IGAke3BhdGguYmFzZW5hbWUocGFrUGF0aCl9IGNvdWxkbid0IGJlIHJlYWQgY29ycmVjdGx5LiBUaGlzIG1vZCBiZSBpbmNvcnJlY3RseSBsb2NrZWQvdW5sb2NrZWQgYnV0IHdpbGwgZGVmYXVsdCB0byB1bmxvY2tlZC5gLFxuICAgICAgfSk7XG4gICAgICByZXR1cm4gZmFsc2U7ICAgIFxuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgZmlsZUlkKGZpbGVQYXRoOiBzdHJpbmcpOiBzdHJpbmcge1xuICAgIHJldHVybiBwYXRoLmJhc2VuYW1lKGZpbGVQYXRoKS50b1VwcGVyQ2FzZSgpO1xuICB9XG59XG4iXX0=