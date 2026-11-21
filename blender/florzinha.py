# Florzinha: cachorrinha branca, gordinha e fofinha (opção A dos mockups 2D).
# Gera 3d/modelos/florzinha.glb. Partes com nome são animadas no 3d/world.js:
#   flor_cabeca (inclina / late), flor_rabo (abana), flor_olho_L/R (pisca), flor_boca (abre ao latir)
import math, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from comum import bolhas, anel, tufos, limpar, exportar, previas, pasta_previas

C, SOMBRA, CLARO, OLHO = '#fbf5e6', '#ece0c6', '#fffdf7', '#1d120b'
PELO = 0.008

limpar()

# ---- corpo sentado, em formato de pera (bem gordinha embaixo) ----
corpo = bolhas('flor_corpo', tufos([
    ((0, 0.03, 0.26), (0.25, 0.23, 0.26)),                                         # tronco
    ((0, -0.01, 0.16), (0.28, 0.25, 0.16)),                                        # barriga larga
    ((0, -0.09, 0.37), (0.16, 0.12, 0.15)),                                        # peito
    ((-0.09, -0.13, 0.13), (0.07, 0.07, 0.13)), ((0.09, -0.13, 0.13), (0.07, 0.07, 0.13)),        # patas da frente
    ((-0.09, -0.18, 0.045), (0.075, 0.09, 0.045)), ((0.09, -0.18, 0.045), (0.075, 0.09, 0.045)),  # pezinhos
    ((-0.18, 0.05, 0.11), (0.11, 0.15, 0.1)), ((0.18, 0.05, 0.11), (0.11, 0.15, 0.1)),            # coxas
    ((-0.18, -0.09, 0.04), (0.07, 0.09, 0.04)), ((0.18, -0.09, 0.04), (0.07, 0.09, 0.04)),        # pés de trás
], 70, 0.025, 0.045, semente=11, zmin=0.09), C, pelo=PELO, alvo=3500)

# ---- rabo enrolado sobre as costas (gira na base) ----
bolhas('flor_rabo', tufos([
    ((0, 0.25, 0.17), 0.05), ((0, 0.29, 0.23), 0.058), ((0, 0.29, 0.31), 0.06),
    ((0, 0.25, 0.37), 0.055), ((0, 0.2, 0.385), 0.045),
], 14, 0.022, 0.035, semente=12), SOMBRA, pivo=(0, 0.22, 0.14), pai=corpo, pelo=PELO, alvo=1000)

# ---- coleira rosa; a florzinha fica pendurada no peito, logo abaixo da barbinha ----
anel('flor_coleira', (0, -0.02, 0.5), 0.15, 0.02, '#ff6fa5', rot=(-10, 0, 0), escala=(1, 0.9, 1), pai=corpo)
petalas = [((0.028 * math.sin(a), -0.215, 0.425 + 0.028 * math.cos(a)), (0.022, 0.011, 0.022))
           for a in (2 * math.pi * i / 5 for i in range(5))]
bolhas('flor_florzinha', petalas, '#ffd34d', pivo=(0, -0.215, 0.425), pai=corpo, voxel=0, seg=(16, 8))
bolhas('flor_miolo', [((0, -0.226, 0.425), (0.017, 0.01, 0.017))], '#f28a1c', pivo=(0, -0.226, 0.425), pai=corpo, voxel=0, seg=(16, 8))

# ---- cabeça (gira no pescoço) ----
cab = bolhas('flor_cabeca', tufos([
    ((0, -0.06, 0.66), (0.21, 0.19, 0.18)),                                        # crânio
    ((-0.07, -0.05, 0.8), 0.08), ((0.07, -0.05, 0.8), 0.08), ((0, -0.08, 0.83), 0.085),
    ((0, 0.03, 0.8), 0.08), ((0, -0.12, 0.79), 0.07),                              # topete fofo
    ((-0.12, -0.15, 0.6), (0.09, 0.08, 0.08)), ((0.12, -0.15, 0.6), (0.09, 0.08, 0.08)),  # bochechas
    ((0, -0.02, 0.53), (0.15, 0.13, 0.08)),                                        # papada / pescoço
    ((0, 0.07, 0.56), (0.14, 0.1, 0.09)),                                          # nuca (esconde a emenda)
], 45, 0.022, 0.04, semente=13, zmin=0.52), C, pivo=(0, -0.04, 0.48), pai=corpo, pelo=PELO, alvo=3500)

bolhas('flor_focinho', [
    ((0, -0.22, 0.6), (0.085, 0.075, 0.065)),                                      # focinho
    ((-0.05, -0.21, 0.545), (0.06, 0.06, 0.05)), ((0.05, -0.21, 0.545), (0.06, 0.06, 0.05)),
    ((0, -0.2, 0.52), (0.06, 0.05, 0.05)),                                         # barbinha
], CLARO, pivo=(0, -0.22, 0.6), pai=cab, pelo=PELO * 0.7, alvo=1200)

for sx, lado in ((-1, 'L'), (1, 'R')):
    # orelhas caídas, um pouco mais escuras, com a pontinha fofa
    bolhas(f'flor_orelha_{lado}', tufos([
        ((sx * 0.2, -0.03, 0.6), (0.065, 0.07, 0.16), (0, -sx * 20, 0)),
        ((sx * 0.215, -0.03, 0.47), (0.06, 0.065, 0.06)),
    ], 14, 0.02, 0.032, semente=14 + sx, zmin=0.42), SOMBRA, pivo=(sx * 0.17, -0.03, 0.74), pai=cab, pelo=PELO, alvo=900)
    # olhos pretos redondos com brilho (a origem no centro: o jogo achata para piscar)
    olho = bolhas(f'flor_olho_{lado}', [((sx * 0.085, -0.232, 0.685), (0.036, 0.02, 0.038))],
                  OLHO, pivo=(sx * 0.085, -0.232, 0.685), pai=cab, voxel=0, rug=0.2, seg=(20, 10))
    bolhas(f'flor_brilho_{lado}', [((sx * 0.085 + 0.012, -0.25, 0.698), 0.011)],
           '#ffffff', pivo=(sx * 0.085 + 0.012, -0.25, 0.698), pai=olho, voxel=0, rug=0.2, seg=(10, 6))
    bolhas(f'flor_bochecha_{lado}', [((sx * 0.135, -0.222, 0.625), (0.03, 0.008, 0.018), (0, 0, sx * 20))],
           '#f3a1a0', pivo=(sx * 0.135, -0.222, 0.625), pai=cab, voxel=0, seg=(16, 8))

bolhas('flor_nariz', [((0, -0.297, 0.625), (0.034, 0.024, 0.026))], OLHO,
       pivo=(0, -0.297, 0.625), pai=cab, voxel=0, rug=0.25, seg=(20, 10))
boca = bolhas('flor_boca', [((0, -0.278, 0.552), (0.035, 0.02, 0.01))], '#6b2a2a',
              pivo=(0, -0.278, 0.552), pai=cab, voxel=0, seg=(20, 10))
bolhas('flor_lingua', [((0, -0.288, 0.545), (0.018, 0.012, 0.01))], '#f07c8a',
       pivo=(0, -0.288, 0.545), pai=boca, voxel=0, seg=(12, 6))

exportar('florzinha.glb')
previas('florzinha', pasta_previas(), alvo=(0, 0, 0.42), dist=2.1)
