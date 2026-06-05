/**
 * pi-heartbeat — non-blocking timer tool for pi agents.
 *
 * Extension entry point. Registers only the timer tool and session cleanup.
 * It intentionally does not inject system prompts, register skills, intercept tools,
 * expose heartbeat behavior, or add slash commands.
 */

import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { TimerManager } from "./timer-manager.js";
import { registerTimerTool } from "./tools/timer.js";

export default function activate(pi: ExtensionAPI): void {
	const manager = new TimerManager(pi);

	registerTimerTool(pi, manager);

	pi.on("session_shutdown", async () => {
		manager.clearAll();
	});
}
