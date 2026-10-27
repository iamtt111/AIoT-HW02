const localUpload = window.upload;
const localAnalyse = window.analyseCustom;
let blobUrl;

async function populateFromBlob(url) {
  const response = await fetch('/api/preview-blob', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ blob_url: url }) });
  const data = await response.json();
  if (!response.ok) throw new Error(data.detail || 'Blob preview failed');
  document.getElementById('schema').textContent = `已從 Vercel Blob 載入 ${data.rows.toLocaleString()} 筆、${data.columns.length} 欄資料。`;
  document.getElementById('target').innerHTML = data.numeric_columns.map(value => `<option>${value}</option>`).join('');
  document.getElementById('config').classList.add('active');
}

window.upload = async function () {
  if (location.hostname === '127.0.0.1' || location.hostname === 'localhost') return localUpload();
  const file = document.getElementById('file').files[0];
  if (!file) return;
  if (file.size > 25 * 1024 * 1024) { document.getElementById('error').textContent = 'CSV exceeds the 25 MB limit.'; return; }
  try {
    document.getElementById('error').textContent = '正在直接上傳至 Vercel Blob…';
    const { upload } = await import('https://esm.sh/@vercel/blob@2.2.0/client');
    const blob = await upload(`custom-csv/${file.name}`, file, { access: 'public', handleUploadUrl: '/api/blob-upload' });
    blobUrl = blob.url;
    await populateFromBlob(blobUrl);
    document.getElementById('error').textContent = '';
  } catch (error) { document.getElementById('error').textContent = error.message || 'Blob upload failed.'; }
};

window.analyseCustom = async function () {
  if (!blobUrl) return localAnalyse();
  const response = await fetch('/api/analyse-blob', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ blob_url: blobUrl, target: document.getElementById('target').value }) });
  const data = await response.json();
  if (!response.ok) { document.getElementById('error').textContent = data.detail; return; }
  document.getElementById('customResult').className = '';
  document.getElementById('customResult').innerHTML = result(data);
};

const scenarioMap = {
  '舒適早晨': 'morning',
  '炎熱午後': 'afternoon',
  '潮濕夜晚': 'night',
};

function addInsight(analysis) {
  const entries = Object.entries(analysis.coefficients)
    .sort((left, right) => Math.abs(right[1]) - Math.abs(left[1]));
  if (!entries.length) return;
  const [topName, topValue] = entries[0];
  const topThree = entries.slice(0, 3).map(([name, value], index) =>
    `<li><b>#${index + 1} ${name}</b>：${value >= 0 ? '+' : ''}${value.toFixed(2)}<br><span>${FIELD_DESCRIPTIONS[name] || '數值特徵'}；增加 1 個標準差時，預測耗電呈${value >= 0 ? '上升' : '下降'}關聯。</span></li>`
  ).join('');
  const r2 = analysis.metrics.r2;
  const quality = r2 < .3
    ? 'R² 偏低，模型僅能解釋部分耗電變異；請將此結果視為可解釋的基準參考。'
    : '模型具有可用的解釋能力，但係數仍代表關聯而非因果。';
  const html = `<section id="model-insight" class="panel" style="margin-top:18px">
    <h2>模型結果解讀</h2>
    <div class="stats" style="grid-template-columns:1fr 1fr"><div class="stat"><span>影響幅度最大特徵</span><strong>${topName}</strong><small>${FIELD_DESCRIPTIONS[topName] || '數值特徵'}；標準化係數 ${topValue >= 0 ? '+' : ''}${topValue.toFixed(2)}</small></div><div class="stat"><span>解讀提醒</span><strong>${topValue >= 0 ? '正向關聯' : '負向關聯'}</strong><small>該特徵提高時，模型預測耗電傾向${topValue >= 0 ? '增加' : '減少'}</small></div></div>
    <h3>Top 3 選取特徵</h3><ol class="note">${topThree}</ol>
    <p class="note">${quality} RMSE 為 ${analysis.metrics.rmse} Wh，單次預測請同時閱讀 ± ${analysis.prediction_interval.plus_minus} Wh 的 95% 預測區間。</p>
  </section>`;
  document.getElementById('model-insight')?.remove();
  document.getElementById('dashboard').insertAdjacentHTML('afterend', html);
}

