export interface Produto {
  id: string
  codigo: string
  nome: string
  descricao?: string
  categoria_id?: string
  categoria_nome?: string
  unidade: string
  preco_tabela: number
  preco_custo?: number
  preco_minimo?: number
  estoque_atual: number
  estoque_reservado?: number
  estoque_minimo?: number
  imagem_url?: string
  ativo: boolean
}

export interface Categoria {
  id: string
  nome: string
  icone?: string
  ativa: boolean
}

export interface TabelaPreco {
  id: string
  nome: string
  descricao?: string
  tipo_ajuste: string
  percentual_ajuste: number
  padrao: boolean
}

export interface Cliente {
  id: string
  razao_social: string
  nome_fantasia?: string
  cpf_cnpj: string
  email?: string
  telefone?: string
  celular?: string
  contato_nome?: string
  cidade?: string
  estado?: string
  tabela_preco_id?: string
  limite_credito: number
  saldo_devedor: number
  bloqueado: boolean
  motivo_bloqueio?: string
}

export interface ItemCarrinho {
  produtoId: string
  codigo: string
  nome: string
  unidade: string
  quantidade: number
  precoUnitarioTabela: number
  precoUnitarioCobrado: number
  tabelaPrecoId?: string
  descontoPct: number
  subtotal: number
  imagemUrl?: string
}

export interface CondicaoPagamentoOption {
  codigo: string
  nome: string
}

export interface EmpresaVinculo {
  empresa_id: string
  slug: string
  razao_social: string
  nome_fantasia?: string
  cnpj?: string
  logo_url?: string
  role: string
  ativa: boolean
}

export interface UsuarioVendedor {
  id: string
  nome: string
  email: string
  cpf?: string
  telefone?: string
  meta_mensal?: number
  comissao_pct?: number
  limite_desconto_pct?: number
}

export interface ItemPedido {
  id: string
  pedido_id: string
  produto_id: string
  codigo_produto: string
  nome_produto: string
  unidade: string
  quantidade: number
  preco_unitario_tabela: number
  preco_unitario_cobrado: number
  desconto_pct: number
  subtotal: number
  valor_total: number
}

export interface Pedido {
  id: string
  empresa_id: string
  numero: string
  cliente_id: string
  cliente_nome?: string
  vendedor_id?: string
  vendedor_nome?: string
  tabela_preco_id?: string
  forma_pagamento_id?: string
  prazo_pagamento_id?: string
  status: 'pendente' | 'aprovado' | 'faturado' | 'cancelado' | string
  condicao_pagamento?: string
  forma_pagamento?: string
  subtotal: number
  desconto_total: number
  valor_total: number
  observacao?: string
  origem: string
  erp_id?: string
  created_at: string
  updated_at: string
  itens?: ItemPedido[]
}

export interface VendasDiaPonto {
  data: string
  total_valor: number
  qtd_pedidos: number
}

export interface VendedorMeta {
  vendedor_id: string
  vendedor_nome: string
  meta_mensal: number
  total_vendido: number
  percentual_atingido: number
  falta_para_meta: number
  comissao_pct: number
  comissao_estimada: number
  total_pedidos: number
  total_clientes_atendidos: number
  ticket_medio: number
  vendas_por_dia: VendasDiaPonto[]
}

export interface NovoClientePayload {
  razao_social: string
  nome_fantasia?: string
  cpf_cnpj: string
  inscricao_estadual?: string
  email?: string
  telefone?: string
  celular?: string
  contato_nome?: string
  cep?: string
  logradouro?: string
  numero?: string
  complemento?: string
  bairro?: string
  cidade?: string
  estado?: string
  tabela_preco_id?: string
  observacoes?: string
}
