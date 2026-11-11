import React from 'react'
import {
  Package,
  ClipboardList,
  Target,
  Settings,
  Building2,
  LogOut,
  ChevronRight,
  ShoppingCart,
  Sun,
  Moon,
} from 'lucide-react'
import { AppLogo } from './AppLogo'
import type { EmpresaVinculo, UsuarioVendedor } from '../types'
import type { ThemeMode } from '../hooks/useTheme'

export type TabType = 'produtos' | 'pedidos' | 'meta' | 'mais'

interface NavigationProps {
  activeTab: TabType
  onSelectTab: (tab: TabType) => void
  storeName: string
  currentUser: UsuarioVendedor | null
  empresaAtiva: EmpresaVinculo | null
  empresasCount: number
  cartCount: number
  cartTotal: number
  orcamentosCount?: number
  onOpenCart: () => void
  onSwitchEmpresa: () => void
  onLogout: () => void
  theme: ThemeMode
  onToggleTheme: () => void
}

export function DesktopSidebar({
  activeTab,
  onSelectTab,
  storeName,
  currentUser,
  empresaAtiva,
  empresasCount,
  cartCount,
  cartTotal,
  orcamentosCount = 0,
  onOpenCart,
  onSwitchEmpresa,
  onLogout,
  theme,
  onToggleTheme,
}: NavigationProps) {
  const tabs = [
    { id: 'produtos' as TabType, label: 'Catálogo', icon: Package, badge: cartCount > 0 ? cartCount : undefined },
    {
      id: 'pedidos' as TabType,
      label: 'Pedidos & Orç.',
      icon: ClipboardList,
      badge: orcamentosCount > 0 ? orcamentosCount : undefined,
      badgeAmber: true,
    },
    { id: 'meta' as TabType, label: 'Minha Meta', icon: Target },
    { id: 'mais' as TabType, label: 'Configurações', icon: Settings },
  ]

  const cartTotalFmt = cartTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  return (
    <aside className="hidden md:flex md:w-[260px] md:flex-col md:fixed md:inset-y-0 md:left-0 bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800 z-30">
      {/* Topo / Logo Oficial */}
      <div className="p-5 border-b border-slate-200/80 dark:border-slate-800">
        <AppLogo
          product="vendas"
          size="md"
          showText={true}
          showSublabel={true}
          sublabel={storeName || 'Força de Vendas'}
          variant="light"
        />

        {empresasCount > 1 && (
          <button
            type="button"
            onClick={onSwitchEmpresa}
            className="mt-3 w-full flex items-center justify-between gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#F8FAFC] dark:bg-slate-800/70 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 transition-colors"
          >
            <div className="flex items-center gap-1.5 truncate">
              <Building2 className="h-3.5 w-3.5 text-[#00A19C] shrink-0" />
              <span className="truncate font-medium">
                {empresaAtiva?.nome_fantasia || empresaAtiva?.razao_social || 'Trocar Empresa'}
              </span>
            </div>
            <span className="text-[10px] text-[#00A19C] font-semibold shrink-0">Trocar</span>
          </button>
        )}
      </div>

      {/* Perfil Compacto do Vendedor */}
      <div className="px-5 py-3.5 border-b border-slate-200/80 dark:border-slate-800 bg-[#F8FAFC]/60 dark:bg-slate-800/30">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#00A19C]/10 border border-[#00A19C]/20 text-[#00A19C] font-bold text-sm">
            {currentUser?.nome ? currentUser.nome.charAt(0).toUpperCase() : 'V'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
              {currentUser?.nome || 'Vendedor'}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
              {currentUser?.email || ''}
            </p>
            {currentUser?.cpf && (
              <p className="text-[10px] text-[#00A19C] font-mono tabular-nums mt-0.5">
                CPF: {currentUser.cpf}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Menu Principal */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <p className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          Operação Comercial
        </p>
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              type="button"
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-medium text-sm transition-all ${
                isActive
                  ? 'bg-[#00A19C] text-white shadow-xs shadow-[#00A19C]/25 font-semibold'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </div>
              {tab.badge !== undefined && (
                <span
                  className={`font-mono tabular-nums text-[11px] px-2 py-0.5 rounded-full font-bold ${
                    tab.badgeAmber
                      ? 'bg-amber-100 text-amber-800 border border-amber-200 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30'
                      : isActive
                      ? 'bg-white text-[#0F766E]'
                      : 'bg-[#00A19C]/10 text-[#00A19C]'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          )
        })}
      </nav>

      {/* Card do Carrinho Lateral */}
      {cartCount > 0 && (
        <div className="p-3.5 mx-3 mb-3 rounded-xl bg-[#F8FAFC] dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700">
          <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300 mb-1">
            <span className="flex items-center gap-1.5 font-semibold">
              <ShoppingCart className="h-3.5 w-3.5 text-[#00A19C]" /> Pedido Atual
            </span>
            <span className="bg-[#00A19C]/10 text-[#00A19C] px-2 py-0.5 rounded-full font-mono tabular-nums font-bold text-[10px]">
              {cartCount} un.
            </span>
          </div>
          <div className="font-display font-mono tabular-nums text-lg font-bold text-slate-900 dark:text-white">
            {cartTotalFmt}
          </div>
          <button
            type="button"
            onClick={onOpenCart}
            className="mt-2.5 w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-[#00A19C] hover:bg-[#008C87] text-white font-semibold text-xs transition-colors shadow-xs"
          >
            <span>Abrir Carrinho</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Rodapé / Tema + Sair */}
      <div className="p-3 border-t border-slate-200/80 dark:border-slate-800 space-y-1">
        <button
          type="button"
          onClick={onToggleTheme}
          className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <span className="flex items-center gap-2.5">
            {theme === 'dark' ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-slate-400" />}
            <span>{theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}</span>
          </span>
          <span className="text-[10px] uppercase tracking-wider text-slate-400">
            {theme === 'dark' ? 'Dark' : 'Light'}
          </span>
        </button>

        <button
          type="button"
          onClick={onLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          <span>Sair da Conta</span>
        </button>
      </div>
    </aside>
  )
}

export function MobileBottomNav({
  activeTab,
  onSelectTab,
  cartCount,
  orcamentosCount = 0,
}: {
  activeTab: TabType
  onSelectTab: (tab: TabType) => void
  cartCount: number
  orcamentosCount?: number
}) {
  const tabs = [
    { id: 'produtos' as TabType, label: 'Catálogo', icon: Package, badge: cartCount > 0 ? cartCount : undefined },
    {
      id: 'pedidos' as TabType,
      label: 'Pedidos',
      icon: ClipboardList,
      badge: orcamentosCount > 0 ? orcamentosCount : undefined,
      badgeAmber: true,
    },
    { id: 'meta' as TabType, label: 'Meta', icon: Target },
    { id: 'mais' as TabType, label: 'Ajustes', icon: Settings },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 md:hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/80 dark:border-slate-800 shadow-lg px-2 pt-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))]">
      <div className="grid grid-cols-4 gap-1 max-w-md mx-auto h-12">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              type="button"
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`relative flex flex-col items-center justify-center rounded-xl transition-all ${
                isActive
                  ? 'text-[#00A19C] font-semibold bg-[#00A19C]/10 dark:bg-[#00A19C]/15'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-medium'
              }`}
            >
              <div className="relative">
                <Icon
                  className={`h-5 w-5 ${isActive ? 'stroke-[2.25px]' : 'stroke-[1.75px]'} transition-transform`}
                />
                {tab.badge !== undefined && (
                  <span
                    className={`absolute -top-1.5 -right-3 flex h-4 min-w-4 items-center justify-center rounded-full px-1 font-mono tabular-nums text-[9px] font-bold shadow-2xs ${
                      tab.badgeAmber
                        ? 'bg-amber-400 text-slate-950'
                        : 'bg-[#00A19C] text-white'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight truncate max-w-full px-1">
                {tab.label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
