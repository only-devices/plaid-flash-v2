import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Plaid Flash',
  description: 'A lightweight application for connecting bank accounts using Plaid Link',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

