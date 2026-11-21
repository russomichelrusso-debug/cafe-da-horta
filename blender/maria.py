# Maria Alice: cabelo castanho ondulado, olhos castanhos, vestido vinho + avental branco.
# Gera 3d/modelos/maria.glb com as MESMAS juntas que o 3d/world.js já anima:
#   maria_perna_L/R (andar), maria_braco_L/R (acenar, pegar, regar), maria_cabeca (olhar),
#   maria_olho_L/R (piscar), maria_sobrancelha_L/R (preocupada), maria_sorriso (vira ao contrário),
#   maria_regador + maria_bico (aparece na horta; a água sai do bico)
import math, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from comum import bolhas, anel, torno, ponto, tufos, limpar, exportar, previas, pasta_previas

PELE, PELE2 = '#f6d2b8', '#efc3a4'
VINHO, VINHO2, VINHO3 = '#8c2738', '#a8384b', '#6e1c2b'
CAB = '#5b3a25'
BRANCO, ESCURO = '#fffaf3', '#2a160b'
FRENTE = -math.pi / 2          # a frente do personagem é -Y
DOBRAS = (9, 0.06, 1.2, 0.55)  # pregas da saia rodada

limpar()

# ---------------- corpo: vestido de saia rodada (gira com a Maria inteira) ----------------
corpo = torno('maria_corpo', [
    (0.001, 0.55), (0.58, 0.55), (0.6, 0.6), (0.5, 0.85), (0.38, 1.15), (0.27, 1.33),
    (0.25, 1.4), (0.28, 1.58), (0.25, 1.74), (0.14, 1.8), (0.001, 1.8)], VINHO, dobras=DOBRAS)
torno('maria_barra', [(0.6, 0.56), (0.6, 0.61)], VINHO2, pai=corpo, dobras=DOBRAS, folga=0.012, sub=0)  # barra segue as pregas
anel('maria_faixa', (0, 0, 1.36), 0.262, 0.035, VINHO3, pai=corpo)
# avental branco que acompanha as pregas da saia + peitilho, alças, bolso e coraçãozinho
torno('maria_avental', [(0.6, 0.63), (0.52, 0.85), (0.4, 1.15), (0.29, 1.34)], BRANCO, pai=corpo,
      seg=24, a0=FRENTE - 0.75, a1=FRENTE + 0.75, dobras=DOBRAS, folga=0.018)
bolhas('maria_peitilho', [((0, -0.262, 1.52), (0.15, 0.018, 0.15))], BRANCO, pivo=(0, -0.262, 1.52), pai=corpo, voxel=0)
bolhas('maria_bolso', [((0, -0.49, 0.97), (0.1, 0.012, 0.07), (-22, 0, 0))], '#f1e4d6', pivo=(0, -0.49, 0.97), pai=corpo, voxel=0)
bolhas('maria_coracao', [((-0.024, -0.282, 1.56), (0.045, 0.014, 0.04)), ((0.024, -0.282, 1.56), (0.045, 0.014, 0.04)),
                         ((0, -0.282, 1.525), (0.04, 0.012, 0.04), (0, 45, 0))],
       '#e35d6a', pivo=(0, -0.282, 1.55), pai=corpo, voxel=0.004, suave=4, alvo=600)
bolhas('maria_pescoco', [((0, 0, 1.86), (0.085, 0.085, 0.12))], PELE2, pivo=(0, 0, 1.86), pai=corpo, voxel=0)
anel('maria_golinha', (0, 0.0, 1.78), 0.11, 0.025, BRANCO, rot=(-8, 0, 0), pai=corpo)

# ---------------- pernas (giram no quadril ao andar) com sapatinhos boneca ----------------
for sx, lado in ((-1, 'L'), (1, 'R')):
    perna = bolhas(f'maria_perna_{lado}', [((sx * 0.13, 0, 0.34), (0.066, 0.066, 0.27))], PELE2,
                   pivo=(sx * 0.13, 0, 0.6), pai=corpo, voxel=0)
    bolhas(f'maria_sapato_{lado}', [((sx * 0.13, -0.05, 0.055), (0.088, 0.13, 0.056))], '#7a2c2c',
           pivo=(sx * 0.13, -0.05, 0.055), pai=perna, voxel=0, rug=0.35)

