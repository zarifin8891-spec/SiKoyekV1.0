/* SiKoyek V1.0 — Single Source Health Engine */
(function(){
  const ENGINE_VERSION='2.0';
  function evaluate(row){
    const progress=Number(row?.project_progress||0);
    const rap=Number(row?.rap_consumption||0);
    const gap=progress-rap;
    let status='SEHAT';
    let level='green';
    if(gap < -5){
      status='BERISIKO'; level='red';
    }else if(gap < 0){
      status='AWASI'; level='amber';
    }
    return {status,level,progress,rap,gap,engineVersion:ENGINE_VERSION};
  }
  window.SiKoyekHealthEngine={evaluate};
})();
