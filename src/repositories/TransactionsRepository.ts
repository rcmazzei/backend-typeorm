import { EntityRepository, Repository } from 'typeorm';

import Transaction from '../models/Transaction';

interface Balance {
  income: number;
  outcome: number;
  total: number;
}

interface TransactionDTO {
  transactions: Transaction[];
  balance: Balance;
}

@EntityRepository(Transaction)
class TransactionsRepository extends Repository<Transaction> {
  private getTransactionValueByType(
    type: string,
    transactions: Transaction[],
  ): number {
    const value = transactions.reduce((accumulator, transaction) => {
      return transaction.type === type
        ? accumulator + Number(transaction.value)
        : accumulator;
    }, 0);
    return value;
  }

  public async all(): Promise<TransactionDTO> {
    const transactions = await this.find({
      select: [
        'id',
        'title',
        'value',
        'type',
        'category',
        'created_at',
        'updated_at',
      ],
      relations: ['category'],
    });
    const balance = await this.getBalance();

    // transactions.map(transaction => {
    //   delete transaction.category_id;
    //   return transaction;
    // });

    return {
      transactions,
      balance,
    };
  }

  public async getBalance(): Promise<Balance> {
    const transactions = await this.find();

    const income = this.getTransactionValueByType('income', transactions);
    const outcome = this.getTransactionValueByType('outcome', transactions);

    const balance = {
      income,
      outcome,
      total: income - outcome,
    };

    return balance;
  }
}

export default TransactionsRepository;
