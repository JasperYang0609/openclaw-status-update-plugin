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

## Recommended status update policy

The plugin only provides the `status_update` tool. Trigger timing is controlled by the channel or agent prompt.

Recommended policy for Discord workflows:

- Use `status_update` for every user-assigned task, not only long-running tasks.
- Send updates on meaningful events: phase changes, tool failures, retries, blockers, verification, or completion.
- Also send an update when the assistant's working state changes materially: assumptions, strategy, risk judgment, confidence, validation approach, or next step.
- Report only a concise Traditional Chinese summary of the current phase, blocker/change, decision-basis summary, and next step.
- Do not disclose hidden chain-of-thought, full reasoning traces, secrets, sensitive local paths, raw commands, or token details.
- Throttle updates to avoid noise: update on meaningful changes, roughly every 5-10 seconds at most during active changes; for long waits, every 20-30 seconds is enough.

Suggested prompt snippet:

```text
當使用者交辦任何任務、要求查詢、分析、修改、設定、寫程式、測試、整理、判斷或需要助理採取行動時，助理都必須用繁體中文給使用者可讀的短狀態更新；不再限定長任務。狀態更新採 event-based，不採固定長間隔。每當動作改變、階段切換、發現關鍵線索、工具失敗、改用新方法、卡住、恢復、準備驗證或完成時，都應更新。此外，當任務中的假設、策略、風險判斷、驗證方式、信心程度或下一步計畫發生明顯變更時，也要回報「思路狀態變更與決策依據摘要」。狀態更新只公開目前階段、遇到的狀況、改用方式、思路狀態變更摘要、下一步；不要公開 chain-of-thought、完整推理、敏感路徑、token、raw command 或秘密。
```

## Tested behavior

Validated in Discord thread and global-channel workflows:

- Gateway restart succeeded.
- Plugin loaded without diagnostics.
- `status_update` appeared in the effective agent tools after the core allowlist patch.
- Long-task and short-task tests showed status updates arriving before the final answer.
- Thread-only rollout was tested first, then promoted to global Discord channel policy.
- Reasoning-state-change summaries were tested without exposing hidden chain-of-thought.
