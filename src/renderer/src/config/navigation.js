import {
  LayoutDashboard, Sprout, Map, CalendarDays, Repeat2, PackageOpen, WalletCards,
  ChartNoAxesCombined, Leaf, Link2, BrainCircuit, TrendingUp, Megaphone,
  CloudSun, Coffee, GraduationCap, CircleHelp, Award, Settings, ShoppingBasket, CircleDollarSign
} from '@lucide/vue'

export const navigationGroups = [
  {
    id: 'operacion',
    label: 'Operación',
    items: [
      { id: 'inicio', label: 'Resumen', icon: LayoutDashboard, description: 'Indicadores y actividad reciente' },
      { id: 'finca', label: 'Mi finca', icon: Sprout, description: 'Datos generales y certificaciones' },
      { id: 'lotes', label: 'Lotes', icon: Map, description: 'Parcelas, variedades e historial' },
      { id: 'cosecha', label: 'Cosecha', icon: CalendarDays, description: 'Planillas, cortes y recolectores' },
      { id: 'compras', label: 'Compras de café', icon: ShoppingBasket, description: 'Acopio, recepción por peso y proveedores' },
      { id: 'ventas', label: 'Ventas de café', icon: CircleDollarSign, description: 'Clientes, facturación y salida automática del inventario' },
      { id: 'beneficio', label: 'Beneficio', icon: Repeat2, description: 'Procesamiento propio o comprado y rendimiento' },
      { id: 'inventario', label: 'Inventario', icon: PackageOpen, description: 'Existencias y movimientos' },
      { id: 'gastos', label: 'Gastos', icon: WalletCards, description: 'Costos de producción y operación' }
    ]
  },
  {
    id: 'inteligencia',
    label: 'Inteligencia',
    items: [
      { id: 'reportes', label: 'Reportes', icon: ChartNoAxesCombined, description: 'Resultados y rentabilidad' },
      { id: 'sostenibilidad', label: 'Sostenibilidad', icon: Leaf, description: 'Huella y prácticas regenerativas' },
      { id: 'calidad', label: 'Calidad', icon: Award, description: 'Cataciones y evaluación SCA' },
      { id: 'trazabilidad', label: 'Trazabilidad', icon: Link2, description: 'Origen y cadena de registros' },
      { id: 'predictivo', label: 'Predictivo', icon: BrainCircuit, description: 'Estimaciones agronómicas' },
      { id: 'mercado', label: 'Mercado', icon: TrendingUp, description: 'Precios y referencias' },
      { id: 'clima', label: 'Clima', icon: CloudSun, description: 'Registros y alertas' }
    ]
  },
  {
    id: 'comunidad',
    label: 'Comunidad',
    items: [
      { id: 'marketing', label: 'Marketing', icon: Megaphone, description: 'Clientes y campañas' },
      { id: 'suscripcion', label: 'Perfiles de café', icon: Coffee, description: 'Sabores y recomendaciones' },
      { id: 'educacion', label: 'Educación', icon: GraduationCap, description: 'Rutas, lecciones y evaluaciones prácticas' },
      { id: 'ayuda', label: 'Ayuda', icon: CircleHelp, description: 'Manual y preguntas frecuentes' },
      { id: 'configuracion', label: 'Configuración', icon: Settings, description: 'Datos, usuarios y seguridad' }
    ]
  }
]

export const navigationItems = navigationGroups.flatMap(group =>
  group.items.map(item => ({ ...item, groupId: group.id, groupLabel: group.label }))
)

export const getNavigationItem = id => navigationItems.find(item => item.id === id) || navigationItems[0]
