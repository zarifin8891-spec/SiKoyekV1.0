/* SiKoyek Cloud: restrict browser data requests by server-backed permissions.
 * UI and query gating are defense-in-depth, NOT replacements for RLS.
 * Finance-sensitive values must be returned only by authenticated, role-checked RPCs.
 */
(function(){
  'use strict';
  const SAFE_PROJECT_COLUMNS='id,project_code,project_name,project_date,start_date,end_date,status,owner_name,location,project_manager,category';
  const canonical=s=>{const x=String(s||'').trim().toUpperCase();return x==='FINANCE'?'KEUANGAN':x};
  const denied=()=>({projects:false,finance:false,rap:false,progress:false,full:false,users:false});
  async function resolve(client){
    try{
      const {data:{user},error:ue}=await client.auth.getUser();
      if(ue||!user?.id)return denied();
      const {data:profile,error:pe}=await client.from('profiles')
        .select('role_id,is_active,roles(name,is_active)').eq('id',user.id).maybeSingle();
      const role=Array.isArray(profile?.roles)?profile.roles[0]:profile?.roles;
      if(pe||!profile?.is_active||!profile.role_id||!role?.is_active)return denied();
      const {data:links,error:re}=await client.from('role_permissions')
        .select('permission_id').eq('role_id',profile.role_id);
      if(re)return denied();
      const ids=(links||[]).map(x=>x.permission_id).filter(Boolean);
      if(!ids.length)return denied();
      const {data:permissions,error:qe}=await client.from('permissions')
        .select('id,module,action').in('id',ids);
      if(qe)return denied();
      const can=(module,action='VIEW')=>(permissions||[]).some(p=>
        canonical(p.module)===canonical(module) &&
        String(p.action||'').toUpperCase()===action
      );
      const projects=can('PROJECTS'),finance=can('KEUANGAN'),rap=can('RAP'),
        progress=can('PROGRESS'),users=can('USERS');
      return {projects,finance,rap,progress,users,full:projects&&finance&&rap&&progress};
    }catch(e){
      console.warn('SiKoyek data-access permission resolution failed',e);
      return denied();
    }
  }
  async function loadSummary(client){
    const access=await resolve(client);
    if(!access.projects)return {summary:[],access};
    const {data:projects,error:projectsError}=await client.from('projects')
      .select(SAFE_PROJECT_COLUMNS).order('project_code');
    if(projectsError)throw projectsError;
    const dates=Object.fromEntries((projects||[]).map(p=>[p.id,p]));
    // project_summary is security_invoker and includes raw finance/RAP aggregates.
    // Do not query it unless the current user has both finance and RAP read rights.
    if(!(access.finance&&access.rap)){
      return {access,summary:(projects||[]).map(p=>({
        ...p,project_id:p.id,contract_value:null,total_rap:null,
        total_realization:null,project_progress:null,cost_ratio:null,
        rap_consumption:null,health_status:null,estimated_profit:null,
        net_cashflow:null,cash_in:null,cash_out:null
      }))};
    }
    const {data:summary,error}=await client.rpc('sikoyek_secure_project_summary');
    if(error)throw error;
    return {
      access,
      summary:(summary||[]).map(p=>({
        ...p,...(dates[p.project_id]||{}),
        ...(!access.progress?{
          project_progress:null,progress_total:null,health_gap:null,
          health_status:null,control_message:null
        }:{})
      }))
    };
  }
  async function loadDetail(client,id,access){
    access=access||denied();
    if(!access.projects)return {project:null,items:[],rap:null,fin:[],progress:[],readError:new Error('No PROJECTS VIEW')};
    const noData=Promise.resolve({data:null,error:null});
    const emptyRows=Promise.resolve({data:[],error:null});
    const requests=[
      access.finance
        ? client.rpc('sikoyek_secure_project_detail',{p_project_id:id})
        : client.from('projects').select(SAFE_PROJECT_COLUMNS).eq('id',id).single(),
      client.from('project_work_items').select('*').eq('project_id',id).order('sort_order'),
      access.rap?client.from('project_rap').select('*').eq('project_id',id).maybeSingle():noData,
      access.finance?client.from('financial_transactions').select('*').eq('project_id',id)
        .order('transaction_date',{ascending:false}):emptyRows,
      access.progress?client.from('progress_records').select('*').eq('project_id',id)
        .order('progress_date',{ascending:false}):emptyRows
    ];
    const [project,items,rap,fin,progress]=await Promise.all(requests);
    const error=[project.error,items.error,rap.error,fin.error,progress.error].find(Boolean)||null;
    return {
      project:project.data,items:items.data||[],rap:rap.data||null,
      fin:fin.data||[],progress:progress.data||[],readError:error
    };
  }
  window.SiKoyekDataAccess={resolve,loadSummary,loadDetail};
})();
