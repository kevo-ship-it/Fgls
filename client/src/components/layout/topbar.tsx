import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import { 
  Menu, 
  Search, 
  Bell, 
  HelpCircle,
  ChevronDown
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function TopBar() {
  const { user, logout } = useAuth();
  
  const getInitials = () => {
    if (!user) return "U";
    return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`;
  };

  return (
    <nav className="fixed z-30 w-full bg-white border-b border-gray-200">
      <div className="px-3 py-3 lg:px-5 lg:pl-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center justify-start">
            <button 
              id="toggleSidebarMobile" 
              aria-expanded="true" 
              aria-controls="sidebar" 
              className="p-2 text-gray-600 rounded lg:hidden hover:text-gray-900 hover:bg-gray-100 focus:ring-2 focus:ring-gray-100"
            >
              <Menu className="w-6 h-6" />
              <span className="sr-only">Toggle sidebar</span>
            </button>
            <Link href="/dashboard" className="flex ml-2 md:mr-24">
              <span className="self-center text-xl font-semibold sm:text-2xl whitespace-nowrap">BankSecure</span>
            </Link>
            <div className="hidden lg:flex ml-4">
              <div className="relative flex items-center">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500 pointer-events-none" />
                <input
                  type="text"
                  className="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full pl-10 p-2.5"
                  placeholder="Search..."
                />
              </div>
            </div>
          </div>
          <div className="flex items-center">
            {/* Quick action buttons */}
            <button
              type="button"
              className="p-2 text-gray-500 rounded-lg hover:text-gray-900 hover:bg-gray-100"
            >
              <span className="sr-only">View notifications</span>
              <Bell className="w-6 h-6" />
            </button>
            <button
              type="button"
              className="p-2 text-gray-500 rounded-lg hover:text-gray-900 hover:bg-gray-100 ml-1"
            >
              <span className="sr-only">Get help</span>
              <HelpCircle className="w-6 h-6" />
            </button>
            
            {/* User menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex items-center text-sm bg-gray-50 rounded-lg px-2 py-1 ml-2 hover:bg-gray-100"
                >
                  <Avatar className="w-8 h-8">
                    <AvatarFallback>{getInitials()}</AvatarFallback>
                  </Avatar>
                  <span className="hidden md:inline-block ml-2 text-gray-700">
                    {user?.firstName} {user?.lastName}
                  </span>
                  <ChevronDown className="ml-2 w-4 h-4 text-gray-500" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/settings">Profile Settings</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/accounts">My Accounts</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/help">Help & Support</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => logout()}>
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  );
    }
