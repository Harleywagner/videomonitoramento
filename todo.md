# Sistema de Videomonitoramento HUC - TODO

## Funcionalidades Planejadas

### Autenticação e Segurança
- [ ] Sistema de autenticação com login/senha compartilhados (HUCprevenção / operadorTAJ)
- [ ] Suporte a múltiplos operadores logados simultaneamente
- [ ] Sessão persistente com logout

### Banco de Dados
- [ ] Tabela de ocorrências com todos os campos obrigatórios
- [ ] Tabela de câmeras (9 NVRs x 32 câmeras)
- [ ] Tabela de usuários para rastreamento de operadores
- [ ] Índices e relacionamentos apropriados

### Dashboard e Estatísticas
- [ ] Exibição de total de ocorrências
- [ ] Contagem de ocorrências resolvidas
- [ ] Contagem de ocorrências pendentes
- [ ] Taxa de resolução em percentual
- [ ] Contagem de câmeras online
- [ ] Contagem de câmeras offline
- [ ] Contagem de câmeras com defeito

### Gerenciamento de Ocorrências
- [ ] Formulário de registro de ocorrência com validação
- [ ] Edição de ocorrências existentes
- [ ] Exclusão de ocorrências
- [ ] Tabela com busca por texto
- [ ] Filtro por tipo de ocorrência
- [ ] Filtro por status (Encerrada/Em andamento)
- [ ] Detalhes expansíveis na tabela
- [ ] Ações de editar/excluir na tabela

### Gerenciamento de Câmeras
- [ ] Seletor de NVR (1-9)
- [ ] Grade de câmeras por NVR
- [ ] Indicadores visuais de status (Online/Offline/Defeito)
- [ ] Modal para editar status de câmera
- [ ] Campo de observações técnicas por câmera
- [ ] Atualização visual instantânea

### Gráficos e Análises
- [ ] Gráfico de barras por tipo de ocorrência
- [ ] Gráfico de pizza do status das câmeras
- [ ] Renderização responsiva dos gráficos

### Relatórios
- [ ] Geração de relatório em PDF
- [ ] Filtro por período (hoje, semana, mês, todos)
- [ ] Impressão de relatórios
- [ ] Formatação profissional do relatório

### Sincronização em Tempo Real
- [ ] WebSocket ou polling para sincronização entre usuários
- [ ] Atualização automática de ocorrências
- [ ] Atualização automática de status de câmeras
- [ ] Notificações de mudanças em tempo real

### Interface e UX
- [ ] Layout responsivo
- [ ] Design limpo e funcional para ambiente operacional
- [ ] Navegação por abas (Dashboard, Ocorrências, Câmeras, Relatórios)
- [ ] Notificações de sucesso/erro
- [ ] Indicadores visuais de carregamento

### Testes
- [ ] Testes unitários com vitest
- [ ] Testes de autenticação
- [ ] Testes de CRUD de ocorrências
- [ ] Testes de CRUD de câmeras

## Progresso

- [x] Projeto web inicializado com tRPC + React + Express
- [x] Schema de banco de dados criado
- [x] Migrações de banco de dados aplicadas
- [x] Autenticação implementada (login HUCprevenção / operadorTAJ)
- [x] APIs de ocorrências criadas (CRUD completo)
- [x] APIs de câmeras criadas (CRUD completo)
- [x] Interface do dashboard construída com estatísticas
- [x] Interface de ocorrências construída com formulário e tabela
- [x] Interface de câmeras construída com seletor de NVR
- [x] Gráficos implementados (pizza com status de câmeras)
- [x] Relatórios implementados com geração de PDF
- [x] Sincronização em tempo real implementada (polling a cada 5s)
- [x] Testes escritos e passando (10 testes)
- [x] Aplicação testada e pronta para deploy
