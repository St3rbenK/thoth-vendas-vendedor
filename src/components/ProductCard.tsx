import React, { useState } from 'react'
import { Package, Minus, Plus, ShoppingCart, Check } from 'lucide-react'
import type { Produto, TabelaPreco } from '../types'

interface ProductCardProps {
  produto: Produto
  tabelas: TabelaPreco[]
  tabelaAtivaId?: string
  cartQty?: number
  viewMode?: 'grid' | 'list'
  onAddToCart: (produto: Produto, quantidade: number, tabelaId?: string) => void
}

export const ProductCard: React.FC<ProductCardProps> = ({
  produto,
  tabelas,
  tabelaAtivaId,
  cartQty = 0,
  viewMode = 'grid',
  onAddToCart,
}) => {
  const [qty, setQty] = useState<number>(1)

  // Preço calculado de acordo com a tabela ativa do pedido
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
    onAddToCart(produto, qty, tabelaAtivaId || undefined)
    setQty(1)
  }

  // Modo Lista Compacta (Estilo Mercos B2B)
  if (viewMode === 'list') {
    return (
      <div
        className={`flex items-center gap-2.5 sm:gap-4 rounded-2xl bg-white p-2.5 sm:p-3.5 shadow-xs transition-all border ${
          cartQty > 0 ? 'border-teal-500 ring-1 ring-teal-500/30 bg-teal-50/20' : 'border-slate-200/80 hover:border-teal-300'
        }`}
      >
        {/* Miniatura */}
        <div className="relative h-14 w-14 sm:h-16 sm:w-16 shrink-0 overflow-hidden rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center">
          <Package className="h-6 w-6 text-slate-300 absolute" />
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
        </div>

        {/* Dados do Produto */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-mono font-bold text-slate-700">
              #{produto.codigo}
            </span>
            {produto.estoque_atual > 0 ? (
              <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">
                Est: {produto.estoque_atual} {produto.unidade}
              </span>
            ) : (
              <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">
                S/ est.
              </span>
            )}
            {cartQty > 0 && (
              <span className="rounded-full bg-teal-600 px-2 py-0.5 text-[10px] font-bold text-white flex items-center gap-0.5">
                <Check className="h-2.5 w-2.5" /> {cartQty} no pedido
              </span>
            )}
          </div>
          <h3 className="mt-0.5 line-clamp-1 text-xs sm:text-sm font-bold text-slate-900">{produto.nome}</h3>
          <div className="mt-0.5 flex items-baseline gap-1.5">
            <span className="text-sm sm:text-base font-black text-teal-800">
              {precoBase > 0 ? precoFmt : 'Sob consulta'}
            </span>
            <span className="text-[10px] text-slate-400">/{produto.unidade}</span>
          </div>
        </div>

        {/* Controles Rápidos */}
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="flex items-center rounded-xl bg-slate-100 p-0.5 border border-slate-200">
            <button
              type="button"
              onClick={handleDec}
              className="flex h-8 w-7 sm:w-8 items-center justify-center rounded-lg text-slate-700 active:bg-slate-200"
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
              className="h-8 w-9 sm:w-11 bg-transparent text-center text-xs font-bold text-slate-900 focus:outline-none"
            />
            <button
              type="button"
              onClick={handleInc}
              className="flex h-8 w-7 sm:w-8 items-center justify-center rounded-lg text-slate-700 active:bg-slate-200"
              aria-label="Aumentar"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>

          <button
            type="button"
            onClick={handleAdd}
            className="flex h-9 items-center justify-center gap-1 rounded-xl bg-teal-700 px-3 text-xs font-bold text-white shadow-xs active:scale-95 hover:bg-teal-600"
          >
            <ShoppingCart className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Adicionar</span>
          </button>
        </div>
      </div>
    )
  }

  // Modo Grade (Cards)
  return (
    <article
      className={`group flex h-full flex-col overflow-hidden rounded-2xl bg-white shadow-xs transition-all duration-200 hover:shadow-md ${
        cartQty > 0
          ? 'ring-2 ring-teal-500 bg-teal-50/10'
          : 'ring-1 ring-slate-200/80 hover:ring-teal-300'
      }`}
    >
      {/* Imagem do Produto */}
      <div className="relative aspect-4/3 sm:aspect-square overflow-hidden bg-slate-50 p-2.5">
        <div className="absolute inset-0 flex items-center justify-center text-slate-300">
          <Package className="h-10 w-10" />
        </div>
        {produto.imagem_url ? (
          <img
            src={produto.imagem_url}
            alt={produto.nome}
            loading="lazy"
            className="relative z-10 h-full w-full object-contain drop-shadow-xs transition-transform duration-300 group-hover:scale-105"
            onError={(e) => {
              ;(e.target as HTMLImageElement).style.display = 'none'
            }}
          />
        ) : null}

        {/* Badges superiores */}
        <span className="absolute left-2 top-2 z-20 rounded-md bg-slate-900/80 px-1.5 py-0.5 text-[10px] font-mono font-bold text-white">
          #{produto.codigo}
        </span>
        {produto.estoque_atual > 0 ? (
          <span className="absolute right-2 top-2 z-20 rounded-md bg-emerald-50/95 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 ring-1 ring-emerald-200">
            {produto.estoque_atual} {produto.unidade}
          </span>
        ) : (
          <span className="absolute right-2 top-2 z-20 rounded-md bg-amber-50/95 px-1.5 py-0.5 text-[10px] font-bold text-amber-700 ring-1 ring-amber-200">
            S/ est.
          </span>
        )}

        {/* Indicador se já está no pedido */}
        {cartQty > 0 && (
          <span className="absolute bottom-2 left-2 right-2 z-20 flex items-center justify-center gap-1 rounded-lg bg-teal-600/95 py-0.5 px-2 text-[10px] font-black text-white shadow-sm">
            <Check className="h-3 w-3" /> No pedido: {cartQty} {produto.unidade}
          </span>
        )}
      </div>

      {/* Conteúdo */}
      <div className="flex flex-1 flex-col border-t border-slate-100 p-2.5 sm:p-3.5">
        <h2 className="line-clamp-2 min-h-[2.25rem] text-xs font-bold leading-snug text-slate-900">
          {produto.nome}
        </h2>

        {/* Preço em Destaque */}
        <div className="mt-1.5 flex items-baseline justify-between gap-1">
          <p className="text-sm sm:text-base font-black tracking-tight text-teal-800 truncate">
            {precoBase > 0 ? precoFmt : 'Sob consulta'}
          </p>
          <span className="text-[10px] font-semibold text-slate-400 shrink-0">/{produto.unidade}</span>
        </div>

        {/* Controles de Quantidade e Adicionar */}
        <div className="mt-auto pt-2.5 space-y-1.5">
          <div className="flex items-center justify-between rounded-xl bg-slate-100 p-0.5 ring-1 ring-slate-200/70">
            <button
              type="button"
              onClick={handleDec}
              className="flex h-8 w-8 sm:w-9 items-center justify-center rounded-lg text-slate-700 active:bg-slate-200 transition-colors"
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
              className="h-8 w-12 bg-transparent text-center text-xs font-bold text-slate-900 focus:outline-none"
            />
            <button
              type="button"
              onClick={handleInc}
              className="flex h-8 w-8 sm:w-9 items-center justify-center rounded-lg text-slate-700 active:bg-slate-200 transition-colors"
              aria-label="Aumentar quantidade"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>

          <button
            type="button"
            onClick={handleAdd}
            className="flex h-9 sm:h-10 w-full items-center justify-center gap-1 rounded-xl bg-teal-800 px-2 text-[11px] sm:text-xs font-bold text-white shadow-xs transition-all active:scale-[0.98] hover:bg-teal-700 truncate"
          >
            <ShoppingCart className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">
              {qty > 1 ? `Adicionar (${subtotalLinha})` : 'Adicionar'}
            </span>
          </button>
        </div>
      </div>
    </article>
  )
}
