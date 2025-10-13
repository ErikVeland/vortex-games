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
exports.migrate148 = migrate148;
exports.getPersistentLoadOrder = getPersistentLoadOrder;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWlncmF0aW9ucy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIm1pZ3JhdGlvbnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7QUFPQSxnQ0EyQ0M7QUFFRCx3REFtQkM7QUF0RUQsb0RBQTRCO0FBQzVCLDJDQUFvRDtBQUVwRCxxQ0FBbUM7QUFHbkMsU0FBc0IsVUFBVSxDQUFDLE9BQWdDLEVBQ2hDLFVBQWtCOztRQUNqRCxJQUFJLGdCQUFNLENBQUMsR0FBRyxDQUFDLFVBQVUsRUFBRSxPQUFPLENBQUMsRUFBRSxDQUFDO1lBQ3BDLE9BQU8sT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQzNCLENBQUM7UUFFRCxNQUFNLEtBQUssR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLFFBQVEsRUFBRSxDQUFDO1FBQ3JDLE1BQU0saUJBQWlCLEdBQUcsc0JBQVMsQ0FBQyx3QkFBd0IsQ0FBQyxLQUFLLEVBQUUsZ0JBQU8sQ0FBQyxDQUFDO1FBQzdFLE1BQU0sT0FBTyxHQUFHLHNCQUFTLENBQUMsV0FBVyxDQUFDLEtBQUssRUFBRSxpQkFBaUIsQ0FBQyxDQUFDO1FBQ2hFLE1BQU0sSUFBSSxHQUNSLGlCQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxDQUFDLFlBQVksRUFBRSxNQUFNLEVBQUUsZ0JBQU8sQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBQzNELE1BQU0sUUFBUSxHQUFHLGlCQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFDLFVBQVUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBQ3pELE1BQU0sU0FBUyxHQUFHLENBQUMsR0FBZSxFQUFFLEVBQUUsV0FBQyxPQUFBLENBQUEsTUFBQSxRQUFRLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQywwQ0FBRSxPQUFPLE1BQUssSUFBSSxDQUFBLEVBQUEsQ0FBQztRQUMxRSxNQUFNLGFBQWEsR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxD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bXZlcic7XG5pbXBvcnQgeyBzZWxlY3RvcnMsIHR5cGVzLCB1dGlsIH0gZnJvbSAndm9ydGV4LWFwaSc7XG5cbmltcG9ydCB7IEdBTUVfSUQgfSBmcm9tICcuL2NvbW1vbic7XG5pbXBvcnQgeyBJTG9hZE9yZGVyLCBJTG9hZE9yZGVyRW50cnkgfSBmcm9tICcuL2NvbGxlY3Rpb25zL3R5cGVzJztcblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIG1pZ3JhdGUxNDgoY29udGV4dDogdHlwZXMuSUV4dGVuc2lvbkNvbnRleHQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbGRWZXJzaW9uOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgaWYgKHNlbXZlci5ndGUob2xkVmVyc2lvbiwgJzEuNC44JykpIHtcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG4gIH1cblxuICBjb25zdCBzdGF0ZSA9IGNvbnRleHQuYXBpLmdldFN0YXRlKCk7XG4gIGNvbnN0IGxhc3RBY3RpdmVQcm9maWxlID0gc2VsZWN0b3JzLmxhc3RBY3RpdmVQcm9maWxlRm9yR2FtZShzdGF0ZSwgR0FNRV9JRCk7XG4gIGNvbnN0IHByb2ZpbGUgPSBzZWxlY3RvcnMucHJvZmlsZUJ5SWQoc3RhdGUsIGxhc3RBY3RpdmVQcm9maWxlKTtcbiAgY29uc3QgbW9kczogeyBbbW9kSWQ6IHN0cmluZ106IHR5cGVzLklNb2QgfSA9XG4gICAgdXRpbC5nZXRTYWZlKHN0YXRlLCBbJ3BlcnNpc3RlbnQnLCAnbW9kcycsIEdBTUVfSURdLCB7fSk7XG4gIGNvbnN0IG1vZFN0YXRlID0gdXRpbC5nZXRTYWZlKHByb2ZpbGUsIFsnbW9kU3RhdGUnXSwge30pO1xuICBjb25zdCBpc0VuYWJsZWQgPSAobW9kOiB0eXBlcy5JTW9kKSA9PiBtb2RTdGF0ZVttb2QuaWRdPy5lbmFibGVkID09PSB0cnVlO1xuICBjb25zdCBsaW1pdFBhdGNoTW9kID0gT2JqZWN0LnZhbHVlcyhtb2RzKS5maW5kKG1vZCA9PlxuICAgIChtb2QudHlwZSA9PT0gJ3czbW9kbGltaXRwYXRjaGVyJykgJiYgaXNFbmFibGVkKG1vZCkpO1xuICBpZiAobGltaXRQYXRjaE1vZCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xuICB9XG5cbiAgY29uc3QgdCA9IGNvbnRleHQuYXBpLnRyYW5zbGF0ZTtcbiAgY29udGV4dC5hcGkuc2VuZE5vdGlmaWNhdGlvbih7XG4gICAgdHlwZTogJ3dhcm5pbmcnLFxuICAgIGFsbG93U3VwcHJlc3M6IGZhbHNlLFxuICAgIG1lc3NhZ2U6IHQoJ0ZhdWx0eSBXaXRjaGVyIDMgTW9kIExpbWl0IFBhdGNoIGRldGVjdGVkJyksXG4gICAgYWN0aW9uczogW1xuICAgICAge1xuICAgICAgICB0aXRsZTogJ01vcmUnLFxuICAgICAgICBhY3Rpb246IChkaXNtaXNzKSA9PiB7XG4gICAgICAgICAgZGlzbWlzcygpO1xuICAgICAgICAgIGNvbnRleHQuYXBpLnNob3dEaWFsb2coJ2luZm8nLCAnV2l0Y2hlciAzIE1vZCBMaW1pdCBQYXRjaCcsIHtcbiAgICAgICAgICAgIHRleHQ6IHQoJ0R1ZSB0byBhIGJ1ZywgdGhlIG1vZCBsaW1pdCBwYXRjaCB3YXMgbm90IGFwcGxpZWQgY29ycmVjdGx5LiAnXG4gICAgICAgICAgICAgICAgICAgICArICdQbGVhc2UgVW5pbnN0YWxsL1JlbW92ZSB5b3VyIGV4aXN0aW5nIG1vZCBsaW1pdCBtYXRjaCBtb2QgZW50cnkgaW4gJ1xuICAgICAgICAgICAgICAgICAgICAgKyAneW91ciBtb2RzIHBhZ2UgYW5kIHJlLWFwcGx5IHRoZSBwYXRjaCB1c2luZyB0aGUgXCJBcHBseSBNb2QgTGltaXQgUGF0Y2hcIiAnXG4gICAgICAgICAgICAgICAgICAgICArICdidXR0b24uJyksXG4gICAgICAgICAgfSwgW1xuICAgICAgICAgICAgeyBsYWJlbDogJ0Nsb3NlJyB9LFxuICAgICAgICAgIF0pO1xuICAgICAgICB9LFxuICAgICAgfSxcbiAgICBdLFxuICB9KTtcblxuICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRQZXJzaXN0ZW50TG9hZE9yZGVyKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSwgbG9hZE9yZGVyPzogSUxvYWRPcmRlcik6IHR5cGVzLkxvYWRPcmRlciB7XG4gIC8vIFdlIG1pZ3JhdGVkIGF3YXkgZnJvbSB0aGUgcmVndWxhciBtb2QgbG9hZCBvcmRlciBleHRlbnNpb25cbiAgLy8gIHRvIHRoZSBmaWxlIGJhc2VkIGxvYWQgb3JkZXJpbmdcbiAgY29uc3Qgc3RhdGUgPSBhcGkuZ2V0U3RhdGUoKTtcbiAgY29uc3QgcHJvZmlsZTogdHlwZXMuSVByb2ZpbGUgPSBzZWxlY3RvcnMuYWN0aXZlUHJvZmlsZShzdGF0ZSk7XG4gIGlmIChwcm9maWxlPy5nYW1lSWQgIT09IEdBTUVfSUQpIHtcbiAgICByZXR1cm4gW107XG4gIH1cbiAgbG9hZE9yZGVyID0gbG9hZE9yZGVyID8/IHV0aWwuZ2V0U2FmZShzdGF0ZSwgWydwZXJzaXN0ZW50JywgJ2xvYWRPcmRlcicsIHByb2ZpbGUuaWRdLCB1bmRlZmluZWQpO1xuICBpZiAobG9hZE9yZGVyID09PSB1bmRlZmluZWQpIHtcbiAgICByZXR1cm4gW107XG4gIH1cbiAgaWYgKEFycmF5LmlzQXJyYXkobG9hZE9yZGVyKSkge1xuICAgIHJldHVybiBsb2FkT3JkZXI7XG4gIH1cbiAgaWYgKHR5cGVvZiBsb2FkT3JkZXIgPT09ICdvYmplY3QnKSB7XG4gICAgcmV0dXJuIE9iamVjdC5lbnRyaWVzKGxvYWRPcmRlcikubWFwKChba2V5LCBpdGVtXSkgPT4gY29udmVydERpc3BsYXlJdGVtKGtleSwgaXRlbSkpO1xuICB9XG4gIHJldHVybiBbXTtcbn1cblxuZnVuY3Rpb24gY29udmVydERpc3BsYXlJdGVtKGtleTogc3RyaW5nLCBpdGVtOiBJTG9hZE9yZGVyRW50cnkpOiB0eXBlcy5JTG9hZE9yZGVyRW50cnkge1xuICByZXR1cm4ge1xuICAgIGlkOiBrZXksXG4gICAgbW9kSWQ6IGtleSxcbiAgICBuYW1lOiBrZXksXG4gICAgbG9ja2VkOiBpdGVtLmxvY2tlZCxcbiAgICBlbmFibGVkOiB0cnVlLFxuICAgIGRhdGE6IHtcbiAgICAgIHByZWZpeDogaXRlbS5wcmVmaXgsXG4gICAgfVxuICB9XG59XG4iXX0=