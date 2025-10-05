# Technical Documentation - Will It Rain On My Parade? 🌦️

## Executive Summary

**Will It Rain On My Parade?** is an intelligent weather forecasting web application that uses NASA data to provide accurate weather condition predictions for specific events. The project consists of a Python API (Flask) for meteorological data processing and a Next.js web interface for user interaction.

---

## 🏗️ General Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Next.js API   │    │   Python API    │
│   (Next.js)     │◄──►│   Routes        │◄──►│   (Flask)       │
│                 │    │                 │    │                 │
│ - Form          │    │ - /api/geocode  │    │ - /collect      │
│ - Visualization │    │ - /api/forecast │    │                 │
│ - AI Insights   │    │ - /api/ai/*     │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │                       │
                                ▼                       ▼
                    ┌─────────────────┐    ┌─────────────────┐
                    │ DistanceMatrix  │    │   NASA APIs     │
                    │ API (Geocoding) │    │   (Giovanni)    │
                    └─────────────────┘    └─────────────────┘
```

---

## 🐍 Python API (Backend)

### **📍 Project Structure**

```
data/
├── app/
│   ├── __init__.py                     # Factory pattern Flask app
│   ├── config.py                       # Main configurations
│   ├── config_env.py                   # Environment variables
│   ├── mapeamento_pontos_coletaveis.py # NASA variables mapping
│   ├── api/
│   │   └── routes.py                   # API endpoints
│   ├── services/
│   │   ├── collect_api_giovanni.py     # NASA Giovanni data collection
│   │   ├── transform.py                # Data transformation
│   │   ├── modelos.py                  # Prophet ML models
│   │   └── load.py                     # DB loading (future)
│   └── utils/
│       ├── LatLonToTimeZone.py         # Timezone conversion
│       └── collect_last_date_last_update_giovanni.py
├── run.py                              # Production server
└── api/
    └── api_dados_nasa.py               # Legacy
```

### **🌐 Python API Routes**

#### **POST `/collect`**

**Description**: Main endpoint that executes the entire meteorological data pipeline.

**Payload**:
```json
{
  "lat": -23.5505,
  "lon": -46.6333,
  "datetime": "2024-05-01 18:00:00"
}
```

**Parameters**:
- `lat` (float): Location latitude
- `lon` (float): Location longitude
- `datetime` (string): Event date/time in "YYYY-MM-DD HH:MM:SS" format

**Processing Pipeline**:
1. **Data Collection**: Fetches MERRA-2 variables from NASA Giovanni
2. **Transformation**: Processes and normalizes collected data
3. **Modeling**: Applies Prophet model for temporal prediction
4. **Response**: Returns structured JSON forecast

**NASA Variables Collected**:

| **List 1 (MERRA)**                | **List 2 (MERRA-2)**              |
|------------------------------------|-------------------------------------|
| `M2I1NXLFO_5_12_4_QLML`           | `M2T1NXFLX_5_12_4_PRECTOTCORR`     |
| `M2I1NXLFO_5_12_4_TLML`           | `M2T1NXSLV_5_12_4_TQV`             |
| `M2I1NXLFO_5_12_4_SPEEDLML`       |                                     |

**Structured Response**:
```json
{
  "message": "Data processed successfully!",
  "parameters_received": {
    "lat": -23.5505,
    "lon": -46.6333,
    "time_start": "2024-05-01 18:00:00"
  },
  "data": {
    "location": { "lat": -23.5505, "lon": -46.6333 },
    "timestamp": "2024-05-01 18:00:00",
    "forecast": {
      "temperature": {
        "predicted": 25.3,
        "interval_90": [22.1, 28.5],
        "series": {
          "timestamp": ["2024-05-01 00:00:00", "..."],
          "values": [24.2, 24.8, 25.3, 25.9, 26.1]
        }
      },
      "humidity": {
        "predicted": 0.65,
        "interval_90": [0.55, 0.75],
        "series": { /* ... */ }
      },
      "wind_speed": {
        "predicted": 12.5,
        "interval_90": [8.2, 18.3],
        "series": { /* ... */ }
      },
      "rain": {
        "predicted": 0.002,
        "interval_90": [0.0, 0.008],
        "series": { /* ... */ }
      },
      "water_vapor": {
        "predicted": 28.7,
        "interval_90": [20.1, 35.2],
        "series": { /* ... */ }
      }
    }
  }
}
```

**Status Codes**:
- `200`: Successful prediction
- `400`: Invalid payload data
- `500`: Internal processing error

### **📦 Python Services**

#### **`collect_api_giovanni.py`**

**Main Functions**:

- **`colect_variables(list_variables, lat, lon, time_start, time_end)`**
  - Collects multiple variables in parallel using ThreadPoolExecutor
  - Integration with NASA Giovanni Time Series API
  - Authentication via Bearer token
  - Returns consolidated DataFrame

- **`call_time_series(lat, lon, time_start, time_end, data)`**
  - Individual request for a specific variable
  - Endpoint: `https://api.giovanni.earthdata.nasa.gov/timeseries`
  - Headers: `Authorization: Bearer {GIOVANNI_TOKEN}`

