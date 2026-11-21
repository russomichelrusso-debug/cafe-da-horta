# Comidas, louça e plantas do Café da Horta.
# Gera 3d/modelos/comidas.glb: uma "caixa de moldes". Cada molde tem a origem na BASE (onde encosta
# no prato, na tábua ou na terra), e o 3d/world.js copia o molde pelo nome quando precisa:
#   prato, tigela, liquidificador                       (louça da Montagem)
#   pao, alface, tomate_f, cenoura_r, queijo, molho     (camadas do sanduíche e itens da salada; nome = ingrediente)
#   tabua_tomate, tabua_tomate_fatiado, tabua_cenoura, tabua_cenoura_ralada   (Preparo)
#   planta_broto, planta_alface, planta_cenoura, planta_tomate(+_frutos), planta_morango(+_frutos),
#   planta_murcha, lagarta                              (Horta)
# Alturas das camadas iguais às do world.js (LAYER): pão 0.07, alface 0.035, tomate 0.04, cenoura 0.035, queijo 0.03, molho 0.025.
import math, os, random, sys
import bmesh
from mathutils import Matrix
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from comum import bolhas, torno, tufos, _novo, _aplicar, limpar, exportar, previas, pasta_previas

rng = random.Random(9)
VAO = 0.9          # distância entre os moldes (só para não ficarem uns dentro dos outros no Blender)
fila = [0]


def lugar():
    """Próximo lugar livre na fileira de moldes."""
    x = fila[0] * VAO
    fila[0] += 1
    return x


def caixa(nome, tam, centro, cor, pai=None, chanfro=0.01, rug=0.6):
    w, d, h = tam
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0, matrix=Matrix.Diagonal((w, d, h, 1)))
    ob = _novo(nome, bm, cor, centro, pai, rug)
    if chanfro:
        bv = ob.modifiers.new('chanfro', 'BEVEL')
        bv.width = chanfro
        bv.segments = 2
        _aplicar(ob)
    return ob


def girado(nome, perfil, cor, x, sub=1, rug=0.3, seg=40):
    """Peça redonda (prato, tigela) com a base no chão, no lugar x da fileira."""
    ob = torno(nome, perfil, cor, sub=sub, rug=rug, seg=seg)
    ob.location.x = x
    return ob


def lascas(n, raio, z0, z1, comp, cx, rng_):
    """Tirinhas (cenoura ralada) espalhadas num montinho."""
    out = []
    for _ in range(n):
        a, r = rng_.uniform(0, 2 * math.pi), raio * math.sqrt(rng_.random())
        z = z0 + (z1 - z0) * (1 - r / raio) * rng_.random()
        out.append(((cx + r * math.cos(a), r * math.sin(a), z), (comp, 0.009, 0.009),
                    (rng_.uniform(-20, 20), rng_.uniform(-20, 20), rng_.uniform(0, 180))))
    return out


limpar()

# ================= LOUÇA =================
x = lugar()
girado('prato', [(0.001, 0), (0.3, 0), (0.36, 0.03), (0.37, 0.04), (0.34, 0.042), (0.27, 0.014), (0.001, 0.014)], '#ffffff', x, rug=0.15)
x = lugar()
girado('tigela', [(0.001, 0), (0.12, 0), (0.15, 0.02), (0.3, 0.18), (0.38, 0.36), (0.36, 0.365), (0.28, 0.2), (0.13, 0.04), (0.001, 0.04)],
       '#ffffff', x, rug=0.15)
x = lugar()
base = caixa('liquidificador', (0.36, 0.36, 0.22), (x, 0, 0.11), '#8e5bd6', chanfro=0.04, rug=0.35)
caixa('liquidificador_painel', (0.22, 0.02, 0.08), (x, -0.18, 0.11), '#2b2b2b', pai=base, chanfro=0.008, rug=0.2)
for i, dx in enumerate((-0.06, 0, 0.06)):
    bolhas(f'liquidificador_botao_{i}', [((x + dx, -0.195, 0.11), (0.018, 0.01, 0.018))], ['#3aa76d', '#e0a12b', '#d1495b'][i],
           pivo=(x + dx, -0.195, 0.11), pai=base, voxel=0, seg=(10, 5), rug=0.3)