const FIELD_DESCRIPTIONS = {
  date: '觀測時間（每 10 分鐘一筆；用於理解時段，不直接作為原始特徵）',
  Appliances: '家電耗電量（Wh），本專案的預測目標',
  lights: '室內照明耗電量（Wh）',
  T1: '廚房溫度（°C）', RH_1: '廚房相對濕度（%）',
  T2: '客廳溫度（°C）', RH_2: '客廳相對濕度（%）',
  T3: '洗衣間溫度（°C）', RH_3: '洗衣間相對濕度（%）',
  T4: '辦公室溫度（°C）', RH_4: '辦公室相對濕度（%）',
  T5: '浴室溫度（°C）', RH_5: '浴室相對濕度（%）',
  T6: '建築北側室外溫度（°C）', RH_6: '建築北側室外相對濕度（%）',
  T7: '熨衣間溫度（°C）', RH_7: '熨衣間相對濕度（%）',
  T8: '青少年房間溫度（°C）', RH_8: '青少年房間相對濕度（%）',
  T9: '父母房間溫度（°C）', RH_9: '父母房間相對濕度（%）',
  T_out: '鄰近氣象站室外溫度（°C）', Press_mm_hg: '大氣壓力（mmHg）',
  RH_out: '鄰近氣象站室外相對濕度（%）', Windspeed: '風速（m/s）',
  Visibility: '能見度（km）', Tdewpoint: '露點溫度（°C）',
  rv1: '隨機測試變數；在分析前排除', rv2: '隨機測試變數；在分析前排除',
};

function addDatasetInfo(data) {
  document.getElementById('dataset-info')?.remove();
  const fields = data.columns.map(column => `<tr><td><b>${column.name}</b></td><td>${FIELD_DESCRIPTIONS[column.name] || '數值欄位'}</td></tr>`).join('');
  const info = `<section id="dataset-info" class="dataset-info">
    <h3>資料集資訊</h3>
    <dl>
      <div><dt>資料筆數</dt><dd>${data.rows.toLocaleString()} 筆</dd></div>
      <div><dt>時間範圍</dt><dd>${data.time_range.start} 至 ${data.time_range.end}</dd></div>
      <div><dt>取樣頻率</dt><dd>${data.time_range.frequency}</dd></div>
      <div><dt>可用特徵</dt><dd>${data.usable_features} 個數值感測／氣象特徵</dd></div>
      <div><dt>預測目標</dt><dd>${data.target} (${data.target_unit})</dd></div>
      <div><dt>缺失值</dt><dd>${data.missing_cells.toLocaleString()} 格</dd></div>
    </dl>
    <details><summary>查看全部欄位說明（${data.columns.length} 欄）</summary><div class="field-table-wrap"><table class="field-table"><thead><tr><th>欄位</th><th>意義</th></tr></thead><tbody>${fields}</tbody></table></div></details>
    <a href="${data.source_url}" target="_blank" rel="noreferrer">查看 Kaggle 資料來源 ↗</a>
  </section>`;
  document.querySelector('#energySide .source').insertAdjacentHTML('afterend', info);
}

