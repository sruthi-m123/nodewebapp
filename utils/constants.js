export const WALLET_CONSTANTS = {
  TRANSACTION_TYPES: {
    DEPOSIT: 'deposit',
    CREDIT: 'credit',
    WITHDRAWAL: 'withdrawal'
  },
  STATUS: {
    COMPLETED: 'completed',
    PENDING: 'pending',
    FAILED: 'failed'
  },
  ERROR_MESSAGES: {
    SESSION_MISSING: 'Session missing',
    INVALID_AMOUNT: 'Invalid amount',
    INSUFFICIENT_BALANCE: 'Insufficient balance',
    WALLET_NOT_FOUND: 'Wallet not found',
    TRANSACTION_FAILED: 'Transaction failed',
    ALREADY_PROCESSED: 'Transaction already processed'
  },
  SUCCESS_MESSAGES: {
    FUNDS_ADDED: 'Funds added successfully',
    TRANSACTION_COMPLETED: 'Transaction completed successfully'
  },
  PAGINATION: {
    DEFAULT_LIMIT: 6,
    MAX_LIMIT: 50
  }
};

