/**
 * TimerManager — one-shot non-blocking timer state management.
 *
 * Timers are in-memory for the current extension/session runtime. When a timer
 * fires, it sends a custom message with triggerTurn so Pi can wake the agent.
 */

import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";

export class TimerManager {
	private timers = new Map<string, NodeJS.Timeout>();
	private timerCounter = 0;

	constructor(private pi: ExtensionAPI) {}

	setTimer(seconds: number, message: string, id?: string): string {
		const timerId = id ?? `timer-${++this.timerCounter}`;

		// Reusing an ID makes timer calls idempotent: the newest timer wins.
		this.cancelTimer(timerId);

		const timeout = setTimeout(() => {
			this.timers.delete(timerId);

			this.pi.sendMessage(
				{
					customType: "timer-fired",
					content: `⏰ Timer [${timerId}] fired (after ${seconds}s): ${message}`,
					display: true,
					details: {
						type: "timer",
						timerId,
						seconds,
						message,
						firedAt: new Date().toISOString(),
					},
				},
				{ triggerTurn: true },
			);
		}, seconds * 1000);

		this.timers.set(timerId, timeout);
		return timerId;
	}

	clearAll(): void {
		for (const [, timeout] of this.timers) {
			clearTimeout(timeout);
		}
		this.timers.clear();
	}

	private cancelTimer(id: string): boolean {
		const timeout = this.timers.get(id);
		if (timeout) {
			clearTimeout(timeout);
			this.timers.delete(id);
			return true;
		}
		return false;
	}
}
