//import DeviceName from 'src/device-name';

import { Service } from 'fxos-mvc/dist/mvc';

import Interfaces from './interfaces';
import WifiDirectDriver from './wifi-direct-driver';
import Broadcast from './broadcast';

class P2PEng extends Service {
  constructor() {
    super();
  }

  init(options) {
    // Enable each requested network.
    if (options.networks) {
      options.networks.forEach(network => {
        if (Interfaces.networks[network]) {
          Interfaces.networks[network].init(options);
        }
      });
    }
  }

  /**
   * Gets a list of all connected peers.
   *
   * @return {Promise}  Resolved when a peer has been discovered or a timeout
   *                    has passed.
   */
  getPeers() {

  }

  /**
   * Sets whether or not to broadcast peer name and data to all discovered
   * peers.
   *
   * @param enable {Boolean}  Whether or not to broadcast.
   */
  setBroadcast(enable) {
    Broadcast.setBroadcast(enable);
  }

  /**
   * Sets this user's peer name.
   * NOTE: This data is broadcasted publicly.
   *
   * @param name {String}  The name that this peer should be broadcasted as.
   */
  setPeerName(name) {
    Name.set(name);
  }

  /**
   * Sets the info broadcasted to all discovered peers.
   * NOTE: This data is broadcasted publicly.
   *
   * @param data {Object}  An object representation of the data to stream to all
   *                       discovered peers.
   */
  setBroadcastData(data) {
    Broadcast.setData(data);
  }
}

export default new P2PEng();
