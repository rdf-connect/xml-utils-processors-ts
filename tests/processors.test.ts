import { describe, expect, test } from "@jest/globals";
import { extractProcessors, extractSteps, Source } from "@ajuvercr/js-runner";
import { resolve } from "path";

describe("Tests for XML-related processors", async () => {
    const pipeline = `
        @prefix js: <https://w3id.org/conn/js#>.
        @prefix ws: <https://w3id.org/conn/ws#>.
        @prefix : <https://w3id.org/conn#>.
        @prefix owl: <http://www.w3.org/2002/07/owl#>.
        @prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#>.
        @prefix xsd: <http://www.w3.org/2001/XMLSchema#>.
        @prefix sh: <http://www.w3.org/ns/shacl#>.

        <> owl:imports <./node_modules/@ajuvercr/js-runner/ontology.ttl>, <./processors.ttl>.

        [ ] a :Channel;
            :reader <jr>;
            :writer <jw>.
        <jr> a js:JsReaderChannel.
        <jw> a js:JsWriterChannel.
    `;

    const baseIRI = process.cwd() + "/config.ttl";

    test("js:XQueryProcessor is properly defined", async () => {
        const proc = `
            [ ] a js:XQueryProcessor; 
                js:xmlInput <jr>;
                js:xquery [
                    js:name "Q1";
                    js:query "<Some XQuery>";
                    js:outputStream <jw>
                ];
                js:saxonLocation <./SaxonHE12-3J.zip>.
        `;

        const source: Source = {
            value: pipeline + proc,
            baseIRI,
            type: "memory",
        };

        const { processors, quads, shapes: config } = await extractProcessors(source);

        const env = processors.find((x) => x.ty.value === "https://w3id.org/conn/js#XQueryProcessor")!;
        expect(env).toBeDefined();

        const argss = extractSteps(env, quads, config);
        expect(argss.length).toBe(1);
        expect(argss[0].length).toBe(3);

        const [[xmlInput, xqueries, saxon]] = argss;
        
        testReader(xmlInput);
        expect(xqueries[0].name).toBe("Q1");
        expect(xqueries[0].query).toBe("<Some XQuery>");
        testWriter(xqueries[0].result);
        
        expect(saxon).toBe(resolve("./SaxonHE12-3J.zip"));

        await checkProc(env.file, env.func);
    });
});

function testReader(arg: any) {
    expect(arg).toBeInstanceOf(Object);
    expect(arg.channel).toBeDefined();
    expect(arg.channel.id).toBeDefined();
    expect(arg.ty).toBeDefined();
}

function testWriter(arg: any) {
    expect(arg).toBeInstanceOf(Object);
    expect(arg.channel).toBeDefined();
    expect(arg.channel.id).toBeDefined();
    expect(arg.ty).toBeDefined();
}

async function checkProc(location: string, func: string) {
    const mod = await import("file://" + location);
    expect(mod[func]).toBeDefined();
}