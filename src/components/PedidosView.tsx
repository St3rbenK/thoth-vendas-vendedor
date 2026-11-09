import React, { useState, useEffect, useMemo } from 'react'
import {
  ClipboardList,
  Search,
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
  Bookmark,
  Send,
  Edit3,
  Trash2,
  RotateCcw,
} from 'lucide-react'
import {
  getPedidos,
  getPedidoDetalhes,
  converterOrcamentoNoServidor,
  removerOrcamento,
  enviarPedido,
} from '../services/api'
import type { Pedido, OrcamentoSalvo } from '../types'
import { formatarWhatsApp, abrirWhatsApp, gerarPdfPedido } from '../services/share'
import jsPDF from 'jspdf'

interface PedidosViewProps {
  empresaNome: string
  orcamentosLocais: OrcamentoSalvo[]
  onRefreshOrcamentos: () => void
  onRestoreOrcamento: (orc: OrcamentoSalvo) => void
  initialFilter?: string
}

export function PedidosView({
  empresaNome,
  orcamentosLocais,
  onRefreshOrcamentos,
  onRestoreOrcamento,
  initialFilter = 'todos',
}: PedidosViewProps) {
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>(initialFilter)
  const [search, setSearch] = useState('')
  const [selectedPedido, setSelectedPedido] = useState<Pedido | null>(null)
  const [loadingDetalhes, setLoadingDetalhes] = useState(false)
  const [convertingId, setConvertingId] = useState<string | null>(null)

  const carregarPedidos = async (status?: string) => {
    setLoading(true)
    try {
      const apiStatus = status === 'orcamentos' ? 'orcamento' : status
      const data = await getPedidos(apiStatus)
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

  const handleConverterOrcamentoLocal = async (orc: OrcamentoSalvo) => {
    if (!orc.cliente?.id) {
      alert('Para transmitir como pedido, reabra o orçamento no carrinho e selecione um cliente.')
      onRestoreOrcamento(orc)
      return
    }
    if (!confirm(`Deseja converter o orçamento ${orc.numero} em Pedido e transmitir ao ERP?`)) {
      return
    }

    setConvertingId(orc.id)
    try {
      if (orc.pedidoId) {
        await converterOrcamentoNoServidor(orc.pedidoId)
      } else {
        await enviarPedido({
          clienteId: orc.cliente.id,
          tabelaPrecoId: orc.tabelaPrecoId,
          condicaoPagamento: orc.condicaoPagamento,
          status: 'pendente',
          observacoes: `[Condição: ${orc.condicaoPagamento}] ${orc.observacoes || ''}`.trim(),
          itens: orc.itens.map((it) => ({
            produtoId: it.produtoId,
            quantidade: it.quantidade,
            precoUnitario: it.precoUnitarioCobrado,
            descontoPct: it.descontoPct || 0,
          })),
        })
        await removerOrcamento(orc.id, orc.pedidoId)
      }
      onRefreshOrcamentos()
      await carregarPedidos(statusFilter)
      alert('✅ Orçamento convertido em Pedido e transmitido com sucesso!')
    } catch (err: any) {
      alert(`Falha ao converter orçamento: ${err.message || err}`)
    } finally {
      setConvertingId(null)
    }
  }

  const handleConverterOrcamentoServidor = async (p: Pedido) => {
    if (!confirm(`Deseja converter o orçamento #${p.numero} em Pedido e transmitir ao ERP?`)) {
      return
    }
    setConvertingId(p.id)
    try {
      await converterOrcamentoNoServidor(p.id)
      onRefreshOrcamentos()
      await carregarPedidos(statusFilter)
      alert('✅ Orçamento convertido em Pedido e transmitido ao ERP!')
    } catch (err: any) {
      alert(`Falha ao converter orçamento: ${err.message || err}`)
    } finally {
      setConvertingId(null)
    }
  }

  const handleExcluirOrcamentoLocal = async (orc: OrcamentoSalvo) => {
    if (!confirm(`Deseja excluir o orçamento salvo ${orc.numero}?`)) return
    await removerOrcamento(orc.id, orc.pedidoId)
    onRefreshOrcamentos()
    await carregarPedidos(statusFilter)
  }

  const handleCompartilharWhatsApp = (p: Pedido) => {
    const valorFmt = Number(p.valor_total).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    const dataFmt = new Date(p.created_at).toLocaleDateString('pt-BR')
    const tipo = p.status === 'orcamento' ? 'Orçamento' : 'Pedido'
    const texto =
      `*${tipo} #${p.numero || p.id.slice(0, 8)}* - ${empresaNome}\n` +
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
    const titulo = p.status === 'orcamento' ? 'Orçamento Comercial' : 'Comprovante de Pedido de Venda'

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(16)
    doc.text(empresaNome, 14, 20)

    doc.setFontSize(11)
    doc.setFont('helvetica', 'normal')
    doc.text(`${titulo} #${p.numero || p.id.slice(0, 8)}`, 14, 28)
    doc.text(`Data de Emissão: ${dataFmt}`, 14, 34)

    doc.setDrawColor(200, 200, 200)
    doc.line(14, 38, 196, 38)

    doc.setFont('helvetica', 'bold')
    doc.text('Dados do Cliente:', 14, 46)
    doc.setFont('helvetica', 'normal')
    doc.text(`Cliente: ${p.cliente_nome || 'Não informado'}`, 14, 52)

    doc.line(14, 58, 196, 58)

    doc.setFont('helvetica', 'bold')
    doc.text('Itens:', 14, 66)

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
      doc.text('Abra os detalhes do pedido para listar todos os itens.', 14, y)
      y += 10
    }

    doc.line(14, y + 2, 196, y + 2)
    y += 10

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.text(`VALOR TOTAL: ${valorFmt}`, 14, y)

    if (p.observacao) {
      y += 8
      doc.setFontSize(9)
      doc.setFont('helvetica', 'italic')
      doc.text(`Observações: ${p.observacao}`, 14, y)
    }

    doc.save(`${p.status === 'orcamento' ? 'orcamento' : 'pedido'}_${p.numero || p.id.slice(0, 8)}.pdf`)
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
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 border border-emerald-200">
            <CheckCircle className="h-3 w-3" /> Faturado
          </span>
        )
      case 'aprovado':
      case 'enviado':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-bold text-blue-700 border border-blue-200">
            <CheckCircle className="h-3 w-3" /> {status === 'enviado' ? 'Enviado ERP' : 'Aprovado'}
          </span>
        )
      case 'orcamento':
      case 'rascunho':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-bold text-amber-800 border border-amber-300">
            <Bookmark className="h-3 w-3" /> Orçamento Salvo
          </span>
        )
      case 'cancelado':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-[11px] font-bold text-rose-700 border border-rose-200">
            <AlertCircle className="h-3 w-3" /> Cancelado
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-bold text-amber-700 border border-amber-200">
            <Clock className="h-3 w-3" /> Pendente
          </span>
        )
    }
  }

  const fmtBRL = (val: number) => Number(val || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  return (
    <div className="mx-auto max-w-5xl w-full px-3 py-4 sm:px-6 sm:py-6 space-y-5">
      {/* Título e Busca */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <ClipboardList className="h-5 w-5 sm:h-6 sm:w-6 text-teal-600 shrink-0" />
            <span>Pedidos & Orçamentos</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Gerencie seus orçamentos salvos e acompanhe o faturamento dos pedidos emitidos
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar pedido ou cliente..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 placeholder-slate-400 focus:outline-teal-500"
          />
        </div>
      </div>

      {/* Seção Destacada: Orçamentos Salvos no Dispositivo / Nuvem */}
      {orcamentosLocais.length > 0 && (statusFilter === 'todos' || statusFilter === 'orcamentos') && (
        <div className="rounded-3xl border-2 border-amber-300/80 bg-amber-50/60 p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-400 text-slate-950 font-black">
                <Bookmark className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900">
                  Orçamentos Salvos ({orcamentosLocais.length})
                </h3>
                <p className="text-[11px] text-slate-600">
                  Reabra no carrinho para editar descontos/itens ou transmita direto como pedido
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {orcamentosLocais.map((orc) => (
              <div
                key={orc.id}
                className="rounded-2xl border border-amber-200 bg-white p-3.5 shadow-xs flex flex-col justify-between gap-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-mono font-black text-amber-900 bg-amber-100 px-2 py-0.5 rounded-md">
                        {orc.numero}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {new Date(orc.createdAt).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <p className="mt-1.5 text-xs font-bold text-slate-900 truncate">
                      👤 {orc.cliente?.razao_social || 'Cliente ainda não selecionado'}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {orc.itens.length} produto(s) • Condição: {orc.condicaoPagamento}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-[10px] text-slate-400">Valor Líquido</div>
                    <div className="text-base font-black text-teal-800">{fmtBRL(orc.valorTotal)}</div>
                    {orc.descontoTotal > 0 && (
                      <div className="text-[10px] font-bold text-emerald-600">
                        Desc: -{fmtBRL(orc.descontoTotal)}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-1.5 pt-2.5 border-t border-slate-100">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        const txt = formatarWhatsApp(
                          orc.cliente,
                          orc.itens,
                          orc.condicaoPagamento,
                          orc.valorTotal,
                          orc.observacoes
                        )
                        abrirWhatsApp(orc.cliente?.telefone || orc.cliente?.celular, txt)
                      }}
                      className="p-1.5 rounded-lg border border-slate-200 text-emerald-700 hover:bg-emerald-50 text-xs"
                      title="Enviar Orçamento por WhatsApp"
                    >
                      <Share2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        gerarPdfPedido(
                          orc.cliente,
                          orc.itens,
                          orc.condicaoPagamento,
                          orc.valorTotal,
                          orc.observacoes
                        )
                      }
                      className="p-1.5 rounded-lg border border-slate-200 text-teal-700 hover:bg-teal-50 text-xs"
                      title="Baixar PDF do Orçamento"
                    >
                      <FileDown className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleExcluirOrcamentoLocal(orc)}
                      className="p-1.5 rounded-lg border border-slate-200 text-rose-600 hover:bg-rose-50 text-xs"
                      title="Excluir Orçamento"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => onRestoreOrcamento(orc)}
                      className="flex items-center gap-1 rounded-xl border border-teal-600 bg-teal-50 px-2.5 py-1.5 text-xs font-bold text-teal-900 hover:bg-teal-100 transition-colors"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                      <span>Abrir no Carrinho</span>
                    </button>
                    <button
                      type="button"
                      disabled={convertingId === orc.id}
                      onClick={() => handleConverterOrcamentoLocal(orc)}
                      className="flex items-center gap-1 rounded-xl bg-teal-700 px-3 py-1.5 text-xs font-bold text-white hover:bg-teal-600 shadow-2xs disabled:opacity-50"
                    >
                      <Send className="h-3.5 w-3.5" />
                      <span>{convertingId === orc.id ? 'Enviando...' : 'Virar Pedido'}</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filtros de Status */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
        {[
          { id: 'todos', label: 'Todos' },
          { id: 'orcamentos', label: `Orçamentos (${orcamentosLocais.length})` },
          { id: 'pendente', label: 'Pendentes' },
          { id: 'aprovado', label: 'Aprovados' },
          { id: 'faturado', label: 'Faturados' },
          { id: 'cancelado', label: 'Cancelados' },
        ].map((tab) => (
          <button
            type="button"
            key={tab.id}
            onClick={() => setStatusFilter(tab.id)}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${
              statusFilter === tab.id
                ? 'bg-teal-600 text-white shadow-2xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Lista de Pedidos do Servidor */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 text-slate-400">
          <Loader2 className="h-8 w-8 animate-spin text-teal-600 mb-2" />
          <p className="text-xs">Carregando histórico de pedidos...</p>
        </div>
      ) : filteredPedidos.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-white py-14 text-center px-4">
          <ClipboardList className="h-10 w-10 text-slate-300 mb-2" />
          <p className="text-sm font-bold text-slate-700">Nenhum registro encontrado neste filtro</p>
          <p className="text-xs text-slate-400 mt-1">
            {search ? 'Tente buscar por outro termo' : 'Os pedidos e orçamentos sincronizados aparecerão aqui'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredPedidos.map((pedido) => {
            const valorTotalFmt = fmtBRL(pedido.valor_total)
            const dataFmt = new Date(pedido.created_at).toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })

            return (
              <div
                key={pedido.id}
                className="rounded-2xl border border-slate-200/80 bg-white p-3.5 sm:p-4 shadow-2xs hover:border-teal-500/50 transition-all"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-mono font-black text-slate-900">
                        #{pedido.numero || pedido.id.slice(0, 8)}
                      </span>
                      {getStatusBadge(pedido.status)}
                    </div>
                    <div className="mt-1.5 flex items-center gap-1.5 text-xs sm:text-sm font-bold text-slate-800">
                      <User className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{pedido.cliente_nome || 'Cliente não identificado'}</span>
                    </div>
                    <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-slate-400">
                      <Calendar className="h-3 w-3 shrink-0" />
                      <span>{dataFmt}</span>
                      {pedido.desconto_total > 0 && (
                        <span className="text-emerald-600 font-semibold">
                          • Desc: -{fmtBRL(pedido.desconto_total)}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-[10px] text-slate-400">Total</div>
                    <div className="text-base sm:text-lg font-black text-teal-700">{valorTotalFmt}</div>
                  </div>
                </div>

                {/* Ações do Card */}
                <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-end gap-1.5 sm:gap-2">
                  {pedido.status === 'orcamento' && (
                    <button
                      type="button"
                      disabled={convertingId === pedido.id}
                      onClick={() => handleConverterOrcamentoServidor(pedido)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-xs font-bold text-slate-950 transition-colors"
                    >
                      <Send className="h-3.5 w-3.5" />
                      <span>Converter em Pedido</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleCompartilharWhatsApp(pedido)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <Share2 className="h-3.5 w-3.5 text-emerald-600" />
                    <span>WhatsApp</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleGerarPDF(pedido)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <FileDown className="h-3.5 w-3.5 text-teal-600" />
                    <span>PDF</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenDetalhes(pedido)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-xs font-bold text-white transition-colors shadow-2xs"
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
          <div className="w-full max-w-xl max-h-[88dvh] flex flex-col rounded-3xl bg-white shadow-2xl overflow-hidden">
            {/* Header Modal */}
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3.5 sm:px-5 sm:py-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm sm:text-base font-bold text-slate-900">
                    #{selectedPedido.numero || selectedPedido.id.slice(0, 8)}
                  </h3>
                  {getStatusBadge(selectedPedido.status)}
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {new Date(selectedPedido.created_at).toLocaleString('pt-BR')}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPedido(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Corpo dos Detalhes */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
              <div className="rounded-xl bg-slate-50 p-3">
                <span className="text-[10px] uppercase font-bold text-slate-400">Cliente</span>
                <p className="text-xs sm:text-sm font-bold text-slate-900">
                  {selectedPedido.cliente_nome || 'Cliente'}
                </p>
                {selectedPedido.observacao && (
                  <p className="text-xs text-slate-500 mt-1 italic">Obs: {selectedPedido.observacao}</p>
                )}
              </div>

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
                      <div
                        key={it.id || it.produto_id}
                        className="p-3 flex items-center justify-between gap-2 text-xs"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-slate-800 truncate">{it.nome_produto}</p>
                          <p className="text-slate-400 text-[10px]">
                            {it.quantidade} {it.unidade || 'UN'} x {fmtBRL(it.preco_unitario_cobrado)}
                            {it.desconto_pct > 0 && (
                              <span className="text-teal-600 ml-1">(-{it.desconto_pct.toFixed(1)}%)</span>
                            )}
                          </p>
                        </div>
                        <span className="font-bold text-slate-900 shrink-0">{fmtBRL(it.valor_total)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 py-3 italic">Itens consolidados no ERP.</p>
                )}
              </div>

              <div className="rounded-2xl bg-teal-50/80 border border-teal-100 p-3.5 space-y-1 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal</span>
                  <span>{fmtBRL(selectedPedido.subtotal)}</span>
                </div>
                {selectedPedido.desconto_total > 0 && (
                  <div className="flex justify-between text-teal-700 font-bold">
                    <span>Desconto Total</span>
                    <span>- {fmtBRL(selectedPedido.desconto_total)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-black text-slate-900 pt-1 border-t border-teal-200">
                  <span>Valor Total</span>
                  <span className="text-teal-700">{fmtBRL(selectedPedido.valor_total)}</span>
                </div>
              </div>
            </div>

            {/* Rodapé Modal */}
            <div className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-100 p-3.5 sm:p-4">
              {selectedPedido.itens && selectedPedido.itens.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    onRestoreOrcamento({
                      id: `rep_${Date.now()}`,
                      numero: `REP-${selectedPedido.numero}`,
                      cliente: {
                        id: selectedPedido.cliente_id,
                        razao_social: selectedPedido.cliente_nome || 'Cliente',
                        cpf_cnpj: '',
                        limite_credito: 0,
                        saldo_devedor: 0,
                        bloqueado: false,
                      },
                      condicaoPagamento: selectedPedido.condicao_pagamento || 'À Vista',
                      observacoes: selectedPedido.observacao || '',
                      itens: (selectedPedido.itens || []).map((i) => ({
                        produtoId: i.produto_id,
                        codigo: i.codigo_produto || '',
                        nome: i.nome_produto || '',
                        unidade: i.unidade || 'UN',
                        quantidade: i.quantidade,
                        precoUnitarioTabela: i.preco_unitario_tabela,
                        precoUnitarioCobrado: i.preco_unitario_tabela,
                        descontoPct: i.desconto_pct || 0,
                        subtotal: i.valor_total,
                      })),
                      subtotal: selectedPedido.subtotal,
                      descontoTotal: selectedPedido.desconto_total,
                      valorTotal: selectedPedido.valor_total,
                      createdAt: new Date().toISOString(),
                      updatedAt: new Date().toISOString(),
                    })
                    setSelectedPedido(null)
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-teal-600 text-xs font-bold text-teal-800 hover:bg-teal-50"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Repetir no Carrinho</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => handleCompartilharWhatsApp(selectedPedido)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                <Share2 className="h-3.5 w-3.5 text-emerald-600" />
                <span>WhatsApp</span>
              </button>
              <button
                type="button"
                onClick={() => handleGerarPDF(selectedPedido)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-600 text-white text-xs font-bold hover:bg-teal-700 shadow-xs"
              >
                <FileDown className="h-3.5 w-3.5" />
                <span>Baixar PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
