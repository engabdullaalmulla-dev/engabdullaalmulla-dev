'use strict';
const assert=require('node:assert/strict'),E=require('../prototype/game/engine.js'),A=require('../prototype/game/access.js');
let count=0;const test=(name,fn)=>{fn();count++;console.log('✓ '+name);};
const trial={verified:true,entitled:false},paid={verified:true,entitled:true};
test('all 365 free trading days settle before the second year requires purchase',()=>{
 let s=E.newGame();let r=A.resolve(E,s,{type:'JUMP',days:1000},trial);assert.equal(r.error,null);assert.equal(r.state.date,'1994-12-31');assert.equal(r.state.phase,'closed');assert.equal(r.state.daysRun,365);assert(r.freeYearFinished);
 const saved=E.exportSave(r.state),stop=A.resolve(E,r.state,{type:'CONTINUE'},trial);assert.equal(stop.error,'FULL_GAME_REQUIRED');assert.equal(E.exportSave(stop.state),saved);
 const onward=A.resolve(E,r.state,{type:'CONTINUE'},paid);assert.equal(onward.state.date,'1995-01-01');assert.equal(onward.state.phase,'planning');
});
test('manual and clipped delegated first-year totals are equal',()=>{
 let manual=E.newGame();for(let day=0;day<365;day++){if(day)manual=A.resolve(E,manual,{type:'NEXT_DAY'},trial).state;manual=A.resolve(E,manual,{type:'CLOSE_DAY'},trial).state;}
 const skipped=A.resolve(E,E.newGame(),{type:'JUMP',days:365},trial).state;assert.equal(manual.cash,skipped.cash);assert.deepEqual(manual.relationships,skipped.relationships);assert.equal(manual.totalServed,skipped.totalServed);
});
test('the last day remains playable and partial service can finish without purchase',()=>{
 let s=E.dispatch(E.newGame(),{type:'JUMP',days:364}).state;s=A.resolve(E,s,{type:'OPEN_DAY'},trial).state;const g=E.currentGuest(s);s=A.resolve(E,s,{type:'SERVE',recipeId:g.recommended},trial).state;
 const r=A.resolve(E,s,{type:'NEXT_DAY'},trial);assert.equal(r.state.date,'1994-12-31');assert.equal(r.state.phase,'closed');assert.equal(r.state.daysRun,365);assert.equal(r.error,null);
});
test('save data and unverified flags never grant purchased access',()=>{
 const s=E.dispatch(E.newGame(),{type:'JUMP',days:400}).state;s.entitled=true;s.verified=true;
 for(const status of [{},{entitled:true},{verified:false,entitled:true},trial])assert.equal(A.resolve(E,s,{type:'CONTINUE'},status).error,'FULL_GAME_REQUIRED');
 assert.equal(A.resolve(E,s,{type:'SET_PREF',key:'lang',value:'ar'},trial).state.lang,'ar');assert.equal(A.resolve(E,s,{type:'CONTINUE'},paid).error,null);
});
test('succession is part of the full game and never changes a free save accidentally',()=>{
 const s=E.newGame(),r=A.resolve(E,s,{type:'SUCCESSION',id:'layla'},trial);assert.equal(r.error,'FULL_GAME_REQUIRED');assert.deepEqual(r.state,s);assert.equal(A.resolve(E,s,{type:'SUCCESSION',id:'layla'},paid).state.generation,2);
});
test('declared development preview remains distinct from an Apple entitlement',()=>{
 assert(A.full({preview:true}));assert(!A.full({preview:'true'}));assert.equal(A.resolve(E,E.newGame(),{type:'JUMP',days:400},{preview:true}).state.date,'1995-02-05');
 assert(!A.storyAllowed({minDay:390},E.newGame(),trial));assert(A.storyAllowed({minDay:365},E.newGame(),trial));assert(A.storyAllowed({minDay:390},E.newGame(),paid));
});
console.log(count+' access checks passed.');
