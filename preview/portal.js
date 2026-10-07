(function(){
  const tenant=document.getElementById('tenant'),role=document.getElementById('role'),status=document.getElementById('status');
  document.getElementById('open').addEventListener('click',()=>{
    const id=tenant.value;sessionStorage.setItem('sikoyek-preview-role-'+id,role.value);sessionStorage.removeItem('sikoyek-preview-session-'+id);sessionStorage.removeItem('sikoyek-preview-session-'+id+'-out');location.href='./'+id+'/index.html';
  });
  document.getElementById('reset').addEventListener('click',()=>{
    const id=tenant.value;localStorage.removeItem('sikoyek-preview-data-v1-'+id);sessionStorage.removeItem('sikoyek-preview-session-'+id);sessionStorage.removeItem('sikoyek-preview-session-'+id+'-out');status.textContent='Data uji '+tenant.selectedOptions[0].textContent+' telah direset.';
  });
  tenant.addEventListener('change',()=>{status.textContent=''});
})();
