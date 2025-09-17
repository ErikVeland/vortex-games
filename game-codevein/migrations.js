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
exports.migrate100 = void 0;
const path_1 = __importDefault(require("path"));
const semver_1 = __importDefault(require("semver"));
const vortex_api_1 = require("vortex-api");
const loadOrder_1 = require("./loadOrder");
const common_1 = require("./common");
function migrate100(context, oldVersion) {
    return __awaiter(this, void 0, void 0, function* () {
        if (semver_1.default.gte(oldVersion, '1.0.0')) {
            return Promise.resolve();
        }
        const state = context.api.store.getState();
        const activatorId = vortex_api_1.selectors.activatorForGame(state, common_1.GAME_ID);
        const activator = vortex_api_1.util.getActivator(activatorId);
        const discoveryPath = vortex_api_1.util.getSafe(state, ['settings', 'gameMode', 'discovered', common_1.GAME_ID, 'path'], undefined);
        if (discoveryPath === undefined || activator === undefined) {
            return Promise.resolve();
        }
        const mods = vortex_api_1.util.getSafe(state, ['persistent', 'mods', common_1.GAME_ID], {});
        if (Object.keys(mods).length === 0) {
            return Promise.resolve();
        }
        const profiles = vortex_api_1.util.getSafe(state, ['persistent', 'profiles'], {});
        const loProfiles = Object.keys(profiles).filter(id => { var _a; return ((_a = profiles[id]) === null || _a === void 0 ? void 0 : _a.gameId) === common_1.GAME_ID; });
        const loMap = loProfiles.reduce((accum, iter) => {
            const current = vortex_api_1.util.getSafe(state, ['persistent', 'loadOrder', iter], []);
            const newLO = current.map(entry => {
                return {
                    enabled: true,
                    name: (mods[entry] !== undefined)
                        ? vortex_api_1.util.renderModName(mods[entry])
                        : entry,
                    id: entry,
                    modId: entry,
                };
            });
            accum[iter] = newLO;
            return accum;
        }, {});
        for (const profileId of Object.keys(loMap)) {
            yield (0, loadOrder_1.serialize)(context, loMap[profileId], profileId);
        }
        const modsPath = path_1.default.join(discoveryPath, (0, common_1.modsRelPath)());
        return context.api.awaitUI()
            .then(() => vortex_api_1.fs.ensureDirWritableAsync(modsPath))
            .then(() => context.api.emitAndAwait('purge-mods-in-path', common_1.GAME_ID, '', modsPath))
            .then(() => context.api.store.dispatch(vortex_api_1.actions.setDeploymentNecessary(common_1.GAME_ID, true)));
    });
}
exports.migrate100 = migrate100;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWlncmF0aW9ucy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIm1pZ3JhdGlvbnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsZ0RBQXdCO0FBQ3hCLG9EQUE0QjtBQUM1QiwyQ0FBc0U7QUFDdEUsMkNBQXdDO0FBRXhDLHFDQUFnRDtBQUdoRCxTQUFzQixVQUFVLENBQUMsT0FBTyxFQUFFLFVBQVU7O1FBQ2xELElBQUksZ0JBQU0sQ0FBQyxHQUFHLENBQUMsVUFBVSxFQUFFLE9BQU8sQ0FBQyxFQUFFO1lBQ25DLE9BQU8sT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFDO1NBQzFCO1FBRUQsTUFBTSxLQUFLLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsUUFBUSxFQUFFLENBQUM7UUFDM0MsTUFBTSxXQUFXLEdBQUcsc0JBQVMsQ0FBQyxnQkFBZ0IsQ0FBQyxLQUFLLEVBQUUsZ0JBQU8sQ0FBQyxDQUFDO1FBQy9ELE1BQU0sU0FBUyxHQUFHLGlCQUFJLENBQUMsWUFBWSxDQUFDLFdBQVcsQ0FBQyxDQUFDO1FBQ2pELE1BQU0sYUFBYSxHQUFHLGlCQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssRUFDTCxDQUFDLFVBQVUsRUFBRSxVQUFVLEVBQUUsWUFBWSxFQUFFLGdCQUFPLEVBQUUsTUFBTSxDQUFDLEVBQUUsU0FBUyxDQUFDLENBQUM7UUFFdkcsSUFBSSxhQUFhLEtBQUssU0FBUyxJQUFJLFNBQVMsS0FBSyxTQUFTLEVBQUU7WUFFMUQsT0FBTyxPQUFPLENBQUMsT0FBTyxFQUFFLENBQUM7U0FDMUI7UUFFRCxNQUFNLElBQUksR0FBb0MsaUJBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUNMLENBQUMsWUFBWSxFQUFFLE1BQU0sRUFBRSxnQkFBTyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFDaEcsSUFBSSxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUU7WUFDbEMsT0FBTyxPQUFPLENBQUMsT0FBTyxFQUFFLENBQUM7U0FDMUI7UUFFRCxNQUFNLFFBQVEsR0FBRyxpQkFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsQ0FBQyxZQUFZLEVBQUUsVUFBVSxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFDckUsTUFBTSxVQUFVLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLEVBQUUsV0FBQyxPQUFBLENBQUEsTUFBQSxRQUFRLENBQUMsRUFBRSxDQUFDLDBDQUFFLE1BQU0sTUFBSyxnQkFBTyxDQUFBLEVBQUEsQ0FBQyxDQUFDO1FBQ3hGLE1BQU0sS0FBSyxHQUFvQyxVQUFVLENBQUMsTUFBTSxDQUFDLENBQUMsS0FBSyxFQUFFLElBQUksRUFBRSxFQUFFO1lBQy9FLE1BQU0sT0FBTyxHQUFHLGlCQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxDQUFDLFlBQVksRUFBRSxXQUFXLEVBQUUsSUFBSSxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7WUFDM0UsTUFBTSxLQUFLLEdBQWMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsRUFBRTtnQkFDM0MsT0FBTztvQkFDTCxPQUFPLEVBQUUsSUFBSTtvQkFDYixJQUFJLEVBQUUsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssU0FBUyxDQUFDO3dCQUMvQixDQUFDLENBQUMsaUJBQUksQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO3dCQUNqQyxDQUFDLENBQUMsS0FBSztvQkFDVCxFQUFFLEVBQUUsS0FBSztvQkFDVCxLQUFLLEVBQUUsS0FBSztpQkFDYixDQUFDO1lBQ0osQ0FBQyxDQUFDLENBQUM7WUFDSCxLQUFLLENBQUMsSUFBSSxDQUFDLEdBQUcsS0FBSyxDQUFDO1lBQ3BCLE9BQU8sS0FBSyxDQUFDO1FBQ2YsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBRVAsS0FBSyxNQUFNLFNBQVMsSUFBSSxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxFQUFFO1lBQzFDLE1BQU0sSUFBQSxxQkFBUyxFQUFDLE9BQU8sRUFBRSxLQUFLLENBQUMsU0FBUyxDQUFDLEVBQUUsU0FBUyxDQUFDLENBQUM7U0FDdkQ7UUFFRCxNQUFNLFFBQVEsR0FBRyxjQUFJLENBQUMsSUFBSSxDQUFDLGFBQWEsRUFBRSxJQUFBLG9CQUFXLEdBQUUsQ0FBQyxDQUFDO1FBQ3pELE9BQU8sT0FBTyxDQUFDLEdBQUcsQ0FBQyxPQUFPLEVBQUU7YUFDekIsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDLGVBQUUsQ0FBQyxzQkFBc0IsQ0FBQyxRQUFRLENBQUMsQ0FBQzthQUMvQyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxZQUFZLENBQUMsb0JBQW9CLEVBQUUsZ0JBQU8sRUFBRSxFQUFFLEVBQUUsUUFBUSxDQUFDLENBQUM7YUFDakYsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxvQkFBTyxDQUFDLHNCQUFzQixDQUFDLGdCQUFPLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQzNGLENBQUM7Q0FBQTtBQWpERCxnQ0FpREMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcbmltcG9ydCBzZW12ZXIgZnJvbSAnc2VtdmVyJztcbmltcG9ydCB7IGFjdGlvbnMsIGZzLCBsb2csIHNlbGVjdG9ycywgdHlwZXMsIHV0aWwgfSBmcm9tICd2b3J0ZXgtYXBpJztcbmltcG9ydCB7IHNlcmlhbGl6ZSB9IGZyb20gJy4vbG9hZE9yZGVyJztcblxuaW1wb3J0IHsgR0FNRV9JRCwgbW9kc1JlbFBhdGggfSBmcm9tICcuL2NvbW1vbic7XG5pbXBvcnQgeyBMb2FkT3JkZXIgfSBmcm9tICcuL3R5cGVzJztcblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIG1pZ3JhdGUxMDAoY29udGV4dCwgb2xkVmVyc2lvbikge1xuICBpZiAoc2VtdmVyLmd0ZShvbGRWZXJzaW9uLCAnMS4wLjAnKSkge1xuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcbiAgfVxuXG4gIGNvbnN0IHN0YXRlID0gY29udGV4dC5hcGkuc3RvcmUuZ2V0U3RhdGUoKTtcbiAgY29uc3QgYWN0aXZhdG9ySWQgPSBzZWxlY3RvcnMuYWN0aXZhdG9yRm9yR2FtZShzdGF0ZSwgR0FNRV9JRCk7XG4gIGNvbnN0IGFjdGl2YXRvciA9IHV0aWwuZ2V0QWN0aXZhdG9yKGFjdGl2YXRvcklkKTtcbiAgY29uc3QgZGlzY292ZXJ5UGF0aCA9IHV0aWwuZ2V0U2FmZShzdGF0ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBbJ3NldHRpbmdzJywgJ2dhbWVNb2RlJywgJ2Rpc2NvdmVyZWQnLCBHQU1FX0lELCAncGF0aCddLCB1bmRlZmluZWQpO1xuXG4gIGlmIChkaXNjb3ZlcnlQYXRoID09PSB1bmRlZmluZWQgfHwgYWN0aXZhdG9yID09PSB1bmRlZmluZWQpIHtcbiAgICAvLyBHYW1lIHdhcyBub3QgZGlzY292ZXJlZCBvciBhIGRlcGxveW1lbnQgbWV0aG9kIGlzbid0IHNldC5cbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG4gIH1cblxuICBjb25zdCBtb2RzOiB7IFttb2RJZDogc3RyaW5nXTogdHlwZXMuSU1vZCB9ID0gdXRpbC5nZXRTYWZlKHN0YXRlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFsncGVyc2lzdGVudCcsICdtb2RzJywgR0FNRV9JRF0sIHt9KTtcbiAgaWYgKE9iamVjdC5rZXlzKG1vZHMpLmxlbmd0aCA9PT0gMCkge1xuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcbiAgfVxuXG4gIGNvbnN0IHByb2ZpbGVzID0gdXRpbC5nZXRTYWZlKHN0YXRlLCBbJ3BlcnNpc3RlbnQnLCAncHJvZmlsZXMnXSwge30pO1xuICBjb25zdCBsb1Byb2ZpbGVzID0gT2JqZWN0LmtleXMocHJvZmlsZXMpLmZpbHRlcihpZCA9PiBwcm9maWxlc1tpZF0/LmdhbWVJZCA9PT0gR0FNRV9JRCk7XG4gIGNvbnN0IGxvTWFwOiB7IFtwcm9mSWQ6IHN0cmluZ106IExvYWRPcmRlciB9ID0gbG9Qcm9maWxlcy5yZWR1Y2UoKGFjY3VtLCBpdGVyKSA9PiB7XG4gICAgY29uc3QgY3VycmVudCA9IHV0aWwuZ2V0U2FmZShzdGF0ZSwgWydwZXJzaXN0ZW50JywgJ2xvYWRPcmRlcicsIGl0ZXJdLCBbXSk7XG4gICAgY29uc3QgbmV3TE86IExvYWRPcmRlciA9IGN1cnJlbnQubWFwKGVudHJ5ID0+IHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIGVuYWJsZWQ6IHRydWUsXG4gICAgICAgIG5hbWU6IChtb2RzW2VudHJ5XSAhPT0gdW5kZWZpbmVkKVxuICAgICAgICAgID8gdXRpbC5yZW5kZXJNb2ROYW1lKG1vZHNbZW50cnldKVxuICAgICAgICAgIDogZW50cnksXG4gICAgICAgIGlkOiBlbnRyeSxcbiAgICAgICAgbW9kSWQ6IGVudHJ5LFxuICAgICAgfTtcbiAgICB9KTtcbiAgICBhY2N1bVtpdGVyXSA9IG5ld0xPO1xuICAgIHJldHVybiBhY2N1bTtcbiAgfSwge30pO1xuXG4gIGZvciAoY29uc3QgcHJvZmlsZUlkIG9mIE9iamVjdC5rZXlzKGxvTWFwKSkge1xuICAgIGF3YWl0IHNlcmlhbGl6ZShjb250ZXh0LCBsb01hcFtwcm9maWxlSWRdLCBwcm9maWxlSWQpO1xuICB9XG5cbiAgY29uc3QgbW9kc1BhdGggPSBwYXRoLmpvaW4oZGlzY292ZXJ5UGF0aCwgbW9kc1JlbFBhdGgoKSk7XG4gIHJldHVybiBjb250ZXh0LmFwaS5hd2FpdFVJKClcbiAgICAudGhlbigoKSA9PiBmcy5lbnN1cmVEaXJXcml0YWJsZUFzeW5jKG1vZHNQYXRoKSlcbiAgICAudGhlbigoKSA9PiBjb250ZXh0LmFwaS5lbWl0QW5kQXdhaXQoJ3B1cmdlLW1vZHMtaW4tcGF0aCcsIEdBTUVfSUQsICcnLCBtb2RzUGF0aCkpXG4gICAgLnRoZW4oKCkgPT4gY29udGV4dC5hcGkuc3RvcmUuZGlzcGF0Y2goYWN0aW9ucy5zZXREZXBsb3ltZW50TmVjZXNzYXJ5KEdBTUVfSUQsIHRydWUpKSk7XG59XG4iXX0=