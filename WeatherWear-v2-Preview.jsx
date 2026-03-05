import { useState, useCallback } from "react";

const CLOTHING_IMAGES = {
  "Heavy Winter Coat":     "https://images.unsplash.com/photo-1544022613-e87ca75a784a?w=300&q=80",
  "Thermal Underlayer":    "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=300&q=80",
  "Warm Boots":            "https://images.unsplash.com/photo-1542838132-92c53300491e?w=300&q=80",
  "Gloves & Scarf":        "https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?w=300&q=80",
  "Beanie / Winter Hat":   "https://images.unsplash.com/photo-1576871337622-98d48d1cf531?w=300&q=80",
  "Winter Jacket":         "https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=300&q=80",
  "Sweater":               "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=300&q=80",
  "Jeans / Trousers":      "https://images.unsplash.com/photo-1542272454315-4c01d7abdf4a?w=300&q=80",
  "Light Jacket":          "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=300&q=80",
  "Long-Sleeve Shirt":     "https://images.unsplash.com/photo-1598032895397-b9472444bf93?w=300&q=80",
  "Sneakers":              "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300&q=80",
  "T-Shirt / Polo":        "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=300&q=80",
  "Shorts / Skirt":        "https://images.unsplash.com/photo-1591195853828-11db59a44f43?w=300&q=80",
  "Lightweight T-Shirt":   "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=300&q=80",
  "Shorts / Summer Dress": "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=300&q=80",
  "Sandals":               "https://images.unsplash.com/photo-1603487742131-4160ec999306?w=300&q=80",
  "Sunhat / Cap":          "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=300&q=80",
  "Waterproof Jacket":     "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=300&q=80",
  "Umbrella":              "https://images.unsplash.com/photo-1601084881623-cdf9a8ea242c?w=300&q=80",
  "Waterproof Boots":      "https://images.unsplash.com/photo-1542838132-92c53300491e?w=300&q=80",
  "Snow Boots":            "https://images.unsplash.com/photo-1542838132-92c53300491e?w=300&q=80",
  "Sunglasses":            "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=300&q=80",
  "Sunscreen":             "https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=300&q=80",
  "Windbreaker":           "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=300&q=80",
  "Chinos / Jeans":        "https://images.unsplash.com/photo-1542272454315-4c01d7abdf4a?w=300&q=80",
  "Sneakers / Flats":      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300&q=80",
};

const REASONS = {
  "Heavy Winter Coat":"Freezing temperatures","Thermal Underlayer":"Extra insulation needed","Warm Boots":"Protect feet from cold","Gloves & Scarf":"Protect extremities","Beanie / Winter Hat":"Prevent heat loss","Winter Jacket":"Cold weather protection","Sweater":"Insulating middle layer","Jeans / Trousers":"Leg coverage essential","Light Jacket":"Mild cool breeze","Long-Sleeve Shirt":"Comfortable coverage","Chinos / Jeans":"Relaxed fit for mild weather","Sneakers":"All-day comfort","T-Shirt / Polo":"Perfect warm weather top","Shorts / Skirt":"Stay cool & comfortable","Sneakers / Flats":"Breathable footwear","Lightweight T-Shirt":"Stay cool in the heat","Shorts / Summer Dress":"Maximum breathability","Sandals":"Open footwear for hot days","Sunhat / Cap":"Sun protection essential","Waterproof Jacket":"Rain protection","Umbrella":"Stay dry on the go","Waterproof Boots":"Keep feet dry","Snow Boots":"Grip & waterproofing","Sunglasses":"UV eye protection","Sunscreen":"Protect skin from UV","Windbreaker":"Shield from wind",
};

