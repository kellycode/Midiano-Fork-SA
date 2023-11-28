import { Render } from "./Rendering/Render.js";
import { UI } from "./ui/UI.js";
import { InputListeners } from "./InputListeners.js";
import { getPlayer, getPlayerState } from "./player/Player.js";
import { loadJson } from "./Util.js";
import { FileLoader } from "./player/FileLoader.js";

let ui;
let loading;
let listeners;

window.onload = async function () {
    await init();
    loading = true;
};

async function init() {
    render = new Render();
    ui = new UI(render);
    listeners = new InputListeners(ui, render);
    renderLoop();

    loadStartingSong();

    loadJson("./js/data/exampleSongs.json", (json) => ui.setExampleSongs(JSON.parse(json)));
}

let render;
function renderLoop() {
    /*KK TODO Handle this.playing to stop rendering when not playing*/
    render.render(getPlayerState());
    window.requestAnimationFrame(renderLoop);
}
async function loadStartingSong() {
    const domain = window.location.href;
    let url = "./midi/Christmas Time Is Here.mid?raw=true";
    FileLoader.loadSongFromURL(url, (response, fileName) => getPlayer().loadSong(response, fileName, "Christmas Time Is here")); // Local: "../mz_331_3.mid")
}
