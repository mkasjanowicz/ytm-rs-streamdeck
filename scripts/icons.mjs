import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "com.mkasjanowicz.ytm-rs.sdPlugin");
const S = `fill="none" stroke="#fff" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"`;

const play = `<polygon points="26,16 58,36 26,56" fill="#fff"/>`;
const pause = `<rect x="22" y="16" width="9" height="40" rx="2" fill="#fff"/><rect x="41" y="16" width="9" height="40" rx="2" fill="#fff"/>`;
const next = `<polygon points="16,18 42,36 16,54" fill="#fff"/><rect x="48" y="18" width="7" height="36" rx="1.5" fill="#fff"/>`;
const previous = `<rect x="17" y="18" width="7" height="36" rx="1.5" fill="#fff"/><polygon points="56,18 30,36 56,54" fill="#fff"/>`;
const speaker = `<path d="M14 30h8l14-12v36L22 42H14z" fill="#fff"/>`;
const volumeUp = `${speaker}<path ${S} d="M46 28a10 10 0 0 1 0 16M54 22a18 18 0 0 1 0 28"/>`;
const volumeDown = `${speaker}<path ${S} d="M46 28a10 10 0 0 1 0 16"/>`;
const heart = `<path d="M36 58S16 44 12 32c-3-8 2-16 11-16 7 0 10 5 13 9 3-4 6-9 13-9 9 0 14 8 11 16-4 12-24 26-24 26z"/>`;
const heartOff = `<path ${S} ${heart.slice(5)}`;
const heartOn = `<path fill="#fff" ${heart.slice(5)}`;
const shuffle = `<path ${S} d="M16 26h18l20-12"/><path ${S} d="M46 10l8 4-8 6"/><path ${S} d="M16 46h18l20 12"/><path ${S} d="M46 52l8 6-8 4"/>`;
const repeat = `<path ${S} d="M28 22h16a14 14 0 0 1 14 14v2"/><path ${S} d="M50 34l8 6 6-8"/><path ${S} d="M44 50H28a14 14 0 0 1-14-14v-2"/><path ${S} d="M22 38l-8-6-6 8"/>`;
const repeatOff = repeat.replaceAll('stroke="#fff"', 'stroke="#fff" opacity="0.4"');
const repeatOne = `${repeat}<text x="36" y="42" text-anchor="middle" font-family="sans-serif" font-size="16" font-weight="700" fill="#fff">1</text>`;
const note = `<ellipse cx="26" cy="50" rx="12" ry="9" fill="#fff" transform="rotate(-25 26 50)"/><rect x="36" y="16" width="5" height="34" rx="1" fill="#fff"/><path ${S} d="M41 18c12 1 18 8 18 8"/>`;

/** dir -> { list icon body, key image name -> body }. List icon uses the first key when omitted. */
const actions = {
	"play-pause": { icon: play, play, pause },
	next: { icon: next, key: next },
	previous: { icon: previous, key: previous },
	"volume-up": { icon: volumeUp, key: volumeUp },
	"volume-down": { icon: volumeDown, key: volumeDown },
	like: { icon: heartOff, off: heartOff, on: heartOn },
	shuffle: { icon: shuffle, key: shuffle },
	repeat: { icon: repeat, off: repeatOff, all: repeat, one: repeatOne },
	"now-playing": { icon: note, key: note },
};

function svg(size, body) {
	return `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 72 72">${body}</svg>\n`;
}

function write(path, text) {
	mkdirSync(dirname(path), { recursive: true });
	writeFileSync(path, text);
}

for (const [dir, images] of Object.entries(actions)) {
	for (const [name, body] of Object.entries(images)) {
		const base = join(root, "imgs", "actions", dir, name);
		const list = name === "icon";
		write(`${base}.svg`, svg(list ? 20 : 72, body));
		write(`${base}@2x.svg`, svg(list ? 40 : 144, body));
	}
}

write(join(root, "imgs/plugin/category-icon.svg"), svg(28, note));
write(join(root, "imgs/plugin/category-icon@2x.svg"), svg(56, note));

function crc(buf) {
	let c = ~0;
	for (const b of buf) {
		c ^= b;
		for (let i = 0; i < 8; i++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
	}
	return ~c >>> 0;
}

function chunk(type, data) {
	const len = Buffer.alloc(4);
	len.writeUInt32BE(data.length);
	const body = Buffer.concat([Buffer.from(type), data]);
	const sum = Buffer.alloc(4);
	sum.writeUInt32BE(crc(body));
	return Buffer.concat([len, body, sum]);
}

function png(size) {
	const stride = size * 4 + 1;
	const raw = Buffer.alloc(stride * size);
	const put = (x, y, r, g, b, a) => {
		if (x < 0 || y < 0 || x >= size || y >= size || a <= 0) return;
		const i = y * stride + 1 + x * 4;
		const sa = a / 255;
		const da = raw[i + 3] / 255;
		const out = sa + da * (1 - sa);
		raw[i] = (r * sa + raw[i] * da * (1 - sa)) / out;
		raw[i + 1] = (g * sa + raw[i + 1] * da * (1 - sa)) / out;
		raw[i + 2] = (b * sa + raw[i + 2] * da * (1 - sa)) / out;
		raw[i + 3] = out * 255;
	};
	const radius = size * 0.22;
	for (let y = 0; y < size; y++) {
		for (let x = 0; x < size; x++) {
			const cx = Math.min(Math.max(x, radius), size - 1 - radius);
			const cy = Math.min(Math.max(y, radius), size - 1 - radius);
			if (Math.hypot(x - cx, y - cy) <= radius) put(x, y, 22, 22, 22, 255);
		}
	}
	const headCx = size * 0.38;
	const headCy = size * 0.66;
	const rx = size * 0.13;
	const ry = size * 0.09;
	const stemX = headCx + rx * 0.75;
	const stemTop = size * 0.26;
	for (let y = 0; y < size; y++) {
		for (let x = 0; x < size; x++) {
			const nx = (x - headCx) / rx;
			const ny = (y - headCy) / ry;
			const rotX = nx * Math.cos(0.4) - ny * Math.sin(0.4);
			const rotY = nx * Math.sin(0.4) + ny * Math.cos(0.4);
			if (rotX * rotX + rotY * rotY <= 1) put(x, y, 255, 255, 255, 255);
			if (Math.abs(x - stemX) <= size * 0.018 && y >= stemTop && y <= headCy) put(x, y, 255, 255, 255, 255);
		}
	}
	const flag = (t) => [stemX + Math.sin(t) * size * 0.16, stemTop + t * t * size * 0.22];
	for (let t = 0; t <= 1; t += 0.5 / size) {
		const [x, y] = flag(t);
		for (let k = -size * 0.02; k <= size * 0.02; k++) put(Math.round(x), Math.round(y + k), 255, 255, 255, 255);
	}
	const ihdr = Buffer.alloc(13);
	ihdr.writeUInt32BE(size, 0);
	ihdr.writeUInt32BE(size, 4);
	ihdr[8] = 8;
	ihdr[9] = 6;
	return Buffer.concat([
		Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
		chunk("IHDR", ihdr),
		chunk("IDAT", deflateSync(raw)),
		chunk("IEND", Buffer.alloc(0)),
	]);
}

writeFileSync(join(root, "imgs/plugin/marketplace.png"), png(256));
writeFileSync(join(root, "imgs/plugin/marketplace@2x.png"), png(512));
