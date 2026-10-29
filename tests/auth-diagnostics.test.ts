import {test} from 'node:test';
import assert from 'node:assert/strict';
import {authFailureCode, authFailureResponse, logAuthFailure, ACCOUNT_CONFLICT_MESSAGE} from '../lib/authDiagnostics.ts';
test('recognizes wrapped email collision without returning private database details', () => {
 const error = {message:'SQL with secret-token', params:['private@example.invalid'], cause:{code:'23505',constraint:'users_email_unique',detail:'private@example.invalid'}};
 assert.deepEqual(authFailureResponse(error),{status:409,body:{code:'account_conflict',message:ACCOUNT_CONFLICT_MESSAGE}});
 const output:unknown[][]=[];const previous=console.error;console.error=(...args)=>{output.push(args);};
 try {logAuthFailure('session-user',error);} finally {console.error=previous;}
 assert.deepEqual(output,[['[auth]',{stage:'session-user',code:'account_conflict'}]]);
 assert.ok(!JSON.stringify(output).includes('private'));assert.ok(!JSON.stringify(output).includes('secret-token'));
});
test('other unique constraints and untrusted error messages stay generic', () => {
 for(const error of [{code:'23505',constraint:'other_unique'},new Error('users_email_unique secret-token'),null]) {
  assert.equal(authFailureCode(error),'authentication_failed');assert.equal(authFailureResponse(error).status,500);
 }
});
test('bounded traversal terminates for circular causes',()=>{const error:any={};error.cause=error;assert.equal(authFailureCode(error),'authentication_failed');});
