# Funções comuns para modelar o Café da Horta 3D no Blender por script.
# Cada personagem tem seu arquivo (ex.: florzinha.py). Para gerar o .glb:
#   blender --background --factory-startup --python blender/florzinha.py -- [pasta_das_previas]
# Convenção: frente do personagem = -Y do Blender (vira +Z no three.js), pés no chão (z = 0),
# 1 unidade = 1 unidade do jogo. Cada parte que mexe no jogo é um objeto separado, com a
# origem no ponto de giro (pescoço, base do rabo...), e o nome dele é usado no world.js.
import bpy, bmesh, math, os, random, sys
from mathutils import Matrix, Vector, Euler

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SAIDA = os.path.join(RAIZ, '3d', 'modelos')


def limpar():
    for o in list(bpy.data.objects):
        bpy.data.objects.remove(o, do_unlink=True)
    for m in list(bpy.data.meshes):
        bpy.data.meshes.remove(m)


def linear(hexa):
    """'#rrggbb' (sRGB, como no CSS) -> RGBA linear, que é o que o Blender e o glTF usam."""
    h = hexa.lstrip('#')
    def lin(c):
        c = int(c, 16) / 255
        return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
    return (lin(h[0:2]), lin(h[2:4]), lin(h[4:6]), 1.0)


_mats = {}
def material(hexa, rug=0.85):
    k = (hexa, rug)
    if k in _mats:
        return _mats[k]
    m = bpy.data.materials.new('cor' + hexa)
    try:
        m.use_nodes = True  # some no Blender 5 (sempre usa nós), por isso o try
    except Exception:
        pass
    b = m.node_tree.nodes.get('Principled BSDF')
    b.inputs['Base Color'].default_value = linear(hexa)
    b.inputs['Roughness'].default_value = rug
    m.diffuse_color = linear(hexa)
    _mats[k] = m
    return m


def mundo(ob):
    """Posição de mundo da origem (as partes só têm translação, sem rotação)."""
    p = Vector((0, 0, 0))
    while ob:
        p += ob.location
        ob = ob.parent
    return p


def _novo(nome, bm, cor, pivo, pai, rug):
    me = bpy.data.meshes.new(nome)
    bm.to_mesh(me)
    bm.free()
    ob = bpy.data.objects.new(nome, me)
    bpy.context.collection.objects.link(ob)
    ob.parent = pai
    ob.location = Vector(pivo) - (mundo(pai) if pai else Vector((0, 0, 0)))
    me.materials.append(material(cor, rug))
    return ob


def _aplicar(ob):
    dg = bpy.context.evaluated_depsgraph_get()
    me = bpy.data.meshes.new_from_object(ob.evaluated_get(dg))
    velho = ob.data
    ob.modifiers.clear()
    ob.data = me
    bpy.data.meshes.remove(velho)
    me.name = ob.name  # sem ".002" no nome que vai para o .glb


def tris(ob):
    return sum(len(p.vertices) - 2 for p in ob.data.polygons)


def _liso(ob):
    for p in ob.data.polygons:
        p.use_smooth = True


def _normal(e):
    c, r = e[0], e[1]
    rot = e[2] if len(e) > 2 else (0, 0, 0)
    if isinstance(r, (int, float)):
        r = (r, r, r)
    return Vector(c), r, Euler([math.radians(a) for a in rot]).to_matrix()


def _dentro(p, e, folga=0.97):
    c, r, R = e
    q = R.inverted() @ (p - c)
    return (q.x / r[0]) ** 2 + (q.y / r[1]) ** 2 + (q.z / r[2]) ** 2 < folga ** 2


def tufos(esferas, n, rmin, rmax, semente=1, zmin=0.05):
    """Espalha bolinhas pela superfície (só onde ficam à mostra): vira o contorno fofo do pelo."""
    base = [_normal(e) for e in esferas]
    rng = random.Random(semente)
    pesos = [(sum(r) / 3) ** 2 for _, r, _ in base]
    novos, tent = [], 0
    while len(novos) < n and tent < n * 30:
        tent += 1
        i = rng.choices(range(len(base)), pesos)[0]
        c, r, R = base[i]
        d = Vector((rng.gauss(0, 1), rng.gauss(0, 1), rng.gauss(0, 1))).normalized()
        sai = R @ Vector((d.x * r[0], d.y * r[1], d.z * r[2]))
        p = c + sai
        if p.z < zmin or any(_dentro(p, o) for j, o in enumerate(base) if j != i):
            continue
        rr = rng.uniform(rmin, rmax)
        novos.append((tuple(p - sai.normalized() * rr * 0.45), rr))  # afunda 45%: fica um tufo, não uma bola
    return list(esferas) + novos


