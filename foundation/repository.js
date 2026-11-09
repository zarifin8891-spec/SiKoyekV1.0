/* Shared reads used by list rendering and action validation. */
(function(global){
  'use strict';
  function started(project,progressCount,txCount){
    return String(project?.status||'').toUpperCase()!=='RENCANA'||Number(project?.project_progress||0)>0||Number(progressCount||0)>0||Number(txCount||0)>0;
  }
  function lifecycleFromDetail(detail){
    if(!detail?.activityVerified||!detail?.project||detail.readError||!Array.isArray(detail.progress)||!Array.isArray(detail.fin))return null;
    const project=detail.project,progressCount=detail.progress.length,txCount=detail.fin.length;
    return {project,progressCount,txCount,started:started(project,progressCount,txCount)};
  }
  async function lifecycle(client,id){
    if(!id)throw new Error('Project ID wajib ada');
    const {data,error}=await client.rpc('sikoyek_secure_project_lifecycle',{p_project_ids:[id]});
    if(error)throw error;
    const row=(data||[])[0];
    if(!row||!row.project)throw new Error('Proyek tidak ditemukan atau akses ditolak');
    return row;
  }
  async function lifecycleList(client,ids){
    const result=new Map();
    for(let offset=0;offset<ids.length;offset+=100){
      const chunk=ids.slice(offset,offset+100);
      if(!chunk.length)continue;
      const {data,error}=await client.rpc('sikoyek_secure_project_lifecycle',{p_project_ids:chunk});
      if(error)throw error;
      for(const row of data||[])if(row?.project)result.set(row.project.id,{
        project:row.project,started:row.started,
        progressCount:row.progressCount,txCount:row.txCount
      });
    }
    return result;
  }
  global.SiKoyekRepository={lifecycle,lifecycleList,lifecycleFromDetail};
})(window);