# ================= CAMADAS DO SANDUÍCHE (e itens da salada) =================
x = lugar()   # pão de forma: casca dourada por baixo, miolo claro por cima
pao = bolhas('pao', [((x, 0, 0.033), (0.235, 0.2, 0.034))], '#c98a3d', pivo=(x, 0, 0), voxel=0.008, suave=4, alvo=900, rug=0.8)
bolhas('pao_miolo', [((x, 0, 0.04), (0.218, 0.184, 0.031))], '#f3d39a', pivo=(x, 0, 0), pai=pao, voxel=0.008, suave=4, pelo=0.003, alvo=900, rug=0.9)
x = lugar()   # folha de alface com a borda ondulada
bolhas('alface', tufos([((x, 0, 0.017), (0.23, 0.2, 0.012))], 26, 0.035, 0.05, semente=80, zmin=-1),
       '#5fb548', pivo=(x, 0, 0), voxel=0.008, suave=3, pelo=0.004, alvo=1200, rug=0.5)
x = lugar()   # três rodelas de tomate com polpa e sementinhas
tom = bolhas('tomate_f', [((x + dx, 0, 0.02), (0.09, 0.09, 0.02)) for dx in (-0.12, 0, 0.12)], '#d8352b',
             pivo=(x, 0, 0), voxel=0, seg=(24, 8), rug=0.35)
bolhas('tomate_f_polpa', [((x + dx, 0, 0.033), (0.072, 0.072, 0.01)) for dx in (-0.12, 0, 0.12)], '#f2665a',
       pivo=(x, 0, 0), pai=tom, voxel=0, seg=(20, 6), rug=0.4)
bolhas('tomate_f_sementes', [((x + dx + 0.035 * math.cos(a), 0.035 * math.sin(a), 0.043), (0.008, 0.012, 0.003), (0, 0, math.degrees(a)))
                             for dx in (-0.12, 0, 0.12) for a in (k * math.pi / 2 + 0.6 for k in range(4))],
       '#ffd9a8', pivo=(x, 0, 0), pai=tom, voxel=0, seg=(6, 3))
x = lugar()   # cenoura ralada
bolhas('cenoura_r', lascas(45, 0.17, 0.008, 0.03, 0.055, x, rng), '#f28a1c', pivo=(x, 0, 0), voxel=0, seg=(6, 3), rug=0.5)
x = lugar()   # fatia de queijo com furinhos
q = caixa('queijo', (0.4, 0.34, 0.03), (x, 0, 0.015), '#f9d95e', chanfro=0.006, rug=0.45)
bolhas('queijo_furos', [((x + fx, fy, 0.03), (fr, fr, 0.004)) for fx, fy, fr in ((-0.1, 0.05, 0.025), (0.08, -0.07, 0.03), (0.11, 0.09, 0.018), (-0.05, -0.1, 0.02))],
       '#e3ae1e', pivo=(x, 0, 0.015), pai=q, voxel=0, seg=(12, 4))
x = lugar()   # molho de iogurte em espiral
bolhas('molho', [((x + 0.06 * math.cos(a) * (1 - k / 14), 0.06 * math.sin(a) * (1 - k / 14), 0.012 + k * 0.0008), (0.045, 0.045, 0.012))
                 for k, a in enumerate(i * 0.7 for i in range(15))], '#f4efe0', pivo=(x, 0, 0), voxel=0.006, suave=4, alvo=800, rug=0.2)

# ================= TÁBUA DO PREPARO =================
x = lugar()   # tomate inteiro com cabinho
t = bolhas('tabua_tomate', [((x, 0, 0.17), (0.18, 0.18, 0.16))], '#e5412f', pivo=(x, 0, 0), voxel=0.01, suave=4, alvo=1200, rug=0.25)
bolhas('tabua_tomate_folhas', [((x + 0.05 * math.cos(a), 0.05 * math.sin(a), 0.33), (0.055, 0.015, 0.008), (0, 0, math.degrees(a)))
                               for a in (k * 2 * math.pi / 5 for k in range(5))] + [((x, 0, 0.36), (0.012, 0.012, 0.03))],
       '#3e9a3a', pivo=(x, 0, 0), pai=t, voxel=0, seg=(8, 4))
