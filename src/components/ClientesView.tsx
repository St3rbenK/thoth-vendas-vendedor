import React, { useMemo, useState } from 'react'
import {
  Users,
  Search,
  X,
  UserPlus,
  RefreshCw,
  ShoppingBag,
  Copy,
  Check,
  MapPin,
  Phone,
  Mail,
  FileText,
  AlertTriangle,
  Pencil,
  ChevronRight,
  User,
  CreditCard,
  Loader2,
} from 'lucide-react'
import { AppLogo } from './AppLogo'
import { getClienteDetalhes } from '../services/api'
import type { Cliente } from '../types'

interface ClientesViewProps {
  clientes: Cliente[]
  selectedCliente: Cliente | null
  isOffline?: boolean
  onRefresh: () => Promise<void> | void
  onNewClient: () => void
  onEditClient: (cliente: Cliente) => void
  onSelectForOrder: (cliente: Cliente) => void
  onClientLoaded?: (cliente: Cliente) => void
  onNotify?: (msg: string) => void
}

type ClientFilter = 'todos' | 'sem_ie' | 'bloqueados'

function formatDoc(doc?: string): string {
  const d = (doc || '').replace(/\D/g, '')
  if (d.length === 11) {
    return d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
  }
  if (d.length === 14) {
    return d.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
  }
  return doc || '—'
}

