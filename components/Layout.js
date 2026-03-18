export default function Layout({ children }) {
  return (
    <div className="flex h-screen bg-gray-100">

      {/* Sidebar */}
      <div className="w-60 bg-white shadow-md p-4">
        <h2 className="text-xl font-bold mb-6">My Business</h2>

        <nav className="space-y-3">
          <a href="/" className="block text-blue-600 font-semibold">Dashboard</a>
          <a href="/inventory">Inventory</a>
          <a href="/invoice">Invoices</a>
        </nav>
      </div>

      {/* Content */}
      <div className="flex-1 p-6">
        {children}
      </div>

    </div>
  )
}