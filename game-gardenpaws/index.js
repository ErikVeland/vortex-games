// Bluebird import removed during migration to native Promises
const path = require('path');
const { actions, fs, util } = require('vortex-api');
const { isWindows } = require('vortex-api');

// Platform detection
const IsWin = process.platform === 'win32';

// Conditional winapi import - only available on Windows
const winapi = IsWin ? require('winapi-bindings') : undefined;

const UMM_DLL = 'UnityModManager.dll';

const NexusId = 'gardenpaws';
const Name = 'Garden Paws';
const ExeName = 'GardenPaws';
const SteamId = 840010;

function main(context) {
  context.requireExtension('modtype-umm');
  context.registerGame(
    {
      id: NexusId,
      name: Name,
      logo: 'gameart.jpg',
      mergeMods: true,
      queryPath: findGame,
      queryModPath: () => 'Mods',
      executable: () => ExeName + '.exe',
      requiredFiles: [ExeName + '.exe'],
      environment: {
        SteamAPPId: SteamId.toString(),
      },
      details:
      {
        steamAppId: SteamId,
      },
      setup: setup,
    });

  function findGame() {
    return util.steam.findByAppId(SteamId.toString()).then(game => game.gamePath);
  }

  function readRegistryKey(hive, key, name) {
    if (!IsWin || !winapi) {
      return Promise.reject(new util.UnsupportedOperatingSystem());
    }

    try {
      const instPath = (isWindows() && winapi) ? winapi.RegGetValue(hive, key, name) : null;
      if (!instPath) {
        throw new Error('empty registry key');
      }
      return Promise.resolve(instPath.value);
    } catch (err) {
      return Promise.reject(new util.ProcessCanceled(err));
    }
  }

  function findUnityModManager() {
    return readRegistryKey('HKEY_CURRENT_USER', 'Software\\UnityModManager', 'Path')
      .then(value => fs.statAsync(path.join(value, UMM_DLL)));
  }

  function setup(discovery) {
    return fs.ensureDirWritableAsync(path.join(discovery.path, 'Mods'), () => Promise.resolve())
      .then(() => findUnityModManager()
        .catch(err => {
          return new Promise((resolve, reject) => {
            context.api.store.dispatch(
              actions.showDialog(
                'question',
                'Action required',
                { message: 'You must install Unity Mod Manager to use mods with ' + Name + '.' },
                [
                  { label: 'Cancel', action: () => reject(new util.UserCanceled()) },
                  {
                    label: 'Go to the Unity Mod Manager page', action: () => {
                      util.opn('https://www.nexusmods.com/site/mods/21/').catch(err => undefined);
                      reject(new util.UserCanceled());
                    }
                  }
                ]
              )
            );
          });
        }))
  }

  return true;
}

module.exports = {
  default: main
};
