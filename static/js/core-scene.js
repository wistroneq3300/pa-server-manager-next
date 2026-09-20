/* PA System Core — original procedural hardware sculpture.
 * Native WebGL, no downloaded models, textures, packages or network requests.
 * The same chassis is used throughout the reversible L10 → L11 transition.
 * Decorative only: no device state or management behavior is represented here.
 */
(() => {
  'use strict';

  const clamp = (v, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, v));
  const mix = (a, b, t) => a + (b - a) * t;
  const ease = (a, b, v) => { const t = clamp((v - a) / (b - a)); return t * t * (3 - 2 * t); };
  const COLORS = {
    shell: [0.10, 0.145, 0.17], dark: [0.018, 0.029, 0.034], steel: [0.28, 0.35, 0.39],
    edge: [0.47, 0.56, 0.58], board: [0.025, 0.075, 0.064], blue: [0, 0.23, 0.34],
    green: [0.35, 0.60, 0.105], socket: [0.065, 0.09, 0.105], gold: [0.25, 0.20, 0.10]
  };

  const VERTEX = `
    attribute vec3 aPosition;
    attribute vec3 aNormal;
    attribute vec4 aColor;
    attribute vec2 aMaterial;
    uniform mat4 uViewProjection;
    uniform mat4 uModel;
    uniform mat4 uPart;
    uniform float uOpacity;
    varying vec3 vPosition;
    varying vec3 vNormal;
    varying vec4 vColor;
    varying vec2 vMaterial;
    void main() {
      mat4 model = uModel * uPart;
      vec4 world = model * vec4(aPosition, 1.0);
      vPosition = world.xyz;
      vNormal = mat3(model) * aNormal;
      vColor = vec4(aColor.rgb, aColor.a * uOpacity);
      vMaterial = aMaterial;
      gl_Position = uViewProjection * world;
    }`;
  const FRAGMENT = `
    precision highp float;
    varying vec3 vPosition;
    varying vec3 vNormal;
    varying vec4 vColor;
    varying vec2 vMaterial;
    uniform vec3 uEye;
    void main() {
      if (vMaterial.y < -0.5) { gl_FragColor = vColor; return; }
      vec3 N = normalize(vNormal);
      vec3 V = normalize(uEye - vPosition);
      vec3 L = normalize(vec3(-0.42, 0.92, 0.78));
      vec3 R = reflect(-V, N);
      float diffuse = max(dot(N, L), 0.0);
      float ambient = 0.26 + max(N.y, 0.0) * 0.28;
      float metal = vMaterial.x;
      float brush = 0.97 + 0.03 * sin(vPosition.x * 340.0 + vPosition.z * 7.0);
      vec3 base = vColor.rgb * (ambient + diffuse * 0.88) * brush;
      float highlight = pow(max(dot(N, normalize(L + V)), 0.0), 70.0);
      float strip = pow(max(dot(R, normalize(vec3(-0.4, 0.65, -0.66))), 0.0), 8.0);
      float frontStrip = pow(max(dot(R, normalize(vec3(-0.5, -0.18, 0.84))), 0.0), 22.0);
      float edgeStrip = pow(max(dot(R, normalize(vec3(0.75, 0.3, 0.45))), 0.0), 14.0);
      float rim = pow(1.0 - max(dot(N, V), 0.0), 3.0);
      vec3 cold = vec3(0.32, 0.69, 0.84);
      base += vec3(0.79, 0.87, 0.88) * (highlight * 0.75 + strip * 0.48 + frontStrip * 0.18) * metal;
      base += cold * (rim * 0.14 + edgeStrip * 0.20) * metal;
      base += cold * max(dot(N, normalize(vec3(1.0, 0.25, -0.7))), 0.0) * metal * 0.07;
      base = mix(base, vColor.rgb, clamp(vMaterial.y, 0.0, 1.0));
      base += vColor.rgb * max(vMaterial.y - 1.0, 0.0);
      gl_FragColor = vec4(pow(max(base, vec3(0.0)), vec3(0.78)), vColor.a);
    }`;

  function multiply(a, b) {
    const o = new Float32Array(16);
    for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++)
      o[c * 4 + r] = a[r] * b[c * 4] + a[4 + r] * b[c * 4 + 1] + a[8 + r] * b[c * 4 + 2] + a[12 + r] * b[c * 4 + 3];
    return o;
  }
  function perspective(fov, aspect, near, far) {
    const f = 1 / Math.tan(fov / 2), nf = 1 / (near - far);
    return new Float32Array([f / aspect, 0, 0, 0, 0, f, 0, 0, 0, 0, (far + near) * nf, -1, 0, 0, 2 * far * near * nf, 0]);
  }
  function lookAt(eye, target) {
    let zx = eye[0] - target[0], zy = eye[1] - target[1], zz = eye[2] - target[2];
    const zl = Math.hypot(zx, zy, zz); zx /= zl; zy /= zl; zz /= zl;
    const xl = Math.hypot(zz, zx), xx = zz / xl, xz = -zx / xl;
    const yx = zy * xz, yy = zz * xx - zx * xz, yz = -zy * xx;
    return new Float32Array([xx, yx, zx, 0, 0, yy, zy, 0, xz, yz, zz, 0,
      -(xx * eye[0] + xz * eye[2]), -(yx * eye[0] + yy * eye[1] + yz * eye[2]), -(zx * eye[0] + zy * eye[1] + zz * eye[2]), 1]);
  }
  function rotation(y, x) {
    const cy = Math.cos(y), sy = Math.sin(y), cx = Math.cos(x), sx = Math.sin(x);
    return new Float32Array([cy, 0, -sy, 0, sy * sx, cx, cy * sx, 0, sy * cx, -sx, cy * cx, 0, 0, 0, 0, 1]);
  }
  function translation(x, y, z) {
    return new Float32Array([1,0,0,0,0,1,0,0,0,0,1,0,x,y,z,1]);
  }

  function meshBuilder() {
    const data = [];
    function vertex(v, n, color, alpha, metal, emit) { data.push(...v, ...n, ...color, alpha, metal, emit); }
    function quad(a, b, c, d, n, color, alpha, metal, emit) {
      vertex(a,n,color,alpha,metal,emit); vertex(b,n,color,alpha,metal,emit); vertex(c,n,color,alpha,metal,emit);
      vertex(a,n,color,alpha,metal,emit); vertex(c,n,color,alpha,metal,emit); vertex(d,n,color,alpha,metal,emit);
    }
    function box(x,y,z,w,h,d,color,alpha=1,metal=.8,emit=0,tilt=0) {
      if (alpha <= .003) return;
      const co=Math.cos(tilt),si=Math.sin(tilt),W=w/2,H=h/2,D=d/2;
      const p=(a,b,c)=>[x+a,y+b*co-c*si,z+b*si+c*co];
      const n=(a,b,c)=>[a,b*co-c*si,b*si+c*co];
      const faces=[
        [[-W,-H,D],[W,-H,D],[W,H,D],[-W,H,D],[0,0,1]],
        [[W,-H,-D],[-W,-H,-D],[-W,H,-D],[W,H,-D],[0,0,-1]],
        [[W,-H,D],[W,-H,-D],[W,H,-D],[W,H,D],[1,0,0]],
        [[-W,-H,-D],[-W,-H,D],[-W,H,D],[-W,H,-D],[-1,0,0]],
        [[-W,H,D],[W,H,D],[W,H,-D],[-W,H,-D],[0,1,0]],
        [[-W,-H,-D],[W,-H,-D],[W,-H,D],[-W,-H,D],[0,-1,0]]
      ];
      faces.forEach(f=>quad(p(...f[0]),p(...f[1]),p(...f[2]),p(...f[3]),n(...f[4]),color,alpha,metal,emit));
    }
    function ring(x,y,z,radius,width,color,alpha=1,plane='xz',start=0,end=Math.PI*2,emit=0) {
      if(alpha<=.003)return;
      const steps=Math.max(8,Math.ceil((end-start)*13));
      const p=(r,t)=>plane==='xy'?[x+r*Math.cos(t),y+r*Math.sin(t),z]:[x+r*Math.cos(t),y,z+r*Math.sin(t)];
      const normal=plane==='xy'?[0,0,1]:[0,1,0];
      for(let i=0;i<steps;i++){
        const a=mix(start,end,i/steps),b=mix(start,end,(i+1)/steps);
        quad(p(radius-width/2,a),p(radius+width/2,a),p(radius+width/2,b),p(radius-width/2,b),normal,color,alpha,.45,emit);
      }
    }
    function bevel(x,y,z,w,h,d,color,alpha=1,metal=.9,amount=.02) {
      const e=[w/2,h/2,d/2],b=Math.min(amount,...e.map(v=>v*.75)),center=[x,y,z];
      const at=v=>v.map((n,i)=>n+center[i]);
      // Six flats, twelve chamfers and eight corner facets, each with real normals.
      for(let axis=0;axis<3;axis++)for(const sign of [-1,1]){
        const a=(axis+1)%3,c=(axis+2)%3,n=[0,0,0];n[axis]=sign;
        const points=[[-1,-1],[1,-1],[1,1],[-1,1]].map(([sa,sc])=>{const v=[0,0,0];v[axis]=e[axis]*sign;v[a]=(e[a]-b)*sa;v[c]=(e[c]-b)*sc;return at(v);});
        quad(...points,n,color,alpha,metal,0);
      }
      for(let a=0;a<3;a++)for(let c=a+1;c<3;c++)for(const sa of [-1,1])for(const sc of [-1,1]){
        const f=3-a-c,n=[0,0,0];n[a]=sa/Math.SQRT2;n[c]=sc/Math.SQRT2;
        const p=(face,s)=>{const v=[0,0,0];v[a]=(e[a]-(face===a?0:b))*sa;v[c]=(e[c]-(face===c?0:b))*sc;v[f]=(e[f]-b)*s;return at(v);};
        quad(p(a,-1),p(c,-1),p(c,1),p(a,1),n,color,alpha,metal,0);
      }
      for(const sx of [-1,1])for(const sy of [-1,1])for(const sz of [-1,1]){
        const signs=[sx,sy,sz],n=signs.map(v=>v/Math.sqrt(3));
        for(let axis=0;axis<3;axis++)vertex(at(e.map((v,i)=>(v-(i===axis?0:b))*signs[i])),n,color,alpha,metal,0);
      }
    }
    function shadow(y,rx,rz,alpha) {
      const steps=48;
      for(let i=0;i<steps;i++){
        const a=i/steps*Math.PI*2,b=(i+1)/steps*Math.PI*2;
        vertex([0,y,0],[0,1,0],[0,0,0],alpha,0,-1);
        vertex([Math.cos(a)*rx,y,Math.sin(a)*rz],[0,1,0],[0,0,0],0,0,-1);
        vertex([Math.cos(b)*rx,y,Math.sin(b)*rz],[0,1,0],[0,0,0],0,0,-1);
      }
    }
    return {data,box,ring,bevel,shadow};
  }

  function addChassis(mesh, y, alpha, detailed=true, variant=0) {
    const {box,ring}=mesh, C=COLORS;
    const B=(x,dy,z,w,h,d,color,metal=.8,emit=0,tilt=0)=>box(x,y+dy,z,w,h,d,color,alpha,metal,emit,tilt);
    mesh.bevel(0,y-.21,0,3.82,.065,2.78,C.steel,alpha,.93,.025);
    B(-1.87,0,0,.055,.43,2.75,C.shell);B(1.87,0,0,.055,.43,2.75,C.shell);
    B(0,0,-1.37,3.75,.43,.06,C.shell);
    mesh.bevel(0,y,1.40,3.82,.48,.13,C.dark,alpha,.75,.022);
    B(0,.246,1.445,3.78,.018,.09,C.edge);
    B(0,-.24,1.455,3.80,.017,.10,C.steel);
    [-1,1].forEach(side=>{
      B(side*1.975,0,1.43,.15,.57,.075,C.steel);
      B(side*2.015,0,1.50,.055,.26,.055,C.edge);
      B(side*1.974,.205,1.476,.045,.035,.012,C.dark,0);
      B(side*1.974,-.205,1.476,.045,.035,.012,C.dark,0);
    });
    // Separate drive caddies, stepped catches and perforated front intake.
    const drives=variant===1?12:8;
    for(let row=0;row<2;row++)for(let i=0;i<drives;i++){
      const cell=3.12/drives,x=-1.67+cell*(i+.5),dy=(row-.5)*.195;
      B(x,dy,1.486,cell-.030,.163,.05,C.shell);
      B(x-.01,dy,1.518,cell-.085,.108,.028,C.dark,0);
      B(x-.01,dy+.037,1.536,cell-.102,.015,.012,C.steel);
      B(x-.01,dy-.029,1.536,cell-.102,.010,.012,C.steel);
      B(x+cell*.29,dy,1.539,.019,.078,.013,C.edge);
      if(i%2===0)B(x-cell*.28,dy-.045,1.548,.014,.010,.005,C.green,0,1.4);
    }
    // Service panel, recessed I/O, small status lights and power button.
    B(1.59,0,1.49,.49,.38,.04,C.socket);
    B(1.51,-.083,1.527,.105,.05,.02,C.dark,0);
    B(1.66,-.083,1.527,.105,.05,.02,C.dark,0);
    B(1.52,.025,1.531,.12,.019,.02,C.blue,0,.85);
    B(1.69,.025,1.531,.044,.019,.02,C.green,0,1.45);
    ring(1.605,y+.119,1.534,.035,.01,C.edge,alpha,'xy');
    B(1.605,.122,1.537,.009,.04,.006,C.green,0,1.0);
    // A visible rear fan row and power supplies establish real chassis depth.
    for(let i=0;i<4;i++){
      B(-1.30+i*.72,.15,-1.03,.57,.15,.54,C.dark);
      if(detailed){
        ring(-1.30+i*.72,y+.231,-1.03,.205,.016,C.steel,alpha);
        ring(-1.30+i*.72,y+.233,-1.03,.139,.010,C.steel,alpha);
        B(-1.30+i*.72,.232,-1.03,.075,.02,.075,C.edge);
      }
    }
    if(detailed){
      B(0,-.154,-.08,3.52,.025,2.32,C.board,.15);
      // Four coherent accelerator cooling blocks with individually modelled fins.
      for(let gpu=0;gpu<4;gpu++){
        const x=-1.36+gpu*.89;
        B(x,.075,.10,.73,.23,1.11,C.steel);
        B(x,.204,.10,.73,.018,1.11,C.dark);
        for(let fin=0;fin<12;fin++)B(x-.335+fin*.061,.25,.10,.018,.084,1.02,C.edge);
        B(x,.065,.711,.65,.028,.12,C.gold);
        B(x,-.03,.79,.70,.040,.055,C.socket);
      }
      for(let bank=0;bank<4;bank++)B(-1.5+bank,.018,-.68,.04,.27,.36,C.board,.25);
    }else{
      B(0,.259,0,3.82,.045,2.78,C.shell);
      B(-1.85,.287,0,.023,.008,2.68,C.edge);
      B(1.85,.287,0,.023,.008,2.68,C.edge);
    }
  }

  function createParts() {
    const floor=meshBuilder(),primary=meshBuilder(),secondary=meshBuilder(),switches=meshBuilder(),lid=meshBuilder(),rack=meshBuilder(),C=COLORS;
    floor.shadow(0,3.6,3.0,.44);
    // Restrained calibration arcs follow the same physical scene, not the viewport.
    floor.ring(0,.015,0,2.58,.010,C.blue,.27,'xz',.06,Math.PI*1.78,.8);
    floor.ring(0,.02,0,2.76,.004,C.steel,.14,'xz',0,Math.PI*2,.8);
    for(let i=0;i<24;i++){
      const a=i/24*Math.PI*2,r=2.83;
      floor.box(Math.cos(a)*r,.025,Math.sin(a)*r,.033,.008,.033,C.blue,.35,.2,.8);
    }
    addChassis(primary,0,1,true);
    addChassis(secondary,0,1,false);
    addChassis(switches,0,1,false,1);
    // The lid is a separate reusable mesh: scroll only changes its rigid transform.
    lid.bevel(0,0,0,3.83,.064,2.78,C.steel,1,.96,.021);
    lid.box(-1.83,.034,0,.025,.023,2.66,C.edge,1,.92);
    lid.box(1.83,.034,0,.025,.023,2.66,C.edge,1,.92);
    for(let i=0;i<7;i++)lid.box(-1.38+i*.46,.031,-.63,.17,.006,.58,C.dark,1,.5);
    lid.box(.99,.031,.60,.78,.008,.25,C.steel,1,.88);
    lid.box(1.255,.04,.60,.042,.006,.11,C.blue,1,.2,.35);
    lid.box(1.31,.04,.60,.021,.006,.11,C.green,1,.2,.5);
    {
      const B=(x,y,z,w,h,d,c,metal=.85,emit=0)=>rack.box(x,y,z,w,h,d,c,1,metal,emit);
      // Four rails, ceiling, base and open side braces maintain physical rack proportions.
      [-1,1].forEach(side=>{
        [-1,1].forEach(end=>B(side*2.08,0,end*1.52,.13,6.33,.16,C.steel));
        B(side*2.14,0,-.01,.055,6.24,3.03,C.shell);
        B(side*2.10,3.11,0,.17,.15,3.20,C.edge);
        B(side*2.10,-3.12,0,.17,.17,3.20,C.steel);
        B(side*2.09,-3.25,1.20,.36,.12,.48,C.dark);
        B(side*2.09,-3.25,-1.20,.36,.12,.48,C.dark);
        // Forty-eight discrete markers; position is conceptual, not fixture rack placement.
        for(let u=0;u<48;u++)B(side*2.079,-2.99+u*.126,1.611,.047,.036,.008,C.dark,0);
        B(side*2.166,0,1.594,.012,6.14,.022,C.blue,.7,.35);
      });
      B(0,3.18,0,4.34,.13,3.29,C.shell);
      B(0,-3.13,0,4.34,.15,3.29,C.shell);
      B(0,3.12,1.65,4.23,.23,.10,C.steel);
      B(0,-3.02,1.65,4.23,.18,.10,C.steel);
      B(0,3.24,1.704,4.18,.019,.012,C.edge);
      B(1.75,3.12,1.708,.095,.025,.014,C.green,0,1.3);
      B(-1.62,3.12,1.708,.43,.026,.013,C.blue,0,.65);
      for(let i=0;i<14;i++)B(-1.71+i*.263,-2.93,1.51,.15,.042,.10,C.dark);
    }
    return {floor,primary,secondary,switches,lid,rack};
  }

  function mount(canvas) {
    if(!canvas || typeof canvas.getContext!=='function')return {supported:false,setProgress(){},setPointer(){},resize(){},destroy(){}};
    let gl,program,frame=0,disposed=false,contextLost=false,parts=null;
    let progress=0,pointerX=0,pointerY=0,ready=false,maxBufferSize=4096;
    const noop={supported:false,setProgress(){},setPointer(){},resize(){},destroy(){}};
    const fail=(reason='WebGL is unavailable')=>{
      canvas.dataset.coreState='fallback';
      canvas.dataset.coreError=String(reason);
      canvas.dispatchEvent(new CustomEvent('pa-core-fallback',{bubbles:true,detail:{reason:String(reason)}}));
    };
    try { gl=canvas.getContext('webgl',{alpha:true,antialias:true,depth:true,premultipliedAlpha:false,powerPreference:'low-power',preserveDrawingBuffer:false}); }
    catch(error){fail(error.message);return noop;}
    if(!gl){fail();return noop;}
    const shaders=[];
    function compile(type,source){
      const s=gl.createShader(type);shaders.push(s);gl.shaderSource(s,source);gl.compileShader(s);
      if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error('Core scene shader compilation failed: '+gl.getShaderInfoLog(s));
      return s;
    }
    const attributes={},uniforms={};
    function setup(){
      maxBufferSize=Math.min(4096,Number(gl.getParameter(gl.MAX_RENDERBUFFER_SIZE))||4096);
      program=gl.createProgram();
      gl.attachShader(program,compile(gl.VERTEX_SHADER,VERTEX));
      gl.attachShader(program,compile(gl.FRAGMENT_SHADER,FRAGMENT));
      gl.linkProgram(program);
      if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error('Core scene shader linking failed: '+gl.getProgramInfoLog(program));
      shaders.forEach(s=>gl.deleteShader(s));shaders.length=0;
      parts={};
      Object.entries(createParts()).forEach(([name,mesh])=>{
        const data=new Float32Array(mesh.data),buffer=gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,data,gl.STATIC_DRAW);
        parts[name]={buffer,count:data.length/12};
      });
      ['aPosition','aNormal','aColor','aMaterial'].forEach(n=>attributes[n]=gl.getAttribLocation(program,n));
      ['uViewProjection','uModel','uPart','uOpacity','uEye'].forEach(n=>uniforms[n]=gl.getUniformLocation(program,n));
      gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.disable(gl.CULL_FACE);
      gl.enable(gl.BLEND);gl.blendFuncSeparate(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA,gl.ONE,gl.ONE_MINUS_SRC_ALPHA);
      gl.clearColor(0,0,0,0);ready=false;
    }
    function release(){
      if(gl&&!contextLost){if(parts)Object.values(parts).forEach(p=>gl.deleteBuffer(p.buffer));if(program)gl.deleteProgram(program);shaders.forEach(s=>gl.deleteShader(s));}
      parts=null;program=null;shaders.length=0;
    }
    try{setup();}catch(error){release();fail(error.message);return noop;}

    function requestDraw(){if(!disposed&&!contextLost&&program&&parts&&!frame)frame=requestAnimationFrame(draw);}
    function draw(){
      frame=0;if(disposed||contextLost||!program||!parts)return;
      const rect=canvas.getBoundingClientRect();
      if(rect.width<1||rect.height<1)return;
      const dpr=Math.min(window.devicePixelRatio||1,1.7,maxBufferSize/Math.max(rect.width,rect.height));
      const width=Math.round(rect.width*dpr),height=Math.round(rect.height*dpr);
      if(canvas.width!==width||canvas.height!==height){canvas.width=width;canvas.height=height;}
      const t=ease(.14,.98,progress),aspect=width/height;
      // A narrower scene reserves the same silhouette without cropping any rack rails.
      const distance=mix(7.65,12.9,ease(.12,.58,progress))*Math.max(1,1.03/aspect);
      const eye=[distance*.29,mix(distance*.41,distance*.20,t),distance*.91];
      const target=[0,mix(.23,0,t),0];
      gl.viewport(0,0,width,height);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.useProgram(program);
      gl.uniformMatrix4fv(uniforms.uViewProjection,false,multiply(perspective(.555,aspect,.1,60),lookAt(eye,target)));
      gl.uniformMatrix4fv(uniforms.uModel,false,rotation(mix(-.29,-.12,t)+pointerX*.13,pointerY*.045));
      gl.uniform3fv(uniforms.uEye,new Float32Array(eye));
      function part(name,transform,opacity=1,writeDepth=true){
        if(opacity<=.003)return;
        const mesh=parts[name];gl.bindBuffer(gl.ARRAY_BUFFER,mesh.buffer);
        let offset=0;
        [['aPosition',3],['aNormal',3],['aColor',4],['aMaterial',2]].forEach(([attribute,size])=>{
          gl.enableVertexAttribArray(attributes[attribute]);gl.vertexAttribPointer(attributes[attribute],size,gl.FLOAT,false,48,offset);offset+=size*4;
        });
        gl.uniformMatrix4fv(uniforms.uPart,false,transform);gl.uniform1f(uniforms.uOpacity,opacity);
        gl.depthMask(writeDepth);gl.drawArrays(gl.TRIANGLES,0,mesh.count);
      }
      const assembly=ease(.15,.96,progress),primaryY=mix(-.05,.30,assembly),open=1-ease(.02,.56,progress);
      const rackAlpha=ease(.43,.82,progress),moduleAlpha=ease(.18,.51,progress);
      // Every mesh is uploaded once. Each frame changes only matrices and opacity.
      part('floor',translation(0,mix(-.72,-3.35,assembly),0),1,false);
      part('primary',translation(0,primaryY,0));
      part('lid',multiply(translation(0,primaryY+.315+open*.83,-open*.28),rotation(0,-open*.11)));
      [-2.50,-1.94,-1.38,-.82,-.26,.30,.86,1.42,1.98,2.54].forEach((slot,i)=>{
        if(i===5)return;
        const y=mix(primaryY+(i-5)*.56,slot,assembly);
        part(i>7?'switches':'secondary',translation(0,y,-.55*(1-assembly)),moduleAlpha,moduleAlpha>.995);
      });
      part('rack',translation(0,0,0),rackAlpha,rackAlpha>.995);
      gl.depthMask(true);
      if(!ready){
        const error=gl.getError();
        if(error!==gl.NO_ERROR){fail('WebGL render error '+error);return;}
        ready=true;canvas.dataset.coreState='ready';delete canvas.dataset.coreError;
        canvas.dispatchEvent(new CustomEvent('pa-core-ready',{bubbles:true}));
      }
    }
    function onLost(ev){ev.preventDefault();contextLost=true;ready=false;if(frame)cancelAnimationFrame(frame);frame=0;fail('WebGL context was lost');}
    function onRestored(){contextLost=false;try{setup();requestDraw();}catch(error){release();fail(error.message);}}
    canvas.addEventListener('webglcontextlost',onLost);canvas.addEventListener('webglcontextrestored',onRestored);
    const ro=typeof ResizeObserver!=='undefined'?new ResizeObserver(requestDraw):null;
    if(ro)ro.observe(canvas);else window.addEventListener('resize',requestDraw,{passive:true});
    requestDraw();
    return {
      supported:true,
      setProgress(value){const next=clamp(Number(value)||0);if(Math.abs(next-progress)<.0005)return;progress=next;requestDraw();},
      setPointer(x,y){const nx=clamp(Number(x)||0,-1,1),ny=clamp(Number(y)||0,-1,1);if(Math.abs(nx-pointerX)+Math.abs(ny-pointerY)<.001)return;pointerX=nx;pointerY=ny;requestDraw();},
      resize:requestDraw,
      destroy(){if(disposed)return;disposed=true;if(frame)cancelAnimationFrame(frame);frame=0;ro?.disconnect();window.removeEventListener('resize',requestDraw);canvas.removeEventListener('webglcontextlost',onLost);canvas.removeEventListener('webglcontextrestored',onRestored);release();canvas.dataset.coreState='disposed';}
    };
  }
  window.PACoreScene=Object.freeze({mount});
})();
