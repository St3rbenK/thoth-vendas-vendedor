import React, { useState, useEffect } from 'react'
import {
  Users,
  UserPlus,
  KeyRound,
  ShieldCheck,
  Building2,
  LogOut,
  Search,
  CheckCircle2,
  Eye,
  EyeOff,
  Percent,
  MapPin,
  Phone,
  Mail,
  Loader2,
  ChevronRight,
  ArrowLeft,
  RefreshCw,
  ShoppingBag,
  Sparkles,
  BadgeCheck,
  X,
  AlertCircle,
  Sun,
  Moon,
  Tag,
} from 'lucide-react'
import { criarCliente, updateVendedorPerfil } from '../services/api'
import { AppLogo } from './AppLogo'
import type { Cliente, UsuarioVendedor, EmpresaVinculo, NovoClientePayload, TabelaPreco } from '../types'
import type { ThemeMode } from '../hooks/useTheme'

interface MaisViewProps {
  currentUser: UsuarioVendedor | null
  onUpdateUser: (u: UsuarioVendedor) => void
  clientes: Cliente[]
  tabelas?: TabelaPreco[]
  onClienteCreated: (c: Cliente) => void
  onSelectClienteForOrder?: (c: Cliente) => void
  empresaAtiva: EmpresaVinculo | null
  empresasCount: number
  onSwitchEmpresa: () => void
  onLogout: () => void
  onReloadData?: () => Promise<void> | void
  autoOpenNewClient?: boolean
  onClearAutoOpenNewClient?: () => void
  theme: ThemeMode
  onToggleTheme: () => void
}

type SettingsScreen = 'menu' | 'clientes' | 'novo_cliente' | 'perfil' | 'alcada'

function formatCpfCnpjInput(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 14)
  if (digits.length <= 11) {
    if (digits.length <= 3) return digits
    if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`
    if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`
  }
  if (digits.length <= 12) {
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`
  }
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12, 14)}`
}

