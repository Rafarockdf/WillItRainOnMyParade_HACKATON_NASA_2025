# Documentação Técnica - Will It Rain On My Parade? 🌦️

## Sumário Executivo

O **Will It Rain On My Parade?** é uma aplicação web de previsão meteorológica inteligente que utiliza dados da NASA para fornecer previsões precisas de condições climáticas para eventos específicos. O projeto consiste em uma API Python (Flask) para processamento de dados meteorológicos e uma interface web Next.js para interação do usuário.

---

## 🏗️ Arquitetura Geral

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Next.js API   │    │   Python API    │
│   (Next.js)     │◄──►│   Routes        │◄──►│   (Flask)       │
│                 │    │                 │    │                 │
│ - Formulário    │    │ - /api/geocode  │    │ - /collect      │
│ - Visualização  │    │ - /api/forecast │    │                 │
│ - IA Insights   │    │ - /api/ai/*     │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │                       │
                                ▼                       ▼
                    ┌─────────────────┐    ┌─────────────────┐
                    │ DistanceMatrix  │    │   NASA APIs     │
                    │ API (Geocoding) │    │   (Giovanni)    │
                    └─────────────────┘    └─────────────────┘
```

---

## 🐍 API Python (Backend)

### **📍 Estrutura do Projeto**

```
data/
├── app/
│   ├── __init__.py                     # Factory pattern Flask app
│   ├── config.py                       # Configurações principais
│   ├── config_env.py                   # Variáveis de ambiente
│   ├── mapeamento_pontos_coletaveis.py # Mapeamento de variáveis NASA
│   ├── api/
│   │   └── routes.py                   # Endpoints da API
│   ├── services/
│   │   ├── collect_api_giovanni.py     # Coleta dados NASA Giovanni
│   │   ├── transform.py                # Transformação de dados
│   │   ├── modelos.py                  # Modelos Prophet ML
│   │   └── load.py                     # Carregamento para BD (futuro)
│   └── utils/
│       ├── LatLonToTimeZone.py         # Conversão timezone
│       └── collect_last_date_last_update_giovanni.py
├── run.py                              # Servidor de produção
└── api/
    └── api_dados_nasa.py               # Legado
```

### **🌐 Rotas da API Python**

#### **POST `/collect`**

**Descrição**: Endpoint principal que executa toda a pipeline de dados meteorológicos.

**Payload**:
```json
{
  "lat": -23.5505,
  "lon": -46.6333,
  "datetime": "2024-05-01 18:00:00"
}
```

**Parâmetros**:
- `lat` (float): Latitude da localização
- `lon` (float): Longitude da localização  
- `datetime` (string): Data/hora do evento no formato "YYYY-MM-DD HH:MM:SS"

**Pipeline de Processamento**:
1. **Coleta de Dados**: Busca variáveis MERRA-2 da NASA Giovanni
2. **Transformação**: Processa e normaliza os dados coletados
3. **Modelagem**: Aplica modelo Prophet para previsão temporal
4. **Resposta**: Retorna previsão estruturada em JSON

**Variáveis NASA Coletadas**:

| **Lista 1 (MERRA)**                | **Lista 2 (MERRA-2)**              |
|------------------------------------|-------------------------------------|
| `M2I1NXLFO_5_12_4_QLML`           | `M2T1NXFLX_5_12_4_PRECTOTCORR`     |
| `M2I1NXLFO_5_12_4_TLML`           | `M2T1NXSLV_5_12_4_TQV`             |
| `M2I1NXLFO_5_12_4_SPEEDLML`       |                                     |

**Resposta Estruturada**:
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

**Códigos de Status**:
- `200`: Sucesso na previsão
- `400`: Dados inválidos no payload
- `500`: Erro interno de processamento

### **📦 Serviços Python**

#### **`collect_api_giovanni.py`**

**Funções Principais**:

- **`colect_variables(list_variables, lat, lon, time_start, time_end)`**
  - Coleta múltiplas variáveis em paralelo usando ThreadPoolExecutor
  - Integração com NASA Giovanni Time Series API
  - Autenticação via Bearer token
  - Retorna DataFrame consolidado

- **`call_time_series(lat, lon, time_start, time_end, data)`**
  - Requisição individual para uma variável específica
  - Endpoint: `https://api.giovanni.earthdata.nasa.gov/timeseries`
  - Headers: `Authorization: Bearer {GIOVANNI_TOKEN}`

- **`parse_csv(ts)`**
  - Parser customizado para formato CSV da NASA
  - Extrai metadados dos primeiros 13 headers
  - Converte timestamps para datetime

#### **`transform.py`**

**Função Principal**:

- **`transform(df_merra, df_merra2)`**
  - Sincronização temporal: ajusta MERRA-2 (-30 minutos)
  - Merge dos datasets por timestamp
  - Conversões de unidades:
    - Temperatura: Kelvin → Celsius (`TLML - 273.15`)
    - Velocidade do vento: m/s → km/h (`SPEEDLML * 3.6`)
  - Aplicação de timezone local baseado em lat/lon
  - Limpeza de colunas duplicadas

#### **`modelos.py`**

**Função Principal**:

- **`modelo(df_completed, date)`**
  - Implementa **5 modelos Prophet independentes**:
    - Temperatura (`TLML`)
    - Umidade (`QLML`) 
    - Velocidade do vento (`SPEEDLML`)
    - Precipitação (`PRECTOTCORR`)
    - Vapor de água (`TQV`)
  
  **Configuração Prophet**:
  ```python
  Prophet(
      interval_width=0.95,           # Intervalo de confiança 95%
      seasonality_mode='multiplicative',
      daily_seasonality=True,        # Padrões diários
      weekly_seasonality=True,       # Padrões semanais
      yearly_seasonality=True        # Padrões anuais
  )
  ```

  **Sazonalidades Customizadas**:
  - Mensal: período 30.5 dias, fourier_order=5
  - Diária: período 24 horas, fourier_order=10

  **Horizonte de Previsão**: 2920 períodos (≈4 meses horários)

#### **`utils/LatLonToTimeZone.py`**

- **`colect_timezone(lat, lon)`**
  - Determina timezone baseado em coordenadas geográficas
  - Retorna offset temporal como timedelta
  - Utilizado para localização de timestamps

### **🚀 Servidor de Produção**

**`run.py`** - Configuração Waitress:
```python
serve(
    app,
    host='127.0.0.1',
    port=8000,
    threads=8,                    # Concorrência
    channel_timeout=12000         # 20min timeout (operações longas)
)
```

---

## ⚛️ Frontend Next.js

### **📂 Estrutura do Frontend**

```
web/app/src/
├── app/                          # App Router Next.js 14
│   ├── page.tsx                  # Homepage com formulário
│   ├── layout.tsx                # Layout global
│   ├── globals.css               # Estilos globais e temas
│   ├── forecast/
│   │   └── page.tsx              # Página de resultados
│   ├── about/
│   │   ├── page.tsx              # Página sobre
│   │   └── contact/
│   │       └── page.tsx          # Página de contato
│   └── api/                      # API Routes Next.js
│       ├── geocode/
│       │   └── route.ts          # Geocodificação
│       ├── forecast/
│       │   └── route.ts          # Proxy para API Python
│       └── ai/
│           └── explain-weather/
│               └── route.ts      # IA explicativa
├── components/                   # Componentes React
│   ├── ForecastForm.tsx          # Formulário principal
│   ├── Navbar.tsx                # Navegação
│   ├── AnimatedButton.tsx        # Botão animado
│   ├── Chart.tsx                 # Gráficos
│   ├── WaetherCard.tsx           # Cards meteorológicos
│   ├── Skeleton.tsx              # Loading states
│   ├── ui/                       # Componentes UI base
│   │   ├── Card.tsx              # Card wrapper
│   │   └── Badge.tsx             # Badges
│   └── forecast/                 # Componentes específicos
│       ├── MetricSelector.tsx    # Seletor de métricas
│       ├── DetailedMetric.tsx    # Exibição detalhada
│       ├── MiniSparkline.tsx     # Gráfico mini
│       └── metricsConfig.tsx     # Configuração métricas
├── services/
│   └── locationService.ts        # Serviço de geocodificação
├── lib/
│   ├── cx.ts                     # Utility de classes CSS
│   └── buildWeatherPrompt.ts     # Construção prompts IA
├── provider/
│   └── ThemeProvider.tsx         # Gerenciamento temas
└── types/
    └── forecast.ts               # Tipagens TypeScript
```

### **🛣️ Rotas Next.js (App Router)**

#### **`/` (Homepage)**

**Componente**: `app/page.tsx`

**Funcionalidades**:
- **Hero section** animado com scroll reveal
- **Formulário inline** que aparece progressivamente
- **Transições suaves** entre estados
- **Auto-scroll** para formulário

**Estados**:
- Inicial: Hero visível, formulário oculto
- Scroll: Hero fade out, formulário fade in
- Preenchimento: Progress bar em tempo real

#### **`/forecast` (Resultados)**

**Componente**: `app/forecast/page.tsx`

**Funcionalidades**:
- **Loading states** com skeletons
- **Seletor de métricas** interativo
- **Visualização detalhada** por métrica
- **IA explicativa** com toggle show/hide
- **Gráficos temporais** (Com o uso de Plotly.js)
- **Badges informativos** (localização, data, fonte)

**Dados Utilizados**:
- `sessionStorage.eventData`: Informações do evento
- `sessionStorage.forecastData`: Dados de previsão

### **🔌 API Routes Next.js**

#### **`/api/geocode`**

**Arquivo**: `app/api/geocode/route.ts`

**Métodos**: `GET`, `POST`

**Descrição**: Converte endereços em coordenadas geográficas usando DistanceMatrix API.

**Payload POST**:
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

**Payload GET** (query params):
```
?cidade=São Paulo&rua=Avenida Paulista&numero=1000&pais=Brasil
```

**Resposta Sucesso**:
```json
{
  "lat": -23.5505,
  "lng": -46.6333,
  "address": "Av. Paulista, 1000 - Bela Vista, São Paulo - SP, Brasil"
}
```

**Validações**:
- Entrada mínima: 2 campos preenchidos (cidade + país recomendado)
- Suporte a `rawAddress` para endereço completo
- Normalização de nomes de campos (cep/postalCode, cidade/city)

**Códigos de Status**:
- `200`: Geocodificação bem-sucedida
- `404`: Coordenadas não encontradas
- `422`: Dados insuficientes
- `424`: Falha na API externa

#### **`/api/forecast`**

**Arquivo**: `app/api/forecast/route.ts`

**Método**: `POST`

**Descrição**: Proxy inteligente para API Python com fallback para dados mock.

**Payload**:
```json
{
  "lat": -23.5505,
  "lon": -46.6333,        // ou "lng"
  "datetime": "2024-05-01 18:00:00"
  // ou
  "date": "2024-05-01",
  "hour": "18:00"
}
```

**Lógica de Fallback**:
1. **Primário**: Tenta API Python (`FORECAST_API_BASE_URL`)
2. **Fallback**: Dados mock se API indisponível
3. **Identificação**: Campo `source` indica origem ("backend" ou "mock-*")

**Configuração de URL**:
- Detecção automática de endpoint (`/collect`, `/forecast`, `/predict`)
- Concatenação inteligente de rota base

**Dados Mock**:
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
      // ... outras métricas
    }
  },
  "source": "mock-fallback-backend-error"
}
```

#### **`/api/ai/explain-weather`**

**Arquivo**: `app/api/ai/explain-weather/route.ts`

**Método**: `POST`

**Descrição**: Geração de explicações meteorológicas via Groq API (Llama).

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

**Configuração Groq**:
- **Modelo**: `llama-3.1-70b-versatile` (configurável)
- **Base URL**: `https://api.groq.com/openai/v1`
- **Prompt System**: "Meteorologista IA especializado"
- **Idioma**: Explicações em inglês

**Resposta**:
```json
{
  "explanation": "Based on the weather data for São Paulo on May 1st at 6 PM, you can expect..."
}
```

**Tratamento de Erros**:
- Propagação de status HTTP da Groq
- Logs detalhados para debugging
- Fallback para "Sem resposta da IA"

### **🧩 Componentes React**

#### **`ForecastForm.tsx`**

**Props**:
```typescript
interface ForecastFormProps {
  onSuccess?: (data: EventDataStored) => void;
  className?: string;
  compact?: boolean;
}
```

**Funcionalidades**:
- **Validação**: Zod schema com zodResolver
- **Progress tracking**: 8 campos com barra visual
- **Auto-save**: Debounced (300ms) para sessionStorage
- **Campos inteligentes**:
  - CEP com máscara automática
  - Data/hora com validadores
  - Inputs com ícones contextuais
- **Estados visuais**: Idle, Error, Success por campo
- **Botões auxiliares**: Clear, Sample data
- **Submit flow**: Geocode → Forecast → Navigation

**Schema de Validação** (`_schemas/auth-schema.ts`):
```typescript
export const signUpSchema = z.object({
  cidade: z.string().min(1, "Cidade obrigatória"),
  rua: z.string().min(1, "Rua obrigatória"), 
  numero: z.string().min(1, "Número obrigatório"),
  cep: z.string().regex(/^\d{5}-?\d{3}$/, "CEP inválido"),
  pais: z.string().min(1, "País obrigatório"),
  estado: z.string().min(1, "Estado obrigatório"),
  date: z.string().min(1, "Data obrigatória"),
  hour: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "Hora inválida")
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

**Funcionalidades**:
- **Pills interativas** para seleção de métricas
- **Ícones contextuais** por tipo de métrica
- **Estados visuais**:
  - Ativo: azul com texto branco
  - Inativo: cinza com hover effects
- **Dark mode**: Classes Tailwind com `!important`
- **Configuração**: Icons e labels via `metricsConfig.tsx`

**Design System**:
```css
/* Botão Ativo */
!bg-blue-600 !text-white !border-blue-600 shadow 
dark:!bg-blue-500 dark:!border-blue-500

