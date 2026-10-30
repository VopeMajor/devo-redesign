# Prospector de clientes

Encontra empresas no Google Maps que **não têm site** (ou que têm só Instagram/Facebook),
separa as que têm **celular/WhatsApp** e monta um painel com uma mensagem personalizada
para cada uma. Você clica em "Abrir no WhatsApp", a conversa abre com o texto pronto e
você só aperta enviar.

Não precisa instalar nada além do Node 18+. A pasta é independente do resto do projeto.

## 1. Pegar a chave do Google (uma vez)

1. Entre em <https://console.cloud.google.com/> e crie um projeto.
2. Em **APIs e serviços → Biblioteca**, ative **Places API (New)**.
3. Em **APIs e serviços → Credenciais**, crie uma **chave de API** e restrinja ela à Places API.
4. Crie o arquivo `prospector/.env` com:

   ```
   GOOGLE_PLACES_API_KEY=sua-chave-aqui
   ```

O Google pede um cartão para ativar o faturamento, mas dá uma cota gratuita todo mês.
Cada busca de nicho + cidade usa até 3 requisições (60 empresas). Confira os preços atuais
em <https://developers.google.com/maps/billing-and-pricing/pricing> e coloque um limite
de orçamento no console para não ter surpresa.

## 2. Configurar suas mensagens

```bash
cp prospector/config.example.json prospector/config.json
```

Edite `config.json`:

| Campo | O que é |
|---|---|
| `seuNome` | como você se apresenta |
| `portfolio` | link com seus sites (fundamental para converter) |
| `oferta` | uma frase sobre o que você entrega |
| `limiteDiario` | quantas mensagens o painel deixa mandar por dia (padrão 30) |
| `diasParaFollowUp` | depois de quantos dias sem resposta sugerir uma segunda mensagem |
| `apenasCelular` | `true` descarta telefones fixos, que quase nunca têm WhatsApp |
| `mensagens` | os textos. Há várias versões; cada empresa recebe uma delas |

Variáveis que você pode usar nos textos: `{empresa}`, `{nicho}`, `{cidade}`,
`{avaliacao}` (ex.: "nota 4,8 com 132 avaliações"), `{seuNome}`, `{portfolio}`, `{oferta}`.

## 3. Buscar clientes

```bash
node prospector/buscar.mjs --nicho "barbearia, pet shop, salão de beleza" --cidade "Campinas, SP"
```

Várias cidades: separe com ponto e vírgula, por exemplo `--cidade "Campinas, SP; Valinhos, SP"`.
Pode rodar quantas vezes quiser: empresas repetidas não entram duas vezes.

Nichos que costumam render: barbearia, salão de beleza, manicure, pet shop, clínica
veterinária, oficina mecânica, borracharia, auto elétrica, lava-rápido, academia,
personal trainer, dentista, fisioterapia, psicólogo, nutricionista, advogado, contador,
imobiliária, marmoraria, vidraçaria, serralheria, marcenaria, eletricista, encanador,
dedetizadora, buffet, confeitaria, hamburgueria, pizzaria, açaí, floricultura, ótica,
escola de idiomas, autoescola.

Já tem uma lista própria? Importe uma planilha CSV com as colunas
`nome, telefone, nicho, cidade, endereco, site`:

```bash
node prospector/importar.mjs minha-lista.csv
```

## 4. Mandar as mensagens

Abra `prospector/dados/painel.html` no navegador (de preferência no mesmo computador em
que você usa o WhatsApp Web/Desktop).

- **Para enviar hoje** mostra os novos e quem precisa de follow-up, com as empresas com mais avaliações primeiro.
- Dá para editar o texto antes de enviar.
- Ao clicar em **Abrir no WhatsApp**, o lead vira "Enviado". Quando a pessoa responder, mude o status para Respondeu, Interessado ou Fechado.
- Depois de `diasParaFollowUp` dias sem resposta, o lead volta para a fila com a mensagem de follow-up.
- O andamento fica salvo no navegador. Use **Baixar backup** de vez em quando e **Exportar planilha** para ter tudo em Excel/Sheets.

Sempre que buscar mais leads, o painel é gerado de novo e o andamento continua lá.

## Para não ter o WhatsApp bloqueado

O WhatsApp bane números que mandam muitas mensagens para quem não tem o contato salvo,
principalmente quando muita gente marca como spam. Por isso a ferramenta **não** dispara
mensagens automaticamente: você envia uma a uma.

- Use um **WhatsApp Business** com foto, nome comercial, descrição e link do portfólio.
- Comece com 10 a 20 mensagens por dia e vá aumentando aos poucos. Não passe de 30 a 50.
- Espalhe os envios ao longo do dia, em horário comercial.
- Toda mensagem já oferece a opção de não receber mais. Se alguém pedir, marque **Sem interesse** e não insista.
- Faça no máximo um follow-up.

Os dados ficam em `prospector/dados/` e não vão para o Git (veja o `.gitignore`).
Use os contatos só para oferecer seu serviço, sem repassar a terceiros, conforme a LGPD.

## Testes

```bash
node --test prospector/teste.mjs
```
