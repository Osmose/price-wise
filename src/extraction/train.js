/* eslint-disable */
import defaultCoefficients from './fathom_default_coefficients.json';
import RulesetFactory from './ruleset_factory';

/* global ChromeUtils */

ChromeUtils.import("resource://gre/modules/Services.jsm");

// marionetteScriptFinished is a wrapper added during the webpack build that
// returns a value to run_tests.py and ends execution.
/* global marionetteScriptFinished */

/**
 * Awaitable setDefault that stores Promise values, not the Promises
 * themselves, in the map
 */
async function asyncSetDefault(map, key, asyncDefaultMaker) {
  if (map.has(key)) {
    return map.get(key);
  }
  const defaultValue = await asyncDefaultMaker();
  map.set(key, defaultValue);
  return defaultValue;
}

class Tuner {
  constructor(
    urls,
    traineeId,
    initialTemperature = 5000,
    coolingSteps = 5000,
    coolingFraction = 0.95,
    stepsPerTemp = 1000,
  ) {
    this.INITIAL_TEMPERATURE = initialTemperature;
    this.COOLING_STEPS = coolingSteps;
    this.COOLING_FRACTION = coolingFraction;
    this.STEPS_PER_TEMP = stepsPerTemp;
    this.BOLTZMANNS = 1.3806485279e-23;

    this.urls = urls;
    this.traineeId = traineeId;
  }

  // Copy-and-pasted from Fathom just to allow solutionCost() to be async.
  // What color is your function?
  async anneal() {
    const window = Services.wm.getMostRecentWindow('navigator:browser');
    const tabs = [];
    for (const url of this.urls) {
      const tab = window.gBrowser.addTab(url, {
        triggeringPrincipal: Services.scriptSecurityManager.getSystemPrincipal(),
      });
      tabs.push(tab);
    }
    Services.mm.loadFrameScript(
      'file:///Users/osmose/Projects/webext-commerce/build/ruleset.bundle.js',
      true,
    );
    console.log("frame script loaded");

    let temperature = this.INITIAL_TEMPERATURE;
    let currentSolution = this.initialSolution();
    let bestSolution = currentSolution;
    let currentCost = await this.solutionCost(tabs, currentSolution);
    let bestCost = currentCost;

    const seenSolutions = new Map(); // solution => cost
    for (let i = 0; i < this.COOLING_STEPS; i++) {
      const startCost = currentCost;
      for (let j = 0; j < this.STEPS_PER_TEMP; j++) {
        const newSolution = this.randomTransition(currentSolution);
        const newCost = await asyncSetDefault(
          seenSolutions,
          newSolution.toString(),
          () => this.solutionCost(tabs, newSolution),
        );

        if (newCost < currentCost) {
          // Always take improvements.
          currentCost = newCost;
          currentSolution = newSolution;
          if (newCost < bestCost) {
            bestCost = newCost;
            bestSolution = newSolution;
          }
        } else {
          // Sometimes take non-improvements.
          const minusDelta = currentCost - newCost;
          const merit = Math.exp(minusDelta / (this.BOLTZMANNS * temperature));
          if (merit > Math.random()) {
            currentCost = newCost;
            currentSolution = newSolution;
          }
        }
        // Exit if we're not moving:
        if (startCost === currentCost) { break; }
      }
      temperature *= this.COOLING_FRACTION;
    }
    return [bestSolution, bestCost];
  }

  /**
   * Send a message to all the pages in the corpus, telling them "Run ruleset
   * ID X, and tell me whether its default query (the one with the same out()
   * key as its ID) was right or wrong." Do it by delegating to the FathomFox
   * Rulesets webext, where user rulesets are developed.
   */
  async whetherTabsSucceeded(tabs, coeffs) {
    return Promise.all(
      tabs.map(tab => new Promise(resolve => {
        const mm = tab.linkedBrowser.messageManager;
        function complete({result}) {
          mm.removeMessageListener('matchResult', complete);
          resolve(result);
        }

        mm.addMessageListener('matchResult', complete);
        mm.sendAsyncMessage('checkRuleset', {
          coeffs,
          id: this.traineeId,
        });
      }))
    );
  }

  async solutionCost(tabs, coeffs) {
    const attempts = await this.whetherTabsSucceeded(tabs, coeffs);
    const numSuccesses = attempts.reduce((accum, value) => (value ? accum + 1 : accum), 0);

    // When all complete, combine for a total cost:
    return (attempts.length - numSuccesses) / attempts.length;
  }

  /** Nudge a random coefficient in a random direction. */
  randomTransition(coeffs) {
    // It finds the optima really fast. It makes me want to try giving this
    // a larger space to work in, perhaps with non-integral values.

    // We don't nudge by a percentage of the current value because then we
    // never have any cache hits. Witness: x' := x + x*0.5. x' - x'*0.5 != x.
    const ret = coeffs.slice();
    const element = Math.floor(Math.random() * coeffs.length);

    // Make coeffs <1 possible. Someday, maybe make the nudges smaller when
    // the value is less, because things go more exponential there.
    const direction = Math.floor(Math.random() * 2) ? -1 : 1;
    ret[element] += direction;
    return ret;
  }

  initialSolution() {
    return RulesetFactory.getCoeffsInOrder(defaultCoefficients);
  }
}

(async function main() {
  const urls = [
    'file:///Users/osmose/Downloads/fathom-training-set/amazon/amazon-beauty-source.html',
  ]; // TODO: Figure out how to get file:// urls here
  //await setViewportSize(tabs[0], 1024, 768); // TODO: Figure out how to set viewport size

  const tuner = new Tuner(urls, 'price');
  const [bestSolution, bestCost] = await tuner.anneal();
  marionetteScriptFinished([bestSolution, bestCost]);
}());
