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
exports.testSMAPIOutdated = testSMAPIOutdated;
const vortex_api_1 = require("vortex-api");
const semver_1 = require("semver");
const SMAPI_1 = require("./SMAPI");
const common_1 = require("./common");
function testSMAPIOutdated(api, depManager) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        const state = api.getState();
        const activeGameId = vortex_api_1.selectors.activeGameId(state);
        if (activeGameId !== common_1.GAME_ID) {
            return Promise.resolve(undefined);
        }
        let currentSMAPIVersion = (_b = (_a = (0, SMAPI_1.findSMAPIMod)(api)) === null || _a === void 0 ? void 0 : _a.attributes) === null || _b === void 0 ? void 0 : _b.version;
        if (currentSMAPIVersion === undefined) {
            return Promise.resolve(undefined);
        }
        const isSmapiOutdated = () => __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            currentSMAPIVersion = (_b = (_a = (0, SMAPI_1.findSMAPIMod)(api)) === null || _a === void 0 ? void 0 : _a.attributes) === null || _b === void 0 ? void 0 : _b.version;
            const enabledManifests = yield depManager.getManifests();
            const incompatibleModIds = [];
            for (const [id, manifests] of Object.entries(enabledManifests)) {
                const incompatible = manifests.filter((iter) => {
                    var _a;
                    if (iter.MinimumApiVersion !== undefined) {
                        return !(0, semver_1.gte)(currentSMAPIVersion, (0, semver_1.coerce)((_a = iter.MinimumApiVersion) !== null && _a !== void 0 ? _a : '0.0.0'));
                    }
                    return false;
                });
                if (incompatible.length > 0) {
                    incompatibleModIds.push(id);
                }
            }
            return Promise.resolve((incompatibleModIds.length > 0));
        });
        const outdated = yield isSmapiOutdated();
        const t = api.translate;
        return outdated
            ? Promise.resolve({
                description: {
                    short: t('SMAPI update required'),
                    long: t('Some Stardew Valley mods require a newer version of SMAPI to function correctly, '
                        + 'you should check for SMAPI updates in the mods page.'),
                },
                automaticFix: () => (0, SMAPI_1.downloadSMAPI)(api, true),
                onRecheck: () => isSmapiOutdated(),
                severity: 'warning',
            })
            : Promise.resolve(undefined);
    });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJ0ZXN0cy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQVVBLDhDQStDQztBQXpERCwyQ0FBOEM7QUFJOUMsbUNBQXFDO0FBRXJDLG1DQUFzRDtBQUV0RCxxQ0FBbUM7QUFFbkMsU0FBc0IsaUJBQWlCLENBQUMsR0FBd0IsRUFDeEIsVUFBNkI7OztRQUVuRSxNQUFNLEtBQUssR0FBRyxHQUFHLENBQUMsUUFBUSxFQUFFLENBQUM7UUFDN0IsTUFBTSxZQUFZLEdBQUcsc0JBQVMsQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDbkQsSUFBSSxZQUFZLEtBQUssZ0JBQU8sRUFBRSxDQUFDO1lBQzdCLE9BQU8sT0FBTyxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUNwQyxDQUFDO1FBRUQsSUFBSSxtQkFBbUIsR0FBRyxNQUFBLE1BQUEsSUFBQSxvQkFBWSxFQUFDLEdBQUcsQ0FBQywwQ0FBRSxVQUFVLDBDQUFFLE9BQU8sQ0FBQztRQUNqRSxJQUFJLG1CQUFtQixLQUFLLFNBQVMsRUFBRSxDQUFDO1lBRXRDLE9BQU8sT0FBTyxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUNwQyxDQUFDO1FBRUQsTUFBTSxlQUFlLEdBQUcsR0FBUyxFQUFFOztZQUNqQyxtQkFBbUIsR0FBRyxNQUFBLE1BQUEsSUFBQSxvQkFBWSxFQUFDLEdBQUcsQ0FBQywwQ0FBRSxVQUFVLDBDQUFFLE9BQU8sQ0FBQztZQUM3RCxNQUFNLGdCQUFnQixHQUFHLE1BQU0sVUFBVSxDQUFDLFlBQVksRUFBRSxDQUFDO1lBQ3pELE1BQU0sa0JBQWtCLEdBQWEsRUFBRSxDQUFDO1lBQ3hDLEtBQUssTUFBTSxDQUFDLEVBQUUsRUFBRSxTQUFTLENBQUMsSUFBSSxNQUFNLENBQUMsT0FBTyxDQUFDLGdCQUFnQixDQUFDLEVBQUUsQ0FBQztnQkFDL0QsTUFBTSxZQUFZLEdBQUcsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDLElBQUksRUFBRSxFQUFFOztvQkFDN0MsSUFBSSxJQUFJLENBQUMsaUJBQWlCLEtBQUssU0FBUyxFQUFFLENBQUM7d0JBQ3pDLE9BQU8sQ0FBQyxJQUFBLFlBQUcsRUFBQyxtQkFBbUIsRUFBRSxJQUFBLGVBQU0sRUFBQyxNQUFBLElBQUksQ0FBQyxpQkFBaUIsbUNBQUksT0FBTyxDQUFDLENBQUMsQ0FBQztvQkFDOUUsQ0FBQztvQkFDRCxPQUFPLEtBQUssQ0FBQztnQkFDZixDQUFDLENBQUMsQ0FBQztnQkFDSCxJQUFJLFlBQVksQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLENBQUM7b0JBQzVCLGtCQUFrQixDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQztnQkFDOUIsQ0FBQztZQUNILENBQUM7WUFDRCxPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQyxrQkFBa0IsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUMxRCxDQUFDLENBQUEsQ0FBQTtRQUVELE1BQU0sUUFBUSxHQUFHLE1BQU0sZUFBZSxFQUFFLENBQUM7UUFDekMsTUFBTSxDQUFDLEdBQUcsR0FBRyxDQUFDLFNBQVMsQ0FBQztRQUN4QixPQUFPLFFBQVE7WUFDYixDQUFDLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQztnQkFDaEIsV0FBVyxFQUFFO29CQUNYLEtBQUssRUFBRSxDQUFDLENBQUMsdUJBQXVCLENBQUM7b0JBQ2pDLElBQUksRUFBRSxDQUFDLENBQUMsbUZBQW1GOzBCQUNuRixzREFBc0QsQ0FBQztpQkFDaEU7Z0JBQ0QsWUFBWSxFQUFFLEdBQUcsRUFBRSxDQUFDLElBQUEscUJBQWEsRUFBQyxHQUFHLEVBQUUsSUFBSSxDQUFDO2dCQUM1QyxTQUFTLEVBQUUsR0FBRyxFQUFFLENBQUMsZUFBZSxFQUFFO2dCQUNsQyxRQUFRLEVBQUUsU0FBa0M7YUFDN0MsQ0FBUTtZQUNULENBQUMsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDO0lBQ2pDLENBQUM7Q0FBQSIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IHR5cGVzLCBzZWxlY3RvcnMgfSBmcm9tICd2b3J0ZXgtYXBpJztcblxuaW1wb3J0IERlcGVuZGVuY3lNYW5hZ2VyIGZyb20gJy4vRGVwZW5kZW5jeU1hbmFnZXInO1xuXG5pbXBvcnQgeyBjb2VyY2UsIGd0ZSB9IGZyb20gJ3NlbXZlcic7XG5cbmltcG9ydCB7IGRvd25sb2FkU01BUEksIGZpbmRTTUFQSU1vZCB9IGZyb20gJy4vU01BUEknO1xuXG5pbXBvcnQgeyBHQU1FX0lEIH0gZnJvbSAnLi9jb21tb24nO1xuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gdGVzdFNNQVBJT3V0ZGF0ZWQoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlcE1hbmFnZXI6IERlcGVuZGVuY3lNYW5hZ2VyKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDogUHJvbWlzZTx0eXBlcy5JVGVzdFJlc3VsdD4ge1xuICBjb25zdCBzdGF0ZSA9IGFwaS5nZXRTdGF0ZSgpO1xuICBjb25zdCBhY3RpdmVHYW1lSWQgPSBzZWxlY3RvcnMuYWN0aXZlR2FtZUlkKHN0YXRlKTtcbiAgaWYgKGFjdGl2ZUdhbWVJZCAhPT0gR0FNRV9JRCkge1xuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUodW5kZWZpbmVkKTtcbiAgfVxuXG4gIGxldCBjdXJyZW50U01BUElWZXJzaW9uID0gZmluZFNNQVBJTW9kKGFwaSk/LmF0dHJpYnV0ZXM/LnZlcnNpb247XG4gIGlmIChjdXJyZW50U01BUElWZXJzaW9uID09PSB1bmRlZmluZWQpIHtcbiAgICAvLyBTTUFQSSBpc24ndCBpbnN0YWxsZWQgb3IgZW5hYmxlZC5cbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHVuZGVmaW5lZCk7XG4gIH1cblxuICBjb25zdCBpc1NtYXBpT3V0ZGF0ZWQgPSBhc3luYyAoKSA9PiB7XG4gICAgY3VycmVudFNNQVBJVmVyc2lvbiA9IGZpbmRTTUFQSU1vZChhcGkpPy5hdHRyaWJ1dGVzPy52ZXJzaW9uO1xuICAgIGNvbnN0IGVuYWJsZWRNYW5pZmVzdHMgPSBhd2FpdCBkZXBNYW5hZ2VyLmdldE1hbmlmZXN0cygpO1xuICAgIGNvbnN0IGluY29tcGF0aWJsZU1vZElkczogc3RyaW5nW10gPSBbXTtcbiAgICBmb3IgKGNvbnN0IFtpZCwgbWFuaWZlc3RzXSBvZiBPYmplY3QuZW50cmllcyhlbmFibGVkTWFuaWZlc3RzKSkge1xuICAgICAgY29uc3QgaW5jb21wYXRpYmxlID0gbWFuaWZlc3RzLmZpbHRlcigoaXRlcikgPT4ge1xuICAgICAgICBpZiAoaXRlci5NaW5pbXVtQXBpVmVyc2lvbiAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgcmV0dXJuICFndGUoY3VycmVudFNNQVBJVmVyc2lvbiwgY29lcmNlKGl0ZXIuTWluaW11bUFwaVZlcnNpb24gPz8gJzAuMC4wJykpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH0pO1xuICAgICAgaWYgKGluY29tcGF0aWJsZS5sZW5ndGggPiAwKSB7XG4gICAgICAgIGluY29tcGF0aWJsZU1vZElkcy5wdXNoKGlkKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgoaW5jb21wYXRpYmxlTW9kSWRzLmxlbmd0aCA+IDApKTtcbiAgfVxuXG4gIGNvbnN0IG91dGRhdGVkID0gYXdhaXQgaXNTbWFwaU91dGRhdGVkKCk7XG4gIGNvbnN0IHQgPSBhcGkudHJhbnNsYXRlO1xuICByZXR1cm4gb3V0ZGF0ZWRcbiAgICA/IFByb21pc2UucmVzb2x2ZSh7XG4gICAgICBkZXNjcmlwdGlvbjoge1xuICAgICAgICBzaG9ydDogdCgnU01BUEkgdXBkYXRlIHJlcXVpcmVkJyksXG4gICAgICAgIGxvbmc6IHQoJ1NvbWUgU3RhcmRldyBWYWxsZXkgbW9kcyByZXF1aXJlIGEgbmV3ZXIgdmVyc2lvbiBvZiBTTUFQSSB0byBmdW5jdGlvbiBjb3JyZWN0bHksICdcbiAgICAgICAgICAgICAgKyAneW91IHNob3VsZCBjaGVjayBmb3IgU01BUEkgdXBkYXRlcyBpbiB0aGUgbW9kcyBwYWdlLicpLFxuICAgICAgfSxcbiAgICAgIGF1dG9tYXRpY0ZpeDogKCkgPT4gZG93bmxvYWRTTUFQSShhcGksIHRydWUpLFxuICAgICAgb25SZWNoZWNrOiAoKSA9PiBpc1NtYXBpT3V0ZGF0ZWQoKSxcbiAgICAgIHNldmVyaXR5OiAnd2FybmluZycgYXMgdHlwZXMuUHJvYmxlbVNldmVyaXR5LFxuICAgIH0pIGFzIGFueVxuICAgIDogUHJvbWlzZS5yZXNvbHZlKHVuZGVmaW5lZCk7XG59Il19