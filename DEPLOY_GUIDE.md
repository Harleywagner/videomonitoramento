# Guia Completo de Deploy - Sistema de Videomonitoramento HUC

## 📋 Índice
1. [Requisitos do Sistema](#requisitos-do-sistema)
2. [Deploy em PXC](#deploy-em-pxc)
3. [Deploy em Servidor Linux (VPS/Nuvem)](#deploy-em-servidor-linux)
4. [Configuração de Banco de Dados](#configuração-de-banco-de-dados)
5. [Variáveis de Ambiente](#variáveis-de-ambiente)
6. [Troubleshooting](#troubleshooting)

---

## 🖥️ Requisitos do Sistema

### Mínimo Recomendado
- **Node.js**: v18+ (recomendado v22)
- **npm/pnpm**: v8+
- **Banco de Dados**: MySQL 8.0+ ou TiDB
- **Espaço em Disco**: 2GB
- **RAM**: 2GB mínimo (4GB recomendado)
- **Porta**: 3000 (ou configurável)

### Verificar Versões Instaladas
```bash
node --version
npm --version
mysql --version
```

---

## 🚀 Deploy em PXC

### Passo 1: Preparar o Servidor PXC

```bash
# Conectar ao servidor PXC via SSH
ssh usuario@seu-pxc.com.br

# Criar diretório para o projeto
mkdir -p /home/seu-usuario/aplicacoes
cd /home/seu-usuario/aplicacoes

# Clonar ou extrair o projeto
# Opção A: Se usar Git
git clone https://github.com/seu-usuario/huc-videomonitoramento.git
cd huc-videomonitoramento

# Opção B: Se usar ZIP
unzip huc-videomonitoramento.zip
cd huc-videomonitoramento
```

### Passo 2: Instalar Dependências

```bash
# Instalar Node.js (se não estiver instalado)
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs

# Instalar pnpm
npm install -g pnpm

# Instalar dependências do projeto
pnpm install
```

### Passo 3: Configurar Banco de Dados

```bash
# Criar banco de dados MySQL
mysql -u root -p

# No prompt MySQL, execute:
CREATE DATABASE huc_videomonitoramento CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'huc_user'@'localhost' IDENTIFIED BY 'sua_senha_segura_aqui';
GRANT ALL PRIVILEGES ON huc_videomonitoramento.* TO 'huc_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### Passo 4: Configurar Variáveis de Ambiente

```bash
# Copiar arquivo de exemplo
cp .env.example .env

# Editar arquivo .env
nano .env
```

Adicione as seguintes variáveis:

```env
# Banco de Dados
DATABASE_URL="mysql://huc_user:sua_senha_segura_aqui@localhost:3306/huc_videomonitoramento"

# Segurança
JWT_SECRET="gere_uma_chave_aleatoria_segura_aqui_min_32_caracteres"
NODE_ENV="production"

# Servidor
PORT=3000
HOST=0.0.0.0

# OAuth (opcional - deixe em branco se não usar)
VITE_APP_ID=""
OAUTH_SERVER_URL=""
VITE_OAUTH_PORTAL_URL=""
```

**Para gerar JWT_SECRET seguro:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Passo 5: Executar Migrações do Banco de Dados

```bash
# Gerar e aplicar migrações
pnpm drizzle-kit generate
pnpm drizzle-kit migrate
```

### Passo 6: Build da Aplicação

```bash
# Compilar para produção
pnpm build

# Verificar se build foi bem-sucedido
ls -la dist/
```

### Passo 7: Iniciar a Aplicação

```bash
# Opção A: Iniciar diretamente (teste)
pnpm start

# Opção B: Usar PM2 para gerenciamento (recomendado)
npm install -g pm2

# Criar arquivo de configuração PM2
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'huc-videomonitoramento',
    script: './dist/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/error.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
  }]
};
EOF

# Iniciar com PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### Passo 8: Configurar Reverse Proxy (Nginx)

```bash
# Instalar Nginx
sudo apt-get install -y nginx

# Criar arquivo de configuração
sudo nano /etc/nginx/sites-available/huc-videomonitoramento
```

Adicione:

```nginx
server {
    listen 80;
    server_name seu-dominio.com.br;

    # Redirecionar HTTP para HTTPS (opcional)
    # return 301 https://$server_name$request_uri;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Ativar configuração:

```bash
# Criar link simbólico
sudo ln -s /etc/nginx/sites-available/huc-videomonitoramento /etc/nginx/sites-enabled/

# Testar configuração
sudo nginx -t

# Reiniciar Nginx
sudo systemctl restart nginx
```

### Passo 9: Configurar SSL/HTTPS (Let's Encrypt)

```bash
# Instalar Certbot
sudo apt-get install -y certbot python3-certbot-nginx

# Gerar certificado
sudo certbot certonly --nginx -d seu-dominio.com.br

# Atualizar configuração Nginx para HTTPS
sudo nano /etc/nginx/sites-available/huc-videomonitoramento
```

Atualize para:

```nginx
server {
    listen 80;
    server_name seu-dominio.com.br;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name seu-dominio.com.br;

    ssl_certificate /etc/letsencrypt/live/seu-dominio.com.br/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/seu-dominio.com.br/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Reiniciar:

```bash
sudo systemctl restart nginx
```

---

## 🐧 Deploy em Servidor Linux (VPS/Nuvem)

### Passo 1-7: Seguir os mesmos passos do PXC acima

### Passo 8: Configurar Firewall

```bash
# Se usar UFW
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# Se usar iptables
sudo iptables -A INPUT -p tcp --dport 22 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 80 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 443 -j ACCEPT
sudo iptables -A INPUT -j DROP
```

### Passo 9: Monitoramento e Logs

```bash
# Ver logs em tempo real
pm2 logs huc-videomonitoramento

# Ver status
pm2 status

# Reiniciar aplicação
pm2 restart huc-videomonitoramento

# Parar aplicação
pm2 stop huc-videomonitoramento
```

---

## 🗄️ Configuração de Banco de Dados

### Backup Automático

```bash
# Criar script de backup
cat > /home/seu-usuario/backup-db.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/home/seu-usuario/backups"
DB_NAME="huc_videomonitoramento"
DB_USER="huc_user"
DB_PASS="sua_senha_segura_aqui"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR
mysqldump -u $DB_USER -p$DB_PASS $DB_NAME > $BACKUP_DIR/backup_$DATE.sql

# Manter apenas últimos 7 dias
find $BACKUP_DIR -name "backup_*.sql" -mtime +7 -delete

echo "Backup realizado: $BACKUP_DIR/backup_$DATE.sql"
EOF

chmod +x /home/seu-usuario/backup-db.sh

# Agendar com cron (diariamente às 2AM)
crontab -e
# Adicione a linha:
# 0 2 * * * /home/seu-usuario/backup-db.sh
```

### Restaurar Backup

```bash
# Restaurar banco de dados
mysql -u huc_user -p huc_videomonitoramento < /caminho/para/backup_YYYYMMDD_HHMMSS.sql
```

---

## 🔐 Variáveis de Ambiente

### Arquivo .env Completo

```env
# ===== BANCO DE DADOS =====
DATABASE_URL="mysql://huc_user:sua_senha_segura@localhost:3306/huc_videomonitoramento"

# ===== SEGURANÇA =====
JWT_SECRET="sua_chave_secreta_aleatoria_min_32_caracteres"
NODE_ENV="production"

# ===== SERVIDOR =====
PORT=3000
HOST=0.0.0.0

# ===== APLICAÇÃO =====
VITE_APP_TITLE="Videomonitoramento HUC"
VITE_APP_LOGO="https://seu-dominio.com/logo.png"

# ===== OAUTH (opcional) =====
VITE_APP_ID=""
OAUTH_SERVER_URL=""
VITE_OAUTH_PORTAL_URL=""
OWNER_OPEN_ID=""
OWNER_NAME=""

# ===== ANALYTICS (opcional) =====
VITE_ANALYTICS_ENDPOINT=""
VITE_ANALYTICS_WEBSITE_ID=""
```

---

## 🔧 Troubleshooting

### Erro: "Port 3000 already in use"

```bash
# Encontrar processo usando porta 3000
lsof -i :3000

# Matar processo
kill -9 <PID>

# Ou usar porta diferente
PORT=3001 pnpm start
```

### Erro: "Cannot connect to database"

```bash
# Verificar se MySQL está rodando
sudo systemctl status mysql

# Reiniciar MySQL
sudo systemctl restart mysql

# Testar conexão
mysql -u huc_user -p -h localhost huc_videomonitoramento
```

### Erro: "Build failed"

```bash
# Limpar cache
rm -rf node_modules
rm -rf dist
pnpm install
pnpm build
```

### Aplicação lenta

```bash
# Verificar uso de recursos
top
free -h
df -h

# Aumentar memória do Node.js
NODE_OPTIONS="--max-old-space-size=4096" pnpm start
```

### Logs não aparecem

```bash
# Criar diretório de logs
mkdir -p ./logs

# Verificar permissões
chmod 755 ./logs

# Ver logs PM2
pm2 logs huc-videomonitoramento
```

---

## ✅ Checklist de Deploy

- [ ] Node.js v18+ instalado
- [ ] Banco de dados MySQL criado
- [ ] Variáveis de ambiente configuradas
- [ ] Migrações aplicadas com sucesso
- [ ] Build compilado sem erros
- [ ] Aplicação iniciada com PM2
- [ ] Nginx configurado como reverse proxy
- [ ] SSL/HTTPS ativado
- [ ] Firewall configurado
- [ ] Backup automático agendado
- [ ] Testes de acesso realizados

---

## 📞 Suporte

Se encontrar problemas:

1. Verifique os logs: `pm2 logs huc-videomonitoramento`
2. Verifique a conexão com banco de dados
3. Verifique as variáveis de ambiente
4. Reinicie a aplicação: `pm2 restart huc-videomonitoramento`

---

**Versão**: 1.0
**Última Atualização**: Fevereiro 2026
**Desenvolvido com**: Node.js + React + Express + tRPC + MySQL
