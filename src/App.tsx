import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { Header } from './components/Header'
import { ProductCard } from './components/ProductCard'
import { CartDrawer } from './components/CartDrawer'
import { ClientSelectModal } from './components/ClientSelectModal'
import { VendedorAuthScreen } from './components/VendedorAuthScreen'
import { DesktopSidebar, MobileBottomNav, TabType } from './components/Navigation'
import { PedidosView } from './components/PedidosView'
import { MetaView } from './components/MetaView'
import { MaisView } from './components/MaisView'
import { useTheme } from './hooks/useTheme'
import {
  getProdutos,
  getCategorias,
  getTabelasPreco,
  getCondicoesPagamento,
  getClientes,
  enviarPedido,
  getMe,
  getToken,
  logoutVendedor,
  selecionarEmpresa,
  getOrcamentosLocais,
  salvarOrcamento,
  getPendingOfflineOrders,
  removePendingOfflineOrder,
  syncPendingOfflineOrders,
} from './services/api'
import type {
  Produto,
  Categoria,
  TabelaPreco,
  Cliente,
  ItemCarrinho,
  OrcamentoSalvo,
  EmpresaVinculo,
  UsuarioVendedor,
  PendingOfflineOrder,
  FormaPagamento,
  PrazoPagamento,
} from './types'
import {
  ChevronRight,
  PackageSearch,
  Loader2,
  CheckCircle2,
  Building2,
  X,
  Bookmark,
  Edit3,
  AlertCircle,
} from 'lucide-react'

