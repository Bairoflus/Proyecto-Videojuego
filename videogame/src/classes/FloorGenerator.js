import { COMBAT_ROOMS, SHOP_ROOM_LAYOUT, BOSS_ROOM_LAYOUT } from '../rooms/combatRooms.js';

export class FloorGenerator {
    constructor() {
        this.currentFloor = [];
        this.currentRoomIndex = 0;
        this.floorCount = 1;
        this.runCount = 1;
        this.generateFloor();
    }

    // Genera un nuevo piso seleccionando 4 salas de combate aleatorias
    generateFloor() {
        console.log("Generating new floor");
        // Seleccionar 4 salas de combate aleatorias únicas
        const combatRooms = this.selectRandomCombatRooms(4);
        
        // Combinar con la tienda y el jefe
        this.currentFloor = [
            ...combatRooms,
            SHOP_ROOM_LAYOUT,
            BOSS_ROOM_LAYOUT
        ];
        
        this.currentRoomIndex = 0;
        console.log("Floor generated with", this.currentFloor.length, "rooms");
    }

    // Selecciona n salas de combate aleatorias únicas
    selectRandomCombatRooms(n) {
        const rooms = [...COMBAT_ROOMS];
        const selected = [];
        
        for (let i = 0; i < n; i++) {
            if (rooms.length === 0) break;
            const randomIndex = Math.floor(Math.random() * rooms.length);
            selected.push(rooms[randomIndex]);
            rooms.splice(randomIndex, 1);
        }
        
        return selected;
    }

    // Obtiene el layout de la sala actual
    getCurrentRoomLayout() {
        if (this.currentRoomIndex >= this.currentFloor.length) {
            console.log("Warning: Room index out of bounds");
            return null;
        }
        return this.currentFloor[this.currentRoomIndex];
    }

    // Avanza a la siguiente sala
    nextRoom() {
        if (this.currentRoomIndex < this.currentFloor.length - 1) {
            this.currentRoomIndex++;
            console.log("Advanced to room", this.currentRoomIndex);
            return true;
        }
        console.log("Cannot advance: Already at last room");
        return false;
    }

    // Retrocede a la sala anterior
    previousRoom() {
        if (this.currentRoomIndex > 0) {
            this.currentRoomIndex--;
            console.log("Returned to room", this.currentRoomIndex);
            return true;
        }
        console.log("Cannot return: Already at first room");
        return false;
    }

    // Verifica si es la primera sala
    isFirstRoom() {
        return this.currentRoomIndex === 0;
    }

    // Verifica si es la última sala
    isLastRoom() {
        return this.currentRoomIndex === this.currentFloor.length - 1;
    }

    // Verifica si es la sala del jefe
    isBossRoom() {
        const isBoss = this.currentRoomIndex === this.currentFloor.length - 1;
        console.log("Is boss room:", isBoss, "Current index:", this.currentRoomIndex, "Total rooms:", this.currentFloor.length);
        return isBoss;
    }

    // Avanza al siguiente piso
    nextFloor() {
        console.log("Advancing to next floor");
        console.log("Current floor:", this.floorCount);
        console.log("Current run:", this.runCount);
        
        this.floorCount++;
        
        // Si llegamos al piso 3, reiniciamos a piso 1 y aumentamos el run
        if (this.floorCount > 3) {
            console.log("Resetting to floor 1 and incrementing run");
            this.floorCount = 1;
            this.runCount++;
        }
        
        // Generar nuevo piso y reiniciar índice de sala
        this.generateFloor();
        
        console.log("New floor:", this.floorCount);
        console.log("New run:", this.runCount);
        console.log("Room index reset to:", this.currentRoomIndex);
        
        return true;
    }

    // Obtiene el índice de la sala actual
    getCurrentRoomIndex() {
        return this.currentRoomIndex;
    }

    // Obtiene el total de salas en el piso
    getTotalRooms() {
        return this.currentFloor.length;
    }

    // Obtiene el número de piso actual
    getCurrentFloor() {
        return this.floorCount;
    }

    // Obtiene el número de run actual
    getCurrentRun() {
        return this.runCount;
    }
} 