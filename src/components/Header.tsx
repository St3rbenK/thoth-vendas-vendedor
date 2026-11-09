import React, { useRef, useState, useEffect } from 'react'
import {
  ShoppingCart,
  Search,
  X,
  WifiOff,
  Store,
  Building2,
  User,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  Tag,
  FileText,
  LayoutGrid,
  List,
  Layers,
} from 'lucide-react'
import type { Categoria, Cliente, TabelaPreco } from '../types'

interface HeaderProps {
  storeName: string
  vendedorNome?: string
  empresasCount?: number
  onSwitchEmpresa?: () => void
  onLogout?: () => void
  search: string
  setSearch: (v: string) => void
  categories: Categoria[]
  selectedCategory: string | null
  setSelectedCategory: (id: string | null) => void
  cartCount: number
  cartTotal: number
  onOpenCart: () => void
  isOffline: boolean
  selectedCliente?: Cliente | null
  onOpenClienteSelect?: () => void
  tabelas?: TabelaPreco[]
  selectedTabelaId?: string
  onSelectTabela?: (id: string) => void
  onlyInStock?: boolean
  onToggleInStock?: () => void
  viewMode?: 'grid' | 'list'
  onChangeViewMode?: (mode: 'grid' | 'list') => void
  orcamentosCount?: number
  onOpenOrcamentos?: () => void
}

