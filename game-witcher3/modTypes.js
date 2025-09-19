const { isWindows } = require('vortex-api');
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.testDLC = exports.testTL = void 0;
const common_1 = require("./common");
const path_1 = __importDefault(require("path"));
const destHasRootDir = (instruction, dir) => {
    if (!(instruction === null || instruction === void 0 ? void 0 : instruction.destination)) {
        return false;
    }
    const segments = instruction.destination.split(path_1.default.sep);
    return segments[0].toLowerCase() === dir.toLowerCase();
};
function testTL(instructions) {
    const hasConfigMatrix = instructions.some(instr => !!instr.source
        && instr.source.indexOf(common_1.CONFIG_MATRIX_REL_PATH) !== -1);
    const hasSettingsConfig = instructions.some(instr => { var _a, _b, _c, _d; return (_d = (_c = (_b = (_a = instr === null || instr === void 0 ? void 0 : instr.source) === null || _a === void 0 ? void 0 : _a.toLowerCase) === null || _b === void 0 ? void 0 : _b.call(_a)) === null || _c === void 0 ? void 0 : _c.endsWith) === null || _d === void 0 ? void 0 : _d.call(_c, common_1.PART_SUFFIX); });
    if (hasConfigMatrix || hasSettingsConfig) {
        return Promise.resolve(false);
    }
    const hasModsDir = instructions.some(instr => destHasRootDir(instr, 'mods'));
    const hasBinDir = instructions.some(instr => destHasRootDir(instr, 'bin'));
    return Promise.resolve(hasModsDir || hasBinDir);
}
exports.testTL = testTL;
function testDLC(instructions) {
    return Promise.resolve(instructions.find(instruction => !!instruction.destination && instruction.destination.toLowerCase().startsWith('dlc' + path_1.default.sep)) !== undefined);
}
exports.testDLC = testDLC;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibW9kVHlwZXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJtb2RUeXBlcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQSxxQ0FBK0Q7QUFDL0QsZ0RBQXdCO0FBR3hCLE1BQU0sY0FBYyxHQUFHLENBQUMsV0FBK0IsRUFBRSxHQUFXLEVBQUUsRUFBRTtJQUN0RSxJQUFJLENBQUMsQ0FBQSxXQUFXLGFBQVgsV0FBVyx1QkFBWCxXQUFXLENBQUUsV0FBVyxDQUFBLEVBQUU7UUFDN0IsT0FBTyxLQUFLLENBQUM7S0FDZDtJQUNELE1BQU0sUUFBUSxHQUFHLFdBQVcsQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLGNBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUN6RCxPQUFPLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxXQUFXLEVBQUUsS0FBSyxHQUFHLENBQUMsV0FBVyxFQUFFLENBQUM7QUFDekQsQ0FBQyxDQUFBO0FBRUQsU0FBZ0IsTUFBTSxDQUFDLFlBQWtDO0lBQ3ZELE1BQU0sZUFBZSxHQUFHLFlBQVksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLE1BQU07V0FDNUQsS0FBSyxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsK0JBQXNCLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQzFELE1BQU0saUJBQWlCLEdBQUcsWUFBWSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsRUFBRSx1QkFDbEQsT0FBQSxNQUFBLE1BQUEsTUFBQSxNQUFBLEtBQUssYUFBTCxLQUFLLHVCQUFMLEtBQUssQ0FBRSxNQUFNLDBDQUFFLFdBQVcsa0RBQUksMENBQUUsUUFBUSxtREFBRyxvQkFBVyxDQUFDLENBQUEsRUFBQSxDQUFDLENBQUM7SUFDM0QsSUFBSSxlQUFlLElBQUksaUJBQWlCLEVBQUU7UUFDeEMsT0FBTyxPQUFPLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDO0tBQy9CO0lBRUQsTUFBTSxVQUFVLEdBQUcsWUFBWSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLGNBQWMsQ0FBQyxLQUFLLEVBQUUsTUFBTSxDQUFDLENBQUMsQ0FBQztJQUM3RSxNQUFNLFNBQVMsR0FBRyxZQUFZLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsY0FBYyxDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDO0lBQzNFLE9BQU8sT0FBTyxDQUFDLE9BQU8sQ0FBQyxVQUFVLElBQUksU0FBUyxDQUFDLENBQUM7QUFDbEQsQ0FBQztBQVpELHdCQVlDO0FBRUQsU0FBZ0IsT0FBTyxDQUFDLFlBQWtDO0lBQ3hELE9BQU8sT0FBTyxDQUFDLE9BQU8sQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUN0QyxXQUFXLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxXQUFXLENBQUMsV0FBVyxJQUFJLFdBQVcsQ0FBQyxXQUFXLENBQUMsV0FBVyxFQUFFLENBQUMsVUFBVSxDQUFDLEtBQUssR0FBRyxjQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsS0FBSyxTQUFTLENBQUMsQ0FBQztBQUNuSSxDQUFDO0FBSEQsMEJBR0MiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBDT05GSUdfTUFUUklYX1JFTF9QQVRILCBQQVJUX1NVRkZJWCB9IGZyb20gJy4vY29tbW9uJztcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0IHsgdHlwZXMgfSBmcm9tICd2b3J0ZXgtYXBpJztcblxuY29uc3QgZGVzdEhhc1Jvb3REaXIgPSAoaW5zdHJ1Y3Rpb246IHR5cGVzLklJbnN0cnVjdGlvbiwgZGlyOiBzdHJpbmcpID0+IHtcbiAgaWYgKCFpbnN0cnVjdGlvbj8uZGVzdGluYXRpb24pIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgY29uc3Qgc2VnbWVudHMgPSBpbnN0cnVjdGlvbi5kZXN0aW5hdGlvbi5zcGxpdChwYXRoLnNlcCk7XG4gIHJldHVybiBzZWdtZW50c1swXS50b0xvd2VyQ2FzZSgpID09PSBkaXIudG9Mb3dlckNhc2UoKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHRlc3RUTChpbnN0cnVjdGlvbnM6IHR5cGVzLklJbnN0cnVjdGlvbltdKSB7XG4gIGNvbnN0IGhhc0NvbmZpZ01hdHJpeCA9IGluc3RydWN0aW9ucy5zb21lKGluc3RyID0+ICEhaW5zdHIuc291cmNlXG4gICAgJiYgaW5zdHIuc291cmNlLmluZGV4T2YoQ09ORklHX01BVFJJWF9SRUxfUEFUSCkgIT09IC0xKTtcbiAgY29uc3QgaGFzU2V0dGluZ3NDb25maWcgPSBpbnN0cnVjdGlvbnMuc29tZShpbnN0ciA9PlxuICAgIGluc3RyPy5zb3VyY2U/LnRvTG93ZXJDYXNlPy4oKT8uZW5kc1dpdGg/LihQQVJUX1NVRkZJWCkpO1xuICBpZiAoaGFzQ29uZmlnTWF0cml4IHx8IGhhc1NldHRpbmdzQ29uZmlnKSB7XG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShmYWxzZSk7XG4gIH1cblxuICBjb25zdCBoYXNNb2RzRGlyID0gaW5zdHJ1Y3Rpb25zLnNvbWUoaW5zdHIgPT4gZGVzdEhhc1Jvb3REaXIoaW5zdHIsICdtb2RzJykpO1xuICBjb25zdCBoYXNCaW5EaXIgPSBpbnN0cnVjdGlvbnMuc29tZShpbnN0ciA9PiBkZXN0SGFzUm9vdERpcihpbnN0ciwgJ2JpbicpKTtcbiAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShoYXNNb2RzRGlyIHx8IGhhc0JpbkRpcik7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB0ZXN0RExDKGluc3RydWN0aW9uczogdHlwZXMuSUluc3RydWN0aW9uW10pIHtcbiAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShpbnN0cnVjdGlvbnMuZmluZChcbiAgICBpbnN0cnVjdGlvbiA9PiAhIWluc3RydWN0aW9uLmRlc3RpbmF0aW9uICYmIGluc3RydWN0aW9uLmRlc3RpbmF0aW9uLnRvTG93ZXJDYXNlKCkuc3RhcnRzV2l0aCgnZGxjJyArIHBhdGguc2VwKSkgIT09IHVuZGVmaW5lZCk7XG59Il19