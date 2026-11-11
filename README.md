# ytm-rs Controller

Control [ytm-rs](https://github.com/grapedjuice/ytm-rs) from an Elgato Stream Deck, on macOS and Windows.

ytm-rs already talks to the operating system's media keys, but those keys only do play, pause, skip, seek and volume. Liking a song, shuffle, repeat, and showing the cover on a key are inside the app, with no way in from outside. This plugin speaks a small WebSocket that a patched ytm-rs opens on `127.0.0.1`. The patch lives in [`ytm-rs-patch/`](ytm-rs-patch/) until it is merged upstream.

Not affiliated with YouTube, Google, or Elgato.

## What the keys do

| Key | What it does |
| --- | --- |
| Play / Pause | Plays or pauses. The icon follows the player. |
| Next | Next song. |
| Previous | Previous song. |
| Volume up / down | Same steps as the in-app shortcuts, 5% each press. |
| Like | Likes or unlikes the song that is playing. A filled heart means it is liked. |
| Shuffle | Shuffles the songs coming up. In ytm-rs this is one action, not a mode that stays on. |
| Repeat | Cycles off, then all, then one. The icon follows. |
| Now playing | Cover and title. Pressing it plays or pauses. |

If ytm-rs isn't running, or the remote control setting is off, a press shows the Stream Deck alert icon.

## Requirements

- [Stream Deck](https://www.elgato.com/stream-deck) app 7.1 or newer (macOS 12+ or Windows 10+). The app runs the plugin on the Node.js 20 it already includes. You don't install Node.js yourself.
- ytm-rs with the remote-control patch (below), and the **Stream Deck** switch turned on in Settings, Connections.

## Install

1. Download `com.mkasjanowicz.ytm-rs.streamDeckPlugin` from [GitHub Releases](https://github.com/mkasjanowicz/ytm-rs-streamdeck/releases).
2. Double-click it. Stream Deck installs the plugin.
3. In ytm-rs, open Settings, Connections, and turn on **Stream Deck**.
4. Drag the actions from the **ytm-rs Controller** group onto your deck.

There is no account and no store listing. Updates are new releases; install the new file the same way.

## The ytm-rs patch

Upstream ytm-rs does not open a control socket yet. The change is in [`ytm-rs-patch/0001-remote-control.patch`](ytm-rs-patch/0001-remote-control.patch), written against commit `2f2b418`. Applying it:

```sh
git clone https://github.com/grapedjuice/ytm-rs
cd ytm-rs
git checkout -b feat/remote-control
git am /path/to/ytm-rs-streamdeck/ytm-rs-patch/0001-remote-control.patch
cargo build --release
```

The socket stays off until you enable it. It listens on `127.0.0.1:26540` only, and it refuses connections that send an `Origin` header, so a web page cannot drive the player. Any other program on the same computer can. There is no password. The wire format is [`docs/protocol.md`](docs/protocol.md).

When the patch lands in ytm-rs, this section goes away and a normal ytm-rs install is enough.

### Without the patch

Play, pause, next, previous and volume still work, with Stream Deck's built-in **Hotkey** action and ytm-rs's own shortcuts. The defaults are Shift+Alt with:

| | macOS | Windows |
| --- | --- | --- |
| Play / pause | Option Shift P | Alt Shift P |
| Next | Option Shift N | Alt Shift N |
| Previous | Option Shift B | Alt Shift B |
| Volume up | Option Shift = | Alt Shift = |
| Volume down | Option Shift - | Alt Shift - |

Those shortcuts can be changed in ytm-rs, Settings, Keyboard shortcuts. Like, shuffle, repeat and the cover need the patch. The keys don't show whether a song is playing.

## Develop

Node.js 20 or newer.

```sh
npm install
npm run build
npx streamdeck link com.mkasjanowicz.ytm-rs.sdPlugin
```

`npm run watch` rebuilds and restarts the plugin. Icons come from `node scripts/icons.mjs`.

## License

GPL-3.0-only, same as ytm-rs. The patch is part of ytm-rs and is GPL-3.0-only as well.