- **`parse_csv(ts)`**
  - Custom parser for NASA CSV format
  - Extracts metadata from first 13 headers
  - Converts timestamps to datetime

#### **`transform.py`**

**Main Function**:

- **`transform(df_merra, df_merra2)`**
  - Temporal synchronization: adjusts MERRA-2 (-30 minutes)
  - Merges datasets by timestamp
  - Unit conversions:
    - Temperature: Kelvin → Celsius (`TLML - 273.15`)
    - Wind speed: m/s → km/h (`SPEEDLML * 3.6`)
  - Local timezone application based on lat/lon
  - Duplicate column cleanup

#### **`modelos.py`**

**Main Function**:

- **`modelo(df_completed, date)`**
  - Implements **5 independent Prophet models**:
    - Temperature (`TLML`)
    - Humidity (`QLML`) 
    - Wind speed (`SPEEDLML`)
    - Precipitation (`PRECTOTCORR`)
    - Water vapor (`TQV`)
  
  **Prophet Configuration**:
  ```python
  Prophet(
      interval_width=0.95,           # 95% confidence interval
      seasonality_mode='multiplicative',
      daily_seasonality=True,        # Daily patterns
      weekly_seasonality=True,       # Weekly patterns
      yearly_seasonality=True        # Annual patterns
  )
  ```

  **Custom Seasonalities**:
  - Monthly: 30.5 days period, fourier_order=5
  - Daily: 24 hours period, fourier_order=10

  **Forecast Horizon**: 2920 periods (≈4 months hourly)

#### **`utils/LatLonToTimeZone.py`**

- **`colect_timezone(lat, lon)`**
  - Determines timezone based on geographic coordinates
  - Returns temporal offset as timedelta
  - Used for timestamp localization

### **🚀 Production Server**

**`run.py`** - Waitress Configuration:
```python
serve(
    app,
    host='127.0.0.1',
    port=8000,
    threads=8,                    # Concurrency
    channel_timeout=12000         # 20min timeout (long operations)
)
```

---

## ⚛️ Frontend Next.js

### **📂 Frontend Structure**

```
web/app/src/
├── app/                          # App Router Next.js 14
│   ├── page.tsx                  # Homepage with form
│   ├── layout.tsx                # Global layout
│   ├── globals.css               # Global styles and themes
│   ├── forecast/
│   │   └── page.tsx              # Results page
│   ├── about/
│   │   ├── page.tsx              # About page
│   │   └── contact/
│   │       └── page.tsx          # Contact page
│   └── api/                      # Next.js API Routes
│       ├── geocode/
│       │   └── route.ts          # Geocoding
│       ├── forecast/
│       │   └── route.ts          # Proxy to Python API
│       └── ai/
│           └── explain-weather/
│               └── route.ts      # AI explanations
├── components/                   # React Components
│   ├── ForecastForm.tsx          # Main form
│   ├── Navbar.tsx                # Navigation
│   ├── AnimatedButton.tsx        # Animated button
│   ├── Chart.tsx                 # Charts
│   ├── WaetherCard.tsx           # Weather cards
│   ├── Skeleton.tsx              # Loading states
│   ├── ui/                       # Base UI components
│   │   ├── Card.tsx              # Card wrapper
│   │   └── Badge.tsx             # Badges
│   └── forecast/                 # Specific components
│       ├── MetricSelector.tsx    # Metrics selector
│       ├── DetailedMetric.tsx    # Detailed display
│       ├── MiniSparkline.tsx     # Mini chart
│       └── metricsConfig.tsx     # Metrics configuration
├── services/
│   └── locationService.ts        # Geocoding service
├── lib/
│   ├── cx.ts                     # CSS classes utility
│   └── buildWeatherPrompt.ts     # AI prompt construction
├── provider/
│   └── ThemeProvider.tsx         # Theme management
└── types/
    └── forecast.ts               # TypeScript typings
```

