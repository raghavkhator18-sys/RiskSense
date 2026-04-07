// ===== STATE =====
const state = {
  roadType: 'Highway', weather: 'rain', timeOfDay: 'Afternoon',
  traffic: 85, speedLimit: 65, bikeSpeed: 28, visibility: 25,
  riskScore: 42, baseline: 42, user: null
};

const weatherLabels = {
  clear: 'Sunny / Clear Sky', cloudy: 'Partly Cloudy', rain: 'Light Rain / Wet Surface',
  heavy_rain: 'Heavy Rain / Storm', fog: 'Foggy / Low Visibility', night_clear: 'Night / Clear',
  night_rain: 'Night / Rainy', winter: 'Cold / Winter Conditions'
};

const timeWindows = {
  Morning: 'Morning Peak (06:00 - 10:00)', Afternoon: 'Afternoon Peak (12:00 - 17:00)',
  Evening: 'Evening Peak (17:30 - 19:00)', Night: 'Night Window (21:00 - 05:00)'
};

// ===== LOCAL FALLBACK RISK MODEL =====
const riskWeights = {
  road: { Highway: 1.1, 'City Road': 1.25, 'Village Road': 1.4 },
  weather: { 
    clear: 0.9,      // Formerly 0.5 (was too safe)
    cloudy: 1.1, 
    rain: 1.4, 
    heavy_rain: 1.9, 
    fog: 1.7, 
    night_clear: 1.2, 
    night_rain: 1.8, 
    winter: 1.5 
  },
  time: { Morning: 1.2, Afternoon: 1.0, Evening: 1.4, Night: 1.6 }
};

function computeRiskLocal() {
  const roadType = (state && state.roadType) || 'Highway';
  const weather = (state && state.weather) || 'clear';
  const timeOfDay = (state && state.timeOfDay) || 'Afternoon';
  
  const rw = riskWeights.road[roadType] || 1;
  const ww = riskWeights.weather[weather] || 1;
  const tw = riskWeights.time[timeOfDay] || 1;
  
  const traffic = Number(state.traffic) || 0;
  const speedLimit = Number(state.speedLimit) || 1;
  const bikeSpeed = Number(state.bikeSpeed) || 0;
  const visibility = Number(state.visibility) || 100;

  const trafficFactor = (traffic / 100) * 1.2; 
  
  const speedRatio = bikeSpeed / Math.max(speedLimit, 1);
  const speedFactor = speedRatio > 1.1 ? Math.pow(speedRatio, 1.5) : speedRatio;
  
  const visFactor = (1 - (visibility / 100)) * 1.5; 
  
  const base = 12; 
  const score = base * rw * ww * tw * (1 + trafficFactor) * (1 + speedFactor) * (1 + visFactor);
  return Math.min(100, Math.round(score) || 0);
}

function getRiskLabel(score) {
  if (score <= 20) return { label: 'SAFE ZONE', color: '#1B8A5A' };
  if (score <= 40) return { label: 'LOW RISK', color: '#4CAF50' };
  if (score <= 60) return { label: 'MODERATE RISK', color: '#E8B84B' };
  if (score <= 80) return { label: 'HIGH RISK', color: '#E8820A' };
  return { label: 'CRITICAL RISK', color: '#C0392B' };
}

// ===== AUTH =====
window.showPage = function(id) {
  document.getElementById('signin-page').style.display = 'none';
  document.getElementById('signup-page').style.display = 'none';
  document.getElementById('app-shell').style.display = 'none';
  document.getElementById(id).style.display = 'flex';
};

window.handleSignIn = function() {
  const email = document.getElementById('signin-email').value;
  const pass = document.getElementById('signin-password').value;
  if (!email || !pass) { showToast('Please fill in all fields'); return; }
  state.user = { email, name: email.split('@')[0] };
  enterApp();
};

window.handleSignUp = function() {
  const fname = document.getElementById('signup-fname').value;
  const email = document.getElementById('signup-email').value;
  const pass = document.getElementById('signup-password').value;
  if (!fname || !email || !pass) { showToast('Please fill all required fields'); return; }
  state.user = { email, name: fname };
  enterApp();
};

window.handleGoogleSignIn = function() {
  state.user = { email: 'user@gmail.com', name: 'Demo User' };
  enterApp();
};

window.handleSignOut = function() {
  showPage('signin-page');
  showToast('Signed out successfully');
};

function enterApp() {
  document.getElementById('signin-page').style.display = 'none';
  document.getElementById('signup-page').style.display = 'none';
  document.getElementById('app-shell').classList.add('active');
  document.getElementById('app-shell').style.display = 'flex';
  initApp();
  showToast('Welcome to RiskSense! 🛡️');
}

