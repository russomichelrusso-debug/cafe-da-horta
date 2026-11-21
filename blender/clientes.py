# Clientes do café (e o motoboy do delivery).
# Gera 3d/modelos/cliente.glb: UM corpo com os 4 penteados e a coroa do crítico. O 3d/world.js
# copia esse modelo para cada cliente, pinta pelo nome das peças e liga só o que precisa:
#   *_pele*  -> cor da pele      *_camisa* -> cor da camisa     *_calca* -> cor da calça
#   *_cabelo* -> cor do cabelo   cliente_cabelo_estilo0..3 -> só o penteado sorteado
#   cliente_coroa -> só no crítico     cliente_boca -> sorriso (∪), vira ao contrário quando bravo
# Gera também 3d/modelos/motoboy.glb (capacete, jaqueta e baú de entrega), para o delivery.
import math, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from comum import bolhas, anel, torno, tufos, limpar, exportar, previas, pasta_previas


def pessoa(p, dx, estilo, pele, camisa, calca, cabelo, todos=False, coroa=False):
    """Monta uma pessoa com prefixo p, deslocada dx em X. estilo None = sem cabelo (motoboy).
    todos=True põe os 4 penteados (para o .glb do jogo)."""
    X = lambda x: x + dx
    for sx, l in ((-1, 'L'), (1, 'R')):
        bolhas(f'{p}_calca_{l}', [((X(sx * 0.11), 0, 0.33), (0.078, 0.078, 0.28))], calca, pivo=(X(sx * 0.11), 0, 0.33), voxel=0)
        bolhas(f'{p}_sapato_{l}', [((X(sx * 0.11), -0.04, 0.045), (0.088, 0.13, 0.05))], '#3a2a22',
               pivo=(X(sx * 0.11), -0.04, 0.045), voxel=0, rug=0.4)
        bolhas(f'{p}_camisa_manga_{l}', [((X(sx * 0.33), 0, 1.15), (0.095, 0.095, 0.14), (0, sx * 10, 0))], camisa,
               pivo=(X(sx * 0.33), 0, 1.15), voxel=0)
        bolhas(f'{p}_pele_braco_{l}', [((X(sx * 0.36), 0, 0.88), (0.058, 0.058, 0.17), (0, sx * 8, 0))], pele,
               pivo=(X(sx * 0.36), 0, 0.88), voxel=0)
        bolhas(f'{p}_pele_mao_{l}', [((X(sx * 0.38), -0.01, 0.67), (0.065, 0.055, 0.075)),
                                      ((X(sx * 0.38 - sx * 0.045), -0.05, 0.69), (0.022, 0.022, 0.035))],
               pele, pivo=(X(sx * 0.38), -0.01, 0.67), voxel=0.006, suave=5, alvo=500)
        bolhas(f'{p}_pele_orelha_{l}', [((X(sx * 0.268), 0, 1.6), (0.035, 0.05, 0.06))], pele, pivo=(X(sx * 0.268), 0, 1.6), voxel=0)
        # olho: branco, íris, pupila e brilho
        ex, ey, ez = X(sx * 0.1), -0.236, 1.63
        bolhas(f'{p}_olho_{l}', [((ex, ey, ez), (0.045, 0.02, 0.05))], '#ffffff', pivo=(ex, ey, ez), voxel=0, rug=0.3, seg=(16, 8))
        bolhas(f'{p}_iris_{l}', [((ex, ey - 0.014, ez - 0.004), (0.03, 0.012, 0.035))], '#4a2c1a', pivo=(ex, ey, ez), voxel=0, rug=0.3, seg=(16, 8))
        bolhas(f'{p}_pupila_{l}', [((ex, ey - 0.022, ez - 0.004), (0.017, 0.008, 0.02))], '#140b06', pivo=(ex, ey, ez), voxel=0, rug=0.2, seg=(12, 6))
        bolhas(f'{p}_brilho_{l}', [((ex + 0.012, ey - 0.03, ez + 0.016), 0.009)], '#ffffff', pivo=(ex, ey, ez), voxel=0, rug=0.1, seg=(8, 4))
        bolhas(f'{p}_cabelo_sobrancelha_{l}', [((X(sx * 0.1), -0.243, 1.705), (0.045, 0.012, 0.012), (0, sx * 8, 0))], cabelo,
               pivo=(X(sx * 0.1), -0.243, 1.705), voxel=0, seg=(12, 6))
        bolhas(f'{p}_bochecha_{l}', [((X(sx * 0.16), -0.205, 1.54), (0.045, 0.01, 0.025), (0, 0, -sx * 25))], '#f3a1a0',
               pivo=(X(sx * 0.16), -0.205, 1.54), voxel=0, seg=(12, 6))
    bolhas(f'{p}_calca_quadril', [((X(0), 0, 0.6), (0.27, 0.2, 0.12))], calca, pivo=(X(0), 0, 0.6), voxel=0)
    torno(f'{p}_camisa', [(0.001, 0.55), (0.26, 0.55), (0.3, 0.75), (0.3, 1.05), (0.24, 1.25), (0.12, 1.31), (0.001, 1.31)],
          camisa, dobras=(7, 0.025, 1.0, 0.55), seg=40).location.x += dx   # o torno gira em volta da origem
    anel(f'{p}_camisa_gola', (X(0), 0, 1.3), 0.11, 0.022, camisa)
    bolhas(f'{p}_pele_pescoco', [((X(0), 0, 1.36), (0.07, 0.07, 0.08))], pele, pivo=(X(0), 0, 1.36), voxel=0)
    bolhas(f'{p}_pele_cabeca', [((X(0), 0, 1.6), (0.27, 0.26, 0.28)), ((X(0), -0.09, 1.48), (0.16, 0.14, 0.11))],
           pele, pivo=(X(0), 0, 1.6), voxel=0.01, suave=6, alvo=1800, rug=0.6)
    bolhas(f'{p}_pele_nariz', [((X(0), -0.262, 1.565), (0.028, 0.024, 0.03))], pele, pivo=(X(0), -0.262, 1.565), voxel=0, seg=(12, 6))
    anel(f'{p}_boca', (X(0), -0.248, 1.5), 0.042, 0.01, '#7a3a2a', rot=(90, 0, 0), a0=math.pi + 0.2, a1=2 * math.pi - 0.2, seg=14, lados=6)

    topo = [((X(0), 0.04, 1.72), (0.29, 0.28, 0.18)), ((X(0), 0.08, 1.6), (0.285, 0.22, 0.22))]
    estilos = range(4) if todos else ([] if estilo is None else [estilo])
    for e in estilos:
        nome = f'{p}_cabelo_estilo{e}'
        if e == 0:   # curtinho com franja
            forma = topo + [((X(0), -0.19, 1.79), (0.2, 0.08, 0.06))]
            bolhas(nome, tufos(forma, 20, 0.03, 0.05, semente=40), cabelo, pivo=(X(0), 0, 1.6), voxel=0.01, suave=6, pelo=0.006, alvo=2000, rug=0.6)
        if e == 1:   # comprido liso
            forma = topo + [((X(0), 0.1, 1.38), (0.27, 0.14, 0.32)), ((X(-0.25), -0.02, 1.45), (0.08, 0.1, 0.22)),
                            ((X(0.25), -0.02, 1.45), (0.08, 0.1, 0.22))]
            bolhas(nome, forma, cabelo, pivo=(X(0), 0, 1.6), voxel=0.01, suave=8, pelo=0.005, alvo=2000, rug=0.5)
        if e == 2:   # coque com prendedor rosa
            coque = bolhas(nome, topo + [((X(0), 0.12, 1.92), 0.12)], cabelo, pivo=(X(0), 0, 1.6), voxel=0.01, suave=6, pelo=0.005, alvo=2000, rug=0.55)
            anel(f'{p}_prendedor', (X(0), 0.1, 1.84), 0.085, 0.022, '#e35d8a', rot=(-30, 0, 0), pai=coque)
        if e == 3:   # cacheado / black power
            forma = [((X(x), y, z), 0.15) for x, y, z in [(-0.2, 0, 1.78), (0.2, 0, 1.78), (0, 0.03, 1.88), (-0.13, 0.17, 1.82),
                                                          (0.13, 0.17, 1.82), (0, 0.24, 1.72), (-0.25, 0.1, 1.62), (0.25, 0.1, 1.62)]]
            bolhas(nome, tufos(forma, 45, 0.04, 0.065, semente=43), cabelo, pivo=(X(0), 0, 1.6), voxel=0.012, suave=4, pelo=0.008, alvo=2500, rug=0.7)
    if todos or coroa:  # chapéu dourado do crítico gastronômico
        c = torno(f'{p}_coroa', [(0.2, 1.84), (0.24, 1.93), (0.2, 1.935), (0.001, 1.935)], '#f2b33d', sub=0, rug=0.3)
        c.location.x += dx
        bolhas(f'{p}_coroa_bola', [((X(0), 0, 1.98), 0.05)], '#f2b33d', pivo=(X(0), 0, 1.98), pai=c, voxel=0, rug=0.3)


