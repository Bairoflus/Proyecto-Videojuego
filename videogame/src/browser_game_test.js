/**
 * Browser Game Testing Suite
 * Provides testing functionality for the Shattered Timeline game
 */

// Basic testing functions for the game
window.testGame = function() {
    console.log('=== GAME TESTING SUITE ===');
    console.log('Testing game state...');
    
    if (typeof window.game !== 'undefined') {
        const game = window.game;
        console.log('✅ Game instance found');
        console.log('Game state:', game.gameState);
        console.log('Player state:', {
            health: game.player?.health,
            stamina: game.player?.stamina,
            gold: game.player?.gold,
            position: game.player?.position
        });
        console.log('Current room:', game.currentRoom?.roomType);
        console.log('Floor info:', {
            floor: game.floorGenerator?.getCurrentFloor(),
            room: game.floorGenerator?.getCurrentRoomIndex()
        });
    } else {
        console.log('❌ Game instance not found');
    }
    
    console.log('=== Testing complete ===');
};

window.testMapping = function() {
    console.log('=== ROOM MAPPING TEST ===');
    
    if (typeof window.game !== 'undefined' && window.game.floorGenerator) {
        const floorGen = window.game.floorGenerator;
        console.log('Current mapping:', {
            floor: floorGen.getCurrentFloor(),
            room: floorGen.getCurrentRoomIndex(),
            roomType: floorGen.getCurrentRoom()?.roomType,
            totalRooms: floorGen.getTotalRooms()
        });
    } else {
        console.log('❌ Floor generator not available');
    }
    
    console.log('=== Mapping test complete ===');
};

window.dumpGame = function() {
    console.log('=== DETAILED GAME STATE DUMP ===');
    
    if (typeof window.game !== 'undefined') {
        const game = window.game;
        
        // Comprehensive game state dump
        const gameState = {
            gameState: game.gameState,
            isReady: game.isReady,
            isPaused: game.isPaused,
            player: game.player ? {
                health: game.player.health,
                maxHealth: game.player.maxHealth,
                stamina: game.player.stamina,
                maxStamina: game.player.maxStamina,
                gold: game.player.gold,
                weaponType: game.player.weaponType,
                position: game.player.position
            } : null,
            currentRoom: game.currentRoom ? {
                roomType: game.currentRoom.roomType,
                enemyCount: game.currentRoom.objects?.enemies?.length || 0,
                hasShop: !!game.currentRoom.objects?.shop
            } : null,
            floorGenerator: game.floorGenerator ? {
                currentFloor: game.floorGenerator.getCurrentFloor(),
                currentRoom: game.floorGenerator.getCurrentRoomIndex(),
                totalRooms: game.floorGenerator.getTotalRooms()
            } : null,
            managers: {
                saveState: game.managersInitialized ? 'initialized' : 'not initialized',
                sessionData: {
                    userId: localStorage.getItem('currentUserId'),
                    sessionId: localStorage.getItem('currentSessionId'),
                    runId: localStorage.getItem('currentRunId'),
                    testMode: localStorage.getItem('testMode')
                }
            }
        };
        
        console.log('Game State:', JSON.stringify(gameState, null, 2));
    } else {
        console.log('❌ Game instance not found');
    }
    
    console.log('=== Game dump complete ===');
};

// Initialize testing commands
console.log('🧪 Browser Game Testing Suite Loaded');
console.log('Available commands:');
console.log('  testGame() - Run basic game state tests');
console.log('  testMapping() - Test room mapping accuracy');
console.log('  dumpGame() - Show detailed game state info'); 