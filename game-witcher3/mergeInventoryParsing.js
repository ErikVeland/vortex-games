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
exports.getNamesOfMergedMods = exports.getMergedModNames = void 0;
const bluebird_1 = __importDefault(require("bluebird"));
const path_1 = __importDefault(require("path"));
const xml2js_1 = require("xml2js");
const common_1 = require("./common");
const vortex_api_1 = require("vortex-api");
function getMergeInventory(api) {
    const state = api.getState();
    const discovery = vortex_api_1.util.getSafe(state, ['settings', 'gameMode', 'discovered', common_1.GAME_ID], undefined);
    const scriptMerger = vortex_api_1.util.getSafe(discovery, ['tools', common_1.SCRIPT_MERGER_ID], undefined);
    if ((scriptMerger === undefined) || (scriptMerger.path === undefined)) {
        return bluebird_1.default.resolve([]);
    }
    return vortex_api_1.fs.readFileAsync(path_1.default.join(path_1.default.dirname(scriptMerger.path), common_1.MERGE_INV_MANIFEST))
        .then((xmlData) => __awaiter(this, void 0, void 0, function* () {
        try {
            const mergeData = yield (0, xml2js_1.parseStringPromise)(xmlData);
            return Promise.resolve(mergeData);
        }
        catch (err) {
            return Promise.reject(err);
        }
    }))
        .catch(err => (err.code === 'ENOENT')
        ? Promise.resolve(undefined)
        : Promise.reject(new vortex_api_1.util.DataInvalid(`Failed to parse ${common_1.MERGE_INV_MANIFEST}: ${err}`)));
}
function getMergedModNames(api) {
    return getMergeInventory(api)
        .then((mergeInventory) => __awaiter(this, void 0, void 0, function* () {
        var _a;
        if (mergeInventory === undefined) {
            return Promise.resolve([]);
        }
        const state = api.getState();
        const discovery = vortex_api_1.util.getSafe(state, ['settings', 'gameMode', 'discovered', common_1.GAME_ID], undefined);
        const modsPath = path_1.default.join(discovery.path, 'Mods');
        const mergeEntry = (_a = mergeInventory === null || mergeInventory === void 0 ? void 0 : mergeInventory.MergeInventory) === null || _a === void 0 ? void 0 : _a.Merge;
        if (mergeEntry === undefined) {
            let inv;
            try {
                inv = JSON.stringify(mergeInventory);
            }
            catch (err) {
                return Promise.reject(err);
            }
            (0, vortex_api_1.log)('debug', 'failed to retrieve merged mod names', inv);
            return Promise.resolve([]);
        }
        const elements = yield mergeEntry.reduce((accumP, iter) => __awaiter(this, void 0, void 0, function* () {
            var _b;
            const accum = yield accumP;
            const mergeModName = (_b = iter === null || iter === void 0 ? void 0 : iter.MergedModName) === null || _b === void 0 ? void 0 : _b[0];
            if (mergeModName === undefined) {
                return accum;
            }
            if (!accum.includes(mergeModName)) {
                try {
                    yield vortex_api_1.fs.statAsync(path_1.default.join(modsPath, mergeModName));
                    accum.push(mergeModName);
                }
                catch (err) {
                    (0, vortex_api_1.log)('debug', 'merged mod is missing', mergeModName);
                }
            }
            return accum;
        }), []);
        return Promise.resolve(elements);
    }))
        .catch(err => {
        api.showErrorNotification('Invalid MergeInventory.xml file', err, { allowReport: false });
        return Promise.resolve([]);
    });
}
exports.getMergedModNames = getMergedModNames;
function getNamesOfMergedMods(api) {
    return getMergeInventory(api)
        .then((mergeInventory) => __awaiter(this, void 0, void 0, function* () {
        if (mergeInventory === undefined) {
            return Promise.resolve([]);
        }
        const state = api.getState();
        const discovery = vortex_api_1.util.getSafe(state, ['settings', 'gameMode', 'discovered', common_1.GAME_ID], undefined);
        const modsPath = path_1.default.join(discovery.path, 'Mods');
        const modNames = yield mergeInventory.MergeInventory.Merge.reduce((accumP, iter) => __awaiter(this, void 0, void 0, function* () {
            const accum = yield accumP;
            const mergedMods = iter === null || iter === void 0 ? void 0 : iter.IncludedMod;
            for (const modName of mergedMods) {
                if (modName === undefined) {
                    return accum;
                }
                if (!accum.includes(modName === null || modName === void 0 ? void 0 : modName._)) {
                    try {
                        yield vortex_api_1.fs.statAsync(path_1.default.join(modsPath, modName === null || modName === void 0 ? void 0 : modName._));
                        accum.push(modName === null || modName === void 0 ? void 0 : modName._);
                    }
                    catch (err) {
                        (0, vortex_api_1.log)('debug', 'merged mod is missing', modName === null || modName === void 0 ? void 0 : modName._);
                    }
                }
            }
            return accum;
        }), []);
        return Promise.resolve(modNames);
    }));
}
exports.getNamesOfMergedMods = getNamesOfMergedMods;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWVyZ2VJbnZlbnRvcnlQYXJzaW5nLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsibWVyZ2VJbnZlbnRvcnlQYXJzaW5nLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7OztBQUNBLHdEQUFnQztBQUNoQyxnREFBd0I7QUFDeEIsbUNBQTRDO0FBRTVDLHFDQUF5RTtBQUV6RSwyQ0FBa0Q7QUFFbEQsU0FBUyxpQkFBaUIsQ0FBQyxHQUF3QjtJQUdqRCxNQUFNLEtBQUssR0FBRyxHQUFHLENBQUMsUUFBUSxFQUFFLENBQUM7SUFDN0IsTUFBTSxTQUFTLEdBQUcsaUJBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLENBQUMsVUFBVSxFQUFFLFVBQVUsRUFBRSxZQUFZLEVBQUUsZ0JBQU8sQ0FBQyxFQUFFLFNBQVMsQ0FBQyxDQUFDO0lBQ2xHLE1BQU0sWUFBWSxHQUFHLGlCQUFJLENBQUMsT0FBTyxDQUFDLFNBQVMsRUFBRSxDQUFDLE9BQU8sRUFBRSx5QkFBZ0IsQ0FBQyxFQUFFLFNBQVMsQ0FBQyxDQUFDO0lBQ3JGLElBQUksQ0FBQyxZQUFZLEtBQUssU0FBUyxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxLQUFLLFNBQVMsQ0FBQyxFQUFFO1FBQ3JFLE9BQU8sa0JBQVEsQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLENBQUM7S0FDN0I7SUFFRCxPQUFPLGVBQUUsQ0FBQyxhQUFhLENBQUMsY0FBSSxDQUFDLElBQUksQ0FBQyxjQUFJLENBQUMsT0FBTyxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsRUFBRSwyQkFBa0IsQ0FBQyxDQUFDO1NBQ3BGLElBQUksQ0FBQyxDQUFNLE9BQU8sRUFBQyxFQUFFO1FBQ3BCLElBQUk7WUFDRixNQUFNLFNBQVMsR0FBRyxNQUFNLElBQUEsMkJBQWtCLEVBQUMsT0FBTyxDQUFDLENBQUM7WUFDcEQsT0FBTyxPQUFPLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1NBQ25DO1FBQUMsT0FBTyxHQUFHLEVBQUU7WUFDWixPQUFPLE9BQU8sQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUM7U0FDNUI7SUFDSCxDQUFDLENBQUEsQ0FBQztTQUNELEtBQUssQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxDQUFDLElBQUksS0FBSyxRQUFRLENBQUM7UUFDbkMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDO1FBQzVCLENBQUMsQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLElBQUksaUJBQUksQ0FBQyxXQUFXLENBQUMsbUJBQW1CLDJCQUFrQixLQUFLLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQy9GLENBQUM7QUFFRCxTQUFnQixpQkFBaUIsQ0FBQyxHQUF3QjtJQUd4RCxPQUFPLGlCQUFpQixDQUFDLEdBQUcsQ0FBQztTQUMxQixJQUFJLENBQUMsQ0FBTSxjQUFjLEVBQUMsRUFBRTs7UUFDM0IsSUFBSSxjQUFjLEtBQUssU0FBUyxFQUFFO1lBQ2hDLE9BQU8sT0FBTyxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsQ0FBQztTQUM1QjtRQUNELE1BQU0sS0FBSyxHQUFHLEdBQUcsQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUM3QixNQUFNLFNBQVMsR0FBRyxpQkFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQ2xDLENBQUMsVUFBVSxFQUFFLFVBQVUsRUFBRSxZQUFZLEVBQUUsZ0JBQU8sQ0FBQyxFQUFFLFNBQVMsQ0FBQyxDQUFDO1FBQzlELE1BQU0sUUFBUSxHQUFHLGNBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksRUFBRSxNQUFNLENBQUMsQ0FBQztRQUNuRCxNQUFNLFVBQVUsR0FBRyxNQUFBLGNBQWMsYUFBZCxjQUFjLHVCQUFkLGNBQWMsQ0FBRSxjQUFjLDBDQUFFLEtBQUssQ0FBQztRQUN6RCxJQUFJLFVBQVUsS0FBSyxTQUFTLEVBQUU7WUFDNUIsSUFBSSxHQUFHLENBQUM7WUFDUixJQUFJO2dCQUNGLEdBQUcsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLGNBQWMsQ0FBQyxDQUFDO2FBQ3RDO1lBQUMsT0FBTyxHQUFHLEVBQUU7Z0JBQ1osT0FBTyxPQUFPLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDO2FBQzVCO1lBQ0QsSUFBQSxnQkFBRyxFQUFDLE9BQU8sRUFBRSxxQ0FBcUMsRUFBRSxHQUFHLENBQUMsQ0FBQztZQUN6RCxPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLENBQUM7U0FDNUI7UUFDRCxNQUFNLFFBQVEsR0FBRyxNQUFNLFVBQVUsQ0FBQyxNQUFNLENBQUMsQ0FBTyxNQUFNLEVBQUUsSUFBSSxFQUFFLEVBQUU7O1lBQzlELE1BQU0sS0FBSyxHQUFHLE1BQU0sTUFBTSxDQUFDO1lBQzNCLE1BQU0sWUFBWSxHQUFHLE1BQUEsSUFBSSxhQUFKLElBQUksdUJBQUosSUFBSSxDQUFFLGFBQWEsMENBQUcsQ0FBQyxDQUFDLENBQUM7WUFDOUMsSUFBSSxZQUFZLEtBQUssU0FBUyxFQUFFO2dCQUM5QixPQUFPLEtBQUssQ0FBQzthQUNkO1lBQ0QsSUFBSSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsWUFBWSxDQUFDLEVBQUU7Z0JBQ2pDLElBQUk7b0JBQ0YsTUFBTSxlQUFFLENBQUMsU0FBUyxDQUFDLGNBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLFlBQVksQ0FBQyxDQUFDLENBQUM7b0JBQ3RELEtBQUssQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUM7aUJBQzFCO2dCQUFDLE9BQU8sR0FBRyxFQUFFO29CQUNaLElBQUEsZ0JBQUcsRUFBQyxPQUFPLEVBQUUsdUJBQXVCLEVBQUUsWUFBWSxDQUFDLENBQUM7aUJBQ3JEO2FBQ0Y7WUFDRCxPQUFPLEtBQUssQ0FBQztRQUNmLENBQUMsQ0FBQSxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBQ1AsT0FBTyxPQUFPLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDO0lBQ25DLENBQUMsQ0FBQSxDQUFDO1NBQ0QsS0FBSyxDQUFDLEdBQUcsQ0FBQyxFQUFFO1FBS1gsR0FBRyxDQUFDLHFCQUFxQixDQUFDLGlDQUFpQyxFQUFFLEdBQUcsRUFDOUQsRUFBRSxXQUFXLEVBQUUsS0FBSyxFQUFFLENBQUMsQ0FBQztRQUMxQixPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLENBQUM7SUFDN0IsQ0FBQyxDQUFDLENBQUM7QUFDUCxDQUFDO0FBbERELDhDQWtEQztBQUVELFNBQWdCLG9CQUFvQixDQUFDLEdBQXdCO0lBRTNELE9BQU8saUJBQWlCLENBQUMsR0FBRyxDQUFDO1NBQzFCLElBQUksQ0FBQyxDQUFNLGNBQWMsRUFBQyxFQUFFO1FBQzNCLElBQUksY0FBYyxLQUFLLFNBQVMsRUFBRTtZQUNoQyxPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLENBQUM7U0FDNUI7UUFDRCxNQUFNLEtBQUssR0FBRyxHQUFHLENBQUMsUUFBUSxFQUFFLENBQUM7UUFDN0IsTUFBTSxTQUFTLEdBQUcsaUJBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUNsQyxDQUFDLFVBQVUsRUFBRSxVQUFVLEVBQUUsWUFBWSxFQUFFLGdCQUFPLENBQUMsRUFBRSxTQUFTLENBQUMsQ0FBQztRQUM5RCxNQUFNLFFBQVEsR0FBRyxjQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsTUFBTSxDQUFDLENBQUM7UUFDbkQsTUFBTSxRQUFRLEdBQUcsTUFBTSxjQUFjLENBQUMsY0FBYyxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBTyxNQUFNLEVBQUUsSUFBSSxFQUFFLEVBQUU7WUFDdkYsTUFBTSxLQUFLLEdBQUcsTUFBTSxNQUFNLENBQUM7WUFDM0IsTUFBTSxVQUFVLEdBQUcsSUFBSSxhQUFKLElBQUksdUJBQUosSUFBSSxDQUFFLFdBQVcsQ0FBQztZQUNyQyxLQUFLLE1BQU0sT0FBTyxJQUFJLFVBQVUsRUFBRTtnQkFDaEMsSUFBSSxPQUFPLEtBQUssU0FBUyxFQUFFO29CQUN6QixPQUFPLEtBQUssQ0FBQztpQkFDZDtnQkFDRCxJQUFJLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxPQUFPLGFBQVAsT0FBTyx1QkFBUCxPQUFPLENBQUUsQ0FBQyxDQUFDLEVBQUU7b0JBQy9CLElBQUk7d0JBQ0YsTUFBTSxlQUFFLENBQUMsU0FBUyxDQUFDLGNBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLE9BQU8sYUFBUCxPQUFPLHVCQUFQLE9BQU8sQ0FBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO3dCQUNwRCxLQUFLLENBQUMsSUFBSSxDQUFDLE9BQU8sYUFBUCxPQUFPLHVCQUFQLE9BQU8sQ0FBRSxDQUFDLENBQUMsQ0FBQztxQkFDeEI7b0JBQUMsT0FBTyxHQUFHLEVBQUU7d0JBQ1osSUFBQSxnQkFBRyxFQUFDLE9BQU8sRUFBRSx1QkFBdUIsRUFBRSxPQUFPLGFBQVAsT0FBTyx1QkFBUCxPQUFPLENBQUUsQ0FBQyxDQUFDLENBQUM7cUJBQ25EO2lCQUNGO2FBQ0Y7WUFDRCxPQUFPLEtBQUssQ0FBQztRQUNmLENBQUMsQ0FBQSxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBQ1AsT0FBTyxPQUFPLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDO0lBQ25DLENBQUMsQ0FBQSxDQUFDLENBQUM7QUFDUCxDQUFDO0FBL0JELG9EQStCQyIsInNvdXJjZXNDb250ZW50IjpbIi8qIGVzbGludC1kaXNhYmxlICovXG5pbXBvcnQgQmx1ZWJpcmQgZnJvbSAnYmx1ZWJpcmQnO1xuaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgeyBwYXJzZVN0cmluZ1Byb21pc2UgfSBmcm9tICd4bWwyanMnO1xuXG5pbXBvcnQgeyBHQU1FX0lELCBTQ1JJUFRfTUVSR0VSX0lELCBNRVJHRV9JTlZfTUFOSUZFU1QgfSBmcm9tICcuL2NvbW1vbic7XG5cbmltcG9ydCB7IGZzLCBsb2csIHR5cGVzLCB1dGlsIH0gZnJvbSAndm9ydGV4LWFwaSc7XG5cbmZ1bmN0aW9uIGdldE1lcmdlSW52ZW50b3J5KGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSkge1xuICAvLyBQcm92aWRlZCB3aXRoIGEgcGF0dGVybiwgYXR0ZW1wdHMgdG8gcmV0cmlldmUgZWxlbWVudCB2YWx1ZXNcbiAgLy8gIGZyb20gYW55IGVsZW1lbnQga2V5cyB0aGF0IG1hdGNoIHRoZSBwYXR0ZXJuIGluc2lkZSB0aGUgbWVyZ2UgaW52ZW50b3J5IGZpbGUuXG4gIGNvbnN0IHN0YXRlID0gYXBpLmdldFN0YXRlKCk7XG4gIGNvbnN0IGRpc2NvdmVyeSA9IHV0aWwuZ2V0U2FmZShzdGF0ZSwgWydzZXR0aW5ncycsICdnYW1lTW9kZScsICdkaXNjb3ZlcmVkJywgR0FNRV9JRF0sIHVuZGVmaW5lZCk7XG4gIGNvbnN0IHNjcmlwdE1lcmdlciA9IHV0aWwuZ2V0U2FmZShkaXNjb3ZlcnksIFsndG9vbHMnLCBTQ1JJUFRfTUVSR0VSX0lEXSwgdW5kZWZpbmVkKTtcbiAgaWYgKChzY3JpcHRNZXJnZXIgPT09IHVuZGVmaW5lZCkgfHwgKHNjcmlwdE1lcmdlci5wYXRoID09PSB1bmRlZmluZWQpKSB7XG4gICAgcmV0dXJuIEJsdWViaXJkLnJlc29sdmUoW10pO1xuICB9XG5cbiAgcmV0dXJuIGZzLnJlYWRGaWxlQXN5bmMocGF0aC5qb2luKHBhdGguZGlybmFtZShzY3JpcHRNZXJnZXIucGF0aCksIE1FUkdFX0lOVl9NQU5JRkVTVCkpXG4gICAgLnRoZW4oYXN5bmMgeG1sRGF0YSA9PiB7XG4gICAgICB0cnkge1xuICAgICAgICBjb25zdCBtZXJnZURhdGEgPSBhd2FpdCBwYXJzZVN0cmluZ1Byb21pc2UoeG1sRGF0YSk7XG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUobWVyZ2VEYXRhKTtcbiAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoZXJyKTtcbiAgICAgIH1cbiAgICB9KVxuICAgIC5jYXRjaChlcnIgPT4gKGVyci5jb2RlID09PSAnRU5PRU5UJykgLy8gTm8gbWVyZ2UgZmlsZT8gLSBubyBwcm9ibGVtLlxuICAgICAgPyBQcm9taXNlLnJlc29sdmUodW5kZWZpbmVkKVxuICAgICAgOiBQcm9taXNlLnJlamVjdChuZXcgdXRpbC5EYXRhSW52YWxpZChgRmFpbGVkIHRvIHBhcnNlICR7TUVSR0VfSU5WX01BTklGRVNUfTogJHtlcnJ9YCkpKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldE1lcmdlZE1vZE5hbWVzKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSkge1xuICAvLyBUaGlzIHJldHJpZXZlcyB0aGUgbmFtZSBvZiB0aGUgcmVzdWx0aW5nIG1lcmdlZCBtb2QgaXRzZWxmLlxuICAvLyAgQUtBIFwibW9kMDAwMF9NZXJnZWRGaWxlc1wiXG4gIHJldHVybiBnZXRNZXJnZUludmVudG9yeShhcGkpXG4gICAgLnRoZW4oYXN5bmMgbWVyZ2VJbnZlbnRvcnkgPT4ge1xuICAgICAgaWYgKG1lcmdlSW52ZW50b3J5ID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShbXSk7XG4gICAgICB9XG4gICAgICBjb25zdCBzdGF0ZSA9IGFwaS5nZXRTdGF0ZSgpO1xuICAgICAgY29uc3QgZGlzY292ZXJ5ID0gdXRpbC5nZXRTYWZlKHN0YXRlLFxuICAgICAgICBbJ3NldHRpbmdzJywgJ2dhbWVNb2RlJywgJ2Rpc2NvdmVyZWQnLCBHQU1FX0lEXSwgdW5kZWZpbmVkKTtcbiAgICAgIGNvbnN0IG1vZHNQYXRoID0gcGF0aC5qb2luKGRpc2NvdmVyeS5wYXRoLCAnTW9kcycpO1xuICAgICAgY29uc3QgbWVyZ2VFbnRyeSA9IG1lcmdlSW52ZW50b3J5Py5NZXJnZUludmVudG9yeT8uTWVyZ2U7XG4gICAgICBpZiAobWVyZ2VFbnRyeSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGxldCBpbnY7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgaW52ID0gSlNPTi5zdHJpbmdpZnkobWVyZ2VJbnZlbnRvcnkpO1xuICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoZXJyKTtcbiAgICAgICAgfVxuICAgICAgICBsb2coJ2RlYnVnJywgJ2ZhaWxlZCB0byByZXRyaWV2ZSBtZXJnZWQgbW9kIG5hbWVzJywgaW52KTtcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShbXSk7XG4gICAgICB9XG4gICAgICBjb25zdCBlbGVtZW50cyA9IGF3YWl0IG1lcmdlRW50cnkucmVkdWNlKGFzeW5jIChhY2N1bVAsIGl0ZXIpID0+IHtcbiAgICAgICAgY29uc3QgYWNjdW0gPSBhd2FpdCBhY2N1bVA7XG4gICAgICAgIGNvbnN0IG1lcmdlTW9kTmFtZSA9IGl0ZXI/Lk1lcmdlZE1vZE5hbWU/LlswXTtcbiAgICAgICAgaWYgKG1lcmdlTW9kTmFtZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgcmV0dXJuIGFjY3VtO1xuICAgICAgICB9XG4gICAgICAgIGlmICghYWNjdW0uaW5jbHVkZXMobWVyZ2VNb2ROYW1lKSkge1xuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICBhd2FpdCBmcy5zdGF0QXN5bmMocGF0aC5qb2luKG1vZHNQYXRoLCBtZXJnZU1vZE5hbWUpKTtcbiAgICAgICAgICAgIGFjY3VtLnB1c2gobWVyZ2VNb2ROYW1lKTtcbiAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgIGxvZygnZGVidWcnLCAnbWVyZ2VkIG1vZCBpcyBtaXNzaW5nJywgbWVyZ2VNb2ROYW1lKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGFjY3VtO1xuICAgICAgfSwgW10pO1xuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShlbGVtZW50cyk7XG4gICAgfSlcbiAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgIC8vIFdlIGZhaWxlZCB0byBwYXJzZSB0aGUgbWVyZ2UgaW52ZW50b3J5IGZvciB3aGF0ZXZlciByZWFzb24uXG4gICAgICAvLyAgUmF0aGVyIHRoYW4gYmxvY2tpbmcgdGhlIHVzZXIgZnJvbSBtb2RkaW5nIGhpcyBnYW1lIHdlJ3JlXG4gICAgICAvLyAgd2Ugc2ltcGx5IHJldHVybiBhbiBlbXB0eSBhcnJheTsgYnV0IGJlZm9yZSB3ZSBkbyB0aGF0LFxuICAgICAgLy8gIHdlIG5lZWQgdG8gdGVsbCBoaW0gd2Ugd2VyZSB1bmFibGUgdG8gcGFyc2UgdGhlIG1lcmdlZCBpbnZlbnRvcnkuXG4gICAgICBhcGkuc2hvd0Vycm9yTm90aWZpY2F0aW9uKCdJbnZhbGlkIE1lcmdlSW52ZW50b3J5LnhtbCBmaWxlJywgZXJyLFxuICAgICAgICB7IGFsbG93UmVwb3J0OiBmYWxzZSB9KTtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoW10pO1xuICAgIH0pO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0TmFtZXNPZk1lcmdlZE1vZHMoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpKTogQmx1ZWJpcmQ8c3RyaW5nW10+IHtcbiAgLy8gVGhpcyByZXRyaWV2ZXMgYSB1bmlxdWUgbGlzdCBvZiBtb2QgbmFtZXMgaW5jbHVkZWQgaW4gdGhlIG1lcmdlZCBtb2RcbiAgcmV0dXJuIGdldE1lcmdlSW52ZW50b3J5KGFwaSlcbiAgICAudGhlbihhc3luYyBtZXJnZUludmVudG9yeSA9PiB7XG4gICAgICBpZiAobWVyZ2VJbnZlbnRvcnkgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKFtdKTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IHN0YXRlID0gYXBpLmdldFN0YXRlKCk7XG4gICAgICBjb25zdCBkaXNjb3ZlcnkgPSB1dGlsLmdldFNhZmUoc3RhdGUsXG4gICAgICAgIFsnc2V0dGluZ3MnLCAnZ2FtZU1vZGUnLCAnZGlzY292ZXJlZCcsIEdBTUVfSURdLCB1bmRlZmluZWQpO1xuICAgICAgY29uc3QgbW9kc1BhdGggPSBwYXRoLmpvaW4oZGlzY292ZXJ5LnBhdGgsICdNb2RzJyk7XG4gICAgICBjb25zdCBtb2ROYW1lcyA9IGF3YWl0IG1lcmdlSW52ZW50b3J5Lk1lcmdlSW52ZW50b3J5Lk1lcmdlLnJlZHVjZShhc3luYyAoYWNjdW1QLCBpdGVyKSA9PiB7XG4gICAgICAgIGNvbnN0IGFjY3VtID0gYXdhaXQgYWNjdW1QO1xuICAgICAgICBjb25zdCBtZXJnZWRNb2RzID0gaXRlcj8uSW5jbHVkZWRNb2Q7XG4gICAgICAgIGZvciAoY29uc3QgbW9kTmFtZSBvZiBtZXJnZWRNb2RzKSB7XG4gICAgICAgICAgaWYgKG1vZE5hbWUgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgcmV0dXJuIGFjY3VtO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoIWFjY3VtLmluY2x1ZGVzKG1vZE5hbWU/Ll8pKSB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICBhd2FpdCBmcy5zdGF0QXN5bmMocGF0aC5qb2luKG1vZHNQYXRoLCBtb2ROYW1lPy5fKSk7XG4gICAgICAgICAgICAgIGFjY3VtLnB1c2gobW9kTmFtZT8uXyk7XG4gICAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgICAgbG9nKCdkZWJ1ZycsICdtZXJnZWQgbW9kIGlzIG1pc3NpbmcnLCBtb2ROYW1lPy5fKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGFjY3VtO1xuICAgICAgfSwgW10pO1xuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShtb2ROYW1lcyk7XG4gICAgfSk7XG59XG4iXX0=