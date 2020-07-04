import { getRepository, getCustomRepository } from 'typeorm';
import AppError from '../errors/AppError';
import Transaction from '../models/Transaction';
import TransactionRepository from '../repositories/TransactionsRepository';
import Category from '../models/Category';

interface Request {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category_name: string;
}

class CreateTransactionService {
  public async execute({
    title,
    value,
    type,
    category_name,
  }: Request): Promise<Transaction> {
    const transactionRepository = getCustomRepository(TransactionRepository);
    const categoryRepository = getRepository(Category);

    if (type === 'outcome') {
      const { total } = await transactionRepository.getBalance();

      if (total - value < 0) {
        throw new AppError(`Saldo Insuficiente. Valor Disponível: ${total}`);
      }
    }

    let category = await categoryRepository.findOne({
      where: { title: category_name },
    });

    if (!category) {
      category = categoryRepository.create();

      category.title = category_name;

      category = await categoryRepository.save(category);
    }

    const transaction = transactionRepository.create({
      title,
      value,
      type,
      category,
    });

    await transactionRepository.save(transaction);

    return transaction;
  }
}

export default CreateTransactionService;
