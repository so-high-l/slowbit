/**
 * Slowbit — Night Drive Canvas 2D painter.
 * Port of the approved procedural HTML prototype; no external images or audio.
 * Normal mode moves road markings and lamps. `immersiveProgress` smoothly
 * moves the viewpoint toward the road, lowers the dashboard and brings the
 * cabin lighting and radio equalizer to life.
 *
 * Integration: supply the existing CanvasScene's ctx, width, height and
 * elapsed time IN SECONDS. Feed the app's existing Z-mode transition into
 * immersiveProgress (0..1). Do not create a second RAF loop in Slowbit.
 */

export interface NightDriveFrame {
  ctx: CanvasRenderingContext2D;
  /** CSS pixels or logical painter pixels, matching ctx's existing transform. */
  w: number;
  h: number;
  /** Elapsed animation time in SECONDS; freeze this while paused. */
  t: number;
  /** Transitioned effect value between 0 and 1, owned by CanvasScene. */
  immersiveProgress?: number;
  reducedMotion?: boolean;
}

const DESIGN_W = 1600;
const DESIGN_H = 900;
const TAU = Math.PI * 2;
const seed = (n: number): number => {
  const x = Math.sin(n * 91.173 + 27.91) * 43758.5453123;
  return x - Math.floor(x);
};
const clamp = (x: number, a: number, b: number): number =>
  Math.max(a, Math.min(b, x));

