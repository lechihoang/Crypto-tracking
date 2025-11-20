"use client"

import {
  CircleCheck,
  Info,
  LoaderCircle,
  OctagonX,
  TriangleAlert,
} from "lucide-react"
import { useTheme } from "next-themes"
import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      icons={{
        success: <CircleCheck className="h-4 w-4" />,
        info: <Info className="h-4 w-4" />,
        warning: <TriangleAlert className="h-4 w-4" />,
        error: <OctagonX className="h-4 w-4" />,
        loading: <LoaderCircle className="h-4 w-4 animate-spin" />,
      }}
      toastOptions={{
        classNames: {
          toast: "group toast group-[.toaster]:shadow-lg group-[.toaster]:border",
          success: "group-[.toaster]:bg-green-950 group-[.toaster]:text-green-50 group-[.toaster]:border-green-800",
          error: "group-[.toaster]:bg-red-950 group-[.toaster]:text-red-50 group-[.toaster]:border-red-800",
          warning: "group-[.toaster]:bg-yellow-950 group-[.toaster]:text-yellow-50 group-[.toaster]:border-yellow-800",
          info: "group-[.toaster]:bg-blue-950 group-[.toaster]:text-blue-50 group-[.toaster]:border-blue-800",
          loading: "group-[.toaster]:bg-gray-800 group-[.toaster]:text-gray-50 group-[.toaster]:border-gray-700",
          description: "group-[.toast]:text-inherit group-[.toast]:opacity-90",
          actionButton:
            "group-[.toast]:bg-white/20 group-[.toast]:text-white group-[.toast]:hover:bg-white/30",
          cancelButton:
            "group-[.toast]:bg-white/10 group-[.toast]:text-white group-[.toast]:hover:bg-white/20",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
