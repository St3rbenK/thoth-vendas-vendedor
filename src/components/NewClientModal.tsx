import React, { useEffect, useState } from 'react'
import {
  X,
  UserPlus,
  Sparkles,
  Phone,
  Mail,
  Tag,
  MapPin,
  Loader2,
  AlertCircle,
  FileText,
  User,
} from 'lucide-react'
import type { Cliente, NovoClientePayload, TabelaPreco } from '../types'
import { atualizarCliente, criarCliente } from '../services/api'

interface NewClientModalProps {
  isOpen: boolean
  onClose: () => void
  tabelas: TabelaPreco[]
  editingCliente?: Cliente | null
  onCreated: (cliente: Cliente) => void
  onUpdated?: (cliente: Cliente) => void
}

function formatCpfCnpjInput(val: string): string {
  const d = val.replace(/\D/g, '').slice(0, 14)
  if (d.length <= 11) {
    return d
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
  }
  return d
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2')
}

function formatPhoneInput(val: string): string {
  const d = val.replace(/\D/g, '').slice(0, 11)
  if (d.length <= 10) {
    return d
      .replace(/^(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d)/, '$1-$2')
  }
  return d
    .replace(/^(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2')
}

function formatCepInput(val: string): string {
  const limpo = val.replace(/\D/g, '').slice(0, 8)
  return limpo.length > 5 ? `${limpo.slice(0, 5)}-${limpo.slice(5)}` : limpo
}

const emptyClienteForm = (): NovoClientePayload => ({
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

function clienteToForm(c: Cliente): NovoClientePayload {
  return {
    razao_social: c.razao_social || '',
    nome_fantasia: c.nome_fantasia || '',
    cpf_cnpj: formatCpfCnpjInput(c.cpf_cnpj || ''),
    inscricao_estadual: c.inscricao_estadual || '',
    email: c.email || '',
    telefone: c.telefone ? formatPhoneInput(c.telefone) : '',
    celular: c.celular ? formatPhoneInput(c.celular) : '',
    contato_nome: c.contato_nome || '',
    cep: c.cep ? formatCepInput(c.cep) : '',
    logradouro: c.logradouro || '',
    numero: c.numero || '',
    complemento: c.complemento || '',
    bairro: c.bairro || '',
    cidade: c.cidade || '',
    estado: c.estado || '',
    tabela_preco_id: c.tabela_preco_id || '',
    observacoes: c.observacoes || '',
  }
}

export const NewClientModal: React.FC<NewClientModalProps> = ({
  isOpen,
  onClose,
  tabelas,
  editingCliente = null,
  onCreated,
  onUpdated,
}) => {
  const [clienteForm, setClienteForm] = useState<NovoClientePayload>(emptyClienteForm)
  const [salvando, setSalvando] = useState(false)
  const [buscandoCep, setBuscandoCep] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const isEditing = !!editingCliente

  useEffect(() => {
    if (!isOpen) return
    setFormError(null)
    if (editingCliente) {
      setClienteForm(clienteToForm(editingCliente))
    } else {
      setClienteForm(emptyClienteForm())
    }
  }, [isOpen, editingCliente])

  if (!isOpen) return null

  const handleCepChange = async (cepRaw: string) => {
    const limpo = cepRaw.replace(/\D/g, '').slice(0, 8)
    const fmt = formatCepInput(cepRaw)
    setClienteForm((prev) => ({ ...prev, cep: fmt }))

    if (limpo.length === 8) {
      setBuscandoCep(true)
      try {
        const res = await fetch(`https://viacep.com.br/ws/${limpo}/json/`)
        const data = await res.json()
        if (data && !data.erro) {
          setClienteForm((prev) => ({
            ...prev,
            logradouro: data.logradouro || prev.logradouro,
            bairro: data.bairro || prev.bairro,
            cidade: data.localidade || prev.cidade,
            estado: (data.uf || prev.estado || '').toUpperCase(),
          }))
        }
      } catch {
        // Falha silenciosa na consulta automática de CEP
      } finally {
        setBuscandoCep(false)
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)
    const docDigits = (clienteForm.cpf_cnpj || '').replace(/\D/g, '')
    if (!clienteForm.razao_social.trim() || (!isEditing && !docDigits)) {
      setFormError('Razão Social / Nome e CPF/CNPJ são obrigatórios.')
      return
    }
    if (!isEditing && docDigits.length !== 11 && docDigits.length !== 14) {
      setFormError('Informe um CPF (11 dígitos) ou CNPJ (14 dígitos) válido.')
      return
    }

    setSalvando(true)
    try {
      const payload: NovoClientePayload = {
        ...clienteForm,
        razao_social: clienteForm.razao_social.trim(),
        nome_fantasia: clienteForm.nome_fantasia?.trim() || '',
        inscricao_estadual: clienteForm.inscricao_estadual?.trim() || '',
        contato_nome: clienteForm.contato_nome?.trim() || '',
        tabela_preco_id: clienteForm.tabela_preco_id || undefined,
      }
      if (isEditing && editingCliente) {
        const atualizado = await atualizarCliente(editingCliente.id, payload)
        if (onUpdated) {
          onUpdated(atualizado)
        } else {
          onCreated(atualizado)
        }
      } else {
        const salvo = await criarCliente(payload)
        setClienteForm(emptyClienteForm())
        onCreated(salvo)
      }
      onClose()
    } catch (err: any) {
      setFormError(err?.message || 'Falha ao salvar cliente.')
    } finally {
      setSalvando(false)
    }
  }

  const inputClass =
    'w-full p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-700 bg-[#F8FAFC] dark:bg-slate-800/60 text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:border-[#00A19C] focus:ring-2 focus:ring-[#00A19C]/15 transition text-xs'

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-4">
      <div
        className="fixed inset-0 bg-slate-900/65 backdrop-blur-xs"
        onClick={() => {
          if (!salvando) onClose()
        }}
      />

      <div className="relative z-10 flex max-h-[92dvh] sm:max-h-[88vh] w-full max-w-xl flex-col rounded-t-2xl sm:rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3.5 sm:px-5 sm:py-4 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#00A19C]/10 text-[#00A19C]">
              <UserPlus className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <h2 className="font-display text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">
                {isEditing ? 'Editar Dados do Cliente' : 'Cadastrar Novo Cliente'}
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                {isEditing
                  ? 'Atualiza dados fiscais, inscrição estadual e endereço no ERP'
                  : 'Vinculado automaticamente à sua carteira e ao pedido'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              if (!salvando) onClose()
            }}
            className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-xs">
            {formError && (
              <div
                role="alert"
                className="rounded-xl border border-rose-200 dark:border-rose-500/20 bg-rose-50 dark:bg-rose-500/10 p-3 text-xs text-rose-700 dark:text-rose-400 flex items-start gap-2"
              >
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            {!isEditing && (
              <div className="rounded-xl bg-teal-50/80 dark:bg-[#00A19C]/10 border border-teal-200/80 dark:border-[#00A19C]/20 p-3 text-xs text-slate-800 dark:text-teal-200 flex items-start gap-2">
                <Sparkles className="h-4 w-4 text-[#00A19C] shrink-0 mt-0.5" />
                <span className="leading-relaxed">
                  Após salvar, este cliente já ficará selecionado automaticamente e será sincronizado com o ERP (incluindo Inscrição Estadual para faturamento).
                </span>
              </div>
            )}

            {/* 1. Identificação & Dados Fiscais */}
            <div className="space-y-3">
              <h3 className="font-display font-bold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">
                1. Identificação & Dados Fiscais
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
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                    <User className="h-3.5 w-3.5 text-slate-400" /> Contato / Comprador
                  </label>
                  <input
                    type="text"
                    value={clienteForm.contato_nome || ''}
                    onChange={(e) => setClienteForm({ ...clienteForm, contato_nome: e.target.value })}
                    placeholder="Nome do comprador ou responsável"
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    CPF ou CNPJ *
                  </label>
                  <input
                    type="text"
                    required
                    disabled={isEditing}
                    inputMode="numeric"
                    value={clienteForm.cpf_cnpj}
                    onChange={(e) =>
                      setClienteForm({ ...clienteForm, cpf_cnpj: formatCpfCnpjInput(e.target.value) })
                    }
                    placeholder="00.000.000/0000-00"
                    className={`${inputClass} font-mono tabular-nums disabled:opacity-60`}
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                      <FileText className="h-3.5 w-3.5 text-[#00A19C]" /> Inscrição Estadual
                    </label>
                    <button
                      type="button"
                      onClick={() => setClienteForm({ ...clienteForm, inscricao_estadual: 'ISENTO' })}
                      className="text-[10px] font-semibold text-[#00A19C] hover:underline"
                    >
                      Marcar ISENTO
                    </button>
                  </div>
                  <input
                    type="text"
                    value={clienteForm.inscricao_estadual || ''}
                    onChange={(e) =>
                      setClienteForm({
                        ...clienteForm,
                        inscricao_estadual: e.target.value.toUpperCase(),
                      })
                    }
                    placeholder="Número IE ou ISENTO"
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
                    inputMode="numeric"
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

            {/* 2. Endereço */}
            <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <h3 className="font-display font-bold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-[#00A19C]" /> 2. Endereço de Entrega / Faturamento
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
                  placeholder="Horário de recebimento, referências comerciais…"
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          {/* Sticky Footer */}
          <div className="flex items-center gap-2.5 border-t border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3.5 sm:px-5 shrink-0">
            <button
              type="button"
              disabled={salvando}
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 font-semibold text-xs hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={salvando}
              className="flex-[2] flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#00A19C] hover:bg-[#008C87] text-white font-semibold text-xs shadow-sm disabled:opacity-50"
            >
              {salvando && <Loader2 className="h-4 w-4 animate-spin" />}
              <span>{isEditing ? 'Salvar Alterações no ERP' : 'Salvar & Selecionar Cliente'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