export const Header: React.FC<HeaderProps> = ({
  storeName,
  vendedorNome,
  empresasCount = 1,
  onSwitchEmpresa,
  search,
  setSearch,
  categories,
  selectedCategory,
  setSelectedCategory,
  cartCount,
  cartTotal,
  onOpenCart,
  isOffline,
  selectedCliente,
  onOpenClienteSelect,
  tabelas = [],
  selectedTabelaId = '',
  onSelectTabela,
  onlyInStock = false,
  onToggleInStock,
  viewMode = 'grid',
  onChangeViewMode,
  orcamentosCount = 0,
  onOpenOrcamentos,
}) => {
  const totalFmt = cartTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  const catScrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)
  const [expandCategories, setExpandCategories] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStartX, setDragStartX] = useState(0)
  const [dragScrollLeft, setDragScrollLeft] = useState(0)

  const checkScroll = () => {
    const el = catScrollRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 8)
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 8)
  }

  useEffect(() => {
    checkScroll()
    window.addEventListener('resize', checkScroll)
    return () => window.removeEventListener('resize', checkScroll)
  }, [categories, expandCategories])

  const scrollCategories = (dir: 'left' | 'right') => {
    const el = catScrollRef.current
    if (!el) return
    const amount = Math.max(240, el.clientWidth * 0.65)
    el.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' })
    setTimeout(checkScroll, 320)
  }

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    const el = catScrollRef.current
    if (!el || expandCategories) return
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      el.scrollLeft += e.deltaY
      checkScroll()
    }
  }

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = catScrollRef.current
    if (!el || expandCategories) return
    setIsDragging(true)
    setDragStartX(e.pageX - el.offsetLeft)
    setDragScrollLeft(el.scrollLeft)
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !catScrollRef.current) return
    e.preventDefault()
    const x = e.pageX - catScrollRef.current.offsetLeft
    const walk = (x - dragStartX) * 1.5
    catScrollRef.current.scrollLeft = dragScrollLeft - walk
    checkScroll()
  }

  const stopDragging = () => setIsDragging(false)

  return (
    <header className="sticky top-0 z-30 w-full max-w-full overflow-hidden bg-[#0F3C46] text-white shadow-md">
      {/* Linha Principal */}
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-3 py-2.5 sm:px-6 sm:py-3">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl bg-teal-500 text-white shadow-sm">
            <Store className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <h1 className="truncate text-sm font-black leading-tight sm:text-base">
                {storeName || 'Thoth Vendas'}
              </h1>
              {empresasCount > 1 && onSwitchEmpresa && (
                <button
                  type="button"
                  onClick={onSwitchEmpresa}
                  className="hidden sm:inline-flex items-center gap-1 rounded-md bg-teal-400/20 px-1.5 py-0.5 text-[10px] font-bold text-teal-200 hover:bg-teal-400/30 transition-all border border-teal-300/30 shrink-0"
                  title="Trocar de empresa"
                >
                  <Building2 className="h-3 w-3" />
                  <span>Trocar</span>
                </button>
              )}
            </div>
            <p className="truncate text-[11px] text-teal-200/90 flex items-center gap-1">
              <User className="h-3 w-3 shrink-0 text-teal-300" />
              <span className="truncate">{vendedorNome || 'Representante Comercial'}</span>
            </p>
          </div>
        </div>

        {/* Ações da direita: Orçamentos Salvos + Botão Pedido */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {onOpenOrcamentos && orcamentosCount > 0 && (
            <button
              type="button"
              onClick={onOpenOrcamentos}
              className="relative flex items-center gap-1.5 rounded-xl bg-amber-400/20 border border-amber-300/40 px-2.5 py-2 text-xs font-bold text-amber-200 hover:bg-amber-400/30 transition-all active:scale-95"
              title="Ver Orçamentos Salvos"
            >
              <FileText className="h-4 w-4 text-amber-300 shrink-0" />
              <span className="hidden sm:inline">Orçamentos</span>
              <span className="rounded-full bg-amber-400 px-1.5 py-0.2 text-[10px] font-black text-slate-950">
                {orcamentosCount}
              </span>
            </button>
          )}

          <button
            type="button"
            onClick={onOpenCart}
            className="relative flex items-center gap-1.5 rounded-xl bg-teal-500 px-3 py-2 sm:px-3.5 sm:py-2.5 text-xs sm:text-sm font-bold text-white shadow-sm transition-all active:scale-95 hover:bg-teal-400"
            aria-label="Abrir Pedido"
          >
            <ShoppingCart className="h-4 w-4 shrink-0" />
            <span className="font-extrabold">{cartCount > 0 ? totalFmt : 'Pedido'}</span>
            {cartCount > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-400 px-1.5 text-[11px] font-black text-slate-900 shadow">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Barra Comercial Estilo Mercos: Cliente Ativo + Tabela de Preço */}
      <div className="border-t border-white/10 bg-[#0A3039] px-3 py-2 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2">
          {/* Seletor Rápido de Cliente */}
          {onOpenClienteSelect && (
            <button
              type="button"
              onClick={onOpenClienteSelect}
              className={`flex min-w-0 flex-1 sm:flex-initial items-center gap-2 rounded-xl px-3 py-1.5 text-left text-xs transition-all border ${
                selectedCliente
                  ? 'bg-teal-500/20 border-teal-400/40 text-white'
                  : 'bg-white/10 border-dashed border-white/25 text-teal-100 hover:bg-white/15'
              }`}
            >
              <UserCheck className={`h-4 w-4 shrink-0 ${selectedCliente ? 'text-amber-300' : 'text-teal-300'}`} />
              <div className="min-w-0 flex-1">
                {selectedCliente ? (
                  <div className="flex items-center gap-1.5">
                    <span className="truncate font-bold text-white max-w-[180px] sm:max-w-[280px]">
                      {selectedCliente.nome_fantasia || selectedCliente.razao_social}
                    </span>
                    <span className="text-[10px] text-teal-200 underline shrink-0">Trocar</span>
                  </div>
                ) : (
                  <span className="font-semibold text-teal-100">
                    + Selecionar cliente para o pedido / orçamento
                  </span>
                )}
              </div>
            </button>
          )}

          {/* Controles Direitos: Tabela de Preço + Estoque + Modo de Exibição */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto justify-between sm:justify-end">
            {tabelas.length > 0 && onSelectTabela && (
              <div className="flex items-center gap-1 rounded-xl bg-white/10 border border-white/15 px-2.5 py-1 text-xs min-w-0 flex-1 sm:flex-initial">
                <Tag className="h-3.5 w-3.5 text-teal-300 shrink-0" />
                <select
                  value={selectedTabelaId}
                  onChange={(e) => onSelectTabela(e.target.value)}
                  className="bg-transparent text-white font-bold text-xs outline-none truncate w-full sm:w-auto cursor-pointer [&>option]:text-slate-900"
                  aria-label="Tabela de Preço"
                >
                  {tabelas.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.nome}
                      {t.percentual_ajuste > 0
                        ? ` (${t.tipo_ajuste === 'desconto_pct' ? '-' : '+'}${t.percentual_ajuste}%)`
                        : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex items-center gap-1 shrink-0">
              {onToggleInStock && (
                <button
                  type="button"
                  onClick={onToggleInStock}
                  className={`rounded-xl px-2.5 py-1.5 text-[11px] font-bold transition-all border ${
                    onlyInStock
                      ? 'bg-emerald-500 text-white border-emerald-400 shadow-xs'
                      : 'bg-white/10 text-teal-100 border-white/15 hover:bg-white/15'
                  }`}
                >
                  Com estoque
                </button>
              )}

              {onChangeViewMode && (
                <div className="flex items-center rounded-xl bg-white/10 p-0.5 border border-white/15">
                  <button
                    type="button"
                    onClick={() => onChangeViewMode('grid')}
                    className={`p-1.5 rounded-lg transition-colors ${
                      viewMode === 'grid' ? 'bg-teal-500 text-white' : 'text-teal-200 hover:text-white'
                    }`}
                    title="Visualização em Grade"
                  >
                    <LayoutGrid className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onChangeViewMode('list')}
                    className={`p-1.5 rounded-lg transition-colors ${
                      viewMode === 'list' ? 'bg-teal-500 text-white' : 'text-teal-200 hover:text-white'
                    }`}
                    title="Lista Rápida (Estilo Mercos)"
                  >
                    <List className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Busca & Categorias */}
      <div className="border-t border-white/10 bg-[#082A33]/95 px-3 py-2.5 sm:px-6">
        <div className="mx-auto max-w-6xl space-y-2">
          {/* Campo de Busca */}
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-teal-200/70" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome do produto, código (#) ou código de barras…"
              className="w-full rounded-xl border border-white/15 bg-white/10 py-2 pl-10 pr-9 text-sm text-white placeholder:text-teal-200/60 focus:bg-white/15 focus:outline-none focus:ring-2 focus:ring-teal-400 transition-all"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full bg-white/15 p-1 text-teal-200 hover:text-white"
                aria-label="Limpar busca"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Barra de Categorias com Setas de Rolagem para Computador + Botão Expandir */}
          {categories.length > 0 && (
            <div className="relative flex items-center gap-1.5">
              {/* Seta Esquerda (Desktop / quando rolado) */}
              {!expandCategories && canScrollLeft && (
                <button
                  type="button"
                  onClick={() => scrollCategories('left')}
                  className="hidden sm:flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-teal-500 text-white shadow-md hover:bg-teal-400 transition-all active:scale-95 z-10"
                  aria-label="Categorias anteriores"
                  title="Rolar categorias para a esquerda"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
              )}

              {/* Lista de Pílulas de Categoria */}
              <div
                ref={catScrollRef}
                onScroll={checkScroll}
                onWheel={handleWheel}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={stopDragging}
                onMouseLeave={stopDragging}
                className={`flex-1 min-w-0 flex gap-1.5 ${
                  expandCategories
                    ? 'flex-wrap pb-1'
                    : 'overflow-x-auto no-scrollbar pb-0.5 scroll-smooth select-none cursor-grab active:cursor-grabbing'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setSelectedCategory(null)}
                  className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1 text-xs font-bold transition-all ${
                    selectedCategory === null
                      ? 'bg-amber-400 text-slate-900 shadow-xs'
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  Todos
                </button>
                {categories.map((c) => (
                  <button
                    type="button"
                    key={c.id}
                    onClick={() => setSelectedCategory(selectedCategory === c.id ? null : c.id)}
                    className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1 text-xs font-bold transition-all ${
                      selectedCategory === c.id
                        ? 'bg-amber-400 text-slate-900 shadow-xs'
                        : 'bg-white/10 text-white hover:bg-white/20'
                    }`}
                  >
                    {c.nome}
                  </button>
                ))}
              </div>

              {/* Seta Direita (Desktop / quando houver mais categorias) */}
              {!expandCategories && canScrollRight && (
                <button
                  type="button"
                  onClick={() => scrollCategories('right')}
                  className="hidden sm:flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-teal-500 text-white shadow-md hover:bg-teal-400 transition-all active:scale-95 z-10"
                  aria-label="Próximas categorias"
                  title="Rolar categorias para a direita"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              )}

              {/* Botão Ver Todas / Recolher Categorias */}
              {categories.length > 4 && (
                <button
                  type="button"
                  onClick={() => setExpandCategories((prev) => !prev)}
                  className="flex shrink-0 items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-bold text-teal-200 hover:bg-white/25 hover:text-white transition-colors"
                  title={expandCategories ? 'Mostrar em linha única' : 'Expandir todas as categorias'}
                >
                  <Layers className="h-3 w-3" />
                  <span className="hidden sm:inline">{expandCategories ? 'Recolher' : 'Ver todas'}</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Aviso de Offline */}
      {isOffline && (
        <div className="flex items-center justify-center gap-1.5 bg-amber-400 px-3 py-1 text-center text-[11px] font-bold text-slate-900">
          <WifiOff className="h-3.5 w-3.5 shrink-0" />
          <span>Modo Offline — Catálogo e Orçamentos salvos localmente.</span>
        </div>
      )}
    </header>
  )
}