### **🛣️ Next.js Routes (App Router)**

#### **`/` (Homepage)**

**Component**: `app/page.tsx`

**Features**:
- **Animated hero section** with scroll reveal
- **Inline form** that appears progressively
- **Smooth transitions** between states
- **Auto-scroll** to form

**States**:
- Initial: Hero visible, form hidden
- Scroll: Hero fade out, form fade in
- Filling: Real-time progress bar

#### **`/forecast` (Results)**

**Component**: `app/forecast/page.tsx`

**Features**:
- **Loading states** with skeletons
- **Interactive metrics selector**
- **Detailed visualization** by metric
- **AI explanations** with toggle show/hide
- **Temporal charts** (Using Plotly.js)
- **Informative badges** (location, date, source)

**Data Used**:
- `sessionStorage.eventData`: Event information
- `sessionStorage.forecastData`: Forecast data

#### **`/about` (About)**

**Component**: `app/about/page.tsx`
- Project information
- Methodology used
- Credits and sources

#### **`/about/contact` (Contact)**

**Component**: `app/about/contact/page.tsx`
- Team contact information
- GitHub repository links

### **🔌 Next.js API Routes**

#### **`/api/geocode`**

**File**: `app/api/geocode/route.ts`

**Methods**: `GET`, `POST`

**Description**: Converts addresses to geographic coordinates using DistanceMatrix API.

**POST Payload**:
```json
{
  "cidade": "São Paulo",
  "rua": "Avenida Paulista", 
  "numero": "1000",
  "cep": "01310-100",
  "pais": "Brasil",
  "estado": "SP"
}
```

**GET Payload** (query params):
```
?cidade=São Paulo&rua=Avenida Paulista&numero=1000&pais=Brasil
```

**Success Response**:
```json
{
  "lat": -23.5505,
  "lng": -46.6333,
  "address": "Av. Paulista, 1000 - Bela Vista, São Paulo - SP, Brasil"
}
```

**Validations**:
- Minimum input: 2 filled fields (city + country recommended)
- Support for `rawAddress` for complete address
- Field name normalization (cep/postalCode, cidade/city)

**Status Codes**:
- `200`: Successful geocoding
- `404`: Coordinates not found
- `422`: Insufficient data
- `424`: External API failure

#### **`/api/forecast`**

**File**: `app/api/forecast/route.ts`

**Method**: `POST`

**Description**: Smart proxy to Python API with fallback to mock data.

**Payload**:
```json
{
  "lat": -23.5505,
  "lon": -46.6333,        // or "lng"
  "datetime": "2024-05-01 18:00:00"
  // or
  "date": "2024-05-01",
  "hour": "18:00"
}
```

**Fallback Logic**:
1. **Primary**: Attempts Python API (`FORECAST_API_BASE_URL`)
2. **Fallback**: Mock data if API unavailable
3. **Identification**: `source` field indicates origin ("backend" or "mock-*")

**URL Configuration**:
- Automatic endpoint detection (`/collect`, `/forecast`, `/predict`)
- Smart base route concatenation

**Mock Data**:
```json
{
  "data": {
    "forecast": {
      "temperature": { 
        "predicted": 25, 
        "interval_90": [20, 30], 
        "series": [25, 26, 27, 26, 25, 24],
        "unit": "°C" 
      },
      // ... other metrics
    }
  },
  "source": "mock-fallback-backend-error"
}
```

