# Jade: porquinha-da-índia laranja, faixa branca no focinho, peito e queixo brancos (foto PERSONAGENS.jpg).
# Gera 3d/modelos/jade.glb com as partes que o 3d/world.js usa:
#   jade_olho_L/R (piscar / dormir), jade_lacinho, jade_chapeu, jade_cachecol (acessórios da loja),
#   jade_regador (quando vai regar a horta). O corpo inteiro respira e pula pelo grupo do jogo.
import math, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from comum import bolhas, anel, tufos, pintar, mistura, suave, linear, limpar, exportar, previas, pasta_previas

LARANJA, LARANJA_ESC, BRANCO = linear('#d47a28'), linear('#bf6420'), linear('#fbf3e6')

limpar()

# ---- corpo e cabeça numa malha só (formato de pãozinho), pelo curtinho ----
forma = [
    ((0, 0.08, 0.27), (0.315, 0.36, 0.25)),        # corpo
    ((0, 0.05, 0.16), (0.3, 0.34, 0.14)),          # barriga achatada
    ((0, 0.3, 0.24), (0.26, 0.16, 0.2)),           # bumbum redondo
    ((0, -0.29, 0.33), (0.25, 0.2, 0.2)),          # cabeça
    ((0, -0.45, 0.29), (0.13, 0.09, 0.11)),        # focinho
    ((-0.12, -0.38, 0.26), 0.1), ((0.12, -0.38, 0.26), 0.1),   # bochechas
]
corpo = bolhas('jade_corpo', tufos(forma, 60, 0.018, 0.032, semente=21, zmin=0.1), '#d47a28', pelo=0.005, alvo=4500)

def cor(p):
    """Manchas da Jade: faixa branca que afina até a testa, focinho, queixo, peito e barriga."""
    x, y, z = p.x, p.y, p.z
    frente = -y
    largura = 0.022 + max(0.0, frente - 0.33) * 0.45
    faixa = suave(0.24, 0.3, frente) * (1 - suave(largura, largura + 0.03, abs(x))) * suave(0.24, 0.3, z)
    focinho = suave(0.46, 0.5, frente)
    queixo = suave(0.3, 0.38, frente) * (1 - suave(0.17, 0.23, z))
    barriga = 1 - suave(0.08, 0.15, z)
    traseira = suave(0.0, 0.12, y) * (1 - suave(0.22, 0.32, z)) * suave(0.08, 0.18, abs(x))
    w = min(1.0, max(faixa, focinho, queixo, barriga, traseira))
    base = mistura(LARANJA, LARANJA_ESC, suave(0.4, 0.52, z) * 0.6)   # dorso um pouco mais escuro
    return mistura(base, BRANCO, w)
pintar(corpo, cor)

