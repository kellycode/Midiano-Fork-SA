import { DomHelper } from "./DomHelper.js";
import { getSettingsDiv } from "../settings/Settings.js";
import { ZoomUI } from "./ZoomUI.js";
import { createTrackDivs } from "./TrackUI.js";
import { getCurrentSong, getPlayer } from "../player/Player.js";
import { SongUI } from "./SongUI.js";
import { getMidiHandler } from "../MidiInputHandler.js";
/**
 * Contains all initiation, appending and manipulation of DOM-elements.
 * Callback-bindings for some events are created in  the constructor
 */
export class UI {
    constructor(render, isMobile) {
        this.isMobile = window.matchMedia("only screen and (max-width: 1600px)").matches;
        this.render = render;
        this.songUI = new SongUI();
        this.loadedSongsShown = false;

        this.navBar = document.getElementById("MainNavBar");

        this.songControlGroup = document.getElementById("songControlGroup");
        this.fileButtonGroup = document.getElementById("fileButtonGroup");
        this.tracksButtonGroup = document.getElementById("tracksButtonGroup");
        this.tracksButton = document.getElementById("tracksButton");
        this.midiSetupButton = document.getElementById("midiSetupButton");

        this.leftTopContainer = document.getElementById("leftTopContainer");
        this.middleTopContainer = document.getElementById("middleTopContainer");
        this.rightTopContainer = document.getElementById("rightTopContainer");

        this.loadedSongsButton = document.getElementById("loadedSongsButton");
        this.hiddenFileInput = document.getElementById("hiddenFileInput");

        this.playButton = document.getElementById("songControlGroupPlay");
        this.pauseButton = document.getElementById("songControlGroupPause");
        this.stopButton = document.getElementById("songControlGroupStop");

        this.volumeGroup = document.getElementById("volumeButtonGroup");
        this.volumeSlider = document.getElementById("volumeSlider");
        this.muteButton = document.getElementById("muteButton");
        this.volumeSliderlabel = document.getElementById("volumeSliderlabel");

        this.speedButtonGroup = document.getElementById("speedButtonGroup");
        this.speedUpButton = document.getElementById("speedUpButton");
        this.speedDisplayInput = document.getElementById("speedDisplayInput");
        this.speedDownButton = document.getElementById("speedDownButton");

        this.settingsButtonGroup = document.getElementById("settingsButtonGroup");
        this.fullscreenButton = document.getElementById("fullscreenButton");
        this.settingsButton = document.getElementById("settingsButton");

        this.defaultPLayerVolume = 75;

        //add callbacks to the player
        getPlayer().newSongCallbacks.push(this.newSongCallback.bind(this));

        document.body.addEventListener("mousemove", this.mouseMoved.bind(this));

        this.createControlMenu();

        this.menuHeight = 200;

        document.querySelectorAll(".innerMenuDiv").forEach((el) => (el.style.height = "calc(100% - " + (this.navBar.clientHeight + 24) + "px)"));
    }

    setExampleSongs(exampleSongsJson) {
        this.songUI.setExampleSongs(exampleSongsJson);
    }

    fireInitialListeners() {
        this.onMenuHeightChange(this.navBar.clientHeight);
        window.setTimeout(() => this.onMenuHeightChange(this.navBar.clientHeight), 500);
    }

    mouseMoved() {
        this.getMinimizeButton().style.opacity = 1;
        if (!this.fadingOutMinimizeButton) {
            this.fadingOutMinimizeButton = true;
            window.setTimeout(() => {
                this.getMinimizeButton().style.opacity = 0;
                this.fadingOutMinimizeButton = false;
            }, 1000);
        }
    }

    createControlMenu() {
        this.startSpeedButtonGroup();

        this.volumeGroup = this.startVolumeButtonGroup();
        this.settingsButtonGroup = this.startSettingsButtonGroup();

        this.startSongControlButtonGroup();
        this.startFileButtonGroup();
        this.startTracksButtonGroup();

        // zoom buttons added to the middleTopContainer
        let zoomGroup = new ZoomUI().getContentDiv(this.render);

        let minimizeButton = this.getMinimizeButton();
        document.body.appendChild(minimizeButton);

        let innerMenuDivsContainer = DomHelper.createElementWithClass("innerMenuDivsContainer");
        DomHelper.appendChildren(innerMenuDivsContainer, [this.getTrackMenuDiv(), this.getLoadedSongsDiv(), this.getSettingsDiv()]);
        document.body.appendChild(innerMenuDivsContainer);

        this.createFileDragArea();
    }

