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
exports.importLoadOrder = void 0;
const react_1 = __importDefault(require("react"));
const path_1 = __importDefault(require("path"));
const vortex_api_1 = require("vortex-api");
const common_1 = require("./common");
const InfoComponent_1 = __importDefault(require("./views/InfoComponent"));
const iniParser_1 = __importDefault(require("./iniParser"));
const migrations_1 = require("./migrations");
const util_1 = require("./util");
const ItemRenderer_1 = __importDefault(require("./views/ItemRenderer"));
;
class TW3LoadOrder {
    constructor(props) {
        this.readableNames = { [common_1.UNI_PATCH]: 'Unification/Community Patch' };
        this.gameId = common_1.GAME_ID;
        this.clearStateOnPurge = true;
        this.toggleableEntries = true;
        this.noCollectionGeneration = true;
        this.usageInstructions = () => (react_1.default.createElement(InfoComponent_1.default, { onToggleModsState: props.onToggleModsState }));
        this.customItemRenderer = (props) => {
            return (react_1.default.createElement(ItemRenderer_1.default, { className: props.className, item: props.item }));
        };
        this.mApi = props.api;
        this.mPriorityManager = props.getPriorityManager();
        this.deserializeLoadOrder = this.deserializeLoadOrder.bind(this);
        this.serializeLoadOrder = this.serializeLoadOrder.bind(this);
        this.validate = this.validate.bind(this);
    }
    serializeLoadOrder(loadOrder) {
        return __awaiter(this, void 0, void 0, function* () {
            return iniParser_1.default.getInstance(this.mApi, () => this.mPriorityManager)
                .setINIStruct(loadOrder);
        });
    }
    deserializeLoadOrder() {
        return __awaiter(this, void 0, void 0, function* () {
            const state = this.mApi.getState();
            const activeProfile = vortex_api_1.selectors.activeProfile(state);
            if ((activeProfile === null || activeProfile === void 0 ? void 0 : activeProfile.id) === undefined) {
                return Promise.resolve([]);
            }
            const findName = (entry) => {
                var _a;
                if (((_a = this.readableNames) === null || _a === void 0 ? void 0 : _a[entry.name]) !== undefined) {
                    return this.readableNames[entry.name];
                }
                if (entry.VK === undefined) {
                    return entry.name;
                }
                const state = this.mApi.getState();
                const mods = vortex_api_1.util.getSafe(state, ['persistent', 'mods', common_1.GAME_ID], {});
                const mod = mods[entry.VK];
                if (mod === undefined) {
                    return entry.name;
                }
                return `${vortex_api_1.util.renderModName(mod)} (${entry.name})`;
            };
            try {
                const unsorted = yield iniParser_1.default.getInstance(this.mApi, () => this.mPriorityManager).readStructure();
                const entries = Object.keys(unsorted).sort((a, b) => unsorted[a].Priority - unsorted[b].Priority).reduce((accum, iter, idx) => {
                    var _a, _b;
                    const entry = unsorted[iter];
                    accum[iter.startsWith(common_1.LOCKED_PREFIX) ? 'locked' : 'regular'].push({
                        id: iter,
                        name: findName({ name: iter, VK: entry.VK }),
                        enabled: entry.Enabled === '1',
                        modId: (_a = entry === null || entry === void 0 ? void 0 : entry.VK) !== null && _a !== void 0 ? _a : iter,
                        locked: iter.startsWith(common_1.LOCKED_PREFIX),
                        data: {
                            prefix: iter.startsWith(common_1.LOCKED_PREFIX) ? accum.locked.length : (_b = entry === null || entry === void 0 ? void 0 : entry.Priority) !== null && _b !== void 0 ? _b : idx + 1,
                        }
                    });
                    return accum;
                }, { locked: [], regular: [] });
                const finalEntries = [].concat(entries.locked, entries.regular);
                return Promise.resolve(finalEntries);
            }
            catch (err) {
                return;
            }
        });
    }
    validate(prev, current) {
        return __awaiter(this, void 0, void 0, function* () {
            return Promise.resolve(undefined);
        });
    }
}
function importLoadOrder(api, collectionId) {
    return __awaiter(this, void 0, void 0, function* () {
        const state = api.getState();
        api.sendNotification({
            type: 'activity',
            id: common_1.ACTIVITY_ID_IMPORTING_LOADORDER,
            title: 'Importing Load Order',
            message: 'Parsing collection data',
            allowSuppress: false,
            noDismiss: true,
        });
        const mods = vortex_api_1.util.getSafe(state, ['persistent', 'mods', common_1.GAME_ID], {});
        const collectionMod = mods[collectionId];
        if ((collectionMod === null || collectionMod === void 0 ? void 0 : collectionMod.installationPath) === undefined) {
            api.dismissNotification(common_1.ACTIVITY_ID_IMPORTING_LOADORDER);
            api.showErrorNotification('collection mod is missing', collectionId);
            return;
        }
        const stagingFolder = vortex_api_1.selectors.installPathForGame(state, common_1.GAME_ID);
        try {
            api.sendNotification({
                type: 'activity',
                id: common_1.ACTIVITY_ID_IMPORTING_LOADORDER,
                title: 'Importing Load Order',
                message: 'Ensuring mods are deployed...',
                allowSuppress: false,
                noDismiss: true,
            });
            yield vortex_api_1.util.toPromise(cb => api.events.emit('deploy-mods', cb));
            const fileData = yield vortex_api_1.fs.readFileAsync(path_1.default.join(stagingFolder, collectionMod.installationPath, 'collection.json'), { encoding: 'utf8' });
            const collection = JSON.parse(fileData);
            const loadOrder = (collection === null || collection === void 0 ? void 0 : collection.loadOrder) || {};
            if (Object.keys(loadOrder).length === 0) {
                api.sendNotification({
                    type: 'success',
                    message: 'Collection does not include load order to import',
                    displayMS: 3000,
                });
                return;
            }
            const converted = (0, migrations_1.getPersistentLoadOrder)(api, loadOrder);
            api.sendNotification({
                type: 'activity',
                id: common_1.ACTIVITY_ID_IMPORTING_LOADORDER,
                title: 'Importing Load Order',
                message: 'Writing Load Order...',
                allowSuppress: false,
                noDismiss: true,
            });
            yield iniParser_1.default.getInstance().setINIStruct(converted)
                .then(() => (0, util_1.forceRefresh)(api));
            api.sendNotification({
                type: 'success',
                message: 'Collection load order has been imported',
                displayMS: 3000,
            });
            return;
        }
        catch (err) {
            api.showErrorNotification('Failed to import load order', err);
            return;
        }
        finally {
            api.dismissNotification(common_1.ACTIVITY_ID_IMPORTING_LOADORDER);
        }
    });
}
exports.importLoadOrder = importLoadOrder;
exports.default = TW3LoadOrder;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG9hZE9yZGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsibG9hZE9yZGVyLnRzeCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7QUFFQSxrREFBMEI7QUFDMUIsZ0RBQXdCO0FBQ3hCLDJDQUFpRTtBQUVqRSxxQ0FBOEY7QUFDOUYsMEVBQWtEO0FBQ2xELDREQUF1QztBQUV2Qyw2Q0FBc0Q7QUFDdEQsaUNBQXNDO0FBQ3RDLHdFQUFnRDtBQU8vQyxDQUFDO0FBRUYsTUFBTSxZQUFZO0lBV2hCLFlBQVksS0FBaUI7UUFxQnJCLGtCQUFhLEdBQUcsRUFBRSxDQUFDLGtCQUFTLENBQUMsRUFBRSw2QkFBNkIsRUFBRSxDQUFDO1FBcEJyRSxJQUFJLENBQUMsTUFBTSxHQUFHLGdCQUFPLENBQUM7UUFDdEIsSUFBSSxDQUFDLGlCQUFpQixHQUFHLElBQUksQ0FBQztRQUM5QixJQUFJLENBQUMsaUJBQWlCLEdBQUcsSUFBSSxDQUFDO1FBQzlCLElBQUksQ0FBQyxzQkFBc0IsR0FBRyxJQUFJLENBQUM7UUFDbkMsSUFBSSxDQUFDLGlCQUFpQixHQUFHLEdBQUcsRUFBRSxDQUFDLENBQUMsOEJBQUMsdUJBQWEsSUFBQyxpQkFBaUIsRUFBRSxLQUFLLENBQUMsaUJBQWlCLEdBQUksQ0FBQyxDQUFDO1FBQy9GLElBQUksQ0FBQyxrQkFBa0IsR0FBRyxDQUFDLEtBQUssRUFBRSxFQUFFO1lBQ2xDLE9BQU8sQ0FBQyw4QkFBQyxzQkFBWSxJQUFDLFNBQVMsRUFBRSxLQUFLLENBQUMsU0FBUyxFQUFFLElBQUksRUFBRSxLQUFLLENBQUMsSUFBSSxHQUFJLENBQUMsQ0FBQTtRQUN6RSxDQUFDLENBQUM7UUFDRixJQUFJLENBQUMsSUFBSSxHQUFHLEtBQUssQ0FBQyxHQUFHLENBQUM7UUFDdEIsSUFBSSxDQUFDLGdCQUFnQixHQUFHLEtBQUssQ0FBQyxrQkFBa0IsRUFBRSxDQUFDO1FBQ25ELElBQUksQ0FBQyxvQkFBb0IsR0FBRyxJQUFJLENB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LE9BQU8sRUFBRSx5Q0FBeUM7Z0JBQ2xELFNBQVMsRUFBRSxJQUFJO2FBQ2hCLENBQUMsQ0FBQztZQUNILE9BQU87U0FDUjtRQUFDLE9BQU8sR0FBRyxFQUFFO1lBQ1osR0FBRyxDQUFDLHFCQUFxQixDQUFDLDZCQUE2QixFQUFFLEdBQUcsQ0FBQyxDQUFDO1lBQzlELE9BQU87U0FDUjtnQkFBUztZQUNSLEdBQUcsQ0FBQyxtQkFBbUIsQ0FBQyx3Q0FBK0IsQ0FBQyxDQUFDO1NBQzFEO0lBQ0gsQ0FBQztDQUFBO0FBbEVELDBDQWtFQztBQUVELGtCQUFlLFlBQVksQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGlzV2luZG93cyB9IGZyb20gJ3ZvcnRleC1hcGknO1xuLyogZXNsaW50LWRpc2FibGUgKi9cbmltcG9ydCBSZWFjdCBmcm9tICdyZWFjdCc7XG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcbmltcG9ydCB7IGFjdGlvbnMsIGZzLCBzZWxlY3RvcnMsIHR5cGVzLCB1dGlsIH0gZnJvbSAndm9ydGV4LWFwaSc7XG5cbmltcG9ydCB7IEFDVElWSVRZX0lEX0lNUE9SVElOR19MT0FET1JERVIsIEdBTUVfSUQsIExPQ0tFRF9QUkVGSVgsIFVOSV9QQVRDSCB9IGZyb20gJy4vY29tbW9uJztcbmltcG9ydCBJbmZvQ29tcG9uZW50IGZyb20gJy4vdmlld3MvSW5mb0NvbXBvbmVudCc7XG5pbXBvcnQgSW5pU3RydWN0dXJlIGZyb20gJy4vaW5pUGFyc2VyJztcbmltcG9ydCB7IFByaW9yaXR5TWFuYWdlciB9IGZyb20gJy4vcHJpb3JpdHlNYW5hZ2VyJztcbmltcG9ydCB7IGdldFBlcnNpc3RlbnRMb2FkT3JkZXIgfSBmcm9tICcuL21pZ3JhdGlvbnMnO1xuaW1wb3J0IHsgZm9yY2VSZWZyZXNoIH0gZnJvbSAnLi91dGlsJztcbmltcG9ydCBJdGVtUmVuZGVyZXIgZnJvbSAnLi92aWV3cy9JdGVtUmVuZGVyZXInO1xuaW1wb3J0IHsgSUl0ZW1SZW5kZXJlclByb3BzIH0gZnJvbSAnLi90eXBlcyc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgSUJhc2VQcm9wcyB7XG4gIGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaTtcbiAgZ2V0UHJpb3JpdHlNYW5hZ2VyOiAoKSA9PiBQcmlvcml0eU1hbmFnZXI7XG4gIG9uVG9nZ2xlTW9kc1N0YXRlOiAoZW5hYmxlOiBib29sZWFuKSA9PiB2b2lkO1xufTtcblxuY2xhc3MgVFczTG9hZE9yZGVyIGltcGxlbWVudHMgdHlwZXMuSUxvYWRPcmRlckdhbWVJbmZvIHtcbiAgcHVibGljIGdhbWVJZDogc3RyaW5nO1xuICBwdWJsaWMgdG9nZ2xlYWJsZUVudHJpZXM/OiBib29sZWFuIHwgdW5kZWZpbmVkO1xuICBwdWJsaWMgY2xlYXJTdGF0ZU9uUHVyZ2U/OiBib29sZWFuIHwgdW5kZWZpbmVkO1xuICBwdWJsaWMgdXNhZ2VJbnN0cnVjdGlvbnM/OiBSZWFjdC5Db21wb25lbnRUeXBlPHt9PjtcbiAgcHVibGljIG5vQ29sbGVjdGlvbkdlbmVyYXRpb24/OiBib29sZWFuIHwgdW5kZWZpbmVkO1xuICBwdWJsaWMgY3VzdG9tSXRlbVJlbmRlcmVyPzogUmVhY3QuQ29tcG9uZW50VHlwZTx7IGNsYXNzTmFtZT86IHN0cmluZywgaXRlbTogSUl0ZW1SZW5kZXJlclByb3BzLCBmb3J3YXJkZWRSZWY/OiAocmVmOiBhbnkpID0+IHZvaWQgfT47XG5cbiAgcHJpdmF0ZSBtQXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpO1xuICBwcml2YXRlIG1Qcmlvcml0eU1hbmFnZXI6IFByaW9yaXR5TWFuYWdlcjtcblxuICBjb25zdHJ1Y3Rvcihwcm9wczogSUJhc2VQcm9wcykge1xuICAgIHRoaXMuZ2FtZUlkID0gR0FNRV9JRDtcbiAgICB0aGlzLmNsZWFyU3RhdGVPblB1cmdlID0gdHJ1ZTtcbiAgICB0aGlzLnRvZ2dsZWFibGVFbnRyaWVzID0gdHJ1ZTtcbiAgICB0aGlzLm5vQ29sbGVjdGlvbkdlbmVyYXRpb24gPSB0cnVlO1xuICAgIHRoaXMudXNhZ2VJbnN0cnVjdGlvbnMgPSAoKSA9PiAoPEluZm9Db21wb25lbnQgb25Ub2dnbGVNb2RzU3RhdGU9e3Byb3BzLm9uVG9nZ2xlTW9kc1N0YXRlfSAvPik7XG4gICAgdGhpcy5jdXN0b21JdGVtUmVuZGVyZXIgPSAocHJvcHMpID0+IHtcbiAgICAgIHJldHVybiAoPEl0ZW1SZW5kZXJlciBjbGFzc05hbWU9e3Byb3BzLmNsYXNzTmFtZX0gaXRlbT17cHJvcHMuaXRlbX0gLz4pXG4gICAgfTtcbiAgICB0aGlzLm1BcGkgPSBwcm9wcy5hcGk7XG4gICAgdGhpcy5tUHJpb3JpdHlNYW5hZ2VyID0gcHJvcHMuZ2V0UHJpb3JpdHlNYW5hZ2VyKCk7XG4gICAgdGhpcy5kZXNlcmlhbGl6ZUxvYWRPcmRlciA9IHRoaXMuZGVzZXJpYWxpemVMb2FkT3JkZXIuYmluZCh0aGlzKTtcbiAgICB0aGlzLnNlcmlhbGl6ZUxvYWRPcmRlciA9IHRoaXMuc2VyaWFsaXplTG9hZE9yZGVyLmJpbmQodGhpcyk7XG4gICAgdGhpcy52YWxpZGF0ZSA9IHRoaXMudmFsaWRhdGUuYmluZCh0aGlzKTtcbiAgfVxuXG4gIHB1YmxpYyBhc3luYyBzZXJpYWxpemVMb2FkT3JkZXIobG9hZE9yZGVyOiB0eXBlcy5Mb2FkT3JkZXIpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICByZXR1cm4gSW5pU3RydWN0dXJlLmdldEluc3RhbmNlKHRoaXMubUFwaSwgKCkgPT4gdGhpcy5tUHJpb3JpdHlNYW5hZ2VyKVxuICAgICAgLnNldElOSVN0cnVjdChsb2FkT3JkZXIpO1xuICB9XG5cbiAgcHJpdmF0ZSByZWFkYWJsZU5hbWVzID0geyBbVU5JX1BBVENIXTogJ1VuaWZpY2F0aW9uL0NvbW11bml0eSBQYXRjaCcgfTtcbiAgcHVibGljIGFzeW5jIGRlc2VyaWFsaXplTG9hZE9yZGVyKCk6IFByb21pc2U8dHlwZXMuTG9hZE9yZGVyPiB7XG4gICAgY29uc3Qgc3RhdGUgPSB0aGlzLm1BcGkuZ2V0U3RhdGUoKTtcbiAgICBjb25zdCBhY3RpdmVQcm9maWxlID0gc2VsZWN0b3JzLmFjdGl2ZVByb2ZpbGUoc3RhdGUpO1xuICAgIGlmIChhY3RpdmVQcm9maWxlPy5pZCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKFtdKTtcbiAgICB9XG4gICAgY29uc3QgZmluZE5hbWUgPSAoZW50cnk6IHsgbmFtZTogc3RyaW5nLCBWSz86IHN0cmluZyB9KSA9PiB7XG4gICAgICBpZiAodGhpcy5yZWFkYWJsZU5hbWVzPy5bZW50cnkubmFtZV0gIT09IHVuZGVmaW5lZCkge1xuICAgICAgICByZXR1cm4gdGhpcy5yZWFkYWJsZU5hbWVzW2VudHJ5Lm5hbWVdO1xuICAgICAgfVxuXG4gICAgICBpZiAoZW50cnkuVksgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICByZXR1cm4gZW50cnkubmFtZTtcbiAgICAgIH1cblxuICAgICAgY29uc3Qgc3RhdGUgPSB0aGlzLm1BcGkuZ2V0U3RhdGUoKTtcbiAgICAgIGNvbnN0IG1vZHM6IHsgW21vZElkOiBzdHJpbmddOiB0eXBlcy5JTW9kIH0gPSB1dGlsLmdldFNhZmUoc3RhdGUsIFsncGVyc2lzdGVudCcsICdtb2RzJywgR0FNRV9JRF0sIHt9KTtcbiAgICAgIGNvbnN0IG1vZDogdHlwZXMuSU1vZCA9IG1vZHNbZW50cnkuVktdO1xuICAgICAgaWYgKG1vZCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHJldHVybiBlbnRyeS5uYW1lO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gYCR7dXRpbC5yZW5kZXJNb2ROYW1lKG1vZCl9ICgke2VudHJ5Lm5hbWV9KWA7XG4gICAgfTtcblxuICAgIHRyeSB7XG4gICAgICBjb25zdCB1bnNvcnRlZDogeyBba2V5OiBzdHJpbmddOiBhbnkgfSA9IGF3YWl0IEluaVN0cnVjdHVyZS5nZXRJbnN0YW5jZSh0aGlzLm1BcGksICgpID0+IHRoaXMubVByaW9yaXR5TWFuYWdlcikucmVhZFN0cnVjdHVyZSgpO1xuICAgICAgY29uc3QgZW50cmllcyA9IE9iamVjdC5rZXlzKHVuc29ydGVkKS5zb3J0KChhLCBiKSA9PiB1bnNvcnRlZFthXS5Qcmlvcml0eSAtIHVuc29ydGVkW2JdLlByaW9yaXR5KS5yZWR1Y2UoKGFjY3VtLCBpdGVyLCBpZHgpID0+IHtcbiAgICAgICAgY29uc3QgZW50cnkgPSB1bnNvcnRlZFtpdGVyXTtcbiAgICAgICAgYWNjdW1baXRlci5zdGFydHNXaXRoKExPQ0tFRF9QUkVGSVgpID8gJ2xvY2tlZCcgOiAncmVndWxhciddLnB1c2goe1xuICAgICAgICAgIGlkOiBpdGVyLFxuICAgICAgICAgIG5hbWU6IGZpbmROYW1lKHsgbmFtZTogaXRlciwgVks6IGVudHJ5LlZLIH0pLFxuICAgICAgICAgIGVuYWJsZWQ6IGVudHJ5LkVuYWJsZWQgPT09ICcxJyxcbiAgICAgICAgICBtb2RJZDogZW50cnk/LlZLID8/IGl0ZXIsXG4gICAgICAgICAgbG9ja2VkOiBpdGVyLnN0YXJ0c1dpdGgoTE9DS0VEX1BSRUZJWCksXG4gICAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgcHJlZml4OiBpdGVyLnN0YXJ0c1dpdGgoTE9DS0VEX1BSRUZJWCkgPyBhY2N1bS5sb2NrZWQubGVuZ3RoIDogZW50cnk/LlByaW9yaXR5ID8/IGlkeCArIDEsXG4gICAgICAgICAgfVxuICAgICAgICB9KVxuICAgICAgICByZXR1cm4gYWNjdW07XG4gICAgICB9LCB7IGxvY2tlZDogW10sIHJlZ3VsYXI6IFtdIH0pO1xuICAgICAgY29uc3QgZmluYWxFbnRyaWVzID0gW10uY29uY2F0KGVudHJpZXMubG9ja2VkLCBlbnRyaWVzLnJlZ3VsYXIpO1xuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShmaW5hbEVudHJpZXMpO1xuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgfVxuXG4gIHB1YmxpYyBhc3luYyB2YWxpZGF0ZShwcmV2OiB0eXBlcy5Mb2FkT3JkZXIsIGN1cnJlbnQ6IHR5cGVzLkxvYWRPcmRlcik6IFByb21pc2U8dHlwZXMuSVZhbGlkYXRpb25SZXN1bHQ+IHtcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHVuZGVmaW5lZCk7XG4gIH1cbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGltcG9ydExvYWRPcmRlcihhcGk6IHR5cGVzLklFeHRlbnNpb25BcGksIGNvbGxlY3Rpb25JZDogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gIC8vIGltcG9ydCBsb2FkIG9yZGVyIGZyb20gY29sbGVjdGlvbi5cbiAgY29uc3Qgc3RhdGUgPSBhcGkuZ2V0U3RhdGUoKTtcbiAgYXBpLnNlbmROb3RpZmljYXRpb24oe1xuICAgIHR5cGU6ICdhY3Rpdml0eScsXG4gICAgaWQ6IEFDVElWSVRZX0lEX0lNUE9SVElOR19MT0FET1JERVIsXG4gICAgdGl0bGU6ICdJbXBvcnRpbmcgTG9hZCBPcmRlcicsXG4gICAgbWVzc2FnZTogJ1BhcnNpbmcgY29sbGVjdGlvbiBkYXRhJyxcbiAgICBhbGxvd1N1cHByZXNzOiBmYWxzZSxcbiAgICBub0Rpc21pc3M6IHRydWUsXG4gIH0pO1xuXG4gIGNvbnN0IG1vZHM6IHsgW21vZElkOiBzdHJpbmddOiB0eXBlcy5JTW9kIH0gPSB1dGlsLmdldFNhZmUoc3RhdGUsIFsncGVyc2lzdGVudCcsICdtb2RzJywgR0FNRV9JRF0sIHt9KTtcbiAgY29uc3QgY29sbGVjdGlvbk1vZCA9IG1vZHNbY29sbGVjdGlvbklkXTtcbiAgaWYgKGNvbGxlY3Rpb25Nb2Q/Lmluc3RhbGxhdGlvblBhdGggPT09IHVuZGVmaW5lZCkge1xuICAgIGFwaS5kaXNtaXNzTm90aWZpY2F0aW9uKEFDVElWSVRZX0lEX0lNUE9SVElOR19MT0FET1JERVIpO1xuICAgIGFwaS5zaG93RXJyb3JOb3RpZmljYXRpb24oJ2NvbGxlY3Rpb24gbW9kIGlzIG1pc3NpbmcnLCBjb2xsZWN0aW9uSWQpO1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGNvbnN0IHN0YWdpbmdGb2xkZXIgPSBzZWxlY3RvcnMuaW5zdGFsbFBhdGhGb3JHYW1lKHN0YXRlLCBHQU1FX0lEKTtcbiAgdHJ5IHtcbiAgICBhcGkuc2VuZE5vdGlmaWNhdGlvbih7XG4gICAgICB0eXBlOiAnYWN0aXZpdHknLFxuICAgICAgaWQ6IEFDVElWSVRZX0lEX0lNUE9SVElOR19MT0FET1JERVIsXG4gICAgICB0aXRsZTogJ0ltcG9ydGluZyBMb2FkIE9yZGVyJyxcbiAgICAgIG1lc3NhZ2U6ICdFbnN1cmluZyBtb2RzIGFyZSBkZXBsb3llZC4uLicsXG4gICAgICBhbGxvd1N1cHByZXNzOiBmYWxzZSxcbiAgICAgIG5vRGlzbWlzczogdHJ1ZSxcbiAgICB9KTtcbiAgICBhd2FpdCB1dGlsLnRvUHJvbWlzZShjYiA9PiBhcGkuZXZlbnRzLmVtaXQoJ2RlcGxveS1tb2RzJywgY2IpKTtcbiAgICBjb25zdCBmaWxlRGF0YSA9IGF3YWl0IGZzLnJlYWRGaWxlQXN5bmMocGF0aC5qb2luKHN0YWdpbmdGb2xkZXIsIGNvbGxlY3Rpb25Nb2QuaW5zdGFsbGF0aW9uUGF0aCwgJ2NvbGxlY3Rpb24uanNvbicpLCB7IGVuY29kaW5nOiAndXRmOCcgfSk7XG4gICAgY29uc3QgY29sbGVjdGlvbiA9IEpTT04ucGFyc2UoZmlsZURhdGEpO1xuICAgIGNvbnN0IGxvYWRPcmRlciA9IGNvbGxlY3Rpb24/LmxvYWRPcmRlciB8fCB7fTtcbiAgICBpZiAoT2JqZWN0LmtleXMobG9hZE9yZGVyKS5sZW5ndGggPT09IDApIHtcbiAgICAgIGFwaS5zZW5kTm90aWZpY2F0aW9uKHtcbiAgICAgICAgdHlwZTogJ3N1Y2Nlc3MnLFxuICAgICAgICBtZXNzYWdlOiAnQ29sbGVjdGlvbiBkb2VzIG5vdCBpbmNsdWRlIGxvYWQgb3JkZXIgdG8gaW1wb3J0JyxcbiAgICAgICAgZGlzcGxheU1TOiAzMDAwLFxuICAgICAgfSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgY29udmVydGVkID0gZ2V0UGVyc2lzdGVudExvYWRPcmRlcihhcGksIGxvYWRPcmRlcik7XG4gICAgYXBpLnNlbmROb3RpZmljYXRpb24oe1xuICAgICAgdHlwZTogJ2FjdGl2aXR5JyxcbiAgICAgIGlkOiBBQ1RJVklUWV9JRF9JTVBPUlRJTkdfTE9BRE9SREVSLFxuICAgICAgdGl0bGU6ICdJbXBvcnRpbmcgTG9hZCBPcmRlcicsXG4gICAgICBtZXNzYWdlOiAnV3JpdGluZyBMb2FkIE9yZGVyLi4uJyxcbiAgICAgIGFsbG93U3VwcHJlc3M6IGZhbHNlLFxuICAgICAgbm9EaXNtaXNzOiB0cnVlLFxuICAgIH0pO1xuICAgIGF3YWl0IEluaVN0cnVjdHVyZS5nZXRJbnN0YW5jZSgpLnNldElOSVN0cnVjdChjb252ZXJ0ZWQpXG4gICAgICAudGhlbigoKSA9PiBmb3JjZVJlZnJlc2goYXBpKSk7XG4gICAgYXBpLnNlbmROb3RpZmljYXRpb24oe1xuICAgICAgdHlwZTogJ3N1Y2Nlc3MnLFxuICAgICAgbWVzc2FnZTogJ0NvbGxlY3Rpb24gbG9hZCBvcmRlciBoYXMgYmVlbiBpbXBvcnRlZCcsXG4gICAgICBkaXNwbGF5TVM6IDMwMDAsXG4gICAgfSk7XG4gICAgcmV0dXJuO1xuICB9IGNhdGNoIChlcnIpIHtcbiAgICBhcGkuc2hvd0Vycm9yTm90aWZpY2F0aW9uKCdGYWlsZWQgdG8gaW1wb3J0IGxvYWQgb3JkZXInLCBlcnIpO1xuICAgIHJldHVybjtcbiAgfSBmaW5hbGx5IHtcbiAgICBhcGkuZGlzbWlzc05vdGlmaWNhdGlvbihBQ1RJVklUWV9JRF9JTVBPUlRJTkdfTE9BRE9SREVSKTtcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBUVzNMb2FkT3JkZXI7Il19