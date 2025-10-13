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
exports.testPlugAndPlayModType = testPlugAndPlayModType;
const path_1 = __importDefault(require("path"));
const common_1 = require("./common");
function testPlugAndPlayModType(instr) {
    return __awaiter(this, void 0, void 0, function* () {
        const modInfo = instr.find(instr => instr.type === 'copy' && path_1.default.basename(instr.source).toLowerCase() === common_1.MOD_INFO_JSON_FILE);
        return modInfo !== undefined;
    });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibW9kVHlwZXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJtb2RUeXBlcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7OztBQUlBLHdEQUdDO0FBUEQsZ0RBQXdCO0FBRXhCLHFDQUE4QztBQUU5QyxTQUFzQixzQkFBc0IsQ0FBQyxLQUEyQjs7UUFDdEUsTUFBTSxPQUFPLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxJQUFJLEtBQUssTUFBTSxJQUFJLGNBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDLFdBQVcsRUFBRSxLQUFLLDJCQUFrQixDQUFDLENBQUM7UUFDL0gsT0FBTyxPQUFPLEtBQUssU0FBUyxDQUFDO0lBQy9CLENBQUM7Q0FBQSIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0IHsgdHlwZXMgfSBmcm9tICd2b3J0ZXgtYXBpJztcbmltcG9ydCB7IE1PRF9JTkZPX0pTT05fRklMRSB9IGZyb20gJy4vY29tbW9uJztcblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHRlc3RQbHVnQW5kUGxheU1vZFR5cGUoaW5zdHI6IHR5cGVzLklJbnN0cnVjdGlvbltdKSB7XG4gIGNvbnN0IG1vZEluZm8gPSBpbnN0ci5maW5kKGluc3RyID0+IGluc3RyLnR5cGUgPT09ICdjb3B5JyAmJiBwYXRoLmJhc2VuYW1lKGluc3RyLnNvdXJjZSkudG9Mb3dlckNhc2UoKSA9PT0gTU9EX0lORk9fSlNPTl9GSUxFKTtcbiAgcmV0dXJuIG1vZEluZm8gIT09IHVuZGVmaW5lZDtcbn0iXX0=