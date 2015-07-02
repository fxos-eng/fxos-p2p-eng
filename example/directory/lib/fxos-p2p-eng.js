!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.HTTPServer=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
define(["exports", "fxos-mvc/dist/mvc", "./discovery"], function (exports, _fxosMvcDistMvc, _discovery) {
  "use strict";

  var _extends = function (child, parent) {
    child.prototype = Object.create(parent.prototype, {
      constructor: {
        value: child,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
    child.__proto__ = parent;
  };

  var Service = _fxosMvcDistMvc.Service;
  var Discovery = _discovery["default"];
  var Client = (function (Service) {
    var Client = function Client() {
      Service.call(this);
    };

    _extends(Client, Service);

    Client.prototype.send = function (peer, data) {
      var networkName = Discovery.getNetwork(peer);
      var network = P2PEng.networks[networkName];
      if (network) {
        network.send(peer, data);
      }
    };

    return Client;
  })(Service);

  exports["default"] = new Client();
});
},{}],2:[function(require,module,exports){
define(["exports"], function (exports) {
  "use strict";

  exports.debug = debug;
  var DEBUG_ENABLED = true;

  function debug(args) {
    if (DEBUG_ENABLED) {
      console.log(args);
    }
  };
});
},{}],3:[function(require,module,exports){
define(["exports", "dns-sd.js/dist/dns-sd", "./peer", "fxos-mvc/dist/mvc"], function (exports, _dnsSdJsDistDnsSd, _peer, _fxosMvcDistMvc) {
  "use strict";

  var _extends = function (child, parent) {
    child.prototype = Object.create(parent.prototype, {
      constructor: {
        value: child,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
    child.__proto__ = parent;
  };

  var Peer = _peer["default"];
  var Service = _fxosMvcDistMvc.Service;
  var Discovery = (function (Service) {
    var Discovery = function Discovery() {
      Service.call(this);
    };

    _extends(Discovery, Service);

    Discovery.prototype.init = function (options) {
      var _this = this;
      if (!options.port) {
        console.error("You must specify `port` when initializing Discovery");
        return;
      }

      if (!options.name) {
        console.error("You must specify `name` when initializing Discovery");
        return;
      }

      this._peers = [];

      this._ipAddresses = new Promise(function (resolve, reject) {
        IPUtils.getAddresses(function (ipAddress) {
          // XXX/drs: This will break if we have multiple IP addresses.
          resolve([ipAddress]);
        });
      });

      window.addEventListener("visibilitychange", function () {
        return DNSSD.startDiscovery();
      });

      DNSSD.registerService(options.name, options.port, {});

      DNSSD.addEventListener("discovered", function (e) {
        var isAppPeer = e.services.find(function (service) {
          return service === options.name;
        });

        if (!isAppPeer) {
          return;
        }

        var address = e.address;

        _this._ipAddresses.then(function (ipAddresses) {
          // Make sure we're not trying to connect to ourself.
          if (ipAddresses.indexOf(address) !== -1) {
            return;
          }
        });

        var peer = new Peer({
          address: address,
          network: Interfaces.getNetwork({ address: address })
        });
        _this._peers.push(peer);
        _this._dispatchEvent("discovered", { peer: peer });
      });

      DNSSD.startDiscovery();
      setInterval(function () {
        return DNSSD.startDiscovery();
      }, 30000 /* every 30 seconds */);
    };

    return Discovery;
  })(Service);
});
},{}],4:[function(require,module,exports){
define(["exports", "fxos-mvc/dist/mvc"], function (exports, _fxosMvcDistMvc) {
  "use strict";

  var _extends = function (child, parent) {
    child.prototype = Object.create(parent.prototype, {
      constructor: {
        value: child,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
    child.__proto__ = parent;
  };

  var Service = _fxosMvcDistMvc.Service;
  var Interfaces = (function (Service) {
    var Interfaces = function Interfaces() {
      Service.call(this);

      this.networks = {
        wifi: null,
        wifiDirect: new WifiDirectDriver(),
        bluetooth: null,
        nfc: null
      };
    };

    _extends(Interfaces, Service);

    Interfaces.prototype.getPeerNetwork = function (peer) {
      for (var _iterator = this.networks[Symbol.iterator](), _step; !(_step = _iterator.next()).done;) {
        var name = _step.value;
        var network = this.networks[name];
        if (network && network.isPeerInNetwork(peer)) {
          return name;
        }
      }
    };

    return Interfaces;
  })(Service);
});
},{}],5:[function(require,module,exports){
define(["exports", "fxos-mvc/dist/mvc", "./interfaces", "./wifi-direct-driver", "./broadcast"], function (exports, _fxosMvcDistMvc, _interfaces, _wifiDirectDriver, _broadcast) {
  "use strict";

  var _extends = function (child, parent) {
    child.prototype = Object.create(parent.prototype, {
      constructor: {
        value: child,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
    child.__proto__ = parent;
  };

  var Service = _fxosMvcDistMvc.Service;
  var Interfaces = _interfaces["default"];
  var WifiDirectDriver = _wifiDirectDriver["default"];
  var Broadcast = _broadcast["default"];
  var P2PEng = (function (Service) {
    var P2PEng = function P2PEng() {
      Service.call(this);
    };

    _extends(P2PEng, Service);

    P2PEng.prototype.init = function (options) {
      // Enable each requested network.
      if (options.networks) {
        options.networks.forEach(function (network) {
          if (Interfaces.networks[network]) {
            Interfaces.networks[network].init(options);
          }
        });
      }
    };

    P2PEng.prototype.getPeers = function () {};

    P2PEng.prototype.setBroadcast = function (enable) {
      Broadcast.setBroadcast(enable);
    };

    P2PEng.prototype.setPeerName = function (name) {
      Name.set(name);
    };

    P2PEng.prototype.setBroadcastData = function (data) {
      Broadcast.setData(data);
    };

    return P2PEng;
  })(Service);

  exports["default"] = new P2PEng();
});
},{}],6:[function(require,module,exports){
(function (global){
!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.P2PHelper=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/*jshint esnext:true*/
/*exported P2PHelper*/
'use strict';

module.exports = window.P2PHelper = (function() {

var wifiManager = navigator.mozWifiManager;
var wifiP2pManager = navigator.mozWifiP2pManager;

var scanInterval = null;
var groupOwner = null;

var P2PHelper = {
  localAddress: wifiManager.macAddress,
  remoteAddress: null,

  wpsMethod: 'pbc',
  goIntent: 0,

  connect: function(remoteAddress) {
    if (P2PHelper.remoteAddress) {
      return;
    }

    console.log('Attempting to connect to address ' + remoteAddress + ' ' +
                'with WPS method "' + P2PHelper.wpsMethod + '" ' +
                'and intent "' + P2PHelper.goIntent + '"');

    wifiP2pManager.connect(remoteAddress, P2PHelper.wpsMethod, P2PHelper.goIntent);
    P2PHelper.remoteAddress = remoteAddress;
  },

  disconnect: function() {
    if (!P2PHelper.remoteAddress) {
      return;
    }

    wifiP2pManager.disconnect(P2PHelper.remoteAddress);
    P2PHelper.remoteAddress = null;
  },

  startScan: function(callback) {
    var request = wifiP2pManager.setScanEnabled(true);
    request.onsuccess = request.onerror = callback;

    scanInterval = setInterval(P2PHelper.restartScan, 5000);
  },

  stopScan: function(callback) {
    clearInterval(scanInterval);

    var request = wifiP2pManager.setScanEnabled(false);
    request.onsuccess = request.onerror = callback;
  },

  restartScan: function() {
    P2PHelper.stopScan(function() {
      P2PHelper.startScan();
    });
  },

  setDisplayName: function(displayName) {
    wifiP2pManager.setDeviceName(displayName);
  },

  dispatchEvent: function(name, data) {
    var events    = this._events || {};
    var listeners = events[name] || [];
    listeners.forEach((listener) => {
      listener.call(this, data);
    });
  },

  addEventListener: function(name, listener) {
    var events    = this._events = this._events || {};
    var listeners = events[name] = events[name] || [];
    if (listeners.find(fn => fn === listener)) {
      return;
    }

    listeners.push(listener);
  },

  removeEventListener: function(name, listener) {
    var events    = this._events || {};
    var listeners = events[name] || [];
    for (var i = listeners.length - 1; i >= 0; i--) {
      if (listeners[i] === listener) {
        listeners.splice(i, 1);
        return;
      }
    }
  }
};

wifiP2pManager.addEventListener('statuschange', (evt) => {
  console.log('wifiP2pManager::statuschange', evt);

  P2PHelper.dispatchEvent('statuschange');

  if (groupOwner && !wifiP2pManager.groupOwner) {
    groupOwner = null;
    P2PHelper.dispatchEvent('disconnected');
    return;
  }

  groupOwner = wifiP2pManager.groupOwner;

  if (groupOwner) {
    P2PHelper.dispatchEvent('connected', {
      groupOwner: groupOwner
    });
  }
});

wifiP2pManager.addEventListener('peerinfoupdate', (evt) => {
  console.log('wifiP2pManager::peerinfoupdate', evt);

  var request = wifiP2pManager.getPeerList();
  request.onsuccess = function() {
    P2PHelper.dispatchEvent('peerlistchange', {
      peerList: request.result
    });
  };
  request.onerror = function() {
    console.warn('Unable to get peer list', request.error);
  };
});

navigator.mozSetMessageHandler('wifip2p-pairing-request', (evt) => {
  console.log('wifip2p-pairing-request', evt);

  var accepted = true;
  var pin = ''; // optional

  P2PHelper.dispatchEvent('pairingrequest');

  wifiP2pManager.setPairingConfirmation(accepted, pin);
});

return P2PHelper;

})();

},{}]},{},[1])(1)
});
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],7:[function(require,module,exports){
define(["exports", "fxos-mvc/dist/mvc"], function (exports, _fxosMvcDistMvc) {
  "use strict";

  var _extends = function (child, parent) {
    child.prototype = Object.create(parent.prototype, {
      constructor: {
        value: child,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
    child.__proto__ = parent;
  };

  var Model = _fxosMvcDistMvc.Model;
  var Peer = (function (Model) {
    var Peer = function Peer() {};

    _extends(Peer, Model);

    return Peer;
  })(Model);

  exports["default"] = Peer;
});
},{}],8:[function(require,module,exports){
define(["exports", "fxos-mvc/dist/mvc"], function (exports, _fxosMvcDistMvc) {
  "use strict";

  var _extends = function (child, parent) {
    child.prototype = Object.create(parent.prototype, {
      constructor: {
        value: child,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
    child.__proto__ = parent;
  };

  var Model = _fxosMvcDistMvc.Model;
  var Request = (function (Model) {
    var Request = function Request() {};

    _extends(Request, Model);

    return Request;
  })(Model);

  exports["default"] = Request;
});
},{}],9:[function(require,module,exports){
define(["exports", "src/debug", "fxos-mvc/dist/mvc"], function (exports, _srcDebug, _fxosMvcDistMvc) {
  "use strict";

  var _extends = function (child, parent) {
    child.prototype = Object.create(parent.prototype, {
      constructor: {
        value: child,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
    child.__proto__ = parent;
  };

  var debug = _srcDebug.debug;
  var Service = _fxosMvcDistMvc.Service;


  var wifiP2pManager = navigator.mozWifiP2pManager;
  var wifiManager = navigator.mozWifiManager;

  var WPS_METHOD = "pbc";
  var GO_INTENT = 0;

  var SCAN_INTERVAL = 5000;

  var TAG = "[WifiDirectDriver]";

  var WifiDirectDriver = (function (Service) {
    var WifiDirectDriver = function WifiDirectDriver(options) {
      Service.call(this, options);
    };

    _extends(WifiDirectDriver, Service);

    WifiDirectDriver.prototype.init = function () {
      if (!wifiP2pManager || !wifiManager) {
        return false;
      }

      this._scan();

      this._handleStatuschange = this._handleStatuschange.bind(this);
      this._handlePeerinfoupdate = this._handlePeerinfoupdate.bind(this);
      this._handleWifip2pPairingRequest = this._handleWifip2pPairingRequest.bind(this);
      wifiP2pManager.addEventListener("statuschange", this._handleStatuschange);
      wifiP2pManager.addEventListener("peerinfoupdate", this._handlePeerinfoupdate);
      wifiP2pManager.addEventListener("wifip2p-pairing-request", this._handleWifip2pPairingRequest);

      this._allAddresses = {};

      return true;
    };

    WifiDirectDriver.prototype.disable = function () {
      wifiP2pManager.removeEventListener("statuschange", this._handleStatuschange);
      wifiP2pManager.removeEventListener("peerinfoupdate", this._handlePeerinfoupdate);
      wifiP2pManager.removeEventListener("wifip2p-pairing-request", this._handleWifip2pPairingRequest);

      clearTimeout(this._scanInterval());

      disconnect();
    };

    WifiDirectDriver.prototype.connect = function (remoteAddress) {
      var _this = this;
      if (this._remoteAddress && this._remoteAddress === remoteAddress) {
        return;
      }

      debug(TAG, "Connecting to", remoteAddress);

      var request = wifiP2pManager.connect(remoteAddress, WPS_METHOD, GO_INTENT);

      request.onsuccess = function () {
        debug(TAG, "Connection request dispatched to", remoteAddress);
        _this._remoteAddress = remoteAddress;
      };

      request.onerror = function () {
        console.warning("Couldn't connect to peer", request.error);
      };
    };

    WifiDirectDriver.prototype.disconnect = function () {
      var _this2 = this;
      if (!this._remoteAddress) {
        return;
      }

      var request = wifiP2pManager.disconnect(this._remoteAddress);

      request.onsuccess = function () {
        _this2._remoteAddress = null;
      };

      request.onerror = function () {
        console.warning("Couldn't disconnect from peer", request.error);
      };
    };

    WifiDirectDriver.prototype.isPeerInNetwork = function (peer) {
      return this._allAddresses[peer.address];
    };

    WifiDirectDriver.prototype.send = function (peer, data) {};

    WifiDirectDriver.prototype._scan = function () {
      var _this3 = this;
      var request = wifiP2pManager.setScanEnabled(false);

      request.onsuccess = function () {
        debug(TAG, "Scan stopped (restarting)");

        request = wifiP2pManager.setScanEnabled(true);

        request.onsuccess = function () {
          debug(TAG, "Scan started");
        };

        request.onerror = function () {
          console.warn("Couldn't enable scanning", request.error);
        };
      };

      request.onerror = function () {
        console.warn("Couldn't disable scanning", request.error);
      };

      if (!this._scanInterval) {
        this._scanInterval = setInterval(function () {
          return _this3._scan();
        }, SCAN_INTERVAL);
      }
    };

    WifiDirectDriver.prototype._handleStatuschange = function (e) {
      debug(TAG, "Handle statuschange");

      var groupOwner = wifiP2pManager.groupOwner;

      if (this._groupOwner && !groupOwner) {
        this._groupOwner = null;
        return;
      }

      this._allAddresses[groupOwner] = this._remoteAddress;
      this._groupOwner = groupOwner;
    };

    WifiDirectDriver.prototype._handlePeerinfoupdate = function (e) {
      var _this4 = this;
      debug(TAG, "Handle peerinfoupdate");

      var request = wifiP2pManager.getPeerList();
      request.onsuccess = function () {
        debug(TAG, "Got updated peer list");

        _this4._dispatchEvent("peerlistchange", {
          peerList: request.result
        });
      };

      request.onerror = function () {
        console.warn("Unable to get peer list", request.error);
      };
    };

    WifiDirectDriver.prototype._handleWifip2pPairingRequest = function (e) {
      debug(TAG, "Handle wifip2p-pairing-request");

      var accepted = true;
      var pin = "";

      var request = wifiP2pHelper.setPairingConfirmation(accepted, pin);

      request.onsuccess = function () {
        debug(TAG, "Paired with device");
      };

      request.onerror = function () {
        console.warning("Couldn't pair with device", request.error);
      };
    };

    return WifiDirectDriver;
  })(Service);

  exports["default"] = WifiDirectDriver;
});
},{}]},{},[1,2,3,4,5,6,7,8,9])(9)
});