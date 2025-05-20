import { 
  users, type User, type InsertUser,
  accounts, type Account, type InsertAccount,
  transactions, type Transaction, type InsertTransaction,
  bills, type Bill, type InsertBill,
  budgets, type Budget, type InsertBudget
} from "@shared/schema";
import bcrypt from 'bcryptjs';

// Interface for all storage methods
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, userData: Partial<User>): Promise<User | undefined>;
  
  // Account methods
  createAccount(account: InsertAccount): Promise<Account>;
  getUserAccounts(userId: number): Promise<Account[]>;
  getAccount(id: number): Promise<Account | undefined>;
  updateAccount(id: number, accountData: Partial<Account>): Promise<Account | undefined>;
  
  // Transaction methods
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  getUserTransactions(userId: number): Promise<Transaction[]>;
  getAccountTransactions(accountId: number): Promise<Transaction[]>;
  
  // Bill methods
  createBill(bill: InsertBill): Promise<Bill>;
  getUserBills(userId: number): Promise<Bill[]>;
  updateBill(id: number, billData: Partial<Bill>): Promise<Bill | undefined>;
  deleteBill(id: number): Promise<boolean>;
  
  // Budget methods
  createBudget(budget: InsertBudget): Promise<Budget>;
  getUserBudgets(userId: number): Promise<Budget[]>;
  updateBudget(id: number, budgetData: Partial<Budget>): Promise<Budget | undefined>;
}

// In-memory implementation
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private accounts: Map<number, Account>;
  private transactions: Map<number, Transaction>;
  private bills: Map<number, Bill>;
  private budgets: Map<number, Budget>;
  private userIdCounter: number;
  private accountIdCounter: number;
  private transactionIdCounter: number;
  private billIdCounter: number;
  private budgetIdCounter: number;

  constructor() {
    this.users = new Map();
    this.accounts = new Map();
    this.transactions = new Map();
    this.bills = new Map();
    this.budgets = new Map();
    this.userIdCounter = 1;
    this.accountIdCounter = 1;
    this.transactionIdCounter = 1;
    this.billIdCounter = 1;
    this.budgetIdCounter = 1;
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email.toLowerCase() === email.toLowerCase()
    );
  }

  async createUser(userData: InsertUser): Promise<User> {
    // Hash password before storing
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    
    const id = this.userIdCounter++;
    const now = new Date();
    const user: User = { 
      ...userData, 
      id, 
      password: hashedPassword,
      createdAt: now 
    };
    
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;

    // If updating password, hash it
    if (userData.password) {
      userData.password = await bcrypt.hash(userData.password, 10);
    }

    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Account methods
  async createAccount(accountData: InsertAccount): Promise<Account> {
    const id = this.accountIdCounter++;
    const now = new Date();
    const account: Account = { ...accountData, id, createdAt: now };
    
    this.accounts.set(id, account);
    return account;
  }

  async getUserAccounts(userId: number): Promise<Account[]> {
    return Array.from(this.accounts.values()).filter(
      (account) => account.userId === userId
    );
  }

  async getAccount(id: number): Promise<Account | undefined> {
    return this.accounts.get(id);
  }

  async updateAccount(id: number, accountData: Partial<Account>): Promise<Account | undefined> {
    const account = await this.getAccount(id);
    if (!account) return undefined;

    const updatedAccount = { ...account, ...accountData };
    this.accounts.set(id, updatedAccount);
    return updatedAccount;
  }

  // Transaction methods
  async createTransaction(transactionData: InsertTransaction): Promise<Transaction> {
    const id = this.transactionIdCounter++;
    const now = new Date();
    const transaction: Transaction = { ...transactionData, id, createdAt: now };
    
    this.transactions.set(id, transaction);
    
    // Update account balance
    const account = await this.getAccount(transactionData.accountId);
    if (account) {
      let newBalance = account.balance;
      
      if (transaction.type === 'deposit' || transaction.type === 'interest') {
        newBalance += transaction.amount;
      } else if (transaction.type === 'withdrawal' || transaction.type === 'transfer' || 
                 transaction.type === 'payment' || transaction.type === 'fee') {
        newBalance -= transaction.amount;
      }
      
      await this.updateAccount(account.id, { balance: newBalance });
    }
    
    return transaction;
  }

  async getUserTransactions(userId: number): Promise<Transaction[]> {
    return Array.from(this.transactions.values())
      .filter((transaction) => transaction.userId === userId)
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  async getAccountTransactions(accountId: number): Promise<Transaction[]> {
    return Array.from(this.transactions.values())
      .filter((transaction) => transaction.accountId === accountId)
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  // Bill methods
  async createBill(billData: InsertBill): Promise<Bill> {
    const id = this.billIdCounter++;
    const now = new Date();
    const bill: Bill = { ...billData, id, createdAt: now };
    
    this.bills.set(id, bill);
    return bill;
  }

  async getUserBills(userId: number): Promise<Bill[]> {
    return Array.from(this.bills.values())
      .filter((bill) => bill.userId === userId)
      .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
  }

  async updateBill(id: number, billData: Partial<Bill>): Promise<Bill | undefined> {
    const bill = this.bills.get(id);
    if (!bill) return undefined;

    const updatedBill = { ...bill, ...billData };
    this.bills.set(id, updatedBill);
    return updatedBill;
  }

  async deleteBill(id: number): Promise<boolean> {
    return this.bills.delete(id);
  }

  // Budget methods
  async createBudget(budgetData: InsertBudget): Promise<Budget> {
    const id = this.budgetIdCounter++;
    const now = new Date();
    const budget: Budget = { ...budgetData, id, createdAt: now };
    
    this.budgets.set(id, budget);
    return budget;
  }

  async getUserBudgets(userId: number): Promise<Budget[]> {
    return Array.from(this.budgets.values()).filter(
      (budget) => budget.userId === userId
    );
  }

  async updateBudget(id: number, budgetData: Partial<Budget>): Promise<Budget | undefined> {
    const budget = this.budgets.get(id);
    if (!budget) return undefined;

    const updatedBudget = { ...budget, ...budgetData };
    this.budgets.set(id, updatedBudget);
    return updatedBudget;
  }
}

// Export a single instance of MemStorage
export const storage = new MemStorage();
