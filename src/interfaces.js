import { Service } from 'fxos-mvc/dist/mvc';

class Interfaces extends Service {
  constructor() {
    super();

    this.networks = {
      'wifi': null,
      'wifiDirect': new WifiDirectDriver(),
      'bluetooth': null,
      'nfc': null
    };
  }

  getPeerNetwork(peer) {
    for (var name of this.networks) {
      var network = this.networks[name];
      if (network && network.isPeerInNetwork(peer)) {
        return name;
      }
    }
  }
}