/* Botão Inativo */  
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

**Funcionalidades**:
- **Estatísticas principais**: Predição, intervalo confiança, unidade
- **Grid responsivo**: Estatísticas organizadas
- **Formatação inteligente**: Números com precisão adequada
- **Indicadores visuais**: Cards com cores temáticas

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

**Funcionalidades**:
- **SVG Polyline**: Renderização leve e responsiva  
- **Normalização automática**: Escala para altura do container
- **Gradiente**: Stroke colorido configurável
- **Responsivo**: Adapta-se ao container pai

#### **Componentes UI Base**

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

### **🎨 Sistema de Temas**

#### **`ThemeProvider.tsx`**

**Funcionalidades**:
- **Dual mode**: data-theme attribute + dark class
- **Persistência**: localStorage com fallback sistema
- **Tailwind sync**: Aplica classe `dark` para compatibilidade
- **Toggle button**: UI integrada no navbar

**Estados**:
- `null`: Auto (sistema)
- `"light"`: Tema claro forçado
- `"dark"`: Tema escuro forçado

#### **`globals.css`** - Design System

**CSS Variables** (temas):
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

**Componentes CSS**:
- `.card`: Containers com hover effects
- `.btn-primary` / `.btn-outline`: Botões padronizados
- `.badge-*`: Status indicators
- Skeleton loading animations
- Scrollbar customizado

