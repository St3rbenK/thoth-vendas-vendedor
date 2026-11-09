import React, { useState, useEffect } from 'react'
import {
  X,
  Trash2,
  Send,
  MessageCircle,
  FileText,
  UserCheck,
  ChevronRight,
  Minus,
  Plus,
  BookmarkPlus,
  Percent,
  DollarSign,
} from 'lucide-react'
import type { ItemCarrinho, Cliente } from '../types'
import { formatarWhatsApp, abrirWhatsApp, gerarPdfPedido } from '../services/share'

interface CartDrawerProps {
  isOpen: boolean
  onClose: () => void
  itens: ItemCarrinho[]
  onUpdateQty: (produtoId: string, quantidade: number) => void
  onUpdateDesconto?: (produtoId: string, descontoPct: number) => void
  onRemoveItem: (produtoId: string) => void
  onClearCart: () => void
  selectedCliente: Cliente | null
  onOpenClienteSelect: () => void
  onSubmitOrder: (observacoes: string, condicao: string) => Promise<void>
  onSaveOrcamento?: (observacoes: string, condicao: string) => Promise<void>
  isSubmitting: boolean
  limiteDescontoPct?: number
}

const CONDICOES_PAGAMENTO = [
  'À Vista',
  'PIX',
  'Boleto 7 dias',
  'Boleto 14 dias',
  'Boleto 21 dias',
  'Boleto 28 dias',
  'Boleto 30 dias',
  'Boleto 14/28 dias',
  'Boleto 28/42 dias',
  'Boleto 30/60 dias',
  'Boleto 28/42/56 dias',
  'Boleto 30/60/90 dias',
  'Cartão de Crédito',
]

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  itens,
  onUpdateQty,
  onUpdateDesconto,
  onRemoveItem,
  onClearCart,
  selectedCliente,
  onOpenClienteSelect,
  onSubmitOrder,
  onSaveOrcamento,
  isSubmitting,
  limiteDescontoPct = 15,
}) => {
  const [condicao, setCondicao] = useState<string>('À Vista')
  const [observacoes, setObservacoes] = useState<string>('')
  const [modoDescontoGeral, setModoDescontoGeral] = useState<'pct' | 'valor'>('pct')
  const [descontoGlobalPct, setDescontoGlobalPct] = useState<string>('')
  const [descontoGlobalValor, setDescontoGlobalValor] = useState<string>('')
  const [modoItemMap, setModoItemMap] = useState<Record<string, 'pct' | 'valor'>>({})
  const [savingOrcamento, setSavingOrcamento] = useState(false)

  const subtotal = itens.reduce((acc, it) => acc + it.quantidade * it.precoUnitarioCobrado, 0)
  const totalDesconto = itens.reduce(
    (acc, it) => acc + it.quantidade * it.precoUnitarioCobrado * ((it.descontoPct || 0) / 100),
    0
  )
  const total = Math.max(0, subtotal - totalDesconto)
  const maxDescontoValor = subtotal * (limiteDescontoPct / 100)
  const pctEfetivoGeral = subtotal > 0 ? (totalDesconto / subtotal) * 100 : 0

  useEffect(() => {
    if (itens.length === 0) {
      setDescontoGlobalPct('')
      setDescontoGlobalValor('')
    }
  }, [itens.length])

  if (!isOpen) return null

  const fmtBRL = (val: number) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  // Aplica desconto geral em % sobre todos os itens
  const handleApplyDescontoPct = (pctRaw: number) => {
    const capped = Math.min(Math.max(0, pctRaw), limiteDescontoPct)
    setDescontoGlobalPct(capped > 0 ? String(Number(capped.toFixed(2))) : '')
    const valReais = subtotal * (capped / 100)
    setDescontoGlobalValor(valReais > 0 ? valReais.toFixed(2) : '')
    if (onUpdateDesconto) {
      itens.forEach((it) => onUpdateDesconto(it.produtoId, capped))
    }
  }

  // Aplica desconto geral em R$ (Valor) rateando proporcionalmente nos itens até o limite
  const handleApplyDescontoValor = (valorRaw: number) => {
    if (subtotal <= 0) return
    const cappedVal = Math.min(Math.max(0, valorRaw), maxDescontoValor)
    setDescontoGlobalValor(cappedVal > 0 ? String(Number(cappedVal.toFixed(2))) : '')
    const eqPct = Math.min((cappedVal / subtotal) * 100, limiteDescontoPct)
    setDescontoGlobalPct(eqPct > 0 ? eqPct.toFixed(2) : '')
    if (onUpdateDesconto) {
      itens.forEach((it) => onUpdateDesconto(it.produtoId, eqPct))
    }
  }

  const handleWhatsApp = () => {
    const texto = formatarWhatsApp(selectedCliente, itens, condicao, total, observacoes)
    abrirWhatsApp(selectedCliente?.telefone || selectedCliente?.celular, texto)
  }

  const handlePdf = () => {
    gerarPdfPedido(selectedCliente, itens, condicao, total, observacoes)
  }

  const handleSubmit = async () => {
    if (!selectedCliente) {
      alert('Por favor, selecione um cliente para transmitir o pedido.')
      onOpenClienteSelect()
      return
    }
    await onSubmitOrder(observacoes, condicao)
  }

  const handleSalvarOrcamentoClick = async () => {
    if (!onSaveOrcamento) return
    setSavingOrcamento(true)
    try {
      await onSaveOrcamento(observacoes, condicao)
    } finally {
      setSavingOrcamento(false)
    }
  }

  const atalhosValor = [10, 20, 50, 100, Math.floor(maxDescontoValor)]
    .filter((v, idx, arr) => v > 0 && v <= maxDescontoValor && arr.indexOf(v) === idx)
    .slice(0, 5)

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Drawer com 100dvh para mobile */}
      <div className="relative z-10 flex h-[100dvh] w-full max-w-md flex-col bg-white shadow-2xl">
        {/* Topo do Carrinho */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-[#0F3C46] px-4 py-3.5 text-white shrink-0">
          <div>
            <h2 className="text-sm sm:text-base font-bold">Resumo do Pedido / Orçamento</h2>
            <p className="text-[11px] text-teal-200">
              {itens.length} produto(s) • {itens.reduce((a, b) => a + b.quantidade, 0)} un.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-white/10 p-2 text-white hover:bg-white/20 transition-colors"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Corpo com Scroll */}
        <div className="flex-1 overflow-y-auto p-3.5 sm:p-4 space-y-4">
          {/* Seleção do Cliente */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Cliente do Pedido
              </span>
              <button
                type="button"
                onClick={onOpenClienteSelect}
                className="text-xs font-bold text-teal-700 hover:text-teal-900 flex items-center gap-0.5"
              >
                {selectedCliente ? 'Trocar cliente' : 'Selecionar'} <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>

            {selectedCliente ? (
              <div className="rounded-xl bg-white p-2.5 border border-slate-200 shadow-2xs flex items-start gap-2.5">
                <div className="rounded-lg bg-teal-50 p-2 text-teal-700 shrink-0">
                  <UserCheck className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold text-slate-900">{selectedCliente.razao_social}</p>
                  <p className="text-[11px] text-slate-500 font-mono">CPF/CNPJ: {selectedCliente.cpf_cnpj}</p>
                  {selectedCliente.cidade && (
                    <p className="text-[10px] text-slate-400">
                      {selectedCliente.cidade}/{selectedCliente.estado}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={onOpenClienteSelect}
                className="w-full rounded-xl border border-dashed border-teal-400 py-2.5 text-center text-xs font-bold text-teal-800 hover:bg-teal-50 transition-all bg-white"
              >
                + Toque para escolher o cliente
              </button>
            )}
          </div>

          {/* Condição de Pagamento */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Condição de Pagamento
            </label>
            <select
              value={condicao}
              onChange={(e) => setCondicao(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-teal-500 focus:bg-white"
            >
              {CONDICOES_PAGAMENTO.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Desconto Geral no Pedido: em Porcentagem (%) OU em Valor (R$) */}
          {itens.length > 0 && (
            <div className="rounded-2xl border border-teal-200 bg-teal-50/70 p-3 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <span className="text-xs font-black text-teal-950 block">Desconto Geral</span>
                  <span className="text-[10px] text-teal-700 font-medium">
                    Limite máx: <strong>{limiteDescontoPct}%</strong> ({fmtBRL(maxDescontoValor)})
                  </span>
                </div>

                {/* Alternador % vs R$ */}
                <div className="inline-flex rounded-xl bg-teal-900/10 p-0.5 border border-teal-300/60">
                  <button
                    type="button"
                    onClick={() => setModoDescontoGeral('pct')}
                    className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-black transition-all ${
                      modoDescontoGeral === 'pct'
                        ? 'bg-teal-700 text-white shadow-2xs'
                        : 'text-teal-800 hover:text-teal-950'
                    }`}
                  >
                    <Percent className="h-3 w-3" />
                    <span>%</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setModoDescontoGeral('valor')}
                    className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-black transition-all ${
                      modoDescontoGeral === 'valor'
                        ? 'bg-teal-700 text-white shadow-2xs'
                        : 'text-teal-800 hover:text-teal-950'
                    }`}
                  >
                    <DollarSign className="h-3 w-3" />
                    <span>R$</span>
                  </button>
                </div>
              </div>

              {/* Campo de Entrada conforme Modo (% ou R$) */}
              {modoDescontoGeral === 'pct' ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <input
                        type="number"
                        min="0"
                        max={limiteDescontoPct}
                        step="0.5"
                        inputMode="decimal"
                        value={descontoGlobalPct}
                        onChange={(e) => {
                          setDescontoGlobalPct(e.target.value)
                          const val = parseFloat(e.target.value)
                          handleApplyDescontoPct(isNaN(val) ? 0 : val)
                        }}
                        placeholder="Ex: 5 ou 10"
                        className="w-full rounded-xl border border-teal-300 bg-white py-1.5 pl-3 pr-8 text-xs font-black text-teal-950 focus:outline-teal-600"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-black text-teal-700">
                        %
                      </span>
                    </div>
                    <div className="text-right shrink-0 min-w-[90px]">
                      <div className="text-[10px] text-teal-700">Desconto em R$</div>
                      <div className="text-xs font-black text-teal-900">- {fmtBRL(totalDesconto)}</div>
                    </div>
                  </div>

                  {/* Atalhos em % */}
                  <div className="flex items-center gap-1 flex-wrap">
                    {[0, 5, 10, 15, 20, limiteDescontoPct]
                      .filter((v, idx, arr) => v <= limiteDescontoPct && arr.indexOf(v) === idx)
                      .map((pct) => (
                        <button
                          key={pct}
                          type="button"
                          onClick={() => handleApplyDescontoPct(pct)}
                          className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${
                            Math.abs(pctEfetivoGeral - pct) < 0.1 && (pct > 0 || totalDesconto === 0)
                              ? 'bg-teal-700 text-white shadow-2xs'
                              : 'bg-white text-teal-800 border border-teal-300/80 hover:bg-teal-100'
                          }`}
                        >
                          {pct === 0 ? '0%' : pct === limiteDescontoPct ? `Máx ${pct}%` : `${pct}%`}
                        </button>
                      ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-black text-teal-700">
                        R$
                      </span>
                      <input
                        type="number"
                        min="0"
                        max={Number(maxDescontoValor.toFixed(2))}
                        step="1"
                        inputMode="decimal"
                        value={descontoGlobalValor}
                        onChange={(e) => {
                          setDescontoGlobalValor(e.target.value)
                          const val = parseFloat(e.target.value)
                          handleApplyDescontoValor(isNaN(val) ? 0 : val)
                        }}
                        placeholder="Ex: 20,00"
                        className="w-full rounded-xl border border-teal-300 bg-white py-1.5 pl-9 pr-3 text-xs font-black text-teal-950 focus:outline-teal-600"
                      />
                    </div>
                    <div className="text-right shrink-0 min-w-[90px]">
                      <div className="text-[10px] text-teal-700">Equivalente a</div>
                      <div className="text-xs font-black text-teal-900">{pctEfetivoGeral.toFixed(1)}%</div>
                    </div>
                  </div>

                  {/* Atalhos em R$ */}
                  <div className="flex items-center gap-1 flex-wrap">
                    <button
                      type="button"
                      onClick={() => handleApplyDescontoValor(0)}
                      className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${
                        totalDesconto === 0
                          ? 'bg-teal-700 text-white'
                          : 'bg-white text-teal-800 border border-teal-300/80'
                      }`}
                    >
                      R$ 0
                    </button>
                    {atalhosValor.map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => handleApplyDescontoValor(val)}
                        className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${
                          Math.abs(totalDesconto - val) < 0.5
                            ? 'bg-teal-700 text-white'
                            : 'bg-white text-teal-800 border border-teal-300/80 hover:bg-teal-100'
                        }`}
                      >
                        R$ {val}
                      </button>
                    ))}
                    {maxDescontoValor > 0 && (
                      <button
                        type="button"
                        onClick={() => handleApplyDescontoValor(maxDescontoValor)}
                        className="px-2 py-1 rounded-lg text-[10px] font-bold bg-white text-teal-800 border border-teal-300/80 hover:bg-teal-100"
                      >
                        Máx ({fmtBRL(maxDescontoValor)})
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Lista de Itens */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Itens do Pedido ({itens.length})
              </span>
              {itens.length > 0 && (
                <button
                  type="button"
                  onClick={onClearCart}
                  className="text-xs font-semibold text-rose-600 hover:text-rose-800"
                >
                  Limpar tudo
                </button>
              )}
            </div>

            {itens.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-slate-400">
                <p className="text-xs font-bold text-slate-600">Seu pedido está vazio</p>
                <p className="text-[11px] mt-0.5">Adicione produtos pelo catálogo para iniciar.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
                {itens.map((it) => {
                  const subBruto = it.quantidade * it.precoUnitarioCobrado
                  const descReaisItem = subBruto * ((it.descontoPct || 0) / 100)
                  const maxReaisItem = subBruto * (limiteDescontoPct / 100)
                  const totalLiquidoItem = subBruto - descReaisItem
                  const modoItem = modoItemMap[it.produtoId] || 'pct'

                  return (
                    <div key={it.produtoId} className="p-3 space-y-2">
                      {/* Linha 1: Nome + Botão Remover */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-slate-900 leading-snug">{it.nome}</p>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            <span className="font-mono font-semibold">#{it.codigo}</span> •{' '}
                            {fmtBRL(it.precoUnitarioCobrado)}/{it.unidade}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => onRemoveItem(it.produtoId)}
                          className="p-1 text-slate-400 hover:text-rose-600 transition-colors shrink-0"
                          aria-label="Remover item"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      {/* Linha 2: Desconto (% ou R$) + Stepper Qtd + Subtotal */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-50">
                        {/* Desconto individual em % ou R$ */}
                        <div className="flex items-center gap-1 text-[11px]">
                          <button
                            type="button"
                            onClick={() =>
                              setModoItemMap((prev) => ({
                                ...prev,
                                [it.produtoId]: modoItem === 'pct' ? 'valor' : 'pct',
                              }))
                            }
                            className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-teal-800 border border-slate-200 hover:bg-teal-50"
                            title="Alternar entre desconto em % ou R$"
                          >
                            Desc ({modoItem === 'pct' ? '%' : 'R$'}):
                          </button>

                          {modoItem === 'pct' ? (
                            <input
                              type="number"
                              min="0"
                              max={limiteDescontoPct}
                              step="0.5"
                              inputMode="decimal"
                              value={it.descontoPct ? Number(it.descontoPct.toFixed(2)) : ''}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0
                                const capped = Math.min(Math.max(0, val), limiteDescontoPct)
                                if (onUpdateDesconto) onUpdateDesconto(it.produtoId, capped)
                              }}
                              placeholder="0%"
                              className="w-14 px-1.5 py-1 rounded-lg border border-slate-200 text-center text-xs font-bold font-mono focus:outline-teal-500"
                            />
                          ) : (
                            <input
                              type="number"
                              min="0"
                              max={Number(maxReaisItem.toFixed(2))}
                              step="0.5"
                              inputMode="decimal"
                              value={descReaisItem > 0 ? Number(descReaisItem.toFixed(2)) : ''}
                              onChange={(e) => {
                                const valReais = parseFloat(e.target.value) || 0
                                const cappedReais = Math.min(Math.max(0, valReais), maxReaisItem)
                                const pct = subBruto > 0 ? (cappedReais / subBruto) * 100 : 0
                                if (onUpdateDesconto) onUpdateDesconto(it.produtoId, pct)
                              }}
                              placeholder="R$ 0"
                              className="w-16 px-1.5 py-1 rounded-lg border border-slate-200 text-center text-xs font-bold font-mono focus:outline-teal-500"
                            />
                          )}
                        </div>

                        {/* Quantidade Stepper */}
                        <div className="flex items-center rounded-xl bg-slate-100 p-0.5 ring-1 ring-slate-200">
                          <button
                            type="button"
                            onClick={() => onUpdateQty(it.produtoId, Math.max(1, it.quantidade - 1))}
                            className="p-1.5 text-slate-700 active:bg-slate-200 rounded-lg"
                            aria-label="Diminuir"
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <span className="w-8 text-center text-xs font-black text-slate-900">
                            {it.quantidade}
                          </span>
                          <button
                            type="button"
                            onClick={() => onUpdateQty(it.produtoId, it.quantidade + 1)}
                            className="p-1.5 text-slate-700 active:bg-slate-200 rounded-lg"
                            aria-label="Aumentar"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        {/* Valor Total do Item */}
                        <div className="text-right min-w-[76px]">
                          <p className="text-xs font-black text-teal-800">{fmtBRL(totalLiquidoItem)}</p>
                          {it.descontoPct > 0 && (
                            <p className="text-[10px] text-emerald-600 font-bold">
                              -{it.descontoPct.toFixed(1)}% (-{fmtBRL(descReaisItem)})
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Observações */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Observações (Entrega, Prazo, OC)
            </label>
            <textarea
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Ex: Entregar no período da manhã, falar com responsável..."
              rows={2}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-800 outline-none focus:border-teal-500 focus:bg-white resize-none"
            />
          </div>
        </div>

        {/* Rodapé Fixo do Carrinho com Totais e Ações */}
        <div className="border-t border-slate-200 bg-slate-50 p-3.5 sm:p-4 space-y-2.5 shrink-0 pb-[max(0.875rem,env(safe-area-inset-bottom))]">
          <div className="space-y-1 text-xs">
            <div className="flex items-center justify-between text-slate-500">
              <span>Subtotal Bruto</span>
              <span>{fmtBRL(subtotal)}</span>
            </div>
            {totalDesconto > 0 && (
              <div className="flex items-center justify-between text-emerald-700 font-bold">
                <span>Desconto Total ({pctEfetivoGeral.toFixed(1)}%)</span>
                <span>- {fmtBRL(totalDesconto)}</span>
              </div>
            )}
            <div className="flex items-center justify-between pt-1 border-t border-slate-200">
              <span className="font-bold uppercase tracking-wider text-slate-700">Total Líquido</span>
              <span className="text-lg sm:text-xl font-black text-[#0F3C46]">{fmtBRL(total)}</span>
            </div>
          </div>

          {/* Botão Primário: Transmitir Pedido + Botão Salvar Orçamento */}
          <div className="grid grid-cols-5 gap-2">
            {onSaveOrcamento && (
              <button
                type="button"
                onClick={handleSalvarOrcamentoClick}
                disabled={itens.length === 0 || savingOrcamento || isSubmitting}
                className="col-span-2 flex h-11 items-center justify-center gap-1.5 rounded-xl border-2 border-amber-500 bg-amber-50 font-bold text-xs text-amber-900 shadow-2xs active:scale-[0.98] transition-all hover:bg-amber-100 disabled:opacity-50"
                title="Salvar como Orçamento para continuar ou converter depois"
              >
                <BookmarkPlus className="h-4 w-4 text-amber-600 shrink-0" />
                <span>{savingOrcamento ? 'Salvando...' : 'Salvar Orç.'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleSubmit}
              disabled={itens.length === 0 || isSubmitting}
              className={`${
                onSaveOrcamento ? 'col-span-3' : 'col-span-5'
              } flex h-11 items-center justify-center gap-1.5 rounded-xl bg-teal-800 font-bold text-xs uppercase tracking-wider text-white shadow-md active:scale-[0.98] transition-all hover:bg-teal-700 disabled:opacity-50`}
            >
              <Send className="h-4 w-4 shrink-0" />
              <span>{isSubmitting ? 'Transmitindo...' : 'Transmitir Pedido'}</span>
            </button>
          </div>

          {/* Ações Secundárias: WhatsApp & PDF */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleWhatsApp}
              disabled={itens.length === 0}
              className="flex h-9 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 font-bold text-xs text-white shadow-2xs active:scale-[0.98] transition-all hover:bg-emerald-500 disabled:opacity-50"
            >
              <MessageCircle className="h-3.5 w-3.5" />
              <span>Enviar WhatsApp</span>
            </button>
            <button
              type="button"
              onClick={handlePdf}
              disabled={itens.length === 0}
              className="flex h-9 items-center justify-center gap-1.5 rounded-xl border border-slate-300 bg-white font-bold text-xs text-slate-700 shadow-2xs active:scale-[0.98] transition-all hover:bg-slate-50 disabled:opacity-50"
            >
              <FileText className="h-3.5 w-3.5" />
              <span>Gerar PDF</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