function formatPhoneInput(raw: string): string {
  const d = raw.replace(/\D/g, '').slice(0, 11)
  if (d.length <= 2) return d
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7, 11)}`
}

export function MaisView({
  currentUser,
  onUpdateUser,
  clientes,
  tabelas = [],
  onClienteCreated,
  onSelectClienteForOrder,
  empresaAtiva,
  empresasCount,
  onSwitchEmpresa,
  onLogout,
  onReloadData,
  autoOpenNewClient = false,
  onClearAutoOpenNewClient,
  theme,
  onToggleTheme,
}: MaisViewProps) {
  const [screen, setScreen] = useState<SettingsScreen>(autoOpenNewClient ? 'novo_cliente' : 'menu')
  const [clienteSearch, setClienteSearch] = useState('')
  const [salvandoCliente, setSalvandoCliente] = useState(false)
  const [buscandoCep, setBuscandoCep] = useState(false)
  const [sincronizando, setSincronizando] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  useEffect(() => {
    if (autoOpenNewClient) {
      setScreen('novo_cliente')
      setFormError(null)
      if (onClearAutoOpenNewClient) onClearAutoOpenNewClient()
    }
  }, [autoOpenNewClient, onClearAutoOpenNewClient])

  const [clienteForm, setClienteForm] = useState<NovoClientePayload>({
    razao_social: '',
    nome_fantasia: '',
    cpf_cnpj: '',
    inscricao_estadual: '',
    email: '',
    telefone: '',
    celular: '',
    contato_nome: '',
    cep: '',
    logradouro: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: '',
    tabela_preco_id: '',
    observacoes: '',
  })

  // Estados de Perfil e PIN
  const [nome, setNome] = useState(currentUser?.nome || '')
  const [email, setEmail] = useState(currentUser?.email || '')
  const [telefone, setTelefone] = useState(currentUser?.telefone || '')
  const [novoPin, setNovoPin] = useState('')
  const [confirmaPin, setConfirmaPin] = useState('')
  const [showPin, setShowPin] = useState(false)
  const [salvandoPerfil, setSalvandoPerfil] = useState(false)
  const [toastMsg, setToastMsg] = useState<string | null>(null)

  useEffect(() => {
    if (currentUser) {
      setNome(currentUser.nome || '')
      setEmail(currentUser.email || '')
      setTelefone(currentUser.telefone || '')
    }
  }, [currentUser])

  const triggerToast = (msg: string) => {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(null), 3000)
  }

  const handleSincronizarAgora = async () => {
    if (!onReloadData || sincronizando) return
    setSincronizando(true)
    try {
      await onReloadData()
      triggerToast('Catálogo, clientes e tabelas atualizados!')
    } catch {
      triggerToast('Não foi possível sincronizar no momento.')
    } finally {
      setSincronizando(false)
    }
  }

  // Busca CEP automático via ViaCEP
  const handleCepChange = async (cepRaw: string) => {
    const limpo = cepRaw.replace(/\D/g, '').slice(0, 8)
    const fmt = limpo.length > 5 ? `${limpo.slice(0, 5)}-${limpo.slice(5)}` : limpo
    setClienteForm((prev) => ({ ...prev, cep: fmt }))

    if (limpo.length === 8) {
      setBuscandoCep(true)
      try {
        const res = await fetch(`https://viacep.com.br/ws/${limpo}/json/`)
        const data = await res.json()
        if (!data.erro) {
          setClienteForm((prev) => ({
            ...prev,
            logradouro: data.logradouro || prev.logradouro,
            bairro: data.bairro || prev.bairro,
            cidade: data.localidade || prev.cidade,
            estado: data.uf || prev.estado,
          }))
        }
      } catch (err) {
        console.warn('Erro ao consultar CEP:', err)
      } finally {
        setBuscandoCep(false)
      }
    }
  }

  const handleSalvarNovoCliente = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)
    const docDigits = clienteForm.cpf_cnpj.replace(/\D/g, '')
    if (!clienteForm.razao_social.trim() || !docDigits) {
      setFormError('Razão Social / Nome e CPF/CNPJ são obrigatórios.')
      return
    }
    if (docDigits.length !== 11 && docDigits.length !== 14) {
      setFormError('Informe um CPF (11 dígitos) ou CNPJ (14 dígitos) válido.')
      return
    }

    setSalvandoCliente(true)
    try {
      const payload: NovoClientePayload = {
        ...clienteForm,
        tabela_preco_id: clienteForm.tabela_preco_id || undefined,
      }
      const salvo = await criarCliente(payload)
      onClienteCreated(salvo)
      setClienteForm({
        razao_social: '',
        nome_fantasia: '',
        cpf_cnpj: '',
        inscricao_estadual: '',
        email: '',
        telefone: '',
        celular: '',
        contato_nome: '',
        cep: '',
        logradouro: '',
        numero: '',
        complemento: '',
        bairro: '',
        cidade: '',
        estado: '',
        tabela_preco_id: '',
        observacoes: '',
      })
      setScreen('clientes')
      triggerToast('Cliente cadastrado e sincronizado com o ERP!')
    } catch (err: any) {
      setFormError(err.message || 'Falha ao cadastrar cliente.')
    } finally {
      setSalvandoCliente(false)
    }
  }

  const handleSalvarPerfil = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)
    if (novoPin && novoPin !== confirmaPin) {
      setFormError('O PIN e a confirmação não coincidem.')
      return
    }
    if (novoPin && (novoPin.length < 4 || novoPin.length > 6)) {
      setFormError('O PIN precisa ter entre 4 e 6 dígitos numéricos.')
      return
    }

    setSalvandoPerfil(true)
    try {
      const res = await updateVendedorPerfil({
        nome: nome.trim(),
        email: email.trim(),
        telefone: telefone.trim(),
        pin: novoPin.trim() || undefined,
      })

      if (res.user) {
        onUpdateUser(res.user)
      }
      setNovoPin('')
      setConfirmaPin('')
      setScreen('menu')
      triggerToast('Dados do perfil e PIN atualizados!')
    } catch (err: any) {
      setFormError(err.message || 'Falha ao atualizar dados.')
    } finally {
      setSalvandoPerfil(false)
    }
  }

  const filteredClientes = clientes.filter((c) => {
    if (!clienteSearch.trim()) return true
    const term = clienteSearch.toLowerCase()
    return (
      c.razao_social.toLowerCase().includes(term) ||
      (c.nome_fantasia && c.nome_fantasia.toLowerCase().includes(term)) ||
      c.cpf_cnpj.includes(term) ||
      (c.cidade && c.cidade.toLowerCase().includes(term))
    )
  })

  const limiteDesconto = currentUser?.limite_desconto_pct ?? 15
  const initials = (currentUser?.nome || 'Vendedor')
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()

  const empresaLabel =
    empresaAtiva?.nome_fantasia || empresaAtiva?.razao_social || 'Empresa conectada'

  const screenTitle: Record<SettingsScreen, { title: string; subtitle: string }> = {
    menu: { title: 'Configurações', subtitle: 'Conta, carteira de clientes e preferências' },
    clientes: { title: 'Carteira de Clientes', subtitle: `${clientes.length} clientes vinculados` },
    novo_cliente: { title: 'Novo Cliente', subtitle: 'Cadastro rápido integrado ao ERP' },
    perfil: { title: 'Perfil e Segurança', subtitle: 'Dados do representante e PIN de acesso' },
    alcada: { title: 'Alçada Comercial', subtitle: 'Regras de desconto e sincronização' },
  }

  const inputClass =
    'w-full p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-700 bg-[#F8FAFC] dark:bg-slate-800/60 text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:border-[#00A19C] focus:ring-2 focus:ring-[#00A19C]/15 transition'

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-[#F8FAFC] dark:bg-[#090D16] pb-24">
      {/* Top Bar */}
      <header className="sticky top-0 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3.5">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {screen !== 'menu' ? (
              <button
                type="button"
                onClick={() => {
                  setScreen('menu')
                  setFormError(null)
                }}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 transition"
                aria-label="Voltar"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
            ) : (
              <div className="md:hidden shrink-0">
                <AppLogo product="vendas" size="sm" showText={true} variant="light" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h1 className="font-display truncate text-sm sm:text-base font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
                {screen === 'menu' ? 'Configurações & Carteira' : screenTitle[screen].title}
              </h1>
              <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">
                {screenTitle[screen].subtitle}
              </p>
            </div>
          </div>

          {screen === 'clientes' && (
            <button
              type="button"
              onClick={() => {
                setFormError(null)
                setScreen('novo_cliente')
              }}
              className="flex items-center gap-1.5 rounded-xl bg-[#00A19C] px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#008C87] active:scale-95 transition shrink-0"
            >
              <UserPlus className="h-3.5 w-3.5" />
              <span>Novo</span>
            </button>
          )}
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-3 py-4 sm:px-6 sm:py-6 space-y-5">
        {formError && (
          <div
            role="alert"
            className="rounded-xl border border-rose-200 dark:border-rose-500/20 bg-rose-50 dark:bg-rose-500/10 p-3.5 text-xs text-rose-700 dark:text-rose-400 flex items-start gap-2"
          >
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{formError}</span>
          </div>
        )}

        {/* MENU PRINCIPAL */}
        {screen === 'menu' && (
          <>
            {/* Card de Perfil */}
            <button
              type="button"
              onClick={() => {
                setFormError(null)
                setScreen('perfil')
              }}
              className="w-full rounded-xl bg-white dark:bg-slate-900 p-4 shadow-xs border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3.5 text-left hover:border-[#00A19C]/50 active:scale-[0.995] transition"
            >
              <div className="flex items-center gap-3.5 min-w-0 flex-1">
                <div className="relative shrink-0">
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-[#00A19C] to-[#0F766E] text-white font-display font-bold text-lg shadow-xs">
                    {initials}
                  </div>
                  <span
                    className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900"
                    title="Online"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <h2 className="font-display text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">
                      {currentUser?.nome || 'Representante Comercial'}
                    </h2>
                    <BadgeCheck className="h-4 w-4 text-[#00A19C] shrink-0" />
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                    {currentUser?.email || 'Representante autorizado'}
                  </p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    <span className="inline-flex items-center rounded-md bg-teal-50 dark:bg-[#00A19C]/15 px-2 py-0.5 font-mono tabular-nums text-[10px] font-semibold text-[#0F766E] dark:text-teal-300 border border-teal-200 dark:border-[#00A19C]/30">
                      Desc. máx: {limiteDesconto}%
                    </span>
                    {currentUser?.cpf ? (
                      <span className="inline-flex items-center rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-mono tabular-nums font-semibold text-slate-600 dark:text-slate-300">
                        CPF: {currentUser.cpf}
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-md bg-amber-50 dark:bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:text-amber-400">
                        Alterar PIN / Dados
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-slate-400 shrink-0" />
            </button>

            {/* Grupo 1: Comercial & Clientes */}
            <div className="space-y-1.5">
              <p className="px-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Comercial & Clientes
              </p>
              <div className="rounded-xl bg-white dark:bg-slate-900 shadow-xs border border-slate-200/80 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setScreen('clientes')}
                  className="w-full flex items-center justify-between gap-3 px-4 py-3.5 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition"
                >
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#00A19C]/10 text-[#00A19C]">
                      <Users className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                        Minha Carteira de Clientes
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        Consultar clientes ou iniciar um novo pedido
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="rounded-full bg-[#00A19C]/10 px-2.5 py-0.5 font-mono tabular-nums text-xs font-bold text-[#00A19C]">
                      {clientes.length}
                    </span>
                    <ChevronRight className="h-4 w-4 text-slate-400" />
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setFormError(null)
                    setScreen('novo_cliente')
                  }}
                  className="w-full flex items-center justify-between gap-3 px-4 py-3.5 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition"
                >
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      <UserPlus className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                        Cadastrar Novo Cliente
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        Preenchimento automático por CEP e envio ao ERP
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-400 shrink-0" />
                </button>

                <button
                  type="button"
                  onClick={() => setScreen('alcada')}
                  className="w-full flex items-center justify-between gap-3 px-4 py-3.5 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition"
                >
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                      <Percent className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                        Alçada de Desconto & Regras
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        Limite máximo de {limiteDesconto}% por item no pedido
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="rounded-full bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-2.5 py-0.5 font-mono tabular-nums text-xs font-bold text-amber-700 dark:text-amber-400">
                      {limiteDesconto}%
                    </span>
                    <ChevronRight className="h-4 w-4 text-slate-400" />
                  </div>
                </button>
              </div>
            </div>

            {/* Grupo 2: Conta, Aparência & Sincronização */}
            <div className="space-y-1.5">
              <p className="px-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Conta & Aplicativo
              </p>
              <div className="rounded-xl bg-white dark:bg-slate-900 shadow-xs border border-slate-200/80 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
                <button
                  type="button"
                  onClick={() => {
                    setFormError(null)
                    setScreen('perfil')
                  }}
                  className="w-full flex items-center justify-between gap-3 px-4 py-3.5 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition"
                >
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                      <KeyRound className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                        Segurança & PIN de Acesso
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        Alterar PIN numérico, telefone e e-mail
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-400 shrink-0" />
                </button>

                <button
                  type="button"
                  onClick={onToggleTheme}
                  className="w-full flex items-center justify-between gap-3 px-4 py-3.5 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition"
                >
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-amber-400">
                      {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                        Aparência da Interface
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        {theme === 'dark' ? 'Modo Escuro ativo (toque para Light)' : 'Modo Claro padrão (toque para Dark)'}
                      </p>
                    </div>
                  </div>
                  <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                    {theme === 'dark' ? 'Escuro' : 'Claro'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (empresasCount > 1) {
                      onSwitchEmpresa()
                    } else {
                      triggerToast(`Empresa ativa: ${empresaLabel}`)
                    }
                  }}
                  className="w-full flex items-center justify-between gap-3 px-4 py-3.5 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition"
                >
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                        Empresa Representada
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        {empresaLabel}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {empresasCount > 1 ? (
                      <span className="rounded-full bg-[#00A19C]/10 px-2.5 py-0.5 text-[11px] font-semibold text-[#00A19C]">
                        Trocar ({empresasCount})
                      </span>
                    ) : (
                      <span className="rounded-full bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
                        Ativa
                      </span>
                    )}
                    <ChevronRight className="h-4 w-4 text-slate-400" />
                  </div>
                </button>

                {onReloadData && (
                  <button
                    type="button"
                    onClick={handleSincronizarAgora}
                    disabled={sincronizando}
                    className="w-full flex items-center justify-between gap-3 px-4 py-3.5 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition disabled:opacity-60"
                  >
                    <div className="flex items-center gap-3.5 min-w-0 flex-1">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#00A19C]/10 text-[#00A19C]">
                        <RefreshCw className={`h-5 w-5 ${sincronizando ? 'animate-spin' : ''}`} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                          Sincronizar Dados Agora
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                          {sincronizando
                            ? 'Atualizando catálogo, estoque e clientes…'
                            : 'Atualizar produtos, tabelas de preço e clientes'}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-400 shrink-0" />
                  </button>
                )}
              </div>
            </div>

            {/* Grupo 3: Sessão */}
            <div className="rounded-xl bg-white dark:bg-slate-900 shadow-xs border border-slate-200/80 dark:border-slate-800 overflow-hidden">
              <button
                type="button"
                onClick={onLogout}
                className="w-full flex items-center justify-between gap-3 px-4 py-3.5 text-left hover:bg-rose-50/60 dark:hover:bg-rose-500/10 transition"
              >
                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200/60 dark:border-rose-500/20">
                    <LogOut className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-rose-600 dark:text-rose-400 truncate">
                      Sair do Aplicativo
                    </p>
                    <p className="text-xs text-slate-400 truncate mt-0.5">
                      Encerrar sessão de vendas neste aparelho
                    </p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-rose-300 shrink-0" />
              </button>
            </div>

            <div className="flex flex-col items-center justify-center pt-3 pb-2 opacity-80">
              <AppLogo
                product="vendas"
                size="sm"
                showText={true}
                showSublabel={true}
                sublabel="Ecossistema Thothfy • Linha Business"
              />
            </div>
          </>
        )}

        {/* SUB-TELA: CARTEIRA DE CLIENTES */}
        {screen === 'clientes' && (
          <div className="space-y-3">
            <div className="rounded-xl bg-white dark:bg-slate-900 p-3 shadow-xs border border-slate-200/80 dark:border-slate-800">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="search"
                  value={clienteSearch}
                  onChange={(e) => setClienteSearch(e.target.value)}
                  placeholder="Buscar por razão social, fantasia, CNPJ ou cidade…"
                  className="w-full rounded-xl border border-slate-200/80 dark:border-slate-700 bg-[#F8FAFC] dark:bg-slate-800 py-2.5 pl-10 pr-9 text-xs font-medium text-slate-900 dark:text-white outline-none focus:border-[#00A19C]"
                />
                {clienteSearch && (
                  <button
                    type="button"
                    onClick={() => setClienteSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>

            <div className="rounded-xl bg-white dark:bg-slate-900 shadow-xs border border-slate-200/80 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
              {filteredClientes.length === 0 ? (
                <div className="p-10 text-center space-y-3">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400">
                    <Users className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      Nenhum cliente encontrado
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Cadastre um novo cliente para iniciar seus pedidos
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setScreen('novo_cliente')}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#00A19C] px-4 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-[#008C87]"
                  >
                    <UserPlus className="h-4 w-4" />
                    <span>Cadastrar Novo Cliente</span>
                  </button>
                </div>
              ) : (
                filteredClientes.map((c) => {
                  const cliInitials = (c.nome_fantasia || c.razao_social || 'C')
                    .split(/\s+/)
                    .slice(0, 2)
                    .map((w) => w[0])
                    .join('')
                    .toUpperCase()
                  return (
                    <div
                      key={c.id}
                      className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#00A19C]/10 text-[#00A19C] font-bold text-xs border border-[#00A19C]/20">
                          {cliInitials}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <p className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white truncate">
                              {c.nome_fantasia || c.razao_social}
                            </p>
                            {c.bloqueado && (
                              <span className="shrink-0 rounded-full bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 px-1.5 py-0.5 text-[9px] font-semibold text-rose-700 dark:text-rose-400">
                                Bloqueado
                              </span>
                            )}
                          </div>
                          {c.nome_fantasia && c.razao_social !== c.nome_fantasia && (
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                              {c.razao_social}
                            </p>
                          )}
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-slate-400 mt-0.5">
                            <span className="font-mono tabular-nums">{c.cpf_cnpj}</span>
                            {c.cidade && (
                              <span>
                                • {c.cidade}/{c.estado}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {onSelectClienteForOrder && !c.bloqueado && (
                        <button
                          type="button"
                          onClick={() => onSelectClienteForOrder(c)}
                          className="flex items-center gap-1 rounded-xl bg-[#00A19C] hover:bg-[#008C87] active:scale-95 px-3 py-2 text-[11px] font-semibold text-white shadow-2xs transition shrink-0"
                        >
                          <ShoppingBag className="h-3.5 w-3.5" />
                          <span>Vender</span>
                        </button>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          </div>
        )}

        {/* SUB-TELA: CADASTRAR NOVO CLIENTE */}
        {screen === 'novo_cliente' && (
          <form onSubmit={handleSalvarNovoCliente} className="space-y-4">
            <div className="rounded-xl bg-teal-50/80 dark:bg-[#00A19C]/10 border border-teal-200/80 dark:border-[#00A19C]/20 p-3.5 text-xs text-slate-800 dark:text-teal-200 flex items-start gap-2.5">
              <Sparkles className="h-4 w-4 text-[#00A19C] shrink-0 mt-0.5" />
              <span className="leading-relaxed">
                O cliente cadastrado é vinculado automaticamente à sua carteira e sincronizado com o ERP ativo.
              </span>
            </div>

            <div className="rounded-xl bg-white dark:bg-slate-900 p-4 shadow-xs border border-slate-200/80 dark:border-slate-800 space-y-3.5 text-xs">
              <h3 className="font-display font-bold text-slate-900 dark:text-white text-sm border-b border-slate-100 dark:border-slate-800 pb-2">
                1. Identificação do Cliente
              </h3>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Razão Social / Nome Completo *
                </label>
                <input
                  type="text"
                  required
                  value={clienteForm.razao_social}
                  onChange={(e) => setClienteForm({ ...clienteForm, razao_social: e.target.value })}
                  placeholder="Ex: Comercial Silva Ltda ou João da Silva"
                  className={inputClass}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Nome Fantasia
                  </label>
                  <input
                    type="text"
                    value={clienteForm.nome_fantasia || ''}
                    onChange={(e) => setClienteForm({ ...clienteForm, nome_fantasia: e.target.value })}
                    placeholder="Nome comercial da loja"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    CPF ou CNPJ *
                  </label>
                  <input
                    type="text"
                    required
                    value={clienteForm.cpf_cnpj}
                    onChange={(e) =>
                      setClienteForm({ ...clienteForm, cpf_cnpj: formatCpfCnpjInput(e.target.value) })
                    }
                    placeholder="00.000.000/0000-00"
                    className={`${inputClass} font-mono tabular-nums`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                    <Phone className="h-3.5 w-3.5 text-slate-400" /> Telefone / WhatsApp
                  </label>
                  <input
                    type="tel"
                    value={clienteForm.telefone || ''}
                    onChange={(e) =>
                      setClienteForm({ ...clienteForm, telefone: formatPhoneInput(e.target.value) })
                    }
                    placeholder="(00) 00000-0000"
                    className={`${inputClass} font-mono tabular-nums`}
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                    <Mail className="h-3.5 w-3.5 text-slate-400" /> E-mail para NFe / Pedidos
                  </label>
                  <input
                    type="email"
                    value={clienteForm.email || ''}
                    onChange={(e) => setClienteForm({ ...clienteForm, email: e.target.value })}
                    placeholder="cliente@empresa.com.br"
                    className={inputClass}
                  />
                </div>
              </div>

              {tabelas.length > 0 && (
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                    <Tag className="h-3.5 w-3.5 text-slate-400" /> Tabela de Preço Padrão
                  </label>
                  <select
                    value={clienteForm.tabela_preco_id || ''}
                    onChange={(e) => setClienteForm({ ...clienteForm, tabela_preco_id: e.target.value })}
                    className={inputClass}
                  >
                    <option value="">Usar tabela padrão da empresa</option>
                    {tabelas.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.nome}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="rounded-xl bg-white dark:bg-slate-900 p-4 shadow-xs border border-slate-200/80 dark:border-slate-800 space-y-3.5 text-xs">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                <h3 className="font-display font-bold text-slate-900 dark:text-white text-sm flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-[#00A19C]" /> 2. Endereço de Entrega / Faturamento
                </h3>
                {buscandoCep && (
                  <span className="text-[11px] font-semibold text-[#00A19C] flex items-center gap-1">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Consultando CEP…
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">CEP</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={clienteForm.cep || ''}
                    onChange={(e) => handleCepChange(e.target.value)}
                    placeholder="00000-000"
                    className={`${inputClass} font-mono tabular-nums`}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Logradouro / Rua
                  </label>
                  <input
                    type="text"
                    value={clienteForm.logradouro || ''}
                    onChange={(e) => setClienteForm({ ...clienteForm, logradouro: e.target.value })}
                    placeholder="Rua, Avenida, Rodovia…"
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Número</label>
                  <input
                    type="text"
                    value={clienteForm.numero || ''}
                    onChange={(e) => setClienteForm({ ...clienteForm, numero: e.target.value })}
                    placeholder="Nº"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Bairro</label>
                  <input
                    type="text"
                    value={clienteForm.bairro || ''}
                    onChange={(e) => setClienteForm({ ...clienteForm, bairro: e.target.value })}
                    placeholder="Bairro"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Cidade</label>
                  <input
                    type="text"
                    value={clienteForm.cidade || ''}
                    onChange={(e) => setClienteForm({ ...clienteForm, cidade: e.target.value })}
                    placeholder="Cidade"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">UF</label>
                  <input
                    type="text"
                    maxLength={2}
                    value={clienteForm.estado || ''}
                    onChange={(e) =>
                      setClienteForm({ ...clienteForm, estado: e.target.value.toUpperCase() })
                    }
                    placeholder="UF"
                    className={`${inputClass} uppercase font-mono`}
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Observações Comerciais
                </label>
                <textarea
                  rows={2}
                  value={clienteForm.observacoes || ''}
                  onChange={(e) => setClienteForm({ ...clienteForm, observacoes: e.target.value })}
                  placeholder="Horário de recebimento, referências, inscrição estadual…"
                  className={inputClass}
                />
              </div>
            </div>

            <div className="flex items-center gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setScreen('menu')}
                className="flex-1 py-3 rounded-xl border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 font-semibold text-xs hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={salvandoCliente}
                className="flex-[2] flex items-center justify-center gap-2 py-3 rounded-xl bg-[#00A19C] hover:bg-[#008C87] text-white font-semibold text-xs shadow-sm disabled:opacity-50"
              >
                {salvandoCliente && <Loader2 className="h-4 w-4 animate-spin" />}
                <span>Salvar Cliente & Sincronizar ERP</span>
              </button>
            </div>
          </form>
        )}

        {/* SUB-TELA: PERFIL & PIN */}
        {screen === 'perfil' && (
          <form onSubmit={handleSalvarPerfil} className="space-y-4">
            <div className="rounded-xl bg-white dark:bg-slate-900 p-4 shadow-xs border border-slate-200/80 dark:border-slate-800 space-y-3.5 text-xs">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#00A19C] to-[#0F766E] text-white font-display font-bold text-base">
                  {initials}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-display font-bold text-sm text-slate-900 dark:text-white truncate">
                    {currentUser?.nome || 'Representante'}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    ID Vendedor: <span className="font-mono tabular-nums">{currentUser?.id?.slice(0, 8)}</span>
                  </p>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nome Completo
                </label>
                <input
                  type="text"
                  required
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  E-mail Corporativo
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Telefone / WhatsApp
                </label>
                <input
                  type="tel"
                  value={telefone}
                  onChange={(e) => setTelefone(formatPhoneInput(e.target.value))}
                  placeholder="(00) 00000-0000"
                  className={`${inputClass} font-mono tabular-nums`}
                />
              </div>
            </div>

            <div className="rounded-xl bg-white dark:bg-slate-900 p-4 shadow-xs border border-slate-200/80 dark:border-slate-800 space-y-3.5 text-xs">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <KeyRound className="h-4 w-4 text-[#00A19C]" />
                  <h3 className="font-display font-bold text-sm text-slate-900 dark:text-white">
                    PIN Numérico de Acesso
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                >
                  {showPin ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  <span>{showPin ? 'Ocultar' : 'Mostrar'}</span>
                </button>
              </div>

              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                O PIN numérico (4 a 6 dígitos) é usado para entrar rapidamente no aplicativo. Deixe em branco caso não queira alterar seu PIN atual.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Novo PIN (4 a 6 dígitos)
                  </label>
                  <input
                    type={showPin ? 'text' : 'password'}
                    maxLength={6}
                    inputMode="numeric"
                    value={novoPin}
                    onChange={(e) => setNovoPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="••••"
                    className={`${inputClass} font-mono tabular-nums tracking-widest text-center text-sm`}
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Confirmar Novo PIN
                  </label>
                  <input
                    type={showPin ? 'text' : 'password'}
                    maxLength={6}
                    inputMode="numeric"
                    value={confirmaPin}
                    onChange={(e) => setConfirmaPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="••••"
                    className={`${inputClass} font-mono tabular-nums tracking-widest text-center text-sm`}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setScreen('menu')}
                className="flex-1 py-3 rounded-xl border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 font-semibold text-xs hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Voltar
              </button>
              <button
                type="submit"
                disabled={salvandoPerfil}
                className="flex-[2] flex items-center justify-center gap-2 py-3 rounded-xl bg-[#00A19C] hover:bg-[#008C87] text-white font-semibold text-xs shadow-sm disabled:opacity-50"
              >
                {salvandoPerfil && <Loader2 className="h-4 w-4 animate-spin" />}
                <span>Salvar Dados & PIN</span>
              </button>
            </div>
          </form>
        )}

        {/* SUB-TELA: ALÇADA COMERCIAL */}
        {screen === 'alcada' && (
          <div className="space-y-3">
            <div className="rounded-xl bg-white dark:bg-slate-900 p-5 shadow-xs border border-slate-200/80 dark:border-slate-800 space-y-4">
              <div className="flex items-center gap-3.5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <Percent className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                    Limite Individual no Pedido
                  </p>
                  <h3 className="font-display font-mono tabular-nums text-2xl font-bold text-slate-900 dark:text-white">
                    Até {limiteDesconto}% de desconto
                  </h3>
                </div>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed border-t border-slate-100 dark:border-slate-800 pt-3">
                Você pode aplicar descontos diretos de até <strong className="font-mono">{limiteDesconto}%</strong> por item diretamente no carrinho, além de selecionar as <strong>Tabelas de Preço</strong> sincronizadas com o ERP.
              </p>
            </div>

            <div className="rounded-xl bg-white dark:bg-slate-900 p-5 shadow-xs border border-slate-200/80 dark:border-slate-800 space-y-3">
              <div className="flex items-center gap-2.5 text-[#00A19C] font-bold text-sm">
                <ShieldCheck className="h-5 w-5" />
                <span>Integração ERP Ativa</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Todos os pedidos transmitidos e novos clientes cadastrados são sincronizados automaticamente com o ERP configurado para faturamento vinculados ao seu código de representante.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Toast Flutuante */}
      {toastMsg && (
        <div className="fixed bottom-20 left-1/2 z-50 -translate-x-1/2 flex items-center gap-2 rounded-full bg-slate-900/95 dark:bg-slate-800 border border-slate-700 px-4 py-2.5 text-xs font-semibold text-white shadow-lg backdrop-blur max-w-[90vw] truncate">
          <CheckCircle2 className="h-4 w-4 text-[#00A19C] shrink-0" />
          <span className="truncate">{toastMsg}</span>
        </div>
      )}
    </div>
  )
}
