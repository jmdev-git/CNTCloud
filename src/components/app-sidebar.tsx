"use client"

import * as React from "react"
import {
  Sidebar,
} from "@/components/ui/sidebar"

export function AppSidebar({ children, ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar variant="sidebar" {...props}>
      {children}
    </Sidebar>
  )
}
