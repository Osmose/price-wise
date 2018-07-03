/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

browser.browserAction.onClicked.addListener(() => {
  browser.sidebarAction.open();
});

browser.runtime.onMessage.addListener((message, sender) => {
  if (message === 'show-pill') {
    browser.experiments.urlbarPill.show(sender.tab.id, {
      icon: browser.extension.getURL('icon.svg'),
      label: 'Buy now',
      backgroundColor: '#090',
      textColor: '#FFF',
      onClick() {
        console.log('Got clicked!');
      },
    });
  }
});


// browser.urlbarPill.getPill(tabId);
// browser.urlbarPill.update(tabId, {
//   text: 'Foobar',
// });
// browser.urlbarPill.remove(tabId);
