import { get, set, del } from 'idb-keyval'
import type {
  Produto,
  Categoria,
  Cliente,
  TabelaPreco,
  ItemCarrinho,
  EmpresaVinculo,
  UsuarioVendedor,
  Pedido,
  VendedorMeta,
  NovoClientePayload,
} from '../types'

const API_BASE = import.meta.env.VITE_API_URL || 'https://vendas-api.thothfy.com.br'

export function getToken(): string | null {
  const match = document.cookie.match(/(?:^|;\s*)thoth_vendas_token=([^;]+)/)
  if (match) return decodeURIComponent(match[1])
  return localStorage.getItem('thoth_vendas_token')
}

export function setToken(token: string) {
  localStorage.setItem('thoth_vendas_token', token)
  document.cookie = `thoth_vendas_token=${encodeURIComponent(token)}; path=/; max-age=2592000; SameSite=Lax`
}

export function clearToken() {
  localStorage.removeItem('thoth_vendas_token')
  document.cookie = 'thoth_vendas_token=; path=/; max-age=-1'
}

export async function fetchWithAuth(endpoint: string, options: RequestInit = {}): Promise<any> {
  const token = getToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include',
  })

  if (res.status === 401) {
    clearToken()
    throw new Error('Sessão expirada. Faça login com seu CPF e PIN.')
  }

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}))
    throw new Error(errorBody.error || `Erro HTTP ${res.status}`)
  }

  return res.json()
}

// Autenticação de Vendedor (CPF + PIN)
export interface LoginResponse {
  ok: boolean
  requerSelecaoEmpresa?: boolean
  token?: string
  user: UsuarioVendedor
  empresaAtiva?: EmpresaVinculo
  empresas: EmpresaVinculo[]
  error?: string
}

