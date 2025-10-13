"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const actions = __importStar(require("./actions"));
const vortex_api_1 = require("vortex-api");
const sdvReducers = {
    reducers: {
        [actions.setRecommendations]: (state, payload) => {
            return vortex_api_1.util.setSafe(state, ['useRecommendations'], payload);
        },
        [actions.setMergeConfigs]: (state, payload) => {
            const { profileId, enabled } = payload;
            return vortex_api_1.util.setSafe(state, ['mergeConfigs', profileId], enabled);
        },
    },
    defaults: {
        useRecommendations: undefined,
    },
};
exports.default = sdvReducers;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVkdWNlcnMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJyZWR1Y2Vycy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLG1EQUFxQztBQUVyQywyQ0FBeUM7QUFNekMsTUFBTSxXQUFXLEdBQWtDO0lBQ2pELFFBQVEsRUFBRTtRQUNSLENBQUMsT0FBTyxDQUFDLGtCQUF5QixDQUFDLEVBQUUsQ0FBQyxLQUFLLEVBQUUsT0FBTyxFQUFFLEVBQUU7WUFDdEQsT0FBTyxpQkFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsQ0FBQyxvQkFBb0IsQ0FBQyxFQUFFLE9BQU8sQ0FBQyxDQUFDO1FBQzlELENBQUM7UUFDRCxDQUFDLE9BQU8sQ0FBQyxlQUFzQixDQUFDLEVBQUUsQ0FBQyxLQUFLLEVBQUUsT0FBTyxFQUFFLEVBQUU7WUFDbkQsTUFBTSxFQUFFLFNBQVMsRUFBRSxPQUFPLEVBQUUsR0FBRyxPQUFPLENBQUM7WUFDdkMsT0FBTyxpQkFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsQ0FBQyxjQUFjLEVBQUUsU0FBUyxDQUFDLEVBQUUsT0FBTyxDQUFDLENBQUM7UUFDbkUsQ0FBQztLQUNGO0lBQ0QsUUFBUSxFQUFFO1FBQ1Isa0JBQWtCLEVBQUUsU0FBUztLQUM5QjtDQUNGLENBQUE7QUFFRCxrQkFBZSxXQUFXLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBhY3Rpb25zIGZyb20gJy4vYWN0aW9ucyc7XG5cbmltcG9ydCB7IHR5cGVzLCB1dGlsIH0gZnJvbSAndm9ydGV4LWFwaSc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgSVN0YXRlU0RWIHtcbiAgdXNlUmVjb21tZW5kYXRpb25zOiBib29sZWFuO1xufVxuXG5jb25zdCBzZHZSZWR1Y2VyczogdHlwZXMuSVJlZHVjZXJTcGVjPElTdGF0ZVNEVj4gPSB7XG4gIHJlZHVjZXJzOiB7XG4gICAgW2FjdGlvbnMuc2V0UmVjb21tZW5kYXRpb25zIGFzIGFueV06IChzdGF0ZSwgcGF5bG9hZCkgPT4ge1xuICAgICAgcmV0dXJuIHV0aWwuc2V0U2FmZShzdGF0ZSwgWyd1c2VSZWNvbW1lbmRhdGlvbnMnXSwgcGF5bG9hZCk7XG4gICAgfSxcbiAgICBbYWN0aW9ucy5zZXRNZXJnZUNvbmZpZ3MgYXMgYW55XTogKHN0YXRlLCBwYXlsb2FkKSA9PiB7XG4gICAgICBjb25zdCB7IHByb2ZpbGVJZCwgZW5hYmxlZCB9ID0gcGF5bG9hZDtcbiAgICAgIHJldHVybiB1dGlsLnNldFNhZmUoc3RhdGUsIFsnbWVyZ2VDb25maWdzJywgcHJvZmlsZUlkXSwgZW5hYmxlZCk7XG4gICAgfSxcbiAgfSxcbiAgZGVmYXVsdHM6IHtcbiAgICB1c2VSZWNvbW1lbmRhdGlvbnM6IHVuZGVmaW5lZCxcbiAgfSxcbn1cblxuZXhwb3J0IGRlZmF1bHQgc2R2UmVkdWNlcnM7XG4iXX0=