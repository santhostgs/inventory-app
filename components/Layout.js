import { useRouter } from 'next/router'

<Link href="/inventory" className={linkClass('/inventory')}>
  Inventory
</Link>

export default function Layout({ children }) {
  const router = useRouter()

  const linkClass = (path) =>
    `block px-3 py-2 rounded ${
      router.pathname === path
        ? 'bg-blue-100 text-blue-600 font-semibold'
        : 'text-gray-700 hover:bg-gray-100'
    }`

  return (
    <div className="flex h-screen bg-gray-100">

      <div className="w-60 bg-white shadow-md p-4">
        <h2 className="text-xl font-bold mb-6">My Business</h2>

        <nav className="space-y-2">
          <a href="/" className={linkClass('/')}>Dashboard</a>
          <a href="/inventory" className={linkClass('/inventory')}>Inventory</a>
          <a href="/invoice" className={linkClass('/invoice')}>Invoices</a>
        </nav>
      </div>

      <div className="flex-1 p-6">{children}</div>
    </div>
  )
}