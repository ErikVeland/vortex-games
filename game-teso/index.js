const { log, util } = require('vortex-api');
const { isWindows } = require('vortex-api');

const { remote } = require('electron');
const path = require('path');

// Conditional winapi import - only available on Windows
const winapi = isWindows() ? require('winapi-bindings') : undefined;

function findGame() {
  try {
    const regKey = (process.arch === 'x32')
      ? 'Software\\Zenimax_Online\\Launcher'
      : 'Software\\Wow6432Node\\Zenimax_Online\\Launcher';

    const instPath = (isWindows() && winapi) ? winapi.RegGetValue(
      'HKEY_LOCAL_MACHINE',
      regKey,
      'InstallPath') : null : null;
    if (!instPath) {
      throw new Error('empty registry key');
    }
    return Promise.resolve(path.join(instPath.value, 'Launcher'));
  } catch (err) {
    return util.steam.findByName('The Elder Scrolls Online')
      .then(game => game.gamePath);
  }
}

function modPath() {
  return path.join(remote.app.getPath('documents'), 'Elder Scrolls Online', 'live', 'Addons');
}

function main(context) {
  context.registerGame({
    id: 'teso',
    name: 'The Elder Scrolls Online',
    mergeMods: true,
    queryPath: findGame,
    queryModPath: modPath,
    logo: 'gameart.jpg',
    executable: () => 'Bethesda.net_Launcher.exe',
    requiredFiles: [
      'Bethesda.net_Launcher.exe',
    ],
    environment: {
      SteamAPPId: '306130',
    },
    details: {
      steamAppId: 306130,
      nexusPageId: 'elderscrollsonline',
      hashFiles: [
        '../The Elder Scrolls Online/game/game_player.version',
        '../The Elder Scrolls Online/depot/depot.version',
        'Bethesda.net_Launcher.version',
      ],
    },
  });

  return true;
}

module.exports = {
  default: main,
};
