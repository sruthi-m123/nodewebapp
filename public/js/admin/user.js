async function toggleUserStatus(userId,shouldBlock){
    try {
       const response =await fetch('/admin/toggle_block',{
        method:'POST',
        headers:{
            'Content-Type':'application/json',
        },
        body:JSON.stringify({
            userId,
            isBlocked:shouldBlock
        }),
       }) ;
if(response.ok){
    window.location.reload();//referesh to updating ui
}else{
    const data = await response.json();
    alert(data.message||'failed to update user status');
}
    } catch (error) {
      console.error('error:',error);  
    }
}