import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"

// GET /api/productos?estado=activos|inactivos|todos
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const estado = searchParams.get("estado") ?? "activos" // por defecto solo activos

    let where: any = {}

    if (estado === "activos") {
      where.activo = true
    } else if (estado === "inactivos") {
      where.activo = false
    } else if (estado === "todos") {
      // no filtramos por activo
    }

    const productos = await prisma.producto.findMany({
      where,
      include: { categoria: true },
      orderBy: { nombre: "asc" },
    })

    return NextResponse.json(productos)
  } catch (error) {
    console.error("Error fetching productos:", error)
    return NextResponse.json({ error: "Error fetching productos" }, { status: 500 })
  }
}

// POST /api/productos  -> crear producto nuevo
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const usuarioDb = await prisma.usuario.findUnique({
      where: { id: user.id },
      include: { rol: true },
    })

    // si quieres que solo ADMIN pueda crear productos
    if (usuarioDb?.rol.nombre !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const {
      nombre,
      descripcion,
      idCategoria,
      precioCompra,
      precioVenta,
      stockActual,
      stockMinimo,
      activo,
    } = await request.json()

    const producto = await prisma.producto.create({
      data: {
        nombre,
        descripcion: descripcion ?? null,
        idCategoria,
        precioCompra:
          precioCompra !== null && precioCompra !== undefined
            ? Number.parseFloat(precioCompra)
            : 0,
        precioVenta:
          precioVenta !== null && precioVenta !== undefined
            ? Number.parseFloat(precioVenta)
            : 0,
        stockActual: stockActual !== undefined ? Number(stockActual) : 0,
        stockMinimo:
          stockMinimo !== null && stockMinimo !== undefined
            ? Number.parseInt(stockMinimo)
            : null,
        activo: activo ?? true,
      },
      include: { categoria: true },
    })

    return NextResponse.json(producto, { status: 201 })
  } catch (error) {
    console.error("Error creating producto:", error)
    return NextResponse.json({ error: "Error creating producto" }, { status: 500 })
  }
}
