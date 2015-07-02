import /* global DNSSD, IPUtils */ 'dns-sd.js/dist/dns-sd';

import Peer from './peer';

import { Service } from 'fxos-mvc/dist/mvc';

class Discovery extends Service {
  constructor() {
    super();
  }

  init(options) {
    if (!options.port) {
      console.error('You must specify `port` when initializing Discovery');
      return;
    }

    if (!options.name) {
      console.error('You must specify `name` when initializing Discovery');
      return;
    }

    this._peers = [];

    this._ipAddresses = new Promise((resolve, reject) => {
      IPUtils.getAddresses(ipAddress => {
        // XXX/drs: This will break if we have multiple IP addresses.
        resolve([ipAddress]);
      });
    });

    window.addEventListener('visibilitychange', () => DNSSD.startDiscovery());

    DNSSD.registerService(options.name, options.port, {});

    DNSSD.addEventListener('discovered', e => {
      var isAppPeer = e.services.find(service => {
        return service === options.name;
      });

      if (!isAppPeer) {
        return;
      }

      var address = e.address;

      this._ipAddresses.then(ipAddresses => {
        // Make sure we're not trying to connect to ourself.
        if (ipAddresses.indexOf(address) !== -1) {
          return;
        }
      });

      var peer = new Peer({
        address: address,
        network: Interfaces.getNetwork({address: address})
      });
      this._peers.push(peer);
      this._dispatchEvent('discovered', {peer: peer});
    });

    DNSSD.startDiscovery();
    setInterval(() => DNSSD.startDiscovery(), 30000 /* every 30 seconds */);
  }
}
