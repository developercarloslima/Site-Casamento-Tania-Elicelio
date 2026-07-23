# Site de Casamento — Tânia Maria & Eliclécio Batista

Site responsivo inspirado no convite floral enviado, com confirmação de presença, música, contagem regressiva, lista de presentes com bloqueio global e notificação da noiva pelo WhatsApp.

## Funcionalidades

- Pop-up de identificação pelo nome do convidado.
- Mensagem personalizada para quem já confirmou presença.
- Confirmação imediata ou opção de confirmar em outro momento.
- Informações do convite: casal, data, horário, local e versículo.
- Contagem regressiva para o casamento.
- Mini player incorporado do YouTube com reprodução contínua da playlist do casamento.
- Lista de presentes com imagem, descrição, valor e link de compra.
- Confirmação antes de reservar o presente.
- Reserva atômica: duas pessoas não conseguem escolher o mesmo item.
- O link de compra só é retornado depois da reserva bem-sucedida.
- Mensagem automática à noiva usando WhatsApp Cloud API.
- Fallback manual por link `wa.me` quando a API não estiver configurada.
- Layout adaptado para celular, tablet e desktop.

## Pré-visualização rápida

O projeto não precisa de build.

1. Abra a pasta em um servidor local. Uma opção é usar a extensão **Live Server** no VS Code.
2. Outra opção, com Python instalado:

```bash
python -m http.server 5500
```

3. Acesse `http://localhost:5500`.

Sem Supabase, o site entra em **modo de demonstração** e salva os dados somente no navegador atual.

## 1. Personalizar os dados do casamento

Edite `config.js`:

```js
export const WEDDING_CONFIG = {
  bride: { firstName: "Tânia", fullName: "Tânia Maria" },
  groom: { firstName: "Eliclécio", fullName: "Eliclécio Batista" },
  dateISO: "2026-09-15T20:00:00-03:00",
  dateLabel: "15 de setembro de 2026",
  timeLabel: "20:00 horas",
  venue: {
    name: "Nome do espaço",
    address: "Endereço completo",
    mapsUrl: "https://maps.google.com/...",
  },
};
```

Também informe `brideWhatsappNumber` caso queira manter o fallback manual. Use somente números, com DDI e DDD.

## 2. Configurar o Supabase

1. Crie um projeto no Supabase.
2. Abra **SQL Editor**.
3. Execute todo o arquivo `supabase/schema.sql`.
4. Abra **Project Settings → API**.
5. Copie a URL do projeto e a chave pública/publishable.
6. Cole em `config.js`:

```js
supabase: {
  url: "https://SEU-PROJETO.supabase.co",
  publishableKey: "SUA_CHAVE_PUBLICA",
},
```

Nunca coloque a chave `service_role` no navegador.

### Como o bloqueio de presentes funciona

A função SQL `choose_gift` executa um `UPDATE` somente quando `chosen_by is null`. Essa operação ocorre no banco de dados e é atômica. Quando duas pessoas tentam reservar o mesmo item, apenas a primeira consegue; a segunda recebe `already_chosen`.

As tabelas estão com RLS ativado e sem acesso direto para `anon`. O navegador usa apenas funções RPC com retorno limitado.

## 3. Configurar a mensagem automática no WhatsApp

A automação usa uma Supabase Edge Function e a WhatsApp Cloud API oficial.

### Criar o template no WhatsApp Manager

Crie e aguarde a aprovação de um template chamado:

```text
presente_casamento_escolhido
```

Corpo sugerido:

```text
{{1}} escolheu te dar o presente {{2}}.
```

O primeiro parâmetro será o primeiro nome do convidado e o segundo será o presente.

### Configurar os segredos da Edge Function

No Supabase CLI:

```bash
supabase login
supabase link --project-ref SEU_PROJECT_REF
supabase secrets set WHATSAPP_TOKEN="SEU_TOKEN"
supabase secrets set WHATSAPP_PHONE_NUMBER_ID="SEU_PHONE_NUMBER_ID"
supabase secrets set BRIDE_WHATSAPP_NUMBER="5582999999999"
supabase secrets set WHATSAPP_TEMPLATE_NAME="presente_casamento_escolhido"
supabase secrets set WHATSAPP_TEMPLATE_LANGUAGE="pt_BR"
supabase secrets set WHATSAPP_GRAPH_API_VERSION="v24.0"
```

Depois publique:

```bash
supabase functions deploy notify-bride
```

O telefone da noiva deve conter DDI e DDD, somente números.

> A versão da Graph API pode ser atualizada pela Meta. Mantenha `WHATSAPP_GRAPH_API_VERSION` configurável e ajuste-a conforme a versão ativa na sua conta.

## 4. Música do casamento

O site utiliza o player oficial incorporado do Spotify para a faixa **Meu Sucesso é Você — Anderson Freire**:

```text
https://open.spotify.com/embed/track/0RAU9ErnH6NMnznVbxMtd4
```

O player exibe somente a capa e os controles de áudio, sem vídeo. Por regra dos navegadores e do Spotify, o visitante precisa clicar em **Reproduzir** para iniciar a música; a reprodução automática com som não é garantida.

## 5. Cadastrar presentes reais

Você pode editar os `INSERTS` no final de `supabase/schema.sql` antes de executar ou alterar os dados diretamente no Table Editor.

Campos:

- `name`: nome do presente.
- `description`: descrição curta.
- `price_cents`: valor em centavos. Ex.: `49990` = R$ 499,90.
- `image_url`: caminho de imagem ou URL pública.
- `purchase_url`: link exato para compra.
- `active`: define se o presente aparece no site.

As ilustrações em `assets/gifts` são exemplos e podem ser substituídas por fotos reais.

## 6. Consultar confirmações e presentes

O arquivo `supabase/admin-queries.sql` possui consultas prontas para:

- listar convidados confirmados;
- visualizar presentes escolhidos;
- liberar manualmente um presente.

## 7. Publicar na Vercel

1. Envie a pasta para um repositório GitHub.
2. Na Vercel, clique em **Add New → Project**.
3. Importe o repositório.
4. Framework Preset: **Other**.
5. Build Command: deixe vazio.
6. Output Directory: `.`
7. Clique em **Deploy**.

Também é possível publicar como site estático no Netlify, Cloudflare Pages ou GitHub Pages.

## Observações de segurança

- A identificação somente pelo nome é adequada para uma lista simples de convidados, mas não é autenticação forte.
- Quando houver convidados com nomes iguais ou quando o casamento for privado, acrescente um código individual ao convite.
- O envio automático de WhatsApp deve ocorrer apenas no servidor/Edge Function; tokens nunca devem ficar no JavaScript do navegador.
