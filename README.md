<div align="center">

💍 Casamento — Tânia Maria & Eliclécio Batista

Um convite digital elegante, interativo e conectado aos convidados



<img src="./assets/convites/convite-modelo-2.png" alt="Convite de casamento de Tânia Maria e Eliclécio Batista" width="330" />

</div>

📖 Sobre o projeto

Este projeto é um site de casamento responsivo desenvolvido para Tânia Maria e Eliclécio Batista. A aplicação transforma o convite tradicional em uma experiência digital completa, permitindo que os convidados consultem as informações da cerimônia, confirmem presença, acompanhem a contagem regressiva e escolham presentes.

O sistema utiliza o Supabase para persistência global e controle concorrente da lista de presentes, garantindo que um mesmo item não seja reservado por duas pessoas. Também possui integração opcional com a WhatsApp Cloud API, responsável por notificar a noiva quando um presente for escolhido.

✨ Principais funcionalidades

Identificação do convidado por nome em um pop-up de boas-vindas.

Reconhecimento de convidados que já confirmaram presença.

Confirmação de presença imediata ou em outro momento.

Exibição dos nomes do casal, data, horário, local e versículo.

Contagem regressiva em tempo real para a cerimônia.

Mini player fixo do YouTube com a playlist do casamento.

Lista de presentes com foto, descrição, valor e link de compra.

Confirmação antes da reserva de um presente.

Bloqueio global e atômico dos presentes escolhidos.

Atualização periódica da disponibilidade dos itens.

Notificação automática para o WhatsApp da noiva.

Alternativa manual pelo WhatsApp quando a API não estiver configurada.

Layout adaptado para celular, tablet e computador.

🔄 Jornada do convidado

flowchart TD
    A[Acessa o site] --> B[Informa o nome]
    B --> C{Já confirmou presença?}
    C -- Sim --> D[Mensagem de boas-vindas]
    C -- Não --> E[Convite para confirmar presença]
    E --> F[Confirma agora]
    E --> G[Confirma depois]
    D --> H[Navega pelo site]
    F --> H
    G --> H
    H --> I[Escolhe um presente]
    I --> J{Presente disponível?}
    J -- Não --> K[Atualiza a lista]
    J -- Sim --> L[Reserva no Supabase]
    L --> M[Exibe o link de compra]
    L --> N[Notifica a noiva]

🧰 Tecnologias utilizadas

Camada

Tecnologia

Responsabilidade

Interface

HTML5

Estrutura semântica das páginas e modais

Estilização

CSS3

Layout floral, responsividade e animações

Aplicação

JavaScript ES Modules

Regras de interação, RSVP, presentes e player

Banco de dados

PostgreSQL / Supabase

Convidados, confirmações e reservas

Backend serverless

Supabase Edge Functions

Envio seguro de notificações

Música

YouTube IFrame Player API

Reprodução da playlist do casamento

Mensageria

WhatsApp Cloud API

Notificação automática da escolha do presente

Hospedagem

Vercel

Publicação do frontend estático

🏗️ Arquitetura

Navegador do convidado
        │
        ├── HTML + CSS + JavaScript
        │        │
        │        ├── YouTube Player API
        │        └── Supabase JavaScript Client
        │
        ▼
Supabase
        ├── PostgreSQL
        │     ├── guests
        │     ├── gifts
        │     └── funções RPC
        │
        └── Edge Function: notify-bride
                    │
                    ▼
            WhatsApp Cloud API

A reserva do presente é processada diretamente no PostgreSQL por uma função RPC. A atualização ocorre somente quando o item ainda não possui um responsável, evitando duplicidade mesmo quando duas pessoas tentam reservá-lo simultaneamente.

📁 Estrutura do projeto