# ---------------- braços: manga bufante, braço, mão com polegar ----------------
for sx, lado in ((-1, 'L'), (1, 'R')):
    braco = bolhas(f'maria_braco_{lado}', [((sx * 0.3, 0, 1.38), (0.062, 0.062, 0.25))], PELE2,
                   pivo=(sx * 0.3, 0, 1.7), pai=corpo, voxel=0)
    bolhas(f'maria_manga_{lado}', tufos([((sx * 0.3, 0, 1.67), (0.125, 0.12, 0.11))], 8, 0.03, 0.045, semente=3 + sx),
           VINHO, pivo=(sx * 0.3, 0, 1.67), pai=braco, voxel=0.008, suave=6, alvo=900)
    bolhas(f'maria_mao_{lado}', [((sx * 0.3, -0.01, 1.08), (0.07, 0.06, 0.08)),
                                 ((sx * 0.3 - sx * 0.05, -0.05, 1.1), (0.025, 0.025, 0.04))],
           PELE, pivo=(sx * 0.3, -0.01, 1.08), pai=braco, voxel=0.006, suave=6, alvo=800)
    if sx > 0:  # regador na mão direita (o jogo mostra só na horta)
        reg = bolhas('maria_regador', [((0.3, -0.05, 0.92), (0.13, 0.13, 0.11))], '#4aa3df',
                     pivo=(0.3, -0.05, 1.0), pai=braco, voxel=0, rug=0.3)
        bolhas('maria_regador_bico', [((0.3, -0.2, 0.96), (0.022, 0.16, 0.022), (-35, 0, 0))], '#4aa3df',
               pivo=(0.3, -0.2, 0.96), pai=reg, voxel=0, rug=0.3)
        anel('maria_regador_alca', (0.3, 0.0, 1.03), 0.08, 0.015, '#2f7fb5', rot=(0, 90, 0), pai=reg, a0=0, a1=math.pi)
        ponto('maria_bico', (0.3, -0.37, 1.08), pai=reg)

# ---------------- cabeça (gira no pescoço) ----------------
cab = bolhas('maria_cabeca', [
    ((0, 0, 2.22), (0.42, 0.4, 0.41)),                 # crânio
    ((0, -0.17, 2.04), (0.24, 0.2, 0.16)),             # queixo e bochechas (rosto mais redondinho)
], PELE, pivo=(0, 0, 2.22), pai=corpo, voxel=0.01, suave=8, alvo=3000, rug=0.6)
bolhas('maria_nariz', [((0, -0.405, 2.14), (0.034, 0.028, 0.03))], PELE2, pivo=(0, -0.405, 2.14), pai=cab, voxel=0)
for sx, lado in ((-1, 'L'), (1, 'R')):
    bolhas(f'maria_orelha_{lado}', [((sx * 0.41, -0.02, 2.19), (0.05, 0.07, 0.08))], PELE2,
           pivo=(sx * 0.41, -0.02, 2.19), pai=cab, voxel=0)
    bolhas(f'maria_bochecha_{lado}', [((sx * 0.25, -0.3, 2.1), (0.075, 0.02, 0.042), (0, 0, -sx * 25))], '#f3a1a0',
           pivo=(sx * 0.25, -0.3, 2.1), pai=cab, voxel=0)
    # olho grande castanho: branco, íris, pupila, brilhos, pálpebra e cílios (piscar = achatar o grupo)
    ex, ey, ez = sx * 0.155, -0.342, 2.22
    olho = bolhas(f'maria_olho_{lado}', [((ex, ey, ez), (0.09, 0.034, 0.108))], '#ffffff', pivo=(ex, ey, ez), pai=cab, voxel=0, rug=0.3)
    bolhas(f'maria_iris_{lado}', [((ex, ey - 0.024, ez - 0.008), (0.068, 0.022, 0.078))], '#7a4524', pivo=(ex, ey - 0.024, ez), pai=olho, voxel=0, rug=0.3)
    bolhas(f'maria_iris2_{lado}', [((ex, ey - 0.038, ez - 0.03), (0.042, 0.012, 0.036))], '#a3693c', pivo=(ex, ey - 0.038, ez), pai=olho, voxel=0, rug=0.3)
    bolhas(f'maria_pupila_{lado}', [((ex, ey - 0.042, ez), (0.036, 0.012, 0.04))], ESCURO, pivo=(ex, ey - 0.042, ez), pai=olho, voxel=0, rug=0.2)
    bolhas(f'maria_brilho_{lado}', [((ex + 0.026, ey - 0.052, ez + 0.038), 0.02), ((ex - 0.022, ey - 0.052, ez - 0.03), 0.01)],
           '#ffffff', pivo=(ex, ey - 0.052, ez), pai=olho, voxel=0, rug=0.1, seg=(12, 6))
    anel(f'maria_palpebra_{lado}', (ex, ey - 0.012, ez + 0.012), 0.09, 0.013, ESCURO, rot=(90, 0, 0), escala=(1, 1, 1.2),
         pai=olho, a0=0.05, a1=math.pi - 0.05, seg=20, lados=6)
    bolhas(f'maria_cilios_{lado}', [((ex + sx * (0.075 + k * 0.018), ey - 0.02, ez + 0.09 - k * 0.022), (0.007, 0.006, 0.026),
                                     (0, sx * (30 + k * 20), 0)) for k in range(3)],
           ESCURO, pivo=(ex, ey, ez), pai=olho, voxel=0, seg=(8, 4))
    bolhas(f'maria_sobrancelha_{lado}', [((sx * 0.155, -0.345, 2.395), (0.065, 0.016, 0.018), (0, sx * 7, 0))], '#3b2416',
           pivo=(sx * 0.155, -0.345, 2.395), pai=cab, voxel=0, seg=(16, 8))
