"use client";

import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { cn } from "@/libs/tailwind";
import { Home, Settings, HelpCircle, MessageSquare, Plus } from 'lucide-react';
import ButtonAccount from "@/components/ButtonAccount";
import { AddChatbotModal } from "./AddChatbotModal";
import { usePathname } from 'next/navigation';

const sidebarItems = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Settings', href: '/settings', icon: Settings },
  { name: 'Help', href: '/help', icon: HelpCircle },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="w-64 border-r bg-card px-4 py-6">
      <div className="space-y-6">
        {/* Account Section */}
        <div className="space-y-2">
          <ButtonAccount />
          <AddChatbotModal onChatbotCreated={() => {}} />
        </div>

        {/* Navigation Section */}
        <div>
          <h2 className="mb-2 px-2 text-lg font-semibold tracking-tight">
            Navigation
          </h2>
          <div className="space-y-1">
            {sidebarItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Button
                  key={item.name}
                  variant="ghost"
                  className={cn(
                    "w-full justify-start",
                    isActive && "bg-primary/10 text-primary hover:bg-primary/20"
                  )}
                  asChild
                >
                  <Link href={item.href}>
                    <item.icon className="mr-2 h-4 w-4" />
                    {item.name}
                  </Link>
                </Button>
              );
            })}
          </div>
        </div>

        {/* Chatbots Section */}
        <div>
          <h2 className="mb-2 px-2 text-lg font-semibold tracking-tight">
            Your Chatbots
          </h2>
          <div className="space-y-1">
            <Button
              variant="ghost"
              className="w-full justify-start text-muted-foreground hover:text-foreground"
              asChild
            >
              <Link href="/dashboard">
                <MessageSquare className="mr-2 h-4 w-4" />
                All Chatbots
              </Link>
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start text-muted-foreground hover:text-foreground"
              asChild
            >
              <Link href="/dashboard/new">
                <Plus className="mr-2 h-4 w-4" />
                New Chatbot
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
