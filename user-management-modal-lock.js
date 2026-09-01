(function(){
  function install(){
    const fn=window.umAdd;
    if(typeof fn!=='function') return setTimeout(install,50);
    const src=String(fn);
    if(!src.includes('um-add-user-modal')) return setTimeout(install,50);
    let current=fn;
    try{
      Object.defineProperty(window,'umAdd',{
        configurable:true,
        enumerable:true,
        get(){return current},
        set(next){
          if(typeof next==='function' && String(next).includes('um-add-user-modal')) current=next;
        }
      });
      window.__SIKOYEK_USER_ADD_LOCKED__=true;
    }catch(_){
      window.umAdd=current;
    }
  }
  install();
})();