#### **`/api/ai/explain-weather`**

**File**: `app/api/ai/explain-weather/route.ts`

**Method**: `POST`

**Description**: Weather explanations generation via Groq API (Llama).

**Payload**:
```json
{
  "lat": -23.5505,
  "lng": -46.6333,
  "address": "São Paulo, SP",
  "date": "2024-05-01",
  "hour": "18:00"
}
```

**Groq Configuration**:
- **Model**: `llama-3.1-70b-versatile` (configurable)
- **Base URL**: `https://api.groq.com/openai/v1`
- **System Prompt**: "Specialist meteorologist AI"
- **Language**: Explanations in English

**Response**:
```json
{
  "explanation": "Based on the weather data for São Paulo on May 1st at 6 PM, you can expect..."
}
```

**Error Handling**:
- Groq HTTP status propagation
- Detailed logs for debugging
- Fallback to "No AI response"

### **🧩 React Components**

#### **`ForecastForm.tsx`**

**Props**:
```typescript
interface ForecastFormProps {
  onSuccess?: (data: EventDataStored) => void;
  className?: string;
  compact?: boolean;
}
```

**Features**:
- **Validation**: Zod schema with zodResolver
- **Progress tracking**: 8 fields with visual bar
- **Auto-save**: Debounced (300ms) to sessionStorage
- **Smart fields**:
  - ZIP with automatic mask
  - Date/time with validators
  - Inputs with contextual icons
- **Visual states**: Idle, Error, Success per field
- **Helper buttons**: Clear, Sample data
- **Submit flow**: Geocode → Forecast → Navigation

**Validation Schema** (`_schemas/auth-schema.ts`):
```typescript
export const signUpSchema = z.object({
  cidade: z.string().min(1, "City required"),
  rua: z.string().min(1, "Street required"), 
  numero: z.string().min(1, "Number required"),
  cep: z.string().regex(/^\d{5}-?\d{3}$/, "Invalid ZIP"),
  pais: z.string().min(1, "Country required"),
  estado: z.string().min(1, "State required"),
  date: z.string().min(1, "Date required"),
  hour: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time")
});
```

#### **`MetricSelector.tsx`**

**Props**:
```typescript
interface MetricSelectorProps {
  metrics: Record<string, any>;
  current: string | null;
  onSelect: (metric: string) => void;
}
```

**Features**:
- **Interactive pills** for metric selection
- **Contextual icons** by metric type
- **Visual states**:
  - Active: blue with white text
  - Inactive: gray with hover effects
- **Dark mode**: Tailwind classes with `!important`
- **Configuration**: Icons and labels via `metricsConfig.tsx`

**Design System**:
```css
/* Active Button */
!bg-blue-600 !text-white !border-blue-600 shadow 
dark:!bg-blue-500 dark:!border-blue-500

/* Inactive Button */  
!bg-gray-100 !border-gray-200 !text-gray-700 
dark:!bg-gray-700 dark:!border-gray-600 dark:!text-gray-200
```

#### **`DetailedMetric.tsx`**

**Props**:
```typescript
interface DetailedMetricProps {
  name: string;
  metric: {
    predicted: number;
    interval_90: [number, number];
    unit?: string;
    series?: number[] | { timestamp: string[], values: number[] };
  };
}
```

**Features**:
- **Main statistics**: Prediction, confidence interval, unit
- **Responsive grid**: Organized statistics
- **Smart formatting**: Numbers with appropriate precision
- **Visual indicators**: Cards with thematic colors

#### **`MiniSparkline.tsx`**

**Props**:
```typescript
interface MiniSparklineProps {
  values: number[];
  width?: number;
  height?: number;
  color?: string;
}
```

**Features**:
- **SVG Polyline**: Lightweight and responsive rendering
- **Auto normalization**: Scales to container height
- **Gradient**: Configurable colored stroke
- **Responsive**: Adapts to parent container

#### **Base UI Components**

