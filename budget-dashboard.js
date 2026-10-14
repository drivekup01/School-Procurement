(() => {
 const $=id=>document.getElementById(id), colors=['#7951b3','#288b81','#cd8e30','#4278bc'], labels=['เงินอุดหนุนรายหัว','กิจกรรมพัฒนาผู้เรียน','รายได้สถานศึกษา','อื่น ๆ'];
 const money=n=>n.toLocaleString('th-TH',{minimumFractionDigits:2,maximumFractionDigits:2});
 const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const sum=arr=>arr.reduce((a,b)=>a+b,0);let projects=[];
 function render(){
  const filtered=projects.filter(p=>!$('department').value||p.department===$('department').value);
  const totals=labels.map((_,i)=>sum(filtered.map(p=>p.amounts[i]))),total=sum(totals);
  $('stats').innerHTML=labels.map((label,i)=>`<article class="stat" style="--accent:${colors[i]}"><span>${label}</span><strong>${money(totals[i])}</strong><small>บาท · ยอดแถวโครงการ</small></article>`).join('');
  $('total').textContent=money(total);let stop=0;
  $('donut').style.background=total?`conic-gradient(${totals.map((n,i)=>{const start=stop;stop+=n/total*100;return `${colors[i]} ${start}% ${stop}%`}).join(',')})`:'#eee';$('donut').setAttribute('aria-label',`ยอดจัดสรรรวม ${money(total)} บาท`);
  $('legend').innerHTML=labels.map((l,i)=>`<div class="legend-row"><span class="dot" style="background:${colors[i]}"></span>${l}<strong>${total?(totals[i]/total*100).toFixed(1):'0.0'}%</strong></div>`).join('');
  const depts=[...new Set(projects.map(p=>p.department))], values=depts.map(d=>sum(filtered.filter(p=>p.department===d).map(p=>sum(p.amounts)))),max=Math.max(...values,1);
  $('bars').innerHTML=depts.map((d,i)=>`<div class="bar-row"><div class="bar-label"><span>${escape(d.replace('ฝ่ายบริหารงาน',''))}</span><strong>${money(values[i])}</strong></div><div class="track"><div style="width:${values[i]/max*100}%"></div></div></div>`).join('');
 }
 $('department').addEventListener('change',render);
 fetch('budget-data.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error();return r.json()}).then(data=>{projects=data.projects;$('department').innerHTML+=[...new Set(projects.map(p=>p.department))].map(d=>`<option>${escape(d)}</option>`).join('');render()}).catch(()=>{$('error').hidden=false;$('error').textContent='ไม่สามารถโหลดข้อมูลงบประมาณได้ กรุณาลองใหม่';});
})();