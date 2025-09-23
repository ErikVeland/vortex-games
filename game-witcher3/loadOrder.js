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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG9hZE9yZGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsibG9hZE9yZGVyLnRzeCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7QUFFQSxrREFBMEI7QUFDMUIsZ0RBQXdCO0FBQ3hCLDJDQUFpRTtBQUVqRSxxQ0FBOEY7QUFDOUYsMEVBQWtEO0FBQ2xELDREQUF1QztBQUV2Qyw2Q0FBc0Q7QUFDdEQsaUNBQXNDO0FBQ3RDLHdFQUFnRDtBQU8vQyxDQUFDO0FBRUYsTUFBTSxZQUFZO0lBV2hCLFlBQVksS0FBaUI7UUFxQnJCLGtCQUFhLEdBQUcsRUFBRSxDQUFDLGtCQUFTLENBQUMsRUFBRSw2QkFBNkIsRUFBRSxDQUFDO1FBcEJyRSxJQUFJLENBQUMsTUFBTSxHQUFHLGdCQUFPLENBQUM7UUFDdEIsSUFBSSxDQUFDLGlCQUFpQixHQUFHLElBQUksQ0FBQztRQUM5QixJQUFJLENBQUMsaUJBQWlCLEdBQUcsSUFBSSxDQUFDO1FBQzlCLElBQUksQ0FBQyxzQkFBc0IsR0FBRyxJQUFJLENBQUM7UUFDbkMsSUFBSSxDQUFDLGlCQUFpQixHQUFHLEdBQUcsRUFBRSxDQUFDLENBQUMsOEJBQUMsdUJBQWEsSUFBQyxpQkFBaUIsRUFBRSxLQUFLLENBQUMsaUJBQWlCLEdBQUksQ0FBQyxDQUFDO1FBQy9GLElBQUksQ0FBQyxrQkFBa0IsR0FBRyxDQUFDLEtBQUssRUFBRSxFQUFFO1lBQ2xDLE9BQU8sQ0FBQyw4QkFBQyxzQkFBWSxJQUFDLFNBQVMsRUFBRSxLQUFLLENBQUMsU0FBUyxFQUFFLElBQUksRUFBRSxLQUFLLENBQUMsSUFBSSxHQUFJLENBQUMsQ0FBQTtRQUN6RSxDQUFDLENBQUM7UUFDRixJQUFJLENBQUMsSUFBSSxHQUFHLEtBQUssQ0FBQyxHQUFHLENBQUM7UUFDdEIsSUFBSSxDQUFDLGdCQUFnQixHQUFHLEtBQUssQ0FBQyxrQkFBa0IsRUFBRSxDQUFDO1FBQ25ELElBQUksQ0FBQyxvQkFBb0IsR0FBRyxJQUFJLENB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LE9BQU8sRUFBRSx5Q0FBeUM7Z0JBQ2xELFNBQVMsRUFBRSxJQUFJO2FBQ2hCLENBQUMsQ0FBQztZQUNILE9BQU87U0FDUjtRQUFDLE9BQU8sR0FBRyxFQUFFO1lBQ1osR0FBRyxDQUFDLHFCQUFxQixDQUFDLDZCQUE2QixFQUFFLEdBQUcsQ0FBQyxDQUFDO1lBQzlELE9BQU87U0FDUjtnQkFBUztZQUNSLEdBQUcsQ0FBQyxtQkFBbUIsQ0FBQyx3Q0FBK0IsQ0FBQyxDQUFDO1NBQzFEO0lBQ0gsQ0FBQztDQUFBO0FBbEVELDBDQWtFQztBQUVELGtCQUFlLFlBQVksQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGlzV2luZG93cyB9IGZyb20gJy4uLy4uLy4uLy4uL3NyYy91dGlsL3BsYXRmb3JtJztcbi8qIGVzbGludC1kaXNhYmxlICovXG5pbXBvcnQgUmVhY3QgZnJvbSAncmVhY3QnO1xuaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgeyBhY3Rpb25zLCBmcywgc2VsZWN0b3JzLCB0eXBlcywgdXRpbCB9IGZyb20gJ3ZvcnRleC1hcGknO1xuXG5pbXBvcnQgeyBBQ1RJVklUWV9JRF9JTVBPUlRJTkdfTE9BRE9SREVSLCBHQU1FX0lELCBMT0NLRURfUFJFRklYLCBVTklfUEFUQ0ggfSBmcm9tICcuL2NvbW1vbic7XG5pbXBvcnQgSW5mb0NvbXBvbmVudCBmcm9tICcuL3ZpZXdzL0luZm9Db21wb25lbnQnO1xuaW1wb3J0IEluaVN0cnVjdHVyZSBmcm9tICcuL2luaVBhcnNlcic7XG5pbXBvcnQgeyBQcmlvcml0eU1hbmFnZXIgfSBmcm9tICcuL3ByaW9yaXR5TWFuYWdlcic7XG5pbXBvcnQgeyBnZXRQZXJzaXN0ZW50TG9hZE9yZGVyIH0gZnJvbSAnLi9taWdyYXRpb25zJztcbmltcG9ydCB7IGZvcmNlUmVmcmVzaCB9IGZyb20gJy4vdXRpbCc7XG5pbXBvcnQgSXRlbVJlbmRlcmVyIGZyb20gJy4vdmlld3MvSXRlbVJlbmRlcmVyJztcbmltcG9ydCB7IElJdGVtUmVuZGVyZXJQcm9wcyB9IGZyb20gJy4vdHlwZXMnO1xuXG5leHBvcnQgaW50ZXJmYWNlIElCYXNlUHJvcHMge1xuICBhcGk6IHR5cGVzLklFeHRlbnNpb25BcGk7XG4gIGdldFByaW9yaXR5TWFuYWdlcjogKCkgPT4gUHJpb3JpdHlNYW5hZ2VyO1xuICBvblRvZ2dsZU1vZHNTdGF0ZTogKGVuYWJsZTogYm9vbGVhbikgPT4gdm9pZDtcbn07XG5cbmNsYXNzIFRXM0xvYWRPcmRlciBpbXBsZW1lbnRzIHR5cGVzLklMb2FkT3JkZXJHYW1lSW5mbyB7XG4gIHB1YmxpYyBnYW1lSWQ6IHN0cmluZztcbiAgcHVibGljIHRvZ2dsZWFibGVFbnRyaWVzPzogYm9vbGVhbiB8IHVuZGVmaW5lZDtcbiAgcHVibGljIGNsZWFyU3RhdGVPblB1cmdlPzogYm9vbGVhbiB8IHVuZGVmaW5lZDtcbiAgcHVibGljIHVzYWdlSW5zdHJ1Y3Rpb25zPzogUmVhY3QuQ29tcG9uZW50VHlwZTx7fT47XG4gIHB1YmxpYyBub0NvbGxlY3Rpb25HZW5lcmF0aW9uPzogYm9vbGVhbiB8IHVuZGVmaW5lZDtcbiAgcHVibGljIGN1c3RvbUl0ZW1SZW5kZXJlcj86IFJlYWN0LkNvbXBvbmVudFR5cGU8eyBjbGFzc05hbWU/OiBzdHJpbmcsIGl0ZW06IElJdGVtUmVuZGVyZXJQcm9wcywgZm9yd2FyZGVkUmVmPzogKHJlZjogYW55KSA9PiB2b2lkIH0+O1xuXG4gIHByaXZhdGUgbUFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaTtcbiAgcHJpdmF0ZSBtUHJpb3JpdHlNYW5hZ2VyOiBQcmlvcml0eU1hbmFnZXI7XG5cbiAgY29uc3RydWN0b3IocHJvcHM6IElCYXNlUHJvcHMpIHtcbiAgICB0aGlzLmdhbWVJZCA9IEdBTUVfSUQ7XG4gICAgdGhpcy5jbGVhclN0YXRlT25QdXJnZSA9IHRydWU7XG4gICAgdGhpcy50b2dnbGVhYmxlRW50cmllcyA9IHRydWU7XG4gICAgdGhpcy5ub0NvbGxlY3Rpb25HZW5lcmF0aW9uID0gdHJ1ZTtcbiAgICB0aGlzLnVzYWdlSW5zdHJ1Y3Rpb25zID0gKCkgPT4gKDxJbmZvQ29tcG9uZW50IG9uVG9nZ2xlTW9kc1N0YXRlPXtwcm9wcy5vblRvZ2dsZU1vZHNTdGF0ZX0gLz4pO1xuICAgIHRoaXMuY3VzdG9tSXRlbVJlbmRlcmVyID0gKHByb3BzKSA9PiB7XG4gICAgICByZXR1cm4gKDxJdGVtUmVuZGVyZXIgY2xhc3NOYW1lPXtwcm9wcy5jbGFzc05hbWV9IGl0ZW09e3Byb3BzLml0ZW19IC8+KVxuICAgIH07XG4gICAgdGhpcy5tQXBpID0gcHJvcHMuYXBpO1xuICAgIHRoaXMubVByaW9yaXR5TWFuYWdlciA9IHByb3BzLmdldFByaW9yaXR5TWFuYWdlcigpO1xuICAgIHRoaXMuZGVzZXJpYWxpemVMb2FkT3JkZXIgPSB0aGlzLmRlc2VyaWFsaXplTG9hZE9yZGVyLmJpbmQodGhpcyk7XG4gICAgdGhpcy5zZXJpYWxpemVMb2FkT3JkZXIgPSB0aGlzLnNlcmlhbGl6ZUxvYWRPcmRlci5iaW5kKHRoaXMpO1xuICAgIHRoaXMudmFsaWRhdGUgPSB0aGlzLnZhbGlkYXRlLmJpbmQodGhpcyk7XG4gIH1cblxuICBwdWJsaWMgYXN5bmMgc2VyaWFsaXplTG9hZE9yZGVyKGxvYWRPcmRlcjogdHlwZXMuTG9hZE9yZGVyKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgcmV0dXJuIEluaVN0cnVjdHVyZS5nZXRJbnN0YW5jZSh0aGlzLm1BcGksICgpID0+IHRoaXMubVByaW9yaXR5TWFuYWdlcilcbiAgICAgIC5zZXRJTklTdHJ1Y3QobG9hZE9yZGVyKTtcbiAgfVxuXG4gIHByaXZhdGUgcmVhZGFibGVOYW1lcyA9IHsgW1VOSV9QQVRDSF06ICdVbmlmaWNhdGlvbi9Db21tdW5pdHkgUGF0Y2gnIH07XG4gIHB1YmxpYyBhc3luYyBkZXNlcmlhbGl6ZUxvYWRPcmRlcigpOiBQcm9taXNlPHR5cGVzLkxvYWRPcmRlcj4ge1xuICAgIGNvbnN0IHN0YXRlID0gdGhpcy5tQXBpLmdldFN0YXRlKCk7XG4gICAgY29uc3QgYWN0aXZlUHJvZmlsZSA9IHNlbGVjdG9ycy5hY3RpdmVQcm9maWxlKHN0YXRlKTtcbiAgICBpZiAoYWN0aXZlUHJvZmlsZT8uaWQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShbXSk7XG4gICAgfVxuICAgIGNvbnN0IGZpbmROYW1lID0gKGVudHJ5OiB7IG5hbWU6IHN0cmluZywgVks/OiBzdHJpbmcgfSkgPT4ge1xuICAgICAgaWYgKHRoaXMucmVhZGFibGVOYW1lcz8uW2VudHJ5Lm5hbWVdICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucmVhZGFibGVOYW1lc1tlbnRyeS5uYW1lXTtcbiAgICAgIH1cblxuICAgICAgaWYgKGVudHJ5LlZLID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgcmV0dXJuIGVudHJ5Lm5hbWU7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHN0YXRlID0gdGhpcy5tQXBpLmdldFN0YXRlKCk7XG4gICAgICBjb25zdCBtb2RzOiB7IFttb2RJZDogc3RyaW5nXTogdHlwZXMuSU1vZCB9ID0gdXRpbC5nZXRTYWZlKHN0YXRlLCBbJ3BlcnNpc3RlbnQnLCAnbW9kcycsIEdBTUVfSURdLCB7fSk7XG4gICAgICBjb25zdCBtb2Q6IHR5cGVzLklNb2QgPSBtb2RzW2VudHJ5LlZLXTtcbiAgICAgIGlmIChtb2QgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICByZXR1cm4gZW50cnkubmFtZTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGAke3V0aWwucmVuZGVyTW9kTmFtZShtb2QpfSAoJHtlbnRyeS5uYW1lfSlgO1xuICAgIH07XG5cbiAgICB0cnkge1xuICAgICAgY29uc3QgdW5zb3J0ZWQ6IHsgW2tleTogc3RyaW5nXTogYW55IH0gPSBhd2FpdCBJbmlTdHJ1Y3R1cmUuZ2V0SW5zdGFuY2UodGhpcy5tQXBpLCAoKSA9PiB0aGlzLm1Qcmlvcml0eU1hbmFnZXIpLnJlYWRTdHJ1Y3R1cmUoKTtcbiAgICAgIGNvbnN0IGVudHJpZXMgPSBPYmplY3Qua2V5cyh1bnNvcnRlZCkuc29ydCgoYSwgYikgPT4gdW5zb3J0ZWRbYV0uUHJpb3JpdHkgLSB1bnNvcnRlZFtiXS5Qcmlvcml0eSkucmVkdWNlKChhY2N1bSwgaXRlciwgaWR4KSA9PiB7XG4gICAgICAgIGNvbnN0IGVudHJ5ID0gdW5zb3J0ZWRbaXRlcl07XG4gICAgICAgIGFjY3VtW2l0ZXIuc3RhcnRzV2l0aChMT0NLRURfUFJFRklYKSA/ICdsb2NrZWQnIDogJ3JlZ3VsYXInXS5wdXNoKHtcbiAgICAgICAgICBpZDogaXRlcixcbiAgICAgICAgICBuYW1lOiBmaW5kTmFtZSh7IG5hbWU6IGl0ZXIsIFZLOiBlbnRyeS5WSyB9KSxcbiAgICAgICAgICBlbmFibGVkOiBlbnRyeS5FbmFibGVkID09PSAnMScsXG4gICAgICAgICAgbW9kSWQ6IGVudHJ5Py5WSyA/PyBpdGVyLFxuICAgICAgICAgIGxvY2tlZDogaXRlci5zdGFydHNXaXRoKExPQ0tFRF9QUkVGSVgpLFxuICAgICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgIHByZWZpeDogaXRlci5zdGFydHNXaXRoKExPQ0tFRF9QUkVGSVgpID8gYWNjdW0ubG9ja2VkLmxlbmd0aCA6IGVudHJ5Py5Qcmlvcml0eSA/PyBpZHggKyAxLFxuICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICAgICAgcmV0dXJuIGFjY3VtO1xuICAgICAgfSwgeyBsb2NrZWQ6IFtdLCByZWd1bGFyOiBbXSB9KTtcbiAgICAgIGNvbnN0IGZpbmFsRW50cmllcyA9IFtdLmNvbmNhdChlbnRyaWVzLmxvY2tlZCwgZW50cmllcy5yZWd1bGFyKTtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoZmluYWxFbnRyaWVzKTtcbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gIH1cblxuICBwdWJsaWMgYXN5bmMgdmFsaWRhdGUocHJldjogdHlwZXMuTG9hZE9yZGVyLCBjdXJyZW50OiB0eXBlcy5Mb2FkT3JkZXIpOiBQcm9taXNlPHR5cGVzLklWYWxpZGF0aW9uUmVzdWx0PiB7XG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh1bmRlZmluZWQpO1xuICB9XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBpbXBvcnRMb2FkT3JkZXIoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpLCBjb2xsZWN0aW9uSWQ6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAvLyBpbXBvcnQgbG9hZCBvcmRlciBmcm9tIGNvbGxlY3Rpb24uXG4gIGNvbnN0IHN0YXRlID0gYXBpLmdldFN0YXRlKCk7XG4gIGFwaS5zZW5kTm90aWZpY2F0aW9uKHtcbiAgICB0eXBlOiAnYWN0aXZpdHknLFxuICAgIGlkOiBBQ1RJVklUWV9JRF9JTVBPUlRJTkdfTE9BRE9SREVSLFxuICAgIHRpdGxlOiAnSW1wb3J0aW5nIExvYWQgT3JkZXInLFxuICAgIG1lc3NhZ2U6ICdQYXJzaW5nIGNvbGxlY3Rpb24gZGF0YScsXG4gICAgYWxsb3dTdXBwcmVzczogZmFsc2UsXG4gICAgbm9EaXNtaXNzOiB0cnVlLFxuICB9KTtcblxuICBjb25zdCBtb2RzOiB7IFttb2RJZDogc3RyaW5nXTogdHlwZXMuSU1vZCB9ID0gdXRpbC5nZXRTYWZlKHN0YXRlLCBbJ3BlcnNpc3RlbnQnLCAnbW9kcycsIEdBTUVfSURdLCB7fSk7XG4gIGNvbnN0IGNvbGxlY3Rpb25Nb2QgPSBtb2RzW2NvbGxlY3Rpb25JZF07XG4gIGlmIChjb2xsZWN0aW9uTW9kPy5pbnN0YWxsYXRpb25QYXRoID09PSB1bmRlZmluZWQpIHtcbiAgICBhcGkuZGlzbWlzc05vdGlmaWNhdGlvbihBQ1RJVklUWV9JRF9JTVBPUlRJTkdfTE9BRE9SREVSKTtcbiAgICBhcGkuc2hvd0Vycm9yTm90aWZpY2F0aW9uKCdjb2xsZWN0aW9uIG1vZCBpcyBtaXNzaW5nJywgY29sbGVjdGlvbklkKTtcbiAgICByZXR1cm47XG4gIH1cblxuICBjb25zdCBzdGFnaW5nRm9sZGVyID0gc2VsZWN0b3JzLmluc3RhbGxQYXRoRm9yR2FtZShzdGF0ZSwgR0FNRV9JRCk7XG4gIHRyeSB7XG4gICAgYXBpLnNlbmROb3RpZmljYXRpb24oe1xuICAgICAgdHlwZTogJ2FjdGl2aXR5JyxcbiAgICAgIGlkOiBBQ1RJVklUWV9JRF9JTVBPUlRJTkdfTE9BRE9SREVSLFxuICAgICAgdGl0bGU6ICdJbXBvcnRpbmcgTG9hZCBPcmRlcicsXG4gICAgICBtZXNzYWdlOiAnRW5zdXJpbmcgbW9kcyBhcmUgZGVwbG95ZWQuLi4nLFxuICAgICAgYWxsb3dTdXBwcmVzczogZmFsc2UsXG4gICAgICBub0Rpc21pc3M6IHRydWUsXG4gICAgfSk7XG4gICAgYXdhaXQgdXRpbC50b1Byb21pc2UoY2IgPT4gYXBpLmV2ZW50cy5lbWl0KCdkZXBsb3ktbW9kcycsIGNiKSk7XG4gICAgY29uc3QgZmlsZURhdGEgPSBhd2FpdCBmcy5yZWFkRmlsZUFzeW5jKHBhdGguam9pbihzdGFnaW5nRm9sZGVyLCBjb2xsZWN0aW9uTW9kLmluc3RhbGxhdGlvblBhdGgsICdjb2xsZWN0aW9uLmpzb24nKSwgeyBlbmNvZGluZzogJ3V0ZjgnIH0pO1xuICAgIGNvbnN0IGNvbGxlY3Rpb24gPSBKU09OLnBhcnNlKGZpbGVEYXRhKTtcbiAgICBjb25zdCBsb2FkT3JkZXIgPSBjb2xsZWN0aW9uPy5sb2FkT3JkZXIgfHwge307XG4gICAgaWYgKE9iamVjdC5rZXlzKGxvYWRPcmRlcikubGVuZ3RoID09PSAwKSB7XG4gICAgICBhcGkuc2VuZE5vdGlmaWNhdGlvbih7XG4gICAgICAgIHR5cGU6ICdzdWNjZXNzJyxcbiAgICAgICAgbWVzc2FnZTogJ0NvbGxlY3Rpb24gZG9lcyBub3QgaW5jbHVkZSBsb2FkIG9yZGVyIHRvIGltcG9ydCcsXG4gICAgICAgIGRpc3BsYXlNUzogMzAwMCxcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IGNvbnZlcnRlZCA9IGdldFBlcnNpc3RlbnRMb2FkT3JkZXIoYXBpLCBsb2FkT3JkZXIpO1xuICAgIGFwaS5zZW5kTm90aWZpY2F0aW9uKHtcbiAgICAgIHR5cGU6ICdhY3Rpdml0eScsXG4gICAgICBpZDogQUNUSVZJVFlfSURfSU1QT1JUSU5HX0xPQURPUkRFUixcbiAgICAgIHRpdGxlOiAnSW1wb3J0aW5nIExvYWQgT3JkZXInLFxuICAgICAgbWVzc2FnZTogJ1dyaXRpbmcgTG9hZCBPcmRlci4uLicsXG4gICAgICBhbGxvd1N1cHByZXNzOiBmYWxzZSxcbiAgICAgIG5vRGlzbWlzczogdHJ1ZSxcbiAgICB9KTtcbiAgICBhd2FpdCBJbmlTdHJ1Y3R1cmUuZ2V0SW5zdGFuY2UoKS5zZXRJTklTdHJ1Y3QoY29udmVydGVkKVxuICAgICAgLnRoZW4oKCkgPT4gZm9yY2VSZWZyZXNoKGFwaSkpO1xuICAgIGFwaS5zZW5kTm90aWZpY2F0aW9uKHtcbiAgICAgIHR5cGU6ICdzdWNjZXNzJyxcbiAgICAgIG1lc3NhZ2U6ICdDb2xsZWN0aW9uIGxvYWQgb3JkZXIgaGFzIGJlZW4gaW1wb3J0ZWQnLFxuICAgICAgZGlzcGxheU1TOiAzMDAwLFxuICAgIH0pO1xuICAgIHJldHVybjtcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgYXBpLnNob3dFcnJvck5vdGlmaWNhdGlvbignRmFpbGVkIHRvIGltcG9ydCBsb2FkIG9yZGVyJywgZXJyKTtcbiAgICByZXR1cm47XG4gIH0gZmluYWxseSB7XG4gICAgYXBpLmRpc21pc3NOb3RpZmljYXRpb24oQUNUSVZJVFlfSURfSU1QT1JUSU5HX0xPQURPUkRFUik7XG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgVFczTG9hZE9yZGVyOyJdfQ==