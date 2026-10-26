# IoT Regression Studio

HW02 的互動式多元線性回歸網站。專案以智慧家庭的家電耗電資料為主要案例，將資料理解、特徵選擇、線性回歸、評估與結果解釋整理為可操作的儀表板。

## 目前功能

- 智慧家庭耗電預測：使用 `Appliances`（Wh）作為連續型預測目標。
- 以訓練資料執行補值、標準化與 `SelectKBest` 特徵選擇，再訓練 `LinearRegression`。
- 顯示 MAE、MSE、RMSE、R²、Actual vs. Predicted 圖、特徵係數與 95% 校正殘差預測區間。
- 自訂 CSV：上傳最大 25 MB 的 CSV、選擇數值目標欄位並執行相同的分析流程。
- CRISP-DM 六階段說明：Business Understanding、Data Understanding、Data Preparation、Modeling、Evaluation、Deployment。

## 資料集

主要資料為 [Appliances Energy Prediction](https://www.kaggle.com/datasets/loveall/appliances-energy-prediction)，原始資料也由 [UCI Machine Learning Repository](https://archive.ics.uci.edu/dataset/374/appliancesenergyprediction) 提供。

請將下載的 CSV 放在專案根目錄並命名為：

```text
KAG_energydata_complete.csv
```

資料集含 19,735 筆 10 分鐘間隔紀錄，以及室內溫濕度、室外氣象、照明耗電等欄位。程式將 `Appliances` 作為目標，排除原始時間欄與用來測試特徵選擇的 `rv1`、`rv2`。

## 本機啟動

需求：Python 3.12。建議建立只存在於此專案的虛擬環境。

```powershell
py -3.12 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python -m uvicorn app:app --reload
```

若使用此工作區已建立的本機環境，改用：

```powershell
.tools\py312\python.exe -m uvicorn app:app --reload
```

接著開啟 [http://127.0.0.1:8000](http://127.0.0.1:8000)。

## 手動測試清單

1. 首頁應顯示家電耗電案例、四項評估指標、預測區間與特徵係數。
2. 切換到「自訂 CSV Regression」，上傳數值型 CSV 後應顯示欄位選單。
3. 選定連續型數值目標並開始分析，應得到相同格式的指標與圖表。
4. 上傳非 CSV、無法解析的 CSV 或超過 25 MB 的檔案，應顯示易懂的錯誤。

## API 摘要

| 路徑 | 方法 | 用途 |
| --- | --- | --- |
| `/api/curated` | GET | 回傳主要資料集的資料概況與回歸分析結果。 |
| `/api/import` | POST | 上傳 CSV，回傳資料結構預覽與暫存 token。 |
| `/api/analyse/{token}` | POST | 傳入 `{"target": "欄位名"}`，分析上傳資料。 |
| `/api/curated/scenario/{scenario}` | GET | 取得 `morning`、`afternoon` 或 `night` 情境的耗電預測。 |

## 已知限制

- 自訂模式目前支援數值型特徵；類別欄位不會自動編碼。
- 自訂資料的公開 CSV URL 匯入仍待實作；目前可使用檔案上傳。
- 模型係數描述的是資料關聯，不代表因果關係；R² 與預測區間應一併閱讀。
- 此專案的模型為作業用可解釋基準模型，不適合直接用於高風險決策。
