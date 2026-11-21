# Cenário do Café da Horta: chão de tábuas, paredes, janela, prateleira com vasinhos, balcão,
# cozinha (bancada, tábua, geladeira, fogão, panela) e a horta (grama, cerca, árvores, arbustos).
# Gera 3d/modelos/cenario.glb nas MESMAS posições do jogo. Ficam no 3d/world.js só as peças que
# mudam durante o jogo: placa com o nome, canteiros, louça suja, faca, poça e o que vai na tábua.
# As medidas abaixo estão em coordenadas do jogo (three.js: x, y = altura, z = para a frente),
# copiadas do world.js antigo; caixa3/cil3 convertem para o Blender (x, -z, y).
import math, os, random, sys
import bmesh
from mathutils import Matrix
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from comum import bolhas, torno, tufos, _novo, _aplicar, _liso, limpar, exportar, previas, pasta_previas, juntar_por_material

B = lambda x, y, z: (x, -z, y)  # jogo -> Blender
rng = random.Random(7)


def caixa3(nome, tam, pos, cor, chanfro=0.02, rug=0.8):
    """Caixa com quinas arredondadas (chanfro), em medidas do jogo: tam = (largura, altura, fundura)."""
    w, h, d = tam
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0, matrix=Matrix.Diagonal((w, d, h, 1)))
    ob = _novo(nome, bm, cor, B(*pos), None, rug)
    if chanfro:
        bv = ob.modifiers.new('chanfro', 'BEVEL')
        bv.width = min(chanfro, w / 3, h / 3, d / 3)
        bv.segments = 2
        _aplicar(ob)
    return ob


def cil3(nome, rt, rb, h, pos, cor, seg=24, rug=0.6):
    """Cilindro/cone em medidas do jogo (raio de cima, raio de baixo, altura, centro)."""
    x, y, z = pos
    ob = torno(nome, [(0.001, y - h / 2), (rb, y - h / 2), (rt, y + h / 2), (0.001, y + h / 2)], cor, seg=seg, sub=0, rug=rug)
    ob.location.x, ob.location.y = x, -z
    return ob


limpar()

# ================= CAFÉ =================
# chão de tábuas corridas (cores levemente diferentes, frestas entre elas)
for i in range(26):
    tom = rng.choice(['#e7cfa6', '#e2c79b', '#ead5ae', '#dfc396'])
    caixa3(f'chao_tabua_{i}', (0.49, 0.2, 10), (-7.75 + i * 0.5, -0.1, 0), tom, chanfro=0.012, rug=0.7)
# paredes, lambri de madeira e rodapé
caixa3('parede_fundo', (12.5, 4.6, 0.25), (-1.75, 2.3, -3), '#f7e6c8', chanfro=0, rug=0.95)
caixa3('lambri', (12.5, 0.6, 0.32), (-1.75, 0.3, -2.95), '#c98a4b', rug=0.6)
caixa3('lambri_topo', (12.5, 0.06, 0.38), (-1.75, 0.62, -2.95), '#a8713b', rug=0.5)
caixa3('parede_lado', (0.25, 4.6, 10), (-8.1, 2.3, 2), '#f3dfbd', chanfro=0, rug=0.95)
caixa3('rodape_lado', (0.32, 0.2, 10), (-8.05, 0.1, 2), '#a8713b', rug=0.5)
# janela com moldura, vidro, cruzeta e peitoril
caixa3('janela_moldura', (2.2, 1.5, 0.1), (2.6, 2.6, -2.85), '#ffffff', rug=0.5)
caixa3('janela_vidro', (1.9, 1.2, 0.12), (2.6, 2.6, -2.82), '#d6f1ff', chanfro=0, rug=0.05)
caixa3('janela_cruz_h', (1.9, 0.05, 0.14), (2.6, 2.6, -2.8), '#ffffff', chanfro=0.01, rug=0.5)
caixa3('janela_cruz_v', (0.05, 1.2, 0.14), (2.6, 2.6, -2.8), '#ffffff', chanfro=0.01, rug=0.5)
caixa3('janela_peitoril', (2.4, 0.08, 0.3), (2.6, 1.82, -2.78), '#ffffff', rug=0.5)
# prateleira com vasinhos: alface, morango e cenoura
caixa3('prateleira', (2.2, 0.1, 0.45), (-3.6, 2.5, -2.72), '#9a6331', rug=0.6)
for x, tipo in ((-4.3, 'alface'), (-3.6, 'morango'), (-2.9, 'cenoura')):
    cil3(f'vaso_{tipo}', 0.16, 0.12, 0.25, (x, 2.68, -2.7), '#c96a3a', rug=0.7)
    cil3(f'vaso_terra_{tipo}', 0.145, 0.145, 0.02, (x, 2.8, -2.7), '#5a3a22', rug=1.0)
    c = B(x, 2.92, -2.7)
    if tipo == 'alface':
        bolhas('planta_alface', tufos([(c, (0.15, 0.15, 0.1))], 14, 0.05, 0.07, semente=50), '#5fb548',
               pivo=c, voxel=0.012, suave=4, alvo=700)
    elif tipo == 'morango':
        bolhas('planta_morango', tufos([(c, (0.15, 0.15, 0.09))], 12, 0.05, 0.07, semente=51), '#3e9a3a',
               pivo=c, voxel=0.012, suave=4, alvo=700)
        bolhas('planta_morangos', [((c[0] + dx, c[1] - 0.13, c[2] + dz), (0.035, 0.03, 0.045)) for dx, dz in ((-0.07, -0.03), (0.05, 0.0), (0.0, -0.06))],
               '#e3304a', pivo=c, voxel=0, rug=0.3, seg=(12, 6))
    else:
        bolhas('planta_cenoura', [((c[0] + 0.05 * math.sin(a), c[1] + 0.05 * math.cos(a), c[2] + 0.08), (0.025, 0.025, 0.14),
                                   (15 * math.cos(a), 15 * math.sin(a), 0)) for a in (k * 1.26 for k in range(5))],
               '#4fa83d', pivo=c, voxel=0.01, suave=3, alvo=600)

