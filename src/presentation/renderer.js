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
      document.documentElement.style.setProperty("--arena-preferred-width", `${preferredWidth}px`);

      syncCanvas(board);
    }

    function draw(game, palette) {
      syncCanvas(game.board);
      ctx.clearRect(0, 0, metrics.width, metrics.height);
      drawBoard(game.board, palette);
      drawItems(game, palette);
      for (const player of game.players) {
        drawSnake(game.board, player, palette);
      }
    }

    function drawBoard(board, palette) {
      syncCanvas(board);
      ctx.fillStyle = palette.canvasBg;
      ctx.fillRect(0, 0, metrics.width, metrics.height);

      ctx.fillStyle = palette.canvasChecker;
      for (let y = 0; y < board.rows; y += 1) {
        for (let x = (y % 2); x < board.cols; x += 2) {
          ctx.fillRect(
            metrics.offsetX + x * metrics.cell,
            metrics.offsetY + y * metrics.cell,
            metrics.cell,
            metrics.cell,
          );
        }
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

    function drawItems(game, palette) {
      const iconTools = {
        metrics,
        palette,
        roundRect,
      };

      for (const item of game.items) {
        window.SnakeDictionary.drawIcon(ctx, item, iconTools);
      }
    }

    function drawSnake(board, player, palette) {
      const color = player.alive ? player.color : palette.deadSnake;
      const overlap = Math.max(0.5, metrics.cell * 0.015);
      const bodyRadius = metrics.cell * 0.16;
      const headRadius = metrics.cell * 0.3;

      ctx.fillStyle = color;
      for (let index = 0; index < player.body.length - 1; index += 1) {
        drawSnakeConnector(player.body[index], player.body[index + 1], overlap);
      }

      player.body.forEach((segment, index) => {
        const x = metrics.offsetX + segment.x * metrics.cell - overlap;
        const y = metrics.offsetY + segment.y * metrics.cell - overlap;
        const size = metrics.cell + overlap * 2;

        ctx.fillStyle = color;
        roundRect(ctx, x, y, size, size, index === 0 ? headRadius : bodyRadius);
        ctx.fill();

        if (index === 0) {
          drawEyes(board, segment, player.dir, player.alive, palette);
        }
      });
    }

    function drawSnakeConnector(from, to, overlap) {
      const dx = to.x - from.x;
      const dy = to.y - from.y;
      if (Math.abs(dx) + Math.abs(dy) !== 1) {
        return;
      }

      const minX = Math.min(from.x, to.x);
      const minY = Math.min(from.y, to.y);
      if (dx !== 0) {
        ctx.fillRect(
          metrics.offsetX + minX * metrics.cell + metrics.cell / 2 - overlap,
          metrics.offsetY + from.y * metrics.cell - overlap,
          metrics.cell + overlap * 2,
          metrics.cell + overlap * 2,
        );
      } else {
        ctx.fillRect(
          metrics.offsetX + from.x * metrics.cell - overlap,
          metrics.offsetY + minY * metrics.cell + metrics.cell / 2 - overlap,
          metrics.cell + overlap * 2,
          metrics.cell + overlap * 2,
        );
      }
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
