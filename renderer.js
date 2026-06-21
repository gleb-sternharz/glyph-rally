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

    function drawItems(game, palette) {
      for (const item of game.items) {
        drawIcon(item, palette);
      }
    }

    function drawIcon(item, palette) {
      if (item.icon === "skull") {
        drawSkull(item, palette);
        return;
      }
      if (item.icon === "apple") {
        drawApple(item, palette);
        return;
      }
      if (item.icon === "pine") {
        drawPine(item);
        return;
      }
      if (item.icon === "car") {
        drawCar(item);
        return;
      }
      if (item.icon === "star") {
        drawStarIcon(item);
        return;
      }
      if (item.icon === "moon") {
        drawMoon(item, palette);
        return;
      }
      if (item.icon === "house") {
        drawHouse(item);
        return;
      }
      if (item.icon === "heart") {
        drawHeart(item);
        return;
      }
      if (item.icon === "fish") {
        drawFish(item);
      }
    }

    function drawApple(item, palette) {
      const box = iconBox(item);
      const centerX = box.x + box.size / 2;
      const centerY = box.y + box.size / 2;

      ctx.fillStyle = "#e95a4f";
      ctx.beginPath();
      ctx.arc(centerX - box.size * 0.1, centerY, box.size * 0.25, 0, Math.PI * 2);
      ctx.arc(centerX + box.size * 0.1, centerY, box.size * 0.25, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#7a5132";
      roundRect(ctx, centerX - box.size * 0.04, box.y + box.size * 0.12, box.size * 0.08, box.size * 0.24, box.size * 0.03);
      ctx.fill();

      ctx.fillStyle = "#51d88a";
      ctx.beginPath();
      ctx.ellipse(centerX + box.size * 0.15, box.y + box.size * 0.21, box.size * 0.13, box.size * 0.07, -0.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = palette.foodHighlight;
      ctx.beginPath();
      ctx.arc(centerX - box.size * 0.13, centerY - box.size * 0.1, box.size * 0.06, 0, Math.PI * 2);
      ctx.fill();
    }

    function drawSkull(item, palette) {
      const size = metrics.cell;
      const centerX = metrics.offsetX + item.x * size + size / 2;
      const centerY = metrics.offsetY + item.y * size + size / 2;
      const headRadius = size * 0.29;
      const jawWidth = size * 0.34;
      const jawHeight = size * 0.24;

      ctx.fillStyle = palette.skull;
      ctx.beginPath();
      ctx.arc(centerX, centerY - size * 0.08, headRadius, 0, Math.PI * 2);
      ctx.fill();

      roundRect(
        ctx,
        centerX - jawWidth / 2,
        centerY + size * 0.04,
        jawWidth,
        jawHeight,
        size * 0.07,
      );
      ctx.fill();

      ctx.fillStyle = palette.skullDetail;
      ctx.beginPath();
      ctx.arc(centerX - size * 0.11, centerY - size * 0.08, size * 0.075, 0, Math.PI * 2);
      ctx.arc(centerX + size * 0.11, centerY - size * 0.08, size * 0.075, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(centerX, centerY - size * 0.01);
      ctx.lineTo(centerX - size * 0.05, centerY + size * 0.08);
      ctx.lineTo(centerX + size * 0.05, centerY + size * 0.08);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = palette.skullDetail;
      ctx.lineWidth = Math.max(1, size * 0.045);
      ctx.beginPath();
      ctx.moveTo(centerX - jawWidth * 0.3, centerY + size * 0.17);
      ctx.lineTo(centerX + jawWidth * 0.3, centerY + size * 0.17);
      ctx.moveTo(centerX, centerY + size * 0.07);
      ctx.lineTo(centerX, centerY + size * 0.24);
      ctx.stroke();
    }

    function drawPine(item) {
      const box = iconBox(item);
      const cx = box.x + box.size / 2;

      ctx.fillStyle = "#2fa66a";
      drawTriangle(cx, box.y + box.size * 0.12, box.x + box.size * 0.22, box.y + box.size * 0.48, box.x + box.size * 0.78, box.y + box.size * 0.48);
      drawTriangle(cx, box.y + box.size * 0.28, box.x + box.size * 0.16, box.y + box.size * 0.68, box.x + box.size * 0.84, box.y + box.size * 0.68);
      drawTriangle(cx, box.y + box.size * 0.45, box.x + box.size * 0.1, box.y + box.size * 0.87, box.x + box.size * 0.9, box.y + box.size * 0.87);

      ctx.fillStyle = "#8c6339";
      roundRect(ctx, cx - box.size * 0.07, box.y + box.size * 0.7, box.size * 0.14, box.size * 0.2, box.size * 0.03);
      ctx.fill();
    }

    function drawCar(item) {
      const box = iconBox(item);
      const bodyY = box.y + box.size * 0.45;

      ctx.fillStyle = "#5aa7ff";
      roundRect(ctx, box.x + box.size * 0.14, bodyY, box.size * 0.72, box.size * 0.28, box.size * 0.09);
      ctx.fill();

      ctx.fillStyle = "#9ed0ff";
      drawTriangle(
        box.x + box.size * 0.36,
        box.y + box.size * 0.28,
        box.x + box.size * 0.24,
        bodyY,
        box.x + box.size * 0.7,
        bodyY,
      );

      ctx.fillStyle = "#11120f";
      ctx.beginPath();
      ctx.arc(box.x + box.size * 0.32, box.y + box.size * 0.75, box.size * 0.09, 0, Math.PI * 2);
      ctx.arc(box.x + box.size * 0.68, box.y + box.size * 0.75, box.size * 0.09, 0, Math.PI * 2);
      ctx.fill();
    }

    function drawStarIcon(item) {
      const box = iconBox(item);
      const cx = box.x + box.size / 2;
      const cy = box.y + box.size / 2;

      ctx.fillStyle = "#ffcf5c";
      ctx.beginPath();
      for (let index = 0; index < 10; index += 1) {
        const radius = index % 2 === 0 ? box.size * 0.34 : box.size * 0.15;
        const angle = -Math.PI / 2 + index * (Math.PI / 5);
        const x = cx + Math.cos(angle) * radius;
        const y = cy + Math.sin(angle) * radius;
        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.closePath();
      ctx.fill();
    }

    function drawMoon(item, palette) {
      const box = iconBox(item);
      const cx = box.x + box.size / 2;
      const cy = box.y + box.size / 2;

      ctx.fillStyle = "#d8dded";
      ctx.beginPath();
      ctx.arc(cx, cy, box.size * 0.32, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = palette.canvasBg;
      ctx.beginPath();
      ctx.arc(cx + box.size * 0.13, cy - box.size * 0.04, box.size * 0.3, 0, Math.PI * 2);
      ctx.fill();
    }

    function drawHouse(item) {
      const box = iconBox(item);

      ctx.fillStyle = "#f2b05e";
      roundRect(ctx, box.x + box.size * 0.22, box.y + box.size * 0.43, box.size * 0.56, box.size * 0.42, box.size * 0.04);
      ctx.fill();

      ctx.fillStyle = "#d85b50";
      drawTriangle(
        box.x + box.size * 0.5,
        box.y + box.size * 0.15,
        box.x + box.size * 0.14,
        box.y + box.size * 0.48,
        box.x + box.size * 0.86,
        box.y + box.size * 0.48,
      );

      ctx.fillStyle = "#6f4a33";
      roundRect(ctx, box.x + box.size * 0.44, box.y + box.size * 0.62, box.size * 0.12, box.size * 0.23, box.size * 0.03);
      ctx.fill();
    }

    function drawHeart(item) {
      const box = iconBox(item);
      const cx = box.x + box.size / 2;
      const cy = box.y + box.size * 0.55;

      ctx.fillStyle = "#ef5b85";
      ctx.beginPath();
      ctx.moveTo(cx, box.y + box.size * 0.82);
      ctx.bezierCurveTo(box.x + box.size * 0.08, box.y + box.size * 0.55, box.x + box.size * 0.18, box.y + box.size * 0.2, cx, box.y + box.size * 0.36);
      ctx.bezierCurveTo(box.x + box.size * 0.82, box.y + box.size * 0.2, box.x + box.size * 0.92, box.y + box.size * 0.55, cx, box.y + box.size * 0.82);
      ctx.fill();

      ctx.fillStyle = "rgba(255, 255, 255, 0.35)";
      ctx.beginPath();
      ctx.arc(cx - box.size * 0.14, cy - box.size * 0.16, box.size * 0.06, 0, Math.PI * 2);
      ctx.fill();
    }

    function drawFish(item) {
      const box = iconBox(item);
      const cx = box.x + box.size * 0.48;
      const cy = box.y + box.size / 2;

      ctx.fillStyle = "#34c6d3";
      ctx.beginPath();
      ctx.ellipse(cx, cy, box.size * 0.27, box.size * 0.17, 0, 0, Math.PI * 2);
      ctx.fill();

      drawTriangle(
        box.x + box.size * 0.73,
        cy,
        box.x + box.size * 0.9,
        box.y + box.size * 0.33,
        box.x + box.size * 0.9,
        box.y + box.size * 0.67,
      );

      ctx.fillStyle = "#11120f";
      ctx.beginPath();
      ctx.arc(box.x + box.size * 0.37, cy - box.size * 0.04, box.size * 0.04, 0, Math.PI * 2);
      ctx.fill();
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

    function iconBox(item) {
      const padding = metrics.cell * 0.08;
      return {
        x: metrics.offsetX + item.x * metrics.cell + padding,
        y: metrics.offsetY + item.y * metrics.cell + padding,
        size: metrics.cell - padding * 2,
      };
    }

    function drawTriangle(x1, y1, x2, y2, x3, y3) {
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.lineTo(x3, y3);
      ctx.closePath();
      ctx.fill();
    }

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
