# F08 · Livro público de ações (transparência total)

Dono: `fino` (EngenheiroFino) · Worktree: `.worktrees/fino` · Branch: `fino/f08-livro` · Começa depois da F02 etapa 2 integrada

## Por que agora

Direção do Lucas ([spec 02](../../fontes/2026-09-22-spec-02.md)): transparência total com **criptografia aberta**, mostrando ao vivo **todas as ações** da plataforma, sejam financeiras, na vida real ou com candidato, pra quem quiser ver, tudo open source. É o coração da confiança e vem junto com o site, antes de entrevista e filtros.

## Base

O desenho já está na [ARQUITETURA §4](../../arquitetura/ARQUITETURA.md): eventos imutáveis, JCS + SHA-256 encadeado, correção por evento novo, lista fechada de campos, verificador independente. Esta frente implementa a primeira versão, com duas mudanças (D010):

1. **Todas as ações, não só dinheiro.** Tipos: `finance`, `field` (vida real, ex.: kit entregue), `candidate` (sempre sem identidade), `project` (decisão registrada, PR integrada, domínio registrado, custo do projeto). Cada tipo tem sua lista fechada de campos. Regra: toda ação aparece; quem é a pessoa, não.
2. **Estático primeiro.** O livro nasce como arquivos JSON canônicos versionados no repositório e entra no build do site. Tempo real com banco fica pra F2. "Ao vivo" nesta versão é: cada evento novo publica o site de novo, e a página mostra a hora da última atualização.

## Entregáveis

1. Schema e tipos TypeScript dos eventos, exportados pra F07 usar.
2. Script de publicação (`npm run ledger:append`) que valida o evento, calcula o hash e grava. **Dry-run por padrão, `--apply` explícito.** Quem roda em produção é o Regente.
3. Verificador aberto: CLI (`npm run ledger:verify`) e a mesma lógica rodando no navegador pro botão "Conferir" da F07. Sem credencial nenhuma.
4. **Criptografia aberta além do hash:** proponha e, se for simples, implemente (a) assinatura dos checkpoints com chave pública publicada e chave privada fora do repositório, e (b) ancoragem do hash da cabeça num carimbo de tempo público e gratuito (ex.: OpenTimestamps), pra ninguém, nem a gente, reescrever o passado sem ser pego. O que depender de custódia de chave ou decisão do Lucas, deixe como proposta no DIARIO.
5. **Livro semeado com eventos reais do projeto**, não fictícios: criação do repositório, decisões D001 em diante, PRs integradas (#2 a #5), com data e link. Fixture fictícia separada, marcada como fictícia, pros testes e pro modo exemplo.
6. `docs/transparencia/COMO-CONFERIR.md` em PT-BR simples: como qualquer pessoa confere o livro sozinha.
7. Testes: adulteração de campo, evento apagado, ordem trocada, cadeia quebrada, campo fora da lista (ex.: `cpf`, `name`, texto livre) rejeitado antes de gravar.

## Limites

Sem banco, sem conta em serviço, sem deploy. Carimbo de tempo público só se não exigir conta nem pagamento; mesmo assim, a primeira ancoragem de verdade é o Regente quem roda.

## Pronto quando

- `ledger:verify` passa no livro semeado e falha em cada caso de adulteração dos testes.
- A F07 consegue importar tipos e verificador sem copiar código.
- PR aberta pra `main`, CI verde, report ao Regente.
