/* PA Rack Engineering — original procedural equipment illustrations, not vendor CAD.
 * Live placement uses the application's 48U, top-U + occupied-U convention.
 * Switch vocabulary: NVIDIA SN2000 / SN2700 (32 QSFP28), not an installed-SKU claim.
 * CDU vocabulary: in-rack liquid-to-liquid CDU with HMI / rear fluid connections.
 * No external model, texture, runtime dependency, network request or idle animation.
 */
(() => {
  'use strict';
  const U=.30, HALF=48*U/2, FRONT=3.05, TAU=Math.PI*2;
  const TYPES=new Set(['server','switch','powershelf','pdu','cdu','storage','network','blanking']);
  const C={silver:[.49,.54,.59],edge:[.79,.78,.71],steel:[.25,.31,.36],dark:[.045,.066,.082],black:[.013,.021,.029],blue:[.01,.36,.48],green:[.42,.66,.19],gold:[.69,.59,.39],copper:[.45,.28,.17],amber:[.84,.48,.16],unknown:[.27,.34,.39]};
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const identity=()=>new Float32Array([1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]);
  function multiply(a,b){const o=new Float32Array(16);for(let c=0;c<4;c++)for(let r=0;r<4;r++)o[c*4+r]=a[r]*b[c*4]+a[4+r]*b[c*4+1]+a[8+r]*b[c*4+2]+a[12+r]*b[c*4+3];return o;}
  function transform(m,v){return [0,1,2,3].map(r=>m[r]*v[0]+m[4+r]*v[1]+m[8+r]*v[2]+m[12+r]*v[3]);}
  function inverse(m){
    const a=Array.from({length:4},(_,r)=>[m[r],m[4+r],m[8+r],m[12+r],...Array.from({length:4},(_,c)=>+(r===c))]);
    for(let i=0;i<4;i++){let p=i;for(let r=i+1;r<4;r++)if(Math.abs(a[r][i])>Math.abs(a[p][i]))p=r;if(Math.abs(a[p][i])<1e-10)return null;[a[i],a[p]]=[a[p],a[i]];const n=a[i][i];for(let c=0;c<8;c++)a[i][c]/=n;for(let r=0;r<4;r++)if(r!==i){const f=a[r][i];for(let c=0;c<8;c++)a[r][c]-=f*a[i][c];}}
    const out=new Float32Array(16);for(let r=0;r<4;r++)for(let c=0;c<4;c++)out[c*4+r]=a[r][c+4];return out;
  }
  function rotation(y,x){const cy=Math.cos(y),sy=Math.sin(y),cx=Math.cos(x),sx=Math.sin(x);return new Float32Array([cy,0,-sy,0,sy*sx,cx,cy*sx,0,sy*cx,-sx,cy*cx,0,0,0,0,1]);}
  function translation(x=0,y=0,z=0){const m=identity();m[12]=x;m[13]=y;m[14]=z;return m;}
  function ortho(w,h){return new Float32Array([1/w,0,0,0,0,1/h,0,0,0,0,-2/100,0,0,0,-1,1]);}
  function lookAt(eye){let [zx,zy,zz]=eye,l=Math.hypot(...eye);zx/=l;zy/=l;zz/=l;const xl=Math.hypot(zz,zx),xx=zz/xl,xz=-zx/xl,yx=zy*xz,yy=zz*xx-zx*xz,yz=-zy*xx;return new Float32Array([xx,yx,zx,0,0,yy,zy,0,xz,yz,zz,0,-(xx*eye[0]+xz*eye[2]),-(yx*eye[0]+yy*eye[1]+yz*eye[2]),-l,1]);}
  function inspectPlacement(components){
    const valid=[],invalid=[],unplaced=[],occupied=new Set(),names=new Set();
    for(const raw of Array.isArray(components)?components:[]){
      if(!raw||typeof raw!=='object'){invalid.push({name:'',reason:'invalid-record'});continue;}
      const name=String(raw.name||'').trim(),top=Number(raw.rack_u),size=raw.rack_size==null?1:Number(raw.rack_size);
      if(!name){invalid.push({name,reason:'missing-name'});continue;}
      if(names.has(name)){invalid.push({name,reason:'duplicate-name'});continue;}names.add(name);
      if(raw.rack_u==null||raw.rack_u===''||top===0){unplaced.push(name);continue;}
      if(!Number.isInteger(top)||!Number.isInteger(size)||top<1||top>48||size<1||size>48||top-size+1<1){invalid.push({name,reason:'out-of-range',top,size});continue;}
      const slots=Array.from({length:size},(_,i)=>top-i);
      if(slots.some(n=>occupied.has(n))){invalid.push({name,reason:'overlap',top,size});continue;}
      slots.forEach(n=>occupied.add(n));valid.push({...raw,name,mgx_type:TYPES.has(raw.mgx_type)?raw.mgx_type:'server',top,size,bottom:top-size+1,y:(top-size/2)*U-HALF,height:size*U-.026});
    }
    return {valid,invalid,unplaced,occupiedU:occupied.size,count:valid.length};
  }
  function meshBuilder(){
    const data=[];
    const vertex=(p,n,c,metal=.8,emission=0)=>data.push(...p,...n,...c,metal,emission);
    function quad(a,b,c,d,n,color,metal=.8,emission=0){vertex(a,n,color,metal,emission);vertex(b,n,color,metal,emission);vertex(c,n,color,metal,emission);vertex(a,n,color,metal,emission);vertex(c,n,color,metal,emission);vertex(d,n,color,metal,emission);}
    function box(x,y,z,w,h,d,color,metal=.8,emission=0){
      const W=w/2,H=h/2,D=d/2,p=(a,b,c)=>[x+a,y+b,z+c];
      const faces=[[[ -W,-H,D],[W,-H,D],[W,H,D],[-W,H,D],[0,0,1]],[[W,-H,-D],[-W,-H,-D],[-W,H,-D],[W,H,-D],[0,0,-1]],[[W,-H,D],[W,-H,-D],[W,H,-D],[W,H,D],[1,0,0]],[[-W,-H,-D],[-W,-H,D],[-W,H,D],[-W,H,-D],[-1,0,0]],[[-W,H,D],[W,H,D],[W,H,-D],[-W,H,-D],[0,1,0]],[[-W,-H,-D],[W,-H,-D],[W,-H,D],[-W,-H,D],[0,-1,0]]];
      faces.forEach(f=>quad(p(...f[0]),p(...f[1]),p(...f[2]),p(...f[3]),f[4],color,metal,emission));
    }
    function bevel(x,y,z,w,h,d,color,amount=.02,metal=.9){
      const e=[w/2,h/2,d/2],b=Math.min(amount,...e.map(v=>v*.7)),center=[x,y,z],at=v=>v.map((n,i)=>n+center[i]);
      for(let axis=0;axis<3;axis++)for(const sign of [-1,1]){const a=(axis+1)%3,c=(axis+2)%3,n=[0,0,0];n[axis]=sign;const p=[[-1,-1],[1,-1],[1,1],[-1,1]].map(([sa,sc])=>{const v=[0,0,0];v[axis]=e[axis]*sign;v[a]=(e[a]-b)*sa;v[c]=(e[c]-b)*sc;return at(v);});quad(...p,n,color,metal);}
      for(let a=0;a<3;a++)for(let c=a+1;c<3;c++)for(const sa of [-1,1])for(const sc of [-1,1]){const f=3-a-c,n=[0,0,0];n[a]=sa/Math.SQRT2;n[c]=sc/Math.SQRT2;const p=(face,s)=>{const v=[0,0,0];v[a]=(e[a]-(face===a?0:b))*sa;v[c]=(e[c]-(face===c?0:b))*sc;v[f]=(e[f]-b)*s;return at(v);};quad(p(a,-1),p(c,-1),p(c,1),p(a,1),n,color,metal);}
      for(const sx of [-1,1])for(const sy of [-1,1])for(const sz of [-1,1]){const signs=[sx,sy,sz],n=signs.map(v=>v/Math.sqrt(3));for(let axis=0;axis<3;axis++)vertex(at(e.map((v,i)=>(v-(i===axis?0:b))*signs[i])),n,color,metal);}
    }
    function tube(a,b,r,color,segments=10,metal=.9){
      const axis=b.map((n,i)=>n-a[i]),length=Math.hypot(...axis);if(length<.00001)return;const n=axis.map(v=>v/length),ref=Math.abs(n[1])<.85?[0,1,0]:[1,0,0];let u=[n[1]*ref[2]-n[2]*ref[1],n[2]*ref[0]-n[0]*ref[2],n[0]*ref[1]-n[1]*ref[0]];const ul=Math.hypot(...u);u=u.map(v=>v/ul);const v=[n[1]*u[2]-n[2]*u[1],n[2]*u[0]-n[0]*u[2],n[0]*u[1]-n[1]*u[0]],normal=t=>u.map((q,i)=>q*Math.cos(t)+v[i]*Math.sin(t)),point=(p,d)=>p.map((q,i)=>q+d[i]*r);
      for(let i=0;i<segments;i++){const na=normal(i/segments*TAU),nb=normal((i+1)/segments*TAU),p=point(a,na),q=point(a,nb),s=point(b,na),t=point(b,nb);vertex(p,na,color,metal);vertex(q,nb,color,metal);vertex(t,nb,color,metal);vertex(p,na,color,metal);vertex(t,nb,color,metal);vertex(s,na,color,metal);vertex(a,n.map(v=>-v),color,metal);vertex(q,n.map(v=>-v),color,metal);vertex(p,n.map(v=>-v),color,metal);vertex(b,n,color,metal);vertex(s,n,color,metal);vertex(t,n,color,metal);}
    }
    return {data,box,bevel,tube};
  }
  // Embossed U numbers are actual geometry; no canvas texture or CSS projection.
  const SEGMENTS={0:[0,1,2,3,4,5],1:[1,2],2:[0,1,6,4,3],3:[0,1,2,3,6],4:[5,6,1,2],5:[0,5,6,2,3],6:[0,5,6,4,2,3],7:[0,1,2],8:[0,1,2,3,4,5,6],9:[0,1,2,3,5,6]};
  function digit(m,n,x,y,z){const s=.066,t=.009;for(const k of SEGMENTS[n]){const loc=[[0,s,s,t],[s/2,s/2,t,s],[s/2,-s/2,t,s],[0,-s,s,t],[-s/2,-s/2,t,s],[-s/2,s/2,t,s],[0,0,s,t]][k];m.box(x+loc[0],y+loc[1],z,loc[2],loc[3],.006,C.edge,.15);}}
  function createFrame(){
    const m=meshBuilder(),B=m.box,V=m.bevel,T=m.tube;
    for(const side of [-1,1]){
      for(const end of [-1,1])V(side*2.17,0,end*3.15,.21,15.00,.21,C.dark,.035);
      for(const y of [-7.45,7.45])V(side*2.17,y,0,.21,.21,6.48,C.steel,.028);
      B(side*2.085,0,3.14,.075,14.5,.08,C.gold);B(side*2.085,0,-3.11,.075,14.5,.08,C.steel);
      for(let u=1;u<=48;u++){const y=(u-.5)*U-HALF;B(side*2.087,y,3.191,.038,.072,.012,C.black,.1);B(side*2.087,y,-3.16,.038,.072,.012,C.black,.1);if(side===-1){const num=String(u).padStart(2,'0');digit(m,+num[0],-2.41,y,3.18);digit(m,+num[1],-2.30,y,3.18);}}
      // Open side structure: depth is legible and arbitrary hardware stays visible.
      for(const y of [-7.18,-3.6,3.6,7.18])B(side*2.19,y,0,.075,.095,6.2,C.dark);
      for(const z of [-2.64,2.64]){V(side*1.72,-7.65,z,.36,.18,.50,C.black,.04);T([side*1.72,-7.55,z],[side*1.72,-7.78,z],.085,C.steel);}
    }
    V(0,7.50,0,4.56,.20,6.52,C.dark,.03);V(0,-7.48,0,4.56,.19,6.52,C.dark,.03);
    V(0,7.31,3.22,4.39,.31,.12,C.steel,.025);B(0,7.451,3.287,4.26,.009,.017,C.edge);B(-1.6,7.31,3.29,.37,.028,.008,C.edge,.1);B(1.83,7.31,3.29,.028,.024,.008,C.blue,0,.7);
    V(0,-7.29,3.22,4.38,.32,.12,C.dark,.025);B(0,-7.14,3.29,4.16,.007,.012,C.edge);
    return m;
  }
  function chassis(m,h,depth,color=C.silver){
    const z=FRONT-depth/2; m.bevel(0,0,z,3.94,h,depth,color,.02);m.box(0,h/2+.005,z,3.90,.015,depth-.04,C.silver);
    for(const side of [-1,1]){m.box(side*1.988,-h*.30,z,.028,.042,Math.max(.2,depth-.18),C.edge);m.bevel(side*2.002,0,FRONT+.016,.126,h+.008,.105,C.steel,.014);m.tube([side*2.004,0,FRONT+.07],[side*2.004,0,FRONT+.075],.022,C.black,8);}
    return z;
  }
  function led(m,item,x,y,z){
    // Unknown is gray, not fictitious healthy green. Device state never animates.
    const power=String(item.power_state??item.power??'').toLowerCase(),alive=item.os_alive===true||item.bmc_alive===true;
    const color=power==='off'?C.amber:(alive||power==='on')?C.green:C.unknown;
    m.box(x,y,z,.022,.020,.009,color,.05,alive||power==='on'?.9:0);
  }
  function vent(m,x,y,z,w,h,rows=2,cols=10){for(let r=0;r<rows;r++)for(let c=0;c<cols;c++)m.box(x-w/2+w*(c+.5)/cols,y-h/2+h*(r+.5)/rows,z,w/cols*.58,h/rows*.28,.013,C.black,.1);}
  function qsfp(m,x,y,z,w=.18,h=.079){m.box(x,y,z,w,h,.030,C.edge);m.box(x,y,z+.02,w-.025,h-.018,.020,C.black,.05);m.box(x,y-h*.41,z+.037,w*.67,.009,.008,C.gold);}
  function handle(m,x,y,h,z=FRONT+.08){const dy=Math.max(.027,h*.28);m.tube([x,y-dy,z],[x,y-dy,z+.11],.019,C.edge,8);m.tube([x,y-dy,z+.11],[x,y+dy,z+.11],.019,C.edge,8);m.tube([x,y+dy,z+.11],[x,y+dy,z],.019,C.edge,8);}
  function createEquipment(item){
    const m=meshBuilder(),B=m.box,V=m.bevel,T=m.tube,h=item.height,type=item.mgx_type,f=FRONT+.028;
    const depths={server:5.85,switch:4.40,powershelf:3.60,pdu:1.02,cdu:5.95,storage:5.50,network:3.10,blanking:.13},depth=depths[type];
    chassis(m,h,depth,type==='blanking'?C.dark:C.silver);
    if(type==='server'){
      V(0,0,f,3.90,h-.015,.11,C.gold,.016);B(0,h/2-.024,f+.061,3.75,.013,.013,C.edge);
      const rows=Math.min(4,Math.max(1,Math.floor(item.size/2))),bayH=Math.min(.21,(h-.06)/rows);
      for(let r=0;r<rows;r++)for(let c=0;c<8;c++){const x=-1.19+c*.31,y=(r-(rows-1)/2)*Math.min(.29,h/rows);V(x,y,f+.07,.276,bayH,.045,C.steel,.012);B(x,y,f+.098,.220,bayH*.72,.010,C.black,.2);B(x,y-bayH*.32,f+.111,.193,.017,.022,C.silver);}
      for(const side of [-1,1])handle(m,side*1.79,0,Math.min(.43,h));qsfp(m,1.49,h*.18,f+.06,.16,Math.min(.07,h*.22));led(m,item,1.51,-h*.2,f+.078);
      const rear=FRONT-depth-.035;V(0,0,rear,3.75,h*.86,.085,C.steel,.015);
      for(let i=0;i<4;i++)qsfp(m,-.85+i*.57,0,rear-.068,.43,Math.min(.12,h*.49));
      for(const s of [-1,1]){T([s*1.62,0,rear],[s*1.62,0,rear-.14],.072,C.edge);T([s*1.62,0,rear-.14],[s*1.62,0,rear-.145],.041,C.black);}
    }else if(type==='switch'){
      V(0,0,f,3.90,h-.01,.10,C.gold,.015);const rowH=Math.min(.082,(h-.07)/2),dy=Math.min(.055,h*.22);
      for(let row=0;row<2;row++)for(let c=0;c<16;c++){const x=-1.70+c*.205+(c>=8?.18:0),y=row?dy:-dy;qsfp(m,x,y,f+.056,.170,rowH);}
      handle(m,-1.88,0,h*.65);handle(m,1.88,0,h*.65);led(m,item,1.67,h*.35,f+.074);
      const rear=FRONT-depth-.04;for(let i=0;i<2;i++){V(-1.36+i*.76,0,rear,.67,h*.86,.09,C.steel,.015);vent(m,-1.36+i*.76,0,rear-.052,.56,h*.66,2,7);B(-1.36+i*.76,-h*.22,rear-.069,.25,.025,.035,C.edge);}
      for(let i=0;i<4;i++){const x=.18+i*.43;B(x,0,rear,.36,h*.85,.09,C.dark);vent(m,x,0,rear-.051,.29,h*.63,3,4);}
    }else if(type==='cdu'){
      V(0,0,f,3.9,h-.008,.105,C.silver,.025);B(0,-h*.27,f+.062,3.69,.014,.011,C.steel);const displayH=Math.min(.40,h*.53);
      V(.94,h*.10,f+.070,1.08,displayH,.040,C.black,.018);B(.94,h*.10,f+.095,.93,displayH*.78,.012,C.blue,.15,.15);B(.7,h*.1,f+.104,.22,.013,.009,C.edge,.1,.5);B(1.10,h*.1,f+.104,.17,.013,.009,C.green,.1,.7);
      for(let i=0;i<3;i++)B(-1.35+i*.35,h*.1,f+.07,.235,Math.min(.10,h*.25),.018,C.steel);handle(m,-1.72,0,Math.min(h*.70,.68));handle(m,1.72,0,Math.min(h*.70,.68));led(m,item,.41,h*.34,f+.087);
      const rear=FRONT-depth-.035;V(0,0,rear,3.8,h*.90,.08,C.steel,.02);
      for(const x of [-1.24,-.48,.48,1.24]){const radius=Math.min(.125,h*.23);T([x,0,rear],[x,0,rear-.21],radius,C.edge,14);T([x,0,rear-.20],[x,0,rear-.27],radius*.84,x<0?C.blue:C.green,14);T([x,0,rear-.27],[x,0,rear-.275],radius*.64,C.black,14);}
      for(const x of [-1.71,1.71])B(x,0,rear-.075,.14,h*.58,.08,C.black);
    }else if(type==='pdu'){
      V(0,0,f,3.91,h-.014,.11,C.dark,.014);const outletH=Math.min(.15,h*.63),rows=item.size>=2?2:1;
      for(let row=0;row<rows;row++)for(let c=0;c<10;c++){const x=-1.58+c*.293,y=(row-(rows-1)/2)*Math.min(.24,h*.45);V(x,y,f+.068,.219,outletH,.050,C.steel,.012);B(x,y,f+.098,.151,outletH*.69,.025,C.black,.1);for(const dx of [-.039,.039])B(x+dx,y,f+.113,.012,outletH*.35,.009,C.copper);}
      V(1.62,0,f+.072,.37,Math.min(.17,h*.72),.050,C.steel,.01);B(1.62,0,f+.10,.29,Math.min(.12,h*.48),.009,C.blue,.1,.2);led(m,item,1.85,h*.27,f+.075);
      T([1.62,0,FRONT-depth],[1.62,0,FRONT-depth-.19],Math.min(.075,h*.23),C.black);B(-1.45,0,FRONT-depth-.018,.51,h*.43,.044,C.steel);
    }else if(type==='powershelf'){
      V(0,0,f,3.91,h-.01,.11,C.dark,.014);for(let i=0;i<6;i++){const x=-1.56+i*.626;V(x,0,f+.077,.588,h*.84,.070,C.steel,.02);vent(m,x,0,f+.12,.46,h*.52,Math.min(5,item.size+1),6);B(x,h*.30,f+.127,.32,.025,.03,C.edge);led(m,item,x+.21,-h*.30,f+.125);B(x,0,FRONT-depth-.04,.45,h*.68,.09,C.black);B(x,0,FRONT-depth-.094,.19,h*.37,.026,C.copper);}
    }else if(type==='storage'){
      V(0,0,f,3.9,h-.015,.10,C.dark,.015);const rows=Math.max(1,Math.min(4,item.size)),bh=(h-.045)/rows;
      for(let row=0;row<rows;row++)for(let c=0;c<8;c++){const x=-1.56+c*.446,y=(row-(rows-1)/2)*(h-.018)/rows;V(x,y,f+.071,.409,bh*.91,.07,C.silver,.012);B(x,y,f+.111,.334,bh*.68,.027,C.black);B(x,y-bh*.23,f+.128,.259,.025,.021,C.edge);if(row===0&&c===7)led(m,item,x+.155,y+bh*.24,f+.135);}
      const rear=FRONT-depth-.04;for(const x of [-1.38,1.38]){B(x,0,rear,.81,h*.83,.09,C.steel);vent(m,x,0,rear-.055,.65,h*.63,3,7);}for(let i=0;i<4;i++)qsfp(m,-.52+i*.35,0,rear-.07,.26,Math.min(.15,h*.50));
    }else if(type==='network'){
      V(0,0,f,3.90,h-.01,.10,C.steel,.015);const rows=item.size>=2?2:1,ph=Math.min(.10,h*.55/rows);
      for(let row=0;row<rows;row++)for(let c=0;c<12;c++){const x=-1.64+c*.231,y=(row-(rows-1)/2)*Math.min(.21,h*.45);qsfp(m,x,y,f+.059,.185,ph);}qsfp(m,1.45,0,f+.06,.27,ph);led(m,item,1.78,0,f+.073);vent(m,0,0,FRONT-depth-.031,3.10,h*.62,2,18);
    }else{
      V(0,0,f,3.92,h-.012,.066,C.dark,.018);B(0,h/2-.025,f+.038,3.70,.013,.009,C.steel);for(const s of [-1,1])T([s*1.88,0,f+.03],[s*1.88,0,f+.045],.025,C.edge,8);
    }
    return {mesh:m,depth,min:[-2.07,-h/2,FRONT-depth-.33],max:[2.07,h/2,FRONT+.28]};
  }
  const VERTEX=`attribute vec3 aPosition;attribute vec3 aNormal;attribute vec3 aColor;attribute vec2 aMaterial;uniform mat4 uViewProjection;uniform mat4 uModel;uniform mat4 uPart;varying vec3 vPosition;varying vec3 vNormal;varying vec3 vColor;varying vec2 vMaterial;void main(){mat4 m=uModel*uPart;vec4 p=m*vec4(aPosition,1.0);vPosition=p.xyz;vNormal=mat3(m)*aNormal;vColor=aColor;vMaterial=aMaterial;gl_Position=uViewProjection*p;}`;
  const FRAGMENT=`precision highp float;varying vec3 vPosition;varying vec3 vNormal;varying vec3 vColor;varying vec2 vMaterial;uniform vec3 uEye;uniform float uLight;uniform float uSelected;void main(){vec3 n=normalize(vNormal),v=normalize(uEye-vPosition),r=reflect(-v,n),key=normalize(vec3(-.55,.82,.76));float diff=max(dot(n,key),0.0),metal=vMaterial.x;vec3 c=vColor*(.32+diff*.78+max(dot(n,normalize(vec3(.7,.2,-.5))),0.0)*.19);float spec=pow(max(dot(n,normalize(key+v)),0.0),76.0),rim=pow(1.0-max(dot(n,v),0.0),4.0);c+=vec3(.77,.87,.92)*(spec*.42+pow(max(dot(r,normalize(vec3(-.6,.65,-.49))),0.0),18.0)*.28)*metal;c+=vec3(.1,.43,.51)*rim*.10*metal;c+=vColor*uLight*.12;c=mix(c,vColor,clamp(vMaterial.y,0.0,1.0));c+=vec3(.02,.12,.14)*uSelected+vec3(.21,.34,.16)*rim*uSelected*.24;gl_FragColor=vec4(pow(max(c,vec3(0.0)),vec3(.83)),1.0);}`;
  function mount(canvas,options={}){
    const noop={supported:false,setComponents(){},setTheme(){},select(){},setView(){},resetOrbit(){},zoomBy(){},resize(){},getState(){return {supported:false};},destroy(){}};
    if(!canvas||typeof canvas.getContext!=='function')return noop;
    let gl,program,frameMesh,components=[],placement=inspectPlacement(options.components),frame=0,disposed=false,lost=false,ready=false;
    let yaw=-.34,pitch=.055,view='perspective',zoom=1,selected='',drag=null,light=options.theme==='light'||options.theme===true?1:0,inverseMvp=null,maxSize=4096;
    const shaders=[],attrib={},uniform={},onSelect=typeof options.onSelect==='function'?options.onSelect:()=>{};
    const fail=reason=>{canvas.dataset.rackState='fallback';canvas.dataset.rackError=String(reason||'WebGL unavailable');canvas.dispatchEvent(new CustomEvent('pa-rack-fallback',{bubbles:true,detail:{reason:String(reason||'WebGL unavailable')}}));};
    try{gl=canvas.getContext('webgl',{alpha:true,antialias:true,depth:true,premultipliedAlpha:false,powerPreference:'low-power'});}catch(error){fail(error.message);return noop;}if(!gl){fail();return noop;}
    function buffer(mesh){const b=gl.createBuffer(),data=new Float32Array(mesh.data);gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,data,gl.STATIC_DRAW);return {buffer:b,count:data.length/11};}
    function compile(type,source){const shader=gl.createShader(type);shaders.push(shader);gl.shaderSource(shader,source);gl.compileShader(shader);if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))throw new Error('Rack shader compilation failed');return shader;}
    function rebuild(){components.forEach(p=>gl.deleteBuffer(p.buffer));components=placement.valid.map(item=>{const part=createEquipment(item);return {...buffer(part.mesh),item,min:part.min,max:part.max};});}
    function setup(){
      maxSize=Math.min(4096,Number(gl.getParameter(gl.MAX_RENDERBUFFER_SIZE))||4096);program=gl.createProgram();gl.attachShader(program,compile(gl.VERTEX_SHADER,VERTEX));gl.attachShader(program,compile(gl.FRAGMENT_SHADER,FRAGMENT));gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error('Rack shader linking failed');shaders.forEach(s=>gl.deleteShader(s));shaders.length=0;
      ['aPosition','aNormal','aColor','aMaterial'].forEach(n=>attrib[n]=gl.getAttribLocation(program,n));['uViewProjection','uModel','uPart','uEye','uLight','uSelected'].forEach(n=>uniform[n]=gl.getUniformLocation(program,n));
      frameMesh=buffer(createFrame());components=[];rebuild();gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.disable(gl.CULL_FACE);gl.clearColor(0,0,0,0);ready=false;
    }
    function release(){if(!lost){components.forEach(p=>gl.deleteBuffer(p.buffer));if(frameMesh)gl.deleteBuffer(frameMesh.buffer);if(program)gl.deleteProgram(program);shaders.forEach(s=>gl.deleteShader(s));}components=[];frameMesh=null;program=null;shaders.length=0;}
    try{setup();}catch(error){release();fail(error.message);return noop;}
    function sync(){canvas.dataset.rackYaw=yaw.toFixed(4);canvas.dataset.rackPitch=pitch.toFixed(4);canvas.dataset.rackDragging=String(!!drag);canvas.dataset.rackSelected=selected;canvas.dataset.rackCount=String(placement.count);canvas.dataset.rackOccupied=String(placement.occupiedU);canvas.dataset.rackInvalid=String(placement.invalid.length);canvas.dataset.rackView=view;canvas.dataset.rackZoom=zoom.toFixed(3);}
    function requestDraw(){if(!disposed&&!lost&&program&&!frame)frame=requestAnimationFrame(draw);}
    function draw(){
      frame=0;if(disposed||lost||!program)return;const rect=canvas.getBoundingClientRect();if(rect.width<1||rect.height<1)return;const dpr=Math.min(window.devicePixelRatio||1,1.65,maxSize/Math.max(rect.width,rect.height)),w=Math.max(1,Math.round(rect.width*dpr)),h=Math.max(1,Math.round(rect.height*dpr));if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}
      const model=rotation(yaw,pitch),aspect=w/h,eye=[0,0,34],vertical=8.40/zoom,horizontal=Math.max(vertical*aspect,4.42/zoom),vp=multiply(ortho(horizontal,horizontal/aspect),lookAt(eye));inverseMvp=inverse(multiply(vp,model));
      gl.viewport(0,0,w,h);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.useProgram(program);gl.uniformMatrix4fv(uniform.uViewProjection,false,vp);gl.uniformMatrix4fv(uniform.uModel,false,model);gl.uniform3fv(uniform.uEye,new Float32Array(eye));gl.uniform1f(uniform.uLight,light);
      function part(mesh,matrix,isSelected){gl.bindBuffer(gl.ARRAY_BUFFER,mesh.buffer);let offset=0;[['aPosition',3],['aNormal',3],['aColor',3],['aMaterial',2]].forEach(([name,size])=>{gl.enableVertexAttribArray(attrib[name]);gl.vertexAttribPointer(attrib[name],size,gl.FLOAT,false,44,offset);offset+=size*4;});gl.uniformMatrix4fv(uniform.uPart,false,matrix);gl.uniform1f(uniform.uSelected,isSelected?1:0);gl.drawArrays(gl.TRIANGLES,0,mesh.count);}
      part(frameMesh,identity(),false);for(const p of components)part(p,translation(0,p.item.y,p.item.name===selected?.22:0),p.item.name===selected);
      if(!ready){const error=gl.getError();if(error!==gl.NO_ERROR){fail('Rack WebGL render error '+error);return;}ready=true;canvas.dataset.rackState='ready';delete canvas.dataset.rackError;canvas.dispatchEvent(new CustomEvent('pa-rack-ready',{bubbles:true}));}
    }
    function orbit(y,p){yaw=((y+Math.PI)%TAU+TAU)%TAU-Math.PI;pitch=clamp(p,-1.15,1.15);view='custom';sync();requestDraw();}
    function pick(x,y){
      if(!inverseMvp)return null;const rect=canvas.getBoundingClientRect(),nx=(x-rect.left)/rect.width*2-1,ny=1-(y-rect.top)/rect.height*2;
      const points=[-1,1].map(z=>{const p=transform(inverseMvp,[nx,ny,z,1]);return p.slice(0,3).map(v=>v/p[3]);}),origin=points[0],dir=points[1].map((v,i)=>v-origin[i]);let nearest=Infinity,hit=null;
      for(const p of components){const pull=p.item.name===selected?.22:0,min=[p.min[0],p.min[1]+p.item.y,p.min[2]+pull],max=[p.max[0],p.max[1]+p.item.y,p.max[2]+pull];let enter=0,exit=1;for(let axis=0;axis<3;axis++){if(Math.abs(dir[axis])<1e-9){if(origin[axis]<min[axis]||origin[axis]>max[axis]){exit=-1;break;}}else{const t1=(min[axis]-origin[axis])/dir[axis],t2=(max[axis]-origin[axis])/dir[axis];enter=Math.max(enter,Math.min(t1,t2));exit=Math.min(exit,Math.max(t1,t2));}}if(enter<=exit&&enter<nearest){nearest=enter;hit=p.item.name;}}
      return hit;
    }
    function select(name){const next=String(name??'');selected=placement.valid.some(p=>p.name===next)?next:'';sync();requestDraw();}
    function setView(next){if(next==='front'){yaw=0;pitch=0;}else if(next==='rear'){yaw=Math.PI;pitch=0;}else{next='perspective';yaw=-.34;pitch=.055;}view=next;sync();requestDraw();}
    function resetOrbit(){zoom=1;setView('perspective');}
    function onDown(event){if(event.button!==0||event.isPrimary===false||!ready)return;drag={id:event.pointerId,x:event.clientX,y:event.clientY,yaw,pitch,moved:false};try{canvas.setPointerCapture(event.pointerId);}catch{}canvas.focus({preventScroll:true});sync();}
    function onMove(event){if(!drag||event.pointerId!==drag.id)return;const dx=event.clientX-drag.x,dy=event.clientY-drag.y;if(Math.hypot(dx,dy)>4)drag.moved=true;if(drag.moved)orbit(drag.yaw+dx*.008,drag.pitch+dy*.006);}
    function finish(event,cancel=false){if(!drag||event.pointerId!==drag.id)return;const click=!cancel&&!drag.moved;drag=null;try{if(canvas.hasPointerCapture(event.pointerId))canvas.releasePointerCapture(event.pointerId);}catch{}sync();if(click){const hit=pick(event.clientX,event.clientY);if(hit){select(hit);onSelect(hit);}}}
    const onUp=event=>finish(event),onCancel=event=>finish(event,true);
    function onKey(event){const step=event.shiftKey?.25:.12;if(event.key==='ArrowLeft')orbit(yaw-step,pitch);else if(event.key==='ArrowRight')orbit(yaw+step,pitch);else if(event.key==='ArrowUp')orbit(yaw,pitch-step);else if(event.key==='ArrowDown')orbit(yaw,pitch+step);else if(event.key==='Home')resetOrbit();else if(event.key==='+'||event.key==='=')api.zoomBy(1.12);else if(event.key==='-')api.zoomBy(1/1.12);else return;event.preventDefault();}
    function onLost(event){event.preventDefault();lost=true;ready=false;drag=null;if(frame)cancelAnimationFrame(frame);frame=0;sync();fail('WebGL context was lost');}
    function onRestored(){lost=false;try{setup();requestDraw();}catch(error){release();fail(error.message);}}
    const oldTouchAction=canvas.style.touchAction;canvas.style.touchAction='none';const listeners=[['pointerdown',onDown],['pointermove',onMove],['pointerup',onUp],['pointercancel',onCancel],['lostpointercapture',onCancel],['keydown',onKey],['webglcontextlost',onLost],['webglcontextrestored',onRestored]];listeners.forEach(([name,fn])=>canvas.addEventListener(name,fn));
    const ro=typeof ResizeObserver!=='undefined'?new ResizeObserver(requestDraw):null;if(ro)ro.observe(canvas);else window.addEventListener('resize',requestDraw,{passive:true});
    const api={supported:true,
      setComponents(items){if(disposed)return;placement=inspectPlacement(items);if(!placement.valid.some(p=>p.name===selected))selected='';if(!lost)rebuild();sync();requestDraw();},
      setTheme(value){const next=value==='light'||value===true?1:0;if(light!==next){light=next;requestDraw();}},select,setView,resetOrbit,
      zoomBy(factor){const f=Number(factor);if(!Number.isFinite(f)||f<=0)return;zoom=clamp(zoom*f,.75,2.10);sync();requestDraw();},
      resize:requestDraw,
      getState(){return {supported:true,ready,disposed,contextLost:lost,yaw,pitch,view,zoom,selected,theme:light?'light':'dark',dragging:!!drag,count:placement.count,occupiedU:placement.occupiedU,invalid:placement.invalid.map(p=>({...p})),unplaced:[...placement.unplaced],placements:placement.valid.map(p=>({name:p.name,type:p.mgx_type,top:p.top,bottom:p.bottom,size:p.size})),geometryBuffers:components.length+(frameMesh?1:0)};},
      destroy(){if(disposed)return;disposed=true;if(frame)cancelAnimationFrame(frame);frame=0;drag=null;ro?.disconnect();window.removeEventListener('resize',requestDraw);listeners.forEach(([name,fn])=>canvas.removeEventListener(name,fn));canvas.style.touchAction=oldTouchAction;release();canvas.dataset.rackState='disposed';delete canvas.paRackScene;}
    };canvas.paRackScene=api;sync();requestDraw();return api;
  }
  window.PARackScene=Object.freeze({mount,inspectPlacement});
})();