def motoboy(dx):
    """Mesmo corpo, de jaqueta escura com faixa refletiva, capacete vermelho com viseira e baú de entrega."""
    X = lambda x: x + dx
    pessoa('motoboy', dx, None, '#c98d62', '#2c3440', '#2f3b5c', '#2b1a10')
    anel('motoboy_faixa', (X(0), 0, 0.95), 0.305, 0.022, '#f6c93b')
    capacete = bolhas('motoboy_capacete', [((X(0), 0.02, 1.66), (0.31, 0.31, 0.3)), ((X(0), 0.04, 1.5), (0.3, 0.26, 0.16))],
                      '#e5412f', pivo=(X(0), 0, 1.6), voxel=0.01, suave=6, alvo=1500, rug=0.25)
    bolhas('motoboy_viseira', [((X(0), -0.23, 1.68), (0.22, 0.09, 0.09))], '#9fd3f0', pivo=(X(0), -0.23, 1.68), pai=capacete, voxel=0, rug=0.05)
    bau = bolhas('motoboy_bau', [((X(0), 0.36, 1.0), (0.24, 0.16, 0.22))], '#e5412f', pivo=(X(0), 0.36, 1.0), voxel=0.012, suave=3, alvo=600, rug=0.4)
    bolhas('motoboy_bau_tampa', [((X(0), 0.36, 1.21), (0.245, 0.165, 0.03))], '#b92e20', pivo=(X(0), 0.36, 1.21), pai=bau, voxel=0, rug=0.4)
    for sx in (-1, 1):
        bolhas(f'motoboy_alca_{sx}', [((X(sx * 0.17), 0.12, 1.05), (0.025, 0.1, 0.2), (-10, 0, 0))], '#1d1d1d',
               pivo=(X(sx * 0.17), 0.12, 1.05), voxel=0)


