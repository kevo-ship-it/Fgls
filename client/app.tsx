import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { AuthProvider } from "@/hooks/use-auth";

// Auth pages
import AuthPage from "@/pages/auth";
import LoginPage from "@/pages/auth/login";
import SignupPage from "@/pages/auth/signup";
import ForgotPasswordPage from "@/pages/auth/forgot-password";

// Dashboard pages
import DashboardPage from "@/pages/dashboard";
import AccountsPage from "@/pages/dashboard/accounts";
import TransactionsPage from "@/pages/dashboard/transactions";
import BillsPage from "@/pages/dashboard/bills";
import BudgetPage from "@/pages/dashboard/budget";
import InvestmentsPage from "@/pages/dashboard/investments";
import SettingsPage from "@/pages/dashboard/settings";
import HelpPage from "@/pages/dashboard/help";

function Router() {
  return (
    <Switch>
      {/* Auth routes */}
      <Route path="/" component={AuthPage} />
      <Route path="/login" component={LoginPage} />
      <Route path="/signup" component={SignupPage} />
      <Route path="/forgot-password" component={ForgotPasswordPage} />
      
      {/* Dashboard routes */}
      <Route path="/dashboard" component={DashboardPage} />
      <Route path="/dashboard/accounts" component={AccountsPage} />
      <Route path="/dashboard/transactions" component={TransactionsPage} />
      <Route path="/dashboard/bills" component={BillsPage} />
      <Route path="/dashboard/budget" component={BudgetPage} />
      <Route path="/dashboard/investments" component={InvestmentsPage} />
      <Route path="/dashboard/settings" component={SettingsPage} />
      <Route path="/dashboard/help" component={HelpPage} />
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
