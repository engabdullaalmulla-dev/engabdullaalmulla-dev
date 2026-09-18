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
test('all six hosted final days settle equally with manual, partial and clipped delegated service',()=>{
 const C=require('../prototype/game/content.js');
 const step=(state,action)=>{const result=A.resolve(E,state,action,trial);assert.equal(result.error,null,action.type);return result.state;};
 const lastMorning=E.dispatch(E.newGame(),{type:'JUMP',days:364}).state;
 for(const occasion of C.occasions)for(const approach of occasion.approaches){
  let planned=step(lastMorning,{type:'SELECT_OCCASION',occasionId:occasion.id,approachId:approach.id});
  planned=step(planned,{type:'PREPARE_OCCASION'});
  let manual=step(planned,{type:'OPEN_DAY'});
  while(E.currentGuest(manual))manual=step(manual,{type:'SERVE',recipeId:E.currentGuest(manual).recommended});
  manual=step(manual,{type:'CLOSE_DAY'});
  let partial=step(planned,{type:'OPEN_DAY'});
  partial=step(partial,{type:'SERVE',recipeId:E.currentGuest(partial).recommended});
  partial=E.importSave(E.exportSave(partial));
  const partialResult=A.resolve(E,partial,{type:'NEXT_DAY'},trial);
  const delegatedResult=A.resolve(E,planned,{type:'JUMP',days:30},trial);
  for(const result of [partialResult,delegatedResult]){
   assert.equal(result.error,null);assert(result.freeYearFinished);const state=result.state;
   assert.equal(state.date,A.FREE_END);assert.equal(state.phase,'closed');assert.equal(state.daysRun,365);
   for(const key of ['cash','relationships','hosting','monthly','daysRun','totalServed','keepsakes'])assert.deepEqual(state[key],manual[key],approach.id+': '+key);
   assert.deepEqual(state.lastDay.hosting,manual.lastDay.hosting);
   assert.deepEqual(E.importSave(E.exportSave(state)),state);
  }
  assert.equal(manual.hosting.completed[approach.id],1);assert.equal(manual.hosting.last.newDecoration,true);
  assert(manual.hosting.owned.includes(approach.decorationId));
  assert.equal(manual.lastDay.manual,3);assert.equal(partialResult.state.lastDay.manual,1);assert.equal(delegatedResult.state.lastDay.manual,0);
 }
});
test('the free-year keepsake remains arrangeable and portable while verified continuation clears its completed plan',()=>{
 const occasionId='reunion',approachId='reunion-breakfast',decorationId='reunion-photo';
 let state=E.dispatch(E.newGame(),{type:'JUMP',days:364}).state;
 for(const action of [{type:'SELECT_OCCASION',occasionId,approachId},{type:'PREPARE_OCCASION'},{type:'CLOSE_DAY'},{type:'PLACE_DECORATION',id:decorationId,slot:'wall'}]){
  const result=A.resolve(E,state,action,trial);assert.equal(result.error,null);state=result.state;
 }
 state=E.importSave(E.exportSave(state));
 assert.equal(state.hosting.displays.wall,decorationId);assert.equal(state.hosting.completed[approachId],1);
 const saved=E.exportSave(state);
 for(const action of [{type:'CONTINUE'},{type:'NEXT_DAY'},{type:'JUMP',days:1}]){
  const blocked=A.resolve(E,state,action,trial);assert.equal(blocked.error,'FULL_GAME_REQUIRED');assert.deepEqual(blocked.effects,[]);assert.equal(E.exportSave(blocked.state),saved);
 }
 assert.equal(E.exportSave(A.resolve(E,state,{type:'CLOSE_DAY'},trial).state),saved,'closing again must not grant another hosted reward');
 const moved=A.resolve(E,state,{type:'PLACE_DECORATION',id:decorationId,slot:'shelf'},trial);assert.equal(moved.error,null);
 assert.equal(moved.state.hosting.displays.wall,null);assert.equal(moved.state.hosting.displays.shelf,decorationId);assert.equal(moved.state.cash,state.cash);
 state=E.importSave(E.exportSave(moved.state));
 const onward=A.resolve(E,state,{type:'CONTINUE'},paid);assert.equal(onward.error,null);assert.equal(onward.state.date,'1995-01-01');assert.equal(onward.state.phase,'planning');
 assert.equal(onward.state.hosting.plan,null);assert.equal(E.hostingPlan(onward.state),null);assert.equal(onward.state.service,null);
 for(const key of ['owned','displays','completed','last'])assert.deepEqual(onward.state.hosting[key],state.hosting[key]);
 assert.equal(onward.state.cash,state.cash);assert.deepEqual(onward.state.relationships,state.relationships);
 assert.equal(A.resolve(E,onward.state,{type:'OPEN_DAY'},trial).error,'FULL_GAME_REQUIRED');
 const opened=A.resolve(E,onward.state,{type:'OPEN_DAY'},paid);assert.equal(opened.error,null);assert.equal(opened.state.service.hosting,null);assert.equal(opened.state.service.guests.length,4);
 assert.deepEqual(E.importSave(E.exportSave(opened.state)),opened.state);
});
console.log(count+' access checks passed.');