for sx, lado in ((-1, 'L'), (1, 'R')):
    # orelhas em pétala, abertas para os lados, com o interior rosado
    orelha = bolhas(f'jade_orelha_{lado}', [((sx * 0.19, -0.2, 0.5), (0.11, 0.09, 0.03), (-15, sx * 55, sx * 10))], '#c25a22',
                    pivo=(sx * 0.17, -0.2, 0.47), pai=corpo, voxel=0)
    bolhas(f'jade_orelha_dentro_{lado}', [((sx * 0.192, -0.212, 0.5), (0.07, 0.055, 0.02), (-15, sx * 55, sx * 10))], '#e9a59a',
           pivo=(sx * 0.17, -0.2, 0.47), pai=orelha, voxel=0)
    # olhos grandes, escuros e brilhantes, dos lados da cabeça
    olho = bolhas(f'jade_olho_{lado}', [((sx * 0.215, -0.37, 0.37), (0.05, 0.055, 0.056))], '#140b06',
                  pivo=(sx * 0.215, -0.37, 0.37), pai=corpo, voxel=0, rug=0.15)
    bolhas(f'jade_brilho_{lado}', [((sx * 0.245, -0.41, 0.395), 0.016), ((sx * 0.25, -0.38, 0.35), 0.008)], '#ffffff',
           pivo=(sx * 0.215, -0.37, 0.37), pai=olho, voxel=0, rug=0.1, seg=(10, 6))
    # patinhas rosadas
    for y in (-0.26, 0.3):
        bolhas(f'jade_pata_{lado}{"F" if y < 0 else "T"}', [((sx * 0.15, y, 0.025), (0.05, 0.065, 0.025))], '#f1a9a0',
               pivo=(sx * 0.15, y, 0.025), pai=corpo, voxel=0)
    # bigodes finos
    for dz in (-0.025, 0.02):
        x0, y0, z0, x1, y1, z1 = sx * 0.07, -0.49, 0.31 + dz, sx * 0.28, -0.47, 0.3 + dz * 2
        meio = ((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2)
        comp = math.dist((x0, y0, z0), (x1, y1, z1)) / 2
        ang = math.degrees(math.atan2(y1 - y0, x1 - x0))
        bolhas(f'jade_bigode_{lado}{"A" if dz > 0 else "B"}', [(meio, (comp, 0.0035, 0.0035), (0, 0, ang))], '#f7ead8',
               pivo=meio, pai=corpo, voxel=0, seg=(8, 4))

bolhas('jade_nariz', [((0, -0.515, 0.355), (0.048, 0.03, 0.027))], '#e98a92', pivo=(0, -0.515, 0.355), pai=corpo, voxel=0, rug=0.4)
bolhas('jade_boca', [((0, -0.53, 0.318), (0.004, 0.004, 0.02)), ((-0.018, -0.525, 0.296), (0.022, 0.004, 0.004)),
                     ((0.018, -0.525, 0.296), (0.022, 0.004, 0.004))], '#6b3f2a', pivo=(0, -0.53, 0.31), pai=corpo, voxel=0, seg=(8, 4))

# ---- acessórios da loja (o jogo mostra só o que estiver vestido) ----
laco = bolhas('jade_lacinho', [((0.21, -0.12, 0.56), 0.028)], '#e0457f', pivo=(0.21, -0.12, 0.56), pai=corpo, voxel=0, rug=0.5)
bolhas('jade_lacinho_abas', [((0.155, -0.12, 0.56), (0.055, 0.025, 0.045)), ((0.265, -0.12, 0.56), (0.055, 0.025, 0.045))],
       '#ff6fa5', pivo=(0.21, -0.12, 0.56), pai=laco, voxel=0.006, suave=4, alvo=800, rug=0.5)
bolhas('jade_chapeu', [((0, -0.3, 0.6), (0.13, 0.13, 0.06)), ((-0.07, -0.27, 0.7), 0.1), ((0.07, -0.27, 0.7), 0.1),
                       ((0, -0.36, 0.71), 0.1), ((0, -0.22, 0.73), 0.09)],
       '#ffffff', pivo=(0, -0.3, 0.6), pai=corpo, voxel=0.01, suave=6, alvo=1500, rug=0.9)
cachecol = anel('jade_cachecol', (0, -0.15, 0.3), 0.29, 0.035, '#d1495b', rot=(90, 0, 0), escala=(0.86, 0.72, 1), pai=corpo, rug=0.95)
bolhas('jade_cachecol_ponta', [((0.12, -0.3, 0.14), (0.04, 0.018, 0.08), (20, 0, -12))], '#d1495b',
       pivo=(0.12, -0.3, 0.14), pai=cachecol, voxel=0, rug=0.95)
reg = bolhas('jade_regador', [((0, 0.15, 0.56), (0.075, 0.075, 0.065))], '#4aa3df', pivo=(0, 0.15, 0.56), pai=corpo, voxel=0, rug=0.3)
bolhas('jade_regador_bico', [((0, 0.05, 0.58), (0.013, 0.09, 0.013), (-30, 0, 0))], '#4aa3df', pivo=(0, 0.05, 0.58), pai=reg, voxel=0, rug=0.3)

exportar('jade.glb')
previas('jade', pasta_previas(), alvo=(0, -0.05, 0.3), dist=2.2,
        vistas=(('frente', -30), ('lado', -90), ('costas', 150), ('rosto', -15, 1.2, (0, -0.3, 0.33))))
