/* Shared reads used by list rendering and action validation. */
(function(global){
  'use strict';
  function started(project,progressCount,txCount){
    return String(project?.status||'').toUpperCase()!=='RENCANA'||Number(project?.project_progress||0)>0||Number(progressCount||0)>0||Number(txCount||0)>0;
  }
  function lifecycleFromDetail(detail){
    if(!detail?.project||detail.readError||!Array.isArray(detail.progress)||!Array.isArray(detail.fin))return null;
    const project=detail.project,progressCount=detail.progress.length,txCount=detail.fin.length;
    return {project,progressCount,txCount,started:started(project,progressCount,txCount)};
  }
  async function lifecycle(client,id){
    const [{data:project,error:e1},{count:progressCount,error:e2},{count:txCount,error:e3}]=await Promise.all([
      client.from('projects').select('*').eq('id',id).single(),
      client.from('progress_records').select('id',{count:'exact',head:true}).eq('project_id',id),
      client.from('financial_transactions').select('id',{count:'exact',head:true}).eq('project_id',id)
    ]);
    const error=e1||e2||e3;if(error)throw error;
    return {project,progressCount:progressCount||0,txCount:txCount||0,started:started(project,progressCount,txCount)};
  }
  async function historyIds(client,table,ids){
    const found=new Set(),size=1000;
    for(let offset=0;;offset+=size){
      const {data,error}=await client.from(table).select('project_id').in('project_id',ids).order('id').range(offset,offset+size-1);
      if(error)throw error;
      for(const row of data||[])found.add(row.project_id);
      if((data||[]).length<size||found.size===ids.length)return found;
    }
  }
  async function lifecycleList(client,ids){
    const result=new Map();
    for(let offset=0;offset<ids.length;offset+=100){
      const chunk=ids.slice(offset,offset+100);
      const [{data,error},progress,tx]=await Promise.all([
        client.from('projects').select('*').in('id',chunk),
        historyIds(client,'progress_records',chunk),historyIds(client,'financial_transactions',chunk)
      ]);
      if(error)throw error;
      for(const project of data||[])result.set(project.id,{project,started:started(project,progress.has(project.id)?1:0,tx.has(project.id)?1:0)});
    }
    return result;
  }
  global.SiKoyekRepository={lifecycle,lifecycleList,lifecycleFromDetail};
})(window);
