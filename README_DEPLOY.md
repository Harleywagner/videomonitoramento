# 🚀 Sistema de Videomonitoramento HUC - Pronto para Deploy

## ⚡ Início Rápido (5 minutos)

### 1. Extrair o ZIP
```bash
unzip huc-videomonitoramento.zip
cd huc-videomonitoramento
```

### 2. Instalar Dependências
```bash
npm install -g pnpm
pnpm install
```

### 3. Configurar Banco de Dados
```bash
# Criar banco MySQL
mysql -u root -p
CREATE DATABASE huc_videomonitoramento;
CREATE USER 'huc_user'@'localhost' IDENTIFIED BY 'sua_senha_aqui';
GRANT ALL PRIVILEGES ON huc_videomonitoramento.* TO 'huc_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 4. Configurar .env
```bash
cp .env.example .env
nano .env
```

Adicione:
```
DATABASE_URL="mysql://huc_user:sua_senha_aqui@localhost:3306/huc_videomonitoramento"
JWT_SECRET="gere_uma_chave_aleatoria_segura_aqui"
NODE_ENV="production"
PORT=3000
```

### 5. Aplicar Migrações
```bash
pnpm drizzle-kit generate
pnpm drizzle-kit migrate
```

### 6. Build e Deploy
```bash
pnpm build
npm install -g pm2
pm2 start ecosystem.config.js
```

### 7. Acessar
Abra no navegador: `http://seu-servidor:3000`

**Credenciais:**
- Usuário: `HUCprevenção`
- Senha: `operadorTAJ`

---

## 📁 Estrutura do Projeto

```
huc-videomonitoramento/
├── client/                 # Frontend React
│   ├── src/
│   │   ├── pages/         # Páginas (Dashboard, Ocorrências, Câmeras, Relatórios)
│   │   ├── components/    # Componentes reutilizáveis
│   │   └── lib/           # Utilitários e configurações
│   └── public/            # Arquivos estáticos
├── server/                # Backend Express + tRPC
│   ├── routers.ts         # APIs e endpoints
│   ├── db.ts              # Funções de banco de dados
│   └── _core/             # Configurações internas
├── drizzle/               # Migrações de banco de dados
│   └── schema.ts          # Definição de tabelas
├── DEPLOY_GUIDE.md        # Guia completo de deploy
├── package.json           # Dependências
├── .env.example           # Exemplo de variáveis
└── pnpm-lock.yaml         # Lock file
```

---

## 🎯 Funcionalidades

✅ **Autenticação Compartilhada** - Login único para múltiplos operadores
✅ **Dashboard em Tempo Real** - Estatísticas atualizadas a cada 5 segundos
✅ **CRUD de Ocorrências** - Registrar, editar, excluir ocorrências
✅ **Gerenciamento de Câmeras** - 9 NVRs com 32 câmeras cada
✅ **Gráficos Interativos** - Visualização de dados com Canvas
✅ **Relatórios em PDF** - Exportar com filtros por período
✅ **Sincronização em Tempo Real** - Todos veem as mesmas atualizações
✅ **Testes Unitários** - 10 testes cobrindo todas as funcionalidades

---

## 🔐 Segurança

- ✅ Senhas hasheadas no banco de dados
- ✅ JWT para autenticação
- ✅ HTTPS/SSL recomendado
- ✅ Validação de entrada em todos os formulários
- ✅ Proteção contra SQL injection (Drizzle ORM)

---

## 📊 Banco de Dados

### Tabelas Principais

**occurrences** - Armazena todas as ocorrências
- 16 campos obrigatórios
- Índices para busca rápida
- Timestamps automáticos

**cameras** - Gerencia 288 câmeras
- 9 NVRs com 32 câmeras cada
- Status: Online/Offline/Defeito
- Observações técnicas

**users** - Registro de usuários
- Autenticação
- Rastreamento de acesso

---

## 🛠️ Comandos Úteis

```bash
# Desenvolvimento
pnpm dev              # Iniciar servidor de desenvolvimento

# Produção
pnpm build            # Compilar para produção
pnpm start            # Iniciar aplicação

# Banco de Dados
pnpm drizzle-kit generate    # Gerar migrações
pnpm drizzle-kit migrate     # Aplicar migrações

# Testes
pnpm test             # Executar testes unitários

# Linting
pnpm format           # Formatar código
pnpm check            # Verificar tipos TypeScript
```

---

## 🚨 Troubleshooting

### Porta 3000 já está em uso
```bash
lsof -i :3000
kill -9 <PID>
```

### Erro de conexão com banco de dados
```bash
# Verificar se MySQL está rodando
sudo systemctl status mysql

# Testar conexão
mysql -u huc_user -p -h localhost huc_videomonitoramento
```

### Build falha
```bash
rm -rf node_modules dist
pnpm install
pnpm build
```

---

## 📚 Documentação Completa

Veja `DEPLOY_GUIDE.md` para:
- Deploy em PXC
- Deploy em VPS/Nuvem
- Configuração de Nginx
- SSL/HTTPS
- Backup automático
- Monitoramento
- Troubleshooting avançado

---

## 📞 Suporte Rápido

1. **Verifique os logs**: `pm2 logs huc-videomonitoramento`
2. **Reinicie a app**: `pm2 restart huc-videomonitoramento`
3. **Verifique .env**: Todas as variáveis estão corretas?
4. **Banco de dados**: `mysql -u huc_user -p huc_videomonitoramento`

---

## 📦 Dependências Principais

- **Node.js**: v18+
- **React**: 19.2
- **Express**: 4.21
- **tRPC**: 11.6
- **Drizzle ORM**: 0.44
- **MySQL**: 8.0+
- **Tailwind CSS**: 4.1

---

## 📝 Licença

Propriedade da HUC - Sistema de Videomonitoramento
Uso restrito a operadores autorizados

---

**Versão**: 1.0
**Data**: Fevereiro 2026
**Status**: Pronto para Produção ✅
