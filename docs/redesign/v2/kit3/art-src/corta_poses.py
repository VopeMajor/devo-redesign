# Corta uma folha de poses sobre fundo verde em figuras "meio pixel" separadas.
# Separa cada figura pelas colunas vazias (não por fatias iguais), para nenhum pedaço da vizinha entrar.
# Uso: python corta_poses.py folha.png altura saida-{}.png [--magenta] [--linhas N] [--ref nome] nome1 nome2 ...
# Fundo magenta: --magenta antes de tudo. Folha em grade: --linhas N antes dos nomes (os nomes seguem linha por linha, da esquerda para a direita).
import sys, numpy as np
from PIL import Image
src,h,dst,nomes=sys.argv[1],int(sys.argv[2]),sys.argv[3],sys.argv[4:]
linhas=1;magenta=False
if nomes[0]=='--magenta':magenta=True;nomes=nomes[1:]  # folha em fundo magenta (personagem de roupa verde, como a Coruja)
if nomes[0]=='--linhas':linhas=int(nomes[1]);nomes=nomes[2:]
ref=None  # --ref nome: a escala da folha inteira sai dessa pose em pé; as curvadas não ficam ampliadas
if nomes[0]=='--ref':ref=nomes[1];nomes=nomes[2:]
a=np.asarray(Image.open(src).convert('RGB')).astype(float);r,g,b=a[...,0],a[...,1],a[...,2]
if magenta:
    al=np.clip(1-((np.minimum(r,b)-g)-25)/50,0,1)
    sobra=np.clip(np.minimum(r,b)-g-8,0,None)  # tira o rosa que vaza nas bordas claras
    rgb=np.dstack([r-sobra,g,b-sobra])
else:
    al=np.clip(1-((g-np.maximum(r,b))-25)/50,0,1)
    rgb=np.dstack([r,np.minimum(g,np.maximum(r,b)+8),b])
img=np.dstack([rgb,al*255]).astype(np.uint8)
def faixas(cheio,n):
    seg=[];x=0;W=len(cheio)
    while x<W:
        if cheio[x]:
            s=x
            while x<W and cheio[x]:x+=1
            seg.append([s,x])
        else:x+=1
    # junta pedaços separados por vãos pequenos até sobrarem n
    while len(seg)>n:
        i=min(range(len(seg)-1),key=lambda i:seg[i+1][0]-seg[i][1]);seg[i:i+2]=[[seg[i][0],seg[i+1][1]]]
    assert len(seg)==n,(len(seg),seg)
    return seg
por=len(nomes)//linhas;cortes=[]
for (y0,y1) in faixas((al>.5).sum(1)>2,linhas):
    for (s,e) in faixas((al[y0:y1]>.5).sum(0)>2,por):cortes.append((y0,y1,s,e))
def recorta(y0,y1,s,e):
    im=Image.fromarray(img[y0:y1,s:e],'RGBA');return im.crop(im.getchannel('A').point(lambda v:255 if v>60 else 0).getbbox())
fator=None
if ref:
    k=nomes.index(ref);fator=h/recorta(*cortes[k]).height
for (y0,y1,s,e),nm in zip(cortes,nomes):
    im=recorta(y0,y1,s,e)
    im=im.resize((round(im.width*h/im.height),h) if not fator else (round(im.width*fator),round(im.height*fator)),Image.LANCZOS)
    alfa=im.getchannel('A').point(lambda v:255 if v>110 else 0)
    # a paleta curta sai só dos pixels visíveis (o fundo verde não ocupa cor) e por octree, que não deixa a roupa
    # escura, por ser maioria, engolir os tons de pele
    rgb=im.convert('RGB');rgb.paste((0,0,0),mask=alfa.point(lambda v:255-v))
    q=rgb.quantize(96,method=Image.FASTOCTREE,dither=Image.NONE).convert('RGBA');q.putalpha(alfa)
    q.save(dst.format(nm),optimize=True);print(nm,q.size,(y0,y1,s,e))
