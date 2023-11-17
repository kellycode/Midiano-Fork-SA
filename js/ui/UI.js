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

        //add callbacks to the player
        getPlayer().newSongCallbacks.push(this.newSongCallback.bind(this));

        document.body.addEventListener("mousemove", this.mouseMoved.bind(this));

        this.createControlMenu();

        this.menuHeight = 200;

        document.querySelectorAll(".innerMenuDiv").forEach((el) => (el.style.height = "calc(100% - " + (this.getNavBar().clientHeight + 24) + "px)"));

        document.body.appendChild(new ZoomUI().getContentDiv(render));
    }

    setExampleSongs(exampleSongsJson) {
        this.songUI.setExampleSongs(exampleSongsJson);
    }

    fireInitialListeners() {
        this.onMenuHeightChange(this.getNavBar().clientHeight);
        window.setTimeout(() => this.onMenuHeightChange(this.getNavBar().clientHeight), 500);
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
        //let topGroupsContainer = DomHelper.createDivWithClass("container");
        let topGroupsContainer = document.getElementById("MainNavBar").getElementsByClassName("container")[0];

        let settingsGrpRight = this.getSettingsButtonGroup();

        let leftTop = document.getElementById("leftTopContainer");
        let middleTop = document.getElementById("middleTopContainer");
        let rightTop = document.getElementById("rightTopContainer");

        let songSpeedGrp = this.getSpeedButtonGroup();

        let songControlGroup = this.getSongControlButtonGroup();

        let volumeGrp = this.getVolumneButtonGroup();

        let fileGrp = this.getFileButtonGroup();
        let trackGrp = this.getTracksButtonGroup();

        DomHelper.addClassToElements("align-middle", [songSpeedGrp, volumeGrp]);

        // zoom buttons added to the middleTopContainer
        let zoomGroup = new ZoomUI().getContentDiv(this.render);
        DomHelper.appendChildren(middleTop, [zoomGroup]);
        DomHelper.addClassToElement("zoomAdded", middleTop);

        DomHelper.appendChildren(rightTop, [songSpeedGrp, volumeGrp, settingsGrpRight]);

        DomHelper.appendChildren(topGroupsContainer, [leftTop, middleTop, rightTop]);
        this.getNavBar().appendChild(topGroupsContainer);

        let minimizeButton = this.getMinimizeButton();
        document.body.appendChild(minimizeButton);

        document.body.appendChild(this.getNavBar());

        let innerMenuDivsContainer = DomHelper.createElementWithClass("innerMenuDivsContainer");
        DomHelper.appendChildren(innerMenuDivsContainer, [this.getTrackMenuDiv(), this.getLoadedSongsDiv(), this.getSettingsDiv()]);
        document.body.appendChild(innerMenuDivsContainer);

        this.createFileDragArea();
    }

    getFileButtonGroup() {
        let fileGroup = document.getElementById("fileButtonGroup");

        let hiddenInput = document.getElementById("hiddenFileInput");
        hiddenInput.onchange = this.handleFileSelect.bind(this);

        this.loadedSongsButton = document.getElementById("loadedSongsButton");
        this.loadedSongsButton.onclick = this.toggleLoadedSongsDiv.bind(this);

        return fileGroup;
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

    getTracksButtonGroup() {
        let trackGrp = document.getElementById("tracksButtonGroup");

        this.tracksButton = document.getElementById("tracksButton");
        this.tracksButton.onclick = (ev) => {
            if (this.tracksShown) {
                this.hideTracks();
            } else {
                this.showTracks();
            }
        };

        this.midiSetupButton = document.getElementById("midiSetupButton");
        this.midiSetupButton.onclick = (ev) => {
            if (this.midiSetupDialogShown) {
                this.hideMidiSetupDialog();
            } else {
                this.showMidiSetupDialog();
            }
        };

        return trackGrp;
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
        //DomHelper.removeClass("selected", this.midiSetupButton);
        this.midiSetupButton.classList.remove("selected");
        this.midiSetupDialogShown = false;
        this.hideDiv(this.getMidiSetupDialog());
    }

    showMidiSetupDialog() {
        this.hideAllDialogs();
        this.midiSetupButton.classList.add("selected");
        //DomHelper.addClassToElement("selected", this.midiSetupButton);
        this.midiSetupDialogShown = true;
        this.showDiv(this.getMidiSetupDialog());
    }

    getSongControlButtonGroup() {
        let songControlGroup = document.getElementById("songControlGroup");

        this.playButton = document.getElementById("songControlGroupPlay");
        this.playButton.onclick = this.clickPlay.bind(this);

        this.pauseButton = document.getElementById("songControlGroupPause");
        this.pauseButton.onclick = this.clickPause.bind(this);

        this.stopButton = document.getElementById("songControlGroupStop");
        this.stopButton.onclick = this.clickStop.bind(this);

        return songControlGroup;
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

    getMinimizeButton() {
        if (!this.minimizeButton) {
            this.minimizeButton = DomHelper.createGlyphiconButton("minimizeMenu", "chevron-up", () => {
                if (!this.navMinimized) {
                    this.getNavBar().style.marginTop = "-" + this.getNavBar().clientHeight + "px";
                    this.navMinimized = true;
                    this.minimizeButton.querySelector("span").classList.remove("glyphicon-chevron-up");
                    this.minimizeButton.querySelector("span").classList.add("glyphicon-chevron-down");
                    this.onMenuHeightChange(0);
                } else {
                    this.getNavBar().style.marginTop = "0px";
                    this.navMinimized = false;

                    this.minimizeButton.querySelector("span").classList.add("glyphicon-chevron-up");
                    this.minimizeButton.querySelector("span").classList.remove("glyphicon-chevron-down");
                    this.onMenuHeightChange(this.getNavBar().clientHeight);
                }
            });
            this.minimizeButton.style.padding = "0px";
            this.minimizeButton.style.fontSize = "0.5em";
        }
        let navbarHeight = this.navMinimized ? 0 : this.getNavBar().clientHeight;
        this.minimizeButton.style.top = navbarHeight + 23 + "px";
        return this.minimizeButton;
    }

    getSettingsButtonGroup() {
        let settingsGrpRight = DomHelper.createButtonGroup(true);
        DomHelper.appendChildren(settingsGrpRight, [this.getFullscreenButton(), this.getSettingsButton()]);
        return settingsGrpRight;
    }

    setOnMenuHeightChange(func) {
        this.onMenuHeightChange = func;
    }

    getVolumneButtonGroup() {
        let volumeGrp = DomHelper.createButtonGroup(true);
        DomHelper.appendChildren(volumeGrp, [this.getMainVolumeSlider().container, this.getMuteButton()]);
        return volumeGrp;
    }

    getSpeedButtonGroup() {
        let songSpeedGrp = DomHelper.createButtonGroup(true);
        DomHelper.appendChildren(songSpeedGrp, [this.getSpeedDiv()]);
        return songSpeedGrp;
    }

    getNavBar() {
        return document.getElementById("MainNavBar");
    }

    getSettingsButton() {
        if (!this.settingsButton) {
            this.settingsButton = DomHelper.createGlyphiconButton("settingsButton", "cog", () => {
                if (this.settingsShown) {
                    this.hideSettings();
                } else {
                    this.showSettings();
                }
            });
        }
        return this.settingsButton;
    }

    hideDiv(div) {
        div.classList.add("hidden");
        div.classList.remove("unhidden");
    }

    showDiv(div) {
        div.classList.remove("hidden");
        div.classList.add("unhidden");
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

    getFullscreenButton() {
        if (!this.fullscreenButton) {
            this.fullscreen = false;
            let clickFullscreen = () => {
                if (!this.fullscreen) {
                    document.body.requestFullscreen();
                } else {
                    document.exitFullscreen();
                }
            };
            this.fullscreenButton = DomHelper.createGlyphiconButton("fullscreenButton", "fullscreen", clickFullscreen.bind(this));
            let fullscreenSwitch = () => (this.fullscreen = !this.fullscreen);
            document.body.onfullscreenchange = fullscreenSwitch.bind(this);
        }
        return this.fullscreenButton;
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

    getSpeedDiv() {
        if (!this.speedDiv) {
            this.speedDiv = DomHelper.createDivWithClass("btn-group btn-group-vertical");
            this.speedDiv.appendChild(this.getSpeedUpButton());
            this.speedDiv.appendChild(this.getSpeedDisplayField());
            this.speedDiv.appendChild(this.getSpeedDownButton());
        }
        return this.speedDiv;
    }

    getSpeedUpButton() {
        if (!this.speedUpButton) {
            this.speedUpButton = DomHelper.createGlyphiconButton("speedUp", "triangle-top", (ev) => {
                getPlayer().increaseSpeed(0.05);
                this.updateSpeed();
            });
            this.speedUpButton.className += " btn-xs forcedThinButton";
            this.speedUpButton.title = "Stack Overflow";
        }
        return this.speedUpButton;
    }

    updateSpeed() {
        this.getSpeedDisplayField().value = Math.round(getPlayer().playbackSpeed * 100) + "%";
    }

    getSpeedDisplayField() {
        if (!this.speedDisplay) {
            this.speedDisplay = DomHelper.createTextInput(
                (ev) => {
                    let newVal = Math.max(1, Math.min(1000, parseInt(ev.target.value)));
                    if (!isNaN(newVal)) {
                        ev.target.value = newVal + "%";
                        getPlayer().playbackSpeed = newVal / 100;
                    }
                },
                {
                    float: "none",
                    textAlign: "center",
                },
                {
                    value: Math.floor(getPlayer().playbackSpeed * 100) + "%",
                    className: "forcedThinButton",
                    type: "text",
                }
            );
        }
        return this.speedDisplay;
    }

    getSpeedDownButton() {
        if (!this.speedDownButton) {
            this.speedDownButton = DomHelper.createGlyphiconButton("speedUp", "triangle-bottom", (ev) => {
                getPlayer().increaseSpeed(-0.05);
                this.updateSpeed();
            });
            this.speedDownButton.className += " btn-xs forcedThinButton";
        }
        return this.speedDownButton;
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
            this.channelMenuDiv.style.top = this.getNavBar().style.height;
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

    getMainVolumeSlider() {
        if (!this.mainVolumeSlider) {
            this.mainVolumeSlider = DomHelper.createSliderWithLabel("volumeMain", "Master Volume", getPlayer().volume, 0, 100, 1, (ev) => {
                if (getPlayer().volume == 0 && parseInt(ev.target.value) != 0) {
                    DomHelper.replaceGlyph(this.getMuteButton(), "volume-off", "volume-up");
                    //this.getMuteButton().firstChild.className = this.muteButton.firstChild.className.replace('volume-off', 'volume-up')
                }
                getPlayer().volume = parseInt(ev.target.value);
                if (getPlayer().volume <= 0) {
                    DomHelper.replaceGlyph(this.getMuteButton(), "volume-up", "volume-off");
                } else if (this.getMuteButton().innerHTML == "Unmute") {
                    DomHelper.replaceGlyph(this.getMuteButton(), "volume-off", "volume-up");
                }
            });
        }
        return this.mainVolumeSlider;
    }
    getMuteButton() {
        if (!this.muteButton) {
            this.muteButton = DomHelper.createGlyphiconButton("mute", "volume-up", (ev) => {
                if (getPlayer().muted) {
                    getPlayer().muted = false;
                    if (!isNaN(getPlayer().mutedAtVolume)) {
                        if (getPlayer().mutedAtVolume == 0) {
                            getPlayer().mutedAtVolume = 100;
                        }
                        this.getMainVolumeSlider().slider.value = getPlayer().mutedAtVolume;
                        getPlayer().volume = getPlayer().mutedAtVolume;
                    }
                    DomHelper.replaceGlyph(this.muteButton, "volume-off", "volume-up");
                } else {
                    getPlayer().mutedAtVolume = getPlayer().volume;
                    getPlayer().muted = true;
                    getPlayer().volume = 0;
                    this.getMainVolumeSlider().slider.value = 0;
                    DomHelper.replaceGlyph(this.muteButton, "volume-up", "volume-off");
                }
            });
        }
        return this.muteButton;
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
        this.midiSetupDialog.style.marginTop = this.getNavBar().clientHeight + 25 + "px";
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
}
