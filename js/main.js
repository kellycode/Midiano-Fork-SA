import { Render } from "./Rendering/Render.js";
import { UI } from "./ui/UI.js";
import { InputListeners } from "./InputListeners.js";
import { getPlayer, getPlayerState } from "./player/Player.js";
import { loadJson } from "./Util.js";
import { FileLoader } from "./player/FileLoader.js";

let ui;
let loading;
let listeners;
let examplesJson;

window.onload = async function () {
    await init();
    loading = true;
};

async function init() {
    render = new Render();
    ui = new UI(render);
    listeners = new InputListeners(ui, render);

    renderLoop();

    loadJson("./js/data/exampleSongs.json", (json) => {
        let parsedJson = JSON.parse(json);
        ui.setExampleSongs(parsedJson)
        loadStartingSong(parsedJson);
    });

    
}

let render;
function renderLoop() {
    /*KK TODO Handle this.playing to stop rendering when not playing*/
    render.render(getPlayerState());
    window.requestAnimationFrame(renderLoop);
}
async function loadStartingSong(parsedJson) {
    const domain = window.location.href;
    // always start with the first song listed in exampleSongs.json
    let url = parsedJson[0].url;
    FileLoader.loadSongFromURL(url, (response, fileName) => getPlayer().loadSong(response, fileName, parsedJson[0].name));
}