**Tailwind Config**:
```javascript
{
  darkMode: ['class', '[data-theme="dark"]'],
  // Suporte duplo: class + data-theme
}
```

### **🔧 Serviços Frontend**

#### **`locationService.ts`**

**Função Principal**:
```typescript
async function geocodeAddress(input: GeocodeInput): Promise<GeocodeResult>
```

**Tipos**:
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

**Funcionalidades**:
- **Integração DistanceMatrix**: API externa para geocoding
- **Construção inteligente**: Endereços a partir de componentes
- **Fallbacks**: rawAddress quando componentes insuficientes
- **Validação**: Status e coordenadas obrigatórias

---

## 🔄 Fluxo de Dados Completo

### **1. Submissão do Formulário**

```
[ForecastForm] 
    → validação Zod 
    → POST /api/geocode 
    → sessionStorage.eventData
    → POST /api/forecast 
    → sessionStorage.forecastData
    → navigate("/forecast")
```

### **2. Processamento Backend**

```
[Next.js /api/forecast] 
    → POST Python-API/collect
        → colect_variables() [NASA Giovanni]
        → transform() [normalização]
        → modelo() [Prophet ML]
    → JSON response
```

### **3. Visualização Resultados**

```
[/forecast page]
    → load sessionStorage
    → MetricSelector interaction
    → DetailedMetric display  
    → AI explanation (opcional)
    → MiniSparkline charts
```

