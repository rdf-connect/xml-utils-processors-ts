import { existsSync, mkdirSync } from "fs";
import { normalize } from "path"; 
import AdmZip from "adm-zip";
import { exec } from "child_process";


const defaultLocation = "/tmp/SaxonHE12-3J.zip";
const unzippedFolder = "/tmp/saxon";
let saxonPromise: undefined | Promise<string> = undefined;

export async function getEngine(mLocation: string | undefined, offline: boolean, url: string): Promise<string> {
    const location = mLocation ? normalize(mLocation) : normalize(defaultLocation);

    if (existsSync(location)) {
        if (!existsSync(normalize(unzippedFolder))) {
            mkdirSync(unzippedFolder);
            await unzip(location, unzippedFolder);   
        }
        return normalize(unzippedFolder + `/saxon-he-${getJarVersion(location)}.jar`);
    }

    // Did not find the file :/
    if (offline) {
        throw "Did not find jar file, and the runner is started in offline mode. Cannot continue.";
    }

    if (!saxonPromise) {
        saxonPromise = (async function () {
            const cmd = `wget ${url} -O ${location}`;
            console.log("[doXQuery processor]", "Executing $", cmd)
            const proc = exec(cmd);
            await new Promise(res => proc.once("exit", res));
            mkdirSync(unzippedFolder);
            await unzip(location, unzippedFolder);
            return normalize(unzippedFolder + `/saxon-he-${getJarVersion(location)}.jar`);
        })();
    }

    return saxonPromise;
}

export function randomUUID(length = 8) {
    // declare all characters
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }

    return result;
}

function getJarVersion(str: string) {
    const matches = str.match(/\d+(\-\d+)?/g);
    if (matches && matches.length > 0) {
        return matches[0].replace("-", ".");
    } else {
        throw new Error("Error while extracting Saxon library version number");
    }
}

function unzip(zipped: string, path: string) {
    const adm = new AdmZip(zipped);
    adm.extractAllTo(path);
}
