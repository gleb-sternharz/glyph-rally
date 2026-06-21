(function (window) {
  "use strict";

  const { DIRS } = window.SnakeConfig;

  function createRenderer(canvas) {
    const ctx = canvas.getContext("2d");

    function resize(board) {
      canvas.width = board.cols * board.cell;
      canvas.height = board.rows * board.cell;
    }

    function draw(game, palette) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawBoard(game.board, palette);
      drawFood(game, palette);
      for (const player of game.players) {
        drawSnake(game.board, player, palette);
      }
    }

    function drawBoard(board, palette) {
      ctx.fillStyle = palette.canvasBg;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.strokeStyle = palette.canvasGrid;
      ctx.lineWidth = 1;
      for (let x = 0; x <= board.cols; x += 1) {
        ctx.beginPath();
        ctx.moveTo(x * board.cell + 0.5, 0);
        ctx.lineTo(x * board.cell + 0.5, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y <= board.rows; y += 1) {
        ctx.beginPath();
        ctx.moveTo(0, y * board.cell + 0.5);
        ctx.lineTo(canvas.width, y * board.cell + 0.5);
        ctx.stroke();
      }

      ctx.strokeStyle = palette.canvasBorder;
      ctx.lineWidth = 2;
      ctx.strokeRect(1, 1, canvas.width - 2, canvas.height - 2);
    }

    function drawFood(game, palette) {
      for (const food of game.food) {
        const x = food.x * game.board.cell;
        const y = food.y * game.board.cell;
        const center = game.board.cell / 2;

        ctx.fillStyle = palette.food;
        ctx.beginPath();
        ctx.arc(x + center, y + center, game.board.cell * 0.34, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = palette.foodHighlight;
        ctx.beginPath();
        ctx.arc(x + center - 3, y + center - 4, game.board.cell * 0.1, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    function drawSnake(board, player, palette) {
      const color = player.alive ? player.color : palette.deadSnake;
      const inset = 3;

      player.body.forEach((segment, index) => {
        const x = segment.x * board.cell + inset;
        const y = segment.y * board.cell + inset;
        const size = board.cell - inset * 2;
        const alpha = player.alive ? Math.max(0.36, 1 - index * 0.025) : 0.42;

        ctx.globalAlpha = alpha;
        ctx.fillStyle = color;
        roundRect(ctx, x, y, size, size, index === 0 ? 7 : 5);
        ctx.fill();

        if (index === 0) {
          drawEyes(board, segment, player.dir, player.alive, palette);
        }
      });

      ctx.globalAlpha = 1;
    }

    function drawEyes(board, head, dirName, alive, palette) {
      const x = head.x * board.cell;
      const y = head.y * board.cell;
      const dir = DIRS[dirName];
      const side = dir.x !== 0;
      const eyeColor = alive ? palette.eye : palette.deadEye;
      const positions = side
        ? [
            { x: x + 12 + dir.x * 5, y: y + 7 },
            { x: x + 12 + dir.x * 5, y: y + 17 },
          ]
        : [
            { x: x + 7, y: y + 12 + dir.y * 5 },
            { x: x + 17, y: y + 12 + dir.y * 5 },
          ];

      ctx.fillStyle = eyeColor;
      for (const eye of positions) {
        ctx.beginPath();
        ctx.arc(eye.x, eye.y, 2.4, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    return {
      draw,
      drawBoard,
      resize,
    };
  }

  function roundRect(context, x, y, width, height, radius) {
    const r = Math.min(radius, width / 2, height / 2);
    context.beginPath();
    context.moveTo(x + r, y);
    context.arcTo(x + width, y, x + width, y + height, r);
    context.arcTo(x + width, y + height, x, y + height, r);
    context.arcTo(x, y + height, x, y, r);
    context.arcTo(x, y, x + width, y, r);
    context.closePath();
  }

  window.SnakeRenderer = {
    createRenderer,
  };
})(window);