---

## 🌍 Integrações Externas

### **NASA Giovanni API**

**Endpoint**: `https://api.giovanni.earthdata.nasa.gov/timeseries`

**Autenticação**: Bearer Token (configurado em `config_env.py`)

**Parâmetros**:
- `data`: ID da variável MERRA-2
- `location`: `[lat,lon]` 
- `time`: `start/end` (ISO format)

**Rate Limits**: Configurado com ThreadPoolExecutor (max 5 workers)

### **DistanceMatrix API**

**Endpoint**: `https://api.distancematrix.ai/maps/api/geocode/json`

**Autenticação**: API Key em query param

**Uso**: Conversão endereço → coordenadas geográficas

### **Groq API (LLama)**

**Endpoint**: `https://api.groq.com/openai/v1/chat/completions`

**Modelo**: `llama-3.1-70b-versatile`

**Uso**: Geração de explicações meteorológicas em linguagem natural

---

## 📊 Tipos e Interfaces

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

## ⚙️ Configurações e Environment

### **Python (.env)**

```env
# NASA Giovanni API
GIOVANNI_TOKEN=your_nasa_token_here

# Timezone API (se utilizado)
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

## 🚀 Deploy e Execução

### **Python API**

```bash
cd data/
python run.py
# Servidor: http://127.0.0.1:8000
# Timeout: 20 minutos
# Threads: 8
```

### **Next.js Frontend**

```bash
cd web/app/
npm install
npm run dev
# Desenvolvimento: http://localhost:3000

