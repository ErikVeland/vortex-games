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
exports.testSMAPIOutdated = void 0;
const vortex_api_1 = require("vortex-api");
const semver_1 = require("semver");
const SMAPI_1 = require("./SMAPI");
const common_1 = require("./common");
function testSMAPIOutdated(api, depManager) {
    var _a, _b;
    return __awaiter(this, void 0, void 0, function* () {
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
            var _c, _d;
            currentSMAPIVersion = (_d = (_c = (0, SMAPI_1.findSMAPIMod)(api)) === null || _c === void 0 ? void 0 : _c.attributes) === null || _d === void 0 ? void 0 : _d.version;
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
exports.testSMAPIOutdated = testSMAPIOutdated;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJ0ZXN0cy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7QUFBQSwyQ0FBOEM7QUFJOUMsbUNBQXFDO0FBRXJDLG1DQUFzRDtBQUV0RCxxQ0FBbUM7QUFFbkMsU0FBc0IsaUJBQWlCLENBQUMsR0FBd0IsRUFDeEIsVUFBNkI7OztRQUVuRSxNQUFNLEtBQUssR0FBRyxHQUFHLENBQUMsUUFBUSxFQUFFLENBQUM7UUFDN0IsTUFBTSxZQUFZLEdBQUcsc0JBQVMsQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDbkQsSUFBSSxZQUFZLEtBQUssZ0JBQU8sRUFBRTtZQUM1QixPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUM7U0FDbkM7UUFFRCxJQUFJLG1CQUFtQixHQUFHLE1BQUEsTUFBQSxJQUFBLG9CQUFZLEVBQUMsR0FBRyxDQUFDLDBDQUFFLFVBQVUsMENBQUUsT0FBTyxDQUFDO1FBQ2pFLElBQUksbUJBQW1CLEtBQUssU0FBUyxFQUFFO1lBRXJDLE9BQU8sT0FBTyxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQztTQUNuQztRQUVELE1BQU0sZUFBZSxHQUFHLEdBQVMsRUFBRTs7WUFDakMsbUJBQW1CLEdBQUcsTUFBQSxNQUFBLElBQUEsb0JBQVksRUFBQyxHQUFHLENBQUMsMENBQUUsVUFBVSwwQ0FBRSxPQUFPLENBQUM7WUFDN0QsTUFBTSxnQkFBZ0IsR0FBRyxNQUFNLFVBQVUsQ0FBQyxZQUFZLEVBQUUsQ0FBQztZQUN6RCxNQUFNLGtCQUFrQixHQUFhLEVBQUUsQ0FBQztZQUN4QyxLQUFLLE1BQU0sQ0FBQyxFQUFFLEVBQUUsU0FBUyxDQUFDLElBQUksTUFBTSxDQUFDLE9BQU8sQ0FBQyxnQkFBZ0IsQ0FBQyxFQUFFO2dCQUM5RCxNQUFNLFlBQVksR0FBRyxTQUFTLENBQUMsTUFBTSxDQUFDLENBQUMsSUFBSSxFQUFFLEVBQUU7O29CQUM3QyxJQUFJLElBQUksQ0FBQyxpQkFBaUIsS0FBSyxTQUFTLEVBQUU7d0JBQ3hDLE9BQU8sQ0FBQyxJQUFBLFlBQUcsRUFBQyxtQkFBbUIsRUFBRSxJQUFBLGVBQU0sRUFBQyxNQUFBLElBQUksQ0FBQyxpQkFBaUIsbUNBQUksT0FBTyxDQUFDLENBQUMsQ0FBQztxQkFDN0U7b0JBQ0QsT0FBTyxLQUFLLENBQUM7Z0JBQ2YsQ0FBQyxDQUFDLENBQUM7Z0JBQ0gsSUFBSSxZQUFZLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRTtvQkFDM0Isa0JBQWtCLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDO2lCQUM3QjthQUNGO1lBQ0QsT0FBTyxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUMsa0JBQWtCLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDMUQsQ0FBQyxDQUFBLENBQUE7UUFFRCxNQUFNLFFBQVEsR0FBRyxNQUFNLGVBQWUsRUFBRSxDQUFDO1FBQ3pDLE1BQU0sQ0FBQyxHQUFHLEdBQUcsQ0FBQyxTQUFTLENBQUM7UUFDeEIsT0FBTyxRQUFRO1lBQ2IsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUM7Z0JBQ2hCLFdBQVcsRUFBRTtvQkFDWCxLQUFLLEVBQUUsQ0FBQyxDQUFDLHVCQUF1QixDQUFDO29CQUNqQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLG1GQUFtRjswQkFDbkYsc0RBQXNELENBQUM7aUJBQ2hFO2dCQUNELFlBQVksRUFBRSxHQUFHLEVBQUUsQ0FBQyxJQUFBLHFCQUFhLEVBQUMsR0FBRyxFQUFFLElBQUksQ0FBQztnQkFDNUMsU0FBUyxFQUFFLEdBQUcsRUFBRSxDQUFDLGVBQWUsRUFBRTtnQkFDbEMsUUFBUSxFQUFFLFNBQWtDO2FBQzdDLENBQVE7WUFDVCxDQUFDLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQzs7Q0FDaEM7QUEvQ0QsOENBK0NDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgdHlwZXMsIHNlbGVjdG9ycyB9IGZyb20gJ3ZvcnRleC1hcGknO1xuXG5pbXBvcnQgRGVwZW5kZW5jeU1hbmFnZXIgZnJvbSAnLi9EZXBlbmRlbmN5TWFuYWdlcic7XG5cbmltcG9ydCB7IGNvZXJjZSwgZ3RlIH0gZnJvbSAnc2VtdmVyJztcblxuaW1wb3J0IHsgZG93bmxvYWRTTUFQSSwgZmluZFNNQVBJTW9kIH0gZnJvbSAnLi9TTUFQSSc7XG5cbmltcG9ydCB7IEdBTUVfSUQgfSBmcm9tICcuL2NvbW1vbic7XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiB0ZXN0U01BUElPdXRkYXRlZChhcGk6IHR5cGVzLklFeHRlbnNpb25BcGksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVwTWFuYWdlcjogRGVwZW5kZW5jeU1hbmFnZXIpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgOiBQcm9taXNlPHR5cGVzLklUZXN0UmVzdWx0PiB7XG4gIGNvbnN0IHN0YXRlID0gYXBpLmdldFN0YXRlKCk7XG4gIGNvbnN0IGFjdGl2ZUdhbWVJZCA9IHNlbGVjdG9ycy5hY3RpdmVHYW1lSWQoc3RhdGUpO1xuICBpZiAoYWN0aXZlR2FtZUlkICE9PSBHQU1FX0lEKSB7XG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh1bmRlZmluZWQpO1xuICB9XG5cbiAgbGV0IGN1cnJlbnRTTUFQSVZlcnNpb24gPSBmaW5kU01BUElNb2QoYXBpKT8uYXR0cmlidXRlcz8udmVyc2lvbjtcbiAgaWYgKGN1cnJlbnRTTUFQSVZlcnNpb24gPT09IHVuZGVmaW5lZCkge1xuICAgIC8vIFNNQVBJIGlzbid0IGluc3RhbGxlZCBvciBlbmFibGVkLlxuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUodW5kZWZpbmVkKTtcbiAgfVxuXG4gIGNvbnN0IGlzU21hcGlPdXRkYXRlZCA9IGFzeW5jICgpID0+IHtcbiAgICBjdXJyZW50U01BUElWZXJzaW9uID0gZmluZFNNQVBJTW9kKGFwaSk/LmF0dHJpYnV0ZXM/LnZlcnNpb247XG4gICAgY29uc3QgZW5hYmxlZE1hbmlmZXN0cyA9IGF3YWl0IGRlcE1hbmFnZXIuZ2V0TWFuaWZlc3RzKCk7XG4gICAgY29uc3QgaW5jb21wYXRpYmxlTW9kSWRzOiBzdHJpbmdbXSA9IFtdO1xuICAgIGZvciAoY29uc3QgW2lkLCBtYW5pZmVzdHNdIG9mIE9iamVjdC5lbnRyaWVzKGVuYWJsZWRNYW5pZmVzdHMpKSB7XG4gICAgICBjb25zdCBpbmNvbXBhdGlibGUgPSBtYW5pZmVzdHMuZmlsdGVyKChpdGVyKSA9PiB7XG4gICAgICAgIGlmIChpdGVyLk1pbmltdW1BcGlWZXJzaW9uICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICByZXR1cm4gIWd0ZShjdXJyZW50U01BUElWZXJzaW9uLCBjb2VyY2UoaXRlci5NaW5pbXVtQXBpVmVyc2lvbiA/PyAnMC4wLjAnKSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfSk7XG4gICAgICBpZiAoaW5jb21wYXRpYmxlLmxlbmd0aCA+IDApIHtcbiAgICAgICAgaW5jb21wYXRpYmxlTW9kSWRzLnB1c2goaWQpO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKChpbmNvbXBhdGlibGVNb2RJZHMubGVuZ3RoID4gMCkpO1xuICB9XG5cbiAgY29uc3Qgb3V0ZGF0ZWQgPSBhd2FpdCBpc1NtYXBpT3V0ZGF0ZWQoKTtcbiAgY29uc3QgdCA9IGFwaS50cmFuc2xhdGU7XG4gIHJldHVybiBvdXRkYXRlZFxuICAgID8gUHJvbWlzZS5yZXNvbHZlKHtcbiAgICAgIGRlc2NyaXB0aW9uOiB7XG4gICAgICAgIHNob3J0OiB0KCdTTUFQSSB1cGRhdGUgcmVxdWlyZWQnKSxcbiAgICAgICAgbG9uZzogdCgnU29tZSBTdGFyZGV3IFZhbGxleSBtb2RzIHJlcXVpcmUgYSBuZXdlciB2ZXJzaW9uIG9mIFNNQVBJIHRvIGZ1bmN0aW9uIGNvcnJlY3RseSwgJ1xuICAgICAgICAgICAgICArICd5b3Ugc2hvdWxkIGNoZWNrIGZvciBTTUFQSSB1cGRhdGVzIGluIHRoZSBtb2RzIHBhZ2UuJyksXG4gICAgICB9LFxuICAgICAgYXV0b21hdGljRml4OiAoKSA9PiBkb3dubG9hZFNNQVBJKGFwaSwgdHJ1ZSksXG4gICAgICBvblJlY2hlY2s6ICgpID0+IGlzU21hcGlPdXRkYXRlZCgpLFxuICAgICAgc2V2ZXJpdHk6ICd3YXJuaW5nJyBhcyB0eXBlcy5Qcm9ibGVtU2V2ZXJpdHksXG4gICAgfSkgYXMgYW55XG4gICAgOiBQcm9taXNlLnJlc29sdmUodW5kZWZpbmVkKTtcbn0iXX0=