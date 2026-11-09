import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { Header } from './components/Header'
import { ProductCard } from './components/ProductCard'
import { CartDrawer } from './components/CartDrawer'
import { ClientSelectModal } from './components/ClientSelectModal'
import { VendedorAuthScreen } from './components/VendedorAuthScreen'
import {
  getProdutos,
  getCategorias,
  getTabelasPreco,
  getClientes,
  enviarPedido,
  getMe,
  getToken,
  logoutVendedor,
  selecionarEmpresa,
} from './services/api'
import type { Produto, Categoria, TabelaPreco, Cliente, ItemCarrinho, EmpresaVinculo, UsuarioVendedor } from './types'
import { ChevronRight, PackageSearch, Loader2, CheckCircle2, Building2, X } from 'lucide-react'

export function App() {
  // Autenticação & Sessão
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => !!getToken())
  const [currentUser, setCurrentUser] = useState<UsuarioVendedor | null>(null)
  const [empresaAtiva, setEmpresaAtiva] = useState<EmpresaVinculo | null>(null)
  const [empresasDisponiveis, setEmpresasDisponiveis] = useState<EmpresaVinculo[]>([])
  const [switchModalOpen, setSwitchModalOpen] = useState(false)
  const [switching, setSwitching] = useState(false)

  const [produtos, setProdutos] = useState<Produto[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [tabelas, setTabelas] = useState<TabelaPreco[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [fromCache, setFromCache] = useState(false)
  const [isOffline, setIsOffline] = useState(!navigator.onLine)

  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

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
  const [empresaNome, setEmpresaNome] = useState('Thoth Vendas')

  // Salva carrinho localmente
  useEffect(() => {
    localStorage.setItem('vendedor_carrinho', JSON.stringify(itens))
  }, [itens])

  useEffect(() => {
    if (selectedCliente) {
      localStorage.setItem('vendedor_cliente', JSON.stringify(selectedCliente))
    } else {
      localStorage.removeItem('vendedor_cliente')
    }
  }, [selectedCliente])

  // Escuta status offline/online
  useEffect(() => {
    const handleOnline = () => setIsOffline(false)
    const handleOffline = () => setIsOffline(true)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Carrega catálogo e dados da empresa
  const carregarDados = useCallback(async () => {
    if (!getToken()) {
      setIsAuthenticated(false)
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const [prodData, cats, tabs, clis, me] = await Promise.all([
        getProdutos(),
        getCategorias(),
        getTabelasPreco(),
        getClientes(),
        getMe(),
      ])
      setProdutos(prodData.produtos)
      setFromCache(prodData.fromCache)
      setCategorias(cats)
      setTabelas(tabs)
      setClientes(clis)

      if (me) {
        setIsAuthenticated(true)
        if (me.user) setCurrentUser(me.user)
        if (me.empresaAtiva) {
          setEmpresaAtiva(me.empresaAtiva)
          setEmpresaNome(me.empresaAtiva.nome_fantasia || me.empresaAtiva.razao_social || 'Thoth Vendas')
        }
        if (me.empresas && Array.isArray(me.empresas)) {
          setEmpresasDisponiveis(me.empresas)
        }
      }
    } catch (err: any) {
      console.warn('Falha ao carregar dados:', err)
      if (err.message && (err.message.includes('401') || err.message.includes('Sessão expirada'))) {
        setIsAuthenticated(false)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    carregarDados()
  }, [carregarDados])

  // Callback ao fazer login com sucesso na tela de Auth
  const handleAuthSuccess = (empresa: EmpresaVinculo, user: UsuarioVendedor, empresas: EmpresaVinculo[]) => {
    setIsAuthenticated(true)
    setEmpresaAtiva(empresa)
    setCurrentUser(user)
    setEmpresasDisponiveis(empresas)
    setEmpresaNome(empresa.nome_fantasia || empresa.razao_social || 'Thoth Vendas')
    carregarDados()
  }

  // Alternar empresa para vendedores multi-empresa
  const handleTrocarEmpresa = async (empresa: EmpresaVinculo) => {
    setSwitching(true)
    try {
      await selecionarEmpresa(empresa.empresa_id)
      setEmpresaAtiva(empresa)
      setEmpresaNome(empresa.nome_fantasia || empresa.razao_social)
      setSwitchModalOpen(false)
      // Limpa cliente e carrinho da empresa anterior para evitar inconsistência
      setItens([])
      setSelectedCliente(null)
      await carregarDados()
    } catch (err: any) {
      alert(`Erro ao alternar de empresa: ${err.message || err}`)
    } finally {
      setSwitching(false)
    }
  }

  const handleLogout = () => {
    if (confirm('Deseja realmente sair do aplicativo?')) {
      logoutVendedor()
    }
  }

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3000)
  }

  // Adicionar ao carrinho
  const handleAddToCart = (produto: Produto, quantidade: number, tabelaId?: string) => {
    const tabela = tabelas.find((t) => t.id === tabelaId)
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
      const idx = prev.findIndex((it) => it.produtoId === produto.id && it.tabelaPrecoId === tabelaId)
      if (idx >= 0) {
        const copy = [...prev]
        const newQty = copy[idx].quantidade + quantidade
        copy[idx] = {
          ...copy[idx],
          quantidade: newQty,
          subtotal: newQty * precoCobrado,
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
          tabelaPrecoId: tabelaId,
          descontoPct: 0,
          subtotal: quantidade * precoCobrado,
          imagemUrl: produto.imagem_url,
        },
      ]
    })
    showToast(`+${quantidade} ${produto.nome.slice(0, 24)} adicionado`)
  }

  const handleUpdateQty = (produtoId: string, quantidade: number) => {
    setItens((prev) =>
      prev.map((it) => {
        if (it.produtoId === produtoId) {
          return {
            ...it,
            quantidade,
            subtotal: quantidade * it.precoUnitarioCobrado,
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
    if (confirm('Deseja realmente limpar todos os itens do pedido?')) {
      setItens([])
    }
  }

  // Transmitir pedido para a API
  const handleSubmitOrder = async (observacoes: string, condicao: string) => {
    if (!selectedCliente) return
    setIsSubmitting(true)
    try {
      const payload = {
        clienteId: selectedCliente.id,
        tabelaPrecoId: itens[0]?.tabelaPrecoId,
        observacoes: `[Condição: ${condicao}] ${observacoes}`.trim(),
        itens: itens.map((it) => ({
          produtoId: it.produtoId,
          quantidade: it.quantidade,
          precoUnitario: it.precoUnitarioCobrado,
          descontoPct: it.descontoPct,
        })),
      }
      const res = await enviarPedido(payload)
      if (res.offlineQueued) {
        alert('Você está offline. O pedido foi gravado localmente e será enviado assim que a internet retornar!')
      } else {
        alert('✅ Pedido emitido e transmitido com sucesso!')
      }
      setItens([])
      setCartOpen(false)
    } catch (err: any) {
      alert(`Falha ao emitir pedido: ${err.message || err}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Filtros
  const filteredProducts = useMemo(() => {
    return produtos.filter((p) => {
      if (selectedCategory && p.categoria_id !== selectedCategory) return false
      if (!search.trim()) return true
      const term = search.toLowerCase().trim()
      return (
        p.nome.toLowerCase().includes(term) ||
        p.codigo.toLowerCase().includes(term) ||
        (p.categoria_nome && p.categoria_nome.toLowerCase().includes(term))
      )
    })
  }, [produtos, selectedCategory, search])

  const cartTotal = itens.reduce((acc, it) => acc + it.subtotal, 0)
  const cartCount = itens.reduce((acc, it) => acc + it.quantidade, 0)
  const cartTotalFmt = cartTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  // Se não estiver autenticado, exibe a tela de login por CPF + PIN
  if (!isAuthenticated) {
    return <VendedorAuthScreen onSuccess={handleAuthSuccess} />
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-28 md:pb-10">
      {/* Topo com branding, vendedor e empresa */}
      <Header
        storeName={empresaNome}
        vendedorNome={currentUser?.nome}
        empresasCount={empresasDisponiveis.length}
        onSwitchEmpresa={() => setSwitchModalOpen(true)}
        onLogout={handleLogout}
        search={search}
        setSearch={setSearch}
        categories={categorias}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        cartCount={cartCount}
        cartTotal={cartTotal}
        onOpenCart={() => setCartOpen(true)}
        isOffline={isOffline}
      />

      {/* Conteúdo do Catálogo */}
      <main className="mx-auto max-w-6xl px-3 py-4 sm:px-4 sm:py-6">
        <div className="mb-3 flex items-center justify-between text-xs text-slate-500 sm:text-sm px-1">
          <span>
            {filteredProducts.length} produto(s) disponível(is)
            {fromCache ? ' • dados salvos offline' : ''}
          </span>
          {selectedCliente && (
            <span className="font-bold text-teal-800 truncate max-w-[200px]">
              👤 {selectedCliente.razao_social}
            </span>
          )}
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Loader2 className="h-8 w-8 animate-spin text-teal-600 mb-2" />
            <p className="text-xs">Carregando catálogo de produtos…</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-white py-16 text-center">
            <PackageSearch className="h-10 w-10 text-slate-300 mb-2" />
            <p className="text-sm font-bold text-slate-700">Nenhum produto encontrado</p>
            <p className="text-xs text-slate-400 mt-1">Tente ajustar a busca ou escolher outra categoria</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4">
            {filteredProducts.map((p) => (
              <ProductCard
                key={p.id}
                produto={p}
                tabelas={tabelas}
                onAddToCart={handleAddToCart}
              />
            ))}
          </div>
        )}
      </main>

      {/* Barra Flutuante de Resumo do Pedido no Mobile */}
      {cartCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-slate-200 bg-white/95 backdrop-blur px-4 py-3 shadow-xl md:hidden">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
            <div>
              <div className="text-[11px] font-semibold text-slate-400">Total do Pedido ({cartCount} itens)</div>
              <div className="text-lg font-black text-slate-900">{cartTotalFmt}</div>
            </div>
            <button
              onClick={() => setCartOpen(true)}
              className="flex items-center gap-1.5 rounded-xl bg-teal-600 px-5 py-3 text-sm font-bold text-white shadow-md shadow-teal-600/30 active:scale-95"
            >
              <span>Ver Pedido</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Drawer do Carrinho / Pedido */}
      <CartDrawer
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        itens={itens}
        onUpdateQty={handleUpdateQty}
        onRemoveItem={handleRemoveItem}
        onClearCart={handleClearCart}
        selectedCliente={selectedCliente}
        onOpenClienteSelect={() => setClienteModalOpen(true)}
        onSubmitOrder={handleSubmitOrder}
        isSubmitting={isSubmitting}
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
      />

      {/* Modal de Alternar Empresa (quando o vendedor tem mais de uma) */}
      {switchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-3xl bg-white p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-teal-600" />
                <h3 className="font-bold text-sm text-slate-900">Trocar de Empresa</h3>
              </div>
              <button
                type="button"
                onClick={() => setSwitchModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="mt-3 text-xs text-slate-500">
              Escolha para qual empresa deseja emitir pedidos agora:
            </p>

            <div className="mt-3 space-y-2">
              {empresasDisponiveis.map((emp) => {
                const isSelected = empresaAtiva?.empresa_id === emp.empresa_id
                return (
                  <button
                    key={emp.empresa_id}
                    type="button"
                    disabled={switching}
                    onClick={() => handleTrocarEmpresa(emp)}
                    className={`w-full flex items-center justify-between p-3 rounded-2xl border text-left transition-all ${
                      isSelected
                        ? 'border-teal-500 bg-teal-50/80 text-teal-900 font-bold'
                        : 'border-slate-200 bg-slate-50/70 hover:bg-slate-100 text-slate-800'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-xs truncate">{emp.nome_fantasia || emp.razao_social}</div>
                      {emp.cnpj && <div className="text-[10px] text-slate-400 font-mono">{emp.cnpj}</div>}
                    </div>
                    {isSelected && <span className="text-[10px] bg-teal-600 text-white px-2 py-0.5 rounded-full font-bold">Ativa</span>}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Toast Notificação */}
      {toastMessage && (
        <div className="fixed bottom-20 left-1/2 z-50 -translate-x-1/2 flex items-center gap-2 rounded-full bg-slate-900/90 px-4 py-2 text-xs font-semibold text-white shadow-lg backdrop-blur">
          <CheckCircle2 className="h-3.5 w-3.5 text-teal-400" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  )
}