    startSpeedButtonGroup() {
        this.speedUpButton.onclick = function () {
            getPlayer().increaseSpeed(0.05);
            this.updateSpeedDisplayValue();
        }.bind(this);

        this.speedDisplayInput.value = Math.floor(getPlayer().playbackSpeed * 100) + "%";

        this.speedDownButton.onclick = function () {
            getPlayer().increaseSpeed(-0.05);
            this.updateSpeedDisplayValue();
        }.bind(this);

        return speedButtonGroup;
    }

    startFileButtonGroup() {
        this.hiddenFileInput.onchange = this.handleFileSelect.bind(this);
        this.loadedSongsButton.onclick = this.toggleLoadedSongsDiv.bind(this);
    }

    toggleLoadedSongsDiv() {
        if (this.loadedSongsShown) {
            this.hideLoadedSongsDiv();
        } else {
            this.hideAllDialogs();
            this.showLoadedSongsDiv();
        }
    }

    showLoadedSongsDiv() {
        this.hideAllDialogs();
        this.loadedSongsButton.classList.add("selected");
        this.loadedSongsShown = true;
        this.showDiv(this.getLoadedSongsDiv());
    }

    hideLoadedSongsDiv() {
        this.loadedSongsButton.classList.remove("selected");
        this.loadedSongsShown = false;
        this.hideDiv(this.getLoadedSongsDiv());
    }

    handleFileSelect(evt) {
        var files = evt.target.files;
        this.readFile(files[0]);
    }

    readFile(file) {
        let reader = new FileReader();
        let fileName = file.name;
        reader.onload = function (theFile) {
            getPlayer().loadSong(reader.result, fileName);
        }.bind(this);
        reader.readAsDataURL(file);
    }

    startTracksButtonGroup() {
        this.tracksButton.onclick = (ev) => {
            if (this.tracksShown) {
                this.hideTracks();
            } else {
                this.showTracks();
            }
        };

        this.midiSetupButton.onclick = (ev) => {
            if (this.midiSetupDialogShown) {
                this.hideMidiSetupDialog();
            } else {
                this.showMidiSetupDialog();
            }
        };
    }

    hideTracks() {
        //DomHelper.removeClass("selected", this.tracksButton);
        this.tracksButton.classList.remove("selected");
        this.tracksShown = false;
        this.hideDiv(this.getTrackMenuDiv());
    }

    showTracks() {
        this.hideAllDialogs();
        //DomHelper.addClassToElement("selected", this.tracksButton);
        this.tracksButton.classList.add("selected");
        this.tracksShown = true;
        //instrument of a track could theoretically change during the song.
        document.querySelectorAll(".instrumentName").forEach((el) => (el.innerHTML = getPlayer().getCurrentTrackInstrument(el.id.split("instrumentName")[1])));
        this.showDiv(this.getTrackMenuDiv());
    }

    hideMidiSetupDialog() {
        this.midiSetupButton.classList.remove("selected");
        this.midiSetupDialogShown = false;
        this.hideDiv(this.getMidiSetupDialog());
    }

    showMidiSetupDialog() {
        this.hideAllDialogs();
        this.midiSetupButton.classList.add("selected");
        this.midiSetupDialogShown = true;
        this.showDiv(this.getMidiSetupDialog());
    }

    startSongControlButtonGroup() {
        this.playButton.onclick = this.clickPlay.bind(this);
        this.pauseButton.onclick = this.clickPause.bind(this);
        this.stopButton.onclick = this.clickStop.bind(this);
    }

    clickPlay(ev) {
        if (getPlayer().song) {
            this.pauseButton.classList.remove("selected");
            getPlayer().startPlay();
            this.playButton.classList.add("selected");
        }
    }

    clickPause(ev) {
        getPlayer().pause();
        this.playButton.classList.remove("selected");
        this.pauseButton.classList.add("selected");
    }

    clickStop(ev) {
        getPlayer().stop();
        this.playButton.classList.remove("selected");
        this.pauseButton.classList.remove("selected");
    }

    updateVolumeSlider = () => {
        this.volumeSliderlabel.innerHTML = "Master Volume" + "<span style='float: right'>" + this.volumeSlider.value + "%</span>";
    };

