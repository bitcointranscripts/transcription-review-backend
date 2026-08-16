type BitcoinNetwork = {
  bech32: string;
  pubKeyHash: number;
  scriptHash: number;
  validWitnessVersions: number[];
};

const MAINNET: BitcoinNetwork = {
  bech32: "bc",
  pubKeyHash: 0x00,
  scriptHash: 0x05,
  validWitnessVersions: [0, 1],
};

// Signet shares testnet's address version bytes; only the bech32 HRP differs.
const SIGNET: BitcoinNetwork = {
  bech32: "tbs",
  pubKeyHash: 0x6f,
  scriptHash: 0xc4,
  validWitnessVersions: [0, 1],
};

export { MAINNET, SIGNET };
