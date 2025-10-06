
import React, { useEffect, useMemo, useState } from "react";
import { Button } from "./button.jsx";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./card.jsx";
import { Input } from "./input.jsx";
import { Textarea } from "./textarea.jsx";
import { Badge } from "./badge.jsx";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs.jsx";
import { Switch } from "./switch.jsx";
import { Label } from "./label.jsx";
import { Bird, Eye, EyeOff, Globe as Globe2, Lock, MapPin, Thermometer, Trash2, CalendarDays, Plus, Target } from "lucide-react";

const LS = {
  INCOGNITO: "mt_incognito_mode",
  HUNTS: "mt_hunts",
  SEASON: "mt_season",
};

function load(k, fb){ try{ const v = localStorage.getItem(k); return v? JSON.parse(v): fb }catch{ return fb } }
function save(k, v){ try{ localStorage.setItem(k, JSON.stringify(v)) }catch{} }

const FLYWAYS = ["Pacific", "Central", "Mississippi", "Atlantic"];
const STATES = ["AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY"];
const SPECIES_OPTIONS = ["Mallard","Gadwall","Blue-winged Teal","Green-winged Teal","Wood Duck","Northern Pintail","American Wigeon","Northern Shoveler","Canvasback","Redhead","Snow Goose","Canada Goose"];

const W_DESC = {0:"Clear",1:"Mainly clear",2:"Partly cloudy",3:"Overcast",45:"Fog",48:"Rime fog",51:"Light drizzle",53:"Drizzle",55:"Heavy drizzle",61:"Light rain",63:"Rain",65:"Heavy rain",71:"Light snow",73:"Snow",75:"Heavy snow",80:"Rain showers",81:"Heavy showers",82:"Violent showers",95:"Thunderstorm",96:"T-storm hail",99:"Severe hail"};

const todayISO = () => new Date().toISOString().slice(0,10);

