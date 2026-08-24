(function(){
  const ENGINE_VERSION='1.1';
  const priorityRank={RENDAH:1,SEDANG:2,TINGGI:3};

  function evaluateHealth(row){
    const progress=Number(row?.project_progress||0);
    const cost=Number(row?.cost_ratio||0);
    const rap=Number(row?.rap_consumption||0);
    const costGap=cost-progress;
    const rapGap=rap-progress;
    let status='SEHAT';
    if(costGap>=15 || rapGap>=20){
      status='BERISIKO';
    }else if(costGap>=5 || rapGap>=10 || (progress<=0.01 && (cost>0.01 || rap>0.01))){
      status='PERLU PENGAWASAN';
    }
    return {status,progress,cost,rap,costGap,rapGap};
  }

  function evaluateCash(row){
    const cashIn=Math.max(0,Number(row?.cash_in||0));
    const cashOut=Math.max(0,Number(row?.cash_out||0));
    const netCashflow=Number.isFinite(Number(row?.net_cashflow))?Number(row.net_cashflow):cashIn-cashOut;
    const outRatio=cashIn>0?(cashOut/cashIn)*100:cashOut>0?Infinity:0;
    const netMargin=cashIn>0?(netCashflow/cashIn)*100:0;
    let status='SEHAT';
    if(cashIn===0&&cashOut>0){
      status='BERISIKO';
    }else if(netCashflow<0){
      status='BERISIKO';
    }else if(outRatio>=80 || (netMargin<20&&cashIn>0)){
      status='PERLU PENGAWASAN';
    }
    return {status,cashIn,cashOut,netCashflow,outRatio,netMargin};
  }

  function evaluate(row){
    const health=evaluateHealth(row);
    const cash=evaluateCash(row);
    const finalStatus=priorityRank[health.status==='BERISIKO'||cash.status==='BERISIKO'?'TINGGI':health.status==='PERLU PENGAWASAN'||cash.status==='PERLU PENGAWASAN'?'SEDANG':'RENDAH'];
    const priority=finalStatus===3?'TINGGI':finalStatus===2?'SEDANG':'RENDAH';
    let status=priority==='TINGGI'?'BERISIKO':priority==='SEDANG'?'PERLU PENGAWASAN':'SEHAT';
    let reason='Progress, biaya/RAP, dan arus kas masih terkendali.';
    let action='Pertahankan kontrol proyek dan lanjutkan pemantauan rutin.';

    if(health.status==='BERISIKO' && cash.status==='BERISIKO'){
      reason='Risiko biaya/RAP dan arus kas muncul bersamaan.';
      action='Hentikan komitmen biaya non-kritis, audit deviasi biaya/RAP, dan amankan sumber Cash In.';
    }else if(health.status==='BERISIKO'){
      reason='Deviasi biaya/RAP terhadap progress sudah berisiko.';
      action='Audit realisasi biaya dan pemakaian RAP sebelum menambah pengeluaran.';
    }else if(cash.status==='BERISIKO'){
      reason='Arus kas proyek sudah berisiko.';
      action='Prioritaskan kebutuhan wajib, audit Cash Out, dan percepat Cash In yang tersedia.';
    }else if(health.status==='PERLU PENGAWASAN' && cash.status==='PERLU PENGAWASAN'){
      reason='Deviasi biaya/RAP dan buffer arus kas sama-sama perlu diawasi.';
      action='Tinjau item pekerjaan, batasi pengeluaran, dan pantau Cash In/Cash Out berikutnya lebih ketat.';
    }else if(health.status==='PERLU PENGAWASAN'){
      reason='Biaya/RAP mulai bergerak lebih cepat daripada progress.';
      action='Tinjau item pekerjaan dan realisasi biaya yang menyebabkan deviasi.';
    }else if(cash.status==='PERLU PENGAWASAN'){
      reason='Buffer arus kas mulai tipis terhadap Cash Out.';
      action='Perketat pengeluaran dan pastikan Cash Out berikutnya didukung Cash In.';
    }

    return {version:ENGINE_VERSION,status,priority,reason,action,health,cash};
  }

  window.SiKoyekUnifiedDecisionEngine={version:ENGINE_VERSION,evaluate};
})();
