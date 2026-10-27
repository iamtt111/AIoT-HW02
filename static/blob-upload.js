const localUpload = window.upload;
const localAnalyse = window.analyseCustom;
let blobUrl;

async function populateFromBlob(url) {
  const response = await fetch('/api/preview-blob', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({blob_url: url})});
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
    const blob = await upload(`custom-csv/${file.name}`, file, {access: 'public', handleUploadUrl: '/api/blob-upload'});
    blobUrl = blob.url;
    await populateFromBlob(blobUrl);
    document.getElementById('error').textContent = '';
  } catch (error) { document.getElementById('error').textContent = error.message || 'Blob upload failed.'; }
};

window.analyseCustom = async function () {
  if (!blobUrl) return localAnalyse();
  const response = await fetch('/api/analyse-blob', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({blob_url: blobUrl, target: document.getElementById('target').value})});
  const data = await response.json();
  if (!response.ok) { document.getElementById('error').textContent = data.detail; return; }
  document.getElementById('customResult').className = '';
  document.getElementById('customResult').innerHTML = result(data);
};
