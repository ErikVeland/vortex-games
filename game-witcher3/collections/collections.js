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
exports.parseCollectionsData = exports.genCollectionsData = void 0;
const vortex_api_1 = require("vortex-api");
const common_1 = require("../common");
const loadOrder_1 = require("./loadOrder");
const menumod_1 = require("../menumod");
const mergeBackup_1 = require("../mergeBackup");
const scriptmerger_1 = require("../scriptmerger");
const util_1 = require("./util");
function genCollectionsData(context, gameId, includedMods, collection) {
    return __awaiter(this, void 0, void 0, function* () {
        const api = context.api;
        const state = api.getState();
        const profile = vortex_api_1.selectors.activeProfile(state);
        const mods = vortex_api_1.util.getSafe(state, ['persistent', 'mods', gameId], {});
        try {
            const loadOrder = yield (0, loadOrder_1.exportLoadOrder)(api, includedMods, mods);
            const menuModData = yield (0, menumod_1.exportMenuMod)(api, profile, includedMods);
            const scriptMergerTool = vortex_api_1.util.getSafe(state, ['settings', 'gameMode', 'discovered', common_1.GAME_ID, 'tools', common_1.SCRIPT_MERGER_ID], undefined);
            let scriptMergesData;
            if (scriptMergerTool !== undefined) {
                scriptMergesData = yield (0, mergeBackup_1.exportScriptMerges)(context.api, profile.id, includedMods, collection);
            }
            const mergedData = {
                menuModSettingsData: (menuModData !== undefined)
                    ? menuModData.toString('hex')
                    : undefined,
                scriptMergedData: scriptMergesData !== undefined
                    ? scriptMergesData.toString('hex')
                    : undefined,
            };
            const collectionData = {
                loadOrder: loadOrder,
                mergedData,
            };
            return Promise.resolve(collectionData);
        }
        catch (err) {
            return Promise.reject(err);
        }
    });
}
exports.genCollectionsData = genCollectionsData;
function parseCollectionsData(context, gameId, collection) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        const api = context.api;
        const state = api.getState();
        const profileId = vortex_api_1.selectors.lastActiveProfileForGame(state, gameId);
        const profile = vortex_api_1.selectors.profileById(state, profileId);
        if ((profile === null || profile === void 0 ? void 0 : profile.gameId) !== gameId) {
            const collectionName = ((_a = collection['info']) === null || _a === void 0 ? void 0 : _a['name']) !== undefined ? collection['info']['name'] : 'Witcher 3 Collection';
            return Promise.reject(new util_1.CollectionParseError(collectionName, 'Last active profile is missing'));
        }
        const { menuModSettingsData, scriptMergedData } = collection.mergedData;
        try {
            yield (0, loadOrder_1.importLoadOrder)(api, collection);
            if (menuModSettingsData !== undefined) {
                yield (0, menumod_1.importMenuMod)(api, profile, (0, util_1.hex2Buffer)(menuModSettingsData));
            }
            if (scriptMergedData !== undefined) {
                const scriptMergerTool = vortex_api_1.util.getSafe(state, ['settings', 'gameMode', 'discovered', common_1.GAME_ID, 'tools', common_1.SCRIPT_MERGER_ID], undefined);
                if (scriptMergerTool === undefined) {
                    yield (0, scriptmerger_1.downloadScriptMerger)(api);
                }
                yield (0, mergeBackup_1.importScriptMerges)(context.api, profile.id, (0, util_1.hex2Buffer)(scriptMergedData));
            }
        }
        catch (err) {
            return Promise.reject(err);
        }
    });
}
exports.parseCollectionsData = parseCollectionsData;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29sbGVjdGlvbnMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJjb2xsZWN0aW9ucy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7QUFDQSwyQ0FBb0Q7QUFFcEQsc0NBQXNEO0FBSXRELDJDQUErRDtBQUUvRCx3Q0FBMEQ7QUFDMUQsZ0RBQXdFO0FBRXhFLGtEQUF1RDtBQUV2RCxpQ0FBMEQ7QUFFMUQsU0FBc0Isa0JBQWtCLENBQUMsT0FBZ0MsRUFDaEMsTUFBYyxFQUNkLFlBQXNCLEVBQ3RCLFVBQXNCOztRQUM3RCxNQUFNLEdBQUcsR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDO1FBQ3hCLE1BQU0sS0FBSyxHQUFHLEdBQUcsQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUM3QixNQUFNLE9BQU8sR0FBRyxzQkFBUyxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUMvQyxNQUFNLElBQUksR0FBb0MsaUJBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUM5RCxDQUFDLFlBQVksRUFBRSxNQUFNLEVBQUUsTUFBTSxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFDdEMsSUFBSTtZQUNGLE1BQU0sU0FBUyxHQUFvQixNQUFNLElBQUEsMkJBQWUsRUFBQyxHQUFHLEVBQUUsWUFBWSxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQ2xGLE1BQU0sV0FBVyxHQUFHLE1BQU0sSUFBQSx1QkFBYSxFQUFDLEdBQUcsRUFBRSxPQUFPLEVBQUUsWUFBWSxDQUFDLENBQUM7WUFDcEUsTUFBTSxnQkFBZ0IsR0FBRyxpQkFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQ3pDLENBQUMsVUFBVSxFQUFFLFVBQVUsRUFBRSxZQUFZLEVBQUUsZ0JBQU8sRUFBRSxPQUFPLEVBQUUseUJBQWdCLENBQUMsRUFBRSxTQUFTLENBQUMsQ0FBQztZQUN6RixJQUFJLGdCQUFnQixDQUFDO1lBQ3JCLElBQUksZ0JBQWdCLEtBQUssU0FBUyxFQUFFO2dCQUNsQyxnQkFB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WUFDWixPQUFPLE9BQU8sQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUM7U0FDNUI7O0NBQ0Y7QUEvQkQsb0RBK0JDIiwic291cmNlc0NvbnRlbnQiOlsiLyogZXNsaW50LWRpc2FibGUgKi9cbmltcG9ydCB7IHNlbGVjdG9ycywgdHlwZXMsIHV0aWwgfSBmcm9tICd2b3J0ZXgtYXBpJztcblxuaW1wb3J0IHsgR0FNRV9JRCwgU0NSSVBUX01FUkdFUl9JRCB9IGZyb20gJy4uL2NvbW1vbic7XG5cbmltcG9ydCB7IElMb2FkT3JkZXIsIElXM0NvbGxlY3Rpb25zRGF0YSwgSVczTWVyZ2VkRGF0YSB9IGZyb20gJy4vdHlwZXMnO1xuXG5pbXBvcnQgeyBleHBvcnRMb2FkT3JkZXIsIGltcG9ydExvYWRPcmRlciB9IGZyb20gJy4vbG9hZE9yZGVyJztcblxuaW1wb3J0IHsgZXhwb3J0TWVudU1vZCwgaW1wb3J0TWVudU1vZCB9IGZyb20gJy4uL21lbnVtb2QnO1xuaW1wb3J0IHsgZXhwb3J0U2NyaXB0TWVyZ2VzLCBpbXBvcnRTY3JpcHRNZXJnZXMgfSBmcm9tICcuLi9tZXJnZUJhY2t1cCc7XG5cbmltcG9ydCB7IGRvd25sb2FkU2NyaXB0TWVyZ2VyIH0gZnJvbSAnLi4vc2NyaXB0bWVyZ2VyJztcblxuaW1wb3J0IHsgQ29sbGVjdGlvblBhcnNlRXJyb3IsIGhleDJCdWZmZXIgfSBmcm9tICcuL3V0aWwnO1xuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZ2VuQ29sbGVjdGlvbnNEYXRhKGNvbnRleHQ6IHR5cGVzLklFeHRlbnNpb25Db250ZXh0LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBnYW1lSWQ6IHN0cmluZyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5jbHVkZWRNb2RzOiBzdHJpbmdbXSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29sbGVjdGlvbjogdHlwZXMuSU1vZCkge1xuICBjb25zdCBhcGkgPSBjb250ZXh0LmFwaTtcbiAgY29uc3Qgc3RhdGUgPSBhcGkuZ2V0U3RhdGUoKTtcbiAgY29uc3QgcHJvZmlsZSA9IHNlbGVjdG9ycy5hY3RpdmVQcm9maWxlKHN0YXRlKTtcbiAgY29uc3QgbW9kczogeyBbbW9kSWQ6IHN0cmluZ106IHR5cGVzLklNb2QgfSA9IHV0aWwuZ2V0U2FmZShzdGF0ZSxcbiAgICBbJ3BlcnNpc3RlbnQnLCAnbW9kcycsIGdhbWVJZF0sIHt9KTtcbiAgdHJ5IHtcbiAgICBjb25zdCBsb2FkT3JkZXI6IHR5cGVzLkxvYWRPcmRlciA9IGF3YWl0IGV4cG9ydExvYWRPcmRlcihhcGksIGluY2x1ZGVkTW9kcywgbW9kcyk7XG4gICAgY29uc3QgbWVudU1vZERhdGEgPSBhd2FpdCBleHBvcnRNZW51TW9kKGFwaSwgcHJvZmlsZSwgaW5jbHVkZWRNb2RzKTtcbiAgICBjb25zdCBzY3JpcHRNZXJnZXJUb29sID0gdXRpbC5nZXRTYWZlKHN0YXRlLFxuICAgICAgWydzZXR0aW5ncycsICdnYW1lTW9kZScsICdkaXNjb3ZlcmVkJywgR0FNRV9JRCwgJ3Rvb2xzJywgU0NSSVBUX01FUkdFUl9JRF0sIHVuZGVmaW5lZCk7XG4gICAgbGV0IHNjcmlwdE1lcmdlc0RhdGE7XG4gICAgaWYgKHNjcmlwdE1lcmdlclRvb2wgIT09IHVuZGVmaW5lZCkge1xuICAgICAgc2NyaXB0TWVyZ2VzRGF0YSA9IGF3YWl0IGV4cG9ydFNjcmlwdE1lcmdlcyhjb250ZXh0LmFwaSwgcHJvZmlsZS5pZCwgaW5jbHVkZWRNb2RzLCBjb2xsZWN0aW9uKTtcbiAgICB9XG4gICAgY29uc3QgbWVyZ2VkRGF0YTogSVczTWVyZ2VkRGF0YSA9IHtcbiAgICAgIG1lbnVNb2RTZXR0aW5nc0RhdGE6IChtZW51TW9kRGF0YSAhPT0gdW5kZWZpbmVkKVxuICAgICAgICA/IG1lbnVNb2REYXRhLnRvU3RyaW5nKCdoZXgnKVxuICAgICAgICA6IHVuZGVmaW5lZCxcbiAgICAgIHNjcmlwdE1lcmdlZERhdGE6IHNjcmlwdE1lcmdlc0RhdGEgIT09IHVuZGVmaW5lZFxuICAgICAgICA/IHNjcmlwdE1lcmdlc0RhdGEudG9TdHJpbmcoJ2hleCcpXG4gICAgICAgIDogdW5kZWZpbmVkLFxuICAgIH07XG4gICAgY29uc3QgY29sbGVjdGlvbkRhdGE6IElXM0NvbGxlY3Rpb25zRGF0YSA9IHtcbiAgICAgIGxvYWRPcmRlcjogbG9hZE9yZGVyIGFzIGFueSxcbiAgICAgIG1lcmdlZERhdGEsXG4gICAgfTtcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKGNvbGxlY3Rpb25EYXRhKTtcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgcmV0dXJuIFByb21pc2UucmVqZWN0KGVycik7XG4gIH1cbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHBhcnNlQ29sbGVjdGlvbnNEYXRhKGNvbnRleHQ6IHR5cGVzLklFeHRlbnNpb25Db250ZXh0LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdhbWVJZDogc3RyaW5nLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbGxlY3Rpb246IElXM0NvbGxlY3Rpb25zRGF0YSkge1xuICBjb25zdCBhcGkgPSBjb250ZXh0LmFwaTtcbiAgY29uc3Qgc3RhdGUgPSBhcGkuZ2V0U3RhdGUoKTtcbiAgY29uc3QgcHJvZmlsZUlkID0gc2VsZWN0b3JzLmxhc3RBY3RpdmVQcm9maWxlRm9yR2FtZShzdGF0ZSwgZ2FtZUlkKTtcbiAgY29uc3QgcHJvZmlsZSA9IHNlbGVjdG9ycy5wcm9maWxlQnlJZChzdGF0ZSwgcHJvZmlsZUlkKTtcbiAgaWYgKHByb2ZpbGU/LmdhbWVJZCAhPT0gZ2FtZUlkKSB7XG4gICAgY29uc3QgY29sbGVjdGlvbk5hbWUgPSBjb2xsZWN0aW9uWydpbmZvJ10/LlsnbmFtZSddICE9PSB1bmRlZmluZWQgPyBjb2xsZWN0aW9uWydpbmZvJ11bJ25hbWUnXSA6ICdXaXRjaGVyIDMgQ29sbGVjdGlvbic7XG4gICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyBDb2xsZWN0aW9uUGFyc2VFcnJvcihjb2xsZWN0aW9uTmFtZSxcbiAgICAgICdMYXN0IGFjdGl2ZSBwcm9maWxlIGlzIG1pc3NpbmcnKSk7XG4gIH1cbiAgY29uc3QgeyBtZW51TW9kU2V0dGluZ3NEYXRhLCBzY3JpcHRNZXJnZWREYXRhIH0gPSBjb2xsZWN0aW9uLm1lcmdlZERhdGE7XG4gIHRyeSB7XG4gICAgYXdhaXQgaW1wb3J0TG9hZE9yZGVyKGFwaSwgY29sbGVjdGlvbik7XG4gICAgaWYgKG1lbnVNb2RTZXR0aW5nc0RhdGEgIT09IHVuZGVmaW5lZCkge1xuICAgICAgYXdhaXQgaW1wb3J0TWVudU1vZChhcGksIHByb2ZpbGUsIGhleDJCdWZmZXIobWVudU1vZFNldHRpbmdzRGF0YSkpO1xuICAgIH1cblxuICAgIGlmIChzY3JpcHRNZXJnZWREYXRhICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIC8vIE1ha2Ugc3VyZSB3ZSBoYXZlIHRoZSBzY3JpcHQgbWVyZ2VyIGluc3RhbGxlZCBzdHJhaWdodCBhd2F5IVxuICAgICAgY29uc3Qgc2NyaXB0TWVyZ2VyVG9vbCA9IHV0aWwuZ2V0U2FmZShzdGF0ZSxcbiAgICAgICAgWydzZXR0aW5ncycsICdnYW1lTW9kZScsICdkaXNjb3ZlcmVkJywgR0FNRV9JRCwgJ3Rvb2xzJywgU0NSSVBUX01FUkdFUl9JRF0sIHVuZGVmaW5lZCk7XG4gICAgICBpZiAoc2NyaXB0TWVyZ2VyVG9vbCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGF3YWl0IGRvd25sb2FkU2NyaXB0TWVyZ2VyKGFwaSk7XG4gICAgICB9XG4gICAgICBhd2FpdCBpbXBvcnRTY3JpcHRNZXJnZXMoY29udGV4dC5hcGksIHByb2ZpbGUuaWQsIGhleDJCdWZmZXIoc2NyaXB0TWVyZ2VkRGF0YSkpO1xuICAgIH1cbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgcmV0dXJuIFByb21pc2UucmVqZWN0KGVycik7XG4gIH1cbn1cbiJdfQ==