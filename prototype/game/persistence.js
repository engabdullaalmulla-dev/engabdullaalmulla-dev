/* Local save transactions. A replacement is validated before existing progress is touched. */
(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory;
  else root.CafeSaveStore=factory;
})(typeof globalThis!=='undefined'?globalThis:this,function(storage,E){
  'use strict';
  const KEY='cafelife_daily_6',BACKUP=KEY+'_backup',ARCHIVE=KEY+'_before_restore',VAULT=KEY+'_library';
  function read(key){return storage.getItem(key);}
  function vault(){
    const raw=read(VAULT);if(!raw)return{version:1,next:1,items:[]};
    const v=JSON.parse(raw);
    if(v.version!==1||!Number.isSafeInteger(v.next)||v.next<1||!Array.isArray(v.items)||new Set(v.items.map(x=>x.id)).size!==v.items.length)throw new Error('INVALID_LIBRARY');
    for(const x of v.items){if(!x||!/^cafe-\d+$/.test(x.id)||typeof x.save!=='string')throw new Error('INVALID_LIBRARY');E.importSave(x.save);}
    return v;
  }
  function list(){return vault().items.map(x=>{const s=E.importSave(x.save);return{id:x.id,name:s.cafeName,owner:s.owner,date:s.date,generation:s.generation};}).reverse();}
  function keep(state){
    const save=E.exportSave(state),v=vault(),existing=v.items.find(x=>x.save===save);
    if(existing)return existing.id;
    const id='cafe-'+v.next++;v.items.push({id,save});storage.setItem(VAULT,JSON.stringify(v));return id;
  }
  function save(state){
    const encoded=E.exportSave(state),old=read(KEY);
    if(old){let valid=false;try{E.importSave(old);valid=true;}catch(_){}if(valid)storage.setItem(BACKUP,old);}
    storage.setItem(KEY,encoded);
  }
  function load(){
    for(const key of [KEY,BACKUP]){const raw=read(key);if(raw){try{return{state:E.importSave(raw),recovered:key===BACKUP};}catch(_){}}}
    return null;
  }
  function replace(raw,current){
    const candidate=E.importSave(raw),encoded=E.exportSave(candidate);
    if(current){const old=E.exportSave(current);keep(current);storage.setItem(ARCHIVE,old);storage.setItem(BACKUP,old);}
    storage.setItem(KEY,encoded);return candidate;
  }
  function snapshot(id){const entry=vault().items.find(x=>x.id===id);if(!entry)throw new Error('MISSING_CAFE');return entry.save;}
  function remove(id){const v=vault();if(!v.items.some(x=>x.id===id))throw new Error('MISSING_CAFE');v.items=v.items.filter(x=>x.id!==id);storage.setItem(VAULT,JSON.stringify(v));}
  return Object.freeze({save,load,list,keep,replace,snapshot,remove,keys:{KEY,BACKUP,ARCHIVE,VAULT}});
});
