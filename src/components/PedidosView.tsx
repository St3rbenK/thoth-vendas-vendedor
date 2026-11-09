import React, { useState, useEffect, useMemo } from 'react'
import {
  ClipboardList,
  Search,
  Filter,
  Calendar,
  User,
  Package,
  FileDown,
  Share2,
  X,
  Loader2,
  CheckCircle,
  Clock,
  AlertCircle,
  DollarSign,
} from 'lucide-react'
import { getPedidos, getPedidoDetalhes } from '../services/api'
import type { Pedido } from '../types'
import jsPDF from 'jspdf'

export function PedidosView({ empresaNome }: { empresaNome: string }) {
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('todos')
  const [search, setSearch] = useState('')
  const [selectedPedido, setSelectedPedido] = useState<Pedido | null>(null)
  const [loadingDetalhes, setLoadingDetalhes] = useState(false)

  const carregarPedidos = async (status?: string) => {
    setLoading(true)
    try {
      const data = await getPedidos(status)
      setPedidos(data)
    } catch (err) {
      console.error('Falha ao carregar pedidos:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    carregarPedidos(statusFilter)
  }, [statusFilter])

  const handleOpenDetalhes = async (pedido: Pedido) => {
    setSelectedPedido(pedido)
    setLoadingDetalhes(true)
    try {
      const full = await getPedidoDetalhes(pedido.id)
      if (full) {
        setSelectedPedido(full)
      }
    } catch (err) {
      console.warn('Falha ao carregar itens do pedido:', err)
    } finally {
      setLoadingDetalhes(false)
    }
  }

  const handleCompartilharWhatsApp = (p: Pedido) => {
    const valorFmt = Number(p.valor_total).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    const dataFmt = new Date(p.created_at).toLocaleDateString('pt-BR')
    const texto = `*Pedido #${p.numero || p.id.slice(0, 8)}* - ${empresaNome}\n` +
      `📅 *Data:* ${dataFmt}\n` +
      `👤 *Cliente:* ${p.cliente_nome || 'Cliente'}\n` +
      `💰 *Valor Total:* ${valorFmt}\n` +
      `📌 *Status:* ${p.status?.toUpperCase() || 'REGISTRADO'}\n` +
      `\nObrigado pela preferência!`
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(texto)}`
    window.open(url, '_blank')
  }

  const handleGerarPDF = (p: Pedido) => {
    const doc = new jsPDF()
    const valorFmt = Number(p.valor_total).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    const dataFmt = new Date(p.created_at).toLocaleString('pt-BR')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(16)
    doc.text(empresaNome, 14, 20)

    doc.setFontSize(11)
    doc.setFont('helvetica', 'normal')
    doc.text(`Comprovante de Pedido de Venda #${p.numero || p.id.slice(0, 8)}`, 14, 28)
    doc.text(`Data de Emissão: ${dataFmt}`, 14, 34)

    doc.setDrawColor(200, 200, 200)
    doc.line(14, 38, 196, 38)

    doc.setFont('helvetica', 'bold')
    doc.text('Dados do Cliente:', 14, 46)
    doc.setFont('helvetica', 'normal')
    doc.text(`Cliente: ${p.cliente_nome || 'Não informado'}`, 14, 52)

    doc.line(14, 58, 196, 58)

    doc.setFont('helvetica', 'bold')
    doc.text('Itens do Pedido:', 14, 66)

    let y = 74
    if (p.itens && p.itens.length > 0) {
      doc.setFontSize(9)
      doc.text('Item / Produto', 14, y)
      doc.text('Qtd', 120, y)
      doc.text('Unit. (R$)', 140, y)
      doc.text('Total (R$)', 170, y)
      y += 4
      doc.line(14, y, 196, y)
      y += 6

      p.itens.forEach((it) => {
        doc.setFont('helvetica', 'normal')
        const nomeProd = it.nome_produto.length > 50 ? it.nome_produto.slice(0, 48) + '...' : it.nome_produto
        doc.text(nomeProd, 14, y)
        doc.text(`${it.quantidade} ${it.unidade || 'UN'}`, 120, y)
        doc.text(it.preco_unitario_cobrado.toFixed(2), 140, y)
        doc.text(it.valor_total.toFixed(2), 170, y)
        y += 6
      })
    } else {
      doc.setFont('helvetica', 'italic')
      doc.text('Itens em processamento ou consolidados no ERP', 14, y)
      y += 10
    }

    doc.line(14, y + 2, 196, y + 2)
    y += 10

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.text(`VALOR TOTAL DO PEDIDO: ${valorFmt}`, 14, y)

    if (p.observacao) {
      y += 8
      doc.setFontSize(9)
      doc.setFont('helvetica', 'italic')
      doc.text(`Observações: ${p.observacao}`, 14, y)
    }

    doc.save(`pedido_${p.numero || p.id.slice(0, 8)}.pdf`)
  }

  const filteredPedidos = useMemo(() => {
    return pedidos.filter((p) => {
      if (!search.trim()) return true
      const term = search.toLowerCase().trim()
      return (
        p.numero?.toLowerCase().includes(term) ||
        p.id.toLowerCase().includes(term) ||
        p.cliente_nome?.toLowerCase().includes(term)
      )
    })
  }, [pedidos, search])

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'faturado':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700 border border-emerald-200">
            <CheckCircle className="h-3 w-3" /> Faturado
          </span>
        )
      case 'aprovado':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-blue-700 border border-blue-200">
            <CheckCircle className="h-3 w-3" /> Aprovado
          </span>
        )
      case 'cancelado':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-bold text-rose-700 border border-rose-200">
            <AlertCircle className="h-3 w-3" /> Cancelado
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-bold text-amber-700 border border-amber-200">
            <Clock className="h-3 w-3" /> Pendente
          </span>
        )
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-3 py-4 sm:px-6 sm:py-6">
      {/* Título e Ações */}
      <div className="mb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <ClipboardList className="h-6 w-6 text-teal-600" />
            Meus Pedidos de Venda
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Acompanhe o status e histórico de todos os pedidos que você emitiu
          </p>
        </div>

        {/* Busca */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar pedido ou cliente..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 placeholder-slate-400 focus:outline-teal-500"
          />
        </div>
      </div>

      {/* Filtros de Status */}
      <div className="mb-4 flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
        {[
          { id: 'todos', label: 'Todos' },
          { id: 'pendente', label: 'Pendentes' },
          { id: 'aprovado', label: 'Aprovados' },
          { id: 'faturado', label: 'Faturados' },
          { id: 'cancelado', label: 'Cancelados' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setStatusFilter(tab.id)}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${
              statusFilter === tab.id
                ? 'bg-teal-600 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Conteúdo / Lista */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <Loader2 className="h-8 w-8 animate-spin text-teal-600 mb-2" />
          <p className="text-xs">Carregando seus pedidos...</p>
        </div>
      ) : filteredPedidos.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-white py-16 text-center">
          <ClipboardList className="h-10 w-10 text-slate-300 mb-2" />
          <p className="text-sm font-bold text-slate-700">Nenhum pedido encontrado</p>
          <p className="text-xs text-slate-400 mt-1">
            {search ? 'Tente mudar o termo de busca' : 'Você ainda não possui pedidos com este status'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredPedidos.map((pedido) => {
            const valorTotalFmt = Number(pedido.valor_total).toLocaleString('pt-BR', {
              style: 'currency',
              currency: 'BRL',
            })
            const dataFmt = new Date(pedido.created_at).toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit',
            })

            return (
              <div
                key={pedido.id}
                className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs hover:border-teal-500/50 transition-all"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-black text-slate-900">
                        #{pedido.numero || pedido.id.slice(0, 8)}
                      </span>
                      {getStatusBadge(pedido.status)}
                    </div>
                    <div className="mt-1 flex items-center gap-1.5 text-sm font-bold text-slate-800">
                      <User className="h-3.5 w-3.5 text-slate-400" />
                      <span>{pedido.cliente_nome || 'Cliente não identificado'}</span>
                    </div>
                    <div className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-400">
                      <Calendar className="h-3 w-3" />
                      <span>{dataFmt}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xs text-slate-400">Total do Pedido</div>
                    <div className="text-lg font-black text-teal-700">{valorTotalFmt}</div>
                  </div>
                </div>

                {/* Ações do Card */}
                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                  <button
                    onClick={() => handleCompartilharWhatsApp(pedido)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <Share2 className="h-3.5 w-3.5 text-emerald-600" />
                    <span>WhatsApp</span>
                  </button>
                  <button
                    onClick={() => handleGerarPDF(pedido)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <FileDown className="h-3.5 w-3.5 text-teal-600" />
                    <span>PDF</span>
                  </button>
                  <button
                    onClick={() => handleOpenDetalhes(pedido)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-xs font-bold text-white transition-colors shadow-xs"
                  >
                    <Package className="h-3.5 w-3.5" />
                    <span>Detalhes</span>
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal de Detalhes do Pedido */}
      {selectedPedido && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4">
          <div className="w-full max-w-xl max-h-[90vh] flex flex-col rounded-3xl bg-white shadow-2xl overflow-hidden">
            {/* Header Modal */}
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Pedido #{selectedPedido.numero || selectedPedido.id.slice(0, 8)}
                </h3>
                <p className="text-xs text-slate-400">
                  {new Date(selectedPedido.created_at).toLocaleString('pt-BR')}
                </p>
              </div>
              <button
                onClick={() => setSelectedPedido(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Corpo dos Detalhes */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {/* Cliente */}
              <div className="rounded-xl bg-slate-50 p-3">
                <span className="text-[10px] uppercase font-bold text-slate-400">Cliente</span>
                <p className="text-sm font-bold text-slate-900">{selectedPedido.cliente_nome || 'Cliente'}</p>
                {selectedPedido.observacao && (
                  <p className="text-xs text-slate-500 mt-1 italic">Obs: {selectedPedido.observacao}</p>
                )}
              </div>

              {/* Itens */}
              <div>
                <span className="text-xs font-bold text-slate-700">Itens do Pedido</span>
                {loadingDetalhes ? (
                  <div className="py-6 text-center text-xs text-slate-400">
                    <Loader2 className="h-5 w-5 animate-spin mx-auto text-teal-600 mb-1" />
                    Carregando itens...
                  </div>
                ) : selectedPedido.itens && selectedPedido.itens.length > 0 ? (
                  <div className="mt-2 divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden">
                    {selectedPedido.itens.map((it) => (
                      <div key={it.id || it.produto_id} className="p-3 flex items-center justify-between text-xs">
                        <div className="min-w-0 flex-1 pr-3">
                          <p className="font-bold text-slate-800 truncate">{it.nome_produto}</p>
                          <p className="text-slate-400 text-[10px]">
                            {it.quantidade} {it.unidade || 'UN'} x R$ {it.preco_unitario_cobrado.toFixed(2)}
                            {it.desconto_pct > 0 && <span className="text-teal-600 ml-1">(-{it.desconto_pct}%)</span>}
                          </p>
                        </div>
                        <span className="font-bold text-slate-900">
                          R$ {it.valor_total.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 py-3 italic">Itens consolidados no ERP.</p>
                )}
              </div>

              {/* Totalizador */}
              <div className="rounded-2xl bg-teal-50/80 border border-teal-100 p-4 space-y-1 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal</span>
                  <span>R$ {Number(selectedPedido.subtotal).toFixed(2)}</span>
                </div>
                {selectedPedido.desconto_total > 0 && (
                  <div className="flex justify-between text-teal-700 font-bold">
                    <span>Desconto Total</span>
                    <span>- R$ {Number(selectedPedido.desconto_total).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-black text-slate-900 pt-1 border-t border-teal-200">
                  <span>Valor Total</span>
                  <span className="text-teal-700">R$ {Number(selectedPedido.valor_total).toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Rodapé Modal */}
            <div className="flex items-center justify-end gap-2 border-t border-slate-100 p-4">
              <button
                onClick={() => handleCompartilharWhatsApp(selectedPedido)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                <Share2 className="h-4 w-4 text-emerald-600" />
                <span>Enviar WhatsApp</span>
              </button>
              <button
                onClick={() => handleGerarPDF(selectedPedido)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 text-white text-xs font-bold hover:bg-teal-700 shadow-md"
              >
                <FileDown className="h-4 w-4" />
                <span>Baixar PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