# --- 1) modelo do jogo: um cliente com os 4 penteados e a coroa ---
limpar()
pessoa('cliente', 0, 0, '#e8b48f', '#3f7fd1', '#2f3b5c', '#5b3a25', todos=True)
exportar('cliente.glb')
# --- 2) motoboy ---
limpar()
motoboy(0)
exportar('motoboy.glb')
# --- 3) fila de prévia: 4 penteados com cores sorteadas, crítico e motoboy ---
pasta = pasta_previas()
if pasta:
    limpar()
    fila = [(0, '#f6d2b8', '#3aa76d', '#4a3a2a', '#a0612f', False), (1, '#8d5a3b', '#e0a12b', '#2f3b5c', '#1b1b1b', False),
            (2, '#f1c9a5', '#8e5bd6', '#5a6b7f', '#e2b55a', False), (3, '#c98d62', '#d1495b', '#3b3b3b', '#2b1a10', False),
            (0, '#e8b48f', '#2fa3a8', '#6b4a6b', '#7d4a8f', True)]
    for i, (e, pe, ca, cl, cb, vip) in enumerate(fila):
        pessoa(f'p{i}', (i - 2.5) * 0.85, e, pe, ca, cl, cb, coroa=vip)
    motoboy(2.5 * 0.85)
    previas('clientes', pasta, alvo=(0, 0, 0.95), dist=8.0,
            vistas=(('fila', -8), ('fila-costas', 160), ('rosto', -10, 1.6, (-1.275, 0, 1.55))))
