# xml-utils-processors-ts

[![Bun CI](https://github.com/rdf-connect/xml-utils-processors-ts/actions/workflows/build-test.yml/badge.svg)](https://github.com/rdf-connect/xml-utils-processors-ts/actions/workflows/build-test.yml) [![npm](https://img.shields.io/npm/v/@rdfc/xml-utils-processors-ts.svg?style=popout)](https://npmjs.com/package/@rdfc/xml-utils-processors-ts)

Typescript util functions related to XML, including a wrapper over the [Saxon-HE library](https://mvnrepository.com/artifact/net.sf.saxon/Saxon-HE) to be used within the [RDF-Connect](https://rdf-connect.github.io/rdfc.github.io/) ecosystem. Currently this repository exposes 1 function:

### [`js:XQueryProcessor`](https://github.com/rdf-connect/xml-utils-processors-ts/blob/main/processors.ttl#L9)

This processor is able to execute one or multiple predefined XQueries over as stream of XML documents. It relies on the Java-based [Saxon-HE engine](https://github.com/Saxonica/Saxon-HE/) to execute the XQueries. This processor can be used within a RDF-Connect (RDF-C) pipeline, by defining an input stream of XML documents (`js:xmlInput`), over which a set of XQueries (`js:xquery`) will be executed and output in a set of correspondent output streams (`js:output`). Each query shall be given a name which must correspond to the name of the output stream where the result will be expected. An example definition of the processor is shown next:

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
        js:outputStream <outputChannelReader1> # This can be consumed by another RDF-C processor
    ], [
        js:name "Q2";
        js:outputStream <outputChannelReader2> # This can be consumed by another RDF-C processor
    ];
    js:saxonLocation <./SaxonHE12-3J.zip>. # Optional. If not given the latest release will be used
```
