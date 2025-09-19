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
Object.defineProperty(exports, "__esModule", { value: true });
exports.testModLimitBreach = void 0;
const vortex_api_1 = require("vortex-api");
const common_1 = require("./common");
const MOD_LIMIT_THRESHOLD = 24;
function testModLimitBreach(api, limitPatcher) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        const t = api.translate;
        const state = api.store.getState();
        const isSuppressed = vortex_api_1.util.getSafe(state, (0, common_1.getSuppressModLimitBranch)(), false);
        const profile = vortex_api_1.selectors.activeProfile(state);
        if ((profile === null || profile === void 0 ? void 0 : profile.gameId) !== common_1.GAME_ID || isSuppressed) {
            return Promise.resolve(undefined);
        }
        const mods = (_a = state.persistent.mods[common_1.GAME_ID]) !== null && _a !== void 0 ? _a : {};
        const limitPatch = Object.values(mods).find(mod => mod.type === 'w3modlimitpatcher');
        if (limitPatch) {
            return Promise.resolve(undefined);
        }
        const enabled = Object.keys(mods).filter(id => vortex_api_1.util.getSafe(profile, ['modState', id, 'enabled'], false));
        let res;
        if (enabled.length >= MOD_LIMIT_THRESHOLD) {
            res = {
                severity: 'warning',
                description: {
                    short: t('Mod Limit Reached'),
                },
                automaticFix: () => limitPatcher.ensureModLimitPatch(),
            };
        }
        return Promise.resolve(res);
    });
}
exports.testModLimitBreach = testModLimitBreach;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJ0ZXN0cy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7QUFBQSwyQ0FBb0Q7QUFFcEQscUNBQThEO0FBRzlELE1BQU0sbUJBQW1CLEdBQUcsRUFBRSxDQUFDO0FBRS9CLFNBQXNCLGtCQUFrQixDQUN0QyxHQUF3QixFQUN4QixZQUE2Qjs7O1FBQzdCLE1BQU0sQ0FBQyxHQUFHLEdBQUcsQ0FBQyxTQUFTLENBQUM7UUFDeEIsTUFBTSxLQUFLLEdBQWlCLEdBQUcsQ0FBQyxLQUFLLENBQUMsUUFBUSxFQUFFLENBQUM7UUFDakQsTUFBTSxZQUFZLEdBQUcsaUJBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLElBQUEsa0NBQXlCLEdBQUUsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUM3RSxNQUFNLE9BQU8sR0FBbUIsc0JBQVMsQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDL0QsSUFBSSxDQUFBLE9BQU8sYUFBUCxPQUFPLHVCQUFQLE9BQU8sQ0FBRSxNQUFNLE1BQUssZ0JBQU8sSUFBSSxZQUFZLEVBQUU7WUFDL0MsT0FBTyxPQUFPLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1NBQ25DO1FBRUQsTUFBTSxJQUFJLEdBQW9DLE1BQUEsS0FBSyxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsZ0JBQU8sQ0FBQyxtQ0FBSSxFQUFFLENBQUM7UUFDbkYsTUFBTSxVQUFVLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsSUFBSSxLQUFLLG1CQUFtQixDQUFDLENBQUM7UUFDckYsSUFBSSxVQUFVLEVBQUU7WUFFZCxPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUM7U0FDbkM7UUFFRCxNQUFNLE9BQU8sR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUM1QyxpQkFBSSxDQUFDLE9BQU8sQ0FBQyxPQUFPLEVBQUUsQ0FBQyxVQUFVLEVBQUUsRUFBRSxFQUFFLFNBQVMsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUM7UUFFN0QsSUFBSSxHQUFzQixDQUFDO1FBRTNCLElBQUksT0FBTyxDQUFDLE1BQU0sSUFBSSxtQkFBbUIsRUFBRTtZQUN6QyxHQUFHLEdBQUc7Z0JBQ0osUUFBUSxFQUFFLFNBQVM7Z0JBQ25CLFdBQVcsRUFBRTtvQkFDWCxLQUFLLEVBQUUsQ0FBQyxDQUFDLG1CQUFtQixDQUFDO2lCQUM5QjtnQkFDRCxZQUFZLEVBQUUsR0FBRyxFQUFFLENBQUUsWUFBWSxDQUFDLG1CQUFtQixFQUFVO2FBQ2hFLENBQUM7U0FDSDtRQUVELE9BQU8sT0FBTyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQzs7Q0FDN0I7QUFsQ0QsZ0RBa0NDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgc2VsZWN0b3JzLCB0eXBlcywgdXRpbCB9IGZyb20gJ3ZvcnRleC1hcGknO1xuXG5pbXBvcnQgeyBHQU1FX0lELCBnZXRTdXBwcmVzc01vZExpbWl0QnJhbmNoIH0gZnJvbSAnLi9jb21tb24nO1xuaW1wb3J0IHsgTW9kTGltaXRQYXRjaGVyIH0gZnJvbSAnLi9tb2RMaW1pdFBhdGNoJztcblxuY29uc3QgTU9EX0xJTUlUX1RIUkVTSE9MRCA9IDI0O1xuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gdGVzdE1vZExpbWl0QnJlYWNoKFxuICBhcGk6IHR5cGVzLklFeHRlbnNpb25BcGksXG4gIGxpbWl0UGF0Y2hlcjogTW9kTGltaXRQYXRjaGVyKTogUHJvbWlzZTx0eXBlcy5JVGVzdFJlc3VsdD4ge1xuICBjb25zdCB0ID0gYXBpLnRyYW5zbGF0ZTtcbiAgY29uc3Qgc3RhdGU6IHR5cGVzLklTdGF0ZSA9IGFwaS5zdG9yZS5nZXRTdGF0ZSgpO1xuICBjb25zdCBpc1N1cHByZXNzZWQgPSB1dGlsLmdldFNhZmUoc3RhdGUsIGdldFN1cHByZXNzTW9kTGltaXRCcmFuY2goKSwgZmFsc2UpO1xuICBjb25zdCBwcm9maWxlOiB0eXBlcy5JUHJvZmlsZSA9IHNlbGVjdG9ycy5hY3RpdmVQcm9maWxlKHN0YXRlKTtcbiAgaWYgKHByb2ZpbGU/LmdhbWVJZCAhPT0gR0FNRV9JRCB8fCBpc1N1cHByZXNzZWQpIHtcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHVuZGVmaW5lZCk7XG4gIH1cblxuICBjb25zdCBtb2RzOiB7IFttb2RJZDogc3RyaW5nXTogdHlwZXMuSU1vZCB9ID0gc3RhdGUucGVyc2lzdGVudC5tb2RzW0dBTUVfSURdID8/IHt9O1xuICBjb25zdCBsaW1pdFBhdGNoID0gT2JqZWN0LnZhbHVlcyhtb2RzKS5maW5kKG1vZCA9PiBtb2QudHlwZSA9PT0gJ3czbW9kbGltaXRwYXRjaGVyJyk7XG4gIGlmIChsaW1pdFBhdGNoKSB7XG4gICAgLy8gQSBsaW1pdCBwYXRjaCBhbHJlYWR5IGV4aXN0cy5cbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHVuZGVmaW5lZCk7XG4gIH1cblxuICBjb25zdCBlbmFibGVkID0gT2JqZWN0LmtleXMobW9kcykuZmlsdGVyKGlkID0+XG4gICAgdXRpbC5nZXRTYWZlKHByb2ZpbGUsIFsnbW9kU3RhdGUnLCBpZCwgJ2VuYWJsZWQnXSwgZmFsc2UpKTtcblxuICBsZXQgcmVzOiB0eXBlcy5JVGVzdFJlc3VsdDtcblxuICBpZiAoZW5hYmxlZC5sZW5ndGggPj0gTU9EX0xJTUlUX1RIUkVTSE9MRCkge1xuICAgIHJlcyA9IHtcbiAgICAgIHNldmVyaXR5OiAnd2FybmluZycsXG4gICAgICBkZXNjcmlwdGlvbjoge1xuICAgICAgICBzaG9ydDogdCgnTW9kIExpbWl0IFJlYWNoZWQnKSxcbiAgICAgIH0sXG4gICAgICBhdXRvbWF0aWNGaXg6ICgpID0+IChsaW1pdFBhdGNoZXIuZW5zdXJlTW9kTGltaXRQYXRjaCgpIGFzIGFueSksXG4gICAgfTtcbiAgfVxuXG4gIHJldHVybiBQcm9taXNlLnJlc29sdmUocmVzKTtcbn1cbiJdfQ==