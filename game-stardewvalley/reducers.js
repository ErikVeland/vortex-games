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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVkdWNlcnMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJyZWR1Y2Vycy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsbURBQXFDO0FBRXJDLDJDQUF5QztBQU16QyxNQUFNLFdBQVcsR0FBa0M7SUFDakQsUUFBUSxFQUFFO1FBQ1IsQ0FBQyxPQUFPLENBQUMsa0JBQXlCLENBQUMsRUFBRSxDQUFDLEtBQUssRUFBRSxPQUFPLEVBQUUsRUFBRTtZQUN0RCxPQUFPLGlCQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxDQUFDLG9CQUFvQixDQUFDLEVBQUUsT0FBTyxDQUFDLENBQUM7UUFDOUQsQ0FBQztRQUNELENBQUMsT0FBTyxDQUFDLGVBQXNCLENBQUMsRUFBRSxDQUFDLEtBQUssRUFBRSxPQUFPLEVBQUUsRUFBRTtZQUNuRCxNQUFNLEVBQUUsU0FBUyxFQUFFLE9BQU8sRUFBRSxHQUFHLE9BQU8sQ0FBQztZQUN2QyxPQUFPLGlCQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxDQUFDLGNBQWMsRUFBRSxTQUFTLENBQUMsRUFBRSxPQUFPLENBQUMsQ0FBQztRQUNuRSxDQUFDO0tBQ0Y7SUFDRCxRQUFRLEVBQUU7UUFDUixrQkFBa0IsRUFBRSxTQUFTO0tBQzlCO0NBQ0YsQ0FBQTtBQUVELGtCQUFlLFdBQVcsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGFjdGlvbnMgZnJvbSAnLi9hY3Rpb25zJztcblxuaW1wb3J0IHsgdHlwZXMsIHV0aWwgfSBmcm9tICd2b3J0ZXgtYXBpJztcblxuZXhwb3J0IGludGVyZmFjZSBJU3RhdGVTRFYge1xuICB1c2VSZWNvbW1lbmRhdGlvbnM6IGJvb2xlYW47XG59XG5cbmNvbnN0IHNkdlJlZHVjZXJzOiB0eXBlcy5JUmVkdWNlclNwZWM8SVN0YXRlU0RWPiA9IHtcbiAgcmVkdWNlcnM6IHtcbiAgICBbYWN0aW9ucy5zZXRSZWNvbW1lbmRhdGlvbnMgYXMgYW55XTogKHN0YXRlLCBwYXlsb2FkKSA9PiB7XG4gICAgICByZXR1cm4gdXRpbC5zZXRTYWZlKHN0YXRlLCBbJ3VzZVJlY29tbWVuZGF0aW9ucyddLCBwYXlsb2FkKTtcbiAgICB9LFxuICAgIFthY3Rpb25zLnNldE1lcmdlQ29uZmlncyBhcyBhbnldOiAoc3RhdGUsIHBheWxvYWQpID0+IHtcbiAgICAgIGNvbnN0IHsgcHJvZmlsZUlkLCBlbmFibGVkIH0gPSBwYXlsb2FkO1xuICAgICAgcmV0dXJuIHV0aWwuc2V0U2FmZShzdGF0ZSwgWydtZXJnZUNvbmZpZ3MnLCBwcm9maWxlSWRdLCBlbmFibGVkKTtcbiAgICB9LFxuICB9LFxuICBkZWZhdWx0czoge1xuICAgIHVzZVJlY29tbWVuZGF0aW9uczogdW5kZWZpbmVkLFxuICB9LFxufVxuXG5leHBvcnQgZGVmYXVsdCBzZHZSZWR1Y2VycztcbiJdfQ==