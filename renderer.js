(function (window) {
  "use strict";

  const { DIRS } = window.SnakeConfig;

  function createRenderer(canvas) {
    const ctx = canvas.getContext("2d");
    const arena = canvas.parentElement;
    const metrics = {
      width: 0,
      height: 0,
      cell: 0,
      offsetX: 0,
      offsetY: 0,
      dpr: 1,
    };

    function resize(board) {
      const preferredWidth = board.cols * board.cell;

      if (arena) {
        arena.style.width = `${preferredWidth}px`;
        arena.style.maxWidth = "100%";
        arena.style.aspectRatio = `${board.cols} / ${board.rows}`;
      }

      syncCanvas(board);
    }

    function draw(game, palette) {
      syncCanvas(game.board);
      ctx.clearRect(0, 0, metrics.width, metrics.height);
      drawBoard(game.board, palette);
      drawFood(game, palette);
      for (const player of game.players) {
        drawSnake(game.board, player, palette);
      }
    }

    function drawBoard(board, palette) {
      syncCanvas(board);
      ctx.fillStyle = palette.canvasBg;
      ctx.fillRect(0, 0, metrics.width, metrics.height);

      ctx.strokeStyle = palette.canvasGrid;
      ctx.lineWidth = 1;
      for (let x = 0; x <= board.cols; x += 1) {
        const lineX = metrics.offsetX + x * metrics.cell;
        ctx.beginPath();
        ctx.moveTo(lineX + 0.5, metrics.offsetY);
        ctx.lineTo(lineX + 0.5, metrics.offsetY + board.rows * metrics.cell);
        ctx.stroke();
      }
      for (let y = 0; y <= board.rows; y += 1) {
        const lineY = metrics.offsetY + y * metrics.cell;
        ctx.beginPath();
        ctx.moveTo(metrics.offsetX, lineY + 0.5);
        ctx.lineTo(metrics.offsetX + board.cols * metrics.cell, lineY + 0.5);
        ctx.stroke();
      }

      ctx.strokeStyle = palette.canvasBorder;
      ctx.lineWidth = 2;
      ctx.strokeRect(
        metrics.offsetX + 1,
        metrics.offsetY + 1,
        board.cols * metrics.cell - 2,
        board.rows * metrics.cell - 2,
      );
    }

    function drawFood(game, palette) {
      for (const food of game.food) {
        const x = metrics.offsetX + food.x * metrics.cell;
        const y = metrics.offsetY + food.y * metrics.cell;
        const center = metrics.cell / 2;

        ctx.fillStyle = palette.food;
        ctx.beginPath();
        ctx.arc(x + center, y + center, metrics.cell * 0.34, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = palette.foodHighlight;
        ctx.beginPath();
        ctx.arc(
          x + center - metrics.cell * 0.13,
          y + center - metrics.cell * 0.17,
          metrics.cell * 0.1,
          0,
          Math.PI * 2,
        );
        ctx.fill();
      }
    }

    function drawSnake(board, player, palette) {
      const color = player.alive ? player.color : palette.deadSnake;
      const inset = Math.max(1.5, metrics.cell * 0.13);

      player.body.forEach((segment, index) => {
        const x = metrics.offsetX + segment.x * metrics.cell + inset;
        const y = metrics.offsetY + segment.y * metrics.cell + inset;
        const size = metrics.cell - inset * 2;
        const alpha = player.alive ? Math.max(0.36, 1 - index * 0.025) : 0.42;

        ctx.globalAlpha = alpha;
        ctx.fillStyle = color;
        roundRect(ctx, x, y, size, size, index === 0 ? metrics.cell * 0.29 : metrics.cell * 0.21);
        ctx.fill();

        if (index === 0) {
          drawEyes(board, segment, player.dir, player.alive, palette);
        }
      });

      ctx.globalAlpha = 1;
    }

    function drawEyes(board, head, dirName, alive, palette) {
      const x = metrics.offsetX + head.x * metrics.cell;
      const y = metrics.offsetY + head.y * metrics.cell;
      const dir = DIRS[dirName];
      const side = dir.x !== 0;
      const eyeColor = alive ? palette.eye : palette.deadEye;
      const center = metrics.cell / 2;
      const forward = metrics.cell * 0.22;
      const nearSide = metrics.cell * 0.29;
      const farSide = metrics.cell * 0.71;
      const positions = side
        ? [
            { x: x + center + dir.x * forward, y: y + nearSide },
            { x: x + center + dir.x * forward, y: y + farSide },
          ]
        : [
            { x: x + nearSide, y: y + center + dir.y * forward },
            { x: x + farSide, y: y + center + dir.y * forward },
          ];

      ctx.fillStyle = eyeColor;
      for (const eye of positions) {
        ctx.beginPath();
        ctx.arc(eye.x, eye.y, Math.max(1.1, metrics.cell * 0.1), 0, Math.PI * 2);
        ctx.fill();
      }
    }

    return {
      draw,
      drawBoard,
      resize,
    };

    function syncCanvas(board) {
      const preferredWidth = board.cols * board.cell;
      const preferredHeight = board.rows * board.cell;
      const cssWidth = canvas.clientWidth || preferredWidth;
      const cssHeight = canvas.clientHeight || preferredHeight;
      const dpr = window.devicePixelRatio || 1;
      const pixelWidth = Math.max(1, Math.round(cssWidth * dpr));
      const pixelHeight = Math.max(1, Math.round(cssHeight * dpr));

      if (canvas.width !== pixelWidth || canvas.height !== pixelHeight || metrics.dpr !== dpr) {
        canvas.width = pixelWidth;
        canvas.height = pixelHeight;
      }

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      metrics.width = cssWidth;
      metrics.height = cssHeight;
      metrics.dpr = dpr;
      metrics.cell = Math.min(cssWidth / board.cols, cssHeight / board.rows);
      metrics.offsetX = (cssWidth - board.cols * metrics.cell) / 2;
      metrics.offsetY = (cssHeight - board.rows * metrics.cell) / 2;
    }
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
