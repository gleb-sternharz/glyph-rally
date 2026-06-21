# Game Logic

The game rules live in `engine.js`.

## Game Creation

`createGame(settings)` builds a game object with:

- selected mode, speed, field size, theme, challenge, and dictionary id
- a board from `createBoard(fieldSize)`
- one or two player objects
- initial items for classic or reading mode
- an initial tick duration from the selected speed

Each player has a body array, direction, pending direction, score, alive flag, and pending growth counter.

## Movement

On each update:

1. Alive players commit their pending directions.
2. The engine plans the next head cell for each alive player.
3. Planned positions wrap around the board edges.
4. The engine checks self collisions, body collisions, and two-player head collisions.
5. Alive players move into their planned head cells.
6. Item hits are resolved.
7. Tails are trimmed or growth is applied.
8. The engine reports events back to `app.js`.

Slow and fast speeds use simultaneous updates for all alive snakes. Manual speed passes the pressed player's index into the engine, so only the snake controlled by that key moves on that key press.

## Border Behavior

Board edges wrap. A snake leaving the right side appears on the left side, and the same applies to all other borders.

## Classic Mode

Classic mode places apples and skulls according to `CLASSIC_ITEM_COUNTS_BY_MODE`.

Apple effect:

- score increases by 1
- snake grows by 2 cells
- automatic speed increases slightly

Skull effect:

- snake shrinks by one extra cell
- no score is awarded

After an item is hit, a replacement item of the same type is placed on a free cell.

## Reading Mode

Reading mode uses the selected dictionary from `SnakeDictionary.getEntries(dictionaryId)`.

Each round:

1. A target entry is picked.
2. The target word is shown above the board.
3. The target icon and several distractor icons are placed on the board.
4. Hitting the icon with the same internal `matchKey` grows the snake and scores.
5. Hitting any other icon shrinks the snake.
6. A new target round starts immediately after any symbol hit.

Dictionary entries do not provide ids. `dictionary.js` derives `matchKey` from the icon path, so icons should be unique within a dictionary.

## End Conditions

The game ends when all players are dead. In two-player mode, it also ends when only one player remains alive.

The winner is determined by survivor status first, then score. Equal scores produce a draw.