    startVolumeButtonGroup() {
        // set the default volume
        this.volumeSlider.value = this.defaultPLayerVolume;
        getPlayer().volume = this.defaultPLayerVolume;
        this.updateVolumeSlider();

        this.toggleMuteClass = (oldIcon, newIcon) => {
            this.muteButton.classList.remove(oldIcon);
            this.muteButton.classList.add(newIcon);
        };

        this.volumeSlider.oninput = () => {
            this.updateVolumeSlider();
        };

        this.volumeSlider.onchange = (ev) => {
            this.updateVolumeSlider();
            if (getPlayer().volume == 0 && parseInt(ev.target.value) != 0) {
                console.log(ev.target.value);
                this.toggleMuteClass("glyphicon-volume-off", "glyphicon-volume-up");
            }
            getPlayer().volume = parseInt(ev.target.value);
            if (getPlayer().volume <= 0) {
                this.toggleMuteClass("glyphicon-volume-up", "glyphicon-volume-off");
            } else if (this.getMuteButton().innerHTML == "Unmute") {
                this.toggleMuteClass("glyphicon-volume-off", "glyphicon-volume-up");
            }
        };

        this.muteButton.onclick = (ev) => {
            if (getPlayer().muted) {
                getPlayer().muted = false;
                if (!isNaN(getPlayer().mutedAtVolume)) {
                    if (getPlayer().mutedAtVolume == 0) {
                        getPlayer().mutedAtVolume = 100;
                    }
                    this.volumeSlider.value = getPlayer().mutedAtVolume;
                    getPlayer().volume = getPlayer().mutedAtVolume;
                }
                this.toggleMuteClass("glyphicon-volume-off", "glyphicon-volume-up");
            } else {
                getPlayer().mutedAtVolume = getPlayer().volume;
                getPlayer().muted = true;
                getPlayer().volume = 0;
                this.volumeSlider.value = 0;
                this.toggleMuteClass("glyphicon-volume-up", "glyphicon-volume-off");
            }
            this.updateVolumeSlider();
        };

        return this.volumeGroup;
    }

    getMuteButton() {
        if (!this.muteButton) {
            console.log("No Mute Button");
        }
        return this.muteButton;
    }

    startSettingsButtonGroup() {
        this.startFullscreenButton();
        this.startSettingsButton();
    }

    getSettingsButton() {
        return this.settingsButton;
    }

    startFullscreenButton() {
        this.fullscreen = false;
        this.fullscreenButton.onclick = () => {
            if (!this.fullscreen) {
                document.body.requestFullscreen();
            } else {
                document.exitFullscreen();
            }
        };
        let fullscreenSwitch = () => (this.fullscreen = !this.fullscreen);
        document.body.onfullscreenchange = fullscreenSwitch.bind(this);
    }

    startSettingsButton() {
        this.settingsButton.onclick = () => {
            if (this.settingsShown) {
                this.hideSettings();
            } else {
                this.showSettings();
            }
        };
    }

    hideSettings() {
        DomHelper.removeClass("selected", this.getSettingsButton());
        this.settingsShown = false;
        this.hideDiv(this.getSettingsDiv());
    }

    showSettings() {
        this.hideAllDialogs();
        DomHelper.addClassToElement("selected", this.getSettingsButton());
        this.settingsShown = true;
        this.showDiv(this.getSettingsDiv());
    }

    getSettingsDiv() {
        if (!this.settingsDiv) {
            this.settingsDiv = DomHelper.createDivWithIdAndClass("settingsDiv", "innerMenuDiv");
            this.hideDiv(this.settingsDiv);
            this.settingsDiv.appendChild(this.getSettingsContent());
        }
        return this.settingsDiv;
    }

    getSettingsContent() {
        return getSettingsDiv();
    }

    setOnMenuHeightChange(func) {
        this.onMenuHeightChange = func;
    }

    updateSpeedDisplayValue() {
        let speed = getPlayer().playbackSpeed;
        this.speedDisplayInput.value = Math.floor(speed * 100) + "%";
    }

    hideDiv(div) {
        div.classList.add("hidden");
        div.classList.remove("unhidden");
    }

    showDiv(div) {
        div.classList.remove("hidden");
        div.classList.add("unhidden");
    }

    getLoadedSongsDiv() {
        if (!this.loadedSongsDiv) {
            this.loadedSongsDiv = DomHelper.createDivWithClass("innerMenuDiv");
            this.loadedSongsDiv.appendChild(this.songUI.getDivContent());
            this.hideDiv(this.loadedSongsDiv);
        }
        return this.loadedSongsDiv;
    }

