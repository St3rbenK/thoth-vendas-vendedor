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
      setErro('Informe seu CPF completo ou e-mail para entrar.')
      return
    }
    if (!pin || pin.length < 4) {
      setErro('Informe seu PIN numérico (4 a 6 dígitos).')
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
    const empresaId = empresa.empresa_id || empresa.id || ''
    if (!empresaId) {
      setErro('Empresa selecionada inválida.')
      return
    }
    setLoading(true)
    setErro('')
    try {
      const res = await selecionarEmpresa(empresaId, tempToken)
      if (res.empresaAtiva && tempUser) {
        onSuccess(res.empresaAtiva, tempUser, res.empresas || empresasDisponiveis)
      } else if (tempUser) {
        onSuccess(empresa, tempUser, empresasDisponiveis)
      }
    } catch (err: any) {
      setErro(err.message || 'Falha ao selecionar empresa.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#090D16] flex flex-col justify-center px-4 py-8 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Glow decorativo sutil na cor oficial Teal Comercial */}
      <div className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 h-80 w-80 rounded-full bg-[#00A19C]/10 blur-3xl" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xl shadow-slate-200/50 dark:shadow-none sm:p-8">
          {/* Logo Oficial Linha Business */}
          <div className="flex flex-col items-center text-center pb-5 border-b border-slate-200/80 dark:border-slate-800">
            <AppLogo
              product="vendas"
              size="lg"
              showText={true}
              showSublabel={true}
              sublabel="App do Vendedor • Catálogo B2B"
            />
          </div>

          {step === 'login' ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4 pt-5">
              <div>
                <h1 className="font-display text-base font-bold tracking-tight text-slate-900 dark:text-white">
                  Acesso do Representante
                </h1>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                  Digite seu CPF (ou e-mail) e seu PIN numérico para abrir o catálogo comercial
                </p>
              </div>

              {erro && (
                <div
                  role="alert"
                  className="rounded-xl border border-rose-200 dark:border-rose-500/20 bg-rose-50 dark:bg-rose-500/10 p-3.5 text-xs text-rose-700 dark:text-rose-400 flex items-start gap-2.5"
                >
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
                  <span className="leading-relaxed">{erro}</span>
                </div>
              )}

              {/* CPF */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  CPF ou E-mail do Vendedor
                </label>
                <input
                  type="text"
                  value={cpf}
                  onChange={handleCpfChange}
                  placeholder="000.000.000-00 ou seu@email.com"
                  autoComplete="username"
                  required
                  className="w-full rounded-xl border border-slate-200/80 dark:border-slate-800 bg-[#F8FAFC] dark:bg-slate-800/60 px-3.5 py-2.5 font-mono tabular-nums text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 outline-none transition focus:border-[#00A19C] focus:bg-white dark:focus:bg-slate-900 focus:ring-3 focus:ring-[#00A19C]/15"
                />
                <p className="mt-1 text-[11px] text-slate-400">
                  Digite os números do CPF ou seu e-mail cadastrado
                </p>
              </div>

              {/* PIN */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    PIN Numérico
                  </label>
                  <span className="text-[11px] font-medium text-[#00A19C]">4 a 6 dígitos</span>
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
                    className="w-full rounded-xl border border-slate-200/80 dark:border-slate-800 bg-[#F8FAFC] dark:bg-slate-800/60 px-3.5 py-2.5 pr-10 font-mono tabular-nums text-sm font-semibold tracking-widest text-slate-900 dark:text-white placeholder:text-slate-400 outline-none transition focus:border-[#00A19C] focus:bg-white dark:focus:bg-slate-900 focus:ring-3 focus:ring-[#00A19C]/15"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
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
                className="w-full mt-2 flex items-center justify-center gap-2 rounded-xl bg-[#00A19C] py-3 text-sm font-semibold text-white shadow-sm shadow-[#00A19C]/20 transition-all hover:bg-[#008C87] active:scale-[0.99] disabled:opacity-50"
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
                  Solicite ao gestor no painel{' '}
                  <strong className="text-slate-600 dark:text-slate-300">ThothVendas</strong>.
                </p>
              </div>
            </form>
          ) : (
            /* Seleção de Empresa */
            <div className="space-y-4 pt-5">
              <div className="flex items-center gap-2 border-b border-slate-200/80 dark:border-slate-800 pb-3">
                <button
                  type="button"
                  onClick={() => setStep('login')}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200"
                  aria-label="Voltar ao login"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <div>
                  <h2 className="font-display text-sm font-bold text-slate-900 dark:text-white">
                    Selecione a Empresa
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Você possui acesso a {empresasDisponiveis.length} empresas
                  </p>
                </div>
              </div>

              {erro && (
                <div className="rounded-xl border border-rose-200 dark:border-rose-500/20 bg-rose-50 dark:bg-rose-500/10 p-3 text-xs text-rose-700 dark:text-rose-400">
                  {erro}
                </div>
              )}

              <p className="text-xs text-slate-600 dark:text-slate-400">
                Olá, <strong className="text-slate-900 dark:text-white">{tempUser?.nome}</strong>! Escolha qual empresa deseja carregar agora:
              </p>

              <div className="space-y-2">
                {empresasDisponiveis.map((emp) => {
                  const key = emp.empresa_id || emp.id || emp.slug
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handleEscolherEmpresa(emp)}
                      disabled={loading}
                      className="w-full flex items-center justify-between p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-[#F8FAFC] dark:bg-slate-800/50 hover:bg-teal-50/70 dark:hover:bg-[#00A19C]/10 hover:border-[#00A19C]/50 transition-all text-left group active:scale-[0.99]"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-10 w-10 rounded-lg bg-[#00A19C]/10 text-[#00A19C] flex items-center justify-center shrink-0 group-hover:bg-[#00A19C] group-hover:text-white transition-colors">
                          <Building2 className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-xs text-slate-900 dark:text-white truncate">
                            {emp.nome_fantasia || emp.razao_social}
                          </div>
                          {emp.cnpj && (
                            <div className="text-[11px] font-mono tabular-nums text-slate-400">
                              CNPJ: {emp.cnpj}
                            </div>
                          )}
                          <span className="inline-block mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#00A19C]">
                            {emp.role || 'Vendedor'}
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-[#00A19C] shrink-0 ml-2" />
                    </button>
                  )
                })}
              </div>

              {loading && (
                <div className="flex items-center justify-center gap-2 py-2 text-xs text-[#00A19C] font-semibold">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Carregando dados da empresa…</span>
                </div>
              )}
            </div>
          )}

          {/* Rodapé institucional */}
          <div className="mt-6 border-t border-slate-200/80 dark:border-slate-800 pt-4 text-center">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-400">
              <span className="h-1.5 w-1.5 rounded-full bg-[#00A19C]" />
              Ecossistema Thothfy · Linha Business
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