function formatBRL(v?: number): string {
  return (v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatAddress(c: Cliente): string {
  const street = [c.logradouro, c.numero ? `nº ${c.numero}` : ''].filter(Boolean).join(', ')
  const cityState = c.cidade ? `${c.cidade}${c.estado ? `/${c.estado}` : ''}` : c.estado || ''
  const parts = [
    street,
    c.complemento,
    c.bairro,
    cityState,
    c.cep ? `CEP ${c.cep}` : '',
  ].filter(Boolean)
  return parts.join(' • ')
}

export const ClientesView: React.FC<ClientesViewProps> = ({
  clientes,
  selectedCliente,
  isOffline = false,
  onRefresh,
  onNewClient,
  onEditClient,
  onSelectForOrder,
  onClientLoaded,
  onNotify,
}) => {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<ClientFilter>('todos')
  const [refreshing, setRefreshing] = useState(false)
  const [visibleLimit, setVisibleLimit] = useState(80)
  const [detailCliente, setDetailCliente] = useState<Cliente | null>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [copiedField, setCopiedField] = useState<string | null>(null)

  const handleRefresh = async () => {
    if (refreshing || isOffline) return
    setRefreshing(true)
    try {
      await onRefresh()
      onNotify?.('Lista de clientes atualizada!')
    } catch {
      onNotify?.('Não foi possível atualizar os clientes agora.')
    } finally {
      setRefreshing(false)
    }
  }

  const handleOpenDetail = async (c: Cliente) => {
    setDetailCliente(c)
    if (isOffline) return
    setLoadingDetail(true)
    try {
      const fresh = await getClienteDetalhes(c.id)
      if (fresh) {
        setDetailCliente(fresh)
        onClientLoaded?.(fresh)
      }
    } catch {
      // Mantém os dados locais já carregados
    } finally {
      setLoadingDetail(false)
    }
  }

  const handleCopy = async (label: string, value?: string) => {
    if (!value) return
    try {
      await navigator.clipboard.writeText(value)
      setCopiedField(label)
      onNotify?.(`${label} copiado!`)
      setTimeout(() => setCopiedField(null), 1800)
    } catch {
      onNotify?.(`${label}: ${value}`)
    }
  }

  const counts = useMemo(() => {
    const semIe = clientes.filter((c) => !c.inscricao_estadual || !c.inscricao_estadual.trim()).length
    const bloqueados = clientes.filter((c) => !!c.bloqueado).length
    return { todos: clientes.length, semIe, bloqueados }
  }, [clientes])

  const filtered = useMemo(() => {
    const term = search.toLowerCase().trim()
    const termDigits = term.replace(/\D/g, '')
    return clientes.filter((c) => {
      if (filter === 'sem_ie' && c.inscricao_estadual && c.inscricao_estadual.trim() !== '') {
        return false
      }
      if (filter === 'bloqueados' && !c.bloqueado) {
        return false
      }
      if (!term) return true
      const docDigits = (c.cpf_cnpj || '').replace(/\D/g, '')
      return (
        (c.razao_social || '').toLowerCase().includes(term) ||
        (c.nome_fantasia || '').toLowerCase().includes(term) ||
        (c.cpf_cnpj || '').toLowerCase().includes(term) ||
        (termDigits.length >= 2 && docDigits.includes(termDigits)) ||
        (c.inscricao_estadual || '').toLowerCase().includes(term) ||
        (c.cidade || '').toLowerCase().includes(term) ||
        (c.email || '').toLowerCase().includes(term) ||
        (c.telefone || '').toLowerCase().includes(term) ||
        (c.celular || '').toLowerCase().includes(term)
      )
    })
  }, [clientes, search, filter])

  const visibleList = useMemo(() => filtered.slice(0, visibleLimit), [filtered, visibleLimit])

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-[#F8FAFC] dark:bg-[#090D16] pb-24">
      {/* Top Bar Sticky */}
      <header className="sticky top-0 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-2.5 px-3 py-3 sm:px-6">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="md:hidden shrink-0">
              <AppLogo product="vendas" size="sm" showText={true} variant="light" />
            </div>
            <div className="min-w-0">
              <h1 className="font-display text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">
                Clientes
              </h1>
              <p className="font-mono tabular-nums text-[11px] text-slate-500 dark:text-slate-400 truncate">
                {clientes.length} na carteira {isOffline ? '• offline' : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing || isOffline}
              title="Puxar todos os clientes atualizados do servidor"
              className="flex items-center gap-1.5 rounded-xl border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 transition"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin text-[#00A19C]' : ''}`} />
              <span className="hidden sm:inline">Atualizar</span>
            </button>
            <button
              type="button"
              onClick={onNewClient}
              className="flex items-center gap-1.5 rounded-xl bg-[#00A19C] hover:bg-[#008C87] active:scale-95 px-3.5 py-2 text-xs font-semibold text-white shadow-xs transition"
            >
              <UserPlus className="h-3.5 w-3.5" />
              <span>Novo Cliente</span>
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-3 py-4 sm:px-6 space-y-3.5">
        {/* Busca + Filtros */}
        <div className="rounded-xl bg-white dark:bg-slate-900 p-3 shadow-xs border border-slate-200/80 dark:border-slate-800 space-y-2.5">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="search"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setVisibleLimit(80)
              }}
              placeholder="Buscar por razão social, fantasia, CNPJ/CPF, IE, cidade ou telefone..."
              className="w-full rounded-xl border border-slate-200/80 dark:border-slate-700 bg-[#F8FAFC] dark:bg-slate-800 py-2.5 pl-10 pr-9 text-xs sm:text-sm font-medium text-slate-900 dark:text-white outline-none focus:border-[#00A19C] focus:ring-2 focus:ring-[#00A19C]/15"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
                aria-label="Limpar busca"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setFilter('todos')}
              className={`rounded-full px-3 py-1 text-[11px] font-semibold transition ${
                filter === 'todos'
                  ? 'bg-[#00A19C] text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              Todos ({counts.todos})
            </button>
            <button
              type="button"
              onClick={() => setFilter('sem_ie')}
              className={`rounded-full px-3 py-1 text-[11px] font-semibold transition ${
                filter === 'sem_ie'
                  ? 'bg-amber-500 text-slate-950'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              Sem Inscrição Estadual ({counts.semIe})
            </button>
            {counts.bloqueados > 0 && (
              <button
                type="button"
                onClick={() => setFilter('bloqueados')}
                className={`rounded-full px-3 py-1 text-[11px] font-semibold transition ${
                  filter === 'bloqueados'
                    ? 'bg-rose-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                Bloqueados ({counts.bloqueados})
              </button>
            )}
          </div>
        </div>

        {/* Lista de Clientes */}
        <div className="rounded-xl bg-white dark:bg-slate-900 shadow-xs border border-slate-200/80 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
          {filtered.length === 0 ? (
            <div className="p-10 text-center space-y-3">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Nenhum cliente encontrado
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Tente outro termo de busca ou cadastre um novo cliente
                </p>
              </div>
              <button
                type="button"
                onClick={onNewClient}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#00A19C] px-4 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-[#008C87]"
              >
                <UserPlus className="h-4 w-4" />
                <span>Cadastrar Novo Cliente</span>
              </button>
            </div>
          ) : (
            visibleList.map((c) => {
              const cliInitials =
                (c.nome_fantasia || c.razao_social || 'C')
                  .trim()
                  .split(/\s+/)
                  .filter(Boolean)
                  .slice(0, 2)
                  .map((w) => w[0])
                  .join('')
                  .toUpperCase() || 'C'
              const isSelected = selectedCliente?.id === c.id
              return (
                <div
                  key={c.id}
                  onClick={() => void handleOpenDetail(c)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      void handleOpenDetail(c)
                    }
                  }}
                  className={`flex items-center justify-between gap-3 px-4 py-3 cursor-pointer hover:bg-slate-50/90 dark:hover:bg-slate-800/40 transition ${
                    isSelected ? 'bg-[#00A19C]/[0.05] dark:bg-[#00A19C]/10' : ''
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg font-bold text-xs border ${
                        isSelected
                          ? 'bg-[#00A19C] text-white border-[#00A19C]'
                          : 'bg-[#00A19C]/10 text-[#00A19C] border-[#00A19C]/20'
                      }`}
                    >
                      {cliInitials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white truncate">
                          {c.nome_fantasia || c.razao_social}
                        </p>
                        {isSelected && (
                          <span className="shrink-0 rounded-full bg-[#00A19C]/15 px-2 py-0.5 text-[9px] font-bold text-[#0F766E] dark:text-teal-300">
                            No Pedido
                          </span>
                        )}
                        {c.bloqueado && (
                          <span className="shrink-0 inline-flex items-center gap-0.5 rounded-full bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 px-1.5 py-0.5 text-[9px] font-semibold text-rose-700 dark:text-rose-400">
                            <AlertTriangle className="h-2.5 w-2.5" /> Bloqueado
                          </span>
                        )}
                      </div>
                      {c.nome_fantasia && c.razao_social !== c.nome_fantasia && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          {c.razao_social}
                        </p>
                      )}
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-slate-400 mt-0.5">
                        <span className="font-mono tabular-nums">{formatDoc(c.cpf_cnpj)}</span>
                        {c.inscricao_estadual ? (
                          <span className="font-mono tabular-nums text-slate-500 dark:text-slate-300">
                            • IE: {c.inscricao_estadual}
                          </span>
                        ) : (
                          <span className="text-amber-600 dark:text-amber-400">• Sem IE</span>
                        )}
                        {c.cidade && (
                          <span>
                            • {c.cidade}/{c.estado || ''}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {!c.bloqueado && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          onSelectForOrder(c)
                        }}
                        className="flex items-center gap-1 rounded-xl bg-[#00A19C] hover:bg-[#008C87] active:scale-95 px-2.5 py-2 text-[11px] font-semibold text-white shadow-2xs transition"
                      >
                        <ShoppingBag className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Vender</span>
                      </button>
                    )}
                    <ChevronRight className="h-4 w-4 text-slate-300 dark:text-slate-600" />
                  </div>
                </div>
              )
            })
          )}
        </div>

        {filtered.length > visibleList.length && (
          <div className="flex justify-center pt-1">
            <button
              type="button"
              onClick={() => setVisibleLimit((prev) => prev + 80)}
              className="rounded-xl border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-900 px-5 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-xs transition"
            >
              Carregar mais ({filtered.length - visibleList.length} restantes)
            </button>
          </div>
        )}
      </div>

      {/* Modal Ficha Completa do Cliente */}
      {detailCliente && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            onClick={() => setDetailCliente(null)}
          />

          <div className="relative z-10 flex max-h-[90dvh] w-full max-w-lg flex-col rounded-t-2xl sm:rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden">
            {/* Header Modal */}
            <div className="flex items-start justify-between gap-3 border-b border-slate-200/80 dark:border-slate-800 px-4 py-3.5 sm:px-5 sm:py-4 shrink-0">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="font-display text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-snug">
                    {detailCliente.nome_fantasia || detailCliente.razao_social}
                  </h2>
                  {loadingDetail && <Loader2 className="h-3.5 w-3.5 animate-spin text-[#00A19C]" />}
                </div>
                {detailCliente.nome_fantasia && detailCliente.razao_social !== detailCliente.nome_fantasia && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {detailCliente.razao_social}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setDetailCliente(null)}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                aria-label="Fechar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Body Modal */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 text-xs">
              {detailCliente.bloqueado && (
                <div className="rounded-xl border border-rose-200 dark:border-rose-500/30 bg-rose-50 dark:bg-rose-500/10 p-3 text-rose-700 dark:text-rose-300 flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">Cliente Bloqueado</p>
                    <p className="mt-0.5">{detailCliente.motivo_bloqueio || 'Consulte o financeiro antes de faturar.'}</p>
                  </div>
                </div>
              )}

              {/* Dados Fiscais */}
              <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-[#F8FAFC] dark:bg-slate-800/40 divide-y divide-slate-200/60 dark:divide-slate-800">
                <div className="flex items-center justify-between gap-3 px-3.5 py-2.5">
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      CPF / CNPJ
                    </p>
                    <p className="font-mono tabular-nums font-bold text-slate-900 dark:text-white mt-0.5">
                      {formatDoc(detailCliente.cpf_cnpj)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void handleCopy('CPF/CNPJ', detailCliente.cpf_cnpj)}
                    className="flex items-center gap-1 rounded-lg border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:border-[#00A19C]"
                  >
                    {copiedField === 'CPF/CNPJ' ? <Check className="h-3 w-3 text-[#00A19C]" /> : <Copy className="h-3 w-3" />}
                    <span>Copiar</span>
                  </button>
                </div>

                <div className="flex items-center justify-between gap-3 px-3.5 py-2.5">
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                      <FileText className="h-3 w-3 text-[#00A19C]" /> Inscrição Estadual (IE)
                    </p>
                    {detailCliente.inscricao_estadual ? (
                      <p className="font-mono tabular-nums font-bold text-slate-900 dark:text-white mt-0.5">
                        {detailCliente.inscricao_estadual}
                      </p>
                    ) : (
                      <p className="text-amber-600 dark:text-amber-400 font-semibold mt-0.5">
                        Não informada
                      </p>
                    )}
                  </div>
                  {detailCliente.inscricao_estadual ? (
                    <button
                      type="button"
                      onClick={() => void handleCopy('Inscrição Estadual', detailCliente.inscricao_estadual)}
                      className="flex items-center gap-1 rounded-lg border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:border-[#00A19C]"
                    >
                      {copiedField === 'Inscrição Estadual' ? <Check className="h-3 w-3 text-[#00A19C]" /> : <Copy className="h-3 w-3" />}
                      <span>Copiar</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        const target = detailCliente
                        setDetailCliente(null)
                        onEditClient(target)
                      }}
                      className="flex items-center gap-1 rounded-lg bg-amber-500/15 border border-amber-400/40 px-2.5 py-1.5 text-[11px] font-semibold text-amber-700 dark:text-amber-300"
                    >
                      <Pencil className="h-3 w-3" /> Informar IE
                    </button>
                  )}
                </div>
              </div>

              {/* Contato */}
              <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5 space-y-2.5">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Contato & Faturamento
                </p>
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5 text-slate-500">
                    <User className="h-3.5 w-3.5" /> Comprador
                  </span>
                  <span className="font-medium text-slate-900 dark:text-white text-right">
                    {detailCliente.contato_nome || '—'}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5 text-slate-500">
                    <Phone className="h-3.5 w-3.5" /> Telefone
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono tabular-nums font-medium text-slate-900 dark:text-white">
                      {detailCliente.telefone || detailCliente.celular || '—'}
                    </span>
                    {(detailCliente.telefone || detailCliente.celular) && (
                      <button
                        type="button"
                        onClick={() => void handleCopy('Telefone', detailCliente.telefone || detailCliente.celular)}
                        className="text-[#00A19C] hover:underline text-[11px] font-semibold"
                      >
                        Copiar
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5 text-slate-500">
                    <Mail className="h-3.5 w-3.5" /> E-mail NF-e
                  </span>
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-medium text-slate-900 dark:text-white truncate">
                      {detailCliente.email || '—'}
                    </span>
                    {detailCliente.email && (
                      <button
                        type="button"
                        onClick={() => void handleCopy('E-mail', detailCliente.email)}
                        className="text-[#00A19C] hover:underline text-[11px] font-semibold shrink-0"
                      >
                        Copiar
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Endereço */}
              <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5 space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-[#00A19C]" /> Endereço
                  </p>
                  {formatAddress(detailCliente) && (
                    <button
                      type="button"
                      onClick={() => void handleCopy('Endereço', formatAddress(detailCliente))}
                      className="text-[#00A19C] hover:underline text-[11px] font-semibold"
                    >
                      Copiar endereço
                    </button>
                  )}
                </div>
                <p className="text-slate-700 dark:text-slate-200 leading-relaxed">
                  {formatAddress(detailCliente) || 'Endereço não cadastrado'}
                </p>
              </div>

              {/* Financeiro / Histórico */}
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 p-2.5">
                  <span className="block text-[10px] font-semibold uppercase text-slate-400">
                    Limite Créd.
                  </span>
                  <span className="mt-0.5 block font-mono text-xs font-bold text-slate-900 dark:text-white tabular-nums">
                    {formatBRL(detailCliente.limite_credito)}
                  </span>
                </div>
                <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 p-2.5">
                  <span className="block text-[10px] font-semibold uppercase text-slate-400 flex items-center gap-1">
                    <CreditCard className="h-3 w-3" /> Devedor
                  </span>
                  <span className="mt-0.5 block font-mono text-xs font-bold text-amber-600 dark:text-amber-400 tabular-nums">
                    {formatBRL(detailCliente.saldo_devedor)}
                  </span>
                </div>
                <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 p-2.5">
                  <span className="block text-[10px] font-semibold uppercase text-slate-400">
                    Pedidos
                  </span>
                  <span className="mt-0.5 block font-mono text-xs font-bold text-[#00A19C] tabular-nums">
                    {detailCliente.total_pedidos || 0}
                  </span>
                </div>
              </div>

              {detailCliente.observacoes && (
                <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/30 p-3 text-slate-600 dark:text-slate-300">
                  <span className="block text-[10px] font-semibold uppercase text-slate-400 mb-0.5">
                    Observações
                  </span>
                  {detailCliente.observacoes}
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="flex items-center gap-2 border-t border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3.5 sm:px-5 shrink-0">
              <button
                type="button"
                onClick={() => {
                  const target = detailCliente
                  setDetailCliente(null)
                  onEditClient(target)
                }}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-800 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700"
              >
                <Pencil className="h-3.5 w-3.5" />
                <span>Editar Dados / IE</span>
              </button>
              {!detailCliente.bloqueado && (
                <button
                  type="button"
                  onClick={() => {
                    const target = detailCliente
                    setDetailCliente(null)
                    onSelectForOrder(target)
                  }}
                  className="flex-[1.5] flex items-center justify-center gap-1.5 rounded-xl bg-[#00A19C] hover:bg-[#008C87] py-2.5 text-xs font-semibold text-white shadow-xs"
                >
                  <ShoppingBag className="h-3.5 w-3.5" />
                  <span>Vender para Cliente</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
