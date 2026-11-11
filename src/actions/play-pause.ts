import { action, SingletonAction } from "@elgato/streamdeck";

import { appear, disappear, press } from "../client";

@action({ UUID: "com.mkasjanowicz.ytm-rs.play-pause" })
export class PlayPause extends SingletonAction {
	override onWillAppear(ev: Parameters<typeof appear>[0]): void {
		appear(ev, (state, key) => key.setState(state.playing ? 1 : 0));
	}
	override onWillDisappear(ev: Parameters<typeof disappear>[0]): void {
		disappear(ev);
	}
	override onKeyDown(ev: Parameters<typeof press>[0]): Promise<void> {
		return press(ev, { cmd: "toggle" });
	}
}
