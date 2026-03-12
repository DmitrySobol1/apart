# Как начать

Этот репозиторий — шаблон для настройки проекта под работу с AI-кодингом.

Для начала работы следуйте чеклисту ниже.

## Чеклист

### Claude Code

- Создать [субагентов](https://code.claude.com/docs/en/sub-agents): 
  - [v] Агент для написания кода по плану подзадачи (`Code Implementer`)
  - [v] Агент для написания любого кода, делегированного оркестратором (`Code Writer`)
  - [v] Агент для аудита написанного кода по плану реализации (`Auditor`)
  - [v] Агент для написания документации (`Documentation Writer`)
  - [v] Агент для написания тестов (`Tests Writer`)
  - [v] Агент для проверка качества (`Validator`)

- Создать [кастомные слэш-команды](https://code.claude.com/docs/en/slash-commands):
  - [ ] `/onboard` – онбординг нового агента при старте сессии
  - [ ] `/wf:implement` – запуск `Act` workflow для начала реализации плана

- Создать [Skills](https://code.claude.com/docs/en/skills)
  - [ ] [`act`](./.claude/skills/act/SKILL.md) – pipeline `Act` для выполнения pre-planned задач
  - [ ] [`codex-cli-skill`](https://github.com/timurkhakhalev/cc-plugins/blob/main/plugins/codex-cli-subagent/skills/codex-cli-subagent/SKILL.md) – делегирование работы `Auditor`'а в headless-версию `Codex CLI`
  - [ ] [`steerings-specs-generator`](https://github.com/timurkhakhalev/cc-plugins/blob/main/plugins/steerings-specs-generator/skills/steering-specs-generator/SKILL.md) – генерация steering specs для проекта

- [ ] Добавить [Hooks](https://code.claude.com/docs/en/hooks-guide) в `.claude/settings.local.json`

### Memory Bank

- [ ] Создать директорию `.memory-bank`
- [ ] Начать процесс превращения существующих знаний о проекте в документы Memory Bank
- [ ] Создать `.memory-bank/index.md` как оглавление Memory Bank

### Инструменты

- [ ] Добавить [`claude-auth-selector.sh`](./tools/claude-auth-selector.sh) для переключения между методами авторизации Claude (Subscription, AWS Bedrock, z.ai) в shell-сессиях.
    ```bash
    # В ~/.zshrc:
    source /path/to/tools/claude-auth-selector.sh
    # Использование: claude <command>
    # Сброс авторизации: claude-reset
    ```

- [ ] Добавить [`run-silent.sh`](./tools/run-silent.sh) для подавления вывода успешных команд в хуках.
    ```bash
    sh ./tools/run-silent.sh 'Quality Checks' 'pnpm type-check && pnpm test:run'
    ```
    - При успехе ничего не выводит (держит контекст агента чистым)
    - При ошибке выводит в stderr (для фидбека хуку)

- [ ] Добавить [`stop-hook.sh`](./tools/stop-hook.sh) – универсальный Stop hook wrapper для Claude Code.
    ```bash
    # Использование в hooks.json:
    STOP_HOOK_CMD='pnpm qc:wrapped' bash tools/stop-hook.sh
    ```
    **Возможности:**
    - Запускает QC проверки при остановке Claude
    - Exit code 2 передает stderr в контекст Claude (блокирующая ошибка)
    - Предотвращает infinite loops через флаг `stop_hook_active`
    - Claude автоматически исправляет ошибки и продолжает

### Адаптация файлов под ваш проект

> Необходимо обновить команды, пути в промптах субагентов, команды, workflows хуков и т.д.

- [ ] Адаптировать субагентов Claude Code
  - [ ] `Code Implementer`
  - [ ] `Code Writer`
  - [ ] `Auditor`
  - [ ] `Documentation Writer`
  - [ ] `Tests Writer`
- [ ] Адаптировать кастомные слэш-команды Claude Code
  - [ ] `/onboard`
  - [ ] `/wf:implement`
- [ ] Адаптировать Skills Claude Code
  - [ ] `act`
- [ ] Адаптировать Hooks Claude Code

---

## Полезные Skills

| Skill | Описание | Ссылка |
|-------|----------|--------|
| `act` | Act pipeline для выполнения pre-planned задач через 4-фазный workflow | [SKILL.md](./.claude/skills/act/SKILL.md) |
| `codex-cli-subagent` | Делегирование работы Auditor'а в Codex CLI headless версию | [GitHub](https://github.com/timurkhakhalev/cc-plugins/blob/main/plugins/codex-cli-subagent/skills/codex-cli-subagent/SKILL.md) |
| `steerings-specs-generator` | Генерация steering specs для проекта через guided interviews | [GitHub](https://github.com/timurkhakhalev/cc-plugins/blob/main/plugins/steerings-specs-generator/skills/steering-specs-generator/SKILL.md) |
| `agent-browser` | Browser Automation CLI для AI агентов (Rust CLI + Node.js fallback). Снимки accessibility tree, скриншоты, манипуляция страницами, эмуляция устройств | [GitHub](https://github.com/vercel-labs/agent-browser) |
| `react-best-practices` | React/Next.js performance optimization от Vercel. 45 правил по 8 категориям: waterfalls, bundle size, server/client data loading, re-renders | [GitHub](https://github.com/vercel-labs/agent-skills/blob/main/skills/react-best-practices/SKILL.md) |
| `frontend-design` | Production-grade UI с высоким дизайн-качеством. Design thinking, избежание generic AI aesthetics, характерная типографика, анимации, неожиданные композиции | [GitHub](https://github.com/anthropics/claude-code/blob/main/plugins/frontend-design/skills/frontend-design/SKILL.md) |

## Полезные ссылки

| Ресурс | Описание |
|--------|----------|
| [skills.sh](https://skills.sh/) | Каталог переиспользуемых skills для AI агентов. Быстрая установка через `npx skills add <owner/repo>`. Совместим с Claude Code, Cursor, Copilot, Cline |
| [agentation.dev](https://agentation.dev/) | Visual feedback tool — аннотирование элементов на странице с экспортом CSS селекторов в markdown для точной передачи контекста AI агенту |
