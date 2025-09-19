const { isWindows } = require('vortex-api');
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
exports.hex2Buffer = exports.restoreFileData = exports.cleanUpEntries = exports.prepareFileData = exports.walkDirPath = exports.genCollectionLoadOrder = exports.isModInCollection = exports.isValidMod = exports.CollectionParseError = exports.CollectionGenerateError = void 0;
const path_1 = __importDefault(require("path"));
const shortid_1 = require("shortid");
const turbowalk_1 = __importDefault(require("turbowalk"));
const vortex_api_1 = require("vortex-api");
const common_1 = require("../common");
class CollectionGenerateError extends Error {
    constructor(why) {
        super(`Failed to generate game specific data for collection: ${why}`);
        this.name = 'CollectionGenerateError';
    }
}
exports.CollectionGenerateError = CollectionGenerateError;
class CollectionParseError extends Error {
    constructor(collectionName, why) {
        super(`Failed to parse game specific data for collection ${collectionName}: ${why}`);
        this.name = 'CollectionGenerateError';
    }
}
exports.CollectionParseError = CollectionParseError;
function isValidMod(mod) {
    return (mod !== undefined) && (mod.type !== 'collection');
}
exports.isValidMod = isValidMod;
function isModInCollection(collectionMod, mod) {
    if (collectionMod.rules === undefined) {
        return false;
    }
    return collectionMod.rules.find(rule => vortex_api_1.util.testModReference(mod, rule.reference)) !== undefined;
}
exports.isModInCollection = isModInCollection;
function genCollectionLoadOrder(loadOrder, mods, collection) {
    const sortedMods = loadOrder.filter(entry => {
        const isLocked = entry.modId.includes(common_1.LOCKED_PREFIX);
        return isLocked || ((collection !== undefined)
            ? isValidMod(mods[entry.modId]) && (isModInCollection(collection, mods[entry.modId]))
            : isValidMod(mods[entry.modId]));
    })
        .sort((lhs, rhs) => lhs.data.prefix - rhs.data.prefix)
        .reduce((accum, iter, idx) => {
        accum.push(iter);
        return accum;
    }, []);
    return sortedMods;
}
exports.genCollectionLoadOrder = genCollectionLoadOrder;
function walkDirPath(dirPath) {
    return __awaiter(this, void 0, void 0, function* () {
        let fileEntries = [];
        yield (0, turbowalk_1.default)(dirPath, (entries) => {
            fileEntries = fileEntries.concat(entries);
        })
            .catch({ systemCode: 3 }, () => Promise.resolve())
            .catch(err => ['ENOTFOUND', 'ENOENT'].includes(err.code)
            ? Promise.resolve() : Promise.reject(err));
        return fileEntries;
    });
}
exports.walkDirPath = walkDirPath;
function prepareFileData(dirPath) {
    return __awaiter(this, void 0, void 0, function* () {
        const sevenZip = new vortex_api_1.util.SevenZip();
        try {
            yield vortex_api_1.fs.ensureDirWritableAsync(common_1.W3_TEMP_DATA_DIR);
            const archivePath = path_1.default.join(common_1.W3_TEMP_DATA_DIR, (0, shortid_1.generate)() + '.zip');
            const entries = yield vortex_api_1.fs.readdirAsync(dirPath);
            yield sevenZip.add(archivePath, entries.map(entry => path_1.default.join(dirPath, entry)), { raw: ['-r'] });
            const data = yield vortex_api_1.fs.readFileAsync(archivePath);
            yield vortex_api_1.fs.removeAsync(archivePath);
            return data;
        }
        catch (err) {
            return Promise.reject(err);
        }
    });
}
exports.prepareFileData = prepareFileData;
function cleanUpEntries(fileEntries) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            fileEntries.sort((lhs, rhs) => rhs.filePath.length - lhs.filePath.length);
            for (const entry of fileEntries) {
                yield vortex_api_1.fs.removeAsync(entry.filePath);
            }
        }
        catch (err) {
            (0, vortex_api_1.log)('error', 'file entry cleanup failed', err);
        }
    });
}
exports.cleanUpEntries = cleanUpEntries;
function restoreFileData(fileData, destination) {
    return __awaiter(this, void 0, void 0, function* () {
        const sevenZip = new vortex_api_1.util.SevenZip();
        let archivePath;
        let fileEntries = [];
        try {
            yield vortex_api_1.fs.ensureDirWritableAsync(common_1.W3_TEMP_DATA_DIR);
            archivePath = path_1.default.join(common_1.W3_TEMP_DATA_DIR, (0, shortid_1.generate)() + '.zip');
            yield vortex_api_1.fs.writeFileAsync(archivePath, fileData);
            const targetDirPath = path_1.default.join(common_1.W3_TEMP_DATA_DIR, path_1.default.basename(archivePath, '.zip'));
            yield sevenZip.extractFull(archivePath, targetDirPath);
            fileEntries = yield walkDirPath(targetDirPath);
            for (const entry of fileEntries) {
                const relPath = path_1.default.relative(targetDirPath, entry.filePath);
                const dest = path_1.default.join(destination, relPath);
                yield vortex_api_1.fs.ensureDirWritableAsync(path_1.default.dirname(dest));
                yield vortex_api_1.fs.copyAsync(entry.filePath, dest);
            }
            cleanUpEntries(fileEntries);
            return Promise.resolve();
        }
        catch (err) {
            cleanUpEntries(fileEntries);
            return Promise.reject(err);
        }
    });
}
exports.restoreFileData = restoreFileData;
function hex2Buffer(hexData) {
    const byteArray = new Uint8Array(hexData.length / 2);
    for (let x = 0; x < byteArray.length; x++) {
        byteArray[x] = parseInt(hexData.substr(x * 2, 2), 16);
    }
    const buffer = Buffer.from(byteArray);
    return buffer;
}
exports.hex2Buffer = hex2Buffer;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInV0aWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7O0FBQ0EsZ0RBQXdCO0FBQ3hCLHFDQUFtQztBQUNuQywwREFBOEM7QUFDOUMsMkNBQWtEO0FBRWxELHNDQUE0RDtBQUU1RCxNQUFhLHVCQUF3QixTQUFRLEtBQUs7SUFDaEQsWUFBWSxHQUFXO1FBQ3JCLEtBQUssQ0FBQyx5REFBeUQsR0FBRyxFQUFFLENBQUMsQ0FBQztRQUN0RSxJQUFJLENBQUMsSUFBSSxHQUFHLHlCQUF5QixDQUFDO0lBQ3hDLENBQUM7Q0FDRjtBQUxELDBEQUtDO0FBRUQsTUFBYSxvQkFBcUIsU0FBUSxLQUFLO0lBQzdDLFlBQVksY0FBc0IsRUFBRSxHQUFXO1FBQzdDLEtBQUssQ0FBQyxxREFBcUQsY0FBYyxLQUFLLEdBQUcsRUFBRSxDQUFDLENBQUM7UUFDckYsSUFBSSxDQUFDLElBQUksR0FBRyx5QkFBeUIsQ0FBQztJQUN4QyxDQUFDO0NBQ0Y7QUFMRCxvREFLQztBQUVELFNBQWdCLFVBQVUsQ0FBQyxHQUFlO0lBQ3hDLE9BQU8sQ0FBQyxHQUFHLEtBQUssU0FBUyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxLQUFLLFlBQVksQ0FBQyxDQUFDO0FBQzVELENBQUM7QUFGRCxnQ0FFQztBQUVELFNBQWdCLGlCQUFpQixDQUFDLGFBQXlCLEVBQUUsR0FBZTtJQUMxRSxJQUFJLGFBQWEsQ0FBQyxLQUFLLEtBQUssU0FBUyxFQUFFO1FBQ3JDLE9BQU8sS0FBSyxDQUFDO0tBQ2Q7SUFFRCxPQUFPLGFBQWEsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQ3JDLGlCQUFJLENBQUMsZ0JBQWdCLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxLQUFLLFNBQVMsQ0FBQztBQUM5RCxDQUFDO0FBUEQsOENBT0M7QUFFRCxTQUFnQixzQkFB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Q0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7S0FDdkQ7SUFFRCxNQUFNLE1BQU0sR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDO0lBQ3RDLE9BQU8sTUFBTSxDQUFDO0FBQ2hCLENBQUM7QUFSRCxnQ0FRQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKiBlc2xpbnQtZGlzYWJsZSAqL1xuaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgeyBnZW5lcmF0ZSB9IGZyb20gJ3Nob3J0aWQnO1xuaW1wb3J0IHR1cmJvd2FsaywgeyBJRW50cnkgfSBmcm9tICd0dXJib3dhbGsnO1xuaW1wb3J0IHsgZnMsIGxvZywgdHlwZXMsIHV0aWwgfSBmcm9tICd2b3J0ZXgtYXBpJztcblxuaW1wb3J0IHsgTE9DS0VEX1BSRUZJWCwgVzNfVEVNUF9EQVRBX0RJUiB9IGZyb20gJy4uL2NvbW1vbic7XG5cbmV4cG9ydCBjbGFzcyBDb2xsZWN0aW9uR2VuZXJhdGVFcnJvciBleHRlbmRzIEVycm9yIHtcbiAgY29uc3RydWN0b3Iod2h5OiBzdHJpbmcpIHtcbiAgICBzdXBlcihgRmFpbGVkIHRvIGdlbmVyYXRlIGdhbWUgc3BlY2lmaWMgZGF0YSBmb3IgY29sbGVjdGlvbjogJHt3aHl9YCk7XG4gICAgdGhpcy5uYW1lID0gJ0NvbGxlY3Rpb25HZW5lcmF0ZUVycm9yJztcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgQ29sbGVjdGlvblBhcnNlRXJyb3IgZXh0ZW5kcyBFcnJvciB7XG4gIGNvbnN0cnVjdG9yKGNvbGxlY3Rpb25OYW1lOiBzdHJpbmcsIHdoeTogc3RyaW5nKSB7XG4gICAgc3VwZXIoYEZhaWxlZCB0byBwYXJzZSBnYW1lIHNwZWNpZmljIGRhdGEgZm9yIGNvbGxlY3Rpb24gJHtjb2xsZWN0aW9uTmFtZX06ICR7d2h5fWApO1xuICAgIHRoaXMubmFtZSA9ICdDb2xsZWN0aW9uR2VuZXJhdGVFcnJvcic7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzVmFsaWRNb2QobW9kOiB0eXBlcy5JTW9kKSB7XG4gIHJldHVybiAobW9kICE9PSB1bmRlZmluZWQpICYmIChtb2QudHlwZSAhPT0gJ2NvbGxlY3Rpb24nKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzTW9kSW5Db2xsZWN0aW9uKGNvbGxlY3Rpb25Nb2Q6IHR5cGVzLklNb2QsIG1vZDogdHlwZXMuSU1vZCkge1xuICBpZiAoY29sbGVjdGlvbk1vZC5ydWxlcyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgcmV0dXJuIGNvbGxlY3Rpb25Nb2QucnVsZXMuZmluZChydWxlID0+XG4gICAgdXRpbC50ZXN0TW9kUmVmZXJlbmNlKG1vZCwgcnVsZS5yZWZlcmVuY2UpKSAhPT0gdW5kZWZpbmVkO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2VuQ29sbGVjdGlvbkxvYWRPcmRlcihsb2FkT3JkZXI6IHR5cGVzLklGQkxPTG9hZE9yZGVyRW50cnlbXSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1vZHM6IHsgW21vZElkOiBzdHJpbmddOiB0eXBlcy5JTW9kIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb2xsZWN0aW9uPzogdHlwZXMuSU1vZCk6IHR5cGVzLkxvYWRPcmRlciB7XG4gIGNvbnN0IHNvcnRlZE1vZHMgPSBsb2FkT3JkZXIuZmlsdGVyKGVudHJ5ID0+IHtcbiAgICBjb25zdCBpc0xvY2tlZCA9IGVudHJ5Lm1vZElkLmluY2x1ZGVzKExPQ0tFRF9QUkVGSVgpO1xuICAgIHJldHVybiBpc0xvY2tlZCB8fCAoKGNvbGxlY3Rpb24gIT09IHVuZGVmaW5lZClcbiAgICAgID8gaXNWYWxpZE1vZChtb2RzW2VudHJ5Lm1vZElkXSkgJiYgKGlzTW9kSW5Db2xsZWN0aW9uKGNvbGxlY3Rpb24sIG1vZHNbZW50cnkubW9kSWRdKSlcbiAgICAgIDogaXNWYWxpZE1vZChtb2RzW2VudHJ5Lm1vZElkXSkpO1xuICB9KVxuICAgIC5zb3J0KChsaHMsIHJocykgPT4gbGhzLmRhdGEucHJlZml4IC0gcmhzLmRhdGEucHJlZml4KVxuICAgIC5yZWR1Y2UoKGFjY3VtLCBpdGVyLCBpZHgpID0+IHtcbiAgICAgIGFjY3VtLnB1c2goaXRlcik7XG4gICAgICByZXR1cm4gYWNjdW07XG4gICAgfSwgW10pO1xuICByZXR1cm4gc29ydGVkTW9kcztcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHdhbGtEaXJQYXRoKGRpclBhdGg6IHN0cmluZyk6IFByb21pc2U8SUVudHJ5W10+IHtcbiAgbGV0IGZpbGVFbnRyaWVzOiBJRW50cnlbXSA9IFtdO1xuICBhd2FpdCB0dXJib3dhbGsoZGlyUGF0aCwgKGVudHJpZXM6IElFbnRyeVtdKSA9PiB7XG4gICAgZmlsZUVudHJpZXMgPSBmaWxlRW50cmllcy5jb25jYXQoZW50cmllcyk7XG4gIH0pXG4gICAgLmNhdGNoKHsgc3lzdGVtQ29kZTogMyB9LCAoKSA9PiBQcm9taXNlLnJlc29sdmUoKSlcbiAgICAuY2F0Y2goZXJyID0+IFsnRU5PVEZPVU5EJywgJ0VOT0VOVCddLmluY2x1ZGVzKGVyci5jb2RlKVxuICAgICAgPyBQcm9taXNlLnJlc29sdmUoKSA6IFByb21pc2UucmVqZWN0KGVycikpO1xuXG4gIHJldHVybiBmaWxlRW50cmllcztcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHByZXBhcmVGaWxlRGF0YShkaXJQYXRoOiBzdHJpbmcpOiBQcm9taXNlPEJ1ZmZlcj4ge1xuICBjb25zdCBzZXZlblppcCA9IG5ldyB1dGlsLlNldmVuWmlwKCk7XG4gIHRyeSB7XG4gICAgYXdhaXQgZnMuZW5zdXJlRGlyV3JpdGFibGVBc3luYyhXM19URU1QX0RBVEFfRElSKTtcbiAgICBjb25zdCBhcmNoaXZlUGF0aCA9IHBhdGguam9pbihXM19URU1QX0RBVEFfRElSLCBnZW5lcmF0ZSgpICsgJy56aXAnKTtcbiAgICBjb25zdCBlbnRyaWVzOiBzdHJpbmdbXSA9IGF3YWl0IGZzLnJlYWRkaXJBc3luYyhkaXJQYXRoKTtcbiAgICBhd2FpdCBzZXZlblppcC5hZGQoYXJjaGl2ZVBhdGgsIGVudHJpZXMubWFwKGVudHJ5ID0+XG4gICAgICBwYXRoLmpvaW4oZGlyUGF0aCwgZW50cnkpKSwgeyByYXc6IFsnLXInXSB9KTtcblxuICAgIGNvbnN0IGRhdGEgPSBhd2FpdCBmcy5yZWFkRmlsZUFzeW5jKGFyY2hpdmVQYXRoKTtcbiAgICBhd2FpdCBmcy5yZW1vdmVBc3luYyhhcmNoaXZlUGF0aCk7XG4gICAgcmV0dXJuIGRhdGE7XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIHJldHVybiBQcm9taXNlLnJlamVjdChlcnIpO1xuICB9XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBjbGVhblVwRW50cmllcyhmaWxlRW50cmllczogSUVudHJ5W10pIHtcbiAgdHJ5IHtcbiAgICBmaWxlRW50cmllcy5zb3J0KChsaHMsIHJocykgPT4gcmhzLmZpbGVQYXRoLmxlbmd0aCAtIGxocy5maWxlUGF0aC5sZW5ndGgpO1xuICAgIGZvciAoY29uc3QgZW50cnkgb2YgZmlsZUVudHJpZXMpIHtcbiAgICAgIGF3YWl0IGZzLnJlbW92ZUFzeW5jKGVudHJ5LmZpbGVQYXRoKTtcbiAgICB9XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIGxvZygnZXJyb3InLCAnZmlsZSBlbnRyeSBjbGVhbnVwIGZhaWxlZCcsIGVycik7XG4gIH1cbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHJlc3RvcmVGaWxlRGF0YShmaWxlRGF0YTogQnVmZmVyLCBkZXN0aW5hdGlvbjogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gIGNvbnN0IHNldmVuWmlwID0gbmV3IHV0aWwuU2V2ZW5aaXAoKTtcbiAgbGV0IGFyY2hpdmVQYXRoO1xuICBsZXQgZmlsZUVudHJpZXM6IElFbnRyeVtdID0gW107XG4gIHRyeSB7XG4gICAgYXdhaXQgZnMuZW5zdXJlRGlyV3JpdGFibGVBc3luYyhXM19URU1QX0RBVEFfRElSKTtcbiAgICBhcmNoaXZlUGF0aCA9IHBhdGguam9pbihXM19URU1QX0RBVEFfRElSLCBnZW5lcmF0ZSgpICsgJy56aXAnKTtcbiAgICBhd2FpdCBmcy53cml0ZUZpbGVBc3luYyhhcmNoaXZlUGF0aCwgZmlsZURhdGEpO1xuICAgIGNvbnN0IHRhcmdldERpclBhdGggPSBwYXRoLmpvaW4oVzNfVEVNUF9EQVRBX0RJUiwgcGF0aC5iYXNlbmFtZShhcmNoaXZlUGF0aCwgJy56aXAnKSk7XG4gICAgYXdhaXQgc2V2ZW5aaXAuZXh0cmFjdEZ1bGwoYXJjaGl2ZVBhdGgsIHRhcmdldERpclBhdGgpO1xuICAgIGZpbGVFbnRyaWVzID0gYXdhaXQgd2Fsa0RpclBhdGgodGFyZ2V0RGlyUGF0aCk7XG4gICAgZm9yIChjb25zdCBlbnRyeSBvZiBmaWxlRW50cmllcykge1xuICAgICAgY29uc3QgcmVsUGF0aCA9IHBhdGgucmVsYXRpdmUodGFyZ2V0RGlyUGF0aCwgZW50cnkuZmlsZVBhdGgpO1xuICAgICAgY29uc3QgZGVzdCA9IHBhdGguam9pbihkZXN0aW5hdGlvbiwgcmVsUGF0aCk7XG4gICAgICBhd2FpdCBmcy5lbnN1cmVEaXJXcml0YWJsZUFzeW5jKHBhdGguZGlybmFtZShkZXN0KSk7XG4gICAgICBhd2FpdCBmcy5jb3B5QXN5bmMoZW50cnkuZmlsZVBhdGgsIGRlc3QpO1xuICAgIH1cbiAgICBjbGVhblVwRW50cmllcyhmaWxlRW50cmllcyk7XG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xuICB9IGNhdGNoIChlcnIpIHtcbiAgICBjbGVhblVwRW50cmllcyhmaWxlRW50cmllcyk7XG4gICAgcmV0dXJuIFByb21pc2UucmVqZWN0KGVycik7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGhleDJCdWZmZXIoaGV4RGF0YTogc3RyaW5nKSB7XG4gIGNvbnN0IGJ5dGVBcnJheSA9IG5ldyBVaW50OEFycmF5KGhleERhdGEubGVuZ3RoIC8gMik7XG4gIGZvciAobGV0IHggPSAwOyB4IDwgYnl0ZUFycmF5Lmxlbmd0aDsgeCsrKSB7XG4gICAgYnl0ZUFycmF5W3hdID0gcGFyc2VJbnQoaGV4RGF0YS5zdWJzdHIoeCAqIDIsIDIpLCAxNik7XG4gIH1cblxuICBjb25zdCBidWZmZXIgPSBCdWZmZXIuZnJvbShieXRlQXJyYXkpO1xuICByZXR1cm4gYnVmZmVyO1xufVxuIl19