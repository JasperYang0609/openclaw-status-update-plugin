# OpenClaw Status Update Plugin

A local OpenClaw plugin that registers a `status_update` tool for concise Traditional Chinese progress updates in the current conversation route.

## What it does

- Adds a `status_update` tool to OpenClaw.
- Sends progress updates to the current delivery route only.
- Does not allow the model to choose arbitrary Discord channels/threads.
- Designed for Discord thread workflows where long-running tasks need visible Traditional Chinese status updates.

## Tool contract

```json
{
  "name": "status_update",
  "parameters": {
    "message": "Short Traditional Chinese status summary"
  }
}
```

Safety expectations:

- Do not include chain-of-thought.
- Do not include raw commands.
- Do not include secrets.
- Do not include sensitive local paths.

## Install

```bash
openclaw plugins install /path/to/openclaw-status-update-plugin
openclaw plugins enable status-update
openclaw gateway restart
```

## Recommended OpenClaw config

Allow the plugin/tool for the active tool profile, for example:

```json
{
  "tools": {
    "alsoAllow": ["status-update"]
  },
  "plugins": {
    "allow": ["status-update"],
    "entries": {
      "status-update": { "enabled": true }
    }
  }
}
```

For Discord, if you use this plugin for explicit status updates, consider turning built-in progress drafts off to avoid duplicated or out-of-order progress messages:

```json
{
  "channels": {
    "discord": {
      "streaming": { "mode": "off" }
    }
  }
}
```

## OpenClaw core note

In OpenClaw 2026.5.7, plugin discovery may not include tools that are only added through `tools.alsoAllow` unless the core tool construction pipeline includes `alsoAllow` in the plugin discovery allowlist.

This repo includes `patches/pi-tools-plugin-discovery-alsoAllow.patch` documenting the local fix used during testing.

## Tested behavior

Validated in a Discord thread workflow:

- Gateway restart succeeded.
- Plugin loaded without diagnostics.
- `status_update` appeared in the effective agent tools after the core allowlist patch.
- Long-task test showed status updates arriving before the final answer and spaced across the task.
