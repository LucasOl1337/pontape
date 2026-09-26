export interface Option {
  type: 'string' | 'boolean';
  description: string;
  required?: boolean;
  choices?: string[];
  default?: string | boolean;
  short?: string;
}
export interface Command {
  name: string;
  description: string;
  effect: 'read' | 'local' | 'request' | 'apply' | 'server';
  handler: 'local' | 'ledger' | 'http' | 'process' | 'mock';
  options: Record<string, Option>;
  example: string;
}
const string = (description: string, extra: Partial<Option> = {}): Option => ({ type: 'string', description, ...extra });
const flag = (description: string): Option => ({ type: 'boolean', description });
const apply = { apply: flag('Executa a alteração; sem esta opção, apenas simula.') };
const file = { file: string('Livro local. Padrão: src/data/ledger/ledger.json deste checkout.') };
const remote = { remote: flag('Lê o livro pela API em --base-url, em vez do arquivo local.') };
const input = { input: string('Arquivo JSON; use - para ler stdin.', { required: true }) };
const port = { port: string('Porta TCP (1 a 65535).') };
const command = (name: string, description: string, effect: Command['effect'], handler: Command['handler'], options: Command['options'], example: string): Command => ({ name, description, effect, handler, options, example: `pontape ${example}` });

export const GLOBAL_OPTIONS: Record<string, Option> = {
  json: { ...flag('Um envelope JSON em stdout, inclusive em erro.'), short: 'j' },
  help: { ...flag('Mostra ajuda sem executar.'), short: 'h' },
  version: { ...flag('Mostra a versão do pacote e do contrato.'), short: 'v' },
  'base-url': string('Origem HTTP. PONTAPE_BASE_URL ou http://127.0.0.1:8794.'),
  'timeout-ms': string('Prazo da chamada HTTP ou subprocesso finito (padrão: 30000 / 600000).'),
};

