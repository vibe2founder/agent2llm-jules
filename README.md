# Agent2LLM

Um agente de programação via CLI usando TUI (Text User Interface) focado em auxiliar o desenvolvedor diretamente no terminal.
Ele se comporta como um assistente de IA focado em tarefas de código, e usa ferramentas seguras para manipular o sistema de arquivos local.

Baseado na biblioteca [llm2router / one-llm-4-all](https://github.com/vibe2founder/llm2router).

## Como Instalar e Rodar

Certifique-se de que você tem o [Bun](https://bun.sh/) instalado.

1. Instale as dependências:
   ```bash
   bun install
   ```

2. Configure suas chaves de API. Crie um arquivo `.env` na raiz do projeto:
   ```env
   GROQ_API_KEY=sua_chave_groq
   # ou OPENAI_API_KEY=sua_chave_openai
   # MODEL=llama-3.1-8b-instant
   # PROVIDER=groq
   ```

3. Inicie a interface TUI do agente:
   ```bash
   bun start
   ```

## Funcionalidades
- **Interface TUI interativa**: Interface de terminal responsiva com histórico de chat colorido usando [Ink](https://github.com/vadimdemedes/ink).
- **Tool Calling Seguro**: O agente tem a habilidade de listar, ler, editar e excluir arquivos restritos ao diretório onde é executado, usando as ferramentas providas por `@purecore/one-llm-4-all`.
- **Histórico Persistente**: A cada mensagem, o histórico da conversa é salvo no arquivo `.agent_history.json`. Quando você reiniciar o chat, a conversa anterior é carregada automaticamente.