function addGuides(analysis) {
  document.getElementById('metric-guide')?.remove();
  const guide = `<section id="metric-guide" class="panel guide-panel"><h2>評估指標與圖表判讀</h2>
    <div class="guide-grid"><article><b>MAE：${analysis.metrics.mae} Wh</b><ul><li>平均絕對誤差</li><li>每次預測平均相差約 ${analysis.metrics.mae} Wh</li><li>越低越好，且單位與耗電相同</li></ul></article><article><b>MSE：${analysis.metrics.mse}</b><ul><li>平方誤差的平均值。</li><li>少數很大的失誤會被放大</li><li>適合檢查模型是否常出現嚴重失準</li></ul></article><article><b>RMSE：${analysis.metrics.rmse} Wh</b><ul><li>典型預測誤差尺度</li><li>本次約為 ${analysis.metrics.rmse} Wh</li><li>應與預測區間一併判讀</li></ul></article><article><b>R²：${analysis.metrics.r2}</b><ul><li>解釋約 ${(analysis.metrics.r2 * 100).toFixed(1)}% 的耗電變異</li><li>目前屬可解釋基準模型</li><li>仍有特徵工程或模型改善空間</li></ul></article></div>
    <article class="chart-guide"><b>Actual vs. Predicted 怎麼看？</b><ul><li>每個藍點代表一筆未參與訓練的測試資料</li><li>橫軸為實際耗電，縱軸為模型預測耗電</li><li>點越接近斜對角線，預測越準；明顯偏離代表該筆誤差較大</li><li>橘色垂直線為部分測試點的 95% prediction interval，顯示單次預測可能的變動範圍，並非平均值的信賴區間</li></ul></article>
    <article class="chart-guide"><b>特徵為何被選取？係數如何比較？</b><ul><li>僅用訓練資料以 <code>SelectKBest(f_regression)</code> 計算 F-score，保留前 20 個數值特徵</li><li>特徵以 <code>(值 − 訓練平均值) / 訓練標準差</code> 標準化</li><li>係數表示特徵增加 1 個標準差時，預測耗電改變多少 Wh；絕對值越大，模型中的影響幅度越高</li></ul></article>
  </section>`;
  document.getElementById('dashboard').insertAdjacentHTML('beforeend', guide);
  const crispSection = document.getElementById('crisp-dm');
  if (crispSection) crispSection.innerHTML = `<h2>CRISP-DM 分析流程</h2><div id="crisp-flow" class="crisp-flow"><div><b>1</b><span>Business<br><small>定義耗電預測目標</small></span></div><i>→</i><div><b>2</b><span>Data<br><small>理解感測與氣象欄位</small></span></div><i>→</i><div><b>3</b><span>Preparation<br><small>補值、標準化、選特徵</small></span></div><i>→</i><div><b>4</b><span>Modeling<br><small>線性回歸建模</small></span></div><i>→</i><div><b>5</b><span>Evaluation<br><small>指標、圖表與區間</small></span></div><i>→</i><div><b>6</b><span>Deployment<br><small>情境化儀表板</small></span></div></div><div class="crisp"><div><b>Business</b>協助住戶辨識耗電情境。</div><div><b>Data</b>感測器、天氣與 10 分鐘能耗。</div><div><b>Preparation</b>補值、標準化與特徵選擇。</div><div><b>Modeling</b>Linear Regression 基準模型。</div><div><b>Evaluation</b>四項指標與預測區間。</div><div><b>Deployment</b>提供儀表板決策支援。</div></div>`;
}

async function loadInsights() {
  try {
    const response = await fetch('/api/curated');
    const data = await response.json();
    if (response.ok) { addDatasetInfo(data); addInsight(data.analysis); addGuides(data.analysis); }
  } catch (_) { /* the primary dashboard already reports loading failures */ }
}

window.notice = async function (message) {
  const label = Object.keys(scenarioMap).find(name => message.includes(name));
  if (!label) return;
  const scenario = scenarioMap[label];
  const notice = document.getElementById('notice');
  notice.textContent = '正在計算情境預測…';
  document.querySelectorAll('.scenario').forEach(button => {
    const active = button.textContent.includes(label);
    button.style.borderColor = active ? 'var(--accent)' : 'var(--line)';
    button.style.boxShadow = active ? '0 0 0 2px #4be0bc33' : 'none';
  });
  try {
    const response = await fetch(`/api/curated/scenario/${scenario}`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.detail || '情境預測失敗');
    document.getElementById('scenario-result')?.remove();
    document.getElementById('dashboard').insertAdjacentHTML('afterbegin', `<section id="scenario-result" class="panel" style="margin-bottom:18px;border-color:var(--accent)"><h2>${data.scenario}情境預測</h2><div class="stats" style="grid-template-columns:1fr 1fr"><div class="stat"><span>預測家電耗電</span><strong>${data.prediction} Wh</strong></div><div class="stat"><span>95% 預測區間</span><strong>± ${data.plus_minus} Wh</strong></div></div><p class="note">此情境依資料集內對應時段與環境條件的中位數感測值建立，適合用於比較情境，不代表即時量測。</p></section>`);
    notice.textContent = `${data.scenario}已套用：預測 ${data.prediction} Wh。`;
  } catch (error) { notice.textContent = error.message || '情境預測失敗。'; }
};

setTimeout(loadInsights, 400);

