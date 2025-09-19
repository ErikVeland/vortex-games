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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQ29tcGF0aWJpbGl0eUljb24uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJDb21wYXRpYmlsaXR5SWNvbi50c3giXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7QUFBQSxrREFBMEI7QUFDMUIsMkNBQTRDO0FBVTVDLE1BQU0sT0FBTyxHQUF3QztJQUNuRCxNQUFNLEVBQUUsZ0JBQWdCO0lBQ3hCLFFBQVEsRUFBRSxnQkFBZ0I7SUFDMUIsU0FBUyxFQUFFLGtCQUFrQjtJQUM3QixVQUFVLEVBQUUsa0JBQWtCO0lBQzlCLFVBQVUsRUFBRSxrQkFBa0I7SUFDOUIsT0FBTyxFQUFFLGVBQWU7SUFDeEIsUUFBUSxFQUFFLGtCQUFrQjtJQUM1QixFQUFFLEVBQUUsa0JBQWtCO0NBQ3ZCLENBQUM7QUFFRixTQUFTLGlCQUFpQixDQUFDLEtBQThCOztJQUN2RCxNQUFNLEVBQUUsQ0FBQyxFQUFFLEdBQUcsRUFBRSxHQUFHLEtBQUssQ0FBQztJQUV6QixNQUFNLE9BQU8sR0FBRyxNQUFBLE1BQUEsR0FBRyxDQUFDLFVBQVUsMENBQUUsZUFBZSxtQ0FDL0IsTUFBQSxHQUFHLENBQUMsVUFBVSwwQ0FBRSxPQUFPLENBQUM7SUFFeEMsSUFBSSxDQUFDLENBQUEsTUFBQSxHQUFHLENBQUMsVUFBVSwwQ0FBRSxtQkFBbUIsTUFBSyxTQUFTLENBQUM7V0FDaEQsQ0FBQyxDQUFBLE1BQUEsR0FBRyxDQUFDLFVBQVUsMENBQUUsbUJBQW1CLE1BQUssT0FBTyxDQUFDLEVBQUU7UUFDeEQsT0FBTyxDQUNMLDhCQUFDLG9CQUFPLENBQUMsSUFBSSxJQUNYLElBQUksRUFBQyxhQUFhLEVBQ2xCLE9BQU8sRUFBRSxDQUFDLENBQUMsa0RBQWtEO2tCQUNqRCw0Q0FBNEMsRUFBRTtnQkFDeEQsT0FBTyxFQUFFO29CQUNQLE1BQU0sRUFBRSxNQUFBLEdBQUcsQ0FBQyxVQUFVLDBDQUFFLG1CQUFtQjtpQkFDNUM7YUFDRixDQUFDLEdBQ0YsQ0FDSCxDQUFDO0tBQ0g7SUFFRCxNQUFNLE1BQU0sR0FBRyxDQUFDLE1BQUEsTUFBQSxHQUFHLENBQUMsVUFBVSwwQ0FBRSxtQkFBbUIsbUNBQUksU0FBUyxDQUFDLENBQUMsV0FBVyxFQUFFLENBQUM7SUFDaEYsTUFBTSxJQUFJLEdBQUcsTUFBQSxPQUFPLENBQUMsTUFBTSxDQUFDLG1DQUFJLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQztJQUNuRCxPQUFPLENBQ0wsOEJBQUMsb0JBQU8sQ0FBQyxJQUFJLElBQ1gsSUFBSSxFQUFFLElBQUksRUFDVixTQUFTLEVBQUUscUJBQXFCLE1BQU0sRUFBRSxFQUN4QyxPQUFPLEVBQUUsTUFBQSxNQUFBLEdBQUcsQ0FBQyxVQUFVLDBDQUFFLG9CQUFvQixtQ0FBSSxDQUFDLENBQUMsZ0JBQWdCLENBQUMsR0FDcEUsQ0FDSCxDQUFDO0FBQ0osQ0FBQztBQUVELGtCQUFlLGlCQUFpQixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IFJlYWN0IGZyb20gJ3JlYWN0JztcbmltcG9ydCB7IHRvb2x0aXAsIHR5cGVzIH0gZnJvbSAndm9ydGV4LWFwaSc7XG5pbXBvcnQgeyBDb21wYXRpYmlsaXR5U3RhdHVzIH0gZnJvbSAnLi90eXBlcyc7XG5cbmltcG9ydCB7IGlzV2luZG93cyB9IGZyb20gJ3ZvcnRleC1hcGknO1xuZXhwb3J0IGludGVyZmFjZSBJQ29tcGF0aWJpbGl0eUljb25Qcm9wcyB7XG4gIHQ6IHR5cGVzLlRGdW5jdGlvbixcbiAgbW9kOiB0eXBlcy5JTW9kLFxuICBkZXRhaWxDZWxsOiBib29sZWFuLFxufVxuXG5jb25zdCBpY29uTWFwOiBSZWNvcmQ8Q29tcGF0aWJpbGl0eVN0YXR1cywgc3RyaW5nPiA9IHtcbiAgYnJva2VuOiAnZmVlZGJhY2stZXJyb3InLFxuICBvYnNvbGV0ZTogJ2ZlZWRiYWNrLWVycm9yJyxcbiAgYWJhbmRvbmVkOiAnZmVlZGJhY2std2FybmluZycsXG4gIHVub2ZmaWNpYWw6ICdmZWVkYmFjay13YXJuaW5nJyxcbiAgd29ya2Fyb3VuZDogJ2ZlZWRiYWNrLXdhcm5pbmcnLFxuICB1bmtub3duOiAnZmVlZGJhY2staW5mbycsXG4gIG9wdGlvbmFsOiAnZmVlZGJhY2stc3VjY2VzcycsXG4gIG9rOiAnZmVlZGJhY2stc3VjY2VzcycsXG59O1xuXG5mdW5jdGlvbiBDb21wYXRpYmlsaXR5SWNvbihwcm9wczogSUNvbXBhdGliaWxpdHlJY29uUHJvcHMpIHtcbiAgY29uc3QgeyB0LCBtb2QgfSA9IHByb3BzO1xuXG4gIGNvbnN0IHZlcnNpb24gPSBtb2QuYXR0cmlidXRlcz8ubWFuaWZlc3RWZXJzaW9uXG4gICAgICAgICAgICAgICA/PyBtb2QuYXR0cmlidXRlcz8udmVyc2lvbjtcblxuICBpZiAoKG1vZC5hdHRyaWJ1dGVzPy5jb21wYXRpYmlsaXR5VXBkYXRlICE9PSB1bmRlZmluZWQpXG4gICAgICAmJiAobW9kLmF0dHJpYnV0ZXM/LmNvbXBhdGliaWxpdHlVcGRhdGUgIT09IHZlcnNpb24pKSB7XG4gICAgcmV0dXJuIChcbiAgICAgIDx0b29sdGlwLkljb25cbiAgICAgICAgbmFtZT0nYXV0by11cGRhdGUnXG4gICAgICAgIHRvb2x0aXA9e3QoJ1NNQVBJIHN1Z2dlc3RzIHVwZGF0aW5nIHRoaXMgbW9kIHRvIHt7dXBkYXRlfX0uICdcbiAgICAgICAgICAgICAgICAgICsgJ1BsZWFzZSB1c2UgVm9ydGV4IHRvIGNoZWNrIGZvciBtb2QgdXBkYXRlcycsIHtcbiAgICAgICAgICByZXBsYWNlOiB7XG4gICAgICAgICAgICB1cGRhdGU6IG1vZC5hdHRyaWJ1dGVzPy5jb21wYXRpYmlsaXR5VXBkYXRlLFxuICAgICAgICAgIH0sXG4gICAgICAgIH0pfVxuICAgICAgLz5cbiAgICApO1xuICB9XG5cbiAgY29uc3Qgc3RhdHVzID0gKG1vZC5hdHRyaWJ1dGVzPy5jb21wYXRpYmlsaXR5U3RhdHVzID8/ICd1bmtub3duJykudG9Mb3dlckNhc2UoKTtcbiAgY29uc3QgaWNvbiA9IGljb25NYXBbc3RhdHVzXSA/PyBpY29uTWFwWyd1bmtub3duJ107XG4gIHJldHVybiAoXG4gICAgPHRvb2x0aXAuSWNvblxuICAgICAgbmFtZT17aWNvbn1cbiAgICAgIGNsYXNzTmFtZT17YHNkdi1jb21wYXRpYmlsaXR5LSR7c3RhdHVzfWB9XG4gICAgICB0b29sdGlwPXttb2QuYXR0cmlidXRlcz8uY29tcGF0aWJpbGl0eU1lc3NhZ2UgPz8gdCgnTm8gaW5mb3JtYXRpb24nKX1cbiAgICAvPlxuICApO1xufVxuXG5leHBvcnQgZGVmYXVsdCBDb21wYXRpYmlsaXR5SWNvbjtcbiJdfQ==