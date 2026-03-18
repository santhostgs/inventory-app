
export default function Dashboard() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl shadow">
          <p className="text-gray-500">Today's Sales</p>
          <h2 className="text-xl font-bold">₹12,500</h2>
        </div>

        <div className="bg-white p-4 rounded-xl shadow">
          <p className="text-gray-500">Invoices</p>
          <h2 className="text-xl font-bold">8</h2>
        </div>

        <div className="bg-white p-4 rounded-xl shadow">
          <p className="text-gray-500">Low Stock</p>
          <h2 className="text-xl font-bold">3</h2>
        </div>

        <div className="bg-white p-4 rounded-xl shadow">
          <p className="text-gray-500">Pending</p>
          <h2 className="text-xl font-bold">₹5,000</h2>
        </div>
      </div>
    </div>
  )
}