# ================= BALCÃO =================
caixa3('balcao', (5.6, 1.1, 1.1), (0.3, 0.55, 0), '#c98a4b', rug=0.6)
caixa3('balcao_tampo', (5.8, 0.12, 1.3), (0.3, 1.16, 0), '#8a5a30', chanfro=0.03, rug=0.35)
for i in range(6):  # ripas na frente do balcão
    caixa3(f'balcao_ripa_{i}', (0.05, 0.9, 0.03), (-2.2 + i, 0.5, 0.565), '#b57a3f', chanfro=0.01, rug=0.6)
caixa3('balcao_rodape', (5.7, 0.1, 1.16), (0.3, 0.05, 0), '#8a5a30', rug=0.5)
TOP = 1.22
# sininho de chamar (base, cúpula dourada e botão)
cil3('sino_base', 0.15, 0.15, 0.025, (2.7, TOP + 0.012, 0.3), '#5a3a22', rug=0.5)
cup = torno('sino_cupula', [(0.13, TOP + 0.025), (0.12, TOP + 0.08), (0.08, TOP + 0.13), (0.001, TOP + 0.15)], '#f2c14e', sub=1, rug=0.2)
cup.location.x, cup.location.y = 2.7, -0.3
cil3('sino_botao', 0.02, 0.02, 0.04, (2.7, TOP + 0.165, 0.3), '#d9a520', rug=0.3)

# ================= COZINHA =================
kx = -5.4
caixa3('cozinha_armario', (2.4, 1, 1.4), (kx, 0.5, 0), '#c98a4b', rug=0.6)
for i, x in enumerate((kx - 0.6, kx + 0.6)):   # portinhas e puxadores
    caixa3(f'cozinha_porta_{i}', (1.1, 0.8, 0.03), (x, 0.5, 0.71), '#b57a3f', chanfro=0.015, rug=0.55)
    caixa3(f'cozinha_puxador_{i}', (0.2, 0.03, 0.04), (x, 0.8, 0.74), '#d8dde2', chanfro=0.01, rug=0.2)
caixa3('cozinha_bancada', (2.5, 0.08, 1.5), (kx, 1.03, 0), '#e9eef1', chanfro=0.02, rug=0.25)
caixa3('cozinha_tabua', (1.1, 0.06, 0.7), (kx, 1.1, 0.1), '#d9a66b', chanfro=0.02, rug=0.7)
caixa3('geladeira', (1.1, 2.3, 0.8), (kx - 1.8, 1.15, -2.3), '#eef5f8', chanfro=0.06, rug=0.3)
caixa3('geladeira_divisao', (1.1, 0.02, 0.02), (kx - 1.8, 1.55, -1.9), '#c9d4da', chanfro=0, rug=0.3)
caixa3('geladeira_puxador', (0.05, 0.6, 0.05), (kx - 1.35, 1.5, -1.88), '#9fb3bf', chanfro=0.015, rug=0.2)
caixa3('fogao', (1.6, 0.9, 0.8), (kx + 1.2, 0.45, -2.4), '#d1495b', chanfro=0.03, rug=0.4)
caixa3('fogao_tampo', (1.6, 0.06, 0.8), (kx + 1.2, 0.93, -2.4), '#3b3b3b', chanfro=0.015, rug=0.5)
caixa3('fogao_forno', (1.2, 0.45, 0.02), (kx + 1.2, 0.45, -1.995), '#2b2b2b', chanfro=0.01, rug=0.1)
for i, dx in enumerate((-0.45, -0.15, 0.15, 0.45)):   # botões do fogão
    caixa3(f'fogao_botao_{i}', (0.06, 0.06, 0.04), (kx + 1.2 + dx, 0.8, -1.99), '#eeeeee', chanfro=0.015, rug=0.4)
