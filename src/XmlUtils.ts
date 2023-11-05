import type { Stream, Writer } from "@ajuvercr/js-runner";
import { readFile, writeFile } from "fs/promises";
import { exec } from "child_process";
import { getEngine, randomUUID } from "./Util";

const SAXON_HE_RELEASE = "https://github.com/Saxonica/Saxon-HE/releases/download/SaxonHE12-3/SaxonHE12-3J.zip";

export type XQuery = {
    name: string,
    query: string
};

export type XQueryOutput = {
    name: string,
    stream: Writer<string>
};

export async function doXQuery(
    source: Stream<string>,
    queries: XQuery[],
    outputs: XQueryOutput[],
    saxonLocation?: string
) {
    const saxonEngine = await getEngine(saxonLocation, false, SAXON_HE_RELEASE);
    const uid = randomUUID();

    // Write queries to disk
    const queryLocations: { name: string, path: string }[] = [];
    for (const q of queries) {
        const queryPath = `/tmp/xml-xquery-${uid}-${q.name}.xq`;
        await writeFile(queryPath, q.query, "utf8");
        queryLocations.push({ name: q.name, path: queryPath });
    }

    // Register input stream listener
    source.data(async data => {
        console.log("[doXQuery processor]", "Got XML input!");
        // Write XML input to temporary folder on disk
        const inputPath = `/tmp/xml-input-${uid}.xml`;
        await writeFile(inputPath, data, "utf8");

        // Execute all defined XQueries
        for (const ql of queryLocations) {
            console.log("[doXQuery processor]", "Running XQuery", ql.name);
            const outputPath = `/tmp/xml-output-${uid}-${ql.name}.xml`;
            const command = `java -cp ${saxonEngine} net.sf.saxon.Query -t -s:${inputPath} -q:${ql.path} -o:${outputPath}`;
            
            const t0 = new Date();
            const proc = exec(command);
            proc.stdout!.on("data", function (data) {
                console.log("[doXQuery processor]", "saxon engine std: ", data.toString());
            });
            proc.stderr!.on("data", function (data) {
                console.error("[doXQuery processor]", "saxon engine err:", data.toString());
            });
            await new Promise((res) => proc.on("exit", res));
            console.log(`Completed XQuery execution for ${ql.name} in ${new Date().getTime() - t0.getTime()}`);

            const outStream = outputs.find(o => o.name === ql.name);
            if(outStream) {
                // Push result data downstream
                await outStream.stream.push(await readFile(outputPath, "utf8"));
            } else {
                throw new Error(`No corresponding output stream found for XQuery ${ql.name}`);
            }
        }
    });

}