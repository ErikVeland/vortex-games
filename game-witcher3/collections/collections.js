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
exports.genCollectionsData = genCollectionsData;
exports.parseCollectionsData = parseCollectionsData;
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
function parseCollectionsData(context, gameId, collection) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29sbGVjdGlvbnMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJjb2xsZWN0aW9ucy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQWdCQSxnREFrQ0M7QUFFRCxvREErQkM7QUFsRkQsMkNBQW9EO0FBRXBELHNDQUFzRDtBQUl0RCwyQ0FBK0Q7QUFFL0Qsd0NBQTBEO0FBQzFELGdEQUF3RTtBQUV4RSxrREFBdUQ7QUFFdkQsaUNBQTBEO0FBRTFELFNBQXNCLGtCQUFrQixDQUFDLE9BQWdDLEVBQ2hDLE1BQWMsRUFDZCxZQUFzQixFQUN0QixVQUFzQjs7UUFDN0QsTUFBTSxHQUFHLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQztRQUN4QixNQUFNLEtBQUssR0FBRyxHQUFHLENBQUMsUUFBUSxFQUFFLENBQUM7UUFDN0IsTUFBTSxPQUFPLEdBQUcsc0JBQVMsQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDL0MsTUFBTSxJQUFJLEdBQW9DLGlCQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssRUFDOUQsQ0FBQyxZQUFZLEVBQUUsTUFBTSxFQUFFLE1BQU0sQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBQ3RDLElBQUksQ0FBQztZQUNILE1BQU0sU0FBUyxHQUFvQixNQUFNLElBQUEsMkJBQWUsRUFBQyxHQUFHLEVBQUUsWUFBWSxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQ2xGLE1BQU0sV0FBVyxHQUFHLE1BQU0sSUFBQSx1QkFBYSxFQUFDLEdBQUcsRUFBRSxPQUFPLEVBQUUsWUFBWSxDQUFDLENBQUM7WUFDcEUsTUFBTSxnQkFBZ0IsR0FBRyxpQkFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQ3pDLENBQUMsVUFBVSxFQUFFLFVBQVUsRUFBRSxZQUFZLEVBQUUsZ0JBQU8sRUFBRSxPQUFPLEVBQUUseUJBQWdCLENBQUMsRUFBRSxTQUFTLENBQUMsQ0FBQztZQUN6RixJQUFJLGdCQUFnQixDQUFDO1lBQ3JCLElBQUksZ0JBQWdCLEtBQUssU0FBUyxFQUFFLENBQUM7Z0JBQ25DLGdCQUFnQixHQUFHLE1BQU0sSUFBQSxnQ0FBa0IsRUFBQyxPQUFPLENBQUMsR0FBRyxFQUFFLE9BQU8sQ0FBQyxFQUFFLEVBQUUsWUFBWSxFQUFFLFVBQVUsQ0FBQyxDQUFDO1lBQ2pHLENBQUM7WUFDRCxNQUFNLFVBQVUsR0FBa0I7Z0JBQ2hDLG1CQUFtQixFQUFFLENBQUMsV0FBVyxLQUFLLFNBQVMsQ0FBQztvQkFDOUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDO29CQUM3QixDQUFDLENBQUMsU0FBUztnQkFDYixnQkFBZ0IsRUFBRSxnQkFBZ0IsS0FBSyxTQUFTO29CQUM5QyxDQUFDLENBQUMsZ0JBQWdCLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQztvQkFDbEMsQ0FBQyxDQUFDLFNBQVM7YUFDZCxDQUFDO1lBQ0YsTUFBTSxjQUFjLEdBQXVCO2dCQUN6QyxTQUFTLEVBQUUsU0FBZ0I7Z0JBQzNCLFVBQVU7YUFDWCxDQUFDO1lBQ0YsT0FBTyxPQUFPLENBQUMsT0FBTyxDQUFDLGNBQWMsQ0FBQyxDQUFDO1FBQ3pDLENBQUM7UUFBQyxPQUFPLEdBQUcsRUFBRSxDQUFDO1lBQ2IsT0FBTyxPQUFPLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQzdCLENBQUM7SUFDSCxDQUFDO0NBQUE7QUFFRCxTQUFzQixvQkFBb0IsQ0FBQyxPQUFnQyxFQUNoQyxNQUFjLEVBQ2QsVUFBOEI7OztRQUN2RSxNQUFNLEdBQUcsR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDO1FBQ3hCLE1BQU0sS0FBSyxHQUFHLEdBQUcsQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUM3QixNQUFNLFNBQVMsR0FBRyxzQkFBUyxDQUFDLHdCQUF3QixDQUFDLEtBQUssRUFBRSxNQUFNLENBQUMsQ0FBQztRQUNwRSxNQUFNLE9BQU8sR0FBRyxzQkFBUyxDQUFDLFdBQVcsQ0FBQyxLQUFLLEVBQUUsU0FBUyxDQUFDLENBQUM7UUFDeEQsSUFBSSxDQUFBLE9BQU8sYUFBUCxPQUFPLHVCQUFQLE9BQU8sQ0FBRSxNQUFNLE1BQUssTUFBTSxFQUFFLENBQUM7WUFDL0IsTUFBTSxjQUFjLEdBQUcsQ0FBQSxNQUFBLFVBQVUsQ0FBQyxNQUFNLENBQUMsMENBQUcsTUFBTSxDQUFDLE1BQUssU0FBUyxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLHNCQUFzQixDQUFDO1lBQ3hILE9BQU8sT0FBTyxDQUFDLE1BQU0sQ0FBQyxJQUFJLDJCQUFvQixDQUFDLGNBQWMsRUFDM0QsZ0NBQWdDLENBQUMsQ0FBQyxDQUFDO1FBQ3ZDLENBQUM7UUFDRCxNQUFNLEVBQUUsbUJBQW1CLEVBQUUsZ0JBQWdCLEVBQUUsR0FBRyxVQUFVLENBQUMsVUFBVSxDQUFDO1FBQ3hFLElBQUksQ0FBQztZQUNILE1BQU0sSUFBQSwyQkFBZSxFQUFDLEdBQUcsRUFBRSxVQUFVLENBQUMsQ0FBQztZQUN2QyxJQUFJLG1CQUFtQixLQUFLLFNBQVMsRUFBRSxDQUFDO2dCQUN0QyxNQUFNLElBQUEsdUJBQWEsRUFBQyxHQUFHLEVBQUUsT0FBTyxFQUFFLElBQUEsaUJBQVUsRUFBQyxtQkFBbUIsQ0FBQyxDQUFDLENBQUM7WUFDckUsQ0FBQztZQUVELElBQUksZ0JBQWdCLEtBQUssU0FBUyxFQUFFLENBQUM7Z0JBRW5DLE1BQU0sZ0JBQWdCLEdBQUcsaUJBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUN6QyxDQUFDLFVBQVUsRUFBRSxVQUFVLEVBQUUsWUFBWSxFQUFFLGdCQUFPLEVBQUUsT0FBTyxFQUFFLHlCQUFnQixDQUFDLEVBQUUsU0FBUyxDQUFDLENBQUM7Z0JBQ3pGLElBQUksZ0JBQWdCLEtBQUssU0FBUyxFQUFFLENBQUM7b0JBQ25DLE1BQU0sSUFBQSxtQ0FBb0IsRUFBQyxHQUFHLENBQUMsQ0FBQztnQkFDbEMsQ0FBQztnQkFDRCxNQUFNLElBQUEsZ0NBQWtCLEVBQUMsT0FBTyxDQUFDLEdBQUcsRUFBRSxPQUFPLENBQUMsRUFBRSxFQUFFLElBQUEsaUJBQVUsRUFBQyxnQkFBZ0IsQ0FBQyxDQUFDLENBQUM7WUFDbEYsQ0FBQztRQUNILENBQUM7UUFBQyxPQUFPLEdBQUcsRUFBRSxDQUFDO1lBQ2IsT0FBTyxPQUFPLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQzdCLENBQUM7SUFDSCxDQUFDO0NBQUEiLCJzb3VyY2VzQ29udGVudCI6WyIvKiBlc2xpbnQtZGlzYWJsZSAqL1xuaW1wb3J0IHsgc2VsZWN0b3JzLCB0eXBlcywgdXRpbCB9IGZyb20gJ3ZvcnRleC1hcGknO1xuXG5pbXBvcnQgeyBHQU1FX0lELCBTQ1JJUFRfTUVSR0VSX0lEIH0gZnJvbSAnLi4vY29tbW9uJztcblxuaW1wb3J0IHsgSUxvYWRPcmRlciwgSVczQ29sbGVjdGlvbnNEYXRhLCBJVzNNZXJnZWREYXRhIH0gZnJvbSAnLi90eXBlcyc7XG5cbmltcG9ydCB7IGV4cG9ydExvYWRPcmRlciwgaW1wb3J0TG9hZE9yZGVyIH0gZnJvbSAnLi9sb2FkT3JkZXInO1xuXG5pbXBvcnQgeyBleHBvcnRNZW51TW9kLCBpbXBvcnRNZW51TW9kIH0gZnJvbSAnLi4vbWVudW1vZCc7XG5pbXBvcnQgeyBleHBvcnRTY3JpcHRNZXJnZXMsIGltcG9ydFNjcmlwdE1lcmdlcyB9IGZyb20gJy4uL21lcmdlQmFja3VwJztcblxuaW1wb3J0IHsgZG93bmxvYWRTY3JpcHRNZXJnZXIgfSBmcm9tICcuLi9zY3JpcHRtZXJnZXInO1xuXG5pbXBvcnQgeyBDb2xsZWN0aW9uUGFyc2VFcnJvciwgaGV4MkJ1ZmZlciB9IGZyb20gJy4vdXRpbCc7XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZW5Db2xsZWN0aW9uc0RhdGEoY29udGV4dDogdHlwZXMuSUV4dGVuc2lvbkNvbnRleHQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdhbWVJZDogc3RyaW5nLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbmNsdWRlZE1vZHM6IHN0cmluZ1tdLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb2xsZWN0aW9uOiB0eXBlcy5JTW9kKSB7XG4gIGNvbnN0IGFwaSA9IGNvbnRleHQuYXBpO1xuICBjb25zdCBzdGF0ZSA9IGFwaS5nZXRTdGF0ZSgpO1xuICBjb25zdCBwcm9maWxlID0gc2VsZWN0b3JzLmFjdGl2ZVByb2ZpbGUoc3RhdGUpO1xuICBjb25zdCBtb2RzOiB7IFttb2RJZDogc3RyaW5nXTogdHlwZXMuSU1vZCB9ID0gdXRpbC5nZXRTYWZlKHN0YXRlLFxuICAgIFsncGVyc2lzdGVudCcsICdtb2RzJywgZ2FtZUlkXSwge30pO1xuICB0cnkge1xuICAgIGNvbnN0IGxvYWRPcmRlcjogdHlwZXMuTG9hZE9yZGVyID0gYXdhaXQgZXhwb3J0TG9hZE9yZGVyKGFwaSwgaW5jbHVkZWRNb2RzLCBtb2RzKTtcbiAgICBjb25zdCBtZW51TW9kRGF0YSA9IGF3YWl0IGV4cG9ydE1lbnVNb2QoYXBpLCBwcm9maWxlLCBpbmNsdWRlZE1vZHMpO1xuICAgIGNvbnN0IHNjcmlwdE1lcmdlclRvb2wgPSB1dGlsLmdldFNhZmUoc3RhdGUsXG4gICAgICBbJ3NldHRpbmdzJywgJ2dhbWVNb2RlJywgJ2Rpc2NvdmVyZWQnLCBHQU1FX0lELCAndG9vbHMnLCBTQ1JJUFRfTUVSR0VSX0lEXSwgdW5kZWZpbmVkKTtcbiAgICBsZXQgc2NyaXB0TWVyZ2VzRGF0YTtcbiAgICBpZiAoc2NyaXB0TWVyZ2VyVG9vbCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBzY3JpcHRNZXJnZXNEYXRhID0gYXdhaXQgZXhwb3J0U2NyaXB0TWVyZ2VzKGNvbnRleHQuYXBpLCBwcm9maWxlLmlkLCBpbmNsdWRlZE1vZHMsIGNvbGxlY3Rpb24pO1xuICAgIH1cbiAgICBjb25zdCBtZXJnZWREYXRhOiBJVzNNZXJnZWREYXRhID0ge1xuICAgICAgbWVudU1vZFNldHRpbmdzRGF0YTogKG1lbnVNb2REYXRhICE9PSB1bmRlZmluZWQpXG4gICAgICAgID8gbWVudU1vZERhdGEudG9TdHJpbmcoJ2hleCcpXG4gICAgICAgIDogdW5kZWZpbmVkLFxuICAgICAgc2NyaXB0TWVyZ2VkRGF0YTogc2NyaXB0TWVyZ2VzRGF0YSAhPT0gdW5kZWZpbmVkXG4gICAgICAgID8gc2NyaXB0TWVyZ2VzRGF0YS50b1N0cmluZygnaGV4JylcbiAgICAgICAgOiB1bmRlZmluZWQsXG4gICAgfTtcbiAgICBjb25zdCBjb2xsZWN0aW9uRGF0YTogSVczQ29sbGVjdGlvbnNEYXRhID0ge1xuICAgICAgbG9hZE9yZGVyOiBsb2FkT3JkZXIgYXMgYW55LFxuICAgICAgbWVyZ2VkRGF0YSxcbiAgICB9O1xuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoY29sbGVjdGlvbkRhdGEpO1xuICB9IGNhdGNoIChlcnIpIHtcbiAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoZXJyKTtcbiAgfVxufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcGFyc2VDb2xsZWN0aW9uc0RhdGEoY29udGV4dDogdHlwZXMuSUV4dGVuc2lvbkNvbnRleHQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZ2FtZUlkOiBzdHJpbmcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29sbGVjdGlvbjogSVczQ29sbGVjdGlvbnNEYXRhKSB7XG4gIGNvbnN0IGFwaSA9IGNvbnRleHQuYXBpO1xuICBjb25zdCBzdGF0ZSA9IGFwaS5nZXRTdGF0ZSgpO1xuICBjb25zdCBwcm9maWxlSWQgPSBzZWxlY3RvcnMubGFzdEFjdGl2ZVByb2ZpbGVGb3JHYW1lKHN0YXRlLCBnYW1lSWQpO1xuICBjb25zdCBwcm9maWxlID0gc2VsZWN0b3JzLnByb2ZpbGVCeUlkKHN0YXRlLCBwcm9maWxlSWQpO1xuICBpZiAocHJvZmlsZT8uZ2FtZUlkICE9PSBnYW1lSWQpIHtcbiAgICBjb25zdCBjb2xsZWN0aW9uTmFtZSA9IGNvbGxlY3Rpb25bJ2luZm8nXT8uWyduYW1lJ10gIT09IHVuZGVmaW5lZCA/IGNvbGxlY3Rpb25bJ2luZm8nXVsnbmFtZSddIDogJ1dpdGNoZXIgMyBDb2xsZWN0aW9uJztcbiAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IENvbGxlY3Rpb25QYXJzZUVycm9yKGNvbGxlY3Rpb25OYW1lLFxuICAgICAgJ0xhc3QgYWN0aXZlIHByb2ZpbGUgaXMgbWlzc2luZycpKTtcbiAgfVxuICBjb25zdCB7IG1lbnVNb2RTZXR0aW5nc0RhdGEsIHNjcmlwdE1lcmdlZERhdGEgfSA9IGNvbGxlY3Rpb24ubWVyZ2VkRGF0YTtcbiAgdHJ5IHtcbiAgICBhd2FpdCBpbXBvcnRMb2FkT3JkZXIoYXBpLCBjb2xsZWN0aW9uKTtcbiAgICBpZiAobWVudU1vZFNldHRpbmdzRGF0YSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBhd2FpdCBpbXBvcnRNZW51TW9kKGFwaSwgcHJvZmlsZSwgaGV4MkJ1ZmZlcihtZW51TW9kU2V0dGluZ3NEYXRhKSk7XG4gICAgfVxuXG4gICAgaWYgKHNjcmlwdE1lcmdlZERhdGEgIT09IHVuZGVmaW5lZCkge1xuICAgICAgLy8gTWFrZSBzdXJlIHdlIGhhdmUgdGhlIHNjcmlwdCBtZXJnZXIgaW5zdGFsbGVkIHN0cmFpZ2h0IGF3YXkhXG4gICAgICBjb25zdCBzY3JpcHRNZXJnZXJUb29sID0gdXRpbC5nZXRTYWZlKHN0YXRlLFxuICAgICAgICBbJ3NldHRpbmdzJywgJ2dhbWVNb2RlJywgJ2Rpc2NvdmVyZWQnLCBHQU1FX0lELCAndG9vbHMnLCBTQ1JJUFRfTUVSR0VSX0lEXSwgdW5kZWZpbmVkKTtcbiAgICAgIGlmIChzY3JpcHRNZXJnZXJUb29sID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgYXdhaXQgZG93bmxvYWRTY3JpcHRNZXJnZXIoYXBpKTtcbiAgICAgIH1cbiAgICAgIGF3YWl0IGltcG9ydFNjcmlwdE1lcmdlcyhjb250ZXh0LmFwaSwgcHJvZmlsZS5pZCwgaGV4MkJ1ZmZlcihzY3JpcHRNZXJnZWREYXRhKSk7XG4gICAgfVxuICB9IGNhdGNoIChlcnIpIHtcbiAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoZXJyKTtcbiAgfVxufVxuIl19