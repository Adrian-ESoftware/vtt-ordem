# VTT Frontend

Frontend Next.js para o sistema de mesas virtuais colaborativas.

## 🚀 Tecnologias

- **Next.js 14+** com App Router
- **React + TypeScript**
- **Tailwind CSS** para styling
- **Yjs + y-websocket** para colaboração em tempo real
- **UUID** para IDs únicos

## 🏗️ Arquitetura

### Action Layer Pattern
- ❌ **Cliente NÃO faz mutação direta no Yjs**
- ✅ **Todas as mutações passam pela API REST**
- ✅ **Servidor confirma no SQLite e aplica no Y.Doc**
- ✅ **Clientes recebem updates via WebSocket/Yjs**

### Fluxo de Dados
```
[Cliente] → [API REST] → [SQLite + Y.Doc] → [WebSocket] → [Todos os Clientes]
```

## 📁 Estrutura

```
src/
├── app/
│   ├── page.tsx              # Página inicial
│   └── table/[id]/page.tsx   # Página da mesa
├── components/
│   ├── CanvasTokens.tsx      # Canvas com tokens drag & drop
│   ├── DiceRoller.tsx        # Rolador de dados
│   └── ChatDisplay.tsx       # Exibição de chat/rolls
├── hooks/
│   └── useRoomDoc.ts         # Hook para Yjs connection
├── lib/
│   └── api.ts                # Utilitários da API
└── types/
    └── index.ts              # Tipos TypeScript
```

## 🎯 Funcionalidades

### ✅ Tokens
- **Criar**: Click no canvas
- **Mover**: Drag & drop com debounce de 100ms
- **Renomear/Travar/Deletar**: Painel de controle
- **Sincronização**: Updates aparecem em todos os clientes

### ✅ Dados
- **Expressões customizadas**: `1d20+5`, `3d6`, etc.
- **Rolls rápidos**: d4, d6, d8, d10, d12, d20, d100
- **Modificadores**: Vantagem, Desvantagem
- **Resultados**: Aparecem no chat via Yjs

### ✅ Colaboração
- **WebSocket**: Conexão em tempo real
- **Resiliência**: Se WS cair, REST continua funcionando
- **Convergência**: Quando WS volta, estado converge automaticamente

## ⚙️ Configuração

### Variáveis de Ambiente
```bash
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_SYNC_WS=ws://localhost:1234
```

### Dependências
```bash
npm install
```

### Desenvolvimento
```bash
npm run dev
```

## 🎮 Uso

1. **Inicie o backend FastAPI** na porta 8000
2. **Inicie o frontend Next.js** na porta 3000
3. **Acesse** http://localhost:3000
4. **Clique em "Join Test Table"**
5. **Abra em múltiplas abas/browsers** para testar colaboração

### Testando Colaboração
1. Abra `/table/test-table` em 2+ browsers
2. Crie tokens → aparecem em todos
3. Mova tokens → movimento sincronizado
4. Role dados → resultados em todos
5. Feche/reabra → estado persiste

## 🔌 Integração com Backend

### Endpoints Utilizados
- `GET /api/tables/:id/snapshot` - Estado inicial
- `POST /api/tables/:id/tokens` - Criar token
- `PATCH /api/tables/:id/tokens/:id` - Atualizar token
- `DELETE /api/tables/:id/tokens/:id` - Deletar token
- `POST /api/tables/:id/rolls` - Rolar dados

### WebSocket
- **URL**: `ws://localhost:1234`
- **Protocolo**: `yjs`
- **Finalidade**: Apenas receber difusão do estado

## 🧪 Casos de Teste

### ✅ Critérios de Aceite
- [x] Criar/mover tokens → updates em todos os browsers
- [x] Rolagem de dados → aparece em todos
- [x] WS desconectado → REST continua funcionando
- [x] WS reconectado → estado converge automaticamente
- [x] Reload da página → estado restaurado

## 🔮 Próximos Passos

- [ ] Chat de texto
- [ ] Sistema de camadas
- [ ] Ordem de iniciativa
- [ ] Upload de imagens
- [ ] Medidas/grid
- [ ] Autenticação de usuários
