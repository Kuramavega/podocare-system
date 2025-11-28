"use client"

import { useEffect, useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Edit2, Trash2 } from "lucide-react"

interface Categoria {
  id: number
  nombre: string
}

interface Producto {
  id: number
  nombre: string
  categoria: { nombre: string }
  idCategoria?: number
  precioCompra?: string
  precioVenta: string
  stockActual: number
  stockMinimo?: number | null
  activo: boolean
}

export default function ProductosPage() {
  const [productos, setProductos] = useState<Producto[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)

  // formulario
  const [editingId, setEditingId] = useState<number | null>(null)
  const [nombre, setNombre] = useState("")
  const [idCategoria, setIdCategoria] = useState<string>("")
  const [precioCompra, setPrecioCompra] = useState("")
  const [precioVenta, setPrecioVenta] = useState("")
  const [stockActual, setStockActual] = useState("")
  const [stockMinimo, setStockMinimo] = useState("")
  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  useEffect(() => {
    fetchProductos()
    fetchCategorias()
    checkAdmin()
  }, [])
const fetchProductos = async () => {
  try {
    // pedimos TODOS: activos e inactivos
    const res = await fetch("/api/productos?estado=todos")
    const data = await res.json()
    setProductos(data)
  } catch (error) {
    console.error("Error cargando productos:", error)
  } finally {
    setLoading(false)
  }
}

  const fetchCategorias = async () => {
    try {
      const res = await fetch("/api/categorias")
      if (!res.ok) return
      const data = await res.json()
      setCategorias(data)
    } catch (error) {
      console.error("Error cargando categorías:", error)
    }
  }

  const checkAdmin = () => {
    // TODO: leer rol desde token; por ahora true para pruebas
    setIsAdmin(true)
  }

  const filteredProductos = productos.filter((p) =>
    p.nombre.toLowerCase().includes(search.toLowerCase()),
  )

  const resetForm = () => {
    setEditingId(null)
    setNombre("")
    setIdCategoria("")
    setPrecioCompra("")
    setPrecioVenta("")
    setStockActual("")
    setStockMinimo("")
    setFormError(null)
  }

  // cargar datos para editar
  const handleOpenEdit = async (producto: Producto) => {
    try {
      const res = await fetch(`/api/productos/${producto.id}`)
      if (!res.ok) {
        console.error("No se pudo cargar el producto para edición")
        return
      }
      const p = await res.json()

      setEditingId(p.id)
      setNombre(p.nombre)
      setIdCategoria(String(p.idCategoria))
      setPrecioCompra(p.precioCompra ? String(p.precioCompra) : "")
      setPrecioVenta(String(p.precioVenta))
      setStockActual(String(p.stockActual))
      setStockMinimo(p.stockMinimo != null ? String(p.stockMinimo) : "")
      setShowForm(true)
      setFormError(null)
    } catch (err) {
      console.error("Error cargando producto para editar:", err)
    }
  }

  const handleOpenCreate = () => {
    resetForm()
    setShowForm(true)
  }

  const handleCancelForm = () => {
    resetForm()
    setShowForm(false)
  }

  const handleSaveProducto = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)
    setFormLoading(true)

    try {
      const body = {
        nombre,
        descripcion: "",
        idCategoria: Number(idCategoria),
        precioCompra: precioCompra || null,
        precioVenta: precioVenta || null,
        stockMinimo: stockMinimo || null,
        activo: true,
      }

      const url = editingId ? `/api/productos/${editingId}` : "/api/productos"
      const method = editingId ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          setFormError(data.error || "No autorizado")
        } else {
          setFormError(data.error || "Error al guardar producto")
        }
        return
      }

      await fetchProductos()
      handleCancelForm()
    } catch (error) {
      console.error("Error guardando producto:", error)
      setFormError("Error en la conexión con el servidor")
    } finally {
      setFormLoading(false)
    }
  }

  // desactivar / reactivar
  const handleToggleActivo = async (producto: Producto) => {
    const accion = producto.activo ? "desactivar" : "reactivar"
    const ok = window.confirm(
      `¿Seguro que deseas ${accion} el producto "${producto.nombre}"?`,
    )
    if (!ok) return

    try {
      const res = await fetch(`/api/productos/${producto.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activo: !producto.activo }),
      })

      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        alert(data.error || "No se pudo actualizar el estado del producto")
        return
      }

      await fetchProductos()
    } catch (error) {
      console.error("Error cambiando estado de producto:", error)
      alert("Error en la conexión con el servidor")
    }
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />

      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Productos</h1>
              <p className="text-gray-600 mt-1">Gestiona el inventario de productos</p>
            </div>
            {isAdmin && (
              <Button
                onClick={showForm ? handleCancelForm : handleOpenCreate}
                className="bg-green-600 hover:bg-green-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                {showForm ? "Cancelar" : "Nuevo Producto"}
              </Button>
            )}
          </div>

          {/* Formulario crear / editar */}
          {isAdmin && showForm && (
            <Card className="p-6 mb-6 bg-white">
              <h2 className="text-lg font-semibold mb-4">
                {editingId ? "Editar Producto" : "Nuevo Producto"}
              </h2>

              <form className="grid grid-cols-1 md:grid-cols-2 gap-4" onSubmit={handleSaveProducto}>
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre
                  </label>
                  <Input
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Categoría
                  </label>
                  <select
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    value={idCategoria}
                    onChange={(e) => setIdCategoria(e.target.value)}
                    required
                  >
                    <option value="">Selecciona una categoría</option>
                    {categorias.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Precio compra
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    value={precioCompra}
                    onChange={(e) => setPrecioCompra(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Precio venta
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    value={precioVenta}
                    onChange={(e) => setPrecioVenta(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Stock actual
                  </label>
                  <Input
                    type="number"
                    value={stockActual}
                    onChange={(e) => setStockActual(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Stock mínimo (opcional)
                  </label>
                  <Input
                    type="number"
                    value={stockMinimo}
                    onChange={(e) => setStockMinimo(e.target.value)}
                  />
                </div>

                {formError && (
                  <div className="col-span-1 md:col-span-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                    {formError}
                  </div>
                )}

                <div className="col-span-1 md:col-span-2 flex justify-end gap-2 mt-2">
                  <Button type="button" variant="outline" onClick={handleCancelForm}>
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    className="bg-green-600 hover:bg-green-700"
                    disabled={formLoading}
                  >
                    {formLoading
                      ? "Guardando..."
                      : editingId
                      ? "Actualizar"
                      : "Guardar"}
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {/* Búsqueda */}
          <Card className="p-4 mb-6 bg-white">
            <Input
              type="text"
              placeholder="Buscar producto..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full"
            />
          </Card>

          {/* Tabla */}
          <Card className="bg-white overflow-hidden">
            {loading ? (
              <div className="p-8 text-center">Cargando...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-100 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                        Nombre
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                        Categoría
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                        Precio
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                        Stock
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                        Estado
                      </th>
                      {isAdmin && (
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                          Acciones
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredProductos.map((producto) => (
                      <tr key={producto.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {producto.nombre}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {producto.categoria.nombre}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          ${Number.parseFloat(String(producto.precioVenta)).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {producto.stockActual}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              producto.activo
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {producto.activo ? "Activo" : "Inactivo"}
                          </span>
                        </td>
                        {isAdmin && (
                          <td className="px-6 py-4 text-sm">
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleOpenEdit(producto)}
                              >
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleToggleActivo(producto)}
                              >
                                <Trash2 className="w-4 h-4 text-red-600" />
                              </Button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      </main>
    </div>
  )
}
