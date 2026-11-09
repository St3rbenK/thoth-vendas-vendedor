import React, { useState, useEffect } from 'react'
import {
  Target,
  TrendingUp,
  DollarSign,
  Award,
  Calendar,
  Users,
  ShoppingBag,
  ArrowUpRight,
  Sparkles,
  Loader2,
  CheckCircle2,
} from 'lucide-react'
import { getVendedorMeta } from '../services/api'
import { AppLogo } from './AppLogo'
import type { VendedorMeta } from '../types'

export function MetaView({ vendedorNome }: { vendedorNome?: string }) {
  const [meta, setMeta] = useState<VendedorMeta | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const data = await getVendedorMeta()
        setMeta(data)
      } catch (err) {
        console.error('Erro ao carregar meta:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-slate-400">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600 mb-2" />
        <p className="text-xs">Carregando métricas de desempenho...</p>
      </div>
    )
  }

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
      {/* Top Bar Mobile com Logo Padrão */}
      <header className="sticky top-0 z-20 bg-[#0F3C46] text-white shadow-sm md:hidden">
        <div className="flex items-center justify-between gap-2 px-4 py-3">
          <AppLogo product="vendas" size="sm" showText={true} variant="dark" />
          <span className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-bold text-teal-200">
            Minha Meta
          </span>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-3 py-4 sm:px-6 sm:py-6">
      {/* Título */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-teal-600 font-bold text-xs uppercase tracking-wider">
          <Sparkles className="h-4 w-4" /> Desempenho Comercial do Mês
        </div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-0.5">
          Minha Meta & Comissões
        </h2>
        <p className="text-xs sm:text-sm text-slate-500">
          Olá, <span className="font-bold text-slate-700">{vendedorNome || 'Representante'}</span>! Acompanhe suas vendas e conquiste seus objetivos este mês.
        </p>
      </div>

      {/* Card Principal: Progresso da Meta */}
      <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-slate-850 to-teal-950 p-6 sm:p-8 text-white shadow-xl relative overflow-hidden mb-6">
        <div className="absolute right-0 top-0 -mt-10 -mr-10 h-64 w-64 rounded-full bg-teal-500/10 blur-3xl" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-teal-500/20 px-3 py-1 text-xs font-bold text-teal-300 border border-teal-500/30">
              <Target className="h-3.5 w-3.5" />
              <span>{isMetaBatida ? '🎉 Parabéns! Meta Batida' : 'Meta Mensal em Andamento'}</span>
            </div>
            <div>
              <div className="text-xs text-slate-400 font-medium">Total Vendido no Mês</div>
              <div className="text-3xl sm:text-4xl font-black tracking-tight text-white">
                {fmtBRL(totalVendido)}
              </div>
            </div>
            {metaMensal > 0 && (
              <p className="text-xs text-slate-400">
                Meta do Mês: <span className="font-bold text-teal-200">{fmtBRL(metaMensal)}</span>
                {falta > 0 ? (
                  <span className="text-amber-300 ml-2">(Faltam {fmtBRL(falta)})</span>
                ) : (
                  <span className="text-emerald-400 ml-2 font-bold">(Superou em {fmtBRL(totalVendido - metaMensal)})</span>
                )}
              </p>
            )}
          </div>

          {/* Medidor Circular / % */}
          <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-white/5 backdrop-blur border border-white/10 shrink-0 min-w-36">
            <span className="text-3xl sm:text-4xl font-black text-teal-300">
              {pct.toFixed(1)}%
            </span>
            <span className="text-[11px] uppercase font-bold tracking-wider text-slate-400 mt-0.5">
              Atingido
            </span>
          </div>
        </div>

        {/* Barra de Progresso Horizontal */}
        <div className="relative z-10 mt-6">
          <div className="h-3 w-full rounded-full bg-slate-800 overflow-hidden p-0.5 border border-slate-700">
            <div
              className={`h-full rounded-full transition-all duration-1000 ${
                isMetaBatida
                  ? 'bg-gradient-to-r from-teal-400 to-emerald-400'
                  : 'bg-gradient-to-r from-amber-400 via-teal-400 to-emerald-500'
              }`}
              style={{ width: `${Math.min(pct, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Grid de Métricas Principais */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
        {/* Comissão Estimada */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-semibold">Comissão Estimada</span>
            <DollarSign className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-lg sm:text-xl font-black text-slate-900">
            {fmtBRL(comissaoEst)}
          </div>
          <p className="text-[10px] text-emerald-600 font-bold mt-0.5">
            {comissaoPct > 0 ? `${comissaoPct}% sobre vendas` : 'Taxa não definida'}
          </p>
        </div>

        {/* Total de Pedidos */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-semibold">Pedidos Emitidos</span>
            <ShoppingBag className="h-4 w-4 text-teal-600" />
          </div>
          <div className="text-lg sm:text-xl font-black text-slate-900">
            {totalPedidos}
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">
            neste mês vigente
          </p>
        </div>

        {/* Clientes Atendidos */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-semibold">Clientes Atendidos</span>
            <Users className="h-4 w-4 text-blue-600" />
          </div>
          <div className="text-lg sm:text-xl font-black text-slate-900">
            {totalClientes}
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">
            clientes distintos
          </p>
        </div>

        {/* Ticket Médio */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-semibold">Ticket Médio</span>
            <TrendingUp className="h-4 w-4 text-indigo-600" />
          </div>
          <div className="text-lg sm:text-xl font-black text-slate-900">
            {fmtBRL(ticketMedio)}
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">
            por pedido fechado
          </p>
        </div>
      </div>

      {/* Histórico Recente de Vendas Diárias */}
      <div className="rounded-3xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs">
        <h3 className="font-bold text-sm text-slate-900 mb-1 flex items-center gap-2">
          <Calendar className="h-4 w-4 text-teal-600" />
          Ritmo de Vendas nos Últimos Dias
        </h3>
        <p className="text-xs text-slate-500 mb-4">
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
                  <span className="w-24 text-slate-500 font-medium capitalize truncate">
                    {dataFmt}
                  </span>
                  <div className="flex-1 h-3 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-teal-500"
                      style={{ width: `${Math.max(pctBarra, 8)}%` }}
                    />
                  </div>
                  <div className="w-28 text-right">
                    <span className="font-black text-slate-900">{fmtBRL(ponto.total_valor)}</span>
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
      </div>
    </div>
  )
}
