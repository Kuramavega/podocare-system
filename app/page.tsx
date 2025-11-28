"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Sidebar } from "@/components/sidebar"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertCircle, TrendingUp, ShoppingCart, Package } from "lucide-react"

interface DashboardData {
  ventasHoy: number
  totalVentasHoy: number
  productosBajoStock: Array<{
    id: number
    nombre: string
    stockActual: number
    stockMinimo: number | null
  }>
}

export default function Dashboard() {
  const router = useRouter()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [userInfo, setUserInfo] = useState({ name: "", role: "" })

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Obtener info del usuario desde el token
        const resVentas = await fetch("/api/ventas?startDate=" + new Date().toISOString().split("T")[0])
        const ventas = await resVentas.json()

        const resProductos = await fetch("/api/productos")
        const productos = await resProductos.json()

        const ventasHoy = ventas.filter((v: any) => {
          const fecha = new Date(v.fecha)
          const hoy = new Date()
          return fecha.toDateString() === hoy.toDateString()
        })

        const totalVentasHoy = ventasHoy.reduce((sum: number, v: any) => sum + Number.parseFloat(v.total), 0)

        const productosBajoStock = productos.filter((p: any) => p.stockMinimo && p.stockActual <= p.stockMinimo)

        setData({
          ventasHoy: ventasHoy.length,
          totalVentasHoy,
          productosBajoStock,
        })

        // Datos de demo para usuario
        setUserInfo({
          name: "Administrador",
          role: "ADMIN",
        })
      } catch (error) {
        console.error("Error fetching dashboard data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Cargando...</p>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar userName={userInfo.name} userRole={userInfo.role} />

      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-1">Bienvenido al sistema de gestión de farmacia</p>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="p-6 bg-white">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-600">Ventas Hoy</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{data?.ventasHoy || 0}</p>
                </div>
                <div className="bg-blue-100 p-3 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-white">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Ventas</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">${data?.totalVentasHoy.toFixed(2) || "0.00"}</p>
                </div>
                <div className="bg-green-100 p-3 rounded-lg">
                  <ShoppingCart className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-white">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-600">Stock Bajo</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{data?.productosBajoStock.length || 0}</p>
                </div>
                <div className="bg-orange-100 p-3 rounded-lg">
                  <Package className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </Card>
          </div>

          {/* Productos con stock bajo */}
          {data && data.productosBajoStock.length > 0 && (
            <Card className="p-6 bg-white">
              <div className="flex items-center gap-2 mb-4">
                <AlertCircle className="w-5 h-5 text-orange-600" />
                <h2 className="text-lg font-bold text-gray-900">Productos con Stock Bajo</h2>
              </div>
              <div className="space-y-3">
                {data.productosBajoStock.map((producto) => (
                  <div key={producto.id} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{producto.nombre}</p>
                      <p className="text-sm text-gray-600">
                        Stock: {producto.stockActual} (Mínimo: {producto.stockMinimo})
                      </p>
                    </div>
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => {
                        // Redirigir a crear compra
                      }}
                    >
                      Comprar
                    </Button>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}
