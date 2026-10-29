// One page documents every rule, so a rule's docs link is an anchor on it.
const GOVERNANCE_DOC = 'https://github.com/nisakhantalib/my-ui-kit/blob/main/docs/governance.md';

/** @param {string} ruleName */
export const docsUrl = (ruleName) => `${GOVERNANCE_DOC}#${ruleName}`;