export function paintNightDrive({
  ctx,
  w,
  h,
  t,
  immersiveProgress = 0,
  reducedMotion = false,
}: NightDriveFrame): void {
  if (w <= 0 || h <= 0) return;
  const W = DESIGN_W;
  const H = DESIGN_H;
  const reduced = reducedMotion;
  const zProgress = reduced ? 0 : clamp(immersiveProgress, 0, 1);
  const presence = zProgress * zProgress * (3 - 2 * zProgress);
  const time = reduced ? 0 : t;

  ctx.save();
  // Preserve the original 1600x900 composition without any external assets.
  // The parent CanvasScene owns DPI and resizing.
  ctx.scale(w / W, h / H);

  function grad(x: number, y: number, r: number, stops: [number, string][]): CanvasGradient{
    const g=ctx.createRadialGradient(x,y,0,x,y,r);
    for(const [k,v] of stops)g.addColorStop(k,v);
    return g;
  }
  function ellipse(x: number, y: number, rx: number, ry: number, color: string): void{ctx.fillStyle=color;ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,TAU);ctx.fill();}
  function line(points: readonly (readonly number[])[], color: string, width = 1): void{
    ctx.beginPath();ctx.moveTo(points[0][0],points[0][1]);
    for(let i=1;i<points.length;i++)ctx.lineTo(points[i][0],points[i][1]);
    ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke();
  }
  function polygon(points: readonly (readonly number[])[], color: string | CanvasGradient): void{ctx.beginPath();ctx.moveTo(points[0][0], points[0][1]);for(let i=1;i<points.length;i++)ctx.lineTo(points[i][0], points[i][1]);ctx.closePath();ctx.fillStyle=color;ctx.fill();}
  function roundRect(x: number, y: number, w: number, h: number, r: number, fill?: string | CanvasGradient, stroke?: string): void{
    ctx.beginPath();ctx.roundRect(x,y,w,h,r);
    if(fill){ctx.fillStyle=fill;ctx.fill();}
    if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=1;ctx.stroke();}
  }

  function sky(t: number): void{
    const g=ctx.createLinearGradient(0,0,0,690);
    g.addColorStop(0,'#020916');g.addColorStop(.45,'#071731');g.addColorStop(.77,'#142741');g.addColorStop(1,'#19283a');
    ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
    ctx.fillStyle=grad(1055,425,570,[[0,'rgba(68,106,147,.22)'],[.48,'rgba(25,59,94,.08)'],[1,'rgba(0,0,0,0)']]);ctx.fillRect(480,15,1120,790);
    ctx.fillStyle=grad(400,230,520,[[0,'rgba(22,58,108,.13)'],[1,'rgba(0,0,0,0)']]);ctx.fillRect(0,0,1000,800);
    // Stars in the upper sky: seeded, dim, no flashy particles.
    for(let i=0;i<88;i++){
      const x=seed(i+45)*W, y=seed(i+127)*320+22, r=.35+seed(i+365)*1.4;
      const a=.13+seed(i+745)*.37+(!reduced ? .045*Math.sin(t*.32+i*1.4) : 0);
      ellipse(x,y,r,r,`rgba(199,222,247,${clamp(a,0,.9)})`);
    }
    // The moon is intentionally flat/vector, not an image.
    const mx=1255,my=124;
    ctx.fillStyle=grad(mx,my,65,[[0,'rgba(228,229,206,.14)'],[1,'rgba(220,231,243,0)']]);ctx.fillRect(mx-65,my-65,130,130);
    // Crescent drawn as a single vector path: avoids any transparency cutout.
    ctx.beginPath();
    ctx.moveTo(mx,my-18);
    ctx.arc(mx,my,18,-Math.PI/2,Math.PI/2,false);
    ctx.quadraticCurveTo(mx+7,my,mx,my-18);
    ctx.closePath();
    ctx.fillStyle='#e7ddba';ctx.fill();
  }
  function mountains(t: number, z: number): void{
    const drift=reduced?0:Math.sin(t*.07)*5+Math.sin(t*.041+.8)*9*z;
    polygon([[0,378],[110,339],[217,358],[320,298],[441,351],[558,309],[671,345],[780,290],[915,359],[1042,317],[1171,344],[1291,307],[1420,346],[1600,315],[1600,650],[0,650]],'#101f34');
    polygon([[0,417],[103,402],[235,370],[357,390],[493,353],[586,382],[737,345],[853,376],[995,355],[1137,390],[1270,354],[1440,380],[1600,364],[1600,650],[0,650]],'#0b192a');
    polygon([[0,447],[158,425],[300,435],[410,402],[530,437],[625,407],[750,430],[862,406],[985,433],[1139,419],[1275,447],[1452,412],[1600,439],[1600,650],[0,650]],'#07111f');
    // A soft waterfront-city skyline with code-drawn block silhouettes.
    const y0=439;
    for(let i=0;i<54;i++){
      const x=970+i*11.4+drift*.1;
      const ht=9+seed(i+391)*32+(i===16?57:0);
      ctx.fillStyle=i%3===0?'#101e2c':'#0c1a29';ctx.fillRect(x,y0-ht,8+seed(i+44)*5,ht+24);
      for(let j=0;j<4;j++){
        if(seed(i*16+j+15)>.64){
          ctx.fillStyle=`rgba(242,181,115,${(.23+seed(i*7+j)*.45)*(1-.14*z)})`;
          ctx.fillRect(x+2+(j%2)*4,y0-ht+5+Math.floor(j/2)*9,1.5,2.5);
        }
      }
    }
    // City light seam, slightly warmer on right.
    ctx.fillStyle=grad(1300,444,360,[[0,`rgba(244,172,101,${.14-.025*z})`],[1,'rgba(0,0,0,0)']]);ctx.fillRect(940,350,660,240);
    for(let i=0;i<77;i++){
      const x=920+seed(i+915)*680, y=435+seed(i+295)*12;
      ellipse(x,y,.5+seed(i+991)*1.3,.6,`rgba(255,183,112,${(.18+seed(i+616)*.48)*(1-.12*z)})`);
      // tiny distant water reflections to far right only
      if(x>1160){ctx.fillStyle=`rgba(205,131,80,${.065+.035*z})`;ctx.fillRect(x,y+4,1,3+seed(i+512)*(17+8*z));}
    }
    // dark roadside vegetation shapes
    for(const side of [-1,1])for(let i=0;i<18;i++){
      const n=seed(i+side*50+180), x=(side<0?0:W-250)+n*255,y=435+seed(i+99+side*13)*26;
      const hh=7+seed(i+274+side*13)*25;
      polygon([[x-11,y],[x,y-hh],[x+11,y]],'#06111c');
    }
  }

  function sceneRoad(t: number, z: number): void{
    const hx=786,hy=429,ybottom=763,roadWidth=623;
    const bend=22*Math.sin(t*.07)+16*Math.sin(t*.037+.8); // extremely soft bends
    const project=(p: number): { x: number; y: number; half: number; p: number } =>{
      const q=Math.pow(p,1.5),y=hy+(ybottom-hy)*q;
      const half=3+roadWidth*Math.pow(p,1.13);
      const x=hx+bend*q+3*Math.sin(t*.2)*p;
      return {x,y,half,p};
    };
    const coords=[];
    for(let i=0;i<=46;i++)coords.push(project(i/46));
    const left=coords.map(v=>[v.x-v.half,v.y]),right=coords.map(v=>[v.x+v.half,v.y]);
    const asphalt=ctx.createLinearGradient(hx,hy,hx,ybottom);
    asphalt.addColorStop(0,'#151d29');asphalt.addColorStop(.28,'#0d141f');asphalt.addColorStop(1,'#05090f');
    polygon([...left,...right.reverse()],asphalt);
    // A low central sheen and sparse moving grain give the asphalt depth.
    ctx.fillStyle=grad(hx,hy+132,340,[[0,`rgba(91,118,142,${.08+.035*z})`],[.55,`rgba(45,63,82,${.025+.015*z})`],[1,'rgba(0,0,0,0)']]);
    ctx.fillRect(hx-350,hy,700,ybottom-hy);
    for(let i=0;i<44;i++){
      const p=(seed(i+1520)+t*.036)%1;
      if(p<.08)continue;
      const v=project(p),x=v.x+(seed(i+1710)-.5)*v.half*1.72;
      ellipse(x,v.y,.18+1.05*p,.12+.42*p,`rgba(143,157,168,${.012+.026*p})`);
    }
    // Shoulder strips and pale edge reflectors.
    for(const side of [-1,1]){
      const edge=coords.map(v=>[v.x+v.half*side,v.y]);
      const outer=coords.map(v=>[v.x+(v.half+6+16*v.p)*side,v.y]);
      polygon([...edge,...outer.reverse()],side<0?'#141b27':'#151d2b');
      line(edge,'rgba(167,188,203,.38)',1.5);
      line(coords.map(v=>[v.x+side*(v.half-11*v.p),v.y]),'rgba(238,179,113,.17)',1);
    }
    // Repeating reflectors establish the road's perspective without visual noise.
    for(const s of [-1,1]){
      for(let n=0;n<9;n++){
        const p=(n/9+.13+t*.075)%1;
        const v=project(p),x=v.x+s*(v.half+6);
        ctx.fillStyle=grad(x,v.y,4+12*p+5*z,[[0,`rgba(255,206,148,${.12+.2*p+.09*z*p})`],[1,'rgba(255,177,94,0)']]);
        ctx.fillRect(x-16*p-4,v.y-8*p-4,32*p+8,16*p+8);
        ellipse(x,v.y,Math.max(.5,2.5*p),Math.max(.4,1.2*p),`rgba(255,218,172,${.35+.48*p})`);
      }
    }
    // Dashed lane separators with correct projected perspective and continuous motion.
    const offset=(t*.13)%1;
    for(const lane of [-1/3,1/3]){
      for(let i=0;i<17;i++){
        const p=((i/17+offset)%1);
        if(p<.035||p>.98)continue;
        const q=Math.min(.993,p+.010+.045*p),a=project(p),b=project(q);
        const aw=Math.max(.28,3.8*Math.pow(p,1.1)),bw=Math.max(.4,4.4*Math.pow(q,1.1));
        polygon([[a.x+lane*a.half-aw,a.y],[a.x+lane*a.half+aw,a.y],
          [b.x+lane*b.half+bw,b.y],[b.x+lane*b.half-bw,b.y]],
          `rgba(228,226,213,${clamp(.3+.55*p+.11*z*p,0,.96)})`);
      }
    }
    // Guard rails with depth and small reflectors on both sides.
    for(const s of [-1,1]){
      const rail1=coords.filter((v,i)=>i>7).map(v=>[v.x+s*(v.half+22*v.p),v.y-14*Math.pow(v.p,.5)]);
      const rail2=coords.filter((v,i)=>i>7).map(v=>[v.x+s*(v.half+22*v.p),v.y-8*Math.pow(v.p,.5)]);
      line(rail1,'rgba(144,168,190,.35)',2);line(rail2,'rgba(66,91,116,.45)',3);
    }
    // Lamps naturally stream from the far vanishing point toward the viewer.
    const lampOffset=(t*.079)%1;
    const lampObjects=[];
    for(const side of [-1,1])for(let i=0;i<13;i++){
      const p=(i/13+lampOffset)%1;
      if(p<.055||p>.96)continue;
      lampObjects.push({side,p});
    }
    lampObjects.sort((a,b)=>a.p-b.p);
    for(const {side,p} of lampObjects){
      const v=project(p);const baseX=v.x+side*(v.half+36*p+5);
      const poleHeight=17+196*Math.pow(p,.9),topY=v.y-poleHeight;
      const inset=side===-1?21:-21;
      const poleColor=`rgba(128,150,172,${.19+.4*p})`;
      ctx.lineWidth=Math.max(.6,1.2+2.2*p);ctx.strokeStyle=poleColor;
      ctx.beginPath();ctx.moveTo(baseX,v.y);ctx.lineTo(baseX,topY);ctx.lineTo(baseX+inset*p,topY-5*p);ctx.stroke();
      // warm light source and glow, one visual story, no photo asset
      const lx=baseX+inset*p,ly=topY-5*p;
      const gr=12+35*p+10*z*p;
      ctx.fillStyle=grad(lx,ly,gr,[[0,`rgba(255,190,112,${clamp(.21+.29*p+.09*z*p,0,.78)})`],[.23,`rgba(245,157,65,${.08+.08*p+.035*z*p})`],[1,'rgba(255,160,82,0)']]);
      ctx.fillRect(lx-gr,ly-gr,2*gr,2*gr);
      ellipse(lx,ly,Math.max(1,2.1*p+1.2),Math.max(1,1.2*p+.7),`rgba(255,209,150,${.5+.48*p})`);
      if(z>.005&&p>.54){line([[lx-(14+13*z)*p,ly],[lx+(17+18*z)*p,ly]],`rgba(250,176,99,${(.10+.08*p)*z})`,.7+1.1*z*p);}
    }
    // A small car ahead remains restrained but reads as a vehicle, not two dots.
    const carP=.255+.072*z+.012*Math.sin(t*.055),car=project(carP);
    const carX=car.x-car.half*.16+Math.sin(t*.09)*1.5,carY=car.y-1;
    const carW=17+24*carP,carH=7+12*carP;
    const tailGlow=34+22*z;
    ctx.fillStyle=grad(carX,carY,tailGlow,[[0,`rgba(218,45,51,${.17+.14*z})`],[1,'rgba(218,45,51,0)']]);ctx.fillRect(carX-tailGlow,carY-tailGlow*.82,tailGlow*2,tailGlow*1.64);
    ellipse(carX,carY+carH*.52,carW*.6,carH*.24,'rgba(0,0,0,.36)');
    polygon([[carX-carW*.5,carY+carH*.42],[carX-carW*.43,carY-carH*.16],[carX-carW*.23,carY-carH*.52],[carX+carW*.23,carY-carH*.52],[carX+carW*.43,carY-carH*.16],[carX+carW*.5,carY+carH*.42]],'#080b11');
    polygon([[carX-carW*.2,carY-carH*.42],[carX+carW*.2,carY-carH*.42],[carX+carW*.31,carY-carH*.10],[carX-carW*.31,carY-carH*.10]],'rgba(37,56,70,.8)');
    line([[carX-carW*.43,carY+carH*.18],[carX+carW*.43,carY+carH*.18]],'rgba(77,87,94,.38)',.6);
    ellipse(carX-carW*.32,carY+carH*.19,2.1+carP+1.2*z,1.05+.35*z,'#d84f54');
    ellipse(carX+carW*.32,carY+carH*.19,2.1+carP+1.2*z,1.05+.35*z,'#d84f54');
    line([[carX-carW*.32,carY+carH*.8],[carX-carW*.32,carY+carH*(1.45+1.1*z)]],`rgba(198,43,48,${.12+.08*z})`,1.2+1.1*z);
    line([[carX+carW*.32,carY+carH*.8],[carX+carW*.32,carY+carH*(1.45+1.1*z)]],`rgba(198,43,48,${.12+.08*z})`,1.2+1.1*z);
    // Far-road warmth, subtly anchors the horizon
    ctx.fillStyle=grad(hx,hy+4,144,[[0,'rgba(232,171,114,.11)'],[1,'rgba(0,0,0,0)']]);ctx.fillRect(hx-144,hy-144,288,288);
  }

  function windshield(t: number, z: number): void{
    // A silhouette frame with shapes simple enough for Canvas to reproduce.
    const g=ctx.createLinearGradient(0,0,95,0);g.addColorStop(0,'#01050c');g.addColorStop(1,'#070d19');
    polygon([[0,0],[59,0],[103,135],[130,522],[165,738],[0,770]],g);
    polygon([[1600,0],[1551,0],[1515,143],[1488,517],[1449,734],[1600,764]],'#030913');
    line([[63,0],[102,143],[126,506],[161,734]],'rgba(117,138,164,.14)',3);
    line([[1540,0],[1517,144],[1494,504],[1455,738]],'rgba(110,132,155,.12)',3);
    // In radio mode, passing lamps leave restrained reflections on the glass.
    if(z>.005)for(let i=0;i<6;i++){
      const p=(i/6+(t*.079)%1)%1,side=i%2===0?1:-1;
      const x=side>0?84+430*p:W-84-430*p,y=244+310*p;
      const sweep=20+75*p;
      ctx.fillStyle=grad(x,y,34+82*p,[[0,`rgba(247,180,106,${z*(.018+.055*p)})`],[1,'rgba(247,180,106,0)']]);ctx.fillRect(x-sweep,y-34-82*p,sweep*2,68+164*p);
      line([[x-side*sweep*.36,y-3*p],[x+side*sweep,y+8+16*p]],`rgba(244,176,105,${z*(.035+.105*p)})`,1+4.5*p);
    }
    // windshield lower edge with low glow
    polygon([[0,720],[250,729],[533,694],[1059,692],[1364,727],[1600,720],[1600,900],[0,900]],'#050a13');
    line([[0,720],[251,729],[535,695],[1046,695],[1360,727],[1600,720]],'rgba(97,136,174,.2)',2);
  }

  function dashboard(t: number, z: number): void{
    // The dashboard is one continuous sculpted surface beneath the windshield.
    const dashboard=ctx.createLinearGradient(0,696,0,900);
    dashboard.addColorStop(0,'#142131');dashboard.addColorStop(.16,'#0d1724');dashboard.addColorStop(.58,'#080e18');dashboard.addColorStop(1,'#02050b');
    polygon([[0,749],[183,733],[431,707],[615,710],[997,712],[1269,724],[1600,738],[1600,900],[0,900]],dashboard);
    const topPad=ctx.createLinearGradient(0,705,0,777);
    topPad.addColorStop(0,'rgba(57,79,101,.28)');topPad.addColorStop(.45,'rgba(22,34,49,.45)');topPad.addColorStop(1,'rgba(4,8,15,.82)');
    polygon([[0,748],[192,730],[430,702],[621,706],[997,707],[1278,721],[1600,737],[1600,769],[1290,756],[1000,742],[620,740],[442,738],[192,756],[0,773]],topPad);
    line([[0,748],[194,729],[442,703],[1000,708],[1282,723],[1600,739]],'rgba(121,151,181,.26)',1.7);
    line([[0,773],[194,756],[442,738],[1000,742],[1290,756],[1600,769]],'rgba(2,5,10,.92)',5);
    line([[0,820],[210,800],[470,782],[1020,787],[1350,810],[1600,820]],`rgba(219,131,66,${.25+.14*z})`,1.5);

    // Slim vents follow the sweep of the dash instead of sitting as separate cards.
    for(const x of [118,1224]){
      polygon([[x,782],[x+170,772],[x+174,804],[x+4,812]],'#03070d');
      line([[x+6,788],[x+165,779]],'rgba(111,140,166,.20)',1);
      line([[x+8,797],[x+167,788]],'rgba(76,101,126,.18)',1);
      line([[x+10,806],[x+169,797]],'rgba(53,73,94,.22)',1);
    }

    // A curved binnacle nests the instruments behind the steering wheel.
    const binnacle=ctx.createLinearGradient(0,730,0,876);
    binnacle.addColorStop(0,'#101b28');binnacle.addColorStop(.36,'#050b13');binnacle.addColorStop(1,'#02050a');
    polygon([[286,870],[303,772],[354,731],[699,731],[760,773],[782,870]],binnacle);
    ctx.beginPath();ctx.ellipse(535,812,188,74,0,Math.PI,TAU);ctx.fillStyle='#01050b';ctx.fill();
    ctx.strokeStyle='rgba(104,137,165,.24)';ctx.lineWidth=1.4;ctx.stroke();
    ctx.fillStyle=grad(535,808,176,[[0,'rgba(42,95,125,.13)'],[.65,'rgba(12,35,54,.035)'],[1,'rgba(0,0,0,0)']]);ctx.fillRect(350,744,370,128);
    // Side gauges stay dim so the central speed remains the only strong reading.
    for(const gx of [419,651]){
      ctx.beginPath();ctx.arc(gx,821,48,Math.PI*1.12,Math.PI*1.88);ctx.strokeStyle='rgba(103,151,177,.22)';ctx.lineWidth=1.4;ctx.stroke();
      for(let i=0;i<7;i++){
        const a=Math.PI*(1.14+i*.12),x1=gx+Math.cos(a)*38,y1=821+Math.sin(a)*38,x2=gx+Math.cos(a)*43,y2=821+Math.sin(a)*43;
        line([[x1,y1],[x2,y2]],'rgba(150,177,190,.26)',1);
      }
    }
    ctx.beginPath();ctx.arc(535,816,80,Math.PI*1.15,Math.PI*1.85);ctx.strokeStyle='rgba(113,189,213,.36)';ctx.lineWidth=2;ctx.stroke();
    ctx.textAlign='center';ctx.fillStyle='#e1ebee';ctx.font='300 43px system-ui, -apple-system, sans-serif';ctx.fillText('68',535,810);
    ctx.font='10px system-ui, -apple-system, sans-serif';ctx.fillStyle='rgba(157,188,204,.68)';ctx.fillText('KM / H',535,831);
    ellipse(535,850,2.2,2.2,'rgba(117,201,187,.72)');

    // Steering wheel and spokes sit in the foreground of the instrument hood.
    ctx.beginPath();ctx.ellipse(518,941,244,208,0,Math.PI*1.04,Math.PI*1.96);ctx.strokeStyle='#01050d';ctx.lineWidth=50;ctx.stroke();
    ctx.beginPath();ctx.ellipse(518,941,244,208,0,Math.PI*1.04,Math.PI*1.96);ctx.strokeStyle='rgba(80,105,133,.42)';ctx.lineWidth=2;ctx.stroke();
    polygon([[405,870],[503,870],[494,905],[424,922]],'#050a13');
    polygon([[611,868],[632,880],[591,920],[546,901]],'#050a13');

    // As the view moves toward the road, the instrument hood recedes while
    // the radio remains a readable pool of cabin light.
    if(z>.005){
      const cabinDim=`rgba(0,3,8,${.2*z})`;
      polygon([[0,748],[190,728],[442,701],[1000,706],[1284,721],[1600,737],[1600,900],[0,900]],cabinDim);
      for(let i=0;i<2;i++){
        const p=(i*.5+(t*.079)%1)%1,x=p*W;
        ctx.fillStyle=grad(x,770,230,[[0,`rgba(232,145,76,${.045*z})`],[1,'rgba(232,145,76,0)']]);ctx.fillRect(x-230,700,460,200);
      }
    }

    // The radio is recessed into a tapered center console with physical controls.
    const fascia=ctx.createLinearGradient(930,724,1428,900);
    fascia.addColorStop(0,'rgba(29,44,59,.92)');fascia.addColorStop(.28,'rgba(10,18,28,.98)');fascia.addColorStop(1,'#03060b');
    polygon([[920,728],[1458,740],[1431,900],[916,900]],fascia);
    line([[920,728],[1458,740],[1431,900]],'rgba(105,132,155,.18)',1.2);
    line([[916,900],[920,728]],'rgba(0,0,0,.72)',4);
    // Upper console vents and their shared frame.
    roundRect(1002,744,368,24,6,'#03070c','rgba(85,111,135,.16)');
    for(let i=0;i<5;i++)line([[1015,750+i*3],[1357,750+i*3]],'rgba(64,88,109,.20)',.8);

    const rx=1016,ry=782,rw=342,rh=69;
    if(z>.005){ctx.fillStyle=grad(rx+rw*.55,ry+rh*.45,238,[[0,`rgba(235,146,78,${.11*z})`],[1,'rgba(235,146,78,0)']]);ctx.fillRect(rx-95,ry-130,rw+190,rh+235);}
    roundRect(rx-5,ry-5,rw+10,rh+10,10,'#01040a',`rgba(89,118,141,${.32+.24*z})`);
    const screen=ctx.createLinearGradient(rx,ry,rx+rw,ry+rh);
    screen.addColorStop(0,'#071827');screen.addColorStop(.55,'#06121f');screen.addColorStop(1,'#030b14');
    roundRect(rx,ry,rw,rh,6,screen,'rgba(99,153,178,.20)');
    ctx.fillStyle=grad(rx+80,ry+34,120,[[0,`rgba(45,115,142,${.12+.08*z})`],[1,'rgba(0,0,0,0)']]);ctx.fillRect(rx,ry,rw,rh);
    ctx.textAlign='left';ctx.font='600 9px system-ui, -apple-system, sans-serif';ctx.fillStyle='rgba(112,183,204,.82)';ctx.fillText('88.6   SLOWBIT FM',rx+16,ry+18);
    ctx.font='600 18px system-ui, -apple-system, sans-serif';ctx.fillStyle='#dce8eb';ctx.fillText('NIGHT DRIVE',rx+16,ry+43);
    ctx.font='10px system-ui, -apple-system, sans-serif';ctx.fillStyle='rgba(151,178,191,.68)';ctx.fillText('Lo-fi radio  ·  evening focus',rx+16,ry+59);
    const waveX=rx+245;
    for(let i=0;i<11;i++){
      const idle=.12+seed(i+214)*.12;
      const live=.22+.78*Math.abs(Math.sin((reduced?0:t)*(.9+i*.085)+i*1.41));
      const amp=idle+(live-idle)*z,h=2+amp*22;
      ctx.fillStyle=`rgba(108,190,217,${.22+z*.63})`;ctx.fillRect(waveX+i*6.5,ry+35-h/2,2.4,h);
    }

    // Knobs and lower keys visually belong to the surrounding console.
    for(const kx of [974,1397]){
      ellipse(kx,817,19,19,'#02050a');ellipse(kx,817,14,14,'#111d29');ellipse(kx,817,9,9,'#050b12');
      line([[kx,805],[kx,810]],`rgba(171,199,207,${.4+.3*z})`,1.2);
    }
    for(let i=0;i<6;i++)roundRect(1020+i*55,866,36,8,4,'rgba(40,57,70,.55)','rgba(100,126,143,.12)');
    line([[1005,882],[1372,882]],`rgba(219,131,66,${.16+.12*z})`,1);
    if(z>.005){ctx.fillStyle=grad(rx+rw-12,ry+11,15,[[0,`rgba(146,219,201,${.15*z})`],[1,'rgba(146,219,201,0)']]);ctx.fillRect(rx+rw-27,ry-4,30,30);}
    ellipse(rx+rw-12,ry+11,2.4,2.4,`rgba(146,219,201,${.28+.72*z})`);
  }
  function vignette(z: number): void{
    const g=ctx.createRadialGradient(810,455,260,810,455,1030);
    g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(.62,`rgba(0,0,0,${.04+.06*z})`);g.addColorStop(1,`rgba(0,0,0,${.63+.09*z})`);
    ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
  }

  // Z shifts the composition, not only its opacity: the horizon remains the
  // anchor while the road expands and the cabin drops out of the viewer's way.
  ctx.save();
  if(presence>.0001){
    ctx.translate(Math.sin(time*.13)*4*presence,Math.sin(time*.09)*2*presence);
    ctx.translate(786,429);ctx.scale(1+.13*presence,1+.085*presence);ctx.translate(-786,-429);
  }
  sky(time);
  mountains(time, presence);
  sceneRoad(time, presence);
  ctx.restore();

  ctx.save();
  if(presence>.0001){ctx.translate(800,430);ctx.scale(1+.034*presence,1+.024*presence);ctx.translate(-800,-430);}
  windshield(time, presence);
  ctx.restore();

  ctx.save();
  if(presence>.0001){
    ctx.translate(-Math.sin(time*.13)*2.2*presence,55*presence);
    ctx.translate(800,720);ctx.scale(1+.025*presence,1+.025*presence);ctx.translate(-800,-720);
  }
  dashboard(time, presence);
  ctx.restore();
  vignette(presence);
  ctx.restore();
}
