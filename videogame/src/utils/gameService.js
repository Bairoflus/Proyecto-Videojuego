/**
 * Servicio centralizado para carga de datos del juego
 * Unifica la lógica de obtención de rooms, enemies, etc.
 */

import { getRooms, getEnemies, getBosses, createRun } from './api.js';
import { getSessionToken, getUserId } from './auth.js';

/**
 * Cargar todos los datos necesarios para el juego
 * @returns {Promise<Object>} Objeto con rooms, enemies, bosses
 */
export async function loadGameData() {
    try {
        console.log('Cargando datos del juego...');
        
        // Ejecutar llamadas en paralelo para mejor rendimiento
        const [rooms, enemies, bosses] = await Promise.all([
            getRooms(),
            getEnemies(), 
            getBosses()
        ]);
        
        console.log(`✅ Datos cargados: ${rooms.length} salas, ${enemies.length} enemigos, ${bosses.length} jefes`);
        
        return {
            rooms: rooms || [],
            enemies: enemies || [],
            bosses: bosses || [],
            success: true
        };
        
    } catch (error) {
        console.error('❌ Error cargando datos del juego:', error);
        
        // Devolver datos de fallback para que el juego pueda funcionar
        return {
            rooms: getFallbackRooms(),
            enemies: getFallbackEnemies(),
            bosses: [],
            success: false,
            error: error.message
        };
    }
}

/**
 * Crear nueva partida para el usuario actual
 * @returns {Promise<Object|null>} Datos de la partida creada o null si falla
 */
export async function createGameRun() {
    try {
        const userId = getUserId();
        if (!userId) {
            throw new Error('No hay usuario logueado');
        }
        
        console.log('Creando nueva partida...');
        const result = await createRun(userId);
        
        // Guardar runId en sessionStorage para uso posterior
        sessionStorage.setItem('currentRunId', result.runId);
        
        console.log(`✅ Partida creada: ID ${result.runId}`);
        return result;
        
    } catch (error) {
        console.error('❌ Error creando partida:', error);
        return null;
    }
}

/**
 * Obtener runId actual desde sessionStorage
 */
export function getCurrentRunId() {
    return sessionStorage.getItem('currentRunId');
}

/**
 * Validar que tenemos todos los datos necesarios para el juego
 */
export function validateGameData(gameData) {
    const errors = [];
    
    if (!gameData.rooms || gameData.rooms.length === 0) {
        errors.push('No se encontraron salas del juego');
    }
    
    if (!gameData.enemies || gameData.enemies.length === 0) {
        errors.push('No se encontraron enemigos del juego');
    }
    
    return {
        isValid: errors.length === 0,
        errors
    };
}

/**
 * Mostrar error simple al usuario
 */
export function showGameError(message) {
    // Mostrar error simple - sin modales complejos
    alert(`Error en el juego: ${message}`);
}

/**
 * Mostrar mensaje de éxito al usuario
 */
export function showGameSuccess(message) {
    console.log(`✅ ${message}`);
}

// ================================================================
// DATOS DE FALLBACK PARA CASOS DE ERROR
// ================================================================

function getFallbackRooms() {
    return [
        { room_id: 1, floor: 1, name: 'Sala de Inicio', room_type: 'combat', sequence_order: 1 },
        { room_id: 2, floor: 1, name: 'Sala de Prueba', room_type: 'combat', sequence_order: 2 },
        { room_id: 3, floor: 1, name: 'Jefe Final', room_type: 'boss', sequence_order: 3 }
    ];
}

function getFallbackEnemies() {
    return [
        { enemy_id: 1, name: 'Goblin', floor: 1, base_hp: 50, base_damage: 10 },
        { enemy_id: 2, name: 'Orc', floor: 1, base_hp: 80, base_damage: 15 },
        { enemy_id: 100, name: 'Boss', floor: 1, base_hp: 200, base_damage: 25 }
    ];
} 