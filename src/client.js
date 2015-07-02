import { Service } from 'fxos-mvc/dist/mvc';

import Discovery from './discovery';

class Client extends Service {
  constructor() {
    super();
  }

  send(peer, data) {
    var networkName = Discovery.getNetwork(peer);
    var network = P2PEng.networks[networkName];
    if (network) {
      network.send(peer, data);
    }
  }
}

export default new Client();