export const COMMANDS: Command[] = [
  command('capabilities', 'Lista comandos, opções, efeitos e exemplos em formato descobrível.', 'read', 'local', {}, 'capabilities --json'),
  command('doctor', 'Confere Node, dependências e arquivos locais; retorna erro se falta requisito.', 'read', 'local', {}, 'doctor --json'),
  command('status', 'Resume o checkout, módulos, snapshot financeiro e livro local.', 'read', 'local', {}, 'status --json'),
  command('docs list', 'Lista os documentos operacionais disponíveis.', 'read', 'local', {}, 'docs list'),
  command('docs show', 'Lê um documento pelo nome listado em docs list.', 'read', 'local', { name: string('Nome do documento.', { required: true }) }, 'docs show --name cli'),
  command('site routes', 'Lista as rotas implementadas em src/pages.', 'read', 'local', {}, 'site routes --json'),
  command('site data', 'Consulta os dados que alimentam o site.', 'read', 'local', {
    collection: string('Coleção pública.', { required: true, choices: ['modules', 'journey', 'bottlenecks', 'contributions', 'transparency', 'project'] }),
    id: string('Filtra um item pelo id.'),
  }, 'site data --collection modules --id M4 --json'),
  command('ledger init', 'Cria um livro vazio em arquivo novo para testes locais.', 'local', 'ledger', { out: string('Arquivo novo de saída.', { required: true }) }, 'ledger init --out /tmp/livro-ficticio.json'),
  command('ledger list', 'Lista eventos verificados com filtros e paginação.', 'read', 'ledger', {
    ...file, ...remote, type: string('Tipo do evento.', { choices: ['project', 'finance', 'field', 'candidate'] }),
    after: string('Sequência exclusiva, padrão 0.'), limit: string('Quantidade entre 1 e 1000, padrão 50.'),
  }, 'ledger list --type project --limit 5 --json'),
  command('ledger show', 'Mostra um evento pela sequência.', 'read', 'ledger', { ...file, ...remote, sequence: string('Sequência positiva.', { required: true }) }, 'ledger show --sequence 1 --json'),
  command('ledger summary', 'Confere a corrente e calcula saldo e totais em centavos exatos.', 'read', 'ledger', { ...file, ...remote }, 'ledger summary --json'),
  command('ledger verify', 'Verifica integridade; aceita checkpoint guardado e assinatura com chave confiada.', 'read', 'ledger', {
    ...file, ...remote, checkpoint: string('Checkpoint JSON guardado anteriormente.'),
    signed: string('Checkpoint assinado local.'), 'public-key': string('Chave Ed25519 hexadecimal obtida por canal confiado; exige --signed.'),
  }, 'ledger verify --remote --base-url https://pontape.org --json'),
  command('ledger export', 'Exporta documento verificado; --out cria arquivo novo, sem sobrescrever.', 'local', 'ledger', { ...file, ...remote, out: string('Arquivo novo de saída; sem ele, devolve o documento.') }, 'ledger export --out /tmp/pontape-livro.json'),
  command('ledger trust', 'Lê metadados publicados de assinatura/carimbo, sem presumir verificação externa.', 'read', 'ledger', { ...remote }, 'ledger trust --json'),
  command('ledger append', 'Propõe um evento; usa validação, lock e escrita atômica existentes.', 'apply', 'process', { ...file, event: string('Payload JSON local.', { required: true }), ...apply }, 'ledger append --event /tmp/evento.json'),
  command('ledger sign', 'Assina um checkpoint com chave Ed25519 externa ao repo.', 'apply', 'process', { ...file, key: string('Chave privada PEM externa (só lida com --apply).'), out: string('Arquivo novo de assinatura.'), ...apply }, 'ledger sign'),
  command('ledger drain', 'Ingeste envelope ou webhook; --apply usa LEDGER_SIGNING_PKCS8 e carimbo externo.', 'apply', 'process', { ...input, ...apply }, 'ledger drain --input /tmp/envelope.json'),
  command('ledger stamp', 'Carimba a cabeça do livro via Rekor/freetsa com LEDGER_SIGNING_PKCS8.', 'apply', 'process', apply, 'ledger stamp'),
  command('ledger sync-project', 'Concilia PRs e decisões a partir do Git e GitHub; requer gh autenticado.', 'apply', 'process', apply, 'ledger sync-project'),
  command('ledger reconcile', 'Consulta extrato Asaas e devolve envelopes pendentes; não grava o livro.', 'read', 'process', {}, 'ledger reconcile --json'),
  command('chat health', 'Consulta a configuração do chat na origem escolhida.', 'read', 'http', {}, 'chat health --json'),
  command('chat ask', 'Envia pergunta à Yume e lê SSE até a conclusão. Pode consumir o provedor.', 'request', 'http', {
    message: string('Uma pergunta de até 600 caracteres; exclusiva com --input.'),
    input: string('JSON {messages, chatId?}; - lê stdin. Histórico alternado de até 12 falas.'),
    'chat-id': string('UUID v4 para registrar a conversa; sem ele não arquiva.'),
  }, 'chat ask --message "Como funciona o PontaPé?" --json'),
  command('metrics public', 'Consulta os seis contadores públicos (cache de até 60 s).', 'read', 'http', {}, 'metrics public --json'),
  command('metrics hit', 'Registra uma interação usando o contrato do site.', 'apply', 'http', { ...input, ...apply }, 'metrics hit --input /tmp/clique.json'),
  command('auth login', 'Abre sessão admin própria do CLI, sem imprimir cookie ou senha.', 'request', 'http', {
    user: string('Usuário; alternativa: PONTAPE_ADMIN_USER.'),
    'password-stdin': flag('Lê a senha em stdin; alternativa: PONTAPE_ADMIN_PASSWORD.'),
  }, 'auth login --user admin --password-stdin'),
  command('auth session', 'Confere a sessão guardada para esta origem.', 'read', 'http', {}, 'auth session --json'),
  command('auth logout', 'Fecha a sessão do CLI para esta origem e remove o arquivo local.', 'request', 'http', {}, 'auth logout'),
  command('admin stats', 'Consulta estatísticas de 30 dias autenticado.', 'read', 'http', {}, 'admin stats --json'),
  command('admin chats', 'Lista conversas com paginação de 20 itens.', 'read', 'http', { page: string('Página de 1 a 9999; padrão 1.') }, 'admin chats --page 1 --json'),
  command('admin chat', 'Lê o histórico de uma conversa autenticado.', 'read', 'http', { id: string('UUID da conversa.', { required: true }) }, 'admin chat --id 11111111-1111-4111-8111-111111111111 --json'),
  command('donation checkout', 'Abre checkout pelas regras/flags do Worker; valor em centavos.', 'apply', 'http', {
    'amount-cents': string('1000, 2000, 5000 ou 10000.', { required: true, choices: ['1000', '2000', '5000', '10000'] }), ...apply,
  }, 'donation checkout --amount-cents 1000'),
  command('donation webhook', 'Envia webhook Asaas; token via PONTAPE_WEBHOOK_TOKEN. Pode acionar o livro.', 'apply', 'http', { ...input, ...apply }, 'donation webhook --input /tmp/webhook.json'),
  command('dev site', 'Inicia Astro em primeiro plano. Ctrl+C encerra.', 'server', 'process', port, 'dev site --port 4321'),
  command('dev worker', 'Inicia Wrangler local com .env, build e D1 persistente (script existente).', 'server', 'process', port, 'dev worker --port 8794'),
  command('dev mock', 'Worker real com SQLite em memória e provedores fictícios, só em loopback.', 'server', 'mock', { port: string('Porta TCP; 0 escolhe uma livre. Padrão: 8794.') }, 'dev mock --port 8794'),
  command('preview', 'Serve o build Astro em primeiro plano.', 'server', 'process', port, 'preview --port 4321'),
  command('build', 'Gera conhecimento Yume, site estático e headers CSP.', 'local', 'process', {}, 'build --json'),
  command('check', 'Executa verificações do projeto.', 'local', 'process', {
    scope: string('Verificação.', { choices: ['all', 'lint', 'types', 'tests', 'build', 'budget'], default: 'all' }),
  }, 'check --scope all --json'),
  command('test', 'Executa testes locais por área.', 'local', 'process', {
    suite: string('Área.', { choices: ['all', 'cli', 'worker', 'ledger', 'python'], default: 'all' }),
  }, 'test --suite cli --json'),
  command('ops deploy', 'Build e dry-run do script de publicação; --apply publica main limpa.', 'apply', 'process', apply, 'ops deploy'),
  command('ops migrate', 'Planeja migração D1 remota; --apply executa o script existente.', 'apply', 'process', apply, 'ops migrate'),
];

export const DOCS: Record<string, string> = {
  cli: 'docs/cli/README.md', plan: 'docs/cli/PLANO.md', product: 'docs/PRD.md', board: 'docs/QUADRO.md',
  ledger: 'docs/transparencia/OPERACAO.md', verification: 'docs/transparencia/COMO-CONFERIR.md',
  metrics: 'docs/operacao/METRICAS.md', rollback: 'docs/operacao/VOLTAR-ATRAS.md', contributing: 'CONTRIBUTING.md',
};