const dashboardStyle = document.createElement('style');
dashboardStyle.textContent = `
  :root { --bg:#f7f1e8; --panel:#fffdf8; --panel2:#edf4e9; --line:#d8c9b8; --text:#33463b; --muted:#728076; --accent:#d96f4c; --blue:#6ca79f; }
  body { background:radial-gradient(circle at top right,#f3d6b5 0,#f7f1e8 37%,#e8f0e6 100%); }
  .hero { background:linear-gradient(130deg,#fff4e4,#edf5e8); border-color:#d9b997; } .hero p { color:#846351; }
  .panel,.stat,.source,.dataset-info,.crisp div,.guide-grid article,.chart-guide { background:#fffdf8 !important; box-shadow:none !important; }
  .panel,.stat { border-color:#dec6a8; } .chart,.chart-grid .panel { background:#fffdf8 !important; }
  .source,.dataset-info,.crisp div,.guide-grid article,.chart-guide { border-color:#ead8c2 !important; }
  .select { background:#fffdf8; color:var(--text); border-color:#dec6a8; }
  .scenario,button { background:#fffdf8; color:var(--text); border-color:#dec6a8; box-shadow:none; }
  .track { background:#f1dfcd; } .fill { background:linear-gradient(90deg,#73a99e,#d96f4c); }
  .chart svg text { fill:#52606d; } .legend { color:#52606d; }
  .interval-key { display:inline-block; height:15px; width:2px; margin:0 5px -3px 12px; background:var(--accent); opacity:.7; }
  .scenario,button { background:#fffaf3; } .scenario:hover,button:hover { border-color:var(--accent); background:#f8e6d5; }
  #dashboard { display:grid; gap:22px; margin-top:4px; }
  #scenario-result { margin:0 !important; padding:26px !important; } #scenario-result h2 { margin-bottom:18px; } #scenario-result .stats { gap:14px; } #scenario-result .stat { padding:18px; }
  #dashboard .panel { margin:0; }
  #model-insight { margin-top:22px !important; margin-bottom:4px; }
  .dataset-info { margin-top:16px; padding:13px; border:1px solid var(--line); border-radius:10px; background:#0a1c27; }
  .dataset-info h3 { margin:0 0 10px; color:var(--accent); font-size:15px; }
  .dataset-info dl { margin:0; display:grid; gap:7px; font-size:14px; }
  .dataset-info dl div { display:flex; justify-content:space-between; gap:10px; }
  .dataset-info dt { color:var(--muted); } .dataset-info dd { margin:0; text-align:right; color:var(--text); }
  .dataset-info a { display:block; margin-top:12px; color:var(--accent); font-size:14px; text-decoration:none; }
  .dataset-info details { margin-top:12px; color:var(--text); font-size:14px; } .dataset-info summary { cursor:pointer; color:var(--accent); }
  .field-table-wrap { max-height:240px; overflow:auto; margin-top:8px; } .field-table { width:100%; border-collapse:collapse; } .field-table th,.field-table td { padding:6px 3px; border-bottom:1px solid var(--line); text-align:left; vertical-align:top; } .field-table th { color:var(--muted); }
  body { font-size:17px; } .top h1 { font-size:27px; } .hero h2 { font-size:31px; } .panel h2 { font-size:20px; } .panel h3 { font-size:17px; } .note { font-size:15px; line-height:1.7; } .stat span { font-size:14px; } .stat strong { font-size:27px; }
  .guide-panel { margin:0; } .guide-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:10px; } .guide-grid article,.chart-guide { background:#f5f7ef; border:1px solid var(--line); border-radius:10px; padding:15px; } .guide-grid article b,.chart-guide b { font-size:16px; } .guide-grid ul,.chart-guide ul { margin:9px 0 0; padding-left:20px; color:var(--muted); font-size:15px; line-height:1.65; } .guide-grid li,.chart-guide li { margin:4px 0; } .chart-guide { margin-top:12px; } code { background:#f5dfc7; padding:1px 4px; border-radius:4px; color:#7a472e; }
  .crisp-flow { display:flex; align-items:center; gap:7px; margin-top:18px; overflow-x:auto; padding:8px 0; } .crisp-flow div { min-width:130px; display:flex; gap:7px; align-items:center; background:#f5f7ef; border:1px solid var(--line); border-radius:9px; padding:10px; font-size:13px; } .crisp-flow b { background:var(--accent); color:white; width:23px; height:23px; border-radius:50%; display:grid; place-items:center; } .crisp-flow small { color:var(--muted); font-size:12px; } .crisp-flow i { color:var(--accent); font-style:normal; }
  @media (max-width:850px) { .dataset-info dl div { display:block; } .dataset-info dd { text-align:left; margin-top:2px; } }
  #model-insight li { margin:9px 0; } #model-insight li span { color:var(--muted); font-size:15px; }
  @media (max-width:850px) { .guide-grid { grid-template-columns:1fr 1fr; } } @media (max-width:560px) { body { font-size:16px; } .hero h2 { font-size:25px; } .guide-grid { grid-template-columns:1fr; } }
`;
document.head.appendChild(dashboardStyle);
