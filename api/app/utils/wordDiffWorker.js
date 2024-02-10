const { parentPort, workerData } = require("worker_threads");
// we have to import the functions from the dist folder's file
// because the worker is running in a separate process and
// it doesn't have access to the same scope as the main process
// and the dist folder is the compiled version of the app
// so we have to import the functions from the compiled version of the app
const {
  createCreditTransaction,
  calculateCreditAmount,
} = require("../../dist/app/utils/transaction");

async function processJob({ transcript, review }) {
  try {
    const creditAmount = await calculateCreditAmount(transcript);
    const transactionResult = await createCreditTransaction(
      review,
      creditAmount
    );
    parentPort.postMessage({ success: true, transactionResult });
  } catch (error) {
    parentPort.postMessage({
      success: false,
      error:
        error.message ||
        "An error occurred while processing the transaction job.",
    });
  }
}

processJob(workerData);