site-casamento-tania-elicelio/
├── assets/
│   ├── convites/                 # Artes utilizadas no site
│   ├── gifts/                    # Imagens dos presentes
│   └── music/                    # Orientações sobre mídia local
├── supabase/
│   ├── functions/
│   │   └── notify-bride/
│   │       └── index.ts          # Notificação pelo WhatsApp
│   ├── admin-queries.sql         # Consultas administrativas
│   └── schema.sql                # Tabelas, políticas, funções e dados iniciais
├── api.js                        # Camadas Local e Supabase
├── app.js                        # Regras da interface
├── config.js                     # Configurações personalizáveis
├── index.html                    # Página principal
├── styles.css                    # Estilos e responsividade
├── vercel.json                   # Configuração de publicação
├── .gitignore
└── README.md

🚀 Executando localmente

O projeto é estático e não exige instalação de dependências nem processo de build.

Opção 1 — Live Server

Abra a pasta no VS Code.

Instale a extensão Live Server.

Clique com o botão direito em index.html.

Selecione Open with Live Server.

Opção 2 — Python

python -m http.server 5500

Depois, acesse:

http://localhost:5500

Abrir o arquivo HTML diretamente pelo explorador pode impedir o carregamento dos módulos JavaScript. Utilize sempre um servidor local.

⚙️ Configuração do casamento

Edite o arquivo config.js:

export const WEDDING_CONFIG = {
  bride: {
    firstName: "Tânia",
    fullName: "Tânia Maria",
  },
  groom: {
    firstName: "Eliclécio",
    fullName: "Eliclécio Batista",
  },
  monogram: "T & E",
  dateISO: "2026-09-15T20:00:00-03:00",
  dateLabel: "15 de setembro de 2026",
  timeLabel: "20:00 horas",
  venue: {
    name: "Nome do espaço da cerimônia",
    address: "Endereço completo do casamento",
    mapsUrl: "https://maps.google.com/",
  },
};

Também é possível alterar o versículo, a playlist do YouTube, o intervalo de atualização dos presentes e o número utilizado no fallback manual do WhatsApp.

🗄️ Configuração do Supabase

Sem o Supabase, o site funciona em modo de demonstração e armazena as informações somente no navegador atual. Para habilitar a persistência global:

Crie um projeto no Supabase.

Abra SQL Editor.

Execute todo o conteúdo de supabase/schema.sql.

Acesse Project Settings → API.

Copie a URL do projeto e a chave pública publishable.

Preencha o config.js:

supabase: {
  url: "https://SEU-PROJETO.supabase.co",
  publishableKey: "SUA_CHAVE_PUBLICA",
},

Segurança das chaves

A chave pública pode ser usada no navegador porque o banco está protegido por políticas e funções específicas. Nunca coloque no frontend:

service_role
sb_secret_...
senha do banco
token da Meta

🎁 Cadastro de presentes

Os presentes iniciais são cadastrados pelo arquivo supabase/schema.sql. Cada item possui:

Campo

Descrição

Exemplo

name

Nome do presente

Air Fryer 5L

description

Descrição exibida no card

Para deixar as refeições mais práticas.

price_cents

Valor em centavos

49990

image_url

Caminho ou URL pública da imagem

./assets/gifts/air-fryer.svg

purchase_url

Link utilizado após a reserva

Link da loja

active

Controla a exibição no site

true

Exemplo de valor:

49990 = R$ 499,90

Os itens também podem ser administrados pelo Table Editor do Supabase.

🔒 Bloqueio contra escolha duplicada

O sistema não confia apenas no estado exibido na tela. A função SQL responsável pela reserva atualiza o presente somente quando chosen_by ainda está vazio.

update public.gifts
set chosen_by = p_guest_id,
    chosen_at = now()
where id = p_gift_id
  and chosen_by is null;

Dessa forma, caso duas pessoas cliquem praticamente ao mesmo tempo, somente a primeira reserva é concluída. A segunda recebe a informação de que o presente já foi escolhido.

📲 Integração com o WhatsApp

A integração automática é opcional e utiliza uma Supabase Edge Function. O token da Meta permanece no servidor e nunca é enviado ao navegador.

Modelo de mensagem

Crie no WhatsApp Manager um modelo chamado:

presente_casamento_escolhido