export function App() {
  const { theme, toggleTheme } = useTheme()

  // Autenticação & Sessão
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => !!getToken())
  const [currentUser, setCurrentUser] = useState<UsuarioVendedor | null>(null)
  const [empresaAtiva, setEmpresaAtiva] = useState<EmpresaVinculo | null>(null)
  const [empresasDisponiveis, setEmpresasDisponiveis] = useState<EmpresaVinculo[]>([])
  const [switchModalOpen, setSwitchModalOpen] = useState(false)
  const [switching, setSwitching] = useState(false)
  const [logoutModalOpen, setLogoutModalOpen] = useState(false)
  const [errorBanner, setErrorBanner] = useState<string | null>(null)

  // Aba ativa
  const [activeTab, setActiveTab] = useState<TabType>('produtos')
  const [pedidosInitialFilter, setPedidosInitialFilter] = useState<string>('todos')
  const [autoOpenNewClient, setAutoOpenNewClient] = useState<boolean>(false)

  const [produtos, setProdutos] = useState<Produto[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [tabelas, setTabelas] = useState<TabelaPreco[]>([])
  const [formasPagamento, setFormasPagamento] = useState<FormaPagamento[]>([])
  const [prazosPagamento, setPrazosPagamento] = useState<PrazoPagamento[]>([])
  const [selectedTabelaId, setSelectedTabelaId] = useState<string>('')
  const selectedTabelaRef = useRef<string>('')
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [orcamentosSalvos, setOrcamentosSalvos] = useState<OrcamentoSalvo[]>(() => getOrcamentosLocais())
  const [pendingOfflineOrders, setPendingOfflineOrders] = useState<PendingOfflineOrder[]>([])
  const [syncingOffline, setSyncingOffline] = useState(false)
  const [loading, setLoading] = useState(true)
  const [fromCache, setFromCache] = useState(false)
  const [isOffline, setIsOffline] = useState(!navigator.onLine)

  // Filtros e Visualização de Catálogo
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [onlyInStock, setOnlyInStock] = useState<boolean>(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  // Carrinho & Pedido
  const [itens, setItens] = useState<ItemCarrinho[]>(() => {
    try {
      const saved = localStorage.getItem('vendedor_carrinho')
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })

  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(() => {
    try {
      const saved = localStorage.getItem('vendedor_cliente')
      return saved ? JSON.parse(saved) : null
    } catch {
      return null
    }
  })

  const [cartOpen, setCartOpen] = useState(false)
  const [clienteModalOpen, setClienteModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [empresaNome, setEmpresaNome] = useState('ThothVendas')

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3000)
  }, [])

  const refreshOrcamentos = useCallback(() => {
    setOrcamentosSalvos(getOrcamentosLocais())
  }, [])

  const refreshPendingOffline = useCallback(async () => {
    const q = await getPendingOfflineOrders()
    setPendingOfflineOrders(q)
  }, [])

  const handleSyncOffline = useCallback(async () => {
    if (!navigator.onLine || syncingOffline) return
    setSyncingOffline(true)
    try {
      const result = await syncPendingOfflineOrders()
      setPendingOfflineOrders(result.remaining)
      if (result.synced > 0) {
        showToast(`${result.synced} pedido(s) offline sincronizado(s) com o ERP!`)
      }
      if (result.failed > 0) {
        setErrorBanner(`${result.failed} pedido(s) offline falharam ao sincronizar. Verifique em Pedidos.`)
      }
    } finally {
      setSyncingOffline(false)
    }
  }, [syncingOffline, showToast])

  useEffect(() => {
    selectedTabelaRef.current = selectedTabelaId
  }, [selectedTabelaId])

  useEffect(() => {
    localStorage.setItem('vendedor_carrinho', JSON.stringify(itens))
  }, [itens])

  useEffect(() => {
    if (selectedCliente) {
      localStorage.setItem('vendedor_cliente', JSON.stringify(selectedCliente))
      if (selectedCliente.tabela_preco_id) {
        setSelectedTabelaId(selectedCliente.tabela_preco_id)
      }
    } else {
      localStorage.removeItem('vendedor_cliente')
    }
  }, [selectedCliente])

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false)
      handleSyncOffline()
    }
    const handleOffline = () => setIsOffline(true)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [handleSyncOffline])

  const carregarDados = useCallback(async () => {
    if (!getToken()) {
      setIsAuthenticated(false)
      setLoading(false)
      return
    }

    setLoading(true)
    setErrorBanner(null)
    try {
      const [prodData, cats, tabs, conds, clis, me] = await Promise.all([
        getProdutos(),
        getCategorias(),
        getTabelasPreco(),
        getCondicoesPagamento(),
        getClientes(),
        getMe(),
      ])
      setProdutos(prodData.produtos)
      setFromCache(prodData.fromCache)
      setCategorias(cats)
      setTabelas(tabs)
      setFormasPagamento(conds.formas)
      setPrazosPagamento(conds.prazos)
      if (tabs.length > 0 && !selectedTabelaRef.current) {
        const padrao = tabs.find((t) => t.padrao) || tabs[0]
        setSelectedTabelaId(padrao.id)
      }
      setClientes(clis)
      refreshOrcamentos()
      await refreshPendingOffline()

      if (me) {
        setIsAuthenticated(true)
        if (me.user) setCurrentUser(me.user)
        if (me.empresaAtiva) {
          setEmpresaAtiva(me.empresaAtiva)
          setEmpresaNome(me.empresaAtiva.nome_fantasia || me.empresaAtiva.razao_social || 'ThothVendas')
        }
        if (me.empresas && Array.isArray(me.empresas)) {
          setEmpresasDisponiveis(me.empresas)
        }
      }
    } catch (err: any) {
      console.warn('Falha ao carregar dados:', err)
      if (err.message && (err.message.includes('401') || err.message.includes('Sessão expirada'))) {
        setIsAuthenticated(false)
      } else {
        setErrorBanner(err.message || 'Falha ao carregar dados do catálogo.')
      }
    } finally {
      setLoading(false)
    }
  }, [refreshOrcamentos, refreshPendingOffline])

  useEffect(() => {
    carregarDados()
  }, [carregarDados])

  const handleAuthSuccess = (empresa: EmpresaVinculo, user: UsuarioVendedor, empresas: EmpresaVinculo[]) => {
    setIsAuthenticated(true)
    setEmpresaAtiva(empresa)
    setCurrentUser(user)
    setEmpresasDisponiveis(empresas)
    setEmpresaNome(empresa.nome_fantasia || empresa.razao_social || 'ThothVendas')
    carregarDados()
  }

  const handleTrocarEmpresa = async (empresa: EmpresaVinculo) => {
    const empresaId = empresa.empresa_id || empresa.id || ''
    if (!empresaId) return
    setSwitching(true)
    try {
      const res = await selecionarEmpresa(empresaId)
      setEmpresaAtiva(res.empresaAtiva || empresa)
      setEmpresaNome(empresa.nome_fantasia || empresa.razao_social)
      setSwitchModalOpen(false)
      setItens([])
      setSelectedCliente(null)
      selectedTabelaRef.current = ''
      setSelectedTabelaId('')
      await carregarDados()
      showToast(`Empresa alterada para ${empresa.nome_fantasia || empresa.razao_social}`)
    } catch (err: any) {
      setErrorBanner(`Erro ao alternar de empresa: ${err.message || err}`)
    } finally {
      setSwitching(false)
    }
  }

  const handleSelectTabela = (novaTabelaId: string) => {
    setSelectedTabelaId(novaTabelaId)
    const tabela = tabelas.find((t) => t.id === novaTabelaId)
    if (!tabela) return

    setItens((prev) =>
      prev.map((it) => {
        const precoBase = it.precoUnitarioTabela
        let precoCobrado = precoBase
        if (tabela.tipo_ajuste === 'acrescimo_pct') {
          precoCobrado = precoBase * (1 + tabela.percentual_ajuste / 100)
        } else if (tabela.tipo_ajuste === 'desconto_pct') {
          precoCobrado = precoBase * (1 - tabela.percentual_ajuste / 100)
        }
        const sub = it.quantidade * precoCobrado
        return {
          ...it,
          tabelaPrecoId: novaTabelaId,
          precoUnitarioCobrado: precoCobrado,
          subtotal: sub * (1 - (it.descontoPct || 0) / 100),
        }
      })
    )
  }

  const handleAddToCart = (produto: Produto, quantidade: number, tabelaId?: string) => {
    const tabId = tabelaId || selectedTabelaId
    const tabela = tabelas.find((t) => t.id === tabId)
    const precoBase = Number(produto.preco_tabela) || 0
    let precoCobrado = precoBase
    if (tabela) {
      if (tabela.tipo_ajuste === 'acrescimo_pct') {
        precoCobrado = precoBase * (1 + tabela.percentual_ajuste / 100)
      } else if (tabela.tipo_ajuste === 'desconto_pct') {
        precoCobrado = precoBase * (1 - tabela.percentual_ajuste / 100)
      }
    }

    setItens((prev) => {
      const idx = prev.findIndex((it) => it.produtoId === produto.id)
      if (idx >= 0) {
        const copy = [...prev]
        const newQty = copy[idx].quantidade + quantidade
        const descPct = copy[idx].descontoPct || 0
        const sub = newQty * precoCobrado
        copy[idx] = {
          ...copy[idx],
          precoUnitarioCobrado: precoCobrado,
          tabelaPrecoId: tabId,
          quantidade: newQty,
          subtotal: sub * (1 - descPct / 100),
        }
        return copy
      }
      return [
        ...prev,
        {
          produtoId: produto.id,
          codigo: produto.codigo,
          nome: produto.nome,
          unidade: produto.unidade,
          quantidade,
          precoUnitarioTabela: precoBase,
          precoUnitarioCobrado: precoCobrado,
          tabelaPrecoId: tabId,
          descontoPct: 0,
          subtotal: quantidade * precoCobrado,
          imagemUrl: produto.imagem_url,
        },
      ]
    })
    showToast(`+${quantidade} ${produto.nome.slice(0, 26)} adicionado`)
  }

  const handleUpdateQty = (produtoId: string, quantidade: number) => {
    setItens((prev) =>
      prev.map((it) => {
        if (it.produtoId === produtoId) {
          const sub = quantidade * it.precoUnitarioCobrado
          const desc = sub * ((it.descontoPct || 0) / 100)
          return {
            ...it,
            quantidade,
            subtotal: sub - desc,
          }
        }
        return it
      })
    )
  }

  const handleUpdateDesconto = (produtoId: string, descontoPct: number) => {
    setItens((prev) =>
      prev.map((it) => {
        if (it.produtoId === produtoId) {
          const sub = it.quantidade * it.precoUnitarioCobrado
          const desc = sub * (descontoPct / 100)
          return {
            ...it,
            descontoPct,
            subtotal: sub - desc,
          }
        }
        return it
      })
    )
  }

  const handleRemoveItem = (produtoId: string) => {
    setItens((prev) => prev.filter((it) => it.produtoId !== produtoId))
  }

  const handleClearCart = () => {
    setItens([])
    showToast('Carrinho limpo')
  }

  const handleSaveOrcamento = async (
    observacoes: string,
    condicao: string,
    formaPagamento: string,
    formaPagamentoId?: string,
    prazoPagamentoId?: string
  ) => {
    if (itens.length === 0) return
    try {
      const orc = await salvarOrcamento({
        cliente: selectedCliente,
        tabelaPrecoId: selectedTabelaId || itens[0]?.tabelaPrecoId,
        formaPagamentoId,
        prazoPagamentoId,
        formaPagamento,
        condicaoPagamento: condicao,
        observacoes,
        itens,
      })
      refreshOrcamentos()
      setItens([])
      setCartOpen(false)
      showToast(`Orçamento ${orc.numero} salvo com sucesso!`)
    } catch (err: any) {
      setErrorBanner(`Erro ao salvar orçamento: ${err.message || err}`)
    }
  }

  const handleRestoreOrcamento = (orc: OrcamentoSalvo) => {
    if (orc.cliente && orc.cliente.id) {
      const cliCompleto = clientes.find((c) => c.id === orc.cliente?.id) || orc.cliente
      setSelectedCliente(cliCompleto)
    }
    if (orc.tabelaPrecoId) {
      setSelectedTabelaId(orc.tabelaPrecoId)
    }
    setItens(orc.itens)
    setActiveTab('produtos')
    setCartOpen(true)
    showToast(`Orçamento ${orc.numero} carregado no carrinho!`)
  }

  const handleSubmitOrder = async (
    observacoes: string,
    condicao: string,
    formaPagamento: string,
    formaPagamentoId?: string,
    prazoPagamentoId?: string
  ) => {
    if (!selectedCliente) return
    setIsSubmitting(true)
    try {
      const payload = {
        clienteId: selectedCliente.id,
        tabelaPrecoId: selectedTabelaId || itens[0]?.tabelaPrecoId,
        formaPagamentoId,
        prazoPagamentoId,
        formaPagamento,
        condicaoPagamento: condicao,
        status: 'pendente' as const,
        observacoes: observacoes.trim() || undefined,
        itens: itens.map((it) => ({
          produtoId: it.produtoId,
          quantidade: it.quantidade,
          precoUnitario: it.precoUnitarioCobrado,
          descontoPct: it.descontoPct || 0,
        })),
      }
      const res = await enviarPedido(payload, {
        clienteNome: selectedCliente.nome_fantasia || selectedCliente.razao_social,
        totalEstimado: cartTotal,
        permitirOffline: empresaAtiva?.permitir_pedido_offline ?? true,
        itensResumo: itens.map((it) => ({
          nome: it.nome,
          codigo: it.codigo,
          unidade: it.unidade,
          quantidade: it.quantidade,
          precoUnitario: it.precoUnitarioCobrado,
          descontoPct: it.descontoPct || 0,
        })),
      })
      if (res.offlineQueued) {
        await refreshPendingOffline()
        showToast('Pedido gravado na fila offline e será enviado ao reconectar!')
      } else {
        showToast('Pedido emitido e transmitido ao ERP!')
      }
      setItens([])
      setCartOpen(false)
      setPedidosInitialFilter('todos')
      setActiveTab('pedidos')
    } catch (err: any) {
      setErrorBanner(`Falha ao emitir pedido: ${err.message || err}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const cartQtyMap = useMemo(() => {
    const map: Record<string, number> = {}
    for (const it of itens) {
      map[it.produtoId] = (map[it.produtoId] || 0) + it.quantidade
    }
    return map
  }, [itens])

  const filteredProducts = useMemo(() => {
    return produtos.filter((p) => {
      if (onlyInStock && (p.estoque_atual || 0) <= 0) return false
      if (selectedCategory && p.categoria_id !== selectedCategory) return false
      if (!search.trim()) return true
      const term = search.toLowerCase().trim()
      return (
        p.nome.toLowerCase().includes(term) ||
        p.codigo.toLowerCase().includes(term) ||
        (p.codigo_barras && p.codigo_barras.toLowerCase().includes(term)) ||
        (p.categoria_nome && p.categoria_nome.toLowerCase().includes(term))
      )
    })
  }, [produtos, selectedCategory, search, onlyInStock])

  const cartTotal = itens.reduce((acc, it) => acc + it.subtotal, 0)
  const cartCount = itens.reduce((acc, it) => acc + it.quantidade, 0)
  const cartTotalFmt = cartTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  const limiteDescontoEfetivo =
    currentUser?.limite_desconto_pct || empresaAtiva?.desconto_maximo_vendedor_pct || 15
  const activeEmpresaId = empresaAtiva?.empresa_id || empresaAtiva?.id

  if (!isAuthenticated) {
    return <VendedorAuthScreen onSuccess={handleAuthSuccess} />
  }

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-[#F8FAFC] dark:bg-[#090D16] flex flex-col md:flex-row">
      {/* Barra Lateral no Desktop */}
      <DesktopSidebar
        activeTab={activeTab}
        onSelectTab={(tab) => {
          if (tab === 'pedidos') setPedidosInitialFilter('todos')
          setActiveTab(tab)
        }}
        storeName={empresaNome}
        currentUser={currentUser}
        empresaAtiva={empresaAtiva}
        empresasCount={empresasDisponiveis.length}
        cartCount={cartCount}
        cartTotal={cartTotal}
        orcamentosCount={orcamentosSalvos.length}
        onOpenCart={() => setCartOpen(true)}
        onSwitchEmpresa={() => setSwitchModalOpen(true)}
        onLogout={() => setLogoutModalOpen(true)}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      {/* Área Central */}
      <div
        className={`flex-1 md:pl-[260px] min-w-0 w-full flex flex-col min-h-screen ${
          cartCount > 0 && activeTab === 'produtos' ? 'pb-36 md:pb-8' : 'pb-20 md:pb-8'
        }`}
      >
        {errorBanner && (
          <div className="mx-auto max-w-6xl w-full px-3 sm:px-6 pt-3">
            <div
              role="alert"
              className="rounded-xl border border-rose-200 dark:border-rose-500/20 bg-rose-50 dark:bg-rose-500/10 p-3 text-xs text-rose-700 dark:text-rose-400 flex items-center justify-between gap-2"
            >
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errorBanner}</span>
              </div>
              <button type="button" onClick={() => setErrorBanner(null)} aria-label="Fechar alerta">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* ABA: PRODUTOS */}
        {activeTab === 'produtos' && (
          <>
            <Header
              storeName={empresaNome}
              vendedorNome={currentUser?.nome}
              empresasCount={empresasDisponiveis.length}
              onSwitchEmpresa={() => setSwitchModalOpen(true)}
              onLogout={() => setLogoutModalOpen(true)}
              search={search}
              setSearch={setSearch}
              categories={categorias}
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
              cartCount={cartCount}
              cartTotal={cartTotal}
              onOpenCart={() => setCartOpen(true)}
              isOffline={isOffline}
              pendingOfflineCount={pendingOfflineOrders.length}
              syncingOffline={syncingOffline}
              onSyncOffline={handleSyncOffline}
              selectedCliente={selectedCliente}
              onOpenClienteSelect={() => setClienteModalOpen(true)}
              tabelas={tabelas}
              selectedTabelaId={selectedTabelaId}
              onSelectTabela={handleSelectTabela}
              onlyInStock={onlyInStock}
              onToggleInStock={() => setOnlyInStock((prev) => !prev)}
              viewMode={viewMode}
              onChangeViewMode={setViewMode}
              orcamentosCount={orcamentosSalvos.length}
              onOpenOrcamentos={() => {
                setPedidosInitialFilter('orcamentos')
                setActiveTab('pedidos')
              }}
              theme={theme}
              onToggleTheme={toggleTheme}
            />

            <main className="mx-auto max-w-6xl w-full px-3 py-3 sm:px-6 sm:py-5 flex-1">
              {orcamentosSalvos.length > 0 && (
                <div className="mb-3 rounded-xl border border-amber-200 dark:border-amber-500/30 bg-amber-50/90 dark:bg-amber-500/10 px-3.5 py-2.5 flex items-center justify-between gap-2 shadow-2xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <Bookmark className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
                    <div className="min-w-0 text-xs">
                      <span className="font-bold text-amber-900 dark:text-amber-200 font-mono tabular-nums">
                        {orcamentosSalvos.length} orçamento(s) salvo(s)
                      </span>
                      <span className="hidden sm:inline text-amber-800 dark:text-amber-300 ml-1.5 font-mono tabular-nums">
                        • Último: {orcamentosSalvos[0].cliente?.razao_social || orcamentosSalvos[0].numero} (
                        {orcamentosSalvos[0].valorTotal.toLocaleString('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        })}
                        )
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleRestoreOrcamento(orcamentosSalvos[0])}
                      className="flex items-center gap-1 rounded-lg bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-500/30 px-2.5 py-1 text-[11px] font-semibold text-amber-800 dark:text-amber-300 hover:bg-amber-100/50"
                    >
                      <Edit3 className="h-3 w-3" />
                      <span>Reabrir</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPedidosInitialFilter('orcamentos')
                        setActiveTab('pedidos')
                      }}
                      className="rounded-lg bg-amber-500 px-2.5 py-1 text-[11px] font-semibold text-slate-950 hover:bg-amber-400"
                    >
                      Ver todos
                    </button>
                  </div>
                </div>
              )}

              <div className="mb-2.5 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-0.5">
                <span className="font-mono tabular-nums">
                  <strong className="text-slate-800 dark:text-slate-200">{filteredProducts.length}</strong> produto(s)
                  {fromCache ? ' • modo offline' : ''}
                </span>
                <span className="text-[11px] font-mono tabular-nums font-semibold text-[#00A19C] bg-[#00A19C]/10 px-2.5 py-0.5 rounded-full border border-[#00A19C]/20">
                  Desc. máx: {limiteDescontoEfetivo}%
                </span>
              </div>

              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                  <Loader2 className="h-8 w-8 animate-spin text-[#00A19C] mb-2" />
                  <p className="text-xs">Carregando catálogo de produtos…</p>
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-14 text-center px-4">
                  <PackageSearch className="h-10 w-10 text-slate-300 dark:text-slate-700 mb-2" />
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Nenhum produto encontrado
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Tente ajustar a busca, trocar de categoria ou desativar o filtro de estoque
                  </p>
                </div>
              ) : viewMode === 'list' ? (
                <div className="space-y-2">
                  {filteredProducts.map((p) => (
                    <ProductCard
                      key={p.id}
                      produto={p}
                      tabelas={tabelas}
                      tabelaAtivaId={selectedTabelaId}
                      cartQty={cartQtyMap[p.id] || 0}
                      viewMode="list"
                      bloquearSemEstoque={empresaAtiva?.bloquear_venda_sem_estoque}
                      onAddToCart={handleAddToCart}
                    />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2.5 sm:gap-3.5 sm:grid-cols-3 lg:grid-cols-4">
                  {filteredProducts.map((p) => (
                    <ProductCard
                      key={p.id}
                      produto={p}
                      tabelas={tabelas}
                      tabelaAtivaId={selectedTabelaId}
                      cartQty={cartQtyMap[p.id] || 0}
                      viewMode="grid"
                      bloquearSemEstoque={empresaAtiva?.bloquear_venda_sem_estoque}
                      onAddToCart={handleAddToCart}
                    />
                  ))}
                </div>
              )}
            </main>

            {/* Barra Flutuante Mobile */}
            {cartCount > 0 && (
              <div className="fixed bottom-[calc(3.75rem+env(safe-area-inset-bottom))] left-2 right-2 z-20 rounded-xl border border-[#00A19C]/30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-4 py-2.5 shadow-xl md:hidden">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                      Pedido em andamento ({cartCount} un.)
                    </div>
                    <div className="font-display font-mono tabular-nums text-base font-bold text-[#00A19C] truncate">
                      {cartTotalFmt}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCartOpen(true)}
                    className="flex items-center gap-1 rounded-xl bg-[#00A19C] px-4 py-2 text-xs font-semibold text-white shadow-xs active:scale-95 shrink-0"
                  >
                    <span>Concluir / Orçar</span>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* ABA: PEDIDOS E ORÇAMENTOS */}
        {activeTab === 'pedidos' && (
          <PedidosView
            empresaNome={empresaNome}
            orcamentosLocais={orcamentosSalvos}
            pendingOfflineOrders={pendingOfflineOrders}
            syncingOffline={syncingOffline}
            onSyncOffline={handleSyncOffline}
            onRemoveOfflineOrder={async (localId) => {
              await removePendingOfflineOrder(localId)
              await refreshPendingOffline()
            }}
            onRefreshOrcamentos={refreshOrcamentos}
            onRestoreOrcamento={handleRestoreOrcamento}
            initialFilter={pedidosInitialFilter}
            onNotify={showToast}
          />
        )}

        {/* ABA: META */}
        {activeTab === 'meta' && <MetaView vendedorNome={currentUser?.nome} />}

        {/* ABA: AJUSTES */}
        {activeTab === 'mais' && (
          <MaisView
            currentUser={currentUser}
            onUpdateUser={(u) => setCurrentUser((prev) => (prev ? { ...prev, ...u } : u))}
            clientes={clientes}
            tabelas={tabelas}
            onClienteCreated={(c) => {
              setClientes((prev) => [c, ...prev])
              setSelectedCliente(c)
              showToast(`Cliente ${c.razao_social} cadastrado e selecionado!`)
            }}
            onSelectClienteForOrder={(c) => {
              setSelectedCliente(c)
              setActiveTab('produtos')
              showToast(`Cliente ${c.razao_social} selecionado!`)
            }}
            empresaAtiva={empresaAtiva}
            empresasCount={empresasDisponiveis.length}
            onSwitchEmpresa={() => setSwitchModalOpen(true)}
            onLogout={() => setLogoutModalOpen(true)}
            onReloadData={carregarDados}
            autoOpenNewClient={autoOpenNewClient}
            onClearAutoOpenNewClient={() => setAutoOpenNewClient(false)}
            theme={theme}
            onToggleTheme={toggleTheme}
          />
        )}
      </div>

      {/* Barra Inferior Mobile */}
      <MobileBottomNav
        activeTab={activeTab}
        onSelectTab={(tab) => {
          if (tab === 'pedidos') setPedidosInitialFilter('todos')
          setActiveTab(tab)
        }}
        cartCount={cartCount}
        orcamentosCount={orcamentosSalvos.length}
      />

      {/* Drawer do Carrinho */}
      <CartDrawer
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        itens={itens}
        onUpdateQty={handleUpdateQty}
        onUpdateDesconto={handleUpdateDesconto}
        onRemoveItem={handleRemoveItem}
        onClearCart={handleClearCart}
        selectedCliente={selectedCliente}
        onOpenClienteSelect={() => setClienteModalOpen(true)}
        onSubmitOrder={handleSubmitOrder}
        onSaveOrcamento={handleSaveOrcamento}
        isSubmitting={isSubmitting}
        limiteDescontoPct={limiteDescontoEfetivo}
        valorPedidoMinimo={empresaAtiva?.valor_pedido_minimo || 0}
        empresaNome={empresaNome}
        formasPagamento={formasPagamento}
        prazosPagamento={prazosPagamento}
      />

      {/* Modal de Seleção de Cliente */}
      <ClientSelectModal
        isOpen={clienteModalOpen}
        onClose={() => setClienteModalOpen(false)}
        clientes={clientes}
        selectedCliente={selectedCliente}
        onSelect={(c) => {
          setSelectedCliente(c)
          setClienteModalOpen(false)
        }}
        onNewClient={() => {
          setAutoOpenNewClient(true)
          setActiveTab('mais')
        }}
      />

      {/* Modal de Alternar Empresa */}
      {switchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-[#00A19C]" />
                <h3 className="font-display font-bold text-sm text-slate-900 dark:text-white">
                  Trocar de Empresa
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSwitchModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
              Escolha para qual empresa deseja emitir pedidos agora:
            </p>

            <div className="mt-3 space-y-2">
              {empresasDisponiveis.map((emp) => {
                const empId = emp.empresa_id || emp.id || emp.slug
                const isSelected = activeEmpresaId === empId
                return (
                  <button
                    key={empId}
                    type="button"
                    disabled={switching}
                    onClick={() => handleTrocarEmpresa(emp)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'border-[#00A19C] bg-[#00A19C]/10 text-slate-900 dark:text-white font-semibold'
                        : 'border-slate-200/80 dark:border-slate-800 bg-[#F8FAFC] dark:bg-slate-800/50 hover:border-[#00A19C]/50 text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-xs truncate">{emp.nome_fantasia || emp.razao_social}</div>
                      {emp.cnpj && (
                        <div className="text-[10px] text-slate-400 font-mono tabular-nums">{emp.cnpj}</div>
                      )}
                    </div>
                    {isSelected && (
                      <span className="text-[10px] bg-[#00A19C] text-white px-2 py-0.5 rounded-full font-semibold">
                        Ativa
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Logout */}
      {logoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-2xl space-y-4">
            <h3 className="font-display text-sm font-bold text-slate-900 dark:text-white">
              Sair do Aplicativo
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Deseja encerrar a sessão neste aparelho? Orçamentos salvos e fila offline permanecerão protegidos no dispositivo.
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setLogoutModalOpen(false)}
                className="rounded-xl border border-slate-200/80 dark:border-slate-700 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => logoutVendedor()}
                className="rounded-xl bg-rose-600 hover:bg-rose-700 px-4 py-2 text-xs font-semibold text-white"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notificação */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 z-50 -translate-x-1/2 flex items-center gap-2 rounded-full bg-slate-900/95 dark:bg-slate-800 border border-slate-700 px-4 py-2 text-xs font-semibold text-white shadow-lg backdrop-blur max-w-[90vw] truncate">
          <CheckCircle2 className="h-3.5 w-3.5 text-[#00A19C] shrink-0" />
          <span className="truncate">{toastMessage}</span>
        </div>
      )}
    </div>
  )
}