npm run build && npm start  
# Produção: http://localhost:3000
```

### **Dependências Python**

```
Flask
pandas
requests
concurrent.futures
tqdm
prophet
waitress
```

### **Dependências Next.js**

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

## 🔍 Debugging e Logs

### **Python API Logs**

```python
# routes.py
print('Sucesso')  
print(date, lon, lat)  
print('Entrei...')
print('Sucesso sem mod')
print('Sucesso com mod') 

# modelos.py
print('entrei')
print(df_completed.head(1))
print('Passo1', 'Passo2', ..., 'Sucesso1', 'Sucesso2', 'Sucesso3')
print("Iniciando o treinamento do modelo...")
print("Treinamento concluído!")
print("Realizando as previsões...")
print("Previsões geradas!")
```

### **Next.js API Logs**

```typescript
// geocode/route.ts
console.log("[POST /api/geocode]");
console.error("POST /api/geocode error:", e);

// forecast/route.ts  
console.log('[POST /api/forecast] request-id:', h.get('x-request-id'));
console.warn('FORECAST_API_BASE_URL ausente. Retornando fallback MOCK.');
console.log('[forecast-proxy] base="' + base + '" finalUrl="' + url.toString() + '"');

// ai/explain-weather/route.ts
console.error("❌ Erro Groq:", errorText);
console.error("Erro interno:", error);
```

### **Frontend Debug**

```typescript
// locationService.ts
console.log("[geocodeAddress] status:", data.status, "items:", candidates.length, "lat?", lat, "lng?", lng);

