/**
 * Timer tool — one-shot non-blocking "wake me up in N seconds".
 */

import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { Type } from "@sinclair/typebox";
import type { TimerManager } from "../timer-manager.js";

export function registerTimerTool(pi: ExtensionAPI, manager: TimerManager): void {
	pi.registerTool({
		name: "timer",
		label: "Timer",
		description:
			"Set a one-shot, non-blocking wake-up timer. The tool returns immediately so the current turn can finish and the user can keep chatting. " +
			"When the timer expires, Pi sends the agent a visible custom message and requests a new turn with the supplied message as context. " +
			"Use this when waiting for builds, tests, deployments, rate limits, external systems, user-requested reminders, or any delayed follow-up that should not block the session. " +
			"Do not use shell sleep for passive waiting; set a timer, include exactly what to check next in the message, then finish the response. " +
			"Multiple timers may run at once. Reusing the same id replaces the previous active timer with that id.",
		parameters: Type.Object({
			seconds: Type.Number({
				description: "Delay in seconds before waking up. Use the shortest reasonable delay for the follow-up, not a polling loop inside the same turn.",
				minimum: 1,
				maximum: 3600,
			}),
			message: Type.String({
				description:
					"Context delivered when the timer fires. Include what was being waited on, what to check, and any command/URL/ID needed next; e.g. 'Check if GitHub Actions run 123 finished — run `gh run view 123` and report the result.'",
			}),
			id: Type.Optional(
				Type.String({
					description:
						"Optional stable timer ID for idempotency. If another active timer uses the same ID, it is replaced by the new timer. Auto-generated if omitted.",
				}),
			),
		}),

		async execute(_toolCallId, params) {
			const timerId = manager.setTimer(params.seconds, params.message, params.id);

			return {
				content: [
					{
						type: "text" as const,
						text:
							`Timer [${timerId}] set for ${params.seconds}s. ` +
							`You will be woken up with: "${params.message}". ` +
							`Finish your response — the user can chat freely while waiting.`,
					},
				],
				details: { timerId, seconds: params.seconds },
			};
		},
	});
}
