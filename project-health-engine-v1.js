(function(){
  const ENGINE_VERSION='1.0';
  function evaluate(row){
    const progress=Number(row?.project_progress||0);
    const cost=Number(row?.cost_ratio||0);
    const rap=Number(row?.rap_consumption||0);
    const costGap=cost-progress;
    const rapGap=rap-progress;
    let status='SEHAT';
    let level='green';
    if(costGap>=15 || rapGap>=20){
      status='BERISIKO'; level='red';
    }else if(costGap>=5 || rapGap>=10 || (progress<=0.01 && (cost>0.01 || rap>0.01))){
      status='PERLU PENGAWASAN'; level='amber';
    }
    return {status,level,progress,cost,rap,costGap,rapGap,engineVersion:ENGINE_VERSION};
  }
  window.SiKoyekHealthEngine={evaluate};
})();
