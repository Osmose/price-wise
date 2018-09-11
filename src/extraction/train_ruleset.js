import RulesetFactory from 'commerce/extraction/ruleset_factory';

addMessageListener('checkRuleset', {
  receiveMessage(message) {
    let result = false;

    const factory = new RulesetFactory(message.data.coeffs);
    const ruleset = factory.makeRuleset();
    const facts = ruleset.against(content.document);
    const found = facts.get(message.data.id);
    if (found.length >= 1) {
      const fnode = found[0]; // arbitrary pick
      if (fnode.element.getAttribute('data-fathom') === message.data.id) {
        result = true;
      }
    }

    sendAsyncMessage('matchResult', {result});
  },
});
