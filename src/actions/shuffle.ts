import { action, SingletonAction } from "@elgato/streamdeck";

import { appear, disappear, press } from "../client";

/** One shot, same as ytm-rs "Shuffle up next". It is not a mode that stays on. */
@action({ UUID: "com.mkasjanowicz.ytm-rs.shuffle" })
export class Shuffle extends SingletonAction {
	override onWillAppear(ev: Parameters<typeof appear>[0]): void {
		appear(ev);
	}
	override onWillDisappear(ev: Parameters<typeof disappear>[0]): void {
		disappear(ev);
	}
	override onKeyDown(ev: Parameters<typeof press>[0]): Promise<void> {
		return press(ev, { cmd: "shuffle" });
	}
}
