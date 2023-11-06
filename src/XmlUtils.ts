import type { Stream, Writer } from "@ajuvercr/js-runner";
import { readFile, writeFile } from "fs/promises";
import { exec } from "child_process";
import { getEngine, randomUUID } from "./Util";

const SAXON_HE_RELEASE = "https://github.com/Saxonica/Saxon-HE/releases/download/SaxonHE12-3/SaxonHE12-3J.zip";

export type XQuery = {
    name: string,
    query: string,
    path: string,
    result: Writer<string>
};

export async function doXQuery(
    source: Stream<string>,
    queries: XQuery[],
    saxonLocation?: string
) {
    const saxonEngine = await getEngine(saxonLocation, false, SAXON_HE_RELEASE);
    const uid = randomUUID();

    // Write queries to disk
    for (const q of queries) {
        const queryPath = `/tmp/xml-xquery-${uid}-${q.name}.xq`;
        q.path = queryPath;
        await writeFile(queryPath, q.query, "utf8");
    }

    // Register input stream listener
    source.data(async data => {
        console.log("[doXQuery processor]", "Got XML input!");
        // Write XML input to temporary folder on disk
        const inputPath = `/tmp/xml-input-${uid}.xml`;
        await writeFile(inputPath, data, "utf8");

        // Execute all defined XQueries
        for (const q of queries) {
            console.log("[doXQuery processor]", "Running XQuery", q.name);
            const outputPath = `/tmp/xml-output-${uid}-${q.name}.xml`;
            const command = `java -cp ${saxonEngine} net.sf.saxon.Query -t -s:${inputPath} -q:${q.path} -o:${outputPath}`;
            
            const t0 = new Date();
            const proc = exec(command);
            proc.stdout!.on("data", function (data) {
                console.log("[doXQuery processor]", "saxon engine std: ", data.toString());
            });
            proc.stderr!.on("data", function (data) {
                console.error("[doXQuery processor]", "saxon engine err:", data.toString());
            });
            await new Promise((res) => proc.on("exit", res));
            console.log(`Completed XQuery execution for ${q.name} in ${new Date().getTime() - t0.getTime()} ms`);
            
            // Push result data downstream
            q.result.push(await readFile(outputPath, "utf8"));
        }
    });

}