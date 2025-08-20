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
exports.testPlugAndPlayModType = void 0;
const path_1 = __importDefault(require("path"));
const common_1 = require("./common");
function testPlugAndPlayModType(instr) {
    return __awaiter(this, void 0, void 0, function* () {
        const modInfo = instr.find(instr => instr.type === 'copy' && path_1.default.basename(instr.source).toLowerCase() === common_1.MOD_INFO_JSON_FILE);
        return modInfo !== undefined;
    });
}
exports.testPlugAndPlayModType = testPlugAndPlayModType;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibW9kVHlwZXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJtb2RUeXBlcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7QUFBQSxnREFBd0I7QUFFeEIscUNBQThDO0FBRTlDLFNBQXNCLHNCQUFzQixDQUFDLEtBQTJCOztRQUN0RSxNQUFNLE9BQU8sR0FBRyxLQUFLLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLElBQUksS0FBSyxNQUFNLElBQUksY0FBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUMsV0FBVyxFQUFFLEtBQUssMkJBQWtCLENBQUMsQ0FBQztRQUMvSCxPQUFPLE9BQU8sS0FBSyxTQUFTLENBQUM7SUFDL0IsQ0FBQztDQUFBO0FBSEQsd0RBR0MiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcbmltcG9ydCB7IHR5cGVzIH0gZnJvbSAndm9ydGV4LWFwaSc7XG5pbXBvcnQgeyBNT0RfSU5GT19KU09OX0ZJTEUgfSBmcm9tICcuL2NvbW1vbic7XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiB0ZXN0UGx1Z0FuZFBsYXlNb2RUeXBlKGluc3RyOiB0eXBlcy5JSW5zdHJ1Y3Rpb25bXSkge1xuICBjb25zdCBtb2RJbmZvID0gaW5zdHIuZmluZChpbnN0ciA9PiBpbnN0ci50eXBlID09PSAnY29weScgJiYgcGF0aC5iYXNlbmFtZShpbnN0ci5zb3VyY2UpLnRvTG93ZXJDYXNlKCkgPT09IE1PRF9JTkZPX0pTT05fRklMRSk7XG4gIHJldHVybiBtb2RJbmZvICE9PSB1bmRlZmluZWQ7XG59Il19