# sorriso (∪); o jogo gira 180° quando ela fica preocupada (∩)
anel('maria_sorriso', (0, -0.372, 2.05), 0.06, 0.013, '#b5485a', rot=(90, 0, 0), pai=cab, a0=math.pi + 0.15, a1=2 * math.pi - 0.15, seg=16, lados=6)

# ---------------- cabelo castanho ondulado: volume, mechas com ondas e franja de lado ----------------
mechas = [((0, 0.04, 2.36), (0.445, 0.41, 0.35)),        # topo
          ((0, 0.13, 2.17), (0.46, 0.36, 0.45))]         # nuca / volume de trás
def mecha(x, y, z0, z1, r0, r1, fase):
    """Uma mecha ondulada: bolinhas descendo com um zigue-zague suave."""
    n = 10
    return [((x + math.sin(fase + k * 1.1) * 0.03, y + math.cos(fase + k * 0.9) * 0.015, z0 + (z1 - z0) * k / (n - 1)),
             r0 + (r1 - r0) * k / (n - 1)) for k in range(n)]
for k in range(9):                                       # mechas das costas
    a = -1.9 + k * (3.8 / 8)
    mechas += mecha(math.sin(a) * 0.4, math.cos(a) * 0.3 + 0.05, 2.0, 1.28, 0.11, 0.095, k * 1.7)
for sx in (-1, 1):                                       # mechas da frente, sobre os ombros
    mechas += mecha(sx * 0.37, -0.1, 2.08, 1.6, 0.1, 0.09, 2 + sx)   # até o ombro: não tapa os braços
    mechas.append(((sx * 0.4, 0.02, 2.2), (0.1, 0.22, 0.2)))    # lateral (liga ao topo)
mechas += [((-0.17, -0.26, 2.49), (0.28, 0.12, 0.1), (20, 0, 20)),  # franja de lado
           ((0.03, -0.27, 2.55), (0.24, 0.1, 0.08), (25, 0, 10)),
           ((0.2, -0.25, 2.47), (0.17, 0.09, 0.08), (20, 0, -12))]
bolhas('maria_cabelo', mechas, CAB, pivo=(0, 0, 2.22), pai=cab, voxel=0.012, suave=8, pelo=0.01, alvo=5000, rug=0.6)

exportar('maria.glb')
previas('maria', pasta_previas(), alvo=(0, 0, 1.35), dist=5.2,
        vistas=(('frente', -20), ('lado', -80), ('costas', 160), ('rosto', -12, 2.0, (0, 0, 2.2))))
