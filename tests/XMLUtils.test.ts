import { describe, test, expect, afterAll } from "@jest/globals";
import { SimpleStream } from "@ajuvercr/js-runner";
import { XQuery, XQueryOutput, doXQuery } from "../src/XmlUtils";
import { deleteAsync } from "del";

describe("Functional tests for the doXQuery Connector Architecture function", () => {

    const XML_INPUT = `
        <RINFData>
            <MemberStateCode Code="NL" Version="1.0"/>
            <OperationalPoint ValidityDateStart="2020-02-10" ValidityDateEnd="2020-12-31">
                <OPName Value="Nieuweschans Grens"/>
                <UniqueOPID Value="EU00001"/>
                <OPTafTapCode IsApplicable="Y" Value="NL00458"/>
                <OPType Value="90" OptionalValue="border point"/>
            </OperationalPoint>
        </RINFData>
    `;

    const XQUERY_1 = `
        <NewData>{
            for $op in //OperationalPoint
            return(
                <NewOP id="{$op/UniqueOPID/@Value}">
                    <name>{$op/OPName/@Value}</name>
                </NewOP>
            )
        }</NewData>
    `;

    const XQUERY_2 = `
        <NewData>{
            for $op in //OperationalPoint
            return(
                <NewOP2 id="{$op/UniqueOPID/@Value}">
                    <name>{$op/OPName/@Value}</name>
                </NewOP2>
            )
        }</NewData>
    `;

    test("Single XQuery execution over XML data", async () => {
        const source = new SimpleStream<string>();
        const output1 = new SimpleStream<string>();
        const queries: XQuery[] = [
            {
                name: "query1",
                query: XQUERY_1
            }
        ];
        const outputs: XQueryOutput[] = [
            {
                name: "query1",
                stream: output1
            }
        ];

        output1.data(data => {
            expect(data.startsWith("<?xml version=\"1.0\" encoding=\"UTF-8\"?>")).toBeTruthy();
            expect(data.includes("<NewOP id=\"EU00001\">")).toBeTruthy();
        });

        await doXQuery(source, queries, outputs);

        // Push XML input
        await source.push(XML_INPUT);
    });

    test("Multiple XQuery executions over XML data", async () => {
        const source = new SimpleStream<string>();
        const output1 = new SimpleStream<string>();
        const output2 = new SimpleStream<string>();

        const queries: XQuery[] = [
            { name: "query1", query: XQUERY_1 },
            { name: "query2", query: XQUERY_2 }
        ];
        const outputs: XQueryOutput[] = [
            { name: "query1", stream: output1 },
            { name: "query2", stream: output2 }
        ];

        output1.data(data => {
            expect(data.startsWith("<?xml version=\"1.0\" encoding=\"UTF-8\"?>")).toBeTruthy();
            expect(data.includes("<NewOP id=\"EU00001\">")).toBeTruthy();
        });

        output2.data(data => {
            expect(data.startsWith("<?xml version=\"1.0\" encoding=\"UTF-8\"?>")).toBeTruthy();
            expect(data.includes("<NewOP2 id=\"EU00001\">")).toBeTruthy();
        });

        await doXQuery(source, queries, outputs);

        // Push XML input
        await source.push(XML_INPUT);
    });
});

afterAll(async () => {
    // Clean up temporal files
    await deleteAsync(["/tmp/xml*", "/tmp/saxon*", "/tmp/Saxon*"], { force: true });
});

function sleep(x: number): Promise<unknown> {
    return new Promise(resolve => setTimeout(resolve, x));
}
