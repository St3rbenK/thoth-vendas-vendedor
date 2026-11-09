import { get, set } from 'idb-keyval'
import type {
  Produto,
  Categoria,
  Cliente,
  TabelaPreco,
  ItemCarrinho,
  OrcamentoSalvo,
  EmpresaVinculo,
  UsuarioVendedor,
  Pedido,
  VendedorMeta,
  NovoClientePayload,
} from '../types'

// Duas URLs oficiais da API com failover automático (alta disponibilidade)
export const API_URLS: string[] = [
  import.meta.env.VITE_API_URL || 'https://api.thothvendas.com.br',
  'https://vendas-api.thothfy.com.br',
]

let activeApiIndex = 0

export function getApiBase(): string {
  return API_URLS[activeApiIndex] || API_URLS[0]
}

async function fetchFromApi(endpoint: string, init: RequestInit): Promise<Response> {
  let lastErr: unknown
  for (let i = 0; i < API_URLS.length; i++) {
    const idx = (activeApiIndex + i) % API_URLS.length
    const base = API_URLS[idx]
    try {
      const res = await fetch(`${base}${endpoint}`, init)
      activeApiIndex = idx
      return res
    } catch (err) {
      lastErr = err
    }
  }
  throw lastErr || new Error('Sem conexão com o servidor de vendas.')
}

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
    ...((options.headers as Record<string, string>) || {}),
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const res = await fetchFromApi(endpoint, {
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
  const res = await fetchFromApi('/api/auth/vendedor/login', {
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
  const res = await fetchFromApi('/api/auth/vendedor/selecionar-empresa', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
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
  } catch {
    const cached = await get<Categoria[]>('offline_categorias')
    return cached || []
  }
}

// 3. Tabelas de Preço (com deduplicação por nome)
function deduplicarTabelas(list: TabelaPreco[]): TabelaPreco[] {
  const seen = new Set<string>()
  const out: TabelaPreco[] = []
  for (const t of list) {
    const key = (t.nome || '').trim().toLowerCase()
    if (!key || seen.has(key)) continue
    seen.add(key)
    out.push(t)
  }
  return out
}

export async function getTabelasPreco(): Promise<TabelaPreco[]> {
  try {
    const data = await fetchWithAuth('/api/tabelas-preco')
    const list = deduplicarTabelas(data.tabelas || [])
    if (list.length > 0) {
      await set('offline_tabelas', list)
    }
    return list
  } catch {
    const cached = await get<TabelaPreco[]>('offline_tabelas')
    return deduplicarTabelas(cached || [])
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
  } catch {
    const cached = await get<Cliente[]>('offline_clientes')
    return cached || []
  }
}

// 5. Enviar Pedido ou Salvar Orçamento no Servidor
export interface CriarPedidoPayload {
  clienteId: string
  tabelaPrecoId?: string
  formaPagamentoId?: string
  prazoPagamentoId?: string
  condicaoPagamento?: string
  formaPagamento?: string
  status?: 'pendente' | 'orcamento'
  descontoGeralValor?: number
  observacoes?: string
  itens: {
    produtoId: string
    quantidade: number
    precoUnitario: number
    descontoPct: number
    descontoValor?: number
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

// 6. Orçamentos Salvos (Local + Sincronizado com API)
const ORCAMENTOS_STORAGE_KEY = 'thoth_vendedor_orcamentos_salvos'

export function getOrcamentosLocais(): OrcamentoSalvo[] {
  try {
    const raw = localStorage.getItem(ORCAMENTOS_STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function setOrcamentosLocais(list: OrcamentoSalvo[]) {
  localStorage.setItem(ORCAMENTOS_STORAGE_KEY, JSON.stringify(list))
}

export async function salvarOrcamento(params: {
  id?: string
  cliente: Cliente | null
  tabelaPrecoId?: string
  condicaoPagamento: string
  observacoes: string
  itens: ItemCarrinho[]
}): Promise<OrcamentoSalvo> {
  const subtotal = params.itens.reduce((acc, it) => acc + it.quantidade * it.precoUnitarioCobrado, 0)
  const descontoTotal = params.itens.reduce(
    (acc, it) => acc + it.quantidade * it.precoUnitarioCobrado * ((it.descontoPct || 0) / 100),
    0
  )
  const valorTotal = Math.max(0, subtotal - descontoTotal)
  const now = new Date().toISOString()
  const numero = `ORC-${String(Date.now()).slice(-5)}`

  let serverPedidoId: string | undefined
  let serverNumero = numero

  // Se houver cliente selecionado e internet, também salva no banco como status='orcamento'
  if (params.cliente?.id && navigator.onLine) {
    try {
      const res = await enviarPedido({
        clienteId: params.cliente.id,
        tabelaPrecoId: params.tabelaPrecoId,
        condicaoPagamento: params.condicaoPagamento,
        status: 'orcamento',
        observacoes: `[Orçamento • ${params.condicaoPagamento}] ${params.observacoes}`.trim(),
        itens: params.itens.map((it) => ({
          produtoId: it.produtoId,
          quantidade: it.quantidade,
          precoUnitario: it.precoUnitarioCobrado,
          descontoPct: it.descontoPct || 0,
        })),
      })
      if (res?.pedido?.id) {
        serverPedidoId = res.pedido.id
        serverNumero = res.pedido.numero || numero
      }
    } catch (e) {
      console.warn('Orçamento salvo localmente (sem sincronizar com servidor):', e)
    }
  }

  const orcamento: OrcamentoSalvo = {
    id: params.id || serverPedidoId || `orc_${Date.now()}`,
    numero: serverNumero,
    pedidoId: serverPedidoId,
    cliente: params.cliente,
    tabelaPrecoId: params.tabelaPrecoId,
    condicaoPagamento: params.condicaoPagamento,
    observacoes: params.observacoes,
    itens: params.itens,
    subtotal,
    descontoTotal,
    valorTotal,
    createdAt: now,
    updatedAt: now,
  }

  const atuais = getOrcamentosLocais().filter((o) => o.id !== orcamento.id)
  setOrcamentosLocais([orcamento, ...atuais])
  return orcamento
}

export async function removerOrcamento(id: string, pedidoId?: string): Promise<void> {
  const atuais = getOrcamentosLocais().filter((o) => o.id !== id && o.pedidoId !== id)
  setOrcamentosLocais(atuais)
  const targetServerId = pedidoId || (id.startsWith('orc_') ? undefined : id)
  if (targetServerId && navigator.onLine) {
    try {
      await fetchWithAuth(`/api/pedidos/${targetServerId}`, { method: 'DELETE' })
    } catch {
      // ignora caso já tenha sido removido
    }
  }
}

export async function converterOrcamentoNoServidor(pedidoId: string): Promise<Pedido | null> {
  const data = await fetchWithAuth(`/api/pedidos/${pedidoId}/converter`, {
    method: 'POST',
  })
  // Remove dos orçamentos locais se existir
  const atuais = getOrcamentosLocais().filter((o) => o.id !== pedidoId && o.pedidoId !== pedidoId)
  setOrcamentosLocais(atuais)
  return data?.pedido || null
}

// 7. Dados do Vendedor Autenticado
export async function getMe(): Promise<any> {
  try {
    return await fetchWithAuth('/api/auth/me')
  } catch {
    return null
  }
}

// 8. Pedidos do Vendedor (com Fallback Offline)
export async function getPedidos(status?: string): Promise<Pedido[]> {
  try {
    const url =
      status && status !== 'todos'
        ? `/api/pedidos?vendedorId=me&status=${status}`
        : '/api/pedidos?vendedorId=me'
    const data = await fetchWithAuth(url)
    const list: Pedido[] = data.pedidos || []
    if (list.length > 0 && (!status || status === 'todos')) {
      await set('offline_pedidos', list)
    }
    return list
  } catch {
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

// 9. Meta e Desempenho do Vendedor
export async function getVendedorMeta(): Promise<VendedorMeta | null> {
  try {
    const data = await fetchWithAuth('/api/vendedor/meta')
    if (data && data.meta) {
      await set('offline_vendedor_meta', data.meta)
      return data.meta
    }
    return null
  } catch {
    const cached = await get<VendedorMeta>('offline_vendedor_meta')
    return cached || null
  }
}

// 10. Cadastro de Novo Cliente (vinculado ao vendedor e sincronizado com ERP)
export async function criarCliente(payload: NovoClientePayload): Promise<Cliente> {
  const data = await fetchWithAuth('/api/clientes', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  if (!data || !data.cliente) {
    throw new Error(data?.error || 'Erro ao cadastrar cliente')
  }

  const clientes = (await get<Cliente[]>('offline_clientes')) || []
  const updated = [data.cliente, ...clientes.filter((c) => c.id !== data.cliente.id)]
  await set('offline_clientes', updated)

  return data.cliente
}

// 11. Atualização de Perfil e PIN de Segurança do Vendedor
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
