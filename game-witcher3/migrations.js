const { isWindows } = require('vortex-api');
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
exports.getPersistentLoadOrder = exports.migrate148 = void 0;
const semver_1 = __importDefault(require("semver"));
const vortex_api_1 = require("vortex-api");
const common_1 = require("./common");
function migrate148(context, oldVersion) {
    return __awaiter(this, void 0, void 0, function* () {
        if (semver_1.default.gte(oldVersion, '1.4.8')) {
            return Promise.resolve();
        }
        const state = context.api.getState();
        const lastActiveProfile = vortex_api_1.selectors.lastActiveProfileForGame(state, common_1.GAME_ID);
        const profile = vortex_api_1.selectors.profileById(state, lastActiveProfile);
        const mods = vortex_api_1.util.getSafe(state, ['persistent', 'mods', common_1.GAME_ID], {});
        const modState = vortex_api_1.util.getSafe(profile, ['modState'], {});
        const isEnabled = (mod) => { var _a; return ((_a = modState[mod.id]) === null || _a === void 0 ? void 0 : _a.enabled) === true; };
        const limitPatchMod = Object.values(mods).find(mod => (mod.type === 'w3modlimitpatcher') && isEnabled(mod));
        if (limitPatchMod === undefined) {
            return Promise.resolve();
        }
        const t = context.api.translate;
        context.api.sendNotification({
            type: 'warning',
            allowSuppress: false,
            message: t('Faulty Witcher 3 Mod Limit Patch detected'),
            actions: [
                {
                    title: 'More',
                    action: (dismiss) => {
                        dismiss();
                        context.api.showDialog('info', 'Witcher 3 Mod Limit Patch', {
                            text: t('Due to a bug, the mod limit patch was not applied correctly. '
                                + 'Please Uninstall/Remove your existing mod limit match mod entry in '
                                + 'your mods page and re-apply the patch using the "Apply Mod Limit Patch" '
                                + 'button.'),
                        }, [
                            { label: 'Close' },
                        ]);
                    },
                },
            ],
        });
        return Promise.resolve();
    });
}
exports.migrate148 = migrate148;
function getPersistentLoadOrder(api, loadOrder) {
    const state = api.getState();
    const profile = vortex_api_1.selectors.activeProfile(state);
    if ((profile === null || profile === void 0 ? void 0 : profile.gameId) !== common_1.GAME_ID) {
        return [];
    }
    loadOrder = loadOrder !== null && loadOrder !== void 0 ? loadOrder : vortex_api_1.util.getSafe(state, ['persistent', 'loadOrder', profile.id], undefined);
    if (loadOrder === undefined) {
        return [];
    }
    if (Array.isArray(loadOrder)) {
        return loadOrder;
    }
    if (typeof loadOrder === 'object') {
        return Object.entries(loadOrder).map(([key, item]) => convertDisplayItem(key, item));
    }
    return [];
}
exports.getPersistentLoadOrder = getPersistentLoadOrder;
function convertDisplayItem(key, item) {
    return {
        id: key,
        modId: key,
        name: key,
        locked: item.locked,
        enabled: true,
        data: {
            prefix: item.prefix,
        }
    };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWlncmF0aW9ucy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIm1pZ3JhdGlvbnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7O0FBQ0Esb0RBQTRCO0FBQzVCLDJDQUFvRDtBQUVwRCxxQ0FBbUM7QUFHbkMsU0FBc0IsVUFBVSxDQUFDLE9BQWdDLEVBQ2hDLFVBQWtCOztRQUNqRCxJQUFJLGdCQUFNLENBQUMsR0FBRyxDQUFDLFVBQVUsRUFBRSxPQUFPLENBQUMsRUFBRTtZQUNuQyxPQUFPLE9BQU8sQ0FBQyxPQUFPLEVBQUUsQ0FBQztTQUMxQjtRQUVELE1BQU0sS0FBSyxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsUUFBUSxFQUFFLENBQUM7UUFDckMsTUFBTSxpQkFBaUIsR0FBRyxzQkFBUyxDQUFDLHdCQUF3QixDQUFDLEtBQUssRUFBRSxnQkFBTyxDQUFDLENBQUM7UUFDN0UsTUFBTSxPQUFPLEdBQUcsc0JBQVMsQ0FBQyxXQUFXLENBQUMsS0FBSyxFQUFFLGlCQUFpQixDQUFDLENBQUM7UUFDaEUsTUFBTSxJQUFJLEdBQ1IsaUJBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLENBQUMsWUFBWSxFQUFFLE1BQU0sRUFBRSxnQkFBTyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFDM0QsTUFBTSxRQUFRLEdBQUcsaUJBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxFQUFFLENBQUMsVUFBVSxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFDekQsTUFBTSxTQUFTLEdBQUcsQ0FBQyxHQUFlLEVBQUUsRUFBRSxXQUFDLE9BQUEsQ0FBQSxNQUFBLFFBQVEsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLDBDQUFFLE9BQU8sTUFBSyxJQUFJLENBQUEsRUFBQSxDQUFDO1FBQzFFLE1BQU0sYUFBYSxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQ25ELENBQUMsR0FBRyxDQUFDLElBQUksS0FBSyxtQkFBbUIsQ0FBQyxJQUFJLFNBQVMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO1FBQ3hELElBQUksYUFBYSxLQUFLLFNBQVMsRUFBRTtZQUMvQixPQUFPLE9BQU8sQ0FBQyxPQUFPLEVBQUUsQ0FBQztTQUMxQjtRQUVELE1BQU0sQ0FBQyxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDO1FBQ2hDLE9BQU8sQ0FBQyxHQUFHLENBQUMsZ0JBQWdCLENBQUM7WUFDM0IsSUFBSSxFQUFFLFNBQVM7WUFDZixhQUFhLEVBQUUsS0FBSztZQUNwQixPQUFPLEVBQUUsQ0FBQyxDQUFDLDJDQUEyQyxDQUFDO1lBQ3ZELE9BQU8sRUFBRTtnQkFDUDtvQkFDRSxLQUFLLEVBQUUsTUFBTTtvQkFDYixNQUFNLEVBQUUsQ0FBQyxPQUFPLEVBQUUsRUFBRTt3QkFDbEIsT0FBTyxFQUFFLENBQUM7d0JBQ1YsT0FBTyxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsTUFBTSxFQUFFLDJCQUEyQixFQUFFOzRCQUMxRCxJQUFJLEVBQUUsQ0FBQyxDQUFDLCtEQUErRDtrQ0FDNUQscUVBQXFFO2tDQUNyRSwwRUFBMEU7a0NBQzFFLFNBQVMsQ0FBQzt5QkFDdEIsRUFBRTs0QkFDRCxFQUFFLEtBQUssRUFBRSxPQUFPLEVBQUU7eUJBQ25CLENBQUMsQ0FBQztvQkFDTCxDQUFDO2lCQUNGO2FBQ0Y7U0FDRixDQUFDLENBQUM7UUFFSCxPQUFPLE9BQU8sQ0FBQyxPQUFPLEVBQUUsQ0FBQztJQUMzQixDQUFDO0NBQUE7QUEzQ0QsZ0NBMkNDO0FBRUQsU0FBZ0Isc0JBQXNCLENBQUMsR0FBd0IsRUFBRSxTQUFzQjtJQUdyRixNQUFNLEtBQUssR0FBRyxHQUFHLENBQUMsUUFBUSxFQUFFLENBQUM7SUFDN0IsTUFBTSxPQUFPLEdBQW1CLHNCQUFTLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQy9ELElBQUksQ0FBQSxPQUFPLGFBQVAsT0FBTyx1QkFBUCxPQUFPLENBQUUsTUFBTSxNQUFLLGdCQUFPLEVBQUU7UUFDL0IsT0FBTyxFQUFFLENBQUM7S0FDWDtJQUNELFNBQVMsR0FBRyxTQUFTLGFBQVQsU0FBUyxjQUFULFNBQVMsR0FBSSxpQkFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsQ0FBQyxZQUFZLEVBQUUsV0FBVyxFQUFFLE9BQU8sQ0FBQyxFQUFFLENBQUMsRUFBRSxTQUFTLENBQUMsQ0FBQztJQUNqRyxJQUFJLFNBQVMsS0FBSyxTQUFTLEVBQUU7UUFDM0IsT0FBTyxFQUFFLENBQUM7S0FDWDtJQUNELElBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsRUFBRTtRQUM1QixPQUFPLFNBQVMsQ0FBQztLQUNsQjtJQUNELElBQUksT0FBTyxTQUFTLEtBQUssUUFBUSxFQUFFO1FBQ2pDLE9BQU8sTUFBTSxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsRUFBRSxJQUFJLENBQUMsRUFBRSxFQUFFLENBQUMsa0JBQWtCLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7S0FDdEY7SUFDRCxPQUFPLEVBQUUsQ0FBQztBQUNaLENBQUM7QUFuQkQsd0RBbUJDO0FBRUQsU0FBUyxrQkFBa0IsQ0FBQyxHQUFXLEVBQUUsSUFBcUI7SUFDNUQsT0FBTztRQUNMLEVBQUUsRUFBRSxHQUFHO1FBQ1AsS0FBSyxFQUFFLEdBQUc7UUFDVixJQUFJLEVBQUUsR0FBRztRQUNULE1BQU0sRUFBRSxJQUFJLENBQUMsTUFBTTtRQUNuQixPQUFPLEVBQUUsSUFBSTtRQUNiLElBQUksRUFBRTtZQUNKLE1BQU0sRUFBRSxJQUFJLENBQUMsTUFBTTtTQUNwQjtLQUNGLENBQUE7QUFDSCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyogZXNsaW50LWRpc2FibGUgKi9cbmltcG9ydCBzZW12ZXIgZnJvbSAnc2VtdmVyJztcbmltcG9ydCB7IHNlbGVjdG9ycywgdHlwZXMsIHV0aWwgfSBmcm9tICd2b3J0ZXgtYXBpJztcblxuaW1wb3J0IHsgR0FNRV9JRCB9IGZyb20gJy4vY29tbW9uJztcbmltcG9ydCB7IElMb2FkT3JkZXIsIElMb2FkT3JkZXJFbnRyeSB9IGZyb20gJy4vY29sbGVjdGlvbnMvdHlwZXMnO1xuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gbWlncmF0ZTE0OChjb250ZXh0OiB0eXBlcy5JRXh0ZW5zaW9uQ29udGV4dCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9sZFZlcnNpb246IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICBpZiAoc2VtdmVyLmd0ZShvbGRWZXJzaW9uLCAnMS40LjgnKSkge1xuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcbiAgfVxuXG4gIGNvbnN0IHN0YXRlID0gY29udGV4dC5hcGkuZ2V0U3RhdGUoKTtcbiAgY29uc3QgbGFzdEFjdGl2ZVByb2ZpbGUgPSBzZWxlY3RvcnMubGFzdEFjdGl2ZVByb2ZpbGVGb3JHYW1lKHN0YXRlLCBHQU1FX0lEKTtcbiAgY29uc3QgcHJvZmlsZSA9IHNlbGVjdG9ycy5wcm9maWxlQnlJZChzdGF0ZSwgbGFzdEFjdGl2ZVByb2ZpbGUpO1xuICBjb25zdCBtb2RzOiB7IFttb2RJZDogc3RyaW5nXTogdHlwZXMuSU1vZCB9ID1cbiAgICB1dGlsLmdldFNhZmUoc3RhdGUsIFsncGVyc2lzdGVudCcsICdtb2RzJywgR0FNRV9JRF0sIHt9KTtcbiAgY29uc3QgbW9kU3RhdGUgPSB1dGlsLmdldFNhZmUocHJvZmlsZSwgWydtb2RTdGF0ZSddLCB7fSk7XG4gIGNvbnN0IGlzRW5hYmxlZCA9IChtb2Q6IHR5cGVzLklNb2QpID0+IG1vZFN0YXRlW21vZC5pZF0/LmVuYWJsZWQgPT09IHRydWU7XG4gIGNvbnN0IGxpbWl0UGF0Y2hNb2QgPSBPYmplY3QudmFsdWVzKG1vZHMpLmZpbmQobW9kID0+XG4gICAgKG1vZC50eXBlID09PSAndzNtb2RsaW1pdHBhdGNoZXInKSAmJiBpc0VuYWJsZWQobW9kKSk7XG4gIGlmIChsaW1pdFBhdGNoTW9kID09PSB1bmRlZmluZWQpIHtcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG4gIH1cblxuICBjb25zdCB0ID0gY29udGV4dC5hcGkudHJhbnNsYXRlO1xuICBjb250ZXh0LmFwaS5zZW5kTm90aWZpY2F0aW9uKHtcbiAgICB0eXBlOiAnd2FybmluZycsXG4gICAgYWxsb3dTdXBwcmVzczogZmFsc2UsXG4gICAgbWVzc2FnZTogdCgnRmF1bHR5IFdpdGNoZXIgMyBNb2QgTGltaXQgUGF0Y2ggZGV0ZWN0ZWQnKSxcbiAgICBhY3Rpb25zOiBbXG4gICAgICB7XG4gICAgICAgIHRpdGxlOiAnTW9yZScsXG4gICAgICAgIGFjdGlvbjogKGRpc21pc3MpID0+IHtcbiAgICAgICAgICBkaXNtaXNzKCk7XG4gICAgICAgICAgY29udGV4dC5hcGkuc2hvd0RpYWxvZygnaW5mbycsICdXaXRjaGVyIDMgTW9kIExpbWl0IFBhdGNoJywge1xuICAgICAgICAgICAgdGV4dDogdCgnRHVlIHRvIGEgYnVnLCB0aGUgbW9kIGxpbWl0IHBhdGNoIHdhcyBub3QgYXBwbGllZCBjb3JyZWN0bHkuICdcbiAgICAgICAgICAgICAgICAgICAgICsgJ1BsZWFzZSBVbmluc3RhbGwvUmVtb3ZlIHlvdXIgZXhpc3RpbmcgbW9kIGxpbWl0IG1hdGNoIG1vZCBlbnRyeSBpbiAnXG4gICAgICAgICAgICAgICAgICAgICArICd5b3VyIG1vZHMgcGFnZSBhbmQgcmUtYXBwbHkgdGhlIHBhdGNoIHVzaW5nIHRoZSBcIkFwcGx5IE1vZCBMaW1pdCBQYXRjaFwiICdcbiAgICAgICAgICAgICAgICAgICAgICsgJ2J1dHRvbi4nKSxcbiAgICAgICAgICB9LCBbXG4gICAgICAgICAgICB7IGxhYmVsOiAnQ2xvc2UnIH0sXG4gICAgICAgICAgXSk7XG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgIF0sXG4gIH0pO1xuXG4gIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldFBlcnNpc3RlbnRMb2FkT3JkZXIoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpLCBsb2FkT3JkZXI/OiBJTG9hZE9yZGVyKTogdHlwZXMuTG9hZE9yZGVyIHtcbiAgLy8gV2UgbWlncmF0ZWQgYXdheSBmcm9tIHRoZSByZWd1bGFyIG1vZCBsb2FkIG9yZGVyIGV4dGVuc2lvblxuICAvLyAgdG8gdGhlIGZpbGUgYmFzZWQgbG9hZCBvcmRlcmluZ1xuICBjb25zdCBzdGF0ZSA9IGFwaS5nZXRTdGF0ZSgpO1xuICBjb25zdCBwcm9maWxlOiB0eXBlcy5JUHJvZmlsZSA9IHNlbGVjdG9ycy5hY3RpdmVQcm9maWxlKHN0YXRlKTtcbiAgaWYgKHByb2ZpbGU/LmdhbWVJZCAhPT0gR0FNRV9JRCkge1xuICAgIHJldHVybiBbXTtcbiAgfVxuICBsb2FkT3JkZXIgPSBsb2FkT3JkZXIgPz8gdXRpbC5nZXRTYWZlKHN0YXRlLCBbJ3BlcnNpc3RlbnQnLCAnbG9hZE9yZGVyJywgcHJvZmlsZS5pZF0sIHVuZGVmaW5lZCk7XG4gIGlmIChsb2FkT3JkZXIgPT09IHVuZGVmaW5lZCkge1xuICAgIHJldHVybiBbXTtcbiAgfVxuICBpZiAoQXJyYXkuaXNBcnJheShsb2FkT3JkZXIpKSB7XG4gICAgcmV0dXJuIGxvYWRPcmRlcjtcbiAgfVxuICBpZiAodHlwZW9mIGxvYWRPcmRlciA9PT0gJ29iamVjdCcpIHtcbiAgICByZXR1cm4gT2JqZWN0LmVudHJpZXMobG9hZE9yZGVyKS5tYXAoKFtrZXksIGl0ZW1dKSA9PiBjb252ZXJ0RGlzcGxheUl0ZW0oa2V5LCBpdGVtKSk7XG4gIH1cbiAgcmV0dXJuIFtdO1xufVxuXG5mdW5jdGlvbiBjb252ZXJ0RGlzcGxheUl0ZW0oa2V5OiBzdHJpbmcsIGl0ZW06IElMb2FkT3JkZXJFbnRyeSk6IHR5cGVzLklMb2FkT3JkZXJFbnRyeSB7XG4gIHJldHVybiB7XG4gICAgaWQ6IGtleSxcbiAgICBtb2RJZDoga2V5LFxuICAgIG5hbWU6IGtleSxcbiAgICBsb2NrZWQ6IGl0ZW0ubG9ja2VkLFxuICAgIGVuYWJsZWQ6IHRydWUsXG4gICAgZGF0YToge1xuICAgICAgcHJlZml4OiBpdGVtLnByZWZpeCxcbiAgICB9XG4gIH1cbn1cbiJdfQ==