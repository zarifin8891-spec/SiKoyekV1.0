(function (global) {
  'use strict';

  const enabled = global.SiKoyekConfig?.id === 'multi-perusahaan-development';
  const modules = {
    projects: ['DASHBOARD', 'PROJECTS'],
    rap: ['RAP', 'ITEM_PEKERJAAN'],
    progress: ['PROGRESS'],
    transactions: ['KEUANGAN', 'LAPORAN'],
    master_data: ['MASTER_DATA'],
  };

  async function identify(client, user) {
    const { data: account, error } = await client.from('company_accounts')
      .select('user_id,company_id,access_role,full_name,is_active,template_role').eq('user_id', user.id).maybeSingle();
    if (error || !account?.is_active) throw new Error('Akun SiKoyek belum aktif.');
    if (account.access_role === 'platform_admin') return { account };
    const { data: company, error: companyError } = await client.from('companies')
      .select('id,is_active').eq('id', account.company_id).maybeSingle();
    if (companyError || !company?.is_active) throw new Error('Perusahaan belum aktif.');

    const admin = account.access_role === 'company_admin';
    const permissions = { role: admin ? 'admin' : 'staff', views: {}, actions: {} };
    if (!admin && account.template_role) {
      const [{data: template,error: templateError},{data: override,error: overrideError}]=await Promise.all([
        client.from('company_role_templates').select('grants').eq('name',account.template_role).single(),
        client.from('company_role_overrides').select('grants').eq('role_name',account.template_role).maybeSingle(),
      ]);
      if(templateError||overrideError) throw templateError||overrideError;
      for(const [module,action] of (override?.grants??template.grants)){
        if(action==='VIEW')permissions.views[module]=true;
        else (permissions.actions[module]??={})[action]=true;
      }
    } else if (!admin) {
      const { data: grants, error: grantError } = await client.from('company_staff_permissions')
        .select('module,can_write').eq('user_id', user.id);
      if (grantError) throw grantError;
      for (const grant of grants) {
        for (const name of modules[grant.module] || []) {
          permissions.views[name] = true;
          if (grant.can_write) permissions.actions[name] = { ADD: true, EDIT: true, DELETE: true };
        }
      }
    }
    return { account, permissions };
  }

  global.SiKoyekCompanySession = { enabled, identify };
})(window);
