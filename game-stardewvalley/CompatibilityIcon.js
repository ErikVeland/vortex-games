"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const vortex_api_1 = require("vortex-api");
const iconMap = {
    broken: 'feedback-error',
    obsolete: 'feedback-error',
    abandoned: 'feedback-warning',
    unofficial: 'feedback-warning',
    workaround: 'feedback-warning',
    unknown: 'feedback-info',
    optional: 'feedback-success',
    ok: 'feedback-success',
};
function CompatibilityIcon(props) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
    const { t, mod } = props;
    const version = (_b = (_a = mod.attributes) === null || _a === void 0 ? void 0 : _a.manifestVersion) !== null && _b !== void 0 ? _b : (_c = mod.attributes) === null || _c === void 0 ? void 0 : _c.version;
    if ((((_d = mod.attributes) === null || _d === void 0 ? void 0 : _d.compatibilityUpdate) !== undefined)
        && (((_e = mod.attributes) === null || _e === void 0 ? void 0 : _e.compatibilityUpdate) !== version)) {
        return (react_1.default.createElement(vortex_api_1.tooltip.Icon, { name: 'auto-update', tooltip: t('SMAPI suggests updating this mod to {{update}}. '
                + 'Please use Vortex to check for mod updates', {
                replace: {
                    update: (_f = mod.attributes) === null || _f === void 0 ? void 0 : _f.compatibilityUpdate,
                },
            }) }));
    }
    const status = ((_h = (_g = mod.attributes) === null || _g === void 0 ? void 0 : _g.compatibilityStatus) !== null && _h !== void 0 ? _h : 'unknown').toLowerCase();
    const icon = (_j = iconMap[status]) !== null && _j !== void 0 ? _j : iconMap['unknown'];
    return (react_1.default.createElement(vortex_api_1.tooltip.Icon, { name: icon, className: `sdv-compatibility-${status}`, tooltip: (_l = (_k = mod.attributes) === null || _k === void 0 ? void 0 : _k.compatibilityMessage) !== null && _l !== void 0 ? _l : t('No information') }));
}
exports.default = CompatibilityIcon;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQ29tcGF0aWJpbGl0eUljb24uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJDb21wYXRpYmlsaXR5SWNvbi50c3giXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7QUFBQSxrREFBMEI7QUFDMUIsMkNBQTRDO0FBUzVDLE1BQU0sT0FBTyxHQUF3QztJQUNuRCxNQUFNLEVBQUUsZ0JBQWdCO0lBQ3hCLFFBQVEsRUFBRSxnQkFBZ0I7SUFDMUIsU0FBUyxFQUFFLGtCQUFrQjtJQUM3QixVQUFVLEVBQUUsa0JBQWtCO0lBQzlCLFVBQVUsRUFBRSxrQkFBa0I7SUFDOUIsT0FBTyxFQUFFLGVBQWU7SUFDeEIsUUFBUSxFQUFFLGtCQUFrQjtJQUM1QixFQUFFLEVBQUUsa0JBQWtCO0NBQ3ZCLENBQUM7QUFFRixTQUFTLGlCQUFpQixDQUFDLEtBQThCOztJQUN2RCxNQUFNLEVBQUUsQ0FBQyxFQUFFLEdBQUcsRUFBRSxHQUFHLEtBQUssQ0FBQztJQUV6QixNQUFNLE9BQU8sR0FBRyxNQUFBLE1BQUEsR0FBRyxDQUFDLFVBQVUsMENBQUUsZUFBZSxtQ0FDL0IsTUFBQSxHQUFHLENBQUMsVUFBVSwwQ0FBRSxPQUFPLENBQUM7SUFFeEMsSUFBSSxDQUFDLENBQUEsTUFBQSxHQUFHLENBQUMsVUFBVSwwQ0FBRSxtQkFBbUIsTUFBSyxTQUFTLENBQUM7V0FDaEQsQ0FBQyxDQUFBLE1BQUEsR0FBRyxDQUFDLFVBQVUsMENBQUUsbUJBQW1CLE1BQUssT0FBTyxDQUFDLEVBQUUsQ0FBQztRQUN6RCxPQUFPLENBQ0wsOEJBQUMsb0JBQU8sQ0FBQyxJQUFJLElBQ1gsSUFBSSxFQUFDLGFBQWEsRUFDbEIsT0FBTyxFQUFFLENBQUMsQ0FBQyxrREFBa0Q7a0JBQ2pELDRDQUE0QyxFQUFFO2dCQUN4RCxPQUFPLEVBQUU7b0JBQ1AsTUFBTSxFQUFFLE1BQUEsR0FBRyxDQUFDLFVBQVUsMENBQUUsbUJBQW1CO2lCQUM1QzthQUNGLENBQUMsR0FDRixDQUNILENBQUM7SUFDSixDQUFDO0lBRUQsTUFBTSxNQUFNLEdBQUcsQ0FBQyxNQUFBLE1BQUEsR0FBRyxDQUFDLFVBQVUsMENBQUUsbUJBQW1CLG1DQUFJLFNBQVMsQ0FBQyxDQUFDLFdBQVcsRUFBRSxDQUFDO0lBQ2hGLE1BQU0sSUFBSSxHQUFHLE1BQUEsT0FBTyxDQUFDLE1BQU0sQ0FBQyxtQ0FBSSxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUM7SUFDbkQsT0FBTyxDQUNMLDhCQUFDLG9CQUFPLENBQUMsSUFBSSxJQUNYLElBQUksRUFBRSxJQUFJLEVBQ1YsU0FBUyxFQUFFLHFCQUFxQixNQUFNLEVBQUUsRUFDeEMsT0FBTyxFQUFFLE1BQUEsTUFBQSxHQUFHLENBQUMsVUFBVSwwQ0FBRSxvQkFBb0IsbUNBQUksQ0FBQyxDQUFDLGdCQUFnQixDQUFDLEdBQ3BFLENBQ0gsQ0FBQztBQUNKLENBQUM7QUFFRCxrQkFBZSxpQkFBaUIsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBSZWFjdCBmcm9tICdyZWFjdCc7XG5pbXBvcnQgeyB0b29sdGlwLCB0eXBlcyB9IGZyb20gJ3ZvcnRleC1hcGknO1xuaW1wb3J0IHsgQ29tcGF0aWJpbGl0eVN0YXR1cyB9IGZyb20gJy4vdHlwZXMnO1xuXG5leHBvcnQgaW50ZXJmYWNlIElDb21wYXRpYmlsaXR5SWNvblByb3BzIHtcbiAgdDogdHlwZXMuVEZ1bmN0aW9uLFxuICBtb2Q6IHR5cGVzLklNb2QsXG4gIGRldGFpbENlbGw6IGJvb2xlYW4sXG59XG5cbmNvbnN0IGljb25NYXA6IFJlY29yZDxDb21wYXRpYmlsaXR5U3RhdHVzLCBzdHJpbmc+ID0ge1xuICBicm9rZW46ICdmZWVkYmFjay1lcnJvcicsXG4gIG9ic29sZXRlOiAnZmVlZGJhY2stZXJyb3InLFxuICBhYmFuZG9uZWQ6ICdmZWVkYmFjay13YXJuaW5nJyxcbiAgdW5vZmZpY2lhbDogJ2ZlZWRiYWNrLXdhcm5pbmcnLFxuICB3b3JrYXJvdW5kOiAnZmVlZGJhY2std2FybmluZycsXG4gIHVua25vd246ICdmZWVkYmFjay1pbmZvJyxcbiAgb3B0aW9uYWw6ICdmZWVkYmFjay1zdWNjZXNzJyxcbiAgb2s6ICdmZWVkYmFjay1zdWNjZXNzJyxcbn07XG5cbmZ1bmN0aW9uIENvbXBhdGliaWxpdHlJY29uKHByb3BzOiBJQ29tcGF0aWJpbGl0eUljb25Qcm9wcykge1xuICBjb25zdCB7IHQsIG1vZCB9ID0gcHJvcHM7XG5cbiAgY29uc3QgdmVyc2lvbiA9IG1vZC5hdHRyaWJ1dGVzPy5tYW5pZmVzdFZlcnNpb25cbiAgICAgICAgICAgICAgID8/IG1vZC5hdHRyaWJ1dGVzPy52ZXJzaW9uO1xuXG4gIGlmICgobW9kLmF0dHJpYnV0ZXM/LmNvbXBhdGliaWxpdHlVcGRhdGUgIT09IHVuZGVmaW5lZClcbiAgICAgICYmIChtb2QuYXR0cmlidXRlcz8uY29tcGF0aWJpbGl0eVVwZGF0ZSAhPT0gdmVyc2lvbikpIHtcbiAgICByZXR1cm4gKFxuICAgICAgPHRvb2x0aXAuSWNvblxuICAgICAgICBuYW1lPSdhdXRvLXVwZGF0ZSdcbiAgICAgICAgdG9vbHRpcD17dCgnU01BUEkgc3VnZ2VzdHMgdXBkYXRpbmcgdGhpcyBtb2QgdG8ge3t1cGRhdGV9fS4gJ1xuICAgICAgICAgICAgICAgICAgKyAnUGxlYXNlIHVzZSBWb3J0ZXggdG8gY2hlY2sgZm9yIG1vZCB1cGRhdGVzJywge1xuICAgICAgICAgIHJlcGxhY2U6IHtcbiAgICAgICAgICAgIHVwZGF0ZTogbW9kLmF0dHJpYnV0ZXM/LmNvbXBhdGliaWxpdHlVcGRhdGUsXG4gICAgICAgICAgfSxcbiAgICAgICAgfSl9XG4gICAgICAvPlxuICAgICk7XG4gIH1cblxuICBjb25zdCBzdGF0dXMgPSAobW9kLmF0dHJpYnV0ZXM/LmNvbXBhdGliaWxpdHlTdGF0dXMgPz8gJ3Vua25vd24nKS50b0xvd2VyQ2FzZSgpO1xuICBjb25zdCBpY29uID0gaWNvbk1hcFtzdGF0dXNdID8/IGljb25NYXBbJ3Vua25vd24nXTtcbiAgcmV0dXJuIChcbiAgICA8dG9vbHRpcC5JY29uXG4gICAgICBuYW1lPXtpY29ufVxuICAgICAgY2xhc3NOYW1lPXtgc2R2LWNvbXBhdGliaWxpdHktJHtzdGF0dXN9YH1cbiAgICAgIHRvb2x0aXA9e21vZC5hdHRyaWJ1dGVzPy5jb21wYXRpYmlsaXR5TWVzc2FnZSA/PyB0KCdObyBpbmZvcm1hdGlvbicpfVxuICAgIC8+XG4gICk7XG59XG5cbmV4cG9ydCBkZWZhdWx0IENvbXBhdGliaWxpdHlJY29uO1xuIl19