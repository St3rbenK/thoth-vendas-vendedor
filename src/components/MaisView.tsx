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
} from 'lucide-react'
import { criarCliente, updateVendedorPerfil } from '../services/api'
import { AppLogo } from './AppLogo'
import type { Cliente, UsuarioVendedor, EmpresaVinculo, NovoClientePayload } from '../types'

interface MaisViewProps {
  currentUser: UsuarioVendedor | null
  onUpdateUser: (u: UsuarioVendedor) => void
  clientes: Cliente[]
  onClienteCreated: (c: Cliente) => void
  onSelectClienteForOrder?: (c: Cliente) => void
  empresaAtiva: EmpresaVinculo | null
  empresasCount: number
  onSwitchEmpresa: () => void
  onLogout: () => void
  onReloadData?: () => Promise<void> | void
  autoOpenNewClient?: boolean
  onClearAutoOpenNewClient?: () => void
}

type SettingsScreen = 'menu' | 'clientes' | 'novo_cliente' | 'perfil' | 'alcada'

export function MaisView({
  currentUser,
  onUpdateUser,
  clientes,
  onClienteCreated,
  onSelectClienteForOrder,
  empresaAtiva,
  empresasCount,
  onSwitchEmpresa,
  onLogout,
  onReloadData,
  autoOpenNewClient = false,
  onClearAutoOpenNewClient,
}: MaisViewProps) {
  const [screen, setScreen] = useState<SettingsScreen>(autoOpenNewClient ? 'novo_cliente' : 'menu')
  const [clienteSearch, setClienteSearch] = useState('')
  const [salvandoCliente, setSalvandoCliente] = useState(false)
  const [buscandoCep, setBuscandoCep] = useState(false)
  const [sincronizando, setSincronizando] = useState(false)

  useEffect(() => {
    if (autoOpenNewClient) {
      setScreen('novo_cliente')
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
    if (!clienteForm.razao_social.trim() || !clienteForm.cpf_cnpj.trim()) {
      alert('Razão Social / Nome e CPF/CNPJ são obrigatórios.')
      return
    }

    setSalvandoCliente(true)
    try {
      const salvo = await criarCliente(clienteForm)
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
        observacoes: '',
      })
      setScreen('clientes')
      triggerToast('Cliente cadastrado e sincronizado com o ERP!')
    } catch (err: any) {
      alert(`Falha ao cadastrar cliente: ${err.message || err}`)
    } finally {
      setSalvandoCliente(false)
    }
  }

  const handleSalvarPerfil = async (e: React.FormEvent) => {
    e.preventDefault()
    if (novoPin && novoPin !== confirmaPin) {
      alert('O PIN e a confirmação não coincidem.')
      return
    }
    if (novoPin && (novoPin.length < 4 || novoPin.length > 6)) {
      alert('O PIN precisa ter entre 4 e 6 dígitos numéricos.')
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
      alert(`Falha ao atualizar dados: ${err.message || err}`)
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

  const screenTitle: Record<SettingsScreen, { title: string; subtitle: string }> = {
    menu: { title: 'Configurações', subtitle: 'Conta, carteira de clientes e preferências' },
    clientes: { title: 'Carteira de Clientes', subtitle: `${clientes.length} clientes vinculados` },
    novo_cliente: { title: 'Novo Cliente', subtitle: 'Cadastro rápido integrado ao ERP' },
    perfil: { title: 'Perfil e Segurança', subtitle: 'Dados do representante e PIN de acesso' },
    alcada: { title: 'Alçada Comercial', subtitle: 'Regras de desconto e sincronização' },
  }

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-[#F0F2F5] pb-24">
      {/* Top App Bar Estilo WhatsApp */}
      <header className="sticky top-0 z-20 bg-[#0F3C46] text-white shadow-sm">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3.5">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {screen !== 'menu' ? (
              <button
                type="button"
                onClick={() => setScreen('menu')}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 active:scale-95 transition"
                aria-label="Voltar"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
            ) : (
              <AppLogo product="vendas" size="sm" showText={false} variant="dark" />
            )}
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-base sm:text-lg font-extrabold tracking-tight leading-tight">
                {screenTitle[screen].title}
              </h1>
              <p className="truncate text-[11px] text-teal-200/90">
                {screenTitle[screen].subtitle}
              </p>
            </div>
          </div>

          {screen === 'clientes' && (
            <button
              type="button"
              onClick={() => setScreen('novo_cliente')}
              className="flex items-center gap-1.5 rounded-full bg-emerald-500 px-3.5 py-1.5 text-xs font-extrabold text-white shadow-xs hover:bg-emerald-400 active:scale-95 transition shrink-0"
            >
              <UserPlus className="h-3.5 w-3.5" />
              <span>Novo</span>
            </button>
          )}
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-3 py-3.5 sm:px-6 sm:py-5 space-y-4">
        {/* ================= TELA PRINCIPAL: MENU ESTILO WHATSAPP ================= */}
        {screen === 'menu' && (
          <>
            {/* Card de Perfil Estilo WhatsApp (Topo) */}
            <button
              type="button"
              onClick={() => setScreen('perfil')}
              className="w-full rounded-2xl bg-white p-4 shadow-2xs border border-slate-200/70 flex items-center justify-between gap-3.5 text-left hover:bg-slate-50/80 active:scale-[0.99] transition"
            >
              <div className="flex items-center gap-3.5 min-w-0 flex-1">
                <div className="relative shrink-0">
                  <div className="flex h-15 w-15 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-700 text-white font-black text-xl shadow-sm">
                    {initials}
                  </div>
                  <span
                    className="absolute bottom-0 right-0 h-4 w-4 rounded-full bg-emerald-500 ring-2 ring-white"
                    title="Online"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <h2 className="text-base font-extrabold text-slate-900 truncate">
                      {currentUser?.nome || 'Representante Comercial'}
                    </h2>
                    <BadgeCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                  </div>
                  <p className="text-xs text-slate-500 truncate mt-0.5">
                    {currentUser?.email || 'Representante autorizado'}
                  </p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200/60">
                      Desc. máx: {limiteDesconto}%
                    </span>
                    {currentUser?.cpf ? (
                      <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-mono font-semibold text-slate-600">
                        CPF: {currentUser.cpf}
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                        Alterar PIN / Dados
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-slate-400 shrink-0" />
            </button>

            {/* Grupo 1: Comercial & Carteira de Clientes */}
            <div className="space-y-1.5">
              <p className="px-2 text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                Comercial & Clientes
              </p>
              <div className="rounded-2xl bg-white shadow-2xs border border-slate-200/70 divide-y divide-slate-100 overflow-hidden">
                {/* Item: Minha Carteira de Clientes */}
                <button
                  type="button"
                  onClick={() => setScreen('clientes')}
                  className="w-full flex items-center justify-between gap-3 px-4 py-3.5 text-left hover:bg-slate-50 active:bg-slate-100 transition"
                >
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-2xs">
                      <Users className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-slate-900 truncate">
                        Minha Carteira de Clientes
                      </p>
                      <p className="text-xs text-slate-500 truncate mt-0.5">
                        Consultar clientes ou iniciar um novo pedido
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-extrabold text-emerald-700 border border-emerald-200/60">
                      {clientes.length}
                    </span>
                    <ChevronRight className="h-4 w-4 text-slate-400" />
                  </div>
                </button>

                {/* Item: Cadastrar Novo Cliente */}
                <button
                  type="button"
                  onClick={() => setScreen('novo_cliente')}
                  className="w-full flex items-center justify-between gap-3 px-4 py-3.5 text-left hover:bg-slate-50 active:bg-slate-100 transition"
                >
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-600 text-white shadow-2xs">
                      <UserPlus className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-slate-900 truncate">
                        Cadastrar Novo Cliente
                      </p>
                      <p className="text-xs text-slate-500 truncate mt-0.5">
                        Preenchimento automático por CEP e envio ao ERP
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-400 shrink-0" />
                </button>

                {/* Item: Alçada de Desconto & Regras */}
                <button
                  type="button"
                  onClick={() => setScreen('alcada')}
                  className="w-full flex items-center justify-between gap-3 px-4 py-3.5 text-left hover:bg-slate-50 active:bg-slate-100 transition"
                >
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white shadow-2xs">
                      <Percent className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-slate-900 truncate">
                        Alçada de Desconto & Regras
                      </p>
                      <p className="text-xs text-slate-500 truncate mt-0.5">
                        Limite máximo de {limiteDesconto}% por item no pedido
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-extrabold text-amber-800 border border-amber-200">
                      {limiteDesconto}%
                    </span>
                    <ChevronRight className="h-4 w-4 text-slate-400" />
                  </div>
                </button>
              </div>
            </div>

            {/* Grupo 2: Conta, Empresa & Sincronização */}
            <div className="space-y-1.5">
              <p className="px-2 text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                Conta & Aplicativo
              </p>
              <div className="rounded-2xl bg-white shadow-2xs border border-slate-200/70 divide-y divide-slate-100 overflow-hidden">
                {/* Item: Conta & PIN */}
                <button
                  type="button"
                  onClick={() => setScreen('perfil')}
                  className="w-full flex items-center justify-between gap-3 px-4 py-3.5 text-left hover:bg-slate-50 active:bg-slate-100 transition"
                >
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500 text-white shadow-2xs">
                      <KeyRound className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-slate-900 truncate">
                        Segurança & PIN de Acesso
                      </p>
                      <p className="text-xs text-slate-500 truncate mt-0.5">
                        Alterar PIN numérico, telefone e e-mail
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-400 shrink-0" />
                </button>

                {/* Item: Empresa Ativa */}
                <button
                  type="button"
                  onClick={() => {
                    if (empresasCount > 1) {
                      onSwitchEmpresa()
                    } else {
                      triggerToast(
                        `Empresa ativa: ${empresaAtiva?.nome_fantasia || empresaAtiva?.razao_social || 'A&C Distribuidora'}`
                      )
                    }
                  }}
                  className="w-full flex items-center justify-between gap-3 px-4 py-3.5 text-left hover:bg-slate-50 active:bg-slate-100 transition"
                >
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-500 text-white shadow-2xs">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-slate-900 truncate">
                        Empresa Representada
                      </p>
                      <p className="text-xs text-slate-500 truncate mt-0.5">
                        {empresaAtiva?.nome_fantasia || empresaAtiva?.razao_social || 'A&C Distribuidora'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {empresasCount > 1 ? (
                      <span className="rounded-full bg-sky-50 px-2.5 py-0.5 text-[11px] font-bold text-sky-700 border border-sky-200">
                        Trocar ({empresasCount})
                      </span>
                    ) : (
                      <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-600">
                        Ativa
                      </span>
                    )}
                    <ChevronRight className="h-4 w-4 text-slate-400" />
                  </div>
                </button>

                {/* Item: Sincronizar Catálogo Agora */}
                {onReloadData && (
                  <button
                    type="button"
                    onClick={handleSincronizarAgora}
                    disabled={sincronizando}
                    className="w-full flex items-center justify-between gap-3 px-4 py-3.5 text-left hover:bg-slate-50 active:bg-slate-100 transition disabled:opacity-60"
                  >
                    <div className="flex items-center gap-3.5 min-w-0 flex-1">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-500 text-white shadow-2xs">
                        <RefreshCw className={`h-5 w-5 ${sincronizando ? 'animate-spin' : ''}`} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-slate-900 truncate">
                          Sincronizar Dados Agora
                        </p>
                        <p className="text-xs text-slate-500 truncate mt-0.5">
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
            <div className="rounded-2xl bg-white shadow-2xs border border-slate-200/70 overflow-hidden">
              <button
                type="button"
                onClick={onLogout}
                className="w-full flex items-center justify-between gap-3 px-4 py-3.5 text-left hover:bg-rose-50/60 active:bg-rose-100/60 transition"
              >
                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600 border border-rose-200/60">
                    <LogOut className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-rose-600 truncate">
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

            {/* Rodapé Institucional */}
            <div className="flex flex-col items-center justify-center pt-3 pb-2 opacity-80">
              <AppLogo
                product="vendas"
                size="sm"
                showText={true}
                showSublabel={true}
                sublabel="Ecossistema Thothfy • Força de Vendas"
              />
            </div>
          </>
        )}

        {/* ================= SUB-TELA: CARTEIRA DE CLIENTES (ESTILO CONTATOS WHATSAPP) ================= */}
        {screen === 'clientes' && (
          <div className="space-y-3">
            {/* Barra de Busca Fixa */}
            <div className="rounded-2xl bg-white p-3 shadow-2xs border border-slate-200/70">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="search"
                  value={clienteSearch}
                  onChange={(e) => setClienteSearch(e.target.value)}
                  placeholder="Buscar por razão social, fantasia, CNPJ ou cidade…"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-9 text-xs font-medium text-slate-900 outline-none focus:border-emerald-600 focus:bg-white"
                />
                {clienteSearch && (
                  <button
                    type="button"
                    onClick={() => setClienteSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:bg-slate-100"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Lista de Clientes Estilo Contatos do WhatsApp */}
            <div className="rounded-2xl bg-white shadow-2xs border border-slate-200/70 divide-y divide-slate-100 overflow-hidden">
              {filteredClientes.length === 0 ? (
                <div className="p-10 text-center space-y-3">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                    <Users className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-700">Nenhum cliente encontrado</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Cadastre um novo cliente para iniciar seus pedidos
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setScreen('novo_cliente')}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700"
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
                      className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-slate-50/80 transition"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal-50 text-teal-800 font-extrabold text-xs border border-teal-200/60">
                          {cliInitials}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                              {c.nome_fantasia || c.razao_social}
                            </p>
                            {c.bloqueado && (
                              <span className="shrink-0 rounded-full bg-rose-100 px-1.5 py-0.5 text-[9px] font-bold text-rose-700">
                                Bloqueado
                              </span>
                            )}
                          </div>
                          {c.nome_fantasia && c.razao_social !== c.nome_fantasia && (
                            <p className="text-[11px] text-slate-500 truncate">{c.razao_social}</p>
                          )}
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-slate-400 mt-0.5">
                            <span className="font-mono">{c.cpf_cnpj}</span>
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
                          className="flex items-center gap-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 px-3 py-2 text-[11px] font-extrabold text-white shadow-2xs transition shrink-0"
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

        {/* ================= SUB-TELA: CADASTRAR NOVO CLIENTE ================= */}
        {screen === 'novo_cliente' && (
          <form onSubmit={handleSalvarNovoCliente} className="space-y-4">
            <div className="rounded-2xl bg-emerald-50 border border-emerald-200/70 p-3.5 text-xs text-emerald-900 flex items-start gap-2.5">
              <Sparkles className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              <span className="leading-relaxed">
                O cliente cadastrado é vinculado automaticamente à sua carteira de representante e sincronizado com o <strong>Omie ERP</strong>.
              </span>
            </div>

            {/* Bloco 1: Identificação */}
            <div className="rounded-2xl bg-white p-4 shadow-2xs border border-slate-200/70 space-y-3.5 text-xs">
              <h3 className="font-extrabold text-slate-900 text-sm border-b border-slate-100 pb-2">
                1. Identificação do Cliente
              </h3>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Razão Social / Nome Completo *
                </label>
                <input
                  type="text"
                  required
                  value={clienteForm.razao_social}
                  onChange={(e) => setClienteForm({ ...clienteForm, razao_social: e.target.value })}
                  placeholder="Ex: Comercial Silva Ltda ou João da Silva"
                  className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50/70 focus:bg-white focus:outline-emerald-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nome Fantasia</label>
                  <input
                    type="text"
                    value={clienteForm.nome_fantasia || ''}
                    onChange={(e) => setClienteForm({ ...clienteForm, nome_fantasia: e.target.value })}
                    placeholder="Nome comercial da loja"
                    className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50/70 focus:bg-white focus:outline-emerald-600"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">CPF ou CNPJ *</label>
                  <input
                    type="text"
                    required
                    value={clienteForm.cpf_cnpj}
                    onChange={(e) => setClienteForm({ ...clienteForm, cpf_cnpj: e.target.value })}
                    placeholder="00.000.000/0000-00"
                    className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50/70 font-mono focus:bg-white focus:outline-emerald-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <Phone className="h-3.5 w-3.5 text-slate-400" /> Telefone / WhatsApp
                  </label>
                  <input
                    type="tel"
                    value={clienteForm.telefone || ''}
                    onChange={(e) => setClienteForm({ ...clienteForm, telefone: e.target.value })}
                    placeholder="(00) 00000-0000"
                    className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50/70 focus:bg-white focus:outline-emerald-600"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <Mail className="h-3.5 w-3.5 text-slate-400" /> E-mail para NFe / Pedidos
                  </label>
                  <input
                    type="email"
                    value={clienteForm.email || ''}
                    onChange={(e) => setClienteForm({ ...clienteForm, email: e.target.value })}
                    placeholder="cliente@empresa.com.br"
                    className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50/70 focus:bg-white focus:outline-emerald-600"
                  />
                </div>
              </div>
            </div>

            {/* Bloco 2: Endereço com Busca Automática de CEP */}
            <div className="rounded-2xl bg-white p-4 shadow-2xs border border-slate-200/70 space-y-3.5 text-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-emerald-600" /> 2. Endereço de Entrega / Faturamento
                </h3>
                {buscandoCep && (
                  <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Consultando CEP…
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">CEP</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={clienteForm.cep || ''}
                    onChange={(e) => handleCepChange(e.target.value)}
                    placeholder="00000-000"
                    className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50/70 font-mono focus:bg-white focus:outline-emerald-600"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Logradouro / Rua</label>
                  <input
                    type="text"
                    value={clienteForm.logradouro || ''}
                    onChange={(e) => setClienteForm({ ...clienteForm, logradouro: e.target.value })}
                    placeholder="Rua, Avenida, Rodovia…"
                    className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50/70 focus:bg-white focus:outline-emerald-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Número</label>
                  <input
                    type="text"
                    value={clienteForm.numero || ''}
                    onChange={(e) => setClienteForm({ ...clienteForm, numero: e.target.value })}
                    placeholder="Nº"
                    className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50/70 focus:bg-white focus:outline-emerald-600"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Bairro</label>
                  <input
                    type="text"
                    value={clienteForm.bairro || ''}
                    onChange={(e) => setClienteForm({ ...clienteForm, bairro: e.target.value })}
                    placeholder="Bairro"
                    className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50/70 focus:bg-white focus:outline-emerald-600"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Cidade</label>
                  <input
                    type="text"
                    value={clienteForm.cidade || ''}
                    onChange={(e) => setClienteForm({ ...clienteForm, cidade: e.target.value })}
                    placeholder="Cidade"
                    className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50/70 focus:bg-white focus:outline-emerald-600"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">UF</label>
                  <input
                    type="text"
                    maxLength={2}
                    value={clienteForm.estado || ''}
                    onChange={(e) =>
                      setClienteForm({ ...clienteForm, estado: e.target.value.toUpperCase() })
                    }
                    placeholder="UF"
                    className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50/70 uppercase font-mono focus:bg-white focus:outline-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Observações Comerciais</label>
                <textarea
                  rows={2}
                  value={clienteForm.observacoes || ''}
                  onChange={(e) => setClienteForm({ ...clienteForm, observacoes: e.target.value })}
                  placeholder="Horário de recebimento, referências, inscrição estadual…"
                  className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50/70 focus:bg-white focus:outline-emerald-600"
                />
              </div>
            </div>

            <div className="flex items-center gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setScreen('menu')}
                className="flex-1 py-3.5 rounded-xl border border-slate-300 bg-white text-slate-700 font-bold text-xs hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={salvandoCliente}
                className="flex-[2] flex items-center justify-center gap-2 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md shadow-emerald-600/20 disabled:opacity-50"
              >
                {salvandoCliente && <Loader2 className="h-4 w-4 animate-spin" />}
                <span>Salvar Cliente & Sincronizar ERP</span>
              </button>
            </div>
          </form>
        )}

        {/* ================= SUB-TELA: PERFIL & PIN DE SEGURANÇA ================= */}
        {screen === 'perfil' && (
          <form onSubmit={handleSalvarPerfil} className="space-y-4">
            <div className="rounded-2xl bg-white p-4 shadow-2xs border border-slate-200/70 space-y-3.5 text-xs">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-700 text-white font-black text-base">
                  {initials}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-extrabold text-sm text-slate-900 truncate">
                    {currentUser?.nome || 'Representante'}
                  </h3>
                  <p className="text-[11px] text-slate-500 truncate">
                    Código Omie ERP: <span className="font-mono">{currentUser?.id?.slice(0, 8)}</span>
                  </p>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nome Completo</label>
                <input
                  type="text"
                  required
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50/70 focus:bg-white focus:outline-emerald-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">E-mail Corporativo</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50/70 focus:bg-white focus:outline-emerald-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Telefone / WhatsApp</label>
                <input
                  type="tel"
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  placeholder="(00) 00000-0000"
                  className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50/70 focus:bg-white focus:outline-emerald-600"
                />
              </div>
            </div>

            {/* Bloco PIN de Acesso */}
            <div className="rounded-2xl bg-white p-4 shadow-2xs border border-slate-200/70 space-y-3.5 text-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center gap-2">
                  <KeyRound className="h-4 w-4 text-indigo-600" />
                  <h3 className="font-extrabold text-sm text-slate-900">PIN Numérico de Acesso</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-slate-800"
                >
                  {showPin ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  <span>{showPin ? 'Ocultar' : 'Mostrar'}</span>
                </button>
              </div>

              <p className="text-[11px] text-slate-500 leading-relaxed">
                O PIN numérico (4 a 6 dígitos) é usado para entrar rapidamente no aplicativo. Deixe em branco caso não queira alterar seu PIN atual.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Novo PIN (4 a 6 dígitos)</label>
                  <input
                    type={showPin ? 'text' : 'password'}
                    maxLength={6}
                    inputMode="numeric"
                    value={novoPin}
                    onChange={(e) => setNovoPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="••••"
                    className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50/70 font-mono tracking-widest text-center text-sm focus:bg-white focus:outline-emerald-600"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Confirmar Novo PIN</label>
                  <input
                    type={showPin ? 'text' : 'password'}
                    maxLength={6}
                    inputMode="numeric"
                    value={confirmaPin}
                    onChange={(e) => setConfirmaPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="••••"
                    className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50/70 font-mono tracking-widest text-center text-sm focus:bg-white focus:outline-emerald-600"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setScreen('menu')}
                className="flex-1 py-3.5 rounded-xl border border-slate-300 bg-white text-slate-700 font-bold text-xs hover:bg-slate-50"
              >
                Voltar
              </button>
              <button
                type="submit"
                disabled={salvandoPerfil}
                className="flex-[2] flex items-center justify-center gap-2 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md shadow-emerald-600/20 disabled:opacity-50"
              >
                {salvandoPerfil && <Loader2 className="h-4 w-4 animate-spin" />}
                <span>Salvar Dados & PIN</span>
              </button>
            </div>
          </form>
        )}

        {/* ================= SUB-TELA: ALÇADA COMERCIAL & REGRAS ================= */}
        {screen === 'alcada' && (
          <div className="space-y-3">
            <div className="rounded-2xl bg-white p-5 shadow-2xs border border-slate-200/70 space-y-4">
              <div className="flex items-center gap-3.5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-sm">
                  <Percent className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-amber-600">
                    Limite Individual no Pedido
                  </p>
                  <h3 className="text-2xl font-black text-slate-900">
                    Até {limiteDesconto}% de desconto
                  </h3>
                </div>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                Você pode aplicar descontos diretos de até <strong>{limiteDesconto}%</strong> por item diretamente no carrinho de compras, além de selecionar as <strong>Tabelas de Preço</strong> promocionais ou de atacado sincronizadas com o ERP.
              </p>
            </div>

            <div className="rounded-2xl bg-white p-5 shadow-2xs border border-slate-200/70 space-y-3">
              <div className="flex items-center gap-2.5 text-emerald-700 font-extrabold text-sm">
                <ShieldCheck className="h-5 w-5" />
                <span>Integração ERP Ativa (Omie ERP)</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Todos os pedidos transmitidos e novos clientes cadastrados são enviados automaticamente para o faturamento na <strong>Omie ERP</strong> já vinculados ao seu código de representante comercial.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Toast Flutuante */}
      {toastMsg && (
        <div className="fixed bottom-20 left-1/2 z-50 -translate-x-1/2 flex items-center gap-2 rounded-full bg-slate-900/95 px-4 py-2.5 text-xs font-semibold text-white shadow-lg backdrop-blur max-w-[90vw] truncate">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span className="truncate">{toastMsg}</span>
        </div>
      )}
    </div>
  )
}
