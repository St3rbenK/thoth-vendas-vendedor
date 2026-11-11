import React, { useState, useEffect, useCallback } from 'react'
import {
  Target,
  TrendingUp,
  DollarSign,
  Calendar,
  Users,
  ShoppingBag,
  Sparkles,
  Loader2,
  RefreshCw,
} from 'lucide-react'
import { getVendedorMeta } from '../services/api'
import { AppLogo } from './AppLogo'
import type { VendedorMeta } from '../types'

export function MetaView({ vendedorNome }: { vendedorNome?: string }) {
  const [meta, setMeta] = useState<VendedorMeta | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getVendedorMeta()
      setMeta(data)
    } catch (err) {
      console.error('Erro ao carregar meta:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const metaMensal = meta?.meta_mensal || 0
  const totalVendido = meta?.total_vendido || 0
  const pct = meta?.percentual_atingido || 0
  const falta = meta?.falta_para_meta || 0
  const comissaoEst = meta?.comissao_estimada || 0
  const comissaoPct = meta?.comissao_pct || 0
  const totalPedidos = meta?.total_pedidos || 0
  const totalClientes = meta?.total_clientes_atendidos || 0
  const ticketMedio = meta?.ticket_medio || 0

  const fmtBRL = (val: number) =>
    val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  const isMetaBatida = pct >= 100 && metaMensal > 0

  return (
    <div className="w-full">
      {/* Top Bar Mobile */}
      <header className="sticky top-0 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 md:hidden">
        <div className="flex items-center justify-between gap-2 px-4 py-3">
          <AppLogo product="vendas" size="sm" showText={true} variant="light" />
          <span className="rounded-full bg-[#00A19C]/10 border border-[#00A19C]/20 px-2.5 py-1 text-[11px] font-semibold text-[#00A19C]">
            Minha Meta
          </span>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-3 py-4 sm:px-6 sm:py-6 space-y-6">
        {/* Cabeçalho */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-1.5 text-[#00A19C] font-semibold text-xs uppercase tracking-wider">
              <Sparkles className="h-3.5 w-3.5" /> Desempenho Comercial do Mês
            </div>
            <h2 className="font-display text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight mt-0.5">
              Minha Meta & Comissões
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Olá, <span className="font-semibold text-slate-800 dark:text-slate-200">{vendedorNome || 'Representante'}</span>! Acompanhe suas vendas e projeção de comissão.
            </p>
          </div>
          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:border-[#00A19C]/50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-[#00A19C] ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Atualizar</span>
          </button>
        </div>

        {loading && !meta ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400">
            <Loader2 className="h-8 w-8 animate-spin text-[#00A19C] mb-2" />
            <p className="text-xs">Carregando métricas de desempenho…</p>
          </div>
        ) : (
          <>
            {/* Card Principal: Progresso da Meta */}
            <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-gradient-to-br from-[#00A19C] to-[#0F766E] p-6 sm:p-7 text-white shadow-sm relative overflow-hidden">
              <div className="absolute right-0 top-0 -mt-10 -mr-10 h-60 w-60 rounded-full bg-white/10 blur-3xl pointer-events-none" />

              <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-5">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white border border-white/20">
                    <Target className="h-3.5 w-3.5" />
                    <span>{isMetaBatida ? 'Meta Mensal Atingida' : 'Meta Mensal em Andamento'}</span>
                  </div>
                  <div>
                    <div className="text-xs text-teal-100 font-medium">Total Vendido no Mês</div>
                    <div className="font-display font-mono tabular-nums text-3xl sm:text-4xl font-bold tracking-tight text-white">
                      {fmtBRL(totalVendido)}
                    </div>
                  </div>
                  {metaMensal > 0 ? (
                    <p className="text-xs text-teal-50 font-mono tabular-nums">
                      Meta: <span className="font-bold text-white">{fmtBRL(metaMensal)}</span>
                      {falta > 0 ? (
                        <span className="text-amber-200 ml-2">(Faltam {fmtBRL(falta)})</span>
                      ) : (
                        <span className="text-emerald-200 ml-2 font-bold">
                          (+{fmtBRL(totalVendido - metaMensal)} acima da meta)
                        </span>
                      )}
                    </p>
                  ) : (
                    <p className="text-xs text-teal-100">Meta mensal ainda não configurada pelo gestor.</p>
                  )}
                </div>

                <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-white/15 backdrop-blur-xs border border-white/20 shrink-0 min-w-36">
                  <span className="font-display font-mono tabular-nums text-3xl sm:text-4xl font-bold text-white">
                    {pct.toFixed(1)}%
                  </span>
                  <span className="text-[11px] uppercase font-semibold tracking-wider text-teal-100 mt-0.5">
                    Atingido
                  </span>
                </div>
              </div>

              <div className="relative z-10 mt-5">
                <div className="h-2.5 w-full rounded-full bg-black/20 overflow-hidden p-0.5">
                  <div
                    className="h-full rounded-full bg-white transition-all duration-700"
                    style={{ width: `${Math.min(pct, 100)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Grid de KPI Cards (Padrão Stripe + Polaris) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Comissão Est.
                  </span>
                  <div className="w-9 h-9 rounded-lg bg-[#00A19C]/10 text-[#00A19C] flex items-center justify-center shrink-0">
                    <DollarSign className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-2 font-display font-mono tabular-nums text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  {fmtBRL(comissaoEst)}
                </div>
                <p className="text-[11px] font-mono tabular-nums text-[#00A19C] font-semibold mt-1">
                  {comissaoPct > 0 ? `${comissaoPct}% sobre vendas` : 'Taxa não definida'}
                </p>
              </div>

              <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Pedidos Emitidos
                  </span>
                  <div className="w-9 h-9 rounded-lg bg-[#00A19C]/10 text-[#00A19C] flex items-center justify-center shrink-0">
                    <ShoppingBag className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-2 font-display font-mono tabular-nums text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  {totalPedidos}
                </div>
                <p className="text-[11px] text-slate-400 mt-1">neste mês vigente</p>
              </div>

              <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Clientes Atendidos
                  </span>
                  <div className="w-9 h-9 rounded-lg bg-[#00A19C]/10 text-[#00A19C] flex items-center justify-center shrink-0">
                    <Users className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-2 font-display font-mono tabular-nums text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  {totalClientes}
                </div>
                <p className="text-[11px] text-slate-400 mt-1">clientes distintos</p>
              </div>

              <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Ticket Médio
                  </span>
                  <div className="w-9 h-9 rounded-lg bg-[#00A19C]/10 text-[#00A19C] flex items-center justify-center shrink-0">
                    <TrendingUp className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-2 font-display font-mono tabular-nums text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  {fmtBRL(ticketMedio)}
                </div>
                <p className="text-[11px] text-slate-400 mt-1">por pedido fechado</p>
              </div>
            </div>

            {/* Ritmo de Vendas Diárias */}
            <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-xs">
              <h3 className="font-display font-bold text-sm text-slate-900 dark:text-white mb-1 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-[#00A19C]" />
                Ritmo de Vendas nos Últimos Dias
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                Acompanhe os dias com maiores fechamentos de pedidos
              </p>

              {meta?.vendas_por_dia && meta.vendas_por_dia.length > 0 ? (
                <div className="space-y-2.5">
                  {meta.vendas_por_dia.map((ponto) => {
                    const dataFmt = new Date(ponto.data + 'T12:00:00').toLocaleDateString('pt-BR', {
                      weekday: 'short',
                      day: '2-digit',
                      month: 'short',
                    })
                    const maxVal = Math.max(...meta.vendas_por_dia.map((p) => p.total_valor), 1)
                    const pctBarra = (ponto.total_valor / maxVal) * 100

                    return (
                      <div key={ponto.data} className="flex items-center gap-3 text-xs">
                        <span className="w-24 text-slate-500 dark:text-slate-400 font-medium capitalize truncate">
                          {dataFmt}
                        </span>
                        <div className="flex-1 h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-[#00A19C]"
                            style={{ width: `${Math.max(pctBarra, 6)}%` }}
                          />
                        </div>
                        <div className="w-32 text-right font-mono tabular-nums">
                          <span className="font-bold text-slate-900 dark:text-white">
                            {fmtBRL(ponto.total_valor)}
                          </span>
                          <span className="text-[10px] text-slate-400 ml-1">({ponto.qtd_pedidos})</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="py-8 text-center text-xs text-slate-400">
                  Nenhuma venda registrada nos últimos dias ainda. Emita seu primeiro pedido no catálogo!
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
