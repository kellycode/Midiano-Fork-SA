import { getPlayer } from "../player/Player.js";
import { DomHelper } from "./DomHelper.js";

export class ZoomUI {
    constructor() {}

    getContentDiv(render) {
        let cont = document.getElementById("zoomButtonGroup");

        let zoomInButton = document.getElementById("zoomInButton");
        zoomInButton.onclick = () => render.renderDimensions.zoomIn();

        let zoomOutButton = document.getElementById("zoomOutButton");
        zoomOutButton.onclick = () => render.renderDimensions.zoomOut();

        let moveViewLeftButton = document.getElementById("moveViewLeftButton");
        moveViewLeftButton.onclick = () => render.renderDimensions.moveViewLeft();

        let moveViewRightButton = document.getElementById("moveViewRightButton");
        moveViewRightButton.onclick = () => render.renderDimensions.moveViewRight();

        let fitSongButton = document.getElementById("fitSongButton");
        fitSongButton.onclick = () => render.renderDimensions.fitSong(getPlayer().song.getNoteRange());

        let showAllButton = document.getElementById("showAllButton");
        showAllButton.onclick = () => render.renderDimensions.showAll();

        return cont;
    }
}
