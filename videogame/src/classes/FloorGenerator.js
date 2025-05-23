import { COMBAT_ROOMS, SHOP_ROOM_LAYOUT, BOSS_ROOM_LAYOUT } from '../rooms/combatRooms.js';

export class FloorGenerator {
    constructor() {
        this.currentFloor = [];
        this.currentRoomIndex = 0;
        this.floorCount = 1;
        this.runCount = 1;
        this.generateFloor();
    }

    // Generates a new floor with random rooms
    generateFloor() {
        // Select 4 random combat rooms
        const combatRooms = this.selectRandomCombatRooms(4);
        
        // Create floor layout: 4 combat rooms + shop + boss
        this.currentFloor = [
            ...combatRooms,
            SHOP_ROOM_LAYOUT,
            BOSS_ROOM_LAYOUT
        ];
        
        // Reset room index to start of new floor
        this.currentRoomIndex = 0;
        
        console.log("Generated new floor", this.floorCount, "with", this.currentFloor.length, "rooms");
    }

    // Selects n unique random combat rooms
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

    // Gets current room layout
    getCurrentRoomLayout() {
        if (this.currentRoomIndex >= this.currentFloor.length) {
            console.log("Warning: Room index out of bounds");
            return null;
        }
        return this.currentFloor[this.currentRoomIndex];
    }

    // Advances to next room
    nextRoom() {
        if (this.currentRoomIndex < this.currentFloor.length - 1) {
            this.currentRoomIndex++;
            console.log("Advanced to room", this.currentRoomIndex);
            return true;
        }
        console.log("Cannot advance: Already at last room");
        return false;
    }

    // Returns to previous room
    previousRoom() {
        if (this.currentRoomIndex > 0) {
            this.currentRoomIndex--;
            console.log("Returned to room", this.currentRoomIndex);
            return true;
        }
        console.log("Cannot return: Already at first room");
        return false;
    }

    // Checks if it's the first room
    isFirstRoom() {
        return this.currentRoomIndex === 0;
    }

    // Checks if it's the boss room
    isBossRoom() {
        const isBoss = this.currentRoomIndex === this.currentFloor.length - 1;
        console.log("Is boss room:", isBoss, "Current index:", this.currentRoomIndex, "Total rooms:", this.currentFloor.length);
        return isBoss;
    }

    // Advances to next floor
    nextFloor() {
        if (this.floorCount >= 3) {
            // If we're at floor 3, increment run and reset floor
            this.runCount++;
            this.floorCount = 1;
            console.log("Completed floor 3, starting new run:", this.runCount);
        } else {
            // Otherwise just increment floor
            this.floorCount++;
            console.log("Advanced to floor", this.floorCount);
        }
        
        // Generate new floor and reset room index
        this.generateFloor();
    }

    // Gets current floor number
    getCurrentFloor() {
        return this.floorCount;
    }

    // Gets current run number
    getCurrentRun() {
        return this.runCount;
    }

    // Gets current room index
    getCurrentRoomIndex() {
        return this.currentRoomIndex;
    }

    // Gets total rooms in floor
    getTotalRooms() {
        return this.currentFloor.length;
    }
} 