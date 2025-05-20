import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import session from "express-session";
import MemoryStoreFactory from "memorystore";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcryptjs";
import { insertUserSchema, insertAccountSchema, insertTransactionSchema, insertBillSchema, insertBudgetSchema } from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";

// Setup session store
const MemoryStore = MemoryStoreFactory(session);

export async function registerRoutes(app: Express): Promise<Server> {
  // Configure session middleware
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "banksecure-secret-key",
      resave: false,
      saveUninitialized: false,
      cookie: { 
        secure: process.env.NODE_ENV === "production",
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
      },
      store: new MemoryStore({
        checkPeriod: 86400000 // prune expired entries every 24h
      }),
    })
  );

  // Initialize Passport and restore authentication state from session
  app.use(passport.initialize());
  app.use(passport.session());

  // Configure Passport local strategy
  passport.use(
    new LocalStrategy(
      { usernameField: "email" },
      async (email, password, done) => {
        try {
          const user = await storage.getUserByEmail(email);
          if (!user) {
            return done(null, false, { message: "Invalid email or password" });
          }

          const isMatch = await bcrypt.compare(password, user.password);
          if (!isMatch) {
            return done(null, false, { message: "Invalid email or password" });
          }

          // Remove password before returning user object
          const { password: _, ...userWithoutPassword } = user;
          return done(null, userWithoutPassword);
        } catch (error) {
          return done(error);
        }
      }
    )
  );

  // Serialize and deserialize user for session
  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      if (!user) {
        return done(null, false);
      }
      const { password: _, ...userWithoutPassword } = user;
      done(null, userWithoutPassword);
    } catch (error) {
      done(error);
    }
  });

  // Authentication check middleware
  const isAuthenticated = (req: Request, res: Response, next: Function) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).json({ message: "Unauthorized" });
  };

  // Error handling for validation errors
  const handleZodError = (error: unknown) => {
    if (error instanceof ZodError) {
      const validationError = fromZodError(error);
      return {
        message: validationError.message,
        errors: error.errors
      };
    }
    return { message: String(error) };
  };

  // Authentication routes
  app.post("/api/auth/signup", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user with this email already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ message: "Email already in use" });
      }

      const newUser = await storage.createUser(userData);
      const { password: _, ...userWithoutPassword } = newUser;
      
      res.status(201).json({ user: userWithoutPassword });
    } catch (error) {
      res.status(400).json(handleZodError(error));
    }
  });

  app.post("/api/auth/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) {
        return next(err);
      }
      if (!user) {
        return res.status(401).json({ message: info.message || "Login failed" });
      }
      req.logIn(user, (err) => {
        if (err) {
          return next(err);
        }
        return res.json({ user });
      });
    })(req, res, next);
  });

  app.post("/api/auth/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: "Error during logout" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/user", (req, res) => {
    if (req.isAuthenticated()) {
      res.json({ user: req.user });
    } else {
      res.status(401).json({ message: "Not authenticated" });
    }
  });

  // Account routes
  app.post("/api/accounts", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const accountData = insertAccountSchema.parse({
        ...req.body,
        userId: user.id
      });
      
      const newAccount = await storage.createAccount(accountData);
      res.status(201).json(newAccount);
    } catch (error) {
      res.status(400).json(handleZodError(error));
    }
  });

  app.get("/api/accounts", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const accounts = await storage.getUserAccounts(user.id);
      res.json(accounts);
    } catch (error) {
      res.status(500).json({ message: "Error fetching accounts" });
    }
  });

  app.get("/api/accounts/:id", isAuthenticated, async (req, res) => {
    try {
      const accountId = parseInt(req.params.id);
      const account = await storage.getAccount(accountId);
      
      if (!account) {
        return res.status(404).json({ message: "Account not found" });
      }
      
      const user = req.user as any;
      if (account.userId !== user.id) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      res.json(account);
    } catch (error) {
      res.status(500).json({ message: "Error fetching account" });
    }
  });

  app.patch("/api/accounts/:id", isAuthenticated, async (req, res) => {
    try {
      const accountId = parseInt(req.params.id);
      const account = await storage.getAccount(accountId);
      
      if (!account) {
        return res.status(404).json({ message: "Account not found" });
      }
      
      const user = req.user as any;
      if (account.userId !== user.id) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const updatedAccount = await storage.updateAccount(accountId, req.body);
      res.json(updatedAccount);
    } catch (error) {
      res.status(400).json(handleZodError(error));
    }
  });

  // Transaction routes
  app.post("/api/transactions", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const transactionData = insertTransactionSchema.parse({
        ...req.body,
        userId: user.id
      });
      
      // Verify account belongs to user
      const account = await storage.getAccount(transactionData.accountId);
      if (!account || account.userId !== user.id) {
        return res.status(403).json({ message: "Account access denied" });
      }
      
      const newTransaction = await storage.createTransaction(transactionData);
      res.status(201).json(newTransaction);
    } catch (error) {
      res.status(400).json(handleZodError(error));
    }
  });

  app.get("/api/transactions", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const transactions = await storage.getUserTransactions(user.id);
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ message: "Error fetching transactions" });
    }
  });

  app.get("/api/accounts/:id/transactions", isAuthenticated, async (req, res) => {
    try {
      const accountId = parseInt(req.params.id);
      const account = await storage.getAccount(accountId);
      
      if (!account) {
        return res.status(404).json({ message: "Account not found" });
      }
      
      const user = req.user as any;
      if (account.userId !== user.id) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const transactions = await storage.getAccountTransactions(accountId);
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ message: "Error fetching transactions" });
    }
  });

  // Bill routes
  app.post("/api/bills", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const billData = insertBillSchema.parse({
        ...req.body,
        userId: user.id
      });
      
      const newBill = await storage.createBill(billData);
      res.status(201).json(newBill);
    } catch (error) {
      res.status(400).json(handleZodError(error));
    }
  });

  app.get("/api/bills", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const bills = await storage.getUserBills(user.id);
      res.json(bills);
    } catch (error) {
      res.status(500).json({ message: "Error fetching bills" });
    }
  });

  app.patch("/api/bills/:id", isAuthenticated, async (req, res) => {
    try {
      const billId = parseInt(req.params.id);
      const bill = await storage.updateBill(billId, req.body);
      
      if (!bill) {
        return res.status(404).json({ message: "Bill not found" });
      }
      
      res.json(bill);
    } catch (error) {
      res.status(400).json(handleZodError(error));
    }
  });

  app.delete("/api/bills/:id", isAuthenticated, async (req, res) => {
    try {
      const billId = parseInt(req.params.id);
      const success = await storage.deleteBill(billId);
      
      if (!success) {
        return res.status(404).json({ message: "Bill not found" });
      }
      
      res.json({ message: "Bill deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Error deleting bill" });
    }
  });

  // Budget routes
  app.post("/api/budgets", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const budgetData = insertBudgetSchema.parse({
        ...req.body,
        userId: user.id
      });
      
      const newBudget = await storage.createBudget(budgetData);
      res.status(201).json(newBudget);
    } catch (error) {
      res.status(400).json(handleZodError(error));
    }
  });

  app.get("/api/budgets", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const budgets = await storage.getUserBudgets(user.id);
      res.json(budgets);
    } catch (error) {
      res.status(500).json({ message: "Error fetching budgets" });
    }
  });

  app.patch("/api/budgets/:id", isAuthenticated, async (req, res) => {
    try {
      const budgetId = parseInt(req.params.id);
      const budget = await storage.updateBudget(budgetId, req.body);
      
      if (!budget) {
        return res.status(404).json({ message: "Budget not found" });
      }
      
      res.json(budget);
    } catch (error) {
      res.status(400).json(handleZodError(error));
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
