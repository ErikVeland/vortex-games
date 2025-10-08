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
exports.downloadSMAPI = exports.deploySMAPI = exports.findSMAPIMod = exports.findSMAPITool = void 0;
const vortex_api_1 = require("vortex-api");
const common_1 = require("./common");
const semver_1 = require("semver");
const constants_1 = require("./constants");
function findSMAPITool(api) {
    var _a;
    const state = api.getState();
    const discovery = vortex_api_1.selectors.discoveryByGame(state, common_1.GAME_ID);
    const tool = (_a = discovery === null || discovery === void 0 ? void 0 : discovery.tools) === null || _a === void 0 ? void 0 : _a['smapi'];
    return !!(tool === null || tool === void 0 ? void 0 : tool.path) ? tool : undefined;
}
exports.findSMAPITool = findSMAPITool;
function findSMAPIMod(api) {
    const state = api.getState();
    const profileId = vortex_api_1.selectors.lastActiveProfileForGame(state, common_1.GAME_ID);
    const profile = vortex_api_1.selectors.profileById(state, profileId);
    const isActive = (modId) => vortex_api_1.util.getSafe(profile, ['modState', modId, 'enabled'], false);
    const isSMAPI = (mod) => { var _a; return mod.type === 'SMAPI' && ((_a = mod.attributes) === null || _a === void 0 ? void 0 : _a.modId) === 2400; };
    const mods = vortex_api_1.util.getSafe(state, ['persistent', 'mods', common_1.GAME_ID], {});
    const SMAPIMods = Object.values(mods).filter((mod) => isSMAPI(mod) && isActive(mod.id));
    return (SMAPIMods.length === 0)
        ? undefined
        : SMAPIMods.length > 1
            ? SMAPIMods.reduce((prev, iter) => {
                var _a, _b;
                if (prev === undefined) {
                    return iter;
                }
                return ((0, semver_1.gte)((_a = iter.attributes.version) !== null && _a !== void 0 ? _a : '0.0.0', (_b = prev.attributes.version) !== null && _b !== void 0 ? _b : '0.0.0')) ? iter : prev;
            }, undefined)
            : SMAPIMods[0];
}
exports.findSMAPIMod = findSMAPIMod;
function deploySMAPI(api) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        yield vortex_api_1.util.toPromise(cb => api.events.emit('deploy-mods', cb));
        yield vortex_api_1.util.toPromise(cb => api.events.emit('start-quick-discovery', () => cb(null)));
        const discovery = vortex_api_1.selectors.discoveryByGame(api.getState(), common_1.GAME_ID);
        const tool = (_a = discovery === null || discovery === void 0 ? void 0 : discovery.tools) === null || _a === void 0 ? void 0 : _a['smapi'];
        if (tool) {
            api.store.dispatch(vortex_api_1.actions.setPrimaryTool(common_1.GAME_ID, tool.id));
        }
    });
}
exports.deploySMAPI = deploySMAPI;
function downloadSMAPI(api, update) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        api.dismissNotification('smapi-missing');
        api.sendNotification({
            id: 'smapi-installing',
            message: update ? 'Updating SMAPI' : 'Installing SMAPI',
            type: 'activity',
            noDismiss: true,
            allowSuppress: false,
        });
        if (((_a = api.ext) === null || _a === void 0 ? void 0 : _a.ensureLoggedIn) !== undefined) {
            yield api.ext.ensureLoggedIn();
        }
        try {
            const modFiles = yield api.ext.nexusGetModFiles(common_1.GAME_ID, constants_1.SMAPI_MOD_ID);
            const fileTime = (input) => Number.parseInt(input.uploaded_time, 10);
            const file = modFiles
                .filter(file => file.category_id === 1)
                .sort((lhs, rhs) => fileTime(lhs) - fileTime(rhs))[0];
            if (file === undefined) {
                throw new vortex_api_1.util.ProcessCanceled('No SMAPI main file found');
            }
            const dlInfo = {
                game: common_1.GAME_ID,
                name: 'SMAPI',
            };
            const nxmUrl = `nxm://${common_1.GAME_ID}/mods/${constants_1.SMAPI_MOD_ID}/files/${file.file_id}`;
            const dlId = yield vortex_api_1.util.toPromise(cb => api.events.emit('start-download', [nxmUrl], dlInfo, undefined, cb, 'always', { allowInstall: false }));
            const modId = yield vortex_api_1.util.toPromise(cb => api.events.emit('start-install-download', dlId, { allowAutoEnable: false }, cb));
            const profileId = vortex_api_1.selectors.lastActiveProfileForGame(api.getState(), common_1.GAME_ID);
            yield vortex_api_1.actions.setModsEnabled(api, profileId, [modId], true, {
                allowAutoDeploy: false,
                installed: true,
            });
            yield deploySMAPI(api);
        }
        catch (err) {
            api.showErrorNotification('Failed to download/install SMAPI', err);
            vortex_api_1.util.opn(constants_1.SMAPI_URL).catch(() => null);
        }
        finally {
            api.dismissNotification('smapi-installing');
        }
    });
}
exports.downloadSMAPI = downloadSMAPI;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiU01BUEkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJTTUFQSS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7QUFBQSwyQ0FBNkQ7QUFDN0QscUNBQW1DO0FBQ25DLG1DQUE2QjtBQUM3QiwyQ0FBc0Q7QUFFdEQsU0FBZ0IsYUFBYSxDQUFDLEdBQXdCOztJQUNwRCxNQUFNLEtBQUssR0FBRyxHQUFHLENBQUMsUUFBUSxFQUFFLENBQUM7SUFDN0IsTUFBTSxTQUFTLEdBQUcsc0JBQVMsQ0FBQyxlQUFlLENBQUMsS0FBSyxFQUFFLGdCQUFPLENBQUMsQ0FBQztJQUM1RCxNQUFNLElBQUksR0FBRyxNQUFBLFNBQVMsYUFBVCxTQUFTLHVCQUFULFNBQVMsQ0FBRSxLQUFLLDBDQUFHLE9BQU8sQ0FBQyxDQUFDO0lBQ3pDLE9BQU8sQ0FBQyxDQUFDLENBQUEsSUFBSSxhQUFKLElBQUksdUJBQUosSUFBSSxDQUFFLElBQUksQ0FBQSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQztBQUN6QyxDQUFDO0FBTEQsc0NBS0M7QUFFRCxTQUFnQixZQUFZLENBQUMsR0FBd0I7SUFDbkQsTUFBTSxLQUFLLEdBQUcsR0FBRyxDQUFDLFFBQVEsRUFBRSxDQUFDO0lBQzdCLE1BQU0sU0FBUyxHQUFHLHNCQUFTLENBQUMsd0JBQXdCLENBQUMsS0FBSyxFQUFFLGdCQUFPLENBQUMsQ0FBQztJQUNyRSxNQUFNLE9BQU8sR0FBRyxzQkFBUyxDQUFDLFdBQVcsQ0FBQyxLQUFLLEVBQUUsU0FBUyxDQUFDLENBQUM7SUFDeEQsTUFBTSxRQUFRLEdBQUcsQ0FBQyxLQUFhLEVBQUUsRUFBRSxDQUFDLGlCQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFDLFVBQVUsRUFBRSxLQUFLLEVBQUUsU0FBUyxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFDakcsTUFBTSxPQUFPLEdBQUcsQ0FBQyxHQUFlLEVBQUUsRUFBRSxX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QUFDO1lBQ3pHLE1BQU0sS0FBSyxHQUFHLE1BQU0saUJBQUksQ0FBQyxTQUFTLENBQVMsRUFBRSxDQUFDLEVBQUUsQ0FDOUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsd0JBQXdCLEVBQUUsSUFBSSxFQUFFLEVBQUUsZUFBZSxFQUFFLEtBQUssRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDbkYsTUFBTSxTQUFTLEdBQUcsc0JBQVMsQ0FBQyx3QkFBd0IsQ0FBQyxHQUFHLENBQUMsUUFBUSxFQUFFLEVBQUUsZ0JBQU8sQ0FBQyxDQUFDO1lBQzlFLE1BQU0sb0JBQU8sQ0FBQyxjQUFjLENBQUMsR0FBRyxFQUFFLFNBQVMsRUFBRSxDQUFDLEtBQUssQ0FBQyxFQUFFLElBQUksRUFBRTtnQkFDMUQsZUFBZSxFQUFFLEtBQUs7Z0JBQ3RCLFNBQVMsRUFBRSxJQUFJO2FBQ2hCLENBQUMsQ0FBQztZQUVILE1BQU0sV0FBVyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1NBQ3hCO1FBQUMsT0FBTyxHQUFHLEVBQUU7WUFDWixHQUFHLENBQUMscUJBQXFCLENBQUMsa0NBQWtDLEVBQUUsR0FBRyxDQUFDLENBQUM7WUFDbkUsaUJBQUksQ0FBQyxHQUFHLENBQUMscUJBQVMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQztTQUN2QztnQkFBUztZQUNSLEdBQUcsQ0FBQyxtQkFBbUIsQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO1NBQzdDOztDQUNGO0FBbERELHNDQWtEQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGFjdGlvbnMsIHR5cGVzLCBzZWxlY3RvcnMsIHV0aWwgfSBmcm9tICd2b3J0ZXgtYXBpJztcbmltcG9ydCB7IEdBTUVfSUQgfSBmcm9tICcuL2NvbW1vbic7XG5pbXBvcnQgeyBndGUgfSBmcm9tICdzZW12ZXInO1xuaW1wb3J0IHsgU01BUElfTU9EX0lELCBTTUFQSV9VUkwgfSBmcm9tICcuL2NvbnN0YW50cyc7XG5cbmV4cG9ydCBmdW5jdGlvbiBmaW5kU01BUElUb29sKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSk6IHR5cGVzLklEaXNjb3ZlcmVkVG9vbCB8IHVuZGVmaW5lZCB7XG4gIGNvbnN0IHN0YXRlID0gYXBpLmdldFN0YXRlKCk7XG4gIGNvbnN0IGRpc2NvdmVyeSA9IHNlbGVjdG9ycy5kaXNjb3ZlcnlCeUdhbWUoc3RhdGUsIEdBTUVfSUQpO1xuICBjb25zdCB0b29sID0gZGlzY292ZXJ5Py50b29scz8uWydzbWFwaSddO1xuICByZXR1cm4gISF0b29sPy5wYXRoID8gdG9vbCA6IHVuZGVmaW5lZDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGZpbmRTTUFQSU1vZChhcGk6IHR5cGVzLklFeHRlbnNpb25BcGkpOiB0eXBlcy5JTW9kIHtcbiAgY29uc3Qgc3RhdGUgPSBhcGkuZ2V0U3RhdGUoKTtcbiAgY29uc3QgcHJvZmlsZUlkID0gc2VsZWN0b3JzLmxhc3RBY3RpdmVQcm9maWxlRm9yR2FtZShzdGF0ZSwgR0FNRV9JRCk7XG4gIGNvbnN0IHByb2ZpbGUgPSBzZWxlY3RvcnMucHJvZmlsZUJ5SWQoc3RhdGUsIHByb2ZpbGVJZCk7XG4gIGNvbnN0IGlzQWN0aXZlID0gKG1vZElkOiBzdHJpbmcpID0+IHV0aWwuZ2V0U2FmZShwcm9maWxlLCBbJ21vZFN0YXRlJywgbW9kSWQsICdlbmFibGVkJ10sIGZhbHNlKTtcbiAgY29uc3QgaXNTTUFQSSA9IChtb2Q6IHR5cGVzLklNb2QpID0+XG4gICAgbW9kLnR5cGUgPT09ICdTTUFQSScgJiYgbW9kLmF0dHJpYnV0ZXM/Lm1vZElkID09PSAyNDAwO1xuICBjb25zdCBtb2RzOiB7IFttb2RJZDogc3RyaW5nXTogdHlwZXMuSU1vZCB9ID0gdXRpbC5nZXRTYWZlKHN0YXRlLCBbJ3BlcnNpc3RlbnQnLCAnbW9kcycsIEdBTUVfSURdLCB7fSk7XG4gIGNvbnN0IFNNQVBJTW9kczogdHlwZXMuSU1vZFtdID0gT2JqZWN0LnZhbHVlcyhtb2RzKS5maWx0ZXIoKG1vZDogdHlwZXMuSU1vZCkgPT5cbiAgICBpc1NNQVBJKG1vZCkgJiYgaXNBY3RpdmUobW9kLmlkKSk7XG5cbiAgcmV0dXJuIChTTUFQSU1vZHMubGVuZ3RoID09PSAwKVxuICAgID8gdW5kZWZpbmVkXG4gICAgOiBTTUFQSU1vZHMubGVuZ3RoID4gMVxuICAgICAgPyBTTUFQSU1vZHMucmVkdWNlKChwcmV2LCBpdGVyKSA9PiB7XG4gICAgICAgIGlmIChwcmV2ID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICByZXR1cm4gaXRlcjtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gKGd0ZShpdGVyLmF0dHJpYnV0ZXMudmVyc2lvbiA/PyAnMC4wLjAnLCBwcmV2LmF0dHJpYnV0ZXMudmVyc2lvbiA/PyAnMC4wLjAnKSkgPyBpdGVyIDogcHJldjtcbiAgICAgIH0sIHVuZGVmaW5lZClcbiAgICAgIDogU01BUElNb2RzWzBdO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZGVwbG95U01BUEkoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpKSB7XG4gIGF3YWl0IHV0aWwudG9Qcm9taXNlKGNiID0+IGFwaS5ldmVudHMuZW1pdCgnZGVwbG95LW1vZHMnLCBjYikpO1xuICBhd2FpdCB1dGlsLnRvUHJvbWlzZShjYiA9PiBhcGkuZXZlbnRzLmVtaXQoJ3N0YXJ0LXF1aWNrLWRpc2NvdmVyeScsICgpID0+IGNiKG51bGwpKSk7XG5cbiAgY29uc3QgZGlzY292ZXJ5ID0gc2VsZWN0b3JzLmRpc2NvdmVyeUJ5R2FtZShhcGkuZ2V0U3RhdGUoKSwgR0FNRV9JRCk7XG4gIGNvbnN0IHRvb2wgPSBkaXNjb3Zlcnk/LnRvb2xzPy5bJ3NtYXBpJ107XG4gIGlmICh0b29sKSB7XG4gICAgYXBpLnN0b3JlLmRpc3BhdGNoKGFjdGlvbnMuc2V0UHJpbWFyeVRvb2woR0FNRV9JRCwgdG9vbC5pZCkpO1xuICB9XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBkb3dubG9hZFNNQVBJKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSwgdXBkYXRlPzogYm9vbGVhbikge1xuICBhcGkuZGlzbWlzc05vdGlmaWNhdGlvbignc21hcGktbWlzc2luZycpO1xuICBhcGkuc2VuZE5vdGlmaWNhdGlvbih7XG4gICAgaWQ6ICdzbWFwaS1pbnN0YWxsaW5nJyxcbiAgICBtZXNzYWdlOiB1cGRhdGUgPyAnVXBkYXRpbmcgU01BUEknIDogJ0luc3RhbGxpbmcgU01BUEknLFxuICAgIHR5cGU6ICdhY3Rpdml0eScsXG4gICAgbm9EaXNtaXNzOiB0cnVlLFxuICAgIGFsbG93U3VwcHJlc3M6IGZhbHNlLFxuICB9KTtcblxuICBpZiAoYXBpLmV4dD8uZW5zdXJlTG9nZ2VkSW4gIT09IHVuZGVmaW5lZCkge1xuICAgIGF3YWl0IGFwaS5leHQuZW5zdXJlTG9nZ2VkSW4oKTtcbiAgfVxuXG4gIHRyeSB7XG4gICAgY29uc3QgbW9kRmlsZXMgPSBhd2FpdCBhcGkuZXh0Lm5leHVzR2V0TW9kRmlsZXMoR0FNRV9JRCwgU01BUElfTU9EX0lEKTtcblxuICAgIGNvbnN0IGZpbGVUaW1lID0gKGlucHV0OiBhbnkpID0+IE51bWJlci5wYXJzZUludChpbnB1dC51cGxvYWRlZF90aW1lLCAxMCk7XG5cbiAgICBjb25zdCBmaWxlID0gbW9kRmlsZXNcbiAgICAgIC5maWx0ZXIoZmlsZSA9PiBmaWxlLmNhdGVnb3J5X2lkID09PSAxKVxuICAgICAgLnNvcnQoKGxocywgcmhzKSA9PiBmaWxlVGltZShsaHMpIC0gZmlsZVRpbWUocmhzKSlbMF07XG5cbiAgICBpZiAoZmlsZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aHJvdyBuZXcgdXRpbC5Qcm9jZXNzQ2FuY2VsZWQoJ05vIFNNQVBJIG1haW4gZmlsZSBmb3VuZCcpO1xuICAgIH1cblxuICAgIGNvbnN0IGRsSW5mbyA9IHtcbiAgICAgIGdhbWU6IEdBTUVfSUQsXG4gICAgICBuYW1lOiAnU01BUEknLFxuICAgIH07XG5cbiAgICBjb25zdCBueG1VcmwgPSBgbnhtOi8vJHtHQU1FX0lEfS9tb2RzLyR7U01BUElfTU9EX0lEfS9maWxlcy8ke2ZpbGUuZmlsZV9pZH1gO1xuICAgIGNvbnN0IGRsSWQgPSBhd2FpdCB1dGlsLnRvUHJvbWlzZTxzdHJpbmc+KGNiID0+XG4gICAgICBhcGkuZXZlbnRzLmVtaXQoJ3N0YXJ0LWRvd25sb2FkJywgW254bVVybF0sIGRsSW5mbywgdW5kZWZpbmVkLCBjYiwgJ2Fsd2F5cycsIHsgYWxsb3dJbnN0YWxsOiBmYWxzZSB9KSk7XG4gICAgY29uc3QgbW9kSWQgPSBhd2FpdCB1dGlsLnRvUHJvbWlzZTxzdHJpbmc+KGNiID0+XG4gICAgICBhcGkuZXZlbnRzLmVtaXQoJ3N0YXJ0LWluc3RhbGwtZG93bmxvYWQnLCBkbElkLCB7IGFsbG93QXV0b0VuYWJsZTogZmFsc2UgfSwgY2IpKTtcbiAgICBjb25zdCBwcm9maWxlSWQgPSBzZWxlY3RvcnMubGFzdEFjdGl2ZVByb2ZpbGVGb3JHYW1lKGFwaS5nZXRTdGF0ZSgpLCBHQU1FX0lEKTtcbiAgICBhd2FpdCBhY3Rpb25zLnNldE1vZHNFbmFibGVkKGFwaSwgcHJvZmlsZUlkLCBbbW9kSWRdLCB0cnVlLCB7XG4gICAgICBhbGxvd0F1dG9EZXBsb3k6IGZhbHNlLFxuICAgICAgaW5zdGFsbGVkOiB0cnVlLFxuICAgIH0pO1xuXG4gICAgYXdhaXQgZGVwbG95U01BUEkoYXBpKTtcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgYXBpLnNob3dFcnJvck5vdGlmaWNhdGlvbignRmFpbGVkIHRvIGRvd25sb2FkL2luc3RhbGwgU01BUEknLCBlcnIpO1xuICAgIHV0aWwub3BuKFNNQVBJX1VSTCkuY2F0Y2goKCkgPT4gbnVsbCk7XG4gIH0gZmluYWxseSB7XG4gICAgYXBpLmRpc21pc3NOb3RpZmljYXRpb24oJ3NtYXBpLWluc3RhbGxpbmcnKTtcbiAgfVxufVxuIl19