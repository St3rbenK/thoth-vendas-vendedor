import React, { useRef, useState, useEffect } from 'react'
import {
  ShoppingCart,
  Search,
  X,
  WifiOff,
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
  Sun,
  Moon,
  RefreshCw,
} from 'lucide-react'
import { AppLogo } from './AppLogo'
import type { Categoria, Cliente, TabelaPreco } from '../types'
import type { ThemeMode } from '../hooks/useTheme'

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
  pendingOfflineCount?: number
  syncingOffline?: boolean
  onSyncOffline?: () => void
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
  theme?: ThemeMode
  onToggleTheme?: () => void
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
  pendingOfflineCount = 0,
  syncingOffline = false,
  onSyncOffline,
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
  theme = 'light',
  onToggleTheme,
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
    <header className="sticky top-0 z-20 w-full max-w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800">
      {/* Linha Principal (Top Header) */}
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-3 py-2.5 sm:px-6 sm:h-16">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="md:hidden shrink-0">
            <AppLogo product="vendas" size="sm" showText={false} variant="light" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="md:hidden font-display font-extrabold tracking-tight text-sm text-slate-900 dark:text-white shrink-0">
                thoth<span className="text-[#00A19C]">vendas</span>
              </span>
              {storeName && (
                <>
                  <span className="md:hidden text-slate-300 dark:text-slate-600 text-xs">•</span>
                  <h1 className="truncate font-display text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 leading-tight">
                    {storeName}
                  </h1>
                </>
              )}
              {empresasCount > 1 && onSwitchEmpresa && (
                <button
                  type="button"
                  onClick={onSwitchEmpresa}
                  className="inline-flex items-center gap-1 rounded-md bg-[#00A19C]/10 px-1.5 py-0.5 text-[10px] font-semibold text-[#00A19C] hover:bg-[#00A19C]/20 transition-all border border-[#00A19C]/20 shrink-0"
                  title="Trocar de empresa"
                >
                  <Building2 className="h-3 w-3" />
                  <span className="hidden sm:inline">Trocar</span>
                </button>
              )}
            </div>
            <p className="truncate text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <User className="h-3 w-3 shrink-0 text-[#00A19C]" />
              <span className="truncate">{vendedorNome || 'Representante Comercial'}</span>
            </p>
          </div>
        </div>

        {/* Ações da direita: Tema (mobile) + Orçamentos + Carrinho */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {onToggleTheme && (
            <button
              type="button"
              onClick={onToggleTheme}
              className="md:hidden flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200/80 dark:border-slate-700 bg-[#F8FAFC] dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              aria-label={theme === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro'}
            >
              {theme === 'dark' ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4" />}
            </button>
          )}

          {onOpenOrcamentos && orcamentosCount > 0 && (
            <button
              type="button"
              onClick={onOpenOrcamentos}
              className="relative flex items-center gap-1.5 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-2.5 py-2 text-xs font-semibold text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-500/20 transition-all active:scale-95"
              title="Ver Orçamentos Salvos"
            >
              <FileText className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline">Orçamentos</span>
              <span className="rounded-full bg-amber-400 px-1.5 py-0.2 font-mono tabular-nums text-[10px] font-bold text-slate-950">
                {orcamentosCount}
              </span>
            </button>
          )}

          <button
            type="button"
            onClick={onOpenCart}
            className="relative flex items-center gap-1.5 rounded-xl bg-[#00A19C] px-3 py-2 sm:px-3.5 text-xs sm:text-sm font-semibold text-white shadow-xs transition-all active:scale-95 hover:bg-[#008C87]"
            aria-label="Abrir Pedido"
          >
            <ShoppingCart className="h-4 w-4 shrink-0" />
            <span className="font-mono tabular-nums font-bold">
              {cartCount > 0 ? totalFmt : 'Pedido'}
            </span>
            {cartCount > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1.5 font-mono tabular-nums text-[11px] font-bold text-[#0F766E] shadow-2xs">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Barra Comercial: Cliente Ativo + Tabela de Preço + Estoque + ViewMode */}
      <div className="border-t border-slate-200/80 dark:border-slate-800 bg-[#F8FAFC]/80 dark:bg-slate-800/40 px-3 py-2 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2">
          {/* Seletor Rápido de Cliente */}
          {onOpenClienteSelect && (
            <button
              type="button"
              onClick={onOpenClienteSelect}
              className={`flex min-w-0 flex-1 sm:flex-initial items-center gap-2 rounded-xl px-3 py-1.5 text-left text-xs transition-all border ${
                selectedCliente
                  ? 'bg-teal-50/80 dark:bg-[#00A19C]/10 border-[#00A19C]/40 text-slate-900 dark:text-white'
                  : 'bg-white dark:bg-slate-900 border-dashed border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-[#00A19C]'
              }`}
            >
              <UserCheck className={`h-4 w-4 shrink-0 ${selectedCliente ? 'text-[#00A19C]' : 'text-slate-400'}`} />
              <div className="min-w-0 flex-1">
                {selectedCliente ? (
                  <div className="flex items-center gap-1.5">
                    <span className="truncate font-semibold text-slate-900 dark:text-white max-w-[180px] sm:max-w-[280px]">
                      {selectedCliente.nome_fantasia || selectedCliente.razao_social}
                    </span>
                    <span className="text-[10px] font-semibold text-[#00A19C] underline shrink-0">
                      Trocar
                    </span>
                  </div>
                ) : (
                  <span className="font-medium text-slate-600 dark:text-slate-300">
                    + Selecionar cliente para o pedido
                  </span>
                )}
              </div>
            </button>
          )}

          {/* Controles Direitos */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto justify-between sm:justify-end">
            {tabelas.length > 0 && onSelectTabela && (
              <div className="flex items-center gap-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 px-2.5 py-1 text-xs min-w-0 flex-1 sm:flex-initial">
                <Tag className="h-3.5 w-3.5 text-[#00A19C] shrink-0" />
                <select
                  value={selectedTabelaId}
                  onChange={(e) => onSelectTabela(e.target.value)}
                  className="bg-transparent text-slate-800 dark:text-slate-100 font-semibold text-xs outline-none truncate w-full sm:w-auto cursor-pointer [&>option]:text-slate-900"
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

            <div className="flex items-center gap-1.5 shrink-0">
              {onToggleInStock && (
                <button
                  type="button"
                  onClick={onToggleInStock}
                  className={`rounded-xl px-2.5 py-1.5 text-[11px] font-semibold transition-all border ${
                    onlyInStock
                      ? 'bg-[#00A19C] text-white border-[#00A19C] shadow-2xs'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200/80 dark:border-slate-700 hover:border-[#00A19C]/50'
                  }`}
                >
                  Com estoque
                </button>
              )}

              {onChangeViewMode && (
                <div className="flex items-center rounded-xl bg-white dark:bg-slate-900 p-0.5 border border-slate-200/80 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => onChangeViewMode('grid')}
                    className={`p-1.5 rounded-lg transition-colors ${
                      viewMode === 'grid'
                        ? 'bg-[#00A19C] text-white'
                        : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                    }`}
                    title="Visualização em Grade"
                  >
                    <LayoutGrid className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onChangeViewMode('list')}
                    className={`p-1.5 rounded-lg transition-colors ${
                      viewMode === 'list'
                        ? 'bg-[#00A19C] text-white'
                        : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                    }`}
                    title="Visualização em Lista"
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
      <div className="border-t border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2.5 sm:px-6">
        <div className="mx-auto max-w-6xl space-y-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome do produto, código (#) ou código de barras…"
              className="w-full rounded-xl border border-slate-200/80 dark:border-slate-800 bg-[#F8FAFC] dark:bg-slate-800/60 py-2 pl-10 pr-9 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-[#00A19C] transition-all"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full bg-slate-200/70 dark:bg-slate-700 p-1 text-slate-500 dark:text-slate-300 hover:text-slate-800"
                aria-label="Limpar busca"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {categories.length > 0 && (
            <div className="relative flex items-center gap-1.5">
              {!expandCategories && canScrollLeft && (
                <button
                  type="button"
                  onClick={() => scrollCategories('left')}
                  className="hidden sm:flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#00A19C] text-white shadow-xs hover:bg-[#008C87] transition-all active:scale-95 z-10"
                  aria-label="Categorias anteriores"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
              )}

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
                  className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold transition-all border ${
                    selectedCategory === null
                      ? 'bg-[#00A19C] text-white border-[#00A19C] shadow-2xs'
                      : 'bg-[#F8FAFC] dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200/80 dark:border-slate-700 hover:border-[#00A19C]/40'
                  }`}
                >
                  Todos
                </button>
                {categories.map((c) => (
                  <button
                    type="button"
                    key={c.id}
                    onClick={() => setSelectedCategory(selectedCategory === c.id ? null : c.id)}
                    className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold transition-all border ${
                      selectedCategory === c.id
                        ? 'bg-[#00A19C] text-white border-[#00A19C] shadow-2xs'
                        : 'bg-[#F8FAFC] dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200/80 dark:border-slate-700 hover:border-[#00A19C]/40'
                    }`}
                  >
                    {c.nome}
                  </button>
                ))}
              </div>

              {!expandCategories && canScrollRight && (
                <button
                  type="button"
                  onClick={() => scrollCategories('right')}
                  className="hidden sm:flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#00A19C] text-white shadow-xs hover:bg-[#008C87] transition-all active:scale-95 z-10"
                  aria-label="Próximas categorias"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              )}

              {categories.length > 4 && (
                <button
                  type="button"
                  onClick={() => setExpandCategories((prev) => !prev)}
                  className="flex shrink-0 items-center gap-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 px-2.5 py-1 text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:border-[#00A19C]/50 transition-colors"
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
        <div className="flex items-center justify-center gap-1.5 bg-amber-50 dark:bg-amber-500/15 border-t border-amber-200 dark:border-amber-500/20 px-3 py-1.5 text-center text-[11px] font-semibold text-amber-800 dark:text-amber-300">
          <WifiOff className="h-3.5 w-3.5 shrink-0" />
          <span>Modo Offline — Catálogo, Orçamentos e Pedidos salvos localmente.</span>
        </div>
      )}

      {/* Aviso de Fila Pendente quando Online */}
      {!isOffline && pendingOfflineCount > 0 && (
        <div className="flex items-center justify-center gap-2 bg-teal-50 dark:bg-[#00A19C]/15 border-t border-teal-200 dark:border-[#00A19C]/30 px-3 py-1.5 text-[11px] font-semibold text-teal-800 dark:text-teal-300">
          <span className="font-mono tabular-nums">
            {pendingOfflineCount} pedido(s) offline aguardando transmissão.
          </span>
          {onSyncOffline && (
            <button
              type="button"
              disabled={syncingOffline}
              onClick={onSyncOffline}
              className="inline-flex items-center gap-1 rounded-lg bg-[#00A19C] px-2.5 py-0.5 text-[10px] font-bold text-white hover:bg-[#008C87] disabled:opacity-60"
            >
              <RefreshCw className={`h-3 w-3 ${syncingOffline ? 'animate-spin' : ''}`} />
              <span>{syncingOffline ? 'Sincronizando…' : 'Enviar Agora'}</span>
            </button>
          )}
        </div>
      )}
    </header>
  )
}
