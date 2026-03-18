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

  async function addProduct() {
    await supabase.from('products').insert([
      { name: "Camera", price: 5000, stock: 10 }
    ])
    fetchProducts()
  }

  return (
    <div>
      <h1>Inventory</h1>
      <button onClick={addProduct}>Add Product</button>

      {products.map(p => (
        <div key={p.id}>
          {p.name} - ₹{p.price} - Stock: {p.stock}
        </div>
      ))}
    </div>
  )
}