const DEMO = {
  manila: { w:{city:"Manila",country:"PH",temp:33,feelsLike:38,humidity:82,windSpeed:14,condition:"Clear",description:"sunny and hot",emoji:"☀️"}, recs:["Lightweight T-Shirt","Shorts / Summer Dress","Sandals","Sunhat / Cap","Sunglasses","Sunscreen"], tips:["Stay hydrated and wear SPF clothing.","High humidity — choose moisture-wicking fabrics."] },
  london: { w:{city:"London",country:"GB",temp:9,feelsLike:6,humidity:74,windSpeed:22,condition:"Rain",description:"light rain",emoji:"🌧️"}, recs:["Winter Jacket","Sweater","Jeans / Trousers","Waterproof Jacket","Umbrella","Waterproof Boots","Windbreaker"], tips:["Wear layers you can remove indoors.","Rain expected — waterproof gear is a must!"] },
  tokyo: { w:{city:"Tokyo",country:"JP",temp:18,feelsLike:17,humidity:55,windSpeed:8,condition:"Clear",description:"clear sky",emoji:"🌤️"}, recs:["Light Jacket","Long-Sleeve Shirt","Chinos / Jeans","Sneakers","Sunglasses","Sunscreen"], tips:["A light layer is all you need.","Don't forget SPF today!"] },
  sydney: { w:{city:"Sydney",country:"AU",temp:26,feelsLike:27,humidity:65,windSpeed:12,condition:"Clear",description:"sunny",emoji:"☀️"}, recs:["T-Shirt / Polo","Shorts / Skirt","Sneakers / Flats","Sunglasses","Sunscreen","Sunhat / Cap"], tips:["Great weather for light, breathable fabrics!"] },
  "new york": { w:{city:"New York",country:"US",temp:-3,feelsLike:-9,humidity:45,windSpeed:18,condition:"Snow",description:"light snow",emoji:"❄️"}, recs:["Heavy Winter Coat","Thermal Underlayer","Warm Boots","Gloves & Scarf","Beanie / Winter Hat"], tips:["Layer up! Real-feel is below freezing.","Snow on the ground — watch your step!"] },
};

const getDemo = city => {
  const d = DEMO[city.toLowerCase().trim()] || DEMO.london;
  return { weather:d.w, recommendations:d.recs.map(item=>({ item, image:CLOTHING_IMAGES[item]||null, reason:REASONS[item]||"Recommended today" })), tips:d.tips };
};

const getTheme = (cond="", temp=20) => {
  const c = cond.toLowerCase();
  if(c.includes("snow")) return {grad:"linear-gradient(150deg,#1a2744 0%,#0d1b30 50%,#1e2d50 100%)",accent:"#bfdbfe",glow:"#60a5fa",card:"rgba(30,60,110,0.35)",label:"Snowy"};
  if(c.includes("rain")||c.includes("drizzle")) return {grad:"linear-gradient(150deg,#1a2030 0%,#0d1520 50%,#182535 100%)",accent:"#7dd3fc",glow:"#0ea5e9",card:"rgba(14,50,80,0.35)",label:"Rainy"};
  if(c.includes("cloud")) return {grad:"linear-gradient(150deg,#1a2535 0%,#0e1825 50%,#182030 100%)",accent:"#93c5fd",glow:"#3b82f6",card:"rgba(20,45,80,0.35)",label:"Cloudy"};
  if(temp>30) return {grad:"linear-gradient(150deg,#2d1200 0%,#1a0a00 50%,#261000 100%)",accent:"#fbbf24",glow:"#f59e0b",card:"rgba(80,35,0,0.3)",label:"Hot & Sunny"};
  if(temp>22) return {grad:"linear-gradient(150deg,#0a1e35 0%,#061428 50%,#0c1c30 100%)",accent:"#fde68a",glow:"#fbbf24",card:"rgba(15,45,80,0.35)",label:"Warm & Clear"};
  return {grad:"linear-gradient(150deg,#0d1a2e 0%,#081020 50%,#0f1828 100%)",accent:"#a5b4fc",glow:"#818cf8",card:"rgba(20,35,70,0.35)",label:"Cool & Clear"};
};

