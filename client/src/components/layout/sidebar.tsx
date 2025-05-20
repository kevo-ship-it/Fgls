import { useLocation, Link } from "wouter";
import { cn } from "@/lib/utils";
import { 
  Home, 
  CreditCard, 
  ArrowRightLeft, 
  FileText, 
  LineChart, 
  TrendingUp, 
  Settings, 
  HelpCircle, 
  LogOut 
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

interface SidebarItemProps {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  onClick?: () => void;
}

const SidebarItem = ({ href, icon, children, onClick }: SidebarItemProps) => {
  const [location] = useLocation();
  const isActive = location === href;

  return (
    <li>
      <Link href={href}>
        <a 
          className={cn(
            "flex items-center p-2 text-base font-normal rounded-lg",
            isActive 
              ? "bg-primary text-primary-foreground" 
              : "text-gray-900 hover:bg-gray-100"
          )}
          onClick={onClick}
        >
          <span className="w-6 h-6 flex items-center justify-center transition duration-75">
            {icon}
          </span>
          <span className="ml-3">{children}</span>
        </a>
      </Link>
    </li>
  );
};

export default function Sidebar() {
  const { logout } = useAuth();

  return (
    <aside id="sidebar" className="fixed top-0 left-0 z-20 w-64 h-full pt-16 transition-transform -translate-x-full bg-white border-r border-gray-200 lg:translate-x-0" aria-label="Sidebar">
      <div className="h-full px-3 pb-4 overflow-y-auto bg-white">
        <ul className="space-y-2 pt-4">
          <SidebarItem href="/dashboard" icon={<Home size={20} />}>
            Dashboard
          </SidebarItem>
          <SidebarItem href="/dashboard/accounts" icon={<CreditCard size={20} />}>
            Accounts
          </SidebarItem>
          <SidebarItem href="/dashboard/transactions" icon={<ArrowRightLeft size={20} />}>
            Transactions
          </SidebarItem>
          <SidebarItem href="/dashboard/bills" icon={<FileText size={20} />}>
            Bills
          </SidebarItem>
          <SidebarItem href="/dashboard/budget" icon={<LineChart size={20} />}>
            Budget
          </SidebarItem>
          <SidebarItem href="/dashboard/investments" icon={<TrendingUp size={20} />}>
            Investments
          </SidebarItem>
          <SidebarItem href="/dashboard/settings" icon={<Settings size={20} />}>
            Settings
          </SidebarItem>
          <SidebarItem href="/dashboard/help" icon={<HelpCircle size={20} />}>
            Help & Support
          </SidebarItem>
          <SidebarItem 
            href="/login" 
            icon={<LogOut size={20} />} 
            onClick={(e) => {
              e.preventDefault();
              logout();
            }}
          >
            Sign Out
          </SidebarItem>
        </ul>
      </div>
    </aside>
  );
          }
