#!/usr/bin/env python3
"""Consulta RSS no GitHub Actions, publica apenas títulos e links públicos."""
import datetime as dt, html, json, pathlib, re, urllib.parse, urllib.request, xml.etree.ElementTree as ET
ROOT=pathlib.Path(__file__).resolve().parents[1]
OUT=ROOT/'data'/'noticias.json'
TOPICS={
 'brasil':'Brasil',
 'tecnologia':'tecnologia',
 'mundo':'mundo',
 'economia':'economia',
 'esportes':'esportes',
 'games':'videogames OR "video game" OR "jogos eletrônicos" OR PlayStation OR Xbox OR Nintendo',
 'ciencia':'ciência pesquisas descobertas',
 'saude':'saúde medicina',
 'entretenimento':'cinema OR séries OR música',
 'politica':'política brasileira',
 'ia':'"inteligência artificial" OR OpenAI OR ChatGPT',
}
def get(url):
 req=urllib.request.Request(url,headers={'User-Agent':'Mozilla/5.0 (compatible; HIDRA-News/1.0)','Accept':'application/rss+xml,application/xml,text/xml,*/*'})
 with urllib.request.urlopen(req,timeout=22) as r:return r.read(2_000_000)
def parse(raw,source):
 root=ET.fromstring(raw);out=[];seen=set()
 for item in root.findall('.//item'):
  title=html.unescape(re.sub(r'<[^>]*>','',item.findtext('title') or '')).strip()
  url=(item.findtext('link') or '').strip()
  if not url.startswith('https://') or not title or url in seen:continue
  seen.add(url);out.append({'title':title[:240],'url':url,'source':source,'date':(item.findtext('pubDate') or '')[:80]})
 return out
def main():
 existing={}
 if OUT.exists():
  try:existing=json.loads(OUT.read_text(encoding='utf8')).get('categories',{})
  except (OSError,ValueError):pass
 categories={};success=0
 for key,query in TOPICS.items():
  feeds=[('Google Notícias','https://news.google.com/rss/search?q='+urllib.parse.quote(query+' when:2d')+'&hl=pt-BR&gl=BR&ceid=BR:pt-419'),('Bing Notícias','https://www.bing.com/news/search?q='+urllib.parse.quote(query)+'&format=rss&setmkt=pt-BR')]
  items=[];seen=set()
  for source,url in feeds:
   try:
    for article in parse(get(url),source):
     if article['url'] not in seen:seen.add(article['url']);items.append(article)
   except Exception as exc:print(key,source,'indisponível:',str(exc)[:200])
  if items:success+=1;categories[key]=items[:30]
  else:categories[key]=existing.get(key,[])[:30]
  print(key,len(categories[key]))
 if not success:
  print('Nenhuma fonte respondeu; mantendo arquivo anterior sem mudar data.')
  if OUT.exists():return
  raise SystemExit('Não foi possível criar a base inicial de notícias')
 OUT.parent.mkdir(parents=True,exist_ok=True)
 OUT.write_text(json.dumps({'updated_at':dt.datetime.now(dt.timezone.utc).isoformat(),'categories':categories},ensure_ascii=False,indent=2)+'\n',encoding='utf8')
if __name__=='__main__':main()
