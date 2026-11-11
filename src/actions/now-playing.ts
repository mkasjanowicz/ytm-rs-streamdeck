import { action, SingletonAction } from "@elgato/streamdeck";

import { appear, disappear, press, type DeckKey, type State } from "../client";

const covers = new Map<string, string>();

async function coverUri(url: string): Promise<string | undefined> {
	const hit = covers.get(url);
	if (hit) return hit;
	const res = await fetch(url);
	if (!res.ok) return;
	const type = res.headers.get("content-type")?.split(";")[0]?.trim() || "image/jpeg";
	if (!type.startsWith("image/")) return;
	const uri = `data:${type};base64,${Buffer.from(await res.arrayBuffer()).toString("base64")}`;
	covers.set(url, uri);
	if (covers.size > 8) covers.delete(covers.keys().next().value!);
	return uri;
}

/** Per key, so a late cover fetch doesn't paint the previous song. */
const shown = new Map<string, string | undefined>();

async function paint(state: State, key: DeckKey): Promise<void> {
	await key.setTitle(state.title ? `${state.title}\n${state.artist}` : "");
	const url = state.cover_url ?? undefined;
	if (shown.get(key.id) === url) return;
	shown.set(key.id, url);
	if (!url) {
		await key.setImage();
		return;
	}
	try {
		const uri = await coverUri(url);
		if (shown.get(key.id) !== url || !uri) return;
		await key.setImage(uri);
	} catch {
		// Keep the note from the manifest.
	}
}

@action({ UUID: "com.mkasjanowicz.ytm-rs.now-playing" })
export class NowPlaying extends SingletonAction {
	override onWillAppear(ev: Parameters<typeof appear>[0]): void {
		appear(ev, paint);
	}
	override onWillDisappear(ev: Parameters<typeof disappear>[0]): void {
		shown.delete(ev.action.id);
		disappear(ev);
	}
	override onKeyDown(ev: Parameters<typeof press>[0]): Promise<void> {
		return press(ev, { cmd: "toggle" });
	}
}
