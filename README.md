# xml-utils-processors-ts

[![Bun CI](https://github.com/julianrojas87/xml-utils-processors-ts/actions/workflows/build-test.yml/badge.svg)](https://github.com/julianrojas87/xml-utils-processors-ts/actions/workflows/build-test.yml) [![npm](https://img.shields.io/npm/v/xml-utils-processors-ts.svg?style=popout)](https://npmjs.com/package/xml-utils-processors-ts)

Typescript wrapper over the Saxon-HE library to be used within the [Connector Architecture](https://the-connector-architecture.github.io/site/docs/1_Home). Currently this repository exposes 1 function:

### [`js:XQueryProcessor`](https://github.com/julianrojas87/xml-utils-processors-ts/blob/main/processors.ttl#L9)

This processor is able to execute one or multiple predefined XQueries over as stream of XML documents. It relies on the Java-based [Saxon-HE engine](https://github.com/Saxonica/Saxon-HE/) to execute the XQueries. This processor can be used within a Connector Architecture (CA) pipeline, by defining an input stream of XML documents (`js:xmlInput`), over which a set of XQueries (`js:xquery`) will be executed and output in a set of correspondent output streams (`js:output`). Each query shall be given a name which must correspond to the name of the output stream where the result will be expected. An example definition of the processor is shown next:

```turtle
[ ] a js:XQueryProcessor; 
    js:xmlInput <xmlChannelReader>;
    js:xquery [
        js:name "Q1";
        js:query "<SomeXQuery>{}</SomeXQuery>"
    ], [
        js:name "Q2";
        js:query "<AnotherXQuery>{}</AnotherXQuery>"
    ];
    js:output [
        js:name "Q1";
        js:outputStream <outputChannelReader1> # This can be consumed by another CA processor
    ], [
        js:name "Q2";
        js:outputStream <outputChannelReader2> # This can be consumed by another CA processor
    ];
    js:saxonLocation <./SaxonHE12-3J.zip>. # Optional. If not given the latest release will be used
```
