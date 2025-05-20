import { useState } from "react";
import { Link } from "wouter";
import { CreditCard, Plus, ChevronRight } from "lucide-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Account } from "@shared/schema";

interface AccountsOverviewProps {
  accounts: any[];
  isLoading: boolean;
}

export default function AccountsOverview({ accounts, isLoading }: AccountsOverviewProps) {
  const [activeTab, setActiveTab] = useState<string>("all");
  
  const filteredAccounts = activeTab === "all" 
    ? accounts 
    : accounts.filter(account => account.type === activeTab);
  
  const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0);
  
  return (
    <div className="mb-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Accounts Overview</h2>
          <p className="text-gray-500">Manage your accounts and track spending</p>
        </div>
        <div className="mt-2 md:mt-0">
          <Button className="flex items-center">
            <Plus className="mr-2 h-4 w-4" />
            Add Account
          </Button>
        </div>
      </div>
      
      <div className="mb-4 border-b border-gray-200">
        <ul className="flex flex-wrap -mb-px text-sm font-medium text-center">
          <li className="mr-2">
            <button
              className={`inline-block p-4 rounded-t-lg ${
                activeTab === "all"
                  ? "border-b-2 border-primary text-primary"
                  : "border-transparent hover:text-gray-600 hover:border-gray-300"
              }`}
              onClick={() => setActiveTab("all")}
            >
              All Accounts
            </button>
          </li>
          <li className="mr-2">
            <button
              className={`inline-block p-4 rounded-t-lg ${
                activeTab === "checking"
                  ? "border-b-2 border-primary text-primary"
                  : "border-transparent hover:text-gray-600 hover:border-gray-300"
              }`}
              onClick={() => setActiveTab("checking")}
            >
              Checking
            </button>
          </li>
          <li className="mr-2">
            <button
              className={`inline-block p-4 rounded-t-lg ${
                activeTab === "savings"
                  ? "border-b-2 border-primary text-primary"
                  : "border-transparent hover:text-gray-600 hover:border-gray-300"
              }`}
              onClick={() => setActiveTab("savings")}
            >
              Savings
            </button>
          </li>
          <li className="mr-2">
            <button
              className={`inline-block p-4 rounded-t-lg ${
                activeTab === "credit"
                  ? "border-b-2 border-primary text-primary"
                  : "border-transparent hover:text-gray-600 hover:border-gray-300"
              }`}
              onClick={() => setActiveTab("credit")}
            >
              Credit
            </button>
          </li>
          <li>
            <button
              className={`inline-block p-4 rounded-t-lg ${
                activeTab === "investment"
                  ? "border-b-2 border-primary text-primary"
                  : "border-transparent hover:text-gray-600 hover:border-gray-300"
              }`}
              onClick={() => setActiveTab("investment")}
            >
              Investment
            </button>
          </li>
        </ul>
      </div>
      
      <div className="mb-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-medium text-gray-500">Total Balance</h3>
                {isLoading ? (
                  <Skeleton className="h-8 w-32 mt-1" />
                ) : (
                  <p className="text-3xl font-bold">${totalBalance.toFixed(2)}</p>
                )}
              </div>
              <Link href="/dashboard/accounts">
                <Button variant="outline" className="flex items-center">
                  View All
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          Array(3).fill(0).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-center mb-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="ml-3">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-20 mt-1" />
                  </div>
                </div>
                <Skeleton className="h-6 w-24 mb-2" />
                <Skeleton className="h-3 w-full" />
              </CardContent>
            </Card>
          ))
        ) : filteredAccounts.length > 0 ? (
          filteredAccounts.map((account: Account) => (
            <Card key={account.id}>
              <CardContent className="p-4">
                <div className="flex items-center mb-3">
                  <div className="rounded-full bg-primary/10 p-2">
                    <CreditCard className="h-6 w-6 text-primary" />
                  </div>
                  <div className="ml-3">
                    <h4 className="font-medium">{account.name}</h4>
                    <p className="text-sm text-gray-500">
                      **** {account.accountNumber.slice(-4)}
                    </p>
                  </div>
                </div>
                <p className="text-2xl font-bold mb-1">${account.balance.toFixed(2)}</p>
                <p className="text-sm text-gray-500 capitalize">
                  {account.type} Account
                </p>
              </CardContent>
              <CardFooter className="bg-gray-50 p-4 flex justify-between">
                <Link href={`/dashboard/accounts/${account.id}`}>
                  <Button variant="ghost" size="sm">View Details</Button>
                </Link>
                <Link href={`/dashboard/accounts/${account.id}/transactions`}>
                  <Button variant="ghost" size="sm">Transactions</Button>
                </Link>
              </CardFooter>
            </Card>
          ))
        ) : (
          <Card className="col-span-full">
            <CardContent className="p-6 text-center">
              <p className="text-gray-500 mb-4">No accounts found in this category.</p>
              <Button>Add a New Account</Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
    }