    createFileDragArea() {
        let dragArea = DomHelper.createElement(
            "div",
            {
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                zIndex: 10000,
                visibility: "hidden",
                opacity: "0",
                backgroundColor: "rgba(0,0,0,0.2)",
                transition: "all 0.2s ease-out",
            },
            {
                id: "fileDragArea",
                draggable: "true",
            }
        );

        let dragAreaText = DomHelper.createDivWithClass(
            "centeredBigText",
            {
                marginTop: "25%",
                fontSize: "35px",
                color: "rgba(225,225,225,0.8)",
            },
            { innerHTML: "Drop Midi File anywhere!" }
        );
        dragArea.appendChild(dragAreaText);

        dragArea.ondrop = (ev) => {
            dragArea.style.backgroundColor = "rgba(0,0,0,0)";
            this.handleDragDropFileSelect(ev);
        };
        let lastTarget;
        window.ondragenter = (ev) => {
            ev.preventDefault();
            lastTarget = ev.target;
            dragArea.style.visibility = "";
            dragArea.style.opacity = "1";
        };
        window.ondragleave = (ev) => {
            if (ev.target === lastTarget || ev.target === document) {
                dragArea.style.visibility = "hidden";
                dragArea.style.opacity = "0";
            }
        };
        window.ondragover = (ev) => ev.preventDefault();
        window.ondrop = (ev) => {
            ev.preventDefault();
            dragArea.style.visibility = "hidden";
            dragArea.style.opacity = "0";
            this.handleDragDropFileSelect(ev);
        };
        document.body.appendChild(dragArea);
    }

    handleDragOverFile(ev) {
        this.createFileDragArea().style;
    }

    handleDragDropFileSelect(ev) {
        if (ev.dataTransfer.items) {
            // Use DataTransferItemList interface to access the file(s)
            if (ev.dataTransfer.items.length > 0) {
                if (ev.dataTransfer.items[0].kind === "file") {
                    var file = ev.dataTransfer.items[0].getAsFile();
                    this.readFile(file);
                }
            }
        } else {
            // Use DataTransfer interface to access the file(s)
            if (ev.dataTransfer.files.length > 0) {
                var file = ev.dataTransfer.files[0];
                this.readFile(file);
            }
        }
    }

    getChannelsButton() {
        if (!this.channelsButton) {
            let channelMenuDiv = this.getChannelMenuDiv();
            this.channelsButton = DomHelper.createGlyphiconTextButton("channels", "align-justify", "Channels", (ev) => {
                if (this.channelsShown) {
                    this.hideChannels(channelMenuDiv);
                } else {
                    this.showChannels(channelMenuDiv);
                }
            });
            DomHelper.addClassToElement("floatSpanLeft", this.channelsButton);

            //Todo. decide what channel info to show...
            this.channelsButton.style.opacity = 0;
        }
        return this.channelsButton;
    }

    getChannelMenuDiv() {
        if (!this.channelMenuDiv) {
            this.channelMenuDiv = DomHelper.createDivWithId("trackContainerDiv");
            this.channelMenuDiv.style.display = "none";
            this.channelMenuDiv.style.top = this.navBar.style.height;
            document.body.appendChild(this.channelMenuDiv);
        }
        return this.channelMenuDiv;
    }

    showChannels(channelMenuDiv) {
        if (this.tracksShown) {
            this.hideTracks();
        }
        DomHelper.addClassToElement("selected", this.tracksButton);
        this.channelsShown = true;
        channelMenuDiv.style.display = "block";
    }

    hideChannels(channelMenuDiv) {
        DomHelper.removeClass("selected", this.tracksButton);
        this.channelsShown = false;
        channelMenuDiv.style.display = "none";
    }

    hideAllDialogs() {
        this.hideMidiSetupDialog();
        this.hideSettings();
        this.hideLoadedSongsDiv();
        this.hideTracks();
    }

    resetTrackMenuDiv() {
        let menuDiv = this.getTrackMenuDiv();
        menuDiv.innerHTML = "";
        DomHelper.appendChildren(menuDiv, createTrackDivs());
    }

    newSongCallback() {
        this.resetTrackMenuDiv();
        this.clickStop();
        this.songUI.newSongCallback(getCurrentSong());
    }