**`Card.tsx`**:
```typescript
interface CardProps {
  title?: string;
  footer?: string;
  children: React.ReactNode;
  className?: string;
}
```

**`Badge.tsx`**:
```typescript
interface BadgeProps {
  children: React.ReactNode;
  tone?: 'default' | 'info' | 'success' | 'warning' | 'danger';
  className?: string;
}
```

**`AnimatedButton.tsx`**:
```typescript
interface AnimatedButtonProps {
  label: string;
  disabled?: boolean;
  onAction: () => Promise<void>;
}
```

### **🎨 Theme System**

#### **`ThemeProvider.tsx`**

**Features**:
- **Dual mode**: data-theme attribute + dark class
- **Persistence**: localStorage with system fallback
- **Tailwind sync**: Applies `dark` class for compatibility
- **Toggle button**: Integrated UI in navbar

**States**:
- `null`: Auto (system)
- `"light"`: Forced light theme
- `"dark"`: Forced dark theme

#### **`globals.css`** - Design System

**CSS Variables** (themes):
```css
[data-theme="light"] {
  --background: #ffffff;
  --foreground: #000000;
  --background-secondary: #f2f2f2;
  --accent: #3B82F6;
  --border: #E5E7EB;
}

[data-theme="dark"] {
  --background: #111315;
  --foreground: #ECEDEE;
  --background-secondary: #1B1F22;
  --accent: #3B82F6;
  --border: #242A30;
}
```

**CSS Components**:
- `.card`: Containers with hover effects
- `.btn-primary` / `.btn-outline`: Standardized buttons
- `.badge-*`: Status indicators
- Skeleton loading animations
- Custom scrollbar

**Tailwind Config**:
```javascript
{
  darkMode: ['class', '[data-theme="dark"]'],
  // Dual support: class + data-theme
}
```

### **🔧 Frontend Services**

#### **`locationService.ts`**

**Main Function**:
```typescript
async function geocodeAddress(input: GeocodeInput): Promise<GeocodeResult>
```

**Types**:
```typescript
interface GeocodeInput {
  cidade?: string;
  pais?: string;
  numero?: string;
  rua?: string;  
  codigoPostal?: string;
  rawAddress?: string;
}

interface GeocodeResult {
  address: string;
  formattedAddress?: string;
  lat?: number;
  lng?: number;
  raw: GeocodeAPIResult;
}
```

**Features**:
- **DistanceMatrix Integration**: External API for geocoding
- **Smart construction**: Addresses from components
- **Fallbacks**: rawAddress when components insufficient
- **Validation**: Required status and coordinates

---

## 🔄 Complete Data Flow

### **1. Form Submission**

```
[ForecastForm] 
    → Zod validation 
    → POST /api/geocode 
    → sessionStorage.eventData
    → POST /api/forecast 
    → sessionStorage.forecastData
    → navigate("/forecast")
```

### **2. Backend Processing**

```
[Next.js /api/forecast] 
    → POST Python-API/collect
        → colect_variables() [NASA Giovanni]
        → transform() [normalization]
        → modelo() [Prophet ML]
    → JSON response
```

### **3. Results Visualization**

```
[/forecast page]
    → load sessionStorage
    → MetricSelector interaction
    → DetailedMetric display  
    → AI explanation (optional)
    → MiniSparkline charts
```

---

## 🌍 External Integrations

### **NASA Giovanni API**

**Endpoint**: `https://api.giovanni.earthdata.nasa.gov/timeseries`

**Authentication**: Bearer Token (configured in `config_env.py`)

**Parameters**:
- `data`: MERRA-2 variable ID
- `location`: `[lat,lon]` 
- `time`: `start/end` (ISO format)

**Rate Limits**: Configured with ThreadPoolExecutor (max 5 workers)

### **DistanceMatrix API**

**Endpoint**: `https://api.distancematrix.ai/maps/api/geocode/json`

**Authentication**: API Key in query param

**Usage**: Address → geographic coordinates conversion

### **Groq API (LLama)**

**Endpoint**: `https://api.groq.com/openai/v1/chat/completions`

**Model**: `llama-3.1-70b-versatile`

