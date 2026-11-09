import React, { useState } from 'react'
import { Store, ShieldCheck, KeyRound, Building2, ChevronRight, Loader2, AlertCircle, Eye, EyeOff, ArrowLeft } from 'lucide-react'
import { loginVendedor, selecionarEmpresa } from '../services/api'
import type { EmpresaVinculo, UsuarioVendedor } from '../types'

interface VendedorAuthScreenProps {
  onSuccess: (empresa: EmpresaVinculo, user: UsuarioVendedor, empresas: EmpresaVinculo[]) => void
}

export const VendedorAuthScreen: React.FC<VendedorAuthScreenProps> = ({ onSuccess }) => {
  const [cpf, setCpf] = useState('')
  const [pin, setPin] = useState('')
  const [showPin, setShowPin] = useState(false)
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')

  // Multi-empresa
  const [step, setStep] = useState<'login' | 'selecionar_empresa'>('login')
  const [tempToken, setTempToken] = useState('')
  const [empresasDisponiveis, setEmpresasDisponiveis] = useState<EmpresaVinculo[]>([])
  const [tempUser, setTempUser] = useState<UsuarioVendedor | null>(null)

  function formatCPF(val: string) {
    const digits = val.replace(/\D/g, '').slice(0, 11)
    if (digits.length <= 3) return digits
    if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`
    if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`
  }

  function handleCpfChange(e: React.ChangeEvent<HTMLInputElement>) {
    setCpf(formatCPF(e.target.value))
    if (erro) setErro('')
  }

  function handlePinChange(e: React.ChangeEvent<HTMLInputElement>) {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 6)
    setPin(digits)
    if (erro) setErro('')
  }

  async function handleLoginSubmit(e: React.FormEvent) {
    e.preventDefault()
    const cleanCpf = cpf.replace(/\D/g, '')
    if (!cleanCpf && !cpf.includes('@')) {
      setErro('Informe seu CPF completo para entrar.')
      return
    }
    if (!pin) {
      setErro('Informe o seu PIN numérico de acesso.')
      return
    }

    setLoading(true)
    setErro('')
    try {
      const res = await loginVendedor(cpf, pin)
      if (res.requerSelecaoEmpresa && res.empresas && res.empresas.length > 1) {
        setTempToken(res.token || '')
        setEmpresasDisponiveis(res.empresas)
        setTempUser(res.user)
        setStep('selecionar_empresa')
      } else if (res.empresaAtiva) {
        onSuccess(res.empresaAtiva, res.user, res.empresas || [res.empresaAtiva])
      } else if (res.empresas && res.empresas.length === 1) {
        onSuccess(res.empresas[0], res.user, res.empresas)
      } else {
        setErro('Nenhuma empresa ativa encontrada para este vendedor.')
      }
    } catch (err: any) {
      setErro(err.message || 'Falha ao autenticar. Verifique o CPF e o PIN.')
    } finally {
      setLoading(false)
    }
  }

  async function handleEscolherEmpresa(empresa: EmpresaVinculo) {
    setLoading(true)
    setErro('')
    try {
      const res = await selecionarEmpresa(empresa.empresa_id, tempToken)
      if (res.empresaAtiva && tempUser) {
        onSuccess(res.empresaAtiva, tempUser, empresasDisponiveis)
      } else {
        onSuccess(empresa, tempUser!, empresasDisponiveis)
      }
    } catch (err: any) {
      setErro(err.message || 'Falha ao selecionar empresa.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0F3C46] via-[#0d343d] to-slate-900 flex flex-col justify-center px-4 py-8 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Cabeçalho / Logo */}
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-500 text-white shadow-xl shadow-teal-500/20 ring-4 ring-white/10">
            <Store className="h-8 w-8" />
          </div>
          <h2 className="mt-4 text-2xl font-black tracking-tight text-white sm:text-3xl">
            Thoth Vendas
          </h2>
          <p className="mt-1 text-xs font-semibold text-teal-300 uppercase tracking-widest">
            Força de Vendas • Catálogo Mobile
          </p>
        </div>

        {/* Card do Formulário */}
        <div className="mt-6 rounded-3xl bg-white/95 backdrop-blur-md p-6 shadow-2xl ring-1 ring-black/5 sm:p-8">
          {step === 'login' ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-900">Acesso do Representante</h3>
                <p className="text-xs text-slate-500">Digite seu CPF e seu PIN para ver o catálogo</p>
              </div>

              {erro && (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-700 flex items-start gap-2.5">
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
                  <span className="leading-relaxed">{erro}</span>
                </div>
              )}

              {/* CPF */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  CPF do Vendedor
                </label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={cpf}
                    onChange={handleCpfChange}
                    placeholder="000.000.000-00"
                    maxLength={14}
                    autoComplete="username"
                    required
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-3 font-mono text-sm font-semibold text-slate-900 outline-none transition focus:border-teal-600 focus:bg-white focus:ring-4 focus:ring-teal-600/10"
                  />
                </div>
                <p className="mt-1 text-[11px] text-slate-400">Pode digitar apenas números</p>
              </div>

              {/* PIN */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">
                    PIN Numérico
                  </label>
                  <span className="text-[10px] font-semibold text-teal-700">Padrão inicial: 1234</span>
                </div>
                <div className="relative">
                  <input
                    type={showPin ? 'text' : 'password'}
                    inputMode="numeric"
                    value={pin}
                    onChange={handlePinChange}
                    placeholder="••••"
                    maxLength={6}
                    autoComplete="current-password"
                    required
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-3 pr-10 font-mono text-sm font-semibold tracking-widest text-slate-900 outline-none transition focus:border-teal-600 focus:bg-white focus:ring-4 focus:ring-teal-600/10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                    aria-label={showPin ? 'Ocultar PIN' : 'Mostrar PIN'}
                  >
                    {showPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Botão de Entrar */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 flex items-center justify-center gap-2 rounded-xl bg-teal-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-teal-600/20 transition-all hover:bg-teal-500 active:scale-[0.98] disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Validando Acesso…</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="h-4 w-4" />
                    <span>Entrar no Catálogo</span>
                  </>
                )}
              </button>

              <div className="pt-2 text-center">
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Não possui seu PIN ou CPF cadastrado?
                  <br />
                  Peça ao gestor para cadastrá-lo no <strong>Painel de Vendas</strong>.
                </p>
              </div>
            </form>
          ) : (
            /* Tela de Escolha de Empresa (quando o vendedor tem mais de uma) */
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <button
                  type="button"
                  onClick={() => setStep('login')}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Selecione a Empresa</h3>
                  <p className="text-xs text-slate-500">Você possui acesso a {empresasDisponiveis.length} empresas</p>
                </div>
              </div>

              {erro && (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                  {erro}
                </div>
              )}

              <p className="text-xs text-slate-600">
                Olá, <strong>{tempUser?.nome}</strong>! Escolha qual empresa deseja carregar agora:
              </p>

              <div className="space-y-2.5">
                {empresasDisponiveis.map((emp) => (
                  <button
                    key={emp.empresa_id}
                    type="button"
                    onClick={() => handleEscolherEmpresa(emp)}
                    disabled={loading}
                    className="w-full flex items-center justify-between p-3.5 rounded-2xl border border-slate-200 bg-slate-50/70 hover:bg-teal-50 hover:border-teal-300 transition-all text-left group active:scale-[0.99]"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-10 w-10 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center shrink-0 group-hover:bg-teal-500 group-hover:text-white transition-colors">
                        <Building2 className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-xs text-slate-900 truncate group-hover:text-teal-900">
                          {emp.nome_fantasia || emp.razao_social}
                        </div>
                        {emp.cnpj && (
                          <div className="text-[11px] font-mono text-slate-400">
                            CNPJ: {emp.cnpj}
                          </div>
                        )}
                        <span className="inline-block mt-0.5 text-[10px] font-bold uppercase tracking-wider text-teal-700">
                          {emp.role || 'Vendedor'}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-teal-600 shrink-0 ml-2" />
                  </button>
                ))}
              </div>

              {loading && (
                <div className="flex items-center justify-center gap-2 py-2 text-xs text-teal-700 font-semibold">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Carregando dados da empresa…</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Rodapé institucional */}
        <p className="mt-6 text-center text-xs text-teal-200/60">
          Thoth Vendas • Tecnologia Thothfy Sistemas
        </p>
      </div>
    </div>
  )
}
