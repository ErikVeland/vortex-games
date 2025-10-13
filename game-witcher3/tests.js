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
exports.testModLimitBreach = testModLimitBreach;
const vortex_api_1 = require("vortex-api");
const common_1 = require("./common");
const MOD_LIMIT_THRESHOLD = 24;
function testModLimitBreach(api, limitPatcher) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJ0ZXN0cy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQU9BLGdEQWtDQztBQXpDRCwyQ0FBb0Q7QUFFcEQscUNBQThEO0FBRzlELE1BQU0sbUJBQW1CLEdBQUcsRUFBRSxDQUFDO0FBRS9CLFNBQXNCLGtCQUFrQixDQUN0QyxHQUF3QixFQUN4QixZQUE2Qjs7O1FBQzdCLE1BQU0sQ0FBQyxHQUFHLEdBQUcsQ0FBQyxTQUFTLENBQUM7UUFDeEIsTUFBTSxLQUFLLEdBQWlCLEdBQUcsQ0FBQyxLQUFLLENBQUMsUUFBUSxFQUFFLENBQUM7UUFDakQsTUFBTSxZQUFZLEdBQUcsaUJBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLElBQUEsa0NBQXlCLEdBQUUsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUM3RSxNQUFNLE9BQU8sR0FBbUIsc0JBQVMsQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDL0QsSUFBSSxDQUFBLE9BQU8sYUFBUCxPQUFPLHVCQUFQLE9BQU8sQ0FBRSxNQUFNLE1BQUssZ0JBQU8sSUFBSSxZQUFZLEVBQUUsQ0FBQztZQUNoRCxPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUM7UUFDcEMsQ0FBQztRQUVELE1BQU0sSUFBSSxHQUFvQyxNQUFBLEtBQUssQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLGdCQUFPLENBQUMsbUNBQUksRUFBRSxDQUFDO1FBQ25GLE1BQU0sVUFBVSxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLElBQUksS0FBSyxtQkFBbUIsQ0FBQyxDQUFDO1FBQ3JGLElBQUksVUFBVSxFQUFFLENBQUM7WUFFZixPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUM7UUFDcEMsQ0FBQztRQUVELE1BQU0sT0FBTyxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQzVDLGlCQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFDLFVBQVUsRUFBRSxFQUFFLEVBQUUsU0FBUyxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQztRQUU3RCxJQUFJLEdBQXNCLENBQUM7UUFFM0IsSUFBSSxPQUFPLENBQUMsTUFBTSxJQUFJLG1CQUFtQixFQUFFLENBQUM7WUFDMUMsR0FBRyxHQUFHO2dCQUNKLFFBQVEsRUFBRSxTQUFTO2dCQUNuQixXQUFXLEVBQUU7b0JBQ1gsS0FBSyxFQUFFLENBQUMsQ0FBQyxtQkFBbUIsQ0FBQztpQkFDOUI7Z0JBQ0QsWUFBWSxFQUFFLEdBQUcsRUFBRSxDQUFFLFlBQVksQ0FBQyxtQkFBbUIsRUFBVTthQUNoRSxDQUFDO1FBQ0osQ0FBQztRQUVELE9BQU8sT0FBTyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUM5QixDQUFDO0NBQUEiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBzZWxlY3RvcnMsIHR5cGVzLCB1dGlsIH0gZnJvbSAndm9ydGV4LWFwaSc7XG5cbmltcG9ydCB7IEdBTUVfSUQsIGdldFN1cHByZXNzTW9kTGltaXRCcmFuY2ggfSBmcm9tICcuL2NvbW1vbic7XG5pbXBvcnQgeyBNb2RMaW1pdFBhdGNoZXIgfSBmcm9tICcuL21vZExpbWl0UGF0Y2gnO1xuXG5jb25zdCBNT0RfTElNSVRfVEhSRVNIT0xEID0gMjQ7XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiB0ZXN0TW9kTGltaXRCcmVhY2goXG4gIGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSxcbiAgbGltaXRQYXRjaGVyOiBNb2RMaW1pdFBhdGNoZXIpOiBQcm9taXNlPHR5cGVzLklUZXN0UmVzdWx0PiB7XG4gIGNvbnN0IHQgPSBhcGkudHJhbnNsYXRlO1xuICBjb25zdCBzdGF0ZTogdHlwZXMuSVN0YXRlID0gYXBpLnN0b3JlLmdldFN0YXRlKCk7XG4gIGNvbnN0IGlzU3VwcHJlc3NlZCA9IHV0aWwuZ2V0U2FmZShzdGF0ZSwgZ2V0U3VwcHJlc3NNb2RMaW1pdEJyYW5jaCgpLCBmYWxzZSk7XG4gIGNvbnN0IHByb2ZpbGU6IHR5cGVzLklQcm9maWxlID0gc2VsZWN0b3JzLmFjdGl2ZVByb2ZpbGUoc3RhdGUpO1xuICBpZiAocHJvZmlsZT8uZ2FtZUlkICE9PSBHQU1FX0lEIHx8IGlzU3VwcHJlc3NlZCkge1xuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUodW5kZWZpbmVkKTtcbiAgfVxuXG4gIGNvbnN0IG1vZHM6IHsgW21vZElkOiBzdHJpbmddOiB0eXBlcy5JTW9kIH0gPSBzdGF0ZS5wZXJzaXN0ZW50Lm1vZHNbR0FNRV9JRF0gPz8ge307XG4gIGNvbnN0IGxpbWl0UGF0Y2ggPSBPYmplY3QudmFsdWVzKG1vZHMpLmZpbmQobW9kID0+IG1vZC50eXBlID09PSAndzNtb2RsaW1pdHBhdGNoZXInKTtcbiAgaWYgKGxpbWl0UGF0Y2gpIHtcbiAgICAvLyBBIGxpbWl0IHBhdGNoIGFscmVhZHkgZXhpc3RzLlxuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUodW5kZWZpbmVkKTtcbiAgfVxuXG4gIGNvbnN0IGVuYWJsZWQgPSBPYmplY3Qua2V5cyhtb2RzKS5maWx0ZXIoaWQgPT5cbiAgICB1dGlsLmdldFNhZmUocHJvZmlsZSwgWydtb2RTdGF0ZScsIGlkLCAnZW5hYmxlZCddLCBmYWxzZSkpO1xuXG4gIGxldCByZXM6IHR5cGVzLklUZXN0UmVzdWx0O1xuXG4gIGlmIChlbmFibGVkLmxlbmd0aCA+PSBNT0RfTElNSVRfVEhSRVNIT0xEKSB7XG4gICAgcmVzID0ge1xuICAgICAgc2V2ZXJpdHk6ICd3YXJuaW5nJyxcbiAgICAgIGRlc2NyaXB0aW9uOiB7XG4gICAgICAgIHNob3J0OiB0KCdNb2QgTGltaXQgUmVhY2hlZCcpLFxuICAgICAgfSxcbiAgICAgIGF1dG9tYXRpY0ZpeDogKCkgPT4gKGxpbWl0UGF0Y2hlci5lbnN1cmVNb2RMaW1pdFBhdGNoKCkgYXMgYW55KSxcbiAgICB9O1xuICB9XG5cbiAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShyZXMpO1xufVxuIl19