function ClothingCard({item,image,reason,glow,accent,idx}){
  const [err,setErr]=useState(false);
  const [hov,setHov]=useState(false);
  return(
    <div onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{borderRadius:20,overflow:"hidden",background:"rgba(255,255,255,0.04)",border:`1px solid ${hov?glow+"55":"rgba(255,255,255,0.07)"}`,boxShadow:hov?`0 18px 40px ${glow}20`:"none",transform:hov?"translateY(-5px)":"translateY(0)",transition:"all .25s",animation:`slideUp .5s ${idx*50}ms ease both`,cursor:"default"}}>
      <div style={{height:140,overflow:"hidden",background:"rgba(0,0,0,0.35)",position:"relative"}}>
        {image&&!err
          ?<img src={image} alt={item} onError={()=>setErr(true)} style={{width:"100%",height:"100%",objectFit:"cover",opacity:.85,transform:hov?"scale(1.07)":"scale(1)",transition:"transform .4s"}}/>
          :<div style={{height:"100%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:42}}>👗</div>
        }
        <div style={{position:"absolute",bottom:0,left:0,right:0,height:50,background:"linear-gradient(to top,rgba(0,0,0,.65),transparent)"}}/>
      </div>
      <div style={{padding:"10px 13px 13px"}}>
        <p style={{color:"white",fontWeight:700,fontSize:"0.8rem",lineHeight:1.3}}>{item}</p>
        <p style={{color:"rgba(255,255,255,.38)",fontSize:"0.67rem",marginTop:3}}>{reason}</p>
      </div>
    </div>
  );
}

export default function App(){
  const [city,setCity]=useState("");
  const [result,setResult]=useState(null);
  const [loading,setLoading]=useState(false);

  const search=useCallback(async q=>{
    const query=(q||city).trim(); if(!query)return;
    setLoading(true); setResult(null);
    await new Promise(r=>setTimeout(r,750));
    setResult(getDemo(query)); setLoading(false);
  },[city]);

  const t = result ? getTheme(result.weather.condition, result.weather.temp) : getTheme();
  const SUGGESTIONS = ["Manila","London","Tokyo","New York","Sydney"];

  return(
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        @keyframes slideUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes blob{0%,100%{opacity:.25;transform:scale(1)}50%{opacity:.45;transform:scale(1.1)}}
        input::placeholder{color:rgba(255,255,255,.26)!important}
        input:focus{outline:none;border-color:rgba(255,255,255,.38)!important}
        .sug:hover{background:rgba(255,255,255,.14)!important;color:rgba(255,255,255,.9)!important}
      `}</style>

      <div style={{minHeight:"100vh",background:t.grad,transition:"background 1.1s ease",fontFamily:"'Plus Jakarta Sans',sans-serif",overflowX:"hidden",position:"relative"}}>

        {/* bg blobs */}
        <div style={{position:"fixed",top:"-15%",left:"-12%",width:520,height:520,borderRadius:"50%",background:`radial-gradient(circle,${t.glow}16,transparent 70%)`,animation:"blob 7s ease-in-out infinite",pointerEvents:"none",zIndex:0}}/>
        <div style={{position:"fixed",bottom:"-10%",right:"-8%",width:420,height:420,borderRadius:"50%",background:`radial-gradient(circle,${t.glow}10,transparent 70%)`,animation:"blob 7s 3s ease-in-out infinite",pointerEvents:"none",zIndex:0}}/>

        <div style={{maxWidth:860,margin:"0 auto",padding:"0 20px 80px",position:"relative",zIndex:1}}>

          {/* Header */}
          <header style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"22px 0 0",animation:"fadeIn .6s ease"}}>
            <div>
              <h1 style={{fontFamily:"'Sora',sans-serif",color:"white",fontSize:22,fontWeight:800,letterSpacing:"-.02em"}}>🌤️ WeatherWear</h1>
              <p style={{color:"rgba(255,255,255,.28)",fontSize:".58rem",textTransform:"uppercase",letterSpacing:".14em",marginTop:1}}>Clothing Advisor · Supabase Edition</p>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:8,padding:"7px 16px",borderRadius:99,background:"rgba(255,255,255,.06)",border:`1px solid ${t.glow}44`}}>
              <div style={{width:7,height:7,borderRadius:"50%",background:"#4ade80",boxShadow:"0 0 8px #4ade80"}}/>
              <span style={{color:"rgba(255,255,255,.55)",fontSize:".68rem",fontWeight:500}}>Supabase · Demo</span>
            </div>
          </header>

          {/* Hero */}
          <div style={{textAlign:"center",padding:"46px 0 38px",animation:"slideUp .6s ease"}}>
            <span style={{display:"inline-block",padding:"5px 16px",borderRadius:99,background:`${t.glow}20`,border:`1px solid ${t.glow}40`,color:t.accent,fontSize:".68rem",fontWeight:600,textTransform:"uppercase",letterSpacing:".12em",marginBottom:18}}>
              Real-time weather · Smart outfit picks
            </span>
            <h2 style={{fontFamily:"'Sora',sans-serif",color:"white",fontSize:"clamp(2rem,5.5vw,3.4rem)",fontWeight:800,lineHeight:1.08,letterSpacing:"-.03em",marginBottom:10}}>
              What should I wear<br/><span style={{color:t.accent}}>today?</span>
            </h2>
            <p style={{color:"rgba(255,255,255,.35)",fontSize:".88rem"}}>Enter your city and get outfit recommendations based on current weather</p>
          </div>

          {/* Search */}
          <div style={{maxWidth:540,margin:"0 auto 36px",animation:"slideUp .6s .1s ease both"}}>
            <div style={{display:"flex",gap:10}}>
              <div style={{position:"relative",flex:1}}>
                <span style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",fontSize:16,pointerEvents:"none"}}>🔍</span>
                <input value={city} onChange={e=>setCity(e.target.value)} onKeyDown={e=>e.key==="Enter"&&search()}
                  placeholder="Enter a city name…"
                  style={{width:"100%",paddingLeft:42,paddingRight:14,paddingTop:15,paddingBottom:15,borderRadius:16,background:"rgba(255,255,255,.07)",border:"1px solid rgba(255,255,255,.13)",color:"white",fontSize:".9rem",backdropFilter:"blur(12px)",fontFamily:"inherit"}}/>
              </div>
              <button onClick={()=>search()} disabled={loading||!city.trim()}
                style={{padding:"15px 24px",borderRadius:16,background:`linear-gradient(135deg,${t.accent}cc,${t.glow})`,color:"#060d1a",fontWeight:700,fontSize:".85rem",border:"none",cursor:"pointer",opacity:(loading||!city.trim())?.45:1,transition:"all .2s",flexShrink:0,fontFamily:"inherit"}}>
                {loading?"…":"Search"}
              </button>
            </div>
            <div style={{display:"flex",flexWrap:"wrap",gap:7,marginTop:12,justifyContent:"center"}}>
              {SUGGESTIONS.map(s=>(
                <button key={s} className="sug" onClick={()=>{setCity(s);search(s);}}
                  style={{padding:"6px 14px",borderRadius:99,background:"rgba(255,255,255,.06)",border:"1px solid rgba(255,255,255,.1)",color:"rgba(255,255,255,.48)",fontSize:".72rem",cursor:"pointer",transition:"all .2s",fontFamily:"inherit"}}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Loader */}
          {loading&&(
            <div style={{textAlign:"center",padding:"70px 0"}}>
              <div style={{width:50,height:50,border:`2px solid ${t.glow}33`,borderTopColor:t.accent,borderRadius:"50%",animation:"spin .9s linear infinite",margin:"0 auto 14px"}}/>
              <p style={{color:"rgba(255,255,255,.38)",fontSize:".82rem"}}>Checking the skies…</p>
            </div>
          )}

          {/* Results */}
          {result&&!loading&&(
            <div style={{animation:"slideUp .5s ease"}}>

              {/* Weather card */}
              <div style={{background:t.card,backdropFilter:"blur(24px)",border:`1px solid ${t.glow}22`,borderRadius:28,padding:"24px 28px",marginBottom:28}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:16,marginBottom:22}}>
                  <div>
                    <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
                      <span style={{fontSize:32}}>{result.weather.emoji}</span>
                      <span style={{background:`${t.glow}22`,color:t.accent,padding:"4px 12px",borderRadius:99,fontSize:".62rem",fontWeight:700,textTransform:"uppercase",letterSpacing:".1em"}}>{t.label}</span>
                    </div>
                    <h3 style={{fontFamily:"'Sora',sans-serif",color:"white",fontSize:30,fontWeight:800,letterSpacing:"-.025em"}}>
                      {result.weather.city} <span style={{color:"rgba(255,255,255,.25)",fontWeight:300,fontSize:18}}>/ {result.weather.country}</span>
                    </h3>
                    <p style={{color:"rgba(255,255,255,.35)",textTransform:"capitalize",fontSize:".78rem",marginTop:4}}>{result.weather.description}</p>
                  </div>
                  <div style={{textAlign:"right"}}>
                    <p style={{fontFamily:"'Sora',sans-serif",color:t.accent,fontSize:"clamp(3.5rem,10vw,5.5rem)",fontWeight:900,lineHeight:1,letterSpacing:"-.04em"}}>{result.weather.temp}°</p>
                    <p style={{color:"rgba(255,255,255,.32)",fontSize:".72rem"}}>Feels like {result.weather.feelsLike}°C</p>
                  </div>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>
                  {[{l:"Humidity",v:`${result.weather.humidity}%`,i:"💧"},{l:"Wind",v:`${result.weather.windSpeed} km/h`,i:"🌬️"},{l:"Feels Like",v:`${result.weather.feelsLike}°C`,i:"🌡️"}].map(s=>(
                    <div key={s.l} style={{background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.07)",borderRadius:14,padding:"10px 8px",textAlign:"center"}}>
                      <span style={{fontSize:18}}>{s.i}</span>
                      <p style={{color:"white",fontWeight:700,fontSize:15,margin:"2px 0 1px"}}>{s.v}</p>
                      <p style={{color:"rgba(255,255,255,.3)",fontSize:".6rem",textTransform:"uppercase",letterSpacing:".08em"}}>{s.l}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Clothing section */}
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
                <h4 style={{fontFamily:"'Sora',sans-serif",color:"white",fontWeight:700,fontSize:"1rem"}}>
                  <span style={{color:t.accent}}>👗</span> Today's Outfit Picks
                </h4>
                <span style={{color:"rgba(255,255,255,.28)",fontSize:".7rem"}}>{result.recommendations.length} items recommended</span>
              </div>

              {/* Real clothing image grid */}
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(145px,1fr))",gap:12,marginBottom:24}}>
                {result.recommendations.map((r,i)=>(
                  <ClothingCard key={i} {...r} idx={i} glow={t.glow} accent={t.accent}/>
                ))}
              </div>

              {/* Tips card */}
              <div style={{background:t.card,backdropFilter:"blur(16px)",border:`1px solid ${t.glow}18`,borderRadius:22,padding:"20px 22px"}}>
                <h4 style={{fontFamily:"'Sora',sans-serif",color:"white",fontWeight:700,fontSize:".88rem",marginBottom:12}}>💡 Style Tips for Today</h4>
                <div style={{display:"flex",flexDirection:"column",gap:8}}>
                  {result.tips.map((tip,i)=>(
                    <div key={i} style={{display:"flex",alignItems:"flex-start",gap:8,padding:"9px 14px",background:"rgba(255,255,255,.04)",borderRadius:12}}>
                      <span style={{color:t.accent,fontSize:13,flexShrink:0,marginTop:1}}>→</span>
                      <span style={{color:"rgba(255,255,255,.62)",fontSize:".81rem",lineHeight:1.5}}>{tip}</span>
                    </div>
                  ))}
                </div>
                <div style={{marginTop:14,padding:"10px 14px",background:`${t.glow}10`,border:`1px solid ${t.glow}22`,borderRadius:12}}>
                  <p style={{color:t.accent,fontSize:".68rem",fontWeight:700}}>🗄️ Supabase Integration</p>
                  <p style={{color:"rgba(255,255,255,.32)",fontSize:".66rem",marginTop:2}}>Auth & search history stored in Supabase. Run backend + add your credentials to go live.</p>
                </div>
              </div>
            </div>
          )}

          {/* Empty state */}
          {!result&&!loading&&(
            <div style={{textAlign:"center",padding:"55px 0",animation:"fadeIn .8s .3s ease both"}}>
              <div style={{fontSize:64,marginBottom:14}}>👔</div>
              <p style={{fontFamily:"'Sora',sans-serif",color:"white",fontWeight:700,fontSize:20,marginBottom:6}}>Ready when you are</p>
              <p style={{color:"rgba(255,255,255,.28)",fontSize:".84rem"}}>Try Manila · London · Tokyo · New York · Sydney</p>
            </div>
          )}

        </div>
      </div>
    </>
  );
}
