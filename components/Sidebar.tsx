import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Home, Settings, HelpCircle } from 'lucide-react'
import ButtonAccount from "@/components/ButtonAccount";

const sidebarItems = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Settings', href: '/settings', icon: Settings },
  { name: 'Help', href: '/help', icon: HelpCircle },
]

export function Sidebar() {
  return (
    <div className="pb-12 w-64 bg-blue-50">
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight text-blue-800">
            Menu
          </h2>
          <ButtonAccount />
          <div className="space-y-1">
            {sidebarItems.map((item) => (
              <Button
                key={item.name}
                variant="ghost"
                className="w-full justify-start text-blue-600 hover:bg-blue-100 hover:text-blue-800"
                asChild
              >
                <Link href={item.href}>
                  <item.icon className="mr-2 h-4 w-4" />
                  {item.name}
                </Link>
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
