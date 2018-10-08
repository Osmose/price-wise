/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Product extraction via Open Graph tags.
 */

const OPEN_GRAPH_PROPERTY_VALUES = {
  title: 'og:title',
  image: 'og:image',
  price: 'og:price:amount',
};

/**
 * Returns any product information available on the page from Open Graph <meta>
 * tags.
 */
export default function extractProduct() {
  const extractedProduct = {};
  for (const [feature, propertyValue] of Object.entries(OPEN_GRAPH_PROPERTY_VALUES)) {
    const metaEle = document.querySelector(`meta[property='${propertyValue}']`);

    // Fail early if any required tags aren't found.
    if (!metaEle) {
      return null;
    }

    extractedProduct[feature] = metaEle.getAttribute('content');
  }

  return extractedProduct;
}
