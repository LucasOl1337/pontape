# Checklist antes de abrir ao público

Preencha para o **commit e domínio escolhidos**. Sem aprovação do Lucas, não publique nem altere DNS.

- [ ] Lucas confirmou nome, domínio, publicação e a rota DNS (raiz ou só `www`). O repositório só será aberto quando ele decidir.
- [ ] `npm run check` passou no commit de produção; o build contém `404.html`, `_headers` e `robots.txt`.
- [ ] Faixa **“Em construção”** visível nas partes que ainda não funcionam; nenhum botão promete atendimento ou doação já abertos.
- [ ] Painel mostra **zero honesto** e livro vazio quando não há eventos; modo de exemplo está claramente marcado como fictício.
- [ ] Nenhum dado pessoal real, segredo, comprovante privado ou informação identificável de candidato aparece no site, JSON, HTML ou assets.
- [ ] Links internos e externos, 404 e volta para a home funcionam; não há URL provisória onde deveria estar o domínio escolhido.
- [ ] Em 360 px e desktop: textos legíveis, foco por teclado, botão **Ouvir**, A+ e diálogos testados; prints de 360 px guardados para revisão.
- [ ] Tempo de carga medido em celular/rede de entrada, resultado anotado e aceito pelo Regente; sem erro de CSP ou conteúdo misto no console.
- [ ] HTTPS e redirecionamento de HTTP conferidos; cabeçalhos de segurança, cache imutável só em `/_astro/` e cache de uma semana nas fontes conferidos na resposta real.
- [ ] Se a versão falhar, há uma versão anterior válida para rollback ou um plano de correção rápida para o primeiro deploy, conforme o [roteiro](LANCAMENTO.md).

A URL `pages.dev` e previews podem ficar acessíveis antes do anúncio; conferir a exposição antes de enviar a alguém. [Cloudflare, previews e integração Git, acesso em 22/09/2026](https://developers.cloudflare.com/pages/configuration/preview-deployments/).
