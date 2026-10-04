from pathlib import Path
from difflib import SequenceMatcher
from urllib.parse import quote
import json,re
root=Path(__file__).resolve().parents[1]
songs=root/'songs';songs.mkdir(exist_ok=True)
audio={'.mp3','.wav','.ogg','.m4a','.aac','.flac','.opus','.webm'}
images={'.png','.jpg','.jpeg','.webp','.gif'}
def clean(s):return re.sub(r'[^a-z0-9]','',s.lower())
def url(p):return '/'+quote(p.relative_to(root).as_posix(),safe='/')
tracks=[]
metadata={}
def album_notes(folder):
 if folder in metadata:return metadata[folder]
 note=folder/'notes.json'
 try:
  data=json.loads(note.read_text()) if note.exists() else {}
  if not isinstance(data,dict):data={}
 except (ValueError,OSError) as error:
  print(f'Could not read {note}: {error}; using filenames instead')
  data={}
 metadata[folder]=data
 return data
for p in sorted(songs.rglob('*')):
 if not p.is_file() or p.suffix.lower() not in audio:continue
 pics=sorted(x for x in p.parent.iterdir() if x.is_file() and x.suffix.lower() in images)
 exact=next((x for x in pics if clean(x.stem)==clean(p.stem)),None)
 ranked=sorted(pics,key=lambda x:SequenceMatcher(None,clean(p.stem),clean(x.stem)).ratio(),reverse=True)
 similar=ranked[0] if ranked and SequenceMatcher(None,clean(p.stem),clean(ranked[0].stem)).ratio()>=.55 else None
 common=next((x for x in pics if clean(x.stem) in {'cover','folder','artwork','album','albumcover'}),None)
 note=album_notes(p.parent)
 # One album image serves all numbered tracks; allow any single artwork filename.
 cover=common or exact or similar or (pics[0] if len(pics)==1 else None)
 titles=note.get('tracks',{})
 title=titles.get(p.stem) if isinstance(titles,dict) else None
 if title is None and p.stem.isdigit() and isinstance(titles,dict):title=titles.get(str(int(p.stem)))
 title=title if isinstance(title,str) and title.strip() else p.stem
 album=note.get('album') or (p.parent.name if p.parent!=songs else 'Singles')
 artist=note.get('artist') or ''
 tracks.append({'title':title,'artist':artist,'album':album,'src':url(p),'cover':url(cover) if cover else None})
(songs/'playlist.json').write_text(json.dumps({'tracks':tracks},indent=2,ensure_ascii=False)+'\n')
print(f'Indexed {len(tracks)} songs')
