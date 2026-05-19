import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { Type } from "typebox";

const DEFAULT_PREFIX = "狀態更新：";
const DEFAULT_MAX_LENGTH = 240;

function normalizeText(value) {
  return String(value ?? "")
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function clampLength(text, maxLength) {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, Math.max(1, maxLength - 1)).trimEnd()}…`;
}

function resolveRoute(ctx) {
  const dc = ctx?.deliveryContext ?? {};
  const channel = typeof dc.channel === "string" && dc.channel.trim()
    ? dc.channel.trim()
    : typeof ctx?.messageChannel === "string" && ctx.messageChannel.trim()
      ? ctx.messageChannel.trim()
      : undefined;
  const to = typeof dc.to === "string" && dc.to.trim() ? dc.to.trim() : undefined;
  if (!channel || !to) return null;
  return {
    channel,
    to,
    accountId: typeof dc.accountId === "string" && dc.accountId.trim() ? dc.accountId.trim() : null,
    threadId: dc.threadId ?? null,
  };
}

export default definePluginEntry({
  id: "status-update",
  name: "Status Update",
  description: "Provides a status_update tool for concise in-channel progress updates.",
  register(api) {
    api.registerTool((ctx) => ({
      name: "status_update",
      description:
        "Send a concise Traditional Chinese progress update to the current conversation. Use for multi-step or long-running work when the user asked for live status. Do not include chain-of-thought, raw commands, secrets, or sensitive local paths.",
      parameters: Type.Object({
        message: Type.String({
          description:
            "Short Traditional Chinese status summary. Mention current phase, key blocker/change, and next step when useful. Do not include raw commands, secrets, or chain-of-thought.",
          minLength: 1,
        }),
      }),
      async execute(_toolCallId, params) {
        const rawMessage = params?.message;
        const pluginConfig = api.pluginConfig ?? {};
        const prefix = normalizeText(pluginConfig.prefix || DEFAULT_PREFIX) || DEFAULT_PREFIX;
        const maxLength = Number.isFinite(pluginConfig.maxLength)
          ? Math.max(40, Math.min(1000, Number(pluginConfig.maxLength)))
          : DEFAULT_MAX_LENGTH;
        const silent = typeof pluginConfig.silent === "boolean" ? pluginConfig.silent : true;

        const body = clampLength(normalizeText(rawMessage), maxLength);
        if (!body) {
          return {
            content: [{ type: "text", text: "status_update failed: message is empty." }],
            isError: true,
          };
        }

        const route = resolveRoute(ctx);
        if (!route) {
          return {
            content: [
              {
                type: "text",
                text: "status_update failed: no current delivery route is available for this tool call.",
              },
            ],
            isError: true,
          };
        }

        const adapter = await api.runtime.channel.outbound.loadAdapter(route.channel);
        if (!adapter?.sendText) {
          return {
            content: [
              {
                type: "text",
                text: `status_update failed: channel '${route.channel}' does not expose sendText.`,
              },
            ],
            isError: true,
          };
        }

        const cfg = ctx?.getRuntimeConfig?.() ?? ctx?.runtimeConfig ?? ctx?.config ?? api.config;
        const text = body.startsWith(prefix) ? body : `${prefix}${body}`;

        const result = await adapter.sendText({
          cfg,
          to: route.to,
          text,
          accountId: route.accountId,
          threadId: route.threadId,
          silent,
        });

        const messageId = result?.messageId ?? result?.id;
        return {
          content: [
            {
              type: "text",
              text: messageId
                ? `status_update sent (${route.channel}, message ${messageId}).`
                : `status_update sent (${route.channel}).`,
            },
          ],
        };
      },
    }), { name: "status_update" });
  },
});
