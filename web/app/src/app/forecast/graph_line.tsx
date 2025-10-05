
import Plotly from 'plotly.js-dist';
import { useEffect, useRef } from 'react';

type GraphLineProps = {
  metric: 'temperature' | 'humidity' | 'rain' | 'wind_speed' | 'water_vapor';
  color?: string;
  label?: string;
  unit?: string;
};

export default function GraphLine({ metric, color = '#09731eff', label, unit }: GraphLineProps) {
  const graphRef = useRef<HTMLDivElement>(null);
  const apiDataRaw = sessionStorage.getItem('forecastData');
  const apiData = apiDataRaw ? JSON.parse(apiDataRaw) : null;

  useEffect(() => {
    if (!graphRef.current || !apiData) return;
    // Extrai os timestamps e valores da métrica escolhida
    console.log(metric); // Debug: Verifica os dados da API
    const timestamps = apiData.metrics?.[metric]?.series?.timestamp || [];
    const values = apiData.metrics?.[metric]?.series?.values || [];
    console.log(values);
    // Extrai apenas os horários (HH:MM) dos timestamps
    const hours = timestamps.map((ts: string) => {
      const date = new Date(ts.replace(' ', 'T'));
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    });

    const data = [
      {
        x: hours,
        y: values,
        mode: 'lines+markers',
        name: label || metric,
        line: { color }
      }
    ];

    const layout = {
      title: {
        text: `Variação de ${label || metric}`,
        font: {
          family: 'Montserrat, Arial, sans-serif',
          size: 24,
          color: '#0099ff',
          weight: 'bold'
        },
        xref: 'paper',
        x: 0.5,
      },
      uirevision: 'true',
      xaxis: {
        title: {
          text: 'Horário',
          font: {
            family: 'Montserrat, Arial, sans-serif',
            size: 18,
            color: '#0099ff',
          }
        },
        type: 'category',
        tickfont: {
          family: 'Montserrat, Arial, sans-serif',
          size: 14,
          color: '#0099ff',
        },
        showgrid: false,
        zeroline: false,
      },
      yaxis: {
        title: {
          text: `${label || metric}${unit ? ` (${unit})` : ''}`,
          font: {
            family: 'Montserrat, Arial, sans-serif',
            size: 18,
            color: '#0099ff',
          }
        },
        autorange: true,
        tickfont: {
          family: 'Montserrat, Arial, sans-serif',
          size: 14,
          color: '#0099ff',
        },
        gridcolor: '#b3e0ff',
        gridwidth: 1,
        showline: false,
        zerolinewidth: 1,
        zeroline: false,
      },
      legend: {
        orientation: 'h',
        x: 0.5,
        y: -0.2,
        xanchor: 'center',
        font: {
          family: 'Montserrat, Arial, sans-serif',
          size: 14,
          color: '#0099ff',
        }
      },
      paper_bgcolor: 'rgba(0,0,0,0)',
      plot_bgcolor: 'rgba(0,0,0,0)',
      margin: { t: 60, r: 30, b: 80, l: 60 },
    };

    Plotly.react(graphRef.current, data, layout, { responsive: true });
  }, [metric, color, label, unit, apiData]);

  return <div ref={graphRef} id="graphDiv" style={{ width: '100%', height: '350px' }} />;
}