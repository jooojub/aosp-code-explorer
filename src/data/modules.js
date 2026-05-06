import { Camera, Mouse, Monitor, Volume2, Cpu, Wifi } from 'lucide-react';

export const MODULES = [
  { id: 'camera',   label: 'Camera',         icon: Camera,  color: '#2563eb', ready: true  },
  { id: 'input',    label: 'Input / HID',     icon: Mouse,   color: '#7c3aed', ready: true  },
  { id: 'display',  label: 'Display',         icon: Monitor, color: '#0891b2', ready: false },
  { id: 'audio',    label: 'Audio',           icon: Volume2, color: '#059669', ready: false },
  { id: 'sensor',   label: 'Sensors',         icon: Cpu,     color: '#d97706', ready: false },
  { id: 'network',  label: 'Network',         icon: Wifi,    color: '#dc2626', ready: false },
];
