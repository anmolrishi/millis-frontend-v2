import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, 
  Users, 
  BookOpen, 
  Phone, 
  History, 
  CreditCard, 
  LogOut,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { signOut } from '../lib/auth';
import { WorkspaceDropdown } from './WorkspaceDropdown';
import { useState } from 'react';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/home' },
  { icon: Users, label: 'Agents', path: '/agents' },
  { icon: BookOpen, label: 'Knowledge Base', path: '/knowledge-base' },
  { icon: Phone, label: 'Phone numbers', path: '/phone-numbers' },
  { icon: History, label: 'Call history', path: '/call-history' },
  { icon: CreditCard, label: 'Billing', path: '/billing' },
];

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleLogout = async () => {
    await signOut();
  };

  return (
    <div className="relative flex">
      <div className={`${isCollapsed ? 'w-16' : 'w-56'} h-screen bg-black text-white flex flex-col flex-shrink-0 transition-all duration-300`}>
        {/* Center positioned collapse button */}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)} 
          className="absolute -right-4 top-1/2 transform -translate-y-1/2 w-8 h-8 bg-black text-white rounded-full flex items-center justify-center hover:bg-gray-800 transition-colors shadow-xl ring-2 ring-blue-500 z-10"
        >
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>

        <div className="p-3 border-b border-gray-800">
          <WorkspaceDropdown isCollapsed={isCollapsed} />
        </div>

        <nav className="flex-1 overflow-y-auto py-3">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center ${!isCollapsed ? 'space-x-2' : 'justify-center'} px-3 py-2 rounded-lg transition-all duration-200 text-sm ${
                      isActive 
                        ? 'bg-blue-600 text-white shadow-sm' 
                        : 'text-gray-300 hover:bg-gray-900 hover:text-white'
                    }`
                  }
                >
                  <item.icon size={16} />
                  {!isCollapsed && <span className="whitespace-nowrap">{item.label}</span>}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="p-3 border-t border-gray-800">
          <button
            onClick={handleLogout}
            className={`flex items-center ${!isCollapsed ? 'space-x-2' : 'justify-center'} w-full px-3 py-2 rounded-lg text-gray-300 hover:bg-gray-900 hover:text-white transition-colors text-sm`}
          >
            <LogOut size={16} />
            {!isCollapsed && <span>Logout</span>}
          </button>
        </div>
      </div>
    </div>
  );
}