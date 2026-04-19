import { useRouter } from 'next/router'

export default function Layout({ children }) {
  const router = useRouter()

  // 🔗 Sidebar link styling
  const linkClass = (path) => {
    const isActive = router.pathname === path

    return `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-all duration-200 ${
      isActive
        ? 'bg-blue-600 text-white shadow-md'
        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
    }`
  }

  return (
    <div className="flex h-screen bg-gray-100">

      {/* 🧭 Sidebar */}
      <div className="w-60 bg-white shadow-md p-4 flex flex-col">
        <h2 className="text-xl font-bold mb-6">BizBook</h2>

        <nav className="space-y-2">
          <a href="/" className={linkClass('/')}>🏠 Dashboard</a>
          <a href="/products" className={linkClass('/products')}>📦 Products</a>
          <a href="/customers" className={linkClass('/customers')}>👥 Customers</a>
          <a href="/invoice" className={linkClass('/invoice')}>🧾 Invoices</a>
        </nav>
      </div>

      {/* 👉 Right Side */}
      <div className="flex-1 flex flex-col">

        {/* 🔝 Header */}
        <div className="bg-white px-6 py-4 shadow flex justify-between items-center">
          <h1 className="font-semibold text-lg">BizBook Dashboard</h1>

          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">Welcome</span>

            {/* Avatar */}
            <div className="w-8 h-8 bg-blue-600 text-white flex items-center justify-center rounded-full">
              S
            </div>
          </div>
        </div>

        {/* 📄 Page Content */}
        <div className="p-6 overflow-auto">
          {children}
        </div>

      </div>
    </div>
  )
}