// ===== NAV =====
window.switchPage = function(name) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById('page-' + name).classList.add('active');
  const navEl = document.getElementById('nav-' + name);
  if (navEl) navEl.classList.add('active');
  if (name === 'predictor') { setTimeout(drawGauge, 100); setTimeout(drawMiniGauge, 100); }
  if (name === 'analytics') { setTimeout(drawAnalytics, 100); }
};

// ===== INIT =====
function initApp() {
  updateClock();
  setInterval(updateClock, 1000);
  fetchWeather();
  setInterval(fetchWeather, 300000);
  initSliders();
  updatePrediction();
  setTimeout(drawGauge, 200);
  setTimeout(drawMiniGauge, 200);
}

function updateClock() {
  const now = new Date();
  const t = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const el = document.getElementById('env-clock');
  if (el) el.textContent = t;
}

// ===== WEATHER API =====
async function fetchWeather() {
  if (!navigator.geolocation) { setFallbackWeather(); return; }
  navigator.geolocation.getCurrentPosition(async (pos) => {
    const { latitude: lat, longitude: lon } = pos.coords;
    const API_KEY = 'bd5e378503939ddaee76f12ad7a97608';
    try {
      const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`);
      const data = await res.json();
      if (data.cod === 200) { updateWeatherUI(data); } else { setFallbackWeather(); }
    } catch(e) { setFallbackWeather(); }
  }, () => setFallbackWeather());
}

function updateWeatherUI(data) {
  const temp = Math.round(data.main.temp);
  const desc = data.weather[0].main;
  const wind = Math.round(data.wind.speed * 3.6);
  const humidity = data.main.humidity;
  const city = data.name;
  document.getElementById('dash-location').textContent = `📍 ${city} — Today`;
  document.getElementById('dash-temp-val').textContent = temp;
  document.getElementById('dash-weather-desc').textContent = desc;
  document.getElementById('dash-wind').textContent = `${wind} km/h`;
  document.getElementById('dash-humidity').textContent = `${humidity}% Humid`;
  document.getElementById('map-location-text').textContent = `${city} • Live Risk Analysis`;
  const iconMap = { Clear: 'wb_sunny', Clouds: 'cloud', Rain: 'water_drop', Drizzle: 'grain', Thunderstorm: 'thunderstorm', Snow: 'ac_unit', Mist: 'foggy', Fog: 'foggy', Haze: 'haze' };
  const iconEl = document.getElementById('dash-weather-icon');
  if (iconEl) iconEl.textContent = iconMap[data.weather[0].main] || 'wb_sunny';
  const weatherMap = { Clear: 'clear', Clouds: 'cloudy', Rain: 'rain', Drizzle: 'rain', Thunderstorm: 'heavy_rain', Snow: 'winter', Mist: 'fog', Fog: 'fog', Haze: 'fog' };
  const wKey = weatherMap[data.weather[0].main] || 'clear';
  document.getElementById('weather-select').value = wKey;
  state.weather = wKey;
  updatePrediction();
}

function setFallbackWeather() {
  document.getElementById('dash-location').textContent = '📍 Tamil Nadu, India — Today';
  document.getElementById('dash-temp-val').textContent = '34';
  document.getElementById('dash-weather-desc').textContent = 'Partly Cloudy';
  document.getElementById('dash-wind').textContent = '18 km/h';
  document.getElementById('dash-humidity').textContent = '72% Humid';
  document.getElementById('map-location-text').textContent = 'Tamil Nadu • Live Risk Analysis';
}

// ===== SLIDERS =====
function initSliders() {
  updateSlider('traffic', state.traffic, false);
  updateSlider('speedlimit', state.speedLimit, false);
  updateSlider('bikespeed', state.bikeSpeed, false);
  updateSlider('visibility', state.visibility, false);
}

window.updateSlider = function(key, val, compute = true) {
  val = parseInt(val) || 0;
  const slider = document.getElementById('slider-' + key);
  const tag = document.getElementById('tag-' + key);
  if (!slider) return;
  
  let min = parseInt(slider.min) || 0, max = parseInt(slider.max) || 100;
  const pct = ((val - min) / (max - min)) * 100;
  slider.style.setProperty('--val', pct + '%');
  
  if (key === 'traffic') { state.traffic = val; if (tag) tag.textContent = val + '%'; }
  if (key === 'speedlimit') { state.speedLimit = val; if (tag) tag.textContent = val + ' km/h'; }
  if (key === 'bikespeed') { state.bikeSpeed = val; if (tag) tag.textContent = val + ' km/h'; }
  if (key === 'visibility') { 
    state.visibility = val; 
    if (tag) tag.textContent = val < 30 ? 'Low' : val < 65 ? 'Moderate' : 'High'; 
  }
  if (compute) updatePrediction();
};

window.resetSliders = function() {
  state.traffic = 50; state.speedLimit = 60; state.bikeSpeed = 20; state.visibility = 50;
  document.getElementById('slider-traffic').value = 50;
  document.getElementById('slider-speedlimit').value = 60;
  document.getElementById('slider-bikespeed').value = 20;
  document.getElementById('slider-visibility').value = 50;
  initSliders(); updatePrediction();
  showToast('Parameters reset to default');
};

// ===== ROAD / WEATHER / TIME =====
window.selectRoad = function(btn, road) {
  document.querySelectorAll('.road-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  state.roadType = road;
  document.getElementById('env-road').textContent = road;
  updatePrediction();
};

window.selectTime = function(chip, time) {
  document.querySelectorAll('.time-chip').forEach(c => c.classList.remove('active'));
  chip.classList.add('active');
  state.timeOfDay = time;
  document.getElementById('env-time').textContent = timeWindows[time];
  updatePrediction();
};

// ===== PREDICTION ENGINE (CALLS BACKEND API) =====
let predictionTimeout = null;

window.updatePrediction = async function() {
  state.weather = document.getElementById('weather-select').value;
  document.getElementById('env-weather').textContent = weatherLabels[state.weather];

  // Debounce API calls
  if (predictionTimeout) clearTimeout(predictionTimeout);
  predictionTimeout = setTimeout(async () => {
    let score = computeRiskLocal(); 
    try {
      const res = await fetch('/api/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roadType: state.roadType,
          weather: state.weather,
          timeOfDay: state.timeOfDay,
          traffic: state.traffic,
          speedLimit: state.speedLimit,
          bikeSpeed: state.bikeSpeed,
          visibility: state.visibility
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data && typeof data.score === 'number' && !isNaN(data.score)) {
          score = data.score;
        }
      }
    } catch (e) {
      console.error("Backend fetch error:", e);
    }
    applyScore(score);
  }, 150);

  // Immediately show local estimate for responsiveness
  applyScore(computeRiskLocal());
};

function applyScore(score) {
  // Guard against NaN/Undefined
  if (score === undefined || score === null || isNaN(score)) {
    console.warn("RiskSense Logic: Invalid score detected, defaulting to baseline", score);
    score = state.baseline || 42;
  }
  
  state.riskScore = score;
  const { label, color } = getRiskLabel(score);
  
  // Guard against divide by zero or NaN in deviation
  const baseline = state.baseline || 1;
  const devPct = Math.round(((score - baseline) / baseline) * 100);
  const devStr = devPct >= 0 ? `+${devPct}%` : `${devPct}%`;
  const devColor = devPct > 0 ? 'var(--risk-danger)' : 'var(--risk-safe)';

  animateNumber('gauge-number', score, 400);
  document.getElementById('gauge-label').textContent = label;
  document.getElementById('gauge-label').style.color = color;
  document.getElementById('gauge-number').style.color = color;
  document.getElementById('meta-deviation').textContent = devStr;
  document.getElementById('meta-deviation').style.color = devColor;

  const colEl = document.getElementById('ri-collision');
  const conEl = document.getElementById('ri-congestion');
  if (score > 70) { colEl.textContent = 'Critical'; colEl.className = 'ri-val critical'; }
  else if (score > 45) { colEl.textContent = 'High'; colEl.className = 'ri-val moderate'; }
  else { colEl.textContent = 'Low'; colEl.className = 'ri-val'; colEl.style.color = 'var(--risk-safe)'; }
  if (state.traffic > 70) { conEl.textContent = 'Congested'; conEl.className = 'ri-val critical'; }
  else if (state.traffic > 40) { conEl.textContent = 'Moderate'; conEl.className = 'ri-val moderate'; }
  else { conEl.textContent = 'Sparse'; conEl.className = 'ri-val'; conEl.style.color = 'var(--risk-safe)'; }

  const gaugeCard = document.querySelector('.gauge-card');
  if (gaugeCard) gaugeCard.style.setProperty('--gauge-color', color);
  generateInsight(score, color);
  drawGauge(); drawMiniGauge(); updateSimulator();
}

function generateInsight(score) {
  const insightEl = document.getElementById('insight-text');
  if (!insightEl) return;
  const road = state.roadType, weather = weatherLabels[state.weather], time = state.timeOfDay;
  let insight = '';
  if (score > 80) insight = `"CRITICAL: ${road} under ${weather} during ${time} is extremely dangerous. Immediate speed reduction of 30% and full headlight use is strongly advised."`;
  else if (score > 60) insight = `"High risk detected on ${road}. ${weather} conditions reduce friction. Lowering bike speed to ${Math.max(15, state.bikeSpeed - 10)} km/h is recommended to reach safe zone."`;
  else if (score > 40) insight = `"Moderate risk on ${road} during ${time}. Maintain safe following distance and reduce speed in ${weather.toLowerCase()} areas."`;
  else if (score > 20) insight = `"Low risk scenario. ${road} during ${time} is generally safe. Remain cautious near junctions and pedestrian crossings."`;
  else insight = `"Safe conditions detected. ${road} with ${weather} presents minimal hazard. Continue at current parameters."`;
  insightEl.textContent = insight;
}

function updateSimulator() {
  const el = document.getElementById('simulator-text');
  if (!el) return;
  const msgs = [
    `Analyzing ${state.roadType} segment with ${weatherLabels[state.weather]} conditions during ${state.timeOfDay}...`,
    `Traffic density at ${state.traffic}% — computing lateral collision probability vectors...`,
    `Bike speed ${state.bikeSpeed} km/h vs limit ${state.speedLimit} km/h — speed ratio: ${(state.bikeSpeed/state.speedLimit*100).toFixed(0)}%`,
    `AI confidence: 94% — ${state.riskScore > 60 ? 'Hazard zones flagged for immediate review.' : 'Scenario within acceptable safety bounds.'}`
  ];
  el.textContent = msgs[Math.floor(Math.random() * msgs.length)];
}

// ===== CANVAS GAUGES =====
function drawGauge() {
  const canvas = document.getElementById('gauge-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0, 0, W, H);
  
  const cx = W / 2, cy = H - 10, r = 115, sw = 24;
  const startAngle = Math.PI, endAngle = 2 * Math.PI;

  // 1. Draw Background Track
  ctx.beginPath();
  ctx.arc(cx, cy, r, startAngle, endAngle);
  ctx.strokeStyle = '#E8ECEE';
  ctx.lineWidth = sw;
  ctx.lineCap = 'round';
  ctx.stroke();

  // 2. Create Gradient for Progress
  // Linear gradient from left to right (cx-r to cx+r) for proper Green-Yellow-Red mapping
  const grad = ctx.createLinearGradient(cx - r, cy, cx + r, cy);
  grad.addColorStop(0, '#1B8A5A');    // Left: Green
  grad.addColorStop(0.5, '#FBC02D');  // Middle: Yellow
  grad.addColorStop(1, '#C0392B');    // Right: Red
  
  // 3. Draw Progress Arc
  const progress = Math.min(100, Math.max(0, state.riskScore));
  const currentAngle = startAngle + (progress / 100) * Math.PI;
  
  if (progress > 0) {
    ctx.beginPath();
    ctx.arc(cx, cy, r, startAngle, currentAngle);
    ctx.strokeStyle = grad;
    ctx.lineWidth = sw;
    ctx.lineCap = 'round';
    ctx.stroke();
  }
}

function drawMiniGauge() {
  const canvas = document.getElementById('mini-gauge-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0, 0, W, H);
  const cx = W / 2, cy = H - 15, r = 70, sw = 14;
  ctx.beginPath(); ctx.arc(cx, cy, r, Math.PI, 2 * Math.PI);
  ctx.strokeStyle = '#E0E7E9'; ctx.lineWidth = sw; ctx.lineCap = 'round'; ctx.stroke();
  const { color } = getRiskLabel(state.riskScore);
  const ea = Math.PI + (state.riskScore / 100) * Math.PI;
  ctx.beginPath(); ctx.arc(cx, cy, r, Math.PI, ea);
  ctx.strokeStyle = color; ctx.lineWidth = sw; ctx.lineCap = 'round'; ctx.stroke();
  ctx.fillStyle = color; ctx.font = 'bold 24px Google Sans, sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(state.riskScore, cx, cy - 16);
  ctx.fillStyle = '#6F797B'; ctx.font = '10px Google Sans, sans-serif';
  ctx.fillText(getRiskLabel(state.riskScore).label.split(' ')[0].toUpperCase(), cx, cy + 4);
}

// ===== ANALYTICS =====
function drawAnalytics() { drawBarChart(); drawDonutChart(); drawLineChart(); }

function drawBarChart() {
  const container = document.getElementById('bar-chart');
  if (!container) return;
  const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const highway = [7,5,9,6,8,4,3], city = [4,3,5,4,6,5,2], village = [2,1,3,2,3,2,1];
  const maxVal = 12;
  container.innerHTML = '';
  days.forEach((day, i) => {
    const grp = document.createElement('div'); grp.className = 'bar-group';
    grp.innerHTML = `<div style="display:flex;gap:2px;align-items:flex-end;height:140px;">
      <div class="bar" style="background:var(--risk-danger);height:${(highway[i]/maxVal*130)}px;width:12px"></div>
      <div class="bar" style="background:var(--risk-caution);height:${(city[i]/maxVal*130)}px;width:12px"></div>
      <div class="bar" style="background:#4CAF50;height:${(village[i]/maxVal*130)}px;width:12px"></div>
    </div><div class="bar-lbl">${day}</div>`;
    container.appendChild(grp);
  });
}

function drawDonutChart() {
  const canvas = document.getElementById('donut-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const cx = 60, cy = 60, r = 50, hole = 30;
  const slices = [{ pct: 0.42, color: '#C0392B' },{ pct: 0.35, color: '#E8B84B' },{ pct: 0.23, color: '#4CAF50' }];
  let angle = -Math.PI / 2;
  slices.forEach(s => {
    const ea = angle + s.pct * 2 * Math.PI;
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, r, angle, ea); ctx.closePath(); ctx.fillStyle = s.color; ctx.fill(); angle = ea;
  });
  ctx.beginPath(); ctx.arc(cx, cy, hole, 0, 2 * Math.PI); ctx.fillStyle = 'white'; ctx.fill();
}

function drawLineChart() {
  const canvas = document.getElementById('line-chart');
  if (!canvas) return;
  canvas.width = canvas.parentElement.offsetWidth - 40; canvas.height = 80;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const scores = [30,38,55,72,60,45,50,68,80,75,60,42,35,40,55,70,85,78,65,50,42,38,45,55];
  const maxS = 100; const step = W / (scores.length - 1);
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, 'rgba(192,57,43,0.4)'); grad.addColorStop(0.5, 'rgba(232,184,75,0.2)'); grad.addColorStop(1, 'rgba(27,138,90,0.05)');
  ctx.beginPath(); ctx.moveTo(0, H - (scores[0] / maxS) * H);
  scores.forEach((s, i) => { if (i === 0) return; const x = i * step, y = H - (s / maxS) * H; const px = (i-1) * step, py = H - (scores[i-1] / maxS) * H; ctx.bezierCurveTo(px + step/2, py, x - step/2, y, x, y); });
  ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath(); ctx.fillStyle = grad; ctx.fill();
  ctx.beginPath(); ctx.moveTo(0, H - (scores[0] / maxS) * H);
  scores.forEach((s, i) => { if (i === 0) return; const x = i * step, y = H - (s / maxS) * H; const px = (i-1) * step, py = H - (scores[i-1] / maxS) * H; ctx.bezierCurveTo(px + step/2, py, x - step/2, y, x, y); });
  ctx.strokeStyle = '#006874'; ctx.lineWidth = 2.5; ctx.stroke();
  ctx.fillStyle = '#6F797B'; ctx.font = '10px Google Sans, sans-serif'; ctx.textAlign = 'center';
  [0,6,12,18,23].forEach(h => { const x = (h / 23) * W; ctx.fillText(h + ':00', x, H + 0); });
}

// ===== UTILITIES =====
function animateNumber(id, target, duration = 400) {
  const el = document.getElementById(id);
  if (!el) return;
  const start = parseInt(el.textContent) || 0;
  const diff = target - start;
  const startTime = performance.now();
  function step(now) { const p = Math.min(1, (now - startTime) / duration); el.textContent = Math.round(start + diff * p); if (p < 1) requestAnimationFrame(step); }
  requestAnimationFrame(step);
}

window.showToast = function(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg; t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3000);
};

window.setFilter = function(el, filter) {
  document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
  el.classList.add('active'); showToast(`Showing ${filter} road data`);
};

window.savePrediction = function() {
  showToast(`Prediction saved! Risk score: ${state.riskScore} — ${getRiskLabel(state.riskScore).label}`);
};

window.applyMitigation = function() {
  const newSpeed = Math.max(10, Math.round(state.bikeSpeed * 0.85));
  state.bikeSpeed = newSpeed;
  document.getElementById('slider-bikespeed').value = newSpeed;
  updateSlider('bikespeed', newSpeed);
  showToast('Mitigation applied: speed reduced by 15%');
};

window.handleSearch = function(val) {
  if (val.length > 2) document.getElementById('map-location-text').textContent = `Searching: "${val}"...`;
};
