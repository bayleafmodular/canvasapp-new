import { ShapeType }  from '@/types';
import { v4 as uuidv4 } from "uuid";

export const defaultTemplates = [
  {
    id: "template_office_layout",
    name: "Small Office Layout (10x8m)",
    category: "Commercial",
    layers: [
      { id: "layer-walls", name: "Walls", visible: true, locked: true, color: "#AAAAAA" },
      { id: "layer-furniture", name: "Furniture", visible: true, locked: false, color: "#4a90e2" }
    ],
    objects: [
      // Outer Boundary Walls (10m x 8m)
      { id: uuidv4(), type: ShapeType.WALL, x: 0, y: 0, points: [0, 0, 10000, 0], layerId: "layer-walls" },
      { id: uuidv4(), type: ShapeType.WALL, x: 0, y: 0, points: [10000, 0, 10000, 8000], layerId: "layer-walls" },
      { id: uuidv4(), type: ShapeType.WALL, x: 0, y: 0, points: [10000, 8000, 0, 8000], layerId: "layer-walls" },
      { id: uuidv4(), type: ShapeType.WALL, x: 0, y: 0, points: [0, 8000, 0, 0], layerId: "layer-walls" },
      
      // Internal Wall 1: Corridor (Horizontal)
      { id: uuidv4(), type: ShapeType.WALL, x: 0, y: 0, points: [0, 3000, 7000, 3000], layerId: "layer-walls" },
      
      // Internal Wall 2: Manager Cabin (Vertical)
      { id: uuidv4(), type: ShapeType.WALL, x: 0, y: 0, points: [7000, 0, 7000, 3000], layerId: "layer-walls" },
      
      // Internal Wall 3: Meeting Room (Vertical)
      { id: uuidv4(), type: ShapeType.WALL, x: 0, y: 0, points: [4000, 0, 4000, 3000], layerId: "layer-walls" },
      
      // Internal Wall 4: Restroom/Pantry (Vertical)
      { id: uuidv4(), type: ShapeType.WALL, x: 0, y: 0, points: [7000, 3000, 7000, 8000], layerId: "layer-walls" },

      // Meeting Room Table (Rectangle)
      { id: uuidv4(), type: ShapeType.RECTANGLE, x: 1000, y: 1000, width: 2000, height: 1000, layerId: "layer-furniture" },
      
      // Manager Desk (Rectangle)
      { id: uuidv4(), type: ShapeType.RECTANGLE, x: 7500, y: 1000, width: 1500, height: 800, layerId: "layer-furniture" },
      
      // Open Workspace Desks
      { id: uuidv4(), type: ShapeType.RECTANGLE, x: 1000, y: 4000, width: 1200, height: 800, layerId: "layer-furniture" },
      { id: uuidv4(), type: ShapeType.RECTANGLE, x: 2500, y: 4000, width: 1200, height: 800, layerId: "layer-furniture" },
      { id: uuidv4(), type: ShapeType.RECTANGLE, x: 4000, y: 4000, width: 1200, height: 800, layerId: "layer-furniture" },
      { id: uuidv4(), type: ShapeType.RECTANGLE, x: 1000, y: 5500, width: 1200, height: 800, layerId: "layer-furniture" },
      { id: uuidv4(), type: ShapeType.RECTANGLE, x: 2500, y: 5500, width: 1200, height: 800, layerId: "layer-furniture" },
      { id: uuidv4(), type: ShapeType.RECTANGLE, x: 4000, y: 5500, width: 1200, height: 800, layerId: "layer-furniture" },
    ]
  },
  {
    id: "template_2bhk",
    name: "2BHK Apartment",
    category: "Residential",
    layers: [
      { id: "layer-walls", name: "Walls", visible: true, locked: true, color: "#FFFFFF" }
    ],
    objects: [
      // Outer Walls
      { id: uuidv4(), type: ShapeType.WALL, x: 0, y: 0, points: [0, 0, 8000, 0], layerId: "layer-walls" },
      { id: uuidv4(), type: ShapeType.WALL, x: 0, y: 0, points: [8000, 0, 8000, 10000], layerId: "layer-walls" },
      { id: uuidv4(), type: ShapeType.WALL, x: 0, y: 0, points: [8000, 10000, 0, 10000], layerId: "layer-walls" },
      { id: uuidv4(), type: ShapeType.WALL, x: 0, y: 0, points: [0, 10000, 0, 0], layerId: "layer-walls" },
      // Bedroom 1
      { id: uuidv4(), type: ShapeType.WALL, x: 0, y: 0, points: [0, 4000, 4000, 4000], layerId: "layer-walls" },
      { id: uuidv4(), type: ShapeType.WALL, x: 0, y: 0, points: [4000, 0, 4000, 4000], layerId: "layer-walls" },
      // Bedroom 2
      { id: uuidv4(), type: ShapeType.WALL, x: 0, y: 0, points: [4000, 4000, 8000, 4000], layerId: "layer-walls" },
      // Bathroom
      { id: uuidv4(), type: ShapeType.WALL, x: 0, y: 0, points: [4000, 4000, 4000, 6000], layerId: "layer-walls" },
      { id: uuidv4(), type: ShapeType.WALL, x: 0, y: 0, points: [4000, 6000, 6000, 6000], layerId: "layer-walls" },
      { id: uuidv4(), type: ShapeType.WALL, x: 0, y: 0, points: [6000, 4000, 6000, 6000], layerId: "layer-walls" },
    ]
  }
];
