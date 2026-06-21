# Smoke Tests

Put standalone browser smoke pages here when a behavior needs manual or headless-browser verification.

Keep smoke pages dependency-free so they can be opened with `file://`, just like `index.html`.

## Mobile Layout

Run the phone layout smoke with Chromium:

```bash
chromium --headless --disable-gpu --no-sandbox --window-size=430,900 --user-agent='Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1' --virtual-time-budget=3000 --dump-dom file:///home/gleb/dev/snake/tests/smoke/mobile-layout-smoke.html
```

The output should contain `mobile layout smoke ok`.

## Engine Growth

Run the growth smoke with Chromium:

```bash
chromium --headless --disable-gpu --no-sandbox --virtual-time-budget=2000 --dump-dom file:///home/gleb/dev/snake/tests/smoke/engine-growth-smoke.html
```

The output should contain `engine growth smoke ok`.
