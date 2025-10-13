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
exports.ModLimitPatcher = void 0;
const lodash_1 = __importDefault(require("lodash"));
const path_1 = __importDefault(require("path"));
const vortex_api_1 = require("vortex-api");
const actions_1 = require("./actions");
const common_1 = require("./common");
const RANGE_START = 0xB94000;
const RANGE_END = 0xB98000;
const UNPATCHED_SEQ = [0xBA, 0xC0, 0x00, 0x00, 0x00, 0x48, 0x8D, 0x4B];
const PATCHED_SEQ = [0xBA, 0xF4, 0x01, 0x00, 0x00, 0x48, 0x8D, 0x4B];
const OFFSET = 65536;
class ModLimitPatcher {
    constructor(api) {
        this.mApi = api;
        this.mIsPatched = false;
    }
    ensureModLimitPatch() {
        return __awaiter(this, void 0, void 0, function* () {
            const state = this.mApi.getState();
            const game = vortex_api_1.selectors.gameById(state, common_1.GAME_ID);
            const discovery = state.settings.gameMode.discovered[common_1.GAME_ID];
            if (!(discovery === null || discovery === void 0 ? void 0 : discovery.path)) {
                throw new vortex_api_1.util.ProcessCanceled('Game is not discovered');
            }
            yield this.queryPatch();
            const stagingPath = vortex_api_1.selectors.installPathForGame(state, common_1.GAME_ID);
            const modName = 'Mod Limit Patcher';
            let mod = vortex_api_1.util.getSafe(state, ['persistent', 'mods', common_1.GAME_ID, modName], undefined);
            if (mod === undefined) {
                try {
                    yield this.createModLimitPatchMod(modName);
                    mod = vortex_api_1.util.getSafe(this.mApi.getState(), ['persistent', 'mods', common_1.GAME_ID, modName], undefined);
                }
                catch (err) {
                    return Promise.reject(err);
                }
            }
            try {
                const src = path_1.default.join(discovery.path, game.executable);
                const dest = path_1.default.join(stagingPath, mod.installationPath, game.executable);
                yield vortex_api_1.fs.removeAsync(dest)
                    .catch(err => ['ENOENT'].includes(err.code) ? Promise.resolve() : Promise.reject(err));
                yield vortex_api_1.fs.copyAsync(src, dest);
                const tempFile = dest + '.tmp';
                yield this.streamExecutable(RANGE_START, RANGE_END, dest, tempFile);
                yield vortex_api_1.fs.removeAsync(dest);
                yield vortex_api_1.fs.renameAsync(tempFile, dest);
                this.mApi.sendNotification({
                    message: 'Patch generated successfully',
                    type: 'success',
                    displayMS: 5000,
                });
            }
            catch (err) {
                const allowReport = !(err instanceof vortex_api_1.util.UserCanceled);
                this.mApi.showErrorNotification('Failed to generate mod limit patch', err, { allowReport });
                this.mApi.events.emit('remove-mod', common_1.GAME_ID, modName);
                return Promise.resolve(undefined);
            }
            return Promise.resolve(modName);
        });
    }
    getLimitText(t) {
        return t('Witcher 3 is restricted to 192 file handles which is quickly reached when '
            + 'adding mods (about ~25 mods) - Vortex has detected that the current mods environment may be '
            + 'breaching this limit; this issue will usually exhibit itself by the game failing to start up.{{bl}}'
            + 'Vortex can attempt to patch your game executable to increase the available file handles to 500 '
            + 'which should cater for most if not all modding environments.{{bl}}Please note - the patch is applied as '
            + 'a mod which will be generated and automatically enabled; to disable the patch, simply remove or disable '
            + 'the "Witcher 3 Mod Limit Patcher" mod and the original game executable will be restored.', { ns: common_1.I18N_NAMESPACE, replace: { bl: '[br][/br][br][/br]', br: '[br][/br]' } });
    }
    queryPatch() {
        return __awaiter(this, void 0, void 0, function* () {
            const t = this.mApi.translate;
            const message = this.getLimitText(t);
            const res = yield this.mApi.showDialog('question', 'Mod Limit Patch', {
                bbcode: message,
                checkboxes: [
                    { id: 'suppress-limit-patcher-test', text: 'Do not ask again', value: false }
                ],
            }, [
                { label: 'Cancel' },
                { label: 'Generate Patch' },
            ]);
            if (res.input['suppress-limit-patcher-test'] === true) {
                this.mApi.store.dispatch((0, actions_1.setSuppressModLimitPatch)(true));
            }
            if (res.action === 'Cancel') {
                throw new vortex_api_1.util.UserCanceled();
            }
            return Promise.resolve();
        });
    }
    createModLimitPatchMod(modName) {
        const mod = {
            id: modName,
            state: 'installed',
            attributes: {
                name: 'Mod Limit Patcher',
                description: 'Witcher 3 is restricted to 192 file handles which is quickly reached when '
                    + 'adding mods (about ~25 mods) - this mod increases the limit to 500',
                logicalFileName: 'Witcher 3 Mod Limit Patcher',
                modId: 42,
                version: '1.0.0',
                installTime: new Date(),
            },
            installationPath: modName,
            type: 'w3modlimitpatcher',
        };
        return new Promise((resolve, reject) => {
            this.mApi.events.emit('create-mod', common_1.GAME_ID, mod, (error) => __awaiter(this, void 0, void 0, function* () {
                if (error !== null) {
                    return reject(error);
                }
                const profileId = vortex_api_1.selectors.lastActiveProfileForGame(this.mApi.getState(), common_1.GAME_ID);
                this.mApi.store.dispatch(vortex_api_1.actions.setModEnabled(profileId, modName, true));
                return resolve();
            }));
        });
    }
    hasSequence(sequence, chunk) {
        const firstSeqByte = sequence[0];
        let foundSeq = false;
        let iter = 0;
        while (iter < chunk.length) {
            if (!foundSeq && chunk[iter] === firstSeqByte) {
                const subArray = lodash_1.default.cloneDeep(Array.from(chunk.slice(iter, iter + sequence.length)));
                foundSeq = lodash_1.default.isEqual(sequence, Buffer.from(subArray));
            }
            iter++;
        }
        return foundSeq;
    }
    patchChunk(chunk) {
        const idx = chunk.indexOf(Buffer.from(UNPATCHED_SEQ));
        const patchedBuffer = Buffer.from(PATCHED_SEQ);
        const data = Buffer.alloc(chunk.length);
        data.fill(chunk.slice(0, idx), 0, idx);
        data.fill(patchedBuffer, idx, idx + patchedBuffer.length);
        data.fill(chunk.slice(idx + patchedBuffer.length), idx + patchedBuffer.length);
        return data;
    }
    streamExecutable(start, end, filePath, tempPath) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                const writer = vortex_api_1.fs.createWriteStream(tempPath);
                const stream = vortex_api_1.fs.createReadStream(filePath);
                const unpatched = Buffer.from(UNPATCHED_SEQ);
                const patched = Buffer.from(PATCHED_SEQ);
                const onError = (err) => {
                    this.mIsPatched = false;
                    writer.end();
                    if (!stream.destroyed) {
                        stream.close();
                    }
                    return reject(err);
                };
                stream.on('end', () => {
                    this.mIsPatched = false;
                    writer.end();
                    return resolve();
                });
                stream.on('error', onError);
                stream.on('data', ((chunk) => {
                    if (this.mIsPatched || (stream.bytesRead + OFFSET) < start || stream.bytesRead > end + OFFSET) {
                        writer.write(chunk);
                    }
                    else {
                        if (this.hasSequence(unpatched, chunk)) {
                            const patchedBuffer = this.patchChunk(chunk);
                            writer.write(patchedBuffer);
                            this.mIsPatched = true;
                        }
                        else if (this.hasSequence(patched, chunk)) {
                            this.mIsPatched = true;
                            writer.write(chunk);
                        }
                        else {
                            writer.write(chunk);
                        }
                    }
                }));
            });
        });
    }
}
exports.ModLimitPatcher = ModLimitPatcher;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibW9kTGltaXRQYXRjaC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIm1vZExpbWl0UGF0Y2gudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7O0FBQ0Esb0RBQXVCO0FBQ3ZCLGdEQUF3QjtBQUN4QiwyQ0FBaUU7QUFFakUsdUNBQXFEO0FBRXJELHFDQUFtRDtBQU9uRCxNQUFNLFdBQVcsR0FBRyxRQUFRLENBQUM7QUFDN0IsTUFBTSxTQUFTLEdBQUcsUUFBUSxDQUFDO0FBRTNCLE1BQU0sYUFBYSxHQUFHLENBQUMsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO0FBQ3ZFLE1BQU0sV0FBVyxHQUFHLENBQUMsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO0FBRXJFLE1BQU0sTUFBTSxHQUFHLEtBQUssQ0FBQztBQUVyQixNQUFhLGVBQWU7SUFJMUIsWUFBWSxHQUF3QjtRQUNsQyxJQUFJLENBQUMsSUFBSSxHQUFHLEdBQUcsQ0FBQztRQUNoQixJQUFJLENBQUMsVUFBVSxHQUFHLEtBQUssQ0FBQztJQUMxQixDQUFDO0lBRVksbUJBQW1COztZQUM5QixNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDO1lBQ25DLE1BQU0sSUFBSSxHQUFzQixzQkFBUyxDQUFDLFFBQVEsQ0FBQyxLQUFLLEVBQUUsZ0JBQU8sQ0FBQyxDQUFDO1lBQ25FLE1BQU0sU0FBUyxHQUFHLEtBQUssQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLFVBQVUsQ0FBQyxnQkFBTyxDQUFDLENBQUM7WUFDOUQsSUFBSSxDQUFDLENBQUEsU0FBUyxhQUFULFNBQVMsdUJBQVQsU0FBUyxDQUFFLElBQUksQ0FBQSxFQUFF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QUMsQ0FBQztZQUNOLENBQUMsQ0FBQyxDQUFDO1FBQ0wsQ0FBQztLQUFBO0NBQ0Y7QUF2TEQsMENBdUxDIiwic291cmNlc0NvbnRlbnQiOlsiLyogZXNsaW50LWRpc2FibGUgKi9cbmltcG9ydCBfIGZyb20gJ2xvZGFzaCc7XG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcbmltcG9ydCB7IGFjdGlvbnMsIGZzLCBzZWxlY3RvcnMsIHR5cGVzLCB1dGlsIH0gZnJvbSAndm9ydGV4LWFwaSc7XG5cbmltcG9ydCB7IHNldFN1cHByZXNzTW9kTGltaXRQYXRjaCB9IGZyb20gJy4vYWN0aW9ucyc7XG5cbmltcG9ydCB7IEdBTUVfSUQsIEkxOE5fTkFNRVNQQUNFIH0gZnJvbSAnLi9jb21tb24nO1xuXG4vKipcbiAqIFRoZW9yZXRpY2FsbHkgdGhlIG1vZCBsaW1pdCBwYXRjaGVyIGlzIG5vIGxvbmdlciBuZWVkZWQgKENEUFIgcmFpc2VkIHRoZSBmaWxlIGhhbmRsZSBsaW1pdClcbiAqICBidXQgd2Ugd2lsbCBzdGlsbCBrZWVwIHRoaXMgZnVuY3Rpb25hbGl0eSBpbiBjYXNlIGl0IGlzIG5lZWRlZCBpbiB0aGUgZnV0dXJlLlxuICovXG5cbmNvbnN0IFJBTkdFX1NUQVJUID0gMHhCOTQwMDA7XG5jb25zdCBSQU5HRV9FTkQgPSAweEI5ODAwMDtcblxuY29uc3QgVU5QQVRDSEVEX1NFUSA9IFsweEJBLCAweEMwLCAweDAwLCAweDAwLCAweDAwLCAweDQ4LCAweDhELCAweDRCXTtcbmNvbnN0IFBBVENIRURfU0VRID0gWzB4QkEsIDB4RjQsIDB4MDEsIDB4MDAsIDB4MDAsIDB4NDgsIDB4OEQsIDB4NEJdO1xuXG5jb25zdCBPRkZTRVQgPSA2NTUzNjtcblxuZXhwb3J0IGNsYXNzIE1vZExpbWl0UGF0Y2hlciB7XG4gIHByaXZhdGUgbUFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaTtcbiAgcHJpdmF0ZSBtSXNQYXRjaGVkOiBib29sZWFuO1xuXG4gIGNvbnN0cnVjdG9yKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSkge1xuICAgIHRoaXMubUFwaSA9IGFwaTtcbiAgICB0aGlzLm1Jc1BhdGNoZWQgPSBmYWxzZTtcbiAgfVxuXG4gIHB1YmxpYyBhc3luYyBlbnN1cmVNb2RMaW1pdFBhdGNoKCkge1xuICAgIGNvbnN0IHN0YXRlID0gdGhpcy5tQXBpLmdldFN0YXRlKCk7XG4gICAgY29uc3QgZ2FtZTogdHlwZXMuSUdhbWVTdG9yZWQgPSBzZWxlY3RvcnMuZ2FtZUJ5SWQoc3RhdGUsIEdBTUVfSUQpO1xuICAgIGNvbnN0IGRpc2NvdmVyeSA9IHN0YXRlLnNldHRpbmdzLmdhbWVNb2RlLmRpc2NvdmVyZWRbR0FNRV9JRF07XG4gICAgaWYgKCFkaXNjb3Zlcnk/LnBhdGgpIHtcbiAgICAgIHRocm93IG5ldyB1dGlsLlByb2Nlc3NDYW5jZWxlZCgnR2FtZSBpcyBub3QgZGlzY292ZXJlZCcpO1xuICAgIH1cbiAgICBhd2FpdCB0aGlzLnF1ZXJ5UGF0Y2goKTtcbiAgICBjb25zdCBzdGFnaW5nUGF0aCA9IHNlbGVjdG9ycy5pbnN0YWxsUGF0aEZvckdhbWUoc3RhdGUsIEdBTUVfSUQpO1xuICAgIGNvbnN0IG1vZE5hbWUgPSAnTW9kIExpbWl0IFBhdGNoZXInO1xuICAgIGxldCBtb2Q6IHR5cGVzLklNb2QgPSB1dGlsLmdldFNhZmUoc3RhdGUsIFsncGVyc2lzdGVudCcsICdtb2RzJywgR0FNRV9JRCwgbW9kTmFtZV0sIHVuZGVmaW5lZCk7XG4gICAgaWYgKG1vZCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICB0cnkge1xuICAgICAgICBhd2FpdCB0aGlzLmNyZWF0ZU1vZExpbWl0UGF0Y2hNb2QobW9kTmFtZSk7XG4gICAgICAgIG1vZCA9IHV0aWwuZ2V0U2FmZSh0aGlzLm1BcGkuZ2V0U3RhdGUoKSxcbiAgICAgICAgICBbJ3BlcnNpc3RlbnQnLCAnbW9kcycsIEdBTUVfSUQsIG1vZE5hbWVdLCB1bmRlZmluZWQpO1xuICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChlcnIpO1xuICAgICAgfVxuICAgIH1cbiAgICB0cnkge1xuICAgICAgY29uc3Qgc3JjID0gcGF0aC5qb2luKGRpc2NvdmVyeS5wYXRoLCBnYW1lLmV4ZWN1dGFibGUpO1xuICAgICAgY29uc3QgZGVzdCA9IHBhdGguam9pbihzdGFnaW5nUGF0aCwgbW9kLmluc3RhbGxhdGlvblBhdGgsIGdhbWUuZXhlY3V0YWJsZSk7XG4gICAgICBhd2FpdCBmcy5yZW1vdmVBc3luYyhkZXN0KVxuICAgICAgICAuY2F0Y2goZXJyID0+IFsnRU5PRU5UJ10uaW5jbHVkZXMoZXJyLmNvZGUpID8gUHJvbWlzZS5yZXNvbHZlKCkgOiBQcm9taXNlLnJlamVjdChlcnIpKTtcbiAgICAgIGF3YWl0IGZzLmNvcHlBc3luYyhzcmMsIGRlc3QpO1xuICAgICAgY29uc3QgdGVtcEZpbGUgPSBkZXN0ICsgJy50bXAnO1xuICAgICAgYXdhaXQgdGhpcy5zdHJlYW1FeGVjdXRhYmxlKFJBTkdFX1NUQVJULCBSQU5HRV9FTkQsIGRlc3QsIHRlbXBGaWxlKTtcbiAgICAgIGF3YWl0IGZzLnJlbW92ZUFzeW5jKGRlc3QpO1xuICAgICAgYXdhaXQgZnMucmVuYW1lQXN5bmModGVtcEZpbGUsIGRlc3QpO1xuICAgICAgdGhpcy5tQXBpLnNlbmROb3RpZmljYXRpb24oe1xuICAgICAgICBtZXNzYWdlOiAnUGF0Y2ggZ2VuZXJhdGVkIHN1Y2Nlc3NmdWxseScsXG4gICAgICAgIHR5cGU6ICdzdWNjZXNzJyxcbiAgICAgICAgZGlzcGxheU1TOiA1MDAwLFxuICAgICAgfSk7XG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICBjb25zdCBhbGxvd1JlcG9ydCA9ICEoZXJyIGluc3RhbmNlb2YgdXRpbC5Vc2VyQ2FuY2VsZWQpXG4gICAgICB0aGlzLm1BcGkuc2hvd0Vycm9yTm90aWZpY2F0aW9uKCdGYWlsZWQgdG8gZ2VuZXJhdGUgbW9kIGxpbWl0IHBhdGNoJywgZXJyLCB7IGFsbG93UmVwb3J0IH0pO1xuICAgICAgdGhpcy5tQXBpLmV2ZW50cy5lbWl0KCdyZW1vdmUtbW9kJywgR0FNRV9JRCwgbW9kTmFtZSk7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHVuZGVmaW5lZCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShtb2ROYW1lKTtcbiAgfVxuXG4gIHB1YmxpYyBnZXRMaW1pdFRleHQodDogYW55KSB7XG4gICAgcmV0dXJuIHQoJ1dpdGNoZXIgMyBpcyByZXN0cmljdGVkIHRvIDE5MiBmaWxlIGhhbmRsZXMgd2hpY2ggaXMgcXVpY2tseSByZWFjaGVkIHdoZW4gJ1xuICAgICAgKyAnYWRkaW5nIG1vZHMgKGFib3V0IH4yNSBtb2RzKSAtIFZvcnRleCBoYXMgZGV0ZWN0ZWQgdGhhdCB0aGUgY3VycmVudCBtb2RzIGVudmlyb25tZW50IG1heSBiZSAnXG4gICAgICArICdicmVhY2hpbmcgdGhpcyBsaW1pdDsgdGhpcyBpc3N1ZSB3aWxsIHVzdWFsbHkgZXhoaWJpdCBpdHNlbGYgYnkgdGhlIGdhbWUgZmFpbGluZyB0byBzdGFydCB1cC57e2JsfX0nXG4gICAgICArICdWb3J0ZXggY2FuIGF0dGVtcHQgdG8gcGF0Y2ggeW91ciBnYW1lIGV4ZWN1dGFibGUgdG8gaW5jcmVhc2UgdGhlIGF2YWlsYWJsZSBmaWxlIGhhbmRsZXMgdG8gNTAwICdcbiAgICAgICsgJ3doaWNoIHNob3VsZCBjYXRlciBmb3IgbW9zdCBpZiBub3QgYWxsIG1vZGRpbmcgZW52aXJvbm1lbnRzLnt7Ymx9fVBsZWFzZSBub3RlIC0gdGhlIHBhdGNoIGlzIGFwcGxpZWQgYXMgJ1xuICAgICAgKyAnYSBtb2Qgd2hpY2ggd2lsbCBiZSBnZW5lcmF0ZWQgYW5kIGF1dG9tYXRpY2FsbHkgZW5hYmxlZDsgdG8gZGlzYWJsZSB0aGUgcGF0Y2gsIHNpbXBseSByZW1vdmUgb3IgZGlzYWJsZSAnXG4gICAgICArICd0aGUgXCJXaXRjaGVyIDMgTW9kIExpbWl0IFBhdGNoZXJcIiBtb2QgYW5kIHRoZSBvcmlnaW5hbCBnYW1lIGV4ZWN1dGFibGUgd2lsbCBiZSByZXN0b3JlZC4nLFxuICAgICAgeyBuczogSTE4Tl9OQU1FU1BBQ0UsIHJlcGxhY2U6IHsgYmw6ICdbYnJdWy9icl1bYnJdWy9icl0nLCBicjogJ1ticl1bL2JyXScgfSB9KTtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgcXVlcnlQYXRjaCgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCB0ID0gdGhpcy5tQXBpLnRyYW5zbGF0ZTtcbiAgICBjb25zdCBtZXNzYWdlID0gdGhpcy5nZXRMaW1pdFRleHQodCk7XG4gICAgY29uc3QgcmVzOiB0eXBlcy5JRGlhbG9nUmVzdWx0ID0gYXdhaXQgKHRoaXMubUFwaS5zaG93RGlhbG9nKCdxdWVzdGlvbicsICdNb2QgTGltaXQgUGF0Y2gnLCB7XG4gICAgICBiYmNvZGU6IG1lc3NhZ2UsXG4gICAgICBjaGVja2JveGVzOiBbXG4gICAgICAgIHsgaWQ6ICdzdXBwcmVzcy1saW1pdC1wYXRjaGVyLXRlc3QnLCB0ZXh0OiAnRG8gbm90IGFzayBhZ2FpbicsIHZhbHVlOiBmYWxzZSB9XG4gICAgICBdLFxuICAgIH0sIFtcbiAgICAgIHsgbGFiZWw6ICdDYW5jZWwnIH0sXG4gICAgICB7IGxhYmVsOiAnR2VuZXJhdGUgUGF0Y2gnIH0sXG4gICAgXSkgYXMgYW55KTtcbiAgICBpZiAocmVzLmlucHV0WydzdXBwcmVzcy1saW1pdC1wYXRjaGVyLXRlc3QnXSA9PT0gdHJ1ZSkge1xuICAgICAgdGhpcy5tQXBpLnN0b3JlLmRpc3BhdGNoKHNldFN1cHByZXNzTW9kTGltaXRQYXRjaCh0cnVlKSk7XG4gICAgfVxuICAgIGlmIChyZXMuYWN0aW9uID09PSAnQ2FuY2VsJykge1xuICAgICAgdGhyb3cgbmV3IHV0aWwuVXNlckNhbmNlbGVkKCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xuICB9XG5cbiAgcHJpdmF0ZSBjcmVhdGVNb2RMaW1pdFBhdGNoTW9kKG1vZE5hbWU6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IG1vZCA9IHtcbiAgICAgIGlkOiBtb2ROYW1lLFxuICAgICAgc3RhdGU6ICdpbnN0YWxsZWQnLFxuICAgICAgYXR0cmlidXRlczoge1xuICAgICAgICBuYW1lOiAnTW9kIExpbWl0IFBhdGNoZXInLFxuICAgICAgICBkZXNjcmlwdGlvbjogJ1dpdGNoZXIgMyBpcyByZXN0cmljdGVkIHRvIDE5MiBmaWxlIGhhbmRsZXMgd2hpY2ggaXMgcXVpY2tseSByZWFjaGVkIHdoZW4gJ1xuICAgICAgICAgICAgICAgICAgICsgJ2FkZGluZyBtb2RzIChhYm91dCB+MjUgbW9kcykgLSB0aGlzIG1vZCBpbmNyZWFzZXMgdGhlIGxpbWl0IHRvIDUwMCcsXG4gICAgICAgIGxvZ2ljYWxGaWxlTmFtZTogJ1dpdGNoZXIgMyBNb2QgTGltaXQgUGF0Y2hlcicsXG4gICAgICAgIG1vZElkOiA0MiwgLy8gTWVhbmluZyBvZiBsaWZlXG4gICAgICAgIHZlcnNpb246ICcxLjAuMCcsXG4gICAgICAgIGluc3RhbGxUaW1lOiBuZXcgRGF0ZSgpLFxuICAgICAgfSxcbiAgICAgIGluc3RhbGxhdGlvblBhdGg6IG1vZE5hbWUsXG4gICAgICB0eXBlOiAndzNtb2RsaW1pdHBhdGNoZXInLFxuICAgIH07XG5cbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgdGhpcy5tQXBpLmV2ZW50cy5lbWl0KCdjcmVhdGUtbW9kJywgR0FNRV9JRCwgbW9kLCBhc3luYyAoZXJyb3IpID0+IHtcbiAgICAgICAgaWYgKGVycm9yICE9PSBudWxsKSB7XG4gICAgICAgICAgcmV0dXJuIHJlamVjdChlcnJvcik7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgcHJvZmlsZUlkID0gc2VsZWN0b3JzLmxhc3RBY3RpdmVQcm9maWxlRm9yR2FtZSh0aGlzLm1BcGkuZ2V0U3RhdGUoKSwgR0FNRV9JRCk7XG4gICAgICAgIHRoaXMubUFwaS5zdG9yZS5kaXNwYXRjaChhY3Rpb25zLnNldE1vZEVuYWJsZWQocHJvZmlsZUlkLCBtb2ROYW1lLCB0cnVlKSk7XG4gICAgICAgIHJldHVybiByZXNvbHZlKCk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuXG4gIHByaXZhdGUgaGFzU2VxdWVuY2Uoc2VxdWVuY2U6IEJ1ZmZlciwgY2h1bms6IEJ1ZmZlcikge1xuICAgIGNvbnN0IGZpcnN0U2VxQnl0ZSA9IHNlcXVlbmNlWzBdO1xuICAgIGxldCBmb3VuZFNlcSA9IGZhbHNlO1xuICAgIGxldCBpdGVyID0gMDtcbiAgICB3aGlsZSAoaXRlciA8IGNodW5rLmxlbmd0aCkge1xuICAgICAgaWYgKCFmb3VuZFNlcSAmJiBjaHVua1tpdGVyXSA9PT0gZmlyc3RTZXFCeXRlKSB7XG4gICAgICAgIGNvbnN0IHN1YkFycmF5ID0gXy5jbG9uZURlZXAoQXJyYXkuZnJvbShjaHVuay5zbGljZShpdGVyLCBpdGVyICsgc2VxdWVuY2UubGVuZ3RoKSkpO1xuICAgICAgICBmb3VuZFNlcSA9IF8uaXNFcXVhbChzZXF1ZW5jZSwgQnVmZmVyLmZyb20oc3ViQXJyYXkpKTtcbiAgICAgIH1cbiAgICAgIGl0ZXIrKztcbiAgICB9XG5cbiAgICByZXR1cm4gZm91bmRTZXE7XG4gIH1cblxuICBwcml2YXRlIHBhdGNoQ2h1bmsoY2h1bms6IEJ1ZmZlcik6IEJ1ZmZlciB7XG4gICAgY29uc3QgaWR4ID0gY2h1bmsuaW5kZXhPZihCdWZmZXIuZnJvbShVTlBBVENIRURfU0VRKSk7XG4gICAgY29uc3QgcGF0Y2hlZEJ1ZmZlciA9IEJ1ZmZlci5mcm9tKFBBVENIRURfU0VRKTtcbiAgICBjb25zdCBkYXRhID0gQnVmZmVyLmFsbG9jKGNodW5rLmxlbmd0aCk7XG4gICAgZGF0YS5maWxsKGNodW5rLnNsaWNlKDAsIGlkeCksIDAsIGlkeCk7XG4gICAgZGF0YS5maWxsKHBhdGNoZWRCdWZmZXIsIGlkeCwgaWR4ICsgcGF0Y2hlZEJ1ZmZlci5sZW5ndGgpO1xuICAgIGRhdGEuZmlsbChjaHVuay5zbGljZShpZHggKyBwYXRjaGVkQnVmZmVyLmxlbmd0aCksIGlkeCArIHBhdGNoZWRCdWZmZXIubGVuZ3RoKTtcbiAgICByZXR1cm4gZGF0YTtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgc3RyZWFtRXhlY3V0YWJsZShzdGFydDogbnVtYmVyLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZW5kOiBudW1iZXIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmaWxlUGF0aDogc3RyaW5nLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGVtcFBhdGg6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICBjb25zdCB3cml0ZXIgPSBmcy5jcmVhdGVXcml0ZVN0cmVhbSh0ZW1wUGF0aCk7XG4gICAgICBjb25zdCBzdHJlYW0gPSBmcy5jcmVhdGVSZWFkU3RyZWFtKGZpbGVQYXRoKTtcbiAgICAgIGNvbnN0IHVucGF0Y2hlZCA9IEJ1ZmZlci5mcm9tKFVOUEFUQ0hFRF9TRVEpO1xuICAgICAgY29uc3QgcGF0Y2hlZCA9IEJ1ZmZlci5mcm9tKFBBVENIRURfU0VRKTtcbiAgICAgIGNvbnN0IG9uRXJyb3IgPSAoZXJyOiBFcnJvcikgPT4ge1xuICAgICAgICB0aGlzLm1Jc1BhdGNoZWQgPSBmYWxzZTtcbiAgICAgICAgd3JpdGVyLmVuZCgpO1xuICAgICAgICBpZiAoIXN0cmVhbS5kZXN0cm95ZWQpIHtcbiAgICAgICAgICBzdHJlYW0uY2xvc2UoKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVqZWN0KGVycik7XG4gICAgICB9O1xuICAgICAgc3RyZWFtLm9uKCdlbmQnLCAoKSA9PiB7XG4gICAgICAgIHRoaXMubUlzUGF0Y2hlZCA9IGZhbHNlO1xuICAgICAgICB3cml0ZXIuZW5kKCk7XG4gICAgICAgIHJldHVybiByZXNvbHZlKCk7XG4gICAgICB9KTtcbiAgICAgIHN0cmVhbS5vbignZXJyb3InLCBvbkVycm9yKTtcbiAgICAgIHN0cmVhbS5vbignZGF0YScsICgoY2h1bms6IEJ1ZmZlcikgPT4ge1xuICAgICAgICBpZiAodGhpcy5tSXNQYXRjaGVkIHx8IChzdHJlYW0uYnl0ZXNSZWFkICsgT0ZGU0VUKSA8IHN0YXJ0IHx8IHN0cmVhbS5ieXRlc1JlYWQgPiBlbmQgKyBPRkZTRVQpIHtcbiAgICAgICAgICB3cml0ZXIud3JpdGUoY2h1bmspO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGlmICh0aGlzLmhhc1NlcXVlbmNlKHVucGF0Y2hlZCwgY2h1bmspKSB7XG4gICAgICAgICAgICBjb25zdCBwYXRjaGVkQnVmZmVyID0gdGhpcy5wYXRjaENodW5rKGNodW5rKTtcbiAgICAgICAgICAgIHdyaXRlci53cml0ZShwYXRjaGVkQnVmZmVyKTtcbiAgICAgICAgICAgIHRoaXMubUlzUGF0Y2hlZCA9IHRydWU7XG4gICAgICAgICAgfSBlbHNlIGlmICh0aGlzLmhhc1NlcXVlbmNlKHBhdGNoZWQsIGNodW5rKSkge1xuICAgICAgICAgICAgLy8gZXhlYyBpcyBhbHJlYWR5IHBhdGNoZWQuXG4gICAgICAgICAgICB0aGlzLm1Jc1BhdGNoZWQgPSB0cnVlO1xuICAgICAgICAgICAgd3JpdGVyLndyaXRlKGNodW5rKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgd3JpdGVyLndyaXRlKGNodW5rKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0pKTtcbiAgICB9KTtcbiAgfVxufVxuIl19