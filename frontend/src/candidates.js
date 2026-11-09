// Display-only party labels, matched by candidate name returned from the contract.
export const PARTIES = {
  "Alice Johnson": "Progressive Party",
  "Bob Smith": "Unity Party",
  "Charlie Brown": "People First",
};

export const partyOf = (name) => PARTIES[name] || "Independent";
