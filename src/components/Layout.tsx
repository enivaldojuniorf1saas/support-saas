import { Sidebar } from './Sidebar'

export function Layout({ children }: { children: React.ReactNode}) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      {/* Desktop: margem da sidebar / Mobile: margem do bottom nav */}
      <main className="flex-1 md:ml-56 mb-16 md:mb-0 min-h-screen">
        {children}
      </main>
    </div>
  )
}