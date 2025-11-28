"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import {
  LayoutDashboard,
  Package,
  Users,
  ShoppingCart,
  TrendingUp,
  Settings,
  LogOut,
} from "lucide-react"

import { useCurrentUser } from "../app/hooks/useCurrentUser"

export function Sidebar() {
  const router = useRouter()
  const [loggingOut, setLoggingOut] = useState(false)

  const { user, loading } = useCurrentUser()

  // Mientras carga, solo mostramos el shell del sidebar
  if (loading || !user) {
    return (
      <aside className="w-64 bg-white border-r border-gray-200 min-h-screen flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-green-700">Farmacia</h1>
          <p className="text-sm text-gray-600 mt-1">Podología Clínica</p>
        </div>

        <div className="p-4 text-gray-500">Cargando...</div>
      </aside>
    )
  }

  const role = user.rolNombre
  const isAdmin = role === "ADMIN"
  const displayName = user.nombreCompleto

  const handleLogout = async () => {
    setLoggingOut(true)
    try {
      await fetch("/api/auth/logout", { method: "POST" })
      router.push("/login")
    } finally {
      setLoggingOut(false)
    }
  }

  // 🔹 Opciones visibles para TODOS
  const commonLinks = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/clientes", label: "Clientes", icon: Users },
    { href: "/ventas/nueva", label: "Nueva Venta", icon: TrendingUp },
    { href: "/ventas/historial", label: "Historial Ventas", icon: TrendingUp },
  ]

  // 🔹 Opciones SOLO ADMIN (van siempre en bloque y orden fijo)
  const adminLinks = [
    { href: "/productos", label: "Productos", icon: Package },
    { href: "/proveedores", label: "Proveedores", icon: TrendingUp },
    { href: "/compras", label: "Compras",icon: ShoppingCart  },
    { href: "/usuarios", label: "Usuarios", icon: Settings },
  ]

  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-screen flex flex-col">
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-2xl font-bold text-green-700">Farmacia</h1>
        <p className="text-sm text-gray-600 mt-1">Podología Clínica</p>
      </div>

      <nav className="flex-1 p-4">
        {/* Sección general (todos los roles) */}
        <div className="space-y-2">
          {commonLinks.map((item) => (
            <Link key={item.href} href={item.href}>
              <Button
                variant="ghost"
                className="w-full justify-start text-gray-700 hover:bg-green-50 hover:text-green-700"
              >
                <item.icon className="w-4 h-4 mr-3" />
                {item.label}
              </Button>
            </Link>
          ))}
        </div>

        {/* Sección administración (solo ADMIN) */}
        {isAdmin && (
          <div className="mt-6">
            <p className="text-xs font-semibold text-gray-400 uppercase mb-2">
              Administración
            </p>
            <div className="space-y-2">
              {adminLinks.map((item) => (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-gray-700 hover:bg-green-50 hover:text-green-700"
                  >
                    <item.icon className="w-4 h-4 mr-3" />
                    {item.label}
                  </Button>
                </Link>
              ))}
            </div>
          </div>
        )}
      </nav>

      <div className="p-4 border-t border-gray-200 space-y-2">
        <div className="text-sm text-gray-600">
          <p className="font-medium">{displayName}</p>
          <p className="text-xs text-gray-500">{role}</p>
        </div>

        <Button
          onClick={handleLogout}
          disabled={loggingOut}
          variant="destructive"
          className="w-full justify-start"
        >
          <LogOut className="w-4 h-4 mr-3" />
          {loggingOut ? "Cerrando..." : "Cerrar Sesión"}
        </Button>
      </div>
    </aside>
  )
}
