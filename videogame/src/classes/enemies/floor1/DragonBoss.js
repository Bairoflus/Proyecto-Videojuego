import { Boss } from "../../entities/Boss.js";

export class DragonBoss extends Boss {
    constructor(position) {
        const width = 64;
        const height = 64;
        const maxHp = 500;
        const color = "red";

        const attacks = [
            {
                name: "Fireball",
                phase: 1,
                cooldown: 3000,
                execute: (self) => {
                    console.log("DragonBoss uses Fireball!");
                    // Lógica para disparar una bola de fuego
                }
            },
            {
                name: "Flame Pillar",
                phase: 2,
                cooldown: 5000,
                execute: (self) => {
                    console.log("DragonBoss summons Flame Pillar!");
                    // Lógica para invocar llamas en el suelo
                }
            },
            {
                name: "Fire Rain",
                phase: 3,
                cooldown: 7000,
                execute: (self) => {
                    console.log("DragonBoss casts Fire Rain!");
                    // Lógica para hacer llover fuego desde el cielo
                }
            }
        ];

        super(position, width, height, color, maxHp, attacks);
    }
}