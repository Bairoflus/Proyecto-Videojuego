// ASCII layouts for game rooms
// 'P' = Player
// 'W' = Wall
// 'C' = Coin
// 'S' = Shop
// 'B' = Boss
// '.' = Empty space

export const COMBAT_ROOMS = [
    // 1. 
    `WWWWWWWWWWWWWWWWWWWWWWWWW
W..........WWW..........W
W.......................W
W.......................W
W.......................W
W.......................W
W.......................W
W.......................W
W.......................W
WP......................W
W.......................W
W.......................W
W.......................W
W.......................W
W.......................W
W.......................W
W.......................W
W..........WWW..........W
WWWWWWWWWWWWWWWWWWWWWWWWW`,
    // 2. 
    `WWWWWWWWWWWWWWWWWWWWWWWWW
W.......................W
W.......................W
W.......................W
W.....WW................W
W.....WW................W
W.......................W
W..................WW...W
W.......................W
WP......................W
W.......................W
W..................WW...W
W.......................W
W.....WW................W
W.....WW................W
W.......................W
W.......................W
W.......................W
WWWWWWWWWWWWWWWWWWWWWWWWW`,
    // 3. 
    `WWWWWWWWWWWWWWWWWWWWWWWWW
W.......................W
W.......................W
W.......................W
W.....WWW...............W
W.....W...........W.....W
W.....W..........WW.....W
W.......................W
W.......................W
WP.........WWW..........W
W.......................W
W.......................W
W.....W..........WW.....W
W.....W...........W.....W
W.....WWW...............W
W.......................W
W.......................W
W.......................W
WWWWWWWWWWWWWWWWWWWWWWWWW`,
    // 4. 
    `WWWWWWWWWWWWWWWWWWWWWWWWW
W..........WWWW.........W
W.......................W
W.......................W
W.......................W
W..........WWW..........W
W...........W...........W
W.......................W
W.......................W
WP......................W
W.......................W
W.......................W
W...........W...........W
W..........WWW..........W
W.......................W
W.......................W
W.......................W
W..........WWWW.........W
WWWWWWWWWWWWWWWWWWWWWWWWW`,
    // 5.
    `WWWWWWWWWWWWWWWWWWWWWWWWW
W.......................W
W.......................W
W.......................W
W.....WW........WW......W
W.....WW........WW......W
W.......................W
W.......................W
W...........W...........W
WP.........WW...........W
W...........W...........W
W.......................W
W.......................W
W.....WW........WW......W
W.....WW........WW......W
W.......................W
W.......................W
W.......................W
WWWWWWWWWWWWWWWWWWWWWWWWW`,
    // 6. 
    `WWWWWWWWWWWWWWWWWWWWWWWWW
W.......................W
W.......................W
W.......................W
W.....WW.........WW.....W
W......W.........WW.....W
W.......................W
W.......................W
WP......................W
W..........WWw..........W
W..........WWw..........W
W.......................W
W.......................W
W......W.........WW.....W
W.....WW.........WW.....W
W.......................W
W.......................W
W.......................W
WWWWWWWWWWWWWWWWWWWWWWWWW`,
    // 7. 
    `WWWWWWWWWWWWWWWWWWWWWWWWW
W.......................W
W.......................W
W.......................W
W.........WW............W
W.........WW............W
W.........WW............W
W.......................W
W.................WW....W
WP................WW....W
W.................WW....W
W.......................W
W.........WW............W
W.........WW............W
W.........Ww............W
W.......................W
W.......................W
W.......................W
WWWWWWWWWWWWWWWWWWWWWWWWW`,
    // 8. 
    `WWWWWWWWWWWWWWWWWWWWWWWWW
W.......................W
W.......................W
W.....WWWW..............W
W........W.......WWW....W
W........W..............W
W.......................W
W.......................W
W.......................W
WP......................W
W.......................W
W.......................W
W.....WWWW..............W
W........W.......WWW....W
W........W..............W
W.......................W
W.......................W
W.......................W
WWWWWWWWWWWWWWWWWWWWWWWWW`,
    // 9. 
    `WWWWWWWWWWWWWWWWWWWWWWWWW
W......WWWWWWWW.........W
W............WW.........W
W.............W.........W
W.......................W
W.......................W
W.......................W
W..................W....W
W.................WW....W
WP...............WWW....W
W.................WW....W
W..................W....W
W.......................W
W.......................W
W.......................W
W.............W.........W
W............WW.........W
W......WWWWWWWW.........W
WWWWWWWWWWWWWWWWWWWWWWWWW`,
    // 10. 
    `WWWWWWWWWWWWWWWWWWWWWWWWW
W.......................W
W.......................W
W.......................W
W.......................W
W.......WWWW............W
W........WWWW...........W
W.........WWWW..........W
W..........WWWW.........W
WP..........WWWW........W
W............WWW........W
W.....W.......WWW.......W
W.....WW.......WW.......W
W.....WWW.......W.......W
W.....WWWW..............W
W.......................W
W.......................W
W.......................W
WWWWWWWWWWWWWWWWWWWWWWWWW`,
    // 11.
    `WWWWWWWWWWWWWWWWWWWWWWWWW
W...............WWWWW...W
W.................WWW...W
W..................WW...W
W...................W...W
W.......................W
W............WWW........W
W.............WW........W
W..............W........W
WP......................W
W.......................W
W........W..............W
W.......WW..............W
W......WWW..............W
W.......................W
W.......................W
W.......................W
W...WWWWW...............W
WWWWWWWWWWWWWWWWWWWWWWWWW`,
    // 12. 
    `WWWWWWWWWWWWWWWWWWWWWWWWW
W.......................W
W.......................W
W.......................W
W.......................W
W.......................W
W..........W............W
W.........WWW...........W
W........WWWWW..........W
WP......WWWWWWW.........W
W........WWWWW..........W
W.........WWW...........W
W..........W............W
W.......................W
W.......................W
W.......................W
W.......................W
W.......................W
WWWWWWWWWWWWWWWWWWWWWWWWW`
];

// Shop room layout
export const SHOP_ROOM_LAYOUT =
    `WWWWWWWWWWWWWWWWWWWWWWWWW
W.......................W
W.......................W
W.......................W
W.......................W
W.......................W
W.......................W
W.......................W
W.......................W
W...........S...........W
WP......................W
W.......................W
W.......................W
W.......................W
W.......................W
W.......................W
W.......................W
W.......................W
WWWWWWWWWWWWWWWWWWWWWWWWW`;

// Boss room layout
export const BOSS_ROOM_LAYOUT =
    `WWWWWWWWWWWWWWWWWWWWWWWWW
W.......................W
W.......................W
W.......................W
W.......................W
W.......................W
W.......................W
W.......................W
W.......................W
W.......................W
W.......................W
W.......................W
W.......................W
W.......................W
W.......................W
W.......................W
W.......................W
W.......................W
WWWWWWWWWWWWWWWWWWWWWWWWW`;