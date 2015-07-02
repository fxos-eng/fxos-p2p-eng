import { debug } from 'src/debug';

import { Service } from 'fxos-mvc/dist/mvc';

var wifiP2pManager = navigator.mozWifiP2pManager;
var wifiManager = navigator.mozWifiManager;

const WPS_METHOD = 'pbc';
const GO_INTENT = 0;

const SCAN_INTERVAL = 5000;

const TAG = '[WifiDirectDriver]';

export default class WifiDirectDriver extends Service {
  constructor(options) {
    super(options);
  }

  init() {
    if (!wifiP2pManager || !wifiManager) {
      return false;
    }

    this._scan();

    this._handleStatuschange = this._handleStatuschange.bind(this);
    this._handlePeerinfoupdate = this._handlePeerinfoupdate.bind(this);
    this._handleWifip2pPairingRequest =
      this._handleWifip2pPairingRequest.bind(this);
    wifiP2pManager.addEventListener('statuschange', this._handleStatuschange);
    wifiP2pManager.addEventListener(
      'peerinfoupdate', this._handlePeerinfoupdate);
    wifiP2pManager.addEventListener(
      'wifip2p-pairing-request', this._handleWifip2pPairingRequest);

    this._allAddresses = {};

    return true;
  }

  disable() {
    wifiP2pManager.removeEventListener(
      'statuschange', this._handleStatuschange);
    wifiP2pManager.removeEventListener(
      'peerinfoupdate', this._handlePeerinfoupdate);
    wifiP2pManager.removeEventListener(
      'wifip2p-pairing-request', this._handleWifip2pPairingRequest);

    clearTimeout(this._scanInterval());

    disconnect();
  }

  connect(remoteAddress) {
    if (this._remoteAddress && this._remoteAddress === remoteAddress) {
      return;
    }

    debug(TAG, 'Connecting to', remoteAddress);

    var request = wifiP2pManager.connect(remoteAddress, WPS_METHOD, GO_INTENT);

    request.onsuccess = () => {
      debug(TAG, 'Connection request dispatched to', remoteAddress);
      this._remoteAddress = remoteAddress;
    };

    request.onerror = () => {
      console.warning('Couldn\'t connect to peer', request.error);
    };
  }

  disconnect() {
    if (!this._remoteAddress) {
      return;
    }

    var request = wifiP2pManager.disconnect(this._remoteAddress);

    request.onsuccess = () => {
      this._remoteAddress = null;
    };

    request.onerror = () => {
      console.warning('Couldn\'t disconnect from peer', request.error);
    };
  }

  isPeerInNetwork(peer) {
    return this._allAddresses[peer.address];
  }

  /**
   * Send data to a peer.
   *
   * This is a bit messy. We first have to disconnect from whatever network
   * we're connected to, then reconnect to that peer, and then send the data.
   * This process can take quite a while.
   *
   * @param peer {Peer}  Must contain the address to send the data to.
   * @param data {Object}  Data to send to the peer.
   *
   * @return {Promise}  Resolved when the data has been sent, or rejected if
   *                    there was a problem.
   */
  send(peer, data) {
    
  }

  _scan() {
    var request = wifiP2pManager.setScanEnabled(false);

    request.onsuccess = () => {
      debug(TAG, 'Scan stopped (restarting)');

      request = wifiP2pManager.setScanEnabled(true);

      request.onsuccess = () => {
        debug(TAG, 'Scan started');
      };

      request.onerror = () => {
        console.warn('Couldn\'t enable scanning', request.error);
      };
    };

    request.onerror = () => {
      console.warn('Couldn\'t disable scanning', request.error);
    }

    if (!this._scanInterval) {
      this._scanInterval = setInterval(() => this._scan(), SCAN_INTERVAL);
    }
  }

  _handleStatuschange(e) {
    debug(TAG, 'Handle statuschange');

    var groupOwner = wifiP2pManager.groupOwner;

    if (this._groupOwner && !groupOwner) {
      this._groupOwner = null;
      return;
    }

    this._allAddresses[groupOwner] = this._remoteAddress;
    this._groupOwner = groupOwner;
  }

  _handlePeerinfoupdate(e) {
    debug(TAG, 'Handle peerinfoupdate');

    var request = wifiP2pManager.getPeerList();
    request.onsuccess = () => {
      debug(TAG, 'Got updated peer list');

      this._dispatchEvent('peerlistchange', {
        peerList: request.result
      });
    };

    request.onerror = () => {
      console.warn('Unable to get peer list', request.error);
    };
  }

  _handleWifip2pPairingRequest(e) {
    debug(TAG, 'Handle wifip2p-pairing-request');

    var accepted = true;
    var pin = '';

    var request = wifiP2pHelper.setPairingConfirmation(accepted, pin);

    request.onsuccess = () => {
      debug(TAG, 'Paired with device');
    };

    request.onerror = () => {
      console.warning('Couldn\'t pair with device', request.error);
    };
  }
}
