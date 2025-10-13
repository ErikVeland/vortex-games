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
PakInfoCache.instance = null;
exports.default = PakInfoCache;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2FjaGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJjYWNoZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUNBLDJDQUE2QjtBQUM3QiwyQ0FBNkQ7QUFFN0QscUNBQW1DO0FBQ25DLG1EQUE4QztBQUU5QyxpQ0FBc0Q7QUFFdEQsMERBQWlDO0FBWWpDLE1BQXFCLFlBQVk7SUFFeEIsTUFBTSxDQUFDLFdBQVcsQ0FBQyxHQUF3QjtRQUNoRCxJQUFJLENBQUMsWUFBWSxDQUFDLFFBQVEsRUFBRSxDQUFDO1lBQzNCLFlBQVksQ0FBQyxRQUFRLEdBQUcsSUFBSSxZQUFZLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDaEQsQ0FBQztRQUVELE9BQU8sWUFBWSxDQUFDLFFBQVEsQ0FBQztJQUMvQixDQUFDO0lBS0QsWUFBWSxHQUF3QjtRQUVsQyxJQUFJLENBQUMsSUFBSSxHQUFHLEdBQUcsQ0FBQztRQUNoQixJQUFJLENBQUMsTUFBTSxHQUFHLElBQUksbUJBQVEsQ0FBc0IsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLENBQUMsQ0FBQztRQUM5RCxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQ2pCLENBQUM7SUFFWSxhQUFhLENBQUMsR0FBd0IsRUFDeEIsUUFBZ0IsRUFDaEIsR0FBZ0I7O1lBQ3pDLE1BQU0sRUFBRSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDakMsTUFBTSxJQUFJLEdBQUcsTUFBTSxlQUFFLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQzFDLE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUM7WUFDM0IsTUFBTSxVQUFVLEdBQUcsQ0FBQyxLQUFrQixFQUFFLEVBQUU7O2dCQUN4QyxPQUFPLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsS0FBSyxDQUFD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QUM7b0JBQ25DLElBQUEsZ0JBQUcsRUFBQyxPQUFPLEVBQUUsc0JBQXNCLEVBQUUsR0FBRyxDQUFDLENBQUM7Z0JBQzVDLENBQUM7WUFDSCxDQUFDO1FBQ0gsQ0FBQztLQUFBO0lBRU8sVUFBVSxDQUFDLEdBQXdCLEVBQUUsT0FBZSxFQUFFLFdBQXFCO1FBQ2pGLElBQUksQ0FBQztZQUdILE1BQU0sZ0JBQWdCLEdBQUcsV0FBVyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLFdBQVcsRUFBRSxLQUFLLFVBQVUsQ0FBQyxLQUFLLFNBQVMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUM7WUFHaEosT0FBTyxDQUFDLGdCQUFnQixDQUFDO1FBQzNCLENBQUM7UUFBQyxPQUFPLEdBQUcsRUFBRSxDQUFDO1lBQ2IsR0FBRyxDQUFDLGdCQUFnQixDQUFDO2dCQUNuQixJQUFJLEVBQUUsT0FBTztnQkFDYixPQUFPLEVBQUUsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxvR0FBb0c7YUFDdkksQ0FBQyxDQUFDO1lBQ0gsT0FBTyxLQUFLLENBQUM7UUFDZixDQUFDO0lBQ0gsQ0FBQztJQUVPLE1BQU0sQ0FBQyxRQUFnQjtRQUM3QixPQUFPLElBQUksQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLENBQUMsV0FBVyxFQUFFLENBQUM7SUFDL0MsQ0FBQzs7QUFuSGMscUJBQVEsR0FBaUIsSUFBSSxDQUFDO2tCQUQxQixZQUFZIiwic291cmNlc0NvbnRlbnQiOlsiLyogZXNsaW50LWRpc2FibGUgKi9cbmltcG9ydCAqIGFzIHBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgeyBmcywgbG9nLCBzZWxlY3RvcnMsIHR5cGVzLCB1dGlsIH0gZnJvbSAndm9ydGV4LWFwaSc7XG5cbmltcG9ydCB7IEdBTUVfSUQgfSBmcm9tICcuL2NvbW1vbic7XG5pbXBvcnQgeyBsaXN0UGFja2FnZSB9IGZyb20gJy4vZGl2aW5lV3JhcHBlcic7XG5pbXBvcnQgeyBJUGFrSW5mbyB9IGZyb20gJy4vdHlwZXMnO1xuaW1wb3J0IHsgZXh0cmFjdFBha0luZm9JbXBsLCBsb2dEZWJ1ZyB9IGZyb20gJy4vdXRpbCc7XG5cbmltcG9ydCBMUlVDYWNoZSBmcm9tICdscnUtY2FjaGUnO1xuXG5leHBvcnQgaW50ZXJmYWNlIElDYWNoZUVudHJ5IHtcbiAgbGFzdE1vZGlmaWVkOiBudW1iZXI7XG4gIGluZm86IElQYWtJbmZvO1xuICBmaWxlTmFtZTogc3RyaW5nO1xuICBwYWNrYWdlTGlzdDogc3RyaW5nW107XG4gIGlzTGlzdGVkOiBib29sZWFuO1xuICBtb2Q/OiB0eXBlcy5JTW9kO1xufVxuXG50eXBlIElQYWtNYXAgPSBMUlVDYWNoZTxzdHJpbmcsIElDYWNoZUVudHJ5PjtcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFBha0luZm9DYWNoZSB7XG4gIHByaXZhdGUgc3RhdGljIGluc3RhbmNlOiBQYWtJbmZvQ2FjaGUgPSBudWxsO1xuICBwdWJsaWMgc3RhdGljIGdldEluc3RhbmNlKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSk6IFBha0luZm9DYWNoZSB7XG4gICAgaWYgKCFQYWtJbmZvQ2FjaGUuaW5zdGFuY2UpIHtcbiAgICAgIFBha0luZm9DYWNoZS5pbnN0YW5jZSA9IG5ldyBQYWtJbmZvQ2FjaGUoYXBpKTtcbiAgICB9XG5cbiAgICByZXR1cm4gUGFrSW5mb0NhY2hlLmluc3RhbmNlO1xuICB9XG5cbiAgcHJpdmF0ZSBtQ2FjaGU6IElQYWtNYXA7XG4gIHByaXZhdGUgbUFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaTtcblxuICBjb25zdHJ1Y3RvcihhcGk6IHR5cGVzLklFeHRlbnNpb25BcGkpIHtcbiAgICAvLyA3MDAgc2hvdWxkIGJlIGVub3VnaCBmb3IgZXZlcnlvbmUgSSBob3BlLlxuICAgIHRoaXMubUFwaSA9IGFwaTtcbiAgICB0aGlzLm1DYWNoZSA9IG5ldyBMUlVDYWNoZTxzdHJpbmcsIElDYWNoZUVudHJ5Pih7IG1heDogNzAwIH0pO1xuICAgIHRoaXMubG9hZChhcGkpO1xuICB9XG5cbiAgcHVibGljIGFzeW5jIGdldENhY2hlRW50cnkoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmaWxlUGF0aDogc3RyaW5nLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtb2Q/OiB0eXBlcy5JTW9kKTogUHJvbWlzZTxJQ2FjaGVFbnRyeT4ge1xuICAgIGNvbnN0IGlkID0gdGhpcy5maWxlSWQoZmlsZVBhdGgpO1xuICAgIGNvbnN0IHN0YXQgPSBhd2FpdCBmcy5zdGF0QXN5bmMoZmlsZVBhdGgpO1xuICAgIGNvbnN0IGN0aW1lID0gc3RhdC5jdGltZU1zO1xuICAgIGNvbnN0IGhhc0NoYW5nZWQgPSAoZW50cnk6IElDYWNoZUVudHJ5KSA9PiB7XG4gICAgICByZXR1cm4gKCEhbW9kICYmICEhZW50cnkubW9kKVxuICAgICAgICA/IG1vZC5hdHRyaWJ1dGVzPy5maWxlSWQgIT09IGVudHJ5Lm1vZC5hdHRyaWJ1dGVzPy5maWxlSWRcbiAgICAgICAgOiBjdGltZSAhPT0gZW50cnk/Lmxhc3RNb2RpZmllZDtcbiAgICB9O1xuXG4gICAgY29uc3QgY2FjaGVFbnRyeSA9IGF3YWl0IHRoaXMubUNhY2hlLmdldChpZCk7XG4gICAgY29uc3QgcGFja2FnZU5vdExpc3RlZCA9IChjYWNoZUVudHJ5Py5wYWNrYWdlTGlzdCB8fCBbXSkubGVuZ3RoID09PSAwO1xuICAgIGlmICghY2FjaGVFbnRyeSB8fCBoYXNDaGFuZ2VkKGNhY2hlRW50cnkpIHx8IHBhY2thZ2VOb3RMaXN0ZWQpIHtcbiAgICAgIGNvbnN0IHBhY2thZ2VMaXN0ID0gYXdhaXQgbGlzdFBhY2thZ2UoYXBpLCBmaWxlUGF0aCk7XG4gICAgICBjb25zdCBpc0xpc3RlZCA9IHRoaXMuaXNMT0xpc3RlZChhcGksIGZpbGVQYXRoLCBwYWNrYWdlTGlzdCk7XG4gICAgICBjb25zdCBpbmZvID0gYXdhaXQgZXh0cmFjdFBha0luZm9JbXBsKGFwaSwgZmlsZVBhdGgsIG1vZCwgaXNMaXN0ZWQpO1xuICAgICAgdGhpcy5tQ2FjaGUuc2V0KGlkLCB7XG4gICAgICAgIGZpbGVOYW1lOiBwYXRoLmJhc2VuYW1lKGZpbGVQYXRoKSxcbiAgICAgICAgbGFzdE1vZGlmaWVkOiBjdGltZSxcbiAgICAgICAgaW5mbyxcbiAgICAgICAgcGFja2FnZUxpc3QsXG4gICAgICAgIG1vZCxcbiAgICAgICAgaXNMaXN0ZWQsXG4gICAgICB9KTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMubUNhY2hlLmdldChpZCk7XG4gIH1cblxuICBwdWJsaWMgcmVzZXQoKSB7XG4gICAgdGhpcy5tQ2FjaGUgPSBuZXcgTFJVQ2FjaGU8c3RyaW5nLCBJQ2FjaGVFbnRyeT4oeyBtYXg6IDcwMCB9KTtcbiAgICB0aGlzLnNhdmUoKTtcbiAgfVxuXG4gIHB1YmxpYyBhc3luYyBzYXZlKCkge1xuICAgIGlmICghdGhpcy5tQ2FjaGUpIHtcbiAgICAgIC8vIE5vdGhpbmcgdG8gc2F2ZS5cbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY29uc3Qgc3RhdGUgPSB0aGlzLm1BcGkuZ2V0U3RhdGUoKTtcbiAgICBjb25zdCBwcm9maWxlSWQgPSBzZWxlY3RvcnMubGFzdEFjdGl2ZVByb2ZpbGVGb3JHYW1lKHN0YXRlLCBHQU1FX0lEKTtcbiAgICBjb25zdCBzdGFnaW5nID0gc2VsZWN0b3JzLmluc3RhbGxQYXRoRm9yR2FtZShzdGF0ZSwgR0FNRV9JRCk7XG4gICAgY29uc3QgY2FjaGVQYXRoID0gcGF0aC5qb2luKHBhdGguZGlybmFtZShzdGFnaW5nKSwgJ2NhY2hlJywgcHJvZmlsZUlkICsgJy5qc29uJyk7XG4gICAgdHJ5IHtcbiAgICAgIGF3YWl0IGZzLmVuc3VyZURpcldyaXRhYmxlQXN5bmMocGF0aC5kaXJuYW1lKGNhY2hlUGF0aCkpO1xuICAgICAgLy8gQ29udmVydCBjYWNoZSBlbnRyaWVzIHRvIGFycmF5IGZvciBzZXJpYWxpemF0aW9uXG4gICAgICBjb25zdCBjYWNoZURhdGEgPSBBcnJheS5mcm9tKHRoaXMubUNhY2hlLmVudHJpZXMoKSk7XG4gICAgICBhd2FpdCB1dGlsLndyaXRlRmlsZUF0b21pYyhjYWNoZVBhdGgsIEpTT04uc3RyaW5naWZ5KGNhY2hlRGF0YSkpO1xuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgbG9nKCdlcnJvcicsICdmYWlsZWQgdG8gc2F2ZSBjYWNoZScsIGVycik7XG4gICAgICByZXR1cm47XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBsb2FkKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IHN0YXRlID0gYXBpLmdldFN0YXRlKCk7XG4gICAgY29uc3QgcHJvZmlsZUlkID0gc2VsZWN0b3JzLmxhc3RBY3RpdmVQcm9maWxlRm9yR2FtZShzdGF0ZSwgR0FNRV9JRCk7XG4gICAgY29uc3Qgc3RhZ2luZyA9IHNlbGVjdG9ycy5pbnN0YWxsUGF0aEZvckdhbWUoc3RhdGUsIEdBTUVfSUQpO1xuICAgIGNvbnN0IGNhY2hlUGF0aCA9IHBhdGguam9pbihwYXRoLmRpcm5hbWUoc3RhZ2luZyksICdjYWNoZScsIHByb2ZpbGVJZCArICcuanNvbicpO1xuICAgIHRyeSB7XG4gICAgICBhd2FpdCBmcy5lbnN1cmVEaXJXcml0YWJsZUFzeW5jKHBhdGguZGlybmFtZShjYWNoZVBhdGgpKTtcbiAgICAgIGNvbnN0IGRhdGEgPSBhd2FpdCBmcy5yZWFkRmlsZUFzeW5jKGNhY2hlUGF0aCwgeyBlbmNvZGluZzogJ3V0ZjgnIH0pO1xuICAgICAgY29uc3QgY2FjaGVEYXRhID0gSlNPTi5wYXJzZShkYXRhKTtcbiAgICAgIC8vIFJlc3RvcmUgY2FjaGUgZW50cmllcyBmcm9tIGFycmF5XG4gICAgICBpZiAoQXJyYXkuaXNBcnJheShjYWNoZURhdGEpKSB7XG4gICAgICAgIGZvciAoY29uc3QgW2tleSwgdmFsdWVdIG9mIGNhY2hlRGF0YSkge1xuICAgICAgICAgIHRoaXMubUNhY2hlLnNldChrZXksIHZhbHVlKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgaWYgKCFbJ0VOT0VOVCddLmluY2x1ZGVzKGVyci5jb2RlKSkge1xuICAgICAgICBsb2coJ2Vycm9yJywgJ2ZhaWxlZCB0byBsb2FkIGNhY2hlJywgZXJyKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGlzTE9MaXN0ZWQoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpLCBwYWtQYXRoOiBzdHJpbmcsIHBhY2thZ2VMaXN0OiBzdHJpbmdbXSk6IGJvb2xlYW4ge1xuICAgIHRyeSB7XG4gICAgICAvLyBsb29rIGF0IHRoZSBlbmQgb2YgdGhlIGZpcnN0IGJpdCBvZiBkYXRhIHRvIHNlZSBpZiBpdCBoYXMgYSBtZXRhLmxzeCBmaWxlXG4gICAgICAvLyBleGFtcGxlICdNb2RzL1NhZmUgRWRpdGlvbi9tZXRhLmxzeFxcdDE3NTlcXHQwJ1xuICAgICAgY29uc3QgY29udGFpbnNNZXRhRmlsZSA9IHBhY2thZ2VMaXN0LmZpbmQobGluZSA9PiBwYXRoLmJhc2VuYW1lKGxpbmUuc3BsaXQoJ1xcdCcpWzBdKS50b0xvd2VyQ2FzZSgpID09PSAnbWV0YS5sc3gnKSAhPT0gdW5kZWZpbmVkID8gdHJ1ZSA6IGZhbHNlO1xuXG4gICAgICAvLyBpbnZlcnQgcmVzdWx0IGFzICdsaXN0ZWQnIG1lYW5zIGl0IGRvZXNuJ3QgY29udGFpbiBhIG1ldGEgZmlsZS5cbiAgICAgIHJldHVybiAhY29udGFpbnNNZXRhRmlsZTtcbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgIGFwaS5zZW5kTm90aWZpY2F0aW9uKHtcbiAgICAgICAgdHlwZTogJ2Vycm9yJyxcbiAgICAgICAgbWVzc2FnZTogYCR7cGF0aC5iYXNlbmFtZShwYWtQYXRoKX0gY291bGRuJ3QgYmUgcmVhZCBjb3JyZWN0bHkuIFRoaXMgbW9kIGJlIGluY29ycmVjdGx5IGxvY2tlZC91bmxvY2tlZCBidXQgd2lsbCBkZWZhdWx0IHRvIHVubG9ja2VkLmAsXG4gICAgICB9KTtcbiAgICAgIHJldHVybiBmYWxzZTsgICAgXG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBmaWxlSWQoZmlsZVBhdGg6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgcmV0dXJuIHBhdGguYmFzZW5hbWUoZmlsZVBhdGgpLnRvVXBwZXJDYXNlKCk7XG4gIH1cbn1cbiJdfQ==