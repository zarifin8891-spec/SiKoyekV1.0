(function(){
  const VERSION='1.0';
  const clamp=n=>Number.isFinite(Number(n))?Number(n):0;
  function evaluate(input){
    const cashIn=Math.max(0,clamp(input&&input.cash_in));
    const cashOut=Math.max(0,clamp(input&&input.cash_out));
    const netCashflow=clamp(input&&input.net_cashflow) || (cashIn-cashOut);
    const outRatio=cashIn>0?(cashOut/cashIn)*100:cashOut>0?Infinity:0;
    const netMargin=cashIn>0?(netCashflow/cashIn)*100:0;
    let status='SEHAT',priority='RENDAH',reason='Arus kas positif dan Cash Out masih terkendali terhadap Cash In.',action='Pertahankan kontrol arus kas dan lanjutkan pemantauan rutin.';
    if(cashIn===0&&cashOut>0){
      status='BERISIKO';priority='TINGGI';reason='Ada Cash Out tetapi belum ada Cash In pada periode yang dinilai.';action='Tahan pengeluaran non-kritis dan pastikan sumber Cash In sebelum komitmen berikutnya.';
    }else if(netCashflow<0){
      status='BERISIKO';priority='TINGGI';reason='Net Cashflow negatif: Cash Out lebih besar daripada Cash In.';action='Audit pengeluaran terbesar, prioritaskan kebutuhan wajib, dan percepat Cash In yang sudah jatuh tempo.';
    }else if(outRatio>=80){
      status='PERLU PENGAWASAN';priority='SEDANG';reason='Cash Out sudah menggunakan 80% atau lebih dari Cash In pada periode ini.';action='Perketat pengeluaran dan pastikan kebutuhan Cash Out berikutnya memiliki dukungan Cash In.';
    }else if(netMargin<20&&cashIn>0){
      status='PERLU PENGAWASAN';priority='SEDANG';reason='Net Cashflow positif tetapi buffer kas terhadap Cash In masih tipis.';action='Jaga buffer kas dan pantau jadwal Cash In/Cash Out berikutnya lebih ketat.';
    }else if(cashIn===0&&cashOut===0){
      status='SEHAT';priority='RENDAH';reason='Belum ada arus kas pada periode yang dinilai.';action='Lanjutkan pemantauan dan isi transaksi ketika aktivitas keuangan mulai terjadi.';
    }
    return {version:VERSION,cashIn,cashOut,netCashflow,outRatio,netMargin,status,priority,reason,action};
  }
  window.SiKoyekCashflowDecisionEngine={version:VERSION,evaluate};
})();
