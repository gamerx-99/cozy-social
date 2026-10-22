"""Inspect alpha bounds inside known atlas cells; writes metadata, never alters images."""
from PIL import Image
import json
from pathlib import Path
root=Path(__file__).resolve().parents[1]
cuts=[([300,535,775,1010,1240],[0,184,350,514,680,851,1024]),([170,390,630,880,1130],[0,223,431,635,835,1047,1246]),([170,420,660,910,1150],[0,243,451,655,845,1022,1214]),([140,370,640,880,1140],[0,215,418,626,828,1040,1247])]
def rects(path,xs,ys):
 im=Image.open(path)
 out=[]
 for y0,y1 in zip(ys,ys[1:]):
  for x0,x1 in zip(xs,xs[1:]):
   alpha=im.getchannel('A').crop((x0,y0,x1,y1)).point(lambda a:255 if a>220 else 0)
   box=alpha.getbbox()
   if not box: raise ValueError('Empty atlas cell')
   l,t,r,b=box
   out.append([x0+l,y0+t,r-l,b-t])
 return out
result={'characters':[rects(root/f'public/art/character-{i}.png',*cut) for i,cut in enumerate(cuts)],'furniture':rects(root/'public/art/furniture-atlas.png',[0,560,1020,1536],[0,356,708,1024])}
extra=root/'public/art/furniture-cozy-expansion.png'
columns=[rects(extra,[0,540],[0,365,670,1024]),rects(extra,[540,1024],[0,350,700,1024]),rects(extra,[1024,1536],[0,355,695,1024])]
result['furnitureExtra']=[columns[col][row] for row in range(3) for col in range(3)]
(root/'src/art-manifest.json').write_text(json.dumps(result,indent=2),encoding='utf-8')
print('Inspected 96 character frames and 18 furniture modules')