// ForecastForm.tsx  
// Auto-save em sessionStorage com try/catch silencioso

// forecast/page.tsx
// Validação de tipos com isStoredEventData()
```

---

## 🎯 Métricas e Performance

### **Python API**

- **Timeout**: 20 minutos para operações longas
- **Concorrência**: 8 threads Waitress + 5 workers ThreadPoolExecutor
- **Cache**: Não implementado (futuro: Redis)
- **Horizonte ML**: 2920 períodos horários (≈4 meses)

### **Next.js Frontend**

- **Bundle Size**: Otimizado com Tree Shaking
- **Images**: Next.js Image Optimization
- **Caching**: 
  - API Routes: `cache: "no-store"`
  - SessionStorage: Auto-save debounced 300ms
- **Loading States**: Skeleton screens para UX

### **APIs Externas**

- **NASA Giovanni**: Rate limit via ThreadPoolExecutor
- **DistanceMatrix**: Pay-per-request
- **Groq**: Token-based billing

---

## 🔐 Segurança

### **Autenticação**

- NASA Giovanni: Bearer Token server-side
- DistanceMatrix: API Key server-side  
- Groq: API Key server-side
- **Nenhuma** credencial exposta no frontend

### **Validação**

- **Backend**: Validação tipos Python + try/catch
- **Frontend**: Zod schema + zodResolver
- **API Routes**: Validação payloads + status codes

### **CORS**

- Next.js API Routes: Same-origin automaticamente
- Python Flask: Não configurado (localhost only)

---

## 🐛 Tratamento de Erros

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
// Cascata de fallbacks
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
if (!eventData) return <p className="text-rose-500">Nenhum dado carregado ainda.</p>;
```

---

## 📈 Roadmap Futuro

### **Melhorias Backend**

- [ ] Cache Redis para dados NASA
- [ ] Banco de dados PostgreSQL
- [ ] API versioning (v1, v2)
- [ ] Rate limiting inteligente
- [ ] Healthcheck endpoints
- [ ] Metrics/observability (Prometheus)

### **Melhorias Frontend**

- [ ] PWA (Service Workers)
- [ ] Geolocalização automática  
- [ ] Compartilhamento social
- [ ] Exportação PDF/PNG
- [ ] Múltiplos eventos simultâneos
- [ ] Histórico de consultas

### **Features ML**

- [ ] Ensemble models (Prophet + LSTM)
- [ ] Uncertainty quantification
- [ ] Seasonal decomposition visualization
- [ ] Weather alerts/notifications
- [ ] Historical comparison

### **UX/UI**

- [ ] Mapas interativos (Leaflet/Mapbox)
- [ ] Charts avançados (@nivo/line, @nivo/bar)
- [ ] Animações micro-interactions
- [ ] Mobile-first design
- [ ] Acessibilidade WCAG 2.1

---

## 📝 Notas de Desenvolvimento

### **Decisões Arquiteturais**

1. **Separação Backend/Frontend**: Permite escalabilidade independente
2. **Next.js API Routes**: Proxy pattern para segurança de credenciais
3. **SessionStorage**: Dados temporários, não persistentes
4. **Prophet ML**: Robusto para séries temporais meteorológicas
5. **Tailwind CSS**: Utility-first para desenvolvimento rápido
6. **TypeScript**: Type safety em toda a aplicação

### **Trade-offs**

- **Performance vs Simplicidade**: Prophet single-threaded, mas confiável
- **Dados Mock vs Real**: Fallback garante demonstração sempre funcional  
- **Client State vs Server State**: SessionStorage para prototipagem rápida
- **CSS Variables vs Tailwind**: Híbrido para flexibilidade temática

### **Convenções**

- **Nomenclatura**: camelCase (JS/TS), snake_case (Python), kebab-case (CSS)
- **Commits**: Conventional Commits
- **Componentes**: PascalCase com JSDoc
- **APIs**: RESTful com JSON response padrão

---

*Documentação gerada para NASA Hackathon 2025 - Will It Rain On My Parade? 🌦️*
