import { COMBAT_ROOMS, SHOP_ROOM_LAYOUT, BOSS_ROOM_LAYOUT } from '../rooms/combatRooms.js';

export class FloorGenerator {
    constructor() {
        this.currentFloor = [];
        this.currentRoomIndex = 0;
        this.generateFloor();
    }

    // Genera un nuevo piso seleccionando 4 salas de combate aleatorias
    generateFloor() {
        // Seleccionar 4 salas de combate aleatorias únicas
        const combatRooms = this.selectRandomCombatRooms(4);
        
        // Combinar con la tienda y el jefe
        this.currentFloor = [
            ...combatRooms,
            SHOP_ROOM_LAYOUT,
            BOSS_ROOM_LAYOUT
        ];
        
        this.currentRoomIndex = 0;
    }

    // Selecciona n salas de combate aleatorias únicas
    selectRandomCombatRooms(n) {
        const rooms = [...COMBAT_ROOMS];
        const selected = [];
        
        for (let i = 0; i < n; i++) {
            if (rooms.length === 0) break; // Evitar error si no hay suficientes salas
            const randomIndex = Math.floor(Math.random() * rooms.length);
            selected.push(rooms[randomIndex]);
            rooms.splice(randomIndex, 1);
        }
        
        return selected;
    }

    // Obtiene el layout de la sala actual
    getCurrentRoomLayout() {
        if (this.currentRoomIndex >= this.currentFloor.length) {
            return null; // Evitar error si el índice está fuera de rango
        }
        return this.currentFloor[this.currentRoomIndex];
    }

    // Avanza a la siguiente sala
    nextRoom() {
        if (this.currentRoomIndex < this.currentFloor.length - 1) {
            this.currentRoomIndex++;
            return true;
        }
        return false;
    }

    // Verifica si es la última sala
    isLastRoom() {
        return this.currentRoomIndex === this.currentFloor.length - 1;
    }

    // Obtiene el índice de la sala actual
    getCurrentRoomIndex() {
        return this.currentRoomIndex;
    }

    // Obtiene el total de salas en el piso
    getTotalRooms() {
        return this.currentFloor.length;
    }
} 