cil3('panela', 0.22, 0.2, 0.25, (kx + 0.9, 1.08, -2.4), '#b8c3cc', rug=0.2)
caixa3('panela_cabo', (0.3, 0.04, 0.05), (kx + 0.9 + 0.35, 1.15, -2.4), '#3b3b3b', chanfro=0.015, rug=0.5)

# ================= HORTA =================
caixa3('horta_grama', (10, 0.2, 12), (10, -0.12, 0), '#8bcf6a', chanfro=0, rug=0.95)
for i in range(8):   # cerca branca
    caixa3(f'cerca_poste_{i}', (0.12, 0.8, 0.12), (5.4 + i * 1.3, 0.4, -3.2), '#fffaf3', chanfro=0.02, rug=0.6)
    bolhas(f'cerca_ponta_{i}', [(B(5.4 + i * 1.3, 0.83, -3.2), (0.085, 0.085, 0.05))], '#fffaf3', pivo=B(5.4 + i * 1.3, 0.83, -3.2), voxel=0, seg=(8, 4))
caixa3('cerca_trilho_alto', (9.2, 0.08, 0.06), (9.95, 0.6, -3.2), '#fffaf3', chanfro=0.015, rug=0.6)
caixa3('cerca_trilho_baixo', (9.2, 0.08, 0.06), (9.95, 0.28, -3.2), '#fffaf3', chanfro=0.015, rug=0.6)
for j, (x, z, s) in enumerate([(12.5, -5, 1.2), (6.5, -6, 1), (14.5, -2, 0.9)]):   # árvores
    cil3(f'arvore_tronco_{j}', 0.13 * s, 0.2 * s, 1.4 * s, (x, 0.7 * s, z), '#8a5a30', seg=12, rug=0.9)
    c = B(x, 1.9 * s, z)
    copa = [(c, 0.75 * s), ((c[0] + 0.45 * s, c[1], c[2] - 0.15 * s), 0.55 * s), ((c[0] - 0.4 * s, c[1] + 0.2 * s, c[2] - 0.1 * s), 0.55 * s),
            ((c[0], c[1] - 0.2 * s, c[2] + 0.4 * s), 0.5 * s)]
    bolhas(f'arvore_copa_{j}', tufos(copa, 40, 0.18 * s, 0.28 * s, semente=60 + j), '#5aa845',
           pivo=c, voxel=0.05, suave=4, pelo=0.04, alvo=2500)
for j, (x, z) in enumerate([(5.3, -2.7), (14.6, 1.5), (13.8, 4.2), (5.2, 4.5)]):   # arbustos
    c = B(x, 0.25, z)
    bolhas(f'arbusto_{j}', tufos([(c, (0.45, 0.35, 0.3))], 14, 0.12, 0.18, semente=70 + j), '#4f9a3c',
           pivo=c, voxel=0.035, suave=3, pelo=0.02, alvo=900)

# tufinhos de grama espalhados (fora da área dos canteiros e do caminho da porta)
folhas = []
while len(folhas) < 180:
    x, z = rng.uniform(5.2, 14.8), rng.uniform(-5.8, 5.8)
    if 5.0 < x < 10.8 and -2.4 < z < 3.4:
        continue
    for k in range(3):
        a = rng.uniform(0, 360)
        folhas.append((B(x + rng.uniform(-0.04, 0.04), 0.06, z + rng.uniform(-0.04, 0.04)), (0.012, 0.012, 0.08),
                       (rng.uniform(-25, 25), rng.uniform(-25, 25), a)))
bolhas('grama_tufos', folhas, '#6fbf4f', voxel=0, seg=(5, 3), rug=0.9)

juntar_por_material()
exportar('cenario.glb')
previas('cenario', pasta_previas(), alvo=(1.5, 0, 0.8), dist=9.0,
        vistas=(('balcao', -6, 9.0, (0.7, -0.2, 1.0)), ('cozinha', 30, 5.0, (-5.2, 1.0, 1.0)), ('horta', -10, 9.0, (8.5, 0, 0.3))))