Corpo sugerido:

{{1}} escolheu te dar o presente {{2}}.

Exemplo enviado:

Carlos escolheu te dar o presente Jogo de Cama.

Segredos da Edge Function

supabase secrets set WHATSAPP_TOKEN="SEU_TOKEN"
supabase secrets set WHATSAPP_PHONE_NUMBER_ID="SEU_PHONE_NUMBER_ID"
supabase secrets set BRIDE_WHATSAPP_NUMBER="5582999999999"
supabase secrets set WHATSAPP_TEMPLATE_NAME="presente_casamento_escolhido"
supabase secrets set WHATSAPP_TEMPLATE_LANGUAGE="pt_BR"
supabase secrets set WHATSAPP_GRAPH_API_VERSION="VERSAO_ATIVA"

Publique a função:

supabase functions deploy notify-bride

Caso a integração automática não esteja disponível, o site exibe o botão Avisar no WhatsApp, abrindo uma mensagem previamente preenchida para envio manual.

🎵 Playlist do casamento

O player é fixado no canto inferior direito e acompanha o rolamento da página. A playlist é definida no config.js:

music: {
  provider: "youtube",
  playlistId: "PLCggmkGw79n8V3eZuRpuzETFljnj5-qNw",
  title: "Playlist de músicas do casamento",
},

Os navegadores podem impedir reprodução automática com som antes da primeira interação. Por isso, o player inicia conforme as permissões disponíveis e tenta liberar o áudio após a interação do convidado com o site.

🧪 Consultas administrativas

O arquivo supabase/admin-queries.sql contém comandos para consultar convidados, verificar presentes escolhidos e liberar reservas durante testes.

Liberar todos os presentes e remover convidados de teste

begin;

update public.gifts
set
  chosen_by = null,
  chosen_at = null,
  notification_sent_at = null;

delete from public.guests;

commit;

Depois, limpe o convidado armazenado no navegador:

localStorage.removeItem("wedding_guest");
location.reload();

☁️ Publicação na Vercel

Envie o projeto para um repositório no GitHub.

Entre na Vercel e selecione Add New → Project.

Importe o repositório.

Em Framework Preset, selecione Other.

Deixe Build Command vazio.

Use . em Output Directory.

Clique em Deploy.

Depois da primeira publicação, cada git push na branch principal inicia uma nova implantação automaticamente.

📤 Publicação no GitHub

git init
git add .
git commit -m "feat: cria site do casamento de Tânia e Eliclécio"
git branch -M main
git remote add origin https://github.com/SEU-USUARIO/Site-Casamento-Tania-Elicelio.git
git push -u origin main

Atualizações futuras:

git add .
git commit -m "feat: atualiza site do casamento"
git push

🛡️ Boas práticas de segurança

Não exponha tokens, senhas ou chaves administrativas no GitHub.

Mantenha as credenciais da Meta somente nos segredos da Edge Function.

Use apenas a chave pública do Supabase no config.js.

Considere utilizar um código individual para cada convite quando houver convidados com nomes iguais.

Revise os dados pessoais antes de tornar o repositório público.

Mantenha o número da noiva fora do frontend caso não utilize o fallback manual.

🧭 Melhorias futuras

Painel administrativo protegido por autenticação.

Exportação da lista de convidados para CSV.

Confirmação de acompanhantes e quantidade de pessoas.

Filtro e busca na lista de presentes.

Galeria de fotos do casal.

Livro de mensagens para os convidados.

QR Code individual para acesso ao convite.

Relatórios de presença e presentes escolhidos.

👨‍💻 Autor

Desenvolvido por Carlos Lima.

GitHub: developercarloslima

Direitos autorais

© 2026 Carlos Lima. Todos os direitos reservados.

Este repositório está disponível para fins de demonstração e portfólio. A cópia, modificação, distribuição ou utilização comercial do código não é permitida sem autorização prévia.

<div align="center">
  <strong>Feito com carinho para celebrar a união de Tânia Maria e Eliclécio Batista.</strong>
</div>