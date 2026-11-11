import streamDeck from "@elgato/streamdeck";

import { Like } from "./actions/like";
import { Next } from "./actions/next";
import { NowPlaying } from "./actions/now-playing";
import { PlayPause } from "./actions/play-pause";
import { Previous } from "./actions/previous";
import { Repeat } from "./actions/repeat";
import { Shuffle } from "./actions/shuffle";
import { VolumeDown } from "./actions/volume-down";
import { VolumeUp } from "./actions/volume-up";

streamDeck.actions.registerAction(new PlayPause());
streamDeck.actions.registerAction(new Next());
streamDeck.actions.registerAction(new Previous());
streamDeck.actions.registerAction(new VolumeUp());
streamDeck.actions.registerAction(new VolumeDown());
streamDeck.actions.registerAction(new Like());
streamDeck.actions.registerAction(new Shuffle());
streamDeck.actions.registerAction(new Repeat());
streamDeck.actions.registerAction(new NowPlaying());

streamDeck.connect();