export async function loginVendedor(cpf: string, pin: string): Promise<LoginResponse> {
  const res = await fetch(`${API_BASE}/api/auth/vendedor/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cpf, pin }),
    credentials: 'include',
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok || !data.ok) {
    throw new Error(data.error || 'Falha ao autenticar. Verifique o CPF e o PIN.')
  }

  if (data.token && !data.requerSelecaoEmpresa) {
    setToken(data.token)
  }

  return data
}

export async function selecionarEmpresa(empresaId: string, tempToken?: string): Promise<LoginResponse> {
  const token = tempToken || getToken() || ''
  const res = await fetch(`${API_BASE}/api/auth/vendedor/selecionar-empresa`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ empresaId, token }),
    credentials: 'include',
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok || !data.ok) {
    throw new Error(data.error || 'Falha ao selecionar empresa.')
  }

  if (data.token) {
    setToken(data.token)
  }

  return data
}

export function logoutVendedor() {
  clearToken()
  localStorage.removeItem('vendedor_carrinho')
  localStorage.removeItem('vendedor_cliente')
  window.location.reload()
}

// 1. Produtos com Fallback Offline
export async function getProdutos(): Promise<{ produtos: Produto[]; fromCache: boolean }> {
  try {
    const data = await fetchWithAuth('/api/produtos')
    const list: Produto[] = data.produtos || []
    if (list.length > 0) {
      await set('offline_produtos', list)
      await set('offline_produtos_time', new Date().toISOString())
    }
    return { produtos: list, fromCache: false }
  } catch (err) {
    const cached = await get<Produto[]>('offline_produtos')
    if (cached && cached.length > 0) {
      return { produtos: cached, fromCache: true }
    }
    throw err
  }
}

// 2. Categorias com Fallback Offline
export async function getCategorias(): Promise<Categoria[]> {
  try {
    const data = await fetchWithAuth('/api/categorias')
    const list: Categoria[] = data.categorias || []
    if (list.length > 0) {
      await set('offline_categorias', list)
    }
    return list
  } catch (err) {
    const cached = await get<Categoria[]>('offline_categorias')
    return cached || []
  }
}

// 3. Tabelas de Preço
export async function getTabelasPreco(): Promise<TabelaPreco[]> {
  try {
    const data = await fetchWithAuth('/api/tabelas-preco')
    const list: TabelaPreco[] = data.tabelas || []
    if (list.length > 0) {
      await set('offline_tabelas', list)
    }
    return list
  } catch (err) {
    const cached = await get<TabelaPreco[]>('offline_tabelas')
    return cached || []
  }
}

// 4. Clientes da Carteira
export async function getClientes(): Promise<Cliente[]> {
  try {
    const data = await fetchWithAuth('/api/clientes')
    const list: Cliente[] = data.clientes || []
    if (list.length > 0) {
      await set('offline_clientes', list)
    }
    return list
  } catch (err) {
    const cached = await get<Cliente[]>('offline_clientes')
    return cached || []
  }
}

// 5. Enviar Pedido
export interface CriarPedidoPayload {
  clienteId: string
  tabelaPrecoId?: string
  formaPagamentoId?: string
  prazoPagamentoId?: string
  observacoes?: string
  itens: {
    produtoId: string
    quantidade: number
    precoUnitario: number
    descontoPct: number
  }[]
}

export async function enviarPedido(payload: CriarPedidoPayload): Promise<any> {
  try {
    const data = await fetchWithAuth('/api/pedidos', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    return data
  } catch (err) {
    if (!navigator.onLine) {
      const queue = (await get<any[]>('pending_orders_queue')) || []
      queue.push({ ...payload, queuedAt: new Date().toISOString() })
      await set('pending_orders_queue', queue)
      return { ok: true, offlineQueued: true }
    }
    throw err
  }
}

// 6. Dados do Vendedor Autenticado
export async function getMe(): Promise<any> {
  try {
    return await fetchWithAuth('/api/auth/me')
  } catch {
    return null
  }
}

// 7. Pedidos do Vendedor (com Fallback Offline)
export async function getPedidos(status?: string): Promise<Pedido[]> {
  try {
    const url = status && status !== 'todos' ? `/api/pedidos?vendedorId=me&status=${status}` : '/api/pedidos?vendedorId=me'
    const data = await fetchWithAuth(url)
    const list: Pedido[] = data.pedidos || []
    if (list.length > 0) {
      await set('offline_pedidos', list)
    }
    return list
  } catch (err) {
    const cached = await get<Pedido[]>('offline_pedidos')
    return cached || []
  }
}

export async function getPedidoDetalhes(id: string): Promise<Pedido | null> {
  try {
    const data = await fetchWithAuth(`/api/pedidos/${id}`)
    return data.pedido || null
  } catch {
    return null
  }
}

// 8. Meta e Desempenho do Vendedor
export async function getVendedorMeta(): Promise<VendedorMeta | null> {
  try {
    const data = await fetchWithAuth('/api/vendedor/meta')
    if (data && data.meta) {
      await set('offline_vendedor_meta', data.meta)
      return data.meta
    }
    return null
  } catch (err) {
    const cached = await get<VendedorMeta>('offline_vendedor_meta')
    return cached || null
  }
}

// 9. Cadastro de Novo Cliente (vinculado ao vendedor e sincronizado com ERP)
export async function criarCliente(payload: NovoClientePayload): Promise<Cliente> {
  const data = await fetchWithAuth('/api/clientes', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  if (!data || !data.cliente) {
    throw new Error(data?.error || 'Erro ao cadastrar cliente')
  }

  // Atualiza cache offline de clientes
  const clientes = (await get<Cliente[]>('offline_clientes')) || []
  const updated = [data.cliente, ...clientes.filter((c) => c.id !== data.cliente.id)]
  await set('offline_clientes', updated)

  return data.cliente
}

// 10. Atualização de Perfil e PIN de Segurança do Vendedor
export async function updateVendedorPerfil(dados: {
  nome?: string
  email?: string
  telefone?: string
  pin?: string
}): Promise<{ ok: boolean; message?: string; user?: UsuarioVendedor }> {
  const data = await fetchWithAuth('/api/vendedor/perfil', {
    method: 'PUT',
    body: JSON.stringify(dados),
  })
  return data
}
