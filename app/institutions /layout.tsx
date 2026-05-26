// app/institutions/layout.tsx
// Simple passthrough — page handles its own shell
import React from 'react'
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
