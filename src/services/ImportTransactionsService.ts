import csvParse from 'csv-parse';
import fs from 'fs';
import path from 'path';
import Transaction from '../models/Transaction';
import TransactionService from './CreateTransactionService';
import uploadConfig from '../config/upload';

class ImportTransactionsService {
  async loadCSV(csvFilePath: string): Promise<string[]> {
    const readCSVStream = fs.createReadStream(csvFilePath);

    const parseStream = csvParse({
      from_line: 2,
      ltrim: true,
      rtrim: true,
    });

    const parseCSV = readCSVStream.pipe(parseStream);

    const lines: string[] = [];

    parseCSV.on('data', line => {
      lines.push(line);
    });

    await new Promise(resolve => {
      parseCSV.on('end', resolve);
    });

    return lines;
  }

  async importTransactions(lines: string[]): Promise<Transaction[]> {
    const transactionService = new TransactionService();

    const promises = lines.map(async line => {
      const transaction = await transactionService.execute({
        title: line[0],
        type: line[1] !== 'outcome' ? 'income' : 'outcome',
        value: Number(line[2]),
        category_name: line[3],
      });
      return transaction;
    });

    const transactions = await Promise.all(promises);

    return transactions;
  }

  async execute(filename: string): Promise<Transaction[]> {
    const csvFilePath = path.resolve(uploadConfig.directory, filename);
    const lines = await this.loadCSV(csvFilePath);
    const transactions = await this.importTransactions(lines);
    return transactions;
  }
}

export default ImportTransactionsService;
