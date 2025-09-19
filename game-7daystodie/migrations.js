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
exports.migrate1011 = exports.migrate100 = exports.migrate020 = void 0;
const path_1 = __importDefault(require("path"));
const semver_1 = __importDefault(require("semver"));
const vortex_api_1 = require("vortex-api");
const common_1 = require("./common");
const loadOrder_1 = require("./loadOrder");
function migrate020(api, oldVersion) {
    if (semver_1.default.gte(oldVersion, '0.2.0')) {
        return Promise.resolve();
    }
    const state = api.store.getState();
    const mods = vortex_api_1.util.getSafe(state, ['persistent', 'mods', common_1.GAME_ID], {});
    const hasMods = Object.keys(mods).length > 0;
    if (!hasMods) {
        return Promise.resolve();
    }
    return new Promise((resolve) => {
        return api.sendNotification({
            id: '7dtd-requires-upgrade',
            type: 'warning',
            message: api.translate('Mods for 7 Days to Die need to be reinstalled', { ns: common_1.I18N_NAMESPACE }),
            noDismiss: true,
            actions: [
                {
                    title: 'Explain',
                    action: () => {
                        api.showDialog('info', '7 Days to Die', {
                            text: 'In version 17 of the game 7 Days to Die the way mods are installed '
                                + 'has changed considerably. Unfortunately we are now not able to support '
                                + 'this change with the way mods were previously installed.\n'
                                + 'This means that for the mods to work correctly you have to reinstall '
                                + 'them.\n'
                                + 'We are sorry for the inconvenience.',
                        }, [
                            { label: 'Close' },
                        ]);
                    },
                },
                {
                    title: 'Understood',
                    action: dismiss => {
                        dismiss();
                        resolve(undefined);
                    },
                },
            ],
        });
    });
}
exports.migrate020 = migrate020;
function migrate100(context, oldVersion) {
    return __awaiter(this, void 0, void 0, function* () {
        if (semver_1.default.gte(oldVersion, '1.0.0')) {
            return Promise.resolve();
        }
        const state = context.api.store.getState();
        const discoveryPath = vortex_api_1.util.getSafe(state, ['settings', 'gameMode', 'discovered', common_1.GAME_ID, 'path'], undefined);
        const activatorId = vortex_api_1.selectors.activatorForGame(state, common_1.GAME_ID);
        const activator = vortex_api_1.util.getActivator(activatorId);
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
            yield (0, loadOrder_1.serialize)(context, loMap[profileId], undefined, profileId);
        }
        const modsPath = path_1.default.join(discoveryPath, (0, common_1.modsRelPath)());
        return context.api.awaitUI()
            .then(() => vortex_api_1.fs.ensureDirWritableAsync(modsPath))
            .then(() => context.api.emitAndAwait('purge-mods-in-path', common_1.GAME_ID, '', modsPath))
            .then(() => context.api.store.dispatch(vortex_api_1.actions.setDeploymentNecessary(common_1.GAME_ID, true)));
    });
}
exports.migrate100 = migrate100;
function migrate1011(context, oldVersion) {
    return __awaiter(this, void 0, void 0, function* () {
        if (semver_1.default.gte(oldVersion, '1.0.11')) {
            return Promise.resolve();
        }
        const state = context.api.store.getState();
        const discoveryPath = vortex_api_1.util.getSafe(state, ['settings', 'gameMode', 'discovered', common_1.GAME_ID, 'path'], undefined);
        if (!discoveryPath) {
            return Promise.resolve();
        }
        const mods = vortex_api_1.util.getSafe(state, ['persistent', 'mods', common_1.GAME_ID], {});
        if (Object.keys(mods).length === 0) {
            return Promise.resolve();
        }
        const profiles = vortex_api_1.util.getSafe(state, ['persistent', 'profiles'], {});
        const loProfiles = Object.keys(profiles).filter(id => { var _a; return ((_a = profiles[id]) === null || _a === void 0 ? void 0 : _a.gameId) === common_1.GAME_ID; });
        const loMap = loProfiles.reduce((accum, iter) => {
            const lo = vortex_api_1.util.getSafe(state, ['persistent', 'loadOrder', iter], []);
            accum[iter] = lo;
            return accum;
        }, {});
        for (const profileId of Object.keys(loMap)) {
            try {
                yield (0, loadOrder_1.serialize)(context, loMap[profileId], undefined, profileId);
                yield vortex_api_1.fs.removeAsync(path_1.default.join(discoveryPath, `${profileId}_loadOrder.json`)).catch(err => null);
            }
            catch (err) {
                return Promise.reject(new Error(`Failed to migrate load order for ${profileId}: ${err}`));
            }
        }
        const modsPath = path_1.default.join(discoveryPath, (0, common_1.modsRelPath)());
        return context.api.awaitUI()
            .then(() => vortex_api_1.fs.ensureDirWritableAsync(modsPath))
            .then(() => context.api.emitAndAwait('purge-mods-in-path', common_1.GAME_ID, '', modsPath))
            .then(() => context.api.store.dispatch(vortex_api_1.actions.setDeploymentNecessary(common_1.GAME_ID, true)));
    });
}
exports.migrate1011 = migrate1011;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWlncmF0aW9ucy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIm1pZ3JhdGlvbnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsZ0RBQXdCO0FBQ3hCLG9EQUE0QjtBQUM1QiwyQ0FBaUU7QUFFakUscUNBQW1GO0FBQ25GLDJDQUF3QztBQUd4QyxTQUFnQixVQUFVLENBQUMsR0FBRyxFQUFFLFVBQVU7SUFDeEMsSUFBSSxnQkFBTSxDQUFDLEdBQUcsQ0FBQyxVQUFVLEVBQUUsT0FBTyxDQUFDLEVBQUU7UUFDbkMsT0FBTyxPQUFPLENBQUMsT0FBTyxFQUFFLENBQUM7S0FDMUI7SUFFRCxNQUFNLEtBQUssR0FBRyxHQUFHLENBQUMsS0FBSyxDQUFDLFFBQVEsRUFBRSxDQUFDO0lBQ25DLE1BQU0sSUFBSSxHQUFHLGlCQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxDQUFDLFlBQVksRUFBRSxNQUFNLEVBQUUsZ0JBQU8sQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO0lBQ3RFLE1BQU0sT0FBTyxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQztJQUU3QyxJQUFJLENBQUMsT0FBTyxFQUFFO1FBQ1osT0FBTyxPQUFPLENBQUMsT0FBTyxFQUFFLENBQUM7S0FDMUI7SUFFRCxPQUFPLElBQUksT0FBTyxDQUFDLENBQUMsT0FBTyxFQUFFLEVBQUU7UUFDN0IsT0FBTyxHQUFHLENBQUMsZ0JBQWdCLENBQUM7WUFDMUIsRUFBRSxFQUFFLHVCQUF1QjtZQUMzQixJQUFJLEVBQUUsU0FBUztZQUNmLE9BQU8sRUFBRSxHQUFHLENBQUMsU0FBUyxDQUFDLCtDQUErQyxFQUMvQyxFQUFFLEVBQUUsRUFBRSx1QkFBYyxFQUFFLENBQUM7WUFDOUMsU0FBUyxFQUFFLElBQUk7WUFDZixPQUFPLEVBQUU7Z0JBQ1A7b0JBQ0UsS0FBSyxFQUFFLFNBQVM7b0JBQ2hCLE1BQU0s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R0FBRyxFQUFFLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLG9CQUFPLENBQUMsc0JBQXNCLENBQUMsZ0JBQU8sRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDM0YsQ0FBQztDQUFBO0FBM0NELGtDQTJDQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0IHNlbXZlciBmcm9tICdzZW12ZXInO1xuaW1wb3J0IHsgYWN0aW9ucywgZnMsIHNlbGVjdG9ycywgdHlwZXMsIHV0aWwgfSBmcm9tICd2b3J0ZXgtYXBpJztcblxuaW1wb3J0IHsgR0FNRV9JRCwgSTE4Tl9OQU1FU1BBQ0UsIGxvYWRPcmRlckZpbGVQYXRoLCBtb2RzUmVsUGF0aCB9IGZyb20gJy4vY29tbW9uJztcbmltcG9ydCB7IHNlcmlhbGl6ZSB9IGZyb20gJy4vbG9hZE9yZGVyJztcbmltcG9ydCB7IExvYWRPcmRlciB9IGZyb20gJy4vdHlwZXMnO1xuXG5leHBvcnQgZnVuY3Rpb24gbWlncmF0ZTAyMChhcGksIG9sZFZlcnNpb24pOiBQcm9taXNlPHZvaWQ+IHtcbiAgaWYgKHNlbXZlci5ndGUob2xkVmVyc2lvbiwgJzAuMi4wJykpIHtcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG4gIH1cblxuICBjb25zdCBzdGF0ZSA9IGFwaS5zdG9yZS5nZXRTdGF0ZSgpO1xuICBjb25zdCBtb2RzID0gdXRpbC5nZXRTYWZlKHN0YXRlLCBbJ3BlcnNpc3RlbnQnLCAnbW9kcycsIEdBTUVfSURdLCB7fSk7XG4gIGNvbnN0IGhhc01vZHMgPSBPYmplY3Qua2V5cyhtb2RzKS5sZW5ndGggPiAwO1xuXG4gIGlmICghaGFzTW9kcykge1xuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcbiAgfVxuXG4gIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgIHJldHVybiBhcGkuc2VuZE5vdGlmaWNhdGlvbih7XG4gICAgICBpZDogJzdkdGQtcmVxdWlyZXMtdXBncmFkZScsXG4gICAgICB0eXBlOiAnd2FybmluZycsXG4gICAgICBtZXNzYWdlOiBhcGkudHJhbnNsYXRlKCdNb2RzIGZvciA3IERheXMgdG8gRGllIG5lZWQgdG8gYmUgcmVpbnN0YWxsZWQnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7IG5zOiBJMThOX05BTUVTUEFDRSB9KSxcbiAgICAgIG5vRGlzbWlzczogdHJ1ZSxcbiAgICAgIGFjdGlvbnM6IFtcbiAgICAgICAge1xuICAgICAgICAgIHRpdGxlOiAnRXhwbGFpbicsXG4gICAgICAgICAgYWN0aW9uOiAoKSA9PiB7XG4gICAgICAgICAgICBhcGkuc2hvd0RpYWxvZygnaW5mbycsICc3IERheXMgdG8gRGllJywge1xuICAgICAgICAgICAgICB0ZXh0OiAnSW4gdmVyc2lvbiAxNyBvZiB0aGUgZ2FtZSA3IERheXMgdG8gRGllIHRoZSB3YXkgbW9kcyBhcmUgaW5zdGFsbGVkICdcbiAgICAgICAgICAgICAgICAgICsgJ2hhcyBjaGFuZ2VkIGNvbnNpZGVyYWJseS4gVW5mb3J0dW5hdGVseSB3ZSBhcmUgbm93IG5vdCBhYmxlIHRvIHN1cHBvcnQgJ1xuICAgICAgICAgICAgICAgICAgKyAndGhpcyBjaGFuZ2Ugd2l0aCB0aGUgd2F5IG1vZHMgd2VyZSBwcmV2aW91c2x5IGluc3RhbGxlZC5cXG4nXG4gICAgICAgICAgICAgICAgICArICdUaGlzIG1lYW5zIHRoYXQgZm9yIHRoZSBtb2RzIHRvIHdvcmsgY29ycmVjdGx5IHlvdSBoYXZlIHRvIHJlaW5zdGFsbCAnXG4gICAgICAgICAgICAgICAgICArICd0aGVtLlxcbidcbiAgICAgICAgICAgICAgICAgICsgJ1dlIGFyZSBzb3JyeSBmb3IgdGhlIGluY29udmVuaWVuY2UuJyxcbiAgICAgICAgICAgIH0sIFtcbiAgICAgICAgICAgICAgeyBsYWJlbDogJ0Nsb3NlJyB9LFxuICAgICAgICAgICAgXSk7XG4gICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIHRpdGxlOiAnVW5kZXJzdG9vZCcsXG4gICAgICAgICAgYWN0aW9uOiBkaXNtaXNzID0+IHtcbiAgICAgICAgICAgIGRpc21pc3MoKTtcbiAgICAgICAgICAgIHJlc29sdmUodW5kZWZpbmVkKTtcbiAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgXSxcbiAgICB9KTtcbiAgfSk7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBtaWdyYXRlMTAwKGNvbnRleHQsIG9sZFZlcnNpb24pOiBQcm9taXNlPHZvaWQ+IHtcbiAgaWYgKHNlbXZlci5ndGUob2xkVmVyc2lvbiwgJzEuMC4wJykpIHtcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG4gIH1cblxuICBjb25zdCBzdGF0ZSA9IGNvbnRleHQuYXBpLnN0b3JlLmdldFN0YXRlKCk7XG4gIGNvbnN0IGRpc2NvdmVyeVBhdGggPSB1dGlsLmdldFNhZmUoc3RhdGUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgWydzZXR0aW5ncycsICdnYW1lTW9kZScsICdkaXNjb3ZlcmVkJywgR0FNRV9JRCwgJ3BhdGgnXSwgdW5kZWZpbmVkKTtcblxuICBjb25zdCBhY3RpdmF0b3JJZCA9IHNlbGVjdG9ycy5hY3RpdmF0b3JGb3JHYW1lKHN0YXRlLCBHQU1FX0lEKTtcbiAgY29uc3QgYWN0aXZhdG9yID0gdXRpbC5nZXRBY3RpdmF0b3IoYWN0aXZhdG9ySWQpO1xuICBpZiAoZGlzY292ZXJ5UGF0aCA9PT0gdW5kZWZpbmVkIHx8IGFjdGl2YXRvciA9PT0gdW5kZWZpbmVkKSB7XG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xuICB9XG5cbiAgY29uc3QgbW9kczogeyBbbW9kSWQ6IHN0cmluZ106IHR5cGVzLklNb2QgfSA9IHV0aWwuZ2V0U2FmZShzdGF0ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBbJ3BlcnNpc3RlbnQnLCAnbW9kcycsIEdBTUVfSURdLCB7fSk7XG5cbiAgaWYgKE9iamVjdC5rZXlzKG1vZHMpLmxlbmd0aCA9PT0gMCkge1xuICAgIC8vIE5vIG1vZHMgLSBubyBwcm9ibGVtLlxuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcbiAgfVxuXG4gIGNvbnN0IHByb2ZpbGVzID0gdXRpbC5nZXRTYWZlKHN0YXRlLCBbJ3BlcnNpc3RlbnQnLCAncHJvZmlsZXMnXSwge30pO1xuICBjb25zdCBsb1Byb2ZpbGVzID0gT2JqZWN0LmtleXMocHJvZmlsZXMpLmZpbHRlcihpZCA9PiBwcm9maWxlc1tpZF0/LmdhbWVJZCA9PT0gR0FNRV9JRCk7XG4gIGNvbnN0IGxvTWFwOiB7IFtwcm9mSWQ6IHN0cmluZ106IExvYWRPcmRlciB9ID0gbG9Qcm9maWxlcy5yZWR1Y2UoKGFjY3VtLCBpdGVyKSA9PiB7XG4gICAgY29uc3QgY3VycmVudCA9IHV0aWwuZ2V0U2FmZShzdGF0ZSwgWydwZXJzaXN0ZW50JywgJ2xvYWRPcmRlcicsIGl0ZXJdLCBbXSk7XG4gICAgY29uc3QgbmV3TE86IExvYWRPcmRlciA9IGN1cnJlbnQubWFwKGVudHJ5ID0+IHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIGVuYWJsZWQ6IHRydWUsXG4gICAgICAgIG5hbWU6IChtb2RzW2VudHJ5XSAhPT0gdW5kZWZpbmVkKVxuICAgICAgICAgID8gdXRpbC5yZW5kZXJNb2ROYW1lKG1vZHNbZW50cnldKVxuICAgICAgICAgIDogZW50cnksXG4gICAgICAgIGlkOiBlbnRyeSxcbiAgICAgICAgbW9kSWQ6IGVudHJ5LFxuICAgICAgfTtcbiAgICB9KTtcbiAgICBhY2N1bVtpdGVyXSA9IG5ld0xPO1xuICAgIHJldHVybiBhY2N1bTtcbiAgfSwge30pO1xuXG4gIGZvciAoY29uc3QgcHJvZmlsZUlkIG9mIE9iamVjdC5rZXlzKGxvTWFwKSkge1xuICAgIGF3YWl0IHNlcmlhbGl6ZShjb250ZXh0LCBsb01hcFtwcm9maWxlSWRdLCB1bmRlZmluZWQsIHByb2ZpbGVJZCk7XG4gIH1cblxuICBjb25zdCBtb2RzUGF0aCA9IHBhdGguam9pbihkaXNjb3ZlcnlQYXRoLCBtb2RzUmVsUGF0aCgpKTtcbiAgcmV0dXJuIGNvbnRleHQuYXBpLmF3YWl0VUkoKVxuICAgIC50aGVuKCgpID0+IGZzLmVuc3VyZURpcldyaXRhYmxlQXN5bmMobW9kc1BhdGgpKVxuICAgIC50aGVuKCgpID0+IGNvbnRleHQuYXBpLmVtaXRBbmRBd2FpdCgncHVyZ2UtbW9kcy1pbi1wYXRoJywgR0FNRV9JRCwgJycsIG1vZHNQYXRoKSlcbiAgICAudGhlbigoKSA9PiBjb250ZXh0LmFwaS5zdG9yZS5kaXNwYXRjaChhY3Rpb25zLnNldERlcGxveW1lbnROZWNlc3NhcnkoR0FNRV9JRCwgdHJ1ZSkpKTtcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIG1pZ3JhdGUxMDExKGNvbnRleHQsIG9sZFZlcnNpb24pOiBQcm9taXNlPHZvaWQ+IHtcbiAgaWYgKHNlbXZlci5ndGUob2xkVmVyc2lvbiwgJzEuMC4xMScpKSB7XG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xuICB9XG5cbiAgY29uc3Qgc3RhdGUgPSBjb250ZXh0LmFwaS5zdG9yZS5nZXRTdGF0ZSgpO1xuICBjb25zdCBkaXNjb3ZlcnlQYXRoID0gdXRpbC5nZXRTYWZlKHN0YXRlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFsnc2V0dGluZ3MnLCAnZ2FtZU1vZGUnLCAnZGlzY292ZXJlZCcsIEdBTUVfSUQsICdwYXRoJ10sIHVuZGVmaW5lZCk7XG4gIGlmICghZGlzY292ZXJ5UGF0aCkge1xuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcbiAgfVxuXG4gIGNvbnN0IG1vZHM6IHsgW21vZElkOiBzdHJpbmddOiB0eXBlcy5JTW9kIH0gPSB1dGlsLmdldFNhZmUoc3RhdGUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgWydwZXJzaXN0ZW50JywgJ21vZHMnLCBHQU1FX0lEXSwge30pO1xuXG4gIGlmIChPYmplY3Qua2V5cyhtb2RzKS5sZW5ndGggPT09IDApIHtcbiAgICAvLyBObyBtb2RzIC0gbm8gcHJvYmxlbS5cbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG4gIH1cblxuICBjb25zdCBwcm9maWxlcyA9IHV0aWwuZ2V0U2FmZShzdGF0ZSwgWydwZXJzaXN0ZW50JywgJ3Byb2ZpbGVzJ10sIHt9KTtcbiAgY29uc3QgbG9Qcm9maWxlcyA9IE9iamVjdC5rZXlzKHByb2ZpbGVzKS5maWx0ZXIoaWQgPT4gcHJvZmlsZXNbaWRdPy5nYW1lSWQgPT09IEdBTUVfSUQpO1xuICBjb25zdCBsb01hcDogeyBbcHJvZklkOiBzdHJpbmddOiBMb2FkT3JkZXIgfSA9IGxvUHJvZmlsZXMucmVkdWNlKChhY2N1bSwgaXRlcikgPT4ge1xuICAgIGNvbnN0IGxvOiBMb2FkT3JkZXIgPSB1dGlsLmdldFNhZmUoc3RhdGUsIFsncGVyc2lzdGVudCcsICdsb2FkT3JkZXInLCBpdGVyXSwgW10pO1xuICAgIGFjY3VtW2l0ZXJdID0gbG87XG4gICAgcmV0dXJuIGFjY3VtO1xuICB9LCB7fSk7XG5cbiAgZm9yIChjb25zdCBwcm9maWxlSWQgb2YgT2JqZWN0LmtleXMobG9NYXApKSB7XG4gICAgdHJ5IHtcbiAgICAgIGF3YWl0IHNlcmlhbGl6ZShjb250ZXh0LCBsb01hcFtwcm9maWxlSWRdLCB1bmRlZmluZWQsIHByb2ZpbGVJZCk7XG4gICAgICAvLyBOb3QgYSBiaXQgZGVhbCBpZiB3ZSBmYWlsIHRvIHJlbW92ZSB0aGUgbG9GaWxlIGZyb20gdGhlIG9sZCBsb2NhdGlvbi5cbiAgICAgIGF3YWl0IGZzLnJlbW92ZUFzeW5jKHBhdGguam9pbihkaXNjb3ZlcnlQYXRoLCBgJHtwcm9maWxlSWR9X2xvYWRPcmRlci5qc29uYCkpLmNhdGNoKGVyciA9PiBudWxsKTtcbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgRXJyb3IoYEZhaWxlZCB0byBtaWdyYXRlIGxvYWQgb3JkZXIgZm9yICR7cHJvZmlsZUlkfTogJHtlcnJ9YCkpO1xuICAgIH1cbiAgfVxuXG4gIGNvbnN0IG1vZHNQYXRoID0gcGF0aC5qb2luKGRpc2NvdmVyeVBhdGgsIG1vZHNSZWxQYXRoKCkpO1xuICByZXR1cm4gY29udGV4dC5hcGkuYXdhaXRVSSgpXG4gICAgLnRoZW4oKCkgPT4gZnMuZW5zdXJlRGlyV3JpdGFibGVBc3luYyhtb2RzUGF0aCkpXG4gICAgLnRoZW4oKCkgPT4gY29udGV4dC5hcGkuZW1pdEFuZEF3YWl0KCdwdXJnZS1tb2RzLWluLXBhdGgnLCBHQU1FX0lELCAnJywgbW9kc1BhdGgpKVxuICAgIC50aGVuKCgpID0+IGNvbnRleHQuYXBpLnN0b3JlLmRpc3BhdGNoKGFjdGlvbnMuc2V0RGVwbG95bWVudE5lY2Vzc2FyeShHQU1FX0lELCB0cnVlKSkpO1xufVxuIl19