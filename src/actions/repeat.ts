import { action, SingletonAction } from "@elgato/streamdeck";

import { appear, disappear, press, type RepeatMode } from "../client";

const STATE: Record<RepeatMode, number> = { off: 0, all: 1, one: 2 };

@action({ UUID: "com.mkasjanowicz.ytm-rs.repeat" })
export class Repeat extends SingletonAction {
	override onWillAppear(ev: Parameters<typeof appear>[0]): void {
		appear(ev, (state, key) => key.setState(STATE[state.repeat] ?? 0));
	}
	override onWillDisappear(ev: Parameters<typeof disappear>[0]): void {
		disappear(ev);
	}
	override onKeyDown(ev: Parameters<typeof press>[0]): Promise<void> {
		return press(ev, { cmd: "repeat" });
	}
}