async function fetchWeatherString(){
  const coords = await new Promise((resolve,reject)=>{
    if(!navigator.geolocation) return reject(new Error("Geolocation not supported"));
    navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy:true, timeout: 12000 });
  }).catch(()=> null);
  if(!coords) return "";
  const lat = coords.coords.latitude.toFixed(4);
  const lon = coords.coords.longitude.toFixed(4);
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,wind_speed_10m,wind_direction_10m,relative_humidity_2m,weather_code`;
  try{
    const res = await fetch(url);
    if(!res.ok) throw new Error(String(res.status));
    const json = await res.json();
    const c = json.current || {};
    const temp = Math.round(c.temperature_2m);
    const wind = Math.round(c.wind_speed_10m);
    const dir = Math.round(c.wind_direction_10m);
    const rh = Math.round(c.relative_humidity_2m);
    const code = Number(c.weather_code);
    const sky = W_DESC[code] || "N/A";
    const dirs = ["N","NNE","NE","ENE","E","ESE","SE","SSE","S","SSW","SW","WSW","W","WNW","NW","NNW"];
    const compass = dirs[Math.round(dir / 22.5) % 16];
    return `${temp}°F, ${sky}, ${wind} mph ${compass}, RH ${rh}%`;
  }catch{
    return "";
  }
}

function daysInMonth(y,m){ return new Date(y, m+1, 0).getDate(); }
function monthLabel(y,m){ return new Date(y,m,1).toLocaleString(undefined,{month:'long', year:'numeric'}); }
function* monthsBetween(start, end){
  const d = new Date(start.getFullYear(), start.getMonth(), 1);
  while(d <= end){ yield new Date(d); d.setMonth(d.getMonth()+1); }
}
function toKey(date){ return date.toISOString().slice(0,10); }

export default function MainApp(){
  const [isIncognito, setIsIncognito] = useState(()=> load(LS.INCOGNITO, false));
  const [hunts, setHunts] = useState(()=> load(LS.HUNTS, []));
  const [weatherBusy, setWeatherBusy] = useState(false);
  const [weatherError, setWeatherError] = useState(null);
  const [season, setSeason] = useState(()=> load(LS.SEASON, { start: `${new Date().getFullYear()}-11-01`, end: `${new Date().getFullYear()+1}-01-31` }));

  useEffect(()=> save(LS.INCOGNITO, isIncognito), [isIncognito]);
  useEffect(()=> save(LS.HUNTS, hunts), [hunts]);
  useEffect(()=> save(LS.SEASON, season), [season]);

  const [selectedSpecies, setSelectedSpecies] = useState([]);
  const [speciesCountsDraft, setSpeciesCountsDraft] = useState({});

  function toggleSpecies(name){
    setSelectedSpecies(prev=> prev.includes(name) ? prev.filter(s=> s!==name) : [...prev, name]);
    setSpeciesCountsDraft(prev=> prev[name] ? prev : { ...prev, [name]: 1 });
  }
  function addCustomSpecies(name){ if(!name.trim()) return; if(selectedSpecies.includes(name)) return; toggleSpecies(name.trim()); }

  async function handleAutoWeather(inputEl){
    setWeatherBusy(true); setWeatherError(null);
    const s = await fetchWeatherString();
    setWeatherBusy(false);
    if(!s){ setWeatherError("Couldn’t fetch weather — enter manually."); return; }
    inputEl.value = s;
  }
  async function handleUseGPS(latEl, lngEl){
    if(!navigator.geolocation) return alert('Geolocation not supported');
    navigator.geolocation.getCurrentPosition(pos=>{
      latEl.value = String(pos.coords.latitude.toFixed(6));
      lngEl.value = String(pos.coords.longitude.toFixed(6));
    }, ()=> alert('Could not get location'));
  }

  function addHunt(form){
    const fd = new FormData(form);
    const legacySpecies = String(fd.get('species')||'');
    const legacyCount = Number(fd.get('count')||0);

    const selected = selectedSpecies;
    const sc = {};
    selected.forEach(s=>{ const v = Number((fd.get(`sc_${s}`)) || 0); if(v>0) sc[s]=v; });
    const speciesCounts = Object.keys(sc).length>0 ? sc : (legacySpecies? { [legacySpecies]: legacyCount||1 } : undefined);

    const entry = {
      id: crypto.randomUUID(),
      date: String(fd.get('date')||todayISO()),
      flyway: String(fd.get('flyway')||'Unknown'),
      state: String(fd.get('state')||'Unknown'),
      weather: String(fd.get('weather')||'N/A'),
      species: legacySpecies || undefined,
      count: legacyCount || undefined,
      speciesCounts,
      hunters: Number(fd.get('hunters')||1),
      notes: String(fd.get('notes')||''),
      visibility: String(fd.get('visibility')||'public'),
      lat: fd.get('lat') ? Number(fd.get('lat')) : undefined,
      lng: fd.get('lng') ? Number(fd.get('lng')) : undefined,
      spot: String(fd.get('spot')||'') || undefined,
    };
    setHunts(prev=> [entry, ...prev]);
    setSelectedSpecies([]); setSpeciesCountsDraft({});
    form.reset();
  }

  function removeHunt(id){ setHunts(prev=> prev.filter(h=> h.id!==id)); }

  const seasonStart = useMemo(()=> new Date(season.start+"T00:00:00"), [season.start]);
  const seasonEnd = useMemo(()=> new Date(season.end+"T00:00:00"), [season.end]);
  const huntsByDate = useMemo(()=>{
    const map = {};
    for(const h of hunts){
      const k = h.date;
      if(!map[k]) map[k] = { total:0, species:{} };
      const add = (name,n)=>{ map[k].species[name] = (map[k].species[name]||0)+n; map[k].total += n; };
      if(h.speciesCounts && Object.keys(h.speciesCounts).length){
        for(const [sp, n] of Object.entries(h.speciesCounts)) add(sp, Number(n)||0);
      }else{
        add(h.species||'Mixed', Number(h.count)||0);
      }
    }
    return map;
  }, [hunts]);

  function topSpeciesName(specMap){
    const entries = Object.entries(specMap);
    if(entries.length===0) return '';
    return entries.sort((a,b)=> b[1]-a[1])[0][0];
  }

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
          <Bird className="w-6 h-6"/>
          <div className="font-bold tracking-tight text-lg">Migration Tracker</div>
          <Badge>Incognito Mode</Badge>
          <div className="ml-auto flex items-center gap-3">
            <Label htmlFor="incognito">Incognito Mode</Label>
            <Switch id="incognito" checked={isIncognito} onCheckedChange={setIsIncognito}/>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 mt-6 mb-24">
        <Tabs defaultValue="hunts">
          <TabsList className="grid grid-cols-2 md:grid-cols-4">
            <TabsTrigger value="hunts">Hunt Log</TabsTrigger>
            <TabsTrigger value="season">Season Calendar</TabsTrigger>
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="about">About</TabsTrigger>
          </TabsList>

          <TabsContent value="hunts">
            <div className="grid md:grid-cols-2 gap-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Log a Hunt</CardTitle>
                  <CardDescription>Flyway, state, weather (auto), species counts, hunters, optional pin.</CardDescription>
                </CardHeader>
                <CardContent>
                  <form className="space-y-3" onSubmit={(e)=>{ e.preventDefault(); addHunt(e.currentTarget); }}>
                    <Input name="date" type="date" defaultValue={todayISO()} required/>

                    <div className="grid grid-cols-2 gap-2">
                      <select name="flyway" className="border rounded-md h-10 px-3" defaultValue="Mississippi" required>
                        {FLYWAYS.map(f=> <option key={f} value={f}>{f}</option>)}
                      </select>
                      <select name="state" className="border rounded-md h-10 px-3" defaultValue="AR" required>
                        {STATES.map(s=> <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>

                    <div className="flex gap-2 items-center">
                      <Input name="weather" placeholder="Weather (e.g., 42°F, overcast, 12 mph N)" id="weatherField"/>
                      <Button type="button" variant="secondary" onClick={()=>{
                        const el = document.getElementById('weatherField'); if(el) handleAutoWeather(el);
                      }} disabled={weatherBusy}>{weatherBusy? 'Fetching…':'Auto-fill'}</Button>
                    </div>
                    {weatherError && <div className="text-xs text-red-600">{weatherError}</div>}

                    <div>
                      <div className="text-sm mb-1">Species & counts</div>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {SPECIES_OPTIONS.map(opt=> (
                          <button type="button" key={opt} className={`px-2 py-1 rounded-full border text-sm ${selectedSpecies.includes(opt)?'bg-neutral-900 text-white':'bg-white'}`} onClick={()=> toggleSpecies(opt)}>{opt}</button>
                        ))}
                      </div>
                      <div className="flex gap-2 mb-2">
                        <Input id="customSpec" placeholder="Add custom species"/>
                        <Button type="button" variant="secondary" onClick={()=>{
                          const el = document.getElementById('customSpec'); addCustomSpecies(el.value); el.value='';
                        }}><Plus className="w-4 h-4 mr-1"/>Add</Button>
                      </div>
                      {selectedSpecies.length>0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {selectedSpecies.map(sp=> (
                            <div key={sp} className="flex items-center gap-2">
                              <Label className="w-32 truncate">{sp}</Label>
                              <Input name={`sc_${sp}`} type="number" min={0} step={1} defaultValue={speciesCountsDraft[sp]||1}/>
                            </div>
                          ))}
                        </div>
                      )}
                      {selectedSpecies.length===0 && (
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          <Input name="species" placeholder="Species (legacy)"/>
                          <Input name="count" type="number" min={0} step={1} placeholder="Total birds"/>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <Input name="hunters" type="number" min={1} step={1} defaultValue={1} placeholder="# of hunters"/>
                      <Input name="spot" placeholder="Spot name (optional)"/>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Input name="lat" id="lat" placeholder="Latitude (optional)"/>
                      <Input name="lng" id="lng" placeholder="Longitude (optional)"/>
                    </div>
                    <div>
                      <Button type="button" variant="secondary" onClick={()=>{
                        const latEl = document.getElementById('lat');
                        const lngEl = document.getElementById('lng');
                        if(latEl && lngEl) handleUseGPS(latEl, lngEl);
                      }}><Target className="w-4 h-4 mr-1"/>Use GPS</Button>
                    </div>

                    <div className="flex items-center gap-4">
                      <Label className="flex items-center gap-1 text-sm"><Globe2 className="w-4 h-4"/> Public</Label>
                      <input type="radio" name="visibility" value="public" defaultChecked/>
                      <Label className="flex items-center gap-1 text-sm ml-4"><Lock className="w-4 h-4"/> Incognito</Label>
                      <input type="radio" name="visibility" value="incognito"/>
                    </div>

                    <Textarea name="notes" rows={3} placeholder="Notes (spread, water, pressure, fronts)"/>

                    <Button type="submit" className="w-full">Save Hunt</Button>
                  </form>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex-row items-center justify-between">
                  <div>
                    <CardTitle>My Hunts</CardTitle>
                    <CardDescription>{hunts.length} logged</CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 max-h-[520px] overflow-auto pr-2">
                  {hunts.length===0 && <p className="text-sm text-neutral-600">No hunts logged yet.</p>}
                  {hunts.map(h=>{
                    const total = h.speciesCounts ? Object.values(h.speciesCounts).reduce((a,b)=> a+(b||0),0) : (h.count||0);
                    const specLine = h.speciesCounts ? Object.entries(h.speciesCounts).map(([k,v])=> `${k} ${v}`).join(', ') : `${h.species||'Mixed'} ${h.count||0}`;
                    return (
                      <div key={h.id} className="border rounded-xl p-3 bg-white">
                        <div className="flex justify-between items-center">
                          <div className="font-semibold">{h.date} — {h.state} • {h.flyway}</div>
                          <Badge className="flex items-center gap-1">{h.visibility==='public' ? <Eye className="w-3 h-3"/> : <EyeOff className="w-3 h-3"/>} {h.visibility}</Badge>
                        </div>
                        <div className="text-sm text-neutral-700 mt-1">
                          <span className="inline-flex items-center gap-1 mr-3"><Thermometer className="w-4 h-4"/>{h.weather}</span>
                          {h.spot && <span className="inline-flex items-center gap-1 mr-3"><MapPin className="w-4 h-4"/>{h.spot}</span>}
                          <span className="inline-flex items-center gap-1"><Bird className="w-4 h-4"/>{specLine} • Hunters: {h.hunters} • Total: {total}</span>
                        </div>
                        {h.notes && <p className="mt-1 text-sm text-neutral-600">{h.notes}</p>}
                        <Button variant="destructive" size="sm" className="mt-2" onClick={()=> removeHunt(h.id)}>Remove</Button>
                      </div>
                    )
                  })}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="season">
            <div className="mt-4 grid md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle><CalendarDays className="w-5 h-5 inline mr-2"/>Season Dates</CardTitle>
                  <CardDescription>Choose your duck season range.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">Start</Label>
                      <Input type="date" value={season.start} onChange={e=> setSeason(s=> ({...s, start: e.target.value}))}/>
                    </div>
                    <div>
                      <Label className="text-xs">End</Label>
                      <Input type="date" value={season.end} onChange={e=> setSeason(s=> ({...s, end: e.target.value}))}/>
                    </div>
                  </div>
                  <p className="text-xs text-neutral-600 mt-2">We’ll highlight days with hunts and show totals + top species.</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Calendar</CardTitle>
                  <CardDescription>{monthLabel(new Date(season.start).getFullYear(), new Date(season.start).getMonth())} — {monthLabel(new Date(season.end).getFullYear(), new Date(season.end).getMonth())}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {[...monthsBetween(new Date(season.start), new Date(season.end))].map((d)=>{
                      const y = d.getFullYear(), m = d.getMonth();
                      const first = new Date(y,m,1);
                      const startIdx = (first.getDay()+7)%7;
                      const dim = daysInMonth(y,m);
                      const cells = Array.from({length: startIdx + dim}, (_,i)=> i<startIdx? null : new Date(y,m,i-startIdx+1));
                      return (
                        <div key={`${y}-${m}`}>
                          <div className="font-semibold mb-2">{monthLabel(y,m)}</div>
                          <div className="grid grid-cols-7 gap-1 text-xs">
                            {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(dn=> <div key={dn} className="text-neutral-500 text-[11px] pb-1">{dn}</div>)}
                            {cells.map((cd, idx)=>{
                              if(!cd) return <div key={idx} className="h-20 border rounded-lg bg-neutral-50"/>;
                              const k = toKey(cd);
                              const agg = huntsByDate[k];
                              const top = agg? Object.entries(agg.species).sort((a,b)=> b[1]-a[1])[0][0] : '';
                              return (
                                <div key={k} className={`h-20 border rounded-lg p-1 ${agg? 'bg-green-50 border-green-200':'bg-white'}`}>
                                  <div className="text-[11px] text-neutral-600">{cd.getDate()}</div>
                                  {agg && (
                                    <div className="mt-1">
                                      <div className="font-semibold tabular-nums">{agg.total} birds</div>
                                      <div className="truncate text-neutral-700">{top}</div>
                                    </div>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="summary">
            <Card className="mt-4">
              <CardHeader>
                <CardTitle>Season Summary</CardTitle>
                <CardDescription>Local rollups from your logs.</CardDescription>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                {hunts.length===0 ? (
                  <p className="text-neutral-600">Log hunts to see stats.</p>
                ) : (
                  <div className="grid md:grid-cols-3 gap-3">
                    <div className="border rounded-xl p-3">
                      <div className="text-xs text-neutral-500">Total Birds</div>
                      <div className="text-2xl font-extrabold tabular-nums">{Object.values(huntsByDate).reduce((a,b)=> a + b.total, 0)}</div>
                    </div>
                    <div className="border rounded-xl p-3">
                      <div className="text-xs text-neutral-500">Hunts Logged</div>
                      <div className="text-2xl font-extrabold tabular-nums">{hunts.length}</div>
                    </div>
                    <div className="border rounded-xl p-3">
                      <div className="text-xs text-neutral-500">Top Species</div>
                      <div className="text-2xl font-extrabold">{(() => {
                        const tally = {};
                        for(const day of Object.values(huntsByDate)){
                          for(const [sp,n] of Object.entries(day.species)) tally[sp]=(tally[sp]||0)+n;
                        }
                        return Object.keys(tally).length? Object.entries(tally).sort((a,b)=> b[1]-a[1])[0][0] : '—';
                      })()}</div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="about">
            <Card className="mt-4">
              <CardHeader>
                <CardTitle>About Incognito Mode</CardTitle>
                <CardDescription>Your spots stay quiet; signals roll up to flyway/state bins only.</CardDescription>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                <ul className="list-disc pl-5">
                  <li>Incognito entries never share coordinates or identifiers.</li>
                  <li>Weather auto-fill uses browser geolocation + Open-Meteo.</li>
                  <li>Calendar shows daily totals and top species for your chosen season window.</li>
                </ul>
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>
      </main>

      <footer className="border-t py-6 text-center text-sm text-neutral-500">© {new Date().getFullYear()} Migration Tracker</footer>
    </div>
  )
}
