(function(){
  const ENGINE_VERSION='1.0';
  function evaluate(row, health){
    const progress=Number(row?.project_progress||0);
    const cost=Number(row?.cost_ratio||0);
    const rap=Number(row?.rap_consumption||0);
    const costGap=cost-progress;
    const rapGap=rap-progress;
    const status=health?.status || 'SEHAT';
    let priority='RENDAH';
    let action='Pertahankan kontrol dan lanjutkan pemantauan rutin.';
    let reason='Progress masih bergerak sejalan atau lebih cepat daripada konsumsi biaya.';
    if(status==='BERISIKO'){
      priority='TINGGI';
      if(costGap>=15 && rapGap>=20){
        reason='Cost Ratio dan RAP Consumption sama-sama jauh melampaui Progress.';
        action='Hentikan penambahan biaya non-kritis dan lakukan review biaya serta progress segera.';
      }else if(costGap>=15){
        reason='Cost Ratio jauh melampaui Progress.';
        action='Audit realisasi biaya dan item pekerjaan dengan biaya tertinggi sebelum pengeluaran berikutnya.';
      }else{
        reason='RAP Consumption jauh melampaui Progress.';
        action='Periksa pemakaian RAP dan identifikasi item pekerjaan yang mengonsumsi RAP paling cepat.';
      }
    }else if(status==='PERLU PENGAWASAN'){
      priority='SEDANG';
      if(progress<=0.01 && (cost>0.01 || rap>0.01)){
        reason='Sudah ada konsumsi biaya/RAP sementara progress proyek masih nol.';
        action='Validasi transaksi dan pastikan aktivitas pekerjaan sudah tercermin pada progress.';
      }else if(costGap>=5 && rapGap>=10){
        reason='Cost Ratio dan RAP Consumption mulai bergerak lebih cepat daripada Progress.';
        action='Tinjau item pekerjaan dan realisasi biaya yang menyebabkan deviasi.';
      }else if(costGap>=5){
        reason='Cost Ratio bergerak lebih cepat daripada Progress.';
        action='Periksa realisasi biaya terhadap pekerjaan yang sudah diselesaikan.';
      }else{
        reason='RAP Consumption bergerak lebih cepat daripada Progress.';
        action='Periksa pemakaian RAP dan penyebab konsumsi pada item pekerjaan terkait.';
      }
    }
    return {priority,status,reason,action,progress,cost,rap,costGap,rapGap,engineVersion:ENGINE_VERSION};
  }
  window.SiKoyekDecisionEngine={evaluate,version:ENGINE_VERSION};
})();
