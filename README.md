# VTT Tables API

Uma API REST em FastAPI para gerenciamento de mesas de jogos virtuais (Virtual Tabletop).

## 🚀 Recursos

- **Rotas implementadas:**
  - `GET /health` → Health check: `{"ok": true}`
  - `POST /tables` → Criar mesa com `{name}` → retorna `{id, name, created_at, updated_at}`
  - `GET /tables/{id}` → Buscar mesa por ID ou retorna 404
  - `GET /tables` → Listar todas as mesas
  - `DELETE /tables/{id}` → Excluir mesa por ID

## 📁 Estrutura do Projeto

```
vtt-ordem/
├── main.py           # Aplicação principal FastAPI
├── models.py         # Modelos SQLAlchemy e schemas Pydantic
├── db.py            # Configuração do banco e sessões
├── requirements.txt  # Dependências do projeto
├── run.bat          # Script para executar localmente
└── README.md        # Este arquivo
```

## 🛠️ Instalação e Execução

### Opção 1: Script automático (Windows)
```bash
./run.bat
```

### Opção 2: Manual
```bash
# Instalar dependências
pip install -r requirements.txt

# Executar servidor
uvicorn main:app --reload --port 8000
```

## 🌐 Endpoints

Após iniciar o servidor, acesse:

- **API**: http://localhost:8000
- **Documentação interativa**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### Exemplos de uso

#### Health Check
```http
GET http://localhost:8000/health
```
Resposta:
```json
{"ok": true}
```

#### Criar Mesa
```http
POST http://localhost:8000/tables
Content-Type: application/json

{"name": "Mesa Principal"}
```
Resposta:
```json
{
  "id": 1,
  "name": "Mesa Principal",
  "created_at": "2025-09-12T10:00:00.000Z",
  "updated_at": "2025-09-12T10:00:00.000Z"
}
```

#### Buscar Mesa
```http
GET http://localhost:8000/tables/1
```

#### Listar Mesas
```http
GET http://localhost:8000/tables
```

## 🗄️ Banco de Dados

- **SQLite** para simplicidade e desenvolvimento
- Arquivo: `vtt_tables.db` (criado automaticamente)
- **Estrutura da tabela `tables`:**
  - `id` (INTEGER, PK, AUTO INCREMENT)
  - `name` (STRING, NOT NULL)
  - `created_at` (DATETIME)
  - `updated_at` (DATETIME)

## 🔮 Próximos Passos

Esta API está preparada para evoluir com:

- **Autenticação JWT**
- **RBAC (Role-Based Access Control)**
  - GM (Game Master)
  - Player
  - Viewer
- **Integração com Redis** (cache/sessões)
- **Integração com MinIO** (armazenamento de arquivos)
- **WebSocket** para tempo real
- **PostgreSQL** para produção

## 📦 Dependências

- `fastapi` - Framework web moderno e rápido
- `uvicorn` - Servidor ASGI
- `sqlalchemy` - ORM para banco de dados
- `pydantic` - Validação de dados
- `python-multipart` - Upload de arquivos

## 🧪 Testes

Para verificar se a API está funcionando:

1. Inicie o servidor
2. Acesse http://localhost:8000/docs
3. Teste os endpoints interativamente
4. Ou use as rotas via HTTP client de sua preferência

## 🔧 Configuração

- **Porta padrão**: 8000
- **Banco**: SQLite local
- **CORS**: Habilitado para desenvolvimento
- **Logs**: SQLAlchemy echo desabilitado por padrão

## 📝 Licença

Projeto desenvolvido para demonstração de API REST com FastAPI.