**Usage**: Weather explanations generation in natural language

---

## 📊 Types and Interfaces

### **Forecast Types** (`types/forecast.ts`)

```typescript
interface RawForecastAPIResponse {
  data: {
    forecast: Record<string, {
      predicted: number;
      interval_90: [number, number];
      series?: number[] | SeriesObject;
      unit?: string;
    }>;
    location: { lat: number; lon: number };
    timestamp: string;
  };
  status?: string;
}

interface NormalizedForecast {
  metrics: Record<string, MetricData>;
  location: { lat: number; lon: number };
  timestamp: string;
}

interface MetricData {
  predicted: number;
  interval_90: [number, number];
  unit?: string;
  series?: number[];
}
```

### **Form Types**

```typescript
interface EventDataStored {
  form: {
    cidade: string;
    rua: string;
    numero: string;
    cep: string;
    pais: string;
    estado: string;
    date: string;
    hour: string;
  };
  location?: {
    lat?: number;
    lng?: number;
    formattedAddress?: string;
  };
  savedAt: number;
}
```

---

## ⚙️ Configuration and Environment

### **Python (.env)**

```env
# NASA Giovanni API
GIOVANNI_TOKEN=your_nasa_token_here

# Timezone API (if used)
TIMEZONE_API_KEY=your_timezone_key
```

### **Next.js (.env.local)**

```env
# Geocoding
DISTANCE_MATRIX_KEY=your_distancematrix_key

# Forecast API
FORECAST_API_BASE_URL=http://127.0.0.1:8000/collect

# AI Explanations  
GROQ_API_KEY=your_groq_key
GROQ_BASE_URL=https://api.groq.com/openai/v1
GROQ_MODEL=llama-3.1-70b-versatile
```

---

## 🚀 Deploy and Execution

### **Python API**

```bash
cd data/
python run.py
# Server: http://127.0.0.1:8000
# Timeout: 20 minutes
# Threads: 8
```

### **Next.js Frontend**

```bash
cd web/app/
npm install
npm run dev
# Development: http://localhost:3000

npm run build && npm start  
# Production: http://localhost:3000
```

### **Python Dependencies**

```
Flask
pandas
requests
concurrent.futures
tqdm
prophet
waitress
```

### **Next.js Dependencies**

```json
{
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.0.0",
    "react-hook-form": "^7.0.0",
    "@hookform/resolvers": "^3.0.0",
    "zod": "^3.0.0",
    "lucide-react": "^0.200.0",
    "clsx": "^2.0.0",
    "tailwindcss": "^3.0.0"
  }
}
```

---

## 🔍 Debugging and Logs

### **Python API Logs**

```python
# routes.py
print('Success')  
print(date, lon, lat)  
print('Entered...')
print('Success without model')
print('Success with model') 

# modelos.py
print('entered')
print(df_completed.head(1))
print('Step1', 'Step2', ..., 'Success1', 'Success2', 'Success3')
print("Starting model training...")
print("Training completed!")
print("Making predictions...")
print("Predictions generated!")
```

### **Next.js API Logs**

```typescript
// geocode/route.ts
console.log("[POST /api/geocode]");
console.error("POST /api/geocode error:", e);

// forecast/route.ts  
console.log('[POST /api/forecast] request-id:', h.get('x-request-id'));
console.warn('FORECAST_API_BASE_URL missing. Returning MOCK fallback.');
console.log('[forecast-proxy] base="' + base + '" finalUrl="' + url.toString() + '"');

// ai/explain-weather/route.ts
console.error("❌ Groq Error:", errorText);
console.error("Internal error:", error);
```

### **Frontend Debug**

```typescript
// locationService.ts
console.log("[geocodeAddress] status:", data.status, "items:", candidates.length, "lat?", lat, "lng?", lng);

// ForecastForm.tsx  
// Auto-save to sessionStorage with silent try/catch

// forecast/page.tsx
// Type validation with isStoredEventData()
```

---

## 🎯 Metrics and Performance

### **Python API**

