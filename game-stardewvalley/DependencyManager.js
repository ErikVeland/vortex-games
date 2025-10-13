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
const turbowalk_1 = __importDefault(require("turbowalk"));
const vortex_api_1 = require("vortex-api");
const common_1 = require("./common");
const util_1 = require("./util");
const path_1 = __importDefault(require("path"));
class DependencyManager {
    constructor(api) {
        this.mLoading = false;
        this.mApi = api;
    }
    getManifests() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.scanManifests();
            return this.mManifests;
        });
    }
    refresh() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.mLoading) {
                return;
            }
            this.mLoading = true;
            yield this.scanManifests(true);
            this.mLoading = false;
        });
    }
    scanManifests(force) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!force && this.mManifests !== undefined) {
                return;
            }
            const state = this.mApi.getState();
            const staging = vortex_api_1.selectors.installPathForGame(state, common_1.GAME_ID);
            const profileId = vortex_api_1.selectors.lastActiveProfileForGame(state, common_1.GAME_ID);
            const profile = vortex_api_1.selectors.profileById(state, profileId);
            const isInstalled = (mod) => (mod === null || mod === void 0 ? void 0 : mod.state) === 'installed';
            const isActive = (modId) => vortex_api_1.util.getSafe(profile, ['modState', modId, 'enabled'], false);
            const mods = vortex_api_1.util.getSafe(state, ['persistent', 'mods', common_1.GAME_ID], {});
            const manifests = yield Object.values(mods).reduce((accumP, iter) => __awaiter(this, void 0, void 0, function* () {
                const accum = yield accumP;
                if (!isInstalled(iter) || !isActive(iter.id)) {
                    return Promise.resolve(accum);
                }
                const modPath = path_1.default.join(staging, iter.installationPath);
                return (0, turbowalk_1.default)(modPath, (entries) => __awaiter(this, void 0, void 0, function* () {
                    var _a;
                    for (const entry of entries) {
                        if (path_1.default.basename(entry.filePath) === 'manifest.json') {
                            let manifest;
                            try {
                                manifest = yield (0, util_1.parseManifest)(entry.filePath);
                            }
                            catch (err) {
                                (0, vortex_api_1.log)('error', 'failed to parse manifest', { error: err.message, manifest: entry.filePath });
                                continue;
                            }
                            const list = (_a = accum[iter.id]) !== null && _a !== void 0 ? _a : [];
                            list.push(manifest);
                            accum[iter.id] = list;
                        }
                    }
                }), { skipHidden: false, recurse: true, skipInaccessible: true, skipLinks: true })
                    .then(() => Promise.resolve(accum))
                    .catch(err => {
                    if (err['code'] === 'ENOENT') {
                        return Promise.resolve([]);
                    }
                    else {
                        return Promise.reject(err);
                    }
                });
            }), {});
            this.mManifests = manifests;
            return Promise.resolve();
        });
    }
}
exports.default = DependencyManager;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRGVwZW5kZW5jeU1hbmFnZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJEZXBlbmRlbmN5TWFuYWdlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7OztBQUVBLDBEQUFrQztBQUNsQywyQ0FBeUQ7QUFDekQscUNBQW1DO0FBRW5DLGlDQUF1QztBQUV2QyxnREFBd0I7QUFHeEIsTUFBcUIsaUJBQWlCO0lBS3BDLFlBQVksR0FBd0I7UUFGNUIsYUFBUSxHQUFZLEtBQUssQ0FBQztRQUdoQyxJQUFJLENBQUMsSUFBSSxHQUFHLEdBQUcsQ0FBQztJQUNsQixDQUFDO0lBRVksWUFBWTs7WUFDdkIsTUFBTSxJQUFJLENBQUMsYUFBYSxFQUFFLENBQUM7WUFDM0IsT0FBTyxJQUFJLENBQUMsVUFBVSxDQUFDO1FBQ3pCLENBQUM7S0FBQTtJQUVZLE9BQU87O1lBQ2xCLElBQUksSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDO2dCQUNsQixPQUFPO1lBQ1QsQ0FBQztZQUNELElBQUksQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDO1lBQ3JCLE1BQU0sSUFBSSxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUMvQixJQUFJLENBQUMsUUFBUSxHQUFHLEtBQUssQ0FBQztRQUN4QixDQUFDO0tBQUE7SUFFWSxhQUFhLENBQUMsS0FBZTs7WUFDeEMsSUFBSSxDQUFDLEtBQUssSUFBSSxJQUFJLENBQUMsVUFBVSxLQUFLLFNBQVMsRUFBRSxDQUFDO2dCQUM1QyxPQUFPO1lBQ1QsQ0FBQztZQUNELE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUM7WUFDbkMsTUFBTSxPQUFPLEdBQUcsc0JBQVMsQ0FBQyxrQkFBa0IsQ0FBQyxLQUFLLEVBQUUsZ0JBQU8sQ0FBQyxDQUFDO1lBQzdELE1BQU0sU0FBUyxHQUFHLHNCQUFTLENBQUMsd0JBQXdCLENBQUMsS0FBSyxFQUFFLGdCQUFPLENBQUMsQ0FBQztZ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QUFDO2dCQUNILENBQUMsQ0FBQyxDQUFDO1lBQ0wsQ0FBQyxDQUFBLEVBQUUsRUFBRSxDQUFDLENBQUM7WUFDUCxJQUFJLENBQUMsVUFBVSxHQUFHLFNBQVMsQ0FBQztZQUM1QixPQUFPLE9BQU8sQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUMzQixDQUFDO0tBQUE7Q0FDRjtBQXBFRCxvQ0FvRUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiBlc2xpbnQtZGlzYWJsZSAqL1xuaW1wb3J0IHsgSVNEVk1vZE1hbmlmZXN0IH0gZnJvbSAnLi90eXBlcyc7XG5pbXBvcnQgdHVyYm93YWxrIGZyb20gJ3R1cmJvd2Fsayc7XG5pbXBvcnQgeyBsb2csIHR5cGVzLCBzZWxlY3RvcnMsIHV0aWwgfSBmcm9tICd2b3J0ZXgtYXBpJztcbmltcG9ydCB7IEdBTUVfSUQgfSBmcm9tICcuL2NvbW1vbic7XG5cbmltcG9ydCB7IHBhcnNlTWFuaWZlc3QgfSBmcm9tICcuL3V0aWwnO1xuXG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcblxudHlwZSBNYW5pZmVzdE1hcCA9IHsgW21vZElkOiBzdHJpbmddOiBJU0RWTW9kTWFuaWZlc3RbXSB9O1xuZXhwb3J0IGRlZmF1bHQgY2xhc3MgRGVwZW5kZW5jeU1hbmFnZXIge1xuICBwcml2YXRlIG1BcGk6IHR5cGVzLklFeHRlbnNpb25BcGk7XG4gIHByaXZhdGUgbU1hbmlmZXN0czogTWFuaWZlc3RNYXA7XG4gIHByaXZhdGUgbUxvYWRpbmc6IGJvb2xlYW4gPSBmYWxzZTtcblxuICBjb25zdHJ1Y3RvcihhcGk6IHR5cGVzLklFeHRlbnNpb25BcGkpIHtcbiAgICB0aGlzLm1BcGkgPSBhcGk7XG4gIH1cblxuICBwdWJsaWMgYXN5bmMgZ2V0TWFuaWZlc3RzKCk6IFByb21pc2U8TWFuaWZlc3RNYXA+IHtcbiAgICBhd2FpdCB0aGlzLnNjYW5NYW5pZmVzdHMoKTtcbiAgICByZXR1cm4gdGhpcy5tTWFuaWZlc3RzO1xuICB9XG5cbiAgcHVibGljIGFzeW5jIHJlZnJlc2goKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKHRoaXMubUxvYWRpbmcpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdGhpcy5tTG9hZGluZyA9IHRydWU7XG4gICAgYXdhaXQgdGhpcy5zY2FuTWFuaWZlc3RzKHRydWUpO1xuICAgIHRoaXMubUxvYWRpbmcgPSBmYWxzZTtcbiAgfVxuXG4gIHB1YmxpYyBhc3luYyBzY2FuTWFuaWZlc3RzKGZvcmNlPzogYm9vbGVhbik6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICghZm9yY2UgJiYgdGhpcy5tTWFuaWZlc3RzICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY29uc3Qgc3RhdGUgPSB0aGlzLm1BcGkuZ2V0U3RhdGUoKTtcbiAgICBjb25zdCBzdGFnaW5nID0gc2VsZWN0b3JzLmluc3RhbGxQYXRoRm9yR2FtZShzdGF0ZSwgR0FNRV9JRCk7XG4gICAgY29uc3QgcHJvZmlsZUlkID0gc2VsZWN0b3JzLmxhc3RBY3RpdmVQcm9maWxlRm9yR2FtZShzdGF0ZSwgR0FNRV9JRCk7XG4gICAgY29uc3QgcHJvZmlsZSA9IHNlbGVjdG9ycy5wcm9maWxlQnlJZChzdGF0ZSwgcHJvZmlsZUlkKTtcbiAgICBjb25zdCBpc0luc3RhbGxlZCA9IChtb2Q6IHR5cGVzLklNb2QpID0+IG1vZD8uc3RhdGUgPT09ICdpbnN0YWxsZWQnO1xuICAgIGNvbnN0IGlzQWN0aXZlID0gKG1vZElkOiBzdHJpbmcpID0+IHV0aWwuZ2V0U2FmZShwcm9maWxlLCBbJ21vZFN0YXRlJywgbW9kSWQsICdlbmFibGVkJ10sIGZhbHNlKTtcbiAgICBjb25zdCBtb2RzOiB7IFttb2RJZDogc3RyaW5nXTogdHlwZXMuSU1vZCB9ID0gdXRpbC5nZXRTYWZlKHN0YXRlLCBbJ3BlcnNpc3RlbnQnLCAnbW9kcycsIEdBTUVfSURdLCB7fSk7XG4gICAgY29uc3QgbWFuaWZlc3RzID0gYXdhaXQgT2JqZWN0LnZhbHVlcyhtb2RzKS5yZWR1Y2UoYXN5bmMgKGFjY3VtUCwgaXRlcikgPT4ge1xuICAgICAgY29uc3QgYWNjdW0gPSBhd2FpdCBhY2N1bVA7ICAgICAgXG4gICAgICBpZiAoIWlzSW5zdGFsbGVkKGl0ZXIpIHx8ICFpc0FjdGl2ZShpdGVyLmlkKSkge1xuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKGFjY3VtKTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IG1vZFBhdGggPSBwYXRoLmpvaW4oc3RhZ2luZywgaXRlci5pbnN0YWxsYXRpb25QYXRoKTtcbiAgICAgIHJldHVybiB0dXJib3dhbGsobW9kUGF0aCwgYXN5bmMgZW50cmllcyA9PiB7XG4gICAgICBmb3IgKGNvbnN0IGVudHJ5IG9mIGVudHJpZXMpIHtcbiAgICAgICAgaWYgKHBhdGguYmFzZW5hbWUoZW50cnkuZmlsZVBhdGgpID09PSAnbWFuaWZlc3QuanNvbicpIHtcbiAgICAgICAgICBsZXQgbWFuaWZlc3Q7XG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIG1hbmlmZXN0ID0gYXdhaXQgcGFyc2VNYW5pZmVzdChlbnRyeS5maWxlUGF0aCk7XG4gICAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICBsb2coJ2Vycm9yJywgJ2ZhaWxlZCB0byBwYXJzZSBtYW5pZmVzdCcsIHsgZXJyb3I6IGVyci5tZXNzYWdlLCBtYW5pZmVzdDogZW50cnkuZmlsZVBhdGggfSk7XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICB9XG4gICAgICAgICAgY29uc3QgbGlzdCA9IGFjY3VtW2l0ZXIuaWRdID8/IFtdO1xuICAgICAgICAgIGxpc3QucHVzaChtYW5pZmVzdCk7XG4gICAgICAgICAgYWNjdW1baXRlci5pZF0gPSBsaXN0O1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICB9LCB7IHNraXBIaWRkZW46IGZhbHNlLCByZWN1cnNlOiB0cnVlLCBza2lwSW5hY2Nlc3NpYmxlOiB0cnVlLCBza2lwTGlua3M6IHRydWV9KVxuICAgICAgLnRoZW4oKCkgPT4gUHJvbWlzZS5yZXNvbHZlKGFjY3VtKSlcbiAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICBpZiAoZXJyWydjb2RlJ10gPT09ICdFTk9FTlQnKSB7XG4gICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShbXSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KGVycik7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH0sIHt9KTtcbiAgICB0aGlzLm1NYW5pZmVzdHMgPSBtYW5pZmVzdHM7XG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xuICB9XG59XG4iXX0=