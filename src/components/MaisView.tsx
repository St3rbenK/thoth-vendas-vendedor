import React, { useState } from 'react'
import {
  User,
  Users,
  KeyRound,
  ShieldCheck,
  Building2,
  LogOut,
  Plus,
  Search,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Percent,
  MapPin,
  Phone,
  Mail,
  Loader2,
  X,
} from 'lucide-react'
import { criarCliente, updateVendedorPerfil } from '../services/api'
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
  autoOpenNewClient?: boolean
  onClearAutoOpenNewClient?: () => void
}

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
  autoOpenNewClient = false,
  onClearAutoOpenNewClient,
}: MaisViewProps) {
  // Modal Novo Cliente
  const [novoClienteModalOpen, setNovoClienteModalOpen] = useState(autoOpenNewClient)

  React.useEffect(() => {
    if (autoOpenNewClient) {
      setNovoClienteModalOpen(true)
      if (onClearAutoOpenNewClient) onClearAutoOpenNewClient()
    }
  }, [autoOpenNewClient, onClearAutoOpenNewClient])
  const [clienteSearch, setClienteSearch] = useState('')
  const [salvandoCliente, setSalvandoCliente] = useState(false)
  const [buscandoCep, setBuscandoCep] = useState(false)

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

  // Modal / Edição de Perfil e PIN
  const [editPerfilModalOpen, setEditPerfilModalOpen] = useState(false)
  const [nome, setNome] = useState(currentUser?.nome || '')
  const [email, setEmail] = useState(currentUser?.email || '')
  const [telefone, setTelefone] = useState(currentUser?.telefone || '')
  const [novoPin, setNovoPin] = useState('')
  const [confirmaPin, setConfirmaPin] = useState('')
  const [showPin, setShowPin] = useState(false)
  const [salvandoPerfil, setSalvandoPerfil] = useState(false)
  const [toastMsg, setToastMsg] = useState<string | null>(null)

  const triggerToast = (msg: string) => {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(null), 3000)
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
      setNovoClienteModalOpen(false)
      triggerToast('✅ Cliente cadastrado e sincronizado com o ERP!')
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
      setEditPerfilModalOpen(false)
      setNovoPin('')
      setConfirmaPin('')
      triggerToast('✅ Dados do vendedor e PIN atualizados!')
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
      c.cpf_cnpj.includes(term)
    )
  })

  const limiteDesconto = currentUser?.limite_desconto_pct ?? 15

  return (
    <div className="mx-auto max-w-4xl px-3 py-4 sm:px-6 sm:py-6 space-y-6">
      {/* Cabeçalho Perfil */}
      <div className="rounded-3xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white font-black text-xl shadow-md shadow-teal-500/20">
            {currentUser?.nome?.charAt(0).toUpperCase() || 'V'}
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900">{currentUser?.nome || 'Vendedor'}</h2>
            <p className="text-xs text-slate-500">{currentUser?.email}</p>
            {currentUser?.cpf && (
              <p className="text-xs text-teal-600 font-mono font-bold mt-0.5">CPF: {currentUser.cpf}</p>
            )}
          </div>
        </div>

        <button
          onClick={() => {
            setNome(currentUser?.nome || '')
            setEmail(currentUser?.email || '')
            setTelefone(currentUser?.telefone || '')
            setNovoPin('')
            setConfirmaPin('')
            setEditPerfilModalOpen(true)
          }}
          className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors shadow-xs"
        >
          <KeyRound className="h-4 w-4 text-teal-400" />
          <span>Alterar PIN & Dados</span>
        </button>
      </div>

      {/* Card Informativo de Permissões Comerciais */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-2xl border border-teal-100 bg-teal-50/70 p-4">
          <div className="flex items-center gap-2 text-teal-700 text-xs font-bold mb-1">
            <Percent className="h-4 w-4" />
            <span>Limite de Desconto</span>
          </div>
          <div className="text-xl font-black text-teal-900">{limiteDesconto}%</div>
          <p className="text-[10px] text-teal-700/80 mt-0.5">
            Máximo autorizado por item no pedido
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4">
          <div className="flex items-center gap-2 text-slate-700 text-xs font-bold mb-1">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span>Segurança da Conta</span>
          </div>
          <div className="text-sm font-bold text-slate-900">PIN de Acesso Ativo</div>
          <p className="text-[10px] text-slate-400 mt-0.5">
            Login via CPF + PIN seguro
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4">
          <div className="flex items-center gap-2 text-slate-700 text-xs font-bold mb-1">
            <Building2 className="h-4 w-4 text-blue-600" />
            <span>Empresa Ativa</span>
          </div>
          <div className="text-sm font-bold text-slate-900 truncate">
            {empresaAtiva?.nome_fantasia || empresaAtiva?.razao_social || 'Thoth Vendas'}
          </div>
          {empresasCount > 1 ? (
            <button
              onClick={onSwitchEmpresa}
              className="text-[10px] text-teal-600 font-bold hover:underline mt-0.5"
            >
              Alternar entre {empresasCount} empresas
            </button>
          ) : (
            <p className="text-[10px] text-slate-400 mt-0.5">Empresa única vinculada</p>
          )}
        </div>
      </div>

      {/* Seção: Carteira de Clientes */}
      <div className="rounded-3xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <Users className="h-5 w-5 text-teal-600" />
              Minha Carteira de Clientes
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {clientes.length} clientes cadastrados e vinculados ao seu perfil
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative w-full sm:w-56">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={clienteSearch}
                onChange={(e) => setClienteSearch(e.target.value)}
                placeholder="Buscar cliente..."
                className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-teal-500"
              />
            </div>
            <button
              onClick={() => setNovoClienteModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-all shadow-xs shrink-0"
            >
              <Plus className="h-4 w-4" />
              <span>Novo Cliente</span>
            </button>
          </div>
        </div>

        {/* Lista de Clientes */}
        <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto pr-1">
          {filteredClientes.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              Nenhum cliente encontrado. Clique em "+ Novo Cliente" para cadastrar!
            </div>
          ) : (
            filteredClientes.map((c) => (
              <div key={c.id} className="py-3 flex items-center justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-bold text-slate-800 truncate">{c.razao_social}</p>
                    {c.bloqueado && (
                      <span className="text-[9px] bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded-full font-bold">
                        Bloqueado
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-slate-400 mt-0.5">
                    <span className="font-mono">{c.cpf_cnpj}</span>
                    {c.cidade && <span>• {c.cidade}/{c.estado}</span>}
                    {c.telefone && <span>• {c.telefone}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {onSelectClienteForOrder && !c.bloqueado && (
                    <button
                      type="button"
                      onClick={() => onSelectClienteForOrder(c)}
                      className="text-[11px] font-bold text-white bg-teal-600 hover:bg-teal-700 px-2.5 py-1 rounded-lg shadow-2xs transition-colors"
                    >
                      Vender
                    </button>
                  )}
                  <span className="hidden sm:inline-block text-[10px] font-mono text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full">
                    Ativo
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Botão de Logout */}
      <div className="pt-2">
        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 p-3.5 rounded-2xl border border-rose-200 bg-rose-50/70 hover:bg-rose-100/80 text-rose-700 font-bold text-xs transition-colors shadow-xs"
        >
          <LogOut className="h-4 w-4" />
          <span>Sair do Aplicativo de Vendas</span>
        </button>
      </div>

      {/* Modal: Cadastro de Novo Cliente */}
      {novoClienteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs sm:p-4">
          <div className="w-full max-w-lg max-h-[90dvh] flex flex-col rounded-t-3xl sm:rounded-3xl bg-white shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-teal-600" />
                <h3 className="font-bold text-base text-slate-900">Cadastrar Novo Cliente</h3>
              </div>
              <button
                onClick={() => setNovoClienteModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSalvarNovoCliente} className="flex-1 overflow-y-auto p-5 space-y-3.5 text-xs">
              <div className="p-3 rounded-xl bg-teal-50 border border-teal-100 text-teal-800 text-[11px] leading-relaxed">
                Este cliente será vinculado automaticamente à sua carteira de vendas e sincronizado com o ERP da empresa.
              </div>

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
                  className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-teal-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nome Fantasia</label>
                  <input
                    type="text"
                    value={clienteForm.nome_fantasia || ''}
                    onChange={(e) => setClienteForm({ ...clienteForm, nome_fantasia: e.target.value })}
                    placeholder="Nome comercial"
                    className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-teal-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">CPF ou CNPJ *</label>
                  <input
                    type="text"
                    required
                    value={clienteForm.cpf_cnpj}
                    onChange={(e) => setClienteForm({ ...clienteForm, cpf_cnpj: e.target.value })}
                    placeholder="000.000.000-00 ou CNPJ"
                    className="w-full p-2.5 rounded-xl border border-slate-200 font-mono focus:outline-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Telefone / WhatsApp</label>
                  <input
                    type="text"
                    value={clienteForm.telefone || ''}
                    onChange={(e) => setClienteForm({ ...clienteForm, telefone: e.target.value })}
                    placeholder="(00) 00000-0000"
                    className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-teal-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={clienteForm.email || ''}
                    onChange={(e) => setClienteForm({ ...clienteForm, email: e.target.value })}
                    placeholder="cliente@email.com"
                    className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-teal-500"
                  />
                </div>
              </div>

              {/* Endereço com CEP Automático */}
              <div className="pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-teal-600" /> Endereço do Cliente
                  </span>
                  {buscandoCep && (
                    <span className="text-[10px] text-teal-600 flex items-center gap-1">
                      <Loader2 className="h-3 w-3 animate-spin" /> Buscando CEP...
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">CEP</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={clienteForm.cep || ''}
                      onChange={(e) => handleCepChange(e.target.value)}
                      placeholder="00000-000"
                      className="w-full p-2.5 rounded-xl border border-slate-200 font-mono focus:outline-teal-500"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] text-slate-500 mb-1">Logradouro / Rua</label>
                    <input
                      type="text"
                      value={clienteForm.logradouro || ''}
                      onChange={(e) => setClienteForm({ ...clienteForm, logradouro: e.target.value })}
                      placeholder="Rua, Av..."
                      className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-teal-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">Número</label>
                    <input
                      type="text"
                      value={clienteForm.numero || ''}
                      onChange={(e) => setClienteForm({ ...clienteForm, numero: e.target.value })}
                      placeholder="Nº"
                      className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">Bairro</label>
                    <input
                      type="text"
                      value={clienteForm.bairro || ''}
                      onChange={(e) => setClienteForm({ ...clienteForm, bairro: e.target.value })}
                      placeholder="Bairro"
                      className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-teal-500"
                    />
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-[11px] text-slate-500 mb-1">Cidade / UF</label>
                    <input
                      type="text"
                      value={clienteForm.cidade ? `${clienteForm.cidade}/${clienteForm.estado || ''}` : ''}
                      onChange={(e) => setClienteForm({ ...clienteForm, cidade: e.target.value })}
                      placeholder="Cidade/UF"
                      className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-teal-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Observações do Cliente</label>
                <textarea
                  rows={2}
                  value={clienteForm.observacoes || ''}
                  onChange={(e) => setClienteForm({ ...clienteForm, observacoes: e.target.value })}
                  placeholder="Informações adicionais para pedidos..."
                  className="w-full p-2 rounded-xl border border-slate-200 focus:outline-teal-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setNovoClienteModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvandoCliente}
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold shadow-md disabled:opacity-50"
                >
                  {salvandoCliente && <Loader2 className="h-4 w-4 animate-spin" />}
                  <span>Salvar & Sincronizar ERP</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Alterar PIN e Dados do Vendedor */}
      {editPerfilModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4">
          <div className="w-full max-w-md rounded-3xl bg-white shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div className="flex items-center gap-2">
                <KeyRound className="h-5 w-5 text-teal-600" />
                <h3 className="font-bold text-base text-slate-900">Segurança & Meus Dados</h3>
              </div>
              <button
                onClick={() => setEditPerfilModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSalvarPerfil} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nome Completo</label>
                <input
                  type="text"
                  required
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-teal-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-teal-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Telefone / WhatsApp</label>
                <input
                  type="text"
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  placeholder="(00) 00000-0000"
                  className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-teal-500"
                />
              </div>

              {/* Seção PIN de Segurança */}
              <div className="pt-2 border-t border-slate-100 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 flex items-center gap-1.5">
                    <KeyRound className="h-4 w-4 text-teal-600" /> Alterar PIN de Acesso
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    {showPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">Novo PIN (4 a 6 dígitos numéricos)</label>
                  <input
                    type={showPin ? 'text' : 'password'}
                    maxLength={6}
                    inputMode="numeric"
                    value={novoPin}
                    onChange={(e) => setNovoPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="Deixe em branco para não alterar"
                    className="w-full p-2.5 rounded-xl border border-slate-200 font-mono tracking-widest text-center text-sm focus:outline-teal-500"
                  />
                </div>

                {novoPin && (
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">Confirmar Novo PIN</label>
                    <input
                      type={showPin ? 'text' : 'password'}
                      maxLength={6}
                      inputMode="numeric"
                      value={confirmaPin}
                      onChange={(e) => setConfirmaPin(e.target.value.replace(/\D/g, ''))}
                      placeholder="Repita o novo PIN"
                      className="w-full p-2.5 rounded-xl border border-slate-200 font-mono tracking-widest text-center text-sm focus:outline-teal-500"
                    />
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditPerfilModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvandoPerfil}
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold shadow-md disabled:opacity-50"
                >
                  {salvandoPerfil && <Loader2 className="h-4 w-4 animate-spin" />}
                  <span>Salvar Alterações</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast Notificação */}
      {toastMsg && (
        <div className="fixed bottom-20 left-1/2 z-50 -translate-x-1/2 flex items-center gap-2 rounded-full bg-slate-900/90 px-4 py-2 text-xs font-semibold text-white shadow-lg backdrop-blur">
          <CheckCircle2 className="h-3.5 w-3.5 text-teal-400" />
          <span>{toastMsg}</span>
        </div>
      )}
    </div>
  )
}
