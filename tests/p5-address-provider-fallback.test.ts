import test from 'node:test';
import assert from 'node:assert/strict';
import {fetchAddressSuggestions,resolvePlaceToAddress,parseFormattedAddress} from '../server/services/geocoding.ts';
test('missing provider uses manual entry with zero fallback network calls',async()=>{
 const saved=process.env.GOOGLE_MAPS_API_KEY,original=globalThis.fetch;let calls=0;
 delete process.env.GOOGLE_MAPS_API_KEY;globalThis.fetch=async()=>{calls++;throw new Error('No network allowed');};
 try{assert.deepEqual(await fetchAddressSuggestions('1 Fictional Lane'),[]);assert.equal(await resolvePlaceToAddress('123'),null);assert.equal(calls,0);assert.ok(parseFormattedAddress('1 Fictional Lane, Boise, ID 83701'));}
 finally{globalThis.fetch=original;if(saved===undefined)delete process.env.GOOGLE_MAPS_API_KEY;else process.env.GOOGLE_MAPS_API_KEY=saved;}
});
