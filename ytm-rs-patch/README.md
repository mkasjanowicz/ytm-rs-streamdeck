# Remote control for ytm-rs

Patch against [ytm-rs](https://github.com/grapedjuice/ytm-rs) `2f2b418` (`main` as of 2026-11-10). It adds an opt-in WebSocket so a Stream Deck plugin can drive the player. The wire format is [docs/protocol.md](../docs/protocol.md).

```sh
git clone https://github.com/grapedjuice/ytm-rs
cd ytm-rs
git checkout -b feat/remote-control 2f2b418
git am /path/to/0001-remote-control.patch
cargo test --bin ytm-rs remote::
```

If `main` has moved and `git am` stops, the conflicts are the usual ones: `Cargo.toml` feature lists, `src/main.rs` module list, `App::new`, `App::save`, and Settings, Connections.

## Pull request

**Remote control: localhost WebSocket for external controllers**

ytm-rs already handles play, pause, skip and volume from the operating system. Like, shuffle, repeat and "what's playing" stay inside the UI, so a Stream Deck (or anything else on the machine) can't use them.

This adds `src/remote.rs`, off by default. Settings, Connections, Stream Deck opens `ws://127.0.0.1:26540`. Clients get a JSON snapshot when playback changes and send JSON commands back. Commands go through the same functions as the on-screen buttons (`toggle`, `next`, `prev`, `nudge_volume`, `LikeHeard`, `shuffle_upcoming`, the repeat cycle).

The listener is loopback only. A handshake that carries an `Origin` header is answered with 403, so a page open in a browser cannot connect. There is no authentication beyond that: other programs on the computer can.

`cargo test --bin ytm-rs remote::` covers command parsing, the origin check, and a real socket.
