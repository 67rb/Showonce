/* Copyright © 2026 Robé Berry. All rights reserved. See COPYRIGHT.md. */
import assert from 'node:assert/strict';
import {MAX_SOURCE_BYTES,readTutorialHTML} from '../src/core.mjs';
const encode=new TextEncoder(),prefix=encode.encode('<html><body><script>'),instructions='Draw a circle with a pencil on paper. Shade the lower edge gradually. Leave the upper area light. Blend the shaded edge gently with a finger.',suffix=encode.encode('</script><h1>Drawing practice</h1><p>'+instructions+'</p></body></html>');
const block=new Uint8Array(65536).fill(120);let remaining=MAX_SOURCE_BYTES-prefix.byteLength-suffix.byteLength,stage=0,bytes=0;
const stream=new ReadableStream({pull(controller){let value;if(stage===0){value=prefix;stage=1;}else if(remaining){const n=Math.min(remaining,block.byteLength);remaining-=n;value=block.subarray(0,n);}else if(stage===1){value=suffix;stage=2;}else{controller.close();return;}bytes+=value.byteLength;controller.enqueue(value);}});
const response=new Response(stream,{headers:{'content-type':'text/html','content-length':String(MAX_SOURCE_BYTES)}});
const text=await readTutorialHTML(response);
assert.equal(bytes,629145600);assert.equal(text,'Drawing practice\n'+instructions);
console.log('Parsed all '+bytes+' bytes (600 MiB) under a 64 MB JavaScript heap, including tutorial instructions at the end.');
