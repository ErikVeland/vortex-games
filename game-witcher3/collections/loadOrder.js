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
Object.defineProperty(exports, "__esModule", { value: true });
exports.importLoadOrder = exports.exportLoadOrder = void 0;
const vortex_api_1 = require("vortex-api");
const common_1 = require("../common");
const util_1 = require("./util");
const migrations_1 = require("../migrations");
function exportLoadOrder(api, modIds, mods) {
    return __awaiter(this, void 0, void 0, function* () {
        const state = api.getState();
        const profileId = vortex_api_1.selectors.lastActiveProfileForGame(state, common_1.GAME_ID);
        if (profileId === undefined) {
            return Promise.reject(new util_1.CollectionGenerateError('Invalid profile id'));
        }
        const loadOrder = (0, migrations_1.getPersistentLoadOrder)(api);
        if (loadOrder === undefined) {
            return Promise.resolve(undefined);
        }
        const includedMods = modIds.reduce((accum, iter) => {
            if (mods[iter] !== undefined) {
                accum[iter] = mods[iter];
            }
            return accum;
        }, {});
        const filteredLO = (0, util_1.genCollectionLoadOrder)(loadOrder, includedMods);
        return Promise.resolve(filteredLO);
    });
}
exports.exportLoadOrder = exportLoadOrder;
function importLoadOrder(api, collection) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        const state = api.getState();
        const profileId = vortex_api_1.selectors.lastActiveProfileForGame(state, common_1.GAME_ID);
        if (profileId === undefined) {
            return Promise.reject(new util_1.CollectionParseError(((_a = collection === null || collection === void 0 ? void 0 : collection['info']) === null || _a === void 0 ? void 0 : _a['name']) || '', 'Invalid profile id'));
        }
        const converted = (0, migrations_1.getPersistentLoadOrder)(api, collection.loadOrder);
        api.store.dispatch(vortex_api_1.actions.setLoadOrder(profileId, converted));
        return Promise.resolve(undefined);
    });
}
exports.importLoadOrder = importLoadOrder;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG9hZE9yZGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsibG9hZE9yZGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7OztBQUFBLDJDQUE2RDtBQUM3RCxzQ0FBb0M7QUFHcEMsaUNBQ3lDO0FBQ3pDLDhDQUF1RDtBQUV2RCxTQUFzQixlQUFlLENBQUMsR0FBd0IsRUFDeEIsTUFBZ0IsRUFDaEIsSUFBcUM7O1FBRXpFLE1BQU0sS0FBSyxHQUFHLEdBQUcsQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUM3QixNQUFNLFNBQVMsR0FBRyxzQkFBUyxDQUFDLHdCQUF3QixDQUFDLEtBQUssRUFBRSxnQkFBTyxDQUFDLENBQUM7UUFDckUsSUFBSSxTQUFTLEtBQUssU0FBUyxFQUFFO1lBQzNCLE9BQU8sT0FBTyxDQUFDLE1BQU0sQ0FBQyxJQUFJLDhCQUF1QixDQUFDLG9CQUFvQixDQUFDLENBQUMsQ0FBQztTQUMxRTtRQUVELE1BQU0sU0FBUyxHQUFvQixJQUFBLG1DQUFzQixFQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQy9ELElBQUksU0FBUyxLQUFLLFNBQVMsRUFBRTtZQU8zQixPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUM7U0FDbkM7UUFFRCxNQUFNLFlBQVksR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUMsS0FBSyxFQUFFLElBQUksRUFBRSxFQUFFO1lBQ2pELElBQUksSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLFNBQVMsRUFBRTtnQkFDNUIsS0FBSyxDQUFDLElBQUksQ0FBQyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQzthQUMxQjtZQUNELE9BQU8sS0FBSyxDQUFDO1FBQ2YsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBQ1AsTUFBTSxVQUFVLEdBQW9CLElBQUEsNkJBQXNCLEVBQUMsU0FBUyxFQUFFLFlBQVksQ0FBQyxDQUFDO1FBQ3BGLE9BQU8sT0FBTyxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsQ0FBQztJQUNyQyxDQUFDO0NBQUE7QUE3QkQsMENBNkJDO0FBRUQsU0FBc0IsZUFBZSxDQUFDLEdBQXdCLEVBQ3hCLFVBQThCOzs7UUFDbEUsTUFBTSxLQUFLLEdBQUcsR0FBRyxDQUFDLFFBQVEsRUFBRSxDQUFDO1FBRTdCLE1BQU0sU0FBUyxHQUFHLHNCQUFTLENBQUMsd0JBQXdCLENBQUMsS0FBSyxFQUFFLGdCQUFPLENBQUMsQ0FBQztRQUNyRSxJQUFJLFNBQVMsS0FBSyxTQUFTLEVBQUU7WUFDM0IsT0FBTyxPQUFPLENBQUMsTUFBTSxDQUFDLElBQUksMkJBQW9CLENBQUMsQ0FBQSxNQUFBLFVBQVUsYUFBVixVQUFVLHVCQUFWLFVBQVUsQ0FBRyxNQUFNLENBQUMsMENBQUcsTUFBTSxDQUFDLEtBQUksRUFBRSxFQUFFLG9CQUFvQixDQUFDLENBQUMsQ0FBQztTQUM3RztRQUVELE1BQU0sU0FBUyxHQUFHLElBQUEsbUNBQXNCLEVBQUMsR0FBRyxFQUFFLFVBQVUsQ0FBQyxTQUFnQixDQUFDLENBQUM7UUFDM0UsR0FBRyxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsb0JBQU8sQ0FBQyxZQUFZLENBQUMsU0FBUyxFQUFFLFNBQVMsQ0FBQyxDQUFDLENBQUM7UUFDL0QsT0FBTyxPQUFPLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDOztDQUNuQztBQVpELDBDQVlDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgYWN0aW9ucywgc2VsZWN0b3JzLCB0eXBlcywgdXRpbCB9IGZyb20gJ3ZvcnRleC1hcGknO1xuaW1wb3J0IHsgR0FNRV9JRCB9IGZyb20gJy4uL2NvbW1vbic7XG5pbXBvcnQgeyBJVzNDb2xsZWN0aW9uc0RhdGEgfSBmcm9tICcuL3R5cGVzJztcblxuaW1wb3J0IHsgQ29sbGVjdGlvbkdlbmVyYXRlRXJyb3IsIENvbGxlY3Rpb25QYXJzZUVycm9yLFxuICBnZW5Db2xsZWN0aW9uTG9hZE9yZGVyIH0gZnJvbSAnLi91dGlsJztcbmltcG9ydCB7IGdldFBlcnNpc3RlbnRMb2FkT3JkZXIgfSBmcm9tICcuLi9taWdyYXRpb25zJztcblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGV4cG9ydExvYWRPcmRlcihhcGk6IHR5cGVzLklFeHRlbnNpb25BcGksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1vZElkczogc3RyaW5nW10sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1vZHM6IHsgW21vZElkOiBzdHJpbmddOiB0eXBlcy5JTW9kIH0pXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDogUHJvbWlzZTx0eXBlcy5Mb2FkT3JkZXI+IHtcbiAgY29uc3Qgc3RhdGUgPSBhcGkuZ2V0U3RhdGUoKTtcbiAgY29uc3QgcHJvZmlsZUlkID0gc2VsZWN0b3JzLmxhc3RBY3RpdmVQcm9maWxlRm9yR2FtZShzdGF0ZSwgR0FNRV9JRCk7XG4gIGlmIChwcm9maWxlSWQgPT09IHVuZGVmaW5lZCkge1xuICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgQ29sbGVjdGlvbkdlbmVyYXRlRXJyb3IoJ0ludmFsaWQgcHJvZmlsZSBpZCcpKTtcbiAgfVxuXG4gIGNvbnN0IGxvYWRPcmRlcjogdHlwZXMuTG9hZE9yZGVyID0gZ2V0UGVyc2lzdGVudExvYWRPcmRlcihhcGkpO1xuICBpZiAobG9hZE9yZGVyID09PSB1bmRlZmluZWQpIHtcbiAgICAvLyBUaGlzIGlzIHRoZW9yZXRpY2FsbHkgXCJmaW5lXCIgLSB0aGUgdXNlciBtYXkgaGF2ZSBzaW1wbHlcbiAgICAvLyAgZG93bmxvYWRlZCB0aGUgbW9kcyBhbmQgaW1tZWRpYXRlbHkgY3JlYXRlZCB0aGUgY29sbGVjdGlvblxuICAgIC8vICB3aXRob3V0IGFjdHVhbGx5IHNldHRpbmcgdXAgYSBsb2FkIG9yZGVyLiBBbHRlcm5hdGl2ZWx5XG4gICAgLy8gIHRoZSBnYW1lIGV4dGVuc2lvbiBpdHNlbGYgbWlnaHQgYmUgaGFuZGxpbmcgdGhlIHByZXNvcnQgZnVuY3Rpb25hbGl0eVxuICAgIC8vICBlcnJvbmVvdXNseS4gUmVnYXJkbGVzcywgdGhlIGNvbGxlY3Rpb24gY3JlYXRpb24gc2hvdWxkbid0IGJlIGJsb2NrZWRcbiAgICAvLyAgYnkgdGhlIGluZXhpc3RhbmNlIG9mIGEgbG9hZE9yZGVyLlxuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUodW5kZWZpbmVkKTtcbiAgfVxuXG4gIGNvbnN0IGluY2x1ZGVkTW9kcyA9IG1vZElkcy5yZWR1Y2UoKGFjY3VtLCBpdGVyKSA9PiB7XG4gICAgaWYgKG1vZHNbaXRlcl0gIT09IHVuZGVmaW5lZCkge1xuICAgICAgYWNjdW1baXRlcl0gPSBtb2RzW2l0ZXJdO1xuICAgIH1cbiAgICByZXR1cm4gYWNjdW07XG4gIH0sIHt9KTtcbiAgY29uc3QgZmlsdGVyZWRMTzogdHlwZXMuTG9hZE9yZGVyID0gZ2VuQ29sbGVjdGlvbkxvYWRPcmRlcihsb2FkT3JkZXIsIGluY2x1ZGVkTW9kcyk7XG4gIHJldHVybiBQcm9taXNlLnJlc29sdmUoZmlsdGVyZWRMTyk7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBpbXBvcnRMb2FkT3JkZXIoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb2xsZWN0aW9uOiBJVzNDb2xsZWN0aW9uc0RhdGEpOiBQcm9taXNlPHZvaWQ+IHtcbiAgY29uc3Qgc3RhdGUgPSBhcGkuZ2V0U3RhdGUoKTtcblxuICBjb25zdCBwcm9maWxlSWQgPSBzZWxlY3RvcnMubGFzdEFjdGl2ZVByb2ZpbGVGb3JHYW1lKHN0YXRlLCBHQU1FX0lEKTtcbiAgaWYgKHByb2ZpbGVJZCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyBDb2xsZWN0aW9uUGFyc2VFcnJvcihjb2xsZWN0aW9uPy5bJ2luZm8nXT8uWyduYW1lJ10gfHwgJycsICdJbnZhbGlkIHByb2ZpbGUgaWQnKSk7XG4gIH1cblxuICBjb25zdCBjb252ZXJ0ZWQgPSBnZXRQZXJzaXN0ZW50TG9hZE9yZGVyKGFwaSwgY29sbGVjdGlvbi5sb2FkT3JkZXIgYXMgYW55KTtcbiAgYXBpLnN0b3JlLmRpc3BhdGNoKGFjdGlvbnMuc2V0TG9hZE9yZGVyKHByb2ZpbGVJZCwgY29udmVydGVkKSk7XG4gIHJldHVybiBQcm9taXNlLnJlc29sdmUodW5kZWZpbmVkKTtcbn1cbiJdfQ==