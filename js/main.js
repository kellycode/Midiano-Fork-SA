import { Render } from "./Rendering/Render.js";
import { UI } from "./ui/UI.js";
import { InputListeners } from "./InputListeners.js";
import { getPlayer, getPlayerState } from "./player/Player.js";
import { loadJson } from "./Util.js";
import { FileLoader } from "./player/FileLoader.js";
import globalContext from "./globalContext.js";

let ui;
let loading;
let listeners;
let examplesJson;
let parsedJson;

window.onload = async function () {
    await init();
    loading = true;
};

async function init() {
    render = new Render();
    ui = new UI(render);
    globalContext.ui = ui;
    listeners = new InputListeners(ui, render);

    renderLoop();

    loadJson("./js/data/exampleSongs.json", (json) => {
        parsedJson = JSON.parse(json);

        FileLoader.parsedJson = parsedJson;
        
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

    let loadNumber = 0;

    function getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
        return null;
    }

    const result = getCookie('last_midi_loaded');

    if (result) {
        let midiData = parsedJson.find(object => object.name === result);
        loadNumber = midiData.item;
        console.log(loadNumber);
    } else {
        console.log("No midi cookie found, loading default");
    }



    const domain = window.location.href;
    // always start with the the last midi loaded or the first item in the list if no cookie found
    let url = parsedJson[loadNumber].url;
    FileLoader.loadSongFromURL(url, (response, fileName) => getPlayer().loadSong(response, fileName, parsedJson[loadNumber].name));
}
