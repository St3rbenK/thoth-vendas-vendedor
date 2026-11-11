import React, { useState } from 'react'
import { Package, Minus, Plus, ShoppingCart, Check, X, Info } from 'lucide-react'
import type { Produto, TabelaPreco } from '../types'

interface ProductCardProps {
  produto: Produto
  tabelas: TabelaPreco[]
  tabelaAtivaId?: string
  cartQty?: number
  viewMode?: 'grid' | 'list'
  bloquearSemEstoque?: boolean
  onAddToCart: (produto: Produto, quantidade: number, tabelaId?: string) => void
}

export const ProductCard: React.FC<ProductCardProps> = ({
  produto,
  tabelas,
  tabelaAtivaId,
  cartQty = 0,
  viewMode = 'grid',
  bloquearSemEstoque = false,
  onAddToCart,
}) => {
  const [qty, setQty] = useState<number>(1)
  const [detailOpen, setDetailOpen] = useState(false)

  const precoBase = Number(produto.preco_tabela) || 0
  const tabela = tabelas.find((t) => t.id === tabelaAtivaId)
  let precoEfetivo = precoBase
  if (tabela) {
    if (tabela.tipo_ajuste === 'acrescimo_pct') {
      precoEfetivo = precoBase * (1 + tabela.percentual_ajuste / 100)
    } else if (tabela.tipo_ajuste === 'desconto_pct') {
      precoEfetivo = precoBase * (1 - tabela.percentual_ajuste / 100)
    }
  }

  const semEstoque = (produto.estoque_atual || 0) <= 0
  const bloqueado = bloquearSemEstoque && semEstoque
  const precoFmt = precoEfetivo.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  const subtotalLinha = (precoEfetivo * qty).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  const handleDec = () => setQty((prev) => Math.max(1, prev - 1))
  const handleInc = () => setQty((prev) => prev + 1)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10)
    if (!isNaN(val) && val >= 1) {
      setQty(val)
    } else if (e.target.value === '') {
      setQty(1)
    }
  }

  const handleAdd = () => {
    if (bloqueado) return
    onAddToCart(produto, qty, tabelaAtivaId || undefined)
    setQty(1)
  }

  const stockBadgeClass = !semEstoque
    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20'
    : bloquearSemEstoque
    ? 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20'
    : 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20'

  const detailModal = detailOpen && (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4"
      onClick={() => setDetailOpen(false)}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800 px-4 py-3">
          <span className="rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-xs font-mono tabular-nums font-bold text-slate-700 dark:text-slate-200">
            #{produto.codigo}
          </span>
          <button
            type="button"
            onClick={() => setDetailOpen(false)}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Fechar detalhes"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-4 space-y-3">
          <div className="flex gap-3">
            <div className="relative h-20 w-20 shrink-0 rounded-xl bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 flex items-center justify-center overflow-hidden">
              <Package className="h-8 w-8 text-slate-300 dark:text-slate-600" />
              {produto.imagem_url && (
                <img
                  src={produto.imagem_url}
                  alt={produto.nome}
                  className="relative z-10 h-full w-full object-contain p-1"
                  onError={(e) => {
                    ;(e.target as HTMLImageElement).style.display = 'none'
                  }}
                />
              )}
            </div>
            <div className="min-w-0 flex-1">
              {produto.categoria_nome && (
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[#00A19C]">
                  {produto.categoria_nome}
                </span>
              )}
              <h3 className="font-display text-sm font-bold text-slate-900 dark:text-white leading-snug">
                {produto.nome}
              </h3>
              <p className="mt-1 font-mono tabular-nums text-lg font-bold text-[#00A19C]">
                {precoBase > 0 ? precoFmt : 'Sob consulta'}
                <span className="text-xs font-normal text-slate-400"> /{produto.unidade}</span>
              </p>
            </div>
          </div>

          {produto.descricao && (
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-[#F8FAFC] dark:bg-slate-800/50 rounded-xl p-3 border border-slate-200/80 dark:border-slate-800">
              {produto.descricao}
            </p>
          )}

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 p-2.5">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 block">Estoque Atual</span>
              <span className="font-mono tabular-nums font-bold text-slate-900 dark:text-white">
                {produto.estoque_atual} {produto.unidade}
              </span>
            </div>
            <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 p-2.5">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 block">Reservado</span>
              <span className="font-mono tabular-nums font-bold text-slate-900 dark:text-white">
                {produto.estoque_reservado || 0} {produto.unidade}
              </span>
            </div>
            {produto.codigo_barras && (
              <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 p-2.5">
                <span className="text-[10px] uppercase tracking-wider text-slate-400 block">EAN / Barras</span>
                <span className="font-mono tabular-nums font-semibold text-slate-700 dark:text-slate-300">
                  {produto.codigo_barras}
                </span>
              </div>
            )}
            {produto.ncm && (
              <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 p-2.5">
                <span className="text-[10px] uppercase tracking-wider text-slate-400 block">NCM</span>
                <span className="font-mono tabular-nums font-semibold text-slate-700 dark:text-slate-300">
                  {produto.ncm}
                </span>
              </div>
            )}
          </div>

          <button
            type="button"
            disabled={bloqueado}
            onClick={() => {
              handleAdd()
              setDetailOpen(false)
            }}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#00A19C] hover:bg-[#008C87] py-2.5 text-xs font-semibold text-white transition-colors disabled:opacity-50"
          >
            <ShoppingCart className="h-4 w-4" />
            <span>{bloqueado ? 'Produto sem estoque' : `Adicionar ${qty} ${produto.unidade} ao pedido`}</span>
          </button>
        </div>
      </div>
    </div>
  )

  if (viewMode === 'list') {
    return (
      <>
        <div
          className={`flex items-center gap-2.5 sm:gap-4 rounded-xl bg-white dark:bg-slate-900 p-2.5 sm:p-3.5 shadow-xs transition-all border ${
            cartQty > 0
              ? 'border-[#00A19C] ring-1 ring-[#00A19C]/30 bg-teal-50/20 dark:bg-[#00A19C]/5'
              : 'border-slate-200/80 dark:border-slate-800 hover:border-[#00A19C]/50'
          }`}
        >
          {/* Miniatura */}
          <button
            type="button"
            onClick={() => setDetailOpen(true)}
            className="relative h-14 w-14 sm:h-16 sm:w-16 shrink-0 overflow-hidden rounded-xl bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700 flex items-center justify-center"
            title="Ver detalhes do produto"
          >
            <Package className="h-6 w-6 text-slate-300 dark:text-slate-600 absolute" />
            {produto.imagem_url && (
              <img
                src={produto.imagem_url}
                alt={produto.nome}
                loading="lazy"
                className="relative z-10 h-full w-full object-contain p-1"
                onError={(e) => {
                  ;(e.target as HTMLImageElement).style.display = 'none'
                }}
              />
            )}
          </button>

          {/* Dados do Produto */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="rounded-md bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 text-[10px] font-mono tabular-nums font-bold text-slate-700 dark:text-slate-300">
                #{produto.codigo}
              </span>
              <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-mono tabular-nums font-semibold ${stockBadgeClass}`}>
                {!semEstoque ? `Est: ${produto.estoque_atual} ${produto.unidade}` : 'Sem estoque'}
              </span>
              {cartQty > 0 && (
                <span className="rounded-full bg-[#00A19C] px-2 py-0.5 text-[10px] font-mono tabular-nums font-bold text-white flex items-center gap-0.5">
                  <Check className="h-2.5 w-2.5" /> {cartQty}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => setDetailOpen(true)}
              className="mt-0.5 line-clamp-1 text-left text-xs sm:text-sm font-semibold text-slate-900 dark:text-white hover:text-[#00A19C] transition-colors"
            >
              {produto.nome}
            </button>
            <div className="mt-0.5 flex items-baseline gap-1.5">
              <span className="font-mono tabular-nums text-sm sm:text-base font-bold text-[#00A19C]">
                {precoBase > 0 ? precoFmt : 'Sob consulta'}
              </span>
              <span className="text-[10px] text-slate-400">/{produto.unidade}</span>
            </div>
          </div>

          {/* Controles Rápidos */}
          <div className="flex items-center gap-1.5 shrink-0">
            <div className="flex items-center rounded-xl bg-[#F8FAFC] dark:bg-slate-800 p-0.5 border border-slate-200/80 dark:border-slate-700">
              <button
                type="button"
                onClick={handleDec}
                className="flex h-8 w-7 sm:w-8 items-center justify-center rounded-lg text-slate-600 dark:text-slate-300 active:bg-slate-200 dark:active:bg-slate-700"
                aria-label="Diminuir"
              >
                <Minus className="h-3.5 w-3.5" />
              </button>
              <input
                type="number"
                min="1"
                max="9999"
                value={qty}
                onChange={handleInputChange}
                inputMode="numeric"
                className="h-8 w-9 sm:w-11 bg-transparent text-center font-mono tabular-nums text-xs font-bold text-slate-900 dark:text-white focus:outline-none"
              />
              <button
                type="button"
                onClick={handleInc}
                className="flex h-8 w-7 sm:w-8 items-center justify-center rounded-lg text-slate-600 dark:text-slate-300 active:bg-slate-200 dark:active:bg-slate-700"
                aria-label="Aumentar"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>

            <button
              type="button"
              disabled={bloqueado}
              onClick={handleAdd}
              className="flex h-9 items-center justify-center gap-1 rounded-xl bg-[#00A19C] px-3 text-xs font-semibold text-white shadow-xs active:scale-95 hover:bg-[#008C87] disabled:opacity-45 disabled:cursor-not-allowed"
            >
              <ShoppingCart className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{bloqueado ? 'Indisponível' : 'Adicionar'}</span>
            </button>
          </div>
        </div>
        {detailModal}
      </>
    )
  }

  return (
    <>
      <article
        className={`group flex h-full flex-col overflow-hidden rounded-xl bg-white dark:bg-slate-900 shadow-xs transition-all duration-200 hover:shadow-md border ${
          cartQty > 0
            ? 'border-[#00A19C] ring-1 ring-[#00A19C]/40'
            : 'border-slate-200/80 dark:border-slate-800 hover:border-[#00A19C]/50'
        }`}
      >
        {/* Imagem do Produto */}
        <button
          type="button"
          onClick={() => setDetailOpen(true)}
          className="relative aspect-4/3 sm:aspect-square overflow-hidden bg-[#F8FAFC] dark:bg-slate-800/50 p-2.5 text-left w-full"
          title="Ver detalhes do produto"
        >
          <div className="absolute inset-0 flex items-center justify-center text-slate-300 dark:text-slate-700">
            <Package className="h-10 w-10" />
          </div>
          {produto.imagem_url ? (
            <img
              src={produto.imagem_url}
              alt={produto.nome}
              loading="lazy"
              className="relative z-10 h-full w-full object-contain drop-shadow-2xs transition-transform duration-300 group-hover:scale-105"
              onError={(e) => {
                ;(e.target as HTMLImageElement).style.display = 'none'
              }}
            />
          ) : null}

          <span className="absolute left-2 top-2 z-20 rounded-md bg-slate-900/80 dark:bg-slate-950/90 px-1.5 py-0.5 text-[10px] font-mono tabular-nums font-semibold text-white">
            #{produto.codigo}
          </span>
          <span className={`absolute right-2 top-2 z-20 rounded-md px-1.5 py-0.5 text-[10px] font-mono tabular-nums font-semibold ${stockBadgeClass}`}>
            {!semEstoque ? `${produto.estoque_atual} ${produto.unidade}` : 'S/ est.'}
          </span>

          {(produto.descricao || produto.ncm || produto.codigo_barras) && (
            <span className="absolute bottom-2 right-2 z-20 flex h-5 w-5 items-center justify-center rounded-full bg-white/90 dark:bg-slate-800/90 text-slate-500 border border-slate-200/80 dark:border-slate-700 opacity-0 group-hover:opacity-100 transition-opacity">
              <Info className="h-3 w-3" />
            </span>
          )}

          {cartQty > 0 && (
            <span className="absolute bottom-2 left-2 right-2 z-20 flex items-center justify-center gap-1 rounded-lg bg-[#00A19C]/95 py-0.5 px-2 font-mono tabular-nums text-[10px] font-bold text-white shadow-sm">
              <Check className="h-3 w-3" /> No pedido: {cartQty} {produto.unidade}
            </span>
          )}
        </button>

        {/* Conteúdo */}
        <div className="flex flex-1 flex-col border-t border-slate-200/80 dark:border-slate-800 p-2.5 sm:p-3.5">
          <button
            type="button"
            onClick={() => setDetailOpen(true)}
            className="line-clamp-2 min-h-[2.25rem] text-left text-xs font-semibold leading-snug text-slate-900 dark:text-white hover:text-[#00A19C] transition-colors"
          >
            {produto.nome}
          </button>

          {/* Preço em Destaque */}
          <div className="mt-1.5 flex items-baseline justify-between gap-1">
            <p className="font-mono tabular-nums text-sm sm:text-base font-bold tracking-tight text-[#00A19C] truncate">
              {precoBase > 0 ? precoFmt : 'Sob consulta'}
            </p>
            <span className="text-[10px] font-medium text-slate-400 shrink-0">/{produto.unidade}</span>
          </div>

          {/* Controles */}
          <div className="mt-auto pt-2.5 space-y-1.5">
            <div className="flex items-center justify-between rounded-xl bg-[#F8FAFC] dark:bg-slate-800 p-0.5 border border-slate-200/80 dark:border-slate-700">
              <button
                type="button"
                onClick={handleDec}
                className="flex h-8 w-8 sm:w-9 items-center justify-center rounded-lg text-slate-600 dark:text-slate-300 active:bg-slate-200 dark:active:bg-slate-700 transition-colors"
                aria-label="Diminuir quantidade"
              >
                <Minus className="h-3.5 w-3.5" />
              </button>
              <input
                type="number"
                min="1"
                max="9999"
                value={qty}
                onChange={handleInputChange}
                inputMode="numeric"
                aria-label="Quantidade"
                className="h-8 w-12 bg-transparent text-center font-mono tabular-nums text-xs font-bold text-slate-900 dark:text-white focus:outline-none"
              />
              <button
                type="button"
                onClick={handleInc}
                className="flex h-8 w-8 sm:w-9 items-center justify-center rounded-lg text-slate-600 dark:text-slate-300 active:bg-slate-200 dark:active:bg-slate-700 transition-colors"
                aria-label="Aumentar quantidade"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>

            <button
              type="button"
              disabled={bloqueado}
              onClick={handleAdd}
              className="flex h-9 sm:h-10 w-full items-center justify-center gap-1 rounded-xl bg-[#00A19C] px-2 text-[11px] sm:text-xs font-semibold text-white shadow-xs transition-all active:scale-[0.98] hover:bg-[#008C87] disabled:opacity-45 disabled:cursor-not-allowed truncate"
            >
              <ShoppingCart className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate font-mono tabular-nums">
                {bloqueado
                  ? 'Sem estoque'
                  : qty > 1
                  ? `Adicionar (${subtotalLinha})`
                  : 'Adicionar'}
              </span>
            </button>
          </div>
        </div>
      </article>
      {detailModal}
    </>
  )
}