    getMidiSetupDialog() {
        if (!this.midiSetupDialog) {
            this.midiSetupDialog = DomHelper.createDivWithIdAndClass("midiSetupDialog", "centeredMenuDiv");
            this.hideDiv(this.midiSetupDialog);
            document.body.appendChild(this.midiSetupDialog);

            let text = DomHelper.createDivWithClass("centeredBigText", { marginTop: "25px" }, { innerHTML: "Choose Midi device:" });
            this.midiSetupDialog.appendChild(text);

            this.inputDevicesDiv = DomHelper.createDivWithClass("halfContainer");
            this.outputDevicesDiv = DomHelper.createDivWithClass("halfContainer");
            this.midiSetupDialog.appendChild(this.inputDevicesDiv);
            this.midiSetupDialog.appendChild(this.outputDevicesDiv);
        }
        let inputDevices = getMidiHandler().getAvailableInputDevices();
        if (inputDevices.length == 0) {
            this.inputDevicesDiv.innerHTML = "No MIDI input-devices found.";
        } else {
            this.inputDevicesDiv.innerHTML = "";
            let inputTitle = DomHelper.createElementWithClass("row", "span");
            inputTitle.innerHTML = "Input: ";
            this.inputDevicesDiv.appendChild(inputTitle);
            inputDevices.forEach((device) => {
                this.inputDevicesDiv.appendChild(this.createDeviceDiv(device));
            });
        }

        let outputDevices = getMidiHandler().getAvailableOutputDevices();
        if (outputDevices.length == 0) {
            this.outputDevicesDiv.innerHTML = "No MIDI output-devices found.";
        } else {
            this.outputDevicesDiv.innerHTML = "";
            let outputTitle = DomHelper.createDivWithClass("row");
            outputTitle.innerHTML = "Output: ";
            this.outputDevicesDiv.appendChild(outputTitle);
            outputDevices.forEach((device) => {
                this.outputDevicesDiv.appendChild(this.createOutputDeviceDiv(device));
            });
        }
        this.midiSetupDialog.style.marginTop = this.navBar.clientHeight + 25 + "px";
        return this.midiSetupDialog;
    }

    createDeviceDiv(device) {
        let deviceDiv = DomHelper.createTextButton("midiInDeviceDiv" + device.id, device.name, () => {
            if (deviceDiv.classList.contains("selected")) {
                DomHelper.removeClass("selected", deviceDiv);
                getMidiHandler().clearInput(device);
            } else {
                DomHelper.addClassToElement("selected", deviceDiv);
                getMidiHandler().addInput(device);
            }
        });
        if (getMidiHandler().isDeviceActive(device)) {
            DomHelper.addClassToElement("selected", deviceDiv);
        }

        return deviceDiv;
    }

    createOutputDeviceDiv(device) {
        let deviceDiv = DomHelper.createTextButton("midiOutDeviceDiv" + device.id, device.name, () => {
            if (deviceDiv.classList.contains("selected")) {
                DomHelper.removeClass("selected", deviceDiv);
                getMidiHandler().clearOutput(device);
            } else {
                DomHelper.addClassToElement("selected", deviceDiv);
                getMidiHandler().addOutput(device);
            }
        });
        if (getMidiHandler().isOutputDeviceActive(device)) {
            document.querySelectorAll(".midiOutDeviceDiv").forEach((el) => (el.classList.contains("selected") ? el.classList.remove("selected") : null));
            DomHelper.addClassToElement("selected", deviceDiv);
        }
        deviceDiv.classList.add("midiOutDeviceDiv");

        return deviceDiv;
    }

    getTrackMenuDiv() {
        if (!this.trackMenuDiv) {
            this.trackMenuDiv = DomHelper.createDivWithIdAndClass("trackContainerDiv", "innerMenuDiv");
            this.hideDiv(this.trackMenuDiv);
        }
        return this.trackMenuDiv;
    }

    getMinimizeButton() {
        if (!this.minimizeButton) {
            this.minimizeButton = DomHelper.createGlyphiconButton("minimizeMenu", "chevron-up", () => {
                if (!this.navMinimized) {
                    this.navBar.style.marginTop = "-" + this.navBar.clientHeight + "px";
                    this.navMinimized = true;
                    this.minimizeButton.querySelector("span").classList.remove("glyphicon-chevron-up");
                    this.minimizeButton.querySelector("span").classList.add("glyphicon-chevron-down");
                    this.onMenuHeightChange(0);
                } else {
                    this.navBar.style.marginTop = "0px";
                    this.navMinimized = false;

                    this.minimizeButton.querySelector("span").classList.add("glyphicon-chevron-up");
                    this.minimizeButton.querySelector("span").classList.remove("glyphicon-chevron-down");
                    this.onMenuHeightChange(this.navBar.clientHeight);
                }
            });
            this.minimizeButton.style.padding = "0px";
            this.minimizeButton.style.fontSize = "0.5em";
        }
        let navbarHeight = this.navMinimized ? 0 : this.navBar.clientHeight;
        this.minimizeButton.style.top = navbarHeight + 23 + "px";
        return this.minimizeButton;
    }
}