def bolhas(nome, esferas, cor, pivo=(0, 0, 0), pai=None, voxel=0.008, suave=10, pelo=0.0,
           alvo=2500, rug=0.85, seg=(20, 10)):
    """Junta elipsoides numa malha só, com as emendas arredondadas (como massinha).
    esferas: [(centro, raio ou (rx, ry, rz), [rotação em graus xyz])] em coordenadas de mundo.
    voxel=0 deixa as esferas separadas (olhos, nariz). pelo = altura das ondinhas do pelo.
    alvo = máximo de triângulos (o jogo roda no iPhone)."""
    bm = bmesh.new()
    for e in esferas:
        c, r, R = _normal(e)
        M = Matrix.Translation(c - Vector(pivo)) @ R.to_4x4() @ Matrix.Diagonal((r[0], r[1], r[2], 1))
        bmesh.ops.create_uvsphere(bm, u_segments=seg[0], v_segments=seg[1], radius=1.0, matrix=M)
    ob = _novo(nome, bm, cor, pivo, pai, rug)
    if voxel:
        rm = ob.modifiers.new('remesh', 'REMESH')
        rm.mode = 'VOXEL'
        rm.voxel_size = voxel
        sm = ob.modifiers.new('suave', 'SMOOTH')
        sm.factor = 0.9
        sm.iterations = suave
    if pelo:
        tex = bpy.data.textures.new(nome + '_pelo', 'CLOUDS')
        tex.noise_scale = 0.02
        d = ob.modifiers.new('pelo', 'DISPLACE')
        d.texture = tex
        d.texture_coords = 'GLOBAL'  # mesmo desenho do pelo em todas as partes
        d.strength = pelo
    if ob.modifiers:
        _aplicar(ob)
    n = tris(ob)
    if n > alvo:
        dec = ob.modifiers.new('reduz', 'DECIMATE')
        dec.ratio = alvo / n
        _aplicar(ob)
    _liso(ob)
    return ob


def anel(nome, centro, R, r, cor, rot=(0, 0, 0), escala=(1, 1, 1), pai=None, seg=40, lados=10, rug=0.6,
         a0=0.0, a1=2 * math.pi):
    """Toro (coleira, aros) deitado no plano XY. R = raio do anel, r = grossura.
    a0..a1 = só um arco (sorriso, pálpebra)."""
    bm = bmesh.new()
    fechado = abs(a1 - a0 - 2 * math.pi) < 1e-6
    n = seg if fechado else seg + 1
    vs = [[bm.verts.new(((R + r * math.cos(b)) * math.cos(a), (R + r * math.cos(b)) * math.sin(a), r * math.sin(b)))
           for b in (2 * math.pi * j / lados for j in range(lados))]
          for a in (a0 + (a1 - a0) * i / seg for i in range(n))]
    for i in range(seg):
        for j in range(lados):
            bm.faces.new((vs[i][j], vs[(i + 1) % n][j], vs[(i + 1) % n][(j + 1) % lados], vs[i][(j + 1) % lados]))
    M = Euler([math.radians(a) for a in rot]).to_matrix().to_4x4() @ Matrix.Diagonal((*escala, 1))
    bmesh.ops.transform(bm, matrix=M, verts=bm.verts)
    ob = _novo(nome, bm, cor, centro, pai, rug)
    _liso(ob)
    return ob


