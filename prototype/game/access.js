/* Commercial access is separate from café saves. Only the native purchase bridge supplies entitlement. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.CafeAccess=factory();})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const FREE_END='1994-12-31', PRODUCT_ID='com.almulla.cafelife.fullgame';
  const full=access=>access?.preview===true||(access?.verified===true&&access?.entitled===true);
  const beyond=state=>state.generation>1||Number(state.date.split('-')[0])>1994;
  function canContinue(state,access){return full(access)||(!beyond(state)&&!(state.date===FREE_END&&state.phase==='closed'));}
  function storyAllowed(story,state,access){return full(access)||(!beyond(state)&&(story.minDay||1)<=365);}
  function blocked(state){return{state,error:'FULL_GAME_REQUIRED',effects:[]};}
  function resolve(engine,state,action,access){
    if(full(access)||['SET_PREF','RENAME'].includes(action.type))return engine.dispatch(state,action);
    if(action.type==='SUCCESSION'||beyond(state))return blocked(state);
    if(action.type==='JUMP'){
      if(!Number.isInteger(action.days)||action.days<1||action.days>3650)return engine.dispatch(state,action);
      const remaining=Math.max(0,Math.round((Date.parse(FREE_END+'T12:00:00Z')-Date.parse(state.date+'T12:00:00Z'))/86400000));
      if(action.days<=remaining)return engine.dispatch(state,action);
      if(!remaining&&state.phase==='closed')return blocked(state);
      const advanced=remaining?engine.dispatch(state,{type:'JUMP',days:remaining}):{state,error:null,effects:[]};
      if(advanced.error)return advanced;
      const closed=engine.dispatch(advanced.state,{type:'CLOSE_DAY'});
      return{...closed,effects:[...advanced.effects,...closed.effects],freeYearFinished:true};
    }
    if(state.date===FREE_END&&(action.type==='NEXT_DAY'||action.type==='CONTINUE'&&state.phase==='closed')){
      if(state.phase==='closed')return blocked(state);
      return{...engine.dispatch(state,{type:'CLOSE_DAY'}),freeYearFinished:true};
    }
    return engine.dispatch(state,action);
  }
  return Object.freeze({FREE_END,PRODUCT_ID,full,beyond,canContinue,storyAllowed,resolve});
});
