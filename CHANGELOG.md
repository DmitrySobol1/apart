# Журнал изменений

Все значимые изменения в этом шаблоне документируются в этом файле.

Формат основан на [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
версионирование следует [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.4.0] - 2026-01-23

### Добавлено
- Секция "Полезные Skills" в README с таблицей из 6 skills
- Секция "Полезные ссылки" в README (skills.sh, agentation.dev)
- Перевод README и CHANGELOG на русский язык

## [1.3.0] - 2026-01-23

### Добавлено
- `stop-hook.sh` - универсальный Stop hook wrapper с защитой от infinite loops
- CHANGELOG.md для версионирования шаблона

### Изменено
- `hooks.json` - переход на stop-hook.sh для Stop и SubagentStop хуков
- `run-silent.sh` - вывод ошибок в stderr для корректной работы с хуками
- README - обновлена документация по tools

## [1.2.0] - 2026-01-12

### Добавлено
- `act` skill - pipeline для выполнения pre-planned задач с 4-фазным workflow
- Параллельное выполнение subtasks через `subtasks/index.md`
- `claude-auth-selector.sh` - переключение между методами авторизации (Subscription, AWS Bedrock, z.ai)
- `pack-repo.sh` - упаковка репозитория

### Изменено
- Стандартизация именования subtasks на паттерн `stt-`
- Externalize команды из промптов агентов
- Обновлена документация act skill

## [1.1.0] - 2025-12-16

### Добавлено
- `run-silent.sh` - подавление вывода успешных команд для hooks
- Ссылки на CC marketplace плагины

### Изменено
- Обновлен промпт Auditor
- Добавлен timeout для CLI агентов

## [1.0.0] - 2025-11-22

### Добавлено
- Начальная структура шаблона
- Субагенты: Code Implementer, Code Writer, Auditor, Documentation Writer, Tests Writer
- Кастомные слэш-команды: `/onboard`, `/wf:implement`
- Конфигурация Hooks
- Структура Memory Bank
- README с чеклистом настройки
