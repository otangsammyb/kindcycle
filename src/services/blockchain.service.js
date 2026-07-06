/**
 * Blockchain Transaction Logging Service — Architectural Hook
 * Replace this stub with real blockchain integration (e.g., Hyperledger, Polygon)
 */
const { createHash } = require('crypto');

const logTransaction = async (transactionData) => {
  // Create a deterministic hash of the transaction data (simulates on-chain record)
  const hash = createHash('sha256')
    .update(JSON.stringify(transactionData))
    .digest('hex');

  const mockTxHash = `0x${hash}`;

  console.log(`[Blockchain Hook] Transaction logged: ${mockTxHash}`);
  console.log('[Blockchain Hook] Data:', JSON.stringify(transactionData));

  // TODO: Submit to actual blockchain
  // Example: await web3.eth.sendSignedTransaction(signedTx);

  // Update the transaction record with the mock hash
  try {
    await require('../models/Transaction').findByIdAndUpdate(
      transactionData.transactionId,
      { blockchainTxHash: mockTxHash }
    );
  } catch { /* non-fatal */ }

  return { txHash: mockTxHash, network: 'stub', timestamp: new Date().toISOString() };
};

const getTransactionProof = async (txHash) => {
  console.log(`[Blockchain Hook] Getting proof for: ${txHash}`);
  // TODO: Query actual blockchain
  return { hash: txHash, verified: true, source: 'stub' };
};

module.exports = { logTransaction, getTransactionProof };
