# Atualizações desta versão

Esta versão substitui integralmente a identificação de casamento por **Noivado e Chá de Bênção**.

## Alterações aplicadas

- Título, descrição, textos, acessibilidade e mensagens do evento atualizados.
- Mensagem de confirmação de presença:
  - `PrimeiroNome, posso confirmar sua presença para juntos celebrarmos o Noivado e o Chá de Bênção de Tânia e Eliclécio?`
- Nova arte vetorial do convite, sem referências a casamento.
- Mini player do YouTube fixo no canto inferior direito.
- Playlist configurada: `PLCggmkGw79n8V3eZuRpuzETFljnj5-qNw`.
- Reserva global de presentes via Supabase preservada.
- Mensagem do WhatsApp:
  - `PrimeiroNome escolheu te dar o presente NomeDoPresente.`
- Nome padrão do template da Meta atualizado para `presente_noivado_escolhido`.
- README, estrutura do repositório e comandos do GitHub atualizados.

## Antes de publicar

Preencha no `config.js`:

- URL pública do Supabase;
- chave `publishable` do Supabase;
- local e endereço da celebração;
- link do Google Maps;
- número do WhatsApp para o fallback manual.

Não coloque chaves `service_role`, `sb_secret_...`, senha do banco ou token da Meta no frontend.

## Correção do mini player no celular

- Player fixo no canto inferior direito em todas as resoluções.
- Dimensão móvel reduzida para `168 × 95 px` e `156 × 88 px` em telas de até 360 px.
- Regras críticas incluídas no HTML para evitar que cache antigo transforme o player em rodapé.
- Arquivos CSS e JavaScript recebem versão na URL para atualização imediata após o deploy.