x = lugar()   # tomate fatiado (três rodelas encostadas)
cs = [(x - 0.15 + i * 0.13, 0, 0.06 + i * 0.01) for i in range(3)]
tf = bolhas('tabua_tomate_fatiado', [(c, (0.15, 0.15, 0.018), (0, -20, 0)) for c in cs], '#d8352b',
            pivo=(x, 0, 0), voxel=0, seg=(24, 8), rug=0.35)
bolhas('tabua_tomate_fatiado_polpa', [((c[0] - 0.006, c[1], c[2] + 0.004), (0.125, 0.125, 0.017), (0, -20, 0)) for c in cs], '#f2665a',
       pivo=(x, 0, 0), pai=tf, voxel=0, seg=(24, 6))
x = lugar()   # cenoura inteira deitada com as folhinhas
cen = bolhas('tabua_cenoura', [((x - 0.22 + k * 0.045, 0, 0.085 - k * 0.006), 0.085 - k * 0.0068) for k in range(11)],
             '#f28a1c', pivo=(x, 0, 0), voxel=0.008, suave=5, alvo=1000, rug=0.55)
bolhas('tabua_cenoura_rama', [((x - 0.33, dy, 0.1 + abs(dy)), (0.13, 0.012, 0.012), (0, -15, math.degrees(dy * 3))) for dy in (-0.05, 0, 0.05)],
       '#4fa83d', pivo=(x, 0, 0), pai=cen, voxel=0, seg=(8, 4))
x = lugar()   # montinho de cenoura ralada
bolhas('tabua_cenoura_ralada', lascas(70, 0.2, 0.01, 0.09, 0.06, x, rng), '#f28a1c', pivo=(x, 0, 0), voxel=0, seg=(6, 3), rug=0.5)

# ================= PLANTAS DA HORTA (base na terra) =================
x = lugar()   # brotinho
br = bolhas('planta_broto', [((x, 0, 0.1), (0.015, 0.015, 0.1))], '#4fa83d', pivo=(x, 0, 0), voxel=0, seg=(8, 4))
bolhas('planta_broto_folhas', [((x - 0.06, 0, 0.2), (0.07, 0.04, 0.012), (0, 15, 0)), ((x + 0.06, 0, 0.22), (0.07, 0.04, 0.012), (0, -15, 0))],
       '#6cc04a', pivo=(x, 0, 0), pai=br, voxel=0, seg=(12, 6))
x = lugar()   # pé de alface (roseta de folhas)
folhas = [((x, 0, 0.14), (0.14, 0.14, 0.12))]
for k in range(9):
    a = k * 2 * math.pi / 9
    folhas.append(((x + 0.17 * math.cos(a), 0.17 * math.sin(a), 0.1), (0.13, 0.08, 0.05), (0, -35, math.degrees(a))))
bolhas('planta_alface', tufos(folhas, 40, 0.03, 0.05, semente=81, zmin=0.03), '#5fb548', pivo=(x, 0, 0), voxel=0.012, suave=4, pelo=0.006, alvo=2500, rug=0.5)
x = lugar()   # três cenouras: ombro laranja aparecendo e rama fininha
cps = [(x - 0.3, 0, 0.03), (x, 0.2, 0.03), (x + 0.3, -0.1, 0.03)]
cp = bolhas('planta_cenoura', [(c, (0.075, 0.075, 0.06)) for c in cps], '#f28a1c', pivo=(x, 0, 0), voxel=0, seg=(16, 8), rug=0.55)
bolhas('planta_cenoura_rama', [((c[0] + 0.06 * math.sin(a), c[1] + 0.06 * math.cos(a), 0.22), (0.012, 0.012, 0.17),
                                (20 * math.cos(a), -20 * math.sin(a), 0)) for c in cps for a in (k * 1.26 for k in range(5))],
       '#4fa83d', pivo=(x, 0, 0), pai=cp, voxel=0, seg=(6, 3))
