const { isWindows } = require('vortex-api');
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PriorityManager = void 0;
const vortex_api_1 = require("vortex-api");
const common_1 = require("./common");
const migrations_1 = require("./migrations");
class PriorityManager {
    constructor(api, priorityType) {
        this.resetMaxPriority = (min) => {
            const props = this.genProps(min);
            if (props === undefined) {
                this.mMaxPriority = 0;
                return;
            }
            this.mMaxPriority = this.getMaxPriority(props);
        };
        this.getPriority = (loadOrder, item) => {
            var _a, _b, _c, _d;
            if (item === undefined) {
                return ++this.mMaxPriority;
            }
            const minPriority = Object.keys(loadOrder).filter(key => { var _a; return (_a = loadOrder[key]) === null || _a === void 0 ? void 0 : _a.locked; }).length + 1;
            const itemIdx = loadOrder.findIndex(x => (x === null || x === void 0 ? void 0 : x.id) === item.id);
            if (itemIdx !== -1) {
                if (this.mPriorityType === 'position-based') {
                    const position = itemIdx + 1;
                    return (position > minPriority)
                        ? position : ++this.mMaxPriority;
                }
                else {
                    const prefixVal = (_c = (_b = (_a = loadOrder[itemIdx]) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.prefix) !== null && _c !== void 0 ? _c : (_d = loadOrder[itemIdx]) === null || _d === void 0 ? void 0 : _d['prefix'];
                    const intVal = prefixVal !== undefined
                        ? parseInt(prefixVal, 10)
                        : itemIdx;
                    const posVal = itemIdx;
                    if (posVal !== intVal && intVal > minPriority) {
                        return intVal;
                    }
                    else {
                        return (posVal > minPriority)
                            ? posVal : ++this.mMaxPriority;
                    }
                }
            }
            return ++this.mMaxPriority;
        };
        this.genProps = (min) => {
            const state = this.mApi.getState();
            const lastProfId = vortex_api_1.selectors.lastActiveProfileForGame(state, common_1.GAME_ID);
            if (lastProfId === undefined) {
                return undefined;
            }
            const profile = vortex_api_1.selectors.profileById(state, lastProfId);
            if (profile === undefined) {
                return undefined;
            }
            const loadOrder = (0, migrations_1.getPersistentLoadOrder)(this.mApi);
            const lockedEntries = Object.keys(loadOrder).filter(key => { var _a; return (_a = loadOrder[key]) === null || _a === void 0 ? void 0 : _a.locked; });
            const minPriority = (min) ? min : lockedEntries.length;
            return { state, profile, loadOrder, minPriority };
        };
        this.getMaxPriority = (props) => {
            const { loadOrder, minPriority } = props;
            return Object.keys(loadOrder).reduce((prev, key) => {
                var _a, _b, _c, _d;
                const prefixVal = (_c = (_b = (_a = loadOrder[key]) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.prefix) !== null && _c !== void 0 ? _c : (_d = loadOrder[key]) === null || _d === void 0 ? void 0 : _d.prefix;
                const intVal = prefixVal !== undefined
                    ? parseInt(loadOrder[key].prefix, 10)
                    : loadOrder[key].pos;
                const posVal = loadOrder[key].pos;
                if (posVal !== intVal) {
                    prev = (intVal > prev)
                        ? intVal : prev;
                }
                else {
                    prev = (posVal > prev)
                        ? posVal : prev;
                }
                return prev;
            }, minPriority);
        };
        this.mApi = api;
        this.mPriorityType = priorityType;
        this.resetMaxPriority();
    }
    set priorityType(type) {
        this.mPriorityType = type;
    }
    get priorityType() {
        return this.mPriorityType;
    }
}
exports.PriorityManager = PriorityManager;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJpb3JpdHlNYW5hZ2VyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsicHJpb3JpdHlNYW5hZ2VyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUNBLDJDQUE4QztBQUU5QyxxQ0FBbUM7QUFDbkMsNkNBQXNEO0FBZXRELE1BQWEsZUFBZTtJQUsxQixZQUFZLEdBQXdCLEVBQUUsWUFBMEI7UUFjekQscUJBQWdCLEdBQUcsQ0FBQyxHQUFZLEVBQUUsRUFBRTtZQUN6QyxNQUFNLEtBQUssR0FBVyxJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQ3pDLElBQUksS0FBSyxLQUFLLFNBQVMsRUFBRTtnQkFDdkIsSUFBSSxDQUFDLFlBQVksR0FBRyxDQUFDLENBQUM7Z0JBQ3RCLE9BQU87YUFDUjtZQUNELElBQUksQ0FBQyxZQUFZLEdBQUcsSUFBSSxDQUFDLGNBQWMsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUNqRCxDQUFDLENBQUE7UUFFTSxnQkFBVyxHQUFHLENBQUMsU0FBMEIsRUFBRSxJQUEyQixFQUFFLEVBQUU7O1lBQy9FLElBQUksSUFBSSxLQUFLLFNBQVMsRUFBRTtnQkFFdEIsT0FBTyxFQUFFLElBQUksQ0FBQyxZQUFZLENBQUM7YUFDNUI7WUFDRCxNQUFNLFdBQVcsR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsRUFBRSxXQUFDLE9BQUEsTUFBQSxTQUFTLENBQUMsR0FBRyxDQUFDLDBDQUFFLE1BQU0sQ0FBQSxFQUFBLENBQUMsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDO1lBRTVGLE1BQU0sT0FBTyxHQUFHLFNBQVMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFBLENBQUMsYUFBRCxDQUFDLHVCQUFELENBQUMsQ0FBRSxFQUFFLE1BQUssSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBQzVELElBQUksT0FBTyxLQUFLLENBQUMsQ0FBQyxFQUFFO2dCQUNsQixJQUFJLElBQUksQ0FBQyxhQUFhLEtBQUssZ0JBQWdCLEVBQUU7b0JBQzNDLE1BQU0sUUFBUSxHQUFHLE9BQU8sR0FBRyxDQUFDLENBQUM7b0JBQzdCLE9BQU8sQ0FBQyxRQUFRLEdBQUcsV0FBVyxDQUFDO3dCQUM3QixDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxZQUFZLENBQUM7aUJBQ3BDO3FCQUFNO29CQUNMLE1BQU0sU0FBUyxHQUFHLE1BQUEsTUFBQSxNQUFBLFNBQVMsQ0FBQyxPQUFPLENBQUMsMENBQUUsSUFBSSwwQ0FBRSxNQUFNLG1DQUFJLE1BQUEsU0FBUyxDQUFDLE9BQU8sQ0FBQywwQ0FBRyxRQUFRLENBQUMsQ0FBQztvQkFDckYsTUFBTSxNQUFNLEdBQUcsU0FBUyxLQUFLLFNBQVM7d0JBQ3BDLENBQUMsQ0FBQyxRQUFRLENBQUMsU0FBUyxFQUFFLEVBQUUsQ0FBQzt3QkFDekIsQ0FBQyxDQUFDLE9BQU8sQ0FBQztvQkFDWixNQUFNLE1BQU0sR0FBRyxPQUFPLENBQUM7b0JBQ3ZCLElBQUksTUFBTSxLQUFLLE1BQU0sSUFBSSxNQUFNLEdBQUcsV0FBVyxFQUFFO3dCQUM3QyxPQUFPLE1BQU0sQ0FBQztxQkFDZjt5QkFBTTt3QkFDTCxPQUFPLENBQUMsTUFBTSxHQUFHLFdBQVcsQ0FBQzs0QkFDM0IsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsWUFBWSxDQUFDO3FCQUNsQztpQkFDRjthQUNGO1lBRUQsT0FBTyxFQUFFLElBQUksQ0FBQyxZQUFZLENBQUM7UUFDN0IsQ0FBQyxDQUFBO1FBRU8sYUFBUSxHQUFHLENBQUMsR0FBWSxFQUFVLEVBQUU7WUFDMUMsTUFBTSxLQUFLLEdBQWlCLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUM7WUFDakQsTUFBTSxVQUFVLEdBQUcsc0JBQVMsQ0FBQyx3QkFBd0IsQ0FBQyxLQUFLLEVBQUUsZ0JBQU8sQ0FBQyxDQUFDO1lBQ3RFLElBQUksVUFBVSxLQUFLLFNBQVMsRUFBRTtnQkFDNUIsT0FBTyxTQUFTLENBQUM7YUFDbEI7WUFDRCxNQUFNLE9BQU8sR0FBRyxzQkFBUyxDQUFDLFdBQVcsQ0FBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLENBQUM7WUFDekQsSUFBSSxPQUFPLEtBQUssU0FBUyxFQUFFO2dCQUN6QixPQUFPLFNBQVMsQ0FBQzthQUNsQjtZQUVELE1BQU0sU0FBUyxHQUFvQixJQUFBLG1DQUFzQixFQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUVyRSxNQUFNLGFBQWEsR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsRUFBRSxXQUFDLE9BQUEsTUFBQSxTQUFTLENBQUMsR0FBRyxDQUFDLDBDQUFFLE1BQU0sQ0FBQSxFQUFBLENBQUMsQ0FBQztZQUNuRixNQUFNLFdBQVcsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLGFBQWEsQ0FBQyxNQUFNLENBQUM7WUFDdkQsT0FBTyxFQUFFLEtBQUssRUFBRSxPQUFPLEVBQUUsU0FBUyxFQUFFLFdBQVcsRUFBRSxDQUFDO1FBQ3BELENBQUMsQ0FBQTtRQUVNLG1CQUFjLEdBQUcsQ0FBQyxLQUFhLEVBQUUsRUFBRTtZQUN4QyxNQUFNLEVBQUUsU0FBUyxFQUFFLFdBQVcsRUFBRSxHQUFHLEtBQUssQ0FBQztZQUN6QyxPQUFPLE1BQU0sQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsSUFBSSxFQUFFLEdBQUcsRUFBRSxFQUFFOztnQkFDakQsTUFBTSxTQUFTLEdBQUcsTUFBQSxNQUFBLE1BQUEsU0FBUyxDQUFDLEdBQUcsQ0FBQywwQ0FBRSxJQUFJLDBDQUFFLE1BQU0sbUNBQUksTUFBQSxTQUFTLENBQUMsR0FBRyxDQUFDLDBDQUFFLE1BQU0sQ0FBQztnQkFDekUsTUFBTSxNQUFNLEdBQUcsU0FBUyxLQUFLLFNBQVM7b0JBQ3BDLENBQUMsQ0FBQyxRQUFRLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUM7b0JBQ3JDLENBQUMsQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDO2dCQUN2QixNQUFNLE1BQU0sR0FBRyxTQUFTLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDO2dCQUNsQyxJQUFJLE1BQU0sS0FBSyxNQUFNLEVBQUU7b0JBQ3JCLElBQUksR0FBRyxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUM7d0JBQ3BCLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQztpQkFDbkI7cUJBQU07b0JBQ0wsSUFBSSxHQUFHLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQzt3QkFDcEIsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO2lCQUNuQjtnQkFDRCxPQUFPLElBQUksQ0FBQztZQUNkLENBQUMsRUFBRSxXQUFXLENBQUMsQ0FBQztRQUNsQixDQUFDLENBQUE7UUF4RkMsSUFBSSxDQUFDLElBQUksR0FBRyxHQUFHLENBQUM7UUFDaEIsSUFBSSxDQUFDLGFBQWEsR0FBRyxZQUFZLENBQUM7UUFDbEMsSUFBSSxDQUFDLGdCQUFnQixFQUFFLENBQUM7SUFDMUIsQ0FBQztJQUVELElBQUksWUFBWSxDQUFDLElBQWtCO1FBQ2pDLElBQUksQ0FBQyxhQUFhLEdBQUcsSUFBSSxDQUFDO0lBQzVCLENBQUM7SUFFRCxJQUFJLFlBQVk7UUFDZCxPQUFPLElBQUksQ0FBQyxhQUFhLENBQUM7SUFDNUIsQ0FBQztDQThFRjtBQS9GRCwwQ0ErRkMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiBlc2xpbnQtZGlzYWJsZSAqL1xuaW1wb3J0IHsgc2VsZWN0b3JzLCB0eXBlcyB9IGZyb20gJ3ZvcnRleC1hcGknO1xuXG5pbXBvcnQgeyBHQU1FX0lEIH0gZnJvbSAnLi9jb21tb24nO1xuaW1wb3J0IHsgZ2V0UGVyc2lzdGVudExvYWRPcmRlciB9IGZyb20gJy4vbWlncmF0aW9ucyc7XG5cbmV4cG9ydCB0eXBlIFByaW9yaXR5VHlwZSA9ICdwb3NpdGlvbi1iYXNlZCcgfCAncHJlZml4LWJhc2VkJztcblxuZXhwb3J0IGludGVyZmFjZSBJT2Zmc2V0TWFwIHtcbiAgW29mZnNldDogbnVtYmVyXTogbnVtYmVyO1xufVxuXG5pbnRlcmZhY2UgSVByb3BzIHtcbiAgc3RhdGU6IHR5cGVzLklTdGF0ZTtcbiAgcHJvZmlsZTogdHlwZXMuSVByb2ZpbGU7XG4gIGxvYWRPcmRlcjogdHlwZXMuTG9hZE9yZGVyO1xuICBtaW5Qcmlvcml0eTogbnVtYmVyO1xufVxuXG5leHBvcnQgY2xhc3MgUHJpb3JpdHlNYW5hZ2VyIHtcbiAgcHJpdmF0ZSBtQXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpO1xuICBwcml2YXRlIG1Qcmlvcml0eVR5cGU6IFByaW9yaXR5VHlwZTtcbiAgcHJpdmF0ZSBtTWF4UHJpb3JpdHk6IG51bWJlcjtcblxuICBjb25zdHJ1Y3RvcihhcGk6IHR5cGVzLklFeHRlbnNpb25BcGksIHByaW9yaXR5VHlwZTogUHJpb3JpdHlUeXBlKSB7XG4gICAgdGhpcy5tQXBpID0gYXBpO1xuICAgIHRoaXMubVByaW9yaXR5VHlwZSA9IHByaW9yaXR5VHlwZTtcbiAgICB0aGlzLnJlc2V0TWF4UHJpb3JpdHkoKTtcbiAgfVxuXG4gIHNldCBwcmlvcml0eVR5cGUodHlwZTogUHJpb3JpdHlUeXBlKSB7XG4gICAgdGhpcy5tUHJpb3JpdHlUeXBlID0gdHlwZTtcbiAgfVxuXG4gIGdldCBwcmlvcml0eVR5cGUoKSB7XG4gICAgcmV0dXJuIHRoaXMubVByaW9yaXR5VHlwZTtcbiAgfVxuXG4gIHB1YmxpYyByZXNldE1heFByaW9yaXR5ID0gKG1pbj86IG51bWJlcikgPT4ge1xuICAgIGNvbnN0IHByb3BzOiBJUHJvcHMgPSB0aGlzLmdlblByb3BzKG1pbik7XG4gICAgaWYgKHByb3BzID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHRoaXMubU1heFByaW9yaXR5ID0gMDtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdGhpcy5tTWF4UHJpb3JpdHkgPSB0aGlzLmdldE1heFByaW9yaXR5KHByb3BzKTtcbiAgfVxuXG4gIHB1YmxpYyBnZXRQcmlvcml0eSA9IChsb2FkT3JkZXI6IHR5cGVzLkxvYWRPcmRlciwgaXRlbTogdHlwZXMuSUxvYWRPcmRlckVudHJ5KSA9PiB7XG4gICAgaWYgKGl0ZW0gPT09IHVuZGVmaW5lZCkge1xuICAgICAgLy8gU2VuZCBpdCBvZmYgdG8gdGhlIGVuZC5cbiAgICAgIHJldHVybiArK3RoaXMubU1heFByaW9yaXR5O1xuICAgIH1cbiAgICBjb25zdCBtaW5Qcmlvcml0eSA9IE9iamVjdC5rZXlzKGxvYWRPcmRlcikuZmlsdGVyKGtleSA9PiBsb2FkT3JkZXJba2V5XT8ubG9ja2VkKS5sZW5ndGggKyAxO1xuXG4gICAgY29uc3QgaXRlbUlkeCA9IGxvYWRPcmRlci5maW5kSW5kZXgoeCA9PiB4Py5pZCA9PT0gaXRlbS5pZCk7XG4gICAgaWYgKGl0ZW1JZHggIT09IC0xKSB7XG4gICAgICBpZiAodGhpcy5tUHJpb3JpdHlUeXBlID09PSAncG9zaXRpb24tYmFzZWQnKSB7XG4gICAgICAgIGNvbnN0IHBvc2l0aW9uID0gaXRlbUlkeCArIDE7XG4gICAgICAgIHJldHVybiAocG9zaXRpb24gPiBtaW5Qcmlvcml0eSlcbiAgICAgICAgICA/IHBvc2l0aW9uIDogKyt0aGlzLm1NYXhQcmlvcml0eTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnN0IHByZWZpeFZhbCA9IGxvYWRPcmRlcltpdGVtSWR4XT8uZGF0YT8ucHJlZml4ID8/IGxvYWRPcmRlcltpdGVtSWR4XT8uWydwcmVmaXgnXTtcbiAgICAgICAgY29uc3QgaW50VmFsID0gcHJlZml4VmFsICE9PSB1bmRlZmluZWRcbiAgICAgICAgICA/IHBhcnNlSW50KHByZWZpeFZhbCwgMTApXG4gICAgICAgICAgOiBpdGVtSWR4O1xuICAgICAgICBjb25zdCBwb3NWYWwgPSBpdGVtSWR4O1xuICAgICAgICBpZiAocG9zVmFsICE9PSBpbnRWYWwgJiYgaW50VmFsID4gbWluUHJpb3JpdHkpIHtcbiAgICAgICAgICByZXR1cm4gaW50VmFsO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiAocG9zVmFsID4gbWluUHJpb3JpdHkpXG4gICAgICAgICAgICA/IHBvc1ZhbCA6ICsrdGhpcy5tTWF4UHJpb3JpdHk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gKyt0aGlzLm1NYXhQcmlvcml0eTtcbiAgfVxuXG4gIHByaXZhdGUgZ2VuUHJvcHMgPSAobWluPzogbnVtYmVyKTogSVByb3BzID0+IHtcbiAgICBjb25zdCBzdGF0ZTogdHlwZXMuSVN0YXRlID0gdGhpcy5tQXBpLmdldFN0YXRlKCk7XG4gICAgY29uc3QgbGFzdFByb2ZJZCA9IHNlbGVjdG9ycy5sYXN0QWN0aXZlUHJvZmlsZUZvckdhbWUoc3RhdGUsIEdBTUVfSUQpO1xuICAgIGlmIChsYXN0UHJvZklkID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfVxuICAgIGNvbnN0IHByb2ZpbGUgPSBzZWxlY3RvcnMucHJvZmlsZUJ5SWQoc3RhdGUsIGxhc3RQcm9mSWQpO1xuICAgIGlmIChwcm9maWxlID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfVxuXG4gICAgY29uc3QgbG9hZE9yZGVyOiB0eXBlcy5Mb2FkT3JkZXIgPSBnZXRQZXJzaXN0ZW50TG9hZE9yZGVyKHRoaXMubUFwaSk7XG5cbiAgICBjb25zdCBsb2NrZWRFbnRyaWVzID0gT2JqZWN0LmtleXMobG9hZE9yZGVyKS5maWx0ZXIoa2V5ID0+IGxvYWRPcmRlcltrZXldPy5sb2NrZWQpO1xuICAgIGNvbnN0IG1pblByaW9yaXR5ID0gKG1pbikgPyBtaW4gOiBsb2NrZWRFbnRyaWVzLmxlbmd0aDtcbiAgICByZXR1cm4geyBzdGF0ZSwgcHJvZmlsZSwgbG9hZE9yZGVyLCBtaW5Qcmlvcml0eSB9O1xuICB9XG5cbiAgcHVibGljIGdldE1heFByaW9yaXR5ID0gKHByb3BzOiBJUHJvcHMpID0+IHtcbiAgICBjb25zdCB7IGxvYWRPcmRlciwgbWluUHJpb3JpdHkgfSA9IHByb3BzO1xuICAgIHJldHVybiBPYmplY3Qua2V5cyhsb2FkT3JkZXIpLnJlZHVjZSgocHJldiwga2V5KSA9PiB7XG4gICAgICBjb25zdCBwcmVmaXhWYWwgPSBsb2FkT3JkZXJba2V5XT8uZGF0YT8ucHJlZml4ID8/IGxvYWRPcmRlcltrZXldPy5wcmVmaXg7XG4gICAgICBjb25zdCBpbnRWYWwgPSBwcmVmaXhWYWwgIT09IHVuZGVmaW5lZFxuICAgICAgICA/IHBhcnNlSW50KGxvYWRPcmRlcltrZXldLnByZWZpeCwgMTApXG4gICAgICAgIDogbG9hZE9yZGVyW2tleV0ucG9zO1xuICAgICAgY29uc3QgcG9zVmFsID0gbG9hZE9yZGVyW2tleV0ucG9zO1xuICAgICAgaWYgKHBvc1ZhbCAhPT0gaW50VmFsKSB7XG4gICAgICAgIHByZXYgPSAoaW50VmFsID4gcHJldilcbiAgICAgICAgICA/IGludFZhbCA6IHByZXY7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBwcmV2ID0gKHBvc1ZhbCA+IHByZXYpXG4gICAgICAgICAgPyBwb3NWYWwgOiBwcmV2O1xuICAgICAgfVxuICAgICAgcmV0dXJuIHByZXY7XG4gICAgfSwgbWluUHJpb3JpdHkpO1xuICB9XG59XG4iXX0=