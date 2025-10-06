'use client';
import { Thermometer, Droplets, CloudRain, Wind, Waves, Info } from 'lucide-react';
import React from 'react';

export const metricIcon: Record<string, React.ReactElement> = {
  temperature: <Thermometer className="h-5 w-5" />,
  rain: <CloudRain className="h-5 w-5" />,
  humidity: <Droplets className="h-5 w-5" />,
  wind_speed: <Wind className="h-5 w-5" />,
  water_vapor: <Waves className="h-5 w-5" />,
  _default: <Info className="h-5 w-5" />
};

export const metricLabels: Record<string,string> = {
  temperature: 'Temperature',
  rain: 'Rain',
  humidity: 'Humidity',
  wind_speed: 'Wind Speed',
  water_vapor: 'Water Vapor'
};
