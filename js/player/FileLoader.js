import { getLoader } from "../ui/Loader.js";

export class FileLoader {
    constructor() {
        this.parsedJson;
    }


    static async loadSongFromURL(url, callback) {

        function setCookie(url, parsedJson) {
            // Set a cookie that expires in 365 days and is available across the entire website
            const name = "last_midi_loaded";
            //console.log(parsedJson)
            const lastMidiNameLoaded = parsedJson.find(object => object.url === url);
            console.log(lastMidiNameLoaded)
            const value = lastMidiNameLoaded.name;
            const days = 365;

            const date = new Date();
            date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000)); // Calculate expiration time in milliseconds
            const expires = "; expires=" + date.toUTCString(); // Format date to UTC string

            document.cookie = name + "=" + value + expires + "; path=/";
        }

        console.log("LOADING");
        getLoader().setLoadMessage(`Loading Song from ${url} `);

        setCookie(url, this.parsedJson);

        const response = fetch(url, {
            method: "GET",
        }).then((response) => {
            const filename = url;
            response.blob().then((blob) => {
                const reader = new FileReader();
                reader.onload = function (theFile) {
                    callback(reader.result, filename, () => { });
                };
                reader.readAsDataURL(blob);
            });
        });
    }
}
