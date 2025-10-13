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
exports.findSMAPITool = findSMAPITool;
exports.findSMAPIMod = findSMAPIMod;
exports.deploySMAPI = deploySMAPI;
exports.downloadSMAPI = downloadSMAPI;
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
function deploySMAPI(api) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        yield vortex_api_1.util.toPromise(cb => api.events.emit('deploy-mods', cb));
        yield vortex_api_1.util.toPromise(cb => api.events.emit('start-quick-discovery', () => cb(null)));
        const discovery = vortex_api_1.selectors.discoveryByGame(api.getState(), common_1.GAME_ID);
        const tool = (_a = discovery === null || discovery === void 0 ? void 0 : discovery.tools) === null || _a === void 0 ? void 0 : _a['smapi'];
        if (tool) {
            api.store.dispatch(vortex_api_1.actions.setPrimaryTool(common_1.GAME_ID, tool.id));
        }
    });
}
function downloadSMAPI(api, update) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
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
            const dlId = yield vortex_api_1.util.toPromise(cb => api.events.emit('start-download', [nxmUrl], dlInfo, undefined, cb, undefined, { allowInstall: false }));
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiU01BUEkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJTTUFQSS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQUtBLHNDQUtDO0FBRUQsb0NBcUJDO0FBRUQsa0NBU0M7QUFFRCxzQ0FrREM7QUFoR0QsMkNBQTZEO0FBQzdELHFDQUFtQztBQUNuQyxtQ0FBNkI7QUFDN0IsMkNBQXNEO0FBRXRELFNBQWdCLGFBQWEsQ0FBQyxHQUF3Qjs7SUFDcEQsTUFBTSxLQUFLLEdBQUcsR0FBRyxDQUFDLFFBQVEsRUFBRSxDQUFDO0lBQzdCLE1BQU0sU0FBUyxHQUFHLHNCQUFTLENBQUMsZUFBZSxDQUFDLEtBQUssRUFBRSxnQkFBTyxDQUFDLENBQUM7SUFDNUQsTUFBTSxJQUFJLEdBQUcsTUFBQSxTQUFTLGFBQVQsU0FBUyx1QkFBVCxTQUFTLENBQUUsS0FBSywwQ0FBRyxPQUFPLENBQUMsQ0FBQztJQUN6QyxPQUFPLENBQUMsQ0FBQyxDQUFBLElBQUksYUFBSixJQUFJLHVCQUFKLElBQUksQ0FBRSxJQUFJLENBQUEsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUM7QUFDekMsQ0FBQztBQUVELFNBQWdCLFlBQVksQ0FBQyxHQUF3QjtJQUNuRCxNQUFNLEtBQUssR0FBRyxHQUFHLENBQUMsUUFBUSxFQUFFLENBQUM7SUFDN0IsTUFBTSxTQUFTLEdBQUcsc0JBQVMsQ0FBQyx3QkFBd0IsQ0FBQyxLQUFLLEVBQUUsZ0JBQU8sQ0FBQyxDQUFDO0lBQ3JFLE1BQU0sT0FBTyxHQUFHLHNCQUFTLENBQUMsV0FBVyxDQUFDLEtBQUssRUFBRSxTQUFTLENBQUMsQ0FBQztJQUN4RCxNQUFNLFFBQVEsR0FBRyxDQUFDLEtBQWEsRUFBRSxFQUFFLENBQUMsaUJBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxFQUFFLENBQUMsVUFBVSxFQUFFLEtBQUssRUFBRSxTQUFTLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQztJQUNqRyxN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QUFTLEVBQUUsRUFBRSxFQUFFLFNBQVMsRUFBRSxFQUFFLFlBQVksRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDMUcsTUFBTSxLQUFLLEdBQUcsTUFBTSxpQkFBSSxDQUFDLFNBQVMsQ0FBUyxFQUFFLENBQUMsRUFBRSxDQUM5QyxHQUFHLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyx3QkFBd0IsRUFBRSxJQUFJLEVBQUUsRUFBRSxlQUFlLEVBQUUsS0FBSyxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUNuRixNQUFNLFNBQVMsR0FBRyxzQkFBUyxDQUFDLHdCQUF3QixDQUFDLEdBQUcsQ0FBQyxRQUFRLEVBQUUsRUFBRSxnQkFBTyxDQUFDLENBQUM7WUFDOUUsTUFBTSxvQkFBTyxDQUFDLGNBQWMsQ0FBQyxHQUFHLEVBQUUsU0FBUyxFQUFFLENBQUMsS0FBSyxDQUFDLEVBQUUsSUFBSSxFQUFFO2dCQUMxRCxlQUFlLEVBQUUsS0FBSztnQkFDdEIsU0FBUyxFQUFFLElBQUk7YUFDaEIsQ0FBQyxDQUFDO1lBRUgsTUFBTSxXQUFXLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDekIsQ0FBQztRQUFDLE9BQU8sR0FBRyxFQUFFLENBQUM7WUFDYixHQUFHLENBQUMscUJBQXFCLENBQUMsa0NBQWtDLEVBQUUsR0FBRyxDQUFDLENBQUM7WUFDbkUsaUJBQUksQ0FBQyxHQUFHLENBQUMscUJBQVMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUN4QyxDQUFDO2dCQUFTLENBQUM7WUFDVCxHQUFHLENBQUMsbUJBQW1CLENBQUMsa0JBQWtCLENBQUMsQ0FBQztRQUM5QyxDQUFDO0lBQ0gsQ0FBQztDQUFBIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgYWN0aW9ucywgdHlwZXMsIHNlbGVjdG9ycywgdXRpbCB9IGZyb20gJ3ZvcnRleC1hcGknO1xuaW1wb3J0IHsgR0FNRV9JRCB9IGZyb20gJy4vY29tbW9uJztcbmltcG9ydCB7IGd0ZSB9IGZyb20gJ3NlbXZlcic7XG5pbXBvcnQgeyBTTUFQSV9NT0RfSUQsIFNNQVBJX1VSTCB9IGZyb20gJy4vY29uc3RhbnRzJztcblxuZXhwb3J0IGZ1bmN0aW9uIGZpbmRTTUFQSVRvb2woYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpKTogdHlwZXMuSURpc2NvdmVyZWRUb29sIHwgdW5kZWZpbmVkIHtcbiAgY29uc3Qgc3RhdGUgPSBhcGkuZ2V0U3RhdGUoKTtcbiAgY29uc3QgZGlzY292ZXJ5ID0gc2VsZWN0b3JzLmRpc2NvdmVyeUJ5R2FtZShzdGF0ZSwgR0FNRV9JRCk7XG4gIGNvbnN0IHRvb2wgPSBkaXNjb3Zlcnk/LnRvb2xzPy5bJ3NtYXBpJ107XG4gIHJldHVybiAhIXRvb2w/LnBhdGggPyB0b29sIDogdW5kZWZpbmVkO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZmluZFNNQVBJTW9kKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSk6IHR5cGVzLklNb2Qge1xuICBjb25zdCBzdGF0ZSA9IGFwaS5nZXRTdGF0ZSgpO1xuICBjb25zdCBwcm9maWxlSWQgPSBzZWxlY3RvcnMubGFzdEFjdGl2ZVByb2ZpbGVGb3JHYW1lKHN0YXRlLCBHQU1FX0lEKTtcbiAgY29uc3QgcHJvZmlsZSA9IHNlbGVjdG9ycy5wcm9maWxlQnlJZChzdGF0ZSwgcHJvZmlsZUlkKTtcbiAgY29uc3QgaXNBY3RpdmUgPSAobW9kSWQ6IHN0cmluZykgPT4gdXRpbC5nZXRTYWZlKHByb2ZpbGUsIFsnbW9kU3RhdGUnLCBtb2RJZCwgJ2VuYWJsZWQnXSwgZmFsc2UpO1xuICBjb25zdCBpc1NNQVBJID0gKG1vZDogdHlwZXMuSU1vZCkgPT5cbiAgICBtb2QudHlwZSA9PT0gJ1NNQVBJJyAmJiBtb2QuYXR0cmlidXRlcz8ubW9kSWQgPT09IDI0MDA7XG4gIGNvbnN0IG1vZHM6IHsgW21vZElkOiBzdHJpbmddOiB0eXBlcy5JTW9kIH0gPSB1dGlsLmdldFNhZmUoc3RhdGUsIFsncGVyc2lzdGVudCcsICdtb2RzJywgR0FNRV9JRF0sIHt9KTtcbiAgY29uc3QgU01BUElNb2RzOiB0eXBlcy5JTW9kW10gPSBPYmplY3QudmFsdWVzKG1vZHMpLmZpbHRlcigobW9kOiB0eXBlcy5JTW9kKSA9PlxuICAgIGlzU01BUEkobW9kKSAmJiBpc0FjdGl2ZShtb2QuaWQpKTtcblxuICByZXR1cm4gKFNNQVBJTW9kcy5sZW5ndGggPT09IDApXG4gICAgPyB1bmRlZmluZWRcbiAgICA6IFNNQVBJTW9kcy5sZW5ndGggPiAxXG4gICAgICA/IFNNQVBJTW9kcy5yZWR1Y2UoKHByZXYsIGl0ZXIpID0+IHtcbiAgICAgICAgaWYgKHByZXYgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgIHJldHVybiBpdGVyO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiAoZ3RlKGl0ZXIuYXR0cmlidXRlcy52ZXJzaW9uID8/ICcwLjAuMCcsIHByZXYuYXR0cmlidXRlcy52ZXJzaW9uID8/ICcwLjAuMCcpKSA/IGl0ZXIgOiBwcmV2O1xuICAgICAgfSwgdW5kZWZpbmVkKVxuICAgICAgOiBTTUFQSU1vZHNbMF07XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBkZXBsb3lTTUFQSShhcGk6IHR5cGVzLklFeHRlbnNpb25BcGkpIHtcbiAgYXdhaXQgdXRpbC50b1Byb21pc2UoY2IgPT4gYXBpLmV2ZW50cy5lbWl0KCdkZXBsb3ktbW9kcycsIGNiKSk7XG4gIGF3YWl0IHV0aWwudG9Qcm9taXNlKGNiID0+IGFwaS5ldmVudHMuZW1pdCgnc3RhcnQtcXVpY2stZGlzY292ZXJ5JywgKCkgPT4gY2IobnVsbCkpKTtcblxuICBjb25zdCBkaXNjb3ZlcnkgPSBzZWxlY3RvcnMuZGlzY292ZXJ5QnlHYW1lKGFwaS5nZXRTdGF0ZSgpLCBHQU1FX0lEKTtcbiAgY29uc3QgdG9vbCA9IGRpc2NvdmVyeT8udG9vbHM/Llsnc21hcGknXTtcbiAgaWYgKHRvb2wpIHtcbiAgICBhcGkuc3RvcmUuZGlzcGF0Y2goYWN0aW9ucy5zZXRQcmltYXJ5VG9vbChHQU1FX0lELCB0b29sLmlkKSk7XG4gIH1cbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGRvd25sb2FkU01BUEkoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpLCB1cGRhdGU/OiBib29sZWFuKSB7XG4gIGFwaS5kaXNtaXNzTm90aWZpY2F0aW9uKCdzbWFwaS1taXNzaW5nJyk7XG4gIGFwaS5zZW5kTm90aWZpY2F0aW9uKHtcbiAgICBpZDogJ3NtYXBpLWluc3RhbGxpbmcnLFxuICAgIG1lc3NhZ2U6IHVwZGF0ZSA/ICdVcGRhdGluZyBTTUFQSScgOiAnSW5zdGFsbGluZyBTTUFQSScsXG4gICAgdHlwZTogJ2FjdGl2aXR5JyxcbiAgICBub0Rpc21pc3M6IHRydWUsXG4gICAgYWxsb3dTdXBwcmVzczogZmFsc2UsXG4gIH0pO1xuXG4gIGlmIChhcGkuZXh0Py5lbnN1cmVMb2dnZWRJbiAhPT0gdW5kZWZpbmVkKSB7XG4gICAgYXdhaXQgYXBpLmV4dC5lbnN1cmVMb2dnZWRJbigpO1xuICB9XG5cbiAgdHJ5IHtcbiAgICBjb25zdCBtb2RGaWxlcyA9IGF3YWl0IGFwaS5leHQubmV4dXNHZXRNb2RGaWxlcyhHQU1FX0lELCBTTUFQSV9NT0RfSUQpO1xuXG4gICAgY29uc3QgZmlsZVRpbWUgPSAoaW5wdXQ6IGFueSkgPT4gTnVtYmVyLnBhcnNlSW50KGlucHV0LnVwbG9hZGVkX3RpbWUsIDEwKTtcblxuICAgIGNvbnN0IGZpbGUgPSBtb2RGaWxlc1xuICAgICAgLmZpbHRlcihmaWxlID0+IGZpbGUuY2F0ZWdvcnlfaWQgPT09IDEpXG4gICAgICAuc29ydCgobGhzLCByaHMpID0+IGZpbGVUaW1lKGxocykgLSBmaWxlVGltZShyaHMpKVswXTtcblxuICAgIGlmIChmaWxlID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHRocm93IG5ldyB1dGlsLlByb2Nlc3NDYW5jZWxlZCgnTm8gU01BUEkgbWFpbiBmaWxlIGZvdW5kJyk7XG4gICAgfVxuXG4gICAgY29uc3QgZGxJbmZvID0ge1xuICAgICAgZ2FtZTogR0FNRV9JRCxcbiAgICAgIG5hbWU6ICdTTUFQSScsXG4gICAgfTtcblxuICAgIGNvbnN0IG54bVVybCA9IGBueG06Ly8ke0dBTUVfSUR9L21vZHMvJHtTTUFQSV9NT0RfSUR9L2ZpbGVzLyR7ZmlsZS5maWxlX2lkfWA7XG4gICAgY29uc3QgZGxJZCA9IGF3YWl0IHV0aWwudG9Qcm9taXNlPHN0cmluZz4oY2IgPT5cbiAgICAgIGFwaS5ldmVudHMuZW1pdCgnc3RhcnQtZG93bmxvYWQnLCBbbnhtVXJsXSwgZGxJbmZvLCB1bmRlZmluZWQsIGNiLCB1bmRlZmluZWQsIHsgYWxsb3dJbnN0YWxsOiBmYWxzZSB9KSk7XG4gICAgY29uc3QgbW9kSWQgPSBhd2FpdCB1dGlsLnRvUHJvbWlzZTxzdHJpbmc+KGNiID0+XG4gICAgICBhcGkuZXZlbnRzLmVtaXQoJ3N0YXJ0LWluc3RhbGwtZG93bmxvYWQnLCBkbElkLCB7IGFsbG93QXV0b0VuYWJsZTogZmFsc2UgfSwgY2IpKTtcbiAgICBjb25zdCBwcm9maWxlSWQgPSBzZWxlY3RvcnMubGFzdEFjdGl2ZVByb2ZpbGVGb3JHYW1lKGFwaS5nZXRTdGF0ZSgpLCBHQU1FX0lEKTtcbiAgICBhd2FpdCBhY3Rpb25zLnNldE1vZHNFbmFibGVkKGFwaSwgcHJvZmlsZUlkLCBbbW9kSWRdLCB0cnVlLCB7XG4gICAgICBhbGxvd0F1dG9EZXBsb3k6IGZhbHNlLFxuICAgICAgaW5zdGFsbGVkOiB0cnVlLFxuICAgIH0pO1xuXG4gICAgYXdhaXQgZGVwbG95U01BUEkoYXBpKTtcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgYXBpLnNob3dFcnJvck5vdGlmaWNhdGlvbignRmFpbGVkIHRvIGRvd25sb2FkL2luc3RhbGwgU01BUEknLCBlcnIpO1xuICAgIHV0aWwub3BuKFNNQVBJX1VSTCkuY2F0Y2goKCkgPT4gbnVsbCk7XG4gIH0gZmluYWxseSB7XG4gICAgYXBpLmRpc21pc3NOb3RpZmljYXRpb24oJ3NtYXBpLWluc3RhbGxpbmcnKTtcbiAgfVxufVxuIl19