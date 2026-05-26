import DashboardShell from '@/components/dashboard/DashboardShell'
import React from 'react'

export default function Layout({ children }: { children: React.ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>
}
