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
exports.defaultModsRelPath = defaultModsRelPath;
exports.parseManifest = parseManifest;
exports.coerce = coerce;
exports.semverCompare = semverCompare;
exports.walkPath = walkPath;
exports.deleteFolder = deleteFolder;
exports.toBlue = toBlue;
const relaxed_json_1 = require("relaxed-json");
const semver = __importStar(require("semver"));
const turbowalk_1 = __importDefault(require("turbowalk"));
const vortex_api_1 = require("vortex-api");
function defaultModsRelPath() {
    return 'Mods';
}
function parseManifest(manifestFilePath) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const manifestData = yield vortex_api_1.fs.readFileAsync(manifestFilePath, { encoding: 'utf-8' });
            const manifest = (0, relaxed_json_1.parse)(vortex_api_1.util.deBOM(manifestData));
            if (!manifest) {
                throw new vortex_api_1.util.DataInvalid('Manifest file is invalid');
            }
            return manifest;
        }
        catch (err) {
            return Promise.reject(err);
        }
    });
}
function coerce(input) {
    try {
        return new semver.SemVer(input);
    }
    catch (err) {
        return semver.coerce(input);
    }
}
function semverCompare(lhs, rhs) {
    const l = coerce(lhs);
    const r = coerce(rhs);
    if ((l !== null) && (r !== null)) {
        return semver.compare(l, r);
    }
    else {
        return lhs.localeCompare(rhs, 'en-US');
    }
}
function walkPath(dirPath, walkOptions) {
    return __awaiter(this, void 0, void 0, function* () {
        walkOptions = !!walkOptions
            ? Object.assign(Object.assign({}, walkOptions), { skipHidden: true, skipInaccessible: true, skipLinks: true }) : { skipLinks: true, skipHidden: true, skipInaccessible: true };
        const walkResults = [];
        return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
            yield (0, turbowalk_1.default)(dirPath, (entries) => {
                walkResults.push(...entries);
                return Promise.resolve();
            }, walkOptions).catch(err => err.code === 'ENOENT' ? Promise.resolve() : Promise.reject(err));
            return resolve(walkResults);
        }));
    });
}
function deleteFolder(dirPath, walkOptions) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const entries = yield walkPath(dirPath, walkOptions);
            entries.sort((a, b) => b.filePath.length - a.filePath.length);
            for (const entry of entries) {
                yield vortex_api_1.fs.removeAsync(entry.filePath);
            }
            yield vortex_api_1.fs.rmdirAsync(dirPath);
        }
        catch (err) {
            return Promise.reject(err);
        }
    });
}
function toBlue(func) {
    return (...args) => Promise.resolve(func(...args));
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInV0aWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFPQSxnREFFQztBQUVELHNDQVdDO0FBTUQsd0JBTUM7QUFFRCxzQ0FRQztBQUVELDRCQWNDO0FBRUQsb0NBV0M7QUFNRCx3QkFFQztBQWpGRCwrQ0FBcUM7QUFDckMsK0NBQWlDO0FBQ2pDLDBEQUE0RDtBQUM1RCwyQ0FBc0M7QUFJdEMsU0FBZ0Isa0JBQWtCO0lBQ2hDLE9BQU8sTUFBTSxDQUFDO0FBQ2hCLENBQUM7QUFFRCxTQUFzQixhQUFhLENBQUMsZ0JBQXdCOztRQUMxRCxJQUFJLENBQUM7WUFDSCxNQUFNLFlBQVksR0FBRyxNQUFNLGVBQUUsQ0FBQyxhQUFhLENBQUMsZ0JBQWdCLEVBQUUsRUFBRSxRQUFRLEVBQUUsT0FBTyxFQUFFLENBQUMsQ0FBQztZQUNyRixNQUFNLFFBQVEsR0FBb0IsSUFBQSxvQkFBSyxFQUFDLGlCQUFJLENBQUMsS0FBSyxDQUFDLFlBQVksQ0FBQyxDQUFvQixDQUFDO1lBQ3JGLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztnQkFDZCxNQUFNLElBQUksaUJBQUksQ0FBQyxXQUFXLENBQUMsMEJBQTBCLENBQUMsQ0FBQztZQUN6RCxDQUFDO1lBQ0QsT0FBTyxRQUFRLENBQUM7UUFDbEIsQ0FBQztRQUFDLE9BQU8sR0FBRyxFQUFFLENBQUM7WUFDYixPQUFPLE9BQU8sQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDN0IsQ0FBQztJQUNILENBQUM7Q0FBQTtBQU1ELFNBQWdCLE1BQU0sQ0FBQyxLQUFhO0lBQ2xDLElBQUksQ0FBQztRQUNILE9BQU8sSUFBSSxNQUFNLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQ2xDLENBQUM7SUFBQyxPQUFPLEdBQUcsRUFBRSxDQUFDO1FBQ2IsT0FBTyxNQUFN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ZSB9IGZyb20gJ3JlbGF4ZWQtanNvbic7XG5pbXBvcnQgKiBhcyBzZW12ZXIgZnJvbSAnc2VtdmVyJztcbmltcG9ydCB0dXJib3dhbGssIHsgSUVudHJ5LCBJV2Fsa09wdGlvbnMgfSBmcm9tICd0dXJib3dhbGsnO1xuaW1wb3J0IHsgZnMsIHV0aWwgfSBmcm9tICd2b3J0ZXgtYXBpJztcbi8vIEJsdWViaXJkIGltcG9ydCByZW1vdmVkIGR1cmluZyBtaWdyYXRpb24gdG8gbmF0aXZlIFByb21pc2VzXG5pbXBvcnQgeyBJU0RWTW9kTWFuaWZlc3QgfSBmcm9tICcuL3R5cGVzJztcblxuZXhwb3J0IGZ1bmN0aW9uIGRlZmF1bHRNb2RzUmVsUGF0aCgpOiBzdHJpbmcge1xuICByZXR1cm4gJ01vZHMnO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcGFyc2VNYW5pZmVzdChtYW5pZmVzdEZpbGVQYXRoOiBzdHJpbmcpOiBQcm9taXNlPElTRFZNb2RNYW5pZmVzdD4ge1xuICB0cnkge1xuICAgIGNvbnN0IG1hbmlmZXN0RGF0YSA9IGF3YWl0IGZzLnJlYWRGaWxlQXN5bmMobWFuaWZlc3RGaWxlUGF0aCwgeyBlbmNvZGluZzogJ3V0Zi04JyB9KTtcbiAgICBjb25zdCBtYW5pZmVzdDogSVNEVk1vZE1hbmlmZXN0ID0gcGFyc2UodXRpbC5kZUJPTShtYW5pZmVzdERhdGEpKSBhcyBJU0RWTW9kTWFuaWZlc3Q7XG4gICAgaWYgKCFtYW5pZmVzdCkge1xuICAgICAgdGhyb3cgbmV3IHV0aWwuRGF0YUludmFsaWQoJ01hbmlmZXN0IGZpbGUgaXMgaW52YWxpZCcpO1xuICAgIH1cbiAgICByZXR1cm4gbWFuaWZlc3Q7XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIHJldHVybiBQcm9taXNlLnJlamVjdChlcnIpO1xuICB9XG59XG5cbi8qKlxuICogc2VtdmVyLmNvZXJjZSBkcm9wcyBwcmUtcmVsZWFzZSBpbmZvcm1hdGlvbiBmcm9tIGFcbiAqIHBlcmZlY3RseSB2YWxpZCBzZW1hbnRpYyB2ZXJzaW9uIHN0cmluZywgZG9uJ3Qgd2FudCB0aGF0XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjb2VyY2UoaW5wdXQ6IHN0cmluZyk6IHNlbXZlci5TZW1WZXIge1xuICB0cnkge1xuICAgIHJldHVybiBuZXcgc2VtdmVyLlNlbVZlcihpbnB1dCk7XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIHJldHVybiBzZW12ZXIuY29lcmNlKGlucHV0KTtcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gc2VtdmVyQ29tcGFyZShsaHM6IHN0cmluZywgcmhzOiBzdHJpbmcpOiBudW1iZXIge1xuICBjb25zdCBsID0gY29lcmNlKGxocyk7XG4gIGNvbnN0IHIgPSBjb2VyY2UocmhzKTtcbiAgaWYgKChsICE9PSBudWxsKSAmJiAociAhPT0gbnVsbCkpIHtcbiAgICByZXR1cm4gc2VtdmVyLmNvbXBhcmUobCwgcik7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIGxocy5sb2NhbGVDb21wYXJlKHJocywgJ2VuLVVTJyk7XG4gIH1cbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHdhbGtQYXRoKGRpclBhdGg6IHN0cmluZywgd2Fsa09wdGlvbnM/OiBJV2Fsa09wdGlvbnMpOiBQcm9taXNlPElFbnRyeVtdPiB7XG4gIHdhbGtPcHRpb25zID0gISF3YWxrT3B0aW9uc1xuICAgID8geyAuLi53YWxrT3B0aW9ucywgc2tpcEhpZGRlbjogdHJ1ZSwgc2tpcEluYWNjZXNzaWJsZTogdHJ1ZSwgc2tpcExpbmtzOiB0cnVlIH1cbiAgICA6IHsgc2tpcExpbmtzOiB0cnVlLCBza2lwSGlkZGVuOiB0cnVlLCBza2lwSW5hY2Nlc3NpYmxlOiB0cnVlIH07XG4gIGNvbnN0IHdhbGtSZXN1bHRzOiBJRW50cnlbXSA9IFtdO1xuICByZXR1cm4gbmV3IFByb21pc2U8SUVudHJ5W10+KGFzeW5jIChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICBhd2FpdCB0dXJib3dhbGsoZGlyUGF0aCwgKGVudHJpZXM6IElFbnRyeVtdKSA9PiB7XG4gICAgICB3YWxrUmVzdWx0cy5wdXNoKC4uLmVudHJpZXMpO1xuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpIGFzIGFueTtcbiAgICAgIC8vIElmIHRoZSBkaXJlY3RvcnkgaXMgbWlzc2luZyB3aGVuIHdlIHRyeSB0byB3YWxrIGl0OyBpdCdzIG1vc3QgcHJvYmFibHkgZG93biB0byBhIGNvbGxlY3Rpb24gYmVpbmdcbiAgICAgIC8vICBpbiB0aGUgcHJvY2VzcyBvZiBiZWluZyBpbnN0YWxsZWQvcmVtb3ZlZC4gV2UgY2FuIHNhZmVseSBpZ25vcmUgdGhpcy5cbiAgICB9LCB3YWxrT3B0aW9ucykuY2F0Y2goZXJyID0+IGVyci5jb2RlID09PSAnRU5PRU5UJyA/IFByb21pc2UucmVzb2x2ZSgpIDogUHJvbWlzZS5yZWplY3QoZXJyKSk7XG4gICAgcmV0dXJuIHJlc29sdmUod2Fsa1Jlc3VsdHMpO1xuICB9KTtcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGRlbGV0ZUZvbGRlcihkaXJQYXRoOiBzdHJpbmcsIHdhbGtPcHRpb25zPzogSVdhbGtPcHRpb25zKTogUHJvbWlzZTx2b2lkPiB7XG4gIHRyeSB7XG4gICAgY29uc3QgZW50cmllcyA9IGF3YWl0IHdhbGtQYXRoKGRpclBhdGgsIHdhbGtPcHRpb25zKTtcbiAgICBlbnRyaWVzLnNvcnQoKGEsIGIpID0+IGIuZmlsZVBhdGgubGVuZ3RoIC0gYS5maWxlUGF0aC5sZW5ndGgpO1xuICAgIGZvciAoY29uc3QgZW50cnkgb2YgZW50cmllcykge1xuICAgICAgYXdhaXQgZnMucmVtb3ZlQXN5bmMoZW50cnkuZmlsZVBhdGgpO1xuICAgIH1cbiAgICBhd2FpdCBmcy5ybWRpckFzeW5jKGRpclBhdGgpO1xuICB9IGNhdGNoIChlcnIpIHtcbiAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoZXJyKTtcbiAgfVxufVxuXG4vKipcbiAqIHRvQmx1ZSBpcyBhIG1pZ3JhdGlvbiBmdW5jdGlvbiB0aGF0IGNvbnZlcnRzIFByb21pc2U8VD4gdG8gUHJvbWlzZTxUPiBmb3IgY29tcGF0aWJpbGl0eVxuICogd2l0aCB0aGUgVm9ydGV4IEFQSSBkdXJpbmcgdGhlIEJsdWViaXJkIHRvIG5hdGl2ZSBQcm9taXNlIG1pZ3JhdGlvbi5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHRvQmx1ZTxUPihmdW5jOiAoLi4uYXJnczogYW55W10pID0+IFByb21pc2U8VD4pOiAoLi4uYXJnczogYW55W10pID0+IFByb21pc2U8VD4ge1xuICByZXR1cm4gKC4uLmFyZ3M6IGFueVtdKSA9PiBQcm9taXNlLnJlc29sdmUoZnVuYyguLi5hcmdzKSk7XG59XG4iXX0=