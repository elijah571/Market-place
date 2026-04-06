import mongoose from 'mongoose';

let cachedTransactionSupport = null;

const isUnsupportedTransactionError = (error) =>
  /Transaction numbers are only allowed on a replica set member or mongos/i.test(
    String(error?.message || '')
  );

export const supportsMongoTransactions = async () => {
  if (cachedTransactionSupport !== null) {
    return cachedTransactionSupport;
  }

  const db = mongoose.connection?.db;

  if (!db) {
    cachedTransactionSupport = false;
    return cachedTransactionSupport;
  }

  try {
    const hello = await db.admin().command({ hello: 1 });
    cachedTransactionSupport = Boolean(hello?.setName || hello?.msg === 'isdbgrid');
  } catch {
    cachedTransactionSupport = false;
  }

  return cachedTransactionSupport;
};

export const runWithOptionalTransaction = async (work) => {
  const session = await mongoose.startSession();
  let useTransaction = await supportsMongoTransactions();

  try {
    if (useTransaction) {
      try {
        session.startTransaction();
      } catch (error) {
        if (!isUnsupportedTransactionError(error)) {
          throw error;
        }

        cachedTransactionSupport = false;
        useTransaction = false;
      }
    }

    const result = await work(useTransaction ? session : null);

    if (useTransaction && session.inTransaction()) {
      await session.commitTransaction();
    }

    return result;
  } catch (error) {
    if (useTransaction && session.inTransaction()) {
      await session.abortTransaction();
    }

    throw error;
  } finally {
    await session.endSession();
  }
};
