import React, { useState } from 'react'
import { ShieldCheck, Building2, ChevronRight, Loader2, AlertCircle, Eye, EyeOff, ArrowLeft } from 'lucide-react'
import { loginVendedor, selecionarEmpresa } from '../services/api'
import { AppLogo } from './AppLogo'
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
    const val = e.target.value
    if (val.includes('@') || /[a-zA-Z]/.test(val)) {
      setCpf(val)
    } else {
      setCpf(formatCPF(val))
    }
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
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center px-4 py-8 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Glow decorativo superior sutil */}
      <div className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        {/* Card Principal (Padrão Vue Dashboard) */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xl shadow-slate-200/60 sm:p-8">
          {/* Logo Padrão Vue Dashboard */}
          <div className="flex flex-col items-center text-center pb-5 border-b border-slate-100">
            <AppLogo
              product="vendas"
              size="lg"
              showText={true}
              showSublabel={true}
              sublabel="Força de Vendas • Catálogo B2B"
            />
          </div>

          {step === 'login' ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4 pt-5">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Acesso do Representante</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Digite seu CPF (ou e-mail) e seu PIN numérico para abrir o catálogo comercial
                </p>
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
                  CPF ou E-mail do Vendedor
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={cpf}
                    onChange={handleCpfChange}
                    placeholder="000.000.000-00 ou seu@email.com"
                    autoComplete="username"
                    required
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-3 font-mono text-sm font-semibold text-slate-900 outline-none transition focus:border-emerald-600 focus:bg-white focus:ring-4 focus:ring-emerald-600/10"
                  />
                </div>
                <p className="mt-1 text-[11px] text-slate-400">Digite os números do CPF ou seu e-mail cadastrado</p>
              </div>

              {/* PIN */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">
                    PIN Numérico
                  </label>
                  <span className="text-[10px] font-semibold text-emerald-700">4 a 6 dígitos</span>
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
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-3 pr-10 font-mono text-sm font-semibold tracking-widest text-slate-900 outline-none transition focus:border-emerald-600 focus:bg-white focus:ring-4 focus:ring-emerald-600/10"
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
                className="w-full mt-2 flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3.5 text-sm font-bold text-white shadow-md shadow-emerald-600/20 transition-all hover:bg-emerald-700 active:scale-[0.98] disabled:opacity-50"
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
                  Peça ao gestor para cadastrá-lo no <strong className="text-slate-600">thothvendas</strong>.
                </p>
              </div>
            </form>
          ) : (
            /* Tela de Escolha de Empresa (quando o vendedor tem mais de uma) */
            <div className="space-y-4 pt-5">
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
                    className="w-full flex items-center justify-between p-3.5 rounded-2xl border border-slate-200 bg-slate-50/70 hover:bg-emerald-50 hover:border-emerald-300 transition-all text-left group active:scale-[0.99]"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-10 w-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                        <Building2 className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-xs text-slate-900 truncate group-hover:text-emerald-900">
                          {emp.nome_fantasia || emp.razao_social}
                        </div>
                        {emp.cnpj && (
                          <div className="text-[11px] font-mono text-slate-400">
                            CNPJ: {emp.cnpj}
                          </div>
                        )}
                        <span className="inline-block mt-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                          {emp.role || 'Vendedor'}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-emerald-600 shrink-0 ml-2" />
                  </button>
                ))}
              </div>

              {loading && (
                <div className="flex items-center justify-center gap-2 py-2 text-xs text-emerald-700 font-semibold">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Carregando dados da empresa…</span>
                </div>
              )}
            </div>
          )}

          {/* Rodapé institucional padrão Vue */}
          <div className="mt-6 border-t border-slate-100 pt-4 text-center">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Ecossistema Thothfy · Alta Disponibilidade
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