- **Timeout**: 20 minutes for long operations
- **Concurrency**: 8 Waitress threads + 5 ThreadPoolExecutor workers
- **Cache**: Not implemented (future: Redis)
- **ML Horizon**: 2920 hourly periods (≈4 months)

### **Next.js Frontend**

- **Bundle Size**: Optimized with Tree Shaking
- **Images**: Next.js Image Optimization
- **Caching**: 
  - API Routes: `cache: "no-store"`
  - SessionStorage: Auto-save debounced 300ms
- **Loading States**: Skeleton screens for UX

### **External APIs**

- **NASA Giovanni**: Rate limit via ThreadPoolExecutor
- **DistanceMatrix**: Pay-per-request
- **Groq**: Token-based billing

---

## 🔐 Security

### **Authentication**

- NASA Giovanni: Server-side Bearer Token
- DistanceMatrix: Server-side API Key
- Groq: Server-side API Key
- **No** credentials exposed in frontend

### **Validation**

- **Backend**: Python type validation + try/catch
- **Frontend**: Zod schema + zodResolver
- **API Routes**: Payload validation + status codes

### **CORS**

- Next.js API Routes: Same-origin automatically
- Python Flask: Not configured (localhost only)

---

## 🐛 Error Handling

### **Python API**

```python
try:
    # Pipeline processing
    return jsonify(success_response), 200
except KeyError as e:
    return jsonify({"error": f"Missing required parameter: {e}"}), 400
except Exception as e:
    return jsonify({"error": "An internal error occurred", "details": str(e)}), 500
```

### **Next.js API Routes**

```typescript
// Fallback cascade
try {
  const backendResponse = await fetch(pythonAPI);
  return normalizedData;
} catch (networkError) {
  console.error('Backend unreachable:', networkError);
  return mockFallback;
}
```

### **Frontend Components**

```typescript
// ForecastForm error states
const [submitError, setSubmitError] = useState<string | null>(null);

// Forecast page data validation  
if (!eventData) return <p className="text-rose-500">No data loaded yet.</p>;
```

---

## 📈 Future Roadmap

### **Backend Improvements**

- [ ] Redis cache for NASA data
- [ ] PostgreSQL database
- [ ] API versioning (v1, v2)
- [ ] Smart rate limiting
- [ ] Healthcheck endpoints
- [ ] Metrics/observability (Prometheus)

### **Frontend Improvements**

- [ ] PWA (Service Workers)
- [ ] Automatic geolocation
- [ ] Social sharing
- [ ] PDF/PNG export
- [ ] Multiple simultaneous events
- [ ] Query history

### **ML Features**

- [ ] Ensemble models (Prophet + LSTM)
- [ ] Uncertainty quantification
- [ ] Seasonal decomposition visualization
- [ ] Weather alerts/notifications
- [ ] Historical comparison

### **UX/UI**

- [ ] Interactive maps (Leaflet/Mapbox)
- [ ] Advanced charts (@nivo/line, @nivo/bar)
- [ ] Micro-interaction animations
- [ ] Mobile-first design
- [ ] WCAG 2.1 accessibility

---

## 📝 Development Notes

### **Architectural Decisions**

1. **Backend/Frontend Separation**: Allows independent scalability
2. **Next.js API Routes**: Proxy pattern for credential security
3. **SessionStorage**: Temporary, non-persistent data
4. **Prophet ML**: Robust for meteorological time series
5. **Tailwind CSS**: Utility-first for rapid development
6. **TypeScript**: Type safety throughout application

### **Trade-offs**

- **Performance vs Simplicity**: Prophet single-threaded, but reliable
- **Mock vs Real Data**: Fallback ensures always functional demonstration
- **Client State vs Server State**: SessionStorage for rapid prototyping
- **CSS Variables vs Tailwind**: Hybrid for thematic flexibility

### **Conventions**

- **Naming**: camelCase (JS/TS), snake_case (Python), kebab-case (CSS)
- **Commits**: Conventional Commits
- **Components**: PascalCase with JSDoc
- **APIs**: RESTful with standard JSON response

---

*Documentation generated for NASA Hackathon 2025 - Will It Rain On My Parade? 🌦️*