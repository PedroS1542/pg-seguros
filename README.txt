PG SEGUROS — VERSÃO 7.4 | REDESIGN VISUAL + SUPABASE

Esta versão mantém os recursos do PG Seguros e passa o cadastro, edição, cancelamento, exclusão, renovação e importação de Excel a usar o banco Supabase.

RECURSOS
- Interface redesenhada com identidade visual corporativa em azul-marinho, azul e dourado
- Tela de login em duas colunas, com apresentação da marca e formulário de acesso
- Layout responsivo para computador, tablet e celular
- Dashboard profissional com maior hierarquia visual
- Cadastro de seguros
- Início e final da vigência
- Renovação automática pela Final da Vigência
- Status Ativo / A renovar / Cancelado
- Marcar renovado
- Importação de Excel com várias abas
- WhatsApp por cliente
- Retorno para o mesmo cliente após edição
- Rolagem vertical dentro da tabela
- Logo e favicon PG Seguros
- Supabase conectado ao banco public.Seguros

SUPABASE
- Project URL configurada no app.js
- Publishable key configurada no app.js
- A tabela usada é public.Seguros
- As operações dependem das políticas RLS criadas no Supabase

IMPORTANTE
A Publishable key pode aparecer no código de um site público. Não coloque service_role, secret key ou outras chaves secretas no GitHub Pages.

ATUALIZAÇÃO — ENDOSSO E SINISTRO
Antes de usar os campos de endosso no cadastro/edição, execute no SQL Editor do Supabase:

ALTER TABLE "Seguros"
  ADD COLUMN IF NOT EXISTS claim text DEFAULT 'Não',
  ADD COLUMN IF NOT EXISTS endorsement text DEFAULT 'Não',
  ADD COLUMN IF NOT EXISTS endorsement_value numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS endorsement_type text DEFAULT 'Pagar';

Os campos de endosso e sinistro agora são gravados ao cadastrar e ao editar. Na carteira, seguros com sinistro exibem “Sinistro” e seguros com endosso exibem “Endosso” sem exibir o valor na etiqueta. O valor continua salvo e é incorporado ao prêmio total: “Pagar” soma e “Restituir” subtrai.

