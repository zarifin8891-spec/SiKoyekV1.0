/* Shared runtime for the Closed UI. No business rules or backend credentials. */
(function (global) {
  'use strict';
  const moneyFormat = new Intl.NumberFormat('id-ID', {style:'currency',currency:'IDR',maximumFractionDigits:0});
  const plainFormat = new Intl.NumberFormat('id-ID', {maximumFractionDigits:0});
  const assets = new Map();
  const canonical = src => {const url=new URL(src,document.baseURI);if(url.origin===location.origin)url.search='';return url.href};
  document.addEventListener('load',event=>{const el=event.target;if(el.tagName==='SCRIPT'||el.tagName==='LINK')el.dataset.foundationLoaded='1'},true);
  function loadAsset(kind, src, id) {
    const key = kind + ':' + canonical(src);
    if (assets.has(key)) return assets.get(key);
    const existing = [...document.querySelectorAll(kind === 'script' ? 'script[src]' : 'link[rel="stylesheet"]')]
      .find(el => canonical(kind === 'script' ? el.src : el.href) === canonical(src));
    if (existing && existing.dataset.foundationLoaded==='1') return Promise.resolve(existing);
    let element;
    const promise = new Promise((resolve, reject) => {
      element = existing || document.createElement(kind === 'script' ? 'script' : 'link');
      element.dataset.foundationPending = '1';
      if (id && !document.getElementById(id)) element.id = id;
      element.addEventListener('load', () => {delete element.dataset.foundationPending;resolve(element)}, {once:true});
      element.addEventListener('error', () => {assets.delete(key);element.remove();reject(new Error('Gagal memuat '+src))}, {once:true});
      if (!existing) {
        if (kind === 'script') {element.src = src;element.async = false}
        else {element.rel='stylesheet';element.href=src}
        document.head.appendChild(element);
      }
    });
    assets.set(key, promise);
    return promise;
  }
  const subscribers = new Set();
  let observer, frame = 0;
  const metrics = {batches:0, callbacks:0};
  function flush() {
    frame = 0;metrics.batches++;
    for (const item of [...subscribers]) {
      const records = item.takeRecords();
      if (!records.length) continue;
      metrics.callbacks++;
      try {item.callback(records,item)} catch (error) {setTimeout(()=>{throw error},0)}
    }
  }
  function ensureObserver() {
    if (observer) return;
    observer = new global.MutationObserver(records => {
      for (const item of subscribers) {
        for (const record of records) {
          if (item.targets.some(({target,options}) => {
            const inside=target===record.target||(options.subtree&&target.contains(record.target));
            return inside && (record.type==='childList'&&options.childList || record.type==='characterData'&&options.characterData || record.type==='attributes'&&options.attributes&&(!options.attributeFilter||options.attributeFilter.includes(record.attributeName)));
          })) item.records.push(record);
        }
      }
      if (!frame && [...subscribers].some(item=>item.records.length)) frame=requestAnimationFrame(flush);
    });
    observer.observe(document.documentElement,{childList:true,subtree:true,characterData:true});
  }
  class Observer {
    constructor(callback) {this.callback=callback;this.targets=[];this.records=[]}
    observe(target,options) {
      if (!target) throw new TypeError('Observer target is required');
      this.targets=this.targets.filter(item=>item.target!==target);
      this.targets.push({target,options:{...options}});subscribers.add(this);ensureObserver();
      if(options.attributes)observer.observe(document.documentElement,{childList:true,subtree:true,characterData:true,attributes:true,attributeOldValue:true});
    }
    disconnect() {subscribers.delete(this);this.targets=[];this.records=[]}
    takeRecords() {const records=this.records;this.records=[];return records}
  }
  function singleFlight(fn) {
    let task;
    return function(...args) {
      if (task) return task;
      task=Promise.resolve().then(()=>fn.apply(this,args)).finally(()=>{task=undefined});
      return task;
    };
  }
  function setStyle(element,css) {if(element.textContent!==css)element.textContent=css}
  global.SiKoyekFoundation = {
    Observer, metrics, singleFlight, setStyle,
    ownsModal:box=>Boolean(box?.dataset.foundationLayout),
    money:n=>moneyFormat.format(Number(n||0)),
    moneyPlain:n=>plainFormat.format(Number(n||0)),
    loadScript:(src,id)=>loadAsset('script',src,id),
    loadCss:(src,id)=>loadAsset('css',src,id)
  };
})(window);
