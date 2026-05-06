import inputJson from './input.json';
import { parseModuleData } from '../loaders/parseModuleData';

export const { CANVAS_W, CANVAS_H, NODE_W, NODE_H, LEFT_PAD, LAYERS, NODES, EDGES } =
  parseModuleData(inputJson);
