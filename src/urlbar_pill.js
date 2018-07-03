/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/* global ExtensionAPI, Ci, ChromeUtils */
ChromeUtils.import('resource://gre/modules/Services.jsm'); /* global Services */
ChromeUtils.import('resource://gre/modules/XPCOMUtils.jsm'); /* global XPCOMUtils */

XPCOMUtils.defineLazyServiceGetter(
  this,
  'resProto',
  '@mozilla.org/network/protocol;1?name=resource',
  'nsISubstitutingProtocolHandler',
); /* global resProto */

const XUL_NS = 'http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul';
const SHEET_URI = Services.io.newURI('resource://commerce/urlbar_pill.css');

this.urlbarPill = class extends ExtensionAPI {
  constructor(...args) {
    super(...args);

    this.modifiedWindows = new Set();
  }

  onStartup() {
    const uri = Services.io.newURI('content/', null, this.extension.rootURI);
    resProto.setSubstitutionWithFlags('commerce', uri, resProto.ALLOW_CONTENT_ACCESS);
  }

  onShutdown() {
    resProto.setSubstitution('commerce', null);

    for (const window of this.modifiedWindows) {
      this.removeStyles(window);
      window.document.querySelector('#pill-wrapper').remove();
    }
  }

  addStyles(window) {
    const utils = (
      window.QueryInterface(Ci.nsIInterfaceRequestor).getInterface(Ci.nsIDOMWindowUtils)
    );
    utils.loadSheet(SHEET_URI, window.AGENT_SHEET);
  }

  removeStyles(window) {
    const utils = (
      window.QueryInterface(Ci.nsIInterfaceRequestor).getInterface(Ci.nsIDOMWindowUtils)
    );
    utils.removeSheet(SHEET_URI, window.AGENT_SHEET);
  }

  getAPI() {
    return {
      experiments: {
        urlbarPill: {
          show: (tabId, options) => {
            const nativeTab = this.extension.tabManager.get(tabId).nativeTab;
            const tabDocument = nativeTab.ownerDocument;
            const tabWindow = tabDocument.defaultView;

            if (!this.modifiedWindows.has(tabWindow)) {
              this.addStyles(tabDocument.defaultView);
              this.modifiedWindows.add(tabWindow);
            }

            const urlbar = tabDocument.getElementById('page-action-buttons');

            const pillWrapper = tabDocument.createElementNS(XUL_NS, 'hbox');
            pillWrapper.setAttribute('id', 'pill-wrapper');
            const pill = tabDocument.createElementNS(XUL_NS, 'toolbarbutton');
            pill.setAttribute('id', 'pill');
            pill.setAttribute('label', options.label);
            pill.style.color = options.textColor;
            pill.style.backgroundColor = options.backgroundColor;
            if (options.icon) {
              pill.setAttribute('image', options.icon);
            }
            pill.addEventListener('command', () => {
              console.log(options.onClick);
            });
            pillWrapper.append(pill);

            urlbar.append(pillWrapper);
          },
        },
      },
    };
  }
};
