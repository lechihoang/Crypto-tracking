"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import {
  LayoutDashboard,
  Wallet,
  GitCompare,
  Bell,
  Settings,
  Plus,
  TrendingUp,
} from "lucide-react"

interface CommandItem {
  id: string
  label: string
  action: () => void
  icon?: React.ReactNode
  group: string
}

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  const navigationCommands: CommandItem[] = [
    {
      id: "nav-dashboard",
      label: "Dashboard",
      action: () => {
        router.push("/dashboard")
        setOpen(false)
      },
      icon: <LayoutDashboard className="mr-2 h-4 w-4" />,
      group: "navigation",
    },
    {
      id: "nav-portfolio",
      label: "Portfolio",
      action: () => {
        router.push("/portfolio")
        setOpen(false)
      },
      icon: <Wallet className="mr-2 h-4 w-4" />,
      group: "navigation",
    },
    {
      id: "nav-compare",
      label: "Compare",
      action: () => {
        router.push("/compare")
        setOpen(false)
      },
      icon: <GitCompare className="mr-2 h-4 w-4" />,
      group: "navigation",
    },
    {
      id: "nav-alerts",
      label: "Alerts",
      action: () => {
        router.push("/alerts")
        setOpen(false)
      },
      icon: <Bell className="mr-2 h-4 w-4" />,
      group: "navigation",
    },
    {
      id: "nav-settings",
      label: "Settings",
      action: () => {
        router.push("/settings")
        setOpen(false)
      },
      icon: <Settings className="mr-2 h-4 w-4" />,
      group: "navigation",
    },
  ]

  const actionCommands: CommandItem[] = [
    {
      id: "action-add-coin",
      label: "Add Coin to Portfolio",
      action: () => {
        router.push("/portfolio")
        setOpen(false)
      },
      icon: <Plus className="mr-2 h-4 w-4" />,
      group: "actions",
    },
    {
      id: "action-create-alert",
      label: "Create Price Alert",
      action: () => {
        router.push("/alerts")
        setOpen(false)
      },
      icon: <TrendingUp className="mr-2 h-4 w-4" />,
      group: "actions",
    },
  ]

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Navigation">
          {navigationCommands.map((command) => (
            <CommandItem
              key={command.id}
              onSelect={command.action}
              value={command.label}
            >
              {command.icon}
              <span>{command.label}</span>
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Actions">
          {actionCommands.map((command) => (
            <CommandItem
              key={command.id}
              onSelect={command.action}
              value={command.label}
            >
              {command.icon}
              <span>{command.label}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
