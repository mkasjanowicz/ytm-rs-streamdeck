import type { KeyDownEvent, WillAppearEvent, WillDisappearEvent } from "@elgato/streamdeck";
import WebSocket from "ws";

/** `ws://127.0.0.1`, not `localhost` — localhost may be IPv6, and ytm-rs binds v4 only. */
const URL = "ws://127.0.0.1:26540";

export type RepeatMode = "off" | "all" | "one";

/** What ytm-rs sends. See docs/protocol.md. */
export interface State {
	title: string;
	artist: string;
	album: string | null;
	cover_url: string | null;
	playing: boolean;
	liked: boolean;
	repeat: RepeatMode;
	volume: number;
	position: number;
	duration: number;
}

export type Command =
	| { cmd: "toggle" }
	| { cmd: "next" }
	| { cmd: "prev" }
	| { cmd: "volume_up" }
	| { cmd: "volume_down" }
	| { cmd: "set_volume"; value: number }
	| { cmd: "like"; value?: boolean }
	| { cmd: "shuffle" }
	| { cmd: "repeat"; value?: RepeatMode };

export type DeckKey = {
	id: string;
	setState(state: number): Promise<void>;
	setTitle(title?: string): Promise<void>;
	setImage(image?: string): Promise<void>;
	showAlert(): Promise<void>;
};

type Listener = {
	state?: (state: State) => void;
	lost?: () => void;
};

/**
 * One socket for every key. Reconnects while at least one key is on screen.
 * A dropped connection alerts each key once, not on every retry.
 */
class Player {
	private ws?: WebSocket;
	private listeners = new Map<string, Listener>();
	private state?: State;
	private alerted = false;
	private retryMs = 500;
	private timer?: ReturnType<typeof setTimeout>;

	watch(id: string, listener: Listener): () => void {
		this.listeners.set(id, listener);
		if (this.state && this.ws?.readyState === WebSocket.OPEN) listener.state?.(this.state);
		else if (this.alerted) listener.lost?.();
		this.ensure();
		return () => {
			this.listeners.delete(id);
			if (this.listeners.size === 0) this.close();
		};
	}

	/** False when ytm-rs isn't there. The key should show an alert. */
	send(cmd: Command): boolean {
		if (this.ws?.readyState !== WebSocket.OPEN) return false;
		this.ws.send(JSON.stringify(cmd));
		return true;
	}

	private ensure(): void {
		const ready = this.ws?.readyState;
		if (ready === WebSocket.OPEN || ready === WebSocket.CONNECTING) return;
		this.connect();
	}

	private connect(): void {
		const ws = new WebSocket(URL);
		this.ws = ws;
		ws.on("open", () => {
			this.alerted = false;
			this.retryMs = 500;
		});
		ws.on("message", (data) => {
			const text = typeof data === "string" ? data : data.toString();
			let state: State;
			try {
				state = JSON.parse(text) as State;
			} catch {
				return;
			}
			this.state = state;
			for (const listener of this.listeners.values()) listener.state?.(state);
		});
		ws.on("close", () => {
			if (this.ws !== ws) return;
			this.ws = undefined;
			if (!this.alerted) {
				this.alerted = true;
				for (const listener of this.listeners.values()) listener.lost?.();
			}
			if (this.listeners.size > 0) this.schedule();
		});
		ws.on("error", () => ws.close());
	}

	private schedule(): void {
		clearTimeout(this.timer);
		const wait = this.retryMs;
		this.retryMs = Math.min(this.retryMs * 2, 5000);
		this.timer = setTimeout(() => {
			if (this.listeners.size > 0) this.connect();
		}, wait);
	}

	private close(): void {
		clearTimeout(this.timer);
		this.timer = undefined;
		this.retryMs = 500;
		this.ws?.close();
		this.ws = undefined;
	}
}

export const player = new Player();

const shown = new Map<string, () => void>();

/** Subscribe a key for as long as it is on screen. */
export function appear(ev: WillAppearEvent, paint?: (state: State, key: DeckKey) => void | Promise<void>): void {
	if (!ev.action.isKey()) return;
	const key = ev.action;
	shown.set(
		key.id,
		player.watch(key.id, {
			state: paint ? (state) => void paint(state, key) : undefined,
			lost: () => void key.showAlert(),
		}),
	);
}

export function disappear(ev: WillDisappearEvent): void {
	shown.get(ev.action.id)?.();
	shown.delete(ev.action.id);
}

export async function press(ev: KeyDownEvent, cmd: Command): Promise<void> {
	if (player.send(cmd)) return;
	if (ev.action.isKey()) await ev.action.showAlert();
}
