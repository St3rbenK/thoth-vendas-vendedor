import React, { useState } from 'react'
import { X, Trash2, Send, MessageCircle, FileText, UserCheck, ChevronRight, Minus, Plus } from 'lucide-react'
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
  isSubmitting: boolean
  limiteDescontoPct?: number
}

const CONDICOES_PAGAMENTO = [
  'À Vista',
  'Boleto 14 dias',
  'Boleto 21 dias',
  'Boleto 28 dias',
  'Boleto 14/28 dias',
  'Boleto 28/42 dias',
  'Boleto 30/60 dias',
  'Boleto 30/60/90 dias',
  'PIX',
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
  isSubmitting,
  limiteDescontoPct = 15,
}) => {
  const [condicao, setCondicao] = useState<string>('À Vista')
  const [observacoes, setObservacoes] = useState<string>('')
  const [descontoGlobal, setDescontoGlobal] = useState<number>(0)

  if (!isOpen) return null

  const subtotal = itens.reduce((acc, it) => acc + (it.quantidade * it.precoUnitarioCobrado), 0)
  const totalDesconto = itens.reduce((acc, it) => acc + (it.quantidade * it.precoUnitarioCobrado * (it.descontoPct / 100)), 0)
  const total = subtotal - totalDesconto
  const subtotalFmt = subtotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  const totalFmt = total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  const handleApplyDescontoGlobal = (pct: number) => {
    const capped = Math.min(Math.max(0, pct), limiteDescontoPct)
    setDescontoGlobal(capped)
    if (onUpdateDesconto) {
      itens.forEach((it) => onUpdateDesconto(it.produtoId, capped))
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
      alert('Por favor, selecione um cliente para o pedido.')
      onOpenClienteSelect()
      return
    }
    await onSubmitOrder(observacoes, condicao)
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="relative z-10 flex h-full w-full max-w-md flex-col bg-white shadow-2xl">
        {/* Topo do Carrinho */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-[#0F3C46] px-5 py-4 text-white">
          <div>
            <h2 className="text-base font-bold">Resumo do Pedido</h2>
            <p className="text-xs text-teal-200">{itens.length} item(ns) selecionado(s)</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl bg-white/10 p-2 text-white hover:bg-white/20 transition-colors"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Corpo com Scroll */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Seleção do Cliente */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Cliente da Carteira
              </span>
              <button
                onClick={onOpenClienteSelect}
                className="text-xs font-bold text-teal-700 hover:text-teal-900 flex items-center gap-1"
              >
                {selectedCliente ? 'Trocar' : 'Selecionar'} <ChevronRight className="h-3 w-3" />
              </button>
            </div>

            {selectedCliente ? (
              <div className="rounded-xl bg-white p-3 border border-slate-200 shadow-sm flex items-start gap-2.5">
                <div className="rounded-lg bg-teal-50 p-2 text-teal-700 shrink-0">
                  <UserCheck className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold text-slate-900">{selectedCliente.razao_social}</p>
                  <p className="text-[11px] text-slate-500">CNPJ: {selectedCliente.cpf_cnpj}</p>
                  {selectedCliente.cidade && (
                    <p className="text-[10px] text-slate-400">
                      {selectedCliente.cidade}/{selectedCliente.estado}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <button
                onClick={onOpenClienteSelect}
                className="w-full rounded-xl border border-dashed border-slate-300 py-3 text-center text-xs font-bold text-slate-500 hover:border-teal-500 hover:text-teal-700 transition-all bg-white"
              >
                + Toque para vincular o cliente
              </button>
            )}
          </div>

          {/* Condição de Pagamento */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Condição de Pagamento
            </label>
            <select
              value={condicao}
              onChange={(e) => setCondicao(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-bold text-slate-800 outline-none focus:border-teal-500 focus:bg-white"
            >
              {CONDICOES_PAGAMENTO.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Desconto Geral no Pedido */}
          {itens.length > 0 && (
            <div className="rounded-2xl border border-teal-200 bg-teal-50/70 p-3.5 space-y-2.5">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-teal-950 block">Desconto Geral no Pedido</span>
                  <span className="text-[10px] text-teal-700 font-medium">
                    Seu limite autorizado: <strong className="font-bold">{limiteDescontoPct}%</strong>
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="0"
                    max={limiteDescontoPct}
                    step="0.5"
                    value={descontoGlobal || ''}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0
                      handleApplyDescontoGlobal(val)
                    }}
                    placeholder="0"
                    className="w-16 px-2 py-1 rounded-xl border border-teal-300 bg-white text-center text-xs font-black font-mono text-teal-900 focus:outline-teal-500 shadow-sm"
                  />
                  <span className="text-xs font-bold text-teal-900">%</span>
                </div>
              </div>

              {/* Atalhos Rápidos de Desconto */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] text-teal-800 font-semibold">Atalhos:</span>
                {[0, 3, 5, 7, 10, limiteDescontoPct]
                  .filter((v, idx, arr) => arr.indexOf(v) === idx && v <= limiteDescontoPct)
                  .map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => handleApplyDescontoGlobal(pct)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                        descontoGlobal === pct
                          ? 'bg-teal-700 text-white shadow-sm ring-2 ring-teal-400'
                          : 'bg-white text-teal-800 border border-teal-300/80 hover:bg-teal-100/60'
                      }`}
                    >
                      {pct === 0 ? 'Sem desc.' : pct === limiteDescontoPct ? `Máx (${pct}%)` : `${pct}%`}
                    </button>
                  ))}
              </div>
            </div>
          )}

          {/* Lista de Itens */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Itens</span>
              {itens.length > 0 && (
                <button
                  onClick={onClearCart}
                  className="text-xs font-semibold text-rose-600 hover:text-rose-800"
                >
                  Limpar tudo
                </button>
              )}
            </div>

            {itens.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-slate-400">
                <p className="text-xs font-medium">O carrinho está vazio.</p>
                <p className="text-[11px]">Adicione produtos pelo catálogo.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
                {itens.map((it) => (
                  <div key={it.produtoId} className="p-3 flex items-center gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-bold text-slate-900">{it.nome}</p>
                      <p className="text-[11px] text-slate-500">
                        #{it.codigo} • {it.precoUnitarioCobrado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}/{it.unidade}
                      </p>
                      
                      {/* Desconto por Item */}
                      <div className="mt-1 flex items-center gap-1.5 text-[11px]">
                        <span className="text-slate-400">Desc:</span>
                        <input
                          type="number"
                          min="0"
                          max={limiteDescontoPct}
                          value={it.descontoPct || ''}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0
                            const capped = Math.min(Math.max(0, val), limiteDescontoPct)
                            if (onUpdateDesconto) onUpdateDesconto(it.produtoId, capped)
                          }}
                          placeholder="0"
                          className="w-12 px-1.5 py-0.5 rounded border border-slate-200 text-center text-xs font-bold font-mono focus:outline-teal-500"
                        />
                        <span className="text-slate-400">% (máx {limiteDescontoPct}%)</span>
                      </div>

                      <p className="text-xs font-black text-teal-800 mt-1">
                        {(it.quantidade * it.precoUnitarioCobrado * (1 - (it.descontoPct || 0) / 100)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        {it.descontoPct > 0 && (
                          <span className="text-[10px] text-teal-600 font-bold ml-1.5">
                            (-{it.descontoPct}%)
                          </span>
                        )}
                      </p>
                    </div>

                    {/* Stepper no Carrinho */}
                    <div className="flex items-center rounded-lg bg-slate-100 p-0.5 ring-1 ring-slate-200">
                      <button
                        onClick={() => onUpdateQty(it.produtoId, Math.max(1, it.quantidade - 1))}
                        className="p-1.5 text-slate-600 hover:bg-slate-200 rounded"
                        aria-label="Diminuir"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="w-8 text-center text-xs font-bold text-slate-900">{it.quantidade}</span>
                      <button
                        onClick={() => onUpdateQty(it.produtoId, it.quantidade + 1)}
                        className="p-1.5 text-slate-600 hover:bg-slate-200 rounded"
                        aria-label="Aumentar"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <button
                      onClick={() => onRemoveItem(it.produtoId)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors"
                      aria-label="Remover"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Observações */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Observações do Pedido (opcional)
            </label>
            <textarea
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Ex: Entregar após as 14h, deixar com o encarregado..."
              rows={2}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-800 outline-none focus:border-teal-500 focus:bg-white resize-none"
            />
          </div>
        </div>

        {/* Rodapé Fixo do Carrinho com Totais e Ações */}
        <div className="border-t border-slate-200 bg-slate-50 p-5 space-y-3">
          <div className="space-y-1 text-xs">
            <div className="flex items-center justify-between text-slate-500">
              <span>Subtotal</span>
              <span>{subtotalFmt}</span>
            </div>
            {totalDesconto > 0 && (
              <div className="flex items-center justify-between text-teal-700 font-bold">
                <span>Desconto Aplicado</span>
                <span>- {totalDesconto.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
              </div>
            )}
            <div className="flex items-center justify-between pt-1 border-t border-slate-200">
              <span className="font-bold uppercase tracking-wider text-slate-700">Total do Pedido</span>
              <span className="text-xl font-black text-[#0F3C46]">{totalFmt}</span>
            </div>
          </div>

          {/* Botão Primário: Transmitir */}
          <button
            onClick={handleSubmit}
            disabled={itens.length === 0 || isSubmitting}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-teal-800 font-bold text-xs uppercase tracking-wider text-white shadow-md active:scale-[0.98] transition-all hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="h-4 w-4" />
            <span>{isSubmitting ? 'Transmitindo...' : 'Transmitir Pedido'}</span>
          </button>

          {/* Ações Secundárias: WhatsApp & PDF */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleWhatsApp}
              disabled={itens.length === 0}
              className="flex h-10 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 font-bold text-xs text-white shadow-sm active:scale-[0.98] transition-all hover:bg-emerald-500 disabled:opacity-50"
            >
              <MessageCircle className="h-4 w-4" />
              <span>WhatsApp</span>
            </button>
            <button
              onClick={handlePdf}
              disabled={itens.length === 0}
              className="flex h-10 items-center justify-center gap-1.5 rounded-xl border border-slate-300 bg-white font-bold text-xs text-slate-700 shadow-sm active:scale-[0.98] transition-all hover:bg-slate-50 disabled:opacity-50"
            >
              <FileText className="h-4 w-4" />
              <span>Baixar PDF</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
