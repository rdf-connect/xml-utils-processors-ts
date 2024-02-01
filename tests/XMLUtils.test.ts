import { describe, test, expect, afterAll } from "@jest/globals";
import { SimpleStream } from "@ajuvercr/js-runner";
import { XQuery, doXQuery } from "../src/XmlUtils";
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

    const XML_INPUT2 = `
        <RINFData>
            <MemberStateCode Code="BE" Version="1.0"/>
            <OperationalPoint ValidityDateStart="2021-05-10" ValidityDateEnd="2026-12-31">
                <OPName Value="Leuven"/>
                <UniqueOPID Value="BE120353"/>
                <OPTafTapCode IsApplicable="Y" Value="BE04738"/>
                <OPType Value="20" OptionalValue="station"/>
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
                query: XQUERY_1,
                result: output1,
                path: ""
            }
        ];

        output1.data(data => {
            expect(data.startsWith("<?xml version=\"1.0\" encoding=\"UTF-8\"?>")).toBeTruthy();
            expect(data.includes("<NewOP id=\"EU00001\">")).toBeTruthy();
        });

        await doXQuery(source, queries);

        // Push XML input
        await source.push(XML_INPUT);
    });

    test("Multiple XQuery executions over XML data", async () => {
        const source = new SimpleStream<string>();
        const output1 = new SimpleStream<string>();
        const output2 = new SimpleStream<string>();

        const queries: XQuery[] = [
            { name: "query1", query: XQUERY_1, result: output1, path: "" },
            { name: "query2", query: XQUERY_2, result: output2, path: "" }
        ];

        output1.data(data => {
            expect(data.startsWith("<?xml version=\"1.0\" encoding=\"UTF-8\"?>")).toBeTruthy();
            expect(data.includes("<NewOP id=\"EU00001\">")).toBeTruthy();
        });

        output2.data(data => {
            expect(data.startsWith("<?xml version=\"1.0\" encoding=\"UTF-8\"?>")).toBeTruthy();
            expect(data.includes("<NewOP2 id=\"EU00001\">")).toBeTruthy();
        });

        await doXQuery(source, queries);

        // Push XML input
        await source.push(XML_INPUT);
    });

    test("Asynchronous data input is handle properly", async () => {
        const source = new SimpleStream<string>();
        const output = new SimpleStream<string>();
        const queries: XQuery[] = [
            {
                name: "query1",
                query: XQUERY_1,
                result: output,
                path: ""
            }
        ];

        let result = "";
        output.data(data => {
            result += data;
        }).on("end", () => {
            expect(result.startsWith("<?xml version=\"1.0\" encoding=\"UTF-8\"?>")).toBeTruthy();
            expect(result.includes("<NewOP id=\"EU00001\">")).toBeTruthy();
            expect(result.includes("<NewOP id=\"BE120353\">")).toBeTruthy();
        });

        await doXQuery(source, queries);

        // Push data asynchronously
        await Promise.all([
            source.push(XML_INPUT),
            source.push(XML_INPUT2)
        ]);
    });
});

afterAll(async () => {
    // Clean up temporal files
    await deleteAsync(["/tmp/xml*", "/tmp/saxon*", "/tmp/Saxon*"], { force: true });
});

function sleep(x: number): Promise<unknown> {
    return new Promise(resolve => setTimeout(resolve, x));
}
