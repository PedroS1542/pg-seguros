PG SEGUROS — versão 5.1

Atualizações:
- Removidos do Dashboard: quantidade da carteira, valor total e ticket médio.
- Mantido no Dashboard o alerta de renovações do mês e a lista de próximas renovações.
- Novo seguro agora possui Início da vigência e Final da vigência.
- Ao cadastrar um seguro novo, o status começa sempre como Ativo, mesmo se o mês de renovação informado for o mês atual.
- No próximo ciclo anual, quando chegar o mês da renovação, o status muda para A renovar (amarelo).
- Enquanto estiver A renovar, aparece a ação Marcar renovado.
- Ao marcar como renovado, o seguro volta para Ativo e fica preparado para o próximo ano.
- Cancelado continua disponível como status manual.
- Mantidos telefone, seguradora, ramo, sinistro, endosso e cálculo do prêmio total.
- Novo seguro continua abrindo formulário limpo automaticamente.

Login:
Usuário: pgseguros
Senha: PgBc@2027


Importação de renovações: lê todas as abas da planilha, encontra o cabeçalho mesmo quando está na linha 3 e reconhece FINAL VIGÊNCIA, CLIENTE, SEGURADORA, RAMO, PRÊMIO ANTERIOR e TELEFONE. O início da vigência é opcional; a renovação automática usa a Final da vigência.
