// pages/inventory.js
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Inventory() {
  const [products, setProducts] = useState([])

  useEffect(() => {
    fetchProducts()
  }, [])

  async function fetchProducts() {
    let { data } = await supabase.from('products').select('*')
    setProducts(data)
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Inventory</h1>

      <table className="w-full bg-white rounded-xl shadow">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-3 text-left">Name</th>
            <th className="p-3">Price</th>
            <th className="p-3">Stock</th>
          </tr>
        </thead>

        <tbody>
          {products.map(p => (
            <tr key={p.id} className="border-t">
              <td className="p-3">{p.name}</td>
              <td className="p-3 text-center">₹{p.price}</td>
              <td className="p-3 text-center">{p.stock}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}