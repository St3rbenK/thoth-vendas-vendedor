import React from 'react'
import {
  Package,
  ClipboardList,
  Target,
  MoreHorizontal,
  Building2,
  LogOut,
  ChevronRight,
  ShoppingCart,
} from 'lucide-react'
import { AppLogo } from './AppLogo'
import type { EmpresaVinculo, UsuarioVendedor } from '../types'

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
    { id: 'mais' as TabType, label: 'Clientes & Conta', icon: MoreHorizontal },
  ]

  const cartTotalFmt = cartTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  return (
    <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 md:left-0 bg-slate-900 text-white z-30 shadow-xl border-r border-slate-800">
      {/* Topo / Logo Padrão Vue Dashboard */}
      <div className="p-5 border-b border-slate-800/80">
        <AppLogo
          product="vendas"
          size="md"
          showText={true}
          showSublabel={true}
          sublabel={storeName || 'Força de Vendas'}
          variant="dark"
        />

        {/* Empresa Ativa / Seletor */}
        {empresasCount > 1 && (
          <button
            type="button"
            onClick={onSwitchEmpresa}
            className="mt-3 w-full flex items-center justify-between gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800/70 hover:bg-slate-800 border border-slate-700/60 text-xs text-slate-300 transition-colors"
          >
            <div className="flex items-center gap-1.5 truncate">
              <Building2 className="h-3.5 w-3.5 text-teal-400 shrink-0" />
              <span className="truncate">
                {empresaAtiva?.nome_fantasia || empresaAtiva?.razao_social || 'Trocar Empresa'}
              </span>
            </div>
            <span className="text-[10px] text-teal-400 font-bold shrink-0">Trocar</span>
          </button>
        )}
      </div>

      {/* Perfil Compacto do Vendedor */}
      <div className="px-5 py-4 border-b border-slate-800/60 bg-slate-850/40">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal-500/20 border border-teal-500/30 text-teal-300 font-bold text-sm">
            {currentUser?.nome ? currentUser.nome.charAt(0).toUpperCase() : 'V'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-white truncate">{currentUser?.nome || 'Vendedor'}</p>
            <p className="text-[10px] text-slate-400 truncate">{currentUser?.email || ''}</p>
            {currentUser?.cpf && (
              <p className="text-[10px] text-teal-400 font-mono mt-0.5">CPF: {currentUser.cpf}</p>
            )}
          </div>
        </div>
      </div>

      {/* Menu Principal */}
      <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              type="button"
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl font-bold text-sm transition-all ${
                isActive
                  ? 'bg-teal-600 text-white shadow-md shadow-teal-600/30'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`h-5 w-5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </div>
              {tab.badge !== undefined && (
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-black ${
                    tab.badgeAmber
                      ? 'bg-amber-400 text-slate-950'
                      : isActive
                      ? 'bg-white text-teal-700'
                      : 'bg-teal-500 text-white'
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
        <div className="p-3 mx-3 mb-3 rounded-2xl bg-gradient-to-br from-teal-900/60 to-slate-800/90 border border-teal-500/30 text-white">
          <div className="flex items-center justify-between text-xs text-teal-300 mb-1">
            <span className="flex items-center gap-1.5 font-bold">
              <ShoppingCart className="h-3.5 w-3.5" /> Pedido Atual
            </span>
            <span className="bg-teal-500/20 px-2 py-0.5 rounded-full font-bold text-[10px] text-teal-200">
              {cartCount} un.
            </span>
          </div>
          <div className="text-lg font-black text-white">{cartTotalFmt}</div>
          <button
            type="button"
            onClick={onOpenCart}
            className="mt-2.5 w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-black text-xs transition-colors shadow-md"
          >
            <span>Abrir Carrinho</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Rodapé / Sair */}
      <div className="p-3 border-t border-slate-800/80">
        <button
          type="button"
          onClick={onLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-rose-300 hover:bg-rose-950/40 hover:text-rose-200 transition-colors"
        >
          <LogOut className="h-4 w-4 text-rose-400" />
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
    { id: 'mais' as TabType, label: 'Clientes/Mais', icon: MoreHorizontal },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 md:hidden bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-2xl px-2 pt-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))]">
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
                  ? 'text-teal-700 font-bold bg-teal-50/80'
                  : 'text-slate-500 hover:text-slate-800 font-medium'
              }`}
            >
              <div className="relative">
                <Icon
                  className={`h-5 w-5 ${
                    isActive ? 'stroke-[2.5px]' : 'stroke-[1.8px]'
                  } transition-transform`}
                />
                {tab.badge !== undefined && (
                  <span
                    className={`absolute -top-1.5 -right-3 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-black shadow-2xs ${
                      tab.badgeAmber ? 'bg-amber-400 text-slate-950' : 'bg-teal-600 text-white'
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