x = lugar()   # tomateiro com estaca; os tomates ficam num filho que aparece quando amadurece
tp = bolhas('planta_tomate', [((x, 0, 0.45), (0.025, 0.025, 0.45))], '#4f8a3a', pivo=(x, 0, 0), voxel=0, seg=(8, 4))
bolhas('planta_tomate_estaca', [((x - 0.06, 0.04, 0.5), (0.015, 0.015, 0.5))], '#a8713b', pivo=(x, 0, 0), pai=tp, voxel=0, seg=(6, 3))
bolhas('planta_tomate_folhas', tufos([((x + 0.14, 0, 0.45), (0.17, 0.12, 0.08)), ((x - 0.14, 0, 0.68), (0.17, 0.12, 0.08)),
                                      ((x + 0.11, 0, 0.86), (0.15, 0.11, 0.07)), ((x, 0, 0.98), (0.1, 0.1, 0.07))], 30, 0.04, 0.06, semente=82),
       '#4fa83d', pivo=(x, 0, 0), pai=tp, voxel=0.015, suave=3, pelo=0.008, alvo=2000, rug=0.6)
bolhas('planta_tomate_frutos', [((x + 0.18, -0.08, 0.36), 0.085), ((x - 0.17, -0.08, 0.58), 0.08), ((x + 0.05, -0.1, 0.78), 0.075)],
       '#e5412f', pivo=(x, 0, 0), pai=tp, voxel=0, rug=0.2, seg=(16, 8))
x = lugar()   # morangueiro: três touceiras e morangos
mp = bolhas('planta_morango', tufos([((x - 0.28, 0, 0.1), (0.18, 0.18, 0.1)), ((x + 0.28, -0.1, 0.1), (0.18, 0.18, 0.1)),
                                     ((x, 0.28, 0.1), (0.18, 0.18, 0.1))], 30, 0.05, 0.07, semente=83, zmin=0.02),
            '#3e9a3a', pivo=(x, 0, 0), voxel=0.015, suave=3, pelo=0.006, alvo=2000, rug=0.55)
bolhas('planta_morango_frutos', [((x + fx, fy, 0.06), (0.05, 0.05, 0.065)) for fx, fy in ((-0.18, -0.16), (0.38, -0.24), (0.1, 0.12))],
       '#e3304a', pivo=(x, 0, 0), pai=mp, voxel=0, rug=0.25, seg=(14, 8))
x = lugar()   # planta murcha (secou sem água)
mu = bolhas('planta_murcha', [((x + 0.05, 0, 0.12), (0.02, 0.02, 0.13), (0, 35, 0))], '#8a7b5a', pivo=(x, 0, 0), voxel=0, seg=(8, 4))
bolhas('planta_murcha_folhas', [((x + 0.17, 0, 0.12), (0.12, 0.06, 0.015), (0, 30, 10)), ((x - 0.05, 0.05, 0.04), (0.11, 0.06, 0.012), (0, -10, 40))],
       '#a39466', pivo=(x, 0, 0), pai=mu, voxel=0, seg=(12, 6), rug=0.9)
x = lugar()   # lagarta verde gordinha
lg = bolhas('lagarta', [((x - 0.12 + k * 0.065, 0, 0.045 + 0.02 * math.sin(k * 1.4)), 0.045) for k in range(4)], '#7cc14e',
            pivo=(x, 0, 0), voxel=0.006, suave=4, alvo=800, rug=0.5)
bolhas('lagarta_cabeca', [((x + 0.15, 0, 0.06), 0.055)], '#3e7a2a', pivo=(x, 0, 0), pai=lg, voxel=0, seg=(12, 6))
bolhas('lagarta_olhos', [((x + 0.19, sy * 0.025, 0.08), 0.012) for sy in (-1, 1)], '#140b06', pivo=(x, 0, 0), pai=lg, voxel=0, seg=(8, 4))

exportar('comidas.glb')
previas('comidas', pasta_previas(), alvo=(4.5 * VAO, 0, 0.1), dist=3.4,
        vistas=(('louca-sanduiche', -25), ('tabua', -25, 3.0, (11.5 * VAO, 0, 0.1)), ('horta', -25, 4.6, (17 * VAO, 0, 0.3))))
