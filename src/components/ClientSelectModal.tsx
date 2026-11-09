import React, { useState, useMemo } from 'react'
import { X, Search, Check, AlertTriangle, Plus, ShoppingBag } from 'lucide-react'
import type { Cliente } from '../types'

interface ClientSelectModalProps {
  isOpen: boolean
  onClose: () => void
  clientes: Cliente[]
  selectedCliente: Cliente | null
  onSelect: (cliente: Cliente) => void
  onNewClient?: () => void
}

export const ClientSelectModal: React.FC<ClientSelectModalProps> = ({
  isOpen,
  onClose,
  clientes,
  selectedCliente,
  onSelect,
  onNewClient,
}) => {
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    if (!search.trim()) return clientes.slice(0, 80)
    const term = search.toLowerCase().trim()
    return clientes
      .filter(
        (c) =>
          c.razao_social.toLowerCase().includes(term) ||
          (c.nome_fantasia && c.nome_fantasia.toLowerCase().includes(term)) ||
          c.cpf_cnpj.includes(term) ||
          (c.cidade && c.cidade.toLowerCase().includes(term))
      )
      .slice(0, 80)
  }, [clientes, search])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs" onClick={onClose} />

      {/* Modal (Bottom sheet no mobile, centralizado no desktop) */}
      <div className="relative z-10 flex h-[86dvh] sm:h-[82vh] w-full max-w-lg flex-col rounded-t-3xl sm:rounded-3xl bg-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-[#0F3C46] px-4 py-3.5 sm:px-5 sm:py-4 text-white shrink-0">
          <div>
            <h2 className="text-sm sm:text-base font-bold">Selecionar Cliente</h2>
            <p className="text-[11px] text-teal-200">{clientes.length} clientes na carteira</p>
          </div>
          <div className="flex items-center gap-2">
            {onNewClient && (
              <button
                type="button"
                onClick={() => {
                  onClose()
                  onNewClient()
                }}
                className="flex items-center gap-1 rounded-xl bg-teal-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-teal-400 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Novo Cliente</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl bg-white/10 p-2 text-white hover:bg-white/20"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Busca */}
        <div className="border-b border-slate-200 p-3 bg-slate-50 shrink-0">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por razão social, nome fantasia, CNPJ ou cidade..."
              className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-8 text-xs sm:text-sm outline-none focus:border-teal-500"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Lista */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-slate-400 space-y-2">
              <p className="text-xs">Nenhum cliente encontrado com "{search}".</p>
              {onNewClient && (
                <button
                  type="button"
                  onClick={() => {
                    onClose()
                    onNewClient()
                  }}
                  className="inline-flex items-center gap-1 rounded-xl bg-teal-600 px-4 py-2 text-xs font-bold text-white"
                >
                  <Plus className="h-4 w-4" /> Cadastrar Novo Cliente
                </button>
              )}
            </div>
          ) : (
            filtered.map((c) => {
              const isSelected = selectedCliente?.id === c.id
              return (
                <button
                  type="button"
                  key={c.id}
                  onClick={() => {
                    onSelect(c)
                    onClose()
                  }}
                  className={`w-full text-left cursor-pointer rounded-xl p-3 transition-colors flex items-center justify-between gap-3 ${
                    isSelected ? 'bg-teal-50 border border-teal-300' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-xs font-bold text-slate-900">{c.razao_social}</p>
                      {c.bloqueado && (
                        <span className="shrink-0 flex items-center gap-1 rounded bg-rose-100 px-1.5 py-0.5 text-[9px] font-bold text-rose-700">
                          <AlertTriangle className="h-2.5 w-2.5" /> Bloqueado
                        </span>
                      )}
                    </div>
                    {c.nome_fantasia && c.nome_fantasia !== c.razao_social && (
                      <p className="truncate text-[11px] text-slate-600">{c.nome_fantasia}</p>
                    )}
                    <div className="flex items-center gap-2 flex-wrap text-[10px] text-slate-400 mt-0.5">
                      <span className="font-mono">{c.cpf_cnpj}</span>
                      {c.cidade && (
                        <span>
                          • {c.cidade}/{c.estado}
                        </span>
                      )}
                      {c.total_pedidos && c.total_pedidos > 0 ? (
                        <span className="text-teal-700 font-semibold inline-flex items-center gap-0.5">
                          • <ShoppingBag className="h-2.5 w-2.5" /> {c.total_pedidos} ped.
                        </span>
                      ) : null}
                    </div>
                  </div>

                  {isSelected && (
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-teal-600 text-white shrink-0">
                      <Check className="h-3.5 w-3.5" />
                    </div>
                  )}
                </button>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
