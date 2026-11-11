# Remote control protocol

ytm-rs listens on `ws://127.0.0.1:26540` while Settings, Connections, Stream Deck is on. One JSON object per WebSocket text frame, both ways. Messages over 4096 bytes are rejected.

Bind `127.0.0.1`, not `localhost`. On some systems `localhost` is IPv6, and nothing is listening there.

A request that includes an `Origin` header (browsers always send one) is refused with HTTP 403 during the handshake. Anything else on the machine may connect. There is no token.

## State

The server sends this on connect, and again whenever it changes. Fields are always present; `album` and `cover_url` are `null` when there is nothing to show.

```json
{
  "title": "Song",
  "artist": "Artist",
  "album": "Album",
  "cover_url": "https://lh3.googleusercontent.com/...",
  "playing": true,
  "liked": false,
  "repeat": "off",
  "volume": 0.8,
  "position": 12,
  "duration": 180
}
```

| Field | Meaning |
| --- | --- |
| `title`, `artist` | Empty strings when nothing is loaded. |
| `album` | Album name, or `null`. |
| `cover_url` | An `https` image URL the app already uses, or `null`. The plugin fetches it. |
| `playing` | The audio engine is playing. |
| `liked` | The current song (or its video) is liked. |
| `repeat` | `off`, `all`, or `one`. |
| `volume` | `0.0`–`1.0`, two decimal places. |
| `position`, `duration` | Whole seconds. Position is not updated more often than that. |

## Commands

Unknown objects are ignored. The socket stays open.

| `cmd` | `value` | Effect |
| --- | --- | --- |
| `toggle` | | Play or pause. |
| `next` | | Next song. |
| `prev` | | Previous song. |
| `volume_up` | | Volume +0.05. |
| `volume_down` | | Volume −0.05. |
| `set_volume` | number `0`–`1` | Set the volume. Outside that range is clamped. |
| `like` | omitted | Toggle the heart of the song that is playing. |
| `like` | `true` or `false` | Like or unlike it. |
| `shuffle` | | Shuffle the songs coming up. One shot, not a toggle. |
| `repeat` | omitted | Cycle `off` → `all` → `one` → `off`. |
| `repeat` | `off`, `all`, or `one` | Set it. |

```json
{"cmd":"toggle"}
```

```json
{"cmd":"like","value":true}
```

```json
{"cmd":"set_volume","value":0.4}
```
