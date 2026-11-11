import { action, SingletonAction } from "@elgato/streamdeck";

import { appear, disappear, press } from "../client";

@action({ UUID: "com.mkasjanowicz.ytm-rs.previous" })
export class Previous extends SingletonAction {
	override onWillAppear(ev: Parameters<typeof appear>[0]): void {
		appear(ev);
	}
	override onWillDisappear(ev: Parameters<typeof disappear>[0]): void {
		disappear(ev);
	}
	override onKeyDown(ev: Parameters<typeof press>[0]): Promise<void> {
		return press(ev, { cmd: "prev" });
	}
}