def torno(nome, perfil, cor, pivo=(0, 0, 0), pai=None, seg=56, a0=0.0, a1=2 * math.pi,
          dobras=None, folga=0.0, sub=1, rug=0.85):
    """Superfície que gira em volta do eixo Z (vestido, saia). perfil = [(raio, z)] de baixo para cima.
    a0..a1 = só um pedaço (avental; a frente é -90°). dobras = (n, amplitude, z_começo, z_barra):
    pregas que nascem em z_começo e ficam mais fundas até a barra. folga = afasta do corpo (avental)."""
    bm = bmesh.new()
    fechado = abs(a1 - a0 - 2 * math.pi) < 1e-6
    n = seg if fechado else seg + 1
    aneis = []
    for r, z in perfil:
        anel_v = []
        for i in range(n):
            a = a0 + (a1 - a0) * i / seg
            rr = r
            if dobras:
                k, amp, zi, zb = dobras
                w = min(1.0, max(0.0, (zi - z) / (zi - zb)))
                rr = r * (1 + amp * w * math.sin(k * a))
            rr += folga
            anel_v.append(bm.verts.new((rr * math.cos(a) - pivo[0], rr * math.sin(a) - pivo[1], z - pivo[2])))
        aneis.append(anel_v)
    for j in range(len(aneis) - 1):
        for i in range(seg):
            bm.faces.new((aneis[j][i], aneis[j][(i + 1) % n], aneis[j + 1][(i + 1) % n], aneis[j + 1][i]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    ob = _novo(nome, bm, cor, pivo, pai, rug)
    if sub:
        s = ob.modifiers.new('sub', 'SUBSURF')
        s.levels = s.render_levels = sub
        _aplicar(ob)
    _liso(ob)
    return ob


def pintar(ob, cor_em, rug=0.85):
    """Pinta cada vértice com cor_em(posição de mundo) -> RGBA linear (manchas sem costura).
    O material passa a usar essa pintura; o glTF leva como COLOR_0 e o three.js multiplica pela cor."""
    me = ob.data
    att = me.color_attributes.new('Pintura', 'FLOAT_COLOR', 'POINT')
    base = mundo(ob)
    for i, v in enumerate(me.vertices):
        att.data[i].color = cor_em(v.co + base)
    m = bpy.data.materials.new(ob.name + '_pintura')
    try:
        m.use_nodes = True
    except Exception:
        pass
    nt = m.node_tree
    bsdf = nt.nodes.get('Principled BSDF')
    bsdf.inputs['Roughness'].default_value = rug
    vc = nt.nodes.new('ShaderNodeVertexColor')
    vc.layer_name = 'Pintura'
    nt.links.new(vc.outputs['Color'], bsdf.inputs['Base Color'])
    me.materials.clear()
    me.materials.append(m)


def mistura(a, b, t):
    return tuple(a[i] + (b[i] - a[i]) * t for i in range(4))


def suave(a, b, x):
    t = min(1.0, max(0.0, (x - a) / (b - a)))
    return t * t * (3 - 2 * t)


def ponto(nome, pos, pai=None):
    """Nó vazio (sem malha): marca um lugar que o jogo usa, como o bico do regador."""
    ob = bpy.data.objects.new(nome, None)
    bpy.context.collection.objects.link(ob)
    ob.parent = pai
    ob.location = Vector(pos) - (mundo(pai) if pai else Vector((0, 0, 0)))
    return ob


def exportar(arquivo):
    os.makedirs(SAIDA, exist_ok=True)
    caminho = os.path.join(SAIDA, arquivo)
    bpy.ops.export_scene.gltf(filepath=caminho, export_format='GLB', export_apply=True, export_yup=True)
    total = sum(tris(o) for o in bpy.data.objects if o.type == 'MESH')
    print(f'[modelo] {arquivo}: {total} triângulos, {os.path.getsize(caminho) // 1024} KB')
    return caminho


def previas(nome, pasta, alvo=(0, 0, 0.45), dist=2.0, vistas=(('frente', -20), ('lado', -75), ('costas', 160))):
    """Renderiza fotos de conferência (chão, luz e câmera entram DEPOIS do export)."""
    if not pasta:
        return
    os.makedirs(pasta, exist_ok=True)
    sc = bpy.context.scene
    for eng in ('BLENDER_EEVEE_NEXT', 'BLENDER_EEVEE', 'BLENDER_WORKBENCH'):
        try:
            sc.render.engine = eng
            break
        except Exception:
            continue
    try:
        sc.eevee.taa_render_samples = 32
    except Exception:
        pass
    sc.view_settings.view_transform = 'Standard'  # cores iguais às do jogo (sem "lavar" o branco)
    sc.render.resolution_x = sc.render.resolution_y = 720
    if sc.world is None:
        sc.world = bpy.data.worlds.new('mundo')
    try:
        sc.world.use_nodes = True
    except Exception:
        pass
    bg = sc.world.node_tree.nodes.get('Background')
    bg.inputs['Color'].default_value = linear('#cfe9ff')
    bg.inputs['Strength'].default_value = 0.9
    bm = bmesh.new()
    bmesh.ops.create_grid(bm, x_segments=1, y_segments=1, size=3)
    _novo('chao_previa', bm, '#e7cfa6', (0, 0, 0), None, 0.9)
    sol = bpy.data.objects.new('sol', bpy.data.lights.new('sol', 'SUN'))
    sol.data.energy = 3.5
    sol.rotation_euler = Euler((math.radians(50), 0, math.radians(-30)))
    sc.collection.objects.link(sol)
    cam = bpy.data.objects.new('cam', bpy.data.cameras.new('cam'))
    cam.data.lens = 55
    sc.collection.objects.link(cam)
    sc.camera = cam
    for v in vistas:  # (rótulo, ângulo[, distância, alvo]) — os dois últimos para um close
        rotulo, ang = v[0], v[1]
        d = v[2] if len(v) > 2 else dist
        al = Vector(v[3] if len(v) > 3 else alvo)
        a = math.radians(ang - 90)  # 0° = de frente (-Y)
        cam.location = al + Vector((math.cos(a) * d, math.sin(a) * d, 0.35 * d))
        cam.rotation_euler = (al - cam.location).to_track_quat('-Z', 'Y').to_euler()
        sc.render.filepath = os.path.join(pasta, f'{nome}-{rotulo}.png')
        bpy.ops.render.render(write_still=True)
        print('[previa]', sc.render.filepath)


def pasta_previas():
    """Pasta das prévias = argumento depois de '--' (opcional)."""
    return sys.argv[sys.argv.index('--') + 1] if '--' in sys.argv and len(sys.argv) > sys.argv.index('--') + 1 else None
