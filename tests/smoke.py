"""Test de fumée : le jeu se charge, une partie démarre, aucune erreur JS.
Usage : python3 tests/smoke.py [chemin/index.html]"""
import asyncio, os, sys
from playwright.async_api import async_playwright

path = os.path.abspath(sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(__file__), '..', 'index.html'))

async def main():
    async with async_playwright() as p:
        try:
            b = await p.chromium.launch()
        except Exception:
            b = await p.chromium.launch(executable_path='/usr/bin/google-chrome')
        pg = await b.new_page(viewport={'width': 480, 'height': 800})
        errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto('file://' + path)
        await pg.wait_for_timeout(800)
        await pg.click('#btn-start')
        await pg.keyboard.down('d'); await pg.wait_for_timeout(400); await pg.keyboard.up('d')
        await pg.keyboard.press('e')
        await pg.wait_for_timeout(2500)
        state = await pg.evaluate('gameState')
        await pg.screenshot(path='smoke.png')
        await b.close()
    ok = state in ('PLAY', 'EVENT', 'GAMEOVER') and not errs
    print('état:', state, '| erreurs JS:', errs or 'aucune', '| capture: smoke.png')
    sys.exit(0 if ok else 1)

asyncio.run(main())
